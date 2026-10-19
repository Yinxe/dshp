/**
 * Host 同源路由封装
 *  - GET  /ext/dshp-mcwiki-search/state
 *  - POST /ext/dshp-mcwiki-search/config
 *  - POST /ext/dshp-mcwiki-search/test
 */
import type { ConfigPatch, McWikiConfig, StateResponse, TestKind, TestResponse } from './types.js';

const BASE = '/ext/dshp-mcwiki-search';

export async function fetchState(): Promise<StateResponse> {
  const r = await fetch(`${BASE}/state`, { cache: 'no-store' });
  return (await r.json()) as StateResponse;
}

export async function saveConfig(
  patch: ConfigPatch,
): Promise<{ ok: boolean; config?: McWikiConfig; error?: string }> {
  const r = await fetch(`${BASE}/config`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch ?? {}),
  });
  return (await r.json()) as { ok: boolean; config?: McWikiConfig; error?: string };
}

export async function runTest(value: string, kind: TestKind): Promise<TestResponse> {
  const r = await fetch(`${BASE}/test`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(
      kind === 'page' ? { query: value, title: value, section: 'full' } : { query: value, section: 'intro' },
    ),
  });
  return (await r.json()) as TestResponse;
}
