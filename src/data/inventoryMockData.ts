/** Single source of truth for Tara's inventory office. Tailored to Luxe by Kan. */

export type FulfilModel = 'stocked' | 'on-demand';
export type SkuCategory = string; // free-form so new categories can be added in-session
export const INITIAL_CATEGORIES: string[] = ['Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Apparel'];
export type StockedStatus = 'healthy' | 'reorder' | 'stockout-risk' | 'overstock';
export type OutOfStockBehaviour = 'reject' | 'accept';
export type SlaStatus = 'on-track' | 'at-risk' | 'breached';
export type PoStatus = 'awaiting-approval' | 'auto-placed' | 'sent-to-priya';

export interface StockedSku {
  id: string;
  product: string;
  brand: string;
  category: SkuCategory;
  mrp: number;
  onHand: number;
  weeklyForecast: number;
  coverDays: number;
  reorderPoint: number;
  status: StockedStatus;
  outOfStockBehaviour: OutOfStockBehaviour;
  expiryFlag?: boolean;
}

/** Default applied to new stocked SKUs (merchant can override per SKU). */
export const DEFAULT_OOS_BEHAVIOUR: OutOfStockBehaviour = 'reject';

export interface OnDemandSku {
  id: string;
  product: string;
  brand: string;
  category: SkuCategory;
  mrp: number;
  supplier: string;
  ordersAwaiting: number;
  leadTimeDays: number;
  slaStatus: SlaStatus;
  graduationCandidate?: boolean;
}

export interface ReplenishmentPo {
  id: string;
  supplier: string;
  items: string;
  value: number;
  model: FulfilModel;
  status: PoStatus;
  note?: string;
}

export interface SupplierScore {
  id: string;
  name: string;
  brandsCovered: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  avgLeadDays: number;
  openPos: number;
  slaBreaches30d: number;
}

export interface InventoryAlert {
  id: string;
  severity: 'amber' | 'rose' | 'info';
  body: string;
  ctaLabel: string;
  officeTab: string;
}

export const INVENTORY_KPI = {
  valueHeld: { value: '₹48.6 L', sub: '64 stocked hero SKUs · 9.4 wks avg cover' },
  stockoutRisk: { value: '5 SKUs', sub: 'hero SKUs under 7 days cover' },
  onDemandOpen: { value: '11 orders', sub: 'awaiting brand-stockist dispatch' },
  capitalAtRisk: { value: '₹3.2 L', sub: 'slow movers >120d + 2 batches expiring <90d' },
};

export const STOCKED_SKUS: StockedSku[] = [
  { id: 's1', product: 'Pillow Talk Lipstick', brand: 'Charlotte Tilbury', category: 'Makeup', mrp: 3200, onHand: 18, weeklyForecast: 22, coverDays: 6, reorderPoint: 40, status: 'stockout-risk', outOfStockBehaviour: 'accept' },
  { id: 's2', product: 'Flawless Filter 30ml', brand: 'Charlotte Tilbury', category: 'Makeup', mrp: 4500, onHand: 14, weeklyForecast: 19, coverDays: 5, reorderPoint: 36, status: 'stockout-risk', outOfStockBehaviour: 'accept' },
  { id: 's3', product: 'Unseen Sunscreen SPF40', brand: 'Supergoop!', category: 'Skincare', mrp: 3800, onHand: 9, weeklyForecast: 16, coverDays: 4, reorderPoint: 35, status: 'stockout-risk', outOfStockBehaviour: 'accept' },
  { id: 's4', product: 'No.3 Hair Perfector 100ml', brand: 'Olaplex', category: 'Haircare', mrp: 2300, onHand: 54, weeklyForecast: 30, coverDays: 13, reorderPoint: 60, status: 'reorder', outOfStockBehaviour: 'accept' },
  { id: 's5', product: 'Protini Polypeptide Cream', brand: 'Drunk Elephant', category: 'Skincare', mrp: 5400, onHand: 120, weeklyForecast: 18, coverDays: 47, reorderPoint: 50, status: 'healthy', outOfStockBehaviour: 'reject' },
  { id: 's6', product: 'Leave-In Molecular Mask 50ml', brand: 'K18', category: 'Haircare', mrp: 6200, onHand: 32, weeklyForecast: 9, coverDays: 25, reorderPoint: 24, status: 'healthy', outOfStockBehaviour: 'reject', expiryFlag: true },
  { id: 's7', product: 'Lip Glow Oil', brand: 'Dior Beauty', category: 'Makeup', mrp: 3500, onHand: 76, weeklyForecast: 12, coverDays: 44, reorderPoint: 40, status: 'healthy', outOfStockBehaviour: 'reject' },
  { id: 's8', product: 'Shape Tape Concealer', brand: 'Tarte', category: 'Makeup', mrp: 2400, onHand: 210, weeklyForecast: 8, coverDays: 184, reorderPoint: 30, status: 'overstock', outOfStockBehaviour: 'reject' },
];

