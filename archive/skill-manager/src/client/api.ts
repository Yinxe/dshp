/**
 * Host 同源路由封装
 *  - GET  /ext/dshp-skill-manager/state        全量快照（根 + 技能 + 工作区）
 *  - GET  /ext/dshp-skill-manager/read         读单个技能全文
 *  - POST /ext/dshp-skill-manager/config       保存 enabled / workspaceRoot
 *  - POST /ext/dshp-skill-manager/create       新建技能
 *  - POST /ext/dshp-skill-manager/update       改受控字段 / 正文
 *  - POST /ext/dshp-skill-manager/toggle       切换模型 / 用户调用开关
 *  - POST /ext/dshp-skill-manager/remove       删除技能
 *  - POST /ext/dshp-skill-manager/transfer     复制 / 移动 / 改名
 */
import type {
  ConfigResponse,
  CreatePayload,
  ReadResponse,
  StateResponse,
  TogglePayload,
  TransferPayload,
  UpdatePayload,
} from './types.js';

const BASE = '/ext/dshp-skill-manager';

async function postJson(
  path: string,
  payload: unknown,
): Promise<{ ok: boolean; error?: string; state?: unknown }> {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await r.json()) as { ok: boolean; error?: string; state?: unknown };
}

export async function fetchState(): Promise<StateResponse> {
  const r = await fetch(`${BASE}/state`, { cache: 'no-store' });
  return (await r.json()) as StateResponse;
}

export async function fetchSkill(rootId: string, name: string): Promise<ReadResponse> {
  const r = await fetch(`${BASE}/read?root=${encodeURIComponent(rootId)}&name=${encodeURIComponent(name)}`, {
    cache: 'no-store',
  });
  return (await r.json()) as ReadResponse;
}

export async function saveConfig(patch: {
  enabled?: boolean;
  workspaceRoot?: string;
}): Promise<ConfigResponse> {
  const r = await fetch(`${BASE}/config`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return (await r.json()) as ConfigResponse;
}

export function createSkill(
  payload: CreatePayload,
): Promise<{ ok: boolean; error?: string; state?: unknown }> {
  return postJson('/create', payload);
}

export function updateSkill(
  payload: UpdatePayload,
): Promise<{ ok: boolean; error?: string; state?: unknown }> {
  return postJson('/update', payload);
}

export function toggleSkill(
  payload: TogglePayload,
): Promise<{ ok: boolean; error?: string; state?: unknown }> {
  return postJson('/toggle', payload);
}

export function removeSkill(payload: {
  rootId: string;
  name: string;
}): Promise<{ ok: boolean; error?: string; state?: unknown }> {
  return postJson('/remove', payload);
}

export function transferSkill(
  payload: TransferPayload,
): Promise<{ ok: boolean; error?: string; state?: unknown }> {
  return postJson('/transfer', payload);
}
