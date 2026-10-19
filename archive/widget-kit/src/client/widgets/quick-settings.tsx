/**
 * 参考组件之三：快速设置（**点击展开**的 popover）
 *
 * 它是「小面板放快捷设置」这个用法的参考实现：不可拖动、不可缩放、单开，点图标展开，
 * 面板里直接改框架偏好（走 `runtime.setPrefs` → 宿主 settings.yaml）。
 *
 * 它同时演示 `popover.persistent: true`（**常驻面板**）：点面板外的区域不会收起，方便一边看
 * 设置一边操作界面；关它用面板上的「✕」、再点一次图标或 Esc。
 *
 * 刻意不用下拉菜单（官方 `Menu` 是 portal + `z-index: 1100`，技术上没问题，但在 300px 的小面板里
 * 分段按钮更顺手、也更少层级）；这样面板里只有 `Switch` 与自己的 chip 按钮，键盘路径干净。
 *
 * @module @dshp/widget-kit/client/widgets/quick-settings
 */
import { Button, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { WidgetContentProps, WidgetDescriptor } from '../spec.js';
import { SlidersGlyph } from '../glyphs.js';
import { useFramework } from '../hooks.js';
import type { WidgetRuntime } from '../service.js';
import type { ConfigPatch } from '../types.js';
import styles from '../styles.module.css';

export const QUICK_SETTINGS_WIDGET_ID = 'dshp-widget-kit:quick';

const ICON_LIMITS = [2, 3, 4, 5, 6] as const;
const BADGE_INTERVALS: ReadonlyArray<{ ms: number; label: string }> = [
  { ms: 5000, label: '5 秒' },
  { ms: 15000, label: '15 秒' },
  { ms: 30000, label: '30 秒' },
  { ms: 60000, label: '1 分钟' },
  { ms: 300000, label: '5 分钟' },
];

function Segments<T extends string | number>({
  label,
  value,
  options,
  disabled,
  onPick,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  disabled: boolean;
  onPick: (next: T) => void;
}): ReactNode {
  return (
    <div className={styles.quickSection}>
      <span className={styles.quickLabel}>{label}</span>
      <div className={styles.seg} role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={styles.segBtn + (option.value === value ? ' ' + styles.segBtnActive : '')}
            aria-pressed={option.value === value}
            disabled={disabled}
            onClick={() => {
              onPick(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickSettingsView({ runtime }: { runtime: WidgetRuntime }): ReactNode {
  const snapshot = useFramework(runtime);
  const prefs = snapshot.prefs;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const save = useCallback(
    (patch: ConfigPatch): void => {
      setBusy(true);
      setError(null);
      setNote(null);
      void runtime.setPrefs(patch).then((result) => {
        setBusy(false);
        if (!result.ok) {
          setError(result.error ?? '保存失败，配置未改动');
          return;
        }
        setNote('已保存');
      });
    },
    [runtime],
  );

  return (
    <div className={styles.quick}>
      <div className={styles.quickSection}>
        <div className={styles.quickFoot}>
          <span className={styles.quickLabel}>会话顶部托盘</span>
          <Switch
            checked={prefs.trayEnabled}
            disabled={busy}
            label="显示会话顶部托盘"
            onChange={(next) => {
              save({ trayEnabled: next });
            }}
          />
        </div>
        <span className={styles.quickNote}>关掉托盘会连同卡片一起收起，随时可在这里开回来。</span>
      </div>

      <Segments
        label="可见图标上限"
        value={prefs.maxVisibleIcons}
        options={ICON_LIMITS.map((value) => ({ value, label: String(value) }))}
        disabled={busy}
        onPick={(next) => {
          save({ maxVisibleIcons: next });
        }}
      />

      <Segments
        label="徽标刷新间隔"
        value={prefs.badgeIntervalMs}
        options={BADGE_INTERVALS.map((item) => ({ value: item.ms, label: item.label }))}
        disabled={busy}
        onPick={(next) => {
          save({ badgeIntervalMs: next });
        }}
      />

      <div className={styles.quickSection}>
        <div className={styles.quickFoot}>
          <span className={styles.quickLabel}>本机布局</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const ok = runtime.resetLocal();
              setError(null);
              setNote(ok ? '已清空：托盘顺序与卡片位置回到默认' : '本机布局存储不可用，已用默认布局');
            }}
          >
            清空
          </Button>
        </div>
        <span className={styles.quickNote}>只影响这台浏览器（localStorage），不动 settings.yaml。</span>
      </div>

      {error !== null && <span className={styles.quickError}>{error}</span>}
      {error === null && note !== null && <span className={styles.quickNote}>{note}</span>}
    </div>
  );
}

/**
 * 快速设置组件描述符：`trigger: 'click'` + `persistent: true` —— 点图标展开后**常驻**，
 * 只有 ✕ / 再点图标 / Esc 才收起（不会因为点了别处而消失）。
 *
 * @param runtime - 框架运行时（读偏好、写偏好、清本机布局）。
 */
export function createQuickSettingsWidget(runtime: WidgetRuntime): WidgetDescriptor {
  return {
    id: QUICK_SETTINGS_WIDGET_ID,
    title: '快速设置',
    subtitle: '托盘、徽标与本机布局',
    icon: <SlidersGlyph />,
    order: 120,
    presentation: 'popover',
    popover: { trigger: 'click', width: 300, persistent: true },
    content: {
      title: '快速设置',
      render: (props: WidgetContentProps) => {
        void props;
        return <QuickSettingsView runtime={runtime} />;
      },
    },
  };
}
