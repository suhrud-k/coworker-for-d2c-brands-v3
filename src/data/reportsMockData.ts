import type { LucideIcon } from 'lucide-react';
import {
  FileBarChart,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  ReceiptText,
  SplitSquareHorizontal,
  ShieldAlert,
  FileCheck,
  GitMerge,
  Receipt,
  Percent,
  CreditCard,
  Landmark,
  Truck,
  Trophy,
  Grid3x3,
  PackageX,
} from 'lucide-react';

export type ReportCategory = 'all' | 'financial' | 'marketplace' | 'tax' | 'payments' | 'sku';
export type ReportDateRange = 'Till Date' | 'Last Month' | 'Last Quarter' | 'Last Financial Year' | 'Custom';
export type ReportEntity = 'All entities' | 'Karnataka (KA)' | 'Maharashtra (MH)' | 'Tamil Nadu (TN)' | 'Delhi (DL)' | 'Uttar Pradesh (UP)' | 'West Bengal (WB)';

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: Exclude<ReportCategory, 'all'>;
  icon: LucideIcon;
  lastGenerated: string;
}

export interface StatementNode {
  id: string;
  label: string;
  current: string;
  comparison: string;
  section?: boolean;
  subtotal?: boolean;
  highlight?: boolean;
  coworkerLine?: boolean;
  children?: StatementNode[];
  source?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
}

export interface TableReportData {
  columns: TableColumn[];
  rows: Record<string, string>[];
}

export const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'financial', label: 'Financial Statements' },
  { id: 'marketplace', label: 'Marketplace Ops' },
  { id: 'tax', label: 'Tax & Compliance' },
  { id: 'payments', label: 'Payments & Banking' },
  { id: 'sku', label: 'SKU & Inventory' },
];

export const CATEGORY_LABELS: Record<Exclude<ReportCategory, 'all'>, string> = {
  financial: 'Financial Statements',
  marketplace: 'Marketplace Operations',
  tax: 'Tax & Compliance',
  payments: 'Payments & Banking',
  sku: 'SKU & Inventory',
};

export const DATE_RANGES: ReportDateRange[] = [
  'Till Date',
  'Last Month',
  'Last Quarter',
  'Last Financial Year',
  'Custom',
];

export const ENTITIES: ReportEntity[] = [
  'All entities',
  'Karnataka (KA)',
  'Maharashtra (MH)',
  'Tamil Nadu (TN)',
  'Delhi (DL)',
  'Uttar Pradesh (UP)',
  'West Bengal (WB)',
];

export const GENERATE_MESSAGES = [
  'Pulling Tally Prime…',
  'Pulling Cashfree PG…',
  'Pulling 5 marketplace settlements…',
  'Reconciling GST…',
  'Composing Schedule III statement…',
];

export const REPORTS: ReportDefinition[] = [
  { id: 'pnl', name: 'Profit & Loss Statement', description: 'Schedule III P&L with channel-wise revenue breakdown', category: 'financial', icon: FileBarChart, lastGenerated: '2 hrs ago' },
  { id: 'balance-sheet', name: 'Balance Sheet', description: 'Schedule III B/S including pending settlements as receivables', category: 'financial', icon: FileSpreadsheet, lastGenerated: '2 hrs ago' },
  { id: 'cash-flow', name: 'Cash Flow Statement', description: 'Indian GAAP indirect method — operating, investing, financing', category: 'financial', icon: TrendingUp, lastGenerated: 'Yesterday' },
  { id: 'marketplace-orders', name: 'Marketplace-wise Orders', description: 'All orders by channel with status, AOV, GMV, returns', category: 'marketplace', icon: Boxes, lastGenerated: '4 hrs ago' },
  { id: 'settlement-recon', name: 'Settlement Reconciliation', description: 'Three-way match: marketplace report → CoWorker → bank credit', category: 'marketplace', icon: ReceiptText, lastGenerated: '1 hr ago' },
  { id: 'settlement-breakdown', name: 'Settlement Breakdown', description: 'Order payments vs non-order credits/debits per marketplace', category: 'marketplace', icon: SplitSquareHorizontal, lastGenerated: '3 hrs ago' },
  { id: 'charges-variance', name: 'Marketplace Charges Variance', description: 'Actual deductions vs contracted rate card — flags overcharges', category: 'marketplace', icon: ShieldAlert, lastGenerated: '5 hrs ago' },
  { id: 'gstr1', name: 'GSTR-1 Filing Pack', description: 'Outward supplies with multi-state HSN summary, ready for upload', category: 'tax', icon: FileCheck, lastGenerated: 'Yesterday' },
  { id: 'gstr2b', name: 'GSTR-2B Reconciliation', description: 'Vendor invoices in GSTR-2B vs your books, mismatch flags', category: 'tax', icon: GitMerge, lastGenerated: '6 hrs ago' },
  { id: 'tds-194o', name: 'TDS Statement (194-O)', description: 'Marketplace TDS deductions, certificates collected, claims due', category: 'tax', icon: Receipt, lastGenerated: '2 days ago' },
  { id: 'tcs-recon', name: 'TCS Reconciliation (Section 52)', description: 'TCS as per marketplaces vs Form 26AS vs CoWorker calculations', category: 'tax', icon: Percent, lastGenerated: '1 day ago' },
  { id: 'pg-settlements', name: 'Payment Gateway Settlements', description: 'Cashfree + Razorpay settlements, payouts to bank, fees deducted', category: 'payments', icon: CreditCard, lastGenerated: '30 min ago' },
  { id: 'bank-recon', name: 'Bank Reconciliation Statement', description: 'Bank balance vs book balance vs in-transit, all bank accounts', category: 'payments', icon: Landmark, lastGenerated: '4 hrs ago' },
  { id: 'cod-remittance', name: 'COD Remittance Report', description: 'Shiprocket + Delhivery COD collections, remittance schedule, dues', category: 'payments', icon: Truck, lastGenerated: '8 hrs ago' },
  { id: 'sku-profitability', name: 'SKU Profitability Ranking', description: 'All SKUs ranked by contribution margin, channel-wise', category: 'sku', icon: Trophy, lastGenerated: '3 hrs ago' },
  { id: 'channel-sku-matrix', name: 'Channel × SKU Margin Matrix', description: "Same SKU's margin per channel — surfaces channel-specific losses", category: 'sku', icon: Grid3x3, lastGenerated: '5 hrs ago' },
  { id: 'returns-by-sku', name: 'Returns by SKU', description: 'Return rate per SKU per channel, top offenders, ₹ lost', category: 'sku', icon: PackageX, lastGenerated: '1 hr ago' },
];

