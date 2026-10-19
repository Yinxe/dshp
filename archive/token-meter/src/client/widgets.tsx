/**
 * 通用小组件浮窗系统（**双后端**）
 *
 * 中心区「用量统计」里的独立图表（统计图表 `stats:<kind>`）都可以拖出为全局浮窗，
 * 坐标与开关持久化到 localStorage。
 *
 * 2026-09 UI 重构后本系统**只服务统计族**：额度改成了侧边栏底部按钮 + 上方浮层
 * （`sidebar.footer.action`，见 QuotaSection/QuotaTrayPanel），峰谷显示器随额度显示面删除。
 *
 * ## 两个后端
 *
 * | 后端                | 何时用                                     | 谁画窗口                     |
 * | ------------------- | ------------------------------------------ | ---------------------------- |
 * | `@dshp/widget-kit`  | 装了（且启用了）框架插件时                 | 框架：拖拽/缩放/最小化/锁定/吸附/动效/持久化 |
 * | 自带浮层（legacy）  | 没装框架插件时                             | 本文件（`WidgetFloat` + portal） |
 *
 * 两者共用同一个外观接口（`WidgetSystem`），所以 `StatsSection` / 中心区一行都不用改：
 * 它们只调 `WidgetToggle` / `useWidgets`。挂载由 `index.tsx` 在 `ctx.inject(['widgets'], …)` 里做
 * （**可选依赖**：框架缺席时这个回调永不执行，插件其余部分照常）。
 *
 * 进宿主前把 legacy id 编码成宿主要求的形状（`stats:trend` → `token-meter:stats-trend`，
 * 见 `widget-bridge.ts`），**本插件内部一律沿用 legacy id**。
 *
 * 宿主是 `trayIcon: false` 的自由卡片：不占活动栏图标，由中心区「用量统计」工具条上的按钮开合，
 * 也可以被任何别的组件用 `ctx.widgets.toggle('token-meter:stats-trend')` 打开。因为刷新后
 * 布局里「开着」的卡片要能自己长回来，注册是**常驻**的：`syncRegistered()` 在启动时
 * 把当前该有的卡片一次性对齐（新增注册、缺席注销）。
 *
 * @module @dshp/token-meter/client/widgets
 */
import { useEffect, useReducer, type ReactNode } from 'react';
import * as ReactDOM from 'react-dom';
import { Glyph } from './glyphs.js';
import { STATS_PREFIX, encodeFloatId, floatSize, floatTitle, isFloatId } from './widget-bridge.js';
import styles from './styles.module.css';
// 宿主契约直接从 @dshp/widget-kit 的 spec 拿类型（workspace devDependency，纯类型、
// 运行时零 import：`verbatimModuleSyntax` + tsup 的 external 让它在产物里不留痕迹）。
import type { WidgetDescriptor, WidgetsService } from '@dshp/widget-kit/spec';

export interface WidgetPlacement {
  x: number;
  y: number;
}
export interface OpenWidget {
  id: string;
  pos: WidgetPlacement;
}

const LS_KEY = 'tm-widgets';
/** 统一的浮窗宽度（clamp 与渲染共用；所有小组件一致） */
const FLOAT_W = 360;
/** 统一的最大高度（clamp 底部余量与 CSS 一致） */
const FLOAT_H = Math.round(FLOAT_W * 0.6);

/* ═══════════════════════════ 宿主桥（@dshp/widget-kit） ═══════════════════════════ */

/**
 * 宿主服务形状检查。
 *
 * 跨插件接缝拿到的永远是 `unknown`：别的插件可能因为版本不同、或者根本不是 widget-kit，
 * 往同名服务上放了别的东西。形状不对就当没有宿主（回退自带浮层），不要把异常抛给插件层。
 *
 * @param candidate - `ctx.get('widgets')` 的返回值。
 * @returns 通过检查时是服务本身，否则 `null`。
 */
function asService(candidate: unknown): WidgetsService | null {
  if (candidate === null || typeof candidate !== 'object') return null;
  const s = candidate as Partial<WidgetsService>;
  const ok =
    typeof s.register === 'function' &&
    typeof s.list === 'function' &&
    typeof s.subscribe === 'function' &&
    typeof s.open === 'function' &&
    typeof s.close === 'function' &&
    typeof s.isOpen === 'function';
  return ok ? (candidate as WidgetsService) : null;
}

