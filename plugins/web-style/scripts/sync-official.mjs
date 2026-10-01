/**
 * sync-official.mjs —— 从已安装的 DSH 重新生成「官方基线」。
 *
 * 背景：`src/client/official.ts` 的 OFFICIAL_LIGHT / OFFICIAL_DARK 是覆盖层
 * 对侧 scheme 的「无操作原值」。它必须逐字等于 DSH 当前 `--dsw-*` 定义，
 * 否则选了浅色主题再切深色时，覆盖层会把 DSH 的旧配色涂回去。
 * 历史上这份基线是手抄的，漂移了 65/88 项 —— 本脚本把它变成可复现的产物。
 *
 * 用法：
 *   node scripts/sync-official.mjs            # 从 node_modules 里的 DSH 读取并重写
 *   node scripts/sync-official.mjs --check    # 只校验，不写（check-themes.mjs 复用）
 *
 * 产物：
 *   scripts/dsw-alias-baseline.json           # 提交进仓库的快照（CI 离线校验用）
 *   src/client/official.ts                    # 重新生成
 *
 * 来源与口径：
 *   - 只取 alias / specific 两类 token（主题会覆盖的语义面）
 *   - 亮色取 `body` 规则；暗色取 `body[data-ds-dark-theme]`，该块未覆写的沿用亮色值
 *   - 值逐字保留（var() 引用、十六进制、rgba 原样）
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const FIXTURE = join(here, 'dsw-alias-baseline.json');
const TARGET = join(root, 'src', 'client', 'official.ts');
const CHECK = process.argv.includes('--check');

/**
 * 定位 dsh-client-ui-theme 的 client bundle；找不到就返回 null。
 *
 * 插件自身不依赖 DSH，所以按候选基目录逐个 resolve：
 *   1. 环境变量 DSH_THEME_BUNDLE 直指 bundle
 *   2. 插件自身（若装了 DSH）
 *   3. $DSH_HOME/profiles/<profile>（web / headless / sdk …）—— 实际运行环境
 *   4. $DSH_HOME/profiles/node_modules（旧布局）
 * 这样本地开发和 CI 都能拿到真实基线，拿不到就回退提交进仓库的 fixture。
 */
function locateThemeBundle() {
  const direct = process.env.DSH_THEME_BUNDLE;
  if (direct && existsSync(direct)) return direct;

  const bases = [root, process.cwd()];
  const home = process.env.DSH_HOME || join(process.env.HOME ?? '', '.dsh');
  const profiles = join(home, 'profiles');
  if (existsSync(profiles)) {
    bases.push(profiles, join(profiles, 'node_modules'));
    for (const name of readdirSync(profiles)) {
      if (name !== 'node_modules') bases.push(join(profiles, name));
    }
  }

  for (const base of bases) {
    try {
      const req = createRequire(join(base, '__resolve__.js'));
      const pkg = req.resolve('@deepseek-ai/dsh-client-ui-theme/package.json');
      const p = join(dirname(pkg), 'lib', 'client.js');
      if (existsSync(p)) return p;
    } catch {
      /* 该基目录没装，继续 */
    }
  }
  return null;
}

