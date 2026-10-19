/**
 * 模型工具注册（mcwiki_search / mcwiki_get_page / mcwiki_random）
 *
 * 数据全部经 convert.ts 清洗后输出，模型只看到干净文本。
 * 原实现：lib/index.js 的 registerTools 段（JS）→ 本文件为等价 TS 重写，行为不变
 * （仅修正 full 默认 format 为 markdown，与工具描述/ README 一致；原 JS 因三元优先级
 * 误默认为 text）。
 */
import { fetchPageIntro, fetchPageWikitext, fetchRandomPages, searchWiki } from './api.js';
import { markdownToPlainText, wikitextToMarkdown } from './convert.js';
import type { AnyCtx, GetPageToolValue, PluginConfig, RandomToolValue, SearchWikiResult } from './types.js';

// ── 参数校验（裸 JSON Schema 无法表达边界，手工校验）────────────────────────

function requireQuery(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('query 必须是非空字符串');
  return value.trim();
}

function intBetween(value: unknown, fallback: number, min: number, max: number, label: string): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} 必须是 ${min}–${max} 的整数`);
  return n;
}

function requireTitle(value: unknown): string {
  if (value === undefined || value === null || String(value).trim().length === 0) {
    throw new Error('必须提供 title（页面标题）或 pageid（页面 ID）');
  }
  return String(value).trim();
}

function optionalPageid(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error('pageid 必须是正整数');
  return n;
}

// ── 模型可见输出格式化 ─────────────────────────────────────────────────────

function formatSearch(value: SearchWikiResult): string {
  const lines: string[] = [];
  lines.push(
    `已在中文 Minecraft Wiki 搜索「${value.query}」，共 ${value.totalHits} 条结果（显示前 ${value.results.length} 条）：\n`,
  );
  value.results.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    if (item.snippet.length > 0) lines.push(`   ${item.snippet}`);
    const meta: string[] = [item.url];
    if (item.updated.length > 0) meta.push(`更新于 ${item.updated.slice(0, 10)}`);
    lines.push(`   ${meta.join(' · ')}`);
  });
  if (value.truncated) lines.push(`\n（结果过多已截断，可用更精确的关键词缩小范围）`);
  lines.push('\n引用来源时请附上对应 URL。');
  return lines.join('\n');
}

function formatPage(value: GetPageToolValue): string {
  const lines: string[] = [];
  lines.push(`# ${value.title}`);
  lines.push(
    `（${value.section === 'intro' ? '引言' : '全文'} · ${value.format} · 页面ID ${value.pageid}${value.updated ? ` · 更新于 ${value.updated.slice(0, 10)}` : ''}）\n`,
  );
  if (value.text.length > 0) lines.push(value.text);
  else lines.push('（该页面暂无可用正文）');
  lines.push(`\n来源：${value.url}`);
  return lines.join('\n');
}

function formatRandom(value: RandomToolValue): string {
  const lines: string[] = ['随机条目的引言（AI 可直接阅读）：\n'];
  value.results.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    if (item.text.length > 0) lines.push(`   ${item.text}`);
    lines.push(`   ${item.url}`);
  });
  return lines.join('\n');
}

// ── 工具注册 ───────────────────────────────────────────────────────────────
// getConfig 为 thunk：每次执行都读当前生效配置，settings.yaml 外部编辑热重载无需重启。