/** 宿主服务；`null` = 没装（或形状不对）→ 全程走自带浮层。 */
let service: WidgetsService | null = null;
/** 宿主的注册表通知订阅（模块级一份，不是每个 hook 一份）。 */
let serviceOff: (() => void) | null = null;
/** 宿主卡片里画什么（由 `TokenMeterSection` 注入：它才知道每个 id 对应哪个组件）。 */
let contentRenderer: ((legacyId: string) => ReactNode) | null = null;
/** legacy id → 宿主 id（正反向都要：宿主回调只会给宿主 id）。 */
const wkOf = new Map<string, string>();
const legacyOf = new Map<string, string>();
/** legacy id → 宿主 `register()` 返回的注销函数。 */
const disposersOf = new Map<string, () => void>();
/** legacy id → 更具体的标题（供应商名等）；`title` 每次渲染求值，改名不需要重新注册。 */
const hints = new Map<string, string>();
/** 宿主原生描述符（托盘菜单那类，不属于任何 legacy id）的注销函数。 */
const hostDisposers: Array<() => void> = [];

/**
 * 卡片图标（宿主在组件箱 / 溢出菜单里会画它）。
 *
 * 按图表语义挑 glyph —— 与中心区里的观感一致。
 *
 * @param legacy - legacy id。
 * @returns 图标节点。
 */
function floatIcon(legacy: string): ReactNode {
  const kind = legacy.startsWith(STATS_PREFIX) ? legacy.slice(STATS_PREFIX.length) : '';
  const glyph: Record<string, string> = {
    cards: 'chartBar',
    trend: 'trend',
    heat: 'grid',
    donut: 'donut',
    today: 'calendar',
  };
  return <Glyph name={glyph[kind] ?? 'chartBar'} size={16} />;
}

/**
 * 确保某个 legacy id 已在宿主注册表里（幂等）。
 *
 * 注册是**常驻**的：宿主渲染一张卡片的前提是描述符在册，而 `trayIcon: false` 的卡片没有图标，
 * 「刷新后仍开着」只能靠这里提前注册。重复调用只更新标题提示，不会重复注册。
 *
 * @param legacy - legacy id（`stats:*`）。
 * @param hint - 更具体的标题（供应商名）；不传时用 `floatTitle` 的默认表。
 * @returns 无。
 */
function ensureRegistered(legacy: string, hint?: string | undefined): void {
  if (service === null || !isFloatId(legacy)) return;
  if (hint !== undefined && hint !== '') hints.set(legacy, hint);
  if (disposersOf.has(legacy)) return;
  const wkId = encodeFloatId(legacy);
  try {
    const dispose = service.register({
      id: wkId,
      title: () => floatTitle(legacy, hints.get(legacy)),
      icon: floatIcon(legacy),
      presentation: 'card',
      // 不占活动栏：这些卡片由中心区「用量统计」工具条上的按钮开合
      trayIcon: false,
      content: {
        render: () =>
          contentRenderer === null ? null : <div className={styles.wkFrame}>{contentRenderer(legacy)}</div>,
      },
      // 尺寸按内容形状逐族给（见 widget-bridge.ts 的 FLOAT_SIZES 表）：
      // 热力图宽而扁、模型分布要留高、今日卡天生小 —— 一套尺寸打天下就是「有的太高、有的太矮」
      card: {
        ...floatSize(legacy),
        resizable: true,
        minimizable: true,
        closable: true,
      },
    } satisfies WidgetDescriptor);
    disposersOf.set(legacy, dispose);
    wkOf.set(legacy, wkId);
    legacyOf.set(wkId, legacy);
  } catch (error) {
    console.error('[dshp-token-meter] 注册小组件到宿主失败（该卡片不会出现）：' + legacy, error);
  }
}

/**
 * 注销一个 legacy id（关闭 + 释放描述符 + 清映射）。
 *
 * 先 `close` 再注销：否则宿主布局里会留下「开着但不在册」的记录，等这个 id 再注册回来时
 * 又自己弹出来（供应商删了又加回来就会看到这种幽灵卡片）。
 *
 * @param legacy - legacy id。
 * @returns 无。
 */
