/**
 * 本机布局存储 —— 纯逻辑 + 可注入 IO，Node 里直接可测
 *
 * 存 localStorage 的**只有本机布局**（托盘顺序/隐藏/禁用、卡片矩形与最小化/锁定、层叠顺序、
 * 当前展开的面板）；用户**配置**（托盘开关、图标上限、刷新间隔…）走 settings.yaml 的 NS 分节，
 * 两者的边界见 `docs/widget-spec.md`。
 *
 * 新字段一律**向后兼容地追加**（旧值缺字段 = 用默认值），因此存储结构版本不需要 bump；
 * 只有**破坏性**改动才动 `STORE_VERSION`（届时整份丢弃，不做迁移）。
 *
 * 与 geometry.ts 一样，本文件必须自包含（只允许 `import type`）——`scripts/check-store.mjs`
 * 直接 import 它。类型层面从 geometry 借，值层面靠注入（`deps.clampRect`）。
 *
 * @module @dshp/widget-kit/store
 */
import type { Rect, RectConstraints, Viewport } from './geometry.js';

/** localStorage 单键（带版本：`v` 不匹配就整份丢弃，不做迁移）。 */
export const STORE_KEY = 'dshp-widget-kit:v1';

/** 存储结构版本。 */
export const STORE_VERSION = 1;

/** 最多跟踪多少张卡片（防脏数据把 store 撑爆）。超了保留**最新**的这批。 */
export const MAX_TRACKED = 96;

/** 列表（托盘顺序 / 隐藏集合 / 禁用集合 / 层叠顺序）长度上限。 */
export const MAX_LIST = 96;

/** 拖拽/缩放结束后落盘的延迟（合并抖动）。 */
export const SAVE_DEBOUNCE_MS = 300;

/** 单张卡片的持久状态。 */
export interface CardState extends Rect {
  minimized: boolean;
  open: boolean;
  /** 位置锁定：不可拖动、不可缩放，但仍可最小化 / 关闭（`setLocked`）。 */
  locked: boolean;
}

export interface TrayState {
  order: string[];
  /** 从托盘隐藏（组件仍在运行，只是没有图标）。 */
  hidden: string[];
}

export interface PersistedState {
  v: typeof STORE_VERSION;
  tray: TrayState;
  cards: Record<string, CardState>;
  /** 最近一次打开的内容面（诊断 / 兼容用）。 */
  lastOpenId: string | null;
  /** 卡片层自下而上的顺序（末尾最上）—— 刷新后层叠顺序不重置。 */
  zOrder: string[];
  /**
   * 当前展开的**常驻** popover（`persistent: true` 的那一层，手风琴：最多一个）。
   *
   * 临时层（悬停速览 / 一次性菜单）不落盘：它不是「固定生效」的状态，刷新后不恢复。
   */
  popoverId: string | null;
  /** 常驻面板是怎么被打开的（`hover` + `persistent` 也不会因指针移开而收起）。 */
  popoverOrigin: 'click' | 'hover' | null;
  /** 被用户禁用的组件：图标、卡片、内容面与徽标一并停用（`setEnabled`）。 */
  disabled: string[];
}

/** localStorage 的最小接口（测试里传假实现）。 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SanitizeDeps {
  /**
   * 该 id 是否在册。
   *
   * 启动读盘时注册表还是空的（各插件的 client 半随后才注册），此时应传 `() => true`
   * —— 否则整份布局会被当成残留清空。残留由启动后的 `pruneOrphans()` 清理。
   */
  isKnown(id: string): boolean;
  constraintsOf(id: string): RectConstraints;
  viewport: Viewport;
  clampRect(rect: Rect, constraints: RectConstraints, viewport: Viewport): Rect;
}

export function emptyState(): PersistedState {
  return {
    v: STORE_VERSION,
    tray: { order: [], hidden: [] },
    cards: {},
    lastOpenId: null,
    zOrder: [],
    popoverId: null,
    popoverOrigin: null,
    disabled: [],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function readIdList(raw: unknown, deps: SanitizeDeps): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (out.length >= MAX_LIST) break;
    if (typeof item !== 'string') continue;
    if (!deps.isKnown(item)) continue;
    if (out.includes(item)) continue;
    out.push(item);
  }
  return out;
}

