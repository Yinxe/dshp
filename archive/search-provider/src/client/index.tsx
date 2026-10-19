/**
 * Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里**——由构建预设的 banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/search-provider', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 所以本文件就是一个**普通 ES 模块**：顶层 `import` 自己的组件，导出 `inject` / `apply`。
 * react / react/jsx-runtime / primitives 都在 external 列表里，编译成 `require(...)`，由 factory 的
 * `require`（shell 的冻结模块表）解析——**绝不打包**，否则会出现第二份 React。
 *
 * 样式也不在这里注入：`styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条
 * `<style data-plugin>`（卸载由 shell 按 data-plugin 清理）。见 shared/tsup.preset.ts。
 *
 * 自有模块（api/components/providers/SearchSection）全部内联打包。设置页密钥读写走 api 网关
 * credentials 域，故 `inject` 里声明 `remote` 与 `remote.credentials`。
 *
 * 原实现：dsh-tavily-search/client.js（手写 __ModuleLoader__ bundle）
 * → 本文件为等价 TS 重写：section id / order 更新为 @dshp/search-provider 时代。
 *
 * @module @dshp/search-provider/client
 */
import { createBridge } from './api.js';
import { createSearchSection } from './SearchSection.js';
import type { ClientContext, SlotsService } from './types.js';

/** 设置节 id = settings 命名空间 = cordis 行 id（仓库约定：NS 四处同名）。 */
const SETTINGS_NS = 'dshp-search-provider';

/** 设置节的导航排序（占位表里 search-provider 的固定位置）。 */
const SETTINGS_ORDER = 28;

/** 设置节在左侧导航里的标题。 */
const SETTINGS_LABEL = 'AI 搜索';

/** client 半声明的服务依赖（缺了就不激活，由 cordis 在服务出现后重试）。 */
export const inject = ['slots', 'remote', 'remote.credentials'];

/**
 * client 半入口：由 shell 的模块系统在 slots 就绪后调用一次。
 *
 * @param ctx - client 侧 cordis 上下文（本插件只用 `get` / `effect`）。
 */
export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  const bridge = createBridge(ctx.get('remote'));
  const Section = createSearchSection(bridge);

  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
            Section,
          ),
        ),
      'dshp-search-provider: settings section',
    );
  } catch (error) {
    console.error('[dshp-search-provider] 注册设置节失败，设置页将看不到 AI 搜索配置：', error);
  }
}
