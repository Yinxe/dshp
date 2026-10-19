/**
 * @dshp/token-meter —— provider 注册表（扩展唯一入口）
 *
 * 原实现：dsh-token-quota/lib/providers/index.js（逐行对齐，仅加 TS 类型）
 *
 * 新增供应商三步（无需改动其他文件）：
 *  1. 复制 `opencode.ts` 为 `src/host/providers/<新type>.ts`，改 type/label/title/
 *     secretField/fields/sanitizeParams/validateParams/fetch；
 *  2. 在本文件底部 `registerProvider(<新适配器>)` 加一行（内置清单区）；
 *  3. 重启 `dsh web`（Host 半）—— Client 表单/徽章/校验会自动跟随
 *     `state.providers` 元数据，无需改 client。
 *
 * 分层渲染：适配器可用 `view.ts` 的构造器产出「自己的数据 + UI 排版」
 * （ProviderResult.view）。客户端按声明式区块通用渲染，供应商专属渲染器
 * （client/providers/<type>.ts）可选叠加 —— 详见 client/providers/index.ts。
 * 没给 view 的适配器由 Host 用 `defaultView()` 从 legacy 字段兜底推导。
 */
import { checkAdapterShape } from './base.js';
import { secretKindOfRaw } from '../secrets.js';
import opencode from './opencode.js';
import deepseek from './deepseek.js';
import commandcode from './commandcode.js';
import manual from './manual.js';
import type { ProviderAdapter, ProviderMeta, Vendor } from '../types.js';

const registry = new Map<string, ProviderAdapter>();

/** 旧 type → 现 type（别名；写路径经 canonicalType 归一，别名永不落库）。 */
const ALIASES = new Map<string, string>();

/**
 * 注册一个 provider 适配器（重复 type 直接抛错）。
 */
export function registerProvider(adapter: ProviderAdapter): void {
  const err = checkAdapterShape(adapter);
  if (err) throw new Error('[token-meter] 非法 provider 适配器: ' + err);
  if (registry.has(adapter.type)) {
    throw new Error('[token-meter] provider 类型重复注册: ' + adapter.type);
  }
  registry.set(adapter.type, adapter);
}

/**
 * 注册旧 type 别名（映射到现役适配器）。
 */
export function registerAlias(from: string, to: string): void {
  if (typeof from !== 'string' || typeof to !== 'string' || !from || !to) {
    throw new Error('[token-meter] 别名必须为非空字符串');
  }
  if (!registry.has(to)) {
    throw new Error('[token-meter] 别名目标未注册: ' + to);
  }
  if (registry.has(from)) {
    throw new Error('[token-meter] 别名与现役类型冲突: ' + from);
  }
  let cur = to;
  const seen = new Set<string>([from]);
  while (ALIASES.has(cur)) {
    cur = ALIASES.get(cur) as string;
    if (seen.has(cur)) throw new Error('[token-meter] 别名循环: ' + from);
    seen.add(cur);
  }
  ALIASES.set(from, to);
}

/** 别名归一（非别名原样返回）。 */
export function canonicalType(type: string): string {
  let cur = type;
  const seen = new Set<string>();
  while (typeof cur === 'string' && ALIASES.has(cur)) {
    cur = ALIASES.get(cur) as string;
    if (seen.has(cur)) break;
    seen.add(cur);
  }
  return cur;
}

/**
 * 取某类型的主密钥字段名（未知类型返回 ''，调用方按无密钥处理）。
 */
export function getSecretField(type: string): string {
  const p = registry.get(canonicalType(type));
  return p ? p.secretField : '';
}

export function getProvider(type: string): ProviderAdapter | undefined {
  return registry.get(canonicalType(type));
}

export function hasProvider(type: string): boolean {
  if (registry.has(type)) return true;
  return ALIASES.has(type);
}

/** 全部适配器（注册顺序，不含别名） */
export function listProviders(): ProviderAdapter[] {
  return [...registry.values()];
}

/** 全部 type 数组（含别名，配校验/schema 用） */
export function providerTypes(): string[] {
  return [...registry.keys(), ...ALIASES.keys()];
}

/**
 * 某适配器的密钥字段顺序（主字段在前；含旧字段兜底）。
 */
function secretKeysOf(p: ProviderAdapter | undefined): string[] {
  const list: string[] = [];
  if (p && typeof p.secretField === 'string' && p.secretField) list.push(p.secretField);
  if (p && Array.isArray(p.secretFields)) {
    for (const k of p.secretFields) {
      if (typeof k === 'string' && k && list.indexOf(k) === -1) list.push(k);
    }
  }
  return list;
}

function secretPresent(v: unknown): boolean {
  return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== '';
}

/**
 * 读生效密钥原文（按字段顺序首个非空；旧字段改名天然兜底）。
 */
