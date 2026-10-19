/**
 * 卡片：可拖拽 / 八向缩放 / 最小化 / 关闭的浮层窗口
 *
 * 框架只管**窗口**（几何、z 序、状态、错误隔离、加载/错误/陈旧态），**内容如何随尺寸变化由提供方决定**：
 * 这里只把事实交出去（`size` / `sizeClass` / `frame`）与一个受约束的 `setSize`。
 *
 * @module @dshp/widget-kit/client/Card
 */
import { Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import type { MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { SPEC_DEFAULTS, resolveText } from './spec.js';
import type { NormalizedWidget, WidgetContentProps } from './spec.js';
import { capsuleOverflowFix, headerActions } from './geometry.js';
import { WidgetErrorBoundary } from './ErrorBoundary.js';
import { ResizeHandles } from './ResizeHandles.js';
import { LockGlyph } from './glyphs.js';
import { measureHeaderWidth, textOverflowPx } from './measure.js';
import { useCardDrag, useFramework, useLiveGeometry, useWidgetData } from './hooks.js';
import type { WidgetRuntime } from './service.js';
import styles from './styles.module.css';

/** 尺寸档预设相对描述符 `defaultSize` 的倍率（菜单里的「紧凑 / 常规 / 宽」）。 */
const SIZE_PRESET_FACTOR = { compact: 0.75, regular: 1, wide: 1.35 } as const;

export function Card({
  runtime,
  widget,
  onError,
}: {
  runtime: WidgetRuntime;
  widget: NormalizedWidget;
  onError?: ((message: string, error?: unknown) => void) | undefined;
}): ReactNode {
  const snapshot = useFramework(runtime);
  // 只订阅「我自己」的活动几何：别的卡片被拖动时这里拿到的引用不变，不会跟着重渲染
  const live = useLiveGeometry(runtime, widget.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const renderDepth = useRef(0);
  const warnedRenderSize = useRef(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const drag = useCardDrag(runtime, widget, 'move');
  const card = snapshot.layout.cards[widget.id];
  const open = card?.open === true;
  const minimized = card?.minimized === true;
  /** 位置锁定：不可拖动、不可缩放；最小化 / 关闭 / 还原照常。 */
  const locked = card?.locked === true;
  // 最小化 = 折叠成一条标题栏（不是「留一个空窗口」）。内容仍挂在树上（只是不显示），
  // 所以还原是瞬时的、组件自己的内部状态也不会丢；数据轮询不因最小化而中断。
  const data = useWidgetData(runtime, widget, open);

  /** 渲染期调 setSize = 规范禁止的尺寸回环来源：延后到微任务并只警告一次。 */
  const setSize = useCallback(
    (next: { w?: number; h?: number }): void => {
      if (renderDepth.current > 0) {
        if (!warnedRenderSize.current) {
          warnedRenderSize.current = true;
          console.warn(
            `[dshp-widget-kit] 组件「${widget.id}」在 content.render 期间调用了 setSize（规范禁止：` +
              '这会让尺寸与内容互相驱动）。本次已延后处理，请把改尺寸放到事件回调里。',
          );
        }
        queueMicrotask(() => {
          runtime.requestSize(widget.id, next);
        });
        return;
      }
      runtime.requestSize(widget.id, next);
    },
    [runtime, widget.id],
  );

  const menuItems = useMemo<MenuEntry[]>(() => {
    const size = widget.card?.defaultSize ?? SPEC_DEFAULTS.cardDefaultSize;
    const entries: MenuEntry[] = [
      { id: 'minimize', label: minimized ? '还原卡片' : '最小化' },
      { id: 'lock', label: locked ? '解锁位置' : '锁定位置（不可移动与缩放）' },
    ];
    // 锁定后几何相关的项一律不出现（点了没反应是最糟的一种交互），标题栏也只剩「解锁 + ⋯」，
    // 所以最小化 / 关闭这两个仍可用的动作都收进这个菜单里
    if (locked) {
      entries.push({ type: 'label', id: 'locked-label', text: '位置已锁定：移动与缩放已停用' });
    } else {
      entries.push(
        { id: 'reset', label: '恢复默认尺寸' },
        { id: 'center', label: '居中' },
        { type: 'label', id: 'size-label', text: '尺寸' },
        {
          id: 'size:compact',
          label: `紧凑 ${String(Math.round(size.w * SIZE_PRESET_FACTOR.compact))}×${String(Math.round(size.h * SIZE_PRESET_FACTOR.compact))}`,
        },
        { id: 'size:regular', label: `常规 ${String(size.w)}×${String(size.h)}` },
        {
          id: 'size:wide',
          label: `宽 ${String(Math.round(size.w * SIZE_PRESET_FACTOR.wide))}×${String(Math.round(size.h * SIZE_PRESET_FACTOR.wide))}`,
        },
      );
    }
    entries.push({ type: 'separator', id: 'sep-1' }, { id: 'close', label: '关闭卡片', danger: true });
    return entries;
  }, [locked, minimized, widget.card]);

  const onMenuSelect = useCallback(
    (id: string): void => {
      setMenuOpen(false);
      const size = widget.card?.defaultSize ?? SPEC_DEFAULTS.cardDefaultSize;
      if (id === 'minimize') {
        runtime.toggleMinimize(widget.id);
        return;
      }
      if (id === 'lock') {
        runtime.setLocked(widget.id, !locked);
        return;
      }
      if (id === 'reset') {
        runtime.resizeTo(widget.id, { w: size.w, h: size.h });
        return;
      }
      if (id === 'center') {
        runtime.center(widget.id);
        return;
      }
      if (id === 'close') {
        runtime.close(widget.id);
        return;
      }
      if (id.startsWith('size:')) {
        const key = id.slice(5) as keyof typeof SIZE_PRESET_FACTOR;
        const factor = SIZE_PRESET_FACTOR[key];
        if (factor === undefined) return;
        runtime.resizeTo(widget.id, { w: Math.round(size.w * factor), h: Math.round(size.h * factor) });
      }
    },
    [locked, runtime, widget.card, widget.id],
  );

  const onHeaderKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>): void => {
      if (locked) return; // 锁定的卡片不吃几何键（服务端也会拦，这里省掉一次无谓的 preventDefault）
      const step = event.shiftKey ? 32 : 8;
      const resizeStep = 16;
      const key = event.key;
      if (key === 'ArrowLeft') runtime.nudge(widget.id, event.altKey ? 0 : -step, 0);
      else if (key === 'ArrowRight') runtime.nudge(widget.id, event.altKey ? 0 : step, 0);
      else if (key === 'ArrowUp') runtime.nudge(widget.id, 0, event.altKey ? 0 : -step);
      else if (key === 'ArrowDown') runtime.nudge(widget.id, 0, event.altKey ? 0 : step);
      else return;
      event.preventDefault();
      if (event.altKey)
        runtime.nudgeResize(
          widget.id,
          key === 'ArrowLeft' ? -resizeStep : key === 'ArrowRight' ? resizeStep : 0,
          key === 'ArrowUp' ? -resizeStep : key === 'ArrowDown' ? resizeStep : 0,
        );
    },
    [locked, runtime, widget.id],
  );

  // 提前解析标题：下面那个「量胶囊需要多宽」的 effect 要按它决定何时重量一次
  // （标题可以是返回字符串的函数，值变了就得重新量）。
  const title = resolveText(widget.title, widget.id);
  const hasSubtitle = resolveText(widget.content?.title ?? widget.subtitle, '') !== '';
  /**
   * 最小化时胶囊**现在**多宽（渲染用的就是它）。它是 effect 的依赖之一：兜底补差改的是回报值，
   * 胶囊因此变宽 → 这个值变 → effect 再核对一次（溢出归零就停，不会振荡）。
   */
  const capsuleNow = minimized
    ? runtime.capsuleWidthOf(widget, card?.w ?? SPEC_DEFAULTS.cardDefaultSize.w)
    : null;

  /**
   * 把「最小化胶囊需要多宽」回报给运行时 —— 量的是**整条标题栏的自然宽度**（含真实按钮与内边距）。
   *
   * 量不到（没有 DOM 的宿主、元素已摘掉）就不回报：胶囊退回地板宽度，而不是拿一个猜的宽度把标题截掉。
   * 这不是「按渲染尺寸反推尺寸」（规范禁止的回环）：只回报一个**标题栏自己需要多宽**的数，
   * 渲染期不改任何几何，真正改宽度的是运行时（最小化时才用）。
   *
   * 三个触发点：
   *  1. 每次依赖变化（标题 / 按钮集 / 锁定态 / 外观偏好带来的尺寸）；依赖里**必须带 `widget` 对象本身**：
   *     同 id 重注册（token-meter 供应商增删时会做）拿到的是新的规范化对象，而 `CardLayer` 按 id 复用
   *     同一个 Card 实例 —— 只依赖 `widget.id` 就不会重跑，而卸载路径已经删掉测量 → 卡片永远停在地板宽度；
   *  2. `fonts.ready` **之后的一帧**：网络字体换装会让字形宽度变化，而 `ready` 解决的那一刻布局可能
   *     还是回退字体（同步量会量到旧的宽度），所以推到下一帧再量；`loadingdone` 同理（后到的字体批次）；
   *  3. 兜底：最小化时若标题**仍然**被省略号截着（字体 / 边框 / 取整带来的残余误差），按实际溢出量补一次
   *     —— 只在胶囊还没顶到布局宽度时补，补完重量一次，溢出归零即停（见 `geometry.capsuleOverflowFix`）。
   */
  useLayoutEffect(() => {
    const report = (): void => {
      const need = measureHeaderWidth(headerRef.current, styles.cardSubtitle);
      if (need === null) return;
      runtime.reportCapsuleNeed(widget.id, need);
      if (!minimized) return;
      const layoutWidth = runtime.rectOf(widget.id).w;
      const fix = capsuleOverflowFix({
        need,
        overflow: textOverflowPx(titleRef.current),
        capsule: runtime.capsuleWidthOf(widget, layoutWidth),
        layoutWidth,
      });
      if (fix !== null) runtime.reportCapsuleNeed(widget.id, fix);
    };
    report();
    const fonts: FontFaceSet | undefined = typeof document === 'undefined' ? undefined : document.fonts;
    if (fonts === undefined) return;
    let cancelled = false;
    /** 推到下一帧再量：字体刚就位时布局还可能是旧的（同步量会拿到回退字体的宽度）。 */
    const reportNextFrame = (): void => {
      const raf = globalThis.requestAnimationFrame;
      if (typeof raf !== 'function') {
        report();
        return;
      }
      raf(() => {
        if (!cancelled) report();
      });
    };
    void fonts.ready.then(reportNextFrame, () => {});
    fonts.addEventListener('loadingdone', reportNextFrame);
    return () => {
      cancelled = true;
      fonts.removeEventListener('loadingdone', reportNextFrame);
    };
  }, [runtime, widget, title, hasSubtitle, locked, minimized, capsuleNow]);

  if (card === undefined || !card.open) return null;

  /** 这张卡上是否有手势在进行（拖动或八向缩放都算 —— 两种都走 beginLive）。 */
  const gestureActive = live !== null && live.id === widget.id;
  const stored = gestureActive ? live.rect : card;
  /**
   * 最小化 = 一枚胶囊。**宽度必须写成显式长度**（`auto` 与长度之间不可插值，用 auto 时最小化会先
   * 瞬移一次宽度、再慢慢缩高度，很跳）。这个长度是**算出来的**：装得下标题与控件，夹在
   * `[SPEC_DEFAULTS.capsule.minWidth, 布局宽度]` 之间 —— 不是固定压到某个宽度（那会把标题挤成省略号）。
   * 算式与运行时 `visualRectOf` 完全一致（两边都调 `runtime.capsuleWidthOf`），渲染与几何不会打架。
   */
  const rect = minimized
    ? {
        ...stored,
        w: runtime.capsuleWidthOf(widget, stored.w),
        h: SPEC_DEFAULTS.titleBarHeight,
      }
    : stored;
  const contentSize = runtime.contentSize(stored);
  const sizeClass = runtime.sizeClassOf(widget, stored);
  const content = widget.content;
  const contentProps = {
    frame: 'card' as const,
    sessionId: runtime.getSession(),
    status: data.status,
    data: data.data,
    ...(data.error === undefined ? {} : { error: data.error }),
    stale: data.stale,
    lastUpdatedAt: data.lastUpdatedAt,
    size: contentSize,
    sizeClass,
    setSize,
    minimized,
    locked,
    refresh: data.refresh,
    retry: data.retry,
    close: () => {
      runtime.close(widget.id);
    },
  } satisfies WidgetContentProps;

  const subtitle = resolveText(content?.title ?? widget.subtitle, '');
  /**
   * 标题栏上该有哪几个按钮：渲染与「胶囊要多宽」共用同一个判定（`geometry.headerActions`）——
   * 增删按钮时胶囊的宽度算式跟着一起变，标题不会被新按钮挤掉一截。
   */
  const actions = headerActions({
    locked,
    minimizable: widget.card?.minimizable !== false,
    closable: widget.card?.closable !== false,
  });
  const zIndex = Math.max(1, snapshot.zOrder.indexOf(widget.id) + 1);

  // 渲染期标记：内容在 render 里调 setSize 属于规范禁止的尺寸回环来源，要能识别出来（见 setSize）。
  renderDepth.current += 1;
  let body: ReactNode = null;
  try {
    body = content === null ? null : content.render(contentProps);
  } finally {
    renderDepth.current -= 1;
  }

  return (
    <div
      className={
        styles.card +
        // 手势期间（拖动或缩放）整卡不可选中文字：缩放的指针常常扫过卡片内容
        (gestureActive ? ' ' + styles.cardDragging : '') +
        (minimized ? ' ' + styles.cardMinimized : '') +
        (locked ? ' ' + styles.cardLocked : '')
      }
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex }}
      role="dialog"
      aria-label={title}
      data-widget={widget.id}
      data-size-class={sizeClass}
      data-minimized={minimized ? 'true' : 'false'}
      data-locked={locked ? 'true' : 'false'}
      data-gesture={gestureActive ? 'true' : 'false'}
    >
      <div
        className={styles.cardHeader}
        ref={headerRef}
        tabIndex={0}
        aria-label={
          locked
            ? '位置已锁定；双击最小化（在 ⋯ 菜单里解锁）'
            : '拖动标题栏移动卡片；方向键移动，Alt+方向键缩放；双击最小化'
        }
        onKeyDown={onHeaderKeyDown}
        onDoubleClick={() => {
          runtime.toggleMinimize(widget.id);
        }}
        {...drag.handlers}
      >
        <span className={styles.cardTitle} ref={titleRef}>
          {title}
        </span>
        {subtitle !== '' && (
          <span className={styles.cardSubtitle + (minimized ? ' ' + styles.cardSubtitleHidden : '')}>
            {subtitle}
          </span>
        )}
        <span
          className={styles.cardActions}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            className={styles.cardAction + ' ' + styles.cardLockAction}
            data-locked={locked ? 'true' : 'false'}
            aria-label={locked ? `解锁「${title}」的位置` : `锁定「${title}」的位置`}
            aria-pressed={locked}
            onClick={() => {
              runtime.setLocked(widget.id, !locked);
            }}
          >
            <LockGlyph locked={locked} />
          </button>
          {/* 锁定的卡片标题栏只留「解锁」与「⋯」：最小化 / 关闭都进菜单，
              免得一排图标里点错（这两个动作本身仍然可用，只是不再占标题栏）。
              可见性判定来自 `actions`（与胶囊宽度算式同一个来源），不是就地写条件。 */}
          {actions.minimize && (
            <button
              type="button"
              className={styles.cardAction}
              aria-label={minimized ? `还原「${title}」` : `最小化「${title}」`}
              onClick={() => {
                runtime.toggleMinimize(widget.id);
              }}
            >
              {minimized ? '▢' : '—'}
            </button>
          )}
          <Menu
            open={menuOpen}
            dense
            portal
            autoFocus
            align="end"
            items={menuItems}
            onSelect={onMenuSelect}
            onClose={() => {
              setMenuOpen(false);
            }}
            anchor={
              <button
                type="button"
                className={styles.cardAction}
                aria-label={`「${title}」的卡片菜单`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((prev) => !prev);
                }}
              >
                ⋯
              </button>
            }
          />
          {actions.close && (
            <button
              type="button"
              className={styles.cardAction + ' ' + styles.cardActionDanger}
              aria-label={`关闭「${title}」`}
              onClick={() => {
                runtime.close(widget.id);
              }}
            >
              ✕
            </button>
          )}
        </span>
      </div>

      <div
        className={styles.cardBody + (minimized ? ' ' + styles.cardBodyHidden : '')}
        aria-hidden={minimized}
      >
        <div className={styles.contentHost}>
          <WidgetErrorBoundary label={title} onError={onError} onRetry={data.retry}>
            {body}
          </WidgetErrorBoundary>
        </div>
        {widget.card?.resizable !== false && !locked && !minimized && (
          <ResizeHandles runtime={runtime} widget={widget} />
        )}
      </div>
    </div>
  );
}
