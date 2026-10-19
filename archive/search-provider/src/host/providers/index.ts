/**
 * 供应商注册表（扩展唯一入口）
 *
 * 原实现：dsh-tavily-search/lib/index.js 里硬编码的单个 provider（JS）
 * → 本文件把「内置清单」收成一行一处：新增供应商只需
 *  1. 复制 `tavily.ts` 为 `providers/<新 id>.ts`，实现 SearchProviderModule；
 *  2. 下方 `createProviderModules()` 的 modules 数组加一行；
 *  3. 重启 `dsh web` —— 设置页状态行/密钥/配置控件自动跟随 state.providers 元数据。
 *
 * @module @dshp/search-provider
 */
import { checkModuleShape } from './base.js';
import { createTavilyModule } from './tavily.js';
import type { SearchProviderModule } from '../types.js';

/**
 * 构建本次 apply 的供应商模块实例（工厂形态：用量缓存等状态按 apply 隔离）。
 * 清单顺序 = 默认 provider 优先级（见 config.ts 的 defaultProviderId）。
 */
export function createProviderModules(): SearchProviderModule[] {
  const modules: SearchProviderModule[] = [createTavilyModule()];
  const seen = new Set<string>();
  for (const m of modules) {
    const err = checkModuleShape(m);
    if (err.length > 0) throw new Error(`[dshp-search-provider] 非法供应商模块：${err}`);
    if (seen.has(m.id)) throw new Error(`[dshp-search-provider] 供应商 id 重复：${m.id}`);
    seen.add(m.id);
  }
  return modules;
}