/**
 * 消毒一份从 localStorage 读回来的原始值。
 *
 * 丢弃即回默认：坏 JSON / 结构不对 / `v` 不匹配 / 字段类型不符 / 不在册的 id / 超长列表。
 * **不做迁移** —— 老结构直接丢（与仓库「不迁移历史配置」一致）。
 */
export function sanitizeState(raw: unknown, deps: SanitizeDeps): PersistedState {
  if (!isRecord(raw)) return emptyState();
  if (raw['v'] !== STORE_VERSION) return emptyState();

  const trayRaw = isRecord(raw['tray']) ? raw['tray'] : {};
  const order = readIdList(trayRaw['order'], deps);
  const hidden = readIdList(trayRaw['hidden'], deps);
  const disabled = readIdList(raw['disabled'], deps);
  const zOrder = readIdList(raw['zOrder'], deps);

  const cardsRaw = isRecord(raw['cards']) ? raw['cards'] : {};
  const cards: Record<string, CardState> = {};
  let tracked = 0;
  // 超上限时保留**最新**的记录（对象键序 = 写入顺序），别把刚拖好位置的那张挤掉
  const cardIds = Object.keys(cardsRaw);
  for (const id of cardIds.slice(-MAX_TRACKED)) {
    if (tracked >= MAX_TRACKED) break;
    if (!deps.isKnown(id)) continue;
    const value = cardsRaw[id];
    if (!isRecord(value)) continue;
    const x = value['x'];
    const y = value['y'];
    const w = value['w'];
    const h = value['h'];
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(w) || !isFiniteNumber(h)) continue;
    const rect = deps.clampRect({ x, y, w, h }, deps.constraintsOf(id), deps.viewport);
    cards[id] = {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      minimized: value['minimized'] === true,
      open: value['open'] === true,
      locked: value['locked'] === true,
    };
    tracked += 1;
  }

  const lastRaw = raw['lastOpenId'];
  const lastOpenId = typeof lastRaw === 'string' && deps.isKnown(lastRaw) ? lastRaw : null;

  const popoverRaw = raw['popoverId'];
  const popoverId = typeof popoverRaw === 'string' && deps.isKnown(popoverRaw) ? popoverRaw : null;
  const originRaw = raw['popoverOrigin'];
  const popoverOrigin =
    popoverId !== null && (originRaw === 'click' || originRaw === 'hover') ? originRaw : null;

  return {
    v: STORE_VERSION,
    tray: { order, hidden },
    cards,
    lastOpenId,
    zOrder,
    popoverId,
    popoverOrigin,
    disabled,
  };
}

/** 读一次；任何异常都降级为「默认 + degraded」（隐私模式 / 配额满 / 坏 JSON）。 */
export function loadState(
  storage: StorageLike | null,
  deps: SanitizeDeps,
): { state: PersistedState; degraded: boolean } {
  if (storage === null) return { state: emptyState(), degraded: true };
  try {
    const raw = storage.getItem(STORE_KEY);
    if (raw === null || raw === '') return { state: emptyState(), degraded: false };
    return { state: sanitizeState(JSON.parse(raw) as unknown, deps), degraded: false };
  } catch {
    return { state: emptyState(), degraded: true };
  }
}

/** 写一次；返回是否成功（失败由调用方决定是否记一行 warn）。 */
export function saveState(storage: StorageLike | null, state: PersistedState): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** 清掉本机布局（设置页「清空本机布局」用）。 */
export function clearState(storage: StorageLike | null): boolean {
  if (storage === null) return false;
  try {
    storage.removeItem(STORE_KEY);
    return true;
  } catch {
    return false;
  }
}

export interface DebouncedSaver {
  schedule(state: PersistedState): void;
  flush(): boolean;
  cancel(): void;
  /** 自检用：当前是否有尚未落盘的改动。 */
  pending(): boolean;
}

