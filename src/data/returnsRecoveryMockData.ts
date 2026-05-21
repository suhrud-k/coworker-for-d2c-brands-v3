export type DateRange = 'Today' | 'This Week' | 'This Month' | 'This Quarter' | 'Custom';
export type ReturnsChannel = 'shopify' | 'amazon' | 'flipkart' | 'myntra' | 'meesho';
export type ReturnsChannelFilter = ReturnsChannel | 'all';
export type ClaimStage = 'eligible' | 'filed' | 'approved' | 'received';

export const DATE_RANGE_SCALE: Record<DateRange, number> = {
  Today: 0.035,
  'This Week': 0.24,
  'This Month': 1,
  'This Quarter': 2.85,
  Custom: 1,
};

export const CHANNEL_META: Record<ReturnsChannel, { label: string; colorClass: string }> = {
  shopify: { label: 'Shopify', colorClass: 'bg-shopify' },
  amazon: { label: 'Amazon', colorClass: 'bg-amazon' },
  flipkart: { label: 'Flipkart', colorClass: 'bg-flipkart' },
  myntra: { label: 'Myntra', colorClass: 'bg-myntra' },
  meesho: { label: 'Meesho', colorClass: 'bg-meesho' },
};

export interface CostBreakdownRow {
  id: string;
  component: string;
  thisMonth: string;
  pctOfLeak: number;
  lastMonth: string;
  trend: number;
  tooltip: string;
  borderClass: string;
}

export interface ChannelReturnRow {
  channel: ReturnsChannel;
  returnsCount: number;
  returnRate: number;
  lastMonthRate: number;
  wowPts: number;
}

export interface ClaimItem {
  id: string;
  channel: ReturnsChannel;
  amount: number;
  amountLabel: string;
  daysInStage: number;
  stage: ClaimStage;
  orderId: string;
  returnReason: string;
  filedDate?: string;
  expectedPayout?: string;
}

export interface AtRiskClaim {
  id: string;
  channel: ReturnsChannel;
  amount: string;
  aging: string;
  windowCloses: string;
  daysLeft: number;
  action: 'file' | 'review';
}

export interface RejectedClaim {
  id: string;
  channel: ReturnsChannel;
  amount: string;
  reason: string;
}

export interface ReturnReason {
  reason: string;
  pct: number;
  volume: number;
  value: string;
  color: string;
}

export interface SkuReturnRow {
  rank: number;
  sku: string;
  category: string;
  channel: ReturnsChannel;
  returnRate: number;
  lostInr: string;
  suggestions: string[];
  reasonBreakdown: { reason: string; pct: number }[];
}

export interface HeatmapRow {
  channel: ReturnsChannel;
  cells: number[];
}

export interface DisputableCharge {
  id: string;
  orderId: string;
  channel: ReturnsChannel;
  type: string;
  charged: string;
  rateCard: string;
  overcharge: string;
  overchargeNum: number;
}

export interface ReturnsDataset {
  topKpis: {
    costOfReturns: string;
    costSub: string;
    recoveryRate: number;
    recoverySub: string;
    atRisk: string;
    atRiskSub: string;
    returnsRate: number;
    returnsRateSub: string;
    returnsRateWow: number;
  };
  costBreakdown: CostBreakdownRow[];
  channelReturns: ChannelReturnRow[];
  pipelineTotals: Record<ClaimStage, { count: number; amount: string }>;
  claims: ClaimItem[];
  atRisk: AtRiskClaim[];
  rejected: RejectedClaim[];
  rejectedSummary: string;
  reasons: ReturnReason[];
  skus: SkuReturnRow[];
  heatmap: HeatmapRow;
  heatmapReasons: string[];
  heatmapMeta: { channel: ReturnsChannel; reason: string; count: number; value: string }[];
  disputable: DisputableCharge[];
  disputableTotal: string;
}

const HEATMAP_REASONS = ['Size', 'Quality', 'Wrong', "Didn't like", 'Damaged', 'Other'];

