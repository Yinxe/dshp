/**
 * 差异本体的渲染（工具行与设置页预览共用）
 *
 * 同一个 hunk 有两种画法，而**两个地方**都要用：
 *
 * | 视图        | 组件（官方 primitives） | 谁在用                                          |
 * | ----------- | ----------------------- | ----------------------------------------------- |
 * | `highlight` | `CodeBlock`             | 工具行的文件块、设置页「高亮」卡的预览           |
 * | `diff`      | `DiffBlock`             | 工具行的文件块、设置页「± 差异」卡的预览         |
 *
 * 设置页要把两种效果**直接画出来**给用户挑（见 `viewCards.tsx`）。如果那边再写一遍渲染，
 * 两边迟早漂移——「预览里长这样、真正用起来却长那样」比没有预览更糟。所以渲染在这里收口：
 * 工具行与设置预览调的是同一份代码。
 *
 * **类名一律由调用方传入**：工具行与设置节的类名集合必须两两不相交（见 `styles.ts` 的告警，
 * 也见 `scripts/check-client.mjs` 的撞车护卫），所以本模块不硬编码任何类名，只按调用方给的
 * 前缀拼。同理，高亮视图的「按行区间上底色」需要一段**动态** CSS，片段由 {@link tintRules}
 * 生成、由调用方注入到它自己的类名作用域里。
 *
 * @module @dshp/file-change-viewer/client/diffView
 */
import type { ReactNode } from 'react';
import { CodeBlock, DiffBlock } from '@deepseek-ai/dsh-client-ui-primitives';
import { toDiffText } from './diff.js';
import type { DiffBlockLabels, FileDiff, UnifiedDiffKind, UnifiedDiffRow } from './types.js';

/**
 * 数一份文本的行数（空串 0 行；末尾换行不算一行）——与官方 `DiffBlock` 内部口径一致。
 * 给 ± 视图算下文的起始行号用：上文尾号 + 新增行数（删除行不占新行号）。
 */
function countLines(text: string): number {
  if (text === '') return 0;
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return body.split('\n').length;
}

/**
 * 给 ± 差异视图的官方 `DiffBlock` 生成「改动行行号」的动态 CSS。
 *
 * 官方块内部没有编号机制，body 是块根的**第二个 div**（0.1.7 起第一个子 div 是 CodeToolbar）。
 * 行序按官方 buildRows 为 `path 行(1 个，已由样式隐藏) → 若干 hunk 行`；本插件喂的是**语义
 * 变更**（只含删除行与新增行），绝大多数 hunk 就是 `del × D → add × A`（折叠按钮是 button，
 * 不参与 div 计数）。万一 ± 片段里存在共同行，官方会算出内部 context 行、令区间错位——后果只是
 * 那几行的符号/留号不准，不报错。这些结构事实足够：
 * 用**本 hunk 独有的类名**（调用方拼在 DiffBlock 的 className 上）限定，按 `div:nth-of-type`
 * 区间给 del / add 行各叠一个 CSS 计数器，行号画在 `::after`（绝对定位到行盒左缘，与
 * 上下文行号同一列）。
 *
 * 行号口径：**改动行不编号**——官方块内 `+` / `-` 占的就是上下文行号那一列，正文因此与上下文行
 * 严格对齐；上下文行的新行号由调用方按 locate 结果推算（见 {@link DiffBody.lines}）。
 *
 * @param blockClass - 本 hunk 独有的类名（挂在 DiffBlock 根上）。
 * @param delCount - 删除行数。
 * @param addCount - 新增行数。
 * @returns CSS 文本；没有改动行时为空串。
 */
