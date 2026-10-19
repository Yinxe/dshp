/**
 * 技能根目录解析：全局根 + 工作区根（对齐 @deepseek-ai/dsh-skill-filesystem 的
 * 默认 roots 与 rank：project-dsh 100 / project-agents 200 / user-dsh 400 / user-agents 500）
 *
 * - 全局（user）根：<dshHome>/skills、<agentsHome>/skills（环境变量解析规则同 provider）
 * - 工作区（project）根：workspaceRegistry 里登记的目录 + 配置的 workspaceRoot
 *   （可选服务，缺了就回退进程 cwd），各自派生 .dsh/skills 与 .agents/skills
 * - 路径安全：技能名受 SKILL_NAME_PATTERN 约束（无 / \ .. 前导点），再叠加
 *   realpath 包含校验，双重防穿越
 *
 * @module @dshp/skill-manager
 */
import { existsSync } from 'node:fs';
import { mkdir, realpath, readdir } from 'node:fs/promises';
import { basename, isAbsolute, join, resolve, sep } from 'node:path';
import { defaultAgentsHome, defaultDshHome } from './config.js';
import { SKILL_NAME_PATTERN } from './frontmatter.js';
import type { AnyCtx, RootInfo, SkillEntry } from './types.js';

/** workspaceRegistry 候选工作区数量上限（payload 防膨胀） */
const MAX_WORKSPACES = 20;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 枚举候选工作区：registry 优先，配置的 workspaceRoot 次之，最后兜底进程 cwd */
export function listWorkspaces(ctx: AnyCtx, configuredRoot: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (p: unknown): void => {
    if (typeof p !== 'string' || !p || !isAbsolute(p)) return;
    const abs = resolve(p);
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push(abs);
  };
  try {
    const reg = ctx.get('workspaceRegistry') as AnyCtx;
    if (reg && typeof reg.list === 'function') {
      const list = reg.list() as unknown;
      if (Array.isArray(list)) {
        for (const w of list) {
          if (isRecord(w)) push((w as { path?: unknown }).path);
          else push(w);
          if (out.length >= MAX_WORKSPACES) break;
        }
      }
    }
  } catch {
    /* registry 不可用就走兜底 */
  }
  if (configuredRoot) push(configuredRoot);
  if (out.length === 0) push(process.cwd());
  return out;
}

/**
 * 工作区根 → 两个 project 技能根（rank 与 provider 一致：.dsh 100 / .agents 200）。
 * `.agents/skills` 是默认规范目录，排序在 .dsh 之前（rank 不变，只影响展示与默认选中）。
 */
function workspaceRoots(workspace: string, startIdx: number): RootInfo[] {
  const idx = String(startIdx).padStart(2, '0');
  const name = basename(workspace) || workspace;
  const mk = (suffix: 'dsh' | 'agents', rank: number): RootInfo => {
    const path = join(workspace, '.' + suffix, 'skills');
    return {
      id: 'ws-' + idx + '-' + suffix,
      label: '工作区 ' + name + ' · .' + suffix + '/skills',
      scope: 'workspace',
      workspace,
      path,
      rank,
      exists: existsSync(path),
    };
  };
  return [mk('agents', 200), mk('dsh', 100)];
}

/** 解析全部可管理根：全局两个 + 每个候选工作区两个（.agents 规范目录排前） */
export function listRoots(ctx: AnyCtx, configuredRoot: string): { roots: RootInfo[]; workspaces: string[] } {
  const workspaces = listWorkspaces(ctx, configuredRoot);
  const dshSkills = join(defaultDshHome(), 'skills');
  const agentsSkills = join(defaultAgentsHome(), 'skills');
  const roots: RootInfo[] = [
    {
      id: 'global-agents',
      label: '全局 · ~/.agents/skills（推荐）',
      scope: 'global',
      workspace: '',
      path: agentsSkills,
      rank: 500,
      exists: existsSync(agentsSkills),
    },
    {
      id: 'global-dsh',
      label: '全局 · ~/.dsh/skills',
      scope: 'global',
      workspace: '',
      path: dshSkills,
      rank: 400,
      exists: existsSync(dshSkills),
    },
  ];
  let wsIdx = 1;
  for (const ws of workspaces) {
    roots.push(...workspaceRoots(ws, wsIdx));
    wsIdx += 1;
  }
  return { roots, workspaces };
}

/** 按 rootId 找根（id 由本插件生成、不含用户输入，仍做白名单匹配） */
export function findRoot(roots: RootInfo[], rootId: unknown): RootInfo | undefined {
  if (typeof rootId !== 'string' || !rootId) return undefined;
  return roots.find((r) => r.id === rootId);
}

/**
 * 计算技能条目路径（bundle → <root>/<dirName>/SKILL.md；flat → <root>/<dirName>.md）。
 * 名字已过 SKILL_NAME_PATTERN；这里再做一次包含校验，返回 null 表示非法。
 */
export function entryPathFor(root: RootInfo, dirName: string, kind: 'bundle' | 'flat'): string | null {
  if (!SKILL_NAME_PATTERN.test(dirName)) return null;
  const target = kind === 'bundle' ? join(root.path, dirName, 'SKILL.md') : join(root.path, dirName + '.md');
  const rootAbs = resolve(root.path);
  const targetAbs = resolve(target);
  if (targetAbs !== rootAbs && !targetAbs.startsWith(rootAbs + sep)) return null;
  return targetAbs;
}

/** 确保根目录存在（创建技能前调用；只 mkdir 本插件定义的根） */
export async function ensureRoot(root: RootInfo): Promise<void> {
  if (!isAbsolute(root.path)) throw new Error('技能根目录路径非法：' + String(root.path).slice(0, 200));
  await mkdir(root.path, { recursive: true });
}

/** 目录是否已存在（供扫描跳过不存在的根） */
export async function dirExists(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path);
    return Array.isArray(entries);
  } catch {
    return false;
  }
}

/** realpath 包含校验：entry 的真实路径必须仍落在根的真实路径内（防符号链接逃逸） */
export async function containedInRoot(rootPath: string, entryDir: string): Promise<boolean> {
  try {
    const [realRoot, realEntry] = await Promise.all([realpath(rootPath), realpath(entryDir)]);
    return realEntry === realRoot || realEntry.startsWith(realRoot + sep);
  } catch {
    return false;
  }
}

/** 从扫描条目提取瘦身后的 owned copy（路由载荷不携带文件内容） */
export function toPayloadEntry(entry: SkillEntry): SkillEntry {
  return {
    rootId: entry.rootId,
    name: entry.name.slice(0, 120),
    dirName: entry.dirName.slice(0, 120),
    kind: entry.kind,
    description: entry.description.slice(0, 500),
    whenToUse: entry.whenToUse.slice(0, 500),
    modelInvocable: entry.modelInvocable,
    userInvocable: entry.userInvocable,
    scope: entry.scope,
    workspace: entry.workspace,
    entryPath: entry.entryPath,
    valid: entry.valid,
    problem: entry.problem.slice(0, 300),
    shadowedBy: entry.shadowedBy,
  };
}
