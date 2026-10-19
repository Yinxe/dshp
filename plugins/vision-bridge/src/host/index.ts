/**
 * @dshp/vision-bridge —— Host 半（Cordis 插件）。
 *
 * 职责：
 *  - 缓存会话图片；纯文本模型看到占位符时用 `vision_describe` 把图片交给视觉模型
 *  - 主模型失败时自动用备用模型重试一次
 *  - 配置持久化在 profile 条目 `config:`（NS = `dshp-vision-bridge`，全字段 volatile）
 *  - 同源 JSON 路由供设置页：GET state / POST config / GET check
 *
 * 0.2.x 适配要点：
 *  - `settings.get(ns)` 已移除，模型发现改走 `settings.describe()`
 *  - `Agent` 只暴露 `id`
 *  - 发送门禁仍通过包装 `llm.resolveModelInfo` 放行；探活使用未包装的原函数，避免自证
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createImageCache, sessionIdOf, walkBlocks } from './cache.js';
import { ConfigSchema, NS } from './config.js';
import { json, readBody, sameOrigin } from './http.js';
import { describeWithFallback, listVisionModels } from './vision.js';
import type {
  AnyCtx,
  ImageRef,
  LlmService,
  PluginConfig,
  SettingsService,
  VisionRoute,
  VolatileConfig,
} from './types.js';

export const name = '@dshp/vision-bridge';
export const inject: string[] = ['tools', 'webServer', 'llm'];
export { NS, ConfigSchema };
/** Cordis 用它校验条目 config；所有字段 volatile，可原地热更新。 */
export const Config = ConfigSchema;

const MAX_IMAGES = 4;
const MAX_QUESTION = 4000;
const MAX_BODY = 64 * 1024;
const ROUTE_PREFIX = '/ext/dshp-vision-bridge';

type WebHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function warn(message: string, error?: unknown): void {
  try {
    const reason = error === undefined ? '' : '：' + errorMessage(error);
    console.warn('[dshp-vision-bridge] ' + message + reason);
  } catch {
    /* ignore */
  }
}

function info(message: string): void {
  try {
    console.info('[dshp-vision-bridge] ' + message);
  } catch {
    /* ignore */
  }
}

