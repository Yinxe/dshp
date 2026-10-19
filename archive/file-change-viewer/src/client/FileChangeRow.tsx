/**
 * 文件修改行：接管 `tool.call.toolview` 的 `edit` / `write` 键
 *
 * ## 为什么必须「接管」而不是「叠加」
 *
 * 官方 `file-mutation-toolview` 的展开态是组件内部的 `useState(false)`，折叠态下展开体
 * （`DiffBlock`）根本不挂载，所以「用 CSS 把卡片撑开」走不通。槽位本身是 keyed 且明确允许
 * 替换：「a key the shipped composition already covers is replaced, not shared」。
 *
 * ## 本行怎么做到「跟思考 / 读取行一样」
 *
 * 行的外壳直接用官方 `DisclosureRow` 的**默认样式**（不传任何布局类名）：它的 CSS 模块就是原生
 * 行的几何——`.row{height:24px;display:flex;align-items:center}`、`.leading{16px;margin-right:6px}`、
 * `.title{13px;label-secondary}`、hover 时图标与折叠箭头交叉淡出。官方 `ToolRow` 也只是在这套默认
 * 之上加了几条**工具专属**样式（分隔点、路径链接、统计、Inspect 药丸），所以本插件把那几条逐条
 * 镜像进 `styles.module.css`（CSS Module 局部名、全部走官方 token），不再自造卡片：没有边框、没有底色、没有圆角、
 * 没有自定义背景，行高与间距完全由官方行样式决定。
 *
 * ## 结构
 *
 * ```
 * ▸ 编辑 · src/x.ts            +58 -43        ← 原生行（默认折叠，与读取/思考行一致）
 *    ▾ src/x.ts                +37 -26        ← 每个文件块自己的折叠（默认走会话级覆盖 / 用户偏好）
 *         [差异本体：高亮视图 / ± 差异视图]
 * ```
 *
 * ## 三层优先级（从高到低）
 *
 * ```
 * 块自己的临时点击  >  会话级覆盖（会话页头两个快捷开关）  >  全局用户偏好（设置页那一节）
 * ```
 *
 * - 全局偏好住在 `settings.yaml`（`prefs.ts`），改的入口是设置页本插件那一节；
 * - 会话级覆盖住在内存里（`session.ts`），改的入口是**会话页头**的两个按钮，换会话即失效、绝不落盘；
 * - 单块的点开 / 收起 / 换视图只属于那一个块，不回写任何一层。
 *
 * 前两层的差别只在一处：会话级覆盖一改，本行**作废自己的临时状态**（`UiState.rev`），所以页头
 * 那一下是真正的「全部展开 / 全部收起」，不会被几小时前的一次手动折叠挡回去。
 *
 * @module @dshp/file-change-viewer/client/FileChangeRow
 */
import { useState, type ReactNode } from 'react';
import {
  DisclosureRow,
  FileTypeIcon,
  IconBranchOutlineRegular,
  IconCodeOutlineRegular,
  IconEditOutlineRegular,
  IconPlusOutlineRegular,
  JsonBlock,
  Pill,
  StateDot,
  diffTotals,
} from '@deepseek-ai/dsh-client-ui-primitives';
import { buildModel, displayPath, hasChange } from './diff.js';
import { buildHighlight, createDiffBody } from './diffView.js';
import { languageOf } from './lang.js';
import { locateOf, useLines } from './locate.js';
import { usePrefs } from './prefs.js';
import { useOverride } from './session.js';
import styles from './styles.module.css';
import type { ChangeHunk, FileChangeModel, FileChangeView, FileDiff, ToolViewProps } from './types.js';
import type { UnifiedDiffRow } from './diff.js';

/** 参数原文兜底展示的截断上限（模型产出的 JSON 不可信，见 docs/security.md）。 */
const RAW_MAX_CHARS = 4000;

