/**
 * Host 半共享类型
 *
 * - AnyCtx 只用于运行时透传对象（cordis ctx / service），自有数据严格建模
 * - McpServerView 与 client/types.ts 的同名字段保持对齐（路由协议即契约）
 *
 * @module @dshp/mcp-manager
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

export type AnyCtx = any;
export type AnySettings = any;

/** env/headers 单值视图：js=true 表示 `!!js` 表达式（source 为表达式源码） */
export interface EnvValueView {
  js: boolean;
  source: string;
}

export type McpTransport = 'stdio' | 'streamable-http';

/** 一台 MCP 服务器在 patch 文件里的条目视图（state 路由下发） */
export interface McpServerView {
  /** cordis 条目 id（如 mcp-github）；文件内重复时 dup=true 且 UI 禁改 */
  id: string;
  dup: boolean;
  serverName: string;
  transport: McpTransport | '';
  disabled: boolean;
  /** disabled 是 `!!js` 表达式时为 true：UI 开关覆盖后会落成普通布尔 */
  disabledIsJs: boolean;
  /** stdio */
  command: string;
  args: string[];
  env: Record<string, EnvValueView>;
  cwd: string;
  /** streamable-http */
  url: string;
  headers: Record<string, EnvValueView>;
  /** 通用可选字段；null = 未显式配置 */
  toolCallTimeoutMs: number | null;
  failOnStartupError: boolean | null;
  /** reconnect 对象（JSON 化原样带回；null = 未显式配置） */
  reconnect: unknown;
  /** 本插件不认识但会原样保留的键（可 JSON 化部分），客户端编辑时应原样回传 */
  extras: Record<string, unknown>;
  /** 含无法 JSON 化的复杂值（如 !!js 映射）：仅支持删除/启停，不支持编辑保存 */
  unmanageable: boolean;
  /**
   * 运行时已在 tools 注册表里的 mcp__<serverName>__* 工具数（真实连接信号：
   * 连接 + 工具同步成功才 > 0）。null = tools 服务不可用或 serverName 非法，无法枚举。
   */
  toolCount: number | null;
  /** 结构校验问题（截断后下发） */
  issues: string[];
  /** 条目在 patch 文件中的起始行（展示用；保存后行号会漂移） */
  line: number | null;
}

/** 连接探活结果（stdio 不探活：spawn 有副作用） */
export interface ProbeResult {
  state: 'ok' | 'fail' | 'skip';
  detail: string;
  serverInfoName: string;
  serverInfoVersion: string;
  protocolVersion: string;
  latencyMs: number | null;
  at: number;
}

export interface PatchFileInfo {
  path: string;
  exists: boolean;
  source: 'settings' | 'env' | 'module-path' | 'profile-scan' | 'fallback';
}

/** GET /state 的 state 载荷 */
export interface McpState {
  enabled: boolean;
  patchFile: PatchFileInfo;
  servers: McpServerView[];
  /** instanceId → 最近一次探活结果（内存缓存，重启即失） */
  probes: Record<string, ProbeResult>;
  /** patch 文件整体解析问题（能列出条目但文档带错误时非空） */
  fileIssue: string;
}

/** 插件自身配置（profile 条目 `config:` 的 dshp-mcp-manager 分节，0.1.7 起替代 settings.yaml） */
export interface PluginConfig {
  enabled: boolean;
  /** patch 文件显式覆盖路径；空串 = 自动定位 */
  patchFile: string;
}

/** `apply(ctx, config)` 实参：ConfigSchema 全字段 volatile，`.get()` 读当前深只读快照。 */
export interface VolatileConfig {
  enabled: Volatile<boolean>;
  patchFile: Volatile<string>;
}

/** POST /create、/update 的 config 载荷（消毒后的规整形态；env/headers 值可能带 `js: ` 前缀） */
export interface NormalizedServerConfig {
  serverName: string;
  transport: McpTransport;
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
  url: string;
  headers: Record<string, string>;
  toolCallTimeoutMs: number | null;
  failOnStartupError: boolean | null;
  reconnect: unknown;
  /** 我们不认识的键（plain JSON），写入时原样落在 config 里 */
  extras: Record<string, unknown>;
}

/** 消毒时顺带收集的 `!!js` 标记点：如 'env.GITHUB_TOKEN' / 'headers.Authorization' */
export type JsMarkPaths = Set<string>;

export interface CreatePayload {
  config: unknown;
}

export interface UpdatePayload {
  id: string;
  config: unknown;
}

export interface TogglePayload {
  id: string;
  disabled: boolean;
}

export interface RemovePayload {
  id: string;
}

export interface ProbePayload {
  id: string;
}
