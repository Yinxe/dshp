/**
 * /mcwiki 人用斜杠命令 —— 在会话输入框直接查询中文 Minecraft Wiki，
 * 结果以文本回显给用户，不经模型、不占用工具调用轮次。
 *
 * 设计约束（对齐输入框现实）：
 *  - 单命令单动作，**不做子命令**：input.hint 只是静态文字，输入框不会为
 *    子命令做补全，用户发现不了。想看别的条目就 /mcwiki <条目名> 再搜。
 *  - 输出是 **Markdown**：客户端通过官方 `conversation.chat.commandview`
 *    槽位（按命令名 keyed）注册了自定义卡片，用原语库的 MarkdownText 渲染；
 *    未占用该槽位的端点回退通用卡片，Markdown 源文本也保持可读。
 *  - 第一条详情 = **整页纯文本**（wiki 的 exintro 引言往往只有一两句，没料），
 *    上限取设置「全文上限」maxChars（0 = 完整）；详情抓取失败降级为纯列表。
 *
 * 注册形态对齐官方 @deepseek-ai/dsh-command-goal：ctx.commands.register +
 * definitionId + input.hint，handler 返回 CommandResult，支持 Promise。
 * commands 服务按可选依赖处理（ctx.get + 判空，未挂载时跳过注册）。
 *
 * @module @dshp/mcwiki-search
 */
import { fetchPageIntro, searchWiki } from './api.js';
import type { AnyCtx, PageIntroResult, PluginConfig, SearchWikiResult } from './types.js';

/** ISO 时间串 → 日期（YYYY-MM-DD）；非该形态原样返回。 */
function shortDate(v: string): string {
  return /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.slice(0, 10) : v;
}

/** 统一的成功文本结果（CommandResult 形态，零类型依赖手写对齐）。 */
function ok(text: string): { kind: 'success'; text: string } {
  return { kind: 'success', text };
}

/** 统一的失败文本结果。 */
function fail(text: string): { kind: 'error'; text: string } {
  return { kind: 'error', text };
}

/** wiki 纯文本导出的 `== X ==` 分节标题 → Markdown `###` 层级。 */
function wikiHeadingsToMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const m = /^(={2,5})\s*(.+?)\s*\1\s*$/.exec(line);
      if (!m) return line;
      const level = (m[1]?.length ?? 2) + 1; // == → ###，=== → ####
      return '#'.repeat(level) + ' ' + (m[2] ?? '');
    })
    .join('\n');
}

/** 搜索结果 → Markdown 编号列表（标题即链接 + 摘要 + 更新日期）。 */
function renderList(r: SearchWikiResult): string {
  const head = `### 「${r.query}」· ${r.totalHits} 条命中（显示前 ${r.results.length} 条${r.truncated ? '，已按设置截断' : ''}）`;
  const items = r.results.map((item, i) => {
    const lines = [`${i + 1}. **[${item.title}](${item.url})** — ${item.snippet}`];
    if (item.updated) lines.push(`   （更新于 ${shortDate(item.updated)}）`);
    return lines.join('\n');
  });
  return [head, '', ...items].join('\n');
}

/** 解析并执行一条 /mcwiki（网络调用按 invocation.signal 取消）。 */
async function executeMcwikiCommand(
  getConfig: () => PluginConfig,
  invocation: { rawInput?: unknown; signal?: unknown },
): Promise<{ kind: 'success' | 'error'; text: string }> {
  const cfg = getConfig();
  const raw = typeof invocation?.rawInput === 'string' ? invocation.rawInput.trim() : '';
  if (raw.length === 0) return ok('用法：/mcwiki <搜索词或条目名>——回显搜索列表与第一条条目详情');
  const signal = invocation?.signal instanceof AbortSignal ? invocation.signal : undefined;

  const r = (await searchWiki({
    query: raw,
    limit: cfg.searchMaxResults,
    signal,
    timeoutMs: cfg.timeoutMs,
  })) as SearchWikiResult;
  if (r.results.length === 0) {
    return ok(`「${r.query}」没有命中任何条目；换个更短的关键词试试。`);
  }

  // 命中即附第一条的整页正文（wiki 的 exintro 引言往往只有一两句，没料；
  // 上限取设置「全文上限」maxChars（0 = 完整）；抓取失败降级为纯列表）
  const first = r.results[0];
  if (first === undefined) return ok(`「${r.query}」没有命中任何条目。`);
  let detail: string;
  try {
    const intro = (await fetchPageIntro({
      pageid: first.pageid,
      wholePage: true,
      maxChars: cfg.maxChars,
      signal,
      timeoutMs: cfg.timeoutMs,
    })) as PageIntroResult;
    detail = [
      `## ${intro.title}${intro.truncated ? `（正文已按设置截断到 ${cfg.maxChars} 字）` : ''}`,
      '',
      wikiHeadingsToMarkdown(intro.text),
      '',
      `来源：${intro.url}`,
    ].join('\n');
  } catch (e) {
    detail =
      '> —— 详情获取失败（' +
      String((e as Error)?.message ?? e).slice(0, 120) +
      '），可再试一次 /mcwiki ' +
      first.title +
      ' ——';
  }
  return ok(
    [
      renderList(r),
      '',
      '---',
      '',
      detail,
      '',
      '> 详情为第一条的整页文本（上限取设置「全文上限」，0 = 完整）；需要 Markdown 全文转换就让模型调用 mcwiki_get_page。',
    ].join('\n'),
  );
}

/** 注册 /mcwiki（commands 为可选服务；未挂载时静默跳过并记一行 info）。 */
export function registerCommand(ctx: AnyCtx, getConfig: () => PluginConfig): void {
  const commands = ctx.get('commands') as AnyCtx;
  if (!commands || typeof commands.register !== 'function') {
    try {
      console.info('[dshp-mcwiki-search] commands 服务未挂载，跳过 /mcwiki 命令注册');
    } catch {
      /* ignore */
    }
    return;
  }
  ctx.effect(
    () =>
      commands.register({
        // definitionId 为品牌字符串（官方包用包名）；AnyCtx 体系下直接传同值
        definitionId: '@dshp/mcwiki-search',
        name: 'mcwiki',
        description: '查询中文 Minecraft Wiki：回显搜索列表与第一条条目正文（Markdown 渲染）',
        input: { hint: '<搜索词或条目名>' },
        handler: (invocation: { rawInput?: unknown; signal?: unknown }) =>
          executeMcwikiCommand(getConfig, invocation).catch((e: unknown) =>
            fail('Minecraft Wiki 查询失败：' + String((e as Error)?.message ?? e).slice(0, 300)),
          ),
      }),
    'dshp-mcwiki-search: /mcwiki command',
  );
}
