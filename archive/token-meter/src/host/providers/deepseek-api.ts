/**
 * @dshp/token-meter —— deepseek 官方余额接口（纯通道实现，非独立 provider）
 *
 * 原实现：dsh-token-quota/lib/providers/deepseek-api.js（逐行对齐，仅加 TS 类型）
 *
 * 接口：`GET https://api.deepseek.com/user/balance`
 *   `Authorization: Bearer <apiKey>` → `{ balance_infos, is_available }`。
 * 币种归一：params.currency 优先 → CNY → 首条。
 *
 * 本文件只提供 `fetchOfficialBalance` 纯逻辑，由 deepseek.ts（唯一 provider）
 * 按凭据形态决定是否调用；旧类型 `deepseek-api` 已收敛为 deepseek 的别名。
 */
import { numStr } from './base.js';
import { ProviderError } from '../errors.js';
import { DISPLAY_NAME } from '../../name.js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * 余额币种选择（纯函数，可单测）。
 */
export function pickBalanceInfo(infos: unknown[], prefer: string): Record<string, unknown> | null {
  if (!Array.isArray(infos) || !infos.length) return null;
  if (prefer) {
    const hit = infos.filter((x) => isRecord(x) && x['currency'] === prefer)[0] as
      Record<string, unknown> | undefined;
    if (hit) return hit;
  }
  const cny = infos.filter((x) => isRecord(x) && x['currency'] === 'CNY')[0] as
    Record<string, unknown> | undefined;
  if (cny) return cny;
  return infos[0] as Record<string, unknown>;
}

function curSym(cur: string): string {
  if (cur === 'CNY') return '¥';
  if (cur === 'USD') return '$';
  return '';
}

/**
 * 官方余额拉取（纯逻辑，可单测；secretKind 由调用方附）。
 */
export async function fetchOfficialBalance(
  params: Record<string, unknown>,
  secret: string,
  fetchImpl: typeof fetch,
): Promise<{ billingKind: 'payg'; billing: Record<string, unknown>; extra: Record<string, unknown> | null }> {
  const url = 'https://api.deepseek.com/user/balance';
  const res = await fetchImpl(url, { headers: { Authorization: 'Bearer ' + secret }, cache: 'no-store' });
  const code = res.status;
  const body = await res.text();
  if (code === 401)
    throw new ProviderError('auth', 'DeepSeek 密钥无效(401)：' + body.slice(0, 100), {
      status: code,
      hint: '官方余额接口拒绝了这个 apiKey（应 sk- 开头）。请确认它来自 open platform 且未被删除。',
      action: '设置 → ' + DISPLAY_NAME + ' → 该供应商 →「编辑」apiKey',
    });
  if (code === 402)
    throw new ProviderError('balance', 'DeepSeek 余额不足(402)：' + body.slice(0, 100), { status: code });
  if (code === 429)
    throw new ProviderError('rate', 'DeepSeek 限流(429)：' + body.slice(0, 100), { status: code });
  if (code >= 500)
    throw new ProviderError('server', 'DeepSeek 服务端错误(' + code + ')：' + body.slice(0, 100), {
      status: code,
    });
  if (code !== 200)
    throw new ProviderError('unknown', 'DeepSeek 接口 HTTP ' + code + '：' + body.slice(0, 100), {
      status: code,
    });
  let j: unknown = null;
  try {
    j = JSON.parse(body) as unknown;
  } catch {
    throw new ProviderError('parse', '余额接口返回非 JSON(' + body.length + 'B)：' + body.slice(0, 80));
  }
  const jr = (j ?? {}) as Record<string, unknown>;
  if (jr && jr['error']) {
    const em = isRecord(jr['error']) ? String(jr['error']['message'] ?? '') : '';
    throw new ProviderError('unknown', '余额接口报错：' + (em || body.slice(0, 80)));
  }
  let infos = jr && Array.isArray(jr['balance_infos']) ? (jr['balance_infos'] as unknown[]) : null;
  const isAvail = jr && jr['is_available'] !== undefined ? !!jr['is_available'] : null;
  if (!infos && jr && jr['total_balance'] !== undefined) {
    infos = [
      {
        currency: (jr['currency'] as string) || 'CNY',
        total_balance: jr['total_balance'],
        granted_balance: jr['granted_balance'],
        topped_up_balance: jr['topped_up_balance'],
      },
    ];
  }
  if (!infos)
    throw new ProviderError('parse', '余额接口字段缺失（无 balance_infos）：' + String(body).slice(0, 100));
  const prefer = (params && (params['currency'] as string)) || '';
  const primary = pickBalanceInfo(infos, prefer);
  if (!primary) throw new ProviderError('parse', '余额为空（balance_infos 里没有可用条目）');
  const normInfos = infos.map((x) => {
    const xr = (x ?? {}) as Record<string, unknown>;
    return {
      currency: String(xr['currency'] || ''),
      total: numStr(xr['total_balance']),
      granted:
        xr['granted_balance'] !== undefined && xr['granted_balance'] !== null && xr['granted_balance'] !== ''
          ? numStr(xr['granted_balance'])
          : null,
      toppedUp:
        xr['topped_up_balance'] !== undefined &&
        xr['topped_up_balance'] !== null &&
        xr['topped_up_balance'] !== ''
          ? numStr(xr['topped_up_balance'])
          : null,
    };
  });
  const g =
    primary['granted_balance'] !== undefined &&
    primary['granted_balance'] !== null &&
    primary['granted_balance'] !== ''
      ? numStr(primary['granted_balance'])
      : null;
  const t =
    primary['topped_up_balance'] !== undefined &&
    primary['topped_up_balance'] !== null &&
    primary['topped_up_balance'] !== ''
      ? numStr(primary['topped_up_balance'])
      : null;
  const currency = String(primary['currency'] || 'CNY');
  const balance = numStr(primary['total_balance']);
  // 总额度块：赠送 + 充值 = 总量，已用 = 总量 - 余额
  let extra: Record<string, unknown> | null = null;
  const totalQuota = (g !== null ? g : 0) + (t !== null ? t : 0);
  if (totalQuota > 0) {
    const used = Math.max(0, totalQuota - balance);
    const r2 = (n: number): number => Math.round(Number(n) * 100) / 100;
    extra = {
      blocks: [
        {
          kind: 'progress',
          label: '总额度消耗',
          used: r2(used),
          total: r2(totalQuota),
          left: '剩余 ' + curSym(currency) + balance.toFixed(2),
        },
      ],
    };
  }
  return {
    billingKind: 'payg',
    billing: {
      balance,
      currency,
      granted: g,
      toppedUp: t,
      isAvailable: isAvail,
      infos: normInfos,
      lowWarn: params['lowWarn'] !== undefined && params['lowWarn'] !== '' ? Number(params['lowWarn']) : null,
      plan: 'DeepSeek API',
    },
    extra,
  };
}
