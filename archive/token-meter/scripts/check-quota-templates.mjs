#!/usr/bin/env node
/**
 * 自检：**按钮级模板**的通用语义（provider 环的数值/档位/文案）
 *
 * 为什么值得单独一个脚本：环上那个比例是「用户扫一眼就作数」的数字，而它由几条很容易写错的
 * 规则拼出来 —— 多条滚动窗口取最高占用、占用档位 70/90、没有可表达的比例时**不编假比例**、
 * 余额要带币种符号、上游明确报不可用时不能还显示「余额 $12」。这些规则全在
 * `src/client/providers/templates.ts` 里，且该文件只有类型导入（运行时零依赖），
 * 所以可以直接被 node 求值 —— 不需要浏览器，也不需要构建产物。
 *
 * 覆盖的是**通用层**（`defaultRingSpec`）；每个 provider 自己的 `button` 模板在
 * `check-widget-kit-bridge.mjs` 的集成冒烟里用真实快照验证（DeepSeek 充值 100 / 余额 9.06 → bad + 91%）。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { providerPrefs } from '../src/client/quota-prefs.ts';
import {
  balanceText,
  clampPct,
  defaultRingSpec,
  failureRingSpec,
  toneOfPct,
  worstWindowPct,
} from '../src/client/providers/templates.ts';

let groups = 0;
const check = (name, fn) => {
  fn();
  groups += 1;
  console.log('✓ ' + name);
};

/** 只用到三个格式化工具的假 K（templates.ts 里 defaultRingSpec 的真实依赖）。 */
const here = dirname(fileURLToPath(import.meta.url));

/** 额度渲染路径（按钮 + 详情 + 浮层 + 环形 + 供应商图标）：颜色只允许来自主题 token。 */
const QUOTA_RENDER_FILES = [
  'src/client/providers/kit.tsx',
  'src/client/providers/sections.tsx',
  'src/client/providers/registry.tsx',
  'src/client/providers/templates.ts',
  'src/client/providers/ui/commandcode.tsx',
  'src/client/providers/ui/deepseek.tsx',
  'src/client/providers/ui/manual.tsx',
  'src/client/providers/ui/opencode.tsx',
  'src/client/QuotaRing.tsx',
  'src/client/QuotaTrayPanel.tsx',
  'src/client/QuotaSection.tsx',
  'src/client/provider-icons.tsx',
];

const K = {
  curSymbol: (cur) => (cur === 'CNY' ? '¥' : cur === 'USD' ? '$' : cur ? cur + ' ' : ''),
  fmt: (n) => String(n),
  num: (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d),
};

const snap = (patch) => ({
  vendorId: 'v',
  vendorName: '测试供应商',
  ok: true,
  at: '2026-01-01T00:00:00.000Z',
  fetchedAtMs: 0,
  ...patch,
});

/** 按钮上下文（variant/metric/metrics/icon 就是侧边栏按钮与切换行传进去的那几样）。 */
const ctxOf = (s, patch = {}) => ({
  snap: s,
  now: 0,
  type: 'test',
  vendorName: s.vendorName,
  variant: 'wide',
  icon: 'generic',
  prefs: providerPrefs.scope('test-vendor'),
  ...patch,
});

const WINDOWS = [
  { key: '5h', label: '5 小时', pct: 20, used: 0, limit: 100, resetInSec: 0 },
  { key: 'weekly', label: '每周', pct: 55, used: 0, limit: 100, resetInSec: 0 },
  { key: 'monthly', label: '每月', used: 92, limit: 100, resetInSec: 0 },
];

check('1. 占用档位：70 / 90 两条线，非数字=idle', () => {
  assert.equal(toneOfPct(0), 'ok');
  assert.equal(toneOfPct(69.9), 'ok');
  assert.equal(toneOfPct(70), 'warn');
  assert.equal(toneOfPct(89.9), 'warn');
  assert.equal(toneOfPct(90), 'bad');
  assert.equal(toneOfPct(100), 'bad');
  assert.equal(toneOfPct(Number.NaN), 'idle');
  assert.equal(toneOfPct(Number.POSITIVE_INFINITY), 'idle');
});

check('2. clampPct：夹进 0–100；非数字返回 null（= 无数据，而不是 0）', () => {
  assert.equal(clampPct(120), 100);
  assert.equal(clampPct(-5), 0);
  assert.equal(clampPct('42'), 42);
  assert.equal(clampPct(Number.NaN), null);
  assert.equal(clampPct(undefined), null);
  assert.equal(clampPct('abc'), null);
});

