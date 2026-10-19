/**
 * Client 半共享类型（设置页 + 侧边栏）
 * 与 Host 的 /ext/dshp-token-meter/* 路由协议对齐
 *
 * 合并来源：
 *  - quota：client.js 的 state/config/snaps/providers 协议
 *  - stats：client.js 的 data/state/config 协议
 *
 * 这里只建模**官方类型没覆盖**的东西：路由协议、领域模型，以及 `ClientContext` /
 * `SlotsService` 这两个「只用到哪几个成员就写哪几个」的服务接缝。官方组件的 props 类型直接从
 * `@deepseek-ai/dsh-client-ui-primitives` import，不再有 `AnyReact` / `AnyPrimitives` / `DshRequire`
 * 那套 shim——它们等于把整个前端退化成 `any`。
 */
import type { ReactNode } from 'react';

export interface QuotaWindow {
  key: string;
  label: string;
  pct: number;
  used: number;
  limit: number;
  resetInSec: number;
  /** 上游窗口状态原值（非 `ok` = 已限流/停用，UI 需显式提示） */
  status?: string;
}

export interface QuotaBilling {
  balance?: number;
  currency?: string;
  granted?: number | null;
  toppedUp?: number | null;
  isAvailable?: boolean | null;
  infos?: Array<{ currency: string; total: number; granted: number | null; toppedUp: number | null }>;
  lowWarn?: number | null;
  plan?: string;
}

/**
 * 分段/占比条的语义色调。
 *
 * 颜色**一律由主题 token 决定**（`brand` = 主题强调色、`ok`/`warn`/`bad` = 安全/警告/危险、
 * `info` = 业务信息色、`muted` = 弱化），供应商只声明「这一段是什么语义」，
 * 不写死色值 —— 换主题时整条比例条跟着换。
 */
export type SegmentTone = 'brand' | 'ok' | 'warn' | 'bad' | 'info' | 'muted';

export interface ProviderBlock {
  kind: 'kv' | 'progress' | 'split' | 'note';
  label?: string;
  value?: string;
  used?: number;
  total?: number;
  left?: string;
  segments?: Array<{
    label: string;
    value: number;
    /** 语义色调（跟随主题 token）；旧适配器可继续给 `color` 写死色值 */ tone?: SegmentTone;
    color?: string;
  }>;
  text?: string;
  tone?: 'info' | 'warn' | 'bad';
}

export interface ProviderExtra {
  stats?: Array<{ label: string; value: string }>;
  chart?: { title: string; labels: string[]; values: number[] };
  blocks?: ProviderBlock[];
}

/**
 * provider 视图区块（与 host/types.ts 对齐）。
 * 供应商自描述「自己的数据 + 排版」，客户端按 kind 分发渲染 —— 无需认识具体供应商。
 * 未知 kind / 字段缺失一律跳过（前向兼容：老客户端遇到新 provider 不崩）。
 */
export interface ProviderSection {
  kind: 'windows' | 'balance' | 'metrics' | 'progress' | 'split' | 'note' | 'chart';
  key?: string;
  title?: string;
  windows?: QuotaWindow[];
  billing?: QuotaBilling;
  items?: Array<{ label: string; value: string }>;
  progress?: { label?: string; used: number; total: number; left?: string };
  split?: { segments: Array<{ label: string; value: number; tone?: SegmentTone; color?: string }> };
  note?: { text: string; tone?: 'info' | 'warn' | 'bad' };
  chart?: { title?: string; labels: string[]; values: number[] };
}

export interface ProviderView {
  sections: ProviderSection[];
}

/** 失败原因分类（与 host/errors.ts 对齐） */
export type ErrorKind =
  'auth' | 'session' | 'plan' | 'balance' | 'rate' | 'network' | 'parse' | 'config' | 'server' | 'unknown';

export type ErrorTone = 'bad' | 'warn' | 'info';

/** 结构化失败信息：标题/解释/去哪改/排查步骤/严重度（客户端只负责渲染） */
export interface ErrorInfo {
  kind: ErrorKind;
  title: string;
  hint: string;
  action?: string;
  steps: string[];
  detail: string;
  status?: number;
  docs?: string;
  retriable: boolean;
  tone: ErrorTone;
}

export interface VendorSnapshot {
  vendorId: string;
  vendorName: string;
  ok: boolean;
  at: string;
  fetchedAtMs: number;
  billingKind?: 'rolling' | 'payg';
  windows?: QuotaWindow[];
  billing?: QuotaBilling;
  /** 供应商自描述视图（分层渲染第 2 层；无则走 legacy 兜底） */
  view?: ProviderView | null;
  secretKind?: string;
  extra?: ProviderExtra | null;
  via?: string;
  /** 失败原始文案 */
  error?: string;
  /** 失败结构化信息（友好提示与详情） */
  errorInfo?: ErrorInfo;
}

export interface ProviderField {
  key: string;
  label: string;
  kind: 'text' | 'secret' | 'number' | 'select';
  mono?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  showWhen?: { key: string; eq: string };
  hint?: string;
}

export interface ProviderMeta {
  type: string;
  label: string;
  title: string;
  secretField: string;
  hint: string;
  /** 供应商图标名（Host 声明；缺省 = 客户端按 type 兜底）。 */
  icon?: string;
  fields: ProviderField[];
  /** 新增供应商时的 params 初始值（provider 自声明；缺省 {}） */
  defaultParams?: Record<string, unknown>;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  params: Record<string, unknown>;
  secretKind?: string;
  /** 余额查询开关：false = 不参与 Host 定时拉取（手动拉取不受影响）；缺省 = 启用 */
  enabled?: boolean;
}

export type DefaultRange = '7' | '30' | '90' | 'all';

