/**
 * 技能扫描与增删改查（零依赖，node:fs/promises）
 *
 * - 扫描语义对齐 dsh-skill-filesystem：根目录直接子项，目录包 `<name>/SKILL.md`
 *   或平铺文件 `<name>.md`；不递归更深层的子目录；点开头目录跳过（含 .system）。
 * - 遮蔽（shadow）规则对齐 dsh-skill registry：同名校验按 rank 升序取第一个赢家，
 *   其余标记 shadowedBy（组内比较：全局组 400/500，工作区组 100/200）。
 * - 写路径三重防护：SKILL_NAME_PATTERN 白名单 → entryPathFor 包含校验 →
 *   containedInRoot realpath 校验；只写根下的一级技能条目。
 *
 * @module @dshp/skill-manager
 */
import { cp, mkdir, readFile, readdir, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  findEntry,
  parseFrontmatter,
  parseFrontmatterBoolean,
  serializeFrontmatter,
  SKILL_NAME_PATTERN,
  upsertEntry,
  upsertPlainEntry,
  type FmEntry,
} from './frontmatter.js';
import { containedInRoot, dirExists, entryPathFor, ensureRoot } from './roots.js';
import type { RootInfo, SkillEntry } from './types.js';

/** 单个技能文件大小上限（防误读巨型文件拖垮 payload） */
const MAX_SKILL_BYTES = 256 * 1024;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** stat 探测：不存在返回 null，其余错误抛出 */
async function statOrNull(path: string): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(path);
  } catch (e) {
    if (isRecord(e) && (e as { code?: unknown }).code === 'ENOENT') return null;
    throw e;
  }
}

/** 从解析结果提取受控元数据；失败返回 problem（不抛） */
function metaOf(entries: FmEntry[]): {
  name: string;
  description: string;
  whenToUse: string;
  modelInvocable: boolean;
  userInvocable: boolean;
  problem: string;
} {
  const name = str(findEntry(entries, 'name')?.value).trim();
  const description = str(findEntry(entries, 'description')?.value).trim();
  const whenToUse = str(findEntry(entries, 'whenToUse')?.value).trim();
  if (!name || !description) {
    return {
      name,
      description,
      whenToUse,
      modelInvocable: true,
      userInvocable: true,
      problem: 'frontmatter 缺少 name 或 description',
    };
  }
  if (!SKILL_NAME_PATTERN.test(name)) {
    return {
      name,
      description,
      whenToUse,
      modelInvocable: true,
      userInvocable: true,
      problem: `name "${name.slice(0, 60)}" 不符合 kebab-case 规范`,
    };
  }
  try {
    const disableModel = parseFrontmatterBoolean(findEntry(entries, 'disable-model-invocation')?.value);
    const userInv = parseFrontmatterBoolean(findEntry(entries, 'user-invocable')?.value);
    return {
      name,
      description,
      whenToUse,
      modelInvocable: disableModel !== true,
      userInvocable: userInv !== false,
      problem: '',
    };
  } catch (e) {
    return {
      name,
      description,
      whenToUse,
      modelInvocable: true,
      userInvocable: true,
      problem: '调用开关布尔值非法：' + String((e as Error)?.message ?? e).slice(0, 120),
    };
  }
}

/** 扫描单个根，产出条目（根不存在 → 空数组） */
export async function scanRoot(root: RootInfo): Promise<SkillEntry[]> {
  if (!(await dirExists(root.path))) return [];
  const dirents = await readdir(root.path, { withFileTypes: true });
  const out: SkillEntry[] = [];
  for (const de of dirents) {
    const dirName = de.name;
    if (dirName.startsWith('.')) continue;
    let kind: 'bundle' | 'flat';
    let entryPath: string;
    if (de.isDirectory()) {
      entryPath = join(root.path, dirName, 'SKILL.md');
      kind = 'bundle';
    } else if (de.isFile() && dirName.endsWith('.md')) {
      entryPath = join(root.path, dirName);
      kind = 'flat';
    } else {
      continue;
    }
    const base: SkillEntry = {
      rootId: root.id,
      name: kind === 'flat' ? dirName.slice(0, -3) : dirName,
      dirName,
      kind,
      description: '',
      whenToUse: '',
      modelInvocable: true,
      userInvocable: true,
      scope: root.scope,
      workspace: root.workspace,
      entryPath,
      valid: false,
      problem: '',
      shadowedBy: '',
    };
    let text: string;
    try {
      const st = await stat(entryPath);
      if (!st.isFile() || st.size > MAX_SKILL_BYTES) {
        base.problem = st.isFile()
          ? `SKILL.md 超过 ${Math.floor(MAX_SKILL_BYTES / 1024)}KB，拒绝读取`
          : 'SKILL.md 不是普通文件';
        out.push(base);
        continue;
      }
      text = await readFile(entryPath, 'utf8');
    } catch {
      base.problem = kind === 'bundle' ? '目录里没有 SKILL.md' : '文件读取失败';
      out.push(base);
      continue;
    }
    const parsed = parseFrontmatter(text);
    if (!parsed) {
      base.problem = '缺少 YAML frontmatter（文件需以 --- 开头）';
      out.push(base);
      continue;
    }
    const meta = metaOf(parsed.entries);
    base.name = meta.name || base.name;
    base.description = meta.description;
    base.whenToUse = meta.whenToUse;
    base.modelInvocable = meta.modelInvocable;
    base.userInvocable = meta.userInvocable;
    base.valid = meta.problem === '';
    base.problem = meta.problem;
    out.push(base);
  }
  out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return out;
}

