/**
 * md3.ts —— Material You (MD3) 壁纸取色引擎（client 半唯一一份）
 *
 * 从用户上传的壁纸提取 seed 色，生成整套 MD3 色彩系统：
 *   1. 壁纸缩到 48×48，逐像素采色；
 *   2. 饱和度过滤后在 HSL 空间按色相分 12 桶，加权选出 seed；
 *   3. seed 派生 6 组 ref 调色板（primary / secondary / tertiary / neutral /
 *      neutral-variant + 固定 error 红；色调号≈明度%，HSL 近似非 HCT）；
 *   4. 按 MD3 基线映射 light / dark 两套 sys 色彩；
 *   5. sys 色彩再映射为 DSH overrideTokens 所需的 --dsw-* token。
 *
 * 导出格式兼容 MD3 令牌命名：--md-ref-palette-* + --md-sys-color-*-light/dark。
 * 持久化只存 { accent(seed), companionA, companionB }（seed 恒等于 accent，
 * 旧数据兼容：旧 accent 直接当 seed 重建整套 MD3 主题）。
 *
 * 原实现：dsh-custom-ui/client.js 内联引擎（与 lib/themes/photo.js 同源重复）。
 * TS 版只保留本处一份——Host 半从未引用 photo 引擎，双份手工同步到此结束。
 *
 * @module @dshp/web-style/client
 */
import type { TokenMap } from './types.js';

/** 一套 ref 调色板：色调号 → hex。 */
export type M3ToneMap = Record<number, string>;

/** MD3 ref 调色板名。 */
export type M3RefName = 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'neutralVariant' | 'error';

/** seed + 6 组 ref 调色板。 */
export interface M3Palettes {
  seed: string;
  primary: M3ToneMap;
  secondary: M3ToneMap;
  tertiary: M3ToneMap;
  neutral: M3ToneMap;
  neutralVariant: M3ToneMap;
  error: M3ToneMap;
}

/** MD3 sys 色彩角色（= buildM3Scheme 的键）。 */
export type M3SchemeRole =
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'background'
  | 'onBackground'
  | 'surfaceDim'
  | 'surface'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'onSurface'
  | 'onSurfaceVariant'
  | 'outline'
  | 'outlineVariant'
  | 'shadow'
  | 'scrim'
  | 'inverseSurface'
  | 'inverseOnSurface'
  | 'inversePrimary'
  | 'surfaceTint';

/** 一套 sys 色彩（角色 → hex）。 */
export type M3Scheme = Record<M3SchemeRole, string>;

/** 壁纸主题运行时：seed + 调色板 + 亮/暗两套 DSH token。 */
export interface WallpaperTheme {
  seed: string;
  palettes: M3Palettes;
  dark: TokenMap;
  light: TokenMap;
}

/** buildPhotoTokens 可接受的入参：调色板 / seed 串 / 持久化调色盘。 */
export type PhotoSeedInput = M3Palettes | string | { seed?: string; accent: string };

/** hex → {h,s,l}（0-360 / 0-1 / 0-1）。 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, l };
}

/** hsl → hex。 */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  const seg = Math.floor(h / 60);
  if (seg === 0) {
    r = c;
    g = x;
  } else if (seg === 1) {
    r = x;
    g = c;
  } else if (seg === 2) {
    g = c;
    b = x;
  } else if (seg === 3) {
    g = x;
    b = c;
  } else if (seg === 4) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const to = (v: number): string =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

/** rgba 数值 → hex。 */
export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number): string =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

/** hex → rgba() 字符串。 */
export function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

/** 两个 hex 的线性混合：a 朝 b 走 t（t=0 → a，t=1 → b）。 */
export function mixHex(a: string, b: string, t: number): string {
  const ch = (h: string, i: number): number => parseInt(h.slice(i, i + 2), 16);
  return rgbToHex(
    ch(a, 1) + (ch(b, 1) - ch(a, 1)) * t,
    ch(a, 3) + (ch(b, 3) - ch(a, 3)) * t,
    ch(a, 5) + (ch(b, 5) - ch(a, 5)) * t,
  );
}

