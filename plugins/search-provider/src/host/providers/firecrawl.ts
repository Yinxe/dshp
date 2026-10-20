/**
 * Firecrawl 搜索。
 *
 * POST https://api.firecrawl.dev/v2/search。
 * Key 可选：不填也能用（低限额）；填了走 Authorization: Bearer。
 */
import { isRecord, maxResultsOf, postJson, resultOf, sourceOf, strOrEmpty } from './base.js';
import type {
  ProviderDeps,
  SearchProviderModule,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '../types.js';

const ID = 'firecrawl';
const ENDPOINT = 'https://api.firecrawl.dev/v2/search';
const CRED_REF = 'FIRECRAWL_API_KEY';

function itemsOf(parsed: unknown): unknown[] {
  if (!isRecord(parsed)) return [];
  const data = parsed['data'];
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data['web'])) return data['web'];
  if (Array.isArray(parsed['web'])) return parsed['web'];
  return [];
}

export function createFirecrawlModule(): SearchProviderModule {
  async function search(
    deps: ProviderDeps,
    request: WebSearchRequest,
    signal?: AbortSignal,
  ): Promise<WebSearchResult> {
    const key = await deps.resolveKey(CRED_REF);
    const maxResults = maxResultsOf(request.maxResults, deps.getConfig().maxResults);
    const headers: Record<string, string> = key === undefined ? {} : { authorization: `Bearer ${key}` };

    let parsed: unknown;
    try {
      parsed = await postJson(
        'Firecrawl',
        ENDPOINT,
        { query: request.query, limit: maxResults },
        headers,
        signal,
      );
    } catch (error) {
      const message = String((error as Error)?.message ?? error);
      if (key === undefined && /HTTP (401|402|429)/.test(message)) {
        throw new Error(
          `${message}（Firecrawl 无 Key 时有限流；在 设置 → AI 搜索 配置 FIRECRAWL_API_KEY 可提高额度）`,
          { cause: error },
        );
      }
      throw error;
    }

    const sources: WebSearchSource[] = [];
    for (const item of itemsOf(parsed)) {
      if (sources.length >= maxResults) break;
      if (!isRecord(item)) continue;
      const snippet =
        strOrEmpty(item['description']) || strOrEmpty(item['markdown']) || strOrEmpty(item['content']);
      const source = sourceOf(
        item['url'],
        item['title'],
        snippet,
        item['publishedTime'] ?? item['publishedAt'] ?? item['published_at'],
      );
      if (source !== null) sources.push(source);
    }
    return resultOf(sources);
  }

  return {
    id: ID,
    label: 'Firecrawl',
    title: 'Firecrawl 搜索',
    credentialRef: CRED_REF,
    credentialRequired: false,
    homepage: 'https://firecrawl.dev',
    description: 'AI 友好的网页搜索，返回标题、链接与页面摘要；不填 Key 也能用。',
    freeNote: '无需 Key 即可使用（有限流）；配置 Key 后额度更高。',
    fields: [],
    defaultConfig: {},
    sanitizePatch(): Record<string, unknown> | null {
      return null;
    },
    snapshot(): Record<string, unknown> {
      return {};
    },
    search,
  };
}
