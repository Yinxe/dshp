# @dshp/widget-kit

> **已归档（2026-10-20），不再维护。** 本插件已从 `plugins/` 移入 `archive/`，源码与 `lib/` 构建产物仅作历史参考；安装路径为 `./archive/widget-kit`，后续不再适配新版 DSH；文中「更新」节仅作历史保留。

DeepSeek Harness（DSH）**小组件规范与宿主**：给 Web UI 定一套「任何插件都能提供小组件」的契约 ——
**会话顶部托盘**（常驻图标 + 徽标 + 拖拽换序 + 溢出菜单 + 启用/禁用）与**两种内容面**：
可拖拽/缩放/最小化/**锁定位置**/关闭的**卡片**（拖动时自由跟手、**允许互相覆盖**；靠近边缘或邻卡时
画一个虚线**吸附预览框**，松手才落到预览位置 —— 不同意就拖开再松手），以及点击或悬停展开的**小面板**
（popover：单开、可声明常驻、不可拖动、尺寸与标题栏可配，可整块渲染任意 web 视图）；
框架统一负责加载/错误/陈旧态、轮询节流、错误隔离、z 序、几何夹紧、持久化、键盘与焦点。

> 设计原则：**框架管「窗口」，提供方管「内容」**。本插件**不含任何业务** —— 它只定义契约并提供承载面；
> 自带的**四个参考组件**是规范示例、可在设置里关掉：两张卡片（时钟 / 组件诊断）+ 两个小面板
> （快速设置：点击展开 / 状态速览：悬停展开）。另有**「组件箱」**—— 它不是示例、也不受那个开关影响：
> 它是框架的**统一入口**，只列**声明过 `listedInBox: true`** 的卡片（默认不收录，见契约 §3）。
> **内容如何随尺寸变化完全由组件提供方决定**：框架只交事实（`size` / `sizeClass` / `frame` / `minimized` /
> `locked`）与一个受约束的 `setSize`，不干涉布局、不做内容驱动的自动尺寸。
> 完整契约见 [`docs/widget-spec.md`](../../docs/widget-spec.md)。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```sh
# 1. 克隆 monorepo（lib/ 构建产物已提交，clone 下来就能用，无需 build）
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 2. 本地安装到 profile（路径按你执行命令时的 cwd 解析）
dsh plugin --profile web add ./archive/widget-kit

# 3. 重启生效
dsh web
```

- **更新**：仓库内 `git pull` + `dsh web`（最快 —— lib 已提交，未改 src 无需 build）。
- **改源码后**：`pnpm --filter @dshp/widget-kit build` 重新打出 `lib/host.js + lib/client.js`，再 `dsh web`。
- **验证**：打开任一**已有内容**的会话，顶部标题栏右侧出现四个小组件图标（时钟 / 组件诊断 / 快速设置 / 状态速览）；时钟与诊断点开是可拖拽的卡片，快速设置点开是常驻小面板，状态速览**悬停**即可展开；
  点一下弹出卡片，拖动标题栏可移动（自由跟手、允许互相覆盖；靠近边缘/邻卡时出现虚线预览框，
  松手才吸附）、八向可缩放、`—` 收成一枚胶囊（宽度**量出来的**：量整条标题栏需要多宽，最长不超过卡片宽度、最短 160px，展开尺寸不丢）、🔒 锁定位置（红锁 / 绿开锁，锁定后标题栏只剩「解锁 + ⋯」，最小化与关闭进菜单）、`✕` 关闭；
  **刷新页面后位置、尺寸、锁定、层叠顺序与展开的面板都保持不变**。
  设置 → 小组件 里能看到配置、已注册组件清单与每个组件的**启用开关**（禁用 = 图标/卡片/面板/徽标一并停用，布局保留）。

**一键 AI 安装**：把下面这段发给你的 DSH AI 即可：

