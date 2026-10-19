/**
 * McWikiSection（设置 → Minecraft Wiki 搜索）
 * 由原 client.js createSection() 等价改写：元素树、文案、条件分支与 state 更新逻辑逐行对齐。
 *
 * 设置页：查看数据源状态、运行搜索/页面抓取测试，直接看到「转换后的 AI 可读文本」。
 *
 * 组件是**普通函数组件**：`useState` / `useEffect` / `useCallback` 直接从 `react` import，
 * 官方构件从 primitives import（都是 devDependency，只参与类型检查与构建，运行时由 shell 的冻结
 * 模块表注入）。
 *
 * @module @dshp/mcwiki-search/client/McWikiSection
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  CodeBlock,
  IconLoadingOutlineRegular,
  IconSearchOutlineRegular,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import { fetchState, runTest, saveConfig } from './api.js';
import { Badge, cx, Row } from './components.js';
import styles from './styles.module.css';
import type { McWikiConfig, StateResponse, TestResponse } from './types.js';

/** 提示条配色（`notice.kind`）→ 类名（原 `'mw-notice-' + kind` 的映射）。 */
const NOTICE_CLASS: Record<string, string | undefined> = {
  ok: styles.noticeOk,
  err: styles.noticeErr,
};

/**
 * 搜索命中列表（原实现里 `result.ok` 分支内联构建的 `items`）。
 *
 * 不是组件：它只返回一串元素，不在元素树上多出一层。
 *
 * @param value - `runTest` 的搜索应答。
 * @returns 命中卡片列表；一条都没有时是「无结果」提示。
 */
function renderResultItems(value: TestResponse): ReactNode {
  const items: ReactNode[] = [];
  for (const item of value.results ?? []) {
    items.push(
      <div className={styles.resultItem} key={item.url}>
        <Tooltip label={item.url} side="top">
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
        </Tooltip>
        <div className={styles.resultSnippet}>{item.snippet}</div>
        <div className={styles.resultMeta}>
          {item.url + (item.updated ? ' · 更新 ' + String(item.updated).slice(0, 10) : '')}
        </div>
      </div>,
    );
  }
  return items.length > 0 ? items : <span className={styles.hint}>无结果</span>;
}

