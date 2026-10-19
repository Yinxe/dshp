/**
 * 组件运行时 —— 注册表 + 布局状态 + 全部动作（无 React）
 *
 * 这里是框架的心脏：托盘与卡片层都只从它的快照里读，所有变更都走这里的方法，
 * 于是「单开语义 / z 序 / 会话绑定 / 夹紧 / 卸载清理 / 尺寸回环防护」只有一份实现。
 *
 * 两档快照：
 *  - **layout 快照**：离散动作（注册、开关、最小化、落盘）后重建；
 *  - **live 快照**：拖拽/缩放**每帧**只更新当前那一张卡的矩形，只通知订阅了它的人 ——
 *    这样 60fps 的拖动不会带着托盘和其他卡一起重渲染。
 *
 * @module @dshp/widget-kit/client/service
 */
import { FRAMEWORK_VERSION, SPEC_DEFAULTS, SPEC_VERSION, normalizeDescriptor } from './spec.js';
import {
  applyResize,
  bringToFront,
  capsuleWidth,
  clampRect,
  contentBox,
  containRect,
  defaultRect,
  isSameRect,
  snapRect,
  sizeClassOf,
} from './geometry.js';
import type { Rect, RectConstraints, ResizeDir, Size, SizeClass, Viewport } from './geometry.js';
import {
  createDebouncedSaver,
  clearState,
  emptyState,
  loadState,
  moveInOrder,
  pruneId,
  setDisabledInList,
  setHiddenInList,
} from './store.js';
import type { CardState, DebouncedSaver, PersistedState, StorageLike } from './store.js';
import type { FrameworkConfig } from './types.js';
import type { NormalizedWidget, WidgetBadge, WidgetDescriptor, WidgetSummary } from './spec.js';

/**
 * 拖拽/缩放期间挂起来的活动几何。
 *
 * `rect` 是**自由跟手**的位置（卡片就渲染在这里，允许与其它卡片互相覆盖）；
 * `snap` 是同时算出来的**吸附候选**（松手才会采用，拖动期间只画一个预览虚框）。
 */
export interface LiveGeometry {
  id: string;
  rect: Rect;
  mode: 'move' | ResizeDir;
  snap: Rect | null;
}

/** 托盘与卡片层消费的完整快照（`useSyncExternalStore` 的 getSnapshot 返回它）。 */
export interface FrameworkSnapshot {
  /** 框架偏好是否已从宿主拿到（首帧不渲染托盘，避免按默认值闪一下布局）。 */
  ready: boolean;
  /** localStorage 不可用（隐私模式 / 配额满）—— 功能照常，只是不落盘。 */
  degraded: boolean;
  widgets: readonly NormalizedWidget[];
  layout: PersistedState;
  /**
   * **临时层**（`persistent !== true` 的 popover：悬停速览、点开的一次性小菜单）。
   *
   * 这一层自己单开；它与常驻层**互不干扰** —— 悬停展开一个速览不会把常驻面板收起来。
   * 只存在内存里：悬停速览/临时菜单不是「固定生效」的状态，刷新后不恢复。
   */
  transientId: string | null;
  /** 它是被点开的还是被悬停打开的（决定移开指针要不要自动收起）。 */
  transientOrigin: 'click' | 'hover' | null;
  /**
   * **常驻层**（`persistent: true` 的 popover）：**手风琴**语义 —— 同时最多只有一个，
   * 展开另一个常驻面板会先收起上一个。记在本机布局里，刷新后原地恢复。
   */
  pinnedId: string | null;
  /** 常驻面板的打开方式（`hover` + `persistent` 也不会因指针移开而收起）。 */
  pinnedOrigin: 'click' | 'hover' | null;
  /** 卡片层自下而上的顺序，末尾 = 最上。 */
  zOrder: readonly string[];
  badges: Readonly<Record<string, WidgetBadge | null>>;
  prefs: FrameworkConfig;
}

export interface WidgetRuntime {
  readonly specVersion: number;
  readonly frameworkVersion: string;

  // ── 公开服务（提供给其它插件的 facade 就是这几个） ──
  register<D>(descriptor: WidgetDescriptor<D>): () => void;
  list(): readonly WidgetSummary[];
  subscribe(listener: () => void): () => void;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  minimize(id: string): void;
  restore(id: string): void;
  /** 启用 / 禁用（禁用 = 图标、卡片、内容面、徽标全部停用；状态记在本机布局里）。 */
  setEnabled(id: string, enabled: boolean): void;
  isEnabled(id: string): boolean;
  /** 锁定 / 解锁位置（锁定后不可拖动、不可缩放，仍可最小化与关闭）。 */
  setLocked(id: string, locked: boolean): void;
  isLocked(id: string): boolean;

