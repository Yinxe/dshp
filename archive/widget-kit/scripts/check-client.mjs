#!/usr/bin/env node
/**
 * 无头冒烟测试：把 `lib/client.js` 当 IIFE 跑一遍（不打开浏览器）
 *
 * 覆盖「看不见但错了就白屏」的部分：
 *   1. loader 契约：`__ModuleLoader__.load({ id, factory })` 的 id 与包名一致、`inject` 齐全、
 *      `apply` 在最小 ctx 下不抛；
 *   2. `widgets` 服务**真的发布出去**了，且成员与规范的 `SPEC_KEYS.service` 完全一致；
 *   3. 三个槽位注册（会话顶部托盘 / shell.overlay 卡片层 / 设置节）的 name / id / order；
 *   4. 每个 `ctx.effect` 都带 `dshp-widget-kit:` 前缀（本仓红线：无 label 的 effect 打回）；
 *   5. 描述符校验：12 类非法输入逐个抛中文错误；合法注册 → list() → disposer 清理；
 *   6. 同 id 重注册 = 覆盖（HMR / 重复 apply 的语义）；
 *   7. **渲染一遍**：托盘与卡片层的组件树能真的跑出元素（用 stub 的 React，不画像），
 *      卡片外层几何等于运行时给的矩形 —— 这一步能在没有浏览器的情况下抓住渲染期崩溃；
 *   8. **刷新后恢复**（首帧会话绑定不算切会话）、**最小化胶囊**（宽度随标题自适应、量不到时用地板宽度、
 *      宽度随锁定状态与按钮数变化）、**位置锁定**、**启用 / 禁用**与**常驻 popover**；
 *   9. **拖动模型**：自由跟手 + 允许互相覆盖、吸附候选只画预览虚框、松手才吸附；
 *      手势的 window 兜底监听与「左键已松开」的收尾（治「卡 / 断触 / 松了还在拖」）。
 *
 * 只用 node 内建模块。
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// 胶囊宽度测量是纯函数（只碰传入的元素、它的克隆与 document），直接 import 源码单测它 ——
// 它在无头环境里必须老实返回 null：胶囊据此退回地板宽度，而不是拿猜的宽度把标题截掉。
import { measureHeaderWidth, textOverflowPx } from '../src/client/measure.ts';

/** 版本从 package.json 读（不再手写常量：bump 版本时这里以前会漏改成红色）。 */
const PKG_VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

// ── 最小 React / primitives 替身 ─────────────────────────────────────────
let liveHook = null;

const ReactStub = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  Fragment: 'Fragment',
  Component: class Component {
    constructor(props) {
      this.props = props;
    }
    setState() {}
  },
  useState(initial) {
    if (liveHook !== null)
      return [liveHook.slots.shift() ?? (typeof initial === 'function' ? initial() : initial), () => {}];
    return [typeof initial === 'function' ? initial() : initial, () => {}];
  },
  useEffect: () => {},
  useLayoutEffect: () => {},
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useRef: (initial) => ({ current: initial }),
  /**
   * `useSyncExternalStore` 替身，但**会检查快照稳定性**：真实 React 每次渲染都会调 `getSnapshot()`，
   * 只要连续两次拿到的不是同一个值，就判定「外部数据一直在变」并掉进无限渲染（React error #185）。
   * 这个断言正是为了拦住那类事故 —— 实机上就因为 `getLiveSnap()` 每帧新建对象崩过整个卡片层。
   */
  useSyncExternalStore: (_subscribe, getSnapshot) => {
    const first = getSnapshot();
    const second = getSnapshot();
    if (!Object.is(first, second)) {
      throw new Error(
        'getSnapshot 必须缓存：连续两次调用返回了不同引用 —— 真实 React 会因此无限重渲染（#185）',
      );
    }
    return first;
  },
};

const jsxRuntime = {
  Fragment: 'Fragment',
  jsx: (type, props) => ({ type, props: props ?? {} }),
  jsxs: (type, props) => ({ type, props: props ?? {} }),
};

// React 用这个标记识别 class 组件；我们的极简渲染器也靠它区分「函数组件」与「class 组件」
ReactStub.Component.prototype.isReactComponent = {};

/** primitives 替身：只要能当组件调用即可（渲染树里我们只断言我们自己的节点）。 */
function primitive(name) {
  return (props) => ({ type: name, props: props ?? {} });
}

const primitivesStub = {
  Button: primitive('Button'),
  Menu: primitive('Menu'),
  Tooltip: primitive('Tooltip'),
  Switch: primitive('Switch'),
  Pill: primitive('Pill'),
  StateDot: primitive('StateDot'),
  useAnchoredPosition: () => null,
  useDismissOnOutsidePointer: () => {},
};
void liveHook;

// ── 浏览器环境替身 ───────────────────────────────────────────────────────
const storage = new Map();
/** window 上的监听器登记表：手势的 move / up / cancel 都挂在这里，自检要能手动派发。 */
const windowListeners = new Map();
const windowStub = {
  __ModuleLoader__: {
    load: (entry) => {
      loaded = entry;
    },
  },
  innerWidth: 1280,
  innerHeight: 800,
  addEventListener: (type, handler) => {
    const set = windowListeners.get(type) ?? new Set();
    set.add(handler);
    windowListeners.set(type, set);
  },
  removeEventListener: (type, handler) => {
    windowListeners.get(type)?.delete(handler);
  },
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
};
let loaded = null;

/** rAF 替身：立即执行（手势的每帧合并逻辑因此可以确定性推进）。 */
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 1;
};
globalThis.cancelAnimationFrame = () => {};

/** 把事件派发给所有 window 监听器（手势的兜底监听就是这些）。 */
function fireWindow(type, event) {
  // 先取快照再派发：监听器里可能会把自己摘掉（收尾时 removeEventListener）
  const handlers = Array.from(windowListeners.get(type) ?? []);
  for (const handler of handlers) handler(event);
}

const fetchCalls = [];
globalThis.fetch = async (url, init) => {
  fetchCalls.push({ url, method: init?.method ?? 'GET' });
  return {
    async json() {
      return {
        ok: true,
        version: PKG_VERSION,
        specVersion: 1,
        config: {
          trayEnabled: true,
          maxVisibleIcons: 4,
          badgeIntervalMs: 30000,
          hoverPreview: true,
          referenceWidgets: true,
        },
      };
    },
  };
};

// ── 跑 bundle ────────────────────────────────────────────────────────────
const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');
// eslint-disable-next-line no-new-func -- 自检脚本就是要把产物当脚本求值
new Function('window', source)(windowStub);

assert.ok(loaded !== null, 'bundle 没有调用 window.__ModuleLoader__.load');
assert.equal(loaded.id, '@dshp/widget-kit', 'loader id 必须等于包名');
assert.equal(typeof loaded.factory, 'function');

const requireStub = (spec) => {
  if (spec === 'react') return ReactStub;
  if (spec === 'react/jsx-runtime') return jsxRuntime;
  if (spec === '@deepseek-ai/dsh-client-ui-primitives') return primitivesStub;
  throw new Error(`未预期的运行时依赖：${spec}（本插件运行时零依赖）`);
};

const exportsObject = loaded.factory(requireStub);
assert.deepEqual(exportsObject.inject, ['slots', 'timer'], 'client 半的 inject 必须声明 slots 与 timer');
assert.equal(typeof exportsObject.apply, 'function');

// ── 假 ctx ───────────────────────────────────────────────────────────────
const effects = [];
const provides = [];
const intervals = [];
const timeouts = [];
const injections = [];
const registrations = [];

const slots = {
  inject: (name, callback) => {
    injections.push(name);
    return callback();
  },
  register: (spec, component) => {
    registrations.push({ spec, component });
    return () => {};
  },
};

const ctx = {
  get: (name) => {
    if (name === 'slots') return slots;
    if (name === 'timer') return {};
    return undefined;
  },
  effect: (callback, label) => {
    const result = callback();
    effects.push({ label, dispose: typeof result === 'function' ? result : null });
    return result;
  },
  interval: (callback, ms) => {
    intervals.push(ms);
    void callback;
    return () => {};
  },
  timeout: (callback, ms) => {
    const entry = { callback, ms, cancelled: false, fired: false };
    timeouts.push(entry);
    return () => {
      entry.cancelled = true;
    };
  },
  reflect: {
    provide: (serviceName, value) => {
      provides.push({ serviceName, value });
      return () => {};
    },
  },
};

exportsObject.apply(ctx);

// ── 1. 服务发布 ──────────────────────────────────────────────────────────
assert.equal(provides.length, 1, '必须只发布一个客户端服务');
assert.equal(provides[0].serviceName, 'widgets');
const service = provides[0].value;
const EXPECTED_SERVICE_KEYS = [
  'specVersion',
  'frameworkVersion',
  'register',
  'list',
  'subscribe',
  'open',
  'close',
  'toggle',
  'isOpen',
  'minimize',
  'restore',
  'setEnabled',
  'isEnabled',
  'setLocked',
  'isLocked',
];
const actualServiceKeys = Object.keys(service);
actualServiceKeys.sort();
const expectedServiceKeys = [...EXPECTED_SERVICE_KEYS];
expectedServiceKeys.sort();
assert.deepEqual(actualServiceKeys, expectedServiceKeys, 'widgets 服务的成员必须与 SPEC_KEYS.service 一致');
assert.equal(service.specVersion, 1);
assert.equal(service.frameworkVersion, PKG_VERSION);

// ── 2. 槽位注册 ──────────────────────────────────────────────────────────
assert.deepEqual(injections, ['conversation.session.header.utilities', 'shell.overlay', 'settings.section']);
const bySlot = new Map(registrations.map((entry) => [entry.spec.name, entry.spec]));
assert.deepEqual(bySlot.get('conversation.session.header.utilities'), {
  name: 'conversation.session.header.utilities',
  id: 'dshp-widget-kit-tray',
  order: 30,
  label: '小组件',
});
assert.deepEqual(bySlot.get('shell.overlay'), {
  name: 'shell.overlay',
  id: 'dshp-widget-kit-cards',
  order: 10,
  label: '小组件卡片',
});
assert.deepEqual(bySlot.get('settings.section'), {
  name: 'settings.section',
  id: 'dshp-widget-kit',
  order: 32,
  label: '小组件',
});

// ── 3. effect 全带 label（本仓红线）──────────────────────────────────────
for (const entry of effects) {
  assert.ok(
    typeof entry.label === 'string' && entry.label.startsWith('dshp-widget-kit:'),
    `effect 缺少 'dshp-widget-kit:' 前缀：${String(entry.label)}`,
  );
}
assert.ok(effects.length >= 8, `effect 数量太少（${String(effects.length)}），装配可能被吞掉了`);
assert.ok(intervals.includes(1000), '徽标调度必须挂在 1s 的 ctx.interval 上');
const timeoutMs = timeouts.map((entry) => entry.ms);
assert.ok(timeoutMs.includes(3000), '偏好读取必须有兜底超时（否则托盘可能一直不渲染）');
assert.ok(
  !timeoutMs.includes(5000),
  '不得再有「启动 5 秒后自动清理残留」：插件热重载时组件会短暂不在册，自动清理会把开发中的布局误删',
);

/** 把指定延时的挂起任务「到点」（悬停展开/收起是定时器驱动的，自检里要能确定性地推进它）。 */
function fireTimeouts(ms) {
  for (const entry of timeouts) {
    if (entry.ms !== ms || entry.fired || entry.cancelled) continue;
    entry.fired = true;
    entry.callback();
  }
}

