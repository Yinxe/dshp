/**
 * 同源 JSON 路由
 *  - GET  /ext/dshp-widget-kit/state   框架版本 + 契约版本 + 偏好快照
 *  - POST /ext/dshp-widget-kit/config  保存偏好补丁
 *
 * 按本仓 docs/ext-routes.md：`kind: 'exact'`、逐个 `ctx.effect` 注册、handler 第一行同源校验、
 * 业务错误一律 200 + `ok:false`，只有跨站/方法错误走 4xx。
 *
 * @module @dshp/widget-kit/host/routes
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { FRAMEWORK_VERSION, SPEC_VERSION, sanitizePatchConfig } from './config.js';
import { json, readBody, sameOrigin } from './http.js';
import type { AnyCtx, FrameworkConfig, FrameworkConfigPatch } from './types.js';

export interface RouteDeps {
  /** 当前偏好的权威快照。 */
  snapshot(): FrameworkConfig;
  /** 写入偏好补丁（settings.update）。 */
  update(patch: FrameworkConfigPatch): Promise<void>;
}

/**
 * 注册两条路由。
 *
 * @param ctx - Host cordis 上下文。
 * @param deps - 读/写偏好的回调。
 */
export function registerRoutes(ctx: AnyCtx, deps: RouteDeps): void {
  const server = ctx.get('webServer') as AnyCtx;
  if (!server) {
    console.warn('[dshp-widget-kit] webServer 服务不可用，/ext 路由未注册（设置页将读不到配置）');
    return;
  }

  ctx.effect(
    () =>
      server.register({
        kind: 'exact',
        path: '/ext/dshp-widget-kit/state',
        handler: async (req: IncomingMessage, res: ServerResponse) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method not allowed' });
          return json(res, 200, {
            ok: true,
            version: FRAMEWORK_VERSION,
            specVersion: SPEC_VERSION,
            config: deps.snapshot(),
          });
        },
      }),
    'dshp-widget-kit: state route',
  );

  ctx.effect(
    () =>
      server.register({
        kind: 'exact',
        path: '/ext/dshp-widget-kit/config',
        handler: async (req: IncomingMessage, res: ServerResponse) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
          let raw: unknown = null;
          try {
            const text = await readBody(req);
            raw = JSON.parse(text === '' ? '{}' : text) as unknown;
          } catch (error) {
            const message = String((error as Error)?.message ?? error);
            return json(res, 200, {
              ok: false,
              error: message === 'payload-too-large' ? '请求体过大' : '请求体不是合法 JSON',
            });
          }
          const patch = sanitizePatchConfig(raw);
          if (patch === null) {
            return json(res, 200, {
              ok: false,
              error: '没有可更新的字段（maxVisibleIcons 应为 1–8，badgeIntervalMs 应为 5000–600000 毫秒）',
            });
          }
          try {
            await deps.update(patch);
            return json(res, 200, { ok: true, config: deps.snapshot() });
          } catch (error) {
            return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
          }
        },
      }),
    'dshp-widget-kit: config route',
  );
}
