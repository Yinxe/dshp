# deepseek-harness-plugins

DeepSeek Harness（DSH）插件 Monorepo（pnpm workspaces + TypeScript ESM）。

> **当前维护 `@dshp/vision-bridge` 与 `@dshp/search-provider`。** 2026-10-20 起其余插件已归档到 [`archive/`](archive/README.md)，冻结在归档时的版本，不再适配新版 DSH，也不参与构建、测试与发布。

> **运行时零依赖 · 构建产物已提交**：插件 `dependencies` 恒为 `{}`，`lib/host.js` / `lib/client.js` 随仓库提交 —— clone 下来即可直接安装，无需先 build。

## 插件一览

**维护中：**

| 插件                                                           | 一句话                                                                         | 文档                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| **[@dshp/vision-bridge](plugins/vision-bridge/README.md)**     | 视觉桥接：让纯文本模型也能“看图”（`vision_describe` 工具 + 主/备模型自动降级） | [README](plugins/vision-bridge/README.md)   |
| **[@dshp/search-provider](plugins/search-provider/README.md)** | AI 搜索中枢：用 Tavily / Exa / Firecrawl 接管 `web_search`（含两个免费后端）   | [README](plugins/search-provider/README.md) |

**已归档（冻结，不再维护）：**

| 插件                                                             | 版本   | 一句话                                                              | 归档位置                                                    |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| [@dshp/token-meter](archive/token-meter/README.md)               | 0.15.0 | Token 额度 + 用量统计 + 在线时长（多供应商额度 + 会话日志聚合）     | [`archive/token-meter`](archive/token-meter/)               |
| [@dshp/file-change-viewer](archive/file-change-viewer/README.md) | 0.4.0  | edit / write 行的高亮差异视图 + `patch` 工具                        | [`archive/file-change-viewer`](archive/file-change-viewer/) |
| [@dshp/mcwiki-search](archive/mcwiki-search/README.md)           | 1.6.0  | Minecraft Wiki 查询（搜索 / 引言 / 全文，清洗成 AI 可读文本）       | [`archive/mcwiki-search`](archive/mcwiki-search/)           |
| [@dshp/web-style](archive/web-style/README.md)                   | 0.5.0  | Web 外观定制（8 套主题 + 背景效果 + 壁纸取色 + 全局圆角）           | [`archive/web-style`](archive/web-style/)                   |
| [@dshp/skill-manager](archive/skill-manager/README.md)           | 0.4.0  | 技能管理（全局 + 工作区技能的新建 / 编辑 / 启停 / 复制移动 / 删除） | [`archive/skill-manager`](archive/skill-manager/)           |
| [@dshp/mcp-manager](archive/mcp-manager/README.md)               | 0.4.0  | MCP 服务器管理（patch 条目 CRUD + 探活，表单 / JSON 双模式）        | [`archive/mcp-manager`](archive/mcp-manager/)               |
| [@dshp/widget-kit](archive/widget-kit/README.md)                 | 0.13.0 | 小组件规范与宿主（托盘 + 卡片 + 小面板，不含业务）                  | [`archive/widget-kit`](archive/widget-kit/)                 |

> 归档件保留源码、文档与已提交的 `lib/`，可直接从 `archive/<name>` 本地安装；不参与 CI、不再发版，也不再适配新版 DSH。归档清单与冻结版本见 [`archive/README.md`](archive/README.md)。

## 安装到 DSH

### 方式一（推荐）：克隆仓库安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```bash
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install
# lib/ 已提交，clone 下来就能用；改了 src 才需要 pnpm build

# 安装维护中的插件
dsh plugin --profile web add ./plugins/vision-bridge

# 归档插件仍可本地安装（冻结版本，不再更新；见 archive/README.md）
# dsh plugin --profile web add ./archive/token-meter

dsh web   # 重启生效
```

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。
- **归档插件**不随仓库更新：它们的源码与 `lib/` 已冻结，装与不装都不影响 `vision-bridge`。

`dsh plugin add` 会把包写进 profile 的 `dsh.profile.bundles` —— **无需手动改配置文件**。
各插件的详细安装说明、配置与常见问题见对应 README（上表）。

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

CI 把维护中的插件打包成 tgz 发布到 Releases，`latest` 滚动发布固定跟随 main 最新构建（持 Latest 徽标、始终置顶）：

```bash
# macOS / Linux
dsh --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-vision-bridge-latest.tgz
```

```powershell
# Windows PowerShell
dsh --profile web add `
  'https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-vision-bridge-latest.tgz'
```

