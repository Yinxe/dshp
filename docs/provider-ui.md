# provider 型插件：两套模板与失败提示

> 本文承接旧 AGENT.md §10.3–10.4（多供应商分层渲染 / 失败提示结构化）的完整细节，标杆 `plugins/search-provider`（维护中；`archive/token-meter` 已归档，仅作历史参考）。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 什么时候读这篇

插件若按「供应商/后端类型」维度扩展（token-meter 的额度、search-provider 的搜索源），**数据与 UI 都按 provider 分层**：Host 适配器 return 自己的数据（可带 `icon` 图标名），Client 侧每个 provider 交出**两套独立模板** —— 一套决定「那枚按钮里画什么」（按钮级，**自由节点**），一套决定「详情怎么排版」（详情级），通用零件抽出来复用。

```
Host    host/providers/<type>.ts        适配器 return 自己的数据（view/billing/windows/extra + icon）
Client  client/providers/templates.ts   **模板契约**：ProviderTemplates / ButtonRenderCtx / QuotaRingSpec + 工具函数
        client/providers/ui/<type>.tsx  该供应商的 button + buttonHint + detail（导出**一个** ProviderTemplates）
        client/providers/ui/index.ts    模板注册表（一个 type 一行 registerProviderTemplates）
        client/providers/registry.tsx   调度：renderButton / buttonTitle / renderBody（各自兜底）
        client/providers/kit.tsx        通用可复用零件（ProviderUIKit）
        client/providers/sections.tsx   声明式区块渲染（没有专属 detail 的 type 零代码可用）
        client/provider-icons.tsx       供应商图标（官方品牌路径 + 16×16 网格自绘线稿 + iconOf 名字解析）
        client/quota-prefs.ts           供应商偏好袋（浏览器本地 localStorage tm-quota-prefs，按 vendor 分作用域）
        client/QuotaRing.tsx            通用环：把 QuotaRingSpec 画成 SVG
        client/QuotaTrayPanel.tsx       承载面：纯展示 + 交互回调，**不认识任何供应商**
```

## 按钮级：内容是自由节点

**按钮级模板返回一个完整节点**，而不是「一枚环」：

```ts
interface ProviderTemplates {
  button?: (ctx: ButtonRenderCtx, K: ProviderUIKit) => ReactNode; // 自由渲染：环 / 余额 / 迷你条 / 图标…
  buttonHint?: (ctx: ButtonRenderCtx, K: ProviderUIKit) => string; // 悬停 / 无障碍说明
  detail?: (ctx: RenderCtx, K: ProviderUIKit) => ReactNode; // 详情级（显示控件也画在这里）
}
```

为什么是自由节点：多窗口供应商（Goat / opencode）真正想钉在按钮上的常常是**一个数字**而不是一个百分比 —— 于是余额大数字、`5时·周·月` 三条迷你条、图标 + 环都成了合法画法。约束只有一条：**装得进一枚侧栏按钮**。

环因此降级成「一种常见画法」：想画环就用 `QuotaRingSpec` 描述它（`pct` 0–100 或 `null` / `tone` 取 `ok|warn|bad|idle`（阈值 70 / 90）/ `text` 环内极短文案 / `title` 悬停说明**必填** / `custom` 完全自绘），由通用 `Ring` 统一画；不想画环就完全不用它。两个特殊态必须分清：`pct: null` + `tone: 'idle'` **只画轨道**（不编假进度）；`pct: null` + `tone: 'bad'` 画**整圈警告色**。

### 三档位置（`ctx.variant`）

| `variant` | 位置                         | 常规做法                                                              |
| --------- | ---------------------------- | --------------------------------------------------------------------- |
| `wide`    | 展开的侧边栏（42px、拉满宽） | `K.ButtonLayout`：图标 + 主图形 + 名字 + 右对齐数值                   |
| `rail`    | 收起的 56px 轨道             | 只放主图形（缺省是**表盘**：环当外圈 + 供应商图标居中环心），文字收起 |
| `row`     | 浮层里的供应商切换行         | 只放主图形（与那一行 16px 的图标槽对齐）                              |

