/**
 * 设置节的小构件（官方 primitives 里没有的那几个）
 *
 * @module @dshp/widget-kit/client/components
 */
import { Button, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import type { MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives';
import { useState } from 'react';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

/** 一行设置：左标题+说明，右控件。 */
export function SettingRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span className={styles.rowTitle}>{title}</span>
        {hint !== undefined && <span className={styles.rowHint}>{hint}</span>}
      </div>
      <div className={styles.rowControl}>{children}</div>
    </div>
  );
}

/**
 * 强度滑块（原生 `range` + token 取自主题）。
 *
 * 为什么用原生 `range`：官方 primitives 里没有 Slider，而滑块要的键盘可达性（方向键/Home/End）
 * 原生就有，自己拿 div 拼反而要做一堆 a11y。样式只调 `accent-color`（颜色仍来自 token）。
 *
 * @param props - `label` 可访问名、`value` 当前值、`min`/`max`/`step` 范围、`format` 右侧读数、`onChange`
 *   拖动过程（用于本地预览）与 `onCommit` 松手/失焦（用于落盘）。
 */
export function PrefSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (next: number) => string;
  onChange: (next: number) => void;
  onCommit: (next: number) => void;
}): ReactNode {
  return (
    <div className={styles.slider}>
      <input
        type="range"
        className={styles.sliderInput}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        // range 的 change 在拖动过程中就会连续触发，所以「落盘」放在指针松开 / 键盘抬起 / 失焦
        onPointerUp={() => {
          onCommit(value);
        }}
        onKeyUp={() => {
          onCommit(value);
        }}
        onBlur={() => {
          onCommit(value);
        }}
      />
      <span className={styles.sliderValue}>{format(value)}</span>
    </div>
  );
}

/** 枚举选择（胶囊按钮 + 官方 Menu；键盘/焦点交给官方组件）。 */
export function PrefSelect<T extends string | number>({
  value,
  options,
  label,
  disabled,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  label: string;
  disabled?: boolean;
  onChange: (next: T) => void;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);
  const items: MenuEntry[] = options.map((option) => ({ id: String(option.value), label: option.label }));
  return (
    <Menu
      open={open}
      dense
      selection="check"
      selectedId={String(value)}
      items={items}
      align="end"
      onClose={() => {
        setOpen(false);
      }}
      onSelect={(id) => {
        setOpen(false);
        const next = options.find((option) => String(option.value) === id);
        if (next !== undefined) onChange(next.value);
      }}
      anchor={
        <Button
          variant="outline"
          size="sm"
          aria-label={label}
          disabled={disabled === true}
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          {current?.label ?? String(value)}
        </Button>
      }
    />
  );
}

/** 一行提示（普通 / 出错 / 成功三态）。 */
export function Notice({
  tone = 'plain',
  children,
}: {
  tone?: 'plain' | 'bad' | 'ok';
  children: ReactNode;
}): ReactNode {
  const toneClass = tone === 'bad' ? styles.noticeBad : tone === 'ok' ? styles.noticeOk : '';
  return <p className={styles.notice + (toneClass === '' ? '' : ' ' + toneClass)}>{children}</p>;
}
