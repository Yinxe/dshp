/**
 * Client 半共享类型
 *
 * 这里只建模**官方类型没覆盖**的东西：宿主路由协议、框架偏好，以及 `ClientContext` /
 * `SlotsService` 这两个「只用到哪几个成员就写哪几个」的服务接缝。官方组件的 props 类型直接从
 * `@deepseek-ai/dsh-client-ui-primitives` import。
 *
 * @module @dshp/widget-kit/client/types
 */
import type { ReactNode } from 'react';

/** 框架偏好（存 settings.yaml 的 `dshp-widget-kit` 分节；**本机布局**存 localStorage，两者不同源）。 */
export interface FrameworkConfig {
  /** 是否在会话顶部显示组件托盘。 */
  trayEnabled: boolean;
  /** 托盘最多显示几个图标，其余进溢出菜单。 */
  maxVisibleIcons: number;
  /** 徽标默认轮询间隔（ms）。 */
  badgeIntervalMs: number;
  /** 托盘图标 hover 是否显示预览卡。 */
  hoverPreview: boolean;
  /** 是否装载本插件自带的两个参考组件（时钟 / 注册表诊断）。 */
  referenceWidgets: boolean;
  /** 卡片背景不透明度（0.2–1）：1 = 完全用主题底色，越小越透。 */
  cardOpacity: number;
  /** 卡片毛玻璃模糊半径（px，0–32）：0 = 关（不写 backdrop-filter）。 */
  cardBlur: number;
  /** 卡片边框：`auto` 跟随框架默认（0.5px）/ `on` 明显一点（1px）/ `off` 无边框。 */
  cardBorder: 'auto' | 'on' | 'off';
  /** 卡片圆角：`auto` 跟随框架默认（12px）/ `round` 圆角（20px）/ `square` 直角（0）。 */
  cardRadius: 'auto' | 'round' | 'square';
  /** 动效时长（ms，0–500）：`0` = 关闭过渡与入场动画；拖动跟手不受影响。 */
  motionMs: number;
}

/** `GET /ext/dshp-widget-kit/state` 的回包。 */
export interface StateResponse {
  ok: boolean;
  version?: string;
  specVersion?: number;
  config?: FrameworkConfig;
  error?: string;
}

/** `POST /ext/dshp-widget-kit/config` 的请求体。 */
export interface ConfigPatch {
  trayEnabled?: boolean;
  maxVisibleIcons?: number;
  badgeIntervalMs?: number;
  hoverPreview?: boolean;
  referenceWidgets?: boolean;
  cardOpacity?: number;
  cardBlur?: number;
  cardBorder?: 'auto' | 'on' | 'off';
  cardRadius?: 'auto' | 'round' | 'square';
  motionMs?: number;
}

/** 带 label 的图标的可访问名（托盘图标与卡片标题都用它）。 */
export interface TitleResolver {
  (): string;
}

export interface SlotRegistrationSpec {
  name: string;
  /** list / keyed 槽位的条目 id 或 key。 */
  id?: string | undefined;
  key?: string | undefined;
  order?: number | undefined;
  label?: string | undefined;
}

/** slots 服务（本插件只用 inject + register）。 */
export interface SlotsService {
  inject(name: string, fn: () => unknown): unknown;
  register(spec: SlotRegistrationSpec, component: (props: never) => ReactNode): unknown;
}

/**
 * client 侧 cordis 上下文（本插件只用到这几个成员）。
 *
 * 不 import `@deepseek-ai/cordis`：client 半在服务表面前是普通模块，形状就是实际用到的契约。
 */
export interface ClientContext {
  get(name: string): unknown;
  effect(callback: () => unknown, label?: string): unknown;
  /** timer 服务 mixin（需 `inject: ['timer']`）：返回 disposer。 */
  interval(callback: () => void, delay: number): () => void;
  timeout(callback: () => void, delay: number): () => void;
  /** 发布一个客户端服务（官方 layout / resources 用的是同一入口），返回注销函数。 */
  reflect: {
    provide(name: string, value: unknown): () => void;
  };
}
