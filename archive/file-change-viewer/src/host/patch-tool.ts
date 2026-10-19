/**
 * `patch` 模型工具：一次调用改多个文件、多处零散位置
 *
 * 这是本插件除「渲染」之外唯一的实质功能，动机很具体：**批量修改以前只能靠 shell 脚本**。
 * 官方文件工具是 `read` / `write` / `edit`——`write` 要重发整份文件，`edit` 一次只能替换一处。
 * 所以「一个文件里改 8 处、顺带再改 3 个文件」这种活儿，模型往往会退化成 `bash` + `sed`/`python`
 * 一把梭：改动藏在命令里，看不见 diff、也没法整体回滚。`patch` 把它变成一次调用：
 *
 * - 输入是 opencode `apply_patch`（Codex 补丁语法）的 `*** Begin Patch` 信封，段落是
 *   `*** Add File:` 与 `*** Update File:`。**片段不写行号**，靠自己的上下文内容定位，并做四级
 *   模糊回退（精确 → 去尾空格 → 两端 trim → Unicode 标点归一）；
 * - **只做「新建 / 修改」**：`*** Delete File:` 与 `*** Move to:` 解析层认识、执行层**明确拒绝**
 *   （消息里给出 `bash` 的 `rm` / `mv` 替代做法）。删除不可逆，而 patch 的「全有或全无」只覆盖
 *   验证阶段——落盘是逐个执行的；改名也会不可逆地动到另一个路径。这两件事本来就有官方出口
 *   （bash，同样吃沙箱策略），塞进这里只是省一次调用，却把一个「读 + 写」的工具变成「也会删文件」
 *   的工具；
 * - **全有或全无**：先把每个文件读进来、在内存里全部应用成功，才真正落盘。批量改一半失败
 *   留下半截状态是最糟的结果，这里从结构上避免；
 * - 改 / 建走 `ctx.fs`（官方的文件系统 seam）：同样吃沙箱模式、`fs/write-intent` 观察策略与
 *   `fs/observed` 记账，不绕过后端；
 * - 行尾与 BOM 保持：CRLF 文件归一后应用、写回时恢复；带 BOM 的文件改完 BOM 还在；
 * - 结果元数据里带 `diffs`（按片段切分、带**真实起始行号**），交给本插件的差异卡片渲染——
 *   这条调用于是也能一眼看清改了什么。
 *
 * @module @dshp/file-change-viewer
 */
import {
  assertBatchWritable,
  createEscalation,
  escalationSchemaFields,
  type SandboxExecutionPolicy,
} from './sandbox-escalation.js';
import {
  applyChunksToText,
  countLogicalLines,
  detectLineEnding,
  normalizeLineEndings,
  parseApplyPatch,
  previewDiffsOf,
  restoreLineEndings,
} from '../shared/apply-patch.js';
import type { PatchDiff, PatchOp } from '../shared/apply-patch.js';
import type { AnyCtx } from './types.js';

/** 落盘阶段要做的两种动作。 */
type PlanOperation = 'create' | 'update';

/** 一次落盘的结果（工具返回值里的一条）。 */
interface PatchedFile {
  path: string;
  operation: PlanOperation;
  added: number;
  removed: number;
}

/** 工具返回值。 */
interface PatchToolValue {
  files: PatchedFile[];
  /** 交给差异卡片的差异（按片段切分，带真实起始行号）。 */
  diffs: PatchDiff[];
  added: number;
  removed: number;
}

/** 一个文件段落的执行计划：读进来、在内存里应用成功后的待写内容。 */
interface FilePlan {
  file: PatchedFile;
  diffs: PatchDiff[];
  write: { target: AnyCtx; content: string; operation: 'create' | 'update' };
}

/** 一个文件当前的状态（读的时候顺手把「我看过它」登记给观察策略）。 */
interface FileState {
  info: AnyCtx;
  /** 原始文本（保留 CRLF）。 */
  raw: string;
  /** 是否带 UTF-8 BOM。 */
  bom: boolean;
}

