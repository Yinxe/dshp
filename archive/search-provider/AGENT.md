# archive/search-provider — 局部规则（已归档）

> **已归档（2026-10-20），不再维护。** 仅作历史参考，不再适配新版 DSH。

> provider 型插件（搜索版变体）。上层：[根 AGENT.md](../../AGENT.md) → [docs/provider-ui.md](../../docs/provider-ui.md)（search-provider 变体节）。本文只写本插件自己的事实与局部约定。

## 身份

| 项     | 值                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| 包名   | `@dshp/search-provider`                                                                                     |
| NS     | `dshp-search-provider`（四处同名）                                                                          |
| 设置节 | `settings.section` order **28**，label「AI 搜索」                                                           |
| 职责   | 把各供应商模块包装成 web seam 的 WebSearchProvider 注册到 `ctx.web`，替换 base 层默认的 `deepseek-official` |
| 原实现 | `~/.dsh/plugins/dsh-tavily-search`（`@dshp-inx/tavily-search` v2.0.3）等价 TS 重写 + 多供应商抽象           |

## 结构与职责

- `src/host/providers/base.ts`：跨供应商样板（路由注册 / 消毒 / 错误抽取）——新供应商只需实现 `SearchProviderModule`（见 `types.ts`），不重写样板。
- `src/host/providers/tavily.ts`：首个内置供应商。
- 选型：patch 同层把 `web.searchProvider` 设为想用的 provider id；只装一个提供方时 seam 自动选中。
- 配置分节：NS 下 `provider` / `maxResults` + 各供应商分节（键名 = provider id，如 `tavily: { searchDepth }`）。

### Client 半（`src/client/`）

形态同 `plugins/vision-bridge`（根 AGENT.md 红线 9 + [docs/client-basics.md](../../docs/client-basics.md)）：

- `index.tsx`：**普通 ES 模块**，只导出 `inject = ['slots', 'remote', 'remote.credentials']` 与 `apply(ctx)`。loader 注册壳由 `shared/tsup.preset.ts` 的 banner / footer 生成，样式由构建预设内联——源码里**不写** `__ModuleLoader__.load`、不手插 `<style>`。
- `SearchSection.tsx`：模块级函数组件 + 一层只闭包 `bridge` 的薄工厂 `createSearchSection(bridge)`（`React` / `P` 形参已去掉，官方构件从模块顶层 import）。
- `components.tsx`：模块级小构件 `Badge` / `Row` / `Select` / `Notice` / `Hint` / `Loading` / `Meter` / `BreakRow`；另导出 `components: Components` 作为「通用小构件集合 `C`」的具名打包。
- `providers/index.ts`：供应商附加区注册表 `createProviderExtras(C, bridge)`——只收这两个**真实**运行时依赖。
- `providers/tavily.tsx`：`createTavilyExtras(C, bridge)`，Tavily 专属的用量与配额区。
- `styles.module.css`：CSS Modules。局部名 camelCase、**无 `sp-` 前缀**（构建期哈希成 `<hash>_<local>`）；颜色/字号只用 `var(--dsw-alias-*)` token。运行时按 kind 选类名的两处（徽章配色、提示条配色）用 `Record<K, string | undefined>` 查表，不做字符串拼接。

## 本插件的局部规则

1. **密钥经 credentials 服务实时解析**（如 `TAVILY_API_KEY`），每次操作现取，不在 provider 上滞留、不进条目 config（见 [docs/security.md](../../docs/security.md)）。
2. **API 字段消毒**：非有限数字一律 `null`（`numOrNull`），不透传 NaN/字符串；字符串走 `strOrEmpty`。
3. **扩展新供应商**：`host/providers/<id>.ts` 实现 `SearchProviderModule`（含 `fields[]` 表单元数据）+ `providers/index.ts` 注册 + `client/providers/<id>.tsx` 可选专属 UI（导出 `create<X>Extras(C, bridge)`，在 `client/providers/index.ts` 的注册表里加一行）；表单字段一律来自 `fields[]`，禁止 client 按 type 硬编码（见 [docs/provider-ui.md](../../docs/provider-ui.md)）。
4. **不做旧插件配置迁移**：不读 `dshp-inx-tavily-search` 的任何配置；从 dsh-tavily-search 迁移是手工步骤（README「迁移」节）。

## 自检

`pnpm --filter @dshp/search-provider test` = `node --check` 双 bundle + `node ../../shared/scripts/check-css-modules.mjs src/client`（CSS Module 类名静态检查：`styles.拼错` 编译期合法、运行时静默丢 className，这个脚本是唯一的网）。
