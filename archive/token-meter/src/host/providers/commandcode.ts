/**
 * @dshp/token-meter —— commandcode 适配器（Command Code 额度：订阅窗口 + 额度余额 + 用量）
 *
 * 鉴权：`Authorization: Bearer user_...`（工作室 Studio 创建的 API Key；
 * 与 CLI/Provider API 同一把钥匙）。实测 `x-cli-environment` /
 * `x-command-code-version` 均为可选，缺失或陈旧都不影响 alpha 额度接口。
 *
 * ⚠ 路径必须是 `/alpha/*`：网页端内部路径 `/internal/usage/summary` 用 API Key
 * 一律 401（只认网页 Cookie 会话），不要改成 internal。
 *
 * 四个接口（并行拉取，仅 credits 为必需，其余失败降级为缺失）：
 *  - GET /alpha/billing/credits       额度余额 + 5 小时/每周窗口（必需）
 *  - GET /alpha/usage/summary         本计费周期用量（请求数/成功率/tokens/消费）
 *  - GET /alpha/billing/subscriptions 订阅计划与周期
 *  - GET /alpha/whoami                账号
 *
 * 数据来源：https://pi.dev/packages/pi-commandcode-provider（社区实测端点清单）
 */
import { numStr } from './base.js';
import { ProviderError } from '../errors.js';
import { normalizeSecretRef, secretKindOfRaw } from '../secrets.js';
import {
  balanceSection,
  makeView,
  metricsSection,
  noteSection,
  windowsSection,
  viewToExtra,
} from './view.js';
import type {
  ProviderAdapter,
  ProviderSection,
  ProviderView,
  QuotaWindow,
  Vendor,
  ProviderDeps,
} from '../types.js';
import { DISPLAY_NAME } from '../../name.js';

