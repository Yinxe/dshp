/**
 * 小组件规范（SPEC）—— 公开契约 + 校验器 + 默认值
 *
 * 本文件是规范的**单一事实来源**：`spec.d.ts`（给别的插件 `import type` 用）必须与这里
 * 逐字段一致，由 `scripts/check-spec-drift.mjs` 在 `pnpm test` 里强制比对；`FRAMEWORK_VERSION`
 * 必须等于 `package.json` 的版本，同一个脚本一起比。
 *
 * ⚠️ 本文件（以及 geometry.ts / store.ts）**必须自包含**：只允许 `import type`，不允许值导入。
 * `scripts/check-*.mjs` 用 Node 的 TS 类型擦除直接 import 这三个 `.ts` 源文件，
 * 值导入的 `./x.js` 在 Node 里解析不到（源码里只有 `x.ts`）。
 *
 * @module @dshp/widget-kit/spec
 */
import type { ReactNode } from 'react';

/** 契约版本。破坏性变更（字段改名/语义变化）必须 +1，并在 README 的更新日志里写迁移步骤。 */
export const SPEC_VERSION = 1;

/** 框架版本。必须等于 package.json 的 version（check-spec-drift.mjs 比对）。 */
export const FRAMEWORK_VERSION = '0.13.0';

/** 命名空间 = 本插件的 settings NS = cordis 行 id = 路由前缀段。 */
export const NS = 'dshp-widget-kit';

/** 组件 id：`<命名空间>:<名字>`。前缀即 owner，框架据此报错与清残留。 */
export const WIDGET_ID_PATTERN = /^[a-z0-9-]{2,32}:[a-z0-9-]{2,32}$/;

/** 三种承载面。`tray` = 只有常驻图标与徽标，没有内容面。 */
export const PRESENTATIONS = ['tray', 'popover', 'card'] as const;

/** 尺寸档（由内容盒宽度派生；提供方可用卡片自己的 breakpoints 覆盖阈值）。 */
export const SIZE_CLASSES = ['compact', 'regular', 'wide'] as const;

/** 徽标的语气，映射到官方的状态色 token（`--dsw-alias-state-*`）。 */
export const BADGE_TONES = ['info', 'ok', 'warn', 'bad'] as const;

/** 打开/刷新数据的原因，给提供方区分「首次 / 轮询 / 手动重试」。 */
export const LOAD_REASONS = ['open', 'refresh', 'retry'] as const;

/** 活动栏图标文字（`tray.label`）的最大字数：活动栏很窄，只留「少量文字」的位置。 */
export const TRAY_LABEL_MAX_CHARS = 6;

/** 面板就绪状态。`empty` 由提供方表达（`data` 为空时自行渲染空态即可，框架不猜）。 */
export const CONTENT_STATUS = ['loading', 'ready', 'error', 'empty'] as const;

