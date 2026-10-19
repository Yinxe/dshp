#!/usr/bin/env node
/**
 * 本机布局存储自检（纯逻辑 + 注入式 IO）
 *
 * 覆盖：消毒（坏结构 / 版本不符 / 类型不符 / 不在册 id / 超长列表 / 几何夹紧 / 布尔强制 /
 * 新增字段默认值）、读写的降级路径（storage 抛错 / 坏 JSON / 无 storage）、合并写盘
 * （debounce / flush / cancel / onError）、菜单操作（上移下移、隐藏与禁用集合）、
 * 一维拖拽排序（reorderByPointer：左右两个方向都要能过）、托盘拖拽计划（planTrayDrag：冻结槽位、
 * 双向对称、让位位移与预览落点）、卸载清理（pruneId）。
 */

import assert from 'node:assert/strict';
import { clampRect } from '../src/client/geometry.ts';
import {
  MAX_TRACKED,
  STORE_KEY,
  STORE_VERSION,
  clearState,
  createDebouncedSaver,
  emptyState,
  loadState,
  moveInOrder,
  planTrayDrag,
  pruneId,
  reorderByPointer,
  sanitizeState,
  saveState,
  setDisabledInList,
  setHiddenInList,
} from '../src/client/store.ts';

const VP = { width: 1280, height: 800 };
const KNOWN = ['alpha:one', 'beta:two', 'gamma:three'];
const DEPS = {
  isKnown: (id) => KNOWN.includes(id),
  constraintsOf: () => ({ min: { w: 240, h: 140 }, max: null }),
  viewport: VP,
  clampRect,
};

let checks = 0;
const check = (fn) => {
  fn();
  checks += 1;
};

/** 假的 localStorage。 */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
}

check(() => assert.equal(STORE_KEY, 'dshp-widget-kit:v1'));
check(() =>
  assert.deepEqual(emptyState(), {
    v: STORE_VERSION,
    tray: { order: [], hidden: [] },
    cards: {},
    lastOpenId: null,
    zOrder: [],
    popoverId: null,
    popoverOrigin: null,
    disabled: [],
  }),
);

// ── 消毒 ────────────────────────────────────────────────────────────────
check(() => {
  assert.deepEqual(sanitizeState(null, DEPS), emptyState());
  assert.deepEqual(sanitizeState('nope', DEPS), emptyState());
  assert.deepEqual(
    sanitizeState({ v: 2, tray: { order: KNOWN } }, DEPS),
    emptyState(),
    '版本不符必须整份丢弃',
  );
  assert.deepEqual(sanitizeState({ tray: { order: KNOWN } }, DEPS), emptyState(), '缺 v 必须整份丢弃');
});

check(() => {
  const out = sanitizeState(
    {
      v: STORE_VERSION,
      tray: {
        order: ['beta:two', 'alpha:one', 'beta:two', 'delta:nope', 42],
        hidden: ['gamma:three', 'delta:nope'],
      },
      cards: {
        'alpha:one': { x: 420, y: 260, w: 400, h: 300, minimized: true, open: true, locked: true },
        'delta:nope': { x: 1, y: 1, w: 300, h: 200 },
        'beta:two': { x: 10, y: 10, w: 10, h: 10, minimized: 'yes', open: 0, locked: 'yes' },
      },
      lastOpenId: 'delta:nope',
      zOrder: ['beta:two', 'delta:nope', 'alpha:one'],
      popoverId: 'delta:nope',
      popoverOrigin: 'hover',
      disabled: ['gamma:three', 'delta:nope', 'gamma:three'],
    },
    DEPS,
  );
  assert.deepEqual(out.tray.order, ['beta:two', 'alpha:one'], '去重 + 丢未在册');
  assert.deepEqual(out.tray.hidden, ['gamma:three']);
  const cardIds = Object.keys(out.cards);
  cardIds.sort();
  assert.deepEqual(cardIds, ['alpha:one', 'beta:two']);
  assert.deepEqual(out.cards['alpha:one'], {
    x: 420,
    y: 260,
    w: 400,
    h: 300,
    minimized: true,
    open: true,
    locked: true,
  });
  // 尺寸被夹到 min，布尔被强制（'yes' / 0 都不等于 true）
  assert.deepEqual(out.cards['beta:two'], {
    x: 10,
    y: 10,
    w: 240,
    h: 140,
    minimized: false,
    open: false,
    locked: false,
  });
  assert.equal(out.lastOpenId, null, '不在册的 lastOpenId 必须清掉');
  assert.deepEqual(out.zOrder, ['beta:two', 'alpha:one'], '层叠顺序去重 + 丢未在册');
  assert.equal(out.popoverId, null, '不在册的 popoverId 必须清掉');
  assert.equal(out.popoverOrigin, null);
  assert.deepEqual(out.disabled, ['gamma:three'], '禁用集合去重 + 丢未在册');
});

