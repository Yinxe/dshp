/**
 * 配置：schemastery schema（volatile 声明）
 *
 * - 官方 settings 命名空间 `dshp-skill-manager`（与包名/路由前缀/cordis id 一致）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 一次性自动导入）；
 *   全字段 `.volatile()`：`settings.update` 写入原地生效，不必重启。
 * - 只认 NS：不做历史 key 兼容、不做迁移（docs/settings.md「不做迁移」）
 *
 * @module @dshp/skill-manager
 */
import { homedir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from './http.js';

export const NS: string = settingsNamespace('dshp-skill-manager');

/** dshHome / agentsHome 解析规则与 dsh-skill-filesystem 一致（环境变量优先，缺省 ~） */
export function defaultDshHome(): string {
  const env = process.env['DSH_HOME'];
  return env && env.trim() ? env.trim() : resolve(homedir(), '.dsh');
}

export function defaultAgentsHome(): string {
  const env = process.env['DSH_AGENTS_HOME'];
  return env && env.trim() ? env.trim() : resolve(homedir(), '.agents');
}

/** workspaceRoot 字符串上限（绝对路径足够，超出视为脏数据丢弃） */
export const WORKSPACE_ROOT_MAX = 1024;

/** dsh 自身配置的全字段 volatile schema（设置页与手工编辑条目 config 都走它）。 */
export const ConfigSchema: any = z.object({
  enabled: z.boolean().default(true).volatile(),
  workspaceRoot: z.string().default('').volatile(),
});

/** workspaceRoot 消毒：截断 → 必须解析为绝对路径，非法回 '' */
export function sanitizeWorkspaceRoot(v: unknown): string {
  if (typeof v !== 'string') return '';
  const raw = v.trim().slice(0, WORKSPACE_ROOT_MAX);
  if (!raw) return '';
  const abs = isAbsolute(raw) ? resolve(raw) : '';
  return abs || '';
}
