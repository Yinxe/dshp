/**
 * 统计引擎：会话列表 → 指纹缓存（storageDomain 持久化）→ 后台分批渐进扫描 → 合并快照
 *
 * 原实现：dsh-token-stats/lib/engine.js（逻辑逐行对齐，仅两处适配）：
 *  1. 去掉 `zod` / `@deepseek-ai/dsh-storage-domain` 运行时导入（运行时零依赖红线）：
 *     本文件自带最小 `defineDomain` / `domainTable` 垫片（仅校验名/版本/表名，
 *     形状与官方一致）+ 手写 `parseCachedSession`（等价 zod schema 的 parse 语义，
 *     非法即抛 invalid-record，触发同样的降级路径）。缓存域名保持 `token_stats`
 *     （改名会废掉已有缓存触发全量重扫），不随新 NS 改名。
 *  2. 加 TS 类型；其余后台泵/指纹/合并/降级策略与原版 100% 对齐。
 *
 * 两级性能：
 *  1. 持久化聚合缓存（$DSH_HOME/storages/token_stats.json）——每会话聚合结果按
 *     「日志文件 size+mtime 指纹」缓存；重启后指纹命中零重算。活跃（live）会话
 *     不走指纹快路径——事件监听负责失效，永远实时。
 *  2. 后台异步分批扫描——每批 8 个会话，批间 setImmediate 让出事件循环；
 *     快照返回渐进状态（scanned/total），页面轮询逐步补全。
 */
import { join } from 'node:path';
import { compactAgg, foldSession, reviveAgg } from './fold.js';
import type { CompactAgg, FoldBucket, FoldPeak } from './fold.js';
import { buildFileIndex, fileFingerprint } from './fsindex.js';
import { readLogDirect } from './logread.js';
import { extendStream, openStream } from './stream.js';
import type { SessionStream } from './stream.js';
import { buildOnline, normGapMin } from './online.js';
import type { Interval } from './online.js';
import { withTimeout } from './async.js';
import type { AnyCtx, StatsRecord, StatsSnapshot } from '../types.js';

/**
 * 后台每批扫描的会话数。
 *
 * 取值是**内存**约束而非吞吐：直读一个大会话时，解析后的事件数组会驻留
 * （本机最大的会话 9.5 万条事件 ≈ 140MB heap），批内并发越高峰值越高。
 * 3 路并发下最坏峰值约 200MB，冷启动全量仍只要十几秒。
 */
const BATCH_SIZE = 3;
/** 单会话读取失败的最大重试次数，超过则跳过并计入 errors。 */
const MAX_ATTEMPTS = 3;
/** 单会话读取基础超时（防个别会话卡住钉死后台泵 → partial 永真 → 前端空转）。 */
const READ_TIMEOUT_MS = 20000;
/** 每次重试追加的超时（大日志首读常因冷缓存超时，退避重试比直接放弃更省事）。 */
const READ_TIMEOUT_STEP_MS = 15000;
/** 单会话读取超时上限。 */
const READ_TIMEOUT_MAX_MS = 90000;

/**
 * 聚合缓存记录版本：改动 FoldResult 形状（如新增活动区间）时必须递增，
 * 旧行因版本不匹配触发一次全量重扫（缓存是纯派生数据，重扫无损）。
 */
const CACHE_V = 4;

// ── domain 垫片（零依赖版 defineDomain/domainTable，形状与官方一致）────────
// 官方实现见 @deepseek-ai/dsh-storage-domain：defineDomain 仅校验名/版本/表名，
// domainTable 仅包一层 { valueSchema }；运行时校验走 valueSchema.parse(raw)。
// 这里用手写 parse 代替 zod schema，语义等价（非法即抛，触发 invalid-record 降级）。

const UNIT_NAME_RE = /^[a-z][a-z0-9_]*$/;

interface ValueSchema {
  parse: (raw: unknown) => CachedSession;
}

function domainTable(schema: ValueSchema): { valueSchema: ValueSchema } {
  return { valueSchema: schema };
}

