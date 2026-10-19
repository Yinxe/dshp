/**
 * 图片缓存（会话级，leaf owned copy）。
 *
 * - 只存 attachment 的 owned copy：attachmentId / mediaType / bytes / width / height / name
 * - 按 attachmentId 去重：`llm/stream` 每一步都会重扫历史消息，不去重会把同一张图重复塞满
 * - 每会话最多 20 张（超限丢最旧），最多 50 个会话（LRU 丢最久未访问）
 * - 工厂函数：每次 apply() 独立一份，避免多实例串缓存
 */
import type { ImageRef } from './types.js';

const MAX_PER_SESSION = 20;
const MAX_SESSIONS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function copyAttachment(value: unknown): ImageRef | null {
  if (!isRecord(value)) return null;
  const attachmentId = value['attachmentId'];
  const mediaType = value['mediaType'];
  const bytes = value['bytes'];
  const width = value['width'];
  const height = value['height'];
  if (typeof attachmentId !== 'string' || attachmentId.length === 0) return null;
  if (typeof mediaType !== 'string' || mediaType.length === 0) return null;
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return null;
  if (typeof width !== 'number' || typeof height !== 'number') return null;
  const out: ImageRef = { attachmentId, mediaType, bytes, width, height };
  const name = value['name'];
  if (typeof name === 'string' && name.length > 0) out.name = name.slice(0, 120);
  return out;
}

/** 递归扫 content blocks（含 tool-result 嵌套），收集 image leaf。 */
export function walkBlocks(blocks: unknown, out: ImageRef[]): void {
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) {
    if (!isRecord(block)) continue;
    if (block['type'] === 'image') {
      const copied = copyAttachment(block['attachment']);
      if (copied) out.push(copied);
    } else if (block['type'] === 'tool-result' && Array.isArray(block['content'])) {
      walkBlocks(block['content'], out);
    }
  }
}

/** `Agent` 在 0.2.x 只暴露 `id`；不再兼容旧的 `agent.session.id` 形状。 */
export function sessionIdOf(agent: unknown): string | undefined {
  if (!isRecord(agent)) return undefined;
  const id = agent['id'];
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

export interface ImageCache {
  push(sessionId: string, refs: readonly ImageRef[]): void;
  get(sessionId: string): ImageRef[];
}

export function createImageCache(): ImageCache {
  const sessions = new Map<string, Map<string, ImageRef>>();

  function push(sessionId: string, refs: readonly ImageRef[]): void {
    if (sessionId.length === 0 || refs.length === 0) return;
    let images = sessions.get(sessionId);
    if (!images) {
      images = new Map<string, ImageRef>();
      sessions.set(sessionId, images);
    }
    for (const ref of refs) {
      images.delete(ref.attachmentId);
      images.set(ref.attachmentId, ref);
    }
    while (images.size > MAX_PER_SESSION) {
      const oldest = images.keys().next();
      if (oldest.done) break;
      images.delete(oldest.value);
    }
    while (sessions.size > MAX_SESSIONS) {
      const oldest = sessions.keys().next();
      if (oldest.done) break;
      sessions.delete(oldest.value);
    }
  }

  function get(sessionId: string): ImageRef[] {
    const images = sessions.get(sessionId);
    if (!images) return [];
    // 访问即续期，会话淘汰按 LRU 而不是按创建顺序。
    sessions.delete(sessionId);
    sessions.set(sessionId, images);
    return [...images.values()];
  }

  return { push, get };
}
