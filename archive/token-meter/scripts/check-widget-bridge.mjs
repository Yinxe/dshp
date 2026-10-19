#!/usr/bin/env node
/**
 * 宿主桥自检：legacy id → `@dshp/widget-kit` 的 id 编码必须**合法、稳定、不撞车**。
 *
 * 三件事各自会怎么坏：
 *  - **不合法**：宿主 `register()` 直接抛 `WidgetSpecError`，那张小组件永远弹不出来；
 *  - **不稳定**：宿主按 id 存卡片几何，同一 id 两次编码得到不同宿主 id = 每次刷新布局重置；
 *  - **撞车**：两个 id 拿到同一个宿主 id，后注册者覆盖前者，一张卡片凭空消失。
 *
 * 2026-09 UI 重构后只剩**统计族**（`stats:<kind>`）：额度改成了侧边栏按钮 + 上方浮层
 * （不是可弹出卡片），峰谷显示器随额度显示面删除，因此这里不再有供应商 id 的 slug 编码。
 *
 * 纯函数、不依赖浏览器，所以放进 `pnpm test`。
 */
import assert from 'node:assert/strict';
import {
  FLOAT_SIZES,
  STATS_KINDS,
  STATS_TITLES,
  WK_CARD_FLOOR,
  WK_ID_PATTERN,
  WK_OWNER,
  decodeFloatId,
  encodeFloatId,
  floatFamily,
  floatSize,
  floatTitle,
  hash32,
  isFloatId,
} from '../src/client/widget-bridge.ts';

let groups = 0;
const check = (name, fn) => {
  fn();
  groups += 1;
  console.log('✓ ' + name);
};

/** 会在宿主 `register()` 里被拒的形状，这里提前拦下来。 */
const assertLegal = (wkId, legacy) => {
  assert.match(wkId, WK_ID_PATTERN, `${legacy} → ${wkId} 不是合法的宿主 id`);
  assert.equal(wkId.slice(0, wkId.indexOf(':')), WK_OWNER, `${legacy} → ${wkId} owner 段不对`);
};

/** 故意难看、且**不属于任何已知族**的 id：走 x-<hash> 保底分支。 */
const ALIENS = [
  'whatever',
  'online:today',
  'peak',
  'quota:deepseek',
  'x'.repeat(200),
  'weird\u0000control',
  '额度',
  'a:b:c',
];

check('1. legacy → 宿主 id：全部合法（owner 段 + 形状）', () => {
  for (const kind of STATS_KINDS) assertLegal(encodeFloatId('stats:' + kind), 'stats:' + kind);
  for (const id of ALIENS) assertLegal(encodeFloatId(id), id);
});

check('2. 编码稳定：同一输入永远同一 id（几何持久化的前提）', () => {
  for (const kind of STATS_KINDS) {
    assert.equal(encodeFloatId('stats:' + kind), encodeFloatId('stats:' + kind));
  }
  for (const id of ALIENS) assert.equal(encodeFloatId(id), encodeFloatId(id));
  // 哈希对固定输入固定（换实现就会让所有人的布局重置，必须显式钉住）
  assert.equal(hash32('deepseek'), 'fqfx');
  assert.equal(hash32(''), 'ztnt');
  // 统计族不走哈希：id 直读，改族名就会改宿主 id（有意为之，族名是契约）
  assert.equal(encodeFloatId('stats:heat'), 'token-meter:stats-heat');
});

check('3. 不撞车：不同来源得到不同宿主 id', () => {
  const seen = new Map();
  for (const id of [...STATS_KINDS.map((kind) => 'stats:' + kind), ...ALIENS]) {
    const wk = encodeFloatId(id);
    assert.equal(seen.has(wk), false, `${id} 与 ${String(seen.get(wk))} 撞成 ${wk}`);
    seen.set(wk, id);
  }
});

check('4. 统计族可反解：stats:* 往返一致', () => {
  for (const kind of STATS_KINDS) {
    assert.equal(decodeFloatId(encodeFloatId('stats:' + kind)), 'stats:' + kind);
  }
  // 保底分支与别的 owner 都不认
  assert.equal(decodeFloatId(encodeFloatId('peak')), null);
  assert.equal(decodeFloatId(encodeFloatId('quota:deepseek')), null);
  assert.equal(decodeFloatId('other-plugin:stats-heat'), null);
  assert.equal(decodeFloatId('stats:heat'), null);
});

