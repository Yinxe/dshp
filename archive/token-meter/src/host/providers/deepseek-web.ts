/**
 * @dshp/token-meter —— deepseek 网页账单接口（纯通道实现，非独立 provider）
 *
 * 原实现：dsh-token-quota/lib/providers/deepseek-web.js（逐行对齐，仅加 TS 类型）
 *
 * 接口：`GET https://platform.deepseek.com/api/v0/users/get_user_summary`
 * 鉴权（实测结论）：`Authorization: Bearer` 会话票据是唯一必需项；
 * 官方 apiKey（`sk-`）作 Bearer 会被应用层拒绝（40003），两套凭据体系不通用。
 *
 * 本文件只提供 `fetchWebSummary` + 解析纯函数，由 deepseek.ts（唯一 provider）
 * 按凭据形态决定是否调用；旧类型 `deepseek-web` 已收敛为 deepseek 的别名。
 */

const SUMMARY_URL = 'https://platform.deepseek.com/api/v0/users/get_user_summary';

/** 余额候选键（按顺序首个命中数值的为准）。 */
const BALANCE_KEYS = [
  'total_balance',
  'total',
  'balance',
  'available_balance',
  'balance_amount',
  'amount',
  'remaining',
  'remaining_balance',
  'current_balance',
];
const GRANTED_KEYS = ['granted_balance', 'granted', 'gift_balance', 'free_balance'];
const TOPPED_KEYS = ['topped_up_balance', 'topped_up', 'recharged', 'recharge_balance', 'paid_balance'];
const CURRENCY_KEYS = ['currency', 'currency_unit', 'money_unit'];
/** 日期型键（历史序列识别用）。 */
const DATE_KEYS = ['date', 'day', 'time', 'created_at', 'timestamp', 'stat_date', 'biz_date'];
/** 数值键偏好（图表取值用，按顺序首个存在的为准）。 */
const VALUE_KEYS = [
  'total_tokens',
  'tokens',
  'token',
  'tokens_used',
  'usage_tokens',
  'cost',
  'amount',
  'expense',
  'requests',
  'calls',
  'count',
  'api_calls',
];

import { ProviderError } from '../errors.js';
import { DISPLAY_NAME } from '../../name.js';

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 同 isObj；历史命名保留（fetchWebSummary 的 error 信封判定用）。 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return isObj(v);
}

function toNum(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** 剥信封：data / biz_data 逐层下钻（最多 4 层，数组不进）。 */
export function unwrapEnvelope(j: unknown): unknown {
  const ENVELOPES = ['data', 'biz_data'];
  let cur: unknown = j;
  let guard = 0;
  while (isObj(cur) && guard++ < 4) {
    let next: unknown = null;
    for (const k of ENVELOPES) {
      const cand = (cur as Record<string, unknown>)[k];
      if (cand !== undefined && cand !== null && (isObj(cand) || Array.isArray(cand))) {
        next = cand;
        break;
      }
    }
    if (next === null) break;
    cur = next;
  }
  return cur;
}

/** 信封错误直报（code/biz_code 非零即抛，附 msg/biz_msg）。 */
export function envelopeError(node: unknown): string | null {
  if (!isObj(node)) return null;
  const raw = node['code'] ?? node['biz_code'] ?? node['err_code'] ?? node['error_code'];
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n === 0) return null;
  const msg = node['msg'] ?? node['message'] ?? node['biz_msg'] ?? node['err_msg'] ?? '';
  return (
    '汇总接口报错(' +
    String(raw) +
    ')' +
    (msg ? ':' + String(msg).slice(0, 120) : '') +
    '（如刚登录过仍报错，请重新粘贴 cookie 与 token）'
  );
}

