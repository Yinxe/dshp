/**
 * Host 同源路由封装（设置节的读 / 写）
 *
 *   GET  /ext/dshp-file-change-viewer/state   → 当前生效偏好
 *   POST /ext/dshp-file-change-viewer/config  → 保存偏好补丁
 *
 * BASE 与 Host 半 `routes.ts` 的路由逐字对齐；`cache: 'no-store'` 避免浏览器缓存状态。
 *
 * @module @dshp/file-change-viewer/client/api
 */
import type { ConfigPatch, StateResponse } from './types.js';

const BASE = '/ext/dshp-file-change-viewer';

/** 读当前生效偏好。 */
export async function fetchState(): Promise<StateResponse> {
  const response = await fetch(`${BASE}/state`, { cache: 'no-store' });
  return (await response.json()) as StateResponse;
}

/** 保存偏好补丁（Host 侧写 settings.yaml 的 NS 分节）。 */
export async function saveConfig(patch: ConfigPatch): Promise<StateResponse> {
  const response = await fetch(`${BASE}/config`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch ?? {}),
  });
  return (await response.json()) as StateResponse;
}
