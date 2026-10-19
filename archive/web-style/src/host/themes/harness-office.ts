/**
 * harness-office.ts —— Harness 官网（纯 dark）。
 *
 * 参考 deepseek.com/harness 的 ds-* 设计令牌（官方 [data-theme=dark] 分支）：
 *   - 曜黑 #0a0a0a 画布 + 冷调分层表面，三层极光辉光 #1A3870 / #2D5F9E / #4A8AC4
 *   - 官网蓝作品牌信号（链接 / 焦点 / 激活）：深色档取 [data-theme=dark] 的 #6799fe
 *     （在 #0a0a0a 上 7.1:1；浅色档的 #4d6bfe 只有 4.6:1），主 CTA 保留官网的白底黑字
 *     —— 黑字落点是 `--dsw-alias-label-primary-foreground`（on-primary 墨，与白底同处
 *     `#0a0a0a`；曾误填成 #ffffff，于是白底白字，设置页按钮变成一块无字白胶囊）
 *   - 表面大量使用 hsla(0,0%,100%,α) 叠加而非实色，配合背景层（src/client/background.ts）
 *     透出背景——这是官网玻璃拟态的来路，不是随手写的半透明
 *   - DM Sans 正文 + Fragment Mono 代码，等宽栈与官网代码面板同源
 *
 * 动效（可交互点阵背景 + 极光辉光）不在 token 层：token 契约要求 8 套主题覆盖
 * 同一套 133 个键，多写一个键 check-themes.mjs 就红。背景效果住在 client 的
 * src/client/background-dots.ts，本主题只通过 background.ts 的 THEME_DEFAULT_EFFECT
 * 声明「用户没选时默认挂它」。
 */

