/**
 * 设置页 ↔ Host 的同源路由 + credentials 写入。
 */
import { ROUTE_BASE } from './types.js';
import type { CredentialReply, RemoteLike, SaveResponse, StateResponse, TestResponse } from './types.js';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(ROUTE_BASE + path, { cache: 'no-store', ...init });
  try {
    return (await response.json()) as T;
  } catch {
    return {
      ok: false,
      error: `接口返回了非 JSON 响应（HTTP ${response.status}），请重启 dsh web 后重试`,
    } as T;
  }
}

export function fetchState(): Promise<StateResponse> {
  return request<StateResponse>('/state');
}

export function saveConfig(patch: Record<string, unknown>): Promise<SaveResponse> {
  return request<SaveResponse>('/config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function runTest(providerId: string, query: string): Promise<TestResponse> {
  return request<TestResponse>('/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: providerId, query }),
  });
}

export function friendlyCredError(action: 'save' | 'clear', ref: string, error: unknown): string {
  const raw = String((error as Error)?.message ?? error);
  if (/launching environment|shadowed|read-only/i.test(raw)) {
    if (action === 'clear') {
      return `当前 Key 来自启动 dsh 的终端环境（环境变量优先，页面无法清除）。如需改走文件管理：unset ${ref} 后重启 dsh web。`;
    }
    return `保存未生效：启动 dsh 的终端环境里已有 ${ref}，环境变量优先于凭证库。如需改走文件管理：unset ${ref} 后重启 dsh web，再回来保存。`;
  }
  return raw;
}

export async function saveKey(
  remote: RemoteLike | undefined,
  ref: string,
  value: string,
): Promise<CredentialReply> {
  if (!remote?.credentials) {
    return { ok: false, error: '凭证服务不可用（remote.credentials 未挂载），请重启 dsh web' };
  }
  try {
    const response = await remote.credentials.set(ref, value);
    if (response.ok) return { ok: true, state: await fetchState() };
    return { ok: false, error: friendlyCredError('save', ref, response.error?.message ?? '凭证写入失败') };
  } catch (error) {
    return { ok: false, error: friendlyCredError('save', ref, error) };
  }
}

export async function clearKey(remote: RemoteLike | undefined, ref: string): Promise<CredentialReply> {
  if (!remote?.credentials) {
    return { ok: false, error: '凭证服务不可用（remote.credentials 未挂载），请重启 dsh web' };
  }
  try {
    const response = await remote.credentials.unset(ref);
    if (response.ok) return { ok: true, state: await fetchState() };
    return { ok: false, error: friendlyCredError('clear', ref, response.error?.message ?? '凭证清除失败') };
  } catch (error) {
    return { ok: false, error: friendlyCredError('clear', ref, error) };
  }
}
