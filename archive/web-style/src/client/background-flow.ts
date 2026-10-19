/**
 * background-flow.ts —— `flow` 效果：跟着鼠标的流场
 *
 * **不是粒子系统**：固定 N 条流场游子，从不变多或变少。每条游子只有「当前位置 + 上一帧位置」
 * 两个数，速度场是解析的正弦叠加（curl-of-sines），所以每帧成本严格 O(N)、没有邻域查询、
 * 没有生灭簿记、没有数组增删 → 没有 GC 抖动，也不会有「某帧突然多了两百个点」的成本尖峰。
 *
 * 不用真粒子系统（变点数 spawn/kill、Verlet、斥力）的理由：
 *  - 需要历史才长成样子，`prefers-reduced-motion` 的单帧会画出一坨出生点，得专门写暖机；
 *  - 生灭簿记不产生观感；
 *  - 真粒子的收益是「涌现」，而背景层的用途上涌现是负资产——它和正文抢注意力。
 *
 * 环面取模回绕（而不是「出界就杀」）让点数恒定且**无边界**：不需要额外的重播逻辑，
 * 也让任意单帧都是代表帧（场对 t 统计稳态 + 回绕有界）。
 *
 * 拖尾不清屏：帧首用 `destination-out` 薄薄洗一层，把已有像素的 **alpha** 降下来而不是盖上颜色。
 * 画布本身要一直透明——舞台在两级壳面底下只剩约 16% 通透度，用底色洗屏等于给正文铺一层实色，
 * 那是第三张壳。
 *
 * 颜色从 `--dsw-alias-brand-primary` 现读烘成 6 档，近白端点 `FLOW_BASE` 兜底；
 * 客户端不写死任何主题色。
 *
 * @module @dshp/web-style/client
 */
import { hash, hexToRgb } from './background.js';
import type { BackgroundFrame, CanvasBackgroundEffect, CanvasStageApi } from './background.js';

/** 游子数。每子每帧 3 次三角 + 1 段线，实测 720 条在 30fps 节拍内余量充足。 */
const N = 720;
/** 速度场三个分量的空间角频率（每 CSS 像素）与时间漂移（每秒）。 */
const K1 = 0.0055;
const K2 = 0.0071;
const K3 = 0.0038;
const S1 = 0.11;
const S2 = 0.085;
const S3 = 0.062;
/** 基础速度（CSS px/s）与逐子离散。 */
const SPEED = 46;
const SPEED_SPREAD = 0.85;
/** 每帧拖尾衰减：`destination-out` 洗掉的 alpha 比例。太小会糊成一片，太大会看不出轨迹。
 *  0.042 ≈ 24 帧（0.8 s）余晖，铺满视口的效果只有靠长轨迹才能读出「流向」。 */
const FADE = 0.042;
/** 鼠标涡流：半径（CSS px）、切向速度（px/s）与离开后的衰减底。 */
const MOUSE = { radius: 190, speed: 105, decay: 0.12 };
/** 线宽与透明度。加色会让重叠处自己亮起来，所以单条不用太浓。 */
const LINE_W = 1.15;
const LINE_A = 0.6;
/** 速度 → 颜色的档数。 */
const BUCKETS = 6;
/** 近白端点：品牌色直接做流线太沉，末端要往白里走（同点阵的 DOT_LIFT 论证）。 */
const FLOW_BASE = [0.75, 0.8, 0.9] as const;
/** reduced 单帧的暖机步数：让「唯一一帧」也有成形的轨迹，而不是一屏出生点。 */
const WARM_STEPS = 260;
const WARM_DT = 1 / 30;

let xs = new Float32Array(0);
let ys = new Float32Array(0);
let pxs = new Float32Array(0);
let pys = new Float32Array(0);
/** 逐子速度档（同时决定颜色桶）。 */
let spd = new Float32Array(0);
/** 按颜色桶分好的游子下标：桶归属一辈子不变，所以只在 seed 时排一次，
 *  绘制时「一桶一条批量 stroke」不用回头扫全表。 */
let order: number[][] = [];
let colorLut: string[] = [];
let seeded = false;
/** 平滑后的鼠标力度（0..1 归一，乘 `MOUSE.speed`）。 */
let pull = 0;

/** 速度场：三个正弦分量叠加，值域 ±2.5 rad，直接当航向角用。 */
function heading(x: number, y: number, t: number): number {
  return Math.sin(x * K1 + t * S1) + Math.cos(y * K2 - t * S2) + 0.5 * Math.sin((x + y) * K3 + t * S3);
}

/** 把品牌色烘成「慢→快」6 档：慢档贴近品牌色，快档往近白端点走。 */
function buildColorLut(brand: readonly number[]): string[] {
  const lut: string[] = [];
  for (let i = 0; i < BUCKETS; i += 1) {
    const k = i / (BUCKETS - 1);
    const q = (ch: number, base: number): number => {
      const v = ch + (base - ch) * k;
      return Math.max(0, Math.min(255, Math.round(v * 255)));
    };
    lut.push(
      'rgb(' +
        q(brand[0] as number, FLOW_BASE[0]) +
        ',' +
        q(brand[1] as number, FLOW_BASE[1]) +
        ',' +
        q(brand[2] as number, FLOW_BASE[2]) +
        ')',
    );
  }
  return lut;
}

