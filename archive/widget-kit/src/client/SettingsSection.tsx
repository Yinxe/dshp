/**
 * 设置节：`设置 → 小组件`
 *
 * 这里放的是**用户配置**（进 settings.yaml 的 `dshp-widget-kit` 分节）；**本机布局**（托盘顺序、
 * 卡片位置尺寸与锁定、隐藏/禁用集合、层叠顺序）留在浏览器 localStorage，只有两个动作：
 * 「清空本机布局」（全清）与「清理已卸载组件的残留」（只清不在册的 id）—— 这条边界写在
 * docs/widget-spec.md 里。后者是手动的：插件热重载/暂时停用都会短暂「不在册」，
 * 自动清理会把开发中的布局误删。
 *
 * 下面的组件列表同时是**动态启停**的入口：禁用 = 图标、卡片、面板、徽标一并停用（软卸载），
 * 注册记录与本机布局都保留，随时可以再启用。
 *
 * @module @dshp/widget-kit/client/SettingsSection
 */
import { Button, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchState } from './api.js';
import { SPEC_DEFAULTS } from './spec.js';
import { Notice, PrefSelect, PrefSlider, SettingRow } from './components.js';
import { useFramework } from './hooks.js';
import type { WidgetRuntime } from './service.js';
import type { ConfigPatch } from './types.js';
import styles from './styles.module.css';

const ICON_LIMIT_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 2, label: '2 个' },
  { value: 3, label: '3 个' },
  { value: 4, label: '4 个' },
  { value: 5, label: '5 个' },
  { value: 6, label: '6 个' },
  { value: 8, label: '8 个' },
];

const MOTION_OPTIONS: ReadonlyArray<{ value: number; label: string }> = SPEC_DEFAULTS.motionChoices.map(
  (ms) => ({ value: ms, label: ms === 0 ? '关闭（不做过渡）' : `${String(ms)} ms` }),
);

/** 边框 / 圆角 / 动效三组枚举（显式写类型，避免可选属性把 `undefined` 带进泛型）。 */
type CardBorderMode = 'auto' | 'on' | 'off';
type CardRadiusMode = 'auto' | 'round' | 'square';

const CARD_BORDER_OPTIONS: ReadonlyArray<{ value: CardBorderMode; label: string }> = [
  { value: 'auto', label: '默认（跟随框架）' },
  { value: 'on', label: '显示边框' },
  { value: 'off', label: '无边框' },
];

const CARD_RADIUS_OPTIONS: ReadonlyArray<{ value: CardRadiusMode; label: string }> = [
  { value: 'auto', label: '默认（跟随框架）' },
  { value: 'round', label: '圆角' },
  { value: 'square', label: '直角' },
];

const BADGE_INTERVAL_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 5000, label: '5 秒' },
  { value: 15000, label: '15 秒' },
  { value: 30000, label: '30 秒' },
  { value: 60000, label: '1 分钟' },
  { value: 300000, label: '5 分钟' },
];

