/**
 * background.ts —— 背景效果舞台 + 效果登记表
 *
 * **为什么与主题正交**：官网那块背景是 canvas，不是一组 CSS 变量；而 token 契约要求每套主题
 * 覆盖**同一批** 133 个 `--dsw-*` 键（`scripts/check-themes.mjs` 拿 `THEME_CATALOG[0]` 的键集
 * 比对其它主题）。给单套主题加「动效开关」会直接破坏契约。所以分层：token 层（Host 下发，全主题
 * 同构）只管颜色/字体/圆角，动效层登记在本文件的 `BACKGROUNDS` 表里，两边各自完整、互不侵入。
 *
 * 进一步地，动效**不绑主题 id**：效果自己从当前生效的 token 现读颜色与字体，所以任何效果都能挂到
 * 任何主题上。主题只通过 `THEME_DEFAULT_EFFECT` 提供一个「用户没选时的默认效果」，用户显式选过
 * 就一直跟着选（`resolveBackgroundEffectId` 的第二个参数）。
 *
 * **舞台 / 效果的边界**：舞台管「能不能看见」，效果管「看见什么」。
 *  - 舞台：`<style>` 注入、`#dshp-ws-ambient` 容器、`#root` 抬层、把不透明的壳面压薄
 *    （`softenShells` + `MutationObserver`：铺满视口的那几级 + 侧边栏那一列）、canvas 建板与 dpr/尺寸、
 *    30fps 节拍、visibility 停帧、resize 去抖、`prefers-reduced-motion` 单帧、以及严格反序收回这一切。
 *  - 效果：`mount` 里烘自己的美术状态（采样 / LUT），`draw` 每帧画一次，`<style>` 只写自己那几个选择器。
 *
 * 通透度预算是**舞台属性**，不让单个效果擅自调深：正文对比度是全部效果共同付的代价，所以
 * `SHELL_KEEP` 住在这里。`kind: 'dom'` 的效果根本不建 canvas、不绑 mousemove/resize、不起 rAF
 * —— 零帧成本是结构性的，不是优化出来的。
 *
 * 颜色一律从 token 取（`--dsw-alias-brand-primary` / `--dsw-font-*-font-family`），不写死色值；
 * `color-mix(…, black)` 里的 black 与遮罩通道的黑白是**对比度端点**，与 GallerySection 的 `inkOn`
 * 同理，不是主题色。
 *
 * @module @dshp/web-style/client
 */
import { auroraEffect } from './background-aurora.js';
import { flowEffect } from './background-flow.js';
import { harnessDotsEffect } from './background-dots.js';

/** 舞台容器 id：挂在 body 上、`#root` 之下。 */
const STAGE_ID = 'dshp-ws-ambient';
const STYLE_ID = 'dshp-ws-ambient-css';
/** 画布 id 前缀，完整 id = 前缀 + 效果 id（防撞：与主题 token 同一家族命名）。 */
const CANVAS_PREFIX = 'dshp-ws-ambient-';

/** 帧率上限与 dpr 上限（站点 `fps={30}` / `dpr={[1, 1.5]}`）。 */
const FRAME_MS = 1000 / 30;
const MAX_DPR = 1.5;
/** resize 去抖：只重算几何与重画，重采样由效果自己决定。 */
const RESIZE_MS = 180;

/**
 * 壳面留色率。DSH 从 `#root` 往下有若干级**不透明**面铺满视口（实测两级：外层 frame
 * 与主视图 root，都吃 `--dsw-alias-bg-base`），舞台挂在它们底下会被整个盖住。比这个 alpha
 * 更实心的壳面一律压到它；本来就比它透的（主题自己画了 `rgba(...,0.55)`）不动——尊重主题，
 * 也别把它加浓。逐级独立合成，两级叠乘后只剩 `0.4 × 0.4 ≈ 16%` 通透度。
 * 只改 alpha，颜色取它们自己的计算值，所以亮/暗切换时它自己会跟着官方色走。
 * 0.6 是实测标定的：再往上（0.7）背景几乎看不见，再往下（0.55）开始吃正文对比度。
 * 要换强弱先调效果自己的增益常数，动这个常数就是拿正文可读性换背景。
 * **侧边栏那一列同吃这份预算**（见 `isShellFace` 的 `rail` 档）：通透度是全局属性，给两处两个常数
 * 迟早会漂移成一个「看得出背景」一个「看不见」。
 */
