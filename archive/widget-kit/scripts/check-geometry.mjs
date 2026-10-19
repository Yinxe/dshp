#!/usr/bin/env node
/**
 * 几何数学自检（纯函数，Node 直接 import TS 源码）
 *
 * 覆盖：夹紧（整卡留在视口内）、默认层叠落点、内容盒换算、尺寸档阈值、
 * 八向缩放（对边固定、min/max、北向不越过 y=0）、z 序，
 * 以及**吸附候选**（贴邻卡与视口边、边缘对齐、间隔；没有目标时原样返回 —— 候选只是候选，
 * 是否采用由「松手时预览框还在不在」决定，见 src/client/service.ts 的 setLive/commitLive）。
 *
 * 为什么用 `import '../src/client/geometry.ts'`：Node 24 的 TS 类型擦除可以直跑 `.ts`
 * （本仓 CI 与 .nvmrc 都是 24）。这也要求 geometry.ts / spec.ts **自包含**：只允许 `import type`，
 * 值导入的 `./x.js` 在 Node 里解析不到。三处与 spec.ts 重复的常量在这里断言相等。
 */

import assert from 'node:assert/strict';
import {
  CAPSULE_MIN_WIDTH,
  CAPSULE_SLACK,
  CASCADE_STEP,
  CONTENT_PADDING,
  RESIZE_DIRS,
  SNAP_DISTANCE,
  SNAP_GAP,
  TITLE_BAR_HEIGHT,
  applyResize,
  bringToFront,
  capsuleOverflowFix,
  capsuleWidth,
  clampRect,
  clampSize,
  containRect,
  contentBox,
  defaultRect,
  headerActions,
  isSameRect,
  maxSizeFor,
  sizeClassOf,
  snapRect,
} from '../src/client/geometry.ts';
import { SPEC_DEFAULTS } from '../src/client/spec.ts';

const VP = { width: 1280, height: 800 };
const CONSTRAINTS = { min: { w: 240, h: 140 }, max: null };

let checks = 0;
function check(label, fn) {
  fn();
  checks += 1;
  void label;
}

// ── 与 spec.ts 的常量不漂移 ──────────────────────────────────────────────
check('constants', () => {
  assert.equal(TITLE_BAR_HEIGHT, SPEC_DEFAULTS.titleBarHeight, 'titleBarHeight 漂移');
  assert.equal(CONTENT_PADDING, SPEC_DEFAULTS.contentPadding, 'contentPadding 漂移');
  assert.equal(SNAP_GAP, SPEC_DEFAULTS.snapGap, 'snapGap 漂移');
  assert.equal(SNAP_DISTANCE, SPEC_DEFAULTS.snapDistance, 'snapDistance 漂移');
  assert.equal(CASCADE_STEP, SPEC_DEFAULTS.cascadeStep, 'cascadeStep 漂移');
  // 胶囊地板宽度：geometry 与 SPEC_DEFAULTS 必须一致
  // （要装下标题需要多宽是量出来的，不再有第二套常量会漂移）
  assert.equal(CAPSULE_MIN_WIDTH, SPEC_DEFAULTS.capsuleMinWidth, 'capsuleMinWidth 漂移');
  assert.ok(CAPSULE_SLACK >= 2 && CAPSULE_SLACK <= 12, `胶囊余量 ${String(CAPSULE_SLACK)}px 离谱`);
});

// ── 标题栏按钮的可见性（`Card` 的 JSX 只读这一份判定） ──────────────────
check('headerActions', () => {
  assert.deepEqual(headerActions({ locked: false, minimizable: true, closable: true }), {
    lock: true,
    minimize: true,
    menu: true,
    close: true,
  });
  // 锁定后只剩「解锁 + ⋯」（最小化 / 关闭进菜单）
  assert.deepEqual(headerActions({ locked: true, minimizable: true, closable: true }), {
    lock: true,
    minimize: false,
    menu: true,
    close: false,
  });
  // 描述符关掉的按钮不渲染：少一个按钮，量出来的胶囊也就窄一点（宽度是量出来的，不是数的）
  assert.equal(headerActions({ locked: false, minimizable: false, closable: true }).minimize, false);
  assert.equal(headerActions({ locked: false, minimizable: true, closable: false }).close, false);
  assert.equal(headerActions({ locked: false, minimizable: false, closable: false }).close, false);
});

