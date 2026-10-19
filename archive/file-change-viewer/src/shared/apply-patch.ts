/**
 * `*** Begin Patch` 补丁的解析与应用 —— 纯函数，Host / Client 两份产物都会内联它
 *
 * 为什么放在 `src/shared/`：Host 半要用它**落盘**（`patch` 工具），Client 半要用它**预览**
 * （流式生成时 args 里的补丁文本 → 这次打算改什么）。同一个解析器两处共用，才不会出现
 * 「模型看到的预览」与「真正写进去的内容」对不上的情况。
 *
 * ## 格式从哪来
 *
 * 这套语法是 opencode `apply_patch` 用的（也就是 Codex 的补丁语言），**不是** `patch(1)` 的
 * unified diff。选它的理由：
 *
 * - **不写行号**：片段靠自己的上下文内容定位，模型不必数行、也不会因为 `@@ -12,3` 里的数字
 *   估错而失败（unified diff 的老毛病）；
 * - **四级模糊回退**：精确 → 去尾空格 → 两端 trim → Unicode 标点归一。模型抄上下文时多了个
 *   尾随空格、把弯引号写成直引号，照样能对上；
 * - **一次调用覆盖多文件多片段**：Add / Delete / Update（+ `Move to`）在一个信封里组合——
 *   这正是 `patch` 相对 `write`（整份重写）与 `edit`（一处字面替换）的价值。
 *
 * ## 语法
 *
 * ```
 * *** Begin Patch
 * *** Add File: hello.txt          新建：后面每行都是 + 行（原样成为内容）
 * +Hello world
 * *** Update File: src/app.py     改已有文件
 * *** Move to: src/main.py        可选：顺带改名 / 移动
 * @@ def greet():                 可选：锚点，用来消歧「这段到底在哪」
 * -print("Hi")                    行首 -：删除行
 * +print("Hello, world!")         行首 +：新增行
 *  context                        行首空格：上下文行（两侧都有）
 * *** End of File                 可选：把这个片段钉在文件尾部
 * *** Delete File: obsolete.txt   删除：后面什么都不跟
 * *** End Patch
 * ```
 *
 * 三个容易踩的点（都**照抄** opencode 的行为，不自己发明）：
 *
 * 1. 片段里**只有 `+` 行**（没有上下文、没有删除）时，内容**追加到文件末尾**，不是插到锚点处；
 * 2. 应用后**保证文件以换行结尾**——原本末尾没有换行的文件，改一处也会被补上一个 `\n`；
 * 3. 片段里既不以上述三种标记开头、也不是 `***` 的行（**包括空行**）一律忽略，所以「同一片段里
 *    夹一个空行」不会把片段切成两个。
 *
 * 不支持：二进制补丁。删除 / 改名**在解析层认识**（`*** Delete File:` / `*** Move to:` 会被读出来，
 * 预览也画得出来），但 **Host 半明确拒绝执行**——删除不可逆，改名会动到另一个路径，这两件事在 DSH
 * 里本来就有官方出口（`bash` 的 `rm` / `mv`，同样吃沙箱策略）。解析层留着它们，是为了让模型真写出来
 * 时得到的是一句能照做的中文说明，而不是一个含糊的格式错误。
 *
 * @module @dshp/file-change-viewer/shared/apply-patch
 */

/** 一个 `@@` 片段（update 段落里的一处改动）。 */
export interface PatchChunk {
  /** 旧侧行：上下文行 + 删除行，按出现顺序。 */
  oldLines: string[];
  /** 新侧行：上下文行 + 新增行，按出现顺序。 */
  newLines: string[];
  /** `@@` 后面的锚点文本；没有就是 undefined。 */
  context?: string | undefined;
  /** 带 `*** End of File`：优先从文件尾部开始找这段上下文。 */
  endOfFile?: boolean | undefined;
  /** 真正新增的行数（只数 `+` 行，不含上下文）——工具返回值与卡片统计用。 */
  added: number;
  /** 真正删除的行数（只数 `-` 行，不含上下文）。 */
  removed: number;
}

/** 一个文件段落。 */
export type PatchOp =
  | { type: 'add'; path: string; contents: string }
  | { type: 'delete'; path: string }
  | { type: 'update'; path: string; moveTo?: string | undefined; chunks: PatchChunk[] };

/** 解析选项。 */
export interface ParseOptions {
  /**
   * 宽容模式：流式生成时补丁文本可能是半截的（`*** End Patch` 还没流出来、最后一个片段只写了
   * 一半）。此时不因为缺收尾而报错，能解析出多少算多少——供 Client 半做**预览**，不用于落盘。
   */
  tolerant?: boolean | undefined;
}

/** 交给差异卡片的一处改动（与官方 `FileDiff` 同形，另有两个本插件扩展字段）。 */
export interface PatchDiff {
  /** 变更后的路径（改名时是新路径）。 */
  path: string;
  /** 改名 / 移动的源路径；不是改名就没有这个字段。客户端据此把卡头渲染成 `旧 → 新`。 */
  oldPath?: string | undefined;
  /** 旧侧原文（上下文 + 删除行）；纯新建为 null。 */
  oldText: string | null;
  /** 新侧原文（上下文 + 新增行）。 */
  newText: string;
  /** 这个片段落在**新文件**里的起始行号（1 起）——落盘后由 Host 半算出确切值。 */
  startLine?: number | undefined;
}

