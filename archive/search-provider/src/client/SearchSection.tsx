/**
 * 「设置 → AI 搜索」配置页（单页多供应商）
 *
 * 分区（与官方设置页行规范一致，见 styles.module.css）：
 *  1. 状态：选型徽章 / 提供方 id / 密钥状态 / 接管前
 *  2. 供应商切换（多个提供方并存时才出现；写 settings 的 provider 字段）
 *  3. 密钥配置：写入/显示/清除（走 api 网关 credentials 域，按 state 给出的引用名）
 *  4. 搜索行为：默认结果数 + 供应商自定义字段（控件由 state.providers[].fields 驱动）
 *  5. 供应商附加区（如 Tavily 用量与配额；由 providers/index.ts 注册）
 *  6. 连接测试：输入查询 → 结果列表
 *
 * 组件是**普通函数组件**，`useState` / `useEffect` / `useCallback` 直接从 react import，
 * 官方构件从 primitives import；`React` / `P` 形参已去掉。唯一保留的一层薄工厂
 * `createSearchSection(bridge)` 只闭包住两个真实运行时依赖：通用小构件集合 `C`（模块级具名
 * import）与路由 `bridge`（由 `index.tsx` 的 `apply` 在注册设置节之前构造）。
 *
 * 原实现：dsh-tavily-search/client.js 的 TavilySettingsSection（JS）
 * → 本文件为等价 TS 重写 + 多供应商泛化：控件与文案跟随状态接口元数据，
 *   新增供应商不改本文件（除附加区已自动注册外）。
 *
 * @module @dshp/search-provider/client
 */
