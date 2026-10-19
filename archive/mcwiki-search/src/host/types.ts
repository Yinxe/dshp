/**
 * @dshp/mcwiki-search —— 共享类型定义
 *
 * DSH 运行时（Cordis ctx / tools / llm / settings / webServer）暂无官方 npm 类型包，
 * Host 侧统一用 `AnyCtx`（= any 的别名）透传，仅对本插件自有的数据结构做严格建模。
 *
 * 原实现：~/.dsh/plugins/dsh-mcwiki-search（JS，@dshp-inx/mcwiki-search v1.0.1）
 * 本文件为 TS 重写新增：把原来散落在 lib/index.js / lib/api.js 里的隐式结构显式化。
 */
import type { Volatile } from '@deepseek-ai/cosmokit';

export interface PluginConfig {
  timeoutMs: number;
  /** 全文输出上限：0 = 不截断（默认，完整输出） */
  maxChars: number;
  /** 引言上限：0 = 不截断（默认） */
  introMaxChars: number;
  /** 搜索默认条数上限 */
  searchMaxResults: number;
}

/** `apply(ctx, config)` 实参：ConfigSchema 全字段 volatile，`.get()` 读当前深只读快照 */
export interface VolatileConfig {
  timeoutMs: Volatile<number>;
  maxChars: Volatile<number>;
  introMaxChars: Volatile<number>;
  searchMaxResults: Volatile<number>;
}

// ── MediaWiki API 层（api.ts）────────────────────────────────────────────

export interface SearchItem {
  title: string;
  pageid: number;
  url: string;
  snippet: string;
  updated: string;
}

export interface SearchWikiResult {
  success: true;
  query: string;
  totalHits: number;
  truncated: boolean;
  results: SearchItem[];
}

export interface PageIntroResult {
  success: true;
  title: string;
  pageid: number;
  url: string;
  /** intro = 引言段（exintro）；page = 整页纯文本（wholePage，api 层选项，模型工具不用） */
  section: 'intro' | 'page';
  format: 'text';
  text: string;
  truncated: boolean;
  updated?: string;
}

export interface PageWikitextResult {
  success: true;
  title: string;
  pageid: number;
  url: string;
  wikitext: string;
  updated: string;
}

export interface RandomItem {
  title: string;
  pageid?: number;
  url: string;
  text: string;
}

export interface RandomPagesResult {
  success: true;
  results: RandomItem[];
}

// ── 模型工具输出（tools.ts，与 output.schema 对齐）───────────────────────

export interface SearchToolValue extends SearchWikiResult {}

export interface GetPageToolValue {
  success: true;
  title: string;
  pageid: number;
  url: string;
  section: 'intro' | 'full';
  format: 'text' | 'markdown' | 'wikitext';
  text: string;
  updated?: string;
  truncated: boolean;
}

export interface RandomToolValue extends RandomPagesResult {}

// ── 同源路由协议（routes.ts ↔ client/api.ts 对齐）────────────────────────

export interface StateResponse {
  ok: boolean;
  timeoutMs?: number;
  maxChars?: number;
  introMaxChars?: number;
  searchMaxResults?: number;
  config?: PluginConfig;
  tools?: string[];
  error?: string;
}

export interface ConfigSaveResponse {
  ok: boolean;
  config?: PluginConfig;
  error?: string;
}

export interface TestPagePreview {
  title: string;
  section: 'intro' | 'full';
  format: 'text' | 'markdown';
  text: string;
  url: string;
}

export interface TestResponse {
  ok: boolean;
  query?: string;
  totalHits?: number;
  results?: SearchItem[];
  page?: TestPagePreview | null;
  takenMs?: number;
  error?: string;
}

/** DSH 运行时 ctx —— 暂无官方类型，透传 any */
export type AnyCtx = any;
export type AnySettings = any;
