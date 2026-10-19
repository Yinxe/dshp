/**
 * provider 渲染调度器（按钮级 + 详情级两套模板）
 *
 * 「每个 provider return 自己的数据，client 也有两套属于它自己的渲染模板」的调度中枢：
 *
 *   1. **专属模板**（providers/ui/<type>.tsx）—— 该供应商自己的实现：
 *      `button` 声明环的语义（数值/档位/文案），`detail` 自由排版详情主体；
 *   2. **声明式区块**（sections.tsx + snap.view）—— 通用渲染，新供应商零客户端代码可用；
 *   3. **legacy 兜底** —— 老 Host 只下发 billingKind/windows/extra 时仍能显示。
 *
 * 失败不在这里处理：调度器只渲染成功快照，失败卡片由弹层统一走 `K.ErrorCard`
 * （结构化结论 + 排查步骤 + 重试），任何 provider 一致。
 *
 * 专属模板里的 `button` 出错不能连累详情：两条路径各自 try/catch，任一抛错就单独回落到通用层。
 */
import type { ReactNode } from 'react';
import type { ProviderSection, VendorSnapshot } from '../types.js';
import { providerPrefs } from '../quota-prefs.js';
import { renderSections } from './sections.js';
import { defaultRingSpec } from './templates.js';
import type { ButtonRenderCtx, ButtonVariant } from './templates.js';
import {
  getProviderTemplates,
  hasProviderTemplates,
  providerTemplateTypes,
  registerProviderTemplates,
} from './ui/index.js';
import type { ProviderUIKit, RenderCtx } from './kit.js';

/** 按钮渲染的调用参数（除快照本身外，都由侧边栏按钮/切换行提供）。 */
export interface ButtonRenderInput {
  type: string;
  snap: VendorSnapshot;
  now: number;
  /** 供应商 id：用来取**它自己的**展示偏好作用域（`ctx.prefs`）。 */
  vendorId: string;
  /** 三档位置（宽栏 / 窄栏 / 切换行）。 */
  variant: ButtonVariant;
  /** 供应商图标名（`iconOf()` 解析后的结果）。 */
  icon?: string | undefined;
}

/** 详情渲染的调用参数。 */
export interface BodyRenderInput {
  type: string;
  snap: VendorSnapshot;
  now: number;
  /** 供应商 id（详情模板要在自己的卡片里画偏好控件）。 */
  vendorId: string;
}

/** 调度器对外接口。 */
export interface ProviderRenderer {
  /** 渲染成功快照的主体（三层兜底） */
  renderBody: (input: BodyRenderInput) => ReactNode;
  /** 渲染按钮内容（专属 button → 通用兜底环）；**内容是自由节点**，不限于环。 */
  renderButton: (input: ButtonRenderInput) => ReactNode;
  /** 按钮的悬停/无障碍说明（模板的 `buttonHint` → 通用环语义兜底）。 */
  buttonTitle: (input: ButtonRenderInput) => string;
  /** 该 type 是否有专属模板 */
  hasBespoke: (type: string) => boolean;
  /** 已注册专属模板的 type 列表 */
  bespokeTypes: () => string[];
}

/** legacy 快照 → 声明式区块（旧 Host 未下发 view 时兜底）。 */
export function legacySections(snap: VendorSnapshot): ProviderSection[] {
  const out: ProviderSection[] = [];
  if (snap.billingKind === 'payg')
    out.push({ kind: 'balance', key: 'balance', title: '账户余额', billing: (snap.billing || {}) as any });
  else if (Array.isArray(snap.windows) && snap.windows.length)
    out.push({ kind: 'windows', key: 'windows', windows: snap.windows });
  const extra = snap.extra;
  if (extra) {
    const stats = Array.isArray(extra.stats) ? extra.stats.slice(0, 6) : [];
    if (stats.length) out.push({ kind: 'metrics', key: 'stats', items: stats });
    const blocks = Array.isArray(extra.blocks) ? extra.blocks.slice(0, 8) : [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || typeof b !== 'object') continue;
      if (b.kind === 'kv' && b.label)
        out.push({
          kind: 'metrics',
          key: 'kv' + i,
          items: [{ label: String(b.label), value: String(b.value ?? '') }],
        });
      else if (b.kind === 'progress' && isFinite(Number(b.used)) && Number(b.total) > 0) {
        const p: NonNullable<ProviderSection['progress']> = { used: Number(b.used), total: Number(b.total) };
        if (b.label) p.label = String(b.label);
        if (b.left !== undefined && b.left !== null && b.left !== '') p.left = String(b.left);
        out.push({ kind: 'progress', key: 'pg' + i, progress: p });
      } else if (b.kind === 'split' && Array.isArray(b.segments))
        out.push({ kind: 'split', key: 'sp' + i, split: { segments: b.segments } });
      else if (b.kind === 'note' && b.text) {
        const n: NonNullable<ProviderSection['note']> = { text: String(b.text) };
        if (b.tone) n.tone = b.tone;
        out.push({ kind: 'note', key: 'nt' + i, note: n });
      }
    }
    if (extra.chart && Array.isArray(extra.chart.values) && extra.chart.values.length > 1)
      out.push({ kind: 'chart', key: 'chart', chart: extra.chart });
  }
  return out;
}

