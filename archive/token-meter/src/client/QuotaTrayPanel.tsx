/**
 * 额度弹层（纯展示）：**按钮上方**弹出的使用详情 + 供应商切换
 *
 * 版式对齐官方客户端的账户浮层（用户给的参考图）：
 *
 * ```
 * ┌──────────────────────────────┐
 * │ ▭ 额度                  ⟳    │  ← 图标 + 标题 + 刷新（拉取中显示 spinner）
 * ├──────────────────────────────┤
 * │ ◍ DeepSeek 官方  官方余额接口 │  ← 当前供应商：环 + 名字 + 类型 + 新鲜度
 * │ 账户余额                      │
 * │   余额              ¥9.06     │  ← 当前供应商的**详情模板**产出
 * │   赠送              ¥0        │
 * │   充值              ¥9.06     │
 * │ 10 秒钟前                     │
 * ├──────────────────────────────┤
 * │ 切换供应商                    │
 * │ ◍ DeepSeek 官方        当前 ✓ │  ← 每行左侧是本供应商的**按钮模板**环
 * │ ◍ Goat  · 拉取正常            │
 * ├──────────────────────────────┤
 * │ 增删改供应商：设置 → TokenMeter│  ← 管理入口提示（设置面板没有对外打开接口）
 * └──────────────────────────────┘
 * ```
 *
 * 本文件**不认识任何供应商**：详情主体与每行的环都由调用方（`createQuotaSection`）从
 * provider 模板层算好传进来；这里只负责排版、状态与交互回调。
 *
 * 为什么 portal 到 `document.body`：侧边栏在展开/收起动画里会给祖先加 `transform`，
 * 那会让 `position: fixed` 相对那个祖先定位并被它的 overflow 裁掉 —— 挂到 body 上
 * 就与侧边栏自身的几何与动画彻底解耦。
 *
 * @module @dshp/token-meter/client/QuotaTrayPanel
 */
import { useEffect, useRef, type MutableRefObject, type ReactNode, type RefObject } from 'react';
import * as ReactDOM from 'react-dom';
import { useAnchoredPosition, useDismissOnOutsidePointer } from '@deepseek-ai/dsh-client-ui-primitives';
import { QuotaIcon } from './icons.js';
import styles from './styles.module.css';

/** 一行供应商（切换项）。 */
export interface QuotaTrayVendorRow {
  id: string;
  /** 显示名（用户在设置里填的）。 */
  name: string;
  /** 类型标签（opencode / deepseek / …）。 */
  typeLabel: string;
  /** 是否当前激活（一次只有一个）。 */
  active: boolean;
  /** 是否已退出 Host 定时拉取。 */
  disabled: boolean;
  /** 本供应商**按钮模板**产出的内容（`variant: 'row'`；不限于环）。 */
  button: ReactNode;
  /** 该供应商按钮当前显示什么（tooltip 用）。 */
  buttonHint: string;
  /** 行右侧状态文案（拉取正常 / 拉取失败 / 未拉取 / 已禁用）。 */
  status: string;
  /** 状态色调（`ok` / `warn` / `bad` / `idle` / `off`；具体配色由本文件的 CSS 决定）。 */
  statusTone?: string | undefined;
}

/** 额度弹层 props。 */
export interface QuotaTrayPanelProps {
  /** 所有供应商（顺序由调用方定：当前 → 已启用 → 已禁用）。 */
  vendors: QuotaTrayVendorRow[];
  /** 当前供应商的**主图形**（16px，与切换行同源）—— 卡片头只放它，名字单独一列，不重复数值。 */
  activeGlyph: ReactNode;
  /** 当前供应商按钮的说明（tooltip / aria）。 */
  activeHint: string;
  /** 当前供应商显示名。 */
  activeName: string;
  /** 详情主体（专属 detail 模板产出；失败时是结构化错误卡）。 */
  detail: ReactNode;
  /** 数据新鲜度文案（`10 秒钟前`）；空串则不显示。 */
  freshness: string;
  /** 正在拉取。 */
  loading: boolean;
  /** 错误提示（连接 Host 失败等）。**放到底部**：它不是主体内容，压在最上面只会显得乱。 */
  error: string;
  /** 管理入口提示文案（设置面板没有对外打开接口，只能给一行字）。 */
  manageHint: string;
  /** 手动拉取当前供应商。 */
  onRefresh: () => void;
  /** 切换当前供应商（一次只激活一个）。 */
  onSwitch: (id: string) => void;
  /** 锚点（侧边栏底部按钮）与面板自身的 ref，交给定位 hook。 */
  anchorRef: RefObject<HTMLElement | null>;
  /** 面板自身的 ref（定位 hook 需要量它的真实尺寸；由本组件写入，故为可变 ref）。 */
  panelRef: MutableRefObject<HTMLElement | null>;
  /** 点击外部 / Esc 时关闭。 */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 弹层根（含触发按钮）用于「点外部关闭」判定。 */
  rootRef: RefObject<HTMLElement | null>;
}

