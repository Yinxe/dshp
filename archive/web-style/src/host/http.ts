/**
 * 同源 JSON 路由小工具（本插件自有，零依赖；各插件独立持有，不跨包同步）
 * 原实现：dsh-custom-ui/lib/index.js 顶部同名函数，逐行等价
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/;

/** settings 命名空间 kebab-case 运行时校验 */
export function settingsNamespace(value: string): string {
  if (!NAMESPACE_PATTERN.test(value)) {
    throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
  }
  return value;
}

/** JSON 应答（含 no-store：/ext 状态接口不进缓存） */
export function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

interface OriginRequest {
  headers: Record<string, string | string[] | undefined>;
}

/** 拦截跨站调用：无 Origin 头（同源 GET）或 Origin 与 Host 一致才放行 */
export function sameOrigin(req: IncomingMessage | OriginRequest): boolean {
  const rawOrigin = (req.headers as Record<string, unknown>)['origin'];
  const origin = typeof rawOrigin === 'string' ? rawOrigin : undefined;
  if (origin === undefined) return true;
  const rawHost = (req.headers as Record<string, unknown>)['host'];
  const host = typeof rawHost === 'string' ? rawHost : '';
  return origin === `http://${host}` || origin === `https://${host}`;
}

/** 读请求体（默认限 1MB，超限 reject Error('payload-too-large') 并销毁流） */
export function readBody(req: IncomingMessage, limit = 1024 * 1024): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('payload-too-large'));
        try {
          (req as unknown as { destroy: () => void }).destroy();
        } catch {
          /* ignore */
        }
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
