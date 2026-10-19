/**
 * 基础 UI 构件 —— 尽量包一层官方 @deepseek-ai/dsh-client-ui-primitives 原语
 * （Tag / Switch / Button / Menu），没有的原语才自创；保证主题与交互跟手。
 *
 * 组件是**普通函数组件**，不再是 `createComponents(React, P)` 工厂：官方组件按名从
 * `@deepseek-ai/dsh-client-ui-primitives` import（devDependency，只参与类型检查与构建），
 * 运行时仍由 shell 的冻结模块表注入，绝不打包。
 *
 * @module @dshp/mcp-manager/client/components
 */
import { useState, type ReactNode } from 'react';
import {
  Button,
  IconChevronDownOutlineRegular,
  Menu,
  Switch as SwitchPrimitive,
  Tag,
  type TagTone,
} from '@deepseek-ai/dsh-client-ui-primitives';

/** 自有 kind。 */
export type BadgeKind = 'ok' | 'warn' | 'muted' | 'info' | 'err';

/** 自有 kind → 原生 Tag tone */
const KIND_TO_TONE: Record<BadgeKind, TagTone> = {
  ok: 'success',
  warn: 'warning',
  muted: 'neutral',
  info: 'info',
  err: 'danger',
};

/** 徽章 props。 */
export interface BadgeProps {
  kind: BadgeKind;
  text: string;
}

/** 徽章：原生 Tag（tone 映射），没有才自创 */
export function Badge({ kind, text }: BadgeProps): ReactNode {
  return <Tag tone={KIND_TO_TONE[kind]}>{text}</Tag>;
}

/** 开关 props。 */
export interface SwitchProps {
  checked: boolean;
  disabled?: boolean | undefined;
  label: string;
  title?: string | undefined;
  onChange: (next: boolean) => void;
}

/** 开关：原生 Switch（onChange 取反值） */
export function Switch({ checked, disabled, label, title, onChange }: SwitchProps): ReactNode {
  return (
    <SwitchPrimitive
      checked={checked === true}
      disabled={disabled === true}
      label={label}
      title={title}
      onChange={onChange}
    />
  );
}

/** 下拉的一个选项。 */
export interface SelectOption {
  id: string;
  label: string;
}

/** 下拉 props。 */
export interface SelectorProps {
  disabled?: boolean | undefined;
  value: string;
  selectedLabel: string;
  options: SelectOption[];
  onSelect: (id: string) => void;
}

/** 下拉：原生 Button(toolbar) 作锚 + 原生 Menu */
export function Selector({ disabled, value, selectedLabel, options, onSelect }: SelectorProps): ReactNode {
  const [open, setOpen] = useState(false);
  const anchor = (
    <Button
      variant="toolbar"
      disabled={disabled}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      {/* 旧实现给这个 span 挂过 `mc-selectorLabel`，但 `styles.ts` 里从来没有这条规则——纯摆设。
          与 c8e140f（file-change-viewer 去掉无样式的 `fcv-toolRow`）同一先例：CSS Module 化时去掉，
          不写成 `styles.selectorLabel`（那会被 check-css-modules 判「用了但没定义」而红）。 */}
      <span>{selectedLabel}</span>
      <IconChevronDownOutlineRegular />
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
      align="start"
      portal
      anchor={anchor}
    />
  );
}
