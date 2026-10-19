/**
 * levels.ts —— Levels 纸感评审（纯 light）。
 *
 * 参考 open-design/design-systems/levels：
 *   - 米纸奶油 #fbf7ef 画布 + 纯白卡片，评审卡片式节奏
 *   - 代谢绿 #2f8f46 品牌信号（CTA/激活/营养卡强调）
 *   - 鼠尾草灰绿描边 #dbe3d7，薄荷暖层 #eef7ed
 *   - 系统无衬线字体
 */

import { SANS, MONO, FLAT_SHADOWS, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const light = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#fbf7ef',
    '--dsw-alias-bg-layer-1': '#ffffff',
    '--dsw-alias-bg-layer-2': '#eef7ed',
    '--dsw-alias-bg-layer-3': '#e2ecdf',
    '--dsw-alias-bg-overlay': '#ffffff',
    '--dsw-alias-bg-multi-select': '#ffffff',
    '--dsw-alias-bg-module-platform': '#ffffff',
    '--dsw-alias-bg-skeleton': '#ffffff',

    '--dsw-alias-border-l1': '#edf1ea',
    '--dsw-alias-border-l2': '#dbe3d7',
    '--dsw-alias-border-l2-darkmode-thin': '#edf1ea',
    '--dsw-alias-border-l3': '#a3b89d',
    '--dsw-alias-border-l4': '#788276',
    '--dsw-alias-border-inverted': '#1f2a24',
    '--dsw-alias-border-inverted2': '#435147',
    '--dsw-alias-separator-primary': '#edf1ea',
    '--dsw-alias-fill-l2': '#eef7ed',
    '--dsw-alias-fill-tsp-secondary': 'rgba(31, 42, 36, 0.04)',

    /* 代谢绿：CTA 与健康信号 */
    '--dsw-alias-brand-primary': '#2f8f46',
    '--dsw-alias-brand-primary-invert': '#ffffff',
    '--dsw-alias-brand-text': '#2f8f46',
    '--dsw-alias-link': '#2f8f46',

    '--dsw-alias-button-primary-fill': '#2f8f46',
    '--dsw-alias-button-primary-hover': '#2b8440',
    '--dsw-alias-button-primary-dimmed': '#287b3c',
    '--dsw-alias-button-contrast-fill': '#1f2a24',
    '--dsw-alias-button-elevated-fill': '#ffffff',
    '--dsw-alias-button-floating-fill': '#ffffff',
    '--dsw-alias-button-floating-hover': '#eef7ed',
    '--dsw-alias-button-ghost-active-border': '#dbe3d7',
    '--dsw-alias-button-ghost-active-fill': '#eef7ed',
    '--dsw-alias-button-ghost-active-hover': '#e2ecdf',
    '--dsw-alias-button-info-fill': '#2f8f46',
    '--dsw-alias-button-info-hover': '#2b8440',
    '--dsw-alias-button-tool-bar-fill': '#ffffff',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#eef7ed',

    '--dsw-alias-interactive-bg-hover': '#eef7ed',
    '--dsw-alias-interactive-bg-active': '#e2ecdf',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(47, 143, 70, 0.10)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(220, 38, 38, 0.08)',
    '--dsw-alias-interactive-bg-hover-solid': '#e2ecdf',

    '--dsw-alias-label-primary': '#1f2a24',
    '--dsw-alias-label-secondary': '#435147',
    '--dsw-alias-label-tertiary': '#788276',
    '--dsw-alias-label-quaternary': '#a3b89d',
    '--dsw-alias-label-caption': '#788276',
    '--dsw-alias-label-dimmed': '#a3b89d',
    '--dsw-alias-label-error': '#dc2626',
    '--dsw-alias-label-primary-foreground': '#ffffff',
    '--dsw-alias-label-primary-inverted': '#ffffff',
    '--dsw-alias-label-primary-bluish': '#2f8f46',

    '--dsw-alias-state-business-primary': '#2f8f46',
    '--dsw-alias-state-business-tertiary': 'rgba(47, 143, 70, 0.10)',
    '--dsw-alias-state-error-primary': '#dc2626',
    '--dsw-alias-state-error-secondary': 'rgba(220, 38, 38, 0.08)',
    '--dsw-alias-state-success-primary': '#16a34a',
    '--dsw-alias-state-success-secondary': 'rgba(22, 163, 74, 0.10)',
    '--dsw-alias-state-warn-primary': '#d97706',
    '--dsw-alias-state-warn-secondary': 'rgba(217, 119, 6, 0.10)',
    '--dsw-alias-state-warn-label': '#d97706',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#c4c4bc',
    '--dsw-alias-code-diff-added': 'rgba(22, 163, 74, 0.08)',
    '--dsw-alias-code-diff-deleted': 'rgba(220, 38, 38, 0.08)',
    '--dsw-alias-file-diff-added-bg': '#e3f4e9',
    '--dsw-alias-file-diff-added-gutter': '#f3faf6',
    '--dsw-alias-file-diff-added-marker': '#16a34a',
    '--dsw-alias-file-diff-deleted-bg': '#fbe5e5',
    '--dsw-alias-file-diff-deleted-gutter': '#fdf4f4',
    '--dsw-alias-file-diff-deleted-marker': '#dc2626',
    '--dsw-alias-bg-document-preview': '#474f49',
    '--dsw-alias-label-document-preview': '#dedfde',

    '--dsw-alias-markdown-citation': '#2f8f46',
    '--dsw-alias-markdown-code-block': '#ffffff',
    '--dsw-alias-markdown-code-block-banner': '#eef7ed',
    '--dsw-alias-markdown-inline-code': 'rgba(47, 143, 70, 0.08)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(47, 143, 70, 0.12)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': '#a3b89d',

    '--dsw-alias-scrollbar-bg-l1': '#dbe3d7',
    '--dsw-alias-scrollbar-bg-l2': '#e2ecdf',
    '--dsw-alias-scrollbar-hover-l1': '#a3b89d',
    '--dsw-alias-scrollbar-hover-l2': '#dbe3d7',

    '--dsw-alias-toast-bg': '#ffffff',
    /* 0.2.0-rc.2 新增：toast 文字色（官方此前硬编码白字，浅色 toast 面会白底白字） */
    '--dsw-alias-toast-label': '#1f2a24',
    '--dsw-alias-tooltip-bg': '#1f2a24',
    '--dsw-hovercard-bg': '#ffffff',

    '--dsw-specific-sidebar-fill': '#fbf7ef',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(47, 143, 70, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#2f8f46',
    '--dsw-specific-sidebar-nav-item-hover': '#eef7ed',
    '--dsw-specific-bubble': '#ffffff',
    '--dsw-specific-bubble-highlight': '#eef7ed',
    '--dsw-specific-input-major': '#ffffff',
    '--dsw-specific-login-input': '#ffffff',
    '--dsw-specific-menu': 'rgba(255, 255, 255, 0.82)',
    '--dsw-specific-selector': '#ffffff',
    '--dsw-specific-tip': '#eef7ed',

    '--dsw-font-family': SANS,
    '--dsw-font-mono': MONO,
    ...FLAT_SHADOWS,
  },
  SANS,
);

export const meta: ThemeMetaMap = {
  light: {
    id: 'levels-light',
    label: 'Levels 纸感评审',
    desc: '米纸 #fbf7ef + 代谢绿 #2f8f46',
    swatch: ['#fbf7ef', '#ffffff', '#2f8f46', '#1f2a24'],
  },
};
