/**
 * /mcwiki 命令卡片 —— 通过官方 `conversation.chat.commandview` 槽位（按命令
 * 名 keyed）替换通用 <pre> 卡片，让命令结果以 Markdown 渲染。
 *
 * - 组件收到 CommandCardProps 形态的 props：{ node }（CommandNode：
 *   { name, args, outcome: { kind, text } | null }）
 * - 渲染走原语库 MarkdownText（与助手消息同一渲染管线；raw HTML 与相对
 *   链接被禁用，HTTP(S) 链接可用）；labels 硬编码中文（形状对齐官方
 *   markdown-labels.ts）
 * - 折叠态摘要取结果首行去 md 标记；running（outcome 为 null）显示查询中
 *
 * 组件是**普通函数组件**，不再是 `createMcwikiCommandCard(React, P)` 工厂：`useState` 直接从
 * `react` import，官方构件从 primitives import（都是 devDependency，只参与类型检查与构建，运行时
 * 由 shell 的冻结模块表注入）。
 *
 * @module @dshp/mcwiki-search/client/CommandCard
 */
import { useState } from 'react';
import {
  DisclosureRow,
  IconApiOutlineRegular,
  MarkdownText,
  StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives';
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import { cx } from './components.js';
import styles from './styles.module.css';
import type { CommandCardProps, CommandNode } from './types.js';

/** MarkdownText 需要的本地化文案（MarkdownLabels 形状，硬编码中文） */
const MD_LABELS: MarkdownLabels = {
  code: { copyLabel: '复制', copiedLabel: '已复制' },
  footnotes: '脚注',
};

/** 结果首行 → 折叠态摘要（剥掉 md 标题/加粗标记）。 */
function summaryOf(text: string): string {
  return (
    text
      .split('\n')[0]
      ?.replace(/^#+\s*/, '')
      .replace(/\*\*/g, '')
      .slice(0, 120) ?? ''
  );
}

/**
 * /mcwiki 命令结果卡片。
 *
 * @param props - 槽位给的 props（只用到 `node`）。
 * @returns 折叠行 + 展开后的 Markdown 正文。
 */
export function McwikiCommandCard(props: CommandCardProps): ReactNode {
  const [open, setOpen] = useState(false);
  const node: CommandNode = props?.node ?? {};
  const outcome = node.outcome ?? null;
  const text = typeof outcome?.text === 'string' ? outcome.text : '';
  const state: 'running' | 'ok' | 'error' =
    outcome === null ? 'running' : outcome.kind === 'error' ? 'error' : 'ok';
  const body = text.includes('\n') ? text : null;
  const summary =
    outcome === null
      ? '正在查询 Minecraft Wiki…'
      : state === 'error'
        ? text
        : text.length === 0
          ? '完成'
          : summaryOf(text);

  return (
    <div className={styles.cmdRoot} data-state={state}>
      <DisclosureRow
        rowClassName={styles.cmdRow}
        titleClassName={styles.cmdTitle}
        // 旧实现还传过 chevronClassName="mw-cmdChevron"，但 style 表里从来没有 `.mw-cmdChevron`
        // 这条规则——纯摆设。与 c8e140f（file-change-viewer 去掉无样式的 `fcv-toolRow`）同一先例：
        // CSS Module 化时去掉这个类名，不写成 styles.cmdChevron（那会被 check-css-modules 判红）。
        icon={state === 'error' ? <StateDot state="error" /> : <IconApiOutlineRegular />}
        title="mcwiki"
        open={open && body !== null}
        expandable={body !== null}
        expandOnRowClick={true}
        keepContentWhenOpen={true}
        onToggle={() => setOpen((v) => !v)}
        collapsedContent={
          <span className={cx(styles.cmdSummary, state === 'error' ? styles.cmdSummaryErr : undefined)}>
            {summary}
          </span>
        }
      >
        {body !== null ? (
          <div className={styles.cmdBody}>
            <MarkdownText text={text} streaming={false} labels={MD_LABELS} />
          </div>
        ) : null}
      </DisclosureRow>
    </div>
  );
}
