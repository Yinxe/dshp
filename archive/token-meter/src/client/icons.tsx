/**
 * 插件自绘导航图标（纯 SVG，零依赖）
 *
 * 用途：
 *  - 中心区「Token 总览」视图的左侧菜单项图标（CenterView.tsx），以 `{ size, className }` 渲染；
 *  - `QuotaIcon` 还被额度浮层的标题行复用（额度已不是中心区的一个分区）。
 *
 * 数据语义图标（指标卡 / 图表标题上的那些）在 glyphs.tsx；两者共用同一套 `svgAttrs` 默认值，
 * 观感一致：viewBox 固定 0 0 24 24、颜色走 currentColor（跟随所在行的文字色/主题）、
 * 线性风格（stroke，圆帽）。
 *
 * @module @dshp/token-meter/client/icons
 */
import type { ReactNode } from 'react';
import { svgAttrs } from './glyphs.js';

/** 导航图标 props（与 glyphs 的尺寸/类名约定一致）。 */
export interface IconProps {
  size?: number | undefined;
  className?: string | undefined;
}

/**
 * 额度：电池 + 已用刻度（剩余电量语义）。
 *
 * @param props - 尺寸与类名。
 * @returns 描边式 svg。
 */
export function QuotaIcon(props: IconProps): ReactNode {
  return (
    <svg {...svgAttrs(props)}>
      <rect x={2.5} y={7} width={16} height={10} rx={2.6} />
      <path d="M21.2 10.4v3.2" />
      <rect x={5} y={9.4} width={6.4} height={5.2} rx={1.3} fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * 用量：三根高低不同的柱（统计/趋势语义）。
 *
 * @param props - 尺寸与类名。
 * @returns 描边式 svg。
 */
export function UsageIcon(props: IconProps): ReactNode {
  return (
    <svg {...svgAttrs(props)}>
      <path d="M4.6 20v-6.4" strokeWidth={2.6} />
      <path d="M12 20V5.4" strokeWidth={2.6} />
      <path d="M19.4 20v-9.6" strokeWidth={2.6} />
    </svg>
  );
}

/**
 * 在线时长：时钟 + 指针（时长/在场语义）。
 *
 * @param props - 尺寸与类名。
 * @returns 描边式 svg。
 */
export function OnlineIcon(props: IconProps): ReactNode {
  return (
    <svg {...svgAttrs(props)}>
      <circle cx={12} cy={12} r={8.4} />
      <path d="M12 7.6V12l3.2 2" />
    </svg>
  );
}

/**
 * 设置：两条滑杆 + 旋钮（配置/调节语义）。
 *
 * @param props - 尺寸与类名。
 * @returns 描边式 svg。
 */
export function SettingsIcon(props: IconProps): ReactNode {
  return (
    <svg {...svgAttrs(props)}>
      <path d="M3.6 8h9" />
      <path d="M18.4 8h2" />
      <circle cx={15.5} cy={8} r={2.3} />
      <path d="M3.6 16h2" />
      <path d="M11.4 16h9" />
      <circle cx={8.5} cy={16} r={2.3} />
    </svg>
  );
}

/**
 * 分享：方框 + 右上出箭。
 *
 * @param props - 尺寸与类名。
 * @returns 描边式 svg。
 */
export function ShareIcon(props: IconProps): ReactNode {
  return (
    <svg {...svgAttrs(props)}>
      <path d="M12.6 4.6H5.4a1.8 1.8 0 0 0-1.8 1.8v12.2a1.8 1.8 0 0 0 1.8 1.8h12.2a1.8 1.8 0 0 0 1.8-1.8v-7.2" />
      <path d="M14.4 3.4h6.2v6.2" />
      <path d="M20.6 3.4 11.4 12.6" />
    </svg>
  );
}
