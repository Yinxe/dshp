/**
 * 会话顶部托盘 —— 注册进 `conversation.session.header.utilities` 的那一个条目
 *
 * 像系统状态栏：每个组件一个常驻图标（可带徽标），点击开/最小化/还原（任务栏语义），
 * 超出可见上限的进溢出菜单（菜单里有完整的键盘通道：打开、显示/隐藏、上移/下移）。
 * 图标之间可拖拽换序（点击阈值 8px，`pointercancel` 丢弃本次手势）；被禁用的组件不出现在这里
 * （启用/禁用走设置页或「组件诊断」卡片）。
 *
 * **拖拽模型**（与卡片一致：自由跟手 + 预览 + 松手落位）：
 *  - `pointerdown` 把各图标的槽位**冻结**一份（`planTrayDrag` 只吃这份冻结数据，拖动期间不再读 DOM），
 *    于是左右两个方向完全对称 —— 边拖边重排会自我反馈，指针下的槽位随渲染一起变，判定就会抖，
 *    历史上两次方向性 bug（先「只能从右往左」、后「只能从左往右」）都出在这类反馈/落点读取上；
 *  - 拖动期间：被拖图标 `translateX(dx)` 自由跟手并抬起（放大 + 主题色阴影），其余图标用
 *    `translateX(±一格)` 平滑让位，目标槽位画一个**主题色填充的预览块**（`.trayGhost`）；
 *  - 松手：把新顺序一次提交（`runtime.setOrder`），预览块消失、图标落进空位。
 *
 * @module @dshp/widget-kit/client/Tray
 */
import { Menu, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import type { MenuEntry, MenuItem } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { surfaceVars } from './appearance.js';
import { TRAY_LABEL_MAX_CHARS } from './spec.js';
import { mergeVisibleOrder, planTrayDrag } from './store.js';
import type { TraySlot } from './store.js';
import { useFramework } from './hooks.js';
import type { WidgetRuntime } from './service.js';
import type { NormalizedWidget } from './spec.js';
import styles from './styles.module.css';

/** 判定为「拖拽」而不是「点击」的位移阈值（px）。 */
const DRAG_THRESHOLD = 8;

function resolveText(value: string | (() => string)): string {
  return typeof value === 'function' ? value() : value;
}

/** 手势中的原始数据（ref，不参与渲染）。 */
interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  /** 完整可见顺序（含被「可见上限」截掉、进溢出菜单的那些）。 */
  visible: string[];
  /** 手势开始时冻结的槽位几何（相对托盘左上角；`center` 是世界坐标，供命中判定）。 */
  slots: TraySlot[];
}

/** 渲染用的拖动视图（每帧更新；只有这几个字段变化才重渲染）。 */
interface DragView {
  id: string;
  /** 指针相对起点的水平位移（被拖图标跟手用）。 */
  dx: number;
  /** 预览块要落的槽位（相对托盘左上角）。 */
  slot: { left: number; width: number } | null;
  /** 其余图标让位所需的位移。 */
  shift: Record<string, number>;
}

