/**
 * xiaohongshu.ts —— 小红书 种草红（纯 light）。
 *
 * 参考 open-design/design-systems/xiaohongshu：
 *   - 米灰 #f5f5f5 画布 + 纯白卡片（靠色差而非阴影 lift）
 *   - 种草红 #ff2442 是唯一饱和色（CTA / 点赞 / 激活），悬停 #ff2e4d，按压 #e6203a
 *   - 危险态复用品牌红；中性色全用半透明黑叠层；系统无衬线字体
 */

import { SANS, MONO, FLAT_SHADOWS, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const light = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#f5f5f5',
    '--dsw-alias-bg-layer-1': '#ffffff',
    '--dsw-alias-bg-layer-2': '#fafafa',
    '--dsw-alias-bg-layer-3': '#efefef',
    '--dsw-alias-bg-overlay': '#ffffff',
    '--dsw-alias-bg-multi-select': '#fafafa',
    '--dsw-alias-bg-module-platform': '#ffffff',
    '--dsw-alias-bg-skeleton': '#fafafa',

    '--dsw-alias-border-l1': 'rgba(0, 0, 0, 0.05)',
    '--dsw-alias-border-l2': 'rgba(0, 0, 0, 0.08)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(0, 0, 0, 0.05)',
    '--dsw-alias-border-l3': 'rgba(0, 0, 0, 0.20)',
    '--dsw-alias-border-l4': 'rgba(0, 0, 0, 0.27)',
    '--dsw-alias-border-inverted': 'rgba(0, 0, 0, 0.8)',
    '--dsw-alias-border-inverted2': 'rgba(0, 0, 0, 0.62)',
    '--dsw-alias-separator-primary': 'rgba(0, 0, 0, 0.05)',
    '--dsw-alias-fill-l2': 'rgba(0, 0, 0, 0.05)',
    '--dsw-alias-fill-tsp-secondary': 'rgba(0, 0, 0, 0.04)',

    /* 种草红：唯一饱和色 */
    '--dsw-alias-brand-primary': '#ff2442',
    '--dsw-alias-brand-primary-invert': '#ffffff',
    '--dsw-alias-brand-text': '#ff2442',
    '--dsw-alias-link': '#ff2442',

    '--dsw-alias-button-primary-fill': '#ff2442',
    '--dsw-alias-button-primary-hover': '#ff2e4d',
    '--dsw-alias-button-primary-dimmed': '#e6203a',
    '--dsw-alias-button-contrast-fill': 'rgba(0, 0, 0, 0.8)',
    '--dsw-alias-button-elevated-fill': '#ffffff',
    '--dsw-alias-button-floating-fill': '#ffffff',
    '--dsw-alias-button-floating-hover': '#fafafa',
    '--dsw-alias-button-ghost-active-border': 'rgba(0, 0, 0, 0.08)',
    '--dsw-alias-button-ghost-active-fill': '#fafafa',
    '--dsw-alias-button-ghost-active-hover': '#efefef',
    '--dsw-alias-button-info-fill': '#ff2442',
    '--dsw-alias-button-info-hover': '#ff2e4d',
    '--dsw-alias-button-tool-bar-fill': '#ffffff',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#fafafa',

    '--dsw-alias-interactive-bg-hover': '#fafafa',
    '--dsw-alias-interactive-bg-active': '#f0f0f0',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(255, 36, 66, 0.10)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(255, 36, 66, 0.10)',
    '--dsw-alias-interactive-bg-hover-solid': '#f0f0f0',

    '--dsw-alias-label-primary': 'rgba(0, 0, 0, 0.8)',
    '--dsw-alias-label-secondary': 'rgba(0, 0, 0, 0.62)',
    '--dsw-alias-label-tertiary': 'rgba(0, 0, 0, 0.45)',
    '--dsw-alias-label-quaternary': 'rgba(0, 0, 0, 0.27)',
    '--dsw-alias-label-caption': 'rgba(0, 0, 0, 0.45)',
    '--dsw-alias-label-dimmed': 'rgba(0, 0, 0, 0.27)',
    '--dsw-alias-label-error': '#ff2442',
    '--dsw-alias-label-primary-foreground': '#ffffff',
    '--dsw-alias-label-primary-inverted': '#ffffff',
    '--dsw-alias-label-primary-bluish': '#ff2442',

    '--dsw-alias-state-business-primary': '#ff2442',
    '--dsw-alias-state-business-tertiary': 'rgba(255, 36, 66, 0.10)',
    /* 危险态复用品牌红（官方明确决策） */
    '--dsw-alias-state-error-primary': '#ff2442',
    '--dsw-alias-state-error-secondary': 'rgba(255, 36, 66, 0.10)',
    '--dsw-alias-state-success-primary': '#02b940',
    '--dsw-alias-state-success-secondary': 'rgba(2, 185, 64, 0.10)',
    '--dsw-alias-state-warn-primary': '#ff7d03',
    '--dsw-alias-state-warn-secondary': 'rgba(255, 125, 3, 0.10)',
    '--dsw-alias-state-warn-label': '#9a6700',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#c4c4c4',
    '--dsw-alias-code-diff-added': 'rgba(2, 185, 64, 0.08)',
    '--dsw-alias-code-diff-deleted': 'rgba(255, 36, 66, 0.08)',
    '--dsw-alias-file-diff-added-bg': '#e1f7e8',
    '--dsw-alias-file-diff-added-gutter': '#f2fcf5',
    '--dsw-alias-file-diff-added-marker': '#02b940',
    '--dsw-alias-file-diff-deleted-bg': '#ffe5e8',
    '--dsw-alias-file-diff-deleted-gutter': '#fff4f6',
    '--dsw-alias-file-diff-deleted-marker': '#ff2442',
    '--dsw-alias-bg-document-preview': '#545454',
    '--dsw-alias-label-document-preview': '#e0e0e0',

    '--dsw-alias-markdown-citation': '#ff2442',
    '--dsw-alias-markdown-code-block': '#ffffff',
    '--dsw-alias-markdown-code-block-banner': '#fafafa',
    '--dsw-alias-markdown-inline-code': 'rgba(255, 36, 66, 0.08)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(255, 36, 66, 0.12)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': 'rgba(0, 0, 0, 0.27)',

    '--dsw-alias-scrollbar-bg-l1': 'rgba(0, 0, 0, 0.08)',
    '--dsw-alias-scrollbar-bg-l2': '#f0f0f0',
    '--dsw-alias-scrollbar-hover-l1': 'rgba(0, 0, 0, 0.27)',
    '--dsw-alias-scrollbar-hover-l2': 'rgba(0, 0, 0, 0.08)',

    '--dsw-alias-toast-bg': '#ffffff',
    /* 0.2.0-rc.2 新增：toast 文字色（官方此前硬编码白字，浅色 toast 面会白底白字） */
    '--dsw-alias-toast-label': 'rgba(0, 0, 0, 0.8)',
    '--dsw-alias-tooltip-bg': 'rgba(0, 0, 0, 0.8)',
    '--dsw-hovercard-bg': '#ffffff',

    '--dsw-specific-sidebar-fill': '#f5f5f5',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(255, 36, 66, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#ff2442',
    '--dsw-specific-sidebar-nav-item-hover': '#fafafa',
    '--dsw-specific-bubble': '#ffffff',
    '--dsw-specific-bubble-highlight': '#fafafa',
    '--dsw-specific-input-major': '#ffffff',
    '--dsw-specific-login-input': '#ffffff',
    '--dsw-specific-menu': 'rgba(255, 255, 255, 0.82)',
    '--dsw-specific-selector': '#ffffff',
    '--dsw-specific-tip': '#fafafa',

    '--dsw-font-family': SANS,
    '--dsw-font-mono': MONO,
    ...FLAT_SHADOWS,
  },
  SANS,
);

export const meta: ThemeMetaMap = {
  light: {
    id: 'xiaohongshu-light',
    label: '小红书 种草红',
    desc: '米灰 #f5f5f5 + 种草红 #ff2442',
    swatch: ['#f5f5f5', '#ffffff', '#ff2442', 'rgba(0, 0, 0, 0.8)'],
  },
};