// ── 胶囊最终宽度：地板 ↔ 布局宽度 ───────────────────────────────────────
check('capsuleWidth', () => {
  // 需要很窄：地板宽度说了算（再短也给得出手）
  assert.equal(capsuleWidth({ stored: 480, need: 120 }), CAPSULE_MIN_WIDTH);
  // 需要更宽：宽度跟着量到的需要长（+ 余量），不固定压在 160（这正是「标题被挤压」的病根）
  assert.equal(capsuleWidth({ stored: 480, need: 312 }), 312 + CAPSULE_SLACK);
  assert.ok(capsuleWidth({ stored: 480, need: 312 }) > CAPSULE_MIN_WIDTH);
  // 余量只加在「量到」的值上：没量到就老实退回地板值，不凭空变宽
  assert.equal(capsuleWidth({ stored: 480, need: undefined }), CAPSULE_MIN_WIDTH);
  // 上限 = 用户自己选的展开宽度：胶囊不比卡片宽
  assert.equal(capsuleWidth({ stored: 280, need: 500 }), 280);
  // 还没量到（undefined）：退化成地板宽度，而不是 0 宽
  assert.equal(capsuleWidth({ stored: 480, need: undefined }), CAPSULE_MIN_WIDTH);
  assert.equal(capsuleWidth({ stored: 480, need: Number.NaN }), CAPSULE_MIN_WIDTH);
  // 布局宽度比地板还窄（历史记录）：也不得超过它自己
  assert.equal(capsuleWidth({ stored: 120, need: 400 }), 120);
  // 脏输入：非有限 / 非正的 stored 退回地板宽度
  assert.equal(capsuleWidth({ stored: Number.NaN, need: 400 }), CAPSULE_MIN_WIDTH);
  assert.equal(capsuleWidth({ stored: 0, need: 400 }), CAPSULE_MIN_WIDTH);
  // 同一份输入永远同一个数（渲染与几何两边都调它）
  assert.equal(capsuleWidth({ stored: 480, need: 312 }), capsuleWidth({ stored: 480, need: 312 }));
  // 单调：标题越宽，胶囊越宽（在夹紧之前）
  assert.ok(capsuleWidth({ stored: 480, need: 200 }) <= capsuleWidth({ stored: 480, need: 240 }));
  // 取整：写进 style 的必须是整数
  assert.equal(capsuleWidth({ stored: 480, need: 312.6 }) % 1, 0);
});

// ── clampSize ───────────────────────────────────────────────────────────
check('clampSize', () => {
  assert.deepEqual(clampSize({ w: 100, h: 100 }, CONSTRAINTS, VP), { w: 240, h: 140 });
  assert.deepEqual(clampSize({ w: 99999, h: 99999 }, CONSTRAINTS, VP), { w: 1280, h: 800 });
  assert.deepEqual(clampSize({ w: 500, h: 400 }, { min: { w: 240, h: 140 }, max: { w: 480, h: 360 } }, VP), {
    w: 480,
    h: 360,
  });
  assert.deepEqual(clampSize({ w: 360.4, h: 240.6 }, CONSTRAINTS, VP), { w: 360, h: 241 });
});