import { HARNESS_SANS, HARNESS_MONO, FLAT_SHADOWS, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const dark = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#0a0a0a',
    '--dsw-alias-bg-layer-1': '#12141a',
    '--dsw-alias-bg-layer-2': '#191d26',
    '--dsw-alias-bg-layer-3': '#232836',
    '--dsw-alias-bg-overlay': '#101319',
    '--dsw-alias-bg-multi-select': '#12141a',
    '--dsw-alias-bg-module-platform': 'rgba(10, 10, 10, 0.72)',
    '--dsw-alias-bg-skeleton': 'rgba(255, 255, 255, 0.05)',

    '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.07)',
    '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.12)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(255, 255, 255, 0.08)',
    '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.2)',
    '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.26)',
    '--dsw-alias-border-inverted': '#ffffff',
    '--dsw-alias-border-inverted2': 'rgba(255, 255, 255, 0.6)',
    '--dsw-alias-separator-primary': 'rgba(255, 255, 255, 0.08)',
    '--dsw-alias-fill-l2': '#191d26',
    '--dsw-alias-fill-tsp-secondary': 'rgba(255, 255, 255, 0.06)',

    /* 官网蓝：只做品牌信号，主 CTA 交给白底黑字（官网深色档就是这么排的） */
    '--dsw-alias-brand-primary': '#6799fe',
    '--dsw-alias-brand-primary-invert': '#0a0a0a',
    '--dsw-alias-brand-text': '#6799fe',
    '--dsw-alias-link': '#6799fe',

    '--dsw-alias-button-primary-fill': '#ffffff',
    '--dsw-alias-button-primary-hover': '#e6ebfa',
    '--dsw-alias-button-primary-dimmed': '#c3cde8',
    '--dsw-alias-button-contrast-fill': '#ffffff',
    '--dsw-alias-button-elevated-fill': '#12141a',
    '--dsw-alias-button-floating-fill': '#12141a',
    '--dsw-alias-button-floating-hover': '#191d26',
    '--dsw-alias-button-ghost-active-border': '#6799fe',
    '--dsw-alias-button-ghost-active-fill': '#151a24',
    '--dsw-alias-button-ghost-active-hover': '#191d26',
    '--dsw-alias-button-info-fill': '#6799fe',
    '--dsw-alias-button-info-hover': '#85b0ff',
    '--dsw-alias-button-tool-bar-fill': '#12141a',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#191d26',

    '--dsw-alias-interactive-bg-hover': 'rgba(255, 255, 255, 0.05)',
    '--dsw-alias-interactive-bg-active': '#191d26',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(103, 153, 254, 0.16)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(248, 113, 113, 0.15)',
    '--dsw-alias-interactive-bg-hover-solid': '#191d26',

    '--dsw-alias-label-primary': '#ffffff',
    '--dsw-alias-label-secondary': 'rgba(255, 255, 255, 0.8)',
    '--dsw-alias-label-tertiary': 'rgba(255, 255, 255, 0.5)',
    '--dsw-alias-label-quaternary': 'rgba(255, 255, 255, 0.3)',
    '--dsw-alias-label-caption': 'rgba(255, 255, 255, 0.5)',
    '--dsw-alias-label-dimmed': 'rgba(255, 255, 255, 0.3)',
    '--dsw-alias-label-error': '#f87171',
    '--dsw-alias-label-primary-foreground': '#0a0a0a',
    '--dsw-alias-label-primary-inverted': '#0a0a0a',
    '--dsw-alias-label-primary-bluish': '#ffffff',

    '--dsw-alias-state-business-primary': '#6799fe',
    '--dsw-alias-state-business-tertiary': 'rgba(103, 153, 254, 0.15)',
    '--dsw-alias-state-error-primary': '#f87171',
    '--dsw-alias-state-error-secondary': 'rgba(248, 113, 113, 0.15)',
    '--dsw-alias-state-success-primary': '#46d0a0',
    '--dsw-alias-state-success-secondary': 'rgba(70, 208, 160, 0.15)',
    '--dsw-alias-state-warn-primary': '#e8b33f',
    '--dsw-alias-state-warn-secondary': 'rgba(232, 179, 63, 0.15)',
    '--dsw-alias-state-warn-label': '#e8b33f',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#474747',
    '--dsw-alias-code-diff-added': 'rgba(70, 208, 160, 0.12)',
    '--dsw-alias-code-diff-deleted': 'rgba(248, 113, 113, 0.12)',
    '--dsw-alias-file-diff-added-bg': '#192e2d',
    '--dsw-alias-file-diff-added-gutter': '#162123',
    '--dsw-alias-file-diff-added-marker': '#46d0a0',
    '--dsw-alias-file-diff-deleted-bg': '#322126',
    '--dsw-alias-file-diff-deleted-gutter': '#221b20',
    '--dsw-alias-file-diff-deleted-marker': '#f87171',
    '--dsw-alias-bg-document-preview': '#0a0a0a',
    '--dsw-alias-label-document-preview': '#d3d3d3',

    '--dsw-alias-markdown-citation': '#6799fe',
    '--dsw-alias-markdown-code-block': '#0f1218',
    '--dsw-alias-markdown-code-block-banner': '#191d26',
    '--dsw-alias-markdown-inline-code': 'rgba(103, 153, 254, 0.10)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(103, 153, 254, 0.18)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': 'rgba(255, 255, 255, 0.3)',

    '--dsw-alias-scrollbar-bg-l1': 'rgba(255, 255, 255, 0.2)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(255, 255, 255, 0.08)',
    '--dsw-alias-scrollbar-hover-l1': 'rgba(255, 255, 255, 0.32)',
    '--dsw-alias-scrollbar-hover-l2': 'rgba(255, 255, 255, 0.2)',

    '--dsw-alias-toast-bg': '#12141a',
    /* 0.2.0-rc.2 新增：toast 文字色（显式钉住，不再依赖官方的静态白） */
    '--dsw-alias-toast-label': '#ffffff',
    '--dsw-alias-tooltip-bg': '#232836',
    '--dsw-hovercard-bg': '#191d26',

    /* 侧栏压到 55% 不透明度：动效层的极光从侧栏底下透出来（官网 hero 的读法） */
    '--dsw-specific-sidebar-fill': 'rgba(10, 10, 10, 0.55)',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(103, 153, 254, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#6799fe',
    '--dsw-specific-sidebar-nav-item-hover': 'rgba(255, 255, 255, 0.05)',
    '--dsw-specific-bubble': '#12141a',
    '--dsw-specific-bubble-highlight': '#191d26',
    '--dsw-specific-input-major': 'rgba(18, 20, 26, 0.86)',
    '--dsw-specific-login-input': '#12141a',
    '--dsw-specific-menu': 'rgba(25, 29, 38, 0.8)',
    '--dsw-specific-selector': '#191d26',
    '--dsw-specific-tip': '#232836',

    '--dsw-font-family': HARNESS_SANS,
    '--dsw-font-mono': HARNESS_MONO,
    ...FLAT_SHADOWS,
  },
  HARNESS_SANS,
  HARNESS_MONO,
);

export const meta: ThemeMetaMap = {
  dark: {
    id: 'harness-office',
    label: 'Harness 官网',
    desc: '曜黑 #0a0a0a + 官网蓝 #6799fe · 可交互点阵',
    swatch: ['#0a0a0a', '#1a3870', '#6799fe', '#ffffff'],
  },
};
