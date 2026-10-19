/**
 * Host 半冒烟测试：不启动 DSH，直接跑 lib/host.js 的 `apply`
 *
 * 盯的是只有 Host 侧才看得见的三件事：
 *
 *   1. 导出契约：`name` / `inject` / `apply`，以及 `NS` 必须等于 cordis 行 id
 *      （NS 四处同名：settings 命名空间 / `/ext` 路由前缀 / patch id / settings.section id）；
 *   2. 必须真的调 `settings.configure({ auto: false })`（0.1.7 契约：自带设置页时关掉自动页），
 *      并把条目 config 的 volatile 引用读进 `getConfig`（热更新靠 loader/volatile-update）；
 *   3. `/ext` 两条路由（state / config）必须**真的把补丁写进 settings**——设置节点了没反应、
 *      profile 条目 config 里没有键值，就是这一段断了。
 *
 * 只用 node 内建模块，零依赖。
 */

import assert from 'node:assert/strict';

/** 出厂默认（与 ConfigSchema 的 .default() 同值）。 */
const DEFAULTS = { view: 'highlight', sectionsOpen: false, contextLines: 3, patchTool: false };

/** 造一份 apply 的 config 入参：每个字段是一个 Volatile 引用（.get() 读共享 values）。 */
function volatileConfig(overrides = {}) {
  const values = { ...DEFAULTS, ...overrides };
  const ref = (key) => ({ get: () => values[key] });
  return {
    values,
    config: {
      view: ref('view'),
      sectionsOpen: ref('sectionsOpen'),
      contextLines: ref('contextLines'),
      patchTool: ref('patchTool'),
    },
  };
}

/** 只要 config 本体的简写（静态断言用；需要观察 update 写回的地方另建 values 接线）。 */
function cfg(overrides = {}) {
  return volatileConfig(overrides).config;
}

/** 最近一次 fake ctx 的可观测面。 */
let last = null;

/** 造一个假 ctx：只认插件真正用到的那几件（inject / get / effect / on / webServer / tools / fs）。 */
function fakeCtx(options = {}) {
  const state = {
    configured: null,
    routes: [],
    updates: [],
    effects: 0,
    hasSettings: options.hasSettings !== false,
    tools: [],
    /** 条目 config 各 volatile 字段共享的可变值；settings.update 原地写它并派发 loader/volatile-update。 */
    values: options.values,
    /** 插件经 ctx.on 注册的 loader/volatile-update 处理器。 */
    volatileHandlers: [],
    fiber: { label: 'dshp-file-change-viewer@test' },
    /** 内存文件系统：displayPath → 内容。 */
    files: new Map(options.files ?? []),
    /** readText 的调用记录（验证「同一文件只读一次」）。 */
    reads: [],
    writeLog: [],
    fsWriteDenied: false,
    writePolicies: [],
    approvals: [],
    sandboxMode: options.sandboxMode,
    standingMode: options.standingMode ?? 'workspace-write',
    approvalOutcome: options.approvalOutcome,
    /** false = 策略服务还没挂上（模拟插件挂载顺序）。 */
    policyReady: options.policyReady !== false,
    confiningReads: 0,
    /** 假后端的 readText 是否把 BOM 留在文本里（官方后端不会；用来验证「不会补出第二个 BOM」）。 */
    hasBom: options.hasBom === true,
  };
  last = state;
  const settings = {
    /** 0.1.7 页面策略：auto:false = 用插件自带的 settings.section 页。 */
    configure: (policy, fiber) => {
      state.configured = { policy, fiber };
      return () => {};
    },
    update: async (ns, patch) => {
      state.updates.push({ ns, patch });
      // 真实 loader 的提交语义：配置-only 变更把新值**原地**写进 volatile 引用，
      // 然后在本 fiber 上派发 loader/volatile-update（changed paths）。
      if (state.values !== undefined) {
        const paths = [];
        for (const [key, value] of Object.entries(patch)) {
          if (key in state.values) {
            state.values[key] = value;
            paths.push([key]);
          }
        }
        for (const handler of state.volatileHandlers) handler({ paths });
      }
    },
  };
  state.settings = settings;
  const fs = {
    resolve: async (path) => ({ displayPath: path, targetKey: path }),
    stat: async (target) =>
      state.files.has(target.displayPath) ? { version: 'v1', type: 'file', size: 1 } : undefined,
    readText: async (target) => {
      state.reads.push(target.displayPath);
      if (!state.files.has(target.displayPath)) {
        const error = new Error('not found');
        error.code = 'FS_NOT_FOUND';
        throw error;
      }
      return state.files.get(target.displayPath);
    },
    writeText: async (target, content, _intent, _signal, sandboxPolicy) => {
      state.writePolicies.push(sandboxPolicy);
      if (state.fsWriteDenied === true) {
        const error = new Error(
          'cannot write "' + target.displayPath + '": file access denied under workspace-write mode',
        );
        error.code = 'FS_SANDBOX_DENIED';
        throw error;
      }
      const before = state.files.has(target.displayPath) ? state.files.get(target.displayPath) : null;
      state.files.set(target.displayPath, content);
      state.writeLog.push(target.displayPath);
      return { operation: before === null ? 'create' : 'update', before, after: content, version: 'v2' };
    },
    /** BOM 探测的按范围读：`hasBom` 打开时回 UTF-8 BOM 的三个字节。 */
    readByteRange: async () =>
      state.hasBom === true ? new Uint8Array([0xef, 0xbb, 0xbf]) : new Uint8Array(0),
  };
  const tools = {
    register: (definition) => {
      state.tools.push(definition);
      // 与真实 `ctx.tools.register` 同契约：返回值就是「反注册这一个工具」的 disposer。
      return () => {
        const at = state.tools.indexOf(definition);
        if (at >= 0) state.tools.splice(at, 1);
      };
    },
  };
  if (options.sandboxMode !== undefined) fs.sandboxMode = options.sandboxMode;
  const sandboxPolicy = {
    defaultMode: state.sandboxMode ?? 'workspace-write',
    workspaceRoot: '/w',
    resolve: () => ({ mode: state.standingMode, workspaceRoot: '/w' }),
    overrideOf: () => undefined,
  };
  const approval = {
    request: async (request) => {
      state.approvals.push(request);
      return state.approvalOutcome;
    },
  };
  const ctx = {
    get: (name) => {
      if (name === 'settings') return state.hasSettings ? settings : undefined;
      if (name === 'sandboxPolicy') {
        if (state.sandboxMode === undefined) return undefined;
        return state.policyReady ? sandboxPolicy : undefined;
      }
      if (name === 'approval') return state.approvalOutcome === undefined ? undefined : approval;
      // locate 路由显式取 fs 服务（它挂在插件自己的 ctx 上，不在 tools/fs 的注入作用域里）。
      if (name === 'fs') return fs;
      return undefined;
    },
    effect: (callback) => {
      state.effects += 1;
      const cleanup = typeof callback === 'function' ? callback() : undefined;
      let done = false;
      return () => {
        if (done) return;
        done = true;
        if (typeof cleanup === 'function') cleanup();
      };
    },
    emit: () => {},
    /** 0.1.7 热更新事件面：插件在这里收 loader/volatile-update。 */
    on: (event, handler) => {
      if (event === 'loader/volatile-update') {
        state.volatileHandlers.push(handler);
        return () => {
          const at = state.volatileHandlers.indexOf(handler);
          if (at >= 0) state.volatileHandlers.splice(at, 1);
        };
      }
      return () => {};
    },
    fiber: state.fiber,
    waterfall: (...args) => {
      const fallback = args[args.length - 1];
      return typeof fallback === 'function' ? fallback() : undefined;
    },
    webServer: {
      register: (route) => {
        state.routes.push(route);
        return () => {};
      },
    },
  };
  return {
    ...ctx,
    // Cordis 的 `inject` 回调拿到的是**继承父 ctx 的子上下文**（services 仍在），不是只有依赖的裸对象。
    inject: (deps, callback) => {
      if (deps.length === 1 && deps[0] === 'settings') {
        callback({ ...ctx, settings });
        return;
      }
      assert.deepEqual(deps, ['tools', 'fs']);
      callback({ ...ctx, tools, fs });
    },
  };
}

