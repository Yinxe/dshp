# Cordis Host 插件契约

> 本文承接旧 AGENT.md §6（Cordis Host 插件规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 导出契约（0.1.7）

```ts
export const name = '@dshp/<name>'; // = package.json name
export const inject: string[] = ['tools', 'webServer', 'llm']; // 按需删减，只声明真需要的
export { NS, ConfigSchema }; // 用 settings 才导出
export const Config: unknown = ConfigSchema; // 0.1.7：cordis 装载期校验 + 设置表单派生
export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  /* 结构见下；可写字段是 Volatile<T> 引用 */
}
```

- `name` 必须等于包名；`cordis.patch.yml` 的 `id` 用短横线小写（`dshp-<name>`），与 settings NS 同名（见 docs/settings.md）。0.1.7 起这个 id 还是 `settings.update(NS, …)` 的路由键。
- `inject` 只声明**硬依赖**（缺了插件无法工作的 service）。可选 service 一律 `ctx.get()` + 判空，不进 `inject`（否则 service 未挂载时插件无限 waiting）。
- **条目 config 非法 = 整个条目不装载**（0.1.7 行为）：schema 校验失败会拒发条目并给中文报错，不再有「逐字段回退默认」，所以 `apply` 里不做装载期消毒。

## apply 结构（顺序固定）

照抄 vision-bridge `host/index.ts` 的分段顺序：① `export const Config`（schema 上交 cordis）→ ② `ctx.inject(['settings'], … settings.configure({ auto: false }, ctx.fiber) …)`（自带 settings.section 页面才需要 auto:false；纯表单页删掉整块）→ ③ 内部 helpers（`getConfig()` 逐字段 `config.x.get()`、snapshot/ensureDefaults）→ ④ 缓存/监听（热更逻辑监听 `loader/volatile-update`）→ ⑤ 门禁/补丁 → ⑥ systemPrompt → ⑦ tools.register → ⑧ webServer.register。每段一个 `// ── 中文标题 ──` 分隔注释。**不设「迁移旧状态」段**：插件只认自己的 NS，不读历史 key、不读旧文件（见 docs/settings.md 的「不做迁移」节）。

旧版时序技巧作废说明：`installSection` / `setSource` thunk / `settings.get(NS)` 权威读（file-change-viewer 曾用来躲 attach/detach 竞态）在 0.1.7 全部不存在——loader 在提交期把新值**原地写进 volatile 引用**再派发 `loader/volatile-update`，开关判定直接 `config.<field>.get()` 就是权威值。

## 服务访问：get 优先，ctx.xxx 只在 inject 后

```ts
const settings = ctx.get('settings') as AnyCtx; // 可选依赖：判空
if (!settings) throw new Error('中文可操作提示…'); // 或降级
ctx.inject(['settings'], (sctx) => {
  sctx.effect(() => sctx.settings.configure({ auto: false }, ctx.fiber), 'dshp-<name>: settings-page');
}); // 硬依赖才用 inject
```

- 绝不 `JSON.stringify` 整个 ctx/service（live 对象，dump 即爆栈或泄漏）；只取 leaf 字段，构造成最小 owned 对象（标杆 vision-bridge `copyAttachment` 只取 6 个字段）。
- 运行时 monkey-patch（如 vision-bridge 的 `resolveModelInfo` 接管）必须：保存原函数、`ctx.effect` 返回恢复函数、启动时 `console.info` 一行说明。能用官方事件/hook 就不用 patch。
- 官方包**不要 import**：插件产物跑在用户仓库里，运行时 import 官方包要看 Node 解析路径（profile 的 node_modules 不是插件真实路径的祖先），解析不到就是整个 Host 半加载失败。要官方语义就等价移植（见 file-change-viewer `src/host/sandbox-escalation.ts` 的做法），只依赖 `ctx.get('sandboxPolicy')` / `ctx.get('approval')` 这类服务接缝。

## 副作用全部进 ctx.effect（带 label）

```ts
ctx.effect(() => ctx.on('agent/inbox/inserted', handler), 'dshp-<name>: cache inbox images');
ctx.effect(() => slotsOrServerRegister(...), 'dshp-<name>: state route');
```

- 每个 `ctx.on` / `tools.register` / `webServer.register` / `systemPrompt.section` / 样式注入 / 函数 patch 都必须包在 `ctx.effect` 里，label 格式 `'dshp-<name>: 动词 + 对象'`。无 label 的 effect 打回。
- `apply` 顶层**不许抛**：每个注册块独立 `try/catch`，失败 `console.error/warn` 一行中文可操作信息，插件其余功能继续工作（照抄标杆每段末尾的 `catch {/* ignore */}` + 日志）。