/** 取会话工作目录（与官方文件工具同一来源）。 */
function sessionCwdOf(exec: AnyCtx): string | undefined {
  const cwd = exec?.agent?.session?.header?.cwd;
  return typeof cwd === 'string' && cwd !== '' ? cwd : undefined;
}

/** 解析一个目标路径（相对路径按会话工作目录展开）。 */
async function resolveTarget(
  ctx: AnyCtx,
  path: string,
  cwd: string | undefined,
  exec: AnyCtx,
): Promise<AnyCtx> {
  return ctx.fs.resolve(path, {
    ...(cwd === undefined ? {} : { cwd }),
    ...(exec?.signal === undefined ? {} : { signal: exec.signal }),
  });
}

/**
 * 读一个文件的当前状态；不存在时登记 `kind: 'absent'` 并返回 `info: undefined`。
 *
 * 观察策略（`dsh-fs-observation-policy`）要求写之前先被观察过，否则写入会被判 `FS_NOT_OBSERVED`。
 * 这里在读到的当下就补一次 `fs/observed`（与官方 `read` 工具同一套语义），模型不必先手动 read。
 *
 * @param ctx - 注入了 `fs` 的上下文。
 * @param target - 已解析的目标。
 * @param exec - 执行上下文。
 * @returns 文件状态（不存在时 `raw` 为空串、`bom` 为 false）。
 */
async function readFileState(ctx: AnyCtx, target: AnyCtx, exec: AnyCtx): Promise<FileState> {
  const info = await ctx.fs.stat(target, exec?.signal);
  if (info === undefined) {
    ctx.emit('fs/observed', target, { kind: 'absent' }, exec);
    return { info: undefined, raw: '', bom: false };
  }
  const raw = (await ctx.fs.readText(target, exec?.signal)) as string;
  ctx.emit('fs/observed', target, { kind: 'present', version: info.version }, exec);
  return { info, raw, bom: await readBom(ctx, target, exec) };
}

/**
 * 探目标是否带 UTF-8 BOM。
 *
 * `ctx.fs.readText` 解出来的是**去掉 BOM** 的文本（`TextDecoder` 默认吃掉它），而 `writeText`
 * 不会自己补回来——不探一下，改一个带 BOM 的文件就会把它的 BOM 吃掉。只读前三个字节，够用。
 *
 * @param ctx - 注入了 `fs` 的上下文。
 * @param target - 已解析的目标。
 * @param exec - 执行上下文。
 * @returns 是否带 BOM（后端不支持按范围读、或文件太短时为 false）。
 */
async function readBom(ctx: AnyCtx, target: AnyCtx, exec: AnyCtx): Promise<boolean> {
  if (typeof ctx.fs?.readByteRange !== 'function') return false;
  try {
    const head = (await ctx.fs.readByteRange(target, { offset: 0, length: 3 }, exec?.signal)) as Uint8Array;
    return head.length === 3 && head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf;
  } catch {
    // 后端不支持 / 目标在这两次调用之间消失：按「没有 BOM」处理，不因此让整次 patch 失败。
    return false;
  }
}

/**
 * 把 seam 抛出来的错误翻译成模型能照做的提示。
 *
 * **不新造错误对象**：`ToolRuntime` 只对运行时的 `HarnessError` 实例（`instanceof` 判定）填
 * `result.error = { name, code }`，重新包一层 `Error` 就等于把错误码丢了（`patch` 的失败在
 * 日志/重试逻辑里会与 `edit` 不一致）。所以这里就地改 message、把**原对象**抛出去。
 *
 * @param error - 原始错误（沙箱类已过 `mapError`）。
 * @param displayPath - 这次要写的路径。
 * @param detail - 追加说明（例如「哪些文件已经写成功了，别重复改」）。
 * @returns 交给模型看的错误（尽量是原对象）。
 */
function remediate(error: unknown, displayPath: string, detail: string): unknown {
  const code = (error as { code?: unknown })?.code;
  const message = String((error as Error)?.message ?? error);
  const text =
    code === 'FS_NOT_OBSERVED'
      ? `cannot modify "${displayPath}": file has not been read — read the file, then retry`
      : code === 'FS_STALE_VERSION'
        ? `${message} — re-read the file, then retry`
        : message;
  const finalText = text + detail;
  if (finalText === message) return error;
  try {
    (error as { message?: unknown }).message = finalText;
    return error;
  } catch {
    return new Error(finalText);
  }
}

