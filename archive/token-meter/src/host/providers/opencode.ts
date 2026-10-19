/**
 * @dshp/token-meter —— opencode 适配器（官方 /go + /billing 双页合并）
 *
 * 原实现：dsh-token-quota/lib/providers/opencode.js（逐行对齐，仅加 TS 类型）
 *
 * 一个渠道覆盖 Opencode Go（订阅制三窗口）与 Zen（按量余额）：
 * 同一 workspace、同一 cookie，一次拉取同时请求两页。
 */
import { WORKSPACE_RE, numStr } from './base.js';
import { ProviderError } from '../errors.js';
import { normalizeSecretRef, secretKindOfRaw } from '../secrets.js';
import type { ProviderAdapter, Vendor, ProviderDeps, QuotaWindow } from '../types.js';

/** 旧密钥字段名（兼容读取 + 自动迁移）。 */
export const LEGACY_AUTH_FIELD = 'auth';

/**
 * 取生效 Cookie 原文（`cookie` 优先，旧 `auth` 兜底）。
 */
export function effectiveCookie(params: Record<string, unknown>): string {
  const p = params && typeof params === 'object' ? params : {};
  const c = p['cookie'];
  if (typeof c === 'string' && c.trim() !== '') return c;
  const a = p[LEGACY_AUTH_FIELD];
  if (typeof a === 'string' && a.trim() !== '') return a;
  return '';
}

/**
 * 组装 Cookie 请求头：含 `=` 视为整段 Cookie 原样透传，否则视为裸 token 补 `auth=` 前缀。
 */
export function toCookieHeader(secret: string): string {
  const s = String(secret || '').trim();
  if (s === '') return '';
  if (s.indexOf('=') !== -1) return s;
  return 'auth=' + s;
}

/** cookie 类 params 通用清洗：旧引用归一 + 旧 auth→cookie 收敛（读兼容，写收敛）。 */
export function sanitizeCookieParams(raw: unknown): Record<string, unknown> {
  const src =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v !== undefined) out[k] = typeof v === 'string' ? normalizeSecretRef(v) : v;
  }
  if (typeof out['cookie'] === 'string') out['cookie'] = normalizeSecretRef(out['cookie']) as never;
  if (typeof out[LEGACY_AUTH_FIELD] === 'string')
    out[LEGACY_AUTH_FIELD] = normalizeSecretRef(out[LEGACY_AUTH_FIELD]) as never;
  if (
    (out['cookie'] === undefined || out['cookie'] === '') &&
    typeof out[LEGACY_AUTH_FIELD] === 'string' &&
    (out[LEGACY_AUTH_FIELD] as string) !== ''
  ) {
    out['cookie'] = out[LEGACY_AUTH_FIELD];
  }
  return out;
}

/** cookie 类 params 脱敏：cookie 与旧 auth 的明文一律抹掉（只写不读）。 */
export function maskCookieParams(params: Record<string, unknown>): Record<string, unknown> {
  const out = { ...params };
  for (const k of ['cookie', LEGACY_AUTH_FIELD]) {
    if (typeof out[k] === 'string' && out[k] !== '' && secretKindOfRaw(out[k]) === 'plain') out[k] = '';
  }
  return out;
}

const GO_PATH = '/go';
const BILLING_PATH = '/billing';
/** billing 页 amount 的最小展示单位（实测 500000000 → $5.00，即 1e8 记账单位）。 */
const BILLING_UNIT = 1e8;

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * 从页面 html 提取标量内联键值（React Server Components 流式数据）。
 */
function inlineVal(html: string, key: string): string | number | boolean | null | undefined {
  const re = new RegExp(key + '\\s*:\\s*("([^"]{0,80})"|null|true|false|(-?\\d+(?:\\.\\d+)?))');
  const m = re.exec(html);
  if (!m) return undefined;
  if (m[2] !== undefined) return m[2];
  if (m[3] !== undefined) return Number(m[3]);
  if (m[1] === 'null') return null;
  if (m[1] === 'true') return true;
  if (m[1] === 'false') return false;
  return undefined;
}

