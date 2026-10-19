/**
 * Client 入口（浏览器）
 *
 * 打包后为单文件 lib/client.js。**loader 注册壳不写在这里**——由构建预设的 banner / footer 生成：
 *
 * ```
 * window.__ModuleLoader__.load({ id: '@dshp/token-meter', factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   ...本文件与它 import 的一切...
 *   return module.exports;
 * } });
 * ```
 *
 * 所以本文件就是一个**普通 ES 模块**：导出 `inject` / `apply`。react / react/jsx-runtime /
 * react-dom / primitives 都在 external 列表里，由 factory 的 `require`（shell 的冻结模块表）解析。
 *
 * 界面收敛为四个入口：
 *  1. `sidebar.footer.action`（id `dshp-token-meter`）：**额度**的唯一入口 —— 左侧边栏底部一枚
 *     额度按钮（内容由该供应商的**按钮级模板**自由渲染：环 / 余额 / 三条窗口 / 图标…），
 *     点开在按钮上方弹出使用详情 + 一次只激活一个的供应商切换
 *     （按钮与详情分别来自 provider 的 button / detail 模板，见 providers/ui/*）
 *  2. `settings.section`（id `dshp-token-meter`，order 27）：偏好 + 供应商增删改（唯一配置入口）
 *  3. `conversation.view`（order 40）：中心区 tab，与原生「对话 / 轨迹」并列；
 *     tab 内部用左侧菜单切换 用量统计 / 在线统计 / 设置（见 CenterView.tsx）
 *  4. `shell.overlay`：统计小组件浮层（把某个图表单独拖出来常驻）
 *
 * 历史：额度曾与用量/在线一起挤在中心区 tab 与侧栏卡片里（卡片网格 + 浮窗 + 活动栏菜单），
 * 2026-09 UI 重构把额度收敛成一枚侧边栏按钮、那些额度显示面全部删除 —— 额度是「随时扫一眼」，
 * 不是「一个需要占满中心区的面板」。
 *
 * 样式与反注册：`styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条
 * `<style data-plugin>`（卸载由 shell 按 data-plugin 清理），所以这里没有「手插样式」与
 * 「样式自愈」那段历史代码了。
 *
 * @module @dshp/token-meter/client
 */
import { createCenterView } from './CenterView.js';
import { OnlineEmbed, OnlineView } from './OnlineSection.js';
import { OnlineIcon, SettingsIcon, ShareIcon, UsageIcon } from './icons.js';
import { SharePanel } from './StatsSection.js';
import {
  QuotaSidebarAction,
  StatsView,
  TokenMeterSettings,
  WidgetFloatLayer,
  quotaStore,
  renderFloatContent,
  syncFloatWidgets,
  widgetsApi,
} from './TokenMeterSection.js';
import { DISPLAY_NAME } from '../name.js';
import type { ClientContext, SlotsService } from './types.js';

/**
 * 中心区 tab 的条目 id（`conversation.view` 的 list 槽位 id，也是它在 localStorage 里的键前缀）。
 *
 * 与 settings 命名空间同名是巧合也是约定：本插件所有对外 id 都是 `dshp-token-meter`。
 */
const CENTER_VIEW = 'dshp-token-meter';

/**
 * 中心区视图。
 *
 * 在模块级装配一次：bundle 的 loader factory 每次加载只求值一次本模块，所以这与旧实现
 * 「在 `apply` 的工厂里建一次」份数与时机相同。分区组件全部来自本插件的模块级导出。
 */
