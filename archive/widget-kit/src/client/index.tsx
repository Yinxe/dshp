/**
 * Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里** —— 由构建预设的 banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/widget-kit', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 本半只有四件事（顺序固定）：
 *  1. 建运行时，并把 `widgets` 服务**发布**给别的插件（`ctx.reflect.provide`，与官方 layout/resources 同入口）；
 *  2. 注册三个槽位：会话顶部托盘 / 卡片层（shell.overlay）/ 设置节；
 *  3. 徽标调度器（`ctx.interval` 一秒一拍，随 effect 自动销毁）；
 *  4. 参考组件（时钟 / 组件箱 / 注册表诊断 / 快速设置 / 状态速览，可在设置里关掉）。
 *
 * **不做自动残留清理**：卸载 / 热重载**不动**本机布局（按 id 保留，重新注册回来即原地恢复）；
 * 真卸载掉的插件留下的残留，由设置页的「清理已卸载组件的残留」显式清理（`runtime.pruneOrphans`）。
 *
 * @module @dshp/widget-kit/client
 */
import { createBadgeScheduler } from './badges.js';
import { CardLayer } from './CardLayer.js';
import { fetchState, saveConfig } from './api.js';
import { SettingsSection } from './SettingsSection.js';
import { Tray } from './Tray.js';
import { createWidgetRuntime, createWidgetsService } from './service.js';
import { SPEC_DEFAULTS } from './spec.js';
import type { StorageLike } from './store.js';
import type { ClientContext, FrameworkConfig, SlotsService } from './types.js';
import { createBoxWidget } from './widgets/box.js';
import { clockWidget } from './widgets/clock.js';
import { createDiagnosticsWidget } from './widgets/diagnostics.js';
import { createQuickSettingsWidget } from './widgets/quick-settings.js';
import { createStatusWidget } from './widgets/status.js';

/** client 半的硬依赖（缺了就不激活，由 cordis 在服务出现后重试）。 */
export const inject = ['slots', 'timer'];

/** 槽位占位（本仓 docs/scaffolding.md 的占位表）：托盘 30 / 卡片层 10 / 设置节 32。 */
const TRAY_ORDER = 30;
const LAYER_ORDER = 10;
const SETTINGS_ORDER = 32;

/** 设置的命名空间 = cordis 行 id = 路由前缀段 = 组件 id 前缀（NS 四处同名）。 */
const SETTINGS_NS = 'dshp-widget-kit';

/** 首个快照之前用的默认偏好（宿主的 `/ext/state` 一回来就覆盖它）。 */
const DEFAULT_PREFS: FrameworkConfig = {
  trayEnabled: true,
  maxVisibleIcons: SPEC_DEFAULTS.maxVisibleIcons,
  badgeIntervalMs: SPEC_DEFAULTS.badgeIntervalMs,
  hoverPreview: true,
  referenceWidgets: true,
  // 外观默认值：与 src/host/config.ts 的 DEFAULT_CONFIG 必须一致
  // （scripts/check-spec-drift.mjs 会比对这几个数字）
  cardOpacity: 0.7,
  cardBlur: 5,
  cardBorder: 'auto',
  cardRadius: 'auto',
  motionMs: 300,
};

function readStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    // 隐私模式 / 禁用存储：功能照常，只是布局留在内存
    return null;
  }
}