export const ON_DEMAND_SKUS: OnDemandSku[] = [
  { id: 'd1', product: 'N°5 Eau de Parfum 100ml', brand: 'Chanel Beauty', category: 'Fragrance', mrp: 13500, supplier: 'Chanel India (authorised)', ordersAwaiting: 3, leadTimeDays: 9, slaStatus: 'at-risk' },
  { id: 'd2', product: 'The One Eau de Parfum', brand: 'Dolce & Gabbana', category: 'Fragrance', mrp: 9200, supplier: 'D&G Beauty India', ordersAwaiting: 1, leadTimeDays: 8, slaStatus: 'breached' },
  { id: 'd3', product: 'Future Skin Foundation', brand: 'Chantecaille', category: 'Makeup', mrp: 6500, supplier: 'Chantecaille UK', ordersAwaiting: 2, leadTimeDays: 14, slaStatus: 'at-risk' },
  { id: 'd4', product: 'Gold Lust Repair Shampoo', brand: 'Oribe', category: 'Haircare', mrp: 4500, supplier: 'Oribe APAC stockist', ordersAwaiting: 1, leadTimeDays: 12, slaStatus: 'on-track' },
  { id: 'd5', product: 'Premier Cru The Cream', brand: 'Caudalie', category: 'Skincare', mrp: 9800, supplier: 'Caudalie Distribution', ordersAwaiting: 2, leadTimeDays: 7, slaStatus: 'on-track' },
  { id: 'd6', product: 'Vital Seamless Leggings (Black/M)', brand: 'Gymshark', category: 'Apparel', mrp: 4200, supplier: 'Gymshark UK', ordersAwaiting: 1, leadTimeDays: 16, slaStatus: 'at-risk' },
  { id: 'd7', product: 'No.7 Bonding Oil 30ml', brand: 'Olaplex', category: 'Haircare', mrp: 2800, supplier: 'Olaplex India distributor', ordersAwaiting: 2, leadTimeDays: 6, slaStatus: 'on-track', graduationCandidate: true },
];

export const REPLENISHMENT_POS: ReplenishmentPo[] = [
  { id: 'CF-PO-3387', supplier: 'Charlotte Tilbury', items: 'Pillow Talk Lipstick ×120, Flawless Filter ×80', value: 210000, model: 'stocked', status: 'awaiting-approval', note: 'Both hero SKUs under 7-day cover. Forecast-driven qty.' },
  { id: 'CF-PO-3388', supplier: 'Supergoop!', items: 'Unseen Sunscreen SPF40 ×100', value: 140000, model: 'stocked', status: 'awaiting-approval', note: 'Cover 4 days; sunscreen seasonal uplift detected.' },
  { id: 'CF-PO-3391', supplier: 'Chanel India', items: 'N°5 EDP 100ml ×3 (against customer orders)', value: 32000, model: 'on-demand', status: 'auto-placed', note: 'Within autonomy band — auto-raised, SLA clock started.' },
  { id: 'CF-PO-3384', supplier: 'Drunk Elephant', items: 'Protini Cream ×40', value: 168000, model: 'stocked', status: 'sent-to-priya', note: 'Approved 21 Jun — handed to Priya for vendor payment.' },
];

export const SUPPLIERS: SupplierScore[] = [
  { id: 'sup1', name: 'Chanel India (authorised)', brandsCovered: 'Chanel Beauty', pocName: 'Rohan Mehta', pocEmail: 'rohan.mehta@chanel-india.example', pocPhone: '+91 98200 11223', avgLeadDays: 9, openPos: 2, slaBreaches30d: 0 },
  { id: 'sup2', name: 'D&G Beauty India', brandsCovered: 'Dolce & Gabbana', pocName: 'Anjali Rao', pocEmail: 'anjali.rao@dg-beauty.example', pocPhone: '+91 98330 44556', avgLeadDays: 8, openPos: 1, slaBreaches30d: 2 },
  { id: 'sup3', name: 'Chantecaille UK', brandsCovered: 'Chantecaille', pocName: 'Emma Clarke', pocEmail: 'emma.clarke@chantecaille-uk.example', pocPhone: '+44 20 7946 0102', avgLeadDays: 14, openPos: 2, slaBreaches30d: 1 },
  { id: 'sup4', name: 'Caudalie Distribution', brandsCovered: 'Caudalie', pocName: 'Pierre Dubois', pocEmail: 'p.dubois@caudalie-dist.example', pocPhone: '+33 1 70 18 99 01', avgLeadDays: 7, openPos: 1, slaBreaches30d: 0 },
  { id: 'sup5', name: 'Gymshark UK', brandsCovered: 'Gymshark', pocName: 'Liam Patel', pocEmail: 'liam.patel@gymshark-uk.example', pocPhone: '+44 121 296 5000', avgLeadDays: 16, openPos: 1, slaBreaches30d: 1 },
  { id: 'sup6', name: 'Olaplex India distributor', brandsCovered: 'Olaplex', pocName: 'Sneha Kulkarni', pocEmail: 'sneha.k@olaplex-india.example', pocPhone: '+91 99670 88990', avgLeadDays: 6, openPos: 3, slaBreaches30d: 0 },
];