/** 在 [0,w)×[0,h) 上重撒出生位置；只在首帧跑一次，resize 不重撒（会闪）。 */
function seed(width: number, height: number): void {
  xs = new Float32Array(N);
  ys = new Float32Array(N);
  pxs = new Float32Array(N);
  pys = new Float32Array(N);
  spd = new Float32Array(N);
  order = [];
  for (let b = 0; b < BUCKETS; b += 1) order.push([]);
  for (let i = 0; i < N; i += 1) {
    xs[i] = Math.random() * width;
    ys[i] = Math.random() * height;
    pxs[i] = xs[i] as number;
    pys[i] = ys[i] as number;
    // hash() 的返回值在 ±0.5，摊到 1±SPREAD/2 的速度倍率上
    const k = 1 - SPEED_SPREAD / 2 + (hash(i, 12.9898, 43758.5453) + 0.5) * SPEED_SPREAD;
    spd[i] = SPEED * k;
    const b = Math.max(
      0,
      Math.min(BUCKETS - 1, Math.floor(((k - (1 - SPEED_SPREAD / 2)) / SPEED_SPREAD) * BUCKETS)),
    );
    (order[b] as number[]).push(i);
  }
  seeded = true;
}

/** 积分一帧：改位置、按桶画线段。鼠标是每个游子 O(1) 的切向涡流，不做邻域查询。 */
function advance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  dt: number,
  mx: number,
  my: number,
): void {
  const r = MOUSE.radius;
  for (let b = 0; b < BUCKETS; b += 1) {
    ctx.beginPath();
    let open = false;
    for (const i of order[b] as number[]) {
      let x = xs[i] as number;
      let y = ys[i] as number;
      const a = heading(x, y, t);
      const v = spd[i] as number;
      let vx = Math.cos(a) * v;
      let vy = Math.sin(a) * v;
      if (pull > 0.001) {
        const dx = x - mx;
        const dy = y - my;
        const d = Math.hypot(dx, dy);
        if (d < r && d > 1) {
          const k = (1 - d / r) ** 3 * pull * MOUSE.speed;
          const inv = k / d;
          // 切向（垂直于连线）为主，掺一点向心，把流线拧成涡而不是推开
          vx += -dy * inv + dx * inv * 0.2;
          vy += dx * inv + dy * inv * 0.2;
        }
      }
      x += vx * dt;
      y += vy * dt;
      // 环面回绕：无生灭、无池，点数逐帧恒定
      x = ((x % width) + width) % width;
      y = ((y % height) + height) % height;
      const prevX = pxs[i] as number;
      const prevY = pys[i] as number;
      // 跨接缝的那一段不画（否则一条线横穿整个画布）
      if (Math.abs(x - prevX) > width / 2 || Math.abs(y - prevY) > height / 2) {
        xs[i] = x;
        ys[i] = y;
        pxs[i] = x;
        pys[i] = y;
        continue;
      }
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      open = true;
      xs[i] = x;
      ys[i] = y;
      pxs[i] = x;
      pys[i] = y;
    }
    if (open) {
      ctx.strokeStyle = colorLut[b] as string;
      ctx.stroke();
    }
  }
}

export const flowEffect: CanvasBackgroundEffect = {
  id: 'flow',
  label: '流场',
  hint: '720 条程序化流线铺满视口，跟着鼠标拧成涡。',
  kind: 'canvas',

  mount(api: CanvasStageApi): () => void {
    // 品牌色只从 token 拿；拿不到就用 FLOW_BASE 那个中性近白端点
    colorLut = buildColorLut(hexToRgb(api.readToken('--dsw-alias-brand-primary', ''), FLOW_BASE));
    seeded = false;
    pull = 0;
    return (): void => {
      xs = new Float32Array(0);
      ys = new Float32Array(0);
      pxs = new Float32Array(0);
      pys = new Float32Array(0);
      spd = new Float32Array(0);
      order = [];
      colorLut = [];
      seeded = false;
      pull = 0;
    };
  },

  draw(frame: BackgroundFrame): void {
    const { ctx, width, height } = frame;
    if (width <= 0 || height <= 0) return;
    if (!seeded) seed(width, height);

    // NDC（y 向上）→ 画布 CSS 像素（y 向下）
    const mx = (frame.pointer.x * 0.5 + 0.5) * width;
    const my = (0.5 - frame.pointer.y * 0.5) * height;
    pull += ((frame.pointer.active ? 1 : 0) - pull) * (1 - Math.pow(MOUSE.decay, frame.dt));

    ctx.lineCap = 'round';
    ctx.lineWidth = LINE_W;
    /** 一帧：先洗掉上一步的一部分 alpha，再画这一步的线段。globalAlpha 只给线条，
     *  否则洗屏的擦除量会被线条浓度打折，拖尾长度就不受 `FADE` 控制了。 */
    const stepOnce = (time: number, dt: number): void => {
      ctx.globalAlpha = 1;
      wash(ctx, width, height);
      ctx.globalAlpha = LINE_A;
      advance(ctx, width, height, time, dt, mx, my);
    };

    if (frame.reduced) {
      // 只有这一帧可画，先把轨迹暖出来
      for (let s = 0; s < WARM_STEPS; s += 1) stepOnce(s * WARM_DT, WARM_DT);
    } else {
      stepOnce(frame.time, frame.dt);
    }
    ctx.globalAlpha = 1;
  },
};

/** 拖尾：只降 alpha、不铺颜色，画布该透明的地方继续透明。 */
function wash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,' + FADE + ')';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}