/**
 * 造 provider 渲染调度器。
 *
 * @param K - deps 绑定后的零件命名空间。
 * @returns 两层模板各自兜底的调度器。
 */
export function createProviderRenderers(K: ProviderUIKit): ProviderRenderer {
  /** 详情第 2 层：provider 自描述 view；没给就用 legacy 快照现推 */
  function generic(ctx: RenderCtx): ReactNode {
    const sections = ctx.snap.view && Array.isArray(ctx.snap.view.sections) ? ctx.snap.view.sections : null;
    const rendered = sections ? renderSections(K, sections, ctx) : null;
    if (rendered) return rendered;
    return renderSections(K, legacySections(ctx.snap), ctx);
  }

  /** 详情级：专属 detail → 声明式 → legacy。 */
  function renderBody(input: BodyRenderInput): ReactNode {
    const ctx: RenderCtx = {
      snap: input.snap,
      now: input.now,
      type: input.type,
      vendorName: input.snap.vendorName || '',
      prefs: providerPrefs.scope(input.vendorId),
    };
    const detail = getProviderTemplates(input.type)?.detail;
    if (detail) {
      try {
        const out = detail(ctx, K);
        if (out !== null && out !== undefined) return out;
      } catch {
        /* 专属详情出错不影响可用性：落到通用层 */
      }
    }
    return generic(ctx);
  }

  /**
   * 按钮级：专属 button（自由节点）→ 通用兜底。
   *
   * 两条都要能兜住：模板抛错、或返回 `null`/`undefined`（例如数据形态变了）时都得有东西画，
   * 否则侧边栏那枚按钮会凭空消失。通用兜底本身仍是一枚环（`defaultRingSpec` + `Ring`），
   * 所以「没写按钮模板的供应商」也有可看的按钮。
   */
  function renderButton(input: ButtonRenderInput): ReactNode {
    const templates = getProviderTemplates(input.type);
    const ctx: ButtonRenderCtx = {
      snap: input.snap,
      now: input.now,
      type: input.type,
      vendorName: input.snap.vendorName || '',
      variant: input.variant,
      icon: input.icon !== undefined && input.icon !== '' ? input.icon : 'generic',
      prefs: providerPrefs.scope(input.vendorId),
    };
    const button = templates?.button;
    if (button) {
      try {
        const out = button(ctx, K);
        if (out !== null && out !== undefined && out !== false) return out;
      } catch {
        /* 专属按钮出错：用通用语义顶上 */
      }
    }
    const spec = defaultRingSpec(ctx, K);
    return (
      <K.ButtonLayout
        variant={ctx.variant}
        leading={<K.Ring spec={spec} size={ctx.variant === 'wide' ? 16 : 18} />}
        name={ctx.vendorName}
        value={spec.text}
        tone={spec.tone}
        icon={ctx.icon}
      />
    );
  }

  /** 按钮说明：模板的 `buttonHint` → 通用兜底。 */
  function buttonTitle(input: ButtonRenderInput): string {
    const templates = getProviderTemplates(input.type);
    const ctx: ButtonRenderCtx = {
      snap: input.snap,
      now: input.now,
      type: input.type,
      vendorName: input.snap.vendorName || '',
      variant: input.variant,
      icon: input.icon !== undefined && input.icon !== '' ? input.icon : 'generic',
      prefs: providerPrefs.scope(input.vendorId),
    };
    if (templates?.buttonHint) {
      try {
        const out = templates.buttonHint(ctx, K);
        if (typeof out === 'string' && out !== '') return out;
      } catch {
        /* 说明拿不到就用通用语义 */
      }
    }
    return defaultRingSpec(ctx, K).title;
  }

  return {
    renderBody,
    renderButton,
    buttonTitle,
    hasBespoke: (type: string) => hasProviderTemplates(type),
    bespokeTypes: () => providerTemplateTypes(),
  };
}

export { registerProviderTemplates };
