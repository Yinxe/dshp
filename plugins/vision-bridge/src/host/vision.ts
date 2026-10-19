/**
 * 视觉模型发现、调用与主备重试。
 *
 * 候选来源（并集去重，按 provider/model 字典序）：
 *  1. `llm.listConfigurableProviders()` + `settings.describe()`：已配置但可能未激活的 provider
 *  2. `llm.listProviders()` + `llm.listModels(provider)`：当前运行时可调用的 provider
 *
 * 0.2.x 的 settings 服务不再提供 `get(ns)`；读配置统一走 `describe()`，按
 * `settingsNs` + `settingsPath` 定位 provider profile。
 */
import type {
  AnyCtx,
  CandidateModel,
  ImageRef,
  LlmService,
  PluginConfig,
  SettingsService,
  VisionRoute,
} from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function displayName(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getPath(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function imageModalities(value: unknown): unknown[] | null {
  const modalities = isRecord(value) ? value['input'] : undefined;
  if (Array.isArray(modalities)) return modalities;
  const fallback = isRecord(value) ? value['inputModalities'] : undefined;
  return Array.isArray(fallback) ? fallback : null;
}

/** 从 settings 里读已配置的视觉模型（不依赖具体 llm 插件的命名空间）。 */
function modelsFromSettings(settings: SettingsService, llm: LlmService): CandidateModel[] {
  if (typeof llm.listConfigurableProviders !== 'function') return [];
  let entries: unknown;
  try {
    entries = llm.listConfigurableProviders();
  } catch {
    return [];
  }
  if (!Array.isArray(entries) || entries.length === 0) return [];

  let descriptors: unknown;
  try {
    descriptors = settings.describe({ redactSecrets: true });
  } catch {
    return [];
  }
  if (!Array.isArray(descriptors)) return [];

  const out: CandidateModel[] = [];
  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const provider = entry['provider'];
    const ns = entry['settingsNs'];
    const path = entry['settingsPath'];
    if (typeof provider !== 'string' || typeof ns !== 'string' || !Array.isArray(path)) continue;
    const descriptor = descriptors.find((item) => isRecord(item) && item['ns'] === ns);
    if (!isRecord(descriptor)) continue;
    const keys = path.filter((key): key is string => typeof key === 'string');
    const profile = getPath(descriptor['value'], keys);
    if (!isRecord(profile) || !Array.isArray(profile['models'])) continue;
    for (const model of profile['models']) {
      if (!isRecord(model)) continue;
      const id = model['id'];
      if (typeof id !== 'string' || id.length === 0) continue;
      const modalities = imageModalities(model);
      if (!modalities || !modalities.includes('image')) continue;
      out.push({ provider, model: id, name: displayName(model['name'], id) });
    }
  }
  return out;
}

/** 从运行时 provider 目录读可调用的视觉模型。 */
async function modelsFromRuntime(llm: LlmService): Promise<CandidateModel[]> {
  let providers: unknown;
  try {
    providers = llm.listProviders();
  } catch {
    return [];
  }
  if (!Array.isArray(providers)) return [];

  const groups = await Promise.all(
    providers.map(async (provider): Promise<CandidateModel[]> => {
      if (!isRecord(provider)) return [];
      const providerId = provider['id'];
      if (typeof providerId !== 'string' || providerId.length === 0) return [];
      let models: unknown;
      try {
        models = await llm.listModels(providerId);
      } catch {
        return [];
      }
      if (!Array.isArray(models)) return [];
      const out: CandidateModel[] = [];
      for (const info of models) {
        if (!isRecord(info)) continue;
        const id = info['id'];
        if (typeof id !== 'string' || id.length === 0) continue;
        const modalities = imageModalities(info);
        if (!modalities || !modalities.includes('image')) continue;
        const owner = typeof info['provider'] === 'string' ? info['provider'] : providerId;
        out.push({ provider: owner, model: id, name: displayName(info['name'], id) });
      }
      return out;
    }),
  );
  return groups.flat();
}

export async function listVisionModels(ctx: AnyCtx): Promise<CandidateModel[]> {
  const llm = ctx.get('llm') as LlmService | undefined;
  if (!llm) return [];
  const settings = ctx.get('settings') as SettingsService | undefined;

  const merged = new Map<string, CandidateModel>();
  const add = (model: CandidateModel): void => {
    const key = model.provider + '\0' + model.model;
    if (!merged.has(key)) merged.set(key, model);
  };

  if (settings) for (const model of modelsFromSettings(settings, llm)) add(model);
  for (const model of await modelsFromRuntime(llm)) add(model);

  const models = [...merged.values()];
  models.sort((a, b) => compareText(a.provider, b.provider) || compareText(a.model, b.model));
  return models;
}

export function sameRoute(a: VisionRoute | null, b: VisionRoute | null): boolean {
  return a !== null && b !== null && a.provider === b.provider && a.model === b.model;
}

export interface VisionAttempt {
  text: string;
  route: VisionRoute;
}

/** 一次视觉模型调用：图片 block + 文本问题，收集文本增量并归一 finish 错误。 */
async function runOneVision(
  llm: LlmService,
  route: VisionRoute,
  images: readonly ImageRef[],
  question: string,
  signal: AbortSignal | undefined,
  sessionId: string | undefined,
): Promise<string> {
  const content: unknown[] = [];
  for (const image of images) content.push({ type: 'image', attachment: image });
  content.push({ type: 'text', text: question });

  const options: Record<string, unknown> = {
    provider: route.provider,
    model: route.model,
    messages: [{ role: 'user', content }],
  };
  if (sessionId) options['sessionId'] = sessionId;
  if (signal) options['signal'] = signal;

  let text = '';
  const deltaBlocks = new Set<number>();
  const endBlocks = new Set<number>();

  for await (const chunk of llm.stream(options)) {
    if (!isRecord(chunk)) continue;
    const type = chunk['type'];
    if (type === 'text-delta' && typeof chunk['text'] === 'string') {
      text += chunk['text'];
      if (typeof chunk['index'] === 'number') deltaBlocks.add(chunk['index']);
    } else if (
      type === 'block-end' &&
      isRecord(chunk['block']) &&
      chunk['block']['type'] === 'text' &&
      typeof chunk['block']['text'] === 'string'
    ) {
      const index = typeof chunk['index'] === 'number' ? chunk['index'] : -1;
      if (!deltaBlocks.has(index) && !endBlocks.has(index)) {
        text += chunk['block']['text'];
        endBlocks.add(index);
      }
    } else if (type === 'finish' && isRecord(chunk['reason'])) {
      const kind = chunk['reason']['kind'];
      if (kind === 'error' || kind === 'aborted') {
        const failure = chunk['reason']['failure'];
        const message =
          isRecord(failure) && typeof failure['message'] === 'string'
            ? failure['message']
            : kind === 'aborted'
              ? '视觉模型调用被中止'
              : '视觉模型调用失败';
        throw new Error(message.slice(0, 500));
      }
    }
  }

  if (signal?.aborted) throw new Error('视觉模型调用被中止');
  const result = text.trim();
  if (!result) throw new Error('视觉模型返回为空');
  return result;
}

/**
 * 主模型 → 备用模型依次尝试。
 *
 * 没有主模型但有备用模型时，备用模型直接作为首选；两者都没配置时自动用候选列表第一项。
 * 用户取消（signal.aborted）不触发 fallback。
 */
export async function describeWithFallback(
  ctx: AnyCtx,
  cfg: PluginConfig,
  images: readonly ImageRef[],
  question: string,
  signal: AbortSignal | undefined,
  sessionId: string | undefined,
): Promise<VisionAttempt> {
  const llm = ctx.get('llm') as LlmService | undefined;
  if (!llm) throw new Error('当前环境没有可用的 llm 服务');

  const routes: VisionRoute[] = [];
  if (cfg.primary) routes.push(cfg.primary);
  if (cfg.fallback && !sameRoute(cfg.fallback, cfg.primary)) routes.push(cfg.fallback);
  if (routes.length === 0) {
    const models = await listVisionModels(ctx);
    const first = models[0];
    if (!first) {
      throw new Error(
        '没有可用的视觉模型：请在 设置 → 模型 中为多模态模型勾选 image 输入，或在 设置 → 视觉模型 中选择主模型',
      );
    }
    routes.push({ provider: first.provider, model: first.model });
  }

  let lastError: unknown;
  for (const route of routes) {
    if (signal?.aborted) throw new Error('视觉模型调用被中止');
    try {
      return { text: await runOneVision(llm, route, images, question, signal, sessionId), route };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('视觉模型调用失败');
}
