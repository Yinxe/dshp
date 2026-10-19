/**
 * 同源 JSON 路由（设置页读写用）
 *
 *   GET  /ext/dshp-search-provider/state    状态：选型/各供应商配置与密钥状态/供应商元数据
 *   POST /ext/dshp-search-provider/config   { provider?, maxResults?, <providerId>?: {...} }
 *   POST /ext/dshp-search-provider/test     { provider?, query, maxResults? } → 结果列表
 *
 * 供应商专属路由（如 Tavily 的 /usage）由各模块自行注册，见 providers/tavily.ts。
 *
 * 原实现：dsh-tavily-search/lib/index.js 的四个路由（state/config/test/usage，JS）
 * → 本文件为等价 TS 重写：state/config/test 泛化为多供应商，usage 归入供应商模块。
 *
 * @module @dshp/search-provider
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NS, snapshotConfig, sanitizeRoutePatch } from './config.js';
import { json, methodIs, sameOrigin } from './http.js';
import { readJsonObject } from './providers/base.js';
import type { AnyCtx, PluginConfig, ProviderDeps, ProviderStateMeta, SearchProviderModule } from './types.js';

export interface CommonRouteDeps {
  ctx: AnyCtx;
  modules: readonly SearchProviderModule[];
  getConfig(): PluginConfig;
  updateConfig(patch: Record<string, unknown>): Promise<void>;
  /** 供应商侧运行时依赖（stateExtras / 连接测试复用） */
  providerDeps: ProviderDeps;
  /** web seam 配置固定的提供方 id（profile patch / 环境变量；未固定为 null） */
  selectedProviderId(): string | null;
  /** 插件当前动态注册的提供方 id（settings 的 provider 决定；未注册为 null） */
  registeredProviderId(): string | null;
}

/** 从 credentials 服务读密钥配置状态（读失败按未配置处理） */
async function credentialState(ctx: AnyCtx, ref: string): Promise<{ configured: boolean; source?: string }> {
  const creds = ctx.get('credentials') as AnyCtx;
  if (creds === undefined) return { configured: false };
  try {
    const info = await creds.describe(ref);
    const configured = info?.configured === true;
    const source = typeof info?.source === 'string' ? (info.source as string) : undefined;
    return source !== undefined ? { configured, source } : { configured };
  } catch {
    return { configured: false };
  }
}

/**
 * 选型提示（patch 固定选型 vs 动态注册）：
 * - 无 patch 固定（selected=null）：seam 自动选中插件注册的唯一提供方，动态切换生效，无需提示；
 * - 固定 id 与当前注册一致：正常，无需提示；
 * - 固定 id 与当前注册不一致：下次搜索必报 WEB_PROVIDER_CONFIGURED_MISSING，给出可操作指引。
 */
function selectionHintOf(
  config: PluginConfig,
  selected: string | null,
  registered: string | null,
): string | undefined {
  if (selected !== null && selected !== registered) {
    return `profile patch 固定了 web.searchProvider: ${selected}，但插件当前只注册了「${
      registered ?? '无'
    }」（settings 里选的是 ${config.provider}），搜索会报 WEB_PROVIDER_CONFIGURED_MISSING。想完全由设置页动态切换：删除 cordis.patch.yml 里 web 条目的 searchProvider 一行，重启 dsh web 后生效。`;
  }
  return undefined;
}

async function stateResponse(deps: CommonRouteDeps): Promise<Record<string, unknown>> {
  const config = deps.getConfig();
  const selected = deps.selectedProviderId();
  const registered = deps.registeredProviderId();
  const providers: ProviderStateMeta[] = [];
  for (const m of deps.modules) {
    const cred = await credentialState(deps.ctx, m.credentialRef);
    providers.push({
      id: m.id,
      label: m.label,
      title: m.title,
      credentialRef: m.credentialRef,
      homepage: m.homepage,
      description: m.description,
      fields: m.fields,
      configured: cred.configured,
      ...(cred.source !== undefined ? { source: cred.source } : {}),
      selected: registered === m.id,
    });
  }
  const extras: Record<string, Record<string, unknown>> = {};
  for (const m of deps.modules) {
    try {
      extras[m.id] = await m.stateExtras(deps.providerDeps);
    } catch (error) {
      extras[m.id] = { error: String((error as Error)?.message ?? error) };
    }
  }
  const hint = selectionHintOf(config, selected, registered);
  return {
    ok: true,
    namespace: NS,
    selectedProviderId: selected,
    registeredProviderId: registered,
    providers,
    config: snapshotConfig(config, deps.modules),
    extras,
    ...(hint !== undefined ? { selectionHint: hint } : {}),
  };
}