export function diffSignRules(blockClass: string, delCount: number, addCount: number): string {
  if (delCount <= 0 && addCount <= 0) return '';
  const rows = '.' + blockClass + '[data-diff]>div:nth-of-type(2)';
  // path 行之后的 div 依次是 del × D、add × A；div:nth-of-type 从 1 数，path 占第 1 位。
  const delFrom = 2;
  const delTo = 1 + delCount;
  const addFrom = delTo + 1;
  const addTo = delTo + addCount;
  /**
   * 行号列：**改动行里放的就是 `+` / `-` 本身**，与上下文行的行号共用同一列
   * （`3ch` + `12px` 间隙，见 `.ctxLine::before`），于是「上下文行号 / 改动符号 / 正文」
   * 三者的列位严格对齐——这正是本视图的验收口径。
   *
   * 官方的前缀符号是行内 `::before`（`content: '- '`），会把正文再推右两个字符、破掉对齐，
   * 所以这里把它压掉（`content: none`），改在自己的 `::after` 里画符号；正文只由
   * `padding-inline-start` 让出那一列。
   */
  const col = 'padding-inline-start:calc(3ch + 12px)';
  const rules: string[] = [];
  if (delCount > 0) {
    const delRange = rows + '>div:nth-of-type(n+' + delFrom + '):nth-of-type(-n+' + delTo + ')';
    rules.push(delRange + '{' + col + '}');
    rules.push(delRange + '::before{content:none}');
    rules.push(delRange + "::after{content:'-';color:var(--dsw-alias-state-error-primary)}");
  }
  if (addCount > 0) {
    const addRange = rows + '>div:nth-of-type(n+' + addFrom + '):nth-of-type(-n+' + addTo + ')';
    rules.push(addRange + '{' + col + '}');
    rules.push(addRange + '::before{content:none}');
    rules.push(addRange + "::after{content:'+';color:var(--dsw-alias-state-success-primary)}");
  }
  return rules.join('\n');
}

/**
 * 高亮视图单块一次渲染的行数上限。
 *
 * `CodeBlock` 没有 `maxLines`（不像 `DiffBlock` 会折叠中部），有多少行就渲染多少个高亮 span，
 * 所以必须自己封顶：400 行足够覆盖几乎所有 edit hunk 与大多数新文件，超出的部分在块下面用
 * 一行提示说明「改用 ± 视图可展开查看」。
 */
export const HIGHLIGHT_MAX_LINES = 400;

/** ± 差异视图交给 `DiffBlock` 的展开上限（超出由它自己折叠中部）。 */
export const DIFF_MAX_LINES = 200;

/** 高亮视图封顶后的去处提示。 */
export const OVERFLOW_HINT = '切换到 ± 差异视图可展开';

/**
 * 把某一类行（删 / 增）合并成尽量少的选择器：连续区间用 `:nth-child(n+a):nth-child(-n+b)`。
 *
 * @param codeClass - 本 hunk 独有的类名。
 * @param rows - 渲染出来的行。
 * @param kind - 要命中的行类型。
 * @returns 选择器数组；没有这种行时为空数组（调用方需要逐个追加伪元素，所以不在这里 join）。
 */
function rangeSelectors(codeClass: string, rows: readonly UnifiedDiffRow[], kind: UnifiedDiffKind): string[] {
  const selectors: string[] = [];
  let start = -1;
  for (let i = 0; i <= rows.length; i += 1) {
    const row = rows[i];
    const matches = row !== undefined && row.kind === kind;
    if (matches && start < 0) start = i;
    if (!matches && start >= 0) {
      const from = start + 1;
      const to = i;
      selectors.push(
        from === to
          ? '.' + codeClass + ' code>.line:nth-child(' + from + ')'
          : '.' + codeClass + ' code>.line:nth-child(n+' + from + '):nth-child(-n+' + to + ')',
      );
      start = -1;
    }
  }
  return selectors;
}

