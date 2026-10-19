/**
 * 分享卡：把「用量统计 / 在线统计」里**已经在用的那些组件**原样内聚进一张 16:9 的板子，
 * 再整体缩放进分享面板；导出走 DOM → SVG `<foreignObject>` → canvas → PNG。
 *
 * ── 为什么是内聚真组件，而不是自绘一份 ───────────────────────────────
 * 用量/在线的观感是调好的（卡面、强调色、分档、轴标签都成体系），自绘一份等价物等于
 * 把这套体系重写一遍，必然越走越偏——分享卡与视图不一致，看的人第一眼就觉得"不对"。
 * 所以这里只做两件事：**选哪几块 + 怎么排**；颜色、字号、图形、间距全部交给组件自己。
 *
 * ── 坐标系统 ────────────────────────────────────────────────────────
 * 板子按**逻辑尺寸 1920×1080（正好 16:9）**排版：组件在这里量到的宽度就是它真实的
 * 布局宽度，响应式分栏（container query / ResizeObserver）照常生效。展示时整块板子用
 * `transform: scale(1600/1920)` 缩进舞台；导出时不缩放 DOM，而是把这一块直接塞进
 * 一个 `viewBox="0 0 1920 1080"`、`width=3200 height=1800` 的 SVG 里一次性光栅化 ——
 * 于是文字是按 2× 目标分辨率重新渲染的，不是把小图放大。
 *
 * ── 导出为什么要内联 CSS ──────────────────────────────────────────────
 * `<foreignObject>` 里的内容在一个独立的文档上下文里，读不到 DSH 壳层的样式表，
 * 所以必须把插件自己的 CSS 与用到的设计 token 的**计算值**一起内联进去。
 *
 * ── 内联 CSS 必须走 XML 转义 ───────────────────────────────────────────
 * SVG 是 XML 文档，样式文本里一个裸 `<` 就让整份文档解析失败（表现：下载与复制都报
 * 「SVG 渲染失败」）。压缩后的 CSS 真的会带 `<`（容器查询范围语法 `(width<=300px)`），
 * 所以组装统一走 `share-svg.ts` 的 `shareSvgDocument()` —— 见那个文件的头注释与
 * `scripts/check-share-svg.mjs`。
 */
import { forwardRef, useMemo, type ReactNode } from 'react';
import styles from './styles.module.css';
import { DISPLAY_NAME } from '../name.js';
import { Glyph } from './glyphs.js';
import { aggregate, rangeText, type Agg } from './StatsSection.js';
import { shareSvgDocument } from './share-svg.js';
import type { StatsSnapshot } from './types.js';

/**
 * 包元信息：**构建期从 `package.json` 注入**（见 tsup.config.ts 的 `define`）。
 * 页头要显示「插件名 + 版本 + 仓库」，这三样只允许有一个来源 —— 写死字面量的话，
 * 改包名/仓库时版本会自动跟着走、名字和地址却不会，迟早对不上。
 * 未注入时（例如直接跑源码）退化成下面的占位值，不影响功能。
 */
declare const __DSHP_TOKEN_METER_PKG__: { name: string; version: string; repo: string } | undefined;
export const PKG: { name: string; version: string; repo: string } =
  typeof __DSHP_TOKEN_METER_PKG__ === 'object' && __DSHP_TOKEN_METER_PKG__ !== null
    ? __DSHP_TOKEN_METER_PKG__
    : { name: '@dshp/token-meter', version: '', repo: '' };

/*
 * 尺寸模型（**不要再引入固定画幅**）：
 *  板宽跟随容器（width:100%）→ 组件按真实像素宽度排版（响应式分栏与 container query 照常生效）
 *  → 字是 100% 大小；高度由内容决定，装不下就在舞台内滚动（与视图 .tm-cbody 同一套模型）。
 *  导出的图是这块真实 DOM 的 2× 光栅化，长宽比跟随内容。
 *
 *  曾经试过「锁 16:9 + 板宽按内容反推」：那是正反馈（板宽↑ → 图表列变宽 → 内容更高 → 板宽再↑，
 *  一路收敛到 2382×1340、整体缩到 0.49，字糊成一片）；也试过硬塞进 1600×900（内容自然高度
 *  一千多像素，只能靠压列数，压到热力格子只剩 4px）。两条都别再走。
 */