export function readSecretValue(vendor: { type: string; params?: Record<string, unknown> }): string {
  const t = canonicalType(vendor && vendor.type);
  const p = typeof t === 'string' ? registry.get(t) : undefined;
  const params = vendor && vendor.params && typeof vendor.params === 'object' ? vendor.params : {};
  if (!p) return '';
  if (typeof p.readSecret === 'function') {
    try {
      const v = p.readSecret(params);
      return v === undefined || v === null ? '' : String(v);
    } catch {
      return '';
    }
  }
  for (const k of secretKeysOf(p)) {
    const v = (params as Record<string, unknown>)[k];
    if (secretPresent(v)) return String(v);
  }
  return '';
}

/**
 * 定位生效密钥所在字段（读到哪个写回哪个；无值时返回主字段）。
 */
export function locateSecretKey(vendor: { type: string; params?: Record<string, unknown> }): string {
  const t = canonicalType(vendor && vendor.type);
  const p = typeof t === 'string' ? registry.get(t) : undefined;
  const params = vendor && vendor.params && typeof vendor.params === 'object' ? vendor.params : {};
  if (!p) return '';
  for (const k of secretKeysOf(p)) {
    if (secretPresent((params as Record<string, unknown>)[k])) return k;
  }
  return p.secretField || '';
}

/**
 * 供应商当前密钥形态（含无密钥类型的 'none'）。
 */
export function secretKindOf(vendor: { type: string; params?: Record<string, unknown> }): string {
  const t = canonicalType(vendor && vendor.type);
  const p = typeof t === 'string' ? registry.get(t) : undefined;
  if (!p || !p.secretField) return 'none';
  const val = readSecretValue(vendor);
  if (val === undefined || val === null || val === '') return 'empty';
  return secretKindOfRaw(String(val));
}

/**
 * 脱敏拷贝：明文密钥字段抹空后下发 Client（只写不读）。
 */
export function maskParamsForType(type: string, raw: unknown): Record<string, unknown> {
  const p = registry.get(canonicalType(type));
  const src =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  if (p && typeof p.maskParams === 'function') {
    try {
      return p.maskParams({ ...src });
    } catch {
      return { ...src };
    }
  }
  const out = { ...src };
  for (const f of secretKeysOf(p)) {
    if (typeof out[f] === 'string' && out[f] !== '' && secretKindOfRaw(out[f]) === 'plain') out[f] = '';
  }
  return out;
}

/**
 * 委托给适配器的 params 清洗（未知类型→浅拷贝透传，保证前向兼容）。
 */
export function sanitizeParamsForType(type: string, raw: unknown): Record<string, unknown> {
  const p = registry.get(canonicalType(type));
  if (p && typeof p.sanitizeParams === 'function') return p.sanitizeParams(raw);
  const src =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return { ...src };
}

/**
 * 委托给适配器的 params 校验（''=通过）。
 */
export function validateParamsForType(type: string, params: Record<string, unknown>): string {
  const p = registry.get(canonicalType(type));
  if (!p) return '未知类型';
  if (typeof p.validateParams === 'function') {
    try {
      return p.validateParams(params || {}) || '';
    } catch (e) {
      return (e as Error)?.message || '参数非法';
    }
  }
  return '';
}

/**
 * 下发给 Client 设置页/文档的 provider 元数据（纯 JSON，可序列化）。
 */
export function describeProviders(): ProviderMeta[] {
  return listProviders().map((p) => ({
    type: p.type,
    label: p.label,
    title: p.title,
    secretField: p.secretField,
    hint: p.hint || '',
    ...(p.icon !== undefined && p.icon !== '' ? { icon: p.icon } : {}),
    fields: (p.fields || []).map((f) => {
      const out: import('../types.js').ProviderField = {
        key: f.key,
        label: f.label,
        kind: f.kind,
      };
      if (f.mono !== undefined) out.mono = !!f.mono;
      if (f.placeholder !== undefined) out.placeholder = f.placeholder || '';
      if (f.required !== undefined) out.required = !!f.required;
      if (Array.isArray(f.options)) out.options = f.options.map((o) => ({ value: o.value, label: o.label }));
      if (f.showWhen) out.showWhen = { key: f.showWhen.key, eq: f.showWhen.eq };
      if (f.hint !== undefined) out.hint = f.hint || '';
      return out;
    }),
    defaultParams:
      p.defaultParams && typeof p.defaultParams === 'object'
        ? (JSON.parse(JSON.stringify(p.defaultParams)) as Record<string, unknown>)
        : {},
  }));
}

export type { Vendor };

// ── 内置清单：新增一行即扩展一个供应商 ──────────────────────────
registerProvider(opencode);
registerProvider(deepseek);
registerProvider(commandcode);
registerProvider(manual);
// 旧 type 别名（配置读路径自动归一，别名永不落库；无需迁移数据）
//  - opencode-go / opencode-zen → opencode（Go+Zen 合并）
//  - deepseek-api / deepseek-web → deepseek（三类型合并为「自动选路」单入口）
registerAlias('opencode-go', 'opencode');
registerAlias('opencode-zen', 'opencode');
registerAlias('deepseek-api', 'deepseek');
registerAlias('deepseek-web', 'deepseek');
