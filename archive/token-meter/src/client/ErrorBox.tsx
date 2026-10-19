/**
 * 拉取失败友好提示卡（Friendly Error Box）
 *
 * 目标：任何失败都让用户一眼看懂三件事 —— **结论（哪坏了）/ 后果 / 该怎么办**，
 * 再按需展开细节用于自助排查或反馈维护者。
 *
 * 分层渲染同思路：分类与文案全部由 Host 产出（host/errors.ts 的 ErrorInfo），
 * 本组件只负责渲染，不认识任何供应商。老 Host 只下发字符串时走本地兜底分类。
 *
 * 结构：
 *   [图标] 结论标题 ················ ▾ 展开      ← 严重度配色（红/黄/蓝）
 *          一句话解释
 *          → 该去哪改
 *          [重试] [复制详情]                    ← 可重试才给重试
 *   ── 展开 ──
 *          排查步骤（有序）
 *          原始信息（等宽、可整段复制）
 *
 * 原来是 `createErrorBox(React, deps)` 工厂：React 注入取消（模块顶层 import），
 * `deps`（展开态/切换/去设置）是真实依赖，保留为建造型函数的参数。
 */
import { useState, type ReactNode } from 'react';
import styles from './styles.module.css';
import type { ErrorInfo, ErrorKind, ErrorTone } from './types.js';

/** 分类 → 图标（纯字符，零依赖，深浅主题都能看）。 */
const ICONS: Record<ErrorKind, string> = {
  auth: '🔑',
  session: '⏳',
  plan: '📅',
  balance: '💰',
  rate: '🐢',
  network: '🌐',
  parse: '🧩',
  config: '⚙️',
  server: '🛠️',
  unknown: '⚠️',
};

/** 本地兜底分类（仅当 Host 未下发 errorInfo，即旧版本 Host 时使用）。 */
const FALLBACK_RULES: Array<[RegExp, ErrorKind]> = [
  [/未配置|凭据未配置|必填|参数非法|workspaceId 非法/, 'config'],
  [/会话失效|会话已过期|登录失效|登录态|被风控|logged out/i, 'session'],
  [/密钥无效|密钥已失效|密钥引用.*为空|Invalid 'Authorization'|401|403/i, 'auth'],
  [/upgrade_required|订阅.*(到期|结束|失败|取消)|计划.*(不含|不支持)/, 'plan'],
  [/余额不足|insufficient|402/, 'balance'],
  [/限流|429|rate.?limit/i, 'rate'],
  [/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|超时|timeout/i, 'network'],
  [/非 JSON|结构异常|字段缺失|解析失败|改版|未命中/, 'parse'],
  [/\b5\d\d\b/, 'server'],
];

const FALLBACK_TITLES: Record<ErrorKind, string> = {
  auth: '密钥无效或已失效',
  session: '登录状态已过期',
  plan: '订阅已到期或计划不支持',
  balance: '余额不足',
  rate: '请求过于频繁（被限流）',
  network: '网络不可达',
  parse: '接口返回结构异常',
  config: '供应商配置不完整',
  server: '上游服务异常',
  unknown: '拉取失败',
};

/** 无 errorInfo 时的最小可用兜底（结论 + 原始信息）。 */
export function fallbackErrorInfo(message: string): ErrorInfo {
  const msg = String(message || '拉取失败');
  let kind: ErrorKind = 'unknown';
  for (const [re, k] of FALLBACK_RULES) {
    if (re.test(msg)) {
      kind = k;
      break;
    }
  }
  const tone: ErrorTone =
    kind === 'auth' || kind === 'session' || kind === 'plan' || kind === 'balance' ? 'bad' : 'warn';
  return {
    kind,
    title: FALLBACK_TITLES[kind],
    hint: '本次拉取没有成功，展开可见原始信息。',
    action: '点「刷新」重试；若持续失败请把详情反馈给维护者',
    steps: ['点「刷新」重试一次', '若持续失败，把「原始信息」反馈给插件维护者'],
    detail: msg,
    retriable: true,
    tone,
  };
}

