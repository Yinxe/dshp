/**
 * mcwiki-search —— MediaWiki API 客户端
 *
 * 零依赖：仅使用全局 fetch（Node ≥ 20）。负责：
 *   - 固定中文端点（API_BASE，见下，不可配置）
 *   - 统一 UA / 超时 / 取消信号
 *   - 三个查询能力：搜索、页面内容（intro 纯文本 / 全文 wikitext）、随机条目
 *
 * 所有返回都已按「AI 可读」归一化（字段精简、错误中文化），
 * 但「转换」本身（wikitext→Markdown 等）在 convert.ts 完成，此处只做请求与归一化。
 *
 * 原实现：lib/api.js（JS，318 行）→ 本文件为等价 TS 重写，行为不变。
 */
import { cleanExtractText, cleanSearchSnippet, cleanTitle } from './convert.js';
import type { PageIntroResult, PageWikitextResult, RandomPagesResult, SearchWikiResult } from './types.js';

/**
 * MediaWiki API 端点：固定中文 Minecraft Wiki，不可配置。
 * 如需换站，直接改这里并重新 build（不要做成 settings 项）。
 */
export const API_BASE: string = 'https://zh.minecraft.wiki/api.php';

export const DEFAULT_TIMEOUT_MS = 15000;
export const DEFAULT_USER_AGENT =
  'mcwiki-search-dsh/1.1.0 (Minecraft Wiki query plugin; https://github.com/Yinxe/deepseek-harness-plugins)';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 页面 URL（固定中文站）：title → https://zh.minecraft.wiki/w/<Title>。 */
export function pageUrl(title: unknown): string {
  return `${API_BASE.replace(/\/api\.php$/, '')}/w/${encodeURIComponent(String(title).replace(/ /g, '_'))}`;
}

export interface RequestJsonOpts {
  method?: string | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  signal?: AbortSignal | undefined;
  timeoutMs?: unknown;
}

/**
 * 带超时与取消的 fetch 封装。
 * @throws 统一中文错误。
 */
export async function requestJson(url: string, opts: RequestJsonOpts = {}): Promise<Record<string, any>> {
  const timeoutMs = opts.timeoutMs !== undefined ? Number(opts.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  const signals: AbortSignal[] = [];
  if (opts.signal !== undefined) signals.push(opts.signal);
  signals.push(controller.signal);
  const signal =
    typeof AbortSignal.any === 'function' && signals.length > 1
      ? AbortSignal.any(signals)
      : (signals[0] as AbortSignal);

  let response: Response;
  const reqHeaders: Record<string, string> = {
    'user-agent': DEFAULT_USER_AGENT,
    accept: 'application/json',
  };
  if (opts.headers !== undefined) Object.assign(reqHeaders, opts.headers);
  try {
    response = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: reqHeaders,
      ...(opts.body !== undefined ? { body: opts.body } : {}),
      signal,
      redirect: 'follow',
    });
  } catch (error) {
    const e = error as { name?: string; message?: string };
    if (e && e.name === 'AbortError') {
      throw new Error(
        opts.signal !== undefined && opts.signal.aborted ? '请求已取消' : '请求超时，请稍后重试',
        {
          cause: error,
        },
      );
    }
    throw new Error(`网络请求失败：${String((e && e.message) || error)}`, { cause: error });
  } finally {
    clearTimeout(timer);
  }

  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const info = isRecord(parsed) && isRecord(parsed['error']) ? String(parsed['error']['info'] ?? '') : '';
    throw new Error(`Minecraft Wiki API 响应 ${response.status}${info ? `：${info}` : ''}`);
  }
  if (parsed === null || typeof parsed !== 'object')
    throw new Error('Minecraft Wiki API 返回了无法解析的响应');
  if (isRecord(parsed) && parsed['error'] !== undefined) {
    const err = parsed['error'];
    const info = isRecord(err) ? String(err['info'] ?? err['code'] ?? '未知错误') : '未知错误';
    throw new Error(`Minecraft Wiki API 错误：${info}`);
  }
  return parsed as Record<string, any>;
}

/** 拼接 MediaWiki action=query 请求 URL（固定中文端点）。 */
function queryUrl(params: Record<string, string>): string {
  const search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params });
  return `${API_BASE}?${search.toString()}`;
}

export interface SearchWikiOpts {
  query: unknown;
  limit?: unknown;
  signal?: AbortSignal | undefined;
  timeoutMs?: unknown;
}

/**
 * 全文搜索。
 * results[]: { title, pageid, url, snippet, updated } —— snippet 已清洗。
 */
