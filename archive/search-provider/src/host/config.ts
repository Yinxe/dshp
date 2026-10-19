/**
 * 配置：schemastery schema 组合（volatile 声明）/ 路由与快照消毒
 *
 * - 官方 settings 命名空间 `dshp-search-provider`（与包名/路由前缀/cordis id 一致）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 一次性自动导入）；
 *   全字段 `.volatile()`（供应商分节整块 volatile），`settings.update` 写入原地生效，
 *   provider 切换由 `loader/volatile-update` 驱动即时重注册，无需重启。
 * - 供应商分节：本命名空间内的子键 = 各供应商配置（键名即 provider id），
 *   schema 由各供应商模块自述，本文件按清单动态组合（新增供应商不改这里）。
 * - 只认 NS：不读旧插件命名空间、不做任何配置采用/迁移。
 *
 * 原实现：dsh-tavily-search/lib/index.js 的 ConfigSchema + sanitizePatchConfig（JS）
 * → 本文件为 TS 重写并泛化为多供应商组合。
 *
 * @module @dshp/search-provider
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from './http.js';
import type { PluginConfig, SearchProviderModule } from './types.js';

export const NS: string = settingsNamespace('dshp-search-provider');

/**
 * 同源路由前缀。四处同名是定位插件状态的唯一钥匙：
 * settings 命名空间 / 路由前缀 / cordis.patch.yml id / settings.section id。
 */
export const ROUTE_BASE = `/ext/${NS}`;

/** 结果数上限（Tavily / Exa 等主流供应商单次上限均为 10 左右，统一钳到 10） */
export const MAX_RESULTS = 10;
/** 默认结果数（与旧插件默认一致，迁移后行为不变） */
export const DEFAULT_MAX_RESULTS = 5;

// ── 类型守卫 ────────────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 整数钳制：非有限值或越界返回 undefined（调用方决定丢弃还是报错） */
function clampInt(v: unknown, min: number, max: number): number | undefined {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

// ── 默认值 / schema 组合（供应商清单驱动）───────────────────────────────────

/** 默认 provider：清单首个（新增供应商不会抢占默认，除非放在清单首位） */
export function defaultProviderId(modules: readonly SearchProviderModule[]): string {
  return modules[0]?.id ?? 'tavily';
}

/** 组装 schemastery schema：通用字段 + 各供应商自述分节 schema（provider 限已知 id；全字段 volatile） */
export function buildConfigSchema(modules: readonly SearchProviderModule[]): unknown {
  const defaults = defaultProviderId(modules);
  const shape: Record<string, unknown> = {
    provider: z
      .union(modules.map((m) => z.const(m.id)))
      .default(defaults)
      .volatile(),
    maxResults: z.number().step(1).min(1).max(MAX_RESULTS).default(DEFAULT_MAX_RESULTS).volatile(),
  };
  for (const m of modules) shape[m.id] = (m.configSchema as { volatile(): unknown }).volatile();
  return z.object(shape);
}

// ── 消毒与快照 ──────────────────────────────────────────────────────────────

function isKnownProvider(id: unknown, modules: readonly SearchProviderModule[]): id is string {
  return typeof id === 'string' && modules.some((m) => m.id === id);
}

function providerIds(modules: readonly SearchProviderModule[]): string {
  return modules.map((m) => m.id).join(' / ');
}

/**
 * 设置页路由补丁：非法值抛中文 Error（前端 notice 直接展示）。
 * 返回可直接交给 settings.update 的扁平补丁；无合法字段时返回空对象。
 */
export function sanitizeRoutePatch(
  raw: unknown,
  modules: readonly SearchProviderModule[],
): Record<string, unknown> {
  if (!isRecord(raw)) throw new Error('请求体不是合法 JSON 对象');
  const out: Record<string, unknown> = {};
  if (Object.hasOwn(raw, 'provider')) {
    if (!isKnownProvider(raw['provider'], modules)) {
      throw new Error(`provider 非法，应为已注册供应商之一：${providerIds(modules)}`);
    }
    out['provider'] = raw['provider'];
  }
  if (Object.hasOwn(raw, 'maxResults')) {
    const n = clampInt(raw['maxResults'], 1, MAX_RESULTS);
    if (n === undefined) throw new Error(`maxResults 非法，应为 1-${MAX_RESULTS} 的整数`);
    out['maxResults'] = n;
  }
  for (const m of modules) {
    if (!Object.hasOwn(raw, m.id)) continue;
    const block = m.sanitizePatch(raw[m.id]);
    if (block !== null) out[m.id] = block;
  }
  return out;
}

/** 生效配置快照（下发给 Client；只取契约字段，不透传整包） */
export function snapshotConfig(
  config: PluginConfig,
  modules: readonly SearchProviderModule[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    provider: config.provider,
    maxResults: typeof config.maxResults === 'number' ? config.maxResults : DEFAULT_MAX_RESULTS,
  };
  for (const m of modules) out[m.id] = m.snapshot({ ...m.defaultConfig, ...readBlock(config, m.id) });
  return out;
}

/** 读某供应商分节（非法结构按空对象处理） */
export function readBlock(config: PluginConfig, providerId: string): Record<string, unknown> {
  const raw = config[providerId];
  return isRecord(raw) ? raw : {};
}
