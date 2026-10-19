/**
 * 徽标调度器 —— 全局一个 tick，页面不可见时整表暂停，单组件失败按指数退避
 *
 * 为什么不让每个组件自己 `setInterval`：那会出现「10 个组件 = 10 个定时器 + 10 份请求」，
 * 页面切到后台也照跑。这里统一到期、统一可见性门控、统一退避，并提供冻结/超时兜底。
 * 被禁用的组件（`runtime.isEnabled === false`）不排期，在飞的那次也会被中止。
 *
 * @module @dshp/widget-kit/client/badges
 */
import { FRAMEWORK_VERSION, SPEC_DEFAULTS } from './spec.js';
import type { NormalizedWidget } from './spec.js';
import type { WidgetRuntime } from './service.js';

/** 单次徽标调用的超时（毫秒）。超时即 abort，按失败计。 */
export const BADGE_TIMEOUT_MS = 5000;

/** 连续失败后的退避阶梯（毫秒），超过阶梯长度就沿用最后一档。 */
export const BADGE_BACKOFF_MS: readonly number[] = [5000, 10000, 30000, 60000];

/** 连续失败到几次就把徽标打成告警色。 */
export const BADGE_FAILURES_TO_WARN = 3;

export interface BadgeRuntimeState {
  id: string;
  failures: number;
  nextDueAt: number;
  lastRunAt: number | null;
  lastError: string | null;
  inFlight: boolean;
}

export interface BadgeSchedulerDeps {
  runtime: WidgetRuntime;
  /** 当前时间（自检可注入）。 */
  now?: () => number;
  /** 页面是否可见；默认读 `document.visibilityState`（无 document 时视为可见）。 */
  isVisible?: () => boolean;
  /** 挂一个超时（`ctx.timeout`）。 */
  timeout(cb: () => void, ms: number): () => void;
  onError?: (message: string, error?: unknown) => void;
}

export interface BadgeScheduler {
  /** 每秒调一次（由 `ctx.interval` 驱动）。 */
  tick(): void;
  /** 卸载：中止所有在飞的调用与超时。 */
  dispose(): void;
  stats(): readonly BadgeRuntimeState[];
}

/**
 * 造一个徽标调度器。返回的 `tick()` 由调用方按 1s 周期驱动（`ctx.interval`）。
 */
export function createBadgeScheduler(deps: BadgeSchedulerDeps): BadgeScheduler {
  const now = deps.now ?? (() => Date.now());
  const isVisible =
    deps.isVisible ??
    (() => (typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'));
  const state = new Map<string, BadgeRuntimeState>();
  const flights = new Map<string, { controller: AbortController; cancel: () => void }>();
  let disposed = false;

  function ensure(id: string): BadgeRuntimeState {
    const existing = state.get(id);
    if (existing !== undefined) return existing;
    // 新组件立刻要一次徽标（用户装完就能看到角标）
    const created: BadgeRuntimeState = {
      id,
      failures: 0,
      nextDueAt: 0,
      lastRunAt: null,
      lastError: null,
      inFlight: false,
    };
    state.set(id, created);
    return created;
  }

  function intervalFor(widget: NormalizedWidget, fallback: number): number {
    const wanted = widget.tray.badgeIntervalMs || fallback;
    return Math.max(SPEC_DEFAULTS.badgeIntervalMinMs, wanted);
  }

  async function run(widget: NormalizedWidget, entry: BadgeRuntimeState, intervalMs: number): Promise<void> {
    const badge = widget.tray.badge;
    if (badge === null) return;
    const controller = new AbortController();
    let timedOut = false;
    const cancel = deps.timeout(() => {
      timedOut = true;
      controller.abort();
    }, BADGE_TIMEOUT_MS);
    flights.set(widget.id, { controller, cancel });
    entry.inFlight = true;
    entry.lastRunAt = now();
    try {
      const value = await Promise.resolve(
        badge({
          sessionId: deps.runtime.getSession(),
          signal: controller.signal,
          frameworkVersion: FRAMEWORK_VERSION,
        }),
      );
      if (disposed) return;
      entry.failures = 0;
      entry.lastError = null;
      deps.runtime.setBadge(widget.id, value ?? null);
      entry.nextDueAt = now() + intervalMs;
    } catch (error) {
      if (disposed) return;
      const message = timedOut ? '徽标调用超时' : String((error as Error)?.message ?? error);
      entry.failures += 1;
      entry.lastError = message;
      const backoff = BADGE_BACKOFF_MS[Math.min(entry.failures - 1, BADGE_BACKOFF_MS.length - 1)] ?? 60000;
      entry.nextDueAt = now() + backoff;
      if (entry.failures >= BADGE_FAILURES_TO_WARN) {
        deps.runtime.setBadge(widget.id, { dot: true, tone: 'bad', title: `组件徽标连续出错：${message}` });
      }
      deps.onError?.(
        `[dshp-widget-kit] 组件「${widget.id}」的徽标刷新失败（第 ${String(entry.failures)} 次）：${message}`,
      );
    } finally {
      cancel();
      flights.delete(widget.id);
      entry.inFlight = false;
    }
  }

  function tick(): void {
    if (disposed || !isVisible()) return;
    const snapshot = deps.runtime.getSnapshot();
    const fallbackInterval = snapshot.prefs.badgeIntervalMs;
    const alive = new Set<string>();

    for (const widget of snapshot.widgets) {
      if (widget.tray.badge === null) continue;
      // 被禁用的组件连徽标一起停：不进 alive，下面的清理循环会中止它在飞的请求并丢掉排期
      if (!deps.runtime.isEnabled(widget.id)) continue;
      alive.add(widget.id);
      const entry = ensure(widget.id);
      if (entry.inFlight) continue;
      if (now() < entry.nextDueAt) continue;
      const intervalMs = intervalFor(widget, fallbackInterval);
      // 先排下一次到期时间，避免调用还没回来时被同一 tick 重复触发
      entry.nextDueAt = now() + intervalMs;
      void run(widget, entry, intervalMs);
    }

    for (const id of state.keys()) {
      if (alive.has(id)) continue;
      const flight = flights.get(id);
      flight?.controller.abort();
      state.delete(id);
    }
  }

  return {
    tick,
    dispose(): void {
      disposed = true;
      for (const flight of flights.values()) {
        flight.cancel();
        flight.controller.abort();
      }
      flights.clear();
      state.clear();
    },
    stats: () => [...state.values()].map((entry) => ({ ...entry })),
  };
}
