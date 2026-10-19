/**
 * @dshp/token-meter —— deepseek 适配器（唯一入口：按凭据形态自动选路 + 各自视图）
 *
 * 合并历史：原 `deepseek`（自动选路）/ `deepseek-api`（纯 apiKey）/ `deepseek-web`
 * （纯会话票据）三个类型收敛为本文件一个 provider —— 三者共用同一套凭据字段与
 * 同一份接口实现，拆三个类型只会让用户在设置页做无谓的选择。
 * 旧 type 名保留为别名（providers/index.ts），旧配置读路径自动归一，无需迁移数据。
 *
 * 选路规则（只看密钥形态，不看类型）：
 *  - `sk-` 开头 → 官方 `/user/balance`（长期有效，余额 + 总额度块，无历史趋势）；
 *  - 其他 → 网页 `get_user_summary`（余额 + 历史趋势，会话票据会过期）。
 * `Bearer` 前缀先剥离再判形；token 字段优先于 apiKey（同时配置时）。
 * 一路鉴权失败（401/403）且另一路有凭据时自动换路重试，其他错误直接抛出。
 *
 * 两个接口的数据本来就不一样（官方只有余额/总额度；网页是余额+累计消费+趋势），
 * 因此各自构建自己的 view（区块序列不同），客户端通用渲染即可区分。
 */
import { normalizeSecretRef, secretKindOfRaw } from '../secrets.js';
import { ProviderError } from '../errors.js';
import { fetchOfficialBalance } from './deepseek-api.js';
import { fetchWebSummary } from './deepseek-web.js';
import { balanceSection, defaultView, makeView, metricsSection } from './view.js';
import type { ProviderAdapter, ProviderSection, ProviderView, Vendor, ProviderDeps } from '../types.js';
import { DISPLAY_NAME } from '../../name.js';

/** 去 Bearer 前缀（分类前归一，大小写不敏感）。 */
export function stripBearer(v: unknown): string {
  const t = String(v || '').trim();
  const m = t.match(/^bearer\s+(.+)$/i);
  return m ? (m[1] as string).trim() : t;
}

/** 是否像官方 apiKey（`sk-` 开头 + 足够长度；否则按网页会话票据处理）。 */
export function looksOfficial(v: unknown): boolean {
  return /^sk-[A-Za-z0-9_-]{8,}$/.test(stripBearer(v));
}

/** 凭据类型 → 中文（卡片「数据接口」指标行用）。 */
export function secretKindText(kind: unknown): string {
  const k = String(kind || '');
  if (k === 'plain') return '明文';
  if (k === 'ref') return '$引用';
  if (k === 'env' || k === 'cred') return '旧引用(' + k + ')';
  if (k === 'empty') return '未填';
  return k || '未知';
}

const isWebAuthErr = (msg: string): boolean => /会话失效\(40[13]\)/.test(msg || '');
const isApiAuthErr = (msg: string): boolean => /密钥无效\(401\)/.test(msg || '');

/**
 * 按「实际走通的接口」构建该路线的视图（纯函数，可单测）。
 *
 * 官方接口：余额 + 总额度消耗进度（赠送/充值拆解）
 * 网页接口：余额 + 累计消费 + 使用趋势折线
 * 两者末尾都附「数据接口 / 凭据类型」两行，让用户一眼看出这次数据从哪来。
 */
export function buildDeepseekView(
  which: 'api' | 'web',
  billing: Record<string, unknown>,
  extra: Record<string, unknown> | null,
  secretKind: unknown,
): ProviderView | null {
  // legacy extra（各接口自己产出）→ 声明式区块，避免两边重复维护同一份数据
  const base = defaultView({
    billingKind: 'payg',
    billing: billing as import('../types.js').QuotaBilling,
    extra: (extra as import('../types.js').ProviderExtra | null) ?? null,
  });
  const sections: Array<ProviderSection | null> = (base ? base.sections : []).map((s) =>
    s.kind === 'balance' ? { ...s, title: '账户余额' } : s,
  );
  if (!sections.length)
    sections.push(balanceSection(billing as import('../types.js').QuotaBilling, '账户余额'));
  sections.push(
    metricsSection(
      [
        { label: '数据接口', value: which === 'api' ? '官方余额接口' : '网页账单接口' },
        { label: '凭据类型', value: secretKindText(secretKind) },
      ],
      '数据来源',
    ),
  );
  return makeView(sections);
}

