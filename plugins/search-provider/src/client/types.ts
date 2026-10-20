/**
 * Client 协议与 cordis 接缝。
 */
import type { ReactNode } from 'react';

export interface ProviderFieldOption {
  value: string;
  label: string;
}

export interface ProviderField {
  key: string;
  label: string;
  kind: 'select' | 'text' | 'number';
  options?: readonly ProviderFieldOption[];
  hint?: string;
  placeholder?: string;
}

export interface ProviderState {
  id: string;
  label: string;
  title: string;
  credentialRef: string;
  credentialRequired: boolean;
  homepage: string;
  description: string;
  freeNote: string;
  fields: readonly ProviderField[];
  configured: boolean;
  source?: string;
}

export interface SearchSource {
  url: string;
  title?: string;
  snippet?: string;
  publishedAt?: string;
}

export interface ConfigSnapshot {
  provider: string;
  maxResults: number;
  [providerId: string]: unknown;
}

export interface StateResponse {
  ok: boolean;
  namespace?: string;
  hubProviderId?: string;
  selectedProviderId?: string | null;
  webSearchConfigured?: boolean;
  providers?: ProviderState[];
  config?: ConfigSnapshot;
  selectionHint?: string;
  error?: string;
}

export interface SaveResponse {
  ok: boolean;
  config?: ConfigSnapshot;
  error?: string;
}

export interface TestResponse {
  ok: boolean;
  provider?: string;
  sources?: SearchSource[];
  content?: string;
  error?: string;
  takenMs?: number;
}

export interface CredentialReply {
  ok: boolean;
  error?: string;
  state?: StateResponse;
}

export interface ClientContext {
  get(name: string): unknown;
  effect(callback: () => unknown, label?: string): unknown;
}

export interface SlotsService {
  inject(name: string, fn: () => unknown): unknown;
  register(spec: SlotRegistrationSpec, component: (props: never) => ReactNode): unknown;
}

export interface SlotRegistrationSpec {
  name: string;
  id: string;
  order?: number | undefined;
  label?: string | undefined;
}

export interface RemoteCredentials {
  set(ref: string, value: string): Promise<{ ok: boolean; error?: { message?: string } }>;
  unset(ref: string): Promise<{ ok: boolean; error?: { message?: string } }>;
}

export interface RemoteLike {
  credentials?: RemoteCredentials;
}

export const ROUTE_BASE = '/ext/dshp-search-provider';
