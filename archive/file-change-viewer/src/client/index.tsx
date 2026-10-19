/**
 * Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里**——由 `tsup.config.ts` 的
 * banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/file-change-viewer', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 所以本文件就是一个**普通 ES 模块**：顶层 `import` React 与官方 primitives，导出 `inject` /
 * `apply`。react / react/jsx-runtime / primitives 都在 tsup 的 external 列表里，编译成
 * `require('react')` 之类，由 factory 的 `require`（shell 的冻结模块表）解析——**绝不打包**，
 * 否则会出现第二份 React。
 *
 * 三处注册，互不干扰：
 *
 * 1. `settings.section`（list 槽位）：设置左侧导航里的「File Change View」一节——本插件**自己的配置区**，
 *    `id` 用本插件的 settings 命名空间（与本仓其它插件一致），而不是往通用页面里塞控件。
 * 2. `tool.call.toolview`（keyed 槽位，按线上工具名分发）：注册 `edit` / `write` 即**替换**官方内置
 *    卡片（官方文档：「a key the shipped composition already covers is replaced, not shared」），
 *    `str_replace_editor` 是同类文件修改工具的兼容项——该工具未挂载时这条注册不渲染任何东西，纯增量。
 * 3. `conversation.session.header.utilities`（list 槽位，session 作用域）：会话页头右侧的两个快捷
 *    开关（一键展开 / 收起所有文件 diff、切换差异视图）。它们改的是**会话级覆盖**（`session.ts`，
 *    只在内存里、换会话即失效），不碰 `settings.yaml` 里的全局偏好。
 *
 * @module @dshp/file-change-viewer/client
 */
import { FileChangeRow } from './FileChangeRow.js';
import { FileChangeViewerSection } from './FileChangeViewerSection.js';
import { startPrefs } from './prefs.js';
import { SessionControls } from './SessionControls.js';
import type { ClientContext, SlotsService } from './types.js';

/** 会话本地化命名空间：由官方 `dsh-client-ui-conversation` 持有并供工具卡片渲染器共用。 */
const CONVERSATION_NS = 'conversation';

/**
 * 影子化内置卡片所需的注册优先级。
 *
 * keyed 槽位按「key + priority」去重，**同 key 同 priority 会直接抛错**
 * （`keyed slot "…" already has an entry for key "edit" at priority 0 … register at a
 * different priority to shadow it (lowest renders)`）；派发本身把 entries 按 priority 升序
 * 取每个 key 的**第一条**，所以「数值最小者渲染」。官方 `file-mutation-toolview` 注册
 * edit / write 时没有传 priority（即 0），因此这里必须比 0 **更小**才能接管。
 *
 * 取 -1 而不是更小的值是有意的：动态 Cordis 插件（`cordis_define`）的影子优先级由运行时
 * 从 -1 开始逐个分配，取 -1 意味着「两份注册同时存在时会明确撞车并打出日志」，而不是让
 * 其中一份悄悄失效。
 */
const SHADOW_PRIORITY = -1;

/**
 * 接管的行键。
 *
 * - `edit` / `write`：官方内置行，本插件用影子优先级替换；
 * - `str_replace_editor`：同类文件修改工具的兼容项（该工具未挂载时这条注册不渲染任何东西）；
 * - `patch`：**本插件 Host 半自己注册的工具**（一次改多处 / 多文件），同样用这张卡片渲染。
 */
const TOOL_KEYS: readonly string[] = ['edit', 'write', 'str_replace_editor', 'patch'];

/** 设置节 id = settings 命名空间 = cordis 行 id（仓库约定：NS 四处同名）。 */
const SETTINGS_NS = 'dshp-file-change-viewer';

/**
 * 设置节的导航排序。
 *
 * `settings.section` 的 `order` 要与本仓其它插件错开（vision-bridge 25 / mcwiki-search 26 /
 * token-meter 27 / search-provider 28 / skill-manager 29 / mcp-manager 30），31 是下一个空位。
 */
const SETTINGS_ORDER = 31;

/**
 * 设置节在左侧导航里的标题。
 *
 * 英文短语与同一份导航里的 `Skills` / `MCP` 一致（短、一眼扫得到），也正好是这一节的职责：
 * 这一节管的是**文件改动的视图**，不是某个具体卡片的开关。改这一个常量即可换名字，
 * `check-client.mjs` 有断言守着。
 */
const SETTINGS_LABEL = 'File Change View';

/** 会话页头右侧工具区（官方 `open-in-app`、会话日志下载都在这里）。 */
const HEADER_SLOT = 'conversation.session.header.utilities';

/**
 * 页头开关在工具区里的位置。
 *
 * 该槽位按 `order` 升序排列（官方 `open-in-app` 是 -10，会话日志下载默认 0），20 让它落在最右侧。
 */
const HEADER_ORDER = 20;

/** client 半声明的服务依赖（缺了就不激活，由 cordis 等 slots 出现后重试）。 */
export const inject = ['slots'];

/**
 * client 半入口：由 shell 的模块系统在 slots 就绪后调用一次。
 *
 * @param ctx - client 侧 cordis 上下文（本插件只用 `get('slots')` 与 `effect`）。
 */
export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  // 偏好缓存：设置节与工具行共用同一个（改完偏好，已渲染的文件块同步换视图）。
  // 首次 GET 在这里发起，工具行与设置节挂载时通常已经有值。
  startPrefs();

  // 样式不在这里注入：`styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条
  // `<style data-plugin>`（卸载由 shell 按 data-plugin 清理）。见 shared/tsup.preset.ts。

  // ── 设置节（设置 → 左侧导航「File Change View」）：展示方式两卡 + 上下文行数 + 默认展开 + patch 开关 ──
  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
            FileChangeViewerSection,
          ),
        ),
      'dshp-file-change-viewer: settings section',
    );
  } catch (error) {
    console.error('[dshp-file-change-viewer] 注册设置节失败，两项偏好将只能手改 settings.yaml：', error);
  }

  // ── 会话页头快捷开关（只影响当前会话，不碰 settings.yaml） ──
  try {
    ctx.effect(
      () =>
        slots.inject(HEADER_SLOT, () =>
          slots.register({ name: HEADER_SLOT, id: SETTINGS_NS, order: HEADER_ORDER }, SessionControls),
        ),
      'dshp-file-change-viewer: session header controls',
    );
  } catch (error) {
    console.error('[dshp-file-change-viewer] 注册会话页头快捷开关失败，设置页仍然可用：', error);
  }

  // ── 工具行接管（原生行 + 每个文件块的差异视图） ──
  // 注意：inject 的回调可能在槽位声明时才被调用（异步），所以逐 key 的 try/catch
  // 必须写在回调**内部**——外层 try/catch 只挡得住 inject 本身的同步失败。
  try {
    ctx.effect(
      () =>
        slots.inject('tool.call.toolview', function* () {
          for (const key of TOOL_KEYS) {
            try {
              yield slots.register(
                {
                  name: 'tool.call.toolview',
                  key,
                  locale: CONVERSATION_NS,
                  priority: SHADOW_PRIORITY,
                },
                FileChangeRow,
              );
            } catch (error) {
              // 例如同一 key 的同一优先级被别的插件（动态注册）占了：这一行沿用内置渲染，其余照常接管。
              console.error('[dshp-file-change-viewer] 接管 ' + key + ' 行失败，该工具将沿用内置行：', error);
            }
          }
        }),
      'dshp-file-change-viewer: edit/write tool cards',
    );
  } catch (error) {
    console.error('[dshp-file-change-viewer] 注册文件修改行失败，edit / write 将回落到内置行：', error);
  }
}