export function getReportById(id: string): ReportDefinition | undefined {
  return REPORTS.find((r) => r.id === id);
}

const SOURCE = 'Sourced from Tally Prime + Cashfree PG · synced 12 min ago · 23 line items';

export function getPnLStatement(): StatementNode[] {
  return [
    { id: 'sec-rev', label: 'I. REVENUE', current: '', comparison: '', section: true, children: [
      { id: 'rev-ops', label: 'Revenue from Operations', current: '₹14,30,00,000', comparison: '₹12,20,00,000', source: SOURCE, children: [
        { id: 'sale-gross', label: 'Sale of products (gross)', current: '₹15,12,00,000', comparison: '₹12,98,00,000', children: [
          { id: 'ch-shopify', label: 'Shopify', current: '₹4,82,00,000', comparison: '₹4,10,00,000', source: SOURCE },
          { id: 'ch-amazon', label: 'Amazon', current: '₹4,61,00,000', comparison: '₹4,02,00,000', source: SOURCE },
          { id: 'ch-flipkart', label: 'Flipkart', current: '₹3,84,00,000', comparison: '₹3,45,00,000', source: SOURCE },
          { id: 'ch-myntra', label: 'Myntra', current: '₹2,41,00,000', comparison: '₹2,12,00,000', source: SOURCE },
          { id: 'ch-meesho', label: 'Meesho', current: '₹44,00,000', comparison: '₹29,00,000', source: SOURCE },
        ]},
        { id: 'returns', label: 'Less: Sales returns and allowances', current: '(₹82,00,000)', comparison: '(₹78,00,000)', children: [
          { id: 'ret-shopify', label: 'Shopify returns', current: '(₹18,00,000)', comparison: '(₹16,00,000)', source: SOURCE },
          { id: 'ret-amazon', label: 'Amazon returns', current: '(₹24,00,000)', comparison: '(₹22,00,000)', source: SOURCE },
          { id: 'ret-flipkart', label: 'Flipkart returns', current: '(₹22,00,000)', comparison: '(₹20,00,000)', source: SOURCE },
          { id: 'ret-myntra', label: 'Myntra returns', current: '(₹14,00,000)', comparison: '(₹14,00,000)', source: SOURCE },
          { id: 'ret-meesho', label: 'Meesho returns', current: '(₹4,00,000)', comparison: '(₹6,00,000)', source: SOURCE },
        ]},
        { id: 'net-sales', label: 'Net sales', current: '₹14,30,00,000', comparison: '₹12,20,00,000', subtotal: true },
      ]},
      { id: 'other-op', label: 'Other operating income', current: '₹8,40,000', comparison: '₹6,20,000', children: [
        { id: 'rebates', label: 'Marketplace rebates and reimbursements', current: '₹5,20,000', comparison: '₹3,80,000', source: SOURCE },
        { id: 'listing', label: 'Listing fee credits', current: '₹3,20,000', comparison: '₹2,40,000', source: SOURCE },
      ]},
      { id: 'other-inc', label: 'Other income', current: '₹6,00,000', comparison: '₹5,20,000', children: [
        { id: 'interest', label: 'Interest on deposits', current: '₹2,40,000', comparison: '₹2,10,000', source: SOURCE },
        { id: 'fx', label: 'Foreign exchange gain', current: '₹1,20,000', comparison: '₹90,000', source: SOURCE },
        { id: 'misc', label: 'Miscellaneous income', current: '₹2,40,000', comparison: '₹2,20,000', source: SOURCE },
      ]},
      { id: 'total-rev', label: 'Total revenue', current: '₹15,44,40,000', comparison: '₹13,31,40,000', subtotal: true },
    ]},
    { id: 'sec-exp', label: 'II. EXPENSES', current: '', comparison: '', section: true, children: [
      { id: 'cogs', label: 'Cost of materials consumed', current: '₹4,82,00,000', comparison: '₹4,10,00,000', children: [
        { id: 'raw', label: 'Raw materials', current: '₹3,42,00,000', comparison: '₹2,92,00,000', source: SOURCE },
        { id: 'pack', label: 'Packaging materials', current: '₹68,00,000', comparison: '₹58,00,000', source: SOURCE },
        { id: 'cm', label: 'Contract manufacturing charges', current: '₹72,00,000', comparison: '₹60,00,000', source: SOURCE },
      ]},
      { id: 'inv-change', label: 'Changes in inventories of finished goods', current: '(₹24,00,000)', comparison: '(₹18,00,000)', source: SOURCE },
      { id: 'emp', label: 'Employee benefits expense', current: '₹1,84,00,000', comparison: '₹1,72,00,000', children: [
        { id: 'sal', label: 'Salaries, wages and bonus', current: '₹1,52,00,000', comparison: '₹1,42,00,000', source: SOURCE },
        { id: 'pf', label: 'Contribution to provident and other funds', current: '₹18,00,000', comparison: '₹16,00,000', source: SOURCE },
        { id: 'welfare', label: 'Staff welfare expenses', current: '₹14,00,000', comparison: '₹14,00,000', source: SOURCE },
      ]},
      { id: 'fin-cost', label: 'Finance costs', current: '₹42,00,000', comparison: '₹38,00,000', children: [
        { id: 'int-borr', label: 'Interest on borrowings', current: '₹36,00,000', comparison: '₹32,00,000', source: SOURCE },
        { id: 'oth-fin', label: 'Other finance charges', current: '₹6,00,000', comparison: '₹6,00,000', source: SOURCE },
      ]},
      { id: 'depr', label: 'Depreciation and amortisation expense', current: '₹28,00,000', comparison: '₹26,00,000', source: SOURCE },
      { id: 'oth-exp', label: 'Other expenses', current: '₹5,12,00,000', comparison: '₹4,48,00,000', children: [
        { id: 'mkt-charges', label: 'Marketplace charges', current: '₹2,84,00,000', comparison: '₹2,41,00,000', children: [
          { id: 'comm', label: 'Commission (by channel)', current: '₹1,42,00,000', comparison: '₹1,21,00,000', source: SOURCE },
          { id: 'ship', label: 'Shipping fees (by channel)', current: '₹68,00,000', comparison: '₹58,00,000', source: SOURCE },
          { id: 'fixed', label: 'Fixed fees (by channel)', current: '₹32,00,000', comparison: '₹28,00,000', source: SOURCE },
          { id: 'coll', label: 'Collection fees (by channel)', current: '₹24,00,000', comparison: '₹20,00,000', source: SOURCE },
          { id: 'pick', label: 'Pick-and-pack fees (by channel)', current: '₹12,00,000', comparison: '₹10,00,000', source: SOURCE },
          { id: 'rev-log', label: 'Reverse logistics', current: '₹6,00,000', comparison: '₹4,00,000', source: SOURCE },
        ]},
        { id: 'ads', label: 'Advertising and sales promotion', current: '₹1,24,00,000', comparison: '₹1,08,00,000', children: [
          { id: 'meta', label: 'Meta Ads', current: '₹52,00,000', comparison: '₹48,00,000', source: SOURCE },
          { id: 'google', label: 'Google Ads', current: '₹38,00,000', comparison: '₹32,00,000', source: SOURCE },
          { id: 'pla', label: 'Marketplace PLAs', current: '₹34,00,000', comparison: '₹28,00,000', source: SOURCE },
        ]},
        { id: 'logistics', label: 'Logistics and warehousing', current: '₹48,00,000', comparison: '₹42,00,000', children: [
          { id: '3pl', label: 'Third-party logistics', current: '₹28,00,000', comparison: '₹24,00,000', source: SOURCE },
          { id: 'lm', label: 'Last-mile courier', current: '₹12,00,000', comparison: '₹10,00,000', source: SOURCE },
          { id: 'wh', label: 'Warehouse rent', current: '₹8,00,000', comparison: '₹8,00,000', source: SOURCE },
        ]},
        { id: 'rent', label: 'Rent', current: '₹12,00,000', comparison: '₹12,00,000', source: SOURCE },
        { id: 'power', label: 'Power and fuel', current: '₹4,00,000', comparison: '₹3,60,000', source: SOURCE },
        { id: 'bank-ch', label: 'Bank charges', current: '₹8,00,000', comparison: '₹7,20,000', source: SOURCE },
        { id: 'misc-exp', label: 'Miscellaneous expenses', current: '₹14,00,000', comparison: '₹12,80,000', source: SOURCE },
      ]},
      { id: 'total-exp', label: 'Total expenses', current: '₹12,48,00,000', comparison: '₹11,08,00,000', subtotal: true },
    ]},
    { id: 'pbt-ex', label: 'III. PROFIT BEFORE EXCEPTIONAL ITEMS AND TAX', current: '₹2,96,40,000', comparison: '₹2,23,40,000', subtotal: true },
    { id: 'exceptional', label: 'IV. EXCEPTIONAL ITEMS', current: '—', comparison: '—', source: SOURCE },
    { id: 'pbt', label: 'V. PROFIT BEFORE TAX', current: '₹2,96,40,000', comparison: '₹2,23,40,000', subtotal: true },
    { id: 'tax', label: 'VI. TAX EXPENSE', current: '', comparison: '', children: [
      { id: 'cur-tax', label: 'Current tax', current: '₹74,10,000', comparison: '₹55,85,000', source: SOURCE },
      { id: 'def-tax', label: 'Deferred tax (income) / charge', current: '(₹4,20,000)', comparison: '(₹2,10,000)', source: SOURCE },
      { id: 'mat', label: 'MAT credit utilised', current: '—', comparison: '—', source: SOURCE },
    ]},
    { id: 'pat', label: 'VII. PROFIT FOR THE PERIOD', current: '₹2,26,50,000', comparison: '₹1,69,65,000', subtotal: true },
    { id: 'eps', label: 'VIII. EARNINGS PER EQUITY SHARE', current: '', comparison: '', children: [
      { id: 'eps-b', label: 'Basic', current: '₹18.42', comparison: '₹13.80', source: SOURCE },
      { id: 'eps-d', label: 'Diluted', current: '₹18.12', comparison: '₹13.58', source: SOURCE },
    ]},
  ];
}

