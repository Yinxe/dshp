/**
 * 设置节里的「展示方式」单选卡：每张卡**把那种效果直接画出来**
 *
 * 展示方式原来是一个下拉框（只有「高亮」/「± 差异」两个词），用户得先选、再回会话里看效果、
 * 不满意再回来换——描述文字写了三行也不如一眼。这里换成两张并排的单选卡，每张卡下面用**同一份
 * 渲染代码**（`diffView.tsx`）画一段真实的样张：高亮卡里是带整行红绿与行号的统一 diff，± 卡里是
 * 官方逐行视图。挑的时候看到什么，会话里就是什么。
 *
 * 样张是**写死的常量**（`src/greet.ts` 的一次小改动），不取自任何真实会话：
 *
 * - 它是静态的，所以不需要 `useMemo`、不会随会话滚动而变，也不会在设置页里触发 `/locate` 请求；
 * - `rows` / `changed` 两口径仍然走 `diff.ts` 的同一套 LCS，所以样张的 `+2 -1` 与真卡片口径一致。
 *
 * @module @dshp/file-change-viewer/client/viewCards
 */
import type { ReactNode } from 'react';
import { toChangeHunk, unifiedDiffRows } from './diff.js';
import { buildHighlight, createDiffBody } from './diffView.js';
import { languageOf } from './lang.js';
import type { DiffBlockLabels, FileChangeView, FileDiff } from './types.js';
import styles from './styles.module.css';

/** 样张文件名（只用来推语法高亮，不显示）。 */
const SAMPLE_PATH = 'src/greet.ts';

/** 样张的改动前内容。 */
const SAMPLE_OLD = ['export function greet(name: string) {', "  return 'Hello, ' + name", '}'].join('\n');

/** 样张的改动后内容（一次「补一个 trim + 换模板串」的小改：`+2 -1`）。 */
const SAMPLE_NEW = [
  'export function greet(name: string) {',
  '  const target = name.trim()',
  '  return `Hello, ${target}!`',
  '}',
].join('\n');

/** 样张的 hunk（`raw` / `rows` / `changed` 三口径与真卡片同源）。 */
const SAMPLE_RAW: FileDiff = { path: SAMPLE_PATH, oldText: SAMPLE_OLD, newText: SAMPLE_NEW };
const SAMPLE_HUNK = toChangeHunk(SAMPLE_RAW);

/**
 * 样张行底色规则的选择器前缀。
 *
 * **刻意不进 CSS Module**：它只被 {@link buildHighlight} 生成的**运行时** CSS 当前缀用
 * （`.dshp-fcv-pvLines code>.line:nth-child(2){…}`），模块里没有、也不需要对应的静态规则，
 * 所以它是个模块外的全局类名（不被哈希）。整份插件只有这里与 `FileChangeRow` 的
 * `TINT_CLASS_PREFIX` 两处全局类名。
 */
const PREVIEW_LINES_CLASS = 'dshp-fcv-pvLines';

/** 高亮卡的素材（行底色规则挂在 {@link PREVIEW_LINES_CLASS} 上，与会话里的行类名不共用）。 */
const SAMPLE_HIGHLIGHT = buildHighlight({
  rows: unifiedDiffRows(SAMPLE_OLD, SAMPLE_NEW),
  startLine: 1,
  language: languageOf(SAMPLE_PATH),
  codeClass: PREVIEW_LINES_CLASS,
});

/** 样张里 DiffBlock 的文案。设置页是中文界面，且槽位没有 `locale` seat，所以用字面量。 */
const PREVIEW_LABELS: DiffBlockLabels = {
  codeLabel: '代码块',
  wrapLabel: '自动换行',
  unwrapLabel: '取消自动换行',
  copy: '复制',
  copied: '已复制',
  collapseAria: '折叠差异',
  expandAria: (hidden: number) => '展开其余 ' + hidden + ' 行',
  collapse: '折叠',
  expand: (hidden: number) => '展开其余 ' + hidden + ' 行',
};

const COPY_LABEL = '复制';
const COPIED_LABEL = '已复制';

/** 展示方式的两个选项（与 Host schema 的 `z.const` 联合逐字对齐）。 */
export const VIEW_OPTIONS: readonly { id: FileChangeView; label: string; desc: string }[] = [
  {
    id: 'highlight',
    label: '高亮',
    desc: '一个代码块里放完整统一 diff：整行红绿底色 + 行号 + 语法高亮，未变行只出现一次。',
  },
  {
    id: 'diff',
    label: '± 差异',
    desc: '官方逐行 ± 视图，同样只列真正变化的行；紧凑，超长时中部折叠。',
  },
];

/** 设置页预览那套类名（与工具行的 `fcv-*` 刻意不相交，见 `diffView.tsx` 的硬约束）。 */
const body = createDiffBody({
  code: styles.pvCode,
  diff: styles.pvDiff,
  diffWrap: styles.pvDiffWrap,
  ctx: styles.pvCtx,
  ctxLine: styles.pvCtxLine,
  muted: styles.pvMuted,
});

/** 高亮卡：注入本卡独有的行底色规则 + 官方代码块。 */
function highlightPreview(): ReactNode[] {
  return [
    <style key="pv-tint">{SAMPLE_HIGHLIGHT.css}</style>,
    <div key="pv-code" className={styles.pvCodeBox}>
      {body.code(SAMPLE_HIGHLIGHT, COPY_LABEL, COPIED_LABEL)}
    </div>,
  ];
}

/** ± 卡：官方 DiffBlock（上下文用不了中性行，样张里本来也没有额外上下文）。 */
function diffPreview(): ReactNode {
  return body.lines({
    diff: SAMPLE_HUNK.changed,
    before: [],
    after: [],
    labels: PREVIEW_LABELS,
  });
}

/**
 * 「展示方式」单选卡组件（受控：写回由设置节负责）。
 *
 * @param props.value - 当前选中的展示方式。
 * @param props.onSelect - 选中回调。
 * @returns 两张并排的单选卡。
 */
export function ViewCards(props: {
  value: FileChangeView;
  onSelect: (id: FileChangeView) => void;
}): ReactNode {
  return (
    <div className={styles.viewCards} role="radiogroup" aria-label="展示方式">
      {VIEW_OPTIONS.map((option) => {
        const selected = props.value === option.id;
        return (
          <div
            key={option.id}
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            tabIndex={0}
            className={styles.viewCard + (selected ? ' ' + styles.viewCardOn : '')}
            onClick={() => props.onSelect(option.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                props.onSelect(option.id);
              }
            }}
          >
            <div className={styles.viewCardHead}>
              <span className={styles.radio} aria-hidden />
              <span className={styles.viewCardName}>{option.label}</span>
            </div>
            <div className={styles.viewCardDesc}>{option.desc}</div>
            {/* 预览整体 `pointer-events:none`（见 styles.ts）：里面的复制按钮不该抢走整卡的点击，
                样张也不需要真去点——点卡片任意位置 = 选中这一种展示方式。 */}
            <div className={styles.pvBody}>
              {option.id === 'highlight' ? highlightPreview() : diffPreview()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
