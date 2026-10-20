/**
 * Host 侧类型：web seam 契约 + 搜索后端模块契约。
 *
 * web seam 的 `WebSearchRequest` / `WebSearchResult` / `WebSearchSource` 按
 * `@deepseek-ai/dsh-web` 的公开形态结构化复刻（运行时零依赖，不 import 该包）。
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

export type AnyCtx = any;

// ── web seam 契约（结构对齐 @deepseek-ai/dsh-web，勿加字段）───────────────────

export interface WebSearchRequest {
  readonly query: string;
  readonly maxResults?: number;
}

export interface WebSearchSource {
  readonly url: string;
  readonly title?: string;
  readonly snippet?: string;
  readonly publishedAt?: string;
}

export interface WebSearchResult {
  readonly content?: string;
  readonly sources: readonly WebSearchSource[];
  readonly truncated: boolean;
}

export interface WebSearchProvider {
  readonly id: string;
  available(): boolean;
  search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}

// ── 设置页控件元数据（下发给 Client 渲染，纯 JSON）────────────────────────────

export interface ProviderFieldOption {
  value: string;
  label: string;
}

export interface ProviderField {
  key: string;
  label: string;
  kind: 'select' | 'text' | 'number';
  options?: readonly ProviderFieldOption[];
  hint?: string;
  placeholder?: string;
}

// ── 搜索后端模块契约 ─────────────────────────────────────────────────────────

export interface ProviderDeps {
  ctx: AnyCtx;
  /** 从 credentials 服务实时解析密钥；未配置返回 undefined。 */
  resolveKey(credentialRef: string): Promise<string | undefined>;
  getConfig(): PluginConfig;
  providerConfig(providerId: string): Record<string, unknown>;
}

export interface SearchProviderModule {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  /** credentials 引用名，如 TAVILY_API_KEY。 */
  readonly credentialRef: string;
  /** Firecrawl 允许无 Key 使用，其余为 true。 */
  readonly credentialRequired: boolean;
  readonly homepage: string;
  readonly description: string;
  /** 免费额度说明（设置页展示）。 */
  readonly freeNote: string;
  readonly fields: readonly ProviderField[];
  readonly defaultConfig: Record<string, unknown>;
  /** 有字段的后端才提供；装配层把整块声明为 volatile。 */
  readonly configSchema?: unknown;
  sanitizePatch(raw: unknown): Record<string, unknown> | null;
  snapshot(config: Record<string, unknown>): Record<string, unknown>;
  search(deps: ProviderDeps, request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}

// ── 插件配置（profile 条目 `config:`：dshp-search-provider）──────────────────

export interface PluginConfig {
  provider: string;
  maxResults: number;
  tavily: Record<string, unknown>;
  exa: Record<string, unknown>;
}

export interface VolatileConfig {
  provider: Volatile<string>;
  maxResults: Volatile<number>;
  tavily: Volatile<Record<string, unknown>>;
  exa: Volatile<Record<string, unknown>>;
}

// ── 同源路由协议 ─────────────────────────────────────────────────────────────

export interface ProviderStateMeta {
  id: string;
  label: string;
  title: string;
  credentialRef: string;
  credentialRequired: boolean;
  homepage: string;
  description: string;
  freeNote: string;
  fields: readonly ProviderField[];
  configured: boolean;
  source?: string;
}

export interface StateResponse {
  ok: boolean;
  namespace: string;
  hubProviderId: string;
  /** web 配置里的 searchProvider；读不到为 null。 */
  selectedProviderId: string | null;
  /** selectedProviderId 是否等于 hubProviderId。 */
  webSearchConfigured: boolean;
  providers: ProviderStateMeta[];
  config: Record<string, unknown>;
  selectionHint?: string;
  error?: string;
}