export function getBalanceSheetStatement(): StatementNode[] {
  return [
    { id: 'sec-el', label: 'I. EQUITY AND LIABILITIES', current: '', comparison: '', section: true, children: [
      { id: 'sh-funds', label: "Shareholders' funds", current: '₹5,38,00,000', comparison: '₹4,92,00,000', children: [
        { id: 'sh-cap', label: 'Share capital', current: '₹1,20,00,000', comparison: '₹1,20,00,000', children: [
          { id: 'auth', label: 'Authorised', current: '₹2,00,00,000', comparison: '₹2,00,00,000', source: SOURCE },
          { id: 'paid', label: 'Issued, subscribed and paid-up', current: '₹1,20,00,000', comparison: '₹1,20,00,000', source: SOURCE },
        ]},
        { id: 'reserves', label: 'Reserves and surplus', current: '₹4,18,00,000', comparison: '₹3,72,00,000', children: [
          { id: 'gen-res', label: 'General reserve', current: '₹1,80,00,000', comparison: '₹1,60,00,000', source: SOURCE },
          { id: 'premium', label: 'Securities premium', current: '₹1,20,00,000', comparison: '₹1,20,00,000', source: SOURCE },
          { id: 'surplus', label: 'Surplus in P&L', current: '₹1,18,00,000', comparison: '₹92,00,000', source: SOURCE },
        ]},
      ]},
      { id: 'ncl', label: 'Non-current liabilities', current: '₹2,68,00,000', comparison: '₹2,45,00,000', children: [
        { id: 'lt-borr', label: 'Long-term borrowings', current: '₹2,45,00,000', comparison: '₹2,22,00,000', source: SOURCE },
        { id: 'dtl', label: 'Deferred tax liabilities (net)', current: '₹23,00,000', comparison: '₹23,00,000', source: SOURCE },
      ]},
      { id: 'cl', label: 'Current liabilities', current: '₹3,01,00,000', comparison: '₹2,78,00,000', children: [
        { id: 'st-borr', label: 'Short-term borrowings', current: '₹84,00,000', comparison: '₹72,00,000', source: SOURCE },
        { id: 'tp', label: 'Trade payables', current: '₹1,24,00,000', comparison: '₹1,18,00,000', source: SOURCE },
        { id: 'ocl', label: 'Other current liabilities', current: '₹68,00,000', comparison: '₹62,00,000', children: [
          { id: 'gst-pay', label: 'GST payable', current: '₹28,00,000', comparison: '₹24,00,000', source: SOURCE },
          { id: 'tds-pay', label: 'TDS payable', current: '₹12,00,000', comparison: '₹10,00,000', source: SOURCE },
          { id: 'tcs-pay', label: 'TCS payable', current: '₹8,00,000', comparison: '₹8,00,000', source: SOURCE },
          { id: 'refunds', label: 'Customer refunds payable', current: '₹20,00,000', comparison: '₹20,00,000', source: SOURCE },
        ]},
        { id: 'stp', label: 'Short-term provisions', current: '₹25,00,000', comparison: '₹26,00,000', source: SOURCE },
      ]},
      { id: 'total-el', label: 'Total — Equity and Liabilities', current: '₹11,07,00,000', comparison: '₹10,15,00,000', subtotal: true, highlight: true },
    ]},
    { id: 'sec-assets', label: 'II. ASSETS', current: '', comparison: '', section: true, children: [
      { id: 'nca', label: 'Non-current assets', current: '₹3,42,00,000', comparison: '₹3,18,00,000', children: [
        { id: 'ppe', label: 'Property, plant and equipment (PPE)', current: '₹2,84,00,000', comparison: '₹2,62,00,000', source: SOURCE },
        { id: 'intang', label: 'Intangible assets', current: '₹38,00,000', comparison: '₹36,00,000', source: SOURCE },
        { id: 'dt-asset', label: 'Deferred tax assets (net)', current: '₹20,00,000', comparison: '₹20,00,000', source: SOURCE },
      ]},
      { id: 'ca', label: 'Current assets', current: '₹7,65,00,000', comparison: '₹6,97,00,000', children: [
        { id: 'inv', label: 'Inventories', current: '₹2,84,00,000', comparison: '₹2,60,00,000', children: [
          { id: 'fg-wh', label: 'At own warehouse', current: '₹1,12,00,000', comparison: '₹1,02,00,000', source: SOURCE },
          { id: 'fg-fba', label: 'At FBA (Amazon)', current: '₹68,00,000', comparison: '₹62,00,000', source: SOURCE },
          { id: 'fg-fk', label: 'At Flipkart Smart', current: '₹54,00,000', comparison: '₹50,00,000', source: SOURCE },
          { id: 'fg-myn', label: 'At Myntra fulfilment', current: '₹38,00,000', comparison: '₹34,00,000', source: SOURCE },
          { id: 'fg-transit', label: 'In transit', current: '₹12,00,000', comparison: '₹12,00,000', source: SOURCE },
        ]},
        { id: 'tr', label: 'Trade receivables', current: '₹1,24,00,000', comparison: '₹1,18,00,000', source: SOURCE },
        { id: 'cash', label: 'Cash and cash equivalents', current: '₹1,42,00,000', comparison: '₹1,28,00,000', children: [
          { id: 'cash-hand', label: 'Cash on hand', current: '₹2,00,000', comparison: '₹2,00,000', source: SOURCE },
          { id: 'hdfc', label: 'HDFC Current A/c', current: '₹84,00,000', comparison: '₹76,00,000', source: SOURCE },
          { id: 'icici', label: 'ICICI Current A/c', current: '₹56,00,000', comparison: '₹50,00,000', source: SOURCE },
        ]},
        { id: 'pending', label: 'Pending settlements receivable', current: '₹52,40,000', comparison: '₹48,20,000', coworkerLine: true, children: [
          { id: 'cf-pg', label: 'Cashfree PG settlements pending', current: '₹12,40,000', comparison: '₹11,20,000', source: SOURCE, coworkerLine: true },
          { id: 'rz-pg', label: 'Razorpay settlements pending', current: '₹4,80,000', comparison: '₹4,20,000', source: SOURCE, coworkerLine: true },
          { id: 'amz-p', label: 'Amazon payouts pending', current: '₹14,20,000', comparison: '₹13,40,000', source: SOURCE, coworkerLine: true },
          { id: 'fk-p', label: 'Flipkart payouts pending', current: '₹11,80,000', comparison: '₹10,60,000', source: SOURCE, coworkerLine: true },
          { id: 'myn-p', label: 'Myntra payouts pending', current: '₹6,40,000', comparison: '₹5,80,000', source: SOURCE, coworkerLine: true },
          { id: 'mee-p', label: 'Meesho payouts pending', current: '₹2,80,000', comparison: '₹2,40,000', source: SOURCE, coworkerLine: true },
        ]},
        { id: 'gst-in', label: 'GST input credit', current: '₹28,00,000', comparison: '₹24,00,000', source: SOURCE },
        { id: 'tds-rec', label: 'TDS receivable', current: '₹8,00,000', comparison: '₹8,00,000', source: SOURCE },
        { id: 'tcs-rec', label: 'TCS receivable', current: '₹6,00,000', comparison: '₹6,00,000', source: SOURCE },
      ]},
      { id: 'total-assets', label: 'Total — Assets', current: '₹11,07,00,000', comparison: '₹10,15,00,000', subtotal: true, highlight: true },
    ]},
  ];
}

