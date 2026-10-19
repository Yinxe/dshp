/**
 * 表面外观与动效 —— 把用户偏好翻成一组 CSS 自定义属性
 *
 * 为什么要有这个模块：卡片层（`shell.overlay`）、托盘（`shell.header...utilities`）是两个不同的槽位、
 * 两棵 React 树，但都吃**同一套**外观/动效偏好。把它们各自钉在自己那棵树的根上（而不是去写
 * `document.documentElement`），既不影响官方样式，也不需要全局 DOM 写入。
 *
 * 颜色仍然只来自 `--dsw-alias-*`：透明度是交给 CSS 里的 `color-mix` 按百分比算的。
 *
 * @module @dshp/widget-kit/client/appearance
 */
import type { CSSProperties } from 'react';
import { SPEC_DEFAULTS } from './spec.js';
import type { FrameworkConfig } from './types.js';

/** 圆角档 → 实际半径（`auto` 跟随框架默认）。 */
export function radiusOf(mode: string): number {
  if (mode === 'round') return SPEC_DEFAULTS.cardRadiusRound;
  if (mode === 'square') return 0;
  return SPEC_DEFAULTS.cardRadius;
}

/** 边框档 → 实际宽度（`auto` 跟随框架默认）。 */
export function borderWidthOf(mode: string): number {
  if (mode === 'on') return SPEC_DEFAULTS.cardBorderWidthStrong;
  if (mode === 'off') return 0;
  return SPEC_DEFAULTS.cardBorderWidth;
}

/** 动效时长档（`0` = 关）：夹到 0–500ms 之间。 */
export function motionOf(ms: number): number {
  if (!Number.isFinite(ms)) return SPEC_DEFAULTS.motionMs;
  return Math.min(500, Math.max(0, Math.round(ms)));
}

/**
 * 外观 + 动效偏好 → CSS 自定义属性。
 *
 * - `--dshp-card-alpha`：百分比，交给 `color-mix` 调背景透明度（卡片、标题栏、小面板共用）；
 * - `--dshp-card-blur`：`none` 或 `blur(Npx)` —— 关掉时给 `none`，不建 backdrop-filter 合成层；
 * - `--dshp-card-radius` / `--dshp-card-capsule-radius` / `--dshp-card-border-width`：圆角与边框档；
 * - `--dshp-motion-ms`：**所有**过渡与入场动画的时长（拖动跟手、手势盾这些「必须逐帧」的地方不用它）。
 *
 * @param prefs - 框架偏好快照。
 */
export function surfaceVars(prefs: FrameworkConfig): CSSProperties {
  const opacity = Math.min(1, Math.max(0.2, prefs.cardOpacity));
  const blur = Math.min(32, Math.max(0, Math.round(prefs.cardBlur)));
  return {
    '--dshp-card-alpha': `${String(Math.round(opacity * 100))}%`,
    '--dshp-card-blur': blur === 0 ? 'none' : `blur(${String(blur)}px)`,
    '--dshp-card-radius': `${String(radiusOf(prefs.cardRadius))}px`,
    // 最小化的胶囊形态：两端全圆；「直角」档才跟着拉平
    '--dshp-card-capsule-radius': prefs.cardRadius === 'square' ? '0px' : '999px',
    '--dshp-card-border-width': `${String(borderWidthOf(prefs.cardBorder))}px`,
    '--dshp-motion-ms': `${String(motionOf(prefs.motionMs))}ms`,
  } as CSSProperties;
}
