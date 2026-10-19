/**
 * 分享卡导出的 SVG 文档组装（**纯函数、Node 可直跑**，不碰 DOM）。
 *
 * ── 为什么内联样式必须转义 ────────────────────────────────────────────
 * 导出链路是 `DOM → SVG <foreignObject> → Image → canvas → PNG`。SVG 是 **XML**
 * 文档，而样式表是**原样**拼进 `<style>` 的：只要这段文本里出现一个裸 `<`，整个
 * 文档就不是合法 XML，`<img>` 立即触发 error —— 界面上就是「失败：SVG 渲染失败」，
 * 下载与复制**一条都走不通**（两条走的是同一个函数）。
 *
 * 这个 `<` 不是假设，是构建产物里真实存在的：`styles.module.css` 手写的是
 * `@container tmc (max-width:1320px)`，而 lightningcss 压缩时会把它改写成范围语法
 * `@container tmc (width<=1320px)`（本插件当前产物里 16 处）。CSS Module 迁移之前，
 * 内联的是**未压缩**的 `styles.ts` 字符串，所以那时踩不到这颗雷。
 *
 * ── 为什么是转义，而不是「别用范围语法」 ──────────────────────────────
 * 范围语法是合法 CSS（而且是压缩器的产物，管不了），裸 `&` 同理；对拼进 XML 的
 * 文本做 XML 转义是这里唯一的通用解。`<style>` 在 XML 里是普通元素，实体照常解码，
 * 因此 CSS 落到 style 元素文本内容时与原文**逐字节一致** ——
 * `scripts/check-share-svg.mjs` 用往返断言钉住这一点：只「能加载」还不够，容器查询
 * 这类规则必须照样生效（`&lt;` 若不解码，`(width&lt;=300px)` 会让整条规则被丢弃，
 * 那是**静默掉样式**，比报错更难发现）。
 */

/**
 * XML 文本转义。
 *
 * `&` 必须第一个换：反过来的话，刚生成的 `&lt;` 会被再转一次，`<style>` 里就变成
 * 字面量 `&lt;`，元素能加载但规则失效（见文件头）。
 *
 * `>` 严格来说只有 `]]>` 需要转义，这里一并转掉：代价是零，省掉一个「什么时候才需要」
 * 的判断。
 *
 * @param text - 要放进 XML 文本节点的原始文本（例如压缩后的 CSS 原文）。
 * @returns 可安全嵌入 XML 文本节点的等价文本。
 */
export function xmlEscapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 组装分享卡 SVG 文档所需的全部输入。 */
export interface ShareSvgSpec {
  /** 板子序列化后的 XHTML 片段（`XMLSerializer` 产物，**自带转义**，不要再转一次） */
  inner: string;
  /** 内联样式表**原文**（未转义；由本函数负责转义） */
  css: string;
  /** 板子的逻辑宽度（CSS 像素） */
  w: number;
  /** 板子的逻辑高度（CSS 像素） */
  h: number;
  /** 画布宽（逻辑宽度 × 倍率）：`<img>` 的固有宽度，文字按这个分辨率重新光栅化 */
  pw: number;
  /** 画布高（逻辑高度 × 倍率） */
  ph: number;
}

/**
 * 组装可当 `<img src>` 用的 SVG 文档文本。
 *
 * `inner` 来自 `XMLSerializer`，它的文本 / 属性值已经转义过，再转一次就会把
 * `&amp;` 之类变成字面量；所以**只有 css 需要转义**，两者的区别在这里定死。
 *
 * @param spec - 序列化后的板子、样式表原文与尺寸。
 * @returns 完整的 `<svg>` 文档文本（未编码，调用方自行编码成 data URL）。
 */
export function shareSvgDocument(spec: ShareSvgSpec): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    spec.pw +
    '" height="' +
    spec.ph +
    '" viewBox="0 0 ' +
    spec.w +
    ' ' +
    spec.h +
    '">' +
    '<foreignObject x="0" y="0" width="' +
    spec.w +
    '" height="' +
    spec.h +
    '">' +
    '<div xmlns="http://www.w3.org/1999/xhtml"><style>' +
    xmlEscapeText(spec.css) +
    '</style>' +
    spec.inner +
    '</div></foreignObject></svg>'
  );
}