// ── clampRect ───────────────────────────────────────────────────────────
check('clampRect keeps the whole card inside the viewport', () => {
  // 右越界：整卡可见 → 左边缘最多到 vw - w
  assert.equal(clampRect({ x: 5000, y: 100, w: 360, h: 240 }, CONSTRAINTS, VP).x, 1280 - 360);
  // 左越界：x >= 0
  assert.equal(clampRect({ x: -5000, y: 100, w: 360, h: 240 }, CONSTRAINTS, VP).x, 0);
  // 上越界：y >= 0
  assert.equal(clampRect({ x: 100, y: -80, w: 360, h: 240 }, CONSTRAINTS, VP).y, 0);
  // 下越界：y <= vh - h（整卡可见，不是只保标题栏）
  assert.equal(clampRect({ x: 100, y: 5000, w: 360, h: 240 }, CONSTRAINTS, VP).y, 800 - 240);
  // 尺寸也一起夹
  const r = clampRect({ x: 0, y: 0, w: 10, h: 10 }, CONSTRAINTS, VP);
  assert.deepEqual({ w: r.w, h: r.h }, { w: 240, h: 140 });
  // 卡片比视口还大：只能贴左上角（横向会溢出，这是无解的，但至少抓得到）
  const huge = clampRect({ x: 900, y: 900, w: 5000, h: 5000 }, CONSTRAINTS, { width: 300, height: 200 });
  assert.ok(huge.x <= 0 || huge.x + huge.w > 300, '比视口还大时不再有「整卡可见」可保证');
  assert.equal(huge.x, 0);
  assert.equal(huge.y, 0);
});

check('containRect', () => {
  assert.deepEqual(containRect({ x: -10, y: -10, w: 100, h: 50 }, VP), { x: 0, y: 0, w: 100, h: 50 });
  assert.deepEqual(containRect({ x: 9999, y: 9999, w: 100, h: 50 }, VP), {
    x: 1180,
    y: 750,
    w: 100,
    h: 50,
  });
  assert.deepEqual(containRect({ x: 10.4, y: 10.6, w: 100.2, h: 50.8 }, VP), {
    x: 10,
    y: 11,
    w: 100,
    h: 51,
  });
});

check('maxSizeFor', () => {
  assert.deepEqual(maxSizeFor({ min: { w: 240, h: 140 }, max: { w: 5000, h: 5000 } }, VP), {
    w: 1280,
    h: 800,
  });
  assert.deepEqual(maxSizeFor({ min: { w: 240, h: 140 }, max: { w: 100, h: 100 } }, VP), {
    w: 240,
    h: 140,
  });
});

// ── defaultRect ─────────────────────────────────────────────────────────
check('defaultRect', () => {
  const first = defaultRect(0, { w: 360, h: 240 }, CONSTRAINTS, VP);
  assert.deepEqual(first, { x: 1280 - 360 - 24, y: 88, w: 360, h: 240 });
  const second = defaultRect(1, { w: 360, h: 240 }, CONSTRAINTS, VP);
  assert.equal(second.y - first.y, CASCADE_STEP);
  assert.equal(first.x - second.x, CASCADE_STEP);
  // 回绕：第 6 张与第 0 张同位
  assert.deepEqual(defaultRect(6, { w: 360, h: 240 }, CONSTRAINTS, VP), first);
  // 小视口里被夹回可见区
  const tiny = defaultRect(0, { w: 360, h: 240 }, CONSTRAINTS, { width: 320, height: 200 });
  assert.ok(tiny.y >= 0 && tiny.y <= 200 - TITLE_BAR_HEIGHT);
});

// ── contentBox ──────────────────────────────────────────────────────────
check('contentBox', () => {
  assert.deepEqual(contentBox({ x: 0, y: 0, w: 360, h: 240 }), {
    width: 360 - CONTENT_PADDING * 2,
    height: 240 - TITLE_BAR_HEIGHT - CONTENT_PADDING * 2,
  });
  assert.deepEqual(contentBox({ x: 0, y: 0, w: 4, h: 4 }), { width: 0, height: 0 });
});

// ── sizeClassOf ─────────────────────────────────────────────────────────
check('sizeClassOf', () => {
  const bp = SPEC_DEFAULTS.breakpoints;
  assert.equal(sizeClassOf(bp.compact - 1, bp), 'compact');
  assert.equal(sizeClassOf(bp.compact, bp), 'regular');
  assert.equal(sizeClassOf(bp.wide - 1, bp), 'regular');
  assert.equal(sizeClassOf(bp.wide, bp), 'wide');
  assert.equal(sizeClassOf(Number.NaN, bp), 'regular');
});

