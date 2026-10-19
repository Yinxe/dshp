/**
 * Host 侧类型。
 *
 * DSH 运行时没有官方的插件类型包，ctx 用 `AnyCtx` 透传；只有本插件自己消费的
 * llm / settings 服务做最小结构化建模，避免把整个前端退化成 `any`。
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

export interface VisionRoute {
  provider: string;
  model: string;
}

export interface PluginConfig {
  enabled: boolean;
  primary: VisionRoute | null;
  fallback: VisionRoute | null;
}

/** `apply(ctx, config)` 收到的实参：每个字段都是稳定引用，`.get()` 读当前深只读快照。 */
export interface VolatileConfig {
  enabled: Volatile<boolean>;
  primary: Volatile<VisionRoute | null>;
  fallback: Volatile<VisionRoute | null>;
}

/** 图片 leaf 的 owned copy：只保留发请求需要的字段。 */
export interface ImageRef {
  attachmentId: string;
  mediaType: string;
  bytes: number;
  width: number;
  height: number;
  name?: string;
}

export interface CandidateModel extends VisionRoute {
  name: string;
}

/** `llm` 服务中本插件实际用到的成员。 */
export interface LlmService {
  listProviders(): unknown;
  listModels(provider: string): Promise<unknown>;
  listConfigurableProviders?: () => unknown;
  resolveModelInfo(provider: string, model: string, signal?: AbortSignal): Promise<unknown>;
  stream(options: Record<string, unknown>): AsyncIterable<unknown>;
}

/** `settings` 服务中本插件实际用到的成员。 */
export interface SettingsService {
  describe(options?: { redactSecrets?: boolean }): unknown;
  update(ns: string, patch: object): Promise<void>;
}

/** Cordis 运行时 ctx：官方类型缺失，透传 any。 */
export type AnyCtx = any;