/** 色相分桶累加器。 */
interface HueBucket {
  count: number;
  r: number;
  g: number;
  b: number;
  sat: number;
}

/** 从 ImageData 提取 seed 色（饱和度加权 + 色相分桶）；全灰图兜底默认蓝。 */
export function extractDominant(data: Uint8ClampedArray | number[]): string {
  const buckets: HueBucket[] = Array.from({ length: 12 }, () => ({ count: 0, r: 0, g: 0, b: 0, sat: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] as number;
    const g = data[i + 1] as number;
    const b = data[i + 2] as number;
    const { h, s, l } = hexToHsl(rgbToHex(r, g, b));
    if (s < 0.15 || l < 0.06 || l > 0.96) continue; // 跳过灰/黑/白
    const bucket = buckets[Math.floor(h / 30) % 12] as HueBucket;
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.sat += s;
  }
  let best: HueBucket | null = null;
  let bestScore = 0;
  for (const bucket of buckets) {
    if (bucket.count === 0) continue;
    const score = bucket.count * (0.3 + bucket.sat / bucket.count);
    if (score > bestScore) {
      bestScore = score;
      best = bucket;
    }
  }
  if (!best) return '#3b82f6'; // 全灰图兜底：默认蓝
  return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count);
}

/**
 * 从 canvas ImageData 生成持久化调色盘。
 * accent 恒等于 seed（settings 兼容字段）；companions 仅作信息性派生。
 */
export function extractPalette(data: Uint8ClampedArray | number[]): {
  accent: string;
  companionA: string;
  companionB: string;
} {
  const seed = extractDominant(data);
  const seedHsl = hexToHsl(seed);
  return {
    accent: seed,
    companionA: hslToHex(seedHsl.h + 60, Math.min(0.85, seedHsl.s), 0.52),
    companionB: hslToHex(seedHsl.h, Math.min(0.5, seedHsl.s * 0.45), 0.5),
  };
}

/** MD3 ref 调色板色调号全集（含 expressive 容器色调）。 */
export const M3_TONES: number[] = [
  0, 4, 6, 10, 12, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100,
];

/** 预览条展示的色调号子集。 */
export const M3_PREVIEW_TONES: number[] = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

/** ref 调色板顺序（导出 CSS 与构造顺序都用它）。 */
export const M3_REF_ORDER: M3RefName[] = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
  'error',
];

/** sys 角色顺序（导出 CSS 用；与 MD3 令牌命名一一对应）。 */
export const M3_SYS_ORDER: M3SchemeRole[] = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surfaceDim',
  'surface',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'onSurface',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'surfaceTint',
];

/** ref 名 → MD3 令牌名。 */
export const M3_REF_NAMES: Record<M3RefName, string> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  neutral: 'neutral',
  neutralVariant: 'neutral-variant',
  error: 'error',
};

/** sys 角色 → MD3 令牌名。 */
export const M3_SYS_NAMES: Record<M3SchemeRole, string> = {
  primary: 'primary',
  onPrimary: 'on-primary',
  primaryContainer: 'primary-container',
  onPrimaryContainer: 'on-primary-container',
  secondary: 'secondary',
  onSecondary: 'on-secondary',
  secondaryContainer: 'secondary-container',
  onSecondaryContainer: 'on-secondary-container',
  tertiary: 'tertiary',
  onTertiary: 'on-tertiary',
  tertiaryContainer: 'tertiary-container',
  onTertiaryContainer: 'on-tertiary-container',
  error: 'error',
  onError: 'on-error',
  errorContainer: 'error-container',
  onErrorContainer: 'on-error-container',
  background: 'background',
  onBackground: 'on-background',
  surfaceDim: 'surface-dim',
  surface: 'surface',
  surfaceBright: 'surface-bright',
  surfaceContainerLowest: 'surface-container-lowest',
  surfaceContainerLow: 'surface-container-low',
  surfaceContainer: 'surface-container',
  surfaceContainerHigh: 'surface-container-high',
  surfaceContainerHighest: 'surface-container-highest',
  onSurface: 'on-surface',
  onSurfaceVariant: 'on-surface-variant',
  outline: 'outline',
  outlineVariant: 'outline-variant',
  shadow: 'shadow',
  scrim: 'scrim',
  inverseSurface: 'inverse-surface',
  inverseOnSurface: 'inverse-on-surface',
  inversePrimary: 'inverse-primary',
  surfaceTint: 'surface-tint',
};

