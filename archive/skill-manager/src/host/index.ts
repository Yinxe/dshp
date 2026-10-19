/**
 * @dshp/skill-manager —— DSH Bundle 插件 Host 半（Cordis 插件）
 *
 * 挂载：~/.dsh/profiles/<profile>/cordis.patch.yml（自动通过 bundle patch）
 *
 * 职责：
 *  - 管理 DSH 技能根目录：全局（~/.dsh/skills、~/.agents/skills）+ 工作区
 *    （<workspace>/.dsh/skills、.agents/skills），扫描 / 新建 / 编辑 / 启停 /
 *    复制移动 / 删除；文件布局与 frontmatter 语义对齐 @deepseek-ai/dsh-skill-filesystem
 *  - 自身配置（enabled / workspaceRoot）持久化在 profile 条目 `config:`（0.1.7 契约：导出的
 *    `Config` schema 装载期校验，全字段 volatile，`settings.update` 写入原地生效；
 *    旧 settings.yaml 分节一次性自动导入）；配置只认该命名空间，不做迁移
 *  - 同源 JSON 路由供 Client：
 *    GET state / GET read / POST config / POST create / POST update /
 *    POST toggle / POST remove / POST transfer
 *
 * 安全边界：
 *  - 本插件是唯一一个要往用户目录写文件的 @dshp 插件：写入范围被限定在
 *    dsh-skill-filesystem 扫描的那几个技能根内（技能名 kebab-case 白名单 +
 *    路径包含校验 + realpath 包含校验），配置本身仍然只进 settings.yaml 的 NS
 *  - 故意不注册模型工具：技能文件 = 提示词注入面，写入必须由人完成
 *
 * @module @dshp/skill-manager
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConfigSchema, NS, sanitizeWorkspaceRoot, defaultAgentsHome, defaultDshHome } from './config.js';
import { json, queryParams, readBody, sameOrigin } from './http.js';
import { findRoot, listRoots, toPayloadEntry } from './roots.js';
import {
  createSkill,
  markShadows,
  readSkill,
  removeSkill,
  scanRoot,
  toggleSkill,
  transferSkill,
  updateSkill,
} from './skills.js';
import type { AnyCtx, PluginConfig, RootInfo, SkillEntry, SkillState, VolatileConfig } from './types.js';

export const name = '@dshp/skill-manager';
export const inject: string[] = ['settings', 'webServer'];
export { NS, ConfigSchema };
/** Cordis 用它校验条目 config 并派生设置表单（全字段 volatile，原地热更新）。 */
export const Config = ConfigSchema;