维护中插件的下载与安装命令见 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 各预发布说明；**滚动更新 = 重跑同一条命令 + `dsh web` 重启**（`latest` 资产随 main 每次构建滚动重建）。

> **两个 pnpm 语义坑**，遇到别绕远路：
>
> 1. `dsh plugin … update` 对 tarball URL 直装**无效**——`pnpm update` 只重解析 semver 范围，URL 是精确 spec（且 lockfile 用 integrity 钉住首次内容），永远 "Already up to date"。滚动更新请**重跑同一条 add 命令**（或用下面的 Git tag 安装）；
> 2. `remove` 后重装同一 URL 若报 `ERR_PNPM_MISSING_TARBALL_INTEGRITY`（lockfile 残留了无 integrity 的条目），删掉 profile 目录里的 `pnpm-lock.yaml` 再 add 即可（lockfile 是可再生的本机状态）。

### 历史版本（兼容旧版 DSH）

维护中的 `vision-bridge` 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 [`compat.json`](compat.json) 记录的兼容 tag（「DSH 版本 → 推荐 tag」矩阵），到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-<插件名>-<tag>.tgz`（历史 tag 里仍含当时尚未归档的插件，checkout 后路径为 `plugins/<name>`）：

```bash
# 以 v0.1.5-rc.1 为例
dsh --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-vision-bridge-v0.1.5-rc.1.tgz
```

### 方式三：Git 依赖安装 —— 支持 `update` 一键（可解析较慢，列为备选）

仓库自带一个**随 CI 滚动的 `latest` git tag**（每次 main 构建通过门禁后重置到 main HEAD）。装它 = "永远最新"，且 **`update` 一键跟进**——spec 永不改变，可变性由 git ref 承担，完全绕开 tarball URL 的语义坑：

```bash
# 安装（一次，此后 spec 永不改）
dsh plugin --profile web add \
  "github:Yinxe/deepseek-harness-plugins#latest&path:plugins/vision-bridge"

# 之后每次更新就这一条：
dsh plugin --profile web update @dshp/<插件名>
dsh web   # 重启生效
```

**同一机制的两种变体**（换选择器即可）：

- `#semver:^1.0.0&path:plugins/vision-bridge` —— 跟发版 tag 走的**受控升级**：只在 push 了匹配范围的新 tag 后 update 才会动；预发布 tag 受 node-semver 元组规则限制，范围必须显式含预发布（如 `^0.1.5-rc.1` 只匹配 0.1.5 系列）；
- `#main&path:plugins/vision-bridge` —— 与 `#latest` 等价的分支滚动。

注意：

- `latest` tag 在门禁**通过后**才移动到 main HEAD，所以 update 拿到的永远是过了门禁的构建；
- git 解析在你网络慢时可能要 2–4 分钟；一次 clone 后 pnpm 有本地缓存，重复 update 会快一些；
- **协议取决于你本机的 pnpm 版本，而不是 spec 本身**：pnpm ≥ 11.21.0 的 `github:` 简写走 HTTPS，开箱即用；更早的版本（如 11.7.0）会解析成 `git+ssh://git@github.com/…`，**需先配好 GitHub SSH key**，否则报 `Permission denied (publickey)`。旧版又不想配 key 时，升级 pnpm，或让 Git 把 ssh 重写成 HTTPS（pnpm 只是 shell out 到 `git`，重写自动生效）：

  ```sh
  git config --global url."https://github.com/".insteadOf "git@github.com:"
  ```

- 对比：tarball URL 直装（`…latest.tgz`）的 spec 是精确 URL，`update` 永远 no-op——这正是 git 依赖方案存在的理由。

**多插件统一更新**：`update` 支持一条命令带多个包名（git 与 tarball 混装亦可）：

```bash
dsh plugin --profile web update "@dshp/*"   # 或显式列出：update @dshp/a @dshp/b …
```