/** 色调号 → hex（0/100 两端固定纯黑纯白，其余按明度近似）。 */
function m3Tone(h: number, s: number, t: number): string {
  if (t <= 0) return '#000000';
  if (t >= 100) return '#ffffff';
  return hslToHex(h, s, t / 100);
}

/**
 * 取调色板某色调号。M3_TONES 是闭集，buildM3Palettes 必然填满每个号，
 * 因此这里的收窄是安全的（noUncheckedIndexedAccess 下的显式断言）。
 */
function tone(pal: M3ToneMap, t: number): string {
  return pal[t] as string;
}

function isPalettes(v: unknown): v is M3Palettes {
  return v !== null && typeof v === 'object' && 'primary' in v;
}

/**
 * seed → seed + 6 组 ref 调色板（每组色调号 → hex）。
 * primary 保底饱和；secondary 降饱和；tertiary 色相 +60；
 * neutral 近无彩；neutral-variant 弱彩；error 固定 MD3 红。
 */
export function buildM3Palettes(seed: string): M3Palettes {
  const { h, s } = hexToHsl(seed);
  const clampS = (v: number): number => Math.min(0.9, Math.max(0, v));
  const defs: Record<M3RefName, { h: number; s: number }> = {
    primary: { h, s: clampS(Math.max(s, 0.45)) },
    secondary: { h, s: clampS(s * 0.45) },
    tertiary: { h: (h + 60) % 360, s: clampS(Math.max(s * 0.6, 0.3)) },
    neutral: { h, s: clampS(Math.min(s * 0.12, 0.08)) },
    neutralVariant: { h, s: clampS(Math.min(Math.max(s * 0.3, 0.1), 0.2)) },
    error: { h: 4, s: 0.72 },
  };
  const pal: M3Palettes = {
    seed,
    primary: {},
    secondary: {},
    tertiary: {},
    neutral: {},
    neutralVariant: {},
    error: {},
  };
  for (const key of M3_REF_ORDER) {
    const tones: M3ToneMap = {};
    for (const t of M3_TONES) tones[t] = m3Tone(defs[key].h, defs[key].s, t);
    pal[key] = tones;
  }
  return pal;
}

