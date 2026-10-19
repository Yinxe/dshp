/**
 * 供应商适配器公共基座（纯函数 + 注册样板，零外部依赖）
 *
 * 原实现：dsh-tavily-search/lib/index.js 中的 provider 对象与错误抽取逻辑（JS）
 * → 本文件抽出跨供应商可复用部分；新的 AI 搜索供应商只需实现
 * `SearchProviderModule`（见 ../types.ts），其余样板由本文件提供。
 *
 * @module @dshp/search-provider
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, readBody, sameOrigin } from '../http.js';
import type {
  AnyCtx,
  ProviderDeps,
  SearchProviderModule,
  WebSearchProviderLike,
  WebSearchRequest,
  WebSearchResult,
} from '../types.js';

export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 数字或 null（API 字段消毒：非有限值一律 null，不透传 NaN/字符串） */
export function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** 字符串或空串（API 字段消毒） */
export function strOrEmpty(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/**
 * 从 API 错误响应里抽取可读 detail：`detail.error` → `error` → `message` → fallback。
 * 只读叶子字符串，不透传整包。
 */
export function extractApiDetail(parsed: unknown, fallback: string): string {
  if (isRecord(parsed)) {
    const d = parsed['detail'];
    if (isRecord(d) && typeof d['error'] === 'string' && d['error'].length > 0) return d['error'];
    for (const k of ['error', 'message']) {
      const v = parsed[k];
      if (typeof v === 'string' && v.length > 0) return v;
    }
  }
  return fallback;
}

/** 供应商 id 规则：小写字母/数字/横线，2–31 位（注册给 ctx.web 的主键，不可改） */
export const PROVIDER_ID_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

/** credentials 引用名规则（环境变量名形态，凭证库与 env 都认） */
const CRED_REF_RE = /^[A-Z][A-Z0-9_]{2,63}$/;

/**
 * 校验模块形状（注册表启动时调用，fail-fast，报错即指出缺失字段）。
 * @returns 错误描述；'' 表示通过
 */
export function checkModuleShape(m: unknown): string {
  if (!isRecord(m)) return '模块为空';
  const id = m['id'];
  if (typeof id !== 'string' || !PROVIDER_ID_RE.test(id)) return `id 非法（${String(id)}）`;
  for (const key of ['label', 'title', 'homepage', 'description']) {
    const v = m[key];
    if (typeof v !== 'string' || v.length === 0) return `供应商 ${id} 缺少 ${key}`;
  }
  const ref = m['credentialRef'];
  if (typeof ref !== 'string' || !CRED_REF_RE.test(ref))
    return `供应商 ${id} 的 credentialRef 非法（${String(ref)}）`;
  if (!Array.isArray(m['fields'])) return `供应商 ${id} 缺少 fields 数组`;
  if (!isRecord(m['defaultConfig'])) return `供应商 ${id} 缺少 defaultConfig 对象`;
  if (m['configSchema'] === undefined) return `供应商 ${id} 缺少 configSchema`;
  for (const key of ['sanitizePatch', 'snapshot', 'search', 'stateExtras']) {
    if (typeof m[key] !== 'function') return `供应商 ${id} 缺少 ${key}()`;
  }
  return '';
}

/**
 * 把供应商模块包装成 web seam 契约的提供方。
 * `available()` 恒 true：解析器恒存在，密钥缺失在 search 里给出可操作的中文错误
 * （seam 的 available 只做本地可用性判断，不能联网，也不该因缺密钥就把提供方摘掉）。
 */
export function createWebSearchProvider(
  module: SearchProviderModule,
  deps: ProviderDeps,
): WebSearchProviderLike {
  return {
    id: module.id,
    available(): boolean {
      return true;
    },
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
      return module.search(deps, request, signal);
    },
  };
}

/**
 * 注册一条同源 exact 路由：内部自带 sameOrigin 校验、ctx.effect 与 try/catch。
 * handler 只写业务分支；跨站/方法错误由本函数统一应答 4xx。
 */
export function registerExactRoute(
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

/** POST 路由的 JSON body 解析（非法即回 200 + ok:false，业务错误不进 4xx） */
export async function readJsonObject(
  req: IncomingMessage,
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const parsed: unknown = JSON.parse((await readBody(req)) || '{}');
    if (!isRecord(parsed)) return { ok: false, error: '请求体不是合法 JSON 对象' };
    return { ok: true, value: parsed };
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    if (message === 'payload-too-large') return { ok: false, error: '请求体超过 1MB 上限' };
    return { ok: false, error: '请求体不是合法 JSON' };
  }
}
