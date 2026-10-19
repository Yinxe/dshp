/**
 * Host 同源路由封装
 *  - GET  /ext/dshp-widget-kit/state
 *  - POST /ext/dshp-widget-kit/config
 *
 * @module @dshp/widget-kit/client/api
 */
import type { ConfigPatch, FrameworkConfig, StateResponse } from './types.js';

const BASE = '/ext/dshp-widget-kit';

export async function fetchState(): Promise<StateResponse> {
  const r = await fetch(`${BASE}/state`, { cache: 'no-store' });
  return (await r.json()) as StateResponse;
}

export async function saveConfig(
  patch: ConfigPatch,
): Promise<{ ok: boolean; config?: FrameworkConfig; error?: string }> {
  const r = await fetch(`${BASE}/config`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return (await r.json()) as { ok: boolean; config?: FrameworkConfig; error?: string };
}
