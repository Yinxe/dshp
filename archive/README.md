# 归档插件（冻结，不再维护）

2026-10-20 起，本仓库只维护 [`@dshp/vision-bridge`](../plugins/vision-bridge/README.md)。其余插件整体移入本目录，**冻结在归档时的版本**：

- 不再适配新版 DSH，不再接受功能更新 / 修 bug；
- 不参与 pnpm workspace、`pnpm check`、CI 打包与 Release；
- 源码、文档、截图与已提交的 `lib/` 产物全部保留，仍可按冻结版本本地安装。

## 归档清单

| 插件                                                         | 版本   | 归档时的一句话                                                       |
| ------------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| [@dshp/token-meter](token-meter/README.md)                   | 0.15.0 | Token 额度 + 用量统计 + 在线时长（多供应商额度 + 会话日志聚合）     |
| [@dshp/file-change-viewer](file-change-viewer/README.md)     | 0.4.0  | edit / write 行的高亮差异视图 + `patch` 工具                         |
| [@dshp/mcwiki-search](mcwiki-search/README.md)               | 1.6.0  | Minecraft Wiki 查询（搜索 / 引言 / 全文，清洗成 AI 可读文本）        |
| [@dshp/search-provider](search-provider/README.md)           | 0.5.0  | `web_search` 供应商中枢（Tavily 等可插拔接入）                       |
| [@dshp/web-style](web-style/README.md)                       | 0.5.0  | Web 外观定制（8 套主题 + 背景效果 + 壁纸取色 + 全局圆角）            |
| [@dshp/skill-manager](skill-manager/README.md)               | 0.4.0  | 技能管理（全局 + 工作区技能的新建 / 编辑 / 启停 / 复制移动 / 删除）  |
| [@dshp/mcp-manager](mcp-manager/README.md)                   | 0.4.0  | MCP 服务器管理（patch 条目 CRUD + 探活，表单 / JSON 双模式）         |
| [@dshp/widget-kit](widget-kit/README.md)                     | 0.13.0 | 小组件规范与宿主（托盘 + 卡片 + 小面板，不含业务）                   |

## 安装冻结版本

`lib/host.js` / `lib/client.js` 已随仓库提交，克隆后无需 build：

```bash
dsh plugin --profile web add ./archive/token-meter
dsh web   # 重启生效
```

- 归档插件的 `package.json` 仍保持运行时零依赖，装到 DSH profile 不需要额外安装包。
- 它们不会再出现在 `latest` Release 的安装说明里；旧 Release 里的历史 tgz 仍可下载，但不再重建。
- `@dshp/token-meter` 的统计小组件会用到 `@dshp/widget-kit`（可选增强，不装则退回插件自带浮层），两者都已归档；按冻结版本一起安装即可，行为以当时文档为准。

## 重新构建（一般不需要）

归档目录不在 pnpm workspace 内，根目录 `pnpm install` 不会为它们装依赖。确需重打某个插件时，把目录临时移回 `plugins/`（保持 `../../shared` 与 `../../tsconfig.base.json` 的相对层级；若它依赖其他归档插件，也一并移回 workspace），或在该目录单独安装依赖后 `pnpm build`。归档件不保证能跟随未来 DSH 版本通过门禁。

## 为什么归档

集中维护视觉桥接，避免为不再使用的插件持续跟进 DSH 的 breaking 变更；历史实现仍有参考价值（provider 分层、工具行接管、主题 token、小组件契约），因此保留源码而不是删除。相关规范的「标杆」表述已在根 `AGENT.md` 与 `docs/` 中标注归档状态。