const RAW_ARGS_LABEL = '原始参数';
const WAITING_TEXT = '等待参数…';
const NEW_FILE_LABEL = '新文件';
const REPLACE_ALL_LABEL = '全部替换';
/** `patch` 工具的标题。conversation 命名空间里没有这个键（它不是官方工具），所以用字面量。 */
const PATCH_TITLE = '补丁';
const UNAVAILABLE_TEXT = '参数不可用';
const ICON_SIZE = 12;
const FILE_ICON_SIZE = 14;
const VIEW_GROUP_LABEL = '差异展示方式';
const VIEW_HIGHLIGHT_LABEL = '高亮';
const VIEW_DIFF_LABEL = '± 差异';
const VIEW_HIGHLIGHT_TITLE = '单代码块统一 diff：整行红绿底色 + 行号 + 语法高亮';
const VIEW_DIFF_TITLE = '官方 ± 差异视图：逐行红绿文字，紧凑，超长中部折叠';

/**
 * 运行时生成的行底色规则用的类名前缀。
 *
 * **刻意不进 CSS Module**：选择器要把 callId 与 hunk 序号拼进去
 * （`.dshp-fcv-lines-<callId>-<index> code>.line:nth-child(n){…}`，见 `diffView.tsx` 的
 * `tintRules`），只能在运行时造字符串，模块里没有、也不需要对应的静态规则，所以它是个模块外的
 * 全局类名（不被哈希）。整份插件只有这里与 `viewCards.tsx` 的 `PREVIEW_LINES_CLASS` 两处。
 */
const TINT_CLASS_PREFIX = 'dshp-fcv-lines-';

/** 本行差异本体那套类名（工具行与设置页样张各用各的，见 `diffView.tsx` 的 DiffBodyClasses）。 */
const diffBody = createDiffBody({
  code: styles.code,
  diff: styles.diff,
  diffWrap: styles.diffWrap,
  ctx: styles.ctx,
  ctxLine: styles.ctxLine,
  muted: styles.muted,
});

/** 匿名调用（没有 callId）时的兜底序号，避免不同行共用同一个类名互相串色。 */
let anonymousCardSeq = 0;

/**
 * 取本行的类名后缀：优先用工具调用 id（稳定、同一行每次渲染都一致）。
 *
 * @param callId - 槽位给的调用 id。
 * @returns 只含 `[A-Za-z0-9_-]` 的短标识。
 */
function cardKeyOf(callId: unknown): string {
  const cleaned = typeof callId === 'string' ? callId.replace(/[^A-Za-z0-9_-]/g, '') : '';
  if (cleaned !== '') return cleaned.slice(0, 40);
  anonymousCardSeq += 1;
  return 'anon' + anonymousCardSeq;
}

/**
 * 数一份文本的行数（空串 0 行；末尾换行不算一行）——与官方 `DiffBlock` 内部口径一致，
 * 所以文件块头部的 `+N -M` 与行头部的 `+A -B` 统计永远对得上。
 *
 * @param text - 旧/新文本。
 * @returns 行数。
 */
function countLines(text: string): number {
  if (text === '') return 0;
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return body.split('\n').length;
}

/**
 * 把节点塞进 `DisclosureRow` 的 `title`。
 *
 * 官方 `DisclosureRowProps.title` 声明成 `string`，但实现是 `children: title`（原样塞进一个
 * `<span>`，见官方 `DisclosureRow.js`），官方 `ToolRow` 也只是传字符串。文件块卡头要的是
 * 「按文件类型图标 + 文件名」这个节点，运行时完全成立，所以在这里按**实现的真实契约**收窄一次——
 * 收在本文件内部，不外泄成一个公共 any。上游若把 `title` 放宽成 `ReactNode`，这个函数可以删掉。
 *
 * @param node - 卡头标题节点。
 * @returns 同一个节点，类型上冒充 string。
 */
function nodeTitle(node: ReactNode): string {
  return node as unknown as string;
}

/** DiffBlock 的本地化文案（字段名与官方 `diffBlockLabels(t)` 一致：0.1.7 起继承 `codeToolbarLabels`，不再有 `files`）。 */
function diffLabels(t: (key: string, params?: Record<string, unknown>) => string) {
  return {
    codeLabel: t('codeBlock.title'),
    wrapLabel: t('codeBlock.wrap'),
    unwrapLabel: t('codeBlock.unwrap'),
    copy: t('copy'),
    copied: t('copied'),
    collapseAria: t('diff.collapseAria'),
    expandAria: (hidden: number) => t('diff.expandAria', { count: hidden }),
    collapse: t('collapse'),
    expand: (hidden: number) => t('diff.expandRest', { count: hidden }),
  };
}

