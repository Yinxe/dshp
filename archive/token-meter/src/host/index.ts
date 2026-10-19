/**
 * @dshp/token-meter —— DSH Bundle 插件 Host 半（Cordis 插件，TS 重写合并版）
 *
 * 挂载：~/.dsh/profiles/<profile>/cordis.patch.yml（自动通过 bundle patch）
 *
 * 职责（二合一）：
 *  - 额度（quota，原 dsh-token-quota）：多供应商滚动额度/按量余额拉取 + 内存快照 +
 *    同源 JSON 路由（state/refresh/set-active/set-refresh/set-enabled/set-vendor-enabled/
 *    add/update/delete/secret-to-cred/config）
 *  - 统计（stats，原 dsh-token-stats）：sessionQuery 扫描本机全部会话日志聚合 TokenUsage，
 *    经 GET /ext/dshp-token-meter/stats（别名 /data）供设置页消费
 *
 * 持久化（0.1.7 settings 契约，对齐 file-change-viewer）：
 *  profile `cordis.patch.yml` 条目 `config:` 的 `dshp-token-meter` 分节（version/activeVendor/
 *  refreshSec/enabled/vendors/showToday/defaultRange/onlineGapMin），导出的 `Config` schema
 *  装载期校验（非法配置 = 条目不启用）；除 version 外全字段 volatile，`settings.update` 写入
 *  原地生效（旧 settings.yaml 分节由各插件同名条目一次性自动导入）。
 * 派生缓存（会话指纹聚合）仍走 ctx.storageDomain 域 `token_stats`（域名保持原样——
 *  storageDomain 只允许小写字母/数字/下划线，且改名会废掉已有缓存触发全量重扫），
 *  丢了可后台重扫，不属于用户配置。
 *
 * 原实现：
 *  - quota：~/.dsh/plugins/dsh-token-quota（@dshp-inx/token-quota v1.0.1）
 *    lib/{index,config,secrets,providers/*}.js → src/host/{index,quota,config,secrets,providers/*}.ts
 *  - stats：~/.dsh/plugins/dsh-token-stats（@dshp-inx/token-stats v1.1.3）
 *    lib/{index,engine,fold,fsindex,async,http}.js → src/host/{index,stats/*}.ts
 * 本目录为等价 TS 重写合并：逻辑逐行对齐，路由前缀与 NS 收敛为单一
 * `dshp-token-meter`；历史命名空间与旧文件不再读写、不再迁移。
 *
 * @module @dshp/token-meter
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ConfigSchema, NS } from './config.js';
import { createSecretResolver } from './secrets.js';
import { canonicalType } from './providers/index.js';
import { registerQuotaRoutes, refreshOne } from './quota.js';
import type { QuotaState } from './quota.js';
import { createEngine } from './stats/engine.js';
import { normGapMin } from './stats/online.js';
import { registerStatsRoutes } from './stats/routes.js';
import { registerIdentityRoute } from './identity.js';
import type { AnyCtx, PluginConfig, Vendor, VolatileConfig } from './types.js';

export const name = '@dshp/token-meter';
export const inject: string[] = ['webServer'];
export { NS, ConfigSchema };
/** Cordis 用它校验条目 config 并派生设置表单（除 version 外全字段 volatile，原地热更新）。 */
export const Config = ConfigSchema;

/**
 * 挂载 Host 半：settings 页面策略 → 配置读取（volatile 引用）→ 额度路由 + 自动拉取 →
 * 统计引擎 + 路由。
 *
 * @param ctx - Cordis 插件上下文。
 * @param config - 条目 `config:` 经 ConfigSchema 校验后的实时引用（除 version 外全字段 volatile）。
 */