export function apply(ctx: AnyCtx, config: VolatileConfig): void {
  // 本插件自带设置页（settings.section），关掉 schema 自动生成的页面。
  ctx.inject(['settings'], (sctx: AnyCtx) => {
    try {
      sctx.effect(
        () => sctx.settings.configure({ auto: false }, ctx.fiber),
        'dshp-vision-bridge: settings page',
      );
    } catch (error) {
      warn('settings 页面策略注册失败', error);
    }
  });

  function getConfig(): PluginConfig {
    const primary = config.primary.get();
    const fallback = config.fallback.get();
    return {
      enabled: config.enabled.get() === true,
      primary: primary ? { provider: primary.provider, model: primary.model } : null,
      fallback: fallback ? { provider: fallback.provider, model: fallback.model } : null,
    };
  }

  function bridgeArmed(): boolean {
    const current = getConfig();
    return current.enabled && current.primary !== null;
  }

  async function updateConfig(patch: Record<string, unknown>): Promise<void> {
    const settings = ctx.get('settings') as SettingsService | undefined;
    if (!settings) throw new Error('settings 服务不可用，无法保存配置');
    await settings.update(NS, patch);
  }

  const images = createImageCache();

  // ── 图片缓存：新消息 + 每一步请求（后者会重扫历史，缓存内部按 attachmentId 去重） ──
  try {
    ctx.effect(
      () =>
        ctx.on('agent/inbox/inserted', (payload: unknown) => {
          try {
            if (!isRecord(payload)) return;
            const sessionId = sessionIdOf(payload['agent']);
            const message = payload['message'];
            if (!sessionId || !isRecord(message)) return;
            const found: ImageRef[] = [];
            walkBlocks(message['content'], found);
            if (found.length > 0) images.push(sessionId, found);
          } catch {
            /* ignore */
          }
        }),
      'dshp-vision-bridge: cache inbox images',
    );
  } catch (error) {
    warn('注册 inbox 图片缓存失败', error);
  }

  try {
    ctx.effect(
      () =>
        ctx.on('llm/stream', (options: unknown, next: () => unknown) => {
          try {
            if (isRecord(options)) {
              const sessionId = options['sessionId'];
              const messages = options['messages'];
              if (typeof sessionId === 'string' && Array.isArray(messages)) {
                const found: ImageRef[] = [];
                for (const message of messages) {
                  if (isRecord(message)) walkBlocks(message['content'], found);
                }
                if (found.length > 0) images.push(sessionId, found);
              }
            }
          } catch {
            /* ignore */
          }
          return next();
        }),
      'dshp-vision-bridge: cache stream images',
    );
  } catch (error) {
    warn('注册 stream 图片缓存失败', error);
  }

  // ── 发送门禁接管：启用且选好主模型时，让纯文本模型也能收到图片 ──────────
  const llm = ctx.get('llm') as LlmService | undefined;
  const originalResolve = llm?.resolveModelInfo;
  if (llm && typeof originalResolve === 'function') {
    const patchedResolve = async (
      provider: string,
      model: string,
      signal?: AbortSignal,
    ): Promise<unknown> => {
      const result = await originalResolve.call(llm, provider, model, signal);
      if (!bridgeArmed() || !isRecord(result)) return result;
      const modalities = result['inputModalities'];
      if (!Array.isArray(modalities) || modalities.includes('image')) return result;
      return { ...result, inputModalities: [...modalities, 'image'] };
    };
    try {
      llm.resolveModelInfo = patchedResolve;
      ctx.effect(
        () => () => {
          try {
            if (llm.resolveModelInfo === patchedResolve) llm.resolveModelInfo = originalResolve;
          } catch {
            /* ignore */
          }
        },
        'dshp-vision-bridge: admission takeover',
      );
      info('发送门禁已接管：启用并选好主模型后，纯文本模型可直接发送图片');
    } catch (error) {
      warn('接管发送门禁失败', error);
    }
  } else {
    warn('llm 服务不可用，发送门禁未接管');
  }

  // ── 系统提示 ──────────────────────────────────────────────────────────
  try {
    const systemPrompt = ctx.get('systemPrompt') as { section(section: unknown): () => void } | undefined;
    if (systemPrompt && typeof systemPrompt.section === 'function') {
      ctx.effect(
        () =>
          systemPrompt.section({
            name: 'dshp-vision-bridge',
            order: 80,
            text: '视觉能力：你是纯文本模型，不能直接看图。用户消息里出现“[image omitted because this model accepts text only; attachment sha256:…]”占位符时，说明本轮有图片，必须调用 vision_describe 获取内容，不要猜测图片内容，也不要让用户换模型。question 由你结合当前对话上下文生成，写清你真正想从图片确认的具体内容（例如某行报错、某个按钮、某段文字），不要只写“描述这张图片”。插件会把 question 原样发给视觉模型，不追加固定提示词。多图时可用 image 指定从 1 开始的序号。没有占位符时不要调用。工具会自动使用设置 → 视觉模型 中的主模型，失败时用备用模型重试。',
          }),
        'dshp-vision-bridge: prompt section',
      );
    }
  } catch (error) {
    warn('注册系统提示失败', error);
  }

  // ── 模型工具：vision_describe ─────────────────────────────────────────
  try {
    ctx.effect(
      () =>
        ctx.tools.register({
          name: 'vision_describe',
          description:
            '把用户本轮附带的图片交给视觉模型识别。看到 [image omitted because this model accepts text only; attachment sha256:…] 占位符时必须调用，不要猜图。question 由你结合当前对话生成，插件会原样转给视觉模型。',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
              question: {
                type: 'string',
                description:
                  '结合当前对话上下文，写清你想从图片中确认的具体内容，例如“截图第三行的报错是什么”或“逐字转录这张图里的文字”。插件会原样发给视觉模型，不追加固定提示词。',
              },
              image: {
                type: 'integer',
                minimum: 1,
                description: '可选：只看第几张图（从 1 开始，多图时用）。留空则分析本轮最近 4 张图片。',
              },
            },
            required: ['question'],
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                description: { type: 'string' },
                model: { type: 'string' },
              },
              required: ['description', 'model'],
            },
            render: (_args: unknown, value: { description: unknown }) => [
              { type: 'text', text: String(value.description) },
            ],
          },
          isConcurrencySafe: () => true,
          async execute(args: unknown, exec: { agent?: { id?: unknown }; signal?: AbortSignal }) {
            const current = getConfig();
            if (!current.enabled) {
              throw new Error('视觉桥接已在 设置 → 视觉模型 中关闭，请先启用');
            }
            const input = isRecord(args) ? args : {};
            const question = typeof input['question'] === 'string' ? input['question'].trim() : '';
            if (!question) {
              throw new Error('question 不能为空：请结合上下文说明你想从图片中确认什么');
            }
            const index = parseImageIndex(input['image']);
            const sessionId = typeof exec?.agent?.id === 'string' ? (exec.agent.id as string) : undefined;
            const cached = sessionId ? images.get(sessionId) : [];

            let selected: ImageRef[];
            if (index !== null) {
              const one = cached[index - 1];
              if (!one) throw new Error(`第 ${index} 张图片不存在：本轮共 ${cached.length} 张图片`);
              selected = [one];
            } else {
              selected = cached.slice(-MAX_IMAGES);
            }
            if (selected.length === 0) {
              throw new Error('本轮没有找到可用的图片：请确认图片已作为附件发送，或重试一次');
            }

            const answer = await describeWithFallback(
              ctx,
              current,
              selected,
              question.slice(0, MAX_QUESTION),
              exec?.signal,
              sessionId,
            );
            return {
              description: answer.text,
              model: answer.route.provider + '/' + answer.route.model,
            };
          },
        }),
      'dshp-vision-bridge: vision_describe tool',
    );
  } catch (error) {
    warn('注册 vision_describe 工具失败', error);
  }

  // ── 同源 JSON 路由 ────────────────────────────────────────────────────
  function registerRoute(path: string, handler: WebHandler): void {
    try {
      ctx.effect(
        () => ctx.webServer.register({ kind: 'exact', path, handler }),
        `dshp-vision-bridge: ${path} route`,
      );
    } catch (error) {
      warn(`注册路由 ${path} 失败`, error);
    }
  }

  registerRoute(ROUTE_PREFIX + '/state', async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
    try {
      return json(res, 200, {
        ok: true,
        models: await listVisionModels(ctx),
        config: getConfig(),
      });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });

  registerRoute(ROUTE_PREFIX + '/config', async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });

    let body: unknown;
    try {
      body = JSON.parse((await readBody(req, MAX_BODY)) || '{}');
    } catch {
      return json(res, 200, { ok: false, error: '请求体不是合法 JSON' });
    }
    if (!isRecord(body)) return json(res, 200, { ok: false, error: '请求体必须是对象' });

    try {
      const patch = parseConfigPatch(body);
      if (Object.keys(patch).length > 0) await updateConfig(patch);
      return json(res, 200, { ok: true, config: getConfig() });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });

  registerRoute(ROUTE_PREFIX + '/check', async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
    const current = getConfig();
    return json(res, 200, {
      ok: true,
      primary: await probeRoute(current.primary),
      fallback: await probeRoute(current.fallback),
    });
  });

  /**
   * 探活一条路由。
   *
   * 用未包装的 `resolveModelInfo`，否则门禁接管会把“不支持图片”的模型也报成可用。
   */
  async function probeRoute(route: VisionRoute | null): Promise<{ ok: boolean; message: string }> {
    if (!route) return { ok: false, message: '未配置' };
    if (!llm || typeof originalResolve !== 'function') {
      return { ok: false, message: 'llm 服务不可用' };
    }
    try {
      const result = await originalResolve.call(llm, route.provider, route.model);
      const label = route.provider + '/' + route.model;
      if (!isRecord(result)) return { ok: true, message: label + ' 可解析' };
      const modalities = result['inputModalities'];
      if (Array.isArray(modalities) && !modalities.includes('image')) {
        return { ok: false, message: label + ' 未声明 image 输入' };
      }
      return { ok: true, message: label + ' 可用' };
    } catch (error) {
      return { ok: false, message: errorMessage(error).slice(0, 300) };
    }
  }
}