const SHELL_KEEP = 0.6;
/** 侧栏探针：2% 视口宽，收起成 56px 轨道时也落在栏内。 */
const RAIL_PROBE: readonly [number, number] = [0.02, 0.5];
/** 探针（视口比例）：主区 / 顶栏 / 输入区，三条命中链的并集就是需要透出的铺满视口的壳面。 */
const SHELL_PROBES: ReadonlyArray<readonly [number, number]> = [
  [0.6, 0.5],
  [0.5, 0.03],
  [0.5, 0.93],
];
/** 纵向铺满的门槛（视口比例），两档壳面共用。比这小的不透明面（气泡、卡片、代码块）保持实心——那些是要读字的。 */
const SHELL_MIN_FILL = 0.4;
/** 侧栏那一档的横向上限：一条真正的侧栏是「绝对宽度」，不随视口放大。 */
const RAIL_MAX_WIDTH = 380;
/** 但窄窗口下比例上限要更宽，否则 260px 的栏在 700px 窗口里（37%）会被判成「不是侧栏」。 */
const RAIL_MAX_WIDTH_FILL = 0.3;
/** 贴左缘的容差：窗口控件/内边距会把侧栏推到 x≈8。 */
const RAIL_EDGE_TOLERANCE = 16;
/** 壳面重扫去抖：React 重建节点后要把新壳面压回去。 */
const SHELL_SCAN_MS = 300;

/* --------------------------------------------------------------------------- 契约 */

/** 交给 canvas 类效果的单帧上下文。 */
export interface BackgroundFrame {
  /** 已 `setTransform(dpr,…)`，所以绘制尺寸一律是 CSS 像素 */
  readonly ctx: CanvasRenderingContext2D;
  /** 画布 CSS 宽（= 舞台宽） */
  readonly width: number;
  /** 画布 CSS 高（= 视口高 × coverage，已取整） */
  readonly height: number;
  /** 实际生效的 dpr（≤ MAX_DPR），舞台已应用 */
  readonly dpr: number;
  /** 累计节拍时间（秒）。reduced 那一帧为 0，效果自己决定「装配完成态」取哪个时刻 */
  readonly time: number;
  /** 距上一合格帧的秒数，夹 0.1（切后台回来不会瞬移） */
  readonly dt: number;
  /** 指针归一化设备坐标：x/y ∈ [-1,1]，y 向上为正，相对画布中心；从未移动过为 0,0 */
  readonly pointer: { readonly x: number; readonly y: number; readonly active: boolean };
  /** true = 本次挂载的唯一一帧，效果要自绘静态成品 */
  readonly reduced: boolean;
}

/** 舞台给效果的最小能力面。 */
export interface StageApi {
  /** `#dshp-ws-ambient`，dom 类效果往这里 append 自己的节点 */
  readonly stage: HTMLElement;
  /** 读一个当前生效的 CSS 自定义属性（覆盖层写入后即可拿到，含亮暗分支） */
  readToken(name: string, fallback: string): string;
}

export interface CanvasStageApi extends StageApi {
  readonly canvas: HTMLCanvasElement;
}

interface EffectBase {
  readonly id: string;
  readonly label: string;
  /** 设置页悬停提示：这个效果是什么、代价是什么。 */
  readonly hint: string;
}

/** 纯 CSS / DOM 效果：舞台不建画布、不绑监听、不起 rAF，零帧成本是结构性的。 */
export interface DomBackgroundEffect extends EffectBase {
  readonly kind: 'dom';
  mount(api: StageApi): () => void;
}

/** 逐帧绘制的效果。`mount` 烘状态，`draw` 是每帧唯一入口，必须 O(自身元素数)。 */
export interface CanvasBackgroundEffect extends EffectBase {
  readonly kind: 'canvas';
  /** 画布高占视口比，缺省 1 */
  readonly coverage?: number;
  /** 重采样 / 烘 LUT —— 此刻 token 已生效。几何不用问舞台：每帧从 `frame.width/height` 重算 */
  mount(api: CanvasStageApi): () => void;
  draw(frame: BackgroundFrame): void;
}

export type BackgroundEffect = DomBackgroundEffect | CanvasBackgroundEffect;