function forgetFloat(legacy: string): void {
  const wkId = wkOf.get(legacy);
  const dispose = disposersOf.get(legacy);
  if (service !== null && wkId !== undefined) {
    try {
      service.close(wkId);
    } catch {
      /* ignore */
    }
  }
  if (dispose !== undefined) {
    try {
      dispose();
    } catch {
      /* ignore */
    }
  }
  wkOf.delete(legacy);
  disposersOf.delete(legacy);
  hints.delete(legacy);
  if (wkId !== undefined) legacyOf.delete(wkId);
}

/**
 * 把宿主注册表对齐到「当前该有的卡片」。
 *
 * 启动与供应商增删（store 变化）时调用：多出来的注销、缺的补上、已存在的只更新标题。
 *
 * @param list - 当前该存在的卡片（legacy id + 标题提示）。
 * @returns 无。
 */
function syncRegistered(list: Array<{ id: string; title?: string | undefined }>): void {
  if (service === null) return;
  const want = new Set<string>();
  for (const item of list) {
    if (!isFloatId(item.id)) continue;
    want.add(item.id);
    ensureRegistered(item.id, item.title);
  }
  for (const legacy of Array.from(disposersOf.keys())) {
    if (!want.has(legacy)) forgetFloat(legacy);
  }
}

/**
 * 当前开着的卡片（宿主模式下由宿主回答）。
 *
 * 自带浮层的开合状态是本地 `open` 表 + localStorage；宿主模式下这个状态在框架那边
 * （它还要管最小化、锁定、跨刷新恢复），所以这里问它。
 *
 * @returns 开着的卡片（自带模式下带坐标；宿主模式坐标由框架管，填 `{0,0}`）。
 */
function bridgedOpenList(): OpenWidget[] {
  if (service === null) return [];
  const out: OpenWidget[] = [];
  for (const legacy of disposersOf.keys()) {
    const wkId = wkOf.get(legacy);
    if (wkId === undefined) continue;
    let open = false;
    try {
      open = service.isOpen(wkId);
    } catch {
      open = false;
    }
    if (open) out.push({ id: legacy, pos: { x: 0, y: 0 } });
  }
  return out;
}

function loadAll(): Record<string, WidgetPlacement> {
  try {
    const raw = window.localStorage.getItem(LS_KEY) || 'null';
    const v = JSON.parse(raw) as Record<string, unknown> | null;
    if (v && typeof v === 'object') {
      const out: Record<string, WidgetPlacement> = {};
      for (const k of Object.keys(v)) {
        const p = (v as Record<string, any>)[k] as { x: number; y: number };
        if (p && isFinite(p.x) && isFinite(p.y)) out[k] = { x: Number(p.x), y: Number(p.y) };
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}
function saveAll(open: Record<string, WidgetPlacement>): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(open));
  } catch {
    /* ignore */
  }
}
function clampPos(p: WidgetPlacement): WidgetPlacement {
  try {
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    return {
      x: Math.max(8, Math.min(p.x, vw - FLOAT_W)),
      y: Math.max(8, Math.min(p.y, vh - FLOAT_H)),
    };
  } catch {
    return p;
  }
}
function cascadePos(count: number): WidgetPlacement {
  try {
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    const step = (count % 8) * 36;
    return {
      x: Math.max(8, Math.min(vw - FLOAT_W - 24 - step, vw - FLOAT_W)),
      y: Math.max(8, Math.min(96 + step, vh - FLOAT_H)),
    };
  } catch {
    return { x: 120, y: 120 };
  }
}

/**
 * 小组件注册表（`createWidgetSystem()` 的产出）。
 *
 * 只有真正被别处用到的成员在这里显式声明（旧的 `Record<string, any>` 让「拼错方法名」变成
 * 运行时才发现的问题——`forget` 少一个字母就是浮窗永不消失）。字段与下面的 return 一一对应。
 */
export interface WidgetSystem {
  /** 当前开着的 widget 列表（订阅式：内部有 listeners + forceUpdate）。 */
  useWidgets(): Array<{ id: string; pos: { x: number; y: number } }>;
  /** 某个 id 是否开着。 */
  isOpen(id: string): boolean;
  /** 打开 / 关闭 / 忘记某个 widget。 */
  openWidget(id: string, at?: WidgetPlacement): void;
  closeWidget(id: string): void;
  forget(prefix: string): void;
  /** 拖拽期间的临时坐标与落点提交。 */
  moveWidget(id: string, pos: WidgetPlacement): void;
  commitWidget(id: string): void;
  /** 抓手的事件属性（`{...gripProps(id)}` 展开到拖拽把手上）。 */
  gripProps(id: string): { onPointerDown: (e: unknown) => void };
  /** 浮窗外壳与开关小按钮。 */
  WidgetFloat: (props: { id: string; children?: ReactNode }) => ReactNode;
  WidgetToggle: (props: { id: string; name?: string | undefined }) => ReactNode;
  /** 置顶与坐标查询。 */
  raise(id: string): void;
  zOf(id: string): number;
  clampAllToViewport(): void;

