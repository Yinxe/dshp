/**
 * 供应商图标（自绘 **抽象标记**，零依赖）
 *
 * ## 为什么按 16 网格画
 *
 * 上一版在 24 网格里画、再缩到 10–12px 用：24→10 是 0.42 倍，1.6 的描边落到屏幕上只剩 0.67px，
 * 又因为半像素落点糊成一团 —— 观感就是「对不上、太小、发虚」。现在改成：
 *
 *  - **16×16 网格**，实际渲染 15–16px（接近 1:1，没有缩放模糊）；
 *  - 描边 **1.4**（16px 上就是 1.4px：小图标该有的分量，细了发飘、粗了发糊）；
 *  - 每枚标记的有效图形占满 12–13 个单位（四周留 1.5 左右），并排时视觉重量一致；
 *  - `display:block`（避免 inline-SVG 的基线间隙把图标顶歪）。
 *
 * 两种画法并存：
 *  - **官方品牌路径**（`BRANDS`）：官方本来就有矢量路径的（DeepSeek 那条鲸鱼）直接按官方 viewBox
 *    原样填充 `currentColor` —— 不走 16 网格、不描边，保持 logo 自己的宽高比（宽 > 高）；
 *  - **自绘线稿**（`MARKS`）：没有官方路径的（CommandCode 的命令键 ⌘、opencode 的圆角方框、
 *    本地账本）按 16 网格 + 1.4 描边画，线条重量与图标体系一致。
 *
 * ## 名字从哪来
 *
 * Host 的 provider 元数据里声明 `icon`（`describeProviders()` 下发），客户端用 `iconOf()` 解析 ——
 * 未知名字回退通用那枚，未知 type 走 `TYPE_ICON_FALLBACK`，所以新增供应商**不写客户端代码也有图标**。
 *
 * @module @dshp/token-meter/client/provider-icons
 */
import type { ReactNode } from 'react';

/** 图标 props（与 glyphs / icons 的约定一致）。 */
export interface ProviderIconProps {
  /** 图标名（Host 元数据的 `icon`，或客户端兜底表里的 key）。 */
  name?: string | undefined;
  size?: number | undefined;
  className?: string | undefined;
}

/** 图标设计网格（16×16）与描边宽度 —— 见模块文档「为什么按 16 网格画」。 */
const GRID = 16;
const STROKE = 1.4;

/** 16×16 线性描边外壳。 */
function shell(size: number, className: string | undefined, name: string, children: ReactNode): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${String(GRID)} ${String(GRID)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'block' }}
      aria-hidden="true"
      focusable="false"
      data-provider-icon={name}
    >
      {children}
    </svg>
  );
}

/**
 * 官方品牌路径（按官方 viewBox 原样填充 `currentColor`）。
 *
 * DeepSeek 的鲸鱼是**官方路径**（宽高比 23.16 : 17.04）：宽度取 `size`，高度按原比例算 ——
 * 硬塞进 16×16 方框会把鲸鱼压变形，所以这里保留它自己的比例，由使用方
 * （`ButtonLayout` 的 `align-items: center`）在行内居中。
 */
const BRANDS: Record<string, { viewBox: string; ratio: number; d: string }> = {
  deepseek: {
    viewBox: '0 0 23.16 17.04',
    ratio: 17.04 / 23.16,
    d: 'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z',
  },
};

/**
 * 画一枚官方品牌路径（填充式，非描边）。
 *
 * @param mark - viewBox / 宽高比 / path。
 * @param size - **宽度** px（高度按原比例）。
 * @param className - 可选类名。
 * @param name - `icon` 名（写进 `data-provider-icon`，自检与调试用）。
 * @returns 填充式 SVG。
 */
function brand(
  mark: { viewBox: string; ratio: number; d: string },
  size: number,
  className: string | undefined,
  name: string,
): ReactNode {
  const height = Math.round(size * mark.ratio * 100) / 100;
  return (
    <svg
      width={size}
      height={height}
      viewBox={mark.viewBox}
      fill="currentColor"
      className={className}
      style={{ display: 'block' }}
      aria-hidden="true"
      focusable="false"
      data-provider-icon={name}
    >
      <path d={mark.d} fill="currentColor" />
    </svg>
  );
}

