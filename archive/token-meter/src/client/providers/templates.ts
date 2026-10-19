/**
 * provider 模板契约：**按钮级**与**详情级**两套独立渲染模板
 *
 * ## 按钮级：内容不限于环
 *
 * 侧边栏底部那一枚按钮（`sidebar.footer.action`）的内容完全交给供应商自己画：**不是**必须有环 ——
 * 余额大数字、5 小时 / 每周 / 每月三条迷你条、图标 + 环、甚至纯图标都行，只要控制在一枚
 * 侧栏按钮里。三档宽度由 `ctx.variant` 告诉模板：
 *
 * | variant  | 位置                        | 常规做法                                       |
 * | -------- | --------------------------- | ---------------------------------------------- |
 * | `wide`   | 展开的侧边栏（拉满宽、42px） | `K.ButtonLayout`：图标 + 主图形 + 名字 + 数值  |
 * | `rail`   | 收起的侧边栏（56px 轨道）    | 只放主图形（环/图标），文字收起                |
 * | `row`    | 浮层里的供应商切换行         | 只放主图形（与其它行左对齐、~16px）            |
 *
 * 通用骨架/零件从 `ProviderUIKit` 取（`ButtonLayout` / `Ring` / `WindowBars` / `ProviderIcon`…），
 * 供应商只写「自己特有的取舍」。
 *
 * ## 用户偏好：`ctx.prefs`（键值由供应商自己定义）
 *
 * 按钮上显示什么，是**该供应商自己的事**：Goat 想给「余额开关 + 5h/1w/1m」，
 * deepseek 可能只要一个余额开关。所以契约里**没有**统一的指标列表 / 单选按钮组：
 * 模板拿到的是一个按供应商分作用域的键值袋（浏览器本地，`providerPrefs`），
 * 键名与取值域由模板自己定，控件也由模板画在自己的详情里
 * （`ProviderUIKit.PrefSwitch` / `PrefChoice`）：
 *
 * ```ts
 * const window = ctx.prefs.get('window', 'monthly');  // 读（带兜底）
 * ctx.prefs.set('balance', '1');                      // 写 → 侧边栏按钮立刻重画
 * ```
 *
 * 插件只保证「读得到、写下去、写完全局重画」，不解释任何键名。
 *
 * ## 环形进度的 spec
 *
 * 环是「一种常见画法」而不是契约：想画环的模板用 `QuotaRingSpec` 描述它（数值 + 档位 + 文案），
 * 由 `QuotaRing` 统一画（几何/描边/动画/无障碍集中一处），模板也完全可以不用它。
 *
 * @module @dshp/token-meter/client/providers/templates
 */
import type { ReactNode } from 'react';
import type { ProviderUIKit, RenderCtx } from './kit.js';
import type { QuotaWindow, VendorSnapshot } from '../types.js';

/** 环形按钮的严重度（决定弧的颜色；`idle` = 无数据）。 */
export type QuotaTone = 'ok' | 'warn' | 'bad' | 'idle';

/** 环形进度的渲染说明（供应商决定语义，通用层只负责画）。 */
export interface QuotaRingSpec {
  /** 已用比例 0–100；`null` = 没有可表达的进度（画空环 + `text`）。 */
  pct: number | null;
  /** 弧色档位。 */
  tone: QuotaTone;
  /** 环内/环旁极短文案（≤6 字，如 `62%` / `¥9`）；省略则只画环。 */
  text?: string | undefined;
  /** 悬停与无障碍说明（必填：窄栏里没有可见文字，全靠它）。 */
  title: string;
  /** 完全自绘覆盖默认环（极少数供应商专属图形用；给了就忽略 pct/tone 的绘制）。 */
  custom?: ReactNode;
}

/** 按钮所在的三档位置（见模块文档的表）。 */
export type ButtonVariant = 'wide' | 'rail' | 'row';