/** 假请求：`readBody` 只需要 `on('data'|'end')`。 */
function fakeRequest(method, body, headers = {}) {
  return {
    method,
    headers,
    on(event, callback) {
      if (event === 'data' && body !== undefined) callback(Buffer.from(body));
      if (event === 'end') callback();
      return this;
    },
    destroy() {},
  };
}

/** 假应答：收下 status / body 供断言。 */
function fakeResponse() {
  return {
    status: 0,
    body: null,
    writeHead(status) {
      this.status = status;
      return this;
    },
    end(text) {
      this.body = text;
    },
  };
}

/** 打一次路由并解析 JSON 应答。 */
async function callRoute(route, method, body, headers = {}) {
  const res = fakeResponse();
  await route.handler(fakeRequest(method, body, headers), res);
  return { status: res.status, json: res.body === null ? null : JSON.parse(res.body) };
}

const host = await import('../lib/host.js');

let checks = 0;
function ok(label, condition) {
  checks += 1;
  assert.ok(condition, label);
}

const realInfo = console.info;
console.info = () => {}; // 启动日志不该进测试输出
/** 被文件策略拒绝时的 Host 侧诊断日志（模型看不到，测试要看）。 */
const denials = [];
const realWarn = console.warn;
console.warn = (...args) => {
  denials.push(args.map((value) => String(value)).join(' '));
};

ok('必须导出 name', host.name === '@dshp/file-change-viewer');
ok(
  'inject 必须声明 webServer（/ext 路由要用）',
  Array.isArray(host.inject) && host.inject.includes('webServer'),
);
ok('必须导出 apply', typeof host.apply === 'function');
ok(
  '必须导出 NS / ConfigSchema / Config（0.1.7 条目契约）',
  typeof host.NS === 'string' && !!host.ConfigSchema && !!host.Config,
);
ok('NS 必须等于 cordis 行 id（NS 四处同名）', host.NS === 'dshp-file-change-viewer');

// ── 默认值 + 条目 config + 页面策略 ─────────────────────────────────────────
{
  const setup = volatileConfig();
  const ctx = fakeCtx({ values: setup.values });
  host.apply(ctx, setup.config);
  ok(
    '自带设置页必须关掉自动页（configure({ auto: false }, ctx.fiber)）',
    last.configured !== null && last.configured.policy.auto === false && last.configured.fiber === ctx.fiber,
  );
  const initial = (await callRoute(last.routes[0], 'GET')).json.config;
  ok(
    '条目没写 config 时用出厂默认（高亮 + 不默认展开 = 保持原生折叠）',
    initial.view === 'highlight' && initial.sectionsOpen === false,
  );
  ok('patchTool 出厂默认关（测试版能力）', initial.patchTool === false);
  ok('contextLines 出厂默认 3 行（git diff 同款默认）', initial.contextLines === 3);
  ok(
    '默认关着时**不注册** patch 工具',
    last.tools.every((tool) => tool.name !== 'patch'),
  );
}

