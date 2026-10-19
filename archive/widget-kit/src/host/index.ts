/**
 * @dshp/widget-kit —— Host 半（Cordis 插件）
 *
 * 这个插件**不含业务**：它只提供小组件规范与宿主。Host 半的职责因此也很窄 ——
 *
 *  1. 声明自己的 settings 命名空间 `dshp-widget-kit`（框架偏好：托盘开关、图标上限、徽标间隔…，
 *     持久化在 profile `cordis.patch.yml` 条目 `config:`，全字段 volatile 原地热更新）；
 *  2. 提供两条同源路由给 Client 半读/写偏好；
 *  3. 不碰用户文件、不注册模型工具、不在启动路径上做任何重活。
 *
 * 「本机布局」（托盘顺序、卡片位置尺寸、隐藏集合）刻意**不进设置命名空间** —— 它是每台浏览器
 * 的临时状态，存在 localStorage；这条边界写在 docs/widget-spec.md。
 *
 * @module @dshp/widget-kit
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConfigSchema, DEFAULT_CONFIG, NS } from './config.js';
import { registerRoutes } from './routes.js';
import type { AnyCtx, AnySettings, FrameworkConfig, FrameworkConfigPatch, VolatileConfig } from './types.js';

export const name = '@dshp/widget-kit';
/** webServer 是硬依赖（没有它设置页读不到配置）；settings 走可选获取 + 降级。 */
export const inject: string[] = ['webServer'];
export { NS, ConfigSchema };
/** Cordis 用它校验条目 config 并派生设置表单（全字段 volatile，可原地热更新）。 */
export const Config = ConfigSchema;

export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  // ── settings 命名空间（可选服务：缺了就退化成「只读默认值」）──────────
  try {
    ctx.inject(['settings'], (sctx: AnyCtx) => {
      try {
        // 本插件自带设置页（settings.section），关掉 schema 自动生成的页面。
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          'dshp-widget-kit: settings-page',
        );
      } catch (error) {
        console.error(
          '[dshp-widget-kit] 注册 settings 页面策略失败，偏好将使用默认值：' +
            String((error as Error)?.message ?? error),
        );
      }
    });
  } catch (error) {
    console.error('[dshp-widget-kit] settings 服务注入失败：' + String((error as Error)?.message ?? error));
  }

  function getConfig(): FrameworkConfig {
    // motionMs 不在 schema 里（client 走 SPEC_DEFAULTS），恒为默认值。
    return { ...DEFAULT_CONFIG, ...configSnapshot() };
  }

  function configSnapshot(): Omit<FrameworkConfig, 'motionMs'> {
    return {
      trayEnabled: config.trayEnabled.get() === true,
      maxVisibleIcons: config.maxVisibleIcons.get(),
      badgeIntervalMs: config.badgeIntervalMs.get(),
      hoverPreview: config.hoverPreview.get() === true,
      referenceWidgets: config.referenceWidgets.get() === true,
      cardOpacity: config.cardOpacity.get(),
      cardBlur: config.cardBlur.get(),
      cardBorder: config.cardBorder.get(),
      cardRadius: config.cardRadius.get(),
    };
  }

  async function update(patchObj: FrameworkConfigPatch): Promise<void> {
    let settings: AnySettings = null;
    try {
      settings = ctx.get('settings') as AnySettings;
    } catch {
      settings = null;
    }
    if (!settings) {
      throw new Error('settings 服务不可用，无法持久化小组件偏好（请重启 DSH 确认设置服务已挂载）');
    }
    await settings.update(NS, patchObj);
  }

  // ── 同源 JSON 路由：GET state / POST config ──────────────────────────
  try {
    registerRoutes(ctx, { snapshot: getConfig, update });
  } catch (error) {
    console.error(
      '[dshp-widget-kit] 注册 /ext 路由失败，设置页将看不到配置：' +
        String((error as Error)?.message ?? error),
    );
  }

  // 启动路径上只留一行日志（本仓规范：不超过 3 行）
  console.info(`[dshp-widget-kit] 小组件宿主已就绪（NS=${NS}）`);
}

/** 让 TS 不把仅类型用到的 import 视为未使用。 */
export type { FrameworkConfig, IncomingMessage, ServerResponse };
