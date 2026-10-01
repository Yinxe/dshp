# @dshp/skill-manager

DeepSeek Harness（DSH）技能管理：在 Web 设置页统一管理**全局技能**（`~/.dsh/skills`、`~/.agents/skills`）与**工作区技能**（`<工作区>/.dsh/skills`、`<工作区>/.agents/skills`）——新建 / 编辑 / 启停 / 复制移动 / 删除，改动被 harness 实时监听、即刻生效，无需重启。

> 设计原则：文件布局与 frontmatter 语义**逐条对齐** `@deepseek-ai/dsh-skill-filesystem`（rank、调用开关布尔文法、kebab-case 名字规范）；写入范围被严格限定在上述技能根内（名字白名单 + 路径包含 + realpath 三重校验）；**故意不注册模型工具**——技能文件是提示词注入面，写入必须由人完成。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

```bash
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install
# lib/ 已提交，clone 下来就能用；改了 src 才需要 pnpm build

dsh plugin --profile web add ./plugins/skill-manager

dsh web   # 重启生效
```

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](../../compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。

- 不能 `pnpm add @dshp/skill-manager` / `add github:`——包未发布，只能本地装。
- 前置：需要 Web 设置页（client 半注册 `settings.section`）；Host 半只依赖 `settings` 与 `webServer` 两个服务。

### 一键 AI 安装

```text
帮我从 monorepo Yinxe/deepseek-harness-plugins 安装插件：
1. git clone 仓库并 pnpm install
2. dsh plugin --profile web add ./plugins/skill-manager
3. 重启 dsh web，确认无报错、设置页出现「Skills」条目
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

latest 滚动版（跟随 main 最新构建；滚动更新 = 重跑同一条 add 命令）：

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-skill-manager-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 `compat.json` 记录的兼容 tag，到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-skill-manager-<tag>.tgz`：

```bash
# 以 v0.1.5-rc.1 为例
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-skill-manager-v0.1.5-rc.1.tgz

dsh web   # 重启生效
```

## 更新

### 三种安装方式对应的更新方式

| 安装方式             | 更新命令                                                    | 说明                                                      |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| 方式一 clone（推荐） | 仓库内 `git pull` + `dsh web`                               | 最快；未改 src 免 build；旧版 DSH 用 `git checkout <tag>` |
| 方式二 Release       | 重跑同一条 `add` 命令 + `dsh web`                           | URL 直装对 `update` 免疫；两个 pnpm 坑见根 README         |
| 方式三 git 依赖      | `dsh plugin --profile web update @dshp/\<pkg\>` + `dsh web` | 一条命令；git 解析约 35s/插件（实测）                     |

### 更新日志

- **0.1.0**（2026-09-12）：首发。全局/工作区技能列表、启停开关、行内编辑器、新建、复制/移动/改名、删除、同名遮蔽提示。
- **0.1.1**（2026-09-12）：参考 ZCode 技能页重排 UI（范围切换 + 计数 + 搜索 + 紧凑单行列表）；控件全面改用官方 `dsh-client-ui-primitives` 原语（Button / Input / Switch / Tag / Menu / Modal / 原生图标）；行内开关合并为单一「启用/禁用」（模型/用户两个调用面挪进编辑弹窗细粒度控制）；「复制/移动」从多级菜单改为弹窗；编辑弹窗加宽，技能名 / description / whenToUse / 正文全部回显可改，保存时自动处理改名；`toggle` 路由新增 `field: all`；transfer 支持同根同名目录的原地 frontmatter-name 修正。
- **0.1.2**（2026-09-12）：设置页条目更名「Skills」；窗口重新聚焦时静默刷新列表（外部 IDE / git 改动回来即见，不闪加载态）；工具栏计数显示「已启用 M」；新建弹窗的技能名做前端 kebab-case 校验；正文编辑区换等宽字体。
- **0.1.3**（2026-09-12）：「新建」接入官方技能生成器——已装 skill-creator 时，在**当前工作区开一个新会话**并把 `/skill-creator` 自动写入输入框（`uiWorkspace.startSession` 导航 + `conversation.input.right` 探针经 `InputActions.setDraft` 写入，全部官方 seam），发送即开始对话；**未安装时不再自动执行安装**，改为弹窗展示安装命令 `npx skills install anthropics/skills@skill-creator --global --yes` 供复制手工执行（自动安装成功率不可控），装完点「刷新」即可。手动新建表单保留在「⋯ → 手动新建技能…」。
- **0.3.0**（2026-09-24）：适配 DSH 0.1.7（rc.1）——Host 按新契约导出条目 `Config`（schemastery 字段全部 `.volatile()`），废弃 `installSection`/`setSource`；设置页注册改走 `settings.configure({ auto: false }, ctx.fiber)`；设置改动经 `settings.update` 写入 profile 条目 `dshp-skill-manager` 的 `config:` 并由 `loader/volatile-update` 即时热更新（手工编辑条目 config 重启生效）。peer 升 `^0.1.7-rc.1`（rc.1 起装载前会校验 peer 范围）。
- **0.4.0**（2026-10-01）：跟 DSH 0.2.0-rc.2 基线——`@deepseek-ai/dsh-client-ui-primitives` devDep 升 `0.2.0-rc.2`（cordis peer 由 4.0.2 抬到 4.0.4，仓库在 `pnpm-workspace.yaml` 用 `overrides` 对齐）。0.2.0 系列的 primitives 对本插件用到的原语是纯新增（MenuSurface / MenuGroup / ShortcutKeys / onboarding），**源码零改动**，只重打 `lib/`。

## 界面与组件策略

界面布局参考 ZCode 技能页（范围切换 + 计数 + 搜索 + 紧凑列表 + 工具栏）。**控件尽量直接使用 DSH 官方原语 `@deepseek-ai/dsh-client-ui-primitives`**：`Button`（ghost / primary / toolbar）、`Input`、`Switch`、`Tag`（徽章）、`Menu`（范围切换与复制/移动菜单）、`Modal`（编辑 / 新建 / 删除确认 / 额外工作区根目录）与原生图标（`IconSkillOutline16` / `IconTrashOutline16` / `IconEditOutline16` / `IconEllipsisOutline16` / `IconPlusOutline16` / `IconSearchOutline16` / `IconRefreshOutline14`）。仅在没有对应原语的地方（textarea、行布局）自创少量 CSS；颜色一律走 `--dsw-alias-*` token，深浅主题自动跟随。

## 功能

| 层       | 能力                                                                                                                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host     | 扫描技能根（全局 2 + 工作区 2×N）、frontmatter 解析（保留未知键与注释）、创建/更新/启停/复制/移动/改名/删除                                                                                                                                                                                                                                             |
| Client   | 设置页「Skills」：范围切换（全局 / 各工作区）+ 计数（技能 / 已启用）+ 搜索 + 工具栏（⋯ / 刷新 / 新建）、紧凑单行列表、行内启用/禁用开关；「新建」在当前工作区开新会话并自动插入 `/skill-creator`（未装时弹窗展示安装命令供手工执行）；编辑（名字 / description / whenToUse / 正文 / 调用面）与手动新建 / 复制移动 / 删除确认 / 额外工作区根目录均为弹窗 |
| 同源路由 | `/ext/dshp-skill-manager/*`：`GET state`、`GET read`、`POST config` / `create` / `update` / `toggle` / `remove` / `transfer`                                                                                                                                                                                                                            |
| 工具     | 无（故意不注册模型工具，防止提示词注入；技能写入只能由人在设置页完成）                                                                                                                                                                                                                                                                                  |

## 技能根与优先级

与 `@deepseek-ai/dsh-skill-filesystem` 的默认 roots 完全一致：

| Rank | 来源           | 路径                      |
| ---- | -------------- | ------------------------- |
| 100  | 工作区 .dsh    | `<工作区>/.dsh/skills`    |
| 200  | 工作区 .agents | `<工作区>/.agents/skills` |
| 400  | 全局 .dsh      | `~/.dsh/skills`           |
| 500  | 全局 .agents   | `~/.agents/skills`        |

- **`.agents/skills` 是本插件的默认规范目录**：列表排序、新建弹窗与复制/移动弹窗的默认目标都以它为先（界面标注「推荐」）；`.dsh/skills` 仍完整支持，rank 决定的优先级不受展示排序影响。
- 所有工作区相关条目都会**显示工作区名字**（目录 basename）：范围切换、根目录标签（如「工作区 deepseek-harness-plugins · .agents/skills」）与工作区路径行。
- 工作区候选来自 DSH 的 `workspaceRegistry`（可选服务）；还可在设置页填一个「额外工作区根目录」（持久化到 profile 条目 config）。
- **同名遮蔽**：低 rank 的同名技能会被高 rank 遮蔽，列表里会标出「被 ×× 遮蔽」。全局组内 400 vs 500，工作区组内 100 vs 200。
- 目录包 `<name>/SKILL.md` 与平铺文件 `<name>.md` 都支持；点开头目录（含 `.system`）跳过；复制/移动技能目录时保留 `references/`、`scripts/` 等资源。

## 配置项（profile 条目 `dshp-skill-manager` 的 `config:`）

```yaml
dshp-skill-manager:
  enabled: true # 总开关；false 时所有写操作路由直接报错
  workspaceRoot: '' # 额外/兜底工作区根目录（绝对路径）；空 = 只用 workspaceRegistry
```

也可在设置页「⋯ → 额外工作区根目录…」弹窗里改（保存即写入 profile 条目 config）。

## 安全边界

- 所有路由同源校验（`Origin` vs `Host`），状态接口 `no-store`，请求体 1MB 上限。
- 写路径三重防护：技能名 kebab-case 白名单（`^[a-z0-9]+(?:-[a-z0-9]+)*$`，与 dsh-skill 相同，天然排除 `..` / `/` / 前导点）→ 路径包含校验 → `realpath` 包含校验；只写技能根下一级条目。
- 单技能文件读取上限 256KB；description / whenToUse 截断 500 字符；错误信息截断 500 字符。
- 插件配置只进 profile 条目 config 的 NS，不新增自有配置文件；重写 frontmatter 时未知键与注释原样保留。

## 代码结构

```
plugins/skill-manager/
├── src/host/
│   ├── index.ts        # apply 装配 + 8 条同源路由
│   ├── types.ts        # AnyCtx + 协议类型
│   ├── config.ts       # NS / schema / 补丁消毒 / dshHome 解析
│   ├── http.ts         # json / sameOrigin / readBody / queryParams
│   ├── frontmatter.ts  # SKILL.md frontmatter 最小解析/序列化（保留未知键）
│   ├── roots.ts        # 技能根解析 + 工作区枚举 + 路径安全
│   └── skills.ts       # 扫描 / CRUD / 复制移动 / 遮蔽标记
├── src/client/
│   ├── index.tsx           # 只导出 inject / apply（两处槽位注册；loader 壳由构建预设拼出）
│   ├── SkillSection.tsx    # 设置页主组件（JSX）+ 输入框右侧探针 + 模块级 ctxHolder
│   ├── components.tsx      # Badge / Switch / Selector / ActionMenu
│   ├── styles.module.css   # CSS Modules（dsw-alias-* token；类名构建期哈希，不需要前缀）
│   ├── api.ts              # fetch 封装
│   └── types.ts            # 协议类型（与 host 对齐）+ ClientContext / SlotsService 接缝
└── lib/                # 已提交的单文件产物（host.js + client.js）
```

## 常见问题

- **改了技能多久生效？** 技能根被 `dsh-skill-filesystem` 监听（默认开），下一个模型步骤就能看到新目录；本插件自己的改动也走这条路径，无需重启。
- **为什么没有模型工具？** 技能 = 可复用提示词。若模型能写技能，任何能诱导模型的内容都能给自己种下持久注入。因此写入只开放给同源 Web UI（由人操作）。
- **数据都存在哪？** 三处，没有自有数据库或 `storages/*.json`：
  1. **技能本体** —— 就是技能根下的真实文件（`<name>/SKILL.md` 或 `<name>.md`），所有编辑直接写文件；
  2. **插件配置**（`enabled` / `workspaceRoot`）—— profile 条目 `dshp-skill-manager` 的 `config:`，经 DSH settings 服务持久化、支持热重载与注释保留；
  3. **界面记忆**（范围选择）—— 浏览器 localStorage（`dshp-skill-manager.scope`），不落盘到 harness。
- **「启用」开关到底控制什么？** 一个技能有两个调用面：模型通过 `skill` 工具加载（model-invocable）、用户以 `/名字` 直接调用（user-invocable）。行内「启用」= 两个面一起开/关；要只关其中一个（比如不让模型自动加载、但保留 `/名字` 手动调用），在编辑弹窗的「调用面」里单独切换。落盘形式是 frontmatter 的 `disable-model-invocation` / `user-invocable` 键。
- **编辑器打开后 frontmatter 里的 `metadata:` 会被改坏吗？** 不会。解析不了的键（块标量、嵌套映射）原样保留，只有受控字段（name/description/whenToUse/两个调用开关）会被重写。
- **历史技能名字不合规（如 `SVG Logo Designer`）能修吗？** 能。列表会标红提示；在编辑弹窗把技能名改成合法 kebab-case（与目录名一致时原地只改 frontmatter），保存即修复。
- **`~/.zcode/skills` 这类自定义目录管不了？** 管不了。本插件只管理 dsh-skill-filesystem 的四个默认根；自定义 `customSkillDirs` 需要在对应 provider 配置里写，不在管理范围。

## 卸载

```bash
dsh plugin --profile web remove @dshp/skill-manager
dsh web
```

设置页条目与路由随插件卸载自动移除；profile 条目 `dshp-skill-manager` 的 config 与技能文件本身不会被删除，需要的话手工清理。

## 免责声明

本插件直接读写技能目录下的文件（删除为不可恢复操作，UI 有二次确认）。使用前请自行备份重要技能；作者不对数据丢失负责。