export function getCashFlowStatement(): StatementNode[] {
  return [
    { id: 'sec-a', label: 'A. CASH FLOW FROM OPERATING ACTIVITIES', current: '', comparison: '', section: true, children: [
      { id: 'pbt', label: 'Profit before tax', current: '₹2,96,40,000', comparison: '₹2,23,40,000', source: SOURCE },
      { id: 'adj', label: 'Adjustments for:', current: '', comparison: '', children: [
        { id: 'depr', label: 'Depreciation and amortisation', current: '₹28,00,000', comparison: '₹26,00,000', source: SOURCE },
        { id: 'fc', label: 'Finance costs', current: '₹42,00,000', comparison: '₹38,00,000', source: SOURCE },
        { id: 'ii', label: 'Interest income', current: '(₹2,40,000)', comparison: '(₹2,10,000)', source: SOURCE },
      ]},
      { id: 'op-profit', label: 'Operating profit before working capital changes', current: '₹3,64,00,000', comparison: '₹2,85,30,000', subtotal: true },
      { id: 'wc', label: 'Changes in working capital:', current: '', comparison: '', children: [
        { id: 'tr-ch', label: '(Increase) / decrease in trade receivables', current: '(₹6,00,000)', comparison: '(₹4,20,000)', source: SOURCE },
        { id: 'pend-ch', label: '(Increase) / decrease in pending settlements receivable', current: '(₹4,20,000)', comparison: '(₹3,80,000)', source: SOURCE, coworkerLine: true },
        { id: 'inv-ch', label: '(Increase) / decrease in inventories', current: '(₹24,00,000)', comparison: '(₹18,00,000)', source: SOURCE },
        { id: 'tp-ch', label: 'Increase / (decrease) in trade payables', current: '₹6,00,000', comparison: '₹4,80,000', source: SOURCE },
      ]},
      { id: 'cash-gen', label: 'Cash generated from operations', current: '₹3,35,80,000', comparison: '₹2,64,10,000', subtotal: true },
      { id: 'tax-paid', label: 'Less: Income tax paid', current: '(₹72,00,000)', comparison: '(₹54,00,000)', source: SOURCE },
      { id: 'net-a', label: 'Net cash from operating activities (A)', current: '₹2,63,80,000', comparison: '₹2,10,10,000', subtotal: true },
    ]},
    { id: 'sec-b', label: 'B. CASH FLOW FROM INVESTING ACTIVITIES', current: '', comparison: '', section: true, children: [
      { id: 'ppe-buy', label: 'Purchase of PPE', current: '(₹48,00,000)', comparison: '(₹42,00,000)', source: SOURCE },
      { id: 'inv-buy', label: 'Purchase of investments', current: '(₹12,00,000)', comparison: '(₹10,00,000)', source: SOURCE },
      { id: 'int-rec', label: 'Interest received', current: '₹2,40,000', comparison: '₹2,10,000', source: SOURCE },
      { id: 'net-b', label: 'Net cash from investing activities (B)', current: '(₹57,60,000)', comparison: '(₹49,90,000)', subtotal: true },
    ]},
    { id: 'sec-c', label: 'C. CASH FLOW FROM FINANCING ACTIVITIES', current: '', comparison: '', section: true, children: [
      { id: 'lt-proc', label: 'Proceeds from long-term borrowings', current: '₹40,00,000', comparison: '—', source: SOURCE },
      { id: 'lt-rep', label: 'Repayment of long-term borrowings', current: '(₹18,00,000)', comparison: '(₹16,00,000)', source: SOURCE },
      { id: 'int-paid', label: 'Interest paid', current: '(₹36,00,000)', comparison: '(₹32,00,000)', source: SOURCE },
      { id: 'net-c', label: 'Net cash from financing activities (C)', current: '(₹14,00,000)', comparison: '(₹48,00,000)', subtotal: true },
    ]},
    { id: 'net-inc', label: 'Net increase / (decrease) in cash (A + B + C)', current: '₹1,92,20,000', comparison: '₹1,12,20,000', subtotal: true },
    { id: 'cash-open', label: 'Cash at beginning of period', current: '₹1,28,00,000', comparison: '₹1,16,00,000', source: SOURCE },
    { id: 'cash-close', label: 'Cash at end of period', current: '₹1,42,00,000', comparison: '₹1,28,00,000', subtotal: true, highlight: true },
  ];
}

