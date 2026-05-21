import { BankTransaction, ReconciliationException, BankStatement, CategoryRollup } from '../types';

const EXTRA_EXCEPTIONS: ReconciliationException[] = [
  { id: 'exc_5', type: 'duplicate_credit', source: 'Amazon', bankTxnId: 'AMZ-CR-4412', bankAccountLabel: 'HDFC ··2847', expectedAmount: 125000, actualAmount: 250000, variance: -125000, agingHours: 36, status: 'open', actionLabel: 'Investigate', description: 'Duplicate credit detected for same settlement batch.' },
  { id: 'exc_6', type: 'unidentified_debit', source: 'HDFC', bankTxnId: 'HDFC-DB-9921', bankAccountLabel: 'HDFC ··2847', expectedAmount: 0, actualAmount: -84200, variance: -84200, agingHours: 28, status: 'open', actionLabel: 'Investigate', description: 'Unidentified debit with no matching vendor invoice.' },
  { id: 'exc_7', type: 'amount_mismatch', source: 'Myntra', bankTxnId: 'MYN-SET-2201', bankAccountLabel: 'ICICI ··5621', expectedAmount: 312000, actualAmount: 298400, variance: -13600, agingHours: 52, status: 'open', actionLabel: 'File claim', description: 'Myntra settlement short by ₹13,600 vs MTR report.' },
  { id: 'exc_9', type: 'overcharge', source: 'Meesho', bankTxnId: 'MEE-8841', bankAccountLabel: 'HDFC ··2847', expectedAmount: 89000, actualAmount: 86200, variance: -2800, agingHours: 80, status: 'investigating', actionLabel: 'File claim', description: 'Logistics fee overcharge on Meesho settlement.' },
  { id: 'exc_10', type: 'missing_settlement', source: 'Flipkart', expectedAmount: 156000, actualAmount: null, variance: -156000, agingHours: 120, status: 'open', actionLabel: 'Chase marketplace', description: 'Flipkart payout scheduled May 12; no HDFC credit received.' },
  { id: 'exc_11', type: 'amount_mismatch', source: 'Amazon', bankTxnId: 'AMZ-SET-7721', bankAccountLabel: 'HDFC ··2847', expectedAmount: 278000, actualAmount: 271200, variance: -6800, agingHours: 30, status: 'open', actionLabel: 'Investigate', description: 'Amazon settlement variance on return adjustments.' },
  { id: 'exc_12', type: 'duplicate_credit', source: 'Cashfree PG', bankTxnId: 'CF-8821', bankAccountLabel: 'ICICI ··5621', expectedAmount: 94000, actualAmount: 188000, variance: -94000, agingHours: 26, status: 'open', actionLabel: 'Investigate', description: 'Possible duplicate PG settlement credit.' },
  { id: 'exc_13', type: 'unidentified_debit', source: 'ICICI', bankTxnId: 'ICICI-OUT-441', bankAccountLabel: 'ICICI ··5621', expectedAmount: 0, actualAmount: -22400, variance: -22400, agingHours: 44, status: 'open', actionLabel: 'Investigate', description: 'Escrow account debit without matching narration pattern.' },
  { id: 'exc_15', type: 'overcharge', source: 'Flipkart', bankTxnId: 'FK-AD-992', bankAccountLabel: 'HDFC ··2847', expectedAmount: 198000, actualAmount: 194100, variance: -3900, agingHours: 65, status: 'resolved', actionLabel: 'Reconcile', description: 'Advertising fee variance — claim filed.' },
  { id: 'exc_16', type: 'amount_mismatch', source: 'Meesho', bankTxnId: 'MEE-SET-12', bankAccountLabel: 'HDFC ··2847', expectedAmount: 67000, actualAmount: 64200, variance: -2800, agingHours: 40, status: 'open', actionLabel: 'Investigate', description: 'Meesho commission mismatch on beauty SKU band.' },
  { id: 'exc_17', type: 'missing_settlement', source: 'Myntra', expectedAmount: 224000, actualAmount: null, variance: -224000, agingHours: 88, status: 'open', actionLabel: 'Chase marketplace', description: 'Myntra partner portal shows payout; ICICI has no credit.' },
  { id: 'exc_19', type: 'duplicate_credit', source: 'Razorpay', bankTxnId: 'RZP-DUP-2', bankAccountLabel: 'HDFC ··2847', expectedAmount: 56000, actualAmount: 112000, variance: -56000, agingHours: 22, status: 'investigating', actionLabel: 'Investigate', description: 'Duplicate Razorpay settlement line in bank feed.' },
  { id: 'exc_20', type: 'unidentified_debit', source: 'HDFC', bankTxnId: 'HDFC-UNK-88', bankAccountLabel: 'HDFC ··2847', expectedAmount: 0, actualAmount: -12800, variance: -12800, agingHours: 18, status: 'open', actionLabel: 'Investigate', description: 'Unknown SHV reference debit on current account.' },
  { id: 'exc_21', type: 'amount_mismatch', source: 'Cashfree PG', bankTxnId: 'CF-S-9901', bankAccountLabel: 'HDFC ··2847', expectedAmount: 1240000, actualAmount: 1232100, variance: -7900, agingHours: 34, status: 'open', actionLabel: 'Investigate', description: 'PG settlement fee deduction variance vs settlement file.' },
  { id: 'exc_22', type: 'overcharge', source: 'Amazon', bankTxnId: 'AMZ-FEE-22', bankAccountLabel: 'HDFC ··2847', expectedAmount: 445000, actualAmount: 441200, variance: -3800, agingHours: 56, status: 'open', actionLabel: 'File claim', description: 'Amazon referral fee charged above rate card.' },
  { id: 'exc_23', type: 'missing_settlement', source: 'Meesho', expectedAmount: 98000, actualAmount: null, variance: -98000, agingHours: 72, status: 'open', actionLabel: 'Chase marketplace', description: 'Meesho settlement report with no matching bank entry.' },
  { id: 'exc_25', type: 'amount_mismatch', source: 'Flipkart', bankTxnId: 'FK-SET-991', bankAccountLabel: 'HDFC ··2847', expectedAmount: 334000, actualAmount: 329800, variance: -4200, agingHours: 38, status: 'open', actionLabel: 'Investigate', description: 'Flipkart logistics deduction variance.' },
  { id: 'exc_26', type: 'duplicate_credit', source: 'Amazon', bankTxnId: 'AMZ-DUP-9', bankAccountLabel: 'HDFC ··2847', expectedAmount: 78000, actualAmount: 156000, variance: -78000, agingHours: 20, status: 'resolved', actionLabel: 'Reconcile', description: 'Resolved — duplicate credit reversed.' },
  { id: 'exc_27', type: 'unidentified_debit', source: 'Razorpay', bankTxnId: 'RZP-FEE-UNK', bankAccountLabel: 'HDFC ··2847', expectedAmount: 0, actualAmount: -4200, variance: -4200, agingHours: 15, status: 'open', actionLabel: 'Investigate', description: 'Razorpay fee debit without settlement batch link.' },
];

