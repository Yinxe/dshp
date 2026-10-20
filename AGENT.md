# AGENT.md — dsh 插件 monorepo 开发规范（规则版）

> 仓库：`deepseek-harness-plugins`（pnpm workspaces + TypeScript ESM）。
> 2026-10-20 起维护 `plugins/vision-bridge` 与 `plugins/search-provider`；其余 `archive/` 下的插件已冻结，不参与构建 / 测试 / 发布，不得在其中新增功能或适配新版 DSH。
> 本文只留**必须背下来的规则**与打回清单；每条规则的「为什么、怎么抄、逐字段表格」下沉在 [docs/](docs/) 各主题文档里，按需再读。
> 有疑问时的阅读顺序：本文 → `docs/` 对应主题 → 标杆源码 `plugins/vision-bridge`（设置页 / 工具）与 `plugins/search-provider`（provider 型）；接管工具行的历史参考在 `archive/file-change-viewer`，只读、不再维护。
> 各插件自己的局部规则在 `plugins/<name>/AGENT.md`（维护中）或 `archive/<name>/AGENT.md`（归档，NS、槽位占位、路由面、自检脚本、特殊边界）。
> **小组件契约见 [`docs/widget-spec.md`](docs/widget-spec.md)**，但其宿主 `@dshp/widget-kit` 已归档冻结，新插件不再接入。

## 十条红线（违反即打回）

1. **运行时零依赖**：`lib/host.js` 单文件 ESM、`lib/client.js` 单文件 CJS（外面由构建预设拼上 `__ModuleLoader__.load` 壳），`dependencies` 永远 `{}`，第三方全部构建期内联或声明为运行时注入。→ [docs/build-and-deps.md](docs/build-and-deps.md)
2. **`lib/` 必须提交**：DSH 从 git 直接安装不跑 build；`src` 改了 `lib` 必须重打并一起提交，二者同进同出。→ [docs/build-and-deps.md](docs/build-and-deps.md)
3. **所有副作用可逆**：一切注册（on/register/样式/patch/section）都包在 `ctx.effect(..., 'dshp-<name>: label')` 里；`apply` 顶层不许抛，每个注册块独立 try/catch + 一行中文日志。→ [docs/cordis-host.md](docs/cordis-host.md)
4. **外部输入全部消毒**：tool 参数、路由 body、settings patch、文件回读，逐字段校验 + 截断 + 范围夹，不信任任何 `any`。→ [docs/cordis-host.md](docs/cordis-host.md)、[docs/ext-routes.md](docs/ext-routes.md)
5. **只认一个配置键**：NS = `dshp-<name>` 四处同名（settings 命名空间 / `/ext` 路由前缀 / patch id / settings.section id）；永不迁移历史配置、不读旧 key、不写自有配置文件（改名即 breaking，迁移步骤只写 README）。→ [docs/settings.md](docs/settings.md)
6. **不写用户文件**：配置只进 profile 条目 `config:` 的 NS；需要写用户文件的插件（skill-manager / mcp-manager）必须有写路径白名单 + 原子落盘 + 自校验，且故意不注册模型工具。→ [docs/security.md](docs/security.md)
7. **安全最小暴露**：同源校验 + body 上限；缓存只存 leaf owned copy；日志不打密钥/prompt 全文/用户原文；代码与注释里不放任何密钥。→ [docs/security.md](docs/security.md)
8. **不许自创配置**：tsconfig 只 extends `../../tsconfig.base.json` 不放宽任何 strict 项；不新加 oxlint rule-off（全仓仅有的两处是故意的）；不引入 typescript-eslint / eslint / webpack。→ [docs/typescript.md](docs/typescript.md)、[docs/build-and-deps.md](docs/build-and-deps.md)
9. **Client 半的硬约束**：源码写 `.tsx` + JSX，SDK 类型从 devDependency import（不再手写 `AnyReact` 那套 shim）；`react` / `react/jsx-runtime` / `@deepseek-ai/dsh-client-ui-primitives` 绝不打包（factory 的 require 注入，故 client 构建必须是 cjs + banner/footer）；颜色字号只用 `--dsw-alias-*` token，不写死色值。→ [docs/client-basics.md](docs/client-basics.md)、[docs/build-and-deps.md](docs/build-and-deps.md)
10. **门禁全绿才合**：提交前 `pnpm check`（build → typecheck → lint → format）；改依赖必须提交 `pnpm-lock.yaml`。→ [docs/quality-gates.md](docs/quality-gates.md)

## 类型与模块（速记）

