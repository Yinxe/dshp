/**
 * arc.ts —— Arc 蜜桃珊瑚（纯 light）。
 *
 * 参考 open-design/design-systems/arc：
 *   - 蜜桃奶油 #fdf3ec 画布（永不纯白）+ 磨砂白卡片 #ffffff
 *   - 珊瑚 #ef4a4a 品牌色（arc.net 营销主色，日落渐变的锚点）
 *   - 暖调发丝描边 #ece5db，墨字三档皆偏暖
 *   - 系统无衬线字体（产品侧无衬线，营销衬线此处不用）
 */

import { SANS, MONO, FLAT_SHADOWS, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const light = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#fdf3ec',
    '--dsw-alias-bg-layer-1': '#ffffff',
    '--dsw-alias-bg-layer-2': '#fff4ea',
    '--dsw-alias-bg-layer-3': '#fbe7d8',
    '--dsw-alias-bg-overlay': '#ffffff',
    '--dsw-alias-bg-multi-select': '#ffffff',
    '--dsw-alias-bg-module-platform': '#ffffff',
    '--dsw-alias-bg-skeleton': '#ffffff',

    '--dsw-alias-border-l1': '#f6f0e8',
    '--dsw-alias-border-l2': '#ece5db',
    '--dsw-alias-border-l2-darkmode-thin': '#f6f0e8',
    '--dsw-alias-border-l3': '#d3c2ae',
    '--dsw-alias-border-l4': '#8c8c93',
    '--dsw-alias-border-inverted': '#1a1a1f',
    '--dsw-alias-border-inverted2': '#54545a',
    '--dsw-alias-separator-primary': '#f6f0e8',
    '--dsw-alias-fill-l2': '#fff4ea',
    '--dsw-alias-fill-tsp-secondary': 'rgba(26, 26, 31, 0.04)',

    /* 珊瑚：营销主色，CTA 与高光 */
    '--dsw-alias-brand-primary': '#ef4a4a',
    '--dsw-alias-brand-primary-invert': '#ffffff',
    '--dsw-alias-brand-text': '#ef4a4a',
    '--dsw-alias-link': '#ef4a4a',

    '--dsw-alias-button-primary-fill': '#ef4a4a',
    '--dsw-alias-button-primary-hover': '#e23c3c',
    '--dsw-alias-button-primary-dimmed': '#d43535',
    '--dsw-alias-button-contrast-fill': '#1a1a1f',
    '--dsw-alias-button-elevated-fill': '#ffffff',
    '--dsw-alias-button-floating-fill': '#ffffff',
    '--dsw-alias-button-floating-hover': '#fff4ea',
    '--dsw-alias-button-ghost-active-border': '#ece5db',
    '--dsw-alias-button-ghost-active-fill': '#fff4ea',
    '--dsw-alias-button-ghost-active-hover': '#fbe7d8',
    '--dsw-alias-button-info-fill': '#ef4a4a',
    '--dsw-alias-button-info-hover': '#e23c3c',
    '--dsw-alias-button-tool-bar-fill': '#ffffff',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#fff4ea',

    '--dsw-alias-interactive-bg-hover': '#fff4ea',
    '--dsw-alias-interactive-bg-active': '#fbe7d8',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(239, 74, 74, 0.10)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(245, 101, 101, 0.08)',
    '--dsw-alias-interactive-bg-hover-solid': '#fbe7d8',

    '--dsw-alias-label-primary': '#1a1a1f',
    '--dsw-alias-label-secondary': '#54545a',
    '--dsw-alias-label-tertiary': '#8c8c93',
    '--dsw-alias-label-quaternary': '#d3c2ae',
    '--dsw-alias-label-caption': '#8c8c93',
    '--dsw-alias-label-dimmed': '#d3c2ae',
    '--dsw-alias-label-error': '#d94f4f',
    '--dsw-alias-label-primary-foreground': '#ffffff',
    '--dsw-alias-label-primary-inverted': '#ffffff',
    '--dsw-alias-label-primary-bluish': '#ef4a4a',

    '--dsw-alias-state-business-primary': '#ef4a4a',
    '--dsw-alias-state-business-tertiary': 'rgba(239, 74, 74, 0.10)',
    /* 高 saturation 的珊瑚/蜜橙在浅底压暗，保证文字可读 */
    '--dsw-alias-state-error-primary': '#d94f4f',
    '--dsw-alias-state-error-secondary': 'rgba(245, 101, 101, 0.08)',
    '--dsw-alias-state-success-primary': '#2f9e63',
    '--dsw-alias-state-success-secondary': 'rgba(72, 187, 120, 0.10)',
    '--dsw-alias-state-warn-primary': '#9a6700',
    '--dsw-alias-state-warn-secondary': 'rgba(246, 173, 85, 0.10)',
    '--dsw-alias-state-warn-label': '#9a6700',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#c4bdb9',
    '--dsw-alias-code-diff-added': 'rgba(47, 158, 99, 0.08)',
    '--dsw-alias-code-diff-deleted': 'rgba(217, 79, 79, 0.08)',
    '--dsw-alias-file-diff-added-bg': '#e6f3ec',
    '--dsw-alias-file-diff-added-gutter': '#f5faf7',
    '--dsw-alias-file-diff-added-marker': '#2f9e63',
    '--dsw-alias-file-diff-deleted-bg': '#faeaea',
    '--dsw-alias-file-diff-deleted-gutter': '#fdf6f6',
    '--dsw-alias-file-diff-deleted-marker': '#d94f4f',
    '--dsw-alias-bg-document-preview': '#434144',
    '--dsw-alias-label-document-preview': '#dddddd',

    '--dsw-alias-markdown-citation': '#ef4a4a',
    '--dsw-alias-markdown-code-block': '#ffffff',
    '--dsw-alias-markdown-code-block-banner': '#fff4ea',
    '--dsw-alias-markdown-inline-code': 'rgba(239, 74, 74, 0.08)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(239, 74, 74, 0.12)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': '#d3c2ae',

    '--dsw-alias-scrollbar-bg-l1': '#ece5db',
    '--dsw-alias-scrollbar-bg-l2': '#fbe7d8',
    '--dsw-alias-scrollbar-hover-l1': '#d3c2ae',
    '--dsw-alias-scrollbar-hover-l2': '#ece5db',

    '--dsw-alias-toast-bg': '#ffffff',
    /* 0.2.0-rc.2 新增：toast 文字色（官方此前硬编码白字，浅色 toast 面会白底白字） */
    '--dsw-alias-toast-label': '#1a1a1f',
    '--dsw-alias-tooltip-bg': '#1a1a1f',
    '--dsw-hovercard-bg': '#ffffff',

    '--dsw-specific-sidebar-fill': '#fdf3ec',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(239, 74, 74, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#ef4a4a',
    '--dsw-specific-sidebar-nav-item-hover': '#fff4ea',
    '--dsw-specific-bubble': '#ffffff',
    '--dsw-specific-bubble-highlight': '#fff4ea',
    '--dsw-specific-input-major': '#ffffff',
    '--dsw-specific-login-input': '#ffffff',
    '--dsw-specific-menu': 'rgba(255, 255, 255, 0.82)',
    '--dsw-specific-selector': '#ffffff',
    '--dsw-specific-tip': '#fff4ea',

    '--dsw-font-family': SANS,
    '--dsw-font-mono': MONO,
    ...FLAT_SHADOWS,
  },
  SANS,
);

export const meta: ThemeMetaMap = {
  light: {
    id: 'arc-light',
    label: 'Arc 蜜桃珊瑚',
    desc: '蜜桃 #fdf3ec + 珊瑚 #ef4a4a',
    swatch: ['#fdf3ec', '#ffffff', '#ef4a4a', '#1a1a1f'],
  },
};
