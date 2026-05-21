export type ChannelId = 'shopify' | 'amazon' | 'flipkart' | 'myntra' | 'meesho' | 'all';
export type DateRange = 'Today' | 'This Week' | 'This Month' | 'This Quarter' | 'Custom';
export type GstMode = 'inc' | 'exc' | 'both';

export type PnlRowType = 'leaf' | 'parent' | 'subtotal' | 'child';

export interface PnlRow {
  id: string;
  label: string;
  rowType: PnlRowType;
  parentId?: string;
  incGst: number | null;
  excGst: number | null;
  pctNetSales: number | null;
  wowDelta?: number | null;
  tooltip: string;
  sourceHint?: string;
}

export interface ScorecardRow {
  id: ChannelId;
  channel: string;
  colorClass: string;
  orders: number;
  gmv: string;
  netSales: string;
  marginInr: string;
  marginPct: number;
  wow: number;
}

export type MarketplaceId = Exclude<ChannelId, 'all'>;

export interface SkuRow {
  rank: number;
  sku: string;
  category: string;
  marketplace: string;
  marketplaceId: MarketplaceId;
  marketplaceColorClass: string;
  units: number;
  netRev: string;
  marginInr: string;
  marginPct: number;
}

export const SKU_MARKETPLACE_OPTIONS: { id: ChannelId | 'all'; label: string }[] = [
  { id: 'all', label: 'All marketplaces' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
  { id: 'myntra', label: 'Myntra' },
  { id: 'meesho', label: 'Meesho' },
];

const MARKETPLACE_META: Record<MarketplaceId, { label: string; colorClass: string }> = {
  shopify: { label: 'Shopify', colorClass: 'bg-shopify' },
  amazon: { label: 'Amazon', colorClass: 'bg-amazon' },
  flipkart: { label: 'Flipkart', colorClass: 'bg-flipkart' },
  myntra: { label: 'Myntra', colorClass: 'bg-myntra' },
  meesho: { label: 'Meesho', colorClass: 'bg-meesho' },
};

const MARKETPLACE_IDS: MarketplaceId[] = ['shopify', 'amazon', 'flipkart', 'myntra', 'meesho'];

export interface CategoryMixItem {
  name: string;
  pct: number;
  amount: string;
  color: string;
}

export interface InsightTile {
  id: string;
  tone: 'critical' | 'action' | 'positive';
  message: string;
  route: 'returns' | 'reconciliation';
  linkLabel: string;
}

export const CHANNEL_TABS: { id: ChannelId; label: string }[] = [
  { id: 'shopify', label: 'Shopify' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
  { id: 'myntra', label: 'Myntra' },
  { id: 'meesho', label: 'Meesho' },
  { id: 'all', label: 'All channels' },
];

export const DATE_RANGE_SCALE: Record<DateRange, number> = {
  Today: 0.035,
  'This Week': 0.24,
  'This Month': 1,
  'This Quarter': 2.85,
  Custom: 1,
};

const BASE_SCORECARD: Omit<ScorecardRow, 'orders'>[] = [
  { id: 'shopify', channel: 'Shopify', colorClass: 'bg-shopify', gmv: '₹1.24 Cr', netSales: '₹1.18 Cr', marginInr: '₹27.7 L', marginPct: 22.4, wow: 1.2 },
  { id: 'amazon', channel: 'Amazon', colorClass: 'bg-amazon', gmv: '₹1.18 Cr', netSales: '₹1.04 Cr', marginInr: '₹19.8 L', marginPct: 16.8, wow: -0.4 },
  { id: 'flipkart', channel: 'Flipkart', colorClass: 'bg-flipkart', gmv: '₹98.0 L', netSales: '₹86.0 L', marginInr: '₹10.9 L', marginPct: 11.2, wow: -2.1 },
  { id: 'meesho', channel: 'Meesho', colorClass: 'bg-meesho', gmv: '₹16.0 L', netSales: '₹14.0 L', marginInr: '₹0.98 L', marginPct: 6.1, wow: -1.1 },
  { id: 'myntra', channel: 'Myntra', colorClass: 'bg-myntra', gmv: '₹62.0 L', netSales: '₹54.0 L', marginInr: '₹2.10 L', marginPct: 3.4, wow: -4.8 },
];

const BASE_ORDERS: Record<ChannelId, number> = {
  shopify: 3847,
  amazon: 5231,
  flipkart: 4109,
  meesho: 1847,
  myntra: 2156,
  all: 17190,
};

export function getScorecard(dateRange: DateRange): ScorecardRow[] {
  const scale = DATE_RANGE_SCALE[dateRange];
  return BASE_SCORECARD.map((row) => ({
    ...row,
    orders: Math.round(BASE_ORDERS[row.id] * scale),
    marginInr: scaleLabel(row.marginInr, scale),
    gmv: scaleLabel(row.gmv, scale),
    netSales: scaleLabel(row.netSales, scale),
  })).sort((a, b) => b.marginPct - a.marginPct);
}

function scaleLabel(val: string, scale: number): string {
  if (scale === 1) return val;
  if (val.includes('Cr')) {
    const n = parseFloat(val.replace(/[₹\sCr]/g, '')) * scale;
    return n >= 1 ? `₹${n.toFixed(2)} Cr` : `₹${(n * 100).toFixed(1)} L`;
  }
  const n = parseFloat(val.replace(/[₹\sL]/g, '')) * scale;
  return `₹${n.toFixed(1)} L`;
}

/** Flipkart Moneyflo taxonomy — canonical P&L (amounts in ₹) */
const FLIPKART_PNL_TEMPLATE: Omit<PnlRow, 'wowDelta'>[] = [
  { id: 'listing-gmv', label: 'Listing GMV', rowType: 'leaf', incGst: 386680, excGst: null, pctNetSales: null, tooltip: 'Gross merchandise value before discounts on Flipkart listings.' },
  { id: 'total-discount', label: 'Total Discount', rowType: 'parent', incGst: 11492, excGst: null, pctNetSales: null, tooltip: 'Platform and seller-funded discounts combined.' },
  { id: 'disc-self', label: 'Discount (Self)', rowType: 'child', parentId: 'total-discount', incGst: -120, excGst: null, pctNetSales: null, tooltip: 'Seller-funded discount on orders.' },
  { id: 'disc-platform', label: 'Discount (Platform)', rowType: 'child', parentId: 'total-discount', incGst: 11372, excGst: null, pctNetSales: null, tooltip: 'Flipkart-funded promotional discount.' },
  { id: 'net-sales', label: 'Net Sales', rowType: 'subtotal', incGst: 386560, excGst: 328134, pctNetSales: 100, tooltip: 'GMV minus discounts — base for margin %.' },
  { id: 'ads-fee', label: 'Ads Fee', rowType: 'parent', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Flipkart advertising spend (Sponsored Product, Brand, Display).' },
  { id: 'ads-sp', label: 'Sponsored Product', rowType: 'child', parentId: 'ads-fee', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Cost of sponsored product placements.' },
  { id: 'ads-sb', label: 'Sponsored Brand', rowType: 'child', parentId: 'ads-fee', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Cost of sponsored brand campaigns.' },
  { id: 'ads-sd', label: 'Sponsored Display', rowType: 'child', parentId: 'ads-fee', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Cost of sponsored display inventory.' },
  { id: 'delivered-charges', label: 'Delivered Order Charges', rowType: 'parent', incGst: -156771, excGst: -132913, pctNetSales: -40.51, tooltip: 'Fees on successfully delivered orders.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'ship-fee', label: 'Shipping Fee', rowType: 'child', parentId: 'delivered-charges', incGst: -80449, excGst: -68177, pctNetSales: -20.78, tooltip: 'Forward logistics charged per delivered unit.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'commission', label: 'Commission', rowType: 'child', parentId: 'delivered-charges', incGst: -47854, excGst: -40554, pctNetSales: -12.36, tooltip: 'Marketplace commission on net sales.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'fixed-fee', label: 'Fixed Fee', rowType: 'child', parentId: 'delivered-charges', incGst: -13979, excGst: -11847, pctNetSales: -3.61, tooltip: 'Per-order fixed platform fee.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'collection-fee', label: 'Collection Fee', rowType: 'child', parentId: 'delivered-charges', incGst: -8758, excGst: -7422, pctNetSales: -2.26, tooltip: 'Payment collection fee on COD and prepaid.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'pick-pack', label: 'Pick And Pack Fee', rowType: 'child', parentId: 'delivered-charges', incGst: -5721, excGst: -4848, pctNetSales: -1.48, tooltip: 'Fulfillment pick-and-pack charges.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'rev-ship-del', label: 'Reverse Shipping Fee', rowType: 'child', parentId: 'delivered-charges', incGst: -77, excGst: -65, pctNetSales: -0.02, tooltip: 'Reverse logistics on delivered-then-returned orders.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'returned-charges', label: 'Returned Order Charges', rowType: 'parent', incGst: -16468, excGst: -13998, pctNetSales: -4.27, tooltip: 'Fees applied when orders are returned.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'rev-ship-ret', label: 'Reverse Shipping Fee', rowType: 'child', parentId: 'returned-charges', incGst: -7517, excGst: -6370, pctNetSales: -1.94, tooltip: 'Return leg logistics cost.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'ship-fee-ret', label: 'Shipping Fee', rowType: 'child', parentId: 'returned-charges', incGst: -6159, excGst: -5219, pctNetSales: -1.59, tooltip: 'Shipping fee clawback on returns.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'fixed-fee-ret', label: 'Fixed Fee', rowType: 'child', parentId: 'returned-charges', incGst: -1569, excGst: -1330, pctNetSales: -0.41, tooltip: 'Fixed fee on returned orders.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'coll-fee-ret', label: 'Collection Fee', rowType: 'child', parentId: 'returned-charges', incGst: -1016, excGst: -861, pctNetSales: -0.26, tooltip: 'Collection fee on returned orders.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'pick-pack-ret', label: 'Pick And Pack Fee', rowType: 'child', parentId: 'returned-charges', incGst: -255, excGst: -216, pctNetSales: -0.07, tooltip: 'Pick-and-pack on returns.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'comm-ret', label: 'Commission', rowType: 'child', parentId: 'returned-charges', incGst: -2, excGst: -1, pctNetSales: 0, tooltip: 'Commission adjustment on returns.', sourceHint: 'Flipkart Settlement Report' },
  { id: 'indirect', label: 'Indirect Charges', rowType: 'parent', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Rebates, reimbursements, and incentive payouts.' },
  { id: 'rebates', label: 'Marketplace Rebates', rowType: 'child', parentId: 'indirect', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Periodic marketplace rebate credits.' },
  { id: 'reimb', label: 'Reimbursements', rowType: 'child', parentId: 'indirect', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Claim reimbursements from marketplace.' },
  { id: 'incentive', label: 'Incentive Payouts', rowType: 'child', parentId: 'indirect', incGst: 0, excGst: null, pctNetSales: 0, tooltip: 'Performance incentive payouts.' },
  { id: 'net-revenue', label: 'Net Revenue', rowType: 'subtotal', incGst: 213321, excGst: 181223, pctNetSales: 55.23, tooltip: 'Net sales minus marketplace and return charges.' },
  { id: 'aov', label: 'Average Order Value', rowType: 'leaf', incGst: 503, excGst: 427, pctNetSales: null, tooltip: 'Average net sales per order.' },
  { id: 'nrpo', label: 'Net Revenue per Order', rowType: 'leaf', incGst: 277, excGst: 236, pctNetSales: 55.23, tooltip: 'Net revenue divided by order count.' },
  { id: 'output-gst', label: 'Output GST', rowType: 'leaf', incGst: 58426, excGst: null, pctNetSales: null, tooltip: 'GST collected on sales.' },
  { id: 'input-gst', label: 'Input Credit (GST)', rowType: 'leaf', incGst: 26329, excGst: null, pctNetSales: null, tooltip: 'Input tax credit from marketplace charges.' },
  { id: 'tds', label: 'TDS', rowType: 'leaf', incGst: 3281, excGst: null, pctNetSales: null, tooltip: 'Tax deducted at source on payouts.' },
  { id: 'tcs', label: 'TCS', rowType: 'leaf', incGst: 3281, excGst: null, pctNetSales: null, tooltip: 'Tax collected at source on marketplace sales.' },
];

const CHANNEL_PNL_SCALE: Record<ChannelId, number> = {
  flipkart: 1,
  shopify: 30.52,
  amazon: 26.9,
  myntra: 13.97,
  meesho: 3.62,
  all: 71.01,
};

const DEFAULT_EXPANDED = new Set(['delivered-charges', 'returned-charges']);
const DEFAULT_COLLAPSED_PARENTS = new Set(['total-discount', 'ads-fee', 'indirect']);

export function getDefaultExpandedRows(): string[] {
  return [...DEFAULT_EXPANDED];
}

export function getPnlRows(channel: ChannelId, dateRange: DateRange): PnlRow[] {
  const rangeScale = DATE_RANGE_SCALE[dateRange];
  const channelScale = CHANNEL_PNL_SCALE[channel];
  const scale = rangeScale * channelScale;

  return FLIPKART_PNL_TEMPLATE.map((row, i) => ({
    ...row,
    id: `${channel}-${row.id}`,
    parentId: row.parentId ? `${channel}-${row.parentId}` : undefined,
    incGst: row.incGst !== null ? Math.round(row.incGst * scale) : null,
    excGst: row.excGst !== null ? Math.round(row.excGst * scale) : null,
    pctNetSales: row.pctNetSales,
    wowDelta: row.rowType === 'subtotal' || row.rowType === 'parent'
      ? (i % 3 === 0 ? -1.2 : i % 3 === 1 ? 0.4 : -0.6)
      : row.incGst && row.incGst !== 0 ? (row.incGst < 0 ? -2.4 : 1.1) : null,
    tooltip:
      channel === 'shopify' && row.id === 'commission'
        ? 'Cashfree PG and payment processing fees on own-store orders.'
        : channel === 'amazon' && row.id === 'commission'
          ? 'Amazon referral fee — equivalent to marketplace commission.'
          : row.tooltip,
    sourceHint: row.sourceHint
      ? `Sourced from ${channelLabel(channel)} Settlement Report · synced 12 min ago · view ${Math.max(12, Math.round(38 * channelScale / 10))} line-items →`
      : undefined,
  }));
}

function channelLabel(channel: ChannelId): string {
  const map: Record<ChannelId, string> = {
    shopify: 'Shopify',
    amazon: 'Amazon',
    flipkart: 'Flipkart',
    myntra: 'Myntra',
    meesho: 'Meesho',
    all: 'All channels',
  };
  return map[channel];
}

export function channelDisplayName(channel: ChannelId): string {
  return channelLabel(channel);
}

export const INSIGHT_TILES: InsightTile[] = [
  {
    id: 'ins-1',
    tone: 'critical',
    message: 'Myntra margin compressed by 4.8 pts WoW — return rate spiked to 36% from 28% on Holi sale orders.',
    route: 'returns',
    linkLabel: 'Open Returns & Recovery →',
  },
  {
    id: 'ins-2',
    tone: 'action',
    message: 'Flipkart commission overcharged by ₹3,247 on apparel < ₹500 — claim eligible until May 26.',
    route: 'reconciliation',
    linkLabel: 'Open Reconciliation →',
  },
  {
    id: 'ins-3',
    tone: 'positive',
    message: 'Shopify margin up 1.2 pts driven by COD return rate dropping to 18% from 22%.',
    route: 'returns',
    linkLabel: 'Open Returns & Recovery →',
  },
];

type SkuTemplate = Pick<SkuRow, 'rank' | 'sku' | 'category' | 'units' | 'netRev' | 'marginInr' | 'marginPct'>;

const FLIPKART_SKUS: SkuTemplate[] = [
  { rank: 1, sku: 'Hydrating Face Cream 50ml', category: 'Skincare', units: 1247, netRev: '₹4.82 L', marginInr: '₹1.37 L', marginPct: 28.4 },
  { rank: 2, sku: 'Glow Serum 30ml', category: 'Skincare', units: 892, netRev: '₹3.21 L', marginInr: '₹77,400', marginPct: 24.1 },
  { rank: 3, sku: 'Night Recovery Oil', category: 'Skincare', units: 651, netRev: '₹2.18 L', marginInr: '₹47,500', marginPct: 21.8 },
  { rank: 4, sku: 'Anti-Acne Foaming Cleanser', category: 'Skincare', units: 547, netRev: '₹1.91 L', marginInr: '₹38,200', marginPct: 20.0 },
  { rank: 5, sku: 'Gentle Cleanser 100ml', category: 'Skincare', units: 412, netRev: '₹1.42 L', marginInr: '₹25,800', marginPct: 18.2 },
  { rank: 6, sku: 'Sun Block SPF 50', category: 'Skincare', units: 387, netRev: '₹0.98 L', marginInr: '₹15,800', marginPct: 16.1 },
  { rank: 7, sku: 'Vitamin C Booster', category: 'Skincare', units: 318, netRev: '₹1.05 L', marginInr: '₹16,800', marginPct: 16.0 },
  { rank: 8, sku: 'Hydrating Hair Mask', category: 'Haircare', units: 284, netRev: '₹0.74 L', marginInr: '₹9,640', marginPct: 13.0 },
  { rank: 9, sku: 'Body Butter Cocoa', category: 'Bodycare', units: 218, netRev: '₹0.48 L', marginInr: '₹5,280', marginPct: 11.0 },
  { rank: 10, sku: 'Scalp Repair Serum', category: 'Haircare', units: 196, netRev: '₹0.52 L', marginInr: '₹3,640', marginPct: 7.0 },
];

function buildSkuRowsForMarketplace(channel: MarketplaceId, dateRange: DateRange): SkuRow[] {
  const scale = DATE_RANGE_SCALE[dateRange];
  const meta = MARKETPLACE_META[channel];
  const channelScale = CHANNEL_PNL_SCALE[channel];
  return FLIPKART_SKUS.map((row, i) => ({
    rank: row.rank,
    sku: row.sku,
    category: row.category,
    marketplace: meta.label,
    marketplaceId: channel,
    marketplaceColorClass: meta.colorClass,
    units: Math.round((row.units * channelScale) / CHANNEL_PNL_SCALE.flipkart * scale),
    netRev: row.netRev,
    marginInr: row.marginInr,
    marginPct: Math.max(
      3,
      row.marginPct +
        (channel === 'myntra' ? -8 + i * 0.3 : channel === 'shopify' ? 4 : channel === 'amazon' ? 1 : channel === 'meesho' ? -2 : 0)
    ),
  }))
    .sort((a, b) => b.marginPct - a.marginPct)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function getSkuLeaderboard(channel: ChannelId, dateRange: DateRange): SkuRow[] {
  if (channel === 'all') return getSkuLeaderboardByMarketplace('all', dateRange);
  return buildSkuRowsForMarketplace(channel, dateRange);
}

export function getSkuLeaderboardByMarketplace(
  marketplace: ChannelId | 'all',
  dateRange: DateRange
): SkuRow[] {
  if (marketplace !== 'all') {
    return buildSkuRowsForMarketplace(marketplace, dateRange);
  }
  // One row per SKU — keep the channel where margin % is highest
  const bestBySku = new Map<string, SkuRow>();
  MARKETPLACE_IDS.forEach((ch) => {
    buildSkuRowsForMarketplace(ch, dateRange).forEach((row) => {
      const existing = bestBySku.get(row.sku);
      if (!existing || row.marginPct > existing.marginPct) {
        bestBySku.set(row.sku, row);
      }
    });
  });
  return Array.from(bestBySku.values())
    .sort((a, b) => b.marginPct - a.marginPct)
    .slice(0, 10)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function getCategoryMix(channel: ChannelId): CategoryMixItem[] {
  const factor = channel === 'myntra' ? 0.35 : channel === 'meesho' ? 0.22 : channel === 'all' ? 2.4 : 1;
  return [
    { name: 'Skincare', pct: 64, amount: `₹${(6.98 * factor).toFixed(2)} L`, color: 'var(--color-primary)' },
    { name: 'Haircare', pct: 22, amount: `₹${(2.4 * factor).toFixed(2)} L`, color: 'var(--color-purple-tint)' },
    { name: 'Bodycare', pct: 14, amount: `₹${(1.52 * factor).toFixed(2)} L`, color: 'var(--color-purple-100)' },
  ];
}

export function formatPnlAmount(amount: number | null, compact = false): string {
  if (amount === null) return '—';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (compact && abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (compact && abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

export function formatPct(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct.toFixed(2)}%`;
}

export function marginPctColor(pct: number): string {
  if (pct > 15) return 'text-success';
  if (pct >= 5) return 'text-warning';
  return 'text-error';
}

export function unreconciledOrdersLabel(channel: ChannelId, dateRange: DateRange): string {
  const base: Record<ChannelId, number> = { shopify: 3, amazon: 12, flipkart: 17, myntra: 24, meesho: 8, all: 64 };
  return `${Math.round(base[channel] * DATE_RANGE_SCALE[dateRange])} unreconciled orders excluded`;
}