  // ── UI 内部 ──
  getSnapshot(): FrameworkSnapshot;
  subscribeLive(listener: () => void): () => void;
  getLive(): LiveGeometry | null;
  /** 只关心「我自己是不是正在被拖」的订阅者用它：别的卡片永远拿到 `null`（引用稳定，不触发重渲染）。 */
  getLiveFor(id: string): LiveGeometry | null;
  /**
   * 当前吸附预览（拖动期间画虚框用；没有候选时为 `null`）。
   *
   * **引用必须稳定**：候选没变时返回同一个对象 —— `useSyncExternalStore` 每次渲染都会调用它，
   * 每次新建对象会被判定成「外部数据变了」，直接掉进无限渲染（React error #185）。
   */
  getLiveSnap(): { id: string; rect: Rect } | null;
  beginLive(id: string, mode: 'move' | ResizeDir): void;
  setLive(id: string, rect: Rect): void;
  commitLive(id: string): void;
  cancelLive(): void;
  raise(id: string): void;
  toggleMinimize(id: string): void;
  nudge(id: string, dx: number, dy: number): void;
  nudgeResize(id: string, dw: number, dh: number): void;
  requestSize(id: string, next: { w?: number | undefined; h?: number | undefined }): void;
  /** 框架自己改尺寸（菜单预设 / 恢复默认）：不受内容回环防护限制。 */
  resizeTo(id: string, next: { w?: number | undefined; h?: number | undefined }): void;
  /**
   * 卡片**看起来**占的那块矩形：最小化时是那枚胶囊的实际尺寸（由 Card 量出来的标题宽度算出来），
   * 否则就是布局里存的矩形。拖动起点、键盘移动、吸附对象、视口夹紧都用它 ——
   * 但布局里存的 `w/h`（展开尺寸）不动，还原时原样回来。
   */
  visualRectOf(id: string): Rect;
  /**
   * 最小化胶囊的宽度（px）：装得下标题与控件，并夹在 `[地板, storedWidth]` 之间 ——
   * **不是固定压到某个宽度**，标题才不会被挤成省略号（见 `docs/widget-spec.md` §5.1）。
   * `Card` 渲染胶囊与运行时算几何都走它，两边永远同一个数。
   */
  capsuleWidthOf(widget: NormalizedWidget, storedWidth: number): number;
  /**
   * `Card` 量到「胶囊需要多宽」之后回报（px，量的是整条标题栏的自然宽度，见 `src/client/measure.ts`）。
   * 只影响最小化胶囊的宽度；量不到时不必调用 —— 胶囊退化成地板宽度。
   */
  reportCapsuleNeed(id: string, width: number): void;
  /** 在视口里居中（菜单「居中」）。 */
  center(id: string): void;
  sizeClassOf(widget: NormalizedWidget, rect: Rect): SizeClass;
  contentSize(rect: Rect): { width: number; height: number };
  rectOf(id: string): Rect;
  constraintsOf(widget: NormalizedWidget): RectConstraints;
  viewport(): Viewport;
  setViewport(next: Viewport): void;
  setSession(sessionId: string | null): void;
  getSession(): string | null;
  setAnchor(id: string, el: HTMLElement | null): void;
  getAnchor(id: string): HTMLElement | null;
  setBadge(id: string, badge: WidgetBadge | null): void;
  setTrayOrder(id: string, delta: number): void;
  /** 直接落一个完整顺序（托盘拖拽排序的结果）。 */
  setOrder(order: readonly string[]): void;
  /** 重置托盘顺序与隐藏集合（溢出菜单里的一项）。 */
  resetTrayLayout(): void;
  setHidden(id: string, hidden: boolean): void;
  setPrefs(
    patch: Partial<FrameworkConfig>,
    options?: { save?: boolean },
  ): Promise<{ ok: boolean; error?: string }>;
  /** 宿主偏好到达后调一次：填偏好 + 标记 ready（首个快照才算正式）。 */
  applyPrefs(prefs: FrameworkConfig): void;
  /** 启动一段时间后清理「在册但从未注册」的历史残留（卸载过的插件留下的卡片/顺序项）。 */
  pruneOrphans(): number;
  resetLocal(): boolean;
  saveNow(): void;
  /** 挂一个周期任务（由 `ctx.interval` 注入；未注入时退回原生 setInterval）。 */
  scheduleInterval(callback: () => void, ms: number): () => void;
  /** 挂一个延时任务（由 `ctx.timeout` 注入；未注入时退回原生 setTimeout）。 */
  scheduleTimeout(callback: () => void, ms: number): () => void;
  /**
   * 指针进入某个组件图标（`trigger: 'hover'` 才展开，按 `hoverOpenDelayMs` 延迟）。
   * popover 面板自己的 `pointerenter` 也调它 —— 用来撤销「待收起」。
   */
  hoverEnter(id: string): void;
  /** 指针离开图标或面板（`trigger: 'hover'` 且当前是悬停打开的才收起，按 `hoverCloseDelayMs` 宽限）。 */
  hoverLeave(id: string): void;
}

export interface RuntimeDeps {
  prefs: FrameworkConfig;
  storage: StorageLike | null;
  viewport: Viewport;
  /** 写偏好回宿主（settings.yaml）；不要它时 `setPrefs` 只改内存。 */
  savePrefs?: (prefs: FrameworkConfig) => Promise<{ ok: boolean; error?: string }>;
  /** 周期任务（`ctx.interval`）；缺省用原生 setInterval。 */
  interval?: (callback: () => void, ms: number) => () => void;
  /** 延时任务（`ctx.timeout`）；缺省用原生 setTimeout。 */
  timeout?: (callback: () => void, ms: number) => () => void;
  /** 用户可见的提示（超上限自动最小化、组件卸载清理…）。 */
  onNotice?: (message: string) => void;
  onError?: (message: string, error?: unknown) => void;
}

function defaultConstraints(): RectConstraints {
  return { min: SPEC_DEFAULTS.cardFloorSize, max: null };
}

/**
 * 造一个运行时。**不碰任何全局**：storage / viewport / 宿主回调全部由调用方注入。
 */
