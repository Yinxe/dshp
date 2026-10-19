/**
 * 设置页 ↔ Host 的同源路由封装 + 凭证写入
 *
 * - 状态/配置/测试：fetch 同源 `/ext/dshp-search-provider/*`（cache: no-store）
 * - 密钥：走 api 网关的 credentials 域（remote.credentials.set/unset），不回显
 *
 * 原实现：dsh-tavily-search/client.js 里的 bridge 对象（JS）
 * → 本文件为等价 TS 重写：路由改为按 provider id 参数化（多供应商），
 *   credentials 引用名由状态接口给出，不再硬编码。
 *
 * @module @dshp/search-provider/client
 */
import { ROUTE_BASE } from './types.js';
import type {
  ConfigSaveResponse,
  CredentialReply,
  StateResponse,
  TestResponse,
  UsageResponse,
} from './types.js';

export interface Bridge {
  getState(): Promise<StateResponse>;
  saveConfig(patch: Record<string, unknown>): Promise<ConfigSaveResponse>;
  runTest(providerId: string, query: string): Promise<TestResponse>;
  getUsage(providerId: string, force: boolean): Promise<UsageResponse>;
  saveKey(ref: string, value: string): Promise<CredentialReply>;
  clearKey(ref: string): Promise<CredentialReply>;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: '接口返回空响应（Host 可能是旧版本）：请重启 dsh web 后刷新页面重试。',
      needsRestart: true,
    } as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      ok: false,
      error: `接口返回了非 JSON 响应（HTTP ${response.status}）：请重启 dsh web 后刷新页面重试。`,
      needsRestart: true,
    } as T;
  }
}

/**
 * 平台原文晦涩（如 credentials-local 的 shadowed 报错），转成能直接照做的中文。
 * 触发条件：启动 dsh 的终端环境里已有同名变量（环境变量优先于凭证库，存了也读不到）。
 */
export function friendlyCredError(action: 'save' | 'clear', ref: string, error: unknown): string {
  const raw = String((error as Error)?.message ?? error);
  if (/launching environment|shadowed|read-only/i.test(raw)) {
    if (action === 'clear') {
      return `当前 Key 来自启动 dsh 的终端环境（环境变量优先，页面无法清除）。如需改走文件管理：unset ${ref} 后重启 dsh web。`;
    }
    return `保存未生效：启动 dsh 的终端环境里已有 ${ref}，环境变量优先于凭证库，存了也不会被读取。如需改走文件管理：unset ${ref} 后重启 dsh web，再回来保存；或直接测试，环境里的 Key 已可用。`;
  }
  return raw;
}

export function createBridge(remote: any): Bridge {
  const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(ROUTE_BASE + path, { cache: 'no-store', ...init });
    if (response.status === 404) {
      return {
        ok: false,
        error: `接口 404：Host 还是旧版本（新路由未加载），请重启 dsh web 后刷新页面重试。`,
        needsRestart: true,
      } as T;
    }
    return readJson<T>(response);
  };

  return {
    getState: () => fetchJson<StateResponse>('/state'),

    saveConfig: (patch) =>
      fetchJson<ConfigSaveResponse>('/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch || {}),
      }),

    runTest: (providerId, query) =>
      fetchJson<TestResponse>('/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: providerId, query }),
      }),

    getUsage: (providerId, force) =>
      fetchJson<UsageResponse>(`/${providerId}/usage${force ? '?force=1' : ''}`),

    /**
     * 写入密钥：官方形态 remote.credentials.set(ref, value) → { ok:true } /
     * { ok:false, error:{ message } }；成功后回读状态，界面即时反映。
     */
    saveKey: async (ref, value) => {
      try {
        const response = await remote?.credentials?.set(ref, value);
        if (response && response.ok === true)
          return { ok: true, state: await fetchJson<StateResponse>('/state') };
        const message = response?.error?.message ? String(response.error.message) : '凭证写入失败';
        return { ok: false, error: friendlyCredError('save', ref, message) };
      } catch (error) {
        return { ok: false, error: friendlyCredError('save', ref, error) };
      }
    },

    clearKey: async (ref) => {
      try {
        const response = await remote?.credentials?.unset(ref);
        if (response && response.ok === true)
          return { ok: true, state: await fetchJson<StateResponse>('/state') };
        const message = response?.error?.message ? String(response.error.message) : '凭证清除失败';
        return { ok: false, error: friendlyCredError('clear', ref, message) };
      } catch (error) {
        return { ok: false, error: friendlyCredError('clear', ref, error) };
      }
    },
  };
}
