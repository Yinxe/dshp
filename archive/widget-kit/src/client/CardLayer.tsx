/**
 * 卡片层 —— 注册进 `shell.overlay` 的那一个条目
 *
 * 一次注册渲染全部卡片与当前 popover：卡片层自建层叠上下文（`isolation: isolate`），
 * 卡片之间只用**层内**相对 z-index，不跟官方层抢序。
 *
 * 手势进行中还会多两样东西。两者都做成**只订阅一个稳定值**的叶子组件（一个字符串 / 一个对象引用），
 * 所以 60fps 的拖动不会带着整层重渲染 —— 这正是「拖动有时卡」的根因：
 * 早先版本让卡片层直接订阅 live，每帧一个新快照，于是所有卡片连同内容每帧都重渲染。
 *
 *  - **手势盾**：全视口 `user-select: none` + `pointer-events: auto`，鼠标指针跟随手势方向。
 *    治「缩放时指针扫过页面文字选中一片高亮」，顺带挡住指针进入 iframe / 画布时事件被对方吞掉；
 *  - **吸附预览虚框**：显示「松手会落到哪里」。拖动期间卡片本体自由跟手（允许与其它卡片重叠），
 *    松手才真的吸附 —— 拖开让虚框消失再松手，就是「不同意吸附」，落回自由位置。
 *
 * 小面板（popover）分两层渲染，**可以同时出现**：常驻层（`persistent: true`，手风琴：最多一个）
 * 与临时层（悬停速览 / 一次性菜单：自己单开）。悬停展开一个速览不会收起常驻面板。
 *
 * 卡片 / 小面板的**外观与动效**（背景透明度、毛玻璃模糊、边框、圆角、动效时长）是**用户偏好**
 * （settings.yaml），由 `appearance.surfaceVars` 翻成一组 CSS 自定义属性、钉在这一层的根上：
 * `.card` / `.cardHeader` / `.popover` / `.popoverHeader` 都吃同一套值 —— 所以「淡底 + 毛玻璃」时
 * 标题栏跟着一起透，不会出现半张卡实心的断层；托盘那一棵树自己钉同一套值（见 Tray.tsx）。
 *
 * @module @dshp/widget-kit/client/CardLayer
 */
import type { ReactNode } from 'react';
import { Card } from './Card.js';
import { Popover } from './Popover.js';
import { useFramework, useGestureCursor, useLiveSnap } from './hooks.js';
import type { WidgetRuntime } from './service.js';
import { surfaceVars } from './appearance.js';
import type { NormalizedWidget } from './spec.js';
import styles from './styles.module.css';

/** 手势盾：`cursor` 是字符串，没有手势时是 `null` —— 不变就完全不重渲染。 */
function GestureShieldHost({ runtime }: { runtime: WidgetRuntime }): ReactNode {
  const cursor = useGestureCursor(runtime);
  if (cursor === null) return null;
  return <div className={styles.gestureShield} data-cursor={cursor} aria-hidden="true" />;
}

/**
 * 吸附预览虚框（主题色填充 + 主题色柔光，一眼看出「松手会落到这里」）。
 *
 * 候选坐标没变时引用不变，这里也就不重渲染（变化那一次交给 CSS 过渡滑过去）。
 * z-index 取被拖卡片在 z 序里的位置：压在其它卡片之上、又压在被拖的那张卡之下 ——
 * 吸附目标与别的卡片重叠时，虚框仍然看得见，而不会盖住你正在拖的那张。
 */
function SnapGhostHost({ runtime }: { runtime: WidgetRuntime }): ReactNode {
  const snap = useLiveSnap(runtime);
  const snapshot = useFramework(runtime);
  if (snap === null) return null;
  const zIndex = Math.max(1, snapshot.zOrder.indexOf(snap.id));
  return (
    <div
      className={styles.snapGhost}
      style={{
        left: snap.rect.x,
        top: snap.rect.y,
        width: snap.rect.w,
        height: snap.rect.h,
        zIndex,
      }}
      data-ghost-for={snap.id}
      aria-hidden="true"
    />
  );
}

export function CardLayer({
  runtime,
  onError,
}: {
  runtime: WidgetRuntime;
  onError?: ((message: string, error?: unknown) => void) | undefined;
}): ReactNode {
  const snapshot = useFramework(runtime);
  const byId = new Map(snapshot.widgets.map((widget) => [widget.id, widget]));
  // 禁用的组件不渲染（运行时在 setEnabled 时已经把它们收起来了，这里是第二道闸：
  // 刷新后恢复出来的布局里也可能留着一个刚被禁用的 id）
  const disabled = new Set(snapshot.layout.disabled);

  const cards = snapshot.zOrder
    .map((id) => byId.get(id))
    .filter(
      (widget): widget is NonNullable<typeof widget> =>
        widget !== undefined && widget.presentation === 'card' && !disabled.has(widget.id),
    );

  // `snapshot.ready` 之前托盘还没渲染（偏好没到），此刻挂面板只会在兜底位闪一下
  const panelOf = (id: string | null): NormalizedWidget | undefined => {
    if (!snapshot.ready || id === null) return undefined;
    const widget = byId.get(id);
    if (widget === undefined || widget.presentation !== 'popover' || disabled.has(widget.id)) {
      return undefined;
    }
    return widget;
  };
  const transient = panelOf(snapshot.transientId);
  const pinned = panelOf(snapshot.pinnedId);

  return (
    <div className={styles.layer} data-plugin-widget-kit-layer="" style={surfaceVars(snapshot.prefs)}>
      <GestureShieldHost runtime={runtime} />
      <SnapGhostHost runtime={runtime} />
      {cards.map((widget) => (
        <Card key={widget.id} runtime={runtime} widget={widget} onError={onError} />
      ))}
      {pinned !== undefined && <Popover runtime={runtime} widget={pinned} onError={onError} />}
      {transient !== undefined && transient !== pinned && (
        <Popover runtime={runtime} widget={transient} onError={onError} />
      )}
    </div>
  );
}
