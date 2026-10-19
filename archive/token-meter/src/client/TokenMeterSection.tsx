/**
 * TokenMeter 设置页（精简版）+ 中心区「用量统计」面板 + 全局小组件浮层
 *
 * 布局分工：
 *  - 设置页（settings.section）：偏好（自动刷新/默认范围/在线阈值）+ 供应商添加与管理
 *    （当前选择/拉取/编辑/存凭据/删除）。图表与展示全部搬到中心区，
 *    设置页不再展示趋势/热力/模型分布；失效的侧边栏显示开关已移除。
 *  - 中心区 tab（conversation.view，见 CenterView.tsx）：左侧菜单切换
 *    额度查询 / 用量统计 / 在线统计；本文件提供其中「用量统计」面板与「设置」分区。
 *
 * 状态经 quota 共享 store 即时同步（设置/中心区同一数据源）；偏好变更后广播
 * `tm-prefs-changed`，中心区用量面板跟进重载。
 *
 * 装配方式：**模块级**（不再是 `createTokenMeterSection(React, P, ReactDOM)` 工厂）。
 * bundle 的 loader factory 每次加载只求值一次本模块，所以模块级常量就是「每插件实例一份」，
 * 与原实现「在工厂里建一次」的时机与份数完全相同。三个共享件在这里建：
 *
 *  - `widgets`：小组件注册表（浮层的唯一实例，既给本文件的浮层用，也注入给 QuotaSection）；
 *  - `quota`：QuotaSection 的装配产出（**保留工厂**：`widgets` 是它真实的注入依赖）；
 *  - `stats`：StatsSection 的零件全部是模块级具名导出，按名 import。
 *
 * @module @dshp/token-meter/client/TokenMeterSection
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Button, RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives';
import { clearStatsCache, fetchState, fetchStats } from './api.js';
import { createQuotaSection } from './QuotaSection.js';
import { HiddenWhenFloated, StatsSettingsPage, StatsWidget, TodayCard } from './StatsSection.js';
import { createWidgetSystem } from './widgets.js';
import { STATS_KINDS, STATS_TITLES } from './widget-bridge.js';
import styles from './styles.module.css';
import type { StatsSnapshot } from './types.js';
import { DISPLAY_NAME } from '../name.js';

const STATS_WIDGET_BTNS: Array<[string, string]> = [
  ['cards', '指标卡'],
  ['trend', '趋势'],
  ['heat', '热力'],
  ['donut', '模型'],
  ['today', '今日'],
];

const SEC_PRESETS = [0, 30, 60, 120, 300, 600, 1800, 3600];

/**
 * 自动刷新档位的显示文案。
 *
 * @param n - 秒数（0 = 关闭）。
 * @returns 中文档位名。
 */
function secLabel(n: number): string {
  return n === 0 ? '关闭自动刷新' : n + ' 秒';
}

/** 新增供应商表单的初始值（与 Host 的 provider 元数据 `defaultParams` 互补）。 */
const NEW_VENDOR = { id: '', name: '', type: 'opencode', params: { workspaceId: '', cookie: '' } };

/**
 * 拼类名。
 *
 * CSS Module 的映射是宽松声明（`shared/types/css-modules.d.ts`），每个值都是 `string | undefined`
 * ——直接拼字符串会得到 `"a undefined"`。这里统一滤掉空值。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/** 小组件注册表（浮层的唯一实例）。 */
const widgets = createWidgetSystem();

/** 额度侧装配产出（store + 配置零件 + 侧边栏额度按钮）。 */
const quota = createQuotaSection();

/** 额度 store 与设置页共用的小构件集合。 */
export const quotaStore = quota.quotaStore;
const store = quotaStore;
const UI = quota.quotaUI;

/** 小组件注册表导出：`apply` 用它清掉遗留的 `online:*` 浮窗记录。 */
export const widgetsApi = widgets;

/**
 * 偏好变更广播。
 *
 * @param patch - 变更的字段（中心区面板据此重载）。
 */
function notifyPrefs(patch: Record<string, unknown>): void {
  try {
    window.dispatchEvent(new CustomEvent('tm-prefs-changed', { detail: patch }));
  } catch {
    /* ignore */
  }
}

