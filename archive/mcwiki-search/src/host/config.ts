/**
 * 配置：schemastery schema（volatile 声明）
 *
 * - 官方 settings 命名空间 `dshp-mcwiki-search`（与包名/路由前缀/cordis id 一致）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 一次性自动导入）；
 *   全字段 `.volatile()`，`settings.update` 写入原地生效不重启插件
 * - 只认 NS：历史命名空间 `dshp-inx-mcwiki-search` 不再读写、不再重命名
 * - 本插件无自有文件存储（配置只进条目 config NS）
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from './http.js';
import { DEFAULT_TIMEOUT_MS } from './api.js';

export const NS: string = settingsNamespace('dshp-mcwiki-search');

/** 0 = 不截断、完整输出。 */
export const ConfigSchema: any = z.object({
  timeoutMs: z.number().step(1).min(1000).default(DEFAULT_TIMEOUT_MS).volatile(),
  maxChars: z.number().step(1).min(0).default(0).volatile(),
  introMaxChars: z.number().step(1).min(0).default(0).volatile(),
  searchMaxResults: z.number().step(1).min(1).default(8).volatile(),
});
