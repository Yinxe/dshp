/**
 * @dshp/token-meter —— provider UI 通用组件库（kit）
 *
 * 设计意图（对应「每个 provider 都能 return 自己的数据，client 也有一套属于它
 * 自己的 UI」）：
 *
 *   Host 侧：适配器 return 自己的数据（ProviderResult：windows/billing/view/extra…）
 *   Client 侧：`providers/ui/<type>.tsx` 是**该供应商专属的完整 UI 实现**，
 *              自己决定怎么排版；需要通用零件时从本 kit 取，不重复造。
 *
 * 因此本文件是「零件仓库」而非「渲染框架」——它不认识任何供应商，只提供可复用
 * 的展示组件与格式化工具：
 *
 *   RollingBar   滚动刷新进度条（label + 进度 + 占比 + 剩余时长）★最常用
 *   WindowGroup  多条窗口成组（自动附「最高占用 / 最早重置」汇总行）
 *   BalanceBlock 余额主数字块（币种/可用状态/赠送充值拆分/多币种/低余额告警）
 *   MetricRows   键值指标行集合
 *   SplitBar     分段占比条（含图例与百分比）
 *   NoteLine     提示条（info/warn/bad 三色）
 *   MiniChart    趋势折线（纯 SVG）
 *   SectionTitle 区块小标题
 *   Chips        徽标组（计划/状态/来源等小标签）
 *   ErrorCard    失败卡（结构化结论 + 排查步骤 + 原始信息）
 *
 * 工具函数 num/fmt/fmtLeft/curSymbol/remainOf/timeAgo 一并透出，保证专属 UI 与
 * 兜底渲染的格式化口径完全一致。
 *
 * 工厂形态说明：`createProviderKit(React, deps)` 的 **React 形参取消**（模块顶层 import），
 * 每个零件也各自成了具名导出；`deps` 是 QuotaSection 注入的**真实依赖**（数值格式化、
 * 错误展开态），仍以参数传入 —— 由 `createProviderKit(deps)` 收拢成
 * `ProviderUIKit` 命名空间，专属 UI / 声明式渲染按 `K.零件名` 取用。
 */
import type { ReactNode } from 'react';
import { createErrorBox, fallbackErrorInfo } from '../ErrorBox.js';
import { ProviderIcon } from '../provider-icons.js';
import type { PrefsApi } from '../quota-prefs.js';
import { QuotaRing } from '../QuotaRing.js';
import styles from '../styles.module.css';
import type { ErrorInfo, QuotaBilling, QuotaWindow, VendorSnapshot } from '../types.js';
import { RAIL_ICON } from './templates.js';
import type { QuotaRingSpec, QuotaTone, ButtonVariant } from './templates.js';
import { toneOfPct, windowPct } from './templates.js';

/**
 * 分段占比条的**语义色调 → 类名**（颜色全在 styles.module.css 里，一律取主题 token）。
 *
 * 为什么不再用写死的十六进制调色板：比例条（额度构成、模型构成…）以前用 `X_PAL` 的
 * 蓝/绿/橙/红，换主题时一律不变 —— 那正是「安全/警告/危险色固定」的来源。
 * 现在供应商只声明语义（`brand`/`ok`/`warn`/`bad`/`info`/`muted`），配色交给主题。
 */
const SEG_TONE: Record<string, string | undefined> = {
  brand: styles.segBrand,
  ok: styles.segOk,
  warn: styles.segWarn,
  bad: styles.segBad,
  info: styles.segInfo,
  muted: styles.segMuted,
};

/** 没声明色调时的轮转槽（仍是 token 派生，不是写死色值）。 */
const SEG_PAL = [
  styles.segPal0,
  styles.segPal1,
  styles.segPal2,
  styles.segPal3,
  styles.segPal4,
  styles.segPal5,
  styles.segPal6,
  styles.segPal7,
];

/**
 * 渲染上下文：快照 + 当前时间（窗口倒计时用）+ 供应商身份 + **该供应商自己的展示偏好**。
 *
 * `prefs` 是按供应商分作用域的键值袋（浏览器本地）：键值由供应商模板**自己定义**
 * （Goat 用 `window` / `balance`，别的供应商可以完全不同），客户端不解释任何键名。
 * 按钮模板读它决定画什么，详情模板画控件写它 —— 点一下按钮立刻重画。
 */
export interface RenderCtx {
  snap: VendorSnapshot;
  now: number;
  type: string;
  vendorName: string;
  prefs: PrefsApi;
}