`ButtonRenderCtx` 在详情级 `RenderCtx`（`snap` / `now` / `type` / `vendorName` / **`prefs`**）之上补两样按钮独有的信息：

| 字段      | 类型                        | 说明             |
| --------- | --------------------------- | ---------------- |
| `variant` | `'wide' \| 'rail' \| 'row'` | 三档位置（上表） |
| `icon`    | `string`                    | 供应商图标名     |

尺寸这类「各家一定会写歪」的常量交给助手：`ringSizeOf(variant)`（宽栏 / 切换行 **16px**，窄栏 **28px** = 表盘外圈）。窄栏早先是「图标 14 + 环 16 并排」（14 + 16 + 3px = 33 塞进 36 的圆），实测读成两个互不相干的小记号、16px 的弧长也看不出比例，所以放大成表盘，图标宽度另给 `RAIL_ICON`（15）。

### 按钮级通用零件

| 零件               | 说明                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ButtonLayout`     | **骨架**：宽栏 = 图标 + 主图形 + 名字 + 数值；窄栏 = 表盘（`leading` 那枚环当外圈 + 供应商图标居中环心，要画别的传 `rail` 整块覆盖）；切换行 = 只有主图形 |
| `Ring`             | `QuotaRingSpec` → SVG 环（几何 / 描边 / 动画 / 配色统一在这里）                                                                                           |
| `WindowBars`       | 多条滚动窗口的迷你条（三条并排；宽栏推荐画法，比三个环省地方）                                                                                            |
| `ProviderIcon`     | 供应商图标（16×16 网格 / 描边 1.4 的自绘线稿；未知名字给通用那枚；宽栏 16 · 窄栏 15 · 切换行 16）                                                         |
| `shortWindowLabel` | 窗口短标签（`5 小时` → `5时`、`每周` → `周`）                                                                                                             |
| `tinyMoney`        | 极短金额：`$46.6` → `$47`、`¥12345` → `¥1.2万`（金额要塞进窄槽位时用；窄栏没有数值位）                                                                    |
| `PrefSwitch`       | 偏好开关：标签 + 原生 checkbox（键盘可达、可读屏），勾选即 `onChange`                                                                                     |
| `PrefChoice`       | 偏好单选组：`role="radiogroup"` + 每项 `role="radio"`，当前项标 `data-on`（如 Goat 的 `5h / 1w / 1m`）                                                    |

### 显示偏好 = 供应商自己的键值袋

**不要给所有供应商做统一的偏好面板**（试过一排单选胶囊：那是把各家的口味硬塞进同一套控件，被否）。
谁有偏好谁负责画 —— 控件由**该供应商的 `detail` 模板**用 `K.PrefSwitch` / `K.PrefChoice` 摆在自己卡片底部，
偏好写进 `ctx.prefs`（按供应商分作用域的键值袋）：

```ts
const window = ctx.prefs.get('window', 'monthly'); // 读（带兜底）
ctx.prefs.set('balance', '1'); // 写 → 承载面的按钮立刻重画
```

- **键名与取值完全由供应商模板自己定**：Goat 用 `window`（`5h`/`weekly`/`monthly`）与 `balance`（`0`/`1`），
  deepseek / manual 只用一个 `balance`。插件**不定义任何语义**、没有 `auto` 这类保留值；契约只保证
  「读得到、写下去、写完全局重画」。
- **存储是浏览器本地**（token-meter 的 `client/quota-prefs.ts`）：`localStorage` 的 `tm-quota-prefs`，
  值形如 `{ [vendorId]: { [key]: value } }`；读取时消毒（坏 JSON / 非法 id / 非法键值忽略），
  键名限 `[a-z0-9-]{1,24}`、值限 `[a-z0-9._-]{0,32}`（短字符串），每家 ≤16 键、≤64 家；写空串 = 删键。
- **通信**：进程内一份带订阅的 store（`scope(id)` → `{ get, set }`，外加 `subscribe` / `prune` / `clear`）——
  `set()` 立刻通知订阅者，**点一下立刻重画，零往返、不会失败**。同一 vendor 每次拿到**同一个 scope 引用**，
  可以安全放进依赖数组。
- **清理**：供应商被删后 `prune(ids)` 掉孤儿键（等配置就绪后才跑，避免启动瞬间误删）。

**为什么不进持久化配置**：它只是「我这台机器上想看哪个数」的展示口味 —— 换机器、换人本就该不一样，
写进配置会跟着同步漂走；而且为点一下按钮走一趟 `/ext/...` 毫无必要（路由没热更新时就会弹一行「连接 Host 失败」）。
所以 **Host 侧没有对应字段、没有校验函数、没有写它的路由**。

### 供应商图标

Host 适配器可声明 `icon`（`describeProviders()` 下发 `ProviderMeta.icon`；适配器本身**不携带任何图片 / SVG**）。客户端 `iconOf(type, metaIcon)` 按 **元数据名字 → 该 type 的兜底表 → 通用那枚** 解析，再交给 `ProviderIcon` 画 —— 两种画法并存：**官方品牌路径**（按官方 viewBox 填充 `currentColor`，如 deepseek 的鲸鱼）与**自绘线稿**（同样 `currentColor`，深 / 浅主题都成立，不贴位图、不带底色方块）。所以新增供应商**不写客户端代码也有图标**（通用那枚），写了名字就换成自己的；名字认不出来也不会空白。

**线稿按 16×16 网格画、描边 1.4**（实际渲染 15–16px，接近 1:1）：早先按 24 网格画再缩到 10–12px，0.42 倍缩放让 1.6 的描边只剩 0.67px，屏幕上就是「对不上、太小、发虚」。每枚标记占满 12–13 个单位，并排时视觉重量一致；`display:block` 去掉 inline-SVG 的基线间隙。尺寸统一为**宽栏 16 / 窄栏 15（`RAIL_ICON`）/ 切换行 16**，官方品牌路径按自己的宽高比算高（鲸鱼 23.16 : 17.04），不硬塞方框。

### 共用工具（`templates.ts`，纯函数、Node 可直跑）

| 工具              | 说明                                                           |
| ----------------- | -------------------------------------------------------------- |
| `toneOfPct`       | 占用比例 → 严重度档位（阈值与 `QUOTA_LEVEL` 同源：70 / 90）    |
| `clampPct`        | 夹到 0–100；非有限值返回 `null`（= 无数据，而不是 0）          |
| `windowPct`       | 单条窗口的占用比例（`limit<=0` 视为未知）                      |
| `worstWindowPct`  | 多条滚动窗口里占用最高的那条（通用兜底只关心最紧的那条）       |
| `windowOfMetric`  | 按供应商自己定的窗口键取一条窗口：key 直读 → 标签兜底 → `null` |
| `balanceText`     | 余额文案（`¥9.06` / `$12`）；余额未知返回 `null`               |
| `defaultRingSpec` | 通用兜底环：最紧窗口 → 空环 + 余额文案                         |
| `failureRingSpec` | 失败态环：空环 + 满圈警告色（红 = 要人管的、黄 = 临时性的）    |

## 四家的控件与画法（token-meter 实例）

| provider                | 详情卡片底部的控件（它自己画）                              | 按钮怎么画（`button`）                                                                                                                           | 详情（`detail`）的专有表达                                                                                                      |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `deepseek`              | 「数值位显示余额」开关（`PrefSwitch`）                      | 环**一直画**总额度消耗（已用 /（赠送 + 充值）；拿不到总额度 → 空环）；数值位默认百分比，勾了开关换成余额（余额不足转红）；窄栏没有数值位         | 账户余额三行 + 总额度消耗进度 + 消费统计 + 趋势（网页账单路线才有）+ 数据来源徽标（不再挂「凭据」徽标）                         |
| `commandcode`（Goat）   | 「数值位显示余额」开关 + `5h / 1w / 1m` 单选（**默认 1m**） | 环**一直画**所选窗口的占用比例（默认月额度；没有窗口 → 空环 + 余额，低于预警线转红）；数值位默认该窗口的百分比，勾了开关换成余额；窄栏没有数值位 | 计划 · 状态徽标 + 余额大数字（币种只出现一次）+ 三条窗口 + 额度构成 + 「账户与用量」两列网格（前 6 项、一格一项，不做成对合并） |
| `opencode`              | 与 Goat 同构（开关 + `5h / 1w / 1m`，默认 `1m`）            | 同上；环的配额来自订阅三窗口（纯按量 Zen 用户没有窗口 → 空环 + 余额）                                                                            | 只留一枚徽标（「订阅 + 计划」或「按量计费」）+ 三窗口 + 充值余额                                                                |
| `manual`（本地账本）    | 只有「数值位显示余额」开关（本地账本没有多条滚动窗口）      | 环**一直画**账本「已用 / 总额」；数值位默认百分比，勾了开关换成手填余额                                                                          | 明确标注**本地手填、非平台实时**，避免误认为真实额度                                                                            |
| 没写专属按钮模板的 type | 没有控件（详情也走声明式层）                                | 通用兜底 `defaultRingSpec()`：最紧窗口 → 空环 + 余额，配上 `ButtonLayout` 骨架                                                                   | 声明式区块 → legacy（**零客户端代码可用**）                                                                                     |

**窄栏（36px 圆）始终是一枚表盘**（环当外圈、供应商图标居中在环心），没有文字位，说明全靠 tooltip（`buttonHint`）—— 与勾没勾那个开关无关。

**没写专属按钮模板的 type 零客户端代码可用**：按钮走 `defaultRingSpec()` + `ButtonLayout` 骨架，详情走「声明式区块 → legacy」。

## 调度与兜底

`registry.tsx` 暴露三个函数，**各条路径各自 `try/catch`**，任一抛错不影响其它：

| 函数                  | 路径（逐层回落）                                               | 保证                                        |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| `renderButton(input)` | 专属 `button`（自由节点） → `defaultRingSpec` + `ButtonLayout` | 按钮永远画得出来（抛错 / 返回 null 也兜住） |
| `buttonTitle(input)`  | 专属 `buttonHint` → `defaultRingSpec().title`                  | 窄栏没有可见文字，说明总有                  |
| `renderBody(input)`   | 专属 `detail` → 声明式区块 → legacy 快照                       | 详情永远有内容，不白屏                      |

三条路径都会把 `prefs: providerPrefs.scope(input.vendorId)` 放进上下文 —— 按钮级与详情级拿到的是**同一个供应商的那一份**，所以模板里读写的偏好天然按供应商隔离。

**失败快照不进专属模板**：拉取失败由承载面统一走结构化 `ErrorCard`（结论 + 处置 + 排查步骤 + 原始信息 + 重试），任何 provider 一致 —— 这也是模板只承诺「成功快照的渲染」的原因；按钮侧由各模板自己调 `failureRingSpec()` 画警示。

## 通用零件（kit，不要重复造）

`RollingBar`（滚动刷新进度条）、`WindowGroup`、`BalanceBlock`、`MetricRows`、`MetricGrid`、`SplitBar`（分段用**语义色调** `tone`：`brand`/`ok`/`warn`/`bad`/`info`/`muted`，颜色取主题 token；写死 `color` 仅作 legacy 兜底）、`NoteLine`、`MiniChart`、`Chips`、`SectionTitle`、`ErrorCard` + 按钮级的 `ButtonLayout` / `Ring` / `WindowBars` / `ProviderIcon` / `shortWindowLabel` / `tinyMoney` + `num/fmt/fmtLeft/curSymbol/remainOf/timeAgo/levelOf`（都由 `ProviderUIKit` 命名空间下发）。专属模板与声明式层**共用同一批零件**，只写「自己特有的表达」。

**色调修饰类只做颜色**：`ok` / `warn` / `bad` / `over` 是给 `.qfill` / `.qpct` / `.dot` / `.mini` 这类元素的**修饰类**，不许写裸规则。CSS Module 会把同名局部类合并成同一个哈希类，一段 `.warn { margin: 8px 0 0 }` 落到 6px 高的进度条填充上就会把它顶出轨道 —— token-meter 真踩过这个坑（一到 70% 变黄，详情里的进度条就消失），最后把余额告警段落改名 `.warnLine` 才修好。段落/块级样式一律另起名，`check-quota-templates.mjs` 里有一条自检守着。

## Host 侧 view 契约

- 适配器产出 `view`（`windowsSection/balanceSection/metricsSection/progressSection/splitSection/noteSection/chartSection` + `makeView`）；`quota.ts` 快照前必须过 `sanitizeView()`（区块数/条目数/字符串长度夹紧，与外部输入同等对待）。
- **双轨兼容**：`defaultView()` 从 legacy 字段兜底推导 view（老适配器零改动升级），`viewToExtra()` 把 view 反向补成 legacy extra（新适配器只写 view 也不让旧客户端空白）。
- 适配器可声明 `defaultParams` 声明「新增该类型时的表单初始值」（如 commandcode 默认填 `$COMMAND_CODE_API_KEY`）；**表单字段一律来自 provider 元数据 `fields[]`，禁止在 client 里按 type 硬编码字段**（会与适配器悄悄漂移）。
- 适配器还可声明 **`icon`**（图标名，随 `describeProviders()` 下发 `ProviderMeta.icon`）—— 只是名字，**不带任何图片 / SVG**；客户端解析见上文「供应商图标」。
- **纯展示偏好留在客户端**：像「按钮上显示什么」这种口味不该进持久化配置（条目 `config:` 会跟着漂到别的机器），也不必为点一下按钮走 `/ext` 路由 —— token-meter 把它放在 `localStorage`（`tm-quota-prefs`）的**按供应商分作用域的键值袋**里，由客户端 store 广播（见上文「显示偏好 = 供应商自己的键值袋」），**Host 侧没有这个字段、没有校验函数、没有写它的路由**。
- 同类 provider 能合并就合并：token-meter 的 `deepseek-api`/`deepseek-web` 已并入 `deepseek`（按凭据形态自动选路），旧 type 只留**别名**（`registerAlias`，读路径归一并不落库、不改写用户文件），不给用户增加无谓选择。

## search-provider 的变体

search-provider 是同一思想的搜索版：只向 `ctx.web` 注册一个稳定的 hub provider `dshp-search`，`host/providers/<id>.ts` 实现 `SearchProviderModule`，由 hub 在 `search()` 里按 settings 的 `provider` 分派到 Tavily / Exa / Firecrawl。样板（HTTP JSON、错误抽取、来源归一）由 `providers/base.ts` 提供；设置页控件由 `fields[]` 元数据驱动。API Key 每次操作经 credentials 服务实时解析（如 `TAVILY_API_KEY`），不在提供方上滞留、不进条目 config。

## 失败提示必须结构化、可操作

拉取失败不能只把原始异常丢给用户。标杆：归档的 token-meter `host/errors.ts` + `client/ErrorBox.tsx`。要点：

- **适配器抛 `ProviderError(kind, msg, opts)`** 显式声明原因，`kind` 取
  `auth | session | plan | balance | rate | network | parse | config | server | unknown`；
  不要在适配器里写用户可见的长文案 —— 分类由 `toErrorInfo()` 统一补齐
  「标题 + 解释 + 去哪改 + 排查步骤 + 严重度 + 是否可重试」。
- **分类优先于文案**：老适配器/未知错误走 `classifyMessage()` 正则兜底。易错点：
  HTTP 200 + 错误信封（如 DeepSeek 的 `40003 invalid token`）必须显式识别，否则会被
  宽泛的 `invalid.*token` 正则误判成「密钥失效」——`session` 的判定要排在 `auth` 前面。
- **重试语义要克制**：`retriable` 表示「不改任何东西、直接重试有意义」。
  密钥/会话/订阅/余额类 = `false`（UI 显示「已处理，验证」而非「重试」）；限流/网络/5xx = `true`。
  默认值由分类决定，`ProviderError` 未显式声明时**不要**强行置 true。
- **异常包装不要吞分类**：`catch (e) { throw new Error(msg) }` 会丢掉 `kind`，必须
  `if (e instanceof ProviderError) throw e;` 原样透出。
- 结构化信息随快照下发（`snap.errorInfo`），客户端只按 `kind` 上色渲染，不认识供应商；
  状态点着色与卡片配色同源（要人管的红、临时性黄）。
