/**
 * clipboard.ts —— 复制文本到剪贴板（Clipboard API 优先，失败回落 textarea + execCommand）
 *
 * 原实现：dsh-custom-ui/client.js 内联 copyText()，逐行等价（含局域网 http
 * 等非安全上下文下 navigator.clipboard 不可用的回落分支）。
 *
 * @module @dshp/web-style/client
 */

export function copyText(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      const p = navigator.clipboard.writeText(text);
      if (p && typeof p.then === 'function') return p;
    } catch {
      /* 走 fallback */
    }
  }
  return new Promise<void>((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (ok) resolve();
      else reject(new Error('copy failed'));
    } catch (e) {
      reject(e);
    }
  });
}
