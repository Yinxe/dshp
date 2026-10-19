#!/usr/bin/env node
/**
 * 跨插件集成冒烟：把 **token-meter 的真实 `lib/client.js`** 挂到 **widget-kit 的真实 `lib/client.js`**
 * 发布的 `widgets` 服务上，不打开浏览器。
 *
 * 为什么值得单独一个脚本：类型只能证明「描述符写对了」，证明不了「真的注册进去了」——
 * 而这条链上有四个只能靠跑起来才知道的断点：
 *   1. 服务是**跨模块**拿到的（本插件 bundle 里 `require('react')` 与框架那半是两个工厂），拿到的是不是同一个对象？
 *   2. 顶层 `inject` 有没有误把可选依赖写成硬依赖（那样没装框架时整个插件都不激活）；
 *   3. 描述符是不是真能过框架的 `normalizeDescriptor`（id 形状 / `trayIcon: false` 只对 card 合法 /
 *      `content.render` 必填）；
 *   4. `trayIcon: false` 的自由卡片是不是**提前注册**了（刷新后「还开着」的卡片靠它长回来）。
 *
 * 2026-09 UI 重构后的额外断言：额度的入口是 `sidebar.footer.action` 里的那枚环形按钮
 * （不再是活动栏菜单面板 + 供应商卡片），并且这枚环的数值真的来自 **provider 的按钮级模板**。
 *
 * 只读两边已提交的产物（`lib/client.js`），所以先跑 `pnpm build`（或至少构建这两个插件）。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/* ────────────────────────────── 浏览器环境替身 ────────────────────────────── */

const storage = new Map();
const styleTags = [];

const localStorageStub = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const documentStub = {
  head: { appendChild: (tag) => styleTags.push(tag) },
  body: {},
  visibilityState: 'visible',
  createElement: () => ({ setAttribute: () => {}, textContent: '' }),
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const windowStub = {
  innerWidth: 1440,
  innerHeight: 900,
  localStorage: localStorageStub,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: () => 1,
  clearTimeout: () => {},
};

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.localStorage = localStorageStub;
globalThis.CustomEvent = function CustomEvent(type, init) {
  this.type = type;
  this.detail = init?.detail;
};
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 1;
};
globalThis.cancelAnimationFrame = () => {};

/** 假 Host：`/state` 回两个供应商 + 一份 DeepSeek 快照（赠送 0 / 充值 100 / 余额 9.06 → 已用 91%）。 */
const VENDORS = [
  { id: 'deepseek', name: 'DeepSeek 官方', type: 'deepseek', params: {}, enabled: true },
  { id: 'My_Vendor', name: '手写供应商', type: 'manual', params: {}, enabled: true },
];
const DEEPSEEK_SNAP = {
  vendorId: 'deepseek',
  vendorName: 'DeepSeek 官方',
  ok: true,
  at: new Date().toISOString(),
  fetchedAtMs: Date.now(),
  billingKind: 'payg',
  billing: { balance: 9.06, currency: 'CNY', granted: 0, toppedUp: 100, lowWarn: 5 },
  secretKind: 'plain',
  via: '官方余额接口',
};
globalThis.fetch = async (url) => ({
  async json() {
    if (String(url).endsWith('/state')) {
      return {
        ok: true,
        config: { version: 1, activeVendor: 'deepseek', vendors: VENDORS },
        snaps: { deepseek: DEEPSEEK_SNAP },
      };
    }
    return { ok: true };
  },
});

/* ────────────────────────────── React / primitives 替身 ────────────────────────────── */

/** 任意缺失的 React 成员都给个能调用的空实现：本脚本只跑模块级代码与服务注册，不渲染。 */
const ReactStub = new Proxy(
  {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: 'Fragment',
    Component: class Component {
      constructor(props) {
        this.props = props;
      }
      setState() {}
    },
    createContext: () => ({ Provider: 'Provider', Consumer: 'Consumer' }),
    forwardRef: (render) => render,
    memo: (component) => component,
    // 组件树是**真的被调用**的（菜单面板），所以 hook 要给出合理初值：
    // useReducer / useState 返回初值、useMemo / useCallback 直接求值、useEffect 不执行。
    useReducer: (reducer, initial) => [typeof initial === 'function' ? initial(reducer) : initial, () => {}],
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: (initial) => ({ current: initial }),
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    useEffect: () => {},
    useLayoutEffect: () => {},
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'symbol') return undefined;
      return () => undefined;
    },
  },
);
ReactStub.Component.prototype.isReactComponent = {};

