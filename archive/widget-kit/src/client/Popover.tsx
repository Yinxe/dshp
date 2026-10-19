/**
 * popover 承载体：锚定在托盘图标下方的轻量面板
 *
 * 定位交给官方 `useAnchoredPosition`（滚动/resize 跟随 + 视口夹紧），我们只负责：
 * 单开语义（运行时保证）、点外部关闭（锚点自身除外，否则点图标会先关再开）、Esc 关闭并把焦点还给图标。
 * 锚点元素拿不到时（会话切换/图标卸载）退回右上角固定位，绝不静默消失。
 *
 * **锚点会晚到**：刷新后从本机布局恢复出来的面板，可能比托盘图标先渲染（两个不同的槽位）。
 * 所以这里订阅快照、用「当前锚点元素」作为 ref 的依赖 —— 图标一挂上（`setAnchor` 会通知一次）
 * 就换一个新的 ref 对象，官方 hook 的 layout effect 随之重跑并重新测量，而不是永远停在兜底位。
 *
 * `popover.persistent: true` = **常驻面板**：不受外部操作影响，点面板外的区域、指针移开都不会收起
 * （鼠标路径全关掉，只留面板上的「✕」、再点一次图标与 Esc 三条明确关闭意图）。
 *
 * @module @dshp/widget-kit/client/Popover
 */
import { useAnchoredPosition } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ReactNode } from 'react';
import { SPEC_DEFAULTS } from './spec.js';
import { WidgetErrorBoundary } from './ErrorBoundary.js';
import { useAnchor, useWidgetData } from './hooks.js';
import type { WidgetRuntime } from './service.js';
import type { NormalizedWidget, WidgetContentProps } from './spec.js';
import styles from './styles.module.css';

function resolveText(value: string | (() => string) | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  return typeof value === 'function' ? value() : value;
}

/** 锚点失效时的兜底位（右上角，与默认层叠落点同一区域）。 */
const FALLBACK = { left: { offset: 24, width: 420 }, top: 88 };

export function Popover({
  runtime,
  widget,
  onError,
}: {
  runtime: WidgetRuntime;
  widget: NormalizedWidget;
  onError?: ((message: string, error?: unknown) => void) | undefined;
}): ReactNode {
  const panelRef = useRef<HTMLDivElement | null>(null);
  // 锚点可能是「晚到」的（图标比恢复出来的面板后挂载）：换 ref 身份即触发官方 hook 重新测量
  const anchor = useAnchor(runtime, widget.id);
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);
  /** 形态选项（`presentation: 'popover'` 时规范化阶段一定填好了；这里只做类型兜底）。 */
  const options = widget.popover ?? {
    trigger: 'click' as const,
    width: null,
    maxHeight: null,
    padding: SPEC_DEFAULTS.popoverPadding,
    side: 'bottom' as const,
    header: true,
    hoverOpenDelayMs: SPEC_DEFAULTS.hoverOpenDelayMs,
    hoverCloseDelayMs: SPEC_DEFAULTS.hoverCloseDelayMs,
    persistent: SPEC_DEFAULTS.popoverPersistent,
  };
  const anchored = useAnchoredPosition({
    open: true,
    anchorRef,
    panelRef,
    side: options.side,
    gap: 8,
    margin: 8,
  });
  const data = useWidgetData(runtime, widget, true);
  const close = useCallback(() => {
    runtime.close(widget.id);
  }, [runtime, widget.id]);

  // 点开的 popover 把焦点移进面板（键盘用户立刻就位）；悬停展开的**不抢焦点**，否则鼠标划过就夺走输入。
  // 两层各有自己的 origin：常驻面板（手风琴层）与临时面板（悬停速览层）互不影响。
  useEffect(() => {
    const snapshot = runtime.getSnapshot();
    const origin = options.persistent ? snapshot.pinnedOrigin : snapshot.transientOrigin;
    if (origin !== 'click') return;
    panelRef.current?.focus();
  }, [options.persistent, runtime]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    // 常驻面板（`persistent: true`）不监听外部点击：点别处、移开指针都不收起
    const onPointerDown = (event: PointerEvent): void => {
      if (options.persistent) return;
      const target = event.target as Node | null;
      if (panelRef.current !== null && panelRef.current.contains(target)) return;
      // 点锚点（托盘图标）时不在这里关：让图标自己的 onClick 去 toggle，否则会「关掉又被打开」
      if (anchorRef.current !== null && anchorRef.current.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      close();
      const button = anchorRef.current?.querySelector('button') ?? null;
      button?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [anchorRef, close, options.persistent]);

  const title = resolveText(widget.content?.title ?? widget.title, widget.id);
  const content = widget.content;
  const contentProps: WidgetContentProps = {
    frame: 'popover',
    sessionId: runtime.getSession(),
    status: data.status,
    data: data.data,
    ...(data.error === undefined ? {} : { error: data.error }),
    stale: data.stale,
    lastUpdatedAt: data.lastUpdatedAt,
    size: null,
    sizeClass: 'regular',
    minimized: false,
    locked: false,
    refresh: data.refresh,
    retry: data.retry,
    close,
  };
  const body = content === null ? null : content.render(contentProps);
  const style =
    anchored ??
    ({
      top: FALLBACK.top,
      left: Math.max(12, runtime.viewport().width - FALLBACK.left.width - FALLBACK.left.offset),
    } as const);

  const panelStyle = {
    ...style,
    ...(options.width === null ? {} : { width: options.width }),
    ...(options.maxHeight === null ? {} : { maxHeight: options.maxHeight }),
  };

  return (
    <div
      ref={panelRef}
      className={styles.popover}
      style={panelStyle}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      data-widget={widget.id}
      data-trigger={options.trigger}
      data-persistent={options.persistent ? 'true' : 'false'}
      data-channel={options.persistent ? 'pinned' : 'transient'}
      // 面板自己也报悬停：指针从图标移到面板的间隙里撤销「待收起」
      onPointerEnter={() => {
        runtime.hoverEnter(widget.id);
      }}
      onPointerLeave={() => {
        runtime.hoverLeave(widget.id);
      }}
    >
      {options.header && (
        <div className={styles.popoverHeader}>
          <span className={styles.popoverTitle}>{title}</span>
          {options.persistent && (
            <span className={styles.popoverPinned} title="常驻面板：点外部不会关闭">
              常驻
            </span>
          )}
          <button type="button" className={styles.cardAction} aria-label={`关闭「${title}」`} onClick={close}>
            ✕
          </button>
        </div>
      )}
      <div className={styles.popoverBody} style={{ padding: options.padding }}>
        <WidgetErrorBoundary label={title} onError={onError} onRetry={data.retry}>
          {body}
        </WidgetErrorBoundary>
      </div>
    </div>
  );
}
