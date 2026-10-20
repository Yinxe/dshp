/**
 * @dshp/search-provider —— AI 搜索中枢 Host 半。
 *
 * 注册一个稳定的 web seam 提供方 `dshp-search`，内部按设置里的 provider
 * 分派到 Tavily / Exa / Firecrawl；切换后端不需要重注册，也不会与 base 的
 * `deepseek-official` 产生多提供方歧义。
 *
 * 配置持久化在 profile 条目 `config:`（NS = `dshp-search-provider`，全字段 volatile）；
 * API Key 走 credentials 服务，不进配置。
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  HUB_ID,
  NS,
  buildConfigSchema,
  defaultProviderId,
  sanitizeRoutePatch,
  snapshotConfig,
} from './config.js';
import { json, methodIs, readBody, sameOrigin } from './http.js';
import { createProviderModules } from './providers/index.js';
import type {
  AnyCtx,
  PluginConfig,
  ProviderDeps,
  ProviderStateMeta,
  SearchProviderModule,
  VolatileConfig,
} from './types.js';

export const name = '@dshp/search-provider';
export const inject: string[] = ['web', 'webServer'];
export { NS } from './config.js';

/** Cordis 用它校验条目 config；所有字段 volatile。 */
export const ConfigSchema: unknown = buildConfigSchema(createProviderModules());
export const Config = ConfigSchema;

const MAX_BODY = 64 * 1024;
const ROUTE_PREFIX = `/ext/${NS}`;

type WebHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function warn(message: string, error?: unknown): void {
  try {
    const reason = error === undefined ? '' : '：' + errorMessage(error);
    console.warn('[dshp-search-provider] ' + message + reason);
  } catch {
    /* ignore */
  }
}