/** ref 调色板 → MD3 基线 sys 色彩（light / dark）。 */
export function buildM3Scheme(pal: M3Palettes, scheme: 'light' | 'dark'): M3Scheme {
  const P = pal.primary;
  const S = pal.secondary;
  const T = pal.tertiary;
  const N = pal.neutral;
  const NV = pal.neutralVariant;
  const E = pal.error;
  if (scheme === 'dark') {
    return {
      primary: tone(P, 80),
      onPrimary: tone(P, 20),
      primaryContainer: tone(P, 30),
      onPrimaryContainer: tone(P, 90),
      secondary: tone(S, 80),
      onSecondary: tone(S, 20),
      secondaryContainer: tone(S, 30),
      onSecondaryContainer: tone(S, 90),
      tertiary: tone(T, 80),
      onTertiary: tone(T, 20),
      tertiaryContainer: tone(T, 30),
      onTertiaryContainer: tone(T, 90),
      error: tone(E, 80),
      onError: tone(E, 20),
      errorContainer: tone(E, 30),
      onErrorContainer: tone(E, 90),
      background: tone(N, 6),
      onBackground: tone(N, 90),
      surfaceDim: tone(N, 6),
      surface: tone(N, 6),
      surfaceBright: tone(N, 24),
      surfaceContainerLowest: tone(N, 4),
      surfaceContainerLow: tone(N, 10),
      surfaceContainer: tone(N, 12),
      surfaceContainerHigh: tone(N, 17),
      surfaceContainerHighest: tone(N, 22),
      onSurface: tone(N, 90),
      onSurfaceVariant: tone(NV, 80),
      outline: tone(NV, 60),
      outlineVariant: tone(NV, 30),
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: tone(N, 90),
      inverseOnSurface: tone(N, 20),
      inversePrimary: tone(P, 40),
      surfaceTint: tone(P, 80),
    };
  }
  return {
    primary: tone(P, 40),
    onPrimary: tone(P, 100),
    primaryContainer: tone(P, 90),
    onPrimaryContainer: tone(P, 10),
    secondary: tone(S, 40),
    onSecondary: tone(S, 100),
    secondaryContainer: tone(S, 90),
    onSecondaryContainer: tone(S, 10),
    tertiary: tone(T, 40),
    onTertiary: tone(T, 100),
    tertiaryContainer: tone(T, 90),
    onTertiaryContainer: tone(T, 10),
    error: tone(E, 40),
    onError: tone(E, 100),
    errorContainer: tone(E, 90),
    onErrorContainer: tone(E, 10),
    background: tone(N, 99),
    onBackground: tone(N, 10),
    surfaceDim: tone(N, 87),
    surface: tone(N, 99),
    surfaceBright: tone(N, 100),
    surfaceContainerLowest: tone(N, 100),
    surfaceContainerLow: tone(N, 96),
    surfaceContainer: tone(N, 94),
    surfaceContainerHigh: tone(N, 92),
    surfaceContainerHighest: tone(N, 90),
    onSurface: tone(N, 10),
    onSurfaceVariant: tone(NV, 30),
    outline: tone(NV, 50),
    outlineVariant: tone(NV, 80),
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: tone(N, 20),
    inverseOnSurface: tone(N, 95),
    inversePrimary: tone(P, 80),
    surfaceTint: tone(P, 40),
  };
}

/**
 * seed → MD3 导出 CSS（--md-ref-palette-* + --md-sys-color-*-light/dark）。
 * 与 MD3 色彩令牌命名规范兼容，可直接粘贴进任何 MD3 项目。
 */