export function createWidgetRuntime(deps: RuntimeDeps): WidgetRuntime {
  const registry = new Map<string, NormalizedWidget>();
  const anchors = new Map<string, HTMLElement | null>();
  /**
   * 各卡片**量出来的胶囊所需宽度**（px，由 `Card` 量整条标题栏的自然宽度后回报）。
   *
   * 这是「最小化胶囊宽度自适应」的唯一输入：胶囊宽度 = clamp(它, 地板, 布局宽度) —— 见
   * `geometry.capsuleWidth`。**不在这里做任何「内边距 + 标题 + 按钮」的加法**：那种算法只要有一处
   * 常量与真实排版不一致就会偏窄，而偏窄的表现正是「折叠后标题被省略号截掉」。
   * 只存内存、不落盘：它是渲染的产物，不是用户的布局。
   */
  const capsuleNeeds = new Map<string, number>();
  /** 上一次「真挂上」的锚点元素：用来区分「新挂载」与「同一次 commit 里的 detach + attach」。 */
  const lastAnchors = new Map<string, HTMLElement>();

  const badges: Record<string, WidgetBadge | null> = {};
  /** 尺寸回环防护：每个组件的请求时间戳与「已冻结」标记。 */
  const sizeCalls = new Map<string, number[]>();
  const sizeFrozen = new Set<string>();

  let prefs: FrameworkConfig = { ...deps.prefs };
  let viewport: Viewport = { ...deps.viewport };
  /** 临时层（悬停速览 / 一次性菜单）：只在内存里。 */
  let transientId: string | null = null;
  let transientOrigin: 'click' | 'hover' | null = null;
  /** `null` = 还没拿到会话（首帧）；首个真实会话**不算切换**，见 `setSession`。 */
  let sessionId: string | null = null;
  /** 悬停展开/收起用的挂起定时器（按组件 id 存取消函数）。 */
  const hoverTimers = new Map<string, () => void>();
  let live: LiveGeometry | null = null;
  /** `getLiveSnap()` 的返回值：只有吸附候选真的变了才换新对象（见 `setLiveState`）。 */
  let liveSnapView: { id: string; rect: Rect } | null = null;

  const listeners = new Set<() => void>();
  const liveListeners = new Set<() => void>();

  const constraintsFor = (widget: NormalizedWidget): RectConstraints => {
    const floor = SPEC_DEFAULTS.cardFloorSize;
    const min = widget.card?.minSize ?? floor;
    return { min, max: widget.card?.maxSize ?? null };
  };

  /** 吸附参数（数字只在 spec.ts 的 SPEC_DEFAULTS 里写一遍）。 */
  function snapOptions(): { gap: number; distance: number } {
    return { gap: SPEC_DEFAULTS.snapGap, distance: SPEC_DEFAULTS.snapDistance };
  }

  /**
   * 屏幕上真正占位的其它卡片（不含自己）。
   *
   * 两个过滤条件都是必需的：最小化的只留一条标题栏（不作为吸附对象）；
   * **不在册的不算** —— 卸载/热重载后布局记录会留着（见 register 的 disposer），
   * 但它此刻并没有渲染出来，不能当成吸附对象或障碍。
   */
  function othersOf(exceptId: string): Rect[] {
    const out: Rect[] = [];
    for (const [id, card] of Object.entries(state.cards)) {
      if (id === exceptId || !card.open || card.minimized) continue;
      if (!registry.has(id)) continue;
      // 最小化的卡片是一枚小胶囊：按它**看起来**的尺寸参与吸附，而不是展开尺寸
      const size = card.minimized ? collapsedSize(id) : { w: card.w, h: card.h };
      out.push({ x: card.x, y: card.y, w: size.w, h: size.h });
    }
    return out;
  }

  // 启动时**宽松**读盘：此刻注册表还是空的（各插件的 client 半随后才注册），按 id 过滤会把
  // 整份布局清空。残留由启动后的 pruneOrphans() 负责清理。
  const initial = loadState(deps.storage, {
    isKnown: () => true,
    constraintsOf: () => defaultConstraints(),
    viewport,
    clampRect,
  });

  let state: PersistedState = initial.state;
  let degraded = initial.degraded;
  if (degraded && deps.storage !== null) {
    deps.onError?.('[dshp-widget-kit] 本机布局存储不可用，本次布局只存在于内存里');
  }

  const saver: DebouncedSaver = createDebouncedSaver(deps.storage, undefined, () => {
    degraded = true;
    deps.onError?.('[dshp-widget-kit] 写入本机布局失败（配额或隐私模式），后续改动只留在内存');
  });

  let snapshot: FrameworkSnapshot = {
    ready: false,
    degraded,
    widgets: [],
    layout: state,
    // 刷新即恢复：上次展开的面板与卡片层叠顺序都从本机布局里读回来（见 docs/widget-spec.md §7）
    // 常驻面板刷新即恢复；临时面板（悬停速览 / 一次性菜单）不恢复
    transientId: null,
    transientOrigin: null,
    pinnedId: state.popoverId,
    pinnedOrigin: state.popoverOrigin,
    zOrder: [...state.zOrder],
    badges,
    prefs,
  };

  // ── 快照与通知 ────────────────────────────────────────────────────────

  function sortedWidgets(): NormalizedWidget[] {
    const all = [...registry.values()];
    all.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return all;
  }

  function publish(): void {
    snapshot = {
      ready: snapshot.ready,
      degraded,
      widgets: sortedWidgets(),
      layout: state,
      transientId,
      transientOrigin,
      pinnedId: state.popoverId,
      pinnedOrigin: state.popoverOrigin,
      zOrder: [...state.zOrder],
      badges: { ...badges },
      prefs,
    };
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        deps.onError?.('[dshp-widget-kit] 订阅者回调抛错（已隔离）', error);
      }
    }
  }

  function notifyLive(): void {
    for (const listener of liveListeners) {
      try {
        listener();
      } catch (error) {
        deps.onError?.('[dshp-widget-kit] live 订阅者回调抛错（已隔离）', error);
      }
    }
  }

  function persist(): void {
    saver.schedule(state);
  }

  // ── state 里的两处「非卡片」布局：内容面目标与层叠顺序 ────────────────
  // 放在 state 里（而不是局部变量）就是为了刷新后原地恢复。

  /** 常驻层（写本机布局，刷新后恢复）。 */
  function setPinnedTarget(id: string | null, origin: 'click' | 'hover' | null): void {
    if (state.popoverId === id && state.popoverOrigin === origin) return;
    state = { ...state, popoverId: id, popoverOrigin: origin };
    persist();
  }

  /** 临时层（不落盘）。 */
  function setTransientTarget(id: string | null, origin: 'click' | 'hover' | null): void {
    if (transientId === id && transientOrigin === origin) return;
    transientId = id;
    transientOrigin = origin;
  }

  /** 这个 popover 属于哪一层：常驻声明决定一切。 */
  function channelOf(widget: NormalizedWidget): 'pinned' | 'transient' {
    return widget.popover?.persistent === true ? 'pinned' : 'transient';
  }

  /** 这个 id 现在是不是某一层的展开目标。 */
  function isOpenId(id: string): boolean {
    return transientId === id || state.popoverId === id;
  }

  function setZOrder(next: readonly string[], persistNow: boolean): void {
    const unchanged =
      next.length === state.zOrder.length && next.every((id, index) => state.zOrder[index] === id);
    if (unchanged) return;
    state = { ...state, zOrder: [...next] };
    if (persistNow) persist();
  }

  function scheduleTimeout(callback: () => void, ms: number): () => void {
    if (deps.timeout !== undefined) return deps.timeout(callback, ms);
    const handle = setTimeout(callback, ms);
    return () => {
      clearTimeout(handle);
    };
  }

  // ── 几何辅助 ──────────────────────────────────────────────────────────

  /** 真正占着屏幕的卡片数（`open` 但已最小化的不算；不在册的残留记录不算）。 */
  function visibleCardCount(): number {
    let count = 0;
    for (const [id, card] of Object.entries(state.cards)) {
      if (!card.open || card.minimized) continue;
      if (!registry.has(id)) continue;
      count += 1;
    }
    return count;
  }

  /** 有记录的在册卡片数：层叠落点的「第几张」用它算。残留记录（卸载后留着的）不算。 */
  function trackedCardCount(): number {
    let count = 0;
    for (const id of Object.keys(state.cards)) {
      if (registry.has(id)) count += 1;
    }
    return count;
  }

  function makeCardState(widget: NormalizedWidget, index: number): CardState {
    const constraints = constraintsFor(widget);
    const wanted: Size = widget.card?.defaultSize ?? SPEC_DEFAULTS.cardDefaultSize;
    // 层叠落点：新卡依次往左下错开一点，**允许与已有卡片重叠**（谁在上由 z 序说了算）。
    const rect = defaultRect(index, wanted, constraints, viewport);
    return { ...rect, minimized: false, open: false, locked: false };
  }

  function cardStateOf(widget: NormalizedWidget): CardState {
    const existing = state.cards[widget.id];
    if (existing !== undefined) return existing;
    return makeCardState(widget, trackedCardCount());
  }

  function writeCard(id: string, next: CardState, persistNow: boolean): void {
    state = { ...state, cards: { ...state.cards, [id]: next } };
    if (persistNow) persist();
    publish();
  }

  /** 同屏卡片超上限：把最旧的一张（z 序最底、开着、未最小化）收起来。 */
  function enforceCardLimit(exceptId: string): void {
    if (visibleCardCount() <= SPEC_DEFAULTS.maxOpenCards) return;
    for (const id of state.zOrder) {
      if (id === exceptId || !registry.has(id)) continue;
      const card = state.cards[id];
      if (card === undefined || !card.open || card.minimized) continue;
      writeCard(id, { ...card, minimized: true }, false);
      deps.onNotice?.(`同屏卡片超过 ${String(SPEC_DEFAULTS.maxOpenCards)} 张，已自动最小化「${id}」`);
      return;
    }
  }

  function raiseOrder(id: string): void {
    setZOrder(bringToFront(state.zOrder, id), true);
  }

  function widgetOf(id: string): NormalizedWidget | undefined {
    return registry.get(id);
  }

  // ── 公开动作 ──────────────────────────────────────────────────────────

  function register<D>(raw: WidgetDescriptor<D>): () => void {
    const value = normalizeDescriptor(raw, FRAMEWORK_VERSION);
    // 同 id 再次注册 = 覆盖（HMR / 重复 apply / 同插件重注册都走这条）。
    // 注意：owner 是从 id 前缀推出来的，框架无法验证调用者身份 —— 两个插件若声明同一个 id，
    // 后注册者胜。这条限制写在 docs/widget-spec.md 的「已知边界」里。
    registry.set(value.id, value);
    // 覆盖注册时，历史展开目标可能已经不合法（呈现方式改了、常驻声明改了）—— 清掉，避免渲染出空面板
    if (state.popoverId === value.id && (value.presentation !== 'popover' || channelOf(value) !== 'pinned')) {
      state = { ...state, popoverId: null, popoverOrigin: null };
    }
    if (transientId === value.id && (value.presentation !== 'popover' || channelOf(value) === 'pinned')) {
      transientId = null;
      transientOrigin = null;
    }
    if (!state.tray.order.includes(value.id)) {
      state = { ...state, tray: { ...state.tray, order: [...state.tray.order, value.id] } };
      persist();
    }
    publish();

    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      registry.delete(value.id);
      cancelHoverTimer(value.id);
      if (live?.id === value.id) clearLive();
      if (transientId === value.id) {
        transientId = null;
        transientOrigin = null;
      }
      delete badges[value.id];
      // 量出来的宽度是渲染的派生值：组件不在了就丢掉。**重新注册必须有新的测量落地** ——
      // `Card` 的 effect 依赖里带着 `widget` 对象，同 id 重注册会拿到新对象、重新量一次；
      // 早先版本只依赖 `widget.id`，于是「卸载删掉 + 同 id 重注册不动 effect」= 卡片永远停在地板
      // 宽度上，标题被截成两个字（这就是「最小化后还是被压缩省略」的直接原因）。
      capsuleNeeds.delete(value.id);
      // **卸载不动本机布局**（这是刻意的）：插件热重载 / 暂时停用 / 开发中构建失败都会走到这里，
      // 早先版本在这条路径上 `pruneId` 把卡片、托盘顺序、隐藏/禁用、层叠顺序、内容面目标全删了 ——
      // 于是每改一次代码布局就被重置一次。记录按 id 保存，重新注册回来时原地恢复；
      // 真正卸载掉的插件留下的残留，由设置页的「清理已卸载组件的残留」显式清理（见 pruneOrphans）。
      publish();
      notifyLive();
    };
  }

  function list(): readonly WidgetSummary[] {
    return sortedWidgets().map((widget) => ({
      id: widget.id,
      title: typeof widget.title === 'function' ? widget.title() : widget.title,
      owner: widget.owner,
      presentation: widget.presentation,
      listedInBox: widget.listedInBox,
    }));
  }

  function cancelHoverTimer(id: string): void {
    const cancel = hoverTimers.get(id);
    if (cancel === undefined) return;
    hoverTimers.delete(id);
    try {
      cancel();
    } catch {
      /* ignore */
    }
  }

  function cancelAllHoverTimers(): void {
    // 先取出再清空：cancel() 可能重入（取消回调里又调 hoverEnter），必须拿着快照迭代
    const pending = Array.from(hoverTimers.entries());
    hoverTimers.clear();
    for (const [, cancel] of pending) {
      try {
        cancel();
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * 展开一个 popover。
   *
   * 两个通道互不干扰：常驻层是**手风琴**（同时只有一个，展开另一个会收起上一个），
   * 临时层（悬停速览 / 一次性菜单）自己单开，**不会动常驻面板**。
   */
  function showPopover(id: string, origin: 'click' | 'hover'): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'popover') return;
    if (!isEnabled(id)) return;
    if (channelOf(widget) === 'pinned') setPinnedTarget(id, origin);
    else setTransientTarget(id, origin);
    publish();
  }

  function hidePopover(id: string): void {
    cancelHoverTimer(id);
    if (transientId === id) {
      setTransientTarget(null, null);
      publish();
      return;
    }
    if (state.popoverId === id) {
      setPinnedTarget(null, null);
      publish();
    }
  }

  /**
   * 指针进入图标（或进入已展开的面板）。
   *
   * 只对 `trigger: 'hover'` 生效：延迟 `hoverOpenDelayMs` 后展开；已经开着的就直接取消待收起
   * （所以面板自己的 `pointerenter` 也调它），这样「图标 → 面板」的间隙不会闪断。
   */
  function hoverEnter(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'popover') return;
    if (!isEnabled(id)) return;
    const options = widget.popover;
    if (options === null || options.trigger !== 'hover') return;
    if (isOpenId(widget.id)) {
      cancelHoverTimer(id);
      return;
    }
    cancelHoverTimer(id);
    if (options.hoverOpenDelayMs <= 0) {
      showPopover(id, 'hover');
      return;
    }
    hoverTimers.set(
      id,
      scheduleTimeout(() => {
        hoverTimers.delete(id);
        const current = widgetOf(id);
        if (current === undefined || current.presentation !== 'popover') return;
        showPopover(id, 'hover');
      }, options.hoverOpenDelayMs),
    );
  }

  /** 指针离开图标或面板：只收起「悬停打开的」那个，并按 `hoverCloseDelayMs` 留宽限。 */
  function hoverLeave(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'popover') return;
    const options = widget.popover;
    if (options === null || options.trigger !== 'hover') return;
    cancelHoverTimer(id);
    // 常驻面板：指针移开也不收起（只有 ✕ / 再点图标 / Esc 能关）
    if (options.persistent) return;
    if (transientId !== widget.id || transientOrigin !== 'hover') return;
    if (options.hoverCloseDelayMs <= 0) {
      hidePopover(id);
      return;
    }
    hoverTimers.set(
      id,
      scheduleTimeout(() => {
        hoverTimers.delete(id);
        if (transientId === id && transientOrigin === 'hover') hidePopover(id);
      }, options.hoverCloseDelayMs),
    );
  }

  function open(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation === 'tray') return;
    if (!isEnabled(id)) return;
    if (widget.presentation === 'popover') {
      showPopover(id, 'click');
      return;
    }
    const existing = cardStateOf(widget);
    state = {
      ...state,
      cards: { ...state.cards, [id]: { ...existing, open: true, minimized: false } },
      lastOpenId: id,
    };
    raiseOrder(id);
    persist();
    enforceCardLimit(id);
    publish();
  }

  function close(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined) return;
    if (widget.presentation === 'popover') {
      hidePopover(id);
      return;
    }
    const existing = state.cards[id];
    if (existing === undefined) return;
    setZOrder(
      state.zOrder.filter((x) => x !== id),
      false,
    );
    state = { ...state, cards: { ...state.cards, [id]: { ...existing, open: false, minimized: false } } };
    persist();
    publish();
  }

  function minimize(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card' || widget.card?.minimizable === false) return;
    const existing = state.cards[id];
    if (existing === undefined || !existing.open || existing.minimized) return;
    writeCard(id, { ...existing, minimized: true }, true);
  }

  function restore(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card') return;
    const existing = state.cards[id];
    if (existing === undefined) return;
    raiseOrder(id);
    writeCard(id, { ...existing, open: true, minimized: false }, true);
  }

  function isOpen(id: string): boolean {
    const widget = widgetOf(id);
    if (widget === undefined || !isEnabled(id)) return false;
    if (widget.presentation === 'popover') return isOpenId(id);
    const card = state.cards[id];
    return card !== undefined && card.open;
  }

  function toggle(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation === 'tray') return;
    if (!isEnabled(id)) return;
    if (widget.presentation === 'popover') {
      if (isOpenId(id)) close(id);
      else open(id);
      return;
    }
    const card = state.cards[id];
    if (card === undefined || !card.open) {
      open(id);
      return;
    }
    if (card.minimized) {
      restore(id);
      return;
    }
    // 任务栏语义：点已经开在最前的卡片 = 最小化；点被压在下面的 = 提到最前
    if (state.zOrder[state.zOrder.length - 1] === id) minimize(id);
    else {
      raiseOrder(id);
      publish();
    }
  }

  function toggleMinimize(id: string): void {
    if (!isEnabled(id)) return;
    const card = state.cards[id];
    if (card === undefined) return;
    if (card.minimized) restore(id);
    else minimize(id);
  }

  // ── 启用 / 禁用（动态卸载）──────────────────────────────────────────────

  /**
   * 启用 / 禁用某个组件。
   *
   * 禁用 = 一次「软卸载」：图标从托盘消失、卡片与面板立刻收起、徽标清掉、内容面随之卸载
   * （React 不再渲染它，`load` 轮询随 effect 一起停），但**注册记录与本机布局保留** ——
   * 再次启用时卡片回到原来的位置、尺寸与锁定状态，不需要组件重新注册。
   */
  function setEnabled(id: string, enabled: boolean): void {
    if (widgetOf(id) === undefined) return;
    if (state.disabled.includes(id) === !enabled) return; // 已经是目标状态，不重复落盘
    const next = setDisabledInList(state.disabled, id, !enabled);
    cancelHoverTimer(id);
    setZOrder(
      state.zOrder.filter((x) => x !== id),
      false,
    );
    let cards = state.cards;
    const card = state.cards[id];
    if (!enabled && card !== undefined && (card.open || card.minimized)) {
      cards = { ...cards, [id]: { ...card, open: false, minimized: false } };
    }
    const wasPopover = state.popoverId === id;
    if (transientId === id) setTransientTarget(null, null);
    state = {
      ...state,
      cards,
      disabled: next,
      popoverId: wasPopover ? null : state.popoverId,
      popoverOrigin: wasPopover ? null : state.popoverOrigin,
    };
    if (!enabled) delete badges[id];
    if (live?.id === id) clearLive();
    persist();
    publish();
    notifyLive();
    deps.onNotice?.(
      enabled ? `组件「${id}」已启用` : `组件「${id}」已禁用：图标、卡片与面板一并停用（可随时重新启用）`,
    );
  }

  function isEnabled(id: string): boolean {
    return !state.disabled.includes(id);
  }

  // ── 锁定位置（不可移动 / 不可缩放，仍可最小化与关闭）──────────────────

  function setLocked(id: string, locked: boolean): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card') return;
    const existing = state.cards[id];
    if (existing !== undefined && existing.locked === locked) return;
    const base: CardState = existing ?? makeCardState(widget, trackedCardCount());
    if (locked && live?.id === id) {
      clearLive();
      notifyLive();
    }
    writeCard(id, { ...base, locked }, true);
  }

  function isLocked(id: string): boolean {
    return state.cards[id]?.locked === true;
  }

  // ── live 几何（拖拽/缩放每帧） ────────────────────────────────────────

  /**
   * 写入 live 状态，并顺手维护吸附预览的**稳定快照**。
   *
   * 为什么需要单独一份：`useSyncExternalStore` 每次渲染都会调 `getSnapshot()`，只要返回新对象
   * 就认为数据变了 —— 于是「每帧新建 `{ id, rect }`」会让虚框组件无限重渲染并把整个卡片层打挂
   * （React error #185，用户实机报过一次）。候选没变时这里必须复用同一个对象。
   */
  function setLiveState(next: LiveGeometry | null): void {
    const previous = live;
    live = next;
    if (next === null || next.snap === null) {
      liveSnapView = null;
    } else if (
      previous === null ||
      previous.snap === null ||
      previous.id !== next.id ||
      !isSameRect(previous.snap, next.snap)
    ) {
      liveSnapView = { id: next.id, rect: next.snap };
    }
    notifyLive();
  }

  /** 清掉 live（卸载 / 禁用 / 锁定 / 重置）：连同稳定快照一起，调用方负责 `notifyLive()`。 */
  function clearLive(): void {
    live = null;
    liveSnapView = null;
  }

  function beginLive(id: string, mode: 'move' | ResizeDir): void {
    if (widgetOf(id) === undefined) return;
    // 锁定 = 位置与尺寸都不可改：拖拽/缩放在入口就被挡住（键盘与菜单走 applyRect 的同一道锁）
    if (isLocked(id)) return;
    // 从「看起来的矩形」起步：最小化的卡片是一枚胶囊，拖动按胶囊尺寸算吸附与夹紧
    setLiveState({ id, rect: visualRectOf(id), mode, snap: null });
  }

  /**
   * 拖动/缩放中的一帧。
   *
   * 移动时同时算一份**吸附候选**：卡片本体按自由位置渲染（允许盖住别人），候选只画虚框；
   * 松手（`commitLive`）才决定用哪一个 —— 这就是「先给预览，用户松手才算同意」。
   * 候选没变时复用同一个对象引用，订阅者（虚框）因此不会每帧重渲染。
   */
  function setLive(id: string, rect: Rect): void {
    if (live === null || live.id !== id) return;
    const contained = containRect(rect, viewport);
    let snap: Rect | null = null;
    if (live.mode === 'move') {
      const candidate = snapRect(contained, othersOf(id), viewport, snapOptions());
      if (!isSameRect(candidate, contained)) {
        snap = live.snap !== null && isSameRect(live.snap, candidate) ? live.snap : candidate;
      }
    }
    if (isSameRect(live.rect, contained) && snap === live.snap) return;
    setLiveState({ id, rect: contained, mode: live.mode, snap });
  }

  function commitLive(id: string): void {
    if (live === null || live.id !== id) return;
    const widget = widgetOf(id);
    // 松手时如果吸附预览还在，就落到预览位置；否则落回自由位置（用户「不同意」吸附）
    const rect = live.snap ?? live.rect;
    setLiveState(null);
    if (widget === undefined || widget.presentation !== 'card') return;
    const existing = state.cards[id];
    // 还没有持久记录（理论上拖拽前一定 open 过，这里只做兜底）：直接把本次几何写进去，
    // 否则 base 是从 rect 现造的，isSameRect 必然为真，这一拖就白拖了。
    if (existing === undefined) {
      writeCard(id, { ...rect, minimized: false, open: true, locked: false }, true);
      return;
    }
    // 最小化期间拖的是胶囊：只取位置，布局里的展开尺寸保持不动
    const next: Rect = existing.minimized ? { ...rect, w: existing.w, h: existing.h } : rect;
    if (isSameRect(existing, next)) return;
    writeCard(id, { ...existing, ...next }, true);
  }

  function cancelLive(): void {
    if (live === null) return;
    setLiveState(null);
  }

  // ── 键盘与程序化几何 ──────────────────────────────────────────────────

  /**
   * 最小化时 `true`：这时候只允许改位置，`w/h` 必须保持布局里的展开尺寸。
   */
  function isCollapsed(id: string): boolean {
    return state.cards[id]?.minimized === true;
  }

  /**
   * `Card` 量到「胶囊需要多宽」之后回报（px，量的是整条标题栏的自然宽度）。
   *
   * 只影响**最小化胶囊**的宽度：展开态一个像素都不动，所以没最小化时不惊动订阅者。
   * 宽度不是「用户数据」，只存内存；组件卸载时连同记录一起删（见 `register` 的 disposer）。
   */
  function reportCapsuleNeed(id: string, width: number): void {
    if (!Number.isFinite(width) || width <= 0) return;
    const next = Math.round(width);
    if (capsuleNeeds.get(id) === next) return;
    capsuleNeeds.set(id, next);
    // 展开态下宽度不影响任何几何：不必 publish（那会让整层卡片白重渲染一次）
    if (isCollapsed(id)) publish();
  }

  /**
   * 最小化胶囊的宽度（px）：夹在 `[地板, 布局宽度]` 之间、装得下标题与控件的宽度。
   *
   * 与 `Card` 渲染时用的是**同一个算式**（都走 `geometry.capsuleWidth` 与同一份测量值），
   * 所以渲染与几何永远一致，不需要「先渲染、量出来、再回报尺寸」那条回路。
   * 布局里存的展开 `w/h` 一个字节都不动。
   */
  function capsuleWidthOf(widget: NormalizedWidget, storedWidth: number): number {
    return capsuleWidth({ stored: storedWidth, need: capsuleNeeds.get(widget.id) });
  }

  /**
   * 最小化胶囊的尺寸：宽 = `capsuleWidthOf`（装得下标题与控件，夹在布局宽度内），高 = 标题栏高度。
   *
   * 与 `Card` 渲染时用的**同一个算式**（两边都调 `capsuleWidthOf`）：渲染与几何因此永远一致，
   * 不需要「先渲染、量出来、再回报」那条回路（那条回路会在第一帧给出不一致的尺寸）。
   */
  function collapsedSize(id: string): Size {
    const card = state.cards[id];
    const stored = card?.w ?? SPEC_DEFAULTS.cardDefaultSize.w;
    const widget = widgetOf(id);
    return {
      w:
        widget === undefined
          ? Math.min(stored, SPEC_DEFAULTS.capsuleMinWidth)
          : capsuleWidthOf(widget, stored),
      h: SPEC_DEFAULTS.titleBarHeight,
    };
  }

  /** 卡片看起来占的矩形（见 `WidgetRuntime.visualRectOf`）。 */
  function visualRectOf(id: string): Rect {
    const rect = rectOf(id);
    if (!isCollapsed(id)) return rect;
    return { ...rect, ...collapsedSize(id) };
  }

  function rectOf(id: string): Rect {
    const widget = widgetOf(id);
    if (widget === undefined) {
      return {
        x: 0,
        y: 0,
        w: SPEC_DEFAULTS.cardDefaultSize.w,
        h: SPEC_DEFAULTS.cardDefaultSize.h,
      };
    }
    const card = cardStateOf(widget);
    return { x: card.x, y: card.y, w: card.w, h: card.h };
  }

  function applyRect(id: string, rect: Rect): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card') return;
    // 锁定后：键盘微调、尺寸预设、内容 setSize、居中全部无效（只有解锁或最小化/关闭能动它）
    if (isLocked(id)) return;
    const clamped = clampRect(rect, constraintsFor(widget), viewport);
    const existing = state.cards[id];
    const base: CardState = existing ?? { ...clamped, minimized: false, open: true, locked: false };
    if (isSameRect(base, clamped)) return;
    writeCard(id, { ...base, ...clamped }, true);
  }

  function nudge(id: string, dx: number, dy: number): void {
    const rect = rectOf(id);
    raiseOrder(id);
    // 键盘微调是「精确移动」：不吃磁力（吸附只服务指针拖拽），只做视口夹紧
    applyRect(id, { ...rect, x: rect.x + dx, y: rect.y + dy });
  }

  function nudgeResize(id: string, dw: number, dh: number): void {
    const widget = widgetOf(id);
    if (widget === undefined) return;
    applyRect(id, applyResize(rectOf(id), 'se', dw, dh, constraintsFor(widget), viewport));
  }

  /**
   * 组件自己要求改尺寸（`props.setSize`）。
   *
   * 回环防护：500ms 内超过 3 次就判定「内容按尺寸再反推尺寸」，记一次 console.error 并冻结该组件 ——
   * 这类回环会让界面以帧率抖动，必须在框架侧硬停，而不是指望每个组件都守规范。
   */
  function resizeTo(id: string, next: { w?: number | undefined; h?: number | undefined }): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card') return;
    const rect = rectOf(id);
    applyRect(id, { ...rect, w: next.w ?? rect.w, h: next.h ?? rect.h });
  }

  function center(id: string): void {
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card') return;
    const rect = rectOf(id);
    applyRect(id, {
      ...rect,
      x: Math.round((viewport.width - rect.w) / 2),
      y: Math.round((viewport.height - rect.h) / 2),
    });
  }

  function requestSize(id: string, next: { w?: number | undefined; h?: number | undefined }): void {
    if (sizeFrozen.has(id)) return;
    const widget = widgetOf(id);
    if (widget === undefined || widget.presentation !== 'card') return;
    const now = Date.now();
    const calls = (sizeCalls.get(id) ?? []).filter((t) => now - t < 500);
    calls.push(now);
    sizeCalls.set(id, calls);
    if (calls.length > 3) {
      sizeFrozen.add(id);
      deps.onError?.(
        `[dshp-widget-kit] 组件「${id}」在 500ms 内连续请求改尺寸（疑似尺寸回环），已冻结它的自动改尺寸。` +
          '请检查 content.render 是否根据本次 size 又调用了 setSize。',
      );
      return;
    }
    resizeTo(id, next);
  }

  function sizeClassFor(widget: NormalizedWidget, rect: Rect): SizeClass {
    const box = contentBox(rect);
    const breakpoints = widget.card?.breakpoints ?? SPEC_DEFAULTS.breakpoints;
    return sizeClassOf(box.width, breakpoints);
  }

  // ── 托盘顺序 / 隐藏 / 偏好 ────────────────────────────────────────────

  function setTrayOrder(id: string, delta: number): void {
    const next = moveInOrder(state.tray.order, id, delta);
    state = { ...state, tray: { ...state.tray, order: next } };
    persist();
    publish();
  }

  function setOrder(order: readonly string[]): void {
    const known = new Set(registry.keys());
    const next = order.filter((id) => known.has(id));
    for (const id of registry.keys()) {
      if (!next.includes(id)) next.push(id);
    }
    state = { ...state, tray: { ...state.tray, order: next } };
    persist();
    publish();
  }

  function resetTrayLayout(): void {
    state = {
      ...state,
      tray: { order: sortedWidgets().map((widget) => widget.id), hidden: [] },
    };
    persist();
    publish();
  }

  function setHidden(id: string, hidden: boolean): void {
    const next = setHiddenInList(state.tray.hidden, id, hidden);
    state = { ...state, tray: { ...state.tray, hidden: next } };
    persist();
    publish();
  }

  /**
   * 改偏好。
   *
   * `options.save === false` = **只本地预览**（滑块拖动时每帧调用它，不能每帧往宿主写一遍
   * settings.yaml）：快照立刻更新、界面即时反应，松手时再用 `save: true` 落盘一次。
   */
  async function setPrefs(
    patch: Partial<FrameworkConfig>,
    options?: { save?: boolean },
  ): Promise<{ ok: boolean; error?: string }> {
    const before = prefs;
    prefs = { ...prefs, ...patch };
    publish();
    if (options?.save === false) return { ok: true };
    if (deps.savePrefs === undefined) return { ok: true };
    const result = await deps.savePrefs(prefs);
    if (!result.ok) {
      prefs = before;
      publish();
      return result.error === undefined ? { ok: false } : { ok: false, error: result.error };
    }
    return { ok: true };
  }

  function applyPrefs(next: FrameworkConfig): void {
    prefs = { ...next };
    snapshot = { ...snapshot, ready: true };
    publish();
  }

  /**
   * 清理「一直没人注册」的本机布局残留（设置页的手动动作，**不再自动跑**）。
   *
   * 自动跑过一次（启动后 5 秒），但那会在开发时误伤：插件热重载 / 正在改的插件没加载成功 /
   * 临时禁用某个插件，都会让它的组件在这 5 秒里「不在册」，于是布局被当成残留删掉。
   * 现在只在用户显式点「清理已卸载组件的残留」时执行。
   */
  function pruneOrphans(): number {
    const known = [...registry.keys()];
    const isKnown = (id: string): boolean => known.includes(id);
    let removed = 0;
    for (const id of Object.keys(state.cards)) {
      if (isKnown(id)) continue;
      state = pruneId(state, id);
      removed += 1;
    }
    if (removed > 0) {
      state = {
        ...state,
        tray: {
          order: state.tray.order.filter(isKnown),
          hidden: state.tray.hidden.filter(isKnown),
        },
        disabled: state.disabled.filter(isKnown),
      };
      persist();
    }
    if (state.popoverId !== null && !isKnown(state.popoverId)) {
      state = { ...state, popoverId: null, popoverOrigin: null };
    }
    if (transientId !== null && !isKnown(transientId)) setTransientTarget(null, null);
    setZOrder(state.zOrder.filter(isKnown), false);
    publish();
    return removed;
  }

  function resetLocal(): boolean {
    saver.cancel();
    const ok = clearState(deps.storage);
    state = emptyState();
    cancelAllHoverTimers();
    setTransientTarget(null, null);
    clearLive();
    for (const key of Object.keys(badges)) delete badges[key];
    publish();
    notifyLive();
    return ok;
  }

  function setViewport(next: Viewport): void {
    const width = Number.isFinite(next.width) && next.width > 0 ? Math.round(next.width) : viewport.width;
    const height =
      Number.isFinite(next.height) && next.height > 0 ? Math.round(next.height) : viewport.height;
    if (width === viewport.width && height === viewport.height) return;
    viewport = { width, height };
    // 视口变化后把所有卡片夹回可见区（真被夹过的才落盘）
    let changed = false;
    const nextCards: Record<string, CardState> = { ...state.cards };
    for (const [id, card] of Object.entries(state.cards)) {
      const widget = widgetOf(id);
      if (widget === undefined) continue;
      const size = card.minimized ? collapsedSize(id) : { w: card.w, h: card.h };
      const visual = { ...card, ...size };
      const clamped = clampRect(visual, constraintsFor(widget), viewport);
      const placed = card.minimized ? { ...clamped, w: card.w, h: card.h } : clamped;
      if (isSameRect(card, placed)) continue;
      nextCards[id] = { ...card, ...placed };
      changed = true;
    }
    if (changed) {
      state = { ...state, cards: nextCards };
      persist();
    }
    if (live !== null) {
      const widget = widgetOf(live.id);
      if (widget !== undefined) {
        // 视口变化只把活动几何夹回来；吸附候选留到下一帧重算（稳定快照由 setLiveState 维护）
        setLiveState({ ...live, rect: clampRect(live.rect, constraintsFor(widget), viewport) });
      }
    }
    publish();
  }

  function setSession(next: string | null): void {
    if (sessionId === next) return;
    // 首帧拿到会话**不算切换**：托盘是会话槽位里的条目，刷新后它会带着真实 sessionId 挂载，
    // 而运行时此时还是 null。旧实现把这一步当成「切会话」，于是每次刷新都把恢复出来的卡片与
    // 面板全部关掉 —— 这次修复的核心（见 docs/widget-spec.md §7）。
    const firstBinding = sessionId === null;
    sessionId = next;
    if (firstBinding) {
      publish();
      return;
    }
    // 真的换会话：内容面绑定开启它的会话，全部收起（v1 规则，见 docs/widget-spec.md §6）
    let changed = false;
    cancelAllHoverTimers();
    if (state.popoverId !== null) {
      setPinnedTarget(null, null);
      changed = true;
    }
    if (transientId !== null) {
      setTransientTarget(null, null);
      changed = true;
    }
    const nextCards: Record<string, CardState> = { ...state.cards };
    for (const [id, card] of Object.entries(state.cards)) {
      if (!card.open || !registry.has(id)) continue;
      nextCards[id] = { ...card, open: false, minimized: false };
      changed = true;
    }
    setZOrder([], false);
    if (changed) {
      state = { ...state, cards: nextCards };
      persist();
      publish();
    }
  }

  function setBadge(id: string, badge: WidgetBadge | null): void {
    const before = badges[id] ?? null;
    if (JSON.stringify(before) === JSON.stringify(badge)) return;
    badges[id] = badge;
    publish();
  }

  publish();

  return {
    specVersion: SPEC_VERSION,
    frameworkVersion: FRAMEWORK_VERSION,
    register,
    list,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open,
    close,
    toggle,
    isOpen,
    minimize,
    restore,
    setEnabled,
    isEnabled,
    setLocked,
    isLocked,
    getSnapshot: () => snapshot,
    subscribeLive(listener) {
      liveListeners.add(listener);
      return () => {
        liveListeners.delete(listener);
      };
    },
    getLive: () => live,
    getLiveFor: (id) => (live !== null && live.id === id ? live : null),
    getLiveSnap: () => liveSnapView,
    beginLive,
    setLive,
    commitLive,
    cancelLive,
    raise(id) {
      raiseOrder(id);
      publish();
    },
    toggleMinimize,
    nudge,
    nudgeResize,
    requestSize,
    resizeTo,
    center,
    sizeClassOf: sizeClassFor,
    contentSize: (rect) => contentBox(rect),
    rectOf,
    visualRectOf,
    capsuleWidthOf,
    reportCapsuleNeed,
    constraintsOf: constraintsFor,
    viewport: () => viewport,
    setViewport,
    setSession,
    getSession: () => sessionId,
    setAnchor: (id, el) => {
      const before = anchors.get(id) ?? null;
      if (el === null) anchors.delete(id);
      else anchors.set(id, el);
      if (before === el) return;
      // React 每次 commit 都会用新的 ref 回调先 detach（null）再 attach（同一个元素）：
      // 只有「换了一个真的新元素」才算挂载，否则会 publish ↔ 重渲染 无限循环。
      if (el === null || lastAnchors.get(id) === el) return;
      lastAnchors.set(id, el);
      // 通知一次：刷新后恢复出来的 popover 需要知道它的图标刚刚挂上，才能重新测量位置。
      publish();
    },
    getAnchor: (id) => anchors.get(id) ?? null,
    setBadge,
    setTrayOrder,
    setOrder,
    resetTrayLayout,
    setHidden,
    setPrefs,
    applyPrefs,
    pruneOrphans,
    resetLocal,
    saveNow() {
      saver.flush();
    },
    scheduleInterval(callback, ms) {
      if (deps.interval !== undefined) return deps.interval(callback, ms);
      const handle = setInterval(callback, ms);
      return () => {
        clearInterval(handle);
      };
    },
    scheduleTimeout(callback, ms) {
      if (deps.timeout !== undefined) return deps.timeout(callback, ms);
      const handle = setTimeout(callback, ms);
      return () => {
        clearTimeout(handle);
      };
    },
    hoverEnter,
    hoverLeave,
  };
}

