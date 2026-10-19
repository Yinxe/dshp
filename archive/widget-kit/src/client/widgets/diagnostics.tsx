/**
 * 参考组件之二：注册表诊断（不是业务，是这个插件的「规范示例」）
 *
 * 它示范三件事：
 *  1. 组件提供方自己的界面**也能**用框架的公开面（`useFramework` 快照）看运行时状态；
 *  2. 同样的 `sizeClass` 分档：紧凑只报数量，常规逐条列出，宽档再显示来源与呈现方式；
 *  3. **在组件里动态启停别的组件**（`runtime.setEnabled`）—— 禁用后对方图标、卡片、面板与徽标
 *     一并停用，这里能立刻看到注册表与托盘的变化；
 *  4. **`trayIcon: false`**：它自己不出现在活动栏（诊断是调试用的，不占常驻位置），
 *     由参考组件「组件箱」的菜单打开 —— 「一个菜单图标挂多个自由卡片」的标准用法。
 *
 * @module @dshp/widget-kit/client/widgets/diagnostics
 */
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import { FRAMEWORK_VERSION } from '../spec.js';
import type { WidgetContentProps, WidgetDescriptor } from '../spec.js';
import { RegistryGlyph } from '../glyphs.js';
import { useFramework } from '../hooks.js';
import type { WidgetRuntime } from '../service.js';
import styles from '../styles.module.css';

export const DIAGNOSTICS_WIDGET_ID = 'dshp-widget-kit:registry';

interface DiagData {
  count: number;
  openCards: number;
  frameworkVersion: string;
}

function DiagnosticsView({
  runtime,
  props,
}: {
  runtime: WidgetRuntime;
  props: WidgetContentProps<DiagData>;
}): ReactNode {
  const snapshot = useFramework(runtime);
  const compact = props.sizeClass === 'compact';
  const disabled = new Set(snapshot.layout.disabled);

  return (
    <div className={styles.diag}>
      <div className={styles.diagSummary}>
        已注册 {String(snapshot.widgets.length)} 个组件 · 打开{' '}
        {String(Object.values(snapshot.layout.cards).filter((card) => card.open).length)} 张卡片 · v
        {FRAMEWORK_VERSION}
        {snapshot.degraded ? ' · 本机布局未持久化' : ''}
      </div>
      {snapshot.widgets.length === 0 ? (
        <div className={styles.diagEmpty}>还没有任何插件注册组件。</div>
      ) : (
        <div className={styles.diagList}>
          {snapshot.widgets.map((widget) => {
            const enabled = !disabled.has(widget.id);
            return (
              <div key={widget.id} className={styles.diagRow} data-disabled={enabled ? 'false' : 'true'}>
                <div className={styles.diagMain}>
                  <span className={styles.diagId}>{widget.id}</span>
                  {!compact && (
                    <span className={styles.diagMeta}>
                      来源 {widget.owner} · {widget.presentation}
                      {widget.tray.badge === null ? '' : ' · 有徽标'}
                      {widget.presentation === 'card'
                        ? ` · ${String(widget.card?.defaultSize.w ?? 0)}×${String(widget.card?.defaultSize.h ?? 0)}`
                        : ''}
                      {enabled ? '' : ' · 已禁用'}
                    </span>
                  )}
                </div>
                {!compact && (
                  <div className={styles.diagActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        runtime.setEnabled(widget.id, !enabled);
                      }}
                    >
                      {enabled ? '禁用' : '启用'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {props.error !== undefined && (
        <div className={styles.diagError}>数据刷新失败：{props.error.message}</div>
      )}
    </div>
  );
}

/** 诊断组件描述符。 */
export function createDiagnosticsWidget(runtime: WidgetRuntime): WidgetDescriptor<DiagData> {
  return {
    id: DIAGNOSTICS_WIDGET_ID,
    title: '组件诊断',
    subtitle: '已注册的组件与框架状态',
    icon: <RegistryGlyph />,
    order: 110,
    presentation: 'card',
    // 调试用卡片：不占活动栏图标，由「组件箱」收录（trayIcon 只允许卡片这么写；
    // 而「被组件箱收录」必须自己声明 —— listedInBox 默认 false，框架不替别人决定入口）
    trayIcon: false,
    listedInBox: true,
    tray: {
      badge: () => {
        const count = runtime.list().length;
        return { text: String(count), tone: 'info', title: `${String(count)} 个已注册组件` };
      },
      badgeIntervalMs: 30000,
    },
    content: {
      title: '组件诊断',
      load: async (): Promise<DiagData> => ({
        count: runtime.list().length,
        openCards: Object.values(runtime.getSnapshot().layout.cards).filter((card) => card.open).length,
        frameworkVersion: runtime.frameworkVersion,
      }),
      refreshMs: 10000,
      render: (props) => <DiagnosticsView runtime={runtime} props={props} />,
    },
    card: {
      defaultSize: { w: 420, h: 300 },
      minSize: { w: 280, h: 180 },
      sizeClassBreakpoints: { compact: 340, wide: 520 },
    },
  };
}
