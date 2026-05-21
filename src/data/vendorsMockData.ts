/** Single source of truth for vendor master, invoices, and MSME payables. */

export type VendorCategory =
  | 'Raw materials'
  | 'Packaging'
  | 'Contract manufacturing'
  | '3PL & logistics'
  | 'SaaS subscriptions'
  | 'Marketing services'
  | 'Legal & professional'
  | 'Facility & admin'
  | 'Ad platform spend'
  | 'Other';

export type InvoiceStatus =
  | 'OVERDUE'
  | 'Pending L1'
  | 'Pending L2'
  | 'Approved'
  | 'Paid'
  | 'Under review'
  | 'Payment initiated';

export type ThreeWayMatch = 'matched' | 'mismatch' | 'unmatched';

export type VendorMsmeType = 'none' | 'msme' | 'foreign';
export type VendorGstinStatus = 'active' | 'inactive' | 'na';
export type VendorMasterStatus = 'Active' | 'On hold' | 'Inactive';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  msmeType: VendorMsmeType;
  udyam?: string;
  gstin?: string;
  gstinStatus: VendorGstinStatus;
  bankLabel: string;
  ifsc?: string;
  ytdSpend: string;
  openInvoices: number;
  avgDtp: number;
  status: VendorMasterStatus;
  pan?: string;
  creditDays: number;
  tdsSection: '194C' | '194I' | '194J' | 'None';
  defaultPaymentMode: 'NEFT' | 'IMPS' | 'RTGS' | 'UPI';
}

export interface Invoice {
  id: string;
  vendorId: string;
  vendorName: string;
  isMsme: boolean;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  amountLabel: string;
  category: VendorCategory;
  match: ThreeWayMatch;
  matchNote?: string;
  tds: string;
  status: InvoiceStatus;
  paidOn?: string;
  poRef?: string;
  ageDays?: number;
}

export type MsmeVendorStatus = 'overdue' | 'approaching' | 'within';

export interface MsmeVendorRow {
  id: string;
  vendor: string;
  udyam: string;
  invoice: string;
  date: string;
  amount: string;
  age: number;
  ageLabel: string;
  status: MsmeVendorStatus;
  action: string;
  needsAction: boolean;
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  'Raw materials',
  'Packaging',
  'Contract manufacturing',
  '3PL & logistics',
  'SaaS subscriptions',
  'Marketing services',
  'Legal & professional',
  'Facility & admin',
  'Ad platform spend',
  'Other',
];

export const INVOICE_STATUS_OPTIONS = [
  'All',
  'Overdue',
  'Pending L1',
  'Pending L2',
  'Approved',
  'Paid',
  'Under review',
] as const;

export const VENDOR_KPI = {
  totalPayables: { value: '₹16.84 L', sub: 'across 24 open invoices · 18 vendors' },
  dueThisWeek: { value: '₹4.28 L', sub: '6 invoices · 2 need approval' },
  overdue: { value: '₹2.92 L', sub: '4 invoices · including 2 MSME @ Section 43B risk' },
  msmeAtRisk: { value: '₹45,000', sub: '2 vendors past 45 days' },
};

export const AGING_BUCKETS = [
  { label: '0–15 days', amount: '₹4.82 L', pct: 29, color: 'success' as const },
  { label: '16–30 days', amount: '₹3.14 L', pct: 19, color: 'success' as const },
  { label: '31–45 days (MSME warning)', amount: '₹81,000', pct: 5, color: 'warning' as const },
  { label: '45+ days (MSME 43B risk)', amount: '₹45,000', pct: 3, color: 'error' as const },
  { label: 'Pending approval / Under review', amount: '₹7.62 L', pct: 45, color: 'gray' as const },
];

export const CATEGORY_AGING = [
  { category: 'Raw materials', buckets: [35, 25, 15, 10, 15] },
  { category: 'Packaging', buckets: [20, 30, 25, 15, 10] },
  { category: '3PL & logistics', buckets: [50, 30, 10, 0, 10] },
  { category: 'Legal & professional', buckets: [10, 20, 10, 5, 55] },
  { category: 'SaaS subscriptions', buckets: [60, 25, 0, 0, 15] },
];