// ── 4. 描述符校验（12 类非法输入）───────────────────────────────────────
const base = { id: 'demo:thing', title: 'T', icon: 'i', presentation: 'tray' };
const invalidCases = [
  ['descriptor 不是对象', null],
  ['缺 id', { title: 'T', icon: 'i', presentation: 'tray' }],
  ['id 格式不对', { ...base, id: 'nope' }],
  ['缺 title', { id: 'demo:thing', icon: 'i', presentation: 'tray' }],
  ['缺 icon', { id: 'demo:thing', title: 'T', presentation: 'tray' }],
  ['presentation 非法', { ...base, presentation: 'window' }],
  ['card 缺 content.render', { ...base, presentation: 'card' }],
  ['tray 带 content', { ...base, content: { render: () => null } }],
  ['badge 不是函数', { ...base, tray: { badge: 1 } }],
  ['badgeIntervalMs 越界', { ...base, tray: { badgeIntervalMs: 10 } }],
  [
    'card.minSize 小于地板',
    { ...base, presentation: 'card', content: { render: () => null }, card: { minSize: { w: 10, h: 10 } } },
  ],
  [
    'sizeClassBreakpoints 反了',
    {
      ...base,
      presentation: 'card',
      content: { render: () => null },
      card: { sizeClassBreakpoints: { compact: 600, wide: 300 } },
    },
  ],
  ['minFramework 高于当前', { ...base, minFramework: '9.0.0' }],
  [
    'popover.trigger 非法',
    { ...base, presentation: 'popover', content: { render: () => null }, popover: { trigger: 'tap' } },
  ],
  [
    'popover.width 太窄',
    { ...base, presentation: 'popover', content: { render: () => null }, popover: { width: 100 } },
  ],
  [
    'popover.padding 过大',
    { ...base, presentation: 'popover', content: { render: () => null }, popover: { padding: 99 } },
  ],
  [
    'popover.hoverOpenDelayMs 过大',
    {
      ...base,
      presentation: 'popover',
      content: { render: () => null },
      popover: { hoverOpenDelayMs: 9999 },
    },
  ],
  [
    'card 用 popover 配置',
    { ...base, presentation: 'card', content: { render: () => null }, popover: { trigger: 'hover' } },
  ],
];
for (const [label, input] of invalidCases) {
  assert.throws(
    () => service.register(input),
    (error) => {
      assert.ok(error instanceof Error, `${label}: 必须抛 Error`);
      assert.match(error.message, /小组件描述符不合法/, `${label}: 错误信息必须是中文可操作的`);
      return true;
    },
    `${label} 必须被拒绝`,
  );
}

// ── 5. 合法注册 / 列表 / 清理 ───────────────────────────────────────────
const popoverWidget = {
  id: 'demo:quick',
  title: '快捷设置',
  icon: 'i',
  presentation: 'popover',
  content: { render: () => null },
};
const disposePopover = service.register(popoverWidget);
assert.deepEqual(
  service
    .list()
    .map((item) => item.id)
    .includes('demo:quick'),
  true,
  '注册后必须出现在 list() 里',
);
// 同 id 重注册 = 覆盖（不抛）
assert.doesNotThrow(() => service.register({ ...popoverWidget, title: '快捷设置 v2' }));
assert.equal(service.list().filter((item) => item.id === 'demo:quick').length, 1, '同 id 只能有一条');
disposePopover();
assert.equal(
  service.list().some((item) => item.id === 'demo:quick'),
  false,
  'disposer 必须把组件摘掉',
);

// ── 6. 打开 / 最小化 / 还原语义（card）──────────────────────────────────
const cardWidget = {
  id: 'demo:card',
  title: '卡片示例',
  icon: 'i',
  presentation: 'card',
  content: { render: () => null },
  card: { defaultSize: { w: 360, h: 240 } },
};
const disposeCard = service.register(cardWidget);
assert.equal(service.isOpen('demo:card'), false);
service.open('demo:card');
assert.equal(service.isOpen('demo:card'), true, 'open 之后必须 isOpen');
service.minimize('demo:card');
service.restore('demo:card');
assert.equal(service.isOpen('demo:card'), true, 'restore 之后必须仍然 open');
service.close('demo:card');
assert.equal(service.isOpen('demo:card'), false, 'close 之后必须 isOpen=false');

// ── 7. 宿主偏好：读取路由 + 参考组件自动装载 ─────────────────────────────
await new Promise((resolve) => setTimeout(resolve, 0));
assert.ok(
  fetchCalls.some((call) => call.url === '/ext/dshp-widget-kit/state' && call.method === 'GET'),
  `必须从 GET /ext/dshp-widget-kit/state 读偏好，实际：${JSON.stringify(fetchCalls)}`,
);
const ids = service.list().map((item) => item.id);
assert.ok(ids.includes('dshp-widget-kit:clock'), '参考组件「时钟」必须自动注册');
assert.ok(ids.includes('dshp-widget-kit:registry'), '参考组件「组件诊断」必须自动注册');
assert.ok(ids.includes('dshp-widget-kit:quick'), '参考组件「快速设置」（点击 popover）必须自动注册');
assert.ok(ids.includes('dshp-widget-kit:status'), '参考组件「状态速览」（悬停 popover）必须自动注册');
assert.ok(ids.includes('dshp-widget-kit:box'), '参考组件「组件箱」（菜单挂多个卡片）必须自动注册');

// 活动栏文字扩展点 + 「不占图标」的卡片：两者的描述符必须被规范化对
const refs = new Map(service.list().map((item) => [item.id, item]));
assert.equal(refs.get('dshp-widget-kit:box').presentation, 'popover');

// 两个参考 popover 的形态：点击 vs 悬停、header / padding 的差异必须真的在描述符里
const referenceWidgets = new Map(service.list().map((item) => [item.id, item]));
assert.equal(referenceWidgets.get('dshp-widget-kit:quick').presentation, 'popover');
assert.equal(referenceWidgets.get('dshp-widget-kit:status').presentation, 'popover');

// ── 8. 渲染一遍：托盘 + 卡片层 ──────────────────────────────────────────
/** 极简渲染：只调用函数组件、不执行 effect、不画像。 */
function render(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (Array.isArray(node)) return node.map(render);
  if (typeof node === 'string' || typeof node === 'number') return node;
  if (typeof node.type === 'function') {
    // class 组件（本插件只有一个：错误边界）必须 new 出来再 render
    if (node.type.prototype !== undefined && node.type.prototype.isReactComponent !== undefined) {
      return render(new node.type(node.props).render());
    }
    return render(node.type(node.props));
  }
  return { type: node.type, props: node.props ?? {}, children: render(node.props?.children ?? null) };
}

/** 深度优先收集所有宿主节点。 */
function collect(node, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out);
    return out;
  }
  if (typeof node.type === 'string') out.push(node);
  collect(node.children, out);
  return out;
}

const trayEntry = registrations.find((entry) => entry.spec.name === 'conversation.session.header.utilities');
const layerEntry = registrations.find((entry) => entry.spec.name === 'shell.overlay');

const trayElement = trayEntry.component({ sessionId: 'session-demo' });
/** 组件注册时我们注入的运行时（自检里用它驱动几何，等价于用户拖拽/菜单操作）。 */
const runtime = trayElement.props.runtime;
assert.equal(typeof runtime.resizeTo, 'function', '托盘应拿到运行时');
const trayTree = render(trayElement);
const trayNodes = collect(trayTree);
const trayButtons = trayNodes.filter(
  (node) => node.type === 'button' && typeof node.props['aria-label'] === 'string',
);
assert.ok(
  trayButtons.some((button) => button.props['aria-label'] === '时钟'),
  `托盘里应有「时钟」图标，实际：${JSON.stringify(trayButtons.map((b) => b.props['aria-label']))}`,
);

service.open('dshp-widget-kit:clock');
const layerTree = render(layerEntry.component({}));
const layerNodes = collect(layerTree);
const cardNode = layerNodes.find((node) => node.props['data-widget'] === 'dshp-widget-kit:clock');
assert.ok(cardNode, '打开时钟后卡片层必须渲染出它的卡片');
assert.equal(cardNode.props.style.width, 320, '卡片宽度必须等于描述符的 defaultSize');
assert.equal(cardNode.props.style.height, 220, '卡片高度必须等于描述符的 defaultSize');
assert.equal(cardNode.props.style.zIndex, 1, '第一张卡片的层内 z-index 应为 1');
assert.equal(cardNode.props.role, 'dialog');
assert.equal(cardNode.props['aria-label'], '时钟');

// 拖拽把手的数量必须是 8（四边 + 四角）
const handles = layerNodes.filter((node) => node.props['data-dir'] !== undefined);
assert.equal(handles.length, 8, `缩放把手必须是 8 个，实际 ${String(handles.length)}`);

// 内容盒事实交出去了：宽 320 − 20 内边距 = 300 → 时钟自己的阈值（compact 300 / wide 420）
assert.equal(cardNode.props['data-size-class'], 'regular', '默认尺寸应对应 regular');

/** 尺寸变化后「怎么呈现」由提供方决定 —— 这里验证框架把新尺寸如实转达。 */
function cardSizeClass() {
  const nodes = collect(render(layerEntry.component({})));
  const card = nodes.find((node) => node.props['data-widget'] === 'dshp-widget-kit:clock');
  assert.ok(card, '卡片应仍在');
  return card.props['data-size-class'];
}
runtime.resizeTo('dshp-widget-kit:clock', { w: 260, h: 200 });
assert.equal(cardSizeClass(), 'compact', '缩到最窄应变成 compact');
runtime.resizeTo('dshp-widget-kit:clock', { w: 460, h: 320 });
assert.equal(cardSizeClass(), 'wide', '拉宽应变成 wide');
runtime.resizeTo('dshp-widget-kit:clock', { w: 320, h: 220 });
assert.equal(cardSizeClass(), 'regular', '回到默认尺寸应回到 regular');

// 卡片菜单里必须有键盘可达的尺寸子菜单项（a11y 路径）
const menuNodes = layerNodes.filter((node) => node.type === 'Menu');
assert.ok(menuNodes.length >= 1, '卡片标题栏必须有 ⋯ 菜单');

disposeCard();

// ── 9. popover：点击展开 vs 悬停展开 ─────────────────────────────────────
const clickPopover = {
  id: 'demo:quick',
  title: '快捷设置',
  icon: 'i',
  presentation: 'popover',
  popover: { trigger: 'click' },
  content: { render: () => null },
};
const hoverPopover = {
  id: 'demo:hover',
  title: '悬停面板',
  icon: 'i',
  presentation: 'popover',
  popover: {
    trigger: 'hover',
    hoverOpenDelayMs: 50,
    hoverCloseDelayMs: 60,
    header: false,
    padding: 0,
    width: 520,
  },
  content: { render: () => null },
};
const disposeClick = service.register(clickPopover);
const disposeHover = service.register(hoverPopover);

// 点击触发：悬停不该打开它
runtime.hoverEnter('demo:quick');
fireTimeouts(50);
assert.equal(service.isOpen('demo:quick'), false, "trigger: 'click' 的组件不该被悬停打开");
service.toggle('demo:quick');
assert.equal(service.isOpen('demo:quick'), true);
assert.equal(runtime.getSnapshot().transientOrigin, 'click');

// 单开：悬停展开另一个会收起它
runtime.hoverEnter('demo:hover');
assert.equal(service.isOpen('demo:hover'), false, '悬停展开要留 hoverOpenDelayMs');
fireTimeouts(50);
assert.equal(service.isOpen('demo:hover'), true, '延迟到点必须展开');
assert.equal(service.isOpen('demo:quick'), false, '同一时刻只能展开一个 popover');
assert.equal(runtime.getSnapshot().transientOrigin, 'hover');

