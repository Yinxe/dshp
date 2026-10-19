/**
 * 环形进度（侧边栏额度按钮最常用的一种主图形）
 *
 * 只做一件事：把 `QuotaRingSpec` 画成一枚环 —— 几何、描边、起止角、动画、无障碍在这里统一，
 * 供应商只决定「数值与语义」。它是 `ProviderUIKit.Ring` 的实现，被这些地方复用：
 *  1. 侧边栏额度按钮（`QuotaSidebarAction`，画什么由供应商的按钮模板决定）；
 *  2. 弹层里每一行供应商切换项左侧的小环（同一套语义，用户一眼能对上）；
 *  3. 想画环的详情区块。
 *
 * 注意：环只是**一种**按钮画法。按钮模板也可以直接画余额数字、三条迷你进度条
 * （`K.WindowBars`）或纯图标 —— 见 providers/templates 的模块文档。
 *
 * 特殊态：
 *  - `pct: null` + `tone: 'idle'` → 只画轨道（没有可表达的比例，不编进度）；
 *  - `pct: null` + `tone: 'bad' | 'warn'` → 画一整圈警告色（拉取失败、余额告警这类
 *    「没有比例但必须刺眼」的状态；红=要人管，黄=临时性）；
 *  - `pct` 有值 → 按比例画弧，颜色按档位（ok/warn/bad）。
 *
 * @module @dshp/token-meter/client/QuotaRing
 */
import type { ReactNode } from 'react';
import styles from './styles.module.css';
import type { QuotaRingSpec } from './providers/index.js';

/** 环形进度 props。 */
export interface QuotaRingProps {
  /** 供应商按钮模板产出的渲染说明。 */
  spec: QuotaRingSpec;
  /** 外径 px（侧边栏按钮 18 / 切换行 16）。 */
  size?: number | undefined;
  /** 描边宽度 px。 */
  stroke?: number | undefined;
}

/**
 * 画一枚环形进度。
 *
 * @param props - spec + 尺寸。
 * @returns 内联 SVG（`currentColor` 无关：颜色全走 CSS 变量，深/浅色主题各自成立）。
 */
export function QuotaRing(props: QuotaRingProps): ReactNode {
  const spec = props.spec;
  const size = props.size ?? 18;
  const stroke = props.stroke ?? 2.2;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = spec.pct === null ? null : Math.min(100, Math.max(0, spec.pct));
  // 空环 + bad/warn = 整圈警告（失败/告警没有比例可表达，但必须刺眼）；空环 + idle = 只有轨道
  const arcPct = pct === null ? (spec.tone === 'bad' || spec.tone === 'warn' ? 100 : 0) : pct;
  const arc = (arcPct / 100) * circ;
  return (
    <svg
      className={styles.ring}
      width={size}
      height={size}
      viewBox={'0 0 ' + size + ' ' + size}
      data-tone={spec.tone}
      data-empty={pct === null ? '1' : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.ringTrack} cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} />
      {arcPct > 0 ? (
        <circle
          className={styles.ringArc}
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={arc + ' ' + (circ - arc)}
          transform={'rotate(-90 ' + c + ' ' + c + ')'}
        />
      ) : null}
    </svg>
  );
}