/** ISO 日期字符串首个命中，返回 Date 或 null。 */
function inlineDate(html: string, key: string): Date | null {
  const m = new RegExp(key + '\\s*:\\s*(?:new Date\\()?"(\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z?)"').exec(html);
  if (!m) return null;
  const d = new Date(m[1] as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

const mmdd = (d: Date | null): string =>
  d ? String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') : '';

/** 秒数 → 中文剩余时长（订阅到期话术用：X天后 / X小时后）。 */
export function fmtLeftCn(sec: number): string {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s >= 86400) return Math.floor(s / 86400) + ' 天';
  if (s >= 3600) return Math.floor(s / 3600) + ' 小时';
  if (s >= 60) return Math.floor(s / 60) + ' 分钟';
  return s + ' 秒';
}

/** 余额换算：amount（最小单位）→ 展示数（除以 1e8，保留 2 位）。 */
export function billingAmount(amount: unknown): number | null {
  if (amount === undefined || amount === null) return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round((n / BILLING_UNIT) * 100) / 100;
}

/**
 * 从 /go + /billing 提取订阅信息（纯函数，可单测）。
 */
export function parseSubscription(
  goHtml: string,
  billingHtml: string,
): { plan: string; note: string; expireAt: null } | null {
  const src = (goHtml || '') + '\n' + (billingHtml || '');
  const plan = inlineVal(src, 'subscriptionPlan');
  void inlineDate;
  if (typeof plan === 'string' && plan && plan !== 'null') {
    const sub = inlineVal(src, 'subscription');
    return { plan: String(plan), note: sub ? '订阅生效中' : '', expireAt: null };
  }
  const liteId = inlineVal(src, 'liteSubscriptionID');
  if (typeof liteId === 'string' && liteId && liteId !== 'null') {
    const paid = latestLitePurchase(billingHtml || '');
    return { plan: 'Lite', note: paid ? '购买于 ' + mmdd(paid) : '', expireAt: null };
  }
  return null;
}

/** /billing 支付记录里 type:"lite" 的最近购买时间。 */
function latestLitePurchase(billingHtml: string): Date | null {
  const html = billingHtml || '';
  let latest: Date | null = null;
  const re =
    /timeCreated\s*:\s*(?:new Date\()?"(\d{4}-\d{2}-\d{2}T[0-9:.]+Z?)"[^}]{0,400}?type\s*:\s*"lite"/g;
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(html)) !== null) {
    const d = new Date(m[1] as string);
    if (!Number.isNaN(d.getTime()) && (latest === null || d > latest)) latest = d;
  }
  if (latest === null) {
    const re2 =
      /type\s*:\s*"lite"[^}]{0,400}?timeCreated\s*:\s*(?:new Date\()?"(\d{4}-\d{2}-\d{2}T[0-9:.]+Z?)"/g;
    while ((m = re2.exec(html)) !== null) {
      const d = new Date(m[1] as string);
      if (!Number.isNaN(d.getTime()) && (latest === null || d > latest)) latest = d;
    }
  }
  return latest;
}

/**
 * /go 页的窗口定义：页面键名 → (窗口 key, 展示标签)。
 *
 * 用**键名**定位窗口，不靠出现顺序 —— 某个窗口（如 weekly）在特定订阅下
 * 可能整块缺失，按位置取会把 每周 的值错配给 每月。
 */
const GO_WINDOW_DEFS: Array<[string, string, string]> = [
  ['rollingUsage', '5h', '5 小时'],
  ['weeklyUsage', 'weekly', '每周'],
  ['monthlyUsage', 'monthly', '每月'],
];

interface GoWindowRaw {
  status: string;
  resetInSec: number;
  pct: number;
  used: number;
  limit: number;
}

