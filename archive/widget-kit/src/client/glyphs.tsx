/**
 * 托盘图标（18px 视口，`currentColor`，`aria-hidden` —— 可访问名由托盘按钮的 aria-label 给）
 *
 * @module @dshp/widget-kit/client/glyphs
 */
import type { ReactNode } from 'react';

function Glyph({ children, size = 18 }: { children: ReactNode; size?: number }): ReactNode {
  return (
    <svg
      viewBox="0 0 18 18"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * 位置锁（卡片标题栏的锁定按钮）。
 *
 * @param locked - `true` = 已锁定（锁梁落下），`false` = 可移动（锁梁抬起）。
 */
export function LockGlyph({ locked }: { locked: boolean }): ReactNode {
  return (
    <Glyph size={13}>
      <rect x="3.4" y="8" width="11.2" height="7.6" rx="1.8" />
      {locked ? (
        <path d="M6.4 8V6.2a2.6 2.6 0 0 1 5.2 0V8" strokeLinecap="round" />
      ) : (
        <path d="M6.4 8V6.2a2.6 2.6 0 0 1 5.2 0" strokeLinecap="round" />
      )}
      <circle cx="9" cy="11.6" r="0.9" />
    </Glyph>
  );
}

/** 时钟。 */
export function ClockGlyph(): ReactNode {
  return (
    <Glyph>
      <circle cx="9" cy="9" r="6.5" />
      <path d="M9 5.4V9l2.6 1.6" strokeLinecap="round" />
    </Glyph>
  );
}

/** 注册表 / 清单。 */
export function RegistryGlyph(): ReactNode {
  return (
    <Glyph>
      <rect x="2.6" y="3.4" width="12.8" height="11.2" rx="2.2" />
      <path d="M5.6 7h6.8M5.6 9.6h6.8M5.6 12.2h4" strokeLinecap="round" />
    </Glyph>
  );
}

/** 滑杆（快速设置）。 */
export function SlidersGlyph(): ReactNode {
  return (
    <Glyph>
      <path d="M3 5.5h12M3 9h12M3 12.5h12" strokeLinecap="round" />
      <circle cx="7" cy="5.5" r="1.6" />
      <circle cx="11.5" cy="9" r="1.6" />
      <circle cx="6" cy="12.5" r="1.6" />
    </Glyph>
  );
}

/** 收纳箱（组件箱：自由卡片的统一入口）。 */
export function BoxGlyph(): ReactNode {
  return (
    <Glyph>
      <path d="M2.8 5.2h12.4v2.2H2.8z" strokeLinejoin="round" />
      <path d="M4 7.4v6.2a1.4 1.4 0 0 0 1.4 1.4h7.2a1.4 1.4 0 0 0 1.4-1.4V7.4" strokeLinejoin="round" />
      <path d="M7.4 10.2h3.2" strokeLinecap="round" />
    </Glyph>
  );
}

/** 脉冲（状态速览）。 */
export function PulseGlyph(): ReactNode {
  return (
    <Glyph>
      <path d="M2 9.5h3.2l1.6-4 2.4 7.4 1.8-4.4 1.2 2.4H16" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  );
}
