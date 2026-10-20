# @dshp/search-provider

DeepSeek Harness（DSH）**AI 搜索中枢**：用第三方搜索 API 接管模型的内置 `web_search`，替换 DeepSeek 官方搜索。内置 **Tavily**、**Exa**、**Firecrawl** 三个后端；其中 Exa 有免费额度，Firecrawl 不填 Key 也能用。密钥经 DSH credentials 服务保存，搜索行为与后端字段写入 profile 条目 `config:`，设置页改动即时生效。

> 设计原则：**一个稳定入口、多个可换后端**。插件只向 `ctx.web` 注册一个 `dshp-search` 提供方，后端在内部按设置分派——切换 Tavily / Exa / Firecrawl 不会重注册、不会与 base 的 `deepseek-official` 产生多提供方歧义。密钥不进配置、不回显、不写用户文件。

## 安装

### 方式一（推荐）：克隆 monorepo 安装

```sh
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 安装到 profile（路径按执行命令时的 cwd 解析）
dsh plugin --profile web add ./plugins/search-provider

dsh web
```

- **更新**：仓库内 `git pull` + `dsh web`（`lib/` 已提交，未改 src 无需 build）。
- **改源码后**：`pnpm --filter @dshp/search-provider build` 重打 `lib/host.js + lib/client.js`，再重启；client 半刷新页面即可。
- **验证**：设置 → AI 搜索能看到页面；「已接管 web_search」为绿色即成功。

**一键 AI 安装**：

```text
帮我安装 AI 搜索插件（monorepo Yinxe/deepseek-harness-plugins，子目录 plugins/search-provider，包名 @dshp/search-provider）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web add ./plugins/search-provider
3. dsh web 重启，确认设置页出现「AI 搜索」
4. 在设置页选 Tavily / Exa / Firecrawl，配置 Key（Firecrawl 可跳过），点一次「测试搜索」
```

### 方式二：从 Release 安装

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-search-provider-latest.tgz

dsh web
```

### 选型（默认已接管）

插件的 bundle patch 会把 `web.searchProvider` 设为 `dshp-search`：

```yaml
- id: web
  config:
    searchProvider: dshp-search
```

profile 里若有更具体的 `web` 覆盖行，会以 profile 为准；设置页顶部会提示当前 `web.searchProvider` 与 `dshp-search` 是否一致。想恢复官方搜索：删除该覆盖行并重启。

## 后端

| 后端          | 凭证引用                    | 免费额度                                                   | 可选配置                    |
| ------------- | --------------------------- | ---------------------------------------------------------- | --------------------------- |
| **Tavily**    | `TAVILY_API_KEY`            | 1,000 credits/月；basic 1 credit/次，advanced 2 credits/次 | 搜索深度 basic / advanced   |
| **Exa**       | `EXA_API_KEY`               | 新账号约 $10 免费额度；fast 更省                           | 检索模式 auto / fast / deep |
| **Firecrawl** | `FIRECRAWL_API_KEY`（可选） | 不填 Key 也能用（限流）；配置 Key 后额度更高               | 无                          |

密钥在 **设置 → AI 搜索 → API Key** 保存/清除，走 DSH credentials 服务，保存后即时生效。

## 配置项

写入 profile 条目 `dshp-search-provider` 的 `config:`：

| 字段                 | 类型                           | 默认     | 说明                                                   |
| -------------------- | ------------------------------ | -------- | ------------------------------------------------------ |
| `provider`           | `tavily` / `exa` / `firecrawl` | `tavily` | 当前使用的搜索后端                                     |
| `maxResults`         | 1–10                           | `5`      | 默认返回条数；调用方显式传 `maxResults` 时以调用方为准 |
| `tavily.searchDepth` | `basic` / `advanced`           | `basic`  | Tavily 搜索深度                                        |
| `exa.searchType`     | `auto` / `fast` / `deep`       | `auto`   | Exa 检索模式                                           |

Firecrawl 无后端专属字段，因此没有 `firecrawl` 分节。

## 工作方式

```
模型的 web_search
  └─ ctx.web 选中 dshp-search（bundle patch 设置）
       └─ 读取 settings 的 provider
            ├─ tavily    → POST https://api.tavily.com/search
            ├─ exa       → POST https://api.exa.ai/search
            └─ firecrawl → POST https://api.firecrawl.dev/v2/search
