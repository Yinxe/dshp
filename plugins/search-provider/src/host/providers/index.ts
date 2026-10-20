/**
 * 搜索后端注册表：新增一家供应商只需实现 SearchProviderModule 并在这里加一行。
 */
import { createExaModule } from './exa.js';
import { createFirecrawlModule } from './firecrawl.js';
import { createTavilyModule } from './tavily.js';
import type { SearchProviderModule } from '../types.js';

export function createProviderModules(): SearchProviderModule[] {
  const modules: SearchProviderModule[] = [createTavilyModule(), createExaModule(), createFirecrawlModule()];
  const seen = new Set<string>();
  for (const module of modules) {
    if (seen.has(module.id)) throw new Error(`[dshp-search-provider] 供应商 id 重复：${module.id}`);
    seen.add(module.id);
  }
  return modules;
}