/** kit 构造依赖（由 QuotaSection 注入，避免循环依赖与重复实现）。 */
export interface KitDeps {
  num: (v: unknown, d: number) => number;
  fmt: (n: unknown) => string;
  fmtLeft: (sec: number) => string;
  curSymbol: (cur: string) => string;
  remainOf: (w: { resetInSec: number }, snap: VendorSnapshot, nowMs: number) => number;
  /** 相对时间（如「3 分钟前」） */
  timeAgo: (iso: string) => string;
  /** 进度等级 → CSS 后缀（ok/warn/bad/over） */
  levelOf: (pct: number) => string;
  /** 等级说明（title 提示用） */
  levelTip: (lvl: string) => string;
  /** 失败卡展开态（跨卡片共享） */
  errOpen: () => boolean;
  toggleErr: () => void;
  /** 可选：跳到设置页 */
  openSettings?: () => void;
}

/** 组件与工具的命名空间（deps 绑定后由 `createProviderKit` 产出）。 */
export interface ProviderUIKit {
  RollingBar: (props: RollingBarProps) => ReactNode;
  WindowGroup: (props: WindowGroupProps) => ReactNode;
  BalanceBlock: (props: BalanceBlockProps) => ReactNode;
  MetricRows: (props: MetricRowsProps) => ReactNode;
  /** 两列紧凑指标网格：条目多时把高度减半 */
  MetricGrid: (props: MetricGridProps) => ReactNode;
  SplitBar: (props: SplitBarProps) => ReactNode;
  NoteLine: (props: NoteLineProps) => ReactNode;
  MiniChart: (props: MiniChartProps) => ReactNode;
  SectionTitle: (props: SectionTitleProps) => ReactNode;
  Chips: (props: ChipsProps) => ReactNode;
  ErrorCard: (props: {
    info?: ErrorInfo | null | undefined;
    msg?: string | undefined;
    meta?: string | undefined;
    onRetry?: (() => void) | undefined;
    compact?: boolean | undefined;
  }) => ReactNode;

  /* ── 按钮级模板专用零件（侧边栏那枚按钮里能画什么）───────────────── */

  /** 环形进度（把 `QuotaRingSpec` 画成 SVG；几何/配色/动画统一在这里）。 */
  Ring: (props: { spec: QuotaRingSpec; size?: number | undefined; stroke?: number | undefined }) => ReactNode;
  /** 供应商图标（自绘抽象标记；未知名字给通用那枚）。 */
  ProviderIcon: (props: { name?: string | undefined; size?: number | undefined }) => ReactNode;
  /** 按钮骨架：宽栏 = 图标 + 主图形 + 名字 + 数值；窄栏/切换行 = 只留主图形。 */
  ButtonLayout: (props: ButtonLayoutProps) => ReactNode;
  /** 多条滚动窗口的迷你条（5 小时 / 每周 / 每月并排；比三个环更适合宽栏）。 */
  WindowBars: (props: WindowBarsProps) => ReactNode;
  /** 窗口短标签（`5 小时` → `5时`）—— 窄栏里能省一个字是一个。 */
  shortWindowLabel: (label: string) => string;
  /** 极短金额（`$46.6` → `$47`、`¥12345` → `¥1.2万`）—— 窄栏 36px 圆里只塞得下这个。 */
  tinyMoney: (text: string) => string;
  /** 偏好开关（勾选即写 `ctx.prefs`，按钮立刻重画）。 */
  PrefSwitch: (props: PrefSwitchProps) => ReactNode;
  /** 偏好单选组（`data-on` 标出当前项）。 */
  PrefChoice: (props: PrefChoiceProps) => ReactNode;

  num: KitDeps['num'];
  fmt: KitDeps['fmt'];
  fmtLeft: KitDeps['fmtLeft'];
  curSymbol: KitDeps['curSymbol'];
  remainOf: KitDeps['remainOf'];
  timeAgo: KitDeps['timeAgo'];
  levelOf: KitDeps['levelOf'];
}

/** 按钮骨架 props（三档位置共用一套排版规则）。 */
export interface ButtonLayoutProps {
  /** 哪一档（`wide` 显示文字，`rail`/`row` 只显示主图形）。 */
  variant: ButtonVariant;
  /** 主图形：环 / 图标 / 迷你条 / 任意节点（窄栏当表盘外圈，切换行只显示它）。 */
  leading: ReactNode;
  /** 供应商名（仅宽栏显示）。 */
  name?: string | undefined;
  /** 右对齐的数值文案（仅宽栏显示；如 `91%` / `¥9.06`）。 */
  value?: string | undefined;
  /** 数值的色调（`bad` 变红等）；与环的档位同源。 */
  tone?: QuotaTone | undefined;
  /** 供应商图标名（宽栏放在主图形之前；窄栏居中在表盘环心，见 `RAIL_ICON`）。 */
  icon?: string | undefined;
  /**
   * 窄栏（56px 轨道）专用内容；缺省 = **表盘**（`leading` 那枚环当外圈 + 供应商图标居中在环心）。
   *
   * 之所以要它：窄栏里有些画法需要另排（例如迷你条、余额数字），而表盘那一套放不下。
   */
  rail?: ReactNode | undefined;
  /**
   * 切换行（浮层里的供应商列表，16px 槽）专用内容；缺省用 `leading`。
   *
   * 与 `rail` 分开是因为两者约束不同：窄栏有 36px 可以画表盘，
   * 而切换行只有 16px —— 余额那种长内容必须在这里换成紧凑图形（环 / 图标）。
   */
  glyph?: ReactNode | undefined;
}

