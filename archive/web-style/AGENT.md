# archive/web-style — 局部规则（已归档）

> **已归档（2026-10-20），不再维护。** 仅作历史参考，不再适配新版 DSH。

> 上层：[根 AGENT.md](../../AGENT.md) → [docs/](../../docs/)。本文只写本插件自己的事实与局部约定。

## 身份

| 项     | 值                                                                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 包名   | `@dshp/web-style`                                                                                                                                    |
| NS     | `dshp-web-style`（四处同名）                                                                                                                         |
| 设置节 | `settings.section` order **50**，label「外观定制」                                                                                                   |
| 能力   | 8 套主题画廊（每套 134 个 `--dsw-*` token 全量映射）+ 3 个可交互背景效果（点阵字标 / 极光辉光 / 流场）+ 壁纸取色（Material You / MD3）+ 全局圆角三档 |
| 原实现 | `~/.dsh/plugins/dsh-custom-ui`（`@dshp-inx/custom-ui`）等价 TS 重写                                                                                  |

## 结构与职责

- `src/host/themes/`：主题 token **单源**（每包导出 `{ dark?, light?, meta }`，`index.ts` 的 `expand()` 按定义的 scheme 展开进 `THEME_CATALOG`）；Host 经同源路由全量下发，client 只存卡片 meta。
- `src/client/`：`index.tsx`（**只导出 `inject` / `apply`**，loader 壳由 `shared/tsup.preset.ts` 拼出）/ `GallerySection.tsx`（外观定制节，普通函数组件 + JSX 的范式）/ `apply-theme.ts`（覆盖层）/ `background.ts`（背景**舞台 + 效果登记表**：节拍、dpr、压壳预算、收回次序都在这，效果只提供 `mount` / `draw`）/ `background-dots.ts`、`background-aurora.ts`、`background-flow.ts`（三个效果本体）/ `themes.ts`（画廊 meta）/ `md3.ts`（壁纸取色）/ `radius.ts` / `state.ts` / `styles.module.css`（CSS Modules，局部名不再需要前缀）/ `types.ts`（协议 + 领域模型 + 只含实际用到的 `ClientContext` / `SlotsService` 接缝）。
- 路由面：`GET state` / `GET themes` / `POST theme` / `POST config`。

## 本插件的局部规则

