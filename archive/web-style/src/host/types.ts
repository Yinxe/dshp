/**
 * Host 半自有类型（设置页协议 + 持久化形状）
 *
 * 与 client 半 `src/client/types.ts` 的路由协议保持对齐：
 * GET /ext/dshp-web-style/state、GET /themes、POST /theme、POST /config。
 *
 * @module @dshp/web-style
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

/** DSH 运行时透传对象（无官方 npm 类型包，统一 any；自有的数据结构见下方） */
export type AnyCtx = any;
export type AnySettings = any;

/** 全局圆角：-1 跟随主题 / 0 全锐角 / N 统一圆润（当前只暴露 global） */
export interface RadiusConfig {
  global: number;
}

/** 壁纸取色的持久化形态（accent 恒等于 seed；companions 仅信息性派生） */
export interface PhotoPalette {
  accent: string;
  companionA: string;
  companionB: string;
}

/** profile 条目 `config:`（0.1.7 起替代 settings.yaml）的完整快照 */
export interface StyleConfig {
  /** 选中的主题 id；空串 = 完全跟随官方亮/暗偏好 */
  themeId: string;
  /** 选中的背景效果 id；空串 = 跟随主题默认（见 client 侧 THEME_DEFAULT_EFFECT） */
  backgroundId: string;
  photoPalette: PhotoPalette | null;
  radius: RadiusConfig;
  /** 已退役特性（旧数据透传保留，UI 不再读写） */
  wallpaper: Record<string, unknown>;
  glass: Record<string, unknown>;
}

/** 部分覆盖（cordis.patch.yml 的 config / 路由 body 用） */
export interface StyleConfigPatch {
  themeId?: string;
  backgroundId?: string;
  photoPalette?: PhotoPalette | null;
  radius?: Partial<RadiusConfig>;
  wallpaper?: Record<string, unknown>;
  glass?: Record<string, unknown>;
}

/** `apply(ctx, config)` 实参：可写字段是 volatile 引用（`.get()` 读快照），退役字段是普通值 */
export interface VolatileConfig {
  themeId: Volatile<string>;
  backgroundId: Volatile<string>;
  photoPalette: Volatile<PhotoPalette | null>;
  radius: Volatile<RadiusConfig>;
  wallpaper: Record<string, unknown>;
  glass: Record<string, unknown>;
}
