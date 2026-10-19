/**
 * background-dots.ts —— `harness-dots` 效果：可交互点阵字标
 *
 * **移植来源**：deepseek.com/harness 首屏 hero 的 `HeroDigitile`（React Three Fiber +
 * 自定义 GLSL 的 instanced 点阵）。仓库红线要求运行时零依赖，这里把它降级成 Canvas 2D
 * 实现，逐粒子数学逐段照抄；个别常数按「背景层」而不是「hero」重新标定（鼠标力度、暗端
 * 光照，见各处注释）。四处等价改写：
 *   - instanced Box → `fillRect`（`globalCompositeOperation = 'lighter'` = 站点 AdditiveBlending）
 *   - 透视投影 → 相机距离 18 的一阶除法（`p = FOCAL / (FOCAL - z)`）
 *   - 组旋转 → 只保留 rotation.x / rotation.y 的微量视差，**去掉 rotation.z 自转**
 *     （站点那个形状会被拖着转，换成字标就会整行歪掉；自转本来就是给抽象图形用的）
 * 已丢弃：滚动散开（`uScatter`）—— 应用内自行滚动，`window.scrollY` 没有语义。
 *
 * **亮度预算怎么花**：舞台在两级壳面底下只剩约 16% 通透度。站点原样的点阵在这个预算下几乎
 * 读不出来，所以极光收进字标带（`mountAuroraLayers` 的 `heightPct` 实参）、遮罩在字标高度内
 * 全通、点宽与网格成对标、光照只进颜色一次、总增益 `STAGE_GAIN`。这一组是实测标定的，
 * 改之前先跑一次「无气泡正文对比度」再动手。
 *
 * 与站点的有意偏差都写在各常量的注释里。
 *
 * @module @dshp/web-style/client
 */
import { clamp01, hash, hexToRgb, smoothstep } from './background.js';
import type { BackgroundFrame, CanvasBackgroundEffect, CanvasStageApi } from './background.js';
import { mountAuroraLayers } from './background-aurora.js';

/** 采样网格边长。站点用 60（它的源是填满方形的 SVG 轮廓），这里源是一行七个字母：
 * 网格太密（120 / 160 都试过）时点与点之间的留白大于点本身，笔画被逐点随机缩放打成麻点，
 * 整行字标读不成字；90 格对应「字高约 9 行点、笔画约 3 行点」的 LED 屏比例，
 * 既能一眼认出字母，也仍然是分离的点阵而不是实心描边。 */
const GRID = 90;
/** 视野宽度（站点 60 格 × 0.18 = 10.8 单位）。 */
const FIELD = 10.8;
/** 单元格边长（场景单位）。 */
const STEP = FIELD / GRID;
/** 点宽 / 单元格边长。站点是 BoxGeometry(0.06, 0.06, 0.018) → 1/3；这里放到 0.7：
 * 两级壳面把通透度压到约 16%，站点那个尺寸的点在背景层几乎连不成字，
 * 0.7 是「笔画连成一条、但点与点之间仍看得见缝」的实测下限。 */
const DOT_RATIO = 0.7;
/** 亮度阈值：低于它算「背景」，同时用于孤立点剔除与边缘度统计。 */
const THRESHOLD = 0.2;
/** 相机距离（站点 camera.position=[0,0,18]），只用于一阶透视。 */
const FOCAL = 18;
/** 字标占采样网格宽度的比例。 */
const FIT = 0.86;
/** 字标带（画布与极光共用的那条带）高度占视口高度的比例。 */
const BAND_H = 0.56;
/** 字标带内的目标宽度占比（= 站点 shape 相对 viewport 的观感）。 */
const SPAN = 0.62;
/** 空闲摆动强度（站点 `loose` 默认为 0，这里给背景留一点呼吸）。 */
const LOOSE = 0.55;
/** 总增益。舞台在两级壳面底下只剩约 16% 通透度，站点原值（1）在这层预算里读不成字；
 * 1.4 是把点阵的典型 alpha（0.675）推到饱和附近的量，再高只是把亮档切平。 */
const STAGE_GAIN = 1.4;