/** 规范默认值（提供方不写时用这些）。数字都在这里，实现里不许再出现裸魔法数。 */
export const SPEC_DEFAULTS = {
  /** 卡片首次打开时的尺寸（外层 px）。 */
  cardDefaultSize: { w: 360, h: 240 },
  /** 卡片可缩到的最小尺寸（外层 px）；框架地板，与描述符取较大者。 */
  cardFloorSize: { w: 240, h: 140 },
  /** 内容盒宽度的 sizeClass 阈值。 */
  breakpoints: { compact: 320, wide: 560 },
  /** 徽标轮询的默认间隔与下限（ms）。 */
  badgeIntervalMs: 30000,
  badgeIntervalMinMs: 5000,
  badgeIntervalMaxMs: 600000,
  /** 内容面打开时的轮询下限（ms）；`0` = 不轮询。 */
  refreshMinMs: 5000,
  /** 标题栏高度与内容区内边距（内容盒 = 外层 − 标题栏 − 2×内边距）。 */
  titleBarHeight: 36,
  contentPadding: 10,
  /** 吸附：相邻卡片贴在一起保留的间隔、触发吸附的距离（px）。 */
  snapGap: 8,
  snapDistance: 12,
  /** 外观：圆角「跟随框架默认 / 圆角 / 直角」三档，以及边框宽度（默认 / 明显 / 无）。 */
  cardRadius: 12,
  cardRadiusRound: 20,
  cardBorderWidth: 0.5,
  cardBorderWidthStrong: 1,
  /** 动效时长（ms）：所有过渡与入场动画用它；`0` = 关闭动效。 */
  motionMs: 300,
  /**
   * 最小化胶囊的**最小宽度**（px）：再短的标题也给这么宽，免得收成一粒看不清的豆子。
   *
   * 胶囊要装下标题与控件**需要多宽是量出来的**（`measure.measureHeaderWidth` 量整条标题栏的自然
   * 宽度），不在这里按「内边距 + 标题 + 间隙 + 按钮」的常量加法算 —— 那种算法只要有一处常量与真实
   * 排版不一致（官方按钮换尺寸、锚点外多一层包装、卡片自己有 0.5px 边框）就会偏窄，而偏窄的表现
   * 正是「折叠后标题被省略号截掉」。这里只留地板值。
   */
  capsuleMinWidth: 160,
  /** 动效可选档位（设置页的「关 / 100 / 200 / 300 / 400 / 500」）。 */
  motionChoices: [0, 100, 200, 300, 400, 500] as const,
  /** 同屏卡片上限；开了第 7 张时自动最小化最旧一张。 */
  maxOpenCards: 6,
  /** 托盘可见图标上限（框架偏好的默认值，用户可在设置页改）。 */
  maxVisibleIcons: 4,
  /** 新卡的层叠偏移。 */
  cascadeStep: 28,
  /** popover：内容内边距、悬停展开延迟、悬停收起宽限、自适应宽度上限。 */
  popoverPadding: 12,
  popoverWidthMax: 420,
  popoverMaxHeightMax: 2000,
  hoverOpenDelayMs: 80,
  hoverCloseDelayMs: 220,
  /** popover 默认不是常驻面板（点外部即收起）。 */
  popoverPersistent: false,
} as const;

/** 网格尺寸（描述符与内容 props 里的 `{ w, h }` / `{ width, height }`）。 */
export interface WidgetSize {
  w: number;
  h: number;
}

/** 内容盒实测尺寸（给提供方的那份是 `{ width, height }`）。 */
export interface WidgetBox {
  width: number;
  height: number;
}

export interface WidgetBadge {
  text?: string;
  dot?: boolean;
  tone?: (typeof BADGE_TONES)[number];
  title?: string;
}

export interface WidgetBadgeContext {
  sessionId: string | null;
  signal: AbortSignal;
  frameworkVersion: string;
}

export interface WidgetLoadContext {
  sessionId: string | null;
  signal: AbortSignal;
  reason: (typeof LOAD_REASONS)[number];
}

/**
 * 内容面（popover / card）拿到的 props。
 *
 * **内容如何随尺寸变化完全由提供方决定**：框架只给事实（`size` / `sizeClass` / `frame`）与一个
 * 受约束的 `setSize`，不干涉布局、不做内容驱动的自动尺寸。
 */
export interface WidgetContentProps<D = unknown> {
  /** 当前承载面。`popover` 的 `size` 恒为 null（面板自适应）。 */
  frame: 'card' | 'popover';
  sessionId: string | null;
  status: (typeof CONTENT_STATUS)[number];
  data: D | undefined;
  error?: { message: string; retriable: boolean } | undefined;
  /** 上一次加载的数据还在展示，但已经过期（轮询失败等）。 */
  stale: boolean;
  lastUpdatedAt: number | null;
  /**
   * `card`：内容盒实测尺寸（整数 px，已扣标题栏与内边距）；`popover`：`null`。
   * 提供方**不要**假设固定值，也不要自己去监听 window resize（框架已按帧通知）。
   */
  size: WidgetBox | null;
  /** `card`：由内容盒宽度按 breakpoints 派生；`popover`：恒 `'regular'`（请用容器查询）。 */
  sizeClass: (typeof SIZE_CLASSES)[number];
  /** 仅 `card` 存在（`popover` 为 `undefined`，不是静默 no-op）。受 min/max 与视口夹紧。 */
  setSize?(next: { w?: number; h?: number }): void;
  /** 卡片处于「折叠成标题栏」状态（内容仍在树上，只是不显示）。`popover` 恒为 false。 */
  minimized: boolean;
  /** 卡片位置已锁定（框架已拒掉拖动/缩放）。`popover` 恒为 false。 */
  locked: boolean;
  refresh(): void;
  retry(): void;
  close(): void;
}

