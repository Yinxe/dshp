/**
 * themes.ts —— client 画廊主题 meta（token 由 Host 下发，这里只存展示信息）。
 *
 * swatch：卡片三色拼接 + 搜索 accent（= src/host/themes 各模块 meta.swatch）；
 * token 单源 src/host/themes，client 只按需向 GET /themes 要，绝不内联进 bundle。
 * 顺序即画廊展示顺序，必须与 Host 目录（src/host/themes/index.ts）逐项一致——
 * scripts/check-themes.mjs 会校验，不一致直接非零退出。
 *
 * 原实现：dsh-custom-ui/client.js 内联 THEMES（已去掉不再使用的 group 字段）。
 *
 * @module @dshp/web-style/client
 */
import type { ThemeMeta } from './types.js';

export const THEMES: ThemeMeta[] = [
  {
    id: 'claude-parchment-light',
    colorScheme: 'light',
    label: 'Claude 羊皮纸',
    desc: '羊皮纸 #f5f4ed + 赤陶 #c96442',
    swatch: ['#f5f4ed', '#faf9f5', '#c96442', '#141413'],
  },
  {
    id: 'levels-light',
    colorScheme: 'light',
    label: 'Levels 纸感评审',
    desc: '米纸 #fbf7ef + 代谢绿 #2f8f46',
    swatch: ['#fbf7ef', '#ffffff', '#2f8f46', '#1f2a24'],
  },
  {
    id: 'arc-light',
    colorScheme: 'light',
    label: 'Arc 蜜桃珊瑚',
    desc: '蜜桃 #fdf3ec + 珊瑚 #ef4a4a',
    swatch: ['#fdf3ec', '#ffffff', '#ef4a4a', '#1a1a1f'],
  },
  {
    id: 'luxury-dark',
    colorScheme: 'dark',
    label: 'Luxury 鎏金黑',
    desc: '曜石 #080706 + 鎏金 #c6a15b',
    swatch: ['#080706', '#151310', '#c6a15b', '#fff8ea'],
  },
  {
    id: 'xiaohongshu-light',
    colorScheme: 'light',
    label: '小红书 种草红',
    desc: '米灰 #f5f5f5 + 种草红 #ff2442',
    swatch: ['#f5f5f5', '#ffffff', '#ff2442', 'rgba(0, 0, 0, 0.8)'],
  },
  {
    id: 'supabase-dark',
    colorScheme: 'dark',
    label: 'Supabase 翡翠夜',
    desc: '墨黑 #171717 + 翡翠绿 #3ecf8e',
    swatch: ['#171717', '#1c1c1c', '#3ecf8e', '#fafafa'],
  },
  {
    id: 'sakura-light',
    colorScheme: 'light',
    label: 'Sakura 樱粉',
    desc: '樱白 #fff9fa + 樱粉 #e75480',
    swatch: ['#fff9fa', '#fbeef2', '#e75480', '#432635'],
  },
  {
    id: 'harness-office',
    colorScheme: 'dark',
    label: 'Harness 官网',
    desc: '曜黑 #0a0a0a + 官网蓝 #6799fe · 可交互点阵',
    swatch: ['#0a0a0a', '#1a3870', '#6799fe', '#ffffff'],
  },
];

/** 内置主题的画廊显示名（light/dark 也能在画廊里被切回）。 */
export const BUILTIN_LABELS: Record<'light' | 'dark', string> = {
  light: '浅色（内置）',
  dark: '深色（内置）',
};

/** 壁纸取色虚拟主题 id（与 Host 白名单的 photo:custom 一致）。 */
export const PHOTO_ID = 'photo:custom';
