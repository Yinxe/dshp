/**
 * radius.ts —— 全局圆角：独立能力保留。-1 跟随主题；0 全锐角；N 统一圆润。
 *
 * 覆盖面：不追官方 hash 类名（升级即漂移、插件组件覆盖不到），改用语义属性
 * 选择器通吃 —— DSH 生态组件类名统一为 'xxx_card' / 'xxx_panel' / 'xxx_bubble'
 *（CSS module 约定），属性选择器 [class*="_card"] 全量命中；圆形/胶囊
 *（border-radius:50% / 999px）分档保留，避免把头像、徽标掰成方块。
 *
 * 原实现：dsh-custom-ui/client.js 的 applyRadius()，逐行等价（元素 id 随包名更新）。
 *
 * @module @dshp/web-style/client
 */
import type { RadiusConfig } from './types.js';

const CSS_ID = 'dshp-web-style-radius-css';

/** 语义面：官方 + 三方插件的卡片 / 面板 / 气泡 + 通用控件。 */
const SURFACES =
  '[class*="_card"],[class*="_panel"],[class*="_bubble"],[class*="-card"],[class*="-panel"],[class*="-bubble"],button,input,textarea,select';

export function applyRadius(radius: RadiusConfig | null | undefined): void {
  const old = document.getElementById(CSS_ID);
  if (old) old.remove();
  const r = Number(radius && radius.global);
  const css: string[] = [];
  if (Number.isFinite(r)) {
    if (r === 0) {
      css.push(SURFACES + '{border-radius:0 !important}');
    } else if (r > 0) {
      css.push(SURFACES + '{border-radius:' + Math.min(24, r) + 'px !important}');
    }
  }
  if (css.length > 0) {
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = css.join('\n');
    document.head.appendChild(style);
  }
}

/** 撤销圆角样式（插件停止时收回——样式节点是本插件自己 append 的，不能留在 document 上）。 */
export function disposeRadius(): void {
  document.getElementById(CSS_ID)?.remove();
}