check('3. 多窗口取最高：pct 直读，缺失时用 used/limit 现算，坏数据跳过', () => {
  assert.equal(worstWindowPct(snap({})), null);
  assert.equal(worstWindowPct(snap({ windows: [] })), null);
  assert.equal(worstWindowPct(snap({ windows: WINDOWS })), 92, '最高占用应当来自每月窗口（92 > 55 > 20）');
  assert.equal(
    worstWindowPct(
      snap({
        windows: [
          { key: 'bad', label: '坏数据', pct: 'NaN', used: 'x', limit: 0 },
          { key: 'ok', label: '正常', used: 3, limit: 4 },
        ],
      }),
    ),
    75,
    '坏窗口必须被跳过，而不是把整条环算成 0 或 NaN',
  );
  const clipped = worstWindowPct(snap({ windows: [{ key: 'over', label: '超了', used: 12, limit: 10 }] }));
  assert.equal(clipped, 100, '超过 100% 的窗口要夹到 100（否则弧会绕回去）');
});

check('4. 余额文案：带币种符号；上游说不可用/没有余额时不给数字', () => {
  assert.equal(balanceText(snap({ billing: { balance: 9.06, currency: 'CNY' } }), K), '¥9.06');
  assert.equal(balanceText(snap({ billing: { balance: 12, currency: 'USD' } }), K), '$12');
  assert.equal(balanceText(snap({ billing: { balance: 1, currency: 'CNY', isAvailable: false } }), K), null);
  assert.equal(balanceText(snap({ billing: {} }), K), null);
  assert.equal(balanceText(snap({ billing: { balance: 'abc' } }), K), null);
});

check('5. 通用环语义：有窗口 → 按最高占用；只有余额 → 空环 + 金额；失败 → 空环', () => {
  const withWindow = defaultRingSpec(
    ctxOf(snap({ windows: [{ key: 'weekly', label: '每周', pct: 74.4, used: 0, limit: 100 }] })),
    K,
  );
  assert.equal(withWindow.pct, 74.4);
  assert.equal(withWindow.tone, 'warn');
  assert.equal(withWindow.text, '74%');
  assert.match(withWindow.title, /测试供应商/);

  const money = defaultRingSpec(ctxOf(snap({ billing: { balance: 9.06, currency: 'CNY' } })), K);
  assert.equal(money.pct, null, '没有可表达的比例时必须留空（不编 0%）');
  assert.equal(money.tone, 'idle');
  assert.equal(money.text, '¥9.06');

  // 失败：没有比例可表达（空环），但状态必须刺眼 —— 结构化错误说「要人管」就给红圈
  const failed = defaultRingSpec(ctxOf(snap({ ok: false })), K);
  assert.equal(failed.pct, null);
  assert.equal(failed.tone, 'warn', '没有分类信息时按临时性黄圈');
  assert.match(failed.title, /读取失败/);

  const empty = defaultRingSpec(ctxOf(snap({})), K);
  assert.equal(empty.pct, null);
  assert.match(empty.title, /暂无额度数据/);
});

check('6. 失败环：要人管的红圈 / 临时性黄圈，title 用结构化结论', () => {
  const auth = failureRingSpec(
    snap({ ok: false, errorInfo: { tone: 'bad', title: '密钥已失效' } }),
    'DeepSeek 官方',
  );
  assert.equal(auth.pct, null);
  assert.equal(auth.tone, 'bad');
  assert.match(auth.title, /DeepSeek 官方/);
  assert.match(auth.title, /密钥已失效/);

  const net = failureRingSpec(snap({ ok: false, errorInfo: { tone: 'warn', hint: '网络超时' } }), 'Goat');
  assert.equal(net.tone, 'warn');
  assert.match(net.title, /网络超时/);

  const bare = failureRingSpec(snap({ ok: false }), 'Goat');
  assert.equal(bare.tone, 'warn');
  assert.match(bare.title, /额度读取失败/);
});

check('7. 额度渲染路径里没有写死色值（颜色一律来自主题 token）', () => {
  const offenders = [];
  for (const rel of QUOTA_RENDER_FILES) {
    const text = readFileSync(join(here, '..', rel), 'utf8');
    // 只看代码：抠掉块注释与行注释，避免把「说明里提到的旧 hex」也算成违规
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const hit of code.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) offenders.push(rel + ' 里出现 ' + hit);
  }
  assert.deepEqual(offenders, [], '额度图表必须跟随主题：用 var(--dsw-alias-*)，不要写死色值');
});