function genOrders(): TableReportData {
  const channels = ['Shopify', 'Amazon', 'Flipkart', 'Myntra', 'Meesho'];
  const statuses = ['Delivered', 'Returned', 'RTO'];
  const skus = ['Glow Serum 30ml', 'Hydrating Hair Mask', 'Sun Block SPF 50', 'Body Butter Cocoa'];
  const rows: Record<string, string>[] = [];
  for (let i = 1; i <= 120; i++) {
    const ch = channels[i % 5];
    rows.push({
      orderId: `${ch.slice(0, 2).toUpperCase()}-ORD-${10000 + i}`,
      channel: ch,
      orderDate: `May ${(i % 28) + 1}, 2026`,
      sku: skus[i % 4],
      qty: String((i % 3) + 1),
      gross: `₹${(1200 + (i % 40) * 100).toLocaleString('en-IN')}`,
      status: statuses[i % 3],
      net: `₹${(900 + (i % 30) * 80).toLocaleString('en-IN')}`,
      settlement: i % 4 === 0 ? 'Pending' : `May ${(i % 20) + 5}, 2026`,
    });
  }
  return {
    columns: [
      { key: 'orderId', label: 'Order ID' },
      { key: 'channel', label: 'Channel' },
      { key: 'orderDate', label: 'Order date' },
      { key: 'sku', label: 'SKU' },
      { key: 'qty', label: 'Qty', align: 'right' },
      { key: 'gross', label: 'Gross amount', align: 'right' },
      { key: 'status', label: 'Status' },
      { key: 'net', label: 'Net amount', align: 'right' },
      { key: 'settlement', label: 'Settlement date' },
    ],
    rows,
  };
}

