/**
 * mcwiki-search —— 数据转换管线
 *
 * 职责：把 Minecraft Wiki（MediaWiki）返回的「原始数据」转换成 AI 可以直接
 * 阅读的干净文本。插件对外承诺：模型看到的永远是清洗后的结果，绝不让原始
 * wikitext / HTML / 模板噪声进入模型上下文。
 *
 * 管线：
 *   1. cleanSearchSnippet(html)  —— 搜索摘要：把 <span class="searchmatch">
 *      高亮标签转成 **加粗**，解码实体，折叠空白，修复中文 bigram 拆词。
 *   2. decodeEntities(str)      —— HTML 实体解码（含数字/十六进制实体）。
 *   3. wikitextToMarkdown(src)  —— wikitext → Markdown：
 *      - 整块处理多行 {{模板}}（信息框/历史/音效表等噪声整块丢弃，
 *        {{tr|简体|…}} 取简体、*Link/*Sprite 取首参、{{droptable/Line}} 保留掉落信息、
 *        {{only/in/el/edition}} 渲染版本、{{quote}} 保留引言）
 *      - 丢弃注释、<ref>/<gallery>/<syntaxhighlight> 等标签块
 *      - [[目标|显示名]] → 显示名；[[File:…]]/[[Category:…]]/[[w:…]]/跨语言链接 丢弃
 *      - == 标题 == → ## 标题；三引号粗体、双引号斜体 → Markdown 记号
 *      - 列表 * # : ; 归一化；{|…|} 表格扁平化为 Markdown 表格（超长截断）
 *   4. markdownToPlainText(md)  —— Markdown → 纯文本（供 format=text 用）
 *   5. normalizeWhitespace      —— 连续空行/行尾空白清理
 *
 * 原实现：lib/convert.js（JS，492 行）→ 本文件为等价 TS 重写，行为不变。
 */

// ── HTML 实体解码 ──────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  middot: '·',
  bull: '•',
  times: '×',
  minus: '−',
  ge: '≥',
  le: '≤',
  ne: '≠',
  asymp: '≈',
  deg: '°',
  shy: '',
  brvbar: '¦',
  thinsp: ' ',
  ensp: ' ',
  emsp: ' ',
};

/** HTML 实体解码：&name; &#NNN; &#xHH;（NaN/越界保留原文）。 */
export function decodeEntities(str: string): string {
  if (typeof str !== 'string' || str.length === 0) return str;
  return str.replace(/&(#?[a-zA-Z0-9]+);/g, (match: string, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = NAMED_ENTITIES[body];
    return named !== undefined ? named : match;
  });
}

// ── 通用文本清洗 ────────────────────────────────────────────────────────────

/** 折叠连续空白（含全角空格/换行）为单个空格，并去除行首尾空白。 */
export function collapseWhitespace(str: string): string {
  return String(str).replace(/\s+/g, ' ').trim();
}

/** 行尾空白与连续空行清理（最多保留一个空行分隔段落）。 */
export function normalizeWhitespace(str: string): string {
  return String(str)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── 搜索摘要清洗 ────────────────────────────────────────────────────────────

/**
 * MediaWiki 搜索摘要：把 <span class="searchmatch">命中词</span> 转成
 * **加强标记**，去掉其余标签，解码实体，折叠空白，并修复 MediaWiki 对中文
 * bigram 分词在词中间插入的空格（「苦力 怕」→「苦力怕」）。
 */
export function cleanSearchSnippet(html: string): string {
  if (typeof html !== 'string' || html.length === 0) return '';
  return collapseWhitespace(
    decodeEntities(
      String(html)
        .replace(/<span[^>]*class="[^"]*searchmatch[^"]*"[^>]*>/g, '**')
        .replace(/<\/span>/g, '**')
        .replace(/<[^>]*>/g, '')
        // 摘要里残留的 [[|]] / [[目标|显示名]] 空链接碎片（配方表等渲染产物）
        .replace(/\[\[([^[\]|]*)((?:\|[^[\]|]*)*)\]\]/g, (match: string, target: string, rest: string) => {
          void match;
          const segments = String(rest)
            .split('|')
            .filter((s) => s.trim().length > 0);
          const last = segments.length > 0 ? (segments[segments.length - 1] as string) : target;
          return last.trim();
        })
        .replace(/\*\*\s*\*\*/g, ' ')
        .replace(/\*\*([^*]+)\*\*/g, (_m: string, inner: string) => `**${inner.trim()}**`)
        .replace(/\s+([，。；：、）】」』！？])/g, '$1')
        .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, '$1$2'),
    ),
  );
}