// 悬停收起：留宽限，宽限内回到面板则撤销
runtime.hoverLeave('demo:hover');
assert.equal(service.isOpen('demo:hover'), true, '收起要留 hoverCloseDelayMs');
runtime.hoverEnter('demo:hover');
fireTimeouts(60);
assert.equal(service.isOpen('demo:hover'), true, '① 宽限内回到面板必须撤销收起');
runtime.hoverLeave('demo:hover');
fireTimeouts(60);
assert.equal(service.isOpen('demo:hover'), false, '② 真正离开后必须收起');

// 悬停面板的形态选项真的落到 DOM 上（任意 web 视图要能贴边）
runtime.hoverEnter('demo:hover');
fireTimeouts(50);
const popoverNodes = collect(render(layerEntry.component({})));
const panel = popoverNodes.find((node) => node.props['data-widget'] === 'demo:hover');
assert.ok(panel, '悬停展开后必须渲染出面板');
assert.equal(panel.props.style.width, 520, 'popover.width 必须落到面板宽度');
assert.equal(panel.props['data-trigger'], 'hover');
assert.equal(panel.props['aria-label'], '悬停面板');
const bodyNode = popoverNodes.find(
  (node) => typeof node.props.className === 'string' && node.props.className.includes('popoverBody'),
);
assert.ok(bodyNode, '面板必须有 body');
assert.equal(bodyNode.props.style.padding, 0, 'popover.padding: 0 必须落到 body（贴边渲染）');
assert.ok(
  !popoverNodes.some(
    (node) => typeof node.props.className === 'string' && node.props.className.includes('popoverHeader'),
  ),
  'popover.header: false 时不得渲染框架标题栏',
);

// 关闭要清掉挂起的悬停定时器：关掉后即使定时器到点也不该再自己蹦出来
runtime.hoverLeave('demo:hover');
service.close('demo:hover');
fireTimeouts(60);
assert.equal(service.isOpen('demo:hover'), false, '关闭后必须清掉待收起的定时器');
runtime.hoverEnter('demo:hover');
fireTimeouts(50);
service.toggle('demo:hover');
assert.equal(service.isOpen('demo:hover'), false, 'toggle 关闭后必须清掉待展开的定时器');
fireTimeouts(50);
assert.equal(service.isOpen('demo:hover'), false, '被取消的展开定时器不得生效');

// 悬停展开的参考面板：header: false + padding: 0（整块归提供方）
runtime.hoverEnter('dshp-widget-kit:status');
fireTimeouts(80);
assert.equal(service.isOpen('dshp-widget-kit:status'), true, '悬停 80ms 后参考面板应展开');
const statusNodes = collect(render(layerEntry.component({})));
const statusPanel = statusNodes.find((node) => node.props['data-widget'] === 'dshp-widget-kit:status');
assert.ok(statusPanel, '状态速览必须渲染出面板');
assert.equal(statusPanel.props['data-trigger'], 'hover');
assert.equal(statusPanel.props.style.width, 260, '状态速览的 width 必须生效');
assert.ok(
  !statusNodes.some(
    (node) =>
      typeof node.props.className === 'string' &&
      node.props.className.includes('popoverHeader') &&
      node.props['data-widget'] !== 'demo:hover',
  ),
  'header: false 的参考面板不得画框架标题栏',
);
const statusBody = statusNodes.find(
  (node) => typeof node.props.className === 'string' && node.props.className.includes('popoverBody'),
);
assert.equal(statusBody.props.style.padding, 0, 'padding: 0 必须落到 body');
runtime.hoverLeave('dshp-widget-kit:status');
fireTimeouts(220);
assert.equal(service.isOpen('dshp-widget-kit:status'), false, '移开后参考面板应收起');

// 点击展开的参考面板：不带悬停行为，点开/再点关
runtime.hoverEnter('dshp-widget-kit:quick');
fireTimeouts(80);
assert.equal(service.isOpen('dshp-widget-kit:quick'), false, '点击展开的参考面板不该被悬停打开');
service.toggle('dshp-widget-kit:quick');
assert.equal(service.isOpen('dshp-widget-kit:quick'), true);
service.toggle('dshp-widget-kit:quick');
assert.equal(service.isOpen('dshp-widget-kit:quick'), false);

disposeClick();
disposeHover();

// ── 10. 本轮修复：刷新恢复 / 最小化折叠 / 位置锁定 / 启用禁用 / 常驻面板 ──
const STORE_KEY = 'dshp-widget-kit:v1';
const persisted = () => JSON.parse(storage.get(STORE_KEY));

/** 记录每个组件最近一次拿到的内容 props（用来断言「交出去的事实」）。 */
const seenProps = new Map();

/** 造一个内容可辨认的卡片组件（内容面会在最小化时留在树上，所以在树里能查到一个探针节点）。 */
function makeCard(id, title) {
  return {
    id,
    title,
    icon: 'i',
    presentation: 'card',
    content: {
      render: (props) => {
        seenProps.set(id, props);
        return { type: 'span', props: { 'data-probe': id } };
      },
    },
    card: { defaultSize: { w: 360, h: 240 } },
  };
}

const cardA = makeCard('demo:persist', '持久卡片');
const cardB = makeCard('demo:lock', '锁定卡片');
const disposeA = service.register(cardA);
let disposeB = service.register(cardB);
// 这一段会注册不少组件，把可见图标上限抬上去 —— 否则断言的对象都被挤进溢出菜单了
void runtime.setPrefs({ maxVisibleIcons: 12 });

/** 按 data-widget 找卡片根节点。 */
function cardNodeOf(id) {
  return collect(render(layerEntry.component({}))).find((node) => node.props['data-widget'] === id);
}

/** 按 data-widget 找 popover 面板节点。 */
function panelNodeOf(id) {
  return collect(render(layerEntry.component({}))).find((node) => node.props['data-widget'] === id);
}

// 10.1 打开后落盘：卡片矩形、层叠顺序、打开状态都要进本机布局（刷新后靠它恢复）
service.open('demo:persist');
runtime.saveNow();
assert.equal(persisted().cards['demo:persist'].open, true, '打开状态必须落盘（否则刷新就没了）');
assert.equal(
  persisted().zOrder.at(-1),
  'demo:persist',
  '层叠顺序必须落盘（末尾 = 最上层，恢复出来才不会所有卡片 z-index 都是 1）',
);
assert.equal(runtime.getSnapshot().zOrder.includes('demo:persist'), true);

// 10.2 首帧拿到会话**不算切会话**：托盘带 sessionId 挂载时不能再把恢复出来的卡片关掉
runtime.setSession('session-one');
assert.equal(runtime.getSession(), 'session-one');
assert.equal(
  service.isOpen('demo:persist'),
  true,
  '首帧会话绑定不得关掉已恢复的卡片（旧实现每次刷新都清空）',
);
// 真的换会话才收起（v1 语义：内容面绑定开启它的会话）
runtime.setSession('session-two');
assert.equal(service.isOpen('demo:persist'), false, '换会话必须收起内容面');
runtime.setSession('session-one');

// 10.3 最小化 = 折叠成标题栏：不是「留一个空窗口」
service.open('demo:lock');
runtime.minimize('demo:lock');
const miniCard = cardNodeOf('demo:lock');
assert.ok(miniCard, '最小化后卡片仍然存在（不是关闭）');
assert.equal(miniCard.props.style.height, 36, '最小化必须折叠成标题栏高度');
assert.equal(miniCard.props['data-minimized'], 'true');
const miniBody = collect(render(layerEntry.component({}))).find(
  (node) => typeof node.props.className === 'string' && node.props.className.includes('cardBody'),
);
assert.ok(
  miniBody.props.className.includes('cardBodyHidden'),
  '最小化时内容区必须隐藏（但留在树上，还原即时且不丢内部状态）',
);
assert.ok(
  collect(render(layerEntry.component({}))).some((node) => node.props['data-probe'] === 'demo:lock'),
  '最小化不得卸载内容面（这是「内容一片空白」的正解：折叠而不是抽空）',
);
const miniProps = seenProps.get('demo:lock');
assert.equal(miniProps.minimized, true, '内容必须知道自己在最小化状态');
assert.ok(
  miniProps.size !== null && miniProps.size.height > 0 && miniProps.size.width > 0,
  `最小化不得把「内容盒尺寸」交成负数（实际 ${JSON.stringify(miniProps.size)}）`,
);
runtime.restore('demo:lock');
const restoredCard = cardNodeOf('demo:lock');
assert.equal(restoredCard.props.style.height, 240, '还原必须回到原来的高度');
assert.equal(restoredCard.props['data-minimized'], 'false');

// 10.3b 最小化 = 胶囊：宽度**按标题与控件算**（而不是固定压到某个宽度），布局里的展开尺寸不动
runtime.minimize('demo:lock');
const capsule = runtime.rectOf('demo:lock');
assert.equal(runtime.getSnapshot().layout.cards['demo:lock'].minimized, true, '前置：先最小化');
// 无头环境没有 DOM：Card 量不到「胶囊需要多宽」、也就没回报 → 用地板宽度兜底（而不是算出一枚 0 宽胶囊）
let capsuleWidth = 160; // SPEC_DEFAULTS.capsule.minWidth
assert.deepEqual(runtime.rectOf('demo:lock'), capsule, '胶囊尺寸不得改动布局里的矩形');
assert.deepEqual(
  runtime.visualRectOf('demo:lock'),
  { x: capsule.x, y: capsule.y, w: capsuleWidth, h: 36 },
  '还没量到标题时是一枚 160×36 的地板胶囊',
);
// 键盘移动：只改位置，展开尺寸留着
runtime.nudge('demo:lock', 10, 6);
assert.deepEqual(runtime.rectOf('demo:lock'), {
  ...capsule,
  x: capsule.x + 10,
  y: capsule.y + 6,
});
// 拖动提交：同样只取位置
runtime.beginLive('demo:lock', 'move');
runtime.setLive('demo:lock', { x: 400, y: 300, w: capsuleWidth, h: 36 });
runtime.commitLive('demo:lock');
assert.deepEqual(runtime.rectOf('demo:lock'), {
  ...capsule,
  x: 400,
  y: 300,
});
assert.deepEqual(runtime.visualRectOf('demo:lock'), { x: 400, y: 300, w: capsuleWidth, h: 36 });
// 胶囊参与吸附：按胶囊宽度算（而不是展开宽度）
const capsuleSnap = runtime.getLiveSnap();
assert.equal(capsuleSnap, null, '此时没有手势，也就没有预览');
// 卡片渲染：最小化时宽度必须是**显式长度**（长度 ↔ auto 不可插值，会瞬移），高度是标题栏高度
const capsuleNode = cardNodeOf('demo:lock');
assert.equal(capsuleNode.props.style.width, capsuleWidth, '最小化时必须给显式宽度（不能用 auto）');
assert.equal(capsuleNode.props.style.height, 36, '最小化时高度 = 标题栏高度');
assert.equal(capsuleNode.props.style.maxWidth, undefined, '不用 max-width 撑内容：宽度是算出来的长度');

