/**
 * 设置页构件：设置行 + 胶囊下拉。
 *
 * 开关、状态标签、按钮、菜单都直接用官方 primitives；这里只保留官方没有的
 * 「标题 + 说明 + 右侧控件」版式和下拉锚点。
 */
import { useState, type ReactNode } from 'react';
import { Button, IconChevronDownOutlineRegular, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import styles from './styles.module.css';

export interface RowProps {
  label: string;
  desc?: string | undefined;
  children?: ReactNode;
}

/** 一行设置：左侧标题 + 说明，右侧是调用方给的控件。 */
export function Row({ label, desc, children }: RowProps): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {desc ? <div className={styles.rowDesc}>{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps {
  disabled?: boolean | undefined;
  /** 当前值；没有选中项时传空串。 */
  value: string;
  /** 无障碍名。 */
  label: string;
  /** 收起状态下按钮上显示的文字。 */
  selectedLabel: string;
  options: SelectOption[];
  onSelect: (id: string) => void;
}

/** 受控胶囊下拉：锚点用官方 Button，菜单用官方 Menu。 */
export function Select({ disabled, value, label, selectedLabel, options, onSelect }: SelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const anchor = (
    <Button
      variant="outline"
      size="sm"
      className={styles.select}
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
    >
      <span className={styles.selectLabel}>{selectedLabel}</span>
      <IconChevronDownOutlineRegular className={styles.chevron} />
    </Button>
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
      anchor={anchor}
    />
  );
}
