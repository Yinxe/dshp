/**
 * 会话级覆盖：会话页头的「展开 / 收起」与「差异视图」两个快捷开关
 *
 * ## 它和偏好（`prefs.ts`）的区别
 *
 * |            | 家在哪                                     | 作用范围            | 谁改它                     |
 * | ---------- | ------------------------------------------ | ------------------- | -------------------------- |
 * | 全局偏好   | `settings.yaml` 的 NS 分节（Host 权威值）   | 所有会话、之后新渲染 | 设置页（写回 Host）         |
 * | 会话级覆盖 | **本模块**（进程内，页面关掉就没了）        | 当前这一个会话       | 会话页头的两个快捷按钮      |
 *
 * 覆盖**绝不落盘、绝不写 settings.yaml**（那是「偏好」的事）：用户在会话里临时想「这个会话所有
 * 文件改动都摊开看 / 都换成 ± 视图」，不该顺手改掉全局默认。
 *
 * ## 覆盖与「行 / 块自己的临时开合」的优先级
 *
 * 行内的单块点击（`FileChangeRow` 的 `bound.sections` / `bound.views`）是**用户对那一个块的
 * 意思**，优先级最高；覆盖是**会话级默认**，压在全局偏好之上：
 *
 * ```
 * 块自己的临时覆盖  >  会话级覆盖  >  全局偏好
 * ```
 *
 * ## `rev`：为什么要有版本号
 *
 * 页头按钮说的是「**所有**文件 diff」，所以点一下必须真的把所有行都翻过去——包括用户之前手动
 * 折叠过的那几行。可「行自己的临时覆盖优先」又意味着那些行不会动。两者靠 `rev` 调和：每次设置
 * 覆盖都把 `rev` +1，行组件发现「我手里那份临时状态属于上一版覆盖」就整个丢掉、重新开始
 * （见 `FileChangeRow` 的 `newUiState`）——于是页头那一下是真正的「一键全改」，而改完之后用户
 * 再单独点某一行，依然由用户说了算。
 *
 * @module @dshp/file-change-viewer/client/session
 */
import { useEffect, useState } from 'react';
import type { DiffView } from './types.js';

/** 一个会话的覆盖值；`null` 一律表示「跟随全局偏好」。 */
export interface SessionViewOverride {
  /** 会话级「展开 / 收起」。 */
  expanded: boolean | null;
  /** 会话级差异视图。 */
  view: DiffView | null;
  /** 版本号：每次设置 +1；行组件靠它识别「页头动过」并重置自己的临时状态。 */
  rev: number;
}

/** 没有覆盖时的**共享常量**（引用稳定，行组件不会因为新对象而误重置）。 */
export const NO_OVERRIDE: SessionViewOverride = { expanded: null, view: null, rev: 0 };

/** sessionId → 覆盖。会话被关掉时没人来清，但一条覆盖只有三个标量，不值得引生命周期钩子。 */
const overrides = new Map<string, SessionViewOverride>();
const listeners = new Set<() => void>();
let rev = 0;

/**
 * 取会话键。
 *
 * `sessionId` 是槽位的标准 prop，但**不保证存在**（槽位还没绑会话、宿主换了契约）。取不到时
 * 返回空串：既不写进表（见 {@link write}），查出来也永远是 {@link NO_OVERRIDE}——「没有会话
 * 就没有会话级覆盖」，而不是退化成一个所有会话共用的全局覆盖（那会悄悄改掉偏好之外的行为）。
 *
 * @param sessionId - 槽位给的会话 id（可能是任意值）。
 * @returns 会话键；没有就是空串。
 */
function keyOf(sessionId: unknown): string {
  return typeof sessionId === 'string' ? sessionId : '';
}

function notify(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      /* 订阅者自己的异常不该影响其它订阅者 */
    }
  }
}

/** 写一个键（没有会话键时什么都不做，见 {@link keyOf}）。 */
function write(sessionId: unknown, next: { expanded?: boolean | null; view?: DiffView | null }): void {
  const key = keyOf(sessionId);
  if (key === '') return;
  const prev = overrides.get(key) ?? NO_OVERRIDE;
  rev += 1;
  const merged: SessionViewOverride = {
    expanded: next.expanded === undefined ? prev.expanded : next.expanded,
    view: next.view === undefined ? prev.view : next.view,
    rev,
  };
  overrides.set(key, merged);
  notify();
}

/** 订阅 + 读取某个会话的覆盖（组件内用）。 */
export function useOverride(sessionId: unknown): SessionViewOverride {
  const [, bump] = useState(0);
  useEffect(() => {
    const listener = (): void => bump((tick) => tick + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  // 直接返回表里的**同一个对象**：行组件拿它当身份，每次渲染造新对象会让临时状态每次都被丢掉。
  return overrides.get(keyOf(sessionId)) ?? NO_OVERRIDE;
}

/**
 * 设置该会话的「展开 / 收起」。
 *
 * @param sessionId - 槽位给的会话 id。
 * @param expanded - 是否展开。
 */
export function setExpanded(sessionId: unknown, expanded: boolean): void {
  write(sessionId, { expanded });
}

/**
 * 设置该会话的差异视图。
 *
 * @param sessionId - 槽位给的会话 id。
 * @param view - 展示方式。
 */
export function setView(sessionId: unknown, view: DiffView): void {
  write(sessionId, { view });
}

/**
 * 撤掉该会话的全部覆盖（回到「跟随全局偏好」）。
 *
 * @param sessionId - 槽位给的会话 id。
 */
export function resetOverride(sessionId: unknown): void {
  const key = keyOf(sessionId);
  if (key === '' || !overrides.delete(key)) return;
  // 版本号继续往前走：行组件必须认得出「覆盖被撤掉了」并重置自己的临时状态。
  rev += 1;
  notify();
}
