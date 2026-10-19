/**
 * DeepSeek 专属模板（按钮级 + 详情级）
 *
 * 该适配器是「按凭据形态自动选路」的单入口，两条路线返回的数据并不一样：
 *  - 官方余额接口（`sk-` apiKey）：只有余额 + 赠送/充值拆分 + 总额度消耗，**无历史趋势**；
 *  - 网页账单接口（会话 token）：余额 + 累计消费 + **历史使用趋势**。
 *
 * 详情模板的版式对齐官方客户端的「账户余额」卡：标题行下面三行
 * `余额 / 赠送 / 充值`（右对齐、等宽数字），往下才是 DeepSeek 特有的东西
 * （总额度消耗、消费统计、趋势），最后是「这次数据从哪来」的说明 —— 因为两条路线
 * 的差异必须让用户看得见，否则「为什么这次没有趋势图」永远是个谜。
 *
 * 按钮模板：环 = **总额度消耗**（赠送 + 充值 − 余额）；拿不到总额度时（网页账单只给余额）
 * 环留空、环内直接放余额金额 —— 不编假比例。
 */
import type { ReactNode } from 'react';
import styles from '../../styles.module.css';
import { balanceText, clampPct, failureRingSpec, ringSizeOf, toneOfPct } from '../templates.js';
import type { ButtonRenderCtx, ProviderTemplates, QuotaRingSpec } from '../templates.js';
import type { ProviderUIKit, RenderCtx } from '../kit.js';

/**
 * 账户余额三行（余额 / 赠送 / 充值）+ 多币种补充行。
 *
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 右对齐的键值行。
 */
function balanceRows(ctx: RenderCtx, K: ProviderUIKit): Array<{ label: string; value: string }> {
  const b = (ctx.snap.billing || {}) as Record<string, unknown>;
  const sym = K.curSymbol(String(b['currency'] || ''));
  const rows: Array<{ label: string; value: string }> = [];
  if (b['balance'] !== undefined && b['balance'] !== null)
    rows.push({ label: '余额', value: sym + K.fmt(b['balance']) });
  if (b['granted'] !== undefined && b['granted'] !== null)
    rows.push({ label: '赠送', value: sym + K.fmt(b['granted']) });
  if (b['toppedUp'] !== undefined && b['toppedUp'] !== null)
    rows.push({ label: '充值', value: sym + K.fmt(b['toppedUp']) });
  const infos = Array.isArray(b['infos']) ? (b['infos'] as Array<Record<string, unknown>>) : [];
  for (const info of infos.slice(0, 3)) {
    const cur = String(info['currency'] || '');
    const total = Number(info['total']);
    if (!cur || !isFinite(total)) continue;
    rows.push({ label: cur + ' 总额', value: K.curSymbol(cur) + K.fmt(total) });
  }
  return rows;
}

/**
 * DeepSeek 的详情模板。
 *
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @param K - deps 绑定后的零件命名空间（专属模板与声明式层共用同一批零件）。
 * @returns 弹层主体节点。
 */
export function deepseekDetail(ctx: RenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const b = (snap.billing || {}) as Record<string, unknown>;
  const via = String(snap.via || '');
  const isWeb = via.indexOf('网页') >= 0;
  const kids: ReactNode[] = [];

  /* ── 数据来源徽标（两套凭据体系，必须让用户看清这次走的哪条）────── */
  const chips: Array<{ text: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }> = [];
  if (via) chips.push({ text: isWeb ? '网页账单接口' : '官方余额接口', tone: isWeb ? 'info' : 'ok' });
  if (isWeb) chips.push({ text: '票据会过期', tone: 'warn' });
  if (chips.length) kids.push(<K.Chips key="chips" chips={chips} />);

  /* ── 账户余额：余额 / 赠送 / 充值（官方客户端版式）──────────────── */
  const rows = balanceRows(ctx, K);
  if (rows.length) kids.push(<K.MetricRows key="bal" items={rows} title="账户余额" />);

  /* ── 余额告警（与可用性判据同源：余额 ≤ 0 或上游明确报不足）──────── */
  const amt = K.num(b['balance'], 0);
  const dSym = K.curSymbol(String(b['currency'] || ''));
  const warnLine =
    b['lowWarn'] !== undefined && b['lowWarn'] !== null && b['lowWarn'] !== ''
      ? K.num(b['lowWarn'], 0)
      : null;
  if (b['isAvailable'] === false || amt <= 0) {
    kids.push(<K.NoteLine key="empty" text="余额不足，API 调用可能被拒绝，请及时充值。" tone="bad" />);
  } else if (warnLine !== null && amt <= warnLine) {
    kids.push(
      <K.NoteLine
        key="low"
        text={'余额低于预警线 ' + dSym + K.fmt(warnLine) + '，建议及时充值。'}
        tone="warn"
      />,
    );
  }

  /* ── 总额度消耗（赠送 + 充值 = 总量；仅官方接口给得出拆分）──────── */
  const granted = b['granted'] !== undefined && b['granted'] !== null ? K.num(b['granted'], 0) : null;
  const topped = b['toppedUp'] !== undefined && b['toppedUp'] !== null ? K.num(b['toppedUp'], 0) : null;
  const totalQuota = (granted || 0) + (topped || 0);
  if (totalQuota > 0) {
    const used = Math.max(0, totalQuota - amt);
    // 色调交给主题：赠送 = 警告色（琥珀，多数主题里与绿/强调色区分得开）、充值 = 成功色
    const segs = [
      { label: '赠送额度', value: granted || 0, tone: 'warn' as const },
      { label: '充值额度', value: topped || 0, tone: 'ok' as const },
    ].filter((s) => s.value > 0);
    if (segs.length > 1) kids.push(<K.SplitBar key="split" segments={segs} title="额度构成" />);
    kids.push(
      <div key="prog" className={styles.xprog}>
        <K.SectionTitle key="t" text="总额度消耗" />
        <K.RollingBar
          key="bar"
          label="总额度"
          pct={Math.min(100, (used / totalQuota) * 100)}
          left={'已用 ' + K.fmt(used) + ' / 共 ' + K.fmt(totalQuota)}
        />
      </div>,
    );
  }

  /* ── 累计消费等指标（网页接口给得更全）───────────────────────── */
  const items = (snap.extra && Array.isArray(snap.extra.stats) ? snap.extra.stats : []).slice(0, 8);
  if (items.length) kids.push(<K.MetricRows key="metrics" items={items} title="消费统计" />);

  /* ── 按钮上显示什么：这个供应商只有一件事可配（余额开关）────────────── */
  kids.push(
    <div key="prefs" className={styles.prefBlock}>
      <K.PrefSwitch
        key="bal"
        label="数值位显示余额"
        hint="勾上后按钮右侧显示账户余额；环照旧画总额度消耗比例"
        checked={ctx.prefs.get(BALANCE_PREF, '0') === '1'}
        onChange={(next) => ctx.prefs.set(BALANCE_PREF, next ? '1' : '0')}
      />
    </div>,
  );

  /* ── 使用趋势：有就画，没有就说明原因（不留白）────────────────── */
  const chart = snap.extra && snap.extra.chart ? snap.extra.chart : null;
  if (chart && Array.isArray(chart.values) && chart.values.length > 1) {
    kids.push(<K.MiniChart key="chart" chart={chart} />);
  } else if (!isWeb) {
    kids.push(
      <K.NoteLine
        key="nochart"
        text="官方余额接口不提供历史趋势；如需趋势图，可在设置里同时填入网页 token（会话票据），插件会自动改用网页账单接口。"
        tone="info"
      />,
    );
  }

  /* ── 自动选路说明（只在网页路线上提示票据会过期）──────────────── */
  if (isWeb) {
    kids.push(
      <K.NoteLine
        key="note"
        text="当前走网页账单接口（含趋势），依赖登录会话票据；票据过期后这里会提示重新抓取。官方 sk- 密钥长期有效但无趋势。"
        tone="info"
      />,
    );
  }

  return <div className={styles.ui}>{kids}</div>;
}