import { useCallback, useEffect, useState } from 'react';
import { Button, IconSearchOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import { components as C, type Components } from './components.js';
import { createProviderExtras } from './providers/index.js';
import styles from './styles.module.css';
import type { Bridge } from './api.js';
import type { ConfigSnapshot, ProviderField, ProviderState, StateResponse, TestResponse } from './types.js';

interface Notice {
  kind: 'ok' | 'err';
  text: string;
}

interface FocusedView {
  provider: ProviderState;
  block: Record<string, unknown>;
}

export function createSearchSection(bridge: Bridge): () => ReactNode {
  const EXTRAS = createProviderExtras(C, bridge);

  return function SearchSection(): ReactNode {
    const [info, setInfo] = useState<StateResponse | null>(null);
    const [config, setConfig] = useState<ConfigSnapshot | null>(null);
    const [stateErr, setStateErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [keyDraft, setKeyDraft] = useState('');
    const [keyShown, setKeyShown] = useState(false);
    const [busy, setBusy] = useState<null | 'saving' | 'clearing' | 'testing'>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<TestResponse | null>(null);

    const applyState = useCallback((value: StateResponse | null | undefined) => {
      if (value && value.ok) {
        setInfo(value);
        if (value.config) setConfig(value.config);
        setStateErr(null);
      } else {
        setStateErr((value && value.error) || '状态读取失败');
      }
    }, []);

    const load = useCallback(() => {
      bridge
        .getState()
        .then((value) => applyState(value))
        .catch((error: unknown) => setStateErr(String((error as Error)?.message ?? error)));
    }, [applyState]);

    useEffect(() => {
      load();
    }, [load]);

    const saveConfig = useCallback((patch: Record<string, unknown>, okText?: string) => {
      setSaving(true);
      setNotice(null);
      bridge
        .saveConfig(patch)
        .then((reply) => {
          setSaving(false);
          if (reply && reply.ok) {
            if (reply.config) setConfig(reply.config);
            setNotice({
              kind: 'ok',
              text: okText || '搜索行为已保存到 settings.yaml（dshp-search-provider），即时生效。',
            });
          } else {
            setNotice({ kind: 'err', text: (reply && reply.error) || '保存失败' });
          }
        })
        .catch((error: unknown) => {
          setSaving(false);
          setNotice({ kind: 'err', text: String((error as Error)?.message ?? error) });
        });
    }, []);

    const providers: ProviderState[] = (info && info.providers) || [];
    const providerId = (config && config.provider) || (providers[0] ? providers[0].id : '');
    const focusedProvider =
      providers.find((p) => p.id === providerId) ||
      (providers.length > 0 ? (providers[0] as ProviderState) : null);
    const focused: FocusedView | null =
      focusedProvider === null
        ? null
        : { provider: focusedProvider, block: readBlock(config, focusedProvider.id) };
    const selectedId = info ? (info.selectedProviderId ?? null) : null;
    const extras = (info && info.extras) || {};

    const saveKey = () => {
      if (focused === null) return;
      const value = keyDraft.trim();
      if (value.length === 0) {
        setNotice({ kind: 'err', text: '请输入 API Key 后再保存。' });
        return;
      }
      setBusy('saving');
      setNotice(null);
      bridge
        .saveKey(focused.provider.credentialRef, value)
        .then((reply) => {
          setBusy(null);
          if (reply && reply.ok) {
            setKeyDraft('');
            setNotice({ kind: 'ok', text: '密钥已保存到凭证库，搜索即时生效。' });
            applyState(reply.state);
          } else {
            setNotice({ kind: 'err', text: (reply && reply.error) || '保存失败' });
          }
        })
        .catch((error: unknown) => {
          setBusy(null);
          setNotice({ kind: 'err', text: String((error as Error)?.message ?? error) });
        });
    };

    const clearKey = () => {
      if (focused === null) return;
      setBusy('clearing');
      setNotice(null);
      bridge
        .clearKey(focused.provider.credentialRef)
        .then((reply) => {
          setBusy(null);
          if (reply && reply.ok) {
            setNotice({ kind: 'ok', text: '密钥已从凭证库移除。' });
            applyState(reply.state);
          } else {
            setNotice({ kind: 'err', text: (reply && reply.error) || '清除失败' });
          }
        })
        .catch((error: unknown) => {
          setBusy(null);
          setNotice({ kind: 'err', text: String((error as Error)?.message ?? error) });
        });
    };

    const runTest = () => {
      if (focused === null) return;
      const q = query.trim();
      if (q.length === 0) {
        setNotice({ kind: 'err', text: '先输入一个测试查询。' });
        return;
      }
      setBusy('testing');
      setNotice(null);
      setResult(null);
      bridge
        .runTest(focused.provider.id, q)
        .then((value) => {
          setBusy(null);
          setResult(value || { ok: false, error: '无响应' });
        })
        .catch((error: unknown) => {
          setBusy(null);
          setResult({ ok: false, error: String((error as Error)?.message ?? error) });
        });
    };

    const children: ReactNode[] = [];

    // ── 说明 ──
    children.push(
      <p className={styles.intro} key="intro">
        {focused === null
          ? '用 AI 搜索提供方接管模型的 web_search，替换 DeepSeek 官方搜索——官方搜索每次触发都消耗一轮模型调用，第三方搜索更便宜、更快。密钥写入凭证库，保存后立即生效。'
          : '用 ' +
            focused.provider.label +
            ' 接管模型的 web_search，替换 DeepSeek 官方搜索——官方搜索每次触发都消耗一轮模型调用，' +
            focused.provider.label +
            ' 更便宜、更快。密钥写入凭证库，保存后立即生效；下方可查看配额与连接测试。'}
      </p>,
    );
    if (focused !== null && focused.provider.description.length > 0) {
      children.push(<C.Hint key="pdesc" text={focused.provider.description} />);
    }
    if (stateErr) children.push(<C.Notice key="stateErr" kind="err" text={'状态读取失败：' + stateErr} />);
    if (notice) children.push(<C.Notice key="notice" kind={notice.kind} text={notice.text} />);

    // ── 状态 ──
    // 生效判定：插件已注册该提供方（selected）且 patch 固定选型为空或与其一致
    const effective =
      focused !== null &&
      focused.provider.selected &&
      (selectedId === null || selectedId === focused.provider.id);
    const selectedBadge =
      focused === null ? (
        <C.Badge kind="muted" text="读取中…" />
      ) : effective ? (
        <C.Badge kind="ok" text={focused.provider.label + ' · 当前生效'} />
      ) : selectedId !== null ? (
        <C.Badge kind="warn" text={'patch 固定为 ' + selectedId} />
      ) : (
        <C.Badge kind="warn" text="等待接管" />
      );
    const keyBadge =
      focused === null ? (
        <C.Badge kind="muted" text="读取中…" />
      ) : focused.provider.configured ? (
        <C.Badge kind="ok" text={'已配置 · ' + (focused.provider.source || '凭证库')} />
      ) : (
        <C.Badge kind="warn" text="未配置密钥" />
      );
    const statusRows: ReactNode[] = [
      <C.Row label="搜索引擎" desc="接管 web_search 的提供方。" key="engine">
        {selectedBadge}
      </C.Row>,
      <C.Row label="提供方 ID" key="pid">
        <span className={styles.mono}>{focused === null ? '—' : focused.provider.id}</span>
      </C.Row>,
      <C.Row label="API Key" key="key">
        <span className={styles.mono}>{focused === null ? '—' : focused.provider.credentialRef}</span>
      </C.Row>,
      <C.Row label="密钥状态" key="keystate">
        {keyBadge}
      </C.Row>,
      <C.Row label="接管前" key="before">
        <span className={styles.hint}>DeepSeek 官方</span>
      </C.Row>,
    ];
    children.push(
      <div className={styles.section} key="status">
        {statusRows}
      </div>,
    );
    if (info && info.selectionHint) {
      children.push(<C.Hint key="selhint" text={info.selectionHint} />);
    }

    // ── 供应商切换（多个并存时才出现）──
    if (providers.length > 1 && focused !== null) {
      const options = providers.map((p) => ({
        id: p.id,
        label: p.label + (p.selected ? '（当前生效）' : p.configured ? '' : '（未配置密钥）'),
      }));
      const current = providers.find((p) => p.id === providerId) || focused.provider;
      children.push(
        <div className={styles.section} key="switch">
          <div className={styles.sectionHead}>供应商</div>
          <C.Row
            label="生效提供方"
            desc="切换后立即解绑旧提供方并注册新提供方，搜索即时生效（无需重启）；若 profile patch 固定了其他 id，需先删除 web.searchProvider 一行。"
          >
            <C.Select
              disabled={saving}
              value={current.id}
              selectedLabel={current.label}
              options={options}
              onSelect={(id: string) => {
                const picked = providers.find((x) => x.id === id);
                saveConfig(
                  { provider: id },
                  '已切换提供方为 ' + (picked !== undefined ? picked.label : id) + '，注册即时生效',
                );
                bridge
                  .getState()
                  .then((v) => applyState(v))
                  .catch(() => {});
              }}
            />
          </C.Row>
        </div>,
      );
    }

    // ── 密钥配置 ──
    if (focused !== null) {
      const keyInput = (
        <div className={styles.inputWrap}>
          <IconSearchOutlineRegular />
          <input
            className={styles.input}
            type={keyShown ? 'text' : 'password'}
            placeholder={
              '粘贴 ' + focused.provider.label + ' API Key（' + focused.provider.credentialRef + '）'
            }
            value={keyDraft}
            autoComplete="off"
            onChange={(event) => setKeyDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveKey();
            }}
          />
        </div>
      );
      children.push(
        <div className={styles.section} key="creds">
          <div className={styles.sectionHead}>密钥配置</div>
          <div className={styles.bar}>
            {keyInput}
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => setKeyShown(!keyShown)}
            >
              {keyShown ? '隐藏' : '显示'}
            </Button>
            <Button variant="primary" size="sm" disabled={busy !== null} onClick={saveKey}>
              {busy === 'saving' ? '保存中…' : '保存密钥'}
            </Button>
          </div>
          <C.Hint
            key="credhint"
            text="密钥通过 credentials 服务持久化到凭证库（~/.dsh/.credentials.yaml），不会被回显；启动终端里存在同名环境变量时以环境变量为准。"
          />
          <div className={styles.bar} key="clearbar">
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null || !focused.provider.configured}
              onClick={clearKey}
            >
              清除密钥
            </Button>
          </div>
        </div>,
      );
    }

    // ── 搜索行为（通用字段 + 供应商自定义字段）──
    if (focused !== null) {
      const maxOptions: { id: string; label: string }[] = [];
      for (let n = 1; n <= 10; n += 1) maxOptions.push({ id: String(n), label: n + ' 条' });
      const maxValue = String((config && config.maxResults) || 5);
      const behaviorRows: ReactNode[] = [
        <C.Row label="默认结果数" desc="单次调用传 maxResults 时优先用调用方的值。" key="max">
          <C.Select
            disabled={saving || config === null}
            value={maxValue}
            selectedLabel={maxValue + ' 条'}
            options={maxOptions}
            onSelect={(id: string) => saveConfig({ maxResults: Number(id) })}
          />
        </C.Row>,
      ];
      for (const field of focused.provider.fields) {
        behaviorRows.push(fieldControl(C, field, focused, saving || config === null, saveConfig));
      }
      children.push(
        <div className={styles.section} key="behavior">
          <div className={styles.sectionHead}>搜索行为</div>
          {behaviorRows}
          <C.Hint
            key="behint"
            text="持久化到 settings.yaml（dshp-search-provider 命名空间），保存即时生效。"
          />
        </div>,
      );
    }

    // ── 供应商附加区（如 Tavily 用量与配额）──
    if (focused !== null) {
      const Extra = EXTRAS[focused.provider.id];
      if (Extra !== undefined) {
        const extraMeta = extras[focused.provider.id] || {};
        children.push(
          <Extra
            key={'extra-' + focused.provider.id}
            provider={focused.provider}
            usageMeta={(extraMeta['usageMeta'] as Record<string, unknown>) || {}}
          />,
        );
      }
    }

    // ── 连接测试 ──
    if (focused !== null) {
      const testInput = (
        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            placeholder="输入查询，例如：DeepSeek 最新发布"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') runTest();
            }}
          />
        </div>
      );
      children.push(
        <div className={styles.section} key="test">
          <div className={styles.sectionHead}>连接测试</div>
          <div className={styles.bar}>
            {testInput}
            <Button variant="primary" size="sm" disabled={busy !== null} onClick={runTest}>
              {busy === 'testing' ? '搜索中…' : '运行测试'}
            </Button>
          </div>
        </div>,
      );
    }

    if (result !== null) {
      if (result.ok) {
        const items: ReactNode[] = [];
        for (const source of result.sources || []) {
          const meta = [source.url]
            .concat(source.publishedAt ? ['发布于 ' + source.publishedAt] : [])
            .join(' · ');
          items.push(
            <div className={styles.resultItem} key={source.url}>
              <Tooltip label={source.url} side="top">
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title || source.url}
                </a>
              </Tooltip>
              {source.snippet ? <div className={styles.resultSnippet}>{source.snippet}</div> : null}
              <div className={styles.resultMeta}>{meta}</div>
            </div>,
          );
        }
        children.push(
          <div className={styles.section} key="result">
            <div className={styles.sectionHead}>
              {'测试成功 · ' + (result.sources || []).length + ' 条结果 · ' + result.takenMs + ' ms'}
            </div>
            <div className={styles.results}>{items}</div>
          </div>,
        );
      } else {
        children.push(
          <C.Notice
            key="testerr"
            kind="err"
            text={'测试失败' + (result.takenMs ? '（' + result.takenMs + ' ms）' : '') + '：' + result.error}
          />,
        );
      }
    }

    return <div className={styles.page}>{children}</div>;
  };
}