export interface TokenMeterConfig {
  version: number;
  activeVendor: string;
  refreshSec: number;
  enabled: boolean;
  vendors: Vendor[];
  showToday: boolean;
  defaultRange: DefaultRange;
  /** 在线时长空闲阈值（分钟，1/5/15/30/60；缺省 5） */
  onlineGapMin: number;
}

export interface QuotaStateResponse {
  ok: boolean;
  namespace?: string;
  docPath?: string;
  config?: TokenMeterConfig;
  snaps?: Record<string, VendorSnapshot>;
  providers?: ProviderMeta[];
  providerTypes?: string[];
  error?: string;
}

export interface StatsRecord {
  d: string;
  h: number;
  m: string;
  i: number;
  o: number;
  cr: number;
  cw: number;
  n: number;
}

export interface StatsOnlineDay {
  d: string;
  sessions: number;
  tokens: number;
  turnMs: number;
  byGap: Record<string, number>;
  segByGap: Record<string, number>;
  llmMs: number;
  toolMs: number;
}

export interface StatsOnline {
  defaultGapMin: number;
  gaps: number[];
  totalMs: Record<string, number>;
  segments: Record<string, number>;
  turnMs: number;
  llmMs: number;
  toolMs: number;
  activeDays: number;
  firstDay: string | null;
  lastDay: string | null;
  days: StatsOnlineDay[];
}

export interface StatsSnapshot {
  ready: boolean;
  records: StatsRecord[];
  models: Record<string, { provider: string; model: string }>;
  daySessions: Record<string, number>;
  peakStep: { tokens: number; d: string; model: string } | null;
  range: { first: string; last: string } | null;
  sessions: number;
  active: number;
  partial: boolean;
  scanned: number;
  total: number;
  errors: number;
  /** 扫描失败原因样本（最多 5 条） */
  errorSamples?: Array<{ id: string; message: string }>;
  /** 靠直读日志兜底拿到的会话数 */
  directReads?: number;
  /** 会话结局分类计数 */
  sessionOutcomes?: Record<string, number>;
  /** 命中持久化缓存（未读日志）的会话数 */
  cacheHits?: number;
  /** 完全没读日志的会话数（缓存 + 进程内复用） */
  reused?: number;
  storage: string;
  generatedAt: number;
  /** 在线时长估算（老 Host 无此字段 → 面板自行降级提示） */
  online?: StatsOnline;
  error?: string;
}

/** `POST /ext/dshp-token-meter/config` 的请求体（只允许这几项）。 */
export type ConfigPatch = Partial<
  Pick<
    TokenMeterConfig,
    'enabled' | 'showToday' | 'defaultRange' | 'refreshSec' | 'activeVendor' | 'onlineGapMin'
  >
>;

/**
 * client 侧 cordis 上下文（本插件只用到这两个成员）。
 *
 * 不 import `@deepseek-ai/cordis` 的类型：client 半在 cordis 服务表面前是普通模块，`ctx` 由 shell
 * 的模块系统注入，把整包 cordis 拉进 devDependencies 只为两个方法并不划算。
 */
export interface ClientContext {
  /**
   * 取一个 cordis 服务；服务还没挂载时返回 `undefined`。
   *
   * @param name - 服务名。
   */
  get(name: string): unknown;
  /**
   * 注册一个随本插件一起收回的副作用。
   *
   * @param callback - 返回清理函数（或任意值）的回调。
   * @param label - 诊断用标签。
   */
  effect(callback: () => unknown, label?: string): unknown;
  /**
   * 在「依赖就绪」的作用域里跑一段逻辑（cordis `ctx.inject(deps, cb)`）。
   *
   * **可选依赖必须用它**：写成 client 半顶层的 `inject: ['widgets']` 会让整个插件在
   * 没装 / 停用了 `@dshp/widget-kit` 时整体不激活（连额度面板都不见了），
   * 而 `ctx.inject` 只是让这段回调等着 —— 服务来了才跑，服务走了作用域随之销毁。
   *
   * @param deps - 依赖的服务名。
   * @param callback - 依赖就绪时的回调（拿到的是作用域 ctx）。
   */
  inject(deps: string[], callback: (scope: ClientContext) => unknown): unknown;
}

/**
 * slots 服务（本插件只用 inject + register）。
 *
 * 只建模用到的两个成员。逐槽位的 props 检查要靠 `SlotMap` 声明合并（由 settings / conversation /
 * shell 各自的 UI 包 merge 进来），那是下一步。
 */
export interface SlotsService {
  /**
   * 等某个槽位被声明后再执行注册回调（**异步**：回调可能在槽位声明时才被调用）。
   *
   * @param name - 槽位名。
   * @param fn - 注册逻辑；返回 generator 时，逐条注册会在槽位就绪后依次展开。
   */
  inject(name: string, fn: () => unknown): unknown;
  /**
   * 注册一个槽位条目。
   *
   * @param spec - 注册选项（list 槽位用 `id` + `order`）。
   * @param component - 组件（props = 槽位 owner props + `inject()` 的产出）。
   * @typeParam P - 该槽位的 props（list 槽位是 owner props，本插件只注册 `{ wide }` 那一个）。
   * @returns 卸载该条注册的 disposer。
   */
  register<P>(spec: SlotRegistrationSpec, component: (props: P) => ReactNode): unknown;
}

/** 槽位注册选项（本插件注册的三个都是 list 槽位，故只需要 id + order + label）。 */
export interface SlotRegistrationSpec {
  name: string;
  /** list 槽位的条目 id。 */
  id?: string | undefined;
  /** list 槽位的排序。 */
  order?: number | undefined;
  /** 导航 / tab 上显示的标题。 */
  label?: string | undefined;
}