/** alpha 额度接口基址（固定，不可配置；换域名改这里重 build）。 */
const API_BASE = 'https://api.commandcode.ai/alpha';
/** API Key 形态（Studio 创建，user_ 开头）。 */
const KEY_RE = /^user_[A-Za-z0-9_-]{8,}$/;
/** 默认环境变量/凭据键名（与 CLI 同一约定：导出后无需把密钥写进配置）。 */
export const DEFAULT_ENV_KEY = 'COMMAND_CODE_API_KEY';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function fmtInt(n: number): string {
  const v = Math.round(Number(n) || 0);
  if (v >= 1e8) return (v / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
  if (v >= 1e4) return (v / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
  return String(v);
}

function fmtMoney(n: number): string {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}

/** planId → 展示名（individual-goat → GOAT；未知形态退化为人读大写）。 */
export function planLabel(planId: unknown): string {
  const id = typeof planId === 'string' ? planId.trim() : '';
  if (!id) return '';
  const m = /^(?:individual|team)-(.+)$/.exec(id);
  const raw = (m ? m[1] : id) as string;
  const known: Record<string, string> = {
    go: 'Go',
    goat: 'GOAT',
    pro: 'Pro',
    max: 'Max',
    provider: 'Provider',
  };
  const hit = known[raw];
  if (hit) return hit;
  return raw.replace(/[-_]/g, ' ').toUpperCase();
}

/**
 * 单次 GET（Bearer API Key）→ 解析 JSON；非 2xx 抛中文错误。
 */
async function getJson(path: string, key: string, fetchImpl: typeof fetch): Promise<Record<string, unknown>> {
  const res = await fetchImpl(API_BASE + path, {
    headers: { Authorization: 'Bearer ' + key, accept: 'application/json' },
    cache: 'no-store',
  });
  const code = res.status;
  const text = await res.text();
  if (code === 401 || code === 403)
    throw new ProviderError('auth', 'CommandCode API Key 无效(' + code + ')：' + text.slice(0, 120), {
      status: code,
      hint: '平台拒绝了这把 API Key：可能已删除、轮换，或复制时缺了字符。到工作室重新创建一把即可。',
      action: 'commandcode.ai → 工作室（Studio）→ API keys',
      docs: 'https://commandcode.ai/docs/reference/errors/unauthorized',
    });
  if (code === 429)
    throw new ProviderError('rate', 'CommandCode 限流(429)：' + text.slice(0, 100), { status: code });
  if (code === 404)
    throw new ProviderError('parse', 'CommandCode 接口不存在(404)：路径可能已变更（' + path + '）', {
      status: code,
      hint: '额度接口路径变了，通常意味着平台改版，需要插件更新。',
    });
  if (code >= 500)
    throw new ProviderError('server', 'CommandCode 服务端错误(' + code + ')：' + text.slice(0, 100), {
      status: code,
    });
  if (code !== 200)
    throw new ProviderError('unknown', 'CommandCode 接口 HTTP ' + code + '：' + text.slice(0, 120), {
      status: code,
    });
  let j: unknown = null;
  try {
    j = JSON.parse(text) as unknown;
  } catch {
    throw new ProviderError('parse', 'CommandCode 返回非 JSON(' + text.length + 'B)：' + text.slice(0, 80));
  }
  if (!isRecord(j)) throw new ProviderError('parse', 'CommandCode 返回结构异常（顶层非对象）');
  const err = j['error'];
  if (isRecord(err)) {
    const emsg = String(err['message'] ?? err['code'] ?? text.slice(0, 80));
    const ecode = String(err['code'] ?? '');
    const ecapital = ecode.toUpperCase();
    const kind = /UPGRADE|PLAN|SUBSCRIPTION/.test(ecapital)
      ? 'plan'
      : /UNAUTHORIZED|FORBIDDEN|TOKEN/.test(ecapital)
        ? 'auth'
        : /RATE|LIMIT|QUOTA/.test(ecapital)
          ? 'rate'
          : 'unknown';
    throw new ProviderError(kind, 'CommandCode 接口报错：' + emsg, {
      ...(typeof err['status'] === 'number' ? { status: err['status'] as number } : {}),
      ...(kind === 'auth' ? { docs: 'https://commandcode.ai/docs/reference/errors/unauthorized' } : {}),
    });
  }
  return j;
}

/** 窗口 → QuotaWindow（cap>0 才有效；resetAt 为毫秒时间戳）。 */
function toWindow(key: string, label: string, node: unknown, nowMs: number): QuotaWindow | null {
  if (!isRecord(node)) return null;
  const cap = numStr(node['cap']);
  const used = numStr(node['used']);
  if (!(cap > 0)) return null;
  const since = numStr(node['resetAt']) - nowMs;
  return {
    key,
    label,
    pct: Math.min(100, Math.max(0, (used / cap) * 100)),
    used,
    limit: cap,
    resetInSec: Math.max(0, Math.round(since / 1000)),
  };
}

/**
 * 月度额度窗口：已用 = 本期消费（totalCredits），总量 = 本期消费 + 剩余额度
 * （月度 + 充值 + 赠送）。重置时间优先取订阅周期结束（currentPeriodEnd），
 * 拿不到就退化为「无倒计时」（resetInSec=0，渲染为不显示剩余时长）。
 */
function toMonthlyWindow(
  credits: Record<string, unknown>,
  usage: Record<string, unknown> | null,
  subData: Record<string, unknown> | null,
  nowMs: number,
): QuotaWindow | null {
  const consumed = numStr(usage ? usage['totalCredits'] : 0) + 0;
  const balance =
    numStr(credits['monthlyCredits']) + numStr(credits['purchasedCredits']) + numStr(credits['freeCredits']);
  const total = consumed + balance;
  // 没有消费也没余额说明数据缺失，不构造空窗口
  if (!(total > 0)) return null;
  const endRaw = subData ? subData['currentPeriodEnd'] : null;
  let resetInSec = 0;
  if (typeof endRaw === 'string' && endRaw) {
    const endMs = Date.parse(endRaw);
    if (Number.isFinite(endMs)) resetInSec = Math.max(0, Math.round((endMs - nowMs) / 1000));
  }
  return {
    key: 'monthly',
    label: '每月',
    pct: Math.min(100, Math.max(0, (consumed / total) * 100)),
    used: Math.round(consumed * 10000) / 10000,
    limit: Math.round(total * 100) / 100,
    resetInSec,
  };
}

export interface CommandCodeData {
  windows: QuotaWindow[];
  credits: Record<string, unknown>;
  windowLimits: Record<string, unknown>;
  usage: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  user: Record<string, unknown> | null;
}

/**
 * 解析四接口 → 规范化数据（纯函数，可单测）。
 */
export function parseCommandCode(
  creditsBody: unknown,
  usageBody: unknown | null,
  subBody: unknown | null,
  whoBody: unknown | null,
  nowMs: number,
): CommandCodeData {
  const creditsRoot = isRecord(creditsBody) ? creditsBody : {};
  const credits = isRecord(creditsRoot['credits']) ? creditsRoot['credits'] : {};
  const windowLimits = isRecord(creditsRoot['windowLimits']) ? creditsRoot['windowLimits'] : {};
  const windows: QuotaWindow[] = [];
  const five = toWindow('5h', '5 小时', windowLimits['fiveHour'], nowMs);
  if (five) windows.push(five);
  const week = toWindow('weekly', '每周', windowLimits['weekly'], nowMs);
  if (week) windows.push(week);
  const usage = isRecord(usageBody) ? usageBody : null;
  const subData =
    isRecord(subBody) && isRecord(subBody['data']) ? (subBody['data'] as Record<string, unknown>) : null;
  // 月度额度窗口：CommandCode 没有独立的月度窗口接口，用「本期消费 + 剩余额度」
  // 推导已用/总量，重置时间取订阅周期结束时间。这样它与 5 小时/每周一样是标准
  // QuotaWindow，客户端三条进度条走同一个组件、同一套排版。
  const monthly = toMonthlyWindow(credits, usage, subData, nowMs);
  if (monthly) windows.push(monthly);
  const user =
    isRecord(whoBody) && isRecord(whoBody['user']) ? (whoBody['user'] as Record<string, unknown>) : null;
  return { windows, credits, windowLimits, usage, subscription: subData, user };
}

/**
 * 订阅状态 → 人话提示（接口能调通、但订阅已不可用时也必须明确告知）。
 * 返回 null = 状态正常；否则给出提示文案与严重度。
 */
export function subscriptionAlert(
  status: unknown,
  periodEnd: unknown,
  nowMs: number,
): { text: string; tone: 'bad' | 'warn' } | null {
  const st = String(status ?? '')
    .trim()
    .toLowerCase();
  const end = typeof periodEnd === 'string' ? periodEnd.slice(0, 10) : '';
  const BAD: Record<string, string> = {
    past_due: '订阅扣款失败（past_due），额度可能随时停止',
    unpaid: '订阅未支付（unpaid），当前无法继续使用',
    canceled: '订阅已取消（canceled）' + (end ? '，' + end + ' 后停止续订' : ''),
    cancelled: '订阅已取消（cancelled）' + (end ? '，' + end + ' 后停止续订' : ''),
    incomplete_expired: '订阅未完成支付已失效（incomplete_expired），需重新订阅',
    ended: '订阅已结束（ended）' + (end ? '（' + end + '）' : ''),
    expired: '订阅已过期（expired）' + (end ? '（' + end + '）' : ''),
    suspended: '订阅已被暂停（suspended），请检查支付方式',
  };
  const hit = BAD[st];
  if (hit) return { text: '⚠ ' + hit + '：请更新支付方式或重新订阅，处理后点「刷新」。', tone: 'bad' };
  // 状态仍为 active 但周期已过：平台可能尚未翻转状态，提前预警
  if (st === 'active' && end) {
    const endMs = Date.parse(end + 'T23:59:59Z');
    if (Number.isFinite(endMs) && endMs < nowMs)
      return {
        text: '⚠ 订阅周期已于 ' + end + ' 结束，额度可能随时停止：请确认续订状态后点「刷新」。',
        tone: 'bad',
      };
  }
  return null;
}

/**
 * 构建 provider 视图（该供应商自己的数据与排版）。
 */
export function buildCommandCodeView(
  data: CommandCodeData,
  opts: { lowWarn?: number | null },
): { view: ProviderView | null; billing: Record<string, unknown> } {
  const monthly = numStr(data.credits['monthlyCredits']);
  const purchased = numStr(data.credits['purchasedCredits']);
  const free = numStr(data.credits['freeCredits']);
  const balance = monthly + purchased + free;
  const plan = planLabel(data.subscription && data.subscription['planId']);
  const subStatus = data.subscription ? String(data.subscription['status'] ?? '') : '';
  const periodEnd = data.subscription ? String(data.subscription['currentPeriodEnd'] ?? '') : '';
  const consumed = data.usage ? numStr(data.usage['totalCredits']) : 0;
  const belowThreshold = data.credits['belowThreshold'] === true;
  const exceeded = data.windowLimits['exceeded'];
  const cancelAtPeriodEnd = data.subscription ? data.subscription['cancelAtPeriodEnd'] === true : false;

  const sections: Array<ProviderSection | null> = [];
  sections.push(windowsSection(data.windows, '额度窗口'));
  sections.push(
    balanceSection(
      {
        balance,
        currency: 'USD',
        granted: free,
        toppedUp: purchased,
        isAvailable: belowThreshold ? false : balance > 0 ? true : null,
        infos: [],
        lowWarn: opts.lowWarn !== undefined ? opts.lowWarn : null,
        plan: plan || 'Command Code',
      },
      '剩余额度',
    ),
  );
  // 注：月度额度消耗已作为标准窗口放进 data.windows（上面 windowsSection 会把它渲染成
  // 与 5 小时 / 每周并列的第三条进度条），因此这里不再重复一条 progressSection ——
  // 同一条数据出现两次既占高，也让两处排版规则不一致。

  const items: Array<{ label: string; value: string }> = [];
  if (plan) items.push({ label: '订阅计划', value: plan + (subStatus ? '（' + subStatus + '）' : '') });
  if (periodEnd) items.push({ label: '当前周期至', value: periodEnd.slice(0, 10) });
  if (data.user) {
    const who = String(data.user['userName'] || data.user['name'] || '');
    if (who) items.push({ label: '账号', value: who });
  }
  if (data.usage) {
    items.push({ label: '本期消费', value: '$' + fmtMoney(numStr(data.usage['totalCost'])) });
    items.push({ label: '请求数', value: fmtInt(numStr(data.usage['totalCount'])) });
    items.push({ label: '成功率', value: numStr(data.usage['successRate']) + '%' });
    items.push({ label: '输入 Token', value: fmtInt(numStr(data.usage['totalTokensIn'])) });
    items.push({ label: '输出 Token', value: fmtInt(numStr(data.usage['totalTokensOut'])) });
  }
  sections.push(metricsSection(items, '账户与用量'));

  // 订阅异常优先提示：计划不可用时窗口数据再好看也没意义
  const alert = subscriptionAlert(subStatus, periodEnd, Date.now());
  if (alert) sections.push(noteSection(alert.text, alert.tone));
  if (exceeded) sections.push(noteSection('已达到窗口上限：' + String(exceeded) + '，请等窗口重置。', 'bad'));
  else if (belowThreshold) sections.push(noteSection('额度低于阈值，调用可能被拒绝，请及时充值。', 'warn'));
  if (!alert) {
    if (cancelAtPeriodEnd) sections.push(noteSection('订阅已设置周期末取消，到期后额度将停止续订。', 'warn'));
    else if (plan && data.windows.length)
      sections.push(noteSection(plan + ' 订阅生效中，额度按 5 小时 / 每周 / 每月窗口滚动刷新。', 'info'));
  }

  const view = makeView(sections);
  const granted = free > 0 ? free : null;
  const topped = purchased > 0 ? purchased : null;
  return {
    view,
    billing: {
      balance,
      currency: 'USD',
      granted,
      toppedUp: topped,
      isAvailable: belowThreshold ? false : balance > 0 ? true : null,
      infos: [],
      lowWarn: opts.lowWarn !== undefined ? opts.lowWarn : null,
      plan: plan || 'Command Code',
      // 额度构成与本期消费（客户端专属 UI 用来画分解条与消耗进度）
      monthlyCredits: monthly,
      purchasedCredits: purchased,
      freeCredits: free,
      consumedCredits: consumed,
      ...(periodEnd ? { periodEnd: periodEnd.slice(0, 10) } : {}),
    },
  };
}

const commandcode: ProviderAdapter = {
  type: 'commandcode',
  icon: 'commandcode',
  label: 'CC',
  title: 'commandcode（Command Code）',
  secretField: 'apiKey',
  hint:
    'Command Code 额度：5 小时/每周滚动窗口 + 剩余额度 + 本计费周期用量。API Key 在 commandcode.ai 工作室（Studio）创建，user_ 开头；与 CLI 同一把钥匙。默认读环境变量/凭据 ' +
    DEFAULT_ENV_KEY +
    '（留空即用）。',
  fields: [
    {
      key: 'apiKey',
      label: 'apiKey',
      kind: 'secret',
      mono: true,
      placeholder: '$' + DEFAULT_ENV_KEY + '（默认）或粘贴 user_ 开头的明文',
      hint:
        '默认 $' +
        DEFAULT_ENV_KEY +
        '：只要该环境变量已导出（CLI 用的同一把钥匙），此项留空即可，插件自动回退读取。也可粘贴 user_ 开头的明文，或用「存凭据」转成引用。密钥获取：commandcode.ai → 工作室（Studio）→ API keys 创建。',
    },
    {
      key: 'lowWarn',
      label: '低余额预警线',
      kind: 'number',
      placeholder: '如：10',
      hint: '剩余额度（USD）低于此值时侧边栏黄色提醒。',
    },
  ],

  /** 新增供应商时直接带上默认环境变量引用（用户无需手填）。 */
  defaultParams: { apiKey: '$' + DEFAULT_ENV_KEY },

  sanitizeParams(raw: unknown): Record<string, unknown> {
    const src =
      raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v !== undefined) out[k] = typeof v === 'string' ? normalizeSecretRef(v) : v;
    }
    if (typeof out['apiKey'] === 'string') out['apiKey'] = normalizeSecretRef(out['apiKey']) as never;
    return out;
  },

  maskParams(params: Record<string, unknown>): Record<string, unknown> {
    const out = { ...params };
    if (
      typeof out['apiKey'] === 'string' &&
      out['apiKey'] !== '' &&
      secretKindOfRaw(out['apiKey']) === 'plain'
    )
      out['apiKey'] = '';
    return out;
  },

  validateParams(params: Record<string, unknown>): string {
    const v = params && typeof params['apiKey'] === 'string' ? (params['apiKey'] as string) : '';
    if (v && secretKindOfRaw(v) === 'plain' && !KEY_RE.test(v)) return 'apiKey 形态异常（应为 user_ 开头）';
    return '';
  },

  async fetch(vendor: Vendor, deps: ProviderDeps) {
    const params = (vendor && vendor.params) || {};
    const raw = typeof params['apiKey'] === 'string' ? (params['apiKey'] as string).trim() : '';
    // 未显式填写时回退到默认环境变量/凭据键名（与 CLI 同一约定）
    const fallback = '$' + DEFAULT_ENV_KEY;
    let r: { value: string; kind: string };
    try {
      r = await deps.resolveSecret(raw || fallback);
    } catch (e) {
      if (!raw)
        throw new ProviderError('config', 'apiKey 未配置：环境变量/凭据 ' + DEFAULT_ENV_KEY + ' 未找到', {
          cause: e,
          hint:
            '还差一把 API Key 才能查额度：' +
            DEFAULT_ENV_KEY +
            ' 环境变量/凭据里没找到它，配置里也没填。导出该变量即可自动生效，或直接粘贴明文。',
          action: 'commandcode.ai → 工作室（Studio）→ API keys（user_ 开头）',
          retriable: false,
        });
      throw e;
    }
    if (!r.value)
      throw new ProviderError('config', 'apiKey 缺少有效值（引用解析为空）', {
        hint:
          '填的是 $' +
          DEFAULT_ENV_KEY +
          ' 引用，但该环境变量/凭据当前为空。导出变量后需重启 dsh web，或改填明文。',
        action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
        retriable: false,
      });
    const fetchImpl = (deps && deps.fetchImpl) || fetch;
    const nowMs = Date.now();
    // credits 必需（其余接口任一失败都不拖垮整卡：显式降级为「该项缺失」）。
    const creditsBody = await getJson('/billing/credits', r.value, fetchImpl);
    const optional = async (path: string): Promise<unknown | null> => {
      try {
        return await getJson(path, r.value, fetchImpl);
      } catch {
        return null;
      }
    };
    const [usageBody, subBody, whoBody] = await Promise.all([
      optional('/usage/summary'),
      optional('/billing/subscriptions'),
      optional('/whoami'),
    ]);
    const data = parseCommandCode(creditsBody, usageBody, subBody, whoBody, nowMs);
    const lowWarn =
      params['lowWarn'] !== undefined && params['lowWarn'] !== '' && params['lowWarn'] !== null
        ? numStr(params['lowWarn'])
        : null;
    const built = buildCommandCodeView(data, { lowWarn });
    return {
      billingKind: data.windows.length ? ('rolling' as const) : ('payg' as const),
      ...(data.windows.length ? { windows: data.windows } : {}),
      billing: built.billing,
      view: built.view,
      extra: viewToExtra(built.view),
      secretKind: r.kind,
      via: 'CommandCode API',
    };
  },
};

export default commandcode;