export function buildM3ExportCss(seed: string): string {
  const pal = buildM3Palettes(seed);
  const lines = [':root {', '  /* seed: ' + seed + ' · Material You (MD3) · exported by dshp-web-style */'];
  for (const key of M3_REF_ORDER) {
    for (const t of M3_TONES)
      lines.push('  --md-ref-palette-' + M3_REF_NAMES[key] + t + ': ' + tone(pal[key], t) + ';');
  }
  const schemes: Record<'light' | 'dark', M3Scheme> = {
    light: buildM3Scheme(pal, 'light'),
    dark: buildM3Scheme(pal, 'dark'),
  };
  for (const sk of ['light', 'dark'] as const) {
    lines.push('  /* sys-' + sk + ' */');
    const roles = schemes[sk];
    for (const role of M3_SYS_ORDER) {
      lines.push('  --md-sys-color-' + M3_SYS_NAMES[role] + '-' + sk + ': ' + roles[role] + ';');
    }
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * MD3 sys 色彩 → DSH 单侧 --dsw-* token（overrideTokens pair 前的单侧形态）。
 * 入参可为 ref 调色板 / seed 串 / 持久化调色盘（seed 恒等于 accent，兼容旧数据）。
 * body 渐变经 --dshp-ws-body-gradient 注入（renderBodyGradient 消费）。
 */
export function buildPhotoTokens(input: PhotoSeedInput, scheme: 'light' | 'dark'): TokenMap {
  const pal: M3Palettes = isPalettes(input)
    ? input
    : buildM3Palettes(typeof input === 'string' ? input : (input.seed ?? input.accent));
  const m = buildM3Scheme(pal, scheme);
  const dark = scheme === 'dark';

  const brand = m.primary;
  const brandHover = dark ? tone(pal.primary, 70) : tone(pal.primary, 30);
  const info = m.tertiary;
  const infoHover = dark ? tone(pal.tertiary, 70) : tone(pal.tertiary, 30);
  const textPrimary = m.onSurface;
  const textSecondary = withAlpha(m.onSurface, dark ? 0.8 : 0.72);
  const textTertiary = m.onSurfaceVariant;
  const textQuaternary = m.outline;
  const border1 = m.outlineVariant;
  const border2 = m.outline;
  const hover = m.surfaceContainerHighest;
  /*
   * 侧栏选中行底色 = 品牌色 22% 叠色，跟随壁纸取出的主色。
   * 原为 m.surfaceContainerHigh —— 与 hover（surfaceContainerHighest）是 MD3 的
   * 相邻两档，实测 ΔE < 5，选中态几乎看不出；33 套静态主题同批改成该规则
   * （见 src/host/themes/*.ts 与 scripts/check-themes.mjs 的派生校验）。
   */
  const active = withAlpha(brand, 0.22);
  const err = m.error;
  const ok = dark ? '#4ade80' : '#16a34a';
  /* PDF / 文档预览面板：官方两档都是暗画布（neutral-bluish-750 / 950），浅色档由表面压向墨色得到。 */
  const docCanvas = dark ? m.surface : mixHex(m.surface, textPrimary, 0.82);

  return {
    // 背景
    '--dsw-alias-bg-base': m.surface,
    '--dsw-alias-bg-layer-1': m.surfaceContainerLow,
    '--dsw-alias-bg-layer-2': m.surfaceContainer,
    '--dsw-alias-bg-layer-3': m.surfaceContainerHigh,
    '--dsw-alias-bg-overlay': m.surfaceContainerLow,
    '--dsw-alias-bg-multi-select': m.surfaceContainer,
    '--dsw-alias-bg-module-platform': m.surfaceContainerLow,
    '--dsw-alias-bg-skeleton': m.surfaceContainer,

    // 边框
    '--dsw-alias-border-l1': border1,
    '--dsw-alias-border-l2': border2,
    '--dsw-alias-border-l2-darkmode-thin': border1,
    '--dsw-alias-border-l3': border2,
    '--dsw-alias-border-l4': dark ? textTertiary : border2,
    '--dsw-alias-border-inverted': textPrimary,
    '--dsw-alias-border-inverted2': textSecondary,
    '--dsw-alias-separator-primary': border1,
    '--dsw-alias-line-secondary': m.surfaceContainer,
    '--dsw-alias-fill-l2': m.surfaceContainer,
    '--dsw-alias-fill-tsp-secondary': withAlpha(m.onSurface, dark ? 0.05 : 0.04),

    // 品牌
    '--dsw-alias-brand-primary': brand,
    '--dsw-alias-brand-primary-invert': m.onPrimary,
    '--dsw-alias-brand-text': brand,

    // 按钮
    '--dsw-alias-button-primary-fill': brand,
    '--dsw-alias-button-primary-hover': brandHover,
    '--dsw-alias-button-primary-dimmed': brandHover,
    '--dsw-alias-button-contrast-fill': m.onSurface,
    '--dsw-alias-button-elevated-fill': m.surfaceContainerLow,
    '--dsw-alias-button-floating-fill': m.surfaceContainerLow,
    '--dsw-alias-button-floating-hover': m.surfaceContainer,
    '--dsw-alias-button-ghost-active-border': border2,
    '--dsw-alias-button-ghost-active-fill': hover,
    '--dsw-alias-button-ghost-active-hover': active,
    '--dsw-alias-button-info-fill': info,
    '--dsw-alias-button-info-hover': infoHover,
    '--dsw-alias-button-tool-bar-fill': m.surfaceContainerLow,
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': hover,

    // 交互
    '--dsw-alias-interactive-bg-hover': hover,
    '--dsw-alias-interactive-bg-active': active,
    '--dsw-alias-interactive-bg-hover-accent': withAlpha(brand, dark ? 0.2 : 0.12),
    '--dsw-alias-interactive-bg-hover-danger': withAlpha(err, dark ? 0.18 : 0.1),
    '--dsw-alias-interactive-bg-hover-solid': active,

    // 文字
    '--dsw-alias-label-primary': textPrimary,
    '--dsw-alias-label-secondary': textSecondary,
    '--dsw-alias-label-tertiary': textTertiary,
    '--dsw-alias-label-quaternary': textQuaternary,
    '--dsw-alias-label-caption': textTertiary,
    '--dsw-alias-label-dimmed': textQuaternary,
    '--dsw-alias-label-error': err,
    // on-primary 墨色（按钮文字/Switch 滑块/Checkbox 勾）：深色档必须是品牌底上的深墨，不能取 onSurface
    '--dsw-alias-label-primary-foreground': dark ? m.onPrimary : '#ffffff',
    '--dsw-alias-label-primary-inverted': dark ? m.surface : '#ffffff',
    '--dsw-alias-label-primary-bluish': brand,

    // 语义
    '--dsw-alias-state-error-primary': err,
    '--dsw-alias-state-error-secondary': withAlpha(err, dark ? 0.15 : 0.1),
    '--dsw-alias-state-success-primary': ok,
    '--dsw-alias-state-success-secondary': withAlpha('#22c55e', dark ? 0.15 : 0.1),
    '--dsw-alias-state-warn-primary': dark ? '#fbbf24' : '#d97706',
    '--dsw-alias-state-warn-secondary': withAlpha('#f59e0b', dark ? 0.15 : 0.1),
    '--dsw-alias-state-warn-label': dark ? '#fbbf24' : '#b45309',

    /* 0.1.7-rc.1 新增：diff 视图 / 文档预览 / 空闲态（派生规则见 themes/shared.ts 头注释） */
    '--dsw-alias-state-idle-primary': mixHex(textPrimary, m.surface, 0.75),
    '--dsw-alias-code-diff-added': withAlpha(ok, dark ? 0.12 : 0.08),
    '--dsw-alias-code-diff-deleted': withAlpha(err, dark ? 0.12 : 0.08),
    '--dsw-alias-file-diff-added-bg': mixHex(m.surfaceContainerLow, ok, dark ? 0.14 : 0.12),
    '--dsw-alias-file-diff-added-gutter': mixHex(m.surfaceContainerLow, ok, dark ? 0.07 : 0.05),
    '--dsw-alias-file-diff-added-marker': ok,
    '--dsw-alias-file-diff-deleted-bg': mixHex(m.surfaceContainerLow, err, dark ? 0.14 : 0.12),
    '--dsw-alias-file-diff-deleted-gutter': mixHex(m.surfaceContainerLow, err, dark ? 0.07 : 0.05),
    '--dsw-alias-file-diff-deleted-marker': err,
    '--dsw-alias-bg-document-preview': docCanvas,
    '--dsw-alias-label-document-preview': mixHex(docCanvas, '#ffffff', 0.82),

    // Markdown
    '--dsw-alias-markdown-citation': brand,
    '--dsw-alias-markdown-code-block': m.surfaceContainerLow,
    '--dsw-alias-markdown-code-block-banner': m.surfaceContainer,
    '--dsw-alias-markdown-inline-code': withAlpha(brand, dark ? 0.14 : 0.1),
    '--dsw-alias-markdown-code-segment-selected': withAlpha(brand, dark ? 0.25 : 0.16),
    '--dsw-alias-markdown-code-segment-unselected': 'transparent',
    '--dsw-alias-markdown-placeholder': textQuaternary,
    // --dsw-alias-markdown-tag 有意不覆盖：它是活动标签页底色（见 themes/shared.ts 头注释），
    // 按前景语义填中灰会把标签页压成灰块，交给官方值。

    // 滚动条
    '--dsw-alias-scrollbar-bg-l1': border2,
    '--dsw-alias-scrollbar-bg-l2': m.surfaceContainer,
    '--dsw-alias-scrollbar-hover-l1': textTertiary,
    '--dsw-alias-scrollbar-hover-l2': border2,

    // 浮层
    '--dsw-alias-toast-bg': m.inverseSurface,
    /* 0.2.0-rc.2 新增：toast 文字色。官方给的是静态白；壁纸主题的 toast 面是
       inverseSurface（亮档深、暗档浅），文字必须取它的对色 inverseOnSurface。 */
    '--dsw-alias-toast-label': m.inverseOnSurface,
    '--dsw-alias-tooltip-bg': m.inverseSurface,
    '--dsw-hovercard-bg': m.surfaceContainerLow,

    // 特定区域
    '--dsw-specific-sidebar-fill': m.surface,
    '--dsw-specific-sidebar-nav-item-active': active,
    '--dsw-specific-sidebar-nav-item-active-accent': brand,
    '--dsw-specific-sidebar-nav-item-hover': hover,
    '--dsw-specific-bubble': m.surfaceContainerLow,
    '--dsw-specific-bubble-highlight': m.surfaceContainer,
    '--dsw-specific-input-major': m.surfaceContainerLow,
    '--dsw-specific-login-input': m.surfaceContainerLow,
    '--dsw-specific-menu': withAlpha(m.surfaceContainer, dark ? 0.8 : 0.82),
    '--dsw-specific-selector': m.surfaceContainer,
    '--dsw-specific-tip': m.surfaceContainer,

    // 阴影
    '--dsw-shadow-lv1': dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
    '--dsw-shadow-lv2': dark ? '0 4px 16px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.08)',
    '--dsw-shadow-lv3': dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)',
    '--dsw-shadow-lv1-blur': '8px',

    // 自定义：body 渐变（renderBodyGradient 消费）
    '--dshp-ws-body-gradient': dark
      ? 'radial-gradient(1000px 600px at 85% -10%, ' +
        withAlpha(m.tertiary, 0.16) +
        ', transparent 55%), radial-gradient(900px 560px at 8% 108%, ' +
        withAlpha(m.secondary, 0.13) +
        ', transparent 58%), linear-gradient(180deg, ' +
        m.surface +
        ', ' +
        tone(pal.neutral, 4) +
        ')'
      : 'radial-gradient(1000px 600px at 85% -10%, ' +
        withAlpha(m.tertiary, 0.22) +
        ', transparent 55%), radial-gradient(900px 560px at 8% 108%, ' +
        withAlpha(m.secondary, 0.18) +
        ', transparent 58%), linear-gradient(180deg, ' +
        m.surface +
        ', ' +
        tone(pal.neutral, 96) +
        ')',

    '--dsw-font-family':
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    '--dsw-font-mono':
      '"Berkeley Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  };
}

/** seed → 壁纸主题运行时 { seed, palettes, dark, light }。 */
export function buildWallpaperTheme(seed: string): WallpaperTheme {
  const palettes = buildM3Palettes(seed);
  return {
    seed,
    palettes,
    dark: buildPhotoTokens(palettes, 'dark'),
    light: buildPhotoTokens(palettes, 'light'),
  };
}

/** 图片 File → 调色盘（48×48 canvas 采样）。 */
export function paletteFromFile(
  file: File,
): Promise<{ accent: string; companionA: string; companionB: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.addEventListener('load', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const c2d = canvas.getContext('2d', { willReadFrequently: true });
        if (!c2d) throw new Error('canvas 2d 上下文不可用');
        c2d.drawImage(img, 0, 0, 48, 48);
        const data = c2d.getImageData(0, 0, 48, 48).data;
        resolve(extractPalette(data));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    });
    img.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解码失败'));
    });
    img.src = url;
  });
}