/**
 * 精简设置页：开关 + 供应商添加/管理（无图表）。
 *
 * @returns 设置节内容（`settings.section` 与中心区「设置」分区共用同一个组件）。
 */
export function TokenMeterSettings(): ReactNode {
  const s = store.useStore();
  useEffect(() => {
    void store.ensureLoad();
  }, []);
  const [busy, setBusy] = useState(false);
  const [opErr, setOpErr] = useState('');
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(NEW_VENDOR)));
  const [editing, setEditing] = useState<{ id: string; data: any } | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [acked, setAcked] = useState(false);

  /**
   * 包一层「忙」态。
   *
   * @param fn - 实际动作。
   */
  async function withBusy(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setOpErr('');
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  /**
   * 新增 / 修改一个供应商。
   *
   * @param v - 表单草稿。
   * @param isEdit - true = 修改既有项。
   */
  async function saveVendor(v: any, isEdit: boolean): Promise<void> {
    await withBusy(async () => {
      try {
        const r = await store.call(isEdit ? 'quota.update-vendor' : 'quota.add-vendor', { vendor: v });
        if (r && r.ok) {
          if (!isEdit) setDraft(JSON.parse(JSON.stringify(NEW_VENDOR)));
          else setEditing(null);
          await store.reload();
        } else setOpErr(String((r && r.error) || '保存失败'));
      } catch {
        setOpErr('连接 Host 失败');
      }
    });
  }

  /**
   * 删除一个供应商。
   *
   * @param id - 供应商 id。
   */
  async function delVendor(id: string): Promise<void> {
    await withBusy(async () => {
      try {
        const r = await store.call('quota.delete-vendor', { id });
        if (!(r && r.ok)) setOpErr(String((r && r.error) || '删除失败'));
        await store.reload();
      } catch {
        setOpErr('连接 Host 失败');
      }
    });
  }

  /**
   * 把明文密钥转存为系统凭据引用。
   *
   * @param id - 供应商 id。
   */
  async function toCred(id: string): Promise<void> {
    await withBusy(async () => {
      try {
        const r = await store.call('quota.secret-to-cred', { id });
        if (r && r.ok) await store.reload();
        else setOpErr(String((r && r.error) || '转存失败'));
      } catch {
        setOpErr('连接 Host 失败');
      }
    });
  }

  /**
   * 保存默认统计范围。
   *
   * @param v - `7` / `30` / `90` / `all`。
   */
  const pickRange = (v: string): Promise<void> =>
    withBusy(async () => {
      const r = await store.savePrefs({ defaultRange: v });
      if (!r.ok) setOpErr(String(r.error || '保存失败'));
      else notifyPrefs({ defaultRange: v });
    });

  const [tab, setTab] = useState<'stats' | 'quota'>('stats');
  const [statsSnap, setStatsSnap] = useState<StatsSnapshot | null>(null);
  const [clearArmed, setClearArmed] = useState(false);
  const [clearMsg, setClearMsg] = useState('');
  useEffect(() => {
    let alive = true;
    const tick = (): void => {
      void fetchStats()
        .then((v) => {
          if (alive) setStatsSnap(v);
        })
        .catch(() => {});
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [clearMsg]);

  const commonKids: ReactNode[] = [];
  const statsKids: ReactNode[] = [];
  const quotaKids: ReactNode[] = [];
  if (s.error)
    commonKids.push(
      <p key="err" className={cx(styles.notice, styles.noticeErr)}>
        {s.error}
      </p>,
    );
  if (opErr)
    commonKids.push(
      <p key="operr" className={cx(styles.notice, styles.noticeErr)}>
        {opErr}
      </p>,
    );
  if (!s.cfg) {
    commonKids.push(
      <div key="loading" className={styles.loading}>
        <span className={styles.spinner} />
        <span className={styles.loadingText}>{s.loading ? '正在读取配置…' : '配置加载失败'}</span>
      </div>,
    );
    return <div className={styles.page}>{commonKids}</div>;
  }

  const vendors = s.cfg.vendors || [];
  const activeId = s.cfg.activeVendor || '';
  const a0 = store.activeOf(s);
  const rawSec = s.cfg.refreshSec;
  const curSec =
    rawSec === undefined || rawSec === null || rawSec === ''
      ? 60
      : Number(rawSec) === 0
        ? 0
        : isFinite(Number(rawSec))
          ? Math.min(3600, Math.max(10, Number(rawSec) || 60))
          : 60;
  const defRange = String(s.cfg.defaultRange || 'all');

  // 偏好：额度侧（自动刷新）与统计侧（默认范围、在线阈值）分到各自 tab
  quotaKids.push(
    <div key="display" className={styles.section}>
      <div className={styles.sectionHead}>偏好</div>
      <UI.SecRow
        key="sec"
        label="自动刷新"
        desc="每隔这么久自动去平台拉一次额度（只拉「已启用」的供应商，禁用的见下方列表）。选「关闭自动刷新」后不再定时拉取，仍可随时手动点「拉取」。"
      >
        <UI.PillSelect
          disabled={busy}
          value={String(curSec)}
          selectedLabel={secLabel(curSec)}
          options={(SEC_PRESETS.indexOf(curSec) >= 0 ? SEC_PRESETS : [curSec].concat(SEC_PRESETS)).map(
            (n) => ({
              id: String(n),
              label: secLabel(n),
            }),
          )}
          onSelect={(id: string) => void withBusy(() => store.setRefresh(Number(id)))}
        />
      </UI.SecRow>
    </div>,
  );

  const snapTotal = statsSnap && typeof statsSnap.total === 'number' ? statsSnap.total : null;
  const snapScanned = statsSnap && typeof statsSnap.scanned === 'number' ? statsSnap.scanned : null;
  const snapErrors = statsSnap && typeof statsSnap.errors === 'number' ? statsSnap.errors : null;
  const snapHits = statsSnap && typeof statsSnap.cacheHits === 'number' ? statsSnap.cacheHits : null;
  const snapReused = statsSnap && typeof statsSnap.reused === 'number' ? statsSnap.reused : null;
  const gapNow = String((s.cfg as any).onlineGapMin ?? 5);
  statsKids.push(
    <div key="source" className={styles.card}>
      <div className={styles.title}>数据来源：会话记录（唯一真相源）</div>
      <p className={styles.desc} style={{ margin: '4px 0 0' }}>
        {'所有统计（Token 用量、在线时长、模型分布、热力图…）都由 '}
        <code className={styles.mono}>$DSH_HOME/sessions/</code>
        {
          ' 下的会话日志聚合而来。下面的缓存只是**可丢的派生数据**：删掉后会自动凭会话日志重算，但**会话记录本身丢了就再也算不回来**。'
        }
      </p>
      <p className={styles.desc} style={{ margin: '4px 0 0' }}>
        {'迁移 / 备份 / 换机时：**保留 `sessions/` 目录**（体积以本机为例约 250MB）；'}
        <code className={styles.mono}>storages/token_stats.json</code>
        {' 不必备份（重建即可）。'}
      </p>
      <div className={styles.toolbar} style={{ marginTop: 8 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            try {
              void navigator.clipboard.writeText('$DSH_HOME/sessions/');
              setClearMsg('已复制会话目录路径');
            } catch {
              setClearMsg('复制失败，请手动复制 $DSH_HOME/sessions/');
            }
          }}
        >
          复制会话目录路径
        </Button>
      </div>
    </div>,
  );
  statsKids.push(
    <div key="cache" className={styles.section}>
      <div className={styles.sectionHead}>缓存与扫描状态</div>
      <div className={styles.card}>
        <div className={styles.chartTitle} style={{ marginBottom: 4 }}>
          <span className={styles.chartName}>派生缓存</span>
          <span className={styles.hint}>
            {statsSnap && statsSnap.generatedAt
              ? '更新于 ' + new Date(statsSnap.generatedAt).toLocaleTimeString()
              : '读取中…'}
          </span>
        </div>
        <div className={styles.cacheRow} style={{ marginTop: 0 }}>
          <span>{'会话 ' + (snapScanned ?? '—') + '/' + (snapTotal ?? '—') + ' 已扫描'}</span>
          <span>{'复用 ' + (snapReused ?? '—') + (snapHits != null ? '（缓存 ' + snapHits + '）' : '')}</span>
          <span>{'扫描失败 ' + (snapErrors ?? '—')}</span>
          <span>{'直读 ' + (statsSnap && statsSnap.directReads != null ? statsSnap.directReads : '—')}</span>
          <span>{'存储 ' + (statsSnap && statsSnap.storage ? statsSnap.storage : '—')}</span>
        </div>
        <p className={styles.desc} style={{ margin: '6px 0 0' }}>
          「复用」=
          该会话日志没变，直接沿用上次结果（重启后来自持久化缓存，运行中来自内存）；日志变大时只读新增部分。
        </p>
        <div className={styles.toolbar} style={{ marginTop: 8 }}>
          {clearArmed ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                void withBusy(async () => {
                  setClearMsg('');
                  const r = await clearStatsCache();
                  setClearMsg(
                    r.ok
                      ? '已清除 ' + (r.removed ?? 0) + ' 行缓存，正在重算…'
                      : String(r.error || '清除失败'),
                  );
                  setClearArmed(false);
                })
              }
            >
              确认清除并重算
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setClearArmed(true)}>
              清除统计缓存
            </Button>
          )}
          {clearArmed ? (
            <Button variant="outline" size="sm" onClick={() => setClearArmed(false)}>
              取消
            </Button>
          ) : null}
          {clearMsg ? <span className={styles.hint}>{clearMsg}</span> : null}
        </div>
        <p className={styles.desc} style={{ margin: '6px 0 0' }}>
          清除后下一次扫描会重新读取全部会话日志（本机约 6 秒），期间面板显示「后台补扫中」。
        </p>
      </div>
    </div>,
  );
  statsKids.push(
    <div key="statpref" className={styles.section}>
      <div className={styles.sectionHead}>偏好</div>
      <UI.SecRow key="range" label="默认范围" desc="中心区「用量统计」打开时默认统计多少天的数据。">
        <UI.PillSelect
          disabled={busy}
          value={defRange}
          selectedLabel={defRange === 'all' ? '全部' : '近 ' + defRange + ' 天'}
          options={[
            { id: '7', label: '近 7 天' },
            { id: '30', label: '近 30 天' },
            { id: '90', label: '近 90 天' },
            { id: 'all', label: '全部' },
          ]}
          onSelect={(id: string) => void pickRange(id)}
        />
      </UI.SecRow>
      <UI.SecRow
        key="gap"
        label="在线时长空闲阈值"
        desc={
          '在线 = 有事件、且相邻事件间隔不超过它的墙钟时间：间隔 ≤ 阈值则整段计入（含中间空档），' +
          '超过就断开、中间不计；每段只算到最后一个事件，所以任何档位都是下界。推荐 15 分钟' +
          '（能兜住读长回答/想需求的静默期，又不会把开会吃饭算进来）；详细说明与各档实测对比见「在线统计」面板顶部。'
        }
      >
        <UI.PillSelect
          disabled={busy}
          value={gapNow}
          selectedLabel={gapNow + ' 分钟'}
          options={[1, 5, 15, 30, 60].map((n) => ({ id: String(n), label: n + ' 分钟' }))}
          onSelect={(id: string) =>
            void withBusy(async () => {
              const r = await store.savePrefs({ onlineGapMin: Number(id) } as any);
              if (!r.ok) setOpErr(String(r.error || '保存失败'));
              else notifyPrefs({ onlineGapMin: Number(id) });
            })
          }
        />
      </UI.SecRow>
    </div>,
  );

  const vrows: ReactNode[] = [
    <UI.SecRow
      key="__active"
      label="当前供应商"
      desc="侧边栏底部的额度按钮展示哪一家的额度；选「无」= 极简模式（不显示那枚按钮，也不拉取任何额度）。"
    >
      <UI.PillSelect
        disabled={busy}
        value={activeId}
        selectedLabel={a0 ? a0.name + '（' + store.typeLabel(a0.type) + '）' : '无 · 极简模式（不拉取）'}
        options={[{ id: '', label: '无 · 极简模式（不拉取）' }].concat(
          vendors.map((v: any) => ({ id: v.id, label: v.name + '（' + store.typeLabel(v.type) + '）' })),
        )}
        onSelect={(id: string) =>
          void withBusy(async () => {
            await store.setActive(id);
            await store.reload();
          })
        }
      />
    </UI.SecRow>,
  ];
  // 与管理页保持一致：已启用优先、组内当前供应商置顶（禁用项沉底便于集中查看/启用）
  const listOn = vendors.filter((v: any) => v.enabled !== false);
  const listOff = vendors.filter((v: any) => v.enabled === false);
  const activeFirstOf = (list: any[]): any[] =>
    list.filter((v: any) => v.id === activeId).concat(list.filter((v: any) => v.id !== activeId));
  activeFirstOf(listOn)
    .concat(activeFirstOf(listOff))
    .forEach((v: any) => {
      const snap = s.snaps[v.id];
      const isCur = v.id === activeId;
      const off = v.enabled === false;
      // 禁用优先：不论有没有快照，都明确显示「已禁用定时拉取」（否则会显示成「拉取正常」，误导）
      const status = off ? (
        <span className={cx(styles.hint, styles.offtxt)}>已禁用定时拉取</span>
      ) : snap && snap.ok ? (
        <span className={styles.hint}>拉取正常</span>
      ) : snap ? (
        <span className={styles.hint} title={snap.error || '拉取失败'}>
          拉取失败
        </span>
      ) : (
        <span className={styles.hint}>未拉取</span>
      );
      vrows.push(
        <UI.SecRow
          key={'v:' + v.id}
          wrap
          label={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' }}>
              <span
                className={cx(styles.dot, off ? styles.off : snap && !snap.ok ? styles.bad : undefined)}
              />
              <span className={styles.vname2} style={{ maxWidth: 280 }}>
                {v.name}
              </span>
              <UI.Badge kind="info" text={store.typeLabel(v.type)} />
              {isCur ? <UI.Badge kind="ok" text="当前" /> : null}
              {off ? <UI.Badge kind="bad" text="已禁用" /> : null}
              {UI.secretBadge(v.secretKind)}
            </span>
          }
        >
          <span className={styles.bar} style={{ width: '100%', padding: 0, border: 'none' }}>
            {status}
            <span style={{ flex: 1 }} />
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void withBusy(() => store.refreshVendor(v.id))}
            >
              拉取
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title={off ? '重新加入 Host 定时拉取' : '退出 Host 定时拉取（手动拉取不受影响）'}
              onClick={() => void withBusy(() => store.setVendorEnabled(v.id, off))}
            >
              {off ? '启用' : '禁用'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setEditing({ id: v.id, data: JSON.parse(JSON.stringify(v)) })}
            >
              编辑
            </Button>
            {v.secretKind === 'plain' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                title="明文转存系统凭据，改写为 $NAME 引用"
                onClick={() => void toCred(v.id)}
              >
                存凭据
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setAcked(false);
                setConfirmDel(v);
              }}
            >
              删除
            </Button>
          </span>
        </UI.SecRow>,
      );
    });
  quotaKids.push(
    <div key="vendors" className={styles.section}>
      <div className={styles.sectionHead}>{'供应商（' + vendors.length + '）'}</div>
      <p className={styles.cardHint} style={{ margin: '0 0 4px' }}>
        {
          '密钥建议填 $NAME 引用（先存系统凭据，配置文件里看不到明文）；直接填明文也不会被回显。「禁用」只是退出定时拉取，随时可以手动「拉取」，也可再点「启用」恢复。'
        }
      </p>
      {vrows}
    </div>,
  );
  if (editing)
    quotaKids.push(
      <div key="edit" className={styles.section}>
        <div className={styles.sectionHead}>{'编辑 ' + (editing as { id: string }).id}</div>
        <p className={styles.cardHint} style={{ margin: '0 0 4px' }}>
          ID 是主键，不可修改；密钥留空即保留原值。
        </p>
        <UI.VendorForm
          draft={(editing as { data: any }).data}
          set={(nd: any) => setEditing({ id: (editing as { id: string }).id, data: nd })}
          submitLabel="保存修改"
          busy={busy}
          isEdit
          onCancel={() => setEditing(null)}
          onSubmit={() => void saveVendor((editing as { data: any }).data, true)}
        />
      </div>,
    );
  quotaKids.push(
    <div key="add" className={styles.section}>
      <div className={styles.sectionHead}>添加供应商</div>
      <UI.VendorForm
        draft={draft}
        set={setDraft}
        submitLabel="添加"
        busy={busy}
        onSubmit={() => void saveVendor(draft, false)}
      />
    </div>,
  );
  if (confirmDel) {
    const target = confirmDel as { id: string; name: string };
    if (RiskConfirmation) {
      quotaKids.push(
        <RiskConfirmation
          key="confirm-del"
          open
          title={'删除供应商「' + target.name + '」？'}
          description="该供应商的配置与侧边栏快照将一并清除，此操作不可撤销。"
          acknowledgeLabel="我已了解，删除该供应商"
          cancelLabel="取消"
          closeLabel="关闭"
          confirmLabel="删除"
          acknowledged={acked}
          onAcknowledgedChange={setAcked}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            setConfirmDel(null);
            void delVendor(target.id);
          }}
        />,
      );
    } else {
      quotaKids.push(
        <div key="confirm-del" className={styles.errbox}>
          {/* 旧实现给这个 div 挂过 `tm-errtext`，但 styles 里从来没有这条规则（纯摆设）→ 去掉该 className，
              与 c8e140f（file-change-viewer 去掉无样式的 fcv-toolRow）同一先例。 */}
          <div>{'删除供应商「' + target.name + '」？此操作不可撤销。' + (acked ? '' : '请先确认。')}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {acked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmDel(null);
                  setAcked(false);
                  void delVendor(target.id);
                }}
              >
                确认删除
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAcked(true)}>
                我已了解
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmDel(null);
                setAcked(false);
              }}
            >
              取消
            </Button>
          </div>
        </div>,
      );
    }
  }
  const tabBtn = (id: 'stats' | 'quota', label: string): ReactNode => (
    <button
      key={id}
      type="button"
      className={cx(styles.tab, tab === id ? styles.tabOn : undefined)}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );
  return (
    <div className={styles.page}>
      {commonKids}
      <div className={styles.tabs}>{[tabBtn('stats', '统计设置'), tabBtn('quota', '额度配置')]}</div>
      <p className={styles.intro}>
        {tab === 'stats'
          ? '统计设置：数据来源、派生缓存与默认口径。详细图表在中心区「' +
            DISPLAY_NAME +
            ' → 用量统计 / 在线统计」。'
          : '额度配置：供应商与拉取偏好。额度显示在左侧边栏底部的额度按钮上（点开是使用详情与供应商切换）。配置持久化在 settings.yaml（'}
        {tab === 'stats' ? null : (
          <code className={styles.mono}>{(s.namespace as string) || 'dshp-token-meter'}</code>
        )}
        {tab === 'stats' ? null : ' 命名空间），外部编辑热重载。'}
      </p>
      {tab === 'stats' ? statsKids : quotaKids}
    </div>
  );
}

