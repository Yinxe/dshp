# @dshp/vision-bridge

DeepSeek Harness（DSH）**视觉桥接**插件：让**纯文本模型**也能“看图”——当用户消息中出现图片占位符 ` [image omitted because this model accepts text only…]` 时，模型调用 `vision_describe` 工具，插件把**本轮图片原图引用 + 你的提问**一起转交给**多模态视觉模型**去识别，主模型失败时自动用**备用模型重试**。配置在设置页完成并**通过官方 settings API 持久化到 profile 条目 `dshp-vision-bridge` 的 `config:`**，设置页改动即时热更新，重启后不丢。配置**只认** `dshp-vision-bridge` 一个键：历史命名空间与旧 `storages/*.json` 不再读取、不再迁移（见“更新日志”的迁移提示）。

> 设计原则：**对模型零侵扰、对用户零残留**。图片只取 leaf 字段的 owned copy，会话级 LRU 缓存；无密钥、无外部依赖；卸载即干净。

## 安装

### 方式一（推荐）：克隆 monorepo 安装 —— 更新只需 `git pull`，旧版 DSH 可 checkout tag

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

- **更新**：仓库内 `git pull` + `dsh web`（最快——lib 已提交，未改 src 无需 build）；兼容旧版 DSH：按 [`compat.json`](../../compat.json) 的 tag `git checkout <tag>` 后重跑上面的 add。

> DSH 是最新版就到此为止。只有 DSH 停在老版本才需要先 `git checkout <历史tag>`（对照根目录 `compat.json`，现在是空的，不用管）。

`dsh plugin` 会把包写进 profile 的 `dsh.profile.bundles` —— **无需手动改配置文件**。

**改源码后**：`src/host` 或 `src/client` 改完跑 `pnpm --filter @dshp/vision-bridge build` 重新打出 `lib/host.js + lib/client.js`，然后 `dsh web` 重启（client 半强刷页面即可）。

**验证**：打开 web → 设置 → 视觉模型 能看到卡片；或先发一张图再问“这张图里有什么？”（纯文本模型应自动调 `vision_describe`）。

**一键 AI 安装**：把下面这段发给你的 DSH AI 即可：

```text
帮我安装视觉桥接插件（monorepo Yinxe/deepseek-harness-plugins，子目录 plugins/vision-bridge，包名 @dshp/vision-bridge）：
1. git clone monorepo 并 pnpm install
2. dsh plugin --profile web add ./plugins/vision-bridge
3. dsh web 重启，确认无报错，设置页出现「视觉模型」即成功
```

### 方式二：从 Release 安装（无需 clone；更新需手动重跑命令）

latest 滚动版（跟随 main 最新构建；滚动更新 = 重跑同一条 add 命令）：

```bash
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/latest/dshp-vision-bridge-latest.tgz

dsh web   # 重启生效
```

### 历史版本（兼容旧版 DSH）

