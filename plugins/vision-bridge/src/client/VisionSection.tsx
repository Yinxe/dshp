/**
 * 设置 → 视觉模型。
 *
 * 交互保持三件事：开关、主模型、备用模型。保存即生效，失败只回错误、不丢本地选择。
 * 图片提示词由主模型按当前对话上下文生成（question 原样透传），插件不追加固定后缀；
 * 单次图片数固定为最近 4 张，配置面因此只留真正需要用户决定的东西。
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button, IconLoadingOutlineRegular, Switch, Tag } from '@deepseek-ai/dsh-client-ui-primitives';
import { checkRoutes, fetchState, saveConfig } from './api.js';
import { Row, Select } from './components.js';
import styles from './styles.module.css';
import type {
  CheckResponse,
  ConfigPatch,
  ProbeResult,
  VisionConfig,
  VisionModel,
  VisionRoute,
} from './types.js';

/** 下拉里表示「不使用备用模型」的哨兵 id。 */
const NO_FALLBACK = '__none';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function routeKey(route: VisionRoute): string {
  return route.provider + '///' + route.model;
}

function parseKey(key: string): VisionRoute | null {
  const index = key.indexOf('///');
  if (index <= 0) return null;
  const provider = key.slice(0, index);
  const model = key.slice(index + 3);
  return provider && model ? { provider, model } : null;
}

function modelLabel(model: VisionModel): string {
  return model.name === model.model
    ? model.provider + '/' + model.model
    : model.name + '（' + model.provider + '/' + model.model + '）';
}

function routeLabel(route: VisionRoute, options: VisionModel[]): string {
  const found = options.find((model) => routeKey(model) === routeKey(route));
  return found ? modelLabel(found) : route.provider + '/' + route.model;
}

function isRoute(value: unknown): value is VisionRoute {
  if (value === null || typeof value !== 'object') return false;
  const route = value as Record<string, unknown>;
  return typeof route['provider'] === 'string' && typeof route['model'] === 'string';
}

function toVisionModel(value: unknown): VisionModel | null {
  if (!isRoute(value)) return null;
  const name = (value as { name?: unknown }).name;
  return {
    provider: value.provider,
    model: value.model,
    name: typeof name === 'string' && name.length > 0 ? name : value.model,
  };
}

/** 探活结果一行。 */
function CheckRow({ label, result }: { label: string; result?: ProbeResult | undefined }): ReactNode {
  const tone = result === undefined ? 'neutral' : result.ok ? 'success' : 'warning';
  const text = result === undefined ? '未配置' : result.ok ? '可用' : '不可用';
  return (
    <div className={styles.checkRow}>
      <Tag tone={tone}>{text}</Tag>
      <span className={styles.checkLabel}>{label}</span>
      <span className={styles.checkMessage}>{result?.message ?? '未配置'}</span>
    </div>
  );
}

