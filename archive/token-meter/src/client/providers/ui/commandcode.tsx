/**
 * CommandCode 专属模板（按钮级 + 详情级）
 *
 * 数据（Host `providers/commandcode.ts` 产出）：
 *  - windows：5 小时 / 每周滚动窗口（额度窗口）
 *  - billing：剩余额度（月度 + 充值 + 赠送合成的 USD 余额）、订阅计划、低余额线、
 *    额度构成（monthlyCredits/purchasedCredits/freeCredits）、本期消费（consumedCredits）
 *  - extra：账户与用量指标、订阅状态提示
 *
 * 排版原则（针对首版「卡片过高」的返工）：
 *  1. **同一份数据只出现一次**：进度条已标百分比，顶部就不再重复挂百分比徽标；
 *     计划名只在顶部徽标出现（带订阅状态），指标网格里不再重复「订阅计划」；
 *     月度额度进度只标「已用 / 共」，不重复「剩余 $X」（余额大数字已给）。
 *  2. **指标走两列网格 + 成对合并**：8 条单列指标占掉卡片近半高度，压到 2–3 行。
 *  3. **提示只在异常时出现**：订阅正常时不写「订阅生效中」这类零信息量套话。
 *
 * 保留的核心信息（高度优化时不可省）：余额大数字、5 小时 / 每周 / 每月三条进度
 * （含重置倒计时）、可用状态与预警线、额度构成、账户与用量、异常提示。
 *
 * 三条进度全部由 Host 的 windows 驱动、WindowGroup 统一渲染 —— 不在本文件手写
 * 单条进度（手写会与组件内的标签列宽/间距规则脱节，导致标签被挤到换行）。
 *
 * 按钮模板：环 = **最紧的那条滚动窗口**（5 小时 / 每周 / 每月里占用最高的）；
 * 没有窗口可算时环留空、环内放余额金额，余额低于预警线时整环转红。
 */
import type { ReactNode } from 'react';
import styles from '../../styles.module.css';
import {
  balanceText,
  failureRingSpec,
  toneOfPct,
  windowOfMetric,
  windowPct,
  worstWindowPct,
  ringSizeOf,
} from '../templates.js';
import type { ButtonRenderCtx, ProviderTemplates, QuotaRingSpec } from '../templates.js';
import type { ProviderUIKit, RenderCtx } from '../kit.js';
import type { QuotaWindow } from '../../types.js';

/**
 * CommandCode 的详情模板。
 *
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @param K - deps 绑定后的零件命名空间（专属模板与声明式层共用同一批零件）。
 * @returns 弹层主体节点。
 */