check(() => {
  // 旧结构（没有新增字段）必须能读：缺字段 = 用默认值，而不是整份丢弃
  const out = sanitizeState(
    {
      v: STORE_VERSION,
      tray: { order: ['alpha:one'], hidden: [] },
      cards: { 'alpha:one': { x: 10, y: 10, w: 300, h: 200, open: true, minimized: false } },
      lastOpenId: 'alpha:one',
    },
    DEPS,
  );
  assert.deepEqual(out.zOrder, []);
  assert.equal(out.popoverId, null);
  assert.deepEqual(out.disabled, []);
  assert.equal(out.cards['alpha:one'].locked, false, '缺 locked 的老记录 = 未锁定');
  assert.equal(out.cards['alpha:one'].open, true, '老记录的 open 必须保留（刷新后要恢复）');

  // popoverOrigin 只在有 popoverId 时才认
  const loose = sanitizeState({ v: STORE_VERSION, popoverId: null, popoverOrigin: 'hover' }, DEPS);
  assert.equal(loose.popoverOrigin, null, '没有 popoverId 时的 origin 必须丢掉');
  const bad = sanitizeState({ v: STORE_VERSION, popoverId: 'alpha:one', popoverOrigin: 'nope' }, DEPS);
  assert.equal(bad.popoverId, 'alpha:one');
  assert.equal(bad.popoverOrigin, null, '非法 origin 必须丢掉');
});

check(() => {
  const out = sanitizeState(
    { v: STORE_VERSION, cards: { 'alpha:one': { x: 99999, y: -500, w: 300, h: 200 } } },
    DEPS,
  );
  assert.equal(out.cards['alpha:one'].x, VP.width - 300, '越界坐标必须夹回（整卡留在视口内）');
  assert.equal(out.cards['alpha:one'].y, 0);
});

check(() => {
  const cards = {};
  for (let i = 0; i < MAX_TRACKED + 20; i += 1) {
    cards[`alpha:one`] = { x: 1, y: 1, w: 300, h: 200 };
  }
  // 用合法 id 撑数量：同一个 id 只会留一条，所以换一批合法 id
  const many = {};
  for (let i = 0; i < MAX_TRACKED + 20; i += 1) many[`alpha:${String(i)}`] = { x: 1, y: 1, w: 300, h: 200 };
  const known = Object.keys(many);
  const out = sanitizeState(
    { v: STORE_VERSION, cards: many },
    { ...DEPS, isKnown: (id) => known.includes(id) },
  );
  assert.equal(Object.keys(out.cards).length, MAX_TRACKED, '卡片数必须被截断');
  assert.equal(Object.keys(sanitizeState({ v: STORE_VERSION, cards }, DEPS).cards).length, 1);
});

check(() => {
  const out = sanitizeState(
    {
      v: STORE_VERSION,
      cards: { 'alpha:one': { x: Number.NaN, y: 0, w: 300, h: 200 }, 'beta:two': 'nope' },
    },
    DEPS,
  );
  assert.deepEqual(Object.keys(out.cards), [], '非有限数/非对象的卡片条目必须丢弃');
});

