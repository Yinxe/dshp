/**
 * @dshp/search-provider —— 共享类型定义（Host 半）
 *
 * DSH 运行时（Cordis ctx / web / settings / webServer）暂无官方 npm 类型包，Host 侧统一用
 * `AnyCtx`（= any 的别名）透传运行时对象，仅对本插件自有的数据结构做严格建模。
 *
 * web seam 契约（WebSearchRequest / WebSearchResult / WebSearchSource）按
 * `@deepseek-ai/dsh-web` 的公开形态结构化复刻 —— 运行时零依赖，故不 import 该包，
 * 而是让本文件的接口与其保持结构兼容（多返回字段会破坏 seam 契约，只允许这三者）。
 *
 * 合并来源：~/.dsh/plugins/dsh-tavily-search（JS，@dshp-inx/tavily-search v2.0.3）
 * 本文件为 TS 重写 + 多供应商抽象新增。
 *
 * @module @dshp/search-provider
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

/** DSH 运行时 ctx —— 暂无官方类型，透传 any */
export type AnyCtx = any;
export type AnySettings = any;

// ── web seam 契约（结构对齐 @deepseek-ai/dsh-web，勿加字段）───────────────────

/** 一次搜索请求：seam 只保证 query 有值，maxResults 为上层边界（可缺省） */
export interface WebSearchRequest {
  readonly query: string;
  readonly maxResults?: number;
}

/** 一条可引用来源：url 必有，其余按供应商能力可选（不编造） */
export interface WebSearchSource {
  readonly url: string;
  readonly title?: string;
  readonly snippet?: string;
  readonly publishedAt?: string;
}

/** 归一化搜索结果：content 为供应商生成的答案文本（可选），truncated 由 seam 设置 */
export interface WebSearchResult {
  readonly content?: string;
  readonly sources: readonly WebSearchSource[];
  readonly truncated: boolean;
}

/** 注册给 ctx.web.registerSearchProvider 的提供方（seam 契约） */
export interface WebSearchProviderLike {
  readonly id: string;
  available(): boolean;
  search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}

// ── 设置页控件元数据（下发给 Client 渲染，纯 JSON）────────────────────────────

export interface ProviderFieldOption {
  value: string;
  label: string;
}

/**
 * 供应商配置字段描述：Client 按 kind 渲染控件并回写 `{ [providerId]: { [key]: value } }`。
 * 新增供应商只需在自己的模块里声明 fields，设置页自动跟随，无需改 client。
 */
export interface ProviderField {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'select';
  options?: ProviderFieldOption[];
  hint?: string;
  mono?: boolean;
  placeholder?: string;
}

// ── 供应商模块契约（扩展唯一入口，见 providers/index.ts）─────────────────────

/** 供应商运行时依赖：配置每次调用现读（settings 热重载即时生效），密钥每次操作现解析 */
export interface ProviderDeps {
  ctx: AnyCtx;
  /** 从 credentials 服务实时解析密钥；未配置返回 undefined */
  resolveKey(credentialRef: string): Promise<string | undefined>;
  /** 当前生效配置全量（含各供应商分节） */
  getConfig(): PluginConfig;
  /** 某供应商分节配置（含默认值合并；未知分节回退默认值） */
  providerConfig(providerId: string): Record<string, unknown>;
  /** 插件级配置写回（供应商专属路由需要持久化时使用） */
  updateConfig(patch: Record<string, unknown>): Promise<void>;
}

/**
 * 一个 AI 搜索供应商实现。
 *
 * 新增供应商三步（其余文件不动）：
 *  1. 复制 `providers/tavily.ts` 为 `providers/<新 id>.ts`，改 id/label/title/credentialRef/
 *     fields/defaultConfig/configSchema/sanitizePatch/snapshot/search/stateExtras；
 *  2. `providers/index.ts` 底部清单加一行 `createXxxModule()`；
 *  3. 重启 `dsh web`（Host 半）—— 设置页状态行/密钥/配置控件自动跟随 `state.providers` 元数据。
 */
