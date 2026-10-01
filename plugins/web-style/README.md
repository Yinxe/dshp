# @dshp/web-style

DeepSeek Harness（DSH）**Web 外观定制套件**：**8 套主题画廊**（每套 133 个 `--dsw-*` token 全量映射）+ **3 个可交互背景效果**（官网同款字符点阵字标 / 纯 CSS 极光辉光 / 程序化流场）+ **设置页一键切换并持久化**；另有 **壁纸取色（Material You / MD3）** 一键生成整套动态配色（可导出 MD3 令牌）与 **全局圆角** 三档。

> 设计原则：**与官方外观系统同轨，不做对抗**。不注册自定义主题 id，而是把每套主题作为官方 `overrideTokens` **覆盖层**叠加在官方亮/暗之上——主题自身 scheme 分支填主题值，对侧分支填官方原样值，因此官方「外观」行（浅色/深色/跟随系统）永远合法可用，「回到官方」= 撤销覆盖层。主题 token 单源 `src/host/themes/`，由 Host 经同源路由下发，client 只存卡片 meta；运行时零依赖。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```sh
# 1. 克隆 monorepo（lib/ 构建产物已提交，clone 下来就能用，无需 build）
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 2. 本地安装到 profile（路径按你执行命令时的 cwd 解析）
dsh plugin --profile web add ./plugins/web-style

# 3. 重启生效
dsh web
```

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](../../compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。

`dsh plugin` 会把包写进 profile 的 `dsh.profile.bundles` —— **无需手动改配置文件**。

> **从旧包 `@dshp-inx/custom-ui` 换过来**：先移除旧挂载再装新包，否则两个插件会注册同一个设置节（`WEB_DUPLICATE_PROVIDER`）：
>
> ```sh
> dsh plugin --profile web remove "@dshp-inx/custom-ui"   # 旧包（dsh-custom-ui）
> dsh plugin --profile web add ./plugins/web-style
> dsh web
> ```
>
> 配置**不自动迁移**：本插件只读 profile 条目 `dshp-web-style` 的 `config:`。要把旧包的选择带过来，手工把 `dshp-inx-custom-ui` 段改名即可（字段同名，缩进块原样搬运）：
>
> ```yaml
> # 改名前（旧包，不再被读取）        改之后（本插件读取）
> dshp-inx-custom-ui:               dshp-web-style:
>   themeId: "supabase-dark"          themeId: "supabase-dark"
> ```

**改源码后**：`src/host` 或 `src/client` 改完跑 `pnpm --filter @dshp/web-style build` 重新打出 `lib/host.js + lib/client.js`，然后 `dsh web` 重启（client 半强刷页面即可）。

**验证**：设置 → 外观定制 能看到主题画廊；点任意卡片应立即换色并显示「正在使用」。

**一键 AI 安装**：把下面这段发给你的 DSH AI 即可：

```text
帮我安装 Web 外观定制插件（monorepo Yinxe/deepseek-harness-plugins，子目录 plugins/web-style，包名 @dshp/web-style）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web remove "@dshp-inx/custom-ui"（旧包 dsh-custom-ui，装着才需要；旧 settings 段请手工改名为 dshp-web-style）
3. dsh plugin --profile web add ./plugins/web-style
4. dsh web 重启，确认无报错，设置页「外观定制」出现主题画廊即成功
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

latest 滚动版（跟随 main 最新构建；滚动更新 = 重跑同一条 add 命令）：

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-web-style-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 `compat.json` 记录的兼容 tag，到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-web-style-<tag>.tgz`：

```bash
# 以 v0.1.5-rc.1 为例
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-web-style-v0.1.5-rc.1.tgz

dsh web   # 重启生效
```

## 更新

### 三种安装方式对应的更新方式

| 安装方式             | 更新命令                                                    | 说明                                                      |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| 方式一 clone（推荐） | 仓库内 `git pull` + `dsh web`                               | 最快；未改 src 免 build；旧版 DSH 用 `git checkout <tag>` |
| 方式二 Release       | 重跑同一条 `add` 命令 + `dsh web`                           | URL 直装对 `update` 免疫；两个 pnpm 坑见根 README         |
| 方式三 git 依赖      | `dsh plugin --profile web update @dshp/\<pkg\>` + `dsh web` | 一条命令；git 解析约 35s/插件（实测）                     |

## 功能

| 部分                                          | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host（`src/host/` → `lib/host.js`）**       | 用官方 `ctx.settings` + `schemastery` 持久化到 profile 条目 `dshp-web-style` 的 `config:`（0.1.7 条目存储：`themeId` / `backgroundId` / `photoPalette` / `radius.global`）；主题目录全量 token 下发（单源 `src/host/themes/`，白名单从目录动态派生 + 虚拟 `photo:custom`）；配置只认 `dshp-web-style`（不读历史 key、不迁移）；退役字段 `wallpaper.*` / `glass.*` 仅不透明透传保留。                                                                                                                                                                                                |
| **Client（`src/client/` → `lib/client.js`）** | 「设置 → 外观定制」一张页面：顶部背景效果四选一 + 圆角三档 + 回到官方；中部壁纸取色（上传 → seed → 5 组 ref 调色板 × 亮/暗角色预览 → 启用/复制 MD3/清除）；底部主题列表（当前态条 + 关键词搜索 + 亮/暗过滤 + 自适应 grid 色卡，点击即切）。启动时读 Host 快照恢复覆盖层、背景效果与圆角；`theme/change` 事件驱动「使用中」徽标与壁纸渐变实时跟随，canvas 类背景同时**重挂一次**（配色是 mount 时烘进 JS 的，不重挂官方亮/暗一切就陈旧）。背景效果登记在 `background.ts` 的 `BACKGROUNDS` 表里，**与主题正交**（见[背景效果层](#背景效果层)）。UI 全部使用官方 `dsw-alias-*` token。 |
| **同源路由**                                  | `GET /ext/dshp-web-style/state`（偏好快照）、`GET /ext/dshp-web-style/themes`（目录全量 token）、`POST /ext/dshp-web-style/theme`（切主题）、`POST /ext/dshp-web-style/config`（背景效果 / 圆角 / 取色补丁），全部先过同源校验（`Origin` 与 `Host` 一致或缺失才放行），`no-store`，body 上限 1MB。                                                                                                                                                                                                                                                                                  |
| **工具**                                      | 无（纯 UI 插件，不给模型注册任何工具）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## 主题清单

label / desc / swatch 以 `src/host/themes/*.ts` 的 `meta` 为准（token 同源此处，client 只存 meta）。

| 主题 id                  | 模式 | 风格                                         | 来源        |
| ------------------------ | ---- | -------------------------------------------- | ----------- |
| `claude-parchment-light` | 纯亮 | 羊皮纸 #f5f4ed + 赤陶 #c96442，ring 型深度   | claude      |
| `xiaohongshu-light`      | 纯亮 | 米灰 #f5f5f5 + 种草红 #ff2442                | xiaohongshu |
| `levels-light`           | 纯亮 | 米纸 #fbf7ef + 代谢绿 #2f8f46                | levels      |
| `arc-light`              | 纯亮 | 蜜桃 #fdf3ec + 珊瑚 #ef4a4a                  | arc         |
| `sakura-light`           | 纯亮 | 樱白 #fff9fa + 樱粉 #e75480                  | 原创        |
| `luxury-dark`            | 纯暗 | 曜石 #080706 + 鎏金 #c6a15b                  | luxury      |
| `supabase-dark`          | 纯暗 | 墨黑 #171717 + 翡翠绿 #3ecf8e                | supabase    |
| `harness-office`         | 纯暗 | 曜黑 #0a0a0a + 官网蓝 #6799fe · 默认点阵字标 | deepseek    |

`harness-office` 是目录里唯一带**默认背景效果**的主题（点阵字标）。背景效果与主题**正交**：
任意主题都能在设置页单独挂 `aurora` / `flow`，`harness-office` 也可以选「不挂」——见[背景效果层](#背景效果层)。

另有一套虚拟主题 `photo:custom`：壁纸取色（MD3 运行时生成，不在目录内，但属于合法持久化值，Host 白名单放行）。

每套 134 个 `--dsw-*` token 全量映射：背景 / 边框 / 品牌 / 按钮 / 交互态 / 文字 / 语义色 /
diff 视图 / 文档预览 / Markdown / 滚动条 / 侧栏 / 气泡 / 浮层 / 阴影 / 字体栈。
（diff 与文档预览三组 11 个键来自 0.1.7-rc.1；toast 文字色 1 个键来自 0.2.0-rc.2。
官方其余新增键有意不覆盖——多数是 `var(--dsw-alias-*)` 别名，会继承本主题已覆盖的值自动生效。
派生规则与逐条取舍见 `src/host/themes/shared.ts` 头注释。）

`scripts/check-themes.mjs` 强制**全部主题覆盖同一套 token 名**（多写少写都报错），
并校验 `official.ts` 与 DSH 实际值一致 —— 后者是覆盖层的「对侧 scheme 无操作原值」，
漂移会导致选浅色主题再切深色时把 DSH 的旧配色涂回去。基线由
`node scripts/sync-official.mjs` 从已安装的 DSH 重新生成（快照落在
`scripts/dsw-alias-baseline.json`，CI 离线比对）。

### 侧栏选中行跟随品牌色

`--dsw-specific-sidebar-nav-item-active` 是侧栏选中行的胶囊底（DSH 的 `.navCell.active`，
画在 `--dsw-specific-sidebar-fill` 之上）。约定值固化为：

```
rgba(<该主题 --dsw-alias-brand-primary 的 RGB>, 0.22)
```

原来 33 套里 21 套与 `nav-item-hover` 的感知色差 ΔE < 5（其中 8 套**完全相同**、
3 套与侧栏底色几乎无差），选中态基本看不出来。改成品牌色叠色后：

| 指标                         |    改前 |                      改后 |
| ---------------------------- | ------: | ------------------------: |
| ΔE(active, hover) < 5 的主题 | 21 / 33 |                **0 / 33** |
| active 与 hover 完全相同     |  8 / 33 |                **0 / 33** |
| 最小 ΔE(active, hover)       |     0.0 |                   **6.6** |
| 最小 ΔE(active, 侧栏底色)    |     0.0 |                  **11.3** |
| 最小 `label-primary` 对比度  |    8.94 | **8.20**（仍远超 AA 4.5） |

`check-themes.mjs` 固定住这条派生关系；壁纸取色主题（`src/client/md3.ts`）同样走
`withAlpha(brand, 0.22)`。**改主题品牌色后必须同步这个值**，否则 `pnpm test` 会失败。

## 背景效果层

配色之外的一层**可交互背景**。三个效果登记在 `src/client/background.ts` 的 `BACKGROUNDS` 表里，
设置页顶部可单选，持久化字段是 `backgroundId`：

| 效果 id        | `kind` | 铺法                      | 代价                       |
| -------------- | ------ | ------------------------- | -------------------------- |
| `harness-dots` | canvas | 顶部字标带（0.56 视口高） | 逐点采样 + 30fps 逐帧绘制  |
| `aurora`       | dom    | 铺满视口                  | **零**（不建画布、不起帧） |
| `flow`         | canvas | 铺满视口                  | 720 游子 × 每帧约 3 次三角 |

`kind` 就是能力位：`dom` 类效果**根本不创建 canvas、不绑 mousemove/resize、不起 rAF**，
零帧成本是结构性的而不是优化出来的。

**为什么动效不进 token 层**：token 契约要求每套主题覆盖**同一批** 133 个键（`check-themes.mjs` 拿
`THEME_CATALOG[0]` 比对），给单套主题加「动效开关」会直接破坏契约——`src/client/themes.ts` 的画廊
meta 也被同一脚本用严格正则咬着字段集合与顺序，加不了字段。所以配色层仍由 Host 全量下发，
背景层完全活在客户端：`backgroundId` 是空串时按**主题 id 的默认映射** `THEME_DEFAULT_EFFECT`
（当前只有 `harness-office → harness-dots`）解析，显式选过就一直跟着选——**切主题不会重置背景，
选背景也不会碰 token 覆盖层**。

**挂载位置**：`body` 末尾一个 `position:fixed; z-index:0; pointer-events:none` 的舞台，`#root` 抬到
`z-index:1`。但光这样**什么都看不见**——DSH 从 `#root` 往下还有若干级**实心壳面**挡在舞台上面。
所以挂载时按 computed style 认壳面，**只看几何、两类**：

| 档      | 判据                                                                   | 抓的是谁                                              |
| ------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `shell` | 宽、高各 ≥ 40% 视口                                                    | 外层 frame、主视图 root（都吃 `--dsw-alias-bg-base`） |
| `rail`  | 贴左缘（`left ≤ 16px`）+ 高 ≥ 40% 视口 + 宽 ≤ `max(380px, 30% 视口宽)` | 侧边栏那一列，展开与收起成 56px 轨道都命中            |

命中就把它的背景压到 `SHELL_KEEP = 0.6`：**只改 alpha、颜色取该元素自己的计算值**，不引入任何新色，
官方亮/暗切换时它自己跟着走；**比 0.6 更实心才夹，本来就比它透的（主题把侧栏画成
`rgba(...,0.55)`）不加浓**。侧栏单独立一档是因为它够不着 `shell` 的宽度门槛（240 ÷ 1500 ≈ 16%），
漏掉它就是「主区透了、左侧一整条仍然实心」。气泡 / 卡片 / 代码块这类小面**刻意不动**（那些是要读字的实心面）。
两级叠乘后舞台只剩 `0.4 × 0.4 ≈ 16%` 通透度——这个数字是下面整套标定的前提。
`MutationObserver` 只观察 `childList`，跟着 React 重建补压，自己写的 inline 样式不会回流自激。
颜色全部从当前 token 现读（`--dsw-alias-brand-primary` 经 `color-mix` 分档、字体栈做字标），不写死色值
——这正是背景能与主题正交的前提。

**职责边界：预算在舞台、铺法在效果**。通透度是舞台属性（正文对比度是三个效果共享的代价，
不能让单个效果擅自调深），节拍/30fps 上限/dpr 上限/停帧/去抖/压壳/收回也全在舞台，
效果只实现 `mount` + 可选 `draw`，只管自己的几何与配色。**由此得出一条硬约束**：
画布**永远不许铺满底色**——舞台不清屏是给 `flow` 留拖尾的自由度，谁铺了底色谁就把别人的层盖住了。

### `harness-dots`：官网点阵的移植与标定

官网首屏那块**跟随鼠标的点阵背景**（`HeroDigitile`：React Three Fiber + 自定义 GLSL 的 instanced 点阵），
本插件移植成 `src/client/background-dots.ts`，逐粒子数学逐段照抄，但降级为 **Canvas 2D**——仓库红线是
运行时零依赖，不能为背景引入 three/r3f。四处等价改写：instanced Box → `fillRect` +
`globalCompositeOperation='lighter'`（= 站点 `AdditiveBlending`）、透视投影 → 相机距离 18 的一阶除法、
组旋转只留 x/y 微量视差（去掉 `rotation.z` 自转）、丢弃滚动散开（应用内自行滚动，`window.scrollY` 没有语义）。

**亮度预算怎么花**：16% 通透度意味着站点原样的点阵在这里几乎读不出来，所以这层的每一档都按
「背景层」重标：极光**收进顶部字标带**（铺满视口会把整页底色抬起来，实测正文区抬 11 级、
反差点阵被自己抹平）；画布遮罩在字标高度内保持全通（线性淡出会把整个词标吃掉一半）；
点宽从站点的 1/3 格放到 0.7 格、逐点随机缩放从 0.5..1.5 收到 0.85..1.15（字标只有 9 行点，
疏密差一大笔画就断成麻点）；光照只乘进颜色一次（原先 alpha 里还乘了一遍 `min(vLight,1)`，
等于双重暗档衰减，左半行直接掉出可读区间）；光源从站点打立体块的右上斜光收到中上并抬 z
放缓衰减。合起来舞台出光量约 **5.4×**，而无气泡正文的对比度只掉 5%（16.2:1 → 15.4:1，
压在点阵上的那一段 5.34:1 → 5.30:1）。嫌弱先调 `STAGE_GAIN`（当前 1.4，已接近饱和），
嫌整层太透再调 `SHELL_KEEP`——后者同时决定正文还剩多少对比度，别越过 `0.55`。
「极光收进字标带」和画布遮罩是**这个效果自己的** `<style>`：它们是同一条可读性论证的两半，
不住在舞台里。独立那个 `aurora` 铺满视口，因为它底下没有 competing 的点阵，抬 11 级那条不适用。

与站点的有意偏差（都写在各常量的注释里）：网格 60 → **90**（源是文字不是立体块，
一行七个字母要落在「字高约 9 行点、笔画约 3 行点」的 LED 屏比例上才读得出字）、
点宽 1/3 格 → 0.7 格、逐点缩放 0.5..1.5 → 0.85..1.15、光照从右上斜射改成中上并放缓衰减
（斜射光会把字标左半压暗）、`uLight` 只进颜色不进 alpha、极光收进字标带、
鼠标 `distort` 5 → 1.1 rad 与 `strength` 0.8 → 0.5（实心图形打散后还是那团，字标会被整个甩飞）、
光照暗端 `shadeMin` 0.28 → 0.7（背景层要留得住字形）。

### `aurora`：零帧成本那一档

`kind: 'dom'`——三层 `radial-gradient` blob + `@keyframes` 漂移 + `mix-blend-mode: screen`，
铺满视口，颜色从 `--dsw-alias-brand-primary` 经 `color-mix` 分三档现读。不建画布、不绑监听、
不起 rAF，所以它是「想要背景但一点帧都不想花」的那一档；代价转给了合成器。
`prefers-reduced-motion` 下动画名置空，退化成三层静态辉光。

### `flow`：720 条流场游子，不是粒子系统

速度场是解析正弦叠加（curl-of-sines：`sin(x·k₁+t·s₁) + cos(y·k₂−t·s₂) + 0.5·sin((x+y)·k₃+t·s₃)`，
每子每帧约 3 次三角），积分后**环面取模回绕**：无生灭、无对象池、无数组增删 ⇒ 点数逐帧恒定、无 GC 抖动。
鼠标是每子 O(1) 的切向涡流，不做邻域查询。拖尾不 `clearRect`，帧首用 `destination-out` 洗掉已有像素
`FADE = 0.042`（≈ 0.8 s 余晖）的 **alpha**——只降透明度、不铺颜色，画布该透明的地方继续透明
（铺一层实色等于在两级壳下面再加第三张壳，见上面那条硬约束）。按 6 个颜色分桶各发一条批量
`stroke`，位置存 `Float32Array` 双缓冲（当前 + 上一帧）。

刻意不做真粒子系统（变点数 spawn/kill、Verlet、斥力）：点数波动 = 成本尖峰；需要历史才长成样子，
`reduced` 单帧会画出一坨出生点、得专门写暖机；生灭簿记不产生观感。真粒子的收益（涌现）在背景层
用途上是负资产。而流场是确定性函数——场对 `t` 统计稳态 + 回绕有界 ⇒ 任意单帧都是代表帧。

**代价与可控性**（全在舞台，效果改不了）：30fps 上限（站点同款节拍修正）、dpr 上限 1.5、
页面隐藏即停帧、resize 去抖只重算映射；`prefers-reduced-motion: reduce` 下 canvas 类只画一帧
装配完成的静态成品，不挂监听、不起 rAF，`dom` 类把动画名置空。

**可逆性**：`mountBackground()` 内部收回上一层、再挂新的一层，每个效果的 disposer 由舞台按
**严格反序**调用：停帧解绑 → 效果自己的收回 → 还原壳面 → 摘画布/舞台/自注入样式 → 还原 `#root`。
`#root` 与每一块壳面的 inline 背景**逐项还原成首次记录的原值**（首次记录、重复扫描不覆盖，
所以第二次之后不会把改过的值当成原值存下来）。切背景效果、切主题、点「回到官方」、插件停止，
四条路径都走同一个 disposer。

**跟 DSH 的耦合面（客户端更新后会不会失效）**：这层只认三样东西——挂载点 id `#root`、
两个 token 名（`--dsw-alias-brand-primary` 取色、`--dsw-font-base-16-font-family` 取字标字体栈）、
以及「alias token 会落到某块实心壳上」这个事实。**刻意不认** CSS Module 的哈希类名
（`pI_x6G_frame` 这类每版都变），壳面识别只吃 computed style 的 `backgroundColor` + 视口占比（侧栏那一档再加
「贴左缘 + 一条窄列」的几何判据），探针从命中点向上走到 `#root` 为止，中间隔几级、顺序怎么变都不影响。所以：

- DSH 换构建 / 改类名 / 加一层壳 → 照常生效（识别与层数无关）。
- 改这两个 token 名 → 不报错，只是失色：品牌色读不到就退成中性近白端点，字体栈读不到就退成
  `system-ui`，字标仍在。
- 把壳面从 `background-color` 换成 `background-image` / `backdrop-filter` → 识别不到，症状是
  「极光和点阵整个不见了」。自查两条命令：`!!document.getElementById('dshp-ws-ambient')` 与
  那两级壳面的 `backgroundColor`；前者 true 后者实心，就是这里要补探针或 `SHELL_PROBES`。
- 官方 token 键集变了 → 不会静默错位：`scripts/check-themes.mjs` 拿 DSH 快照比对 133 键契约，
  `scripts/sync-official.mjs` 负责把官方基线同步进来，红就是红。
- **注意安装形态**：web profile 的 `node_modules/@dshp/web-style` 是指向仓库的 symlink（改完刷新即生效），
  桌面端 profile 里是**拷贝**安装的一份。仓库更新后桌面端不会自己跟上，得重装该 profile 的插件依赖。

**衡量口径**：`check-themes.mjs` 除 token 契约外还咬一条——Host 的 `BACKGROUND_IDS` 白名单里每个 id
都必须出现在 `lib/client.js` 产物里（登记表漏 import、或 id 在两端拼写不一致，都会红）。

## 配置项

配置全部落在 profile 条目 `dshp-web-style` 的 `config:`（0.1.7 契约：Host 导出条目 `Config` + volatile 字段，设置页经 `settings.update` 写入即热更新；手工编辑条目 config 重启生效）：

```yaml
dshp-web-style:
  themeId: supabase-dark # 空串 = 完全跟随官方「外观」（system/light/dark）
  backgroundId: flow # 空串 = 跟随主题默认；harness-dots / aurora / flow
  radius:
    global: 0 # -1 跟随主题 / 0 全锐角 / 1–24 统一圆角（px）
  # 壁纸取色：未取色为 null；accent 恒等于 seed（旧数据的 seed 字段也认）
  photoPalette:
    accent: '#8b5cf6'
    companionA: '#5cf6c8'
    companionB: '#4a3a8b'
```

- **切换主题**只需改 `themeId`（白名单外的 id 一律视为空串 = 回官方默认）。
- **背景效果**`backgroundId` 与 `themeId` 各存各的：改主题不会动它，改它不会动主题。
  白名单外的值同样消毒成空串 = 跟随主题默认（`harness-office` → 点阵，其余 → 无）。
- **删除持久化**：把 `themeId` 置空串即完全跟随官方；再清 `photoPalette` 即丢掉取色数据。
- `wallpaper.*` / `glass.*` 是已退役特性的历史字段，插件只原样透传、不再读写，可手动删除。

## 代码结构

```
web-style/
├── package.json               # @dshp/web-style，dsh.bundle.patch + dsh.client.platform=web
├── tsup.config.ts             # host ESM + client CJS 双 bundle（loader 壳由 shared/tsup.preset.ts 拼出；运行时零依赖）
├── cordis.patch.yml           # bundle 挂载行（id: dshp-web-style）
├── src/
│   ├── host/                  # Node 半：settings 持久化 + 同源路由 + 主题目录
│   │   ├── index.ts           #   apply 装配：Config 导出 → configure → 4 条路由
│   │   ├── types.ts           #   StyleConfig / PhotoPalette / RadiusConfig / 补丁类型
│   │   ├── config.ts          #   NS / DEFAULT_CONFIG / ConfigSchema / sanitize*（不做迁移）
│   │   ├── http.ts            #   sameOrigin / json / readBody / settingsNamespace
│   │   └── themes/            #   主题 token 单源
│   │       ├── index.ts       #     THEME_CATALOG / THEME_IDS（expand）
│   │       ├── shared.ts      #     字体栈 / fillFontTokens / FLAT_SHADOWS / 类型
│   │       └── <8 个主题模块>   #     每文件导出 { dark?, light?, meta }
│   └── client/                # 浏览器半：设置节 UI + 覆盖层 + 背景效果层
│       ├── index.tsx          #   只导出 inject / apply（loader 壳由构建预设拼出）+ apply 装配
│       ├── GallerySection.tsx #   外观定制页（背景效果 / 圆角 / 壁纸取色 / 画廊，普通函数组件 + JSX）
│       ├── apply-theme.ts     #   覆盖层：buildPair / applyThemeChoice / applyBackgroundChoice / 启动恢复 / 卸载
│       ├── background.ts      #   背景效果舞台 + 登记表 BACKGROUNDS（预算/收回在这层）
│       ├── background-dots.ts #   harness-dots：官网同款字符点阵字标（canvas）
│       ├── background-aurora.ts # 极光层工厂 + aurora 效果本体（dom，零帧成本）
│       ├── background-flow.ts #   flow：720 条流场游子（canvas）
│       ├── md3.ts             #   Material You 引擎（seed → 调色板 → sys → --dsw-*，含 MD3 导出）
│       ├── official.ts        #   官方 alias token 原值（对侧「无操作覆盖」用）
│       ├── api.ts             #   /ext/dshp-web-style/* fetch 封装（themes 缓存一次）
│       ├── themes.ts          #   画廊 meta（8 条，与 Host 目录逐项一致）
│       ├── state.ts           #   模块级会话状态
│       ├── radius.ts          #   全局圆角三档（语义属性选择器）
│       ├── clipboard.ts       #   复制 MD3（Clipboard API + execCommand 回落）
│       ├── types.ts           #   路由协议 / 服务类型
│       └── styles.module.css  #   画廊 CSS（CSS Modules，只走 --dsw-* token）
├── scripts/check-themes.mjs   # 目录 / client meta / 构建产物一致性校验（pnpm test 内跑）
└── lib/                       # 构建产物（已提交）：host.js + client.js
```

### 新增一套主题（三步）

1. `src/host/themes/` 加一个模块（照抄现有文件：`export const dark/light = fillFontTokens({...}, FONT)` + `export const meta: ThemeMetaMap = {...}`）；
2. `src/host/themes/index.ts` 加 `import * as x` + `...expand(x)`（顺序 = 画廊展示顺序）；
3. `src/client/themes.ts` 加一条 meta（id / colorScheme / label / desc / swatch）。

然后 `pnpm --filter @dshp/web-style build && pnpm --filter @dshp/web-style test`：`scripts/check-themes.mjs` 会校验两处 meta 逐项一致、id 唯一、client bundle 未内联 token，不一致直接非零退出。

> 新主题**不需要**动背景那套：`backgroundId` 与主题正交，不写进 `src/client/themes.ts` 的 meta
> （那里字段集合被 `check-themes.mjs` 用严格正则咬着，加字段直接 FAIL）。只有当一套主题确实该
> **默认**带某个效果时，才在 `background.ts` 的 `THEME_DEFAULT_EFFECT` 里加一条 `themeId → effectId`。
> 加效果本身是四步：写一个 `background-<id>.ts` 实现 `BackgroundEffect` → `BACKGROUNDS` 注册 →
> `src/host/config.ts` 的 `BACKGROUND_IDS` 加同名白名单 → `build` + `pnpm test`（脚本会两端比对 id）。

## 常见问题

- **与其他主题类插件并存报 `WEB_DUPLICATE_PROVIDER`**：动态插件版（会话内 `cordis_define`）与静态挂载版、或旧包 `@dshp-inx/custom-ui` 与新包同时挂载都会撞。只保留一个：`cordis_undefine` 动态版，或 `dsh plugin --profile web remove` 旧包。
- **切换后重启回退到官方配色**：说明 `POST /theme` 保存失败（Host 未起来 / settings 服务不可用）。页面顶部会给出红字提示；检查 profile 条目 `dshp-web-style` 段落、以及 `dsh web` 日志里有无 `[dshp-web-style]` 报错。
- **壁纸取色重启后丢失**：取色数据只存 seed（`photoPalette.accent`）。配色生效但保存失败时会提示「重启后会丢失取色」。
- **点主题没换色**：静态主题 token 需从 Host `GET /themes` 拉取；Host 半没起来时控制台会打印「主题 token 下发失败」。
- **圆角没生效**：圆角只改「语义面」选择器（`[class*="_card"]` / `_panel` / `_bubble` + 通用控件），圆/胶囊类元素刻意保留。
- **背景看不到**：先在 Console 里确认两件事 —— `!!document.getElementById('dshp-ws-ambient')`（舞台在不在）和 `getComputedStyle(document.querySelector('#root > div div')).backgroundColor` 是不是带 alpha 的（壳面有没有被压薄）。选 `harness-office` 走「跟随主题」时它默认是点阵，其它主题默认是**无**——不是坏了，去设置页顶部显式选一个效果。另外 `harness-office` 是纯暗主题，官方「外观」行设成**浅色**时覆盖层走的是对侧官方原值，浅底上自然没有对比——设成深色即可。系统开了 `prefers-reduced-motion` 时 canvas 类效果是**一张静态成品图**（不动、不跟鼠标），这是刻意的。
- **主区透了、左侧边栏还是一整条实心**：同一套压壳机制，侧栏走的是 `rail` 档（贴左缘 + 纵向铺满 + 窄列），收起成 56px 轨道也算。它只按几何认列，所以把侧栏拖到 380px 以上（且不到视口 40% 宽）就会被判成「不是侧栏」——那是刻意留的误伤护栏。
- **换了主题背景就没了**：不会——`backgroundId` 与 `themeId` 各存各的（条目 `config:` 里两个平级字段）。真丢了的话先确认选的是「跟随主题」还是某个具体效果：前者在切到无默认映射的主题时**本来就该消失**，后者会一路跟着。
- **舞台在、极光是透的，但字标糊成一团麻点**：几乎一定是 `GRID` 与 `DOT_RATIO` 被改过——这两个常数要成对调（点宽 ÷ 格宽 ≈ 0.7 才连得成笔画），单独加密网格会把笔画打断。整行偏暗改 `STAGE_GAIN`。
- **觉得背景碍事 / 想省电**：设置页顶部选「跟随主题」（非 harness-office 主题即无背景）或直接把效果换掉，整层会精确收回（舞台节点、自注入样式、监听、rAF 全部撤销，`#root` 与被压薄的壳面 inline 背景逐项还原）。插件停止同样走这条路径。想零帧成本就选 `aurora`（`kind: 'dom'`，结构上不建画布不起循环）。强弱有两个旋钮：`SHELL_KEEP`（整层通透度，同时决定正文对比度，别越过 `0.55`）与 `STAGE_GAIN`（只调点阵亮度）。

## 卸载

```sh
dsh plugin --profile web remove "@dshp/web-style"
dsh web
```

再删掉 profile 条目`dshp-web-style` 段（可选），并把官方「外观」行设回你想要的状态。插件不写任何自有文件、不装运行时依赖，卸载即干净。

## 移植说明

本插件由独立仓库插件 **`@dshp-inx/custom-ui`（`~/.dsh/plugins/dsh-custom-ui`，纯 JS）** 移植而来，按本 monorepo 规范重写为 TypeScript ESM，并更名为 **`@dshp/web-style`**。

| 原 JS                                          | 新 TS                                                      | 说明                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `lib/index.js`（269 行）                       | `src/host/index.ts` + `types.ts` + `config.ts` + `http.ts` | Host 逻辑逐行等价；配置只认 `dshp-web-style`，未保留旧命名空间迁移                                                          |
| `lib/themes/index.js`                          | `src/host/themes/index.ts` + `shared.ts`                   | `expand()` / 顺序 / meta 全等，补类型（`ThemeModule` / `ThemeCatalogEntry`）                                                |
| `lib/themes/<name>.js` × 21                    | `src/host/themes/<name>.ts` × 21                           | 脚本机械转换，token 值逐字未改；补 `ThemeMetaMap` 类型                                                                      |
| `lib/themes/photo.js`（382 行，Host 从未引用） | `src/client/md3.ts`                                        | **双份手工同步的 MD3 引擎合并为一份**：Host 半不再打包 photo 引擎（原来就是死代码），client 侧以 `client.js` 的实时实现为准 |
| `client.js`（997 行）                          | `src/client/*.ts(x)` + `styles.module.css`                 | 画廊 / 覆盖层 / 圆角 / MD3 / 官方原值按层拆分，行为逐行对齐；`.tsx` + JSX，样式是 CSS Modules                               |
| `scripts/check-themes.mjs`                     | 同名脚本                                                   | 校验点升级：目录自洽 + client meta 逐项一致 + **构建产物**（id 存在、token 未内联、Host 路由与白名单齐全）                  |

**有意的差异**（其余为纯机械等价）：

1. **命名空间**：`dshp-inx-custom-ui` → `dshp-web-style`（settings NS / 路由前缀 / 设置节 id / 覆盖层 source 同名）；**不写迁移代码**，旧段由用户手工改名（本插件首个版本，无历史用户）。
2. **内部 token 改名**：`--dshp-cu-body-gradient` → `--dshp-ws-body-gradient`（仅插件内部使用，不影响用户配置）。
3. **MD3 导出注释**：`exported by dshp-inx-custom-ui` → `exported by dshp-web-style`。
4. **删除死代码**：client 画廊 meta 里从未使用的 `group` 字段、CSS 里从未引用的 `.tg-photoSwatch`、`findTheme()` 中 photo 分支（调用点早已被 `PHOTO_ID` 分支拦掉）。
5. **lint 修正**：`img.onload/onerror` → `addEventListener`；`new Array(12).fill(null).map()` → `Array.from({length:12})`；neobrutalism 未使用的 `FLAT_SHADOWS` import 移除。行为不变。
6. **client 形态对齐仓库新规范**（机制重构，行为逐字节不变）：`index.ts` 的手写 loader 壳删除，改由 `shared/tsup.preset.ts` 的 banner / footer 拼出；`GallerySection.ts` 的 `React.createElement` → `GallerySection.tsx` + JSX（`createGallery(React, P)` 工厂取消，改为普通函数组件）；`styles.ts` 的 CSS 字符串 + 手插 `<style>` → `styles.module.css`（构建期内联，类名前缀 `tg-` 去掉，局部名改 camelCase）。

**等价性验证**（移植时执行，脚本已删）：以原 `lib/themes/*` 与 `client.js` 为基准逐项比对——23 套目录条目（含全部 token）全等、10 个 seed × {palettes, light/dark scheme, `buildPhotoTokens`, `buildM3ExportCss`} 全等、`hexToHsl`/`hslToHex`/`withAlpha`/`extractDominant`/`extractPalette`/`buildWallpaperTheme` 全等、23 条画廊 meta 全等、88 + 88 个 `OFFICIAL_*` token 全等。

> 注：移植期这份手抄的 `OFFICIAL_DARK` 后来被查出**漂移了 65/88 项**（值仍停留在 DSH 0.0.x 的旧暗色调色板），
> 会导致「选浅色主题 → 切深色」时整片回退成旧配色。现已改为由 `scripts/sync-official.mjs`
> 从真实安装重新生成（101 + 101 项，0 漂移），并由 `check-themes.mjs` 常驻校验。

### 主题集精简

曾扩展到 33 套，但实测**大多数主题的视觉区分度不足** —— 基本是「同一套布局换个色相」，
而维护成本随数量线性增长（每套 133 个 token，任何全局约定都要同步几十处）。
现精简为 7 套：`claude-parchment-light` / `xiaohongshu-light` / `levels-light` / `arc-light` /
`sakura-light` / `luxury-dark` / `supabase-dark`。此后追加的第 8 套 `harness-office` 不属于这轮取舍——
它换的是**信息维度**（官网同款的动效背景），不是又一个换个色相的布局。

> ⚠️ **明暗分布**：7 套里 **5 套浅色、只有 2 套深色**（`luxury-dark` / `supabase-dark`），
> 加上 `harness-office` 后为 **5 浅 / 3 深**。日常用深色模式的话，实际只有这 3 套可选。

### 同期修复（来自 token 审计）

1. **`OFFICIAL_LIGHT/DARK` 重新生成** —— 暗色分支此前漂移 **65/88** 项（值仍停留在 DSH 0.0.x 的旧暗色调色板），
   会让「选浅色主题 → 切深色」整片回退成旧配色。现由 `scripts/sync-official.mjs` 从真实 DSH 生成
   （0.2.0-rc.2 基线为 118 + 118，0 漂移），`check-themes.mjs` 常驻校验。
2. **补 `--dsw-alias-link`** —— 此前基线与主题都没有它，markdown 链接与文件提及永远是 DeepSeek 蓝。
3. **补 `--dsw-alias-state-business-primary/tertiary`** —— 此前官方 DeepSeek 蓝会渗进每套主题。
4. **删死 token `--dsw-alias-line-secondary`** —— 全 DSH 零引用。
5. **`--dsw-alias-markdown-tag` 交给官方默认** —— DSH 里它是「活动标签页底色」（面不是前景），
   主题按前景语义填中灰实色会把活跃标签压成灰块，故主题一律不覆盖（`check-themes.mjs` 守着这条）。
6. **画廊按钮文字改为按亮度择优** —— 原先写死 `#fff`，在保留的这 7 套上**一套都不达标**
   （最差 Supabase 绿仅 1.91:1）；改为按 accent 相对亮度在白/近黑间择优后 **8/8 达标**
   （后加的 `harness-office` 官网蓝上取近黑，6.8:1）。
7. **`.tg-search::placeholder` 换用 `--dsw-alias-label-tertiary`** —— 原用的 `label-quaternary` DSH 并未定义。
8. **`fillFontTokens` 支持自定义等宽栈** —— 传字符串时 markdown 代码块与 `--dsw-font-mono` 同源。

### 0.5.0：跟 DSH 0.2.0-rc.2 基线

1. **官方基线重新生成** —— `official.ts` / `dsw-alias-baseline.json` 由 0.1.7-rc.1 的 **101 + 101** 项重生成到
   0.2.0-rc.2 的 **118 + 118** 项（`node scripts/sync-official.mjs`，本机多版本共存时用
   `DSH_THEME_BUNDLE=<...>/dsh-client-ui-theme/lib/client.js` 指准版本，否则脚本会挑到 profile 里的旧 DSH）。
   不重生成的话，主题覆盖层的「对侧 scheme」分支会继续下发旧官方值。
2. **补 `--dsw-alias-toast-label`（契约 133 → 134）** —— 0.2.0-rc.2 才把 toast 文字色抽成 token，
   官方默认是静态白（`--dsw-static-neutral-bluish-00`），而官方注释假定 toast 面「两档都深」；
   本套主题的浅色档把 `toast-bg` 定成浅面（白 / 象牙 / 米色），此前是**白底白字**。
   现在每套主题显式取自己的 `label-primary`（壁纸主题取 M3 的 `inverseOnSurface`），
   `check-themes.mjs` 新增「必须定义 + toast 面/字 ≥4.5:1」双重守卫。
3. **其余 16 个新增键有意不覆盖** —— 分三类：a) 官方值本身是 `var(--dsw-alias-*)` 别名
   （`settings-card-fill`/`-stroke`、`turn-trigger-bg(-hover)`、`tooltip-key-bg`），CSS 自定义属性惰性求值，
   主题覆盖层一改它们自动跟随，再写一遍只会多出第二份真相；b) 语义上不该被主题改写的静态色
   （`bg-document-selection` 固定 40% blue-500，用于保留文档原色的 PDF 选区；`onboarding-*` 属桌面首启引导）；
   c) 扫光/工作态（`label-shimmer`、`label-deep-diving(-shimmer)`），官方是中性色叠 alpha，叠在任意主题上都成立。
   逐条理由写在 `src/host/themes/shared.ts` 头注释。
