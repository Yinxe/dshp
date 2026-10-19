/**
 * 构建配置照参考项目 dsh-web 的分层：机制全在 `shared/tsup.preset.ts`，包内只声明「我是谁」
 * （host + client 双 bundle、closure 工厂壳、CSS Modules 内联、externals）。
 *
 * 产物：lib/host.js（单文件 ESM）+ lib/client.js（单文件 CJS，内含 `__ModuleLoader__.load`）。
 */
import { readFileSync } from 'node:fs';
import { pluginBuild } from '../../shared/tsup.preset.js';

/**
 * 包元信息在构建期注入 client bundle：分享面板页头要显示「插件名 + 版本 + 仓库」，
 * 而这三样只能有一个来源（package.json）——写死字面量迟早与它漂移。
 * 仓库地址取 `homepage`，去掉协议与 `#readme` 尾巴：图里给人看的是可读的域名路径。
 *
 * 这是**本插件专属**的一处，刻意不放进 `shared/tsup.preset.ts`——那边只留所有插件共用的机制。
 */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  name: string;
  version: string;
  homepage?: string;
};
const PKG_INFO = {
  name: pkg.name,
  version: pkg.version,
  repo: String(pkg.homepage ?? '')
    .replace(/^https?:\/\//, '')
    .replace(/#.*$/, ''),
};

/**
 * 本插件 client 半还要用 `react-dom`（中心区 / 浮窗用 `createPortal` 把卡片挂到 body 上）。
 * 它和 react 一样在 shell 的**冻结模块表**里（web 启动时 `staticModules` 就带了 `react-dom` /
 * `react-dom/client`），所以只声明成 external、由 factory 的 require 解析，绝不打包。
 *
 * 这是**本插件专属**的一处，刻意不放进 `shared/tsup.preset.ts`——那边只留所有插件共用的机制。
 */
const CLIENT_EXTERNAL = ['react-dom'];

export default pluginBuild('@dshp/token-meter').map((config) =>
  config.platform === 'browser'
    ? {
        ...config,
        external: [...(config.external ?? []), ...CLIENT_EXTERNAL],
        define: { ...config.define, __DSHP_TOKEN_METER_PKG__: JSON.stringify(PKG_INFO) },
      }
    : config,
);