/** 组内遮蔽标记：同名按 rank 取赢家（同 rank 按传入顺序），输家记 shadowedBy */
export function markShadows(entries: SkillEntry[], rankOf: (rootId: string) => number): void {
  const winners = new Map<string, SkillEntry>();
  for (const e of entries) {
    e.shadowedBy = '';
    const cur = winners.get(e.name);
    if (!cur || rankOf(e.rootId) < rankOf(cur.rootId)) winners.set(e.name, e);
  }
  for (const e of entries) {
    const w = winners.get(e.name);
    if (w && w !== e) e.shadowedBy = w.rootId;
  }
}

/** 在一个根里按 frontmatter name（或目录名兜底）找条目 */
export async function findSkill(root: RootInfo, name: string): Promise<SkillEntry | undefined> {
  const list = await scanRoot(root);
  return list.find((e) => e.name === name) ?? list.find((e) => e.dirName === name);
}

export interface ReadResult {
  entries: FmEntry[];
  body: string;
  entry: SkillEntry;
}

/** 读取技能全文（frontmatter 结构 + 正文），供编辑器回填 */
export async function readSkill(root: RootInfo, name: string): Promise<ReadResult> {
  const entry = await findSkill(root, name);
  if (!entry) throw new Error(`技能 "${name}" 在 ${root.label} 中不存在`);
  // 条目名安全校验：flat 的 dirName 带 .md 后缀，按 kind 还原裸名再过 kebab-case
  const bareName = entry.kind === 'flat' ? entry.dirName.slice(0, -3) : entry.dirName;
  if (!SKILL_NAME_PATTERN.test(bareName) || !entryPathFor(root, bareName, entry.kind)) {
    throw new Error(`技能条目名 "${entry.dirName.slice(0, 60)}" 不是合法 kebab-case，无法通过管理器修改`);
  }
  const text = await readFile(entry.entryPath, 'utf8');
  const parsed = parseFrontmatter(text);
  if (!parsed) throw new Error('文件没有 YAML frontmatter，无法通过管理器编辑（请手工处理）');
  return { entries: parsed.entries, body: parsed.body, entry };
}

/** 新建技能：bundle（<name>/SKILL.md）或 flat（<name>.md） */
export async function createSkill(
  root: RootInfo,
  meta: { name: string; description: string; whenToUse: string; body: string; kind: 'bundle' | 'flat' },
): Promise<void> {
  if (!SKILL_NAME_PATTERN.test(meta.name)) {
    throw new Error(
      `技能名 "${meta.name.slice(0, 60)}" 非法：需为小写字母/数字开头的小写 kebab-case（字母、数字、连字符）`,
    );
  }
  if (!meta.description.trim()) throw new Error('description 不能为空：技能目录里的 summary 靠它被模型检索');
  const entries: FmEntry[] = [];
  const seeded = upsertEntry(upsertEntry(entries, 'name', meta.name), 'description', meta.description.trim());
  const finalEntries = meta.whenToUse.trim()
    ? upsertEntry(seeded, 'whenToUse', meta.whenToUse.trim())
    : seeded;
  const content = serializeFrontmatter(finalEntries, meta.body);
  const dirTarget = join(root.path, meta.name);
  if (meta.kind === 'flat') {
    const target = entryPathFor(root, meta.name, 'flat');
    if (!target) throw new Error('目标路径非法（名字未通过安全校验）');
    if (await statOrNull(target)) throw new Error(`技能 "${meta.name}" 已存在于 ${root.label}，不能重复创建`);
    await ensureRoot(root);
    await writeFile(target, content, 'utf8');
    return;
  }
  const skillMd = entryPathFor(root, meta.name, 'bundle');
  if (!skillMd) throw new Error('目标路径非法（名字未通过安全校验）');
  if (await statOrNull(dirTarget))
    throw new Error(`目录 "${meta.name}" 已存在于 ${root.label}，不能重复创建`);
  await ensureRoot(root);
  await mkdir(dirTarget, { recursive: true });
  await writeFile(skillMd, content, 'utf8');
}

/** 更新受控字段 / 正文（键缺省 = 不改；whenToUse 置空 = 删除该键） */
export async function updateSkill(
  root: RootInfo,
  name: string,
  patch: { description?: string; whenToUse?: string; body?: string },
): Promise<void> {
  const res = await readSkill(root, name);
  let entries = res.entries;
  let body = res.body;
  if (typeof patch.description === 'string') {
    const d = patch.description.trim();
    if (!d) throw new Error('description 不能为空：技能目录里的 summary 靠它被模型检索');
    entries = upsertEntry(entries, 'description', d.slice(0, 500));
  }
  if (typeof patch.whenToUse === 'string') {
    const w = patch.whenToUse.trim().slice(0, 500);
    entries = w ? upsertEntry(entries, 'whenToUse', w) : entries.filter((e) => e.key !== 'whenToUse');
  }
  if (typeof patch.body === 'string') body = patch.body.slice(0, MAX_SKILL_BYTES);
  await writeFile(res.entry.entryPath, serializeFrontmatter(entries, body), 'utf8');
}