```text
帮我安装小组件宿主插件（monorepo Yinxe/deepseek-harness-plugins，子目录 archive/widget-kit，包名 @dshp/widget-kit）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web add ./archive/widget-kit
3. dsh web 重启，确认无报错
4. 打开一个非空会话，确认顶部出现四个图标：「时钟」「组件诊断」点开是可拖动/缩放/最小化/关闭的卡片，「快速设置」点开是点击式小面板，「状态速览」悬停即展开（移开自动收起）
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

从本仓库 Releases 下载 `dshp-plugins-*.zip`，解压后 `dsh plugin --profile web add <解压目录>/archive/widget-kit`，再 `dsh web`。

## 更新

| 安装方式      | 更新方式                                                              |
| ------------- | --------------------------------------------------------------------- |
| 克隆 monorepo | `git pull` → `dsh web`（未改 src 无需 build）                         |
| Release 包    | 下载新包覆盖 → 重跑 `dsh plugin --profile web add <路径>` → `dsh web` |
| 改了 src      | `pnpm --filter @dshp/widget-kit build` → 提交 `lib/` → `dsh web`      |

## 功能

| 部分                                          | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host（`src/host/` → `lib/host.js`）**       | 声明 settings 命名空间 `dshp-widget-kit`（框架偏好：托盘开关、可见图标上限、徽标刷新间隔、悬停预览、参考组件）；`schemastery` 校验 + 逐字段消毒；不做迁移、不写用户文件、不注册模型工具。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Client（`src/client/` → `lib/client.js`）** | ① 发布 `widgets` 客户端服务（`ctx.reflect.provide`），别的插件通过 `inject: ['widgets']` + `ctx.widgets.register(descriptor)` 提供组件；② 会话顶部托盘（可拖拽换序，左右双向）；③ 卡片层（`shell.overlay`）：拖动/八向缩放/最小化折叠/锁定位置/关闭/层内 z 序/同屏上限，移动落点走 `snapRect`（整卡留在视口内 + 贴边/贴邻卡/边缘对齐的**吸附候选**，卡片允许互相覆盖；拖动时画 `.snapGhost` 预览虚框、松手才采用），手势由 `window` 兜底监听驱动（漏收 pointerup 也能收尾），拖动/缩放期间整卡不可选中文字并盖一层全视口手势盾；④ popover 承载面（`trigger: 'click' \| 'hover'` 两种展开方式，可用 `persistent` 声明常驻；**两层互不干扰** —— 常驻层手风琴、临时层内部单开，可以同时展开；不可拖动变形，可自定义宽/高/内边距/标题栏）；⑤ 徽标调度器（1s 全局 tick、页面隐藏暂停、5s 超时、指数退避）；⑥ 本机布局持久化（`localStorage`：矩形/最小化/锁定/层叠顺序/展开的面板/隐藏与禁用集合，刷新即恢复）；⑦ 启用/禁用（软卸载）；⑧ 设置节。 |
| **同源路由**                                  | `GET /ext/dshp-widget-kit/state`（版本 + 契约版本 + 偏好快照）、`POST /ext/dshp-widget-kit/config`（偏好补丁）。同源校验、`no-store`、body 上限 1MB、业务错误走 `200 + ok:false`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **工具**                                      | 无（纯 UI / 基础设施插件，不给模型注册任何工具）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## 你会看到什么

| 参考组件                                   | 说明                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **时钟**（`dshp-widget-kit:clock`）        | 示范「提供方控制尺寸呈现」：内容盒宽度 < 300 只显示时间，≥ 300 加日期与时区，≥ 420 再显示出实测内容盒与框架版本；托盘图标显示分钟数徽标。                                                                                               |
| **组件诊断**（`dshp-widget-kit:registry`） | 列出**所有插件**注册的组件（id、来源命名空间、承载面、是否带徽标、默认尺寸）、当前打开的卡片数、框架版本，以及本机布局是否可持久化；每行带**启用/禁用**按钮 —— 既是排查「我的组件没出现」的第一站，也是在界面里动态停用某个组件的入口。 |
| **快速设置**（`dshp-widget-kit:quick`）    | **点击展开 + 常驻**的小面板（popover）：托盘开关、可见图标上限、徽标刷新间隔、清空本机布局 —— 演示「小面板放快捷设置」、写偏好（`runtime.setPrefs`）与 `popover.persistent`（点外部不收起；常驻层是手风琴，且不会被悬停速览挤掉）。     |
| **状态速览**（`dshp-widget-kit:status`）   | **悬停展开**的小面板：已注册组件数 / 打开的卡片数 / 已隐藏图标 / 布局存储状态 + 版本 —— 演示 `trigger: 'hover'` 与 `header: false` + `padding: 0`（整块面板归提供方）。                                                                 |

四个都是规范示例（不是业务），可在 设置 → 小组件 里关掉。

## 「组件箱」：统一入口（框架能力，不是示例）

活动栏上的「组件箱」图标点开是一个自由卡片清单：一行一张卡、状态点显示开/合、「n / m 已打开」+「全部收起」。

- **只列声明过 `listedInBox: true` 的卡片**（默认 `false` = 不收录，只有 `presentation: 'card'` 能写）：
  框架不会把别人的卡片收进自己的入口 —— 想自建菜单就只写 `trayIcon: false` 再注册一个 popover
  （`@dshp/token-meter` 的 `token-meter:menu` 就是范例），想让框架替你挂就声明收录。
- 与「装载参考组件」偏好**无关**，始终在册：关掉参考组件只是不注册时钟 / 诊断这些示例，
  而 `trayIcon: false + listedInBox: true` 的卡片只有这一个入口，跟着消失就彻底够不着了。
- 声明是**公开契约**：`ctx.widgets.list()` 的摘要里带 `listedInBox`（`WidgetSummary`），
  别的聚合入口也能按同一条声明决定收不收，不必读框架内部。
- 用法写 `minFramework: '0.11.0'`：更早的框架不认识这个字段会**静默忽略**，卡片会变成没有入口的孤儿。

## 写一个小组件（三步）

```jsonc
// 1. 你的插件 package.json：只加 devDependency（类型用；运行时不会被打进产物）
"devDependencies": { "@dshp/widget-kit": "workspace:*" }
```

```tsx
// 2. 你的 client 半：拿类型 + 声明依赖
import type { WidgetContentProps, WidgetsService } from '@dshp/widget-kit/spec';

