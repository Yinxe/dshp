# archive/file-change-viewer — 局部规则（已归档）

> **已归档（2026-10-20），不再维护。** 仅作历史参考，不再适配新版 DSH。

> 接管工具行渲染（keyed 槽位影子化）的标杆。上层：[根 AGENT.md](../../AGENT.md) → [docs/](../../docs/)。本文只写本插件自己的事实与局部约定。

## 身份

| 项       | 值                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------- |
| 包名     | `@dshp/file-change-viewer`                                                                            |
| NS       | `dshp-file-change-viewer`（四处同名）                                                                 |
| 设置节   | `settings.section` order **31**，label「File Change View」                                            |
| 接管槽位 | `tool.call.toolview` keyed：`edit` / `write` / `str_replace_editor` / `patch`，影子化 priority **-1** |
| 页头槽位 | `conversation.session.header.utilities` order **20**（会话级覆盖：一键展开 / 收起 + 换差异视图）      |
| inject   | `['webServer']`（settings/tools/fs 走可选注入）                                                       |
| 原实现   | 无（本仓原生），`patch` 工具语法移植自 opencode `apply_patch`                                         |

## 结构与职责

- `src/host/`：`index.ts`（apply：settings NS + 三路由 + patch 工具动态开关）/ `config.ts` / `routes.ts`（state / config / locate）/ `patch-tool.ts`（`*** Begin Patch` 工具）/ `sandbox-escalation.ts`（官方沙箱逻辑的等价移植，**不 import 官方包**，只依赖 `ctx.get('sandboxPolicy')` / `ctx.get('approval')` 服务接缝）。
- `src/shared/apply-patch.ts`：补丁解析/应用纯函数——Host 落盘与 Client 预览**共用同一解析器**，保证「模型看到的预览」与「真正写进去的」一致。
- `src/client/`：`FileChangeRow.tsx`（工具行）/ `diff.ts`（LCS 三口径：raw/rows/changed）/ `diffView.tsx`（两种视图的渲染：工具行与设置页样张共用）/ `viewCards.tsx`（设置页「展示方式」两张带真实样张的单选卡）/ `SessionControls.tsx`（会话页头两个快捷开关）/ `session.ts`（会话级覆盖 store，内存、不落盘）/ `locate.ts`（真实行号 + 上下文批量查询）/ `prefs.ts`（全局偏好 store）/ `styles.module.css`（CSS Modules，构建期内联）。

## 本插件的局部规则

1. **影子化优先级取 `-1` 是有意的**：官方内置行注册 priority 0，接管必须更小；但动态 Cordis 插件的影子优先级也从 -1 起分配——同值撞车会明确抛错打日志，而不是悄悄失效。同 key 同 priority 直接抛错是槽位语义，不是 bug。
2. **统计三口径统一**：行头/卡头统计、高亮视图、± 差异视图永远用同一次 LCS 的结果（`changed` 口径），「只改一行」报 `+1 -1` 而不是工具原文的 `+7 -7`。
3. **行号不许编**：patch 工具带真实 `startLine`；edit/write 靠 `locate` 路由拿文件内容定位；都拿不到退回 1 起。定位不到就不补上下文（宁可朴素，不编内容）。
4. **`patch` 工具只做新建/修改**：`*** Delete File:` / `*** Move to:` 解析层认识、执行层明确拒绝并指路 `bash rm/mv`（删除改名不可逆，且「全有或全无」只覆盖验证阶段）；落盘前全量内存应用（一处失败一个字节不写），写前批量预检越界目标。
5. **删除/改名段落在客户端仍画出来**（卡头 `旧 → 新` + rejected 角标）——用户要看到模型想干什么。
6. **`patchTool` 开关走 volatile 热更新**：0.1.7 的 loader 在提交期把新值**原地写进 volatile 引用**再派发 `loader/volatile-update`，开关判定直接 `config.patchTool.get()` 就是权威值（旧版「问 `settings.get(NS)` 躲 attach/detach 竞态」的技巧已作废）；监听器每次事件都重新判定：需要就注册、取消就反注册（真实会话反注册不净表现为 `unknown tool "patch"`）。`scripts/check-host.mjs` 有断言守着。
7. **BOM 与行尾保持**：CRLF 归一后应用、写回恢复整份 CRLF；带 BOM 的文件改完 BOM 还在（readText 会吃掉 BOM，写回前探测补上，且不补第二个）。
8. **失败诊断给「最像的真实行」**：`applyChunksToText` 失败时在文件里找相似度最高的行，回行号 + 原文 + 差在哪（缩进/行内空白/标点），让模型照抄就能过；只在失败路径跑、有行数上限（2 万行以上不扫）。
9. **三层优先级从高到低：单块点击 > 会话级覆盖 > 全局偏好**。会话级覆盖是页头两个按钮写的（`session.ts`，内存、换会话即失效、**绝不写持久化配置**）；`prefs.ts` 才是落盘那一层。行组件靠覆盖的 `rev` 认出「页头动过」并作废自己的临时状态——否则「一键全展开」会被几小时前的一次手动折叠挡回去。
10. **样张必须复用真渲染**：设置页两张「展示方式」卡里的预览走 `diffView.tsx`（与工具行同一份代码），只有类名不同（`styles.pv*`）。CSS Module 化之后类名是模块作用域的、天然不会串味，但**样张不传 hunk 类名**，所以样张里的 `±` 改动行保持官方原样（行内 `+ `/`- ` 前缀、不与上下文行号对齐）——`check-client.mjs` 有断言守着。
11. **两个视图共用同一条左侧排版轴（14px）**：行号列 / 改动符号列都从卡片左边框让出 14px——这一档与 `.ctx` 的 `padding:0 14px`、官方 `DiffBlock` 的 `.body{padding:12px 14px}` 同源。高亮视图靠 `.line` 的 `padding-inline-start: calc(行号列宽 + 26px)` 加上 `::before{inset-inline-start:14px}`（官方把行号画在行盒最左缘，而 `pre` 的横向内边距被本条插件的「底色铺满整卡」规则归零了，不让位就贴边框）；± 视图靠改动行 `position:relative`，让 `::after{inset-inline-start:0}` 落在行盒内而不是官方块根的左缘。动其中任何一条，都要保证两个视图的**行号 ink 与正文 ink 落在同一个 x**（无头 Chrome 量得到，见 README「展示方式」节）。

## 自检

`pnpm --filter @dshp/file-change-viewer test` = `node --check` 双 bundle + `check-host.mjs`（158 项：NS/路由/工具动态开关/全有或全无/locate 单次读）+ `check-patch.mjs`（74 项：五级模糊定位/信封诊断/失败诊断）+ `check-client.mjs`（207 项：无头渲染含迷你 React，验证偏好生命周期、设置页两张样张卡、页头两个快捷开关的会话级覆盖）。
