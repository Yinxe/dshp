/**
 * 用量统计 Section（stats）：设置页总览/趋势/热力图/模型 + 侧边栏今日卡 + 今日浮窗
 *
 * 原实现：dsh-token-stats/client.js（1548 行手写 bundle）→ 本文件为等价 TS 重写，
 * 口径对齐（总 Token = i+o+cr+cw；usage 终值覆盖采样；fork 种子跳过已在 Host 完成，
 * Client 仅按范围二次聚合），图表均为手绘 SVG（零依赖），样式前缀由 ts- 改为 tm-、
 * 路由前缀改为 dshp-token-meter。动效/悬浮/浮窗行为 1:1 还原。
 *
 * 装配方式：**模块级具名导出**（不再是 `createStatsSection(React, P, ReactDOM)` 工厂）。
 * bundle 的 loader factory 每次加载只求值一次本模块，「模块级 = 每插件实例一份」，与原实现
 * 「在工厂里建一次」的时机与份数完全相同；`shared` / `tmTodayFloat` 这类跨面板共享状态因此
 * 仍然是同一份（`useSharedStats` 被 OnlineSection 直接 import 复用）。
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as ReactDOM from 'react-dom';
import {
  Button,
  IconChevronDownOutlineRegular,
  IconLoadingOutlineRegular,
  IconRefreshOutlineRegular,
  Menu,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import { fetchStats, saveConfig } from './api.js';
import { Badge } from './components.js';
import { Glyph } from './glyphs.js';
import { ShareShell } from './ShareShell.js';
import styles from './styles.module.css';
import type { StatsRecord, StatsSnapshot } from './types.js';

/**
 * 拼类名。
 *
 * CSS Module 的映射是宽松声明（`shared/types/css-modules.d.ts`），每个值都是 `string | undefined`
 * ——直接拼字符串会得到 `"a undefined"`。这里统一滤掉空值（与 `components.tsx` 同一实现）。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/**
 * 趋势箭头方向 → 类名。
 *
 * 旧的运行时拼串是 `'tm-arrow tm-arrow-' + arrow`（箭头只有 flat / up / down 三种取值，
 * flat 在样式里没有规则）。CSS Module 化后不能再拼串（类名在构建期被哈希），
 * 所以按 `components.tsx` 的 `BADGE_CLASS` 同一写法改成固定集合查表：
 * 渲染出的类名集合与旧实现逐字对应（flat → 只有 .arrow）。
 */
const ARROW_CLASS: Record<string, string | undefined> = {
  flat: undefined,
  up: styles.arrowUp,
  down: styles.arrowDown,
};

const BP = 'var(--dsw-alias-state-business-primary)';
/** 分享面板加载态的占位快照（只有 loading=true 时会用到） */
const EMPTY_SNAPSHOT = {
  ready: false,
  records: [],
  models: {},
  daySessions: {},
  peakStep: null,
  range: null,
  sessions: 0,
  active: 0,
  partial: false,
  scanned: 0,
  total: 0,
  errors: 0,
  storage: '',
  generatedAt: 0,
} as unknown as StatsSnapshot;
/** 热力图手动选择的时间跨度（localStorage 键；只有「用户手动选过」才写） */
const HEAT_SPAN_KEY = 'tm-heat-span';
/** 卡片宽度达到此值才默认铺 12 个月（再窄就退回 6 个月，保证格子不被压成细条） */
const HEAT_WIDE_PX = 900;

/** 读用户手动选过的热力图跨度；没选过返回 ''（= 交给宽度自动决定） */
function readHeatSpan(): string {
  try {
    const v = window.localStorage.getItem(HEAT_SPAN_KEY);
    if (v === '6' || v === '12') return v;
  } catch {
    /* 无 localStorage */
  }
  return '';
}
export const PALETTE = [
  '#4c7ef3',
  '#2fb261',
  '#f5a623',
  '#e05e4e',
  '#9a6ef1',
  '#25b8c4',
  '#d557a8',
  '#8a94a6',
  '#6b7280',
  '#34d399',
  '#f472b6',
  '#a3e635',
];
export const RANGES = [
  { v: '7', t: '近7天' },
  { v: '30', t: '近30天' },
  { v: '90', t: '近90天' },
  { v: 'all', t: '全部' },
];
export const rangeText = (rv: string): string => {
  for (const r of RANGES) if (r.v === rv) return r.t;
  return '';
};

/* ---------- util ---------- */
export const keyOf = (t: number): string => {
  const d = new Date(t);
  const M = String(d.getMonth() + 1);
  const D = String(d.getDate());
  return d.getFullYear() + '-' + (M.length < 2 ? '0' + M : M) + '-' + (D.length < 2 ? '0' + D : D);
};
export const fromKey = (k: string): number => {
  const p = k.split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12).getTime();
};
export const dispDay = (k: string): string => (k ? k.slice(5).replace('-', '/') : '');
export const cnDate = (k: string): string => {
  const p = k.split('-');
  return Number(p[0]) + '年' + Number(p[1]) + '月' + Number(p[2]) + '日';
};
const hhmm = (t: number): string => {
  const d = new Date(t);
  const H = String(d.getHours());
  const Mi = String(d.getMinutes());
  return (H.length < 2 ? '0' + H : H) + ':' + (Mi.length < 2 ? '0' + Mi : Mi);
};
const tok = (r: { i?: number; o?: number; cr?: number; cw?: number }): number =>
  (r.i || 0) + (r.o || 0) + (r.cr || 0) + (r.cw || 0);
export const fmt = (n: number): string => {
  n = Math.round(n || 0);
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
  return n.toLocaleString('en-US');
};
export const fmtFull = (n: number): string => Math.round(n || 0).toLocaleString('en-US');
const fmtRail = (n: number): string => {
  n = Math.round(n || 0);
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 1e4) return String(Math.round(n / 1e4)) + '万';
  return String(n);
};
export const niceMax = (m: number): number => {
  if (m <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log(m) / Math.LN10));
  // 候选更密（1/1.1/1.2/1.25…）：贴近实际峰值，减少曲线上方的大片空白
  const c = [1, 1.1, 1.2, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (const v of c) if (v * p >= m) return v * p;
  return 10 * p;
};
/** 新鲜拷贝排序（oxlint unicorn/no-array-sort 要求不原地 sort；此处入参均为调用处新鲜数组，拷贝后排序语义与原实现一致） */
export function sorted<T>(arr: T[], cmp?: (a: T, b: T) => number): T[] {
  // eslint-disable-next-line unicorn/no-array-sort
  return [...arr].sort(cmp);
}
export const median = (arr: number[]): number => {
  if (!arr.length) return 0;
  const s = sorted(arr, (a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
};

export interface DayAgg {
  d: string;
  i: number;
  o: number;
  cr: number;
  cw: number;
  n: number;
  t: number;
  byModel: Record<string, number>;
}
export interface ModelAgg {
  m: string;
  i: number;
  o: number;
  cr: number;
  cw: number;
  n: number;
  t: number;
}
export interface Agg {
  byDay: Map<string, DayAgg>;
  byModel: Map<string, ModelAgg>;
  byHour: number[];
  i: number;
  o: number;
  cr: number;
  cw: number;
  n: number;
  total: number;
  first: string | null;
  last: string | null;
}

export function aggregate(records: StatsRecord[], cutoff: string | null): Agg {
  const byDay = new Map<string, DayAgg>();
  const byModel = new Map<string, ModelAgg>();
  const byHour: number[] = [];
  for (let i = 0; i < 24; i++) byHour.push(0);
  let si = 0,
    so = 0,
    scr = 0,
    scw = 0,
    sn = 0;
  let first: string | null = null,
    last: string | null = null;
  for (const r of records) {
    if (cutoff !== null && r.d < cutoff) continue;
    const t = tok(r);
    si += r.i || 0;
    so += r.o || 0;
    scr += r.cr || 0;
    scw += r.cw || 0;
    sn += r.n || 0;
    (byHour[r.h] as number) += t;
    let day = byDay.get(r.d);
    if (day === undefined) {
      day = { d: r.d, i: 0, o: 0, cr: 0, cw: 0, n: 0, t: 0, byModel: {} };
      byDay.set(r.d, day);
    }
    day.i += r.i || 0;
    day.o += r.o || 0;
    day.cr += r.cr || 0;
    day.cw += r.cw || 0;
    day.n += r.n || 0;
    day.t += t;
    day.byModel[r.m] = ((day.byModel[r.m] as number) || 0) + t;
    let mo = byModel.get(r.m);
    if (mo === undefined) {
      mo = { m: r.m, i: 0, o: 0, cr: 0, cw: 0, n: 0, t: 0 };
      byModel.set(r.m, mo);
    }
    mo.i += r.i || 0;
    mo.o += r.o || 0;
    mo.cr += r.cr || 0;
    mo.cw += r.cw || 0;
    mo.n += r.n || 0;
    mo.t += t;
    if (first === null || r.d < first) first = r.d;
    if (last === null || r.d > last) last = r.d;
  }
  return {
    byDay,
    byModel,
    byHour,
    i: si,
    o: so,
    cr: scr,
    cw: scw,
    n: sn,
    total: si + so + scr + scw,
    first,
    last,
  };
}

function streaks(byDay: Map<string, unknown>): { current: number; longest: number } {
  const set = new Set(byDay.keys());
  const today = keyOf(Date.now());
  const yKey = keyOf(fromKey(today) - 86400000);
  let cur = 0;
  let cursor: string | null = set.has(today) ? today : set.has(yKey) ? yKey : null;
  while (cursor !== null && set.has(cursor)) {
    cur++;
    cursor = keyOf(fromKey(cursor) - 86400000);
  }
  const keys = sorted(Array.from(set));
  let longest = 0,
    run = 0,
    prev: string | null = null;
  for (const k of keys) {
    run = prev !== null && keyOf(fromKey(prev) + 86400000) === k ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = k;
  }
  return { current: cur, longest };
}

export function buildDayList(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  let c = startKey;
  let guard = 0;
  while (c <= endKey && guard < 3000) {
    out.push(c);
    c = keyOf(fromKey(c) + 86400000);
    guard++;
  }
  return out;
}

let MODEL_COLORS = new Map<string, string>();
export function buildModelColors(models: Record<string, unknown>): void {
  const map = new Map<string, string>();
  sorted(Object.keys(models || {})).forEach((k, i) => map.set(k, PALETTE[i % PALETTE.length] as string));
  MODEL_COLORS = map;
}
export const modelColor = (mk: string): string => MODEL_COLORS.get(mk) || '#8a94a6';

/** fixed 定位 tooltip 坐标：跟随鼠标 + 视口边缘四向翻转 */
function tipPos(mx: number, my: number, w: number, h: number): Record<string, string | undefined> {
  const vw = typeof window !== 'undefined' ? window.innerWidth || 1024 : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight || 768 : 768;
  const flipX = mx + w + 28 > vw;
  const flipY = my + h + 28 > vh;
  return {
    left: flipX ? undefined : mx + 14 + 'px',
    right: flipX ? vw - mx + 14 + 'px' : undefined,
    top: flipY ? undefined : my + 16 + 'px',
    bottom: flipY ? vh - my + 16 + 'px' : undefined,
  };
}

/** 平滑路径（Catmull-Rom → 三次 Bezier） */
export function smoothPath(pts: Array<[number, number]>): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return 'M ' + (pts[0] as [number, number])[0] + ' ' + (pts[0] as [number, number])[1];
  if (n === 2)
    return (
      'M ' +
      (pts[0] as [number, number])[0] +
      ' ' +
      (pts[0] as [number, number])[1] +
      ' L ' +
      (pts[1] as [number, number])[0] +
      ' ' +
      (pts[1] as [number, number])[1]
    );
  let d =
    'M ' + (pts[0] as [number, number])[0].toFixed(1) + ' ' + (pts[0] as [number, number])[1].toFixed(1);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)] as [number, number];
    const p1 = pts[i] as [number, number];
    const p2 = pts[i + 1] as [number, number];
    const p3 = pts[Math.min(n - 1, i + 2)] as [number, number];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6,
      c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6,
      c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d +=
      ' C ' +
      c1x.toFixed(1) +
      ' ' +
      c1y.toFixed(1) +
      ' ' +
      c2x.toFixed(1) +
      ' ' +
      c2y.toFixed(1) +
      ' ' +
      p2[0].toFixed(1) +
      ' ' +
      p2[1].toFixed(1);
  }
  return d;
}

