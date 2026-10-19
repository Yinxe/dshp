/**
 * 配置：schemastery schema（volatile 声明）+ 服务器条目消毒
 *
 * - 官方 settings 命名空间 `dshp-mcp-manager`（与包名/路由前缀/cordis id 一致）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 一次性自动导入）；
 *   全字段 `.volatile()`：`settings.update` 写入原地生效，不必重启。
 * - 只认 NS：不做历史 key 兼容、不做迁移（docs/settings.md「不做迁移」）
 * - 服务器条目消毒是 create/update 路由的唯一入口：字段逐一校验 + 截断，
 *   `js: ` 前缀字符串表示 `!!js` 表达式（回写时转 tagged 节点）
 *
 * @module @dshp/mcp-manager
 */
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from './http.js';
import type { EnvValueView, JsMarkPaths, NormalizedServerConfig } from './types.js';

export const NS: string = settingsNamespace('dshp-mcp-manager');

/** dshHome 解析规则与 dsh-skill-filesystem 一致（DSH_HOME 优先，缺省 ~） */
export function defaultDshHome(): string {
  const env = process.env['DSH_HOME'];
  return env && env.trim() ? env.trim() : join(homedir(), '.dsh');
}

/** patchFile 显式覆盖长度上限（绝对路径足够，超出视为脏数据丢弃） */
export const PATCH_FILE_MAX = 1024;

/** serverName 官方约束：[A-Za-z0-9_-]{1,32}（dsh-mcp-client README） */
export const SERVER_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

/** dsh 自身配置的全字段 volatile schema（设置页与手工编辑条目 config 都走它）。 */
export const ConfigSchema: any = z.object({
  enabled: z.boolean().default(true).volatile(),
  patchFile: z.string().default('').volatile(),
});

/** 官方 dsh-mcp-client 包名（只管理这个包的实例条目） */
export const MCP_CLIENT_NAME = '@deepseek-ai/dsh-mcp-client';

// ── 消毒上限（docs/ext-routes.md：一切字符串入库前截断，数字夹范围） ──────

export const LIMITS = {
  id: 120,
  serverName: 32,
  command: 600,
  argsCount: 64,
  arg: 600,
  envEntries: 64,
  envKey: 120,
  envValue: 4096,
  cwd: 1024,
  url: 2048,
  jsonValue: 8192,
  jsonDepth: 6,
  issue: 300,
} as const;

// ── 类型守卫 ────────────────────────────────────────────────────────────

export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** plain JSON 检查：字符串/数字/布尔/null 的有限深度嵌套（守 reconnect / extras 的形状） */
export function isPlainJson(v: unknown, depth = 0): boolean {
  if (v === null) return true;
  if (typeof v === 'string') return v.length <= LIMITS.jsonValue;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  if (depth >= LIMITS.jsonDepth) return false;
  if (Array.isArray(v)) return v.length <= 64 && v.every((x) => isPlainJson(x, depth + 1));
  if (isRecord(v)) {
    const keys = Object.keys(v);
    return (
      keys.length <= 64 &&
      keys.every((k) => k.length <= LIMITS.envKey) &&
      keys.every((k) => isPlainJson(v[k], depth + 1))
    );
  }
  return false;
}