/** MediaWiki 标题规范化：实体解码、下划线还原为空格、折叠空白。 */
export function cleanTitle(title: unknown): string {
  return collapseWhitespace(decodeEntities(String(title))).replace(/_/g, ' ');
}

// ── 模板解析 ────────────────────────────────────────────────────────────────

/** 模板名是否属于 *Link / *Sprite 系列（渲染为第一个位置参数）。 */
function isLinkSpriteTemplate(name: string): boolean {
  return /(Link|Sprite|Icon|Image)(\d)?$/.test(name);
}

/** 从模板体取命名参数（|key=value，value 可含换行，取到下一个 |key= 前）。 */
function namedArg(body: string, keyName: string): string | undefined {
  const pattern = new RegExp(
    `(?:^|\\n?\\|)\\s*${keyName}\\s*=([\\s\\S]*?)(?=\\n?\\|[a-zA-Z_][a-zA-Z0-9_]*\\s*=|$)`,
  );
  const match = pattern.exec(body);
  return match !== null ? (match[1] as string).trim() : undefined;
}

/** 内联位置参数提取：跳过 key=value 与空参，返回普通参数数组。 */
function splitTemplateArgs(body: string): string[] {
  const args: string[] = [];
  for (const raw of body.split('|')) {
    const part = raw.trim();
    if (part.length === 0) continue;
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(part)) continue; // 命名参数
    args.push(part.replace(/\{\{!\}\}/g, '|')); // {{!}} 管道转义
  }
  return args;
}

/** 版本代码 → 中文说明。 */
function versionLabel(code: unknown): string {
  const v = String(code ?? '').toLowerCase();
  if (v === 'je' || v === 'java') return 'Java版';
  if (v === 'be' || v === 'bedrock') return '基岩版';
  return '';
}

/** 解析单个模板体（不含外层 {{ }}）：返回渲染文本或 ''（丢弃）。 */
export function resolveTemplate(body: string): string {
  const bodyText = body.trim();
  if (bodyText.length === 0) return '';
  const barIndex = bodyText.indexOf('|');
  const name = (barIndex === -1 ? bodyText : bodyText.slice(0, barIndex)).trim().toLowerCase();

  // 魔术字 / 变量：__NOTOC__、{{PAGENAME}}、{{subst:…}}、{{:内嵌页面}}
  if (/^__[a-z_]+__$/.test(name)) return '';
  if (name.startsWith('subst:') || name.startsWith(':')) return '';

  const args = barIndex === -1 ? [] : splitTemplateArgs(bodyText.slice(barIndex + 1));

  // 字词转换 {{tr|简体|台湾|English}} → 简体
  if (name === 'tr') return args[0] ?? '';
  // 版本限定 {{only|je|for=…}} / {{in|be}} → 「基岩版」或「（基岩版：内容）」
  if (name === 'only' || name === 'in') {
    const labelled = versionLabel(args[0]);
    const forValue = namedArg(bodyText, 'for');
    if (forValue !== undefined && forValue.length > 0) return `（${labelled || '指定版本'}：${forValue}）`;
    return labelled;
  }
  // 版本标签 {{el|je}} / {{edition|java}}
  if (name === 'el' || name === 'edition') return versionLabel(args[0]);
  // 引言/名言 {{quote|…}}
  if (name === 'quote') return args[0] ?? '';
  // 经验 {{xp|5}}
  if (name === 'xp') return `${args[0] ?? '?'} 经验`;
  // 内联代码 {{cd|…}} / {{cmd|…}}
  if (name === 'cd' || name === 'cmd' || name === 'kbd' || name === 'samp')
    return args.length > 0 ? `\`${args[0]}\`` : '';
  // 生命/伤害/时长
  if (name === 'hp') return `${args[0] ?? '?'} HP`;
  if (name === 'autodmg') return `${args[0] ?? '?'} 伤害`;
  if (name === 'convert') return `${args[0] ?? '?'} 刻（ticks）`;

  // 掉落表 {{dropline|name=…|quantity=…|lootingquantity=…}}
  if (name === 'dropline') {
    const item = namedArg(bodyText, 'name') ?? args[0] ?? '';
    if (item.length === 0) return '';
    const quantity = namedArg(bodyText, 'quantity');
    const looting = namedArg(bodyText, 'lootingquantity');
    let rendered = item;
    if (quantity !== undefined && quantity.length > 0) {
      rendered += `（${quantity}${looting !== undefined && looting.length > 0 ? `，时运 ${looting}` : ''}）`;
    }
    return rendered;
  }
  // 掉落表 {{droptable|…}} → 保留 notes=（掉落条件说明）
  if (name === 'droptable') {
    const notes = namedArg(bodyText, 'notes');
    if (notes === undefined || notes.length === 0) return '';
    return notes
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `掉落条件：${line.replace(/^[a-zA-Z0-9_.]+\s*=\s*/, '')}`) // 去掉 code = 前缀
      .join('\n');
  }

  if (isLinkSpriteTemplate(name) && args.length > 0) return args[0] as string;
  return ''; // 其余模板一律丢弃（信息框/导航/历史/音效/成就/进度等噪声）
}

