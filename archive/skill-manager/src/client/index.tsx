/**
 * Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里**——由 `shared/tsup.preset.ts` 的
 * banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/skill-manager', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 所以本文件就是一个**普通 ES 模块**：顶层 `import` 自己的组件，导出 `inject` / `apply`。
 * react / react/jsx-runtime / primitives 都在 tsup 的 external 列表里，编译成 `require('react')`
 * 之类，由 factory 的 `require`（shell 的冻结模块表）解析——**绝不打包**，否则会出现第二份 React。
 *
 * 两处注册，互不干扰：
 *
 * 1. `settings.section`（list 槽位）：设置左侧导航里的「Skills」一节（order 29）。
 * 2. `conversation.input.right`（list 槽位，纯附加）：零尺寸探针，只接收会话标准 props
 *    （inputActions / sessionId），供「新建技能」在当前工作区的新会话输入框里程序化写入
 *    /skill-creator（`InputActions.setDraft` 为官方认可入口）。
 *
 * @module @dshp/skill-manager/client
 */
import { SkillInputProbe, SkillSection, ctxHolder } from './SkillSection.js';
import type { ClientContext, SlotsService } from './types.js';

/** 设置节 id = settings 命名空间 = cordis 行 id（仓库约定：NS 四处同名）。 */
const SETTINGS_NS = 'dshp-skill-manager';

/**
 * 设置节的导航排序。
 *
 * 29 是本仓占位表里 skill-manager 的固定位置（vision-bridge 25 / mcwiki-search 26 /
 * token-meter 27 / search-provider 28 / skill-manager 29 / mcp-manager 30 / file-change-viewer 31）。
 */
const SETTINGS_ORDER = 29;

/** 设置节在左侧导航里的标题。 */
const SETTINGS_LABEL = 'Skills';

/**
 * 输入框右侧探针在 `conversation.input.right`（list 槽）里的排序。
 *
 * 与原实现一致（90）；探针本身零尺寸，order 只是让它在右侧工具区里有个稳定位置。
 */
const INPUT_RIGHT_ORDER = 90;

/** client 半声明的服务依赖（缺了就不激活，由 cordis 等 slots 出现后重试）。 */
export const inject = ['slots'];

/**
 * client 半入口：由 shell 的模块系统在 slots 就绪后调用一次。
 *
 * @param ctx - client 侧 cordis 上下文（本插件只用 `get('slots')` 与 `effect`）。
 */
export function apply(ctx: ClientContext): void {
  // 模块级 ctx 持有：原实现在 apply 一进来就存下 ctx，「新建」流程稍后用它读 uiWorkspace
  // 等可选服务。赋值时机与原来完全一致（早于任何注册与提前返回）。
  ctxHolder.current = ctx;

  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  // 样式不在这里注入：`styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条
  // `<style data-plugin>`（卸载由 shell 按 data-plugin 清理）。见 shared/tsup.preset.ts。

  // ── 设置节（设置 → 左侧导航「Skills」）──
  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
            SkillSection,
          ),
        ),
      'dshp-skill-manager: settings section',
    );
  } catch (error) {
    console.error('[dshp-skill-manager] 注册设置节失败，设置页将看不到技能管理：', error);
  }

  // ── 输入框右侧零尺寸探针（ui-conversation 未挂载时这条注册不渲染任何东西，纯增量）──
  try {
    ctx.effect(
      () =>
        slots.inject('conversation.input.right', () =>
          slots.register(
            { name: 'conversation.input.right', id: SETTINGS_NS, order: INPUT_RIGHT_ORDER },
            SkillInputProbe,
          ),
        ),
      'dshp-skill-manager: input right probe',
    );
  } catch (error) {
    console.error('[dshp-skill-manager] 注册输入框右侧探针失败，「新建」将退化为剪贴板兜底：', error);
  }
}