export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  const modules: SearchProviderModule[] = createProviderModules();
  const fallbackProvider = defaultProviderId(modules);

  function getConfig(): PluginConfig {
    const wanted = config.provider.get();
    const provider = modules.some((module) => module.id === wanted) ? wanted : fallbackProvider;
    const tavily = config.tavily.get();
    const exa = config.exa.get();
    return {
      provider,
      maxResults: typeof config.maxResults.get() === 'number' ? config.maxResults.get() : 5,
      tavily: isRecord(tavily) ? { ...tavily } : {},
      exa: isRecord(exa) ? { ...exa } : {},
    };
  }

  async function updateConfig(patch: Record<string, unknown>): Promise<void> {
    const settings = ctx.get('settings') as AnyCtx;
    if (!settings) throw new Error('settings 服务不可用，无法保存配置');
    await settings.update(NS, patch);
  }

  async function resolveKey(ref: string): Promise<string | undefined> {
    const credentials = ctx.get('credentials') as AnyCtx;
    if (!credentials || typeof credentials.resolve !== 'function') return undefined;
    try {
      const resolved = await credentials.resolve(ref);
      const value = typeof resolved === 'string' ? resolved : resolved?.value;
      return typeof value === 'string' && value.length > 0 ? value : undefined;
    } catch {
      return undefined;
    }
  }

  const deps: ProviderDeps = {
    ctx,
    resolveKey,
    getConfig,
    providerConfig(providerId: string): Record<string, unknown> {
      const module = modules.find((item) => item.id === providerId);
      const defaults = module !== undefined ? module.defaultConfig : {};
      const current = getConfig();
      const block = (current as unknown as Record<string, unknown>)[providerId];
      return { ...defaults, ...(isRecord(block) ? block : {}) };
    },
  };

  // ── 唯一的 web seam 提供方：内部按 provider 分派，切换后端即时生效 ──────────
  try {
    ctx.effect(
      () =>
        ctx.web.registerSearchProvider({
          id: HUB_ID,
          available: () => true,
          async search(request: { query: string; maxResults?: number }, signal?: AbortSignal) {
            const current = getConfig();
            const module =
              modules.find((item) => item.id === current.provider) ??
              modules.find((item) => item.id === fallbackProvider);
            if (!module) throw new Error('没有可用的搜索后端');
            return module.search(deps, request, signal);
          },
        }),
      'dshp-search-provider: hub provider',
    );
    try {
      console.info(
        `[dshp-search-provider] 已注册 web 搜索提供方「${HUB_ID}」，后端：${modules
          .map((module) => module.id)
          .join(' / ')}`,
      );
    } catch {
      /* ignore */
    }
  } catch (error) {
    warn('注册 web 搜索提供方失败（若旧插件仍注册同名 id 请先移除）', error);
  }

  // ── 自带设置页，关掉 schema 自动表单 ─────────────────────────────────────
  ctx.inject(['settings'], (sctx: AnyCtx) => {
    try {
      sctx.effect(
        () => sctx.settings.configure({ auto: false }, ctx.fiber),
        'dshp-search-provider: settings page',
      );
      const selected = readWebSearchProvider(sctx);
      console.info(`[dshp-search-provider] web.searchProvider=${selected ?? '未读取到'}（hub=${HUB_ID}）`);
    } catch (error) {
      warn('settings 页面策略注册失败', error);
    }
  });

  // ── 同源 JSON 路由 ───────────────────────────────────────────────────────
  function registerRoute(path: string, handler: WebHandler): void {
    try {
      ctx.effect(
        () => ctx.webServer.register({ kind: 'exact', path, handler }),
        `dshp-search-provider: ${path} route`,
      );
    } catch (error) {
      warn(`注册路由 ${path} 失败`, error);
    }
  }

  registerRoute(ROUTE_PREFIX + '/state', async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
    if (!methodIs(req, 'GET')) return json(res, 405, { ok: false, error: 'method not allowed' });
    try {
      const current = getConfig();
      const selected = readWebSearchProvider(ctx);
      const providers: ProviderStateMeta[] = [];
      for (const module of modules) {
        const credential = await credentialState(ctx, module.credentialRef);
        providers.push({
          id: module.id,
          label: module.label,
          title: module.title,
          credentialRef: module.credentialRef,
          credentialRequired: module.credentialRequired,
          homepage: module.homepage,
          description: module.description,
          freeNote: module.freeNote,
          fields: module.fields,
          configured: credential.configured,
          ...(credential.source !== undefined ? { source: credential.source } : {}),
        });
      }
      const hint =
        selected === null
          ? '未能读取 web.searchProvider。请确认 profile 的 web 条目没有被其他 patch 覆盖，或重启 dsh web 让本插件的 patch 生效。'
          : selected !== HUB_ID
            ? `profile 的 web.searchProvider 当前是「${selected}」，搜索不会走本插件。请把它改为「${HUB_ID}」或删除该覆盖行后重启 dsh web。`
            : undefined;
      return json(res, 200, {
        ok: true,
        namespace: NS,
        hubProviderId: HUB_ID,
        selectedProviderId: selected,
        webSearchConfigured: selected === HUB_ID,
        providers,
        config: snapshotConfig(current, modules),
        ...(hint !== undefined ? { selectionHint: hint } : {}),
      });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });

  registerRoute(ROUTE_PREFIX + '/config', async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
    if (!methodIs(req, 'POST')) return json(res, 405, { ok: false, error: 'method not allowed' });

    let body: unknown;
    try {
      body = JSON.parse((await readBody(req, MAX_BODY)) || '{}');
    } catch {
      return json(res, 200, { ok: false, error: '请求体不是合法 JSON' });
    }

    try {
      const patch = sanitizeRoutePatch(body, modules);
      if (Object.keys(patch).length > 0) await updateConfig(patch);
      return json(res, 200, { ok: true, config: snapshotConfig(getConfig(), modules) });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });

  registerRoute(ROUTE_PREFIX + '/test', async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
    if (!methodIs(req, 'POST')) return json(res, 405, { ok: false, error: 'method not allowed' });
    const startedAt = Date.now();

    let body: unknown;
    try {
      body = JSON.parse((await readBody(req, MAX_BODY)) || '{}');
    } catch {
      return json(res, 200, { ok: false, error: '请求体不是合法 JSON', takenMs: Date.now() - startedAt });
    }
    const input = isRecord(body) ? body : {};
    const current = getConfig();
    const wanted = typeof input['provider'] === 'string' ? (input['provider'] as string) : current.provider;
    const module = modules.find((item) => item.id === wanted);
    if (!module) {
      return json(res, 200, {
        ok: false,
        error: `未知提供方「${wanted}」，可选：${modules.map((item) => item.id).join(' / ')}`,
        takenMs: Date.now() - startedAt,
      });
    }
    const query = typeof input['query'] === 'string' ? input['query'].trim() : '';
    if (query.length === 0) {
      return json(res, 200, { ok: false, error: '请输入测试查询', takenMs: Date.now() - startedAt });
    }

    try {
      const result = await module.search(deps, { query, maxResults: current.maxResults });
      return json(res, 200, {
        ok: true,
        provider: module.id,
        sources: result.sources,
        ...(result.content !== undefined ? { content: result.content } : {}),
        takenMs: Date.now() - startedAt,
      });
    } catch (error) {
      return json(res, 200, {
        ok: false,
        provider: module.id,
        error: errorMessage(error),
        takenMs: Date.now() - startedAt,
      });
    }
  });
}

/** 从 settings.describe() 读取 web 条目的 searchProvider（读不到为 null）。 */
function readWebSearchProvider(ctx: AnyCtx): string | null {
  const settings = ctx.get('settings') as AnyCtx;
  if (!settings || typeof settings.describe !== 'function') return null;
  try {
    const descriptors = settings.describe({ redactSecrets: true });
    if (!Array.isArray(descriptors)) return null;
    const web = descriptors.find((item) => isRecord(item) && item['ns'] === 'web');
    const value = isRecord(web) ? web['value'] : undefined;
    return isRecord(value) && typeof value['searchProvider'] === 'string' ? value['searchProvider'] : null;
  } catch {
    return null;
  }
}

/** credentials 服务的密钥配置状态。 */
async function credentialState(ctx: AnyCtx, ref: string): Promise<{ configured: boolean; source?: string }> {
  const credentials = ctx.get('credentials') as AnyCtx;
  if (!credentials || typeof credentials.describe !== 'function') return { configured: false };
  try {
    const info = await credentials.describe(ref);
    const configured = isRecord(info) && info['configured'] === true;
    const source = isRecord(info) && typeof info['source'] === 'string' ? info['source'] : undefined;
    return source !== undefined ? { configured, source } : { configured };
  } catch {
    return { configured: false };
  }
}
