/**
 * opencode 专属模板（按钮级 + 详情级）
 *
 * 数据特征：同一个 workspace 同时拉 `/go`（订阅三窗口 + 计划）与 `/billing`（充值余额），
 * 因此一屏上可能同时存在「滚动窗口」与「按量余额」两种形态：
 *  - Go 订阅：5 小时 / 每周 / 每月 三窗口 + 订阅状态与到期倒计时；
 *  - Zen 按量：充值余额（USD）。
 *
 * 详情模板的专属表达：
 *  - 订阅徽标 + 三窗口进度条（月度窗口同时充当「订阅周期」参照）；
 *  - 余额作为补充指标（订阅用户也可能有充值余额）；
 *  - 订阅备注（购买时间 / 到期倒计时）单独成行。
 *
 * 按钮模板：环 = 三窗口里占用最高的那条（订阅用户最关心「哪个窗口快满了」）；
 * 纯按量（Zen）用户没有窗口，环留空、环内放余额，低于预警线转红。
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
 * opencode 的详情模板。
 *
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @param K - deps 绑定后的零件命名空间（专属模板与声明式层共用同一批零件）。
 * @returns 弹层主体节点。
 */
export function opencodeDetail(ctx: RenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const b = (snap.billing || {}) as Record<string, unknown>;
  const plan = b['plan'] ? String(b['plan']) : '';
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const balance = b['balance'] !== undefined && b['balance'] !== null ? K.num(b['balance'], 0) : null;

  const kids: ReactNode[] = [];

  /* ── 订阅徽标：只留定性信息（窗口百分比在下面的窗口行上，不再重复成三枚徽标）────── */
  const chips: Array<{ text: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }> = [];
  if (plan) chips.push({ text: '订阅 ' + plan, tone: 'info' });
  if (!wins.length && balance !== null) chips.push({ text: '按量计费', tone: 'info' });
  if (chips.length) kids.push(<K.Chips key="chips" chips={chips} />);

  /* ── 滚动窗口（5h / 每周 / 每月）────────────────────────────── */
  if (wins.length) {
    kids.push(<K.WindowGroup key="win" windows={wins} snap={snap} now={ctx.now} title="订阅窗口" />);
  }

  /* ── 充值余额（订阅用户也可能有；Zen 用户则是主体）────────────── */
  if (balance !== null && balance !== undefined) {
    const onlyBalance = !wins.length;
    kids.push(<K.BalanceBlock key="bal" billing={b as any} title={onlyBalance ? '账户余额' : '充值余额'} />);
  }

  /* ── 按钮上显示什么：余额开关 + 画哪个订阅窗口（默认月额度）────────── */
  const showBalance = ctx.prefs.get(BALANCE_PREF, '0') === '1';
  kids.push(
    <div key="prefs" className={styles.prefBlock}>
      <K.SectionTitle text="侧栏按钮显示" />
      <K.PrefSwitch
        key="bal"
        label="数值位显示余额"
        hint="勾上后按钮右侧显示充值余额；进度条照旧画当前窗口的占用比例"
        checked={showBalance}
        onChange={(next) => ctx.prefs.set(BALANCE_PREF, next ? '1' : '0')}
      />
      <K.PrefChoice
        key="win"
        label="环画哪个窗口"
        value={selectedWindow(ctx)}
        options={WINDOW_OPTIONS}
        onChange={(next) => ctx.prefs.set(WINDOW_PREF, next)}
      />
    </div>,
  );

  /* ── 订阅备注 / 余额补充说明 ────────────────────────────────── */
  const notes = (snap.extra && Array.isArray(snap.extra.blocks) ? snap.extra.blocks : []).filter(
    (x: any) => x && x.kind === 'note' && x.text,
  );
  if (notes.length) {
    kids.push(<K.NoteLine key="note" text={(notes[0] as { text: string }).text} tone="info" />);
  } else if (wins.length) {
    const monthly = wins.filter((w) => w.key === 'monthly')[0];
    if (monthly && monthly.resetInSec > 0) {
      kids.push(
        <K.NoteLine
          key="note"
          text={'订阅约 ' + K.fmtLeft(monthly.resetInSec) + '后重置/到期（以每月窗口为准）。'}
          tone="info"
        />,
      );
    }
  }

  return <div className={styles.ui}>{kids}</div>;
}

