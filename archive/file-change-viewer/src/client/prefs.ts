/**
 * 显示偏好：一份进程内权威缓存 + 与 Host 的读写往返
 *
 * 偏好真正的家在 **profile 条目 `config:` 的 `dshp-file-change-viewer` 分节**（0.1.7 起替代
 * settings.yaml；Host 半导出的 `Config` schema 校验并全字段 volatile）。客户端不自己造第二事实源：
 *
 * | 操作     | 路径                                                              |
 * | -------- | ----------------------------------------------------------------- |
 * | 首次读   | `GET  /ext/dshp-file-change-viewer/state`（`apply` 时拉一次）      |
 * | 写一项   | `POST /ext/dshp-file-change-viewer/config` → Host `settings.update` |
 * | 订阅     | 内存缓存变更通知（工具行与设置节订阅同一个 store）                 |
 *
 * 写是**乐观**的：先把新值挂上缓存让界面立刻响应，Host 应答后再采纳回写的权威值；失败则回滚到
 * 上一次的值并把错误挂给设置节显示（绝不假装保存成功）。
 *
 * 这座 store 是设置节「File Change View」与每个工具行共用的同一份订阅源，所以改完偏好，已经渲染在
 * 会话里的文件块也会跟着换视图；同时它只依赖 `/ext` 路由，不依赖 `settingsScope` 的挂载时序
 * （服务晚挂载时那条路会静默退化成只读默认值）。
 *
 * **状态住在模块级**：bundle 的 factory 每个插件实例只求值一次，所以模块级就等于「每个插件实例
 * 一份」，既不需要把 React 传进来造工厂，也不会在两次渲染之间丢状态。首次读取由 `apply` 显式调用
 * {@link startPrefs} 触发，保持在原有挂载时序上。
 *
 * @module @dshp/file-change-viewer/client/prefs
 */
import { useEffect, useState } from 'react';
import { fetchState, saveConfig } from './api.js';
import type { ConfigPatch, PrefField, SavePhase, ViewerPrefs } from './types.js';

/** 默认值（与 Host `ConfigSchema` 的出厂默认同值；Host 读不到时的兜底）。 */
export const DEFAULT_PREFS: ViewerPrefs = {
  view: 'highlight',
  sectionsOpen: false,
  contextLines: 3,
  patchTool: false,
};

/**
 * 外部存储不可信：逐字段校验，坏值回默认。
 *
 * @param raw - `settings.yaml` 里这一节的值（不透明）。
 * @returns 合法偏好。
 */
export function sanitizePrefs(raw: unknown): ViewerPrefs {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_PREFS };
  const record = raw as Record<string, unknown>;
  const contextLines = record['contextLines'];
  return {
    view: record['view'] === 'diff' ? 'diff' : 'highlight',
    sectionsOpen: record['sectionsOpen'] === true,
    // 只认枚举里的四个值；Host 读不到 / 值坏了都回默认 3 行。
    contextLines: contextLines === 0 || contextLines === 5 || contextLines === 8 ? contextLines : 3,
    // 测试版能力：只有明确的 true 才算开（Host 读不到 / 值坏了都回默认关）。
    patchTool: record['patchTool'] === true,
  };
}

/** 进程内权威缓存 + 保存态。 */
let prefs: ViewerPrefs = { ...DEFAULT_PREFS };
let phase: SavePhase = 'idle';
let error: string | null = null;
const listeners = new Set<() => void>();
let started = false;

function notify(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      /* 订阅者自己的异常不该影响其它订阅者 */
    }
  }
}

function messageOf(cause: unknown): string {
  return String((cause as Error)?.message ?? cause);
}

function read(): void {
  phase = 'loading';
  error = null;
  notify();
  fetchState()
    .then((response) => {
      if (response && response.ok) {
        prefs = sanitizePrefs(response.config);
        phase = 'ready';
      } else {
        phase = 'error';
        error = (response && response.error) || '读取配置失败';
      }
      notify();
    })
    .catch((cause: unknown) => {
      phase = 'error';
      error = '读取配置失败：' + messageOf(cause);
      notify();
    });
}

function write(field: PrefField, previous: ViewerPrefs): void {
  const patch: ConfigPatch = {};
  if (field === 'view') patch.view = prefs.view;
  else if (field === 'sectionsOpen') patch.sectionsOpen = prefs.sectionsOpen;
  else if (field === 'contextLines') patch.contextLines = prefs.contextLines;
  else patch.patchTool = prefs.patchTool;
  saveConfig(patch)
    .then((response) => {
      if (response && response.ok) {
        prefs = sanitizePrefs(response.config);
        phase = 'ready';
        error = null;
      } else {
        prefs = previous;
        phase = 'error';
        error = '保存失败：' + ((response && response.error) || '未知错误');
      }
      notify();
    })
    .catch((cause: unknown) => {
      prefs = previous;
      phase = 'error';
      error = '保存失败：' + messageOf(cause);
      notify();
    });
}

/**
 * 写一项偏好（乐观更新 + 落 settings.yaml）。
 *
 * @param field - 偏好字段名。
 * @param value - 新值（会被 {@link sanitizePrefs} 收窄）。
 */
export function setPref(field: PrefField, value: unknown): void {
  const candidate = sanitizePrefs({ ...prefs, [field]: value });
  if (candidate[field] === prefs[field]) return;
  const previous = prefs;
  prefs = candidate;
  phase = 'saving';
  error = null;
  notify();
  write(field, previous);
}

/** 重新从 Host 读一次（设置节的「重新读取」按钮）。 */
export function reload(): void {
  read();
}

/** 每个订阅者一份自己的重渲染计数器（组件内调用）。 */
function useTick(): void {
  const [, bump] = useState(0);
  useEffect(() => {
    const listener = (): void => bump((tick) => tick + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

/** 订阅 + 读取当前偏好（工具行与设置节组件内用）。 */
export function usePrefs(): ViewerPrefs {
  useTick();
  return prefs;
}

/** 订阅保存态（设置节显示「已保存 / 保存失败」）。 */
export function useSaveState(): { phase: SavePhase; error: string | null } {
  useTick();
  return { phase, error };
}

/**
 * 首次读取：由 client `apply` 调一次，工具行与设置节挂载时通常已经有值。
 *
 * 幂等：重复调用（例如插件被重挂载）不会重复发请求。
 */
export function startPrefs(): void {
  if (started) return;
  started = true;
  if (typeof fetch === 'function') read();
}
