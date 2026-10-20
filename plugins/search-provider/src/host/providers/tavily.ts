/**
 * Tavily AI 搜索。
 *
 * POST https://api.tavily.com/search，鉴权走 body.api_key。
 * 返回 results[]；有 answer 时作为 content 一并带回。
 */
import z from '@deepseek-ai/schemastery';
import { isRecord, maxResultsOf, missingKey, postJson, resultOf, sourceOf, strOrEmpty } from './base.js';
import type {
  ProviderDeps,
  ProviderField,
  SearchProviderModule,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '../types.js';

const ID = 'tavily';
const ENDPOINT = 'https://api.tavily.com/search';
const CRED_REF = 'TAVILY_API_KEY';

const FIELDS: readonly ProviderField[] = [
  {
    key: 'searchDepth',
    label: '搜索深度',
    kind: 'select',
    options: [
      { value: 'basic', label: 'basic（1 credit/次 · 快）' },
      { value: 'advanced', label: 'advanced（2 credits/次 · 覆盖更全）' },
    ],
    hint: 'basic 更快更省；advanced 会抓取更多来源。',
  },
];

const CONFIG_SCHEMA: unknown = z.object({
  searchDepth: z.union([z.const('basic'), z.const('advanced')]).default('basic'),
});

export function createTavilyModule(): SearchProviderModule {
  async function search(
    deps: ProviderDeps,
    request: WebSearchRequest,
    signal?: AbortSignal,
  ): Promise<WebSearchResult> {
    const key = await deps.resolveKey(CRED_REF);
    if (key === undefined) throw missingKey('Tavily', CRED_REF);

    const config = deps.providerConfig(ID);
    const maxResults = maxResultsOf(request.maxResults, deps.getConfig().maxResults);
    const searchDepth = config['searchDepth'] === 'advanced' ? 'advanced' : 'basic';

    const parsed = await postJson(
      'Tavily',
      ENDPOINT,
      {
        api_key: key,
        query: request.query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: false,
      },
      {},
      signal,
    );
    if (!isRecord(parsed) || !Array.isArray(parsed['results'])) {
      throw new Error('Tavily 返回了未知响应');
    }

    const sources: WebSearchSource[] = [];
    for (const item of parsed['results']) {
      if (sources.length >= maxResults) break;
      if (!isRecord(item)) continue;
      const source = sourceOf(item['url'], item['title'], item['content'], item['published_date']);
      if (source !== null) sources.push(source);
    }
    const answer = strOrEmpty(parsed['answer']);
    return resultOf(sources, answer);
  }

  return {
    id: ID,
    label: 'Tavily',
    title: 'Tavily AI 搜索',
    credentialRef: CRED_REF,
    credentialRequired: true,
    homepage: 'https://tavily.com',
    description: 'AI 原生搜索 API，按 credits 计费；适合通用问答与资料检索。',
    freeNote: '免费额度 1,000 credits/月；basic 1 credit/次，advanced 2 credits/次。',
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
  };
}
