# archive/skill-manager — 局部规则（已归档）

> **已归档（2026-10-20），不再维护。** 仅作历史参考，不再适配新版 DSH。

> 上层：[根 AGENT.md](../../AGENT.md) → [docs/](../../docs/)。本文只写本插件自己的事实与局部约定。

## 身份

| 项       | 值                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 包名     | `@dshp/skill-manager`                                                                                  |
| NS       | `dshp-skill-manager`（四处同名）                                                                       |
| 设置节   | `settings.section` order **29**，label「Skills」                                                       |
| UI 入口  | 另注册 `conversation.input.right` order **90**（输入框右侧技能按钮）                                   |
| 管理对象 | 全局（`~/.dsh/skills`、`~/.agents/skills`）+ 工作区（`<workspace>/.dsh/skills`、`.agents/skills`）技能 |
| 原实现   | 无（本仓原生）                                                                                         |

## 结构与职责

- `src/host/`：`skills.ts`（扫描/增删改查/转移）/ `roots.ts`（技能根解析与优先级）/ `frontmatter.ts` / `config.ts` / `http.ts` / `index.ts`。
- `src/client/`：`index.tsx`（**只导出 `inject` / `apply`**，两处槽位注册各带 try/catch，loader 壳由 `shared/tsup.preset.ts` 拼出）/ `SkillSection.tsx`（设置节 + `conversation.input.right` 零尺寸探针 + 模块级 `ctxHolder`，普通函数组件 + JSX 的范式）/ `components.tsx`（Badge / Switch / Selector / ActionMenu，真实 props 类型）/ `api.ts` / `styles.module.css`（CSS Modules，局部名不再需要 `sm-` 前缀）/ `types.ts`（协议 + 领域模型 + 只含实际用到的 `ClientContext` / `SlotsService` 接缝）。
- 路由面：`GET state` / `GET read` + `POST config / create / update / toggle / remove / transfer`。

## 本插件的局部规则

1. **全仓唯一往用户目录写文件的插件**：写入范围被限定在 dsh-skill-filesystem 扫描的那几个技能根内，三重防护（技能名 kebab-case 白名单 `SKILL_NAME_PATTERN` → `entryPathFor` 包含校验 → `containedInRoot` realpath 校验），只写根下的一级技能条目（见 [docs/security.md](../../docs/security.md)）。
2. **扫描语义对齐 dsh-skill-filesystem**：根目录直接子项，目录包 `<name>/SKILL.md` 或平铺 `<name>.md`；不递归更深层；点开头目录跳过（含 `.system`）。
3. **遮蔽规则对齐 dsh-skill registry**：同名校验按 rank 升序取第一个赢家，其余标 `shadowedBy`（全局组 400/500，工作区组 100/200）。
4. **故意不注册模型工具**：技能文件 = 提示词注入面，写入必须由人完成。
5. **flat 条目的裸名校验**：dirName 带 `.md` 后缀的，按 kind 还原裸名再过 kebab-case 白名单后才能改。

## 自检

`pnpm --filter @dshp/skill-manager test` = `node --check` 双 bundle + `shared/scripts/check-css-modules.mjs`（`styles.x` 拼错在类型上是合法的，这个静态检查是唯一会自动红的网）。
