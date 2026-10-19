/**
 * @dshp/token-meter —— 拉取失败的结构化分类与处置指引
 *
 * 目标：把「一句原始错误」升级成「用户看得懂、知道去哪改」的结构化信息。
 * 供应商拉取失败的原因高度集中——API Key 失效、Cookie/会话过期、订阅到期或
 * 计划不支持、余额不足、限流、网络不通、接口改版、配置不全——每一类都对应
 * 不同的处置动作。本模块负责：
 *
 *  1. 适配器抛 `ProviderError(kind, …)` 显式声明原因（首选）；
 *  2. 老适配器/未知错误按文案正则兜底归类（`classifyMessage`）；
 *  3. 统一补齐「标题 + 说明 + 去哪改 + 排查步骤 + 严重度」，下发客户端直接渲染。
 *
 * 客户端因此不需要认识任何供应商，也不需要写业务判断——只按 `kind` 上色、
 * 按字段渲染（与 provider 分层渲染同一思路）。
 */

/** 失败原因分类。 */
import { DISPLAY_NAME } from '../name.js';

export type ErrorKind =
  | 'auth' // 密钥无效/被撤销/复制不全
  | 'session' // 网页登录态、Cookie/Bearer 票据过期
  | 'plan' // 订阅到期、被取消、扣款失败、计划不含该能力
  | 'balance' // 余额不足
  | 'rate' // 限流
  | 'network' // DNS/代理/超时等没到达平台
  | 'parse' // 请求成功但结构与预期不符（接口改版）
  | 'config' // 凭据/参数没配全
  | 'server' // 上游 5xx
  | 'unknown';

/** 客户端渲染用的严重度（红/黄/蓝）。 */
export type ErrorTone = 'bad' | 'warn' | 'info';

/** 结构化失败信息（纯 JSON，可随快照下发）。 */
export interface ErrorInfo {
  kind: ErrorKind;
  /** 一句话结论，如「密钥无效或已失效」 */
  title: string;
  /** 人话解释：为什么会这样 */
  hint: string;
  /** 该去哪改（设置页路径 / 平台动作），可为空 */
  action?: string;
  /** 排查步骤（有序清单） */
  steps: string[];
  /** 原始错误文案（详情展开区展示，便于反馈维护者） */
  detail: string;
  /** 上游 HTTP 状态码（有则带） */
  status?: number;
  /** 参考文档链接（有则带） */
  docs?: string;
  /** 重试是否有意义（否 = 先改配置/续订再看） */
  retriable: boolean;
  tone: ErrorTone;
}

export interface ProviderErrorOptions {
  status?: number;
  hint?: string;
  action?: string;
  docs?: string;
  steps?: string[];
  retriable?: boolean;
  /** 原始错误（保留错误链，便于排查） */
  cause?: unknown;
}

/**
 * 适配器显式抛出的失败（首选路径）。
 * 带 `kind` 就不依赖文案正则，供应商改文案也不会把分类搞错。
 */
export class ProviderError extends Error {
  readonly kind: ErrorKind;
  readonly hint?: string;
  readonly action?: string;
  readonly docs?: string;
  readonly steps?: string[];
  readonly status?: number;
  /** 未显式指定时留 undefined，交给分类默认值（避免覆盖 auth/session 的不可重试语义） */
  readonly retriable?: boolean;

  constructor(kind: ErrorKind, message: string, opts?: ProviderErrorOptions) {
    super(message, opts && 'cause' in opts ? { cause: opts.cause } : undefined);
    this.name = 'ProviderError';
    this.kind = kind;
    const o = opts || {};
    if (o.hint) this.hint = o.hint;
    if (o.action) this.action = o.action;
    if (o.docs) this.docs = o.docs;
    if (Array.isArray(o.steps) && o.steps.length) this.steps = o.steps;
    if (typeof o.status === 'number') this.status = o.status;
    if (typeof o.retriable === 'boolean') this.retriable = o.retriable;
  }
}

/** 各分类的默认落地文案（标题/解释/去哪改/严重度/可重试）。 */
const GUIDANCE: Record<
  ErrorKind,
  { title: string; hint: string; action: string; tone: ErrorTone; retriable: boolean }
