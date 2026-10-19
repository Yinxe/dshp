# plugins/vision-bridge — 局部规则

> 本目录是全仓**唯一标杆实现**：新插件有疑问先读这里，再读规范。
> 上层：[根 AGENT.md](../../AGENT.md)（红线规则）→ [docs/](../../docs/)（主题细节）。本文只写本插件自己的事实与局部约定。

## 身份

| 项     | 值                                                                  |
| ------ | ------------------------------------------------------------------- |
| 包名   | `@dshp/vision-bridge`                                               |
| 版本   | `2.0.0`（DSH 0.2.1-rc.2 基线）                                      |
| NS     | `dshp-vision-bridge`（settings / 路由前缀 / patch id / section id） |
| 设置节 | `settings.section` order **25**，label「视觉模型」                  |
| inject | `['tools', 'webServer', 'llm']`                                     |
| 配置   | `enabled` / `primary` / `fallback` 三个 volatile 字段               |
| 原实现 | `~/.dsh/plugins/vision-bridge`（JS，816 行），本目录为 TS 重写      |

## 结构与职责

- `src/host/`：`index.ts`（apply 装配）/ `types.ts` / `config.ts`（NS + ConfigSchema）/ `http.ts`（json / readBody / sameOrigin）/ `cache.ts`（会话级图片 LRU + `walkBlocks`）/ `vision.ts`（模型发现 + 调用 + 主备 fallback）。
- `src/client/`：`index.tsx`（只导出 `inject` / `apply`）/ `VisionSection.tsx`（设置页）/ `components.tsx`（Row + Select）/ `api.ts` / `styles.module.css` / `types.ts`。

## 本插件的局部规则

1. **配置只留三项**：`enabled` / `primary` / `fallback`。图片提示词由主模型按当前对话上下文生成，`question` 原样透传；单次图片数固定 4 张。不要再加回 `maxImages` / `promptTemplate` / 全局 `detail`，也不要写死“描述这张图片”之类的兜底句或固定后缀。
2. **0.2.x settings 读法**：`settings.get(ns)` 已移除。模型发现统一 `settings.describe()` + `llm.listConfigurableProviders()`（按 `settingsNs` / `settingsPath` 定位），再用 `llm.listProviders()/listModels()` 补运行时来源；禁止硬编码 `llm-pi-ai` / `llm-deepseek`。
3. **工具描述必须含占位符原文**：`vision_describe` 的 description 写明 `[image omitted because this model accepts text only; attachment sha256:…]` 触发信号与「不要猜图」禁令，并说明 `question` 由模型结合上下文生成、插件原样透传。
4. **图片缓存按 attachmentId 去重**：`llm/stream` 每步都会重扫历史，不去重会把同一张图重复塞满；每会话 20 张、至多 50 会话 LRU。
5. **发送门禁接管**：启用且选好主模型时包装 `llm.resolveModelInfo` 给缺 image 的模型补 `inputModalities`；保存原函数、`ctx.effect` 返回恢复、探活使用未包装的原函数（否则会自证可用）。
6. **UI 用官方 primitives**：`Switch` / `Tag` / `Button` / `Menu` 从 `@deepseek-ai/dsh-client-ui-primitives` import；只有「标题 + 说明 + 右侧控件」的行版式和下拉锚点留在 `components.tsx`。颜色只用 `--dsw-*` token。
7. **路由三件套**：`GET state` / `POST config` / `GET check`；业务错误一律 200 + `ok:false`；`config` 拒绝未知字段，逐字段校验 + 截断。
8. **探活只看声明**：`check` 只验证 `resolveModelInfo` 可解析且 `inputModalities` 含 image，不做真实推理；提示文案要写清楚。

## 自检

`pnpm --filter @dshp/vision-bridge test` = `node --check` 双 bundle + `shared/scripts/check-css-modules.mjs`（`styles.x` 拼错在类型上是合法的，这个静态检查是唯一会自动红的网）。改 host/client 后跑 `build`；README 用户侧文档见本目录 `README.md`。
