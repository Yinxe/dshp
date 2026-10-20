/**
 * 「设置 → AI 搜索」。
 *
 * 一个稳定的 web 搜索提供方（dshp-search），后端可选 Tavily / Exa / Firecrawl。
 * 密钥走 credentials 服务；搜索行为与后端字段写入 profile 条目 config:。
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button, Input, Tag } from '@deepseek-ai/dsh-client-ui-primitives';
import { clearKey, fetchState, runTest, saveConfig, saveKey } from './api.js';
import { KeyField, Loading, Notice, ResultList, Row, Select } from './components.js';
import styles from './styles.module.css';
import type {
  ConfigSnapshot,
  ProviderField,
  ProviderState,
  RemoteLike,
  StateResponse,
  TestResponse,
} from './types.js';

const MAX_RESULTS_OPTIONS = ['1', '2', '3', '4', '5', '6', '8', '10'];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readBlock(config: ConfigSnapshot | null, providerId: string): Record<string, unknown> {
  if (!config) return {};
  const value = config[providerId];
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionLabel(field: ProviderField, value: unknown): string {
  const found = field.options?.find((option) => option.value === value);
  return found?.label ?? String(value ?? '');
}

export function SearchSection({ remote }: { remote: RemoteLike | undefined }): ReactNode {
  const [info, setInfo] = useState<StateResponse | null>(null);
  const [config, setConfig] = useState<ConfigSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [query, setQuery] = useState('');
  const [testResult, setTestResult] = useState<TestResponse | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchState();
      if (!response.ok) throw new Error(response.error || '状态读取失败');
      setInfo(response);
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

  async function save(patch: Record<string, unknown>): Promise<void> {
    setSaving(true);
    setError('');
    setTestResult(null);
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

  async function handleSaveKey(provider: ProviderState): Promise<void> {
    const value = keyDraft.trim();
    if (value.length === 0) {
      setError('请输入 API Key 后再保存');
      return;
    }
    setKeySaving(true);
    setError('');
    try {
      const response = await saveKey(remote, provider.credentialRef, value);
      if (!response.ok) throw new Error(response.error || '保存密钥失败');
      if (response.state) {
        setInfo(response.state);
        setConfig(response.state.config ?? null);
      }
      setKeyDraft('');
    } catch (cause) {
      setError('保存密钥失败：' + errorMessage(cause));
    } finally {
      setKeySaving(false);
    }
  }

  async function handleClearKey(provider: ProviderState): Promise<void> {
    setKeySaving(true);
    setError('');
    try {
      const response = await clearKey(remote, provider.credentialRef);
      if (!response.ok) throw new Error(response.error || '清除密钥失败');
      if (response.state) {
        setInfo(response.state);
        setConfig(response.state.config ?? null);
      }
      setKeyDraft('');
    } catch (cause) {
      setError('清除密钥失败：' + errorMessage(cause));
    } finally {
      setKeySaving(false);
    }
  }

  async function handleTest(provider: ProviderState): Promise<void> {
    const text = query.trim();
    if (text.length === 0) {
      setError('请输入测试查询');
      return;
    }
    setTesting(true);
    setError('');
    setTestResult(null);
    try {
      setTestResult(await runTest(provider.id, text));
    } catch (cause) {
      setTestResult({ ok: false, error: '测试失败：' + errorMessage(cause) });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Loading text="正在读取搜索配置…" />
      </div>
    );
  }

  const providers = info?.providers ?? [];
  const providerId = config?.provider ?? providers[0]?.id ?? '';
  const focused = providers.find((provider) => provider.id === providerId) ?? providers[0] ?? null;
  const block = focused ? readBlock(config, focused.id) : {};
  const selectedProviderId = info?.selectedProviderId ?? null;
  const webSearchConfigured = info?.webSearchConfigured === true;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>AI 搜索</h2>
          <p className={styles.lead}>
            接管模型的内置 web_search；后端可选 Tavily / Exa / Firecrawl，密钥存 DSH 凭证库，不进配置。
          </p>
        </div>
        <Tag tone={webSearchConfigured ? 'success' : 'warning'}>
          {webSearchConfigured ? '已接管 web_search' : '未接管'}
        </Tag>
      </header>

      <div className={styles.tags}>
        <Tag tone="info">{providers.length} 个后端</Tag>
        <Tag tone={focused?.configured || focused?.credentialRequired === false ? 'success' : 'warning'}>
          {focused
            ? focused.credentialRequired === false
              ? '无需 Key'
              : focused.configured
                ? 'Key 已配置'
                : 'Key 未配置'
            : '无后端'}
        </Tag>
        {selectedProviderId ? (
          <Tag tone={webSearchConfigured ? 'success' : 'neutral'}>
            web.searchProvider: {selectedProviderId}
          </Tag>
        ) : null}
      </div>

      {error ? <Notice kind="error">{error}</Notice> : null}
      {info?.selectionHint ? <Notice kind="warning">{info.selectionHint}</Notice> : null}
      {providers.length === 0 ? <Notice kind="warning">没有可用的搜索后端。</Notice> : null}

      <div className={styles.card}>
        <Row label="搜索引擎" desc={focused ? focused.description : '选择搜索后端；切换即时生效。'}>
          <Select
            disabled={saving}
            value={providerId}
            label="搜索引擎"
            selectedLabel={focused ? focused.label : '选择后端…'}
            options={providers.map((provider) => ({ id: provider.id, label: provider.label }))}
            onSelect={(id) => void save({ provider: id })}
          />
        </Row>
        {focused ? (
          <Row label="免费额度" desc={focused.freeNote}>
            <Tag tone="info">{focused.label}</Tag>
          </Row>
        ) : null}
        {focused ? (
          <KeyField
            label="API Key"
            desc={`凭证引用 ${focused.credentialRef}；保存后即时生效。`}
            configured={focused.configured}
            source={focused.source}
            required={focused.credentialRequired}
            draft={keyDraft}
            saving={keySaving}
            onDraft={setKeyDraft}
            onSave={() => void handleSaveKey(focused)}
            onClear={() => void handleClearKey(focused)}
          />
        ) : null}
        {focused?.fields.map((field) => (
          <Row key={field.key} label={field.label} desc={field.hint}>
            {field.kind === 'select' && field.options ? (
              <Select
                disabled={saving}
                value={String(block[field.key] ?? field.options[0]?.value ?? '')}
                label={field.label}
                selectedLabel={optionLabel(field, block[field.key] ?? field.options[0]?.value)}
                options={field.options.map((option) => ({
                  id: option.value,
                  label: option.label,
                }))}
                onSelect={(value) => void save({ [focused.id]: { [field.key]: value } })}
              />
            ) : (
              <span className={styles.muted}>{String(block[field.key] ?? '')}</span>
            )}
          </Row>
        ))}
      </div>

      <div className={styles.card}>
        <Row label="默认结果数" desc="调用方显式传 maxResults 时以调用方为准。">
          <Select
            disabled={saving}
            value={String(config?.maxResults ?? 5)}
            label="默认结果数"
            selectedLabel={String(config?.maxResults ?? 5) + ' 条'}
            options={MAX_RESULTS_OPTIONS.map((value) => ({ id: value, label: value + ' 条' }))}
            onSelect={(value) => void save({ maxResults: Number(value) })}
          />
        </Row>
      </div>

      <div className={styles.card}>
        <div className={styles.testBox}>
          <div className={styles.testLine}>
            <Input
              className={styles.testInput ?? ''}
              value={query}
              placeholder={focused ? `测试 ${focused.label} 搜索…` : '输入测试查询'}
              disabled={testing || saving || focused === null}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && focused) void handleTest(focused);
              }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={testing || saving || focused === null}
              onClick={() => {
                if (focused) void handleTest(focused);
              }}
            >
              {testing ? '搜索中…' : '测试搜索'}
            </Button>
          </div>
          <p className={styles.hint}>
            测试会真实调用所选后端；Firecrawl 不填 Key 也可用，其余后端需要先配置 Key。
          </p>
          {testResult ? (
            <div className={styles.testResult}>
              {testResult.ok ? (
                <>
                  <p className={styles.testMeta}>
                    {testResult.provider} · {testResult.takenMs ?? 0} ms · {(testResult.sources ?? []).length}{' '}
                    条结果
                  </p>
                  {testResult.content ? <p className={styles.testContent}>{testResult.content}</p> : null}
                  <ResultList sources={testResult.sources ?? []} />
                </>
              ) : (
                <Notice kind="error">{testResult.error ?? '测试失败'}</Notice>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <p className={styles.hint}>
        本插件注册固定的 web 提供方 dshp-search；profile 的 web.searchProvider 需指向它。 安装时的 bundle
        patch 会自动设置，若被其他 patch 覆盖，按上方提示修改后重启 dsh web。
      </p>
    </div>
  );
}
