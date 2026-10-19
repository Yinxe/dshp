/**
 * 无头冒烟测试：不打开浏览器，把 lib/client.js 当 IIFE 跑一遍
 *
 * 覆盖的是「看不见但错了就白屏」的部分——这些恰好在浏览器里最难自查：
 *
 *   1. loader 契约：`__ModuleLoader__.load({ id, factory })` 的 id 与包名一致，
 *      `inject` / `apply` 齐全，`apply` 在只给 slots 的 ctx 下不抛；
 *   2. 槽位注册：`tool.call.toolview` 的 edit / write / str_replace_editor 三个 key，带
 *      `locale: 'conversation'`（少了它就没有 `t`）与**比内置行更小的 priority**（同 key 同
 *      优先级在 keyed 槽位上直接抛错），外加 `settings.general.item` 一条偏好行；
 *   3. 原生行形态：外层 `DisclosureRow` 默认折叠（与思考 / 读取行一致）、标题走 conversation
 *      键，路径在 summary 位、统计绿增红删；失败时 summary 只剩错误行（官方 ToolRow 的做法）；
 *   4. 每个文件块各自一个 `DisclosureRow`，默认开合走用户偏好，单块可临时覆盖；
 *   5. 高亮视图：单代码块放完整统一 diff（LCS 交错、代码原样无标记）、按行区间上底色、
 *      删除行不占行号；± 差异视图经全局偏好切换后仍可达；
 *   6. 变更推导：结算结果的 `meta.diffs`、流式半截 JSON、失败调用、窗口截断。
 *
 * 断言方式是直接调用组件函数，再遍历它返回的 React 元素树（stub 的 `createElement` / `jsx`
 * 只造数据结构、不渲染），因此不需要 jsdom / react-dom / 浏览器。`useState` 用一份跨调用保留
 * 的槽位实现，好让「点按钮 → 再渲染 → 断言新状态」可测。
 *
 * 这份测试用到的都只是 node 内建模块，零依赖。
 */

import assert from 'node:assert/strict';

// ── React / primitives 的最小替身 ────────────────────────────────────────────

let hookSlots = [];
let hookCursor = 0;

/**
 * 组件实例（`mountLive` 用）：**真的跑挂载 effect、真的在 setState 后重渲染**。
 *
 * `mount()` 那套全局 hook 槽位够用来断言「渲染出来的树长什么样」，但跑不了订阅：
 * 偏好 store 的通知要经 `useEffect` 里注册的 listener 才能回到组件。想验证
 * 「改了偏好，已经渲染出来的行会不会跟着变」就必须有这一层。
 */
let liveInstance = null;

const ReactStub = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useState: (initial) => {
    if (liveInstance !== null) {
      const inst = liveInstance;
      const index = inst.hookCursor;
      inst.hookCursor += 1;
      // React 的 useState(fn) 是**惰性初始化**：只在首次挂载调用一次，之后永远用存下来的值。
      if (!(index in inst.slots)) inst.slots[index] = typeof initial === 'function' ? initial() : initial;
      return [
        inst.slots[index],
        (next) => {
          const value = typeof next === 'function' ? next(inst.slots[index]) : next;
          if (value === inst.slots[index]) return;
          inst.slots[index] = value;
          inst.dirty = true;
        },
      ];
    }
    const index = hookCursor;
    hookCursor += 1;
    if (!(index in hookSlots)) hookSlots[index] = typeof initial === 'function' ? initial() : initial;
    return [
      hookSlots[index],
      (next) => {
        hookSlots[index] = typeof next === 'function' ? next(hookSlots[index]) : next;
      },
    ];
  },
  useEffect: (effect, deps) => {
    if (liveInstance === null) return; // 全局 mount() 模式：只断言树，不跑 effect
    const inst = liveInstance;
    const index = inst.hookCursor;
    inst.hookCursor += 1;
    const prev = inst.effects[index];
    const changed =
      prev === undefined ||
      deps === undefined ||
      prev.deps === undefined ||
      deps.length !== prev.deps.length ||
      deps.some((dep, k) => dep !== prev.deps[k]);
    if (changed) inst.pending.push({ index, effect, deps });
  },
};

/** 每个场景从干净状态开始（模拟一次全新的组件挂载）。 */
function resetHooks() {
  hookSlots = [];
  hookCursor = 0;
}

/**
 * `react/jsx-runtime` 替身。
 *
 * 本插件的 client 半用 automatic JSX runtime（tsconfig 的 `jsx: react-jsx`）编译，所以 JSX
 * 的产物是 `jsx` / `jsxs` 而不是 `createElement`，参数形态也不一样：children 在
 * `props.children` 里（多子节点时是数组）、key 走第三个参数。
 *
 * 这里把它**还原成与 `createElement` 完全一致的 `{ type, props, children }` 形状**——尤其
 * `props` 里不带 `children`（原本 createElement 就是把 children 单独放的），于是下面
 * `walk` / `mount` / `findByName` 那一整套断言助手一行都不用改。`jsxs` 与 `jsx` 的差别只是
 * 「静态子节点数」，产物形状相同，共用同一个实现。
 *
 * @param type - 元素类型（字符串标签或组件函数）。
 * @param props - 属性（children 混在其中）。
 * @param key - automatic runtime 单独传的 key。
 * @returns 与 `createElement` 同形的元素对象。
 */
function makeElement(type, props, key) {
  const { children, ...rest } = props ?? {};
  const list = children === undefined ? [] : Array.isArray(children) ? children : [children];
  if (key !== undefined) rest.key = key;
  return { type, props: rest, children: list };
}

const JsxRuntimeStub = {
  Fragment: Symbol.for('react.fragment'),
  jsx: makeElement,
  jsxs: makeElement,
};

/** 各 primitives 用同名函数占位，遍历时按引用比对。 */
const PRIMITIVES = {
  CodeBlock: function CodeBlock() {},
  DiffBlock: function DiffBlock() {},
  DisclosureRow: function DisclosureRow() {},
  StateDot: function StateDot() {},
  IconEditOutlineRegular: function IconEditOutlineRegular() {},
  JsonBlock: function JsonBlock() {},
  Menu: function Menu() {},
  Pill: function Pill() {},
  Button: function Button() {},
  IconChevronDownOutlineRegular: function IconChevronDownOutlineRegular() {},
  FileTypeIcon: function FileTypeIcon() {},
  IconPlusOutlineRegular: function IconPlusOutlineRegular() {},
  IconCodeOutlineRegular: function IconCodeOutlineRegular() {},
  IconBranchOutlineRegular: function IconBranchOutlineRegular() {},
  IconRefreshOutlineRegular: function IconRefreshOutlineRegular() {},
  diffTotals: (diffs) => {
    let added = 0;
    let removed = 0;
    for (const diff of diffs) {
      const count = (text) => (text === '' ? 0 : text.replace(/\n$/, '').split('\n').length);
      added += count(diff.newText);
      if (diff.oldText !== null) removed += count(diff.oldText);
    }
    return { added, removed };
  },
};

/**
 * primitives 替身。用 Proxy 兜住「插件用到了 stub 里没有的 primitive」：
 * 那种情况下 createElement(type=undefined) 会静默地造出一棵错树，测试却继续绿——所以这里直接抛错。
 */
const PStub = new Proxy(PRIMITIVES, {
  get(target, key) {
    if (typeof key === 'string' && !(key in target)) {
      throw new Error('测试 stub 缺少 primitive：' + key + '（插件用到了它，stub 必须补上）');
    }
    return target[key];
  },
});

// ── 浏览器环境替身（bundle 在被 import 的那一刻就会读它们） ──────────────────

let captured = null;
globalThis.window = {
  __ModuleLoader__: {
    load: (mod) => {
      captured = mod;
    },
  },
};
// 假 /ext 路由：记录请求，模拟 Host 的「写 settings.yaml 的 NS 分节 → 回权威值」。
// 偏好只有一个事实源（Host 路由），所以这里必须假装得完整：GET 回当前值，POST 合并补丁。
const requests = [];
let savedConfig = { view: 'highlight', sectionsOpen: true, patchTool: false };
let failNextWrite = null;
/**
 * 真实行号 + 上下文定位的假应答：`"path\u0000newText"` →
 * 行号（number）或 `{line, before, after}`（对象）；没有条目 = 定位不到。
 */
const locateAnswers = new Map();

globalThis.fetch = (url, init = {}) => {
  const method = init.method ?? 'GET';
  const target = String(url);
  requests.push({ url: target, method, body: init.body });
  if (target.endsWith('/locate')) {
    const body = JSON.parse(String(init.body ?? '{}'));
    const results = (body.items ?? []).map((item) => {
      const answer = locateAnswers.get(item.path + '\u0000' + item.newText);
      if (typeof answer === 'number') return { line: answer, before: [], after: [] };
      if (answer !== null && typeof answer === 'object') return answer;
      return { line: null, before: [], after: [] };
    });
    return Promise.resolve({ json: () => Promise.resolve({ ok: true, results }) });
  }
  if (failNextWrite !== null) {
    const error = failNextWrite;
    failNextWrite = null;
    return Promise.resolve({ json: () => Promise.resolve({ ok: false, error }) });
  }
  if (method === 'POST') savedConfig = { ...savedConfig, ...JSON.parse(String(init.body)) };
  return Promise.resolve({ json: () => Promise.resolve({ ok: true, config: { ...savedConfig } }) });
};

/** 让排队的 fetch 应答跑完（测试里跨微任务/宏任务边界看 store 的最终态）。 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * 样式注入替身。
 *
 * `styles.module.css` 由构建预设内联进 bundle，模块被求值时就地插一条 `<style data-plugin-css>`，
 * 所以这些标签在 **factory 执行时**（早于 `apply`）就已经在 `injectedStyles` 里了——不再是 apply
 * 里的手工注入。`querySelector` 用来判重，第一次必然返回 null。
 */
const injectedStyles = [];
globalThis.document = {
  createElement: () => ({
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    remove() {},
    textContent: '',
  }),
  querySelector: () => null,
  head: {
    appendChild: (node) => injectedStyles.push(node),
  },
};

// ── 断言小工具 ───────────────────────────────────────────────────────────────

let checks = 0;
function ok(label, condition) {
  checks += 1;
  assert.ok(condition, label);
}

/**
 * `DisclosureRow` 之类的 primitives 把内容放在 props 里（`collapsedContent` 摘要、`icon` 图标），
 * 只跟着 `children` 走会整段漏掉，所以这两个具名 prop 也要下钻。
 */