export function registerRoutes(deps: CommonRouteDeps): void {
  const base = `/ext/${NS}`;

  // ── GET state ────────────────────────────────────────────────────────────
  register(deps.ctx, `${base}/state`, 'dshp-search-provider: state route', async (req, res) => {
    if (!methodIs(req, 'GET')) return json(res, 405, { ok: false, error: 'method not allowed' });
    try {
      return json(res, 200, await stateResponse(deps));
    } catch (error) {
      return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
    }
  });

  // ── POST config ──────────────────────────────────────────────────────────
  register(deps.ctx, `${base}/config`, 'dshp-search-provider: config route', async (req, res) => {
    if (!methodIs(req, 'POST')) return json(res, 405, { ok: false, error: 'method not allowed' });
    const body = await readJsonObject(req);
    if (!body.ok) return json(res, 200, { ok: false, error: body.error });
    try {
      const patch = sanitizeRoutePatch(body.value, deps.modules);
      if (Object.keys(patch).length > 0) await deps.updateConfig(patch);
      return json(res, 200, { ok: true, config: snapshotConfig(deps.getConfig(), deps.modules) });
    } catch (error) {
      return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
    }
  });

  // ── POST test ────────────────────────────────────────────────────────────
  register(deps.ctx, `${base}/test`, 'dshp-search-provider: test route', async (req, res) => {
    if (!methodIs(req, 'POST')) return json(res, 405, { ok: false, error: 'method not allowed' });
    const startedAt = Date.now();
    const body = await readJsonObject(req);
    if (!body.ok) return json(res, 200, { ok: false, error: body.error, takenMs: Date.now() - startedAt });
    const config = deps.getConfig();
    const wanted =
      typeof body.value['provider'] === 'string' ? (body.value['provider'] as string) : config.provider;
    const module = deps.modules.find((m) => m.id === wanted);
    if (module === undefined) {
      return json(res, 200, {
        ok: false,
        error: `未知提供方「${wanted}」，可选：${deps.modules.map((m) => m.id).join(' / ')}`,
        takenMs: Date.now() - startedAt,
      });
    }
    const query = typeof body.value['query'] === 'string' ? (body.value['query'] as string).trim() : '';
    if (query.length === 0) {
      return json(res, 200, { ok: false, error: '请输入测试查询', takenMs: Date.now() - startedAt });
    }
    try {
      // 用当前生效的默认结果数，测的就是线上真实取值路径
      const result = await module.search(deps.providerDeps, { query, maxResults: config.maxResults });
      return json(res, 200, {
        ok: true,
        provider: module.id,
        sources: result.sources,
        takenMs: Date.now() - startedAt,
      });
    } catch (error) {
      return json(res, 200, {
        ok: false,
        provider: module.id,
        error: String((error as Error)?.message ?? error),
        takenMs: Date.now() - startedAt,
      });
    }
  });
}

/** 注册一条路由（内部 ctx.effect + try/catch：单条失败不影响其余功能） */
function register(
  ctx: AnyCtx,
  path: string,
  label: string,
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>,
): void {
  try {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path,
          handler: async (req: IncomingMessage, res: ServerResponse) => {
            if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
            return handler(req, res);
          },
        }),
      label,
    );
  } catch (error) {
    try {
      console.warn(
        `[dshp-search-provider] 注册路由 ${path} 失败：${String((error as Error)?.message ?? error)}`,
      );
    } catch {
      /* ignore */
    }
  }
}