/** 迷你窗口条 props。 */
export interface WindowBarsProps {
  /** 要画的窗口（按给定顺序；通常 5 小时 / 每周 / 每月）。 */
  windows?: QuotaWindow[] | undefined;
  /** 高亮哪一条（用户选中的指标键；空 = 不高亮）。 */
  activeKey?: string | undefined;
  /** 条高 px。 */
  height?: number | undefined;
}

/** 偏好开关 props（如「显示余额」）。 */
export interface PrefSwitchProps {
  /** 开关文案。 */
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** 可选说明（title）。 */
  hint?: string | undefined;
}

/** 偏好单选组 props（如 `5h / 1w / 1m`）。 */
export interface PrefChoiceProps {
  /** 组标签（可省）。 */
  label?: string | undefined;
  value: string;
  options: Array<{ value: string; label: string; hint?: string | undefined }>;
  onChange: (next: string) => void;
}

/** 分区小标题 props。 */
export interface SectionTitleProps {
  text?: string | undefined;
}

/** 滚动刷新进度条 props。 */
export interface RollingBarProps {
  label: string;
  pct: number;
  left?: string | undefined;
  barKey?: string | undefined;
  /** 上游窗口状态；非 ok 时尾部加状态标签（限流时 pct 可能还没到 100） */
  status?: string | undefined;
}

/** 多窗口成组 props。 */
export interface WindowGroupProps {
  windows?: QuotaWindow[] | undefined;
  snap: VendorSnapshot;
  now: number;
  title?: string | undefined;
  /** 省略「最高占用 / 最早重置」汇总行（每行已各自标了重置时长时，该行是冗余） */
  noSummary?: boolean | undefined;
}

/** 余额块 props。 */
export interface BalanceBlockProps {
  billing?: QuotaBilling | null | undefined;
  title?: string | undefined;
  compact?: boolean | undefined;
}

/** 键值指标行 props。 */
export interface MetricRowsProps {
  items?: Array<{ label: string; value: string }> | undefined;
  title?: string | undefined;
}

/** 两列紧凑指标网格 props。 */
export interface MetricGridProps {
  items?: Array<{ label: string; value: string }> | undefined;
  title?: string | undefined;
  /** 每列占比合并显示（如「输入 5905万 · 输出 27万」压成一行） */
  mergePairs?: boolean | undefined;
}

/** 分段占比条 props。 */
export interface SplitBarProps {
  segments?: Array<{ label: string; value: number; tone?: string; color?: string }> | undefined;
  title?: string | undefined;
}

/** 提示条 props。 */
export interface NoteLineProps {
  text?: unknown;
  tone?: 'info' | 'warn' | 'bad' | undefined;
}

/** 趋势折线 props。 */
export interface MiniChartProps {
  chart?: { title?: string; labels?: string[]; values?: number[] } | undefined;
}

/** 徽标组 props。 */
export interface ChipsProps {
  chips?: Array<{ text: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }> | undefined;
}

/** 分区小标题。 */
export function SectionTitle(props: SectionTitleProps): ReactNode {
  return props.text ? <div className={styles.xtitle}>{props.text}</div> : null;
}

/** 上游窗口状态 → 中文短标签（非 ok 才显示，如 opencode 的 rate-limited）。 */
function statusText(st: string): string {
  const k = st.toLowerCase().replace(/[\s_-]/g, '');
  const MAP: Record<string, string> = {
    ratelimited: '已限流',
    throttled: '已限流',
    exceeded: '已超限',
    overlimit: '已超限',
    disabled: '已停用',
    paused: '已暂停',
    expired: '已过期',
  };
  return MAP[k] || st;
}

