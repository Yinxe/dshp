/**
 * 会话日志折叠聚合 —— 纯函数，无副作用，可独立单测
 *
 * 原实现：dsh-token-stats/lib/fold.js（逐行对齐，仅加 TS 类型）
 *
 * 聚合口径：
 *  - 单请求 Token = inputTokens + cacheReadTokens + cacheWriteTokens + outputTokens
 *    （reasoningTokens 已含在 outputTokens，不重复计）；
 *  - 同一 (turn, step) 的 usage chunk 为早期采样、assistant/message usage 为终值，
 *    后到者覆盖前者（flush 语义），不重复累计；
 *  - fork/resume 会话跳过其头 skipCount 条种子事件（父会话已计）；
 *  - 同时产出「活动区间」与「对话进行中区间」，供在线时长估算（见 online.ts）：
 *    事件时刻按 BASE_GAP_MS 压成区间，turn/start→turn/end 单独成段。两者都跳过
 *    继承前缀，且只做会话内合并 —— 跨会话并集在 engine 快照阶段完成。
 */
import { BASE_GAP_MS, dayKey, mergeIntervals, mergePoints } from './online.js';
import type { Interval } from './online.js';

export { dayKey } from './online.js';

export function modelKey(provider: unknown, model: unknown): string {
  return String(provider || 'unknown') + '/' + String(model || 'unknown');
}

const BUCKETS = ['i', 'o', 'cr', 'cw'] as const;
type Bucket = (typeof BUCKETS)[number];

export interface FoldBucket {
  d: string;
  h: number;
  m: string;
  i: number;
  o: number;
  cr: number;
  cw: number;
  n: number;
}

export interface FoldPeak {
  tokens: number;
  d: string;
  model: string;
}

export interface FoldResult {
  records: Map<string, FoldBucket>;
  peak: FoldPeak | null;
  first: string | null;
  last: string | null;
  used: boolean;
  /** 活动区间：本会话事件时刻按 BASE_GAP_MS 合并（已跳过继承前缀） */
  active: Interval[];
  /** 对话进行中区间：turn/start → turn/end（已跳过继承前缀） */
  turns: Interval[];
  /** 模型生成墙钟：Σ(step/start → assistant/message)，与 DSH 官方 sessionStats 投影同口径 */
  llmMs: number;
  /** 工具执行墙钟：Σ(tool/call → tool/result 按 callId 配对) */
  toolMs: number;
  /** 每日模型墙钟（本地日 → 毫秒） */
  dayLlm: Map<string, number>;
  /** 每日工具墙钟 */
  dayTool: Map<string, number>;
  /**
   * 会话结局分类（用于统计 UI 解释"有用量 / 无用量"）：
   *  usage=有用量；fork-empty=整份日志都是继承前缀；no-request=从没发起模型请求；
   *  failed=发起过请求但从没组装出 assistant/message；no-usage=有回复但供应商没上报 usage
   */
  outcome: SessionOutcome;
}

export type SessionOutcome = 'usage' | 'fork-empty' | 'no-request' | 'failed' | 'no-usage' | 'unreadable';

interface SessionEvent {
  seq?: unknown;
  type?: unknown;
  time?: unknown;
  data?: unknown;
}

interface UsageLike {
  inputTokens?: unknown;
  outputTokens?: unknown;
  cacheReadTokens?: unknown;
  cacheWriteTokens?: unknown;
}

/** 会话聚合结果：records 键为 `${day}|${hour}|${model}`。 */
function emptyResult(): FoldResult {
  return {
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
    outcome: 'no-request',
  };
}