export interface SearchProviderModule {
  /** 提供方 id：注册给 ctx.web 的主键，也是 `web.searchProvider` 的取值（不可改） */
  readonly id: string;
  /** 简称（徽章/下拉）：如 'Tavily' */
  readonly label: string;
  /** 设置页标题：如 'Tavily AI 搜索' */
  readonly title: string;
  /** credentials 引用名：如 'TAVILY_API_KEY' */
  readonly credentialRef: string;
  /** 官方文档地址（设置页用量卡片外链） */
  readonly homepage: string;
  /** 一句话说明（设置页状态行描述） */
  readonly description: string;
  /** 配置控件元数据（settings 页渲染用） */
  readonly fields: readonly ProviderField[];
  /** 该供应商分节的默认配置（与 configSchema 默认值同值） */
  readonly defaultConfig: Record<string, unknown>;
  /** 该供应商分节的 schemastery schema（装配层组合进插件 ConfigSchema） */
  readonly configSchema: unknown;
  /** settings 路由补丁校验：非法值抛中文 Error；无合法字段返回 null */
  sanitizePatch(raw: unknown): Record<string, unknown> | null;
  /** 下发给 Client 的配置快照（只取契约字段） */
  snapshot(config: Record<string, unknown>): Record<string, unknown>;
  /** 执行一次搜索（内部自行解析密钥、读取配置、处理取消信号） */
  search(deps: ProviderDeps, request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
  /** 供应商专属路由（可选；内部自行 ctx.effect + try/catch） */
  registerRoutes?(deps: ProviderDeps): void;
  /** state 路由附带的供应商专属元数据（如用量端点/缓存/计费说明） */
  stateExtras(deps: ProviderDeps): Promise<Record<string, unknown>>;
}

// ── 插件配置（profile 条目 `config:`：dshp-search-provider）────────────────

/**
 * 条目 config 的值：`provider` 为设置页聚焦/选型建议，`maxResults` 为
 * 跨供应商通用的默认结果数，其余键为各供应商分节（键名 = provider id）。
 */
export interface PluginConfig {
  /** 期望生效的提供方 id（需与 profile patch 的 web.searchProvider 一致才真正接管） */
  provider: string;
  /** 单次搜索默认返回条数（调用方显式传 maxResults 时以调用方为准） */
  maxResults: number;
  /** 各供应商分节配置（结构由各自模块的 configSchema 决定） */
  [providerId: string]: unknown;
}

/** settings.patch / cordis.patch.yml 里允许的部分覆盖（全部可选） */
export interface PluginConfigPatch {
  provider?: string;
  maxResults?: number;
  [providerId: string]: unknown;
}

/**
 * `apply(ctx, config)` 实参：全字段 volatile（供应商分节整块），`.get()` 读当前深只读快照。
 * 顶层键 = provider / maxResults + 各供应商 id。
 */
export interface VolatileConfig {
  provider: Volatile<string>;
  maxResults: Volatile<number>;
  [providerId: string]: Volatile<unknown>;
}

// ── 同源路由协议（与 client/types.ts 对齐）────────────────────────────────────

/** 单个提供方的状态（设置页状态行/下拉用） */
export interface ProviderStateMeta {
  id: string;
  label: string;
  title: string;
  credentialRef: string;
  homepage: string;
  description: string;
  fields: readonly ProviderField[];
  /** credentials 服务里是否已配置该密钥 */
  configured: boolean;
  /** 密钥来源（credentials 服务描述，配置成功时才有） */
  source?: string;
  /** 是否被 web seam 选中（ctx.web.searchProviderId === id） */
  selected: boolean;
}

export interface StateResponse {
  ok: boolean;
  namespace: string;
  /** web seam 配置固定的提供方 id（profile patch / 环境变量；未固定为 null） */
  selectedProviderId: string | null;
  /** 插件当前动态注册的提供方 id（settings 的 provider 决定；未注册为 null） */
  registeredProviderId: string | null;
  providers: ProviderStateMeta[];
  /** 生效配置快照：{ provider, maxResults, <providerId>: {...} } */
  config: Record<string, unknown>;
  /** 各供应商 stateExtras（键 = provider id） */
  extras: Record<string, Record<string, unknown>>;
  /** patch 固定选型与动态注册不一致时的可操作提示 */
  selectionHint?: string;
  error?: string;
}