/* --------------------------------------------------------------------------- 共享小工具 */

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** GLSL smoothstep(edge0, edge1, x)，支持 edge0 > edge1 的反向。 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** 站点着色器的 per-particle 静态抖动哈希。 */
export function hash(i: number, k: number, c: number): number {
  const s = Math.sin(i * k) * c;
  return s - Math.floor(s) - 0.5;
}

/** 读一个当前生效的 CSS 自定义属性（覆盖层写入后即可拿到，含亮暗分支）。 */
function readToken(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v.length > 0 ? v : fallback;
  } catch {
    return fallback;
  }
}

/** `#rrggbb` → [r,g,b] 归一化；解析失败回 fallback。 */
export function hexToRgb(hex: string, fallback: readonly number[]): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return [fallback[0] as number, fallback[1] as number, fallback[2] as number];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** 解析 computed `backgroundColor`（`rgb()` / `rgba()` / 空格语法），拿不到返回 null。 */
function parseRgbColor(value: string): [number, number, number, number] | null {
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(value.trim());
  if (!m) return null;
  const raw = m[4];
  const alpha = raw === undefined ? 1 : raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
  return [Number(m[1]), Number(m[2]), Number(m[3]), alpha];
}

/* --------------------------------------------------------------------------- 舞台 */

/**
 * 舞台样式：只有容器定位与画布铺法。极光、遮罩是效果自己的事；也因此**不进 CSS Modules**——
 * 目标选择器是运行时拼的全局 id，module 哈希会改掉名字（`check-plugin-css-unique.mjs` 不管它，
 * 所以继续带 `dshp-ws-` 前缀防撞）。
 */
const STAGE_CSS = `
#${STAGE_ID} {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  contain: strict;
}
#${STAGE_ID} > canvas {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
}
`;