/** 一个片段应用后的结果（含它在文件里的真实落点）。 */
export interface AppliedChunk {
  /** 旧侧原文（上下文 + 删除行）。 */
  oldText: string;
  /** 新侧原文（上下文 + 新增行）；可能是空串。 */
  newText: string;
  /** 这个片段在新文件里的起始行号（1 起）。 */
  startLine: number;
}

/** 把一份 update 段落应用到当前内容上的结果。 */
export interface AppliedChunks {
  /** 应用后的完整内容（**LF 口径**，末尾保证有换行）。 */
  content: string;
  /** 每个片段的差异信息，顺序与补丁里的段落一致。 */
  chunks: AppliedChunk[];
}

// ── 解析 ────────────────────────────────────────────────────────────────────

const BEGIN_MARKER = '*** Begin Patch';
const END_MARKER = '*** End Patch';
const ADD_HEADER = '*** Add File:';
const DELETE_HEADER = '*** Delete File:';
const UPDATE_HEADER = '*** Update File:';
const MOVE_HEADER = '*** Move to:';
const END_OF_FILE = '*** End of File';

/** 去掉 `cat <<'EOF' … EOF` 外壳（被 shell 包起来的补丁照样能解析），与 opencode 同规则。 */
function stripHeredoc(input: string): string {
  const match = /^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/.exec(input);
  return match === null ? input : (match[2] as string);
}

/**
 * 看起来像 `patch(1)` / git 的 unified diff 吗（`--- a/…` 文件头 + `@@ -1,3 +1,3 @@` 小节）。
 *
 * 用来分辨「模型用错了格式」与「模型压根没写补丁」——真实会话里前者很常见（模型见过别的工具
 * 用 unified diff），而一句笼统的「格式不对」不足以让它改对。
 *
 * @param lines - 补丁文本的行。
 * @returns 像 unified diff 就是 true。
 */
function looksLikeUnifiedDiff(lines: readonly string[]): boolean {
  return lines.some((line) => line.startsWith('--- ') || line.startsWith('+++ ') || /^@@+ *-\d/.test(line));
}

/**
 * 信封有问题时，说清**具体**缺什么——不是一句笼统的「格式不对」。
 *
 * 真实会话里抓到过三种：① 只写了 `*** Begin Patch`（后面空的，多半是生成被截断）；② 有开头没结尾；
 * ③ 整段写成了 `patch(1)` 的 unified diff。三种的下一步完全不同，所以分开说。
 *
 * @param lines - 补丁文本的行。
 * @param beginAt - `*** Begin Patch` 所在行（-1 = 没有）。
 * @param endAt - `*** End Patch` 所在行（-1 = 没有）。
 * @returns 面向模型的中文提示。
 */
function describeEnvelopeProblem(lines: readonly string[], beginAt: number, endAt: number): string {
  if (beginAt >= 0 && endAt < 0) {
    const body = lines.slice(beginAt + 1).filter((line) => line.trim() !== '');
    if (body.length === 0) {
      return (
        'patch 是空的：你只写了 `*** Begin Patch`，里面没有任何段落。' +
        '把要改的每个文件写成一个段落再发一次：`*** Update File: 路径` / `*** Add File: 路径`，' +
        '每段里用 `@@` 开头，`-` 是旧行、`+` 是新行，最后以 `*** End Patch` 收尾。'
      );
    }
    return (
      'patch 缺收尾：没有找到 `*** End Patch`（补丁是不是被截断了？）。' +
      '信封必须以 `*** Begin Patch` 开头、以 `*** End Patch` 结束。'
    );
  }
  if (beginAt < 0 && endAt >= 0) {
    return 'patch 缺开头：有 `*** End Patch` 但没有 `*** Begin Patch`。信封必须两头都在。';
  }
  if (beginAt >= 0 && endAt >= 0 && beginAt >= endAt) {
    return 'patch 的顺序不对：`*** End Patch` 出现在 `*** Begin Patch` 之前。';
  }
  if (looksLikeUnifiedDiff(lines)) {
    return (
      'patch 格式不对：这看起来是 `patch(1)` / git 的 unified diff（`--- a/…` + `@@ -1,3 +1,3 @@`），' +
      '而本工具用的是 Codex 风格的 `*** Begin Patch` 信封，两者不能混用。改写成：\n' +
      '*** Begin Patch\n*** Update File: <路径>\n@@\n<上下文行（行首一个空格）>\n-<旧行>\n+<新行>\n*** End Patch\n' +
      '（行号不用写；`@@` 后面可以跟一行文件里真实存在的锚点。）如果只是想改一处小地方，用 edit 工具更省事。'
    );
  }
  return 'patch 格式不对：补丁必须包在 `*** Begin Patch` 与 `*** End Patch` 之间（格式说明见工具描述）。';
}