// ── applyResize ─────────────────────────────────────────────────────────
check('applyResize single edges', () => {
  const base = { x: 400, y: 300, w: 360, h: 240 };
  const east = applyResize(base, 'e', 50, 0, CONSTRAINTS, VP);
  assert.deepEqual(east, { x: 400, y: 300, w: 410, h: 240 });
  const west = applyResize(base, 'w', 50, 0, CONSTRAINTS, VP);
  assert.deepEqual(west, { x: 450, y: 300, w: 310, h: 240 });
  assert.equal(west.x + west.w, base.x + base.w, '西向缩放右边缘必须固定');
  const south = applyResize(base, 's', 0, 40, CONSTRAINTS, VP);
  assert.deepEqual(south, { x: 400, y: 300, w: 360, h: 280 });
  const north = applyResize(base, 'n', 0, 40, CONSTRAINTS, VP);
  assert.deepEqual(north, { x: 400, y: 340, w: 360, h: 200 });
  assert.equal(north.y + north.h, base.y + base.h, '北向缩放底边缘必须固定');
});

check('applyResize min/max', () => {
  const base = { x: 400, y: 300, w: 360, h: 240 };
  const tiny = applyResize(base, 'e', -100000, 0, CONSTRAINTS, VP);
  assert.equal(tiny.w, CONSTRAINTS.min.w);
  assert.equal(tiny.x, 400, '被 min 挡住时左边缘不动');
  const huge = applyResize(base, 'e', 100000, 0, CONSTRAINTS, VP);
  assert.equal(huge.w, VP.width - base.x, '东向不越过视口右缘');
  const capped = applyResize(base, 'e', 100000, 0, { min: { w: 240, h: 140 }, max: { w: 380, h: 300 } }, VP);
  assert.equal(capped.w, 380);
});

check('applyResize north never hides title bar', () => {
  const atTop = { x: 400, y: 0, w: 360, h: 240 };
  const grown = applyResize(atTop, 'n', 0, -500, CONSTRAINTS, VP);
  assert.equal(grown.y, 0, '顶边不得越过 0');
  assert.equal(grown.h, 240, '被顶边挡住时高度不再增长');
});

check('applyResize corners keep opposite corner fixed', () => {
  const base = { x: 400, y: 300, w: 360, h: 240 };
  const se = applyResize(base, 'se', 30, 20, CONSTRAINTS, VP);
  assert.equal(se.x, base.x);
  assert.equal(se.y, base.y);
  assert.deepEqual({ w: se.w, h: se.h }, { w: 390, h: 260 });
  const nw = applyResize(base, 'nw', 30, 20, CONSTRAINTS, VP);
  assert.equal(nw.x + nw.w, base.x + base.w, '西北缩放右下角固定（x）');
  assert.equal(nw.y + nw.h, base.y + base.h, '西北缩放右下角固定（y）');
  const ne = applyResize(base, 'ne', 30, 20, CONSTRAINTS, VP);
  assert.equal(ne.x, base.x);
  assert.equal(ne.y + ne.h, base.y + base.h);
});

check('applyResize is stable and clamped for every direction', () => {
  const base = { x: 10, y: 5, w: 360, h: 240 };
  for (const dir of RESIZE_DIRS) {
    const out = applyResize(base, dir, -9999, -9999, CONSTRAINTS, VP);
    assert.ok(out.w >= CONSTRAINTS.min.w, `${dir}: 宽度不得小于 min`);
    assert.ok(out.h >= CONSTRAINTS.min.h, `${dir}: 高度不得小于 min`);
    assert.ok(out.y >= 0, `${dir}: 上边界不得越界`);
    assert.ok(out.x >= 0, `${dir}: 左边界不得越界`);
    assert.ok(out.x + out.w <= VP.width, `${dir}: 整卡必须在视口内（右）`);
    assert.ok(out.y + out.h <= VP.height, `${dir}: 整卡必须在视口内（下）`);
  }
});