export const INVENTORY_ALERTS: InventoryAlert[] = [
  { id: 'al1', severity: 'rose', body: 'Charlotte Tilbury Pillow Talk + Flawless Filter both under 7 days cover. Tara drafted reorder PO CF-PO-3387 (₹2.1L) — awaiting your approval.', ctaLabel: 'Review PO →', officeTab: 'Replenishment' },
  { id: 'al2', severity: 'amber', body: 'Chanel N°5: 3 customer orders received. Tara auto-raised PO CF-PO-3391 to Chanel India; SLA clock at day 4 of 9.', ctaLabel: 'Track on-demand →', officeTab: 'On-demand' },
  { id: 'al3', severity: 'rose', body: 'D&G The One: supplier SLA breached (day 11 of 8). 1 customer order at risk — Tara escalated to the stockist and flagged for refund-or-wait.', ctaLabel: 'Open on-demand →', officeTab: 'On-demand' },
  { id: 'al4', severity: 'info', body: 'Olaplex No.7 Bonding Oil has sold on-demand 6 weeks running (~14/wk). Tara recommends graduating it to stocked — cuts delivery ~6 days, lifts margin.', ctaLabel: 'See recommendation →', officeTab: 'On-demand' },
];

export function inr(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)} K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function computeCoverDays(onHand: number, weeklyForecast: number): number {
  if (weeklyForecast <= 0) return 999;
  return Math.round((onHand / weeklyForecast) * 7);
}

export function deriveStockedStatus(onHand: number, reorderPoint: number, coverDays: number): StockedStatus {
  if (coverDays < 7 || onHand <= Math.round(reorderPoint * 0.5)) return 'stockout-risk';
  if (onHand <= reorderPoint) return 'reorder';
  if (coverDays > 120) return 'overstock';
  return 'healthy';
}

/** Next sequential id like 's9' / 'd8' / 'sup7' from an existing list. */
export function nextId(prefix: string, existing: { id: string }[]): string {
  const max = existing.reduce((m, x) => {
    const match = x.id.match(/(\d+)$/);
    return Math.max(m, match ? parseInt(match[1], 10) : 0);
  }, 0);
  return `${prefix}${max + 1}`;
}

export interface ExpiryBatch {
  id: string;
  product: string;
  brand: string;
  batch: string;
  units: number;
  expiry: string;
  daysLeft: number;
  value: number;
  suggestedAction: string;
}

export const EXPIRY_BATCHES: ExpiryBatch[] = [
  { id: 'b1', product: 'Leave-In Molecular Mask 50ml', brand: 'K18', batch: 'K18-LOT-2407', units: 14, expiry: 'Sep 2026', daysLeft: 78, value: 42000, suggestedAction: 'Bundle with Maya' },
  { id: 'b2', product: 'Leave-In Molecular Mask 50ml', brand: 'K18', batch: 'K18-LOT-2409', units: 8, expiry: 'Sep 2026', daysLeft: 82, value: 22000, suggestedAction: 'Bundle with Maya' },
  { id: 'b3', product: 'Premier Cru The Cream', brand: 'Caudalie', batch: 'CAU-2403', units: 6, expiry: 'Nov 2026', daysLeft: 151, value: 58800, suggestedAction: 'Monitor' },
  { id: 'b4', product: 'Unseen Sunscreen SPF40', brand: 'Supergoop!', batch: 'SG-2405', units: 9, expiry: 'Oct 2026', daysLeft: 115, value: 34200, suggestedAction: 'Monitor' },
  { id: 'b5', product: 'Protini Polypeptide Cream', brand: 'Drunk Elephant', batch: 'DE-2402', units: 7, expiry: 'Dec 2026', daysLeft: 170, value: 37800, suggestedAction: 'Monitor' },
];