/**
 * 板子上用到的设计 token —— **必须与 `styles.module.css` 里出现的 `--dsw-*` 一一对应**。
 * 导出时这些变量要在 foreignObject 内联成计算值，漏一个就会让组件在导出的图里掉色
 * （fallback 到 inherit/initial）。自检：`node -e` 比对样式文件里的 token 集合。
 */
export const SHARE_TOKENS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-module-platform',
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-brand-primary',
  '--dsw-alias-button-ghost-active-fill',
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-label-caption',
  '--dsw-alias-label-dimmed',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-primary-foreground',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-state-business-primary',
  '--dsw-alias-state-business-tertiary',
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-success-tertiary',
  '--dsw-alias-state-warn-label',
  '--dsw-alias-state-warn-primary',
  '--dsw-alias-state-warn-tertiary',
  '--dsw-corner-shape',
  '--dsw-shadow-lv3',
  '--dsw-specific-menu',
];

/** 内聚到分享卡上的组件（全部来自 createStatsSection / createOnlineSection 的产出面） */
export interface ShareSections {
  StatCardsSection: any;
  TrendSection: any;
  HeatSection: any;
  DonutSection: any;
  /** 嵌入式在线块（三口径 / 每日在线图），由 OnlineSection 提供 */
  OnlineEmbed: any;
}

export interface ShareInput {
  data: StatsSnapshot;
  gitName?: string | undefined;
  gitEmail?: string | undefined;
  showIdentity?: boolean | undefined;
}

export interface ShareBoardProps extends ShareInput {
  /**
   * 要内聚的组件。作为 **prop** 而不是工厂闭包传进来：这些分区组件由 StatsSection 提供，
   * 在线块由 OnlineSection 提供，两边在 index.tsx 才汇合；用 prop 传可以避免"谁先创建谁"
   * 的时序问题，也不会因为 sections 对象每次重建而把整块板子重新挂载。
   */
  sections: ShareSections;
}

/**
 * 分享卡本体（DOM）。
 *
 * 版式：一张 16:9 板子，两列栅格：
 *   ① 用量基础数据（指标卡，通栏）
 *   ② 趋势 | 热力图
 *   ③ 每日在线 | 模型分布
 *   ④ 在线三口径（通栏）
 * 上下留页头（标题 + 著者）与页脚（插件名 + 生成时间）。
 *
 * 原来是 `createShareBoard(React)` 工厂（只为注入 React 与 Glyph）：两者都改成模块顶层
 * import 后工厂取消，直接导出组件。**必须 forwardRef**：导出时要拿到板子的真实 DOM 节点
 * 去做光栅化；普通函数组件收不到 ref（React 只发一条警告），节点恒为 null，导出会静默失败。
 */
