/**
 * 在线时长面板（中心区「在线统计」分区 + 可弹出小组件）
 *
 * 数据全部来自 Host：GET /ext/dshp-token-meter/stats 的 `snapshot.online`。
 * Host 侧口径见 src/host/stats/online.ts —— 这里只做呈现与阈值切换，
 * **不在客户端重算统计**，避免两端口径漂移。
 *
 * 面板内容：
 *  - 阈值切换（1/5/15/30/60 分钟）+ 区间切换（近 14/30/90 天 / 全部），阈值落 settings.yaml；
 *  - 三组关键数字：在线（你 + DSH）/ 对话进行中（DSH 的钟）/ 模型 + 工具（DSH 的活，精确）；
 *  - 每日柱线混合图：柱 = 对话中(实) + 空档(半透)、虚线 = 引擎合计，带悬浮数据提示；
 *  - 三口径对照条 + 数据准确性表（哪些精确、哪些估算）；
 *  - 高在线日 Top 8 明细。
 *
 * 原来是 `createOnlineSection(React, ReactDOM, statsApi?)` 工厂：React 注入取消（改成模块顶层
 * import），`OnlineView` / `OnlineEmbed` 改成模块级具名导出；共享快照不再由 `statsApi` 注入，
 * 而是直接 import `StatsSection` 的模块级 `useSharedStats` —— 那份状态在 StatsSection 里是模块级的，
 * 所以在线面板与「Token 用量」面板仍然共用同一份 60s 快照（语义与旧的注入同一个函数一致）。
 */