> = {
  auth: {
    title: '密钥无效或已失效',
    hint: '平台拒绝了这把密钥：可能已被删除、轮换，或复制时缺了字符。换成有效的密钥即可恢复。',
    action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
    tone: 'bad',
    retriable: false,
  },
  session: {
    title: '登录状态已过期',
    hint: '网页会话票据（Cookie / Bearer）已失效，平台认为你没登录。重新抓取最新值覆盖即可。',
    action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
    tone: 'bad',
    retriable: false,
  },
  plan: {
    title: '订阅已到期或计划不支持',
    hint: '该账号当前计划无法使用此接口，或订阅已结束、扣款失败。续订/升级后再刷新即可。',
    action: '前往平台确认订阅与支付状态',
    tone: 'bad',
    retriable: false,
  },
  balance: {
    title: '余额不足',
    hint: '账户余额不足以继续调用，平台已拒绝提供服务。',
    action: '前往平台充值',
    tone: 'bad',
    retriable: false,
  },
  rate: {
    title: '请求过于频繁（被限流）',
    hint: '短时间内请求过多，平台临时限制。稍后重试即可，无需改配置。',
    action: '稍等 1–5 分钟后点「刷新」',
    tone: 'warn',
    retriable: true,
  },
  network: {
    title: '网络不可达',
    hint: '请求没能到达平台（DNS 解析失败、代理不通或超时）。本地网络问题解决后即恢复。',
    action: '检查网络 / 代理设置',
    tone: 'warn',
    retriable: true,
  },
  parse: {
    title: '接口返回结构异常',
    hint: '请求成功但返回内容与预期不符，通常是平台接口改版。需要插件跟进适配。',
    action: '把下方「原始信息」反馈给插件维护者',
    tone: 'warn',
    retriable: false,
  },
  config: {
    title: '供应商配置不完整',
    hint: '还缺少必要的凭据或参数，插件无法发起请求。',
    action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
    tone: 'warn',
    retriable: false,
  },
  server: {
    title: '上游服务异常',
    hint: '平台返回了服务端错误（5xx），通常是对方临时故障，与你的配置无关。',
    action: '稍后点「刷新」重试',
    tone: 'warn',
    retriable: true,
  },
  unknown: {
    title: '拉取失败',
    hint: '本次拉取没有成功，具体原因见下方「原始信息」。',
    action: '点「刷新」重试',
    tone: 'warn',
    retriable: true,
  },
};

/** 各分类的排查步骤（客户端「详情」区展示）。 */
const STEPS: Record<ErrorKind, string[]> = {
  auth: [
    '打开设置页 → ' + DISPLAY_NAME + ' → 找到该供应商 →「编辑」',
    '到平台重新生成密钥并粘贴进来（推荐点「存凭据」转成 $NAME 引用）',
    '若字段里填的是 $NAME：先更新对应的凭据或环境变量，改完重启 dsh web',
    '保存后点「刷新」验证',
  ],
  session: [
    '浏览器重新登录对应平台（确认登录态确实有效）',
    '开发者工具 → Network → 找到对应请求，复制最新的 Cookie / Bearer 票据',
    '回到设置页该供应商，粘贴新值并保存',
    '点「刷新」验证；票据过期属正常现象，失效后重复本流程',
  ],
  plan: [
    '登录平台查看订阅是否已到期、被取消或扣款失败',
    '续订或升级到包含该接口的计划',
    '若刚续订：等 1–2 分钟后点「刷新」（状态同步有延迟）',
    '确认当前计划确实提供额度查询能力（部分低价档位不含 API 访问）',
  ],
  balance: [
    '前往平台充值',
    '充值后点「刷新」（到账通常几分钟内同步）',
    '也可调低「低余额预警线」以便更早收到提醒',
  ],
  rate: [
    '等待 1–5 分钟',
    '点「刷新」重试',
    '若频繁触发：把「自动刷新」间隔调大，或对该供应商点「禁用」退出定时拉取',
  ],
  network: [
    '确认本机能访问该平台（浏览器直接打开平台首页试试）',
    '检查代理/VPN/防火墙设置；需要代理时配置好环境变量后重启 dsh web',
    '确认 DNS 正常（能解析平台域名）',
    '排除后点「刷新」重试',
  ],
  parse: [
    '先点一次「刷新」，排除偶发的网关错误页',
    '若持续失败：平台接口大概率已改版，需要插件适配',
    '把下方「原始信息」连同插件版本一起反馈给维护者',
    '确认插件与 DSH 都已更新到最新版本',
  ],
  config: [
    '打开设置页 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」',
    '补齐标 * 的必填字段',
    '若用 $NAME 引用：确认凭据或环境变量里确实有这个键（$ 引用读不到会直接报错）',
    '保存后点「刷新」验证',
  ],
  server: ['稍等几分钟', '点「刷新」重试', '若长时间 5xx：多为平台故障，可到平台状态页确认'],
  unknown: ['点「刷新」重试一次', '若持续失败，把下方「原始信息」反馈给插件维护者'],
};

