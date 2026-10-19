/**
 * 基础 UI 构件（官方设置行规格，与原 client.js 行为一致）
 *
 * 「一行 = 标题 + 说明 + 右侧控件」的版式本来就不在 primitives 里，所以在这里就地实现；官方构件
 * 直接用顶层 `import`（react / primitives 都在 tsup 的 external 里，运行时由 shell 的冻结模块表
 * 注入，绝不打包）。类型全部真实：props 用本地接口建模，`children` 是 `ReactNode`，不再有
 * `AnyReact` / `AnyPrimitives` 那层 shim。
 *
 * @module @dshp/mcwiki-search/client/components
 */
import type { ReactNode } from 'react';
import styles from './styles.module.css';

/**
 * 拼类名。
 *
 * CSS Module 的映射是宽松声明（`shared/types/css-modules.d.ts`），每个值都是 `string | undefined`
 * ——直接拼字符串会得到 `"a undefined"`。这里统一滤掉空值，省得每个调用点自己判。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
export function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/** 徽章配色（原实现只用到 ok / muted 两种）。 */
export type BadgeKind = 'ok' | 'muted';

/** 徽章配色 → 类名（原 `'mw-badge-' + kind` 的映射）。 */
const BADGE_CLASS: Record<BadgeKind, string | undefined> = {
  ok: styles.badgeOk,
  muted: styles.badgeMuted,
};

/** 徽章 props。 */
export interface BadgeProps {
  kind: BadgeKind;
  text: string;
}

/**
 * 一枚状态徽章。
 *
 * @param props - 配色与文字。
 * @returns 胶囊标签。
 */
export function Badge({ kind, text }: BadgeProps): ReactNode {
  return <span className={cx(styles.badge, BADGE_CLASS[kind])}>{text}</span>;
}

/** 设置行 props。 */
export interface RowProps {
  label: string;
  desc?: string | undefined;
  children?: ReactNode;
}

/**
 * 一行设置：左侧标题 + 说明，右侧是调用方给的控件。
 *
 * @param props - 标题、可选说明与右侧控件。
 * @returns 设置行。
 */
export function Row({ label, desc, children }: RowProps): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <div className={styles.title}>{label}</div>
        {desc ? <div className={styles.desc}>{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}
