/**
 * cordis.patch.yml 的解析与回写（yaml 库 CST 模式）
 *
 * 设计要点：
 *  - parseDocument + String(doc) 走 CST：未被触碰的节点（含注释、空行、
 *    `!!js` 表达式、引号风格）原样保留——这是「管理 MCP 条目但不动用户
 *    手写内容」的关键
 *  - `!!js` 标签注册为透传 resolve（值 = 源码字符串），解析不炸；我们不
 *    求值这些表达式（求值是 DSH loader 的事），只在回写时保真或按 `js: `
 *    前缀重建
 *  - 条目 = 树中任意序列里 name 为 @deepseek-ai/dsh-mcp-client 的映射
 *    （顶层声明、`- insert:` 列表、group config 列表都能找到）
 *  - 更新是「原位合并」：已知键以载荷为准（未提供即删除），未知键载荷未
 *    提及则从原文保留（防第三方调用方误删手写的复杂值）
 *  - 所有数组改动用「重建后赋值」，与仓内 oxlint no-array-mutation 约定一致
 *
 * @module @dshp/mcp-manager
 */
import { isMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { LIMITS, KNOWN_CONFIG_KEYS, MCP_CLIENT_NAME } from './config.js';
import type { EnvValueView, JsMarkPaths, McpServerView, NormalizedServerConfig } from './types.js';

// ── yaml 标签：透传 !!js 家族（js-yaml 风格），值一律取源码字符串 ─────────

const JS_TAG_DEFS: unknown[] = [
  '!!js',
  '!!js/undefined',
  '!!js/regexp',
  '!!js/function',
  '!!js/map',
  '!!js/set',
].map((tag) => ({
  tag,
  resolve: (value: unknown): unknown => (typeof value === 'string' ? value : (value ?? '')),
}));

const PARSE_OPTIONS = { customTags: JS_TAG_DEFS as never } as const;

const JS_TAG_URIS = new Set([
  'tag:yaml.org,2002:js',
  'tag:yaml.org,2002:js/undefined',
  'tag:yaml.org,2002:js/regexp',
]);

/** 节点是否带 `!!js` 家族标签 */
function isJsTagged(node: unknown): boolean {
  const tag = (node as { tag?: string })?.tag;
  if (typeof tag !== 'string') return false;
  return JS_TAG_URIS.has(tag) || tag.startsWith('tag:yaml.org,2002:js/');
}

export interface FoundEntry {
  /** 所在序列（顶层 patch 数组或 insert 列表） */
  seq: YAMLSeq;
  /** 条目在 seq.items 里的下标（每次请求都重新解析，下标恒新鲜） */
  index: number;
  /** 所在序列自身的容器（顶层序列回 null；用于移除清空的 insert 外壳） */
  parentSeq: YAMLSeq | null;
  /** 所在序列在其容器里的下标（parentSeq 为 null 时无意义） */
  parentIndex: number;
  /** 条目映射（含 id/name/config/disabled） */
  entryMap: YAMLMap;
  /** config 映射（缺失回 null） */
  configNode: YAMLMap | null;
  id: string;
  /** 条目起始行 offset（-1 = 未知；展示时经 lineOfOffset 转行号） */
  line: number;
}

// ── 解析与查找 ──────────────────────────────────────────────────────────

export function parsePatchDoc(text: string): Document {
  return parseDocument(text, PARSE_OPTIONS);
}

/** 序列项 → 条目映射（块映射或单对映射两种形态都兜住） */
function asMapItem(item: unknown): YAMLMap | null {
  if (isMap(item)) return item;
  return null;
}

function scalarString(node: unknown): string {
  if (isScalar(node)) {
    const v = (node as Scalar).value;
    return v === null || v === undefined ? '' : String(v);
  }
  return '';
}

function pairOf(map: YAMLMap | null | undefined, key: string): Pair | undefined {
  // yaml v2 里 pair.key 是 Scalar 节点，不是字符串——必须先取值再比较
  return map?.items.find((p) => scalarString((p as Pair).key) === key);
}

/** 文档里全部 MCP 客户端条目（按文件顺序；记录序列容器供删除外壳用） */
export function findEntries(doc: Document): FoundEntry[] {
  const out: FoundEntry[] = [];
  const walkSeq = (seq: YAMLSeq, parentSeq: YAMLSeq | null, parentIndex: number): void => {
    seq.items.forEach((item, index) => {
      const m = asMapItem(item);
      if (m) {
        const namePair = pairOf(m, 'name');
        const idPair = pairOf(m, 'id');
        if (namePair && scalarString(namePair.value) === MCP_CLIENT_NAME && idPair) {
          const cfgPair = pairOf(m, 'config');
          out.push({
            seq,
            index,
            parentSeq,
            parentIndex,
            entryMap: m,
            configNode: isMap(cfgPair?.value) ? (cfgPair.value as YAMLMap) : null,
            id: scalarString(idPair.value).slice(0, LIMITS.id),
            line: lineOfRange(m),
          });
        }
      }
      if (isSeq(item)) walkSeq(item, seq, index);
      else if (isMap(item)) walkMap(item, seq, index);
    });
  };
  const walkMap = (map: YAMLMap, parentSeq: YAMLSeq | null, parentIndex: number): void => {
    for (const p of map.items) {
      if (isSeq(p.value)) walkSeq(p.value, parentSeq, parentIndex);
      else if (isMap(p.value)) walkMap(p.value, parentSeq, parentIndex);
    }
  };
  if (isSeq(doc.contents)) walkSeq(doc.contents, null, -1);
  else if (isMap(doc.contents)) walkMap(doc.contents, null, -1);
  return out;
}

function lineOfRange(node: { range?: number[] | null }): number {
  // 行号在 index.ts 里借助全文计算；此处仅存起点 offset（转成 -1 表示未知）
  const r = node.range;
  return Array.isArray(r) && typeof r[0] === 'number' ? r[0] : -1;
}

/** offset → 1 起行号（用于展示） */
export function lineOfOffset(text: string, offset: number): number | null {
  if (offset < 0) return null;
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

/** 按 id 查条目；重复 id 抛错（让用户手工去重，避免改错行） */
export function findEntry(doc: Document, id: string): FoundEntry {
  const hits = findEntries(doc).filter((e) => e.id === id);
  if (hits.length === 0)
    throw new Error('patch 文件里找不到该 MCP 条目（id: ' + id + '），文件可能刚被外部修改，请刷新');
  if (hits.length > 1)
    throw new Error('patch 文件里有 ' + hits.length + ' 个同 id 条目（' + id + '），请先手工去重再操作');
  const first = hits[0];
  if (!first) throw new Error('patch 文件里找不到该 MCP 条目（id: ' + id + '）');
  return first;
}

// ── 视图提取（state 路由用） ─────────────────────────────────────────────

/** config 节点 → JSON 化视图（尽力转换；不可表示的值返回 undefined） */
function nodeToJson(node: unknown, depth = 0): unknown {
  if (depth > LIMITS.jsonDepth) return undefined;
  if (isScalar(node)) {
    const v = (node as Scalar).value;
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
    return String(v);
  }
  if (isSeq(node)) {
    const arr: unknown[] = [];
    for (const item of (node as YAMLSeq).items) {
      const v = nodeToJson(item, depth + 1);
      if (v === undefined) return undefined;
      arr.push(v);
    }
    return arr;
  }
  if (isMap(node)) {
    const obj: Record<string, unknown> = {};
    for (const p of (node as YAMLMap).items) {
      const key = scalarString(p.key);
      if (!key) return undefined;
      const v = nodeToJson(p.value, depth + 1);
      if (v === undefined) return undefined;
      obj[key.slice(0, LIMITS.envKey)] = v;
    }
    return obj;
  }
  return undefined;
}

function scalarToEnvView(node: unknown): EnvValueView | null {
  if (!isScalar(node)) return null;
  const raw = (node as Scalar).value;
  const source = raw === null || raw === undefined ? '' : String(raw);
  return { js: isJsTagged(node), source: source.slice(0, LIMITS.envValue) };
}

/** env/headers 映射节点 → 视图；形状不符返回 null（调用方记 issue + unmanageable） */
function stringMapView(node: unknown): Record<string, EnvValueView> | null {
  if (node === null || node === undefined) return {};
  if (!isMap(node)) return null;
  const out: Record<string, EnvValueView> = {};
  for (const p of (node as YAMLMap).items) {
    const key = scalarString(p.key).slice(0, LIMITS.envKey);
    if (!key) return null;
    const v = scalarToEnvView(p.value);
    if (!v) return null;
    out[key] = v;
  }
  return out;
}

function firstIssuePush(issues: string[], text: string): void {
  if (issues.length < 8) issues.push(text.slice(0, LIMITS.issue));
}

/** 条目 → 下发视图（view 层的消毒：全部字段截断，绝不下发原文以外的对象） */
export function entryToView(entry: FoundEntry, text: string): McpServerView {
  const issues: string[] = [];
  let unmanageable = false;

  const disabledPair = pairOf(entry.entryMap, 'disabled');
  let disabled = false;
  let disabledIsJs = false;
  if (disabledPair) {
    disabledIsJs = isJsTagged(disabledPair.value);
    const v = (disabledPair.value as Scalar | undefined)?.value;
    disabled = disabledIsJs ? Boolean(v) : v === true;
  }

  const serverName = scalarString(pairOf(entry.configNode, 'serverName')?.value).slice(0, LIMITS.serverName);
  const transportRaw = scalarString(pairOf(entry.configNode, 'transport')?.value);
  const transport = transportRaw === 'stdio' || transportRaw === 'streamable-http' ? transportRaw : '';
  if (!serverName || !/^[A-Za-z0-9_-]{1,32}$/.test(serverName)) {
    firstIssuePush(issues, 'serverName 缺失或非法（官方约束：1-32 位字母/数字/下划线/连字符）');
  }
  if (!transport) firstIssuePush(issues, "transport 非法（应为 'stdio' 或 'streamable-http'）");

  let command = '';
  let args: string[] = [];
  let env: Record<string, EnvValueView> = {};
  let cwd = '';
  let url = '';
  let headers: Record<string, EnvValueView> = {};

  if (transport === 'stdio') {
    command = scalarString(pairOf(entry.configNode, 'command')?.value).slice(0, LIMITS.command);
    if (!command) firstIssuePush(issues, 'stdio 传输缺少 command');
    const argsNode = pairOf(entry.configNode, 'args')?.value;
    if (argsNode === null || argsNode === undefined) {
      args = [];
    } else if (isSeq(argsNode)) {
      args = (argsNode as YAMLSeq).items
        .map((a) => scalarString(a).slice(0, LIMITS.arg))
        .slice(0, LIMITS.argsCount);
    } else {
      firstIssuePush(issues, 'args 形状非法（应为字符串数组），该条目不可在 UI 编辑');
      unmanageable = true;
    }
    const envView = stringMapView(pairOf(entry.configNode, 'env')?.value ?? null);
    if (envView) env = envView;
    else {
      firstIssuePush(issues, 'env 形状非法（应为字符串映射），该条目不可在 UI 编辑');
      unmanageable = true;
    }
    cwd = scalarString(pairOf(entry.configNode, 'cwd')?.value).slice(0, LIMITS.cwd);
  } else if (transport === 'streamable-http') {
    url = scalarString(pairOf(entry.configNode, 'url')?.value).slice(0, LIMITS.url);
    if (!url) firstIssuePush(issues, 'streamable-http 传输缺少 url');
    const headersView = stringMapView(pairOf(entry.configNode, 'headers')?.value ?? null);
    if (headersView) headers = headersView;
    else {
      firstIssuePush(issues, 'headers 形状非法（应为字符串映射），该条目不可在 UI 编辑');
      unmanageable = true;
    }
  }

  let toolCallTimeoutMs: number | null = null;
  const timeoutNode = pairOf(entry.configNode, 'toolCallTimeoutMs')?.value;
  if (timeoutNode !== null && timeoutNode !== undefined) {
    const n = Number((timeoutNode as Scalar).value);
    toolCallTimeoutMs = Number.isFinite(n) ? n : null;
    if (toolCallTimeoutMs === null) {
      firstIssuePush(issues, 'toolCallTimeoutMs 不是数字，保存时会被丢弃');
    }
  }
  let failOnStartupError: boolean | null = null;
  const failNode = pairOf(entry.configNode, 'failOnStartupError')?.value;
  if (failNode !== null && failNode !== undefined) {
    const v = (failNode as Scalar).value;
    failOnStartupError = v === true;
  }

  let reconnect: unknown = null;
  const reconnectNode = pairOf(entry.configNode, 'reconnect')?.value;
  if (reconnectNode !== null && reconnectNode !== undefined) {
    const json = nodeToJson(reconnectNode);
    if (json === undefined || typeof json !== 'object' || Array.isArray(json)) {
      firstIssuePush(issues, 'reconnect 形状复杂，保存时将从原文保留（UI 不改写）');
      reconnect = null;
    } else {
      reconnect = json;
    }
  }

  const extras: Record<string, unknown> = {};
  for (const p of entry.configNode?.items ?? []) {
    const key = scalarString(p.key);
    if (!key || KNOWN_CONFIG_KEYS.has(key)) continue;
    const json = nodeToJson(p.value);
    if (json === undefined) {
      firstIssuePush(
        issues,
        'config 含不可 JSON 化的自定义键「' + key.slice(0, 40) + '」，保存时将从原文保留',
      );
      continue;
    }
    extras[key.slice(0, LIMITS.envKey)] = json;
  }

  return {
    id: entry.id,
    dup: false,
    serverName,
    transport,
    disabled,
    disabledIsJs,
    command,
    args,
    env,
    cwd,
    url,
    headers,
    toolCallTimeoutMs,
    failOnStartupError,
    reconnect,
    extras,
    unmanageable,
    toolCount: null,
    issues,
    line: lineOfOffset(text, entry.line),
  };
}

// ── 节点构建与合并 ──────────────────────────────────────────────────────

/** 给新建节点里 jsMarks 命中的字符串值打 !!js 标签（手写递归：键名永不打标） */
function tagJsNodes(node: unknown, prefix: string, jsMarks: JsMarkPaths): void {
  if (isMap(node)) {
    for (const p of (node as YAMLMap).items) {
      const k = scalarString(p.key);
      tagJsNodes(p.value, k ? (prefix ? prefix + '.' + k : k) : prefix, jsMarks);
    }
  } else if (isSeq(node)) {
    for (const item of (node as YAMLSeq).items) tagJsNodes(item, prefix + '.*', jsMarks);
  } else if (isScalar(node)) {
    if (prefix && jsMarks.has(prefix)) (node as Scalar).tag = '!!js';
  }
}

/** 规整 config → 新节点（键序：serverName, transport, 传输字段, 通用可选, extras） */
export function buildConfigNode(
  doc: Document,
  config: NormalizedServerConfig,
  jsMarks: JsMarkPaths,
): YAMLMap {
  const plain: Record<string, unknown> = {};
  plain['serverName'] = config.serverName;
  plain['transport'] = config.transport;
  if (config.transport === 'stdio') {
    plain['command'] = config.command;
    if (config.args.length > 0) plain['args'] = config.args;
    if (Object.keys(config.env).length > 0) plain['env'] = config.env;
    if (config.cwd) plain['cwd'] = config.cwd;
  } else {
    plain['url'] = config.url;
    if (Object.keys(config.headers).length > 0) plain['headers'] = config.headers;
  }
  if (config.toolCallTimeoutMs !== null) plain['toolCallTimeoutMs'] = config.toolCallTimeoutMs;
  if (config.failOnStartupError !== null) plain['failOnStartupError'] = config.failOnStartupError;
  if (config.reconnect !== null) plain['reconnect'] = config.reconnect;
  for (const [k, v] of Object.entries(config.extras)) plain[k] = v;

  const node = doc.createNode(plain) as YAMLMap;
  tagJsNodes(node, '', jsMarks);
  return node;
}

function keyString(pair: Pair): string | null {
  const k = pair.key;
  if (isScalar(k)) {
    const v = k.value;
    return v === null || v === undefined ? null : String(v);
  }
  return null;
}

/**
 * 原位合并 config：
 *  - 已知键：载荷提供 → 换新值；未提供 → 删除（客户端权威）
 *  - 未知键：载荷提供 → 换新值；未提供 → 原样保留（防误删手写复杂值）
 * 新键按规整顺序追加在尾部。
 */
export function applyServerConfig(
  doc: Document,
  entry: FoundEntry,
  config: NormalizedServerConfig,
  jsMarks: JsMarkPaths,
  providedKeys: Set<string>,
): void {
  const fresh = buildConfigNode(doc, config, jsMarks);
  if (!entry.configNode) {
    entry.configNode = fresh;
    const existing = pairOf(entry.entryMap, 'config');
    if (existing) existing.value = fresh;
    else entry.entryMap.items = [...entry.entryMap.items, doc.createPair('config', fresh)];
    return;
  }
  const orig = entry.configNode;
  const freshByKey = new Map<string, Pair>();
  for (const p of fresh.items) {
    const k = keyString(p);
    if (k !== null) freshByKey.set(k, p);
  }
  const kept: unknown[] = [];
  const seen = new Set<string>();
  for (const p of orig.items) {
    const k = keyString(p);
    if (k === null) {
      kept.push(p);
      continue;
    }
    seen.add(k);
    const provided = providedKeys.has(k);
    const known = KNOWN_CONFIG_KEYS.has(k);
    if (known && !provided) continue; // 已知键未提供 → 删
    if (provided) {
      const fp = freshByKey.get(k);
      if (fp) {
        (p as Pair).value = fp.value; // 原位换值，保留键的 CST（位置/注释风格）
        kept.push(p);
      }
      // fp 不存在：载荷提供了该已知键但被规整掉（如 http 传输下的 command）→ 删
      if (!fp && !known) {
        // 载荷提供了未知键但值不可规整（collectExtras 已滤）→ 极少见，删
        continue;
      }
    } else {
      kept.push(p); // 未知键未提供 → 原样保留
    }
  }
  for (const [k, fp] of freshByKey) {
    if (!seen.has(k)) kept.push(fp);
  }
  orig.items = kept as typeof orig.items;
}

/** 条目级 disabled：true 写普通布尔（覆盖 !!js 表达式），false 删除该键 */
export function setEntryDisabled(doc: Document, entry: FoundEntry, disabled: boolean): void {
  const pair = pairOf(entry.entryMap, 'disabled');
  if (disabled) {
    if (pair) pair.value = doc.createNode(true);
    else entry.entryMap.items = [...entry.entryMap.items, doc.createPair('disabled', true)];
  } else if (pair) {
    entry.entryMap.items = entry.entryMap.items.filter((p) => p !== pair);
  }
}

/** 删除条目；所在序列清空后连带移除「- insert: []」外壳（外壳上的注释转移给下一个条目） */
export function removeEntry(entry: FoundEntry): void {
  const parent = entry.parentSeq;
  const wrapper = parent && entry.parentIndex >= 0 ? (parent.items[entry.parentIndex] as unknown) : undefined;
  entry.seq.items = entry.seq.items.filter((_, i) => i !== entry.index);
  if (entry.seq.items.length === 0 && parent && wrapper) {
    parent.items = parent.items.filter((_, i) => i !== entry.parentIndex);
    const comment = (wrapper as { commentBefore?: string | null }).commentBefore;
    if (comment) {
      const next = parent.items[entry.parentIndex] as { commentBefore?: string | null } | undefined;
      if (next) next.commentBefore = comment + (next.commentBefore ? '\n' + next.commentBefore : '');
    }
  }
}

/** 新条目挂载点：已有 insert 列表含 MCP 条目 → 追加进去；否则顶层新建 insert 外壳 */
export function insertServer(
  doc: Document,
  id: string,
  config: NormalizedServerConfig,
  jsMarks: JsMarkPaths,
): void {
  const existing = findEntries(doc);
  if (existing.some((e) => e.id === id)) {
    throw new Error('已存在同 id 条目（' + id + '），请换一个 serverName 或先删除旧条目');
  }
  const cfgNode = buildConfigNode(doc, config, jsMarks);
  const entryNode = doc.createNode({ id, name: MCP_CLIENT_NAME }) as YAMLMap;
  entryNode.items = [...entryNode.items, doc.createPair('config', cfgNode)];

  const mcpInsertSeq = findMcpInsertSeq(doc);
  if (mcpInsertSeq) {
    mcpInsertSeq.items = [...mcpInsertSeq.items, entryNode];
    return;
  }
  const insertSeq = doc.createNode([]) as YAMLSeq;
  insertSeq.items = [entryNode];
  const wrapper = doc.createNode({}) as YAMLMap;
  wrapper.items = [doc.createPair('insert', insertSeq)];
  if (isSeq(doc.contents)) {
    const top = doc.contents as YAMLSeq;
    top.items = [...top.items, wrapper];
    return;
  }
  // 空文档 / 非序列根：整体建一个顶层序列
  const rootSeq = doc.createNode([]) as YAMLSeq;
  rootSeq.items = [wrapper];
  doc.contents = rootSeq;
}

/** 找到第一条「包含 MCP 条目的 insert 列表」（新条目与既有条目同组） */
function findMcpInsertSeq(doc: Document): YAMLSeq | null {
  const found = findEntries(doc);
  const first = found[0];
  return first ? first.seq : null;
}

/** 序列化 + 回读自校验：必须可解析且条目数一致，否则拒绝落盘 */
export function serializeDoc(doc: Document, expectedCount: number): string {
  const text = String(doc);
  const reparsed = parsePatchDoc(text);
  const count = findEntries(reparsed).length;
  if (reparsed.errors.length > 0) {
    throw new Error(
      '回写自校验失败：序列化结果无法重新解析（' +
        String(reparsed.errors[0]).slice(0, 200) +
        '），原文件未改动',
    );
  }
  if (count !== expectedCount) {
    throw new Error(
      '回写自校验失败：条目数量发生变化（' + expectedCount + ' → ' + count + '），原文件未改动',
    );
  }
  return text;
}
