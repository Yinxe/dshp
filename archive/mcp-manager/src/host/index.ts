/**
 * @dshp/mcp-manager —— DSH Bundle 插件 Host 半（Cordis 插件）
 *
 * 挂载：~/.dsh/profiles/<profile>/cordis.patch.yml（自动通过 bundle patch）
 *
 * 职责：
 *  - 管理 profile 的 cordis.patch.yml 里的 @deepseek-ai/dsh-mcp-client 实例条目：
 *    列出 / 新建 / 编辑 / 启停 / 删除，回写保留文件其余内容（注释、!!js、排版）
 *  - 自身配置（enabled / patchFile 覆盖）持久化在 profile 条目 `config:`（0.1.7 契约：
 *    导出的 `Config` schema 装载期校验，全字段 volatile，`settings.update` 写入原地生效；
 *    旧 settings.yaml 分节一次性自动导入）
 *  - 同源 JSON 路由供 Client：
 *    GET state / POST config / POST create / POST update / POST toggle /
 *    POST remove / POST probe
 *
 * 安全边界：
 *  - 写入只针对定位到的 cordis.patch.yml，且先备份 .bak、临时文件 + rename
 *    原子落盘、回写前序列化自校验（不可重解析或条目数变化即拒绝写盘）
 *  - 故意不注册模型工具：patch 文件是 DSH 的装配清单，增删实例必须由人完成
 *  - 探活只对 streamable-http 发一次 initialize 握手；stdio 不 spawn
 *
 * @module @dshp/mcp-manager
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LIMITS, NS, ConfigSchema, sanitizePatchFilePath, sanitizeServerConfig } from './config.js';
import { json, readBody, sameOrigin } from './http.js';
import { locatePatchFile, readPatchFile, writePatchFile } from './patchfile.js';
import {
  applyServerConfig,
  entryToView,
  findEntries,
  findEntry,
  insertServer,
  parsePatchDoc,
  removeEntry,
  serializeDoc,
  setEntryDisabled,
} from './patchdoc.js';
import { probeStreamableHttp } from './probe.js';
import type {
  AnyCtx,
  McpServerView,
  McpState,
  PluginConfig,
  ProbePayload,
  ProbeResult,
  RemovePayload,
  TogglePayload,
  UpdatePayload,
  VolatileConfig,
} from './types.js';

export const name = '@dshp/mcp-manager';
export const inject: string[] = ['settings', 'webServer'];
export { NS, ConfigSchema };
/** Cordis 用它校验条目 config 并派生设置表单（全字段 volatile，原地热更新）。 */
export const Config = ConfigSchema;

const BASE = '/ext/dshp-mcp-manager';

