/**
 * Host 同源路由封装
 *  - GET  /ext/dshp-token-meter/state
 *  - POST /ext/dshp-token-meter/config
 *  - POST /ext/dshp-token-meter/refresh
 *  - POST /ext/dshp-token-meter/set-active
 *  - POST /ext/dshp-token-meter/set-refresh
 *  - POST /ext/dshp-token-meter/set-enabled
 *  - POST /ext/dshp-token-meter/set-vendor-enabled
 *  - POST /ext/dshp-token-meter/add-vendor
 *  - POST /ext/dshp-token-meter/update-vendor
 *  - POST /ext/dshp-token-meter/delete-vendor
 *  - POST /ext/dshp-token-meter/secret-to-cred
 *  - GET  /ext/dshp-token-meter/stats（别名 /data）
 */
import type { ConfigPatch, QuotaStateResponse, StatsSnapshot, TokenMeterConfig, Vendor } from './types.js';

const BASE = '/ext/dshp-token-meter';

async function post(path: string, body: unknown): Promise<any> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return (await r.json()) as any;
}

export async function fetchState(): Promise<QuotaStateResponse> {
  const r = await fetch(`${BASE}/state`, { cache: 'no-store' });
  return (await r.json()) as QuotaStateResponse;
}

export async function saveConfig(
  patch: ConfigPatch,
): Promise<{ ok: boolean; config?: TokenMeterConfig; error?: string }> {
  return (await post('/config', patch)) as { ok: boolean; config?: TokenMeterConfig; error?: string };
}

export async function refreshQuota(
  id?: string,
): Promise<{ ok: boolean; snaps?: Record<string, any>; error?: string }> {
  return (await post('/refresh', id ? { id } : {})) as {
    ok: boolean;
    snaps?: Record<string, any>;
    error?: string;
  };
}

export async function setActive(id: string): Promise<{ ok: boolean; error?: string }> {
  return (await post('/set-active', { id })) as { ok: boolean; error?: string };
}

export async function setRefresh(sec: number): Promise<{ ok: boolean; sec?: number; error?: string }> {
  return (await post('/set-refresh', { sec })) as { ok: boolean; sec?: number; error?: string };
}

export async function setEnabled(
  enabled: boolean,
): Promise<{ ok: boolean; enabled?: boolean; error?: string }> {
  return (await post('/set-enabled', { enabled })) as { ok: boolean; enabled?: boolean; error?: string };
}

/** 单个供应商的余额查询开关：false = 退出 Host 主动定时拉取（手动拉取不受影响） */
export async function setVendorEnabled(
  id: string,
  enabled: boolean,
): Promise<{ ok: boolean; id?: string; enabled?: boolean; error?: string }> {
  return (await post('/set-vendor-enabled', { id, enabled })) as {
    ok: boolean;
    id?: string;
    enabled?: boolean;
    error?: string;
  };
}

export async function addVendor(vendor: Vendor): Promise<{ ok: boolean; error?: string }> {
  return (await post('/add-vendor', { vendor })) as { ok: boolean; error?: string };
}

export async function updateVendor(vendor: Vendor): Promise<{ ok: boolean; error?: string }> {
  return (await post('/update-vendor', { vendor })) as { ok: boolean; error?: string };
}

export async function deleteVendor(id: string): Promise<{ ok: boolean; error?: string }> {
  return (await post('/delete-vendor', { id })) as { ok: boolean; error?: string };
}

export async function secretToCred(id: string): Promise<{ ok: boolean; cred?: string; error?: string }> {
  return (await post('/secret-to-cred', { id })) as { ok: boolean; cred?: string; error?: string };
}

/** 清除统计派生缓存（下次快照全量重算）；缓存可丢，会话日志才是真相源 */
export async function clearStatsCache(): Promise<{ ok: boolean; removed?: number; error?: string }> {
  return (await post('/clear-cache', {})) as { ok: boolean; removed?: number; error?: string };
}

export async function fetchStats(): Promise<StatsSnapshot> {
  const r = await fetch(`${BASE}/stats`, { cache: 'no-store' });
  return (await r.json()) as StatsSnapshot;
}
