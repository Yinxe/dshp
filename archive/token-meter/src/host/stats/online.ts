/**
 * 在线时长估算 —— 纯函数，无副作用，可独立单测
 *
 * ── 口径（改这里必须同步改 README 与客户端说明卡）─────────────────────────
 * 「在线」= 会话日志里有事件、且相邻事件间隔不超过 gap 的**墙钟时间**。
 *  · 跨会话按区间**并集**合并：同一时刻开着多个会话/子代理不重复计时；
 *  · fork/resume 会话的继承前缀已在 fold 阶段按 inheritedEventCount 跳过
 *    （父会话已计），因此不会重复计时；
 *  · 日志只在有事件时打点 —— 「窗口开着但没有事件」的时间在数据里不存在，
 *    所以任何阈值下的结果都是**下界**，不是「坐在电脑前」的时长；
 *  · 阈值是口径而非精度：同一份日志 1min / 5min / 30min 可以差 ±40%。
 *
 * ── 两级合并（缓存友好）──────────────────────────────────────────────────
 * fold 阶段按 BASE_GAP_MS（1 分钟）把事件时刻压成区间并存进缓存；
 * 快照阶段再用更大的 gap 合并这些区间。单链聚类可结合：对任意 gap ≥ 基础阈值，
 * 先按小阈值合并再按大阈值合并，等价于直接按大阈值合并 —— 所以换阈值不必重扫日志。
 */
import type { StatsOnline, StatsOnlineDay } from '../types.js';

/** 活动区间，[startMs, endMs]（闭区间，单位毫秒） */
export type Interval = [number, number];

/** 客户端可切换的预设阈值（分钟）；1 分钟即 fold 的基础阈值。 */
export const PRESET_GAPS_MIN: number[] = [1, 5, 15, 30, 60];

/** fold 阶段的基础合并阈值：再小的阈值不保证准确（1 分钟精度）。 */
export const BASE_GAP_MS = 60_000;

/**
 * 推荐默认阈值（分钟）= 15。
 * 依据：DSH 真正在干活时日志里持续有事件（step / tool call-result / 子代理），
 * 所以「挂机跑任务」那段本来就会被计入，不依赖大阈值；需要靠阈值兜的是
 * 「读完回答再想一下」「短暂离开」这类几分钟量级的静默期。1~5 分钟会把这些切断（偏低），
 * 60 分钟则会把开会/吃饭整段算成在线（只适合回答「今天开着 DSH 多久」）。
 */
export const DEFAULT_GAP_MIN = 15;

/**
 * 配置阈值归一：钳到 [1, 60] 分钟，并吸附到最近的预设值。
 * 非法值兜底用**推荐档 15 分钟**（与 Host 配置默认值一致）。
 */
export function normGapMin(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_GAP_MIN;
  let best = PRESET_GAPS_MIN[0] as number;
  for (const g of PRESET_GAPS_MIN) if (Math.abs(g - n) < Math.abs(best - n)) best = g;
  return best;
}

/**
 * 升序拷贝（不原地改写入参）。
 * oxlint 的 unicorn/no-array-sort 只认 `toSorted`，但插件的 TS lib 低于 ES2023，
 * 且 host 要兼容 Node 20 —— 用仓库既有的 disable 约定（同 StatsSection）。
 */
function asc<T>(arr: T[], cmp: (a: T, b: T) => number): T[] {
  const out = [...arr];
  // eslint-disable-next-line unicorn/no-array-sort
  return out.sort(cmp);
}

/** 本地日期键（与 fold 的 dayKey 同口径：本地时区 YYYY-MM-DD）。 */
export function dayKey(t: number): string {
  const d = new Date(t);
  const M = String(d.getMonth() + 1);
  const D = String(d.getDate());
  return d.getFullYear() + '-' + (M.length < 2 ? '0' + M : M) + '-' + (D.length < 2 ? '0' + D : D);
}

