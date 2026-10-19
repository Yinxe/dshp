/**
 * 真实行号 + 上下文：向 Host 问「这段文本在文件里的第几行、它两侧各是什么」
 *
 * 为什么需要它，两件事都指向同一个能力：
 *
 * 1. **真实行号**：卡片行号由官方代码块的 CSS 计数器给出，默认从 **1** 开始，而 `edit` / `write`
 *    的结果元数据只有 `{ path, oldText, newText }`——**没有行偏移**（官方 `computeHunkDiffs`
 *    就是这么产出的）；
 * 2. **上下文**：模型给 `old_string` 时常常只圈 1–2 行，补丁片段也只带自己那点上下文，
 *    于是卡片上只看得到改动本身、看不出它落在文件的哪个位置。所以顺手把改动两侧的原文也取回来。
 *
 * 所以这里做三件事：
 *
 * 1. **批量**：一屏里可能有好几个块都要定位，攒到一个微任务里发一次请求；
 * 2. **缓存**：键是 `path + newText`（同一段文本在文件里的位置不会因为重渲染而变化），
 *    命中就不再问；
 * 3. **只问这一段**：Host 侧的路由只回 JSON 里的行号与两侧原文，**整份文件不回传**；两侧各最多
 *    8 行，显示多少由偏好决定（客户端截，所以改偏好不必重新问 Host）。
 *
 * 定位不到（文件之后又被改过、hunk 已被覆盖、调用失败且旧文本也对不上）就返回 `null`，
 * 卡片老老实实退回从 1 开始编号、不显示上下文——宁可朴素，也不要编一个错的数字。
 *
 * @module @dshp/file-change-viewer/client/locate
 */
import { useEffect, useState } from 'react';

const BASE = '/ext/dshp-file-change-viewer/locate';

/** 一次请求最多带几个待定位项（与 Host 侧上限一致）。 */
const MAX_BATCH = 20;

/** 一处定位结果：行号 + 两侧原文（Host 没定位到就是 `{ line: null, before: [], after: [] }`）。 */
export interface LocatedHunk {
  /** 1 起；定位不到为 null。 */
  line: number | null;
  /** 匹配块之前的原文（最多 8 行，客户端按偏好截）。 */
  before: string[];
  /** 匹配块之后的原文。 */
  after: string[];
}

const EMPTY_HUNK: LocatedHunk = { line: null, before: [], after: [] };

/** 定位缓存：`path\u0000newText` → 结果（null = 问过了但定位不到）。 */
const cache = new Map<string, LocatedHunk | null>();

/** 订阅者（行组件用它触发重渲染）。 */
const listeners = new Set<() => void>();

/** 已经排进这一批、还没发出去的请求。 */
let pending: Array<{ key: string; path: string; newText: string; oldText: string }> = [];
let scheduled = false;
/** 供测试注入的会话工作目录（浏览器里由行自己带过来）。 */
let currentCwd: string | undefined;

function keyOf(path: string, newText: string): string {
  return path + '\u0000' + newText;
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

async function flush(): Promise<void> {
  scheduled = false;
  const batch = pending;
  pending = [];
  if (batch.length === 0) return;
  try {
    const response = await fetch(BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...(currentCwd === undefined ? {} : { cwd: currentCwd }),
        items: batch.map((item) => ({
          path: item.path,
          newText: item.newText,
          ...(item.oldText === '' ? {} : { oldText: item.oldText }),
        })),
      }),
    });
    const payload = (await response.json()) as { ok?: unknown; results?: unknown };
    const results = Array.isArray(payload?.results) ? payload.results : [];
    batch.forEach((item, index) => {
      cache.set(item.key, sanitizeHunk(results[index]));
    });
  } catch {
    // 网络/后端不可用：记成「不知道」，避免每次渲染都重问同一段
    for (const item of batch) cache.set(item.key, null);
  }
  notify();
}

/**
 * 收窄 Host 回来的一项（外部输入按 unknown 逐字段校验）。
 *
 * @param raw - 应答里的一项。
 * @returns 校验后的结果；形状不对时给「定位不到」。
 */
function sanitizeHunk(raw: unknown): LocatedHunk {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_HUNK;
  const record = raw as Record<string, unknown>;
  const line = record['line'];
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  return {
    line: typeof line === 'number' && line > 0 ? line : null,
    before: strings(record['before']),
    after: strings(record['after']),
  };
}

/**
 * 取某段 hunk 的定位结果（真实起始行号 + 两侧上下文）。
 *
 * @param path - 文件路径（工具参数里的原始路径）。
 * @param newText - 该 hunk 的新侧原文（首选锚：落盘后的样子）。
 * @param oldText - 该 hunk 的旧侧原文；`newText` 定位不到时用它兜底。
 * @param cwd - 会话工作目录（用于相对路径解析）。
 * @returns 已知结果 / `null`（问过但定位不到）/ `undefined`（还没问，已排队）。
 */
export function locateOf(
  path: string,
  newText: string,
  oldText?: string | null | undefined,
  cwd?: string,
): LocatedHunk | null | undefined {
  const anchor = newText === '' ? (oldText ?? '') : newText;
  if (path === '' || anchor === '') return null;
  if (cwd !== undefined) currentCwd = cwd;
  const key = keyOf(path, anchor);
  if (cache.has(key)) return cache.get(key) ?? null;
  if (!pending.some((item) => item.key === key) && pending.length < MAX_BATCH) {
    pending.push({
      key,
      path,
      newText: anchor,
      oldText: newText === '' ? '' : (oldText ?? ''),
    });
    if (!scheduled) {
      scheduled = true;
      setTimeout(() => {
        void flush();
      }, 0);
    }
  }
  return undefined;
}

/**
 * 只要行号时的薄封装（行头链接与行号起点都用它）。
 *
 * @param path - 文件路径。
 * @param newText - 该 hunk 的新侧原文。
 * @param oldText - 兜底锚。
 * @param cwd - 会话工作目录。
 * @returns 行号 / `null` / `undefined`（语义同 {@link locateOf}）。
 */
export function lineOf(
  path: string,
  newText: string,
  oldText?: string | null | undefined,
  cwd?: string,
): number | null | undefined {
  const hit = locateOf(path, newText, oldText, cwd);
  if (hit === undefined) return undefined;
  return hit === null ? null : hit.line;
}

/** 订阅缓存变化（返回退订函数）。 */
export function subscribeLines(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 供测试重置模块内状态（生产路径不会调用）。 */
export function resetLines(): void {
  cache.clear();
  pending = [];
  scheduled = false;
  currentCwd = undefined;
}

/** 行组件用到的那一面。 */
export interface LocatorFace {
  locateOf: typeof locateOf;
  lineOf: typeof lineOf;
  /** 订阅缓存变化（返回 0，纯为了触发重渲染）。 */
  useLines: () => number;
}

/**
 * 订阅封装成 React hook，供行组件使用。
 *
 * 定位结果回来了（或新一批发出去了）就触发重渲染，把真实行号与上下文填上。
 *
 * @returns 恒为 0；订阅本身才是副作用。
 */
export function useLines(): number {
  const [, bump] = useState(0);
  useEffect(() => {
    const listener = (): void => bump((tick) => tick + 1);
    return subscribeLines(listener);
  }, []);
  return 0;
}