/**
 * 生成「按行上底色 + 让删除行不占行号」的 CSS 规则。
 *
 * 官方 `CodeBlock` 没有逐行样式的 API，但它的行号模式给了三个可依赖的事实：每行是
 * `code > .line`（类名 `line` 是**未哈希**的固定名）、是块级元素（底色能铺满整行）、行号由官方
 * CSS 计数器 `counter-increment: source-line` 逐行自增。于是按行区间生成规则：连续的同类行并成
 * 一个区间选择器，正常 diff 一个 hunk 只会产出 2–4 条。
 *
 * **删除行不占行号**：行号取「新文件视角」——上下文行与新增行依次占号，删除行既不显示数字也不
 * 推进计数器（`counter-increment:none` + `:before{content:""}`），于是新文件行号连续、不会被已
 * 删除的行顶掉（与 GitHub 统一 diff 的「新列」一致）。
 *
 * 唯一的耦合点就是 `code > .line` 这个结构与那两个官方属性；上游若改结构，**后果只是底色与留空
 * 消失**（代码块、语法高亮、复制照常），不会报错。颜色不在这里写死：引用调用方作用域里定义的
 * `--fcv-del-bg` / `--fcv-add-bg`（它们本身又是官方 token）。
 *
 * @param codeClass - 本 hunk 独有的类名（挂在 CodeBlock 根上），避免不同行互相串色。
 * @param rows - 该 hunk 实际渲染出来的行。
 * @param startLine - 该 hunk 首行在文件里的真实行号（1 起）。
 * @returns 若干条 CSS 规则（没有变更行时为空串）。
 */
export function tintRules(codeClass: string, rows: readonly UnifiedDiffRow[], startLine: number): string {
  const rules: string[] = [];

  // 真实行号：官方把 `counter-reset:source-line` 放在 code 上（`._numbered_ :where(pre) code`，
  // 特异性 0,1,0），默认从 1 数起。这里在本 hunk 独有的类名下标一次（特异性 0,1,1 更胜），
  // 于是首行编号就是它在文件里的真实行号；删除行照旧不占号、不推进计数器。
  if (startLine > 1) rules.push('.' + codeClass + ' code{counter-reset:source-line ' + (startLine - 1) + '}');

  const del = rangeSelectors(codeClass, rows, 'del');
  if (del.length > 0) {
    rules.push(del.join(',') + '{counter-increment:none;background:var(--fcv-del-bg)}');
    // 官方行号是绝对定位的 :before（content:counter(source-line)），清空即留空号位，不挤动代码。
    rules.push(del.map((selector) => selector + ':before').join(',') + '{content:""}');
  }

  const add = rangeSelectors(codeClass, rows, 'add');
  if (add.length > 0) rules.push(add.join(',') + '{background:var(--fcv-add-bg)}');

  return rules.join('\n');
}

/** 一个 hunk 在高亮视图里要用的全部素材（含它自己的行底色规则）。 */
export interface HighlightMaterial {
  /** 该 hunk 的完整行（调用方已把上下文并进来）。 */
  rows: readonly UnifiedDiffRow[];
  /** 实际渲染出去的行（超出 {@link HIGHLIGHT_MAX_LINES} 时是它的前缀）。 */
  shown: readonly UnifiedDiffRow[];
  /** 是否被封顶截断。 */
  overflow: boolean;
  /** 本 hunk 独有的类名（行底色规则挂在它上面）。 */
  codeClass: string;
  /** 官方语法 id；`null` = 不传 lang，让 CodeBlock 退化成纯文本。 */
  language: string | null;
  /** 首行的真实行号。 */
  startLine: number;
  /** 本 hunk 的动态 CSS（行底色 + 行号起点）；没有内容时为空串。 */
  css: string;
}

/**
 * 为一个 hunk 算好高亮视图的素材（封顶 + 行底色规则）。
 *
 * @param args - 行、真实起始行号、语法 id、以及本 hunk 独有的类名。
 * @returns 可直接交给 {@link createDiffBody} 的 `code` 渲染。
 */