export const VENDORS: Vendor[] = [
  { id: 'fe', name: 'Frostessence Organics', category: 'Raw materials', msmeType: 'none', gstin: '29FROST...0Z9', gstinStatus: 'active', bankLabel: 'HDFC ··3924', ifsc: 'HDFC0001234', ytdSpend: '₹38.4 L', openInvoices: 2, avgDtp: 42, status: 'Active', creditDays: 30, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'a1', name: 'A1 Packaging Solutions', category: 'Packaging', msmeType: 'msme', udyam: 'UDYAM-KA-12-0012345', gstin: '29A1PAC...0Z1', gstinStatus: 'active', bankLabel: 'SBI ··1847', ifsc: 'SBIN0002847', ytdSpend: '₹4.82 L', openInvoices: 1, avgDtp: 38, status: 'Active', creditDays: 45, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'cm', name: 'ColorMax Ingredients', category: 'Raw materials', msmeType: 'none', gstin: '27COLOR...0Z2', gstinStatus: 'active', bankLabel: 'ICICI ··2934', ifsc: 'ICIC0002934', ytdSpend: '₹14.2 L', openInvoices: 1, avgDtp: 35, status: 'Active', creditDays: 30, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'gl', name: 'GreenLeaf Containers', category: 'Packaging', msmeType: 'msme', udyam: 'UDYAM-KA-12-0098765', gstin: '29GREEN...0Z3', gstinStatus: 'active', bankLabel: 'Axis ··4821', ifsc: 'UTIB0004821', ytdSpend: '₹2.42 L', openInvoices: 1, avgDtp: 47, status: 'Active', creditDays: 30, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
  { id: 'pfm', name: 'ProForma Manufacturing', category: 'Contract manufacturing', msmeType: 'none', gstin: '29PROFO...0Z4', gstinStatus: 'active', bankLabel: 'HDFC ··9281', ifsc: 'HDFC0009281', ytdSpend: '₹62.4 L', openInvoices: 0, avgDtp: 36, status: 'Active', creditDays: 40, tdsSection: '194C', defaultPaymentMode: 'RTGS' },
  { id: 'sr', name: 'Shiprocket Multi-channel', category: '3PL & logistics', msmeType: 'none', gstin: '33SHIPR...0Z4', gstinStatus: 'active', bankLabel: 'HDFC ··0034', ifsc: 'HDFC0000034', ytdSpend: '₹28.4 L', openInvoices: 3, avgDtp: 12, status: 'Active', creditDays: 10, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'del', name: 'Delhivery Pvt Ltd', category: '3PL & logistics', msmeType: 'none', gstin: '06DELHV...0Z5', gstinStatus: 'active', bankLabel: 'ICICI ··7281', ifsc: 'ICIC0007281', ytdSpend: '₹16.8 L', openInvoices: 2, avgDtp: 11, status: 'Active', creditDays: 10, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'shp', name: 'Shopify Inc', category: 'SaaS subscriptions', msmeType: 'foreign', gstinStatus: 'na', bankLabel: '— (FX wire)', ytdSpend: '₹4.61 L', openInvoices: 1, avgDtp: 15, status: 'Active', creditDays: 15, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
  { id: 'klv', name: 'Klaviyo Inc', category: 'SaaS subscriptions', msmeType: 'foreign', gstinStatus: 'na', bankLabel: '— (FX wire)', ytdSpend: '₹2.98 L', openInvoices: 1, avgDtp: 15, status: 'Active', creditDays: 15, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
  { id: 'zoho', name: 'Zoho Corp', category: 'SaaS subscriptions', msmeType: 'none', gstin: '33ZOHOZ...0Z5', gstinStatus: 'active', bankLabel: 'HDFC ··8412', ifsc: 'HDFC0008412', ytdSpend: '₹62 K', openInvoices: 0, avgDtp: 28, status: 'Active', creditDays: 30, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
  { id: 'il', name: 'IndusLaw Partners', category: 'Legal & professional', msmeType: 'none', gstin: '29INDUS...0Z6', gstinStatus: 'active', bankLabel: 'HDFC ··2841', ifsc: 'HDFC0002841', ytdSpend: '₹6.84 L', openInvoices: 1, avgDtp: 30, status: 'Active', creditDays: 15, tdsSection: '194J', defaultPaymentMode: 'NEFT' },
  { id: 'meta', name: 'Meta India', category: 'Ad platform spend', msmeType: 'none', gstin: '29METAS...0Z3', gstinStatus: 'active', bankLabel: '(auto-debit)', ytdSpend: '₹38.4 L', openInvoices: 0, avgDtp: 15, status: 'Active', creditDays: 15, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
  { id: 'goog', name: 'Google India', category: 'Ad platform spend', msmeType: 'none', gstin: '29GOOGL...0Z7', gstinStatus: 'active', bankLabel: '(auto-debit)', ytdSpend: '₹24.4 L', openInvoices: 0, avgDtp: 15, status: 'Active', creditDays: 15, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
  { id: 'reg', name: 'Regus Bangalore', category: 'Facility & admin', msmeType: 'none', gstin: '29REGUS...0Z8', gstinStatus: 'active', bankLabel: 'HDFC ··1247', ifsc: 'HDFC0001247', ytdSpend: '₹14.8 L', openInvoices: 1, avgDtp: 30, status: 'Active', creditDays: 30, tdsSection: '194I', defaultPaymentMode: 'NEFT' },
  { id: 'kpmg', name: 'KPMG Tax Advisory', category: 'Legal & professional', msmeType: 'none', gstin: '29KPMG...0Z9', gstinStatus: 'active', bankLabel: 'HDFC ··6628', ifsc: 'HDFC0006628', ytdSpend: '₹14.2 L', openInvoices: 1, avgDtp: 32, status: 'Active', creditDays: 30, tdsSection: '194J', defaultPaymentMode: 'RTGS' },
  { id: 'wax', name: 'WaxLine Suppliers', category: 'Raw materials', msmeType: 'msme', udyam: 'UDYAM-KA-12-0098123', gstin: '29WAXLN...1Z0', gstinStatus: 'active', bankLabel: 'Axis ··3471', ifsc: 'UTIB0003471', ytdSpend: '₹3.84 L', openInvoices: 0, avgDtp: 30, status: 'Active', creditDays: 30, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'gps', name: 'GlossPrint Studios', category: 'Packaging', msmeType: 'msme', udyam: 'UDYAM-KA-12-0024617', gstin: '29GLOSS...1Z1', gstinStatus: 'active', bankLabel: 'SBI ··4012', ifsc: 'SBIN0004012', ytdSpend: '₹2.84 L', openInvoices: 0, avgDtp: 35, status: 'Active', creditDays: 30, tdsSection: '194C', defaultPaymentMode: 'NEFT' },
  { id: 'bp', name: 'Bharat Petroleum (Office fuel)', category: 'Other', msmeType: 'none', gstin: '29BHARP...1Z2', gstinStatus: 'active', bankLabel: '— (corp card)', ytdSpend: '₹84 K', openInvoices: 0, avgDtp: 30, status: 'Active', creditDays: 15, tdsSection: 'None', defaultPaymentMode: 'NEFT' },
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv1', vendorId: 'fe', vendorName: 'Frostessence Organics', isMsme: false, invoiceNo: 'INV-FE-2026-0341', invoiceDate: '14 Apr', dueDate: '14 May', amount: 242000, amountLabel: '₹2,42,000', category: 'Raw materials', match: 'matched', tds: '194C ₹2,420', status: 'OVERDUE', ageDays: 35 },
  { id: 'inv2', vendorId: 'a1', vendorName: 'A1 Packaging Solutions', isMsme: true, invoiceNo: 'INV-A1-2026-0418', invoiceDate: '28 Mar', dueDate: '12 May', amount: 28400, amountLabel: '₹28,400', category: 'Packaging', match: 'matched', tds: '194C ₹284', status: 'OVERDUE', ageDays: 51 },
  { id: 'inv3', vendorId: 'cm', vendorName: 'ColorMax Ingredients', isMsme: false, invoiceNo: 'CM-2026-0408', invoiceDate: '02 Apr', dueDate: '02 May', amount: 118600, amountLabel: '₹1,18,600', category: 'Raw materials', match: 'mismatch', matchNote: '₹500 mismatch', tds: '194C ₹1,186', status: 'Under review', ageDays: 47 },
  { id: 'inv4', vendorId: 'gl', vendorName: 'GreenLeaf Containers', isMsme: true, invoiceNo: 'GL/26-04-02', invoiceDate: '01 Apr', dueDate: '01 May', amount: 16800, amountLabel: '₹16,800', category: 'Packaging', match: 'matched', tds: '—', status: 'OVERDUE', ageDays: 47 },
  { id: 'inv5', vendorId: 'pfm', vendorName: 'ProForma Manufacturing', isMsme: false, invoiceNo: 'PFM-MAR-489', invoiceDate: '20 Mar', dueDate: '30 Apr', amount: 384000, amountLabel: '₹3,84,000', category: 'Contract manufacturing', match: 'matched', tds: '194C ₹3,840', status: 'Paid', paidOn: '28 Apr', ageDays: 0 },
  { id: 'inv6', vendorId: 'sr', vendorName: 'Shiprocket Multi-channel', isMsme: false, invoiceNo: 'SR-2026-04-892', invoiceDate: '30 Apr', dueDate: '10 May', amount: 84200, amountLabel: '₹84,200', category: '3PL & logistics', match: 'matched', tds: '194C ₹842', status: 'Pending L1', ageDays: 9 },
  { id: 'inv7', vendorId: 'del', vendorName: 'Delhivery Pvt Ltd', isMsme: false, invoiceNo: 'DEL-APR-26-12847', invoiceDate: '30 Apr', dueDate: '10 May', amount: 62800, amountLabel: '₹62,800', category: '3PL & logistics', match: 'matched', tds: '194C ₹628', status: 'Approved', ageDays: 9 },
  { id: 'inv8', vendorId: 'shp', vendorName: 'Shopify Inc', isMsme: false, invoiceNo: 'SHP-USA-04-2026', invoiceDate: '01 Apr', dueDate: '16 May', amount: 38400, amountLabel: '₹38,400', category: 'SaaS subscriptions', match: 'matched', tds: '—', status: 'Approved', ageDays: 18 },
  { id: 'inv9', vendorId: 'klv', vendorName: 'Klaviyo Inc', isMsme: false, invoiceNo: 'KLV-2026-0401', invoiceDate: '01 Apr', dueDate: '16 May', amount: 24800, amountLabel: '₹24,800', category: 'SaaS subscriptions', match: 'matched', tds: '—', status: 'Approved', ageDays: 18 },
  { id: 'inv10', vendorId: 'zoho', vendorName: 'Zoho Corp', isMsme: false, invoiceNo: 'ZOH/2026/2841', invoiceDate: '28 Mar', dueDate: '28 Apr', amount: 4800, amountLabel: '₹4,800', category: 'SaaS subscriptions', match: 'matched', tds: '—', status: 'Paid', paidOn: '26 Apr', ageDays: 0 },
  { id: 'inv11', vendorId: 'il', vendorName: 'IndusLaw Partners', isMsme: false, invoiceNo: 'IL-2026-0289', invoiceDate: '15 Apr', dueDate: '30 Apr', amount: 220000, amountLabel: '₹2,20,000', category: 'Legal & professional', match: 'matched', tds: '194J ₹22,000', status: 'Pending L1', ageDays: 19 },
  { id: 'inv12', vendorId: 'meta', vendorName: 'Meta India', isMsme: false, invoiceNo: 'MTI/KA/88421', invoiceDate: '05 Apr', dueDate: '20 Apr', amount: 41200, amountLabel: '₹41,200', category: 'Ad platform spend', match: 'matched', tds: '—', status: 'Paid', paidOn: '18 Apr', ageDays: 0 },
  { id: 'inv13', vendorId: 'reg', vendorName: 'Regus Bangalore', isMsme: false, invoiceNo: 'REG-BLR-0403', invoiceDate: '01 Apr', dueDate: '05 May', amount: 124000, amountLabel: '₹1,24,000', category: 'Facility & admin', match: 'matched', tds: '194I ₹12,400', status: 'Approved', ageDays: 14 },
  { id: 'inv14', vendorId: 'kpmg', vendorName: 'KPMG Tax Advisory', isMsme: false, invoiceNo: 'KPMG-Q4-2026', invoiceDate: '20 Mar', dueDate: '20 Apr', amount: 450000, amountLabel: '₹4,50,000', category: 'Legal & professional', match: 'matched', tds: '194J ₹45,000', status: 'Pending L2', ageDays: 29 },
];

export const RECENT_PAYMENTS = [
  { id: 'pay1', date: '18 Apr', vendor: 'Meta India', amount: '₹41,200', rail: 'Cashfree Payouts NEFT · UTR ending 88421', invoiceId: 'inv12' },
  { id: 'pay2', date: '26 Apr', vendor: 'Zoho Corp', amount: '₹4,800', rail: 'Cashfree Payouts IMPS · UTR ending 22901', invoiceId: 'inv10' },
  { id: 'pay3', date: '28 Apr', vendor: 'ProForma Manufacturing', amount: '₹3,80,160', rail: 'Cashfree Payouts RTGS · UTR ending 77284', invoiceId: 'inv5' },
  { id: 'pay4', date: '14 May', vendor: 'Delhivery Pvt Ltd', amount: '₹62,172', rail: 'Cashfree Payouts NEFT · UTR ending 12847', invoiceId: 'inv7' },
  { id: 'pay5', date: '15 May', vendor: 'Shopify Inc', amount: '₹38,400', rail: 'FX wire · ref SHP-APR', invoiceId: 'inv8' },
];

export const BATCH_READY_DEFAULT_IDS = ['inv7', 'inv8', 'inv9', 'inv13', 'inv6'];

export function formatRupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function parseTdsAmount(tds: string): number {
  const m = tds.match(/₹([\d,]+)/);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

export function getVendorById(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}

/** MSME vendors with open payables — shared with Compliance MSME tab. */
export function buildMsmeVendorRows(invoices: Invoice[]): MsmeVendorRow[] {
  const msmeInvoices = invoices.filter(
    (i) => i.isMsme && !['Paid', 'Payment initiated'].includes(i.status)
  );
  const rows: MsmeVendorRow[] = msmeInvoices.map((inv) => {
    const vendor = getVendorById(inv.vendorId);
    const age = inv.ageDays ?? 0;
    let status: MsmeVendorStatus = 'within';
    if (age > 45) status = 'overdue';
    else if (age > 30) status = 'approaching';
    return {
      id: inv.id,
      vendor: inv.vendorName,
      udyam: vendor?.udyam ?? '—',
      invoice: inv.invoiceNo,
      date: inv.invoiceDate,
      amount: inv.amountLabel,
      age,
      ageLabel: `${age} days`,
      status,
      action: status === 'overdue' ? 'Pay now' : 'Schedule payment',
      needsAction: status !== 'within',
    };
  });
  const withinExtras: MsmeVendorRow[] = [
    { id: 'w0', vendor: 'WaxLine Suppliers', udyam: 'UDYAM-KA-12-0098123', invoice: 'WL/2026/0089', date: '15 Apr', amount: '₹13,600', age: 33, ageLabel: '33 days', status: 'approaching', action: 'Schedule payment', needsAction: true },
    { id: 'w1', vendor: 'GlossPrint Studios', udyam: 'UDYAM-KA-12-0024617', invoice: 'GP-2026-0312', date: '11 Apr', amount: '₹24,600', age: 37, ageLabel: '37 days', status: 'approaching', action: 'Schedule payment', needsAction: true },
  ];
  return [...rows, ...withinExtras].sort((a, b) => b.age - a.age);
}

export const MSME_AGING_BUCKETS = [
  { label: '0–15 days', amount: '₹2.14 L', vendors: 8, color: '#16A34A' },
  { label: '16–30 days', amount: '₹1.42 L', vendors: 5, color: '#16A34A' },
  { label: '31–45 days', amount: '₹81,000', vendors: 3, color: '#D97706' },
  { label: '45+ days', amount: '₹45,000', vendors: 2, color: '#DC2626' },
];

export const VENDOR_ANOMALY = {
  id: 'a1_packaging_may_spike',
  storageKey: 'vendor_anomaly_dismissed_a1_packaging_may_spike',
  vendorId: 'a1',
  vendorName: 'A1 Packaging Solutions',
  monthlyInvoiced: [
    { month: 'Feb 2026', amount: 28000, label: '₹28K' },
    { month: 'Mar 2026', amount: 26000, label: '₹26K' },
    { month: 'Apr 2026', amount: 30000, label: '₹30K' },
    { month: 'May 2026', amount: 84000, label: '₹84K', spike: true },
  ],
  priorThreeMonthAvg: 28000,
  mayAmount: 84000,
  orderVolumeGrowthPct: 12,
  costPerOrderBefore: 140,
  costPerOrderAfter: 420,
};

export function getOldestOpenInvoices(invoices: Invoice[]): Invoice[] {
  return [...invoices]
    .filter((i) => !['Paid', 'Payment initiated'].includes(i.status))
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0))
    .slice(0, 10);
}
