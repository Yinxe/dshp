/**
 * 配置：schemastery schema（volatile 声明）
 *
 * - 官方 settings 命名空间 `dshp-token-meter`（与包名/路由前缀/cordis id 一致）
 * - 0.1.7 起持久化在 profile `cordis.patch.yml` 条目 `config:`（旧 settings.yaml 由各插件
 *   同名条目一次性自动导入，导入后改名 `.imported`）；导出的 `Config` 由 cordis 在装载期
 *   校验条目原始配置——**非法配置 = 整个插件条目不启用**，不再有旧版逐字段消毒回退。
 * - 除 `version` 外全字段 `.volatile()`：路由写入（settings.update）原地生效，
 *   `refreshSec` 定时器与供应商清单热更新都不必重启。`vendors` 整数组 volatile，
 *   路由始终以整组 `update(NS, { vendors: [...] })` 提交。
 * - 只认 NS：历史命名空间（`dshp-inx-token-quota` / `dshp-inx-token-stats`）与旧文件
 *   （`storages/token-quota.json`）不再读写、不再迁移
 *   （stats 的指纹缓存走 storageDomain 域 `token_stats`，域名保持不变，见 stats/engine.ts）
 *
 * @module @dshp/token-meter
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from './http.js';

export const NS: string = settingsNamespace('dshp-token-meter');

const VendorSchema: any = z.object({
  id: z.string().required(),
  name: z.string().required(),
  type: z.string().default('manual'),
  params: z.dict(z.any()).default({}),
  // 余额查询开关：false = 不参与 Host 定时拉取（手动拉取不受影响），缺省 = 启用
  enabled: z.boolean().default(true),
});

export const ConfigSchema: any = z.object({
  version: z.number().step(1).default(1),
  activeVendor: z.string().default('').volatile(),
  refreshSec: z.number().step(1).min(0).max(3600).default(60).volatile(),
  enabled: z.boolean().default(true).volatile(),
  vendors: z.array(VendorSchema).default([]).volatile(),
  showToday: z.boolean().default(false).volatile(),
  // token 统计默认「全部」；热力图另有自己的 6 个月默认（客户端）
  defaultRange: z
    .union([z.const('7'), z.const('30'), z.const('90'), z.const('all')])
    .default('all')
    .volatile(),
  // 在线时长空闲阈值（分钟）：1/5/15/30/60。缺省 15：DSH 干活时日志里本就有事件，不需要
  // 大阈值兜底；要兜的是「读长回答、想下一个需求」这类几分钟量级的静默期。
  onlineGapMin: z.number().step(1).min(1).max(60).default(15).volatile(),
});