const BASE_COST: CostBreakdownRow[] = [
  { id: 'rev-ship', component: 'Reverse shipping fees', thisMonth: '₹2.84 L', pctOfLeak: 33.7, lastMonth: '₹2.41 L', trend: 17.8, tooltip: 'Reverse shipping fee = what the marketplace charged you to ship the item back from the customer.', borderClass: 'border-l-error' },
  { id: 'lost-inv', component: 'Lost or damaged inventory', thisMonth: '₹3.12 L', pctOfLeak: 37.1, lastMonth: '₹2.68 L', trend: 16.4, tooltip: 'Inventory written off when returns arrive damaged or never resellable.', borderClass: 'border-l-warning' },
  { id: 'comm', component: 'Commission/charges retained', thisMonth: '₹1.48 L', pctOfLeak: 17.6, lastMonth: '₹1.21 L', trend: 22.3, tooltip: 'Marketplace fees not reversed when an order is returned.', borderClass: 'border-l-primary' },
  { id: 'ads', component: 'Ad spend wasted on returned orders', thisMonth: '₹0.98 L', pctOfLeak: 11.6, lastMonth: '₹0.80 L', trend: 22.5, tooltip: 'Attributed ad spend on orders that were later returned.', borderClass: 'border-l-purple-tint' },
  { id: 'total', component: 'Total', thisMonth: '₹8.42 L', pctOfLeak: 100, lastMonth: '₹7.10 L', trend: 18.6, tooltip: 'Total cost of returns this month.', borderClass: 'border-l-error' },
];

const BASE_CHANNELS: ChannelReturnRow[] = [
  { channel: 'myntra', returnsCount: 786, returnRate: 36.4, lastMonthRate: 28.1, wowPts: 8.3 },
  { channel: 'flipkart', returnsCount: 1114, returnRate: 27.1, lastMonthRate: 26.5, wowPts: 0.6 },
  { channel: 'meesho', returnsCount: 452, returnRate: 24.5, lastMonthRate: 23.8, wowPts: 0.7 },
  { channel: 'amazon', returnsCount: 1193, returnRate: 22.8, lastMonthRate: 21.5, wowPts: 1.3 },
  { channel: 'shopify', returnsCount: 700, returnRate: 18.2, lastMonthRate: 22.4, wowPts: -4.2 },
];

