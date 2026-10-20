/**
 * 同源 JSON 路由小工具（本插件自有，零依赖）。
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

export function json(res: ServerResponse, status: number, value: unknown): void {
  if (res.writableEnded) return;
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(value));
}

export function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  if (typeof origin !== 'string') return false;
  const host = req.headers.host;
  if (typeof host !== 'string' || host.length === 0) return false;
  return origin === `http://${host}` || origin === `https://${host}`;
}

export function readBody(req: IncomingMessage, limit = 64 * 1024): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      reject(error);
      try {
        req.destroy();
      } catch {
        /* ignore */
      }
    };

    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        fail(new Error('payload-too-large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (error: Error) => fail(error));
  });
}

export function methodIs(req: IncomingMessage, method: string): boolean {
  return req.method === method;
}