/** 模型可见的文本小结（不把整份 patch 回显）。 */
function formatPatchOutput(value: PatchToolValue): string {
  const marker: Record<PlanOperation, string> = { create: 'A', update: 'M' };
  const lines = value.files.map(
    (file) => `${marker[file.operation]} ${file.path} (+${file.added} -${file.removed})`,
  );
  lines.push('', `Success. Patched ${value.files.length} file(s): +${value.added} -${value.removed}.`);
  return lines.join('\n');
}

/** 预览用：宽容解析（流式期间半截补丁很正常）。 */
function safeParse(text: unknown): PatchOp[] {
  if (typeof text !== 'string' || text === '') return [];
  try {
    return parseApplyPatch(text, { tolerant: true });
  } catch {
    return [];
  }
}

/**
 * 挑出本工具**不执行**的段落（删除 / 改名）。
 *
 * 为什么不做：这两件事在 DSH 里本来就有官方出口（`bash` 的 `rm` / `mv`），而且都有风险——
 * 删除不可逆，而 patch 的「全有或全无」只覆盖验证阶段（落盘是逐个执行的，第 3 个文件失败时
 * 前两个已经改了）；改名会不可逆地动到另一个路径。把它们塞进来，等于把一个「只读 + 写」的
 * 文件工具变成「也会删文件」的工具，收益只是省一次调用。
 *
 * 注意：**解析层仍然认识它们**——这样模型真的写出来时，得到的是一句能照做的中文说明，
 * 而不是一个含糊的格式错误。
 *
 * @param ops - 解析出来的段落。
 * @returns 不被执行的段落描述（空数组 = 全部可执行）。
 */
function unsupportedOps(ops: readonly PatchOp[]): string[] {
  const found: string[] = [];
  for (const op of ops) {
    if (op.type === 'delete') found.push(`*** Delete File: ${op.path}`);
    else if (op.type === 'update' && op.moveTo !== undefined) {
      found.push(`*** Update File: ${op.path} → *** Move to: ${op.moveTo}`);
    }
  }
  return found;
}

/** 新建文件的内容：保证以换行结尾（与 opencode 一致）。 */
function ensureTrailingNewline(contents: string): string {
  return contents.length === 0 || contents.endsWith('\n') ? contents : `${contents}\n`;
}

/**
 * 把一个文件段落变成执行计划（**只读 + 内存应用，不写任何东西**）。
 *
 * @param ctx - 注入了 `fs` 的上下文。
 * @param op - 解析出来的一个段落。
 * @param cwd - 会话工作目录。
 * @param exec - 执行上下文。
 * @returns 执行计划。
 * @throws 目标不存在 / 已存在 / 不是普通文件 / 上下文对不上时抛错（此时磁盘一个字节都没动）。
 */
