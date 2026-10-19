/**
 * 会话日志直读兜底 —— 只用 node:fs / node:zlib，无外部依赖
 *
 * 用途：`sessionQuery.readSession()` 对个别超大会话会超时/抛错（实测 238 个里有 20~40 个），
 * 这些会话在统计里会变成 0（token 与时长同时缺失）。本模块直接从
 * `$DSH_HOME/sessions/<ws>/<id>/session[.v3].jsonl.zstd` 读取并折叠，作为**兜底**：
 * 官方 reader 成功时仍走官方路径（`inheritedEventCount` 是权威值），失败时才直读。
 *
 * 两个实现要点：
 *  1. **逐帧解码**：DSH 的日志是 append 出来的多帧 zstd 文件，Node 的
 *     `zstdDecompressSync` / 流式解码器都只解第一帧（实测 246 个文件全部只出 1 行），
 *     因此这里按 zstd 魔数切帧逐帧解压（假阳性由解压失败纠正）。
 *     已在本机 246 个日志上与 `zstdcat` 逐字节对账一致。
 *  2. **精确跳过继承前缀**：fork/续接会话的日志把父会话事件整段拷了进来，必须跳过
 *     否则会重复计数。跳过量按优先级取：
 *       a) 头里的 `seedLength`（v0 fork，seq 语义）→ 跳 `seq < seedLength` 的事件；
 *       b) 头里 `isSeeded: true` 时，最后一个 `session/end-seed {inherited:true}` 标记
 *          的 seq → 跳 `seq <= cut` 的事件；
 *       c) 兜底：跳所有 `time < createdAt` 的事件（没有标记的旧格式副本）。
 *
 * Node 版本要求：zstd 需要 Node ≥ 22.15/23.8（`zlib.zstdDecompressSync`）。
 * 老版本上本模块直接返回 null，统计退化为现状（少数会话读不出来）。
 *
 * @module @dshp/token-meter/stats/logread
 */
import { closeSync, fstatSync, openSync, readFileSync, readSync } from 'node:fs';
import zlib from 'node:zlib';

/** zstd 帧魔数 0x28 B5 2F FD */
const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);

interface ZlibLike {
  zstdDecompressSync?: (buf: Buffer) => Buffer;
}

/** 当前 Node 是否支持 zstd 解压（Node ≥ 22.15/23.8）。 */
export function hasZstd(): boolean {
  const z = zlib as unknown as ZlibLike;
  return typeof z.zstdDecompressSync === 'function';
}

/**
 * 逐帧解压（生成器）：Node 的 zstd 解码器不拼接多帧，这里按魔数切帧。
 *
 * 用生成器而不是"整份拼好再返回"是**内存考虑**：本机最大的会话日志压缩 28MB、
 * 解压后 71MB / 9.5 万条事件，`toString` + `split('\n')` 会在堆上同时留下
 * 大字符串与十万个子串（实测单次读 heap 峰值 +144MB）。逐帧交给调用方解析，
 * 峰值只跟"单帧 + 事件数组"有关。
 *
 * 尾部损坏时结束遍历（已解出的部分保留）。
 */
export interface ZstdFrame {
  /** 解压后的内容 */
  data: Buffer;
  /** 该帧在输入 buffer 中的结束偏移（= 下一帧起点） */
  end: number;
}

export function* zstdFrames(buf: Buffer): Generator<ZstdFrame> {
  const z = zlib as unknown as ZlibLike;
  const inflate = z.zstdDecompressSync;
  if (typeof inflate !== 'function') throw new Error('zstd unsupported');
  let offset = 0;
  let frames = 0;
  while (offset < buf.length && frames < 200_000) {
    frames++;
    let cut = buf.indexOf(ZSTD_MAGIC, offset + 4);
    for (;;) {
      const end = cut < 0 ? buf.length : cut;
      try {
        const data = inflate.call(zlib, buf.subarray(offset, end));
        offset = end;
        yield { data, end };
        break;
      } catch {
        // 这个魔数是压缩数据里的假阳性：跳过它继续找下一个真帧边界
        if (cut < 0) return;
        cut = buf.indexOf(ZSTD_MAGIC, cut + 4);
      }
    }
  }
}

/** 整份解压（调试/测试用；生产路径请用 {@link zstdFrames} 逐帧解析）。 */
export function zstdDecodeAll(buf: Buffer): Buffer {
  return Buffer.concat([...zstdFrames(buf)].map((f) => f.data));
}

