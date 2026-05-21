export type DateRange = 'Today' | 'This Week' | 'This Month' | 'This Quarter' | 'Custom';
export type Platform = 'Meta' | 'Google' | 'Amazon Ads' | 'Flipkart PLA' | 'Myntra Ads';
export type CampaignType = 'Performance' | 'Branding' | 'Retargeting' | 'Brand search';
export type CampaignStatus = 'Active' | 'Paused' | 'Archived';
export type CampaignAction = 'pause' | 'review' | 'hold' | 'scale';

export interface CampaignRow {
  id: string;
  platform: Platform;
  name: string;
  spendLakhs: number;
  gmv: string;
  netSales: string;
  margin: string;
  marginNum: number;
  poas: number;
  wow: number;
  action: CampaignAction;
  campaignType: CampaignType;
  status: CampaignStatus;
  sparkline: number[];
  detail: {
    audience: string;
    dailySpend: string;
    suggestions: string[];
  };
}

export interface SpendBucket {
  id: string;
  label: string;
  currentLakhs: number;
  maxLakhs: number;
  poasCoeff: number;
}

export interface CacChannelRow {
  channel: string;
  newCustomers: number;
  adSpend: string;
  cac: string;
  cacNum: number;
  ltv: string;
  ltvCac: number;
  tooltip: string;
}

export const DATE_RANGES: DateRange[] = ['Today', 'This Week', 'This Month', 'This Quarter', 'Custom'];

export const PLATFORMS: Platform[] = ['Meta', 'Google', 'Amazon Ads', 'Flipkart PLA', 'Myntra Ads'];

export const DATE_SCALE: Record<DateRange, number> = {
  Today: 0.035,
  'This Week': 0.24,
  'This Month': 1,
  'This Quarter': 2.85,
  Custom: 1,
};

export const SPEND_BUCKETS: SpendBucket[] = [
  { id: 'meta-perf', label: 'Meta — Performance', currentLakhs: 8.2, maxLakhs: 12, poasCoeff: 1.1 },
  { id: 'meta-brand', label: 'Meta — Branding', currentLakhs: 1.4, maxLakhs: 5, poasCoeff: 0.9 },
  { id: 'google-brand', label: 'Google — Brand search', currentLakhs: 1.8, maxLakhs: 6, poasCoeff: 2.3 },
  { id: 'google-gen', label: 'Google — Generic + competitor', currentLakhs: 1.4, maxLakhs: 5, poasCoeff: 1.4 },
  { id: 'amazon', label: 'Amazon Ads', currentLakhs: 1.3, maxLakhs: 5, poasCoeff: 1.4 },
  { id: 'flipkart', label: 'Flipkart PLA', currentLakhs: 3.1, maxLakhs: 6, poasCoeff: 1.2 },
  { id: 'myntra', label: 'Myntra Ads', currentLakhs: 0.4, maxLakhs: 3, poasCoeff: 0.6 },
];

export const RECOMMENDED_SLIDER_VALUES: Record<string, number> = {
  'meta-perf': 5.2,
  'meta-brand': 1.4,
  'google-brand': 3.0,
  'google-gen': 1.4,
  amazon: 2.5,
  flipkart: 3.1,
  myntra: 0.4,
};

