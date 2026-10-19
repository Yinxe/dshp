/**
 * Streamable HTTP 服务器探活：发一次 MCP initialize 握手（只读操作，
 * 不执行任何工具），证明可达性与协议可用，顺带带回 serverInfo。
 *
 * - `!!js` 标记的请求头无法在本插件里求值（那是 DSH loader 的活），跳过并注明
 * - stdio 不探活：spawn 子进程有副作用（docs/security.md 最小暴露）
 *
 * @module @dshp/mcp-manager
 */
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { ProbeResult } from './types.js';

const PROBE_TIMEOUT_MS = 5000;
const PROTOCOL_VERSION = '2025-03-26';

/**
 * 构建期由 tsup 从 package.json 注入的插件版本（见 `tsup.config.ts`）。握手里的 `clientInfo.version`
 * 是「谁来探的、什么版本」——写死字面量必然与 package.json 漂移（升版本时会漏掉这里），所以
 * 版本只有一个来源。直接跑源码（不经 tsup）时这个标识符不存在，`typeof` 探测不会抛，退化成 `0.0.0`。
 */
declare const __DSHP_MCP_MANAGER_VERSION__: string | undefined;
const CLIENT_VERSION =
  typeof __DSHP_MCP_MANAGER_VERSION__ === 'string' ? __DSHP_MCP_MANAGER_VERSION__ : '0.0.0';

interface ProbeInput {
  url: string;
  headers: Record<string, { js: boolean; source: string }>;
}

export async function probeStreamableHttp(input: ProbeInput): Promise<ProbeResult> {
  const started = Date.now();
  const base: ProbeResult = {
    state: 'fail',
    detail: '',
    serverInfoName: '',
    serverInfoVersion: '',
    protocolVersion: '',
    latencyMs: null,
    at: started,
  };
  let target: URL;
  try {
    target = new URL(input.url);
  } catch {
    return { ...base, detail: 'URL 无法解析：' + input.url.slice(0, 200) };
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return { ...base, detail: 'URL 协议不支持（仅 http/https）' };
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  };
  const skipped: string[] = [];
  for (const [k, v] of Object.entries(input.headers)) {
    if (v.js) {
      skipped.push(k);
      continue;
    }
    if (v.source) headers[k] = v.source;
  }
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dshp-mcp-manager', version: CLIENT_VERSION },
    },
  });

  const raw = await new Promise<{ status: number; text: string; contentType: string }>((resolve, reject) => {
    const req = (target.protocol === 'https:' ? httpsRequest : httpRequest)(
      target,
      { method: 'POST', headers, timeout: PROBE_TIMEOUT_MS },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (c: Buffer) => {
          size += c.length;
          if (size <= 512 * 1024) chunks.push(c);
        });
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString('utf8'),
            contentType: String(res.headers['content-type'] ?? ''),
          }),
        );
      },
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('连接超时（' + PROBE_TIMEOUT_MS + 'ms）'));
    });
    req.on('error', (e: Error) => reject(e));
    req.end(body);
    // 兜底定时器：部分平台 timeout 事件不触发 destroy
    const bail = setTimeout(() => {
      try {
        req.destroy();
      } catch {
        /* ignore */
      }
      reject(new Error('连接超时（' + PROBE_TIMEOUT_MS + 'ms）'));
    }, PROBE_TIMEOUT_MS + 500);
    bail.unref?.();
  }).catch((e: unknown) => {
    return { status: 0, text: '', contentType: '', error: String((e as Error)?.message ?? e) };
  });

  const latencyMs = Date.now() - started;
  const errInfo = raw as { error?: string };
  if (errInfo.error) {
    return { ...base, latencyMs, detail: ('探活失败：' + errInfo.error).slice(0, 300) };
  }

  const payload = parseProbeResponse(raw.text, raw.contentType);
  if (payload === null) {
    return {
      ...base,
      latencyMs,
      detail: (
        'HTTP ' +
        raw.status +
        '，但响应不是可解析的 JSON-RPC（content-type: ' +
        raw.contentType.slice(0, 80) +
        '）'
      ).slice(0, 300),
    };
  }
  const result = isRecord(payload['result']) ? (payload['result'] as Record<string, unknown>) : null;
  const rpcError = isRecord(payload['error']) ? (payload['error'] as Record<string, unknown>) : null;
  const serverInfo =
    result && isRecord(result['serverInfo']) ? (result['serverInfo'] as Record<string, unknown>) : null;
  const protocolVersion =
    result && typeof result['protocolVersion'] === 'string' ? result['protocolVersion'] : '';
  const state: ProbeResult['state'] = 'ok';
  let detail: string;
  if (result) {
    detail = '握手成功';
  } else if (rpcError) {
    detail = ('服务可达，但 initialize 被拒：' + String(rpcError['message'] ?? '未知错误')).slice(0, 300);
  } else {
    detail = '服务可达，响应缺 result/error 字段';
  }
  if (skipped.length > 0)
    detail += '；含 !!js 的请求头未参与探活（' + skipped.join(', ').slice(0, 120) + '）';
  return {
    state,
    detail,
    serverInfoName:
      serverInfo && typeof serverInfo['name'] === 'string' ? serverInfo['name'].slice(0, 120) : '',
    serverInfoVersion:
      serverInfo && typeof serverInfo['version'] === 'string' ? serverInfo['version'].slice(0, 60) : '',
    protocolVersion: protocolVersion.slice(0, 40),
    latencyMs,
    at: Date.now(),
  };
}

function parseProbeResponse(text: string, contentType: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const v = JSON.parse(trimmed) as unknown;
    if (isRecord(v)) return v;
  } catch {
    /* fallthrough：SSE 形态再试 */
  }
  if (contentType.includes('text/event-stream')) {
    // SSE 帧：取最后一段 data: 行的 JSON（倒序找第一个可解析的）
    const frames = trimmed.split('\n').filter((l) => l.startsWith('data:'));
    for (let i = frames.length - 1; i >= 0; i -= 1) {
      const frame = frames[i];
      if (frame === undefined) continue;
      try {
        const v = JSON.parse(frame.slice(5).trim()) as unknown;
        if (isRecord(v)) return v;
      } catch {
        /* 继续找下一帧 */
      }
    }
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