/** 收集一个 `*** Add File:` 段落的 `+` 行（到下一个 `***` 段头为止）。 */
function collectAddedLines(
  lines: readonly string[],
  start: number,
  end: number,
): { contents: string; next: number } {
  const body: string[] = [];
  let at = start;
  while (at < end) {
    const line = lines[at] as string;
    if (line.startsWith('***')) break;
    if (line.startsWith('+')) body.push(line.slice(1));
    at += 1;
  }
  return { contents: body.join('\n'), next: at };
}

/** 收集一个 update 段落里的全部 `@@` 片段。 */
function collectChunks(
  lines: readonly string[],
  start: number,
  end: number,
): { chunks: PatchChunk[]; next: number } {
  const chunks: PatchChunk[] = [];
  let at = start;
  while (at < end) {
    const line = lines[at] as string;
    if (line.startsWith('***')) break;
    if (!line.startsWith('@@')) {
      at += 1;
      continue;
    }
    const context = line.slice(2).trim();
    const oldLines: string[] = [];
    const newLines: string[] = [];
    let added = 0;
    let removed = 0;
    let endOfFile = false;
    at += 1;
    while (at < end) {
      const inner = lines[at] as string;
      if (inner === END_OF_FILE) {
        endOfFile = true;
        at += 1;
        break;
      }
      if (inner.startsWith('@@') || inner.startsWith('***')) break;
      const marker = inner.charAt(0);
      if (marker === ' ') {
        const text = inner.slice(1);
        oldLines.push(text);
        newLines.push(text);
      } else if (marker === '-') {
        oldLines.push(inner.slice(1));
        removed += 1;
      } else if (marker === '+') {
        newLines.push(inner.slice(1));
        added += 1;
      }
      // 其余（含空行）忽略：与 opencode 一致，见文件头注释第 3 点。
      at += 1;
    }
    const chunk: PatchChunk = { oldLines, newLines, added, removed };
    if (context !== '') chunk.context = context;
    if (endOfFile) chunk.endOfFile = true;
    chunks.push(chunk);
  }
  return { chunks, next: at };
}

/**
 * 解析一份 `*** Begin Patch` 补丁。
 *
 * @param text - 补丁文本；允许被 `cat <<'EOF'` 包着，也允许前后有说明文字。
 * @param options - `tolerant` 用于流式预览（缺收尾不报错）。
 * @returns 按出现顺序排列的文件段落；一个都没有时返回空数组。
 * @throws 非宽容模式下缺 `*** Begin/End Patch`、或 `*** End Patch` 在 `*** Begin Patch` 之前时抛错。
 */
export function parseApplyPatch(text: string, options: ParseOptions = {}): PatchOp[] {
  const tolerant = options.tolerant === true;
  const cleaned = stripHeredoc(text.replace(/\r\n/g, '\n').trim());
  const lines = cleaned.split('\n');

  const beginAt = lines.findIndex((line) => line.trim() === BEGIN_MARKER);
  const endAt = lines.findIndex((line) => line.trim() === END_MARKER);

  if ((beginAt < 0 || endAt < 0 || beginAt >= endAt) && !tolerant) {
    throw new Error(describeEnvelopeProblem(lines, beginAt, endAt));
  }

  const from = beginAt < 0 ? 0 : beginAt + 1;
  const to = endAt < 0 ? lines.length : Math.max(endAt, from);
  const ops: PatchOp[] = [];
  let at = from;

  while (at < to) {
    const line = lines[at] as string;
    if (line.startsWith(ADD_HEADER)) {
      const path = line.slice(ADD_HEADER.length).trim();
      if (path === '') {
        at += 1;
        continue;
      }
      const collected = collectAddedLines(lines, at + 1, to);
      ops.push({ type: 'add', path, contents: collected.contents });
      at = collected.next;
      continue;
    }
    if (line.startsWith(DELETE_HEADER)) {
      const path = line.slice(DELETE_HEADER.length).trim();
      if (path !== '') ops.push({ type: 'delete', path });
      at += 1;
      continue;
    }
    if (line.startsWith(UPDATE_HEADER)) {
      const path = line.slice(UPDATE_HEADER.length).trim();
      if (path === '') {
        at += 1;
        continue;
      }
      let next = at + 1;
      const moveLine = lines[next];
      let moveTo: string | undefined;
      if (moveLine !== undefined && moveLine.startsWith(MOVE_HEADER)) {
        const value = moveLine.slice(MOVE_HEADER.length).trim();
        if (value !== '') moveTo = value;
        next += 1;
      }
      const collected = collectChunks(lines, next, to);
      ops.push(
        moveTo === undefined
          ? { type: 'update', path, chunks: collected.chunks }
          : { type: 'update', path, moveTo, chunks: collected.chunks },
      );
      at = collected.next;
      continue;
    }
    at += 1;
  }

  return ops;
}