export interface WidgetCardOptions {
  defaultSize?: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  sizeClassBreakpoints?: { compact: number; wide: number };
  resizable?: boolean;
  minimizable?: boolean;
  closable?: boolean;
}

export interface WidgetTrayOptions {
  badge?(ctx: WidgetBadgeContext): WidgetBadge | null | Promise<WidgetBadge | null>;
  badgeIntervalMs?: number;
  /**
   * 图标旁边的一小段文字（活动栏的「图标 + 文字」扩展点），最多 `TRAY_LABEL_MAX_CHARS` 个字。
   *
   * 像系统状态栏那样用：`label: () => '14:30'` 就是一个时间显示。写函数 = 每次框架重渲染时求值
   * （徽标刷新等会引起重渲染），所以可以做轻量的实时读数；但**别在里面做重活**（它跑在渲染路径上）。
   */
  label?: string | (() => string);
}

/**
 * `presentation: 'popover'` 的形态选项。
 *
 * popover 是「小窗口」：**不可拖动、不可缩放**，同一时刻只展开一个；内容由提供方自由渲染
 * （菜单、快捷设置、数据卡、甚至 iframe / 视频 / 画布这类任意 web 视图）。
 */
export interface WidgetPopoverOptions {
  /** 展开方式：`click`（默认）点图标展开，`hover` 悬停展开（移开自动收起）。 */
  trigger?: 'click' | 'hover';
  /** 面板宽度（px）；不写 = 自适应内容（上限 `min(420, 视口−24)`）。 */
  width?: number;
  /** 面板最大高度（px）；不写 = `min(60vh, 520)`。 */
  maxHeight?: number;
  /** 内容内边距（px，默认 12）；要贴边渲染（iframe / 视频 / 画布）就设 0。 */
  padding?: number;
  /** 相对图标的位置：`bottom`（默认）或 `top`。 */
  side?: 'bottom' | 'top';
  /** 是否渲染框架自带的标题栏（默认 true）；`false` = 整个面板归你（Esc / 点外部仍可关闭）。 */
  header?: boolean;
  /** 悬停展开延迟（ms，默认 80）。 */
  hoverOpenDelayMs?: number;
  /** 悬停收起的宽限（ms，默认 220）——用来跨过「从图标移到面板」的间隙。 */
  hoverCloseDelayMs?: number;
  /**
   * 是否**持续显示**（默认 false）。
   *
   * `true` = 面板不受外部操作影响：点组件外的区域、指针移开都不会收起，只能用面板上的「✕」、
   * 再点一次图标或 Esc 关掉。适合「常驻的快捷设置 / 实时数据面板」；不适合一次性菜单。
   */
  persistent?: boolean;
}

export interface WidgetContentOptions<D = unknown> {
  title?: string | (() => string);
  load?(ctx: WidgetLoadContext): Promise<D>;
  refreshMs?: number;
  render(props: WidgetContentProps<D>): ReactNode;
}

/**
 * 组件描述符：插件 `register()` 的全部输入。
 *
 * 必填只有 5 个：`id` / `title` / `icon` / `presentation` / （非 tray 时）`content.render`。
 */
export interface WidgetDescriptor<D = unknown> {
  id: string;
  title: string | (() => string);
  icon: ReactNode;
  subtitle?: string | (() => string);
  order?: number;
  presentation: (typeof PRESENTATIONS)[number];
  tray?: WidgetTrayOptions;
  /**
   * 是否在活动栏放图标（默认 `true`）。
   *
   * `false` = **不出现在活动栏**，但卡片照旧可以由别的组件打开 —— 典型用法是「一个宿主插件只注册
   * 一个常驻/迷你菜单图标，它的菜单里同时挂好几个自由卡片」：那些卡片设 `trayIcon: false`，
   * 由宿主用 `ctx.widgets.toggle(id)` 打开。只有 `presentation: 'card'` 能这么写
   * （`tray` 形态没有图标就没有意义，`popover` 需要图标当锚点）。
   */
  trayIcon?: boolean;
  /**
   * 允许被框架的**统一入口**「组件箱」收录（默认 `false` = 不收录）。
   *
   * **默认不收录是有意的**：入口归卡片的所有者决定 —— 谁都可以只写 `trayIcon: false` 再自建菜单
   * （见 `@dshp/token-meter` 的 `token-meter:menu`），框架不替别人做这个决定，更不会把别人的卡片
   * 当成自己示例菜单的数据源。声明了才进箱：`trayIcon: false` + `listedInBox: true` 表达的正是
   * 「我没有自己的图标，让组件箱替我挂出来」。
   *
   * 只有 `presentation: 'card'` 能写（组件箱列的是卡片）。`ctx.widgets.list()` 的摘要里也带这个标记，
   * 别的聚合入口可以按同一条声明决定收不收，不需要读框架内部。
   */
  listedInBox?: boolean;
  content?: WidgetContentOptions<D>;
  card?: WidgetCardOptions;
  popover?: WidgetPopoverOptions;
  minFramework?: string;
}

