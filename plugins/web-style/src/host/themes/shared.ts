/**
 * shared.ts —— 主题包共享常量与工具（Host 半）
 *
 * 字体栈、字体 token 批量填充、单主题定义的通用形状。
 * 每套主题文件导出 { dark?, light?, meta }：
 *   - dark / light：`--dsw-*` token → CSS 值 的映射（不含字体批量 token，注册前填充）
 *   - meta：画廊展示元数据（id / label / desc / swatch）
 *
 * 有意不覆盖的 token（全部主题一律不定义，由官方亮/暗值直接生效）：
 *   - `--dsw-alias-markdown-tag`：DSH 里它是「活动标签页底色」（index-*.css 的
 *     `._tabActive_* { background: var(--dsw-alias-markdown-tag) }`），是面不是前景。
 *     主题若按前景语义填中灰实色，会把活动标签页压成一块灰块；故交给官方默认。
 *
 * 全局约定（新增 token 按同一口径派生，值一律写字面 hex / rgba —— 校验脚本只解析这两种）：
 *   - `--dsw-alias-label-primary-foreground` 是「画在品牌底上的墨」，不是正文色：
 *     primary 按钮文字、Switch 滑块底色、Checkbox 勾三处消费它。深色档必须相对
 *     `label-primary` 反转（官方 #f9fafb ↔ #0f1115），照抄浅色值会得到白底白字。
 *     `check-themes.mjs` 以 ≥3:1 / ≥4.5:1 双阈值把这条钉住。
 *   - 0.1.7-rc.1 新增的 11 个键（S=state-success-primary、E=state-error-primary、
 *     L1=bg-layer-1、BASE=bg-base、LBL=label-primary；tint = 朝目标线性混合）：
 *       state-idle-primary       tint(LBL → BASE, 0.75)   StateDot 的「空闲」中性点
 *       code-diff-added/-deleted rgba(S|E, 暗 0.12 / 亮 0.08)
 *       file-diff-*-bg/-gutter   tint(L1 → S|E, 0.14 / 0.07 暗，0.12 / 0.05 亮)
 *       file-diff-*-marker       S|E 本身（行号槽的字色，要保住饱和度）
 *       bg-document-preview      暗档 = BASE；亮档 tint(BASE → LBL, 0.82)
 *                                —— PDF 预览面板官方两档都是暗画布，亮档也要压暗
 *       label-document-preview   tint(canvas → #ffffff, 0.82) 暗画布上的浅灰状态字
 *   - `--dsw-specific-menu` 半透明（亮 0.82 / 暗 0.8）：rc.1 起官方给它配了
 *     `backdrop-filter: blur(40px) saturate(150%)`，填实色等于废掉官方毛玻璃。
 *   - 0.2.0-rc.2 新增的 17 个键里，**本仓只覆盖 `--dsw-alias-toast-label`**：
 *     它是 toast 文字色。官方 0.1.7 把它硬编码为 `--dsw-static-neutral-bluish-00`（白），
 *     且假定 toast 面两档都深；但本套主题把浅色档的 `toast-bg` 定成浅面（白 / 象牙 / 米色），
 *     于是白底白字。0.2.0-rc.2 抽出该 token 后，各主题显式取自己的 `label-primary`，
 *     `check-themes.mjs` 以 ≥4.5:1 把这条钉住（壁纸主题取 M3 的 `inverseOnSurface`）。
 *     其余 16 个键**有意不定义**，理由分三类（都不需要主题参与）：
 *       a) 官方值本身就是 `var(--dsw-alias-*)` 别名，引用的是本主题已覆盖的 token ——
 *          `settings-card-fill` → `bg-layer-2`、`settings-card-stroke` → `border-l4`、
 *          `turn-trigger-bg(-hover)` → `markdown-code-block` / `interactive-bg-hover(-active)`、
 *          `tooltip-key-bg` → `tooltip-bg`。CSS 自定义属性按元素惰性求值，覆盖层一改，
 *          这些别名自动跟着走，主题再写一遍只会引入第二份真相。
 *       b) 官方值是**静态色**、且语义上不该被主题改写：`bg-document-selection` 固定
 *          40% blue-500，用于「保留文档原色」的 PDF 选区，跟着主题变色等于改用户文档观感；
 *          `onboarding-*` 属于桌面首启引导（settings-account 独立版式），主题化收益低。
 *       c) 扫光/工作态（`label-shimmer`、`label-deep-diving(-shimmer)`）官方是「中性色叠 alpha」，
 *          叠在任意主题文字上都不会失效 —— 保持官方值反而与官方动效同源。
 *   - `bg-document-preview` / `label-document-preview`：0.2.0-rc.2 起官方**亮档改用浅画布**
 *     （bluish-100 + bluish-700 状态字），只有暗档仍是深画布。本套主题有意保留
 *     「预览面板恒为深色画布」（亮档 tint(BASE → LBL, 0.82)）——文档预览是独立观感区，
 *     与主题亮暗不必同向；改这条属于设计变更，不在基线同步范围内。
 *
 * 原实现：dsh-custom-ui/lib/themes/shared.js（JS），本文件为等价 TS 重写，
 * 仅补类型（TokenMap / ThemeMetaMap），常量与函数逻辑逐行对齐。
 *
 * @module @dshp/web-style/themes
 */

