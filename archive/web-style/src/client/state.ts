/**
 * state.ts —— client 半的模块级会话状态
 *
 * 原实现：dsh-custom-ui/client.js 的 factory 闭包变量（desiredId / photoTheme /
 * desiredRadius / overrideDispose / renderBodyGradientRef）。TS 版按职责拆模块后，
 * 这些跨模块共享的可变状态集中到本文件；bundle 为 IIFE，模块级状态仍是「每次加载
 * 一份」，与闭包语义一致。
 *
 * @module @dshp/web-style/client
 */
import type { WallpaperTheme } from './md3.js';

export interface ClientState {
  /** 持久化的主题选择：非空 = 有自定义覆盖层在生效 */
  desiredId: string;
  /** 持久化的背景效果选择：空串 = 跟随主题默认（与主题正交，切主题不会重置它） */
  desiredBackground: string;
  /** 壁纸 MD3 主题运行时；null = 尚无取色数据 */
  photoTheme: WallpaperTheme | null;
  /** 持久化的全局圆角（画廊挂载时作初值） */
  desiredRadius: number;
  /** 当前覆盖层 disposer（撤销 = 回官方配色） */
  overrideDispose: (() => void) | null;
  /** apply 作用域的 body 渐变渲染桥（Gallery 的 theme/change 监听复调） */
  renderBodyGradient: (() => void) | null;
}

export const state: ClientState = {
  desiredId: '',
  desiredBackground: '',
  photoTheme: null,
  desiredRadius: -1,
  overrideDispose: null,
  renderBodyGradient: null,
};