// ── snapRect（吸附候选）─────────────────────────────────────────────────
check('snapRect: 没有目标时原样返回（只做视口夹紧）', () => {
  const free = { x: 400, y: 300, w: 300, h: 200 };
  assert.deepEqual(snapRect(free, [], VP), free, '空场上不该有吸附');
  const far = { x: 404, y: 304, w: 300, h: 200 };
  assert.deepEqual(snapRect(far, [], VP), far, '离吸附线还远时也不该吸');
  assert.deepEqual(
    snapRect({ x: -50, y: -50, w: 300, h: 200 }, [], VP),
    { x: 0, y: 0, w: 300, h: 200 },
    '越界仍然要夹回视口内',
  );
});

check('snapRect: 贴视口边缘（12px 内吸过去）', () => {
  assert.deepEqual(snapRect({ x: 5, y: 4, w: 300, h: 200 }, [], VP), { x: 0, y: 0, w: 300, h: 200 });
  assert.deepEqual(snapRect({ x: VP.width - 300 - 5, y: VP.height - 200 - 7, w: 300, h: 200 }, [], VP), {
    x: VP.width - 300,
    y: VP.height - 200,
    w: 300,
    h: 200,
  });
});

check('snapRect: 贴到邻卡旁边（带 8px 间隔）', () => {
  const clock = { x: 0, y: 0, w: 360, h: 240 };
  // 离邻卡右缘 6px → 吸成「贴着右缘 + 8px 间隔」；纵向差得多就不对齐
  const near = { x: 360 + SNAP_GAP + 6, y: 400, w: 300, h: 200 };
  assert.deepEqual(snapRect(near, [clock], VP), { x: 360 + SNAP_GAP, y: 400, w: 300, h: 200 });
  // 贴到邻卡左边（离左缘 4px，邻卡不在屏幕边上才有的选）
  const away = { x: 400, y: 0, w: 360, h: 240 };
  const left = { x: 92 + 4, y: 0, w: 300, h: 200 };
  assert.equal(snapRect(left, [away], VP).x + 300, away.x - SNAP_GAP, '贴到邻卡左边');
});

check('snapRect: 边缘对齐（另一轴靠近时顺带对齐）', () => {
  const clock = { x: 400, y: 300, w: 360, h: 240 };
  // 拖到邻卡右侧 3px、顶边差 4px → 两个轴同时命中：贴右边 + 上对齐（用户图里的效果）
  const dragged = { x: 400 + 360 + 3, y: 304, w: 420, h: 300 };
  assert.deepEqual(snapRect(dragged, [clock], VP), {
    x: 400 + 360 + SNAP_GAP,
    y: 300,
    w: 420,
    h: 300,
  });
  // 纵向分开时只做边缘对齐（不贴边）
  const aligned = { x: 405, y: 600, w: 300, h: 200 };
  assert.equal(snapRect(aligned, [clock], VP).x, clock.x, '左边缘对齐');
  assert.equal(snapRect(aligned, [clock], VP).y, 600, '纵向离得远，不动');
});

check('snapRect: 允许与邻卡重叠（不再强制让位）', () => {
  const clock = { x: 400, y: 300, w: 360, h: 240 };
  // 正压在邻卡中间：既没有贴边候选也没有对齐候选（都差 20px 以上）→ 原样返回，就是允许覆盖
  const onTop = { x: 430, y: 320, w: 300, h: 200 };
  assert.deepEqual(snapRect(onTop, [clock], VP), onTop, '用户就是要盖上去时，框架不得把他推开');
  // 只差 3px 就能与邻卡左缘对齐 → 这是候选；采用与否由用户松手决定
  const nearAlign = { x: 403, y: 330, w: 300, h: 200 };
  assert.equal(snapRect(nearAlign, [clock], VP).x, 400, '给出对齐候选');
});

