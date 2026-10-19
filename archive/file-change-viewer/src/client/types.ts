/**
 * Client 半共享类型
 *
 * 数据来源两条，都与官方实现逐字段对齐：
 *
 *  1. `dsh-tool-fs` 的 edit / write 结果元数据 `meta.diffs`（真正落盘的 hunk，每 hunk 带 3 行上下文）；
 *  2. 调用尚未结算时的参数原文 `argsRaw`（模型产出的 JSON，可能只写了一半）。
 *
 * 官方组件的 props 类型**直接从 SDK 取**（`@deepseek-ai/dsh-client-ui-primitives` 是
 * devDependency，只参与类型检查与构建；运行时仍由 shell 的冻结模块表注入，绝不打包），
 * 这里只建模官方类型没覆盖的领域字段。
 */
import type { ReactNode } from 'react';

/**
 * 一次文件变更的 hunk。
 * 与 `@deepseek-ai/dsh-tool-fs` 的 `FileDiff` 同形：纯插入/新文件 `oldText` 为 null。
 */
export interface FileDiff {
  path: string;
  oldText: string | null;
  newText: string;
  /**
   * 改名 / 移动的**源路径**（本插件 `patch` 工具的 `*** Move to:` 段）。
   *
   * 官方 `edit` / `write` 永远没有它；有值时卡头渲染成 `旧 → 新`，打开链接仍指向新路径。
   */
  oldPath?: string | undefined;
  /**
   * 这个 hunk 在新文件里的起始行号（1 起）。
   *
   * 官方 `edit` / `write` 的结果元数据**不带**它（`{path, oldText, newText}` 而已），本插件的
   * `patch` 工具会带上（落盘时算出「片段自己的落点 + 前面片段的行数漂移」）。没有时由
   * `locate.ts` 拿文件内容去定位；都拿不到就退回 1。
   */
  startLine?: number | undefined;
}

/** 调用语义状态（决定卡片配色与角标）。 */
export type FileChangeState = 'running' | 'ok' | 'error';

/**
 * 卡片主体视图。
 *
 * - `highlight`：官方 `CodeBlock`（真 shiki 着色 + 行号），每个 hunk 拆成「− 旧块 / + 新块」；
 * - `diff`：官方 `DiffBlock` 的逐行 ± 红绿合并 diff（紧凑）。
 *
 * 两个视图都是官方组件，差别只在「代码块形态」与「逐行差异形态」——官方高亮器没有
 * 「只给某一行的着色碎片」这种接口，所以逐行 ± 与真高亮无法同时存在于一个布局里。
 */
export type FileChangeView = 'highlight' | 'diff';

/**
 * 这次变更到底有没有落盘——卡片右上角标就是它。
 *
 * - `streaming`：调用进行中，参数还在流式生成（内容可能不完整）；
 * - `pending`：调用进行中，参数已完整（即将应用）；
 * - `applied`：调用成功结算；
 * - `rejected`：调用失败（变更未落盘，展示的是「本来要改什么」）。
 */
export type FileChangeBadge = 'streaming' | 'pending' | 'applied' | 'rejected';

/** 正在执行的调用（`RunningToolCall` 的用到的字段）。 */
export interface RunningToolCallLike {
  name: string;
  /** 模型产出的参数原文；流式生成期间可能是半截 JSON。 */
  argsRaw: string;
  /** 子调用（Code Dispatch）时存在；本插件的渲染不区分。 */
  parentCallId?: string | undefined;
}

/** 已结算的调用（`ToolResultNode` 的用到的字段）。 */
export interface ToolResultBlockLike {
  kind: 'tool-result';
  /** 窗口截断可能让 call head 落在窗口外，此时为 null。 */
  call: { name: string; argsRaw: string } | null;
  isError: boolean;
  /** 工具结果元数据；edit / write 在这里给 `diffs`。 */
  meta?: unknown;
  content: readonly unknown[];
  error?: { name: string; code: string } | undefined;
}

export type ToolCallBlockLike = RunningToolCallLike | ToolResultBlockLike;

/** 由一次调用推导出的渲染模型（纯函数产物，diff.ts 负责）。 */
export interface FileChangeModel {
  state: FileChangeState;
  /** 要渲染的 hunk 列表（每个 = 一个文件块）；空数组表示没有可渲染的变更。 */
  hunks: ChangeHunk[];
  badge: FileChangeBadge;
  /** 首 hunk 是纯新增（新文件 / 纯插入）。 */
  newFile: boolean;
  /** edit 带了 replace_all: true。 */
  replaceAll: boolean;
  /** 失败调用的首行错误文本；非失败为 null。 */
  errorText: string | null;
  /** 参数可解析成对象时的结果，供无 diff 时兜底展示。 */
  parsedArgs: Record<string, unknown> | null;
  /** 参数原文，供无 diff 且不可解析时兜底展示。 */
  rawArgs: string;
}

