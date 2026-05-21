export type ComplianceTab = 'gst' | 'tcs' | 'tds' | 'msme' | 'calendar';

export const COMPLIANCE_TABS: { id: ComplianceTab; label: string }[] = [
  { id: 'gst', label: 'GST' },
  { id: 'tcs', label: 'TCS' },
  { id: 'tds', label: 'TDS' },
  { id: 'msme', label: 'MSME' },
  { id: 'calendar', label: 'Calendar' },
];

export type GstinStatus = 'active';
export type FilingDot = 'none' | 'warning' | 'error';

export interface GstinRow {
  id: string;
  state: string;
  code: string;
  isHq?: boolean;
  gstinMask: string;
  status: GstinStatus;
  thisMonth: string;
  dot: FilingDot;
  filingHistory: { month: string; gstr1: string; gstr3b: string }[];
  outwardSupplies: string;
  itcClaimed: string;
}

export const GSTINS: GstinRow[] = [
  {
    id: 'ka',
    state: 'Karnataka',
    code: 'KA',
    isHq: true,
    gstinMask: '29ABCDE...1Z1',
    status: 'active',
    thisMonth: 'GSTR-1 filed · GSTR-3B due 20 May',
    dot: 'warning',
    outwardSupplies: '₹42.8 L',
    itcClaimed: '₹6.2 L',
    filingHistory: [
      { month: 'May 2026', gstr1: 'Filed', gstr3b: 'Pending' },
      { month: 'Apr 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Mar 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Feb 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Jan 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Dec 2025', gstr1: 'Filed', gstr3b: 'Filed' },
    ],
  },
  {
    id: 'mh',
    state: 'Maharashtra',
    code: 'MH',
    gstinMask: '27ABCDE...1Z2',
    status: 'active',
    thisMonth: 'GSTR-1 filed · GSTR-3B filed',
    dot: 'none',
    outwardSupplies: '₹18.4 L',
    itcClaimed: '₹2.1 L',
    filingHistory: [
      { month: 'May 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Apr 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Mar 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Feb 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Jan 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Dec 2025', gstr1: 'Filed', gstr3b: 'Filed' },
    ],
  },
  {
    id: 'dl',
    state: 'Delhi',
    code: 'DL',
    gstinMask: '07ABCDE...1Z3',
    status: 'active',
    thisMonth: 'GSTR-1 pending · due 21 May',
    dot: 'warning',
    outwardSupplies: '₹9.2 L',
    itcClaimed: '₹1.4 L',
    filingHistory: [
      { month: 'May 2026', gstr1: 'Pending', gstr3b: 'Not due' },
      { month: 'Apr 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Mar 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Feb 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Jan 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Dec 2025', gstr1: 'Filed', gstr3b: 'Filed' },
    ],
  },
  {
    id: 'tn',
    state: 'Tamil Nadu',
    code: 'TN',
    gstinMask: '33ABCDE...1Z4',
    status: 'active',
    thisMonth: 'All filed',
    dot: 'none',
    outwardSupplies: '₹6.8 L',
    itcClaimed: '₹0.9 L',
    filingHistory: [
      { month: 'May 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Apr 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Mar 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Feb 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Jan 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Dec 2025', gstr1: 'Filed', gstr3b: 'Filed' },
    ],
  },
  {
    id: 'up',
    state: 'Uttar Pradesh',
    code: 'UP',
    gstinMask: '09ABCDE...1Z5',
    status: 'active',
    thisMonth: 'All filed',
    dot: 'none',
    outwardSupplies: '₹5.1 L',
    itcClaimed: '₹0.7 L',
    filingHistory: [
      { month: 'May 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Apr 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Mar 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Feb 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Jan 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Dec 2025', gstr1: 'Filed', gstr3b: 'Filed' },
    ],
  },
  {
    id: 'wb',
    state: 'West Bengal',
    code: 'WB',
    gstinMask: '19ABCDE...1Z6',
    status: 'active',
    thisMonth: 'All filed',
    dot: 'none',
    outwardSupplies: '₹4.6 L',
    itcClaimed: '₹0.6 L',
    filingHistory: [
      { month: 'May 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Apr 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Mar 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Feb 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Jan 2026', gstr1: 'Filed', gstr3b: 'Filed' },
      { month: 'Dec 2025', gstr1: 'Filed', gstr3b: 'Filed' },
    ],
  },
];