/** ★ 滚动刷新进度条：一条 = 一个窗口/额度周期 */
export function RollingBar(deps: KitDeps, props: RollingBarProps): ReactNode {
  const pct = Number(props.pct) || 0;
  const lvl = deps.levelOf(pct);
  const bad = props.status && props.status !== 'ok' ? props.status : '';
  const barTitle = deps.levelTip(lvl) + '（' + Math.round(pct) + '%）' + (bad ? ' · 上游状态：' + bad : '');
  return (
    <div className={styles.qrow} key={props.barKey}>
      <span className={styles.qlabel}>{props.label}</span>
      <div className={styles.qbar} title={barTitle}>
        <span
          className={styles.qfill + (lvl === 'ok' ? '' : ' ' + styles[lvl])}
          style={{ width: Math.min(100, pct) + '%' }}
        />
      </div>
      <span className={styles.qpct + (lvl === 'ok' ? '' : ' ' + styles[lvl])}>{Math.round(pct) + '%'}</span>
      {bad ? (
        <span className={styles.qstatus} title={'上游窗口状态：' + bad}>
          {statusText(bad)}
        </span>
      ) : null}
      {props.left ? <span className={styles.qleft}>{props.left}</span> : null}
    </div>
  );
}

/** 多条窗口成组 + 汇总行（最高占用 / 最早重置） */
export function WindowGroup(deps: KitDeps, props: WindowGroupProps): ReactNode {
  const wins = (Array.isArray(props.windows) ? props.windows : []).filter((w) => w && w.label !== undefined);
  if (!wins.length) return null;
  const kids: ReactNode[] = [];
  if (props.title) kids.push(<SectionTitle key="t" text={props.title} />);
  wins.forEach((w, i) => {
    // resetInSec<=0 = 该窗口没有重置时间（本地账本、周期未知）→ 不显示倒计时，
    // 否则会渲染成误导性的「0 秒」
    const left = w.resetInSec > 0 ? deps.fmtLeft(deps.remainOf(w, props.snap, props.now)) : undefined;
    kids.push(
      RollingBar(deps, {
        barKey: w.key || 'w' + i,
        label: w.label,
        pct: w.pct,
        left,
        status: w.status,
      }),
    );
  });
  if (wins.length > 1 && !props.noSummary) {
    const worst = wins.reduce((m, w) => (w.pct > m.pct ? w : m), wins[0] as QuotaWindow);
    const minRem = wins.reduce((m, w) => Math.min(m, deps.remainOf(w, props.snap, props.now)), Infinity);
    kids.push(
      <div key="sum" className={styles.paygSub}>
        {'最高占用 ' + worst.label + ' ' + Math.round(worst.pct) + '% · 最早重置' + deps.fmtLeft(minRem)}
      </div>,
    );
  }
  return <div className={styles.body}>{kids}</div>;
}

/** 余额主数字块（payg 语义的通用展示） */
export function BalanceBlock(deps: KitDeps, props: BalanceBlockProps): ReactNode {
  const b = (props.billing || {}) as Record<string, unknown>;
  if (!Object.keys(b).length) return null;
  const amt = deps.num(b['balance'], 0);
  const cur = String(b['currency'] || 'CNY');
  const sym = deps.curSymbol(cur);
  const granted = b['granted'] !== undefined && b['granted'] !== null ? deps.num(b['granted'], 0) : null;
  const topped = b['toppedUp'] !== undefined && b['toppedUp'] !== null ? deps.num(b['toppedUp'], 0) : null;
  const avail = b['isAvailable'];
  // 单一判据：余额 ≤ 0 也算「不可用」—— 与下面那条红字余额告警用的是同一个 empty。
  // 上游多数 provider 在余额非正时只回 null（它们不肯替上游断言「不可用」，见
  // host/providers/*.ts 的 `isAvailable: balance > 0 ? true : null`），旧代码只读
  // isAvailable，于是同一张卡会出现「状态未知」顶着「余额不足」红字的自相矛盾。
  const empty = amt <= 0 || avail === false;
  const availCls = empty ? 'bad' : avail === true ? 'ok' : 'unknown';
  const availTxt = availCls === 'bad' ? '不足' : availCls === 'ok' ? '可用' : '状态未知';
  const availTip =
    '可用性徽标：\n' +
    '· 可用 —— 上游明确说可用\n' +
    '· 不足 —— 上游明确报不足，或余额已 ≤ 0（与下方余额告警同一个判据）\n' +
    '· 状态未知 —— 上游没有给出可用性判断，这里只反映余额数字本身（例如手动账本）';
  const warnLine =
    b['lowWarn'] !== undefined && b['lowWarn'] !== null && b['lowWarn'] !== ''
      ? deps.num(b['lowWarn'], 0)
      : null;
  const infos = Array.isArray(b['infos']) ? (b['infos'] as Array<Record<string, unknown>>) : [];
  const kids: ReactNode[] = [];
  if (props.title) kids.push(<SectionTitle key="t" text={props.title} />);
  kids.push(
    <div key="top" className={styles.paygTop}>
      <div>
        {/* 币种只出现一次：curSymbol 对已知币种给符号（$ / ¥），未知币种给「代码 + 空格」，
            以前这里又拼了一遍 cur，于是显示成 `$USD 46.07` */}
        <span className={styles.paygCur}>{sym || cur}</span>
        <span className={styles.paygAmt + (amt < 0 ? ' ' + styles.neg : '')}>{deps.fmt(amt)}</span>
      </div>
      <span className={styles.avail + ' ' + styles[availCls]} title={availTip}>
        {availTxt}
      </span>
    </div>,
  );
  const parts: string[] = [];
  if (granted !== null && granted > 0) parts.push('赠送 ' + sym + deps.fmt(granted));
  if (topped !== null && topped > 0) parts.push('充值 ' + sym + deps.fmt(topped));
  if (warnLine !== null) parts.push('预警线 ' + sym + deps.fmt(warnLine));
  if (parts.length)
    kids.push(
      <div key="parts" className={styles.paygSub}>
        {parts.join(' · ')}
      </div>,
    );
  if (infos.length > 1)
    kids.push(
      <div key="infos" className={styles.infos}>
        {infos.map((x, i) => (
          <div key={String(x['currency'] || i)} className={styles.inforow}>
            <span>{String(x['currency'] || '?')}</span>
            <b>{deps.fmt(x['total'])}</b>
          </div>
        ))}
      </div>,
    );
  // empty 已在上面算好（徽标与这条告警共用同一个判据，两处不会再打架）
  const low = !empty && warnLine !== null && amt <= warnLine;
  if (empty)
    kids.push(
      <div key="warn" className={styles.warnLine + ' ' + styles.bad}>
        {'余额不足，API 调用可能被拒绝，请及时充值。'}
      </div>,
    );
  else if (low)
    kids.push(
      <div key="warn" className={styles.warnLine}>
        {'余额低于预警线 ' + sym + deps.fmt(warnLine) + '，建议及时充值。'}
      </div>,
    );
  // 旧实现的 'tm-payg' 在样式表里从来没有对应规则（只有 .tm-payg-* 系列），CSS Module 迁移后
  // `styles.payg` 只会是 undefined、被 React 静默丢掉；这里只保留 compact 修饰类。
  return <div className={props.compact ? styles.paygCompact : undefined}>{kids}</div>;
}

