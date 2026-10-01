/**
 * sakura.ts —— Sakura 樱粉（纯 light，原创）。
 *
 * 原创配色（结构参考 open-design/design-systems/notion 的暖白骨架）：
 *   - 樱白 #fff9fa 画布 + 三层粉灰表面，春日纸感
 *   - 樱粉 #e75480 品牌信号，柔粉阴影代替生硬描边
 *   - 系统无衬线字体
 */

import { SANS, MONO, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const light = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#fff9fa',
    '--dsw-alias-bg-layer-1': '#fbeef2',
    '--dsw-alias-bg-layer-2': '#f6dee6',
    '--dsw-alias-bg-layer-3': '#efc9d6',
    '--dsw-alias-bg-overlay': '#ffffff',
    '--dsw-alias-bg-multi-select': '#fbeef2',
    '--dsw-alias-bg-module-platform': '#fbeef2',
    '--dsw-alias-bg-skeleton': '#fbeef2',

    '--dsw-alias-border-l1': '#f3dfe6',
    '--dsw-alias-border-l2': '#d9a3b5',
    '--dsw-alias-border-l2-darkmode-thin': '#f3dfe6',
    '--dsw-alias-border-l3': '#b97f92',
    '--dsw-alias-border-l4': '#8f5a6d',
    '--dsw-alias-border-inverted': '#432635',
    '--dsw-alias-border-inverted2': '#6b4256',
    '--dsw-alias-separator-primary': '#f3dfe6',
    '--dsw-alias-fill-l2': '#f6dee6',
    '--dsw-alias-fill-tsp-secondary': 'rgba(67, 38, 53, 0.04)',

    /* 樱粉：品牌信号 */
    '--dsw-alias-brand-primary': '#e75480',
    '--dsw-alias-brand-primary-invert': '#ffffff',
    '--dsw-alias-brand-text': '#e75480',
    '--dsw-alias-link': '#e75480',

    '--dsw-alias-button-primary-fill': '#e75480',
    '--dsw-alias-button-primary-hover': '#d13d6c',
    '--dsw-alias-button-primary-dimmed': '#b02a57',
    '--dsw-alias-button-contrast-fill': '#432635',
    '--dsw-alias-button-elevated-fill': '#ffffff',
    '--dsw-alias-button-floating-fill': '#ffffff',
    '--dsw-alias-button-floating-hover': '#fbeef2',
    '--dsw-alias-button-ghost-active-border': '#d9a3b5',
    '--dsw-alias-button-ghost-active-fill': '#f6dee6',
    '--dsw-alias-button-ghost-active-hover': '#efc9d6',
    '--dsw-alias-button-info-fill': '#e75480',
    '--dsw-alias-button-info-hover': '#d13d6c',
    '--dsw-alias-button-tool-bar-fill': '#fbeef2',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#f6dee6',

    '--dsw-alias-interactive-bg-hover': '#fbeef2',
    '--dsw-alias-interactive-bg-active': '#f6dee6',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(231, 84, 128, 0.10)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(207, 34, 46, 0.08)',
    '--dsw-alias-interactive-bg-hover-solid': '#f6dee6',

    '--dsw-alias-label-primary': '#432635',
    '--dsw-alias-label-secondary': '#6b4256',
    '--dsw-alias-label-tertiary': '#96707f',
    '--dsw-alias-label-quaternary': '#b99aa6',
    '--dsw-alias-label-caption': '#96707f',
    '--dsw-alias-label-dimmed': '#b99aa6',
    '--dsw-alias-label-error': '#cf222e',
    '--dsw-alias-label-primary-foreground': '#ffffff',
    '--dsw-alias-label-primary-inverted': '#ffffff',
    '--dsw-alias-label-primary-bluish': '#e75480',

    '--dsw-alias-state-business-primary': '#e75480',
    '--dsw-alias-state-business-tertiary': 'rgba(231, 84, 128, 0.10)',
    '--dsw-alias-state-error-primary': '#cf222e',
    '--dsw-alias-state-error-secondary': 'rgba(207, 34, 46, 0.08)',
    '--dsw-alias-state-success-primary': '#1a7f37',
    '--dsw-alias-state-success-secondary': 'rgba(26, 127, 55, 0.10)',
    '--dsw-alias-state-warn-primary': '#9a6700',
    '--dsw-alias-state-warn-secondary': 'rgba(154, 103, 0, 0.10)',
    '--dsw-alias-state-warn-label': '#9a6700',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#d0c4c9',
    '--dsw-alias-code-diff-added': 'rgba(26, 127, 55, 0.08)',
    '--dsw-alias-code-diff-deleted': 'rgba(207, 34, 46, 0.08)',
    '--dsw-alias-file-diff-added-bg': '#e0e1dc',
    '--dsw-alias-file-diff-added-gutter': '#f0e8e9',
    '--dsw-alias-file-diff-added-marker': '#1a7f37',
    '--dsw-alias-file-diff-deleted-bg': '#f6d6da',
    '--dsw-alias-file-diff-deleted-gutter': '#f9e4e8',
    '--dsw-alias-file-diff-deleted-marker': '#cf222e',
    '--dsw-alias-bg-document-preview': '#654c58',
    '--dsw-alias-label-document-preview': '#e3dfe1',

    '--dsw-alias-markdown-citation': '#e75480',
    '--dsw-alias-markdown-code-block': '#fbeef2',
    '--dsw-alias-markdown-code-block-banner': '#f6dee6',
    '--dsw-alias-markdown-inline-code': 'rgba(231, 84, 128, 0.08)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(231, 84, 128, 0.12)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': '#b99aa6',

    '--dsw-alias-scrollbar-bg-l1': '#efc9d6',
    '--dsw-alias-scrollbar-bg-l2': '#f6dee6',
    '--dsw-alias-scrollbar-hover-l1': '#d9a3b5',
    '--dsw-alias-scrollbar-hover-l2': '#efc9d6',

    '--dsw-alias-toast-bg': '#ffffff',
    /* 0.2.0-rc.2 新增：toast 文字色（官方此前硬编码白字，浅色 toast 面会白底白字） */
    '--dsw-alias-toast-label': '#432635',
    '--dsw-alias-tooltip-bg': '#432635',
    '--dsw-hovercard-bg': '#ffffff',

    '--dsw-specific-sidebar-fill': '#fbeef2',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(231, 84, 128, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#e75480',
    '--dsw-specific-sidebar-nav-item-hover': '#f6dee6',
    '--dsw-specific-bubble': '#fbeef2',
    '--dsw-specific-bubble-highlight': '#f6dee6',
    '--dsw-specific-input-major': '#fbeef2',
    '--dsw-specific-login-input': '#fbeef2',
    '--dsw-specific-menu': 'rgba(255, 255, 255, 0.82)',
    '--dsw-specific-selector': '#ffffff',
    '--dsw-specific-tip': '#f6dee6',

    /* 柔粉阴影（拟 notional 的 whisper 深度，带一点樱色） */
    '--dsw-shadow-lv1': '0 1px 2px rgba(231, 84, 128, 0.06)',
    '--dsw-shadow-lv2': '0 2px 6px rgba(231, 84, 128, 0.06)',
    '--dsw-shadow-lv3': '0 4px 12px rgba(231, 84, 128, 0.08)',
    '--dsw-shadow-lv1-blur': '2px',

    '--dsw-font-family': SANS,
    '--dsw-font-mono': MONO,
  },
  SANS,
);

export const meta: ThemeMetaMap = {
  light: {
    id: 'sakura-light',
    label: 'Sakura 樱粉',
    desc: '樱白 #fff9fa + 樱粉 #e75480',
    swatch: ['#fff9fa', '#fbeef2', '#e75480', '#432635'],
  },
};