/**
 * 切换调用开关：允许（true）= 删键回默认；禁止（false）= 写显式 false 值。
 * field 'all' = 整个技能的启用/禁用（两个调用面一起切）。
 */
export async function toggleSkill(
  root: RootInfo,
  name: string,
  field: 'model' | 'user' | 'all',
  value: boolean,
): Promise<void> {
  const res = await readSkill(root, name);
  let entries = res.entries;
  if (field === 'all') {
    entries = value
      ? entries.filter((e) => e.key !== 'disable-model-invocation' && e.key !== 'user-invocable')
      : upsertPlainEntry(
          upsertPlainEntry(entries, 'disable-model-invocation', 'true'),
          'user-invocable',
          'false',
        );
  } else if (field === 'model') {
    entries = value
      ? entries.filter((e) => e.key !== 'disable-model-invocation')
      : upsertPlainEntry(entries, 'disable-model-invocation', 'true');
  } else {
    entries = value
      ? entries.filter((e) => e.key !== 'user-invocable')
      : upsertPlainEntry(entries, 'user-invocable', 'false');
  }
  await writeFile(res.entry.entryPath, serializeFrontmatter(entries, res.body), 'utf8');
}

/** 删除技能（bundle 整目录 / flat 单文件）；只动根下一级条目 */
export async function removeSkill(root: RootInfo, name: string): Promise<void> {
  const res = await readSkill(root, name);
  const target = res.entry.kind === 'bundle' ? join(root.path, res.entry.dirName) : res.entry.entryPath;
  const ok = await containedInRoot(root.path, target);
  if (!ok) throw new Error('目标路径越出技能根目录，已拒绝删除');
  if (res.entry.kind === 'bundle') await rm(target, { recursive: true, force: false });
  else await unlink(target);
}

/** 复制 / 移动 / 改名一体：从 fromRoot 的 fromName 到 toRoot 的 toName */
export async function transferSkill(
  fromRoot: RootInfo,
  fromName: string,
  toRoot: RootInfo,
  toName: string,
  deleteSource: boolean,
): Promise<void> {
  const res = await readSkill(fromRoot, fromName);
  const targetName = toName || res.entry.name;
  if (!SKILL_NAME_PATTERN.test(targetName)) {
    throw new Error(`目标技能名 "${targetName.slice(0, 60)}" 非法：需为小写 kebab-case`);
  }
  // 同根同名目录：只是修正 frontmatter name（如历史技能名字不合规），原地改写即可
  if (fromRoot.id === toRoot.id && res.entry.dirName === targetName) {
    const text = await readFile(res.entry.entryPath, 'utf8');
    const parsed = parseFrontmatter(text);
    if (parsed) {
      const entries = upsertEntry(parsed.entries, 'name', targetName);
      await writeFile(res.entry.entryPath, serializeFrontmatter(entries, parsed.body), 'utf8');
    }
    return;
  }
  await ensureRoot(toRoot);
  if (res.entry.kind === 'bundle') {
    const src = join(fromRoot.path, res.entry.dirName);
    const dst = join(toRoot.path, targetName);
    const dstSkillMd = entryPathFor(toRoot, targetName, 'bundle');
    if (!dstSkillMd) throw new Error('目标路径非法（名字未通过安全校验）');
    if (await statOrNull(dst)) throw new Error(`目标目录 "${targetName}" 已存在于 ${toRoot.label}`);
    await cp(src, dst, { recursive: true, errorOnExist: true });
    if (targetName !== res.entry.name) {
      // 目录名变了 → 同步改写 frontmatter 的 name（技能身份）
      const text = await readFile(dstSkillMd, 'utf8');
      const parsed = parseFrontmatter(text);
      if (parsed) {
        const entries = upsertEntry(parsed.entries, 'name', targetName);
        await writeFile(dstSkillMd, serializeFrontmatter(entries, parsed.body), 'utf8');
      }
    }
  } else {
    const dstFile = entryPathFor(toRoot, targetName, 'flat');
    if (!dstFile) throw new Error('目标路径非法（名字未通过安全校验）');
    if (await statOrNull(dstFile)) throw new Error(`目标文件 "${targetName}.md" 已存在于 ${toRoot.label}`);
    const text = await readFile(res.entry.entryPath, 'utf8');
    const parsed = parseFrontmatter(text);
    const content = parsed
      ? serializeFrontmatter(
          targetName !== res.entry.name ? upsertEntry(parsed.entries, 'name', targetName) : parsed.entries,
          parsed.body,
        )
      : text;
    await writeFile(dstFile, content, 'utf8');
  }
  if (deleteSource) await removeSkill(fromRoot, fromName);
}