const BASE_CLAIMS: ClaimItem[] = [
  { id: 'FK-CLM-88412', channel: 'flipkart', amount: 84200, amountLabel: '₹84,200', daysInStage: 4, stage: 'eligible', orderId: 'FK-ORD-99281', returnReason: 'Commission overcharge on apparel < ₹500' },
  { id: 'FK-CLM-88719', channel: 'flipkart', amount: 62180, amountLabel: '₹62,180', daysInStage: 6, stage: 'eligible', orderId: 'FK-ORD-99402', returnReason: 'Reverse shipping not reversed' },
  { id: 'AMZ-RC-29981', channel: 'amazon', amount: 54700, amountLabel: '₹54,700', daysInStage: 3, stage: 'eligible', orderId: 'AMZ-ORD-44102', returnReason: 'Referral fee retained on return' },
  { id: 'MYN-CR-11248', channel: 'myntra', amount: 47900, amountLabel: '₹47,900', daysInStage: 8, stage: 'eligible', orderId: 'MYN-ORD-22841', returnReason: 'Size issue — pick-and-pack on return' },
  { id: 'FK-CLM-89001', channel: 'flipkart', amount: 38400, amountLabel: '₹38,400', daysInStage: 12, stage: 'filed', orderId: 'FK-ORD-99511', returnReason: 'Fixed fee not reversed', filedDate: 'May 12, 2026', expectedPayout: 'Jun 2, 2026' },
  { id: 'AMZ-RC-30102', channel: 'amazon', amount: 42800, amountLabel: '₹42,800', daysInStage: 9, stage: 'filed', orderId: 'AMZ-ORD-44218', returnReason: 'TCS not credited on refund', filedDate: 'May 14, 2026', expectedPayout: 'Jun 4, 2026' },
  { id: 'SHP-CLM-102', channel: 'shopify', amount: 22400, amountLabel: '₹22,400', daysInStage: 5, stage: 'filed', orderId: 'SHP-ORD-8812', returnReason: 'PG fee on refunded order', filedDate: 'May 16, 2026', expectedPayout: 'May 28, 2026' },
  { id: 'MYN-CR-11290', channel: 'myntra', amount: 31200, amountLabel: '₹31,200', daysInStage: 14, stage: 'approved', orderId: 'MYN-ORD-22990', returnReason: 'Quality issue claim', filedDate: 'Apr 28, 2026', expectedPayout: 'May 20, 2026' },
  { id: 'FK-CLM-89102', channel: 'flipkart', amount: 51800, amountLabel: '₹51,800', daysInStage: 11, stage: 'approved', orderId: 'FK-ORD-99602', returnReason: 'Commission rate-card variance', filedDate: 'May 2, 2026', expectedPayout: 'May 22, 2026' },
  { id: 'AMZ-RC-30244', channel: 'amazon', amount: 28400, amountLabel: '₹28,400', daysInStage: 18, stage: 'received', orderId: 'AMZ-ORD-44301', returnReason: 'Reverse shipping overcharge', filedDate: 'Apr 10, 2026', expectedPayout: 'Received May 8' },
  { id: 'FK-CLM-88901', channel: 'flipkart', amount: 67200, amountLabel: '₹67,200', daysInStage: 22, stage: 'received', orderId: 'FK-ORD-99301', returnReason: 'Logistics deduction variance', filedDate: 'Mar 28, 2026', expectedPayout: 'Received May 5' },
  { id: 'MYN-CR-11102', channel: 'myntra', amount: 19800, amountLabel: '₹19,800', daysInStage: 25, stage: 'received', orderId: 'MYN-ORD-22701', returnReason: 'Return shipping fee dispute', filedDate: 'Mar 20, 2026', expectedPayout: 'Received May 1' },
  { id: 'FK-CLM-89014', channel: 'flipkart', amount: 41800, amountLabel: '₹41,800', daysInStage: 33, stage: 'eligible', orderId: 'FK-ORD-99702', returnReason: 'Commission retained on returned order' },
  { id: 'AMZ-RC-30142', channel: 'amazon', amount: 38200, amountLabel: '₹38,200', daysInStage: 31, stage: 'eligible', orderId: 'AMZ-ORD-44402', returnReason: 'Referral fee not reversed on return' },
];

const BASE_AT_RISK: AtRiskClaim[] = [
  { id: 'FK-CLM-88412', channel: 'flipkart', amount: '₹84,200', aging: '42 days', windowCloses: 'Sat (3 days)', daysLeft: 3, action: 'file' },
  { id: 'FK-CLM-88719', channel: 'flipkart', amount: '₹62,180', aging: '38 days', windowCloses: 'Mon (5 days)', daysLeft: 5, action: 'file' },
  { id: 'AMZ-RC-29981', channel: 'amazon', amount: '₹54,700', aging: '36 days', windowCloses: 'Wed (7 days)', daysLeft: 7, action: 'file' },
  { id: 'MYN-CR-11248', channel: 'myntra', amount: '₹47,900', aging: '34 days', windowCloses: '21 days left', daysLeft: 21, action: 'review' },
  { id: 'FK-CLM-89014', channel: 'flipkart', amount: '₹41,800', aging: '33 days', windowCloses: '14 days left', daysLeft: 14, action: 'review' },
  { id: 'AMZ-RC-30142', channel: 'amazon', amount: '₹38,200', aging: '31 days', windowCloses: '11 days left', daysLeft: 11, action: 'review' },
];