  /* ── 宿主桥（只有 `index.tsx` 用；不挂宿主时全是 no-op） ── */

  /** 是否已挂上 `@dshp/widget-kit`（挂上后窗口由框架画）。 */
  isBridged(): boolean;
  /** 宿主卡片里画什么（每个 legacy id 一个组件）。 */
  setContentRenderer(render: (legacyId: string) => ReactNode): void;
  /** 把注册表对齐到「当前该有的卡片」（启动 + 供应商增删时调用）。 */
  syncRegistered(list: Array<{ id: string; title?: string | undefined }>): void;
  /** 挂上宿主服务（形状不对返回 `false`，此时继续走自带浮层）。 */
  attach(candidate: unknown): boolean;
  /** 摘下宿主服务：注销全部注册并回到自带浮层。 */
  detach(): void;
  /**
   * 注册一个**宿主原生**描述符（不属于任何 legacy 小组件：托盘菜单 / 常驻面板那类）。
   *
   * @param descriptor - 完整描述符（`popover` / `tray` 等只有这里能写）。
   * @returns 注册成功为 `true`；没挂宿主或描述符被框架拒掉为 `false`。
   */
  registerHost(descriptor: WidgetDescriptor): boolean;
  /**
   * 当前在册的小组件（菜单面板用它列条目；宿主模式下才有内容）。
   *
   * @returns legacy id + 标题，按注册顺序。
   */
  listFloats(): Array<{ id: string; title: string }>;
}

