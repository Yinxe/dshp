/**
 * Tavily 供应商模块（首个内置供应商）
 *
 * 原实现：~/.dsh/plugins/dsh-tavily-search（JS，@dshp-inx/tavily-search v2.0.3）
 * 的 provider + /usage 路由 + 用量缓存 → 本文件为等价 TS 重写，行为不变，
 * 仅把「注册 web provider + 路由」拆到模块契约里（见 ../types.ts）。
 *
 * - 搜索：POST https://api.tavily.com/search，鉴权走 body.api_key（每次搜索实时解析）
 * - 用量：GET https://api.tavily.com/usage，鉴权走 Authorization: Bearer <Key>
 *   （注意与 /search 不同）；官方限流 10 req/10min，服务端做 60s 缓存
 * - 计费：按 credits 计，basic 1 credit/次、advanced 2 credits/次
 *
 * @module @dshp/search-provider
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import z from '@deepseek-ai/schemastery';
import { ROUTE_BASE } from '../config.js';
import { json, methodIs } from '../http.js';
import { extractApiDetail, isRecord, numOrNull, registerExactRoute, strOrEmpty } from './base.js';
import type {
  ProviderDeps,
  ProviderField,
  SearchProviderModule,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '../types.js';

/** 提供方 id：注册给 ctx.web 的主键，也是 profile patch 里 web.searchProvider 的取值 */
const ID = 'tavily';
const ENDPOINT = 'https://api.tavily.com/search';
const USAGE_ENDPOINT = 'https://api.tavily.com/usage';
/** Tavily usage 官方限流 10 req / 10min；服务端缓存 60s，避免设置页频繁刷新触发 429 */
const USAGE_CACHE_TTL_MS = 60 * 1000;
/** 返回值上限（Tavily max_results 上限为 10） */
const MAX_RESULTS = 10;
/** credentials 服务里的密钥引用名（与旧插件一致，迁移无需重存密钥） */
const CRED_REF = 'TAVILY_API_KEY';

const CONFIG_SCHEMA: unknown = z.object({
  searchDepth: z.union([z.const('basic'), z.const('advanced')]).default('basic'),
});

const FIELDS: readonly ProviderField[] = [
  {
    key: 'searchDepth',
    label: '搜索深度',
    kind: 'select',
    options: [
      { value: 'basic', label: 'basic（1 credit/次 · 快）' },
      { value: 'advanced', label: 'advanced（2 credits/次 · 全）' },
    ],
    hint: '按次计费：basic 1 credit/次，advanced 2 credits/次（覆盖更多来源）。',
  },
];

/** 仅提取文档声明的叶子标量，不透传整包、不断言多余字段 */
function sanitizeUsagePayload(parsed: Record<string, unknown>): Record<string, unknown> {
  const pickCounts = (src: unknown): Record<string, number | null> => {
    const s = isRecord(src) ? src : {};
    const limit = s['limit'];
    return {
      usage: numOrNull(s['usage']),
      limit: Object.hasOwn(s, 'limit') && limit === null ? null : numOrNull(limit),
      search_usage: numOrNull(s['search_usage']),
      extract_usage: numOrNull(s['extract_usage']),
      crawl_usage: numOrNull(s['crawl_usage']),
      map_usage: numOrNull(s['map_usage']),
      research_usage: numOrNull(s['research_usage']),
    };
  };
  const keyRaw = isRecord(parsed['key']) ? parsed['key'] : {};
  const key = pickCounts(keyRaw);
  const acc = isRecord(parsed['account']) ? parsed['account'] : {};
  const accLimit = acc['plan_limit'];
  const account = {
    current_plan: strOrEmpty(acc['current_plan']),
    plan_usage: numOrNull(acc['plan_usage']),
    plan_limit: Object.hasOwn(acc, 'plan_limit') && accLimit === null ? null : numOrNull(accLimit),
    paygo_usage: numOrNull(acc['paygo_usage']),
    paygo_limit: numOrNull(acc['paygo_limit']),
    search_usage: numOrNull(acc['search_usage']),
    extract_usage: numOrNull(acc['extract_usage']),
    crawl_usage: numOrNull(acc['crawl_usage']),
    map_usage: numOrNull(acc['map_usage']),
    research_usage: numOrNull(acc['research_usage']),
  };
  return { key, account };
}

