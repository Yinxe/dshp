#!/usr/bin/env node
/**
 * 样式与运行时依赖自检
 *
 * 1. **颜色只走 token**：client 下所有 `*.module.css` 里不允许出现 `#rrggbb` / `rgb()` / `hsl()`
 *    或常见命名色 —— 深浅主题靠 `--dsw-alias-*` 切换，写死色值在另一套主题下必然出错。
 *    这正是 web-style 用 token 覆盖层在做的事：插件写死颜色 = 与它对冲。
 * 2. **类型导入不得进入运行时**：其它插件的产物里不允许出现 `@dshp/widget-kit` 的 require ——
 *    业务插件只加 devDependency 做 `import type`，运行时靠 `ctx.widgets` 服务接缝。
 * 3. **标题栏高度不许漂移**：内容盒 = 外层 − `.cardHeader` 高度 − 2×内边距，胶囊高度也用它
 *    （`SPEC_DEFAULTS.titleBarHeight`）。样式表与常量不一致时表现是「内容被标题栏压住」，
 *    不容易一眼归因，所以静态钉住。（胶囊**宽度**不在这里：它是量出来的，没有第二套常量可漂移。）
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPEC_DEFAULTS } from '../src/client/spec.ts';

const CLIENT_DIR = 'src/client';
const PLUGINS_DIR = '../../plugins';

const LITERAL_COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/;
// 颜色名后面必须不是 `-` 或字母：`white-space` / `blacklist` 这类属性名不能算色值
const NAMED_COLOR =
  /(?:^|[\s:(,])(?:white|black|red|green|blue|yellow|orange|purple|gray|grey|silver|maroon|navy|teal|olive|lime|aqua|fuchsia)(?![\w-])/;

/** 去掉注释，避免文档里的示例色值被误判。 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.module.css')) out.push(full);
  }
  return out;
}

const files = walk(CLIENT_DIR);
assert.ok(files.length > 0, '没有找到任何 .module.css');

let declarations = 0;
for (const file of files) {
  const clean = stripComments(readFileSync(file, 'utf8'));
  for (const [index, line] of clean.split('\n').entries()) {
    if (line.includes('--dsw-')) continue;
    if (LITERAL_COLOR.test(line)) {
      assert.fail(`${file}:${String(index + 1)} 出现字面色值（只允许 var(--dsw-*)）：${line.trim()}`);
    }
    if (NAMED_COLOR.test(line)) {
      assert.fail(`${file}:${String(index + 1)} 出现命名色（只允许 var(--dsw-*)）：${line.trim()}`);
    }
    declarations += 1;
  }
}

// 其它插件的产物里不得出现本插件的模块说明符（证明「只 import type」被擦除）
const others = readdirSync(PLUGINS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'widget-kit')
  .map((entry) => join(PLUGINS_DIR, entry.name, 'lib', 'client.js'));
let scanned = 0;
for (const bundle of others) {
  let text = '';
  try {
    text = readFileSync(bundle, 'utf8');
  } catch {
    continue; // 还没构建过的插件跳过
  }
  scanned += 1;
  assert.ok(
    !text.includes('@dshp/widget-kit'),
    `${bundle} 里出现了 '@dshp/widget-kit'：小组件只能通过 ctx.widgets 服务注册，` +
      '运行时不允许 require 本框架（只加 devDependency 用 import type）',
  );
}

// ── 标题栏排版 ↔ 胶囊度量 ────────────────────────────────────────────────
const CARD_CSS = 'src/client/styles.module.css';
const cardCss = stripComments(readFileSync(CARD_CSS, 'utf8'));

/**
 * 取一个选择器自己的声明块（先 `}` 或行首才认，避免把 `.cardActionDanger` 当成 `.cardAction`）。
 *
 * @param selector - 形如 `.cardHeader` 的单条选择器。
 * @returns 声明名到值的映射。
 */
function declarationsOf(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(cardCss);
  assert.notEqual(match, null, `${CARD_CSS} 里找不到规则 ${selector}`);
  const out = new Map();
  for (const part of match[1].split(';')) {
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    out.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim());
  }
  return out;
}

const header = declarationsOf('.cardHeader');
assert.equal(
  header.get('height'),
  `${String(SPEC_DEFAULTS.titleBarHeight)}px`,
  `.cardHeader 的高度必须等于 titleBarHeight（胶囊高度就是它，内容盒也从它往下算）`,
);

console.log(
  `check-css-tokens.mjs ok (${String(files.length)} 个样式表 / ${String(declarations)} 行声明 / ` +
    `${String(scanned)} 个外部产物 / 标题栏高度一致)`,
);