/** 键值指标行 */
export function MetricRows(deps: KitDeps, props: MetricRowsProps): ReactNode {
  const items = (Array.isArray(props.items) ? props.items : []).filter((it) => it && it.label);
  if (!items.length) return null;
  return (
    <div className={styles.xstats}>
      {props.title ? <SectionTitle key="t" text={props.title} /> : null}
      {items.map((it, i) => (
        <div key={'r' + i} className={styles.xrow}>
          <span>{String(it.label)}</span>
          <b>{String(it.value)}</b>
        </div>
      ))}
    </div>
  );
}

/**
 * 两列紧凑指标网格：单列 8 行会占掉卡片近半高度，两列直接减半。
 * mergePairs=true 时把相邻两项合成一格（「输入 5905万 · 输出 27万」），进一步省行。
 */
export function MetricGrid(deps: KitDeps, props: MetricGridProps): ReactNode {
  const items = (Array.isArray(props.items) ? props.items : []).filter((it) => it && it.label);
  if (!items.length) return null;
  const cells: Array<{ label: string; value: string }> = [];
  if (props.mergePairs) {
    for (let i = 0; i < items.length; i += 2) {
      const a = items[i] as { label: string; value: string };
      const b = items[i + 1];
      if (b) cells.push({ label: a.label + ' / ' + b.label, value: a.value + ' · ' + b.value });
      else cells.push(a);
    }
  } else {
    for (const it of items) cells.push(it);
  }
  return (
    <div className={styles.xgrid}>
      {props.title ? <SectionTitle key="t" text={props.title} /> : null}
      <div key="g" className={styles.xgridBody}>
        {cells.map((c, i) => (
          <div key={'c' + i} className={styles.xcell} title={c.label + '：' + c.value}>
            <span className={styles.xcellLabel}>{c.label}</span>
            <b className={styles.xcellValue}>{c.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 分段占比条 */
export function SplitBar(deps: KitDeps, props: SplitBarProps): ReactNode {
  const segs = (Array.isArray(props.segments) ? props.segments : [])
    .filter((sg) => sg && isFinite(Number(sg.value)) && Number(sg.value) > 0)
    .slice(0, 8);
  if (!segs.length) return null;
  const sum = segs.reduce((acc, x) => acc + Number(x.value), 0);
  /** 一段的配色：语义色调 → 类名；旧适配器给的 `color` 仍作为**静态色兜底**（不推荐）。 */
  const segClass = (i: number): string | undefined => {
    const tone = segs[i]?.tone;
    if (tone !== undefined && SEG_TONE[tone] !== undefined) return SEG_TONE[tone];
    return SEG_PAL[i % SEG_PAL.length];
  };
  const segStyle = (i: number): { flexGrow?: number; background?: string } => {
    const style: { flexGrow?: number; background?: string } = { flexGrow: Number(segs[i]?.value) };
    const legacy = segs[i]?.color;
    if (segs[i]?.tone === undefined && typeof legacy === 'string' && legacy !== '') style.background = legacy;
    return style;
  };
  return (
    <div>
      {props.title ? <SectionTitle key="t" text={props.title} /> : null}
      <div className={styles.xsplit}>
        {segs.map((sg, i) => (
          <span key={'g' + i} className={segClass(i)} style={segStyle(i)} />
        ))}
      </div>
      <div className={styles.xstats}>
        {segs.map((sg, i) => (
          <div key={'l' + i} className={styles.xrow}>
            <span>
              <span className={styles.xdot + ' ' + String(segClass(i))} style={segStyle(i)} />
              {String(sg.label || '')}
            </span>
            <b>{String(Math.round((Number(sg.value) * 100) / sum)) + '%'}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 提示条 */
export function NoteLine(deps: KitDeps, props: NoteLineProps): ReactNode {
  const t = typeof props.text === 'string' ? props.text : '';
  if (!t) return null;
  const tone =
    props.tone === 'bad'
      ? styles.warnLine + ' ' + styles.bad
      : props.tone === 'warn'
        ? styles.warnLine
        : styles.paygSub;
  return <div className={tone}>{t}</div>;
}

/** 趋势折线（纯 SVG，无依赖） */
export function MiniChart(deps: KitDeps, props: MiniChartProps): ReactNode {
  const ch = props.chart;
  const vals = (ch && Array.isArray(ch.values) ? ch.values : [])
    .map((v) => (isFinite(Number(v)) ? Number(v) : 0))
    .slice(-60);
  if (vals.length < 2) return null;
  const W = 248;
  const Hh = 52;
  const Pd = 3;
  const max = Math.max.apply(null, vals.concat([1]));
  const step = vals.length > 1 ? (W - Pd * 2) / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => [Pd + step * i, Hh - Pd - (v / max) * (Hh - Pd * 2)]);
  const line = pts.map((p) => (p[0] as number).toFixed(1) + ',' + (p[1] as number).toFixed(1)).join(' ');
  const area = Pd + ',' + (Hh - Pd) + ' ' + line + ' ' + (W - Pd) + ',' + (Hh - Pd);
  return (
    <div className={styles.xchart}>
      {ch && ch.title ? <div className={styles.xtitle}>{String(ch.title)}</div> : null}
      <svg
        viewBox={'0 0 ' + W + ' ' + Hh}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: Hh + 'px' }}
      >
        <polygon points={area} style={{ fill: 'var(--dsw-alias-state-business-primary)', opacity: 0.15 }} />
        <polyline
          points={line}
          fill="none"
          style={{
            stroke: 'var(--dsw-alias-state-business-primary)',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        />
      </svg>
    </div>
  );
}

/**
 * 拼类名。
 *
 * CSS Module 的映射是宽松声明（每个值是 `string | undefined`），直接拼会得到 `"a undefined"`。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/**
 * chip 的 tone → 局部类名。
 *
 * 旧实现是运行时拼 `'tm-vchip-' + tone`（`vchip-ok` / `vchip-warn` / `vchip-bad` / `vchip-info`），
 * CSS Module 化之后局部名是**后缀驼峰**（`vchipOk`）——`styles['vchip-' + tone]` 是 undefined。
 * 所以改成查表；未知 tone（Host 下发的数据里可能有）按「无样式的标记类」口径不再挂。
 */
const VCHIP_TONE: Record<string, string | undefined> = {
  ok: styles.vchipOk,
  warn: styles.vchipWarn,
  bad: styles.vchipBad,
  info: styles.vchipInfo,
};

/** 徽标组 */
export function Chips(deps: KitDeps, props: ChipsProps): ReactNode {
  const chips = (Array.isArray(props.chips) ? props.chips : []).filter((c) => c && c.text);
  if (!chips.length) return null;
  return (
    <div className={styles.vchips}>
      {chips.map((c, i) => (
        <span key={i} className={cx(styles.vchip, c.tone ? VCHIP_TONE[c.tone] : undefined)}>
          {c.text}
        </span>
      ))}
    </div>
  );
}

/**
 * 造一个 deps 绑定的零件命名空间。
 *
 * @param deps - QuotaSection 注入的格式化与错误展开态依赖。
 * @returns `ProviderUIKit`（专属 UI / 声明式渲染按 `K.零件名` 取用）。
 */
/**
 * 按钮骨架（三档位置共用的排版规则）。
 *
 * - `wide`：`[图标] 主图形 名字  …… 数值`（名字长走省略号，数值右对齐）；
 * - `rail`：**表盘** —— `leading`（环 28）当外圈，供应商图标 15px 居中在环心；56px 轨道里放不下
 *   文字，说明走 tooltip。要画别的东西（余额数字 / 迷你条）就传 `rail` 整块覆盖；
 * - `row`：只有主图形（`glyph` 优先；与浮层里其它行左对齐、同尺寸）。
 *
 * @param props - 见 {@link ButtonLayoutProps}。
 * @returns 骨架节点。
 */
export function ButtonLayout(props: ButtonLayoutProps): ReactNode {
  if (props.variant === 'rail') {
    // 窄栏 = **表盘**：`leading` 那枚环（`ringSizeOf('rail')` 给 28）当外圈，供应商图标居中在环心。
    // 没图标（未知供应商）就只剩环。供应商要画别的东西（数字、迷你条）就显式传 `rail` 覆盖这里。
    if (props.rail !== undefined) return <span className={styles.btnRail}>{props.rail}</span>;
    const icon =
      props.icon !== undefined && props.icon !== '' ? (
        <span className={styles.btnDialCore}>
          <ProviderIcon name={props.icon} size={RAIL_ICON} />
        </span>
      ) : null;
    return (
      <span className={styles.btnRail}>
        <span className={styles.btnDial}>
          {props.leading}
          {icon}
        </span>
      </span>
    );
  }
  if (props.variant === 'row') {
    return <span className={styles.btnRow}>{props.glyph ?? props.leading}</span>;
  }
  return (
    <>
      {props.icon !== undefined && props.icon !== '' ? (
        <span className={styles.btnIcon} aria-hidden="true">
          <ProviderIcon name={props.icon} size={16} />
        </span>
      ) : null}
      <span className={styles.btnLead}>{props.leading}</span>
      {props.name !== undefined && props.name !== '' ? (
        <span className={styles.btnName}>{props.name}</span>
      ) : null}
      {props.value !== undefined && props.value !== '' ? (
        <span className={styles.btnValue} data-tone={props.tone ?? ''}>
          {props.value}
        </span>
      ) : null}
    </>
  );
}

/**
 * 多条滚动窗口的迷你条：一根细条 + 短标签，三条并排也只占一行。
 *
 * 这是「宽栏按钮上放 5 小时 / 每周 / 每月」的推荐画法（比三个环省地方，也比一串数字好扫）。
 * 占用档位与环同源（70/90 → warn/bad），所以并排时颜色自己会跳出来。
 *
 * @param deps - kit 依赖（时间格式化）。
 * @param props - 见 {@link WindowBarsProps}。
 * @returns 迷你条组。
 */
export function WindowBars(deps: KitDeps, props: WindowBarsProps): ReactNode {
  const wins = (Array.isArray(props.windows) ? props.windows : [])
    .filter((w) => windowPct(w) !== null)
    .slice(0, 4);
  if (wins.length === 0) return null;
  const h = props.height ?? 4;
  return (
    <span className={styles.btnBars}>
      {wins.map((w, i) => {
        const pct = windowPct(w) ?? 0;
        return (
          <span
            key={String(w.key || i)}
            className={styles.btnBar}
            data-tone={toneOfPct(pct)}
            data-active={props.activeKey !== undefined && props.activeKey === w.key ? '1' : undefined}
            title={String(w.label || '') + ' 已用 ' + Math.round(pct) + '%'}
          >
            <span className={styles.btnBarLabel}>{shortWindowLabel(String(w.label || w.key || ''))}</span>
            <span className={styles.btnBarTrack} style={{ height: h + 'px' }}>
              <span className={styles.btnBarFill} style={{ width: Math.round(pct) + '%' }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * 极短金额：给**窄栏**（36px 圆）用的金额文案。
 *
 * `$46.6` → `$47`（取整）、`¥12345` → `¥1.2万`（上万走「万」）—— 全精度留给宽栏与浮层，
 * 窄栏里只保留「大概多少钱」这一条信息，否则图标 + 金额会撑出圆外被裁。
 *
 * @param text - 完整金额文案（含币种前缀）。
 * @returns 短文案（≤6 字）。
 */
export function tinyMoney(text: string): string {
  const m = /^([^0-9-]*)(-?\d+(?:\.\d+)?)$/.exec(String(text || ''));
  if (!m) return String(text || '').slice(0, 6);
  const sym = m[1];
  const n = Number(m[2]);
  if (!isFinite(n)) return String(text).slice(0, 6);
  const abs = Math.abs(n);
  if (abs >= 10000) return sym + (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  return sym + String(Math.round(n));
}

/**
 * 窗口短标签：`5 小时` → `5时`、`每周` → `周`、`每月` → `月`（窄栏里能省一个字是一个）。
 *
 * @param label - 原始标签。
 * @returns 短标签（未知标签原样返回，最多 3 个字）。
 */
export function shortWindowLabel(label: string): string {
  const s = String(label || '');
  if (s === '') return '';
  if (s.indexOf('5') >= 0 && s.indexOf('小时') >= 0) return '5时';
  if (s.indexOf('周') >= 0) return '周';
  if (s.indexOf('月') >= 0) return '月';
  if (s.indexOf('日') >= 0 || s.indexOf('天') >= 0) return '日';
  if (s.indexOf('年') >= 0) return '年';
  return s.slice(0, 3);
}

/**
 * 偏好开关：标签 + 原生 checkbox（键盘可达、可读屏），勾选即 onChange。
 *
 * 放在**该供应商自己的详情模板**里 —— 谁有偏好谁负责画，插件不提供统一的「显示设置」面板。
 *
 * @param props - 见 {@link PrefSwitchProps}。
 * @returns 一行开关。
 */
export function PrefSwitch(props: PrefSwitchProps): ReactNode {
  return (
    <label className={styles.prefRow} title={props.hint}>
      <input
        type="checkbox"
        className={styles.prefBox}
        checked={props.checked}
        onChange={(event) => {
          props.onChange(event.target.checked);
        }}
      />
      <span className={styles.prefLabel}>{props.label}</span>
    </label>
  );
}

/**
 * 偏好单选组：一小段分段控件（`role="radiogroup"` + `role="radio"`），当前项用 `data-on` 标明。
 *
 * @param props - 见 {@link PrefChoiceProps}。
 * @returns 一行分段控件。
 */
export function PrefChoice(props: PrefChoiceProps): ReactNode {
  return (
    <div className={styles.prefRow} role="radiogroup" aria-label={props.label ?? '选项'}>
      {props.label !== undefined && props.label !== '' ? (
        <span className={styles.prefLabel}>{props.label}</span>
      ) : null}
      <span className={styles.prefSeg}>
        {props.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={opt.value === props.value}
            className={styles.prefOpt}
            data-on={opt.value === props.value ? '1' : undefined}
            title={opt.hint ?? opt.label}
            onClick={() => {
              props.onChange(opt.value);
            }}
          >
            {opt.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export function createProviderKit(deps: KitDeps): ProviderUIKit {
  const ErrorCard = createErrorBox({
    isOpen: deps.errOpen,
    toggle: deps.toggleErr,
    ...(deps.openSettings ? { openSettings: deps.openSettings } : {}),
  });

  return {
    RollingBar: (props: RollingBarProps) => RollingBar(deps, props),
    WindowGroup: (props: WindowGroupProps) => WindowGroup(deps, props),
    BalanceBlock: (props: BalanceBlockProps) => BalanceBlock(deps, props),
    MetricRows: (props: MetricRowsProps) => MetricRows(deps, props),
    MetricGrid: (props: MetricGridProps) => MetricGrid(deps, props),
    SplitBar: (props: SplitBarProps) => SplitBar(deps, props),
    NoteLine: (props: NoteLineProps) => NoteLine(deps, props),
    MiniChart: (props: MiniChartProps) => MiniChart(deps, props),
    SectionTitle: (props: SectionTitleProps) => SectionTitle(props),
    Chips: (props: ChipsProps) => Chips(deps, props),
    ErrorCard,
    Ring: (props: { spec: QuotaRingSpec; size?: number | undefined; stroke?: number | undefined }) => (
      <QuotaRing spec={props.spec} size={props.size ?? 18} stroke={props.stroke ?? 2.2} />
    ),
    ProviderIcon: (props: { name?: string | undefined; size?: number | undefined }) => (
      <ProviderIcon name={props.name} size={props.size ?? 16} />
    ),
    ButtonLayout: (props: ButtonLayoutProps) => ButtonLayout(props),
    WindowBars: (props: WindowBarsProps) => WindowBars(deps, props),
    shortWindowLabel,
    tinyMoney,
    PrefSwitch: (props: PrefSwitchProps) => PrefSwitch(props),
    PrefChoice: (props: PrefChoiceProps) => PrefChoice(props),
    num: deps.num,
    fmt: deps.fmt,
    fmtLeft: deps.fmtLeft,
    curSymbol: deps.curSymbol,
    remainOf: deps.remainOf,
    timeAgo: deps.timeAgo,
    levelOf: deps.levelOf,
  };
}

export { fallbackErrorInfo };