/** 站点 DIGITILE_MOUSE_DEFAULTS 的两处收口：
 *  - distort 5 → 1.1 rad：实心图形打散后还是那团，一行字标会被整个甩飞；
 *  - strength 0.8 → 0.5：站点鼠标下是一个洞，背景层要留得住字形。 */
const MOUSE = { radius: 4.9, strength: 0.5, decay: 0.2, distort: 1.1 };
/** 站点 DIGITILE_LIGHT_DEFAULTS 的两处背景层改法：光源从右上 (4.5, 5.5, 3) 收到中上
 *  (2.0, 5.5, 6) 并把半径抬到 16 —— 站点的斜射光是打在一个立体块上的，换成一行字标就会
 *  把左半边整个压暗（实测 HAR 只有 NESS 一半亮度）；抬 z 是为了让衰减变缓而不是消失，
 *  留一点侧光才有「被照亮」的质感。暗端 shadeMin 单独抬到 0.7（见下）。 */
const LIGHT = { x: 2.0, y: 5.5, z: 6, range: 16, shadeMax: 2.79, followX: 1.05, shadeMin: 0.7 };
/** 装配缓动（站点 `t-0.3` 起、2.5s 走完、out-cubic）。 */
const ASSEMBLY_DELAY = 0.3;
const ASSEMBLY_DURATION = 2.5;
/** reduced 那一帧取装配完成后的哪个时刻。站点没有这个分支，这里给一个稳定值。 */
const REDUCED_AT = ASSEMBLY_DELAY + ASSEMBLY_DURATION + 1;

/** 画布上写死的美术系数（站点着色器里的常数，非主题色）。 */
const GLOW_TINT = [0.2, 0.3, 0.5] as const;
const WARM_TINT = [1.07, 1.02, 0.94] as const;
const DOT_BASE = [0.75, 0.8, 0.9] as const;
/** 点色向白提亮的比例：品牌色直接做加色太沉，官网那颗点是近白的蓝。 */
const DOT_LIFT = 0.45;

const WORDMARK = 'HARNESS';

/** LUT 档位：颜色只由「光照档 × 光晕档」两维决定，预成表避免每帧造上千字符串。 */
const LIGHT_STEPS = 8;
const GLOW_STEPS = 4;

/** 一粒点：目标位、散开位、亮度、边缘度，以及站点按 aIndex 现算的噪声种子。 */
interface Dot {
  x: number;
  y: number;
  sx: number;
  sy: number;
  sz: number;
  lum: number;
  edge: number;
  /** 逐点缩放：站点是 instanceMatrix 的 0.5..1.5，这里收到 0.85..1.15——字标只有 9 行点，
   * 再大的疏密差会把笔画打断成麻点（抽象图形才受得起那个范围）。 */
  size: number;
  i: number;
  /** 静态抖动（着色器 `fract(sin(i*K)*C)-0.5`，等价预计算）。 */
  jx: number;
  jy: number;
  jz: number;
}

/**
 * 采样：把字标画进 GRID×GRID 的亮度遮罩，再按站点同一套规则出点集
 * （亮度 > 阈值 && 非孤立；边缘度 = 邻域内暗像素占比；散开位 = 半径 3 的扁球壳）。
 * 遮罩的黑白只表示「有没有点」，不是显示色。
 */