export const mockExceptions: ReconciliationException[] = [
  {
    id: 'exc_1',
    type: 'amount_mismatch',
    source: 'Flipkart',
    bankTxnId: 'TXN-FK-19281',
    bankAccountLabel: 'HDFC ··2847',
    narration: 'NEFT CR FLIPKART SETTLEMENT',
    expectedAmount: 418290,
    actualAmount: 407118,
    variance: -11172,
    agingHours: 48,
    status: 'open',
    actionLabel: 'Investigate',
    description: 'Flipkart settlement landed ₹11,172 short. Likely a commission rate-card variance — auto-detected.'
  },
  {
    id: 'exc_2',
    type: 'missing_settlement',
    source: 'Amazon',
    narration: 'AMAZON MTR PAYOUT MAY 14',
    expectedAmount: 384200,
    actualAmount: null,
    variance: -384200,
    agingHours: 96,
    status: 'open',
    actionLabel: 'Chase Amazon',
    description: 'Amazon MTR reports payout on May 14, but no credit at HDFC. 4 days overdue against standard T+7 cycle.'
  },
  {
    id: 'exc_3',
    type: 'overcharge',
    source: 'Flipkart',
    bankTxnId: 'FK-SET-88412',
    bankAccountLabel: 'HDFC ··2847',
    narration: 'FLIPKART COMMISSION DEBIT',
    expectedAmount: 245400,
    actualAmount: 242153,
    variance: -3247,
    agingHours: 72,
    status: 'open',
    actionLabel: 'File claim',
    description: 'Commission charged at 12% on apparel < ₹500; rate card says 8%. Eligible for claim until May 26.'
  },
  ...EXTRA_EXCEPTIONS,
];

