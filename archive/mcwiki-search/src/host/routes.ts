/**
 * 同源 JSON 路由（设置页 / 验证用）
 *
 *   GET  /ext/dshp-mcwiki-search/state
 *   POST /ext/dshp-mcwiki-search/config  { timeoutMs?, maxChars?, introMaxChars?, searchMaxResults? }
 *   POST /ext/dshp-mcwiki-search/test    { query, title?, section? }
 *
 * 原实现：lib/index.js 的 registerRoutes 段（JS）→ 本文件为等价 TS 重写，行为不变。
 */
import type { IncomingMessage } from 'node:http';
import { fetchPageIntro, fetchPageWikitext, searchWiki } from './api.js';
import { wikitextToMarkdown } from './convert.js';
import { json, readBody, sameOrigin } from './http.js';
import type { AnyCtx, PluginConfig } from './types.js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function snapshotOf(config: PluginConfig): PluginConfig {
  return {
    timeoutMs: config.timeoutMs,
    maxChars: config.maxChars,
    introMaxChars: config.introMaxChars,
    searchMaxResults: config.searchMaxResults,
  };
}

export function registerRoutes(
  ctx: AnyCtx,
  getConfig: () => PluginConfig,
  updateConfig: (patch: Record<string, unknown>) => Promise<void>,
): void {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-mcwiki-search/state',
        handler: async (req: IncomingMessage, res: AnyCtx) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          const config = getConfig();
          json(res, 200, {
            ok: true,
            timeoutMs: config.timeoutMs,
            maxChars: config.maxChars,
            introMaxChars: config.introMaxChars,
            searchMaxResults: config.searchMaxResults,
            config: snapshotOf(config),
            tools: ['mcwiki_search', 'mcwiki_get_page', 'mcwiki_random'],
          });
        },
      }),
    'dshp-mcwiki-search: state route',
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-mcwiki-search/config',
        handler: async (req: IncomingMessage, res: AnyCtx) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          if ((req as { method?: string }).method !== 'POST')
            return json(res, 405, { ok: false, error: 'method not allowed' });
          let body: unknown = {};
          try {
            body = JSON.parse((await readBody(req)) || '{}') as unknown;
          } catch {
            return json(res, 200, { ok: false, error: '请求体不是合法 JSON' });
          }
          const a: Record<string, unknown> = isRecord(body) ? body : {};
          try {
            const configPatch: Record<string, unknown> = {};
            let hasPatch = false;
            if (Object.hasOwn(a, 'timeoutMs')) {
              const n = Number(a['timeoutMs']);
              if (!Number.isFinite(n) || n < 1000) throw new Error('timeoutMs 非法，应为 ≥1000 的毫秒数');
              configPatch['timeoutMs'] = n;
              hasPatch = true;
            }
            if (Object.hasOwn(a, 'maxChars')) {
              const n = Number(a['maxChars']);
              if (!Number.isFinite(n) || n < 0)
                throw new Error('maxChars 非法，应为 ≥0 的整数（0 = 不截断）');
              configPatch['maxChars'] = n;
              hasPatch = true;
            }
            if (Object.hasOwn(a, 'introMaxChars')) {
              const n = Number(a['introMaxChars']);
              if (!Number.isFinite(n) || n < 0)
                throw new Error('introMaxChars 非法，应为 ≥0 的整数（0 = 不截断）');
              configPatch['introMaxChars'] = n;
              hasPatch = true;
            }
            if (Object.hasOwn(a, 'searchMaxResults')) {
              const n = Number(a['searchMaxResults']);
              if (!Number.isFinite(n) || n < 1) throw new Error('searchMaxResults 非法，应为 ≥1 的整数');
              configPatch['searchMaxResults'] = n;
              hasPatch = true;
            }
            if (hasPatch) await updateConfig(configPatch);
            const config = getConfig();
            return json(res, 200, {
              ok: true,
              config: {
                timeoutMs: config.timeoutMs,
                maxChars: config.maxChars,
                introMaxChars: config.introMaxChars,
                searchMaxResults: config.searchMaxResults,
              },
            });
          } catch (error) {
            return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
          }
        },
      }),
    'dshp-mcwiki-search: config route',
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-mcwiki-search/test',
        handler: async (req: IncomingMessage, res: AnyCtx) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          if ((req as { method?: string }).method !== 'POST')
            return json(res, 405, { ok: false, error: 'method not allowed' });
          const startedAt = Date.now();
          try {
            const parsed: unknown = JSON.parse((await readBody(req)) || '{}');
            const p: Record<string, unknown> = isRecord(parsed) ? parsed : {};
            const query = typeof p['query'] === 'string' ? (p['query'] as string).trim() : '';
            if (query.length === 0) {
              return json(res, 200, { ok: false, error: '请输入测试查询', takenMs: Date.now() - startedAt });
            }
            const title = typeof p['title'] === 'string' ? (p['title'] as string).trim() : undefined;
            const section = p['section'] === 'full' ? 'full' : 'intro';

            const config = getConfig();
            const search = await searchWiki({
              query,
              timeoutMs: config.timeoutMs,
            });
            let page: Record<string, unknown> | null = null;
            if (search.results.length > 0) {
              const first = search.results[0];
              const target =
                title !== undefined && title.length > 0 ? title : first !== undefined ? first.title : query;
              if (section === 'intro') {
                const intro = await fetchPageIntro({
                  title: target,
                  timeoutMs: config.timeoutMs,
                  ...(config.introMaxChars > 0 ? { maxChars: config.introMaxChars } : {}),
                });
                page = {
                  title: intro.title,
                  section: 'intro',
                  format: 'text',
                  text: intro.text,
                  url: intro.url,
                };
              } else {
                const full = await fetchPageWikitext({
                  title: target,
                  timeoutMs: config.timeoutMs,
                });
                // UI 预览保持有界（模型工具输出才是完整的）；6k 字符足够看清转换效果
                const converted = wikitextToMarkdown(full.wikitext, { maxChars: 6000 });
                page = {
                  title: full.title,
                  section: 'full',
                  format: 'markdown',
                  text: converted.markdown,
                  url: full.url,
                };
              }
            }

            return json(res, 200, {
              ok: true,
              query,
              totalHits: search.totalHits,
              results: search.results.slice(0, 5).map((item) => ({
                title: item.title,
                snippet: item.snippet,
                url: item.url,
                updated: item.updated,
              })),
              page,
              takenMs: Date.now() - startedAt,
            });
          } catch (error) {
            return json(res, 200, {
              ok: false,
              error: String((error as Error)?.message ?? error),
              takenMs: Date.now() - startedAt,
            });
          }
        },
      }),
    'dshp-mcwiki-search: test route',
  );
}