async function planOperation(
  ctx: AnyCtx,
  op: Extract<PatchOp, { type: 'add' | 'update' }>,
  cwd: string | undefined,
  exec: AnyCtx,
): Promise<FilePlan> {
  if (op.type === 'add') {
    const target = await resolveTarget(ctx, op.path, cwd, exec);
    const state = await readFileState(ctx, target, exec);
    if (state.info !== undefined) {
      throw new Error(
        `patch 无法应用：${target.displayPath} 已经存在，而这份 patch 把它当成新建（*** Add File:）。\n` +
          '改已有文件请用 *** Update File:；要整份覆盖请用 write 工具；要删掉重建请先用 bash rm 删掉它。',
      );
    }
    const content = ensureTrailingNewline(op.contents);
    const diffs: PatchDiff[] = [{ path: target.displayPath, oldText: null, newText: content }];
    return {
      file: {
        path: target.displayPath,
        operation: 'create',
        added: countLogicalLines(content),
        removed: 0,
      },
      diffs,
      write: { target, content, operation: 'create' },
    };
  }

  // ── update（改名段落在 execute 里已经被拒，这里只处理改内容） ──
  const source = await resolveTarget(ctx, op.path, cwd, exec);
  const state = await readFileState(ctx, source, exec);
  if (state.info === undefined) {
    throw new Error(
      `patch 无法应用：${source.displayPath} 不存在，而这份 patch 把它当成已有文件（*** Update File:）。\n` +
        '新建请用 *** Add File:；如果它本该存在，检查会话工作目录是不是你以为的那个，或先 read 这个路径。',
    );
  }
  if (state.info.type !== 'file') {
    throw new Error(`patch 无法应用：${source.displayPath} 不是普通文件。`);
  }

  const ending = detectLineEnding(state.raw);
  const current = normalizeLineEndings(state.raw);
  const applied = applyChunksToText(op.chunks, current, source.displayPath);
  // BOM 保持：官方后端解出来的是**去掉 BOM** 的文本，写回时补上；万一某个后端的 readText
  // 把 BOM 留在文本里（TextDecoder 没配 ignoreBOM 之外的自实现），就不要再补第二个。
  const needsBom = state.bom && state.raw.charCodeAt(0) !== 0xfeff;
  const content = (needsBom ? '\ufeff' : '') + restoreLineEndings(applied.content, ending);

  const diffs: PatchDiff[] =
    op.chunks.length === 0
      ? [{ path: source.displayPath, oldText: current, newText: applied.content, startLine: 1 }]
      : applied.chunks.map((chunk) => ({
          path: source.displayPath,
          oldText: chunk.oldText,
          newText: chunk.newText,
          startLine: chunk.startLine,
        }));

  let added = 0;
  let removed = 0;
  for (const chunk of op.chunks) {
    added += chunk.added;
    removed += chunk.removed;
  }

  return {
    file: { path: source.displayPath, operation: 'update', added, removed },
    diffs,
    write: { target: source, content, operation: 'update' },
  };
}

/**
 * 注册 `patch` 工具。
 *
 * @param ctx - 注入了 `tools` 与 `fs` 的上下文。
 * @returns 反注册这个工具的 disposer（`tools.register` 的原样返回值）。工具的开关是动态的
 *   （设置里的 `patchTool`，默认关），Host 半在关掉时调它——这也是 `ctx.effect` 的清理函数。
 */