/** 一行统一 diff 的语义。 */
export type UnifiedDiffKind = 'ctx' | 'del' | 'add';

/** 统一 diff 的一行。 */
export interface UnifiedDiffRow {
  kind: UnifiedDiffKind;
  text: string;
}

/**
 * 一个 hunk 的两种口径——**这是本插件最容易搞错的地方**。
 *
 * `edit` 工具写进 `meta.diffs` 的 `oldText` / `newText` 就是模型这次给的 `old_string` /
 * `new_string` **原文**：为了让 `old_string` 在文件里唯一，模型通常会把上下几行一起圈进来。
 * 于是同一次「只改一行」的编辑，原文可能是 7 行 vs 7 行——官方 `diffTotals` 与官方 `DiffBlock`
 * 都按这份原文算，就会报成 `+7 -7` 并在 ± 视图里整段删、整段加。
 *
 * | 口径      | 内容                                              | 谁在用                                    |
 * | --------- | ------------------------------------------------- | ----------------------------------------- |
 * | `raw`     | 工具原文（含未变的上下文行）                      | 高亮视图的 LCS 输入                       |
 * | `rows`    | `raw` 的 LCS 逐行结果（未变行只出现一次）          | 高亮视图                                  |
 * | `changed` | 只留真正变化的行（ctx 全部丢掉）                  | 行头 / 卡头统计、± 差异视图（与高亮一致）  |
 *
 * 三个口径同出于一次 LCS，所以统计、高亮视图、± 差异视图永远说同一件事。
 */
export interface ChangeHunk {
  /** 工具给的原始 hunk。 */
  raw: FileDiff;
  /** 原始 hunk 的 LCS 逐行结果。 */
  rows: UnifiedDiffRow[];
  /** 只含真正变化的行：`oldText` = 删除行（无则 null），`newText` = 新增行（可能为 ''）。 */
  changed: FileDiff;
}

/** DiffBlock 的本地化文案契约由官方 primitives 导出（`diffBlockLabels(t)` 同字段）。 */
export type { DiffBlockLabels } from '@deepseek-ai/dsh-client-ui-primitives';

/**
 * `tool.call.toolview` 交给我们的 props（owner + 槽位标准 props + locale seat）。
 *
 * 注册时传 `locale: 'conversation'`，框架才会注入 `t`；`cwd` / `home` 只用于把
 * 绝对路径显示成工作区相对路径与 `~`；`sessionId` 是**会话作用域槽位**的标准 prop，
 * 会话级覆盖（页头快捷开关）用它区分「哪一个会话」。
 */
export interface ToolViewProps {
  callId: string;
  toolName: string;
  block: ToolCallBlockLike;
  /** 本行所属会话（标准 prop；宿主换了契约时可能缺失，缺了就没有会话级覆盖）。 */
  sessionId?: string | undefined;
  cwd?: string | undefined;
  home?: string | undefined;
  openFile: (path: string, options?: { line?: number | undefined }) => void;
  inspect?: (() => void) | undefined;
  t: (key: string, params?: Record<string, unknown>) => string;
}

/**
 * client 侧 cordis 上下文（本插件只用到这两个成员）。
 *
 * 不 import `@deepseek-ai/cordis` 的类型：本插件的 client 半在 cordis 服务表面前是普通
 * 模块，`ctx` 由 shell 的模块系统注入，把整包 cordis 拉进 devDependencies 只为两个方法
 * 并不划算。这里的形状就是实际用到的契约，改一处即可跟随上游。
 */
export interface ClientContext {
  /** 取一个 cordis 服务；服务还没挂载时返回 `undefined`。 */
  get(name: string): unknown;
  /**
   * 注册一个随本插件一起收回的副作用。
   *
   * @param callback - 返回清理函数（或任意值）的回调。
   * @param label - 诊断用标签。
   */
  effect(callback: () => unknown, label?: string): unknown;
}

/**
 * slots 服务（本插件只用 inject + register）。
 *
 * 只建模用到的两个成员。**没有**直接 import `@deepseek-ai/dsh-client-ui-slots` 的
 * `SlotCore`：槽位注册的完整类型是声明合并出来的（`SlotMap` 由 settings / conversation /
 * tool 各自的 UI 包 merge），要拿到逐槽位的 props 检查就得把那些包也拉进来。那是下一步，
 * 与本次「前端换 TSX + 用真实 SDK 类型」是两件事。
 */