// ── 读写 ────────────────────────────────────────────────────────────────
check(() => {
  const storage = fakeStorage();
  assert.deepEqual(loadState(storage, DEPS), { state: emptyState(), degraded: false });
  assert.deepEqual(loadState(null, DEPS), { state: emptyState(), degraded: true }, '无 storage = 降级');
  const broken = fakeStorage({ [STORE_KEY]: '{oops' });
  assert.deepEqual(loadState(broken, DEPS).degraded, true, '坏 JSON = 降级');
  const blocked = loadState(throwingStorage(), DEPS);
  assert.equal(blocked.degraded, true);
  assert.deepEqual(blocked.state, emptyState());
});

check(() => {
  const storage = fakeStorage();
  const state = { ...emptyState(), lastOpenId: 'alpha:one' };
  assert.equal(saveState(storage, state), true);
  assert.deepEqual(loadState(storage, DEPS).state, state);
  assert.equal(clearState(storage), true);
  assert.equal(storage.getItem(STORE_KEY), null);
  assert.equal(saveState(throwingStorage(), state), false);
  assert.equal(clearState(null), false);
  assert.equal(saveState(null, state), false);
});

// ── 合并写盘 ────────────────────────────────────────────────────────────
await (async () => {
  const storage = fakeStorage();
  let errors = 0;
  const saver = createDebouncedSaver(storage, 5, () => {
    errors += 1;
  });
  saver.schedule({ ...emptyState(), lastOpenId: 'alpha:one' });
  saver.schedule({ ...emptyState(), lastOpenId: 'beta:two' });
  assert.equal(storage.getItem(STORE_KEY), null, 'schedule 不得同步写盘');
  assert.equal(saver.pending(), true);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(saver.pending(), false);
  assert.equal(JSON.parse(storage.getItem(STORE_KEY)).lastOpenId, 'beta:two', '合并后只落最后一次');

  // cancel：丢弃未落盘内容
  saver.schedule({ ...emptyState(), lastOpenId: 'gamma:three' });
  saver.cancel();
  assert.equal(saver.pending(), false);
  assert.equal(JSON.parse(storage.getItem(STORE_KEY)).lastOpenId, 'beta:two');

  // flush：立即写
  saver.schedule({ ...emptyState(), lastOpenId: 'gamma:three' });
  assert.equal(saver.flush(), true);
  assert.equal(JSON.parse(storage.getItem(STORE_KEY)).lastOpenId, 'gamma:three');

  // 写失败 → onError 只报一次
  const bad = createDebouncedSaver(throwingStorage(), 1, () => {
    errors += 1;
  });
  bad.schedule(emptyState());
  bad.flush();
  assert.equal(errors, 1, '写失败必须走 onError');
  checks += 1;
})();

// ── 托盘拖拽计划（planTrayDrag）─────────────────────────────────────────
/**
 * 四个图标的冻结槽位（宽 28、间隔 2）：left 0/30/60/90，center 14/44/74/104。
 * 这是「手势开始时量一次」的那份数据 —— 拖动期间不再读 DOM，所以两个方向完全对称。
 */
const SLOTS = [
  { id: 'a', left: 0, width: 28, center: 14 },
  { id: 'b', left: 30, width: 28, center: 44 },
  { id: 'c', left: 60, width: 28, center: 74 },
  { id: 'd', left: 90, width: 28, center: 104 },
];
const ids = (plan) => plan.order.join('');

check(() => {
  // 原地不动（指针还没越过任何中心线）：顺序不变、没有位移、预览落在自己槽位
  const plan = planTrayDrag(SLOTS, 'a', 20);
  assert.equal(plan.to, 0);
  assert.equal(ids(plan), 'abcd');
  assert.deepEqual(plan.shift, {});
  assert.equal(plan.slot.left, 0, '预览落在自己原来的槽位');
  assert.equal(plan.slot.width, 28);
});

