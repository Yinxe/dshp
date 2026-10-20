/**
 * Exa AI 搜索。
 *
 * POST https://api.exa.ai/search，鉴权走 x-api-key。
 * 返回 results[]；contents.text 作为 snippet。
 */
import z from '@deepseek-ai/schemastery';
import { isRecord, maxResultsOf, missingKey, postJson, resultOf, sourceOf } from './base.js';
import type {
  ProviderDeps,
  ProviderField,
  SearchProviderModule,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '../types.js';

const ID = 'exa';
const ENDPOINT = 'https://api.exa.ai/search';
const CRED_REF = 'EXA_API_KEY';

const FIELDS: readonly ProviderField[] = [
  {
    key: 'searchType',
    label: '检索模式',
    kind: 'select',
    options: [
      { value: 'auto', label: 'auto（自动选择）' },
      { value: 'fast', label: 'fast（更快更省）' },
      { value: 'deep', label: 'deep（更深，耗时更长）' },
    ],
    hint: 'auto 由 Exa 按查询选择；fast 成本更低，deep 适合复杂问题。',
  },
];

const CONFIG_SCHEMA: unknown = z.object({
  searchType: z.union([z.const('auto'), z.const('fast'), z.const('deep')]).default('auto'),
});

export function createExaModule(): SearchProviderModule {
  async function search(
    deps: ProviderDeps,
    request: WebSearchRequest,
    signal?: AbortSignal,
  ): Promise<WebSearchResult> {
    const key = await deps.resolveKey(CRED_REF);
    if (key === undefined) throw missingKey('Exa', CRED_REF);

    const config = deps.providerConfig(ID);
    const searchType =
      config['searchType'] === 'fast' || config['searchType'] === 'deep' ? config['searchType'] : 'auto';
    const maxResults = maxResultsOf(request.maxResults, deps.getConfig().maxResults);

    const parsed = await postJson(
      'Exa',
      ENDPOINT,
      {
        query: request.query,
        numResults: maxResults,
        type: searchType,
        contents: { text: { maxCharacters: 1200 } },
      },
      { 'x-api-key': key },
      signal,
    );
    if (!isRecord(parsed) || !Array.isArray(parsed['results'])) {
      throw new Error('Exa 返回了未知响应');
    }

    const sources: WebSearchSource[] = [];
    for (const item of parsed['results']) {
      if (sources.length >= maxResults) break;
      if (!isRecord(item)) continue;
      const source = sourceOf(
        item['url'],
        item['title'],
        item['text'] ?? item['summary'] ?? item['highlights'],
        item['publishedDate'],
      );
      if (source !== null) sources.push(source);
    }
    return resultOf(sources);
  }

  return {
    id: ID,
    label: 'Exa',
    title: 'Exa AI 搜索',
    credentialRef: CRED_REF,
    credentialRequired: true,
    homepage: 'https://exa.ai',
    description: 'AI 原生语义搜索，适合找高质量资料、相似页面与技术内容。',
    freeNote: '新账号约 $10 免费额度；fast 模式更省，auto 自动选择。',
    fields: FIELDS,
    defaultConfig: { searchType: 'auto' },
    configSchema: CONFIG_SCHEMA,
    sanitizePatch(raw: unknown): Record<string, unknown> | null {
      if (!isRecord(raw)) return null;
      const out: Record<string, unknown> = {};
      if (Object.hasOwn(raw, 'searchType')) {
        const value = raw['searchType'];
        if (value !== 'auto' && value !== 'fast' && value !== 'deep') {
          throw new Error("searchType 非法，应为 'auto' / 'fast' / 'deep'");
        }
        out['searchType'] = value;
      }
      return out;
    },
    snapshot(config: Record<string, unknown>): Record<string, unknown> {
      const value = config['searchType'];
      return {
        searchType: value === 'fast' || value === 'deep' ? value : 'auto',
      };
    },
    search,
  };
}