export function VisionSection(): ReactNode {
  const [models, setModels] = useState<VisionModel[]>([]);
  const [config, setConfig] = useState<VisionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [check, setCheck] = useState<CheckResponse | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    setCheck(null);
    try {
      const response = await fetchState();
      if (!response.ok) throw new Error(response.error || '无法读取视觉模型列表');
      const nextModels = Array.isArray(response.models)
        ? response.models.map(toVisionModel).filter((model): model is VisionModel => model !== null)
        : [];
      setModels(nextModels);
      setConfig(response.config ?? null);
    } catch (cause) {
      setError('读取失败：' + errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: ConfigPatch): Promise<void> {
    setSaving(true);
    setError('');
    setCheck(null);
    try {
      const response = await saveConfig(patch);
      if (!response.ok) throw new Error(response.error || '保存失败');
      setConfig(response.config ?? null);
    } catch (cause) {
      setError('保存失败：' + errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function runCheck(): Promise<void> {
    setChecking(true);
    setError('');
    setCheck(null);
    try {
      setCheck(await checkRoutes());
    } catch (cause) {
      setError('测试失败：' + errorMessage(cause));
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <IconLoadingOutlineRegular />
          <span className={styles.loadingText}>正在读取视觉模型…</span>
        </div>
      </div>
    );
  }

  const options: VisionModel[] = [];
  const seen = new Set<string>();
  for (const model of models) {
    const key = routeKey(model);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(model);
  }
  // 当前选择可能已不在候选里（模型改名 / 凭证失效）：补一项，避免下拉打开就逼用户重选。
  for (const route of [config?.primary, config?.fallback]) {
    if (!route || seen.has(routeKey(route))) continue;
    seen.add(routeKey(route));
    options.push({ ...route, name: route.model + '（当前选择，不在列表中）' });
  }

  const primaryKey = config?.primary ? routeKey(config.primary) : '';
  const fallbackKey = config?.fallback ? routeKey(config.fallback) : NO_FALLBACK;
  const ready = config?.enabled === true && config.primary !== null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>视觉模型</h2>
          <p className={styles.lead}>
            纯文本模型通过 vision_describe 把图片交给这里的视觉模型识别；主模型失败时自动用备用模型重试。
          </p>
        </div>
        <Switch
          checked={config?.enabled === true}
          disabled={saving}
          label="启用视觉桥接"
          onChange={(checked) => void save({ enabled: checked })}
        />
      </header>

      <div className={styles.tags}>
        <Tag tone={config?.enabled === true ? 'success' : 'neutral'}>
          {config?.enabled === true ? '已启用' : '已停用'}
        </Tag>
        <Tag tone={models.length > 0 ? 'info' : 'warning'}>{models.length} 个视觉模型</Tag>
        <Tag tone={ready ? 'success' : 'warning'}>{ready ? '桥接就绪' : '待配置'}</Tag>
      </div>

      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}

      {models.length === 0 ? (
        <p className={styles.warning}>
          没有找到支持图片输入的模型。请到 设置 → 模型 中为多模态模型勾选 image 输入，然后点「刷新列表」。
        </p>
      ) : null}

      <div className={styles.card}>
        <Row
          label="主模型"
          desc="纯文本模型看图时调用它；未选择时 vision_describe 会临时用候选列表第一项，但发送门禁不会接管。"
        >
          <Select
            disabled={saving || options.length === 0}
            value={primaryKey}
            label="主视觉模型"
            selectedLabel={config?.primary ? routeLabel(config.primary, options) : '选择主模型…'}
            options={options.map((model) => ({ id: routeKey(model), label: modelLabel(model) }))}
            onSelect={(id) => {
              const route = parseKey(id);
              if (route) void save({ primary: route });
            }}
          />
        </Row>
        <Row label="备用模型" desc="主模型失败时重试一次；与主模型相同则不重试。">
          <Select
            disabled={saving}
            value={fallbackKey}
            label="备用视觉模型"
            selectedLabel={config?.fallback ? routeLabel(config.fallback, options) : '不使用备用模型'}
            options={[
              { id: NO_FALLBACK, label: '不使用备用模型' },
              ...options.map((model) => ({ id: routeKey(model), label: modelLabel(model) })),
            ]}
            onSelect={(id) => {
              const route = id === NO_FALLBACK ? null : parseKey(id);
              if (id === NO_FALLBACK || route) void save({ fallback: route });
            }}
          />
        </Row>
      </div>

      <div className={styles.actions}>
        <Button variant="outline" size="sm" disabled={loading || saving} onClick={() => void load()}>
          刷新列表
        </Button>
        <Button variant="outline" size="sm" disabled={checking || saving} onClick={() => void runCheck()}>
          {checking ? '测试中…' : '测试路由'}
        </Button>
        {saving ? <span className={styles.muted}>保存中…</span> : null}
      </div>

      {check ? (
        <div className={styles.check}>
          <CheckRow label="主模型" result={check.primary} />
          <CheckRow label="备用模型" result={check.fallback} />
          <p className={styles.hint}>只检查路由和图片能力声明，不会发起真实推理。</p>
        </div>
      ) : null}

      <p className={styles.hint}>
        图片按会话缓存最近 20 张，每次 vision_describe 最多分析 4 张。配置保存在 profile 条目
        dshp-vision-bridge 的 config:，改动即时生效。
      </p>
    </div>
  );
}
