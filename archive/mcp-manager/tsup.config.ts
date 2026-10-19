/**
 * 构建配置照参考项目 dsh-web 的分层：机制全在 `shared/tsup.preset.ts`，包内只声明「我是谁」
 * （host + client 双 bundle、closure 工厂壳、CSS Modules 内联、externals）。
 *
 * 产物：lib/host.js（单文件 ESM）+ lib/client.js（单文件 CJS，内含 `__ModuleLoader__.load`）。
 */
import { readFileSync } from 'node:fs';
import { pluginBuild } from '../../shared/tsup.preset.js';

/**
 * 包版本在构建期注入 host bundle：MCP 握手的 `clientInfo.version` 要报插件自己的版本，而版本
 * 只能有一个来源（package.json）——写死字面量升版本时必然漏（`lib/` 是提交进仓库的产物，漂了
 * 也看不出来）。与 token-meter 注入分享面板用的包元信息是同一套做法。
 *
 * 这是**本插件专属**的一处，刻意不放进 `shared/tsup.preset.ts`——那边只留所有插件共用的机制。
 */
const PKG_VERSION = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

/**
 * yaml 内联进 ESM 产物后，它内部仍有 CJS 式的 `require('process')`；ESM 产物里没有 `require`，
 * 所以在顶部用 `createRequire(import.meta.url)` 兜一个出来。
 *
 * 这是**本插件专属**的一处，刻意不放进 `shared/tsup.preset.ts`——那边只留所有插件共用的机制，
 * 只服务一个使用者的开关放进去就是预设的长期负担。
 */
const YAML_BANNER =
  "import { createRequire as __dshpCreateRequire } from 'node:module';\nconst require = __dshpCreateRequire(import.meta.url);";

export default pluginBuild('@dshp/mcp-manager', { inline: ['yaml'] }).map((config) =>
  config.platform === 'node'
    ? {
        ...config,
        banner: { js: YAML_BANNER },
        define: { ...config.define, __DSHP_MCP_MANAGER_VERSION__: JSON.stringify(PKG_VERSION) },
      }
    : config,
);
