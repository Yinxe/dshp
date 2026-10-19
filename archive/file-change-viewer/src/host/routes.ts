/**
 * 同源 JSON 路由（设置节「File Change View」的读写面）
 *
 *   GET  /ext/dshp-file-change-viewer/state   —— 当前生效偏好
 *   POST /ext/dshp-file-change-viewer/config  { view?, sectionsOpen?, patchTool?, contextLines? }
 *   POST /ext/dshp-file-change-viewer/locate  { cwd?, items: [{path, newText, oldText?}] }
 *        —— 回「这段文本在文件里的第几行」以及**它两侧各最多 8 行原文**（上下文由客户端按偏好截）
 *
 * 为什么设置节不走客户端 `settingsScope`：那条路要求 Host 先把命名空间注册进 settings 传输层
 * 并在浏览器侧绑定，链路长、时序敏感（服务晚挂载就静默退化成只读默认值）。本仓既有插件
 * （mcwiki-search / vision-bridge / token-meter）统一走「自有 /ext 路由 → Host `settings.update`」，
 * 写的是同一份 `settings.yaml` 的 NS 分节，但少一层时序依赖，设置页与工具行也能共用同一个读源。
 *
 * 业务错误一律 200 + `{ ok:false, error:'中文提示' }`（前端按 `ok` 分支），只有跨站 / 方法错误走 4xx。
 *
 * @module @dshp/file-change-viewer
 */
import type { IncomingMessage } from 'node:http';
import { json, readBody, sameOrigin } from './http.js';
import type { AnyCtx, PluginConfig } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 只回契约字段的配置快照（不回内部携带的其它键）。 */
function snapshotOf(config: PluginConfig): PluginConfig {
  return {
    view: config.view,
    sectionsOpen: config.sectionsOpen,
    patchTool: config.patchTool,
    contextLines: config.contextLines,
  };
}

/** 允许的展示方式（与 Host schema 的 `z.const` 联合逐字对齐）。 */
const VIEWS: readonly string[] = ['highlight', 'diff'];

/** 允许的上下文行数（与 Host schema 的联合逐字对齐）。 */
const CONTEXT_LINES: readonly number[] = [0, 3, 5, 8];

/**
 * 注册两条路由。
 *
 * @param ctx - Cordis 插件上下文（需 `webServer`）。
 * @param getConfig - 读当前生效配置的 thunk（每次调用都读 settings 的 getter，热重载即时生效）。
 * @param updateConfig - 写回 `settings.yaml` 的 NS 分节。
 */
