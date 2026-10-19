/**
 * @dshp/widget-kit —— 小组件规范的**公开类型契约**（供其它插件 `import type` 用）
 *
 * 用法（业务插件侧，只加 devDependency，运行时零 import）：
 *
 * ```ts
 * import type { WidgetDescriptor, WidgetContentProps } from '@dshp/widget-kit/spec';
 * ```
 *
 * 本文件是手写的、**自包含**的（除 `react` 的类型外不 import 任何东西），并且是
 * `src/client/spec.ts` 的镜像：`scripts/check-spec-drift.mjs` 逐字段比对两边，
 * 漂移即 `pnpm test` 失败。请不要手改这里的字段名而不改实现（反之亦然）。
 */

import type { ReactNode } from 'react';

/** 契约版本：破坏性变更 +1，迁移步骤写在 `docs/widget-spec.md`。 */
export declare const SPEC_VERSION: number;

/** 框架版本（等于 package.json 的 version）。 */
export declare const FRAMEWORK_VERSION: string;

/** 本插件的命名空间 = settings NS = cordis 行 id。组件 id 的前缀必须是自己的命名空间。 */
export declare const NS: string;

/** 活动栏图标文字（`tray.label`）的最大字数。 */
export declare const TRAY_LABEL_MAX_CHARS: number;

export interface WidgetSize {
  w: number;
  h: number;
}

export interface WidgetBox {
  width: number;
  height: number;
}

export interface WidgetBadge {
  text?: string;
  dot?: boolean;
  tone?: 'info' | 'ok' | 'warn' | 'bad';
  title?: string;
}

export interface WidgetBadgeContext {
  sessionId: string | null;
  signal: AbortSignal;
  frameworkVersion: string;
}

export interface WidgetLoadContext {
  sessionId: string | null;
  signal: AbortSignal;
  reason: 'open' | 'refresh' | 'retry';
}

/**
 * 内容面（popover / card）拿到的 props。
 *
 * 内容如何随尺寸变化**完全由提供方决定**：框架只给事实（`size` / `sizeClass` / `frame`）
 * 与一个受约束的 `setSize`，不干涉布局、不做内容驱动的自动尺寸。
 */
export interface WidgetContentProps<D = unknown> {
  frame: 'card' | 'popover';
  sessionId: string | null;
  status: 'loading' | 'ready' | 'error' | 'empty';
  data: D | undefined;
  error?: { message: string; retriable: boolean } | undefined;
  stale: boolean;
  lastUpdatedAt: number | null;
  size: WidgetBox | null;
  sizeClass: 'compact' | 'regular' | 'wide';
  setSize?(next: { w?: number; h?: number }): void;
  /** 卡片处于「折叠成标题栏」状态（内容仍在树上，只是不显示）。`popover` 恒为 false。 */
  minimized: boolean;
  /** 卡片位置已锁定（框架已拒掉拖动/缩放）。`popover` 恒为 false。 */
  locked: boolean;
  refresh(): void;
  retry(): void;
  close(): void;
}

export interface WidgetCardOptions {
  defaultSize?: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  sizeClassBreakpoints?: { compact: number; wide: number };
  resizable?: boolean;
  minimizable?: boolean;
  closable?: boolean;
}

export interface WidgetTrayOptions {
  badge?(ctx: WidgetBadgeContext): WidgetBadge | null | Promise<WidgetBadge | null>;
  badgeIntervalMs?: number;
  /**
   * 图标旁边的一小段文字（活动栏的「图标 + 文字」扩展点），最多 6 个字。
   * 写函数 = 每次框架重渲染时求值（徽标刷新等），适合轻量实时读数。
   */
  label?: string | (() => string);
}

/**
 * `presentation: 'popover'` 的形态选项。
 *
 * popover 是「小窗口」：**不可拖动、不可缩放**，同一时刻只展开一个；内容由提供方自由渲染
 * （菜单、快捷设置、数据卡、甚至 iframe / 视频 / 画布这类任意 web 视图）。
 */
