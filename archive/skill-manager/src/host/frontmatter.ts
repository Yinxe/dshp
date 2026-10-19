/**
 * SKILL.md YAML frontmatter 的最小解析 / 序列化（零依赖）
 *
 * 设计约束：
 *  - dsh-skill-filesystem 用完整 `yaml` 包解析；这里只覆盖技能文件实际用到的子集
 *    （单行 plain / 单引号 / 双引号 / 块标量 / 嵌套映射），解析不了的键一律**原样保留**
 *    （kind 'raw'），重写文件时不丢注释与未知字段。
 *  - 重写受控字段（name/description/whenToUse/两个调用开关）时统一输出 YAML 双引号
 *    标量：转义以 JSON 兼容子集手写（\n \" \\ \uXXXX），可直接被 `yaml` 包读回。
 *  - 调用开关的布尔语法（true/yes/on/1 …）照抄 dsh-skill-filesystem 的
 *    frontmatterBoolean 严格文法。
 *  - 正则匹配一律用 String.prototype.match（不用 RegExp.exec，避免与进程执行同名混淆）。
 *
 * @module @dshp/skill-manager
 */

/** 技能名文法：与 @deepseek-ai/dsh-skill 的 SKILL_NAME 完全一致（也天然防路径穿越） */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** frontmatter 中的一个顶层键 */
export interface FmEntry {
  key: string;
  /** 原样保留的行（含 key 行与续行）；重写未知字段时逐行回写 */
  raw: string[];
  /**
   * plain：单行裸值（可安全重写）；quoted：引号值（可安全重写）；
   * block：块标量/嵌套映射（可重写为引号值）；raw：多行续行等复杂形态（仅解析展示）
   */
  kind: 'plain' | 'quoted' | 'block' | 'raw';
  /** 解析出的标量值；raw 形态为折叠后的近似展示值 */
  value: string;
}

export interface ParsedSkillFile {
  entries: FmEntry[];
  body: string;
}

const ENTRY_START = /^[A-Za-z][A-Za-z0-9_-]*:[ \t]?(.*)$/;
const ENTRY_KEY = /^([A-Za-z][A-Za-z0-9_-]*):/;
const ENTRY_REST = /^[A-Za-z][A-Za-z0-9_-]*:[ \t]?(.*)$/;
const INDENT = /^[ \t]*/;
const DOUBLE_QUOTED = /^"((?:[^"\\]|\\.)*)"/;
const SINGLE_QUOTED = /^'((?:[^']|'')*)'/;
const TRAILING_COMMENT = /^(.*?)(?:[ \t]+#.*)?$/;

function isEntryStart(line: string): boolean {
  return ENTRY_START.test(line);
}

function entryKey(line: string): string {
  const m = line.match(ENTRY_KEY);
  return m && m[1] ? m[1] : '';
}

function entryRest(line: string): string {
  const m = line.match(ENTRY_REST);
  return m && m[1] ? m[1] : '';
}

function indentOf(line: string): number {
  const m = line.match(INDENT);
  return m && m[0] ? m[0].length : 0;
}

/** YAML 双引号标量的转义还原（JSON 兼容子集；未知转义原样保留） */
function unescapeDoubleQuoted(inner: string): string {
  let out = '';
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch !== '\\' || i + 1 >= inner.length) {
      out += ch;
      continue;
    }
    const nxt = inner[i + 1] as string;
    if (nxt === 'n') out += '\n';
    else if (nxt === 't') out += '\t';
    else if (nxt === 'r') out += '\r';
    else if (nxt === 'b') out += '\b';
    else if (nxt === 'f') out += '\f';
    else if (nxt === '/') out += '/';
    else if (nxt === 'u' && i + 5 < inner.length) {
      const hex = inner.slice(i + 2, i + 6);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else {
        out += ch;
      }
    } else {
      out += nxt;
    }
    i += 1;
  }
  return out;
}

/** 解析双引号 YAML 标量（容忍尾注释） */
function parseDoubleQuoted(rest: string): string | undefined {
  const m = rest.match(DOUBLE_QUOTED);
  if (!m || !m[1]) return undefined;
  return unescapeDoubleQuoted(m[1]);
}

/** 解析单引号 YAML 标量（'' 转义为 '；容忍尾注释） */
function parseSingleQuoted(rest: string): string | undefined {
  const m = rest.match(SINGLE_QUOTED);
  if (!m || !m[1]) return undefined;
  return m[1].replace(/''/g, "'");
}

/** plain 标量去尾注释（YAML 规则：空格 + # 之后全为注释） */
function stripComment(value: string): string {
  const m = value.match(TRAILING_COMMENT);
  return m && m[1] !== undefined ? m[1] : value;
}

/**
 * 解析 SKILL.md 的 frontmatter。返回 null 表示没有合法的 `---` 围栏。
 * 不抛错：解析不了的行原样收进 raw。
 */