export function registerRoutes(
  ctx: AnyCtx,
  getConfig: () => PluginConfig,
  updateConfig: (patch: Record<string, unknown>) => Promise<void>,
): void {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-file-change-viewer/state',
        handler: (req: IncomingMessage, res: AnyCtx) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          return json(res, 200, { ok: true, config: snapshotOf(getConfig()) });
        },
      }),
    'dshp-file-change-viewer: state route',
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-file-change-viewer/config',
        handler: async (req: IncomingMessage, res: AnyCtx) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          if ((req as { method?: string }).method !== 'POST') {
            return json(res, 405, { ok: false, error: 'method not allowed' });
          }
          let body: unknown = {};
          try {
            body = JSON.parse((await readBody(req)) || '{}') as unknown;
          } catch {
            return json(res, 200, { ok: false, error: '请求体不是合法 JSON' });
          }
          const raw: Record<string, unknown> = isRecord(body) ? body : {};
          try {
            const patch: Record<string, unknown> = {};
            let hasPatch = false;
            if (Object.hasOwn(raw, 'view')) {
              const view = raw['view'];
              if (typeof view !== 'string' || !VIEWS.includes(view)) {
                throw new Error('view 非法，应为 highlight 或 diff');
              }
              patch['view'] = view;
              hasPatch = true;
            }
            if (Object.hasOwn(raw, 'sectionsOpen')) {
              const sectionsOpen = raw['sectionsOpen'];
              if (typeof sectionsOpen !== 'boolean') throw new Error('sectionsOpen 非法，应为布尔值');
              patch['sectionsOpen'] = sectionsOpen;
              hasPatch = true;
            }
            if (Object.hasOwn(raw, 'patchTool')) {
              const patchTool = raw['patchTool'];
              if (typeof patchTool !== 'boolean') throw new Error('patchTool 非法，应为布尔值');
              patch['patchTool'] = patchTool;
              hasPatch = true;
            }
            if (Object.hasOwn(raw, 'contextLines')) {
              const contextLines = raw['contextLines'];
              if (typeof contextLines !== 'number' || !CONTEXT_LINES.includes(contextLines)) {
                throw new Error('contextLines 非法，应为 0 / 3 / 5 / 8');
              }
              patch['contextLines'] = contextLines;
              hasPatch = true;
            }
            if (hasPatch) await updateConfig(patch);
            return json(res, 200, { ok: true, config: snapshotOf(getConfig()) });
          } catch (error) {
            return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
          }
        },
      }),
    'dshp-file-change-viewer: config route',
  );

  // ── 真实行号 + 上下文：只回行号与两侧原文，不回整份文件 ─────────────────────
  // 差异卡片的行号默认从 1 开始（官方代码块的 CSS 计数器），而 edit / write 的结果元数据
  // 只有 { path, oldText, newText }、没有行偏移；模型给的上下文行数也常常只有一两行。所以这里
  // 拿文件当前内容定位这段 hunk，并把**它两侧各最多 MAX_CONTEXT_LINES 行原文**一并回给客户端——
  // 上下文行数是显示偏好，客户端自己截，改偏好不必重新问 Host。
  //
  // 定位锚优先用 `newText`（落盘后的样子），定位不到再退回 `oldText`（调用失败 / 文件之后又被改过
  // 时，磁盘上还是旧文本）。两个都定位不到就老实回 null，卡片退回从 1 开始编号、不显示上下文。
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-file-change-viewer/locate',
        handler: async (req: IncomingMessage, res: AnyCtx) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          if ((req as { method?: string }).method !== 'POST') {
            return json(res, 405, { ok: false, error: 'method not allowed' });
          }
          let body: unknown = {};
          try {
            body = JSON.parse((await readBody(req)) || '{}') as unknown;
          } catch {
            return json(res, 200, { ok: false, error: '请求体不是合法 JSON' });
          }
          const raw = isRecord(body) ? body : {};
          const cwd = typeof raw['cwd'] === 'string' && raw['cwd'] !== '' ? raw['cwd'] : undefined;
          const items = Array.isArray(raw['items']) ? raw['items'].slice(0, MAX_LOCATE_ITEMS) : [];
          return json(res, 200, { ok: true, results: await locateAll(ctx, items, cwd) });
        },
      }),
    'dshp-file-change-viewer: locate route',
  );
}

/** 一次定位请求最多处理几项（屏幕上一屏的块数量级）。 */
const MAX_LOCATE_ITEMS = 20;

/** 超过这个大小的文件不参与定位（读全文只为算行号 + 几行上下文，不值当）。 */
const MAX_LOCATE_BYTES = 4 * 1024 * 1024;

/** 每个 hunk 两侧各最多回几行上下文——客户端按偏好再截，所以这里给足上限。 */
const MAX_CONTEXT_LINES = 8;

/** 一处定位结果。 */
interface LocatedHunk {
  /** 1 起；定位不到为 null。 */
  line: number | null;
  /** 匹配块之前的原文（最多 MAX_CONTEXT_LINES 行）。 */
  before: string[];
  /** 匹配块之后的原文（最多 MAX_CONTEXT_LINES 行）。 */
  after: string[];
}

const NOT_LOCATED: LocatedHunk = { line: null, before: [], after: [] };

/** 一份文件的行（LF 口径、末尾空行已摘）；读不到为 null。 */
type FileLines = string[] | null;

/**
 * 按 `\n` 切行：与客户端 `unifiedDiffRows` / `DiffBlock` 同口径（空串 0 行、末尾换行不算一行）。
 *
 * @param text - 原始文本（已 LF 归一）。
 * @returns 行数组。
 */
function splitLines(text: string): string[] {
  if (text === '') return [];
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return body.split('\n');
}