/**
 * 把解析结果摊平成「一处改动一条」的差异（供流式预览与 `presentCall`）。
 *
 * 这是**没有落盘信息**时的说法，所以：
 * - 新建文件给全 `+` 的内容；
 * - 删除给空差异（此刻还不知道要删的内容——结算后的 `meta.diffs` 会给真的）；
 * - 改名给新路径，并带上 `oldPath`，卡头因此能显示 `旧 → 新`。
 *
 * @param ops - 解析结果。
 * @returns 按出现顺序排列的差异。
 */
export function previewDiffsOf(ops: readonly PatchOp[]): PatchDiff[] {
  const out: PatchDiff[] = [];
  for (const op of ops) {
    if (op.type === 'add') {
      out.push({ path: op.path, oldText: null, newText: op.contents });
      continue;
    }
    if (op.type === 'delete') {
      out.push({ path: op.path, oldText: '', newText: '' });
      continue;
    }
    const path = op.moveTo ?? op.path;
    const move = op.moveTo;
    if (op.chunks.length === 0) {
      out.push(
        move === undefined
          ? { path, oldText: '', newText: '' }
          : { path, oldPath: op.path, oldText: '', newText: '' },
      );
      continue;
    }
    for (const chunk of op.chunks) {
      const diff: PatchDiff = {
        path,
        oldText: chunk.oldLines.join('\n'),
        newText: chunk.newLines.join('\n'),
      };
      out.push(move === undefined ? diff : { ...diff, oldPath: op.path });
    }
  }
  return out;
}

// ── 行尾与换行 ──────────────────────────────────────────────────────────────

/** 文件的行尾风格（写回时按原样恢复，避免把 CRLF 文件改成混合行尾）。 */
export type LineEnding = '\n' | '\r\n';

/** 去掉 `\r\n` 里的 `\r`（孤立的 `\r` 不动），与 `dsh-fs-local` 的 `normalizeLineEndings` 同口径。 */
export function normalizeLineEndings(text: string): string {
  return text.replaceAll('\r\n', '\n');
}

/** 按前 4KB 采样判断主导行尾（与 `dsh-fs-local` 的 `detectLineEndings` 同口径）。 */
export function detectLineEnding(text: string): LineEnding {
  const sample = text.slice(0, 4096);
  const crlf = sample.split('\r\n').length - 1;
  const lf = sample.split('\n').length - 1;
  return crlf > lf - crlf ? '\r\n' : '\n';
}

/** 把 LF 口径的内容按原文件的行尾风格写回（LF 原样返回）。 */
export function restoreLineEndings(text: string, ending: LineEnding): string {
  return ending === '\n' ? text : normalizeLineEndings(text).split('\n').join('\r\n');
}

// ── 定位（四级模糊回退） ────────────────────────────────────────────────────

/** 两行算不算相等。 */
type Comparator = (a: string, b: string) => boolean;

/** 把 Unicode 标点归一到 ASCII（与 opencode 的 `normalizeUnicode` 同表）。 */
function normalizeUnicode(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/…/g, '...')
    .replace(/\u00a0/g, ' ');
}

/** `pattern` 能不能落在 `at` 这一行开始的位置。 */
function matchesAt(
  lines: readonly string[],
  pattern: readonly string[],
  at: number,
  compare: Comparator,
): boolean {
  if (at < 0 || at + pattern.length > lines.length) return false;
  for (let offset = 0; offset < pattern.length; offset += 1) {
    if (!compare(lines[at + offset] as string, pattern[offset] as string)) return false;
  }
  return true;
}

/** 用某一种比较口径找 `pattern`：`eof` 时先试文件尾，再从头顺序搜。 */
function tryMatch(
  lines: readonly string[],
  pattern: readonly string[],
  startIndex: number,
  compare: Comparator,
  eof: boolean,
): number {
  if (eof) {
    const fromEnd = lines.length - pattern.length;
    if (fromEnd >= startIndex && matchesAt(lines, pattern, fromEnd, compare)) return fromEnd;
  }
  for (let at = startIndex; at + pattern.length <= lines.length; at += 1) {
    if (matchesAt(lines, pattern, at, compare)) return at;
  }
  return -1;
}

/**
 * 找一段上下文落在哪：依次用五种口径试。
 *
 * | 级别 | 口径 | 治的是 |
 * | ---- | ---- | ------ |
 * | 1 | 精确相等 | 正常情况 |
 * | 2 | 忽略行尾空白 | 编辑器去掉的尾随空格 |
 * | 3 | 忽略两端空白 | 缩进差异（模型常少抄/多抄几个空格） |
 * | 4 | Unicode 标点归一 | 弯引号 / em dash 被写成 ASCII |
 * | 5 | 忽略**一切**空白，但只认**唯一**匹配 | `animation: dashFlash` vs `animation:dashFlash`、`.dashing{` vs `.dashing {` |
 *
 * 前四级与 opencode 的 `seekSequence` 同序同义；第五级是本插件补的，针对一个很常见的真实失败：
 * 模型凭记忆写的那一行与文件**只差几个空格**（少一个、多一个、行内位置不同）。这一级的口径最松，
 * 所以配了一道**唯一性安全阀**：只有全文件恰好一处能对上时才采用；有两处以上对得上就宁可不做——
 * 「可能改错地方」比「让模型重试一次」糟糕得多（见 {@link tryUniqueMatch}）。
 *
 * 放宽是**逐级**的，前一级能找到就绝不降级，所以能精确匹配时永远不会跑到模糊口径上去。
 *
 * @param lines - 文件当前的行。
 * @param pattern - 要找的整段。
 * @param startIndex - 从这一行开始往后找（0 基）。
 * @param eof - 先试文件尾。
 * @returns 命中的 0 基行号；找不到返回 -1。
 */