const jsxRuntimeStub = {
  Fragment: 'Fragment',
  jsx: (type, props) => ({ type, props: props ?? {} }),
  jsxs: (type, props) => ({ type, props: props ?? {} }),
};

/** primitives 替身：任何名字都是一个「组件」；同时提供本插件真的会调的 hook 级函数。 */
const primitivesStub = new Proxy(
  {
    useAnchoredPosition: () => null,
    useDismissOnOutsidePointer: () => {},
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'symbol') return undefined;
      const name = String(prop);
      return (props) => ({ type: name, props: props ?? {} });
    },
  },
);

const reactDomStub = { createPortal: (node) => node };

const requireStub = (spec) => {
  if (spec === 'react') return ReactStub;
  if (spec === 'react/jsx-runtime') return jsxRuntimeStub;
  if (spec === 'react-dom') return reactDomStub;
  if (spec === '@deepseek-ai/dsh-client-ui-primitives') return primitivesStub;
  throw new Error(`未预期的运行时依赖：${spec}（本仓插件运行时零依赖）`);
};

/**
 * 求值一个 bundle 并取回它的 loader 入口。
 *
 * 两个 bundle 用同一套替身、同一个 `window`，所以第二个 bundle 看到的世界与真机一致
 * （真机上它们也确实在同一页里）。
 *
 * @param relative - 相对本脚本的产物路径。
 * @returns loader 条目（`{ id, factory }`）。
 */
function loadBundle(relative) {
  const url = relative.startsWith('@')
    ? new URL(import.meta.resolve(relative))
    : new URL(relative, import.meta.url);
  let source;
  try {
    source = readFileSync(url, 'utf8');
  } catch {
    throw new Error(`读不到 ${url.pathname} —— 先构建产物：pnpm -r build`);
  }
  let entry = null;
  const loader = { __ModuleLoader__: { load: (value) => (entry = value) } };
  // 用同一个 window 对象，只临时换掉 loader 收集器
  const previous = window.__ModuleLoader__;
  window.__ModuleLoader__ = loader.__ModuleLoader__;
  try {
    // eslint-disable-next-line no-new-func -- 自检脚本就是要把产物当脚本求值
    new Function('window', source)(window);
  } finally {
    window.__ModuleLoader__ = previous;
  }
  assert.ok(entry !== null, `${relative} 没有调用 window.__ModuleLoader__.load`);
  assert.equal(typeof entry.factory, 'function', `${relative} 的 factory 必须是函数`);
  return entry;
}

/**
 * 一个「最小可用」的 client ctx。
 *
 * `inject` 的实现刻意与真 cordis 的语义一致：**服务在册时才调用回调**，并且把回调包在作用域里 ——
 * 这正是本插件不该把 `widgets` 写进顶层 inject 的原因。
 *
 * @param services - 名字 → 服务值（不在册的不给）。
 * @returns 记录器与 ctx。
 */
function makeCtx(services) {
  const record = {
    effects: [],
    injections: [],
    registrations: [],
    errors: [],
    warnings: [],
  };
  const slots = {
    inject: (name, callback) => callback(),
    register: (spec, component) => {
      record.registrations.push({ spec, component });
      return () => {};
    },
  };
  const ctx = {
    get: (name) => (name === 'slots' ? slots : services[name]),
    effect: (callback, label) => {
      const result = callback();
      record.effects.push({ label, dispose: typeof result === 'function' ? result : null });
      return result;
    },
    inject: (deps, callback) => {
      record.injections.push(deps);
      if (!deps.every((name) => services[name] !== undefined)) return undefined;
      const scope = {
        ...ctx,
        get: (name) => services[name],
      };
      return callback(scope);
    },
    interval: () => () => {},
    timeout: () => () => {},
    reflect: { provide: () => () => {} },
  };
  return { ctx, record, slots };
}

/* ────────────────────────────── 1. 起框架（widget-kit） ────────────────────────────── */

const kit = loadBundle('@dshp/widget-kit/client');
assert.equal(kit.id, '@dshp/widget-kit', 'widget-kit loader id 必须等于包名');
const kitExports = kit.factory(requireStub);

