/**
 * luxury.ts —— Luxury 鎏金黑（纯 dark）。
 *
 * 参考 open-design/design-systems/luxury：
 *   - 黑漆 #080706 画布 + 三层暖棕表面，香槟金只做尊贵信号
 *   - 鎏金 #c6a15b 品牌色（CTA/激活/焦点环），奶油白 #fff8ea 文字
 *   - 青铜描边 #3a3020，大字号编排此处只取色不取字
 *   - 系统无衬线字体
 */

import { SANS, MONO, FLAT_SHADOWS, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const dark = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#080706',
    '--dsw-alias-bg-layer-1': '#151310',
    '--dsw-alias-bg-layer-2': '#241e14',
    '--dsw-alias-bg-layer-3': '#322917',
    '--dsw-alias-bg-overlay': '#151310',
    '--dsw-alias-bg-multi-select': '#151310',
    '--dsw-alias-bg-module-platform': '#151310',
    '--dsw-alias-bg-skeleton': '#151310',

    '--dsw-alias-border-l1': '#282217',
    '--dsw-alias-border-l2': '#3a3020',
    '--dsw-alias-border-l2-darkmode-thin': '#282217',
    '--dsw-alias-border-l3': '#54432c',
    '--dsw-alias-border-l4': '#77663f',
    '--dsw-alias-border-inverted': '#fff8ea',
    '--dsw-alias-border-inverted2': '#d8cdb7',
    '--dsw-alias-separator-primary': '#282217',
    '--dsw-alias-fill-l2': '#241e14',
    '--dsw-alias-fill-tsp-secondary': 'rgba(255, 248, 234, 0.05)',

    /* 鎏金：尊贵信号 */
    '--dsw-alias-brand-primary': '#c6a15b',
    '--dsw-alias-brand-primary-invert': '#080706',
    '--dsw-alias-brand-text': '#c6a15b',
    '--dsw-alias-link': '#c6a15b',

    '--dsw-alias-button-primary-fill': '#c6a15b',
    '--dsw-alias-button-primary-hover': '#b69454',
    '--dsw-alias-button-primary-dimmed': '#aa8a4e',
    '--dsw-alias-button-contrast-fill': '#fff8ea',
    '--dsw-alias-button-elevated-fill': '#151310',
    '--dsw-alias-button-floating-fill': '#151310',
    '--dsw-alias-button-floating-hover': '#241e14',
    '--dsw-alias-button-ghost-active-border': '#c6a15b',
    '--dsw-alias-button-ghost-active-fill': '#241e14',
    '--dsw-alias-button-ghost-active-hover': '#322917',
    '--dsw-alias-button-info-fill': '#c6a15b',
    '--dsw-alias-button-info-hover': '#b69454',
    '--dsw-alias-button-tool-bar-fill': '#151310',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#241e14',

    '--dsw-alias-interactive-bg-hover': '#100e0a',
    '--dsw-alias-interactive-bg-active': '#241e14',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(198, 161, 91, 0.15)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(216, 90, 82, 0.15)',
    '--dsw-alias-interactive-bg-hover-solid': '#241e14',

    '--dsw-alias-label-primary': '#fff8ea',
    '--dsw-alias-label-secondary': '#d8cdb7',
    '--dsw-alias-label-tertiary': '#9f927c',
    '--dsw-alias-label-quaternary': '#6f6350',
    '--dsw-alias-label-caption': '#9f927c',
    '--dsw-alias-label-dimmed': '#6f6350',
    '--dsw-alias-label-error': '#d85a52',
    '--dsw-alias-label-primary-foreground': '#080706',
    '--dsw-alias-label-primary-inverted': '#080706',
    '--dsw-alias-label-primary-bluish': '#c6a15b',

    '--dsw-alias-state-business-primary': '#c6a15b',
    '--dsw-alias-state-business-tertiary': 'rgba(198, 161, 91, 0.15)',
    '--dsw-alias-state-error-primary': '#d85a52',
    '--dsw-alias-state-error-secondary': 'rgba(216, 90, 82, 0.15)',
    '--dsw-alias-state-success-primary': '#5fa36a',
    '--dsw-alias-state-success-secondary': 'rgba(95, 163, 106, 0.15)',
    '--dsw-alias-state-warn-primary': '#d8a94f',
    '--dsw-alias-state-warn-secondary': 'rgba(216, 169, 79, 0.15)',
    '--dsw-alias-state-warn-label': '#d8a94f',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#46433f',
    '--dsw-alias-code-diff-added': 'rgba(95, 163, 106, 0.12)',
    '--dsw-alias-code-diff-deleted': 'rgba(216, 90, 82, 0.12)',
    '--dsw-alias-file-diff-added-bg': '#1f271d',
    '--dsw-alias-file-diff-added-gutter': '#1a1d16',
    '--dsw-alias-file-diff-added-marker': '#5fa36a',
    '--dsw-alias-file-diff-deleted-bg': '#301d19',
    '--dsw-alias-file-diff-deleted-gutter': '#231815',
    '--dsw-alias-file-diff-deleted-marker': '#d85a52',
    '--dsw-alias-bg-document-preview': '#080706',
    '--dsw-alias-label-document-preview': '#d3d2d2',

    '--dsw-alias-markdown-citation': '#c6a15b',
    '--dsw-alias-markdown-code-block': '#151310',
    '--dsw-alias-markdown-code-block-banner': '#241e14',
    '--dsw-alias-markdown-inline-code': 'rgba(198, 161, 91, 0.10)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(198, 161, 91, 0.18)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': '#6f6350',

    '--dsw-alias-scrollbar-bg-l1': '#3a3020',
    '--dsw-alias-scrollbar-bg-l2': '#241e14',
    '--dsw-alias-scrollbar-hover-l1': '#54432c',
    '--dsw-alias-scrollbar-hover-l2': '#3a3020',

    '--dsw-alias-toast-bg': '#151310',
    /* 0.2.0-rc.2 新增：toast 文字色（显式钉住，不再依赖官方的静态白） */
    '--dsw-alias-toast-label': '#fff8ea',
    '--dsw-alias-tooltip-bg': '#322917',
    '--dsw-hovercard-bg': '#241e14',

    '--dsw-specific-sidebar-fill': '#080706',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(198, 161, 91, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#c6a15b',
    '--dsw-specific-sidebar-nav-item-hover': '#100e0a',
    '--dsw-specific-bubble': '#151310',
    '--dsw-specific-bubble-highlight': '#241e14',
    '--dsw-specific-input-major': '#151310',
    '--dsw-specific-login-input': '#151310',
    '--dsw-specific-menu': 'rgba(36, 30, 20, 0.8)',
    '--dsw-specific-selector': '#241e14',
    '--dsw-specific-tip': '#322917',

    '--dsw-font-family': SANS,
    '--dsw-font-mono': MONO,
    ...FLAT_SHADOWS,
  },
  SANS,
);

export const meta: ThemeMetaMap = {
  dark: {
    id: 'luxury-dark',
    label: 'Luxury 鎏金黑',
    desc: '曜石 #080706 + 鎏金 #c6a15b',
    swatch: ['#080706', '#151310', '#c6a15b', '#fff8ea'],
  },
};
