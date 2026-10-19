# 质量门禁

> 本文承接旧 AGENT.md §12（质量门禁）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 本地一条流程命令

提交前跑（构建 → 类型检查 → 质量检查 → 格式化，任一环节红即停，格式化自动写盘收尾）：

```bash
pnpm check   # build → typecheck → lint → format（提交前跑这个）
```

## CI 分步把关（与 `.github/workflows/CICD.yml` 同序）

```bash
pnpm format:check   # prettier 只检查不写；红了跑 pnpm format
pnpm lint           # oxlint --deny-warnings，警告也算挂
pnpm typecheck     # pnpm -r typecheck（solution 引用全跑）
pnpm build         # pnpm -r build（确认 lib/ 重新打出）
pnpm test          # pnpm -r test（至少 node --check 双 bundle）
```

- 工具选型已定：格式化 Prettier、质量 oxlint（`.oxlintrc.json`，correctness 当 error）。**不要引入 typescript-eslint**（8.70 不支持 TS 7，等上游跟上再说）。全仓仅有的两处 rule-off（`unicorn/consistent-function-scoping`、`eslint/no-underscore-dangle`）是故意的，新插件不许加第三处——需要的先提 issue 讨论。
- 单个插件迭代：`pnpm --filter @dshp/<name> build/typecheck`；编辑器装 Prettier + oxlint 插件，保存自动修。
- `pnpm install` 用 `--frozen-lockfile`（CI 语义）；改依赖必须提交 `pnpm-lock.yaml`。

## 各插件自检脚本（`pnpm test` 的追加层）

> 下表是**归档插件**的历史自检脚本（源码保留在 `archive/<name>/scripts/`），已不在 `pnpm test` / CI 中运行；维护中的 `vision-bridge` 只跑根 `test` 里的语法 + CSS Module 检查。

| 插件               | 脚本                         | 盯什么                                                                                  |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| file-change-viewer | `check-host.mjs`（158 项）   | NS 契约、补丁消毒、/ext 路由、patch 工具注册契约与动态开关、全有或全无、locate 只读一次 |
|                    | `check-patch.mjs`（74 项）   | `*** Begin Patch` 纯函数：多文件/多片段/五级模糊定位/行尾 BOM/失败诊断                  |
|                    | `check-client.mjs`（204 项） | 无头渲染：loader 注册、行渲染树、偏好生命周期                                           |
| mcp-manager        | `patchdoc.test.mjs`          | patch 文件定位/回写/自校验                                                              |
| token-meter        | `check-share-tokens.mjs`     | 分享卡导出的 token 清单覆盖 `styles.module.css` 全部 `--dsw-*`（导出图掉色的静态防线）  |
| web-style          | `check-themes.mjs`           | 主题目录 ↔ 画廊 meta ↔ 产物一致性                                                       |

另有一条**全仓共用的静态检查**，所有写了 CSS Module 的插件都挂在 `pnpm test` 里：

```bash
node ../../shared/scripts/check-css-modules.mjs src/client
```

它盯 `styles.拼错` —— CSS Module 的映射是宽松声明（`shared/types/css-modules.d.ts`），拼错的类名
编译期合法、运行时是 `undefined`、React 静默丢掉 className，这是唯一会自动红的网；顺带报出
「CSS 里定义了但源码没用到」的孤儿规则（提示，不拦）。

写新自检脚本：`scripts/*.mjs`、只许 node 内建模块、能独立跑（不启动 DSH、不碰真实文件系统的用户数据）、失败必须非零退出。