1. **与官方外观系统同轨，不做对抗**：不注册自定义主题 id，把每套主题作为官方 `overrideTokens` **覆盖层**叠加在官方亮/暗之上——主题自身 scheme 分支填主题值，对侧分支填官方原样值，因此官方「外观」行（浅色/深色/跟随系统）永远合法可用，「回到官方」= 撤销覆盖层。
2. **主题集精简是决策不是欠账**：曾扩到 33 套，因「同一套布局换色相」区分度不足、每套 134 token 维护线性增长，精简为 7 套：`claude-parchment-light` / `xiaohongshu-light` / `levels-light` / `arc-light` / `sakura-light`（浅色）+ `luxury-dark` / `supabase-dark`（深色）。加回主题要有区分度论据。第 8 套 `harness-office` 的论据是**换了信息维度**（官网同款的动效背景，不只是配色）。
3. **有意不覆盖的 token 不许顺手补**：如 `--dsw-alias-markdown-tag`（DSH 里是活动标签页底色，是面不是前景，填中灰实色会把活动标签页压成灰块）——清单见 `themes/shared.ts` 头注释。
4. **画廊按钮文字按亮度择优**：不许写死 `#fff`（浅色主题上不达标）。
5. **动效不进 token 层，且与主题正交**：token 契约要求每套主题覆盖**同一批** 134 个键（`check-themes.mjs` 拿 `THEME_CATALOG[0]` 比对），给单套主题塞「动效开关」会直接破坏契约。背景是**独立的一层**：`backgroundId` 与 `themeId` 各自持久化，切主题不重置背景选择、选背景不碰 token 覆盖层；两者唯一的联系是 `background.ts` 的 `THEME_DEFAULT_EFFECT`（用户没显式选时回落到主题默认效果，如 `harness-office` → 点阵）。加效果 = 写一个 `background-<name>.ts` 并在 `BACKGROUNDS` 登记一行，**不许**为此改 `themes.ts` 的 meta 或新增路由。
   - **预算在舞台、铺法在效果**：通透度、节拍（30fps / dpr 上限 / 页面隐藏停帧）、`prefers-reduced-motion` 单帧、以及收回次序全归 `mountStage`，单个效果不许擅自调深壳面（正文对比度是公共代价）。效果只实现 `mount`（重采样 / 烘色表，此刻 token 已生效）与 `draw`（每帧唯一入口，必须 O(自身元素数)）；`kind: 'dom'` 的效果根本不建画布、不绑监听、不起 rAF——零帧成本是结构性的，不是靠约定。
   - 颜色全从当前 token 取（不写死色值，`color-mix(…, black)` 的 black 是**对比度端点**不是主题色）；`body` 上 `z-index:0` 舞台 + `#root` 抬到 1，并且**必须把 `#root` 之下那些实心壳面压薄**（否则整层被物理盖住、什么都看不见）。壳面**只按几何认、两类**：`shell` = 横竖都铺满视口（外层 frame / 主视图），`rail` = 贴左缘 + 纵向铺满 + 横向不超过 `max(380px, 30% 视口宽)`（侧边栏那一列，展开与收起都命中）。侧栏够不着 `shell` 的宽度门槛（240 ÷ 1500 ≈ 16%），漏了它就有「主区透了、左侧一整条还是实心」的症状。按 computed style 只改 alpha、**比 `SHELL_KEEP` 更实心才夹到它，本来就更透的主题不许被加浓**、气泡卡片等小面不动、**不许耦合 CSS Module 哈希类名**；`mount` 必须**返回精确 disposer**（切主题 / 回到官方 / 插件停止三条路径共用，`#root` 与每块壳面的 inline 背景按「首次记录、重复扫描不覆盖」逐项还原，自注入的 `<style>` 一起摘）。
   - **压完只剩约 16% 通透度**（两级壳各 0.6 alpha → `0.4 × 0.4`），这层预算决定了点阵的全部标定：
     极光必须收进字标带（铺满视口会把正文底色抬 11 级、反过来把自己点阵的对比抹平）、画布遮罩要在
     字标高度内保持全通、点宽与网格要成对标（`DOT_RATIO ÷ 1` ≈ 0.7 格才连得成笔画；网格太密笔画会
     被打断成麻点）、光照只进颜色**一次**（再乘进 alpha 就是双重暗档，字标半边先掉出可读区间）。
     调强弱先 `STAGE_GAIN`，动 `SHELL_KEEP` 就是拿正文对比度换（下限 `0.55`）。
   - 画布**永远不许铺底色**：舞台不清屏是为了留拖尾自由度，但洗屏只能用 `destination-out` 降 alpha。铺一层实色等于在两级壳下面再加第三张壳。
   - **官方亮/暗切换必须 `refreshBackground()`**：canvas 类的端点是 `mount` 时从 token 烘进 JS 的，`theme/change` 不重挂就一直用旧配色的颜色（`GallerySection` 的监听里调；它只对 canvas 生效，`dom` 类读 CSS 变量自己会跟）。
6. **目录 ↔ 画廊 meta ↔ 产物一致性由脚本守**：`scripts/check-themes.mjs` 进 `pnpm test`，改主题必须过它。背景效果 id 在两半各列一份（两个 bundle 没有共享模块），脚本钉住「Host 白名单 `BACKGROUND_IDS` 的每个 id 都出现在 client 产物里」——漏登记或漏构建当场红。

## 自检

`pnpm --filter @dshp/web-style test` = `node --check` 双 bundle + `scripts/check-themes.mjs` + `shared/scripts/check-css-modules.mjs`（`styles.x` 拼错在类型上是合法的，这个静态检查是唯一会自动红的网）。
