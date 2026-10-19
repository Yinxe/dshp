/**
 * @dshp/token-meter —— provider 自描述视图（view）构造器
 *
 * 设计目标：让「一个供应商自己的数据 + 排版」成为适配器的第一类产出，而不是把
 * 供应商差异硬编码进客户端。适配器只需按序拼区块：
 *
 *   view: makeView([
 *     windowsSection(windows, '滚动窗口'),
 *     balanceSection(billing, '剩余额度'),
 *     metricsSection([{ label: '请求数', value: '137' }]),
 *     noteSection('订阅生效中', 'info'),
 *   ])
 *
 * 客户端按 kind 渲染（client/providers/sections.ts），无需认识具体供应商；
 * 新增供应商只写适配器，不动客户端。
 *
 * 双轨兼容：适配器仍照旧产出 billingKind/windows/billing/extra（旧客户端、
 * 侧边栏徽标、低余额预警都依赖它们）。
 *  - `defaultView(data)`：legacy 字段 → 声明式区块。适配器没给 view 时由 Host 兜底
 *    推导，因此 opencode/manual/deepseek 等老适配器零改动即获得声明式视图；
 *  - `viewToExtra(view)`：声明式区块 → legacy extra。新适配器只写 view 也能喂饱
 *    旧客户端（不要求两边重复维护同一份数据）。
 */
import type { ProviderExtra, ProviderSection, ProviderView, QuotaBilling, QuotaWindow } from '../types.js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function finite(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 滚动窗口区块。 */
export function windowsSection(windows: QuotaWindow[], title?: string): ProviderSection | null {
  if (!Array.isArray(windows) || !windows.length) return null;
  const s: ProviderSection = { kind: 'windows', key: 'windows', windows };
  if (title) s.title = title;
  return s;
}

/** 余额区块（复用 payg 语义：主数字 + 可用状态 + 赠送/充值拆分 + 多币种）。 */
export function balanceSection(billing: QuotaBilling, title?: string): ProviderSection | null {
  if (!isRecord(billing) || Object.keys(billing).length === 0) return null;
  const s: ProviderSection = { kind: 'balance', key: 'balance', billing };
  if (title) s.title = title;
  return s;
}

/** 键值指标区块（label → value 若干行）。 */
export function metricsSection(
  items: Array<{ label: string; value: string }>,
  title?: string,
): ProviderSection | null {
  const clean = (Array.isArray(items) ? items : []).filter(
    (it) =>
      it && typeof it.label === 'string' && it.label !== '' && it.value !== undefined && it.value !== null,
  );
  if (!clean.length) return null;
  const s: ProviderSection = {
    kind: 'metrics',
    key: 'metrics',
    items: clean.map((it) => ({ label: it.label, value: String(it.value) })),
  };
  if (title) s.title = title;
  return s;
}

/** 单条进度区块（已用/总量），总量必须为正才有意义。 */
export function progressSection(
  progress: { label?: string; used: number; total: number; left?: string },
  title?: string,
): ProviderSection | null {
  const used = finite(progress && progress.used);
  const total = finite(progress && progress.total);
  if (used === null || total === null || total <= 0) return null;
  const p: { label?: string; used: number; total: number; left?: string } = { used, total };
  if (progress.label) p.label = progress.label;
  if (progress.left) p.left = progress.left;
  const s: ProviderSection = { kind: 'progress', key: 'progress', progress: p };
  if (title) s.title = title;
  return s;
}

/** 分段占比区块。 */
export function splitSection(
  split: { segments: Array<{ label: string; value: number; color?: string }> },
  title?: string,
): ProviderSection | null {
  const segs = (Array.isArray(split && split.segments) ? split.segments : []).filter(
    (sg) => sg && finite(sg.value) !== null && Number(sg.value) > 0,
  );
  if (!segs.length) return null;
  const s: ProviderSection = {
    kind: 'split',
    key: 'split',
    split: {
      segments: segs.map((sg) => {
        const out: { label: string; value: number; color?: string } = {
          label: String(sg.label || ''),
          value: Number(sg.value),
        };
        if (sg.color) out.color = sg.color;
        return out;
      }),
    },
  };
  if (title) s.title = title;
  return s;
}

/** 提示条区块。 */
export function noteSection(text: unknown, tone?: 'info' | 'warn' | 'bad'): ProviderSection | null {
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) return null;
  const note: { text: string; tone?: 'info' | 'warn' | 'bad' } = { text: t.slice(0, 300) };
  if (tone) note.tone = tone;
  return { kind: 'note', key: 'note', note };
}