const deepseek: ProviderAdapter = {
  type: 'deepseek',
  icon: 'deepseek',
  label: 'DS',
  title: 'deepseek（官方·自动选路）',
  secretField: 'token',
  secretFields: ['token', 'apiKey', 'cookie'],
  hint: '一个入口搞定两种凭据：sk- 开头的 apiKey 走官方余额接口，会话票据（网页 token）走网页账单（含历史趋势）。同时配置时优先用 token 走网页，一路失效自动换路。旧 deepseek-api / deepseek-web 已合并到本类型，配置自动沿用。',
  fields: [
    {
      key: 'apiKey',
      label: 'apiKey',
      kind: 'secret',
      mono: true,
      placeholder: '填 $NAME 引用（推荐）或粘贴明文',
      hint: '官方余额接口用：开放平台 → API keys 创建（sk- 开头，长期有效）。只填它也能查余额（无历史趋势）；sk- 格式会被自动送往官方接口。',
    },
    {
      key: 'token',
      label: 'token',
      kind: 'secret',
      mono: true,
      placeholder: '粘贴 Bearer 会话票据（网页接口用）',
      hint: '网页接口用：platform.deepseek.com 登录后，Network 里 get_user_summary 请求的 authorization 头 Bearer 后面的串（ciYi 开头）。非 sk- 格式会被自动送往网页接口；与 apiKey 同时填时优先用它。会话过期后需重粘。',
    },
    {
      key: 'lowWarn',
      label: '低余额预警线',
      kind: 'number',
      placeholder: '如：20',
      hint: '余额低于此值时侧边栏黄色提醒（与所选币种同单位）。',
    },
    {
      key: 'currency',
      label: '优先币种',
      kind: 'text',
      mono: true,
      placeholder: '默认 CNY，可填 USD',
      hint: '多币种账户时优先展示的币种；不填则自动归一（CNY 优先）。仅官方接口多币种时有效。',
    },
  ],

  sanitizeParams(raw: unknown): Record<string, unknown> {
    const src =
      raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v !== undefined) out[k] = typeof v === 'string' ? normalizeSecretRef(v) : v;
    }
    for (const k of ['apiKey', 'token', 'cookie']) {
      if (typeof out[k] === 'string') out[k] = normalizeSecretRef(out[k]) as never;
    }
    return out;
  },

  maskParams(params: Record<string, unknown>): Record<string, unknown> {
    const out = { ...params };
    for (const k of ['apiKey', 'token', 'cookie']) {
      if (typeof out[k] === 'string' && out[k] !== '' && secretKindOfRaw(out[k]) === 'plain') out[k] = '';
    }
    return out;
  },

  validateParams(): string {
    return '';
  },

  async fetch(vendor: Vendor, deps: ProviderDeps) {
    const params = (vendor && vendor.params) || {};
    const strOf = (v: unknown): string => (typeof v === 'string' ? v : '');
    const rCookie = await deps.resolveSecret(strOf(params['cookie']));
    const rToken = await deps.resolveSecret(strOf(params['token']));
    const rKey = await deps.resolveSecret(strOf(params['apiKey']));
    const fetchImpl = (deps && deps.fetchImpl) || fetch;
    // 候选凭据：token 优先，其次 apiKey；每项按自身形态定路线
    const bearers: Array<{ value: string; kind: string; via: 'api' | 'web' }> = [];
    if (rToken.value) bearers.push({ ...rToken, via: looksOfficial(rToken.value) ? 'api' : 'web' });
    if (rKey.value) bearers.push({ ...rKey, via: looksOfficial(rKey.value) ? 'api' : 'web' });
    if (!bearers.length && !rCookie.value) {
      throw new ProviderError(
        'config',
        '凭据未配置：apiKey 与 token 至少填一个（sk- 开头走官方，其余走网页，获取方式见字段说明）',
        {
          hint: '两种凭据都没填：官方余额用 sk- 开头的 apiKey，网页账单用登录会话 token。填任一即可。',
          retriable: false,
        },
      );
    }
    // 选路顺序：首选第一个凭据的路线，另一条路线有凭据时作为换路兜底
    const order: Array<'api' | 'web'> = [];
    const firstVia: 'api' | 'web' = bearers.length ? (bearers[0] as { via: 'api' | 'web' }).via : 'web';
    order.push(firstVia);
    if (bearers.some((b) => b.via !== firstVia)) order.push(firstVia === 'web' ? 'api' : 'web');
    let lastErr: unknown = null;
    for (const which of order) {
      if (which === 'web') {
        const wb = bearers.filter((b) => b.via === 'web')[0];
        if (!wb && !rCookie.value) continue;
        try {
          const data = await fetchWebSummary(params, rCookie.value, wb ? wb.value : '', fetchImpl);
          const kind = wb ? wb.kind : rCookie.kind;
          return {
            ...data,
            view: buildDeepseekView('web', data.billing, data.extra, kind),
            secretKind: kind,
            via: '网页接口',
          };
        } catch (e) {
          lastErr = e;
          if (!isWebAuthErr((e as Error)?.message || '')) throw e;
        }
      } else {
        const kb = bearers.filter((b) => b.via === 'api')[0];
        if (!kb) continue;
        try {
          const data = await fetchOfficialBalance(params, kb.value, fetchImpl);
          return {
            ...data,
            view: buildDeepseekView('api', data.billing, data.extra, kb.kind),
            secretKind: kb.kind,
            via: '官方接口',
          };
        } catch (e) {
          lastErr = e;
          if (!isApiAuthErr((e as Error)?.message || '')) throw e;
        }
      }
    }
    // 两条路线都没走通：给出「两条都失败」的整体结论 + 原始原因，避免用户只看到半句话
    const lastMsg = (lastErr as Error)?.message || '拉取失败';
    if (lastErr instanceof ProviderError && lastErr.kind === 'auth' && order.length > 1) {
      throw new ProviderError('auth', '两条数据路线都鉴权失败（官方接口与网页接口）：' + lastMsg, {
        hint: '官方 apiKey 与网页会话票据是两套独立凭据、互不通用。请确认：sk- 开头的填 apiKey 栏，登录会话 token（ciYi 开头）填 token 栏，两者都过期时都要更新。',
        action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
      });
    }
    throw lastErr || new ProviderError('unknown', 'DeepSeek 拉取失败');
  },
};

export default deepseek;