/**
 * 信封错误 → 结构化抛出。
 *
 * 实测：无效/过期的会话票据会得到 **HTTP 200 + 信封 code=40003**
 * （`Authorization Failed (invalid token)`）——不是 401，所以必须在这里识别，
 * 否则用户会看到一句没有处置指引的「汇总接口报错」。
 *
 * 40003 有两种成因，按文案区分：
 *  - `invalid token` / `Authorization Failed` → 会话票据失效（最常见）→ session；
 *  - `api key` 字样 → 用户把官方 sk- 密钥填到了 token 字段（两套体系不通用）→ auth。
 */
function envelopeThrow(msg: string): never {
  if (/40003/.test(msg)) {
    if (/api.?key/i.test(msg)) {
      throw new ProviderError('auth', msg, {
        hint: '官方 sk- 密钥不能用于网页账单接口（两套凭据体系不通用）。请把它改填到 apiKey 栏，或直接用 deepseek 类型让它自动选路。',
        action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
      });
    }
    throw new ProviderError('session', msg, {
      hint: '网页账单接口拒绝了这个会话票据：多半已过期（平台返回的是「Authorization Failed (invalid token)」）。重新登录并粘贴最新票据即可；若你填的其实是 sk- 官方密钥，请改填到 apiKey 栏。',
      action: 'platform.deepseek.com 重新登录 → 复制新 token → 设置页「编辑」',
    });
  }
  throw new ProviderError('unknown', msg);
}

function pickNum(obj: unknown, keys: string[]): { value: number | null; key: string | null } {
  if (!isObj(obj)) return { value: null, key: null };
  for (const k of keys) {
    if (Object.hasOwn(obj, k)) {
      const n = toNum((obj as Record<string, unknown>)[k]);
      if (n !== null) return { value: n, key: k };
    }
  }
  return { value: null, key: null };
}

function pickStr(obj: unknown, keys: string[]): string | null {
  if (!isObj(obj)) return null;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (typeof v === 'string' && v !== '') return v;
  }
  return null;
}

/** 日期型取值归一为 MM/DD（解析失败返回 null）。 */
function toLabel(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return (m[2] as string).padStart(2, '0') + '/' + (m[3] as string).padStart(2, '0');
  m = s.match(/^(\d{1,2})\/(\d{1,2})/);
  if (m) return (m[1] as string).padStart(2, '0') + '/' + (m[2] as string).padStart(2, '0');
  return null;
}

/**
 * 在对象（含一层嵌套）中找"历史序列"：元素为对象、含日期型键 + 数值键的数组。
 */
export function findHistory(
  root: unknown,
): { items: Record<string, unknown>[]; dateKey: string; valueKey: string } | null {
  if (!isObj(root) && !Array.isArray(root)) return null;
  const cands: unknown[][] = [];
  if (Array.isArray(root)) cands.push(root);
  else {
    const ro = root as Record<string, unknown>;
    for (const k of Object.keys(ro)) {
      if (Array.isArray(ro[k])) cands.push(ro[k] as unknown[]);
      else if (isObj(ro[k])) {
        const inner = ro[k] as Record<string, unknown>;
        for (const k2 of Object.keys(inner)) {
          if (Array.isArray(inner[k2])) cands.push(inner[k2] as unknown[]);
        }
      }
    }
  }
  for (const arr of cands) {
    if (arr.length < 1) continue;
    const sample = arr.filter(isObj).slice(0, 5) as Record<string, unknown>[];
    if (!sample.length) continue;
    let dateKey: string | null = null;
    for (const dk of DATE_KEYS) {
      const hits = sample.filter((it) => toLabel(it[dk]) !== null).length;
      if (hits >= Math.max(1, Math.floor(sample.length / 2))) {
        dateKey = dk;
        break;
      }
    }
    if (!dateKey) continue;
    let valueKey: string | null = null;
    for (const vk of VALUE_KEYS) {
      if (sample.some((it) => toNum(it[vk]) !== null)) {
        valueKey = vk;
        break;
      }
    }
    if (!valueKey) {
      const first = sample[0] as Record<string, unknown>;
      const keys = Object.keys(first).filter((k) => k !== dateKey);
      for (const k of keys) {
        if (
          sample.some(
            (it) =>
              typeof it[k] === 'number' ||
              (typeof it[k] === 'string' && it[k] !== '' && toNum(it[k]) !== null),
          )
        ) {
          valueKey = k;
          break;
        }
      }
    }
    if (!valueKey) continue;
    return { items: arr.filter(isObj) as Record<string, unknown>[], dateKey, valueKey };
  }
  return null;
}