/**
 * 解析单个窗口对象字面量（形如 `rollingUsage:$R[31]={status:"ok",resetInSec:…}`）。
 *
 * 两点必须宽松：
 *  - `$R[n]=` 是页面压缩后的变量引用，可能没有，也可能不叫 $R；
 *  - `status` 不只是 `"ok"`：实测月度窗口空闲时是 `"ok"`，被限流后是
 *    `"rate-limited"`。**旧实现把 status 硬编码成 ok，导致限流窗口匹配不到、
 *    整条 /go 解析失败并静默退化成「Zen 按需余额」**（滚动进度条凭空消失）。
 */
function parseGoWindow(html: string, srcKey: string): GoWindowRaw | null {
  const m = new RegExp(srcKey + ':(?:\\$?[A-Za-z_$][\\w$]*\\[\\d+\\]=\\s*)?\\{([^}]*)\\}').exec(html);
  if (!m) return null;
  const body = m[1] as string;
  // 花括号存在但认不出关键字段（如 {foo:"bar"}）→ 不算窗口对象，
  // 交给上层判为「改版」而不是伪造成一个 0 额度窗口
  if (!/usagePercent:/.test(body)) return null;
  const num = (k: string): number => {
    const mm = new RegExp(k + ':\\s*"?(-?[\\d.]+)"?').exec(body);
    return mm ? Number(mm[1]) : 0;
  };
  const st = /status:\s*"([^"]*)"/.exec(body);
  return {
    status: st ? (st[1] as string) : 'ok',
    resetInSec: num('resetInSec'),
    pct: num('usagePercent'),
    used: num('usage'),
    limit: num('limit'),
  };
}

/**
 * 兜底：页面键名改版时，按出现顺序扫描所有窗口对象。
 * 仅在按键名一个都没解析到时使用（正常路径不会走到）。
 */
function scanGoWindowsGeneric(html: string): GoWindowRaw[] {
  const re = /\{([^{}]*status:\s*"[^"]*"[^{}]*)\}/g;
  const out: GoWindowRaw[] = [];
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(html)) !== null) {
    const body = m[1] as string;
    if (!/resetInSec:/.test(body) || !/usagePercent:/.test(body)) continue;
    const num = (k: string): number => {
      const mm = new RegExp(k + ':\\s*"?(-?[\\d.]+)"?').exec(body);
      return mm ? Number(mm[1]) : 0;
    };
    const st = /status:\s*"([^"]*)"/.exec(body);
    out.push({
      status: st ? (st[1] as string) : 'ok',
      resetInSec: num('resetInSec'),
      pct: num('usagePercent'),
      used: num('usage'),
      limit: num('limit'),
    });
  }
  return out;
}

/**
 * 从 /go 页 html 提取滚动窗口 + 订阅名（纯函数，可单测）。
 *
 * 只要**至少一个**窗口有效就返回（旧实现要求恰好 ≥3，任一窗口缺失或状态非 ok
 * 就整条失败）；`pct` 保留原值不截断，>100 交给客户端渲染成「超限」。
 */
/** 窗口原始值 → QuotaWindow（pct 原样保留，>100 交给客户端显示「超限」）。 */
function rawToWindow(w: GoWindowRaw, key: string, label: string): QuotaWindow {
  const win: QuotaWindow = {
    key,
    label,
    pct: w.pct,
    used: w.used,
    limit: w.limit,
    resetInSec: w.resetInSec,
  };
  if (w.status) win.status = w.status;
  return win;
}

/**
 * /go 页解析结果（四态，调用方据此决定卡片形态）：
 *
 *  - `ok`       有生效中的额度窗口 —— **即使某个窗口已耗尽/被限流也属于此态**，
 *               滚动进度条必须照常显示（这是本函数的首要契约）；
 *  - `inactive` 窗口对象存在但额度全为 0（订阅已结束/未生效），不是解析失败；
 *  - `none`     页面根本没有窗口对象 —— 纯 Zen 按量账号；
 *  - `broken`   页面有窗口键名+对象，但字段认不出 —— 平台改版，需显式报错，
 *               绝不能静默退化成「Zen 余额 0」（那会让进度条凭空消失且无人知晓）。
 */
