/**
 * 沙箱提权（与官方 `write` / `edit` / `bash` 同一套语义）
 *
 * 本文件是 `@deepseek-ai/dsh-sandbox` 里那几段逻辑的**等价移植**（`WIDER_MODES` /
 * `validateEscalationArgs` / `approveEscalation` / 两个 marker）。为什么不直接 import：
 * 第三方插件的产物跑在用户仓库里，运行时 import 官方包要看 Node 的解析路径（插件真实路径在
 * 仓库中，profile 的 node_modules 不是它的祖先），解析不到就是**整个 Host 半加载失败**。
 * 所以这里只依赖两个**服务**：`ctx.get('sandboxPolicy')`（策略解析）与 `ctx.get('approval')`
 * （审批通道）——服务是运行时的正式接缝，import 不是。
 *
 * 语义要点（照抄官方，别自己发明）：
 * - 提权字段只在**沙箱后端真的在限制**（`ctx.fs.sandboxMode !== undefined`）时才广告出去；
 * - `sandbox_permissions` 与 `justification` **必须成对**出现，且理由非空；
 * - 只能提权到**严格更宽**的模式（`read-only → workspace-write | danger-full-access`，
 *   `workspace-write → danger-full-access`）；不更宽的请求不打扰人，直接拒；
 * - 先过审批（`approval.request`），`allowed-once` 才把更宽的模式**只盖这一次调用**；
 * - 被拒 / 取消 / 无人可问，一律抛错，**什么都不执行**（fail-closed）。
 *
 * @module @dshp/file-change-viewer
 */
