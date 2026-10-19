# @dshp/mcp-manager

> **已归档（2026-10-20），不再维护。** 本插件已从 `plugins/` 移入 `archive/`，源码与 `lib/` 构建产物仅作历史参考；安装路径为 `./archive/mcp-manager`，后续不再适配新版 DSH；文中「更新」节仅作历史保留。

DeepSeek Harness（DSH）MCP 服务器管理器：在设置页里列出、新建、编辑、启停、删除 profile 的
`cordis.patch.yml` 里的官方 [`@deepseek-ai/dsh-mcp-client`](https://github.com/deepseek-ai/deepseek-harness) 实例条目，
不用再手写 YAML。表单 / JSON 双模式编辑，回写保留文件里其余的全部内容（注释、`!!js` 表达式、排版），
保存后 DSH 自动热重连对应实例（HMR），内置同源 JSON 路由与 Streamable HTTP 探活。

> 设计原则：只做 patch 文件条目的「管家」，不自己连 MCP——连接、工具注册、重连全部交给官方
> `dsh-mcp-client`；本插件只负责让这些实例的声明变得可视、可改、可回退（`.bak` 备份 + 落盘自校验）。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```bash
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 安装（lib/ 已提交，无需 build）
dsh plugin --profile web add ./archive/mcp-manager

dsh web   # 重启生效
```

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](../../compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。

- 包尚未发布到 npm，不能 `pnpm add @dshp/mcp-manager`。
- 改了源码：`pnpm --filter @dshp/mcp-manager build` 重打 `lib/` 后重跑上面的 add + `dsh web`。
- 验证：设置页出现「MCP」分节，显示 patch 文件路径与（若有）条目列表。

### 一键 AI 安装

```text
帮我从 monorepo Yinxe/deepseek-harness-plugins 安装 MCP 管理插件：
1. git clone https://github.com/Yinxe/deepseek-harness-plugins.git && cd deepseek-harness-plugins && pnpm install
2. dsh plugin --profile web add ./archive/mcp-manager
3. 重启 dsh web，确认设置页出现 MCP 分节
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

latest 滚动版（跟随 main 最新构建；滚动更新 = 重跑同一条 add 命令）：

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-mcp-manager-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 `compat.json` 记录的兼容 tag，到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-mcp-manager-<tag>.tgz`：

```bash
# 以 v0.1.5-rc.1 为例
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-mcp-manager-v0.1.5-rc.1.tgz

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

| 层       | 内容                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Host     | 解析/定位 profile 的 `cordis.patch.yml`；条目级 CRUD（原位合并、保注释、保 `!!js`）；`.bak` 备份 + 原子写 + 回写自校验 |
| Client   | 设置页「MCP」分节：搜索/计数/刷新/新建，服务器行（状态点 + transport·命令摘要 + 启停开关），表单/JSON 双模式编辑器     |
| 同源路由 | `GET state`、`POST config`、`POST create`、`POST update`、`POST toggle`、`POST remove`、`POST probe`                   |
| 工具     | 故意不注册模型工具：patch 文件是 DSH 的装配清单，增删实例（等于在本机 spawn 进程）必须由人完成                         |

## 它管什么、不管什么

- **管**：`cordis.patch.yml` 里所有 `name: '@deepseek-ai/dsh-mcp-client'` 的实例条目——无论在顶层声明、
  `- insert:` 列表还是 group config 里都能找到并管理；文件里其他任何内容（webserver 端口、注释、`!!js` 表达式）
  只读不碰。
- **不管**：MCP 连接本身。启停 = 写/删条目级 `disabled: true`（与 loader 语义一致）；新建条目后 DSH 通过
  patch 文件热重载拉起实例；重连预算耗尽等运行时状态看 DSH 日志里的 `mcp-client(...)` 行。

## 保存语义（重要）

- **表单 / JSON 都是全量**：保存时载荷里的已知字段（serverName / transport / command / args / env / cwd /
  url / headers / toolCallTimeoutMs / failOnStartupError / reconnect）整体替换——JSON 模式里删掉某个已知键
  等于从条目里删除它。
- **自定义键安全网**：条目里本插件不认识的键（你在 YAML 里手写的任意扩展），载荷里没提到就**原样保留**，
  不会被误删；JSON 模式里可见的自定义键可改可增。
- **`!!js` 表达式**：env / headers 的值里以 `js: ` 开头的字符串等价 YAML 的 `!!js` 标签——表单和 JSON 模式
  都写 `{"GITHUB_TOKEN": "js: process.env.GITHUB_TOKEN"}`，回写即成 `GITHUB_TOKEN: !!js process.env.GITHUB_TOKEN`。
  未改动到的 `!!js` 值原字节保留。条目级 `disabled` 若是 `!!js` 表达式，UI 开关覆盖前会二次确认。
- **复杂值保护**：env/headers 的值若是映射等复杂结构（手工写的），该条目标记「复杂值」，UI 只允许启停/删除，
  不允许编辑保存（避免整块重写时丢信息）。

## patch 文件定位

按顺序找第一个命中的，state 顶部会显示最终路径与来源：

1. 设置页「patch 文件」显式覆盖（绝对路径）
2. 环境变量 `DSH_PROFILE_DIR` → `<dir>/cordis.patch.yml`
3. 从本插件安装位置向上找最近的 `cordis.patch.yml`（复制安装场景）
4. 扫 `~/.dsh/profiles/*/package.json` 的 `dsh.profile.bundles`，谁登记了 `@dshp/mcp-manager` 就用谁（`link:` 安装场景）
5. 兜底 `~/.dsh/profiles/web/cordis.patch.yml`（可能不存在，UI 会提示并给修正入口）

## 配置项（profile 条目 `dshp-mcp-manager` 的 `config:`）

```yaml
dshp-mcp-manager:
  enabled: true # 关闭后所有变更类路由（create/update/toggle/remove）拒绝执行，列表仍可看
  patchFile: '' # cordis.patch.yml 显式覆盖路径；空串 = 按上文顺序自动定位
```

## 探活

- 仅对 `streamable-http` 服务器提供「探活」按钮：向服务器发一次 MCP `initialize` 握手（只读，不执行任何工具），
  展示握手结果、延迟与 serverInfo。
- `stdio` 不探活——spawn 子进程有副作用；连接状态看 DSH 日志。
- `!!js` 标记的请求头无法被本插件求值（求值发生在 DSH loader），探活时跳过并在结果里注明。

## 代码结构

```
archive/mcp-manager/
├── src/host/
│   ├── index.ts        # apply 装配 + 7 条同源路由 + __test 导出
│   ├── types.ts        # 路由协议与条目视图类型
│   ├── config.ts       # NS / schema / 服务器 config 消毒（js: 前缀解析、字段夹紧）
│   ├── patchfile.ts    # patch 文件五级定位 + .bak 备份 + 临时文件 rename 原子写
│   ├── patchdoc.ts     # yaml CST 解析/视图/原位合并/启停/删除/插入/序列化自校验
│   ├── probe.ts        # Streamable HTTP initialize 握手（http/https 原生，SSE 帧兼容）
│   └── http.ts         # sameOrigin / json / readBody（自有，各插件独立持有）
├── src/client/
│   ├── index.tsx       # 只导出 inject / apply（settings.section，order 30）；__ModuleLoader__ 壳由构建预设拼出
│   ├── McpSection.tsx  # 列表 + 表单/JSON 双模式编辑器 + 删除/覆盖确认（.tsx + JSX，普通函数组件）
│   ├── components.tsx  # Badge/Switch/Selector（包官方 primitives，props 类型直接来自 SDK）
│   ├── styles.module.css # 仅布局；颜色只用 var(--dsw-alias-*) token（CSS Modules，构建期内联进 lib/client.js）
│   ├── api.ts          # fetch 封装（与 host 路由对齐）
│   └── types.ts        # 协议类型（与 host/types.ts 同名对齐）+ 服务接缝（ClientContext / SlotsService）
├── scripts/patchdoc.test.mjs  # 从 lib/host.js 导入 __test 的往返回归测试
└── lib/                # 构建产物（host.js + client.js，随仓库提交）
```

## 常见问题

- **配置好但没用过，怎么判断连接状态？** 四种途径，按可信度排：
  1. **列表里的「N 工具」徽标与状态点**（推荐）：连接 + 工具同步成功的服务器会把工具注册成
     `mcp__<serverName>__*`，本插件实时统计注册表并**每 5 秒自动刷新**——绿点 + 「3 工具」就是真的连上了；
     已启用但提示「运行时未发现工具」说明连接失败、重连预算耗尽或服务器不提供工具。stdio 也有这个信号（不 spawn）。
  2. **探活按钮**（仅 streamable-http）：发一次 MCP `initialize` 握手，显示延迟与 serverInfo。
  3. **`dsh web` 终端日志**：`mcp-client(<serverName>)` 前缀的行会记录连接成功/失败/重连（含尝试次数）。
  4. **会话里验证**：让模型列出可用工具，`mcp__<名称>__*` 在列表里即已连接。

  状态时延 = 服务器热重连耗时（保存后断开重连，通常 1~3 秒）+ 最多 5 秒轮询间隔；增删改操作后的响应
  自带新快照，立即生效。

- **保存后工具没变？** 保存写的是 `cordis.patch.yml`；DSH 的 patch 监视热重载在大多数场景会自动断开重连。
  若你的启动方式不监听该文件，`dsh web` 重启一次即可。
- **列表出现「重复 id」？** 文件里有多个同 `id` 条目，loader 行为未定义，本插件拒绝变更——手工去重后再操作。
- **新建时报「已存在同 id 条目」？** 条目 id 由 serverName 生成（`mcp-<小写名>`），换一个 serverName 或先删旧条目。
- **为什么没有协议版本选项？** 官方 `dsh-mcp-client` 的配置只有 transport 两种形态 + 超时/重连等字段；
  需要 reconnect 微调时用 JSON 模式。
- **为什么没有「用户 / 工作区」作用域？** DSH 没有工作区级配置层，这不是本插件偷懒：MCP 工具注册进 host
  平面的 `tools` 注册表（跨会话共享），配置单元只有两个——**profile 组合**（全局，即本插件管理的
  `cordis.patch.yml`）和 **agent preset**（单会话，`~/.dsh/.agent-presets/<id>/cordis.yml`，随会话挂载）。
  「工作区」（`~/.dsh/storages/workspace.json`）只是会话分组，不承载任何配置语义；CLI 的 `--patch` overlay
  也是进程级（启动时选定）。所以 ZCode 的「用户 / 工作区」两档在 DSH 里没有对应物。要「某类会话才有的
  MCP」，现阶段的 DSH 原生做法是复制一个 agent preset、把 `@deepseek-ai/dsh-mcp-client` 实例写进它的
  `cordis.yml`（每会话独立连接）；或为不同场景开不同 profile。等上游出现工作区级组合层，本插件再跟进。
- **为什么没有 SSE 类型？** 官方 `dsh-mcp-client` 的 schema 只认 `stdio` 和 `streamable-http`（SSE 只是
  Streamable HTTP 内部的事件流，ZCode 的 SSE 是旧版 MCP 协议）。写 `transport: 'sse'` 会被官方拒绝加载，
  所以本插件不提供这个选项。旧式纯 SSE 端点（`https://…/sse`）用桥接命令转成 stdio 接入：
  类型选 stdio，命令 `npx`，参数 `mcp-remote https://mcp.example.com/sse`。
- **能管理 settings.yaml 里的 MCP 吗？** DSH 的 MCP 服务器不存在于 settings.yaml——它们是 cordis 装配条目，
  本插件管理的就是唯一正确的位置。
- **卸载插件会影响我的 MCP 服务器吗？** 不会。patch 文件里的条目仍然有效，只是失去管理界面。

## 卸载

```bash
dsh plugin --profile web remove "@dshp/mcp-manager"
dsh web   # 重启生效
```

不删除任何用户数据：profile 条目 `dshp-mcp-manager` 的 `config:`与 `cordis.patch.yml` 里的 MCP 条目都原样保留，
手工删除即可。

## 移植说明

- monorepo 定位：`archive/mcp-manager`（包 `@dshp/mcp-manager`，cordis id / settings NS / 路由前缀同名
  `dshp-mcp-manager`）；开发范式照抄标杆 `plugins/vision-bridge` 与 `plugins/skill-manager`。
- 本插件为原创，无原版 JS 仓库；字段与语义对齐官方 `@deepseek-ai/dsh-mcp-client`（peer 于 DSH 主仓
  `packages/mcp/mcp-client`）：`serverName` 约束 `[A-Za-z0-9_-]{1,32}`、transport 仅 `stdio` / `streamable-http`、
  公开工具名 `mcp__<serverName>__<rawName>`、条目级 `disabled` 与 `insert` loader patch 语义。
- 构建：`pnpm --filter @dshp/mcp-manager build`（tsup 双 bundle；host 内联 schemastery + yaml——yaml 走 CST
  保注释，这是「改条目不动其余内容」的根基）；测试 `pnpm --filter @dshp/mcp-manager test`。

## 免责声明

本插件修改 DSH profile 的装配文件（写入前自动备份 `.bak`、落盘前自校验），但不承诺覆盖所有外部变更竞态：
插件运行期间手工编辑同一文件的改动可能被覆盖。重要改动请自行版本管理 `cordis.patch.yml`。软件按「现状」提供，
作者不对因使用本插件导致的配置丢失或服务器行为异常承担责任。