export function buildHighlight(args: {
  rows: readonly UnifiedDiffRow[];
  startLine: number;
  language: string | null;
  codeClass: string;
}): HighlightMaterial {
  const overflow = args.rows.length > HIGHLIGHT_MAX_LINES;
  const shown = overflow ? args.rows.slice(0, HIGHLIGHT_MAX_LINES) : args.rows;
  return {
    rows: args.rows,
    shown,
    overflow,
    codeClass: args.codeClass,
    language: args.language,
    startLine: args.startLine,
    css: args.rows.length === 0 ? '' : tintRules(args.codeClass, shown, args.startLine),
  };
}

/**
 * 两套版式各自的类名。
 *
 * 工具行传 `styles` 里那一套（`code` / `diff` / `diffWrap` / `ctx` / `ctxLine` / `muted`），
 * 设置页预览传样张那一套（`pvCode` / `pvDiff` / …）——都在同一个 CSS Module 里，是两个不同的
 * 局部名，所以两处版式天然互不串味（`styles.module.css` 头部有说明）。
 *
 * 字段类型是 `string | undefined` 而不是 `string`：CSS Module 的声明是宽松的（见
 * `shared/types/css-modules.d.ts`），索引访问在 `noUncheckedIndexedAccess` 下带 `undefined`。
 * 值传进来的那一刻是确定的，所以只需要在这里接受它，而不是在每个调用点加 `!`。
 */
export type ClassName = string | undefined;

export interface DiffBodyClasses {
  /** `CodeBlock` 根上的类（外壳/底色由调用方的卡片提供）。 */
  code: ClassName;
  /** `DiffBlock` 根上的类。 */
  diff: ClassName;
  /** ± 视图的最外层（上下文 + DiffBlock + 上下文）。 */
  diffWrap: ClassName;
  /** ± 视图里中性上下文的容器。 */
  ctx: ClassName;
  /** ± 视图里单行上下文。 */
  ctxLine: ClassName;
  /** 封顶提示那一行。 */
  muted: ClassName;
}

/** 差异正文渲染器（`createDiffBody` 的产物）。 */
export interface DiffBody {
  /**
   * 高亮视图：官方 `CodeBlock` + 按行区间叠的整行红绿底色（一个代码块里看增删）。
   *
   * @param material - {@link buildHighlight} 的产物。
   * @param copyLabel - 复制按钮文案（官方按钮不传就是空标签）。
   * @param copiedLabel - 复制成功文案。
   * @returns 代码块与（可能有的）封顶提示；没有内容时为空数组。
   */
  code: (material: HighlightMaterial, copyLabel: string, copiedLabel: string) => ReactNode[];
  /**
   * ± 差异视图：官方 `DiffBlock` 的逐行红绿合并 diff（紧凑，超长中部折叠）。
   *
   * 喂进去的是**语义变更**（只有删除行与新增行），所以它给出的 `+A -B` 与高亮视图、行头统计一致。
   * 上下文单独渲染成中性行贴在它上下：官方 DiffBlock 的行 kind 只有 `path | del | add | gap`，
   * **画不了中性的上下文行**，塞进 `diffs` 只会变成绿色 `+` 或红色 `-`，把没改的行说成改了。
   *
   * @param args - 变更本体、前后上下文、本地化文案与（可选的）展开上限。
   * @returns 差异视图元素。
   */
  lines: (args: {
    diff: FileDiff;
    before: readonly string[];
    after: readonly string[];
    labels: DiffBlockLabels;
    maxLines?: number | undefined;
    key?: string | undefined;
    /** 上文首行在文件里的真实行号（1 起）；有上文时给上下文行编号用，下文行号由它推出。 */
    beforeLine?: number | undefined;
    /**
     * 本 hunk 独有的类名。官方 `DiffBlock` 的 `+` / `-` 前缀与本插件给上下文行加的行号要落在
     * **同一列**，而官方行没有编号机制，只能靠一段以本类名限定的动态规则（见
     * {@link diffSignRules}）把行内前缀压掉、改画在行号列上；缺省时改动行保持官方原样（只有
     * 行内前缀、不与上下文对齐）——设置页的样张就是这种情况。
     */
    hunkClass?: string | undefined;
  }) => ReactNode;
}