function fmtInt(n: number): string {
  n = Math.round(Number(n) || 0);
  if (n >= 1e8) return ((n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿') as string;
  if (n >= 1e4) return ((n / 1e4).toFixed(1).replace(/\.0$/, '') + '万') as string;
  return String(n);
}

/** 钱包数组首个对象（如 normal_wallets[0]），无则 null。 */
function firstWallet(scope: unknown, keys: string[]): Record<string, unknown> | null {
  if (!isObj(scope)) return null;
  for (const k of keys) {
    const arr = (scope as Record<string, unknown>)[k];
    if (Array.isArray(arr) && arr.length && isObj(arr[0])) return arr[0] as Record<string, unknown>;
  }
  return null;
}

/**
 * 解析网页用户汇总（纯函数，可单测）。
 */
export function parseUserSummary(
  body: unknown,
  opts?: { lowWarn?: unknown },
): { billing: Record<string, unknown>; extra: Record<string, unknown> | null } {
  const errTop = envelopeError(body);
  if (errTop) envelopeThrow(errTop);
  const root = unwrapEnvelope(body);
  if (!isObj(root) && !Array.isArray(root)) {
    throw new ProviderError('parse', '汇总接口返回结构异常（顶层非对象），请把顶层类型发给维护者');
  }
  const scope: unknown = isObj(root) ? root : {};
  const errIn = envelopeError(scope);
  if (errIn) envelopeThrow(errIn);
  const lowWarn =
    opts && opts.lowWarn !== undefined && opts.lowWarn !== '' && opts.lowWarn !== null
      ? Number(opts.lowWarn)
      : null;

  // 主路径：钱包结构
  const normal = firstWallet(scope, ['normal_wallets']);
  const cost = firstWallet(scope, ['total_costs']);
  if (normal) {
    const balance = toNum(normal['balance']);
    if (balance === null) throw new ProviderError('parse', '钱包 balance 非数字，请把该字段样例发给维护者');
    const currency = (typeof normal['currency'] === 'string' && normal['currency']) || 'CNY';
    const costs = cost ? toNum(cost['amount']) : null;
    const billing = {
      balance,
      currency,
      granted: null,
      toppedUp: null,
      isAvailable: balance > 0 ? true : null,
      infos: [],
      lowWarn,
      plan: 'DeepSeek 网页版',
    };
    const stats: Array<{ label: string; value: string }> = [];
    if (costs !== null) stats.push({ label: '累计消费', value: costs.toFixed(2) });
    return { billing, extra: stats.length ? { stats } : null };
  }

  // 兜底路径：通用候选键（改版兼容）
  let bal = pickNum(scope, BALANCE_KEYS);
  if (bal.value === null && isObj(scope)) {
    for (const k of Object.keys(scope as Record<string, unknown>)) {
      const sub = (scope as Record<string, unknown>)[k];
      if (isObj(sub)) {
        const r = pickNum(sub, BALANCE_KEYS);
        if (r.value !== null) {
          bal = r;
          break;
        }
      }
    }
  }
  if (bal.value === null) {
    const keys = isObj(root)
      ? Object.keys(root as Record<string, unknown>)
          .slice(0, 12)
          .join(',')
      : 'array';
    throw new ProviderError(
      'parse',
      '汇总接口未命中余额字段（顶层键：' + keys + '）：接口可能改版，把脱敏后的顶层键名发给维护者即可迭代',
    );
  }
  const granted = pickNum(scope, GRANTED_KEYS).value;
  const topped = pickNum(scope, TOPPED_KEYS).value;
  const currency = pickStr(scope, CURRENCY_KEYS) || 'CNY';

  const billing = {
    balance: bal.value,
    currency,
    granted,
    toppedUp: topped,
    isAvailable: bal.value > 0 ? true : null,
    infos: [],
    lowWarn,
    plan: 'DeepSeek 网页版',
  };

  let extra: Record<string, unknown> | null = null;
  try {
    const hist = findHistory(root);
    if (hist && hist.items.length) {
      const pts = hist.items
        .map((it) => ({ label: toLabel(it[hist.dateKey]), value: toNum(it[hist.valueKey]) || 0 }))
        .filter((p) => p.label !== null)
        .slice(-60) as Array<{ label: string; value: number }>;
      if (pts.length) {
        const total = pts.reduce((s, p) => s + p.value, 0);
        const last = pts[pts.length - 1] as { label: string; value: number };
        extra = {
          stats: [
            { label: '最新' + last.label, value: fmtInt(last.value) },
            { label: '累计(' + pts.length + '天)', value: fmtInt(total) },
          ],
          chart: { title: '使用趋势', labels: pts.map((p) => p.label), values: pts.map((p) => p.value) },
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { billing, extra };
}

/**
 * 网页汇总拉取（纯逻辑，可单测；secretKind 由调用方附）。
 */
export async function fetchWebSummary(
  params: Record<string, unknown>,
  cookie: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ billingKind: 'payg'; billing: Record<string, unknown>; extra: Record<string, unknown> | null }> {
  const headers: Record<string, string> = {};
  if (cookie) headers['Cookie'] = String(cookie).trim();
  if (token) {
    const t = String(token).trim();
    headers['Authorization'] = /^bearer\s/i.test(t) ? t.replace(/^bearer\s/i, 'Bearer ') : 'Bearer ' + t;
  }
  const res = await fetchImpl(SUMMARY_URL, { headers, cache: 'no-store' });
  const code = res.status;
  const text = await res.text();
  if (code === 401 || code === 403)
    throw new ProviderError('session', 'DeepSeek 网页会话失效(' + code + ')：' + text.slice(0, 120), {
      status: code,
      hint: '网页登录态（Bearer 会话票据）已过期或被平台判定为未登录。重新抓取最新票据覆盖即可。',
      action: 'platform.deepseek.com 重新登录 → 复制新 token → 设置页「编辑」',
    });
  if (code === 429)
    throw new ProviderError('rate', 'DeepSeek 限流(429)：' + text.slice(0, 100), { status: code });
  if (code >= 500)
    throw new ProviderError('server', 'DeepSeek 服务端错误(' + code + ')：' + text.slice(0, 100), {
      status: code,
    });
  if (code !== 200)
    throw new ProviderError('unknown', 'DeepSeek 汇总接口 HTTP ' + code + '：' + text.slice(0, 100), {
      status: code,
    });
  let j: unknown = null;
  try {
    j = JSON.parse(text) as unknown;
  } catch {
    throw new ProviderError('parse', '汇总接口返回非 JSON(' + text.length + 'B)：' + text.slice(0, 80));
  }
  const jr = (j ?? {}) as Record<string, unknown>;
  if (jr && jr['error']) {
    const em = isRecord(jr['error']) ? String((jr['error'] as Record<string, unknown>)['message'] ?? '') : '';
    throw new ProviderError('unknown', '汇总接口报错：' + (em || text.slice(0, 80)));
  }
  let parsed;
  try {
    parsed = parseUserSummary(j, { lowWarn: params['lowWarn'] });
  } catch (e) {
    // 解析里的分类错误（会话失效/接口改版）必须原样透出，包一层会丢掉 kind
    if (e instanceof ProviderError) throw e;
    throw new ProviderError('parse', (e as Error)?.message || '汇总解析失败', { cause: e });
  }
  if (params['currency']) parsed.billing['currency'] = String(params['currency']);
  return { billingKind: 'payg', billing: parsed.billing, extra: parsed.extra };
}