/**
 * 中心区「用量统计」面板：完整统计图表（开关行隐藏，收归设置页）。
 *
 * @returns 面板内容。
 */
export function StatsView(): ReactNode {
  const [prefs, setPrefs] = useState<{ showToday: boolean; defaultRange: string }>({
    showToday: false,
    defaultRange: 'all',
  });
  const loadPrefs = async (): Promise<void> => {
    try {
      const s = await fetchState();
      if (s.ok && s.config) {
        setPrefs({
          showToday: s.config.showToday === true,
          defaultRange: String(s.config.defaultRange || 'all'),
        });
      }
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    void loadPrefs();
    const fn = (): void => {
      void loadPrefs();
    };
    window.addEventListener('tm-prefs-changed', fn);
    return () => window.removeEventListener('tm-prefs-changed', fn);
  }, []);
  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.hint}>小组件</span>
        {STATS_WIDGET_BTNS.map(([k, t]) => (
          <span key={k} className={styles.widgetBtn}>
            <span className={styles.widgetBtnLabel}>{t}</span>
            <widgets.WidgetToggle id={'stats:' + k} />
          </span>
        ))}
      </div>
      <HiddenWhenFloated widgets={widgets} id="stats:today">
        <TodayCard wide bare name="今日消耗" widgets={widgets} widgetId="stats:today" />
      </HiddenWhenFloated>
      <StatsSettingsPage
        defaultRange={prefs.defaultRange}
        showToday={prefs.showToday}
        onPrefs={() => void loadPrefs()}
        showPrefs={false}
        widgets={widgets}
      />
    </div>
  );
}