const BASE_REJECTED: RejectedClaim[] = [
  { id: 'FK-CLM-88102', channel: 'flipkart', amount: '₹18,400', reason: 'Evidence missing or insufficient' },
  { id: 'AMZ-RC-29801', channel: 'amazon', amount: '₹12,800', reason: 'Evidence missing or insufficient' },
  { id: 'MYN-CR-11001', channel: 'myntra', amount: '₹9,200', reason: 'Outside claim window' },
  { id: 'MEE-CLM-441', channel: 'meesho', amount: '₹6,800', reason: 'Evidence missing or insufficient' },
];

const BASE_REASONS: ReturnReason[] = [
  { reason: 'Size issue', pct: 38, volume: 1610, value: '₹3.20 L', color: 'var(--color-primary)' },
  { reason: 'Quality issue', pct: 24, volume: 1017, value: '₹2.02 L', color: 'var(--color-purple-tint)' },
  { reason: 'Wrong product', pct: 14, volume: 593, value: '₹1.18 L', color: 'var(--color-purple-100)' },
  { reason: "Didn't like", pct: 12, volume: 508, value: '₹1.01 L', color: 'var(--color-warning)' },
  { reason: 'Damaged in transit', pct: 8, volume: 339, value: '₹67 K', color: 'var(--color-error)' },
  { reason: 'Other', pct: 4, volume: 169, value: '₹34 K', color: 'var(--color-gray-200)' },
];

const BASE_SKUS: SkuReturnRow[] = [
  { rank: 1, sku: 'Hydrating Hair Mask', category: 'Haircare', channel: 'myntra', returnRate: 64, lostInr: '₹84,000', suggestions: ['Update sizing chart on Myntra listing', 'Consider delisting on Myntra until chart is fixed'], reasonBreakdown: [{ reason: 'Size issue', pct: 72 }, { reason: 'Quality issue', pct: 18 }] },
  { rank: 2, sku: 'Body Butter Cocoa', category: 'Bodycare', channel: 'myntra', returnRate: 52, lostInr: '₹38,000', suggestions: ['Review product imagery vs actual shade', 'Add fit notes for bodycare variants'], reasonBreakdown: [{ reason: "Didn't like", pct: 44 }, { reason: 'Size issue', pct: 32 }] },
  { rank: 3, sku: 'Glow Serum 30ml', category: 'Skincare', channel: 'flipkart', returnRate: 41, lostInr: '₹2.18 L', suggestions: ['Check Flipkart return QC photos for damage patterns'], reasonBreakdown: [{ reason: 'Quality issue', pct: 38 }, { reason: 'Damaged in transit', pct: 24 }] },
  { rank: 4, sku: 'Anti-Acne Foaming Cleanser', category: 'Skincare', channel: 'myntra', returnRate: 38, lostInr: '₹47,000', suggestions: ['Sizing chart needs update on Myntra'], reasonBreakdown: [{ reason: 'Size issue', pct: 58 }, { reason: 'Wrong product', pct: 14 }] },
  { rank: 5, sku: 'Sun Block SPF 50', category: 'Skincare', channel: 'amazon', returnRate: 32, lostInr: '₹1.21 L', suggestions: ['Verify Amazon FBA packaging for summer SKUs'], reasonBreakdown: [{ reason: 'Damaged in transit', pct: 31 }, { reason: 'Quality issue', pct: 28 }] },
  { rank: 6, sku: 'Night Recovery Oil', category: 'Skincare', channel: 'flipkart', returnRate: 31, lostInr: '₹86,000', suggestions: ['Review return reasons on Flipkart seller panel weekly'], reasonBreakdown: [{ reason: 'Quality issue', pct: 36 }, { reason: 'Size issue', pct: 22 }] },
  { rank: 7, sku: 'Vitamin C Booster', category: 'Skincare', channel: 'amazon', returnRate: 28, lostInr: '₹64,000', suggestions: ['Check batch QC for oxidisation complaints'], reasonBreakdown: [{ reason: 'Quality issue', pct: 42 }, { reason: "Didn't like", pct: 20 }] },
  { rank: 8, sku: 'Gentle Cleanser 100ml', category: 'Skincare', channel: 'flipkart', returnRate: 24, lostInr: '₹38,000', suggestions: ['Monitor Flipkart commission on sub-₹500 band'], reasonBreakdown: [{ reason: 'Wrong product', pct: 28 }, { reason: 'Size issue', pct: 26 }] },
  { rank: 9, sku: 'Hydrating Face Cream 50ml', category: 'Skincare', channel: 'shopify', returnRate: 18, lostInr: '₹1.42 L', suggestions: ['COD return rate improved — maintain current packaging'], reasonBreakdown: [{ reason: 'Size issue', pct: 22 }, { reason: 'Quality issue', pct: 28 }] },
  { rank: 10, sku: 'Scalp Repair Serum', category: 'Haircare', channel: 'myntra', returnRate: 17, lostInr: '₹14,000', suggestions: ['Low volume — watch Myntra return rate trend'], reasonBreakdown: [{ reason: 'Size issue', pct: 48 }, { reason: 'Other', pct: 12 }] },
];

