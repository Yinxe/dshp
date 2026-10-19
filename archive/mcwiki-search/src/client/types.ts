/**
 * Client 半共享类型（设置页 + /mcwiki 命令卡片）
 * 与 Host 的 /ext/dshp-mcwiki-search/* 路由协议对齐
 *
 * 这里只建模**官方类型没覆盖**的东西：路由协议、领域模型、命令节点的实际用到的字段，以及
 * `ClientContext` / `SlotsService` 这两个「只用到哪几个成员就写哪几个」的服务接缝。官方组件的
 * props 类型直接从 `@deepseek-ai/dsh-client-ui-primitives` import，不再有 `AnyReact` /
 * `AnyPrimitives` / `DshRequire` 那套 shim——它们等于把整个前端退化成 `any`。
 */
import type { ReactNode } from 'react';

export interface McWikiConfig {
  timeoutMs: number;
  maxChars: number;
  introMaxChars: number;
  searchMaxResults: number;
}

export interface StateResponse {
  ok: boolean;
  timeoutMs?: number;
  maxChars?: number;
  introMaxChars?: number;
  searchMaxResults?: number;
  config?: McWikiConfig;
  tools?: string[];
  error?: string;
}

export interface TestResultItem {
  title: string;
  snippet: string;
  url: string;
  updated?: string;
}

export interface TestPage {
  title: string;
  section: 'intro' | 'full';
  format: 'text' | 'markdown';
  text: string;
  url: string;
}

export interface TestResponse {
  ok: boolean;
  query?: string;
  totalHits?: number;
  results?: TestResultItem[];
  page?: TestPage | null;
  takenMs?: number;
  error?: string;
}

export type ConfigPatch = Partial<McWikiConfig>;
export type TestKind = 'search' | 'page';

/**
 * `/mcwiki` 命令节点（`conversation.chat.commandview` 交给卡片的 `props.node`）。
 *
 * 只建模卡片实际读的两个字段：`outcome` 为 `null` = 命令还在跑，`kind` 为 `'error'` = 失败。
 */
export interface CommandNode {
  outcome?: { kind?: string | undefined; text?: string | undefined } | null | undefined;
}

/** `conversation.chat.commandview` 槽位交给卡片的 props（只用到 `node`）。 */
export interface CommandCardProps {
  node?: CommandNode | undefined;
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
 * `SlotMap` 声明合并（由 settings / conversation 各自的 UI 包 merge 进来），那是下一步。
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
   * keyed 槽位用 `key`（+ `priority` 影子化：同 key 同 priority 会抛错，派发取 priority 最小的一条）；
   * list 槽位用 `id`（+ `order`）。`locale` 传了才会注入 `t`。
   *
   * @param spec - 注册选项。
   * @param component - 组件（props 由槽位契约决定）。
   * @returns 卸载该条注册的 disposer。
   */
  register(spec: SlotRegistrationSpec, component: (props: never) => ReactNode): unknown;
}

/** 槽位注册选项（keyed 用 key，list 用 id；本插件只用到 id / order / label 与 key）。 */
export interface SlotRegistrationSpec {
  name: string;
  /** keyed 槽位的分发键（`/mcwiki` 命令卡片按命令名 `mcwiki` 占用）。 */
  key?: string | undefined;
  /** list 槽位的条目 id。 */
  id?: string | undefined;
  /** list 槽位的排序。 */
  order?: number | undefined;
  /** list 槽位（`settings.section`）在导航里显示的标题。 */
  label?: string | undefined;
  /** 本地化命名空间：传了才会注入 `t`（本插件没有注册传它）。 */
  locale?: string | undefined;
  /** keyed 槽位的影子化优先级（越小越优先渲染；本插件没有注册传它）。 */
  priority?: number | undefined;
}