export async function searchWiki(opts: SearchWikiOpts): Promise<SearchWikiResult> {
  const query = typeof opts.query === 'string' ? opts.query.trim() : '';
  if (query.length === 0) throw new Error('查询词不能为空');
  const limit = Math.min(Math.max(Number(opts.limit) || 8, 1), 50);

  const data = await requestJson(
    queryUrl({
      list: 'search',
      srsearch: query,
      srlimit: String(limit),
      srnamespace: '0',
      srprop: 'snippet|timestamp|size|wordcount',
    }),
    { signal: opts.signal, timeoutMs: opts.timeoutMs },
  );

  const searchInfo = isRecord(data['query']) ? data['query']['searchinfo'] : undefined;
  const hits = isRecord(searchInfo) ? Number(searchInfo['totalhits']) || 0 : 0;
  const rawItems = isRecord(data['query']) ? data['query']['search'] : undefined;
  const items: Array<Record<string, any>> = Array.isArray(rawItems)
    ? (rawItems as Array<Record<string, any>>)
    : [];
  const results = items
    .map((item) => ({
      title: cleanTitle(item['title']),
      pageid: Number(item['pageid']) || 0,
      url: pageUrl(item['title']),
      snippet: cleanSearchSnippet(typeof item['snippet'] === 'string' ? item['snippet'] : ''),
      updated: item['timestamp'] !== undefined ? String(item['timestamp']) : '',
    }))
    .filter((item) => item.title.length > 0);

  const truncated = limit < hits;
  return {
    success: true,
    query,
    totalHits: hits,
    truncated,
    results,
  };
}

interface ResolvedPage {
  page: Record<string, any>;
  effectiveTitle: string;
}

/** 解析 pageid / titles 查询的 pages 数组（formatversion=2）。 */
function resolvePages(data: Record<string, any>, opts: { title?: unknown; pageid?: unknown }): ResolvedPage {
  const query = isRecord(data['query']) ? (data['query'] as Record<string, any>) : {};
  const pages: Array<Record<string, any>> = Array.isArray(query['pages'])
    ? (query['pages'] as Array<Record<string, any>>)
    : [];
  const redirectedTo: Record<string, string> = {};
  if (Array.isArray(query['redirects'])) {
    for (const r of query['redirects'] as Array<Record<string, any>>) {
      if (r['from'] !== undefined && r['to'] !== undefined) redirectedTo[String(r['from'])] = String(r['to']);
    }
  }
  if (pages.length === 0) {
    throw new Error('未找到该页面（可能不存在或已被删除）');
  }
  const page = pages[0] as Record<string, any>;
  if (page === undefined || page['missing'] === true) {
    const wanted =
      opts.title !== undefined
        ? String(opts.title)
        : opts.pageid !== undefined
          ? `#${String(opts.pageid)}`
          : '';
    throw new Error(`页面不存在：${wanted}`);
  }
  const rawTitle = String(page['title'] ?? '');
  const effectiveTitle = redirectedTo[rawTitle] ?? rawTitle;
  return { page, effectiveTitle };
}

export interface PageIntroOpts {
  title?: unknown;
  pageid?: unknown;
  maxChars?: unknown;
  /** 真 = 取整页纯文本（省略 exintro，正文分节都在）；缺省 = 只取引言段 */
  wholePage?: unknown;
  signal?: AbortSignal | undefined;
  timeoutMs?: unknown;
}

/**
 * 获取页面纯文本（经 MediaWiki extracts explaintext 清洗）。
 * 缺省只取「引言」段（exintro，wiki 的引言通常只有一两句）；
 * wholePage=true 取整页（正文分节都在），配合 maxChars 设上限。
 */
export async function fetchPageIntro(opts: PageIntroOpts): Promise<PageIntroResult> {
  const params: Record<string, string> = {
    prop: 'extracts',
    explaintext: '1',
    exlimit: '1',
    redirects: '1',
  };
  if (!opts.wholePage) params['exintro'] = '1';
  if (opts.pageid !== undefined) params['pageids'] = String(opts.pageid);
  else if (opts.title !== undefined) params['titles'] = String(opts.title);
  else throw new Error('必须提供 title 或 pageid');

  const data = await requestJson(queryUrl(params), {
    signal: opts.signal,
    timeoutMs: opts.timeoutMs,
  });
  const { page, effectiveTitle } = resolvePages(data, opts);
  const extract = typeof page['extract'] === 'string' ? page['extract'] : '';
  const maxChars =
    opts.maxChars !== undefined && Number(opts.maxChars) > 0 ? Number(opts.maxChars) : undefined;
  const cleaned = cleanExtractText(extract, maxChars === undefined ? {} : { maxChars });
  const out: PageIntroResult = {
    success: true,
    title: cleanTitle(effectiveTitle),
    pageid: Number(page['pageid']) || 0,
    url: pageUrl(effectiveTitle),
    section: opts.wholePage ? 'page' : 'intro',
    format: 'text',
    text: cleaned.text,
    truncated: cleaned.truncated,
  };
  if (typeof page['touched'] === 'string' || typeof page['touched'] === 'number') {
    return out;
  }
  return out;
}

