/**
 * 配置 schema 与路由消毒。
 *
 * 配置持久化在 profile 条目 `config:`（NS = `dshp-search-provider`），
 * 全字段 volatile：设置页写入后原地生效，不重启插件。
 * 密钥不进配置，走 credentials 服务。
 */
import z from '@deepseek-ai/schemastery';
import type { PluginConfig, SearchProviderModule } from './types.js';

export const NS = 'dshp-search-provider';

/** 稳定 hub provider id：注册给 ctx.web 的唯一提供方，不随后端切换而变。 */
export const HUB_ID = 'dshp-search';

export const MAX_RESULTS = 10;
export const DEFAULT_MAX_RESULTS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clampInt(value: unknown, min: number, max: number): number | undefined {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return number;
}

export function defaultProviderId(modules: readonly SearchProviderModule[]): string {
  return modules[0]?.id ?? 'tavily';
}

/** 组装 schemastery schema：通用字段 + 有字段的后端分节（全字段 volatile）。 */
export function buildConfigSchema(modules: readonly SearchProviderModule[]): unknown {
  const ids = modules.map((module) => module.id);
  const shape: Record<string, unknown> = {
    provider: z
      .union(ids.map((id) => z.const(id)))
      .default(defaultProviderId(modules))
      .volatile(),
    maxResults: z.number().step(1).min(1).max(MAX_RESULTS).default(DEFAULT_MAX_RESULTS).volatile(),
  };
  for (const module of modules) {
    if (module.fields.length === 0 || module.configSchema === undefined) continue;
    shape[module.id] = (module.configSchema as { volatile(): unknown }).volatile();
  }
  return z.object(shape);
}

function isKnownProvider(id: unknown, modules: readonly SearchProviderModule[]): id is string {
  return typeof id === 'string' && modules.some((module) => module.id === id);
}

function knownKeys(modules: readonly SearchProviderModule[]): Set<string> {
  const keys = new Set(['provider', 'maxResults']);
  for (const module of modules) {
    if (module.fields.length > 0) keys.add(module.id);
  }
  return keys;
}

/** 设置页补丁校验：未知键、非法值都抛中文 Error；无合法字段返回空对象。 */
export function sanitizeRoutePatch(
  raw: unknown,
  modules: readonly SearchProviderModule[],
): Record<string, unknown> {
  if (!isRecord(raw)) throw new Error('请求体不是合法 JSON 对象');
  const allowed = knownKeys(modules);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) throw new Error(`未知配置字段：${key}`);
  }

  const out: Record<string, unknown> = {};
  if (Object.hasOwn(raw, 'provider')) {
    if (!isKnownProvider(raw['provider'], modules)) {
      throw new Error(`provider 非法，应为：${modules.map((module) => module.id).join(' / ')}`);
    }
    out['provider'] = raw['provider'];
  }
  if (Object.hasOwn(raw, 'maxResults')) {
    const number = clampInt(raw['maxResults'], 1, MAX_RESULTS);
    if (number === undefined) throw new Error(`maxResults 非法，应为 1-${MAX_RESULTS} 的整数`);
    out['maxResults'] = number;
  }
  for (const module of modules) {
    if (module.fields.length === 0 || !Object.hasOwn(raw, module.id)) continue;
    const block = module.sanitizePatch(raw[module.id]);
    if (block !== null) out[module.id] = block;
  }
  return out;
}

/** 下发给 Client 的配置快照（只取契约字段）。 */
export function snapshotConfig(
  config: PluginConfig,
  modules: readonly SearchProviderModule[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    provider: config.provider,
    maxResults: typeof config.maxResults === 'number' ? config.maxResults : DEFAULT_MAX_RESULTS,
  };
  for (const module of modules) {
    out[module.id] = module.snapshot({
      ...module.defaultConfig,
      ...readBlock(config, module.id),
    });
  }
  return out;
}

export function readBlock(config: PluginConfig, providerId: string): Record<string, unknown> {
  const raw = (config as unknown as Record<string, unknown>)[providerId];
  return isRecord(raw) ? raw : {};
}