export function commandcodeDetail(ctx: RenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const b = (snap.billing || {}) as Record<string, unknown>;
  const plan = b['plan'] ? String(b['plan']) : '';
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const notes = (snap.extra && Array.isArray(snap.extra.blocks) ? snap.extra.blocks : []).filter(
    (x: any) => x && x.kind === 'note' && x.text,
  ) as Array<{ text: string; tone?: 'info' | 'warn' | 'bad' }>;
  // 需要用户处理的提示（订阅异常、额度告警）才值得占一行
  const alerts = notes.filter((n) => n.tone === 'bad' || n.tone === 'warn');

  const kids: ReactNode[] = [];

  /* ── 指标预处理：先把「订阅计划」摘出来，避免与顶部计划徽标重复 ─────
     Host 给的这一项形如「GOAT（active）」，正好把状态也一并带过来。 */
  const metrics = (snap.extra && Array.isArray(snap.extra.stats) ? snap.extra.stats : []).slice(0, 12);
  const planMetric = metrics.filter((m) => m && m.label === '订阅计划')[0] as
    { label: string; value: string } | undefined;
  const planStatus = planMetric
    ? String(planMetric.value)
        .replace(/^[^（(]*[（(]/, '')
        .replace(/[）)]\s*$/, '')
    : '';
  const restMetrics = metrics.filter((m) => m && m.label !== '订阅计划');

  /* ── 顶部徽标：只放「定性」信息（计划名+状态、异常态）───────────────
     窗口百分比已在下方进度条上（含颜色严重度），重复挂一遍纯属占高。 */
  // 顶部只留「定性」的一枚徽标：计划+状态（窗口百分比在下面的窗口行上，重复挂一遍就是把第一屏塞满）
  const chips: Array<{ text: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }> = [];
  if (plan)
    chips.push({
      text: planStatus ? plan + ' · ' + planStatus : plan,
      tone: /active|生效/i.test(planStatus) ? 'ok' : 'info',
    });
  if (alerts.length) chips.push({ text: '需处理', tone: 'bad' });
  else if (wins.some((w) => Number(w.pct) >= 100)) chips.push({ text: '窗口已满', tone: 'bad' });
  if (chips.length) kids.push(<K.Chips key="chips" chips={chips} />);

  /* ── 核心：剩余额度大数字（大数字本身即标题，省掉区块标题行）────── */
  kids.push(<K.BalanceBlock key="bal" billing={b as any} compact={true} />);

  /* ── 额度窗口：进度条已含百分比与重置时长，省略重复的汇总行 ─────── */
  if (wins.length)
    kids.push(
      <K.WindowGroup key="win" windows={wins} snap={snap} now={ctx.now} title="额度窗口" noSummary={true} />,
    );

  /* ── 额度构成：仅当有多种来源时才画（单一来源画条无意义）─────────
     注：月度额度进度条不在这里手写 —— Host 已把它作为标准 QuotaWindow
     放进 snap.windows，三条（5 小时 / 每周 / 每月）由上面的 WindowGroup
     统一渲染，标签列宽、间距、倒计时位置天然一致（复用同一个组件）。 */
  const monthly = K.num(b['monthlyCredits'], 0);
  const purchased = K.num(b['purchasedCredits'], 0);
  const free = K.num(b['freeCredits'], 0);
  // 色调交给主题：月度（主额度）= 强调色、充值 = 成功色、赠送 = 警告色（琥珀，三段才分得开）
  const segs = [
    { label: '月度额度', value: monthly, tone: 'brand' as const },
    { label: '充值额度', value: purchased, tone: 'ok' as const },
    { label: '赠送额度', value: free, tone: 'warn' as const },
  ].filter((s) => s.value > 0);
  if (segs.length > 1) kids.push(<K.SplitBar key="split" segments={segs} title="额度构成" />);

  /* ── 账户与用量：两列网格 + 成对合并 ─────────────────────────────
     原先 8 行单列列表是卡片最高的部分，现在两项并一格、两格一行。 */
  // 只取前 6 条、且不再「成对合并」：合并会把两对指标挤进一行（`$23.83 · 1.1 万`），
  // 读起来像乱码流；两列网格 + 一格一项才是可扫的
  const items: Array<{ label: string; value: string }> = [];
  for (const it of restMetrics.slice(0, 6)) items.push({ label: it.label, value: it.value });
  if (!items.length) {
    if (plan) items.push({ label: '订阅计划', value: plan });
    if (b['periodEnd']) items.push({ label: '当前周期至', value: String(b['periodEnd']) });
  }
  kids.push(<K.MetricGrid key="metrics" items={items} title="账户与用量" />);

  /* ── 按钮上显示什么：**这个供应商自己的两个控件** ────────────────────
     1. 余额开关：勾上则按钮的数值位显示余额（图表照旧画该窗口的占用比例）；
     2. 5h / 1w / 1m 单选：按钮画哪个窗口（默认月额度）。
     这两件事写的是浏览器本地偏好（`ctx.prefs`），点一下侧边栏按钮立刻重画。 */
  const window = selectedWindow(ctx);
  const showBalance = ctx.prefs.get(BALANCE_PREF, '0') === '1';
  kids.push(
    <div key="prefs" className={styles.prefBlock}>
      <K.SectionTitle text="侧栏按钮显示" />
      <K.PrefSwitch
        key="bal"
        label="数值位显示余额"
        hint="勾上后按钮右侧显示剩余额度；进度条照旧画当前窗口的占用比例"
        checked={showBalance}
        onChange={(next) => ctx.prefs.set(BALANCE_PREF, next ? '1' : '0')}
      />
      <K.PrefChoice
        key="win"
        label="环画哪个窗口"
        value={window}
        options={WINDOW_OPTIONS}
        onChange={(next) => ctx.prefs.set(WINDOW_PREF, next)}
      />
    </div>,
  );

  /* ── 提示：只在订阅异常/额度告警时出现 ──────────────────────────── */
  for (let i = 0; i < alerts.length && i < 2; i++) {
    const n = alerts[i] as { text: string; tone?: 'info' | 'warn' | 'bad' };
    kids.push(<K.NoteLine key={'note' + i} text={n.text} tone={n.tone || 'warn'} />);
  }

  return <div className={styles.ui}>{kids}</div>;
}

/**
 * CommandCode（Goat）的按钮模板。
 *
 * 口径（在**这个供应商自己的卡片**里配置，见 `commandcodeDetail` 底部的两个控件）：
 *
 * | 卡片里的选择            | 按钮上画什么                                                        |
 * | ----------------------- | ------------------------------------------------------------------- |
 * | 窗口 `5h` / `1w` / `1m` | **环一直画该窗口的占用比例**（默认 `1m` = 月额度）                   |
 * | 「数值位显示余额」勾上  | 环照旧，右侧数值位换成余额（低于预警线转红）；不勾 → 显示该窗口百分比 |
 *
 * 没有窗口可算（纯按量账户）时回落到「空环 + 余额」，余额低于预警线时整环转红。
 * 窄栏（36px 圆）只留「图标 + 环」，数字靠 tooltip。
 *
 * @param ctx - 按钮上下文（含 variant、图标名与该供应商自己的 `prefs`）。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 按钮内容节点。
 */
export function commandcodeButton(ctx: ButtonRenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || 'CommandCode';
  const size = ringSizeOf(ctx.variant);

  if (!snap.ok) {
    const fail = failureRingSpec(snap, name);
    return (
      <K.ButtonLayout
        variant={ctx.variant}
        leading={<K.Ring spec={fail} size={size} />}
        glyph={<K.Ring spec={fail} size={16} />}
        name={name}
        value="读取失败"
        tone="bad"
      />
    );
  }

  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const picked = windowOfMetric(snap, selectedWindow(ctx)) ?? wins[0] ?? null;
  const spec = ringSpecOf(ctx, K, picked);
  // 图表**一直画**：环 = 所选窗口的占用比例
  const ring = <K.Ring spec={spec} size={size} />;
  // 数值位：勾了余额 → 显示余额；否则 → 显示该窗口的百分比
  const showBalance = ctx.prefs.get(BALANCE_PREF, '0') === '1';
  const money = balanceText(snap, K);
  const value = showBalance ? (money ?? '—') : (spec.text ?? '');
  const tone = showBalance ? (balanceLow(ctx, K) ? 'bad' : undefined) : spec.tone;

  return (
    <K.ButtonLayout
      variant={ctx.variant}
      leading={ring}
      glyph={<K.Ring spec={spec} size={16} />}
      name={name}
      value={value}
      tone={tone}
      icon={ctx.icon}
    />
  );
}

/**
 * CommandCode 环的语义：指定窗口 → 那条；否则 → 最紧的那条；都没有 → 空环 + 余额。
 *
 * @param ctx - 按钮上下文。
 * @param K - deps 绑定后的零件命名空间。
 * @param picked - 卡片里选中的窗口（默认 `1m`；取不到时用第一条）。
 * @returns 环形进度说明。
 */
function ringSpecOf(ctx: ButtonRenderCtx, K: ProviderUIKit, picked?: QuotaWindow | null): QuotaRingSpec {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || 'CommandCode';
  const pct = picked ? windowPct(picked) : worstWindowPct(snap);
  if (pct !== null) {
    const label = picked ? String(picked.label || picked.key) : '最紧窗口';
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + '%',
      title: name + '：' + label + '已用 ' + Math.round(pct) + '%',
    };
  }
  const money = balanceText(snap, K);
  return {
    pct: null,
    tone: balanceLow(ctx, K) ? 'bad' : 'idle',
    ...(money !== null ? { text: money } : {}),
    title: name + '：余额 ' + (money ?? '未知') + '（没有可显示的窗口）',
  };
}