/**
 * 额度弹层。
 *
 * @param props - 展示数据 + 交互回调 + 定位 refs。
 * @returns 挂到 body 上的浮层节点（未展开时 `null`）。
 */
export function QuotaTrayPanel(props: QuotaTrayPanelProps): ReactNode {
  const style = useAnchoredPosition({
    open: props.open,
    anchorRef: props.anchorRef,
    panelRef: props.panelRef,
    side: 'top',
    gap: 8,
    margin: 12,
  });
  useDismissOnOutsidePointer(props.rootRef, props.open, props.setOpen, props.panelRef);

  // Esc 关闭：与官方浮层一致（并把手势留给 shell，不阻止默认之外的传播）
  const escRef = useRef(props.setOpen);
  escRef.current = props.setOpen;
  useEffect(() => {
    if (!props.open || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') escRef.current(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.open]);

  if (!props.open) return null;
  const node = (
    <section
      className={styles.trayPanel}
      ref={(element) => {
        props.panelRef.current = element;
      }}
      style={style ?? { visibility: 'hidden' }}
      role="dialog"
      aria-label="额度"
    >
      <header className={styles.trayPanelHead}>
        <span className={styles.trayPanelGlyph} aria-hidden="true">
          <QuotaIcon size={14} />
        </span>
        <span className={styles.trayPanelTitle}>额度</span>
        {props.loading ? <span className={styles.traySpin} aria-hidden="true" /> : null}
        <span className={styles.traySpacer} />
        <button
          type="button"
          className={styles.trayIconBtn}
          title={'重新拉取「' + props.activeName + '」的额度'}
          aria-label="刷新额度"
          disabled={props.loading}
          onClick={props.onRefresh}
        >
          <RefreshGlyph />
        </button>
      </header>

      <div className={styles.trayBody}>
        {/* 当前供应商：只留「主图形 + 名字」—— 类型标签在下面的切换列表里已经有了，
            重复挂在顶部只会让第一屏更杂（详情主体交给下方的详情模板） */}
        <div className={styles.trayCard}>
          <div className={styles.trayCardHead}>
            <span className={styles.trayCardGlyph}>{props.activeGlyph}</span>
            <span className={styles.trayCardName} title={props.activeName}>
              {props.activeName}
            </span>
          </div>
          <div className={styles.trayCardBody}>{props.detail}</div>
        </div>

        {/* 供应商切换：一次只激活一个 */}
        <div className={styles.trayList}>
          <div className={styles.trayListHead}>切换供应商</div>
          {props.vendors.length === 0 ? (
            <div className={styles.trayEmpty}>还没有配置任何供应商。</div>
          ) : (
            props.vendors.map((row) => (
              <button
                key={row.id}
                type="button"
                className={styles.trayRow}
                data-active={row.active ? '1' : undefined}
                data-off={row.disabled ? '1' : undefined}
                title={row.buttonHint}
                onClick={() => props.onSwitch(row.id)}
              >
                <span className={styles.trayRowGlyph}>{row.button}</span>
                <span className={styles.trayRowName}>{row.name}</span>
                <span className={styles.trayRowType}>{row.typeLabel}</span>
                <span className={styles.trayRowStatus} data-tone={row.statusTone}>
                  {row.status}
                </span>
                {row.active ? <span className={styles.trayRowCheck}>当前</span> : null}
              </button>
            ))
          )}
        </div>
      </div>

      <footer className={styles.trayFoot}>
        {props.error ? (
          <span className={styles.trayFootError} role="alert" title={props.error}>
            {props.error}
          </span>
        ) : null}
        <span className={styles.trayFootRow}>
          {props.freshness ? <span>{props.freshness}</span> : null}
          {props.freshness ? <span className={styles.trayFootDot}>·</span> : null}
          <span>{props.manageHint}</span>
        </span>
      </footer>
    </section>
  );
  try {
    return ReactDOM.createPortal(node, document.body);
  } catch {
    return node;
  }
}

/** 极简刷新图标（自绘：避免为一个图标引入官方图标集里语义不符的那一个）。 */
function RefreshGlyph(): ReactNode {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.2 8a5.2 5.2 0 1 1-1.6-3.75" />
      <path d="M13.4 1.9v3h-3" />
    </svg>
  );
}
