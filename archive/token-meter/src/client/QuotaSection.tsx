/**
 * 额度 Section（quota）：额度数据 store + 供应商配置零件 + 侧边栏额度按钮
 *
 * 界面收敛（2026-09 UI 重构）：额度只剩**一个**入口 —— 左侧边栏底部一枚额度按钮
 * （`sidebar.footer.action`），按钮里画什么由该供应商的**按钮级模板**决定（环 / 余额 / 三条窗口…），
 * 点开是**按钮上方**弹出的浮层：当前供应商的使用详情 + 一次只激活一个的供应商切换。旧的额度显示面（中心区额度卡片网格、额度浮窗卡、
 * 侧栏额度卡、峰谷显示器、活动栏小组件菜单）全部删除。
 *
 * 本文件负责「数据与配置」，不负责「长什么样」：
 *  - `quotaStore`：额度状态的单例 store（Host `/ext/dshp-token-meter/*` 的唯一客户端入口）；
 *  - `quotaUI`：设置页「额度配置」用到的通用零件（Badge/SecRow/FormField/PillSelect/VendorForm）；
 *  - `QuotaSidebarAction`：侧边栏按钮本身 —— 环与详情**都来自 provider 模板层**
 *    （`providers/ui/<type>.tsx` 的 `button` / `detail`），本文件只做装配：
 *    取当前供应商 → 按 type 取模板 → 把结果交给 `QuotaRing` / `QuotaTrayPanel` 画。
 *
 * 分层渲染见 ./providers/*：「provider 专属模板（button + detail）→ 声明式区块 → legacy 兜底」。
 * 类名统一走 CSS Module（`styles.module.css`），动态拼接走本地 `cx()`。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, IconChevronDownOutlineRegular, Menu, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { createProviderKit, createProviderRenderers, fallbackErrorInfo } from './providers/index.js';
import { ringSizeOf } from './providers/index.js';
import type { ButtonVariant } from './providers/index.js';
import { providerPrefs } from './quota-prefs.js';
import { QuotaRing } from './QuotaRing.js';
import { QuotaTrayPanel } from './QuotaTrayPanel.js';
import type { QuotaTrayVendorRow } from './QuotaTrayPanel.js';
import { ButtonLayout } from './providers/kit.js';
import { iconOf } from './provider-icons.js';
import styles from './styles.module.css';
import type { ErrorInfo, ProviderMeta, Vendor, VendorSnapshot } from './types.js';

const BASE = '/ext/dshp-token-meter';
const ID_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

function num(v: unknown, d: number): number {
  const n = Number(v);
  return isFinite(n) ? n : d;
}
function fmt(n: unknown): string {
  try {
    return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
}
function fmtLeft(sec: number): string {
  sec = Math.max(0, Math.round(sec));
  if (sec >= 86400) return Math.floor(sec / 86400) + '天后';
  if (sec >= 3600) return Math.floor(sec / 3600) + '小时后';
  if (sec >= 60) return Math.floor(sec / 60) + '分后';
  return sec + '秒后';
}
function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (isNaN(t)) return '未知';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return s + ' 秒前';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' 分钟前';
  const hh = Math.floor(m / 60);
  if (hh < 24) return hh + ' 小时前';
  return Math.floor(hh / 24) + ' 天前';
}
/** 滚动窗口占用等级（阈值集中在此，便于调整）：
 *  ok  < 70%          正常（品牌蓝）
 *  warn 70–90%        注意（黄）
 *  bad  90–100%       快完了（红）—— 新增档位
 *  over ≥ 100%        已用尽/超限（红 + 脉冲） */
const QUOTA_LEVEL = { warn: 70, bad: 90, over: 100 };
function levelOf(pct: number): string {
  if (pct >= QUOTA_LEVEL.over) return 'over';
  if (pct >= QUOTA_LEVEL.bad) return 'bad';
  if (pct >= QUOTA_LEVEL.warn) return 'warn';
  return 'ok';
}
/** 等级 → 提示语（进度条 title） */
function levelTip(lvl: string): string {
  if (lvl === 'over') return '额度已用尽（或超出），可能被限流/拒绝';
  if (lvl === 'bad') return '额度快用完了，注意后续调用';
  if (lvl === 'warn') return '额度占用偏高';
  return '额度充足';
}

const TYPE_LABEL_FALLBACK: Record<string, string> = {
  opencode: 'OC',
  deepseek: 'DS',
  commandcode: 'CC',
  manual: '手动',
};
const TYPE_TITLE_FALLBACK = [
  { type: 'opencode', title: 'opencode（Go+Zen 合并）' },
  { type: 'deepseek', title: 'deepseek（官方·自动选路）' },
  { type: 'commandcode', title: 'commandcode（Command Code）' },
  { type: 'manual', title: 'manual（手动）' },
];

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

/** 徽章配色 → 类名（旧 `tm-badge-<kind>`；未知 kind 无对应规则，退化成只有底色）。 */
const BADGE_CLASS: Record<string, string | undefined> = {
  ok: styles.badgeOk,
  warn: styles.badgeWarn,
  muted: styles.badgeMuted,
  info: styles.badgeInfo,
  bad: styles.badgeBad,
};

/** 官方 `Button` 缺席时的原生兜底（props 与官方 Button 对齐到「能透传就行」）。 */
type BtnFallbackProps = { children?: ReactNode } & Record<string, unknown>;

/** 状态页/卡片共用的一行：左标题 + 说明，右控件。 */
interface SecRowProps {
  label?: ReactNode;
  desc?: ReactNode;
  /** 控件换行到标题下方独占整行（长控件用）。 */
  wrap?: boolean | undefined;
  children?: ReactNode;
}