export const ShareBoard = forwardRef<HTMLDivElement, ShareBoardProps>(
  function ShareBoard(props, ref): ReactNode {
    const sections = props.sections;
    const data = props.data;
    const aggAll: Agg = useMemo(() => aggregate(data.records || [], null), [data]);
    const who =
      props.showIdentity !== false && props.gitName !== undefined ? (
        <b className={styles.shareAuthor}>{props.gitName}</b>
      ) : null;
    // 分栏顺序即阅读顺序：先「用量」后「在线」，与视图里的分区顺序一致。
    return (
      <div
        // 同时挂 tm-cview：它自带 container-type:inline-size 与 container-name:tmc，组件的响应式
        // 断点（@container tmc 以及 .tm-cview 前缀的那批规则）于是以**板宽**为准。导出时
        // foreignObject 里没有 .tm-cview 祖先，若不带这个类，预览与导出会长得不一样。
        className={styles.shareBoard + ' ' + styles.cview}
        ref={ref}
      >
        <header className={styles.shareHead}>
          {/* 第一层：标题区（左）+ 作者区（右）。作者是「谁做的」，与「由什么生成」分开，
            不再把 作者/插件名/版本/邮箱/仓库 全堆在同一两行里右对齐（那会拖出一条长短不齐的长尾巴）。 */}
          <div className={styles.shareTop}>
            <div className={styles.shareTitleBox}>
              <span className={styles.shareBrandRow}>
                <Glyph name="layers" size={19} className={styles.shareLogo} />
                <span className={styles.shareBrand}>{DISPLAY_NAME}</span>
              </span>
              <span className={styles.shareSub}>{'DeepSeek Harness · 用量与在线时长总览'}</span>
            </div>
            <div className={styles.shareAuthorBox}>
              {who}
              {props.showIdentity !== false && props.gitEmail !== undefined ? (
                <span className={styles.shareMail}>{props.gitEmail}</span>
              ) : null}
            </div>
          </div>
          {/* 第二层：来源信息条 —— 插件名 / 版本 / 仓库**左对齐独占一行**，生成信息靠右。
            与标题层之间有细线分隔，所以「是谁」和「由什么生成」一眼分得开。 */}
          <div className={styles.shareMeta}>
            <span className={styles.sharePlug}>
              {PKG.name}
              {PKG.version !== '' ? <em>{'v' + PKG.version}</em> : null}
            </span>
            <span className={styles.shareMetaSep}>{'·'}</span>
            <span className={styles.shareRepo}>{PKG.repo}</span>
            <span className={styles.shareMetaR}>
              {'会话 ' +
                data.sessions +
                ' 个 · 记录 ' +
                aggAll.byDay.size +
                ' 天 · 生成于 ' +
                new Date().toLocaleString('zh-CN', { hour12: false })}
            </span>
          </div>
        </header>
        <div className={styles.shareGrid}>
          {/* ① 用量基础数据：13 张指标卡通栏一行 */}
          <div className={styles.shareCell + ' ' + styles.sr6}>
            <sections.StatCardsSection aggAll={aggAll} data={data} />
          </div>
          {/* ② 用量两张图并排：趋势 | 热力图 */}
          <div className={styles.shareCell}>
            <sections.TrendSection data={data} aggAll={aggAll} />
          </div>
          <div className={styles.shareCell}>
            <sections.HeatSection data={data} aggAll={aggAll} />
          </div>
          {/* ③ 以下四块各占一整行（宽度给足，图表/列表才铺得开；长图无所谓）
            外面这层 .tm-donutWide 不能省：**宽布局（圆环在左 + 模型列表多列）不是 DonutSection
            自己响应的，而是调用方包出来的**（视图里也是这么调的）。少这层就退回默认窄布局，
            看起来就像"组件在分享面板里不响应式了"。 */}
          <div className={styles.shareCell + ' ' + styles.sr6}>
            <div className={styles.donutWide}>
              <sections.DonutSection data={data} agg={aggAll} rangeLabel={rangeText('all')} />
            </div>
          </div>
          <div className={styles.shareCell + ' ' + styles.sr6}>
            <sections.OnlineEmbed data={data} block="metrics" />
          </div>
          <div className={styles.shareCell + ' ' + styles.sr6}>
            <sections.OnlineEmbed data={data} block="daily" />
          </div>
          <div className={styles.shareCell + ' ' + styles.sr6}>
            <sections.OnlineEmbed data={data} block="rank" />
          </div>
        </div>
      </div>
    );
  },
);
ShareBoard.displayName = 'TmShareBoard';

/**
 * 从已在屏的 CSS Module 样式标签里取插件样式文本。
 *
 * 构建预设会在模块求值时往 `<head>` 插一条
 * `<style data-plugin="@dshp/token-meter" data-plugin-css="@dshp/token-meter/src/client/styles.module.css">`；
 * 类名在构建期被哈希成 `<hash>_local`，**导出的内联样式表必须是同一份哈希后的文本**，
 * 否则分享卡导出的图会完全掉色。这里按 `data-plugin-css` 前缀取（别写死整条 id），
 * 取不到就退化成空串 —— 外壳只是掉色，不该让导出抛错。
 */
function readPluginCss(): string {
  try {
    const el = document.querySelector('style[data-plugin-css^="@dshp/token-meter/"]');
    return el?.textContent ?? '';
  } catch {
    return '';
  }
}

/**
 * 导出用的样式：插件自身 CSS + 用到的 token 计算值。
 * token 必须在**导出那一刻**从 body 上读一次（主题可能刚被切换）。
 *
 * 返回值是**未转义的 CSS 原文**：它要进 `<style>`（XML 文本节点），必须交给
 * `shareSvgDocument()` / `xmlEscapeText()` 转义后再拼进 SVG —— 别拿它直接字符串拼接。
 */