/**
 * 合并写盘：300ms 内的多次改动只落一次；`flush()` 立即写（关闭页面/卸载插件时用）。
 *
 * @param storage - localStorage 接口（null = 内存降级，直接返回 false）。
 * @param delayMs - 合并窗口。
 * @param onError - 写失败回调（每插件只记一行 warn 用）。
 */
export function createDebouncedSaver(
  storage: StorageLike | null,
  delayMs: number = SAVE_DEBOUNCE_MS,
  onError: () => void = () => {},
): DebouncedSaver {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let queued: PersistedState | null = null;

  const write = (): boolean => {
    if (queued === null) return true;
    const payload = queued;
    queued = null;
    const ok = saveState(storage, payload);
    if (!ok) onError();
    return ok;
  };

  return {
    schedule(state: PersistedState): void {
      queued = state;
      if (timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        write();
      }, delayMs);
    },
    flush(): boolean {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      return write();
    },
    cancel(): void {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      queued = null;
    },
    pending(): boolean {
      return queued !== null;
    },
  };
}

/** 在顺序里前后移动一项（溢出菜单的「上移 / 下移」）。越界或不存在时原样返回。 */
export function moveInOrder(order: readonly string[], id: string, delta: number): string[] {
  const index = order.indexOf(id);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= order.length) return order.slice();
  const out = order.slice();
  const [item] = out.splice(index, 1);
  if (item === undefined) return order.slice();
  out.splice(next, 0, item);
  return out;
}

/**
 * 把「可见项的新顺序」合并回完整顺序。
 *
 * 托盘里被用户藏起来的组件不参与拖拽，但它们在完整顺序里占的位置必须保留 —— 否则把几个组件
 * 藏起来再拖一次，隐藏项的相对位置就被打乱了。
 *
 * @param full - 完整顺序（含隐藏项）。
 * @param nextVisible - 可见项的新顺序。
 * @returns 新的完整顺序。
 */