// 10.3c 量到「胶囊需要多宽」之后：胶囊**照它自适应**（不再固定压在 160px 上把标题挤成省略号）
// 运行时不做任何「内边距 + 标题 + 按钮」的加法：回报多少就是需要多少，它只加余量 + 夹紧。
// 余量 6px 见 geometry.CAPSULE_SLACK（整数取整 / 边框 / 字体换装的 1px 级误差）。
runtime.reportCapsuleNeed('demo:lock', 244);
assert.equal(
  runtime.visualRectOf('demo:lock').w,
  250,
  '胶囊宽度 = 量到的需要 + 余量（再夹在 [地板, 布局宽度] 之间）',
);
assert.ok(runtime.visualRectOf('demo:lock').w > 160, '需要比地板宽时胶囊就得比地板宽 —— 否则标题又被挤掉');
assert.equal(
  cardNodeOf('demo:lock').props.style.width,
  runtime.visualRectOf('demo:lock').w,
  '渲染与几何必须是同一个数（两边都调 runtime.capsuleWidthOf）',
);
// 需要更宽 → 胶囊更宽（自适应，不是固定宽度）
runtime.reportCapsuleNeed('demo:lock', 312);
assert.equal(runtime.visualRectOf('demo:lock').w, 318);
// 需要比地板窄 → 回到地板宽度（再短也给得出手，不是无限缩）
runtime.reportCapsuleNeed('demo:lock', 20);
assert.equal(runtime.visualRectOf('demo:lock').w, 160, '需要很窄时用地板宽度（地板值本身不加余量）');
// 上限是用户自己选的展开宽度：需要再大，胶囊也不比卡片宽（多出来的部分才交给省略号）
runtime.reportCapsuleNeed('demo:lock', 900);
assert.equal(runtime.visualRectOf('demo:lock').w, capsule.w, '胶囊不得超过布局里的展开宽度');
// 锁定后标题栏只剩「解锁 + ⋯」→ Card 会重量一次、回报更小的需要；这里验「报小就变窄」
runtime.reportCapsuleNeed('demo:lock', 272);
assert.equal(runtime.visualRectOf('demo:lock').w, 278, '回报的需要小了（控件少了），胶囊就窄');
runtime.reportCapsuleNeed('demo:lock', 312);
// 卸载 → 重新注册：量到的需要一并丢掉（不许上一版的宽度决定这一版的胶囊）
disposeB();
assert.equal(runtime.visualRectOf('demo:lock').w, 160, '卸载后量到的需要一并丢掉，退回地板宽度');
disposeB = service.register(cardB);
assert.equal(
  runtime.visualRectOf('demo:lock').w,
  160,
  '重新注册后仍等 Card 重新量（Card 的 effect 依赖里带 widget 对象，重注册会重新量一次）',
);
runtime.reportCapsuleNeed('demo:lock', 312);
assert.equal(runtime.visualRectOf('demo:lock').w, 318, '重新量到之后恢复自适应');
// 脏输入：负数 / NaN 不得把胶囊算坏（当作没量到）
runtime.reportCapsuleNeed('demo:lock', Number.NaN);
runtime.reportCapsuleNeed('demo:lock', -30);
assert.equal(runtime.visualRectOf('demo:lock').w, 318, '非法宽度不许覆盖已量到的值');
// 真的改布局宽度：胶囊仍然夹在 [地板, 布局宽度] 里，且不得改动布局里的展开高度
runtime.resizeTo('demo:lock', { w: 300, h: 240 });
assert.equal(cardNodeOf('demo:lock').props.style.width, 300, '布局宽度 < 需要宽度时，胶囊就用布局宽度');
runtime.resizeTo('demo:lock', { w: capsule.w, h: capsule.h });
assert.equal(cardNodeOf('demo:lock').props.style.width, 318);
// 还原：展开尺寸必须原样回来
runtime.restore('demo:lock');
assert.deepEqual(runtime.rectOf('demo:lock'), { ...capsule, x: 400, y: 300 }, '还原后仍是展开尺寸');
assert.equal(runtime.visualRectOf('demo:lock').w, capsule.w, '展开后按布局矩形算');
assert.equal(cardNodeOf('demo:lock').props.style.width, capsule.w, '展开后写回宽度');

// 10.4 位置锁定：几何动作全部无效，最小化 / 关闭照常
const rectBefore = runtime.rectOf('demo:lock');
runtime.setLocked('demo:lock', true);
assert.equal(runtime.isLocked('demo:lock'), true);
assert.equal(cardNodeOf('demo:lock').props['data-locked'], 'true');
assert.equal(seenProps.get('demo:lock').locked, true, '锁定状态必须告诉内容提供方');
runtime.nudge('demo:lock', 40, 40);
runtime.nudgeResize('demo:lock', 80, 80);
runtime.resizeTo('demo:lock', { w: 520, h: 400 });
runtime.requestSize('demo:lock', { w: 520, h: 400 });
runtime.center('demo:lock');
assert.deepEqual(runtime.rectOf('demo:lock'), rectBefore, '锁定后移动 / 缩放 / 居中都必须无效');
runtime.beginLive('demo:lock', 'move');
assert.equal(runtime.getLive(), null, '锁定后不得进入拖拽（不会有 live 几何）');

// 锁定的卡片不给几何菜单项（点了没反应是最糟的交互）
const lockedMenu = collect(render(layerEntry.component({}))).find((node) => node.type === 'Menu');
const lockedItems = lockedMenu.props.items.map((item) => item.id);
assert.ok(lockedItems.includes('lock'), '菜单里必须有锁定项');
assert.ok(lockedItems.includes('minimize'), '锁定后仍要能最小化');
assert.ok(
  !lockedItems.some((id) => typeof id === 'string' && id.startsWith('size:')),
  '锁定后不得出现尺寸预设',
);
assert.ok(!lockedItems.includes('center'), '锁定后不得出现居中');
assert.equal(
  lockedMenu.props.items.find((item) => item.id === 'lock').label,
  '解锁位置',
  '已锁定时要把动作说清楚',
);
// 最小化仍然可用
runtime.minimize('demo:lock');
assert.equal(runtime.getSnapshot().layout.cards['demo:lock'].minimized, true, '锁定后仍可最小化');
runtime.restore('demo:lock');
runtime.saveNow();
assert.equal(persisted().cards['demo:lock'].locked, true, '锁定状态必须落盘（刷新后还是锁的）');

runtime.setLocked('demo:lock', false);
runtime.nudge('demo:lock', 16, 0);
assert.equal(runtime.rectOf('demo:lock').x, rectBefore.x + 16, '解锁后必须能再移动');
const freeItems = collect(render(layerEntry.component({})))
  .find((node) => node.type === 'Menu')
  .props.items.map((item) => item.id);
assert.ok(
  freeItems.some((id) => typeof id === 'string' && id.startsWith('size:')),
  '解锁后尺寸预设必须回来',
);

// 10.5 动态启用 / 禁用：图标、卡片、内容面、徽标一并停用，注册记录与布局保留
runtime.setBadge('demo:persist', { text: '3', tone: 'info' });
assert.ok(runtime.getSnapshot().badges['demo:persist'], '前置条件：有徽标');
service.setEnabled('demo:persist', false);
assert.equal(service.isEnabled('demo:persist'), false);
assert.equal(service.isOpen('demo:persist'), false, '禁用必须把已打开的卡片收起来');
assert.equal(runtime.getSnapshot().badges['demo:persist'], undefined, '禁用必须清掉徽标');
assert.equal(
  service.list().some((item) => item.id === 'demo:persist'),
  true,
  '禁用只是停用：注册记录必须留着，否则无法再启用',
);
const trayAfterDisable = collect(render(trayEntry.component({ sessionId: 'session-one' })));
assert.ok(
  !trayAfterDisable.some((node) => node.props['aria-label'] === '持久卡片'),
  '禁用的组件不得出现在托盘',
);
assert.ok(
  !collect(render(layerEntry.component({}))).some((node) => node.props['data-widget'] === 'demo:persist'),
  '禁用的组件不得渲染卡片或面板',
);
runtime.saveNow();
assert.deepEqual(persisted().disabled, ['demo:persist'], '禁用状态必须落盘');
assert.equal(persisted().cards['demo:persist'].open, false, '禁用时卡片要收起来（布局仍保留）');

service.setEnabled('demo:persist', true);
assert.equal(service.isEnabled('demo:persist'), true);
assert.ok(
  collect(render(trayEntry.component({ sessionId: 'session-one' }))).some(
    (node) => node.props['aria-label'] === '持久卡片',
  ),
  '重新启用后图标必须回来',
);
runtime.saveNow();
assert.deepEqual(persisted().disabled, [], '启用后必须从禁用集合里移除');

// 禁用当前展开的面板：面板立刻收起
service.toggle('dshp-widget-kit:quick');
assert.equal(service.isOpen('dshp-widget-kit:quick'), true);
service.setEnabled('dshp-widget-kit:quick', false);
assert.equal(service.isOpen('dshp-widget-kit:quick'), false, '禁用必须收起它的面板');
service.setEnabled('dshp-widget-kit:quick', true);

// 10.6 常驻面板（popover.persistent）：不受外部操作影响，只认明确的关闭意图
const pinnedClick = {
  id: 'demo:pinned',
  title: '常驻面板',
  icon: 'i',
  presentation: 'popover',
  popover: { trigger: 'click', width: 280, persistent: true },
  content: { render: () => null },
};
const pinnedHover = {
  id: 'demo:pinned-hover',
  title: '常驻悬停面板',
  icon: 'i',
  presentation: 'popover',
  popover: { trigger: 'hover', hoverOpenDelayMs: 40, hoverCloseDelayMs: 40, persistent: true },
  content: { render: () => null },
};
const disposePinned = service.register(pinnedClick);
const disposePinnedHover = service.register(pinnedHover);

service.toggle('demo:pinned');
assert.equal(service.isOpen('demo:pinned'), true);
const pinnedPanel = panelNodeOf('demo:pinned');
assert.equal(pinnedPanel.props['data-persistent'], 'true', '常驻标记必须落到面板上');
assert.ok(
  collect(render(layerEntry.component({}))).some(
    (node) => typeof node.props.className === 'string' && node.props.className.includes('popoverPinned'),
  ),
  '常驻面板必须在标题栏标出来',
);
runtime.saveNow();
assert.equal(persisted().popoverId, 'demo:pinned', '展开的面板必须落盘（刷新后原地恢复）');
assert.equal(persisted().popoverOrigin, 'click');
// 明确的关闭意图仍然有效
service.toggle('demo:pinned');
assert.equal(service.isOpen('demo:pinned'), false, '再点一次图标必须能关掉常驻面板');

// 悬停式常驻：指针移开也不收起（这是「持续显示」与普通悬停面板的唯一差别）
runtime.hoverEnter('demo:pinned-hover');
fireTimeouts(40);
assert.equal(service.isOpen('demo:pinned-hover'), true);
runtime.hoverLeave('demo:pinned-hover');
fireTimeouts(40);
assert.equal(service.isOpen('demo:pinned-hover'), true, '常驻面板不得因指针移开而收起');
service.close('demo:pinned-hover');
assert.equal(service.isOpen('demo:pinned-hover'), false, '显式 close 必须能关掉它');

// 常驻层是手风琴：展开另一个常驻面板会先收起上一个
service.toggle('demo:pinned');
assert.equal(service.isOpen('demo:pinned'), true);
service.toggle('demo:pinned-hover');
assert.equal(service.isOpen('demo:pinned-hover'), true, '第二个常驻面板要能展开');
assert.equal(service.isOpen('demo:pinned'), false, '手风琴：同一时刻只留一个常驻面板');
// 常驻层与临时层可以**同时**展开（本次需求的核心：悬停速览不得收起常驻面板）
const peek = {
  id: 'demo:peek',
  title: '悬停速览',
  icon: 'i',
  presentation: 'popover',
  popover: { trigger: 'hover', hoverOpenDelayMs: 40, hoverCloseDelayMs: 40 },
  content: { render: () => null },
};
const disposePeek = service.register(peek);
const disposePinnedWidget = service.register(pinnedClick);
void disposePinnedWidget;
service.toggle('demo:pinned');
assert.equal(service.isOpen('demo:pinned'), true, '常驻面板先展开');
runtime.hoverEnter('demo:peek');
fireTimeouts(40);
assert.equal(service.isOpen('demo:peek'), true, '临时面板（悬停速览）可以同时展开');
assert.equal(service.isOpen('demo:pinned'), true, '悬停展开临时面板不得收起常驻面板');
const bothPanels = collect(render(layerEntry.component({})))
  .filter((node) => typeof node.props['data-widget'] === 'string' && node.props.className.includes('popover'))
  .map((node) => node.props['data-widget']);
