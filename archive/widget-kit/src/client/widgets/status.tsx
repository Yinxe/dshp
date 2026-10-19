/**
 * 参考组件之四：状态速览（**悬停展开**、`header: false`、`padding: 0` 的 popover）
 *
 * 它是「小面板放数据/状态」这个用法的参考实现，同时演示两条边界：
 *  1. `trigger: 'hover'` —— 悬停展开、移开自动收起（带宽限），**不抢焦点、不叠 Tooltip**；
 *  2. `header: false` + `padding: 0` —— 框架不画标题栏也不加内边距，整块面板归提供方
 *     （这里用 `.statusRoot` 自己给 12px 内边距；换成 iframe / canvas 就是贴边铺满）。
 *
 * @module @dshp/widget-kit/client/widgets/status
 */
import type { ReactNode } from 'react';
import type { WidgetDescriptor } from '../spec.js';
import { PulseGlyph } from '../glyphs.js';
import { useFramework } from '../hooks.js';
import type { WidgetRuntime } from '../service.js';
import styles from '../styles.module.css';

export const STATUS_WIDGET_ID = 'dshp-widget-kit:status';

function StatusView({ runtime }: { runtime: WidgetRuntime }): ReactNode {
  const snapshot = useFramework(runtime);
  const openCards = Object.values(snapshot.layout.cards).filter(
    (card) => card.open && !card.minimized,
  ).length;
  const hidden = snapshot.layout.tray.hidden.length;

  return (
    <div className={styles.statusRoot}>
      <div className={styles.statusGrid}>
        <div className={styles.statusCell}>
          <span className={styles.statusValue}>{snapshot.widgets.length}</span>
          <span className={styles.statusKey}>已注册组件</span>
        </div>
        <div className={styles.statusCell}>
          <span className={styles.statusValue}>{openCards}</span>
          <span className={styles.statusKey}>打开的卡片</span>
        </div>
        <div className={styles.statusCell}>
          <span className={styles.statusValue}>{hidden}</span>
          <span className={styles.statusKey}>已隐藏图标</span>
        </div>
        <div className={styles.statusCell}>
          <span className={styles.statusValue}>{snapshot.degraded ? '内存' : '本机'}</span>
          <span className={styles.statusKey}>布局存储</span>
        </div>
      </div>
      <span className={styles.statusHint}>
        框架 v{runtime.frameworkVersion} · 契约 SPEC v{String(runtime.specVersion)} —— 悬停展开，移开自动收起
      </span>
    </div>
  );
}

/**
 * 状态速览组件描述符：`trigger: 'hover'` + 无框架标题栏 + 零内边距。
 *
 * @param runtime - 框架运行时。
 */
export function createStatusWidget(runtime: WidgetRuntime): WidgetDescriptor {
  return {
    id: STATUS_WIDGET_ID,
    title: '状态速览',
    subtitle: '组件数 / 卡片数 / 存储状态',
    icon: <PulseGlyph />,
    order: 130,
    presentation: 'popover',
    popover: { trigger: 'hover', width: 260, header: false, padding: 0 },
    content: {
      render: () => <StatusView runtime={runtime} />,
    },
  };
}
