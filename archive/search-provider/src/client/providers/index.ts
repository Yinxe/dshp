/**
 * 供应商附加区注册表（Client 侧扩展入口）
 *
 * 新增供应商时：在自己的 `providers/<id>.tsx` 里导出 `create<X>Extras(C, bridge)`，
 * 然后在本文件 `createProviderExtras` 里加一行即可 —— SearchSection 按状态接口给出的
 * provider id 取组件渲染，主表单（密钥/配置控件）无需改动。
 *
 * 工厂只收两个**真实**运行时依赖：通用小构件集合 `C` 与路由 `bridge`（原来的 `React` / `P`
 * 形参已去掉——官方构件现在是模块顶层的 import）。
 *
 * @module @dshp/search-provider/client
 */
import { createTavilyExtras } from './tavily.js';
import type { Bridge } from '../api.js';
import type { Components } from '../components.js';
import type { ProviderExtraComponent } from './tavily.js';

export type { ProviderExtraComponent, ProviderExtraProps } from './tavily.js';

export function createProviderExtras(C: Components, bridge: Bridge): Record<string, ProviderExtraComponent> {
  return {
    tavily: createTavilyExtras(C, bridge),
  };
}