export function collectShareCss(): string {
  const vars: string[] = [];
  try {
    const cs = getComputedStyle(document.body);
    for (const name of SHARE_TOKENS) {
      const v = cs.getPropertyValue(name).trim();
      if (v !== '') vars.push(name + ':' + v);
    }
  } catch {
    /* 读不到变量：CSS 里的 var() 会走各自 fallback，最多是掉色，不该让导出失败 */
  }
  // 变量同时挂到板子与 body 上：组件里的 var() 在两种继承路径下都能取到
  const decl = vars.join(';');
  /**
   * **必须禁掉动画与过渡** —— 这是「下载/复制出来的图里什么都没有」的真正原因。
   * 卡片带入场动画（`.tm-card{animation:tm-fadeup .42s ease backwards}`，而
   * `@keyframes tm-fadeup{from{opacity:0}}`），`backwards` 会让元素在动画开始前保持 opacity:0。
   * 在 `<img>` 里渲染的 SVG **不会推进 CSS 动画**（它是静态图像上下文），于是每张带
   * 入场动画的卡片都以「全透明」被光栅化，导出的图里只剩下没有动画的页头页脚 —— 看起来
   * 就是"一片空白"。这里用 !important 把它们压掉（静态图上动画本来也没有意义）。
   */
  return (
    '*,:before,:after{animation:none!important;transition:none!important}' +
    'body,.' +
    styles.shareBoard +
    '{' +
    decl +
    '}' +
    readPluginCss()
  );
}

/**
 * 把板子光栅化成 PNG：**长宽比跟随板子本身**（= 屏幕上看的那块 DOM），默认 2×。
 *
 * 不再往 16:9 里塞 —— 那会把内容整体缩到 0.5 上下（字糊）、两侧留大片底色。
 * 导出即所见：预览里滚动的整块板子，按 2× 分辨率重新光栅化。
 *
 * @param node 板子节点
 * @param w,h  板子的实测尺寸（导出前由外壳量一次）
 */
export async function boardToPngBlob(node: HTMLElement, w: number, h: number, scale = 2): Promise<Blob> {
  const pw = Math.max(1, Math.round(w * scale));
  const ph = Math.max(1, Math.round(h * scale));
  const clone = node.cloneNode(true) as HTMLElement;
  // 预览用的 transform 缩放 / left 定位都不能带进导出：板子按逻辑尺寸一次性光栅化
  clone.style.transform = 'none';
  clone.style.transformOrigin = '0 0';
  clone.style.left = '0';
  clone.style.position = 'static';
  const inner = new XMLSerializer().serializeToString(clone);
  // 组装必须走 share-svg.ts：样式表**原文**要 XML 转义后才能进 `<style>`，压缩后的
  // 容器查询范围语法（`(width<=300px)`）里就有裸 `<`，不转义会让整个 SVG 解析失败。
  const svg = shareSvgDocument({ inner, css: collectShareCss(), w, h, pw, ph });
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = new Image();
  img.decoding = 'sync';
  await new Promise<void>((resolve, reject) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener(
      'error',
      () => {
        // 只记长度与尺寸（文档内容含用户数据，不进日志）：复现这份报错时先看这两个数。
        console.error(
          '[dshp-token-meter] 分享卡 SVG 光栅化失败：文档 ' + svg.length + ' 字符 / ' + pw + '×' + ph,
        );
        reject(new Error('SVG 渲染失败'));
      },
      { once: true },
    );
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('canvas 不可用');
  // 先铺底色：foreignObject 的边缘抗锯齿会透出透明像素
  try {
    ctx.fillStyle =
      getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim() || '#0d1015';
  } catch {
    ctx.fillStyle = '#0d1015';
  }
  ctx.fillRect(0, 0, pw, ph);
  // 1:1 贴上去：SVG 的固有尺寸就是画布尺寸（raster 已在 2× 上重排），偏移恒为 0
  ctx.drawImage(img, 0, 0, pw, ph);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b === null ? reject(new Error('PNG 编码失败')) : resolve(b)), 'image/png');
  });
}

/** 触发一次浏览器下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