/**
 * DeepSeek 的按钮模板。
 *
 * 两种画法（用户可在浮层里切「显示」）：
 *  - `auto`（默认）：**总额度消耗环**（赠送 + 充值 − 余额 = 已用）；总额度未知（网页账单只给余额）
 *    时环留空、数值位直接摆余额；
 *  - `balance`：不画环，直接显示余额（鲸尾图标 + 余额 + 「余额」小标）。
 *
 * @param ctx - 按钮上下文（含 variant 与用户选的指标）。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 按钮内容节点。
 */
export function deepseekButton(ctx: ButtonRenderCtx, K: ProviderUIKit): ReactNode {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || 'DeepSeek';
  const spec = ringSpecOf(ctx, K);
  const ring = <K.Ring spec={spec} size={ringSizeOf(ctx.variant)} />;
  // 图表一直画（总额度消耗）：勾了余额 → 数值位换余额；没勾 → 显示百分比
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
 * DeepSeek 环的语义：总额度消耗（赠送+充值−余额）；拿不到总额度时留空 + 余额文案。
 *
 * @param ctx - 按钮上下文。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 环形进度说明。
 */
function ringSpecOf(ctx: ButtonRenderCtx, K: ProviderUIKit): QuotaRingSpec {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || 'DeepSeek';
  if (!snap.ok) return failureRingSpec(snap, name);
  const b = (snap.billing || {}) as Record<string, unknown>;
  const granted = b['granted'] !== undefined && b['granted'] !== null ? K.num(b['granted'], 0) : 0;
  const topped = b['toppedUp'] !== undefined && b['toppedUp'] !== null ? K.num(b['toppedUp'], 0) : 0;
  const total = granted + topped;
  const amt = K.num(b['balance'], 0);
  if (total > 0) {
    const pct = clampPct((Math.max(0, total - amt) / total) * 100) ?? 0;
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + '%',
      title:
        name +
        '：总额度已用 ' +
        Math.round(pct) +
        '%（' +
        K.fmt(Math.max(0, total - amt)) +
        ' / ' +
        K.fmt(total) +
        '）',
    };
  }
  const money = balanceText(snap, K);
  const low = b['isAvailable'] === false || amt <= 0;
  return {
    pct: null,
    tone: low ? 'bad' : 'idle',
    ...(money !== null ? { text: money } : {}),
    title: name + '：余额 ' + (money ?? '未知') + '（网页账单接口不提供总额度，环留空）',
  };
}

/** 这个供应商自己的偏好键。 */
const BALANCE_PREF = 'balance';

/** DeepSeek 的两套模板：环一直画总额度消耗，详情里带一个余额开关。 */
export const deepseek: ProviderTemplates = {
  button: deepseekButton,
  buttonHint: (ctx, K) => {
    const base = ringSpecOf(ctx, K).title;
    if (ctx.prefs.get(BALANCE_PREF, '0') === '1') {
      return base + '；数值位显示余额 ' + (balanceText(ctx.snap, K) ?? '未知');
    }
    return base;
  },
  detail: deepseekDetail,
};