assert.ok(bothPanels.includes('demo:peek'), '临时面板必须渲染');
assert.ok(bothPanels.includes('demo:pinned'), '常驻面板必须同时渲染');
// 落盘只记常驻层：临时面板不该覆盖 popoverId（悬停速览不是「固定生效」的状态）
runtime.saveNow();
assert.equal(persisted().popoverId, 'demo:pinned', '本机布局里只记常驻面板');
assert.equal(runtime.getSnapshot().transientId, 'demo:peek', '临时层只在内存里');
// 收起临时层不影响常驻层
runtime.hoverLeave('demo:peek');
fireTimeouts(40);
assert.equal(service.isOpen('demo:peek'), false, '临时面板照常移开即收起');
assert.equal(service.isOpen('demo:pinned'), true, '收起临时面板不得动常驻面板');
// 临时层内部仍然是单开（两个速览互相替换），且同样不影响常驻层
const peek2 = { ...peek, id: 'demo:peek2', title: '悬停速览 2' };
const disposePeek2 = service.register(peek2);
runtime.hoverEnter('demo:peek');
fireTimeouts(40);
runtime.hoverEnter('demo:peek2');
fireTimeouts(40);
assert.equal(service.isOpen('demo:peek2'), true);
assert.equal(service.isOpen('demo:peek'), false, '临时层内部也是单开（互不叠加）');
assert.equal(service.isOpen('demo:pinned'), true, '临时层之间的替换同样不影响常驻层');
service.close('demo:pinned');
assert.equal(service.isOpen('demo:pinned'), false, '显式关闭常驻面板');
disposePeek();
disposePeek2();

// 对照：非常驻的悬停面板移开就收起（行为不能被这次改动带偏）
runtime.hoverEnter('dshp-widget-kit:status');
fireTimeouts(80);
assert.equal(service.isOpen('dshp-widget-kit:status'), true);
runtime.hoverLeave('dshp-widget-kit:status');
fireTimeouts(220);
assert.equal(service.isOpen('dshp-widget-kit:status'), false, '非常驻面板仍然移开即收起');

// 托盘：图标 + 少量文字；trayIcon:false 的卡片不出现在托盘，但仍然注册着
const trayWithLabel = collect(render(trayEntry.component({ sessionId: 'session-one' })));
/** 取某个图标上的活动栏文字。 */
const trayLabelOf = (id) => {
  const anchor = trayWithLabel.find((node) => node.props['data-tray-id'] === id);
  if (anchor === undefined) return null;
  const label = collect(anchor).find((node) => node.props['data-tray-label'] !== undefined);
  return label === undefined ? null : String(label.props['data-tray-label']);
};
assert.match(String(trayLabelOf('dshp-widget-kit:clock')), /^\d{2}:\d{2}$/, '时钟的文字是 HH:MM');
assert.equal(trayLabelOf('dshp-widget-kit:box'), '组件箱', '静态文字必须原样渲染');
assert.equal(trayLabelOf('dshp-widget-kit:status'), null, '没写 label 的组件不得凭空多出文字');
assert.ok(
  !trayWithLabel.some((node) => node.props['data-tray-id'] === 'dshp-widget-kit:registry'),
  'trayIcon: false 的卡片不得出现在活动栏',
);
assert.ok(
  ids.includes('dshp-widget-kit:registry'),
  '不出现在活动栏 ≠ 没注册：卡片仍由别的组件（组件箱）打开',
);

// 10.7 托盘图标：DOM 里带 data-tray-id（拖拽换序靠它读中心线），旧的 index 落点已废弃
const finalTrayNodes = collect(render(trayEntry.component({ sessionId: 'session-one' })));
assert.ok(
  finalTrayNodes.some((node) => node.props['data-tray-id'] === 'demo:lock'),
  '托盘图标必须带 data-tray-id（拖拽排序的命中依据）',
);
assert.ok(
  !finalTrayNodes.some((node) => node.props['data-tray-index'] !== undefined),
  '旧的 data-tray-index 落点必须移除（elementFromPoint 方案只会单向可用）',
);

// 10.8 锚点通知：图标真正挂上时要通知一次（刷新后恢复的面板才能重新测量位置），
//      而同一次 commit 里的 detach + attach 不得重复通知（否则 publish ↔ 重渲染 会死循环）
let anchorNotices = 0;
const stopAnchorWatch = runtime.subscribe(() => {
  anchorNotices += 1;
});
const iconOne = { nodeType: 1 };
runtime.setAnchor('demo:lock', iconOne);
assert.equal(runtime.getAnchor('demo:lock'), iconOne, '锚点必须可读回');
const afterAttach = anchorNotices;
assert.ok(afterAttach >= 1, '新锚点挂上必须通知一次');
runtime.setAnchor('demo:lock', null); // React 每次 commit 先 detach
runtime.setAnchor('demo:lock', iconOne); // 再 attach 同一个元素
assert.equal(
  anchorNotices,
  afterAttach,
  '同一次 commit 的 detach + attach 不得再通知（否则 publish ↔ 重渲染 无限循环）',
);
const iconTwo = { nodeType: 1 };
runtime.setAnchor('demo:lock', iconTwo);
assert.equal(anchorNotices, afterAttach + 1, '换了一个新的锚点元素要通知（面板需要重新测量）');
runtime.setAnchor('demo:lock', null);
assert.equal(runtime.getAnchor('demo:lock'), null, '卸载后锚点必须清掉');
stopAnchorWatch();

// 10.9 拖动模型：自由跟手 + 允许覆盖 + 吸附预览虚框 + 松手才吸附
/** 两块矩形是否相交（只做判定，不再有「必须让开」的硬约束）。 */
function overlaps(a, b, gap) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}
function insideViewport(rect) {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= 1280 && rect.y + rect.h <= 800;
}

const disposeDockA = service.register(makeCard('demo:dock-a', '吸附甲'));
const disposeDockB = service.register(makeCard('demo:dock-b', '吸附乙'));
const disposeDockC = service.register(makeCard('demo:dock-c', '吸附丙'));

// ① 打开三张卡：全部完整留在视口内；**允许互相覆盖**（谁在上由 z 序决定，不再强行推开）
service.close('demo:lock');
service.open('demo:dock-a');
service.open('demo:dock-b');
service.open('demo:dock-c');
const openIds = ['demo:dock-a', 'demo:dock-b', 'demo:dock-c'];
for (const id of openIds) {
  assert.ok(insideViewport(runtime.rectOf(id)), `${id} 必须完整留在视口内`);
}
assert.equal(service.isOpen('demo:lock'), false, '这一段开始时已收起「锁定卡片」');

// ② 甲挪到左上角当基准（键盘微调不受磁力影响，落点精确）
runtime.nudge('demo:dock-a', -9999, -9999);
const dockAnchor = runtime.rectOf('demo:dock-a');
assert.deepEqual(dockAnchor, { x: 0, y: 0, w: 360, h: 240 }, '甲应停在左上角');

// ③ 拖动期间卡片**自由跟手**（不会被强行吸走），同时给出吸附候选
runtime.beginLive('demo:dock-b', 'move');
const freeTarget = { x: dockAnchor.x + dockAnchor.w + 3, y: dockAnchor.y + 100, w: 360, h: 240 };
runtime.setLive('demo:dock-b', freeTarget);
const liveFree = runtime.getLive();
assert.deepEqual(liveFree.rect, freeTarget, '松手前卡片必须停在指针给的位置（不强制吸附）');
const previewLive = runtime.getLiveSnap();
assert.ok(previewLive, '离邻卡边缘 3px：必须给出吸附预览');
assert.equal(previewLive.rect.x, dockAnchor.x + dockAnchor.w + 8, '预览贴到邻卡右侧（间隔 8px）');
assert.equal(previewLive.rect.y, dockAnchor.y + 100, '纵向差得多，预览不对齐');
runtime.commitLive('demo:dock-b');
assert.deepEqual(runtime.rectOf('demo:dock-b'), previewLive.rect, '松手（同意）后落到预览位置');
assert.equal(runtime.getLiveSnap(), null, '手势结束后不再有预览');

// ④ 纵向也靠近时：预览变成「贴右边 + 上对齐」
runtime.beginLive('demo:dock-b', 'move');
runtime.setLive('demo:dock-b', {
  x: dockAnchor.x + dockAnchor.w + 3,
  y: dockAnchor.y + 2,
  w: 360,
  h: 240,
});
const aligned = runtime.getLiveSnap();
assert.ok(aligned, '仍然有预览');
assert.equal(aligned.rect.y, dockAnchor.y, '另一轴在容差内顺带对齐（上对齐）');
runtime.commitLive('demo:dock-b');
assert.deepEqual(runtime.rectOf('demo:dock-b'), aligned.rect);

// ⑤ 拖开（离吸附线很远）再松手：**不吸附**，落回自由位置 —— 这就是「不同意」
runtime.beginLive('demo:dock-b', 'move');
const loose = { x: 600, y: 500, w: 360, h: 240 };
runtime.setLive('demo:dock-b', loose);
assert.equal(runtime.getLiveSnap(), null, '离任何吸附线都远：不得给出预览');
assert.deepEqual(runtime.getLive().rect, loose, '自由位置照常跟手');
runtime.commitLive('demo:dock-b');
assert.deepEqual(runtime.rectOf('demo:dock-b'), loose, '没有预览就落回自由位置');
assert.equal(overlaps(runtime.rectOf('demo:dock-b'), runtime.rectOf('demo:dock-c'), 0), false);

// ⑥ 允许覆盖：把乙直接拖到丙身上，框架不得把它推开
const targetC = runtime.rectOf('demo:dock-c');
runtime.beginLive('demo:dock-b', 'move');
runtime.setLive('demo:dock-b', { x: targetC.x, y: targetC.y, w: 360, h: 240 });
assert.deepEqual(
  runtime.getLive().rect,
  { x: targetC.x, y: targetC.y, w: 360, h: 240 },
  '卡可以盖在另一张卡上（用户要对齐压上去时不许被推开）',
);
runtime.commitLive('demo:dock-b');
assert.deepEqual(runtime.rectOf('demo:dock-b'), { ...targetC, w: 360, h: 240 });

// ⑦ 拖到屏幕外：夹回视口内（整卡可见）
runtime.beginLive('demo:dock-b', 'move');
runtime.setLive('demo:dock-b', { x: -9999, y: -9999, w: 360, h: 240 });
assert.deepEqual(runtime.getLive().rect, { x: 0, y: 0, w: 360, h: 240 }, '越界必须夹回视口内');
runtime.commitLive('demo:dock-b');

// ⑧ 键盘微调是精确移动：不吃磁力，但仍受视口约束
const before = runtime.rectOf('demo:dock-b');
runtime.nudge('demo:dock-b', 8, 0);
assert.deepEqual(runtime.rectOf('demo:dock-b'), { ...before, x: before.x + 8 }, '键盘微调不得被磁力吸住');
runtime.nudge('demo:dock-b', -9999, -9999);
assert.deepEqual(runtime.rectOf('demo:dock-b'), { ...before, x: 0 }, '键盘移动受视口约束');

