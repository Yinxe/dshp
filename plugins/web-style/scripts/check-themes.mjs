/**
 * check-themes.mjs —— 主题一致性校验（目录 / client 画廊 meta / 构建产物）。
 *
 * token 单源 src/host/themes（Host 经 GET /themes 下发，client 只存 meta），
 * 本脚本校验 meta 两处同源 + 产物完整：
 *   node scripts/check-themes.mjs        # 需要先 pnpm build（读 lib/host.js 与 lib/client.js）
 *
 * 1. 目录自洽：id 唯一、swatch ≥3 色、label/desc/colorScheme 齐备；
 * 2. client 画廊 meta（src/client/themes.ts）与目录逐项对齐（数量/字段/swatch）；
 * 3. 构建产物：client bundle 含每个 id，且未内联主题 token（静态主题独有的
 *    --dsw-font-markdown-* 不应出现在客户端）；背景效果 id 同样逐个钉在产物里；
 * 4. Host 产物：photo:custom 白名单 + 四条同源路由齐全。
 *
 * 新增主题三步：src/host/themes 加一文件 → themes/index.ts 加 import + expand →
 * src/client/themes.ts 加一条 meta（含 swatch），然后 build + 跑本脚本。
 *
 * 原实现：dsh-custom-ui/scripts/check-themes.mjs（JS 版三处校验）。TS 化后
 * Host 白名单已从目录动态派生，故第 2 项校验点从「client 源码文本」升级为
 * 「client 源码 meta 结构 + 产物存在性」。
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);

// 目录随 Host 产物导出（lib/host.js 为纯声明式 ESM，导入无副作用）。
const { THEME_CATALOG, THEME_IDS, BACKGROUND_IDS } = await import('../lib/host.js');

let fail = 0;
const bad = (msg) => {
  fail++;
  console.error('FAIL ' + msg);
};

// ── 1. 目录自洽 ────────────────────────────────────────────────────────
const seen = new Set();
for (const t of THEME_CATALOG) {
  if (seen.has(t.id)) bad('目录 id 重复：' + t.id);
  seen.add(t.id);
  if (!Array.isArray(t.swatch) || t.swatch.length < 3) bad(`目录 ${t.id} swatch 缺失`);
  if (!t.label || !t.desc || (t.colorScheme !== 'dark' && t.colorScheme !== 'light')) {
    bad(`目录 ${t.id} meta 不全`);
  }
  if (!t.tokens || typeof t.tokens !== 'object' || Object.keys(t.tokens).length < 50) {
    bad(`目录 ${t.id} token 过少（应 ≥50 个 --dsw-*）`);
  }
}
console.log(`目录：${THEME_CATALOG.length} 套主题 / ${THEME_IDS.length} 个 id`);

// ── 1b. 全部主题必须覆盖同一套 token 名 ──────────────────────────────────
// 主题是「全量映射」：任何一套少写或多写一个 token，都会在切主题时留下
// 未被覆盖的旧值（对侧分支拿不到官方原值），且极难靠肉眼发现。
const ref = THEME_CATALOG[0];
const refKeys = Object.keys(ref.tokens ?? {}).toSorted();
for (const t of THEME_CATALOG) {
  const keys = Object.keys(t.tokens ?? {}).toSorted();
  const missing = refKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !refKeys.includes(k));
  if (missing.length) bad(`${t.id} 缺 token：${missing.join(', ')}`);
  if (extra.length) bad(`${t.id} 多 token：${extra.join(', ')}`);
}
console.log(`token 契约：每套 ${refKeys.length} 个（基准 ${ref.id}）`);

// 有意不覆盖的 token：交给 DSH 官方默认值，主题一律不写
for (const t of THEME_CATALOG) {
  for (const k of ['--dsw-alias-markdown-tag']) {
    if (k in (t.tokens ?? {})) bad(`${t.id} 不应覆盖 ${k}（应交给官方默认）`);
  }
}

// ── 1b-2. 侧栏选中行必须「跟随主题品牌色」 ──────────────────────────────
// `--dsw-specific-sidebar-nav-item-active` 是侧栏选中行的胶囊底
// （dsh-client-ui-settings-general 的 .navCell.active），画在 sidebar-fill 之上。
// 约定值 = 品牌色 22% 叠色；此前 33 套里 21 套与 hover 的 ΔE < 5（8 套完全相同），
// 选中态基本不可辨。这里固定住派生关系，避免各写各的再次漂移。
const NAV_ALPHA = 0.22;
const rgb6 = (c) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(c ?? '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
for (const t of THEME_CATALOG) {
  const brand = rgb6(t.tokens?.['--dsw-alias-brand-primary']);
  const nav = String(t.tokens?.['--dsw-specific-sidebar-nav-item-active'] ?? '');
  if (!brand) {
    bad(`${t.id} 的品牌色不是 6 位 hex，无法校验 nav-item-active 派生`);
    continue;
  }
  const want = `rgba(${brand[0]}, ${brand[1]}, ${brand[2]}, ${NAV_ALPHA})`;
  if (nav !== want) bad(`${t.id} nav-item-active 应随品牌色：期望 ${want}，实际 ${nav}`);
}
console.log(`侧栏选中行：${THEME_CATALOG.length} 套均跟随品牌色（${NAV_ALPHA} 叠色）`);

// ── 1b-3. on-primary 墨色必须真的「看得见」 ─────────────────────────────
// `--dsw-alias-label-primary-foreground` 是「画在品牌底上的墨」，DSH 里三处消费：
// primary 按钮文字（._primary_cfgyt_38）、Switch 滑块底色（._thumb_1vyxu_38）、
// Checkbox 勾（.Mbwy4a_checkboxChecked）。官方深色档把它相对 label-primary 反转
// （#f9fafb ↔ #0f1115）；三套深色主题曾照抄浅色值，harness-office 于是
// #ffffff 底 + #ffffff 字 = 1.00:1，设置页那个工具栏按钮就成了纯白无字块。
// 两条判定都只在两侧都是不透明 #rrggbb 时进行 —— rgba() 的落地色取决于它叠在哪一层，算不准。
const lum6 = (c) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum6(a), lum6(b)].toSorted((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
let contrastChecked = 0;
for (const t of THEME_CATALOG) {
  const raw = (k) => String(t.tokens?.[k] ?? '');
  const fgName = '--dsw-alias-label-primary-foreground';
  const fillName = '--dsw-alias-button-primary-fill';
  const labelName = '--dsw-alias-label-primary';
  const fg = rgb6(raw(fgName));
  const fill = rgb6(raw(fillName));
  const label = rgb6(raw(labelName));
  if (fg && fill) {
    contrastChecked++;
    const r = ratio(fill, fg);
    if (r < 3)
      bad(
        `${t.id} primary 按钮不可读：${raw(fillName)} 底 + ${raw(fgName)} 字 = ${r.toFixed(2)}:1（应 ≥3:1）`,
      );
  }
  if (fg && label) {
    contrastChecked++;
    const r = ratio(label, fg);
    if (r < 4.5)
      bad(
        `${t.id} ${fgName} 与 ${labelName} 同极性（${r.toFixed(2)}:1）—— 它是 on-primary 墨，深色档必须反转`,
      );
  }
}
console.log(`on-primary 墨色：${contrastChecked} 项对比度校验通过`);

// ── 1b-4. toast 文字色必须与 toast 面成对 ───────────────────────────────
// 0.2.0-rc.2 才把 toast 文字色抽成 `--dsw-alias-toast-label`，官方默认值是静态白
// （`--dsw-static-neutral-bluish-00`），并且在注释里假定 toast 面「两档都是深面」。
// 本套主题的浅色档把 toast-bg 定成浅面（白 / 象牙 / 米色），只覆盖 toast-bg 不覆盖
// toast-label 就是白底白字 —— 这条同时钉住「必须定义」与「必须可读」。
let toastChecked = 0;
for (const t of THEME_CATALOG) {
  const bgRaw = String(t.tokens?.['--dsw-alias-toast-bg'] ?? '');
  const labelRaw = t.tokens?.['--dsw-alias-toast-label'];
  if (typeof labelRaw !== 'string' || labelRaw === '') {
    bad(`${t.id} 缺 --dsw-alias-toast-label（官方默认白字，浅色 toast 面会白底白字）`);
    continue;
  }
  const bg = rgb6(bgRaw);
  const fg = rgb6(labelRaw);
  if (bg && fg) {
    toastChecked++;
    const r = ratio(bg, fg);
    if (r < 4.5) bad(`${t.id} toast 不可读：${bgRaw} 底 + ${labelRaw} 字 = ${r.toFixed(2)}:1（应 ≥4.5:1）`);
  }
}
console.log(`toast 文字色：${toastChecked} 项对比度校验通过（其余为非不透明 hex，仅校验存在性）`);

// ── 1c. 官方基线必须等于 DSH 当前值 ────────────────────────────────────
// OFFICIAL_LIGHT/DARK 是对侧 scheme 的「无操作原值」；一旦漂移，选浅色主题再切
// 深色就会把 DSH 的旧配色涂回去（历史上漂移过 65/88 项）。
// 快照由 scripts/sync-official.mjs 生成；这里离线比对，无需安装 DSH。
const baselinePath = join(here, 'dsw-alias-baseline.json');
if (!existsSync(baselinePath)) {
  bad('缺 scripts/dsw-alias-baseline.json（跑 node scripts/sync-official.mjs 生成）');
} else {
  const base = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const offSrc = readFileSync(join(root, 'src', 'client', 'official.ts'), 'utf8');
  const parseExport = (name) => {
    const s = offSrc.indexOf(`export const ${name}`);
    const e = offSrc.indexOf('\n};', s);
    const out = {};
    for (const m of offSrc.slice(s, e).matchAll(/'(--dsw-[A-Za-z0-9_-]+)'\s*:\s*'([^']*)'/g)) {
      out[m[1]] = m[2];
    }
    return out;
  };
  for (const [name, want] of [
    ['OFFICIAL_LIGHT', base.light],
    ['OFFICIAL_DARK', base.dark],
  ]) {
    const got = parseExport(name);
    const wKeys = Object.keys(want).toSorted();
    const gKeys = Object.keys(got).toSorted();
    for (const k of wKeys) {
      if (!(k in got)) bad(`${name} 缺 ${k}`);
      else if (got[k] !== want[k]) bad(`${name} ${k} 漂移：${got[k]} ≠ ${want[k]}`);
    }
    for (const k of gKeys) if (!wKeys.includes(k)) bad(`${name} 多出 ${k}（DSH 未定义）`);
  }
  console.log(
    `官方基线：${base._meta?.dshVersion ?? '未知版本'} / light ${Object.keys(base.light).length} / dark ${Object.keys(base.dark).length}（与 DSH 快照一致）`,
  );
}

// ── 2. client 画廊 meta 与目录逐项对齐 ─────────────────────────────────
const clientSrc = readFileSync(join(root, 'src', 'client', 'themes.ts'), 'utf8');
const entryRe =
  /\{\s*id:\s*'([^']+)',\s*colorScheme:\s*'(dark|light)',\s*label:\s*'([^']*)',\s*desc:\s*'([^']*)',\s*swatch:\s*\[([^\]]*)\],?\s*\}/g;
const clientEntries = [...clientSrc.matchAll(entryRe)];
console.log(`client 画廊：${clientEntries.length} 条`);
if (clientEntries.length !== THEME_CATALOG.length) {
  bad(`数量不一致：client ${clientEntries.length} vs 目录 ${THEME_CATALOG.length}`);
}
for (const t of THEME_CATALOG) {
  const m = clientEntries.find((x) => x[1] === t.id);
  if (!m) {
    bad('client 缺条目：' + t.id);
    continue;
  }
  if (m[2] !== t.colorScheme) bad(`${t.id} colorScheme 不一致`);
  if (m[3] !== t.label) bad(`${t.id} label 不一致：${m[3]} vs ${t.label}`);
  if (m[4] !== t.desc) bad(`${t.id} desc 不一致：${m[4]} vs ${t.desc}`);
  const sw = m[5].split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
  for (let i = 0; i < 3; i++) {
    if (sw[i] !== t.swatch[i]) bad(`${t.id} swatch[${i}] 不一致：${sw[i]} vs ${t.swatch[i]}`);
  }
}
const clientIds = new Set(clientEntries.map((m) => m[1]));
for (const id of clientIds) {
  if (!THEME_IDS.includes(id)) bad('client 多余条目：' + id);
}

// ── 3. client 构建产物 ────────────────────────────────────────────────
const clientBundle = readFileSync(join(root, 'lib', 'client.js'), 'utf8');
for (const id of THEME_IDS) {
  // esbuild 产物统一双引号，两种引号都认
  if (!clientBundle.includes("'" + id + "'") && !clientBundle.includes('"' + id + '"')) {
    bad('client bundle 缺主题 id（未重新 build？）：' + id);
  }
}
if (clientBundle.includes('--dsw-font-markdown-')) {
  bad('client bundle 内联了静态主题 token（应从 Host /themes 下发）');
}

// ── 3b. 背景效果 id：Host 白名单 ↔ client 登记表 ────────────────────────
// 两半是两个 bundle、没有共享模块，所以白名单（src/host/config.ts）和登记表
// （src/client/background.ts）各列一份。这条钉住「Host 认的每个 id 在 client 产物里真找得到」，
// 漏登记、漏构建都会当场命中。
if (!Array.isArray(BACKGROUND_IDS) || BACKGROUND_IDS.length === 0) {
  bad('Host 未导出 BACKGROUND_IDS（背景效果白名单）');
}
for (const id of BACKGROUND_IDS ?? []) {
  if (!clientBundle.includes("'" + id + "'") && !clientBundle.includes('"' + id + '"')) {
    bad('client bundle 缺背景效果 id（登记表漏了？未重新 build？）：' + id);
  }
}
console.log(`背景效果：Host 白名单 ${BACKGROUND_IDS?.length ?? 0} 个 id 均在 client 产物中`);

// ── 4. Host 产物 ─────────────────────────────────────────────────────
const hostBundle = readFileSync(join(root, 'lib', 'host.js'), 'utf8');
for (const path of [
  '/ext/dshp-web-style/state',
  '/ext/dshp-web-style/themes',
  '/ext/dshp-web-style/theme',
  '/ext/dshp-web-style/config',
]) {
  if (!hostBundle.includes(path)) bad('Host 缺路由：' + path);
}
if (!hostBundle.includes('photo:custom')) bad('Host 缺 photo:custom 虚拟主题白名单');
if (!hostBundle.includes('dshp-web-style')) bad('Host 缺 NS（dshp-web-style）注册');

// 配置只认 NS：历史键 / 迁移代码不得回归（docs/settings.md「不做迁移」）
for (const symbol of ['migrateYamlNamespaceKey', 'LEGACY_SETTINGS_KEYS', 'storages/', 'dshp-inx-custom-ui']) {
  if (hostBundle.includes(symbol)) {
    bad('Host 产物含已废弃的历史键/迁移代码：' + symbol + '（配置只认 NS，不做迁移）');
  }
}

if (fail > 0) {
  console.error(`\n${fail} 项不一致`);
  process.exit(1);
}
console.log('目录 / client meta / 产物一致 ✓');
