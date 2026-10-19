/**
 * 基础 UI 构件 —— 尽量包一层官方 @deepseek-ai/dsh-client-ui-primitives 原语
 * （Tag / Switch / Button / Menu），没有的原语才自创；保证主题与交互跟手。
 *
 * 构件是**普通函数组件**，不再是 `createComponents(React, P)` 工厂：官方构件按名 import，
 * props 用本地接口建模（真实类型，不再是 `AnyReact` / `AnyPrimitives` 那层 shim）。运行时这些
 * import 由 shell 的冻结模块表注入（external，不打包进 bundle）。
 *
 * @module @dshp/skill-manager/client/components
 */
import { useState } from 'react';
import {
  Button,
  IconChevronDownOutlineRegular,
  Menu,
  Switch as PrimitiveSwitch,
  Tag,
} from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import type { TagTone } from '@deepseek-ai/dsh-client-ui-primitives';

/**
 * 拼类名。
 *
 * CSS Module 的映射是宽松声明（`shared/types/css-modules.d.ts`），每个值都是 `string | undefined`
 * ——直接拼字符串会得到 "a undefined"。这里统一滤掉空值；返回值是 `string`，顺手满足官方 `Input` /
 * `Modal` 那两处把 `className` 声明成 `string`（不带 `| undefined`）的 props。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
export function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

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

/**
 * 徽章：原生 Tag（tone 映射），没有才自创
 *
 * @param props - 配色与文字。
 * @returns 官方标签。
 */
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

/**
 * 开关：原生 Switch（onChange 取反值）
 *
 * @param props - 勾选态、无障碍名与切换回调。
 * @returns 官方开关。
 */
export function Switch({ checked, disabled, label, title, onChange }: SwitchProps): ReactNode {
  return (
    <PrimitiveSwitch
      checked={checked === true}
      label={label}
      title={title}
      onChange={onChange}
      // 官方 `Switch` 把 `disabled` 声明成 `boolean`（没有 `| undefined`），
      // `exactOptionalPropertyTypes` 下不能把可选值直接透传；调用点全都传布尔值，
      // 这里「有值才传」，转发结果与原实现一致。
      {...(disabled === undefined ? {} : { disabled })}
    />
  );
}

/** 下拉的一个选项。 */
export interface SelectorOption {
  id: string;
  label: string;
}

/** 下拉 props。 */
export interface SelectorProps {
  disabled?: boolean | undefined;
  value: string;
  selectedLabel: string;
  options: SelectorOption[];
  onSelect: (id: string) => void;
}

/**
 * 下拉：原生 Button(toolbar) 作锚 + 原生 Menu
 *
 * @param props - 当前值、选项与选中回调。
 * @returns 锚点按钮 + 条件渲染的菜单。
 */
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
      {/* 以前这个 span 上挂过一个无样式的 `sm-selectorLabel` 标记类，纯属摆设（原 styles.ts
          里没有对应规则）；CSS Module 化后不再保留它（file-change-viewer 的 `fcv-toolRow`
          是先例），DOM 与视觉都不变。 */}
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

/** 「⋯」动作菜单 props。 */
export interface ActionMenuProps {
  disabled?: boolean | undefined;
  text?: string | undefined;
  icon?: ReactNode;
  title?: string | undefined;
  options: SelectorOption[];
  onPick: (id: string) => void;
}

/**
 * 「⋯」动作菜单：原生 Button 作锚 + 原生 Menu（portal，防裁剪）
 *
 * @param props - 当前值、选项与选中回调。
 * @returns 锚点按钮 + 条件渲染的菜单。
 */
export function ActionMenu(props: ActionMenuProps): ReactNode {
  const [open, setOpen] = useState(false);
  const anchor = (
    <Button
      variant="toolbar"
      disabled={props.disabled}
      title={props.title}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      {props.icon !== undefined ? props.icon : (props.text ?? '⋯')}
    </Button>
  );
  return (
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      items={props.options}
      selectedId=""
      onSelect={(id) => {
        setOpen(false);
        props.onPick(id);
      }}
      align="end"
      portal
      anchor={anchor}
    />
  );
}
