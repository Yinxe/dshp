# 脚手架与目录布局

> 本文承接旧 AGENT.md §1（目录与脚手架规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 固定布局（照抄 vision-bridge）

```
plugins/<name>/
├── package.json          # 见 docs/package-json.md
├── tsconfig.json         # 见下文 tsconfig 节
├── tsup.config.ts        # 见 docs/build-and-deps.md
├── cordis.patch.yml      # bundle 声明，`- insert: [{ id, name }]`
├── src/
│   ├── host/             # Node 侧：index.ts（apply）+ types.ts + 按职责拆模块
│   │   └── index.ts / types.ts / config.ts / cache.ts / http.ts / vision.ts ……
│   └── client/           # 浏览器侧：index.tsx（只导出 inject/apply）+ types/api/styles/components/Section
│       └── index.tsx / types.ts / api.ts / styles.module.css / components.tsx / <X>Section.tsx ……
├── lib/                  # 构建产物，必须提交：host.js + client.js
└── README.md             # 见 docs/documentation.md
```

> client 侧只有**含 JSX 的文件**是 `.tsx`（组件、入口）；纯逻辑（`api.ts` / 领域计算 / CSS Module 之外的工具）保持 `.ts`。
> loader 注册壳与 `<style>` 注入**源码里没有**——都由 [`shared/tsup.preset.ts`](../shared/tsup.preset.ts) 生成，见 [docs/client-basics.md](client-basics.md)。

可选目录（按需，均为约定）：

| 目录          | 用途                                                      | 现有使用者                                                               |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/shared/` | Host 与 Client 两份产物都要内联的**纯函数**（如补丁解析） | file-change-viewer（已归档）                                             |
| `scripts/`    | 无头自检脚本，挂进 `pnpm test`                            | file-change-viewer / mcp-manager / token-meter / web-style（均已归档）   |
| `images/`     | README 截图（配合 `screenshots.json` 清单）               | mcwiki-search / token-meter / web-style / file-change-viewer（均已归档） |

仓库根另有 `shared/`（**不是**插件）：构建预设 `tsup.preset.ts`、CSS Module 的宽松类型声明
`types/css-modules.d.ts`、各插件 `pnpm test` 共用的静态检查 `scripts/check-css-modules.mjs`。
只服务单个插件的东西**不许**进去（放回那个插件自己的 `tsup.config.ts` / `scripts/`）。

命名约定：

- 目录名用短横线小写（`vision-bridge`），包名用 `@dshp/<目录名>`。
- host 入口永远 `src/host/index.ts`，client 入口永远 `src/client/index.tsx`（只导出 `inject` 与 `apply`）。
- 根 `tsconfig.json` 是 solution 引用聚合，新插件必须登记，否则 `pnpm typecheck` 漏检。

## 加新插件（5 步）

```bash
mkdir -p plugins/<name>/src/{host,client}
# 1. 照抄 plugins/vision-bridge/{package.json,tsconfig.json,tsup.config.ts}
# 2. 改 package.json：name（@dshp/<name>）、version（从 0.1.0 起）、description、
#    repository.directory、dsh.bundle.patch 路径
# 3. 改 tsup.config.ts 里的插件 id（就一行 pluginBuild('@dshp/<name>')；本插件专属的
#    inline / define / host banner 也写在这个文件里，不要进 shared/tsup.preset.ts）
# 4. 写 cordis.patch.yml：id 用短横线小写（与 settings NS 同名，见 docs/settings.md），
#    name 用包名
# 5. 根 tsconfig.json references 加 { "path": "./plugins/<name>" }
pnpm install
pnpm --filter @dshp/<name> build && pnpm --filter @dshp/<name> typecheck
```

client 侧的起步三件（照 vision-bridge 抄）：`src/client/index.tsx`（`inject` + `apply` 两个导出、
每个注册块一个 `try/catch`）、`src/client/styles.module.css`（类名 camelCase、不带插件前缀）、
`src/client/components.tsx`（官方 primitives 里没有的那几个小构件）。
`package.json` 的 `test` 脚本记得挂上 `node ../../shared/scripts/check-css-modules.mjs src/client`。

## 客户端注册槽位与 order 全景

新插件往槽位注册前先看占位，撞车要协商：

| 槽位                                    | 谁在用（order / id）                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `settings.section`                      | vision-bridge 25 / mcwiki-search 26 / token-meter 27 / search-provider 28 / skill-manager 29 / mcp-manager 30 / file-change-viewer 31 / **widget-kit 32** / web-style 50 |
| `conversation.view`                     | token-meter 40（中心区 tab，与原生「对话 / 轨迹」并列）                                                                                                                  |
| `conversation.input.right`              | skill-manager 90（输入框右侧技能按钮）                                                                                                                                   |
| `conversation.chat.commandview`         | mcwiki-search（按命令名 keyed：`/mcwiki`）                                                                                                                               |
| `shell.overlay`                         | token-meter（小组件浮层）/ **widget-kit 10**（卡片层，id `dshp-widget-kit-cards`）                                                                                       |
| `conversation.session.header.utilities` | file-change-viewer 20（会话页头快捷开关）/ **widget-kit 30**（组件托盘，id `dshp-widget-kit-tray`）                                                                      |
| `tool.call.toolview`                    | file-change-viewer（keyed：`edit` / `write` / `str_replace_editor` / `patch`，影子化优先级 `-1`）                                                                        |

## 标杆与阅读顺序

- 标杆实现：`plugins/vision-bridge`（设置页 / 工具）与 `plugins/search-provider`（provider 型）。**新插件有疑问时先读它们，再读规范。**
- 阅读顺序：根 `AGENT.md` → 根 `README.md` → `plugins/vision-bridge/README.md` → `plugins/vision-bridge/src/host/*.ts` → `src/client/*`（组件是 `.tsx`）→ `tsup.config.ts`。
- provider 型插件（多供应商分层）的第二标杆：`archive/token-meter`（已归档）；接管工具行渲染的标杆：`archive/file-change-viewer`（已归档）。两者只读，不再适配新版 DSH。
