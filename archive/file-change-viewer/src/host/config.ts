/**
 * 配置：schemastery schema（volatile 声明）
 *
 * - 官方 settings 命名空间 `dshp-file-change-viewer`（与 cordis 行 id 同名，仓库约定）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 一次性自动导入）；
 *   全字段 `.volatile()`：`settings.update` 写入原地生效，`patchTool` 开关的重新判定由
 *   `loader/volatile-update` 驱动，不必重启。
 * - 只认 NS：不读历史 key、不写自有文件（docs/settings.md「命名空间」/「不做迁移」）
 *
 * @module @dshp/file-change-viewer
 */
import z from '@deepseek-ai/schemastery';

/** settings 命名空间，也是「设置 → 插件」配置卡片的槽位 key。 */
export const NS = 'dshp-file-change-viewer';

/** settings 服务的命名空间 schema（约束进 schema，设置页与手工编辑条目 config 都走它）。 */
export const ConfigSchema: any = z.object({
  view: z
    .union([z.const('highlight'), z.const('diff')])
    .default('highlight')
    .volatile(),
  sectionsOpen: z.boolean().default(false).volatile(),
  patchTool: z.boolean().default(false).volatile(),
  contextLines: z
    .union([z.const(0), z.const(3), z.const(5), z.const(8)])
    .default(3)
    .volatile(),
});