/** 按钮级模板的上下文（在详情级 `RenderCtx` 之上补两样按钮独有的信息）。 */
export interface ButtonRenderCtx extends RenderCtx {
  /** 三档位置：宽栏 / 窄栏（56px 轨道）/ 浮层切换行。 */
  variant: ButtonVariant;
  /** 供应商图标名（Host 元数据 → 客户端兜底；模板可用 `K.ProviderIcon` 画）。 */
  icon: string;
}

/** 一个供应商的两套模板；两者都可选（缺了就落到通用层）。 */
export interface ProviderTemplates {
  /** 按钮级：返回**完整节点**（自由渲染：环、余额、迷你条、图标…，只要装得进一枚按钮）。 */
  button?: ((ctx: ButtonRenderCtx, K: ProviderUIKit) => ReactNode) | undefined;
  /**
   * 按钮的悬停 / 无障碍说明（窄栏里没有可见文字，全靠它）。
   * 缺省用通用环语义（`defaultRingSpec(ctx).title`）—— 与 `button` 画什么无关，
   * 纯粹是「这条按钮在说什么」，所以要单独给（供应商自己知道）。
   */
  buttonHint?: ((ctx: ButtonRenderCtx, K: ProviderUIKit) => string) | undefined;
  /** 详情级：弹层里该供应商的主体内容。 */
  detail?: ((ctx: RenderCtx, K: ProviderUIKit) => ReactNode) | undefined;
}

/**
 * 环在三档位置里的推荐尺寸（px）。
 *
 * 统一在这里，避免每家自己写 `variant === 'wide' ? 16 : 18` 而把 18px 的环塞进 16px 的槽。
 *
 *  - 宽栏 **16**：与 42px 行高、14px 字号相称（左边还有一枚 16px 图标，两枚同尺寸才不打架）；
 *  - 切换行 **16**：与浮层里 16px 的图标槽对齐；
 *  - 窄栏 **28**：收起后侧边栏只剩一枚 36×36 的圆，「图标 + 小环并排」（早先是 14+16+3=33）
 *    会读成两个互不相干的小记号——环只有 16px 时弧长太短，也看不出比例。改成**环当表盘**：
 *    28 外径 + 2.2 描边，供应商图标 15px 居中在环心，一个物体同时给「谁」和「用了多少」。
 *    28 塞进 36 圆还剩 4px 呼吸，再大就开始和 hover 底色打架。
 *
 * @param variant - 三档位置。
 * @returns 环的外径。
 */
export function ringSizeOf(variant: ButtonVariant): number {
  return variant === 'rail' ? 28 : 16;
}

/** 窄栏表盘里那枚供应商图标的宽度（px）；DeepSeek 的鲸鱼按官方比例算出高 ≈ 11。 */
export const RAIL_ICON = 15;

/** 占用比例 → 严重度档位（阈值与 `QUOTA_LEVEL` 同源：70 / 90）。 */
export function toneOfPct(pct: number): QuotaTone {
  if (!isFinite(pct)) return 'idle';
  if (pct >= 90) return 'bad';
  if (pct >= 70) return 'warn';
  return 'ok';
}