// ⑨ 订阅稳定性：别的卡片拿到的 live 恒为 null（同一个引用），拖动不会带着所有卡片重渲染
const liveCalls = [];
runtime.subscribeLive(() => {
  liveCalls.push(runtime.getLiveFor('demo:dock-c'));
});
runtime.beginLive('demo:dock-b', 'move');
runtime.setLive('demo:dock-b', { x: 100, y: 100, w: 360, h: 240 });
runtime.setLive('demo:dock-b', { x: 110, y: 100, w: 360, h: 240 });
assert.ok(liveCalls.length >= 3, '订阅者必须被通知');
assert.ok(
  liveCalls.every((value) => value === null),
  '没被拖的卡片每帧都必须拿到 null（引用稳定 → 不重渲染）',
);
assert.equal(runtime.getLiveFor('demo:dock-b')?.id, 'demo:dock-b', '被拖的卡片能拿到自己的几何');
// 吸附候选不变时必须复用同一个对象引用（虚框组件因此不会每帧重渲染）
runtime.setLive('demo:dock-b', { x: 108, y: 108, w: 360, h: 240 });
const snapOne = runtime.getLiveSnap();
runtime.setLive('demo:dock-b', { x: 111, y: 111, w: 360, h: 240 });
assert.equal(runtime.getLiveSnap(), snapOne, '候选没变就必须是同一个引用');
runtime.commitLive('demo:dock-b');

// ⑩ 真实手势走一遍：pointerdown → window 上的 move / up（含「左键已松开」的兜底）
const gestureCard = cardNodeOf('demo:dock-b');
const gestureHeader = collect(gestureCard).find(
  (node) => typeof node.props.className === 'string' && node.props.className.includes('cardHeader'),
);
const gestureStart = runtime.rectOf('demo:dock-b');
let captured = null;
gestureHeader.props.onPointerDown({
  button: 0,
  pointerId: 7,
  clientX: 0,
  clientY: 0,
  currentTarget: {
    setPointerCapture: (id) => {
      captured = id;
    },
  },
  preventDefault: () => {},
  stopPropagation: () => {},
});
assert.equal(captured, 7, 'pointerdown 必须尝试捕获指针');
assert.equal(runtime.getLive()?.id, 'demo:dock-b', '手势已经开始');
fireWindow('pointermove', { pointerId: 7, pointerType: 'mouse', buttons: 1, clientX: 40, clientY: -20 });
assert.deepEqual(
  runtime.getLive().rect,
  { x: gestureStart.x + 40, y: Math.max(0, gestureStart.y - 20), w: 360, h: 240 },
  'window 上的 move 必须驱动手势（指针捕获在真实浏览器里可能被悄悄收走）',
);
// 左键已经松开（漏收了 pointerup，例如松在窗口外）：这一次 move 就该收尾提交，
// 并且**按最后按住时的坐标**提交 —— 松手后再甩鼠标不该让卡片跟着乱跑
fireWindow('pointermove', { pointerId: 7, pointerType: 'mouse', buttons: 0, clientX: 200, clientY: 200 });
assert.equal(runtime.getLive(), null, 'buttons === 0 必须立即结束手势，不能一直「粘」在拖动状态');
assert.deepEqual(
  runtime.rectOf('demo:dock-b'),
  { x: gestureStart.x + 40, y: gestureStart.y - 20, w: 360, h: 240 },
  '按最后「按住时」的坐标提交',
);
assert.equal(windowListeners.get('pointermove')?.size ?? 0, 0, '手势结束后 window 监听必须摘干净');

// ⑪ pointercancel（系统接管手势）丢弃本次几何
const beforeCancel = runtime.rectOf('demo:dock-b');
gestureHeader.props.onPointerDown({
  button: 0,
  pointerId: 9,
  clientX: 0,
  clientY: 0,
  currentTarget: { setPointerCapture: () => {} },
  preventDefault: () => {},
  stopPropagation: () => {},
});
fireWindow('pointermove', { pointerId: 9, pointerType: 'touch', buttons: 1, clientX: 200, clientY: 200 });
fireWindow('pointercancel', { pointerId: 9, pointerType: 'touch', buttons: 0, clientX: 200, clientY: 200 });
assert.equal(runtime.getLive(), null, 'pointercancel 必须结束手势');
assert.deepEqual(runtime.rectOf('demo:dock-b'), beforeCancel, 'pointercancel 丢弃本次几何');
assert.equal(windowListeners.get('pointerup')?.size ?? 0, 0, 'window 监听必须摘干净');

// 10.9b 锁定后拖拽入口仍要吃掉 pointerdown（否则会选中页面文字），但不能产生 live 几何
runtime.setLocked('demo:dock-a', true);
const lockedHandlers = cardNodeOf('demo:dock-a');
assert.ok(lockedHandlers, '锁定的卡片仍然渲染');
const headerNode = collect(lockedHandlers).find(
  (node) => typeof node.props.className === 'string' && node.props.className.includes('cardHeader'),
);
assert.ok(headerNode, '卡片必须有标题栏');
assert.equal(
  typeof headerNode.props.onPointerDown,
  'function',
  '锁定后仍要挂 pointerdown（用来 preventDefault）',
);
let prevented = false;
headerNode.props.onPointerDown({
  button: 0,
  pointerId: 1,
  clientX: 10,
  clientY: 10,
  currentTarget: { setPointerCapture: () => {} },
  preventDefault: () => {
    prevented = true;
  },
  stopPropagation: () => {},
});
assert.equal(prevented, true, '锁定后的 pointerdown 必须 preventDefault（否则拖动会选中文字）');
assert.equal(runtime.getLive(), null, '锁定后不得进入拖拽');
runtime.setLocked('demo:dock-a', false);

// 10.9c 手势盾：拖动 / 缩放期间盖一层全视口盾（不可选中 + 指针形状跟随手势）
const shieldOf = () => {
  const node = collect(render(layerEntry.component({}))).find(
    (candidate) =>
      typeof candidate.props.className === 'string' && candidate.props.className.includes('gestureShield'),
  );
  return node ?? null;
};
const cardClassName = (id) => cardNodeOf(id).props.className;

assert.equal(shieldOf(), null, '没有手势时不得有手势盾');
assert.equal(cardClassName('demo:dock-a').includes('cardDragging'), false);

// 拖动
runtime.beginLive('demo:dock-a', 'move');
runtime.setLive('demo:dock-a', { x: 20, y: 20, w: 360, h: 240 });
const moveShield = shieldOf();
assert.ok(moveShield, '拖动期间必须有手势盾（挡住页面文字的选中）');
assert.equal(moveShield.props['data-cursor'], 'moving', '拖动时指针应是抓取态');
assert.equal(cardClassName('demo:dock-a').includes('cardDragging'), true, '拖动期间整卡不可选中');
runtime.cancelLive();
assert.equal(shieldOf(), null, '手势结束后手势盾必须撤掉');
assert.equal(cardClassName('demo:dock-a').includes('cardDragging'), false);

// 缩放（用户反馈的这一条：缩放的指针扫过内容/页面文字也容易选中）
runtime.beginLive('demo:dock-a', 'se');
runtime.setLive('demo:dock-a', { x: 0, y: 0, w: 420, h: 300 });
const resizeShield = shieldOf();
assert.ok(resizeShield, '缩放期间同样必须有手势盾');
assert.equal(resizeShield.props['data-cursor'], 'nwse', '东南缩放时指针应是 nwse-resize');
assert.equal(cardClassName('demo:dock-a').includes('cardDragging'), true, '缩放期间整卡不可选中');
assert.equal(runtime.rectOf('demo:dock-a').w, 360, '手势未提交前不得改动画布几何');
runtime.commitLive('demo:dock-a');
assert.equal(shieldOf(), null);
assert.equal(runtime.rectOf('demo:dock-a').w, 420, '提交后几何才落盘');

// 10.9d 吸附预览虚框：拖动期间在层里渲染一个「松手会落到这里」的框
const ghostOf = () => {
  const node = collect(render(layerEntry.component({}))).find(
    (candidate) =>
      typeof candidate.props.className === 'string' && candidate.props.className.includes('snapGhost'),
  );
  return node ?? null;
};
assert.equal(ghostOf(), null, '没有手势时不得有预览虚框');

// 先把甲摆到 (400,300) 当基准（键盘微调精确落位，不吃磁力）
const aBefore = runtime.rectOf('demo:dock-a');
runtime.nudge('demo:dock-a', 400 - aBefore.x, 300 - aBefore.y);
const anchorA = runtime.rectOf('demo:dock-a');
assert.deepEqual({ x: anchorA.x, y: anchorA.y }, { x: 400, y: 300 }, '甲停在 (400,300)');

const cBeforeLive = runtime.rectOf('demo:dock-c');
runtime.beginLive('demo:dock-c', 'move');
runtime.setLive('demo:dock-c', { x: anchorA.x + anchorA.w + 3, y: anchorA.y + 2, w: 360, h: 240 });
const ghost = ghostOf();
assert.ok(ghost, '有吸附候选时必须渲染预览虚框');
assert.equal(ghost.props['data-ghost-for'], 'demo:dock-c');
assert.equal(ghost.props.style.left, anchorA.x + anchorA.w + 8, '虚框落在吸附后的位置（贴右缘 + 8px）');
assert.equal(ghost.props.style.top, anchorA.y, '虚框也带上对齐结果（上对齐）');
// z-index：压在其它卡片之上、压在被拖的那张卡之下（吸附目标与别人重叠时也要看得见）
assert.ok(Number.isFinite(ghost.props.style.zIndex), '虚框必须给明确的层内 z-index');
assert.ok(
  ghost.props.style.zIndex >= 1 && ghost.props.style.zIndex <= runtime.getSnapshot().zOrder.length,
  `虚框的 z-index（${String(ghost.props.style.zIndex)}）必须落在卡片层内`,
);
assert.equal(runtime.rectOf('demo:dock-c').x, cBeforeLive.x, '虚框出现时卡片本体还没动（松手才吸附）');
assert.equal(runtime.getLive().rect.x, anchorA.x + anchorA.w + 3, '本体仍然自由跟手');

// 拖开：虚框消失，卡片本体照常跟手（先把乙支开，免得它提供新的吸附线）
const bBefore = runtime.rectOf('demo:dock-b');
runtime.nudge('demo:dock-b', -bBefore.x, 540 - bBefore.y);
runtime.setLive('demo:dock-c', { x: 100, y: 100, w: 360, h: 240 });
assert.equal(ghostOf(), null, '离开所有吸附线后虚框必须消失');
assert.equal(runtime.getLive().rect.x, 100, '卡片本体仍然自由跟手');
runtime.cancelLive();
assert.equal(ghostOf(), null, '手势结束后虚框必须撤掉');

