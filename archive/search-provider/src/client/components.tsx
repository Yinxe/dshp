/**
 * 通用小构件（官方 primitives 之上的一层薄封装，多供应商设置页共用）
 *
 * 模块级函数组件；官方构件（`Menu` 与图标）从 primitives 顶层 import，`useState` 从 react import
 * ——都是 devDependency，只参与类型检查与构建，运行时由 shell 的冻结模块表注入。类名走
 * `styles.module.css` 的映射，不再手拼 `sp-` 前缀字符串（原实现那些字符串是全局类名，现在由构建期
 * 哈希成局部名）。
 *
 * 新增供应商只在 SearchSection / providers/* 里组合这些构件，不重复造。
 *
 * 原实现：dsh-tavily-search/client.js 里的 Badge/Row/Select 内联组件（JS）
 * → 本文件为等价 TS 重写 + 抽出 Notice/Meter/BreakRow/Loading 复用件。
 *
 * @module @dshp/search-provider/client
 */
import { useState } from 'react';
import {
  IconChevronDownOutlineRegular,
  IconLoadingOutlineRegular,
  Menu,
} from '@deepseek-ai/dsh-client-ui-primitives';
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
function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/** 徽章配色（与官方状态色同源）。 */
export type BadgeKind = 'ok' | 'warn' | 'muted';

/** 徽章配色 → 类名（原来是运行时拼 `'sp-badge-' + kind`，现在查表）。 */
const BADGE_CLASS: Record<BadgeKind, string | undefined> = {
  ok: styles.badgeOk,
  warn: styles.badgeWarn,
  muted: styles.badgeMuted,
};

/** 徽章 props。 */
export interface BadgeProps {
  kind: BadgeKind;
  text: string;
}

/** 一行设置的 props。 */
export interface RowProps {
  label: string;
  desc?: string | undefined;
  children?: ReactNode;
}

/** 下拉的一个选项。 */
export interface SelectOption {
  id: string;
  label: string;
}

/** 下拉 props。 */
export interface SelectProps {
  value: string;
  selectedLabel: string;
  options: SelectOption[];
  disabled?: boolean | undefined;
  onSelect: (id: string) => void;
}

/** 提示条配色。 */
export type NoticeKind = 'ok' | 'err';

/** 提示条配色 → 类名（原来是运行时拼 `'sp-notice-' + kind`，现在查表）。 */
const NOTICE_CLASS: Record<NoticeKind, string | undefined> = {
  ok: styles.noticeOk,
  err: styles.noticeErr,
};

/** 提示条 props。 */
export interface NoticeProps {
  kind: NoticeKind;
  text: string;
}

/** 说明文字 props。 */
export interface HintProps {
  text: string;
}

/** 读取中提示 props。 */
export interface LoadingProps {
  text: string;
}

/** 用量进度条 props。 */
export interface MeterProps {
  pct: number;
}

/** 分项用量一行 props。 */
export interface BreakRowProps {
  label: string;
  value: string;
}

/** 通用小构件集合（SearchSection 与各供应商附加区共用同一份）。 */
export interface Components {
  Badge: (props: BadgeProps) => ReactNode;
  Row: (props: RowProps) => ReactNode;
  Select: (props: SelectProps) => ReactNode;
  Notice: (props: NoticeProps) => ReactNode;
  Hint: (props: HintProps) => ReactNode;
  Loading: (props: LoadingProps) => ReactNode;
  Meter: (props: MeterProps) => ReactNode;
  BreakRow: (props: BreakRowProps) => ReactNode;
}

/**
 * 一枚状态胶囊。
 *
 * @param props - 配色与文字。
 * @returns 胶囊标签。
 */
export function Badge({ kind, text }: BadgeProps): ReactNode {
  return <span className={cx(styles.badge, BADGE_CLASS[kind])}>{text}</span>;
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

/**
 * 胶囊按钮 + 官方 `Menu`(portal) 下拉（官方设置页同款）。
 *
 * 自己持有「展开 / 收起」这一个状态，选中后先收起再回调。
 *
 * @param props - 当前值、选项与选中回调。
 * @returns 锚点按钮 + 条件渲染的菜单。
 */
export function Select({ value, selectedLabel, options, disabled, onSelect }: SelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const selector = (
    <button
      type="button"
      className={styles.selector}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => setOpen((v) => !v)}
    >
      <span className={styles.selectorLabel}>{selectedLabel}</span>
      <IconChevronDownOutlineRegular className={styles.chevron} />
    </button>
  );
  return (
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      items={options}
      selectedId={value}
      onSelect={(id) => {
        setOpen(false);
        onSelect(id);
      }}
      align="end"
      portal
      anchor={selector}
    />
  );
}

/**
 * 一条提示。
 *
 * @param props - 配色与文字。
 * @returns 提示段落。
 */
export function Notice({ kind, text }: NoticeProps): ReactNode {
  return <p className={cx(styles.notice, NOTICE_CLASS[kind])}>{text}</p>;
}

/**
 * 一条说明文字。
 *
 * @param props - 文字。
 * @returns 说明段落。
 */
export function Hint({ text }: HintProps): ReactNode {
  return <p className={styles.hint}>{text}</p>;
}

/**
 * 读取中提示（图标 + 文字）。
 *
 * @param props - 文字。
 * @returns 读取中一行。
 */
export function Loading({ text }: LoadingProps): ReactNode {
  return (
    <div className={styles.loading}>
      <IconLoadingOutlineRegular />
      <span className={styles.loadingText}>{text}</span>
    </div>
  );
}

/**
 * 用量进度条（≥90% 转错误色）。
 *
 * @param props - 百分比。
 * @returns 进度条。
 */
export function Meter({ pct }: MeterProps): ReactNode {
  const v = typeof pct === 'number' && Number.isFinite(pct) ? Math.min(100, Math.max(0, Math.round(pct))) : 0;
  return (
    <div className={styles.meter}>
      <div
        className={cx(styles.meterFill, v >= 90 ? styles.meterFillHigh : undefined)}
        style={{ width: v + '%' }}
      />
    </div>
  );
}

/**
 * 分项用量的一行（左标签右数值）。
 *
 * @param props - 标签与数值。
 * @returns 一行。
 */
export function BreakRow({ label, value }: BreakRowProps): ReactNode {
  return (
    <div className={styles.breakRow} key={label}>
      <span className={styles.breakLabel}>{label}</span>
      <span className={styles.breakValue}>{value}</span>
    </div>
  );
}

/**
 * 通用小构件集合（供 `createProviderExtras(C, bridge)` 与 `fieldControl` 共用）。
 *
 * 与各构件一一对应；**不是**工厂的返回值，只是同一个模块里的一份具名打包，方便按集合传递。
 */
export const components: Components = {
  Badge,
  Row,
  Select,
  Notice,
  Hint,
  Loading,
  Meter,
  BreakRow,
};
