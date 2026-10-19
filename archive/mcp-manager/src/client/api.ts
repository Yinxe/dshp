/**
 * Host 同源路由封装
 *  - GET  /ext/dshp-mcp-manager/state        全量快照（patch 文件 + 条目 + 探活缓存）
 *  - POST /ext/dshp-mcp-manager/config       保存 enabled / patchFile
 *  - POST /ext/dshp-mcp-manager/create       新建 MCP 服务器条目
 *  - POST /ext/dshp-mcp-manager/update       编辑条目 config
 *  - POST /ext/dshp-mcp-manager/toggle       启停（写/删条目级 disabled）
 *  - POST /ext/dshp-mcp-manager/remove       删除条目
 *  - POST /ext/dshp-mcp-manager/probe        streamable-http initialize 探活
 */
import type { McpState, MutateResponse, ProbeResponse, StateResponse } from './types.js';

const BASE = '/ext/dshp-mcp-manager';

async function postJson(
  path: string,
  payload: unknown,
): Promise<{ ok: boolean; error?: string; state?: McpState }> {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await r.json()) as { ok: boolean; error?: string; state?: McpState };
}

export async function fetchState(): Promise<StateResponse> {
  const r = await fetch(`${BASE}/state`, { cache: 'no-store' });
  return (await r.json()) as StateResponse;
}

export function saveManagerConfig(patch: { enabled?: boolean; patchFile?: string }): Promise<MutateResponse> {
  return postJson('/config', patch) as Promise<MutateResponse>;
}

export function createServer(config: unknown): Promise<MutateResponse> {
  return postJson('/create', { config });
}

export function updateServer(id: string, config: unknown): Promise<MutateResponse> {
  return postJson('/update', { id, config });
}

export function toggleServer(id: string, disabled: boolean): Promise<MutateResponse> {
  return postJson('/toggle', { id, disabled });
}

export function removeServer(id: string): Promise<MutateResponse> {
  return postJson('/remove', { id });
}

export function probeServer(id: string): Promise<ProbeResponse> {
  return postJson('/probe', { id }) as Promise<ProbeResponse>;
}
