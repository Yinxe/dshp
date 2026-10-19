/**
 * 会话日志文件索引 —— 纯 node:fs，无外部依赖，可独立单测
 *
 * 原实现：dsh-token-stats/lib/fsindex.js（逐行对齐，仅加 TS 类型）
 *
 * 设计：每次 snapshot 只做一次目录遍历 + 每个日志文件一次 stat，
 * 索引条目直接携带 size/mtimeMs；指纹与排序复用条目，不再重复 stat。
 *
 * 与旧实现的两处**必要**差异（DSH 会话日志改版后旧逻辑会漏掉新会话，
 * 表现为 $DSH_HOME/storages/token_stats.json 不再增长）：
 *  1. 日志文件名按格式代另名：v3 写 `session.v3.jsonl.zstd`、v4 写 `session.v4.jsonl.zstd`
 *     （dsh-session-persistence-jsonl：无压缩世代为 `session.vN.jsonl`，早期无代名写
 *     `session.jsonl.zstd`）。全部都要认（同一会话可能同时存在多代文件，v4 是升级后的
 *     规范形态）；指纹把**存在过的全部日志**一起纳入，任一文件变化都会触发重扫。
 *     只认旧代会把冻结的老文件当活的——新事件静默丢失。
 *  2. 目录名不再限定 `session-` 前缀：子代理会话用裸 uuid，QQ 渠道会话用
 *     `qqbot-*`。已验证目录名 == 会话头里的 id，因此按目录名建索引仍然安全。
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** 会话日志文件名（同一目录可同时存在多个）。 */
export const LOG_FILE_NAMES: string[] = [
  'session.v4.jsonl.zstd',
  'session.v4.jsonl',
  'session.v3.jsonl.zstd',
  'session.jsonl.zstd',
];

export interface FileIndexEntry {
  /** 最新一份日志文件的路径（供排查用；统计走 readSession，不直接读文件） */
  file: string;
  size: number;
  mtimeMs: number;
  /** 目录内全部日志的合成指纹：`name:size:mtime|…` */
  fp: string;
}

/**
 * 扫描 sessions 目录建立 sessionId → { file, size, mtimeMs, fp } 索引。
 * 布局变化时返回空，调用方退化为全读。
 */
export function buildFileIndex(sessionsDir: string): Map<string, FileIndexEntry> {
  const idx = new Map<string, FileIndexEntry>();
  try {
    for (const entry of readdirSync(sessionsDir)) {
      const full = join(sessionsDir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      let sessDirs: string[];
      try {
        sessDirs = readdirSync(full);
      } catch {
        continue;
      }
      for (const sess of sessDirs) {
        const dir = join(full, sess);
        try {
          if (!statSync(dir).isDirectory()) continue;
        } catch {
          continue;
        }
        const parts: string[] = [];
        let newest: { file: string; size: number; mtimeMs: number } | null = null;
        for (const name of LOG_FILE_NAMES) {
          const file = join(dir, name);
          try {
            const s = statSync(file);
            if (!s.isFile()) continue;
            parts.push(name + ':' + s.size + ':' + Math.floor(s.mtimeMs));
            if (newest === null || s.mtimeMs > newest.mtimeMs)
              newest = { file, size: s.size, mtimeMs: s.mtimeMs };
          } catch {
            /* 该编码不存在：跳过 */
          }
        }
        // 一个日志都没有的会话目录跳过（与旧实现一致）
        if (newest === null) continue;
        idx.set(sess, { ...newest, fp: parts.join('|') });
      }
    }
  } catch {
    /* sessions 目录不存在 → 空索引 */
  }
  return idx;
}

/** 日志文件指纹；索引缺失时返回 null（调用方退化为重扫）。 */
export function fileFingerprint(index: Map<string, FileIndexEntry>, id: string): string | null {
  const e = index.get(id);
  return e === undefined ? null : e.fp;
}
