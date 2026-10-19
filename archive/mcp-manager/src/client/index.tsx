/**
 * @dshp/mcp-manager —— Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里**——由构建预设的 banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/mcp-manager', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 所以本文件就是一个**普通 ES 模块**：顶层 `import` 官方 primitives 与自己的组件，导出 `inject` /
 * `apply`。react / react/jsx-runtime / primitives 都在 external 列表里，编译成 `require(...)`，
 * 由 factory 的 `require`（shell 的冻结模块表）解析——**绝不打包**，否则会出现第二份 React。
 *
 * 只注册一处：`settings.section`（list 槽位）——设置左侧导航里的「MCP」一节，`id` 用本插件的
 * settings 命名空间（与本仓其它插件一致）。
 *
 * @module @dshp/mcp-manager/client
 */
import { McpSection } from './McpSection.js';
import type { ClientContext, SlotsService } from './types.js';

/** 设置节 id = settings 命名空间 = cordis 行 id（仓库约定：NS 四处同名）。 */
const SETTINGS_NS = 'dshp-mcp-manager';

/**
 * 设置节的导航排序。
 *
 * 30 是本仓占位表里 mcp-manager 的固定位置（vision-bridge 25 / mcwiki-search 26 / token-meter 27 /
 * search-provider 28 / skill-manager 29 / mcp-manager 30 / file-change-viewer 31）。
 */
const SETTINGS_ORDER = 30;

/** 设置节在左侧导航里的标题。 */
const SETTINGS_LABEL = 'MCP';

/** client 半声明的服务依赖（缺了就不激活，由 cordis 在 slots 出现后重试）。 */
export const inject = ['slots'];

/**
 * client 半入口：由 shell 的模块系统在 slots 就绪后调用一次。
 *
 * @param ctx - client 侧 cordis 上下文（本插件只用 `get('slots')` 与 `effect`）。
 */
export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  // 样式不在这里注入：`styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条
  // `<style data-plugin>`（卸载由 shell 按 data-plugin 清理）。见 shared/tsup.preset.ts。

  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
            McpSection,
          ),
        ),
      'dshp-mcp-manager: settings section',
    );
  } catch (error) {
    console.error('[dshp-mcp-manager] 注册设置节失败，设置页将看不到 MCP 管理：', error);
  }
}
