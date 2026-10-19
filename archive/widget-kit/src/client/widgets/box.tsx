/**
 * 「组件箱」—— 框架的**统一入口**：把声明过 `listedInBox: true` 的卡片列成一个菜单。
 *
 * 它**不是示例，也不是「列出所有卡片」**：默认不收录，只有卡片所有者在描述符里明确写了
 * `listedInBox: true` 才出现在这里（见 `docs/widget-spec.md` §3）。理由是这个菜单占的是别人的入口
 * 位置 —— 谁都可以只写 `trayIcon: false` 再自建菜单（`@dshp/token-meter` 的 `token-meter:menu`
 * 就是范例），框架不该替别人做这个决定，更不该把别人的卡片当成自己示例菜单的数据源。
 *
 * 三种能力它都用到了，也正好是「一菜单多卡片」的完整落地：
 *
 *  1. 一个图标（本组件的 popover）+ 菜单里若干个自由卡片；
 *  2. 那些卡片自己**不出现在活动栏**（`trayIcon: false`），由这里用 `runtime.toggle(id)` 开合 ——
 *     可以同时开好几张（卡片本来就是多开的）；
 *  3. 提供方不需要新能力：`register` 返回 disposer、`list()` 给出摘要（含 `listedInBox`）、
 *     `toggle/open/close` 控制开关 —— 别的聚合入口照同一条声明自己实现即可。
 *
 * 它**与「装载参考组件」偏好无关**：关掉参考组件只是不注册时钟 / 组件诊断这些示例，组件箱作为框架
 * 能力始终在册 —— 否则「声明了 `trayIcon: false` + `listedInBox: true`」的卡片会彻底没有入口。
 *
 * @module @dshp/widget-kit/client/widgets/box
 */
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import { resolveText } from '../spec.js';
import type { WidgetDescriptor } from '../spec.js';
import { BoxGlyph } from '../glyphs.js';
import { useFramework } from '../hooks.js';
import type { WidgetRuntime } from '../service.js';
import styles from '../styles.module.css';

export const BOX_WIDGET_ID = 'dshp-widget-kit:box';

function BoxView({ runtime }: { runtime: WidgetRuntime }): ReactNode {
  const snapshot = useFramework(runtime);
  // 只列**明确声明**允许收录的卡片：入口归卡片的所有者决定（`listedInBox` 默认 false）
  const cards = snapshot.widgets.filter((widget) => widget.presentation === 'card' && widget.listedInBox);
  const openCount = cards.filter((widget) => runtime.isOpen(widget.id)).length;

  return (
    <div className={styles.box}>
      <div className={styles.boxHead}>
        <span className={styles.boxHint}>点「打开」弹出为可拖动卡片，位置与尺寸会记住。</span>
      </div>
      {cards.length === 0 ? (
        <div className={styles.boxEmpty}>
          还没有卡片声明收录。卡片默认不进这个菜单：写 <code>listedInBox: true</code>（并可同时写{' '}
          <code>trayIcon: false</code>）才会出现在这里。
        </div>
      ) : (
        <div className={styles.boxList}>
          {cards.map((widget) => {
            const title = resolveText(widget.title, widget.id);
            const open = runtime.isOpen(widget.id);
            return (
              <div
                key={widget.id}
                className={styles.boxRow}
                data-box-widget={widget.id}
                data-open={open ? '1' : '0'}
              >
                <span className={styles.boxDot} />
                <span className={styles.boxLabel} title={`${title} · ${widget.id}`}>
                  {title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    runtime.toggle(widget.id);
                  }}
                >
                  {open ? '收起' : '打开'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <div className={styles.boxFoot}>
        <span className={styles.boxCount}>{`${String(openCount)} / ${String(cards.length)} 已打开`}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={openCount === 0}
          onClick={() => {
            for (const widget of cards) if (runtime.isOpen(widget.id)) runtime.close(widget.id);
          }}
        >
          全部收起
        </Button>
      </div>
    </div>
  );
}

/**
 * 组件箱描述符：点击展开的临时小面板 + 活动栏文字「组件箱」。
 *
 * @param runtime - 框架运行时（列卡片、开关卡片）。
 */
export function createBoxWidget(runtime: WidgetRuntime): WidgetDescriptor {
  return {
    id: BOX_WIDGET_ID,
    title: '组件箱',
    subtitle: '自由卡片的统一入口',
    icon: <BoxGlyph />,
    order: 95,
    presentation: 'popover',
    // 活动栏文字扩展点：图标旁边压两个字（最多 6 个）
    tray: { label: '组件箱' },
    popover: { trigger: 'click', width: 320 },
    content: {
      title: '组件箱',
      render: () => <BoxView runtime={runtime} />,
    },
  };
}