实测耗时（国内网络、SSH 热缓存）：**约 35 秒/插件、线性增长**（3 个 ≈ 1 分 40 秒；首次冷安装更久，每个都要完整 clone）。插件多且网络差时更新会到分钟级——这是 git 解析的固有成本，根治要等 npm 发布渠道恢复（registry 元数据 + CDN tarball，秒级）。tarball 渠道的多插件重装同样支持一条命令带多个 URL，但在 HTTPS 不稳的网络下可能超时。

### 卸载

```bash
dsh plugin --profile web remove "@dshp/<插件名>"
dsh web   # 重启生效
```

`remove` 直接转发 pnpm（参数 = 包名），并自动从 `dsh.profile.bundles` 撤下挂载；写入 profile 条目 `config:` 的配置按需手动清理。各插件的详细安装/更新/卸载说明见各自 README。

### 一键 AI 安装

把下面这段发给你的 DSH AI，让它代你装：

```text
帮我从 monorepo Yinxe/deepseek-harness-plugins 安装插件（按需选择子目录）：
1. git clone 仓库并 pnpm install
2. dsh plugin --profile web add ./plugins/vision-bridge
3. 重启 dsh web，确认无报错、设置页出现对应条目
```

### 发布与更新约定（CI 自动执行）

| 通道         | 触发                      | 行为                                                             |
| ------------ | ------------------------- | ---------------------------------------------------------------- |
| `latest`     | 推送 `main`               | 滚动重建到最新提交（正式渠道，持 Latest 徽标置顶），下载地址固定 |
| 版本 Release | 推送 `v*` tag             | 静态存档，永不随构建变化                                         |
| 自定义后缀   | 手动触发（限 main / tag） | 勾选 rolling = 预发布随滚动；不勾 = 静态正式版                   |
| 仅门禁       | 推送其他分支 / PR         | 不打包、不发布（分支上的构建产物没有意义）                       |

- **只有 `main` 与 `v*` tag 能产出发布物**：其他分支推送与 PR 只跑门禁；手动触发是唯一的人工发版口，也只在 `main`（或 `v*` tag）上生效，在别的 ref 上跑只跑门禁并打一条 notice。要给人试新版，用 `main` 的 `latest`，或手动触发指定后缀。
- **滚动约定**：所有**预发布**（以及 notes 首行带 `<!-- rolling: true -->` 标记的 release）都跟随 main——每次 main 推送成功后整体重建到最新提交；停止跟随 = 取消 Pre-release 勾选或删除标记行。`latest` 每次最后重建并授予 Latest 徽标，始终置顶 Releases 列表。
- **数量约束**：除 `latest` 外同时最多允许 **1 个**滚动项；出现多个时 CI 立即报错终止（不动任何现有 Release），处理后再推送即可。
- Release 说明由 `scripts/gen-release-notes.cjs` 生成：逐插件列出包名、版本、双语描述、下载与安装命令。

## 结构

```
.
├── plugins/
│   ├── vision-bridge/          # @dshp/vision-bridge（视觉桥接，维护中）
│   │   ├── src/host/           #   Host TS：types/http/config/cache/vision/index
│   │   ├── src/client/         #   Client TS：types/styles/api/components/VisionSection/index
│   │   ├── lib/                #   单文件构建产物（已提交，DSH git 安装必需）
│   │   └── cordis.patch.yml    #   bundle 声明（id: dshp-vision-bridge）
│   └── search-provider/        # @dshp/search-provider（AI 搜索，维护中）
│       ├── src/host/           #   Host TS：types/http/config/providers/index
│       ├── src/client/         #   Client TS：types/styles/api/components/SearchSection/index
│       ├── lib/                #   单文件构建产物（已提交，DSH git 安装必需）
│       └── cordis.patch.yml    #   bundle 声明（id: dshp-search-provider）
├── archive/                    # 冻结的历史插件（源码 + lib + 文档，不参与构建 / 发布）
│   ├── token-meter/            # @dshp/token-meter 0.15.0
│   ├── file-change-viewer/     # @dshp/file-change-viewer 0.4.0
│   ├── mcwiki-search/          # @dshp/mcwiki-search 1.6.0
│   ├── web-style/              # @dshp/web-style 0.5.0
│   ├── skill-manager/          # @dshp/skill-manager 0.4.0
│   ├── mcp-manager/            # @dshp/mcp-manager 0.4.0
│   ├── widget-kit/             # @dshp/widget-kit 0.13.0
│   └── README.md               # 归档清单、冻结版本与安装说明
├── AGENT.md                    # 开发规范·规则版（红线 + 指路）
├── docs/                       # 规范细节（脚手架 / TS / package.json / 构建 / Cordis / settings / 路由 / Client / provider / 时区 / 安全 / 门禁 / 发布 / 文档 / 小组件）——旧 AGENT.md §1–§14 的完整下沉
├── tsconfig.base.json          # 共享 TS 配置（NodeNext + strict）
├── tsconfig.json               # solution 引用（只含维护中的插件）
├── pnpm-workspace.yaml         # packages: plugins/*（archive 不在 workspace）
├── compat.json                 # DSH 版本兼容矩阵
└── .github/workflows/CICD.yml  # 门禁 + 打包发布：main→latest 滚动发布，v* tag→版本 Release，其他分支仅门禁
```

