/**
 * Client 入口：注册「设置 → AI 搜索」。
 *
 * 打包后是单文件 lib/client.js；loader 注册壳由构建预设的 banner / footer 拼出。
 * react / react/jsx-runtime / primitives 都在 external 列表里，由 shell 的冻结模块表注入。
 */
import type { ReactNode } from 'react';
import { SearchSection } from './SearchSection.js';
import type { ClientContext, RemoteLike, SlotsService } from './types.js';

/** 设置节 id = settings 命名空间 = cordis 行 id。 */
const SETTINGS_NS = 'dshp-search-provider';

/** 设置节导航排序（占位表里 search-provider 的位置）。 */
const SETTINGS_ORDER = 28;

/** 设置节标题。 */
const SETTINGS_LABEL = 'AI 搜索';

/** client 半依赖：slots + credentials 写入通道。 */
export const inject = ['slots', 'remote', 'remote.credentials'];

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  const remote = ctx.get('remote') as RemoteLike | undefined;
  const Section = (): ReactNode => <SearchSection remote={remote} />;

  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            {
              name: 'settings.section',
              id: SETTINGS_NS,
              order: SETTINGS_ORDER,
              label: SETTINGS_LABEL,
            },
            Section,
          ),
        ),
      'dshp-search-provider: settings section',
    );
  } catch (error) {
    console.error('[dshp-search-provider] 注册设置节失败：', error);
  }
}
