/**
 * patch 文件定位与安全写入
 *
 * 定位顺序（前者优先）：
 *  1. settings 的 patchFile 显式覆盖（绝对路径）
 *  2. DSH_PROFILE_DIR 环境变量 → <dir>/cordis.patch.yml
 *  3. 从本模块真实路径向上找最近的 cordis.patch.yml（覆盖「复制安装」场景）
 *  4. 扫 <dshHome>/profiles 下各 profile 的 package.json，看 dsh.profile.bundles
 *     里登记了本插件的 profile（覆盖 pnpm link: 安装——link 下 import.meta.url 指向仓库）
 *  5. 兜底 <dshHome>/profiles/web/cordis.patch.yml（可能不存在，state 会标 exists:false）
 *
 * 写入安全：先备份到 <file>.bak（单份滚动），再写临时文件后 rename 原子替换；
 * 调用方负责在写前自校验序列化结果（patchdoc.verifyRoundTrip）。
 *
 * @module @dshp/mcp-manager
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultDshHome } from './config.js';
import type { PatchFileInfo } from './types.js';

export const PATCH_FILENAME = 'cordis.patch.yml';

/** 定位 patch 文件（永远返回一个路径 + 来源标记；存在性单独探测） */
export function locatePatchFile(selfModuleUrl: string, configured: string): PatchFileInfo {
  if (configured) return info(configured, 'settings');

  const envDir = process.env['DSH_PROFILE_DIR'];
  if (envDir && envDir.trim()) return info(join(envDir.trim().slice(0, 1024), PATCH_FILENAME), 'env');

  try {
    let dir = dirname(fileURLToPath(selfModuleUrl));
    for (let i = 0; i < 12; i += 1) {
      const candidate = join(dir, PATCH_FILENAME);
      // 每个插件包自身也带 cordis.patch.yml（bundle 声明）——只认 profile 根的那份：
      // 目录没有 package.json，或 package.json 带 dsh.profile（profile 根标记）才算
      if (existsSync(candidate) && isProfileRoot(dir)) return info(candidate, 'module-path');
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    /* ignore：定位失败继续往下走 */
  }

  const hit = scanProfilesForSelf();
  if (hit) return info(join(hit, PATCH_FILENAME), 'profile-scan');
  return info(join(defaultDshHome(), 'profiles', 'web', PATCH_FILENAME), 'fallback');
}

function info(path: string, source: PatchFileInfo['source']): PatchFileInfo {
  const abs = resolve(path);
  return { path: abs, exists: existsSync(abs), source };
}

/** 目录是否是 profile 根：没有 package.json（继续向上找），或有且带 dsh.profile 标记 */
function isProfileRoot(dir: string): boolean {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return true;
  try {
    const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as unknown;
    const dsh = raw && typeof raw === 'object' ? (raw as Record<string, unknown>)['dsh'] : undefined;
    return (
      dsh !== null && typeof dsh === 'object' && Object.hasOwn(dsh as Record<string, unknown>, 'profile')
    );
  } catch {
    return false;
  }
}

/** 扫 profiles：哪个 profile 的 bundles 登记了本插件（link: 安装时 import.meta.url 已指回仓库） */
function scanProfilesForSelf(): string | null {
  try {
    const profilesDir = join(defaultDshHome(), 'profiles');
    if (!existsSync(profilesDir)) return null;
    const names = (() => {
      try {
        return readdirSync(profilesDir).map((x) => String(x));
      } catch {
        return [] as string[];
      }
    })();
    for (const name of names) {
      const pkgPath = join(profilesDir, name, 'package.json');
      if (!existsSync(pkgPath)) continue;
      try {
        const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as unknown;
        const dsh = raw && typeof raw === 'object' ? (raw as Record<string, unknown>)['dsh'] : undefined;
        const profile =
          dsh && typeof dsh === 'object' ? (dsh as Record<string, unknown>)['profile'] : undefined;
        const bundles =
          profile && typeof profile === 'object'
            ? (profile as Record<string, unknown>)['bundles']
            : undefined;
        if (Array.isArray(bundles) && bundles.includes('@dshp/mcp-manager')) {
          return join(profilesDir, name);
        }
      } catch {
        /* 单个 profile 读不了就跳过 */
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 读 patch 文件全文（不存在回 null） */
export async function readPatchFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** 备份现有文件到 <path>.bak（单份滚动），然后临时文件 + rename 原子落盘 */
export async function writePatchFile(path: string, text: string): Promise<void> {
  const tmp = path + '.tmp-dshp-mcp-manager';
  await writeFile(tmp, text, 'utf8');
  try {
    await copyFile(path, path + '.bak');
  } catch {
    /* 首次写入时原文件可能不存在，忽略 */
  }
  await rename(tmp, path);
}
