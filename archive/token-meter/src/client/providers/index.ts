/**
 * provider 分层渲染入口（按钮级 + 详情级）
 *
 * 「每个 provider return 自己的数据，client 也有两套属于它自己的渲染模板」：
 *
 *   Host 侧  providers/<type>.ts          适配器 return 自己的数据（view/billing/windows/extra）
 *   Client 侧 providers/ui/<type>.tsx     **该供应商专属的两套模板**：button（环的语义）+ detail（主体排版）
 *            providers/templates.ts       模板契约 + 通用兜底（QuotaRingSpec / defaultRingSpec）
 *            providers/kit.tsx            通用可复用零件（滚动刷新条/余额块/指标/图表/失败卡…）
 *            providers/sections.tsx       声明式区块渲染（无专属模板的供应商零代码可用）
 *            providers/registry.tsx       调度：专属模板 → 声明式 → legacy 兜底（两条路径各自兜底）
 *
 * 扩展方式：
 *  - 只想「能显示」：Host 适配器产出 view 即可，客户端零改动（走声明式层，按钮走通用环语义）；
 *  - 想要「专属观感」：在 ui/ 下加一个 `<type>.tsx` 导出 `ProviderTemplates`（button/detail 任选），
 *    并在 ui/index.ts 注册一行；需要通用零件就从 `ProviderUIKit` 取，不要重复造。
 */
export { createProviderKit, fallbackErrorInfo } from './kit.js';
export type { ProviderUIKit, KitDeps, RenderCtx } from './kit.js';
export { createProviderRenderers, legacySections, registerProviderTemplates } from './registry.js';
export type { ProviderRenderer, ButtonRenderInput, BodyRenderInput } from './registry.js';
export {
  defaultRingSpec,
  failureRingSpec,
  RAIL_ICON,
  ringSizeOf,
  toneOfPct,
  windowOfMetric,
  windowPct,
  worstWindowPct,
  balanceText,
  clampPct,
} from './templates.js';
export type {
  ButtonRenderCtx,
  ButtonVariant,
  ProviderTemplates,
  QuotaRingSpec,
  QuotaTone,
} from './templates.js';
export { getProviderTemplates, hasProviderTemplates, providerTemplateTypes } from './ui/index.js';