function numOf(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** 增量折叠器（见 createFolder） */
export interface Folder {
  /** 送入一个事件（可反复调用，增量累加） */
  push(ev: SessionEvent): void;
  /** 收尾并返回聚合结果（幂等；返回的对象随后续 push 继续增长） */
  finish(): FoldResult;
  /** 当前聚合结果（不触发收尾） */
  result(): FoldResult;
  /** 已送入的事件数（含被 skip 的继承前缀） */
  count(): number;
}

/**
 * 创建一个**增量折叠器**：把事件一条条 push 进来即可，状态常驻，
 * 因此会话日志增长时只需把新增事件推进来，不必重扫整份日志。
 */
export function createFolder(skipCount: number): Folder {
  const state = emptyResult();
  let routeProvider = 'unknown';
  let routeModel = 'unknown';
  const route = (): string => routeProvider + '/' + routeModel;
  const setRoute = (p: unknown, m: unknown): void => {
    if (p !== undefined && p !== null && p !== '') routeProvider = String(p);
    if (m !== undefined && m !== null && m !== '') routeModel = String(m);
  };
  let pending: { key: string; usage: UsageLike; time: number; model: string } | null = null;

  const commit = (usage: UsageLike, time: number, model: string): void => {
    const vals: Record<Bucket, number> = {
      i: numOf((usage as Record<string, unknown>)['inputTokens']),
      o: numOf((usage as Record<string, unknown>)['outputTokens']),
      cr: numOf((usage as Record<string, unknown>)['cacheReadTokens']),
      cw: numOf((usage as Record<string, unknown>)['cacheWriteTokens']),
    };
    const tokens = vals.i + vals.o + vals.cr + vals.cw;
    if (tokens <= 0) return;
    state.used = true;
    const d = dayKey(time);
    const h = new Date(time).getHours();
    const k = d + '|' + h + '|' + model;
    let r = state.records.get(k);
    if (r === undefined) {
      r = { d, h, m: model, i: 0, o: 0, cr: 0, cw: 0, n: 0 };
      state.records.set(k, r);
    }
    for (const b of BUCKETS) r[b] += vals[b];
    r.n += 1;
    if (state.peak === null || tokens > state.peak.tokens) state.peak = { tokens, d, model };
    if (state.first === null || d < state.first) state.first = d;
    if (state.last === null || d > state.last) state.last = d;
  };

  const flush = (): void => {
    if (pending === null) return;
    commit(pending.usage, pending.time, pending.model);
    pending = null;
  };

  const limit = skipCount > 0 ? skipCount : 0;
  // 在线时长原料：所有事件时刻 + turn 边界（都只统计跳过继承前缀之后的部分）
  const times: number[] = [];
  const turns: Interval[] = [];
  let openTurn: number | null = null;
  // 引擎时长原料（与 DSH 官方 sessionStats 投影逐行同口径）：
  //  - llmMs：step/start → assistant/message（只有真正组装出消息的步骤才算，被取消的步骤不计）
  //  - toolMs：tool/call → tool/result 按 callId 配对
  let llmMs = 0;
  let toolMs = 0;
  let sawRequest = false;
  let sawMessage = false;
  let sawUsageMessage = false;
  let openStep: { turn: unknown; step: unknown; start: number } | null = null;
  const pendingCalls = new Map<string, number>();
  /** 已送入的事件数（含被继承前缀跳过的那部分，用于 outcome 判定） */
  let processed = 0;

  function push(ev: SessionEvent): void {
    if (processed++ < limit) return;
    const t = Number(ev && ev.time);
    const hasTime = Number.isFinite(t) && t > 0;
    if (hasTime) times.push(t);
    if (hasTime && ev.type === 'turn/start') {
      openTurn = t;
    } else if (hasTime && ev.type === 'turn/end') {
      if (openTurn !== null && t > openTurn) turns.push([openTurn, t]);
      openTurn = null;
      // 结果没落地的调用属于被取消/失败的轮次，丢弃以免污染 toolMs
      pendingCalls.clear();
    }
    const data = ev && (ev.data as Record<string, unknown> | null);
    if (data === null || typeof data !== 'object') return;

    switch (ev.type) {
      case 'step/start': {
        openStep = hasTime ? { turn: data['turn'], step: data['step'], start: t } : null;
        break;
      }
      case 'tool/call': {
        if (hasTime) {
          const callId = data['callId'];
          if (typeof callId === 'string') pendingCalls.set(callId, t);
        }
        break;
      }
      case 'tool/result': {
        if (!hasTime) break;
        const message = data['message'] as Record<string, unknown> | undefined;
        const source = message && (message['source'] as Record<string, unknown> | undefined);
        const callId = source ? source['callId'] : undefined;
        if (typeof callId !== 'string') break;
        const dispatched = pendingCalls.get(callId);
        if (dispatched === undefined) break;
        pendingCalls.delete(callId);
        const span = Math.max(0, t - dispatched);
        toolMs += span;
        const dk = dayKey(t);
        state.dayTool.set(dk, (state.dayTool.get(dk) ?? 0) + span);
        break;
      }
      case 'request/header': {
        sawRequest = true;
        const header = data['header'] as Record<string, unknown> | undefined;
        const cfg = header && (header['config'] as Record<string, unknown> | undefined);
        if (cfg) setRoute(cfg['provider'], cfg['model']);
        break;
      }
      case 'request/context': {
        sawRequest = true;
        setRoute(data['provider'], data['model']);
        break;
      }
      case 'assistant/chunk': {
        const chunk = data['chunk'] as Record<string, unknown> | null | undefined;
        if (chunk !== null && typeof chunk === 'object' && chunk['type'] === 'usage' && chunk['usage']) {
          const key = String(data['turn']) + ':' + String(data['step']);
          if (pending !== null && pending.key !== key) flush();
          pending = {
            key,
            usage: chunk['usage'] as UsageLike,
            time: Number(ev.time) || 0,
            model: route(),
          };
        }
        break;
      }
      case 'assistant/message': {
        sawMessage = true;
        if (data['usage']) sawUsageMessage = true;
        const key = String(data['turn']) + ':' + String(data['step']);
        const msg = data['message'] as Record<string, unknown> | undefined;
        const src = msg && (msg['source'] as Record<string, unknown> | undefined);
        const srcModel = src && src['kind'] === 'model' ? modelKey(src['provider'], src['model']) : null;
        // 该步骤的模型墙钟到此结束（只认组装出消息的步骤，与官方投影一致）
        if (
          openStep !== null &&
          openStep.turn === data['turn'] &&
          openStep.step === data['step'] &&
          hasTime
        ) {
          const span = Math.max(0, t - openStep.start);
          llmMs += span;
          const dk = dayKey(t);
          state.dayLlm.set(dk, (state.dayLlm.get(dk) ?? 0) + span);
          openStep = null;
        }
        if (data['usage']) {
          if (pending !== null && pending.key !== key) flush();
          pending = {
            key,
            usage: data['usage'] as UsageLike,
            time: Number(ev.time) || 0,
            model: srcModel || route(),
          };
        } else if (pending !== null && pending.key === key && srcModel !== null) {
          pending.model = srcModel;
        }
        break;
      }
    }
  }

  /** 收尾：提交未结算的采样并算出活动区间/结局（幂等，可反复调用） */
  function finish(): FoldResult {
    flush();
    state.active = mergePoints(times, BASE_GAP_MS);
    state.turns = mergeIntervals(turns, 0);
    state.llmMs = llmMs;
    state.toolMs = toolMs;
    const ownCount = processed - limit;
    state.outcome =
      state.records.size > 0
        ? 'usage'
        : !sawRequest && (times.length === 0 || ownCount <= 4)
          ? 'fork-empty' // fork/续接出来的空壳：跳掉继承段后只剩几行（header / end-seed）
          : !sawRequest
            ? 'no-request'
            : !sawMessage
              ? 'failed'
              : sawUsageMessage
                ? 'usage'
                : 'no-usage';
    return state;
  }

  return { push, finish, result: () => state, count: () => processed };
}

/** 一次性折叠一份事件数组（内部就是 createFolder + push + finish）。 */
export function foldSession(events: SessionEvent[], skipCount: number): FoldResult {
  const folder = createFolder(skipCount);
  for (const ev of events) folder.push(ev as SessionEvent);
  return folder.finish();
}

export interface CompactAgg {
  r: Array<[string, FoldBucket]>;
  p: FoldPeak | null;
  f: string | null;
  l: string | null;
  u: boolean;
  /** 活动区间（扁平化 [s0,e0,s1,e1,…]，避免嵌套数组膨胀） */
  on?: number[];
  /** 对话进行中区间（同上） */
  tn?: number[];
  /** 模型生成墙钟（毫秒） */
  lm?: number;
  /** 工具执行墙钟（毫秒） */
  tm?: number;
  /** 每日引擎时长：[day, llmMs, toolMs] */
  dm?: Array<[string, number, number]>;
  /** 会话结局分类 */
  oc?: string;
}

/** 区间数组 ↔ 扁平数字数组。 */
const flat = (iv: Interval[]): number[] => {
  const out: number[] = [];
  for (const [a, b] of iv) out.push(a, b);
  return out;
};

export const unflat = (nums: unknown): Interval[] => {
  if (!Array.isArray(nums)) return [];
  const out: Interval[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const a = Number(nums[i]);
    const b = Number(nums[i + 1]);
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) out.push([a, b]);
  }
  return out;
};

