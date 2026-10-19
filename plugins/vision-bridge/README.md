# @dshp/vision-bridge

DeepSeek Harness（DSH）**视觉桥接**插件：让**纯文本模型**也能“看图”。当用户消息里出现图片占位符 `[image omitted because this model accepts text only; attachment sha256:…]` 时，模型调用 `vision_describe`，插件把**本轮图片引用 + 提问**交给**多模态视觉模型**识别；主模型失败时自动用备用模型重试。配置通过官方 settings API 持久化到 profile 条目 `dshp-vision-bridge` 的 `config:`，设置页改动即时热更新，重启不丢。

> 设计原则：**配置只留用户真正要决定的**。视觉模型只有开关、主模型、备用模型三项；详细度是工具参数，单次图片数固定 4 张。图片只存 leaf 字段的 owned copy，会话级 LRU，无密钥、无外部依赖、卸载即干净。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`

```sh
# 1. 克隆 monorepo（lib/ 构建产物已提交，clone 下来就能用，无需 build）
git clone git@github.com:Yinxe/deepseek-harness-plugins.git
cd deepseek-harness-plugins
pnpm install

# 2. 本地安装到 profile（路径按你执行命令时的 cwd 解析）
dsh plugin --profile web add ./plugins/vision-bridge

# 3. 重启生效
dsh web
```

- **更新**：仓库内 `git pull` + `dsh web`（lib 已提交，未改 src 无需 build）。
- **改源码后**：`pnpm --filter @dshp/vision-bridge build` 重打 `lib/host.js + lib/client.js`，再重启；client 半强刷页面即可。
- **验证**：设置 → 视觉模型能看到页面；或先发一张图再问“这张图里有什么？”，纯文本模型应自动调用 `vision_describe`。

**一键 AI 安装**：把下面这段发给你的 DSH AI 即可：

```text
帮我安装视觉桥接插件（monorepo Yinxe/deepseek-harness-plugins，子目录 plugins/vision-bridge，包名 @dshp/vision-bridge）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web add ./plugins/vision-bridge
3. dsh web 重启，确认无报错，设置页出现「视觉模型」即成功
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-vision-bridge-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。旧版 DSH 用户按 [`compat.json`](../../compat.json) 的 tag 到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应 Release：

```bash
# 以 v0.2.0-rc.2 为例（DSH 0.2.0-rc.2）
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.2.0-rc.2/dshp-vision-bridge-v0.2.0-rc.2.tgz

dsh web   # 重启生效
```

## 更新

| 安装方式             | 更新命令                                                          | 说明                          |
| -------------------- | ----------------------------------------------------------------- | ----------------------------- |
| 方式一 clone（推荐） | 仓库内 `git pull` + `dsh web`                                     | 最快；未改 src 免 build       |
| 方式二 Release       | 重跑同一条 `add` 命令 + `dsh web`                                 | URL 直装对 `update` 免疫      |
| 方式三 git 依赖      | `dsh plugin --profile web update @dshp/vision-bridge` + `dsh web` | 一条命令；git 解析约 35s/插件 |

## 功能

| 部分                                          | 内容                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host**（`src/host/` → `lib/host.js`）       | 注册 `vision_describe`；监听 `agent/inbox/inserted` + `llm/stream` 缓存图片（按 `attachmentId` 去重，20 张/会话、50 会话 LRU）；模型发现走 `settings.describe()` + `llm.listConfigurableProviders()` 与 `llm.listProviders()/listModels()` 两条来源；注入系统提示；启用且选好主模型时接管发送门禁；同源 JSON 路由供设置页。 |
| **Client**（`src/client/` → `lib/client.js`） | 「设置 → 视觉模型」：启用开关、主/备模型下拉、刷新列表、测试路由。开关/标签/按钮/菜单全部用官方 `dsh-client-ui-primitives`，颜色走 `--dsw-*` token。                                                                                                                                                                        |
| **同源路由**                                  | `GET /ext/dshp-vision-bridge/state`（模型 + 配置）、`POST /ext/dshp-vision-bridge/config`（保存补丁）、`GET /ext/dshp-vision-bridge/check`（探活主/备路由），均带同源校验与 body 上限。                                                                                                                                     |
| **工具**                                      | `vision_describe`，输出 `{ description, model }`，模型侧渲染为纯文本。                                                                                                                                                                                                                                                      |

### 模型工具：`vision_describe`