const provided = [];
const kitCtx = {
  get: (name) => (name === 'slots' ? { inject: (n, cb) => cb(), register: () => () => {} } : {}),
  effect: (callback) => callback(),
  interval: () => () => {},
  timeout: () => () => {},
  reflect: {
    provide: (name, value) => {
      provided.push({ name, value });
      return () => {};
    },
  },
};
kitExports.apply(kitCtx);
assert.equal(provided.length, 1, 'widget-kit 必须发布恰好一个服务');
assert.equal(provided[0].name, 'widgets');
const service = provided[0].value;

/* ────────────────────────────── 2. 挂上 token-meter ────────────────────────────── */

/** 拦下「进框架」的描述符：类型证明不了的事，这里逐条断言。 */
const descriptors = [];
const rawRegister = service.register.bind(service);
service.register = (descriptor) => {
  descriptors.push(descriptor);
  return rawRegister(descriptor);
};

const meter = loadBundle('../lib/client.js');
assert.equal(meter.id, '@dshp/token-meter', 'token-meter loader id 必须等于包名');
const meterExports = meter.factory(requireStub);

assert.deepEqual(
  meterExports.inject,
  ['slots'],
  '顶层 inject 只能声明不可或缺的服务：widgets 是可选增强，写进顶层会让插件在没装框架时整体不激活',
);

const { ctx: meterCtx, record } = makeCtx({ widgets: service, slots: undefined });
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args) => record.errors.push(args.map(String).join(' '));
console.warn = (...args) => record.warnings.push(args.map(String).join(' '));
try {
  meterExports.apply(meterCtx);
} finally {
  console.error = originalError;
  console.warn = originalWarn;
}

assert.deepEqual(record.errors, [], '挂载过程不该有 console.error');
assert.deepEqual(
  record.injections,
  [['widgets']],
  '必须用 ctx.inject 等 widgets（可选依赖），而不是顶层 inject',
);

// `ensureLoad()` 是 async 的：等一拍让「读到供应商 → 对齐注册表」跑完
await new Promise((resolve) => setTimeout(resolve, 0));

/* ────────────────────────────── 3. 断言：真的进了框架的注册表 ────────────────────────────── */

const registeredIds = service.list().map((row) => row.id);
const expected = [
  'token-meter:stats-cards',
  'token-meter:stats-trend',
  'token-meter:stats-heat',
  'token-meter:stats-donut',
  'token-meter:stats-today',
];
for (const id of expected) {
  assert.ok(registeredIds.includes(id), `静态小组件没注册：${id}（当前：${registeredIds.join(', ')}）`);
}
const meterIds = registeredIds.filter((id) => id.startsWith('token-meter:'));
assert.deepEqual(
  meterIds.toSorted(),
  expected.toSorted(),
  `额度已不再是可弹出卡片（改成侧边栏按钮），本插件名下不该多出别的 id：${meterIds.join(', ')}`,
);

// 框架自己会注册「组件箱」（自由卡片的统一入口，始终在册）；除它之外注册表里不该有别人
const frameworkRows = service.list().filter((row) => row.owner === 'dshp-widget-kit');
assert.ok(
  frameworkRows.some((row) => row.id === 'dshp-widget-kit:box'),
  '框架自己的「组件箱」应当始终在册（它是声明了 listedInBox 的卡片的统一入口）',
);
assert.deepEqual(
  [...new Set(service.list().map((row) => row.owner))].filter(
    (owner) => owner !== 'token-meter' && owner !== 'dshp-widget-kit',
  ),
  [],
  '注册表里出现了别家组件（本插件的 id 必须全归自己名下）',
);
const byOwner = service.list().filter((row) => row.owner === 'token-meter');
assert.equal(byOwner.length, expected.length, 'token-meter 名下只该有 5 张统计卡');

// 描述符本身：自由卡片全是「不占活动栏 + 有内容 + 有尺寸」，标题可求值
assert.equal(descriptors.length, byOwner.length, '描述符数量必须与 token-meter 在册数一致');
const cards = descriptors.filter((descriptor) => descriptor.presentation === 'card');
assert.equal(cards.length, expected.length, '卡片描述符数量不对');
for (const descriptor of cards) {
  assert.equal(descriptor.trayIcon, false, `${descriptor.id} 必须不占活动栏图标`);
  assert.equal(typeof descriptor.content?.render, 'function', `${descriptor.id} 必须有内容渲染函数`);
  assert.ok(descriptor.card?.defaultSize?.w >= 240, `${descriptor.id} 默认宽度不得小于框架地板`);
  assert.equal(typeof descriptor.title, 'function', `${descriptor.id} 的标题应该是可求值的`);
}