const BASE = '/ext/dshp-skill-manager';

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
          'dshp-skill-manager: settings-page',
        );
      } catch (error) {
        console.error('[dshp-skill-manager] 注册 settings 页面策略失败，配置将回默认值：', error);
      }
    });
  } catch (error) {
    console.error('[dshp-skill-manager] settings 服务注入失败，配置将回默认值：', error);
  }

  function getConfig(): PluginConfig {
    return { enabled: config.enabled.get(), workspaceRoot: config.workspaceRoot.get() };
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

  function snapshotConfig(): Pick<PluginConfig, 'enabled' | 'workspaceRoot'> {
    const c = getConfig();
    return { enabled: c.enabled === true, workspaceRoot: c.workspaceRoot };
  }

  /** 计算当前快照：根 + 扫描 + 组内遮蔽标记 */
  async function snapshotState(): Promise<SkillState> {
    const c = getConfig();
    const { roots, workspaces } = listRoots(ctx, c.workspaceRoot);
    const skills: SkillEntry[] = [];
    for (const root of roots) {
      try {
        skills.push(...(await scanRoot(root)));
      } catch (e) {
        try {
          console.warn(
            '[dshp-skill-manager] 扫描根目录失败 ' + root.path + ': ' + String((e as Error)?.message ?? e),
          );
        } catch {
          /* ignore */
        }
      }
    }
    const rankOf = (rootId: string): number => roots.find((r) => r.id === rootId)?.rank ?? 999;
    markShadows(
      skills.filter((s) => s.scope === 'global'),
      rankOf,
    );
    const byWs = new Map<string, SkillEntry[]>();
    for (const s of skills) {
      if (s.scope !== 'workspace') continue;
      const list = byWs.get(s.workspace) ?? [];
      list.push(s);
      byWs.set(s.workspace, list);
    }
    for (const list of byWs.values()) markShadows(list, rankOf);
    return {
      enabled: c.enabled === true,
      dshHome: defaultDshHome(),
      agentsHome: defaultAgentsHome(),
      roots,
      skills: skills.map(toPayloadEntry),
      workspaces,
      workspaceRoot: c.workspaceRoot,
    };
  }

  function requireEnabled(): void {
    if (getConfig().enabled !== true) throw new Error('技能管理已在设置页关闭，请先启用后再操作');
  }

  function resolveRoot(rootId: unknown): RootInfo {
    const { roots } = listRoots(ctx, getConfig().workspaceRoot);
    const root = findRoot(roots, rootId);
    if (!root) throw new Error('rootId 非法或对应根已不可用，请刷新后重试');
    return root;
  }

  function asName(v: unknown, field: string): string {
    const s = typeof v === 'string' ? v.trim().slice(0, 120) : '';
    if (!s) throw new Error(`${field} 不能为空`);
    return s;
  }

  function asText(v: unknown, max: number): string {
    return typeof v === 'string' ? v.slice(0, max) : '';
  }

  function trimText(v: unknown, max: number): string {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
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
    registerRoute('/state', 'dshp-skill-manager: state route', async (_req, res) => {
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    registerRoute('/read', 'dshp-skill-manager: read route', async (req, res) => {
      const q = queryParams(req);
      const root = resolveRoot(q.get('root'));
      const skillName = asName(q.get('name'), 'name');
      const full = await readSkill(root, skillName);
      return json(res, 200, {
        ok: true,
        entry: toPayloadEntry(full.entry),
        fields: full.entries
          .filter((e) => e.key && e.kind !== 'raw')
          .map((e) => ({ key: e.key, value: e.value })),
        body: full.body.slice(0, 256 * 1024),
      });
    });

    registerRoute('/config', 'dshp-skill-manager: config route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      const a = await readJsonObject(req);
      const patchObj: Record<string, unknown> = {};
      let hasPatch = false;
      if (Object.hasOwn(a, 'enabled')) {
        patchObj['enabled'] = a['enabled'] === true;
        hasPatch = true;
      }
      if (Object.hasOwn(a, 'workspaceRoot')) {
        if (typeof a['workspaceRoot'] !== 'string')
          throw new Error('workspaceRoot 非法，应为绝对路径字符串或空串');
        const root = a['workspaceRoot'] === '' ? '' : sanitizeWorkspaceRoot(a['workspaceRoot']);
        if (root === '' && a['workspaceRoot'] !== '')
          throw new Error('workspaceRoot 必须是绝对路径（如 /home/me/project）');
        patchObj['workspaceRoot'] = root;
        hasPatch = true;
      }
      if (hasPatch) await updateConfig(patchObj);
      return json(res, 200, { ok: true, config: snapshotConfig() });
    });

    registerRoute('/create', 'dshp-skill-manager: create route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a['rootId']);
      const kind = a['kind'] === 'flat' ? 'flat' : 'bundle';
      await createSkill(root, {
        name: asName(a['name'], 'name'),
        description: trimText(a['description'], 500),
        whenToUse: trimText(a['whenToUse'], 500),
        body: asText(a['body'], 200000),
        kind,
      });
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    registerRoute('/update', 'dshp-skill-manager: update route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a['rootId']);
      const skillName = asName(a['name'], 'name');
      const p: { description?: string; whenToUse?: string; body?: string } = {};
      if (Object.hasOwn(a, 'description')) p.description = trimText(a['description'], 500);
      if (Object.hasOwn(a, 'whenToUse')) p.whenToUse = trimText(a['whenToUse'], 500);
      if (Object.hasOwn(a, 'body')) p.body = asText(a['body'], 200000);
      await updateSkill(root, skillName, p);
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    registerRoute('/toggle', 'dshp-skill-manager: toggle route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a['rootId']);
      const skillName = asName(a['name'], 'name');
      if (a['field'] !== 'model' && a['field'] !== 'user' && a['field'] !== 'all')
        throw new Error('field 非法，应为 model、user 或 all');
      await toggleSkill(root, skillName, a['field'], a['value'] === true);
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    registerRoute('/remove', 'dshp-skill-manager: remove route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a['rootId']);
      await removeSkill(root, asName(a['name'], 'name'));
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    registerRoute('/transfer', 'dshp-skill-manager: transfer route', async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
      requireEnabled();
      const a = await readJsonObject(req);
      const fromRoot = resolveRoot(a['fromRootId']);
      const toRoot = resolveRoot(a['toRootId']);
      if (fromRoot.id === toRoot.id && a['toName'] === undefined) {
        throw new Error('目标与来源相同且未改名：没有东西可做');
      }
      await transferSkill(
        fromRoot,
        asName(a['fromName'], 'fromName'),
        toRoot,
        trimText(a['toName'], 120),
        a['deleteSource'] === true,
      );
      return json(res, 200, { ok: true, state: await snapshotState() });
    });

    try {
      console.info('[dshp-skill-manager] skill routes ready under ' + BASE);
    } catch {
      /* ignore */
    }
  } catch (e) {
    try {
      console.error('[dshp-skill-manager] register routes failed: ' + String((e as Error)?.message ?? e));
    } catch {
      /* ignore */
    }
  }
}
