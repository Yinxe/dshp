/**
 * 八个缩放把手
 *
 * 纯指针增强：`aria-hidden`（8 个 tab 停靠点只会污染键盘路径），键盘改尺寸走标题栏的
 * `Alt+方向键` 与 `⋯` 菜单里的尺寸子菜单。
 *
 * @module @dshp/widget-kit/client/ResizeHandles
 */
import { RESIZE_DIRS } from './geometry.js';
import type { ResizeDir } from './geometry.js';
import { useCardDrag } from './hooks.js';
import type { WidgetRuntime } from './service.js';
import type { NormalizedWidget } from './spec.js';
import styles from './styles.module.css';
import type { ReactNode } from 'react';

function ResizeHandle({
  runtime,
  widget,
  dir,
}: {
  runtime: WidgetRuntime;
  widget: NormalizedWidget;
  dir: ResizeDir;
}): ReactNode {
  const { handlers, dragging } = useCardDrag(runtime, widget, dir);
  return (
    <div
      className={styles.resizeHandle}
      data-dir={dir}
      data-dragging={dragging ? 'true' : undefined}
      aria-hidden="true"
      {...handlers}
    />
  );
}

export function ResizeHandles({
  runtime,
  widget,
}: {
  runtime: WidgetRuntime;
  widget: NormalizedWidget;
}): ReactNode {
  return (
    <>
      {RESIZE_DIRS.map((dir) => (
        <ResizeHandle key={dir} runtime={runtime} widget={widget} dir={dir} />
      ))}
    </>
  );
}