/** 一次调用的临时覆盖（行开合 / 每块开合 / 每块展示方式），跟 callId 绑死。 */
interface UiState {
  callId: string;
  /**
   * 这份临时状态属于会话级覆盖的哪一版（`session.ts` 的 `rev`）。
   *
   * 页头那两个按钮说的是「**所有**文件 diff」，所以点一下必须真的把所有行翻过去——包括用户
   * 之前手动折叠过的那几行。可「行自己的覆盖优先」又意味着那些行不会动。两者靠这个版本号调和：
   * 覆盖一改 `rev` 就变，本行发现手里这份状态过期了就整个丢掉（下面的 `newUiState`）。于是页头
   * 那一下是真正的一键全改，而改完之后用户再单独点某一行，依然由用户说了算。
   */
  rev: number;
  /**
   * 行自己的临时开合；`null` = 用户没点过这一行 → **实时跟随会话级覆盖 / 用户偏好**。
   *
   * 「跟随」而不是「渲染时快照」：设置里把开关打开（或在页头点「全部展开」），会话里这些
   * 编辑 / 写入行应当立刻展开（用户要的就是一眼看到代码），而不是只对之后新出现的行生效。
   * 用户手动点过的那一行例外——那一刻起由用户说了算，那两个开关不再动它。
   */
  row: boolean | null;
  sections: Record<number, boolean>;
  views: Record<number, FileChangeView>;
}

/** 新调用 / 会话级覆盖换了一版 = 一份干净的覆盖（一切跟随会话级覆盖与用户偏好）。 */
function newUiState(callId: string, rev: number): UiState {
  return { callId, rev, row: null, sections: {}, views: {} };
}

/**
 * 文件修改行组件（`tool.call.toolview` 的 edit / write / str_replace_editor / patch 四种键共用）。
 *
 * @param props - 槽位给的调用块、会话与本地化 props。
 * @returns 原生形态的行 + 每个文件块的差异卡片。
 */
