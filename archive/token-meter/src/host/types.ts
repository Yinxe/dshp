/**
 * @dshp/token-meter —— 共享类型定义
 *
 * DSH 运行时（Cordis ctx / tools / llm / settings / webServer）暂无官方 npm 类型包，
 * Host 侧统一用 `AnyCtx`（= any 的别名）透传，仅对本插件自有的数据结构做严格建模。
 *
 * 合并来源：
 *  - quota：~/.dsh/plugins/dsh-token-quota（@dshp-inx/token-quota v1.0.1）
 *    lib/config.js + lib/secrets.js + lib/providers/*.js + lib/index.js 的隐式结构
 *  - stats：~/.dsh/plugins/dsh-token-stats（@dshp-inx/token-stats v1.1.3）
 *    lib/fold.js + lib/engine.js + lib/index.js 的聚合快照结构
 * 本文件为 TS 重写新增：把两边散落的隐式结构显式化，行为不变。
 */
import type { Volatile } from '@deepseek-ai/cosmokit';
import type { ErrorInfo } from './errors.js';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  params: Record<string, unknown>;
  /**
   * 余额查询开关：`false` = 不参与 Host 定时拉取（手动「拉取」不受影响）；
   * 缺省/`true` = 启用。只在禁用时写盘，旧配置零迁移。
   */
  enabled?: boolean;
}

export interface VendorSnapshot {
  vendorId: string;
  vendorName: string;
  ok: boolean;
  at: string;
  fetchedAtMs: number;
  billingKind?: 'rolling' | 'payg';
  windows?: QuotaWindow[];
  billing?: QuotaBilling;
  /** 供应商自描述视图（客户端分层渲染的第 2 层；无则走 legacy 兜底） */
  view?: ProviderView | null;
  secretKind?: string;
  extra?: ProviderExtra | null;
  via?: string;
  /** 失败原始文案（保留：旧客户端与日志用） */
  error?: string;
  /** 失败结构化信息（标题/解释/去哪改/排查步骤/严重度），客户端据此渲染友好提示 */
  errorInfo?: ErrorInfo;
}

export type { ErrorInfo, ErrorKind, ErrorTone } from './errors.js';

export interface QuotaWindow {
  key: string;
  label: string;
  pct: number;
  used: number;
  limit: number;
  resetInSec: number;
  /**
   * 上游给的窗口状态原值（如 opencode 的 `ok` / `rate-limited`）。
   * 非 `ok` 表示该窗口已被限流/停用 —— 即使 pct 没到 100 也要让用户看见。
   */
  status?: string;
}

export interface QuotaBilling {
  balance?: number;
  currency?: string;
  granted?: number | null;
  toppedUp?: number | null;
  isAvailable?: boolean | null;
  infos?: Array<{ currency: string; total: number; granted: number | null; toppedUp: number | null }>;
  lowWarn?: number | null;
  plan?: string;
  [key: string]: unknown;
}

export interface ProviderFieldOption {
  value: string;
  label: string;
}

export interface ProviderField {
  key: string;
  label: string;
  kind: 'text' | 'secret' | 'number' | 'select';
  mono?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: ProviderFieldOption[];
  showWhen?: { key: string; eq: string };
  hint?: string;
}

export interface ProviderDeps {
  resolveSecret: (raw: string) => Promise<{ value: string; kind: string }>;
  fetchImpl: typeof fetch;
}

/**
 * provider 视图区块 —— 声明式 UI 的最小单元。
 *
 * 每个供应商用「有序区块」自描述自己的数据与排版（`ProviderView.sections`），
 * 客户端按 `kind` 分发渲染，完全不需要认识具体供应商。
 * 未知 kind / 缺失字段一律跳过 → 老客户端遇到新 provider 也不会崩（前向兼容）。
 */
/**
 * 分段/占比条的语义色调（客户端按主题 token 上色；与 `client/types.ts` 的 `SegmentTone` 同源）。
 *
 * 适配器只声明语义，不写死色值 —— 换主题时比例条跟着换。
 */
export type SegmentTone = 'brand' | 'ok' | 'warn' | 'bad' | 'info' | 'muted';