const BASE_CAMPAIGNS: CampaignRow[] = [
  { id: 'c1', platform: 'Meta', name: 'Myntra Sale Push', spendLakhs: 4.2, gmv: '₹16.1 L', netSales: '₹9.8 L', margin: '−₹87 K', marginNum: -87000, poas: 0.79, wow: -0.18, action: 'pause', campaignType: 'Performance', status: 'Active', sparkline: [1.05, 0.98, 0.92, 0.79], detail: { audience: 'Broad interest — skincare 18–34', dailySpend: '₹14,200/day', suggestions: ['Pause immediately — negative margin', 'Reallocate to Google Brand Search'] } },
  { id: 'c2', platform: 'Meta', name: 'Retargeting cart abandoners', spendLakhs: 1.2, gmv: '₹3.8 L', netSales: '₹2.4 L', margin: '−₹14 K', marginNum: -14000, poas: 0.88, wow: -0.12, action: 'review', campaignType: 'Retargeting', status: 'Active', sparkline: [1.02, 0.95, 0.91, 0.88], detail: { audience: 'Cart abandoners 7-day window', dailySpend: '₹4,100/day', suggestions: ['Tighten audience to 3-day window', 'Test creative with urgency copy'] } },
  { id: 'c3', platform: 'Amazon Ads', name: 'Sun Protection Push', spendLakhs: 1.8, gmv: '₹4.2 L', netSales: '₹2.8 L', margin: '+₹3 K', marginNum: 3000, poas: 1.02, wow: -0.04, action: 'hold', campaignType: 'Performance', status: 'Active', sparkline: [1.08, 1.05, 1.03, 1.02], detail: { audience: 'SP — sun care category', dailySpend: '₹6,200/day', suggestions: ['Hold spend until monsoon season ends'] } },
  { id: 'c4', platform: 'Meta', name: "Mother's Day", spendLakhs: 2.4, gmv: '₹6.8 L', netSales: '₹4.2 L', margin: '+₹38 K', marginNum: 38000, poas: 1.16, wow: -0.08, action: 'hold', campaignType: 'Branding', status: 'Active', sparkline: [1.28, 1.22, 1.18, 1.16], detail: { audience: 'Gift buyers — women 25–45', dailySpend: '₹8,400/day', suggestions: ['Wind down after event — seasonal'] } },
  { id: 'c5', platform: 'Flipkart PLA', name: 'Skincare Hero', spendLakhs: 3.1, gmv: '₹11.4 L', netSales: '₹7.2 L', margin: '+₹60 K', marginNum: 60000, poas: 1.19, wow: 0.04, action: 'hold', campaignType: 'Performance', status: 'Active', sparkline: [1.12, 1.14, 1.17, 1.19], detail: { audience: 'PLA — hero SKUs', dailySpend: '₹10,800/day', suggestions: ['Maintain current bid strategy'] } },
  { id: 'c6', platform: 'Meta', name: 'Lookalike — new customers', spendLakhs: 2.1, gmv: '₹7.4 L', netSales: '₹4.9 L', margin: '+₹52 K', marginNum: 52000, poas: 1.25, wow: -0.02, action: 'hold', campaignType: 'Performance', status: 'Active', sparkline: [1.28, 1.26, 1.24, 1.25], detail: { audience: '1% lookalike — purchasers', dailySpend: '₹7,200/day', suggestions: ['Refresh lookalike seed monthly'] } },
  { id: 'c7', platform: 'Google', name: 'Generic skincare KW', spendLakhs: 0.9, gmv: '₹3.2 L', netSales: '₹2.1 L', margin: '+₹40 K', marginNum: 40000, poas: 1.44, wow: 0.08, action: 'scale', campaignType: 'Performance', status: 'Active', sparkline: [1.28, 1.32, 1.38, 1.44], detail: { audience: 'Generic skincare keywords', dailySpend: '₹3,100/day', suggestions: ['Increase budget 25% — strong marginal PoAS'] } },
  { id: 'c8', platform: 'Amazon Ads', name: 'Brand Story (V2)', spendLakhs: 0.6, gmv: '₹2.4 L', netSales: '₹1.6 L', margin: '+₹28 K', marginNum: 28000, poas: 1.47, wow: 0.06, action: 'scale', campaignType: 'Branding', status: 'Active', sparkline: [1.35, 1.40, 1.44, 1.47], detail: { audience: 'Brand store visitors', dailySpend: '₹2,100/day', suggestions: ['Scale brand story ads on Amazon'] } },
  { id: 'c9', platform: 'Google', name: 'Competitor terms', spendLakhs: 0.5, gmv: '₹1.8 L', netSales: '₹1.2 L', margin: '+₹26 K', marginNum: 26000, poas: 1.52, wow: 0.04, action: 'scale', campaignType: 'Performance', status: 'Active', sparkline: [1.42, 1.46, 1.50, 1.52], detail: { audience: 'Competitor brand terms', dailySpend: '₹1,800/day', suggestions: ['Monitor CPC inflation weekly'] } },
  { id: 'c10', platform: 'Google', name: 'Brand Search', spendLakhs: 1.8, gmv: '₹14.2 L', netSales: '₹11.6 L', margin: '+₹2.4 L', marginNum: 240000, poas: 2.33, wow: 0.18, action: 'scale', campaignType: 'Brand search', status: 'Active', sparkline: [1.95, 2.08, 2.18, 2.33], detail: { audience: 'Brand search — Native Glow', dailySpend: '₹6,400/day', suggestions: ['Scale to ₹3.0 L — highest PoAS in portfolio', 'Protect brand terms from competitors'] } },
];

const POAS_WEEKLY = [
  { week: 'W-7', poas: 1.18, spend: 14.2 },
  { week: 'W-6', poas: 1.21, spend: 14.8 },
  { week: 'W-5', poas: 1.15, spend: 15.1 },
  { week: 'W-4', poas: 1.08, spend: 15.4 },
  { week: 'W-3', poas: 1.12, spend: 15.2 },
  { week: 'W-2', poas: 1.19, spend: 15.5 },
  { week: 'W-1', poas: 1.22, spend: 15.6 },
  { week: 'W-0', poas: 1.24, spend: 15.6 },
];