/**
 * 造差异正文渲染器。
 *
 * 只需要两套类名当参数：React 与 primitives 现在是**顶层 import**（react / primitives 都在
 * bundle 的 external 列表里，运行时由 shell 的冻结模块表解析），不再由工厂注入。
 *
 * @param cn - 调用方那套类名。
 * @returns 高亮 / ± 两个视图的渲染函数。
 */
export function createDiffBody(cn: DiffBodyClasses): DiffBody {
  /**
   * ± 视图的中性上下文行（官方 DiffBlock 画不了，见 {@link DiffBody.lines}）。
   *
   * `startLine` 有值时行首带真实行号：`.ctxLine` 的 CSS 计数器（`dshp-fcv-num`）从
   * `startLine - 1` 起数，逐行 `counter-increment` 出 1——于是上文按文件真实行号编号，
   * 下文的起始号由调用方算好传入（上文尾号 + 官方块内的语义行数）。行号列的宽窄、
   * 淡化与不可选中都由 CSS 决定，这里只负责喂起始值。
   */
  function context(lines: readonly string[], key: string, startLine?: number | undefined): ReactNode {
    if (lines.length === 0) return null;
    return (
      <div
        className={cn.ctx}
        key={key}
        style={
          typeof startLine === 'number' && startLine > 0
            ? { counterReset: 'dshp-fcv-num ' + (startLine - 1) }
            : undefined
        }
      >
        {lines.map((text, at) => (
          <div className={cn.ctxLine} key={at}>
            {text === '' ? ' ' : text}
          </div>
        ))}
      </div>
    );
  }

  return {
    code(material, copyLabel, copiedLabel) {
      if (material.rows.length === 0) return [];
      return [
        <CodeBlock
          key="code"
          code={toDiffText(material.shown)}
          lang={material.language === null ? undefined : material.language}
          className={cn.code + ' ' + material.codeClass}
          lineNumbers
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
        />,
        material.overflow ? (
          <div className={cn.muted} key="overflow">
            {'… 其余 ' + (material.rows.length - HIGHLIGHT_MAX_LINES) + ' 行未显示（' + OVERFLOW_HINT + '）'}
          </div>
        ) : null,
      ];
    },

    lines(args) {
      // 下文起始行号：上文首行 + 上文行数（上文在文件里是连续的），再跳过官方块内代表的
      // 「语义增删」——新增行各占一个新行号，删除行不占（与高亮视图的行号口径一致，
      // 都是「新文件视角」）。没有 beforeLine（定位不到）时下文同样不带号。
      const afterLine =
        typeof args.beforeLine === 'number' && args.beforeLine > 0
          ? args.beforeLine + args.before.length + countLines(args.diff.newText)
          : undefined;
      // 改动行的行号列：把官方行内的 `+ `/`- ` 压掉、改成画在行号列上，正文只让出那一列——
      // 于是改动行的正文与上下文行的正文对齐。没有 hunkClass（设置页样张）时保持官方原样。
      const signCss =
        args.hunkClass === undefined
          ? ''
          : diffSignRules(args.hunkClass, countLines(args.diff.oldText ?? ''), countLines(args.diff.newText));
      return (
        <div className={cn.diffWrap} key={args.key}>
          {signCss !== '' ? <style key="sign">{signCss}</style> : null}
          {context(args.before, 'before', args.beforeLine)}
          <DiffBlock
            diffs={[args.diff]}
            labels={args.labels}
            maxLines={args.maxLines ?? DIFF_MAX_LINES}
            className={cn.diff + ' ' + (args.hunkClass ?? '')}
          />
          {context(args.after, 'after', afterLine)}
        </div>
      );
    },
  };
}
