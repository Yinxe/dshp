/**
 * Client 入口（浏览器）。
 *
 * 打包后是单文件 lib/client.js；loader 注册壳由构建预设的 banner / footer 拼出，
 * 本文件只是普通 ES 模块：顶层 import 官方 primitives 与自己的组件，导出 inject / apply。
 * react / react/jsx-runtime / primitives 都在 external 列表里，由 shell 的冻结模块表注入。
 *
 * 只注册一处：`settings.section`（list 槽位）——设置左侧导航里的「视觉模型」。
 */
import { VisionSection } from './VisionSection.js';
import type { ClientContext, SlotsService } from './types.js';

/** 设置节 id = settings 命名空间 = cordis 行 id（仓库约定：NS 四处同名）。 */
const SETTINGS_NS = 'dshp-vision-bridge';

/** 设置节的导航排序（25 是本仓占位表里 vision-bridge 的固定位置）。 */
const SETTINGS_ORDER = 25;

/** 设置节在左侧导航里的标题。 */
const SETTINGS_LABEL = '视觉模型';

/** client 半声明的服务依赖（slots 出现后再激活）。 */
export const inject = ['slots'];

/** client 半入口：由 shell 的模块系统在 slots 就绪后调用一次。 */
export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as SlotsService | undefined;
  if (slots === undefined) return;

  // 样式不在这里注入：styles.module.css 由构建预设内联进 bundle，模块求值时自动插
  // 一条 <style data-plugin>，卸载由 shell 按 data-plugin 清理。
  try {
    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
            VisionSection,
          ),
        ),
      'dshp-vision-bridge: settings section',
    );
  } catch (error) {
    console.error('[dshp-vision-bridge] 注册设置节失败，设置页将看不到视觉模型配置：', error);
  }
}
