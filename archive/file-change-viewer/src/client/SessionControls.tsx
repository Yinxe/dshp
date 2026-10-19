/**
 * 会话页头的两个快捷开关：一键展开 / 收起所有文件 diff、一键切换差异视图
 *
 * 挂在 `conversation.session.header.utilities`（list 槽位，session 作用域，右侧会话工具栏）。
 * 它改的是 `session.ts` 的**会话级覆盖**——不写 `settings.yaml`、不动全局偏好，换一个会话就
 * 回落到偏好值（真要改全局默认，去设置页那一节）。
 *
 * 形态照抄同一个槽位上的官方 `open-in-app`：`.5px` 边框 + 14px 圆角的胶囊、11px 字号，
 * 一行放下两个按钮；只有「已经覆盖」时才多出一个「恢复跟随偏好」的小按钮，平常不占地方。
 *
 * 三个状态都如实反映**当前生效值**（覆盖优先、其次全局偏好），所以按钮上的字就是用户接下来会
 * 看到的东西，不需要猜：
 *
 * ```
 * [ ⌄ 收起 ] | [ </> 高亮 ]  ↺        ← 覆盖生效中（↺ 只在此时出现）
 * [ › 展开 ] | [ ⑂ ± 差异 ]           ← 跟随全局偏好
 * ```
 *
 * @module @dshp/file-change-viewer/client/SessionControls
 */
import type { ReactNode } from 'react';
import {
  IconBranchOutlineRegular,
  IconChevronDownOutlineRegular,
  IconCodeOutlineRegular,
  IconRefreshOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives';
import { usePrefs } from './prefs.js';
import { resetOverride, setExpanded, setView, useOverride } from './session.js';
import type { FileChangeView } from './types.js';
import styles from './styles.module.css';

const GROUP_LABEL = '文件改动的展开与差异视图（仅当前会话）';

const EXPAND_TEXT = '展开改动';
const COLLAPSE_TEXT = '收起改动';
const EXPAND_TITLE = '展开本会话的所有文件改动（只影响当前会话，不改全局偏好）';
const COLLAPSE_TITLE = '收起本会话的所有文件改动（只影响当前会话，不改全局偏好）';

const VIEW_HIGHLIGHT_TEXT = '高亮';
const VIEW_DIFF_TEXT = '± 差异';
const VIEW_TITLE =
  '切换本会话文件改动的展示方式（高亮 = 单代码块统一 diff，± 差异 = 官方逐行视图；只影响当前会话）';

const RESET_TEXT = '恢复跟随偏好';
const RESET_TITLE = '撤掉本会话的临时设置，回到设置页里的全局默认';

/** 页头图标尺寸（与官方 `open-in-app` 的 11px 一致）。 */
const ICON_SIZE = 11;

/**
 * 会话页头开关组件。
 *
 * @param props.sessionId - 会话作用域槽位的标准 prop；取不到就没有会话级覆盖。
 * @returns 页头右侧的胶囊开关组。
 */
export function SessionControls(props: { sessionId?: string | undefined }): ReactNode {
  const prefs = usePrefs();
  const override = useOverride(props.sessionId);
  // 生效值：覆盖优先，其次全局偏好（与 FileChangeRow 里的口径逐字一致）。
  const expanded = override.expanded ?? prefs.sectionsOpen;
  const view: FileChangeView = override.view ?? prefs.view;
  const overridden = override.expanded !== null || override.view !== null;

  const expandTitle = expanded ? COLLAPSE_TITLE : EXPAND_TITLE;
  const viewTitle = view === 'highlight' ? VIEW_HIGHLIGHT_TEXT : VIEW_DIFF_TEXT;

  const children: ReactNode[] = [
    <button
      key="expand"
      type="button"
      className={styles.headBtn}
      title={expandTitle}
      aria-label={expandTitle}
      onClick={() => setExpanded(props.sessionId, !expanded)}
    >
      <IconChevronDownOutlineRegular
        size={ICON_SIZE}
        className={styles.headChevron + (expanded ? '' : ' ' + styles.headChevronShut)}
      />
      <span className={styles.headLabel}>{expanded ? COLLAPSE_TEXT : EXPAND_TEXT}</span>
    </button>,
    <span key="sep" className={styles.headSep} />,
    <button
      key="view"
      type="button"
      className={styles.headBtn}
      title={VIEW_TITLE}
      aria-label={VIEW_TITLE}
      onClick={() => setView(props.sessionId, view === 'highlight' ? 'diff' : 'highlight')}
    >
      {view === 'highlight' ? (
        <IconCodeOutlineRegular size={ICON_SIZE} />
      ) : (
        <IconBranchOutlineRegular size={ICON_SIZE} />
      )}
      <span className={styles.headLabel}>{viewTitle}</span>
    </button>,
  ];

  // 只有真被覆盖过才出现：它存在的意义就是「怎么回去」，没覆盖时回去是空操作。
  if (overridden) {
    children.push(
      <button
        key="reset"
        type="button"
        className={styles.headReset}
        title={RESET_TITLE}
        aria-label={RESET_TEXT}
        onClick={() => resetOverride(props.sessionId)}
      >
        <IconRefreshOutlineRegular size={ICON_SIZE} />
      </button>,
    );
  }

  return (
    <div
      className={styles.headCtl + (overridden ? ' ' + styles.headCtlOverridden : '')}
      role="group"
      aria-label={GROUP_LABEL}
    >
      {children}
    </div>
  );
}
