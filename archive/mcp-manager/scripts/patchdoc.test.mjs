/**
 * patchdoc 端到端测试：从打包产物 lib/host.js 导入 __test，
 * 对模拟的真实 cordis.patch.yml（注释 + !!js 表达式 + 多条目）做
 * 解析 / 新建 / 编辑 / 启停 / 删除 的往返验证。
 *
 * 断言全部手工实现（零依赖）；任何一步失败即非零退出。
 */
import { strictEqual, ok, throws } from 'node:assert';
import { __test } from '../lib/host.js';

const {
  parsePatchDoc,
  findEntries,
  entryToView,
  insertServer,
  applyServerConfig,
  setEntryDisabled,
  removeEntry,
  serializeDoc,
} = __test;

const SAMPLE = `# Your patch layer for this dsh profile, applied after every bundle layer:
# a top-level YAML array of loader patch entries.

- id: webserver
  config:
    host: '0.0.0.0'
    port: 3080

# 显式选中 Tavily 作为 web 搜索提供方。
- id: web
  config:
    searchProvider: tavily

# ── MCP 服务器（官方 @deepseek-ai/dsh-mcp-client，每个 server 一个实例）──
# 手写注释必须原样保留。
- insert:
    - id: mcp-github
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: github
        transport: stdio
        command: npx
        args: ['-y', '@modelcontextprotocol/server-github']
        env:
          GITHUB_TOKEN: !!js process.env.GITHUB_TOKEN
        cwd: /tmp/work

- insert:
    - id: mcp-web
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: web
        transport: streamable-http
        url: http://localhost:3000/mcp
        headers:
          Authorization: !!js \\\`Bearer \\\${process.env.MCP_TOKEN}\\\`
`;

// ── 1. 解析与视图 ────────────────────────────────────────────────────────

const doc0 = parsePatchDoc(SAMPLE);
strictEqual(doc0.errors.length, 0, '样例应可无错解析');
const entries0 = findEntries(doc0);
strictEqual(entries0.length, 2, '应找到 2 个 MCP 条目');
strictEqual(entries0[0].id, 'mcp-github');
strictEqual(entries0[1].id, 'mcp-web');

const vGithub = entryToView(entries0[0], SAMPLE);
strictEqual(vGithub.serverName, 'github');
strictEqual(vGithub.transport, 'stdio');
strictEqual(vGithub.disabled, false);
deepEqual(vGithub.args, ['-y', '@modelcontextprotocol/server-github'], 'args 应一致');
strictEqual(vGithub.env['GITHUB_TOKEN']?.js, true, 'GITHUB_TOKEN 应识别为 !!js');
strictEqual(vGithub.env['GITHUB_TOKEN']?.source, 'process.env.GITHUB_TOKEN');
strictEqual(vGithub.cwd, '/tmp/work');
ok(vGithub.line !== null && vGithub.line >= 17, 'github 条目行号应 >= 17，实际 ' + vGithub.line);
strictEqual(vGithub.issues.length, 0, 'github 条目不应有问题');

const vWeb = entryToView(entries0[1], SAMPLE);
strictEqual(vWeb.transport, 'streamable-http');
strictEqual(vWeb.url, 'http://localhost:3000/mcp');
strictEqual(vWeb.headers['Authorization']?.js, true);
ok(vWeb.headers['Authorization']?.source.includes('process.env.MCP_TOKEN'));

/** 简易 deepEqual（JSON 值比较） */
function deepEqual(a, b, msg) {
  strictEqual(JSON.stringify(a), JSON.stringify(b), msg);
}

/** 判断原文里未被触碰的区段是否逐字保留 */
function assertUntouched(before, after, anchorStart, anchorEnd, label) {
  const seg = before.slice(anchorStart, anchorEnd);
  ok(after.includes(seg), label + '：原文件注释区段应逐字保留');
}

// ── 2. 新建（insert） ────────────────────────────────────────────────────

const doc1 = parsePatchDoc(SAMPLE);
insertServer(
  doc1,
  'mcp-memory',
  {
    serverName: 'memory',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: { MEMORY_FILE_PATH: '/tmp/m.json' },
    cwd: '',
    url: '',
    headers: {},
    toolCallTimeoutMs: 30000,
    failOnStartupError: null,
    reconnect: null,
    extras: {},
  },
  new Set(),
);
const out1 = serializeDoc(doc1, 3);
const doc1b = parsePatchDoc(out1);
strictEqual(findEntries(doc1b).length, 3, '新建后应有 3 个条目');
// 新条目落进第一个含 MCP 条目的 insert 分组（与既有条目同组），所以按 id 查找
const memEntry = findEntries(doc1b).find((e) => e.id === 'mcp-memory');
ok(memEntry, '应能按 id 找到新条目');

