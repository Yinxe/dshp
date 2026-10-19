/**
 * Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里**——由 `shared/tsup.preset.ts` 的
 * banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/web-style', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 所以本文件就是一个**普通 ES 模块**：顶层 `import` 官方 primitives 与自己的组件，导出 `inject` /
 * `apply`。react / react/jsx-runtime / primitives 都在 tsup 的 external 列表里，编译成
 * `require('react')` 之类，由 factory 的 `require`（shell 的冻结模块表）解析——**绝不打包**，
 * 否则会出现第二份 React。
 *
 * apply 的装配顺序与原实现逐行对齐：建桥（createBridge）→ 启动恢复（restoreFromHost）→
 * 覆盖层清理 effect → 注册画廊设置节。样式不在这里注入：`styles.module.css` 由构建预设内联进
 * bundle，模块被求值时插一条 `<style data-plugin>`（卸载由 shell 按 data-plugin 清理）。
 *
 * 只注册一处：`settings.section`（list 槽位）——设置左侧导航里的「外观定制」一节，`id` 用本插件的
 * settings 命名空间（与本仓其它插件一致），而不是往通用页面里塞控件。
 *
 * @module @dshp/web-style/client
 */
import { disposeOverride, restoreFromHost } from './apply-theme.js';
import { createBridge, type Bridge } from './api.js';
import { GallerySection } from './GallerySection.js';
import type { ClientContext, SlotsService, ThemeService } from './types.js';

/** 设置节 id = settings 命名空间 = cordis 行 id（仓库约定：NS 四处同名）。 */
const SETTINGS_NS = 'dshp-web-style';

/** 设置节的导航排序（本仓占位表里 web-style 的固定位置）。 */
const SETTINGS_ORDER = 50;

/** 设置节在左侧导航里的标题。 */
const SETTINGS_LABEL = '外观定制';

/** client 半声明的服务依赖（缺了就不激活，由 cordis 在 slots / theme 出现后重试）。 */
export const inject = ['slots', 'theme'];

/**
 * client 半入口：由 shell 的模块系统在 slots 与 theme 就绪后调用一次。
 *
 * @param ctx - client 侧 cordis 上下文（本插件只用 `get` / `effect`；`on` 由画廊组件用）。
 */
export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  const theme = ctx.get('theme') as ThemeService | undefined;
  if (slots === undefined || theme === undefined) return;

  // 样式不在这里注入：`styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条
  // `<style data-plugin>`（卸载由 shell 按 data-plugin 清理）。见 shared/tsup.preset.ts。

  const bridge: Bridge = createBridge();

  // 启动恢复：读 settings 持久化的 themeId 重建覆盖层（壁纸 MD3 从 seed 重建），同时恢复圆角
  restoreFromHost(theme, bridge);

  // 插件停止时收回 DOM 侧痕迹：token 覆盖层 + 动效舞台 + 自注入样式（ctx.effect 自动收回）
  ctx.effect(() => () => disposeOverride(), 'dshp-web-style: override teardown');

  // 外观定制页 = 主题画廊（全局圆角等仍在画廊尾部）
  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
            // 槽位只传它自己的 props；ctx / theme / bridge 是 apply 作用域的依赖，由这层薄适配器注入。
            () => <GallerySection ctx={ctx} theme={theme} bridge={bridge} />,
          ),
        ),
      'dshp-web-style: settings section',
    );
  } catch (error) {
    console.error('[dshp-web-style] 注册设置节失败，外观定制页将不可用：', error);
  }
}