const CAC_ROWS: CacChannelRow[] = [
  { channel: 'Meta', newCustomers: 1847, adSpend: '₹11.0 L', cac: '₹596', cacNum: 596, ltv: '₹1,720', ltvCac: 2.9, tooltip: 'CAC = Meta ad spend ÷ new customers attributed via 7-day click + view-through.' },
  { channel: 'Google', newCustomers: 612, adSpend: '₹2.7 L', cac: '₹441', cacNum: 441, ltv: '₹2,210', ltvCac: 5.0, tooltip: 'CAC = Google Ads spend ÷ new customers from last-click attribution.' },
  { channel: 'Amazon PLA', newCustomers: 348, adSpend: '₹1.8 L', cac: '₹517', cacNum: 517, ltv: '₹1,890', ltvCac: 3.7, tooltip: 'CAC = Amazon Sponsored Products spend ÷ new-to-brand orders.' },
  { channel: 'Flipkart PLA', newCustomers: 421, adSpend: '₹3.1 L', cac: '₹736', cacNum: 736, ltv: '₹1,420', ltvCac: 1.9, tooltip: 'CAC = Flipkart PLA spend ÷ new customers — includes high return rate.' },
  { channel: 'Organic', newCustomers: 1128, adSpend: '₹0', cac: '₹0', cacNum: 0, ltv: '₹2,310', ltvCac: Infinity, tooltip: 'Organic — no paid acquisition cost.' },
];

export function formatLakhs(n: number): string {
  if (Math.abs(n) < 0.01) return '₹0';
  const sign = n < 0 ? '−' : '';
  const v = Math.abs(n);
  if (v >= 1) return `${sign}₹${v.toFixed(1)} L`;
  return `${sign}₹${Math.round(v * 100)} K`;
}

export function formatDeltaLakhs(current: number, baseline: number): string {
  const d = current - baseline;
  if (Math.abs(d) < 0.05) return '—';
  const sign = d > 0 ? '+' : '−';
  return `${sign}₹${Math.abs(d).toFixed(1)} L`;
}

export function poasColor(poas: number): string {
  if (poas < 1) return 'text-error';
  if (poas <= 1.5) return 'text-warning';
  return 'text-success';
}

export function ltvCacColor(ratio: number): string {
  if (!Number.isFinite(ratio)) return 'text-success';
  if (ratio < 2) return 'text-error';
  if (ratio <= 3) return 'text-warning';
  return 'text-success';
}

export function getMarketingDataset(dateRange: DateRange) {
  const scale = DATE_SCALE[dateRange];
  const totalSpend = 15.6 * scale;
  const netRevenue = 65.5 * scale;
  const netMargin = 19.3 * scale;

  return {
    totalAdSpend: formatLakhs(totalSpend),
    totalAdSpendMoM: 12,
    mer: 4.2,
    poas: 1.24,
    perfBrandingSplit: '78 / 22%',
    poasWeekly: POAS_WEEKLY.map((w) => ({ ...w, spend: w.spend * scale })),
    campaigns: BASE_CAMPAIGNS.map((c) => ({
      ...c,
      spendLakhs: c.spendLakhs * scale,
    })),
    baselineMarginLakhs: 19.3 * scale,
    baselineMer: 4.2,
    baselinePoas: 1.24,
    netRevenueLakhs: netRevenue,
    cacBlended: Math.round(520 * (1 - 0.05 * (1 - scale))),
    ltv90: Math.round(1890 * (1 + 0.08 * (scale - 1))),
    ltvCacRatio: 3.6,
    paybackMonths: 4.2,
    cacRows: CAC_ROWS,
    newRepeat: { newPct: 38, repeatPct: 62 },
    underinvested: [
      { platform: 'Amazon Sponsored Products', current: '₹1.3 L', marginal: '2.1×', add: '₹2 L', marginGain: '+₹2.2 L', bucketId: 'amazon', addLakhs: 2 },
      { platform: 'Google Brand Search', current: '₹1.8 L', marginal: '1.9×', add: '₹1.5 L', marginGain: '+₹1.4 L', bucketId: 'google-brand', addLakhs: 1.5 },
    ],
  };
}

export function computeProjection(
  sliderValues: Record<string, number>,
  buckets: SpendBucket[],
  baseline: { marginLakhs: number; mer: number; poas: number }
) {
  const totalSpend = Object.values(sliderValues).reduce((a, b) => a + b, 0);
  let marginContribution = 0;
  buckets.forEach((b) => {
    const spend = sliderValues[b.id] ?? b.currentLakhs;
    marginContribution += spend * b.poasCoeff * 100000;
  });
  const marginLakhs = marginContribution / 100000;
  const netRevenueLakhs = 65.5;
  const mer = totalSpend > 0 ? netRevenueLakhs / totalSpend : 0;
  const poas = totalSpend > 0 ? marginLakhs / totalSpend : 0;
  const gmvImpact = (baseline.marginLakhs - marginLakhs) * 0.15;

  return {
    totalSpend: formatLakhs(totalSpend),
    marginLakhs: formatLakhs(marginLakhs),
    mer: mer.toFixed(1),
    poas: poas.toFixed(2),
    gmvImpact: gmvImpact <= 0 ? `+${formatLakhs(Math.abs(gmvImpact))} margin` : `−${formatLakhs(gmvImpact)} GMV (acceptable)`,
  };
}

export function getInitialSliderValues(): Record<string, number> {
  const out: Record<string, number> = {};
  SPEND_BUCKETS.forEach((b) => {
    out[b.id] = b.currentLakhs;
  });
  return out;
}