/** 校验通过后的规范化描述符：所有默认值都填好，框架内部只用这份。 */
export interface NormalizedWidget {
  id: string;
  owner: string;
  title: string | (() => string);
  icon: ReactNode;
  subtitle: string | (() => string) | null;
  order: number;
  presentation: (typeof PRESENTATIONS)[number];
  tray: {
    badge: ((ctx: WidgetBadgeContext) => WidgetBadge | null | Promise<WidgetBadge | null>) | null;
    badgeIntervalMs: number;
    label: string | (() => string) | null;
  };
  trayIcon: boolean;
  /** 是否允许被「组件箱」收录（默认 `false`：入口归卡片所有者决定）。 */
  listedInBox: boolean;
  content: {
    title: string | (() => string) | null;
    load: ((ctx: WidgetLoadContext) => Promise<unknown>) | null;
    refreshMs: number;
    render: (props: WidgetContentProps<unknown>) => ReactNode;
  } | null;
  card: {
    defaultSize: WidgetSize;
    minSize: WidgetSize;
    maxSize: WidgetSize | null;
    breakpoints: { compact: number; wide: number };
    resizable: boolean;
    minimizable: boolean;
    closable: boolean;
  } | null;
  popover: {
    trigger: 'click' | 'hover';
    width: number | null;
    maxHeight: number | null;
    padding: number;
    side: 'bottom' | 'top';
    header: boolean;
    hoverOpenDelayMs: number;
    hoverCloseDelayMs: number;
    persistent: boolean;
  } | null;
}

/** 注册表对外的一行摘要（设置页与诊断组件只读这份）。 */
export interface WidgetSummary {
  id: string;
  title: string;
  owner: string;
  presentation: (typeof PRESENTATIONS)[number];
  /** 是否声明了「可被组件箱收录」——别的聚合入口也能按同一条声明决定收不收。 */
  listedInBox: boolean;
}

/** 校验失败：中文、可操作、指出字段与期望。 */
export class WidgetSpecError extends Error {
  readonly field: string;

  constructor(field: string, detail: string) {
    super(`小组件描述符不合法（${field}）：${detail}`);
    this.name = 'WidgetSpecError';
    this.field = field;
  }
}

// ── 校验工具 ────────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isText(v: unknown): v is string | (() => string) {
  return typeof v === 'string' || typeof v === 'function';
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

/** 读可选的布尔，`undefined` 取 `fallback`，其它类型直接判错。 */
function readBool(field: string, v: unknown, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  if (typeof v !== 'boolean') throw new WidgetSpecError(field, '必须是布尔值');
  return v;
}

/**
 * 解析「可能是字符串、可能是函数」的文本字段（`title` / `subtitle` / `content.title`）。
 *
 * `Card` 渲染标题与副标题、运行时算「胶囊要装下多宽的标题」都走它 —— 同一个表达式、
 * 同一个兜底，两边的判断不会各说各话。
 */
export function resolveText(value: string | (() => string) | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  return typeof value === 'function' ? value() : value;
}

/** 宽松语义化版本比较：`0.1.5-rc.1` 这种预发布视为「低于 0.1.5」。 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): { nums: number[]; pre: string } => {
    const [base = '', pre = ''] = v.split('-', 2) as [string, string?];
    const nums = base.split('.').map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isFinite(n) ? n : 0;
    });
    return { nums, pre: (pre ?? '').trim() };
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < 3; i += 1) {
    const x = left.nums[i] ?? 0;
    const y = right.nums[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  if (left.pre === right.pre) return 0;
  if (left.pre === '') return 1;
  if (right.pre === '') return -1;
  return left.pre < right.pre ? -1 : 1;
}

/** 读一个 >= 0 的有限数字（允许 0：`padding: 0` 是合法用法）。 */
function readPositive(field: string, v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new WidgetSpecError(field, '必须是非负数字');
  }
  return Math.round(v);
}