// 只有当「没有宿主就等于没有这个插件」时才写进顶层 inject。
// 增强型依赖（插件本来干别的、顺手提供几个小组件）必须走 ctx.inject —— 见下。
export const inject = ['slots', 'widgets'];
```

```tsx
// 3. 在 effect 里注册（disposer 随插件一起回收）
ctx.effect(
  () =>
    ctx.widgets.register({
      id: 'my-plugin:panel', // <你的命名空间>:<名字>
      title: '我的组件',
      icon: <Glyph />,
      presentation: 'card', // 'tray' | 'popover' | 'card'
      content: {
        load: async (loadCtx) => fetchData(loadCtx.signal), // 记得用 signal
        refreshMs: 60000,
        render: (props) => <View props={props} />, // 尺寸怎么变由你决定
      },
      card: { defaultSize: { w: 360, h: 240 }, minSize: { w: 240, h: 140 } },
    }),
  'my-plugin: widget',
);
```

把 `presentation` 换成 `'popover'` 就是另一种形态 —— **小面板**：单开、不可拖动、不可缩放，
`popover: { trigger: 'hover', width: 320 }` 可做成悬停展开的快捷设置；`popover: { persistent: true }`
让它常驻（点外部 / 移开指针都不收起，只有 ✕ / 再点图标 / Esc 才关）；
`popover: { padding: 0, header: false, width: 720 }` 则把整块面板交给你的内容
（iframe / 视频 / 画布这类任意 web 视图都能塞）。

逐字段表、尺寸契约、红线、反例与自检清单：**[`docs/widget-spec.md`](../../docs/widget-spec.md)**。

### 增强型依赖：别把 `widgets` 写进顶层 `inject`

顶层 `inject: ['widgets']` 的语义是「**没有这个服务我就不激活**」。你自己的插件如果本来还干别的
（面板、设置页、数据路由），这么写就会让它在用户没装 / 停用了 widget-kit 时**整个消失**。
这种「有则增强、无则退化」的依赖用 `ctx.inject`：

```ts
export const inject = ['slots']; // 只声明真正不可或缺的服务

