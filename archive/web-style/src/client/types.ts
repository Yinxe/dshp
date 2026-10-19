/**
 * Client 半共享类型（设置 → 外观定制）
 * 与 Host 的 /ext/dshp-web-style/* 路由协议对齐（见 src/host/types.ts）
 *
 * 这里只建模**官方类型没覆盖**的东西：路由协议、领域模型，以及 `ClientContext` /
 * `SlotsService` 这两个「只用到哪几个成员就写哪几个」的服务接缝。官方组件的 props 类型
 * 直接从 `@deepseek-ai/dsh-client-ui-primitives` import，不再有 `AnyReact` / `AnyPrimitives` /
 * `DshRequire` 那套 shim——它们等于把整个前端退化成 `any`。
 *
 * @module @dshp/web-style/client
 */
import type { ReactNode } from 'react';

/** 主题色值映射（Host 下发的全量 token）。 */
export type TokenMap = Record<string, string>;

/** 画廊卡片展示信息（token 不在其中，按需问 Host 要）。 */
export interface ThemeMeta {
  id: string;
  colorScheme: 'light' | 'dark';
  label: string;
  desc: string;
  /** 卡片三色拼接 + 搜索 accent（第 3 位即 accent）；虚拟主题不带色卡 */
  swatch?: string[];
  /** 卡片左上角小标签（缺省回退「深色/浅色 · accent」）。 */
  tag?: string;
  /** 虚拟壁纸主题的运行时 seed（仅 photo:custom 用）。 */
  accent?: string;
}

/** 持久化的壁纸调色盘（accent 恒等于 seed）。 */
export interface PhotoPalette {
  accent: string;
  companionA: string;
  companionB: string;
}

/** 圆角配置（Host settings 形状）。 */
export interface RadiusConfig {
  global: number;
}

/** GET /ext/dshp-web-style/state 应答。 */
export interface StateReply {
  ok?: boolean;
  themeId?: string;
  /** 背景效果 id；空串 = 跟随主题默认 */
  backgroundId?: string;
  /** seed 为旧数据兼容字段（新数据 seed 恒等于 accent），读取时二者取一 */
  photoPalette?: (PhotoPalette & { seed?: string }) | null;
  radius?: RadiusConfig;
  wallpaper?: Record<string, unknown>;
  glass?: Record<string, unknown>;
  error?: string;
}

/** GET /ext/dshp-web-style/themes 应答。 */
export interface ThemesReply {
  ok?: boolean;
  count?: number;
  themes?: Array<ThemeMeta & { tokens?: TokenMap }>;
  error?: string;
}

/** POST /theme 与 POST /config 共用应答（= state 快照）。 */
export type SaveReply = StateReply;

/** POST /config 的补丁体。 */
export interface ConfigPatch {
  radius?: RadiusConfig;
  photoPalette?: PhotoPalette | null;
  backgroundId?: string;
}

/** 主题覆盖层 pair：每个 token 一份 {light, dark}。 */
export type TokenOverridePair = Record<string, { light: string; dark: string }>;

/** theme 服务快照（只取插件真正读的 leaf 字段）。 */
export interface ThemeSnapshot {
  preference?: string;
  revision?: number;
  active?: { id?: string; tokens?: TokenMap } | null;
}

/** theme 服务（官方外观服务，插件只消费不替换）。 */
export interface ThemeService {
  getTheme(): ThemeSnapshot;
  setTheme(preference: string): void;
  /** 注册 token 覆盖层，返回撤销函数。 */
  overrideTokens(source: string, pair: TokenOverridePair): () => void;
}

/**
 * client 侧 cordis 上下文（本插件只用 `get` / `effect` / `on`）。
 *
 * 不 import `@deepseek-ai/cordis` 的类型：client 半在 cordis 服务表面前是普通模块，`ctx` 由 shell
 * 的模块系统注入，把整包 cordis 拉进 devDependencies 只为三个方法并不划算。这里的形状就是实际
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
  /**
   * 订阅一个事件，返回退订函数（画廊用它跟随 `theme/change` 重渲染）。
   *
   * @param name - 事件名。
   * @param listener - 事件回调。
   */
  on(name: string, listener: (payload: unknown) => void): () => void;
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