import { useCallback, useEffect, useReducer, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import * as ReactDOM from 'react-dom';
import { saveConfig } from './api.js';
import { Glyph } from './glyphs.js';
import { useSharedStats } from './StatsSection.js';
import styles from './styles.module.css';
import type { StatsOnline, StatsOnlineDay, StatsSnapshot } from './types.js';

/** 阈值档位（分钟）与文案 */
/** 推荐的空闲阈值（分钟）：见面板里的推荐理由，同时是 Host 侧 `onlineGapMin` 的默认值 */
const GAP_RECOMMEND = 15;

/** 图表区间档位（天；0 = 全部活跃日） */
const RANGE_LABELS: Array<[number, string]> = [
  [14, '近 14 天'],
  [30, '近 30 天'],
  [90, '近 90 天'],
  [0, '全部'],
];

/** 会话结局分类的中文标签（Host 端 fold 打的标，见 host/stats/fold.ts） */
const OUTCOME_LABELS: Record<string, string> = {
  usage: '有用量',
  'fork-empty': '继承空壳（fork 后没干活）',
  'no-request': '从没发起模型请求',
  failed: '请求失败/中断（模型没回答）',
  'no-usage': '有回答但供应商没上报 usage',
  unreadable: '日志读不出来（已兜底，若仍有则为疑难日志）',
};

/** 主色（跟随主题）与引擎线颜色 */
const C_MAIN = 'var(--dsw-alias-state-business-primary)';
const C_BUSY = '#f5a623';

/** 每日图表的 viewBox 尺寸（固定 viewBox + width:100% 渲染） */
const CHART_W = 320;
const CHART_H = 150;

/* ---------- 格式化 ---------- */

/** 时长：≥1h 用 `141h10m`，≥1min 用 `42m`，否则 `38s`。 */
export function fmtDur(ms: number): string {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? h + 'h' : h + 'h' + String(rest).padStart(2, '0') + 'm';
}

/** 时长（中文，用于卡片主数字）：`141 小时 10 分` */
function fmtDurCn(ms: number): string {
  const m = Math.max(0, Math.round((ms || 0) / 60000));
  if (m < 1) return '<1 分';
  if (m < 60) return m + ' 分';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? h + ' 小时' : h + ' 小时 ' + rest + ' 分';
}

const fmtTok = (n: number): string => {
  const v = Math.round(n || 0);
  if (v >= 1e8) return (v / 1e8).toFixed(2) + ' 亿';
  if (v >= 1e4) return (v / 1e4).toFixed(1) + ' 万';
  return String(v);
};

const keyOf = (t: number): string => {
  const d = new Date(t);
  const M = String(d.getMonth() + 1);
  const D = String(d.getDate());
  return d.getFullYear() + '-' + (M.length < 2 ? '0' + M : M) + '-' + (D.length < 2 ? '0' + D : D);
};
const dispDay = (k: string): string => (k ? k.slice(5).replace('-', '/') : '');
const cnDate = (k: string): string => {
  const p = k.split('-');
  return Number(p[0]) + '年' + Number(p[1]) + '月' + Number(p[2]) + '日';
};
/** 从「今天」倒推 n-1 天的日期键列表（本地时区，升序） */
function lastNDays(n: number, now: number = Date.now()): string[] {
  const out: string[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    out.push(keyOf(d.getTime()));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** 悬浮提示定位（与 StatsSection.tipPos 同款：越界自动翻边） */
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

/* ---------- 取数 ---------- */

export interface SeriesItem {
  d: string;
  ms: number;
  turnMs: number;
  idleMs: number;
  llmMs: number;
  toolMs: number;
  busyMs: number;
  tokens: number;
  sessions: number;
  seg: number;
  actual: boolean;
}

export interface OnlineView {
  gap: number;
  total: number;
  turn: number;
  idle: number;
  llm: number;
  tool: number;
  busy: number;
  activeDays: number;
  avg: number;
  today: number;
  segments: number;
  series: SeriesItem[];
  peak: SeriesItem | null;
  /** 全部活跃日按在线时长降序（排行用） */
  ranked: SeriesItem[];
  /** ranked 前 8（保留旧字段） */
  top: SeriesItem[];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
/** `2026-09-08` → `周一` */
function weekdayOf(k: string): string {
  const p = k.split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
  return '周' + (WEEKDAYS[d.getDay()] ?? '');
}

/** 按在线时长降序拷贝（客户端保持 ES2020 兼容，不用 toSorted） */
function sortByMsDesc(arr: SeriesItem[]): SeriesItem[] {
  const out = arr.slice();
  // eslint-disable-next-line unicorn/no-array-sort
  return out.sort((a, b) => b.ms - a.ms);
}

/** 从 Host 快照派生视图（纯计算，无副作用）。 */
export function deriveOnlineView(
  online: StatsOnline,
  gap: number,
  rangeDays: number,
  now: number = Date.now(),
): OnlineView {
  const g = String(gap);
  const byKey = new Map<string, StatsOnlineDay>();
  for (const day of online.days) byKey.set(day.d, day);
  const series: SeriesItem[] = [];
  const keys = rangeDays > 0 ? lastNDays(rangeDays, now) : online.days.map((x) => x.d);
  for (const k of keys) {
    const day = byKey.get(k);
    const ms = day ? (day.byGap[g] ?? 0) : 0;
    const turnMs = day ? day.turnMs : 0;
    series.push({
      d: k,
      ms,
      turnMs,
      idleMs: Math.max(0, ms - turnMs),
      llmMs: day ? day.llmMs || 0 : 0,
      toolMs: day ? day.toolMs || 0 : 0,
      busyMs: day ? (day.llmMs || 0) + (day.toolMs || 0) : 0,
      tokens: day ? day.tokens : 0,
      sessions: day ? day.sessions : 0,
      seg: day ? (day.segByGap ? (day.segByGap[g] ?? 0) : 0) : 0,
      actual: day !== undefined,
    });
  }
  let peak: SeriesItem | null = null;
  const actualItems: SeriesItem[] = [];
  for (const it of series) {
    if (!it.actual) continue;
    if (peak === null || it.ms > peak.ms) peak = it;
    actualItems.push(it);
  }
  const ranked = sortByMsDesc(actualItems);
  const top = ranked.slice(0, 8);
  const total = online.totalMs[g] ?? 0;
  const turn = online.turnMs;
  const llm = online.llmMs || 0;
  const tool = online.toolMs || 0;
  return {
    gap,
    total,
    turn,
    idle: Math.max(0, total - turn),
    llm,
    tool,
    busy: llm + tool,
    activeDays: online.activeDays,
    avg: online.activeDays > 0 ? total / online.activeDays : 0,
    today: byKey.get(keyOf(now))?.byGap[g] ?? 0,
    segments: online.segments[g] ?? 0,
    series,
    peak,
    ranked,
    top,
  };
}

/* ---------- 组件 ---------- */

/**
 * 拼类名。CSS Module 的映射是宽松声明（`Record<string, string>`），键取不到时是 `undefined`
 * ——直接拼字符串会得到 `"a undefined"`。这里统一滤掉空值（同 components.tsx 的 `cx`）。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/**
 * 准确度档位 → `.acc.exact` / `.acc.estimate` / `.acc.bound` 那个前缀类名。
 *
 * 后缀是运行时按档位拼的（原来是 `'tm-acc ' + kind`），改成查表：CSS Module 里
 * `.exact` / `.estimate` / `.bound` 各自是一个局部类名，拼字符串拼不出来。
 */
const ACC_CLASS: Record<'exact' | 'estimate' | 'bound', string | undefined> = {
  exact: styles.exact,
  estimate: styles.estimate,
  bound: styles.bound,
};

/**
 * 悬浮提示是否可挂到 body：`react-dom` 缺失时原地渲染（与旧版同一个守卫）。
 *
 * @param node - 要挂的浮层节点。
 * @returns portal 节点；拿不到 `createPortal` 时就是原节点。
 */
function portal(node: ReactNode): ReactNode {
  if (node === null || node === undefined) return null;
  try {
    if (
      ReactDOM &&
      typeof ReactDOM.createPortal === 'function' &&
      typeof document !== 'undefined' &&
      document.body
    )
      return ReactDOM.createPortal(node, document.body);
  } catch {
    /* ignore */
  }
  return node;
}

/** 悬浮数据提示的内容：标题 + 键值行 + 多行说明（全部走同一个浮层样式） */
interface TipContent {
  /** 稳定 key：避免每次 mousemove 都重建浮层 */
  k: string;
  title?: string;
  text?: string;
  rows?: Array<[string, string]>;
}

/** 悬浮事件集合（可直接 `{...}` 展开到元素上）。 */
interface TipBind {
  onMouseEnter: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseLeave: () => void;
}

/**
 * 统一的悬浮数据提示（替代原生 `title`，与图表/排行的提示同一套外观）。
 *
 * 实现是「store + 单一 Host」而不是把 state 放在使用方：
 * 鼠标移动时只有 `TipHost` 这一个小组件重渲染，不会把整个面板（十几张卡 + 表格）
 * 跟着重画一遍。
 */
const tipStore: {
  cur: { x: number; y: number; c: TipContent } | null;
  subs: Set<() => void>;
} = { cur: null, subs: new Set() };

function tipEmit(): void {
  for (const fn of tipStore.subs) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

/** 挂到任意元素上的悬浮事件（内容按 k 去抖：同元素内移动不重建） */
function useTip(): { bind: (c: TipContent) => TipBind } {
  return {
    bind: (c: TipContent) => ({
      onMouseEnter: (e: MouseEvent) => {
        tipStore.cur = { x: e.clientX, y: e.clientY, c };
        tipEmit();
      },
      onMouseMove: (e: MouseEvent) => {
        const cur = tipStore.cur;
        if (cur !== null && cur.c.k === c.k && cur.x === e.clientX && cur.y === e.clientY) return;
        tipStore.cur = { x: e.clientX, y: e.clientY, c };
        tipEmit();
      },
      onMouseLeave: () => {
        tipStore.cur = null;
        tipEmit();
      },
    }),
  };
}

/** 每个面板实例只挂一个：负责渲染当前提示（portal 到 body） */
function TipHost(): ReactNode {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    tipStore.subs.add(force);
    return () => {
      tipStore.subs.delete(force);
    };
  }, [force]);
  const tip = tipStore.cur;
  if (tip === null) return null;
  return portal(
    <div
      className={styles.tipfixed}
      style={tipPos(
        tip.x,
        tip.y,
        250,
        30 + (tip.c.rows ? tip.c.rows.length * 18 : 0) + (tip.c.text ? 36 : 0),
      )}
    >
      {tip.c.title ? <div className={styles.tipTitle}>{tip.c.title}</div> : null}
      {(tip.c.rows ?? []).map(([k, v]: [string, string]) => (
        <div key={k} className={styles.tiprow}>
          <span className={styles.tipK}>{k}</span>
          <span className={styles.tipV}>{v}</span>
        </div>
      ))}
      {tip.c.text ? <div className={styles.tipText}>{tip.c.text}</div> : null}
    </div>,
  );
}

// 取数钩子在**模块期**定下来（共享快照优先：StatsSection 的模块级 useSharedStats），因此组件里调用的
// 始终是同一个钩子，不存在"条件调用 hooks"的问题。
/**
 * 面板取数：与「Token 用量」面板共用同一份快照（一次请求）。
 *
 * @returns 快照、错误文案与强制刷新函数。
 */
function useSnapshot(): { snap: StatsSnapshot | null; err: string; reload: () => void } {
  const sharedSnap = useSharedStats();
  return { snap: sharedSnap.data, err: sharedSnap.err, reload: () => sharedSnap.reload(true) };
}

/** 档位切换 props。 */
interface SegProps {
  items: Array<[number, string]>;
  value: number;
  onPick: (v: number) => void;
}

/** 档位切换 */
function Seg(props: SegProps): ReactNode {
  return (
    <span className={styles.seg}>
      {props.items.map(([v, t]) => (
        <button
          key={String(v)}
          type="button"
          className={cx(styles.segBtn, v === props.value ? styles.segOn : undefined)}
          onClick={() => props.onPick(v)}
        >
          {t}
        </button>
      ))}
    </span>
  );
}

/** 准确度徽标 props。 */
interface AccProps {
  kind: 'exact' | 'estimate' | 'bound';
}

/** 准确度徽标：精确 / 估算 / 下界 */
function Acc(props: AccProps): ReactNode {
  const map = {
    exact: [styles.badgeOk, '精确'],
    estimate: [styles.badgeWarn, '估算'],
    bound: [styles.badgeMuted, '下界'],
  } as const;
  const picked = map[props.kind];
  return <span className={cx(styles.badge, picked[0])}>{picked[1]}</span>;
}

/** 卡片标题：前置一枚语义图标 + 文本（与 StatsSection 的 cardName 同款） */
function cardName(name: string, text: ReactNode): ReactNode {
  return (
    <span className={styles.chartName}>
      <Glyph name={name} size={14} className={styles.cico} />
      <span className={styles.cnameTxt}>{text}</span>
    </span>
  );
}

/** 指标卡 props。 */
interface StatProps {
  label: string;
  value: string;
  sub?: string;
  tint?: boolean;
  /** 悬浮提示（统一外观，不用原生 title） */
  tip?: TipContent;
  acc?: 'exact' | 'estimate' | 'bound';
  /** 跨两列（网格里用来补齐最后一行，同时表达「这是前面几项之和」） */
  wide?: boolean;
  /** 语义图标名（glyphs.ts）：标签前置小图标 + 卡片右下角同款水印 */
  icon?: string;
}

/** 一张指标卡。 */
function Stat(props: StatProps): ReactNode {
  const t = useTip();
  return (
    <div
      className={cx(styles.stat, props.wide ? styles.statWide : undefined)}
      {...(props.tint ? { 'data-tint': '1' } : {})}
      {...(props.tip ? t.bind(props.tip) : {})}
    >
      {props.icon ? <Glyph name={props.icon} size={58} className={styles.statBg} /> : null}
      <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {props.icon ? <Glyph name={props.icon} size={13} className={styles.statIco} /> : null}
        {props.label}
        {props.acc ? (
          <span className={cx(styles.acc, ACC_CLASS[props.acc])}>
            {props.acc === 'exact' ? '精确' : props.acc === 'estimate' ? '估算' : '下界'}
          </span>
        ) : null}
      </div>
      <div className={styles.statValue}>{props.value}</div>
      {props.sub ? <div className={styles.statSub}>{props.sub}</div> : null}
    </div>
  );
}

/** 准确性徽标图例：绿=精确 / 黄=估算 / 灰=下界（首次看不用猜颜色含义） */
function AccLegend(): ReactNode {
  const item = (kind: 'exact' | 'estimate' | 'bound', text: string): ReactNode => (
    <span key={kind} className={styles.accLegendItem}>
      <span className={cx(styles.acc, ACC_CLASS[kind])}>
        {kind === 'exact' ? '精确' : kind === 'estimate' ? '估算' : '下界'}
      </span>
      <span>{text}</span>
    </span>
  );
  return (
    <span className={styles.accLegend}>
      {item('exact', '时间戳直接算出')}
      {item('estimate', '由区间推断')}
      {item('bound', '实际只会更多')}
    </span>
  );
}

/** 图例小圆点 props。 */
interface DotProps {
  color: string;
  faint?: boolean;
}

/** 图例小圆点。 */
function Dot(props: DotProps): ReactNode {
  return (
    <span
      className={styles.dot}
      style={{ background: props.color, opacity: props.faint ? 0.35 : 1, marginTop: 0 }}
    />
  );
}

/** 图例。 */
function Legend(): ReactNode {
  return (
    <div className={styles.legend}>
      <Dot color={C_MAIN} />
      <span className={styles.hint}>{'对话进行中'}</span>
      <Dot color={C_MAIN} faint />
      <span className={styles.hint}>{'空档（≤ 阈值的追问/收尾，算在线不算对话）'}</span>
      <Dot color={C_BUSY} />
      <span className={styles.hint}>{'模型 + 工具（并行相加，可高于柱高）'}</span>
    </div>
  );
}

/** 每日图 props。 */
interface ChartProps {
  items: SeriesItem[];
  gap: number;
}

/** 每日柱线混合图：堆叠柱（对话中 + 空档）+ 引擎合计虚线，带悬浮数据提示 */
function Chart(props: ChartProps): ReactNode {
  const items = props.items;
  // 视图坐标系 = 实际像素：viewBox 宽度取容器实测宽度。
  // 固定 viewBox + width:100% 的写法在宽屏下会被 preserveAspectRatio 等比缩到
  // 320px 居中（"图表只占很小一块"），所以这里按容器宽度重算 W，另按宽度微调高度。
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [boxW, setBoxW] = useState(0);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const w = entries && entries[0] ? Math.round(entries[0].contentRect.width) : 0;
      if (w > 0) setBoxW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [hover, setHover] = useState<{ i: number; mx: number; my: number } | null>(null);
  if (items.length === 0) return <div className={styles.empty}>{'暂无数据'}</div>;
  const W = Math.max(CHART_W, boxW || CHART_W);
  const H = Math.round(Math.min(260, Math.max(CHART_H, W * 0.22)));
  const padT = 12;
  const padB = 18;
  const innerH = H - padT - padB;
  let max = 0;
  for (const it of items) {
    if (it.ms > max) max = it.ms;
    if (it.busyMs > max) max = it.busyMs;
  }
  if (max <= 0) max = 1;
  const bw = W / items.length;
  // 柱子别随屏幕无限变粗（宽屏下宁可留白），也没必要细到看不见
  const barW = Math.max(2, Math.min(26, bw * 0.6));
  const yOf = (v: number): number => padT + innerH * (1 - v / max);
  // 轴标签数量随宽度增加，宽屏下不再只有 6 个
  const labelCount = Math.max(6, Math.min(items.length, Math.round(W / 96)));
  const step = Math.max(1, Math.ceil(items.length / labelCount));
  const today = keyOf(Date.now());
  const children: ReactNode[] = [];
  children.push(
    <line key="ax" x1={0} y1={padT + innerH} x2={W} y2={padT + innerH} className={styles.gridln} />,
  );
  children.push(
    <line
      key="mid"
      x1={0}
      y1={padT + innerH / 2}
      x2={W}
      y2={padT + innerH / 2}
      className={styles.gridln}
      strokeDasharray="3 3"
    />,
  );
  children.push(
    <text key="ymax" x={0} y={padT - 3} className={styles.axislbl}>
      {(max / 3.6e6).toFixed(1) + 'h'}
    </text>,
  );
  items.forEach((it, i) => {
    const x = i * bw + (bw - barW) / 2;
    const turnH = it.turnMs > 0 ? Math.max(1, (it.turnMs / max) * innerH) : 0;
    const idleH = it.idleMs > 0 ? Math.max(1, (it.idleMs / max) * innerH) : 0;
    const yTurn = padT + innerH - turnH;
    const yIdle = yTurn - idleH;
    if (turnH > 0)
      children.push(
        <rect
          key={'t' + it.d}
          x={x}
          y={yTurn}
          width={barW}
          height={turnH}
          rx={2}
          fill={C_MAIN}
          opacity={it.d === today ? 0.95 : 0.72}
        />,
      );
    if (idleH > 0)
      children.push(
        <rect
          key={'i' + it.d}
          x={x}
          y={yIdle}
          width={barW}
          height={idleH}
          rx={2}
          fill={C_MAIN}
          opacity={0.26}
        />,
      );
    if (i % step === 0)
      children.push(
        <text key={'l' + it.d} x={x + barW / 2} y={H - 5} textAnchor="middle" className={styles.axislbl}>
          {dispDay(it.d)}
        </text>,
      );
  });
  if (items.some((it) => it.busyMs > 0))
    children.push(
      <polyline
        key="busy"
        points={items
          .map((it, i) => (i * bw + bw / 2).toFixed(1) + ',' + yOf(it.busyMs).toFixed(1))
          .join(' ')}
        fill="none"
        stroke={C_BUSY}
        strokeWidth={1.6}
        strokeDasharray="4 3"
        strokeLinejoin="round"
      />,
    );
  const hovered = hover !== null ? items[hover.i] : undefined;
  if (hover !== null && hovered)
    children.push(
      <rect
        key="hv"
        x={hover.i * bw}
        y={padT}
        width={bw}
        height={innerH}
        fill="currentColor"
        opacity={0.08}
        pointerEvents="none"
      />,
    );
  // 透明命中区：第 i 根柱 = 第 i 整列（含柱间空隙），hover 命中即该列
  items.forEach((it, i) => {
    children.push(
      <rect
        key={'hit' + it.d}
        x={i * bw}
        y={padT}
        width={bw}
        height={innerH}
        fill="transparent"
        style={{ pointerEvents: 'all', cursor: 'crosshair' }}
        onMouseEnter={(e: MouseEvent) => setHover({ i, mx: e.clientX, my: e.clientY })}
      />,
    );
  });
  const rows: ReactNode[] = [];
  if (hovered) {
    const line = (k: string, v: string): ReactNode => (
      <div key={k} className={styles.tiprow}>
        <span className={styles.tipK}>{k}</span>
        <span className={styles.tipV}>{v}</span>
      </div>
    );
    rows.push(line('在线', fmtDur(hovered.ms)));
    rows.push(line('对话进行中', fmtDur(hovered.turnMs)));
    rows.push(line('空档', fmtDur(hovered.idleMs)));
    rows.push(line('模型 + 工具', fmtDur(hovered.busyMs)));
    rows.push(line('活动段数', String(hovered.seg)));
    rows.push(line('会话数', String(hovered.sessions)));
    rows.push(line('Token', fmtTok(hovered.tokens)));
  }
  const pop =
    hover !== null && hovered
      ? portal(
          <div className={styles.tipfixed} style={tipPos(hover.mx, hover.my, 200, 40 + rows.length * 18)}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{cnDate(hovered.d)}</div>
            {rows}
          </div>,
        )
      : null;
  return (
    <div className={styles.svgwrap} ref={boxRef}>
      <div style={{ cursor: 'crosshair' }}>
        <svg
          viewBox={'0 0 ' + W + ' ' + H}
          width="100%"
          height={H}
          role="img"
          // 下标由每根柱的透明命中区给出（DOM 决定，不做坐标换算 → 不会因留边/缩放偏移）；
          // 容器这里只负责让浮层跟随鼠标。
          onMouseMove={(e: MouseEvent) =>
            setHover((prev) =>
              prev === null || (prev.mx === e.clientX && prev.my === e.clientY)
                ? prev
                : { i: prev.i, mx: e.clientX, my: e.clientY },
            )
          }
          onMouseLeave={() => setHover(null)}
        >
          {children}
        </svg>
      </div>
      {pop}
    </div>
  );
}

/** 三口径对照条 props。 */
interface ProportionBarsProps {
  view: OnlineView;
}

/** 三口径对照条：一眼看出「你 + DSH / DSH 的钟 / DSH 的活」 */
function ProportionBars(props: ProportionBarsProps): ReactNode {
  const v = props.view;
  const tip = useTip();
  const max = Math.max(v.total, v.busy, 1);
  const bar = (label: string, ms: number, color: string, note: string, faint?: boolean): ReactNode => (
    <div key={label} className={styles.bar} style={{ padding: '7px 0' }}>
      <div style={{ flex: '1 1 118px', minWidth: 118 }}>
        <div className={styles.title}>{label}</div>
        <div className={styles.desc}>{note}</div>
      </div>
      <div
        {...Object.assign(
          { className: styles.bartrack },
          tip.bind({
            k: label,
            title: label,
            rows: [
              ['时长', fmtDur(ms)],
              ['占在线', v.total > 0 ? Math.round((ms / v.total) * 100) + '%' : '—'],
            ],
            text: note,
          }),
        )}
      >
        <span
          className={styles.barfill}
          style={{
            width: Math.round((ms / max) * 100) + '%',
            background: color,
            opacity: faint ? 0.42 : 1,
          }}
        />
      </div>
      <div className={styles.mono} style={{ fontSize: 12.5, minWidth: 62, textAlign: 'right' }}>
        {fmtDur(ms)}
      </div>
    </div>
  );
  return (
    <div>
      {bar('在线（你 + DSH）', v.total, C_MAIN, '含你自己的追问/阅读空档', true)}
      {bar('对话进行中（DSH 的钟）', v.turn, C_MAIN, 'turn 区间并集，墙钟去重')}
      {bar('模型 + 工具（DSH 的活）', v.busy, C_BUSY, '并行会话相加，可高于墙钟', true)}
    </div>
  );
}

/** 数据准确性表 props。 */
interface AccuracyProps {
  view: OnlineView;
  snap: StatsSnapshot | null;
}

/** 数据准确性表：明确哪些精确、哪些估算 */
function Accuracy(props: AccuracyProps): ReactNode {
  const tip = useTip();
  const v = props.view;
  const snap = props.snap;
  const windowTokens = v.series.reduce((a, b) => a + b.tokens, 0);
  const row = (name: string, val: string, kind: 'exact' | 'estimate' | 'bound', note: string): ReactNode => (
    <tr key={name}>
      <td style={{ padding: '6px 8px 6px 0', whiteSpace: 'nowrap' }}>{name}</td>
      <td style={{ padding: '6px 8px 6px 0', whiteSpace: 'nowrap' }}>
        <Acc kind={kind} />
      </td>
      <td style={{ padding: '6px 8px 6px 0', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {val}
      </td>
      <td style={{ padding: '6px 0', color: 'var(--dsw-alias-label-secondary)' }}>{note}</td>
    </tr>
  );
  return (
    <div className={styles.card}>
      <div className={cx(styles.title, styles.titledIco)}>
        <Glyph name="target" size={14} className={styles.cico} />
        {'口径与准确性'}
      </div>
      <ProportionBars view={v} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 4 }}>
          <thead>
            <tr style={{ color: 'var(--dsw-alias-label-caption)', textAlign: 'left' }}>
              <th style={{ padding: '0 8px 4px 0', fontWeight: 500 }}>{'指标'}</th>
              <th style={{ padding: '0 8px 4px 0', fontWeight: 500 }}>{'性质'}</th>
              <th style={{ padding: '0 8px 4px 0', fontWeight: 500 }}>{'当前值'}</th>
              <th style={{ padding: '0 0 4px', fontWeight: 500 }}>{'说明'}</th>
            </tr>
          </thead>
          <tbody>
            {row(
              '在线时长',
              fmtDur(v.total),
              'bound',
              '日志只在有事件时打点：窗口开着但没事件的时间不可见，所以是下界；阈值（当前 ' +
                v.gap +
                ' 分钟）直接决定结果',
            )}
            {row(
              '对话进行中',
              fmtDur(v.turn),
              'estimate',
              'turn/start→turn/end 并集（墙钟去重）；含少量等你操作的时间（实测审批等待约 0.7h）',
            )}
            {row(
              '模型生成',
              fmtDur(v.llm),
              'exact',
              'step/start→assistant/message；已与 DSH 自带 sessionStats 投影逐会话对账一致',
            )}
            {row('工具执行', fmtDur(v.tool), 'exact', 'tool/call→tool/result 按 callId 配对')}
            {row(
              '引擎合计',
              fmtDur(v.busy),
              'exact',
              '上两者相加；同时开多个会话/子代理会重复计，所以可能大于墙钟',
            )}
            {row('活跃天数', String(v.activeDays), 'exact', '有事件或有用量的自然日数')}
            {row(
              'Token 用量',
              fmtTok(windowTokens),
              'exact',
              '当前区间的上报值；只统计供应商给了 usage 的步骤，未上报的算不到，因此略低',
            )}
            {row(
              '会话口径',
              snap ? (snap.sessionOutcomes?.['usage'] ?? 0) + ' / ' + snap.total : String(v.activeDays),
              'exact',
              snap
                ? '共 ' +
                    snap.total +
                    ' 个会话：' +
                    Object.entries(snap.sessionOutcomes ?? {})
                      .map(([k, n]) => (OUTCOME_LABELS[k] ?? k) + ' ' + n + ' 个')
                      .join(' · ')
                : '会话列表来自 sessionQuery',
            )}
          </tbody>
        </table>
      </div>
      {snap ? (
        <div className={styles.cacheRow}>
          <span className={styles.muted}>{'数据源'}</span>
          <span>
            {snap.scanned + '/' + snap.total + ' 个会话已扫描' + (snap.partial ? '（后台补扫中）' : '')}
          </span>
          {(snap.directReads ?? 0) > 0 ? (
            <span
              {...Object.assign(
                {},
                tip.bind({
                  k: 'direct',
                  title: '直读日志',
                  rows: [['会话数', String(snap.directReads)]],
                  text: '非 live 会话默认直接读日志文件（逐帧解压 + 切掉 fork 继承前缀），比官方 reader 快一到两个数量级；live 会话仍走官方 reader。',
                }),
              )}
            >
              {'直读 ' + snap.directReads + ' 个'}
            </span>
          ) : null}
          {snap.errors > 0 ? (
            <span
              {...Object.assign(
                {},
                tip.bind({
                  k: 'errors',
                  title: '扫描失败 ' + snap.errors + ' 个',
                  text:
                    (snap.errorSamples ?? []).length > 0
                      ? (snap.errorSamples ?? []).map((x) => x.id + '：' + x.message).join('；')
                      : '没有可用的原因样本',
                }),
              )}
            >
              {'扫描失败 ' + snap.errors + ' 个'}
            </span>
          ) : null}
          <span>{'缓存 ' + snap.storage}</span>
          <span>{'fork/续接的继承前缀不重复计时'}</span>
        </div>
      ) : null}
    </div>
  );
}

/** 悬浮提示的一行 */
function tipLine(k: string, v: string, key?: string): ReactNode {
  return (
    <div key={key ?? k} className={styles.tiprow}>
      <span className={styles.tipK}>{k}</span>
      <span className={styles.tipV}>{v}</span>
    </div>
  );
}

/** 每日在线排行 props。 */
interface RankingListProps {
  ranked: SeriesItem[];
  gap: number;
}

/**
 * 每日在线排行：**柱状图 + 列表合体** —— 每行既是名次也是一根横向堆叠条
 * （实色 = 对话进行中，浅色 = 空档，长度按当日在线时长占榜首的比例）。
 * 鼠标悬浮整行弹出该日明细（在线 / 对话中 / 空档 / 模型+工具 / 段数 / 会话 / Token）。
 */
function RankingList(props: RankingListProps): ReactNode {
  const [showAll, setShowAll] = useState(false);
  const [hover, setHover] = useState<{ i: number; mx: number; my: number } | null>(null);
  const ranked = props.ranked;
  if (ranked.length === 0) return <div className={styles.empty}>{'暂无数据'}</div>;
  const items = showAll ? ranked : ranked.slice(0, 8);
  let max = 1;
  for (const it of items) if (it.ms > max) max = it.ms;
  const rows = items.map((it, i) => {
    const wTurn = Math.round((it.turnMs / max) * 100);
    const wIdle = Math.round((it.idleMs / max) * 100);
    return (
      <div
        key={it.d}
        className={cx(styles.rankRow, i < 3 ? styles.top3 : undefined)}
        onMouseMove={(e: MouseEvent) => setHover({ i, mx: e.clientX, my: e.clientY })}
        onMouseLeave={() => setHover(null)}
      >
        <span className={styles.rankNo}>{String(i + 1)}</span>
        <div style={{ minWidth: 0 }}>
          <div className={styles.rankDate}>{dispDay(it.d) + ' ' + weekdayOf(it.d)}</div>
          <div className={styles.desc} style={{ margin: 0, fontSize: 11, whiteSpace: 'nowrap' }}>
            {it.sessions + ' 会话 · 段 ' + it.seg}
          </div>
        </div>
        <div className={styles.rankBarTrack}>
          <span className={styles.rankFillTurn} style={{ width: wTurn + '%' }} />
          <span className={styles.rankFillIdle} style={{ width: wIdle + '%' }} />
        </div>
        <span className={styles.rankVal}>{fmtDur(it.ms)}</span>
        <span className={styles.rankTok}>{fmtTok(it.tokens)}</span>
      </div>
    );
  });
  const hovered = hover !== null ? items[hover.i] : undefined;
  const pop =
    hover !== null && hovered
      ? portal(
          <div className={styles.tipfixed} style={tipPos(hover.mx, hover.my, 220, 190)}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>
              {cnDate(hovered.d) + '（第 ' + (hover.i + 1) + ' 名）'}
            </div>
            {tipLine('在线', fmtDur(hovered.ms), 'a')}
            {tipLine('对话进行中', fmtDur(hovered.turnMs), 'b')}
            {tipLine('空档', fmtDur(hovered.idleMs), 'c')}
            {tipLine('模型 + 工具', fmtDur(hovered.busyMs), 'd')}
            {tipLine('活动段数', String(hovered.seg), 'e')}
            {tipLine('会话数', String(hovered.sessions), 'f')}
            {tipLine('Token', fmtTok(hovered.tokens), 'g')}
          </div>,
        )
      : null;
  return (
    <div>
      <div className={styles.rankHead}>
        <span>{'#'}</span>
        <span>{'日期'}</span>
        <span>{'在线构成 · 实色 对话中 / 浅色 空档'}</span>
        <span style={{ textAlign: 'right' }}>{'在线'}</span>
        <span style={{ textAlign: 'right' }}>{'Token'}</span>
      </div>
      {rows}
      {pop}
      {ranked.length > 8 ? (
        <div className={styles.toolbar} style={{ margin: '8px 0 0', justifyContent: 'center' }}>
          <button type="button" className={styles.mini} onClick={() => setShowAll((v: boolean) => !v)}>
            {showAll ? '只看前 8 名' : '展开全部 ' + ranked.length + ' 天'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** 面板主体 props。 */
interface BodyProps {
  data: StatsSnapshot | null;
  err: string;
  gap: number;
  rangeDays: number;
  onGap: (g: number) => void;
  onRange: (d: number) => void;
  onReload: () => void;
}

/** 面板主体：数据未就绪时给一张提示卡，就绪后是完整的仪表板。 */
function Body(props: BodyProps): ReactNode {
  const tip = useTip();
  const data = props.data;
  const online = data && data.ready && data.online ? data.online : null;
  if (!online) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.title}>{'在线时长'}</div>
          <div className={styles.desc}>
            {props.err
              ? '读取失败：' + props.err
              : data && data.ready
                ? '当前 Host 未提供在线时长数据（插件需重启以加载新版 Host 半）。'
                : '统计尚未就绪，正在扫描会话日志…'}
          </div>
          <div className={styles.toolbar} style={{ marginTop: 8 }}>
            <button type="button" className={styles.mini} onClick={props.onReload}>
              {'重试'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  const view = deriveOnlineView(online, props.gap, props.rangeDays);
  /**
   * 五档阈值对比。**用快照里已有的 per-gap 累计值直接摆出来**，理由：
   * 阈值是「口径」不是「精度」——同一份日志 1 分钟档与 60 分钟档能差近一倍，只给当前档
   * 的一个数字，用户没法判断该选哪个；把五档 + 边际增量摆在一起，「多出来的那些小时是从哪来的」
   * 才看得见。（旧文案里写死过一句「60 分钟档比 1 分钟档多约 90h」，那是某个人的数据，
   * 对别人就是错的 —— 现在一律取自当前快照。）
   */
  const gapCmp = (
    <div className={styles.gapCmp}>
      {online.gaps.map((g, i) => {
        const ms = online.totalMs[String(g)] ?? 0;
        const prevMs = i > 0 ? (online.totalMs[String(online.gaps[i - 1])] ?? 0) : 0;
        const on = g === props.gap;
        return (
          <span
            key={String(g)}
            {...Object.assign(
              {
                className: cx(
                  styles.gapCmpItem,
                  on ? styles.gapCmpOn : undefined,
                  g === GAP_RECOMMEND ? styles.gapCmpRec : undefined,
                ),
                // 这几张卡本身就是切换入口：五档摆在一起看增量时，顺手就能切过去比
                onClick: () => props.onGap(g),
              },
              tip.bind({
                k: 'gap' + g,
                title: g + ' 分钟档',
                rows: [
                  ['累计在线', fmtDur(ms)],
                  ['活跃段数', String(online.segments[String(g)] ?? 0)],
                  ['比上一档多', i > 0 ? '+' + fmtDur(ms - prevMs) : '—'],
                ],
                text:
                  '把「相邻事件间隔 ≤ ' +
                  g +
                  ' 分钟」的时间都算作在线。档位越大，越多的静默期（读长回答、想需求、离开座位）被算进来。',
              }),
            )}
          >
            <b>{g + ' 分钟'}</b>
            <i>{fmtDur(ms)}</i>
            {i > 0 ? <em>{'+' + fmtDur(ms - prevMs)}</em> : null}
          </span>
        );
      })}
    </div>
  );

  /** 空闲阈值这一栏的完整说明（常驻显示，不再只藏在 tooltip 里） */
  const gapExplain = (
    <div className={styles.gapHint}>
      <div>{'在线 = 日志里有事件、且相邻事件间隔不超过阈值的那段墙钟时间。规则就三条：'}</div>
      <ul className={styles.gapRules}>
        <li>
          <b>{'间隔 ≤ 阈值 → 整段算在线'}</b>
          {
            '：10:00 与 10:50 各有一个事件、阈值 60 分钟，中间这 50 分钟（哪怕你不在）一并计入，并累加到当天。'
          }
        </li>
        <li>
          <b>{'间隔 > 阈值 → 断开'}</b>
          {'：从上一个事件处收尾，中间那段一秒都不计，新的一段从下一个事件重新起算。'}
        </li>
        <li>
          <b>{'每段只算到最后一个事件'}</b>
          {
            '：之后的时间不计（哪怕过了 1 分钟就关窗口，或者你接着又跑了 3 小时没产生事件）。所以任何档位算出来都是'
          }
          <em>{'下界'}</em>
          {'，不是「坐在电脑前」的时长。'}
        </li>
      </ul>
      <div className={styles.gapCmpTitle}>{'同一份日志下，五档分别是多少（点档位可切换）：'}</div>
      {gapCmp}
      <div className={styles.gapRec}>
        <b>{'推荐 15 分钟'}</b>
        {'（插件默认值）：DSH 真正在干活时日志里是有事件的（模型 step、工具 call/result、子代理），' +
          '不需要靠大阈值来兜；需要兜的是读长回答、想下一个需求这类静默期，通常几分钟量级。' +
          '5 分钟以下会把「读完回答再想一下」也切断，偏低；60 分钟会把「去开会/吃饭」整段算成在线，' +
          '只适合回答「今天开着 DSH 多久」。对照上面五档的增量，多出来的小时主要来自哪一档，一眼能看出来。'}
      </div>
    </div>
  );

  /** 两个档位组各自带标题 + 说明（此前只有 tooltip，看不出来是干什么的） */
  /**
   * @param control 传 null 表示这一栏没有独立的选择器（选择器就在 hint 里，例如空闲阈值的对比卡）
   * @param tipText 悬浮提示用的短文案；hint 可能是很长的节点，整个塞进 tooltip 会又长又乱
   */
  const segRow = (
    label: string,
    hint: ReactNode,
    control: ReactNode,
    rows?: Array<[string, string]>,
    tipText?: string,
  ): ReactNode => (
    <div className={styles.segField}>
      <div
        {...Object.assign(
          { className: styles.segFieldKey },
          tip.bind({
            k: label,
            title: label,
            text: tipText !== undefined ? tipText : typeof hint === 'string' ? hint : '',
            ...(rows ? { rows } : {}),
          }),
        )}
      >
        {label}
      </div>
      {control === null || control === undefined ? null : <div className={styles.segFieldCtl}>{control}</div>}
      <div className={styles.segFieldHint}>{hint}</div>
    </div>
  );
  return (
    <div className={styles.page}>
      <TipHost />
      <div className={styles.card} style={{ padding: '10px 12px' }}>
        {segRow(
          '空闲阈值',
          gapExplain,
          null,
          [
            ['当前', props.gap + ' 分钟'],
            ['这个档算出的累计在线', fmtDur(view.total)],
            ['活跃段数', String(view.segments)],
            ['比 1 分钟档多', '+' + fmtDur(view.total - (online.totalMs['1'] ?? view.total))],
          ],
          '在线 = 有事件、且相邻事件间隔不超过阈值的墙钟时间。点下面的档位切换；档位越大，越多的静默期被算进来。',
        )}
        {segRow(
          '时间范围',
          '「每日在线」图表与下方「在线最多的日子」明细的统计窗口；上面的累计/日均始终按全部活跃日计算。',
          <Seg items={RANGE_LABELS} value={props.rangeDays} onPick={props.onRange} />,
          [['当前区间', props.rangeDays === 0 ? '全部活跃日' : '近 ' + props.rangeDays + ' 天']],
        )}
        <div className={styles.toolbar} style={{ margin: '2px 0 0' }}>
          <span className={styles.hint}>{online.activeDays + ' 个活跃日 · 默认按全部显示'}</span>
        </div>
      </div>
      <OnlineMetrics view={view} online={online} />
      {/* ── 卡片区：12 栏仪表板栅格（宽屏下排行与口径并排，窄了自动落回单列）── */}
      <div className={styles.dash}>
        <div className={styles.c12}>
          <OnlineDaily view={view} />
        </div>
        <div className={styles.c7}>
          <OnlineRank view={view} />
        </div>
        <div className={styles.c5}>
          <Accuracy view={view} snap={data} />
        </div>
      </div>
    </div>
  );
}

/** 在线三口径数据卡 props。 */
interface OnlineMetricsProps {
  view: OnlineView;
  online: StatsOnline;
}

/**
 * 在线三口径基础数据卡（7 张指标卡）。
 *
 * 从 OnlineView 里抽出来成为独立组件：**在线视图与分享面板共用同一份 JSX**。
 * 分享面板要把这些块内聚进一张 16:9 卡片，若复制一份出来改，两边必然逐渐走样。
 */
function OnlineMetrics(props: OnlineMetricsProps): ReactNode {
  const view = props.view;
  const online = props.online;
  return (
    // 旧实现的 `tm-onlinecards` 在样式表里从来没有对应规则（在线网格走的是 `.statGrid` +
    // `.onlineGrid`），CSS Module 迁移后 `styles.onlinecards` 只会是 undefined、被 cx 静默滤掉；
    // 按 providers/kit.tsx 里 'tm-payg' 同一处先例，这里只保留真正有规则的类。
    <div className={styles.card}>
      <div className={styles.chartTitle}>
        {cardName('clock', '在线时长')}
        <AccLegend />
      </div>
      <div className={cx(styles.statGrid, styles.onlineGrid)}>
        <Stat
          icon="sun"
          label="今日在线"
          value={fmtDurCn(view.today)}
          tint
          sub="截至此刻"
          acc="bound"
          tip={{
            k: 'today',
            title: '今日在线 · 下界',
            text: '有事件覆盖、且空档 ≤ ' + view.gap + ' 分钟的时间。日志只在有事件时打点，所以是下界。',
          }}
        />
        <Stat
          icon="hourglass"
          label="累计在线"
          value={fmtDurCn(view.total)}
          sub={
            (online.firstDay ? dispDay(online.firstDay) + ' 起' : '') +
            ' · 共 ' +
            view.activeDays +
            ' 个活跃日'
          }
          acc="bound"
          tip={{
            k: 'total',
            title: '累计在线 · 下界',
            rows: [
              ['活跃日', String(view.activeDays)],
              ['日均', fmtDur(view.avg)],
              ['当前口径', view.gap + ' 分钟'],
            ],
            text:
              '这个数字依赖空闲阈值：阈值越大，越多的静默期被算进来，所以它同时是"下界"和"阈值口径"的产物。' +
              '切一下面板顶部的档位，能看到同一份日志在五档下的差别。',
          }}
        />
        <Stat
          icon="wave"
          label="活跃日均"
          value={fmtDurCn(view.avg)}
          sub="仅按有活动的日子平均"
          tip={{
            k: 'avg',
            title: '活跃日均',
            rows: [
              ['累计', fmtDur(view.total)],
              ['活跃日', String(view.activeDays)],
            ],
            text: '只按有活动的日子平均，不含空白天。',
          }}
        />
        <Stat
          icon="bubble"
          label="对话进行中"
          value={fmtDurCn(view.turn)}
          sub={'占在线 ' + (view.total > 0 ? Math.round((view.turn / view.total) * 100) : 0) + '%'}
          acc="estimate"
          tip={{
            k: 'turn',
            title: '对话进行中 · 估算',
            rows: [
              ['时长', fmtDur(view.turn)],
              ['占在线', (view.total > 0 ? Math.round((view.turn / view.total) * 100) : 0) + '%'],
            ],
            text: 'turn/start→turn/end 的并集（墙钟去重）：DSH 在为你干活的钟，含少量等你操作的时间。',
          }}
        />
        <Stat
          icon="chip"
          label="模型生成"
          value={fmtDurCn(view.llm)}
          sub="已与官方投影对账"
          acc="exact"
          tip={{
            k: 'llm',
            title: '模型生成 · 精确',
            text: 'step/start→assistant/message；已与 DSH 自带 sessionStats 投影逐会话对账（126/126 一致）。',
          }}
        />
        <Stat
          icon="terminal"
          label="工具执行"
          value={fmtDurCn(view.tool)}
          sub="call→result"
          acc="exact"
          tip={{
            k: 'tool',
            title: '工具执行 · 精确',
            text: 'tool/call→tool/result 按 callId 配对；turn/end 时丢弃未落地的调用。',
          }}
        />
        <Stat
          icon="gear"
          label="引擎合计"
          value={fmtDurCn(view.busy)}
          sub="并行相加，可高于墙钟"
          wide
          acc="exact"
          tip={{
            k: 'busy',
            title: '引擎合计 · 精确',
            rows: [
              ['模型生成', fmtDur(view.llm)],
              ['工具执行', fmtDur(view.tool)],
            ],
            text: '两者相加；同时开多个会话/子代理会重复计，所以可能大于墙钟的「对话进行中」。',
          }}
        />
      </div>
    </div>
  );
}

/** 每日在线图卡 props。 */
interface OnlineDailyProps {
  view: OnlineView;
}

/**
 * 每日在线图卡（Chart + Legend）。
 * 同样供在线视图与分享面板共用，避免分享卡里出现第二份画法。
 */
function OnlineDaily(props: OnlineDailyProps): ReactNode {
  const view = props.view;
  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <span className={cx(styles.title, styles.titledIco)}>
          <Glyph name="chartBar" size={14} className={styles.cico} />
          {'每日在线'}
        </span>
        <span className={styles.hint}>
          {view.peak ? '峰值 ' + cnDate(view.peak.d) + ' ' + fmtDur(view.peak.ms) : ''}
        </span>
      </div>
      <Chart items={view.series} gap={view.gap} />
      <Legend />
    </div>
  );
}

/** 每日在线排行卡 props。 */
interface OnlineRankProps {
  view: OnlineView;
}

/**
 * 每日在线排行卡（柱状图 + 列表合体）。
 * 与 OnlineMetrics / OnlineDaily 同理：在线视图与分享面板共用同一份 JSX。
 */
function OnlineRank(props: OnlineRankProps): ReactNode {
  const view = props.view;
  return (
    <div className={styles.card}>
      <div className={styles.toolbar} style={{ margin: '0 0 2px' }}>
        <span className={cx(styles.title, styles.titledIco)} style={{ margin: 0 }}>
          <Glyph name="list" size={14} className={styles.cico} />
          {'每日在线排行'}
        </span>
        <span className={styles.hint}>
          {'当前区间 ' + view.ranked.length + ' 个活跃日 · 按在线时长排序 · 鼠标悬浮看当日明细'}
        </span>
      </div>
      <RankingList ranked={view.ranked} gap={view.gap} />
    </div>
  );
}

/** 嵌入式在线块 props。 */
interface OnlineEmbedProps {
  data: StatsSnapshot;
  block: 'metrics' | 'daily' | 'rank';
  gap?: number;
}

/**
 * 分享面板用的嵌入式在线块：数据由调用方传入（分享面板已经拿着同一份 /stats 快照），
 * 因此不自己轮询、不渲染档位控件 —— 静态卡上不该出现可点的开关。
 */
export function OnlineEmbed(props: OnlineEmbedProps): ReactNode {
  const online = props.data && props.data.ready && props.data.online ? props.data.online : null;
  if (online === null) return <div className={styles.desc}>{'当前 Host 未提供在线时长数据。'}</div>;
  const view = deriveOnlineView(online, props.gap ?? online.defaultGapMin ?? 5, 0);
  if (props.block === 'metrics') return <OnlineMetrics view={view} online={online} />;
  if (props.block === 'rank') return <OnlineRank view={view} />;
  return <OnlineDaily view={view} />;
}

/** 中心区「在线统计」分区面板 props（槽位不传参数：面板自己取数与存档位）。 */
export interface OnlineViewProps {}

/** 中心区「在线统计」分区面板 */
export function OnlineView(_props: OnlineViewProps): ReactNode {
  const [gapState, setGapState] = useState<number | null>(null);
  const [rangeDays, setRangeDays] = useState(0); // 默认「全部」
  const { snap, err, reload } = useSnapshot();
  const online = snap && snap.ready && snap.online ? snap.online : null;
  const gap = gapState !== null ? gapState : online ? online.defaultGapMin : GAP_RECOMMEND;
  const onGap = useCallback(
    (g: number) => {
      setGapState(g);
      void saveConfig({ onlineGapMin: g }).catch(() => {});
      try {
        window.dispatchEvent(new Event('tm-prefs-changed'));
      } catch {
        /* ignore */
      }
    },
    [setGapState],
  );
  return (
    <Body
      data={snap}
      err={err}
      gap={gap}
      rangeDays={rangeDays}
      onGap={onGap}
      onRange={setRangeDays}
      onReload={reload}
    />
  );
}
