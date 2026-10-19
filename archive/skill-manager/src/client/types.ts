/**
 * Client 半共享类型（设置页）
 * 与 Host 的 /ext/dshp-skill-manager/* 路由协议对齐（host/types.ts 同名字段）
 *
 * 这里只建模**官方类型没覆盖**的东西：路由协议、领域模型，以及 `ClientContext` / `SlotsService`
 * 这两个「只用到哪几个成员就写哪几个」的服务接缝。官方组件的 props 类型直接从
 * `@deepseek-ai/dsh-client-ui-primitives` import，不再有 `AnyReact` / `AnyPrimitives` /
 * `DshRequire` 那套 shim——它们等于把整个前端退化成 `any`。
 */
import type { ReactNode } from 'react';

export interface RootInfo {
  id: string;
  label: string;
  scope: 'global' | 'workspace';
  workspace: string;
  path: string;
  rank: number;
  exists: boolean;
}

export interface SkillEntry {
  rootId: string;
  name: string;
  dirName: string;
  kind: 'bundle' | 'flat';
  description: string;
  whenToUse: string;
  modelInvocable: boolean;
  userInvocable: boolean;
  scope: 'global' | 'workspace';
  workspace: string;
  entryPath: string;
  valid: boolean;
  problem: string;
  shadowedBy: string;
}

export interface SkillState {
  enabled: boolean;
  dshHome: string;
  agentsHome: string;
  roots: RootInfo[];
  skills: SkillEntry[];
  workspaces: string[];
  workspaceRoot: string;
}

export interface StateResponse {
  ok: boolean;
  state?: SkillState;
  error?: string;
}

export interface ReadResponse {
  ok: boolean;
  entry?: SkillEntry;
  fields?: Array<{ key: string; value: string }>;
  body?: string;
  error?: string;
}

export interface ConfigResponse {
  ok: boolean;
  config?: { enabled: boolean; workspaceRoot: string };
  error?: string;
}

export interface CreatePayload {
  rootId: string;
  name: string;
  description: string;
  whenToUse?: string;
  body?: string;
  kind?: 'bundle' | 'flat';
}

export interface UpdatePayload {
  rootId: string;
  name: string;
  description?: string;
  whenToUse?: string;
  body?: string;
}

export interface TogglePayload {
  rootId: string;
  name: string;
  /** all = 整个技能启用/禁用（两个调用面一起切）；model / user = 单个调用面 */
  field: 'model' | 'user' | 'all';
  value: boolean;
}

export interface TransferPayload {
  fromRootId: string;
  fromName: string;
  toRootId: string;
  toName?: string;
  deleteSource?: boolean;
}

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

/** 槽位注册选项（本插件只注册 list 槽位，故只需要 name + id + order + label）。 */
export interface SlotRegistrationSpec {
  name: string;
  /** list 槽位的条目 id。 */
  id?: string | undefined;
  /** list 槽位的排序。 */
  order?: number | undefined;
  /** list 槽位（`settings.section`）在导航里显示的标题。 */
  label?: string | undefined;
}