/**
 * 读一份文件并切成行；同一请求内按路径缓存（一个文件里改 8 处就只读一次）。
 *
 * @param fs - `ctx.fs` 服务；未挂载时为 undefined。
 * @param cache - 本次请求的路径 → 行 缓存。
 * @param path - 待读路径（工具参数里的原始路径）。
 * @param cwd - 会话工作目录。
 * @returns 行数组；文件不存在 / 不是普通文件 / 太大 / 读失败都是 null。
 */
async function readLines(
  fs: AnyCtx,
  cache: Map<string, FileLines>,
  path: string,
  cwd: string | undefined,
): Promise<FileLines> {
  const hit = cache.get(path);
  if (hit !== undefined) return hit;
  let lines: FileLines = null;
  try {
    if (fs !== undefined && fs !== null) {
      const target = await fs.resolve(path, cwd === undefined ? {} : { cwd });
      const info = await fs.stat(target);
      if (info !== undefined && info.type === 'file') {
        if (typeof info.size !== 'number' || info.size <= MAX_LOCATE_BYTES) {
          lines = splitLines(String(await fs.readText(target)).replace(/\r\n/g, '\n'));
        }
      }
    }
  } catch {
    lines = null;
  }
  cache.set(path, lines);
  return lines;
}

/**
 * 在一份文件里找一段文本（逐行完全相等），返回起始下标。
 *
 * @param lines - 文件的行。
 * @param needleText - 要找的文本。
 * @returns 0 基起始下标；找不到返回 -1。
 */
function findBlock(lines: readonly string[], needleText: string): number {
  const needle = splitLines(needleText);
  if (needle.length === 0) return -1;
  for (let at = 0; at + needle.length <= lines.length; at += 1) {
    let hit = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (lines[at + offset] !== needle[offset]) {
        hit = false;
        break;
      }
    }
    if (hit) return at;
  }
  return -1;
}

/**
 * 定位一项：先按 `newText`（落盘后的样子）找，找不到再按 `oldText`（磁盘上还是旧文本时）。
 *
 * @param fs - `ctx.fs` 服务。
 * @param cache - 本次请求的路径缓存。
 * @param item - 不透明输入，逐字段收窄。
 * @param cwd - 会话工作目录。
 * @returns 行号与两侧上下文；定位不到时 `line: null`、两侧为空数组。
 */
async function locateOne(
  fs: AnyCtx,
  cache: Map<string, FileLines>,
  item: unknown,
  cwd: string | undefined,
): Promise<LocatedHunk> {
  if (!isRecord(item)) return NOT_LOCATED;
  const path = item['path'];
  const newText = item['newText'];
  const oldText = item['oldText'];
  if (typeof path !== 'string' || path === '' || typeof newText !== 'string') return NOT_LOCATED;
  const lines = await readLines(fs, cache, path, cwd);
  if (lines === null) return NOT_LOCATED;

  for (const needleText of typeof oldText === 'string' && oldText !== '' ? [newText, oldText] : [newText]) {
    if (needleText === '') continue;
    const at = findBlock(lines, needleText);
    if (at < 0) continue;
    const end = at + splitLines(needleText).length;
    return {
      line: at + 1,
      before: lines.slice(Math.max(0, at - MAX_CONTEXT_LINES), at),
      after: lines.slice(end, end + MAX_CONTEXT_LINES),
    };
  }
  return NOT_LOCATED;
}

/**
 * 批量定位（共用一份路径缓存）。
 *
 * @param ctx - Cordis 上下文（用 `ctx.fs` 读）。
 * @param items - 待定位项。
 * @param cwd - 会话工作目录。
 * @returns 与 items 同序的结果。
 */
async function locateAll(
  ctx: AnyCtx,
  items: readonly unknown[],
  cwd: string | undefined,
): Promise<LocatedHunk[]> {
  // 路由是挂在插件自己的 ctx 上的，这里显式取服务：fs 未挂载（或后端不支持读）就老实回 null。
  const fs = typeof ctx.get === 'function' ? ctx.get('fs') : undefined;
  const cache = new Map<string, FileLines>();
  const results: LocatedHunk[] = [];
  for (const item of items) results.push(await locateOne(fs, cache, item, cwd));
  return results;
}