/** 堆叠式表单字段：标签 → 控件 → 说明。 */
interface FormFieldProps {
  label?: ReactNode;
  desc?: ReactNode;
  hint?: ReactNode;
  required?: boolean | undefined;
  children?: ReactNode;
}

/** 胶囊下拉。 */
interface PillSelectProps {
  disabled?: boolean | undefined;
  value: string;
  /** 收起状态下按钮上显示的文字。 */
  selectedLabel: string;
  options: Array<{ id: string; label: string }>;
  onSelect: (id: string) => void;
}

/** 供应商草稿（`settings.yaml` 里一条 vendor 的编辑态）。 */
interface VendorDraft {
  id?: string | undefined;
  name?: string | undefined;
  type: string;
  params?: Record<string, unknown> | undefined;
}

/** 供应商表单。 */
interface VendorFormProps {
  draft: VendorDraft;
  set: (d: VendorDraft) => void;
  busy: boolean;
  isEdit?: boolean | undefined;
  submitLabel?: string | undefined;
  onSubmit: () => void;
  onCancel?: (() => void) | undefined;
}

/** 状态徽章。 */
interface BadgeProps {
  kind: string;
  text: string;
}

export interface QuotaStoreState {
  cfg: any;
  snaps: Record<string, VendorSnapshot>;
  loading: boolean;
  error: string;
  errOpen: boolean;
  lastErr: { id: string; msg: string; at: string } | null;
  namespace: string;
  docPath: string;
  providers: ProviderMeta[] | null;
}

/** 单例额度 store 的对外方法（调用方按这些名字取用）。 */
export interface QuotaStoreApi {
  useStore: () => QuotaStoreState;
  /** 读当前快照（无 hook 的调用方用）。 */
  get: () => QuotaStoreState;
  /** 订阅 store 变化（供应商增删 / 拉取结果）；返回取消订阅。 */
  subscribe: (fn: () => void) => () => void;
  ensureLoad: () => Promise<void>;
  reload: () => Promise<void>;
  refreshVendor: (id?: string) => Promise<void>;
  syncState: () => Promise<void>;
  setActive: (id: string) => Promise<void>;
  setVendorEnabled: (id: string, enabled: boolean) => Promise<void>;
  setRefresh: (sec: number) => Promise<void>;
  savePrefs: (patch: Record<string, unknown>) => Promise<{ ok: boolean; error?: string | undefined }>;
  activeOf: (s: QuotaStoreState) => Vendor | null;
  typeLabel: (type: string) => string;
  remainOf: (w: { resetInSec: number }, snap: VendorSnapshot, nowMs: number) => number;
  call: (method: string, args?: any) => Promise<any>;
}

/** 设置页与侧栏共用的 UI 零件（调用方按这些名字取用）。 */
export interface QuotaUIApi {
  Badge: (props: BadgeProps) => ReactNode;
  SecRow: (props: SecRowProps) => ReactNode;
  FormField: (props: FormFieldProps) => ReactNode;
  PillSelect: (props: PillSelectProps) => ReactNode;
  VendorForm: (props: VendorFormProps) => ReactNode;
  secretBadge: (kind: string) => ReactNode;
}

/** 本 Section 对外暴露的全部构件。 */
export interface QuotaSectionParts {
  /** 侧边栏底部的额度按钮（额度唯一入口；`wide` 由 sidebar 槽位给）。 */
  QuotaSidebarAction: (props: { wide: boolean }) => ReactNode;
  quotaStore: QuotaStoreApi;
  quotaUI: QuotaUIApi;
}

/**
 * 装配额度 store / 配置零件 / 侧边栏按钮。
 *
 * 无参数：额度不再有「浮窗 / 卡片」这类需要小组件宿主的形态（那些形态已删除），
 * 因此这里不再依赖 `createWidgetSystem()` 的产出。
 *
 * @returns 本 Section 的对外构件。
 */