function readViewport(): { width: number; height: number } {
  try {
    if (typeof window === 'undefined') return { width: 1280, height: 800 };
    return { width: window.innerWidth, height: window.innerHeight };
  } catch {
    return { width: 1280, height: 800 };
  }
}

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  const logError = (message: string, error?: unknown): void => {
    try {
      console.error(message, error ?? '');
    } catch {
      /* ignore */
    }
  };
  const notice = (message: string): void => {
    try {
      console.warn(`[dshp-widget-kit] ${message}`);
    } catch {
      /* ignore */
    }
  };

  const runtime = createWidgetRuntime({
    prefs: DEFAULT_PREFS,
    storage: readStorage(),
    viewport: readViewport(),
    interval: (callback, ms) => ctx.interval(callback, ms),
    timeout: (callback, ms) => ctx.timeout(callback, ms),
    savePrefs: async (prefs) => {
      try {
        const result = await saveConfig(prefs);
        return result.ok ? { ok: true } : { ok: false, error: result.error ?? '宿主拒绝了这次写入' };
      } catch (error) {
        return { ok: false, error: `写入配置失败：${String((error as Error)?.message ?? error)}` };
      }
    },
    onNotice: notice,
    onError: logError,
  });

  // ── 1. 发布 widgets 服务（其它插件的唯一接缝）─────────────────────────
  try {
    ctx.effect(
      () => ctx.reflect.provide('widgets', createWidgetsService(runtime)),
      'dshp-widget-kit: widgets service',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 发布 widgets 服务失败，别的插件将无法注册组件：', error);
  }

  // ── 2. 组件箱：框架能力，**不是**参考组件 ─────────────────────────────
  // 它是「声明了 listedInBox: true 的卡片」的统一入口，所以必须与「装载参考组件」偏好无关：
  // 关掉参考组件只是不注册时钟 / 诊断这些示例，而 `trayIcon: false + listedInBox: true` 的卡片
  // 只有这一个入口 —— 跟着参考组件一起消失的话，那些卡片就彻底够不着了。
  try {
    ctx.effect(() => runtime.register(createBoxWidget(runtime)), 'dshp-widget-kit: box widget');
  } catch (error) {
    logError('[dshp-widget-kit] 注册「组件箱」失败：', error);
  }

  // ── 3. 参考组件（可在设置里关掉）──────────────────────────────────────
  const referenceDisposers: Array<() => void> = [];
  const syncReferenceWidgets = (enabled: boolean): void => {
    while (referenceDisposers.length > 0) {
      const dispose = referenceDisposers.pop();
      try {
        dispose?.();
      } catch (error) {
        logError('[dshp-widget-kit] 卸载参考组件失败：', error);
      }
    }
    if (!enabled) return;
    try {
      referenceDisposers.push(runtime.register(clockWidget));
    } catch (error) {
      logError('[dshp-widget-kit] 注册参考组件「时钟」失败：', error);
    }
    try {
      referenceDisposers.push(runtime.register(createDiagnosticsWidget(runtime)));
    } catch (error) {
      logError('[dshp-widget-kit] 注册参考组件「组件诊断」失败：', error);
    }
    try {
      referenceDisposers.push(runtime.register(createQuickSettingsWidget(runtime)));
    } catch (error) {
      logError('[dshp-widget-kit] 注册参考组件「快速设置」失败：', error);
    }
    try {
      referenceDisposers.push(runtime.register(createStatusWidget(runtime)));
    } catch (error) {
      logError('[dshp-widget-kit] 注册参考组件「状态速览」失败：', error);
    }
  };
  try {
    ctx.effect(
      () => () => {
        while (referenceDisposers.length > 0) {
          const dispose = referenceDisposers.pop();
          try {
            dispose?.();
          } catch {
            /* ignore */
          }
        }
      },
      'dshp-widget-kit: reference widgets teardown',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 注册参考组件清理失败：', error);
  }

  // ── 4. 宿主偏好 + 启动后清理历史残留 ──────────────────────────────────
  try {
    ctx.effect(() => {
      let cancelled = false;
      void fetchState()
        .then((state) => {
          if (cancelled) return;
          const config = state.config ?? DEFAULT_PREFS;
          runtime.applyPrefs(config);
          syncReferenceWidgets(config.referenceWidgets);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          runtime.applyPrefs(DEFAULT_PREFS);
          syncReferenceWidgets(true);
          logError('[dshp-widget-kit] 读取框架偏好失败（Host 半可能没挂载），本次用默认值：', error);
        });
      return () => {
        cancelled = true;
      };
    }, 'dshp-widget-kit: framework prefs');
  } catch (error) {
    logError('[dshp-widget-kit] 注册偏好读取失败：', error);
  }

  // 兜底：万一 /ext/state 一直不响应（路由没挂上、请求被挂起），3 秒后用默认偏好起步，
  // 否则托盘会一直不渲染 —— 「什么都没有」比「用默认值」糟得多。
  try {
    ctx.effect(
      () =>
        ctx.timeout(() => {
          if (runtime.getSnapshot().ready) return;
          runtime.applyPrefs(DEFAULT_PREFS);
          syncReferenceWidgets(DEFAULT_PREFS.referenceWidgets);
          notice('读取框架偏好超时，已用默认值起步（设置页仍可修改）');
        }, 3000),
      'dshp-widget-kit: prefs timeout fallback',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 注册偏好兜底失败：', error);
  }

  // ── 5. 视口 / 徽标调度 ────────────────────────────────────────────────
  try {
    ctx.effect(() => {
      if (typeof window === 'undefined') return () => {};
      const onResize = (): void => {
        runtime.setViewport(readViewport());
      };
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
      };
    }, 'dshp-widget-kit: viewport tracking');
  } catch (error) {
    logError('[dshp-widget-kit] 注册视口监听失败：', error);
  }

  const badges = createBadgeScheduler({
    runtime,
    timeout: (callback, ms) => ctx.timeout(callback, ms),
    onError: logError,
  });
  try {
    ctx.effect(() => ctx.interval(() => badges.tick(), 1000), 'dshp-widget-kit: badge tick');
  } catch (error) {
    logError('[dshp-widget-kit] 注册徽标调度失败（图标将没有角标）：', error);
  }
  try {
    ctx.effect(() => () => badges.dispose(), 'dshp-widget-kit: badge dispose');
  } catch (error) {
    logError('[dshp-widget-kit] 注册徽标清理失败：', error);
  }

  // ── 6. 三个槽位 ───────────────────────────────────────────────────────
  try {
    ctx.effect(
      () =>
        slots.inject('conversation.session.header.utilities', () =>
          slots.register(
            {
              name: 'conversation.session.header.utilities',
              id: 'dshp-widget-kit-tray',
              order: TRAY_ORDER,
              label: '小组件',
            },
            (props: { sessionId?: string | null }) => (
              <Tray runtime={runtime} sessionId={props.sessionId ?? null} />
            ),
          ),
        ),
      'dshp-widget-kit: session header tray',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 注册会话顶部托盘失败，所有组件图标都不会出现：', error);
  }

  try {
    ctx.effect(
      () =>
        slots.inject('shell.overlay', () =>
          slots.register(
            { name: 'shell.overlay', id: 'dshp-widget-kit-cards', order: LAYER_ORDER, label: '小组件卡片' },
            () => <CardLayer runtime={runtime} onError={logError} />,
          ),
        ),
      'dshp-widget-kit: card layer',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 注册卡片层失败，卡片与浮层都无处渲染：', error);
  }

  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: '小组件' },
            () => (
              <SettingsSection
                runtime={runtime}
                onPrefsApplied={(prefs) => {
                  syncReferenceWidgets(prefs.referenceWidgets);
                }}
              />
            ),
          ),
        ),
      'dshp-widget-kit: settings section',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 注册设置节失败，设置页看不到小组件配置：', error);
  }

  // ── 7. 卸载前把本机布局落盘 ──────────────────────────────────────────
  try {
    ctx.effect(
      () => () => {
        runtime.saveNow();
      },
      'dshp-widget-kit: flush local layout',
    );
  } catch (error) {
    logError('[dshp-widget-kit] 注册落盘清理失败：', error);
  }
}