export interface ProviderSection {
  kind: 'windows' | 'balance' | 'metrics' | 'progress' | 'split' | 'note' | 'chart';
  /** 稳定标识（React key / 去重用），可选 */
  key?: string;
  /** 区块小标题（客户端统一以小号次要色渲染） */
  title?: string;
  /** kind='windows'：滚动窗口组（带重置倒计时） */
  windows?: QuotaWindow[];
  /** kind='balance'：余额主数字块（复用 payg 语义） */
  billing?: QuotaBilling;
  /** kind='metrics'：键值指标行 */
  items?: Array<{ label: string; value: string }>;
  /** kind='progress'：单条进度（已用/总量） */
  progress?: { label?: string; used: number; total: number; left?: string };
  /** kind='split'：分段占比条 */
  split?: { segments: Array<{ label: string; value: number; tone?: SegmentTone; color?: string }> };
  /** kind='note'：提示条 */
  note?: { text: string; tone?: 'info' | 'warn' | 'bad' };
  /** kind='chart'：趋势折线 */
  chart?: { title?: string; labels: string[]; values: number[] };
}

/**
 * provider 自定义视图：该供应商自己的「数据 + UI」。
 *
 * 分层渲染约定（见 client/providers/）：
 *  1. 供应商专属渲染器（client/providers/<type>.ts）优先；
 *  2. 无专属渲染器 → 按本视图的 sections 通用渲染；
 *  3. 无 view（旧快照/极简适配器）→ 回退 billingKind + extra 的旧路径。
 */
export interface ProviderView {
  sections: ProviderSection[];
}

export interface ProviderResult {
  billingKind: 'rolling' | 'payg';
  windows?: QuotaWindow[];
  billing?: QuotaBilling;
  extra?: ProviderExtra | null;
  /** 供应商自描述视图（可选；缺省时由 Host 从 legacy 字段推导 defaultView） */
  view?: ProviderView | null;
  secretKind?: string;
  via?: string;
}

export interface ProviderExtra {
  stats?: Array<{ label: string; value: string }>;
  chart?: { title: string; labels: string[]; values: number[] };
  blocks?: ProviderBlock[];
}

export interface ProviderBlock {
  kind: 'kv' | 'progress' | 'split' | 'note';
  label?: string;
  value?: string;
  used?: number;
  total?: number;
  left?: string;
  segments?: Array<{
    label: string;
    value: number;
    /** 语义色调（跟随主题 token）；旧适配器可继续给 `color` 写死色值 */ tone?: SegmentTone;
    color?: string;
  }>;
  text?: string;
  tone?: 'info' | 'warn' | 'bad';
}

export interface ProviderAdapter {
  type: string;
  label: string;
  title: string;
  secretField: string;
  secretFields?: string[];
  fields: ProviderField[];
  hint?: string;
  /**
   * 供应商图标名（客户端按名字取一枚自绘 mark，见 `client/provider-icons.tsx`）。
   * Host 只传名字 —— 适配器不携带任何图片/SVG，运行时零依赖。
   */
  icon?: string;
  /**
   * 新增供应商时 params 的初始值（provider 自己声明表单默认值，
   * 客户端在「切换类型」时套用；缺省为空对象）。
   * 例：commandcode → `{ apiKey: '$COMMAND_CODE_API_KEY' }`。
   */
  defaultParams?: Record<string, unknown>;
  sanitizeParams?: (raw: unknown) => Record<string, unknown>;
  validateParams?: (params: Record<string, unknown>) => string;
  readSecret?: (params: Record<string, unknown>) => unknown;
  maskParams?: (params: Record<string, unknown>) => Record<string, unknown>;
  fetch: (vendor: Vendor, deps: ProviderDeps) => Promise<ProviderResult>;
}

export interface ProviderMeta {
  type: string;
  label: string;
  title: string;
  secretField: string;
  hint: string;
  /** 图标名（缺省 = 客户端按 type 兜底）。 */
  icon?: string;
  fields: ProviderField[];
  /** 新增供应商时的 params 初始值（provider 自声明） */
  defaultParams: Record<string, unknown>;
}

// ── stats 聚合 ─────────────────────────────────────────────────────────────

export interface StatsRecord {
  d: string;
  h: number;
  m: string;
  i: number;
  o: number;
  cr: number;
  cw: number;
  n: number;
}

export interface StatsModelInfo {
  provider: string;
  model: string;
}

export interface StatsPeak {
  tokens: number;
  d: string;
  model: string;
}

/** 每日在线时长（毫秒；`byGap` 按预设阈值分别给出） */
export interface StatsOnlineDay {
  d: string;
  /** 当天有 token 记录的会话数 */
  sessions: number;
  /** 当天 token 合计（i+o+cr+cw） */
  tokens: number;
  /** 当天「对话进行中」时长（turn 区间并集） */
  turnMs: number;
  /** 每个预设阈值（分钟，字符串键）下的在线毫秒 */
  byGap: Record<string, number>;
  /** 每个预设阈值下的活动段数（「来了又走」的次数） */
  segByGap: Record<string, number>;
  /** 当天模型生成墙钟（并行相加） */
  llmMs: number;
  /** 当天工具执行墙钟（并行相加） */
  toolMs: number;
}