check('5. isFloatId：只认统计族', () => {
  assert.equal(isFloatId('stats:cards'), true);
  for (const kind of STATS_KINDS) assert.equal(isFloatId('stats:' + kind), true);
  assert.equal(isFloatId('stats:nope'), false);
  assert.equal(isFloatId('peak'), false, '峰谷显示器已删除，不该再被当成小组件');
  assert.equal(isFloatId('quota:deepseek'), false, '额度已改为侧边栏按钮，不该再注册卡片');
  assert.equal(isFloatId('online:today'), false);
  assert.equal(isFloatId(''), false);
});

check('6. 标题：默认表 + 调用方提示', () => {
  for (const kind of STATS_KINDS) {
    assert.equal(floatTitle('stats:' + kind), STATS_TITLES[kind]);
  }
  assert.equal(floatTitle('stats:trend', '自定义标题'), '自定义标题');
  // 空提示回落到默认表（不能出现没有标题的卡片）
  assert.equal(floatTitle('stats:trend', ''), STATS_TITLES.trend);
  assert.equal(floatTitle('whatever'), '用量统计');
});

check('7. 尺寸表：逐族各有一套，且不越框架地板', () => {
  const families = Object.keys(FLOAT_SIZES);
  assert.equal(families.length, 5, '尺寸族数量变了（新增小组件族时这里要一起加）');

  // 映射：legacy id → 族
  for (const kind of STATS_KINDS) assert.equal(floatFamily('stats:' + kind), kind);
  assert.equal(floatFamily('whatever'), 'cards', '未知 id 要有保底族（不能没尺寸）');

  // 不变量：最小尺寸不得低于框架地板、初始不得小于最小
  for (const [family, size] of Object.entries(FLOAT_SIZES)) {
    assert.ok(
      size.minSize.w >= WK_CARD_FLOOR.w && size.minSize.h >= WK_CARD_FLOOR.h,
      `${family} 的最小尺寸 ${size.minSize.w}×${size.minSize.h} 低于框架地板，注册会被拒`,
    );
    assert.ok(
      size.defaultSize.w >= size.minSize.w && size.defaultSize.h >= size.minSize.h,
      `${family} 的初始尺寸小于最小尺寸`,
    );
    for (const value of [size.defaultSize.w, size.defaultSize.h, size.minSize.w, size.minSize.h]) {
      assert.ok(Number.isInteger(value) && value > 0, `${family} 的尺寸必须是正整数`);
    }
  }

  // 「各自主适配」而不是一套尺寸打天下：宽高都要有足够多的不同取值
  const widths = new Set(Object.values(FLOAT_SIZES).map((size) => size.defaultSize.w));
  const heights = new Set(Object.values(FLOAT_SIZES).map((size) => size.defaultSize.h));
  assert.ok(widths.size >= 4, `初始宽度只有 ${String(widths.size)} 种，应该是逐族适配的`);
  assert.ok(heights.size >= 4, `初始高度只有 ${String(heights.size)} 种，应该是逐族适配的`);

  // 内容形状要真的体现在数字上：热力图宽而扁，模型分布要留高，今日卡最小
  assert.ok(FLOAT_SIZES.heat.defaultSize.h < FLOAT_SIZES.trend.defaultSize.h, '热力图该比趋势矮');
  assert.ok(FLOAT_SIZES.heat.defaultSize.w > FLOAT_SIZES.trend.defaultSize.w, '热力图该比趋势宽');
  assert.ok(FLOAT_SIZES.donut.defaultSize.h > FLOAT_SIZES.trend.defaultSize.h, '模型分布该比趋势高');
  assert.ok(FLOAT_SIZES.today.defaultSize.w < FLOAT_SIZES.heat.defaultSize.w, '今日卡该比热力图窄');

  // floatSize 每次返回同一个对象（调用方不该改它，也不该每次新建）
  assert.equal(floatSize('stats:heat'), floatSize('stats:heat'));
  assert.equal(floatSize('stats:heat'), FLOAT_SIZES.heat);
});

console.log(`\n宿主桥自检通过：${String(groups)} 组`);