import { dirname, resolve as resolvePath, sep } from 'node:path';
import { realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { AnyCtx } from './types.js';

/** 沙箱模式（与官方 `SandboxMode` 同字面量）。 */
export type SandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access';

/** 每一次调用都要盖上去的策略（与官方 `SandboxExecutionPolicy` 同形）。 */
export interface SandboxExecutionPolicy {
  mode: SandboxMode;
  workspaceRoot: string;
  sessionId?: string;
}

/** 能提权到的模式（闭合词表）：`read-only` 是地板，没有谁会提权到它。 */
const ESCALATION_TARGETS: readonly SandboxMode[] = ['workspace-write', 'danger-full-access'];

/** 哪些模式比当前模式更宽。 */
const WIDER_MODES: Record<string, readonly SandboxMode[]> = {
  'read-only': ['workspace-write', 'danger-full-access'],
  'workspace-write': ['danger-full-access'],
};

/**
 * 模型可见的「沙箱拒绝」标记。
 *
 * 一行标准措辞，bash 的文件效果与文件系统围栏共用同一套词表——模型因此不管被谁拦下，
 * 都能认出这是策略拒绝、并且知道下一步该做什么。
 *
 * @param mode - 被拒那次调用运行在哪个模式。
 * @returns 标记行原文。
 */
export function sandboxDenialMarker(mode: string): string {
  return `[sandbox: file access denied under ${mode} mode]`;
}

/**
 * 同轮次的提权提示：附在拒绝消息后面，让「用 sandbox_permissions 重试一次」这件事
 * 出现在决策点上，而不是指望模型记得工具描述。
 *
 * @param subject - 这一族的动作名词（文件写入用 `operation`，bash 用 `command`）。
 * @returns 提示行原文。
 */
export function escalationHintMarker(subject: string): string {
  return `[sandbox: escalation available — retry this exact ${subject} once with sandbox_permissions (the narrowest wider mode that suffices) + justification; the approval prompt asks the user]`;
}

/** 两个提权参数（直接拼进工具 `parameters.properties`）。 */
export function escalationSchemaFields(modes: readonly SandboxMode[]): Record<string, unknown> {
  return {
    sandbox_permissions: {
      type: 'string',
      enum: [...modes],
      description:
        'The wider sandbox mode this file operation needs. Only valid as a one-shot retry of an operation the sandbox just denied; requires justification and user approval.',
    },
    justification: {
      type: 'string',
      description:
        'Required with sandbox_permissions: one sentence for the user explaining why this exact file operation needs the wider access.',
    },
  };
}

/**
 * 校验提权参数配对（schema 表达不了的那部分）。
 *
 * @param sandboxPermissions - 模型给的 `sandbox_permissions`。
 * @param justification - 模型给的 `justification`。
 * @throws 两者不成对、或理由为空时抛错。
 */
export function validateEscalationArgs(sandboxPermissions: unknown, justification: unknown): void {
  if (sandboxPermissions !== undefined && justification === undefined) {
    throw new Error('invalid escalation: sandbox_permissions requires a justification');
  }
  if (justification !== undefined && sandboxPermissions === undefined) {
    throw new Error('invalid escalation: justification is only valid together with sandbox_permissions');
  }
  if (typeof justification === 'string' && justification.trim().length === 0) {
    throw new Error('invalid justification: expected a non-empty sentence');
  }
}

/**
 * 走一次审批，拿到这次的提权模式。
 *
 * @param request - 请求的模式 / 理由 / 当前模式。
 * @param approval - 审批服务、发起该调用的 agent、callId、工具名、取消信号。
 * @returns 审批通过的更宽模式。
 * @throws 不更宽、没有审批服务、没有 agent、被拒、被取消、无人应答时抛错（什么都不执行）。
 */
async function approveEscalation(
  request: { requestedMode: SandboxMode; justification: string; effectiveMode: string; subject: string },
  approval: {
    approver: AnyCtx;
    agent: AnyCtx;
    callId: AnyCtx;
    toolName: string;
    signal?: AbortSignal | undefined;
  },
): Promise<SandboxMode> {
  const { requestedMode: mode, effectiveMode, justification, subject } = request;
  if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) {
    throw new Error(
      `sandbox escalation to "${mode}" is not strictly wider than this call's current "${effectiveMode}" mode`,
    );
  }
  if (approval.approver === undefined) {
    throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`);
  }
  if (approval.agent === undefined) {
    throw new Error(
      `sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`,
    );
  }
  const outcome = await approval.approver.request({
    agent: approval.agent,
    toolName: approval.toolName,
    callId: approval.callId,
    reason: `escalate sandbox to ${mode}: ${justification}`,
    ...(approval.signal === undefined ? {} : { signal: approval.signal }),
  });
  switch (outcome) {
    case 'allowed-once':
      return mode;
    case 'rejected':
      throw new Error(`the user rejected escalating this ${subject} to "${mode}"`);
    case 'cancelled':
      throw new Error(`approval for escalating to "${mode}" was cancelled`);
    default:
      throw new Error(`approval for escalating to "${mode}" was not answered (${String(outcome)})`);
  }
}

/** 提权面：注册时算好，执行时用。 */
export interface EscalationFace {
  /** 能提权到的模式（空数组 = 本组合没有沙箱后端，不提权）。 */
  modes: readonly SandboxMode[];
  /**
   * 求这次调用该盖的策略。
   *
   * @param toolName - 工具名（进审批审计）。
   * @param args - 调用的参数（读 `sandbox_permissions` / `justification`）。
   * @param exec - 工具执行上下文（agent / callId / signal）。
   * @returns 这次调用的策略；无沙箱后端时为 undefined。
   */
  resolvePolicy: (
    toolName: string,
    args: AnyCtx,
    exec: AnyCtx,
  ) => Promise<SandboxExecutionPolicy | undefined>;
  /**
   * 把围栏抛出的错误翻成模型能照做的消息。
   *
   * @param error - 写入时抛出的错误。
   * @param policy - 这次调用盖的策略（用来在标记里点出模式）。
   * @returns 处理后的错误。
   */
  mapError: (error: unknown, policy: SandboxExecutionPolicy | undefined) => unknown;
}

/**
 * 造提权面（与官方 `FsSandboxController` 同判定）。
 *
 * **服务要每次调用现读，不能在注册时抓一次**：`ctx.sandboxPolicy` 由另一个插件
 * （`@deepseek-ai/dsh-sandbox-policy`）提供，它和 `ctx.fs` 的挂载顺序没有保证。注册那一刻取不到
 * 就永久拿到 `undefined` → 给围栏传「无策略」→ 围栏退回**不带会话的兜底根**去判包含 →
 * 会话工作区里的写入会被全部拒绝（真踩过：创建和修改都报 `file access denied under
 * workspace-write mode`，只有 `danger-full-access` 能过，因为围栏对它是直接放行）。
 *
 * @param ctx - 注入了 `tools` 与 `fs` 的上下文。
 * @returns 提权面；`ctx.fs` 没有 `sandboxMode`（未装围栏后端）时 `modes` 为空、策略为 undefined。
 */
export function createEscalation(ctx: AnyCtx): EscalationFace {
  const confiningAtRegistration = (ctx.fs?.sandboxMode as SandboxMode | undefined) !== undefined;
  const modes = confiningAtRegistration ? ESCALATION_TARGETS : [];
  /** 每次调用现读（挂载顺序不保证）。 */
  const policyNow = (): AnyCtx => ctx.get('sandboxPolicy') as AnyCtx;
  /** 每次调用现读：`sandboxMode` 在 = 有围栏后端。 */
  const confiningNow = (): boolean => (ctx.fs?.sandboxMode as SandboxMode | undefined) !== undefined;

  return {
    modes,
    async resolvePolicy(toolName: string, args: AnyCtx, exec: AnyCtx) {
      validateEscalationArgs(args?.sandbox_permissions, args?.justification);
      const confining = confiningNow();
      const policyService = policyNow();
      if (confining && (policyService === undefined || policyService === null)) {
        // 与官方 controller 的不变量一致：装了围栏却没有策略服务 = 组合损坏。
        // 这时**绝不能**退回「无策略」——那会让围栏用一个不带会话的兜底根去判，结果是把合法路径也拒掉。
        throw new Error(
          'patch: the mounted filesystem confines but ctx.sandboxPolicy is missing — cannot resolve the sandbox ' +
            'policy for this call (refusing to write without a resolved policy)',
        );
      }
      const session = exec?.agent?.session;
      const standing = policyService?.resolve(session === undefined ? {} : { session });
      if (args?.sandbox_permissions === undefined || args?.justification === undefined) return standing;
      if (!confining) {
        throw new Error(
          'sandbox_permissions is not available in this composition (no sandboxing filesystem to escalate)',
        );
      }
      const approvedMode = await approveEscalation(
        {
          requestedMode: args.sandbox_permissions as SandboxMode,
          justification: String(args.justification),
          effectiveMode: String(standing?.mode),
          subject: 'operation',
        },
        {
          approver: ctx.get('approval') as AnyCtx,
          agent: exec?.agent,
          callId: exec?.callId,
          toolName,
          signal: exec?.signal,
        },
      );
      return { ...(standing as SandboxExecutionPolicy), mode: approvedMode };
    },
    /**
     * 把围栏抛出的 `FS_SANDBOX_DENIED` 换成官方那两行标记，**并把原来那个错误对象原样抛出去**。
     *
     * 为什么不新造一个 `Error`：`ToolRuntime` 只对运行时的 `HarnessError` 实例（`instanceof` 判定）
     * 往会话日志里填 `result.error = { name, code }`。新造的 `Error` 即使在字段上写了 `code` 也过不了
     * 那道 `instanceof`，结果就是 `patch` 的拒绝在日志/重试逻辑里「没有错误码」——与 `edit` 不一致。
     * 而 `ctx.fs` 抛出来的本来就是真正的 `FsError`（`HarnessError` 子类），所以改它的 `message`
     * 再原样 throw，类、code、文本三者都与官方文件工具一致；`cause` 链的差别是外层的，观察不到。
     */
    mapError(error: unknown, policy: SandboxExecutionPolicy | undefined) {
      if ((error as { code?: unknown })?.code !== 'FS_SANDBOX_DENIED') return error;
      const mode = policy?.mode ?? 'unknown';
      const text = `${sandboxDenialMarker(mode)}\n${escalationHintMarker('operation')}`;
      const original = error as { message?: unknown };
      try {
        original.message = text;
        return error;
      } catch {
        // 万一 message 不可写（被冻结的错误实现）：退回一个带 code 的新错误，行为退化但不会崩。
        const fallback = new Error(text);
        (fallback as { code?: string }).code = 'FS_SANDBOX_DENIED';
        (fallback as { cause?: unknown }).cause = error;
        return fallback;
      }
    },
  };
}

// ── 写前预检：让「批量里混入一个越界文件」在**动手之前**就整体失败 ──────────────
//
// 围栏本身只在 `ctx.fs.writeText` 里生效，而批量 patch 是逐个文件写的：第一个文件写成功后，
// 第二个文件才被拒 → 磁盘上留下半截结果。所以这里把围栏的判定**提前**做一遍：只要有一个目标
// 不在可写根里，就在任何写入发生之前整体拒绝（并给出与围栏相同的那两行 marker，模型照样能提权重试）。
//
// 判定与 `dsh-sandbox` 的 `writableRoots()` / `isPathUnder()` 同口径：`workspace-write` 的可写根是
// 会话工作区 + `/tmp` + 平台临时目录；先做词法前缀比较，再沿最深已存在祖先做 realpath 比较。

/** 某个策略下的可写根（与官方 `writableRoots()` 同口径）。 */
export function writableRootsUnder(policy: SandboxExecutionPolicy): string[] {
  if (policy.mode !== 'workspace-write') return [];
  return Array.from(new Set([policy.workspaceRoot, '/tmp', tmpdir()].map((root) => resolvePath(root))));
}

/** 目标是否落在某个根下：先词法比较，再沿祖先 realpath 比较（软链接也能认）。 */
async function isUnder(target: string, root: string): Promise<boolean> {
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (target === root || target.startsWith(prefix)) return true;
  const same = (real: string): boolean => real === root || real.startsWith(prefix);
  try {
    if (same(await realpath(target))) return true;
  } catch {
    /* 目标还不存在：继续往上看祖先 */
  }
  let ancestor = dirname(target);
  for (;;) {
    try {
      if (same(await realpath(ancestor))) return true;
    } catch {
      /* 这一层也不存在 */
    }
    const parent = dirname(ancestor);
    if (parent === ancestor) return false;
    ancestor = parent;
  }
}

/**
 * 在写任何文件之前断言目标可写（`danger-full-access` 直接放行，`read-only` 一律拒）。
 *
 * 只对**绝对路径**做预检：相对路径（第三方后端可能这样给 displayPath）无从判断，交给真正的围栏。
 *
 * @param policy - 这次调用要盖的策略；undefined（未装围栏后端）时放行。
 * @param displayPath - 目标路径（`FsTarget.displayPath`）。
 * @throws 路径不在可写根里时抛出与围栏相同文本的错误。
 */
export async function assertWritable(
  policy: SandboxExecutionPolicy | undefined,
  displayPath: string,
): Promise<void> {
  if (policy === undefined) return;
  if (policy.mode === 'danger-full-access') return;
  if (!displayPath.startsWith('/')) return;
  const target = resolvePath(displayPath);
  if (policy.mode === 'read-only') {
    throw sandboxDenied(policy, target);
  }
  const roots = writableRootsUnder(policy);
  for (const root of roots) {
    if (await isUnder(target, root)) return;
  }
  throw sandboxDenied(policy, target);
}

/** 造一个带官方两行 marker 的拒绝错误（与围栏抛出的文本一致）。 */
function sandboxDenied(policy: SandboxExecutionPolicy, target: string): Error {
  const error = new Error(`${sandboxDenialMarker(policy.mode)}\n${escalationHintMarker('operation')}`);
  (error as { code?: string }).code = 'FS_SANDBOX_DENIED';
  (error as { displayPath?: string }).displayPath = target;
  return error;
}

/**
 * 一批目标整体预检：把**所有**越界目标一次报出来，而不是撞上第一个就停。
 *
 * 官方 marker 是两行（拒绝原因 + 提权提示），这里**不改那两行**，只在后面追加一行点名本批越界的
 * 目标与它们的父目录。差别很实在：批量补丁里混进两个工作区外的文件时，模型一次重试就能同时覆盖
 * 两个目录，而不是改一个、再撞一个、再问一次（每次都要用户点一次审批）。
 *
 * @param policy - 这次调用要盖的策略；undefined（未装围栏后端）时放行。
 * @param displayPaths - 本次会写 / 会删的全部目标路径。
 * @throws 有任何一个目标不在可写根里时，抛出与围栏同码（`FS_SANDBOX_DENIED`）的拒绝错误。
 */
export async function assertBatchWritable(
  policy: SandboxExecutionPolicy | undefined,
  displayPaths: readonly string[],
): Promise<void> {
  if (policy === undefined || policy.mode === 'danger-full-access') return;
  const denied: string[] = [];
  for (const displayPath of displayPaths) {
    try {
      await assertWritable(policy, displayPath);
    } catch {
      denied.push(displayPath);
    }
  }
  if (denied.length === 0) return;

  // 去重但**不排序**：保持目标在补丁里出现的顺序，模型读起来与它写的补丁对得上。
  const dirs = Array.from(new Set(denied.map((path) => dirname(resolvePath(path)))));
  const error = new Error(
    `${sandboxDenialMarker(policy.mode)}\n${escalationHintMarker('operation')}\n` +
      `[sandbox: out-of-workspace targets in this patch: ${denied.join(', ')}` +
      (dirs.length === 0 ? '' : ` (parent directories: ${dirs.join(', ')})`) +
      ' — one retry with sandbox_permissions + justification covers the whole patch]',
  );
  (error as { code?: string }).code = 'FS_SANDBOX_DENIED';
  const first = denied[0];
  if (first !== undefined) (error as { displayPath?: string }).displayPath = first;
  throw error;
}