// 活动栏：额度搬去侧边栏按钮后，本插件**不再占任何活动栏图标**
const trayOwners = descriptors.filter((descriptor) => descriptor.trayIcon !== false);
assert.deepEqual(
  trayOwners.map((descriptor) => descriptor.id),
  [],
  '额度入口是侧边栏按钮；活动栏上不该再有本插件的图标或菜单面板',
);
const popovers = byOwner.filter((row) => row.presentation === 'popover');
assert.deepEqual(popovers, [], 'popover 形态已随活动栏菜单一起删除');

// 尺寸：每张卡各自适配（热力图宽而扁、模型分布留高、今日卡小），不是一套尺寸打天下
const sizeOf = (id) => descriptors.find((descriptor) => descriptor.id === id)?.card;
const heat = sizeOf('token-meter:stats-heat');
const donut = sizeOf('token-meter:stats-donut');
const today = sizeOf('token-meter:stats-today');
const trend = sizeOf('token-meter:stats-trend');
assert.notEqual(heat.defaultSize.h, donut.defaultSize.h, '热力图与模型分布不该同高（一个扁一个高）');
assert.ok(heat.defaultSize.h < trend.defaultSize.h, '热力图应该比趋势矮（周 × 日网格不需要高度）');
assert.ok(heat.defaultSize.w > trend.defaultSize.w, '热力图应该比趋势宽（横向格子多）');
assert.ok(today.defaultSize.w < heat.defaultSize.w, '今日卡应该比热力图窄（就一张卡）');
for (const descriptor of cards) {
  assert.ok(
    descriptor.card.minSize.w >= 240 && descriptor.card.minSize.h >= 140,
    `${descriptor.id} 的最小尺寸低于框架地板 240×140，注册会被拒`,
  );
  assert.ok(
    descriptor.card.defaultSize.w >= descriptor.card.minSize.w &&
      descriptor.card.defaultSize.h >= descriptor.card.minSize.h,
    `${descriptor.id} 的初始尺寸小于最小尺寸`,
  );
}

// 标题真的有内容（不是空串、不是 undefined）
const titles = new Map(
  descriptors.map((descriptor) => [
    descriptor.id,
    typeof descriptor.title === 'function' ? descriptor.title() : descriptor.title,
  ]),
);
assert.equal(titles.get('token-meter:stats-trend'), '用量趋势');
assert.equal(titles.get('token-meter:stats-today'), '今日消耗');

// 开关：交给框架的开合动作（几何/持久化在那边），这里只验状态机通
for (const id of ['token-meter:stats-cards', 'token-meter:stats-trend']) {
  assert.equal(service.isOpen(id), false, `${id} 初始不该是开的`);
  service.open(id);
  assert.equal(service.isOpen(id), true, `${id} 打开失败（框架多半认为它不在册）`);
  service.close(id);
  assert.equal(service.isOpen(id), false, `${id} 关闭失败`);
}

// 侧边栏额度按钮：真的把组件树跑一遍（环的数值必须来自 provider 的**按钮级模板**）
/** 收集原始元素树里满足条件的节点（不调用函数组件，只看 props）。 */
function collect(node, pred, out = []) {
  if (node === null || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const child of node) collect(child, pred, out);
    return out;
  }
  if (pred(node)) out.push(node);
  // 不只走 children：按钮模板会把主图形塞在 `leading` / `rail` 这类具名 prop 里
  for (const value of Object.values(node.props ?? {})) {
    if (value === null || typeof value !== 'object') continue;
    collect(value, pred, out);
  }
  return out;
}

/** 在整棵树里找「某个字符串 prop / children 等于给定文案」的节点。 */
function hasText(node, text) {
  return collect(node, (n) => Object.values(n.props ?? {}).includes(text)).length > 0;
}

const sidebarReg = record.registrations.find((entry) => entry.spec.name === 'sidebar.footer.action');
assert.ok(sidebarReg, '必须注册 sidebar.footer.action（额度的唯一入口）');
assert.equal(sidebarReg.spec.id, 'dshp-token-meter', '侧边栏条目的 id 必须是本插件的命名空间');