export function registerTools(ctx: AnyCtx, getConfig: () => PluginConfig): void {
  try {
    ctx.tools.register({
      name: 'mcwiki_search',
      description:
        '搜索中文 Minecraft Wiki（zh.minecraft.wiki）。返回清洗后的 AI 可读结果：标题、摘要、页面 URL、更新时间。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string', description: '搜索关键词，例如「钻石」「苦力怕」或 "Ancient City"。' },
          limit: { type: 'integer', description: '返回条数，1–20，默认 8。' },
        },
        required: ['query'],
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            success: { type: 'boolean', const: true },
            query: { type: 'string' },
            totalHits: { type: 'integer' },
            truncated: { type: 'boolean' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  pageid: { type: 'integer' },
                  url: { type: 'string' },
                  snippet: { type: 'string' },
                  updated: { type: 'string' },
                },
                required: ['title', 'pageid', 'url'],
              },
            },
          },
          required: ['success', 'query', 'totalHits', 'results'],
        },
        render: (_args: unknown, value: SearchWikiResult) => [{ type: 'text', text: formatSearch(value) }],
      },
      isConcurrencySafe: () => true,
      async execute(args: Record<string, unknown>, exec: { signal?: AbortSignal }) {
        const config = getConfig();
        const query = requireQuery(args['query']);
        const limit = intBetween(args['limit'], config.searchMaxResults, 1, 20, 'limit');
        return searchWiki({
          signal: exec !== undefined ? exec.signal : undefined,
          timeoutMs: config.timeoutMs,
          query,
          limit,
        });
      },
    });
  } catch (e) {
    try {
      console.error(
        '[dshp-mcwiki-search] register mcwiki_search failed: ' + String((e as Error)?.message ?? e),
      );
    } catch {
      /* ignore */
    }
  }

  try {
    ctx.tools.register({
      name: 'mcwiki_get_page',
      description:
        '抓取中文 Minecraft Wiki 页面并把内容转换成 AI 可直接阅读的格式，默认完整输出不截断。section=intro 返回纯文本引言（默认）；section=full 返回全文，format=markdown 返回 Markdown（默认）或 text 纯文本或 wikitext 原始源码。所有信息与细节都保留：模板/引用/噪声已清洗，正文完整。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: '页面标题，例如「苦力怕」或 "Diamond"。与 pageid 二选一。' },
          pageid: { type: 'integer', description: '页面 ID（来自 mcwiki_search 结果）。与 title 二选一。' },
          section: {
            type: 'string',
            enum: ['intro', 'full'],
            description: 'intro=引言纯文本；full=全文转换。默认 intro。',
          },
          format: {
            type: 'string',
            enum: ['markdown', 'text', 'wikitext'],
            description: 'full 时的输出格式：markdown/text/wikitext。默认 markdown。',
          },
          maxChars: {
            type: 'integer',
            description:
              '可选输出上限（字符）。0 或缺省 = 不截断、完整输出；传正整数才截断（如上下文紧张时 20000）。',
          },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            success: { type: 'boolean', const: true },
            title: { type: 'string' },
            pageid: { type: 'integer' },
            url: { type: 'string' },
            section: { type: 'string' },
            format: { type: 'string' },
            text: { type: 'string' },
            updated: { type: 'string' },
            truncated: { type: 'boolean' },
          },
          required: ['success', 'title', 'pageid', 'url', 'section', 'format', 'text'],
        },
        render: (_args: unknown, value: GetPageToolValue) => [{ type: 'text', text: formatPage(value) }],
      },
      isConcurrencySafe: () => true,
      async execute(args: Record<string, unknown>, exec: { signal?: AbortSignal }) {
        const config = getConfig();
        const section = args['section'] === 'full' ? 'full' : 'intro';
        const rawFormat = args['format'];
        let format: 'markdown' | 'text' | 'wikitext';
        if (section === 'full') {
          if (rawFormat === undefined || rawFormat === null || rawFormat === '') format = 'markdown';
          else if (rawFormat === 'markdown' || rawFormat === 'text' || rawFormat === 'wikitext')
            format = rawFormat;
          else throw new Error("format 只能是 'markdown'、'text' 或 'wikitext'");
        } else {
          format = 'text';
        }
        const pageid = optionalPageid(args['pageid']);
        const title = pageid === undefined ? requireTitle(args['title']) : undefined;
        // 截断上限解析：工具参数优先；0/缺省 = 不截断；config 兜底（0 = 不截断）
        const requested = args['maxChars'] !== undefined ? Number(args['maxChars']) : NaN;
        const introMaxChars =
          Number.isFinite(requested) && requested > 0
            ? requested
            : config.introMaxChars > 0
              ? config.introMaxChars
              : undefined;
        const fullMaxChars =
          Number.isFinite(requested) && requested > 0
            ? requested
            : config.maxChars > 0
              ? config.maxChars
              : undefined;
        const common = {
          signal: exec !== undefined ? exec.signal : undefined,
          timeoutMs: config.timeoutMs,
          ...(title !== undefined ? { title } : {}),
          ...(pageid !== undefined ? { pageid } : {}),
        };

        if (section === 'intro') {
          const result = await fetchPageIntro({
            ...common,
            ...(introMaxChars !== undefined ? { maxChars: introMaxChars } : {}),
          });
          const out: GetPageToolValue = {
            success: true,
            title: result.title,
            pageid: result.pageid,
            url: result.url,
            section: 'intro',
            format: 'text',
            text: result.text,
            truncated: result.truncated,
          };
          return out;
        }

        const full = await fetchPageWikitext(common);
        if (format === 'wikitext') {
          let text = full.wikitext;
          let truncated = false;
          if (fullMaxChars !== undefined && text.length > fullMaxChars) {
            text = `${text.slice(0, fullMaxChars).trimEnd()}\n\n…（源码超过 ${fullMaxChars} 字符上限已截断，可传 maxChars=0 关闭截断）`;
            truncated = true;
          }
          const out: GetPageToolValue = {
            success: true,
            title: full.title,
            pageid: full.pageid,
            url: full.url,
            section: 'full',
            format: 'wikitext',
            text,
            updated: full.updated,
            truncated,
          };
          return out;
        }
        const converted = wikitextToMarkdown(
          full.wikitext,
          fullMaxChars === undefined ? {} : { maxChars: fullMaxChars },
        );
        const plain =
          format === 'text'
            ? markdownToPlainText(
                converted.markdown,
                fullMaxChars === undefined ? {} : { maxChars: fullMaxChars },
              )
            : undefined;
        const text = plain !== undefined ? plain.text : converted.markdown;
        const truncated = plain !== undefined ? plain.truncated : converted.truncated;
        const out: GetPageToolValue = {
          success: true,
          title: full.title,
          pageid: full.pageid,
          url: full.url,
          section: 'full',
          format,
          text,
          updated: full.updated,
          truncated,
        };
        return out;
      },
    });
  } catch (e) {
    try {
      console.error(
        '[dshp-mcwiki-search] register mcwiki_get_page failed: ' + String((e as Error)?.message ?? e),
      );
    } catch {
      /* ignore */
    }
  }

  try {
    ctx.tools.register({
      name: 'mcwiki_random',
      description: '随机获取中文 Minecraft Wiki 条目（含引言纯文本），适合探索未知内容或验证知识库覆盖。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          limit: { type: 'integer', description: '返回条目数，1–10，默认 3。' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            success: { type: 'boolean', const: true },
            results: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  pageid: { type: 'integer' },
                  url: { type: 'string' },
                  text: { type: 'string' },
                },
                required: ['title', 'url'],
              },
            },
          },
          required: ['success', 'results'],
        },
        render: (_args: unknown, value: RandomToolValue) => [{ type: 'text', text: formatRandom(value) }],
      },
      isConcurrencySafe: () => true,
      async execute(args: Record<string, unknown>, exec: { signal?: AbortSignal }) {
        const config = getConfig();
        return fetchRandomPages({
          signal: exec !== undefined ? exec.signal : undefined,
          timeoutMs: config.timeoutMs,
          limit: intBetween(args['limit'], 3, 1, 10, 'limit'),
          maxIntroChars: config.introMaxChars,
        });
      },
    });
  } catch (e) {
    try {
      console.error(
        '[dshp-mcwiki-search] register mcwiki_random failed: ' + String((e as Error)?.message ?? e),
      );
    } catch {
      /* ignore */
    }
  }
}