/**
 * 余额是否低于预警线（含「上游明确报不足」与「余额 ≤ 0」）。
 *
 * @param ctx - 按钮上下文。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 需要红字提醒为 true。
 */
function balanceLow(ctx: ButtonRenderCtx, K: ProviderUIKit): boolean {
  const b = (ctx.snap.billing || {}) as Record<string, unknown>;
  if (b['isAvailable'] === false) return true;
  const amount = K.num(b['balance'], Number.NaN);
  if (!isFinite(amount)) return false;
  if (amount <= 0) return true;
  const warn = b['lowWarn'];
  if (warn === undefined || warn === null || warn === '') return false;
  return amount <= K.num(warn, 0);
}

/** 这个供应商自己的偏好键（值域也由它自己定）。 */
const WINDOW_PREF = 'window';
const BALANCE_PREF = 'balance';

/** 按钮画哪个窗口：默认**月额度**（用户口径），另外两档是 5 小时 / 每周。 */
const WINDOW_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: '5h', label: '5h', hint: '按键上那枚环画 5 小时滚动窗口的占用' },
  { value: 'weekly', label: '1w', hint: '按键上那枚环画每周窗口的占用' },
  { value: 'monthly', label: '1m', hint: '按键上那枚环画每月窗口的占用（默认）' },
];

/**
 * 当前选中的窗口键（默认 `monthly`）。
 *
 * @param ctx - 按钮/详情上下文（取不到 prefs 时也给默认值）。
 * @returns 窗口键。
 */
function selectedWindow(ctx: { prefs: { get(key: string, fallback?: string): string } }): string {
  const v = ctx.prefs.get(WINDOW_PREF, 'monthly');
  return v === '5h' || v === 'weekly' || v === 'monthly' ? v : 'monthly';
}

/** CommandCode 的两套模板：按钮画所选窗口（图表一直画），详情里带它自己的两个控件。 */
export const commandcode: ProviderTemplates = {
  button: commandcodeButton,
  buttonHint: (ctx, K) => {
    const name = ctx.vendorName || ctx.snap.vendorName || 'CommandCode';
    if (!ctx.snap.ok) return failureRingSpec(ctx.snap, name).title;
    const wins = Array.isArray(ctx.snap.windows) ? ctx.snap.windows : [];
    const picked = windowOfMetric(ctx.snap, selectedWindow(ctx)) ?? wins[0] ?? null;
    const base = ringSpecOf(ctx, K, picked).title;
    if (ctx.prefs.get(BALANCE_PREF, '0') === '1') {
      return base + '；数值位显示余额 ' + (balanceText(ctx.snap, K) ?? '未知');
    }
    return base;
  },
  detail: commandcodeDetail,
};