export function apply(ctx: ClientContext): void {
  ctx.inject(['widgets'], (scope) => {
    const widgets = scope.get('widgets') as WidgetsService | undefined;
    if (widgets === undefined) return;
    scope.effect(() => widgets.register(myWidget), 'my-plugin: widget');
  });
}
```

加载边界（谁必须和谁同时在场、Host 半挂了会怎样、`trayIcon: false` 的卡片为什么要提前注册）：
[docs/widget-spec.md §2.1](../../docs/widget-spec.md)。

**已接入的实例**：本仓 [`@dshp/token-meter`](../token-meter/README.md) —— 额度卡 / 统计图表 / 峰谷显示器
共三种小组件全部按这套契约接入（`trayIcon: false` 的自由卡片，`ctx.inject` 挂载，启动与供应商增删时
对齐注册表），装在同一个 profile 里就能看到实际效果。

## 配置项

存 profile 条目 `dshp-widget-kit` 的 `config:`（改动即时生效，无需重启）：

| 字段               | 类型    | 默认    | 说明                                                       |
| ------------------ | ------- | ------- | ---------------------------------------------------------- |
| `trayEnabled`      | boolean | `true`  | 是否在会话顶部显示组件托盘                                 |
| `maxVisibleIcons`  | number  | `4`     | 可见图标上限 1–8，超出的进 `⋯` 菜单                        |
| `badgeIntervalMs`  | number  | `30000` | 徽标默认刷新间隔 5000–600000                               |
| `hoverPreview`     | boolean | `true`  | 图标悬停是否显示说明                                       |
| `referenceWidgets` | boolean | `true`  | 是否装载自带的四个参考组件（「组件箱」不在此列，始终在册） |
| `cardOpacity`      | number  | `0.7`   | 卡片 / 小面板背景不透明度 0.2–1（含标题栏）                |
| `cardBlur`         | number  | `5`     | 毛玻璃模糊半径 0–32 px（0 = 关）                           |
| `cardBorder`       | enum    | `auto`  | 边框：`auto` 跟随框架 / `on` 1px / `off` 无边框            |
| `cardRadius`       | enum    | `auto`  | 圆角：`auto` 12px / `round` 20px / `square` 0              |
| `motionMs`         | number  | `300`   | 动效时长 0–500 ms（0 = 关闭过渡）                          |

**本机布局**（托盘顺序、隐藏与禁用集合、卡片位置/尺寸/最小化/锁定、卡片层叠顺序、当前展开的常驻面板）
**不在**持久化配置：它存在浏览器 `localStorage` 的 `dshp-widget-kit:v1`，只属于这台浏览器；
刷新后**原地恢复**。**卸载 / 热重载插件不会动它**（记录按 id 留着，插件回来即原地恢复）——
插件开发时改代码不再重置布局；真卸载掉的插件留下的残留，用 设置 → 小组件 → 「清理已卸载组件的残留」
显式清理（只清不在册的 id），要全部重来就用「清空本机布局」。

## 代码结构

```
archive/widget-kit/
├── spec.d.ts                  # 公开契约（其它插件 import type 的唯一入口）
├── src/host/                  # config（NS/schema/消毒）/ routes（state+config）/ http / index
├── src/client/
│   ├── spec.ts                # 规范单一事实来源：类型 + 默认值 + 校验器 + SPEC_KEYS
│   ├── geometry.ts            # 几何纯函数（夹紧 / 八向缩放 / 内容盒 / 尺寸档 / z 序）
│   ├── store.ts               # localStorage 布局：消毒 / 版本 / debounce / 卸载清理
│   ├── service.ts             # 运行时：注册表 + 布局状态 + 全部动作
│   ├── badges.ts              # 徽标调度（可见性门控 / 超时 / 退避）
│   ├── hooks.ts               # 快照订阅 / 数据生命周期 / 指针拖拽（官方 DragHandle 范式）
│   ├── Tray.tsx / Card.tsx / CardLayer.tsx / Popover.tsx / ResizeHandles.tsx / ErrorBoundary.tsx
│   ├── SettingsSection.tsx / components.tsx / glyphs.tsx / api.ts / types.ts / styles.module.css
│   └── widgets/               # box.tsx（组件箱：框架的统一入口）+ 参考组件 clock/diagnostics/quick-settings/status
├── scripts/                   # 六个自检（几何 / 存储 / 契约漂移 / 样式与依赖 / 无头冒烟）
└── lib/                       # 构建产物（已提交）
```

## 常见问题

**图标没出现？** ① 空白会话（还没发过消息）时 DSH 会隐藏整个会话头，托盘也随之不渲染 —— 发一条消息再看；
② 设置 → 小组件 里确认「会话顶部托盘」开着、图标上限不是被其它组件占满（超出的在 `⋯` 里）；
③ 打开「组件诊断」看注册表：没有你的组件 = 你的插件没注册成功（看浏览器控制台里 `[dshp-<你的插件>]` 的日志）。

**卡片拖到屏幕外找不回来了？** 框架保证任何时刻至少留 48px 与整条标题栏可见，所以不会真的丢；
实在乱了用 `⋯` → 居中 或 设置 → 清空本机布局。

**悬停展开的面板一闪就没了？** 那是 `hoverCloseDelayMs`（默认 220ms）太短：指针从图标移到面板的路上就会触发收起。
调大它即可；面板自身的 `pointerenter` 会自动撤销待收起，所以只要宽限够走过那段间隙就不会闪。另外悬停展开的组件
不会再叠 Tooltip 气泡（面板本身就是说明）。

**我的组件要显示模块数据怎么办？** 走你自己的 Host 路由取数（`load` 里 `fetch`，记得用 `context.signal`）；
`sessionId` 由内容 props 给到，路由按它取会话级数据。

**为什么 `setSize` 有时没反应？** 框架对「渲染期调用」与「500ms 内超过 3 次」有回环防护（会记一条
`console.error` 并冻结该组件的自动改尺寸）。把改尺寸放进事件回调即可。

## 卸载

```sh
dsh plugin --profile web remove "@dshp/widget-kit"
dsh web
```

再删掉 profile 条目`dshp-widget-kit` 段（可选），并清掉浏览器里 `dshp-widget-kit:v1`
这条 localStorage（可选，不删也无害）。依赖它的插件会停在 waiting（不会报错），
要么重新装框架，要么去掉自己 client 半的 `inject: ['widgets']`。

## 移植说明

本插件**不是**从别处移植来的，是为本 monorepo 新写的规范与宿主；设计模型参考了：

- VS Code 的 contribution points（清单 + 贡献点 + 按需激活 + 收窄 API 面）；
- Backstage 的 extension points（扩展点由插件注册并导出、只允许附加式演进）；
- Grafana panel plugin 的「清单 + 实现」两件套；
- macOS 菜单栏 extra / GNOME 顶栏指示器（托盘图标 + 点开弹窗 + 徽标）；
- Home Assistant Lovelace 自定义卡片（卡壳与内容分离、单卡错误不互相拖垮）。

仓内既有教训：`plugins/token-meter/src/client/widgets.tsx` 那版自由浮窗（固定尺寸假设、缺 `pointercancel`、
硬编码 z-index 基线、一次移动全量重渲染、组件卸载靠手工前缀清 localStorage）逐条对应到本规范的
「照抄官方 `DragHandle`」「层内相对 z」「两档快照」「disposer 清理残留」等设计上。

## 免责声明

本插件按 MIT 许可发布，为个人维护的社区插件，与 DeepSeek 官方无关。使用前请自行评估风险并做好备份
（尤其是 profile 条目 config）。小组件框架是**基础设施**：它不采集、不上传任何数据；本机布局只存在你自己的浏览器里。
