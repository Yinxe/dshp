/**
 * Client 半共享类型：与 Host 的 `/ext/dshp-vision-bridge/*` 协议对齐。
 *
 * 官方组件的 props 类型直接从 `@deepseek-ai/dsh-client-ui-primitives` import；
 * 这里只建模路由协议、领域模型，以及本插件实际用到的 slots / ctx 接缝。
 */
import type { ReactNode } from 'react';

export interface VisionRoute {
  provider: string;
  model: string;
}

export interface VisionConfig {
  enabled: boolean;
  primary: VisionRoute | null;
  fallback: VisionRoute | null;
}

export interface VisionModel extends VisionRoute {
  name: string;
}

export interface StateResponse {
  ok: boolean;
  models?: VisionModel[];
  config?: VisionConfig;
  error?: string;
}

export interface ProbeResult {
  ok: boolean;
  message: string;
}

export interface CheckResponse {
  ok: boolean;
  primary?: ProbeResult;
  fallback?: ProbeResult;
  error?: string;
}

export interface SaveResponse {
  ok: boolean;
  config?: VisionConfig;
  error?: string;
}

export type ConfigPatch = Partial<VisionConfig>;

/** client 侧 cordis 上下文（本插件只用到 get + effect）。 */
export interface ClientContext {
  get(name: string): unknown;
  effect(callback: () => unknown, label?: string): unknown;
}

/** slots 服务（本插件只用 inject + register）。 */
export interface SlotsService {
  inject(name: string, fn: () => unknown): unknown;
  register(spec: SlotRegistrationSpec, component: (props: never) => ReactNode): unknown;
}

/** 槽位注册选项（本插件只注册 settings.section 这个 list 槽位）。 */
export interface SlotRegistrationSpec {
  name: string;
  id: string;
  order?: number | undefined;
  label?: string | undefined;
}
