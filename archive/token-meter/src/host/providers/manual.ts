/**
 * @dshp/token-meter —— manual 适配器（本地数字，无网络）
 *
 * 原实现：dsh-token-quota/lib/providers/manual.js（逐行对齐，仅加 TS 类型）
 *
 * 两种计费形态（params.billing）：
 *  - rolling：填 total/used → 单窗口进度条；
 *  - payg：填 balance/granted/lowWarn → 余额卡。
 * 无密钥字段（secretField: ''），fetch 为纯本地计算，永不抛错
 * （数字非法一律归一为 0，保证侧边栏永不因手填而崩）。
 */
import type { ProviderAdapter, Vendor } from '../types.js';

const manual: ProviderAdapter = {
  type: 'manual',
  icon: 'manual',
  label: '手动',
  title: 'manual（手动）',
  secretField: '',
  hint: '本地账本，无需拉取：rolling 填 total/used；payg 填 balance/granted/lowWarn。',
  fields: [
    {
      key: 'billing',
      label: '计费形态',
      kind: 'select',
      options: [
        { value: 'rolling', label: '滚动刷新' },
        { value: 'payg', label: '按量付费' },
      ],
      hint: 'rolling=周期滚动的订阅额度（填总额/已用）；payg=用多少扣多少的余额（填余额/预警线）。',
    },
    {
      key: 'total',
      label: '总额度',
      kind: 'number',
      placeholder: '如：1000',
      showWhen: { key: 'billing', eq: 'rolling' },
      hint: '周期内可用总额度（如包月 1000 次）。',
    },
    {
      key: 'used',
      label: '已用',
      kind: 'number',
      placeholder: '如：100',
      showWhen: { key: 'billing', eq: 'rolling' },
      hint: '本周期已消耗量，手动更新。',
    },
    {
      key: 'balance',
      label: '余额',
      kind: 'number',
      placeholder: '如：50',
      showWhen: { key: 'billing', eq: 'payg' },
      hint: '当前剩余可扣金额，手动更新。',
    },
    {
      key: 'granted',
      label: '总额度',
      kind: 'number',
      placeholder: '如：100',
      showWhen: { key: 'billing', eq: 'payg' },
      hint: '累计充值/获赠总额（仅展示用，可不填）。',
    },
    {
      key: 'lowWarn',
      label: '预警线',
      kind: 'number',
      placeholder: '如：10',
      showWhen: { key: 'billing', eq: 'payg' },
      hint: '余额低于此值时侧边栏黄色提醒。',
    },
  ],

  sanitizeParams(raw: unknown): Record<string, unknown> {
    const src =
      raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src)) {
      if (src[k] !== undefined) out[k] = src[k];
    }
    return out;
  },

  validateParams(): string {
    return '';
  },

  async fetch(vendor: Vendor) {
    const p = (vendor && vendor.params) || {};
    if ((p['billing'] || 'rolling') === 'payg') {
      return {
        billingKind: 'payg' as const,
        billing: {
          balance: Number(p['balance']) || 0,
          currency: 'CNY',
          granted:
            p['granted'] !== undefined && p['granted'] !== '' && p['granted'] !== null
              ? Number(p['granted'])
              : null,
          toppedUp: null,
          isAvailable: null,
          infos: [],
          lowWarn:
            p['lowWarn'] !== undefined && p['lowWarn'] !== '' && p['lowWarn'] !== null
              ? Number(p['lowWarn'])
              : null,
          plan: vendor.name,
        },
      };
    }
    const total = Number(p['total']) || 0;
    const used = Number(p['used']) || 0;
    const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    return {
      billingKind: 'rolling' as const,
      windows: [{ key: 'w', label: '额度', pct, used, limit: total, resetInSec: 0 }],
      billing: {},
    };
  },
};

export default manual;
