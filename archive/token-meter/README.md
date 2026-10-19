# @dshp/token-meter

> **已归档（2026-10-20），不再维护。** 本插件已从 `plugins/` 移入 `archive/`，源码与 `lib/` 构建产物仅作历史参考；安装路径为 `./archive/token-meter`，后续不再适配新版 DSH；文中「更新」节仅作历史保留。

DeepSeek Harness（DSH）**Token 总览**插件：**额度 + 用量二合一**——一边看“外面还剩多少”（多供应商滚动额度/按量余额：opencode、DeepSeek、Command Code、手动账本），一边看“里面用了多少”（本机会话日志聚合：累计/峰值/连续天数、日/周趋势、24 小时分布、GitHub 风格热力图、模型分布、今日消耗，**以及在线时长**——在线 / 对话进行中 / 模型 + 工具三口径 + 每日排行）。额度只有**一个入口**：左侧边栏底部一枚按钮，**上面画什么由该供应商的按钮级模板自由渲染**（环 / 余额大数字 / 5 小时·每周·每月三条迷你条 / 供应商图标…，**不限于环**）——宽栏是「图标 + 主图形 + 名字 + 数值」，56px 窄栏只剩主图形；点开在按钮**上方**弹出浮层——当前供应商的详情（**详情模板**产出 + 数据新鲜度）+ **该供应商自己的显示开关**（画在它的卡片底部，如 Goat 的「数值位显示余额」+ `5h / 1w / 1m`）+ 「切换供应商」列表（每行左侧的图形同样来自该 provider 的按钮模板，点击即切换，**一次只激活一个**）。其余展示都在会话中心区注册的一个「Token 总览」tab 里（与原生「轨迹」同机制），tab 内用左侧菜单切换 **用量统计 / 在线统计 / 设置** 三块（设置分区与侧边栏 `设置 → Token 总览` 是**同一个组件**，两处改一处同步）。配置按 0.1.7 契约通过官方 settings API 持久化到 profile 条目 `dshp-token-meter` 的 `config:`，设置页改动即时热更新。配置**只认** `dshp-token-meter` 一个键：旧双插件的 `storages/token-quota.json` 与历史 key（`dshp-inx-token-quota` / `dshp-inx-token-stats`）不再读取、不再迁移（手工迁移步骤见“常见问题”）。