每个插件内部一律是同一套布局：`src/host/`（Node 半）+ `src/client/`（浏览器 半）+ `lib/`（已提交的单文件产物）+ `cordis.patch.yml` + `AGENT.md`（本插件的局部规则与事实，指回根规范）。

### 设置键名约定（全仓统一，改名即 breaking）

每个插件只有一个配置键，四处同名，等于 `dshp-<目录名>`：

| 位置                                                         | 值（以 vision-bridge 为例） |
| ------------------------------------------------------------ | --------------------------- |
| 配置命名空间（条目 `Config` + volatile / `settings.update`） | `dshp-vision-bridge`        |
| 同源路由前缀                                                 | `/ext/dshp-vision-bridge/*` |
| `cordis.patch.yml` 的 `id`                                   | `dshp-vision-bridge`        |
| 设置页 `settings.section` 的 `id`                            | `dshp-vision-bridge`        |

**插件只读自己的键，不做任何历史键兼容与迁移**：不读 `dshp-inx-*` 等旧命名空间、不读 `storages/*.json`、不读不改写 `settings.yaml`（旧配置一次性导入是平台的事；规范见 [docs/settings.md](docs/settings.md)）。升级时若键名有变，请按各插件 README 的更新日志**手工**把旧分节改名或重配；配置键改名属 breaking 变更。

## 环境

- Node >= 20（推荐 24，见 `.nvmrc`）
- pnpm 11.7.0（见 `devEngines`）
- 本沙箱全局 store 只读，`pnpm-workspace.yaml` 已设 `storeDir: /tmp/pnpm-store`（pnpm v11 必须写这里，`.npmrc` 会被忽略）

## 常用命令

```bash
pnpm install
pnpm check         # 一条流程：build → typecheck → lint → format（提交前跑这个）
pnpm format        # prettier 全仓写盘
pnpm format:check  # CI 用，只检查不写
pnpm lint          # oxlint 全仓（--deny-warnings，警告也算挂）
pnpm typecheck     # pnpm -r typecheck
pnpm build         # pnpm -r build
pnpm test          # pnpm -r test

# 单个插件
pnpm --filter @dshp/vision-bridge build
pnpm --filter @dshp/vision-bridge typecheck
```

提交前跑 `pnpm check`（构建 → 类型检查 → 质量检查 → 格式化一步完成）；CI 仍按严格检查序把关；改了 `src/` 必须重新 build 并把 `lib/` 一起提交。

## 加新插件

```bash
mkdir -p plugins/<name>/src
# 照抄 plugins/vision-bridge/{package.json,tsconfig.json}，改 name/version/description
# tsconfig.json 里 extends 保持 ../../tsconfig.base.json
# 根 tsconfig.json references 加一条 { "path": "./plugins/<name>" }
pnpm install
```

规范分三层：**[AGENT.md](AGENT.md)**（红线规则版）→ **[docs/](docs/)**（主题细节，旧 §1–§14 全部下沉在此）→ 各插件 `AGENT.md`（局部规则与事实）。多供应商分层渲染、接管工具行渲染等专题见 docs/ 对应篇目。
