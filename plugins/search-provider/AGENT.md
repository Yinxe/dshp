# plugins/search-provider — 局部规则

> 维护中的搜索插件。上层：[根 AGENT.md](../../AGENT.md) → [docs/provider-ui.md](../../docs/provider-ui.md)。本文只写本插件自己的事实与局部约定。

## 身份

| 项     | 值                                                                    |
| ------ | --------------------------------------------------------------------- |
| 包名   | `@dshp/search-provider`                                               |
| 版本   | `1.0.0`（DSH 0.2.1-rc.2 基线）                                        |
| NS     | `dshp-search-provider`（settings / 路由前缀 / patch id / section id） |
| Hub id | `dshp-search`（注册给 `ctx.web` 的唯一搜索提供方）                    |
| 设置节 | `settings.section` order **28**，label「AI 搜索」                     |
| inject | `['web', 'webServer']`                                                |
| 后端   | Tavily / Exa / Firecrawl（Firecrawl Key 可选）                        |

## 结构与职责

- `src/host/`：`index.ts`（apply 装配 + 路由）/ `config.ts`（NS/HUB_ID/schema/消毒）/ `types.ts`（web seam + provider 契约）/ `http.ts` / `providers/{base,tavily,exa,firecrawl,index}.ts`。
- `src/client/`：`index.tsx`（注册 settings.section，inject `slots` + `remote` + `remote.credentials`）/ `SearchSection.tsx` / `components.tsx` / `api.ts` / `styles.module.css` / `types.ts`。

## 本插件的局部规则

1. **只注册一个 hub provider `dshp-search`**：后端在 `search()` 里按 settings 的 `provider` 分派。禁止为每个后端注册不同 id——base 已有 `deepseek-official`，多 id 会触发 `WEB_PROVIDER_AMBIGUOUS`；也禁止动态解绑/重绑。
2. **选型由 bundle patch 设置**：`cordis.patch.yml` 的 `- id: web` 把 `searchProvider` 设为 `dshp-search`；profile 覆盖时 state 路由给出中文提示。不要从插件里偷偷改 `web` 配置。
3. **密钥只走 credentials**：`TAVILY_API_KEY` / `EXA_API_KEY` / `FIRECRAWL_API_KEY`，每次搜索 `resolveKey()` 现取；不进条目 config、不回显、不写用户文件。Firecrawl 允许无 Key。
4. **后端模块契约**：`id` / `label` / `title` / `credentialRef` / `credentialRequired` / `homepage` / `description` / `freeNote` / `fields` / `defaultConfig` / `configSchema?` / `sanitizePatch` / `snapshot` / `search`。新增后端 = `providers/<id>.ts` + `providers/index.ts` 一行；有字段才给 `configSchema`，无字段不产生空分节。
5. **API 字段消毒**：只取契约字段；`sourceOf` 校验 url、截断 snippet 1200；非 2xx 用 `extractApiDetail` 取供应商 detail，保留 HTTP 状态。
6. **路由三件套**：`GET state` / `POST config` / `POST test`；业务错误一律 200 + `ok:false`；`config` 拒绝未知字段；body 64KB；同源校验。
7. **UI 用官方 primitives**：`Button` / `Tag` / `Input` / `Menu` 从 `@deepseek-ai/dsh-client-ui-primitives` import；只有 Row / Select / KeyField / Notice / ResultList 留在 `components.tsx`；颜色只用 `--dsw-*` token。
8. **不做旧配置迁移**：只认 `dshp-search-provider`；旧 `dshp-inx-tavily-search` / 旧版 0.5.0 配置不读、不迁移，README 写手工步骤。

## 自检

`pnpm --filter @dshp/search-provider test` = `node --check` 双 bundle + `shared/scripts/check-css-modules.mjs`。改 host/client 后跑 `build`；README 用户侧文档见本目录 `README.md`。