// 10.9e 外观 / 动效偏好 → 卡片层根上的 CSS 自定义属性（卡片、标题栏、小面板共用同一套）
runtime.applyPrefs({
  trayEnabled: true,
  maxVisibleIcons: 4,
  badgeIntervalMs: 30000,
  hoverPreview: true,
  referenceWidgets: true,
  cardOpacity: 0.6,
  cardBlur: 12,
  cardBorder: 'off',
  cardRadius: 'square',
  motionMs: 100,
});
const styledLayer = render(layerEntry.component({}));
const layerVars = collect(styledLayer)[0]?.props.style ?? styledLayer.props.style;
assert.equal(layerVars['--dshp-card-alpha'], '60%', '透明度偏好必须下达到层根');
assert.equal(layerVars['--dshp-card-blur'], 'blur(12px)', '毛玻璃偏好必须下达到层根');
assert.equal(layerVars['--dshp-card-border-width'], '0px', '「无边框」档 → 0px');
assert.equal(layerVars['--dshp-card-radius'], '0px', '「直角」档 → 0px');
assert.equal(layerVars['--dshp-card-capsule-radius'], '0px', '直角档下最小化胶囊也拉平');
assert.equal(layerVars['--dshp-motion-ms'], '100ms', '动效时长偏好必须下达到层根');
// 关掉毛玻璃时不建 backdrop-filter 合成层
runtime.applyPrefs({ ...runtime.getSnapshot().prefs, cardBlur: 0, cardOpacity: 1, motionMs: 300 });
const plainLayer = render(layerEntry.component({}));
const plainVars = collect(plainLayer)[0]?.props.style ?? plainLayer.props.style;
assert.equal(plainVars['--dshp-card-blur'], 'none', '模糊 = 0 时必须给 none（而不是 blur(0px)）');
assert.equal(plainVars['--dshp-card-alpha'], '100%', '默认不透明');
assert.equal(plainVars['--dshp-motion-ms'], '300ms', '默认动效 300ms');

// 10.9f 滑块拖动只改本地预览，不往宿主写 settings.yaml（松手才落盘）
const postsBefore = fetchCalls.filter((call) => call.method === 'POST').length;
await runtime.setPrefs({ cardOpacity: 0.5 }, { save: false });
assert.equal(
  fetchCalls.filter((call) => call.method === 'POST').length,
  postsBefore,
  '拖动中的预览不得发 POST（否则每帧刷一遍 settings.yaml）',
);
assert.equal(runtime.getSnapshot().prefs.cardOpacity, 0.5, '预览仍要立刻生效');
await runtime.setPrefs({ cardOpacity: 0.55 });
assert.equal(
  fetchCalls.filter((call) => call.method === 'POST').length,
  postsBefore + 1,
  '松手（save 默认 true）才落盘一次',
);
await runtime.setPrefs({
  cardOpacity: 1,
  cardBlur: 0,
  cardBorder: 'auto',
  cardRadius: 'auto',
  motionMs: 300,
});

// 10.12 一菜单多卡片 + 活动栏文字：组件箱菜单能开关卡片；trayIcon:false 的卡片靠它打开
assert.equal(
  service.list().some((item) => item.id === 'dshp-widget-kit:registry'),
  true,
  '诊断卡片仍然注册着（它 trayIcon:false，靠组件箱收录）',
);
assert.equal(
  service.list().some((item) => item.id === 'dshp-widget-kit:box'),
  true,
  '组件箱必须在册',
);
// 摘要里带这个声明：别的聚合入口也能按同一条规则决定收不收，不必读框架内部
assert.equal(
  service.list().find((item) => item.id === 'dshp-widget-kit:registry').listedInBox,
  true,
  'list() 摘要必须带 listedInBox（诊断卡片声明了收录）',
);
assert.equal(
  service.list().find((item) => item.id === 'dshp-widget-kit:clock').listedInBox,
  false,
  '没声明的卡片在摘要里是 false（时钟有自己的活动栏图标，不进箱）',
);
// 两张对照卡：都 trayIcon:false，只有一张声明了「可被收录」
const disposeListed = service.register({
  id: 'demo:listed',
  title: '被收录的自由卡片',
  icon: 'i',
  presentation: 'card',
  trayIcon: false,
  listedInBox: true,
  content: { render: () => null },
});
const disposeUnlisted = service.register({
  id: 'demo:unlisted',
  title: '没声明的自由卡片',
  icon: 'i',
  presentation: 'card',
  trayIcon: false,
  content: { render: () => null },
});
service.close('dshp-widget-kit:clock');
service.close('dshp-widget-kit:registry');
service.toggle('dshp-widget-kit:box');
assert.equal(service.isOpen('dshp-widget-kit:box'), true, '组件箱要能打开');
assert.ok(panelNodeOf('dshp-widget-kit:box'), '组件箱必须渲染出面板');
const boxRows = () =>
  collect(panelNodeOf('dshp-widget-kit:box')).filter(
    (node) => typeof node.props.className === 'string' && node.props.className.includes('boxRow'),
  );
assert.deepEqual(
  boxRows()
    .map((node) => node.props['data-box-widget'])
    .toSorted(),
  ['demo:listed', 'dshp-widget-kit:registry'],
  '组件箱只列**声明过 listedInBox** 的卡片：没声明的自由卡片不列，有图标的时钟也不列',
);
const boxToggleFor = (id) => {
  const row = boxRows().find((node) => node.props['data-box-widget'] === id);
  assert.ok(row, `组件箱里应有「${id}」这一行`);
  const button = collect(row).find((node) => node.type === 'Button' && node.props.onClick);
  assert.ok(button, `「${id}」那一行要有开关按钮`);
  return button;
};
boxToggleFor('demo:listed').props.onClick();
assert.equal(service.isOpen('demo:listed'), true, '从菜单里点一下就该打开那张卡片');
boxToggleFor('dshp-widget-kit:registry').props.onClick();
assert.equal(
  service.isOpen('dshp-widget-kit:registry'),
  true,
  '第二张卡片要能**同时**打开（trayIcon:false 的卡片只能这样打开）',
);
assert.equal(service.isOpen('demo:listed'), true, '两张卡片互不影响，同时开着');
// 状态点：开着的那一行 data-open=1（只看颜色就能扫出哪几张开着）
assert.equal(
  boxRows().find((node) => node.props['data-box-widget'] === 'demo:listed').props['data-open'],
  '1',
  '开着的行必须带 data-open=1',
);
// 页脚：已打开计数 + 全部收起
const boxFooter = () =>
  collect(panelNodeOf('dshp-widget-kit:box'))
    .filter((node) => typeof node.props.className === 'string' && node.props.className.includes('boxCount'))
    .map((node) => String(node.props.children))
    .join('');
assert.equal(boxFooter(), '2 / 2 已打开');
const closeAllButton = () =>
  collect(panelNodeOf('dshp-widget-kit:box')).find(
    (node) => node.type === 'Button' && node.props.children === '全部收起',
  );
assert.ok(closeAllButton(), '页脚要有「全部收起」');
closeAllButton().props.onClick();
assert.equal(service.isOpen('demo:listed'), false, '「全部收起」要把开着的卡片收掉');
assert.equal(service.isOpen('dshp-widget-kit:registry'), false);
assert.equal(boxFooter(), '0 / 2 已打开');
service.close('dshp-widget-kit:box');
disposeListed();
disposeUnlisted();

// 10.13 描述符校验：tray.label / trayIcon 的边界
const baseTray = { id: 'demo:bad', title: 'T', icon: 'i' };
assert.doesNotThrow(
  () =>
    service.register({
      ...baseTray,
      presentation: 'card',
      trayIcon: false,
      content: { render: () => null },
    })(),
  '卡片允许 trayIcon:false',
);
assert.throws(
  () =>
    service.register({
      ...baseTray,
      presentation: 'popover',
      trayIcon: false,
      content: { render: () => null },
    }),
  /只有 presentation: 'card' 能不显示图标/,
  'popover 不给 trayIcon:false（它需要图标当锚点）',
);
assert.throws(
  () => service.register({ ...baseTray, presentation: 'tray', trayIcon: false }),
  /只有 presentation: 'card' 能不显示图标/,
  'tray 形态不给 trayIcon:false（没有图标就没有意义）',
);
assert.throws(
  () => service.register({ ...baseTray, presentation: 'tray', tray: { label: '七个字的文字太长' } }),
  /最多 6 个字/,
  '活动栏文字限长必须被校验',
);
assert.throws(
  () => service.register({ ...baseTray, presentation: 'tray', tray: { label: 42 } }),
  /必须是字符串或返回字符串的函数/,
  '活动栏文字必须是字符串或函数',
);
assert.doesNotThrow(
  () => service.register({ ...baseTray, presentation: 'tray', tray: { label: () => 'ok' } })(),
  '函数形式的文字是合法的',
);
// listedInBox：只有卡片能声明「可被组件箱收录」
assert.doesNotThrow(
  () =>
    service.register({
      ...baseTray,
      presentation: 'card',
      trayIcon: false,
      listedInBox: true,
      content: { render: () => null },
    })(),
  '卡片可以声明 listedInBox: true',
);
assert.throws(
  () =>
    service.register({ ...baseTray, presentation: 'card', listedInBox: 42, content: { render: () => null } }),
  /必须是 boolean/,
  'listedInBox 必须是布尔值',
);
assert.throws(
  () =>
    service.register({
      ...baseTray,
      presentation: 'popover',
      listedInBox: true,
      content: { render: () => null },
    }),
  /只有 presentation: 'card' 能被「组件箱」收录/,
  'popover 不能被组件箱收录（组件箱列的是卡片）',
);
assert.throws(
  () => service.register({ ...baseTray, presentation: 'tray', listedInBox: true }),
  /只有 presentation: 'card' 能被「组件箱」收录/,
  'tray 形态更不能被组件箱收录',
);

// 10.14 popover 层级：临时（悬停）层压在常驻层之上
const layerPinned = {
  id: 'demo:layer-pinned',
  title: '常驻层',
  icon: 'i',
  presentation: 'popover',
  popover: { trigger: 'click', width: 200, persistent: true },
  content: { render: () => null },
};
const layerHover = {
  id: 'demo:layer-hover',
  title: '临时层',
  icon: 'i',
  presentation: 'popover',
  popover: { trigger: 'hover', hoverOpenDelayMs: 40, width: 200 },
  content: { render: () => null },
};
const disposeLayerPinned = service.register(layerPinned);
const disposeLayerHover = service.register(layerHover);
service.toggle('demo:layer-pinned');
runtime.hoverEnter('demo:layer-hover');
fireTimeouts(40);
assert.equal(service.isOpen('demo:layer-pinned'), true, '常驻面板必须还在（悬停不挤掉它）');
assert.equal(service.isOpen('demo:layer-hover'), true, '临时面板必须同时展开');
const channels = collect(render(layerEntry.component({})))
  .filter((node) => typeof node.props['data-channel'] === 'string')
  .map((node) => [node.props['data-widget'], node.props['data-channel']]);
assert.deepEqual(
  channels,
  [
    ['demo:layer-pinned', 'pinned'],
    ['demo:layer-hover', 'transient'],
  ],
  '常驻层在前、临时层在后（DOM 顺序与 z-index 一致，临时层压在上面）',
);
service.close('demo:layer-hover');
service.close('demo:layer-pinned');
disposeLayerPinned();
disposeLayerHover();

// 10.10 锁定按钮的状态（红色锁 / 绿色开锁靠 data-locked 选择器着色）// 10.10 锁定按钮的状态（红色锁 / 绿色开锁靠 data-locked 选择器着色）
const lockBtnOf = (id) => {
  const card = collect(render(layerEntry.component({}))).find((node) => node.props['data-widget'] === id);
  assert.ok(card, `${id} 必须渲染出来`);
  const buttons = collect(card).filter((node) => node.type === 'button');
  const button = buttons.find((node) => node.props['data-locked'] !== undefined);
  assert.ok(button, `${id} 的标题栏必须有锁定按钮`);
  return button;
};
assert.equal(lockBtnOf('demo:dock-a').props['data-locked'], 'false', '未锁定时必须是开锁态');
assert.match(lockBtnOf('demo:dock-a').props['aria-label'], /锁定「吸附甲」的位置/);
runtime.setLocked('demo:dock-a', true);
const lockedBtn = lockBtnOf('demo:dock-a');
assert.equal(lockedBtn.props['data-locked'], 'true', '锁定后必须切到红锁态');
assert.equal(lockedBtn.props['aria-pressed'], true);
assert.match(lockedBtn.props['aria-label'], /解锁「吸附甲」的位置/);