/** 一套主题的单 scheme token 映射（`--dsw-*` → CSS 值）。 */
export type TokenMap = Record<string, string>;

/** 单套主题（单 scheme）的画廊展示元数据。 */
export interface ThemeMetaEntry {
  /** 主题 id，全局唯一（Host 白名单与持久化值都用它）。 */
  id: string;
  label: string;
  desc: string;
  /** 卡片三色拼接 + 搜索 accent（前三位用于色块）。 */
  swatch: string[];
}

/** 一个主题模块的 meta：单模式主题只贡献自己那一份。 */
export interface ThemeMetaMap {
  dark?: ThemeMetaEntry;
  light?: ThemeMetaEntry;
}

/** 主题模块的形状（`import * as x from './x.js'` 即为该形状）。 */
export interface ThemeModule {
  dark?: TokenMap;
  light?: TokenMap;
  meta?: ThemeMetaMap;
}

/** 目录条目 = meta + scheme + 全量 token（Host 经 GET /themes 下发的形态）。 */
export interface ThemeCatalogEntry extends ThemeMetaEntry {
  colorScheme: 'dark' | 'light';
  tokens: TokenMap;
}

/** DSH 默认等宽栈（保留主题的代码面）。 */
export const MONO =
  '"Berkeley Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';
/** 通用系统无衬线栈（arc / levels / luxury / supabase / xiaohongshu / sakura）。 */
export const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
/** Claude 的 Anthropic Sans 栈。 */
export const CLAUDE_SANS = '"Anthropic Sans", "Arial", system-ui, -apple-system, sans-serif';
/**
 * Harness 官网正文栈（`--ds-font-body` = DM Sans）。字体未安装时逐级回退到
 * system-ui / PingFang SC，只有字形会变，度量与颜色不受影响。
 */
export const HARNESS_SANS =
  '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", sans-serif';
/** Harness 官网代码栈（`--ds-font-mono` = Fragment Mono）。 */
export const HARNESS_MONO =
  '"Fragment Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", monospace';

/** UI 文本字体 token 前缀集合（base-16 / l-20 / … / xxxs-strong-11）。 */
export const TEXT_STYLE_KEYS: string[] = [
  'base-16',
  'base-strong-16',
  'l-20',
  'm-18',
  's-14',
  's-strong-14',
  'xl-24',
  'xs-13',
  'xs-strong-13',
  'xxs-12',
  'xxs-strong-12',
  'xxxs-11',
  'xxxs-strong-11',
];

/** Markdown 渲染字体 token 前缀集合。 */
export const MD_STYLE_KEYS: string[] = [
  'base',
  'base-italic',
  'base-strong',
  'base-strong-italic',
  'small',
  'small-italic',
  'small-strong',
  'small-strong-italic',
  'code',
  'code-block',
  'code-block-small',
  'h1',
  'h2',
  'h3',
  'h4',
  'table',
  'table-head',
];

/**
 * 把字体批量 token 填充进一份 token 映射（原地修改）。
 *
 * `mono` 传 true 时全部文本走 MONO（opencode「一切皆代码」）；传字符串时把它当作
 * 该主题的等宽栈 —— 此时 markdown 代码块与 `--dsw-font-mono` 保持同源
 * （Roboto Mono / Geist Mono / Press Start 2P 这类主题专属等宽栈）。
 */
export function fillFontTokens(tokens: TokenMap, font: string, mono?: boolean | string): TokenMap {
  const monoStack = typeof mono === 'string' ? mono : MONO;
  const ui = mono === true ? MONO : font;
  for (const s of TEXT_STYLE_KEYS) tokens[`--dsw-font-${s}-font-family`] = ui;
  for (const m of MD_STYLE_KEYS) {
    const isCode = m === 'code' || m === 'code-block' || m === 'code-block-small';
    tokens[`--dsw-font-markdown-${m}-font-family`] = isCode ? monoStack : ui;
  }
  return tokens;
}

/** 阴影扁平化（opencode / Linear / NVIDIA / GitHub 暗色的纯 border 深度观感）。 */
export const FLAT_SHADOWS: TokenMap = {
  '--dsw-shadow-lv1': 'none',
  '--dsw-shadow-lv2': 'none',
  '--dsw-shadow-lv3': 'none',
  '--dsw-shadow-lv1-blur': '0px',
};