export function registerPatchTool(ctx: AnyCtx): () => void {
  // 提权面：沙箱后端在限制时才广告 `sandbox_permissions` / `justification`（与官方文件工具同一判定）。
  const escalation = createEscalation(ctx);
  return ctx.tools.register({
    name: 'patch',
    description:
      'Edit files with one structured patch: `patch` applies a whole `*** Begin Patch` envelope in a single ' +
      'call, so it can touch many files and many scattered places without rewriting any file — far fewer tokens ' +
      'than write, and every change shows up as a reviewable diff. Format:\n' +
      '*** Begin Patch\n[ one or more file sections ]\n*** End Patch\n' +
      'Each section starts with a header that names the action:\n' +
      '*** Add File: <path> — create a new file; every following line is a + line (its initial contents).\n' +
      '*** Update File: <path> — change an existing file in place.\n' +
      'Example:\n' +
      '*** Begin Patch\n*** Add File: hello.txt\n+Hello world\n*** Update File: src/app.py\n@@ def greet():\n' +
      '-print("Hi")\n+print("Hello, world!")\n*** End Patch\n' +
      'Inside an update section, each `@@` line starts a chunk. Text after `@@` is an ANCHOR, **not a label**: it ' +
      "must be text that really exists in the file — normally a line just ABOVE the change (writing the chunk's " +
      'own first line there works too). A bare `@@` with no text means "search anywhere" and is the safest ' +
      'choice when you are not sure. In a chunk a leading space marks an unchanged context line, `-` a removed ' +
      'line and `+` an added line. **Line numbers are never written**: a chunk is located by its own content, ' +
      'matched in five passes (exact, ignoring trailing whitespace, ignoring leading/trailing whitespace, Unicode ' +
      'punctuation normalized to ASCII, then — only when the result is unique — ignoring all whitespace). ' +
      '`*** End of File` pins a chunk to the end of the file. A chunk with only + lines (no context, no removals) ' +
      'is appended at the end of the file.\n' +
      'When a chunk does not match, the error names the closest real line in the file with its line number and ' +
      'what differs (indentation, inner whitespace, punctuation, or the first differing character). Copy that ' +
      'line verbatim into the - line and retry instead of guessing again — and read the file first whenever you ' +
      'are writing context from memory rather than from a read.\n' +
      'Rules that matter: include a header for every section; prefix every added line with +; paths are relative ' +
      'to the session working directory unless absolute. `*** Add File:` on a path that already exists is refused ' +
      '(a typo must never silently overwrite a file) — use `*** Update File:` for an existing file or `write` to ' +
      'replace it wholesale. This tool only creates and changes content: *** Delete File: and *** Move to: are ' +
      'recognized and then REFUSED (deleting and renaming are irreversible and belong to `bash` with rm / mv, ' +
      'which is sandboxed the same way). Every file is read and every chunk applied in memory before anything is ' +
      'written: if any chunk fails to match, or any target is outside the writable roots of the current policy, ' +
      'nothing is written at all. The write goes through the session file policy (sandbox): a denial ' +
      'reports the mode in a [sandbox: ...] marker, and when this composition advertises it, the sanctioned retry ' +
      'carries sandbox_permissions + justification for a one-shot user-approved escalation.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        patch: {
          type: 'string',
          description:
            'The full patch text, wrapped in the envelope. Example: "*** Begin Patch\\n*** Update File: ' +
            'src/a.ts\\n@@\\n-const a = 1;\\n+const a = 11;\\n*** End Patch". Multiple Add / Update sections ' +
            'and multiple @@ chunks per update are allowed; a section header is mandatory, every added line starts ' +
            'with +, and Delete / Move sections are refused.',
        },
        // 与官方 write / edit 一样：只在真的会围栏的组合里广告这两个字段。
        ...(escalation.modes.length > 0 ? escalationSchemaFields(escalation.modes) : {}),
      },
      required: ['patch'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                path: { type: 'string' },
                operation: { type: 'string', enum: ['create', 'update'] },
                added: { type: 'integer' },
                removed: { type: 'integer' },
              },
              required: ['path', 'operation', 'added', 'removed'],
            },
          },
          diffs: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                path: { type: 'string' },
                oldText: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                newText: { type: 'string' },
                startLine: { type: 'integer' },
              },
              required: ['path', 'oldText', 'newText'],
            },
          },
          added: { type: 'integer' },
          removed: { type: 'integer' },
        },
        required: ['files', 'diffs', 'added', 'removed'],
      },
      render: (_args: unknown, value: PatchToolValue) => [{ type: 'text', text: formatPatchOutput(value) }],
      /**
       * 差异卡片就读这里：每条 diff 是一个片段，`startLine` 是它在**新文件里的真实行号**——
       * 由落盘阶段算出来（片段自己的落点 + 前面片段的行数漂移），不是模型估的。
       */
      presentationMeta: (_args: unknown, value: PatchToolValue) => ({ diffs: value.diffs }),
    },
    /** 预览（流式 / 结算前）：宽容解析 args 里的补丁文本，等真正应用后再由 meta.diffs 接管。 */
    presentCall(args: AnyCtx) {
      const ops = safeParse(args?.patch);
      return {
        card: 'diff',
        title: `Patch ${ops.length} file(s)`,
        diffs: previewDiffsOf(ops),
        locations: ops.map((op) => ({ path: op.path })),
      };
    },
    isConcurrencySafe: () => false,
    async execute(args: AnyCtx, exec: AnyCtx): Promise<PatchToolValue> {
      const text = typeof args?.patch === 'string' ? args.patch : '';
      if (text.trim() === '')
        throw new Error('patch 必须是非空的补丁文本（*** Begin Patch … *** End Patch）。');
      const ops = parseApplyPatch(text);
      if (ops.length === 0) {
        throw new Error(
          'patch 里没有任何文件段落：需要 *** Add File: 或 *** Update File: 段头，' +
            '并包在 *** Begin Patch 与 *** End Patch 之间。',
        );
      }

      // 删除 / 改名**在读任何文件、问任何审批之前**就拒绝：这两个操作不可逆，而且 DSH 本来就有
      // 官方出口（bash 的 rm / mv，同样受沙箱约束）。patch 只负责「增 / 改」这一件事。
      const unsupported = unsupportedOps(ops);
      if (unsupported.length > 0) {
        throw new Error(
          'patch 只做「新建 / 修改」，不执行删除与改名，这份补丁里有：\n  ' +
            unsupported.join('\n  ') +
            '\n删除请用 bash 的 `rm`（git 跟踪的用 `git rm`）、改名请用 `mv`（跟踪的用 `git mv`）；' +
            '两者与 patch 吃同一份沙箱策略，越界一样会被拒。把这几段从补丁里去掉、只留增改，patch 就能继续。',
        );
      }
      const supported = ops as Array<Extract<PatchOp, { type: 'add' | 'update' }>>;

      // 提权：`sandbox_permissions` + `justification` 在这里过一次审批（`allowed-once` 才放行），
      // 没批准就直接抛错——**在读文件之前**，所以一个字节都不会写。
      const sandboxPolicy = await escalation.resolvePolicy('patch', args, exec);
      const cwd = sessionCwdOf(exec);

      // ── 阶段一：全部读进来、在内存里全部应用成功（一处失败 => 一个字节都不写） ──
      const plans: FilePlan[] = [];
      for (const op of supported) plans.push(await planOperation(ctx, op, cwd, exec));

      // 写前预检：批量里只要混进一个越界目标，就在**任何写入之前**整体失败，并把本批所有越界
      // 目标一次报出来（模型一次重试即可覆盖整批，不必逐个撞）。
      await assertBatchWritable(
        sandboxPolicy,
        plans.map((plan) => plan.write.target.displayPath),
      );

      // ── 阶段二：逐个原子写（写失败的会点名已写成功的文件） ──
      const done: PatchedFile[] = [];
      const diffs: PatchDiff[] = [];
      for (const plan of plans) {
        try {
          const intent = await ctx.waterfall('fs/write-intent', plan.write.target, exec, () => undefined);
          const outcome = await ctx.fs.writeText(
            plan.write.target,
            plan.write.content,
            intent,
            exec?.signal,
            sandboxPolicy as SandboxExecutionPolicy | undefined,
          );
          ctx.emit('fs/observed', plan.write.target, { kind: 'present', version: outcome.version }, exec);
        } catch (error) {
          // 诊断只留在 Host 侧日志：模型看到的消息必须与官方 write / edit 逐字一致（两行 marker），
          // 但排查「为什么这个路径不可写」时需要知道路径、模式和可写根。
          if ((error as { code?: unknown })?.code === 'FS_SANDBOX_DENIED') {
            console.warn(
              '[dshp-file-change-viewer] patch 被文件策略拒绝：path=' +
                plan.write.target.displayPath +
                ' mode=' +
                String(sandboxPolicy?.mode ?? '(默认)') +
                ' workspaceRoot=' +
                String(sandboxPolicy?.workspaceRoot ?? '(默认)') +
                '（workspace-write 的可写根 = 会话工作区 + /tmp + 平台临时目录；创建、修改与删除同一把尺子）',
            );
          }
          const already = done.map((file) => file.path).join(', ');
          const detail =
            already === ''
              ? ''
              : ` 已经成功落盘的是：${already}（它们不会回滚；请 read 这些文件后继续处理剩下的）。`;
          throw remediate(escalation.mapError(error, sandboxPolicy), plan.write.target.displayPath, detail);
        }
        done.push(plan.file);
        diffs.push(...plan.diffs);
      }

      let added = 0;
      let removed = 0;
      for (const file of done) {
        added += file.added;
        removed += file.removed;
      }
      return { files: done, diffs, added, removed };
    },
  });
}