export function parseFrontmatter(source: string): ParsedSkillFile | null {
  const normalized = source.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
  const lines = normalized.split('\n');
  let i = 0;
  while (i < lines.length && lines[i] !== undefined && (lines[i] as string).trim() === '') i += 1;
  const first = i < lines.length ? (lines[i] as string) : '';
  if (first.trim() !== '---') return null;
  i += 1;

  const entries: FmEntry[] = [];
  let closed = false;
  while (i < lines.length) {
    const line = lines[i] as string;
    if (line.trim() === '---' || line.trim() === '...') {
      closed = true;
      i += 1;
      break;
    }
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    if (!isEntryStart(line)) {
      // 围栏内的游离行：挂到上一个条目（或独立 raw 条目），原样保留
      const last = entries[entries.length - 1];
      if (last) last.raw.push(line);
      else entries.push({ key: '', raw: [line], kind: 'raw', value: '' });
      i += 1;
      continue;
    }
    const key = entryKey(line);
    const rest = entryRest(line);
    const raw: string[] = [line];
    i += 1;
    const restTrim = rest.trim();

    if (restTrim === '' || restTrim.startsWith('|') || restTrim.startsWith('>')) {
      // 块标量或嵌套结构：收集更深的续行
      const baseIndent = indentOf(line);
      while (i < lines.length) {
        const nxt = lines[i] as string;
        if (nxt.trim() === '') {
          raw.push(nxt);
          i += 1;
          continue;
        }
        if (indentOf(nxt) <= baseIndent) break;
        raw.push(nxt);
        i += 1;
      }
      const folded = raw
        .slice(1)
        .map((l) => l.trim())
        .filter((l) => l !== '')
        .join(' ');
      entries.push({ key, raw, kind: 'block', value: folded });
      continue;
    }

    if (restTrim.startsWith('"')) {
      const v = parseDoubleQuoted(restTrim);
      if (v !== undefined) {
        entries.push({ key, raw, kind: 'quoted', value: v });
        continue;
      }
    }
    if (restTrim.startsWith("'")) {
      const v = parseSingleQuoted(restTrim);
      if (v !== undefined) {
        entries.push({ key, raw, kind: 'quoted', value: v });
        continue;
      }
    }
    // plain：可能带多行续行（更缩进的行折叠进值，但标记 raw 不可安全重写）
    const baseIndent = indentOf(line);
    while (i < lines.length) {
      const nxt = lines[i] as string;
      if (nxt.trim() === '' || indentOf(nxt) <= baseIndent) break;
      if (isEntryStart(nxt.trim())) break;
      raw.push(nxt);
      i += 1;
    }
    if (raw.length > 1) {
      const folded = raw
        .map((l) => stripComment(l).trim())
        .filter((l) => l !== '' && !/^[A-Za-z][A-Za-z0-9_-]*:/.test(l))
        .join(' ');
      entries.push({ key, raw, kind: 'raw', value: folded });
      continue;
    }
    entries.push({ key, raw, kind: 'plain', value: stripComment(restTrim) });
  }

  const body = closed ? lines.slice(i).join('\n') : '';
  return { entries, body };
}

/** YAML 双引号标量的转义（JSON 兼容子集，yaml 包可直接读回） */
export function quoteYamlScalar(value: string): string {
  let out = '"';
  for (const ch of value) {
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\r') out += '\\r';
    else out += ch;
  }
  return out + '"';
}

/** 序列化：plain 键输出裸值（布尔开关用），quoted 键输出双引号标量，未知键原样回写 */
export function serializeFrontmatter(entries: FmEntry[], body: string): string {
  const out: string[] = ['---'];
  for (const entry of entries) {
    if (!entry.key || entry.kind === 'raw') {
      out.push(...entry.raw);
      continue;
    }
    if (entry.kind === 'plain') {
      out.push(entry.key + ': ' + entry.value);
      continue;
    }
    out.push(entry.key + ': ' + quoteYamlScalar(entry.value));
  }
  out.push('---');
  const bodyPart = body.startsWith('\n') || body === '' ? body : '\n' + body;
  return out.join('\n') + '\n' + bodyPart.replace(/\n*$/, '\n');
}

function upsertWithKind(entries: FmEntry[], key: string, value: string, kind: 'quoted' | 'plain'): FmEntry[] {
  const next: FmEntry[] = entries.map((e) => (e.key === key ? { ...e, kind, value } : e));
  if (!next.some((e) => e.key === key)) next.push({ key, raw: [], kind, value });
  return next;
}

/** 把 entries 里某个键设为给定引号标量值（存在则原位替换，不存在则追加） */
export function upsertEntry(entries: FmEntry[], key: string, value: string): FmEntry[] {
  return upsertWithKind(entries, key, value, 'quoted');
}

/** 同 upsertEntry，但输出裸值（YAML 布尔开关用，如 disable-model-invocation: true） */
export function upsertPlainEntry(entries: FmEntry[], key: string, value: string): FmEntry[] {
  return upsertWithKind(entries, key, value, 'plain');
}

/** 按 key 取标量值（raw/block 也可读，仅展示用） */
export function findEntry(entries: FmEntry[], key: string): FmEntry | undefined {
  return entries.find((e) => e.key === key);
}

const BOOL_TRUE = new Set(['true', 'yes', 'on', '1']);
const BOOL_FALSE = new Set(['false', 'no', 'off', '0']);

/**
 * 调用开关的严格布尔文法：照抄 dsh-skill-filesystem frontmatterBoolean ——
 * true/yes/on/1（不区分大小写）→ true；false/no/off/0 → false；其余 throw。
 * 缺省（undefined）= 允许该 surface。
 */
export function parseFrontmatterBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const value = raw.trim().toLowerCase();
  if (BOOL_TRUE.has(value)) return true;
  if (BOOL_FALSE.has(value)) return false;
  throw new TypeError(`frontmatter boolean "${raw}" is not one of true/false/yes/no/on/off/1/0`);
}