{
  const setup = volatileConfig({ view: 'diff', sectionsOpen: true });
  host.apply(fakeCtx({ values: setup.values }), setup.config);
  const shown = (await callRoute(last.routes[0], 'GET')).json.config;
  ok('条目 config（loader 校验后的引用）原样生效', shown.view === 'diff' && shown.sectionsOpen === true);
}

host.apply(fakeCtx(), cfg({ patchTool: true }));
ok(
  '打开后确实注册了 patch 工具',
  last.tools.some((tool) => tool.name === 'patch'),
);

// 非法值不再有插件内的逐字段回退：schema 校验不过 = 整个条目不装载（loader 侧的事），这里守住 schema 本身。
{
  const badBool = host.ConfigSchema['~standard'].validate({ patchTool: 'yes' });
  ok(
    '非布尔 patchTool 被 schema 拒绝（issues 非空）',
    Array.isArray(badBool.issues) && badBool.issues.length > 0,
  );
  const badEnum = host.ConfigSchema['~standard'].validate({ contextLines: 4 });
  ok('枚举之外的上下文行数被 schema 拒绝', Array.isArray(badEnum.issues) && badEnum.issues.length > 0);
  const badView = host.ConfigSchema['~standard'].validate({ view: 'bogus' });
  ok(' bogus view 被 schema 拒绝', Array.isArray(badView.issues) && badView.issues.length > 0);
}

// 动态开关：settings.update 原地提交进 volatile 引用 → loader/volatile-update 驱动 syncPatchTool。
{
  const setup = volatileConfig();
  host.apply(fakeCtx({ values: setup.values }), setup.config);
  await last.settings.update(host.NS, { patchTool: true });
  ok(
    '设置里开了（volatile 提交）就把工具注册上',
    last.tools.some((tool) => tool.name === 'patch'),
  );
  await last.settings.update(host.NS, { view: 'diff' });
  ok(
    '改别的字段不动已注册的工具',
    last.tools.some((tool) => tool.name === 'patch'),
  );
  await last.settings.update(host.NS, { patchTool: false });
  ok('真的关了才反注册', !last.tools.some((tool) => tool.name === 'patch'));
}

// ── schema ─────────────────────────────────────────────────────────────────
const parsed = host.ConfigSchema({});
ok('schema 默认 view=highlight', parsed.view.get() === 'highlight');
ok('schema 默认 sectionsOpen=false（新渲染的行保持原生折叠）', parsed.sectionsOpen.get() === false);
ok('schema 默认 patchTool=false（工具默认关闭）', parsed.patchTool.get() === false);
ok('schema 默认 contextLines=3', parsed.contextLines.get() === 3);
ok('schema 里不再有 rowsOpen 这种多余属性', parsed.rowsOpen === undefined);
const narrowed = host.ConfigSchema({ view: 'diff', sectionsOpen: false });
ok(
  'schema 接受合法值（volatile 字段的输出是引用，.get() 读值）',
  narrowed.view.get() === 'diff' && narrowed.sectionsOpen.get() === false,
);

// ── /ext 路由 ──────────────────────────────────────────────────────────────
{
  // 这段要观察「POST 写回后 GET 读到新值」，所以 values 与 fake settings.update 接在同一个对象上。
  const setup = volatileConfig({ view: 'diff', sectionsOpen: true });
  host.apply(fakeCtx({ hasSettings: true, values: setup.values }), setup.config);
}
const state = last;
const paths = state.routes.map((route) => route.path);
ok('必须注册三条 exact 路由', paths.length === 3 && state.routes.every((route) => route.kind === 'exact'));
ok('state 路由路径必须等于 NS 前缀', paths[0] === '/ext/dshp-file-change-viewer/state');
ok('config 路由路径必须等于 NS 前缀', paths[1] === '/ext/dshp-file-change-viewer/config');
ok('locate 路由（真实行号定位）路径正确', paths[2] === '/ext/dshp-file-change-viewer/locate');

const stateRoute = state.routes[0];
const configRoute = state.routes[1];