export function createQuotaSection(): QuotaSectionParts {
  const store: {
    state: QuotaStoreState;
    listeners: Set<() => void>;
    get(): QuotaStoreState;
    subscribe(fn: () => void): () => void;
    set(patch: Partial<QuotaStoreState>): void;
  } = {
    state: {
      cfg: null,
      snaps: {},
      loading: false,
      error: '',
      errOpen: false,
      lastErr: null,
      namespace: '',
      docPath: '',
      providers: null,
    },
    listeners: new Set(),
    get() {
      return this.state;
    },
    subscribe(fn) {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    },
    set(patch) {
      this.state = Object.assign({}, this.state, patch);
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    },
  };
  let loaded = false;

  async function call(method: string, args?: any): Promise<any> {
    const MAP: Record<string, [string, string]> = {
      'quota.load': ['GET', '/state'],
      'quota.refresh': ['POST', '/refresh'],
      'quota.set-active': ['POST', '/set-active'],
      'quota.set-refresh': ['POST', '/set-refresh'],
      'quota.set-enabled': ['POST', '/set-enabled'],
      'quota.set-vendor-enabled': ['POST', '/set-vendor-enabled'],
      'quota.add-vendor': ['POST', '/add-vendor'],
      'quota.update-vendor': ['POST', '/update-vendor'],
      'quota.delete-vendor': ['POST', '/delete-vendor'],
      'quota.secret-to-cred': ['POST', '/secret-to-cred'],
      'config.save': ['POST', '/config'],
    };
    const ent = MAP[method];
    if (!ent) throw new Error('unknown quota method: ' + method);
    const m = ent[0],
      path = BASE + ent[1];
    if (m === 'GET') {
      const r = await fetch(path, { cache: 'no-store' });
      return r.json();
    }
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args || {}),
      cache: 'no-store',
    });
    return r.json();
  }

  /** 同步节拍（单例）：同一客户端所有额度卡/浮窗共享一个轮询定时器，
   *  避免 N 张卡各自 interval。Host 侧才是真正的上游拉取方。 */
  let syncRefs = 0;
  let syncTimer: number | null = null;
  let syncMsCur = 0;
  function startSyncLoop(ms: number): void {
    syncRefs++;
    if (syncTimer === null || syncMsCur !== ms) {
      if (syncTimer !== null) window.clearInterval(syncTimer);
      syncMsCur = ms;
      syncTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible') void syncState();
      }, ms);
    }
  }
  function stopSyncLoop(): void {
    syncRefs--;
    if (syncRefs <= 0 && syncTimer !== null) {
      window.clearInterval(syncTimer);
      syncTimer = null;
      syncMsCur = 0;
    }
  }

  async function ensureLoad(): Promise<void> {
    if (loaded) return;
    loaded = true;
    store.set({ loading: true });
    try {
      const r = await call('quota.load');
      if (r && r.ok) {
        // 只同步快照与配置；不在此自动触发上游拉取（Host 定时器负责，避免多客户端重复 fetch）
        store.set({
          loading: false,
          cfg: r.config,
          snaps: r.snaps || {},
          namespace: r.namespace || '',
          docPath: r.docPath || '',
          providers: r.providers || null,
          error: r.error || '',
        });
      } else store.set({ loading: false, error: (r && r.error) || '加载失败' });
    } catch {
      store.set({ loading: false, error: '连接 Host 失败' });
    }
  }
  async function reload(): Promise<void> {
    loaded = false;
    store.set({ errOpen: false, lastErr: null });
    await ensureLoad();
  }
  /** 同步 Host 快照（只读 GET /state，不触发上游拉取）。
   * Host 已按 refreshSec 在服务端定时拉取，客户端多开也只读同一份内存快照。
   * 同步 cfg（多客户端配置一致）与 snaps（额度数据），但不动本地菜单/错误展开状态。 */
  async function syncState(): Promise<void> {
    if (store.get().loading) return; // 本地正在手动操作（切换/拉取）时让位
    try {
      const r = await call('quota.load');
      if (!(r && r.ok)) return;
      const cur = store.get();
      store.set({
        cfg: r.config || cur.cfg,
        snaps: r.snaps || cur.snaps,
        namespace: r.namespace || cur.namespace,
        docPath: r.docPath || cur.docPath,
        providers: r.providers || cur.providers,
      });
    } catch {
      /* 同步失败静默（下次轮询重试） */
    }
  }
  async function refreshVendor(id?: string): Promise<void> {
    store.set({ loading: true });
    try {
      const r = await call('quota.refresh', id ? { id } : {});
      if (r && r.ok) {
        const snaps = Object.assign({}, store.get().snaps);
        let failMsg = '';
        Object.keys(r.snaps || {}).forEach((k) => {
          const s2 = (r.snaps as Record<string, VendorSnapshot>)[k] as VendorSnapshot;
          if (!s2) return;
          if (s2.ok) snaps[k] = s2;
          else if (!id || k === id) failMsg = s2.error || '刷新失败';
        });
        const patch: Partial<QuotaStoreState> = { loading: false, snaps };
        if (failMsg) patch.lastErr = { id: id || '', msg: failMsg, at: new Date().toISOString() };
        else {
          patch.lastErr = null;
          patch.error = '';
        }
        store.set(patch);
      } else store.set({ loading: false, error: (r && r.error) || '刷新失败' });
    } catch {
      store.set({ loading: false, error: '连接 Host 失败' });
    }
  }
  async function setActive(id: string): Promise<void> {
    try {
      const r = await call('quota.set-active', { id });
      if (r && r.ok) {
        const cfg = Object.assign({}, store.get().cfg, { activeVendor: id });
        store.set({ cfg, errOpen: false, lastErr: null, error: '' });
        // 切过去立刻手动拉一次（手动拉取不受供应商/全局开关影响），别让用户对着旧快照干等
        if (id) void refreshVendor(id);
      } else {
        store.set({ error: (r && r.error) || '切换供应商失败' });
      }
    } catch {
      store.set({ error: '连接 Host 失败，供应商未切换' });
    }
  }
  /** 通用偏好补丁（showToday/defaultRange 等）：经 POST /config，成功后合入本地 cfg，侧栏/中心区即时同步 */
  async function savePrefs(patch: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    try {
      const r = await call('config.save', patch);
      if (r && r.ok) {
        const cfg = Object.assign({}, store.get().cfg, r.config || patch);
        store.set({ cfg, error: '' });
        return { ok: true };
      }
      return { ok: false, error: (r && r.error) || '保存失败' };
    } catch {
      return { ok: false, error: '连接 Host 失败' };
    }
  }
  /**
   * 单个供应商的余额查询开关：false = 退出 Host 主动定时拉取（手动「拉取」照常可用）。
   * 本地即时合入 cfg，不整页 reload（避免卡片闪烁）；Host 快照由下一轮 sync 对齐。
   */
  async function setVendorEnabled(id: string, enabled: boolean): Promise<void> {
    try {
      const r = await call('quota.set-vendor-enabled', { id, enabled });
      if (!(r && r.ok)) {
        store.set({ error: (r && r.error) || '保存失败' });
        return;
      }
      const cur = store.get();
      const cfg = cur.cfg
        ? Object.assign({}, cur.cfg, {
            vendors: (cur.cfg.vendors || []).map((v: Vendor) => {
              if (v.id !== id) return v;
              const nv: Vendor = { ...v };
              if (enabled) delete nv.enabled;
              else nv.enabled = false;
              return nv;
            }),
          })
        : cur.cfg;
      store.set({ cfg, error: '' });
    } catch {
      store.set({ error: '连接 Host 失败' });
    }
  }
  async function setRefresh(sec: number): Promise<void> {
    try {
      const r = await call('quota.set-refresh', { sec });
      if (r && r.ok) await reload();
      else store.set({ error: (r && r.error) || '保存失败' });
    } catch {
      store.set({ error: '连接 Host 失败' });
    }
  }

  function useStore(): QuotaStoreState {
    const force = useState(0)[1];
    useEffect(() => store.subscribe(() => force((x: number) => x + 1)), []);
    return store.get();
  }
  function remainOf(w: { resetInSec: number }, snap: VendorSnapshot, nowMs: number): number {
    const f = snap.fetchedAtMs || nowMs;
    return Math.max(0, w.resetInSec - (nowMs - f) / 1000);
  }
  function activeOf(s: QuotaStoreState): Vendor | null {
    if (!s.cfg) return null;
    const vs = s.cfg.vendors || [];
    const av = s.cfg.activeVendor;
    if (av === '') return null;
    if (av === undefined || av === null) return vs[0] || null;
    return vs.filter((v: Vendor) => v.id === av)[0] || vs[0] || null;
  }
  function curSymbol(cur: string): string {
    if (cur === 'CNY') return '¥';
    if (cur === 'USD') return '$';
    return cur ? cur + ' ' : '';
  }
  function providerMetas(): ProviderMeta[] | null {
    try {
      const ps = store.get().providers;
      if (Array.isArray(ps) && ps.length) return ps;
    } catch {
      /* ignore */
    }
    return null;
  }
  function typeLabel(type: string): string {
    const ps = providerMetas();
    if (ps) {
      const hit = ps.filter((x) => x && x.type === type)[0];
      if (hit && hit.label) return hit.label;
    }
    return TYPE_LABEL_FALLBACK[type] || type;
  }
  function typeOptions(): Array<{ type: string; title: string }> {
    const ps = providerMetas();
    if (ps) return ps.map((x) => ({ type: x.type, title: x.title || x.type }));
    return TYPE_TITLE_FALLBACK.slice();
  }
  function providerMetaOf(type: string): ProviderMeta | null {
    const ps = providerMetas();
    if (ps) return ps.filter((x) => x && x.type === type)[0] || null;
    return null;
  }

  /* ---------- provider 分层渲染装配 ----------
     通用零件（滚动刷新条/余额块/指标/图表/失败卡…）集中在 providers/kit.ts，
     每个 provider 在 providers/ui/<type>.ts 里有**属于它自己的完整 UI**；
     没写专属 UI 的 type 自动落到声明式区块 → legacy 兜底（见 providers/registry.ts）。
     本文件只提供数据访问与少量格式化工具。 */
  const kit = createProviderKit({
    num,
    fmt,
    fmtLeft,
    curSymbol,
    remainOf,
    timeAgo,
    levelOf,
    levelTip,
    errOpen: () => !!store.get().errOpen,
    toggleErr: () => store.set({ errOpen: !store.get().errOpen }),
  });
  const providerViews = createProviderRenderers(kit);
  const ErrBox = kit.ErrorCard;

  /** 失败快照 → 结构化信息（Host 已给则直接用） */
  function errInfoOf(snap: VendorSnapshot | undefined, fallbackMsg: string): ErrorInfo {
    const info = snap && snap.errorInfo;
    if (info && typeof info === 'object' && typeof info.title === 'string') return info;
    return fallbackErrorInfo((snap && snap.error) || fallbackMsg);
  }

  function Badge(props: BadgeProps): ReactNode {
    return <span className={cx(styles.badge, BADGE_CLASS[props.kind || 'muted'])}>{props.text}</span>;
  }
  function SecRow(props: SecRowProps): ReactNode {
    return (
      <div
        className={styles.row}
        style={props.wrap ? { flexWrap: 'wrap', flexDirection: 'column', alignItems: 'stretch' } : undefined}
      >
        <div className={styles.rowText}>
          <div className={styles.rowLabel}>{props.label}</div>
          {props.desc ? <div className={styles.rowDesc}>{props.desc}</div> : null}
        </div>
        <span
          className={props.wrap ? styles.rowValue : undefined}
          style={props.wrap ? { flexBasis: '100%', justifyContent: 'flex-start' } : undefined}
        >
          {props.children}
        </span>
      </div>
    );
  }

  /**
   * 表单字段（堆叠式）：标签 → 控件 → 说明，各占一行。
   *
   * 为什么不复用 SecRow：SecRow 是「左说明 + 右控件」的同行布局，说明一长
   * （如 cookie / workspaceId 的抓取步骤）就把控件挤到只剩几十像素、占位符被截断。
   * 表单字段改为纵向排列：控件恒定占满整行宽度，说明在下方独占整行自由换行。
   */
  function FormField(props: FormFieldProps): ReactNode {
    return (
      <div className={styles.field}>
        <div className={styles.fieldHead}>
          <span className={styles.fieldLabel}>{props.label}</span>
          {props.required ? <span className={styles.fieldReq}>{'必填'}</span> : null}
          {props.hint ? <span className={styles.fieldOpt}>{props.hint}</span> : null}
        </div>
        <div className={styles.fieldControl}>{props.children}</div>
        {props.desc ? <div className={styles.fieldDesc}>{props.desc}</div> : null}
      </div>
    );
  }

  function PillSelect(props: PillSelectProps): ReactNode {
    const [open, setOpen] = useState(false);
    const selector = (
      <button
        type="button"
        className={styles.selector}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={props.disabled}
        onClick={() => setOpen((v: boolean) => !v)}
      >
        <span className={styles.selectorLabel}>{props.selectedLabel}</span>
        {IconChevronDownOutlineRegular ? (
          <IconChevronDownOutlineRegular className={styles.chevron} />
        ) : (
          <span className={styles.chevron}>{'▾'}</span>
        )}
      </button>
    );
    if (!Menu) {
      if (!open) return selector;
      return (
        <div>
          {selector}
          <div className={styles.popmenu} style={{ position: 'absolute' }}>
            {props.options.map((o) => (
              <button
                key={o.id}
                className={cx(styles.mitem, o.id === props.value ? styles.active : undefined)}
                onClick={() => {
                  setOpen(false);
                  props.onSelect(o.id);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        items={props.options}
        selectedId={props.value}
        onSelect={(id: string) => {
          setOpen(false);
          props.onSelect(id);
        }}
        align="end"
        portal
        anchor={selector}
      />
    );
  }
  function secretBadge(kind: string): ReactNode {
    if (kind === 'ref') return <Badge kind="ok" text="密钥:$引用" />;
    if (kind === 'plain') return <Badge kind="warn" text="密钥:明文" />;
    if (kind === 'env' || kind === 'cred') return <Badge kind="info" text={'密钥:' + kind + '(旧)'} />;
    if (kind === 'empty') return <Badge kind="warn" text="密钥:未填" />;
    return null;
  }

  function VendorForm(props: VendorFormProps): ReactNode {
    const Btn =
      Button ||
      (({ children, ...rest }: BtnFallbackProps) => (
        <button type="button" className={styles.btn} {...rest}>
          {children}
        </button>
      ));
    const d = props.draft;
    const set = props.set;
    const busy = !!props.busy;
    const isEdit = !!props.isEdit;
    const put = (k: string) => (v: unknown) => set(Object.assign({}, d, { [k]: v }));
    const putP = (k: string) => (v: unknown) =>
      set(Object.assign({}, d, { params: Object.assign({}, d.params, { [k]: v }) }));
    const p: Record<string, unknown> = d.params || {};
    const idOk = ID_RE.test(d.id || '');
    const nameOk = !!(d.name && String(d.name).trim());
    const canSubmit = idOk && nameOk && !busy;
    const secretPh = isEdit ? '留空=保留原值，或填 $NAME 引用 / 新明文' : '填 $NAME 引用（推荐）或粘贴明文';
    const inputWrap = (opts: any, inner: ReactNode): ReactNode => (
      <div
        className={styles.inputWrap}
        style={opts && opts.maxWidth ? { maxWidth: opts.maxWidth } : undefined}
      >
        {inner}
      </div>
    );
    const textInput = (opts: any): ReactNode =>
      inputWrap(
        opts,
        <input
          className={cx(styles.ninput, opts && opts.mono ? styles.mono : undefined)}
          style={
            opts && opts.alignRight ? { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } : undefined
          }
          value={opts.value}
          placeholder={opts.placeholder || ''}
          autoComplete="off"
          inputMode={opts.inputMode}
          disabled={busy}
          onChange={opts.onChange}
        />,
      );
    const rows: ReactNode[] = [];

    // 显示名称：只影响界面观感，随便填（支持中文）
    rows.push(
      <FormField
        key="name"
        label="显示名称"
        required
        desc="只给你自己看的名字：显示在侧边栏额度卡、供应商列表和切换菜单里，不参与任何请求。同名也没关系，随便填（支持中文），例如「DeepSeek 主号」「公司账号」。"
      >
        {textInput({
          value: d.name || '',
          placeholder: '如：DeepSeek 主号',
          onChange: (e: any) => put('name')(e.target.value),
        })}
      </FormField>,
    );
    const typeSel = (
      <PillSelect
        disabled={busy}
        value={d.type}
        selectedLabel={
          (typeOptions().filter((o) => o.type === d.type)[0] || ({} as { title?: string })).title || d.type
        }
        options={typeOptions().map((o) => ({ id: o.type, label: o.title }))}
        onSelect={(id: string) => {
          // provider 自声明 params 默认值：切换类型时套用（保留已填的通用字段如 lowWarn/currency）
          const meta = providerMetaOf(id);
          const defaults =
            meta && meta.defaultParams && typeof meta.defaultParams === 'object'
              ? JSON.parse(JSON.stringify(meta.defaultParams))
              : {};
          const keep: Record<string, unknown> = {};
          for (const k of ['lowWarn', 'currency', 'billing', 'total', 'used', 'balance', 'granted']) {
            if (p[k] !== undefined && p[k] !== '') keep[k] = p[k];
          }
          set(Object.assign({}, d, { type: id, params: Object.assign({}, defaults, keep) }));
        }}
      />
    );
    rows.push(
      <FormField
        key="id"
        label="ID（配置标识）"
        required={!isEdit}
        hint={isEdit ? '添加后不可修改' : undefined}
        desc={
          isEdit
            ? '这是该供应商在配置里的唯一标识（主键），用来在 settings.yaml 中区分不同账号，也被「设为当前」等操作引用。已添加的供应商不能改 ID，需要别的 ID 请删掉重新添加。'
            : '该供应商在配置里的唯一标识（主键）：用于在 settings.yaml 中区分不同账号，也被「设为当前」等操作引用。填简短英文/数字即可，例如 ds-main、cc-work、go-2。规则：小写字母、数字、横线，2–31 位，字母或数字开头；添加后不可修改。'
        }
      >
        {isEdit ? (
          <span className={cx(styles.inputWrap, styles.inputReadonly)} title="ID 是配置主键，不可修改">
            <span className={cx(styles.ninput, styles.mono)}>{d.id}</span>
          </span>
        ) : (
          inputWrap(
            {},
            <input
              className={cx(styles.ninput, styles.mono)}
              value={d.id || ''}
              placeholder="如：ds-main"
              autoComplete="off"
              disabled={busy}
              onChange={(e: any) => put('id')(e.target.value)}
            />,
          )
        )}
      </FormField>,
    );
    if (!isEdit && !idOk && (d.id || ''))
      rows.push(
        <p key="idhint" className={cx(styles.notice, styles.noticeWarn)}>
          {'ID 不合法：需小写字母、数字或横线，2–31 位，且以字母或数字开头（不能有空格、下划线、中文）。'}
        </p>,
      );
    rows.push(
      <FormField
        key="type"
        label="类型"
        required
        desc="决定去哪个平台、用哪个接口拉取额度。切换类型会同时重置该类型的参数（已填的预警线、币种等通用项会保留）。"
      >
        {typeSel}
      </FormField>,
    );
    const dynMeta = providerMetaOf(d.type);
    if (dynMeta && Array.isArray(dynMeta.fields)) {
      const dynFields = dynMeta.fields.filter((f) => {
        if (!f || !f.showWhen) return true;
        let cur = (p as Record<string, unknown>)[f.showWhen.key];
        if (cur === undefined || cur === null || cur === '')
          cur = f.showWhen.key === 'billing' ? 'rolling' : '';
        return String(cur) === String(f.showWhen.eq);
      });
      dynFields.forEach((f, idx) => {
        const val = (p as Record<string, unknown>)[f.key];
        const key = 'dyn:' + f.key + ':' + idx;
        if (f.kind === 'select') {
          const selVal =
            val === undefined || val === null || val === ''
              ? f.key === 'billing'
                ? 'rolling'
                : ''
              : String(val);
          rows.push(
            <FormField
              key={key}
              label={f.label || f.key}
              required={f.required === true}
              desc={f.hint || undefined}
            >
              <PillSelect
                disabled={busy}
                value={selVal}
                selectedLabel={
                  ((f.options || []).filter((o) => o.value === selVal)[0] || ({} as { label?: string }))
                    .label || selVal
                }
                options={(f.options || []).map((o) => ({ id: o.value, label: o.label }))}
                onSelect={(
                  (k: string) => (id: string) =>
                    putP(k)(id)
                )(f.key)}
              />
            </FormField>,
          );
        } else if (f.kind === 'number') {
          rows.push(
            <FormField
              key={key}
              label={f.label || f.key}
              required={f.required === true}
              desc={f.hint || undefined}
            >
              {textInput({
                maxWidth: 220,
                inputMode: 'decimal',
                placeholder: f.placeholder || '',
                value: val === undefined || val === null ? '' : String(val),
                onChange: (
                  (k: string) => (e: any) =>
                    putP(k)(e.target.value)
                )(f.key),
              })}
            </FormField>,
          );
        } else {
          const isSecret = f.kind === 'secret';
          rows.push(
            <FormField
              key={key}
              label={f.label || f.key}
              required={f.required === true}
              hint={isSecret ? '填 $NAME 引用或明文；明文保存后不回显' : undefined}
              desc={f.hint || undefined}
            >
              {textInput({
                mono: !!f.mono,
                placeholder: f.placeholder || (isSecret ? secretPh : ''),
                value: val === undefined || val === null ? '' : String(val),
                onChange: (
                  (k: string) => (e: any) =>
                    putP(k)(e.target.value)
                )(f.key),
              })}
            </FormField>,
          );
        }
      });
      if (dynMeta.hint)
        rows.push(
          <p key="dyn:hint" className={styles.fieldNote}>
            <b>{'关于该类型：'}</b>
            {dynMeta.hint}
          </p>,
        );
    } else {
      // 字段定义以 Host 上报的 provider 元数据为唯一来源（适配器 fields）。
      // 元数据缺失时不再硬编码各类型表单——那会与适配器实现悄悄漂移。
      rows.push(
        <p key="nometa" className={cx(styles.notice, styles.noticeWarn)}>
          {'Host 未上报类型「' +
            String(d.type) +
            '」的字段定义：请重启 dsh web 让插件重新注册，然后刷新本页。'}
        </p>,
      );
    }
    rows.push(
      <div key="actions" className={styles.bar}>
        <Btn variant="primary" size="sm" disabled={!canSubmit} onClick={props.onSubmit}>
          {busy ? '保存中…' : props.submitLabel || '保存'}
        </Btn>
        {props.onCancel ? (
          <Btn variant="outline" size="sm" disabled={busy} onClick={props.onCancel}>
            {'取消'}
          </Btn>
        ) : null}
        {!idOk || !nameOk ? (
          <span className={styles.hint}>
            {!nameOk ? '请先填写显示名称。' : 'ID 不合法：需小写字母/数字/横线，2–31 位，字母或数字开头。'}
          </span>
        ) : null}
      </div>,
    );
    return <div className={styles.section}>{rows}</div>;
  }

  /* ─────────────── 侧边栏额度按钮（额度唯一入口；内容由 provider 模板画）─────────────── */

  /**
   * 一个供应商的按钮内容（**来自它的按钮级模板**，内容不限于环）。
   *
   * 没拉取过时**不走模板**：模板只认「成功/失败的快照」，把「还没有数据」交给它会被
   * 渲染成「读取失败」（不诚实）。这里显式给一枚空环 + 实话说明。
   *
   * @param vendor - 供应商（null = 极简模式，没有任何供应商）。
   * @param snap - 它的快照（可能还没有）。
   * @param now - 当前时间（毫秒）。
   * @param variant - 三档位置（宽栏 / 窄栏 / 切换行）。
   * @returns 按钮内容节点。
   */
  function buttonOf(
    vendor: Vendor | null,
    snap: VendorSnapshot | undefined,
    now: number,
    variant: ButtonVariant,
  ): ReactNode {
    const size = ringSizeOf(variant);
    const idle = (title: string): ReactNode => {
      const empty = <QuotaRing spec={{ pct: null, tone: 'idle', title }} size={size} />;
      return (
        <ButtonLayout
          variant={variant}
          leading={empty}
          glyph={empty}
          {...(vendor ? { icon: iconOf(vendor.type, iconMetaOf(vendor.type)) } : {})}
          {...(variant === 'wide' && vendor ? { name: vendor.name } : {})}
        />
      );
    };
    if (!vendor) return idle('未选择供应商（极简模式）：在设置里选一个');
    if (!snap) return idle(vendor.name + '：还没有额度数据，点开可手动拉取');
    return providerViews.renderButton({
      type: vendor.type,
      snap,
      now,
      vendorId: vendor.id,
      variant,
      icon: iconOf(vendor.type, iconMetaOf(vendor.type)),
    });
  }

  /** Host 元数据里该 type 声明的图标名（没有就交给 `iconOf` 的兜底表）。 */
  function iconMetaOf(type: string): string | undefined {
    const ps = providerMetas();
    if (ps) {
      const hit = ps.filter((x) => x && x.type === type)[0];
      if (hit && typeof hit.icon === 'string' && hit.icon !== '') return hit.icon;
    }
    return undefined;
  }

  /** 某供应商按钮的悬停说明（= 它在行/按钮上的 tooltip；由模板的 `buttonHint` 给）。 */
  function buttonTitleOf(
    vendor: Vendor | null,
    snap: VendorSnapshot | undefined,
    variant: ButtonVariant,
  ): string {
    if (!vendor) return '未选择供应商（极简模式）：在设置里选一个';
    if (!snap) return vendor.name + '：还没有额度数据，点开可手动拉取';
    return providerViews.buttonTitle({
      type: vendor.type,
      snap,
      now: Date.now(),
      vendorId: vendor.id,
      variant,
      icon: iconOf(vendor.type, iconMetaOf(vendor.type)),
    });
  }

  /**
   * 侧边栏底部的额度按钮（`sidebar.footer.action` 的唯一条目）。
   *
   * 按钮内容来自该供应商的按钮模板（`variant` 告诉它现在是宽栏 / 窄栏 / 切换行）；
   * 点开在按钮**上方**弹出使用详情（`QuotaTrayPanel`），一次只激活一个供应商。
   *
   * @param props - `wide`：侧边栏是否展开为宽栏（false = 56px 轨道）。
   * @returns 按钮 + （展开时）挂在 body 上的弹层。
   */
  function QuotaSidebarAction(props: { wide: boolean }): ReactNode {
    const s = useStore();
    // 订阅展示偏好（浏览器本地）：详情模板里的开关/单选组点一下，这里立刻重画
    const [, forcePrefs] = useState(0);
    useEffect(() => providerPrefs.subscribe(() => forcePrefs((x: number) => x + 1)), []);
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLElement | null>(null);

    // 秒表只在弹层开着时走：倒计时与「10 秒钟前」要活，而关着时一秒一次重渲染纯属浪费
    // （环本身只依赖快照，不需要时间）。打开瞬间先对齐一次，避免显示过期的时间差。
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
      if (!open) return;
      setNow(Date.now());
      const id = window.setInterval(() => setNow(Date.now()), 1000);
      return () => window.clearInterval(id);
    }, [open]);

    // 首次挂载读一次配置/快照（Host 侧才是真正的拉取方）
    useEffect(() => {
      void ensureLoad();
    }, []);

    // 按 refreshSec 起「共享同步定时器」：只读 Host 内存快照，多客户端不会重复打上游。
    // **只有 refreshSec 是自动刷新开关**（0 = Host 不再定时拉）—— 顶层 `enabled` 是旧侧栏
    // 额度卡开关留下的历史字段：Host 侧没有任何代码读它（`sanitizeCfg` 只原样回显），
    // 所以绝不能拿它当「自动刷新已关闭」的判据（旧配置里它常常是 false，会一开口就撒谎）。
    const hasCfg = s.cfg !== null;
    const refreshSec = hasCfg ? Number(s.cfg.refreshSec) : 0;
    const autoOff = hasCfg && refreshSec === 0;
    useEffect(() => {
      if (!hasCfg || autoOff) return;
      const ms = Math.min(3600, Math.max(10, refreshSec || 60)) * 1000;
      startSyncLoop(ms);
      return () => stopSyncLoop();
    }, [hasCfg, autoOff, refreshSec]);

    const vendors: Vendor[] = (s.cfg && s.cfg.vendors) || [];
    // 供应商被删掉后，本地那条显示偏好也顺手清掉（cfg 就绪前不动手，避免启动瞬间误删）
    const vendorIds = vendors.map((v) => v.id).join('\u0000');
    useEffect(() => {
      if (!hasCfg) return;
      providerPrefs.prune(vendors.map((v) => v.id));
    }, [hasCfg, vendorIds]);
    const activeVendor = activeOf(s);
    const activeId = activeVendor ? activeVendor.id : '';
    // 「极简模式」（`activeVendor: ''` **且**确实配了供应商）= 用户明确要求不要额度显示：
    // 连按钮一起收起来，别拿一枚空环去打扰他（没配任何供应商时不适用 —— 那时按钮是唯一的发现入口）。
    const minimal = activeVendor === null && vendors.length > 0;
    const activeSnap = activeVendor ? s.snaps[activeVendor.id] : undefined;
    const variant: ButtonVariant = props.wide ? 'wide' : 'rail';
    // 侧边栏那枚按钮（宽栏/窄栏）与浮层卡片头的主图形是**两个档位**：
    // 卡片头只要 16px 的主图形（名字单独一列），否则名字与数值会在顶部重复一遍
    const activeButton = buttonOf(activeVendor, activeSnap, now, variant);
    const activeGlyph = buttonOf(activeVendor, activeSnap, now, 'row');

    // 切换列表顺序：当前 → 已启用 → 已禁用（同档保持 settings.yaml 顺序）
    const rankOf = (v: Vendor): number => (v.id === activeId ? 0 : v.enabled === false ? 2 : 1);
    const ordered: Vendor[] = [];
    for (const rank of [0, 1, 2]) for (const v of vendors) if (rankOf(v) === rank) ordered.push(v);
    const rows: QuotaTrayVendorRow[] = ordered.map((v) => {
      const snap = s.snaps[v.id];
      const off = v.enabled === false;
      const status = off ? '已禁用' : !snap ? '未拉取' : snap.ok ? '拉取正常' : '拉取失败';
      const row: QuotaTrayVendorRow = {
        id: v.id,
        name: v.name,
        typeLabel: typeLabel(v.type),
        active: v.id === activeId,
        disabled: off,
        button: buttonOf(v, snap, now, 'row'),
        buttonHint: buttonTitleOf(v, snap, 'row'),
        status,
      };
      // 状态色调只给语义（'ok'/'warn'/'bad'/'off'/'idle'），配色由面板的 CSS 决定
      row.statusTone = off
        ? 'off'
        : !snap
          ? 'idle'
          : snap.ok
            ? 'ok'
            : snap.errorInfo && snap.errorInfo.tone === 'bad'
              ? 'bad'
              : 'warn';
      return row;
    });

    // 详情主体：没有供应商 / 没拉取过 / 拉取失败 三种「非成功快照」由这里统一兜底，
    // 成功快照才交给该供应商的详情模板。
    let detail: ReactNode;
    if (!activeVendor) {
      detail = <div className={styles.trayEmpty}>未选择供应商（极简模式）：在设置里选一个即可显示额度。</div>;
    } else if (s.loading && !activeSnap) {
      detail = <div className={styles.trayEmpty}>正在读取额度…</div>;
    } else if (!activeSnap) {
      detail = <div className={styles.trayEmpty}>还没有拉取过：点右上角 ⟳ 拉取一次。</div>;
    } else if (!activeSnap.ok) {
      detail = (
        <ErrBox
          info={errInfoOf(activeSnap, '拉取失败')}
          msg={activeSnap.error}
          meta={activeSnap.vendorName}
          onRetry={() => {
            void refreshVendor(activeVendor.id);
          }}
          compact={true}
        />
      );
    } else {
      detail = providerViews.renderBody({
        type: activeVendor.type,
        snap: activeSnap,
        now,
        vendorId: activeVendor.id,
      });
    }

    // 新鲜度：有快照就报「多久之前」，自动刷新关掉时补一句 —— 否则用户会以为数字卡住了
    const freshness = [
      activeSnap && activeSnap.at ? timeAgo(activeSnap.at) : '',
      autoOff ? '自动刷新已关闭' : '',
    ]
      .filter((part) => part !== '')
      .join(' · ');

    if (minimal) return null;
    const activeHint = buttonTitleOf(activeVendor, activeSnap, variant);

    return (
      <div className={cx(styles.trayRoot, props.wide ? undefined : styles.trayRail)} ref={rootRef}>
        <Tooltip label={activeHint} side="top" delayMs={400} disabled={open}>
          <button
            type="button"
            ref={btnRef}
            className={styles.trayBtn}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={activeHint}
            onClick={() => setOpen(!open)}
          >
            {/* 内容整体来自该供应商的**按钮级模板**（可能是一枚环、三条迷你条、余额、图标…） */}
            {activeButton}
          </button>
        </Tooltip>
        <QuotaTrayPanel
          open={open}
          setOpen={setOpen}
          rootRef={rootRef}
          anchorRef={btnRef}
          panelRef={panelRef}
          vendors={rows}
          activeGlyph={activeGlyph}
          activeHint={activeHint}
          activeName={activeVendor ? activeVendor.name : '未选择供应商'}
          detail={detail}
          freshness={freshness}
          loading={s.loading}
          error={s.error || (s.lastErr && s.lastErr.msg) || ''}
          manageHint="增删改供应商：设置 → TokenMeter → 额度配置"
          onRefresh={() => {
            void refreshVendor(activeVendor ? activeVendor.id : undefined);
          }}
          onSwitch={(id) => {
            // 切换即「一次只激活一个」：store 写 activeVendor 并立刻拉一次新供应商
            void setActive(id);
          }}
        />
      </div>
    );
  }

  return {
    QuotaSidebarAction,
    quotaStore: {
      useStore,
      get: () => store.get(),
      subscribe: (fn) => store.subscribe(fn),
      ensureLoad,
      reload,
      refreshVendor,
      syncState,
      setActive,
      setVendorEnabled,
      setRefresh,
      savePrefs,
      activeOf,
      typeLabel,
      remainOf,
      call,
    },
    quotaUI: { Badge, SecRow, FormField, PillSelect, VendorForm, secretBadge },
  };
}