/* ---------- 今日浮窗全局状态（侧栏/浮窗同一时刻只挂载一个数据实例，弹出后侧栏零占位） ---------- */
const TM_TODAY_LS_OPEN = 'tm-today.float.open';
const TM_TODAY_LS_POS = 'tm-today.float.pos';
const TS_TODAY_LS_OPEN = 'ts-today.float.open';
const TS_TODAY_LS_POS = 'ts-today.float.pos';
function tmTodayLoadOpen(): boolean {
  try {
    if (window.localStorage.getItem(TM_TODAY_LS_OPEN) === '1') return true;
    if (window.localStorage.getItem(TS_TODAY_LS_OPEN) === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}
function tmTodayLoadPos(): { x: number; y: number } | null {
  try {
    const v = JSON.parse(
      window.localStorage.getItem(TM_TODAY_LS_POS) || window.localStorage.getItem(TS_TODAY_LS_POS) || 'null',
    ) as { x: number; y: number } | null;
    if (v && isFinite(v.x) && isFinite(v.y)) return { x: Number(v.x), y: Number(v.y) };
  } catch {
    /* ignore */
  }
  return null;
}
function tmTodaySave(open: boolean, pos: { x: number; y: number } | null): void {
  try {
    window.localStorage.setItem(TM_TODAY_LS_OPEN, open ? '1' : '0');
    if (pos)
      window.localStorage.setItem(
        TM_TODAY_LS_POS,
        JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) }),
      );
  } catch {
    /* ignore */
  }
}
function tmTodayDefaultPos(): { x: number; y: number } {
  try {
    const vw = window.innerWidth || 1024,
      vh = window.innerHeight || 768;
    return { x: Math.max(8, vw - 332), y: Math.max(8, Math.min(120, vh - 340)) };
  } catch {
    return { x: 100, y: 100 };
  }
}
function tmTodayClamp(p: { x: number; y: number }): { x: number; y: number } {
  try {
    const vw = window.innerWidth || 1024,
      vh = window.innerHeight || 768;
    return { x: Math.max(8, Math.min(p.x, vw - 316)), y: Math.max(8, Math.min(p.y, vh - 140)) };
  } catch {
    return p;
  }
}
export const tmTodayFloat: { open: boolean; pos: { x: number; y: number } | null } = {
  open: typeof window !== 'undefined' ? tmTodayLoadOpen() : false,
  pos: typeof window !== 'undefined' ? tmTodayLoadPos() : null,
};
const tmTodayListeners = new Set<(v: { open: boolean; pos: { x: number; y: number } | null }) => void>();
const tmTodayEmit = (): void => {
  for (const fn of tmTodayListeners) {
    try {
      fn({ open: tmTodayFloat.open, pos: tmTodayFloat.pos });
    } catch {
      /* ignore */
    }
  }
};
export function tmTodaySet(open: boolean): void {
  tmTodayFloat.open = open;
  if (open) tmTodayFloat.pos = tmTodayClamp(tmTodayFloat.pos || tmTodayLoadPos() || tmTodayDefaultPos());
  tmTodaySave(tmTodayFloat.open, tmTodayFloat.pos);
  tmTodayEmit();
}

/**
 * 浮窗 .tm-float 带 backdrop-filter + overflow:hidden，会成为 fixed 后代的定位基准并裁剪之；
 * 图表悬浮提示必须 portal 到 body
 */
function tmPortal(node: any): any {
  if (node === null || node === undefined) return null;
  try {
    if (
      ReactDOM &&
      typeof ReactDOM.createPortal === 'function' &&
      typeof document !== 'undefined' &&
      document.body
    ) {
      return ReactDOM.createPortal(node, document.body);
    }
  } catch {
    /* ignore */
  }
  return node;
}

/** SVG 悬浮捕获层的鼠标 x → 索引 */
const hoverIndex = (svgRef: any, e: any, W: number, pl: number, pr: number, n: number): number | null => {
  const node = svgRef.current;
  if (node === null || node === undefined) return null;
  const rect = node.getBoundingClientRect();
  const relX = ((e.clientX - rect.left) / rect.width) * W;
  let i = n <= 1 ? 0 : Math.round(((relX - pl) / (W - pl - pr)) * (n - 1));
  if (i < 0) i = 0;
  if (i > n - 1) i = n - 1;
  return i;
};

export function useTmTodayFloat(): { open: boolean; pos: { x: number; y: number } | null } {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const fn = (): void => force();
    tmTodayListeners.add(fn);
    return () => {
      tmTodayListeners.delete(fn);
    };
  }, []);
  return tmTodayFloat;
}

