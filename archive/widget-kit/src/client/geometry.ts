/**
 * 卡片几何 —— 纯函数，无 React、无 DOM、无副作用
 *
 * 所有「拖拽 / 缩放 / 夹紧 / 内容盒 / 尺寸档」的数学都在这里，`scripts/check-geometry.mjs`
 * 直接 import 本文件跑断言（Node 的 TS 类型擦除）。**所以本文件必须自包含**：只允许 `import type`。
 *
 * 为什么这里又写了一遍标题栏/内边距/吸附参数：`src/client/spec.ts` 也必须自包含（同一个自检脚本
 * 要 import 它），两边不能互相值导入。几处数字由 `scripts/check-geometry.mjs` 断言相等，
 * 漂移即测试失败。
 *
 * @module @dshp/widget-kit/geometry
 */

/** 卡片标题栏高度（px）。内容区从它下面开始。 */
export const TITLE_BAR_HEIGHT = 36;

/** 内容区内边距（px）：内容盒 = 外层宽 − 2×它，外层高 − 标题栏 − 2×它。 */
export const CONTENT_PADDING = 10;

/** 相邻卡片之间的间隔（px）：吸附贴在一起时留这么多，不糊在一起。 */
export const SNAP_GAP = 8;

/** 同轴吸附距离（px）：与邻卡的边、或视口边缘差这么多以内就吸过去。 */
export const SNAP_DISTANCE = 12;

/** 新卡相对上一张的层叠偏移（px）。 */
export const CASCADE_STEP = 28;

/** 层叠位置的回绕周期（第 n 张卡用第 n % 该值 档）。 */
export const CASCADE_WRAP = 6;

/**
 * 最小化胶囊的最小宽度（px）：再短的标题也给这么宽，免得收成一粒看不清的豆子。
 *
 * 胶囊宽度**不再由常量算出来** —— 需要多宽是量出来的（`measure.measureHeaderWidth` 量整条标题栏的
 * 自然宽度），这里只负责「夹紧」。上一版按「内边距 + 标题 + 间隙 + 按钮」的常量加法算，只要有一处
 * 与实际排版不一致（官方按钮换了尺寸、锚点外面多一层包装、卡片自己有 0.5px 边框），算出来就偏窄，
 * 表现正是「折叠后标题被省略号截掉」。
 */
export const CAPSULE_MIN_WIDTH = 160;

/**
 * 量到的宽度之上留的余量（px）。
 *
 * 量出来的宽度是**渲染那一刻**的精确值，但胶囊最终是一个**整数**像素宽度，中间还要经过
 * 「卡片自己的 0.5–1px 边框、flex 的亚像素取整、网络字体换装后字形宽度微变」这些环节 ——
 * 差 1px 就足以让 `text-overflow: ellipsis` 生效（表现是「标题末端是省略号」）。
 * 这点余量把这个量级的误差吃掉，视觉上完全看不出（胶囊宽 1% 都不到）。
 * 它**不是**用来兜「量错对象」的：量错有 {@link capsuleOverflowFix} 兜底。
 */
export const CAPSULE_SLACK = 6;

/** 卡片外层矩形（左上角 + 尺寸，px）。 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Box {
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface RectConstraints {
  min: Size;
  max?: Size | null | undefined;
}

/** 八个缩放方向。 */
export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** 全部缩放方向（UI 生成把手 + 自检遍历）。 */
export const RESIZE_DIRS: readonly ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export type SizeClass = 'compact' | 'regular' | 'wide';

