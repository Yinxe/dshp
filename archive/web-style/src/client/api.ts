/**
 * api.ts —— Host 半 settings 路由的 fetch 封装（同源 /ext/dshp-web-style/*）
 *
 * 原实现：dsh-custom-ui/client.js 的 createBridge()，逐行等价（含 themes 内存缓存一次）。
 *
 * @module @dshp/web-style/client
 */
import type { ConfigPatch, SaveReply, StateReply, ThemesReply, TokenMap } from './types.js';

/** 路由前缀：与 Host 半 NS 一致（改名即 breaking）。 */
export const BASE = '/ext/dshp-web-style';

export interface Bridge {
  /** 偏好快照（themeId / photoPalette / radius / 退役字段透传） */
  state(): Promise<StateReply>;
  /** 主题目录全量 token（单源 src/host/themes；内存缓存一次） */
  themes(): Promise<Record<string, TokenMap>>;
  saveTheme(themeId: string): Promise<SaveReply>;
  saveConfig(patch: ConfigPatch): Promise<SaveReply>;
}

export function createBridge(): Bridge {
  const state = async (): Promise<StateReply> => {
    const response = await fetch(BASE + '/state', { cache: 'no-store' });
    return (await response.json()) as StateReply;
  };

  let cachedTokens: Record<string, TokenMap> | null = null;
  const themes = async (): Promise<Record<string, TokenMap>> => {
    if (cachedTokens) return cachedTokens;
    const response = await fetch(BASE + '/themes', { cache: 'no-store' });
    const reply = (await response.json()) as ThemesReply;
    if (!reply || reply.ok !== true || !Array.isArray(reply.themes)) {
      throw new Error((reply && reply.error) || '主题目录下发失败');
    }
    const map: Record<string, TokenMap> = {};
    for (const th of reply.themes) {
      if (th && typeof th.id === 'string' && th.tokens && typeof th.tokens === 'object') {
        map[th.id] = th.tokens;
      }
    }
    cachedTokens = map;
    return map;
  };

  const saveTheme = async (themeId: string): Promise<SaveReply> => {
    const response = await fetch(BASE + '/theme', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ themeId }),
    });
    return (await response.json()) as SaveReply;
  };

  const saveConfig = async (patch: ConfigPatch): Promise<SaveReply> => {
    const response = await fetch(BASE + '/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch || {}),
    });
    return (await response.json()) as SaveReply;
  };

  return { state, themes, saveTheme, saveConfig };
}