/** 把 bundle 里所有 CSS 字符串拆成 selector → (token → value)。 */
function parseBlocks(js) {
  const blocks = new Map();
  for (const m of js.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
    const css = m[1].replace(/\\"/g, '"');
    if (!css.includes('--dsw-') || !css.includes('{')) continue;
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = rule[1].replace(/\s+/g, ' ').trim();
      const body = rule[2];
      if (!body.includes('--dsw-')) continue;
      if (!blocks.has(sel)) blocks.set(sel, new Map());
      const tgt = blocks.get(sel);
      for (const d of body.matchAll(/(--dsw-[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g)) {
        tgt.set(d[1], d[2].trim());
      }
    }
  }
  return blocks;
}

const isSemantic = (t) => t.startsWith('--dsw-alias-') || t.startsWith('--dsw-specific-');

/** 抽取基线快照。 */
function buildBaseline(bundlePath) {
  const blocks = parseBlocks(readFileSync(bundlePath, 'utf8'));
  const body = blocks.get('body') ?? new Map();
  const dark = blocks.get('body[data-ds-dark-theme]') ?? new Map();
  const light = {};
  const dk = {};
  for (const name of [...body.keys()].toSorted()) {
    if (!isSemantic(name)) continue;
    light[name] = body.get(name);
    dk[name] = dark.get(name) ?? body.get(name);
  }
  return { light, dark: dk };
}

/** 主题包版本（写进快照，漂移时可归因到具体 DSH 版本）。 */
function themeVersion(bundlePath) {
  try {
    const pkg = JSON.parse(readFileSync(join(dirname(dirname(bundlePath)), 'package.json'), 'utf8'));
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/* ── 取基线：优先真实安装，缺失时回退 fixture ───────────────────────── */
const bundle = locateThemeBundle();
let baseline;
let source;
if (bundle) {
  baseline = buildBaseline(bundle);
  source = bundle;
  baseline = {
    _meta: {
      dshVersion: themeVersion(bundle),
      source: bundle,
      syncedAt: new Date().toISOString().slice(0, 10),
    },
    ...baseline,
  };
} else if (existsSync(FIXTURE)) {
  baseline = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  source = FIXTURE + '（未找到 DSH 安装，回退快照）';
} else {
  console.error('找不到 @deepseek-ai/dsh-client-ui-theme，也没有 ' + FIXTURE);
  process.exit(1);
}

const gen = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `  '${k}': '${v}',`)
    .join('\n');

/** 快照来源版本：漂移要能归因到具体 DSH 版本，不然「一致」可能是对着旧安装比出来的。 */
const ver = String(baseline._meta?.dshVersion ?? '未知版本');

const rawFile = `/**
 * official.ts —— 官方样式表的原始 alias / specific token 值（无操作覆盖用）。
 *
 * ⚠️ 本文件由 scripts/sync-official.mjs 生成，请勿手改。
 *    改基线：装好目标 DSH 后跑 \`node scripts/sync-official.mjs\`
 *           （多版本共存时用 DSH_THEME_BUNDLE=<...>/dsh-client-ui-theme/lib/client.js 指准）。
 *    校验漂移：\`pnpm test\`（check-themes.mjs 会比对 scripts/dsw-alias-baseline.json）。
 *
 * 来源：@deepseek-ai/dsh-client-ui-theme@${ver}
 *
 * 口径：来源为 dsh-client-ui-theme 的 body（亮色）与 body[data-ds-dark-theme]（暗色）
 * 规则；暗色块未覆写的 token 沿用亮色值。覆盖层的对侧 scheme 分支填这些原值 ——
 * 用户在官方亮/暗之间切换时，覆盖层自动呈现对侧官方原值，等于「没有覆盖」。
 *
 * 只收 alias / specific 两类（主题会覆盖的语义面）；static / font / shadow
 * 由主题自己的映射或填充函数负责。
 *
 * @module @dshp/web-style/client
 */
import type { TokenMap } from './types.js';

/** 官方亮色主题的 alias / specific token 原值。 */
export const OFFICIAL_LIGHT: TokenMap = {
${gen(baseline.light)}
};

/** 官方暗色主题的 alias / specific token 原值。 */
export const OFFICIAL_DARK: TokenMap = {
${gen(baseline.dark)}
};
`;

/**
 * 让产物与仓库的 prettier 口径一致 —— CI 跑的是 `pnpm format:check`。
 *
 * `color-mix(in srgb, …)` 这类长值会超过 printWidth，prettier 会折行；手写生成器
 * 不可能预判折行位置，所以这里复用仓库自己的 prettier（根 devDependency）。
 * 解析不到 prettier 时按原样返回，并把风险说清楚 —— 宁可产物未格式化，也不要静默失败。
 */
async function prettify(text) {
  try {
    const req = createRequire(join(root, '__resolve__.js'));
    const prettier = req('prettier');
    // prettier v3 的 API **不会**自动读配置：必须 resolveConfig 后再显式传进去，
    // 否则会按默认（双引号 / 80 列）输出，`pnpm format:check` 当场红。
    const options = await prettier.resolveConfig(TARGET);
    return await prettier.format(text, { ...options, filepath: TARGET });
  } catch (e) {
    console.warn(`（未找到 prettier，产物未格式化：${String(e?.message ?? e)}）`);
    return text;
  }
}

const file = await prettify(rawFile);

const nL = Object.keys(baseline.light).length;
const nD = Object.keys(baseline.dark).length;

if (CHECK) {
  const cur = readFileSync(TARGET, 'utf8');
  const same = cur.trim() === file.trim();
  console.log(`基线：light ${nL} / dark ${nD}（来源：${source}）`);
  if (!same) {
    console.error(
      'FAIL official.ts 与 DSH 实际值不一致（漂移了）。跑 node scripts/sync-official.mjs 重生成。',
    );
    process.exit(1);
  }
  console.log('official.ts 与 DSH 基线一致 ✓');
  process.exit(0);
}

writeFileSync(FIXTURE, JSON.stringify(baseline, null, 2) + '\n');
writeFileSync(TARGET, file);
console.log(`已重写 ${FIXTURE}`);
console.log(`已重写 ${TARGET}`);
console.log(`  亮色 ${nL} 项 / 暗色 ${nD} 项（来源：${source}）`);