export function SettingsSection({
  runtime,
  onPrefsApplied,
}: {
  runtime: WidgetRuntime;
  onPrefsApplied?: (prefs: ReturnType<WidgetRuntime['getSnapshot']>['prefs']) => void;
}): ReactNode {
  const snapshot = useFramework(runtime);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const prefs = snapshot.prefs;
  const disabled = new Set(snapshot.layout.disabled);

  useEffect(() => {
    let cancelled = false;
    void fetchState()
      .then((state) => {
        if (cancelled) return;
        if (state.config !== undefined) runtime.applyPrefs(state.config);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(`读取配置失败（Host 半可能没挂载）：${String((cause as Error)?.message ?? cause)}`);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [runtime]);

  const save = useCallback(
    (patch: ConfigPatch): void => {
      setSaving(true);
      setError(null);
      setNotice(null);
      void runtime.setPrefs(patch).then((result) => {
        setSaving(false);
        if (!result.ok) {
          setError(result.error ?? '保存失败，配置未改动');
          return;
        }
        onPrefsApplied?.(runtime.getSnapshot().prefs);
        setNotice('已保存');
      });
    },
    [onPrefsApplied, runtime],
  );

  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.sectionTitle}>小组件</h2>
        <p className={styles.sectionHint}>
          本插件只是**小组件的宿主与规范**，自身不含业务组件（下面两个参考组件可以关掉）。 其他插件按{' '}
          <code>docs/widget-spec.md</code> 注册组件后，会自动出现在会话顶部托盘里。
        </p>
      </div>

      {error !== null && <Notice tone="bad">{error}</Notice>}
      {notice !== null && <Notice tone="ok">{notice}</Notice>}
      {!loaded && <Notice>正在读取配置…</Notice>}

      <div className={styles.group}>
        <SettingRow title="会话顶部托盘" hint="关掉后所有组件图标都会隐藏（卡片也会一并收起）。">
          <Switch
            checked={prefs.trayEnabled}
            disabled={saving}
            label="显示会话顶部托盘"
            onChange={(next) => {
              save({ trayEnabled: next });
            }}
          />
        </SettingRow>
        <SettingRow title="可见图标上限" hint="超出的组件进溢出菜单（⋯），仍可用键盘打开、排序与隐藏。">
          <PrefSelect
            label="可见图标上限"
            value={prefs.maxVisibleIcons}
            options={ICON_LIMIT_OPTIONS}
            disabled={saving}
            onChange={(next) => {
              save({ maxVisibleIcons: next });
            }}
          />
        </SettingRow>
        <SettingRow
          title="徽标刷新间隔"
          hint="框架统一调度：页面不可见时暂停，单组件失败按 5s→10s→30s→60s 退避。"
        >
          <PrefSelect
            label="徽标刷新间隔"
            value={prefs.badgeIntervalMs}
            options={BADGE_INTERVAL_OPTIONS}
            disabled={saving}
            onChange={(next) => {
              save({ badgeIntervalMs: next });
            }}
          />
        </SettingRow>
        <SettingRow title="图标悬停预览" hint="悬停托盘图标时显示组件名与徽标说明。">
          <Switch
            checked={prefs.hoverPreview}
            disabled={saving}
            label="显示图标悬停预览"
            onChange={(next) => {
              save({ hoverPreview: next });
            }}
          />
        </SettingRow>
        <SettingRow
          title="参考组件"
          hint="本插件自带的四个规范示例（不是业务）：两张卡片「时钟 / 组件诊断」，两个小面板「快速设置（点击展开）/ 状态速览（悬停展开）」。「组件箱」是框架的统一入口，不在此列、始终装载。"
        >
          <Switch
            checked={prefs.referenceWidgets}
            disabled={saving}
            label="装载参考组件"
            onChange={(next) => {
              save({ referenceWidgets: next });
            }}
          />
        </SettingRow>
      </div>

      <div>
        <h3 className={styles.sectionTitle}>卡片外观与动效</h3>
        <p className={styles.sectionHint}>
          统一作用于所有卡片与小面板（含标题栏）：拖动滑块即时预览，松手写入 <code>settings.yaml</code>
          ，刷新与换设备都保持。
        </p>
        <div className={styles.group}>
          <SettingRow
            title="背景不透明度"
            hint="100% = 完全用主题底色；越小越透，配合下面的毛玻璃就是「淡底玻璃」效果。"
          >
            <PrefSlider
              label="卡片背景不透明度"
              value={prefs.cardOpacity}
              min={0.2}
              max={1}
              step={0.05}
              format={(next) => `${String(Math.round(next * 100))}%`}
              onChange={(next) => {
                // 拖动中只改本地快照：每帧都往宿主写会刷爆 settings.yaml
                void runtime.setPrefs({ cardOpacity: next }, { save: false });
              }}
              onCommit={(next) => {
                save({ cardOpacity: next });
              }}
            />
          </SettingRow>
          <SettingRow
            title="毛玻璃模糊"
            hint="0 = 关闭（不启用 backdrop-filter）；透明度越低，模糊越看得出来。"
          >
            <PrefSlider
              label="卡片毛玻璃模糊半径"
              value={prefs.cardBlur}
              min={0}
              max={32}
              step={1}
              format={(next) => (next === 0 ? '关闭' : `${String(next)} px`)}
              onChange={(next) => {
                void runtime.setPrefs({ cardBlur: next }, { save: false });
              }}
              onCommit={(next) => {
                save({ cardBlur: next });
              }}
            />
          </SettingRow>
          <SettingRow title="边框" hint="默认跟随框架（0.5px 细边）；也可以更明显、或完全不要边框。">
            <PrefSelect
              label="卡片边框"
              value={prefs.cardBorder}
              options={CARD_BORDER_OPTIONS}
              disabled={saving}
              onChange={(next) => {
                save({ cardBorder: next });
              }}
            />
          </SettingRow>
          <SettingRow
            title="圆角"
            hint="默认跟随框架（12px 圆角）；「圆角」更圆（20px），「直角」为 0（最小化的胶囊也一起拉平）。"
          >
            <PrefSelect
              label="卡片圆角"
              value={prefs.cardRadius}
              options={CARD_RADIUS_OPTIONS}
              disabled={saving}
              onChange={(next) => {
                save({ cardRadius: next });
              }}
            />
          </SettingRow>
          <SettingRow
            title="动画过渡"
            hint="卡片出现 / 收放 / 落位、吸附预览滑动、托盘图标让位都按这个时长过渡；拖动跟手与手势盾不受影响。系统「减少动效」优先。"
          >
            <PrefSelect
              label="动画过渡时长"
              value={prefs.motionMs}
              options={MOTION_OPTIONS}
              disabled={saving}
              onChange={(next) => {
                save({ motionMs: next });
              }}
            />
          </SettingRow>
        </div>
      </div>

      <div>
        <h3 className={styles.sectionTitle}>已注册组件（{String(snapshot.widgets.length)}）</h3>
        <p className={styles.sectionHint}>
          本机布局（托盘顺序、卡片位置尺寸与锁定、隐藏与禁用、层叠顺序）只存在这台浏览器里；
          换设备或清缓存会回到默认布局。「启用」开关就是动态启停：关掉后图标、卡片、面板与徽标一并停用，
          但注册记录与布局都留着，随时可以再打开。
        </p>
        {snapshot.widgets.length === 0 ? (
          <div className={styles.empty}>暂无插件注册小组件。</div>
        ) : (
          <div className={styles.list}>
            {snapshot.widgets.map((widget) => {
              const title = typeof widget.title === 'function' ? widget.title() : widget.title;
              const enabled = !disabled.has(widget.id);
              const open = runtime.isOpen(widget.id);
              const locked = widget.presentation === 'card' && runtime.isLocked(widget.id);
              return (
                <div
                  key={widget.id}
                  className={styles.listRow + (enabled ? '' : ' ' + styles.listRowOff)}
                  data-disabled={enabled ? 'false' : 'true'}
                >
                  <div className={styles.listMain}>
                    <span className={styles.listId}>{widget.id}</span>
                    <span className={styles.listMeta}>
                      {title} · 来源 {widget.owner} · {widget.presentation}
                      {locked ? ' · 位置已锁定' : ''}
                      {enabled ? '' : ' · 已禁用'}
                    </span>
                  </div>
                  <div className={styles.listActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!enabled || widget.presentation === 'tray'}
                      onClick={() => {
                        runtime.toggle(widget.id);
                      }}
                    >
                      {open ? '收起' : '打开'}
                    </Button>
                    <Switch
                      checked={enabled}
                      label={`启用「${title}」`}
                      onChange={(next) => {
                        runtime.setEnabled(widget.id, next);
                        setNotice(
                          next
                            ? `「${title}」已启用：图标与卡片回到原来的位置。`
                            : `「${title}」已禁用：图标、卡片与面板一并停用，布局保留。`,
                        );
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const ok = runtime.resetLocal();
            setNotice(
              ok
                ? '本机布局已清空：托盘顺序、卡片位置尺寸与锁定、隐藏与禁用都回到默认。'
                : '本机布局存储不可用（隐私模式或配额满），已经在用默认布局。',
            );
          }}
        >
          清空本机布局
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const removed = runtime.pruneOrphans();
            setNotice(
              removed > 0
                ? `已清理 ${String(removed)} 个「已卸载且一直没回来」的组件残留（在册组件的布局不受影响）。`
                : '没有可清理的残留：当前所有布局记录都对应着在册组件。',
            );
          }}
        >
          清理已卸载组件的残留
        </Button>
        <span className={styles.rowHint}>
          框架 v{runtime.frameworkVersion} · 契约 SPEC v{String(runtime.specVersion)}
        </span>
      </div>
    </div>
  );
}