function seekSequence(
  lines: readonly string[],
  pattern: readonly string[],
  startIndex: number,
  eof: boolean,
): number {
  if (pattern.length === 0) return -1;
  const passes: readonly Comparator[] = [
    (a, b) => a === b,
    (a, b) => a.trimEnd() === b.trimEnd(),
    (a, b) => a.trim() === b.trim(),
    (a, b) => normalizeUnicode(a.trim()) === normalizeUnicode(b.trim()),
  ];
  for (const compare of passes) {
    const at = tryMatch(lines, pattern, startIndex, compare, eof);
    if (at >= 0) return at;
  }
  // 第五级：忽略一切空白，但只认唯一匹配。
  return tryUniqueMatch(lines, pattern, startIndex, eof);
}

/** 把行内连续空白折成一个空格、再去掉两端空白（相似度与差异说明用的口径）。 */
function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** 去掉**所有**空白（第五级匹配的口径：连「有没有空格」都不计较）。 */
function stripSpaces(text: string): string {
  return text.replace(/\s+/g, '');
}

/**
 * 第五级匹配：忽略一切空白差异，但**只接受全文件唯一的那一处**。
 *
 * 唯一性就是这道口子的安全阀。松到这个程度时，两行「去掉空格后一模一样」几乎可以肯定是同一行
 * （模型少抄/多抄了一个空格）；但如果有两处以上都长得一样，那就无从判断它想改哪一处——此时
 * 返回 -1（当作没找到），让错误消息把文件里的真实内容说清楚，交回给模型决定。
 *
 * @param lines - 文件当前的行。
 * @param pattern - 要找的整段。
 * @param startIndex - 从这一行开始往后找（0 基）。
 * @param eof - 先试文件尾（显式锚点，不要求唯一）。
 * @returns 唯一的命中位置；没有命中或有多个命中都是 -1。
 */
function tryUniqueMatch(
  lines: readonly string[],
  pattern: readonly string[],
  startIndex: number,
  eof: boolean,
): number {
  const compare: Comparator = (a, b) => stripSpaces(a) === stripSpaces(b);
  if (eof) {
    const fromEnd = lines.length - pattern.length;
    if (fromEnd >= startIndex && matchesAt(lines, pattern, fromEnd, compare)) return fromEnd;
  }
  let hit = -1;
  for (let at = startIndex; at + pattern.length <= lines.length; at += 1) {
    if (!matchesAt(lines, pattern, at, compare)) continue;
    if (hit >= 0) return -1;
    hit = at;
  }
  return hit;
}

// ── 失败诊断：把「文件里最像的那一行」写进错误消息 ──────────────────────────
//
// 模型失败后的典型行为是**凭记忆微调**再试一次，于是连续浪费好几轮。所以这里在失败时多做一步：
// 在文件里找与模型写的那一行最像的**真实行**，把它连同行号与「差在哪」一起回给模型——
// 模型照抄就能过。诊断是 O(行数 × 行长²) 的相似度扫描，只在失败路径上跑，并且有行数上限。

/** 诊断时最多扫多少行（超长文件不值得为了一句错误消息跑全量相似度）。 */
const MAX_DIAGNOSTIC_LINES = 20000;

/** 相似度到这个值以上，就可以说「最像的是这一行，照抄它」。 */
const CLOSE_ENOUGH = 0.7;

/** 单行比较的字符上限（只需给出提示，不需要精确到整行）。 */
const MAX_COMPARE_CHARS = 400;

/** 报错时顺带贴出锚点之后的几行文件原文。 */
const CHUNK_PREVIEW_LINES = 4;

/** 编辑距离（滚动数组；两端各截到 {@link MAX_COMPARE_CHARS}）。 */
function editDistance(left: string, right: string): number {
  const a = left.length > MAX_COMPARE_CHARS ? left.slice(0, MAX_COMPARE_CHARS) : left;
  const b = right.length > MAX_COMPARE_CHARS ? right.slice(0, MAX_COMPARE_CHARS) : right;
  let previous: number[] = Array.from({ length: b.length + 1 }, (_value, at) => at);
  for (let i = 1; i <= a.length; i += 1) {
    const current: number[] = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const remove = (previous[j] as number) + 1;
      const insert = (current[j - 1] as number) + 1;
      const swap = (previous[j - 1] as number) + cost;
      current[j] = Math.min(remove, insert, swap);
    }
    previous = current;
  }
  return previous[b.length] as number;
}

/** 两行有多像（0–1）。 */
function similarity(left: string, right: string): number {
  if (left === right) return 1;
  const longest = Math.max(left.length, right.length);
  if (longest === 0) return 1;
  return 1 - editDistance(left, right) / longest;
}

