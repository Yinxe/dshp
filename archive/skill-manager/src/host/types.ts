/**
 * @dshp/skill-manager —— 共享类型定义（Host 半）
 *
 * DSH 运行时（Cordis ctx / settings / webServer / slots）暂无官方 npm 类型包，
 * Host 侧统一用 `AnyCtx`（= any 的别名）透传，仅对本插件自有的数据结构做严格建模。
 * 客户端协议类型见 src/client/types.ts（与这里的路由载荷保持对齐）。
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

/** DSH 运行时 ctx —— 暂无官方类型，透传 any */
export type AnyCtx = any;

/** 技能所在根目录的来源（与 @deepseek-ai/dsh-skill-filesystem 的 rank 对齐） */
export type RootScope = 'global' | 'workspace';

export interface RootInfo {
  /** 稳定 id：global-dsh / global-agents / ws-<序号>-dsh / ws-<序号>-agents */
  id: string;
  /** 展示名（中文） */
  label: string;
  scope: RootScope;
  /** workspace 根目录；全局根为 '' */
  workspace: string;
  /** 根目录绝对路径（join 出来的目标目录，不一定已存在） */
  path: string;
  /** 对应 dsh-skill-filesystem 的 rank：100/200/400/500 */
  rank: number;
  /** 目录当前是否存在 */
  exists: boolean;
}

/** 扫描出的单个技能条目（owned copy，只含展示与管理所需字段） */
export interface SkillEntry {
  rootId: string;
  /** frontmatter name（技能身份，kebab-case） */
  name: string;
  /** 目录名 / 平铺文件名（通常与 name 一致） */
  dirName: string;
  kind: 'bundle' | 'flat';
  description: string;
  whenToUse: string;
  modelInvocable: boolean;
  userInvocable: boolean;
  scope: RootScope;
  workspace: string;
  /** SKILL.md（bundle）或 <name>.md（flat）的绝对路径 */
  entryPath: string;
  /** 解析是否成功；false 时 problem 说明原因 */
  valid: boolean;
  problem: string;
  /** 被同名更高优先级技能遮蔽时，填赢家的 rootId，否则 '' */
  shadowedBy: string;
}

/** GET state 响应载荷 */
export interface SkillState {
  enabled: boolean;
  dshHome: string;
  agentsHome: string;
  roots: RootInfo[];
  skills: SkillEntry[];
  /** workspaceRegistry + 配置的 workspaceRoot 去重后的候选工作区 */
  workspaces: string[];
  workspaceRoot: string;
}

/** 插件自身配置（profile 条目 `config:` 的 dshp-skill-manager 分节，0.1.7 起替代 settings.yaml） */
export interface PluginConfig {
  enabled: boolean;
  /** 额外/兜底工作区根目录；空串 = 只用 workspaceRegistry（再兜底进程 cwd） */
  workspaceRoot: string;
}

/** `apply(ctx, config)` 实参：ConfigSchema 全字段 volatile，`.get()` 读当前深只读快照。 */
export interface VolatileConfig {
  enabled: Volatile<boolean>;
  workspaceRoot: Volatile<string>;
}

/** frontmatter 解析后的受控字段 */
export interface SkillMeta {
  name: string;
  description: string;
  whenToUse: string;
  modelInvocable: boolean;
  userInvocable: boolean;
}

/** POST create 参数（消毒前） */
export interface CreateArgs {
  rootId?: unknown;
  name?: unknown;
  description?: unknown;
  whenToUse?: unknown;
  body?: unknown;
  kind?: unknown;
}

/** POST update 参数（消毒前） */
export interface UpdateArgs {
  rootId?: unknown;
  name?: unknown;
  description?: unknown;
  whenToUse?: unknown;
  body?: unknown;
}

/** POST toggle 参数（消毒前） */
export interface ToggleArgs {
  rootId?: unknown;
  name?: unknown;
  field?: unknown;
  value?: unknown;
}

/** POST transfer 参数（消毒前）：复制/移动/改名一体 */
export interface TransferArgs {
  fromRootId?: unknown;
  fromName?: unknown;
  toRootId?: unknown;
  toName?: unknown;
  deleteSource?: unknown;
}