export type Gstr2bStatus = 'matched' | 'vendor_not_filed' | 'amount_mismatch' | 'missing_in_2b';

export interface Gstr2bRow {
  id: string;
  invoice: string;
  vendor: string;
  gstin: string;
  date: string;
  value: string;
  gst2b: string;
  gstBooks: string;
  status: Gstr2bStatus;
  statusLabel: string;
  action: string;
  needsAction: boolean;
  mismatchDetail: string;
  vendorEmail: string;
}

export const GSTR2B_ROWS: Gstr2bRow[] = [
  {
    id: '1',
    invoice: 'INV/2026/29381',
    vendor: 'BlueDart Logistics Ltd',
    gstin: '29ABCDE...0Z1',
    date: '12 Apr',
    value: '₹14,290',
    gst2b: '₹2,162',
    gstBooks: '₹2,162',
    status: 'matched',
    statusLabel: 'Matched',
    action: 'Details',
    needsAction: false,
    mismatchDetail: 'Invoice matched between GSTR-2B and books.',
    vendorEmail: 'ap@bluedart.com',
  },
  {
    id: '2',
    invoice: 'INV/2026/29112',
    vendor: 'A1 Packaging Solutions',
    gstin: '29FGHIJ...0Z2',
    date: '08 Apr',
    value: '₹3,400',
    gst2b: '—',
    gstBooks: '₹612',
    status: 'vendor_not_filed',
    statusLabel: 'Vendor not filed',
    action: 'Notify vendor',
    needsAction: true,
    mismatchDetail: 'Vendor has not filed GSTR-1 for this invoice period. ITC of ₹612 is at risk.',
    vendorEmail: 'accounts@a1packaging.in',
  },
  {
    id: '3',
    invoice: 'MTI/KA/88421',
    vendor: 'Meta India Corp (Ads)',
    gstin: '29METAS...0Z3',
    date: '05 Apr',
    value: '₹41,200',
    gst2b: '₹7,416',
    gstBooks: '₹7,416',
    status: 'matched',
    statusLabel: 'Matched',
    action: 'Details',
    needsAction: false,
    mismatchDetail: 'Matched.',
    vendorEmail: 'billing@meta.com',
  },
  {
    id: '4',
    invoice: 'SR/299/SHP',
    vendor: 'Shiprocket Multi-channel',
    gstin: '33SHIPR...0Z4',
    date: '01 Apr',
    value: '₹8,290',
    gst2b: '₹1,492',
    gstBooks: '₹1,290',
    status: 'amount_mismatch',
    statusLabel: 'Amount mismatch',
    action: 'Resolve',
    needsAction: true,
    mismatchDetail: 'GST in 2B (₹1,492) exceeds books (₹1,290) by ₹202. Verify freight allocation.',
    vendorEmail: 'finance@shiprocket.in',
  },
  {
    id: '5',
    invoice: 'ZOH/2026/2841',
    vendor: 'Zoho Corp',
    gstin: '29ZOHOZ...0Z5',
    date: '28 Mar',
    value: '₹4,800',
    gst2b: '—',
    gstBooks: '₹864',
    status: 'missing_in_2b',
    statusLabel: 'Missing in 2B',
    action: 'Notify vendor',
    needsAction: true,
    mismatchDetail: 'Invoice not yet visible in GSTR-2B. Follow up with vendor.',
    vendorEmail: 'billing@zohocorp.com',
  },
];

export interface TcsMarketplaceRow {
  id: string;
  marketplace: string;
  period: string;
  mpReported: string;
  coworker: string;
  form26as: string;
  variance: string;
  varianceNum: number;
  status: 'matched' | 'variance';
  needsAction: boolean;
}