function readSize(field: string, v: unknown): WidgetSize {
  if (!isRecord(v)) throw new WidgetSpecError(field, '必须是 { w, h } 对象');
  const w = v['w'];
  const h = v['h'];
  if (!isPositiveInt(w)) throw new WidgetSpecError(`${field}.w`, '必须是正数');
  if (!isPositiveInt(h)) throw new WidgetSpecError(`${field}.h`, '必须是正数');
  return { w: Math.round(w), h: Math.round(h) };
}

/**
 * 校验并规范化一个描述符。
 *
 * @param raw - 插件传入的原始对象（`unknown`：不信任任何 `any`）。
 * @param frameworkVersion - 当前框架版本，用于 `minFramework` 判定。
 * @returns 填好默认值的规范化描述符。
 * @throws {WidgetSpecError} 任一字段不合法（中文、指出字段与期望）。
 */
export function normalizeDescriptor(
  raw: unknown,
  frameworkVersion: string = FRAMEWORK_VERSION,
): NormalizedWidget {
  if (!isRecord(raw)) throw new WidgetSpecError('descriptor', '必须是对象');

  // ── id ──
  const id = raw['id'];
  if (typeof id !== 'string' || id === '') throw new WidgetSpecError('id', '必填，字符串');
  if (!WIDGET_ID_PATTERN.test(id)) {
    throw new WidgetSpecError('id', `必须匹配 ${String(WIDGET_ID_PATTERN)}（例：'my-plugin:clock'）`);
  }
  const owner = id.slice(0, id.indexOf(':'));

  // ── title / icon ──
  if (!isText(raw['title'])) throw new WidgetSpecError('title', '必填，字符串或返回字符串的函数');
  if (raw['icon'] === undefined || raw['icon'] === null)
    throw new WidgetSpecError('icon', '必填，React 节点');
  const subtitle = raw['subtitle'] === undefined ? null : raw['subtitle'];
  if (subtitle !== null && !isText(subtitle)) {
    throw new WidgetSpecError('subtitle', '必须是字符串或返回字符串的函数');
  }

  // ── order ──
  const orderRaw = raw['order'] ?? 0;
  if (typeof orderRaw !== 'number' || !Number.isFinite(orderRaw)) {
    throw new WidgetSpecError('order', '必须是有限数字');
  }

  // ── presentation ──
  const presentation = raw['presentation'];
  if (!PRESENTATIONS.includes(presentation as (typeof PRESENTATIONS)[number])) {
    throw new WidgetSpecError('presentation', `必填，取 ${PRESENTATIONS.join(' | ')}`);
  }
  const frame = presentation as (typeof PRESENTATIONS)[number];

  // ── minFramework ──
  const minFramework = raw['minFramework'];
  if (minFramework !== undefined) {
    if (typeof minFramework !== 'string') throw new WidgetSpecError('minFramework', '必须是版本字符串');
    if (compareVersions(frameworkVersion, minFramework) < 0) {
      throw new WidgetSpecError(
        'minFramework',
        `本组件要求 @dshp/widget-kit >= ${minFramework}，当前是 ${frameworkVersion}，请先升级框架`,
      );
    }
  }

  // ── trayIcon（是否在活动栏放图标）──
  const trayIconRaw = raw['trayIcon'];
  if (trayIconRaw !== undefined && typeof trayIconRaw !== 'boolean') {
    throw new WidgetSpecError('trayIcon', '必须是 boolean');
  }
  const trayIcon = trayIconRaw !== false;
  if (!trayIcon && frame !== 'card') {
    throw new WidgetSpecError(
      'trayIcon',
      "只有 presentation: 'card' 能不显示图标（'tray' 没有图标就没有意义，'popover' 需要图标当锚点）",
    );
  }

  // ── listedInBox（允许被「组件箱」收录）──
  const listedInBoxRaw = raw['listedInBox'];
  if (listedInBoxRaw !== undefined && typeof listedInBoxRaw !== 'boolean') {
    throw new WidgetSpecError('listedInBox', '必须是 boolean');
  }
  const listedInBox = listedInBoxRaw === true;
  if (listedInBox && frame !== 'card') {
    throw new WidgetSpecError(
      'listedInBox',
      "只有 presentation: 'card' 能被「组件箱」收录（它是自由卡片的统一入口）",
    );
  }

  // ── tray ──
  const trayRaw = raw['tray'];
  if (trayRaw !== undefined && !isRecord(trayRaw)) throw new WidgetSpecError('tray', '必须是对象');
  const trayObj = isRecord(trayRaw) ? trayRaw : {};
  const badge = trayObj['badge'];
  if (badge !== undefined && typeof badge !== 'function') {
    throw new WidgetSpecError('tray.badge', '必须是函数');
  }
  const labelRaw = trayObj['label'];
  if (labelRaw !== undefined && typeof labelRaw !== 'string' && typeof labelRaw !== 'function') {
    throw new WidgetSpecError('tray.label', '必须是字符串或返回字符串的函数');
  }
  if (typeof labelRaw === 'string' && labelRaw.length > TRAY_LABEL_MAX_CHARS) {
    throw new WidgetSpecError(
      'tray.label',
      `最多 ${String(TRAY_LABEL_MAX_CHARS)} 个字（活动栏只留少量文字的位置）`,
    );
  }
  const badgeIntervalRaw = trayObj['badgeIntervalMs'] ?? SPEC_DEFAULTS.badgeIntervalMs;
  if (typeof badgeIntervalRaw !== 'number' || !Number.isFinite(badgeIntervalRaw)) {
    throw new WidgetSpecError('tray.badgeIntervalMs', '必须是数字（毫秒）');
  }
  if (
    badgeIntervalRaw < SPEC_DEFAULTS.badgeIntervalMinMs ||
    badgeIntervalRaw > SPEC_DEFAULTS.badgeIntervalMaxMs
  ) {
    throw new WidgetSpecError(
      'tray.badgeIntervalMs',
      `必须在 ${String(SPEC_DEFAULTS.badgeIntervalMinMs)}–${String(SPEC_DEFAULTS.badgeIntervalMaxMs)} 之间`,
    );
  }

  // ── content ──
  const contentRaw = raw['content'];
  if (frame === 'tray') {
    if (contentRaw !== undefined) {
      throw new WidgetSpecError('content', "presentation 为 'tray' 时不应提供 content（没有内容面）");
    }
  } else if (!isRecord(contentRaw)) {
    throw new WidgetSpecError('content', `presentation 为 '${frame}' 时必填`);
  }
  const contentObj = isRecord(contentRaw) ? contentRaw : {};
  let content: NormalizedWidget['content'] = null;
  if (frame !== 'tray') {
    const render = contentObj['render'];
    if (typeof render !== 'function') throw new WidgetSpecError('content.render', '必填，函数');
    const load = contentObj['load'];
    if (load !== undefined && typeof load !== 'function')
      throw new WidgetSpecError('content.load', '必须是函数');
    const contentTitle = contentObj['title'];
    if (contentTitle !== undefined && !isText(contentTitle)) {
      throw new WidgetSpecError('content.title', '必须是字符串或返回字符串的函数');
    }
    const refreshRaw = contentObj['refreshMs'] ?? 0;
    if (typeof refreshRaw !== 'number' || !Number.isFinite(refreshRaw) || refreshRaw < 0) {
      throw new WidgetSpecError('content.refreshMs', '必须是非负数字（毫秒）');
    }
    if (refreshRaw !== 0 && refreshRaw < SPEC_DEFAULTS.refreshMinMs) {
      throw new WidgetSpecError(
        'content.refreshMs',
        `要么为 0（不轮询），要么 >= ${String(SPEC_DEFAULTS.refreshMinMs)}`,
      );
    }
    content = {
      title: contentTitle ?? null,
      load: (load as ((ctx: WidgetLoadContext) => Promise<unknown>) | undefined) ?? null,
      refreshMs: refreshRaw,
      render: render as (props: WidgetContentProps<unknown>) => ReactNode,
    };
  }

  // ── popover ──
  const popoverRaw = raw['popover'];
  if (popoverRaw !== undefined && !isRecord(popoverRaw)) {
    throw new WidgetSpecError('popover', '必须是对象');
  }
  if (popoverRaw !== undefined && frame !== 'popover') {
    throw new WidgetSpecError('popover', "只有 presentation 为 'popover' 时才接受 popover 配置");
  }
  const popoverObj = isRecord(popoverRaw) ? popoverRaw : {};
  let popover: NormalizedWidget['popover'] = null;
  if (frame === 'popover') {
    const triggerRaw = popoverObj['trigger'] ?? 'click';
    if (triggerRaw !== 'click' && triggerRaw !== 'hover') {
      throw new WidgetSpecError('popover.trigger', "取 'click'（点图标展开）或 'hover'（悬停展开）");
    }
    const sideRaw = popoverObj['side'] ?? 'bottom';
    if (sideRaw !== 'bottom' && sideRaw !== 'top') {
      throw new WidgetSpecError('popover.side', "取 'bottom' 或 'top'");
    }
    const width =
      popoverObj['width'] === undefined ? null : readPositive('popover.width', popoverObj['width']);
    if (width !== null && (width < 160 || width > 2000)) {
      throw new WidgetSpecError('popover.width', '必须在 160–2000 px 之间');
    }
    const maxHeight =
      popoverObj['maxHeight'] === undefined
        ? null
        : readPositive('popover.maxHeight', popoverObj['maxHeight']);
    if (maxHeight !== null && (maxHeight < 120 || maxHeight > SPEC_DEFAULTS.popoverMaxHeightMax)) {
      throw new WidgetSpecError(
        'popover.maxHeight',
        `必须在 120–${String(SPEC_DEFAULTS.popoverMaxHeightMax)} px 之间`,
      );
    }
    const padding =
      popoverObj['padding'] === undefined
        ? SPEC_DEFAULTS.popoverPadding
        : readPositive('popover.padding', popoverObj['padding']);
    if (padding > 48) throw new WidgetSpecError('popover.padding', '不得超过 48 px');
    const hoverOpenDelayMs =
      popoverObj['hoverOpenDelayMs'] === undefined
        ? SPEC_DEFAULTS.hoverOpenDelayMs
        : readPositive('popover.hoverOpenDelayMs', popoverObj['hoverOpenDelayMs']);
    const hoverCloseDelayMs =
      popoverObj['hoverCloseDelayMs'] === undefined
        ? SPEC_DEFAULTS.hoverCloseDelayMs
        : readPositive('popover.hoverCloseDelayMs', popoverObj['hoverCloseDelayMs']);
    if (hoverOpenDelayMs > 2000 || hoverCloseDelayMs > 2000) {
      throw new WidgetSpecError('popover.hoverOpenDelayMs', '延迟不得超过 2000 ms');
    }
    popover = {
      trigger: triggerRaw,
      width,
      maxHeight,
      padding,
      side: sideRaw,
      header: readBool('popover.header', popoverObj['header'], true),
      hoverOpenDelayMs,
      hoverCloseDelayMs,
      persistent: readBool('popover.persistent', popoverObj['persistent'], SPEC_DEFAULTS.popoverPersistent),
    };
  }

  // ── card ──
  const cardRaw = raw['card'];
  if (cardRaw !== undefined && !isRecord(cardRaw)) throw new WidgetSpecError('card', '必须是对象');
  if (cardRaw !== undefined && frame !== 'card') {
    throw new WidgetSpecError('card', "只有 presentation 为 'card' 时才接受 card 配置");
  }
  const cardObj = isRecord(cardRaw) ? cardRaw : {};
  let card: NormalizedWidget['card'] = null;
  if (frame === 'card') {
    const floor = SPEC_DEFAULTS.cardFloorSize;
    const minSize = cardObj['minSize'] === undefined ? floor : readSize('card.minSize', cardObj['minSize']);
    const maxSize = cardObj['maxSize'] === undefined ? null : readSize('card.maxSize', cardObj['maxSize']);
    const defaultSize =
      cardObj['defaultSize'] === undefined
        ? SPEC_DEFAULTS.cardDefaultSize
        : readSize('card.defaultSize', cardObj['defaultSize']);
    if (minSize.w < floor.w || minSize.h < floor.h) {
      throw new WidgetSpecError('card.minSize', `不得小于框架地板 ${floor.w}×${floor.h}`);
    }
    if (maxSize && (maxSize.w < minSize.w || maxSize.h < minSize.h)) {
      throw new WidgetSpecError('card.maxSize', '不得小于 card.minSize');
    }
    if (defaultSize.w < minSize.w || defaultSize.h < minSize.h) {
      throw new WidgetSpecError('card.defaultSize', '不得小于 card.minSize');
    }
    if (maxSize && (defaultSize.w > maxSize.w || defaultSize.h > maxSize.h)) {
      throw new WidgetSpecError('card.defaultSize', '不得大于 card.maxSize');
    }
    const bpRaw = cardObj['sizeClassBreakpoints'];
    if (bpRaw !== undefined && !isRecord(bpRaw)) {
      throw new WidgetSpecError('card.sizeClassBreakpoints', '必须是 { compact, wide }');
    }
    const bpObj = isRecord(bpRaw) ? bpRaw : {};
    const compact = bpObj['compact'] ?? SPEC_DEFAULTS.breakpoints.compact;
    const wide = bpObj['wide'] ?? SPEC_DEFAULTS.breakpoints.wide;
    if (!isPositiveInt(compact) || !isPositiveInt(wide)) {
      throw new WidgetSpecError('card.sizeClassBreakpoints', 'compact / wide 必须是正数');
    }
    if (compact >= wide) {
      throw new WidgetSpecError('card.sizeClassBreakpoints', 'compact 必须小于 wide');
    }
    card = {
      defaultSize,
      minSize,
      maxSize,
      breakpoints: { compact: Math.round(compact), wide: Math.round(wide) },
      resizable: readBool('card.resizable', cardObj['resizable'], true),
      minimizable: readBool('card.minimizable', cardObj['minimizable'], true),
      closable: readBool('card.closable', cardObj['closable'], true),
    };
  }

  return {
    id,
    owner,
    title: raw['title'] as string | (() => string),
    icon: raw['icon'] as ReactNode,
    subtitle: subtitle as string | (() => string) | null,
    order: orderRaw,
    presentation: frame,
    tray: {
      badge: (badge as NormalizedWidget['tray']['badge']) ?? null,
      badgeIntervalMs: Math.round(badgeIntervalRaw),
      label: (labelRaw as string | (() => string) | undefined) ?? null,
    },
    trayIcon,
    listedInBox,
    content,
    card,
    popover,
  };
}