/**
 * opencode 的按钮模板 —— 与 Goat 同一套口径（订阅三窗口 + 充值余额）。
 *
 * 卡片底部两个控件：`按钮画哪个窗口 [5h|1w|1m]`（默认 `1m`）决定**环一直画**哪个窗口的占用；
 * `数值位显示余额` 勾上后右侧数值位换成充值余额，不勾则显示该窗口百分比。
 * 没有窗口时回落「空环 + 余额」，低于预警线整环转红。
 *
 * @param ctx - 按钮上下文（含 variant、图标名与该供应商自己的 `prefs`）。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 按钮内容节点。
 */
export function opencodeButton(ctx: ButtonRenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || 'opencode';
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
  // 图表一直画：环 = 所选订阅窗口的占用比例
  const ring = <K.Ring spec={spec} size={size} />;
  const showBalance = ctx.prefs.get(BALANCE_PREF, '0') === '1';
  const money = balanceText(snap, K);
  const value = showBalance ? (money ?? '—') : (spec.text ?? '');
  const tone = showBalance ? undefined : spec.tone;

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
 * opencode 环的语义：指定窗口 → 那条；否则 → 最紧的那条；都没有 → 空环 + 余额。
 *
 * @param ctx - 按钮上下文。
 * @param K - deps 绑定后的零件命名空间。
 * @param picked - 用户指定的窗口。
 * @returns 环形进度说明。
 */
function ringSpecOf(ctx: ButtonRenderCtx, K: ProviderUIKit, picked?: QuotaWindow | null): QuotaRingSpec {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || 'opencode';
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
    tone: 'idle',
    ...(money !== null ? { text: money } : {}),
    title: name + '：按量计费，余额 ' + (money ?? '未知'),
  };
}

/** 这个供应商自己的偏好键。 */
const WINDOW_PREF = 'window';
const BALANCE_PREF = 'balance';

/** 按钮画哪个订阅窗口（默认**月额度**）。 */
const WINDOW_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: '5h', label: '5h', hint: '环画 5 小时滚动窗口的占用' },
  { value: 'weekly', label: '1w', hint: '环画每周窗口的占用' },
  { value: 'monthly', label: '1m', hint: '环画每月窗口的占用（默认）' },
];

/**
 * 当前选中的窗口键（默认 `monthly`）。
 *
 * @param ctx - 按钮/详情上下文。
 * @returns 窗口键。
 */
function selectedWindow(ctx: { prefs: { get(key: string, fallback?: string): string } }): string {
  const v = ctx.prefs.get(WINDOW_PREF, 'monthly');
  return v === '5h' || v === 'weekly' || v === 'monthly' ? v : 'monthly';
}

/** opencode 的两套模板：图表一直画所选窗口，详情里带它自己的两个控件。 */
export const opencode: ProviderTemplates = {
  button: opencodeButton,
  buttonHint: (ctx, K) => {
    const name = ctx.vendorName || ctx.snap.vendorName || 'opencode';
    if (!ctx.snap.ok) return failureRingSpec(ctx.snap, name).title;
    const wins = Array.isArray(ctx.snap.windows) ? ctx.snap.windows : [];
    const picked = windowOfMetric(ctx.snap, selectedWindow(ctx)) ?? wins[0] ?? null;
    const base = ringSpecOf(ctx, K, picked).title;
    if (ctx.prefs.get(BALANCE_PREF, '0') === '1') {
      return base + '；数值位显示充值余额 ' + (balanceText(ctx.snap, K) ?? '未知');
    }
    return base;
  },
  detail: opencodeDetail,
};
