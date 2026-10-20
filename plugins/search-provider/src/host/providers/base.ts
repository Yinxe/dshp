/**
 * 搜索后端公共工具：HTTP JSON、错误抽取、结果归一。
 */
import type { WebSearchResult, WebSearchSource } from '../types.js';

const SNIPPET_LIMIT = 1200;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function clampInt(value: unknown, min: number, max: number): number | undefined {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return number;
}

export function strOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** 从 API 错误响应里抽取可读 detail：detail.error → error → message → fallback。 */
export function extractApiDetail(parsed: unknown, fallback: string): string {
  if (isRecord(parsed)) {
    const detail = parsed['detail'];
    if (isRecord(detail) && typeof detail['error'] === 'string' && detail['error'].length > 0) {
      return detail['error'];
    }
    for (const key of ['error', 'message']) {
      const value = parsed[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return fallback;
}

/** 发一次 JSON POST；网络错误、非 2xx 都转成带 label 的中文 Error。 */
export async function postJson(
  label: string,
  url: string,
  body: unknown,
  headers: Record<string, string>,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      ...(signal === undefined ? {} : { signal }),
    });
  } catch (error) {
    if (signal?.aborted) {
      const aborted = new Error(`${label} 搜索已取消`);
      aborted.name = 'AbortError';
      throw aborted;
    }
    throw new Error(`${label} 请求失败：${String((error as Error)?.message ?? error)}`, {
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
    const detail = extractApiDetail(parsed, '');
    const suffix = detail.length > 0 ? `：${detail}` : '';
    throw new Error(`${label} 返回 HTTP ${response.status}${suffix}`);
  }
  return parsed;
}

/** 一条来源的 owned copy：url 必填，其余字段有值才带。 */
export function sourceOf(
  url: unknown,
  title: unknown,
  snippet: unknown,
  publishedAt: unknown,
): WebSearchSource | null {
  if (typeof url !== 'string' || url.length === 0) return null;
  const source: { url: string; title?: string; snippet?: string; publishedAt?: string } = { url };
  if (typeof title === 'string' && title.length > 0) source.title = title;
  if (typeof snippet === 'string' && snippet.length > 0) {
    source.snippet = snippet.slice(0, SNIPPET_LIMIT);
  }
  if (typeof publishedAt === 'string' && publishedAt.length > 0) source.publishedAt = publishedAt;
  return source;
}

export function resultOf(sources: WebSearchSource[], content?: string): WebSearchResult {
  const base: WebSearchResult = { sources, truncated: false };
  return typeof content === 'string' && content.length > 0 ? { ...base, content } : base;
}

export function maxResultsOf(requested: number | undefined, configMaxResults: number): number {
  const fallback = clampInt(configMaxResults, 1, 10) ?? 5;
  return clampInt(requested, 1, 10) ?? fallback;
}

export function missingKey(label: string, ref: string): Error {
  return new Error(`${label} 缺少 API Key「${ref}」：请打开 设置 → AI 搜索 配置密钥后重试。`);
}