/** 直读结果：事件数组 + 说明来源 */
export interface DirectLog {
  /** **只包含该会话自己的事件**（继承前缀已在内部切掉） */
  events: unknown[];
  /** 切掉的继承前缀条数（= 原数组前缀长度） */
  skip: number;
  /** 切分依据 */
  via: 'createdAt' | 'marker' | 'none';
  /** 已消费到的字节偏移（整份读完 = 文件大小；供增量流从这里续读） */
  offset: number;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/**
 * 直接读取一个日志文件并解析成事件数组，**切掉 fork/续接的继承前缀**。
 *
 * 切分用「位置」而不是「计数」：日志里继承段永远是数组的**连续前缀**，所以找
 * 「第一个 time ≥ createdAt 的下标」再取后缀即可。注意不能按 `seedLength` 计数过滤 ——
 * `seedLength` 是父会话 seq 空间的长度（例：父 20627，子文件事件只有 14875 条，
 * 且其中 686 条没有 seq 字段），按计数跳会漏跳。
 *
 * @returns null 表示不可用（Node 无 zstd / 文件读不了 / 解析不出事件）
 */
/** 增量读取结果 */
export interface TailResult {
  /** 已消费到的字节偏移（调用方下次从这里继续） */
  offset: number;
  /** true = 文件被重写/截断/起点不是帧边界 → 调用方必须整份重读 */
  reset: boolean;
}

/**
 * **增量读取**：从 `from` 字节开始只读文件新增的部分，逐帧解压并把每个事件回调出去。
 *
 * 这是"最小化重算"的关键：会话日志是 append-only 的多帧 zstd 文件，
 * 会话在增长时（本机最大会话已 9.5 万条事件、10 个月后可能 95 万）
 * 只要读新增的那几帧即可，不必把整份日志重新解压、重新 JSON.parse。
 *
 * 只在**帧边界**推进 offset：写入中的截断尾帧不会被消费，留到下次。
 * 起点不是帧魔数或文件变短 → `reset: true`，调用方整份重读。
 *
 * @param onEvent 每解析出一个事件回调一次（事件对象不驻留 → 内存 O(新增量)）
 */
export function consumeLogTail(
  file: string,
  from: number,
  onEvent: (ev: unknown) => void,
): TailResult | null {
  if (!hasZstd()) return null;
  let fd: number | null = null;
  try {
    fd = openSync(file, 'r');
    const size = fstatSync(fd).size;
    if (from > size) return { offset: 0, reset: true };
    if (from === size) return { offset: from, reset: false };
    if (from > 0) {
      const probe = Buffer.alloc(4);
      const got = readSync(fd, probe, 0, 4, from);
      if (got < 4 || !probe.equals(ZSTD_MAGIC)) return { offset: 0, reset: true };
    }
    const len = size - from;
    const buf = Buffer.alloc(len);
    const read = readSync(fd, buf, 0, len, from);
    let offset = from;
    let carry = '';
    for (const frame of zstdFrames(buf.subarray(0, read))) {
      const text = carry + frame.data.toString('utf8');
      let start = 0;
      for (;;) {
        const nl = text.indexOf('\n', start);
        if (nl < 0) break;
        if (nl > start) {
          try {
            onEvent(JSON.parse(text.slice(start, nl)));
          } catch {
            /* 单行坏了不影响其余 */
          }
        }
        start = nl + 1;
      }
      carry = text.slice(start);
      offset = from + frame.end;
    }
    // 末尾没有换行的残行：写入方按整行 append，正常情况下这里为空
    if (carry.length > 0) {
      try {
        onEvent(JSON.parse(carry));
      } catch {
        /* 写入中的半行，等下次刷新 */
      }
    }
    return { offset, reset: false };
  } catch {
    return null;
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}

export function readLogDirect(file: string): DirectLog | null {
  if (!hasZstd()) return null;
  const events: unknown[] = [];
  let consumed = 0;
  try {
    let carry = '';
    for (const frame of zstdFrames(readFileSync(file))) {
      consumed = frame.end;
      // 帧边界一般落在整行上，但残行用 carry 接续，避免把一条记录切坏
      const text = carry + frame.data.toString('utf8');
      let start = 0;
      for (;;) {
        const nl = text.indexOf('\n', start);
        if (nl < 0) break;
        if (nl > start) {
          try {
            events.push(JSON.parse(text.slice(start, nl)));
          } catch {
            /* 单行坏了不影响其余 */
          }
        }
        start = nl + 1;
      }
      carry = text.slice(start);
    }
    if (carry.length > 0) {
      try {
        events.push(JSON.parse(carry));
      } catch {
        /* 末尾残行坏了忽略 */
      }
    }
  } catch {
    return null;
  }
  if (events.length === 0) return null;

  const header = asRecord(events[0]);
  if (header === null) return null;
  const createdAtRaw = header['createdAt'];
  const createdAt = typeof createdAtRaw === 'number' && Number.isFinite(createdAtRaw) ? createdAtRaw : 0;

  // 1) v3 种子会话带 inherited 标记 → 以最后一个标记为界（最精确）
  let cut = -1;
  let via: DirectLog['via'] = 'marker';
  for (let i = 0; i < events.length; i++) {
    const rec = asRecord(events[i]);
    if (rec === null || rec['type'] !== 'session/end-seed') continue;
    const data = asRecord(rec['data']);
    if (data !== null && data['inherited'] === true) cut = i;
  }

  // 2) 无标记（v0 fork 走这条）：继承段是连续前缀，切到「第一个 time ≥ createdAt」之前
  if (cut < 0 && createdAt > 0) {
    via = 'createdAt';
    cut = events.length - 1; // 默认整份都是继承（后面找到边界再改）
    for (let i = 0; i < events.length; i++) {
      const rec = asRecord(events[i]);
      const t = rec ? rec['time'] : undefined;
      if (typeof t === 'number' && t >= createdAt) {
        cut = i - 1;
        break;
      }
    }
  }

  const kept = cut + 1;
  if (kept <= 0) return { events: [], skip: events.length, via, offset: consumed };
  if (kept >= events.length) return { events, skip: 0, via: 'none', offset: consumed };
  return { events: events.slice(kept), skip: kept, via, offset: consumed };
}
