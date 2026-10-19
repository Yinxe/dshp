# 文档规范（README 形态）

> 本文承接旧 AGENT.md §13（文档规范）的完整细节。规则版总纲见[仓库根 AGENT.md](../AGENT.md)。

## 插件 README 章节顺序（安装前置，用户第一眼就能装上）

````
# @dshp/<name>                  标题 = 包名
简介段（一句话说清「干什么、解决什么」）+ 设计原则 blockquote
## 安装（唯一方式：克隆 monorepo + 本地安装）   ← 必须紧跟简介，不许后置
    克隆/install/add/重启四步 + 「改源码后」+「验证」+ 一键 AI 安装话术块（```text）
## 更新
## 界面预览        （有 images/ 才写：截图 + 说明，用 <images/xxx.png> 尖括号语法吃空格）
## 功能            四行表：Host / Client / 同源路由 / 工具
## 配置项 / tool 参数表 / setting.yml 示例
## 代码结构 → 常见问题 → 卸载
## 移植说明        （monorepo 定位 + 原版逐文件对应关系，开发向信息后置）
## 免责声明
````

- 安装四步固定文案：`git clone … && pnpm install` → `dsh plugin --profile web add ./plugins/<name>` → `dsh web`；注明「lib/ 已提交，无需 build」与「唯一方式：本地装，不能 `pnpm add`」。Release / git 依赖两种备选方式与历史版本（compat.json）也在此节，文案与 vision-bridge README 对齐。
- 移植说明（原 JS 仓库 → TS 文件的逐文件对应、构建命令）**放文末**，不要占开头位置。
- 一键 AI 安装话术块给 ```text 代码块，写清子目录名与包名，便于直接粘给 DSH AI。

## 根 README 负责「找插件 + 装插件」

插件一览表（维护中 + 已归档两段，每行链到该插件 README）→ 安装到 DSH（含一键 AI 安装）→ 结构 → 环境 → 常用命令 → 加新插件。截图留在归档插件自己的 README 里。不写单个插件的功能细节（细节归各自 README；门禁以 CICD.yml 为准，版本/tag 政策见 docs/release-and-compat.md）。

## AGENT.md 分层（本仓的三级结构）

1. **根 `AGENT.md`**：跨插件的红线规则（精简版，一屏内读完），每条规则链到 docs/ 详情。
2. **`docs/*.md`**：按主题承接细节（脚手架 / TS / package.json / 构建依赖 / Cordis / settings / 路由 / Client / provider / 时区 / 安全 / 门禁 / 发布 / 文档）。
3. **`plugins/<name>/AGENT.md`**（维护中）或 **`archive/<name>/AGENT.md`**（归档）：该插件自己的局部规则与事实（NS、槽位占位、路由面、自检脚本、特殊边界），开头指回上两层。代码注释引用规范时**链接到具体文档文件**（如 `docs/settings.md`），不引用根 AGENT.md 的旧 §编号——编号在精简后会漂移。