const actionTree = sidebarReg.component({ wide: true });
const button = collect(
  actionTree,
  (node) => node.type === 'button' && node.props?.['aria-haspopup'] === 'dialog',
)[0];
assert.ok(button !== undefined, '额度按钮必须是一个 dialog 触发器（aria-haspopup）');
assert.equal(typeof button.props.onClick, 'function', '按钮必须能点开');
assert.equal(button.props['aria-expanded'], false, '初始应当是收起的');

// 按钮内容由 provider 的**按钮级模板**产出（自由节点：环 / 余额 / 迷你条 / 图标…）
const ringEl = collect(
  actionTree,
  (node) => typeof node.type === 'function' && node.props?.spec?.tone !== undefined,
)[0];
assert.ok(ringEl !== undefined, '按钮里应当有一枚环（DeepSeek 默认画法）');
assert.equal(
  ringEl.props.spec.tone,
  'bad',
  'DeepSeek 快照（充值 100 / 余额 9.06 → 已用 91%）经按钮模板应为 bad 档',
);
assert.equal(ringEl.props.spec.text, '91%', '按钮模板应算出 91% 的环内文案');
// 供应商图标名也交给按钮骨架（`icon` prop；名字来自 Host 元数据 / 客户端兜底表）
assert.ok(
  collect(actionTree, (node) => node.props?.icon === 'deepseek').length > 0,
  'DeepSeek 按钮应当把「鲸尾」这枚供应商图标交给骨架',
);
// 真的求值一次环组件：spec → svg（颜色走 CSS 变量，弧长走 stroke-dasharray）
const deepRender = (node) => {
  if (node === null || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(deepRender);
  const children = node.props?.children;
  const rendered =
    children === undefined
      ? undefined
      : Array.isArray(children)
        ? children.map(deepRender)
        : deepRender(children);
  const next = { ...node, props: { ...node.props, children: rendered } };
  if (typeof node.type === 'function') return deepRender(node.type(next.props));
  return next;
};
const ringSvg = deepRender(ringEl);
assert.equal(ringSvg.type, 'svg', '环组件应当产出一个 svg');
assert.equal(ringSvg.props['data-tone'], 'bad', 'svg 上的 data-tone 必须跟着 spec 走');

// 宽栏整棵树求值一次：图标 svg + 名字 + 数值都真的画出来了
const wideTree = deepRender(actionTree);
assert.equal(
  collect(wideTree, (node) => node.type === 'svg' && node.props?.['data-provider-icon'] === 'deepseek')
    .length,
  1,
  '宽栏按钮里应当画出供应商图标（ProviderIcon → svg[data-provider-icon]）',
);
assert.ok(hasText(wideTree, 'DeepSeek 官方'), '宽栏按钮上应当有供应商名');
assert.ok(hasText(wideTree, '91%'), '宽栏按钮上应当有按钮模板算出的数值');

// 窄栏（56px 轨道）：名字与数值都要收起来，只留表盘（环 + 环心里的供应商图标）
const railTree = deepRender(sidebarReg.component({ wide: false }));
assert.equal(hasText(railTree, 'DeepSeek 官方'), false, '窄栏里不该有供应商名（交给 tooltip）');
assert.equal(hasText(railTree, '91%'), false, '窄栏里不该有比例文字（交给 tooltip）');
assert.equal(
  collect(railTree, (node) => node.type === 'svg' && node.props?.['data-tone'] !== undefined).length,
  1,
  '窄栏里仍要有一枚环（那是这一档唯一的主图形）',
);
assert.equal(
  collect(railTree, (node) => node.type === 'svg' && node.props?.['data-provider-icon'] === 'deepseek')
    .length,
  1,
  '窄栏仍要带供应商图标（36px 圆：环当表盘外圈，图标居中在环心）',
);
const arc = collect(
  ringSvg,
  (node) => node.type === 'circle' && node.props?.strokeDasharray !== undefined,
)[0];
assert.ok(arc !== undefined, '环的弧必须存在（有比例时才画弧）');
assert.match(
  String(arc.props.strokeDasharray),
  /^[0-9.]+ [0-9.]+$/,
  '弧长必须由比例算成 stroke-dasharray（不是写死的）',
);
assert.ok(hasText(actionTree, '91%'), '按钮上应显示按钮模板算出的 91%');
assert.ok(
  hasText(actionTree, 'DeepSeek 官方'),
  '宽栏按钮上应有当前供应商名（footer actions 是垂直堆叠，每个入口独占一行）',
);

// 弹层拿到的是「每行一个供应商 + 详情节点」，详情才是 provider 的**详情级模板**产出
const panelEl = collect(
  actionTree,
  (node) => node.props !== undefined && 'detail' in node.props && 'vendors' in node.props,
)[0];
assert.ok(panelEl !== undefined, '按钮必须把详情与供应商列表交给弹层');
assert.equal(panelEl.props.vendors.length, VENDORS.length, '供应商切换行数量不对');
assert.equal(panelEl.props.activeName, 'DeepSeek 官方', '弹层标题应是当前供应商');
assert.ok(panelEl.props.detail !== null && panelEl.props.detail !== undefined, '详情节点不该是空的');
assert.ok(
  collect(panelEl.props.detail, (node) => node.props?.title === '账户余额').length > 0,
  'DeepSeek 的详情模板应当渲染「账户余额」块',
);

// 用户偏好：同一个供应商换指标，按钮内容跟着换（Goat = 多窗口 + 余额，最需要它）
/** Goat 的假快照：三条窗口（20 / 55 / 92）+ 一份余额。 */
const GOAT_SNAP = {
  vendorId: 'goat',
  vendorName: 'Goat',
  ok: true,
  at: new Date().toISOString(),
  fetchedAtMs: Date.now(),
  billingKind: 'payg',
  billing: { balance: 12.34, currency: 'USD', lowWarn: 5 },
  windows: [
    { key: '5h', label: '5 小时', pct: 20, used: 0, limit: 100, resetInSec: 0 },
    { key: 'weekly', label: '每周', pct: 55, used: 0, limit: 100, resetInSec: 0 },
    { key: 'monthly', label: '每月', pct: 92, used: 0, limit: 100, resetInSec: 0 },
  ],
};
const goatConfig = () => ({
  version: 1,
  activeVendor: 'goat',
  vendors: [{ id: 'goat', name: 'Goat', type: 'commandcode', params: {} }],
});

/**
 * 展示偏好是**浏览器本地的键值袋**（`localStorage` 的 `tm-quota-prefs`），键名由供应商自己定：
 * Goat 用 `window`（5h/1w/1m）与 `balance`（0/1）。每次 `bootTree` 都会重新求值一份 bundle
 * （prefs store 在模块作用域读一次 localStorage），所以要在启动**之前**写进去。
 *
 * @param bag - Goat 的偏好；空对象 = 清掉（回到默认：月额度 + 不显示余额）。
 */
function setGoatPrefs(bag) {
  if (Object.keys(bag).length === 0) localStorageStub.removeItem('tm-quota-prefs');
  else localStorageStub.setItem('tm-quota-prefs', JSON.stringify({ goat: bag }));
}

/**
 * 用 Goat 快照启动 bundle，返回「宽栏按钮求值后的元素树 + 弹层 props」。
 *
 * @param prefs - 启动前写进 localStorage 的偏好。
 * @returns `{ wide, panel, tree }`。
 */
async function goatBoot(prefs = {}) {
  setGoatPrefs(prefs);
  const booted = await bootTree(goatConfig(), { goat: GOAT_SNAP });
  return { wide: deepRender(booted.tree), panel: panelPropsOf(booted.tree), tree: booted.tree };
}

// 默认：**图表一直画**，默认窗口 = 月额度（1m），数值位 = 百分比
const goatDefault = await goatBoot({});
assert.ok(hasText(goatDefault.wide, '92%'), '默认画月额度窗口（fixture 里 monthly=92%）');
assert.ok(hasText(goatDefault.wide, 'Goat'), '宽栏显示供应商名');
assert.equal(
  collect(
    goatDefault.wide,
    (node) => node.type === 'svg' && node.props?.['data-provider-icon'] === 'commandcode',
  ).length,
  1,
  'Goat 按钮上应当有命令键（⌘）图标',
);

// 控件在**它自己的卡片里**：详情节点里应当有一个 5h / 1w / 1m 单选组 + 一个余额开关
// 详情要**求值**（函数组件本身不产出 role/input，只有调用后才在元素树里）
const goatDetail = deepRender(goatDefault.panel?.detail);
assert.ok(goatDetail !== undefined, 'Goat 的详情模板必须产出节点');
assert.equal(
  collect(goatDetail, (node) => node.props?.role === 'radiogroup').length,
  1,
  '详情里应当有一个单选组（role=radiogroup）',
);
for (const label of ['5h', '1w', '1m']) {
  assert.ok(hasText(goatDetail, label), '单选组里应当有「' + label + '」这一项');
}
assert.equal(
  collect(goatDetail, (node) => node.type === 'input' && node.props?.type === 'checkbox').length,
  1,
  '详情里应当有一个余额开关（checkbox）',
);
assert.equal(
  collect(goatDetail, (node) => node.type === 'button' && node.props?.role === 'radio').length,
  3,
  '单选组里恰好三个可点项',
);

// 换窗口：环跟着换（5h=20% / 1w=55% / 1m=92%），数值位仍是百分比
assert.ok(hasText((await goatBoot({ window: '5h' })).wide, '20%'), 'prefs.window=5h → 画 5 小时窗口');
assert.ok(hasText((await goatBoot({ window: 'weekly' })).wide, '55%'), 'prefs.window=weekly → 画每周窗口');
assert.ok(hasText((await goatBoot({ window: 'monthly' })).wide, '92%'), 'prefs.window=monthly → 画每月窗口');

// 余额开关：勾上后**图表照旧**（环还在），只是数值位换成余额
const goatBalanceOn = await goatBoot({ window: 'weekly', balance: '1' });
assert.ok(hasText(goatBalanceOn.wide, '$12.34'), '勾了余额 → 数值位显示余额');
assert.ok(hasText(goatBalanceOn.wide, '55%') === false, '勾了余额 → 数值位不再显示百分比');
assert.equal(
  collect(goatBalanceOn.wide, (node) => node.type === 'svg' && node.props?.['data-tone'] !== undefined)
    .length,
  1,
  '勾了余额，图表（环）也必须一直在（用户口径：图表一直显示）',
);
// 点一下控件真的会写进 localStorage（组件级通信、无 Host 往返）
const radios = collect(goatDetail, (node) => node.type === 'button' && node.props?.role === 'radio');
const fiveHour = radios.find((node) => node.props?.children === '5h');
assert.ok(fiveHour !== undefined, '5h 那一项应当是可点按钮');
fiveHour.props.onClick();
assert.equal(
  JSON.parse(String(localStorageStub.getItem('tm-quota-prefs'))).goat.window,
  '5h',
  '点单选组必须把窗口写进浏览器本地偏好（不走 Host 路由）',
);
const check = collect(goatDetail, (node) => node.type === 'input' && node.props?.type === 'checkbox')[0];
check.props.onChange({ target: { checked: true } });
assert.equal(
  JSON.parse(String(localStorageStub.getItem('tm-quota-prefs'))).goat.balance,
  '1',
  '勾余额开关必须写进浏览器本地偏好',
);
// 再启动一份 bundle（≈刷新页面）：两个偏好都要被读回来
const goatReload = await goatBoot({ window: '5h', balance: '1' });
assert.ok(hasText(goatReload.wide, '$12.34'), '刷新后仍记得「显示余额」');
assert.equal(
  collect(goatReload.wide, (node) => node.type === 'svg' && node.props?.['data-tone'] !== undefined).length,
  1,
  '刷新后图表仍在',
);
setGoatPrefs({});

// 注销：插件卸载后必须不留注册（布局记录由框架按设计保留）
record.effects
  .filter((entry) => entry.label === 'dshp-token-meter: widget-kit bridge')
  .forEach((entry) => entry.dispose?.());
assert.equal(service.list().filter((row) => row.owner === 'token-meter').length, 0, '卸载后不该有残留注册');

/* ────────────────────────────── 4. 断言：没有框架时的路径 ────────────────────────────── */

// 重新求值一份 bundle（等价于「这台机器上没装 widget-kit」），只把 slots 给出去
const withoutKit = loadBundle('../lib/client.js').factory(requireStub);
const bare = makeCtx({ slots: undefined });
console.error = (...args) => bare.record.errors.push(args.map(String).join(' '));
try {
  withoutKit.apply(bare.ctx);
} finally {
  console.error = originalError;
}
assert.deepEqual(bare.record.errors, [], '没有 widgets 服务时挂载不该报错（统计浮窗退化为自带浮层）');
assert.ok(
  bare.record.registrations.some((entry) => entry.spec.name === 'shell.overlay'),
  '没有框架时仍要注册自带浮层（退化路径不能一起没了）',
);
assert.ok(
  bare.record.registrations.some((entry) => entry.spec.name === 'sidebar.footer.action'),
  '额度按钮不依赖 widget-kit：没有框架时也必须注册',
);
assert.equal(bare.record.injections[0]?.[0], 'widgets', '没有框架时也在等 widgets（只是永远等不到）');

/**
 * 用给定配置再启动一份 bundle（全新模块作用域 = 全新 store），返回侧边栏按钮的元素树。
 *
 * 这样能按场景换假 Host 的 `/state`：极简模式、`enabled:false` 的老配置、`refreshSec: 0` …
 * 都需要一个干净的 store 才能验证，而重跑一次 bundle 是最接近真机的做法（与真机上换配置
 * 后重新加载同一条路径）。
 *
 * @param config - 假 Host `/state` 回下发的 config。
 * @param snaps - 假 Host `/state` 回下发的快照表（缺省 = DeepSeek 那份）。
 * @returns 元素树与记录器。
 */
async function bootTree(config, snaps) {
  globalThis.fetch = async (url) => ({
    async json() {
      if (String(url).endsWith('/state')) {
        return { ok: true, config, snaps: snaps ?? { deepseek: DEEPSEEK_SNAP } };
      }
      return { ok: true };
    },
  });
  const exports = loadBundle('../lib/client.js').factory(requireStub);
  const booted = makeCtx({ widgets: service, slots: undefined });
  console.error = (...args) => booted.record.errors.push(args.map(String).join(' '));
  try {
    exports.apply(booted.ctx);
  } finally {
    console.error = originalError;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(booted.record.errors, [], '重新启动一份 bundle 不该有 console.error');
  const reg = booted.record.registrations.find((entry) => entry.spec.name === 'sidebar.footer.action');
  assert.ok(reg, '侧边栏槽位必须注册');
  return { tree: reg.component({ wide: true }), record: booted.record };
}

/** 元素树 → 弹层 props（`detail` + `vendors` 都在它身上）。 */
function panelPropsOf(tree) {
  return collect(
    tree,
    (node) => node.props !== undefined && 'detail' in node.props && 'vendors' in node.props,
  )[0]?.props;
}

// 极简模式（`activeVendor: ''`）：用户明确不要额度显示 → 连按钮一起收起来
const minimalTree = (await bootTree({ version: 1, activeVendor: '', vendors: VENDORS })).tree;
assert.equal(minimalTree, null, '极简模式（activeVendor 为空串且配了供应商）下不该渲染额度按钮');

// 回归：旧配置里的顶层 `enabled: false` **不是**自动刷新开关（Host 侧没有任何代码读它）。
// 真机上它就是 refreshSec: 60 + enabled: false 这种组合 —— 曾经被误判成「自动刷新已关闭」。
const legacyProps = panelPropsOf(
  await bootTree({
    version: 1,
    activeVendor: 'deepseek',
    refreshSec: 60,
    enabled: false,
    vendors: VENDORS,
  }).then((booted) => booted.tree),
);
assert.ok(legacyProps !== undefined, '侧边栏按钮应当照常渲染');
assert.equal(
  String(legacyProps.freshness).includes('自动刷新已关闭'),
  false,
  'refreshSec: 60 时不能在新鲜度里写「自动刷新已关闭」（顶层 enabled 是历史字段，Host 不读）',
);
assert.match(String(legacyProps.freshness), /前|刚刚/, '新鲜度应当只有「多久之前」这一句');

// 真正的关闭：refreshSec: 0 → 「自动刷新已关闭」
const offProps = panelPropsOf(
  await bootTree({ version: 1, activeVendor: 'deepseek', refreshSec: 0, vendors: VENDORS }).then(
    (b) => b.tree,
  ),
);
assert.ok(offProps !== undefined, '关闭自动刷新时按钮仍要在（还能手动拉）');
assert.match(
  String(offProps.freshness),
  /自动刷新已关闭/,
  'refreshSec: 0 时必须写「自动刷新已关闭」，否则用户不知道数字为什么不动了',
);

console.log(
  `宿主桥集成冒烟通过：${String(byOwner.length)} 张统计卡进框架注册表（0 个活动栏图标），` +
    `侧边栏按钮由 provider 模板自由渲染（图表一直在 + 数值位按开关换余额/百分比 + 图标），` +
    `控件画在供应商自己的卡片里（Goat 的余额开关 + 5h/1w/1m）、窄栏是一枚表盘（环当外圈 + 图标居中环心）、` +
    `极简模式收按钮、自动刷新判据只看 refreshSec、退化路径正常`,
);