/** 本地当天 00:00 的毫秒时间戳。 */
function dayFloor(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 本地次日 00:00 的毫秒时间戳。 */
function nextDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

/**
 * 事件时刻 → 区间：相邻时刻间隔 ≤ gapMs 视为同一段活动。
 * @param times 事件时刻（毫秒，允许乱序/重复）
 * @param gapMs 空闲阈值（毫秒）
 */
export function mergePoints(times: number[], gapMs: number): Interval[] {
  if (times.length === 0) return [];
  const s = asc(times, (a, b) => a - b);
  const out: Interval[] = [];
  let start = s[0] as number;
  let end = start;
  for (let i = 1; i < s.length; i++) {
    const t = s[i] as number;
    if (t - end <= gapMs) {
      if (t > end) end = t;
    } else {
      out.push([start, end]);
      start = t;
      end = t;
    }
  }
  out.push([start, end]);
  return out;
}

/**
 * 区间 → 区间：把已按更小阈值合并过的区间再按更大阈值合并。
 * 允许传入 gapMs ≥ 原合并阈值（见文件头「两级合并」说明）。
 */
export function mergeIntervals(input: Interval[], gapMs: number): Interval[] {
  if (input.length === 0) return [];
  const s = asc(input, (a, b) => a[0] - b[0] || a[1] - b[1]);
  const out: Interval[] = [];
  let start = (s[0] as Interval)[0];
  let end = (s[0] as Interval)[1];
  for (let i = 1; i < s.length; i++) {
    const iv = s[i] as Interval;
    if (iv[0] - end <= gapMs) {
      if (iv[1] > end) end = iv[1];
    } else {
      out.push([start, end]);
      start = iv[0];
      end = iv[1];
    }
  }
  out.push([start, end]);
  return out;
}

/** 按区间起点所在本地日统计段数（跨零点的段归入起点那天）。 */
export function countByDay(intervals: Interval[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const [a] of intervals) {
    const k = dayKey(a);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

/** 区间总时长（毫秒）。 */
export function totalMs(intervals: Interval[]): number {
  let sum = 0;
  for (const [a, b] of intervals) if (b > a) sum += b - a;
  return sum;
}

/** 按本地日切分区间 → 每日毫秒（跨零点的区间会落到两天）。 */
export function splitByDay(intervals: Interval[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const [a, b] of intervals) {
    if (b <= a) continue;
    let cur = a;
    while (cur < b) {
      // 每轮都按当前 cur 重新求当日结束点：跨零点的区间会连续落进多天
      const dayEnd = nextDay(cur);
      const segEnd = Math.min(b, dayEnd);
      if (segEnd <= cur) break; // 防异常时区（DST 等）导致的死循环
      const k = dayKey(cur);
      byDay.set(k, (byDay.get(k) ?? 0) + (segEnd - cur));
      cur = segEnd;
    }
  }
  return byDay;
}

/**
 * 组装在线时长快照：对每个预设阈值给出累计 + 每日值。
 *
 * @param active 全会话的活动区间（已按 BASE_GAP_MS 合并、已跳过继承前缀、已跨会话去重前的原始区间）
 * @param turns  全会话的「对话进行中」区间（turn/start → turn/end）
 * @param dayMeta 每日附加信息（会话数 / token 数）
 * @param defaultGapMin 客户端默认选中的阈值
 */
export function buildOnline(
  active: Interval[],
  turns: Interval[],
  dayMeta: {
    sessions: Record<string, number>;
    tokens: Record<string, number>;
    /** 每日模型生成墙钟（毫秒，并行相加） */
    llmMs: Record<string, number>;
    /** 每日工具执行墙钟（毫秒，并行相加） */
    toolMs: Record<string, number>;
  },
  defaultGapMin: number,
): StatsOnline {
  const gaps = PRESET_GAPS_MIN;
  const totals: Record<string, number> = {};
  const segments: Record<string, number> = {};
  const perGapDays: Array<Map<string, number>> = [];
  const perGapSegs: Array<Map<string, number>> = [];
  const daySet = new Set<string>();

  for (const g of gaps) {
    const merged = mergeIntervals(active, g * 60_000);
    totals[String(g)] = totalMs(merged);
    segments[String(g)] = merged.length;
    const days = splitByDay(merged);
    perGapDays.push(days);
    perGapSegs.push(countByDay(merged));
    for (const k of days.keys()) daySet.add(k);
  }
  for (const k of Object.keys(dayMeta.sessions)) daySet.add(k);
  for (const k of Object.keys(dayMeta.llmMs)) daySet.add(k);

  // 「对话进行中」= turn 区间并集（不再做空闲合并：轮次之间的间隔就是间隔）
  const turnMerged = mergeIntervals(turns, 0);
  const turnTotal = totalMs(turnMerged);
  const turnDays = splitByDay(turnMerged);

  const days: StatsOnlineDay[] = [];
  for (const d of asc([...daySet], (a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const byGap: Record<string, number> = {};
    const segByGap: Record<string, number> = {};
    for (let i = 0; i < gaps.length; i++) {
      const g = String(gaps[i]);
      byGap[g] = (perGapDays[i] as Map<string, number>).get(d) ?? 0;
      segByGap[g] = (perGapSegs[i] as Map<string, number>).get(d) ?? 0;
    }
    days.push({
      d,
      sessions: dayMeta.sessions[d] ?? 0,
      tokens: dayMeta.tokens[d] ?? 0,
      turnMs: turnDays.get(d) ?? 0,
      byGap,
      segByGap,
      llmMs: dayMeta.llmMs[d] ?? 0,
      toolMs: dayMeta.toolMs[d] ?? 0,
    });
  }
  let llmTotal = 0;
  let toolTotal = 0;
  for (const v of Object.values(dayMeta.llmMs)) llmTotal += v;
  for (const v of Object.values(dayMeta.toolMs)) toolTotal += v;

  return {
    defaultGapMin: normGapMin(defaultGapMin),
    gaps,
    totalMs: totals,
    segments,
    turnMs: turnTotal,
    llmMs: llmTotal,
    toolMs: toolTotal,
    activeDays: days.length,
    firstDay: days.length > 0 ? (days[0] as StatsOnlineDay).d : null,
    lastDay: days.length > 0 ? (days[days.length - 1] as StatsOnlineDay).d : null,
    days,
  };
}

/** 本地当天键（供 Host 生成「今日」锚点；客户端不依赖它，自己按本地日取）。 */
export function todayKey(now: number = Date.now()): string {
  return dayKey(dayFloor(now));
}
