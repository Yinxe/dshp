/**
 * React 粘合层：快照订阅、内容数据、指针拖拽
 *
 * - `useFramework` / `useLiveGeometry`：`useSyncExternalStore` 订阅运行时快照。快照是**不可变对象**，
 *   只有真正变更时才换引用 —— 这治的是 token-meter 那套「任一浮窗移动 → 全部浮窗 forceUpdate」。
 * - `useWidgetData`：`load` 的加载/错误/陈旧/轮询全在这一处，组件提供方不写任何请求生命周期代码。
 * - `useCardDrag`：**照抄官方 `dsh-client-ui-layout` 的 `DragHandle` 范式** —— 指针捕获 + rAF 合并 +
 *   `pointerup` 补最终值 + `pointercancel`/`onLostPointerCapture` 收尾 + 卸载 effect 兜底。
 *   移动落点交给 `runtime.resolveMove`（夹进视口 + 邻卡吸附 + 防重叠），所以**吸附在拖动期间就渲染出来**，
 *   松手只是把同一份几何写进本机布局。
 *
 * @module @dshp/widget-kit/client/hooks
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { applyResize, clampRect } from './geometry.js';
import type { Rect, RectConstraints, ResizeDir, Viewport } from './geometry.js';
import type { FrameworkSnapshot, LiveGeometry, WidgetRuntime } from './service.js';
import type { NormalizedWidget } from './spec.js';
import type { CONTENT_STATUS } from './spec.js';

/** 订阅 layout 快照（托盘、卡片层、设置页都用它）。 */
export function useFramework(runtime: WidgetRuntime): FrameworkSnapshot {
  const subscribe = useCallback((listener: () => void) => runtime.subscribe(listener), [runtime]);
  const getSnapshot = useCallback(() => runtime.getSnapshot(), [runtime]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 订阅「**这一张卡**正在被拖动/缩放」时的活动几何。
 *
 * 必须带 id：`getLiveFor(id)` 对别的卡片恒返回 `null`（同一个引用），所以 60fps 的拖动只会重渲染
 * 被拖的那一张卡 —— 早期版本用全局 `getLive()`，每帧都是一个新对象，结果**所有卡片连同它们的内容
 * 每帧都重渲染**，这正是用户反馈的「拖动有时卡」。
 *
 * @param runtime - 框架运行时。
 * @param id - 组件 id。
 */
export function useLiveGeometry(runtime: WidgetRuntime, id: string): LiveGeometry | null {
  const subscribe = useCallback((listener: () => void) => runtime.subscribeLive(listener), [runtime]);
  const getSnapshot = useCallback(() => runtime.getLiveFor(id), [runtime, id]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 手势方向 → 鼠标指针 token（真正的 cursor 写在样式表里）。 */
const GESTURE_CURSORS: Record<string, string> = {
  move: 'moving',
  n: 'ns',
  s: 'ns',
  e: 'ew',
  w: 'ew',
  ne: 'nesw',
  sw: 'nesw',
  nw: 'nwse',
  se: 'nwse',
};

/**
 * 当前手势对应的鼠标指针 token（没有手势时是 `null`）。
 *
 * 返回的是**字符串**：帧与帧之间只要指针形状没变，快照就没变 —— 订阅它的手势盾因此一帧都不会重渲染。
 *
 * @param runtime - 框架运行时。
 */
export function useGestureCursor(runtime: WidgetRuntime): string | null {
  const subscribe = useCallback((listener: () => void) => runtime.subscribeLive(listener), [runtime]);
  const getSnapshot = useCallback((): string | null => {
    const live = runtime.getLive();
    if (live === null) return null;
    return GESTURE_CURSORS[live.mode] ?? 'moving';
  }, [runtime]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 订阅当前的**吸附预览**（拖动期间画虚框用）。
 *
 * 候选没变时运行时复用同一个对象引用，所以虚框不会每帧重渲染，只在吸附目标切换时动一次 ——
 * 那一次正好交给 CSS transition 做平滑滑动。
 *
 * @param runtime - 框架运行时。
 */
export function useLiveSnap(runtime: WidgetRuntime): { id: string; rect: Rect } | null {
  const subscribe = useCallback((listener: () => void) => runtime.subscribeLive(listener), [runtime]);
  const getSnapshot = useCallback(() => runtime.getLiveSnap(), [runtime]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 订阅某个组件图标当前的锚点元素。
 *
 * 为什么需要它：刷新后从本机布局恢复出来的 popover 可能比托盘图标先渲染（两个槽位、两棵树），
 * 这时它的锚点还是 `null`。`setAnchor` 在图标真正挂上时会通知一次，这个订阅让面板拿到新元素、
 * 换掉 ref 身份，官方 `useAnchoredPosition` 的 layout effect 随之重跑并重新测量。
 *
 * @param runtime - 框架运行时。
 * @param id - 组件 id。
 * @returns 当前锚点元素，没有则为 `null`。
 */
export function useAnchor(runtime: WidgetRuntime, id: string): HTMLElement | null {
  const subscribe = useCallback((listener: () => void) => runtime.subscribe(listener), [runtime]);
  const getSnapshot = useCallback(() => runtime.getAnchor(id), [runtime, id]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export interface WidgetDataState {
  status: (typeof CONTENT_STATUS)[number];
  data: unknown;
  error: { message: string; retriable: boolean } | undefined;
  stale: boolean;
  lastUpdatedAt: number | null;
}

const IDLE: WidgetDataState = {
  status: 'ready',
  data: undefined,
  error: undefined,
  stale: false,
  lastUpdatedAt: null,
};

/**
 * 内容面的数据生命周期：打开时加载、可选轮询、失败保留旧数据并标记 `stale`、卸载即中止。
 *
 * `load` 解析为 `null` / `undefined` 时状态是 `empty`（框架唯一会判空的地方，其余空态由提供方自己渲染）。
 *
 * @param runtime - 框架运行时。
 * @param widget - 规范化后的组件。
 * @param enabled - 内容面是否真的在展示（最小化/关闭时为 false，轮询随之停止）。
 */
export function useWidgetData(
  runtime: WidgetRuntime,
  widget: NormalizedWidget,
  enabled: boolean,
): WidgetDataState & { refresh(): void; retry(): void } {
  const load = widget.content?.load ?? null;
  const refreshMs = widget.content?.refreshMs ?? 0;
  const sessionId = runtime.getSession();
  const [state, setState] = useState<WidgetDataState>(load === null ? IDLE : { ...IDLE, status: 'loading' });
  const requestId = useRef(0);
  const flight = useRef<AbortController | null>(null);

  const run = useCallback(
    (reason: 'open' | 'refresh' | 'retry'): void => {
      if (load === null) return;
      requestId.current += 1;
      const id = requestId.current;
      flight.current?.abort();
      const controller = new AbortController();
      flight.current = controller;
      setState((prev) =>
        prev.data === undefined
          ? { ...prev, status: 'loading', error: undefined }
          : { ...prev, status: 'ready', stale: false },
      );
      Promise.resolve()
        .then(() => load({ sessionId, signal: controller.signal, reason }))
        .then((data) => {
          if (requestId.current !== id) return;
          const empty = data === null || data === undefined;
          setState({
            status: empty ? 'empty' : 'ready',
            data: empty ? undefined : data,
            error: undefined,
            stale: false,
            lastUpdatedAt: Date.now(),
          });
        })
        .catch((error: unknown) => {
          if (requestId.current !== id) return;
          const message = String((error as Error)?.message ?? error);
          setState((prev) =>
            prev.data === undefined
              ? {
                  status: 'error',
                  data: undefined,
                  error: { message, retriable: true },
                  stale: false,
                  lastUpdatedAt: null,
                }
              : { ...prev, status: 'ready', stale: true, error: { message, retriable: true } },
          );
        });
    },
    [load, sessionId],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    run('open');
    let disposeInterval: (() => void) | null = null;
    if (refreshMs > 0) {
      disposeInterval = runtime.scheduleInterval(() => {
        run('refresh');
      }, refreshMs);
    }
    return () => {
      requestId.current += 1;
      flight.current?.abort();
      disposeInterval?.();
    };
  }, [enabled, refreshMs, run, runtime, widget.id]);

  const refresh = useCallback(() => {
    run('refresh');
  }, [run]);
  const retry = useCallback(() => {
    run('retry');
  }, [run]);

  return { ...state, refresh, retry };
}

export interface CardDragHandlers {
  onPointerDown(event: ReactPointerEvent): void;
}

/** 手势期间挂在 window 上的兜底监听（指针捕获靠不住时它就是唯一的事件来源）。 */
interface GestureListeners {
  move: (event: PointerEvent) => void;
  up: (event: PointerEvent) => void;
  cancel: (event: PointerEvent) => void;
}

/**
 * 卡片拖动 / 缩放（两者只差一个方向参数）。
 *
 * 位置锁定的卡片在这里就被挡住（`runtime.isLocked`）：拖动标题栏与八个缩放把手都退化成普通点击，
 * 但最小化 / 关闭 / 还原照常 —— 「锁定」锁的是几何，不是生命周期。
 *
 * **手势的可靠性**（治用户反馈的「卡 / 断触 / 松了还在拖 / 没松就停了」）：
 *  - `pointerdown` 里除了 `setPointerCapture`，还在 **window 上挂 move / up / cancel** —— 捕获只是
 *    「让事件优先送到把手」，真正撑住手势的是这三个监听：捕获被浏览器悄悄收走（DOM 变动、跨 iframe、
 *    指针离开窗口）也不影响拖动继续，`up` 也一定会被收到；
 *  - 每帧检查 `event.buttons`：左键已经松开却漏收 `pointerup`（松在窗口外）时，这一次 move 就收尾提交；
 *  - `pointercancel`（系统接管手势，如触屏滚动）才丢弃本次几何；
 *  - 收尾一律走 `endDrag`，它自己判重（`capture.current`），所以多条路径重复触发也只会收一次尾。
 *
 * @param runtime - 框架运行时。
 * @param widget - 目标组件。
 * @param mode - `'move'` 拖动整卡，或八个缩放方向之一。
 * @returns `dragging` 状态与要展开到把手元素上的事件处理器。
 */
export function useCardDrag(
  runtime: WidgetRuntime,
  widget: NormalizedWidget,
  mode: 'move' | ResizeDir,
): { dragging: boolean; handlers: CardDragHandlers } {
  const [dragging, setDragging] = useState(false);
  const capture = useRef<{ element: HTMLElement; id: number } | null>(null);
  const listeners = useRef<GestureListeners | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef({ x: 0, y: 0 });
  const startRect = useRef<Rect | null>(null);
  const frame = useRef<number | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  /** 把最新坐标送进运行时（rAF 合并：60fps 的 pointermove 不重复算几何）。 */
  const flush = useCallback((): void => {
    const start = startRect.current;
    if (start === null) return;
    const dx = latest.current.x - origin.current.x;
    const dy = latest.current.y - origin.current.y;
    if (modeRef.current === 'move') {
      // 自由跟手（允许盖住别的卡片）；夹进视口即可，吸附候选由运行时在 setLive 里一并算好
      const constraints: RectConstraints = runtime.constraintsOf(widget);
      const viewport: Viewport = runtime.viewport();
      runtime.setLive(
        widget.id,
        clampRect({ x: start.x + dx, y: start.y + dy, w: start.w, h: start.h }, constraints, viewport),
      );
      return;
    }
    const constraints: RectConstraints = runtime.constraintsOf(widget);
    const viewport: Viewport = runtime.viewport();
    runtime.setLive(widget.id, applyResize(start, modeRef.current, dx, dy, constraints, viewport));
  }, [runtime, widget]);

  /** 收尾：`commit` = 采用（吸附预览优先）；`false` = 丢弃本次手势。可重复调用，只有第一次生效。 */
  const endDrag = useCallback(
    (commit: boolean) => {
      const active = capture.current;
      if (active === null) return;
      capture.current = null;
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      const attached = listeners.current;
      listeners.current = null;
      if (attached !== null && typeof window !== 'undefined') {
        window.removeEventListener('pointermove', attached.move);
        window.removeEventListener('pointerup', attached.up);
        window.removeEventListener('pointercancel', attached.cancel);
      }
      try {
        if (active.element.hasPointerCapture(active.id)) active.element.releasePointerCapture(active.id);
      } catch {
        /* ignore */
      }
      setDragging(false);
      if (commit) runtime.commitLive(widget.id);
      else runtime.cancelLive();
    },
    [runtime, widget.id],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent): void => {
      if (event.button !== 0 || capture.current !== null) return;
      // 先吃掉这次 pointerdown：否则按住标题栏/缩放把手拖动会选中页面上的文字
      event.preventDefault();
      if (runtime.isLocked(widget.id)) {
        // 位置锁定：不进入拖拽（也就不会有 live 几何），但点一下仍然把它提到最前
        runtime.raise(widget.id);
        return;
      }
      event.stopPropagation();
      const element = event.currentTarget as HTMLElement;
      const pointerId = event.pointerId;
      try {
        element.setPointerCapture(pointerId);
      } catch {
        /* 某些环境不支持捕获：window 上的兜底监听照样让手势成立 */
      }
      capture.current = { element, id: pointerId };
      origin.current = { x: event.clientX, y: event.clientY };
      latest.current = { x: event.clientX, y: event.clientY };
      // 用「看起来的矩形」起步：最小化时手抓的是一枚胶囊，几何也得按它算
      startRect.current = runtime.visualRectOf(widget.id);
      runtime.raise(widget.id);
      runtime.beginLive(widget.id, modeRef.current);
      setDragging(true);

      if (typeof window === 'undefined') return;
      const move = (native: PointerEvent): void => {
        if (native.pointerId !== pointerId) return;
        // 漏收 pointerup（松在窗口外）时，按钮已经不再是按下状态：就地收尾并提交
        if (native.pointerType !== 'touch' && native.buttons === 0) {
          endDrag(true);
          return;
        }
        latest.current = { x: native.clientX, y: native.clientY };
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          flush();
        });
      };
      const up = (native: PointerEvent): void => {
        if (native.pointerId !== pointerId) return;
        latest.current = { x: native.clientX, y: native.clientY };
        flush(); // 先把最终精确值交给运行时（吸附候选也按它算），再收尾
        endDrag(true);
      };
      const cancel = (native: PointerEvent): void => {
        if (native.pointerId !== pointerId) return;
        endDrag(false);
      };
      listeners.current = { move, up, cancel };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    },
    [endDrag, flush, runtime, widget.id],
  );

  useEffect(
    () => () => {
      // 卸载（卡片被关掉/切会话）时把没结束的手势收干净：保留用户已经拖到的位置
      if (capture.current !== null) endDrag(true);
    },
    [endDrag],
  );

  return {
    dragging,
    handlers: { onPointerDown },
  };
}