const BASE_HEATMAP: number[][] = [
  [22, 28, 12, 28, 6, 4],
  [31, 26, 18, 14, 8, 3],
  [41, 22, 15, 12, 8, 2],
  [48, 21, 12, 10, 7, 2],
  [38, 28, 14, 11, 6, 3],
];

const BASE_DISPUTABLE: DisputableCharge[] = [
  { id: 'd1', orderId: 'FK-RTN-12847', channel: 'flipkart', type: 'Reverse shipping', charged: '₹85', rateCard: '₹65', overcharge: '₹20', overchargeNum: 20 },
  { id: 'd2', orderId: 'FK-RTN-12918', channel: 'flipkart', type: 'Commission (not reversed)', charged: '₹148', rateCard: '₹0', overcharge: '₹148', overchargeNum: 148 },
  { id: 'd3', orderId: 'MYN-RTN-8821', channel: 'myntra', type: 'Pick-and-pack on return', charged: '₹47', rateCard: '₹0', overcharge: '₹47', overchargeNum: 47 },
  { id: 'd4', orderId: 'AMZ-RTN-3124', channel: 'amazon', type: 'TCS not credited', charged: '₹28', rateCard: '₹0 (refund)', overcharge: '₹28', overchargeNum: 28 },
  { id: 'd5', orderId: 'FK-RTN-12999', channel: 'flipkart', type: 'Fixed fee (not reversed)', charged: '₹19', rateCard: '₹0', overcharge: '₹19', overchargeNum: 19 },
  { id: 'd6', orderId: 'MYN-RTN-8910', channel: 'myntra', type: 'Reverse shipping', charged: '₹95', rateCard: '₹70', overcharge: '₹25', overchargeNum: 25 },
  { id: 'd7', orderId: 'AMZ-RTN-3188', channel: 'amazon', type: 'Referral fee retained', charged: '₹112', rateCard: '₹0', overcharge: '₹112', overchargeNum: 112 },
  { id: 'd8', orderId: 'FK-RTN-13012', channel: 'flipkart', type: 'Collection fee on return', charged: '₹34', rateCard: '₹18', overcharge: '₹16', overchargeNum: 16 },
  { id: 'd9', orderId: 'MYN-RTN-8944', channel: 'myntra', type: 'Commission retained', charged: '₹86', rateCard: '₹0', overcharge: '₹86', overchargeNum: 86 },
  { id: 'd10', orderId: 'MEE-RTN-2201', channel: 'meesho', type: 'Reverse shipping', charged: '₹72', rateCard: '₹55', overcharge: '₹17', overchargeNum: 17 },
  { id: 'd11', orderId: 'SHP-RTN-4412', channel: 'shopify', type: 'PG fee on refund', charged: '₹42', rateCard: '₹28', overcharge: '₹14', overchargeNum: 14 },
  { id: 'd12', orderId: 'FK-RTN-13088', channel: 'flipkart', type: 'Shipping fee clawback', charged: '₹124', rateCard: '₹98', overcharge: '₹26', overchargeNum: 26 },
  { id: 'd13', orderId: 'AMZ-RTN-3201', channel: 'amazon', type: 'Reverse logistics', charged: '₹68', rateCard: '₹52', overcharge: '₹16', overchargeNum: 16 },
  { id: 'd14', orderId: 'MYN-RTN-8988', channel: 'myntra', type: 'Fixed fee on return', charged: '₹31', rateCard: '₹0', overcharge: '₹31', overchargeNum: 31 },
];