export function createTavilyModule(): SearchProviderModule {
  /** 用量快照缓存（{ usage, fetchedAt }；null = 尚未拉取） */
  let usageCache: { usage: Record<string, unknown>; fetchedAt: number } | null = null;

  /** GET https://api.tavily.com/usage —— Bearer 鉴权（与 /search 的 body.api_key 不同） */
  async function fetchUsage(deps: ProviderDeps): Promise<Record<string, unknown>> {
    const key = await deps.resolveKey(CRED_REF);
    if (key === undefined) {
      throw new Error(
        'Tavily 用量查询缺少 API Key「TAVILY_API_KEY」：请打开 设置 → AI 搜索 配置密钥后重试。',
      );
    }
    const headers = { accept: 'application/json', authorization: `Bearer ${key}` };
    let response: Response;
    try {
      response = await fetch(USAGE_ENDPOINT, { method: 'GET', headers });
    } catch (error) {
      throw new Error(`Tavily usage 请求失败：${String((error as Error)?.message ?? error)}`, {
        cause: error,
      });
    }
    let parsed: unknown = null;
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
    if (!response.ok) {
      const detail = extractApiDetail(parsed, `HTTP ${response.status}`);
      if (response.status === 401) throw new Error(`Tavily API Key 无效或缺失（401）：${detail}`);
      if (response.status === 429) {
        throw new Error(
          `Tavily usage 请求被限流（429，10 分钟最多 10 次）：${detail}。已做 60 秒服务端缓存，请稍后点“刷新用量”重试。`,
        );
      }
      throw new Error(`Tavily usage 查询失败：${detail}`);
    }
    if (!isRecord(parsed) || !isRecord(parsed['key']) || !isRecord(parsed['account'])) {
      throw new Error('Tavily usage 返回了未知响应');
    }
    return sanitizeUsagePayload(parsed);
  }

  async function getUsageCached(
    deps: ProviderDeps,
    { force = false }: { force?: boolean } = {},
  ): Promise<{ usage: Record<string, unknown>; fetchedAt: number; cached: boolean }> {
    const now = Date.now();
    const hit = usageCache !== null && !force && now - usageCache.fetchedAt < USAGE_CACHE_TTL_MS;
    if (hit && usageCache !== null) return { ...usageCache, cached: true };
    const usage = await fetchUsage(deps);
    usageCache = { usage, fetchedAt: now };
    return { ...usageCache, cached: false };
  }

  async function search(
    deps: ProviderDeps,
    request: WebSearchRequest,
    signal?: AbortSignal,
  ): Promise<WebSearchResult> {
    const key = await deps.resolveKey(CRED_REF);
    if (key === undefined) {
      throw new Error('Tavily 搜索缺少 API Key「TAVILY_API_KEY」：请打开 设置 → AI 搜索 配置密钥后重试。');
    }
    // 官方推荐：每次操作快照一份配置，单次搜索不混用两个分节的值
    const global = deps.getConfig();
    const cfg = deps.providerConfig(ID);
    const fallbackMax =
      typeof global.maxResults === 'number' && global.maxResults >= 1
        ? Math.min(global.maxResults, MAX_RESULTS)
        : 5;
    const maxResults = Math.min(
      Math.max(Math.floor(Number(request.maxResults)) || fallbackMax, 1),
      MAX_RESULTS,
    );
    const searchDepth = cfg['searchDepth'] === 'advanced' ? 'advanced' : 'basic';
    const body = JSON.stringify({
      api_key: key,
      query: request.query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_answer: false,
    });
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body,
        ...(signal === undefined ? {} : { signal }),
      });
    } catch (error) {
      if (signal !== undefined && signal.aborted) {
        const err = new Error('Tavily 搜索已取消');
        err.name = 'AbortError';
        throw err;
      }
      throw new Error(`Tavily 请求失败：${String((error as Error)?.message ?? error)}`, { cause: error });
    }
    try {
      const parsed: unknown = await response.json();
      if (!response.ok) {
        const detail = extractApiDetail(parsed, `HTTP ${response.status}`);
        throw new Error(`Tavily API 错误：${detail}`);
      }
      if (!isRecord(parsed) || !Array.isArray(parsed['results'])) {
        throw new Error('Tavily 返回了未知响应');
      }
      const sources: WebSearchSource[] = [];
      for (const item of parsed['results'] as unknown[]) {
        if (!isRecord(item) || typeof item['url'] !== 'string' || item['url'].length === 0) continue;
        const source: {
          url: string;
          title?: string;
          snippet?: string;
          publishedAt?: string;
        } = { url: item['url'] };
        if (typeof item['title'] === 'string' && item['title'].length > 0) source.title = item['title'];
        if (typeof item['content'] === 'string' && item['content'].length > 0)
          source.snippet = item['content'];
        if (typeof item['published_date'] === 'string' && item['published_date'].length > 0) {
          source.publishedAt = item['published_date'];
        }
        sources.push(source);
      }
      return { sources, truncated: false };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Tavily')) throw error;
      throw new Error(`Tavily 返回了无法解析的响应：${String((error as Error)?.message ?? error)}`, {
        cause: error,
      });
    }
  }

  /** 供应商专属路由：GET /ext/dshp-search-provider/tavily/usage[?force=1] */
  function registerRoutes(deps: ProviderDeps): void {
    registerExactRoute(
      deps.ctx,
      `${ROUTE_BASE}/${ID}/usage`,
      'dshp-search-provider: tavily usage route',
      async (req: IncomingMessage, res: ServerResponse) => {
        if (!methodIs(req, 'GET')) return json(res, 405, { ok: false, error: 'method not allowed' });
        const startedAt = Date.now();
        let force = false;
        try {
          const u = new URL(String(req.url ?? '/'), 'http://localhost');
          const f = u.searchParams.get('force');
          force = f === '1' || f === 'true';
        } catch {
          /* ignore */
        }
        try {
          const snap = await getUsageCached(deps, { force });
          return json(res, 200, {
            ok: true,
            usage: snap.usage,
            cached: snap.cached,
            fetchedAt: snap.fetchedAt,
            takenMs: Date.now() - startedAt,
          });
        } catch (error) {
          const stale =
            usageCache !== null ? { usage: usageCache.usage, fetchedAt: usageCache.fetchedAt } : null;
          return json(res, 200, {
            ok: false,
            error: String((error as Error)?.message ?? error),
            takenMs: Date.now() - startedAt,
            ...(stale !== null ? { stale } : {}),
          });
        }
      },
    );
  }

  return {
    id: ID,
    label: 'Tavily',
    title: 'Tavily AI 搜索',
    credentialRef: CRED_REF,
    homepage: 'https://docs.tavily.com/documentation/api-reference/endpoint/usage',
    description: 'Tavily 搜索 API：按 credits 计费，basic/advanced 两档深度。',
    fields: FIELDS,
    defaultConfig: { searchDepth: 'basic' },
    configSchema: CONFIG_SCHEMA,

    sanitizePatch(raw: unknown): Record<string, unknown> | null {
      if (!isRecord(raw)) return null;
      const out: Record<string, unknown> = {};
      if (Object.hasOwn(raw, 'searchDepth')) {
        if (raw['searchDepth'] !== 'basic' && raw['searchDepth'] !== 'advanced') {
          throw new Error("searchDepth 非法，应为 'basic' 或 'advanced'");
        }
        out['searchDepth'] = raw['searchDepth'];
      }
      return out;
    },

    snapshot(config: Record<string, unknown>): Record<string, unknown> {
      return { searchDepth: config['searchDepth'] === 'advanced' ? 'advanced' : 'basic' };
    },

    search,

    registerRoutes,

    async stateExtras(): Promise<Record<string, unknown>> {
      return {
        usageMeta: {
          endpoint: 'GET https://api.tavily.com/usage',
          cacheTtlMs: USAGE_CACHE_TTL_MS,
          rateLimit: '10 req / 10min（开发与生产一致）',
          billing: '按 credits 计：basic 搜索 1/次、advanced 2/次',
          hasCache: usageCache !== null,
          fetchedAt: usageCache !== null ? usageCache.fetchedAt : null,
        },
      };
    },
  };
}