export type GoQuotaState =
  | { kind: 'ok'; windows: QuotaWindow[]; plan: string | null }
  | { kind: 'inactive'; windows: QuotaWindow[]; plan: string | null }
  | { kind: 'none' }
  | { kind: 'broken' };

function goPlan(html: string): string | null {
  const pm = /subscriptionPlan:([A-Za-z0-9_]+|null)/.exec(html);
  return pm && pm[1] !== 'null' ? (pm[1] as string) : null;
}

/**
 * 从 /go 页 html 解析额度窗口（纯函数，可单测）。
 *
 * 判据优先级：按键名 → 顺序兜底 → 有无窗口对象（区分 none / broken）。
 * 旧实现要求恰好 ≥3 个且 status 硬编码为 `"ok"`，任一窗口限流（如
 * `monthlyUsage:{status:"rate-limited",…}`）就整条失败并静默降级成 Zen。
 */
export function parseGoQuotaFull(html: string): GoQuotaState {
  const h = html || '';
  // 1) 按键名解析（不依赖出现顺序，某窗口整块缺失也不会错配）
  let windows: QuotaWindow[] = [];
  for (const [srcKey, key, label] of GO_WINDOW_DEFS) {
    const w = parseGoWindow(h, srcKey);
    if (w) windows.push(rawToWindow(w, key, label));
  }
  // 2) 键名改版兜底：按出现顺序扫全部窗口对象，位置映射到已知标签
  if (!windows.length) {
    windows = scanGoWindowsGeneric(h)
      .slice(0, 3)
      .map((w, i) => {
        const def = GO_WINDOW_DEFS[i] as [string, string, string];
        return rawToWindow(w, def[1], def[2]);
      });
  }
  const plan = goPlan(h);
  // 3) 有额度的窗口 → ok（耗尽/限流的窗口同样算「有」，必须显示）
  const active = windows.filter((w) => w.limit > 0);
  if (active.length) return { kind: 'ok', windows: active, plan };
  if (windows.length) return { kind: 'inactive', windows, plan };
  // 4) 无窗口对象：有键名+花括号说明字段认不出（改版），否则是纯 Zen
  if (/(?:rolling|weekly|monthly)Usage:\s*(?:\$?[\w$]+\[\d+\]=\s*)?\{/.test(h)) return { kind: 'broken' };
  return { kind: 'none' };
}

/**
 * 兼容入口：仅返回「有额度」的窗口（inactive/broken/none 一律 null）。
 * 需要区分后三态请直接用 `parseGoQuotaFull`。
 */
export function parseGoQuota(html: string): { windows: QuotaWindow[]; plan: string | null } | null {
  const r = parseGoQuotaFull(html);
  return r.kind === 'ok' ? { windows: r.windows, plan: r.plan } : null;
}

/**
 * 合并解析双页 → 渲染数据（纯函数，可单测）。
 */
export function parseOpencodePages(
  goHtml: string,
  billingHtml: string,
  opts?: { lowWarn?: unknown; currency?: string },
): {
  billingKind: 'rolling' | 'payg';
  windows?: QuotaWindow[];
  billing: Record<string, unknown>;
  extra?: Record<string, unknown> | null;
} | null {
  const gq = parseGoQuotaFull(goHtml || '');
  const sub = parseSubscription(goHtml || '', billingHtml || '');
  const balance = billingAmount(inlineVal(billingHtml || '', 'balance'));
  const optsEff = opts || {};
  // 有窗口键名+对象却认不出字段 → 平台改版，必须显式报错，绝不静默退化成 Zen
  if (gq.kind === 'broken') {
    throw new ProviderError(
      'parse',
      'opencode /go 页含额度窗口但字段无法识别（页面可能已改版），请把该页字段样例反馈给维护者',
      { hint: '检测到订阅窗口数据，但字段格式变了，插件暂时读不出来。', retriable: false },
    );
  }
  // 契约：只要有生效中的额度窗口就显示滚动进度条 —— 单个窗口耗尽/被限流
  // （如 monthly 100% + rate-limited）不影响其余窗口与本卡形态。
  const q = gq.kind === 'ok' ? gq : null;
  const subInactive = gq.kind === 'inactive';
  if (q) {
    const billing: Record<string, unknown> = { balance, plan: (sub && sub.plan) || q.plan || 'Opencode' };
    const extra: Record<string, unknown> = {};
    if (sub && (sub.note || sub.plan)) {
      const monthly = q.windows.filter((w) => w.key === 'monthly')[0];
      const renewIn = monthly && monthly.resetInSec > 0 ? monthly.resetInSec : null;
      (extra as { blocks?: unknown[] }).blocks = [
        {
          kind: 'note',
          tone: 'info',
          text:
            '订阅 ' +
            sub.plan +
            (sub.note ? ' · ' + sub.note : '') +
            (renewIn !== null ? ' · 每月窗口约 ' + fmtLeftCn(renewIn) + '后重置' : ''),
        },
      ];
    }
    if (balance !== null && balance !== undefined) {
      (extra as { stats?: unknown[] }).stats = [{ label: '充值余额', value: String(balance) }];
    }
    return {
      billingKind: 'rolling',
      windows: q.windows,
      billing,
      extra: (extra as { blocks?: unknown }).blocks || (extra as { stats?: unknown }).stats ? extra : null,
    };
  }
  if (balance !== null && balance !== undefined) {
    const currency = optsEff.currency || 'USD';
    // inactive：页面有窗口对象但额度全为 0（订阅已结束/未生效）。
    // 这与「纯 Zen 账号」不是一回事，必须说清楚，不能笼统显示成 Opencode Zen。
    const notes: Array<{ kind: string; tone: string; text: string }> = [];
    if (subInactive) {
      notes.push({
        kind: 'note',
        tone: 'warn',
        text:
          '未检测到生效中的额度窗口（订阅可能已结束或未生效）' +
          (sub && sub.plan ? '（页面标识：' + sub.plan + '）' : '') +
          '，当前按余额计费：请到平台确认订阅状态。',
      });
    } else if (sub) {
      notes.push({
        kind: 'note',
        tone: 'info',
        text: '订阅 ' + sub.plan + (sub.note ? ' · ' + sub.note : ''),
      });
    }
    return {
      billingKind: 'payg',
      billing: {
        balance: numStr(balance),
        currency,
        granted: null,
        toppedUp: null,
        isAvailable: balance > 0 ? true : null,
        infos: [],
        lowWarn:
          optsEff.lowWarn !== undefined && optsEff.lowWarn !== '' && optsEff.lowWarn !== null
            ? Number(optsEff.lowWarn)
            : null,
        plan: subInactive ? 'Opencode 订阅未生效' : 'Opencode Zen',
      },
      extra: notes.length ? { blocks: notes } : null,
    };
  }
  return null;
}

const opencode: ProviderAdapter = {
  type: 'opencode',
  icon: 'opencode',
  label: 'OC',
  title: 'opencode（Go+Zen 合并）',
  secretField: 'cookie',
  hint: '官方渠道合并版：同一 workspace+cookie 同时拉 /go（三窗口+订阅）与 /billing（余额）。旧 opencode-go / opencode-zen 配置自动迁移。',
  fields: [
    {
      key: 'workspaceId',
      label: 'workspaceId *',
      kind: 'text',
      mono: true,
      required: true,
      placeholder: '如：wrk_xxx',
      hint: '工作区 ID：浏览器打开 opencode.ai 并进入你的工作区，地址栏 workspace/ 后面的 wrk_ 开头字符串（Go 与 Zen 页面通用）。',
    },
    {
      key: 'cookie',
      label: 'cookie *',
      kind: 'secret',
      mono: true,
      required: true,
      placeholder: '填 $NAME 引用（推荐）或粘贴 Cookie',
      hint: '登录态：浏览器开发者工具 → Application → Cookies → 复制 auth 的值；整段 Cookie（含 oc_locale 等）原样粘贴亦可。建议先存入系统凭据再填 $NAME。',
    },
    {
      key: 'lowWarn',
      label: '低余额预警线',
      kind: 'number',
      placeholder: '如：10',
      hint: '余额低于此值时侧边栏黄色提醒（USD，按量模式才生效）。',
    },
    {
      key: 'currency',
      label: '优先币种',
      kind: 'text',
      mono: true,
      placeholder: '默认 USD',
      hint: '按量余额展示币种（页面未声明币种，默认按 USD）。',
    },
  ],

  sanitizeParams: sanitizeCookieParams,
  readSecret: (params: Record<string, unknown>): unknown => effectiveCookie(params),
  maskParams: maskCookieParams,

  validateParams(params: Record<string, unknown>): string {
    const wid =
      params && params['workspaceId'] !== undefined && params['workspaceId'] !== null
        ? String(params['workspaceId'])
        : '';
    if (!WORKSPACE_RE.test(wid)) return 'workspaceId 非法';
    return '';
  },

  async fetch(vendor: Vendor, deps: ProviderDeps) {
    const params = (vendor && vendor.params) || {};
    const wid = (params['workspaceId'] as string) || '';
    if (!WORKSPACE_RE.test(String(wid)))
      throw new ProviderError(
        'config',
        'workspaceId 非法（4~64 位字母/数字/下划线，如 wrk_xxx，见字段说明）',
        { hint: 'workspaceId 没填或格式不对，插件无法拼出额度页地址。', retriable: false },
      );
    const r = await deps.resolveSecret(effectiveCookie(params));
    if (!r.value)
      throw new ProviderError(
        'config',
        'cookie 未配置：当前为' + r.kind + '，请在设置页填写 Cookie 或检查 $NAME 引用（获取方式见字段说明）',
        { hint: '缺少登录态 Cookie，插件无法读取额度页。', retriable: false },
      );
    const fetchImpl = (deps && deps.fetchImpl) || fetch;
    const base = 'https://opencode.ai/workspace/' + wid;
    const header = { Cookie: toCookieHeader(r.value), Accept: 'text/html' };
    const [goRes, billingRes] = await Promise.all([
      fetchImpl(base + GO_PATH, { headers: header, cache: 'no-store' }).catch(() => null),
      fetchImpl(base + BILLING_PATH, { headers: header, cache: 'no-store' }).catch(() => null),
    ]);
    let goHtml = '';
    let billingHtml = '';
    if (goRes) goHtml = await goRes.text().catch(() => '');
    if (billingRes) billingHtml = await billingRes.text().catch(() => '');
    const goHasQuota = /(rolling|weekly|monthly)Usage:/.test(goHtml) || goHtml.indexOf('usagePercent') !== -1;
    if (!goHasQuota && billingHtml.indexOf('balance') === -1) {
      throw new ProviderError(
        'session',
        '登录失效或被风控（/go ' + goHtml.length + 'B · /billing ' + billingHtml.length + 'B 均无数据）',
        {
          hint: '两页都没返回额度数据：Cookie 已过期，或请求被平台风控拦截。重新登录并更新 Cookie 即可。',
          action: 'opencode.ai 重新登录 → 复制新 Cookie → 设置页「编辑」',
        },
      );
    }
    let data;
    try {
      data = parseOpencodePages(goHtml, billingHtml, {
        lowWarn: params['lowWarn'],
        currency: params['currency'] as string,
      });
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError('parse', (e as Error)?.message || '页面解析失败', { cause: e });
    }
    if (!data)
      throw new ProviderError(
        'parse',
        '页面结构变化，解析失败（无窗口且无余额字段），请把两页顶层键名发给维护者',
        { hint: 'opencode 页面结构可能已改版，需要插件跟进适配。' },
      );
    void isObj;
    return { ...data, secretKind: r.kind, via: '官方渠道' };
  },
};

export default opencode;