| 参数       | 类型      | 必填 | 说明                                                                                                         |
| ---------- | --------- | ---- | ------------------------------------------------------------------------------------------------------------ |
| `question` | `string`  | ✅   | 主模型结合当前对话上下文生成的看图提示词，写清想从图片确认的具体内容；插件原样转给视觉模型，不追加固定后缀。 |
| `image`    | `integer` |      | 只看第几张图（从 1 开始，多图时用）；留空分析本轮最近 4 张。                                                 |

> `question` 是主模型自己生成的提示词：想读报错就写报错，想转录就写“逐字转录”，插件不再提供 `detail` 之类的固定模板。

返回：

```json
{ "description": "视觉模型返回的文本", "model": "provider/model" }
```

### 配置项

| 字段       | 类型                        | 默认   | 说明                                                                              |
| ---------- | --------------------------- | ------ | --------------------------------------------------------------------------------- |
| `enabled`  | `boolean`                   | `true` | 总开关。关闭后 `vision_describe` 直接报错。                                       |
| `primary`  | `{provider, model} \| null` | `null` | 主视觉模型；未选择时 `vision_describe` 临时用候选列表第一项，但发送门禁不会接管。 |
| `fallback` | `{provider, model} \| null` | `null` | 备用模型，主模型失败时重试一次；与主模型相同则不重试。                            |

## 配置视觉模型

候选来自两处并集去重：

1. **设置里的模型目录**：`llm.listConfigurableProviders()` 给出每个 provider 的 `settingsNs` + `settingsPath`，再用 `settings.describe()` 读取 `models[]` 中 `input` 含 `image` 的模型。
2. **运行时 provider**：`llm.listProviders()` + `llm.listModels(provider)` 中 `inputModalities` 含 `image` 的模型。

在 **设置 → 模型** 中编辑多模态模型，勾选 **image** 输入即可。等价 YAML：

```yaml
llm-pi-ai:
  providers:
    openrouter:
      models:
        - id: qwen/qwen2.5-vl-32b-instruct
          name: Qwen2.5 VL 32B
          input: [text, image] # ← 关键：声明支持图片输入
```

保存后回到 **设置 → 视觉模型** 点「刷新列表」。推荐至少配两个视觉模型，一个主模型、一个备用模型。

## 使用

1. **发图**：在对话里粘贴或上传图片（一次可多张）。
2. **提问**：纯文本模型看到占位符后调用 `vision_describe`，把图片和问题一起发给视觉模型。
3. **查看结果**：`description` 以 `tool-result` 回到模型上下文，模型据此继续回答。

进阶：

- 多图时用 `image: 2` 指定第二张。
- 问题由主模型按上下文生成：想读某行报错就写那行报错，想转录就写“逐字转录”，不需要额外开关。
- 设置页的「测试路由」只检查路由可解析性与 image 能力声明，不发起真实推理。

## 验证

```sh
pnpm --filter @dshp/vision-bridge test   # node --check 双 bundle + CSS Module 静态检查
pnpm --filter @dshp/vision-bridge build
```

设置页自检：打开 DSH Web → 设置 → 视觉模型，确认：

- 模型列表出现你在 设置 → 模型 中勾选 image 的模型；
- 切换主/备模型后刷新页面仍保持（持久化）；
- 点「测试路由」显示主/备路由可用。

端到端：发一张截图并问“这张图里有什么？”，观察模型是否调用 `vision_describe` 且返回非空 `description`。

## 工作原理

```
用户发图（content: [{type:'image'}, {type:'text'}]）
  ├─ agent/inbox/inserted ─┐
  └─ llm/stream ───────────┼─→ 图片缓存 Map<sessionId, Map<attachmentId, ImageRef>>
                           │   只存 attachmentId/mediaType/bytes/width/height/name
                           │   按 attachmentId 去重；20 张/会话、50 会话 LRU
纯文本模型看到占位符 → vision_describe({question, image?})
                           ├─ 取会话缓存 → image 序号过滤 / 最近 4 张
                           ├─ question 原样透传（不拼固定后缀）
                           └─ describeWithFallback()
                                ├─ 主模型 → llm.stream({provider, model, messages:[image…, text]})
                                └─ 失败 → 备用模型重试一次（用户取消不重试）
```

关键细节：