function defineDomain<T extends { name: string; version: number; tables: Record<string, unknown> }>(
  spec: T,
): T {
  if (!UNIT_NAME_RE.test(spec.name))
    throw new Error(`domain name '${spec.name}' must match ${String(UNIT_NAME_RE)}`);
  if (!Number.isInteger(spec.version) || spec.version < 0)
    throw new Error(`domain '${spec.name}' version must be a non-negative integer, got ${spec.version}`);
  for (const table of Object.keys(spec.tables))
    if (!UNIT_NAME_RE.test(table))
      throw new Error(`domain '${spec.name}' table name '${table}' must match ${String(UNIT_NAME_RE)}`);
  return spec;
}

// ── 缓存记录校验（等价原 zod cachedSessionSchema 的 parse 语义）────────────

interface CachedSession extends CompactAgg {
  fp: string;
  skip: number;
  v?: number;
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
}

/** 可选的每日引擎时长数组（[day, llmMs, toolMs]）；非法即抛，触发 invalid-record 降级。 */
function parseDayMs(raw: unknown): Array<[string, number, number]> | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) throw new Error('invalid-record: dm');
  const out: Array<[string, number, number]> = [];
  for (const row of raw as unknown[]) {
    if (!Array.isArray(row) || row.length < 3) throw new Error('invalid-record: dm row');
    const d = row[0];
    const l = row[1];
    const t = row[2];
    if (typeof d !== 'string' || !isNonNegInt(l) || !isNonNegInt(t))
      throw new Error('invalid-record: dm value');
    out.push([d, l, t]);
  }
  return out;
}

/** 可选的扁平区间数组（[s0,e0,…]）；非法值一律当空数组（宁可重扫也不信脏数据）。 */
function parseFlatIntervals(raw: unknown): number[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) throw new Error('invalid-record: intervals');
  for (const n of raw)
    if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error('invalid-record: interval value');
  return raw as number[];
}

function parseBucket(raw: unknown): FoldBucket {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid bucket');
  const r = raw as Record<string, unknown>;
  if (typeof r['d'] !== 'string' || (r['d'] as string).length < 1) throw new Error('invalid bucket.d');
  if (typeof r['m'] !== 'string' || (r['m'] as string).length < 1) throw new Error('invalid bucket.m');
  if (!isNonNegInt(r['h'])) throw new Error('invalid bucket.h');
  for (const k of ['i', 'o', 'cr', 'cw', 'n'] as const) {
    if (!isNonNegInt(r[k])) throw new Error('invalid bucket.' + k);
  }
  return {
    d: r['d'] as string,
    h: r['h'] as number,
    m: r['m'] as string,
    i: r['i'] as number,
    o: r['o'] as number,
    cr: r['cr'] as number,
    cw: r['cw'] as number,
    n: r['n'] as number,
  };
}

