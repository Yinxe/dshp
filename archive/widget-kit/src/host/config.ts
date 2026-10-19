/**
 * 配置：默认值 / schemastery schema（volatile）/ 路由补丁消毒
 *
 * 这里存的是**用户配置**（0.1.7 起落 profile `cordis.patch.yml` 条目 `config:` 分节；
 * 旧 settings.yaml 由 dsh 一次性自动导入）；
 * **本机布局**（托盘顺序、卡片位置尺寸、隐藏集合）在浏览器 localStorage，不经 Host。
 * 只认 NS，不做历史 key / 旧文件迁移。
 *
 * @module @dshp/widget-kit/host/config
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from './http.js';
import type { FrameworkConfig, FrameworkConfigPatch } from './types.js';

/** 命名空间（= cordis 行 id = 路由前缀段 = 组件 id 前缀）。 */
export const NS: string = settingsNamespace('dshp-widget-kit');

/** 框架版本。必须等于 package.json 的 version（scripts/check-spec-drift.mjs 比对）。 */
export const FRAMEWORK_VERSION = '0.13.0';

/** 契约版本（与 client 侧 spec.ts 的 SPEC_VERSION 同步）。 */
export const SPEC_VERSION = 1;

/** 兜底默认值（motionMs 不进 schema，见 types.ts）。 */
export const DEFAULT_CONFIG: FrameworkConfig = {
  trayEnabled: true,
  maxVisibleIcons: 4,
  badgeIntervalMs: 30000,
  hoverPreview: true,
  referenceWidgets: true,
  // 外观默认值：70% 透明 + 5px 毛玻璃（淡底玻璃卡片）
  cardOpacity: 0.7,
  cardBlur: 5,
  cardBorder: 'auto',
  cardRadius: 'auto',
  // 动效默认 300ms（比之前写死的 120–180ms 更顺一档，也留出「关 / 更快 / 更慢」的余地）
  motionMs: 300,
};

/** 卡片边框 / 圆角样式档（与 client 半的 `types.ts` 同集合）。 */
export const CARD_BORDERS: readonly FrameworkConfig['cardBorder'][] = ['auto', 'on', 'off'];
export const CARD_RADII: readonly FrameworkConfig['cardRadius'][] = ['auto', 'round', 'square'];

/** 动效档位（与设置页选项、client 的 `SPEC_DEFAULTS.motionChoices` 一致）。 */
export const MOTION_CHOICES: readonly number[] = [0, 100, 200, 300, 400, 500];

export const ConfigSchema: any = z.object({
  trayEnabled: z.boolean().default(true).volatile(),
  maxVisibleIcons: z.number().step(1).min(1).max(8).default(4).volatile(),
  badgeIntervalMs: z.number().step(1).min(5000).max(600000).default(30000).volatile(),
  hoverPreview: z.boolean().default(true).volatile(),
  referenceWidgets: z.boolean().default(true).volatile(),
  cardOpacity: z.number().min(0.2).max(1).default(1).volatile(),
  cardBlur: z.number().step(1).min(0).max(32).default(0).volatile(),
  cardBorder: z.union(['auto', 'on', 'off']).default('auto').volatile(),
  cardRadius: z.union(['auto', 'round', 'square']).default('auto').volatile(),
});

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * 消毒 `/ext` 路由 body（只收合法字段，非法静默丢弃）。
 * 条目 `config:` 层的校验由 cordis 在装载期用 ConfigSchema 完成。
 *
 * @param raw - 未信任的输入。
 * @returns 合法字段的补丁；一个字段都没有时返回 `null`。
 */
export function sanitizePatchConfig(raw: unknown): FrameworkConfigPatch | null {
  if (!isRecord(raw)) return null;
  const out: FrameworkConfigPatch = {};
  if (Object.hasOwn(raw, 'trayEnabled')) out.trayEnabled = raw['trayEnabled'] === true;
  if (Object.hasOwn(raw, 'hoverPreview')) out.hoverPreview = raw['hoverPreview'] === true;
  if (Object.hasOwn(raw, 'referenceWidgets')) out.referenceWidgets = raw['referenceWidgets'] === true;
  if (Object.hasOwn(raw, 'maxVisibleIcons')) {
    const v = raw['maxVisibleIcons'];
    if (typeof v === 'number' && Number.isFinite(v)) {
      const n = Math.floor(v);
      if (n >= 1 && n <= 8) out.maxVisibleIcons = n;
    }
  }
  if (Object.hasOwn(raw, 'badgeIntervalMs')) {
    const v = raw['badgeIntervalMs'];
    if (typeof v === 'number' && Number.isFinite(v)) {
      const n = Math.floor(v);
      if (n >= 5000 && n <= 600000) out.badgeIntervalMs = n;
    }
  }
  if (Object.hasOwn(raw, 'cardOpacity')) {
    const v = raw['cardOpacity'];
    if (typeof v === 'number' && Number.isFinite(v)) {
      // 保留两位小数：滑块步进 0.05
      const n = Math.round(v * 100) / 100;
      if (n >= 0.2 && n <= 1) out.cardOpacity = n;
    }
  }
  if (Object.hasOwn(raw, 'cardBlur')) {
    const v = raw['cardBlur'];
    if (typeof v === 'number' && Number.isFinite(v)) {
      const n = Math.floor(v);
      if (n >= 0 && n <= 32) out.cardBlur = n;
    }
  }
  if (Object.hasOwn(raw, 'cardBorder')) {
    const v = raw['cardBorder'];
    if (v === 'auto' || v === 'on' || v === 'off') out.cardBorder = v;
  }
  if (Object.hasOwn(raw, 'cardRadius')) {
    const v = raw['cardRadius'];
    if (v === 'auto' || v === 'round' || v === 'square') out.cardRadius = v;
  }
  return Object.keys(out).length === 0 ? null : out;
}