const CenterView = createCenterView(
  {
    StatsView,
    OnlineView,
    OnlineEmbed,
    // 与 设置 →「TokenMeter」是同一个组件：改一处两边同步
    SettingsView: TokenMeterSettings,
    SharePanel,
  },
  { UsageIcon, OnlineIcon, SettingsIcon, ShareIcon },
);

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

  // 在线时长面板已不再支持弹出为浮窗（2026-09 简化）：清掉遗留的 online:* 浮窗记录，
  // 否则 localStorage 里那条会让浮层渲染一个已经不存在的组件。
  try {
    if (widgetsApi && typeof widgetsApi.forget === 'function') widgetsApi.forget('online:');
  } catch {
    /* ignore */
  }

  // ── 小组件宿主（可选依赖：`@dshp/widget-kit`）───
  // 用 `ctx.inject` 而不是顶层 `inject: ['widgets']`：后者的语义是「没有这个服务我就不激活」，
  // 一旦用户没装 / 停用了 widget-kit，整个 TokenMeter（额度面板、统计、设置节）都会消失 ——
  // 小组件只是**增强**，不是本插件的存在前提。这里服务来了才挂上，服务走了作用域自动销毁。
  try {
    ctx.inject(['widgets'], (scope: ClientContext) => {
      if (!widgetsApi.attach(scope.get('widgets'))) {
        console.warn(
          '[dshp-token-meter] widgets 服务的形状不符合小组件规范（spec v1），小组件改用自带浮窗渲染。',
        );
        return;
      }
      widgetsApi.setContentRenderer((id) => renderFloatContent(id, false));
      // 本插件**不再占用活动栏图标**：额度入口是侧边栏底部那枚环（`sidebar.footer.action`），
      // 统计卡片（`trayIcon: false`）由中心区「用量统计」工具条上的按钮开合。
      scope.effect(
        () => () => {
          widgetsApi.detach();
        },
        'dshp-token-meter: widget-kit bridge',
      );
      // 常驻注册：卡片都是 trayIcon: false（不占活动栏），刷新后布局里「开着」的卡片
      // 只能靠这里提前注册回来。
      void quotaStore
        .ensureLoad()
        .then(() => {
          syncFloatWidgets();
        })
        .catch(() => {
          syncFloatWidgets();
        });
      try {
        scope.effect(() => quotaStore.subscribe(() => syncFloatWidgets()), 'dshp-token-meter: widget sync');
      } catch (error) {
        console.error('[dshp-token-meter] 订阅额度 store 失败（小组件列表可能不同步）：', error);
      }
    });
  } catch (error) {
    console.error('[dshp-token-meter] 挂载小组件宿主失败，统计小组件改用自带浮窗渲染：', error);
  }

  // 旧 localStorage 一次性清理：左栏开关、旧双浮窗系统、右侧栏 tab 自动展开标记、
  // 旧额度浮窗（额度已改为侧边栏按钮）都已停用，旧键直接删掉，避免残留项影响后续行为。
  try {
    window.localStorage.removeItem('token-stats.sidebar-today');
    window.localStorage.removeItem('tquota.float.open');
    window.localStorage.removeItem('tquota.float.pos');
    window.localStorage.removeItem('tm-quota-float');
    window.localStorage.removeItem('tm-quota-float-pos');
    window.localStorage.removeItem('ts-today.float.open');
    window.localStorage.removeItem('ts-today.float.pos');
    window.localStorage.removeItem('tm-today.float.open');
    window.localStorage.removeItem('tm-today.float.pos');
    window.localStorage.removeItem('tm-righttabs-autoopened');
  } catch {
    /* ignore */
  }

  // ── 设置节（设置 → 左侧导航「TokenMeter」）───
  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: 'dshp-token-meter', order: 27, label: DISPLAY_NAME },
            TokenMeterSettings,
          ),
        ),
      'dshp-token-meter: settings section',
    );
  } catch (error) {
    console.error('[dshp-token-meter] 注册设置节失败，只能手改 settings.yaml 或看中心区面板：', error);
  }

  // ── 侧边栏底部额度按钮（额度唯一入口）───
  // 槽位契约（sidebar 包声明）：list / root 作用域，注册项 = id + order + label，
  // owner props 只有 `{ wide }`（false = 56px 轨道）。按钮自己负责弹层、定位与点外部关闭。
  try {
    ctx.effect(
      () =>
        slots.inject('sidebar.footer.action', () =>
          slots.register(
            { name: 'sidebar.footer.action', id: 'dshp-token-meter', order: 10 },
            QuotaSidebarAction,
          ),
        ),
      'dshp-token-meter: sidebar quota action',
    );
  } catch (error) {
    console.error('[dshp-token-meter] 注册侧边栏额度按钮失败，额度只能在设置页里看：', error);
  }

  // ── 小组件浮层（shell.overlay）───
  try {
    ctx.effect(
      () =>
        slots.inject('shell.overlay', () =>
          slots.register({ name: 'shell.overlay', id: 'dshp-token-meter-float' }, WidgetFloatLayer),
        ),
      'dshp-token-meter: widget float layer',
    );
  } catch (error) {
    console.error('[dshp-token-meter] 注册小组件浮层失败，已有的浮窗记录将无处渲染：', error);
  }

  // ── 中心区单 tab（官方模式：inject 声明 + slots.inject 持有）───
  // 与原生「对话 / 轨迹」并列的一个 tab；tab 内用侧边菜单切换 用量 / 在线 / 设置 三块内容
  // （额度已搬到侧边栏按钮，不再占这里的版面）。
  // order 40：排在内置 chat(0) / trajectory(10) 与第三方视图之后。
  try {
    ctx.effect(
      () =>
        slots.inject('conversation.view', () =>
          slots.register(
            { name: 'conversation.view', id: CENTER_VIEW, order: 40, label: DISPLAY_NAME },
            CenterView,
          ),
        ),
      'dshp-token-meter: center view',
    );
  } catch (error) {
    console.error('[dshp-token-meter] 注册中心区 tab 失败，用量/在线面板都看不了：', error);
  }
}