const cachedSessionSchema: ValueSchema = {
  parse(raw: unknown): CachedSession {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('invalid-record: not object');
    const r = raw as Record<string, unknown>;
    if (typeof r['fp'] !== 'string' || (r['fp'] as string).length < 1) throw new Error('invalid-record: fp');
    if (!isNonNegInt(r['skip'])) throw new Error('invalid-record: skip');
    if (r['v'] !== undefined && !(typeof r['v'] === 'number' && Number.isInteger(r['v'] as number)))
      throw new Error('invalid-record: v');
    if (!Array.isArray(r['r'])) throw new Error('invalid-record: r');
    const buckets: Array<[string, FoldBucket]> = [];
    for (const entry of r['r'] as unknown[]) {
      if (!Array.isArray(entry) || entry.length !== 2) throw new Error('invalid-record: r entry');
      const k = entry[0];
      if (typeof k !== 'string' || k.length < 1) throw new Error('invalid-record: r key');
      buckets.push([k, parseBucket(entry[1])]);
    }
    let p: FoldPeak | null = null;
    if (r['p'] !== null && r['p'] !== undefined) {
      const pr = r['p'] as Record<string, unknown>;
      if (typeof pr !== 'object' || Array.isArray(pr)) throw new Error('invalid-record: p');
      if (!isNonNegInt(pr['tokens'])) throw new Error('invalid-record: p.tokens');
      if (typeof pr['d'] !== 'string' || (pr['d'] as string).length < 1)
        throw new Error('invalid-record: p.d');
      if (typeof pr['model'] !== 'string' || (pr['model'] as string).length < 1)
        throw new Error('invalid-record: p.model');
      p = { tokens: pr['tokens'] as number, d: pr['d'] as string, model: pr['model'] as string };
    }
    const f = r['f'] as unknown;
    const l = r['l'] as unknown;
    if (f !== null && typeof f !== 'string') throw new Error('invalid-record: f');
    if (l !== null && typeof l !== 'string') throw new Error('invalid-record: l');
    if (typeof r['u'] !== 'boolean') throw new Error('invalid-record: u');
    const on = parseFlatIntervals(r['on']);
    const tn = parseFlatIntervals(r['tn']);
    const dm = parseDayMs(r['dm']);
    const oc = r['oc'];
    return {
      fp: r['fp'] as string,
      skip: r['skip'] as number,
      ...(r['v'] !== undefined ? { v: r['v'] as number } : {}),
      r: buckets,
      p,
      f: (f as string | null) ?? null,
      l: (l as string | null) ?? null,
      u: r['u'] as boolean,
      ...(on !== undefined ? { on } : {}),
      ...(tn !== undefined ? { tn } : {}),
      ...(dm !== undefined ? { dm } : {}),
      ...(typeof oc === 'string' ? { oc } : {}),
    };
  },
};

/** token-stats 持久化缓存域：sessions 表，key = sessionId（域名保持不变）。 */
export const tokenStatsDomainSpec = defineDomain({
  name: 'token_stats',
  version: 0,
  tables: { sessions: domainTable(cachedSessionSchema) },
});

/**
 * readSession 快照 → 可信的种子跳过数。
 */
function clampSkip(inheritedEventCount: unknown, events: unknown): number {
  const n = typeof inheritedEventCount === 'number' ? Math.floor(inheritedEventCount) : NaN;
  if (!Number.isSafeInteger(n) || n < 0) return 0;
  const len = Array.isArray(events) ? events.length : 0;
  return n > len ? len : n;
}

export interface SessionQueryLike {
  listSessions: () => Promise<Array<{ header?: unknown; live?: unknown }>>;
  readSession: (
    id: string,
  ) => Promise<{ inheritedEventCount?: unknown; events?: unknown[] } & Record<string, unknown>>;
}

export interface Engine {
  invalidate: (sessionId: string) => void;
  snapshot: () => Promise<StatsSnapshot>;
  start: () => void;
  drain: () => Promise<void>;
  dispose: () => Promise<void>;
  /** 清空派生缓存（持久化行 + 进程内状态）→ 下一次快照全量重扫；返回删掉的行数 */
  clearCache: () => Promise<number>;
}

/**
 * 创建统计引擎。
 * @param getGapMin 读取当前配置的在线时长阈值（分钟）；缺省 5 分钟
 */
