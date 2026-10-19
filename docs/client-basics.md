# Client（浏览器半）规范

> 本文承接旧 AGENT.md §10 的 §10.1–10.2（loader / Section）的完整细节；provider 分层渲染（原 §10.3）、失败提示（原 §10.4）、时间与时区（原 §10.5）见另两篇。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## loader 骨架（注册壳由构建生成，源码是普通 ES 模块）

源码里**不写** `__ModuleLoader__.load`——那层壳是 `tsup.config.ts` 的 banner / footer 拼出来的。
`src/client/index.tsx` 就是一个普通 ES 模块：

```tsx
import { useState } from 'react';
import { DisclosureRow } from '@deepseek-ai/dsh-client-ui-primitives';

export const inject = ['slots'];

export function apply(ctx: ClientContext): void {
  /* 样式注入 + slots.inject(...) */
}
```

构建产物把壳拼在外面（`lib/client.js` 的头尾）：

```js
window.__ModuleLoader__.load({
  id: '@dshp/<name>',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    /* …编译后的产物；external 的 import 变成 require('react') 之类… */
    return module.exports;
  },
});
```

- banner 里的 `id` 必须等于 host 的 `name`（`@dshp/<name>`）。它在 `tsup.config.ts` 里，改包名要两处一起改。
- 槽位注册同上：`slots.inject('settings.section', () => slots.register({ name:'settings.section', id:'dshp-<name>', order: <空位>, label:'中文名' }, Section))`。order 占位表见 docs/scaffolding.md。

### 为什么可以（也应该）写 JSX

`react/jsx-runtime` 是 shell 冻结模块表里**与 `react` 并列的一等成员**，所以 automatic runtime 完全可用，
「jsx 运行时配置漂移」这个顾虑不成立（实测：当前 DSH 0.1.5-rc.1 前端的 `staticModules` 里就有它）。

- **写 `.tsx` + JSX**，不要 `React.createElement`；`useState` / `useEffect` 直接从 `react` import。
- `react` / `react/jsx-runtime` / `@deepseek-ai/dsh-client-ui-primitives` 三个都在 tsup 的 `external` 里，
  **顶层 import 是正确写法**，不会被误打包（external 的 import 编译成 `require(...)`，由 factory 的
  `require` 查 shell 模块表解析；同一个 spec 多次 require 拿到的是同一份，见 `dsh-client-modules` 的
  `makeRequire`：`seed.has(spec)` 直接返回表里的那一个）。
- **官方组件的 props 类型直接 import**：`@deepseek-ai/dsh-client-ui-primitives` 等 SDK 包装成
  **devDependency**（只参与类型检查与构建，运行时仍由模块表注入）。不要再手写 `AnyReact` /
  `AnyPrimitives` 这种 shim——它们等于把前端整体退化成 `any`。
- 组件是**普通函数组件**，不是 `createXxx(React, P, ...)` 工厂。需要跨组件共享的状态（偏好缓存、
  会话覆盖、行号缓存）写在**模块级**：bundle 的 factory 每个插件实例只求值一次，模块级 = 每实例一份。
- **样式写 CSS Module（`src/client/styles.module.css`），不要手拼 CSS 字符串、也不要自己注入 `<style>`**：构建预设会把样式文本与类名映射一起内联进 `lib/client.js`，模块被求值时自动插一条 `<style data-plugin-css>`（卸载由 shell 按 `data-plugin` 清理）。源码里 `import styles from './styles.module.css'`，然后 `className={styles.card}`。
  - **不要加 `fcv-` 这类前缀**。类名构建期被哈希成 `<hash>_<local>`，作用域由工具保证——以前「各段版式的类名集合必须两两不相交」那条人工约定（设置节的 `.fcv-row{padding:16px 0}` 曾打到编辑 / 写入行上、把行撑高 32px）彻底不需要了。
  - 需要**运行时拼**的类名（例如按 callId 生成行底色选择器）留在 CSS Module 之外，用 `dshp-` 前缀并写清原因（见 `FileChangeRow.tsx` 的 `TINT_CLASS_PREFIX`）。
  - **颜色/字号只用 `var(--dsw-alias-*)` token**，不许写死色值（深浅主题靠 token 切换）。

## Section 组件状态机

`useState` 五件套（models/config/loading/saving/error）+ `useEffect` 初次 `load()`。必须覆盖四态：loading（Icon + 「正在读取…」）/ error（红字 notice）/ 空列表（warn notice + 「设置 → 模型 勾选 image 输入」指引）/ 正常表单。

- 开关、状态标签、按钮直接用官方 `Switch` / `Tag` / `Button`；只有官方没有的「标题 + 说明 + 右侧控件」行版式和下拉锚点留在 `components.tsx`（`Row` + `Select`）。新插件缺构件先看 primitives 有没有，没有才在 `components.tsx` 加。
- 保存：即时项直接 `save(patch)`；如遇长文本，`onChange` 只改本地、`onBlur` 才保存。保存中 `disabled`，失败回 error notice 不丢本地值。
- `api.ts` 三函数形态照抄：`fetchState`（`cache: no-store`）/ `saveConfig`（POST json）/ `checkRoutes`。BASE 常量 `/ext/dshp-<name>` 与 host 对齐，类型从 `client/types.ts` 来。

## keyed 槽位与影子化（接管已有渲染时）

- keyed 槽位（如 `tool.call.toolview`）按「key + priority」去重，**同 key 同 priority 会直接抛错**；派发取 priority 升序每个 key 的**第一条**，数值最小者渲染。
- 官方内置行注册时没传 priority（即 0），接管必须用**更小**的负数。file-change-viewer 取 `-1` 是有意的：动态 Cordis 插件的影子优先级也从 -1 起分配，取 -1 意味着「两份注册同时存在时会明确撞车并打日志」，而不是让其中一份悄悄失效。
- 注释（`locale: 'conversation'`）传了才注入 `t`；`t` 缺失时退化成显示键名，不要让行抛错。

## 无头自检

Client 侧「看不见但错了就白屏」的行为（loader 注册结果、渲染树、偏好生命周期）用无头冒烟测试兜住：造一个 `__ModuleLoader__.load` 收集器接住 bundle 的 factory，再配一层迷你 React（见 file-change-viewer `scripts/check-client.mjs`），进 `pnpm test`。

没有那套渲染夹具的插件，至少挂上共用的静态检查 `node ../../shared/scripts/check-css-modules.mjs src/client`：CSS Module 的映射是宽松声明，`styles.拼错` 编译期合法、运行时静默丢 className，这个脚本是唯一会自动红的网。