```

- **统一投影**：每个后端都归一成 web seam 的 `{ sources: [{ url, title?, snippet?, publishedAt? }], truncated }`；seam 再按调用方的 `maxResults` 截断。
- **密钥实时解析**：每次搜索经 credentials 服务现取，不缓存到 provider 实例。
- **取消**：调用方的 `AbortSignal` 透传给 `fetch`；取消时抛 `AbortError`。
- **失败提示**：401/402/429 等错误保留 HTTP 状态与供应商 detail，设置页测试框直接展示。

## 同源路由

| 路由                               | 方法 | 说明                                                                                 |
| ---------------------------------- | ---- | ------------------------------------------------------------------------------------ |
| `/ext/dshp-search-provider/state`  | GET  | 后端元数据、密钥状态、配置快照、`web.searchProvider` 选型提示                        |
| `/ext/dshp-search-provider/config` | POST | 保存 `{ provider?, maxResults?, tavily?, exa? }`；未知字段/非法值回 `200 + ok:false` |
| `/ext/dshp-search-provider/test`   | POST | `{ provider?, query }` → 真实调用一次搜索并返回结果                                  |

所有路由带同源校验与 64KB body 上限。

## 常见问题

- **「未接管 web_search」**：profile 的 `web.searchProvider` 不是 `dshp-search`。按设置页提示删除/修改覆盖行，重启 `dsh web`。
- **Tavily/Exa 报缺少 Key**：在设置页粘贴对应 Key；确认启动 dsh 的终端里没有同名环境变量把凭证库覆盖（页面会提示）。
- **Firecrawl 报限流**：不填 Key 时有限流；配置 `FIRECRAWL_API_KEY` 后重试。
- **旧插件冲突**：若还装着 `@dshp-inx/tavily-search` 或旧版 `@dshp/search-provider`，先移除再装本插件；旧插件会占用 `tavily` 等 provider id。
- **从旧版迁移**：旧版 `@dshp/search-provider` 0.5.0 的 provider 字段/路由与 1.0.0 不同；本插件不自动迁移配置。手工把 `provider` / `maxResults` 抄到条目 `dshp-search-provider` 的 `config:`，密钥引用（`TAVILY_API_KEY` 等）不变。

## 卸载

```bash
dsh plugin --profile web remove "@dshp/search-provider"
dsh web
```

若曾手写 `web.searchProvider: dshp-search`，删除该行恢复官方搜索；密钥可在设置页清除，或保留给其他插件使用。

## 代码结构

```
src/host/
  index.ts          注册 dshp-search hub、路由、配置与凭证接线
  config.ts         NS / HUB_ID / schema / 消毒 / 快照
  types.ts          web seam + provider 模块契约
  http.ts           json / sameOrigin / readBody / methodIs
  providers/
    base.ts         postJson / 错误抽取 / 来源归一
    tavily.ts       Tavily 后端
    exa.ts          Exa 后端
    firecrawl.ts    Firecrawl 后端（Key 可选）
    index.ts        后端清单
src/client/
  index.tsx         注册 settings.section（order 28）
  SearchSection.tsx 设置页
  components.tsx    Row / Select / KeyField / Notice / ResultList
  api.ts            state/config/test + credentials 写入
  types.ts          协议 + slots/remote 接缝
  styles.module.css 版式
lib/host.js         Host 单文件 ESM（提交物）
lib/client.js       Client 单文件 CJS（提交物）
```

## 免责声明

本插件只做搜索请求转发，不存储搜索内容；API Key 存在 DSH 凭证库，不进配置、不回显。各后端的费用、额度与内容政策由对应服务商决定。
