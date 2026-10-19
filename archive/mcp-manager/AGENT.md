# archive/mcp-manager — 局部规则（已归档）

> **已归档（2026-10-20），不再维护。** 仅作历史参考，不再适配新版 DSH。

> 上层：[根 AGENT.md](../../AGENT.md) → [docs/](../../docs/)。本文只写本插件自己的事实与局部约定。

## 身份

| 项       | 值                                                                      |
| -------- | ----------------------------------------------------------------------- |
| 包名     | `@dshp/mcp-manager`                                                     |
| NS       | `dshp-mcp-manager`（四处同名）                                          |
| 设置节   | `settings.section` order **30**，label「MCP」                           |
| 管理对象 | profile 的 `cordis.patch.yml` 里 `@deepseek-ai/dsh-mcp-client` 实例条目 |
| 原实现   | 无（本仓原生）                                                          |

## 结构与职责

- `src/host/`：`patchdoc.ts` / `patchfile.ts`（定位/回写 patch 文件）/ `probe.ts`（探活）/ `config.ts` / `http.ts` / `index.ts` / `types.ts`。
- 路由面：`GET state` + `POST config / create / update / toggle / remove / probe`（见 [docs/ext-routes.md](../../docs/ext-routes.md) 一览）。
- `src/client/`：`index.tsx`（**只导出 `inject` / `apply`**，loader 壳由 `shared/tsup.preset.ts` 拼出）/ `McpSection.tsx`（列表 + 表单/JSON 双模式编辑器 + 删除/覆盖确认，普通函数组件 + JSX 的范式）/ `components.tsx`（Badge/Switch/Selector 小构件，真实 props 类型）/ `api.ts` / `styles.module.css`（CSS Modules，局部名不再需要 `mc-` 前缀）/ `types.ts`（协议 + 领域模型 + 只含实际用到的 `ClientContext` / `SlotsService` 接缝）。

## 本插件的局部规则

1. **回写保注释**：patch 文件是用户可手工维护的装配清单，回写必须保留文件其余内容（注释、`!!js`、排版）——整文件重新序列化不可接受。
2. **原子落盘三步**：先备份 `.bak` → 写临时文件 + rename → 回写前序列化自校验（不可重解析或条目数变化即拒绝写盘）。
3. **故意不注册模型工具**：patch 文件是 DSH 的装配清单，增删 MCP 实例必须由人完成（见 [docs/security.md](../../docs/security.md) 写路径防护节）。
4. **探活只碰 streamable-http**：发一次 initialize 握手即止；stdio 不 spawn（子进程有副作用）。
5. **唯一允许的额外 dev 依赖**：`yaml`（解析/回写 patch 文件必需，构建期内联进 lib，运行时仍零依赖）——其他插件不得效仿（见 [docs/package-json.md](../../docs/package-json.md)）。
6. **版本只有一个来源**：MCP 握手的 `clientInfo.version` 取自 `tsup.config.ts` 构建期从 package.json 注入的 `__DSHP_MCP_MANAGER_VERSION__`，源码里不许再写版本字面量——`lib/` 是提交进仓库的产物，写死的版本号升版本时必然漏（与 token-meter 注入包元信息同一套做法）。

## 自检

`pnpm --filter @dshp/mcp-manager test` = `node --check` 双 bundle + `shared/scripts/check-css-modules.mjs`（`styles.x` 拼错在类型上是合法的——CSS Module 的映射是宽松声明——这个静态检查是唯一会自动红的网）+ `scripts/patchdoc.test.mjs`（patch 定位/回写/自校验）。