check(() => {
  // 从左往右：拖 a 越过 b 的中心线（44）→ a 排到第 2 位，b 左移一格
  const plan = planTrayDrag(SLOTS, 'a', 50);
  assert.equal(plan.to, 1);
  assert.equal(ids(plan), 'bacd');
  assert.deepEqual(plan.shift, { b: -30 }, 'b 整格左移（让出空位）');
  assert.equal(plan.slot.left, 30, '预览落在被让出来的那个槽位');

  // 一直拖到最右
  const end = planTrayDrag(SLOTS, 'a', 200);
  assert.equal(end.to, 3);
  assert.equal(ids(end), 'bcda');
  assert.deepEqual(end.shift, { b: -30, c: -30, d: -30 }, '中间的图标各左移一格');
  assert.equal(end.slot.left, 90);
});

check(() => {
  // 从右往左：拖 d 越过 b/c 的中心线 → d 排到第 2 位，b/c 各右移一格
  // （历史 bug 就是「只能单向拖」，所以两个方向都必须有用例钉着）
  const plan = planTrayDrag(SLOTS, 'd', 40);
  assert.equal(plan.to, 1);
  assert.equal(ids(plan), 'adbc');
  assert.deepEqual(plan.shift, { b: 30, c: 30 }, 'b、c 各右移一格');
  assert.equal(plan.slot.left, 30, '预览落在空出来的那一格');

  // 一直拖到最左
  const end = planTrayDrag(SLOTS, 'd', 0);
  assert.equal(end.to, 0);
  assert.equal(ids(end), 'dabc');
  assert.deepEqual(end.shift, { a: 30, b: 30, c: 30 });
  assert.equal(end.slot.left, 0);
});

check(() => {
  // 双向可逆：把 a 拖到最右之后的顺序，再把 a 拖回最左，应当回到原顺序
  const right = planTrayDrag(SLOTS, 'a', 200);
  assert.equal(ids(right), 'bcda');
  // 用新顺序对应的槽位（a 现在在最后一格）再往左拖
  const moved = [
    { id: 'b', left: 0, width: 28, center: 14 },
    { id: 'c', left: 30, width: 28, center: 44 },
    { id: 'd', left: 60, width: 28, center: 74 },
    { id: 'a', left: 90, width: 28, center: 104 },
  ];
  assert.equal(ids(planTrayDrag(moved, 'a', 0)), 'abcd', '拖回最左必须能还原');
  // 只越过 b 的中心线（14）就排到 b 后面
  assert.equal(ids(planTrayDrag(moved, 'a', 30)), 'bacd');
  assert.equal(ids(planTrayDrag(moved, 'a', 50)), 'bcad', '越过 b、c 的中心线就排到 c 后面');
});

check(() => {
  // 边界：不在槽位里的 id（例如已进溢出菜单）→ 什么都不做
  const plan = planTrayDrag(SLOTS, 'zz', 50);
  assert.equal(plan.to, -1);
  assert.equal(ids(plan), 'abcd');
  assert.deepEqual(plan.shift, {});
  assert.equal(plan.slot, null);
  // 单个图标：拖不动，但也不能抛
  const single = planTrayDrag([SLOTS[0]], 'a', 9999);
  assert.equal(ids(single), 'a');
  assert.equal(single.to, 0);
  assert.deepEqual(planTrayDrag([], 'a', 0).order, []);
});

// ── 菜单操作与清理 ──────────────────────────────────────────────────────
check(() => {
  const order = ['a', 'b', 'c'];
  assert.deepEqual(moveInOrder(order, 'b', -1), ['b', 'a', 'c']);
  assert.deepEqual(moveInOrder(order, 'b', 1), ['a', 'c', 'b']);
  assert.deepEqual(moveInOrder(order, 'a', -1), order, '越界原样返回');
  assert.deepEqual(moveInOrder(order, 'zz', 1), order, '不在册原样返回');
});

