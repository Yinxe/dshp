# 版本、兼容与发布

> 本文承接旧 AGENT.md §14（版本、兼容与发布）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 版本与兼容

- main 维护 `plugins/vision-bridge` 与 `plugins/search-provider`，它们永远跟最新 DSH；`archive/` 下的插件冻结，不参与版本与发布。`compat.json` 记录 DSH 版本 → 推荐 tag。
- DSH 发新版且有 breaking：当前 main 打 annotated tag `v<根版本>`（message 写 DSH 版本）→ `compat.json` 追加一行 → 再在 main 上适配。平时不打 tag。老 DSH 用户按 `compat.json` `git checkout <tag>`。
- tag 只在「DSH 上游发新版 breaking」时回头打（`compat.json` 的 `compat` 数组记 DSH 版本 → 推荐 tag）。

## 发布流水线（唯一 workflow `.github/workflows/CICD.yml`）

五条门禁（install→format→lint→typecheck→build→test）全过后按触发发布：

| 通道         | 触发                      | 行为                                                                                |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------- |
| `latest`     | 推送 `main`               | 滚动重建到最新提交（正式渠道，Latest 徽标置顶），资产名 `-latest.tgz`，下载地址固定 |
| 版本 Release | 推送 `v*` tag             | 静态存档（`--generate-notes`），永不随构建变化，资产名 `-<tag>.tgz`                 |
| 自定义后缀   | 手动触发（限 main / tag） | `suffix` + `rolling` 勾选：勾选=预发布随滚动；不勾=静态正式版                       |
| 仅门禁       | 推送其他分支 / PR         | 不打包、不发布（`pack=false`，产物不上传）                                          |

- **只有 `main` 与 `v*` tag 能产出发布物**：其他分支推送与 PR 只跑门禁；手动触发是唯一的人工发版口，在别的 ref 上触发同样只跑门禁（并打一条 `::notice::`）。历史上曾有「推送任意非 `dev`/`feature/*` 分支 → 分支同名预发布」的通道，已拿掉——它会让 Release 列表被一次性分支刷屏，并立刻撞上下面的数量约束。
- 打包只遍历 `plugins/*`（当前 `vision-bridge` + `search-provider`）；`archive/` 不打包、不发版。打包用 `pnpm pack`（遵循各包 `files`，根 LICENSE 自动附带）；notes 由 `scripts/gen-release-notes.cjs` 生成（包名/版本/双语描述/下载与安装命令）。

## 滚动约定

- 滚动集合 = 所有**预发布** + notes 首行带 `<!-- rolling: true -->` 标记的 release，都随 main 重建；停止跟随 = 取消 Pre-release 勾选或删除标记行；tag 版本 Release 永不滚动。
- 数量约束：除 `latest` 外滚动项最多 **1 个**，CI 在创建前与 main 重建前各校验一次，超限立即 `::error::` 终止且不动任何现有 Release。
- 手动触发自定义后缀时，`v+数字` 形态的正式 release 重名拒绝覆盖（预发布形态则整体重建）。

## 发 npm（已下线，暂不做）

发布流在 `de6ab3c` 下线，README 安装节已含 Releases 直装方式。将来要重新启用：

1. 重建 `.github/workflows/publish.yml`（tag `v*` 触发 → `pnpm -r publish --provenance`，Trusted Publishing 免 Token）；
2. npm 建组织 `dshp`（公有包免费）或改名到个人 scope，每个包配 Trusted Publisher。

未重建前不要写「打 tag 即发布」。

## 发版 checklist

`format/lint/typecheck/build/test` 全绿 → `lib/` 已重打并提交 → 插件 README 安装/更新节已同步 → 版本号已升 →（发包时）tag 已打。