/** 文件里一行「最像」的候选及其行号、相似度。 */
interface ClosestLine {
  line: number;
  text: string;
  similarity: number;
}

/**
 * 在文件里找与 `needle` 最像的一行。
 *
 * @param lines - 文件当前的行。
 * @param needle - 模型写的那一行。
 * @returns 最像的一行；文件空、太大、或 needle 为空时返回 null。
 */
function describeClosest(lines: readonly string[], needle: string): ClosestLine | null {
  if (needle === '' || lines.length === 0 || lines.length > MAX_DIAGNOSTIC_LINES) return null;
  const target = collapseSpaces(needle);
  let best: ClosestLine | null = null;
  for (let at = 0; at < lines.length; at += 1) {
    const text = lines[at] as string;
    if (text === '') continue;
    const score = similarity(collapseSpaces(text), target);
    if (best === null || score > best.similarity) {
      best = { line: at + 1, text, similarity: score };
      if (score === 1) break;
    }
  }
  return best;
}

/** 两个字符串第一个不同字符的下标（全同就是较短者的长度）。 */
function firstDifference(left: string, right: string): number {
  const limit = Math.min(left.length, right.length);
  for (let at = 0; at < limit; at += 1) if (left.charAt(at) !== right.charAt(at)) return at;
  return limit;
}

/**
 * 用一句话说清「模型写的这一行」和「文件里的这一行」差在哪。
 *
 * @param expected - 补丁里的那一行。
 * @param actual - 文件里的那一行。
 * @returns 差异说明；两行完全相同时为空串。
 */
function describeDifference(expected: string, actual: string): string {
  if (expected === actual) return '';
  if (expected.trim() === actual.trim()) {
    const leadExpected = expected.length - expected.trimStart().length;
    const leadActual = actual.length - actual.trimStart().length;
    if (leadExpected !== leadActual) {
      return `缩进不同：补丁里 ${leadExpected} 个前导空白，文件里 ${leadActual} 个`;
    }
    return '行尾空白不同';
  }
  if (collapseSpaces(expected) === collapseSpaces(actual))
    return '行内空白的数量不同（多一个 / 少一个空格或制表符）';
  if (stripSpaces(expected) === stripSpaces(actual)) return '只有空格 / 制表符的差别（有没有、在哪里）';
  if (normalizeUnicode(expected.trim()) === normalizeUnicode(actual.trim())) {
    return '标点不同（弯引号 / 破折号等被写成了 ASCII）';
  }
  const at = firstDifference(expected, actual);
  return (
    `第 ${at + 1} 个字符起不同：补丁 ${JSON.stringify(expected.slice(at, at + 40))} / ` +
    `文件 ${JSON.stringify(actual.slice(at, at + 40))}`
  );
}

/**
 * 这些行是不是**按顺序**都能在文件里找到、但彼此**不连续**。
 *
 * 用于精确判定「一个片段里堆了多处不相邻的删除」这种写法（模型把它当成一次批量）。要求“按顺序
 * 都能找到”，所以不会把「内容本身就写错了」误判成结构问题。
 *
 * @param lines - 文件当前的行。
 * @param needle - 片段里的旧行（按顺序）。
 * @returns 全部找到且存在不连续处就是 true。
 */
function appearInOrderButSpread(lines: readonly string[], needle: readonly string[]): boolean {
  if (needle.length < 2) return false;
  let cursor = 0;
  let previous = -1;
  let spread = false;
  for (const line of needle) {
    let hit = -1;
    for (let at = cursor; at < lines.length; at += 1) {
      const candidate = lines[at] as string;
      if (candidate === line || candidate.trim() === line.trim()) {
        hit = at;
        break;
      }
    }
    if (hit < 0) return false;
    if (previous >= 0 && hit !== previous + 1) spread = true;
    previous = hit;
    cursor = hit + 1;
  }
  return spread;
}

/**
 * 这段改动的**新内容**是不是已经在文件里了（旧内容不在）——典型的「重试 / 重复调用，其实已经改好」。
 *
 * 只做精确与去缩进两级比较，宁可漏报也不误报（这条只是提示，不该把模型带偏）。
 *
 * @param lines - 文件当前的行。
 * @param needle - 片段里的新行。
 * @returns 命中位置（0 基）；没有就是 -1。
 */
function findAppliedBlock(lines: readonly string[], needle: readonly string[]): number {
  if (needle.length === 0) return -1;
  const exact = tryMatch(lines, needle, 0, (a, b) => a === b, false);
  if (exact >= 0) return exact;
  return tryMatch(lines, needle, 0, (a, b) => a.trim() === b.trim(), false);
}

/** 百分比显示（错误消息里不用小数）。 */
function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// ── 应用 ────────────────────────────────────────────────────────────────────

/** 一处替换：把 `[at, at + oldLen)` 换成 `newLines`。 */
interface Replacement {
  at: number;
  oldLen: number;
  newLines: readonly string[];
  chunk: PatchChunk;
}