function tmGripDragOut(e: any): void {
  if (e.button !== undefined && e.button !== 0) return;
  if (e.preventDefault) e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
  const sx = e.clientX,
    sy = e.clientY;
  let out = false;
  function mv(ev: any): void {
    if (!out && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
    out = true;
    tmTodayFloat.open = true;
    tmTodayFloat.pos = tmTodayClamp({ x: ev.clientX - 60, y: ev.clientY - 20 });
    tmTodayEmit();
  }
  function up(): void {
    try {
      window.removeEventListener('pointermove', mv);
    } catch {
      /* ignore */
    }
    try {
      window.removeEventListener('pointerup', up);
    } catch {
      /* ignore */
    }
    if (out) tmTodaySave(true, tmTodayFloat.pos);
    else tmTodaySet(true);
  }
  try {
    window.addEventListener('pointermove', mv);
  } catch {
    /* ignore */
  }
  try {
    window.addEventListener('pointerup', up);
  } catch {
    /* ignore */
  }
}

function tmFloatDrag(e: any): void {
  if (e.button !== undefined && e.button !== 0) return;
  if (e.target && e.target.closest && e.target.closest('button')) return;
  if (e.preventDefault) e.preventDefault();
  const p0 = tmTodayClamp(tmTodayFloat.pos || tmTodayLoadPos() || tmTodayDefaultPos());
  const ox = e.clientX - p0.x,
    oy = e.clientY - p0.y;
  function mv(ev: any): void {
    tmTodayFloat.pos = tmTodayClamp({ x: ev.clientX - ox, y: ev.clientY - oy });
    tmTodayEmit();
  }
  function up(): void {
    try {
      window.removeEventListener('pointermove', mv);
    } catch {
      /* ignore */
    }
    try {
      window.removeEventListener('pointerup', up);
    } catch {
      /* ignore */
    }
    tmTodaySave(tmTodayFloat.open, tmTodayFloat.pos);
  }
  try {
    window.addEventListener('pointermove', mv);
  } catch {
    /* ignore */
  }
  try {
    window.addEventListener('pointerup', up);
  } catch {
    /* ignore */
  }
}

/* ---------- 原子组件 ---------- */
function AnimatedNumber(props: {
  value: number;
  format?: (v: number) => string;
  className?: string | undefined;
  style?: any;
  duration?: number;
}): any {
  const [disp, setDisp] = useState(0);
  const ref = useRef(0);
  const played = useRef(false);
  useEffect(() => {
    const to = Number((props as any).value) || 0;
    if (played.current) {
      if (ref.current !== to) {
        ref.current = to;
        setDisp(to);
      }
      return undefined;
    }
    played.current = true;
    const from = ref.current;
    if (from === to) return undefined;
    const dur = (props as any).duration || 650;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number): void => {
      const p = Math.min(1, (t - t0) / dur);
      const e2 = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * e2;
      ref.current = v;
      setDisp(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [(props as any).value]);
  const format = (props as any).format || ((v: number) => Math.round(v).toLocaleString('en-US'));
  return (
    <div className={(props as any).className || ''} style={(props as any).style || undefined}>
      {format(disp)}
    </div>
  );
}

function Seg(props: {
  options: Array<{ v: string; t: string }>;
  current: string;
  onPick: (v: string) => void;
}): any {
  return (
    <div className={styles.seg}>
      {(props.options || []).map((o) => (
        <button
          key={o.v}
          className={cx(styles.segBtn, props.current === o.v ? styles.segOn : undefined)}
          aria-pressed={props.current === o.v ? 'true' : 'false'}
          onClick={() => props.onPick(o.v)}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

/** 卡片标题：前置一枚语义图标 + 文本（文本仍按需省略号截断） */
function cardName(name: string, text: ReactNode): ReactNode {
  return (
    <span className={styles.chartName}>
      <Glyph name={name} size={14} className={styles.cico} />
      <span className={styles.cnameTxt}>{text}</span>
    </span>
  );
}

/** 指标卡 props（13 张用法一致：给了 count 走数字动画，否则直接显示 value）。 */
interface StatCardProps {
  count?: number;
  value?: ReactNode;
  fmt?: (v: number) => string;
  label: ReactNode;
  sub?: ReactNode;
  icon?: string;
  tint?: boolean;
  delay?: number;
  onHover?: (e: any) => void;
  onLeave?: () => void;
  visual?: ReactNode[];
}

function StatCard(props: StatCardProps): ReactNode {
  const valueNode =
    props.count !== undefined ? (
      <AnimatedNumber className={styles.statValue} value={props.count} format={props.fmt || fmt} />
    ) : (
      <div className={styles.statValue}>{props.value}</div>
    );
  return (
    <div
      className={styles.stat}
      data-tint={props.tint ? '1' : '0'}
      style={props.delay !== undefined ? { animationDelay: props.delay + 'ms' } : undefined}
      onMouseEnter={props.onHover || undefined}
      onMouseMove={props.onHover || undefined}
      onMouseLeave={props.onLeave || undefined}
    >
      {/* 底纹：同一个语义图标放大成 58px 低透明度水印（右下角），让卡片不是纯色块 */}
      {props.icon ? <Glyph name={props.icon} size={58} className={styles.statBg} /> : null}
      <div className={styles.statLabel}>
        {props.icon ? <Glyph name={props.icon} size={13} className={styles.statIco} /> : null}
        {props.label}
      </div>
      {valueNode}
      {props.sub ? <div className={styles.statSub}>{props.sub}</div> : null}
      {...(props.visual as any[]) || []}
    </div>
  );
}

function breakdown(title: string, parts: Array<[string, number, number, number]>): any {
  return (
    <div>
      <div className={styles.popTitle}>{title}</div>
      {parts.map((p) => (
        <div key={p[0]} className={styles.popRow}>
          <span className={styles.popK}>{p[0]}</span>
          <span className={styles.popV}>
            {fmtFull(p[1]) + ' · ' + (p[3] > 0 ? ((p[1] / p[3]) * 100).toFixed(1) : '0.0') + '%'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ComposeBar(props: { parts: Array<[string, number, string]> }): any {
  const parts = props.parts || [];
  const total = parts.reduce((s, p) => s + p[1], 0);
  if (total <= 0) return null;
  return (
    <div>
      <div className={styles.compose}>
        {parts
          .filter((p) => p[1] > 0)
          .map((p) => {
            const w = (p[1] / total) * 100;
            return <span key={p[0]} style={{ width: w.toFixed(2) + '%', background: p[2] }} />;
          })}
      </div>
      <div className={styles.composeLegend}>
        {parts.map((p) => (
          <span key={p[0]}>
            <i style={{ background: p[2] }} />
            {p[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Sparkline(props: { values: number[]; color?: string }): any {
  const vals = props.values || [];
  const W = 150,
    H = 34,
    PAD = 2;
  if (vals.length < 2) return null;
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const span = max - min || 1;
  const xs = (i: number): number => PAD + ((W - PAD * 2) * i) / (vals.length - 1);
  const ys = (v: number): number => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const line = smoothPath(vals.map((v, i) => [xs(i), ys(v)] as [number, number]));
  const area =
    line +
    ' L ' +
    xs(vals.length - 1).toFixed(1) +
    ' ' +
    (H - PAD) +
    ' L ' +
    xs(0).toFixed(1) +
    ' ' +
    (H - PAD) +
    ' Z';
  const c = props.color || BP;
  return (
    <svg className={styles.spark} viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none">
      <path
        d={area}
        className={styles.fadein}
        style={{ fill: c, fillOpacity: 0.13, animationDelay: '.18s' }}
      />
      <path
        d={line}
        className={styles.draw}
        fill="none"
        style={{ stroke: c, strokeWidth: 1.5, strokeLinecap: 'round', animationDelay: '.12s' }}
      />
      <circle
        cx={xs(vals.length - 1)}
        cy={ys(vals[vals.length - 1] as number)}
        r={1.8}
        className={styles.fadein}
        style={{ fill: c, animationDelay: '.55s' }}
      />
    </svg>
  );
}

function TrendDelta(props: { recent: number; before: number }): any {
  const recent = props.recent,
    before = props.before;
  if (before === 0 && recent === 0) return null;
  const delta = before === 0 ? null : ((recent - before) / before) * 100;
  let arrow = 'flat',
    color = 'var(--dsw-alias-label-tertiary)',
    text = '持平';
  if (delta === null) {
    arrow = 'up';
    text = '新增';
  } else if (delta > 2) {
    arrow = 'up';
    color = 'var(--dsw-alias-state-success-primary)';
    text = '+' + delta.toFixed(0) + '%';
  } else if (delta < -2) {
    arrow = 'down';
    color = 'var(--dsw-alias-state-error-primary)';
    text = delta.toFixed(0) + '%';
  }
  return (
    <div className={cx(styles.statgrow, styles.fadein)} style={{ color }}>
      <span className={cx(styles.arrow, ARROW_CLASS[arrow])} />
      <span>{text + '（对比前 7 天）'}</span>
    </div>
  );
}

function StreakBar(props: { current: number; best: number }): any {
  const pct = props.best > 0 ? Math.min(100, (props.current / props.best) * 100) : 0;
  return (
    <div className={styles.streakbar}>
      <span
        className={styles.streakfill}
        style={{
          width: pct.toFixed(1) + '%',
          background:
            'linear-gradient(90deg, var(--dsw-alias-state-business-primary), color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, transparent))',
        }}
      />
    </div>
  );
}

function DaysRibbon(props: { byDay: Map<string, unknown> }): any {
  const byDay = props.byDay;
  if (byDay === undefined || byDay.size === 0) return null;
  const keys = sorted(Array.from(byDay.keys()));
  const firstT = fromKey(keys[0] as string),
    lastT = fromKey(keys[keys.length - 1] as string);
  const NB = Math.min(Math.max(1, Math.round((lastT - firstT) / (30.44 * 86400000)) + 1), 24);
  const buckets: Array<{ active: number; total: number }> = [];
  for (let i = 0; i < NB; i++) buckets.push({ active: 0, total: 0 });
  for (let m = firstT; m <= lastT; m += 86400000) {
    const b = Math.min(NB - 1, Math.floor(((m - firstT) / (lastT - firstT || 1)) * NB));
    (buckets[b] as { active: number; total: number }).total++;
    if (byDay.has(keyOf(m))) (buckets[b] as { active: number; total: number }).active++;
  }
  return (
    <div className={styles.dayscroll}>
      {buckets.map((b, i) => {
        const ratio = b.total > 0 ? b.active / b.total : 0;
        return (
          <span
            key={i}
            style={{
              background: BP,
              opacity: ratio === 0 ? 0.08 : 0.15 + ratio * 0.8,
              animationDelay: i * 26 + 'ms',
            }}
          />
        );
      })}
    </div>
  );
}

function DualBars(props: { a: number; b: number; height?: number; className?: string | undefined }): any {
  const { a, b, height } = props;
  const max = Math.max(a, b) || 1;
  const H = height || 14;
  return (
    <div
      className={props.className || ''}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 3,
        height: H + 2,
        marginTop: 3,
      }}
    >
      <span
        className={styles.rise}
        style={{
          width: 9,
          borderRadius: '2px 2px 0 0',
          background: BP,
          display: 'block',
          height: Math.max(2, (a / max) * H).toFixed(1) + 'px',
          animationDelay: '60ms',
        }}
      />
      <span
        className={styles.rise}
        style={{
          width: 9,
          borderRadius: '2px 2px 0 0',
          background: BP,
          opacity: 0.28,
          display: 'block',
          height: Math.max(2, (b / max) * H).toFixed(1) + 'px',
          animationDelay: '150ms',
        }}
      />
    </div>
  );
}

/* ---------- 图表 ---------- */
interface TrendSeries {
  name: string;
  shortName: string;
  color: string;
  isTotal?: boolean;
  values: number[];
  visible: boolean;
}

interface SlotComp {
  i: number;
  o: number;
  cr: number;
  cw: number;
}
function TrendChart(props: {
  series: TrendSeries[];
  labels: string[];
  titles?: string[];
  emptyText?: string;
  /** 每槽位构成（输入/输出/缓存读/写），用于悬浮明细；缺省时只显示模型合计 */
  comp?: Array<SlotComp> | null;
  /** 置于浮窗内时提示上浮到浮窗之上（tm-tip-above），不被浮窗遮挡 */
  above?: boolean;
}): any {
  const seriesList = props.series;
  const labels = props.labels;
  const titles = props.titles || labels;
  const emptyText = props.emptyText || '当日无消耗';
  // 视图坐标系 = 实际像素：viewBox 宽度取容器实测宽度，高度按宽度定档并夹在 [150, 230]。
  // 旧写法是固定 viewBox 780×250 配 width:100% / height:auto —— SVG 会按 viewBox 的
  // 宽高比等比放大：卡片铺满中心区（约 1166px）时整幅图被放大到 374px 高，连 10.5px 的
  // 轴标签、1px 网格线一起被放大到约 1.5 倍，表现就是「图太大、太高、字太大」。
  // 改成 1:1 之后高度不再随宽度增长，字号/线宽回到设计尺寸，30 天也拿到更多横向像素。
  const boxRef = useRef(null as any);
  const [boxW, setBoxW] = useState(0);
  useEffect(() => {
    const el = boxRef.current;
    if (el === null || el === undefined || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries: any[]) => {
      const w = entries && entries[0] ? Math.round(entries[0].contentRect.width) : 0;
      if (w > 0) setBoxW((prev: number) => (prev === w ? prev : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = Math.max(320, boxW || 780);
  // 上限 230：宽屏下不再无限变高；下限 150：浮窗等窄容器里也还看得出趋势
  const H = Math.round(Math.min(230, Math.max(150, W * 0.24)));
  const pl = 54;
  const pr = 14;
  const pt = 6;
  const pb = 28;
  const n = labels.length;
  const vis = seriesList.filter((s) => s.visible);
  const top = niceMax(vis.length > 0 ? Math.max(1, ...vis.flatMap((s) => s.values)) : 1);
  const xs = (i: number): number => (n <= 1 ? pl + (W - pl - pr) / 2 : pl + ((W - pl - pr) * i) / (n - 1));
  const ys = (v: number): number => H - pb - (v / top) * (H - pb - pt);
  const [hover, setHover] = useState<{ i: number; mx: number; my: number } | null>(null);
  const svgRef = useRef(null);
  const onMove = (e: any): void => {
    const i = hoverIndex(svgRef, e, W, pl, pr, n);
    if (i !== null) setHover({ i, mx: e.clientX, my: e.clientY });
  };
  const kids: any[] = [];
  for (const fr of [0, 0.25, 0.5, 0.75, 1]) {
    const yy = ys(top * fr);
    kids.push(<line key={'g' + fr} x1={pl} x2={W - pr} y1={yy} y2={yy} className={styles.gridln} />);
    kids.push(
      <text key={'gt' + fr} x={pl - 8} y={yy + 4} textAnchor="end" className={styles.axislbl}>
        {fmt(top * fr)}
      </text>,
    );
  }
  const tickCount = Math.min(n, 9);
  const xt: number[] = [];
  for (let j = 0; j < tickCount; j++) {
    const idx = tickCount <= 1 ? 0 : Math.round((j * (n - 1)) / (tickCount - 1));
    if (xt.length === 0 || xt[xt.length - 1] !== idx) xt.push(idx);
  }
  for (const i of xt) {
    kids.push(
      <text
        key={'x' + i}
        x={xs(i)}
        y={H - 9}
        textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
        className={styles.axislbl}
      >
        {labels[i]}
      </text>,
    );
  }
  if (hover !== null) {
    kids.push(
      <line
        key="ch"
        x1={xs(hover.i)}
        x2={xs(hover.i)}
        y1={pt}
        y2={H - pb}
        style={{ stroke: BP, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.7 }}
      />,
    );
    for (const s of vis) {
      if (s.values[hover.i] === undefined) continue;
      kids.push(
        <circle
          key={'d' + s.name}
          cx={xs(hover.i)}
          cy={ys(s.values[hover.i] as number)}
          r={3.5}
          style={{ fill: s.color, stroke: 'var(--dsw-alias-bg-layer-1)', strokeWidth: 1.5 }}
        />,
      );
    }
  }
  let li = 0;
  for (const s of seriesList) {
    if (!s.visible) continue;
    kids.push(
      <path
        key={'ln' + s.name}
        className={styles.draw}
        d={smoothPath(s.values.map((v, i) => [xs(i), ys(v)] as [number, number]))}
        fill="none"
        style={{
          stroke: s.color,
          strokeWidth: s.isTotal ? 2.6 : 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          opacity: s.isTotal ? 1 : 0.92,
          animationDelay: 0.15 + li * 0.09 + 's',
        }}
      />,
    );
    li++;
  }
  kids.push(
    <rect
      key="cap"
      x={0}
      y={0}
      width={W}
      height={H}
      fill="transparent"
      style={{ cursor: 'crosshair' }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    />,
  );
  const tip =
    hover !== null
      ? (() => {
          const active = vis.filter((s) => ((s.values[hover.i] as number) || 0) > 0);
          const rows = sorted(
            active,
            (a, b) => ((b.values[hover.i] as number) || 0) - ((a.values[hover.i] as number) || 0),
          );
          const comp = props.comp ? (props.comp[hover.i] as SlotComp | undefined) : undefined;
          const compTotal = comp ? comp.i + comp.o + comp.cr + comp.cw : 0;
          const pos = tipPos(hover.mx, hover.my, 270, (comp ? 98 : 44) + rows.length * 18);
          return tmPortal(
            <div className={cx(styles.tipfixed, props.above ? styles.tipAbove : undefined)} style={pos}>
              <div className={styles.tiprow} style={{ fontWeight: 600, marginBottom: 2 }}>
                {titles[hover.i]}
              </div>
              {comp ? (
                <div className={styles.tiprow}>
                  <span className={styles.tipK}>{'总 Token'}</span>
                  <span className={styles.tipV}>{fmt(compTotal)}</span>
                </div>
              ) : null}
              {comp ? (
                <div className={styles.tiprow}>
                  <span className={styles.tipK}>{'输入 / 输出'}</span>
                  <span className={styles.tipV}>{fmt(comp.i) + ' / ' + fmt(comp.o)}</span>
                </div>
              ) : null}
              {comp ? (
                <div className={styles.tiprow} style={{ marginBottom: rows.length > 0 ? 4 : 0 }}>
                  <span className={styles.tipK}>{'缓存读 / 写'}</span>
                  <span className={styles.tipV}>{fmt(comp.cr) + ' / ' + fmt(comp.cw)}</span>
                </div>
              ) : null}
              {rows.length > 0 ? (
                rows.map((s) => (
                  <div key={s.name} className={styles.tiprow}>
                    <span className={styles.dot} style={{ background: s.color, width: 8, height: 8 }} />
                    <span
                      className={styles.tipK}
                      style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {s.shortName}
                    </span>
                    <span className={styles.tipV}>{fmt((s.values[hover.i] as number) || 0)}</span>
                  </div>
                ))
              ) : comp ? null : (
                <div className={styles.tiprow} style={{ color: 'var(--dsw-alias-label-tertiary)' }}>
                  {emptyText}
                </div>
              )}
            </div>,
          );
        })()
      : null;
  return (
    <div className={styles.svgwrap} ref={boxRef}>
      <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: H, display: 'block' }} ref={svgRef}>
        {kids}
      </svg>
      {tip}
    </div>
  );
}

function Heatmap(props: {
  byDay: Map<string, DayAgg>;
  daySessions?: Record<string, number>;
  models?: Record<string, { model: string }>;
  months?: number;
  above?: boolean;
  /** 卡片实测宽度：决定格子间隙（宽了给更多呼吸，窄了收紧） */
  boxW?: number;
}): any {
  const byDay = props.byDay;
  const daySessions = props.daySessions || {};
  const months = props.months || 6;
  const today = keyOf(Date.now());
  const todayT = fromKey(today);
  let startW = todayT - Math.max(1, months) * 31 * 86400000;
  const dow0 = new Date(startW).getDay();
  startW = startW - ((dow0 + 6) % 7) * 86400000;
  const weeks = Math.max(1, Math.ceil((todayT - startW) / 604800000));
  const cols: Array<Array<{ k: string; v: number; day: DayAgg | undefined; sess: number } | null>> = [];
  let max = 1;
  for (let w = 0; w < weeks; w++) {
    const col: Array<{ k: string; v: number; day: DayAgg | undefined; sess: number } | null> = [];
    for (let r = 0; r < 7; r++) {
      const k = keyOf(startW + w * 604800000 + r * 86400000);
      if (k > today) {
        col.push(null);
        continue;
      }
      const day = byDay.get(k);
      const v = day === undefined ? 0 : day.t;
      col.push({ k, v, day, sess: (daySessions[k] as number) || 0 });
      if (v > max) max = v;
    }
    cols.push(col);
  }
  const OPS = [0.16, 0.3, 0.5, 0.72, 0.95];
  const levelOf = (v: number): number =>
    v <= 0 ? 0 : v <= max * 0.25 ? 1 : v <= max * 0.5 ? 2 : v <= max * 0.75 ? 3 : 4;
  // 格子间隙：横竖用同一个值（旧版 12 个月时行距被压成 0，7 行糊成一片竖条）。
  // 宽度越大给越多呼吸 —— 宽度来自卡片实测宽度。
  const boxW = props.boxW || 0;
  const cellGap = boxW >= 1120 ? 4 : boxW >= 860 ? 3 : 2;
  const rowGap = cellGap;
  const [hover, setHover] = useState<{
    k: string;
    day: DayAgg;
    sess: number;
    mx: number;
    my: number;
  } | null>(null);
  const onCell = (
    cell: { k: string; v: number; day: DayAgg | undefined; sess: number } | null,
    e: any,
  ): void => {
    if (cell === null || cell.day === undefined) {
      setHover(null);
      return;
    }
    setHover({ k: cell.k, day: cell.day, sess: cell.sess, mx: e.clientX, my: e.clientY });
  };
  const WL = ['一', '二', '三', '四', '五', '六', '日'];
  const rows: any[] = [];
  for (let r = 0; r < 7; r++) {
    const cells: any[] = [];
    for (let w = 0; w < weeks; w++) {
      const cell = (cols[w] as Array<{ k: string; v: number; day: DayAgg | undefined; sess: number } | null>)[
        r
      ] as { k: string; v: number; day: DayAgg | undefined; sess: number } | null;
      cells.push(
        <div
          key={w}
          className={styles.hcell}
          data-lv={
            cell === null || (cell as { v: number }).v <= 0 ? '0' : String(levelOf((cell as { v: number }).v))
          }
          style={
            cell === null
              ? { visibility: 'hidden' }
              : (cell as { v: number }).v > 0
                ? {
                    background: BP,
                    opacity: OPS[levelOf((cell as { v: number }).v)],
                    animationDelay: ((w * 45) % 480) + 'ms',
                  }
                : undefined
          }
          onMouseEnter={cell ? (e: any) => onCell(cell, e) : undefined}
          onMouseMove={cell ? (e: any) => onCell(cell, e) : undefined}
          onMouseLeave={() => setHover(null)}
        />,
      );
    }
    rows.push(
      <div key={r} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span
          style={{
            width: 14,
            fontSize: 9,
            color: 'var(--dsw-alias-label-caption)',
            flex: 'none',
            textAlign: 'center',
            // line-height 用 1（≈9px）而不是固定的 14px：窄卡片里格子可能只有
            // 11px 高，固定 14px 会把行高顶大、行间隙看起来忽大忽小。
            lineHeight: 1,
          }}
        >
          {r % 2 === 0 ? WL[r] : ''}
        </span>
        <div className={styles.heatrow} style={{ gap: cellGap + 'px' }}>
          {cells}
        </div>
      </div>,
    );
  }
  const monthLabels: Array<{ w: number; mo: number }> = [];
  let prevM: number | null = null;
  for (let w = 0; w < weeks; w++) {
    const mo = Number(keyOf(startW + w * 604800000).slice(5, 7));
    if (mo !== prevM) {
      monthLabels.push({ w, mo });
      prevM = mo;
    }
  }
  // 月份标签：与格子共用同一个网格（按周列数切分），每个标签钉在自己那个月的
  // 第一周列上并向右侧跨几列。旧写法是「每个标签定宽 100/weeks% + flex:none」，
  // 于是十几个标签只会挤在左边四分之一处，和下面的月份列对不上。
  const monthRow = (
    <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
      <span style={{ width: 14, flex: 'none' }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(' + weeks + ',minmax(0,1fr))',
          gap: cellGap + 'px',
          flex: '1 1 auto',
          minHeight: 12,
        }}
      >
        {monthLabels.map((m, i) => (
          <span
            key={i}
            style={{
              gridColumn: m.w + 1 + ' / span ' + Math.max(1, Math.min(4, weeks - m.w)),
              fontSize: 9.5,
              lineHeight: '12px',
              color: 'var(--dsw-alias-label-caption)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {m.mo + '月'}
          </span>
        ))}
      </div>
    </div>
  );
  let pop: any = null;
  if (hover !== null) {
    const d = hover.day;
    const entries = sorted(Object.entries(d.byModel || {}), (a, b) => (b[1] as number) - (a[1] as number));
    const tot = d.t;
    const cache = (d.cr || 0) + (d.cw || 0);
    const cachePct = tot > 0 ? (cache / tot) * 100 : 0;
    // 高度估算：标题 + 总消耗/会话 + 输入/输出 + 缓存读/写两行 + 模型行
    const pos = tipPos(hover.mx, hover.my, 300, 134 + Math.min(entries.length, 8) * 18);
    pop = tmPortal(
      <div className={cx(styles.pop, props.above ? styles.tipAbove : undefined)} style={pos}>
        <div className={styles.popTitle}>{cnDate(hover.k)}</div>
        <div className={styles.popRow} style={{ marginBottom: 2 }}>
          <span className={styles.popK}>{'总消耗'}</span>
          <span className={styles.popV}>{fmt(tot)}</span>
          <span className={styles.popK} style={{ paddingLeft: 12 }}>
            {'会话'}
          </span>
          <span className={styles.popV}>{String(hover.sess)}</span>
        </div>
        <div className={styles.popRow}>
          <span className={styles.popK}>{'输入 / 输出'}</span>
          <span className={styles.popV}>{fmt(d.i || 0) + ' / ' + fmt(d.o || 0)}</span>
        </div>
        <div className={styles.popRow}>
          {/* 缓存：读/写各自占比条（与模型占比条同样式），数值 + 占当日总量比例 */}
          <span className={styles.popK}>{'缓存读'}</span>
          <span className={styles.popBar}>
            <span
              className={styles.popFill}
              style={{
                width: (tot > 0 ? ((d.cr || 0) / tot) * 100 : 0).toFixed(1) + '%',
                background: '#f5a623',
              }}
            />
          </span>
          <span className={styles.popV}>
            {fmt(d.cr || 0) + ' · ' + (tot > 0 ? (((d.cr || 0) / tot) * 100).toFixed(0) : 0) + '%'}
          </span>
        </div>
        <div className={styles.popRow} style={{ marginBottom: entries.length > 0 ? 4 : 0 }}>
          <span className={styles.popK}>{'缓存写'}</span>
          <span className={styles.popBar}>
            <span
              className={styles.popFill}
              style={{
                width: (tot > 0 ? ((d.cw || 0) / tot) * 100 : 0).toFixed(1) + '%',
                background: '#9a6ef1',
              }}
            />
          </span>
          <span className={styles.popV}>{fmt(d.cw || 0) + ' · 占比 ' + cachePct.toFixed(1) + '%'}</span>
        </div>
        {tot > 0 ? (
          entries.slice(0, 8).map(([mk, v]) => {
            const info = ((props.models || {}) as Record<string, { model: string }>)[mk];
            const color = modelColor(mk);
            return (
              <div key={mk} className={styles.popRow}>
                <span className={styles.dot} style={{ background: color }} />
                <span
                  style={{
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {info ? info.model : mk}
                </span>
                <span className={styles.popBar}>
                  <span
                    className={styles.popFill}
                    style={{
                      width: (tot > 0 ? ((v as number) / tot) * 100 : 0).toFixed(1) + '%',
                      background: color,
                    }}
                  />
                </span>
                <span className={styles.popV}>
                  {fmt(v as number) + ' · ' + (tot > 0 ? (((v as number) / tot) * 100).toFixed(0) : 0) + '%'}
                </span>
              </div>
            );
          })
        ) : (
          <div className={styles.popK}>{'当日无用量'}</div>
        )}
        {entries.length > 8 ? (
          <div className={styles.popK} style={{ marginTop: 4 }}>
            {'…另有 ' + (entries.length - 8) + ' 个模型'}
          </div>
        ) : null}
      </div>,
    );
  }
  return (
    <div className={styles.heatwrap}>
      {monthRow}
      <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap + 'px' }}>{rows}</div>
      {pop}
    </div>
  );
}

function Donut(props: { entries: Array<{ name: string; t: number; color: string }>; total: number }): any {
  const entries = props.entries;
  const total = props.total;
  const size = 168,
    // 圆心 x 叫 dcx：模块级已有拼类名的 cx()（原实现没有）。改名只为避开 oxlint no-shadow，取值不变。
    dcx = 84,
    cy = 84,
    r = 57,
    C = 2 * Math.PI * r;
  const kids: any[] = [
    <circle
      key="bg"
      cx={dcx}
      cy={cy}
      r={r}
      fill="none"
      style={{ stroke: 'var(--dsw-alias-interactive-bg-hover)', strokeWidth: 18 }}
    />,
  ];
  let acc = 0;
  for (let i = 0; i < entries.length; i++) {
    const it = entries[i] as { t: number; color: string };
    const len = total > 0 ? (it.t / total) * C : 0;
    kids.push(
      <circle
        key={'s' + i}
        cx={dcx}
        cy={cy}
        r={r}
        fill="none"
        className={styles.donutseg}
        strokeDasharray={len.toFixed(2) + ' ' + (C - len).toFixed(2)}
        strokeDashoffset={(-acc).toFixed(2)}
        style={{ stroke: it.color, strokeWidth: 18, animationDelay: i * 70 + 'ms' }}
        transform={'rotate(-90 ' + dcx + ' ' + cy + ')'}
      />,
    );
    acc += len;
  }
  return (
    <div className={styles.donutBox} style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox={'0 0 ' + size + ' ' + size} style={{ width: '100%', height: '100%', display: 'block' }}>
        {kids}
      </svg>
      <AnimatedNumber className={styles.donutC} value={total} format={fmt} />
      <div className={styles.donutCap}>{'累计 Token'}</div>
    </div>
  );
}

function TodayChart(props: { series: TrendSeries[]; n: number; labels?: string[]; floatTip?: boolean }): any {
  const seriesList = props.series;
  const n = props.n;
  const tickLabels = props.labels || null;
  const W = 160,
    H = 44,
    PAD = 3;
  const [hover, setHover] = useState<{ i: number; mx: number; my: number } | null>(null);
  const svgRef = useRef(null);
  if (n < 2 || seriesList.length === 0) return null;
  const maxV = Math.max(1, ...seriesList.flatMap((s) => s.values));
  const xs = (i: number): number => PAD + ((W - PAD * 2) * i) / (n - 1);
  const ys = (v: number): number => H - PAD - (v / maxV) * (H - PAD * 2);
  const onMove = (e: any): void => {
    const i = hoverIndex(svgRef, e, W, PAD, PAD, n);
    if (i !== null) setHover({ i, mx: e.clientX, my: e.clientY });
  };
  const kids: any[] = [];
  if (hover !== null) {
    kids.push(
      <line
        key="ch"
        x1={xs(hover.i)}
        x2={xs(hover.i)}
        y1={PAD}
        y2={H - PAD}
        style={{ stroke: BP, strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.7 }}
      />,
    );
  }
  for (let si = 0; si < seriesList.length; si++) {
    const s = seriesList[si] as TrendSeries;
    kids.push(
      <path
        key={'l' + s.name}
        className={styles.draw}
        d={smoothPath(s.values.map((v, i) => [xs(i), ys(v)] as [number, number]))}
        fill="none"
        style={{
          stroke: s.color,
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          opacity: 0.9,
          animationDelay: 0.1 + si * 0.12 + 's',
        }}
      />,
    );
    kids.push(
      <circle
        key={'e' + s.name}
        cx={xs(n - 1)}
        cy={ys((s.values[n - 1] as number) || 0)}
        r={1.8}
        className={styles.fadein}
        style={{ fill: s.color, animationDelay: 0.55 + si * 0.12 + 's' }}
      />,
    );
    if (hover !== null) {
      kids.push(
        <circle
          key={'h' + s.name}
          cx={xs(hover.i)}
          cy={ys((s.values[hover.i] as number) || 0)}
          r={2.2}
          style={{ fill: s.color, stroke: 'var(--dsw-alias-bg-layer-1)', strokeWidth: 1 }}
        />,
      );
    }
  }
  kids.push(
    <rect
      key="cap"
      x={0}
      y={0}
      width={W}
      height={H}
      fill="transparent"
      style={{ cursor: 'crosshair' }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    />,
  );
  const tip =
    hover !== null
      ? (() => {
          const active = seriesList.filter((s) => ((s.values[hover.i] as number) || 0) > 0);
          const pos = tipPos(hover.mx, hover.my, 170, 34 + active.length * 16);
          return tmPortal(
            <div
              className={cx(styles.tipfixed, props.floatTip === true ? styles.tipfloat : undefined)}
              style={{ ...pos, fontSize: 10.5 }}
            >
              <div style={{ fontWeight: 600 }}>
                {tickLabels !== null ? (tickLabels[hover.i] as string) : hover.i + ':00'}
              </div>
              {active.length > 0 ? (
                sorted(
                  active,
                  (a, b) => ((b.values[hover.i] as number) || 0) - ((a.values[hover.i] as number) || 0),
                ).map((s) => (
                  <div key={s.name} className={styles.tiprow}>
                    <span className={styles.dot} style={{ background: s.color, width: 6, height: 6 }} />
                    <span
                      className={styles.tipK}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}
                    >
                      {s.shortName}
                    </span>
                    <span className={styles.tipV}>{fmt((s.values[hover.i] as number) || 0)}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--dsw-alias-label-tertiary)' }}>{'该小时无消耗'}</div>
              )}
            </div>,
          );
        })()
      : null;
  return (
    <div className={styles.svgwrap}>
      <svg className={styles.spark} viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" ref={svgRef}>
        {kids}
      </svg>
      {tip}
    </div>
  );
}

function RangeSelect(props: {
  options: Array<{ v: string; t: string }>;
  value: string;
  onPick: (v: string) => void;
}): any {
  const [open, setOpen] = useState(false);
  const hit = (props.options || []).filter((o) => o.v === props.value)[0];
  const selector = (
    <button
      type="button"
      className={styles.selector}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((v: boolean) => !v)}
    >
      <span className={styles.selectorLabel}>{hit ? hit.t : props.value}</span>
      {IconChevronDownOutlineRegular ? (
        <IconChevronDownOutlineRegular className={styles.chevron} />
      ) : (
        <span className={styles.chevron}>{'▾'}</span>
      )}
    </button>
  );
  return (
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      items={(props.options || []).map((o) => ({ id: o.v, label: o.t }))}
      selectedId={props.value}
      onSelect={(id: string) => {
        setOpen(false);
        props.onPick(id);
      }}
      align="end"
      portal={true}
      anchor={selector}
    />
  );
}

/* ---------- 跨组件共享统计快照（中心区面板与 widget 浮窗共用一次拉取，60s 可见即刷） ---------- */
const shared: {
  data: StatsSnapshot | null;
  err: string;
  at: number;
  inflight: Promise<StatsSnapshot | null> | null;
  subs: Set<() => void>;
} = { data: null, err: '', at: 0, inflight: null, subs: new Set() };
function notifyShared(): void {
  for (const fn of shared.subs) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
function writeShared(data: StatsSnapshot): void {
  shared.data = data;
  shared.err = '';
  shared.at = Date.now();
  notifyShared();
}
function ensureSharedStats(force?: boolean): Promise<StatsSnapshot | null> {
  if (!force && shared.data && Date.now() - shared.at < 45000) return Promise.resolve(shared.data);
  if (shared.inflight) return shared.inflight;
  const p = fetchStats()
    .then((v) => {
      shared.inflight = null;
      if (v && (v as StatsSnapshot).ready === true) writeShared(v as StatsSnapshot);
      else {
        shared.err = String((v as any)?.error || '统计服务不可用');
        notifyShared();
      }
      return shared.data;
    })
    .catch(() => {
      shared.inflight = null;
      shared.err = '连接失败';
      notifyShared();
      return shared.data;
    });
  shared.inflight = p;
  return p;
}

/**
 * 共享统计快照（60s 可见即刷）：在线时长面板复用它，避免两套轮询各打一次 /stats。
 */
export function useSharedStats(): {
  data: StatsSnapshot | null;
  err: string;
  loading: boolean;
  reload: (force?: boolean) => void;
} {
  const [, forceUpdate] = (useReducer as any)((x: number) => x + 1, 0);
  useEffect(() => {
    const fn = (): void => forceUpdate();
    shared.subs.add(fn);
    if (!shared.data && !shared.inflight) void ensureSharedStats();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void ensureSharedStats();
    }, 60000);
    return () => {
      shared.subs.delete(fn);
      window.clearInterval(id);
    };
  }, []);
  return {
    data: shared.data,
    err: shared.err,
    loading: !shared.data && !!shared.inflight,
    reload: (force?: boolean) => void ensureSharedStats(force),
  };
}

/** 小组件开关按钮：widgets 系统存在且传入 widgetId 时渲染。
 * 侧栏中显示 ⧉弹出，浮出后同一位置显示 回归（WidgetToggle 按 open 状态切换）。 */
function widgetBtns(widgets: any, widgetId: string | undefined): ReactNode {
  if (!widgets || !widgetId || !widgets.WidgetToggle) return null;
  return <widgets.WidgetToggle id={widgetId} />;
}

/** 该小组件是否已浮出：已浮出时原位（inPlace）不渲染，避免同一内容出现两份。
 * 浮窗实例不传 inPlace，因此照常渲染并自带「回归」。 */
function useWidgetOpen(widgets: any, widgetId: string | undefined): boolean {
  const list =
    widgets && typeof widgets.useWidgets === 'function'
      ? (widgets.useWidgets() as Array<{ id: string }>)
      : [];
  return !!(widgetId && list.some((w) => w.id === widgetId));
}

/** 「已浮出时原位不渲染」包装器 props。 */
interface HiddenWhenFloatedProps {
  widgets?: any;
  id: string;
  children?: ReactNode;
}

/** 已浮出时原位不渲染的包装器（内容自带各自的开关按钮） */
export function HiddenWhenFloated(props: HiddenWhenFloatedProps): ReactNode {
  const open = useWidgetOpen(props.widgets, props.id);
  if (open) return null;
  return props.children === undefined ? null : props.children;
}

/* ---------- 独立 section 组件（中心区面板与 widget 浮窗共用） ---------- */

/** 指标卡组 props（中心区面板 / widget 浮窗 / 分享卡三处共用）。 */
interface StatCardsSectionProps {
  aggAll: Agg;
  data: StatsSnapshot;
  widgets?: any;
  /** 浮窗 id：整体展开 `w` 时会带出 undefined，故显式接纳 */
  widgetId?: string | undefined;
  inFloat?: boolean;
  inPlace?: boolean;
}

/** 指标卡组（全量 + 可视化 + 悬浮构成） */
export function StatCardsSection(props: StatCardsSectionProps): ReactNode {
  const aggAll = props.aggAll;
  const data = props.data;
  const [pop, setPop] = useState<{ mx: number; my: number; content: any } | null>(null);
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const leave = (): void => setPop(null);
  const todayK = keyOf(Date.now());
  const st = streaks(aggAll.byDay);
  let peakDay: DayAgg | null = null;
  for (const day of aggAll.byDay.values()) {
    if (peakDay === null || day.t > peakDay.t) peakDay = day;
  }
  const dayVals = Array.from(aggAll.byDay.values()).map((d) => d.t);
  const avgDay = dayVals.length > 0 ? aggAll.total / dayVals.length : 0;
  const medDay = median(dayVals);
  const allDays = buildDayList(aggAll.first as string, todayK);
  const dayVal = (k: string): number => {
    const d = aggAll.byDay.get(k);
    return d === undefined ? 0 : d.t;
  };
  const sparkVals = allDays.slice(-30).map(dayVal);
  const last7 = allDays.slice(-7).reduce((s, k) => s + dayVal(k), 0);
  const prev7 = allDays.slice(-14, -7).reduce((s, k) => s + dayVal(k), 0);
  const CI = '#4c7ef3',
    CO = '#2fb261',
    CC = '#f5a623';
  const cards: any[] = [];
  cards.push(
    <StatCard
      key="kpi-累计 Token"
      icon="layers"
      label="累计 Token"
      count={aggAll.total}
      tint={true}
      sub={'输入 ' + fmt(aggAll.i) + ' · 输出 ' + fmt(aggAll.o)}
      delay={cards.length * 45}
      onHover={(e: any) =>
        setPop({
          mx: e.clientX,
          my: e.clientY,
          content: breakdown('累计构成', [
            ['输入', aggAll.i, 1, aggAll.total],
            ['输出', aggAll.o, 1, aggAll.total],
            ['缓存读', aggAll.cr, 1, aggAll.total],
            ['缓存写', aggAll.cw, 1, aggAll.total],
          ]),
        })
      }
      onLeave={leave}
      visual={[
        <ComposeBar
          parts={[
            ['输入', aggAll.i, CI],
            ['输出', aggAll.o, CO],
            ['缓存读', aggAll.cr, CC],
            ['缓存写', aggAll.cw, '#9a6ef1'],
          ]}
        />,
      ]}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-近 30 天走势"
      icon="trend"
      label="近 30 天走势"
      count={sparkVals.reduce((s, v) => s + v, 0)}
      sub="每日用量迷你图"
      delay={cards.length * 45}
      visual={[<Sparkline values={sparkVals} />, <TrendDelta recent={last7} before={prev7} />]}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-缓存 Token"
      icon="database"
      label="缓存 Token"
      count={aggAll.cr + aggAll.cw}
      sub={'命中 ' + fmt(aggAll.cr) + ' · 写入 ' + fmt(aggAll.cw)}
      delay={cards.length * 45}
      onHover={(e: any) =>
        setPop({
          mx: e.clientX,
          my: e.clientY,
          content: breakdown(
            '缓存构成 · 命中率 ' +
              (aggAll.total > 0 ? ((aggAll.cr / aggAll.total) * 100).toFixed(1) : '0.0') +
              '%',
            [
              ['缓存读（命中）', aggAll.cr, 1, aggAll.total],
              ['缓存写', aggAll.cw, 1, aggAll.total],
            ],
          ),
        })
      }
      onLeave={leave}
      visual={[
        <ComposeBar
          parts={[
            ['缓存读', aggAll.cr, CC],
            ['缓存写', aggAll.cw, '#9a6ef1'],
          ]}
        />,
      ]}
    />,
  );
  cards.push(
    data.peakStep ? (
      <StatCard
        key="kpi-峰值单次请求"
        icon="bolt"
        label="峰值单次请求"
        count={(data.peakStep as { tokens: number }).tokens}
        sub={
          (data.peakStep as { model: string; d: string }).model +
          ' · ' +
          dispDay((data.peakStep as { d: string }).d)
        }
        delay={cards.length * 45}
      />
    ) : null,
  );
  cards.push(
    peakDay ? (
      <StatCard
        key="kpi-峰值单日"
        icon="mountain"
        label="峰值单日"
        count={(peakDay as DayAgg).t}
        sub={dispDay((peakDay as DayAgg).d)}
        delay={cards.length * 45}
        onHover={(e: any) =>
          setPop({
            mx: e.clientX,
            my: e.clientY,
            content: breakdown(
              (peakDay as DayAgg).d + ' 各模型',
              sorted(
                Object.entries((peakDay as DayAgg).byModel || {}),
                (a, b) => (b[1] as number) - (a[1] as number),
              )
                .slice(0, 6)
                .map(
                  ([mk, v]) =>
                    [mk, v as number, 1, (peakDay as DayAgg).t] as [string, number, number, number],
                ),
            ),
          })
        }
        onLeave={leave}
        visual={[
          <ComposeBar
            parts={sorted(
              Object.entries((peakDay as DayAgg).byModel || {}),
              (a, b) => (b[1] as number) - (a[1] as number),
            )
              .slice(0, 4)
              .map(([mk, v]) => {
                const info = (data.models as Record<string, { model: string }>)[mk];
                return [info ? info.model : mk, v as number, modelColor(mk)] as [string, number, string];
              })}
          />,
        ]}
      />
    ) : null,
  );
  cards.push(
    <StatCard
      key="kpi-日均消耗"
      icon="wave"
      label="日均消耗"
      count={avgDay}
      sub="按活跃日平均"
      delay={cards.length * 45}
      visual={[<Sparkline values={sparkVals} color={CO} />]}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-日消耗中位数"
      icon="median"
      label="日消耗中位数"
      count={medDay}
      sub="按活跃日取中位"
      delay={cards.length * 45}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-当前连续使用"
      icon="flame"
      label="当前连续使用"
      count={st.current}
      fmt={(v: number) => fmt(v) + ' 天'}
      sub="按自然日统计"
      delay={cards.length * 45}
      visual={[<StreakBar current={st.current} best={st.longest} />]}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-最长连续使用"
      icon="trophy"
      label="最长连续使用"
      count={st.longest}
      fmt={(v: number) => fmt(v) + ' 天'}
      sub="历史最佳纪录"
      delay={cards.length * 45}
      visual={[<StreakBar current={st.current} best={st.longest} />]}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-活跃天数"
      icon="calendar"
      label="活跃天数"
      count={aggAll.byDay.size}
      fmt={(v: number) => fmt(v) + ' 天'}
      sub={'共 ' + data.sessions + ' 个会话'}
      delay={cards.length * 45}
      visual={[<DaysRibbon byDay={aggAll.byDay} />]}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-模型调用次数"
      icon="chip"
      label="模型调用次数"
      count={aggAll.n}
      sub={data.active + ' 个会话有用量'}
      delay={cards.length * 45}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-首次使用"
      icon="flag"
      label="首次使用"
      value={dispDay(aggAll.first as string)}
      sub={aggAll.first}
    />,
  );
  cards.push(
    <StatCard
      key="kpi-最近使用"
      icon="clock"
      label="最近使用"
      value={dispDay(aggAll.last as string)}
      sub={aggAll.last}
    />,
  );
  // 悬浮/小组件按钮直接进标题行，不再单独占一行
  const toolbar = props.widgets && props.widgetId ? widgetBtns(props.widgets, props.widgetId) : null;
  // 外层卡片容器：浮窗/中心区内指标卡组都是"一张不透明卡片"（内部各指标卡自带层次）。
  // 旧写法是 `'tm-card tm-statcards'`，但 `tm-statcards` 在旧 styles.ts 里**根本没有规则**
  // （已 grep 确认），CSS Module 化后写 `styles.statcards` 会被 check-css-modules.mjs 判
  // 「用了但没定义」，故按 skill-manager `sm-section` / file-change-viewer `fcv-toolRow`
  // 的先例去掉这个无规则标记类：元素与 `tm-card` 保留，渲染结果不变。
  return (
    <div className={styles.card}>
      <div className={styles.chartTitle}>
        {cardName('layers', '基础数据')}
        <span className={styles.hint}>{'全部会话日志聚合 · 悬浮指标卡看构成明细'}</span>
        {toolbar}
      </div>
      <div className={styles.grid}>{cards}</div>
      {pop !== null
        ? tmPortal(
            <div
              className={cx(styles.pop, props.inFloat ? styles.tipAbove : undefined)}
              style={tipPos(pop.mx, pop.my, 280, 60)}
            >
              {pop.content}
            </div>,
          )
        : null}
    </div>
  );
}

/** 趋势图卡 props。 */
interface TrendSectionProps {
  data: StatsSnapshot;
  aggAll: Agg;
  widgets?: any;
  /** 浮窗 id：整体展开 `w` 时会带出 undefined，故显式接纳 */
  widgetId?: string | undefined;
  inFloat?: boolean;
  inPlace?: boolean;
}

/** 趋势图卡（24h 按小时 / 7d·30d 按天 + 模型筛选，自带档位状态；悬浮带构成明细） */
export function TrendSection(props: TrendSectionProps): ReactNode {
  const data = props.data;
  const aggAll = props.aggAll;
  const [trendRange, setTrendRange] = useState('30d');
  const [modelOff, setModelOff] = useState<Record<string, boolean>>({});
  const [showTotal, setShowTotal] = useState(false);
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const todayK = keyOf(Date.now());
  const newComp = (): SlotComp => ({ i: 0, o: 0, cr: 0, cw: 0 });
  let trendLabels: string[], trendTitles: string[], trendEmpty: string;
  let slotComp: SlotComp[];
  const trendSeries: TrendSeries[] = [];
  if (trendRange === '24h') {
    const endH = new Date();
    endH.setMinutes(0, 0, 0);
    const slots: Array<{ d: string; h: number }> = [];
    for (let k = 23; k >= 0; k--) {
      const t = endH.getTime() - k * 3600000;
      slots.push({ d: keyOf(t), h: new Date(t).getHours() });
    }
    trendLabels = slots.map((s) => (s.d === todayK ? s.h + ':00' : '昨日' + s.h + ':00'));
    trendTitles = slots.map((s) => cnDate(s.d) + ' ' + s.h + ':00–' + (s.h + 1) + ':00');
    trendEmpty = '该小时无消耗';
    const slotIdx = new Map<string, number>();
    for (let i = 0; i < slots.length; i++)
      slotIdx.set(
        (slots[i] as { d: string; h: number }).d + '|' + (slots[i] as { d: string; h: number }).h,
        i,
      );
    slotComp = Array.from({ length: 24 }, newComp);
    const hourVals = new Map<string, number[]>();
    for (const r of data.records || []) {
      const idx = slotIdx.get(r.d + '|' + r.h);
      if (idx === undefined) continue;
      let arr = hourVals.get(r.m);
      if (arr === undefined) {
        arr = Array.from({ length: 24 }, () => 0);
        hourVals.set(r.m, arr);
      }
      (arr[idx] as number) += tok(r);
      const c = slotComp[idx] as SlotComp;
      c.i += r.i || 0;
      c.o += r.o || 0;
      c.cr += r.cr || 0;
      c.cw += r.cw || 0;
    }
    const hourTotal = Array.from({ length: 24 }, () => 0);
    for (const arr of hourVals.values()) {
      for (let i = 0; i < 24; i++) (hourTotal[i] as number) += arr[i] as number;
    }
    for (const mk of sorted(Array.from(hourVals.keys()))) {
      trendSeries.push({
        name: mk,
        shortName: ((data.models as Record<string, { model: string }>)[mk] || {}).model || mk,
        color: modelColor(mk),
        isTotal: false,
        values: hourVals.get(mk) as number[],
        visible: !modelOff[mk],
      });
    }
    trendSeries.push({
      name: '__total__',
      shortName: '总 Token',
      color: '#8a94a6',
      isTotal: true,
      values: hourTotal,
      visible: showTotal,
    });
  } else {
    const N = trendRange === '7d' ? 7 : 30;
    const dayList = buildDayList(keyOf(fromKey(todayK) - (N - 1) * 86400000), todayK);
    trendLabels = dayList.map(dispDay);
    trendTitles = dayList.map(cnDate);
    trendEmpty = '当日无消耗';
    const dayIdx = new Map<string, number>();
    for (let i = 0; i < dayList.length; i++) dayIdx.set(dayList[i] as string, i);
    slotComp = dayList.map(newComp);
    for (const r of data.records || []) {
      const idx = dayIdx.get(r.d);
      if (idx === undefined) continue;
      const c = slotComp[idx] as SlotComp;
      c.i += r.i || 0;
      c.o += r.o || 0;
      c.cr += r.cr || 0;
      c.cw += r.cw || 0;
    }
    for (const mk of sorted(Array.from(aggAll.byModel.keys()))) {
      trendSeries.push({
        name: mk,
        shortName: ((data.models as Record<string, { model: string }>)[mk] || {}).model || mk,
        color: modelColor(mk),
        isTotal: false,
        values: dayList.map((k) => {
          const d = aggAll.byDay.get(k);
          return d !== undefined && (d.byModel[mk] as number) !== undefined ? (d.byModel[mk] as number) : 0;
        }),
        visible: !modelOff[mk],
      });
    }
    trendSeries.push({
      name: '__total__',
      shortName: '总 Token',
      color: '#8a94a6',
      isTotal: true,
      values: dayList.map((k) => {
        const d = aggAll.byDay.get(k);
        return d === undefined ? 0 : d.t;
      }),
      visible: showTotal,
    });
  }
  const anyVisible = trendSeries.some((s) => s.visible);
  return (
    <div className={styles.card}>
      <div className={styles.chartTitle}>
        {cardName(
          'trend',
          'Token 使用趋势（' +
            (trendRange === '24h' ? '近24小时按小时' : trendRange === '7d' ? '近7天按天' : '近30天按天') +
            ' · 悬浮查看明细）',
        )}
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Seg
            options={[
              { v: '24h', t: '近24小时' },
              { v: '7d', t: '近7天' },
              { v: '30d', t: '近30天' },
            ]}
            current={trendRange}
            onPick={setTrendRange}
          />
          {widgetBtns(props.widgets, props.widgetId)}
        </span>
      </div>
      <div className={styles.legend} style={{ marginBottom: 2, marginTop: 0 }}>
        {trendSeries.map((s) => (
          <button
            key={s.name}
            className={styles.modelchip}
            data-off={s.visible ? '0' : '1'}
            aria-pressed={s.visible ? 'true' : 'false'}
            onClick={() => {
              if (s.name === '__total__') setShowTotal(!showTotal);
              else setModelOff({ ...modelOff, [s.name]: !modelOff[s.name] });
            }}
          >
            <span className={styles.dot} style={{ background: s.color }} />
            <span className={styles.mcName}>{s.shortName}</span>
          </button>
        ))}
        <span className={styles.hint} style={{ marginLeft: 6 }}>
          {'默认隐藏总曲线'}
        </span>
      </div>
      {anyVisible ? (
        <TrendChart
          key={trendRange}
          series={trendSeries}
          labels={trendLabels}
          titles={trendTitles}
          emptyText={trendEmpty}
          comp={slotComp}
          above={props.inFloat === true}
        />
      ) : (
        <div className={styles.empty}>{'全部曲线已隐藏 —— 点击上方标签恢复'}</div>
      )}
    </div>
  );
}

/** 热力图卡 props。 */
interface HeatSectionProps {
  data: StatsSnapshot;
  aggAll: Agg;
  widgets?: any;
  /** 浮窗 id：整体展开 `w` 时会带出 undefined，故显式接纳 */
  widgetId?: string | undefined;
  inFloat?: boolean;
  inPlace?: boolean;
}

/** 热力图卡（1/3/6/12 月，自带档位状态） */
export function HeatSection(props: HeatSectionProps): ReactNode {
  const data = props.data;
  const aggAll = props.aggAll;
  // 只保留 6 / 12 个月。默认值由卡片实测宽度决定（够宽给 12 个月，窄了给 6 个月），
  // 但**用户手动选过就以手动为准**并持久化 —— 一旦手动切换，宽度变化不再改写它。
  const [picked, setPicked] = useState(readHeatSpan());
  const [cardW, setCardW] = useState(0);
  const cardRef = useRef(null as any);
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;
    const read = (): void => {
      const w = Math.round(el.getBoundingClientRect().width);
      setCardW((prev: number) => (prev === w ? prev : w));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 测量前按 12 个月渲染（这一步在首帧绘制之前完成，看不到跳变）
  const span = picked !== '' ? picked : cardW === 0 || cardW >= HEAT_WIDE_PX ? '12' : '6';
  const pickSpan = (v: string): void => {
    setPicked(v);
    try {
      window.localStorage.setItem(HEAT_SPAN_KEY, v);
    } catch {
      /* ignore */
    }
  };
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const HEAT_OPS = [0.16, 0.3, 0.5, 0.72, 0.95];
  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.chartTitle}>
        {cardName('grid', 'Token 活动热力图（悬浮查看当日明细）')}
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Seg
            options={[
              { v: '6', t: '6个月' },
              { v: '12', t: '12个月' },
            ]}
            current={span}
            onPick={pickSpan}
          />
          {widgetBtns(props.widgets, props.widgetId)}
        </span>
      </div>
      <Heatmap
        key={span}
        byDay={aggAll.byDay}
        daySessions={data.daySessions || {}}
        models={data.models}
        months={Number(span)}
        boxW={cardW}
        above={props.inFloat === true}
      />
      <div className={styles.legend}>
        <span className={styles.muted}>{'少'}</span>
        {HEAT_OPS.map((o, i) => (
          <span key={i} className={styles.cell} style={{ background: BP, opacity: o }} />
        ))}
        <span className={styles.muted}>{'多'}</span>
      </div>
      {/* 缓存汇总行（全量）：不悬停也能直接看到缓存读/写与占比 */}
      <div className={styles.cacheRow}>
        <span className={styles.xdot} style={{ background: '#f5a623' }} />
        <span>{'缓存读 ' + fmt(aggAll.cr)}</span>
        <span className={styles.cacheSep}>{'·'}</span>
        <span className={styles.xdot} style={{ background: '#9a6ef1' }} />
        <span>{'缓存写 ' + fmt(aggAll.cw)}</span>
        <span className={styles.cacheSep}>{'·'}</span>
        <span>
          {'缓存占比 ' +
            (aggAll.total > 0 ? (((aggAll.cr + aggAll.cw) / aggAll.total) * 100).toFixed(1) : '0.0') +
            '%'}
        </span>
      </div>
    </div>
  );
}

/** 模型分布卡 props。 */
interface DonutSectionProps {
  data: StatsSnapshot;
  agg: Agg;
  rangeLabel: string;
  widgets?: any;
  /** 浮窗 id：整体展开 `w` 时会带出 undefined，故显式接纳 */
  widgetId?: string | undefined;
  inFloat?: boolean;
  inPlace?: boolean;
  /** 卡片内顶部行（浮窗里的范围 Seg 走这里，而不是卡片外） */
  prepend?: ReactNode;
}

/** 模型分布卡（环形 + 行悬浮构成） */
export function DonutSection(props: DonutSectionProps): ReactNode {
  const data = props.data;
  const sc = props.agg;
  const [pop, setPop] = useState<{ mx: number; my: number; content: any } | null>(null);
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const leave = (): void => setPop(null);
  const arr = sorted(Array.from(sc.byModel.values()), (a, b) => b.t - a.t);
  if (arr.length === 0) return <div className={cx(styles.card, styles.empty)}>{'该范围内暂无模型用量'}</div>;
  const donutEntries = arr.slice(0, 7).map((m) => ({ name: m.m, t: m.t, color: modelColor(m.m) }));
  const rest = arr.slice(7);
  if (rest.length > 0)
    donutEntries.push({ name: '其他', t: rest.reduce((s, m) => s + m.t, 0), color: '#8a94a6' });
  const modelRows = arr.map((m, i) => {
    const info = (data.models as Record<string, { provider: string; model: string }>)[m.m] || null;
    const name = info ? info.model : m.m;
    const color = modelColor(m.m);
    const pct = sc.total > 0 ? (m.t / sc.total) * 100 : 0;
    const hoverContent = (): any =>
      breakdown(m.m + ' 用量构成', [
        ['输入', m.i, 1, m.t],
        ['输出', m.o, 1, m.t],
        ['缓存读', m.cr, 1, m.t],
        ['缓存写', m.cw, 1, m.t],
      ]);
    return (
      <div
        key={m.m}
        className={styles.model}
        onMouseEnter={(e: any) => setPop({ mx: e.clientX, my: e.clientY, content: hoverContent() })}
        onMouseMove={(e: any) => setPop({ mx: e.clientX, my: e.clientY, content: hoverContent() })}
        onMouseLeave={leave}
      >
        <span className={styles.dot} style={{ background: color }} />
        <div style={{ minWidth: 0, flex: '1' }}>
          <div className={styles.modelhead}>
            <span className={styles.modelname}>{name}</span>
            <span className={styles.modelval}>{fmt(m.t) + ' · ' + pct.toFixed(1) + '%'}</span>
          </div>
          <div className={styles.bartrack}>
            <span
              className={styles.barfill}
              style={{
                // 进度条与同一行印出的百分比**必须同口径**：都占总量（sc.total），
                // 也就是环形图那一段的占比。旧写法除以 `arr[0]`（榜首模型），于是第一名
                // 的条永远满格、旁边却写着 53.3%，同一行里两个分母，看着就是"对不上"。
                // 顺带：这样每行的条长与上方圆环里对应的扇区长度也一致了。
                width: Math.min(100, Math.max(0, pct)).toFixed(1) + '%',
                background: color,
                animationDelay: i * 40 + 120 + 'ms',
              }}
            />
          </div>
          <div className={cx(styles.muted, styles.modeldetail)}>
            {(info && info.provider ? info.provider + ' · ' : '') +
              '输入 ' +
              fmt(m.i) +
              ' · 输出 ' +
              fmt(m.o) +
              ' · 缓存 ' +
              fmt(m.cr + m.cw) +
              ' · ' +
              fmtFull(m.n) +
              ' 次'}
          </div>
        </div>
      </div>
    );
  });
  return (
    <div className={styles.card}>
      {props.prepend ? props.prepend : null}
      <div className={styles.chartTitle}>
        {cardName('donut', '模型用量分布（' + props.rangeLabel + ' · 悬浮查看构成）')}
        {widgetBtns(props.widgets, props.widgetId)}
      </div>
      <div className={styles.flexrow}>
        <Donut entries={donutEntries} total={sc.total} />
        <div className={styles.models}>{modelRows}</div>
      </div>
      {pop !== null
        ? tmPortal(
            <div
              className={cx(styles.pop, props.inFloat ? styles.tipAbove : undefined)}
              style={tipPos(pop.mx, pop.my, 280, 60)}
            >
              {pop.content}
            </div>,
          )
        : null}
    </div>
  );
}

/** 独立图表小组件 props（widget 浮窗内容）。 */
interface StatsWidgetProps {
  kind: string;
  widgets?: any;
  /** 浮窗 id：整体展开 `w` 时会带出 undefined，故显式接纳 */
  widgetId?: string | undefined;
}

/** 独立图表小组件（widget 浮窗内容：kind = cards/trend/heat/donut/today，自带档位，数据走共享缓存；
 * 浮窗内悬浮提示统一上浮 tm-tip-above，不被浮窗遮挡） */
export function StatsWidget(props: StatsWidgetProps): ReactNode {
  const { data, err, loading } = useSharedStats();
  const [range, setRange] = useState('30');
  const aggAll = useMemo(() => {
    if (!data) return null;
    buildModelColors(data.models || {});
    return aggregate(data.records || [], null);
  }, [data]);
  if (!data || !aggAll) {
    return (
      <div className={styles.hint}>
        {err
          ? '统计加载失败：' + err
          : loading
            ? '正在聚合会话日志…'
            : '暂无数据（打开中心区「用量统计」可加速加载）'}
      </div>
    );
  }
  const aa = aggAll as Agg;
  // 浮窗实例：传 widgets/widgetId 让标题栏的开关显示「回归」，但不传 inPlace（原位才隐藏）
  const w = { widgets: props.widgets, widgetId: props.widgetId };
  if (props.kind === 'trend') return <TrendSection data={data} aggAll={aa} inFloat={true} {...w} />;
  if (props.kind === 'heat') return <HeatSection data={data} aggAll={aa} inFloat={true} {...w} />;
  if (props.kind === 'donut') {
    const tk = keyOf(Date.now());
    const cut = range === 'all' ? null : keyOf(fromKey(tk) - (Number(range) - 1) * 86400000);
    const scoped = cut === null ? null : aggregate(data.records || [], cut);
    // 范围 Seg 作为卡片内顶部行（prepend），浮窗/面板内都不在卡片外
    return (
      <DonutSection
        data={data}
        agg={scoped !== null ? scoped : aa}
        rangeLabel={rangeText(range)}
        inFloat={true}
        {...w}
        prepend={
          <div className={styles.segRow}>
            <Seg
              options={[
                { v: '7', t: '近7天' },
                { v: '30', t: '近30天' },
                { v: '90', t: '近90天' },
                { v: 'all', t: '全部' },
              ]}
              current={range}
              onPick={setRange}
            />
          </div>
        }
      />
    );
  }
  if (props.kind === 'today')
    return <TodayCard wide={true} bare={true} name="今日消耗" inFloat={true} {...w} />;
  return <StatCardsSection aggAll={aa} data={data} inFloat={true} {...w} />;
}

/* ---------- 设置页主体（showPrefs=false 时隐藏顶部开关行，供中心区富面板使用；开关收归设置页） ---------- */
/** 设置页主体 props（中心区富面板不传 showPrefs，走默认 true）。 */
interface StatsSettingsPageProps {
  defaultRange: string;
  showToday: boolean;
  onPrefs: () => void;
  showPrefs?: boolean;
  widgets?: any;
}

export function StatsSettingsPage(props: StatsSettingsPageProps): ReactNode {
  const showPrefs = props.showPrefs !== false;
  const Btn =
    Button ||
    (({ children, ...rest }: any) => (
      <button type="button" className={styles.btn} {...rest}>
        {children}
      </button>
    ));
  const [data, setData] = useState<StatsSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(props.defaultRange || 'all');
  const [todayOn, setTodayOn] = useState(false);
  const fl = useTmTodayFloat();

  useEffect(() => {
    setRange(props.defaultRange || 'all');
  }, [props.defaultRange]);
  useEffect(() => {
    setTodayOn(props.showToday === true);
  }, [props.showToday]);

  const inflight = (useRef as any)(false);
  const lastSig = (useRef as any)(null);
  const spinTimer = (useRef as any)(0);
  const dataRef = (useRef as any)(null);
  dataRef.current = data;
  const stallRef = useRef({ scanned: -1, same: 0 });
  const sigOf = (v: StatsSnapshot): string =>
    v.scanned +
    '/' +
    v.total +
    '/' +
    v.errors +
    '/' +
    (v.partial ? 1 : 0) +
    '/' +
    v.records.length +
    '/' +
    v.records.reduce((s, r) => s + tok(r), 0);

  const refresh = useCallback((force?: boolean) => {
    if (inflight.current && force !== true) return;
    inflight.current = true;
    window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => setLoading(true), 400);
    fetchStats()
      .then((value) => {
        window.clearTimeout(spinTimer.current);
        inflight.current = false;
        setLoading(false);
        if (value && (value as StatsSnapshot).ready === true) {
          writeShared(value as StatsSnapshot);
          const sig = sigOf(value as StatsSnapshot);
          if (sig !== lastSig.current) {
            lastSig.current = sig;
            setData(value as StatsSnapshot);
            setErr(null);
          }
        } else setErr((value && (value as any).error) || '统计服务不可用');
      })
      .catch((e: unknown) => {
        window.clearTimeout(spinTimer.current);
        inflight.current = false;
        setLoading(false);
        setErr(String((e as Error)?.message ?? e));
      });
  }, []);
  useEffect(() => {
    (refresh as (f: boolean) => void)(true);
  }, [refresh]);
  useEffect(() => {
    const tick = (): void => {
      if (document.visibilityState === 'visible') refresh();
    };
    const id = window.setInterval(tick, 60000);
    const onVis = (): void => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.clearTimeout(spinTimer.current);
    };
  }, [refresh]);
  useEffect(() => {
    if (data === null || (data as StatsSnapshot).partial !== true) {
      stallRef.current.same = 0;
      return undefined;
    }
    let alive = true;
    let timer = 0;
    const st = stallRef.current;
    if ((data as StatsSnapshot).scanned === st.scanned) st.same++;
    else {
      st.same = 0;
      st.scanned = (data as StatsSnapshot).scanned;
    }
    const arm = (): void => {
      if (!alive) return;
      timer = window.setTimeout(
        () => {
          if (!alive) return;
          const d = dataRef.current;
          if (d !== null && d.partial === true) {
            if (d.scanned === st.scanned) st.same++;
            else {
              st.same = 0;
              st.scanned = d.scanned;
            }
            if (document.visibilityState === 'visible') refresh();
          }
          arm();
        },
        st.same >= 8 ? 12000 : 2000,
      );
    };
    arm();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [data, refresh]);

  const derived = useMemo(() => {
    if (data === null) return null;
    buildModelColors((data as StatsSnapshot).models || {});
    const tk = keyOf(Date.now());
    const c = range === 'all' ? null : keyOf(fromKey(tk) - (Number(range) - 1) * 86400000);
    return {
      todayK: tk,
      cut: c,
      scoped: c === null ? null : aggregate((data as StatsSnapshot).records || [], c),
      aggAll: aggregate((data as StatsSnapshot).records || [], null),
    };
  }, [data, range]);

  const setToday = async (on: boolean): Promise<void> => {
    setTodayOn(on);
    try {
      await saveConfig({ showToday: on });
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(new CustomEvent('tm-today-toggle', { detail: { on } }));
    } catch {
      /* ignore */
    }
    props.onPrefs();
  };

  const children: any[] = [];
  // 中心区模式（showPrefs=false）由视图顶栏给出分区标题，这里不再重复一遍 h3
  if (showPrefs) children.push(<h3 className={styles.title}>{'Token 用量统计'}</h3>);
  // 中心区模式隐藏长描述，压缩与上方今日消耗卡的间距
  if (showPrefs) {
    children.push(
      <p className={styles.desc}>
        {
          '聚合本机全部会话日志（含子代理会话；fork/resume 种子事件已去重）。数据每 60 秒自动刷新；时间范围作用于当前范围卡片与模型分布，趋势图用自带的近24小时 / 近7天 / 近30天切换，总览与热力图为全量数据。'
        }
      </p>,
    );
  }
  if (showPrefs) {
    children.push(
      <div className={styles.swrow}>
        <div className={styles.swrowText}>
          <div className={styles.swlabel}>{'在侧边栏显示今日用量'}</div>
          <div className={styles.swhint}>
            {
              '开启后左侧边栏底部显示今日 Token 消耗小卡片（含分色小时曲线与昨日对比；偏好存 settings.yaml · dshp-token-meter）'
            }
          </div>
        </div>
        <button
          className={styles.switch}
          role="switch"
          aria-checked={todayOn ? 'true' : 'false'}
          aria-label="在侧边栏显示今日用量"
          onClick={() => void setToday(!todayOn)}
        >
          <span className={styles.knob} />
        </button>
      </div>,
    );
    children.push(
      <div className={styles.swrow}>
        <div className={styles.swrowText}>
          <div className={styles.swlabel}>{'今日卡片浮窗'}</div>
          <div className={styles.swhint}>
            {'弹出后可拖到屏幕任意位置，侧边栏不再占位；开关与坐标存本机 localStorage'}
          </div>
        </div>
        {fl.open ? (
          <Btn variant="outline" size="sm" onClick={() => tmTodaySet(false)}>
            {'收回侧边栏'}
          </Btn>
        ) : (
          <div className={styles.hint}>{'在侧边栏中（卡片标题栏 ⠿ 可拖出）'}</div>
        )}
      </div>,
    );
  }

  if (err) {
    children.push(<div className={cx(styles.notice, styles.noticeErr)}>{'读取失败：' + err}</div>);
    children.push(
      <Btn variant="outline" size="sm" onClick={() => refresh(true)}>
        {'重试'}
      </Btn>,
    );
    return <div className={styles.page}>{children}</div>;
  }
  if (data === null) {
    children.push(
      <div className={cx(styles.notice, styles.noticeEmpty)}>
        {loading ? '正在统计会话日志…' : '暂无数据'}
      </div>,
    );
    return <div className={styles.page}>{children}</div>;
  }
  const dd = derived as { todayK: string; cut: string | null; scoped: Agg | null; aggAll: Agg };
  const scoped = dd.scoped;
  const aggAll = dd.aggAll;
  const hasData = aggAll.first !== null;

  children.push(
    <div className={styles.toolbar}>
      <label className={styles.hint}>{'时间范围'}</label>
      <RangeSelect options={RANGES} value={range} onPick={(v: string) => setRange(v)} />
      <span className={styles.hint} style={{ marginLeft: 'auto' }}>
        {'更新于 ' + hhmm((data as StatsSnapshot).generatedAt) + (loading ? ' · 刷新中…' : '')}
      </span>
      {(data as StatsSnapshot).storage === 'disabled' ? (
        Tooltip ? (
          <Tooltip
            label="统计仍正常运行；重启后需全量重扫。详情见宿主日志 [dshp-token-meter] storage domain"
            side="bottom"
          >
            <span className={styles.hint} style={{ cursor: 'help' }}>
              {'⚠ 无持久缓存'}
            </span>
          </Tooltip>
        ) : (
          <span className={styles.hint} title="统计仍正常运行；重启后需全量重扫">
            {'⚠ 无持久缓存'}
          </span>
        )
      ) : null}
      <Btn
        variant="outline"
        size="sm"
        onClick={() => refresh()}
        disabled={loading}
        icon={
          loading && IconLoadingOutlineRegular ? (
            <IconLoadingOutlineRegular />
          ) : IconRefreshOutlineRegular ? (
            <IconRefreshOutlineRegular size={14} />
          ) : undefined
        }
      >
        {loading ? '刷新中…' : '刷新'}
      </Btn>
    </div>,
  );

  {
    const pct =
      (data as StatsSnapshot).total > 0
        ? Math.round(((data as StatsSnapshot).scanned / (data as StatsSnapshot).total) * 100)
        : 0;
    children.push(
      (data as StatsSnapshot).partial === true ? (
        <div
          className={cx(styles.notice, styles.noticeEmpty)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
        >
          <span>
            {'后台统计中 ' +
              pct +
              '%（' +
              (data as StatsSnapshot).scanned +
              '/' +
              (data as StatsSnapshot).total +
              ' 个会话）—— 已扫描部分先展示，完成后自动补全。'}
          </span>
          {(data as StatsSnapshot).errors > 0 ? (
            <span className={styles.muted}>{(data as StatsSnapshot).errors + ' 个会话读取失败已跳过'}</span>
          ) : null}
        </div>
      ) : null,
    );
  }

  if (!hasData) {
    children.push(
      <div className={styles.empty}>
        {'暂无 Token 用量数据 — 发起一次对话后会自动统计（已扫描 ' +
          (data as StatsSnapshot).sessions +
          ' 个会话）'}
      </div>,
    );
    return <div className={styles.page}>{children}</div>;
  }

  // ── 卡片区：12 栏仪表板栅格 ─────────────────────────────────────
  // 排布按「谁吃横向空间」定：基础数据（指标卡网格）→ 趋势（通栏）→ 热力图（通栏）
  // → 模型分布（通栏、但内部是纵向列表，放最后并分栏铺开）。趋势与热力图都是越宽越好读，
  // 与别人并排只会各自被压窄；模型分布是「环形图 + 逐个模型一行」的纵向结构，压窄无损失。
  const span = (cls: string | undefined, key: string, node: ReactNode): ReactNode => (
    <div key={key} className={cls}>
      {node}
    </div>
  );
  const cards: any[] = [];
  // 基础数据（独立组件，中心区与 widget 浮窗复用）
  cards.push(
    span(
      styles.c12,
      'cards',
      <StatCardsSection
        aggAll={aggAll}
        data={data as StatsSnapshot}
        widgets={(props as any).widgets || null}
        widgetId="stats:cards"
        inPlace={true}
      />,
    ),
  );
  if (scoped !== null) {
    cards.push(
      span(
        styles.c12,
        'range',
        <div className={styles.card}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span className={styles.muted}>{'当前范围（' + rangeText(range) + '）'}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(scoped.total) +
                ' tokens · 输入 ' +
                fmt(scoped.i) +
                ' · 输出 ' +
                fmt(scoped.o) +
                ' · ' +
                fmtFull(scoped.n) +
                ' 次调用'}
            </span>
          </div>
        </div>,
      ),
    );
  }
  // 趋势（通栏，独立组件，中心区与 widget 浮窗复用）
  cards.push(
    span(
      styles.c12,
      'trend',
      <TrendSection
        data={data as StatsSnapshot}
        aggAll={aggAll}
        widgets={(props as any).widgets || null}
        widgetId="stats:trend"
        inPlace={true}
      />,
    ),
  );
  // 热力图（通栏，紧跟趋势 —— 同样是月份越宽越好读的横向图形）
  cards.push(
    span(
      styles.c12,
      'heat',
      <HeatSection
        data={data as StatsSnapshot}
        aggAll={aggAll}
        widgets={(props as any).widgets || null}
        widgetId="stats:heat"
        inPlace={true}
      />,
    ),
  );
  // 模型分布（最后；通栏但走纵向分栏布局，见 .tm-donutWide）
  cards.push(
    span(
      styles.c12,
      'donut',
      <div className={styles.donutWide}>
        <DonutSection
          data={data as StatsSnapshot}
          agg={scoped !== null ? scoped : aggAll}
          rangeLabel={rangeText(range)}
          widgets={(props as any).widgets || null}
          widgetId="stats:donut"
          inPlace={true}
        />
      </div>,
    ),
  );
  cards.push(
    span(
      styles.c12,
      'note',
      <div className={styles.muted} style={{ margin: '0 2px' }}>
        {
          '统计口径：总 Token = 输入 + 缓存读 + 缓存写 + 输出（reasoning 已含在输出内）；同一请求的采样 usage 被终值覆盖，不重复累计；fork/resume 种子事件已去重。'
        }
      </div>,
    ),
  );
  children.push(<div className={styles.dash}>{cards}</div>);
  return <div className={styles.page}>{children}</div>;
}

/* ---------- 今日卡（侧栏宽栏 / 折叠 rail / 浮窗共用） ---------- */
/** 今日卡 props（侧栏宽栏 / 折叠 rail / 浮窗三态共用）。 */
interface TodayCardProps {
  wide?: boolean;
  bare?: boolean;
  float?: boolean;
  floatPos?: { x: number; y: number } | null;
  /** 卡片标题（浮窗里显示「今日消耗」） */
  name?: string;
  inFloat?: boolean;
  widgets?: any;
  /** 浮窗 id：整体展开 `w` 时会带出 undefined，故显式接纳 */
  widgetId?: string | undefined;
}

export function TodayCard(props: TodayCardProps): ReactNode {
  const wide = !(props && props.wide === false);
  const isFloat = !!(props && props.float === true);
  const bare = !!(props && props.bare === true);
  const floatPos = (props && props.floatPos) || null;
  const floatXY = isFloat ? tmTodayClamp(floatPos || tmTodayLoadPos() || tmTodayDefaultPos()) : null;
  const [data, setData] = useState<StatsSnapshot | null>(null);
  const [tip, setTip] = useState<{ mx: number; my: number } | null>(null);
  const doRefresh = useCallback(() => {
    fetchStats()
      .then((v) => {
        if (v && (v as StatsSnapshot).ready === true) setData(v as StatsSnapshot);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);
  useEffect(() => {
    doRefresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') doRefresh();
    }, 60000);
    return () => {
      window.clearInterval(id);
    };
  }, [doRefresh]);

  if (data === null) {
    if (isFloat) {
      return (
        <div
          className={styles.float}
          style={{ left: (floatXY as { x: number }).x + 'px', top: (floatXY as { y: number }).y + 'px' }}
        >
          <div
            className={cx(styles.todayhead, styles.floathead)}
            title="按住拖到任意位置 · 双击收回侧边栏"
            onPointerDown={tmFloatDrag}
            onDoubleClick={() => tmTodaySet(false)}
          >
            <span className={cx(styles.todaylabel, styles.titledIco)}>
              <Glyph name="bolt" size={13} className={styles.cico} />
              {'今日用量'}
            </span>
            <span className={styles.todayval} style={{ opacity: 0.5 }}>
              {'…'}
            </span>
            <button
              className={styles.minibtn}
              title="收回侧边栏"
              onClick={(e: any) => {
                if (e.stopPropagation) e.stopPropagation();
                tmTodaySet(false);
              }}
            >
              {'📌'}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className={cx(styles.today, wide ? undefined : styles.todayRail)}>
        <div className={cx(styles.todaylabel, styles.titledIco)}>
          <Glyph name="bolt" size={13} className={styles.cico} />
          {'今日用量'}
        </div>
        <div className={styles.todayval} style={{ opacity: 0.5 }}>
          {'…'}
        </div>
      </div>
    );
  }

  buildModelColors((data as StatsSnapshot).models || {});
  const todayK = keyOf(Date.now());
  const yK = keyOf(fromKey(todayK) - 86400000);
  const both = aggregate((data as StatsSnapshot).records || [], yK);
  const dayTotal = (k: string): number => {
    const d = both.byDay.get(k);
    return d === undefined ? 0 : d.t;
  };
  const todayTotal = dayTotal(todayK);
  const yTotal = dayTotal(yK);
  const delta = yTotal > 0 ? ((todayTotal - yTotal) / yTotal) * 100 : null;

  if (!wide) {
    const showTip = (e: any): void => setTip({ mx: e.clientX, my: e.clientY });
    const hideTip = (): void => setTip(null);
    const dTxt =
      delta === null
        ? todayTotal > 0
          ? '昨日无消耗'
          : '—'
        : (delta >= 0 ? '+' : '') + delta.toFixed(0) + '% vs 昨日';
    return (
      <div
        className={cx(styles.today, styles.todayRail)}
        onMouseEnter={showTip}
        onMouseMove={showTip}
        onMouseLeave={hideTip}
      >
        <div className={styles.todaylabel}>{'今日'}</div>
        <AnimatedNumber className={styles.todayval} value={todayTotal} format={fmtRail} />
        <DualBars className={styles.dualbars} a={todayTotal} b={yTotal} />
        {tip === null
          ? null
          : (() => {
              const pos = tipPos(tip.mx, tip.my, 190, 82);
              return tmPortal(
                <div className={styles.tipfixed} style={pos}>
                  <div className={styles.tiprow} style={{ fontWeight: 600, marginBottom: 2 }}>
                    {'今日用量'}
                  </div>
                  <div className={styles.tiprow}>
                    <span className={styles.tipK}>{'今日'}</span>
                    <span className={styles.tipV}>{fmt(todayTotal)}</span>
                  </div>
                  <div className={styles.tiprow}>
                    <span className={styles.tipK}>{'昨日'}</span>
                    <span className={styles.tipV}>{fmt(yTotal)}</span>
                  </div>
                  <div className={styles.tiprow}>
                    <span className={styles.tipK}>{'对比'}</span>
                    <span className={styles.tipV}>{dTxt}</span>
                  </div>
                </div>,
              );
            })()}
      </div>
    );
  }

  const endH = new Date();
  endH.setMinutes(0, 0, 0);
  const hourSlots: Array<{ d: string; h: number }> = [];
  for (let k = 23; k >= 0; k--) {
    const t = endH.getTime() - k * 3600000;
    hourSlots.push({ d: keyOf(t), h: new Date(t).getHours() });
  }
  const hourLabels = hourSlots.map((s) => (s.d === todayK ? s.h + ':00' : '昨日' + s.h + ':00'));
  const hourIdx = new Map<string, number>();
  for (let i = 0; i < hourSlots.length; i++)
    hourIdx.set(
      (hourSlots[i] as { d: string; h: number }).d + '|' + (hourSlots[i] as { d: string; h: number }).h,
      i,
    );
  const hourArrs = new Map<string, number[]>();
  for (const r of (data as StatsSnapshot).records || []) {
    const idx = hourIdx.get(r.d + '|' + r.h);
    if (idx === undefined) continue;
    let arr = hourArrs.get(r.m);
    if (arr === undefined) {
      arr = Array.from({ length: 24 }, () => 0);
      hourArrs.set(r.m, arr);
    }
    (arr[idx] as number) += tok(r);
  }
  const modelHourSeries: TrendSeries[] = [];
  for (const mk of sorted(Array.from(hourArrs.keys()))) {
    modelHourSeries.push({
      name: mk,
      shortName:
        (((data as StatsSnapshot).models as Record<string, { model: string }>)[mk] || {}).model || mk,
      color: modelColor(mk),
      values: hourArrs.get(mk) as number[],
      visible: true,
    });
  }

  return (
    <div
      {...(isFloat
        ? {
            className: styles.float,
            style: { left: (floatXY as { x: number }).x + 'px', top: (floatXY as { y: number }).y + 'px' },
          }
        : { className: styles.today })}
    >
      <div
        {...(isFloat
          ? {
              className: cx(styles.todayhead, styles.floathead),
              title: '按住拖到任意位置 · 双击收回侧边栏',
              onPointerDown: tmFloatDrag,
              onDoubleClick: () => tmTodaySet(false),
            }
          : { className: styles.todayhead })}
      >
        {isFloat || bare ? null : (
          <span className={styles.grip} title="按住拖出为浮窗，点按直接弹出" onPointerDown={tmGripDragOut}>
            {'⠿'}
          </span>
        )}
        <span className={cx(styles.todaylabel, styles.titledIco)}>
          <Glyph name="bolt" size={13} className={styles.cico} />
          {props.name || '今日 Token'}
        </span>
        <AnimatedNumber className={styles.todayval} value={todayTotal} format={fmt} />
        {bare ? (
          widgetBtns(props.widgets, props.widgetId)
        ) : (
          <button
            className={styles.minibtn}
            title={isFloat ? '收回侧边栏' : '弹出为浮窗（可拖到屏幕任意位置）'}
            onClick={(e: any) => {
              if (e.stopPropagation) e.stopPropagation();
              tmTodaySet(!isFloat);
            }}
          >
            {isFloat ? '📌' : '⧉'}
          </button>
        )}
      </div>
      <TodayChart
        series={modelHourSeries}
        n={24}
        labels={hourLabels}
        floatTip={isFloat || props.inFloat === true}
      />
      {modelHourSeries.length > 0 ? (
        <div className={styles.todaymodels}>
          {modelHourSeries.map((s, si) => (
            <span
              key={s.name}
              className={cx(styles.todaymchip, styles.fadein)}
              style={{ animationDelay: si * 60 + 'ms' }}
            >
              <span className={styles.dot} style={{ background: s.color }} />
              <span>{s.shortName}</span>
            </span>
          ))}
        </div>
      ) : null}
      {delta !== null ? (
        <div
          className={cx(styles.statgrow, styles.fadein)}
          style={{
            marginTop: 4,
            color:
              delta >= 0 ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-error-primary)',
            fontSize: 10.5,
          }}
        >
          <span className={cx(styles.arrow, delta >= 0 ? styles.arrowUp : styles.arrowDown)} />
          <span>{(delta >= 0 ? '+' : '') + delta.toFixed(0) + '% vs 昨日'}</span>
        </div>
      ) : (
        <div className={styles.muted} style={{ fontSize: 10, marginTop: 4 }}>
          {todayTotal > 0 ? '昨日无消耗' : '开始使用后统计'}
        </div>
      )}
    </div>
  );
}

export function TodayFloatEntry(): ReactNode {
  const on = useRef(true);
  void on;
  const fl = useTmTodayFloat();
  const [showToday, setShowToday] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/ext/dshp-token-meter/state', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s: any) => {
        if (alive && s && s.ok && s.config) setShowToday(s.config.showToday === true);
      })
      .catch(() => {
        /* ignore */
      });
    const fn = (ev: any): void => {
      if (ev && ev.detail) setShowToday(!!ev.detail.on);
    };
    const wrap = (ev: Event): void =>
      fn((ev as CustomEvent).detail ? { detail: (ev as CustomEvent).detail } : ev);
    window.addEventListener('tm-today-toggle', wrap);
    return () => window.removeEventListener('tm-today-toggle', wrap);
  }, []);
  if (showToday !== true || !fl.open) return null;
  const pos = tmTodayClamp(fl.pos || tmTodayLoadPos() || tmTodayDefaultPos());
  void Badge;
  return <TodayCard wide={true} float={true} floatPos={pos} />;
}

/** 分享面板 props：在线块由 CenterView 注入（两个模块在 index.tsx 才汇合）。 */
interface SharePanelProps {
  onClose: () => void;
  OnlineEmbed?: any;
}

/**
 * 分享面板（全屏 16:9 卡片 + 下载/复制 PNG）：拉一次统计快照 + git 身份，
 * 然后交给 ShareShell 画那张卡片；数据与聚合复用本文件的辅助函数。
 * 身份取不到（无 shell 服务、无 git、无 ~/.gitconfig）时静默省略，不挡分享。
 */
export function SharePanel(props: SharePanelProps): ReactNode {
  // 内聚到分享卡上的组件：四个分区由本文件提供，在线块由 CenterView 注入
  // （在线块来自 OnlineSection，两个工厂在 index.ts 才汇合，这里拿不到)。
  const sections = {
    StatCardsSection,
    TrendSection,
    HeatSection,
    DonutSection,
    OnlineEmbed: props.OnlineEmbed,
  };
  const [data, setData] = useState(null as StatsSnapshot | null);
  const [error, setError] = useState('');
  const [ident, setIdent] = useState({ name: '', email: '' } as { name: string; email: string });
  useEffect(() => {
    let alive = true;
    void fetchStats()
      .then((v) => {
        if (!alive) return;
        if (v && (v as StatsSnapshot).ready === true) setData(v as StatsSnapshot);
        else setError(String((v && (v as { error?: string }).error) || '统计服务不可用'));
      })
      .catch((e: unknown) => {
        if (alive) setError(String((e as Error)?.message ?? e));
      });
    void fetch('/ext/dshp-token-meter/identity', { cache: 'no-store' })
      .then((r) => r.json())
      .then((v: { ok?: boolean; name?: string; email?: string }) => {
        if (alive && v && v.ok === true)
          setIdent({ name: String(v.name || ''), email: String(v.email || '') });
      })
      .catch(() => {
        /* 身份是锦上添花，取不到就算了 */
      });
    return () => {
      alive = false;
    };
  }, []);
  if (data === null)
    return (
      <ShareShell
        data={EMPTY_SNAPSHOT}
        loading={true}
        error={error}
        sections={sections}
        onClose={props.onClose}
      />
    );
  return (
    <ShareShell
      data={data}
      loading={false}
      error={error}
      gitName={ident.name}
      gitEmail={ident.email}
      sections={sections}
      onClose={props.onClose}
    />
  );
}