function parseImageIndex(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error('image 必须是从 1 开始的整数');
  }
  return value;
}

const CONFIG_FIELDS = new Set(['enabled', 'primary', 'fallback']);

function parseConfigPatch(body: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(body)) {
    if (!CONFIG_FIELDS.has(key)) throw new Error(`未知配置字段：${key}`);
  }
  const patch: Record<string, unknown> = {};
  if (Object.hasOwn(body, 'enabled')) {
    if (typeof body['enabled'] !== 'boolean') throw new Error('enabled 必须是布尔值');
    patch['enabled'] = body['enabled'];
  }
  if (Object.hasOwn(body, 'primary')) patch['primary'] = parseRoute(body['primary'], 'primary');
  if (Object.hasOwn(body, 'fallback')) patch['fallback'] = parseRoute(body['fallback'], 'fallback');
  return patch;
}

function parseRoute(value: unknown, field: string): VisionRoute | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error(`${field} 必须是 {provider, model} 或 null`);
  const provider = typeof value['provider'] === 'string' ? value['provider'].trim() : '';
  const model = typeof value['model'] === 'string' ? value['model'].trim() : '';
  if (!provider || !model) throw new Error(`${field} 的 provider/model 不能为空`);
  return { provider: provider.slice(0, 120), model: model.slice(0, 200) };
}