## 数据消毒（sanitize* 是强制函数）

0.1.7 起条目 config 由 `Config` schema 在装载期强制校验（非法即条目不装载），**不再需要** `sanitizePatchConfig` / `sanitizePersisted` 这类装载期逐字段回退；消毒重心全部移到**路由入口与外部读回**（照抄标杆签名风格）：

- 路由 body 消毒：`Object.hasOwn` 逐字段、字符串 `.slice(0, N)`、数字 `Math.floor` + 范围夹，非法抛中文 Error（见 docs/ext-routes.md）。示例：`sanitizeWorkspaceRoot` / `sanitizePatchFilePath` / `sanitizeServerConfig`（含 `!!js` 标记与 LIMITS 截断）。
- schema 证明不了的**读路径防御**保留：跨字段归一（如 token-meter 的 provider `type` 别名 `canonicalType`）、值域夹取（`normGapMin`），写在 `getConfig()` 消费处而非装载期。
- tool `execute` 参数同样逐字段校验：必填缺失/类型不对抛中文 Error，写清「去哪里改」（标杆：`'视觉桥接已在设置页关闭，请先启用后再调用'`）。

## 日志与错误信息

- 日志前缀统一 `[dshp-<name>]`，`console.info` 记接管/就绪成功，`console.warn` 记降级/重试，`console.error` 记注册失败。启动路径上不超过 3 行日志，别刷屏。
- 抛给模型/用户的 Error 必须中文、可操作、指路（设置页路径 / setting.yml 写法 / 重试动作）。英文技术细节可附在冒号后，但首句必须是人话。

## 模型工具（tools.register）

```ts
ctx.tools.register({
  name: 'vision_describe',            // 动词_名词，全小写下划线
  description: '…何时必须调用…',       // 首句写触发条件（含占位符原文），模型靠它决策
  parameters: { type: 'object', additionalProperties: false, properties: {...}, required: [...] },
  output: { schema: {...}, render: (_args, value) => [{ type: 'text', text: String(...) }] },
  isConcurrencySafe: () => true,      // 只有证明无共享可变状态才 true（vision-bridge 只读缓存）
  async execute(args, exec) { /* 校验 → 取缓存 → 截尾 → 调用 → 返回最小对象 */ },
});
```

- `description` 必须包含触发信号原文（如占位符 `[image omitted because this model accepts text only; attachment sha256:…]`）+「不要猜图」禁令，否则纯文本模型不会调。
- `parameters`/`output.schema` 都要 `additionalProperties: false` + `required` 显式列；输出只返回契约字段（`{ description, model }`），`render` 转纯文本块。
- `execute` 内（以 vision-bridge 为例）：先判总开关 → 校验必填 → 取 `exec.agent.id` 会话 → `image` 序号过滤（非法抛中文 Error）→ 无序号时取最近 4 张 → `question` 原样透传（只 trim + 截断，不拼固定后缀）→ 主→备 fallback（备与主相同则跳过）→ 空结果/调用失败抛中文 Error。
- 图片/附件只存 **owned copy**（`attachmentId/mediaType/bytes/width/height/name`），会话级 LRU（每会话 ≤20 张、全内存 ≤50 会话，超限丢最旧）。不存原图 bytes，不落盘。
- 监听补缓存双通道：`agent/inbox/inserted`（同步扫 `message.content`）+ `llm/stream`（扫 `messages[].content`，记得 `return next()`）。扫块递归要处理 `tool-result` 嵌套（照抄 vision-bridge `walkBlocks`）。
- 结果元数据想要差异卡片（`meta.diffs`）：在 `output.presentationMeta(args, value)` 里投影（见 file-change-viewer `src/host/patch-tool.ts`）。

## 斜杠命令（commands，可选服务）

已归档的 mcwiki-search 的 `/mcwiki` 是范式：`ctx.get('commands')` 判空跳过；`ctx.commands.register` + `definitionId` + `input.hint`；handler 返回 `CommandResult`（可 Promise）。设计约束：单命令单动作（不做子命令——输入框不为子命令补全，用户发现不了）；输出 Markdown 时可配合 `conversation.chat.commandview` 槽位（按命令名 keyed）做自定义卡片。
