/**
 * provider 模板注册表（按钮级 + 详情级）
 *
 * 「每个 provider 有两套属于它自己的渲染模板」的落点：一个 type 对应一个 `ProviderTemplates`,
 *  - `button`（按钮级）：活动栏按钮与供应商切换行左侧那枚环形进度画什么（`QuotaRingSpec`）；
 *  - `detail`（详情级）：弹层里该供应商的主体内容（完整节点，自由排版）。
 *
 *   export const xxx: ProviderTemplates = { button, detail }
 *
 * 注册是可选的：没注册的 type 自动落到通用层（按钮走 `defaultRingSpec`、
 * 详情走「声明式区块 → legacy」兜底），因此新增供应商**不必写客户端代码**；
 * 写了则获得完全自由的专属观感。
 *
 * 注意：模板只管「成功快照」的渲染；失败提示由弹层统一走结构化 `ErrorCard`
 * （任何 provider 失败都是同一套友好提示 + 重试）。
 *
 * @module @dshp/token-meter/client/providers/ui
 */
import { commandcode } from './commandcode.js';
import { deepseek } from './deepseek.js';
import { opencode } from './opencode.js';
import { manual } from './manual.js';
import type { ProviderTemplates } from '../templates.js';

const TEMPLATES = new Map<string, ProviderTemplates>();

/** 注册/覆盖某 type 的两套模板（重复注册覆盖，便于热更与测试）。 */
export function registerProviderTemplates(type: string, templates: ProviderTemplates): void {
  if (typeof type === 'string' && type && templates && typeof templates === 'object')
    TEMPLATES.set(type, templates);
}

/** 取某 type 的模板（没注册返回 `undefined`，调用方走通用层）。 */
export function getProviderTemplates(type: string): ProviderTemplates | undefined {
  return TEMPLATES.get(type);
}

/** 某 type 是否有专属模板。 */
export function hasProviderTemplates(type: string): boolean {
  return TEMPLATES.has(type);
}

/** 已注册专属模板的 type 列表。 */
export function providerTemplateTypes(): string[] {
  return [...TEMPLATES.keys()];
}

// ── 内置专属模板（新增一行即接入一个供应商的按钮级 + 详情级渲染）──────────
registerProviderTemplates('commandcode', commandcode);
registerProviderTemplates('deepseek', deepseek);
registerProviderTemplates('opencode', opencode);
registerProviderTemplates('manual', manual);