/** 文本消毒：非字符串回 ''，字符串截断 */
function asText(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

// ── 插件自身配置 ────────────────────────────────────────────────────────

/** patchFile 消毒：截断 → 必须解析为绝对路径，非法回 '' */
export function sanitizePatchFilePath(v: unknown): string {
  if (typeof v !== 'string') return '';
  const raw = v.trim().slice(0, PATCH_FILE_MAX);
  if (!raw) return '';
  return isAbsolute(raw) ? raw : '';
}

// ── env / headers 映射 ──────────────────────────────────────────────────

/**
 * 消毒 env/headers 映射：键截断、值截断；`js: ` 前缀字符串视为 `!!js` 表达式
 * （剥掉前缀原样保留源码，并在 jsMarks 里登记路径，如 env.GITHUB_TOKEN）。
 * 显式 js 标记（值为 { js: true, source } 视图对象）同样接受——客户端 JSON
 * 模式直接回传视图时走这条路。
 */
export function sanitizeStringMap(raw: unknown, field: string, jsMarks: JsMarkPaths): Record<string, string> {
  if (raw === undefined || raw === null) return {};
  if (!isRecord(raw)) throw new Error(`${field} 非法，应为对象（如 { "KEY": "value" }）`);
  const keys = Object.keys(raw);
  if (keys.length > LIMITS.envEntries) throw new Error(`${field} 条目过多（最多 ${LIMITS.envEntries} 项）`);
  const out: Record<string, string> = {};
  for (const k of keys) {
    const key = k.slice(0, LIMITS.envKey);
    if (!key) throw new Error(`${field} 存在空键名`);
    const v = raw[k];
    const marked = parseEnvValueView(v, field);
    if (marked.js) {
      jsMarks.add(field + '.' + key);
      out[key] = marked.source;
    } else {
      out[key] = marked.source;
    }
  }
  return out;
}

/** 单值 → EnvValueView：接受字符串（`js: ` 前缀 = 表达式）或 EnvValueView 形状 */
export function parseEnvValueView(v: unknown, field: string): EnvValueView {
  if (typeof v === 'string') {
    return v.startsWith('js: ') || v === 'js:'
      ? { js: true, source: v === 'js:' ? '' : v.slice(4).slice(0, LIMITS.envValue) }
      : { js: false, source: v.slice(0, LIMITS.envValue) };
  }
  if (isRecord(v) && typeof v['js'] === 'boolean' && typeof v['source'] === 'string') {
    return { js: v['js'], source: v['source'].slice(0, LIMITS.envValue) };
  }
  throw new Error(`${field} 的值非法，应为字符串（表达式用 "js: " 前缀）`);
}

// ── 服务器条目 config 消毒（create/update 路由共用） ─────────────────────

export const KNOWN_CONFIG_KEYS: ReadonlySet<string> = new Set([
  'serverName',
  'transport',
  'command',
  'args',
  'env',
  'cwd',
  'url',
  'headers',
  'toolCallTimeoutMs',
  'failOnStartupError',
  'reconnect',
]);

/**
 * 消毒 create/update 的 config 载荷。已知字段逐一校验（非法抛中文 Error），
 * 未知字段按 plain JSON 收进 extras（回写时原样落盘）。
 * providedKeys 记录载荷里实际出现的键（update 合并语义：载荷未提及的
 * 已知键视为删除；未提及的未知 extras 键从原文保留）。
 */
export function sanitizeServerConfig(raw: unknown): {
  config: NormalizedServerConfig;
  jsMarks: JsMarkPaths;
  providedKeys: Set<string>;
} {
  if (!isRecord(raw)) throw new Error('config 非法，应为对象');
  if (Object.hasOwn(raw, 'name')) throw new Error('config 里不应有 name（name 是条目级字段，由插件写入）');
  if (Object.hasOwn(raw, 'id')) throw new Error('config 里不应有 id（条目 id 由插件按 serverName 生成）');
  if (Object.hasOwn(raw, 'disabled'))
    throw new Error('config 里不应有 disabled（启停请用 toggle 路由或行内开关）');

  const jsMarks: JsMarkPaths = new Set();
  const serverName = asText(raw['serverName'], LIMITS.serverName).trim();
  if (!SERVER_NAME_PATTERN.test(serverName))
    throw new Error('serverName 非法：应为 1-32 位的字母/数字/下划线/连字符（官方约束）');
  const transport = raw['transport'];
  if (transport !== 'stdio' && transport !== 'streamable-http')
    throw new Error("transport 非法：应为 'stdio' 或 'streamable-http'");

  let command = '';
  let args: string[] = [];
  let cwd = '';
  let url = '';
  if (transport === 'stdio') {
    command = asText(raw['command'], LIMITS.command).trim();
    if (!command) throw new Error('command 不能为空（stdio 传输要给出可执行文件）');
    const rawArgs = raw['args'];
    if (rawArgs !== undefined && rawArgs !== null) {
      if (!Array.isArray(rawArgs)) throw new Error('args 非法，应为字符串数组');
      if (rawArgs.length > LIMITS.argsCount) throw new Error(`args 条目过多（最多 ${LIMITS.argsCount} 项）`);
      args = rawArgs.map((a) => asText(a, LIMITS.arg));
    }
    cwd = asText(raw['cwd'], LIMITS.cwd).trim();
  } else {
    url = asText(raw['url'], LIMITS.url).trim();
    if (!/^https?:\/\//.test(url)) throw new Error('url 非法：应以 http:// 或 https:// 开头');
  }

  const env = Object.hasOwn(raw, 'env') ? sanitizeStringMap(raw['env'], 'env', jsMarks) : {};
  const headers = Object.hasOwn(raw, 'headers') ? sanitizeStringMap(raw['headers'], 'headers', jsMarks) : {};

  let toolCallTimeoutMs: number | null = null;
  if (Object.hasOwn(raw, 'toolCallTimeoutMs') && raw['toolCallTimeoutMs'] !== null) {
    const n = raw['toolCallTimeoutMs'];
    if (typeof n !== 'number' || !Number.isFinite(n))
      throw new Error('toolCallTimeoutMs 非法，应为数字（毫秒）');
    toolCallTimeoutMs = Math.min(3600000, Math.max(1000, Math.floor(n)));
  }
  let failOnStartupError: boolean | null = null;
  if (Object.hasOwn(raw, 'failOnStartupError') && raw['failOnStartupError'] !== null) {
    const b = raw['failOnStartupError'];
    if (typeof b !== 'boolean') throw new Error('failOnStartupError 非法，应为布尔');
    failOnStartupError = b;
  }
  let reconnect: unknown = null;
  if (Object.hasOwn(raw, 'reconnect') && raw['reconnect'] !== null) {
    const r = raw['reconnect'];
    if (!isRecord(r) || !isPlainJson(r))
      throw new Error('reconnect 非法，应为简单 JSON 对象（enabled/initialDelayMs/maxDelayMs/maxAttempts）');
    reconnect = r;
  }

  const extras = collectExtras(raw);

  return {
    config: {
      serverName,
      transport,
      command,
      args,
      env,
      cwd,
      url,
      headers,
      toolCallTimeoutMs,
      failOnStartupError,
      reconnect,
      extras,
    },
    jsMarks,
    providedKeys: new Set(Object.keys(raw)),
  };
}

/** 收集未知键（plain JSON 才收；复杂值忽略并在回写时从原文保留） */
function collectExtras(raw: Record<string, unknown>): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) {
    if (KNOWN_CONFIG_KEYS.has(k)) continue;
    const v = raw[k];
    if (isPlainJson(v)) extras[k.slice(0, LIMITS.envKey)] = v;
  }
  return extras;
}
