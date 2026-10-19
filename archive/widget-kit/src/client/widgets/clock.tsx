/**
 * 参考组件之一：时钟（不是业务，是这个插件的「规范示例」）
 *
 * 它示范的是**提供方如何控制随尺寸变化的内容呈现**：框架只给 `size` / `sizeClass`，
 * 三种档位各渲染一版（紧凑只留时间、常规加时区、宽档再显示出实测内容盒与框架版本）。
 * 秒级跳动是提供方自己的展示细节（本地计时器），框架的 `refreshMs` 只管数据刷新。
 *
 * @module @dshp/widget-kit/client/widgets/clock
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { FRAMEWORK_VERSION } from '../spec.js';
import type { WidgetContentProps, WidgetDescriptor } from '../spec.js';
import { ClockGlyph } from '../glyphs.js';
import styles from '../styles.module.css';

export const CLOCK_WIDGET_ID = 'dshp-widget-kit:clock';

interface ClockData {
  timezone: string;
  offsetMinutes: number;
}

function pad(value: number): string {
  return value < 10 ? `0${String(value)}` : String(value);
}

function ClockView({ props }: { props: WidgetContentProps<ClockData> }): ReactNode {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const data = props.data;
  const sizeClass = props.sizeClass;
  const offset = data?.offsetMinutes ?? -now.getTimezoneOffset();
  const zone = data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className={styles.clock}>
      <div className={styles.clockTime} data-size={sizeClass}>
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span style={{ fontSize: '0.45em' }}>:{pad(now.getSeconds())}</span>
      </div>
      <div className={styles.clockMeta}>
        {now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
      </div>
      {sizeClass !== 'compact' && (
        <div className={styles.clockRow}>
          <span className={styles.clockLabel}>{zone}</span>
          <span className={styles.clockLabel}>
            UTC{offset >= 0 ? '+' : '−'}
            {String(Math.abs(Math.round(offset / 60)))}
          </span>
        </div>
      )}
      {sizeClass === 'wide' && (
        <div className={styles.clockRow}>
          <span className={styles.clockLabel}>
            内容盒 {props.size === null ? '—' : `${String(props.size.width)}×${String(props.size.height)}`} ·
            框架 v{FRAMEWORK_VERSION}
          </span>
        </div>
      )}
      {props.minimized && <div className={styles.clockMeta}>已最小化</div>}
    </div>
  );
}

/** 时钟组件描述符（`presentation: 'card'` = 托盘图标 + 可拖拽卡片）。 */
export const clockWidget: WidgetDescriptor<ClockData> = {
  id: CLOCK_WIDGET_ID,
  title: '时钟',
  subtitle: '本机时间与时区',
  icon: <ClockGlyph />,
  order: 100,
  presentation: 'card',
  tray: {
    // 活动栏文字扩展点：图标旁边直接显示 HH:MM（像系统状态栏的时钟），所以不再另放角标
    label: () => {
      const now = new Date();
      return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    },
  },
  content: {
    title: '时钟',
    load: async (): Promise<ClockData> => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offsetMinutes: -new Date().getTimezoneOffset(),
    }),
    refreshMs: 30000,
    render: (props) => <ClockView props={props} />,
  },
  card: {
    defaultSize: { w: 320, h: 220 },
    minSize: { w: 240, h: 140 },
    sizeClassBreakpoints: { compact: 300, wide: 420 },
  },
};
