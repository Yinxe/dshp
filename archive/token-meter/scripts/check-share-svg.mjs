#!/usr/bin/env node
/**
 * 自检：分享卡导出的 SVG 文档必须是合法 XML，且内联 CSS 要**逐字节不变**地到达 style 元素。
 *
 * 为什么值得一个脚本：这条链路上的失败是「下载 / 复制一张图都出不来」级别的，而且
 * 只在浏览器里点导出才现形（预览是真实 DOM，永远看不出问题）。触发条件还特别隐蔽 ——
 * `styles.module.css` 手写的是 `@container tmc (max-width:1320px)`，压缩器会改写成范围语法
 * `(width<=1320px)`，**裸 `<` 就此进入内联样式**，整个 SVG 直接解析失败（真实事故：
 * 报「SVG 渲染失败」）。所以这里不是测「replace 写对没有」，而是拿**构建产物里那份真实 CSS**
 * 走一遍组装函数，断言两件事：
 *
 *   1. 文档里进 `<style>` 的文本不含裸 `<` / `&`（否则 XML 非法 → 加载不了）；
 *   2. 把 `<style>` 内容按 XML 规则解码回来，与原始 CSS **逐字节相同**（否则规则静默失效，
 *      例如 `&lt;` 没被解码，`(width<=300px)` 变成 `(width&lt;=300px)`，整条容器查询被丢弃 ——
 *      图能出来但样式是塌的，比报错更难发现）。
 *
 * 另外钉住「组装必须走 shareSvgDocument」：字符串拼接散落回 SharePanel 就会绕过转义。
 *
 * 纯静态 + 纯函数，不需要浏览器；需要 `pnpm -r build` 的产物（和另外两个 bridge 自检一致）。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shareSvgDocument, xmlEscapeText } from '../src/client/share-svg.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, '..', rel), 'utf8');

let groups = 0;
const check = (name, fn) => {
  fn();
  groups += 1;
  console.log('✓ ' + name);
};

/** 取一段 SVG 文档里 `<style>` 的文本内容。 */
const styleTextOf = (svg) => {
  const m = /<style>([\s\S]*?)<\/style>/.exec(svg);
  assert.ok(m !== null, '文档里必须有 <style> 块');
  return m[1];
};

/**
 * 按 XML 规则解码文本节点（只认这三条实体，够用且**故意不宽容**：
 * 遇到别的 `&xxx;` 一律原样保留，好让「多余转义」在对拍时暴露出来）。
 */
const decodeXmlText = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * 断言一段要放进 XML 文本节点的文本是「安全」的：没有裸 `<`，
 * 也没有**不是实体**的 `&`（转义后的文本当然含 `&`，那是合法的 `&lt;` / `&amp;`）。
 */
const assertXmlSafeText = (text, label) => {
  assert.ok(!text.includes('<'), label + '：出现裸 <');
  const bad = text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, '');
  assert.ok(!bad.includes('&'), label + '：出现未成实体的 &');
};

/** 组装一份最小文档（inner 用 XMLSerializer 风格，即已转义）。 */
const docWith = (css) =>
  shareSvgDocument({
    inner: '<div class="i1tZMq_shareBoard">hi</div>',
    css,
    w: 100,
    h: 50,
    pw: 200,
    ph: 100,
  });

check('转义：裸 < & > 都被换成实体，且 & 不会把刚生成实体再转一次', () => {
  assert.equal(xmlEscapeText('a<b & c>d'), 'a&lt;b &amp; c&gt;d');
  // 已经是实体的文本只该被转一次：&amp; → &amp;amp;（解码回来仍是 &amp;）
  assert.equal(xmlEscapeText('x&amp;y'), 'x&amp;amp;y');
  assert.equal(decodeXmlText(xmlEscapeText('x&amp;y')), 'x&amp;y');
});

check('XML 非法字符进不了 <style>：范围语法 / 实体 / `</style>` 闭合企图都被挡住', () => {
  const hostile =
    '@container i1tZMq_tm (width<=300px){.a{color:red}}' +
    '.b:before{content:"<&>"}' +
    '.c{color:#0000}/*</style><script>x</script>*/';
  const body = styleTextOf(docWith(hostile));
  assertXmlSafeText(body, '样式文本');
  assert.ok(!body.includes('</style'), '样式文本里不能出现 </style');
  assert.equal(decodeXmlText(body), hostile, '解码回来必须与原文逐字节相同');
});

check('真实产物：lib/client.js 内联的那份 CSS 走一遍组装仍然 XML 合法且逐字节还原', () => {
  let bundle;
  try {
    bundle = read('lib/client.js');
  } catch {
    throw new Error('读不到 lib/client.js：先 `pnpm -r build` 再跑自检');
  }
  const m = /var css = ('[^']*');/.exec(bundle);
  assert.ok(m !== null, 'lib/client.js 里找不到内联的 css 字面量（构建预设变了吗？）');
  // **必须按 JS 字面量求值**（不是取出源码文本）：产物里中文是 `\u63A8` 这种转义，
  // 运行时 `textContent` 拿到的是解码后的真字符，比对对象得与运行时一致才算数。
  const realCss = new Function('return ' + m[1])();
  assert.equal(typeof realCss, 'string');
  assert.ok(realCss.length > 1000, '取到的 CSS 太短，多半抓错了');

  const body = styleTextOf(docWith(realCss));
  assertXmlSafeText(body, '真实 CSS 组装后');
  assert.equal(decodeXmlText(body), realCss, '真实 CSS 解码回来必须逐字节相同');

  // 不是断言：产物里到底带不带 `<`，只报出来，便于判断雷还在不在（换压缩器可能就没了）
  const hazards = (realCss.match(/</g) || []).length;
  console.log(
    '  · 构建产物内联 CSS ' +
      realCss.length +
      ' 字符，其中裸 `<` ' +
      hazards +
      ' 处' +
      (hazards === 0 ? '（本轮压缩器没引入，转义仍是必需的兜底）' : '（正是转义要挡的东西）'),
  );
});

check('组装只此一处：SharePanel 的导出必须调用 shareSvgDocument', () => {
  const src = read('src/client/SharePanel.tsx');
  assert.ok(src.includes('shareSvgDocument('), 'boardToPngBlob 必须用 shareSvgDocument 组装文档');
  assert.ok(
    !/['"]<style>['"]\s*\+\s*collectShareCss\(\)/.test(src),
    '不要再把 collectShareCss() 原样拼进 <style>（那正是 SVG 渲染失败的成因）',
  );
});

console.log('✓ 分享卡 SVG 组装自检通过（' + groups + ' 组）');