/**
 * 单个小组件的内容（**唯一的 id → 组件映射**）。
 *
 * 三个消费者共用它，所以「哪张卡片画什么」只有一处定义：
 *  1. 自带浮层（`WidgetFloatLayer`，没装 widget-kit 时）；
 *  2. 宿主卡片（`widget-kit` 的 `content.render`，见 `index.tsx` 里的 `setContentRenderer`）；
 *  3. 未来新增的承载面。
 *
 * @param id - legacy id（`stats:<kind>`）。
 * @param withToggle - 内容里是否带「回归」开关（自带浮层需要：浮窗没有框架标题栏；
 *   宿主卡片不需要：框架标题栏自带关闭按钮，再画一个就是两个关闭按钮）。
 * @returns 组件节点；未知 id 返回 `null`。
 */
export function renderFloatContent(id: string, withToggle: boolean): ReactNode {
  const sep = id.indexOf(':');
  const prefix = sep >= 0 ? id.slice(0, sep) : '';
  const rest = sep >= 0 ? id.slice(sep + 1) : id;
  const w = withToggle ? { widgets, widgetId: id } : {};
  if (prefix === 'stats') return <StatsWidget kind={rest} {...w} />;
  return null;
}

/**
 * 把宿主注册表对齐到「当前该有的卡片」。
 *
 * `widget-kit` 渲染一张卡片的前提是描述符在册，而**这些卡片全是 `trayIcon: false`**
 * （不占活动栏图标），所以「刷新后仍开着」不能靠图标重新注册 —— 必须在启动时主动对齐。
 *
 * 现在只剩下用量统计族：额度已改成侧边栏底部按钮（`sidebar.footer.action`），
 * 不再是一张可弹出的卡片，因此这里与供应商增删无关。
 *
 * 没挂宿主时是 no-op（`widgets.syncRegistered` 自己判）。
 *
 * @returns 无。
 */
