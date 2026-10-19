# TypeScript 与代码风格

> 本文承接旧 AGENT.md §2（TypeScript 规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## tsconfig（不许自创）

- 根 `tsconfig.base.json` 是唯一真实配置：`target ES2022` / `module+moduleResolution NodeNext` / `strict` 全开 + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noFallthroughCasesInSwitch` + `noImplicitOverride` + `isolatedModules` + `verbatimModuleSyntax` + `noEmitOnError`。**不许在插件里放宽任何一项**，有报错就修代码，不改配置。
- 插件 `tsconfig.json` 只允许比标杆多两行（client 需要）：

  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": { "noEmit": true, "jsx": "react-jsx", "lib": ["ES2022", "DOM", "DOM.Iterable"] },
    "include": ["src", "tsup.config.ts"],
    "exclude": ["node_modules", "lib", "dist"]
  }
  ```

  纯 host 插件可以不要 `jsx`，但 `noEmit/include/exclude` 格式照抄。

## 类型策略（client 用真实 SDK 类型；host 待迁）

官方 SDK **已经作为 npm 包发布**（`@deepseek-ai/dsh-client-ui-primitives`、`dsh-client-ui-slots`、
`dsh-tool-fs`、`dsh-api-session-controller`…… 版本与运行时同号，如 `0.1.5-rc.1`），所以**能 import
的类型就 import**，不要再手写 shim。

### client 半（已生效，照 file-change-viewer 抄）

- 组件 props 类型直接来自 SDK 声明：`import { DisclosureRow, type DiffBlockLabels } from '@deepseek-ai/dsh-client-ui-primitives'`。
- `AnyReact` / `AnyPrimitives` / `DshRequire` 这类 shim **不再允许**——它们让整个前端退化成 `any`，
  改一个 prop 名字不会有任何编译报错。
- `ctx` 可以保留一个**只含实际用到成员**的本地接口（如 `ClientContext` 的 `get` / `effect`），并注明
  「不 import 整包 cordis 只为两个方法」。逐槽位的 props 检查需要 `SlotMap` 声明合并（由 settings /
  conversation / tool 各自的 UI 包 merge 进来），那是**下一步**。
- 类型不全时按**实现的真实契约**就地收窄一次并写明原因，例如官方 `DisclosureRowProps.title` 声明成
  `string`、实现却是 `children: title`（能放节点）。收窄收在文件内部，不外泄成公共 `any`。
- **官方 primitives 的 `className` 声明不一致**（迁移期踩过）：`Input` / `Modal` 写的是
  `className?: string`（**没有** `| undefined`），而 `Button` / `Tag` / `Switch` / `Menu` / `Pill` 是
  `string | undefined`。在 `exactOptionalPropertyTypes` 下，把 CSS Module 的 `styles.x`（类型就是
  `string | undefined`）直接传进前者会编译不过。解法是**在调用点条件展开**
  （`{...(mono ? { className: styles.mono } : {})}`）或先 `cx()` 收成 `string`——**不要**加 `!`、
  也不要改 `shared/types/css-modules.d.ts`。上游统一后可以简化。
- **官方声明成必填、旧实现却没传的 prop**（迁移期踩过）：旧代码靠 `React: any` 混过去，换成真实类型后
  会直接报错。默认**按运行时原样保留**（不补 —— 补上会改 DOM，属于行为增量），需要时在调用点写一处
  带注释的收窄。唯一的例外是「同一文件里同类调用早就传了它、显然只是漏了一处」（如 mcp-manager 的
  `RiskConfirmationProps.closeLabel`，同文件两处 `Modal` 都传了），那就补齐并在**提交信息里点名**。

### host 半（待迁）

host 侧的迁移**尚未进行**，暂时维持：

```ts
// src/host/types.ts（每个插件必须有）
export type AnyCtx = any;
export type AnySettings = any;
export type AnyLlm = any;
```

- `AnyCtx` 只用于**运行时透传对象**（ctx、service、event payload）。**自有数据结构必须严格建模**：`PluginConfig`、`VisionRoute`、`ImageRef`、tool 参数、路由协议（参考 `host/types.ts` + `client/types.ts`，client 与 host 的路由协议类型保持对齐）。
- `noUncheckedIndexedAccess` 下，`arr[0]` 是 `T | undefined`：用 `as` 收窄前先判空，或写 `const first = models[0] as CandidateModel` 并前置 `length` 检查（照抄 vision-bridge `vision.ts` / `index.ts` 的写法）。
- `exactOptionalPropertyTypes` 下，可选字段赋值 `undefined` 即错：用 `Object.hasOwn` 逐字段覆盖（照抄 `index.ts` 的 patch 合并），不要 `{...patch}` 一把梭。
- 类型守卫就地写：`isRecord(v): v is Record<string, unknown>`，每个 host 模块各持一份，不跨包共享（见 vision-bridge `config.ts`/`cache.ts`/`vision.ts` 顶部）。

