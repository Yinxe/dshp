/**
 * index.ts —— 主题目录：聚合全部主题为统一注册清单。
 *
 * 每套主题文件导出 { dark?, light?, meta }（meta.dark / meta.light 含
 * id / label / desc / swatch）。单模式主题只贡献自己那一份。
 * photo:custom 是虚拟主题（壁纸取色 MD3 运行时生成，不在目录内，
 * 由 Host 白名单与 client 半另行处理）。
 *
 * 原实现：dsh-custom-ui/lib/themes/index.js（JS），本文件为等价 TS 重写。
 *
 * @module @dshp/web-style/themes
 */
import * as claude from './claude.js';
import * as supabase from './supabase.js';
import * as sakura from './sakura.js';
import * as xiaohongshu from './xiaohongshu.js';
import * as levels from './levels.js';
import * as arc from './arc.js';
import * as luxury from './luxury.js';
import * as harnessOffice from './harness-office.js';
import type { ThemeCatalogEntry, ThemeModule } from './shared.js';

/**
 * 展开一套主题模块为注册条目。
 * 一个模块可能贡献 1~2 个主题（按其 dark/light 导出与 meta 决定）。
 */
function expand(module: ThemeModule): ThemeCatalogEntry[] {
  const entries: ThemeCatalogEntry[] = [];
  for (const scheme of ['dark', 'light'] as const) {
    const tokens = scheme === 'dark' ? module.dark : module.light;
    const meta = scheme === 'dark' ? module.meta?.dark : module.meta?.light;
    if (!tokens || !meta) continue;
    entries.push({ colorScheme: scheme, tokens, ...meta });
  }
  return entries;
}

/**
 * 全部主题注册清单（顺序与 client 画廊展示顺序一致；Host 仅用 id 白名单 + token 下发）。
 * 首项是 token 契约的基准（check-themes.mjs 拿它的键集比对其它主题），新主题一律追加在末尾。
 */
export const THEME_CATALOG: ThemeCatalogEntry[] = [
  ...expand(claude),
  ...expand(levels),
  ...expand(arc),
  ...expand(luxury),
  ...expand(xiaohongshu),
  ...expand(supabase),
  ...expand(sakura),
  ...expand(harnessOffice),
];

/** 目录内全部主题 id（Host 白名单与 scripts/check-themes.mjs 共用）。 */
export const THEME_IDS: string[] = THEME_CATALOG.map((t) => t.id);