check('snapRect: 结果稳定（同样输入两次跑出同样结果，不会抖）', () => {
  const clock = { x: 400, y: 300, w: 360, h: 240 };
  const target = { x: 766, y: 304, w: 300, h: 200 };
  const once = snapRect(target, [clock], VP);
  assert.deepEqual(snapRect(target, [clock], VP), once);
  assert.deepEqual(snapRect(once, [clock], VP), once, '已吸附的位置再算一次不能变');
});

check('snapRect: 多张邻卡时各轴取最近的候选', () => {
  const a = { x: 0, y: 0, w: 300, h: 200 };
  const b = { x: 308, y: 0, w: 300, h: 200 };
  // 拖到 a 右侧 4px、上方 6px：x 贴 a 的右缘（b 就在那儿），y 贴视口/邻卡上缘
  const target = { x: 300 + SNAP_GAP + 4, y: -6, w: 300, h: 100 };
  const snapped = snapRect(target, [a, b], VP);
  assert.equal(snapped.x, 300 + SNAP_GAP, 'x 贴 a 右缘（也是 b 的左缘）');
  assert.equal(snapped.y, 0, 'y 贴视口上缘');
});

// ── 兜底补差：标题仍被省略时补一次，且不可能振荡 ────────────────────────
check('capsuleOverflowFix', () => {
  // 没溢出 / 溢出非法 → 不补
  assert.equal(capsuleOverflowFix({ need: 200, overflow: 0, capsule: 206, layoutWidth: 480 }), null);
  assert.equal(capsuleOverflowFix({ need: 200, overflow: Number.NaN, capsule: 206, layoutWidth: 480 }), null);
  assert.equal(capsuleOverflowFix({ need: 0, overflow: 5, capsule: 6, layoutWidth: 480 }), null);
  // 真的溢出了（量到的宽度仍不够）→ 补上溢出量 + 1px
  assert.equal(capsuleOverflowFix({ need: 200, overflow: 4, capsule: 206, layoutWidth: 480 }), 205);
  // 已经顶到布局宽度（被上限卡住）→ 不补：否则回报值会无限增长
  assert.equal(capsuleOverflowFix({ need: 400, overflow: 9, capsule: 360, layoutWidth: 360 }), null);
  // 单调有界：每次补出来的值都比原来大，且不会超过「布局宽度」这个上限的量级
  const fixed = capsuleOverflowFix({ need: 200, overflow: 4, capsule: 206, layoutWidth: 480 });
  assert.ok(fixed > 200);
  assert.ok(capsuleWidth({ stored: 480, need: fixed }) >= capsuleWidth({ stored: 480, need: 200 }));
  // 补完一次之后通常就不再需要补：模拟「胶囊跟着变宽 → 溢出归零」
  assert.equal(capsuleOverflowFix({ need: fixed, overflow: 0, capsule: 480, layoutWidth: 480 }), null);
});

// ── z 序 ────────────────────────────────────────────────────────────────
check('bringToFront', () => {
  const order = ['a', 'b', 'c'];
  assert.deepEqual(bringToFront(order, 'a'), ['b', 'c', 'a']);
  assert.equal(bringToFront(order, 'c'), order, '已在最上：必须返回同一引用');
  assert.deepEqual(bringToFront([], 'x'), ['x'], '空序列也能加进去');
  assert.deepEqual(bringToFront(order, 'zzz'), ['a', 'b', 'c', 'zzz'], '不在序列里必须追加到末尾');
});

check('isSameRect', () => {
  assert.equal(isSameRect({ x: 1, y: 2, w: 3, h: 4 }, { x: 1, y: 2, w: 3, h: 4 }), true);
  assert.equal(isSameRect({ x: 1, y: 2, w: 3, h: 4 }, { x: 1, y: 2, w: 3, h: 5 }), false);
});

console.log(`check-geometry.mjs ok (${String(checks)} groups)`);