/** 趋势折线区块。 */
export function chartSection(chart: {
  title?: string;
  labels: string[];
  values: number[];
}): ProviderSection | null {
  const values = (Array.isArray(chart && chart.values) ? chart.values : [])
    .map((v) => finite(v))
    .filter((v): v is number => v !== null);
  if (values.length < 2) return null;
  const labels = Array.isArray(chart && chart.labels) ? chart.labels.map((l) => String(l)) : [];
  const c: { title?: string; labels: string[]; values: number[] } = { labels, values };
  if (chart.title) c.title = chart.title;
  return { kind: 'chart', key: 'chart', chart: c };
}

/** 组装视图：丢掉空区块，全空则返回 null。 */
export function makeView(sections: Array<ProviderSection | null | undefined>): ProviderView | null {
  const list = (Array.isArray(sections) ? sections : []).filter(
    (s): s is ProviderSection => !!s && typeof s.kind === 'string',
  );
  return list.length ? { sections: list } : null;
}

/**
 * legacy 字段 → 声明式视图（老适配器兜底推导）。
 *
 * 顺序刻意与旧客户端渲染顺序一致（主体区块 → 统计 → 附加块 → 图表），
 * 保证「推导出来的 view」与「旧路径直接渲染 extra」观感一致。
 */
export function defaultView(data: {
  billingKind?: string;
  windows?: QuotaWindow[];
  billing?: QuotaBilling;
  extra?: ProviderExtra | null;
}): ProviderView | null {
  const sections: Array<ProviderSection | null> = [];
  if (data && data.billingKind === 'payg')
    sections.push(balanceSection((data.billing || {}) as QuotaBilling));
  else sections.push(windowsSection((data && data.windows) || []));
  const extra = (data && data.extra) || null;
  if (extra) {
    sections.push(metricsSection(Array.isArray(extra.stats) ? extra.stats : []));
    const blocks = Array.isArray(extra.blocks) ? extra.blocks : [];
    for (let i = 0; i < blocks.length && i < 8; i++) {
      const b = blocks[i];
      if (!b || typeof b !== 'object') continue;
      if (b.kind === 'kv' && b.label)
        sections.push(metricsSection([{ label: String(b.label), value: String(b.value ?? '') }]));
      else if (b.kind === 'progress' && finite(b.used) !== null && Number(b.total) > 0) {
        const it: { label?: string; used: number; total: number; left?: string } = {
          used: Number(b.used),
          total: Number(b.total),
        };
        if (b.label) it.label = String(b.label);
        if (b.left !== undefined && b.left !== null && b.left !== '') it.left = String(b.left);
        sections.push(progressSection(it));
      } else if (b.kind === 'split' && Array.isArray(b.segments))
        sections.push(splitSection({ segments: b.segments }));
      else if (b.kind === 'note' && b.text) sections.push(noteSection(String(b.text), b.tone));
    }
    if (extra.chart && Array.isArray(extra.chart.values) && extra.chart.values.length > 1)
      sections.push(chartSection(extra.chart));
  }
  return makeView(sections);
}

/**
 * 声明式视图 → legacy extra（新适配器只写 view 时的反向兼容）。
 * metrics → stats，其余可映射区块 → blocks；chart 原样带出。
 */
export function viewToExtra(view: ProviderView | null | undefined): ProviderExtra | null {
  const sections = view && Array.isArray(view.sections) ? view.sections : [];
  if (!sections.length) return null;
  const stats: Array<{ label: string; value: string }> = [];
  const blocks: NonNullable<ProviderExtra['blocks']> = [];
  let chart: ProviderExtra['chart'];
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue;
    if (s.kind === 'metrics' && Array.isArray(s.items)) {
      for (const it of s.items) stats.push({ label: it.label, value: it.value });
    } else if (s.kind === 'progress' && s.progress) {
      const b: NonNullable<ProviderExtra['blocks']>[number] = {
        kind: 'progress',
        used: s.progress.used,
        total: s.progress.total,
      };
      if (s.progress.label) b.label = s.progress.label;
      if (s.progress.left) b.left = s.progress.left;
      blocks.push(b);
    } else if (s.kind === 'split' && s.split) {
      const b: NonNullable<ProviderExtra['blocks']>[number] = { kind: 'split', segments: s.split.segments };
      if (s.title) b.label = s.title;
      blocks.push(b);
    } else if (s.kind === 'note' && s.note) {
      const b: NonNullable<ProviderExtra['blocks']>[number] = { kind: 'note', text: s.note.text };
      if (s.note.tone) b.tone = s.note.tone;
      blocks.push(b);
    } else if (s.kind === 'chart' && s.chart) {
      chart = { title: s.chart.title || '', labels: s.chart.labels, values: s.chart.values };
    }
  }
  const extra: ProviderExtra = {};
  if (stats.length) extra.stats = stats.slice(0, 12);
  if (blocks.length) extra.blocks = blocks.slice(0, 8);
  if (chart) extra.chart = chart;
  return extra.stats || extra.blocks || extra.chart ? extra : null;
}