export function getTableReportData(reportId: string): TableReportData | null {
  switch (reportId) {
    case 'marketplace-orders':
      return genOrders();
    case 'settlement-recon':
      return {
        columns: [
          { key: 'batch', label: 'Settlement batch' },
          { key: 'channel', label: 'Channel' },
          { key: 'period', label: 'Period' },
          { key: 'mkt', label: 'Marketplace reported', align: 'right' },
          { key: 'cw', label: 'CoWorker calculated', align: 'right' },
          { key: 'bank', label: 'Bank credited', align: 'right' },
          { key: 'var', label: 'Variance', align: 'right' },
          { key: 'status', label: 'Status' },
        ],
        rows: [
          { batch: 'FK-SET-8841', channel: 'Flipkart', period: 'May 1–7', mkt: '₹12,40,000', cw: '₹12,38,200', bank: '₹12,38,200', var: '₹0', status: 'Matched' },
          { batch: 'AMZ-SET-2291', channel: 'Amazon', period: 'May 1–7', mkt: '₹14,20,000', cw: '₹14,18,400', bank: '₹14,10,000', var: '₹8,400', status: 'Mismatch' },
          { batch: 'MYN-SET-1124', channel: 'Myntra', period: 'May 1–7', mkt: '₹6,80,000', cw: '₹6,80,000', bank: '—', var: '—', status: 'Pending' },
          { batch: 'SHP-SET-441', channel: 'Shopify', period: 'May 1–7', mkt: '₹4,82,000', cw: '₹4,82,000', bank: '₹4,82,000', var: '₹0', status: 'Matched' },
        ],
      };
    case 'settlement-breakdown':
      return {
        columns: [
          { key: 'batch', label: 'Batch ID' },
          { key: 'section', label: 'Section' },
          { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount', align: 'right' },
        ],
        rows: [
          { batch: 'FK-SET-8841', section: 'Order payments', type: 'Product sales', amount: '₹11,84,000' },
          { batch: 'FK-SET-8841', section: 'Order payments', type: 'Shipping credits', amount: '₹42,000' },
          { batch: 'FK-SET-8841', section: 'Non-order items', type: 'Claims credited', amount: '₹8,200' },
          { batch: 'FK-SET-8841', section: 'Non-order items', type: 'Cancellation fees', amount: '(₹6,000)' },
        ],
      };
    case 'charges-variance':
      return {
        columns: [
          { key: 'orderId', label: 'Order ID' },
          { key: 'channel', label: 'Channel' },
          { key: 'type', label: 'Charge type' },
          { key: 'rate', label: 'Rate card', align: 'right' },
          { key: 'actual', label: 'Actual', align: 'right' },
          { key: 'var', label: 'Variance', align: 'right' },
          { key: 'claim', label: 'Claim eligible' },
          { key: 'action', label: 'Action' },
        ],
        rows: [
          { orderId: 'FK-RTN-12847', channel: 'Flipkart', type: 'Reverse shipping', rate: '₹65', actual: '₹85', var: '₹20', claim: 'Yes', action: 'File dispute' },
          { orderId: 'MYN-RTN-8821', channel: 'Myntra', type: 'Pick-and-pack', rate: '₹0', actual: '₹47', var: '₹47', claim: 'Yes', action: 'File dispute' },
          { orderId: 'AMZ-RTN-3124', channel: 'Amazon', type: 'TCS not credited', rate: '₹0', actual: '₹28', var: '₹28', claim: 'Review', action: 'Review' },
        ],
      };
    case 'gstr1':
      return {
        columns: [
          { key: 'section', label: 'Section' },
          { key: 'invoices', label: 'Invoices', align: 'right' },
          { key: 'taxable', label: 'Taxable value', align: 'right' },
          { key: 'igst', label: 'IGST', align: 'right' },
          { key: 'cgst', label: 'CGST', align: 'right' },
          { key: 'sgst', label: 'SGST', align: 'right' },
        ],
        rows: [
          { section: 'B2C (large)', invoices: '1,240', taxable: '₹2.84 Cr', igst: '₹14.2 L', cgst: '—', sgst: '—' },
          { section: 'B2C (small)', invoices: '8,420', taxable: '₹4.12 Cr', igst: '—', cgst: '₹18.4 L', sgst: '₹18.4 L' },
          { section: 'B2B', invoices: '84', taxable: '₹42.8 L', igst: '₹2.1 L', cgst: '₹1.8 L', sgst: '₹1.8 L' },
          { section: 'HSN summary (top)', invoices: '—', taxable: '₹7.38 Cr', igst: '₹16.3 L', cgst: '₹20.2 L', sgst: '₹20.2 L' },
        ],
      };
    case 'tds-194o':
      return {
        columns: [
          { key: 'marketplace', label: 'Marketplace' },
          { key: 'deducted', label: 'TDS deducted', align: 'right' },
          { key: 'collected', label: 'Certificates collected', align: 'right' },
          { key: 'pending', label: 'Certificates pending', align: 'right' },
          { key: 'claims', label: 'Claims pending', align: 'right' },
        ],
        rows: [
          { marketplace: 'Amazon', deducted: '₹4,82,000', collected: '₹4,20,000', pending: '₹62,000', claims: '₹18,000' },
          { marketplace: 'Flipkart', deducted: '₹3,24,000', collected: '₹3,24,000', pending: '—', claims: '—' },
          { marketplace: 'Myntra', deducted: '₹1,48,000', collected: '₹1,20,000', pending: '₹28,000', claims: '₹12,000' },
        ],
      };
    case 'tcs-recon':
      return {
        columns: [
          { key: 'marketplace', label: 'Marketplace' },
          { key: 'mkt', label: 'TCS deducted', align: 'right' },
          { key: 'f26', label: 'Form 26AS', align: 'right' },
          { key: 'cw', label: 'CoWorker calculated', align: 'right' },
          { key: 'var', label: 'Variance', align: 'right' },
          { key: 'claim', label: 'Claim eligible' },
        ],
        rows: [
          { marketplace: 'Amazon', mkt: '₹8,42,000', f26: '₹8,40,000', cw: '₹8,42,000', var: '₹2,000', claim: 'Yes' },
          { marketplace: 'Flipkart', mkt: '₹6,18,000', f26: '₹6,18,000', cw: '₹6,18,000', var: '₹0', claim: '—' },
        ],
      };
    case 'pg-settlements':
      return {
        columns: [
          { key: 'pg', label: 'PG' },
          { key: 'batch', label: 'Batch ID' },
          { key: 'count', label: 'Txn count', align: 'right' },
          { key: 'gross', label: 'Gross', align: 'right' },
          { key: 'fees', label: 'Fees', align: 'right' },
          { key: 'tcs', label: 'TCS', align: 'right' },
          { key: 'net', label: 'Net settled', align: 'right' },
          { key: 'date', label: 'Bank credit' },
          { key: 'status', label: 'Status' },
        ],
        rows: [
          { pg: 'Cashfree', batch: 'CF-SET-88412', count: '842', gross: '₹24,80,000', fees: '₹1,24,000', tcs: '₹24,800', net: '₹23,31,200', date: 'May 16, 2026', status: 'Credited' },
          { pg: 'Razorpay', batch: 'RZ-SET-22981', count: '124', gross: '₹8,42,000', fees: '₹42,100', tcs: '₹8,420', net: '₹7,91,480', date: 'May 15, 2026', status: 'Credited' },
        ],
      };
    case 'bank-recon':
      return {
        columns: [
          { key: 'account', label: 'Bank account' },
          { key: 'bank', label: 'Balance per bank', align: 'right' },
          { key: 'transit', label: 'Deposits in transit', align: 'right' },
          { key: 'cheques', label: 'Outstanding cheques', align: 'right' },
          { key: 'books', label: 'Balance per books', align: 'right' },
        ],
        rows: [
          { account: 'HDFC Current', bank: '₹84,20,000', transit: '₹4,20,000', cheques: '(₹2,40,000)', books: '₹86,00,000' },
          { account: 'ICICI Current', bank: '₹56,00,000', transit: '₹1,80,000', cheques: '(₹80,000)', books: '₹57,00,000' },
        ],
      };
    case 'cod-remittance':
      return {
        columns: [
          { key: 'courier', label: 'Courier' },
          { key: 'shipped', label: 'COD shipped', align: 'right' },
          { key: 'collected', label: 'Collected', align: 'right' },
          { key: 'remitted', label: 'Remitted', align: 'right' },
          { key: 'pending', label: 'Pending', align: 'right' },
          { key: 'ageing', label: 'Ageing' },
        ],
        rows: [
          { courier: 'Shiprocket', shipped: '₹12,40,000', collected: '₹11,80,000', remitted: '₹10,20,000', pending: '₹1,60,000', ageing: '8 days avg' },
          { courier: 'Delhivery', shipped: '₹8,20,000', collected: '₹7,90,000', remitted: '₹7,40,000', pending: '₹50,000', ageing: '5 days avg' },
        ],
      };
    case 'sku-profitability':
      return {
        columns: [
          { key: 'sku', label: 'SKU' },
          { key: 'cat', label: 'Category' },
          { key: 'units', label: 'Units', align: 'right' },
          { key: 'gross', label: 'Gross revenue', align: 'right' },
          { key: 'net', label: 'Net revenue', align: 'right' },
          { key: 'contrib', label: 'Contribution', align: 'right' },
          { key: 'margin', label: 'Margin %', align: 'right' },
        ],
        rows: [
          { sku: 'Hydrating Face Cream 50ml', cat: 'Skincare', units: '4,820', gross: '₹48.2 L', net: '₹42.1 L', contrib: '₹18.4 L', margin: '43.7%' },
          { sku: 'Glow Serum 30ml', cat: 'Skincare', units: '3,240', gross: '₹38.4 L', net: '₹32.8 L', contrib: '₹12.1 L', margin: '36.9%' },
          { sku: 'Hydrating Hair Mask', cat: 'Haircare', units: '2,180', gross: '₹21.8 L', net: '₹14.2 L', contrib: '₹2.8 L', margin: '19.7%' },
        ],
      };
    case 'channel-sku-matrix':
      return {
        columns: [
          { key: 'sku', label: 'SKU' },
          { key: 'shopify', label: 'Shopify', align: 'right' },
          { key: 'amazon', label: 'Amazon', align: 'right' },
          { key: 'flipkart', label: 'Flipkart', align: 'right' },
          { key: 'myntra', label: 'Myntra', align: 'right' },
          { key: 'meesho', label: 'Meesho', align: 'right' },
        ],
        rows: [
          { sku: 'Glow Serum 30ml', shopify: '42%', amazon: '38%', flipkart: '31%', myntra: '18%', meesho: '28%' },
          { sku: 'Hydrating Hair Mask', shopify: '28%', amazon: '24%', flipkart: '22%', myntra: '8%', meesho: '19%' },
          { sku: 'Sun Block SPF 50', shopify: '36%', amazon: '34%', flipkart: '29%', myntra: '22%', meesho: '26%' },
        ],
      };
    case 'returns-by-sku':
      return {
        columns: [
          { key: 'sku', label: 'SKU' },
          { key: 'channel', label: 'Channel' },
          { key: 'returned', label: 'Units returned', align: 'right' },
          { key: 'rate', label: 'Return rate', align: 'right' },
          { key: 'cost', label: 'Return cost', align: 'right' },
        ],
        rows: [
          { sku: 'Hydrating Hair Mask', channel: 'Myntra', returned: '486', rate: '64%', cost: '₹84,000' },
          { sku: 'Body Butter Cocoa', channel: 'Myntra', returned: '218', rate: '52%', cost: '₹38,000' },
          { sku: 'Glow Serum 30ml', channel: 'Flipkart', returned: '312', rate: '41%', cost: '₹2.18 L' },
        ],
      };
    default:
      return null;
  }
}

export function getStatementForReport(reportId: string): StatementNode[] | null {
  if (reportId === 'pnl') return getPnLStatement();
  if (reportId === 'balance-sheet') return getBalanceSheetStatement();
  if (reportId === 'cash-flow') return getCashFlowStatement();
  return null;
}

export function isFinancialReport(reportId: string): boolean {
  return ['pnl', 'balance-sheet', 'cash-flow'].includes(reportId);
}
