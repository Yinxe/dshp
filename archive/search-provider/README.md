# @dshp/search-provider

> **已归档（2026-10-20），不再维护。** 本插件已从 `plugins/` 移入 `archive/`，源码与 `lib/` 构建产物仅作历史参考；安装路径为 `./archive/search-provider`，后续不再适配新版 DSH；文中「更新」节仅作历史保留。

DeepSeek Harness（DSH）AI 搜索提供方中枢：用可插拔的第三方搜索 API（首个内置 **Tavily**）接管模型的 `web_search`，替换 DeepSeek 官方搜索 —— 官方搜索每次触发都消耗一轮模型调用，第三方按次计费更便宜、更快。密钥经 credentials 服务存入凭证库，保存后即时生效。

> 设计原则：**即插即用、零残留、可扩展**。插件只注册搜索提供方 + 一个设置页；提供方按模块契约注册（`src/host/providers/`），新增一家供应商不改设置页主代码；API Key 每次搜索实时从凭证库解析，不滞留在提供方实例上；卸载后除凭证库里你自己存的 Key 外无任何残留。

> 本插件为 monorepo（[deepseek-harness-plugins](https://github.com/Yinxe/deepseek-harness-plugins)）成员，等同改写自独立仓库 [dsh-tavily-search](https://github.com/Yinxe/dsh-tavily-search)（`@dshp-inx/tavily-search`），并提供从旧插件手工迁移的路径（见下文）。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```sh
# 1. 克隆 monorepo（lib/ 构建产物已提交，clone 下来就能用，无需 build）
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 2. 本地安装到 profile（路径按你执行命令时的 cwd 解析）
dsh plugin --profile web add ./archive/search-provider

# 3. 重启生效
dsh web
```

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](../../compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。

`dsh plugin` 会把包写进 profile 的 `dsh.profile.bundles` —— **无需手动改配置文件**。

**改源码后**：`src/host` 或 `src/client` 改完跑 `pnpm --filter @dshp/search-provider build` 重新打出 `lib/host.js + lib/client.js`，然后 `dsh web` 重启（client 半强刷页面即可）。

**验证**：设置 → AI 搜索，能看到「搜索引擎」行显示「Tavily · 当前生效」即安装成功。

**一键 AI 安装**：把下面这段发给你的 DSH AI 即可：

```text
帮我安装 AI 搜索供应商插件（monorepo Yinxe/deepseek-harness-plugins，子目录 archive/search-provider，包名 @dshp/search-provider）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web add ./archive/search-provider
3. dsh web 重启，确认无报错，设置页出现「AI 搜索」即成功
4. 在设置页填入 Tavily API Key 并点一次「连接测试」
```

### 选型（默认动态，无需 patch）

本插件**只注册 settings 里选的提供方**（`provider` 键），web seam 在唯一已注册提供方时自动选中——所以换供应商只需在设置页「生效提供方」下拉切换（或直接改 profile 条目 config 的 `provider` 键），**即时生效、无需重启、无需改任何 patch**。

官方搜索插件的补丁选型仍然兼容：

- 你的 profile 若已经（或将来）有 `- id: web / config: searchProvider: tavily` 固定选型，只要它和 settings 的 `provider` 一致，行为不变；
- 不一致时搜索会报 `WEB_PROVIDER_CONFIGURED_MISSING`，设置页顶部会显示中文提示，按提示删除 patch 里的 `searchProvider` 行（重启 dsh web）即完全交给设置页动态控制；
- 只装本插件、不装官方 `dsh-web-search-deepseek` 时，这行可加可不加（加了一致则行为相同）。

> Base 层默认提供方是 `deepseek-official`（DeepSeek 官方搜索插件）；官方搜索插件与「唯一已注册提供方」的自动选型规则互不影响。

**验证**：重启 `dsh web` → 打开 web 页面 → 设置 → AI 搜索，能看到「搜索引擎」行显示「Tavily · 当前生效」即安装成功。

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

latest 滚动版（跟随 main 最新构建；滚动更新 = 重跑同一条 add 命令）：

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-search-provider-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 `compat.json` 记录的兼容 tag，到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-search-provider-<tag>.tgz`：

```bash
# 以 v0.1.5-rc.1 为例
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-search-provider-v0.1.5-rc.1.tgz

dsh web   # 重启生效
```

## 更新

### 三种安装方式对应的更新方式

| 安装方式             | 更新命令                                                    | 说明                                                      |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| 方式一 clone（推荐） | 仓库内 `git pull` + `dsh web`                               | 最快；未改 src 免 build；旧版 DSH 用 `git checkout <tag>` |
| 方式二 Release       | 重跑同一条 `add` 命令 + `dsh web`                           | URL 直装对 `update` 免疫；两个 pnpm 坑见根 README         |
| 方式三 git 依赖      | `dsh plugin --profile web update @dshp/\<pkg\>` + `dsh web` | 一条命令；git 解析约 35s/插件（实测）                     |

## 从 dsh-tavily-search 迁移（手工，插件不自动采用配置）

旧插件（`@dshp-inx/tavily-search`）与本插件**互斥**：两者都注册 `tavily` 提供方，id 冲突会触发 `WEB_DUPLICATE_PROVIDER`（本插件会打印中文告警提示）。两步：

1. 安装本插件（见上）并重启确认生效；
2. 移除旧插件：`dsh plugin --profile web remove "@dshp-inx/tavily-search"`，删除 `~/.dsh/plugins/dsh-tavily-search` 目录。

配置**不自动迁移**：本插件只读自己的 `dshp-search-provider` 分节。如需沿用旧插件设置，请手工把值抄到新分节（旧分节 `dshp-inx-tavily-search` 之后可自行删除）：

```yaml
# 旧（不再被任何插件读取）
dshp-inx-tavily-search:
  searchDepth: basic
  maxResults: 5

# 新（本插件唯一读取的分节；字段缺省即用默认值）
dshp-search-provider:
  provider: tavily
  maxResults: 5
  tavily:
    searchDepth: basic
```

密钥无需迁移：新旧插件使用同一个凭证引用 `TAVILY_API_KEY`，凭证库里的 Key 直接继续生效；profile patch 里 `web.searchProvider: tavily` 一行也不动（provider id 保持 `tavily`）。

## 功能

| 部分                        | 内容                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host（lib/host.js）**     | 按模块清单注册 WebSearchProvider 到 `ctx.web`（当前：`tavily`）；API Key 每次操作实时解析（`TAVILY_API_KEY`）；同源 JSON 路由（`/ext/dshp-search-provider/state`、`/config`、`/test` + 供应商专属 `/tavily/usage`，带同源校验）供设置页读写状态/搜索行为/测试连通性/用量配额；**配置只认 `dshp-search-provider`，不读旧插件分节**                                                                                   |
| **Client（lib/client.js）** | 「设置 → AI 搜索」配置页：供应商状态徽章（当前生效/已配置）、密钥写入/显示/清除（走 api 网关 `credentials` 域，引用名由状态接口下发）、搜索行为配置（默认结果数 + 供应商字段如深度，经 `settings.update` 持久化到 profile 条目 `dshp-search-provider` 的 `config:`）、用量与配额卡片（Key/账号分项统计+进度条+刷新/强制刷新）、连接测试（输入查询 → 返回结果列表）。UI 全部使用 DSH 官方设计 token（`dsw-alias-*`） |
| **模型工具**                | 无：接管的是 DSH 内置 `web_search` 工具（`dsh-tool-web` → `ctx.web` seam），不注册新工具                                                                                                                                                                                                                                                                                                                            |

搜索请求体（Tavily）：`api_key / query / max_results(1-10，默认走配置) / search_depth（配置：basic/advanced）/ include_answer: false`；返回统一投影为 `{ sources: [{url, title?, snippet?, publishedAt?}], truncated }`。

## 供应商扩展（新增一家 AI 搜索供应商）

只需三步，其余文件不动（设置页状态行/密钥/配置控件自动跟随 `state.providers` 元数据）：

1. 复制 `src/host/providers/tavily.ts` 为 `src/host/providers/<新 id>.ts`，实现 `SearchProviderModule`（见 `src/host/types.ts`）：id / label / title / credentialRef（如 `EXA_API_KEY`）/ fields（设置页控件元数据）/ defaultConfig / configSchema / sanitizePatch / snapshot / search / stateExtras，可选 registerRoutes（供应商专属路由，如用量接口）；
2. `src/host/providers/index.ts` 的 `createProviderModules()` 数组加一行；
3. 需要专属 UI 组件时，加 `src/client/providers/<新 id>.tsx` 导出 `create<X>Extras(C, bridge)`（`C` = 通用小构件集合、`bridge` = 同源路由封装），再在 `src/client/providers/index.ts` 的注册表里加一行；重启 `dsh web`。

注册第二家供应商后，设置页自动出现「生效提供方」下拉（provider id 即 patch 固定选型时可用的取值，见安装节选型说明）；默认 provider 为清单首位，想换默认就调整 `createProviderModules()` 里的顺序。

## 配置（标准 settings 存储）

以下配置写入 profile 条目 `dshp-search-provider` 的 `config:`（设置页可改；手工编辑重启生效；schema 默认值 → composition base → 用户层三级继承）。密钥**不**进条目 config，走 credentials 服务。

| 键                   | 类型                 | 默认     | 说明                                                                                                          |
| -------------------- | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`           | string               | `tavily` | 设置页聚焦的提供方；真正生效者由 profile patch 的 `web.searchProvider` 决定（state 接口会在不一致时给出提示） |
| `maxResults`         | int 1–10             | `5`      | 单次搜索默认返回条数；调用方显式传 maxResults 时以调用方为准                                                  |
| `tavily.searchDepth` | `basic` / `advanced` | `basic`  | 搜索深度；按次计费 basic 1 credit/次、advanced 2 credits/次                                                   |

### 计费与用量（Tavily，对齐 [官方文档](https://docs.tavily.com/documentation/api-reference/endpoint/usage)）

- **端点**：`GET https://api.tavily.com/usage`，鉴权为 `Authorization: Bearer <tvly-…>`（注意与 `/search` 的 `body.api_key` 不同）。
- **返回**（仅透传文档声明的叶子标量）：`{ key: { usage, limit, search_usage, extract_usage, crawl_usage, map_usage, research_usage }, account: { current_plan, plan_usage, plan_limit, paygo_usage, paygo_limit, ... } }`，`limit / plan_limit` 为 `null` 表示不限量。
- **限流与缓存**：官方限流 `10 req / 10min`；服务端做 `60 秒`缓存，`GET /ext/dshp-search-provider/tavily/usage` 默认读缓存、`?force=1` 强制刷新；`429` 时返回 `ok:false` 并附带 `stale` 旧快照，设置页会明确标注“旧数据”。

## 配置密钥

1. 注册 [tavily.com](https://tavily.com)（有免费额度），取 `tvly-…` 格式的 API Key；
2. 设置 → AI 搜索 → 粘贴密钥 → 保存密钥。「密钥状态」行变绿（已配置）、「搜索引擎」行显示「Tavily · 当前生效」即接管完成；
3. 在连接测试框输入任意查询点「运行测试」，返回结果列表即全链路通。

密钥通过 DSH credentials 服务持久化到 `~/.dsh/.credentials.yaml`，**不回显、不进模型上下文**；写入/清除即时生效，无需重启。

## 卸载

```sh
dsh plugin --profile web remove "@dshp/search-provider"
```

收尾：

1. 若曾加过 `web.searchProvider: tavily` 选型行，删除它（否则 seam 报 `WEB_PROVIDER_CONFIGURED_MISSING`）；
2. （可选）清除密钥：设置页点「清除密钥」；
3. `dsh web` 重启。

## 同源路由一览

| 路由                                     | 方法 | 说明                                                                                                          |
| ---------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| `/ext/dshp-search-provider/state`        | GET  | 选型 / 各供应商配置与密钥状态 / 供应商元数据（fields 驱动设置页控件）/ 各供应商 extras（如 Tavily usageMeta） |
| `/ext/dshp-search-provider/config`       | POST | 保存补丁 `{ provider?, maxResults?, tavily?: { searchDepth? } }`；非法值回 `200 + ok:false` + 中文错误        |
| `/ext/dshp-search-provider/test`         | POST | 连接测试 `{ provider?, query }` → 结果列表（provider 缺省走聚焦配置）                                         |
| `/ext/dshp-search-provider/tavily/usage` | GET  | Tavily 用量 `[?force=1]`（供应商专属路由）                                                                    |