export interface Breakpoints {
  compact: number;
  wide: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** 视口退化（宽高为 0 / NaN）时的兜底。 */
function safeViewport(viewport: Viewport): Viewport {
  const width = Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 1024;
  const height = Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : 768;
  return { width, height };
}

/** 该约束下的有效最大尺寸：描述符 max 与视口取小，且永不小于 min。 */
export function maxSizeFor(constraints: RectConstraints, viewport: Viewport): Size {
  const vp = safeViewport(viewport);
  const maxW = Math.min(constraints.max?.w ?? vp.width, vp.width);
  const maxH = Math.min(constraints.max?.h ?? vp.height, vp.height);
  return {
    w: Math.max(constraints.min.w, maxW),
    h: Math.max(constraints.min.h, maxH),
  };
}

/** 把尺寸夹进 [min, max]，并取整。 */
export function clampSize(size: Size, constraints: RectConstraints, viewport: Viewport): Size {
  const cap = maxSizeFor(constraints, viewport);
  return {
    w: Math.round(clamp(size.w, Math.min(constraints.min.w, cap.w), cap.w)),
    h: Math.round(clamp(size.h, Math.min(constraints.min.h, cap.h), cap.h)),
  };
}

/**
 * 只做「整卡留在视口内」这一件事（尺寸不动，位置取整）。
 *
 * 卡片比视口还大时（视口极窄 / minSize 比视口还宽）只能贴左上角，此时横向会溢出 —— 这是无解的，
 * 但左上角仍然保证抓得到。
 */
export function containRect(rect: Rect, viewport: Viewport): Rect {
  const vp = safeViewport(viewport);
  const w = Number.isFinite(rect.w) ? Math.max(0, Math.round(rect.w)) : 0;
  const h = Number.isFinite(rect.h) ? Math.max(0, Math.round(rect.h)) : 0;
  return {
    x: Math.round(clamp(rect.x, 0, Math.max(0, vp.width - w))),
    y: Math.round(clamp(rect.y, 0, Math.max(0, vp.height - h))),
    w,
    h,
  };
}

/**
 * 把矩形夹回可用范围：尺寸夹进 `min/max` 与视口，位置**整卡留在视口内**。
 *
 * 规则（治「卡片被拖到屏幕外找不回来」）：不允许把卡片拖到屏幕之外，任何时刻它都完整可见 ——
 * 比「至少留 48px」更严格，代价是卡片不能停在屏幕边缘外（吸附规则同样以视口边缘为吸附目标）。
 */
export function clampRect(rect: Rect, constraints: RectConstraints, viewport: Viewport): Rect {
  const size = clampSize(rect, constraints, viewport);
  return containRect({ ...rect, ...size }, viewport);
}

/**
 * 第八张卡（index 从 0 起）的默认落点：从右上角往左下阶梯层叠，最后夹回视口。
 *
 * @param index - 当前已打开的卡片数（第几张新卡）。
 * @param size - 期望的初始尺寸（外层 px）。
 * @param constraints - 尺寸约束（夹紧用）。
 * @param viewport - 视口尺寸。
 */
export function defaultRect(
  index: number,
  size: Size,
  constraints: RectConstraints,
  viewport: Viewport,
): Rect {
  const vp = safeViewport(viewport);
  const step = (Math.max(0, Math.floor(index)) % CASCADE_WRAP) * CASCADE_STEP;
  const raw: Rect = {
    x: vp.width - size.w - 24 - step,
    y: 88 + step,
    w: size.w,
    h: size.h,
  };
  return clampRect(raw, constraints, viewport);
}

/** 内容盒（给提供方的 `size`）：整数 px，已扣标题栏与内边距，永不为负。 */
export function contentBox(rect: Rect): Box {
  return {
    width: Math.max(0, Math.round(rect.w) - CONTENT_PADDING * 2),
    height: Math.max(0, Math.round(rect.h) - TITLE_BAR_HEIGHT - CONTENT_PADDING * 2),
  };
}

/** 由内容盒宽度派生尺寸档：`< compact` → compact，`>= wide` → wide，其余 regular。 */
export function sizeClassOf(width: number, breakpoints: Breakpoints): SizeClass {
  if (!Number.isFinite(width)) return 'regular';
  if (width < breakpoints.compact) return 'compact';
  if (width >= breakpoints.wide) return 'wide';
  return 'regular';
}

// ── 吸附（移动落点的磁力）──────────────────────────────────────────────

/** 吸附参数。 */
export interface SnapOptions {
  /** 相邻卡片贴在一起时保留的间隔（px）。 */
  gap: number;
  /** 吸附距离：与邻卡边、邻卡对齐线或视口边缘差这么多以内就吸过去（px）。 */
  distance: number;
}

const DEFAULT_SNAP: SnapOptions = { gap: SNAP_GAP, distance: SNAP_DISTANCE };

/** 单轴上的一个区间（位置 + 尺寸），吸附算法用它描述邻卡在某一轴上的投影（数值，不依赖 Rect）。 */
export interface AxisSpan {
  pos: number;
  size: number;
}

/**
 * 单轴吸附：候选 = 视口两端 + 邻卡两端（贴边，带 gap）+ 邻卡两端（对齐）。
 *
 * 取位移最小的那个；位移相同则优先「贴边」候选（贴上去比单纯对齐更可用）。
 * 一个候选都不在 `distance` 内时原样返回，也就是「没有吸附目标」。
 */
function snapAxis(
  pos: number,
  size: number,
  spans: readonly AxisSpan[],
  limit: number,
  options: SnapOptions,
): number {
  const candidates: { value: number; edge: boolean }[] = [
    { value: 0, edge: true },
    { value: limit - size, edge: true },
  ];
  for (const span of spans) {
    candidates.push({ value: span.pos + span.size + options.gap, edge: true }); // 贴在邻卡后面
    candidates.push({ value: span.pos - options.gap - size, edge: true }); // 贴在邻卡前面
    candidates.push({ value: span.pos, edge: false }); // 前缘对齐
    candidates.push({ value: span.pos + span.size - size, edge: false }); // 后缘对齐
  }
  let bestValue = pos;
  let bestDelta = options.distance + 1;
  let bestEdge = true;
  for (const candidate of candidates) {
    const delta = Math.abs(candidate.value - pos);
    if (!Number.isFinite(delta) || delta > options.distance) continue;
    if (delta < bestDelta) {
      bestValue = candidate.value;
      bestDelta = delta;
      bestEdge = candidate.edge;
    } else if (delta === bestDelta && candidate.edge && !bestEdge) {
      bestValue = candidate.value;
      bestEdge = true;
    }
  }
  return Math.round(bestValue);
}

/**
 * 吸附目标（**只是候选**，不改变卡片当下的位置）：夹进视口 → 两个轴各自找磁力目标。
 *
 * 语义（v1 的移动模型）：
 *  - 拖动期间卡片**自由跟手、允许与其它卡片互相覆盖**（不再有「必须让开」的硬约束）；
 *  - 与视口边缘、邻卡边缘或邻卡对齐线相差 ≤ `distance` 时给出吸附候选（两个轴各自独立判断，
 *    所以「贴到旁边 + 上对齐」是两条候选同时命中）；
 *  - 返回值与入参完全相同 = 这次没有吸附目标（调用方据此决定要不要画预览框）；
 *  - **是否采用由用户决定**：松手时若预览框还在，就落到这里；否则落回自由位置。
 *
 * @param rect - 指针算出来的自由位置（内部会先夹进视口）。
 * @param others - 屏幕上其它卡片的矩形（不含自己）。
 * @param viewport - 视口尺寸。
 * @param options - 吸附参数（默认 `SNAP_GAP` / `SNAP_DISTANCE`）。
 */
export function snapRect(
  rect: Rect,
  others: readonly Rect[],
  viewport: Viewport,
  options: SnapOptions = DEFAULT_SNAP,
): Rect {
  const vp = safeViewport(viewport);
  const contained = containRect(rect, vp);
  return {
    ...contained,
    x: snapAxis(
      contained.x,
      contained.w,
      others.map((other) => ({ pos: other.x, size: other.w })),
      vp.width,
      options,
    ),
    y: snapAxis(
      contained.y,
      contained.h,
      others.map((other) => ({ pos: other.y, size: other.h })),
      vp.height,
      options,
    ),
  };
}

/**
 * 一次缩放：方向 + 指针位移 → 新矩形。
 *
 * 语义：被拖的那条边跟手，**对边固定**（对角缩放因此不会漂移）；夹在 `min/max` 内；
 * 最后整块再过 `clampRect`（标题栏保底可见）。向北缩放时顶边不得越过 y=0（标题栏必须可见）。
 */
export function applyResize(
  rect: Rect,
  dir: ResizeDir,
  dx: number,
  dy: number,
  constraints: RectConstraints,
  viewport: Viewport,
): Rect {
  const vp = safeViewport(viewport);
  const cur = clampRect(rect, constraints, viewport);
  const cap = maxSizeFor(constraints, viewport);
  const minW = Math.min(constraints.min.w, cap.w);
  const minH = Math.min(constraints.min.h, cap.h);

  const east = dir.includes('e');
  const west = dir.includes('w');
  const north = dir.includes('n');
  const south = dir.includes('s');

  let w = cur.w;
  let h = cur.h;

  if (east) {
    // 右手边跟手；不越过视口右缘（除非本来就已经在外面）
    const limit = Math.max(minW, Math.min(cap.w, vp.width - cur.x));
    w = clamp(cur.w + dx, minW, limit);
  } else if (west) {
    w = clamp(cur.w - dx, minW, cap.w);
  }

  if (south) {
    const limit = Math.max(minH, Math.min(cap.h, vp.height - cur.y));
    h = clamp(cur.h + dy, minH, limit);
  } else if (north) {
    // 底边固定，顶边不得越过 0（标题栏整条可见）
    const limit = Math.max(minH, cur.y + cur.h);
    h = clamp(cur.h - dy, minH, limit);
  }

  const x = west ? cur.x + (cur.w - w) : cur.x;
  const y = north ? cur.y + (cur.h - h) : cur.y;
  return clampRect({ x, y, w, h }, constraints, viewport);
}

/**
 * 把 id 放到 z 序末尾（最上）。不在序列里时**追加**。
 *
 * 已是末尾时原样返回同一引用（调用方据此跳过无谓的快照重建）。
 */
export function bringToFront(order: readonly string[], id: string): readonly string[] {
  const index = order.indexOf(id);
  if (index !== -1 && index === order.length - 1) return order;
  const next = order.filter((x) => x !== id);
  next.push(id);
  return next;
}

/** 矩形是否完全相同（整数比较；避免无谓的 store 写入）。 */
export function isSameRect(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/** 标题栏上那几个按钮的可见性（锁定后只剩「解锁 + ⋯」，最小化与关闭收进 ⋯ 菜单）。 */
export interface HeaderActions {
  /** 锁定 / 解锁按钮：始终在。 */
  lock: true;
  /** 最小化 / 还原按钮：未锁定且描述符没写 `card.minimizable: false`。 */
  minimize: boolean;
  /** ⋯ 菜单：始终在。 */
  menu: true;
  /** 关闭按钮：未锁定且描述符没写 `card.closable: false`。 */
  close: boolean;
}

/**
 * 由卡片状态推出「标题栏上有哪几个按钮」：`Card` 的 JSX 只读这一份判定。
 *
 * 锁定后只剩「解锁 + ⋯」，最小化与关闭收进 ⋯ 菜单（动作本身仍可用，只是不占标题栏）。
 */
export function headerActions(card: {
  locked: boolean;
  minimizable: boolean;
  closable: boolean;
}): HeaderActions {
  return {
    lock: true,
    minimize: !card.locked && card.minimizable,
    menu: true,
    close: !card.locked && card.closable,
  };
}

/**
 * 最小化胶囊的最终宽度（px）：`clamp(所需宽度 + 余量, 地板, 布局宽度)`。
 *
 * `need` 是**量出来的整条标题栏自然宽度**（见 `measure.measureHeaderWidth`），不是按常量算的加法：
 * 官方按钮尺寸 / 内边距 / 间隙怎么变，量到的就是多少，不存在「常量与真实排版不一致 → 标题被截」。
 * 再留 {@link CAPSULE_SLACK} 的余量，吃掉整数取整 / 边框 / 字体换装带来的 1px 级误差。
 *
 * **上限是用户自己选的那个展开宽度** —— 胶囊只是把卡片收起来，不该比卡片还宽；
 * `need` 为 `undefined`（还没量到：首帧、没有 DOM 的宿主）时退化成地板宽度（**不加余量**：
 * 没量到就该老实退回地板值，而不是凭空变宽）。
 *
 * 返回值必须是**数字**（渲染时写成显式 px）：`width: auto` 与长度之间不可插值，
 * 用 auto 时最小化会先瞬移一次宽度、再慢慢缩高度（见 docs/widget-spec.md §5.1）。
 */
export function capsuleWidth(options: { stored: number; need: number | undefined }): number {
  const stored = options.stored;
  const cap = Number.isFinite(stored) && stored > 0 ? Math.round(stored) : CAPSULE_MIN_WIDTH;
  const need =
    options.need === undefined || !Number.isFinite(options.need)
      ? CAPSULE_MIN_WIDTH
      : Math.max(CAPSULE_MIN_WIDTH, Math.ceil(options.need) + CAPSULE_SLACK);
  return Math.min(need, cap);
}

/**
 * 兜底补差：量出来的宽度**仍然**让标题被省略号截掉时，按标题实际的溢出量再补一次。
 *
 * 什么时候会真的差一点：网络字体换装后字形变宽、外观偏好改了卡片边框、浏览器亚像素取整 ——
 * 这些都不改变我们量到的那份「快照」。与其猜一个更大的余量，不如读**标题自己的溢出量**
 * （`scrollWidth − clientWidth`）把差额补上，一次就够。
 *
 * **不会振荡**：只在「胶囊还没顶到布局宽度」时补（顶到了就说明被上限卡住，再补也没用），
 * 每次补都让回报值单调变大、而 `Card` 的 effect 依赖里带着胶囊宽度 —— 补完重量一次，
 * 溢出归零就停。调用方把返回的非 null 值交回 `reportCapsuleNeed` 即可。
 *
 * @returns 应该重新回报的宽度；不需要补时 `null`。
 */
export function capsuleOverflowFix(options: {
  need: number;
  overflow: number;
  capsule: number;
  layoutWidth: number;
}): number | null {
  const { need, overflow, capsule, layoutWidth } = options;
  if (!Number.isFinite(overflow) || overflow <= 0) return null;
  if (!Number.isFinite(need) || need <= 0) return null;
  if (!Number.isFinite(layoutWidth) || layoutWidth <= 0) return null;
  // 已经顶到布局宽度：再补也不会变宽（补下去只会让回报值无限增长）→ 不补
  if (capsule >= Math.round(layoutWidth)) return null;
  return Math.ceil(need + overflow) + 1;
}
