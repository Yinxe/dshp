/**
 * 构建配置照参考项目 dsh-web 的分层：包内只声明「我是谁」，机制全在 `shared/tsup.preset.ts`
 * （host + client 双 bundle、closure 工厂壳、CSS Modules 内联、externals）。
 *
 * 产物：lib/host.js（单文件 ESM）+ lib/client.js（单文件 CJS，内含 `__ModuleLoader__.load`）。
 */
import { pluginBuild } from '../../shared/tsup.preset.js';

export default pluginBuild('@dshp/web-style');
