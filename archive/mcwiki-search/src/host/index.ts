/**
 * @dshp/mcwiki-search —— DSH Bundle 插件 Host 半（Cordis 插件，TS 重写）
 *
 * 挂载：~/.dsh/profiles/<profile>/cordis.patch.yml（自动通过 bundle patch）
 *
 * 提供三个模型工具（数据全部经 convert.ts 清洗后输出，模型只看到干净文本）：
 *   - mcwiki_search      —— 全文搜索，返回清洗后的结果列表（标题/摘要/URL/更新时间）
 *   - mcwiki_get_page    —— 抓取页面：intro（extracts 纯文本）或 full（wikitext→Markdown/纯文本）
 *   - mcwiki_random      —— 随机条目 + 引言纯文本
 *
 * 以及人用斜杠命令（command.ts，commands 可选服务，未挂载自动跳过）：
 *   /mcwiki <搜索词> | read <条目标题> | random —— 结果直接回显给用户，不经模型
 *
 * 以及三个同源 JSON 路由（设置页状态 / 配置持久化 / 连接测试）：
 *   GET  /ext/dshp-mcwiki-search/state
 *   POST /ext/dshp-mcwiki-search/config  { timeoutMs?, maxChars?, introMaxChars?, searchMaxResults? }
 *   POST /ext/dshp-mcwiki-search/test    { query, title?, section? }
 *
 * 持久化（标准 settings 存储，对齐 vision-bridge 与官方插件）：
 *  profile `cordis.patch.yml` 条目 `config:`（NS `dshp-mcwiki-search` = 条目 id），
 *  工具与路由每次调用都读当前生效配置（volatile 引用），外部编辑原地热更新无需重启。
 *  配置只认该命名空间，不做历史 key 迁移。
 *
 * 原实现：~/.dsh/plugins/dsh-mcwiki-search（JS，@dshp-inx/mcwiki-search v1.0.1）
 * 本目录为等价 TS 重写：lib/{index,api,convert}.js → src/host/{index,tools,routes,api,convert,config,http,types}.ts，
 * tsup 打包为单文件 lib/host.js（ESM，schemastery 内联，运行时零依赖）。
 *
 * @module @dshp/mcwiki-search
 */
import { ConfigSchema, NS } from './config.js';
import { registerCommand } from './command.js';
import { registerRoutes } from './routes.js';
import { registerTools } from './tools.js';
import type { AnyCtx, PluginConfig, VolatileConfig } from './types.js';

export const name = '@dshp/mcwiki-search';
export const inject: string[] = ['tools', 'webServer'];
export { NS, ConfigSchema };
/** Cordis 用它校验条目 config 并派生设置表单（全字段 volatile，原地热更新）。 */
export const Config = ConfigSchema;

export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  // 官方 settings：自定义设置页 + 条目 config 持久化（0.1.7 契约）
  try {
    ctx.inject(['settings'], (sctx: AnyCtx) => {
      // 本插件自带设置页（settings.section），关掉 schema 自动生成的页面。
      sctx.effect(
        () => sctx.settings.configure({ auto: false }, ctx.fiber),
        'dshp-mcwiki-search: settings-page',
      );
    });
  } catch {
    /* ignore */
  }

  function getConfig(): PluginConfig {
    return {
      timeoutMs: config.timeoutMs.get(),
      maxChars: config.maxChars.get(),
      introMaxChars: config.introMaxChars.get(),
      searchMaxResults: config.searchMaxResults.get(),
    };
  }

  async function updateConfig(configPatch: Record<string, unknown>): Promise<void> {
    const settings = ctx.get('settings') as AnyCtx;
    if (!settings)
      throw new Error(
        'settings 服务不可用，无法持久化到 profile 条目 config（请重启 DSH 确认设置服务已挂载）',
      );
    await settings.update(NS, configPatch);
  }

  registerTools(ctx, getConfig);
  registerRoutes(ctx, getConfig, updateConfig);

  // /mcwiki 斜杠命令（commands 为可选服务，未挂载时内部跳过注册）
  try {
    registerCommand(ctx, getConfig);
  } catch (e) {
    try {
      console.error(
        '[dshp-mcwiki-search] register /mcwiki command failed: ' + String((e as Error)?.message ?? e),
      );
    } catch {
      /* ignore */
    }
  }

  // 系统提示引导（可选服务；不存在则跳过，工具本身仍可用）
  try {
    const systemPrompt = ctx.get('systemPrompt') as AnyCtx;
    if (systemPrompt !== undefined && typeof systemPrompt.section === 'function') {
      ctx.effect(
        () =>
          systemPrompt.section({
            name: 'tool:mcwiki',
            order: 112,
            text: 'Minecraft Wiki 查询工具（mcwiki_search / mcwiki_get_page / mcwiki_random）：查询 Minecraft 官方知识库，返回已清洗的 AI 可读文本。搜到结果后如需详情，用 mcwiki_get_page 抓取页面；引用内容时附上页面 URL。',
          }),
        'dshp-mcwiki-search: prompt section',
      );
    }
  } catch {
    /* ignore */
  }
}