/** 不抛版本：供自检脚本与设置页使用。 */
export function validateDescriptor(
  raw: unknown,
  frameworkVersion: string = FRAMEWORK_VERSION,
): { ok: true; value: NormalizedWidget } | { ok: false; error: string; field: string } {
  try {
    return { ok: true, value: normalizeDescriptor(raw, frameworkVersion) };
  } catch (error) {
    if (error instanceof WidgetSpecError) {
      return { ok: false, error: error.message, field: error.field };
    }
    return { ok: false, error: String((error as Error)?.message ?? error), field: 'descriptor' };
  }
}

/**
 * 规范里出现的全部字段名（`spec.d.ts` 必须同集合）。
 *
 * `scripts/check-spec-drift.mjs` 逐条比对：类型文件与实现漂移 = 测试失败。
 */
export const SPEC_KEYS = {
  descriptor: [
    'id',
    'title',
    'icon',
    'subtitle',
    'order',
    'presentation',
    'trayIcon',
    'listedInBox',
    'tray',
    'content',
    'card',
    'popover',
    'minFramework',
  ],
  tray: ['badge', 'badgeIntervalMs', 'label'],
  popover: [
    'trigger',
    'width',
    'maxHeight',
    'padding',
    'side',
    'header',
    'hoverOpenDelayMs',
    'hoverCloseDelayMs',
    'persistent',
  ],
  content: ['title', 'load', 'refreshMs', 'render'],
  card: ['defaultSize', 'minSize', 'maxSize', 'sizeClassBreakpoints', 'resizable', 'minimizable', 'closable'],
  size: ['w', 'h'],
  summary: ['id', 'title', 'owner', 'presentation', 'listedInBox'],
  box: ['width', 'height'],
  badge: ['text', 'dot', 'tone', 'title'],
  badgeContext: ['sessionId', 'signal', 'frameworkVersion'],
  loadContext: ['sessionId', 'signal', 'reason'],
  contentProps: [
    'frame',
    'sessionId',
    'status',
    'data',
    'error',
    'stale',
    'lastUpdatedAt',
    'size',
    'sizeClass',
    'setSize',
    'minimized',
    'locked',
    'refresh',
    'retry',
    'close',
  ],
  service: [
    'specVersion',
    'frameworkVersion',
    'register',
    'list',
    'subscribe',
    'open',
    'close',
    'toggle',
    'isOpen',
    'minimize',
    'restore',
    'setEnabled',
    'isEnabled',
    'setLocked',
    'isLocked',
  ],
} as const;
