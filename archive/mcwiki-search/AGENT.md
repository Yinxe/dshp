# archive/mcwiki-search — 局部规则（已归档）

> **已归档（2026-10-20），不再维护。** 仅作历史参考，不再适配新版 DSH。

> 上层：[根 AGENT.md](../../AGENT.md) → [docs/](../../docs/)。本文只写本插件自己的事实与局部约定。

## 身份

| 项     | 值                                                                                 |
| ------ | ---------------------------------------------------------------------------------- |
| 包名   | `@dshp/mcwiki-search`                                                              |
| NS     | `dshp-mcwiki-search`（四处同名）                                                   |
| 设置节 | `settings.section` order **26**，label「Minecraft Wiki 搜索」                      |
| 工具   | `mcwiki_search` / `mcwiki_get_page` / `mcwiki_random`                              |
| 命令   | `/mcwiki`（可选服务 commands，未挂载自动跳过）                                     |
| 原实现 | `~/.dsh/plugins/dsh-mcwiki-search`（`@dshp-inx/mcwiki-search` v1.0.1）等价 TS 重写 |

## 结构与职责

- `src/host/`：`tools.ts`（三工具）/ `command.ts`（/mcwiki）/ `convert.ts`（数据清洗管线）/ `api.ts`（MediaWiki API）/ `routes.ts`（state / config / test）/ `config.ts` / `http.ts`。
- `src/client/`：`index.tsx`（**只导出 `inject` / `apply`**，loader 壳由 `shared/tsup.preset.ts` 的 banner/footer 拼出）/ `McWikiSection.tsx`（设置节，普通函数组件 + JSX）/ `CommandCard.tsx`（`conversation.chat.commandview` 槽位，按命令名 keyed）/ `components.tsx`（Badge/Row + `cx`）/ `styles.module.css`（CSS Modules）/ `api.ts`（fetch 封装）/ `types.ts`（协议 + 领域模型 + 只含实际用到的 `ClientContext` / `SlotsService` 接缝）。
- 端点写死为具名常量 `API_BASE = 'https://zh.minecraft.wiki/api.php'`（不可配置，换站改这里重 build）。

## 本插件的局部规则

1. **模型只看清洗后的文本**（插件对外承诺）：绝不让原始 wikitext / HTML / 模板噪声进入模型上下文。`convert.ts` 管线的每一级（实体解码 → 模板整块处理 → 链接/标签丢弃/转换 → 标题/列表归一 → 表格扁平化）是这条承诺的实现，改动要跑通 README「验证」节的用例。
2. **引用内容附页面 URL**：工具输出里带来源链接，便于用户核对。
3. **斜杠命令单命令单动作**：不做子命令（输入框不为子命令补全，用户发现不了）；第一条详情 = 整页纯文本（exintro 引言太短没料），上限取设置 maxChars。
4. **命令输出是 Markdown**：经 `conversation.chat.commandview` 自定义卡片渲染；未占用该槽位的端点回退通用卡片，Markdown 源文本保持可读。
5. 工具与路由**每次调用都读当前生效配置**（`getConfig()`），外部编辑 profile 条目 config 热重载无需重启。

## 自检

`pnpm --filter @dshp/mcwiki-search test` = `node --check` 双 bundle + `shared/scripts/check-css-modules.mjs`（`styles.x` 拼错在类型上是合法的，这个静态检查是唯一会自动红的网）；数据转换的验证用例见 README「验证（不依赖 DSH 运行时）」节。
