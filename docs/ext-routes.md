# 同源 JSON 路由（/ext/dshp-\<name\>/*）

> 本文承接旧 AGENT.md §9（同源 JSON 路由规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 通用约定

- 路由三件套按需提供：`GET state`（状态+配置快照）/ `POST config`（保存补丁）/ `GET check`（探活）。kind 一律 `'exact'`，逐个 `ctx.effect` 注册。
- 每个 handler 第一行 `if (!sameOrigin(req)) return json(res, 403, ...)`。`sameOrigin`/`json`/`readBody` 从自有 `http.ts` 导入（各插件独立持有，不跨包 import）。
- `json()` 必须带 `cache-control: no-store`；`readBody` 默认 64KB 上限（配置类 body 足够，需要大 body 的插件自行调大），超限 `payload-too-large` 并销毁流。
- `POST config` 流程：`readBody` → `JSON.parse` 失败回 `{ ok:false, error:'请求体不是合法 JSON' }` → `Object.hasOwn` 逐字段校验（非法抛中文 Error 如 `'primary 非法，应为 {provider, model} 或 null'`；未知字段直接拒绝）→ 有补丁才 `settings.update` → 回 `{ ok:true, config: snapshotConfig() }`。**业务错误走 200 + `ok:false`**（前端 `fetchState` 按 `ok` 分支），只把跨站/方法错误走 4xx。
- 字符串截断：provider 120 / model 200 / 错误信息 300–500。数字 `Math.floor` 后夹范围。

## 为什么设置节不走客户端 `settingsScope`

官方 `settingsScope.bind({ namespace })` 也能读写同一份条目 config，但它要求浏览器侧服务已挂载、写操作按 revision 设栅；任一环时序不对（服务晚挂载、页面非 loopback）就会**静默退化成只读默认值**——症状正是「控件点了没反应、profile 条目 `config:` 里也没有键值」。本仓统一走「自有 `/ext` 路由 → Host `settings.update`」：写的是同一份条目 config，但少一层时序依赖。设置节与工具行共用同一个客户端 store（读走 `state`、写走 `config`）；写是乐观的，失败一定回滚并报错。

## 各插件现有路由一览

> 下表含已归档插件（`archive/`）的历史路由，仅作参考；维护中的只有 `vision-bridge`。

| 插件               | 路由（前缀 `/ext/dshp-<name>`）                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vision-bridge      | `GET state` / `POST config` / `GET check`                                                                                                                                     |
| mcwiki-search      | `GET state` / `POST config` / `POST test`（连接测试）                                                                                                                         |
| token-meter        | `GET state` / `GET stats`（别名 `/data`）+ quota 侧 `refresh / set-active / set-refresh / set-enabled / set-vendor-enabled / add / update / delete / secret-to-cred / config` |
| search-provider    | `GET state` / `POST config` / 连接测试（供应商路由由 provider 模块自带）                                                                                                      |
| web-style          | `GET state` / `GET themes`（全量 token 目录）/ `POST theme` / `POST config`                                                                                                   |
| skill-manager      | `GET state` / `GET read` / `POST config / create / update / toggle / remove / transfer`                                                                                       |
| mcp-manager        | `GET state` / `POST config / create / update / toggle / remove / probe`                                                                                                       |
| file-change-viewer | `GET state` / `POST config` / `POST locate`（hunk 真实行号 + 两侧上下文；只回行号与十几行原文，整份文件不回传）                                                               |
| widget-kit         | `GET state`（框架版本 + 契约版本 + 偏好快照）/ `POST config`（偏好补丁：托盘开关 / 图标上限 / 徽标间隔 / 悬停预览 / 参考组件）                                                |

新增路由时：同前缀、同消毒规则、同 `ok:false` 语义；回包只带契约字段，绝不回传整个文件内容。