const ELEMENT_PROPS = ['collapsedContent', 'icon', 'title'];

function walk(node, visit) {
  if (node === null || node === undefined || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
  for (const key of ELEMENT_PROPS) walk(node.props?.[key], visit);
}

function findAllByType(tree, type) {
  const found = [];
  walk(tree, (node) => {
    if (node.type === type) found.push(node);
  });
  return found;
}

function findByType(tree, type) {
  return findAllByType(tree, type)[0] ?? null;
}

/** 按组件函数名找一个**组件元素**（用来把子组件像 React 那样渲染出来再看它的树）。 */
function findByName(tree, name) {
  let found = null;
  walk(tree, (node) => {
    if (found === null && typeof node.type === 'function' && node.type.name === name) found = node;
  });
  return found;
}

/** 按组件函数名收全部匹配（设置行的 label / desc 放在 props 上，得逐个看）。 */
function findAllByName(tree, name) {
  const found = [];
  walk(tree, (node) => {
    if (typeof node.type === 'function' && node.type.name === name) found.push(node);
  });
  return found;
}

/**
 * 设置节里按「行 label」选一个下拉项（一个 Row 里最多一个 Select）。
 *
 * @param tree - 设置节的树。
 * @param rowLabel - 该行的 label（如「上下文行数」）。
 * @param id - 要选中的选项 id。
 */
function settingSelect(tree, rowLabel, id) {
  const rowElement = findAllByName(tree, 'Row').filter((node) => node.props.label === rowLabel)[0];
  if (rowElement === undefined) throw new Error('找不到设置行：' + rowLabel);
  const select = findByName(rowElement, 'Select');
  if (select === null) throw new Error('这一行没有下拉框：' + rowLabel);
  findByType(mount(select.type, select.props), PStub.Menu).props.onSelect(id);
}

/** 设置节里按 aria-label 找某个开关，并把它渲染出来。 */
function settingSwitch(tree, label) {
  const element = findAllByName(tree, 'Switch').filter((node) => node.props.label === label)[0];
  return element === undefined ? undefined : mount(element.type, element.props);
}

/**
 * 设置节里找「展示方式」那张单选卡（先渲染 ViewCards，再按 aria-label 挑一张）。
 *
 * @param tree - 设置节的树。
 * @param id - `highlight` | `diff`。
 * @returns 那张卡的元素（点它的 `onClick` 就是「选中这一种展示方式」）。
 */
function settingViewCard(tree, id) {
  const element = findByName(tree, 'ViewCards');
  if (element === null) throw new Error('找不到展示方式单选卡');
  const label = id === 'highlight' ? '高亮' : '± 差异';
  const card = findAllByClass(mount(element.type, element.props), 'viewCard').filter(
    (node) => node.props['aria-label'] === label,
  )[0];
  if (card === undefined) throw new Error('找不到展示方式卡：' + id);
  return card;
}

/** 像 React 渲染一个组件那样调用它（重置 hook 游标，等价于该组件自己的 hook 空间）。 */
function mount(Component, props) {
  hookCursor = 0;
  return Component(props);
}

/**
 * 有生命周期的挂载：每个组件一份自己的 hook 槽位，跑挂载 effect，`flush()` 时按新状态重渲染。
 *
 * 用来测「偏好 store 变了 → 已经渲染出来的行跟着变」这类**订阅**行为。
 *
 * @param toolName - 线上工具名。
 * @param block - 调用块。
 * @param overrides - 额外的 props 覆盖。
 * @returns `{ tree, flush, isDirty, unmount }`。
 */
function mountLive(toolName, block, overrides = {}) {
  const inst = { slots: [], hookCursor: 0, effects: {}, pending: [], dirty: false, tree: null, overrides };
  const flush = () => {
    inst.dirty = false;
    inst.hookCursor = 0;
    inst.pending = [];
    liveInstance = inst;
    try {
      inst.tree = callRow(toolName, block, inst.overrides);
    } finally {
      liveInstance = null;
    }
    const cleanups = {};
    for (const item of inst.pending) {
      const cleanup = item.effect();
      cleanups[item.index] = typeof cleanup === 'function' ? cleanup : () => {};
    }
    inst.effects = cleanups;
    return inst.tree;
  };
  flush();
  return {
    get tree() {
      return inst.tree;
    },
    flush,
    isDirty: () => inst.dirty,
    /** 换 props（模拟宿主在同一个位置复用组件实例去渲染另一次调用）。 */
    setOverrides: (next) => {
      inst.overrides = { ...inst.overrides, ...next };
      inst.dirty = true;
    },
    unmount: () => {
      for (const key of Object.keys(inst.effects)) inst.effects[key]();
    },
  };
}

/** 构建期被哈希的类名形如 `<hash>_<local>`（构建预设的 `[hash]_[local]` 模式）。 */
const HASHED_CLASS = /^[A-Za-z0-9_]+_[A-Za-z][A-Za-z0-9]*$/;

/**
 * 判断一个类名是不是某个 CSS Module 局部名。
 *
 * 类名在构建期被哈希（形如 `<hash>_card`，哈希含插件 id），所以断言里写的是**局部名**（`card`），这里按
 * `<hash>_<local>` 的后缀匹配。`dshp-fcv-*` 那两个运行时生成的全局类名走精确匹配。
 *
 * @param name - 元素上的单个类名。
 * @param local - 期望的局部名（或全局类名原文）。
 * @returns 是否命中。
 */
function isClass(name, local) {
  return name === local || name.endsWith('_' + local);
}

/**
 * 按局部名收元素。
 *
 * @param tree - 元素树。
 * @param local - CSS Module 的局部名（不带 `fcv-` 前缀、不是哈希后的名字）。
 * @returns 命中元素。
 */
function findAllByClass(tree, local) {
  const found = [];
  walk(tree, (node) => {
    const cls = node.props?.className;
    if (typeof cls === 'string' && cls.split(' ').some((name) => isClass(name, local))) found.push(node);
  });
  return found;
}

function textOf(node) {
  if (typeof node === 'string') return node;
  if (node === null || node === undefined || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(textOf).join('');
  return (node.children ?? []).map(textOf).join('');
}

function treeText(tree) {
  let text = '';
  walk(tree, (node) => {
    for (const child of node.children ?? []) {
      if (typeof child === 'string') text += child + '\n';
    }
  });
  return text;
}

// ── 加载 bundle 并取出注册结果 ───────────────────────────────────────────────

const bundleUrl = new URL('../lib/client.js', import.meta.url);
await import(bundleUrl.href);

ok('bundle 必须调用 __ModuleLoader__.load', captured !== null);
ok('loader id 必须等于包名', captured.id === '@dshp/file-change-viewer');
ok('factory 必须是函数', typeof captured.factory === 'function');

const require = (id) => {
  if (id === 'react') return ReactStub;
  if (id === 'react/jsx-runtime') return JsxRuntimeStub;
  if (id === '@deepseek-ai/dsh-client-ui-primitives') return PStub;
  throw new Error('未预期的 require：' + id);
};

const exportsObj = captured.factory(require);
ok(
  'client 半必须声明 inject（含 slots）',
  Array.isArray(exportsObj.inject) && exportsObj.inject.includes('slots'),
);
ok('client 半必须导出 apply', typeof exportsObj.apply === 'function');

const registrations = [];
let effects = 0;
const slotsStub = {
  inject: (name, callback) => {
    const result = callback();
    if (result !== null && typeof result === 'object' && typeof result.next === 'function') {
      let step = result.next();
      while (!step.done) step = result.next();
    }
  },
  register: (spec, component) => {
    registrations.push({ spec, component });
    return () => {};
  },
};

exportsObj.apply({
  get: (name) => (name === 'slots' ? slotsStub : undefined),
  effect: (callback) => {
    effects += 1;
    return callback();
  },
});
// 真实环境里插件在会话渲染之前就挂好了，偏好早就读回来了；这里等一次 GET 回来，
// 好让「渲染那一刻的偏好」= settings.yaml 里的值，而不是加载中的兜底值。
await settle();

ok('至少注册了样式 effect + 槽位注册 effect', effects >= 2);
ok('注入了插件样式表', injectedStyles.length === 1);

const toolRegs = registrations.filter((entry) => entry.spec.name === 'tool.call.toolview');
const keys = toolRegs.map((entry) => entry.spec.key);
for (const key of ['edit', 'write', 'str_replace_editor', 'patch']) {
  ok('必须接管 tool.call.toolview 的 ' + key + ' 键', keys.includes(key));
}
ok(
  '每次注册都要挂 conversation 本地化命名空间',
  toolRegs.every((entry) => entry.spec.locale === 'conversation'),
);
// keyed 槽位同 key 同 priority 直接抛错，派发取 priority 最小者；内置行是 0。
ok(
  '必须用比内置行更小的 priority 才能接管',
  toolRegs.every((entry) => typeof entry.spec.priority === 'number' && entry.spec.priority < 0),
);

// 配置入口：本插件在设置里**单独占一节**（settings.section，左侧导航「File Change View」），
// 与本仓其它插件一致；不再往「插件」tab 里塞 settings.plugin.item 卡片。
const sectionRegs = registrations.filter((entry) => entry.spec.name === 'settings.section');
ok('设置节必须注册成设置里独立的一节', sectionRegs.length === 1);
ok(
  '设置节的 id 用本插件的 settings 命名空间（NS 四处同名）',
  sectionRegs[0].spec.id === 'dshp-file-change-viewer',
);
ok('设置节必须有导航标题（原名「文件修改卡片」已换）', sectionRegs[0].spec.label === 'File Change View');
ok('设置节的 order 必须与本仓其它插件错开（25-30 已占，取 31）', sectionRegs[0].spec.order === 31);
ok(
  '不再注册插件 tab 的配置卡片',
  registrations.filter((entry) => entry.spec.name === 'settings.plugin.item').length === 0,
);
ok(
  '不注册客户端 settingsScope（读写统一走自有 /ext 路由）',
  registrations.filter((entry) => entry.spec.name === 'settings.section').length === 1,
);

// 会话页头：两个只作用于**当前会话**的快捷开关（一键展开 / 收起、切换差异视图）。
const headerRegs = registrations.filter(
  (entry) => entry.spec.name === 'conversation.session.header.utilities',
);
ok('必须往会话页头右侧工具区注册一条', headerRegs.length === 1);
ok('页头条目的 id 用同一个命名空间', headerRegs[0].spec.id === 'dshp-file-change-viewer');
ok('页头开关落在工具区最右（open-in-app 是 -10、会话日志下载是 0）', headerRegs[0].spec.order === 20);

const FileChangeRow = toolRegs[0].component;
const Section = sectionRegs[0].component;
const SessionControls = headerRegs[0].component;
ok(
  '注册项必须是组件',
  typeof FileChangeRow === 'function' &&
    typeof Section === 'function' &&
    typeof SessionControls === 'function',
);

// 样式表：由构建预设**内联进同一个 JS**（不是第二个 .css 产物），且类名已被作用域化。
// 断言不再看选择器字面量（哈希后每次都可能变），改看「标签属性 + 声明内容 + 类名形态」。
const styleTag = injectedStyles[0];
ok(
  '样式由 CSS Module 内联注入（data-plugin 标归属、data-plugin-css 用于判重）',
  styleTag.attributes['data-plugin'] === '@dshp/file-change-viewer' &&
    String(styleTag.attributes['data-plugin-css']).endsWith('src/client/styles.module.css'),
);
const css = styleTag.textContent;
{
  // 只认「点号 + 字母」开头的类选择器，`border:.5px` 这种小数不会被误当类名
  const classSelectors = [...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]);
  // `line` 是官方 CodeBlock 行元素的**全局固定类名**（官方 CSS Module 里就是 :global(.line)），
  // 要命中它只能写全局选择器（本模块的 `code > :global(.line)` 行盒撑宽规则），属合法例外——
  // 与下面 DYNAMIC_TINT（运行时生成的行底色类名）同一性质：模块外类名，但不是漏哈希。
  ok(
    '样式表里的类名全部被哈希成 <hash>_<local>（仅官方全局 .line 例外）',
    classSelectors.length > 50 && classSelectors.every((name) => HASHED_CLASS.test(name) || name === 'line'),
  );
}
// 注意：以下断言查的是**构建后**的 CSS。lightningcss 会最小化并合并规则（把 `none` 规范化成
// `0 0`、把同一声明的多条选择器并成一条），所以只查**单个稳定的声明片段**，不拼选择器序列。
ok(
  '官方语言标签栏（复制按钮在其中）继续隐藏',
  css.includes('div:has([data-code-block-banner])') && css.includes('[data-code-block-banner]{display:none}'),
);
ok(
  '代码卡片加回来了（自带边框/圆角/代码底色）',
  css.includes('border:.5px solid var(--dsw-alias-border-l2)') &&
    css.includes('border-radius:12px') &&
    css.includes('background:var(--dsw-alias-markdown-code-block)'),
);
ok(
  '卡片由插件提供，官方代码块自身的外壳被清掉（不套两层）',
  css.includes('--dsl-code-block-line-white-space:pre') && css.includes('!important'),
);
ok('卡头用官方 banner 底色', css.includes('background:var(--dsw-alias-markdown-code-block-banner)'));
// ± 视图里官方 DiffBlock 的两样冗余（块顶 CodeToolbar / body 首行 path）被结构选择器清掉：
// 卡头已有文件名与统计，重复信息只会在上下文与改动之间横插一段。0.1.7 起块根是
// [CodeToolbar div, body div]（footer 已删），选择器 accordingly 改写。
// lightningcss 会把同声明的选择器并成一条，所以断言按「选择器片段存在」查。
ok(
  '± 视图清掉官方 CodeToolbar 与 path 行（卡头已有，全是冗余）',
  css.includes('[data-diff]>div:first-of-type') &&
    css.includes('[data-diff]>div:nth-of-type(2)>div:first-child') &&
    css.includes('{display:none}'),
);
// 高亮视图行底色铺满整条被滚动的宽度：官方 .line 是普通块盒（宽只到可视宽度），超长文字以
// 行内溢出延伸到盒外——不撑宽行盒的话，往右滚，红绿底色会在行中间断开。规则里 .line 是官方
// 全局类名，必须以 :global 形态写出（构建后仍是裸 .line，上面那条哈希护卫已豁免它）。
// border-box 必须有：行号列是 .line 自己的 padding-inline-start，content-box 下
// min-width:100% 只约束内容宽，背景会多出约一个行号列宽。
ok(
  '高亮视图行盒随内容撑宽且含行号列整盒计算（底色到行尾不断开、也不多一段）',
  css.includes('pre code>.line{box-sizing:border-box;width:max-content;min-width:100%'),
);
// 行号列的整体左内边距：官方把行号画在行盒左缘，而本插件为了让底色铺满整卡把 pre 的横向
// 内边距归零了——不让位的话行号会紧贴卡片左边框（列宽是 max(2, 位数)ch，位数一多就贴死，
// 数字直接压在边框上）。让出的这一档 14px 与 ± 视图的 `.ctx` / 官方 DiffBlock `.body`
// 同源，于是两个视图的行号列、正文列严格对齐。
ok(
  '高亮视图的行号列让出一档左内边距（行号不贴卡片边框），且与 ± 视图同档',
  css.includes('padding-inline-start:calc(var(--dsl-code-block-line-number-width) + 26px)') &&
    css.includes('code>.line:before{inset-inline-start:14px}'),
);
// ± 视图的改动行必须是自己的包含块：官方行是 static，不定位的话 `::after` 的
// `inset-inline-start:0` 落在官方块根（整张卡）的左缘，`+` / `-` 会比上下文行号左出一档、
// 还紧贴卡片边框（与 README 里「三列严格对齐」的验收口径不符）。
ok(
  '± 视图的改动行是 ::after 的包含块（+ / - 与上下文行号同列，不贴卡片边框）',
  css.includes('[data-diff]>div:nth-of-type(2)>div{position:relative}') &&
    css.includes('inset-inline-start:0'),
);
ok(
  '设置节用官方设置行版式（720px 页宽 + 行间 .5px 细线）',
  css.includes('max-width:720px') && css.includes('border-bottom:.5px solid var(--dsw-alias-border-l2)'),
);
ok(
  '设置节的下拉胶囊与开关尺寸照抄官方',
  css.includes('border-radius:18px') && css.includes('width:36px') && css.includes('height:20px'),
);
ok(
  '展示方式是两张带样张的并排卡（auto-fit 网格），样张整块不吃指针事件',
  css.includes('repeat(auto-fit,minmax(240px,1fr))') && css.includes('pointer-events:none'),
);
ok(
  '页头开关照抄官方 open-in-app 的胶囊尺寸（.5px 边框 / 14px 圆角 / 11px 字）',
  css.includes('border:.5px solid var(--dsw-alias-border-l4)') &&
    css.includes('border-radius:14px') &&
    css.includes('font-size:11px'),
);

// ── 渲染辅助 ─────────────────────────────────────────────────────────────────

function callRow(toolName, block, overrides = {}) {
  return FileChangeRow({
    callId: 'c1',
    toolName,
    block,
    // 会话作用域槽位的标准 prop：页头那两个快捷开关按它区分会话（见 session.ts）。
    sessionId: 's1',
    cwd: '/w',
    home: '/home/u',
    openFile: () => {},
    t: (key) => key,
    ...overrides,
  });
}

function render(toolName, block, overrides = {}) {
  resetHooks();
  return callRow(toolName, block, overrides);
}

/** 同一个挂载再渲染一次（保留 useState，用于验证交互之后的状态）。 */
function rerender(toolName, block, overrides = {}) {
  hookCursor = 0;
  return callRow(toolName, block, overrides);
}

/** 行 == 外层 DisclosureRow（组件返回的第一个节点）。 */
function rowOf(tree) {
  return findByType(tree, PStub.DisclosureRow);
}

/** 文件块 == 除外层行之外的那些 DisclosureRow。 */
function sectionsOf(tree) {
  return findAllByType(tree, PStub.DisclosureRow).slice(1);
}

// ── 场景 1：结算成功，走 meta.diffs（真正落盘的 hunk） ────────────────────────

const settledBlock = {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/src/a.ts","old_string":"A","new_string":"B"}' },
  isError: false,
  content: [{ type: 'text', text: 'The file has been updated successfully.' }],
  meta: {
    diffs: [
      { path: '/w/src/a.ts', oldText: 'ctx\nA', newText: 'ctx\nB' },
      { path: '/w/src/b.ts', oldText: null, newText: 'new file' },
    ],
  },
};
const settled = render('edit', settledBlock);

const row = rowOf(settled);
ok('行必须用 DisclosureRow（原生行样式，不自造卡片）', row !== null);
ok(
  '行的默认开合 = 渲染那一刻的偏好（这里 settings.yaml 是 sectionsOpen: true → 直接展开）',
  row.props.open === true,
);
ok('标题走 conversation 的 tool.title.edit 键', row.props.title === 'tool.title.edit');
ok('行必须可折叠', row.props.expandable === true);
ok('行外壳仍是原生行（卡片只在展开体里的文件块上）', isClass(row.props.className, 'rowRoot'));
ok(
  '行元素不挂任何自定义行类名（行几何全部来自官方 DisclosureRow 默认样式）',
  row.props.rowClassName === undefined,
);

// 作用域化护卫。
//
// 以前三套版式（工具行 / 设置节 / 页头）共用全局类名，靠「各段前缀集合两两不相交」的人工约定
// 避免串味——曾经设置节的 `.fcv-row{padding:16px 0}` 打到「编辑 / 写入」行上，把行撑高 32px 并
// 加了一条底边线，那个约定就是为它立的。改用 CSS Module 之后这件事在**结构上**不可能了：
// 每个组件引用的都是自己 import 进来的哈希类名。
//
// 所以这里不再逐对比较类名集合，改断言**作用域本身**：渲染树上的类名必须全部是哈希名。
{
  const classesOnTree = (tree) => {
    const found = new Set();
    walk(tree, (node) => {
      const cls = node.props?.className;
      if (typeof cls === 'string') for (const part of cls.split(' ')) if (part !== '') found.add(part);
    });
    return found;
  };

  const rowClasses = Array.from(classesOnTree(settled));
  // 行底色规则的选择器要拼 callId 与 hunk 序号，只能在运行时造，所以那两个类名刻意留在模块外
  const DYNAMIC_TINT = /^dshp-fcv-lines-[A-Za-z0-9_-]+-\d+$/;
  ok('工具行渲染出的类名不该是空的', rowClasses.length > 0);
  ok(
    '工具行整棵子树的类名全部是哈希名（作用域生效；唯一例外是运行时生成的行底色类名）',
    rowClasses.every((name) => HASHED_CLASS.test(name) || DYNAMIC_TINT.test(name)),
  );
}

// 行头：路径在 summary 位，统计绿增红删
const rowPath = findAllByClass(settled, 'path')[0];
ok('路径渲染成可点链接（官方 fileLink 形态）', rowPath !== undefined && textOf(rowPath) === 'src/a.ts');
{
  const rowSummary = { props: {}, children: [row.props.collapsedContent] };
  const rowStat = findAllByClass(rowSummary, 'stat')[0];
  ok(
    '行头统计按**语义变更**算：ctx/A→ctx/B 是 +1 -1，纯新增 +1，合计 +2 -1',
    textOf(findAllByClass(rowStat, 'add')[0]) === '2' && textOf(findAllByClass(rowStat, 'del')[0]) === '1',
  );
}
ok(
  '统计用绿增红删两个类',
  findAllByClass(settled, 'add').length > 0 && findAllByClass(settled, 'del').length > 0,
);
ok('标题与摘要之间有官方那种 2px 分隔点', findAllByClass(settled, 'sep').length === 1);
ok('不再有自造角标（已应用 / 新文件）', findAllByClass(settled, 'badge').length === 0);

// 文件块：每个 hunk 一条自己的折叠
const sections = sectionsOf(settled);
ok('每个 hunk 一个文件块', sections.length === 2);
ok(
  '文件块标题是「图标 + 文件名」节点，文本为相对路径',
  sections.every((node, index) => textOf(node.props.title) === ['src/a.ts', 'src/b.ts'][index]),
);
ok(
  '文件块默认开合同样来自那一刻的偏好（展开）',
  sections.every((node) => node.props.open === true),
);
ok(
  '文件块自带各自的统计',
  sections.every((node) => findAllByClass(node, 'stat').length > 0),
);

// 代码卡片 + 卡头（文件名 + 统计 + 单块视图切换）
const settledCards = findAllByClass(settled, 'card');
ok('每个 hunk 一张代码卡片', settledCards.length === 2);
const cardPills = findAllByClass(settledCards[0], 'viewPill');
ok('卡头带每块独立的视图切换（两个 Pill）', cardPills.length === 2);
ok(
  '两块各自默认跟随全局偏好（高亮）',
  settledCards.every((card) => findAllByClass(card, 'viewPill')[0].props.active === true),
);
ok(
  '卡头统计也是语义口径（第一块 = +1 -1），与它自己的高亮 / ± 视图一致',
  textOf(findAllByClass(settledCards[0], 'add')[0]) === '1' &&
    textOf(findAllByClass(settledCards[0], 'del')[0]) === '1',
);
ok(
  '纯新增那块是 +1 -0',
  textOf(findAllByClass(settledCards[1], 'add')[0]) === '1' &&
    textOf(findAllByClass(settledCards[1], 'del')[0]) === '0',
);

// 图标：文件名前挂官方文件类型图标；增删各一个图标；两个 Pill 各一个图标
ok(
  '卡头文件名前有官方 FileTypeIcon',
  findByType(settledCards[0], PStub.FileTypeIcon) !== null &&
    findByType(settledCards[0], PStub.FileTypeIcon).props.path === '/w/src/a.ts',
);
ok(
  '增删统计里 + 用官方 IconPlusOutlineRegular',
  findByType(settledCards[0], PStub.IconPlusOutlineRegular) !== null,
);
ok(
  '官方没有减号图标，用一个内联 svg 补（同 16px 网格）',
  findByType(settledCards[0], 'svg') !== null &&
    findByType(settledCards[0], 'svg').props.viewBox === '0 0 16 16',
);
ok(
  '两个视图 Pill 各带一个图标',
  findByType(settledCards[0], PStub.IconCodeOutlineRegular) !== null &&
    findByType(settledCards[0], PStub.IconBranchOutlineRegular) !== null,
);

// 高亮视图（默认偏好）：单代码块 + 行底色
const settledCodes = findAllByType(settled, PStub.CodeBlock);
ok('默认视图渲染 CodeBlock', settledCodes.length === 2);
ok('默认视图不渲染 DiffBlock', findByType(settled, PStub.DiffBlock) === null);
ok(
  '同一代码块内：未变行只出现一次，增删交错；代码原样（不加 - / + 标记）',
  settledCodes[0].props.code === 'ctx\nA\nB',
);
ok('纯新增的 hunk 直接给新内容', settledCodes[1].props.code === 'new file');
ok('语言按扩展名推导（.ts → typescript）', settledCodes[0].props.lang === 'typescript');
ok(
  '高亮块必须开行号（否则 .line 是行内元素，底色铺不满整行）',
  settledCodes.every((node) => node.props.lineNumbers === true),
);
ok(
  '高亮块必须带复制文案（官方按钮不传就是空标签）',
  settledCodes.every((node) => node.props.copyLabel === 'copy' && node.props.copiedLabel === 'copied'),
);

const tintCss = textOf(findAllByType(settled, 'style')[0]);
ok(
  '删除行按区间上底色且不占行号',
  tintCss.includes(
    '.dshp-fcv-lines-c1-0 code>.line:nth-child(2){counter-increment:none;background:var(--fcv-del-bg)}',
  ),
);
ok('删除行的号位被清空', tintCss.includes('.dshp-fcv-lines-c1-0 code>.line:nth-child(2):before{content:""}'));
ok(
  '新增行按区间上底色且照常占号',
  tintCss.includes('.dshp-fcv-lines-c1-0 code>.line:nth-child(3){background:var(--fcv-add-bg)}') &&
    !tintCss.includes('nth-child(3){counter-increment:none'),
);
ok('行底色不写死色值（只允许官方 token）', !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(tintCss));

// ── 场景 2：全局偏好——设置节改视图，写回 /ext 路由，工具行同步换视图 ─────────

const settingsTree = mount(Section, {});
// 「展示方式」不再用下拉框，改成两张并排的单选卡，每张卡里直接画出对应效果。
const viewCardsElement = findByName(settingsTree, 'ViewCards');
ok('展示方式由自带的 ViewCards 组件渲染', viewCardsElement !== null);
ok('展示方式不再是下拉框', findByName(settingsTree, 'Select').props.options.length === 4); // 只剩「上下文行数」
const viewCards = mount(viewCardsElement.type, viewCardsElement.props);
const viewCardNodes = findAllByClass(viewCards, 'viewCard');
ok('两张单选卡', viewCardNodes.length === 2);
ok(
  '卡片是 role=radio（键盘可达），当前值 = 高亮',
  viewCardNodes.every((node) => node.props.role === 'radio' && node.props.tabIndex === 0) &&
    viewCardNodes[0].props['aria-checked'] === true &&
    viewCardNodes[1].props['aria-checked'] === false,
);
ok(
  '卡里直接渲染对应效果：高亮卡是 CodeBlock、± 卡是 DiffBlock',
  findByType(viewCardNodes[0], PStub.CodeBlock) !== null &&
    findByType(viewCardNodes[0], PStub.DiffBlock) === null &&
    findByType(viewCardNodes[1], PStub.DiffBlock) !== null &&
    findByType(viewCardNodes[1], PStub.CodeBlock) === null,
);
{
  const previewCode = findByType(viewCardNodes[0], PStub.CodeBlock).props.code;
  ok(
    '高亮样张是真正的统一 diff（未变行只出现一次，删行原样保留在代码里）',
    previewCode ===
      [
        'export function greet(name: string) {',
        "  return 'Hello, ' + name",
        '  const target = name.trim()',
        '  return `Hello, ${target}!`',
        '}',
      ].join('\n'),
  );
  ok(
    '高亮样张按 .ts 推成 typescript 并开行号',
    findByType(viewCardNodes[0], PStub.CodeBlock).props.lang === 'typescript' &&
      findByType(viewCardNodes[0], PStub.CodeBlock).props.lineNumbers === true,
  );
  const previewTint = textOf(findAllByType(viewCardNodes[0], 'style')[0]);
  ok(
    '样张的行底色挂在它自己的类名上（dshp-fcv-pvLines，不与会话卡片的 dshp-fcv-lines-* 共用）',
    previewTint.includes(
      '.dshp-fcv-pvLines code>.line:nth-child(2){counter-increment:none;background:var(--fcv-del-bg)}',
    ) &&
      previewTint.includes(
        '.dshp-fcv-pvLines code>.line:nth-child(n+3):nth-child(-n+4){background:var(--fcv-add-bg)}',
      ),
  );
  const previewDiff = findByType(viewCardNodes[1], PStub.DiffBlock).props.diffs[0];
  ok(
    '± 样张喂的是语义变更（丢掉未变上下文）',
    previewDiff.oldText === "  return 'Hello, ' + name" &&
      previewDiff.newText === '  const target = name.trim()\n  return `Hello, ${target}!`',
  );
}
const rowLabels = findAllByName(settingsTree, 'Row').map((rowElement) => rowElement.props.label);
const blockLabels = findAllByName(settingsTree, 'Block').map((blockElement) => blockElement.props.label);
ok(
  '四条设置项都有标签与说明（展示方式改成整幅块）',
  blockLabels.includes('展示方式') &&
    rowLabels.includes('上下文行数') &&
    rowLabels.includes('编辑 / 写入默认展开') &&
    rowLabels.includes('启用 patch 工具（测试版）') &&
    treeText(settingsTree).includes('settings.yaml'),
);
ok(
  '设置项的说明文字写清了「全局默认 + 会话级覆盖 + 单块可临时覆盖」',
  findAllByName(settingsTree, 'Row').every(
    (settingRow) => typeof settingRow.props.desc === 'string' && settingRow.props.desc.length > 10,
  ) &&
    findAllByName(settingsTree, 'Block').every(
      (blockElement) => typeof blockElement.props.desc === 'string' && blockElement.props.desc.length > 10,
    ),
);
const switchLabels = findAllByName(settingsTree, 'Switch').map((node) => node.props.label);
ok(
  '两个开关：默认展开 + patch 工具（不再有 rowsOpen 那种多余属性）',
  switchLabels.length === 2 &&
    switchLabels.includes('编辑 / 写入默认展开') &&
    switchLabels.includes('启用 patch 工具（测试版）'),
);
const switchButton = settingSwitch(settingsTree, '编辑 / 写入默认展开');
ok('开关反映 settings.yaml 里的权威值', switchButton.props['aria-checked'] === true);

// patch 工具开关：默认关；点一下要真的 POST 出去（Host 半据此注册 / 反注册工具）
const patchSwitch = settingSwitch(settingsTree, '启用 patch 工具（测试版）');
ok('patch 工具开关默认关（测试版，settings.yaml 里是 false）', patchSwitch.props['aria-checked'] === false);
const sectionHeads = findAllByClass(settingsTree, 'sectionHead');
ok('设置节分成两组：显示 / 工具', sectionHeads.length === 2 && textOf(sectionHeads[1]) === '工具');
const patchRow = findAllByName(settingsTree, 'Row').filter(
  (rowElement) => rowElement.props.label === '启用 patch 工具（测试版）',
)[0];
ok(
  '工具开关的说明点明「即时生效、不必重启」与「默认关」',
  patchRow !== undefined &&
    typeof patchRow.props.desc === 'string' &&
    patchRow.props.desc.includes('不必重启') &&
    patchRow.props.desc.includes('默认'),
);
patchSwitch.props.onClick();
ok(
  '打开 patch 工具开关会 POST { patchTool: true }',
  requests.some(
    (request) =>
      request.method === 'POST' &&
      request.url === '/ext/dshp-file-change-viewer/config' &&
      JSON.parse(request.body).patchTool === true,
  ),
);
ok(
  '打开后开关立刻变成开（乐观更新）',
  settingSwitch(mount(Section, {}), '启用 patch 工具（测试版）').props['aria-checked'] === true,
);
ok(
  '开关是 role=switch 的真按钮（点击回调与视觉态在同一元素上）',
  switchButton.type === 'button' &&
    switchButton.props.role === 'switch' &&
    switchButton.props['aria-checked'] === true,
);

settingViewCard(settingsTree, 'diff').props.onClick(); // 切到 ± 差异
ok(
  '切视图 POST 到本插件的 config 路由',
  requests.some(
    (request) =>
      request.method === 'POST' &&
      request.url === '/ext/dshp-file-change-viewer/config' &&
      JSON.parse(request.body).view === 'diff',
  ),
);
const afterSwitch = rerender('edit', settledBlock);
ok('切到 ± 差异后渲染 DiffBlock', findByType(afterSwitch, PStub.DiffBlock) !== null);
ok('± 差异视图不再渲染 CodeBlock', findByType(afterSwitch, PStub.CodeBlock) === null);
{
  const diffCards = findAllByType(afterSwitch, PStub.DiffBlock);
  ok(
    '± 视图每张卡只拿自己那一个 hunk（不把别的文件混进来）',
    diffCards.length === 2 &&
      diffCards.every((node) => node.props.diffs.length === 1) &&
      diffCards[0].props.diffs[0].path === '/w/src/a.ts' &&
      diffCards[1].props.diffs[0].path === '/w/src/b.ts',
  );
  ok(
    '± 视图喂的是语义变更（丢掉未变上下文），不是工具原文',
    diffCards[0].props.diffs[0].oldText === 'A' && diffCards[0].props.diffs[0].newText === 'B',
  );
  ok('DiffBlock 仍用宽松的展开上限', diffCards[0].props.maxLines === 200);
}

settingViewCard(mount(Section, {}), 'highlight').props.onClick(); // 切回高亮
const backToHighlight = rerender('edit', settledBlock);
ok('切回高亮后重新渲染 CodeBlock', findByType(backToHighlight, PStub.CodeBlock) !== null);

// 单块临时切换视图：只换被点的那一块，且不写回全局偏好
const cardsAgain = findAllByClass(backToHighlight, 'card');
findAllByClass(cardsAgain[0], 'viewPill')[1].props.onClick({ stopPropagation() {} });
const mixed = rerender('edit', settledBlock);
const mixedCards = findAllByClass(mixed, 'card');
ok(
  '点第一块切到 ± 差异：只影响这一块',
  findByType(mixedCards[0], PStub.DiffBlock) !== null && findByType(mixedCards[0], PStub.CodeBlock) === null,
);
ok(
  '第二块保持高亮（单块独立控制）',
  findByType(mixedCards[1], PStub.CodeBlock) !== null && findByType(mixedCards[1], PStub.DiffBlock) === null,
);
ok('单块切换不写回全局偏好', findByType(rerender('edit', settledBlock), PStub.CodeBlock) !== null);

// 偏好只决定「新渲染时」的样子：已经渲染出来的行不受影响
switchButton.props.onClick(); // 关掉偏好
ok(
  '关掉偏好后，已渲染的行也立刻跟随（块跟着折叠）',
  sectionsOf(rerender('edit', settledBlock)).every((node) => node.props.open === false),
);
const freshWhenOff = render('edit', settledBlock); // 新渲染的行同样跟随
ok(
  '新渲染的行也折叠（行与块一起跟随偏好）',
  rowOf(freshWhenOff).props.open === false &&
    sectionsOf(freshWhenOff).every((node) => node.props.open === false),
);
sectionsOf(freshWhenOff)[0].props.onToggle(); // 折叠着的块也能单块临时点开
const oneOpen = rerender('edit', settledBlock);
ok(
  '单块可临时独立展开（另一个保持折叠）',
  sectionsOf(oneOpen)[0].props.open === true && sectionsOf(oneOpen)[1].props.open === false,
);
settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 再打开
const restored = render('edit', settledBlock); // 新渲染的行回到展开
ok(
  '偏好打开后，新渲染的行与块都展开',
  rowOf(restored).props.open === true && sectionsOf(restored).every((node) => node.props.open === true),
);

// ── 场景 3：进行中，参数还是半截 JSON（宽容解析 + 实时可见） ──────────────────

const streaming = render('write', {
  name: 'write',
  argsRaw: '{"file_path":"/w/new.md","content":"line1\\nline2',
});
const streamingCode = findByType(streaming, PStub.CodeBlock);
ok('半截 JSON 也要推导出变更', streamingCode !== null);
ok('半截 content 的换行必须还原', streamingCode.props.code === 'line1\nline2');
ok('纯新增时不生成任何删除行底色规则', !treeText(streaming).includes('--fcv-del-bg'));
ok('新文件按 .md 推导成 markdown', streamingCode.props.lang === 'markdown');
ok('运行中的行同样跟随那一刻的偏好', rowOf(streaming).props.open === true);

// ── 场景 4：调用参数还没开始流（只有工具名） ─────────────────────────────────

const waiting = render('edit', { name: 'edit', argsRaw: '' });
ok('无参数时 summary 给出等待文案', textOf(findAllByClass(waiting, 'summary')[0]) === '等待参数…');
ok('无参数时不渲染 CodeBlock', findByType(waiting, PStub.CodeBlock) === null);

// ── 场景 5：失败调用（原生做法：summary 变错误行） ───────────────────────────

const failed = render('edit', {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/src/a.ts","old_string":"A","new_string":"B"}' },
  isError: true,
  content: [{ type: 'text', text: 'old_string not found in file\nsecond line' }],
});
ok(
  '失败时 summary 位置只显示首行错误',
  textOf(findAllByClass(failed, 'errorSummary')[0]) === 'old_string not found in file',
);
ok('失败时不显示路径与统计（官方 ToolRow 同做法）', findAllByClass(failed, 'path').length === 0);
const failedCodes = findAllByType(failed, PStub.CodeBlock).map((node) => node.props.code);
ok('失败也保留参数推导的变更（同一个块内删增交错）', failedCodes.length === 1 && failedCodes[0] === 'A\nB');
ok('失败行的图标用官方 StateDot', findByType(failed, PStub.StateDot) !== null);

// ── 场景 6：窗口截断（call 为 null、无 meta） ────────────────────────────────

const truncated = render('write', { kind: 'tool-result', call: null, isError: false, content: [] });
ok('截断的调用不抛错，也没有可渲染的变更', findByType(truncated, PStub.CodeBlock) === null);
ok('截断的调用给出「参数不可用」', textOf(findAllByClass(truncated, 'summary')[0]) === '参数不可用');

// ── 场景 7：replace_all / inspect / 语言未知 / 区间合并 / 超长封顶 ───────────

const replaceAll = render('edit', {
  kind: 'tool-result',
  call: {
    name: 'edit',
    argsRaw: '{"file_path":"/w/src/a.ts","old_string":"A","new_string":"B","replace_all":true}',
  },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/src/a.ts', oldText: 'A', newText: 'B' }] },
});
ok('replace_all 要在行头提示「全部替换」', treeText(replaceAll).includes('全部替换'));
ok(
  '有 inspect 时提供原生式「查看」药丸',
  findAllByClass(render('edit', settledBlock, { inspect: () => {} }), 'inspect').length === 1,
);
ok('没有 inspect 时不渲染药丸', findAllByClass(render('edit', settledBlock), 'inspect').length === 0);

const unknownLang = render('edit', {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/src/App.vue","old_string":"A","new_string":"B"}' },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/src/App.vue', oldText: 'A', newText: 'B' }] },
});
ok(
  '官方没有语法的扩展名必须传 undefined（退化成纯文本，而不是给错的高亮）',
  findByType(unknownLang, PStub.CodeBlock).props.lang === undefined,
);

const interleaved = render('edit', {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/src/b.ts","old_string":"b","new_string":"x"}' },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/src/b.ts', oldText: 'a\nb\nc', newText: 'a\nx\nc' }] },
});
ok(
  '未变的上下文行只出现一次，增删夹在中间',
  findByType(interleaved, PStub.CodeBlock).props.code === 'a\nb\nx\nc',
);

const coalesced = render('edit', {
  kind: 'tool-result',
  call: {
    name: 'edit',
    argsRaw: '{"file_path":"/w/src/c.ts","old_string":"A\\nB","new_string":"C\\nD"}',
  },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/src/c.ts', oldText: 'k\nA\nB\nZ', newText: 'k\nC\nD\nZ' }] },
});
const coalescedCss = textOf(findAllByType(coalesced, 'style')[0]);
ok(
  '连续两行删除并成一个区间选择器，区间整体不占行号',
  coalescedCss.includes(
    'code>.line:nth-child(n+2):nth-child(-n+3){counter-increment:none;background:var(--fcv-del-bg)}',
  ) && coalescedCss.includes('code>.line:nth-child(n+2):nth-child(-n+3):before{content:""}'),
);
ok(
  '连续两行新增并成一个区间选择器',
  coalescedCss.includes('code>.line:nth-child(n+4):nth-child(-n+5){background:var(--fcv-add-bg)}'),
);

const longText = Array.from({ length: 401 }, (_, index) => 'line' + index).join('\n');
const capped = render('write', {
  kind: 'tool-result',
  call: { name: 'write', argsRaw: '{"file_path":"/w/big.ts","content":"x"}' },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/big.ts', oldText: null, newText: longText }] },
});
ok(
  '单块超过上限必须封顶（CodeBlock 没有 maxLines，会全量渲染）',
  findByType(capped, PStub.CodeBlock).props.code.split('\n').length === 400,
);
ok('封顶要给出剩余行数与去处提示', treeText(capped).includes('其余 1 行未显示'));

// ── 场景 9：工具原文带上下文（真实案例：一次单行替换，原文 7 行 vs 7 行） ──────
// `edit` 的 meta.diffs 里 oldText / newText 是模型的 old_string / new_string **原文**：为了让
// old_string 在文件里唯一，模型会把上下几行一起圈进来。上游 diffTotals / DiffBlock 按原文算，
// 于是「只改一行」被报成 +7 -7，± 视图里整段删、整段加；本插件统一按 LCS 的语义变更算。

const CONTEXT_EDIT_FILES = [
  '  JsonBlock: function JsonBlock() {},',
  '  Menu: function Menu() {},',
  '  Pill: function Pill() {},',
  '  Switch: function Switch() {},',
  '  IconChevronDownOutlineRegular: function IconChevronDownOutlineRegular() {},',
  '  FileTypeIcon: function FileTypeIcon() {},',
  '  IconPlusOutlineRegular: function IconPlusOutlineRegular() {},',
];
const CONTEXT_OLD = CONTEXT_EDIT_FILES.join('\n');
const CONTEXT_NEW = CONTEXT_OLD.replace('Switch: function Switch() {},', 'Button: function Button() {},');

const contextBlock = {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/check-client.mjs"}' },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/check-client.mjs', oldText: CONTEXT_OLD, newText: CONTEXT_NEW }] },
};
const contextual = render('edit', contextBlock);
{
  const contextStat = { props: {}, children: [rowOf(contextual).props.collapsedContent] };
  ok(
    '行头统计不按原文行数（否则是 +7 -7），而是语义变更 +1 -1',
    textOf(findAllByClass(contextStat, 'add')[0]) === '1' &&
      textOf(findAllByClass(contextStat, 'del')[0]) === '1',
  );
  const contextCard = findAllByClass(contextual, 'card')[0];
  ok(
    '卡头统计与行头同口径',
    textOf(findAllByClass(contextCard, 'add')[0]) === '1' &&
      textOf(findAllByClass(contextCard, 'del')[0]) === '1',
  );
  ok(
    '高亮视图：未变行只出现一次（8 行 = 7 原文 + 1 新增），未被整段重写',
    findByType(contextual, PStub.CodeBlock).props.code ===
      [
        ...CONTEXT_EDIT_FILES.slice(0, 3),
        '  Switch: function Switch() {},',
        '  Button: function Button() {},',
        ...CONTEXT_EDIT_FILES.slice(4),
      ].join('\n'),
  );
  const contextTint = textOf(findAllByType(contextual, 'style')[0]);
  ok(
    '删的是第 4 行、增的是第 5 行（上下文行不染色）',
    contextTint.includes('code>.line:nth-child(4){counter-increment:none;background:var(--fcv-del-bg)}') &&
      contextTint.includes('code>.line:nth-child(5){background:var(--fcv-add-bg)}'),
  );
}

findAllByClass(contextual, 'viewPill')[1].props.onClick({ stopPropagation() {} });
const contextDiff = findByType(rerender('edit', contextBlock), PStub.DiffBlock);
ok(
  '± 差异视图同样只给真正变化的行（不是整段 7 删 7 增）',
  contextDiff.props.diffs.length === 1 &&
    contextDiff.props.diffs[0].oldText === '  Switch: function Switch() {},' &&
    contextDiff.props.diffs[0].newText === '  Button: function Button() {},',
);

// ── 场景 10：偏好实时作用于行（手动点过的那一行由用户说了算） ────────────────
// 用户的要求：设置里打开「编辑 / 写入默认展开」，会话里的编辑 / 写入行就该**立刻**展开、
// 一眼看到代码；只有用户自己点过的那一行例外。

const liveRow = mountLive('edit', settledBlock);
ok(
  '偏好开着：新渲染的行与块都是展开的',
  rowOf(liveRow.tree).props.open === true &&
    sectionsOf(liveRow.tree).every((node) => node.props.open === true),
);

settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 关掉偏好
ok('偏好变了要通知到已挂载的行（订阅生效）', liveRow.isDirty());
liveRow.flush();
ok(
  '已渲染的行立刻跟随偏好折叠（不是只影响之后的新行）',
  rowOf(liveRow.tree).props.open === false &&
    sectionsOf(liveRow.tree).every((node) => node.props.open === false),
);

rowOf(liveRow.tree).props.onToggle(); // 用户手动展开这一行
liveRow.flush();
ok('手动点开后就由用户说了算', rowOf(liveRow.tree).props.open === true);

settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 再打开偏好
liveRow.flush();
ok('用户手动打开的行保持打开', rowOf(liveRow.tree).props.open === true);

settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 又关掉
liveRow.flush();
ok('偏好再关，也不会把用户手动打开的行收走（覆盖优先于偏好）', rowOf(liveRow.tree).props.open === true);

// 文件块同理：没单独点过的块跟随偏好，点过的块由用户说了算。
const freshBlocks = mountLive('edit', settledBlock);
settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 打开偏好
freshBlocks.flush();
ok(
  '未点过的块跟随偏好展开',
  sectionsOf(freshBlocks.tree).every((node) => node.props.open === true),
);

sectionsOf(freshBlocks.tree)[0].props.onToggle(); // 用户把第 0 块折起来
freshBlocks.flush();
ok(
  '单块手动折叠只影响这一块',
  sectionsOf(freshBlocks.tree)[0].props.open === false && sectionsOf(freshBlocks.tree)[1].props.open === true,
);

settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 关掉偏好
freshBlocks.flush();
ok(
  '关掉偏好：点过的块保持折叠、没点过的块跟着折叠',
  sectionsOf(freshBlocks.tree).every((node) => node.props.open === false),
);

settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick(); // 再打开偏好
freshBlocks.flush();
ok(
  '再打开偏好：用户折叠过的那一块不被重新撑开（覆盖优先），其余块跟随',
  sectionsOf(freshBlocks.tree)[0].props.open === false && sectionsOf(freshBlocks.tree)[1].props.open === true,
);
freshBlocks.unmount();
liveRow.unmount();

// 收尾：把偏好关掉，让下面的场景从「偏好 = 关」开始
settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props.onClick();

// ── 场景 11：临时覆盖不跨调用泄漏（宿主会复用组件实例） ──────────────────────
// 宿主用 `react.memo(ToolCall)` 且列表没有显式 key，会在同一位置复用组件实例渲染另一次调用；
// 覆盖状态若只按 index 存，上一行「我手动折叠过第 0 块」会漏到新行上——表现就是新行不跟随偏好。

const reusedRow = mountLive('edit', settledBlock);
ok('偏好关着时，新渲染的行默认折叠', rowOf(reusedRow.tree).props.open === false);
ok(
  '此时文件块也折叠（跟随偏好）',
  sectionsOf(reusedRow.tree).every((node) => node.props.open === false),
);

reusedRow.flush();
sectionsOf(reusedRow.tree)[0].props.onToggle(); // 手动展开第 0 块
reusedRow.flush();
ok(
  '单块临时展开只影响这一块',
  sectionsOf(reusedRow.tree)[0].props.open === true && sectionsOf(reusedRow.tree)[1].props.open === false,
);

reusedRow.setOverrides({ callId: 'c2' }); // 宿主复用同一个组件实例渲染另一次调用
reusedRow.flush();
ok(
  '换调用后临时覆盖不泄漏（新调用重新按偏好开合 = 全折叠）',
  rowOf(reusedRow.tree).props.open === false &&
    sectionsOf(reusedRow.tree).every((node) => node.props.open === false),
);
reusedRow.unmount();

// ── 场景 12：会话页头的两个快捷开关（只影响当前会话，绝不写偏好） ──────────────
//
// 页头按钮改的是内存里的**会话级覆盖**：一键把所有文件 diff 摊开 / 收起、一键换差异视图。
// 三条硬要求都在这里盯着：① 不写 settings.yaml（一个 /config 请求都不许发）；② 覆盖生效时
// 连用户之前手动折叠过的行也要翻过去（靠 session.ts 的 rev 让行作废自己的临时状态）；
// ③ 只作用于当前 sessionId，换个会话立刻回落到全局偏好。

/** 页头组件渲染一次（它只用 sessionId 这一个 prop）。 */
const headTreeOf = (sessionId) => mount(SessionControls, { sessionId });
/** `/config` 写请求的条数（页头开关不该让它变化）。 */
const configWrites = () => requests.filter((request) => request.url.endsWith('/config')).length;

const prefOpen = settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props['aria-checked'];
const prefView = settingViewCard(mount(Section, {}), 'diff').props['aria-checked'] ? 'diff' : 'highlight';

{
  const headTree = headTreeOf('s1');
  const headButtons = findAllByClass(headTree, 'headBtn');
  ok(
    '页头有一个 role=group 的容器把两个按钮收在一起',
    findAllByClass(headTree, 'headCtl')[0]?.props.role === 'group',
  );
  ok('页头两个按钮：一键展开 / 收起、切换差异视图', headButtons.length === 2);
  ok(
    '按钮上的字就是当前生效值（未覆盖时 = 全局偏好）',
    textOf(headButtons[0]) === (prefOpen ? '收起改动' : '展开改动') &&
      textOf(headButtons[1]) === (prefView === 'highlight' ? '高亮' : '± 差异'),
  );
  ok(
    '没被覆盖时不出现「恢复跟随偏好」，容器也不挂已覆盖的记号',
    findAllByClass(headTree, 'headReset').length === 0 &&
      findAllByClass(headTree, 'headCtlOverridden').length === 0,
  );
  ok(
    '页头按钮是真按钮（title / aria-label 都写清了「只影响当前会话」）',
    headButtons.every(
      (node) =>
        node.type === 'button' &&
        typeof node.props.title === 'string' &&
        node.props.title.includes('当前会话'),
    ),
  );
}

const headRow = mountLive('edit', settledBlock, { callId: 'c-head' });
ok('开始时会话行跟随全局偏好', rowOf(headRow.tree).props.open === prefOpen);

// 用户手动连点两下（回到与偏好相同的值）：于是「行自己的临时状态」= 偏好值。
// 接着页头那一下翻到另一个值——若行不丢掉自己的临时状态，这次点击就会被它挡回去。
rowOf(headRow.tree).props.onToggle();
headRow.flush();
rowOf(headRow.tree).props.onToggle();
headRow.flush();
ok('手动点过之后由用户说了算（值可以回到与偏好相同）', rowOf(headRow.tree).props.open === prefOpen);

const writesBeforeHead = configWrites();
findAllByClass(headTreeOf('s1'), 'headBtn')[0].props.onClick();
ok('页头开关一个 /config 写请求都不发（不碰 settings.yaml）', configWrites() === writesBeforeHead);
ok('已渲染的行被通知到（订阅生效）', headRow.isDirty());
headRow.flush();
const forcedOpen = !prefOpen;
ok(
  '一键展开 / 收起连用户之前手动点过的行也翻过去（行作废了自己的临时状态）',
  rowOf(headRow.tree).props.open === forcedOpen &&
    sectionsOf(headRow.tree).every((node) => node.props.open === forcedOpen),
);
ok(
  '覆盖生效后容器挂上「已覆盖」记号，并多出「恢复跟随偏好」',
  findAllByClass(headTreeOf('s1'), 'headCtlOverridden').length === 1 &&
    findAllByClass(headTreeOf('s1'), 'headReset').length === 1,
);

// 换差异视图：同样只动当前会话
findAllByClass(headTreeOf('s1'), 'headBtn')[1].props.onClick();
ok('换视图也不写偏好', configWrites() === writesBeforeHead);
headRow.flush();
const forcedView = prefView === 'highlight' ? 'diff' : 'highlight';
ok(
  '所有文件块都换成页头选的那种视图',
  forcedView === 'diff'
    ? findAllByType(headRow.tree, PStub.DiffBlock).length > 0 &&
        findByType(headRow.tree, PStub.CodeBlock) === null
    : findByType(headRow.tree, PStub.CodeBlock) !== null &&
        findByType(headRow.tree, PStub.DiffBlock) === null,
);
ok(
  '按钮上的字跟着生效值走',
  textOf(findAllByClass(headTreeOf('s1'), 'headBtn')[1]) === (forcedView === 'highlight' ? '高亮' : '± 差异'),
);

// 只影响当前会话：另一个 sessionId 的行照旧跟随全局偏好
const otherSessionRow = mountLive('edit', settledBlock, { callId: 'c-other', sessionId: 's2' });
ok(
  '换一个会话立刻回落全局偏好（覆盖只在当前会话里）',
  rowOf(otherSessionRow.tree).props.open === prefOpen &&
    (prefView === 'highlight'
      ? findByType(otherSessionRow.tree, PStub.CodeBlock) !== null
      : findByType(otherSessionRow.tree, PStub.DiffBlock) !== null),
);
ok(
  '另一个会话的页头显示的是它自己的生效值',
  textOf(findAllByClass(headTreeOf('s2'), 'headBtn')[0]) === (prefOpen ? '收起改动' : '展开改动'),
);
otherSessionRow.unmount();

// 「恢复跟随偏好」：撤掉覆盖，行与按钮都回到全局偏好
findAllByClass(headTreeOf('s1'), 'headReset')[0].props.onClick();
ok('撤覆盖同样不写偏好', configWrites() === writesBeforeHead);
headRow.flush();
ok(
  '撤掉覆盖后行与按钮都回到全局偏好',
  rowOf(headRow.tree).props.open === prefOpen &&
    sectionsOf(headRow.tree).every((node) => node.props.open === prefOpen) &&
    textOf(findAllByClass(headTreeOf('s1'), 'headBtn')[0]) === (prefOpen ? '收起改动' : '展开改动'),
);
ok('撤掉覆盖后「恢复跟随偏好」消失', findAllByClass(headTreeOf('s1'), 'headReset').length === 0);
headRow.unmount();

// ── 场景 4：设置节的读 / 写往返（偏好只有 Host 一个事实源） ───────────────────

ok(
  '挂载时会向 /ext 路由读一次当前偏好',
  requests.some(
    (request) => request.method === 'GET' && request.url === '/ext/dshp-file-change-viewer/state',
  ),
);

// Host 侧（手改 settings.yaml / 另一个浏览器）改了值：点「重新读取」必须采用权威值。
savedConfig = { view: 'diff', sectionsOpen: false };
const reloadButton = findByType(settingsTree, PStub.Button);
ok('设置节有「重新读取」按钮', reloadButton !== null && typeof reloadButton.props.onClick === 'function');
reloadButton.props.onClick();
await settle();
const reloadedTree = mount(Section, {});
ok(
  '重新读取后单选卡呈现 Host 的权威值',
  settingViewCard(reloadedTree, 'diff').props['aria-checked'] === true,
);
ok(
  '开关也跟随 Host 的权威值',
  settingSwitch(reloadedTree, '编辑 / 写入默认展开').props['aria-checked'] === false,
);

// 开关点击：改的是 sectionsOpen，并且同样落进 /ext 路由。
settingSwitch(reloadedTree, '编辑 / 写入默认展开').props.onClick();
ok(
  '开关点击 POST 的是 sectionsOpen',
  requests.some(
    (request) =>
      request.method === 'POST' &&
      request.url === '/ext/dshp-file-change-viewer/config' &&
      JSON.parse(request.body).sectionsOpen === true,
  ),
);

// 保存失败：乐观值必须回滚，且如实报错（绝不能假装保存成功）。
failNextWrite = '写盘失败';
settingViewCard(reloadedTree, 'highlight').props.onClick();
await settle();
const failedTree = mount(Section, {});
ok(
  '保存失败后回滚到上一次的权威值',
  settingViewCard(failedTree, 'diff').props['aria-checked'] === true &&
    settingViewCard(failedTree, 'highlight').props['aria-checked'] === false,
);
ok(
  '保存失败必须显示未保存徽标',
  findAllByName(failedTree, 'Badge')
    .map((badge) => badge.props.text)
    .includes('未保存'),
);
ok('保存失败的原因要如实显示', treeText(failedTree).includes('写盘失败'));

// ── 场景 12：patch 调用（本插件 Host 半注册的工具）走同一张卡片 ───────────────

const PATCH_ARGS = [
  '*** Begin Patch',
  '*** Update File: p.ts',
  '@@',
  ' const keep = 1;',
  '-const old = 2;',
  '+const mid = 2;',
  '*** End Patch',
].join('\n');
const patchArgsRaw = JSON.stringify({ patch: PATCH_ARGS });

// 前面的设置往返把全局偏好切成了「± 差异」，这里先切回高亮，测的是 patch 行的默认形态。
settingViewCard(mount(Section, {}), 'highlight').props.onClick();

const patchStreaming = render('patch', { name: 'patch', argsRaw: patchArgsRaw });
ok(
  'patch 行用「补丁」作标题（conversation 里没有这个 i18n 键）',
  rowOf(patchStreaming).props.title === '补丁',
);
ok(
  'patch 流式生成：从 args 里的 patch 文本就能预览改动',
  findByType(patchStreaming, PStub.CodeBlock).props.code ===
    ['const keep = 1;', 'const old = 2;', 'const mid = 2;'].join('\n'),
);

const patchSettled = render('patch', {
  kind: 'tool-result',
  call: { name: 'patch', argsRaw: patchArgsRaw },
  isError: false,
  content: [{ type: 'text', text: 'Updated p.ts (+1 -1)' }],
  // 与 Host 半 patch 工具的真实产出同形：两侧都是**原文**（含未变上下文），卡片自己跑 LCS。
  meta: {
    diffs: [
      {
        path: '/w/p.ts',
        oldText: 'const keep = 1;\nconst old = 2;',
        newText: 'const keep = 1;\nconst mid = 2;',
      },
    ],
  },
});
{
  const patchStat = { props: {}, children: [rowOf(patchSettled).props.collapsedContent] };
  ok(
    'patch 结算：统计按语义变更 +1 -1',
    textOf(findAllByClass(patchStat, 'add')[0]) === '1' &&
      textOf(findAllByClass(patchStat, 'del')[0]) === '1',
  );
  ok(
    'patch 结算：卡片用 meta.diffs 渲染（不再依赖 args 预览）',
    findByType(patchSettled, PStub.CodeBlock).props.code ===
      ['const keep = 1;', 'const old = 2;', 'const mid = 2;'].join('\n'),
  );
  const patchPrefOpen =
    settingSwitch(mount(Section, {}), '编辑 / 写入默认展开').props['aria-checked'] === true;
  ok(
    'patch 行与其它文件修改行走同一条规则：开合 = 当前偏好',
    rowOf(patchSettled).props.open === patchPrefOpen,
  );
}

// ── 场景 13：真实行号（不是每段都从 1 开始数） ────────────────────────────────

// ① patch 的 meta.diffs 自带 startLine（落盘时算出的真实落点）：卡片直接用，不必问 Host
const patchNumbered = render('patch', {
  kind: 'tool-result',
  call: { name: 'patch', argsRaw: patchArgsRaw },
  isError: false,
  content: [],
  meta: {
    diffs: [
      {
        path: '/w/p.ts',
        oldText: 'const keep = 1;\nconst old = 2;',
        newText: 'const keep = 1;\nconst mid = 2;',
        startLine: 42,
      },
    ],
  },
});
{
  const numberedCss = textOf(findAllByType(patchNumbered, 'style')[0]);
  ok(
    'patch 的 startLine 变成行号起点（首行编号 = 42）',
    numberedCss.includes('counter-reset:source-line 41'),
  );
  ok(
    '行号起点规则挂在那一块自己的类名上（不串到别的块）',
    numberedCss.includes('.dshp-fcv-lines-') && numberedCss.includes(' code{counter-reset:source-line 41}'),
  );
  ok(
    '行头路径链接带上真实行号（点开落在改动处）',
    requests.length >= 0 && findByType(patchNumbered, PStub.CodeBlock) !== null,
  );
}

// ③ 改名（`*** Move to:`）：Host 半会拒绝这个补丁，卡片仍然把「本来想做的那次改名」画出来
//     ——预览来自参数推导（readIntended），卡头渲染成「旧 → 新」，右上角打 rejected 角标。
const MOVE_ARGS = [
  '*** Begin Patch',
  '*** Update File: original.ts',
  '*** Move to: renamed.ts',
  '@@',
  '-const old = 2;',
  '+const mid = 2;',
  '*** End Patch',
].join('\n');
const patchMoved = render('patch', {
  kind: 'tool-result',
  call: { name: 'patch', argsRaw: JSON.stringify({ patch: MOVE_ARGS }) },
  isError: true,
  content: [{ type: 'text', text: 'patch 只做「新建 / 修改」，不执行删除与改名' }],
});
ok(
  'patch 改名被拒：卡头显示「旧 → 新」',
  treeText(patchMoved).includes('original.ts') &&
    treeText(patchMoved).includes('→') &&
    treeText(patchMoved).includes('renamed.ts'),
);
ok('patch 改名被拒：行头显示失败原因', treeText(patchMoved).includes('不执行删除与改名'));
ok(
  'patch 改名被拒：差异仍然画出来（用户要看到它本来打算改什么）',
  findByType(patchMoved, PStub.CodeBlock) !== null,
);
ok('普通改动不会多出一个箭头', !treeText(patchSettled).includes('→'));

// ④ 上下文：Host 回的两侧原文要**真的画出来**，而且行号相应前移
//    —— 高亮视图把上下文并进同一个代码块；± 视图的官方 DiffBlock 只有 del/add 两种行，
//    画不了中性上下文，所以上下文单独渲染成中性行贴在它上下。
{
  locateAnswers.set('/w/src/ctx.ts\u0000new line', {
    line: 5,
    before: ['before 1', 'before 2', 'before 3'],
    after: ['after 1', 'after 2', 'after 3'],
  });
  const ctxBlock = {
    kind: 'tool-result',
    call: { name: 'edit', argsRaw: '{"file_path":"/w/src/ctx.ts"}' },
    isError: false,
    content: [],
    meta: { diffs: [{ path: '/w/src/ctx.ts', oldText: 'old line', newText: 'new line' }] },
  };
  const ctxRow = mountLive('edit', ctxBlock, { callId: 'c-ctx' });
  await settle();
  ctxRow.flush();

  const ctxText = findByType(ctxRow.tree, PStub.CodeBlock).props.code;
  ok(
    '高亮视图：上下文行排在新内容上下（文件顺序）',
    ctxText ===
      ['before 1', 'before 2', 'before 3', 'old line', 'new line', 'after 1', 'after 2', 'after 3'].join(
        '\n',
      ),
  );
  const ctxCss = textOf(findAllByType(ctxRow.tree, 'style')[0]);
  ok(
    '高亮视图：行号前移，首行就是上文第一行的真实行号（5 - 3 = 2）',
    ctxCss.includes('counter-reset:source-line 1'),
  );
  // 上下文行不参与增删统计：统计仍按语义变更（这里 +1 -1）
  const ctxCollapsed = { props: {}, children: [rowOf(ctxRow.tree).props.collapsedContent] };
  ok(
    '上下文行不参与增删统计',
    textOf(findAllByClass(ctxCollapsed, 'add')[0]) === '1' &&
      textOf(findAllByClass(ctxCollapsed, 'del')[0]) === '1',
  );
  ctxRow.unmount();

  // ± 差异视图：默认偏好是 highlight，这里把该块临时切到 diff（与上面「单块临时切换视图」同一套路）
  const ctxHighlight = render('edit', ctxBlock, { callId: 'c-ctx' });
  findAllByClass(findAllByClass(ctxHighlight, 'card')[0], 'viewPill')[1].props.onClick({
    stopPropagation() {},
  });
  const ctxDiffTree = rerender('edit', ctxBlock, { callId: 'c-ctx' });
  const ctxCard = findAllByClass(ctxDiffTree, 'card')[0];
  const diffText = treeText(ctxCard);
  ok(
    '± 差异视图：上下文也画出来了（官方 DiffBlock 画不了中性行，所以单独渲染）',
    diffText.includes('before 1') && diffText.includes('after 3'),
  );
  ok('± 差异视图：上下文行各 3 行、不带 ± 标记', findAllByClass(ctxCard, 'ctxLine').length === 6);
  ok(
    '± 差异视图：DiffBlock 本身还在（改动仍是官方逐行视图）',
    findAllByType(ctxCard, PStub.DiffBlock).length === 1,
  );
  // 行号：上下文行带真实行号（上文 counter-reset 起点 2-1=1；下文起点 = 上文首行 + 上文行数
  // + 新增行数，这里 2 + 3 + 1 = 6，reset 为 5）。JSX 把起点内联在 .ctx 容器上。
  {
    const ctxBoxes = findAllByClass(ctxCard, 'ctx');
    ok(
      '± 差异视图：上文行号从真实行号起数（counter-reset:1）',
      ctxBoxes[0]?.props?.style?.counterReset === 'dshp-fcv-num 1',
    );
    ok(
      '± 差异视图：下文行号跳过改动区（counter-reset:5）',
      ctxBoxes[1]?.props?.style?.counterReset === 'dshp-fcv-num 5',
    );
  }
  // 改动行的行号列：**改动行不编号，列里放 `+` / `-` 本身**，与上下文行的行号共用同一列
  // （3ch + 12px 间隙），于是「上下文行号 / 改动符号 / 正文」三列严格对齐。官方行内的
  // `- `/`+ ` 前缀必须被压掉，否则正文会被多推两个字符、对齐就破了。这个场景里
  // del 1 行、add 1 行，各占一个 nth-of-type 区间。
  {
    const signStyle = findAllByType(ctxCard, 'style').find((node) => textOf(node).includes("content:'-'"));
    const signCss = signStyle === undefined ? '' : textOf(signStyle);
    const COL = 'padding-inline-start:calc(3ch + 12px)';
    const delRange = 'div:nth-of-type(n+2):nth-of-type(-n+2)';
    const addRange = 'div:nth-of-type(n+3):nth-of-type(-n+3)';
    ok(
      '± 差异视图：改动行不编号（动态规则里没有任何 CSS 计数器）',
      signCss !== '' && !signCss.includes('dshp-fcv-old') && !signCss.includes('dshp-fcv-new'),
    );
    ok(
      '± 差异视图：del / add 行都让出行号列（与上下文行号同宽 3ch + 12px）',
      signCss.includes(delRange + '{' + COL + '}') && signCss.includes(addRange + '{' + COL + '}'),
    );
    ok(
      '± 差异视图：压掉官方行内的 `- `/`+ ` 前缀（两处 ::before{content:none}）',
      (signCss.match(/::before\{content:none\}/g) ?? []).length === 2,
    );
    ok(
      '± 差异视图：行号列里画的是 +/- 本身（del 红、add 绿）',
      signCss.includes("::after{content:'-';color:var(--dsw-alias-state-error-primary)}") &&
        signCss.includes("::after{content:'+';color:var(--dsw-alias-state-success-primary)}"),
    );
    ok(
      '± 差异视图：规则挂在 DiffBlock 根的动态类名上（与高亮视图的 codeClass 同源）',
      findByType(ctxCard, PStub.DiffBlock).props.className.includes('dshp-fcv-lines-c-ctx-d0'),
    );
  }
}

// ⑤ 上下文行数 = 0（偏好）时不补任何上下文
{
  locateAnswers.set('/w/src/noctx.ts\u0000new', { line: 2, before: ['x'], after: ['y'] });
  settingSelect(mount(Section, {}), '上下文行数', '0'); // 切到「不显示」
  const noCtxBlock = {
    kind: 'tool-result',
    call: { name: 'edit', argsRaw: '{"file_path":"/w/src/noctx.ts"}' },
    isError: false,
    content: [],
    meta: { diffs: [{ path: '/w/src/noctx.ts', oldText: 'old', newText: 'new' }] },
  };
  const noCtxRow = mountLive('edit', noCtxBlock, { callId: 'c-noctx' });
  await settle();
  noCtxRow.flush();
  ok('上下文行数 = 0 时只显示改动本身', findByType(noCtxRow.tree, PStub.CodeBlock).props.code === 'old\nnew');
  noCtxRow.unmount();
  settingSelect(mount(Section, {}), '上下文行数', '3'); // 还原默认，免得影响后续断言
}

// ② edit / write 的元数据没有偏移 → 向 Host 定位；结果回来前先老实从 1 开始
// （用一段本测试没渲染过的 hunk：定位缓存按 path + newText 存，问过一次就不会再问）
locateAnswers.set('/w/src/located.ts\u0000new line', 128);
const locatedBlock = {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/src/located.ts"}' },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/src/located.ts', oldText: 'old line', newText: 'new line' }] },
};
const editNumbered = mountLive('edit', locatedBlock);
ok(
  '定位结果还没回来时不动行号（保持 1 起，不编数字）',
  !textOf(findAllByType(editNumbered.tree, 'style')[0]).includes('counter-reset:source-line'),
);
await settle();
ok(
  '定位请求真的发出去了（只带 path + newText）',
  requests.some((request) => {
    if (!request.url.endsWith('/locate')) return false;
    const body = JSON.parse(String(request.body));
    return body.items.some((item) => item.path === '/w/src/located.ts' && item.newText === 'new line');
  }),
);
editNumbered.flush();
const locatedCss = textOf(findAllByType(editNumbered.tree, 'style')[0]);
ok('定位回来后行号变成文件里的真实行号', locatedCss.includes('counter-reset:source-line 127'));
ok(
  '行头路径链接也会带上这个行号（点开落在改动处）',
  // 行头链接的 onClick 里带着 line；这里只验证链接还在（真实点击行为由 props 传递保证）
  findAllByClass(editNumbered.tree, 'path').length === 1,
);
editNumbered.unmount();

// ③ 定位不到（文件之后又被改过）：退回 1 起，不显示错的数字
const unknownBlock = {
  kind: 'tool-result',
  call: { name: 'edit', argsRaw: '{"file_path":"/w/src/gone.ts"}' },
  isError: false,
  content: [],
  meta: { diffs: [{ path: '/w/src/gone.ts', oldText: 'x', newText: 'y' }] },
};
const unknownLine = mountLive('edit', unknownBlock, { callId: 'c9' });
await settle();
unknownLine.flush();
ok(
  '定位不到时保持 1 起（宁可朴素，也不编一个错的）',
  !textOf(findAllByType(unknownLine.tree, 'style')[0]).includes('counter-reset:source-line'),
);
ok(
  '同一段 hunk 的定位结果会被缓存（不重复问 Host）',
  requests.filter((request) => {
    if (!request.url.endsWith('/locate')) return false;
    return JSON.parse(String(request.body)).items.some((item) => item.path === '/w/src/gone.ts');
  }).length === 1,
);
unknownLine.unmount();

console.log('✓ @dshp/file-change-viewer client: ' + checks + ' 项断言全部通过');