/** 把整段文本里的 {{…}} 模板逐层展开：先展开最内层，再处理外层（支持多行模板）。 */
export function expandTemplates(src: string): string {
  let text = String(src);
  let pass = 0;
  // 内层优先展开；正则允许模板体内出现单层 {…}（如 {powered:1} 这类 NBT 记法）
  while (pass < 10) {
    const next = text.replace(/\{\{((?:[^{}]|\{[^{}]*\})*)\}\}/g, (match: string, body: string) => {
      void match;
      return resolveTemplate(body);
    });
    if (next === text) break;
    text = next;
    pass += 1;
  }
  // 兜底：循环清理任何残留 {{…}}（可能因上一轮替换产生新的外层模板）
  let cleaned = text;
  for (let i = 0; i < 10; i += 1) {
    const next = cleaned.replace(/\{\{(?:[^{}]|\{[^{}]*\})*\}\}/g, '');
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned;
}

// ── 标签块 / 链接 / 引号 ────────────────────────────────────────────────────

const TAG_BLOCK =
  /<\/?(?:ref|gallery|syntaxhighlight|source|math|chem|score|timeline|poem|onlyinclude|noinclude|includeonly|indicator|templatestyles|imagemap|categorytree)(?:\s[^>]*)?>|<ref[^>]*\/>/gi;

/** 剥掉块级标签的整个内容（<ref>…</ref>、<gallery>…</gallery> 等），并清理内联标签。 */
function stripTagBlocks(src: string): string {
  return String(src)
    .replace(/<!--[\s\S]*?-->/g, '') // 注释
    .replace(TAG_BLOCK, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ''); // 其余内联标签（nowiki 等保留内容）
}

/** 语言互链前缀（[[en:Creeper]] 等跨语言版本链接，对 AI 是噪声）。 */
const INTERWIKI_LANG =
  /^(?:cs|de|en|es|fr|hu|it|ja|ko|lzh|nl|pl|pt|ru|th|tr|uk|zh|zh-hans|zh-hant|zh-cn|zh-tw|zh-hk)(?=:|-)/i;

/**
 * 内联 wikitext 链接处理（支持多管道参数，如 [[File:A.png|250px|说明]]）：
 * - [[目标|显示名|更多]] → 最后一个非空参段（显示名）
 * - [[目标]] → 目标（去命名空间前缀）
 * - [[File:…]] / [[Category:…]] / [[w:…]] / 跨语言链接 丢弃
 */
export function resolveInternalLinks(text: string): string {
  return String(text).replace(
    /\[\[([^[\]|]*)((?:\|[^[\]|]*)*)\]\]/g,
    (match: string, target: string, rest: string) => {
      void match;
      const t = target.trim();
      const segments = String(rest)
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const l = segments.length > 0 ? (segments[segments.length - 1] as string) : '';
      if (t.length === 0) return l;
      const lower = t.toLowerCase();
      // 命名空间 / 特殊链接
      if (/(^|:)file:|image:|category:|wikipedia:|wzh:|w:|mw:|wikt:|special:|help:|template:/.test(lower)) {
        return /^file:|^image:|^category:/.test(lower) ? '' : l || lastSegment(t);
      }
      if (INTERWIKI_LANG.test(t)) return ''; // 跨语言版本链接
      if (t.startsWith(':')) return l || lastSegment(t.slice(1));
      // 锚点 [[目标#章节]]
      const [page, section] = splitAnchor(t);
      return l || (section !== undefined ? `${page}#${section}` : page);
    },
  );
}

/** 取链接最后一段（含 # 章节部分）。 */
function lastSegment(target: string): string {
  const cleaned = target.startsWith(':') ? target.slice(1) : target;
  const parts = cleaned.split(/[#|]/);
  return parts[parts.length - 1] ?? cleaned;
}

function splitAnchor(target: string): [string, string | undefined] {
  const hash = target.indexOf('#');
  if (hash === -1) return [target, undefined];
  return [target.slice(0, hash), target.slice(hash + 1)];
}

/** 引号加粗/斜体：'''''x''''' → ***x***，'''x''' → **x**，''x'' → *x*。 */
export function convertQuotes(text: string): string {
  return String(text)
    .replace(/'''''([^'"]*?)'''''/g, '***$1***')
    .replace(/'''([^'"]*?)'''/g, '**$1**')
    .replace(/''([^'"]*?)''/g, '*$1*');
}

/** 外链 [https://… 文本] → 文本（保留文字，去 URL 噪声）；裸 URL 保留。 */
export function resolveExternalLinks(text: string): string {
  return String(text)
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, (match: string, _url: string, label: string) => {
      void match;
      void _url;
      return label.trim();
    })
    .replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1');
}

// ── 表格扁平化 ──────────────────────────────────────────────────────────────

/** 单个表格单元格渲染：模板展开 + 链接解析 + 引号 → Markdown。 */
function renderTableCell(cell: string): string {
  let value = expandTemplates(cell);
  value = resolveInternalLinks(value);
  value = resolveExternalLinks(value);
  value = convertQuotes(value);
  value = decodeEntities(value);
  value = collapseWhitespace(value);
  if (value.includes('{{') || value.includes('[[')) value = '…';
  return value.replace(/\n/g, '<br>');
}

/**
 * 表格扁平化：把 {| … |} 表格解析成 Markdown 表格。
 * 单元格内先做模板展开与链接解析；解析失败或超长则降级为摘要行。
 */
function flattenTable(tableSrc: string): string {
  const rows: string[][] = [];
  let cells: string[] = [];
  const flushRow = (): void => {
    if (cells.length > 0) {
      rows.push(cells);
      cells = [];
    }
  };
  for (const rawLine of tableSrc.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('|+') || line.startsWith('|}')) continue;
    if (line.startsWith('|-')) {
      flushRow();
      continue;
    }
    const isHeader = line.startsWith('!');
    if (!isHeader && !line.startsWith('|')) continue;
    const body = line.slice(1);
    const parts = body.split(/[|!]{2}/);
    for (const part of parts) cells.push(renderTableCell(part));
  }
  flushRow();
  if (rows.length === 0) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const lines: string[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] as string[];
    const padded: string[] = [];
    for (let c = 0; c < width; c += 1) padded.push(row[c] ?? '');
    if (padded.every((cell) => cell.trim() === '')) continue;
    lines.push(`| ${padded.join(' | ')} |`);
    if (i === 0) lines.push(`| ${Array(width).fill('---').join(' | ')} |`);
  }
  return lines.join('\n');
}

// ── wikitext → Markdown 主流程 ─────────────────────────────────────────────

export interface ConvertOpts {
  maxChars?: unknown;
}

export interface ConvertResult {
  markdown: string;
  truncated: boolean;
}

export interface PlainResult {
  text: string;
  truncated: boolean;
}

/** 行内普通文本的统一后处理：链接/引号/外链/实体。 */
function inlineCleanup(text: string): string {
  return resolveExternalLinks(resolveInternalLinks(convertQuotes(decodeEntities(text))));
}

/** 解析输出上限：0 / undefined / 负数 = 不截断；正数 = 上限字符数。 */
function resolveMaxChars(value: unknown): number {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || !Number.isFinite(n) || n <= 0) return Infinity;
  return Math.floor(n);
}

/**
 * wikitext → Markdown 主转换。默认不截断（maxChars=0/缺省 = 完整输出）。
 */
export function wikitextToMarkdown(wikitext: string, opts: ConvertOpts = {}): ConvertResult {
  const maxChars = resolveMaxChars(opts.maxChars);
  const pre = expandTemplates(stripTagBlocks(wikitext).replace(/-\{\}-\s*/g, ''));
  const lines = String(pre).split('\n');
  const out: string[] = [];
  let inTable = false;
  let tableBuf: string[] = [];
  let tableCount = 0;
  let tableTruncated = false;

  const emitTable = (): void => {
    const flat = flattenTable(tableBuf.join('\n'));
    if (flat.length > 0) out.push(flat);
    tableBuf = [];
    inTable = false;
  };

  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim();

    // 表格边界
    if (trimmed.startsWith('{|')) {
      if (inTable) emitTable();
      inTable = true;
      tableBuf = [];
      continue;
    }
    if (inTable) {
      if (trimmed.startsWith('|}')) {
        emitTable();
        continue;
      }
      tableBuf.push(line);
      tableCount += 1;
      if (tableCount > 2000) {
        tableTruncated = true;
        inTable = false;
        tableBuf = [];
      }
      continue;
    }

    // 魔术字行
    if (/^__(?:NOTOC|TOC|FORCETOC|NOEDITSECTION|NEWSECTIONLINK)__\s*$/.test(trimmed)) continue;

    // 标题：== x == → ## x（MediaWiki h2 起）
    const heading = /^(={2,6})\s*(.*?)\s*\1\s*$/.exec(trimmed);
    if (heading) {
      const level = Math.min((heading[1] as string).length, 6);
      out.push(`${'#'.repeat(level)} ${inlineCleanup(heading[2] as string).trim()}`);
      continue;
    }

    // 空行
    if (trimmed === '') {
      out.push('');
      continue;
    }

    // 列表 / 定义
    if (/^[*#:;]/.test(trimmed)) {
      out.push(
        inlineCleanup(trimmed).replace(
          /^([*#:;]+)\s?(.*)$/,
          (match: string, marker: string, rest: string) => {
            void match;
            const depth = marker.length;
            const indent = '  '.repeat(depth - 1);
            const kind = marker[0];
            if (kind === '*') return `${indent}- ${rest}`;
            if (kind === '#') return `${indent}1. ${rest}`;
            if (kind === ';') {
              const [term, ...defParts] = rest.split(':');
              const def = defParts.join(':').trim();
              return `**${(term ?? '').trim()}**${def.length > 0 ? `：${def}` : ''}`;
            }
            return `${indent}  ${rest}`;
          },
        ),
      );
      continue;
    }

    // 普通行（模板已在 pre 阶段展开，空串行跳过）
    const converted = inlineCleanup(trimmed);
    if (converted === '') continue;
    // 孤立版本标签行（对应已被丢弃的音效/数据表，无信息量）
    if (/^(Java版|基岩版)[:：]?$/.test(converted)) continue;
    out.push(converted);
  }
  if (inTable) emitTable();

  let markdown = normalizeWhitespace(out.join('\n'));
  let truncated = tableTruncated;
  if (Number.isFinite(maxChars) && markdown.length > maxChars) {
    markdown = `${markdown.slice(0, maxChars).trimEnd()}\n\n…（内容超过 ${maxChars} 字符上限已截断，可传 maxChars=0 关闭截断）`;
    truncated = true;
  }
  return { markdown, truncated };
}

/** Markdown → 纯文本：去掉 Markdown 记号，保留布局（换行/段落）。默认不截断。 */
export function markdownToPlainText(markdown: string, opts: ConvertOpts = {}): PlainResult {
  const maxChars = resolveMaxChars(opts.maxChars);
  let text = String(markdown);
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1'); // 图片
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // 链接
  text = text.replace(/^#{1,6}\s+/gm, '').replace(/^\s*>\s?/gm, '');
  text = text.replace(/[*_`~]/g, '');
  text = text.replace(/^\s*[-+]\s+/gm, '• ');
  text = text.replace(/\|/g, ' ').replace(/\s+/g, ' ');
  let truncated = false;
  if (Number.isFinite(maxChars) && text.length > maxChars) {
    text = `${text.slice(0, maxChars).trimEnd()} …（已截断）`;
    truncated = true;
  }
  return { text: text.trim(), truncated };
}

// ── 顶层便捷入口 ────────────────────────────────────────────────────────────

/** 把 MediaWiki extracts 的纯文本 intro 收尾清洗。默认不截断；传 maxChars 才设上限。 */
export function cleanExtractText(extract: unknown, opts: ConvertOpts = {}): PlainResult {
  const maxChars = resolveMaxChars(opts.maxChars);
  const text0 = collapseWhitespace(decodeEntities(String(extract ?? '')));
  let text = String(text0).replace(/\[\d+\]/g, ''); // 残留 [1] 式引用脚标
  let truncated = false;
  if (Number.isFinite(maxChars) && text.length > maxChars) {
    text = `${text.slice(0, maxChars).trimEnd()} …（已截断）`;
    truncated = true;
  }
  return { text, truncated };
}