/** cordis 条目 id 生成：mcp-<serverName 小写化>（与官方 README 示例同风格） */
function instanceIdOf(serverName: string): string {
  return ('mcp-' + serverName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')).slice(0, 60);
}

/**
 * 挂载 Host 半：settings 页面策略 → 配置读取（volatile 引用）→ 同源 JSON 路由。
 *
 * @param ctx - Cordis 插件上下文。
 * @param config - 条目 `config:` 经 ConfigSchema 校验后的实时引用（全字段 volatile）。
 */
export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  // ── 官方 settings（0.1.7 契约）：本插件自带设置页，关掉 schema 自动生成的页面 ──
  try {
    ctx.inject(['settings'], (sctx: AnyCtx) => {
      try {
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          'dshp-mcp-manager: settings-page',
        );
      } catch (error) {
        console.error('[dshp-mcp-manager] 注册 settings 页面策略失败，配置将回默认值：', error);
      }
    });
  } catch (error) {
    console.error('[dshp-mcp-manager] settings 服务注入失败，配置将回默认值：', error);
  }

  function getConfig(): PluginConfig {
    return { enabled: config.enabled.get(), patchFile: config.patchFile.get() };
  }

  /** 写回 profile 条目 config（路由层已消毒；这里只兜 settings 服务缺失）。 */
  async function updateConfig(patchObj: Record<string, unknown>): Promise<void> {
    const settings = ctx.get('settings') as AnyCtx;
    if (!settings)
      throw new Error(
        'settings 服务不可用，无法持久化到 profile 条目 config（请重启 DSH 确认设置服务已挂载）',
      );
    await settings.update(NS, patchObj);
  }

  function snapshotConfig(): Pick<PluginConfig, 'enabled' | 'patchFile'> {
    const c = getConfig();
    return { enabled: c.enabled === true, patchFile: c.patchFile };
  }

  /** 最近一次探活结果（内存缓存；进程重启即失，UI 可重新探测） */
  const probeCache = new Map<string, ProbeResult>();

  /**
   * 枚举全局 tools 注册表里的工具名（可选依赖：tools 服务缺席或无枚举 API 回 null）。
   * MCP 客户端连接 + 工具同步成功才会注册 mcp__<serverName>__* 工具，
   * 因此「已注册工具数」是不 spawn 子进程就能拿到的最真实连接信号。
   */
  function registeredToolNames(): string[] | null {
    try {
      const tools = ctx.get('tools') as AnyCtx;
      if (!tools || typeof tools.schemas !== 'function') return null;
      const schemas = tools.schemas() as unknown;
      if (!Array.isArray(schemas)) return null;
      const names: string[] = [];
      for (const s of schemas) {
        if (s && typeof s === 'object' && typeof (s as { name?: unknown }).name === 'string') {
          names.push((s as { name: string }).name);
        }
      }
      return names;
    } catch {
      return null;
    }
  }

  /** 计算当前快照：定位 patch 文件 → 解析 → 条目视图（含 dup 标记与运行时工具数） */
  async function snapshotState(): Promise<McpState> {
    const c = getConfig();
    const file = locatePatchFile(import.meta.url, c.patchFile);
    const text = file.exists ? await readPatchFile(file.path) : null;
    const servers: McpServerView[] = [];
    let fileIssue = '';
    let toolNames: string[] | null = null;
    let toolNamesTried = false;
    const countTools = (serverName: string): number | null => {
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(serverName)) return null;
      if (!toolNamesTried) {
        toolNamesTried = true;
        toolNames = registeredToolNames();
      }
      const all = toolNames as string[] | null;
      if (all === null) return null;
      const prefix = 'mcp__' + serverName + '__';
      let n = 0;
      for (const toolName of all) if (toolName.startsWith(prefix)) n += 1;
      return n;
    };
    if (text !== null) {
      try {
        const doc = parsePatchDoc(text);
        if (doc.errors.length > 0) {
          fileIssue =
            'patch 文件解析有问题（' + String(doc.errors[0]).slice(0, 200) + '），改动前请先手工修复';
        }
        const found = findEntries(doc).map((e) => entryToView(e, text));
        for (const view of found) view.toolCount = countTools(view.serverName);
        servers.push(...found);
      } catch (e) {
        fileIssue = 'patch 文件解析失败（' + String((e as Error)?.message ?? e).slice(0, 200) + '）';
      }
    }
    const idCounts = new Map<string, number>();
    for (const s of servers) idCounts.set(s.id, (idCounts.get(s.id) ?? 0) + 1);
    for (const s of servers) s.dup = (idCounts.get(s.id) ?? 0) > 1;
    return {
      enabled: c.enabled === true,
      patchFile: file,
      servers,
      probes: Object.fromEntries(probeCache),
      fileIssue: fileIssue.slice(0, LIMITS.issue),
    };
  }

  function requireEnabled(): void {
    if (getConfig().enabled !== true) throw new Error('MCP 管理已在设置页关闭，请先启用后再操作');
  }

  /** 读 + 解析 patch 文件并自检（变更类路由共用；返回 doc 与原文） */
  async function loadPatchDoc(): Promise<{
    doc: ReturnType<typeof parsePatchDoc>;
    text: string;
    path: string;
  }> {
    const c = getConfig();
    const file = locatePatchFile(import.meta.url, c.patchFile);
    if (!file.exists) {
      throw new Error(
        'patch 文件不存在：' + file.path + '。若 profile 非默认位置，请在设置页「patch 文件」里填写绝对路径',
      );
    }
    const text = await readPatchFile(file.path);
    if (text === null) throw new Error('patch 文件读取失败：' + file.path);
    const doc = parsePatchDoc(text);
    if (doc.errors.length > 0) {
      throw new Error(
        'patch 文件解析有问题（' + String(doc.errors[0]).slice(0, 200) + '），请先手工修复后再用本插件改动',
      );
    }
    return { doc, text, path: file.path };
  }

  function asId(v: unknown): string {
    const s = typeof v === 'string' ? v.trim().slice(0, LIMITS.id) : '';
    if (!s) throw new Error('id 不能为空，请刷新后重试');
    return s;
  }

  /** 变更落盘全流程：序列化自校验 → 备份 → 原子写入 → 返回新快照 */
  async function persistAndSnapshot(
    doc: ReturnType<typeof parsePatchDoc>,
    beforeCount: number,
    path: string,
  ): Promise<McpState> {
    const text = serializeDoc(doc, beforeCount);
    await writePatchFile(path, text);
    return snapshotState();
  }

  // ── 同源 JSON 路由 ────────────────────────────────────────────────────

  function registerRoute(
    suffix: string,
    label: string,
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
  ): void {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path: BASE + suffix,
          handler: async (req: IncomingMessage, res: ServerResponse) => {
            if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
            try {
              await handler(req, res);
            } catch (e) {
              return json(res, 200, { ok: false, error: String((e as Error)?.message ?? e).slice(0, 500) });
            }
          },
        }),
      label,
    );
  }

  async function readJsonObject(req: IncomingMessage): Promise<Record<string, unknown>> {
    let body: unknown = {};
    try {
      body = JSON.parse((await readBody(req)) || '{}') as unknown;
    } catch {
      throw new Error('请求体不是合法 JSON');
    }
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  }

  try {
    registerRoute('/state', 'dshp-mcp-manager: state route', async (_req, res) => {
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    registerRoute('/config', 'dshp-mcp-manager: config route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      const a = await readJsonObject(req);
      const patchObj: Record<string, unknown> = {};
      let hasPatch = false;
      if (Object.hasOwn(a, 'enabled')) {
        patchObj['enabled'] = a['enabled'] === true;
        hasPatch = true;
      }
      if (Object.hasOwn(a, 'patchFile')) {
        if (typeof a['patchFile'] !== 'string') throw new Error('patchFile 非法，应为绝对路径字符串或空串');
        const v = a['patchFile'] === '' ? '' : sanitizePatchFilePath(a['patchFile']);
        if (v === '' && a['patchFile'] !== '')
          throw new Error('patchFile 必须是绝对路径（如 /home/me/.dsh/profiles/web/cordis.patch.yml）');
        patchObj['patchFile'] = v;
        hasPatch = true;
      }
      if (hasPatch) await updateConfig(patchObj);
      return json(res, 200, { ok: true, config: snapshotConfig() });
    });

    registerRoute('/create', 'dshp-mcp-manager: create route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const { config: serverConfig, jsMarks } = sanitizeServerConfig(a['config']);
      const { doc, path } = await loadPatchDoc();
      const before = findEntries(doc).length;
      insertServer(doc, instanceIdOf(serverConfig.serverName), serverConfig, jsMarks);
      return json(res, 200, { ok: true, state: await persistAndSnapshot(doc, before + 1, path) });
    });

    registerRoute('/update', 'dshp-mcp-manager: update route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const p = a as unknown as Partial<UpdatePayload>;
      const id = asId(p.id);
      const { config: serverConfig, jsMarks, providedKeys } = sanitizeServerConfig(a['config']);
      const { doc, text, path } = await loadPatchDoc();
      const target = findEntry(doc, id);
      const view = entryToView(target, text);
      if (view.unmanageable) {
        throw new Error(
          '该条目含无法在 UI 表示的复杂值（见列表中的问题提示），请直接编辑 patch 文件，或删除后重建',
        );
      }
      applyServerConfig(doc, target, serverConfig, jsMarks, providedKeys);
      return json(res, 200, {
        ok: true,
        state: await persistAndSnapshot(doc, findEntries(doc).length, path),
      });
    });

    registerRoute('/toggle', 'dshp-mcp-manager: toggle route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const p = a as unknown as Partial<TogglePayload>;
      const id = asId(p.id);
      const disabled = p.disabled === true;
      const { doc, path } = await loadPatchDoc();
      const target = findEntry(doc, id);
      setEntryDisabled(doc, target, disabled);
      return json(res, 200, {
        ok: true,
        state: await persistAndSnapshot(doc, findEntries(doc).length, path),
      });
    });

    registerRoute('/remove', 'dshp-mcp-manager: remove route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const p = a as unknown as Partial<RemovePayload>;
      const id = asId(p.id);
      const { doc, path } = await loadPatchDoc();
      const target = findEntry(doc, id);
      const before = findEntries(doc).length;
      removeEntry(target);
      return json(res, 200, { ok: true, state: await persistAndSnapshot(doc, before - 1, path) });
    });

    registerRoute('/probe', 'dshp-mcp-manager: probe route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      const a = await readJsonObject(req);
      const p = a as unknown as Partial<ProbePayload>;
      const id = asId(p.id);
      const state = await snapshotState();
      const target = state.servers.find((s) => s.id === id);
      if (!target) throw new Error('找不到该 MCP 条目（id: ' + id + '），请刷新后重试');
      if (target.transport !== 'streamable-http') {
        const skipped: ProbeResult = {
          state: 'skip',
          detail: 'stdio 传输不探活（避免 spawn 副作用）；连接状态看 DSH 日志里的 mcp-client 行',
          serverInfoName: '',
          serverInfoVersion: '',
          protocolVersion: '',
          latencyMs: null,
          at: Date.now(),
        };
        probeCache.set(id, skipped);
        return json(res, 200, { ok: true, probe: skipped });
      }
      const result = await probeStreamableHttp({
        url: target.url,
        headers: target.headers,
      });
      probeCache.set(id, result);
      return json(res, 200, { ok: true, probe: result });
    });

    try {
      const file = locatePatchFile(import.meta.url, getConfig().patchFile);
      console.info('[dshp-mcp-manager] mcp routes ready under ' + BASE + ' → ' + file.path);
    } catch {
      /* ignore */
    }
  } catch (e) {
    try {
      console.error('[dshp-mcp-manager] register routes failed: ' + String((e as Error)?.message ?? e));
    } catch {
      /* ignore */
    }
  }
}

/**
 * 供 scripts/patchdoc.test.mjs 使用：patch 文档的解析/合并/序列化是纯函数，
 * 从打包产物导入做端到端自测（host bundle 顶层无副作用，导入安全）。
 */
export const __test = {
  parsePatchDoc,
  findEntries,
  entryToView,
  insertServer,
  applyServerConfig,
  setEntryDisabled,
  removeEntry,
  serializeDoc,
};