function scaleCount(n: number, scale: number): number {
  return Math.max(1, Math.round(n * scale));
}

function scaleLakhs(amount: number, scale: number): string {
  const v = amount * scale;
  if (v >= 1) return `₹${v.toFixed(2)} L`;
  return `₹${Math.round(v * 100)} K`;
}

const REASON_LABELS = [
  'Size issue',
  'Quality issue',
  'Wrong product',
  "Didn't like",
  'Damaged in transit',
  'Other',
] as const;

const REASON_COLORS: Record<string, string> = {
  'Size issue': 'var(--color-primary)',
  'Quality issue': 'var(--color-purple-tint)',
  'Wrong product': 'var(--color-purple-100)',
  "Didn't like": 'var(--color-warning)',
  'Damaged in transit': 'var(--color-error)',
  Other: 'var(--color-gray-200)',
};

export function getReasonsForChannel(
  channel: ReturnsChannelFilter,
  scale: number,
  baseReasons: ReturnReason[]
): ReturnReason[] {
  if (channel === 'all') {
    return baseReasons.map((r) => ({ ...r, volume: scaleCount(r.volume, scale) }));
  }
  const chIdx = (['shopify', 'amazon', 'flipkart', 'myntra', 'meesho'] as ReturnsChannel[]).indexOf(channel);
  const heatRow = BASE_HEATMAP[chIdx];
  const returnsCount = BASE_CHANNELS.find((c) => c.channel === channel)!.returnsCount;
  return REASON_LABELS.map((reason, i) => {
    const pct = heatRow[i];
    const volume = scaleCount(Math.round((pct / 100) * returnsCount), scale);
    const base = baseReasons.find((r) => r.reason === reason);
    const valueNum = base ? parseFloat(base.value.replace(/[₹,\sLK]/g, '')) * (base.value.includes('L') ? 100000 : 1000) : 0;
    const scaledValue = (valueNum * scale * pct) / (base?.pct ?? 100);
    const value =
      scaledValue >= 100000 ? `₹${(scaledValue / 100000).toFixed(2)} L` : `₹${Math.round(scaledValue / 1000)} K`;
    return {
      reason,
      pct,
      volume,
      value,
      color: REASON_COLORS[reason],
    };
  }).sort((a, b) => b.pct - a.pct);
}