export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  // ── 官方 settings（0.1.7 契约）：本插件自带设置页，关掉 schema 自动生成的页面 ──
  try {
    ctx.inject(['settings'], (sctx: AnyCtx) => {
      try {
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          'dshp-token-meter: settings-page',
        );
      } catch (error) {
        console.error('[dshp-token-meter] 注册 settings 页面策略失败，偏好将回默认值：', error);
      }
    });
  } catch (error) {
    console.error('[dshp-token-meter] settings 服务注入失败，偏好将回默认值：', error);
  }

  /**
   * 当前生效配置（volatile 引用逐字段读快照）。
   *
   * 类型/区间防御已由 schema 在装载与提交期前置（非法值进不了引用），读路径只保留两件
   * schema 管不了的事：供应商 type 别名归一（opencode-go/zen → opencode，历史条目 config
   * 里的合法字符串写法）与 onlineGapMin 吸附到 1/5/15/30/60 标准档。
   */
  function getConfig(): PluginConfig {
    const rawVendors = config.vendors.get();
    return {
      version: config.version ?? 1,
      activeVendor: config.activeVendor.get(),
      refreshSec: config.refreshSec.get(),
      enabled: config.enabled.get(),
      vendors: (Array.isArray(rawVendors) ? rawVendors : []).map((item): Vendor => {
        const it = (item ?? {}) as Record<string, unknown>;
        const vendor: Vendor = {
          id: String(it['id'] !== undefined ? it['id'] : ''),
          name: String(it['name'] !== undefined ? it['name'] : ''),
          type: canonicalType(String(it['type'] !== undefined ? it['type'] : 'manual')),
          params:
            it['params'] && typeof it['params'] === 'object' && !Array.isArray(it['params'])
              ? (it['params'] as Record<string, unknown>)
              : {},
        };
        // 余额查询开关：只有显式 false 视为禁用，缺省一律启用
        if (it['enabled'] === false) vendor.enabled = false;
        return vendor;
      }),
      showToday: config.showToday.get(),
      defaultRange: config.defaultRange.get(),
      onlineGapMin: normGapMin(config.onlineGapMin.get()),
    };
  }

  /** 写回 profile 条目 config（路由层已逐字段消毒；这里只兜 settings 服务缺失）。 */
  async function updateConfig(patchObj: Record<string, unknown>): Promise<void> {
    const settings = ctx.get('settings') as AnyCtx;
    if (!settings)
      throw new Error(
        'settings 服务不可用，无法持久化到 profile 条目 config（请重启 DSH 确认设置服务已挂载）',
      );
    await settings.update(NS, JSON.parse(JSON.stringify(patchObj)) as Record<string, unknown>);
  }

  const st: QuotaState = { snaps: {} };
  const resolveSecret = createSecretResolver(ctx);

  // ── stats 引擎（sessionQuery/storageDomain 均为可选，缺失时降级）──────────
  let sessionQuery: AnyCtx = null;
  try {
    sessionQuery = ctx.get('sessionQuery') as AnyCtx;
  } catch {
    sessionQuery = null;
  }
  let storageDomain: AnyCtx = null;
  try {
    storageDomain = ctx.get('storageDomain') as AnyCtx;
  } catch {
    storageDomain = null;
  }

  let dshHome = '';
  try {
    dshHome = process.env['DSH_HOME'] || '';
  } catch {
    /* ignore */
  }
  if (!dshHome) {
    try {
      dshHome = join(homedir(), '.dsh');
    } catch {
      dshHome = '/tmp/.dsh';
    }
  }

  const engine =
    sessionQuery &&
    typeof sessionQuery.listSessions === 'function' &&
    typeof sessionQuery.readSession === 'function'
      ? createEngine(sessionQuery, dshHome, storageDomain, () => getConfig().onlineGapMin)
      : null;

  if (engine) {
    try {
      ctx.effect(
        () =>
          ctx.on('session/event', (session: { id?: unknown }) => {
            const id = session && session.id;
            if (typeof id === 'string') engine.invalidate(id);
          }),
        'dshp-token-meter: invalidate on session event',
      );
    } catch {
      /* ignore */
    }
    try {
      ctx.effect(
        () => () => {
          void engine.dispose();
        },
        'dshp-token-meter: close domain on dispose',
      );
    } catch {
      /* ignore */
    }
  } else {
    try {
      console.warn('[dshp-token-meter] sessionQuery 服务不可用，统计暂不可用（额度功能不受影响）');
    } catch {
      /* ignore */
    }
  }

  // ── 同源 JSON 路由 ────────────────────────────────────────────────────
  try {
    registerQuotaRoutes(ctx, { getConfig, updateConfig, resolveSecret, st });
  } catch (e) {
    try {
      console.error('[dshp-token-meter] register quota routes failed: ' + String((e as Error)?.message ?? e));
    } catch {
      /* ignore */
    }
  }

  // ── Host 侧额度自动拉取 ────────────────────────────────────────────────
  // 单一数据源：由 Host 每 refreshSec 拉取全部供应商并写入内存快照（st.snaps），
  // 客户端只 GET /state 同步快照 —— 多个客户端/多个标签页不会重复请求上游。
  // 手动刷新（POST /refresh）会更新 st.lastPullMs，定时器据此顺延，避免刚刷完又自动拉。
  try {
    const clampSec = (raw: unknown): number => {
      const n = Number(raw);
      if (!isFinite(n) || n <= 0) return 0; // 0/非法 = 关闭
      return Math.min(3600, Math.max(10, n));
    };
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (ms: number): void => {
      if (stopped) return;
      timer = setTimeout(
        () => {
          void tick();
        },
        Math.max(1000, ms),
      );
    };
    const tick = async (): Promise<void> => {
      if (stopped) return;
      let sec = 60;
      try {
        const cfg = getConfig();
        sec = clampSec(cfg.refreshSec);
        if (sec > 0) {
          // 距上次拉取不足 60% 间隔时顺延（手动刷新刚发生过）
          const since = st.lastPullMs ? Date.now() - st.lastPullMs : Infinity;
          const budget = sec * 1000;
          if (since < budget * 0.6) {
            schedule(budget - since);
            return;
          }
          const list = Array.isArray(cfg.vendors) ? cfg.vendors : [];
          for (const v of list) {
            if (stopped) return;
            // 被禁用的供应商不参与主动定时拉取（手动 POST /refresh 仍可拉）
            if (v.enabled === false) continue;
            try {
              await refreshOne(st, resolveSecret, v);
            } catch {
              /* 单个供应商失败不影响其它 */
            }
          }
        }
      } catch {
        /* ignore */
      }
      schedule((sec > 0 ? sec : 60) * 1000);
    };
    schedule(4000); // 启动后稍等再拉，避开启动风暴
    try {
      ctx.effect(
        () => () => {
          stopped = true;
          if (timer) clearTimeout(timer);
        },
        'dshp-token-meter: quota auto refresh',
      );
    } catch {
      /* ignore */
    }
  } catch (e) {
    try {
      console.warn('[dshp-token-meter] quota auto refresh 启动失败：' + String((e as Error)?.message ?? e));
    } catch {
      /* ignore */
    }
  }

  try {
    registerStatsRoutes(ctx, engine);
    registerIdentityRoute(ctx);
  } catch (e) {
    try {
      console.error('[dshp-token-meter] register stats routes failed: ' + String((e as Error)?.message ?? e));
    } catch {
      /* ignore */
    }
  }

  if (engine) {
    try {
      engine.start();
    } catch {
      /* ignore */
    }
  }

  try {
    console.log('[dshp-token-meter] settings(dshp-token-meter) quota + stats ready');
  } catch {
    /* ignore */
  }
}