function sampleDots(fontStack: string): Dot[] {
  const off = document.createElement('canvas');
  off.width = GRID;
  off.height = GRID;
  const g = off.getContext('2d');
  if (!g) return [];
  g.fillStyle = '#000';
  g.fillRect(0, 0, GRID, GRID);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const ls = g as CanvasRenderingContext2D & { letterSpacing?: string };
  let spaced = WORDMARK;
  if ('letterSpacing' in g) {
    ls.letterSpacing = '0.14em';
  } else {
    spaced = WORDMARK.split('').join(' ');
  }
  let size = GRID * 0.3;
  g.font = '700 ' + size.toFixed(2) + 'px ' + fontStack;
  const measured = g.measureText(spaced).width;
  if (measured > 0) {
    size = Math.max(4, (size * (GRID * FIT)) / measured);
    g.font = '700 ' + size.toFixed(2) + 'px ' + fontStack;
  }
  g.fillText(spaced, GRID / 2, GRID / 2);

  const data = g.getImageData(0, 0, GRID, GRID).data;
  const lum = new Float32Array(GRID * GRID);
  for (let p = 0; p < GRID * GRID; p += 1) {
    const o = p * 4;
    lum[p] = (0.299 * (data[o] ?? 0) + 0.587 * (data[o + 1] ?? 0) + 0.114 * (data[o + 2] ?? 0)) / 255;
  }
  const at = (col: number, row: number): number =>
    col < 0 || row < 0 || col >= GRID || row >= GRID ? 0 : (lum[row * GRID + col] ?? 0);
  /** 站点 `isolated()`：5×5 邻域内没有第二个亮点就丢掉（去掉抗锯齿碎点）。 */
  const isolated = (col: number, row: number): boolean => {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        if (at(col + dx, row + dy) > THRESHOLD) return false;
      }
    }
    return true;
  };
  /** 站点边缘度：8 邻域里「出界或低于阈值」的比例，越大越飘。 */
  const edgeOf = (col: number, row: number): number => {
    let s = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        if (at(col + dx, row + dy) <= THRESHOLD) s += 1;
      }
    }
    return s / 8;
  };

  const half = GRID / 2;
  const dots: Dot[] = [];
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      const l = at(col, row);
      if (l <= THRESHOLD || isolated(col, row)) continue;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 * (0.4 + 0.6 * Math.random());
      const i = dots.length;
      dots.push({
        x: (col - half) * STEP,
        y: (half - row) * STEP,
        sx: Math.sin(phi) * Math.cos(theta) * r,
        sy: Math.sin(phi) * Math.sin(theta) * r,
        sz: Math.cos(phi) * r * 0.5,
        lum: l,
        edge: edgeOf(col, row),
        size: 0.85 + Math.random() * 0.3,
        i,
        jx: hash(i, 12.9898, 43758.5453),
        jy: hash(i, 78.233, 12543.123),
        jz: hash(i, 39.425, 26711.77),
      });
    }
  }
  return dots;
}

/** 把品牌色烘成「光晕档 × 光照档」的颜色表。 */
function buildColorLut(brand: readonly number[]): string[] {
  const base: [number, number, number] = [
    (brand[0] as number) + (1 - (brand[0] as number)) * DOT_LIFT,
    (brand[1] as number) + (1 - (brand[1] as number)) * DOT_LIFT,
    (brand[2] as number) + (1 - (brand[2] as number)) * DOT_LIFT,
  ];
  const lut: string[] = [];
  for (let gi = 0; gi < GLOW_STEPS; gi += 1) {
    const glow = (gi / (GLOW_STEPS - 1)) * 0.3;
    for (let li = 0; li < LIGHT_STEPS; li += 1) {
      const v = LIGHT.shadeMin + ((LIGHT.shadeMax - LIGHT.shadeMin) * li) / (LIGHT_STEPS - 1);
      const warm = clamp01(v - 1);
      const shade = (ch: number, tint: number, hot: number): number => {
        const lit = (ch + glow * tint) * v;
        return lit * (1 + warm * (hot - 1));
      };
      const q = (ch: number): number => Math.max(0, Math.min(255, Math.round(ch * 255)));
      lut.push(
        'rgb(' +
          q(shade(base[0], GLOW_TINT[0], WARM_TINT[0])) +
          ',' +
          q(shade(base[1], GLOW_TINT[1], WARM_TINT[1])) +
          ',' +
          q(shade(base[2], GLOW_TINT[2], WARM_TINT[2])) +
          ')',
      );
    }
  }
  return lut;
}

/* 单实例：舞台保证同一时刻只有一个效果在跑，所以效果自身的美术状态放模块作用域，
   mount 烘、dispose 清、draw 读。 */