export interface SlotsService {
  /**
   * 等某个槽位被声明后再执行注册回调（**异步**：回调可能在槽位声明时才被调用）。
   *
   * @param name - 槽位名。
   * @param fn - 注册逻辑；返回 generator 时，逐条注册会在槽位就绪后依次展开。
   */
  inject(name: string, fn: () => unknown): unknown;
  /**
   * 注册一个槽位条目。
   *
   * keyed 槽位用 `key`（+ `priority` 影子化：同 key 同 priority 会抛错，派发取 priority 最小的一条，
   * 官方内置行是 0，接管必须用负数）；list 槽位用 `id`（+ `order`）。`locale` 传了才会注入 `t`。
   *
   * @param spec - 注册选项。
   * @param component - 组件（props 由槽位契约决定）。
   * @returns 卸载该条注册的 disposer。
   */
  register(spec: SlotRegistrationSpec, component: (props: never) => ReactNode): unknown;
}

/**
 * 差异展示方式（与 Host 半的 `DiffView`、settings schema 的 `z.const` 联合逐字对齐）。
 *
 * - `highlight`：官方 `CodeBlock` 里放完整统一 diff（整行红绿 + 行号 + 真 shiki 语法高亮）；
 * - `diff`：官方 `DiffBlock` 的逐行 ± 红绿视图，紧凑、超长中部折叠。
 */
export type DiffView = 'highlight' | 'diff';

/** 改动两侧多显示几行上下文（与 Host 半的 `ContextLines` 逐字对齐）。 */
export type ContextLines = 0 | 3 | 5 | 8;

/**
 * 两项显示偏好（= settings.yaml 的 `dshp-file-change-viewer` 分节）。
 *
 * 这是**全局默认值**，也是唯一落盘的一层。会话里还有两层压在它上面：会话页头的两个快捷开关
 * （内存里的会话级覆盖，见 `session.ts`，换会话即失效）与每个文件块自己的临时点击。三层合起来
 * 的优先级是「块自己的点击 > 会话级覆盖 > 这里的全局偏好」。
 */
export interface ViewerPrefs {
  /** 差异展示方式（**默认**值：会话页头可以临时改，改的只是当前会话）。 */
  view: DiffView;
  /**
   * **新渲染**的「编辑 / 写入」操作是否默认展开。
   *
   * 键名 `sectionsOpen` 是历史遗留（它一度只表示「行展开后文件块的开合」），含义已收敛为
   * 「这一行要不要默认展开」：开 = 直接看到改动（行内的文件块也默认展开），
   * 关 = 与思考 / 读取行一致，点一下才展开。只决定**新渲染**时的初始状态，且会被会话级覆盖
   * （会话页头的「展开 / 收起」）与用户对单行/单块的点击压过去。
   */
  sectionsOpen: boolean;
  /**
   * 差异卡片在改动两侧**多显示几行没受影响的上下文**（0 / 3 / 5 / 8）。
   *
   * 上下文取自文件当前内容（Host 的 `/locate` 路由定位后一并回传），**不是**模型在
   * `old_string` / 补丁片段里带的那几行——模型只圈 1 行时，卡片照样看得到前后文。
   * `0` = 只显示模型给的内容（等于旧行为）。
   */
  contextLines: ContextLines;
  /**
   * 是否启用 **`patch` 工具**（测试版，**默认关**）。
   *
   * 这一项与上两项不同：它**不**管渲染，而是决定 Host 半注不注册 `patch` 工具。改完立即经
   * `/ext/.../config` 写回 settings.yaml，Host 在 settings 的 `onChange` 里重新判定——开启后
   * 模型立刻多出这个工具，关掉就消失（正在进行的调用不受影响）。
   */
  patchTool: boolean;
}

/** 偏好字段名（写回 Host 时用）。 */
export type PrefField = 'view' | 'sectionsOpen' | 'patchTool' | 'contextLines';

/** 偏好的保存态（设置节用它显示「已保存 / 正在保存 / 保存失败」）。 */
export type SavePhase = 'idle' | 'loading' | 'saving' | 'ready' | 'error';

/** `GET /ext/dshp-file-change-viewer/state` 与 `POST …/config` 的应答。 */
export interface StateResponse {
  ok: boolean;
  config?: unknown;
  error?: string;
}

/** `POST /ext/dshp-file-change-viewer/config` 的请求体（只允许这三项）。 */
export interface ConfigPatch {
  view?: DiffView | undefined;
  sectionsOpen?: boolean | undefined;
  patchTool?: boolean | undefined;
  contextLines?: ContextLines | undefined;
}

/** 槽位注册选项（keyed 用 key，list 用 id）。 */
export interface SlotRegistrationSpec {
  name: string;
  /** keyed 槽位的分发键（按线上工具名）。 */
  key?: string | undefined;
  /** list 槽位的条目 id。 */
  id?: string | undefined;
  /** list 槽位的排序。 */
  order?: number | undefined;
  /** list 槽位（`settings.section`）在导航里显示的标题。 */
  label?: string | undefined;
  /** 本地化命名空间：传了才会注入 `t`。 */
  locale?: string | undefined;
  /** keyed 槽位的影子化优先级（越小越优先渲染）。 */
  priority?: number | undefined;
}
