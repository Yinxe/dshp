/**
 * manual（本地账本）专属模板（按钮级 + 详情级）
 *
 * 无网络请求，数字全部是用户在设置页手填的本地账本：
 *  - `billing: rolling` → 一条额度进度（总额/已用）；
 *  - `billing: payg`    → 余额卡（余额/总额度/预警线）。
 *
 * 详情模板的专属表达：明确标注「本地手填，非实时」，避免用户误以为这是从平台拉来的真实额度。
 *
 * 按钮模板：环 = 账本的 已用/总额；没填总额时环留空 + 余额文案。
 */
import type { ReactNode } from 'react';
import styles from '../../styles.module.css';
import { balanceText, clampPct, ringSizeOf, toneOfPct } from '../templates.js';
import type { ButtonRenderCtx, ProviderTemplates, QuotaRingSpec } from '../templates.js';
import type { ProviderUIKit, RenderCtx } from '../kit.js';
import { DISPLAY_NAME } from '../../../name.js';

/**
 * 本地账本的详情模板。
 *
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @param K - deps 绑定后的零件命名空间（专属模板与声明式层共用同一批零件）。
 * @returns 弹层主体节点。
 */
export function manualDetail(ctx: RenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const b = (snap.billing || {}) as Record<string, unknown>;
  const wins = Array.isArray(snap.windows) ? snap.windows : [];

  const kids: ReactNode[] = [];
  kids.push(<K.Chips key="chips" chips={[{ text: '本地手填', tone: 'info' }]} />);

  if (wins.length) {
    kids.push(<K.WindowGroup key="win" windows={wins} snap={snap} now={ctx.now} title="额度" />);
  }
  if (Object.keys(b).length) {
    const isPayg = !wins.length;
    kids.push(<K.BalanceBlock key="bal" billing={b as any} title={isPayg ? '当前余额' : undefined} />);
  }

  const items: Array<{ label: string; value: string }> = [];
  const total = wins.length ? K.num(wins[0]?.limit, 0) : 0;
  const used = wins.length ? K.num(wins[0]?.used, 0) : 0;
  if (wins.length) {
    items.push({ label: '总额度', value: K.fmt(total) });
    items.push({ label: '已用', value: K.fmt(used) });
    items.push({ label: '剩余', value: K.fmt(Math.max(0, total - used)) });
  }
  if (items.length) kids.push(<K.MetricRows key="metrics" items={items} title="账本明细" />);

  kids.push(
    <K.NoteLine
      key="note"
      text={
        '数据来自本地手填（非平台实时接口）：在「设置 → ' +
        DISPLAY_NAME +
        ' → 额度配置」里更新，改完点「拉取」即可。'
      }
      tone="info"
    />,
  );

  return <div className={styles.ui}>{kids}</div>;
}

/**
 * 本地账本的按钮模板。
 *
 * @param ctx - 按钮上下文（含 variant 与用户选的指标）。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 按钮内容节点。
 */
export function manualButton(ctx: ButtonRenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || '本地账本';
  const spec = ringSpecOf(ctx, K);
  const ring = <K.Ring spec={spec} size={ringSizeOf(ctx.variant)} />;
  const showBalance = ctx.prefs.get(BALANCE_PREF, '0') === '1';
  const money = balanceText(snap, K);
  const value = showBalance ? (money ?? '—') : (spec.text ?? '');

  return (
    <K.ButtonLayout
      variant={ctx.variant}
      leading={ring}
      glyph={<K.Ring spec={spec} size={16} />}
      name={name}
      value={value}
      tone={showBalance ? undefined : spec.tone}
      icon={ctx.icon}
    />
  );
}

/**
 * 本地账本环的语义：账本 已用 / 总额；没填总额时留空 + 余额。
 *
 * @param ctx - 按钮上下文。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 环形进度说明。
 */
function ringSpecOf(ctx: ButtonRenderCtx, K: ProviderUIKit): QuotaRingSpec {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || '本地账本';
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  if (wins.length > 0) {
    const total = K.num(wins[0]?.limit, 0);
    const used = K.num(wins[0]?.used, 0);
    const pct = total > 0 ? (clampPct((used / total) * 100) ?? 0) : 0;
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + '%',
      title: name + '（本地手填）：已用 ' + K.fmt(used) + ' / ' + K.fmt(total),
    };
  }
  const money = balanceText(snap, K);
  return {
    pct: null,
    tone: 'idle',
    ...(money !== null ? { text: money } : {}),
    title: name + '（本地手填）：余额 ' + (money ?? '未填'),
  };
}

/** 这个供应商自己的偏好键。 */
const BALANCE_PREF = 'balance';

/** 本地账本的两套模板：环一直画账本用量，详情里带一个余额开关。 */
export const manual: ProviderTemplates = {
  button: manualButton,
  buttonHint: (ctx, K) => {
    const base = ringSpecOf(ctx, K).title;
    if (ctx.prefs.get(BALANCE_PREF, '0') === '1') {
      return base + '；数值位显示余额 ' + (balanceText(ctx.snap, K) ?? '未填');
    }
    return base;
  },
  detail: manualDetail,
};