export const mockStatements: BankStatement[] = [
  { id: 'st_1', date: '2026-05-18', bankName: 'HDFC Bank', accountIdLast4: '2847', accountType: 'current', txnCount: 42, openingBalance: 34200000, closingBalance: 38400000, categorisedCount: 38, unreconciledCount: 4 },
  { id: 'st_2', date: '2026-05-17', bankName: 'HDFC Bank', accountIdLast4: '2847', accountType: 'current', txnCount: 28, openingBalance: 32800000, closingBalance: 34200000, categorisedCount: 26, unreconciledCount: 2 },
  { id: 'st_3', date: '2026-05-16', bankName: 'HDFC Bank', accountIdLast4: '2847', accountType: 'current', txnCount: 18, openingBalance: 31800000, closingBalance: 32800000, categorisedCount: 18, unreconciledCount: 0 },
  { id: 'st_4', date: '2026-05-18', bankName: 'ICICI Bank', accountIdLast4: '5621', accountType: 'escrow', txnCount: 15, openingBalance: 6240000, closingBalance: 6820000, categorisedCount: 14, unreconciledCount: 1 },
  { id: 'st_5', date: '2026-05-17', bankName: 'ICICI Bank', accountIdLast4: '5621', accountType: 'escrow', txnCount: 9, openingBalance: 6010000, closingBalance: 6240000, categorisedCount: 9, unreconciledCount: 0 },
  { id: 'st_6', date: '2026-05-15', bankName: 'HDFC Bank', accountIdLast4: '2847', accountType: 'current', txnCount: 21, openingBalance: 30500000, closingBalance: 31800000, categorisedCount: 19, unreconciledCount: 2 },
  { id: 'st_7', date: '2026-05-14', bankName: 'HDFC Bank', accountIdLast4: '2847', accountType: 'current', txnCount: 16, openingBalance: 29200000, closingBalance: 30500000, categorisedCount: 15, unreconciledCount: 1 },
];

