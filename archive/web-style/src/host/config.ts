/**
 * 配置：默认值 / schemastery schema（可写字段 volatile）/ 读取与路由消毒
 *
 * - 官方 settings 命名空间 `dshp-web-style`（与包名/路由前缀/cordis id 一致）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 一次性自动导入）；
 *   可被 UI/路由写入的字段全部 `.volatile()`，写入原地生效不重启插件
 * - 只认 NS：历史命名空间 `dshp-inx-custom-ui` 不再读写、不再重命名
 * - 主题白名单从目录（themes/index.ts）动态派生 + 虚拟 `photo:custom`
 * - 本插件不写任何自有文件：配置只进条目 config NS
 *
 * @module @dshp/web-style
 */
import z from '@deepseek-ai/schemastery';
import { THEME_IDS } from './themes/index.js';
import { settingsNamespace } from './http.js';
import type { PhotoPalette, RadiusConfig, StyleConfig } from './types.js';

export const NS: string = settingsNamespace('dshp-web-style');

/** 虚拟主题：壁纸取色（MD3 运行时生成，不在目录内，但属于合法持久化值）。 */
export const PHOTO_THEME_ID = 'photo:custom';

/** 本插件支持的全部主题 id：主题目录 + 虚拟 photo:custom。未知 id 视为空（回内置）。 */
const KNOWN_THEME_IDS: Set<string> = new Set([...THEME_IDS, PHOTO_THEME_ID]);

/**
 * 背景效果 id 白名单。真源是 client 侧登记表（`src/client/background.ts` 的 BACKGROUNDS），
 * 这里独立列一份是因为持久化校验必须在 Host 做（红线：外部输入要消毒），而两半是两个 bundle、
 * 没有共享模块。scripts/check-themes.mjs 会钉住「每个 id 都出现在 client 产物里」，
 * 漏登记或漏构建当场失败。
 */
export const BACKGROUND_IDS = ['harness-dots', 'aurora', 'flow'] as const;

const KNOWN_BACKGROUND_IDS: Set<string> = new Set<string>(BACKGROUND_IDS);

/** 默认值（settings base 层）。 */
export const DEFAULT_CONFIG: StyleConfig = {
  themeId: '',
  backgroundId: '',
  photoPalette: null,
  radius: { global: -1 },
  // 背景壁纸（wallpaper.*）与毛玻璃（glass.*）是已退役的旧特性：
  // 当前 client 不再读写它们，这里仅做不透明透传，避免 settings 更新时
  // 丢掉用户 settings.yaml 里的数据。受支持的取色路径是 photoPalette
  //（上传图片 → MD3 动态配色）。
  wallpaper: {},
  glass: {},
};

export const ConfigSchema: any = z.object({
  themeId: z.string().default('').volatile(),
  backgroundId: z.string().default('').volatile(),
  photoPalette: z
    .union([
      z.object({
        accent: z.string().pattern(/^#[0-9a-fA-F]{6}$/),
        companionA: z.string().pattern(/^#[0-9a-fA-F]{6}$/),
        companionB: z.string().pattern(/^#[0-9a-fA-F]{6}$/),
      }),
      z.const(null),
    ])
    .default(null)
    .volatile(),
  radius: z
    .object({
      global: z.number().step(1).min(-1).max(24).default(-1),
    })
    .default({ global: -1 })
    .volatile(),
  wallpaper: z.dict(z.any()).default({}),
  glass: z.dict(z.any()).default({}),
});

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 主题 id：目录白名单（含 photo:custom）内才收，其余一律退回「跟随官方」。 */
export function sanitizeThemeId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  return KNOWN_THEME_IDS.has(v) ? v : '';
}

/** 背景效果 id：白名单内才收，其余一律退回「跟随主题」（空串）。 */
export function sanitizeBackgroundId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  return KNOWN_BACKGROUND_IDS.has(v) ? v : '';
}

/** 壁纸调色盘：必须三个 #rrggbb；非法与「显式 null」都返回 null（调用方需自行区分）。 */
export function sanitizePhotoPalette(value: unknown): PhotoPalette | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;
  const { accent, companionA, companionB } = value;
  if (typeof accent !== 'string' || !HEX6.test(accent)) return null;
  if (typeof companionA !== 'string' || !HEX6.test(companionA)) return null;
  if (typeof companionB !== 'string' || !HEX6.test(companionB)) return null;
  return { accent, companionA, companionB };
}

/** 圆角补丁：只取 global，夹到 [-1, 24] 的整数；无有效字段返回 null。 */
export function sanitizeRadius(value: unknown): Partial<RadiusConfig> | null {
  if (!isRecord(value)) return null;
  const out: Partial<RadiusConfig> = {};
  if (Object.hasOwn(value, 'global')) {
    const n = Number(value['global']);
    if (Number.isFinite(n)) out.global = Math.min(24, Math.max(-1, Math.round(n)));
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** 退役特性字段：只保留普通对象（数组/标量一律回空对象），不做深校验。 */
export function sanitizeOpaque(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  return {};
}
