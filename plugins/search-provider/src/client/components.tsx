/**
 * 设置页小构件：行、下拉、密钥输入、提示、结果列表。
 */
import { useState, type ReactNode } from 'react';
import {
  Button,
  IconChevronDownOutlineRegular,
  IconLoadingOutlineRegular,
  Input,
  Menu,
  Tag,
} from '@deepseek-ai/dsh-client-ui-primitives';
import styles from './styles.module.css';
import type { SearchSource } from './types.js';

export interface RowProps {
  label: string;
  desc?: string | undefined;
  children?: ReactNode;
}

export function Row({ label, desc, children }: RowProps): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {desc ? <div className={styles.rowDesc}>{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps {
  disabled?: boolean | undefined;
  value: string;
  label: string;
  selectedLabel: string;
  options: SelectOption[];
  onSelect: (id: string) => void;
}

export function Select({ disabled, value, label, selectedLabel, options, onSelect }: SelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const anchor = (
    <Button
      variant="outline"
      size="sm"
      className={styles.select}
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
    >
      <span className={styles.selectLabel}>{selectedLabel}</span>
      <IconChevronDownOutlineRegular className={styles.chevron} />
    </Button>
  );
  return (
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      items={options}
      selectedId={value}
      onSelect={(id) => {
        setOpen(false);
        onSelect(id);
      }}
      align="end"
      portal
      anchor={anchor}
    />
  );
}

export interface KeyFieldProps {
  label: string;
  desc: string;
  configured: boolean;
  source?: string | undefined;
  required: boolean;
  draft: string;
  saving: boolean;
  onDraft: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
}

export function KeyField({
  label,
  desc,
  configured,
  source,
  required,
  draft,
  saving,
  onDraft,
  onSave,
  onClear,
}: KeyFieldProps): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        <div className={styles.rowDesc}>{desc}</div>
      </div>
      <div className={styles.keyBox}>
        <div className={styles.keyLine}>
          <Input
            className={styles.keyInput ?? ''}
            type="password"
            value={draft}
            placeholder={configured ? '已配置；输入新 Key 可覆盖' : required ? '粘贴 API Key' : '可选'}
            autoComplete="off"
            spellCheck={false}
            disabled={saving}
            onChange={(event) => onDraft(event.target.value)}
          />
          <Button variant="primary" size="sm" disabled={saving || draft.trim().length === 0} onClick={onSave}>
            保存
          </Button>
          {configured ? (
            <Button variant="outline" size="sm" disabled={saving} onClick={onClear}>
              清除
            </Button>
          ) : null}
        </div>
        <div className={styles.keyMeta}>
          <Tag tone={configured ? 'success' : required ? 'warning' : 'neutral'}>
            {configured ? '已配置' : required ? '未配置' : '可选'}
          </Tag>
          {source ? <span className={styles.muted}>来源：{source}</span> : null}
        </div>
      </div>
    </div>
  );
}

export function Notice({
  kind,
  children,
}: {
  kind: 'error' | 'warning' | 'info';
  children: ReactNode;
}): ReactNode {
  const className = kind === 'error' ? styles.error : kind === 'warning' ? styles.warning : styles.info;
  return (
    <p className={className} role={kind === 'error' ? 'alert' : undefined}>
      {children}
    </p>
  );
}

export function Loading({ text }: { text: string }): ReactNode {
  return (
    <div className={styles.loading}>
      <IconLoadingOutlineRegular />
      <span className={styles.loadingText}>{text}</span>
    </div>
  );
}

export function ResultList({ sources }: { sources: readonly SearchSource[] }): ReactNode {
  if (sources.length === 0) return <p className={styles.hint}>没有返回结果。</p>;
  return (
    <div className={styles.results}>
      {sources.map((source, index) => (
        <div className={styles.result} key={source.url + '#' + String(index)}>
          <a className={styles.resultTitle} href={source.url} target="_blank" rel="noreferrer">
            {source.title || source.url}
          </a>
          <div className={styles.resultUrl}>{source.url}</div>
          {source.snippet ? <p className={styles.resultSnippet}>{source.snippet}</p> : null}
          {source.publishedAt ? <div className={styles.resultMeta}>{source.publishedAt}</div> : null}
        </div>
      ))}
    </div>
  );
}