// locate：回行号 + 两侧上下文；不回整份文件
{
  const located = fakeCtx({
    files: [['src/l.ts', 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven\n']],
  });
  host.apply(located, cfg());
  const route = last.routes[2];
  const answer = await callRoute(
    route,
    'POST',
    JSON.stringify({
      cwd: '/w',
      items: [
        { path: 'src/l.ts', newText: 'four\nfive' },
        { path: 'src/l.ts', newText: '不存在的段落' },
        { path: 'src/missing.ts', newText: 'x' },
        { path: 'src/l.ts', newText: '已经不在文件里的新文本', oldText: 'seven\neight' },
      ],
    }),
  );
  const results = answer.json.results ?? [];
  ok('locate 回 ok:true', answer.status === 200 && answer.json.ok === true);
  ok('locate 报到真实行号（four 是第 4 行）', results[0].line === 4);
  ok(
    '上下文按文件顺序回传（上文 one / two / three；客户端取最后 N 行 = 离改动最近的 N 行）',
    JSON.stringify(results[0].before) === JSON.stringify(['one', 'two', 'three']),
  );
  ok(
    'locate 把下文一并回传（紧随其后的 six / seven / eight …，最多 8 行）',
    JSON.stringify(results[0].after) === JSON.stringify(['six', 'seven', 'eight', 'nine', 'ten', 'eleven']),
  );
  ok('上下文最多 8 行（再多也不回）', results[0].after.length <= 8 && results[0].before.length <= 8);
  ok(
    '定位不到时回 null + 空上下文（卡片退回从 1 开始、不显示上下文）',
    results[1].line === null && results[1].before.length === 0,
  );
  ok('文件不存在也回 null', results[2].line === null);
  ok(
    'newText 定位不到时退回 oldText 兜底（调用失败 / 文件又被改过时磁盘上还是旧文本）',
    results[3].line === 7 && JSON.stringify(results[3].after) === JSON.stringify(['nine', 'ten', 'eleven']),
  );
  ok(
    'locate 的响应里没有任何整份文件（只有行号与每侧最多 8 行原文）',
    JSON.stringify(answer.json).length < 400 && !JSON.stringify(answer.json).includes('one\\ntwo'),
  );
  ok(
    '同一请求里同一个文件只读一次（缓存按 path）',
    last.reads.filter((path) => path === 'src/l.ts').length === 1,
  );
}

const stateAnswer = await callRoute(stateRoute, 'GET');
ok('GET state 回 ok:true', stateAnswer.status === 200 && stateAnswer.json.ok === true);
ok(
  'GET state 回当前生效偏好（含 composition 补丁）',
  stateAnswer.json.config.view === 'diff' && stateAnswer.json.config.sectionsOpen === true,
);

const writeAnswer = await callRoute(configRoute, 'POST', JSON.stringify({ view: 'highlight' }));
ok('POST config 回 ok:true 与回写后的 config', writeAnswer.status === 200 && writeAnswer.json.ok === true);
ok(
  'POST config 必须调 settings.update(NS, patch)',
  state.updates.length === 1 && state.updates[0].ns === host.NS,
);
ok('写入的补丁只含被点的字段', state.updates[0].patch.view === 'highlight');

const badView = await callRoute(configRoute, 'POST', JSON.stringify({ view: 'bogus' }));
ok('非法 view 必须回 ok:false + 中文提示', badView.json.ok === false && badView.json.error.includes('view'));
ok(
  'sectionsOpen 也能单独写',
  (await callRoute(configRoute, 'POST', JSON.stringify({ sectionsOpen: true }))).json.ok === true &&
    state.updates[1].patch.sectionsOpen === true,
);
const badBool = await callRoute(configRoute, 'POST', JSON.stringify({ sectionsOpen: 'yes' }));
ok('非法 sectionsOpen 必须回 ok:false', badBool.json.ok === false);
const openedTool = await callRoute(configRoute, 'POST', JSON.stringify({ patchTool: true }));
ok('patchTool 能单独写', openedTool.json.ok === true && state.updates[2].patch.patchTool === true);
ok('开启后 state 路由回的就是 true', openedTool.json.config.patchTool === true);
const badTool = await callRoute(configRoute, 'POST', JSON.stringify({ patchTool: 'yes' }));
ok('非法 patchTool 必须回 ok:false 且不落库', badTool.json.ok === false && state.updates.length === 3);
const contextWritten = await callRoute(configRoute, 'POST', JSON.stringify({ contextLines: 8 }));
ok(
  'contextLines 能单独写并回权威值',
  contextWritten.json.ok === true &&
    contextWritten.json.config.contextLines === 8 &&
    state.updates[3].patch.contextLines === 8,
);
const badContext = await callRoute(configRoute, 'POST', JSON.stringify({ contextLines: 4 }));
ok('非法 contextLines 必须回 ok:false 且不落库', badContext.json.ok === false && state.updates.length === 4);
ok(
  'patchTool 一开，volatile 提交（loader/volatile-update）就把工具注册上（不必重启）',
  state.tools.some((tool) => tool.name === 'patch'),
);
const closedTool = await callRoute(configRoute, 'POST', JSON.stringify({ patchTool: false }));
ok(
  'patchTool 一关，工具立刻被反注册',
  closedTool.json.ok === true && !state.tools.some((tool) => tool.name === 'patch'),
);
const legacy = await callRoute(configRoute, 'POST', JSON.stringify({ rowsOpen: true }));
ok(
  '多余的 rowsOpen 不再被当作偏好（已移除该属性）',
  !('rowsOpen' in state.updates[1].patch) && legacy.json.ok === true,
);
ok('非法值不得落库', state.updates.length === 5);

const badJson = await callRoute(configRoute, 'POST', '{oops');
ok('请求体不是 JSON 必须回 ok:false', badJson.json.ok === false && badJson.json.error.includes('JSON'));

const wrongMethod = await callRoute(configRoute, 'GET');
ok('config 路由只收 POST', wrongMethod.status === 405);
const crossSite = await callRoute(stateRoute, 'GET', undefined, { origin: 'http://evil.example', host: 'x' });
ok('跨站调用必须 403', crossSite.status === 403);

host.apply(fakeCtx({ hasSettings: false }), cfg());
const noSettings = await callRoute(last.routes[1], 'POST', JSON.stringify({ sectionsOpen: true }));
ok(
  'settings 服务缺失时必须回 ok:false（不能假装保存成功）',
  noSettings.json.ok === false && noSettings.json.error.includes('settings 服务不可用'),
);

// ── patch 工具：注册契约 + 真正落盘 + 全有或全无 ────────────────────────────

const withFiles = fakeCtx({
  files: [
    ['src/a.ts', 'const a = 1;\n'],
    ['src/b.ts', 'const b = 2;\n'],
  ],
});
host.apply(withFiles, cfg({ patchTool: true }));
const patchTool = last.tools.filter((tool) => tool.name === 'patch')[0];
ok('必须注册 patch 工具', patchTool !== undefined);
ok('patch 工具要求必须带 patch 文本', patchTool.parameters.required.includes('patch'));
ok('patch 工具声明了输出 schema 与 render', typeof patchTool.output.render === 'function');
ok(
  'patch 工具必须给差异卡片提供 diffs（presentationMeta）',
  typeof patchTool.output.presentationMeta === 'function',
);
ok('patch 工具声明为不可并行（会改文件）', patchTool.isConcurrencySafe() === false);

// 工具说明必须把三种段头都写出来，而且**各自带例子**：只给「改」的例子，模型第一次就会拿它去
// 写一个还不存在的文件（真实踩过）。
{
  const description = patchTool.description;
  const paramHint = patchTool.parameters.properties.patch.description;
  ok('描述里写明信封', description.includes('*** Begin Patch') && description.includes('*** End Patch'));
  ok('描述里写明新建文件的形式', description.includes('*** Add File:'));
  ok('描述里写明改已有文件的形式', description.includes('*** Update File:'));
  ok('描述里没有把删除写成可用操作', !description.includes('remove an existing file; nothing follows'));
  ok('描述里的例子不含改名（改名会被拒）', !description.includes('*** Move to: src/main.py'));
  ok('描述里点明片段不写行号', description.includes('Line numbers are never written'));
  ok('描述里点明 Add 命中已存在文件会被拒', description.includes('already exists is refused'));
  ok('描述里点明删除段会被拒', description.includes('*** Delete File:') && description.includes('REFUSED'));
  ok('描述里点明改名段会被拒', description.includes('*** Move to:'));
  ok('描述里给出 bash 的替代出口', description.includes('rm / mv'));
  ok('参数说明里带了完整例子', paramHint.includes('*** Begin Patch') && paramHint.includes('*** End Patch'));
}

const execCtx = { agent: { session: { header: { cwd: '/w' } } }, signal: undefined };
const twoFilePatch = [
  '*** Begin Patch',
  '*** Update File: src/a.ts',
  '@@',
  '-const a = 1;',
  '+const a = 11;',
  '*** Update File: src/b.ts',
  '@@',
  '-const b = 2;',
  '+const b = 22;',
  '*** End Patch',
].join('\n');

const result = await patchTool.execute({ patch: twoFilePatch }, execCtx);
ok(
  '两个文件都写进去了',
  last.files.get('src/a.ts') === 'const a = 11;\n' && last.files.get('src/b.ts') === 'const b = 22;\n',
);
ok('返回值按文件列出增删', result.files.length === 2 && result.added === 2 && result.removed === 2);
ok(
  '返回值带上每个文件的操作类型',
  result.files[0].operation === 'update' && result.files[1].operation === 'update',
);
ok(
  '返回值带上「只含变化行 + 上下文」的差异文本（差异卡片直接用）',
  result.diffs[0].oldText === 'const a = 1;' && result.diffs[0].newText === 'const a = 11;',
);
ok('差异带上片段在文件里的真实起始行号', result.diffs[0].startLine === 1 && result.diffs[1].startLine === 1);
const meta = patchTool.output.presentationMeta({ patch: twoFilePatch }, result);
ok(
  'presentationMeta 把两个文件的差异交给卡片',
  meta.diffs.length === 2 && meta.diffs[0].path === 'src/a.ts' && meta.diffs[1].newText === 'const b = 22;',
);
ok('render 只回小结、不回显整份 patch', typeof patchTool.output.render({}, result)[0].text === 'string');

// 预览（流式 / 结算前）：宽容解析，能解析出几段就预览几段
{
  const preview = patchTool.presentCall({ patch: twoFilePatch.replace('*** End Patch', '') });
  ok('presentCall 在不完整补丁上也能给预览', preview.diffs.length === 2 && preview.card === 'diff');
  ok(
    '预览带的路径就是补丁里的路径',
    preview.locations.length === 2 && preview.locations[0].path === 'src/a.ts',
  );
}

// 全有或全无：第二个文件的上下文对不上时，第一个文件也不能被写
const broken = fakeCtx({ files: [['src/a.ts', 'const a = 1;\n']] });
host.apply(broken, cfg({ patchTool: true }));
const brokenTool = last.tools.filter((tool) => tool.name === 'patch')[0];
const halfPatch = [
  '*** Begin Patch',
  '*** Update File: src/a.ts',
  '@@',
  '-const a = 1;',
  '+const a = 11;',
  '*** Update File: missing.ts',
  '@@',
  '-nope',
  '+nope2',
  '*** End Patch',
].join('\n');
let allOrNothing = null;
try {
  await brokenTool.execute({ patch: halfPatch }, execCtx);
} catch (error) {
  allOrNothing = error;
}
ok('任一文件对不上就整体失败', allOrNothing !== null);
ok('失败时第一个文件没有被写（不会留半截状态）', last.files.get('src/a.ts') === 'const a = 1;\n');
ok('失败消息点名是哪个文件', String(allOrNothing.message).includes('missing.ts'));
ok('「已有文件却不存在」的消息教了怎么新建', String(allOrNothing.message).includes('*** Add File:'));

// 删除 / 改名：解析层认识，执行层明确拒绝（不读文件、不问审批、一个字节不写）
{
  const refuse = fakeCtx({
    sandboxMode: 'workspace-write',
    files: [
      ['src/keep.ts', 'keep\n'],
      ['src/gone.ts', 'bye\n'],
      ['src/old.ts', 'old content\n'],
    ],
  });
  host.apply(refuse, cfg({ patchTool: true }));
  const tool = last.tools.filter((item) => item.name === 'patch')[0];

  let deleted = null;
  try {
    await tool.execute({ patch: '*** Begin Patch\n*** Delete File: src/gone.ts\n*** End Patch' }, execCtx);
  } catch (error) {
    deleted = error;
  }
  ok('*** Delete File: 被拒绝', deleted !== null && String(deleted.message).includes('不执行删除与改名'));
  ok('拒绝消息点名了那一段', String(deleted.message).includes('*** Delete File: src/gone.ts'));
  ok('拒绝消息给出 bash rm 的替代做法', String(deleted.message).includes('`rm`'));
  ok('删除被拒时文件还在', last.files.has('src/gone.ts'));

  let moved = null;
  try {
    await tool.execute(
      {
        patch: [
          '*** Begin Patch',
          '*** Update File: src/old.ts',
          '*** Move to: src/renamed.ts',
          '@@',
          '-old content',
          '+new content',
          '*** End Patch',
        ].join('\n'),
      },
      execCtx,
    );
  } catch (error) {
    moved = error;
  }
  ok('*** Move to: 被拒绝', moved !== null && String(moved.message).includes('不执行删除与改名'));
  ok('拒绝消息给出 mv 的替代做法', String(moved.message).includes('`mv`'));
  ok(
    '改名被拒时旧文件没被改、也没多出新文件',
    last.files.get('src/old.ts') === 'old content\n' && !last.files.has('src/renamed.ts'),
  );

  // 混合补丁（一段合法 + 一段删除）：整体拒绝，合法那一段也不写
  let mixed = null;
  try {
    await tool.execute(
      {
        patch: [
          '*** Begin Patch',
          '*** Update File: src/keep.ts',
          '@@',
          '-keep',
          '+KEEP',
          '*** Delete File: src/gone.ts',
          '*** End Patch',
        ].join('\n'),
      },
      execCtx,
    );
  } catch (error) {
    mixed = error;
  }
  ok('补丁里混进删除段时整体拒绝', mixed !== null);
  ok('被拒时合法那一段也没写（读文件之前就拒绝）', last.files.get('src/keep.ts') === 'keep\n');
  ok('被拒时不发审批请求', last.approvals.length === 0);
}

// BOM 保持：官方后端解出来不带 BOM，写回要补上；后端若把 BOM 留在文本里也不能补出两个
{
  const utf8Bom = '\ufeff';
  const kept = fakeCtx({
    hasBom: true,
    files: [['src/bom.cs', utf8Bom + 'using System;\n\nclass Test {}\n']],
  });
  host.apply(kept, cfg({ patchTool: true }));
  const tool = last.tools.filter((item) => item.name === 'patch')[0];
  const written = await tool.execute(
    {
      patch:
        '*** Begin Patch\n*** Update File: src/bom.cs\n@@\n class Test {}\n+class Next {}\n*** End Patch',
    },
    execCtx,
  );
  ok(
    '带 BOM 的文件改完仍然只有一个 BOM',
    last.files.get('src/bom.cs') === utf8Bom + 'using System;\n\nclass Test {}\nclass Next {}\n',
  );
  ok('BOM 不进入差异文本（卡片不会显示一个不可见字符）', written.diffs[0].newText.includes('class Next {}'));

  const stripped = fakeCtx({ hasBom: true, files: [['src/bom2.cs', 'using System;\n']] });
  host.apply(stripped, cfg({ patchTool: true }));
  const tool2 = last.tools.filter((item) => item.name === 'patch')[0];
  await tool2.execute(
    {
      patch:
        '*** Begin Patch\n*** Update File: src/bom2.cs\n@@\n-using System;\n+using System.Text;\n*** End Patch',
    },
    execCtx,
  );
  ok(
    '后端把 BOM 吃掉时（官方行为）写回补上',
    last.files.get('src/bom2.cs') === utf8Bom + 'using System.Text;\n',
  );
}

// ── 沙箱提权：与官方 write / edit / bash 同一套 ─────────────────────────────

ok(
  '没有沙箱后端时不广告 sandbox_permissions',
  patchTool.parameters.properties.sandbox_permissions === undefined,
);

const sandboxed = fakeCtx({
  sandboxMode: 'workspace-write',
  approvalOutcome: 'allowed-once',
  files: [
    ['src/a.ts', 'const a = 1;\n'],
    ['src/b.ts', 'const b = 2;\n'],
  ],
});
host.apply(sandboxed, cfg({ patchTool: true }));
const sandboxTool = last.tools.filter((tool) => tool.name === 'patch')[0];
const sandboxParams = sandboxTool.parameters.properties;
ok('有沙箱后端时广告 sandbox_permissions', sandboxParams.sandbox_permissions !== undefined);
ok(
  '提权词表是官方的闭合目标集',
  JSON.stringify(sandboxParams.sandbox_permissions.enum) === '["workspace-write","danger-full-access"]',
);
ok('同时广告 justification', sandboxParams.justification !== undefined);

const escalated = await sandboxTool.execute(
  { patch: twoFilePatch, sandbox_permissions: 'danger-full-access', justification: '需要写工作区外的文件' },
  execCtx,
);
ok('批准后写入成功', last.files.get('src/a.ts') === 'const a = 11;\n');
ok('审批只问一次', last.approvals.length === 1);
ok(
  '审批请求里有模式与理由',
  String(last.approvals[0].reason).includes('danger-full-access') &&
    String(last.approvals[0].reason).includes('需要写工作区外的文件'),
);
ok(
  '提权后的策略只盖这一次调用（writeText 收到 danger-full-access）',
  last.writePolicies.length > 0 && last.writePolicies[0].mode === 'danger-full-access',
);
ok('返回值照常（两个文件都在）', escalated.files.length === 2);

const refused = fakeCtx({
  sandboxMode: 'workspace-write',
  approvalOutcome: 'rejected',
  files: [
    ['src/a.ts', 'const a = 1;\n'],
    ['src/b.ts', 'const b = 2;\n'],
  ],
});
host.apply(refused, cfg({ patchTool: true }));
const refusedTool = last.tools.filter((tool) => tool.name === 'patch')[0];
let refusal = null;
try {
  await refusedTool.execute(
    { patch: twoFilePatch, sandbox_permissions: 'danger-full-access', justification: '想写外面' },
    execCtx,
  );
} catch (error) {
  refusal = error;
}
ok('被拒时抛错', refusal !== null && String(refusal.message).includes('the user rejected'));
ok(
  '被拒时一个字节都没写',
  last.files.get('src/a.ts') === 'const a = 1;\n' && last.files.get('src/b.ts') === 'const b = 2;\n',
);

const noWider = fakeCtx({
  sandboxMode: 'workspace-write',
  standingMode: 'danger-full-access',
  approvalOutcome: 'allowed-once',
});
host.apply(noWider, cfg({ patchTool: true }));
const noWiderTool = last.tools.filter((tool) => tool.name === 'patch')[0];
let notWider = null;
try {
  await noWiderTool.execute(
    { patch: twoFilePatch, sandbox_permissions: 'workspace-write', justification: '缩回去' },
    execCtx,
  );
} catch (error) {
  notWider = error;
}
ok('不是严格更宽时直接拒', notWider !== null && String(notWider.message).includes('not strictly wider'));
ok('不更宽的请求不发审批', last.approvals.length === 0);

let pairing = null;
try {
  await noWiderTool.execute({ patch: twoFilePatch, justification: '只给了理由' }, execCtx);
} catch (error) {
  pairing = error;
}
ok('只给 justification 时拒绝', pairing !== null && String(pairing.message).includes('only valid together'));

// ⑦ 挂载顺序回归：注册时 ctx.sandboxPolicy 还不在，调用时才有 —— 必须用会话工作区当可写根
{
  const late = fakeCtx({
    sandboxMode: 'workspace-write',
    policyReady: false, // 注册那一刻：策略服务尚未挂载
    files: [
      ['src/a.ts', 'const a = 1;\n'],
      ['src/b.ts', 'const b = 2;\n'],
    ],
  });
  host.apply(late, cfg({ patchTool: true }));
  const lateTool = last.tools.filter((tool) => tool.name === 'patch')[0];

  // 策略服务仍然没挂上：宁可拒绝，也不能用「无策略」去写（那会让围栏退回兜底根）
  let unresolved = null;
  try {
    await lateTool.execute({ patch: twoFilePatch }, execCtx);
  } catch (error) {
    unresolved = error;
  }
  ok('围栏在但策略服务缺失时明确拒绝', unresolved !== null);
  ok(
    '拒绝理由点明 ctx.sandboxPolicy missing',
    String(unresolved.message).includes('sandboxPolicy is missing'),
  );
  ok('拒绝时一个字节都没写', last.files.get('src/a.ts') === 'const a = 1;\n');

  // 策略服务挂上后：同一次执行要能拿到**带会话工作区**的策略，写入成功
  last.policyReady = true; // state 才是 fake 的可观测面
  const lateResult = await lateTool.execute({ patch: twoFilePatch }, execCtx);
  ok('策略服务晚挂载也能正常写入（服务每次调用现读）', lateResult.files.length === 2);
  ok(
    '写盘时带的是会话工作区策略（不是兜底根）',
    last.writePolicies.length > 0 && last.writePolicies[last.writePolicies.length - 1].workspaceRoot === '/w',
  );
}

const denied = fakeCtx({
  sandboxMode: 'workspace-write',
  files: [
    ['src/a.ts', 'const a = 1;\n'],
    ['src/b.ts', 'const b = 2;\n'],
  ],
});
host.apply(denied, cfg({ patchTool: true }));
const deniedTool = last.tools.filter((tool) => tool.name === 'patch')[0];
last.fsWriteDenied = true;
let blocked = null;
try {
  await deniedTool.execute({ patch: twoFilePatch }, execCtx);
} catch (error) {
  blocked = error;
}
ok('文件策略拒绝时抛出可读错误', blocked !== null);
ok(
  '拒绝消息用官方的 [sandbox: …] 标记',
  String(blocked.message).includes('[sandbox: file access denied under workspace-write mode]'),
);
ok('拒绝消息带同轮次的提权提示', String(blocked.message).includes('[sandbox: escalation available'));
ok(
  '拒绝消息与官方逐字一致（两行 marker，不带任何额外说明）',
  String(blocked.message) ===
    '[sandbox: file access denied under workspace-write mode]\n' +
      '[sandbox: escalation available — retry this exact operation once with sandbox_permissions ' +
      '(the narrowest wider mode that suffices) + justification; the approval prompt asks the user]',
);
ok(
  '拒绝仍带着 FS_SANDBOX_DENIED 码（ToolRuntime 才会填 result.error.code，与 edit 一致）',
  blocked.code === 'FS_SANDBOX_DENIED',
);
ok('Host 侧留下诊断日志（路径 / 模式 / 可写根）', denials.length === 1 && denials[0].includes('src/a.ts'));
ok('被拒时文件没有被改（fail-closed）', last.files.get('src/a.ts') === 'const a = 1;\n');

let garbage = null;
try {
  await brokenTool.execute({ patch: '这里没有补丁' }, execCtx);
} catch (error) {
  garbage = error;
}
ok('没有信封时给出可照做的中文报错', garbage !== null && String(garbage.message).includes('*** Begin Patch'));

let emptyEnvelope = null;
try {
  await brokenTool.execute({ patch: '*** Begin Patch\n*** End Patch' }, execCtx);
} catch (error) {
  emptyEnvelope = error;
}
ok(
  '空信封给出「没有任何文件段落」的报错',
  emptyEnvelope !== null && String(emptyEnvelope.message).includes('段落'),
);

// ── 写前预检：越界目标必须在任何写入之前被拦下 ────────────────────────────────

const { assertWritable, writableRootsUnder } = host;
ok(
  'workspace-write 的可写根 = 工作区 + /tmp + 平台临时目录',
  writableRootsUnder({ mode: 'workspace-write', workspaceRoot: '/w' }).length >= 2,
);
await assertWritable({ mode: 'workspace-write', workspaceRoot: '/w' }, '/w/src/a.ts');
ok('工作区内的目标放行', true);
await assertWritable({ mode: 'danger-full-access', workspaceRoot: '/w' }, '/anywhere/x.ts');
ok('danger-full-access 直接放行', true);
await assertWritable({ mode: 'workspace-write', workspaceRoot: '/w' }, '/tmp/x.ts');
ok('临时目录放行（与围栏口径一致）', true);
await assertWritable(undefined, '/anywhere/x.ts');
ok('没有策略（未装围栏）时不做预检', true);
await assertWritable({ mode: 'workspace-write', workspaceRoot: '/w' }, 'relative/x.ts');
ok('相对路径不做预检（交给真围栏判）', true);

for (const [label, policy, target] of [
  ['工作区外的目标被预检拦下', { mode: 'workspace-write', workspaceRoot: '/w' }, '/outside/x.ts'],
  ['read-only 下任何目标都被拦下', { mode: 'read-only', workspaceRoot: '/w' }, '/w/src/a.ts'],
]) {
  let preflightBlocked = null;
  try {
    await assertWritable(policy, target);
  } catch (error) {
    preflightBlocked = error;
  }
  ok(label, preflightBlocked !== null);
  ok(
    label + '：消息与围栏一致（两行 marker + 可提权提示）',
    String(preflightBlocked.message).includes('[sandbox: file access denied under '),
  );
  ok(label + '：带 FS_SANDBOX_DENIED 码', preflightBlocked.code === 'FS_SANDBOX_DENIED');
}

// 集成：批量里混进一个工作区外的文件 → 工作区内那个也不能被写
{
  const mixed = fakeCtx({
    sandboxMode: 'workspace-write',
    files: [
      ['/w/inside.txt', 'inside\n'],
      ['/w/src/a.ts', 'const a = 1;\n'],
      ['/w/src/b.ts', 'const b = 2;\n'],
    ],
  });
  host.apply(mixed, cfg({ patchTool: true }));
  const mixedTool = last.tools.filter((tool) => tool.name === 'patch')[0];
  // 一个在工作区内，两个是绝对路径的工作区外目标
  const outsidePatch = [
    '*** Begin Patch',
    '*** Add File: /w/new-inside.txt',
    '+ok',
    '*** Add File: /outside/evil.txt',
    '+nope',
    '*** Add File: /outside/second.txt',
    '+nope too',
    '*** End Patch',
  ].join('\n');
  let mixedBlocked = null;
  try {
    await mixedTool.execute({ patch: outsidePatch }, execCtx);
  } catch (error) {
    mixedBlocked = error;
  }
  ok('混入越界文件时整体失败', mixedBlocked !== null);
  ok('越界的文件没被创建', last.files.has('/outside/evil.txt') === false);
  ok('第二个越界文件也没被创建', last.files.has('/outside/second.txt') === false);
  ok(
    '同一个 patch 里合法的那个文件也没被写（写前预检 => 原子性）',
    last.files.has('/w/new-inside.txt') === false,
  );
  ok(
    '拒绝消息把**本批全部**越界目标一次列出来',
    String(mixedBlocked.message).includes('/outside/evil.txt') &&
      String(mixedBlocked.message).includes('/outside/second.txt'),
  );
  ok(
    '拒绝消息给出越界目标的父目录（模型一次重试即可覆盖整批）',
    String(mixedBlocked.message).includes('parent directories'),
  );
}

// ── assertBatchWritable：批量预检把全部越界目标一次报出来 ────────────────────
{
  let batchBlocked = null;
  try {
    await host.assertBatchWritable({ mode: 'workspace-write', workspaceRoot: '/w' }, [
      '/w/src/a.ts',
      '/outside/x.ts',
      '/outside/y.ts',
    ]);
  } catch (error) {
    batchBlocked = error;
  }
  ok('批量预检在有越界目标时抛错', batchBlocked !== null);
  ok(
    '批量预检的消息仍以官方两行 marker 开头',
    String(batchBlocked.message).startsWith(
      '[sandbox: file access denied under workspace-write mode]\n[sandbox: escalation available',
    ),
  );
  ok('批量预检带 FS_SANDBOX_DENIED 码', batchBlocked.code === 'FS_SANDBOX_DENIED');
  await host.assertBatchWritable({ mode: 'workspace-write', workspaceRoot: '/w' }, [
    '/w/src/a.ts',
    '/tmp/x.ts',
  ]);
  ok('全部在可写根里时放行', true);
  await host.assertBatchWritable(undefined, ['/anywhere/x.ts']);
  ok('没有策略时不做批量预检', true);
}

console.info = realInfo;
console.warn = realWarn;
console.log('✓ @dshp/file-change-viewer host: ' + checks + ' 项断言全部通过');