export const TCS_MARKETPLACE_ROWS: TcsMarketplaceRow[] = [
  { id: 'amz', marketplace: 'Amazon India', period: 'May 2026', mpReported: '₹1,24,000', coworker: '₹1,24,000', form26as: '₹1,24,000', variance: '₹0', varianceNum: 0, status: 'matched', needsAction: false },
  { id: 'fk', marketplace: 'Flipkart', period: 'May 2026', mpReported: '₹98,000', coworker: '₹98,000', form26as: '₹96,000', variance: '−₹2,000', varianceNum: -2000, status: 'variance', needsAction: true },
  { id: 'myntra', marketplace: 'Myntra', period: 'May 2026', mpReported: '₹62,000', coworker: '₹62,000', form26as: '₹62,000', variance: '₹0', varianceNum: 0, status: 'matched', needsAction: false },
  { id: 'meesho', marketplace: 'Meesho', period: 'May 2026', mpReported: '₹21,000', coworker: '₹21,000', form26as: '₹20,000', variance: '−₹1,000', varianceNum: -1000, status: 'variance', needsAction: true },
  { id: 'other', marketplace: 'Other', period: 'May 2026', mpReported: '₹16,000', coworker: '₹16,000', form26as: '₹16,000', variance: '₹0', varianceNum: 0, status: 'matched', needsAction: false },
];

export interface TdsInboundRow {
  id: string;
  marketplace: string;
  period: string;
  tdsDeducted: string;
  certificate: string;
  receivedOn: string;
  status: 'verified' | 'chase';
  needsAction: boolean;
}

export const TDS_INBOUND_ROWS: TdsInboundRow[] = [
  { id: 'amz', marketplace: 'Amazon India', period: 'Apr 2026', tdsDeducted: '₹1,18,400', certificate: 'Form 16A', receivedOn: '10 May', status: 'verified', needsAction: false },
  { id: 'fk', marketplace: 'Flipkart', period: 'Apr 2026', tdsDeducted: '₹94,200', certificate: 'Form 16A', receivedOn: '12 May', status: 'verified', needsAction: false },
  { id: 'myntra', marketplace: 'Myntra', period: 'Apr 2026', tdsDeducted: '₹58,200', certificate: 'Form 16A', receivedOn: '14 May', status: 'verified', needsAction: false },
  { id: 'meesho', marketplace: 'Meesho', period: 'Apr 2026', tdsDeducted: '₹19,800', certificate: '—', receivedOn: 'Not received', status: 'chase', needsAction: true },
  { id: 'other', marketplace: 'Other channels', period: 'Apr 2026', tdsDeducted: '₹15,400', certificate: 'Form 16A', receivedOn: '8 May', status: 'verified', needsAction: false },
];

export const TDS_OUTBOUND_SECTIONS = [
  { section: '194C', type: 'Contractors / 3PLs (Shiprocket, Delhivery)', amount: '₹47,000', challan: 'Paid 7 May' },
  { section: '194J', type: 'Professional fees (CA, legal)', amount: '₹12,000', challan: 'Paid 7 May' },
  { section: '194I', type: 'Rent', amount: '₹8,400', challan: 'Paid 7 May' },
  { section: '194Q', type: '(Buyer-side TDS — turnover trigger not met yet)', amount: '₹0', challan: '—' },
];

export const FORM_26Q_QUARTERS = [
  { quarter: 'Q4 FY25-26', status: 'Filed', date: '28 May 2026', note: 'Acknowledged' },
  { quarter: 'Q3 FY25-26', status: 'Filed', date: '28 Feb 2026', note: 'Acknowledged' },
  { quarter: 'Q2 FY25-26', status: 'Filed', date: '30 Nov 2025', note: 'Acknowledged' },
  { quarter: 'Q1 FY26-27', status: 'Not started', date: 'Due 31 Jul 2026', note: 'Prepare after Jun close' },
];

export type { MsmeVendorStatus, MsmeVendorRow } from './vendorsMockData';
export { MSME_AGING_BUCKETS, INITIAL_INVOICES, buildMsmeVendorRows } from './vendorsMockData';

export type CalendarCategory = 'GST' | 'TDS' | 'MSME' | 'Income Tax' | 'ROC' | 'Labor' | 'Other';
export type CalendarBucket = 'today' | 'week' | 'month' | 'quarter';

export interface CalendarItem {
  id: string;
  category: CalendarCategory;
  name: string;
  owner: string;
  due: string;
  dueUrgency: 'overdue' | 'soon' | 'normal';
  status: string;
  statusType: 'success' | 'warning' | 'error' | 'slate';
  action: string;
  state?: string;
  bucket: CalendarBucket;
  needsAction: boolean;
  description: string;
  regulatoryRef: string;
  history: string[];
}