const nonNeg = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Map ↔ 数组序列化（JSON 不支持 Map）。 */
export const compactAgg = (agg: FoldResult): CompactAgg => ({
  r: Array.from(agg.records.entries()),
  p: agg.peak,
  f: agg.first,
  l: agg.last,
  u: agg.used,
  on: flat(agg.active),
  tn: flat(agg.turns),
  lm: Math.round(agg.llmMs),
  tm: Math.round(agg.toolMs),
  dm: dmCompact(agg),
  oc: agg.outcome,
});

/** 每日引擎时长 → 紧凑数组（按 dayLlm 的键集合，缺失的 tool 记 0）。 */
function dmCompact(agg: FoldResult): Array<[string, number, number]> {
  const days = new Set<string>([...agg.dayLlm.keys(), ...agg.dayTool.keys()]);
  const out: Array<[string, number, number]> = [];
  for (const d of days)
    out.push([d, Math.round(agg.dayLlm.get(d) ?? 0), Math.round(agg.dayTool.get(d) ?? 0)]);
  return out;
}

export const reviveAgg = (c: CompactAgg): FoldResult => {
  const dayLlm = new Map<string, number>();
  const dayTool = new Map<string, number>();
  if (Array.isArray(c.dm)) {
    for (const row of c.dm) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const d = String(row[0]);
      dayLlm.set(d, nonNeg(row[1]));
      dayTool.set(d, nonNeg(row[2]));
    }
  }
  return {
    records: new Map(c.r),
    peak: c.p,
    first: c.f,
    last: c.l,
    used: c.u,
    active: unflat(c.on),
    turns: unflat(c.tn),
    llmMs: nonNeg(c.lm),
    toolMs: nonNeg(c.tm),
    dayLlm,
    dayTool,
    outcome: (c.oc as SessionOutcome | undefined) ?? 'failed',
  };
};