let dots: Dot[] = [];
let colorLut: string[] = [];
/** 平滑后的鼠标世界坐标与力度（`MOUSE.decay` 是点阵自己的手感标定，不进舞台契约）。 */
let mouseWX = 0;
let mouseWY = 0;
let strength = 0;

/** 画布遮罩：平台段必须盖过字标（字形只占画布 41%~59%），线性淡出会把整个词标吃掉一半。 */
const CANVAS_MASK = 'linear-gradient(#000 0%, #000 58%, transparent 100%)';
/** 极光遮罩：从字标上沿开始溶解，不留硬边。 */
const AURORA_MASK = 'linear-gradient(#000 0%, #000 30%, transparent 78%)';

export const harnessDotsEffect: CanvasBackgroundEffect = {
  id: 'harness-dots',
  label: '点阵字标',
  hint: '官网同款：字符点阵拼出 HARNESS 字标，鼠标经过会点亮。只铺字标带，正文区不受影响。',
  kind: 'canvas',
  coverage: BAND_H,

  mount(api: CanvasStageApi): () => void {
    const fontStack = api.readToken('--dsw-font-base-16-font-family', 'system-ui, sans-serif');
    dots = sampleDots(fontStack);
    // 品牌色只从 token 拿；拿不到就用 DOT_BASE 那个中性近白端点，客户端不写死任何主题色
    colorLut = buildColorLut(hexToRgb(api.readToken('--dsw-alias-brand-primary', ''), DOT_BASE));
    const disposeAurora = mountAuroraLayers(api, {
      styleId: 'dshp-ws-aur-dots-css',
      rootClass: 'dshp-ws-aurora',
      heightPct: BAND_H * 100,
      maskImage: AURORA_MASK,
    });
    api.canvas.style.webkitMaskImage = CANVAS_MASK;
    api.canvas.style.maskImage = CANVAS_MASK;
    return (): void => {
      disposeAurora();
      dots = [];
      colorLut = [];
      mouseWX = 0;
      mouseWY = 0;
      strength = 0;
    };
  },

  draw(frame: BackgroundFrame): void {
    const { ctx, width: bandW, height: bandH } = frame;
    ctx.clearRect(0, 0, bandW, bandH);
    if (dots.length === 0) return;

    const scale = (bandW * SPAN) / (GRID * STEP);
    const cellPx = STEP * scale;
    const originX = bandW / 2;
    const originY = bandH / 2;

    const now = frame.reduced ? REDUCED_AT : frame.time;
    mouseWX += ((frame.pointer.x * bandW) / scale / 2 - mouseWX) * MOUSE.decay;
    mouseWY += ((frame.pointer.y * bandH) / scale / 2 - mouseWY) * MOUSE.decay;
    strength += ((frame.pointer.active ? MOUSE.strength : 0) - strength) * (1 - Math.pow(0.05, frame.dt));

    const lin = clamp01((now - ASSEMBLY_DELAY) / ASSEMBLY_DURATION);
    const d = 1 - Math.pow(1 - lin, 3);
    const a = smoothstep(0, 1, d);
    if (a <= 0) return;
    const rx = 0.05 * Math.sin(0.08 * now * 0.7);
    const ry = 0.1 * Math.sin(0.08 * now);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const floatScatter = smoothstep(0.9, 0, a);
    const lightX = LIGHT.x + mouseWX * LIGHT.followX;
    const waveStrength = a > 0.95 ? (a - 0.95) * 20 : 0;
    const baseAlpha = 0.45 + 0.3 * a;
    ctx.globalCompositeOperation = 'lighter';
    for (let n = 0; n < dots.length; n += 1) {
      const p = dots[n];
      if (!p) continue;
      let x = p.sx + (p.x - p.sx) * a;
      let y = p.sy + (p.y - p.sy) * a;
      let z = p.sz * (1 - a);
      // 着色器把「装配后的中心」vWorldPos 单独传给光晕/波纹/鼠标判定，后续抖动偏移不参与这些计算
      const ccx = x;
      const ccy = y;

      const loose = LOOSE * (0.25 + 0.75 * p.edge) * a;
      if (loose > 0.001) {
        x += (p.jx * 0.05 + Math.sin(now * 0.5 + p.i * 0.53) * 0.06) * loose;
        y += (p.jy * 0.05 + Math.cos(now * 0.42 + p.i * 0.71) * 0.06) * loose;
        z += (p.jz * 0.05 + Math.sin(now * 0.36 + p.i * 0.91) * 0.08) * loose;
        const tail = smoothstep(0.5, 4.5, p.x) * LOOSE * a;
        y += Math.sin(now * 1.1 - p.x * 0.7) * 0.1 * tail;
        z += Math.cos(now * 0.9 - p.x * 0.55) * 0.06 * tail;
      }
      if (waveStrength > 0) {
        const dist = Math.hypot(ccx, ccy);
        z += Math.sin(dist * 3 - now * 1.5) * 0.06 * waveStrength * smoothstep(0, 3, dist);
      }
      if (a > 0.8 && strength > 0.0001) {
        const mdx = ccx - mouseWX;
        const mdy = ccy - mouseWY;
        const md = Math.hypot(mdx, mdy);
        if (md < MOUSE.radius && md > 0.001) {
          const f = Math.pow(1 - md / MOUSE.radius, 3) * ((a - 0.8) * 5) * strength;
          const ang = Math.sin(p.i * 0.37 + now * 0.5) * MOUSE.distort;
          const ux = (mdx / md) * Math.cos(ang) - (mdy / md) * Math.sin(ang);
          const uy = (mdx / md) * Math.sin(ang) + (mdy / md) * Math.cos(ang);
          x += ux * f * 2.0;
          y += uy * f * 2.0;
          z += Math.sin(p.i * 1.7 + now) * f * 0.8;
        }
      }
      if (floatScatter > 0) {
        x += Math.sin(now * 0.5 + p.i * 0.1) * 0.2 * floatScatter;
        y += Math.cos(now * 0.4 + p.i * 0.07) * 0.2 * floatScatter;
        z += Math.sin(now * 0.3 + p.i * 0.13) * 0.15 * floatScatter;
      }
      // 站点 group.position.y 的上下浮动
      y += 0.15 * Math.sin(0.4 * now);

      const wx = x * cosY + z * sinY;
      const wz0 = -x * sinY + z * cosY;
      const wy = y * cosX - wz0 * sinX;
      const wz = y * sinX + wz0 * cosX;

      const lit = clamp01(1 - Math.hypot(wx - lightX, wy - LIGHT.y, wz - LIGHT.z) / LIGHT.range);
      const vLight = LIGHT.shadeMin + (LIGHT.shadeMax - LIGHT.shadeMin) * lit * lit;
      const glow = smoothstep(8, 0, Math.hypot(ccx, ccy)) * 0.3 * a;
      const shimmer = Math.sin(now * 1.5 + ccx * 5 + ccy * 3) * 0.1 + 0.9;
      // 光照只进颜色（站点 `col = uColor * vLight`）：alpha 再乘一次是第二重暗档衰减，
      // 字标的左半 / 下半会先掉出可读区间。
      // 站点把 uColor 也按装配量缩放（uColor *= D）；加色混合下乘进 alpha 与乘进颜色等价
      const alpha = p.lum * (baseAlpha + glow) * shimmer * d * STAGE_GAIN;
      if (alpha <= 0.004) continue;

      const persp = FOCAL / Math.max(1, FOCAL - wz);
      const side = cellPx * DOT_RATIO * p.size * persp;
      const gi = Math.min(GLOW_STEPS - 1, Math.max(0, Math.round((glow / 0.3) * (GLOW_STEPS - 1))));
      const li = Math.min(
        LIGHT_STEPS - 1,
        Math.max(
          0,
          Math.round(((vLight - LIGHT.shadeMin) / (LIGHT.shadeMax - LIGHT.shadeMin)) * (LIGHT_STEPS - 1)),
        ),
      );
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = colorLut[gi * LIGHT_STEPS + li] as string;
      ctx.fillRect(
        originX + wx * scale * persp - side / 2,
        originY - wy * scale * persp - side / 2,
        side,
        side,
      );
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
};