/** 各供应商的自绘标记；键 = 元数据里的 `icon` 名。 */
const MARKS: Record<string, (size: number, className: string | undefined) => ReactNode> = {
  // DeepSeek：鲸尾（对称双叶 + 尾柄），占满 3–13
  deepseek: (size, className) =>
    shell(
      size,
      className,
      'deepseek',
      <>
        <path d="M8 13.4V8.7" />
        <path d="M8 8.7C5 8.7 3 6.6 3.4 3.3c3.2.5 4.9 2.6 4.6 5.3" />
        <path d="M8 8.7c3 0 5-2.1 4.6-5.4-3.2.5-4.9 2.6-4.6 5.3" />
      </>,
    ),
  // opencode：竖向的圆角方框（对齐它自己的标识；线稿、内部留空）
  opencode: (size, className) =>
    shell(size, className, 'opencode', <rect x="4.9" y="2.5" width="6.2" height="11" rx="2" />),
  // CommandCode / Goat：命令键 ⌘（中间一方块 + 四角四个回路）
  commandcode: (size, className) =>
    shell(
      size,
      className,
      'commandcode',
      <>
        <rect x="5.7" y="5.7" width="4.6" height="4.6" rx="0.5" />
        <circle cx="3.9" cy="3.9" r="1.7" />
        <circle cx="12.1" cy="3.9" r="1.7" />
        <circle cx="3.9" cy="12.1" r="1.7" />
        <circle cx="12.1" cy="12.1" r="1.7" />
      </>,
    ),
  // 本地账本：本子 + 装订线 + 两行字
  manual: (size, className) =>
    shell(
      size,
      className,
      'manual',
      <>
        <rect x="3.3" y="2.9" width="9.4" height="10.2" rx="1.4" />
        <path d="M6 2.9v10.2" />
        <path d="M8.3 6.3h2.5M8.3 8.7h2.5" />
      </>,
    ),
  // 通用兜底：一枚中性的供应商盒子
  generic: (size, className) =>
    shell(
      size,
      className,
      'generic',
      <>
        <path d="M8 2.5 13.3 5.6v6.3L8 15 2.7 11.9V5.6z" />
        <path d="M8 8.7V15M2.9 5.7 8 8.7l5.1-3" />
      </>,
    ),
};

/** 已知图标名（含兜底），供自检与调试用。 */
export const PROVIDER_ICON_NAMES: string[] = Object.keys(MARKS);

/** 图标的设计网格与描边（自绘线稿用；官方品牌路径按官方 viewBox，不受它约束）。 */
export const PROVIDER_ICON_GRID: { grid: number; stroke: number } = { grid: GRID, stroke: STROKE };

/** 有官方矢量路径的图标名（自检用：它们走填充，不走 16 网格）。 */
export const PROVIDER_BRAND_NAMES: string[] = Object.keys(BRANDS);

/**
 * 画一枚供应商图标。
 *
 * @param props - 图标名 / 尺寸（建议 14–16；未知名字回退到通用那枚，不空白也不崩）。
 * @returns 线性 SVG。
 */
export function ProviderIcon(props: ProviderIconProps): ReactNode {
  const name = typeof props.name === 'string' ? props.name.trim().toLowerCase() : '';
  const size = props.size ?? 16;
  const official = BRANDS[name];
  if (official !== undefined) return brand(official, size, props.className, name);
  const draw = MARKS[name] ?? MARKS['generic'];
  if (draw === undefined) return null;
  return draw(size, props.className);
}

/** type → 图标名兜底表（Host 元数据没给 `icon` 时用；键是 type，值是图标名）。 */
export const TYPE_ICON_FALLBACK: Record<string, string> = {
  deepseek: 'deepseek',
  'deepseek-api': 'deepseek',
  'deepseek-web': 'deepseek',
  opencode: 'opencode',
  'opencode-go': 'opencode',
  'opencode-zen': 'opencode',
  commandcode: 'commandcode',
  manual: 'manual',
};

/**
 * 解析某供应商该用哪枚图标。
 *
 * @param type - 供应商类型。
 * @param metaIcon - Host 元数据里声明的 `icon`（优先）。
 * @returns 图标名（一定非空：未知 type 给通用那枚）。
 */
export function iconOf(type: string, metaIcon?: string | undefined): string {
  if (typeof metaIcon === 'string' && metaIcon.trim() !== '') return metaIcon.trim().toLowerCase();
  return TYPE_ICON_FALLBACK[type] ?? 'generic';
}