/** 分类兜底：按错误文案正则识别（适配器未显式抛 ProviderError 时用）。 */
export function classifyMessage(raw: string): ErrorKind {
  const m = String(raw || '');
  if (!m) return 'unknown';
  // 顺序敏感：先判更具体的语义，再落到宽泛的 HTTP 码
  if (/未配置|凭据未配置|必填|参数非法|workspaceId 非法|ID 非法|引用语法错误/.test(m)) return 'config';
  if (
    /会话失效|会话已过期|登录失效|登录态|被风控|logged out|refresh and login|票据.*(过期|失效)|未登录/i.test(
      m,
    ) ||
    // 网页接口在 HTTP 200 + 错误信封里报的会话问题（实测 40003 "Authorization Failed (invalid token)"）
    /invalid\s*token|authorization\s*failed|token.{0,12}(expired|invalid|失效|过期)/i.test(m)
  )
    return 'session';
  if (/密钥无效|密钥已失效|密钥引用.*为空|凭据无效|Invalid 'Authorization'|invalid.{0,12}api.?key/i.test(m))
    return 'auth';
  if (
    /upgrade_required|订阅.*(到期|结束|失败|取消)|计划.*(不含|不支持|已到期)|plan.{0,12}(expired|ended|cancel)/i.test(
      m,
    )
  )
    return 'plan';
  if (/余额不足|insufficient|402/.test(m)) return 'balance';
  if (/限流|429|rate.?limit|too many request/i.test(m)) return 'rate';
  if (
    /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|socket hang up|network|超时|timeout|proxy/i.test(
      m,
    )
  )
    return 'network';
  if (/非 JSON|结构异常|字段缺失|解析失败|改版|非数字|未命中|顶层非对象/.test(m)) return 'parse';
  if (/\bHTTP 5\d\d\b|\b5\d\d\b.*(Bad Gateway|Service Unavailable|Internal)/.test(m)) return 'server';
  if (/\b401\b|\b403\b/.test(m)) return 'auth';
  return 'unknown';
}

/** 从错误里尽力取 HTTP 状态码（ProviderError.status 优先，其次文案里的 4xx/5xx）。 */
function statusOf(e: unknown, kind: ErrorKind): number | undefined {
  if (e instanceof ProviderError && typeof e.status === 'number') return e.status;
  const m = String((e as Error)?.message ?? '');
  const hit = m.match(/\b(4\d\d|5\d\d)\b/);
  if (hit) return Number(hit[1]);
  if (kind === 'auth') return 401;
  return undefined;
}

/**
 * 任意错误 → 结构化 ErrorInfo（永远不抛，分类失败退化为 unknown）。
 *
 * @param ctx.vendorName 供应商显示名（写进 detail 便于贴给维护者）
 * @param ctx.type       供应商 type（区分提示语用）
 */
export function toErrorInfo(
  e: unknown,
  ctx?: { vendorName?: string; type?: string; secretKind?: string },
): ErrorInfo {
  const message =
    (e instanceof Error ? e.message : typeof e === 'string' ? e : '') || '拉取失败（未提供错误信息）';
  const explicit = e instanceof ProviderError ? e : null;
  const kind: ErrorKind = explicit ? explicit.kind : classifyMessage(message);
  const g = GUIDANCE[kind];
  const steps = (explicit && explicit.steps) || STEPS[kind];
  const status = statusOf(e, kind);
  const info: ErrorInfo = {
    kind,
    title: g.title,
    hint: explicit?.hint || g.hint,
    action: explicit?.action || g.action,
    steps: steps.slice(0, 6),
    detail: message,
    // 显式声明优先；未声明则用分类默认（auth/session/plan/balance = 先改配置再重试）
    retriable: explicit?.retriable ?? g.retriable,
    tone: g.tone,
  };
  if (status !== undefined) info.status = status;
  const docs = explicit?.docs;
  if (docs) info.docs = docs;
  // 凭据形态备注：$NAME 引用没配好 vs 明文失效，两者的处置动作不同
  if (ctx && ctx.secretKind && (kind === 'auth' || kind === 'session')) {
    const isRef = ctx.secretKind === 'ref';
    const prefix =
      kind === 'auth'
        ? isRef
          ? '字段填的是 $NAME 引用：请先确认凭据/环境变量里该键存在且是最新值（改完需重启 dsh web）。'
          : '字段填的是明文：请到平台重新生成后粘贴新值。'
        : isRef
          ? '字段填的是 $NAME 引用：更新凭据/环境变量后需重启 dsh web 才生效，随后点「已处理，验证」。'
          : '当前为手动粘贴的明文凭据：过期属正常现象，重新登录抓取后再粘贴即可。';
    info.hint = prefix + info.hint;
  }
  return info;
}

/** 客户端兜底用：老 Host 只下发字符串时，至少给出结论与原始信息。 */
export function fallbackErrorInfo(message: string): ErrorInfo {
  return toErrorInfo(new Error(message || '拉取失败'));
}
