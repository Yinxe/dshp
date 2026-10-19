/**
 * @dshp/token-meter —— 密钥引用解析（provider 无关的公共模块）
 *
 * 原实现：dsh-token-quota/lib/secrets.js（逐行对齐，仅加 TS 类型）
 *
 * 写法（优先级与兼容性保持与原版 100% 一致）：
 *  - `$NAME`（推荐）：先读密钥文件（credentials 服务），再读环境变量；
 *    值内若含 `auth=...` 片段则只取该片段（兼容 go 抓包 cookie 粘贴）。
 *  - `{env:NAME}` / `{cred:NAME}`：旧写法，仅兼容，新代码统一归一为 `$NAME`。
 *  - 明文：原样使用（`auth=...` 同样只取片段）；空即 `empty`。
 */

import type { AnyCtx } from './types.js';

/** `$NAME`（字母/下划线开头，后接字母/数字/下划线）。 */
export const DOLLAR_REF_RE = /^\$([A-Za-z_][A-Za-z0-9_]*)$/;
/** 旧写法 `{env:NAME}`（仅兼容）。 */
export const ENV_REF_RE = /^\{env:([A-Za-z_][A-Za-z0-9_]*)\}$/;
/** 旧写法 `{cred:NAME}`（仅兼容）。 */
export const CRED_REF_RE = /^\{cred:([A-Za-z_][A-Za-z0-9_]*)\}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function isRecordExport(_v: unknown): boolean {
  return isRecord(_v);
}

/**
 * 旧引用写法统一为 `$NAME`（迁移 + base 层清洗共用）。
 * 非字符串原样返回；首尾空白会被 trim 后再匹配。
 */
export function normalizeSecretRef(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const t = raw.trim();
  let m = t.match(ENV_REF_RE);
  if (m) return '$' + (m[1] as string);
  m = t.match(CRED_REF_RE);
  if (m) return '$' + (m[1] as string);
  return raw;
}

/**
 * 对单条原始密钥做形态判断（不触碰外部存储，纯函数）。
 */
export function secretKindOfRaw(raw: unknown): 'empty' | 'ref' | 'env' | 'cred' | 'plain' {
  if (raw === undefined || raw === null || raw === '') return 'empty';
  const s = String(raw);
  if (DOLLAR_REF_RE.test(s)) return 'ref';
  if (ENV_REF_RE.test(s)) return 'env';
  if (CRED_REF_RE.test(s)) return 'cred';
  return 'plain';
}

function pickAuthFragment(v: string): string {
  const m = String(v).match(/auth=([^;\s]+)/);
  return m ? (m[1] as string).trim() : String(v).trim();
}

/**
 * 创建绑定到当前 Cordis ctx 的密钥解析器。
 * 行为与原版 `resolveSecret` 完全一致（含全部中文报错文案）。
 */
export function createSecretResolver(ctx: AnyCtx): (raw: string) => Promise<{ value: string; kind: string }> {
  return async function resolveSecret(raw: string): Promise<{ value: string; kind: string }> {
    if (typeof raw !== 'string' || !raw) return { value: '', kind: 'empty' };
    const trimmed = raw.trim();
    let m = trimmed.match(DOLLAR_REF_RE);
    if (m) {
      const refName = m[1] as string;
      // 先读密钥文件（credentials 服务），再读环境变量
      try {
        let creds: AnyCtx = null;
        try {
          creds = ctx.get('credentials') as AnyCtx;
        } catch {
          creds = null;
        }
        if (creds) {
          const r = await creds.resolve(refName);
          if (r && r.value) return { value: pickAuthFragment(r.value), kind: 'ref' };
        }
      } catch {
        /* ignore */
      }
      const envVal = process.env[refName] || '';
      if (envVal) return { value: pickAuthFragment(envVal), kind: 'ref' };
      throw new Error(
        '密钥引用 $' + refName + ' 为空(密钥文件与环境变量中均未找到，先写入凭据或导出环境变量)',
      );
    }
    m = trimmed.match(ENV_REF_RE);
    if (m) {
      const v = process.env[m[1] as string] || '';
      if (!v) throw new Error('环境变量 ' + (m[1] as string) + ' 为空或未导出(当前进程读不到)');
      return { value: v, kind: 'env' };
    }
    m = trimmed.match(CRED_REF_RE);
    if (m) {
      let creds: AnyCtx = null;
      try {
        creds = ctx.get('credentials') as AnyCtx;
      } catch {
        creds = null;
      }
      if (!creds) throw new Error('凭据服务不可用');
      const r = await creds.resolve(m[1] as string);
      if (!r || !r.value) throw new Error('凭据 ' + (m[1] as string) + ' 为空(先用「存凭据」写入)');
      return { value: r.value, kind: 'cred' };
    }
    if (/^\{(env|cred):/.test(trimmed))
      throw new Error('密钥引用语法错误,应为 $NAME 或 {env:NAME} 或 {cred:NAME}');
    if (trimmed.startsWith('$'))
      throw new Error('密钥引用语法错误,应为 $NAME（字母/数字/下划线，字母或下划线开头）');
    return { value: pickAuthFragment(trimmed), kind: 'plain' };
  };
}