/** 提供给其它插件的 facade：只有规范里承诺的那几个成员，内部方法不外泄。 */
export function createWidgetsService(runtime: WidgetRuntime): {
  readonly specVersion: number;
  readonly frameworkVersion: string;
  register: <D>(descriptor: WidgetDescriptor<D>) => () => void;
  list: () => readonly WidgetSummary[];
  subscribe: (listener: () => void) => () => void;
  open: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
  isOpen: (id: string) => boolean;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  setEnabled: (id: string, enabled: boolean) => void;
  isEnabled: (id: string) => boolean;
  setLocked: (id: string, locked: boolean) => void;
  isLocked: (id: string) => boolean;
} {
  return {
    specVersion: runtime.specVersion,
    frameworkVersion: runtime.frameworkVersion,
    register: (descriptor) => runtime.register(descriptor),
    list: () => runtime.list(),
    subscribe: (listener) => runtime.subscribe(listener),
    open: (id) => {
      runtime.open(id);
    },
    close: (id) => {
      runtime.close(id);
    },
    toggle: (id) => {
      runtime.toggle(id);
    },
    isOpen: (id) => runtime.isOpen(id),
    minimize: (id) => {
      runtime.minimize(id);
    },
    restore: (id) => {
      runtime.restore(id);
    },
    setEnabled: (id, enabled) => {
      runtime.setEnabled(id, enabled);
    },
    isEnabled: (id) => runtime.isEnabled(id),
    setLocked: (id, locked) => {
      runtime.setLocked(id, locked);
    },
    isLocked: (id) => runtime.isLocked(id),
  };
}