/** 夹到 0–100；非有限值返回 `null`（= 无数据，而不是 0）。 */
export function clampPct(value: unknown): number | null {
  const n = Number(value);
  if (!isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

/** 单条窗口的占用比例（`limit<=0` 视为未知）。 */
export function windowPct(w: { used?: unknown; limit?: unknown; pct?: unknown } | undefined): number | null {
  if (!w || typeof w !== 'object') return null;
  const direct = clampPct(w.pct);
  if (direct !== null) return direct;
  const used = Number(w.used);
  const limit = Number(w.limit);
  if (!isFinite(used) || !isFinite(limit) || limit <= 0) return null;
  return clampPct((used / limit) * 100);
}

/** 多条窗口里占用最高的那条（通用兜底与 provider 都可能用到：不挑窗口，只关心最紧的那条）。 */
export function worstWindowPct(snap: VendorSnapshot): number | null {
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  let worst: number | null = null;
  for (const w of wins) {
    const pct = windowPct(w);
    if (pct === null) continue;
    if (worst === null || pct > worst) worst = pct;
  }
  return worst;
}

/**
 * 按偏好里存的窗口键取一条滚动窗口。
 *
 * 先按 `key` 精确匹配（Host 的窗口键：`5h` / `weekly` / `monthly`），再按标签兜底
 * （老适配器可能没有稳定的 key）—— 用户选了「每周」就该看到每周，匹配不到时返回 `null`，
 * 由模板回落到自己的默认窗口（而不是显示一条错的窗口）。
 *
 * @param snap - 快照。
 * @param metric - 窗口键（`5h` / `weekly` / `monthly`；也兼容按标签匹配）。
 * @returns 窗口；找不到返回 `null`。
 */
export function windowOfMetric(snap: VendorSnapshot, metric: string): QuotaWindow | null {
  const wins: QuotaWindow[] = Array.isArray(snap.windows) ? snap.windows : [];
  if (wins.length === 0) return null;
  const key = String(metric || '').toLowerCase();
  if (key === '') return null;
  const byKey = wins.filter((w) => String(w.key || '').toLowerCase() === key)[0];
  if (byKey) return byKey;
  const alias: Record<string, string[]> = {
    '5h': ['5 小时', '5小时', '滚动'],
    weekly: ['每周', '周'],
    monthly: ['每月', '月'],
  };
  const labels = alias[key];
  if (labels === undefined) return null;
  const hit = wins.filter((w) => labels.some((l) => String(w.label || '').indexOf(l) >= 0))[0];
  return hit ?? null;
}

/** 余额文案（`¥9.06` / `$12`）；余额未知返回 `null`。 */
export function balanceText(snap: VendorSnapshot, K: ProviderUIKit): string | null {
  const b = (snap.billing || {}) as Record<string, unknown>;
  const balance = b['balance'];
  if (balance === undefined || balance === null || b['isAvailable'] === false) return null;
  const n = Number(balance);
  if (!isFinite(n)) return null;
  return K.curSymbol(String(b['currency'] || '')) + K.fmt(n);
}

/**
 * 失败快照的环：**空环 + 满圈警告色**（没有比例可表达，但状态必须刺眼）。
 *
 * 严重度取结构化失败的 `errorInfo.tone`：`bad`（密钥/会话/订阅/余额这类要人管的）画红圈，
 * 其余（限流/网络/5xx 这类临时的）画黄圈 —— 与切换列表里那一行的状态色同源。
 *
 * @param snap - 失败快照。
 * @param name - 供应商显示名（进入 title）。
 * @returns 环形按钮渲染说明。
 */
export function failureRingSpec(snap: VendorSnapshot, name: string): QuotaRingSpec {
  const info = snap.errorInfo;
  const tone: QuotaTone = info && info.tone === 'bad' ? 'bad' : 'warn';
  const what = (info && (info.title || info.hint)) || '额度读取失败';
  return { pct: null, tone, title: name + '：' + String(what) };
}

/**
 * 通用兜底按钮模板（没写专属 `button` 的 type 用 `defaultRingSpec` 画一枚环）。
 *
 * 语义：画「占用最高的滚动窗口」；没有窗口可算（payg / 只有余额）时画空环并把余额当文案
 * —— 与其编一个假比例，不如让环空着、把真实数字摆在旁边。
 *
 * @param ctx - 快照 / 时间 / 供应商身份 / 档位（含 `prefs`，通用兜底用不到）。
 * @param K - deps 绑定后的零件命名空间。
 * @returns 环形按钮渲染说明。
 */
export function defaultRingSpec(ctx: ButtonRenderCtx, K: ProviderUIKit): QuotaRingSpec {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || '额度';
  if (!snap.ok) return failureRingSpec(snap, name);
  const pct = worstWindowPct(snap);
  if (pct !== null) {
    const label = '最高窗口';
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + '%',
      title: name + '：' + label + '已用 ' + Math.round(pct) + '%',
    };
  }
  const money = balanceText(snap, K);
  if (money !== null) {
    return { pct: null, tone: 'idle', text: money, title: name + '：余额 ' + money };
  }
  return { pct: null, tone: 'idle', title: name + '：暂无额度数据' };
}
