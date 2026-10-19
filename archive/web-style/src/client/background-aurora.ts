/**
 * background-aurora.ts —— 极光辉光层工厂
 *
 * 站点 hero 底层的三层 `radial-gradient` 大 blob + `mix-blend-mode: screen` + 缓慢漂移，
 * 纯 CSS：没有 canvas、没有 rAF，成本是一次合成层。颜色全部走 `color-mix()` 从
 * `--dsw-alias-brand-primary` 现调，所以亮/暗切换、换主题都会自己跟上。
 *
 * **高与遮罩是工厂实参，不是二选一**：点阵要把极光收进字标带（铺满视口会抬起整页底色，
 * 反过来抹平点阵自己的对比，实测正文区抬 11 级、字标区 sd 9.3 → 6.2），独立的极光背景
 * 底下没有 competing 的点阵，铺满视口反而是它该有的样子。两效果不同时运行，不会打架。
 *
 * black 只出现在 `color-mix()` 的暗端，是对比度端点而不是主题色（同 GallerySection 的 `inkOn`）。
 *
 * @module @dshp/web-style/client
 */
import type { DomBackgroundEffect, StageApi } from './background.js';

export interface AuroraLayerOptions {
  /** `<style>` 元素 id，带 `dshp-ws-` 前缀防撞 */
  readonly styleId: string;
  /** 极光容器 class，同时是这套规则的作用域（避免污染同舞台的其它节点） */
  readonly rootClass: string;
  /** 容器高占舞台比（%） */
  readonly heightPct: number;
  /** 容器遮罩，让极光在带内淡出不留硬边 */
  readonly maskImage: string;
}

/** 往舞台 append 三层极光，返回收回容器与自注入样式的 disposer。 */
export function mountAuroraLayers(api: StageApi, opts: AuroraLayerOptions): () => void {
  const root = '.' + opts.rootClass;
  const style = document.createElement('style');
  style.id = opts.styleId;
  style.textContent = `
${root} {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: ${opts.heightPct}%;
  overflow: hidden;
  --dshp-ws-aur-bright: color-mix(in srgb, var(--dsw-alias-brand-primary) 86%, black);
  --dshp-ws-aur-mid: color-mix(in srgb, var(--dsw-alias-brand-primary) 62%, black);
  --dshp-ws-aur-deep: color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, black);
  -webkit-mask-image: ${opts.maskImage};
  mask-image: ${opts.maskImage};
}
${root} .dshp-ws-aur {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: screen;
  will-change: transform;
}
${root} .dshp-ws-aur-a {
  left: 50%;
  top: -26%;
  width: 72vw;
  height: 72vw;
  margin-left: -36vw;
  background: radial-gradient(ellipse at center, var(--dshp-ws-aur-mid) 0%, var(--dshp-ws-aur-deep) 40%, transparent 70%);
  filter: blur(100px);
  animation: dshp-ws-drift 32s ease-in-out infinite alternate;
}
${root} .dshp-ws-aur-b {
  left: 14%;
  top: 2%;
  width: 38vw;
  height: 38vw;
  background: radial-gradient(circle, var(--dshp-ws-aur-bright) 0%, var(--dshp-ws-aur-mid) 30%, transparent 70%);
  filter: blur(60px);
  animation: dshp-ws-drift 24s ease-in-out infinite alternate-reverse;
}
${root} .dshp-ws-aur-c {
  right: 6%;
  top: -8%;
  width: 46vw;
  height: 46vw;
  background: radial-gradient(circle, var(--dshp-ws-aur-deep) 0%, transparent 70%);
  filter: blur(80px);
  animation: dshp-ws-drift 40s ease-in-out infinite alternate;
}
@keyframes dshp-ws-drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(3%, -4%, 0) scale(1.08); }
}
@media (prefers-reduced-motion: reduce) {
  ${root} .dshp-ws-aur { animation: none; }
}
`;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = opts.rootClass;
  for (const layer of ['a', 'b', 'c']) {
    const blob = document.createElement('i');
    blob.className = 'dshp-ws-aur dshp-ws-aur-' + layer;
    wrap.appendChild(blob);
  }
  api.stage.appendChild(wrap);

  return (): void => {
    wrap.remove();
    style.remove();
  };
}

/**
 * `aurora` 效果本体：只有极光、没有点阵的一层，纯 CSS。
 *
 * 铺满视口而不是收带内：点阵收带是为了一行七个字母的可读性（见 background-dots.ts 的
 * 「亮度预算怎么花」），这里底下没有 competing 的点阵，抬正文底色换整屏氛围是划算的。
 * 舞台只管颜色与通透度，正文可读性由 `SHELL_KEEP` 兜底。
 */
export const auroraEffect: DomBackgroundEffect = {
  id: 'aurora',
  label: '极光辉光',
  hint: '纯 CSS 三层辉光铺满视口：不建画布、不起帧循环，代价为零。',
  kind: 'dom',
  mount(api: StageApi): () => void {
    return mountAuroraLayers(api, {
      styleId: 'dshp-ws-aur-flat-css',
      rootClass: 'dshp-ws-aurora-flat',
      heightPct: 100,
      maskImage: 'linear-gradient(#000 0%, #000 62%, transparent 96%)',
    });
  },
};
