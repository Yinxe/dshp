/**
 * 每个供应商自己的**展示偏好**（浏览器本地，纯客户端；键值由供应商模板自己定义）
 *
 * ## 为什么是「随便什么键值」而不是统一 schema
 *
 * 按钮上显示什么，是**供应商模板自己的事**：Goat 有「余额开关 + 5h/1w/1m」，
 * deepseek 可能只有一个余额开关，将来某个供应商可能想记「显示的币种」。所以这里**不定义任何
 * 语义**，只提供一个按供应商分作用域的键值袋：
 *
 * ```ts
 * ctx.prefs.get('window', 'monthly');   // 读（带兜底）
 * ctx.prefs.set('balance', '1');        // 写：立刻通知订阅者 → 侧边栏按钮重画
 * ```
 *
 * 控件也由该供应商的**详情模板**自己画（`ProviderUIKit.PrefSwitch` / `PrefChoice`），
 * 弹层不再有统一的「按钮显示」胶囊 —— 那是把各家的口味硬塞进同一套单选按钮，本来就是错的。
 *
 * ## 存储
 *
 * `localStorage` 的键 **`tm-quota-prefs`**，值是 `{ [vendorId]: { [key]: value } }`。
 * 读时消毒：坏 JSON / 非法 id / 非法键值一律忽略；供应商被删后 `prune()` 清孤儿。
 * 值是短字符串（`'1'` / `'monthly'` / `'5h'` …），上限 32 字符，避免手改 localStorage 塞大对象。
 *
 * 上一版的单键格式（`tm-button-metric`：`{vendorId: metric}`）已废弃，加载时顺手删掉。
 *
 * @module @dshp/token-meter/client/quota-prefs
 */

/** localStorage 键。 */
const KEY = 'tm-quota-prefs';

/** 已废弃的旧键（上一版的「按钮显示」单键格式）。 */
const LEGACY_KEY = 'tm-button-metric';

/** 上限：供应商数 / 每家键数 / 键长 / 值长。 */
const MAX_VENDORS = 64;
const MAX_KEYS = 16;
const ID_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const KEY_RE = /^[a-z0-9-]{1,24}$/;
const VALUE_RE = /^[a-z0-9._-]{0,32}$/;

/** 一个供应商的偏好袋。 */
type VendorPrefs = Record<string, string>;

/** 全量偏好：供应商 id → 键值。 */
type Prefs = Record<string, VendorPrefs>;

/** 读一次 localStorage（坏数据一律当空表，不抛）。 */
function load(): Prefs {
  try {
    if (typeof localStorage === 'undefined') return {};
    localStorage.removeItem(LEGACY_KEY); // 旧格式不再使用
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Prefs = {};
    let vendors = 0;
    for (const [id, bag] of Object.entries(parsed as Record<string, unknown>)) {
      if (vendors >= MAX_VENDORS) break;
      if (!ID_RE.test(id) || !bag || typeof bag !== 'object' || Array.isArray(bag)) continue;
      const clean: VendorPrefs = {};
      let keys = 0;
      for (const [k, v] of Object.entries(bag as Record<string, unknown>)) {
        if (keys >= MAX_KEYS) break;
        if (!KEY_RE.test(k) || typeof v !== 'string') continue;
        const value = v.trim().toLowerCase();
        if (!VALUE_RE.test(value)) continue;
        clean[k] = value;
        keys += 1;
      }
      if (keys > 0) {
        out[id] = clean;
        vendors += 1;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** 写一次 localStorage（不可用/配额满 → 内存降级，功能照常）。 */
function save(next: Prefs): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式 / 配额满：内存里已经更新，刷新后回到上次成功的值 */
  }
}

let prefs: Prefs = load();
const listeners = new Set<() => void>();

/** 通知所有订阅者（按钮重画）。 */
function emit(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* 单个订阅者出错不影响别人 */
    }
  }
}

/** 某个供应商作用域内的偏好读写接口（交给模板的就是它）。 */
export interface PrefsApi {
  /**
   * 读一个偏好键。
   *
   * @param key - 供应商自己定义的键（如 `window` / `balance`）。
   * @param fallback - 没设过时的返回值（省得每家都写 `|| 'monthly'`）。
   * @returns 存着的值或兜底值。
   */
  get(key: string, fallback?: string): string;
  /**
   * 写一个偏好键（立刻通知订阅者 → 侧边栏按钮重画）。
   *
   * @param key - 键。
   * @param value - 值（短字符串；空串 = 删掉这个键）。
   * @returns 无。
   */
  set(key: string, value: string): void;
}

/** 作用域对象缓存（同一供应商永远拿到同一个 `PrefsApi` 引用，可安全放进依赖数组）。 */
const scopes = new Map<string, PrefsApi>();

/** 每个供应商的展示偏好（进程内单例）。 */
export const providerPrefs = {
  /**
   * 取某供应商的作用域接口（模板拿到的 `ctx.prefs` 就是它）。
   *
   * @param vendorId - 供应商 id。
   * @returns 该供应商的偏好接口。
   */
  scope(vendorId: string): PrefsApi {
    const cached = scopes.get(vendorId);
    if (cached !== undefined) return cached;
    const api: PrefsApi = {
      get: (key: string, fallback = '') => {
        const bag = prefs[vendorId];
        const hit = bag?.[key];
        return typeof hit === 'string' && hit !== '' ? hit : fallback;
      },
      set: (key: string, value: string) => {
        if (!ID_RE.test(vendorId) || !KEY_RE.test(key)) return;
        const v = String(value ?? '')
          .trim()
          .toLowerCase();
        if (v !== '' && !VALUE_RE.test(v)) return;
        const bag: VendorPrefs = { ...prefs[vendorId] };
        if (v === '') delete bag[key];
        else bag[key] = v;
        const next: Prefs = { ...prefs };
        if (Object.keys(bag).length === 0) delete next[vendorId];
        else next[vendorId] = bag;
        prefs = next;
        save(prefs);
        emit();
      },
    };
    scopes.set(vendorId, api);
    return api;
  },

  /**
   * 订阅变化（侧边栏按钮 / 弹层用它触发重画）。
   *
   * @param fn - 变化回调。
   * @returns 取消订阅。
   */
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  /**
   * 丢掉不在册的供应商（被删掉后那几条用不到）。
   *
   * @param vendorIds - 当前配置里的供应商 id。
   * @returns 无。
   */
  prune(vendorIds: string[]): void {
    const alive = new Set(vendorIds);
    const next: Prefs = {};
    let changed = false;
    for (const [id, bag] of Object.entries(prefs)) {
      if (alive.has(id)) next[id] = bag;
      else changed = true;
    }
    if (!changed) return;
    prefs = next;
    save(prefs);
    emit();
  },

  /** 全部清空（测试与「重置」用）。 */
  clear(): void {
    prefs = {};
    save(prefs);
    emit();
  },
};