export function createWidgetSystem(): WidgetSystem {
  let open: Record<string, WidgetPlacement> = typeof window !== 'undefined' ? loadAll() : {};
  // 置顶次序：数组尾部 = 最新交互/新开（z-index 随之递增），点击/拖动自动置顶
  let order: string[] = Object.keys(open);
  const listeners = new Set<() => void>();

  function emit(save: boolean): void {
    if (save) saveAll(open);
    for (const fn of listeners) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  }
  function portal(node: ReactNode): ReactNode {
    if (node === null || node === undefined) return null;
    try {
      if (
        ReactDOM &&
        typeof ReactDOM.createPortal === 'function' &&
        typeof document !== 'undefined' &&
        document.body
      ) {
        return ReactDOM.createPortal(node, document.body);
      }
    } catch {
      /* ignore */
    }
    return node;
  }

  /** 点击/交互浮窗时置顶（最新者 z 最高） */
  function raise(id: string): void {
    const i = order.indexOf(id);
    if (i < 0 || i === order.length - 1) return;
    order = order.filter((x) => x !== id).concat(id);
    emit(false);
  }
  function zOf(id: string): number {
    const i = order.indexOf(id);
    return 300 + (i < 0 ? 0 : i);
  }

  function useWidgets(): OpenWidget[] {
    const [, force] = useReducer((x: number) => x + 1, 0);
    useEffect(() => {
      const fn = (): void => force();
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    }, []);
    // 宿主模式：开合状态在框架那边（还要管最小化/锁定/刷新恢复），问它
    if (service !== null) return bridgedOpenList();
    return Object.keys(open).map((id) => ({
      id,
      pos: (open as Record<string, WidgetPlacement>)[id] as WidgetPlacement,
    }));
  }

  function isOpen(id: string): boolean {
    if (service !== null) {
      const wkId = wkOf.get(id);
      if (wkId === undefined) return false;
      try {
        return service.isOpen(wkId);
      } catch {
        return false;
      }
    }
    return Object.hasOwn(open, id);
  }
  function openWidget(id: string, at?: WidgetPlacement): void {
    if (service !== null) {
      ensureRegistered(id);
      const wkId = wkOf.get(id);
      if (wkId === undefined) return;
      try {
        service.open(wkId);
      } catch (error) {
        console.error('[dshp-token-meter] 打开小组件失败：' + id, error);
      }
      return;
    }
    const pos = clampPos(
      at || (open[id] as WidgetPlacement | undefined) || cascadePos(Object.keys(open).length),
    );
    open = Object.assign({}, open, { [id]: pos });
    order = order.filter((x) => x !== id).concat(id); // 新开/移动都置顶
    emit(true);
  }
  /** 按前缀丢弃浮窗记录（组件被移除后用它清理遗留项）。
   * 宿主模式下「记录」在框架那边（而且框架刻意不因注销删布局），所以只能注销描述符。 */
  function forget(prefix: string): void {
    if (service !== null) {
      for (const legacy of Array.from(disposersOf.keys())) {
        if (legacy.startsWith(prefix)) forgetFloat(legacy);
      }
      return;
    }
    const next = Object.assign({}, open as Record<string, WidgetPlacement>);
    let changed = false;
    for (const id of Object.keys(next)) {
      if (!id.startsWith(prefix)) continue;
      delete next[id];
      order = order.filter((x) => x !== id);
      changed = true;
    }
    if (!changed) return;
    open = next;
    emit(true);
  }
  function closeWidget(id: string): void {
    if (service !== null) {
      const wkId = wkOf.get(id);
      if (wkId === undefined) return;
      try {
        service.close(wkId);
      } catch (error) {
        console.error('[dshp-token-meter] 关闭小组件失败：' + id, error);
      }
      return;
    }
    if (!Object.hasOwn(open, id)) return;
    const next = Object.assign({}, open);
    delete next[id];
    open = next;
    order = order.filter((x) => x !== id);
    emit(true);
  }
  function moveWidget(id: string, pos: WidgetPlacement): void {
    if (!Object.hasOwn(open, id)) return;
    open = Object.assign({}, open, { [id]: clampPos(pos) });
    emit(false);
  }
  function commitWidget(): void {
    emit(true);
  }

  /** 窗口缩放后钳制回视口（浮窗不丢失） */
  function clampAllToViewport(): void {
    let changed = false;
    const next = Object.assign({}, open);
    for (const id of Object.keys(next)) {
      const c = clampPos(next[id] as WidgetPlacement);
      if (c.x !== (next[id] as WidgetPlacement).x || c.y !== (next[id] as WidgetPlacement).y) {
        next[id] = c;
        changed = true;
      }
    }
    if (changed) {
      open = next;
      emit(true);
    }
  }

  /** 抓手：点按=弹出浮窗；按住拖动超 8px=直接拖出并跟随鼠标。
   * 拖拽保持“按下时鼠标在卡片内的偏移”——浮窗左上角 = 指针 − 锚点偏移，
   * 不会因为固定偏移而瞬移。已浮出的抓手直接转为浮窗拖拽（同样保偏移）。 */
  function gripOut(id: string, e: any): void {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    // 已浮出：交给 startDrag（保持抓取偏移，平滑移动）
    if (Object.hasOwn(open, id)) {
      startDrag(id, (open as Record<string, WidgetPlacement>)[id] as WidgetPlacement, e, true);
      return;
    }
    const sx = e.clientX;
    const sy = e.clientY;
    // 锚点偏移：指针相对原始卡片左上角（浮窗内容与卡片一致，这样拖出后抓取点不会跳）
    let ox = -60,
      oy = -20;
    try {
      const t = e.target;
      if (t && t.closest) {
        const card = t.closest('[data-tm-widget], .' + styles.card + ', .' + styles.today);
        if (card) {
          const r = (card as HTMLElement).getBoundingClientRect();
          ox = e.clientX - r.left;
          oy = e.clientY - r.top;
        }
      }
    } catch {
      /* ignore */
    }
    let out = false;
    function mv(ev: any): void {
      if (!out && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
      out = true;
      openWidget(id, { x: ev.clientX - ox, y: ev.clientY - oy });
    }
    function up(): void {
      try {
        window.removeEventListener('pointermove', mv);
      } catch {
        /* ignore */
      }
      try {
        window.removeEventListener('pointerup', up);
      } catch {
        /* ignore */
      }
      if (!out) openWidget(id);
    }
    try {
      window.addEventListener('pointermove', mv);
    } catch {
      /* ignore */
    }
    try {
      window.addEventListener('pointerup', up);
    } catch {
      /* ignore */
    }
  }
  function gripProps(id: string): { onPointerDown: (e: any) => void } {
    return { onPointerDown: (e: any) => gripOut(id, e) };
  }

  /** 浮窗拖动（整卡可拖）：交互元素上按下不触发；fromGrip=true 时忽略 .tm-grip 自身的跳过（抓手主动发起）。 */
  function startDrag(id: string, cur: WidgetPlacement, e: any, fromGrip?: boolean): void {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target && e.target.closest) {
      const skip =
        e.target.closest(
          'button, input, select, textarea, a, .' +
            styles.seg +
            ', .' +
            styles.modelchip +
            ', .' +
            styles.switch,
        ) ||
        (!fromGrip && e.target.closest('.' + styles.grip));
      if (skip) return;
    }
    if (e.preventDefault) e.preventDefault();
    const ox = e.clientX - cur.x;
    const oy = e.clientY - cur.y;
    function mv(ev: any): void {
      moveWidget(id, { x: ev.clientX - ox, y: ev.clientY - oy });
    }
    function up(): void {
      try {
        window.removeEventListener('pointermove', mv);
      } catch {
        /* ignore */
      }
      try {
        window.removeEventListener('pointerup', up);
      } catch {
        /* ignore */
      }
      commitWidget();
    }
    try {
      window.addEventListener('pointermove', mv);
    } catch {
      /* ignore */
    }
    try {
      window.addEventListener('pointerup', up);
    } catch {
      /* ignore */
    }
  }

  /** 通用浮窗外壳：只做定位（fixed + 坐标），不带任何边框/背景/内边距/阴影。
   * 组件自身的卡片样式即浮窗样式 —— 浮出前后视觉完全一致，原位置由调用方隐藏。
   * 拖动：卡片内任意非交互区域按住即可拖（抓手 ⠿ 同样有效）。
   *
   * 宿主模式下**恒为 `null`**：窗口（定位、拖拽、缩放、最小化、锁定）全部由 widget-kit 负责，
   * 内容由注册时给的 `content.render` 提供，`WidgetFloatLayer` 也不会被渲染。 */
  function WidgetFloat(props: { id: string; children?: ReactNode }): ReactNode {
    const list = useWidgets();
    const cur = service === null ? list.filter((w) => w.id === props.id)[0] : undefined;
    // 窗口缩放时把坐标钳制回视口（hook 必须在早退前声明）
    useEffect(() => {
      const onR = (): void => {
        const p = (open as Record<string, WidgetPlacement>)[props.id];
        if (!p) return;
        const c = clampPos(p);
        if (c.x !== p.x || c.y !== p.y) moveWidget(props.id, c);
      };
      window.addEventListener('resize', onR);
      return () => window.removeEventListener('resize', onR);
    }, [props.id]);
    if (!cur) return null;
    return portal(
      <div
        className={styles.widgetFloat + ' ' + styles.in}
        style={{
          left: cur.pos.x + 'px',
          top: cur.pos.y + 'px',
          width: FLOAT_W + 'px',
          zIndex: zOf(props.id),
        }}
        onPointerDown={(e: any) => {
          raise(props.id); // 交互即置顶
          const t = e.target;
          if (
            t &&
            t.closest &&
            t.closest(
              'button, input, select, textarea, a, .' +
                styles.grip +
                ', .' +
                styles.seg +
                ', .' +
                styles.modelchip +
                ', .' +
                styles.switch,
            )
          )
            return;
          startDrag(props.id, cur.pos, e);
        }}
      >
        {props.children}
      </div>,
    );
  }

  /**
   * 小组件开关按钮：原位显示「⧉」弹出，浮出后同一位置显示「回归」。
   *
   * 两种模式下的交互不同，是因为窗口的归属不同：
   *  - 自带浮层：抓手 ⠿ 按住可把卡片**拖出**（`gripProps`），点按直接弹出；
   *  - 宿主模式：没有「从锚点拖出一个窗口」这种 API，卡片出现在框架给的位置、由框架拖拽，
   *    所以只留一个开合按钮（拖出没有意义，会给「拖了却什么都没发生」的错觉）。
   */
  function WidgetToggle(props: { id: string; name?: string | undefined }): ReactNode {
    const list = useWidgets();
    const opened = service === null ? list.some((w) => w.id === props.id) : isOpen(props.id);
    /** 抓手/按钮的文案里带上目标卡片名 —— 避免"抓手挂在这张卡上、弹出的却是另一张"的困惑 */
    const what = props.name ? '「' + props.name + '」' : '本卡片';
    if (service !== null) {
      return (
        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center', marginLeft: 6, flex: 'none' }}>
          {opened ? (
            <button
              className={styles.minibtn}
              title={'把 ' + what + ' 收回原位（关闭小组件卡片）'}
              onClick={() => closeWidget(props.id)}
            >
              {'回归'}
            </button>
          ) : (
            <button
              className={styles.minibtn}
              title={'弹出 ' + what + ' 为独立卡片（可拖动 / 缩放 / 最小化）'}
              onClick={() => {
                // 顺手把标题提示带上：万一 syncFloatWidgets 还没跑（供应商刚加），
                // 卡片标题也能用上人话而不是供应商 id
                ensureRegistered(props.id, props.name);
                openWidget(props.id);
              }}
            >
              {'⧉'}
            </button>
          )}
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center', marginLeft: 6, flex: 'none' }}>
        <span
          className={styles.grip}
          title={
            opened ? what + ' 已弹出为独立浮窗（可拖动）' : '按住拖出 ' + what + ' 为独立浮窗，点按直接弹出'
          }
          aria-label={'拖动或弹出 ' + what}
          {...gripProps(props.id)}
        >
          {'⠿'}
        </span>
        {opened ? (
          <button
            className={styles.minibtn}
            title={'把 ' + what + ' 收回原位（关闭浮窗）'}
            onClick={() => closeWidget(props.id)}
          >
            {'回归'}
          </button>
        ) : (
          <button
            className={styles.minibtn}
            title={'弹出 ' + what + ' 为独立浮窗'}
            onClick={() => openWidget(props.id)}
          >
            {'⧉'}
          </button>
        )}
      </span>
    );
  }

  /**
   * 挂上宿主服务。
   *
   * 只做「记住服务 + 订阅注册表变化」：注册什么由 `syncRegistered()` 在拿到供应商列表后决定
   * （启动顺序是 attach → ensureLoad → sync，见 `index.tsx`）。
   *
   * @param candidate - `ctx.get('widgets')` 的返回值。
   * @returns 挂上（或本来就挂着）为 `true`；形状不对为 `false`（继续走自带浮层）。
   */
  function attach(candidate: unknown): boolean {
    const next = asService(candidate);
    if (next === null) return false;
    if (service === next) return true;
    if (service !== null) detach();
    service = next;
    try {
      // 框架那边任何变化（别的组件开合、用户关掉我们的卡片、设置里禁用）都要让本插件重渲染
      serviceOff = service.subscribe(() => {
        emit(false);
      });
    } catch (error) {
      serviceOff = null;
      console.error('[dshp-token-meter] 订阅宿主注册表失败（卡片开关状态可能不刷新）：', error);
    }
    emit(false);
    return true;
  }

  /**
   * 摘下宿主服务：注销本插件注册的全部卡片，回到自带浮层。
   *
   * @returns 无。
   */
  function detach(): void {
    if (serviceOff !== null) {
      try {
        serviceOff();
      } catch {
        /* ignore */
      }
      serviceOff = null;
    }
    for (const legacy of Array.from(disposersOf.keys())) {
      const dispose = disposersOf.get(legacy);
      if (dispose === undefined) continue;
      try {
        dispose();
      } catch {
        /* ignore */
      }
      wkOf.delete(legacy);
    }
    disposersOf.clear();
    legacyOf.clear();
    hints.clear();
    while (hostDisposers.length > 0) {
      const dispose = hostDisposers.pop();
      try {
        dispose?.();
      } catch {
        /* ignore */
      }
    }
    service = null;
    emit(false);
  }

  return {
    useWidgets,
    isOpen,
    openWidget,
    closeWidget,
    forget,
    moveWidget,
    commitWidget,
    gripProps,
    WidgetFloat,
    WidgetToggle,
    raise,
    zOf,
    clampAllToViewport,
    isBridged: () => service !== null,
    setContentRenderer: (render) => {
      contentRenderer = render;
    },
    syncRegistered,
    attach,
    detach,
    registerHost: (descriptor) => {
      if (service === null) return false;
      try {
        hostDisposers.push(service.register(descriptor));
        return true;
      } catch (error) {
        console.error('[dshp-token-meter] 注册宿主小组件失败：' + descriptor.id, error);
        return false;
      }
    },
    listFloats: () =>
      Array.from(disposersOf.keys()).map((legacy) => ({
        id: legacy,
        title: floatTitle(legacy, hints.get(legacy)),
      })),
  };
}