4. **`bg-document-preview` 亮档语义变化（本主题有意不跟）** —— 官方 0.2.0-rc.2 把亮档文档预览画布
   由深改浅（bluish-100 + bluish-700 状态字），暗档不变。本套主题保留「预览面板恒为深色画布」，
   属于设计取舍而非基线漂移。

## 免责声明

主题配色参考各品牌公开的设计系统（Claude / 小红书 / Levels / Arc / Supabase / Luxury / DeepSeek Harness 官网 等）的**公开色值**，
用于本地界面外观定制；商标与品牌归属各自所有者，本项目与上述公司无任何关联。原创主题（Sakura）为本项目贡献。
`harness-office` 的背景效果移植的是官网首屏的**算法**（逐粒子数学），点阵字标由页面自己的字体栈在本地画布上现算，
不含官网的任何图片、字体或模型资源。三个效果都是程序化绘制——本插件不打包、不下载任何图片或视频素材。

本插件只改 CSS 变量与圆角，另在选定背景效果时挂一层自绘舞台（canvas 或纯 CSS，换选 / 收回即整层撤销）；
不修改官方代码、不拦截或改写官方交互与数据流、不收集任何数据。背景层的鼠标坐标只在当前帧内参与点阵与流场排布，
不上传、不落盘。壁纸取色在浏览器本地 48×48 采样，图片不上传。
