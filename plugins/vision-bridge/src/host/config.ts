/**
 * 配置 schema。
 *
 * 配置持久化在 profile `cordis.patch.yml` 条目 `config:`，全部字段 `.volatile()`：
 * `settings.update(NS, patch)` 写入后由 loader 原地提交，不重启插件。
 * 只认 `dshp-vision-bridge` 一个命名空间，不做历史 key / 旧文件迁移。
 */
import z from '@deepseek-ai/schemastery';

export const NS = 'dshp-vision-bridge';

const RouteSchema = z.object({
  provider: z.string().required(),
  model: z.string().required(),
});

export const ConfigSchema: any = z.object({
  enabled: z.boolean().default(true).volatile(),
  primary: z
    .union([RouteSchema, z.const(null)])
    .default(null)
    .volatile(),
  fallback: z
    .union([RouteSchema, z.const(null)])
    .default(null)
    .volatile(),
});
