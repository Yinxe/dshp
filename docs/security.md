# 安全规范

> 本文承接旧 AGENT.md §11（安全规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

- 同源：所有 `/ext/*` 先 `sameOrigin`；state 接口 `no-store`。
- 输入：路由 body 限 1MB；一切字符串入库前截断；`maxImages` 类数字夹范围；非法 hint/补丁宁可忽略/报错，不可拼进 prompt 或文件名。
- 密钥：**不许在代码/注释里放任何密钥、token、内网地址**；插件配置只存路由选择（provider/model），不存口令。密钥引用（`$NAME`）经 credentials 服务解析，不进持久化配置。
- 最小暴露：缓存只存 leaf owned copy；tool 输出只给契约字段（如 `{ description, model, fallback_used }`）；日志不打图片内容、prompt 全文、用户原文（最多打长度/计数）。
- 卸载干净：`ctx.effect` 清理一切（样式、路由、patch、section）；**不在 DSH 目录外写任何文件**（设置只进 profile 条目 `config:` 的 NS，见 docs/settings.md）。

## 需要写用户文件的插件：额外的写路径防护

两个已归档插件（skill-manager / mcp-manager）有超出「只写条目 config」的白名单写路径，各自的防护是范式：

**skill-manager**（写技能目录——全仓唯一往用户目录写文件的插件）：

- 写入范围被限定在 dsh-skill-filesystem 扫描的那几个技能根内；
- 三重防护：技能名 kebab-case 白名单（`SKILL_NAME_PATTERN`）→ `entryPathFor` 包含校验 → `containedInRoot` realpath 校验；只写根下的一级技能条目；
- **故意不注册模型工具**：技能文件 = 提示词注入面，写入必须由人完成。

**mcp-manager**（回写 profile 的 cordis.patch.yml）：

- 写入只针对定位到的 patch 文件，且先备份 `.bak`、临时文件 + rename 原子落盘；
- 回写前序列化自校验（不可重解析或条目数变化即拒绝写盘）；
- **故意不注册模型工具**：patch 文件是 DSH 的装配清单，增删实例必须由人完成；
- 探活只对 streamable-http 发一次 initialize 握手；stdio 不 spawn（子进程有副作用）。
