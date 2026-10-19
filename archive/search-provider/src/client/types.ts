/**
 * Client 侧协议类型（与 host 的 routes.ts / types.ts 对齐）+ cordis 服务接缝
 *
 * 原实现：dsh-tavily-search/client.js 里散落的隐式结构（JS）
 * → 本文件为 TS 重写新增：把路由协议显式化，多供应商字段与 host 保持一致。
 *
 * 这里只建模**官方类型没覆盖**的东西：路由协议、领域模型，以及 `ClientContext` /
 * `SlotsService` 这两个「只用到哪几个成员就写哪几个」的服务接缝。官方组件（react 与
 * `@deepseek-ai/dsh-client-ui-primitives`）的类型直接从各自包里 import，不再有 `DshRequire` /
 * `AnyReact` / `AnyPrimitives` 那套 shim——loader 壳由构建预设生成，源码里也不再有
 * `__ModuleLoader__` 的全局声明。
 */
import type { ReactNode } from 'react';

/**
 * client 侧 cordis 上下文（本插件只用到这两个成员）。
 *
 * 不 import `@deepseek-ai/cordis` 的类型：client 半在 cordis 服务表面前是普通模块，`ctx` 由 shell
 * 的模块系统注入，把整包 cordis 拉进 devDependencies 只为两个方法并不划算。这里的形状就是实际
 * 用到的契约，改一处即可跟随上游。
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
}

/**
 * slots 服务（本插件只用 inject + register）。
 *
 * 只建模用到的两个成员。**没有**直接 import 槽位包的 `SlotCore`：逐槽位的 props 检查要靠
 * `SlotMap` 声明合并（由 settings / conversation / tool 各自的 UI 包 merge 进来），那是下一步。
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
   * @param component - 组件（props 由槽位契约决定）。
   * @returns 卸载该条注册的 disposer。
   */
  register(spec: SlotRegistrationSpec, component: (props: never) => ReactNode): unknown;
}

/** 槽位注册选项（本插件只注册 list 槽位，故只需要 id + order + label）。 */
export interface SlotRegistrationSpec {
  name: string;
  /** list 槽位的条目 id。 */
  id?: string | undefined;
  /** list 槽位的排序。 */
  order?: number | undefined;
  /** list 槽位（`settings.section`）在导航里显示的标题。 */
  label?: string | undefined;
}

// ── 供应商元数据 / 状态 ─────────────────────────────────────────────────────

export interface ProviderFieldOption {
  value: string;
  label: string;
}

export interface ProviderField {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'select';
  options?: ProviderFieldOption[];
  hint?: string;
  mono?: boolean;
  placeholder?: string;
}

export interface ProviderState {
  id: string;
  label: string;
  title: string;
  credentialRef: string;
  homepage: string;
  description: string;
  fields: ProviderField[];
  configured: boolean;
  source?: string;
  selected: boolean;
}

export interface SearchSource {
  url: string;
  title?: string;
  snippet?: string;
  publishedAt?: string;
}

/** 生效配置快照：通用字段 + 各供应商分节（键名 = provider id） */
export interface ConfigSnapshot {
  provider: string;
  maxResults: number;
  [providerId: string]: unknown;
}

export interface StateResponse {
  ok: boolean;
  namespace?: string;
  /** web seam 配置固定的提供方 id（profile patch / 环境变量；未固定为 null） */
  selectedProviderId?: string | null;
  /** 插件当前动态注册的提供方 id（settings 的 provider 决定；未注册为 null） */
  registeredProviderId?: string | null;
  providers?: ProviderState[];
  config?: ConfigSnapshot;
  extras?: Record<string, Record<string, unknown>>;
  selectionHint?: string;
  error?: string;
}

export interface ConfigSaveResponse {
  ok: boolean;
  config?: ConfigSnapshot;
  error?: string;
}

export interface TestResponse {
  ok: boolean;
  provider?: string;
  sources?: SearchSource[];
  error?: string;
  takenMs?: number;
}

export interface UsageResponse {
  ok: boolean;
  usage?: Record<string, unknown>;
  cached?: boolean;
  fetchedAt?: number;
  takenMs?: number;
  error?: string;
  /** 最新查询失败时附带的旧快照 */
  stale?: { usage: Record<string, unknown>; fetchedAt: number };
  /** 404/空响应等“Host 是旧版本”场景 */
  needsRestart?: boolean;
}

export interface CredentialReply {
  ok: boolean;
  error?: string;
  state?: StateResponse;
}

/** 路由前缀（与 host 的 ROUTE_BASE 一致） */
export const ROUTE_BASE = '/ext/dshp-search-provider';