/** 设置节组件（无 props，由槽位直接渲染）。 */
export function McWikiSection(): ReactNode {
  const [info, setInfo] = useState<StateResponse | null>(null);
  const [cfg, setCfg] = useState<McWikiConfig | null>(null);
  const [cfgBusy, setCfgBusy] = useState<boolean>(false);
  const [stateErr, setStateErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: string; text: string } | null>(null);
  const [busy, setBusy] = useState<'search' | 'page' | null>(null);
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<TestResponse | null>(null);
  const [title, setTitle] = useState<string>('');
  const [pageResult, setPageResult] = useState<TestResponse | null>(null);

  const load = useCallback(() => {
    fetchState()
      .then((value) => {
        if (value && value.ok) {
          setInfo(value);
          setCfg((value && value.config) || null);
          setStateErr(null);
        } else setStateErr((value && value.error) || '无法读取插件状态');
      })
      .catch((error: unknown) => setStateErr(String((error as Error)?.message ?? error)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const saveCfg = (): void => {
    if (cfg === null) return;
    setCfgBusy(true);
    setNotice(null);
    saveConfig(cfg)
      .then((value) => {
        setCfgBusy(false);
        if (value && value.ok) {
          setCfg(value.config ?? null);
          setNotice({ kind: 'ok', text: '配置已保存到 settings.yaml（dshp-mcwiki-search），即时生效。' });
          load();
        } else setNotice({ kind: 'err', text: (value && value.error) || '保存失败' });
      })
      .catch((error: unknown) => {
        setCfgBusy(false);
        setNotice({ kind: 'err', text: String((error as Error)?.message ?? error) });
      });
  };

  const runSearch = (): void => {
    const q = query.trim();
    if (q.length === 0) {
      setNotice({ kind: 'err', text: '先输入一个测试查询。' });
      return;
    }
    setBusy('search');
    setNotice(null);
    setResult(null);
    runTest(q, 'search')
      .then((value) => {
        setBusy(null);
        setResult(value || { ok: false, error: '无响应' });
      })
      .catch((error: unknown) => {
        setBusy(null);
        setResult({ ok: false, error: String((error as Error)?.message ?? error) });
      });
  };

  const runPage = (): void => {
    const t = title.trim();
    if (t.length === 0) {
      setNotice({ kind: 'err', text: '先输入一个页面标题。' });
      return;
    }
    setBusy('page');
    setNotice(null);
    setPageResult(null);
    runTest(t, 'page')
      .then((value) => {
        setBusy(null);
        setPageResult(value || { ok: false, error: '无响应' });
      })
      .catch((error: unknown) => {
        setBusy(null);
        setPageResult({ ok: false, error: String((error as Error)?.message ?? error) });
      });
  };

  /* ── 数据源状态（官方行）：端点写死中文站（api.ts API_BASE），不可配置 ── */
  const siteBadge =
    info === null ? <Badge kind="muted" text="读取中…" /> : <Badge kind="ok" text="中文 Minecraft Wiki" />;

  /* ── 配置（官方行 + Input）── */
  /* 数字行：右侧输入 + 单位后缀，desc 随行 */
  const numInput = (key: keyof McWikiConfig, unit: string | null): ReactNode => (
    <span className={styles.control}>
      <div className={styles.inputWrap} style={{ width: 96 }}>
        <input
          className={styles.input}
          style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
          inputMode="numeric"
          disabled={cfgBusy || cfg === null}
          value={cfg === null ? '' : String(cfg[key])}
          onChange={(event) => {
            const v = event.target.value;
            setCfg((prev) => (prev === null ? prev : { ...prev, [key]: v === '' ? 0 : Number(v) }));
          }}
        />
      </div>
      {unit ? <span className={styles.unit}>{unit}</span> : null}
    </span>
  );

  /* ── 搜索测试 ── */
  const searchInput = (
    <div className={styles.inputWrap}>
      <IconSearchOutlineRegular />
      <input
        className={styles.input}
        placeholder="搜索，例如：钻石 / 苦力怕 / Ancient City"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') runSearch();
        }}
      />
    </div>
  );

  /* ── 页面转换测试 ── */
  const pageInput = (
    <div className={styles.inputWrap}>
      <input
        className={styles.input}
        placeholder="页面标题，例如：苦力怕 / Diamond Ore"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') runPage();
        }}
      />
    </div>
  );

  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        直接从 Minecraft Wiki（MediaWiki API）查询，并把搜索结果 / 页面全文完整转换为 AI
        可直接阅读的干净文本（去模板、去引用、wikitext→Markdown）。模型工具默认完整输出、不截断，所有信息与细节都会保留。可用工具：mcwiki_search、mcwiki_get_page、mcwiki_random。
      </p>

      {stateErr ? <p className={cx(styles.notice, styles.noticeErr)}>{'状态读取失败：' + stateErr}</p> : null}
      {notice ? <p className={cx(styles.notice, NOTICE_CLASS[notice.kind])}>{notice.text}</p> : null}

      <div className={styles.section}>
        <div className={styles.sectionHead}>数据源</div>
        <Row label="数据源" desc="搜索与页面抓取的目标站点。">
          {siteBadge}
        </Row>
        <Row label="密钥" desc="无需注册，公开接口直接调用。">
          <Badge kind="ok" text="免费公开 API" />
        </Row>
        <Row label="模型工具" desc="注册给模型的三个查询工具。">
          <span className={styles.hint}>
            {((info && info.tools) || ['mcwiki_search', 'mcwiki_get_page', 'mcwiki_random']).join('、')}
          </span>
        </Row>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>配置</div>
        <p className={styles.hint} style={{ margin: '2px 0 0' }}>
          持久化到 settings.yaml（dshp-mcwiki-search 命名空间），保存即时生效。数据源固定为中文 Minecraft
          Wiki（不可配置）。
        </p>
        <Row label="请求超时" desc="单次请求的等待上限，≥1000。">
          {numInput('timeoutMs', 'ms')}
        </Row>
        <Row label="搜索默认条数" desc="mcwiki_search 每页返回的条目数，≥1。">
          {numInput('searchMaxResults', '条')}
        </Row>
        <Row label="全文上限" desc="mcwiki_get_page full 输出的字符数；0 表示完整输出不截断。">
          {numInput('maxChars', null)}
        </Row>
        <Row label="引言上限" desc="intro 输出的字符数；0 表示完整输出不截断。">
          {numInput('introMaxChars', null)}
        </Row>
        <div className={styles.barEnd}>
          <Button variant="outline" size="sm" disabled={cfgBusy} onClick={load}>
            重新读取
          </Button>
          <Button variant="primary" size="sm" disabled={cfgBusy || cfg === null} onClick={saveCfg}>
            {cfgBusy ? '保存中…' : '保存配置'}
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>搜索测试</div>
        <p className={styles.hint} style={{ margin: '2px 0 0' }}>
          直接看到「转换后的 AI 可读摘要」——模型拿到的就是这个格式。
        </p>
        <div className={styles.bar} style={{ borderBottom: 'none' }}>
          {searchInput}
          <Button
            variant="primary"
            size="sm"
            disabled={busy !== null}
            onClick={runSearch}
            icon={busy === 'search' ? <IconLoadingOutlineRegular /> : undefined}
          >
            {busy === 'search' ? '搜索中…' : '搜索测试'}
          </Button>
        </div>
      </div>

      {busy === 'search' ? (
        <div className={styles.loading}>
          <IconLoadingOutlineRegular />
          <span className={styles.loadingText}>正在请求 MediaWiki API …</span>
        </div>
      ) : null}
      {result !== null ? (
        result.ok ? (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              {'搜索成功 · 共 ' + (result.totalHits ?? 0) + ' 条 · ' + (result.takenMs ?? 0) + ' ms'}
            </div>
            <div className={styles.results}>{renderResultItems(result)}</div>
          </div>
        ) : (
          <p className={cx(styles.notice, styles.noticeErr)}>
            {'测试失败' + (result.takenMs ? '（' + result.takenMs + ' ms）' : '') + '：' + result.error}
          </p>
        )
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionHead}>页面转换测试</div>
        <p className={styles.hint} style={{ margin: '2px 0 0' }}>
          wikitext → Markdown 预览（最多 6000 字符）；模型工具输出为完整全文。
        </p>
        <div className={styles.bar} style={{ borderBottom: 'none' }}>
          {pageInput}
          <Button
            variant="primary"
            size="sm"
            disabled={busy !== null}
            onClick={runPage}
            icon={busy === 'page' ? <IconLoadingOutlineRegular /> : undefined}
          >
            {busy === 'page' ? '抓取中…' : '页面转换测试'}
          </Button>
        </div>
      </div>

      {busy === 'page' ? (
        <div className={styles.loading}>
          <IconLoadingOutlineRegular />
          <span className={styles.loadingText}>正在抓取并转换页面 …</span>
        </div>
      ) : null}
      {pageResult !== null ? (
        pageResult.ok && pageResult.page ? (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              {pageResult.page.title + '（' + pageResult.page.section + ' · ' + pageResult.page.format + '）'}
            </div>
            <CodeBlock
              code={pageResult.page.text}
              lang="markdown"
              copyLabel="复制"
              copiedLabel="已复制"
              className={styles.codeblock}
            />
            <div className={styles.hint} style={{ marginTop: 6 }}>
              {'来源：' + pageResult.page.url}
            </div>
          </div>
        ) : (
          <p className={cx(styles.notice, styles.noticeErr)}>
            {'页面抓取失败：' + ((pageResult && pageResult.error) || '未知错误')}
          </p>
        )
      ) : null}
    </div>
  );
}