check(() => {
  assert.deepEqual(setHiddenInList(['a'], 'b', true), ['a', 'b']);
  assert.deepEqual(setHiddenInList(['a'], 'a', true), ['a'], '重复隐藏必须幂等');
  assert.deepEqual(setHiddenInList(['a', 'b'], 'a', false), ['b']);
  // 禁用集合与隐藏集合是同一套成员语义
  assert.deepEqual(setDisabledInList([], 'a', true), ['a']);
  assert.deepEqual(setDisabledInList(['a'], 'a', true), ['a'], '重复禁用必须幂等');
  assert.deepEqual(setDisabledInList(['a', 'b'], 'a', false), ['b']);
});

// ── 一维拖拽排序（托盘图标换序）：左右两个方向都要能过 ──────────────────
check(() => {
  const order = ['a', 'b', 'c'];
  // 从左往右：拖 a 到最右（其余项中心线都落在指针左边）→ 必须成功
  assert.deepEqual(reorderByPointer(order, 'a', [10, 50], 100), ['b', 'c', 'a']);
  // 从右往左：拖 c 到最左 → 必须成功（旧实现只有这个方向能用）
  assert.deepEqual(reorderByPointer(order, 'c', [10, 50], 0), ['c', 'a', 'b']);
  // 中线判定：其余项是 [b, c]，中心线分别在 10 / 50
  assert.deepEqual(reorderByPointer(order, 'a', [10, 50], 9), order.slice(), '没过 b 的中线不动');
  assert.deepEqual(reorderByPointer(order, 'a', [10, 50], 11), ['b', 'a', 'c'], '过了 b 的中线就换位');
  assert.deepEqual(reorderByPointer(order, 'a', [10, 50], 30), ['b', 'a', 'c'], '在 b 与 c 之间');
  assert.deepEqual(reorderByPointer(order, 'a', [10, 50], 51), ['b', 'c', 'a'], '过了 c 的中线到末尾');
  // 幂等：结果再算一次还是它自己（这是「不振荡」的判据）
  const once = reorderByPointer(order, 'a', [10, 50], 100);
  assert.deepEqual(reorderByPointer(once, 'a', [10, 50], 100), once);
  // 参数不自洽时原样返回副本（少一个坐标就不动，宁可这一次不排序）
  assert.deepEqual(reorderByPointer(order, 'a', [10], 100), order, '坐标数量不匹配必须不动');
  assert.deepEqual(reorderByPointer(order, 'zz', [10, 50], 100), order, '不在列表里必须不动');
  assert.notEqual(reorderByPointer(order, 'zz', [10, 50], 100), order, '必须返回副本而不是同一引用');
  assert.deepEqual(order, ['a', 'b', 'c'], '入参不得被改动');
});

check(() => {
  const state = {
    v: STORE_VERSION,
    tray: { order: ['alpha:one', 'beta:two'], hidden: ['alpha:one'] },
    cards: {
      'alpha:one': { x: 0, y: 0, w: 300, h: 200, minimized: false, open: true, locked: true },
      'beta:two': { x: 0, y: 0, w: 300, h: 200, minimized: false, open: false, locked: false },
    },
    lastOpenId: 'alpha:one',
    zOrder: ['beta:two', 'alpha:one'],
    popoverId: 'alpha:one',
    popoverOrigin: 'click',
    disabled: ['alpha:one'],
  };
  const out = pruneId(state, 'alpha:one');
  assert.deepEqual(out.tray.order, ['beta:two']);
  assert.deepEqual(out.tray.hidden, []);
  assert.deepEqual(Object.keys(out.cards), ['beta:two']);
  assert.equal(out.lastOpenId, null);
  assert.deepEqual(out.zOrder, ['beta:two'], '卸载必须把层叠顺序里的残留清掉');
  assert.equal(out.popoverId, null, '卸载必须把内容面目标清掉');
  assert.equal(out.popoverOrigin, null);
  assert.deepEqual(out.disabled, [], '卸载必须把禁用记录清掉');
  assert.deepEqual(Object.keys(state.cards).length, 2, 'pruneId 不得改动入参');
});

console.log(`check-store.mjs ok (${String(checks)} checks)`);
void clampRect;
