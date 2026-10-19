/**
 * 会话级**增量流**：让统计随会话日志增长只做增量重算
 *
 * 背景（为什么要这层）：
 *  - 会话日志是 append-only 的多帧 zstd 文件，会一直长：本机最大的会话已 9.5 万条事件
 *    （压缩 28MB / 解压 71MB），按当前用量推 10 个月后可能到 95 万条；
 *  - 早先每次刷新（live 会话每来一条事件、或日志 size/mtime 变化）都整份重读重折，
 *    代价随日志线性增长 —— 到 95 万条时每次刷新都会是秒级、且内存峰值上百 MB。
 *
 * 做法：
 *  - 每个会话维护一个 {@link SessionStream}：折叠器（`createFolder`）+ 已消费字节偏移；
 *  - 首读走整份读取（复用已验证过的 fork 前缀切分），但**流式**地把自己的事件喂进折叠器，
 *    不再把 9.5 万个事件对象同时留在内存里；
 *  - 之后日志变大时只 `consumeLogTail(file, offset)` 读新增的那几帧；
 *  - 文件被重写/截断（v0→v3 迁移等）时 `reset` → 丢弃流，下次整份重建。
 */
import { consumeLogTail, readLogDirect } from './logread.js';
import { createFolder } from './fold.js';
import type { Folder } from './fold.js';

/** 一个会话的增量折叠状态 */
export interface SessionStream {
  folder: Folder;
  file: string;
  /** 已消费到的文件字节偏移（下次从这里续读） */
  offset: number;
  /** 上次看到的文件大小/时间（用于判断是否增长） */
  size: number;
  mtimeMs: number;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** 是否是应被跳过的 fork 继承标记 */
function isInheritedMarker(rec: Record<string, unknown> | null): boolean {
  if (rec === null || rec['type'] !== 'session/end-seed') return false;
  const data = asRecord(rec['data']);
  return data !== null && data['inherited'] === true;
}

/**
 * 首次打开：整份流式读取，切掉 fork 继承前缀，建立增量状态。
 *
 * 切分规则与 `readLogDirect` 一致（继承段是连续前缀 → 跳过 `time < createdAt` 的事件；
 * 顺带丢掉 inherited 标记），但**不构造事件数组**：事件解析出来就喂给折叠器再丢。
 *
 * @returns null 表示不可用（Node 无 zstd / 文件读不了 / 没有事件）
 */
export function openStream(file: string, size: number, mtimeMs: number): SessionStream | null {
  const folder = createFolder(0);
  let createdAt = 0;
  let decided = false;
  let seen = 0;
  const res = consumeLogTail(file, 0, (ev) => {
    const rec = asRecord(ev);
    seen++;
    if (!decided) {
      if (createdAt === 0) {
        // 头事件：只取 createdAt，不喂给折叠器
        const c = rec ? rec['createdAt'] : undefined;
        createdAt = typeof c === 'number' && Number.isFinite(c) ? c : 0;
        return;
      }
      const t = rec ? rec['time'] : undefined;
      if (typeof t === 'number' && (createdAt === 0 || t >= createdAt)) decided = true;
      else return; // 继承前缀：丢弃
    }
    if (isInheritedMarker(rec)) return;
    folder.push(ev as never);
  });
  if (res === null || seen === 0) return null;
  return { folder, file, offset: res.offset, size, mtimeMs };
}

/**
 * 续读：只消费 `st.offset` 之后新增的帧。
 * @returns false 表示需要整份重建（文件被重写/截断/读不了）
 */
export function extendStream(st: SessionStream, size: number, mtimeMs: number): boolean {
  const res = consumeLogTail(st.file, st.offset, (ev) => st.folder.push(ev as never));
  if (res === null || res.reset) return false;
  st.offset = res.offset;
  st.size = size;
  st.mtimeMs = mtimeMs;
  return true;
}

/** 一次性整份读取（不带增量状态）—— 测试/对照用 */
export function readOnce(file: string): Folder | null {
  const direct = readLogDirect(file);
  if (direct === null) return null;
  const folder = createFolder(0);
  for (const ev of direct.events) folder.push(ev as never);
  return folder;
}