> 设计原则：**零依赖、零残留、可逆副作用**。密钥只存引用（`$NAME`）或脱敏展示；统计无网络上报、不额外落盘真相数据（会话日志即持久层；`storages/token_stats.json` 只是**可丢的派生缓存**，删了会自动凭日志重算）；卸载即干净。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```sh
# 1. 克隆 monorepo（lib/ 构建产物已提交，clone 下来就能用，无需 build）
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 2. 本地安装到 profile（路径按你执行命令时的 cwd 解析）
dsh plugin --profile web add ./archive/token-meter

# 3. 卸载旧双插件（避免双份侧边栏/设置节重复；旧 settings 段需手工并到 dshp-token-meter，
#    本插件不做任何自动迁移）
dsh plugin --profile web remove "@dshp-inx/token-quota"
dsh plugin --profile web remove "@dshp-inx/token-stats"

# 4. 重启生效
dsh web
```

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](../../compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。

> DSH 是最新版就到此为止。只有 DSH 停在老版本才需要先 `git checkout <历史tag>`（对照根目录 `compat.json`，现在是空的，不用管）。

`dsh plugin` 会把包写进 profile 的 `dsh.profile.bundles` —— **无需手动改配置文件**。

**改源码后**：`src/host` 或 `src/client` 改完跑 `pnpm --filter @dshp/token-meter build` 重新打出 `lib/host.js + lib/client.js`，然后 `dsh web` 重启（client 半强刷页面即可）。

**验证**：打开 web → 设置 → Token 总览（统计设置 / 额度配置双 Tab）；左侧边栏底部出现一枚额度按钮（内容由该供应商的按钮模板渲染：宽栏是「图标 + 主图形 + 名字 + 数值」，56px 窄栏只剩主图形），点开在按钮**上方**弹出额度浮层（当前供应商详情 + 它卡片底部的显示开关 + 供应商切换）；打开任一会话，中心区标题栏出现「Token 总览」Tab（与「对话 / 轨迹」并列），点进去用左侧菜单切换 用量统计 / 在线统计 / 设置（配置项不必再绕去侧边栏，界面效果见下文「界面预览」）；或 `curl http://127.0.0.1:3080/ext/dshp-token-meter/state` 返回 `{ok:true, ...}`。

**一键 AI 安装**：把下面这段发给你的 DSH AI 即可：

```text
帮我安装 TokenMeter 插件（monorepo Yinxe/deepseek-harness-plugins，子目录 archive/token-meter，包名 @dshp/token-meter）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web add ./archive/token-meter，并卸载旧 @dshp-inx/token-quota 与 @dshp-inx/token-stats
3. dsh web 重启，确认无报错，设置页出现「Token 总览」即成功
4. 打开设置页的 Token 总览，帮我添加一个供应商并刷新一次额度，再告诉我累计 Token 总量和今日用量
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

latest 滚动版（跟随 main 最新构建；滚动更新 = 重跑同一条 add 命令）：

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-token-meter-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 `compat.json` 记录的兼容 tag，到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-token-meter-<tag>.tgz`：

```bash
# 以 v0.1.5-rc.1 为例
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-token-meter-v0.1.5-rc.1.tgz

dsh web   # 重启生效
```

## 更新

### 三种安装方式对应的更新方式

| 安装方式             | 更新命令                                                    | 说明                                                      |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| 方式一 clone（推荐） | 仓库内 `git pull` + `dsh web`                               | 最快；未改 src 免 build；旧版 DSH 用 `git checkout <tag>` |
| 方式二 Release       | 重跑同一条 `add` 命令 + `dsh web`                           | URL 直装对 `update` 免疫；两个 pnpm 坑见根 README         |
| 方式三 git 依赖      | `dsh plugin --profile web update @dshp/\<pkg\>` + `dsh web` | 一条命令；git 解析约 35s/插件（实测）                     |

## 界面预览

> 截图在 `images/` 目录（4 张，`screenshots.json` 同步收录）：**分享面板**（封面）/ 用量统计 / 在线统计，外加一张**重构前的旧版额度查询界面**（`quota.png`，只作历史对照，不再是现有功能）。

![分享面板：用量统计与在线统计内聚成一块，可下载 PNG / 复制图片](images/shared.png)

**中心区 Tab「Token 总览」—— 一个 tab + 左侧菜单**

面板不占右侧栏，而是像原生「轨迹」一样在**会话中心区**注册一个 tab（`conversation.view`，order 40，与「对话 / 轨迹」并列）；tab 内用**左侧菜单**切换三块内容：**用量统计 / 在线统计**，外加一条分隔线之下的 **设置**（偏好、供应商增删改、数据来源与统计缓存；与侧边栏 `设置 → Token 总览` 共用同一个组件，改一处两边同步）。额度**不在**这里——它只有左侧边栏按钮一个入口（见下）。选中项记在 `localStorage`（`tm-center-section`），下次打开回到上次看的那块；设置分区沿用设置页的行式表单布局，宽屏下收窄到 920px 居中（数据分区才吃满宽度）。

布局按「宽画布仪表板」设计（不是把右侧栏的窄单列搬过来）：

- **滚动**：tab 页自己是滚动的那个——**左菜单与分区标题栏在滚动容器之外**，滚内容时它们一动不动。会话外壳里负责高度的那层（hashed 类 `.wSkVaW_viewArea`，激活态 `flex:1 0 auto; min-height:auto`）会让 `height:100%` 退化成 `auto`，所以插件用官方稳定钩子把它改成确定高度项：`[data-conversation-scroll]:has([data-slot="conversation.view"] .tm-cview) > [data-slot="conversation.session"] > *`。`:has()` 的参数刻意写全以把特异性抬到 `(0,4,0)`，**压过**外壳那条 `(0,3,0)` 的激活态规则 —— 不依赖「插件样式晚于外壳注入」这种时序假设。随后 `.tm-cmain` 内的 `.tm-cbody` 成为唯一滚动容器（`overflow:clip` 而非 `hidden`，滚轮不会被截住）。两个坑：① 左菜单容器必须保持 `overflow:visible`，一旦 `overflow:auto/hidden` 它自己就成了滚动容器，里面的 `position:sticky` 会改为相对它定位、而它永远不滚，于是外层一滚菜单就跟着滚；② 万一钩子失效，会退化成「外层滚动 + 菜单 `position:sticky` 钉住」的旧模型，仍可用（两条路径都已验证）。
- **不显示会话列宽拖拽条**（原生轨迹视图同样不显示，仪表板也用不到窄列）。实现是对「有 `.tm-cview` 后代且直接挂着 `[data-width-handle]`」的那层隐藏。
- **卡片区走 12 栏栅格**，排布按「谁吃横向空间」定：**用量统计**是 基础数据 → 趋势（通栏）→ 热力图（通栏）→ 模型分布（通栏，内部纵向分栏兜底），趋势与热力图都是越宽越好读、并排只会各自被压窄；**在线统计**是 基础数据（在线时长）→ 每日在线图（通栏）→ 每日在线排行（7 栏）与口径表（5 栏）并排。容器窄于 1180px 时并排项自动逐级落回单列。
- **两个分区的「基础数据」是同一套指标卡阵**：`grid-auto-rows:1fr` 让同一行等高，卡片末行 `margin-top:auto` 让数值落在同一条网格线上，说明允许两行（不再被省略号切掉）。在线时长固定列数（≥1320 容器 4 列 / 820~1320 两列 / 更窄一列），7 张卡里让「引擎合计」（= 模型生成 + 工具执行）跨两列，最后一行永远是满的；标题行右侧带 **准确性徽标图例**（精确 = 时间戳直接算出 / 估算 = 由区间推断 / 下界 = 实际只会更多），不用猜颜色含义。
- **图表统一「按容器实测宽度设 viewBox + 固定高度」**，不用「固定 viewBox + `width:100%/height:auto`」——后者会按 viewBox 比例**等比放大**：趋势图原来固定 780×250，铺满中心区（约 1166px）时整幅被放到 **374px 高**，连 10.5px 的轴标签、1px 网格线一起被放大 1.49×，表现就是「图太大、太高、字太大」。改成 1:1 后：高度不再随宽度增长（趋势图 `clamp(150, W*0.24, 230)`，中心区 230px、卡片总高 463 → 319px，字号回到 10.8px）、同样的 30 天拿到更多横向像素。**每日在线图**同理（原固定 320 宽会在宽屏下等比缩到 320px 居中留白，现在真正铺满并自动加高）。
- 中心区拖窄到 620px 以下时左菜单收成图标轨道。
- **分享面板**：tab 头部「分享」按钮把 **用量统计 + 在线统计**里**已经在用的那些组件原样内聚**到一块面板上 —— 基础数据（13 张指标卡，通栏）/ 趋势 | 热力图 / 模型用量分布 / 在线时长（三口径）/ 每日在线 / 每日在线排行（后四块各占一整行）。页头分三层：① 标题区（左）+ 作者区（右，git 著者与邮箱）；② 细线；③ **来源信息条** —— 插件名 / 版本 / 仓库左对齐独占一行，会话数·记录天数·生成时间靠右。插件名、版本、仓库地址**全部由 tsup 的 `define` 在构建期从 `package.json` 注入**（`PKG`，仓库取 `homepage` 去掉协议与 `#readme`），不写死字面量 —— 只注入版本而把包名/仓库写死的话，改包名时就会对不上。**不自绘、不改配色**：颜色、字号、图形、分档全部由组件自己走 `--dsw-alias-*` 主题 token 决定。**尺寸模型**：板宽跟随容器（`width:100%`）→ 组件按真实像素宽度排版、**字号 100%**；高度由内容决定，装不下就在**舞台内滚动**（与视图 `.tm-body` 的滚动模型一致），长图无所谓，不再为了塞进 16:9 而整体缩放。**导出**走 `DOM → SVG <foreignObject> → Image → canvas → toBlob`（零依赖）。这里有三个必须记住的坑：① **必须禁掉动画/过渡**（`animation:none!important`）—— 卡片带入场动画 `.tm-card{animation:tm-fadeup .42s backwards}`，而 `@keyframes tm-fadeup{from{opacity:0}}`，`<img>` 里的 SVG 是静态图像上下文**不会推进 CSS 动画**，于是每张卡片都以 `opacity:0` 被光栅化，导出的图只剩没有动画的页头页脚（「下载/复制出来什么都没有」的真因）；② 导出前要**等两帧**再量尺寸，否则首次导出会拿到还没排定的高度、切掉最后一行；③ **内联 CSS 必须做 XML 转义** —— SVG 是 XML 文档，而压缩后的样式表里带着容器查询的**范围语法**（`@container i1tZMq_tmc (width<=1320px)`，当前产物里 16 处），文本里一个裸 `<` 就让整份文档解析失败：下载与复制**同时**报「SVG 渲染失败」，一张图都拿不到（CSS Module 迁移前内联的是未压缩的 `styles.ts` 文本，所以那时踩不到）。组装统一走 `share-svg.ts` 的 `shareSvgDocument()`，`check-share-svg.mjs` 拿**构建产物里那份真实 CSS** 做往返断言：XML 合法，且解码后与原文**逐字节相同**（只「能加载」不够 —— `&lt;` 若不解码，`(width<=300px)` 变成 `(width&lt;=300px)`，容器查询整条被丢弃，图能出来但样式是塌的）。另外导出时要把插件 CSS 与用到的 28 个主题 token 计算值**内联**进 SVG（`SHARE_TOKENS`，`pnpm test` 里有覆盖自检），因为 foreignObject 读不到 DSH 壳层的样式表；输出为板子尺寸的 2×。板子上会隐藏档位/小组件开关（纯 CSS，组件代码一行没改）—— 静态图上的可点控件没有意义。

**「额度」—— 侧边栏按钮 + 上方浮层**

额度不再是中心区的一块面板，而是左侧边栏底部的一枚按钮：注册进官方 `sidebar.footer.action`（list / root 作用域，owner props 只有 `{ wide }`；本插件 id `dshp-token-meter`，order 10），与 sidebar 自带的两条 footer action 同尺寸（高 42px / 圆角 12px）。footer actions 在侧边栏里是**垂直堆叠**的（既有规则 `div:has(> div[data-slot='sidebar.footer.action'])` 把容器改成 `flex-direction: column`，否则与 Cordis / 手机端徽章并排会横向溢出被裁），所以每个入口独占一行、拉满宽度。

**按钮里画什么是该供应商自己的事**（`ProviderTemplates.button → ReactNode`，见下文「[provider 两套模板](#provider-两套模板按钮级--详情级)」）：可以是一枚环、余额大数字、5 小时 / 每周 / 每月三条迷你条、供应商图标，或任意组合，只要装得进一枚按钮。三档位置由 `ctx.variant` 告诉模板：

- **宽栏**（`wide`，42px 高、拉满宽）＝ 供应商图标 + 主图形 + 名字 + 右对齐数值（如 `⌘ ◍ Goat …… 92%`），名字长了走省略号；
- **窄栏**（`rail`，56px 轨道）只剩 36×36 圆里那枚**表盘**（缺省 = 环当外圈 + 供应商图标 15px 居中在环心，见 `ButtonLayout`），**没有可见文字也没有数值位**，说明走 tooltip（`side: top`）；放不下全精度金额的 `balance` 画法统一用 `K.tinyMoney()` 换成极短金额（`$46.6` → `$47`、`¥12345` → `¥1.2万`），不再各自写一份 `compactMoney`；
- 浮层里的供应商切换行是第三档 **`row`**，只留主图形（16px，与那一行的图标槽对齐）。

环的推荐尺寸统一由 `ringSizeOf(variant)` 给（宽栏 / 切换行 **16px**：与 42px 行高、14px 字号相称，且要与浮层里 16px 的图标槽对齐；窄栏 **28px**：36px 的圆里「图标 + 小环并排」（早先是 14 + 16 + 3px = 33）会读成两个互不相干的小记号，16px 的弧长也看不出比例，所以让环放大成表盘外圈，28 + 2.2 描边还剩 4px 呼吸）。**供应商图标**两种画法并存：**官方品牌路径**直接按官方 viewBox 填充 `currentColor`（deepseek = 官方鲸鱼 `0 0 23.16 17.04`，按原宽高比渲染、不硬塞方框），**自绘线稿**按 **16×16 网格 / 描边 1.4** 画（commandcode 命令键 ⌘ / opencode 竖向圆角方框 / manual 账本 / 通用兜底），尺寸定为**宽栏 16 / 窄栏 15（`RAIL_ICON`）/ 切换行 16**；名字由 Host 元数据 `icon` 下发，未知名字与未知 type 都有兜底。

**「按钮上显示什么」的控件由该供应商自己画**（不提供统一的偏好面板 / 单选按钮组）：供应商在**自己的详情模板里**用 `ProviderUIKit.PrefSwitch`（原生 checkbox）与 `PrefChoice`（分段单选，`role="radiogroup"`）摆控件，写在 `ctx.prefs` 这个按供应商分作用域的键值袋里（浏览器本地）。Goat 的卡片底部就是「数值位显示余额」开关 + `5h / 1w / 1m` 单选。

点开在按钮**上方**弹出浮层（`useAnchoredPosition` side `top`，portal 到 `document.body`，宽 344px，`max-height: min(70vh, 560px)`，Esc / 点外部关闭）：

```text
┌──────────────────────────────────┐
│ 额度                           ⟳ │  ← 面板头：标题 + 刷新（拉取中显示转圈）
├──────────────────────────────────┤
│ ◍ Goat                           │  ← 卡片头只有 16px 主图形 + 供应商名（不重复类型标签、也不重复按钮上的名字/比例）
│ $12.34                           │  ← 当前供应商的**详情模板**产出（余额币种只出现一次）
│ 5 小时                       20% │  ← 窗口行右缘对齐：百分比定宽 34px、重置倒计时定宽 62px
│ 每周                         55% │
│ 每月                         92% │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│ 数值位显示余额  ☐                │  ← Goat 自己的控件（画在它的详情卡片底部）：勾上 → 数值位换成余额
│ 按钮画哪个窗口  [5h][1w][1m]     │  ← 图表（环）**一直画**，默认 1m（月额度）；这三项写浏览器本地偏好
│ 10 秒钟前                      ⟳ │  ← 数据新鲜度 + 刷新
├──────────────────────────────────┤
│ 切换供应商                       │
│ ◍ DeepSeek 官方           当前 ✓ │  ← 每行左侧的图形来自该 provider 的按钮模板（`row` 档，16px）
│ ◍ Opencode 官方         拉取正常 │
│ ◍ 不常看的旧账号          已禁用 │
├──────────────────────────────────┤
│ 连接 Host 失败                   │  ← 错误提示挪到**页脚**，不再占第一屏第一行
│ 增删改供应商：设置 → TokenMeter  │
└──────────────────────────────────┘
```

- **顶部只放必要信息**：卡片头就是「16px 主图形 + 供应商名」（类型标签在下面的切换列表里已经有了，不再重复；卡片头也不复用宽栏按钮内容，所以不会再出现「Goat 68%」和「Goat CC」同时挂在顶部）。详情模板顶部同样**不再重复窗口百分比徽标** —— commandcode / opencode 只留「计划 · 状态」或「按量计费」一枚徽标（百分比在下面的窗口行上），deepseek 去掉了「凭据」徽标，只留「官方余额接口 / 网页账单接口 / 票据会过期」。浮层里**没有第二层卡片**（详情区不画背景 / 边框，浮层本身即卡片）。
- **控件画在供应商自己的详情卡片底部**（详情主体与它之间一条细分隔线，类名 `.prefBlock` / `.prefRow`）：谁有偏好谁负责画，插件不提供统一的「显示设置」面板。
- **错误提示在页脚**（与「增删改供应商：设置 → TokenMeter → 额度配置」同一块），不再占第一屏第一行。
- **一次只激活一个**：点某一行即写 `activeVendor`（Host 只主动拉取「已启用」的供应商）；行右侧状态分 拉取正常 / 拉取失败 / 未拉取 / 已禁用，状态点与失败分类同源着色。
- **偏好是浏览器本地偏好**：控件写的是 `localStorage` 键 **`tm-quota-prefs`** 里该供应商那一小袋键值（键名与取值由供应商模板自己定），按钮**立刻重画** —— 组件级通信，零往返、不会失败；**不进持久化配置、没有 Host 路由**（换机器 / 换浏览器就是另一份口味，详见下文「[供应商自己的偏好袋](#供应商自己的偏好袋)」）。上一版的单键 `tm-button-metric` 已废弃，加载时顺手删掉。
- **拉取失败时详情位显示结构化错误卡**（`ErrorCard`：结论 + 处置 + 有序排查步骤 + 原始信息 + 重试），不是一句原始报错；同时按钮上的模板若走失败分支，会画**空环 + 满圈警告色**（红 = 要人管的、黄 = 临时性的）。分类学见下文「失败提示」。
- 列表顺序 = 当前供应商 → 已启用 → 已禁用（同档保持条目 `config:` 顺序），见下文「供应商排序」。

![旧版额度查询界面（重构前）](images/quota.png)

> 上图是**重构前的旧版额度查询界面**（中心区面板 + 供应商卡片网格 + 峰谷横幅），相关显示面已全部删除；现在额度只在侧边栏按钮的上方浮层里。

**「用量统计」—— 统计仪表盘**

顶部指标卡（模型调用次数 / 首次使用 / 最近使用）+ Token 使用趋势折线（近 24 小时/7 天/30 天，按天聚合，悬浮查看明细）+ Token 活力热力图（6 / 12 个月两档 —— 卡片够宽自动铺 12 个月、窄了自动退回 6 个月，也可手动切换并记住；悬浮查看当日明细：总消耗、会话数、输入/输出构成、缓存读/写与占比）+ 模型用量分布环形图（中心累计 Token，悬浮查看各供应商×模型构成）。

![用量统计：指标卡 + 趋势折线 + 活力热力图 + 模型分布](images/token-usage.png)

**「在线统计」—— 三口径 + 每日在线 + 排行**

顶部常驻**空闲阈值**说明：三条规则（相邻事件间隔 ≤ 阈值则整段计入含中间空档、超过则断开、每段只算到最后一个事件所以任何档位都是下界）+ **五档实测对比**（1/5/15/30/60 分钟各自的累计在线与边际增量，直接取自快照，点击即切换，推荐 15 分钟并标注）。下方是 7 张三口径指标卡（今日在线 / 累计在线 / 活跃日均 / 对话进行中 / 模型生成 / 工具执行 / 引擎合计，各带 精确 / 估算 / 下界 徽标）、每日在线柱线图（柱 = 对话中 + 空档，虚线 = 引擎合计，峰值标注）、每日在线排行（柱状图与列表合体，悬浮看当日明细）与「口径与准确性」表。

![在线统计：空闲阈值说明与五档对比 + 三口径 + 每日在线 + 排行](images/online.png)

## 功能

| 部分                                          | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host（`src/host/` → `lib/host.js`）**       | 额度：provider 注册表委托拉取（`opencode` / `deepseek` 自动选路 / `commandcode` / `manual`，别名 `opencode-go`/`opencode-zen`/`deepseek-api`/`deepseek-web` 读路径自动归一），每个 provider 同时产出**自己的数据与 UI 视图**（`ProviderView` 声明式区块 + `icon` 图标名，见「[provider 两套模板](#provider-两套模板按钮级--详情级)」），密钥 `$NAME`/`{env:}`/`{cred:}` 解析（凭据服务优先、环境变量兜底），明文脱敏（只写不读、留空保留）、`secret-to-cred` 一键转存、内存快照（`st.snaps`，失败保旧）。统计：`sessionQuery` 全量扫描 + 文件指纹缓存（`storageDomain` 域 `token_stats`，域名保持不变；记录版本 `v=4`）+ 在线时长估算（`stats/online.ts`）+ 后台分批泵（每批 3 会话——批内并发受内存约束、`setImmediate` 让出、单会话超时 20s 起按次退避至 90s、失败 3 次跳过）+ `session/event` 失效。通过官方 `ctx.settings` + `schemastery` 持久化到 profile 条目 `dshp-token-meter` 的 `config:`；**配置只认该 NS，不读旧文件/旧 key**。 |
| **Client（`src/client/` → `lib/client.js`）** | 「设置 → **Token 总览**」分成两个 Tab：                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

- **统计设置**：数据来源提示（所有统计都由 `$DSH_HOME/sessions/` 的会话日志重算，**迁移/备份必须保留该目录**；`storages/token_stats.json` 可丢）、缓存与扫描状态（复用 / 缓存命中 / 扫描失败 / 直读 / 存储）、**清除统计缓存**（确认后清空派生缓存，下一次快照全量重算）、默认范围、在线时长空闲阈值；
- **额度配置**：自动刷新间隔 + 供应商添加与管理（当前选择/拉取/启用-禁用/编辑/存凭据/删除）。**这里没有「按钮显示」控件** —— 那项偏好放在额度浮层里（你看到按钮的地方），而且它存在**浏览器本地**，不写持久化配置。

图表全部搬到中心区。失效的侧边栏显示开关已移除。中心区注册**一个** tab（官方 `conversation.view`，order 40，与原生「对话 / 轨迹」并列），tab 内用**左侧菜单**切换**三块**：**用量统计**为完整统计（指标卡、趋势线、热力图、模型环形图 + 顶部的「小组件」工具条）；**在线统计**为每日/累计时长统计：在线（你 + DSH）/ 对话进行中（DSH 的钟）/ 模型 + 工具（DSH 的活，精确）三口径并列，柱线混合图（柱 = 对话中 + 空档，虚线 = 引擎合计）带**悬浮数据提示**；**每日在线排行**把柱状图与列表合体（每行既是名次也是一根横向堆叠条，悬浮出当日明细，可展开全部活跃日）；另有口径与准确性表（精确/估算/下界徽标，含会话口径分解）。（在线统计面板不支持弹出为浮窗，顶栏抓手已移除。）**额度入口是左侧边栏底部的一枚按钮**（官方 `sidebar.footer.action`，不占活动栏图标、也不占右侧栏原生 tab）：按钮内容、浮层详情、以及卡片底部那些显示控件都来自该 provider 的两套模板；点开在按钮上方弹出浮层。**供应商级余额查询开关**：每个供应商可单独「禁用」——禁用后它退出 Host 主动定时拉取，浮层里那一行标注「已禁用」，但手动「拉取」、已有快照展示与切换为当前均不受影响（开关在 设置 → Token 总览 的「额度配置」里）。小组件化：统计图表（指标卡 / 趋势 / 热力 / 模型分布 / 今日消耗）各是一个独立小组件，入口是中心区「用量统计」顶部的「小组件」工具条（逐张开合）。装了 [`@dshp/widget-kit`](../widget-kit/README.md) 时窗口由框架画（含吸附预览、主题色玻璃、动效、刷新后原地恢复），没装时自动退回插件自带浮层——两种承载下**原位都会消失**，`回归` 按钮收回原位。详见「[小组件](#小组件框架卡片--自带浮窗)」。UI 全部使用 DSH 官方设计 token（`dsw-alias-*`），与官方设置页风格一致。**图标全部自绘、零依赖**：导航图标在 `src/client/icons.ts`，供应商图标（官方鲸鱼路径 / 命令键 ⌘ / 圆角方框 / 账本 / 通用兜底）在 `src/client/provider-icons.tsx`，数据语义图标在 `src/client/glyphs.ts`（23 枚：累计=堆叠、缓存=圆柱、峰值=闪电/山、日均=基准线+起伏、中位=中位线、连续=火苗/奖杯、活跃=日历、调用=芯片、首次=旗、最近/在线=时钟、今日=太阳、累计在线=沙漏、对话=气泡、工具=终端、引擎=齿轮、热力=九宫格、模型分布=圆环、每日在线=柱状、排行=榜单、口径=同心靶…）。**同一枚图标用两处**：13~~14px 贴在指标标签前 / 卡片标题前，以及放大到 58px、约 8% 透明度摆在各指标卡右下角当**水印底纹**（被卡片圆角裁切），让每张基础数据卡带一点与数据意境相符的图形而不是纯色块；色调态卡略强（12%）。未知图标名回退成圆点，不会崩也不会空白。**圆角只用产品默认值，且不覆盖全局角形**：不设私有半径变量层（卡片/浮窗 12px · 按钮/输入 8px · chip 6px · 胶囊 999px · 圆形 50%，与官方组件同一套），也不声明 `corner-shape` —— 主题包已用 `*,:before,:after{corner-shape:var(--dsw-corner-shape)}` 全局接管，插件再写一遍（哪怕写 round）就会把调主题插件的选择顶掉。图表内部的微圆角（点/条/热力格 1.5~~4px、圆环 50%）属于图形几何，不受主题半径影响。无额外依赖。 |
| **同源路由** | `GET /ext/dshp-token-meter/state`（配置脱敏 + 快照 + provider 元数据）、`POST /ext/dshp-token-meter/config`（通用偏好补丁）、`POST /ext/dshp-token-meter/refresh`、`POST /ext/dshp-token-meter/set-active`、`POST /ext/dshp-token-meter/set-refresh`、`POST /ext/dshp-token-meter/set-enabled`（旧客户端兼容，当前界面不再调用）、`POST /ext/dshp-token-meter/set-vendor-enabled`（单供应商余额查询开关，`{ id, enabled }`）、`POST /ext/dshp-token-meter/add-vendor`、`POST /ext/dshp-token-meter/update-vendor`、`POST /ext/dshp-token-meter/delete-vendor`、`POST /ext/dshp-token-meter/secret-to-cred`、`GET /ext/dshp-token-meter/stats`（聚合快照，别名 `/data`）、`POST /ext/dshp-token-meter/clear-cache`（清空派生统计缓存 → 下次快照全量重算），均带同源校验（`Origin` 与 `Host` 一致或缺失才放行）+ `no-store`。 || **同源路由** | `GET /ext/dshp-token-meter/state`（配置脱敏 + 快照 + provider 元数据）、`POST /ext/dshp-token-meter/config`（通用偏好补丁）、`POST /ext/dshp-token-meter/refresh`、`POST /ext/dshp-token-meter/set-active`、`POST /ext/dshp-token-meter/set-refresh`、`POST /ext/dshp-token-meter/set-enabled`（旧客户端兼容，当前界面不再调用）、`POST /ext/dshp-token-meter/set-vendor-enabled`（单供应商余额查询开关，`{ id, enabled }`）、`POST /ext/dshp-token-meter/add-vendor`、`POST /ext/dshp-token-meter/update-vendor`、`POST /ext/dshp-token-meter/delete-vendor`、`POST /ext/dshp-token-meter/secret-to-cred`、`GET /ext/dshp-token-meter/identity`（分享卡用的 git 身份：先 `ctx.get('shell')` 跑 `git config --get user.name|user.email`，拿不到 shell 服务或命令失败就退化为直接解析 `$XDG_CONFIG_HOME/git/config` / `~/.gitconfig`；可用 `DSHP_TOKEN_METER_GIT_NAME` / `_GIT_EMAIL` 覆盖；结果含失败都会缓存）、`GET /ext/dshp-token-meter/stats`（聚合快照，别名 `/data`）、`POST /ext/dshp-token-meter/clear-cache`（清空派生统计缓存 → 下次快照全量重算），均带同源校验（`Origin` 与 `Host` 一致或缺失才放行）+ `no-store`。 |
| **工具** | 无模型工具（本插件为运维/展示型，不注册 `tools`）。 |

### 小组件（框架卡片 / 自带浮窗）

**入口**：中心区「用量统计」顶部的**「小组件」工具条** —— 五张统计卡（指标卡 / 用量趋势 / 用量热力 /
模型分布 / 今日消耗）各有一个开关按钮，就地开合。**本插件不占活动栏图标**（一个都不占）：
额度入口是侧边栏按钮，统计卡的开关是这块工具条，所以没有「一个图标点开小组件菜单」这回事。

每张统计图表都可以从工具条（或卡片自己的开关）弹出为独立小组件，原位随之隐藏（`回归` 收回）。
**同一份组件、两种承载**：

| 条件                            | 谁画窗口                                                                                   | 你得到什么                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 装了 `@dshp/widget-kit`（推荐） | 框架（`ctx.widgets.register`，`trayIcon: false` 的自由卡片）                               | 拖拽 / 八向缩放 / 最小化成胶囊 / **锁定位置** / 八向吸附与主题色预览 / 外观与动效跟随全局设置 / 刷新后位置与开关原地恢复 |
| 没装（或服务形状不符 / 被停用） | 插件自带浮层（`widgets.tsx` 的 `WidgetFloat` + portal，坐标存 `localStorage: tm-widgets`） | 老行为：任意非交互区域按住可拖，原位让位、`回归` 收回                                                                    |

两条硬约束（也是这套设计的由来）：

1. **可选依赖不能写进顶层 `inject`**：`export const inject = ['slots']`，宿主用
   `ctx.inject(['widgets'], …)` 挂载。否则用户没装框架时，本插件的额度按钮与设置页会一起消失 ——
   小组件只是增强，不是本插件的存在前提。
2. **卡片不占活动栏图标**（`trayIcon: false`），所以注册是**常驻**的：启动时与供应商增删时
   由 `syncFloatWidgets()` 把注册表对齐到当前该有的卡片，否则刷新后「还开着」的卡片长不回来。

2026-09 UI 重构后只剩**统计族**（`stats:<kind>`），宿主 id 的映射因此变得很直白
（额度已不是可弹出的卡片，峰谷显示器随额度显示面一起删除，供应商 id 的 slug + 哈希编码一并下线）：

| 插件内部 id   | 宿主 id（`@dshp/widget-kit`） |
| ------------- | ----------------------------- |
| `stats:cards` | `token-meter:stats-cards`     |
| `stats:trend` | `token-meter:stats-trend`     |
| `stats:heat`  | `token-meter:stats-heat`      |
| `stats:donut` | `token-meter:stats-donut`     |
| `stats:today` | `token-meter:stats-today`     |

**每张卡的初始尺寸各自适配**（不是一套尺寸打天下）：热力图是宽而扁的周 × 日网格，给它高度纯属浪费；
模型分布是圆环 + 多列列表，矮了会压成滚动条；今日消耗只有一张卡，天生就小。数值只有一处
（`widget-bridge.ts` 的 `FLOAT_SIZES`），改尺寸只改那里：

| 小组件                    | 初始      | 可缩到最小 | 依据                                                     |
| ------------------------- | --------- | ---------- | -------------------------------------------------------- |
| 指标卡（`stats:cards`）   | 460 × 360 | 300 × 220  | 3 列 `minmax(148px)` 网格 + 三段（全量 / 可视化 / 构成） |
| 趋势（`stats:trend`）     | 520 × 320 | 340 × 200  | 折线图：横向空间直接决定可读性                           |
| 热力（`stats:heat`）      | 560 × 230 | 360 × 170  | 周 × 日热力网格**宽而扁**                                |
| 模型分布（`stats:donut`） | 460 × 420 | 320 × 320  | 圆环 + 多列模型列表（窄于 480 会塌成一列，底部要留高）   |
| 今日消耗（`stats:today`） | 320 × 200 | 260 × 150  | 单张卡，天生小                                           |

宽度是按 `styles.module.css` 里的容器查询断点（300 / 340 / 420 / 480）挑的：取在断点之上，
内容才是「宽屏那套排版」，而不是把窄屏排版塞进一个宽窗里。

编码/标题/尺寸是纯函数（`src/client/widget-bridge.ts`），由 `scripts/check-widget-bridge.mjs` 看守
（7 组：id 合法 / 稳定 / 不撞车、统计族可反解、`isFloatId` 只认统计族、标题表、尺寸表 5 族）；
另有 `scripts/check-widget-kit-bridge.mjs` 把两个插件的真实产物对接起来跑一遍（无浏览器），
确认「5 张统计卡真的进了框架注册表、没有框架时也照常退化」、**0 个带活动栏图标的描述符**、
侧边栏按钮真的注册进了 `sidebar.footer.action`（宽栏 = 图标 + 名字 + 数值，窄栏 = 一枚表盘：环当外圈、供应商图标居中在环心），
以及**在供应商自己的卡片里操作控件**：断言详情里恰好 1 个 `role="radiogroup"`（含 `5h/1w/1m` 三项）与 1 个
`input[type=checkbox]`；`prefs.window=5h|weekly|monthly` → 按钮分别显示 `20%|55%|92%`；勾上开关 → 数值位变
`$12.34` 且**环仍在**（百分比消失）；点选项 / 勾开关都写进 `localStorage` 的 `tm-quota-prefs`，重开一份
bundle（≈刷新页面）仍读得到。另有 `scripts/check-quota-templates.mjs`（**9 组**）看守按钮模板的通用语义、
偏好袋与配色护栏（占用档位、多窗口取最高、失败环、没有写死色值、偏好袋作用域隔离 / 坏数据不崩 /
可订阅 / 能清孤儿、色调类不许有裸规则）。

### 统计口径

- 总 Token = inputTokens + cacheReadTokens + cacheWriteTokens + outputTokens（reasoningTokens 已含在 outputTokens，不重复计）
- 同一 (turn, step) 的 usage chunk 为早期采样、assistant/message usage 为终值，覆盖不重复累计
- fork 会话跳过其继承前缀（`readSession.inheritedEventCount`，即落盘 `seedLength`；父会话已计），不重复计数
- 含子代理会话（它们是真实用量）

数据源是 `sessionQuery` 服务实时扫描会话日志：**会话日志是唯一真相源**，`storages/token_stats.json` 只是可丢的派生缓存（每会话一行，含 token 桶与时长区间），删了会自动重算；因此**备份/迁移请保留 `$DSH_HOME/sessions/`**。设置页提供「清除统计缓存并重算」作为手动兜底。

#### 在线时长口径（`stats/online.ts`）

「在线」= 会话日志里有事件、且**相邻事件间隔不超过阈值**的墙钟时间：

- 跨会话按**区间并集**合并：同一时刻开着多个会话/子代理不重复计时（各会话时长直接相加会虚高约 30%）；
- fork/续接会话的继承前缀按 `inheritedEventCount` 跳过（父会话已计），所以历史对话不会重复计时；
- 「对话进行中」另算一路：`turn/start → turn/end` 的并集（不含轮次之间的空档）；
- 日志**只在有事件时打点** —— 窗口开着但没事件的时间在数据里不存在，所以任何阈值下都是**下界**，不是「坐在电脑前」的时长；
- 阈值的三条规则（面板顶部常驻说明 + `online.stats/online.ts` 文件头同步维护）：**① 间隔 ≤ 阈值 → 整段算在线**（中间空档一并计入，例如 10:00 与 10:50 两个事件、阈值 60 分钟，中间 50 分钟计入）；**② 间隔 > 阈值 → 断开**，中间那段一秒不计，新段从下一个事件重新起算；**③ 每段只算到最后一个事件**，之后的时间（含关窗口前那几分钟、或之后 3 小时没产生事件）都不计 —— 所以任何档位都是**下界**，不是「坐在电脑前」的时长。
- 阈值是**口径**不是精度：同一份日志 1 分钟档与 60 分钟档能差近一倍，所以面板把五档（1/5/15/30/60 分钟）连同**各自实测的累计值与边际增量**一起摆出来（数据来自快照里已有的 `totalMs[gap]`，点卡片即可切换）——只给当前档一个数字，用户没法判断该选哪个。（旧文案里写死过一句「60 分钟档比 1 分钟档多约 90h」，那是某个人的数据，对别人就是错的，已删除。）
- **推荐默认 15 分钟**（`DEFAULT_GAP_MIN`，也是 Host 侧 `onlineGapMin` 的默认值）：DSH 真正在干活时日志里持续有事件（模型 step、工具 call/result、子代理），不依赖大阈值；需要兜的是「读长回答、想下一个需求」这类几分钟量级的静默期。5 分钟以下会把这类静默期切断（偏低），60 分钟会把开会/吃饭整段算成在线（只适合回答「今天开着 DSH 多久」）。用户手动选过的值优先。

实现上分两级合并：`fold` 阶段把每会话的事件时刻按 1 分钟压成区间并随缓存落盘（`on`/`tn` 字段），
快照阶段再按所选阈值合并这些区间 —— 单链聚类可结合，因此**换阈值不需要重扫日志**。
（已用 238 个真实会话、50 万条事件校验：两级合并结果与「直接对全部事件按同一阈值合并」逐档一致。）

#### 引擎时长（模型 / 工具）

与在线时长**同一条扫描路径**（同一个 `readSession`、同一次 `foldSession`、同一行缓存），但算术不同：

- `llmMs`：`Σ(step/start → assistant/message)`，只统计真正组装出消息的步骤（被取消的步骤不计）；
- `toolMs`：`Σ(tool/call → tool/result)`，按 `callId` 配对；`turn/end` 时丢弃未落地的调用。

这两项是**精确**的：已用本机 126 个会话与 DSH 自带 `sessionStats` 投影缓存逐条对账，**126/126 完全一致**（差值 < 1ms）。
它们是**跨会话相加**的（同时开多个会话/子代理会重复计），所以「引擎合计」可能大于墙钟的「对话进行中」——这正是并行度的体现。

#### 读取策略与「最小化重算」

日志会一直长（本机最大会话已 **9.5 万条事件 / 压缩 28MB / 解压 71MB**，按当前用量推 10 个月后可能 95 万条），
所以读取按代价从低到高三级，尽量避免整份重算：

1. **会话级增量流**（`stats/stream.ts`）：日志是 append-only 的多帧 zstd，会话已有流且只是变长时，
   只 `consumeLogTail(file, offset)` 读**新增的那几帧**并推进折叠器；
2. **整份直读**（`stats/logread.ts`）：首读或文件被重写时，逐帧解压 + **切掉 fork 继承前缀**
   （继承段是连续前缀，跳过 `time < createdAt` 的事件），事件解析出来就喂折叠器、
   **不驻留事件数组**；
3. **官方 reader**：只在没有日志文件 / 直读失败 / 需要 live 内存态时使用。

实测（本机 238 会话 / 250MB 日志）：

| 场景                            | 结果                                               |
| ------------------------------- | -------------------------------------------------- |
| 流式首读 vs 整份直读            | 246/246 逐会话聚合**完全一致**                     |
| 追加 867 字节后续读 vs 整份重读 | 结果**完全一致**；耗时 **1ms vs 1190ms（≈1190×）** |
| 流式首读内存峰值（最大日志）    | **0MB**（整份直读构造事件数组是 133MB）            |
| 冷启动全量扫描（238 会话）      | **5.7s**，RSS 峰值 426MB                           |
| 热快照（全部命中缓存）          | **19ms**                                           |
| 删掉缓存文件后重算              | 与首次**完全一致**（缓存是纯派生数据）             |

逐帧解压与 `zstdcat` 在 246 个日志上逐字节一致；直读 238/238 成功；
fork 语义抽查与官方口径一致（整份继承的会话记 0、种子会话只记自己那 1.64 亿）。
`zlib.zstd*` 需要 Node ≥ 22.15/23.8，老版本自动退化为官方 reader。

#### 哪些数据是精确的、哪些是估算的

| 指标               | 来源                           | 聚合方式               | 性质                                                    |
| ------------------ | ------------------------------ | ---------------------- | ------------------------------------------------------- |
| Token（i/o/cr/cw） | 供应商上报的 `usage`           | 按天/小时/模型求和     | 精确（按上报值）；未上报 usage 的步骤算不到 → 略低      |
| 模型 / 工具时长    | 事件时间戳（step / tool 边界） | 逐会话求和（并行相加） | 精确（已与 `sessionStats` 逐会话对账）                  |
| 对话进行中         | 事件时间戳（turn 边界）        | 区间并集（墙钟去重）   | 估算；含少量等你操作的时间（审批等待实测约 0.7h）       |
| 在线时长           | 全部事件时间戳                 | 并集 + 空闲阈值合并    | 估算且是**下界**；阈值（1/5/15/30/60 分钟）直接决定结果 |
| 会话数 / 活跃天数  | `sessionQuery` 会话列表        | 计数                   | 精确（扫描失败的会话会单独报数）                        |

面板的「口径与准确性」卡片把这张表直接渲染出来（精确/估算/下界 三色徽标），无需查文档；
同一张卡还会给出**会话口径**：`有用量 / 总数` 以及其余会话的去向
（请求失败/中断、fork 继承空壳、从没发起请求、供应商未上报 usage、读不出来）。

#### 面板默认值

| 位置                  | 默认           | 说明                                                                                                                                                              |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token 用量统计        | **全部**       | 设置页可改 `defaultRange`（7/30/90/全部）                                                                                                                         |
| Token 活动热力图      | **按宽度自动** | 只保留 6 / 12 个月两档；卡片宽 ≥900px 默认 12 个月，否则 6 个月；手动切换后以手动为准并持久化（`localStorage: tm-heat-span`）；格子横竖同一间隙（2/3/4px 随宽度） |
| 在线时长 · 空闲阈值   | **5 分钟**     | `onlineGapMin`，面板上可切 1/5/15/30/60                                                                                                                           |
| 在线时长 · 每日在线图 | **全部**       | 面板上可切 近14天/近30天/近90天/全部                                                                                                                              |

### 配置项

| 字段           | 类型                           | 默认    | 说明                                                                                                                                                     |
| -------------- | ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`      | `number`                       | `1`     | 配置版本号（保留字段）。                                                                                                                                 |
| `activeVendor` | `string`                       | `''`    | 当前供应商 ID；`''` = 极简模式（不显示任何额度）。                                                                                                       |
| `refreshSec`   | `number`                       | `60`    | 自动刷新秒数；Host 按此间隔拉取**已启用**的供应商，`0`=关闭，其余钳制 `10–3600`。                                                                        |
| `enabled`      | `boolean`                      | `true`  | **遗留字段，已无任何消费方**（旧侧栏额度卡开关；Host 侧只原样回显，界面不读它）。**自动刷新只看 `refreshSec`** —— 写 `enabled: false` 不会关掉自动刷新。 |
| `vendors`      | `Vendor[]`                     | `[]`    | 供应商列表（`{ id, name, type, params, enabled? }`，`id` 主键 2–31 位小写/数字/横线）。                                                                  |
| `showToday`    | `boolean`                      | `false` | 遗留字段（旧左栏开关，已无界面消费，仅保留做存储兼容）。                                                                                                 |
| `defaultRange` | `'7' \| '30' \| '90' \| 'all'` | `'all'` | token 用量统计默认时间范围（缺省「全部」）。                                                                                                             |
| `onlineGapMin` | `number`                       | `5`     | 在线时长空闲阈值（分钟），吸附到 `1/5/15/30/60`；只影响快照合并，不需要重扫日志。                                                                        |

供应商 `type`（`providerTypes` 下发，设置页下拉据此渲染）：

| type          | 说明                                                                                                               | 凭据                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `opencode`    | Opencode Go+Zen 合并（`/go` 三窗口+订阅、`/billing` 余额，同 workspace 一次拉双页）                                | `workspaceId` + `cookie`                                   |
| `deepseek`    | DeepSeek 单入口自动选路：`sk-` 开头走官方余额接口，会话票据走网页账单（余额+累计消费+趋势），一路 401/403 自动换路 | `apiKey` 和/或 `token`（+可选 `cookie`）                   |
| `commandcode` | Command Code 额度：5 小时/每周滚动窗口 + 剩余额度 + 本计费周期用量/请求数/成功率/tokens                            | `apiKey`（`user_` 开头，缺省回退 `$COMMAND_CODE_API_KEY`） |
| `manual`      | 本地账本，`billing: rolling` 填 total/used，`payg` 填 balance/granted/lowWarn                                      | 无                                                         |

旧 `opencode-go` / `opencode-zen` / `deepseek-api` / `deepseek-web` 均为**别名**：读路径自动归一，新写入只落主 type，不会改写你已有的配置文件。

供应商级 `enabled`（余额查询开关）：**缺省 = 启用**，只有显式 `enabled: false` 才是禁用。禁用后该供应商不参与 Host 的主动定时拉取（含启动后的首拉），但**手动「拉取」、已有快照展示、切为当前供应商都不受影响**；开关在 设置 → Token 总览 的「额度配置」供应商列表里（写 `POST /set-vendor-enabled`）。启用时字段会被删掉而不是写成 `true`，因此旧配置零迁移、YAML 也不会冒出冗余字段。

**显示偏好（不是配置项）**：它是**浏览器本地偏好袋，不在持久化配置里**（见「[供应商自己的偏好袋](#供应商自己的偏好袋)」）。Host 没有这个字段、没有校验函数、也没有写它的路由；控件由该供应商的详情模板画在自己卡片底部（设置页没有这类控件），点一下写 `localStorage` 的 `tm-quota-prefs` 里它那一袋键值，侧边栏按钮立刻重画。因此它**不随配置跨机器同步**，也**不会**在编辑供应商后被覆盖（压根不在配置里）。

## 配置（profile 条目 `config:`）

profile 条目 `dshp-token-meter` 的 `config:`（标准 settings 存储，手工编辑条目重启后生效，设置页写入即热更）：

```yaml
dshp-token-meter:
  activeVendor: oc-main
  refreshSec: 60
  enabled: true
  showToday: false
  defaultRange: '30'
  vendors:
    - id: oc-main
      name: Opencode 官方
      type: opencode
      params: { workspaceId: wrk_xxx, cookie: $OPENCODE_COOKIE }
    - id: ds-main
      name: DeepSeek 官方
      type: deepseek
      params: { token: $DS_TOKEN, apiKey: $DEEPSEEK_API_KEY, lowWarn: 5 }
    - id: m1
      name: 手动账本
      type: manual
      params: { billing: payg, balance: 50, granted: 100 }
    - id: cc-main
      name: Command Code
      type: commandcode
      params: { apiKey: $COMMAND_CODE_API_KEY, lowWarn: 10 }
      # apiKey 留空即自动回退读 $COMMAND_CODE_API_KEY（与 CLI 同一约定）
    - id: old-main
      name: 不常看的旧账号
      type: opencode
      enabled: false # 禁用余额查询：退出定时拉取，需要时仍可在卡片上手动「拉取」
      params: { workspaceId: wrk_old, cookie: $OPENCODE_COOKIE_OLD }
```

`activeVendor: ""` = 极简模式（不显示任何额度）。

> `cookie` 即浏览器登录态：开发者工具 → Application → Cookies → 复制 `auth` 的值，
> 整段 Cookie（含 `oc_locale` 等）原样粘贴亦可；各参数的含义与获取方式见设置页表单
> 每个字段下方的说明（由 provider 的 `fields[].hint` 下发）。
> 旧写法兼容：`opencode-go`/`opencode-zen`、`deepseek-api`/`deepseek-web` 均为别名，
> 读时自动归一到主 type（不落库、不改写你的文件）；`params.auth`（opencode 系）→ `cookie` 值不变；
> `{cred:}`/`{env:}` → `$NAME`。

## provider 两套模板（按钮级 / 详情级）

**Host 侧**：每个适配器 return 自己的数据（`ProviderResult`：`windows`/`billing`/`view`/`extra`）
外加可选的 `icon`（图标名）。
**Client 侧**：每个 provider 在 `src/client/providers/ui/<type>.tsx` 里导出**一个** `ProviderTemplates`
对象，两套独立模板各管一段 —— 这就是「UI 也基于 provider 灵活分层」：

- **按钮级** `button(ctx, K) => ReactNode`：侧边栏那枚按钮里画什么 —— **完整节点、自由渲染**
  （环 / 余额大数字 / 多条窗口迷你条 / 供应商图标 / 任意组合），**不限定「一枚环」**；
- **详情级** `detail(ctx, K) => ReactNode`：浮层里该供应商的主体内容（完整节点，自由排版）。

外加一个按钮专属声明：**`buttonHint`**（悬停 / 无障碍说明 —— 窄栏没有可见文字，全靠它；缺省回落
通用环语义）。「按钮上显示什么」**没有统一声明**：由该供应商在自己的 `detail` 里画控件、写 `ctx.prefs`
（见下文「[供应商自己的偏好袋](#供应商自己的偏好袋)」）。

```
Host    src/host/providers/<type>.ts        → return 自己的数据 + icon（图标名）
Client  src/client/providers/templates.ts   → 契约（ProviderTemplates / ButtonRenderCtx / QuotaRingSpec + 工具函数）
        src/client/providers/ui/<type>.tsx  → 该供应商的 button + buttonHint + detail（控件也画在 detail 里）
        src/client/providers/ui/index.ts    → 注册表（一个 type 一行 registerProviderTemplates）
        src/client/providers/registry.tsx   → 调度：renderButton / buttonTitle / renderBody（各自兜底）
        src/client/providers/kit.tsx        → 通用可复用零件（ProviderUIKit，含 PrefSwitch / PrefChoice）
        src/client/providers/sections.tsx   → 声明式区块渲染（没有专属 detail 时用）
        src/client/quota-prefs.ts           → 供应商偏好袋（浏览器本地，见下）
        src/client/provider-icons.tsx       → 供应商图标（官方品牌路径 + 自绘线稿；iconOf 名字解析）
        src/client/QuotaRing.tsx            → 通用环：把 QuotaRingSpec 画成 SVG
        src/client/QuotaTrayPanel.tsx       → 浮层：纯展示 + 交互回调，不认识任何供应商
```

### 按钮级契约（自由节点）

```ts
interface ProviderTemplates {
  button?: (ctx: ButtonRenderCtx, K: ProviderUIKit) => ReactNode; // 按钮内容（自由）
  buttonHint?: (ctx: ButtonRenderCtx, K: ProviderUIKit) => string; // 悬停 / 无障碍说明
  detail?: (ctx: RenderCtx, K: ProviderUIKit) => ReactNode; // 详情主体（显示控件也画在这里）
}
```

`ButtonRenderCtx` 在详情级 `RenderCtx`（`snap` / `now` / `type` / `vendorName` / **`prefs`**）之上补两样按钮独有的信息：

| 字段      | 类型                        | 说明                                              |
| --------- | --------------------------- | ------------------------------------------------- |
| `variant` | `'wide' \| 'rail' \| 'row'` | 三档位置（见下表）                                |
| `icon`    | `string`                    | 供应商图标名（Host 元数据 → 客户端兜底表 → 通用） |

（`prefs` 是**按供应商分作用域**的键值袋，按钮级与详情级都能拿到 —— 见下文「[供应商自己的偏好袋](#供应商自己的偏好袋)」。）

| `variant` | 位置                         | 常规做法                                            |
| --------- | ---------------------------- | --------------------------------------------------- |
| `wide`    | 展开的侧边栏（42px、拉满宽） | `K.ButtonLayout`：图标 + 主图形 + 名字 + 右对齐数值 |
| `rail`    | 收起的 56px 轨道             | 只放主图形（缺省「图标 + 主图形」并排），文字收起   |
| `row`     | 浮层里的供应商切换行         | 只放主图形（与那一行 16px 的图标槽对齐）            |

### 按钮级零件（`ProviderUIKit`）

| 零件               | 说明                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `ButtonLayout`     | **骨架**：宽栏 = 图标 + 主图形 + 名字 + 数值；窄栏 = `rail` 覆盖（缺省「图标 + 主图形」）；切换行 = 只有主图形（`glyph` 优先）  |
| `Ring`             | `QuotaRingSpec` → SVG 环（几何 / 描边 / 动画 / 配色统一在这里）                                                                 |
| `WindowBars`       | 多条滚动窗口的迷你条（5 小时 / 每周 / 每月并排；宽栏推荐画法，比三个环省地方）                                                  |
| `ProviderIcon`     | 供应商图标（16×16 网格 / 描边 1.4 的自绘线稿 + 官方品牌路径；未知名字给通用那枚；尺寸宽栏 16 · 窄栏 15 · 切换行 16）            |
| `shortWindowLabel` | 窗口短标签（`5 小时` → `5时`、`每周` → `周`）                                                                                   |
| `tinyMoney`        | **极短金额**：`$46.6` → `$47`、`¥12345` → `¥1.2万`（金额要塞进窄槽位时用；窄栏是表盘，没有数值位）                              |
| `PrefSwitch`       | **偏好开关**：标签 + 原生 checkbox（键盘可达、可读屏），勾选即 `onChange` —— 供应商在自己的 `detail` 里用它画「数值位显示余额」 |
| `PrefChoice`       | **偏好单选组**：`role="radiogroup"` + 每项 `role="radio"`，当前项标 `data-on` —— 如 Goat 的 `5h / 1w / 1m`（默认 `1m`）         |

**环仍然是「一种常见画法」，不是契约**：想画环的模板用 `QuotaRingSpec` 描述它 —— `pct`（0–100 或 `null`）/
`tone`（`ok`/`warn`/`bad`/`idle`，阈值 70 / 90 → warn / bad）/ `text`（环内极短文案）/ `title`（悬停说明，**必填**）/
`custom`（完全自绘覆盖）。两个特殊态：`pct: null` + `tone: 'idle'` 只画轨道（**不编假比例**）；
`pct: null` + `tone: 'bad'` 画整圈警告色。失败快照走 `failureRingSpec()`：空环 + 满圈警告色
（红 = 要人管的、黄 = 临时性的，与切换列表的状态点同源）。推荐尺寸由 `ringSizeOf(variant)` 给
（宽栏 / 切换行 **16px**，窄栏 **28px** = 表盘外圈）。契约里的工具函数（`templates.ts`）：`toneOfPct` / `clampPct` / `windowPct` /
`worstWindowPct` / `windowOfMetric`（按供应商自己定的窗口键取一条窗口）/ `balanceText` /
`defaultRingSpec` / `failureRingSpec`。

### 供应商图标

图标名由 Host 的 provider 元数据声明（`ProviderAdapter.icon` → `describeProviders()` 下发
`ProviderMeta.icon`），客户端 `iconOf(type, metaIcon)` 解析：**元数据名字优先 → 该 type 的兜底表
（`TYPE_ICON_FALLBACK`）→ 通用那枚**。所以新增供应商**不写客户端代码也有图标**（通用那枚），
写了名字就换成自己的。五枚记号都是**自绘线稿**（`currentColor`，深/浅主题都成立，不贴位图、不带底色方块）：
deepseek 官方鲸鱼路径（填充）、opencode 竖向圆角方框、commandcode 命令键 ⌘（中间一方块 + 四角四个回路）、manual 账本、
generic 通用兜底。

**按 16×16 网格画、描边 1.4**（`PROVIDER_ICON_GRID`），实际渲染 14–16px：接近 1:1，没有缩放模糊 ——
早先按 24 网格画再缩到 10–12px，0.42 倍缩放让 1.6 的描边只剩 0.67px，屏幕上就是「对不上、太小、发虚」。
每枚标记占满 12–13 个单位（四周留 1.5 左右），并排时视觉重量一致；外壳加 `display:block` 去掉 inline-SVG
的基线间隙。图标出现在宽栏（主图形前，16px）与窄栏（14px + 主图形 + 3px 间距，塞在 36×36 里）。

### 供应商自己的偏好袋

**没有统一的「按钮显示」面板**（曾经做过一排单选胶囊，被否掉了：那是把各家的口味硬塞进同一套控件）。
谁有偏好谁负责画 —— 控件由**该供应商的详情模板**摆在自己的卡片里，偏好存进一个**按供应商分作用域的键值袋**：

```ts
const window = ctx.prefs.get('window', 'monthly'); // 读（带兜底）
ctx.prefs.set('balance', '1'); // 写 → 侧边栏按钮立刻重画
```

- **键名与取值完全由供应商模板自己定**（Goat 用 `window` = `5h`/`weekly`/`monthly` 与 `balance` = `0`/`1`；
  deepseek / manual 只用一个 `balance`）。插件**不定义任何语义**，也没有 `auto` 这类保留值；换供应商想加
  「显示的币种」之类的键，直接加即可。契约只保证三件事：**读得到、写下去、写完全局重画**。
- **存储是浏览器本地**（`src/client/quota-prefs.ts` 的 `providerPrefs`）：`localStorage` 键 **`tm-quota-prefs`**，
  值是 `{ [vendorId]: { [key]: value } }`。读取时消毒：坏 JSON / 非法 id / 非法键值一律忽略；键名限
  `[a-z0-9-]{1,24}`、值限 `[a-z0-9._-]{0,32}`（短字符串），每家 ≤16 键、≤64 家。写空串 = 删掉这个键。
- **它是组件级通信**：控件 `set()` → 写 localStorage 并通知订阅者（`subscribe`）→ 侧边栏按钮与浮层立刻重画。
  **零往返、不会失败**，也没有「路由没热更新就弹一行『连接 Host 失败』」这种事。
- **为什么不做成 Host 配置**：这是纯展示口味（换一台机器、换一个人，本就该不一样），写进持久化配置
  会跟着配置漂到别的机器；而且为点一下按钮走一趟 `/ext/...` 路由毫无必要。所以 Host 侧**没有**这个字段、
  **没有**校验函数、**没有**写它的路由。
- `prune()` 在配置就绪后清掉已被删除供应商的偏好（等就绪再跑，避免启动瞬间误删）；`scope(vendorId)` 对
  同一供应商永远返回**同一个引用**，可安全放进依赖数组。
- 上一版的单键格式 **`tm-button-metric`**（`{vendorId: metric}`）已废弃，加载时顺手 `removeItem` 删掉。

### 四家的控件与画法

| provider                | 详情卡片底部的控件（它自己画）                                              | 按钮怎么画（`button`）                                                                                                                                          | 详情（`detail`）的专有表达                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deepseek`              | 「数值位显示余额」开关（`PrefSwitch`）                                      | 环**一直画**总额度消耗（已用 /（赠送 + 充值）；官方网页账单路线拿不到总额度 → 空环）；数值位默认是百分比，勾了开关换成余额（余额不足转红）                      | 版式对齐官方客户端的「账户余额」卡：`余额 / 赠送 / 充值` 三行右对齐（多币种追加 `USD 总额` 这类行），往下是总额度消耗进度、消费统计、使用趋势（网页账单路线才有趋势，官方余额接口明确写「不提供历史趋势」的说明）、数据来源徽标（官方余额接口 / 网页账单接口 / 票据会过期；**不再挂「凭据」徽标**） |
| `commandcode`（Goat）   | 「数值位显示余额」开关 + `5h / 1w / 1m` 单选组（`PrefChoice`，**默认 1m**） | 环**一直画**所选窗口的占用比例（默认月额度；没有窗口时回落「空环 + 余额」，低于预警线整环转红）；数值位默认是该窗口的百分比，勾了开关换成余额（窄栏没有数值位） | 计划徽标（只标「计划 · 状态」，窗口百分比在窗口行上）+ 余额大数字（币种只出现一次）+ 三条窗口 + 额度构成 + 「账户与用量」两列网格（**只取前 6 项、一格一项**，不再成对合并 —— 合并会把两对指标挤成 `$23.83 · 1.1 万` 这种乱码流）                                                                   |
| `opencode`              | 与 Goat 同构（开关 + `5h / 1w / 1m`，默认 `1m`）                            | 同上；环的配额来自订阅三窗口（纯按量 Zen 用户没有窗口 → 空环 + 余额）                                                                                           | 顶部只留一枚徽标（「订阅 + 计划」或「按量计费」，窗口百分比不重复挂）+ 三窗口 + 充值余额                                                                                                                                                                                                            |
| `manual`（本地账本）    | 只有「数值位显示余额」开关（本地账本没有多条滚动窗口）                      | 环**一直画**账本「已用 / 总额」；数值位默认百分比，勾了开关换成手填余额                                                                                         | 标注「本地手填，非实时」（原有版式不变）                                                                                                                                                                                                                                                            |
| 没写专属按钮模板的 type | 没有控件（详情也走声明式层）                                                | 通用兜底 `defaultRingSpec()`：最紧窗口 → 空环 + 余额，配上 `ButtonLayout` 骨架                                                                                  | 声明式区块 → legacy（**零客户端代码可用**）                                                                                                                                                                                                                                                         |

**窄栏（36px 圆）始终是一枚表盘**：环当外圈、供应商图标居中在环心。数字放不下，说明走 tooltip（`buttonHint`）—— 勾没勾「数值位显示余额」都一样。

### 调度与兜底

`registry.tsx` 暴露三个函数，**各条路径各自 `try/catch`**，任一抛错不影响其它：

- `renderButton(input)`：专属 `button`（**自由节点**）→ 通用兜底（`defaultRingSpec()` + `ButtonLayout` + `Ring`）
  —— 模板抛错、或返回 `null` / `undefined` 时照样有得画，侧边栏按钮不会凭空消失；
- `buttonTitle(input)`：专属 `buttonHint` → `defaultRingSpec().title` 兜底；
- `renderBody(input)`：专属 `detail` → 声明式区块 → legacy 快照 —— 详情永远有内容。

三条路径都会把 `prefs: providerPrefs.scope(input.vendorId)` 放进上下文（按钮级与详情级拿到的是**同一个供应商的那一份**），
所以模板里读写的偏好天然按供应商隔离。

失败快照**不进专属模板**（模板只承诺「成功快照的渲染」）：拉取失败由弹层统一走结构化 `ErrorCard`
（结论 + 排查步骤 + 重试），任何 provider 一致；按钮侧则由各模板自己调 `failureRingSpec()` 画警示。

适配器**没给 `view` 也不会退化**：Host 用 `defaultView()` 从 `windows`/`billing`/`extra` 兜底推导；
只给 `view` 不给 `extra` 也不会让老客户端空白：`viewToExtra()` 反向补齐。
适配器还可声明 `defaultParams`（新增该类型时的表单初始值），如 commandcode 默认填 `$COMMAND_CODE_API_KEY`。

### 详情级通用零件（kit.tsx / `ProviderUIKit`）

（按钮级专用零件见上文「[按钮级零件](#按钮级零件provideruikit)」；下面这些两处都能用。）

| 零件           | 说明                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `RollingBar`   | **滚动刷新进度条**：label + 进度 + 占比 + 剩余时长（最常用，一行一个窗口）                                                                |
| `WindowGroup`  | 多条窗口成组，自动附「最高占用 / 最早重置」汇总行                                                                                         |
| `BalanceBlock` | 余额主数字块（币种/可用状态/赠送充值拆分/多币种/低余额告警）                                                                              |
| `MetricRows`   | 键值指标行集合                                                                                                                            |
| `MetricGrid`   | 两列指标网格（一格一项；可选 `mergePairs` 把相邻两项合成一格 —— 挤成 `$23.83 · 1.1 万` 会像乱码流，token-meter 的「账户与用量」就不用它） |
| `SplitBar`     | 分段占比条（含图例与百分比）；每段声明**语义色调** `tone`（`brand`/`ok`/`warn`/`bad`/`info`/`muted`），颜色由主题 token 决定              |
| `NoteLine`     | 提示条（info/warn/bad 三色）                                                                                                              |
| `MiniChart`    | 趋势折线（纯 SVG，零依赖）                                                                                                                |
| `Chips`        | 徽标组（计划/状态/来源等小标签）                                                                                                          |
| `SectionTitle` | 区块标题                                                                                                                                  |
| `ErrorCard`    | 失败卡（结构化结论 + 排查步骤 + 原始信息，见下节）                                                                                        |
| 工具           | `num` / `fmt` / `fmtLeft` / `curSymbol` / `remainOf` / `timeAgo` / `levelOf` / `tinyMoney`（极短金额）                                    |

### 供应商排序

浮层里的「切换供应商」列表按「**当前供应商 → 已启用 → 已禁用**」（同档保持条目 `config:` 顺序）排列；
禁用项沉底是刻意设计（多为留档备查，不该占视线），行上直接标「已禁用」。设置页的供应商列表用同一套排序，
两处观感一致。

## 失败提示（apiKey 失效 / Cookie 过期 / 订阅结束…）

拉取失败一律转成**结构化结论**再渲染，不再只丢一句原始报错。分类与文案由 Host 产出
（`src/host/errors.ts`），客户端只按 `kind` 上色渲染 —— 与「provider 两套模板」同一思路，客户端不认识任何供应商。

| kind      | 触发场景                                                               | 配色 | 卡片给什么                                                          |
| --------- | ---------------------------------------------------------------------- | ---- | ------------------------------------------------------------------- |
| `auth`    | API Key 无效/被撤销/复制不全                                           | 🔴   | 「密钥无效或已失效」+ 去平台重新生成；明文与 `$NAME` 引用分别给处置 |
| `session` | Cookie / Bearer 会话票据过期（含 HTTP 200 信封 `40003 invalid token`） | 🔴   | 「登录状态已过期」+ 重新登录抓取步骤                                |
| `plan`    | 订阅到期/被取消/扣款失败（`past_due`/`unpaid`）/计划不支持该接口       | 🔴   | 续订升级指引；周期已过但状态未翻转时提前预警                        |
| `balance` | 余额不足（402）                                                        | 🔴   | 充值指引 + 调低预警线建议                                           |
| `rate`    | 限流（429）                                                            | 🟡   | 等待重试 + 调大刷新间隔 / 禁用定时拉取                              |
| `network` | DNS / 代理 / 超时（fetch failed）                                      | 🟡   | 网络与代理排查                                                      |
| `parse`   | 接口改版（结构不符、字段缺失）                                         | 🟡   | 提示需插件适配 + 复制详情反馈                                       |
| `config`  | 凭据或参数没配全（含 `$NAME` 解析为空）                                | 🟡   | 回设置页补齐（标 * 字段提示）                                       |
| `server`  | 上游 5xx                                                               | 🟡   | 稍后重试                                                            |

卡片交互：

- **结论行** —— 图标 + 标题 + 一句话解释，点击展开/收起；
- **处置行** —— `→ 具体去哪改`，配「设置页」快捷入口；
- **重试策略** —— 可直接重试的（限流/网络/5xx）显示「↻ 重试」；需先改配置的（密钥/会话/订阅/余额）
  改显示「✓ 已处理，验证」，避免诱导用户盲目重试；
- **展开详情** —— 分类专属的**有序排查步骤** + 原始信息（等宽、可「复制详情」整段贴给维护者）+ 官方文档链接；
- **状态点同步着色** —— 要人管的失败（密钥/会话/订阅/余额）红点，临时性失败（限流/网络）黄点。

## 扩展新供应商（4 步，前 3 步即可用）

1. 复制模板：`cp src/host/providers/manual.ts src/host/providers/<新type>.ts`
   （抓包型复制 `opencode.ts`，API 型复制 `commandcode.ts` 更接近）；
2. 改适配器：填 `type/label/title/secretField/fields/defaultParams/icon/fetch`，用 `view.ts`
   的构造器产出 `view`（契约见 `src/host/providers/base.ts` 的 `ProviderAdapter` 接口）；
3. 注册一行：在 `src/host/providers/index.ts` 底部 `registerProvider()` 加一行，
   跑 `pnpm --filter @dshp/token-meter build`，重启 `dsh web` —— 设置页下拉与表单、
   侧边栏按钮、浮层详情自动出现新类型，`quota.ts` 与 client **零改动**（按钮走通用环 + 骨架、
   详情走声明式层，图标走通用兜底）；
4. （可选）想要专属按钮内容、指标与详情版式：`cp src/client/providers/ui/manual.tsx src/client/providers/ui/<新type>.tsx`，
   写 `button`（**自由节点**，常用 `K.ButtonLayout` / `K.Ring` / `K.WindowBars`）、`buttonHint`（悬停说明）
   与 `detail`（自由排版，通用零件从 `ProviderUIKit` 取 —— 显示控件 `PrefSwitch` / `PrefChoice` 就画在 detail 里，
   读写 `ctx.prefs`），
   在 `ui/index.ts` 加一行 `registerProviderTemplates(<新type>, ...)`。

## 代码结构

```
src/host/              Host 半（Node，tsup → lib/host.js 单文件 ESM）
  types.ts             共享类型（Vendor/快照/统计/配置/路由协议）
  http.ts              同源小工具（settingsNamespace/json/sameOrigin/readBody）
  config.ts            默认值/schema/消毒（不做迁移）
  secrets.ts           密钥引用解析（$NAME/{env:}/{cred:}/明文）
  errors.ts            失败分类（auth/session/plan/…）+ 处置指引 + ProviderError
  providers/           供应商适配器（每家一文件，注册即扩展）
    base.ts            契约 + ID/数字工具
    view.ts            provider 自描述视图（区块构造器/defaultView/viewToExtra）
    index.ts           注册表（扩展唯一入口 + 别名 + 脱敏/元数据）
    opencode.ts        官方 /go + /billing 双页合并
    deepseek.ts        统一入口（按密钥格式自动选路并互备，产出各自 view）
    deepseek-api.ts    官方 GET /user/balance（纯通道实现）
    deepseek-web.ts    网页 get_user_summary（纯通道实现）
    commandcode.ts     Command Code /alpha/{billing/credits,usage/summary,...}
    manual.ts          本地数字（rolling/payg）
  quota.ts             额度编排（快照/校验/合并 + 15 个同源路由）
  identity.ts          分享卡用的 git 身份路由（GET /identity）
  stats/               统计引擎
    fold.ts            会话折叠（终值覆盖采样、种子跳过、活动区间）
    online.ts          在线时长（区间合并/按日切分/阈值档位，纯函数）
    fsindex.ts         文件索引/指纹（同时认 session.v3.jsonl.zstd 与旧 v0 文件）
    async.ts           超时
    engine.ts          缓存引擎（指纹持久缓存 + 后台渐进扫描，零依赖垫片版）
    routes.ts          GET /stats（别名 /data）
  index.ts             apply 装配（patch→settings→引擎→路由）
src/client/            Client 半（浏览器，tsup → lib/client.js 单文件 CJS，loader 壳由构建预设拼出）
  types.ts             协议类型 + ClientContext/SlotsService 接缝
  api.ts               路由封装
  styles.module.css    CSS Module 样式（官方 token，类名不再带 tm- 前缀）
  components.tsx       Badge/Row/Select/Switch
  providers/          provider 两套模板（按钮级 + 详情级 → 声明式区块 → legacy 兜底）
    templates.ts      模板契约（ProviderTemplates / ButtonRenderCtx + ringSizeOf/windowOfMetric/balanceText/…）
    kit.tsx           通用可复用 UI 零件（ButtonLayout/Ring/WindowBars/ProviderIcon/shortWindowLabel/tinyMoney + 滚动刷新条/余额块/指标/图表/徽标/失败卡）
    sections.tsx      声明式区块渲染器（按 ProviderSection.kind 分发，复用 kit）
    registry.tsx      调度器：renderButton / buttonTitle / renderBody（各自兜底）
    ui/               每个 provider 一个 ProviderTemplates（button + buttonHint + detail，显示控件画在 detail 里）
      commandcode.tsx 指标：最紧窗口/5 小时/每周/每月/三条并排/剩余额度；详情=余额大数字 + 三条窗口 + 额度构成 + 两列网格（前 6 项、一格一项）
      deepseek.tsx    指标：总额度消耗/余额；详情=账户余额三行 + 有趋势才画图 + 来源徽标
      opencode.tsx    指标同 Goat；详情=计划·状态或「按量计费」一枚徽标 + 三窗口/余额分流
      manual.tsx      指标：账本用量/余额；详情=手填标注 + 账本明细
      index.ts        模板注册表（新增一行即接入）
  provider-icons.tsx   供应商图标（官方品牌路径 + 16×16/1.4 自绘线稿；iconOf/TYPE_ICON_FALLBACK/ProviderIcon）
  quota-prefs.ts       供应商偏好袋（浏览器本地 localStorage tm-quota-prefs；scope/subscribe/prune/clear）
  QuotaRing.tsx        通用环形进度（纯 SVG，把 QuotaRingSpec 画成环）
  QuotaTrayPanel.tsx   额度浮层（按钮上方弹出：卡片头「主图形 + 名字」→ 详情（含供应商自己的控件）→ 页脚错误/管理提示，纯展示 + 回调）
  ErrorBox.tsx         失败卡（结论/处置/排查步骤/复制详情，按 kind 上色）
  QuotaSection.tsx     额度 store（/ext/dshp-token-meter/* 客户端入口）+ 设置页配置零件（Badge/SecRow/FormField/PillSelect/VendorForm）+ 侧边栏按钮装配（buttonOf 自由节点 + 本地偏好订阅）
  StatsSection.tsx     独立图表组件（指标卡/趋势/热力/模型分布）+ StatsWidget + 今日卡
  OnlineSection.tsx    在线统计面板（阈值/区间切换 + 每日柱状图 + Top 日明细 + 口径说明卡）
  TokenMeterSection.tsx 精简设置页（开关+供应商管理）+ 用量统计面板（含「小组件」工具条）+ 统计浮层
  CenterView.tsx       中心区视图：一个 conversation.view tab + 左侧菜单（用量统计/在线统计/设置）
  widgets.tsx          通用小组件浮窗系统（拖拽/坐标持久化/portal）
  glyphs.tsx           数据语义图标（指标卡 / 图表标题 / 水印底纹）
  icons.tsx            导航图标（中心区左侧菜单 + 分享）
  SharePanel.tsx       分享卡板子（导出 PNG 用；内联 CSS 收集 + 板子光栅化）
  share-svg.ts         分享卡 SVG 文档组装（纯函数：内联 CSS 的 XML 转义，Node 可直跑）
  ShareShell.tsx       分享卡外壳（按钮 + 预览 + 下载/复制）
  index.tsx            只导出 inject / apply（sidebar.footer.action + settings.section order 27 + conversation.view order 40 + 浮窗）
lib/                   构建产物（已提交，DSH git 安装必需）
  host.js              后端 bundle（schemastery 内联）
  client.js            前端 bundle（含 __ModuleLoader__.load）
cordis.patch.yml       bundle 声明（id: dshp-token-meter）
```

## 常见问题

- **设置页没有「Token 总览」**：确认 profile 的 `dsh.profile.bundles` 含 `@dshp/token-meter`，旧双插件已卸载（否则会有三个 Token 节重复）；重启 `dsh web` 后硬刷新浏览器。
- **额度报“密钥引用 $X 为空”**：先写入凭据（设置页“存凭据”）或 `export X=...` 后重启 `dsh web`（环境变量由进程继承）。
- **额度显示明文密钥**：state 下发明文已脱敏为空，编辑时留空即保留原值；想持久化引用请点“存凭据”转 `$TMETER_*`。
- **额度浮层提示“密钥无效 / 登录状态已过期”**：详情位是一张结构化错误卡，展开后是一份针对该原因的排查步骤（会区分密钥失效还是会话票据过期，并给出对应的重新生成 / 重新登录路径）；改完配置点卡片上的「✓ 已处理，验证」即可立刻验证，不必等下一个自动刷新周期。
- **额度浮层提示“订阅已到期或计划不支持”**：到平台确认订阅状态与支付方式（含扣款失败 `past_due`、未支付 `unpaid`）；续订后等 1–2 分钟再刷新。若窗口数据还在但订阅已取消，详情位会以红条置顶提醒，不等到接口彻底失败。
- **opencode 报“登录失效或被风控”**：`cookie` 过期，重新从浏览器复制 `auth` 并更新（裸 token 会自动补 `auth=`，整段 Cookie 原样透传亦可）。
- **CommandCode 报“apiKey 未配置 / user\_ 开头”**：在 `commandcode.ai` → 工作室（Studio）→ API keys 创建 Key（`user_` 开头，与 CLI 同一把钥匙）；`export COMMAND_CODE_API_KEY=...` 后重启 `dsh web` 即自动生效（`params.apiKey` 可留空），也可直接粘贴明文或点「存凭据」转 `$NAME`。注意额度接口是 `/alpha/*`，网页端内部路径 `/internal/*` 用 API Key 一律 401。
- **DeepSeek 网页报“会话失效(401/403)”**：`token`（`ciYi` 开头 Bearer）过期，重新抓包粘贴；`sk-` 开头的请填 `apiKey` 栏（两套凭据不通用，实测 40003）。
- **统计一直“扫描中”**：会话多时后台分批扫描需时间（每批 8 个），`partial` 为渐进状态，轮询自动补全；单个会话 20s 超时防钉死，失败 3 次计入 `errors` 跳过。
- **额度数字长时间不动 / 想知道自动刷新到底是开还是关**：自动刷新**只看 `refreshSec`**（设置 → Token 总览 → 额度配置 → 「自动刷新」，选「关闭自动刷新」即写 `refreshSec: 0`）。浮层底部只在 `refreshSec: 0` 时出现「自动刷新已关闭」；配置里那个顶层 `enabled` 是旧侧栏额度卡开关留下的**历史字段**，Host 侧没有任何代码读它，写 `false` 不会关掉自动刷新。无论哪种状态，点浮层里的 ⟳ 都能立刻手动拉一次。
- **某个供应商不想让它定时拉取**：设置页「额度配置」里该供应商点「禁用」（亦可直接在该 vendor 下写 `enabled: false`）。禁用后它不再被 Host 主动定时拉取，浮层里仍显示上次快照并在切换行标「已禁用」；需要时照常点刷新手动查一次，再点「启用」即恢复。
- **按钮上想换一个数字怎么办**：点开额度浮层，用**该供应商自己卡片底部**的控件改 —— Goat / opencode 是「数值位显示余额」开关 + `5h / 1w / 1m` 单选（默认 `1m` 月额度；环一直画所选窗口的占用比例，勾了开关只是把右侧数值位换成余额），deepseek / manual 只有那个开关。偏好存在**浏览器本地**（`localStorage` 键 `tm-quota-prefs`）—— 换机器 / 换浏览器是另一份口味，也**不会**写进持久化配置、不走 Host 路由，所以点一下不会出现「连接 Host 失败」。**设置页不提供这类控件**。
- **统计数字对不上**：口径为终值覆盖（chunk 采样不重复计）+ fork 种子去重（含子代理）； reasoning 已含在 output，不重复加。
- **旧配置没过来**：本插件**不自动迁移**。请手工把 `dshp-inx-token-quota` / `dshp-inx-token-stats` 两个分节的内容并到 `dshp-token-meter`（旧的 `storages/token-quota.json` 也不会被读取，可自行删除）。

## 卸载

```sh
dsh plugin --profile web remove "@dshp/token-meter"
dsh web
```

`remove` 会自动从 `dsh.profile.bundles` 撤下挂载。设置页配置已落盘到 profile 条目 `dshp-token-meter` 的 `config:`，按需手动清理；指纹缓存（`token_stats` 域）随存储目录保留，不影响重装。

## 移植说明

> **Monorepo + TS 版**：本目录是 `deepseek-harness-plugins` monorepo 的标准子项目（`archive/token-meter`），由 `~/.dsh/plugins/dsh-token-quota`（JS，`@dshp-inx/token-quota` v1.0.1）与 `~/.dsh/plugins/dsh-token-stats`（JS，`@dshp-inx/token-stats` v1.1.3）合并等价 TS 重写移植。
>
> - Host：quota 侧 `lib/{index,config,secrets,providers/*}.js` → `src/host/{types,http,config,secrets,providers/*,quota,index}.ts`；stats 侧 `lib/{index,engine,fold,fsindex,async,http}.js` → `src/host/stats/{engine,fold,fsindex,async,routes}.ts`，tsup 打包为单文件 `lib/host.js`（ESM，schemastery 内联，运行时零依赖），导出 `{ name, inject, NS, ConfigSchema, apply }` 与规范一致。
> - Client：quota 侧手写 `client.js`（1238 行）+ stats 侧手写 `client.js`（1548 行）→ `src/client/`（`.tsx` + JSX，不再是 `React.createElement` 工厂），构建为单文件 `lib/client.js`（CJS + 构建预设拼的 `__ModuleLoader__.load` 壳；react / react/jsx-runtime / react-dom / primitives 运行时注入不打包）。官方组件的 props 类型直接来自 `@deepseek-ai/dsh-client-ui-primitives`（devDependency，见 [docs/client-basics.md](../../docs/client-basics.md)），样式走 CSS Module（构建期内联，见 [docs/build-and-deps.md](../../docs/build-and-deps.md)）。

> 构建：`pnpm --filter @dshp/token-meter build`（tsup）→ `lib/host.js` + `lib/client.js`；包入口 `lib/host.js`，`./client` → `lib/client.js`。`lib/` 已提交（DSH 从 git 直接安装，不跑 build，必须带构建产物）。

## 免责声明

- 本插件抓取 `opencode.ai` 页面结构，页面改版可能导致解析失败，需更新 `parseGoQuota` 正则；
- DeepSeek 余额走官方 `api.deepseek.com/user/balance` 或网页 `get_user_summary`（无公开文档，基于抓包推断），需有效凭据；
- 统计数据全部来自本机会话日志，无网络上报、无独立持久化；
- 本插件与 OpenAI / DeepSeek / Opencode 官方无隶属关系。