export interface PageWikitextOpts {
  title?: unknown;
  pageid?: unknown;
  signal?: AbortSignal | undefined;
  timeoutMs?: unknown;
}

/** 获取页面全文 wikitext（供 markdown 转换 / 原始查看）。 */
export async function fetchPageWikitext(opts: PageWikitextOpts): Promise<PageWikitextResult> {
  const params: Record<string, string> = {
    prop: 'revisions',
    rvprop: 'content|timestamp',
    rvslots: 'main',
    rvlimit: '1',
    redirects: '1',
  };
  if (opts.pageid !== undefined) params['pageids'] = String(opts.pageid);
  else if (opts.title !== undefined) params['titles'] = String(opts.title);
  else throw new Error('必须提供 title 或 pageid');

  const data = await requestJson(queryUrl(params), {
    signal: opts.signal,
    timeoutMs: opts.timeoutMs,
  });
  const { page, effectiveTitle } = resolvePages(data, opts);
  const revisions: Array<Record<string, any>> = Array.isArray(page['revisions'])
    ? (page['revisions'] as Array<Record<string, any>>)
    : [];
  const revision = revisions[0];
  let wikitext = '';
  if (revision !== undefined && isRecord(revision['slots']) && isRecord(revision['slots']['main'])) {
    const main = revision['slots']['main'] as Record<string, unknown>;
    if (typeof main['*'] === 'string') wikitext = main['*'];
    else if (typeof main['content'] === 'string') wikitext = main['content'];
  }
  return {
    success: true,
    title: cleanTitle(effectiveTitle),
    pageid: Number(page['pageid']) || 0,
    url: pageUrl(effectiveTitle),
    wikitext,
    updated:
      revision !== undefined && revision['timestamp'] !== undefined ? String(revision['timestamp']) : '',
  };
}

export interface RandomPagesOpts {
  limit?: unknown;
  maxIntroChars?: unknown;
  signal?: AbortSignal | undefined;
  timeoutMs?: unknown;
}

/**
 * 随机条目。text 为引言纯文本（AI 可直接阅读），默认不截断；maxIntroChars 传正整数才截断。
 */
export async function fetchRandomPages(opts: RandomPagesOpts): Promise<RandomPagesResult> {
  const limit = Math.min(Math.max(Number(opts.limit) || 5, 1), 20);
  const maxIntroChars =
    opts.maxIntroChars !== undefined && Number(opts.maxIntroChars) > 0
      ? Number(opts.maxIntroChars)
      : undefined;

  const data = await requestJson(
    queryUrl({
      list: 'random',
      rnlimit: String(limit),
      rnnamespace: '0',
    }),
    { signal: opts.signal, timeoutMs: opts.timeoutMs },
  );

  const rawRandom = isRecord(data['query']) ? data['query']['random'] : undefined;
  const items: Array<Record<string, any>> = Array.isArray(rawRandom)
    ? (rawRandom as Array<Record<string, any>>)
    : [];
  const titles = items
    .map((item) => item['title'])
    .filter((title): title is string => typeof title === 'string' && title.length > 0);

  const results: RandomPagesResult['results'] = [];
  if (titles.length > 0) {
    const introData = await requestJson(
      queryUrl({
        prop: 'extracts',
        explaintext: '1',
        exintro: '1',
        exlimit: String(Math.min(titles.length, 20)),
        redirects: '1',
        titles: titles.join('|'),
      }),
      { signal: opts.signal, timeoutMs: opts.timeoutMs },
    );
    const rawPages = isRecord(introData['query']) ? introData['query']['pages'] : undefined;
    const pages: Array<Record<string, any>> = Array.isArray(rawPages)
      ? (rawPages as Array<Record<string, any>>)
      : [];
    const byTitle = new Map<string, Record<string, any>>();
    for (const page of pages) {
      if (page !== undefined && typeof page['title'] === 'string') byTitle.set(page['title'] as string, page);
    }
    for (const title of titles) {
      const page = byTitle.get(title);
      const extract =
        page !== undefined && typeof page['extract'] === 'string' ? (page['extract'] as string) : '';
      const cleaned = cleanExtractText(
        extract,
        maxIntroChars === undefined ? {} : { maxChars: maxIntroChars },
      );
      const item: RandomPagesResult['results'][number] = {
        title: cleanTitle(title),
        url: pageUrl(title),
        text: cleaned.text,
      };
      if (page !== undefined && page['pageid'] !== undefined) item.pageid = Number(page['pageid']) || 0;
      results.push(item);
    }
  }
  return {
    success: true,
    results,
  };
}
