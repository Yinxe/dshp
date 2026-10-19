/**
 * 声明式区块渲染器（分层渲染的兜底层之一）
 *
 * 把 provider 自描述的 `ProviderSection[]` 渲染成节点 —— **本文件不认识任何具体
 * 供应商**，也不自己实现组件：全部转发给 `kit.tsx` 的通用零件。
 * 未知 kind / 字段缺失一律跳过，保证老客户端遇到新 provider 不崩。
 *
 * 兜底链上的位置（见 registry.tsx）：
 *   专属 UI（providers/ui/<type>.tsx） → **声明式区块（本文件）** → legacy 快照
 *
 * 原来是 `createSectionRenderer(K)` 工厂：`K`（deps 绑定后的零件命名空间）是真实依赖，
 * 保留为两个具名导出函数的参数。
 */
import type { ReactNode } from 'react';
import styles from '../styles.module.css';
import type { ProviderSection } from '../types.js';
import type { ProviderUIKit, RenderCtx } from './kit.js';

/**
 * 渲染单个声明式区块。
 *
 * @param K - deps 绑定后的零件命名空间。
 * @param s - provider 自描述的区块。
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @param i - 区块序号（与 key 一起保证 React 列表稳定）。
 * @returns 区块节点；未知 kind 或字段缺失时 null。
 */
export function renderSection(K: ProviderUIKit, s: ProviderSection, ctx: RenderCtx, i: number): ReactNode {
  if (!s || typeof s !== 'object') return null;
  const key = 'sec:' + (s.key || s.kind) + ':' + i;
  switch (s.kind) {
    case 'windows':
      return <K.WindowGroup key={key} windows={s.windows} snap={ctx.snap} now={ctx.now} title={s.title} />;
    case 'balance':
      return <K.BalanceBlock key={key} billing={s.billing} title={s.title} />;
    case 'metrics':
      return <K.MetricRows key={key} items={s.items} title={s.title} />;
    case 'progress': {
      const p = s.progress;
      if (!p) return null;
      const total = Number(p.total);
      const used = Number(p.used);
      if (!isFinite(total) || total <= 0 || !isFinite(used)) return null;
      const pct = Math.min(100, Math.max(0, (used / total) * 100));
      const left = p.left !== undefined && p.left !== '' ? String(p.left) : '剩余 ' + (total - used);
      return (
        <div key={key} className={styles.xprog}>
          <K.SectionTitle key="t" text={s.title} />
          <K.RollingBar key="bar" label={String(p.label || s.title || '额度')} pct={pct} left={left} />
        </div>
      );
    }
    case 'split':
      return <K.SplitBar key={key} segments={s.split && s.split.segments} title={s.title} />;
    case 'note':
      return <K.NoteLine key={key} text={s.note && s.note.text} tone={s.note && s.note.tone} />;
    case 'chart':
      return <K.MiniChart key={key} chart={s.chart} />;
    default:
      return null; // 未知 kind：静默跳过（前向兼容）
  }
}

/**
 * 渲染整份视图。
 *
 * @param K - deps 绑定后的零件命名空间。
 * @param sections - provider 自描述的区块数组。
 * @param ctx - 快照 / 时间 / 供应商身份。
 * @returns 区块容器；无有效区块返回 null（交给上一层兜底）。
 */
export function renderSections(K: ProviderUIKit, sections: unknown, ctx: RenderCtx): ReactNode {
  if (!Array.isArray(sections) || !sections.length) return null;
  const kids = (sections as ProviderSection[])
    .map((s, i) => renderSection(K, s, ctx, i))
    .filter((n) => n !== null && n !== undefined && n !== false);
  if (!kids.length) return null;
  return <div className={styles.sections}>{kids}</div>;
}