// 新建时带 js 标记：env 值应写成 !!js 表达式，键名不受影响
const doc1c = parsePatchDoc(SAMPLE);
insertServer(
  doc1c,
  'mcp-jsprobe',
  {
    serverName: 'jsprobe',
    transport: 'stdio',
    command: 'npx',
    args: [],
    env: { TOKEN: 'process.env.TOKEN', PLAIN: 'hello' },
    cwd: '',
    url: '',
    headers: {},
    toolCallTimeoutMs: null,
    failOnStartupError: null,
    reconnect: null,
    extras: {},
  },
  new Set(['env.TOKEN']),
);
const out1c = serializeDoc(doc1c, 3);
ok(out1c.includes('TOKEN: !!js process.env.TOKEN'), '新建时 js 标记的值应写成 !!js 表达式：\n' + out1c);
ok(!out1c.includes('!!js TOKEN'), '键名不能打标');
ok(out1c.includes('PLAIN: hello'), '普通值不受影响');
const vMemory = entryToView(memEntry, out1);
strictEqual(vMemory.id, 'mcp-memory');
strictEqual(vMemory.serverName, 'memory');
deepEqual(vMemory.args, ['-y', '@modelcontextprotocol/server-memory']);
strictEqual(vMemory.toolCallTimeoutMs, 30000);
ok(out1.includes('- insert:'), '新建条目应以 - insert: 形态落盘');
assertUntouched(
  SAMPLE,
  out1,
  SAMPLE.indexOf('# 显式选中'),
  SAMPLE.indexOf('# ── MCP 服务器'),
  '新建后原有注释',
);

// ── 3. 编辑（!!js 保留 + 未知键保留 + 已知键删除） ────────────────────────

const doc2 = parsePatchDoc(SAMPLE);
const gh = findEntries(doc2)[0];
// 模拟客户端全量回传：env 里的 js 值带 "js: " 前缀；去掉 cwd；新增自定义键
applyServerConfig(
  doc2,
  gh,
  {
    serverName: 'github',
    transport: 'stdio',
    command: 'node',
    args: ['/opt/serve-github.mjs'],
    env: { GITHUB_TOKEN: 'process.env.GITHUB_TOKEN' },
    cwd: '',
    url: '',
    headers: {},
    toolCallTimeoutMs: null,
    failOnStartupError: true,
    reconnect: { enabled: true, maxAttempts: 5 },
    extras: { notes: '手写备注' },
  },
  new Set(['env.GITHUB_TOKEN']),
  new Set(['serverName', 'transport', 'command', 'args', 'env', 'failOnStartupError', 'reconnect', 'notes']),
);
const out2 = serializeDoc(doc2, 2);
ok(
  out2.includes('GITHUB_TOKEN: !!js process.env.GITHUB_TOKEN'),
  '未改动的 js 值应保留 !!js 形态，实际：\n' + out2.slice(out2.indexOf('mcp-github')),
);
ok(!out2.includes('!!js GITHUB_TOKEN'), '键名绝不能被 !!js 标记（只能标记值）');
ok(out2.includes('notes: 手写备注') || out2.includes("notes: '手写备注'"), '未知键应保留');
ok(!out2.includes('cwd:'), '载荷未提供 cwd（已知键）应删除');
ok(out2.includes('failOnStartupError: true'));
ok(out2.includes('maxAttempts: 5'));
ok(out2.includes('# 显式选中'), '编辑后注释仍保留');
const v2 = entryToView(findEntries(parsePatchDoc(out2))[0], out2);
strictEqual(v2.command, 'node');
strictEqual(v2.failOnStartupError, true);
strictEqual(v2.cwd, '');
strictEqual(v2.env['GITHUB_TOKEN']?.js, true, '回读仍应识别为 js');

// ── 4. 启停 ─────────────────────────────────────────────────────────────

const doc3 = parsePatchDoc(SAMPLE);
setEntryDisabled(doc3, findEntries(doc3)[0], true);
const out3 = serializeDoc(doc3, 2);
ok(out3.includes('disabled: true'), 'disabled: true 应写在条目上');
const doc3b = parsePatchDoc(out3);
strictEqual(
  entryToView(
    findEntries(doc3b).find((e) => e.id === 'mcp-github'),
    out3,
  ).disabled,
  true,
);
setEntryDisabled(
  doc3b,
  findEntries(doc3b).find((e) => e.id === 'mcp-github'),
  false,
);
const out3b = serializeDoc(doc3b, 2);
ok(!out3b.includes('disabled'), '取消禁用应删除 disabled 键');

// ── 5. 删除（含清空后的 insert 外壳移除） ─────────────────────────────────

const doc4 = parsePatchDoc(SAMPLE);
removeEntry(findEntries(doc4)[0]);
const out4 = serializeDoc(doc4, 1);
const doc4b = parsePatchDoc(out4);
strictEqual(findEntries(doc4b).length, 1);
strictEqual(findEntries(doc4b)[0].id, 'mcp-web');
ok(!out4.includes('mcp-github'), '被删条目不应残留');
ok(out4.includes('# ── MCP 服务器'), '删除后注释仍保留');

// ── 6. 自校验失败要拒绝 ──────────────────────────────────────────────────

const doc5 = parsePatchDoc(SAMPLE);
throws(() => serializeDoc(doc5, 99), /自校验失败/, '条目数不符应抛错');

console.log('patchdoc.test: all assertions passed');