/** 读某供应商分节配置（非法结构按空对象处理） */
function readBlock(config: ConfigSnapshot | null, providerId: string): Record<string, unknown> {
  const raw = config === null ? undefined : config[providerId];
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

/**
 * 按字段元数据渲染一个供应商自定义配置控件（select / number / text）。
 * 新增供应商只需在 host 模块里声明 fields，这里自动跟随。
 */
function fieldControl(
  kit: Components,
  field: ProviderField,
  focused: FocusedView,
  disabled: boolean,
  save: (patch: Record<string, unknown>, okText?: string) => void,
): ReactNode {
  const current = focused.block[field.key];
  const desc = field.hint !== undefined && field.hint.length > 0 ? field.hint : undefined;

  if (field.kind === 'select') {
    const options = field.options || [];
    const first = options[0];
    const hit = options.find((o) => o.value === current);
    const value = hit !== undefined ? hit.value : first !== undefined ? first.value : '';
    const label = hit !== undefined ? hit.label : first !== undefined ? first.label : value;
    return (
      <kit.Row label={field.label} key={'field-' + field.key} {...(desc !== undefined ? { desc } : {})}>
        <kit.Select
          disabled={disabled}
          value={value}
          selectedLabel={label}
          options={options.map((o) => ({ id: o.value, label: o.label }))}
          onSelect={(id: string) => save({ [focused.provider.id]: { [field.key]: id } })}
        />
      </kit.Row>
    );
  }

  const text = typeof current === 'string' || typeof current === 'number' ? String(current) : '';
  const input = (
    <input
      className={styles.input}
      type={field.kind === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder || ''}
      defaultValue={text}
      disabled={disabled}
      onBlur={(event) => {
        const raw = String(event.target.value);
        if (raw === text) return;
        if (field.kind === 'number') {
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          save({ [focused.provider.id]: { [field.key]: n } });
          return;
        }
        save({ [focused.provider.id]: { [field.key]: raw } });
      }}
    />
  );
  return (
    <kit.Row label={field.label} key={'field-' + field.key} {...(desc !== undefined ? { desc } : {})}>
      <div className={styles.inputWrap}>{input}</div>
    </kit.Row>
  );
}