main 永远跟随最新 DSH。老版本 DSH 用户装**静态历史版本**：按 `compat.json` 记录的兼容 tag，到 [Releases](https://github.com/Yinxe/deepseek-harness-plugins/releases) 找对应版本 Release（`v*` tag 触发，静态存档、永不滚动），资产名 = `dshp-vision-bridge-<tag>.tgz`：

```bash
# 以 v0.1.5-rc.1 为例
dsh plugin --profile web add \
  https://github.com/Yinxe/deepseek-harness-plugins/releases/download/v0.1.5-rc.1/dshp-vision-bridge-v0.1.5-rc.1.tgz

dsh web   # 重启生效
```

## 更新

### 三种安装方式对应的更新方式

| 安装方式             | 更新命令                                                    | 说明                                                      |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| 方式一 clone（推荐） | 仓库内 `git pull` + `dsh web`                               | 最快；未改 src 免 build；旧版 DSH 用 `git checkout <tag>` |
| 方式二 Release       | 重跑同一条 `add` 命令 + `dsh web`                           | URL 直装对 `update` 免疫；两个 pnpm 坑见根 README         |
| 方式三 git 依赖      | `dsh plugin --profile web update @dshp/\<pkg\>` + `dsh web` | 一条命令；git 解析约 35s/插件（实测）                     |

## 功能

| 部分                                          | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Host（`src/host/` → `lib/host.js`）**       | 注册 `vision_describe` 模型工具；监听 `agent/inbox/inserted` + `llm/stream` 缓存图片（最近 20 张/会话，至多 50 会话）；发现候选视觉模型（`setting.yml` 中 `input: [text, image]` 的模型 + `llm` 服务实时 provider 列表）；`vision_describe` 执行时完成 hint 过滤（sha 前缀或序号）、`maxImages` 截尾、`buildQuestion` 拼装 `detail` + `promptTemplate`、主→备 fallback；注入系统提示引导纯文本模型何时调用工具；暴露同源 JSON 路由供设置页（见下）。**按 0.1.7 契约导出条目 `Config`（schemastery + volatile 字段），`settings.update` 持久化到 profile 条目 `dshp-vision-bridge` 的 `config:`，设置页一改即热更新；**配置只认 `dshp-vision-bridge`，不读历史 key/旧文件**；接管发送门禁（启用且配好主模型时纯文本模型可直接发图，关闭即恢复）。 |
| **Client（`src/client/` → `lib/client.js`）** | 「设置 → 视觉模型」配置页：启用开关、主/备模型下拉（候选来自 Host 发现）、详细度（`auto`/`low`/`high`）、单次最多图片（`1–8`）、追加提示词（失焦保存）、重新读取、检查连通性。UI 全部使用 DSH 官方设计 token（`dsw-alias-*`），与官方设置页风格一致。无额外依赖。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **同源路由**                                  | `GET /ext/dshp-vision-bridge/state`（模型列表 + 当前配置）、`POST /ext/dshp-vision-bridge/config`（保存补丁）、`GET /ext/dshp-vision-bridge/check`（探活主/备路由），均带同源校验（`Origin` 与 `Host` 一致或缺失才放行）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **工具**                                      | `vision_describe`（见参数表），输出 `{ description, model, fallback_used }`，模型侧渲染为纯文本（`description`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### 模型工具：`vision_describe`

当你是**纯文本模型**且用户消息中出现 `[image omitted because this model accepts text only…]` 占位符时**必须调用**，不要猜图、不要让用户换模型。

| 参数         | 类型     | 必填 | 说明                                                                                                                                        |
| ------------ | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `question`   | `string` | ✅   | 你想从图片中知道什么，例如“描述这张截图里的报错信息”或“转录图片中的全部文字”。                                                              |
| `image_hint` | `string` |      | 可选：只分析某一张图。填占位符里的 sha 前缀（附件 `attachmentId` 前缀）或从 `1` 开始的序号；留空则分析本轮全部图片（受 `maxImages` 截尾）。 |
| `detail`     | `enum`   |      | 可选：`auto` 常规描述，`low` 简要概括（2–3 句），`high` 逐字转录级详细。不填用设置页的默认值。                                              |

返回（`output.schema`）：

```json
{
  "description": "视觉模型返回的中文描述（已拼装 detail 后缀与追加提示词）",
  "model": "provider/model",
  "fallback_used": false
}
```

模型侧 `render` 直接展示 `description`，便于在对话流中继续推理。

### 配置项（Host 状态）

| 字段             | 类型                        | 默认                               | 说明                                                                                                     |
| ---------------- | --------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `enabled`        | `boolean`                   | `true`                             | 总开关，关闭后 `vision_describe` 直接抛错提示去设置页启用。                                              |
| `primary`        | `{provider, model} \| null` | `null`（首次发现后自动选列表首项） | 主视觉模型。                                                                                             |
| `fallback`       | `{provider, model} \| null` | `null`（自动选第二项）             | 备用模型，主失败时重试一次。设为 `null` 表示不重试。                                                     |
| `detail`         | `'auto' \| 'low' \| 'high'` | `'auto'`                           | 默认详细度；`high` 会追加“逐字转录”后缀，`low` 追加“简要概括”。                                          |
| `maxImages`      | `1–8`                       | `4`                                | 单次 `vision_describe` 最多喂给视觉模型的图片张数，超出取末尾若干张（最新）。                            |
| `promptTemplate` | `string`                    | `''`                               | 可选追加提示词，每次识别都会拼在问题末尾（截断 500 字符，存储上限 2000）。例如“重点看报错弹窗里的红字”。 |

> **与动态版的区别**：动态（`cordis_define`）版本的配置只在内存中，重启进程后恢复默认；**标准包版本通过官方 `settings` API 持久化到 profile 条目 `dshp-vision-bridge` 的 `config:`**，重启后不丢；设置页改动即时热更新，外部手工编辑条目 config 重启后生效。

## 发布到 npm（可选，当前未发布）

现在没发 npm，所以上面只能本地装。以后想 `pnpm add @dshp/vision-bridge` 一键装，才需要发包：先建 npm 组织 `@dshp`（见根 README），再打 tag 走 CI 的 Trusted Publishing。发完这里的安装方式会同步更新。

## 配置视觉模型（`setting.yml`）

本插件的候选来自**两个来源的并集去重**（按 `provider/model` 字典序）：

1. **配置层**：`settings` 服务中 `llm-pi-ai` / `llm-deepseek` 命名空间下，`providers[].models[]` 里 `input` 含 `image` 的模型。
2. **运行时**：`llm.listProviders()` + `llm.listModels(provider)` 中 `inputModalities` 含 `image` 的模型。

因此你只需在 `setting.yml` 里给**多模态模型**加上 `input: [text, image]`，保存后在设置页点“重新读取”即可出现。请参考现有 `setting.yml` 中 `llm-pi-ai` 的写法：

```yaml
llm-pi-ai:
  providers:
    openrouter:
      models:
        - id: qwen/qwen2.5-vl-32b-instruct
          name: Qwen2.5 VL 32B
          input: [text, image] # ← 关键：声明支持图片输入
        - id: openai/gpt-4o-mini
          name: GPT-4o mini
          input: [text, image]
```

> 未配置 `input: [text, image]` 时，设置页会提示“没有在 setting.yml 里找到 input 含 image 的模型”，且 `vision_describe` 在无 `primary`/`fallback` 时会尝试自动选列表首项；若列表为空会抛“没有可用的视觉模型”并指引去设置页。

**推荐**：至少配两个视觉模型，一个作 `primary`，一个作 `fallback`，主失败时自动重试一次。

## 使用

1. **发图**：在对话里直接粘贴或上传图片（支持一次多张，最多 8 张，受 `maxImages` 限制）。
2. **提问**：纯文本模型看到占位符 `[image omitted because this model accepts text only…]` 后，会自动调用 `vision_describe`，把你的问题（如“这里报错是什么意思？”、“把图里的文字都转录出来”）连同图片一起发给视觉模型。
3. **查看结果**：`vision_describe` 返回的 `description` 会以 `tool-result` 形式回到模型上下文，模型据此继续回答。你也可以在设置页手动点“检查连通性”验证主/备路由是否可达。

**进阶**：

- 多图时可用 `image_hint` 指定某一张：填占位符里显示的 sha 前缀（如 `a1b2c3`）或序号（`1` 表示本轮第一张）。
- 需要更详细或更简要时，传 `detail: high`（逐字转录）或 `detail: low`（2–3 句概括），或在设置页改默认 `detail`。
- 有固定偏好（如“总是关注右上角的水印”“转录时保留换行”）可写进设置页的“追加提示词”，每次识别自动拼在问题末尾。

## 验证（不依赖手工发图）

- **语法自检**：

  ```sh
  pnpm --filter @dshp/vision-bridge test   # node --check lib/host.js + lib/client.js
  # 或直接：node --check plugins/vision-bridge/lib/host.js && node --check plugins/vision-bridge/lib/client.js
  ```

- **设置页自检**：打开 `http://127.0.0.1:3080`（或你的 `dsh web` 端口）→ 设置 → 视觉模型，查看：
  - 模型列表是否出现你配置的 `input: [text, image]` 模型；
  - 保存主/备后刷新页面是否仍保持（持久化）；
  - 点“检查连通性”是否显示 `✅ … 路由可解析`。

- **端到端**：发一张 `vision_test.png`（仓库根有示例）并问“这张图里有什么？”，观察模型是否调用 `vision_describe` 且返回非空 `description`。

## 工作原理

```
用户发图（attachment + content: [{type: 'image'}, {type:'text'}]）
  ├─ agent/inbox/inserted 事件 ─┐
  └─ llm/stream 请求消息 ───────┼─→ vision-bridge Host 缓存
                                │   imageCache: Map<sessionId, Array<leafAttachment>>
                                │   仅取 leaf 字段（attachmentId/mediaType/bytes/width/height/name）
                                │   会话 LRU 20 张/50 会话
                                │
纯文本模型看到占位符 → 必须调用 vision_describe({question, image_hint?, detail?})
                                │
                                ├─ 读 sessionId → 取缓存 → hint 过滤（sha 前缀 / 序号） → maxImages 截尾
                                ├─ buildQuestion(question, detail) = question + detail 后缀 + promptTemplate
                                └─ describeWithFallback(images, question)
                                     ├─ 无 primary/fallback 时 → listVisionModels() 首项兜底
                                     ├─ runOneVision(primary) → llm.stream({provider,model,messages:[{image…,text}]})
                                     └─ 失败则 runOneVision(fallback) 重试一次
                                         stream 归一：text-delta 优先，兼容 block-end，finish {kind:error/aborted} 抛错
```

关键细节：

- **系统提示**：`systemPrompt.section('dshp-vision-bridge', order: 80)` 注入视觉能力说明，模型无需用户提醒即可知道何时调用工具。
- **图片引用**：`vision_describe` 内部把缓存的 `attachment` 原样作为 `content: [{type:'image', attachment}]` 发给视觉模型，复用 DSH 附件管线，无需 base64 重编码。
- **流式归一**：兼容 `text-delta` 增量与 `block-end` 全量，并在 `finish` 中处理 `error`/`aborted`，空返回视为失败以触发 fallback。
- **持久化（官方推荐）**：`POST /ext/dshp-vision-bridge/config` 每次保存后通过 `ctx.settings.update('dshp-vision-bridge', patch)` 写入 profile 条目 `dshp-vision-bridge` 的 `config:`（编辑器保留注释与格式），并以 `loader/volatile-update` 原地热更新。启动时按 schema 默认值 → composition 继承层 → 条目 `config:` 三级合并校验。旧版 `storages/dshp-vision-bridge.json` 与旧 key 自 v1.5.0 起**不再读取**（不自动改名、不迁移），需要旧值时手工把旧分节内容并到条目 `config:` 下。

## 配置（`cordis.patch.yml` 覆盖）

`patch` 层可覆盖默认值（可选，设置页保存后持久化会覆盖此处）：

```yaml
- id: dshp-vision-bridge
  name: '@dshp/vision-bridge'
  config:
    enabled: true
    primary: { provider: 'openrouter', model: 'qwen/qwen2.5-vl-32b-instruct' }
    fallback: { provider: 'openrouter', model: 'openai/gpt-4o-mini' }
    detail: auto # auto | low | high
    maxImages: 4 # 1–8
    promptTemplate: '重点看报错弹窗' # 可选，≤2000 字符
```

> 设置页的保存会覆盖同名字段并落盘到 profile 条目 `dshp-vision-bridge` 的 `config:`；旧 `storages/*.json` 与历史旧 key 不会被读取，也不会有任何自动备份/改名（需旧值请手工搬运）。

## 代码结构

```
lib/host.js         Host 半：顶部同源小工具（settingsNamespace/json/sameOrigin/readBody，本包自有）+ 图片缓存 + 模型发现 + vision_describe 工具 + 系统提示 + 同源路由 + 持久化
lib/client.js       Client 半：__ModuleLoader__ bundle（单文件 CJS，loader 壳由构建预设拼出），设置页 UI（DSH token 样式，fetch 同源路由）
cordis.patch.yml    bundle 层 patch：仅 insert 挂载行
package.json        包描述 + DSH bundle 声明（dsh.bundle.patch / dsh.client.platform）
README.md           本文件
```

## 常见问题

- **纯文本模型下发不出图片（“当前模型不支持图片”）**：拦的是服务端发送门禁（`MODEL_DOES_NOT_SUPPORT_IMAGES`），不是输入框禁用粘贴。本插件 v1.1.0+ 在“启用且配好主视觉模型”时自动接管该门禁（状态卡“发送门禁”显示“桥接接管中”），纯文本模型可直接发图；若显示“未接管”，请先启用桥接并选择主模型。接管只负责放行，真实请求仍按文本模型投影为占位符，再由 `vision_describe` 桥接。
- **设置页没有“视觉模型”卡片**：确认 profile `package.json` 的 `dsh.profile.bundles` 含 `@dshp/vision-bridge`，且依赖已装上；重启 `dsh web` 后硬刷新浏览器。
- **报“本轮没有找到可用的图片”**：图片未作为附件发送（重试一次），或模型连续调用时会话 `sessionId` 未正确传递。确认图片是“上传/粘贴”而非“图片 URL 文本”，并让模型把占位符里的 sha 前缀填进 `image_hint` 重试。
- **报“视觉桥接已在设置页关闭”**：设置页把“启用视觉桥接”勾上并保存。
- **报“没有可用的视觉模型”**：见“配置视觉模型”一节，给视觉模型加 `input: [text, image]`，然后点“重新读取”。
- **“检查连通性”报“提供方未注册”**：`provider` 拼写错误或该 provider 未在 `setting.yml` 中配置。
- **图片识别总是走 fallback**：主模型名/路由错误或余额不足，查看 `dsh web` 日志中 `[dshp-vision-bridge]` 相关错误；保存后主模型会持久化在 profile 条目 `dshp-vision-bridge` 的 `config:` 里，改对后重新检查。
- **`WEB_DUPLICATE_PROVIDER` / 工具重复**：同一插件同时存在动态（`cordis_define` 的 `dshp-vision-bridge`）与静态（本包）两份，请 `cordis_undefine` 掉动态版本，再重启 `dsh web`。
- **报 `MissingSessionID`（`x-opencode-session` 缺失）**：opencode 系（go/zen）自 2026-09-06 起强制要求会话头。v1.3.1+ 已把会话 ID 透传给 `llm.stream`；但 `openai-completions` 协议的提供方还需在 profile 条目 `llm-pi-ai` 的 `config:` 里为 `opencode-go` / `opencode-zen` 打开会话亲和头（`cordis.patch.yml` 手写后重启生效），否则透传的 ID 不会被发到网关：
  ```yaml
  - id: llm-pi-ai
    config:
      providers:
        opencode-go:
          compat:
            sendSessionAffinityHeaders: true
        opencode-zen:
          compat:
            sendSessionAffinityHeaders: true
  ```
  保存后重试。等不及可先把主视觉模型切到 `bigmodel-vision / glm-4.6v-flash`（不走 opencode，不过审此限制）。
- **想改识别风格**：设置页“追加提示词”写偏好（如“用中文分点、保留表格”），或调用时传 `detail: high` / `low`。

## 卸载

```sh
dsh plugin --profile web remove "@dshp/vision-bridge"
dsh web
```

`remove` 会自动从 `dsh.profile.bundles` 撤下挂载（monorepo 本体不用删）。设置页配置已落盘到 profile 条目 `dshp-vision-bridge` 的 `config:`，按需手动清理；旧 `storages/*.json` 与历史旧 key 不会被读取，可自行删除。

## 更新日志

- **v1.8.0**：跟 DSH 0.2.0-rc.2 基线——`@deepseek-ai/dsh-client-ui-primitives` devDep 升 `0.2.0-rc.2`（cordis peer 4.0.2 → 4.0.4，仓库 `pnpm-workspace.yaml` 用 `overrides` 对齐）。0.2.0 系列的 primitives 对本插件用到的原语是纯新增，**源码零改动**，只重打 `lib/`。

- **v1.7.0**：适配 DSH 0.1.7（rc.1）——Host 按新契约导出条目 `Config`（schemastery 字段全部 `.volatile()`），废弃 `installSection`/`setSource`；设置页注册改走 `settings.configure({ auto: false }, ctx.fiber)`；设置改动经 `settings.update` 写入 profile 条目 `dshp-vision-bridge` 的 `config:` 并由 `loader/volatile-update` 即时热更新（手工编辑条目 config 重启生效）。peer 升 `^0.1.7-rc.1`（rc.1 起装载前会校验 peer 范围）。

- **v1.5.0**：**移除全部历史配置迁移**——不再把 `vision-bridge` / `dshp-inx-vision-bridge` 顶层 key 重命名为 `dshp-vision-bridge`，也不再读取/备份旧 `storages/dshp-inx-vision-bridge.json`。配置只认 `dshp-vision-bridge`：老用户如需保留旧值，请手工把旧分节改名或把内容并到新分节（旧 key 里 `{}` 之外的字段不会被自动搬运）。

- **v1.4.0**：组织规范化——包名由 `@dshp-inx/vision-bridge` 改为 `@dshp/vision-bridge`（monorepo `plugins/vision-bridge`），cordis 行 id / settings 命名空间 / `/ext/*` 路由同步为 `dshp-vision-bridge`。当时提供 `settings.yaml` 里 `vision-bridge` / `dshp-inx-vision-bridge` 的自动重命名与 `storages/dshp-inx-vision-bridge.json` 自动迁移（**该自动迁移已在 v1.5.0 移除，见上**）。升级后请把 profile 的 `cordis.patch.yml` 里旧 id 换成 `dshp-vision-bridge`（见“安装”节重装一次最省事）。

- **v1.3.0**：settings 命名空间跟上插件前缀——`settings.yaml` key 由 `vision-bridge` 改为 `dshp-vision-bridge`，与包名 `@dshp/vision-bridge` / 路由 `/ext/dshp-vision-bridge/*` / cordis 行 id / 日志前缀保持一致；启动时自动把旧 `vision-bridge` 顶层 key 重命名（**该自动迁移已在 v1.5.0 移除**），旧 `storages/dshp-vision-bridge.json` 迁移逻辑当时保持不变。

- **v1.2.0**：命名空间化——cordis 行 id、`/ext/*` 路由、effect label、日志前缀、系统提示 section、设置 section id、持久化文件统一加 `dshp-vision-bridge` 前缀（旧 `vision_bridge.json` 不再读取，可手动删除；默认启用，首次发现模型后自动选中主/备并落盘新文件）；包名 `@dshp/vision-bridge` 与工具名 `vision_describe` 保持不变。

- **v1.1.0**：接管发送门禁——启用且配好主模型时，纯文本模型可直接发送图片（此前被 `MODEL_DOES_NOT_SUPPORT_IMAGES` 拒收）；设置页状态卡新增“发送门禁”行；`GET /ext/dshp-vision-bridge/state` 新增 `admissionTakeover` 字段。

## 移植说明

> **Monorepo + TS 版**：本目录是 `deepseek-harness-plugins` monorepo 的标准子项目（`plugins/vision-bridge`），由 `~/.dsh/plugins/vision-bridge`（JS，v1.3.2）等价 TS 重写移植。
>
> - Host：原 `lib/index.js`（816 行）→ `src/host/{types,http,config,cache,vision,index}.ts`，tsup 打包为单文件 `lib/host.js`（ESM，schemastery 内联，运行时零依赖），导出 `{ name, inject, NS, ConfigSchema, apply }` 与原版一致。
> - Client：原手写 `client.js`（374 行）→ `src/client/{types,api,components,styles.module.css,VisionSection,index}`（`.tsx` + JSX，不再是 `React.createElement` 工厂），构建为单文件 `lib/client.js`（CJS + 构建预设拼的 `__ModuleLoader__.load` 壳，react / react/jsx-runtime / primitives 运行时注入不打包）。官方组件的 props 类型直接来自 `@deepseek-ai/dsh-client-ui-primitives`（devDependency，见 `docs/client-basics.md`）。

> 构建：`pnpm --filter @dshp/vision-bridge build`（tsup）→ `lib/host.js` + `lib/client.js`；包入口 `lib/host.js`，`./client` → `lib/client.js`。`lib/` 已提交（DSH `add github:` 直接从 git 安装，不跑 build，必须带构建产物）。

## 免责声明

- 本插件与所有视觉模型提供方（OpenRouter、OpenAI 等）无隶属关系；模型能力与计费以提供方为准。
- 图片仅在本地会话缓存中短暂留存（最近 20 张/会话），随进程重启清空；除转发给视觉模型外不上传至其他远端。
- 请遵守各模型提供方的内容政策与隐私要求，勿发送敏感信息。