export interface WidgetPopoverOptions {
  /** 展开方式：`click`（默认）点图标展开，`hover` 悬停展开（移开自动收起）。 */
  trigger?: 'click' | 'hover';
  /** 面板宽度（px）；不写 = 自适应内容（上限 `min(420, 视口−24)`）。 */
  width?: number;
  /** 面板最大高度（px）；不写 = `min(60vh, 520)`。 */
  maxHeight?: number;
  /** 内容内边距（px，默认 12）；要贴边渲染（iframe / 视频 / 画布）就设 0。 */
  padding?: number;
  /** 相对图标的位置：`bottom`（默认）或 `top`。 */
  side?: 'bottom' | 'top';
  /** 是否渲染框架自带的标题栏（默认 true）；`false` = 整个面板归你（Esc / 点外部仍可关闭）。 */
  header?: boolean;
  /** 悬停展开延迟（ms，默认 80）。 */
  hoverOpenDelayMs?: number;
  /** 悬停收起的宽限（ms，默认 220）——用来跨过「从图标移到面板」的间隙。 */
  hoverCloseDelayMs?: number;
  /**
   * 是否**持续显示**（默认 false）。
   *
   * `true` = 面板不受外部操作影响：点组件外的区域、指针移开都不会收起，只能用面板上的「✕」、
   * 再点一次图标或 Esc 关掉。适合「常驻的快捷设置 / 实时数据面板」；不适合一次性菜单。
   */
  persistent?: boolean;
}

export interface WidgetContentOptions<D = unknown> {
  title?: string | (() => string);
  load?(ctx: WidgetLoadContext): Promise<D>;
  refreshMs?: number;
  render(props: WidgetContentProps<D>): ReactNode;
}

export interface WidgetDescriptor<D = unknown> {
  id: string;
  title: string | (() => string);
  icon: ReactNode;
  subtitle?: string | (() => string);
  order?: number;
  presentation: 'tray' | 'popover' | 'card';
  /**
   * 是否在活动栏放图标（默认 `true`）。`false` 只有 `presentation: 'card'` 能写：
   * 卡片仍然可以由别的组件用 `ctx.widgets.toggle(id)` 打开 —— 典型用法是
   * 「一个宿主插件只注册一个迷你菜单图标，菜单里同时挂多个自由卡片」。
   */
  trayIcon?: boolean;
  /**
   * 允许被框架的统一入口「组件箱」收录（默认 `false` = 不收录）。只有 `presentation: 'card'`
   * 能写。**默认不收录是有意的**：入口归卡片的所有者决定 —— 想自建菜单就只写 `trayIcon: false`
   * 再注册一个 popover（`@dshp/token-meter` 的 `token-meter:menu` 就是这么做的），框架不替别人
   * 做这个决定。声明了才进箱，`trayIcon: false` + `listedInBox: true` = 「让组件箱替我挂出来」。
   */
  listedInBox?: boolean;
  tray?: WidgetTrayOptions;
  content?: WidgetContentOptions<D>;
  card?: WidgetCardOptions;
  popover?: WidgetPopoverOptions;
  minFramework?: string;
}

/** 注册表对外的一行摘要（设置页/诊断组件只读这份）。 */
export interface WidgetSummary {
  id: string;
  title: string;
  owner: string;
  presentation: 'tray' | 'popover' | 'card';
  /** 是否声明了「可被组件箱收录」——别的聚合入口也能按同一条声明决定收不收。 */
  listedInBox: boolean;
}

/** 客户端服务 `ctx.widgets`（由本插件 `ctx.reflect.provide('widgets', …)` 发布）。 */
export interface WidgetsService {
  readonly specVersion: number;
  readonly frameworkVersion: string;
  register<D>(descriptor: WidgetDescriptor<D>): () => void;
  list(): readonly WidgetSummary[];
  subscribe(listener: () => void): () => void;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  minimize(id: string): void;
  restore(id: string): void;
  /** 启用 / 禁用（禁用 = 图标、卡片、内容面、徽标全部停用；状态记在本机布局里）。 */
  setEnabled(id: string, enabled: boolean): void;
  isEnabled(id: string): boolean;
  /** 锁定 / 解锁位置（锁定后不可拖动、不可缩放，仍可最小化与关闭）。 */
  setLocked(id: string, locked: boolean): void;
  isLocked(id: string): boolean;
}