export function createEngine(
  sessionQuery: SessionQueryLike,
  dshHome: string,
  storageDomain: AnyCtx | null,
  getGapMin?: () => number,
): Engine {
  const sessionsDir = join(dshHome, 'sessions');

  const aggMemo = new Map<string, ReturnType<typeof foldSession>>();
  const fpMemo = new Map<string, string>();
  const dirty = new Set<string>();
  const attempts = new Map<string, number>();
  const errored = new Set<string>();
  /** 官方 reader 读不动的会话：后续快照直接走直读兜底，避免反复超时 */
  const directIds = new Set<string>();
  /** 最近几次失败原因（诊断用，快照里带出去） */
  const errorSamples = new Map<string, string>();
  /** 靠「直读日志」拿到的会话集合（按会话去重，重扫不重复计） */
  const directSessions = new Set<string>();
  /** 会话级增量流：日志增长时只读新增帧（见 stats/stream.ts） */
  const streams = new Map<string, SessionStream>();
  let queue: Array<{ id: string; mtime: number; live: boolean }> = [];
  let pumping = false;
  let listedIds = new Set<string>();
  let currentIndex = buildFileIndex(sessionsDir);

  let storageOk = true;
  let storageWarned = false;
  const noteStorageError = (label: string, error: unknown): void => {
    storageOk = false;
    const msg = label + ': ' + String((error as Error)?.message ?? error);
    void msg;
    if (!storageWarned) {
      storageWarned = true;
      try {
        console.warn(
          '[dshp-token-meter] storage domain ' + msg + ' — 缓存持久化不可用，统计仍正常运行（仅重启后重扫）',
        );
      } catch {
        /* ignore */
      }
    }
  };

  /** 空表桩：降级模式下的 no-op 写入面。 */
  const nullTable = {
    get: (_k: string): undefined => undefined,
    put: async (_k: string, _v: unknown): Promise<void> => {},
  };

  let openAttempt = 0;
  const openDomain = (): Promise<{ table: AnyCtx; close: () => Promise<void>; degraded?: boolean }> => {
    if (!storageDomain || typeof storageDomain.open !== 'function') {
      noteStorageError('open failed', new Error('storageDomain 服务不可用'));
      return Promise.resolve({ table: nullTable, close: async () => {}, degraded: true });
    }
    return storageDomain
      .open(tokenStatsDomainSpec)
      .then((domain: AnyCtx) => {
        storageOk = true;
        storageWarned = false;
        return { table: domain.table('sessions'), close: () => domain.close() };
      })
      .catch((error: unknown) => {
        noteStorageError('open failed', error);
        return { table: nullTable, close: async () => {}, degraded: true };
      });
  };

  let tableReady = openDomain();

  /** 事件失效：只标记，下次 snapshot 处理。 */
  function invalidate(sessionId: string): void {
    if (typeof sessionId === 'string') {
      dirty.add(sessionId);
      errored.delete(sessionId);
      attempts.delete(sessionId);
    }
  }

  /**
   * 直读兜底：官方 reader 超时/抛错时直接从日志文件整份读（多帧 zstd + 切掉继承前缀）。
   * 正常路径走 `openStream`/`extendStream` 的增量流，这里只处理"流建不起来"的边角。
   * @returns 折叠结果；不可用时 null
   */
  function readViaFallback(id: string): ReturnType<typeof foldSession> | null {
    const entry = currentIndex.get(id);
    if (entry === undefined) return null;
    const direct = readLogDirect(entry.file);
    if (direct === null) return null;
    directSessions.add(id);
    return foldSession(direct.events as never[], 0);
  }

  /** 后台泵：分批扫描队列，批间让出事件循环。 */
  async function pump(): Promise<void> {
    if (pumping) return;
    pumping = true;
    try {
      while (queue.length > 0) {
        const batch = queue.splice(0, BATCH_SIZE);
        const tbl = await tableReady;
        await Promise.all(
          batch.map(async (job) => {
            // 大日志冷读经常超过基础超时：按尝试次数退避放宽，仍失败才计入 errors
            const attempt = (attempts.get(job.id) || 0) + 1;
            const timeoutMs = Math.min(
              READ_TIMEOUT_MAX_MS,
              READ_TIMEOUT_MS + (attempt - 1) * READ_TIMEOUT_STEP_MS,
            );
            try {
              // 读取策略（按代价从低到高，目的是**最小化重算**）：
              //  ① 该会话已有增量流且日志只是变长 → 只读新增的那几帧；
              //  ② 否则整份直读日志文件（多帧 zstd + 切掉 fork 继承前缀）并建立增量流；
              //  ③ 都没有（无日志文件 / 读不动）→ 官方 reader。
              // 日志会一直长（本机最大 9.5 万条事件），所以 ① 是常态，② 只在首读发生。
              const entry = currentIndex.get(job.id);
              let agg: ReturnType<typeof foldSession> | null = null;
              const stream = streams.get(job.id);
              if (entry !== undefined && stream !== undefined && stream.file === entry.file) {
                if (entry.size > stream.size && extendStream(stream, entry.size, entry.mtimeMs)) {
                  directSessions.add(job.id);
                  agg = stream.folder.finish();
                } else if (entry.size === stream.size) {
                  agg = stream.folder.finish(); // 没有新字节
                } else {
                  streams.delete(job.id); // 文件被重写 → 下一轮整份重建
                }
              }
              if (agg === null && entry !== undefined) {
                const opened = openStream(entry.file, entry.size, entry.mtimeMs);
                if (opened !== null) {
                  streams.set(job.id, opened);
                  directSessions.add(job.id);
                  agg = opened.folder.finish();
                }
              }
              let skip = 0;
              if (agg === null) {
                const snap = await withTimeout(
                  sessionQuery.readSession(job.id),
                  timeoutMs,
                  'readSession ' + job.id,
                );
                skip = clampSkip(
                  (snap as { inheritedEventCount?: unknown })?.inheritedEventCount,
                  (snap as { events?: unknown })?.events,
                );
                agg = foldSession(((snap as { events?: [] })?.events as []) || [], skip);
              }
              if (agg === null) throw new Error('log unavailable');
              aggMemo.set(job.id, agg);
              attempts.delete(job.id);
              errored.delete(job.id);
              dirty.delete(job.id);
              const fp = fileFingerprint(currentIndex, job.id);
              if (fp !== null) {
                fpMemo.set(job.id, fp);
                try {
                  await tbl.table.put(job.id, { fp, skip, v: CACHE_V, ...compactAgg(agg) });
                } catch (error) {
                  noteStorageError('put failed', error);
                }
              }
            } catch (error) {
              // reader 失败 → 先试直读兜底（Node ≥ 22.15 才有 zstd）
              const viaFallback = directIds.has(job.id) ? null : readViaFallback(job.id);
              if (viaFallback !== null) {
                aggMemo.set(job.id, viaFallback);
                attempts.delete(job.id);
                errored.delete(job.id);
                dirty.delete(job.id);
                directIds.add(job.id);
                const fp0 = fileFingerprint(currentIndex, job.id);
                if (fp0 !== null) {
                  fpMemo.set(job.id, fp0);
                  try {
                    const t0 = await tableReady;
                    await t0.table.put(job.id, { fp: fp0, skip: 0, v: CACHE_V, ...compactAgg(viaFallback) });
                  } catch (e2) {
                    noteStorageError('put failed', e2);
                  }
                }
                return;
              }
              if (errorSamples.size < 5)
                errorSamples.set(job.id, String((error as Error)?.message ?? error).slice(0, 120));
              attempts.set(job.id, attempt);
              if (attempt >= MAX_ATTEMPTS) {
                aggMemo.set(job.id, {
                  records: new Map(),
                  peak: null,
                  first: null,
                  last: null,
                  used: false,
                  active: [],
                  turns: [],
                  llmMs: 0,
                  toolMs: 0,
                  dayLlm: new Map(),
                  dayTool: new Map(),
                  outcome: 'unreadable',
                });
                errored.add(job.id);
              }
            }
          }),
        );
        if (queue.length > 0) await new Promise((resolve) => setImmediate(resolve));
      }
    } finally {
      pumping = false;
    }
  }

  /**
   * 汇总快照：列出全部会话 → 增量判定（指纹缓存/事件失效）→ 后台泵扫 →
   * 合并当前已物化结果。可随时调用，返回当前渐进状态。
   */
  async function snapshot(): Promise<StatsSnapshot> {
    await maybeReopenStorage();
    const list = await sessionQuery.listSessions();
    listedIds = new Set<string>();
    const jobs: Array<{ id: string; mtime: number; live: boolean }> = [];
    let scanned = 0;
    /** 本次快照命中**持久化缓存**的会话数（重启后才会发生） */
    let cacheHits = 0;
    /** 本次快照**完全没读日志**的会话数（持久化缓存 + 进程内复用） */
    let reused = 0;

    currentIndex = buildFileIndex(sessionsDir);

    for (const rec of list) {
      const header = (rec && (rec as { header?: unknown }).header) as
        Record<string, unknown> | null | undefined;
      if (header === null || typeof header !== 'object') continue;
      const id = (header as Record<string, unknown>)['id'];
      if (typeof id !== 'string') continue;
      listedIds.add(id);

      const live = (rec as { live?: unknown }).live === true;
      const isDirty = dirty.has(id);

      let need = false;
      const entry = currentIndex.get(id);
      const mtime = entry === undefined ? 0 : entry.mtimeMs;

      if (live) {
        need = isDirty || !aggMemo.has(id);
        if (!need) reused++;
      } else {
        const fp = fileFingerprint(currentIndex, id);
        if (isDirty || !aggMemo.has(id)) {
          let hit: CachedSession | undefined;
          try {
            hit = (await tableReady).table.get(id) as CachedSession | undefined;
          } catch {
            hit = undefined;
          }
          if (!isDirty && hit !== undefined && hit.fp === fp && hit.v === CACHE_V) {
            cacheHits++;
            reused++;
            aggMemo.set(id, reviveAgg(hit));
            if (fp !== null) fpMemo.set(id, fp);
            dirty.delete(id);
          } else {
            need = true;
          }
        } else if (fp !== null && fpMemo.get(id) !== fp) {
          need = true;
        } else {
          reused++; // 进程内已有聚合且日志没变 → 连缓存都不用查
        }
      }

      if (need && !errored.has(id)) {
        const job = { id, mtime, live };
        if (isDirty) job.mtime = Infinity;
        jobs.push(job);
      }
      if (aggMemo.has(id)) scanned++;
    }

    jobs.sort((a, b) => b.mtime - a.mtime);
    if (jobs.length > 0) {
      const queued = new Set(queue.map((j) => j.id));
      for (const j of jobs) {
        if (!queued.has(j.id)) {
          queued.add(j.id);
          queue.push(j);
        }
      }
      queue.sort((a, b) => b.mtime - a.mtime);
      void pump();
    }

    const merged = new Map<string, StatsRecord>();
    const models: Record<string, { provider: string; model: string }> = {};
    const daySessions: Record<string, number> = {};
    let peak: FoldPeak | null = null;
    let first: string | null = null;
    let last: string | null = null;
    let active = 0;
    // 在线时长原料：跨会话汇总的活动区间 / 对话进行中区间（并集在 buildOnline 内做）
    const activeIntervals: Interval[] = [];
    const turnIntervals: Interval[] = [];
    const dayTokens: Record<string, number> = {};
    const dayLlm: Record<string, number> = {};
    const dayTool: Record<string, number> = {};
    const sessionOutcomes: Record<string, number> = {};

    for (const id of listedIds) {
      const agg = aggMemo.get(id);
      if (agg === undefined) continue;
      if (agg.used) {
        active++;
        const days = new Set<string>();
        for (const r of agg.records.values()) days.add(r.d);
        for (const d of days) daySessions[d] = (daySessions[d] || 0) + 1;
      }
      for (const iv of agg.active) activeIntervals.push(iv);
      for (const iv of agg.turns) turnIntervals.push(iv);
      sessionOutcomes[agg.outcome] = (sessionOutcomes[agg.outcome] ?? 0) + 1;
      for (const [d, v] of agg.dayLlm) dayLlm[d] = (dayLlm[d] || 0) + v;
      for (const [d, v] of agg.dayTool) dayTool[d] = (dayTool[d] || 0) + v;
      for (const r of agg.records.values()) {
        const k = r.d + '|' + r.h + '|' + r.m;
        let m = merged.get(k);
        if (m === undefined) {
          m = { d: r.d, h: r.h, m: r.m, i: 0, o: 0, cr: 0, cw: 0, n: 0 };
          merged.set(k, m);
        }
        m.i += r.i;
        m.o += r.o;
        m.cr += r.cr;
        m.cw += r.cw;
        m.n += r.n;
        dayTokens[r.d] = (dayTokens[r.d] || 0) + r.i + r.o + r.cr + r.cw;
        if (models[r.m] === undefined) {
          const slash = r.m.indexOf('/');
          models[r.m] =
            slash > 0
              ? { provider: r.m.slice(0, slash), model: r.m.slice(slash + 1) }
              : { provider: 'unknown', model: r.m };
        }
      }
      if (agg.peak !== null && (peak === null || agg.peak.tokens > peak.tokens)) peak = agg.peak;
      if (agg.first !== null && (first === null || agg.first < first)) first = agg.first;
      if (agg.last !== null && (last === null || agg.last > last)) last = agg.last;
    }

    for (const id of aggMemo.keys()) {
      if (listedIds.has(id)) continue;
      aggMemo.delete(id);
      streams.delete(id);
      fpMemo.delete(id);
      attempts.delete(id);
      errored.delete(id);
      dirty.delete(id);
      try {
        const t = await tableReady;
        if (t.table !== nullTable && typeof t.table.delete === 'function') await t.table.delete(id);
      } catch {
        /* 缓存清理失败不影响统计 */
      }
    }

    const records = Array.from(merged.values());
    records.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.h - b.h));

    // 在线时长：阈值只影响快照阶段的合并，不影响缓存（见 online.ts 的两级合并）
    let gapMin = 5;
    try {
      gapMin = normGapMin(getGapMin ? getGapMin() : 5);
    } catch {
      gapMin = 5;
    }
    const online = buildOnline(
      activeIntervals,
      turnIntervals,
      { sessions: daySessions, tokens: dayTokens, llmMs: dayLlm, toolMs: dayTool },
      gapMin,
    );

    const total = listedIds.size;
    return {
      ready: true,
      records,
      models,
      daySessions,
      peakStep: peak,
      range: first === null ? null : { first, last: last as string },
      sessions: total,
      active,
      partial: total - scanned > 0,
      scanned,
      total,
      errors: errored.size,
      errorSamples: [...errorSamples.entries()].map(([id, message]) => ({ id, message })),
      sessionOutcomes,
      cacheHits,
      reused,
      directReads: directSessions.size,
      storage: storageOk ? 'ok' : 'disabled',
      generatedAt: Date.now(),
      online,
    };
  }

  /** 启动即开始后台扫描（不阻塞启动）。 */
  function start(): void {
    const t = setTimeout(() => {
      void snapshot().catch(() => {});
    }, 100);
    if (typeof (t as { unref?: () => void }).unref === 'function')
      (t as unknown as { unref: () => void }).unref();
  }

  /**
   * 清空派生缓存：把持久化行逐条删掉，并重置进程内状态（聚合、增量流、指纹、失败计数）。
   * 下次快照即全量重扫 —— 缓存是纯派生数据，删了只会慢一次，不会算错。
   * @returns 删掉的行数（存储不可用时为 0，进程内状态照样清）
   */
  async function clearCache(): Promise<number> {
    let removed = 0;
    try {
      const t = await tableReady;
      if (t.table !== nullTable && typeof t.table.keys === 'function') {
        const keys = [...(t.table.keys() as Iterable<string>)];
        for (const k of keys) {
          try {
            await t.table.delete(k);
            removed++;
          } catch (error) {
            noteStorageError('delete failed', error);
          }
        }
      }
    } catch (error) {
      noteStorageError('clear failed', error);
    }
    aggMemo.clear();
    streams.clear();
    fpMemo.clear();
    attempts.clear();
    errored.clear();
    dirty.clear();
    errorSamples.clear();
    directSessions.clear();
    queue = [];
    return removed;
  }

  /** 等待后台队列清空（测试用）。 */
  async function drain(): Promise<void> {
    for (;;) {
      if (!pumping && queue.length === 0) break;
      await new Promise((resolve) => setImmediate(resolve));
    }
    await tableReady;
    await new Promise((resolve) => setImmediate(resolve));
  }

  /** 插件卸载：关闭域。 */
  async function dispose(): Promise<void> {
    try {
      const t = await tableReady;
      await t.close();
    } catch {
      /* 域未开成功则无需关闭 */
    }
  }

  async function maybeReopenStorage(): Promise<void> {
    if (storageOk) return;
    openAttempt++;
    if (openAttempt % 5 !== 0) return;
    const prev = await tableReady;
    if ((prev as { degraded?: boolean }).degraded === true) tableReady = openDomain();
  }

  return { invalidate, snapshot, start, drain, dispose, clearCache };
}