export const CALENDAR_ITEMS: CalendarItem[] = [
  { id: 'pf', category: 'Labor', name: 'PF ECR for May 2026', owner: 'HR', due: '18 May', dueUrgency: 'soon', status: 'Pending', statusType: 'warning', action: 'File now', bucket: 'today', needsAction: true, description: 'Monthly PF electronic challan cum return.', regulatoryRef: 'EPF Act · Rule 12A', history: ['Apr 2026 filed 18 Apr', 'Mar 2026 filed 18 Mar'] },
  { id: 'esi', category: 'Labor', name: 'ESI contribution for May 2026', owner: 'HR', due: '18 May', dueUrgency: 'soon', status: 'Pending', statusType: 'warning', action: 'File now', bucket: 'today', needsAction: true, description: 'ESI contribution for eligible employees.', regulatoryRef: 'ESIC regulations', history: ['Apr 2026 filed 15 Apr'] },
  { id: 'tds-ch', category: 'TDS', name: 'TDS challan deposit (last month)', owner: 'Finance', due: '18 May', dueUrgency: 'normal', status: 'Filed ✓', statusType: 'success', action: 'View', bucket: 'today', needsAction: false, description: 'Monthly TDS deposit for April deductions.', regulatoryRef: 'Income Tax Act · Section 200', history: ['Paid 7 May 2026'] },
  { id: 'gstr3b-ka', category: 'GST', name: 'GSTR-3B (KA)', owner: 'Finance Controller', due: '20 May', dueUrgency: 'soon', status: 'Pending', statusType: 'warning', action: 'Generate', state: 'KA', bucket: 'week', needsAction: true, description: 'Monthly GST return for Karnataka GSTIN.', regulatoryRef: 'Section 39 CGST Act', history: ['Apr filed 18 Apr', 'Mar filed 20 Mar'] },
  { id: 'gstr1-dl', category: 'GST', name: 'GSTR-1 (DL)', owner: 'Finance Controller', due: '21 May', dueUrgency: 'soon', status: 'Pending', statusType: 'warning', action: 'Generate', state: 'DL', bucket: 'week', needsAction: true, description: 'Outward supplies return for Delhi.', regulatoryRef: 'Section 37 CGST Act', history: ['Apr filed 11 Apr'] },
  { id: 'f16a', category: 'TDS', name: 'Form 16A certificates (Q4 deductees)', owner: 'Finance Controller', due: '31 May', dueUrgency: 'normal', status: 'Pending', statusType: 'slate', action: 'Generate', bucket: 'week', needsAction: true, description: 'TDS certificates for non-salary deductees.', regulatoryRef: 'Rule 31', history: ['Q3 issued 15 Feb'] },
  { id: 'pt-mh', category: 'Labor', name: 'Professional Tax (MH employees)', owner: 'HR', due: '21 May', dueUrgency: 'soon', status: 'Pending', statusType: 'warning', action: 'File', state: 'MH', bucket: 'week', needsAction: true, description: 'Maharashtra professional tax.', regulatoryRef: 'State PT Act', history: ['Apr filed 20 Apr'] },
  { id: 'pt-ka', category: 'Labor', name: 'Professional Tax (KA employees)', owner: 'HR', due: '20 May', dueUrgency: 'soon', status: 'Pending', statusType: 'warning', action: 'File', state: 'KA', bucket: 'week', needsAction: true, description: 'Karnataka professional tax.', regulatoryRef: 'State PT Act', history: ['Apr filed 18 Apr'] },
  { id: 'adv-tax', category: 'Income Tax', name: 'Advance Tax Q1 FY26-27 instalment', owner: 'Founder + CA', due: '15 June', dueUrgency: 'normal', status: 'Pending', statusType: 'slate', action: 'Calculate', bucket: 'month', needsAction: true, description: 'First advance tax instalment.', regulatoryRef: 'Section 211', history: ['Q4 FY25-26 paid 15 Mar'] },
  { id: 'dpt3', category: 'ROC', name: 'DPT-3 (Return of Deposits)', owner: 'CS', due: '30 June', dueUrgency: 'normal', status: 'Pending', statusType: 'slate', action: 'Generate', bucket: 'month', needsAction: true, description: 'Annual return of deposits.', regulatoryRef: 'Companies Act', history: ['FY24-25 filed 28 Jun 2025'] },
  { id: 'gstr1-all', category: 'GST', name: 'GSTR-1 (all states, May)', owner: 'Finance Controller', due: '11 June', dueUrgency: 'normal', status: 'Pending', statusType: 'slate', action: 'Generate', bucket: 'month', needsAction: true, description: 'Consolidated outward supplies all GSTINs.', regulatoryRef: 'Section 37 CGST Act', history: ['Apr filed 11 May'] },
  { id: '26q', category: 'TDS', name: 'Form 26Q Q1 FY26-27', owner: 'Finance Controller', due: '31 July', dueUrgency: 'normal', status: 'Not started', statusType: 'slate', action: 'Track', bucket: 'month', needsAction: true, description: 'Quarterly TDS return.', regulatoryRef: 'Rule 31A', history: ['Q4 FY25-26 filed 28 May'] },
  { id: 'msme1', category: 'MSME', name: 'MSME-1 (H1 FY26-27)', owner: 'Finance Controller', due: '31 October', dueUrgency: 'normal', status: 'Not started', statusType: 'slate', action: 'Track', bucket: 'quarter', needsAction: true, description: 'Half-yearly MSME return.', regulatoryRef: 'MSME Development Act', history: ['H2 FY24-25 filed 30 Oct 2025'] },
  { id: 'audit', category: 'ROC', name: 'Statutory audit kick-off', owner: 'Founder + Auditor', due: '1 July', dueUrgency: 'normal', status: 'Not started', statusType: 'slate', action: 'Track', bucket: 'quarter', needsAction: false, description: 'Annual statutory audit planning.', regulatoryRef: 'Companies Act · Section 143', history: ['FY24-25 completed Sep 2025'] },
  { id: 'tax-audit', category: 'Income Tax', name: 'Tax audit (Section 44AB)', owner: 'Finance Controller + CA', due: '30 September', dueUrgency: 'normal', status: 'Not started', statusType: 'slate', action: 'Track', bucket: 'quarter', needsAction: false, description: 'Tax audit if turnover threshold met.', regulatoryRef: 'Section 44AB', history: ['FY24-25 completed 28 Sep 2025'] },
];