/** 建舞台并驱动一个效果；返回精确反序收回的 disposer。抛错时已把 DOM 收干净。 */
function mountStage(effect: BackgroundEffect): () => void {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STAGE_CSS;
  document.head.appendChild(style);

  const stage = document.createElement('div');
  stage.id = STAGE_ID;
  stage.setAttribute('aria-hidden', 'true');
  document.body.appendChild(stage);

  // #root 自身无背景规则（DSH 的底色画在 body 上），抬到 z-index:1 让舞台落在
  // 「body 底色之上、应用内容之下」。但 #root 里面还有几级不透明壳面铺满视口，
  // 不把它们压薄就什么都看不见——见 softenShells。
  const root = document.getElementById('root');
  const rootPrevPosition = root ? root.style.position : '';
  const rootPrevZIndex = root ? root.style.zIndex : '';
  if (root) {
    root.style.position = 'relative';
    root.style.zIndex = '1';
  }

  // 首次记录 inline 原值，重复扫描不覆盖：否则第二次存进去的就是我们改过的值，还原会失真
  const shellPrev = new Map<HTMLElement, string>();
  /**
   * 这一格位置算不算「该透出的壳面」。**只量几何，不认 class**：DSH 的类名是 CSS Module 哈希，
   * 客户端一升级就换，咬住它等于每周坏一次。
   *
   * - `shell`：横竖都铺满视口的大壳（外层 frame、主视图 root）；
   * - `rail`：贴左缘、纵向铺满、横向只占一小条的那一列 = 侧边栏。它本来就够不着 `shell` 的
   *   宽度门槛（240px 的栏 ÷ 1500px 视口 = 16%），所以早先永远是实心的，背景效果被整条栏盖住。
   */
  const isShellFace = (rect: DOMRect, kind: 'shell' | 'rail'): boolean => {
    if (kind === 'rail') {
      return (
        rect.left <= RAIL_EDGE_TOLERANCE &&
        rect.height >= window.innerHeight * SHELL_MIN_FILL &&
        rect.width > 0 &&
        rect.width <= Math.max(RAIL_MAX_WIDTH, window.innerWidth * RAIL_MAX_WIDTH_FILL)
      );
    }
    return (
      rect.width >= window.innerWidth * SHELL_MIN_FILL && rect.height >= window.innerHeight * SHELL_MIN_FILL
    );
  };
  const soften = (el: HTMLElement): void => {
    if (shellPrev.has(el)) return;
    const own = parseRgbColor(getComputedStyle(el).backgroundColor);
    // 比预算更实心才压（含完全实心）；主题自己已经画得比 SHELL_KEEP 更透的就尊重它，别倒过来加浓
    if (!own || own[3] <= SHELL_KEEP) return;
    shellPrev.set(el, el.style.backgroundColor);
    el.style.backgroundColor = 'rgba(' + own[0] + ',' + own[1] + ',' + own[2] + ',' + SHELL_KEEP + ')';
  };
  const softenShells = (): void => {
    if (!root) return;
    const sweep = (x: number, y: number, kind: 'shell' | 'rail'): void => {
      let el: Element | null = document.elementFromPoint(x, y);
      while (el && el !== root && root.contains(el)) {
        if (el instanceof HTMLElement && isShellFace(el.getBoundingClientRect(), kind)) {
          soften(el);
        }
        el = el.parentElement;
      }
    };
    for (const [fx, fy] of SHELL_PROBES) sweep(window.innerWidth * fx, window.innerHeight * fy, 'shell');
    sweep(window.innerWidth * RAIL_PROBE[0], window.innerHeight * RAIL_PROBE[1], 'rail');
  };
  softenShells();
  // React 重建壳面节点后要把新节点压回去；只观察 childList，自己写的 inline 样式不会回流自激
  let shellTimer: number | null = null;
  const shellObserver =
    root && typeof MutationObserver === 'function'
      ? new MutationObserver(() => {
          if (shellTimer !== null) return;
          shellTimer = window.setTimeout(() => {
            shellTimer = null;
            softenShells();
          }, SHELL_SCAN_MS);
        })
      : null;
  if (shellObserver && root) shellObserver.observe(root, { childList: true, subtree: true });
  const restoreShells = (): void => {
    shellObserver?.disconnect();
    if (shellTimer !== null) window.clearTimeout(shellTimer);
    for (const [el, prev] of shellPrev) el.style.backgroundColor = prev;
    shellPrev.clear();
  };

  const cleanupDom = (): void => {
    restoreShells();
    stage.remove();
    style.remove();
    if (root) {
      root.style.position = rootPrevPosition;
      root.style.zIndex = rootPrevZIndex;
    }
  };

  // dom 类效果到此为止：没有画布、没有鼠标监听、没有 rAF
  if (effect.kind === 'dom') {
    const disposeEffect = effect.mount({ stage, readToken });
    return (): void => {
      disposeEffect();
      cleanupDom();
    };
  }

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const coverage = effect.coverage ?? 1;
  const canvas = document.createElement('canvas');
  canvas.id = CANVAS_PREFIX + effect.id;
  canvas.style.height = coverage * 100 + '%';

  const g2d = canvas.getContext('2d', { alpha: true });
  // 拿不到 2d 上下文就退回「只有极光、没有点阵」：舞台照常收回
  if (!g2d) return cleanupDom;
  const ctx: CanvasRenderingContext2D = g2d;

  const disposeEffect = effect.mount({ stage, canvas, readToken });
  // 效果自己的节点先 append、画布后 append：两者都是绝对定位且无 z-index，
  // DOM 顺序就是叠放顺序，极光必须在点阵底下。
  stage.appendChild(canvas);

  let width = 0;
  let height = 0;
  const layout = (): void => {
    width = window.innerWidth;
    height = Math.max(1, Math.round(window.innerHeight * coverage));
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  layout();

  let raf = 0;
  let disposed = false;
  let prevStamp = 0;
  let lastFrame = 0;
  let t = 0;
  let ndcX = 0;
  let ndcY = 0;
  let pointerActive = false;
  let resizeTimer = 0;

  const paint = (time: number, dt: number): void => {
    effect.draw({
      ctx,
      width,
      height,
      dpr,
      time,
      dt,
      pointer: { x: ndcX, y: ndcY, active: pointerActive },
      reduced,
    });
  };

  const onMove = (e: MouseEvent): void => {
    const r = canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    ndcX = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndcY = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointerActive = true;
  };
  const onLeave = (): void => {
    pointerActive = false;
  };
  const onVisibility = (): void => {
    if (document.hidden) pointerActive = false;
  };
  const onResize = (): void => {
    if (resizeTimer !== 0) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      layout();
      // 静态那一路（reduced，或已收回）也要跟着改尺寸重画一次
      if (disposed || raf === 0) paint(t, 0);
    }, RESIZE_MS);
  };

  const step = (stamp: number): void => {
    if (disposed) return;
    raf = window.requestAnimationFrame(step);
    if (stamp - lastFrame < FRAME_MS) return;
    lastFrame = stamp - ((stamp - lastFrame) % FRAME_MS);
    if (document.visibilityState === 'hidden') return;
    const dt = prevStamp === 0 ? FRAME_MS / 1000 : Math.min(0.1, (stamp - prevStamp) / 1000);
    prevStamp = stamp;
    t += dt;
    paint(t, dt);
  };

  if (reduced) {
    paint(0, 0);
  } else {
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize, { passive: true });
    raf = window.requestAnimationFrame(step);
  }

  return (): void => {
    disposed = true;
    if (raf !== 0) window.cancelAnimationFrame(raf);
    if (resizeTimer !== 0) window.clearTimeout(resizeTimer);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    disposeEffect();
    cleanupDom();
  };
}