export function Tray({
  runtime,
  sessionId,
}: {
  runtime: WidgetRuntime;
  sessionId?: string | null | undefined;
}): ReactNode {
  const snapshot = useFramework(runtime);
  const [menuOpen, setMenuOpen] = useState(false);
  /** 拖动视图：null = 没有手势。**顺序不变**（只靠 transform 让位），所以拖动期间不重排 DOM。 */
  const [dragView, setDragView] = useState<DragView | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const listeners = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
    cancel: (event: PointerEvent) => void;
  } | null>(null);
  const latest = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disabled = useMemo(() => new Set(snapshot.layout.disabled), [snapshot.layout.disabled]);

  // 内容面绑定开启它的会话：把当前会话告诉运行时（切换会话时运行时会把内容面关掉）
  useEffect(() => {
    if (sessionId === undefined) return;
    runtime.setSession(sessionId ?? null);
  }, [runtime, sessionId]);

  /** 完整顺序（把尚未进 order 的新组件补在后面）。 */
  const orderIds = useMemo(() => {
    const ids = [...snapshot.layout.tray.order];
    for (const widget of snapshot.widgets) {
      if (!ids.includes(widget.id)) ids.push(widget.id);
    }
    return ids;
  }, [snapshot.layout.tray.order, snapshot.widgets]);

  const ordered = useMemo(
    () => orderIds.map((id) => snapshot.widgets.find((widget) => widget.id === id)),
    [orderIds, snapshot.widgets],
  );
  // 被禁用的组件不进托盘（图标、卡片、面板一并停用 —— 见 runtime.setEnabled）；
  // `trayIcon: false` 的卡片也不进 —— 它们由别的组件（如宿主插件的迷你菜单）打开
  const ready = ordered.filter(
    (widget): widget is NormalizedWidget =>
      widget !== undefined && !disabled.has(widget.id) && widget.trayIcon !== false,
  );
  const hidden = new Set(snapshot.layout.tray.hidden);
  const visibleIds = ready.filter((widget) => !hidden.has(widget.id)).map((widget) => widget.id);
  const limit = Math.max(1, snapshot.prefs.maxVisibleIcons);
  const shownIds = visibleIds.slice(0, limit);
  const shown = shownIds
    .map((id) => ready.find((widget) => widget.id === id))
    .filter((widget): widget is NormalizedWidget => widget !== undefined);
  const overflow = ready.filter((widget) => !shownIds.includes(widget.id));

  // ── 拖拽换序（1D；冻结槽位 + 预览块 + 松手落位）───────────────────────

  /** 读一次各图标槽位（相对托盘左上角；`center` 用世界坐标，方便直接与指针比）。 */
  const readSlots = useCallback((ids: readonly string[]): TraySlot[] => {
    const root = containerRef.current;
    if (root === null) return [];
    const trayRect = root.getBoundingClientRect();
    const slots: TraySlot[] = [];
    for (const id of ids) {
      const node = root.querySelector(`[data-tray-id="${id}"]`);
      if (node === null) return []; // 少一个就不拖：宁可这一次不排序，也不要错位
      const rect = node.getBoundingClientRect();
      slots.push({
        id,
        left: rect.left - trayRect.left,
        width: rect.width,
        center: rect.left + rect.width / 2,
      });
    }
    return slots;
  }, []);

  /** 把最新指针位置算成拖动视图（rAF 合并：一帧最多算一次）。 */
  const flushDrag = useCallback((): void => {
    const drag = dragRef.current;
    if (drag === null) return;
    const dx = latest.current.x - drag.startX;
    const dy = latest.current.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    // 命中判定只吃**冻结的槽位**：拖动期间不读 DOM，左右两个方向因此完全对称
    const plan = planTrayDrag(drag.slots, drag.id, latest.current.x);
    setDragView({
      id: drag.id,
      dx,
      slot: plan.slot === null ? null : { left: plan.slot.left, width: plan.slot.width },
      shift: plan.shift,
    });
  }, []);

  /**
   * 收尾。可重复调用（只有第一次生效）：`commit` = 提交新顺序，`false` = 丢弃本次手势。
   *
   * @param commit - 是否提交。
   * @param pointerX - 松手时的横坐标（缺省用最后一帧记住的位置）。
   */
  const finishDrag = useCallback(
    (commit: boolean, pointerX?: number): void => {
      const drag = dragRef.current;
      if (drag === null) return;
      dragRef.current = null;
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
      setDragView(null);
      if (!commit || !drag.moved) return;
      suppressClick.current = true;
      const plan = planTrayDrag(drag.slots, drag.id, pointerX ?? latest.current.x);
      // 只有真的换了位置才动本机布局（点击/原地放下不写盘）
      if (plan.to < 0 || plan.order.join() === drag.slots.map((slot) => slot.id).join()) return;
      runtime.setOrder(mergeVisibleOrder(orderIds, plan.order));
    },
    [orderIds, runtime],
  );

  const onIconPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, id: string): void => {
      if (event.button !== 0 || dragRef.current !== null) return;
      const slots = readSlots(visibleIds.slice(0, limit));
      if (slots.length < 2) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* 不支持捕获时仍然允许拖（只是移出元素后收不到事件） */
      }
      dragRef.current = {
        id,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        visible: visibleIds,
        slots,
      };
      latest.current = { x: event.clientX, y: event.clientY };

      // 与卡片同一套可靠性做法：捕获只是优化，真正的驱动是 window 上的兜底监听 ——
      // 捕获被浏览器悄悄收走也能继续拖；漏收 pointerup（松在窗口外）时按 `buttons` 当帧收尾。
      if (typeof window === 'undefined') return;
      const pointerId = event.pointerId;
      const move = (native: PointerEvent): void => {
        if (native.pointerId !== pointerId) return;
        if (native.pointerType !== 'touch' && native.buttons === 0) {
          finishDrag(true, native.clientX);
          return;
        }
        latest.current = { x: native.clientX, y: native.clientY };
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          flushDrag();
        });
      };
      const up = (native: PointerEvent): void => {
        if (native.pointerId !== pointerId) return;
        latest.current = { x: native.clientX, y: native.clientY };
        flushDrag();
        finishDrag(true, native.clientX);
      };
      const cancel = (native: PointerEvent): void => {
        if (native.pointerId !== pointerId) return;
        finishDrag(false);
      };
      listeners.current = { move, up, cancel };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    },
    [finishDrag, flushDrag, limit, readSlots, visibleIds],
  );

  // 托盘被卸载（切会话 / 关掉托盘）时把没结束的手势收干净
  useEffect(() => () => finishDrag(false), [finishDrag]);

  const onIconClick = useCallback(
    (id: string): void => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      runtime.toggle(id);
    },
    [runtime],
  );

  // ── 溢出菜单 ──────────────────────────────────────────────────────────

  const menuItems = useMemo<MenuEntry[]>(() => {
    const entries: MenuEntry[] = [{ type: 'label', id: 'widgets-label', text: '组件' }];
    for (const widget of ready) {
      const title = resolveText(widget.title);
      const submenu: MenuItem[] = [
        { id: `open:${widget.id}`, label: runtime.isOpen(widget.id) ? '收起 / 最小化' : '打开' },
        {
          id: `hide:${widget.id}`,
          label: hidden.has(widget.id) ? '在托盘中显示' : '从托盘隐藏',
        },
        { id: `up:${widget.id}`, label: '上移' },
        { id: `down:${widget.id}`, label: '下移' },
      ];
      entries.push({
        id: `w:${widget.id}`,
        label: hidden.has(widget.id) ? `已隐藏 · ${title}` : title,
        submenu,
      });
    }
    entries.push({ type: 'separator', id: 'sep-tray' });
    entries.push({ id: 'reset-tray', label: '重置托盘顺序与隐藏' });
    return entries;
    // hidden / snapshot 变化都要重建菜单文案
  }, [hidden, ready, runtime, snapshot]);

  const onMenuSelect = useCallback(
    (id: string): void => {
      setMenuOpen(false);
      if (id === 'reset-tray') {
        runtime.resetTrayLayout();
        return;
      }
      const index = id.indexOf(':');
      if (index < 0) return;
      const action = id.slice(0, index);
      const widgetId = id.slice(index + 1);
      if (action === 'open') runtime.toggle(widgetId);
      else if (action === 'hide') runtime.setHidden(widgetId, !hidden.has(widgetId));
      else if (action === 'up') runtime.setTrayOrder(widgetId, -1);
      else if (action === 'down') runtime.setTrayOrder(widgetId, 1);
    },
    [hidden, runtime],
  );

  const overflowBadge = overflow.some((widget) => (snapshot.badges[widget.id] ?? null) !== null);

  if (!snapshot.ready || !snapshot.prefs.trayEnabled || ready.length === 0) return null;

  const dragging = dragView !== null;
  return (
    <div
      className={styles.tray}
      role="group"
      aria-label="小组件托盘"
      ref={containerRef}
      // 托盘与卡片层是两个槽位、两棵树：外观/动效偏好各钉一份，不写 documentElement
      style={surfaceVars(snapshot.prefs)}
    >
      {/* 预览块：主题色填充 + 柔光，落在「松手会去」的那个槽位（被让出来的空位） */}
      {dragView?.slot != null && (
        <span
          className={styles.trayGhost}
          style={{ left: dragView.slot.left, width: dragView.slot.width }}
          aria-hidden="true"
        />
      )}
      {shown.map((widget) => {
        const badge = snapshot.badges[widget.id] ?? null;
        const active = runtime.isOpen(widget.id);
        const isDragged = dragView?.id === widget.id;
        const shifted = dragView?.shift[widget.id] ?? 0;
        const title = resolveText(widget.title);
        const label = badge?.title !== undefined && badge.title !== '' ? `${title} · ${badge.title}` : title;
        const hoverTriggered = widget.presentation === 'popover' && widget.popover?.trigger === 'hover';
        const tone = badge?.tone ?? 'info';
        // 活动栏的「图标 + 少量文字」扩展点：写函数 = 每次重渲染时求值（徽标刷新会带来重渲染）
        const trayLabel =
          widget.tray.label === null ? '' : resolveText(widget.tray.label).slice(0, TRAY_LABEL_MAX_CHARS);
        return (
          <span
            key={widget.id}
            className={styles.trayAnchor + (isDragged ? ' ' + styles.trayAnchorDragging : '')}
            data-tray-id={widget.id}
            style={
              isDragged
                ? { transform: `translateX(${String(dragView.dx)}px)`, zIndex: 3 }
                : shifted === 0
                  ? undefined
                  : { transform: `translateX(${String(shifted)}px)` }
            }
            ref={(element) => {
              runtime.setAnchor(widget.id, element);
            }}
            // 悬停展开的组件：指针进出图标都要告诉运行时（延迟与宽限由描述符定）
            onPointerEnter={() => {
              runtime.hoverEnter(widget.id);
            }}
            onPointerLeave={() => {
              runtime.hoverLeave(widget.id);
            }}
          >
            <Tooltip
              label={label}
              side="bottom"
              delayMs={400}
              // 悬停展开的 popover 本身就是它的说明，再叠一层气泡只会互相打架；
              // 拖动中也不要弹气泡（图标一直跟着指针，气泡只会碍事）
              disabled={hoverTriggered || dragging}
            >
              <button
                type="button"
                className={
                  styles.trayBtn +
                  (active ? ' ' + styles.trayBtnActive : '') +
                  (isDragged ? ' ' + styles.trayBtnDragging : '')
                }
                data-dragging={isDragged ? 'true' : undefined}
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={active}
                onPointerDown={(event) => {
                  onIconPointerDown(event, widget.id);
                }}
                onClick={() => {
                  onIconClick(widget.id);
                }}
              >
                <span className={styles.trayGlyph}>{widget.icon}</span>
                {trayLabel !== '' && (
                  <span className={styles.trayLabel} data-tray-label={trayLabel}>
                    {trayLabel}
                  </span>
                )}
                {badge !== null && badge.text !== undefined && badge.text !== '' ? (
                  <span className={styles.trayBadgeText} data-tone={tone}>
                    {badge.text.slice(0, 2)}
                  </span>
                ) : badge !== null && (badge.dot === true || badge.tone !== undefined) ? (
                  <span className={styles.trayBadge} data-tone={tone} />
                ) : null}
              </button>
            </Tooltip>
          </span>
        );
      })}

      {overflow.length > 0 && (
        <span className={styles.trayAnchor}>
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
                className={styles.trayBtn}
                aria-label={`还有 ${String(overflow.length)} 个组件`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((prev) => !prev);
                }}
              >
                <span className={styles.trayGlyph}>⋯</span>
                {overflowBadge && <span className={styles.trayBadge} data-tone="info" />}
              </button>
            }
          />
        </span>
      )}
    </div>
  );
}
