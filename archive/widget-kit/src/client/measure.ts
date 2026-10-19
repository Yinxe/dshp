/**
 * 量「最小化胶囊需要多宽」—— 直接量**整条标题栏的自然宽度**，不靠任何手写常量
 *
 * 前一版是「量标题文字 + 按常量加上内边距 / 间隙 / 按钮宽度」，结果标题仍然被挤压：只要有一处常量
 * 与真实排版不一致（官方 primitives 换了按钮尺寸、`Menu` 锚点外面多一层包装、卡片自己有 0.5px 边框……），
 * 算出来就偏窄，而偏窄的表现恰恰是「标题被省略号截掉」。所以改成量**最终渲染**：
 *
 *  1. 把标题栏**克隆**一份（连着真实的按钮、真实的内边距与 gap）；
 *  2. 放到屏幕外、`width: max-content` —— 浏览器按自然宽度排版这份克隆，flex 子项不再被压缩，
 *     标题不需要省略号也放得下，量到的就是「胶囊得多宽」；
 *  3. 再加上卡片自己的左右边框 / 内边距（卡片是 `border-box`，边框会吃掉内容宽度）。
 *
 * 克隆里先把「最小化时会收起的元素」（副标题）按 0 宽处理，否则在展开态量出来的宽度会白算一个副标题。
 * 量不到（没有 DOM、元素已摘掉、矩形为 0）返回 `null`：调用方据此**不回报**，胶囊退回地板宽度 ——
 * 宁可保守，也不要拿一个偏窄的宽度把标题截掉。
 *
 * @module @dshp/widget-kit/client/measure
 */

/** 取一个长度值（`getComputedStyle` 给的是带单位的字符串）；非法值当 0。 */
function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** 卡片自己的左右边框 + 内边距：`border-box` 下它们会吃掉内容宽度，胶囊得把它们算进去。 */
function ownerInsets(owner: Element): number {
  if (typeof getComputedStyle !== 'function') return 0;
  const style = getComputedStyle(owner);
  return Math.ceil(
    px(style.borderLeftWidth) + px(style.borderRightWidth) + px(style.paddingLeft) + px(style.paddingRight),
  );
}

/**
 * 量最小化胶囊需要的宽度（px）。
 *
 * @param header - 标题栏元素（`styles.cardHeader`）。
 * @param collapsedClass - 「最小化时会被收起」的元素类名（副标题）：克隆里把它们按 0 宽处理，
 *   与真实的最小化状态一致 —— 否则展开态量出来的宽度会多算一个副标题。拿不到类名就不收（只多算一点宽度）。
 * @returns 向上取整的宽度；量不到时 `null`（调用方据此保留地板宽度）。
 */
export function measureHeaderWidth(
  header: Element | null,
  collapsedClass: string | undefined,
): number | null {
  if (header === null || typeof document === 'undefined') return null;
  const owner = header.parentElement;
  if (owner === null) return null;
  let probe: HTMLElement | null = null;
  try {
    probe = header.cloneNode(true) as HTMLElement;
    probe.removeAttribute('tabindex');
    if (collapsedClass !== undefined && collapsedClass !== '') {
      // 属性选择器而不是 `.${cls}`：CSS Module 生成的名字不该被当成选择器语法来信任
      for (const node of Array.from(probe.querySelectorAll(`[class~="${collapsedClass}"]`))) {
        // 鸭子类型而不是 `instanceof HTMLElement`：那个全局在没有 DOM 的宿主里根本不存在，
        // `instanceof` 会直接抛（本仓的自检就是这种宿主）
        const collapsed = node as { style?: CSSStyleDeclaration };
        if (collapsed.style === undefined) continue;
        collapsed.style.maxWidth = '0';
        collapsed.style.opacity = '0';
      }
    }
    const style = probe.style;
    style.position = 'fixed';
    style.left = '-10000px';
    style.top = '0';
    style.width = 'max-content';
    style.maxWidth = 'none';
    style.visibility = 'hidden';
    style.pointerEvents = 'none';
    owner.append(probe);
    const rect = probe.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || rect.width <= 0) return null;
    return Math.ceil(rect.width) + ownerInsets(owner);
  } catch {
    // 元素已从文档里摘掉、宿主没实现 cloneNode 之类：当作「量不到」，别把整层卡片带崩
    return null;
  } finally {
    probe?.remove();
  }
}

/**
 * 标题实际溢出了多少（px）—— `> 0` 就是「正被省略号截着」。
 *
 * 用它给胶囊补差（见 `geometry.capsuleOverflowFix`）：这是**标题自己**的渲染事实，
 * 不受「我们量的是不是同一个时刻」影响。量不到（没有元素 / 没有 DOM）时返回 0。
 *
 * @param el - 标题元素（`styles.cardTitle`）。
 */
export function textOverflowPx(el: Element | null): number {
  if (el === null) return 0;
  const node = el as { scrollWidth?: number; clientWidth?: number };
  const scroll = node.scrollWidth;
  const client = node.clientWidth;
  if (scroll === undefined || client === undefined) return 0;
  if (!Number.isFinite(scroll) || !Number.isFinite(client)) return 0;
  return Math.max(0, Math.ceil(scroll - client));
}