// 锁定后标题栏只留「解锁」+「⋯」：最小化 / 关闭 / 尺寸项都不再占位置（前两个进菜单）
const headerButtons = (id) => {
  const card = collect(render(layerEntry.component({}))).find((node) => node.props['data-widget'] === id);
  const header = collect(card).find(
    (node) => typeof node.props.className === 'string' && node.props.className.includes('cardHeader'),
  );
  return collect(header).filter((node) => node.type === 'button');
};
assert.equal(headerButtons('demo:dock-a').length, 1, '锁定后标题栏只剩解锁按钮（⋯ 是 Menu 的锚点）');
assert.ok(
  collect(render(layerEntry.component({}))).some((node) => node.type === 'Menu'),
  '⋯ 扩展菜单必须还在',
);
const lockedMenuIds = collect(render(layerEntry.component({})))
  .filter((node) => node.type === 'Menu')
  .map((node) => node.props.items.map((item) => item.id));
assert.ok(
  lockedMenuIds.some(
    (items) => items.includes('minimize') && items.includes('close') && items.includes('lock'),
  ),
  '锁定时最小化 / 关闭 / 解锁都必须在扩展菜单里（仍然可用，只是不占标题栏）',
);
runtime.setLocked('demo:dock-a', false);
assert.equal(headerButtons('demo:dock-a').length, 3, '解锁后标题栏恢复：锁定 + 最小化 + 关闭');

// 10.11 卸载 / 热重载**不得**动本机布局（插件开发时每改一次代码就会走一遍这条路径）
const reloadWidget = makeCard('demo:reload', '重载卡片');
const disposeReload = service.register(reloadWidget);
service.open('demo:reload');
runtime.setLocked('demo:reload', true);
runtime.minimize('demo:reload');
runtime.restore('demo:reload');
runtime.setHidden('demo:reload', true);
runtime.saveNow();
const reloadRect = runtime.rectOf('demo:reload');
const beforeUnload = persisted();
assert.equal(beforeUnload.cards['demo:reload'].open, true, '前置：卡片状态已落盘');
assert.equal(beforeUnload.cards['demo:reload'].locked, true);
assert.ok(beforeUnload.tray.order.includes('demo:reload'), '前置：托盘顺序里有它');
assert.ok(beforeUnload.tray.hidden.includes('demo:reload'), '前置：隐藏集合里有它');

// 卸载（= 插件热重载 / 暂时停用时发生的事）
disposeReload();
runtime.saveNow();
assert.equal(
  service.list().some((item) => item.id === 'demo:reload'),
  false,
  '卸载后注册表里没有它',
);
const afterUnload = persisted();
assert.ok(
  afterUnload.cards['demo:reload'] !== undefined,
  '卸载**不得**删掉它的卡片记录（否则每改一次代码布局就重置一次）',
);
assert.equal(afterUnload.cards['demo:reload'].locked, true, '锁定状态必须留着');
assert.equal(afterUnload.cards['demo:reload'].open, true, '打开状态必须留着（注册回来就恢复）');
assert.ok(afterUnload.tray.order.includes('demo:reload'), '托盘顺序必须留着');
assert.ok(afterUnload.tray.hidden.includes('demo:reload'), '隐藏集合必须留着');

// 重新注册（= 热重载完成）：卡片原地回来，位置/锁定/隐藏一个不少
const disposeReloadAgain = service.register(reloadWidget);
assert.equal(service.isOpen('demo:reload'), true, '注册回来必须恢复「开着」');
assert.deepEqual(runtime.rectOf('demo:reload'), reloadRect, '位置必须还是原来那个');
assert.equal(runtime.isLocked('demo:reload'), true, '锁定状态必须还在');
assert.ok(runtime.getSnapshot().layout.tray.hidden.includes('demo:reload'), '隐藏状态必须还在');

// 手动清理（设置页按钮）：只清「不在册且一直没回来」的残留，在册组件不受影响
disposeReloadAgain();
const liveIds = service.list().map((item) => item.id);
const removedOrphans = runtime.pruneOrphans();
assert.ok(removedOrphans >= 1, '显式清理必须能清掉不在册的残留');
runtime.saveNow(); // 落盘是 300ms 合并写，读盘前先 flush
const afterPrune = persisted();
assert.equal(afterPrune.cards['demo:reload'], undefined, '残留记录这时才被清掉');
for (const id of liveIds) {
  assert.ok(
    afterPrune.tray.order.includes(id) || afterPrune.cards[id] === undefined,
    `在册组件「${id}」的布局不得被清理动作波及`,
  );
}

disposeDockA();
disposeDockB();
disposeDockC();

disposePinned();
disposePinnedHover();
disposeA();
disposeB();

// 12. 组件箱是**框架能力**，不是参考组件：关掉「装载参考组件」也不得消失 ——
// 否则「trayIcon:false + listedInBox:true」的卡片（比如第三方插件的自由卡片）会彻底没有入口
{
  const sectionEntry = registrations.find((entry) => entry.spec.name === 'settings.section');
  assert.ok(sectionEntry, '设置节必须注册着（要借它触发参考组件的启停）');
  const onPrefsApplied = sectionEntry.component({}).props.onPrefsApplied;
  assert.equal(typeof onPrefsApplied, 'function', '设置节必须能把偏好变化同步给参考组件开关');
  const disposeAlways = service.register({
    id: 'demo:always',
    title: '第三方自由卡片',
    icon: 'i',
    presentation: 'card',
    trayIcon: false,
    listedInBox: true,
    content: { render: () => null },
  });
  onPrefsApplied({ referenceWidgets: false });
  assert.equal(
    service.list().some((item) => item.id === 'dshp-widget-kit:clock'),
    false,
    '前置：关掉参考组件后时钟（参考组件）确实被卸载了',
  );
  assert.equal(
    service.list().some((item) => item.id === 'dshp-widget-kit:box'),
    true,
    '组件箱必须留在册：它是框架能力，不是参考组件',
  );
  assert.equal(
    service.list().find((item) => item.id === 'demo:always').listedInBox,
    true,
    '声明过收录的第三方卡片仍在册',
  );
  service.toggle('dshp-widget-kit:box');
  assert.deepEqual(
    collect(panelNodeOf('dshp-widget-kit:box'))
      .filter((node) => node.props['data-box-widget'] !== undefined)
      .map((node) => node.props['data-box-widget']),
    ['demo:always'],
    '关掉参考组件后，组件箱仍然能列出声明过收录的第三方卡片',
  );
  service.close('dshp-widget-kit:box');
  disposeAlways();
  onPrefsApplied({ referenceWidgets: true });
}

// 11. 胶囊宽度测量（`measure.ts`）：量的是**整条标题栏**的自然宽度，量不到必须给 null
// 用一套最小替身（元素 / 克隆 / document / getComputedStyle）把它四条契约钉住：
// ① 没有 DOM 就返回 null（胶囊退回地板宽度，绝不瞎猜一个偏窄的宽度把标题截掉）；
// ② 量的是克隆的矩形，向上取整，并加上卡片自己的左右边框；
// ③ 克隆里先把「最小化会收起的元素」（副标题）按 0 宽处理；④ 克隆一定被摘掉、异常不外泄。
{
  /** 最小元素替身：只带 measureHeaderWidth 真正会碰到的成员（注意别用 HTMLElement 相关的全局）。 */
  const makeNode = (rect) => {
    const node = {
      style: {},
      collapsed: [],
      removed: 0,
      parentElement: null,
      clone: null,
      append() {},
      removeAttribute() {},
      querySelectorAll: () => node.collapsed,
      getBoundingClientRect: () => rect,
      remove() {
        node.removed += 1;
      },
      cloneNode: () => node.clone,
    };
    return node;
  };
  const owner = makeNode({ width: 360 });
  const header = makeNode({ width: 243.2 });
  header.parentElement = owner;
  const subtitle = makeNode({ width: 0 });
  header.clone = makeNode({ width: 243.2 });
  header.clone.collapsed = [subtitle];

  assert.equal(measureHeaderWidth(null, 'sub'), null, '没有元素时量不到');
  assert.equal(
    measureHeaderWidth(header, 'sub'),
    null,
    '没有 document（本无头环境）时必须量不到，不许瞎猜一个宽度',
  );

  globalThis.document = {};
  globalThis.getComputedStyle = () => ({
    borderLeftWidth: '0.5px',
    borderRightWidth: '0.5px',
    paddingLeft: '0px',
    paddingRight: '0px',
  });
  assert.equal(
    measureHeaderWidth(header, 'sub'),
    245,
    '量的是标题栏克隆的宽度（243.2 → 244，向上取整）再加卡片自己的左右边框（0.5 + 0.5 → 1）',
  );
  assert.equal(subtitle.style.maxWidth, '0', '克隆里的副标题要按 0 宽处理（与最小化状态一致）');
  assert.equal(header.clone.removed, 1, '探针必须被摘掉，不许留在 DOM 里');
  // 拿不到类名时不收副标题、也不报错（只是可能多算一点宽度）
  assert.equal(measureHeaderWidth(header, undefined) !== null, true, '拿不到类名也要能量');

  // 量到 0 宽（元素不可见 / 尺寸没算出来）当作量不到
  const invisible = makeNode({ width: 0 });
  invisible.parentElement = owner;
  invisible.clone = makeNode({ width: 0 });
  assert.equal(measureHeaderWidth(invisible, 'sub'), null, '0 宽当作量不到');
  // 抛异常不许把整层卡片带崩
  const boom = makeNode({ width: 100 });
  boom.parentElement = owner;
  boom.cloneNode = () => {
    throw new Error('元素已经从文档里摘掉了');
  };
  assert.equal(measureHeaderWidth(boom, 'sub'), null, '量的时候抛异常不许把整层卡片带崩');
  // 没有父元素（卡片还没挂上）也当作量不到
  const orphan = makeNode({ width: 100 });
  assert.equal(measureHeaderWidth(orphan, 'sub'), null, '没有父元素时量不到');
  globalThis.document = undefined;
  assert.equal(measureHeaderWidth(header, 'sub'), null, 'document 被置空后又回到「量不到」');
  delete globalThis.getComputedStyle;

  // 标题自己的溢出量：兜底补差读的就是它
  assert.equal(textOverflowPx(null), 0, '没有元素时溢出量 0（当作没溢出）');
  assert.equal(textOverflowPx({ scrollWidth: 60, clientWidth: 60 }), 0, '刚好放下 = 没溢出');
  assert.equal(textOverflowPx({ scrollWidth: 64, clientWidth: 60 }), 4, '溢出 4px');
  assert.equal(textOverflowPx({ scrollWidth: 60, clientWidth: 64 }), 0, '比容器窄不许算成负溢出');
  assert.equal(textOverflowPx({ scrollWidth: Number.NaN, clientWidth: 60 }), 0, '脏输入当没溢出');
  assert.equal(textOverflowPx({}), 0, '拿不到尺寸当没溢出');
}

console.log(
  'check-client.mjs ok (loader / 服务 / 槽位 / 校验 / 渲染 / popover / 恢复 / 折叠 / 锁定 / 启停 / 吸附 / 手势 / 胶囊测量)',
);