- DSH 运行时无官方类型包：透传对象用 `AnyCtx`（每插件自有 `types.ts`），**自有数据结构必须严格建模**。
- 相对导入一律带 `.js` 后缀；类型导入用 `import type`；`exactOptionalPropertyTypes` 下用 `Object.hasOwn` 逐字段覆盖，不 `{...patch}` 一把梭。
- host：`index.ts` 只装配，按职责拆模块，单文件 ~600 行封顶；client：types/api/styles/components/Section 分层。→ [docs/typescript.md](docs/typescript.md)

## 脚手架速记

- 新插件 5 步照抄 vision-bridge（package.json / tsconfig / tsup / cordis.patch.yml / 根 tsconfig references），包名 `@dshp/<目录名>`，入口固定 `src/{host,client}/index.ts`。
- 注册槽位前先查占位表防撞车（settings.section 25–31+50 已占）。→ [docs/scaffolding.md](docs/scaffolding.md)

## 文档与版本（速记）

- 插件 README：安装节紧跟简介（四步固定文案 + 一键 AI 安装块）；移植说明放文末。→ [docs/documentation.md](docs/documentation.md)
- main 永远跟最新 DSH；DSH breaking 才回头打 tag 并记 `compat.json`；发布全由 CICD.yml 自动执行（main→latest 滚动、v* tag→静态版本、其他分支→同名预发布），npm 发布已下线。→ [docs/release-and-compat.md](docs/release-and-compat.md)

## 打回清单（合并前自查）

1. `dependencies` 非空；把 react/primitives 打进 client bundle。
2. `lib/` 未提交、或 `src` 改了 `lib` 没重打。
3. 自创 tsconfig / 放宽 strict / 新加 oxlint rule-off。
4. 用 JSX、顶层 `import React`、写死颜色值、不用 `dsw-alias-*` token。
5. 副作用不用 `ctx.effect`、effect 无 label、`apply` 顶层可抛。
6. `JSON.stringify` 整个 ctx/service；缓存原图 bytes；日志打用户原文。
7. 路由无 `sameOrigin`、body 无上限、字符串入库不截断。
8. 直接改 `node_modules`、改 `storeDir`/`pnpm-workspace.yaml`、用 npm/yarn 安装。
9. 不跑门禁就 push；`pnpm-lock.yaml` 没提交。
10. 在代码里放密钥；新增自有配置文件（配置只进条目 config 的 NS）。
11. 子包自带 LICENSE / `files` 含 LICENSE（全仓 MIT 只在根保留一份）。
12. 稳态读写旧配置键名、硬编码键名字符串、为历史旧键写兼容/迁移代码（读写一律 `NS` 常量）。
13. 代码注释引用本规范时用旧 §编号（应链接 `docs/<主题>.md`，编号会漂移）。
14. （历史规则；`widget-kit` 已归档，新插件不再接入小组件）写小组件不按 [docs/widget-spec.md](docs/widget-spec.md)：运行时 `import` `@dshp/widget-kit`（只允许 `import type` + `ctx.widgets` 服务）、`render` 里 `setSize`、自己监听 `window.resize`、写死色值、portal 到 `document.body`。
15. 在 `archive/` 里改代码、升版本或接新版 DSH（归档冻结；要恢复维护先把目录移回 `plugins/` 并重新纳入 workspace / CI）。

---

## 附：旧版 §编号 → 新文档映射（存量引用改造时查）

| 旧 §       | 主题                     | 新位置                                                       |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| §1         | 目录与脚手架             | [docs/scaffolding.md](docs/scaffolding.md)                   |
| §2         | TypeScript               | [docs/typescript.md](docs/typescript.md)                     |
| §3         | package.json             | [docs/package-json.md](docs/package-json.md)                 |
| §4–5       | 构建与依赖               | [docs/build-and-deps.md](docs/build-and-deps.md)             |
| §6         | Cordis Host              | [docs/cordis-host.md](docs/cordis-host.md)                   |
| §7         | settings 持久化          | [docs/settings.md](docs/settings.md)                         |
| §8         | 模型工具                 | [docs/cordis-host.md](docs/cordis-host.md)（「模型工具」节） |
| §9         | 同源路由                 | [docs/ext-routes.md](docs/ext-routes.md)                     |
| §10.1–10.2 | Client loader/Section    | [docs/client-basics.md](docs/client-basics.md)               |
| §10.3–10.4 | provider 分层 / 失败提示 | [docs/provider-ui.md](docs/provider-ui.md)                   |
| §10.5      | 时间与时区               | [docs/timezone.md](docs/timezone.md)                         |
| §11        | 安全                     | [docs/security.md](docs/security.md)                         |
| §12        | 质量门禁                 | [docs/quality-gates.md](docs/quality-gates.md)               |
| §13        | 文档规范                 | [docs/documentation.md](docs/documentation.md)               |
| §14        | 版本兼容发布             | [docs/release-and-compat.md](docs/release-and-compat.md)     |
| §15        | 禁止事项                 | 本文「打回清单」                                             |