check('8. 供应商偏好袋：按供应商分作用域、坏数据不崩、可订阅、能清孤儿', () => {
  providerPrefs.clear();
  const goat = providerPrefs.scope('goat');
  assert.equal(goat.get('window', 'monthly'), 'monthly', '没设过时给兜底值（默认月额度）');
  assert.equal(goat.get('balance', '0'), '0');

  // 键名/值域完全由供应商自己定：这里同时存窗口键与布尔开关
  goat.set('window', '5h');
  goat.set('balance', '1');
  assert.equal(goat.get('window'), '5h');
  assert.equal(goat.get('balance'), '1');

  // 作用域隔离：另一个供应商读不到别人存的键
  const other = providerPrefs.scope('ds-main');
  assert.equal(other.get('window', 'monthly'), 'monthly', '别的供应商看不到 goat 的偏好');
  other.set('balance', '1');
  assert.equal(goat.get('window'), '5h', '互不影响');

  // 同一个供应商每次拿到同一个 scope 对象（可以安全放进依赖数组）
  assert.equal(providerPrefs.scope('goat'), goat);

  // 订阅：写一次通知一次
  let hits = 0;
  const off = providerPrefs.subscribe(() => {
    hits += 1;
  });
  goat.set('window', 'weekly');
  assert.equal(hits, 1, '写偏好必须通知订阅者');
  off();
  goat.set('window', 'monthly');
  assert.equal(hits, 1, '退订后不再通知');

  // 非法输入不落地、不抛
  goat.set('window', 'not a window!');
  assert.equal(goat.get('window'), 'monthly', '非法值被忽略，保留上一个有效值');
  goat.set('Bad Key', 'x');
  assert.equal(goat.get('bad key', ''), '', '非法键被忽略');
  goat.set('window', '');
  assert.equal(goat.get('window', 'monthly'), 'monthly', '写空串 = 删掉这个键，回到兜底');

  // 孤儿清理：只保留在册供应商
  providerPrefs.prune(['goat']);
  assert.equal(providerPrefs.scope('ds-main').get('balance', '0'), '0', '被删的供应商偏好清掉');
  assert.equal(goat.get('balance'), '1', '在册的不受影响');

  providerPrefs.clear();
  assert.equal(goat.get('window', 'monthly'), 'monthly');
});

check('9. 色调修饰类不许有裸规则（否则会像 .warn 那样把布局属性泄漏到进度条上）', () => {
  const css = readFileSync(join(here, '..', 'src/client/styles.module.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  // 只看「裸规则」：选择器里这个类单独成段（`.warn {` / `.warn,` / `.warn.bad` 里的第二段不算）
  const ALLOWED =
    /^(background|background-color|color|border|border-color|border-radius|fill|stroke|opacity)/;
  const offenders = [];
  for (const tone of ['ok', 'warn', 'bad', 'over']) {
    const re = new RegExp('(^|})\\s*\\.' + tone + '(\\s*[,{])', 'g');
    for (const hit of css.matchAll(re)) {
      const open = css.indexOf('{', hit.index);
      const close = css.indexOf('}', open);
      if (open < 0 || close < 0) continue;
      const decls = css
        .slice(open + 1, close)
        .split(';')
        .map((d) => d.trim())
        .filter((d) => d !== '');
      for (const decl of decls) {
        if (!ALLOWED.test(decl)) offenders.push('.' + tone + ' → ' + decl);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    '色调类只能是「颜色类」声明：' +
      offenders.join(' / ') +
      '（裸 .warn 曾经把 margin:8px 落到进度条上，70% 变黄时条就消失了）',
  );
});

check('10. 供应商图标：官方品牌路径逐字保留、opencode 是圆角方框', () => {
  const src = readFileSync(join(here, '..', 'src/client/provider-icons.tsx'), 'utf8');
  // DeepSeek 的鲸鱼是**官方路径**（用户给的原文），容易被误截断 → 钉住首尾与宽高比
  assert.match(src, /viewBox: '0 0 23\.16 17\.04'/, 'DeepSeek 必须用官方 viewBox 0 0 23.16 17.04');
  assert.match(src, /ratio: 17\.04 \/ 23\.16/, 'DeepSeek 必须按官方宽高比渲染（不是硬塞进方框）');
  assert.ok(src.includes('M22.9168 1.43018'), '官方鲸鱼路径的开头必须保留');
  assert.ok(src.includes('15.1415 9.79893Z'), '官方鲸鱼路径的结尾必须保留');
  assert.match(src, /fill="currentColor"/, '品牌路径走填充 + currentColor（跟随主题文字色）');
  // 自绘线稿：16 网格 + 1.4 描边；opencode 现在是竖向圆角方框（不再是 `>_`）
  assert.match(src, /const GRID = 16;/, '自绘记号按 16 网格');
  assert.match(src, /const STROKE = 1\.4;/, '自绘记号描边 1.4');
  assert.ok(
    src.includes('viewBox="0 0 16 16"') === false,
    '自绘记号用模板字符串拼 viewBox（这里只做存在性检查）',
  );
  assert.match(src, /opencode:[\s\S]{0,160}<rect /, 'opencode 必须是圆角方框（rect），不是终端提示符');
});

console.log(`\n按钮模板通用语义自检通过：${String(groups)} 组`);
