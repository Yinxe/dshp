/**
 * @dshp/widget-kit —— Host 半共享类型
 *
 * DSH 运行时的 Cordis ctx / settings / webServer 暂无官方类型包，Host 侧统一用 `AnyCtx`
 * 透传；本插件自有的数据结构（框架偏好）严格建模。
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

export type AnyCtx = any;
export type AnySettings = any;

/** 框架偏好（profile 条目 `config:` 分节；0.1.7 起替代 settings.yaml）。 */
export interface FrameworkConfig {
  trayEnabled: boolean;
  maxVisibleIcons: number;
  badgeIntervalMs: number;
  hoverPreview: boolean;
  referenceWidgets: boolean;
  /** 卡片背景不透明度（0.2–1）与毛玻璃模糊半径（px，0–32）：用户偏好，写进 profile 条目 config。 */
  cardOpacity: number;
  cardBlur: number;
  /** 卡片边框与圆角样式档。 */
  cardBorder: 'auto' | 'on' | 'off';
  cardRadius: 'auto' | 'round' | 'square';
  /** 动效时长（ms，0–500）：`0` = 关闭过渡与入场动画。 */
  motionMs: number;
}

/** 路由 body 允许的部分覆盖。 */
export interface FrameworkConfigPatch {
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

/** `apply(ctx, config)` 实参：ConfigSchema 全字段 volatile，`.get()` 读当前深只读快照。 */
export interface VolatileConfig {
  trayEnabled: Volatile<boolean>;
  maxVisibleIcons: Volatile<number>;
  badgeIntervalMs: Volatile<number>;
  hoverPreview: Volatile<boolean>;
  referenceWidgets: Volatile<boolean>;
  cardOpacity: Volatile<number>;
  cardBlur: Volatile<number>;
  cardBorder: Volatile<FrameworkConfig['cardBorder']>;
  cardRadius: Volatile<FrameworkConfig['cardRadius']>;
}
