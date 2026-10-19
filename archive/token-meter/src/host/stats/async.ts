/**
 * 异步小工具 —— 纯逻辑，无依赖，可独立单测
 *
 * 原实现：dsh-token-stats/lib/async.js（逐行对齐，仅加 TS 类型）
 */

/**
 * 给 Promise 加超时：超时后 reject，调用方走已有失败重试路径。
 * 定时器 unref，避免拖住宿主进程退出；内层 Promise settled 后清定时器。
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | 0 = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('timeout after ' + ms + 'ms' + (label ? ' (' + label + ')' : '')));
    }, ms);
    if (
      timer !== null &&
      typeof timer === 'object' &&
      typeof (timer as { unref?: () => void }).unref === 'function'
    )
      (timer as unknown as { unref: () => void }).unref();
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => {
      clearTimeout(timer as ReturnType<typeof setTimeout>);
    }),
    timeout,
  ]);
}