/** 按 `\n` 切行；末尾那个空串（文件以换行结尾的证据）先摘掉，行号才好数。 */
function toLines(text: string): string[] {
  const lines = text.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * `@@` 锚点找不到时的报错：点名最像的那一行。
 *
 * @param lines - 文件当前的行。
 * @param context - 锚点文本。
 * @param displayPath - 报错时点名用的路径。
 * @returns 面向模型的错误。
 */
function anchorError(lines: readonly string[], context: string, displayPath: string): Error {
  const parts = [`patch 无法应用：在 ${displayPath} 里找不到 @@ 锚点 ${JSON.stringify(context)}。`];
  const closest = describeClosest(lines, context);
  if (closest !== null && closest.similarity >= CLOSE_ENOUGH) {
    parts.push(
      `文件第 ${closest.line} 行最像（相似度 ${percent(closest.similarity)}），实际是：`,
      `  ${closest.text}`,
    );
    const why = describeDifference(context, closest.text);
    if (why !== '') parts.push(`（${why}）`);
  } else if (closest !== null) {
    parts.push(
      `文件里没有这一行；最像的是第 ${closest.line} 行（相似度只有 ${percent(closest.similarity)}）。`,
    );
  }
  parts.push(
    '`@@` 后面写的是**锚点**（文件里真实存在的一行），不是小节标题；也可以去掉它，只用上下文行定位。',
  );
  parts.push('文件没有被修改。');
  return new Error(parts.join('\n'));
}

/**
 * 片段上下文找不到时的报错：把「文件里最像的那一行」连同行号与差异原因一起回给模型。
 *
 * 三段信息，按模型最容易照做的顺序给：
 * 1. 它写的那段旧文本（原文回显，便于对照）；
 * 2. 文件里的真实行（相似度够高时直接说「照抄这一行」；不够高就提醒它去 read，别凭记忆写）；
 * 3. 差在哪（缩进 / 行内空白 / 标点 / 第几个字符起不同）。
 *
 * @param lines - 文件当前的行。
 * @param chunk - 出错的片段。
 * @param displayPath - 报错时点名用的路径。
 * @param anchorAt - 本次锚点命中的 0 基行号（没有锚点时为 null）。
 * @returns 面向模型的错误。
 */
function mismatchError(
  lines: readonly string[],
  chunk: PatchChunk,
  displayPath: string,
  anchorAt: number | null,
): Error {
  const head = chunk.oldLines[0] ?? '';
  const parts = [`patch 无法应用：在 ${displayPath} 里找不到这一段的上下文：`, chunk.oldLines.join('\n')];

  if (anchorAt !== null) {
    const preview = lines.slice(anchorAt, anchorAt + CHUNK_PREVIEW_LINES);
    parts.push(
      `@@ 锚点在第 ${anchorAt + 1} 行找到了，但它后面跟的内容对不上。文件里从那一行起是：`,
      ...preview.map((line) => `  ${line}`),
      '把 - 行改成上面这些**真实**内容（连缩进一起抄），或者把锚点写成改动**上方**的一行。',
    );
  } else {
    const closest = describeClosest(lines, head);
    if (closest !== null && closest.similarity >= CLOSE_ENOUGH) {
      parts.push(
        // 刻意写清「与第一行比」：相似度是逐行算的，不写清的话，多处内容里只有第一行像时，
        // 「相似度 100% 却报失败」会让人困惑。
        `文件里与这一段**第一行**最像的是第 ${closest.line} 行（相似度 ${percent(closest.similarity)}）：`,
        `  ${closest.text}`,
      );
      const why = describeDifference(head, closest.text);
      if (why !== '') parts.push(`（${why}）`);
      parts.push('把这一行**原样**（连同缩进）抄进 - 行再试一次；改动上下各留一行上下文会更稳。');
    } else if (closest !== null) {
      parts.push(
        `这段文本在文件里不存在；最像的是第 ${closest.line} 行（相似度只有 ${percent(closest.similarity)}）：`,
        `  ${closest.text}`,
        '它可能来自记忆而不是 read——先 read 这个文件的相关片段，再按真实内容重写这一段。',
      );
    } else {
      parts.push('文件里没有可比的候选行——先 read 这个文件，再按真实内容重写这一段。');
    }
  }

  // 「一个片段里堆了好几处删除、但它们并不相邻」：写法上像一次批量，语义上却要求这些行**连续**。
  // 按顺序每一行都能在文件里找到、但并不连续 → 几乎可以肯定是这个原因，直接点破（模型很常见的想当然）。
  if (appearInOrderButSpread(lines, chunk.oldLines)) {
    parts.push(
      '这一段里的几处删除**并不相邻**（一个片段要求它的旧内容在文件里是连续的一段）。' +
        '每一处单独写一个 `@@` 片段（各带上自己的上下几行上下文），或者把中间那些没改的行也作为上下文行写进来。',
    );
  }

  // 「其实已经改好了」：新内容已在文件里、旧内容不在。重试 / 重复调用时最常撞上，
  // 直接说清，免得模型接着猜（注意这只是提示，不动磁盘）。
  const appliedAt = findAppliedBlock(lines, chunk.newLines);
  if (appliedAt >= 0) {
    parts.push(
      `注意：这一段的**新内容**已经在文件里了（第 ${appliedAt + 1} 行起），旧内容不在——` +
        '这次改动看起来已经应用过（或者是被别的编辑达成了同样结果）。确认无误的话，把这一段从补丁里去掉即可。',
    );
  }

  parts.push('文件没有被修改。');
  return new Error(parts.join('\n'));
}

/**
 * 算出每个片段的替换位置（不修改传入的数组）。
 *
 * @param lines - 文件当前的行（已 LF 口径、已摘掉末尾空串）。
 * @param displayPath - 报错时点名用的路径。
 * @param chunks - 补丁里的片段。
 * @returns 按位置升序排好的替换列表。
 * @throws 锚点或上下文找不到时抛错（消息面向模型，指明路径、文件里的真实行与差异原因）。
 */
function computeReplacements(
  lines: readonly string[],
  displayPath: string,
  chunks: readonly PatchChunk[],
): Replacement[] {
  const replacements: Replacement[] = [];
  let lineIndex = 0;

  for (const chunk of chunks) {
    const eof = chunk.endOfFile === true;
    let anchorAt: number | null = null;
    if (chunk.context !== undefined) {
      const at = seekSequence(lines, [chunk.context], lineIndex, false);
      if (at < 0) throw anchorError(lines, chunk.context, displayPath);
      // **锚点可以就是本段的第一行**。模型经常把「我要改的那一行」直接写在 `@@` 后面
      // （当成小节标题用），此时若把搜索起点推到它的下一行，这一段必然找不到。
      // 从锚点本身开始找，两种情况都对：锚点是上方的一行 → 继续往下找；锚点就是改动行 → 当场命中。
      anchorAt = at;
      lineIndex = at;
    }

    // 只有 + 行的片段：追加到文件末尾（与 opencode 一致）。
    if (chunk.oldLines.length === 0) {
      const last = lines.length - 1;
      const at = last >= 0 && lines[last] === '' ? last : lines.length;
      replacements.push({ at, oldLen: 0, newLines: chunk.newLines, chunk });
      continue;
    }

    let pattern: readonly string[] = chunk.oldLines;
    let next: readonly string[] = chunk.newLines;
    let found = seekSequence(lines, pattern, lineIndex, eof);
    // 兜底：末行是空串（文件尾部有连续空行）时，去掉它再试一次——与 opencode 一致。
    if (found < 0 && pattern.length > 0 && pattern[pattern.length - 1] === '') {
      pattern = pattern.slice(0, -1);
      if (next.length > 0 && next[next.length - 1] === '') next = next.slice(0, -1);
      found = seekSequence(lines, pattern, lineIndex, eof);
    }
    if (found < 0) throw mismatchError(lines, chunk, displayPath, anchorAt);
    replacements.push({ at: found, oldLen: pattern.length, newLines: next, chunk });
    lineIndex = found + pattern.length;
  }

  replacements.sort((a, b) => a.at - b.at);
  return replacements;
}

/** 从后往前套用替换（避免前面的改动挪动后面片段的下标）。 */
function applyReplacements(lines: readonly string[], replacements: readonly Replacement[]): string[] {
  const result = [...lines];
  for (let index = replacements.length - 1; index >= 0; index -= 1) {
    const replacement = replacements[index] as Replacement;
    result.splice(replacement.at, replacement.oldLen, ...replacement.newLines);
  }
  return result;
}

/**
 * 把一份 update 段落应用到当前内容上。
 *
 * @param chunks - 补丁里的片段。
 * @param originalText - 文件当前内容（**LF 口径**；CRLF 由调用方先归一）。
 * @param displayPath - 报错时点名用的路径。
 * @returns 新内容（LF 口径、末尾保证换行）与每个片段的差异（含真实起始行号）。
 * @throws 任一片段的锚点或上下文找不到时抛错——**调用方据此保证「一个字节都不写」**。
 */
export function applyChunksToText(
  chunks: readonly PatchChunk[],
  originalText: string,
  displayPath: string,
): AppliedChunks {
  const lines = toLines(originalText);
  const replacements = computeReplacements(lines, displayPath, chunks);
  const next = applyReplacements(lines, replacements);
  if (next.length === 0 || next[next.length - 1] !== '') next.push('');

  // 片段在新文件里的起始行号：它自己的落点 + 前面片段造成的行数漂移。
  let shift = 0;
  const applied: AppliedChunk[] = [];
  for (const replacement of replacements) {
    const startIndex = replacement.at + shift;
    shift += replacement.newLines.length - replacement.oldLen;
    applied.push({
      oldText: replacement.chunk.oldLines.join('\n'),
      newText: replacement.chunk.newLines.join('\n'),
      startLine: startIndex + 1,
    });
  }

  return { content: next.join('\n'), chunks: applied };
}

/** 一段文本的逻辑行数（末尾空行不算一行）。 */
export function countLogicalLines(text: string): number {
  if (text === '') return 0;
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return body.split('\n').length;
}
