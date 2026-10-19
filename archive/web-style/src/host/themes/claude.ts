/**
 * claude.ts —— Claude 羊皮纸（纯 light）。
 *
 * 参考 open-design/design-systems/claude：
 *   - 羊皮纸 #f5f4ed 画布（永不用纯白）+ 象牙 #faf9f5 卡片面 + 暖沙 #e8e6dc
 *   - 赤陶 #c96442 是唯一品牌彩色——泥土感、去科技感
 *   - 全部灰阶带黄褐底，无冷蓝灰；Error Crimson #b53333 是暖红
 *   - Anthropic Sans（UI）/ Anthropic Serif（标题，本主题只用 Sans 层）
 *   - ring 型深度（0 0 0 1px）而非传统投影
 */

import { CLAUDE_SANS, MONO, fillFontTokens, type ThemeMetaMap } from './shared.js';

export const light = fillFontTokens(
  {
    '--dsw-alias-bg-base': '#f5f4ed',
    '--dsw-alias-bg-layer-1': '#faf9f5',
    '--dsw-alias-bg-layer-2': '#f0eee6',
    '--dsw-alias-bg-layer-3': '#e8e6dc',
    '--dsw-alias-bg-overlay': '#faf9f5',
    '--dsw-alias-bg-multi-select': '#faf9f5',
    '--dsw-alias-bg-module-platform': '#faf9f5',
    '--dsw-alias-bg-skeleton': '#f0eee6',

    /* 奶油色调边框 —— 最温柔的围合 */
    '--dsw-alias-border-l1': '#f0eee6',
    '--dsw-alias-border-l2': '#e8e6dc',
    '--dsw-alias-border-l2-darkmode-thin': '#f0eee6',
    '--dsw-alias-border-l3': '#dcd9ce',
    '--dsw-alias-border-l4': '#c9c5b8',
    '--dsw-alias-border-inverted': '#141413',
    '--dsw-alias-border-inverted2': '#3d3d3a',
    '--dsw-alias-separator-primary': '#f0eee6',
    '--dsw-alias-fill-l2': '#f0eee6',
    '--dsw-alias-fill-tsp-secondary': 'rgba(20, 20, 19, 0.04)',

    /* 赤陶品牌色 */
    '--dsw-alias-brand-primary': '#c96442',
    '--dsw-alias-brand-primary-invert': '#faf9f5',
    '--dsw-alias-brand-text': '#c96442',
    '--dsw-alias-link': '#c96442',

    '--dsw-alias-button-primary-fill': '#c96442',
    '--dsw-alias-button-primary-hover': '#b5573a',
    '--dsw-alias-button-primary-dimmed': '#b5573a',
    '--dsw-alias-button-contrast-fill': '#141413',
    '--dsw-alias-button-elevated-fill': '#faf9f5',
    '--dsw-alias-button-floating-fill': '#faf9f5',
    '--dsw-alias-button-floating-hover': '#f0eee6',
    '--dsw-alias-button-ghost-active-border': '#dcd9ce',
    '--dsw-alias-button-ghost-active-fill': '#e8e6dc',
    '--dsw-alias-button-ghost-active-hover': '#dcd9ce',
    '--dsw-alias-button-info-fill': '#c96442',
    '--dsw-alias-button-info-hover': '#b5573a',
    '--dsw-alias-button-tool-bar-fill': '#faf9f5',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': '#f0eee6',

    '--dsw-alias-interactive-bg-hover': '#f0eee6',
    '--dsw-alias-interactive-bg-active': '#e8e6dc',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(201, 100, 66, 0.10)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(181, 51, 51, 0.08)',
    '--dsw-alias-interactive-bg-hover-solid': '#e8e6dc',

    /* 每一档灰都带黄褐底 —— Claude 的"最暖科技灰" */
    '--dsw-alias-label-primary': '#141413',
    '--dsw-alias-label-secondary': '#3d3d3a',
    '--dsw-alias-label-tertiary': '#5e5d59',
    '--dsw-alias-label-quaternary': '#87867f',
    '--dsw-alias-label-caption': '#5e5d59',
    '--dsw-alias-label-dimmed': '#87867f',
    '--dsw-alias-label-error': '#b53333',
    '--dsw-alias-label-primary-foreground': '#faf9f5',
    '--dsw-alias-label-primary-inverted': '#faf9f5',
    '--dsw-alias-label-primary-bluish': '#c96442',

    '--dsw-alias-state-business-primary': '#c96442',
    '--dsw-alias-state-business-tertiary': 'rgba(201, 100, 66, 0.10)',
    '--dsw-alias-state-error-primary': '#b53333',
    '--dsw-alias-state-error-secondary': 'rgba(181, 51, 51, 0.08)',
    '--dsw-alias-state-success-primary': '#17a34a',
    '--dsw-alias-state-success-secondary': 'rgba(23, 163, 74, 0.10)',
    '--dsw-alias-state-warn-primary': '#eab308',
    '--dsw-alias-state-warn-secondary': 'rgba(234, 179, 8, 0.10)',
    '--dsw-alias-state-warn-label': '#b8860b',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': '#bdbcb7',
    '--dsw-alias-code-diff-added': 'rgba(23, 163, 74, 0.08)',
    '--dsw-alias-code-diff-deleted': 'rgba(181, 51, 51, 0.08)',
    '--dsw-alias-file-diff-added-bg': '#dfefe0',
    '--dsw-alias-file-diff-added-gutter': '#eff5ec',
    '--dsw-alias-file-diff-added-marker': '#17a34a',
    '--dsw-alias-file-diff-deleted-bg': '#f2e1de',
    '--dsw-alias-file-diff-deleted-gutter': '#f7efeb',
    '--dsw-alias-file-diff-deleted-marker': '#b53333',
    '--dsw-alias-bg-document-preview': '#3d3c3a',
    '--dsw-alias-label-document-preview': '#dcdcdc',

    '--dsw-alias-markdown-citation': '#c96442',
    '--dsw-alias-markdown-code-block': '#f0eee6',
    '--dsw-alias-markdown-code-block-banner': '#e8e6dc',
    '--dsw-alias-markdown-inline-code': 'rgba(201, 100, 66, 0.08)',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(201, 100, 66, 0.12)',
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': '#87867f',

    '--dsw-alias-scrollbar-bg-l1': '#dcd9ce',
    '--dsw-alias-scrollbar-bg-l2': '#e8e6dc',
    '--dsw-alias-scrollbar-hover-l1': '#c9c5b8',
    '--dsw-alias-scrollbar-hover-l2': '#dcd9ce',

    '--dsw-alias-toast-bg': '#faf9f5',
    /* 0.2.0-rc.2 新增：toast 文字色（官方此前硬编码白字，浅色 toast 面会白底白字） */
    '--dsw-alias-toast-label': '#141413',
    '--dsw-alias-tooltip-bg': '#31302e',
    '--dsw-hovercard-bg': '#faf9f5',
    '--dsw-specific-sidebar-fill': '#f0eee6',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(201, 100, 66, 0.22)',
    '--dsw-specific-sidebar-nav-item-active-accent': '#c96442',
    '--dsw-specific-sidebar-nav-item-hover': '#f0eee6',
    '--dsw-specific-bubble': '#faf9f5',
    '--dsw-specific-bubble-highlight': '#f0eee6',
    '--dsw-specific-input-major': '#faf9f5',
    '--dsw-specific-login-input': '#faf9f5',
    '--dsw-specific-menu': 'rgba(250, 249, 245, 0.82)',
    '--dsw-specific-selector': '#faf9f5',
    /* dock 面板（任务列表 / 目标条）是随 scheme 走的普通面，取自己的 layer-2；
       此前误填了 --dsw-alias-tooltip-bg 那种反色浮层的值，亮色下会渲染成深灰 */
    '--dsw-specific-tip': '#f0eee6',

    /* ring 型深度 —— 0 0 0 1px 的围合而非投影 */
    '--dsw-shadow-lv1': '0 0 0 1px #e8e6dc',
    '--dsw-shadow-lv2': '0 0 0 1px #dcd9ce',
    '--dsw-shadow-lv3': '0 0 0 1px #c9c5b8',
    '--dsw-shadow-lv1-blur': '0px',

    '--dsw-font-family': CLAUDE_SANS,
    '--dsw-font-mono': MONO,
  },
  CLAUDE_SANS,
);

export const meta: ThemeMetaMap = {
  light: {
    id: 'claude-parchment-light',
    label: 'Claude 羊皮纸',
    desc: '羊皮纸 #f5f4ed + 赤陶 #c96442',
    swatch: ['#f5f4ed', '#faf9f5', '#c96442', '#141413'],
  },
};