export function syncFloatWidgets(): void {
  widgets.syncRegistered(STATS_KINDS.map((kind) => ({ id: 'stats:' + kind, title: STATS_TITLES[kind] })));
}

/**
 * 全局小组件浮层：渲染所有已弹出的统计小组件（`stats:<kind>`）。
 * 浮窗只有定位，没有外框 —— 组件自身的卡片即浮窗外观，与原位完全一致。
 *
 * 挂上 `@dshp/widget-kit` 后**恒为 `null`**：卡片由框架的画布渲染（拖拽/缩放/最小化/吸附/
 * 动效/持久化都在那边），这一层连同自带拖拽逻辑一起退居「没装框架」时的兜底。
 *
 * @returns 浮层内容；没有浮窗（或已挂宿主）时 null。
 */
export function WidgetFloatLayer(): ReactNode {
  const list = widgets.useWidgets() as Array<{ id: string; pos: { x: number; y: number } }>;
  if (widgets.isBridged() || !list.length) return null;
  return (
    <>
      {list.map((w) => (
        <widgets.WidgetFloat key={w.id} id={w.id}>
          {renderFloatContent(w.id, true)}
        </widgets.WidgetFloat>
      ))}
    </>
  );
}

/** 侧边栏底部额度按钮（`sidebar.footer.action` 的唯一条目；由 index.tsx 注册）。 */
export const QuotaSidebarAction = quota.QuotaSidebarAction;