/** 复制一段文本：剪贴板 API 优先，失败落到 textarea + execCommand。 */
function copy(text: string, done: (ok: boolean) => void): void {
  try {
    const nav: Navigator | null = typeof navigator !== 'undefined' ? navigator : null;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      void nav.clipboard.writeText(text).then(
        () => done(true),
        () => done(false),
      );
      return;
    }
  } catch {
    /* 落到下面的兜底 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    done(!!ok);
  } catch {
    done(false);
  }
}

/** 失败卡的运行时依赖（展开态跨卡片共享 + 可选「去设置页」入口）。 */
export interface ErrorBoxDeps {
  isOpen: () => boolean;
  toggle: () => void;
  /** 可选：打开设置页（「去设置页」快捷入口） */
  openSettings?: () => void;
}

export interface ErrorBoxProps {
  /** 结构化失败信息；缺省时用 msg 现场兜底分类 */
  info?: ErrorInfo | null | undefined;
  /** 原始错误（老 Host 只给这个） */
  msg?: string | undefined;
  /** 附加说明：供应商名 · 失败时间 · 凭据形态 */
  meta?: string | undefined;
  /** 重试回调（有则显示「重试」按钮） */
  onRetry?: (() => void) | undefined;
  /** 是否紧凑模式（侧边栏窄卡用） */
  compact?: boolean | undefined;
}

/**
 * 拼类名。
 *
 * CSS Module 的映射是宽松声明（每个值是 `string | undefined`），直接拼会得到 `"a undefined"`。
 *
 * @param names - 类名候选。
 * @returns 空格分隔的类名。
 */
function cx(...names: Array<string | undefined>): string {
  return names.filter((name) => name !== undefined).join(' ');
}

/**
 * tone → 局部类名。
 *
 * 旧实现是运行时拼 `'tm-errbox-' + tone`（`errbox-bad` / `errbox-warn` / `errbox-info`），
 * CSS Module 化之后局部名是**后缀驼峰**（`errboxBad`），拼字符串取不到——`styles['errbox-bad']`
 * 是 undefined，而 `styles[tone]` 会撞上 `.bad` / `.warn` 这些**复合选择器的另一半**
 * （那条规则要求元素同时有 `.errbox`，`.dot.bad` 之类的规则又会误命中）。所以改成查表。
 */
const ERRBOX_TONE: Record<ErrorTone, string | undefined> = {
  bad: styles.errboxBad,
  warn: styles.errboxWarn,
  info: styles.errboxInfo,
};

/**
 * tone → 局部类名（图标底色）。
 *
 * 注意 `warn` 档在样式表里**从来没有规则**（旧实现照样会挂上 `tm-erricon-warn`，是个悬空类名）——
 * 按本轮迁移的统一口径，无样式的标记类不再写进 DOM。
 */
const ERRICON_TONE: Record<ErrorTone, string | undefined> = {
  bad: styles.erriconBad,
  warn: undefined,
  info: styles.erriconInfo,
};

/**
 * 造一张失败卡（依赖注入进来，组件本身是纯函数组件）。
 *
 * @param deps - 展开态读取/切换与可选的去设置页入口。
 * @returns 失败卡组件。
 */
export function createErrorBox(deps: ErrorBoxDeps): (props: ErrorBoxProps) => ReactNode {
  return function ErrorBox(props: ErrorBoxProps): ReactNode {
    const raw: ErrorInfo | null = props.info || null;
    const info: ErrorInfo = raw || fallbackErrorInfo(props.msg || '拉取失败');
    const open = deps.isOpen();
    const [copied, setCopied] = useState('');
    const tone: ErrorTone = info.tone || 'warn';
    const steps = Array.isArray(info.steps) ? info.steps.slice(0, 6) : [];
    const detailText =
      info.detail +
      (props.meta ? '\n' + props.meta : '') +
      (info.status ? '\nHTTP ' + info.status : '') +
      (info.docs ? '\n文档：' + info.docs : '');
    const icon = ICONS[info.kind] || ICONS.unknown;

    const head = (
      <button
        key="h"
        type="button"
        className={styles.errhead}
        title={open ? '收起详情' : '展开排查详情'}
        aria-expanded={open}
        onClick={() => deps.toggle()}
      >
        <span key="i" className={cx(styles.erricon, ERRICON_TONE[tone])}>
          {icon}
        </span>
        <span key="t" className={styles.errtitlewrap}>
          <span key="a" className={styles.errtitle}>
            {info.title}
          </span>
          <span key="b" className={styles.errhint}>
            {info.hint}
          </span>
        </span>
        <span key="c" className={styles.vcaret}>
          {open ? '▴' : '▾'}
        </span>
      </button>
    );

    const actionRow = (
      <div key="a" className={styles.erraction}>
        {info.action ? (
          <span key="p" className={styles.erractionText}>
            {'→ ' + info.action}
          </span>
        ) : null}
        <span key="btns" className={styles.errabtns}>
          {props.onRetry && info.retriable ? (
            <button
              key="retry"
              type="button"
              className={styles.mini}
              title="立即重新拉取一次"
              onClick={() => props.onRetry && props.onRetry()}
            >
              {'↻ 重试'}
            </button>
          ) : props.onRetry && !info.retriable ? (
            <button
              key="recheck"
              type="button"
              className={styles.mini}
              title="按上面步骤处理完后，点这里立即验证一次"
              onClick={() => props.onRetry && props.onRetry()}
            >
              {'✓ 已处理，验证'}
            </button>
          ) : null}
          {deps.openSettings ? (
            <button
              key="settings"
              type="button"
              className={styles.mini}
              title="前往设置页修改该供应商配置"
              onClick={() => deps.openSettings && deps.openSettings()}
            >
              {'设置页'}
            </button>
          ) : null}
        </span>
      </div>
    );

    const body = open ? (
      <div key="d" className={styles.errdetail}>
        {steps.length ? (
          <div key="steps">
            <div className={styles.errsub}>{'排查步骤'}</div>
            <ol className={styles.errsteps}>
              {steps.map((s, i) => (
                <li key={'s' + i}>{s}</li>
              ))}
            </ol>
          </div>
        ) : null}
        <div key="raw">
          <div className={styles.errsub}>{'原始信息'}</div>
          <pre className={styles.errraw}>{detailText}</pre>
        </div>
        <div key="acts" className={styles.errdactions}>
          <button
            type="button"
            className={styles.mini}
            onClick={() =>
              copy(detailText, (ok) => {
                setCopied(ok ? '已复制' : '复制失败');
                window.setTimeout(() => setCopied(''), 1600);
              })
            }
          >
            {copied || '复制详情'}
          </button>
          {info.docs ? (
            <a className={styles.mini} href={info.docs} target="_blank" rel="noreferrer noopener">
              {'官方文档'}
            </a>
          ) : null}
          {props.meta ? <span className={styles.errmeta}>{props.meta}</span> : null}
        </div>
      </div>
    ) : null;

    return (
      <div className={cx(styles.errbox, ERRBOX_TONE[tone], props.compact ? styles.errboxCompact : undefined)}>
        {head}
        {actionRow}
        {body}
      </div>
    );
  };
}