export const mockUnreconciledTxns: BankTransaction[] = [
  { id: 'ut_1', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T10:00:00Z', narration: 'NEFT IN: NIYO FINANCE PRIV', amount: 284500, status: 'unreconciled', suggestedCategory: 'Capital & finance inflows', confidence: 64 },
  { id: 'ut_2', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T11:30:00Z', narration: 'UPI/BHARATPE/SETTLEMENT', amount: 62400, status: 'unreconciled', suggestedCategory: 'Payment gateway settlements (other)', confidence: 78 },
  { id: 'ut_3', bankAccountId: 'hdfc_2847', statementId: 'st_2', postedAt: '2026-05-17T09:15:00Z', narration: 'NEFT OUT: ZOHO CORP IN', amount: -47200, status: 'unreconciled', suggestedCategory: 'Operating expenses (SaaS)', confidence: 91 },
  { id: 'ut_4', bankAccountId: 'hdfc_2847', statementId: 'st_2', postedAt: '2026-05-17T14:45:00Z', narration: 'DEBIT: UNKNOWN TXN REF SHV2841', amount: -18290, status: 'unreconciled', suggestedCategory: 'Vendor & supplier payments', confidence: 38 },
  { id: 'ut_5', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T08:00:00Z', narration: 'IMPS CR UNKNOWN MERCHANT', amount: 18400, status: 'unreconciled', suggestedCategory: 'Marketplace payouts', confidence: 52 },
  { id: 'ut_6', bankAccountId: 'icici_5621', statementId: 'st_4', postedAt: '2026-05-18T12:00:00Z', narration: 'NEFT IN MYNTRA PARTNER', amount: 92000, status: 'unreconciled', suggestedCategory: 'Marketplace payouts', confidence: 85 },
  { id: 'ut_7', bankAccountId: 'hdfc_2847', statementId: 'st_6', postedAt: '2026-05-15T11:00:00Z', narration: 'ACH DEBIT LOGISTICS CO', amount: -34100, status: 'unreconciled', suggestedCategory: 'Logistics & fulfilment', confidence: 72 },
  { id: 'ut_8', bankAccountId: 'hdfc_2847', statementId: 'st_6', postedAt: '2026-05-15T15:30:00Z', narration: 'UPI SETTLEMENT REF 8821', amount: 45800, status: 'unreconciled', suggestedCategory: 'Payment gateway settlements', confidence: 68 },
  { id: 'ut_9', bankAccountId: 'hdfc_2847', statementId: 'st_7', postedAt: '2026-05-14T10:00:00Z', narration: 'NEFT OUT AD AGENCY PVT', amount: -124000, status: 'unreconciled', suggestedCategory: 'Ad spend', confidence: 88 },
  { id: 'ut_10', bankAccountId: 'icici_5621', statementId: 'st_4', postedAt: '2026-05-18T09:00:00Z', narration: 'ESCROW RELEASE PENDING', amount: 31200, status: 'unreconciled', suggestedCategory: 'Marketplace payouts', confidence: 55 },
  { id: 'ut_11', bankAccountId: 'hdfc_2847', statementId: 'st_2', postedAt: '2026-05-17T16:00:00Z', narration: 'BANK CHARGES MAY 2026', amount: -2400, status: 'unreconciled', suggestedCategory: 'Operating expenses', confidence: 94 },
  { id: 'ut_12', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T14:00:00Z', narration: 'NEFT IN REFUND GST KA', amount: 8200, status: 'unreconciled', suggestedCategory: 'Tax refunds', confidence: 76 },
  { id: 'ut_13', bankAccountId: 'hdfc_2847', statementId: 'st_7', postedAt: '2026-05-14T13:00:00Z', narration: 'DEBIT CARD SWIPE UNKNOWN', amount: -8900, status: 'unreconciled', suggestedCategory: 'Vendor & supplier payments', confidence: 41 },
  { id: 'ut_14', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T16:30:00Z', narration: 'RTGS IN SHIPROCKET COD', amount: 156000, status: 'unreconciled', suggestedCategory: 'COD remittances', confidence: 82 },
];

export const mockCategorisedTxns: BankTransaction[] = [
  { id: 'ct_1', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T09:00:00Z', narration: 'NEFT CR CASHFREE SETTLEMENT BATCH 8812', amount: 842000, status: 'categorised', category: { top: 'Payment gateway settlements', sub: 'Cashfree' } },
  { id: 'ct_2', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T10:30:00Z', narration: 'NEFT CR FLIPKART MARKETPLACE PAYOUT', amount: 407118, status: 'categorised', category: { top: 'Marketplace payouts', sub: 'Flipkart' } },
  { id: 'ct_3', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T11:00:00Z', narration: 'NEFT CR AMAZON SELLER SERVICES', amount: 271200, status: 'categorised', category: { top: 'Marketplace payouts', sub: 'Amazon' } },
  { id: 'ct_4', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T12:00:00Z', narration: 'NEFT OUT META INDIA ADS', amount: -82000, status: 'categorised', category: { top: 'Ad spend', sub: 'Meta' } },
  { id: 'ct_5', bankAccountId: 'hdfc_2847', statementId: 'st_1', postedAt: '2026-05-18T13:00:00Z', narration: 'NEFT OUT SHIPROCKET LOGISTICS', amount: -48000, status: 'categorised', category: { top: 'Logistics & fulfilment', sub: 'Shiprocket' } },
  { id: 'ct_6', bankAccountId: 'icici_5621', statementId: 'st_4', postedAt: '2026-05-18T08:30:00Z', narration: 'NEFT CR MYNTRA PARTNER PAYOUT', amount: 198000, status: 'categorised', category: { top: 'Marketplace payouts', sub: 'Myntra' } },
  { id: 'ct_7', bankAccountId: 'hdfc_2847', statementId: 'st_2', postedAt: '2026-05-17T10:00:00Z', narration: 'NEFT CR RAZORPAY SETTLEMENT', amount: 102000, status: 'categorised', category: { top: 'Payment gateway settlements', sub: 'Razorpay' } },
  { id: 'ct_8', bankAccountId: 'hdfc_2847', statementId: 'st_2', postedAt: '2026-05-17T11:30:00Z', narration: 'NEFT OUT GST DEPOSIT KA', amount: -380000, status: 'categorised', category: { top: 'Statutory', sub: 'GST deposit' } },
];

const sampleTxns = (categoryId: string, items: { narration: string; amount: number; sub: string; date: string }[]) =>
  items.map((item, i) => ({
    id: `${categoryId}_txn_${i}`,
    postedAt: `${item.date}T10:00:00Z`,
    narration: item.narration,
    amount: item.amount,
    subCategory: item.sub,
    statementId: 'st_1',
  }));

export const mockInflows: CategoryRollup[] = [
  {
    id: 'in_1',
    name: 'Payment gateway settlements',
    type: 'inflow',
    total: 3840000,
    txnCount: 21,
    linkedExceptionSource: 'Cashfree PG',
    linkedExceptionCount: 1,
    subCategories: [
      { name: 'Cashfree', total: 2820000, txnCount: 15 },
      { name: 'Razorpay', total: 1020000, txnCount: 6 }
    ],
    transactions: sampleTxns('in_1', [
      { narration: 'NEFT CR CASHFREE SETTLEMENT BATCH 8812', amount: 842000, sub: 'Cashfree', date: '2026-05-18' },
      { narration: 'NEFT CR RAZORPAY SETTLEMENT', amount: 102000, sub: 'Razorpay', date: '2026-05-17' },
    ]),
  },
  {
    id: 'in_2',
    name: 'Marketplace payouts',
    type: 'inflow',
    total: 5210000,
    txnCount: 18,
    linkedExceptionSource: 'Flipkart',
    linkedExceptionCount: 2,
    subCategories: [
      { name: 'Amazon', total: 1840000, txnCount: 4 },
      { name: 'Flipkart', total: 1420000, txnCount: 5 },
      { name: 'Myntra', total: 980000, txnCount: 4 },
      { name: 'Nykaa', total: 650000, txnCount: 3 },
      { name: 'Meesho', total: 320000, txnCount: 2 }
    ],
    transactions: sampleTxns('in_2', [
      { narration: 'NEFT CR FLIPKART MARKETPLACE PAYOUT', amount: 407118, sub: 'Flipkart', date: '2026-05-18' },
      { narration: 'NEFT CR AMAZON SELLER SERVICES', amount: 271200, sub: 'Amazon', date: '2026-05-18' },
    ]),
  },
  {
    id: 'in_3',
    name: 'COD remittances',
    type: 'inflow',
    total: 2240000,
    txnCount: 14,
    subCategories: [
      { name: 'Shiprocket', total: 1420000, txnCount: 8 },
      { name: 'Delhivery', total: 820000, txnCount: 6 }
    ],
    transactions: sampleTxns('in_3', [
      { narration: 'RTGS IN SHIPROCKET COD REMITTANCE', amount: 356000, sub: 'Shiprocket', date: '2026-05-17' },
    ]),
  },
  {
    id: 'in_4',
    name: 'Tax refunds',
    type: 'inflow',
    total: 180000,
    txnCount: 1,
    subCategories: [{ name: 'GST refund (KA)', total: 180000, txnCount: 1 }],
    transactions: sampleTxns('in_4', [
      { narration: 'NEFT IN GST REFUND KARNATAKA', amount: 180000, sub: 'GST refund (KA)', date: '2026-05-16' },
    ]),
  },
  {
    id: 'in_5',
    name: 'Capital & finance inflows',
    type: 'inflow',
    total: 1420000,
    txnCount: 1,
    subCategories: [{ name: 'Working capital loan disbursement', total: 1420000, txnCount: 1 }],
    transactions: sampleTxns('in_5', [
      { narration: 'NEFT IN WORKING CAPITAL LOAN DISB', amount: 1420000, sub: 'Working capital loan disbursement', date: '2026-05-15' },
    ]),
  },
  {
    id: 'in_6',
    name: 'Other inflows',
    type: 'inflow',
    total: 47290,
    txnCount: 3,
    subCategories: [
      { name: 'Interest on FD', total: 38400, txnCount: 1 },
      { name: 'FX inward (Shopify intl.)', total: 8890, txnCount: 2 }
    ],
    transactions: sampleTxns('in_6', [
      { narration: 'CREDIT INTEREST ON FD', amount: 38400, sub: 'Interest on FD', date: '2026-05-18' },
    ]),
  }
];

export const mockOutflows: CategoryRollup[] = [
  {
    id: 'out_1',
    name: 'Vendor & supplier payments',
    type: 'outflow',
    total: 1840000,
    txnCount: 9,
    subCategories: [
      { name: 'Raw materials', total: 1210000, txnCount: 5 },
      { name: 'Packaging', total: 420000, txnCount: 3 },
      { name: 'Contract manufacturing', total: 210000, txnCount: 1 }
    ],
    transactions: sampleTxns('out_1', [
      { narration: 'NEFT OUT A1 PACKAGING SOLUTIONS', amount: -420000, sub: 'Packaging', date: '2026-05-17' },
    ]),
  },
  {
    id: 'out_2',
    name: 'Ad spend',
    type: 'outflow',
    total: 1560000,
    txnCount: 12,
    subCategories: [
      { name: 'Meta', total: 820000, txnCount: 6 },
      { name: 'Google', total: 610000, txnCount: 4 },
      { name: 'Amazon Ads', total: 130000, txnCount: 2 }
    ],
    transactions: sampleTxns('out_2', [
      { narration: 'NEFT OUT META INDIA ADS', amount: -82000, sub: 'Meta', date: '2026-05-18' },
      { narration: 'NEFT OUT GOOGLE INDIA ADS', amount: -61000, sub: 'Google', date: '2026-05-17' },
    ]),
  },
  {
    id: 'out_3',
    name: 'Logistics & fulfilment',
    type: 'outflow',
    total: 820000,
    txnCount: 7,
    subCategories: [
      { name: 'Shiprocket', total: 480000, txnCount: 4 },
      { name: 'Delhivery', total: 240000, txnCount: 2 },
      { name: 'Last-mile partner', total: 100000, txnCount: 1 }
    ],
    transactions: sampleTxns('out_3', [
      { narration: 'NEFT OUT SHIPROCKET LOGISTICS', amount: -48000, sub: 'Shiprocket', date: '2026-05-18' },
    ]),
  },
  {
    id: 'out_4',
    name: 'Statutory',
    type: 'outflow',
    total: 420000,
    txnCount: 3,
    subCategories: [
      { name: 'GST deposit', total: 380000, txnCount: 1 },
      { name: 'TDS challan', total: 40000, txnCount: 1 },
      { name: 'PF', total: 0, txnCount: 1 }
    ],
    transactions: sampleTxns('out_4', [
      { narration: 'NEFT OUT GST DEPOSIT KA', amount: -380000, sub: 'GST deposit', date: '2026-05-17' },
    ]),
  },
  {
    id: 'out_5',
    name: 'Operating expenses',
    type: 'outflow',
    total: 240000,
    txnCount: 8,
    subCategories: [
      { name: 'SaaS subscriptions', total: 120000, txnCount: 3 },
      { name: 'Rent', total: 84000, txnCount: 1 },
      { name: 'Utilities', total: 28000, txnCount: 2 },
      { name: 'Bank charges', total: 4000, txnCount: 1 },
      { name: 'Professional fees', total: 4000, txnCount: 1 }
    ],
    transactions: sampleTxns('out_5', [
      { narration: 'NEFT OUT ZOHO CORP IN', amount: -47200, sub: 'SaaS subscriptions', date: '2026-05-17' },
    ]),
  },
  {
    id: 'out_6',
    name: 'Finance & debt',
    type: 'outflow',
    total: 120000,
    txnCount: 1,
    subCategories: [{ name: 'Working capital loan EMI', total: 120000, txnCount: 1 }],
    transactions: sampleTxns('out_6', [
      { narration: 'ACH DEBIT LOAN EMI MAY 2026', amount: -120000, sub: 'Working capital loan EMI', date: '2026-05-16' },
    ]),
  },
  {
    id: 'out_7',
    name: 'Payroll',
    type: 'outflow',
    total: 0,
    txnCount: 0,
    subCategories: [],
  },
  {
    id: 'out_8',
    name: 'Owner / internal transfers',
    type: 'outflow',
    total: 0,
    txnCount: 0,
    subCategories: [],
  }
];
