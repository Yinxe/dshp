# 配置与 settings 持久化（0.1.7 契约）

> 本文承接旧 AGENT.md §7（配置与 settings 持久化规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。
> **0.1.7 破坏性变更**：`settings.installSection()` 已整体移除。配置的家从 settings.yaml 迁到 **profile `cordis.patch.yml` 条目的 `config:`**，由 Host 半导出的 `Config` schema 在校验期强制；旧 settings.yaml 由平台一次性自动导入（代码侧无动作）。

## 命名空间（配置键名唯一范式）

- 配置键名 = NS = `dshp-<name>`（kebab-case，`^[a-z][a-z0-9-]*$`，vision-bridge `http.ts` 的 `settingsNamespace()` 做运行时校验）。
- NS 四处同名：settings 命名空间 / 路由前缀 `/ext/dshp-<name>/*` / `cordis.patch.yml` id / settings.section id。这是定位插件状态的唯一钥匙，改名即 breaking。**0.1.7 起它同时是 `settings.update(NS, patch)` 的路由键**（NS 必须等于 profile 条目 id）。
- **只认 NS、只有一个键名**：schema 经 `export const Config` 上交给 cordis、`settings.update(NS, patch)` 写入、`getConfig()` 只读 `apply` 收到的 volatile 引用。除 `NS` 定义处外**禁止硬编码任何键名字符串**；历史旧键（`dshp-inx-*`、改名前的旧 NS）**不得出现在代码里**，也不许为它写兼容读写。

## Schema + volatile（新四件套）

```ts
// config.ts —— 每个可写字段必须 .volatile()，否则 settings.update 抛 "not volatile"
export const ConfigSchema: any = z.object({
  enabled: z.boolean().default(true).volatile(),
  primary: z
    .union([VisionRouteSchema, z.const(null)])
    .default(null)
    .volatile(),
  fallback: z
    .union([VisionRouteSchema, z.const(null)])
    .default(null)
    .volatile(),
});
```

```ts
// host/index.ts —— 导出 + 页面策略 + 引用读取
export const Config: unknown = ConfigSchema; // cordis 用它校验条目 config 并派生设置表单

export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  ctx.inject(['settings'], (sctx) => {
    try {
      // 自带 settings.section 页面 → auto:false；纯 schema 表单的插件删掉整块即可
      sctx.effect(() => sctx.settings.configure({ auto: false }, ctx.fiber), 'dshp-<name>: settings-page');
    } catch (error) {
      console.error('[dshp-<name>] 注册 settings 页面策略失败：', error);
    }
  });
  const getConfig = () => ({ enabled: config.enabled.get() /* 逐字段 .get() */ });
}
```

- 每个字段都要 `.default(...)`；约束进 schema（`min/max/step`、enum 用 `z.const` 联合），不要只在路由里判——设置页表单和手工编辑条目 `config:` 都走同一 schema。
- 只放用户真的会改的字段：vision-bridge 只留 `enabled` / `primary` / `fallback`；图片提示词由主模型按上下文生成，单次图片数固定 4 张。
- **volatile 引用类型建模**：types.ts 里配置视图写成 `{ x: Volatile<T> }`（`import type { Volatile } from '@deepseek-ai/cosmokit'`）；`.get()` 返回深只读快照，业务读路径按快照消费。数组/嵌套对象字段整体 `.volatile()` 即可，**嵌套 volatile 禁止**。
- **非法配置 = 整个条目不装载**（行为变化）：装载期校验失败即拒绝启用该条目并给中文报错，不再有旧版「逐字段回退默认」的 `sanitizePatchConfig` 主链路。读路径只保留 schema 证明不了的防御（别名归一、跨字段夹取等）。
- **0.2.x 读配置**：`settings.get(ns)` 已移除。需要读其他插件命名空间（如 vision-bridge 发现视觉模型）时用 `settings.describe({ redactSecrets: true })`，按 `ns` 找 descriptor，再按 `llm.listConfigurableProviders()` 的 `settingsPath` 定位 provider profile；不要硬编码 `llm-pi-ai` / `llm-deepseek`。
- **热更新走 `loader/volatile-update`**：`settings.update` 提交后 loader 把新值原地写进 volatile 引用并在本插件 fiber 派发该事件；开关承重逻辑（注册/反注册工具、重绑提供方）监听它重新判定，**不重启即生效**。旧 `setSource` / `onChange` / `settings.get(NS)` 权威读技巧全部作废。
- 写入统一 `await settings.update(NS, patch)`（签名兼容，revision 第三参本地单用户可不传）；model-tool 写路径要容忍并如实上报 `SettingsConflictError`（code `SETTINGS_CONFLICT`）。
- **固定不变的东西不进 settings**：外部端点、版本号、魔法数字一律写死为具名常量（如 mcwiki-search 的 `API_BASE = 'https://zh.minecraft.wiki/api.php'`，注释写「不可配置，换站改这里重 build」）。settings 只放用户真的会改的东西——每多一个配置项，就是多一份文档、多一个设置页控件、多一处校验。

## 不做迁移（改名/重构由用户手动完成）

**插件永不迁移历史配置**：不扫 settings.yaml，不读 `storages/*.json`，不认旧 key，不写回用户文件。

- **settings.yaml 的一次性导入是平台的事**：0.1.7 的 dsh-settings 启动时把旧 settings.yaml 的 NS 分节导入 profile 条目 `config:` 并把文件改名 `settings.yaml.imported`——插件代码侧零动作，也不许自己读那个文件。
- 配置来源只有三层：schema 默认值 → composition 继承层（bundle/base）→ **profile 条目 `config:`**（含 volatile 提交）。缺字段回默认值，schema 之外的键不动、不删。
- 改名（NS / 包名 / 路由）是 **breaking**：老用户要么手动把旧分节改名/重配，要么接受回默认值。迁移步骤只写在 README 的更新日志里，**不写进代码**。
- 禁止出现：`LEGACY_SETTINGS_KEYS` / `migrateYamlNamespaceKey(s)` / `loadPersisted` / `planLegacyAdoption` / `sanitizePersisted` 这类为旧版服务的东西，以及任何 `readFileSync(settings.yaml)`、`existsSync(storages/…)`、`settings.update` 回写历史值的路径。
- 旧插件目录、旧 key、旧 `storages/*.json` 都由用户自行删除；插件启动不因它们存在或不存在改变行为。
- 只读的**值级兼容**仍可保留（例：token-meter provider `type` 别名 `registerAlias`、legacy 渲染兜底），但必须写在读路径上、**不落库、不改写用户文件**。

## 派生缓存不是用户配置（唯一的例外形态）

token-meter 的统计聚合缓存走 `ctx.storageDomain` 域 `token_stats`：域名只允许小写字母/数字/下划线，且**改名会废掉已有缓存触发全量重扫**，所以域名保持原样、不随 NS 改名。要点：

- 缓存 = **可丢的派生数据**（丢了凭会话日志自动重算），不是配置；
- 域名一旦定了不改（改名即缓存全废）；
- 写入范围仍限 `$DSH_HOME/storages/`，不碰用户其他文件。