/**
 * 在线时长估算（见 stats/online.ts 的口径说明）。
 * 任何阈值下都是**下界**：日志只在有事件时打点，窗口开着但无事件的时间不可见。
 */
export interface StatsOnline {
  /** 客户端默认选中的阈值（分钟，取自 gaps） */
  defaultGapMin: number;
  /** 可切换的预设阈值（分钟） */
  gaps: number[];
  /** 每个阈值的累计在线毫秒 */
  totalMs: Record<string, number>;
  /** 每个阈值下的活动段数（判断阈值是否把整段对话切碎） */
  segments: Record<string, number>;
  /** 「对话进行中」累计毫秒（turn/start → turn/end 区间并集，不做空闲合并） */
  turnMs: number;
  /** 模型生成墙钟合计（step/start → assistant/message，跨会话相加，可大于墙钟） */
  llmMs: number;
  /** 工具执行墙钟合计（tool/call → tool/result，跨会话相加） */
  toolMs: number;
  activeDays: number;
  firstDay: string | null;
  lastDay: string | null;
  /** 仅活跃日，升序 */
  days: StatsOnlineDay[];
}

export interface StatsSnapshot {
  ready: boolean;
  records: StatsRecord[];
  models: Record<string, StatsModelInfo>;
  daySessions: Record<string, number>;
  peakStep: StatsPeak | null;
  range: { first: string; last: string } | null;
  sessions: number;
  active: number;
  partial: boolean;
  scanned: number;
  total: number;
  errors: number;
  /** 扫描失败的原因样本（最多 5 条，诊断用） */
  errorSamples?: Array<{ id: string; message: string }>;
  /** 本次统计里有多少会话靠「直读日志」兜底拿到 */
  directReads?: number;
  /** 会话结局分类计数（usage / fork-empty / no-request / failed / no-usage） */
  sessionOutcomes?: Record<string, number>;
  /** 本次快照命中持久化缓存的会话数（重启后才会发生） */
  cacheHits?: number;
  /** 本次快照完全没读日志的会话数（持久化缓存 + 进程内复用） */
  reused?: number;
  storage: string;
  generatedAt: number;
  /** 在线时长估算（老 Host 无此字段时客户端自行降级隐藏面板） */
  online?: StatsOnline;
  error?: string;
}

// ── 插件配置（profile 条目 config: dshp-token-meter，0.1.7 起替代 settings.yaml 分节）──

export type DefaultRange = '7' | '30' | '90' | 'all';

export interface PluginConfig {
  version: number;
  activeVendor: string;
  refreshSec: number;
  enabled: boolean;
  vendors: Vendor[];
  showToday: boolean;
  defaultRange: DefaultRange;
  /** 在线时长空闲阈值（分钟，1/5/15/30/60；缺省 15） */
  onlineGapMin: number;
}

/**
 * `apply(ctx, config)` 实参：除 `version` 外全字段 volatile（装载期由 schema 强制回默认值），
 * 业务读路径经 `.get()` 拿当前深只读快照；路由写入走 `settings.update(NS, patch)` 整组提交。
 */
export interface VolatileConfig {
  version: number;
  activeVendor: Volatile<string>;
  refreshSec: Volatile<number>;
  enabled: Volatile<boolean>;
  vendors: Volatile<Vendor[]>;
  showToday: Volatile<boolean>;
  defaultRange: Volatile<DefaultRange>;
  onlineGapMin: Volatile<number>;
}

// ── 同源路由协议（host ↔ client/types.ts 对齐）─────────────────────────────

export interface SanitizedVendor extends Vendor {
  secretKind: string;
}

export interface SanitizedQuotaConfig {
  version: number;
  activeVendor: string;
  refreshSec: number;
  enabled: boolean;
  vendors: SanitizedVendor[];
}

export interface StateResponse {
  ok: boolean;
  namespace?: string;
  docPath?: string;
  config?: SanitizedQuotaConfig & {
    showToday: boolean;
    defaultRange: DefaultRange;
    onlineGapMin: number;
  };
  snaps?: Record<string, VendorSnapshot>;
  providers?: ProviderMeta[];
  providerTypes?: string[];
  error?: string;
}

export interface StatsDataResponse extends StatsSnapshot {}

export interface ConfigSaveResponse {
  ok: boolean;
  config?: PluginConfig;
  error?: string;
}

/** DSH 运行时 ctx —— 暂无官方类型，透传 any */
export type AnyCtx = any;
export type AnySettings = any;