export const UPCOMING_FILINGS = [
  { label: 'GSTR-1 (DL)', date: '21 May', status: 'Pending' },
  { label: 'GSTR-3B (KA)', date: '20 May', status: 'Pending' },
  { label: 'PF ECR', date: 'Today', status: 'Action needed' },
];

export const HEALTH_BREAKDOWN = [
  { item: 'GSTR-2B mismatches (12 invoices)', impact: '−4 pts' },
  { item: 'MSME-1 overdue by 18 days', impact: '−2 pts' },
];

export const FILING_PACK_FORMS = ['GSTR-1', 'GSTR-3B', 'Form 26Q', 'MSME-1', 'All forms'];
export const FILING_PACK_PERIODS = ['This Month', 'Last Month', 'Custom'];
export const FILING_PACK_GSTINS = ['Karnataka (KA)', 'Maharashtra (MH)', 'Delhi (DL)', 'Tamil Nadu (TN)', 'Uttar Pradesh (UP)', 'West Bengal (WB)'];

export const FILING_PACK_STEPS = [
  'Pulling outward supplies…',
  'Reconciling 2B…',
  'Computing TCS…',
  'Composing filing pack…',
];

export function categoryChipClass(cat: CalendarCategory): string {
  const map: Record<CalendarCategory, string> = {
    GST: 'bg-purple-50 text-primary border-purple-100',
    TDS: 'bg-gray-100 text-navy-950 border-gray-200',
    MSME: 'bg-warning-50 text-warning border-warning-100',
    'Income Tax': 'bg-gray-100 text-navy-950 border-gray-200',
    ROC: 'bg-gray-100 text-navy-950 border-gray-200',
    Labor: 'bg-success-50 text-success border-success-100',
    Other: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return map[cat];
}
