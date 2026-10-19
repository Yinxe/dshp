/**
 * 文件路径 → 语法高亮语言 id
 *
 * ## 这份表从哪来
 *
 * DSH 的语法高亮是 shiki（css-variables 主题，配色走 `--shiki-token-*`，随深浅主题切换）。
 * 它只打包了 26 个语言的语法，并且用一张别名表把「用户输入」归一到「真正的语法 id」——
 * 例如 `ts / tsx / js / jsx / javascript` 全部归一到 `typescript`，`sh / bash / zsh` 归一到
 * `shellscript`，`yml → yaml`。本文件**逐条镜像那张表**（来源：前端 shiki 集成的别名映射，
 * 见 `docs` 无——它是运行时内部表；改动需跟着 DSH 升级同步，所以我们只列官方确实打包了
 * 语法的 id，不做任何猜测）。
 *
 * ## 两条重要行为
 *
 * 1. 传了不认识的语言**不会报错**：`CodeBlock` 内部先查别名表，查不到就直接渲染成无高亮的
 *    纯文本块。所以本模块对不支持的扩展名返回 `null`（而不是硬塞一个近似的语言），宁可
 *    不高亮，也不要给用户看错误的着色。
 * 2. 语言在**配对**上不共享：`jsonc` 归一到 `json`、`mdx` 自成一体；`.vue` / `.svelte` /
 *    `.diff` / `.txt` 都没有语法，返回 `null`。
 *
 * @module @dshp/file-change-viewer/client/lang
 */

/**
 * 扩展名 → 官方语法 id。
 *
 * 值的集合**必须**是官方打包了语法的 id（`c cpp csharp css go html ini java json kotlin
 * less lua markdown mdx php python ruby rust scss shellscript sql swift toml typescript xml
 * yaml`）；右列之外的值只会退化成纯文本，不会高亮。
 */
const LANG_BY_EXTENSION: Record<string, string> = {
  // C / C++
  c: 'c',
  h: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hh: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',
  // 其它语言
  cs: 'csharp',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  lua: 'lua',
  php: 'php',
  py: 'python',
  pyi: 'python',
  rb: 'ruby',
  rs: 'rust',
  swift: 'swift',
  // JS 家族：官方只有 typescript 语法，js / jsx / mjs / cjs 一律归到它
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'typescript',
  jsx: 'typescript',
  mjs: 'typescript',
  cjs: 'typescript',
  // 数据与配置
  json: 'json',
  jsonc: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  properties: 'ini',
  // 标记与文档
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'mdx',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  xsl: 'xml',
  xslt: 'xml',
  svg: 'xml',
  plist: 'xml',
  // 样式
  css: 'css',
  scss: 'scss',
  less: 'less',
  // 脚本
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  ksh: 'shellscript',
  sql: 'sql',
};

/**
 * 取一个文件路径对应的语法 id。
 *
 * 只看**basename 的最后一个点之后**的扩展名（所以 `.gitignore` / `Makefile` 这类没有扩展名
 * 的名字返回 null，`package-lock.json` 正常命中 json）；大小写不敏感。
 *
 * @param path - 工具参数里的原始路径（相对或绝对都行）。
 * @returns 官方语法 id；扩展名缺失或官方没有该语法时 null（调用方应让 CodeBlock 退化成纯文本）。
 */
export function languageOf(path: string): string | null {
  if (typeof path !== 'string' || path === '') return null;
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  const base = path.slice(slash + 1);
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return null;
  const extension = base.slice(dot + 1).toLowerCase();
  return LANG_BY_EXTENSION[extension] ?? null;
}