export function getReturnsDataset(dateRange: DateRange): ReturnsDataset {
  const scale = DATE_RANGE_SCALE[dateRange];
  const recoveryRate = 28.4;
  const returnsRate = 24.6;

  const heatmapMeta: ReturnsDataset['heatmapMeta'] = [];
  const channels: ReturnsChannel[] = ['shopify', 'amazon', 'flipkart', 'myntra', 'meesho'];
  channels.forEach((ch, ci) => {
    HEATMAP_REASONS.forEach((reason, ri) => {
      const pct = BASE_HEATMAP[ci][ri];
      heatmapMeta.push({
        channel: ch,
        reason,
        count: Math.round((pct / 100) * BASE_CHANNELS.find((c) => c.channel === ch)!.returnsCount),
        value: `₹${Math.round((pct / 100) * 842000 * scale / 1000)} K`,
      });
    });
  });

  return {
    topKpis: {
      costOfReturns: scale === 1 ? '₹8.42 L' : `₹${(8.42 * scale).toFixed(1)} L`,
      costSub: `this month · ₹${(1.32 * scale).toFixed(2)} L vs last month`,
      recoveryRate,
      recoverySub: `₹${(1.94 * scale).toFixed(2)} L of ₹${(6.84 * scale).toFixed(2)} L eligible`,
      atRisk: scale === 1 ? '₹3.84 L' : `₹${(3.84 * scale).toFixed(2)} L`,
      atRiskSub: `across ${scaleCount(8, scale)} claims · ${scaleCount(3, scale)} closing this week`,
      returnsRate,
      returnsRateSub: 'weighted across all channels',
      returnsRateWow: 2.1,
    },
    costBreakdown: BASE_COST.map((row) =>
      row.id === 'total'
        ? row
        : {
            ...row,
            thisMonth: scaleLakhs(parseFloat(row.thisMonth.replace(/[₹\sL]/g, '')), scale),
            lastMonth: scaleLakhs(parseFloat(row.lastMonth.replace(/[₹\sL]/g, '')), scale),
          }
    ).map((row) =>
      row.id === 'total'
        ? {
            ...row,
            thisMonth: scale === 1 ? '₹8.42 L' : scaleLakhs(8.42, scale),
            lastMonth: scale === 1 ? '₹7.10 L' : scaleLakhs(7.1, scale),
          }
        : row
    ),
    channelReturns: BASE_CHANNELS.map((r) => ({
      ...r,
      returnsCount: scaleCount(r.returnsCount, scale),
    })),
    pipelineTotals: {
      eligible: { count: scaleCount(12, scale), amount: `₹${(3.72 * scale).toFixed(2)} L` },
      filed: { count: scaleCount(8, scale), amount: `₹${(3.12 * scale).toFixed(2)} L` },
      approved: { count: scaleCount(5, scale), amount: `₹${(1.21 * scale).toFixed(2)} L` },
      received: { count: scaleCount(21, scale), amount: `₹${(1.94 * scale).toFixed(2)} L` },
    },
    claims: BASE_CLAIMS,
    atRisk: BASE_AT_RISK,
    rejected: BASE_REJECTED,
    rejectedSummary: `4 claims rejected this month (₹47,200). Top reason: 'evidence missing or insufficient'.`,
    reasons: BASE_REASONS.map((r) => ({
      ...r,
      volume: scaleCount(r.volume, scale),
    })),
    skus: BASE_SKUS,
    heatmap: {
      channel: 'shopify',
      cells: BASE_HEATMAP[0],
    },
    heatmapReasons: HEATMAP_REASONS,
    heatmapMeta,
    disputable: BASE_DISPUTABLE,
    disputableTotal: '₹47,290',
  };
}

export function getHeatmapRows(): { channel: ReturnsChannel; cells: number[] }[] {
  const channels: ReturnsChannel[] = ['shopify', 'amazon', 'flipkart', 'myntra', 'meesho'];
  return channels.map((ch, i) => ({ channel: ch, cells: BASE_HEATMAP[i] }));
}

export function returnRateColor(rate: number): string {
  if (rate > 30) return 'text-error';
  if (rate >= 20) return 'text-warning';
  return 'text-success';
}

export function heatmapCellClass(pct: number, maxPct: number): string {
  const intensity = pct / maxPct;
  if (intensity >= 0.85) return 'bg-primary text-white';
  if (intensity >= 0.65) return 'bg-primary/80 text-white';
  if (intensity >= 0.45) return 'bg-purple-tint text-navy-950';
  if (intensity >= 0.25) return 'bg-purple-100 text-navy-950';
  return 'bg-purple-50 text-gray-600';
}

export function filterByChannel<T extends { channel: ReturnsChannel }>(
  items: T[],
  channel: ReturnsChannelFilter
): T[] {
  if (channel === 'all') return items;
  return items.filter((i) => i.channel === channel);
}
