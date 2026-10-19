/**
 * Host 同源路由封装。
 *  - GET  /ext/dshp-vision-bridge/state
 *  - POST /ext/dshp-vision-bridge/config
 *  - GET  /ext/dshp-vision-bridge/check
 */
import type { CheckResponse, ConfigPatch, SaveResponse, StateResponse } from './types.js';

const BASE = '/ext/dshp-vision-bridge';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(BASE + path, { cache: 'no-store', ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function fetchState(): Promise<StateResponse> {
  return request<StateResponse>('/state');
}

export function saveConfig(patch: ConfigPatch): Promise<SaveResponse> {
  return request<SaveResponse>('/config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function checkRoutes(): Promise<CheckResponse> {
  return request<CheckResponse>('/check');
}