export function mergeVisibleOrder(full: readonly string[], nextVisible: readonly string[]): string[] {
  const visible = new Set(nextVisible);
  const out = full.slice();
  let cursor = 0;
  for (let i = 0; i < out.length; i += 1) {
    const id = out[i];
    if (id === undefined || !visible.has(id)) continue;
    const replacement = nextVisible[cursor];
    cursor += 1;
    if (replacement !== undefined) out[i] = replacement;
  }
  for (const id of nextVisible) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** 增删一个「成员集合」里的 id（隐藏集合与禁用集合共用同一语义，越界截断）。 */
export function setMembershipInList(list: readonly string[], id: string, present: boolean): string[] {
  if (present) {
    if (list.includes(id)) return list.slice();
    return [...list, id].slice(0, MAX_LIST);
  }
  return list.filter((x) => x !== id);
}

/** 增删隐藏集合。 */
export const setHiddenInList = setMembershipInList;

/** 增删禁用集合。 */
export const setDisabledInList = setMembershipInList;

/** 组件被卸载后清掉它的全部残留（卡片、托盘顺序、隐藏/禁用集合、层叠顺序、面板目标）。 */
export function pruneId(state: PersistedState, id: string): PersistedState {
  const cards = { ...state.cards };
  delete cards[id];
  return {
    v: STORE_VERSION,
    tray: {
      order: state.tray.order.filter((x) => x !== id),
      hidden: state.tray.hidden.filter((x) => x !== id),
    },
    cards,
    lastOpenId: state.lastOpenId === id ? null : state.lastOpenId,
    zOrder: state.zOrder.filter((x) => x !== id),
    popoverId: state.popoverId === id ? null : state.popoverId,
    popoverOrigin: state.popoverId === id ? null : state.popoverOrigin,
    disabled: state.disabled.filter((x) => x !== id),
  };
}

/** 托盘里一个图标槽位的冻结几何（`left`/`width`/`center` 都以托盘自身左上角为原点）。 */
export interface TraySlot {
  id: string;
  left: number;
  width: number;
  center: number;
}

/** 一次托盘拖拽的「计划」：目标下标、新顺序、预览框落点、其余图标要让位的位移。 */
export interface TrayDragPlan {
  /** 目标下标（0..n-1，最终顺序里被拖图标的位置）；被拖 id 不在槽位里时为 -1。 */
  to: number;
  /** 新顺序（直接提交这个）。 */
  order: string[];
  /** 预览框要落的槽位；没有槽位时为 null。 */
  slot: TraySlot | null;
  /** 其余图标为了让位需要移动的像素（`translateX`，相对自己当前位置）。 */
  shift: Record<string, number>;
}

/**
 * 托盘图标拖拽的纯几何（**手势开始时冻结槽位**，拖动期间只做纯计算）。
 *
 * 为什么必须冻结：边拖边重排会自我反馈 —— 指针下的槽位随渲染一起变，判定就会抖，
 * 表现为「只能往一个方向拖」。这里只用**手势开始时**量到的中心线算一次目标下标，
 * 于是左右两个方向完全对称；把「空位」画成预览框、其它图标用 transform 平移一格来让位。
 *
 * @param slots - 手势开始时冻结的槽位（按当时的可见顺序）。
 * @param draggingId - 被拖的 id。
 * @param pointerX - 指针横坐标（与 `slots` 同一坐标系，通常是视口坐标）。
 * @returns 目标下标 / 新顺序 / 预览槽位 / 位移表。
 */
export function planTrayDrag(slots: readonly TraySlot[], draggingId: string, pointerX: number): TrayDragPlan {
  const order = slots.map((slot) => slot.id);
  const from = order.indexOf(draggingId);
  if (from < 0) return { to: -1, order: order.slice(), slot: null, shift: {} };
  const others = slots.filter((slot) => slot.id !== draggingId);
  let to = 0;
  for (const slot of others) {
    if (Number.isFinite(slot.center) && slot.center < pointerX) to += 1;
  }
  // 其它图标让位：向右拖时 from+1..to 整体左移一格，向左拖时 to..from-1 整体右移一格
  const shift: Record<string, number> = {};
  if (to > from) {
    for (let index = from + 1; index <= to && index < slots.length; index += 1) {
      const current = slots[index];
      const previous = slots[index - 1];
      if (current === undefined || previous === undefined) continue;
      shift[current.id] = previous.left - current.left;
    }
  } else if (to < from) {
    for (let index = to; index < from; index += 1) {
      const current = slots[index];
      const next = slots[index + 1];
      if (current === undefined || next === undefined) continue;
      shift[current.id] = next.left - current.left;
    }
  }
  const next = order.filter((id) => id !== draggingId);
  next.splice(Math.min(Math.max(to, 0), next.length), 0, draggingId);
  const slot = slots[Math.min(Math.max(to, 0), slots.length - 1)] ?? null;
  return { to, order: next, slot, shift };
}

/**
 * 一维拖拽排序的纯函数（托盘图标换序）。
 *
 * 治的是「拖拽项自己也在指针下面」这个经典抖动：命中测试**只**看其余项的中心点，
 * 于是把 A 往右拖过 B 的中线就插到 B 后面，再往右拖过 C 的中线就插到 C 后面 —— 两个方向对称，
 * 不会出现「只能从右往左拖」。渲染顺序怎么变都不会让结果振荡（中线判定与自身位置无关）。
 *
 * @param order - 当前顺序（含被拖项）。
 * @param draggingId - 被拖的 id。
 * @param centers - 其余项的中心坐标，顺序必须与 `order` 去掉 `draggingId` 后一致。
 * @param pointerX - 指针横坐标。
 * @returns 新顺序；参数不自洽（被拖项不在列表里 / 坐标数量不匹配）时原样返回副本。
 */
export function reorderByPointer(
  order: readonly string[],
  draggingId: string,
  centers: readonly number[],
  pointerX: number,
): string[] {
  const others = order.filter((id) => id !== draggingId);
  if (others.length === order.length) return order.slice();
  if (centers.length !== others.length) return order.slice();
  let insertAt = 0;
  for (const center of centers) {
    if (Number.isFinite(center) && center < pointerX) insertAt += 1;
  }
  others.splice(insertAt, 0, draggingId);
  return others;
}
