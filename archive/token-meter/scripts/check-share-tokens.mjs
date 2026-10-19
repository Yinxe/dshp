/**
 * 自检：分享卡导出用的 token 清单必须覆盖 styles.module.css 里出现的全部 `--dsw-*`。
 *
 * 为什么需要它：导出走 `<foreignObject>` 光栅化，那里读不到 DSH 壳层的样式表，
 * 只能把用到的设计 token 计算值**内联**进去。漏一个 token，组件在导出的图里就会掉色
 * （`var()` 取不到值 → 落到 inherit/initial），而且这种问题在开发机上往往看不出来
 * （预览是真实 DOM，颜色是对的，只有导出的 PNG 才露馅）。
 *
 * 纯静态文本比对，不依赖浏览器，因此可以放进 `pnpm test`。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, '..', rel), 'utf8');

const used = new Set(read('src/client/styles.module.css').match(/--dsw-[a-z0-9-]+/g) || []);
const listed = new Set(
  read('src/client/SharePanel.tsx')
    .match(/'(--dsw-[a-z0-9-]+)'/g)
    ?.map((s) => s.slice(1, -1)) || [],
);

const missing = [...used].filter((t) => !listed.has(t)).toSorted();
const extra = [...listed].filter((t) => !used.has(t)).toSorted();

if (used.size === 0 || listed.size === 0) {
  console.error('✗ 没有解析到 token 清单（源码结构是否变了？）');
  process.exit(1);
}
if (missing.length > 0) {
  console.error('✗ SHARE_TOKENS 漏了 styles.module.css 里用到的 token：\n  ' + missing.join('\n  '));
  process.exit(1);
}
if (extra.length > 0) {
  console.error('✗ SHARE_TOKENS 里有 styles.module.css 已不再使用的 token：\n  ' + extra.join('\n  '));
  process.exit(1);
}
console.log('✓ 分享卡 token 覆盖一致：' + listed.size + ' 个');
