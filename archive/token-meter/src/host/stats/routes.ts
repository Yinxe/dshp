/**
 * 同源 JSON 路由：用量快照（设置页数据源）
 *
 * 原实现：dsh-token-stats/lib/http.js 的 registerRoutes（逐行对齐，
 * 路径由 dshp-inx-token-stats 改为 dshp-token-meter，另保留 /data 别名
 * 供调试与旧书签兼容）。
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, sameOrigin } from '../http.js';
import type { AnyCtx } from '../types.js';
import type { Engine } from './engine.js';

const BASE = '/ext/dshp-token-meter';

export function registerStatsRoutes(ctx: AnyCtx, engine: Engine | null): void {
  const handler = async (_req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const req = _req as IncomingMessage;
    if (!sameOrigin(req)) return json(res, 403, { ready: false, error: 'forbidden' });
    try {
      if (!engine)
        return json(res, 200, {
          ready: false,
          error: 'sessionQuery 服务不可用，统计暂不可用（额度功能不受影响）',
        });
      const data = await engine.snapshot();
      return json(res, 200, data);
    } catch (error) {
      return json(res, 200, { ready: false, error: String((error as Error)?.message ?? error) });
    }
  };

  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: `${BASE}/stats`, handler }),
    'dshp-token-meter: stats route',
  );

  // 兼容别名：旧 token-stats 客户端与书签仍可用（与新路径同行为）
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: `${BASE}/data`, handler }),
    'dshp-token-meter: stats alias route',
  );

  // 统计来源与缓存运维：清除派生缓存（下次快照全量重算）
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: `${BASE}/clear-cache`,
        handler: async (req: IncomingMessage, res: ServerResponse) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          try {
            if (!engine) return json(res, 200, { ok: false, error: '统计引擎不可用' });
            const removed = await engine.clearCache();
            return json(res, 200, { ok: true, removed });
          } catch (error) {
            return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
          }
        },
      }),
    'dshp-token-meter: clear cache route',
  );
}