## import / 模块风格

- 全仓 ESM：`package.json` 必须 `"type": "module"`；**相对导入一律带 `.js` 后缀**（`from './config.js'`），哪怕源文件是 `.ts`。这是 NodeNext 的硬要求，漏后缀 build 能过、运行时挂。
- `verbatimModuleSyntax`：类型导入必须 `import type { X } from ...`，值和类型混写会被打回。
- `isolatedModules`：不许 `export =` / 常量枚举，`const enum` 禁用。
- host 按职责拆文件：`index.ts` 只做装配（apply + 注册），`types.ts` 类型，`config.ts` 默认值+schema+消毒，`http.ts` 路由小工具，`cache.ts` 状态，业务逻辑独立文件。**单个文件超过 ~600 行就拆**（归档的 token-meter `index.ts` 627 行是上限，不是目标）。
- client 按层拆：`types.ts`（协议 + 领域类型，纯类型）/ `api.ts`（fetch 封装）/ `styles.module.css`（样式，声明是全仓共享的一份）/ `components.tsx`（Badge/Row/Select/Switch 等通用小构件）/ `<X>Section.tsx`（业务）/ `index.tsx`（**只导出 `inject` 与 `apply`**，loader 壳由构建预设生成）。
  通用小构件进 `components.tsx`，别在 Section 里重复造。含 JSX 的文件必须是 `.tsx`，`tsconfig` 的 `jsx: react-jsx` 已经开好。
  跨组件共享的状态（偏好缓存、会话覆盖、缓存订阅）写成**模块级 + 导出的 hook**，不要再造 `createXxx(React, ...)` 工厂。

### CSS Module 的类型（全仓一份宽松声明，不产生按文件的 `.d.ts`）

**开发者侧只有 CSS。** 写 `src/client/styles.module.css`，组件里 `import styles from './styles.module.css'`
然后 `styles.card` 就能用——不需要跑任何命令、不产生任何按文件生成的声明。

声明只有一份，在 [`shared/types/css-modules.d.ts`](../shared/types/css-modules.d.ts)，由
`tsconfig.base.json` 的 `files` 带进每个插件的编译（路径相对 base 解析）。角色相当于 Vue 项目里的
`vite/client`：**框架侧提供声明，业务侧只管写样式**。

它用的是索引签名，所以：

- `styles.card` 的类型是 `string | undefined`（`noUncheckedIndexedAccess`）。绝大多数用法
  （`className={styles.x}`、`styles.a + ' ' + styles.b`）都直接成立；少数把它当 `string` 传进
  自定义接口的地方（如 `DiffBodyClasses`），在那个接口上声明成 `ClassName = string | undefined`
  接纳它，**不要在各调用点加 `!`**。
- `styles.拼错` **不是编译错误**，运行时是 `undefined`，React 静默丢掉 className。这是刻意的取舍：
  精确到键的声明必须按文件生成、还要跟 CSS 同步（TypeScript 不给 `.css` 补 `.d.ts`，得开
  `allowArbitraryExtensions`），那份机械比它挡住的问题更重。拼错的类名由 `scripts/check-client.mjs`
  的渲染断言兜住——它按类名找元素，找不到就是红的。

**不要再走「按文件生成精确 `.d.ts`」那条路**（本仓试过：`styles.module.d.css.ts` +
`allowArbitraryExtensions` + 生成/门禁脚本）。它能给出编译期拼写检查，但代价是每个插件多一个
生成文件躺在 `src/` 里、开发者改完 CSS 得记得重新生成——Django/Vue 那类「只写 CSS」的开发手感
全没了。

## 代码风格（Prettier 即法律）

`.prettierrc`：`singleQuote` / `trailingComma: all` / `printWidth: 110` / `endOfLine: lf`。`.editorconfig`：utf-8、lf、2 空格、尾换行、去行尾空格。

- 跑 `pnpm format` 写盘，不要手调格式；CI 跑 `format:check`，格式不对直接红。
- 字符串拼接用 `+`（标杆风格，oxlint 下稳定），还是模板字符串——**以所改文件现有风格为准，不混用**。
- 注释：文件头写职责 + 挂载点 + 与标杆/原版的对应关系（照抄 `host/index.ts` 头注释格式）；hack 处写清原因（如 opencode sessionId 透传、`__ModuleLoader__` 全局名）。

## oxlint

- 配置在根 `.oxlintrc.json`：correctness 当 error、suspicious 当 warn，`--deny-warnings` 下两者都算挂。
- 全仓仅有的两处 rule-off（`unicorn/consistent-function-scoping`、`eslint/no-underscore-dangle`）是故意的，新插件不许加第三处——需要的先提 issue 讨论。