export function FileChangeRow(props: ToolViewProps): ReactNode {
  // t 由注册时的 `locale: 'conversation'` 注入；万一宿主换了契约，退化成显示键名而不是让行抛错。
  const t = typeof props.t === 'function' ? props.t : (key: string): string => key;
  const prefs = usePrefs();
  // 订阅行号缓存：定位结果回来了（或新一批发出去了）就重渲染，把真实行号填上。
  useLines();
  // 会话级覆盖（页头快捷开关）。`sessionId` 是槽位的标准 prop，取不到就没有覆盖（见 session.ts）。
  const override = useOverride(props.sessionId);
  const rev = override.rev;

  /**
   * 临时覆盖（都不落盘）：行自己的开合 + 每个文件块的开合与展示方式。
   *
   * 三样东西一起挂在**这次调用的 callId** 上，原因是宿主渲染工具行时用的是
   * `react.memo(ToolCall)`、列表上又没有显式 key：窗口滚动 / 截断 / 新调用插入时，React 可能
   * 在同一个位置**复用组件实例**去渲染另一次调用。若覆盖状态只按 `index` 存，上一行「我手动
   * 折叠过第 0 块」就会漏到新行上——表现正是「新出现的编辑 / 写入行不跟随偏好」。
   *
   * `rev` 一起比对：会话级覆盖改过之后，旧那份临时状态必须作废（否则页头的「全部展开」会被
   * 用户几分钟前的一次手动折叠挡回去）。
   */
  const [ui, setUi] = useState<UiState>(() => newUiState(props.callId, rev));
  const bound = ui.callId === props.callId && ui.rev === rev ? ui : newUiState(props.callId, rev);
  const patchUi = (fields: Partial<UiState>): void => {
    setUi((prev) => {
      const base = prev.callId === props.callId && prev.rev === rev ? prev : newUiState(props.callId, rev);
      return { ...base, ...fields };
    });
  };
  /**
   * 生效的默认开合：**会话级覆盖 > 全局偏好**（用户手动点过的那一行/块仍然最高，见 `bound`）。
   * 关 = 与思考 / 读取行一致的原生折叠。
   */
  const defaultOpen = override.expanded ?? prefs.sectionsOpen;
  const rowOpen = bound.row ?? defaultOpen;

  const model: FileChangeModel = buildModel(props.toolName, props.block);
  // 统计口径 = **语义变更**（LCS 之后真正变化的行），不是工具原文的行数：
  // `edit` 写进 meta.diffs 的 oldText / newText 是模型的 old_string / new_string 原文，
  // 为了让 old_string 唯一，里面常常带着未变的上下文行——直接计数会把一次单行替换报成 +7 -7，
  // 与高亮视图看到的「只改了一行」自相矛盾。hunks 已经在 buildModel 里跑过一次 LCS。
  const changed = model.hunks.some(hasChange);
  const statDiffs: FileDiff[] = changed
    ? model.hunks.map((hunk) => hunk.changed)
    : model.hunks.map((hunk) => hunk.raw);
  const totals = diffTotals(statDiffs);
  const first = model.hunks[0];
  const rawPath = first === undefined ? undefined : first.raw.path;

  /**
   * 每个 hunk 的定位结果（真实起始行号 + 两侧上下文），一次查询两处都用。
   *
   * 行号有三条来源，优先用最确定的：
   * 1. `hunk.raw.startLine` —— 本插件 `patch` 工具落盘时算出的确切行号；
   * 2. `locate.ts` 的缓存 —— edit / write 的元数据没有偏移，靠 Host 拿文件内容定位（异步，
   *    拿到后经订阅重渲染填上）；
   * 3. 都还没有 → 1（老老实实从 1 开始，不编数字）。
   *
   * 上下文则**只**来自第 2 条（文件当前内容），与模型在 `old_string` / 补丁片段里带了多少行无关。
   */
  const locatedHunks = model.hunks.map((hunk) =>
    locateOf(hunk.raw.path, hunk.raw.newText, hunk.raw.oldText, props.cwd),
  );
  const startLines = model.hunks.map((hunk, index) => {
    if (typeof hunk.raw.startLine === 'number' && hunk.raw.startLine > 0) return hunk.raw.startLine;
    const located = locatedHunks[index];
    const line = located === null || located === undefined ? null : located.line;
    return typeof line === 'number' && line > 0 ? line : 1;
  });

  /**
   * 每个 hunk 要**额外补**的上下文（按偏好截；0 行 = 不补）。
   *
   * Host 一次给足 8 行，这里截成偏好值——所以改「上下文行数」不必重新问 Host，只是重渲染。
   */
  const contexts = model.hunks.map((_hunk, index) => {
    const located = locatedHunks[index];
    const want = prefs.contextLines;
    if (located === null || located === undefined || want === 0) return { before: [], after: [] };
    return { before: located.before.slice(-want), after: located.after.slice(0, want) };
  });

  /**
   * 渲染用的行 = 上文 + 本 hunk 的 LCS 结果 + 下文；起始行号相应前移，于是行号仍然是真的。
   *
   * 高亮视图与 ± 差异视图共用这一份素材：前者把它当代码块（行号 + 可着色区间），后者把
   * 上下文单独渲染成中性行（官方 `DiffBlock` 只有 `del` / `add` 两种行，画不了中性上下文）。
   */
  const rowsOf = (index: number): UnifiedDiffRow[] => {
    const hunk = model.hunks[index];
    if (hunk === undefined) return [];
    const context = contexts[index] ?? { before: [], after: [] };
    return [
      ...context.before.map((text): UnifiedDiffRow => ({ kind: 'ctx', text })),
      ...hunk.rows,
      ...context.after.map((text): UnifiedDiffRow => ({ kind: 'ctx', text })),
    ];
  };
  const startOf = (index: number): number =>
    Math.max(1, (startLines[index] ?? 1) - (contexts[index]?.before.length ?? 0));

  // 行内按钮（路径 / 查看）不得触发行点击的折叠：官方 ToolRow 对文件链接做同样处理。
  const stopKeyToggle = (event: { key?: string; stopPropagation: () => void }): void => {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  };

  /**
   * 绿增红删的统计：每侧一个图标 + 数字。
   *
   * `+` 用官方 `IconPlusOutlineRegular`。官方图标集里**没有减号**，所以减号用一个同 16px 网格、
   * `currentColor` 的一图元内联 SVG（一条圆角横杠），颜色仍由父级的 token 决定。
   */
  const renderStat = (added: number, removed: number): ReactNode => (
    <span className={styles.stat}>
      <span className={styles.statPart + ' ' + styles.add}>
        <IconPlusOutlineRegular size={ICON_SIZE} />
        {String(added)}
      </span>
      <span className={styles.statPart + ' ' + styles.del}>
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" aria-hidden>
          <rect x={3} y={7.25} width={10} height={1.5} rx={0.75} fill="currentColor" />
        </svg>
        {String(removed)}
      </span>
    </span>
  );

  /** 单块视图切换：两个官方 Pill 组成的小分段控件（状态可见，点一下就换，不写回偏好）。 */
  const renderViewSwitch = (index: number, current: FileChangeView): ReactNode => {
    const pill = (view: FileChangeView, label: string, icon: ReactNode): ReactNode => (
      <Pill
        key={view}
        active={current === view}
        className={styles.viewPill}
        title={view === 'highlight' ? VIEW_HIGHLIGHT_TITLE : VIEW_DIFF_TITLE}
        onClick={(event) => {
          // 卡头整行是可折叠按钮，控件必须挡住冒泡，否则点一下顺带折叠。
          event.stopPropagation();
          patchUi({ views: { ...bound.views, [index]: view } });
        }}
      >
        {icon}
        {label}
      </Pill>
    );
    return (
      <span className={styles.viewGroup} role="group" aria-label={VIEW_GROUP_LABEL}>
        {pill('highlight', VIEW_HIGHLIGHT_LABEL, <IconCodeOutlineRegular size={ICON_SIZE} />)}
        {pill('diff', VIEW_DIFF_LABEL, <IconBranchOutlineRegular size={ICON_SIZE} />)}
      </span>
    );
  };

  /**
   * 路径：有 openFile 时是可点链接（官方 fileLink 样式），否则是普通 summary 文本。
   *
   * @param path - 工具参数里的原始路径。
   * @param line - 已知的真实起始行号时一并带上，点开就落在改动处。
   */
  const renderPath = (path: string, line?: number): ReactNode => {
    const label = displayPath(path, props.cwd, props.home);
    const openFile = props.openFile;
    if (typeof openFile !== 'function') {
      return <span className={styles.summary}>{label}</span>;
    }
    return (
      <button
        type="button"
        className={styles.path}
        title={path}
        onClick={(event) => {
          event.stopPropagation();
          if (typeof line === 'number' && line > 1) openFile(path, { line });
          else openFile(path);
        }}
        onKeyDown={stopKeyToggle}
      >
        {label}
      </button>
    );
  };

  // 没有路径可显示时的兜底文案：还在跑 = 参数没开始流；已结算却读不到 = 调用头被窗口截断。
  const unavailableText = model.state === 'running' ? WAITING_TEXT : UNAVAILABLE_TEXT;

  // ── 行头（原生行）：[图标] 编辑 [· 路径] [+58 -43] ──────────────────────────
  const failed = model.state === 'error' && model.errorText !== null;
  const summaryChildren: ReactNode[] = failed
    ? [<span className={styles.errorSummary}>{model.errorText}</span>]
    : [
        <span className={styles.sep} />,
        rawPath === undefined ? (
          <span className={styles.summary}>{unavailableText}</span>
        ) : (
          renderPath(rawPath, startLines[0])
        ),
        model.hunks.length > 0 ? renderStat(totals.added, totals.removed) : null,
        model.newFile ? <span className={styles.stat + ' ' + styles.note}>{NEW_FILE_LABEL}</span> : null,
        model.replaceAll ? (
          <span className={styles.stat + ' ' + styles.note}>{REPLACE_ALL_LABEL}</span>
        ) : null,
      ];

  // ── 每个文件块：自己的折叠（默认走会话级覆盖 / 用户偏好，单块可临时覆盖） ────
  const cardKey = cardKeyOf(props.callId);

  /**
   * 高亮视图每个 hunk 的素材（含它自己的行底色规则）。
   *
   * `rows` = 上文 + buildModel 的 LCS 结果 + 下文；`startLine` 也一并前移，所以代码块左侧的
   * 行号仍然是文件里的真实行号（上下文行照常占号，删除行不占号）。渲染本身在 `diffView.tsx`
   * （与设置页「展示方式」两卡的样张共用同一份代码）。
   */
  const highlightHunks = model.hunks.map((_hunk, index) =>
    buildHighlight({
      rows: rowsOf(index),
      startLine: startOf(index),
      language: languageOf(model.hunks[index]?.raw.path ?? ''),
      codeClass: TINT_CLASS_PREFIX + cardKey + '-' + index,
    }),
  );

  const tintCss = highlightHunks
    .map((hunk) => hunk.css)
    .filter((css) => css !== '')
    .join('\n');

  /** 高亮视图：官方 CodeBlock + 按行区间叠的整行红绿底色（一个代码块里看增删）。 */
  const renderHighlight = (index: number): ReactNode[] => {
    const hunk = highlightHunks[index];
    if (hunk === undefined) return [];
    return diffBody.code(hunk, t('copy'), t('copied'));
  };

  /**
   * ± 差异视图：官方 DiffBlock 的逐行红绿合并 diff（紧凑，超长中部折叠）。
   *
   * 喂给它的是**语义变更**（只有删除行与新增行），所以它给出的 `+A -B` 与高亮视图、行头统计一致；
   * 官方自己的做法是把原文整段列成 `-`、整段列成 `+`（一次单行替换看起来像整段重写）。
   * 每张卡只喂自己那一个 hunk——官方 DiffBlock 会把 `diffs` 里所有文件都渲染出来。
   *
   * 上下文单独渲染成中性行贴在它上下：官方块虽然从 0.1.7 起也认 `context` 行 kind，但它喂的是
   * **语义变更**（无前后文），自算的 hunk 里一般不会出现上下文行；上下文塞进 `diffs` 反而会被
   * 说成改了，所以仍由本插件渲染（万一官方内部真算出上下文行，插件的行号选择器对不上时只是
   * 那几行留空号位，不报错）。
   *
   * `beforeLine` 把「上文首行的真实行号」带进去，上下文行由此带上行号（见 diffView 的
   * `context`）；`startOf(index)` 与高亮视图同源，两个视图的行号说的是同一件事。
   *
   * **改动行不编号**：官方块内的行号列里只放 `+` / `-` 符号（见 diffView 的 `diffSignRules`）——
   * 官方的前缀符号在改动行里改成画在行号列上、内容照旧只含语义变更，这样「上下文行号 / 改动
   * 符号」共用一列，上下文行与改动行的正文列位严格对齐（这就是这一版的验收口径）。
   * locate / startLine 都拿不到时上下文行同样不带号，绝不编数。
   */
  const renderDiff = (index: number, fallback: FileDiff): ReactNode => {
    const context = contexts[index] ?? { before: [], after: [] };
    return diffBody.lines({
      diff: statDiffs[index] ?? fallback,
      before: context.before,
      after: context.after,
      labels: diffLabels(t),
      key: 'diff' + index,
      beforeLine: context.before.length > 0 ? startOf(index) : undefined,
      hunkClass: TINT_CLASS_PREFIX + cardKey + '-d' + index,
    });
  };

  const renderSections = (): ReactNode[] => {
    const nodes: ReactNode[] = [];
    // 每个块的展示方式：块自己的临时覆盖 > 会话级覆盖（页头按钮） > 全局偏好。
    const viewOf = (index: number): FileChangeView => bound.views[index] ?? override.view ?? prefs.view;
    // 一条 <style> 承担整行所有文件块的行底色，随行一起卸载；规则都用本行的类名限定。
    // 只要还有块用高亮视图就注入（切到 ± 差异的块用不到，规则是惰性的）。
    if (tintCss !== '' && model.hunks.some((_hunk, index) => viewOf(index) === 'highlight')) {
      nodes.push(<style key="tint">{tintCss}</style>);
    }
    model.hunks.forEach((hunk: ChangeHunk, index: number) => {
      const shown = statDiffs[index] ?? hunk.raw;
      // 文件块同样：块自己的临时覆盖 > 会话级覆盖 > 全局偏好。
      const open = bound.sections[index] ?? defaultOpen;
      const view = viewOf(index);
      nodes.push(
        <div className={styles.card} key={'card' + index}>
          <DisclosureRow
            // 卡头就是这一行的 row：文件名作标题、统计与视图切换放右侧，整行仍可点着折叠。
            rowClassName={styles.cardRow}
            titleClassName={styles.cardTitle}
            // 官方 DisclosureRowProps.icon 是必填，而文件块刻意**不用** leading 图标
            // （类型图标挂在标题里，见下）——原来没传这个 prop，运行时就是空位，这里显式写 null。
            icon={null}
            // 文件名前挂官方「按文件类型」图标（FileTypeIcon 自己从扩展名判类型）。
            title={nodeTitle(
              <span className={styles.cardName}>
                <FileTypeIcon path={hunk.raw.path} size={FILE_ICON_SIZE} className={styles.fileIcon} />
                <span className={styles.cardNameText}>
                  {/* 改名 / 移动（本插件 patch 的 `*** Move to:`）显示成「旧 → 新」；
                      其余工具没有 oldPath，行为与以前完全一样。 */}
                  {hunk.raw.oldPath === undefined
                    ? displayPath(hunk.raw.path, props.cwd, props.home)
                    : displayPath(hunk.raw.oldPath, props.cwd, props.home) +
                      ' → ' +
                      displayPath(hunk.raw.path, props.cwd, props.home)}
                </span>
              </span>,
            )}
            open={open}
            expandable
            expandOnRowClick
            keepContentWhenOpen
            onToggle={() => patchUi({ sections: { ...bound.sections, [index]: !open } })}
            collapsedContent={[
              // 卡头统计与行头同口径（语义变更），所以卡头数字和它自己的高亮 / ± 视图永远对得上。
              renderStat(countLines(shown.newText), countLines(shown.oldText ?? '')),
              renderViewSwitch(index, view),
            ]}
          >
            {view === 'highlight' ? renderHighlight(index) : renderDiff(index, hunk.raw)}
          </DisclosureRow>
        </div>,
      );
    });
    return nodes;
  };

  // 没有可推导的变更时（窗口截断 / 未知的工具参数形态）退到原始参数：
  // 能解析成对象就交给官方 JsonBlock（自带截断保护），否则原样打印并截断。
  const fallback =
    model.parsedArgs !== null ? (
      <JsonBlock
        label={RAW_ARGS_LABEL}
        payload={model.parsedArgs}
        defaultOpen
        truncatedLabel={(total: number) => '已截断，共 ' + total + ' 字符'}
      />
    ) : (
      <div className={styles.summary}>
        {model.rawArgs === ''
          ? unavailableText
          : model.rawArgs.slice(0, RAW_MAX_CHARS) + (model.rawArgs.length > RAW_MAX_CHARS ? '…' : '')}
      </div>
    );

  const inspectNode =
    typeof props.inspect === 'function' ? (
      <button
        type="button"
        className={styles.inspect}
        onClick={(event) => {
          event.stopPropagation();
          if (typeof props.inspect === 'function') props.inspect();
        }}
        onKeyDown={stopKeyToggle}
      >
        {t('row.inspect')}
      </button>
    ) : null;

  const body = (
    <div className={styles.body}>
      {model.hunks.length === 0 ? fallback : renderSections()}
      {inspectNode}
    </div>
  );

  return (
    <DisclosureRow
      // 只挂一个类用于「hover 行时显示查看药丸」（`.rowRoot:hover .inspect`），不改任何布局 / 配色。
      className={styles.rowRoot}
      // 刻意**不传** rowClassName：行的几何（高度、图标位、标题字号、hover 折叠箭头）全部来自官方
      // DisclosureRow 的默认 CSS。以前这里挂过一个无样式的 `fcv-toolRow` 标记类，纯属摆设——
      // 不传才是「与思考 / 读取行长得一样」这件事的真实断言（冒烟测试断言它是 undefined）。
      icon={model.state === 'error' ? <StateDot state="error" /> : <IconEditOutlineRegular size={14} />}
      title={
        props.toolName === 'patch'
          ? PATCH_TITLE
          : t(props.toolName === 'write' ? 'tool.title.write' : 'tool.title.edit')
      }
      open={rowOpen}
      expandable
      expandOnRowClick
      keepContentWhenOpen
      onToggle={() => patchUi({ row: !rowOpen })}
      collapsedContent={summaryChildren}
    >
      {body}
    </DisclosureRow>
  );
}