- **发送门禁**：启用且选好主模型时包装 `llm.resolveModelInfo`，给缺 image 的模型补上 `inputModalities`，让纯文本模型可以接收图片；请求侧仍由 llm 层按真实能力把图片投影成占位符。探活使用未包装的原函数，避免“自证可用”。
- **模型发现**：0.2.x 的 settings 服务没有 `get(ns)`，统一用 `settings.describe()`；provider 的命名空间和路径来自 `llm.listConfigurableProviders()`，不再硬编码 `llm-pi-ai` / `llm-deepseek`。
- **提示词**：`question` 由主模型结合当前对话生成，插件只做 trim + 4000 字符截断，不写死“描述这张图片”之类的兜底句，也不追加 `detail` 后缀。
- **流式归一**：`text-delta` 增量优先，`block-end` 只在同一 index 没有增量时兜底；`finish` 的 `error` / `aborted` 转成异常，空返回触发 fallback。
- **持久化**：`POST /config` 逐字段校验后调用 `settings.update(NS, patch)`，写入 profile 条目 `config:` 并原地热更新；配置只认 `dshp-vision-bridge`，不读旧 key / 旧文件。

## 配置（`cordis.patch.yml` 覆盖）

```yaml
- id: dshp-vision-bridge
  name: '@dshp/vision-bridge'
  config:
    enabled: true
    primary: { provider: 'openrouter', model: 'qwen/qwen2.5-vl-32b-instruct' }
    fallback: { provider: 'openrouter', model: 'openai/gpt-4o-mini' }
```

## 代码结构

```
src/host/
  index.ts     apply 装配：缓存、门禁接管、系统提示、工具、路由
  config.ts    NS + schemastery Config（3 个 volatile 字段）
  types.ts     领域模型 + llm/settings 最小服务接缝
  http.ts      json / sameOrigin / readBody
  cache.ts     会话图片缓存（去重 + LRU）
  vision.ts    模型发现、单次调用、主备 fallback、问题拼装
src/client/
  index.tsx          只导出 inject / apply，注册 settings.section
  VisionSection.tsx  设置页
  components.tsx     Row + Select
  api.ts             state / config / check 路由封装
  types.ts           协议 + slots/ctx 接缝
  styles.module.css  版式（构建期内联）
lib/host.js          Host 单文件 ESM（提交物）
lib/client.js        Client 单文件 CJS（提交物）
cordis.patch.yml     bundle 挂载行
```

## 常见问题

- **没有可用的视觉模型**：到 设置 → 模型 给多模态模型勾选 image 输入，保存后点「刷新列表」。也可以在条目 `config:` 里直接写 `primary` / `fallback`。
- **报“本轮没有找到可用的图片”**：确认图片是上传/粘贴的附件，不是图片 URL 文本；重试一次让 `agent/inbox/inserted` 重新入缓存。
- **报“视觉桥接已关闭”**：设置页打开开关。
- **设置页没有「视觉模型」**：确认 profile `package.json` 的 `dsh.profile.bundles` 含 `@dshp/vision-bridge`，重启后硬刷新浏览器。
- **从 1.x 升级**：`detail` / `maxImages` / `promptTemplate` 已移除。旧条目 `config:` 里残留的这三个键不会被读取，可手动删除；`primary` / `fallback` / `enabled` 原样可用。图片提示词由主模型按上下文生成，单次图片数固定 4 张。

## 卸载

```bash
dsh plugin --profile web remove "@dshp/vision-bridge"
dsh web
```

配置保存在 profile 条目 `dshp-vision-bridge` 的 `config:`，删除该分节即回默认值。

## 移植说明

本目录是原 `~/.dsh/plugins/vision-bridge/lib/index.js`（JS，816 行）的 TypeScript 重写：

| 原实现                                  | 现文件                                              |
| --------------------------------------- | --------------------------------------------------- |
| `lib/index.js` 的 ctx / 工具 / 路由装配 | `src/host/index.ts`                                 |
| 图片缓存与 block 扫描                   | `src/host/cache.ts`                                 |
| 模型发现 / `llm.stream` / fallback      | `src/host/vision.ts`                                |
| 设置页与同源路由调用                    | `src/client/VisionSection.tsx`、`src/client/api.ts` |

构建：`pnpm --filter @dshp/vision-bridge build`（`lib/` 是提交物，改 `src/` 后必须重打并一起提交）。

## 免责声明

本插件只做图片转交，不存储图片原图，不写入除 profile 条目 `config:` 之外的任何用户文件。视觉模型的费用、额度与内容政策由对应 provider 决定。