/* --------------------------------------------------------------------------- 登记表 */

/** 效果登记表：效果 id → 效果。没登记的 id 一律「无背景」。 */
const BACKGROUNDS: Readonly<Record<string, BackgroundEffect>> = {
  [harnessDotsEffect.id]: harnessDotsEffect,
  [auroraEffect.id]: auroraEffect,
  [flowEffect.id]: flowEffect,
};

/**
 * 主题 → 默认效果。**这张表是主题与背景之间唯一的联系**，所以不能写进 `themes.ts` 的 meta：
 * `check-themes.mjs` 用严格正则咬 meta 的字段集合与顺序，加字段会直接 FAIL。
 */
const THEME_DEFAULT_EFFECT: Readonly<Record<string, string>> = {
  'harness-office': harnessDotsEffect.id,
};

/**
 * 设置页选项清单，顺序 = 登记表插入顺序。id/label/hint 都来自效果本体，这里不再抄一遍，
 * 免得登记表和清单两处漂移。
 */
export const BACKGROUND_OPTIONS: ReadonlyArray<{ id: string; label: string; hint: string }> = Object.values(
  BACKGROUNDS,
).map((effect) => ({ id: effect.id, label: effect.label, hint: effect.hint }));

/**
 * 解析本次该挂哪个效果：用户显式选过就一直跟着选（可以把任何效果挂到任何主题上），
 * 没选（空串）才回落到主题默认。空串返回值 = 不挂。
 */
export function resolveBackgroundEffectId(themeId: string, backgroundId: string): string {
  if (backgroundId.length > 0) return backgroundId;
  return Object.hasOwn(THEME_DEFAULT_EFFECT, themeId) ? (THEME_DEFAULT_EFFECT[themeId] as string) : '';
}

let currentDispose: (() => void) | null = null;
let mountedEffectId = '';

/** 挂指定效果：先收回上一层再挂，幂等，重复调用同一 id 会重建舞台。 */
export function mountBackground(effectId: string): void {
  disposeBackground();
  if (effectId.length === 0) return;
  if (!Object.hasOwn(BACKGROUNDS, effectId)) return;
  const effect = BACKGROUNDS[effectId] as BackgroundEffect;
  try {
    currentDispose = mountStage(effect);
    mountedEffectId = effectId;
  } catch (e) {
    currentDispose = null;
    mountedEffectId = '';
    console.error('[dshp-web-style] 背景效果挂载失败：' + String((e as Error)?.message ?? e));
  }
}

/** 撤销当前背景（切主题 / 回官方 / 插件停止）。 */
export function disposeBackground(): void {
  mountedEffectId = '';
  if (!currentDispose) return;
  const dispose = currentDispose;
  currentDispose = null;
  try {
    dispose();
  } catch (e) {
    console.error('[dshp-web-style] 背景效果收回失败：' + String((e as Error)?.message ?? e));
  }
}

/**
 * 官方亮/暗切换后刷新背景：canvas 类效果的颜色是 mount 时从 token 烘进 JS 的，切换后会陈旧，
 * 只能重挂；dom 类走 CSS 变量，自己会跟着变，不用动。
 */
export function refreshBackground(): void {
  if (mountedEffectId.length === 0) return;
  const effect = Object.hasOwn(BACKGROUNDS, mountedEffectId)
    ? (BACKGROUNDS[mountedEffectId] as BackgroundEffect)
    : null;
  if (!effect || effect.kind !== 'canvas') return;
  mountBackground(mountedEffectId);
}
