/**
 * 分享面板用的「作者/机主身份」：从 git 配置里取 user.name / user.email
 *
 * 取法两条，按可靠性排序：
 *  1. **跑 git 本身**（`git config --get user.name|user.email`）—— 这是唯一能正确
 *     处理 includeIf、`$XDG_CONFIG_HOME`、仓库本地 `.git/config` 覆盖的办法。
 *     走 DSH 的 `shell` 服务（可选注入，`ctx.get('shell')`，拿不到就跳过），
 *     工作目录用会话 cwd（有就用，让「仓库本地身份」也能生效）。
 *  2. **退化成直接读配置文件**（`~/.gitconfig` → `$XDG_CONFIG_HOME/git/config`），
 *     按 INI 的 `[user]` 段解析 name/email。没有 shell 服务时仍然能给出全局身份。
 *
 * 结果缓存（含失败：避免每次开分享面板都去 fork 一次 git）；可用
 * `DSHP_TOKEN_METER_GIT_NAME` / `_GIT_EMAIL` 环境变量直接覆盖（容器/CI 里 git 不可用时）。
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, sameOrigin } from './http.js';
import type { AnyCtx } from './types.js';

export interface GitIdentity {
  name: string;
  email: string;
  /** 来源，便于在 UI/日志里说明「这个身份是哪来的」 */
  via: 'env' | 'git' | 'config-file' | 'none';
}

let cached: GitIdentity | null = null;

/** 按 INI 语法取 `[user]` 段里的某个键；支持 `name = value` / `name=value` / 注释 */
export function parseGitConfig(text: string, key: 'name' | 'email'): string {
  let section = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#') || line.startsWith(';')) continue;
    const sec = /^\[([^\]]+)\]/.exec(line);
    if (sec) {
      section = (sec[1] || '').trim().toLowerCase();
      continue;
    }
    if (section !== 'user') continue;
    const kv = /^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(line);
    if (!kv) continue;
    if ((kv[1] || '').toLowerCase() !== key) continue;
    return (kv[2] || '').trim().replace(/^"(.*)"$/, '$1');
  }
  return '';
}

/** 从 git 配置文件里取（全局在前、XDG 在后，后者优先——git 的实际查找顺序） */
function fromConfigFiles(key: 'name' | 'email'): string {
  const xdg = process.env['XDG_CONFIG_HOME'];
  const candidates = [
    xdg ? join(xdg, 'git', 'config') : join(homedir(), '.config', 'git', 'config'),
    join(homedir(), '.gitconfig'),
  ];
  let found = '';
  for (const file of candidates) {
    try {
      const v = parseGitConfig(readFileSync(file, 'utf8'), key);
      if (v !== '') found = v;
    } catch {
      /* 文件不存在/不可读：跳过 */
    }
  }
  return found;
}

/**
 * 读一次身份并缓存。
 * @param ctx 宿主上下文（用 ctx.get('shell') 可选地跑 git）
 * @param cwd 会话工作目录；给了就让「仓库本地 git 身份」也能生效
 */
export async function gitIdentity(ctx: AnyCtx, cwd?: string): Promise<GitIdentity> {
  if (cached !== null) return cached;

  const envName = process.env['DSHP_TOKEN_METER_GIT_NAME'];
  const envEmail = process.env['DSHP_TOKEN_METER_GIT_EMAIL'];
  if (envName !== undefined || envEmail !== undefined) {
    cached = { name: envName || '', email: envEmail || '', via: 'env' };
    return cached;
  }

  let name = '';
  let email = '';
  let via: GitIdentity['via'] = 'none';

  const shell = ctx.get('shell') as AnyCtx;
  if (shell !== undefined && shell !== null && typeof shell.run === 'function') {
    const run = async (cmd: string): Promise<string> => {
      try {
        const spec = shell.resolve({
          command: cmd,
          ...(cwd ? { workdir: cwd } : {}),
          timeoutMs: 4000,
        });
        const r = await shell.run(spec);
        if (r && r.exitCode === 0 && r.stdout && typeof r.stdout.text === 'string') {
          return r.stdout.text.trim();
        }
      } catch {
        /* git 不存在 / 不是仓库 / 被沙箱拒绝：走文件兜底 */
      }
      return '';
    };
    name = await run('git config --get user.name');
    email = await run('git config --get user.email');
    if (name !== '' || email !== '') via = 'git';
  }

  if (name === '' && email === '') {
    name = fromConfigFiles('name');
    email = fromConfigFiles('email');
    if (name !== '' || email !== '') via = 'config-file';
  }

  cached = { name, email, via };
  return cached;
}

/** 测试/热重载用：清掉缓存 */
export function resetGitIdentity(): void {
  cached = null;
}

/** 分享面板的身份路由：GET /ext/dshp-token-meter/identity */
export function registerIdentityRoute(ctx: AnyCtx): void {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/ext/dshp-token-meter/identity',
        handler: async (req: IncomingMessage, res: ServerResponse) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
          try {
            const id = await gitIdentity(ctx);
            return json(res, 200, { ok: true, ...id });
          } catch (error) {
            return json(res, 200, { ok: false, error: String((error as Error)?.message ?? error) });
          }
        },
      }),
    'dshp-token-meter: identity route',
  );
}
