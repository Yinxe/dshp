/**
 * @dshp/token-meter —— provider 适配器公共基座（纯函数，无外部依赖）
 *
 * 原实现：dsh-token-quota/lib/providers/base.js（逐行对齐，仅加 TS 类型）
 *
 * 新供应商只需要实现「适配器对象」（见 ProviderAdapter），放进
 * `src/host/providers/<type>.ts` 并在 `src/host/providers/index.ts` 注册一行，
 * 即可自动获得：配置清洗 / 密钥脱敏 / 快照拉取 / state 元数据下发 / 设置页表单。
 */

import type { ProviderAdapter } from '../types.js';

/** 供应商 id 规则：小写字母/数字/横线，2–31 位（主键，主键不可改）。 */
export const ID_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

/** opencode workspaceId 规则（沿用原 fetchGo 校验）。 */
export const WORKSPACE_RE = /^[A-Za-z0-9_]{4,64}$/;

/** 数字归一：非有限值回退为 d（deepseek/manual 金额字段共用）。 */
export function num(v: unknown, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/** 同 num(v, 0)，余额/已用/总额速写。 */
export function numStr(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 校验适配器形状（注册时调用，fail-fast，报错即指出缺失字段）。
 */
export function checkAdapterShape(a: unknown): string {
  if (!a || typeof a !== 'object') return '适配器为空';
  const r = a as Record<string, unknown>;
  if (typeof r['type'] !== 'string' || !ID_RE.test(r['type'] as string))
    return '适配器 type 非法(' + String(r['type']) + ')';
  if (typeof r['label'] !== 'string' || !r['label']) return '适配器 ' + String(r['type']) + ' 缺少 label';
  if (typeof r['title'] !== 'string' || !r['title']) return '适配器 ' + String(r['type']) + ' 缺少 title';
  if (typeof r['secretField'] !== 'string')
    return '适配器 ' + String(r['type']) + ' secretField 须为字符串（无密钥填空串）';
  if (!Array.isArray(r['fields'])) return '适配器 ' + String(r['type']) + ' 缺少 fields 数组';
  if (typeof r['fetch'] !== 'function') return '适配器 ' + String(r['type']) + ' 缺少 fetch(vendor, deps)';
  return '';
}

export type { ProviderAdapter };
