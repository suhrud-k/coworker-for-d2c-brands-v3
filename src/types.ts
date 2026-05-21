export interface ChannelPerformance {
  channel: string;
  orders: number;
  gmv: number;
  margin: number;
  wow: number;
}

export type BankTransaction = {
  id: string;
  bankAccountId: string;       // e.g., "hdfc_2847"
  statementId: string;          // links to a BankStatement
  postedAt: string;             // ISO datetime
  narration: string;            // raw bank narration string
  amount: number;               // positive credit, negative debit
  status: 'categorised' | 'unreconciled';
  category?: { top: string; sub?: string };
  linkedExceptionIds?: string[];
  suggestedCategory?: string;
  confidence?: number;
};

export type ReconciliationException = {
  id: string;
  type: 'amount_mismatch' | 'missing_settlement' | 'overcharge' | 'late_credit' | 'duplicate_credit' | 'unidentified_debit';
  source: string;               // "Flipkart", "Amazon", "Cashfree PG", "Razorpay"
  bankTxnId?: string;
  bankAccountLabel?: string;
  narration?: string;
  expectedAmount: number;
  actualAmount: number | null;  // null when nothing was credited
  variance: number;             // expectedAmount - (actualAmount ?? 0)
  agingHours: number;           // for sorting and display
  status: 'open' | 'investigating' | 'resolved';
  actionLabel: string;          // "Investigate", "Chase marketplace", "File claim", "Ping bank"
  description: string;          // one-line natural language explanation
};

export type BankStatement = {
  id: string;
  date: string;                 // YYYY-MM-DD
  bankName: string;             // "HDFC Bank", "ICICI Bank"
  accountIdLast4: string;       // "2847", "5621"
  accountType: 'current' | 'escrow';
  txnCount: number;
  openingBalance: number;
  closingBalance: number;
  categorisedCount: number;
  unreconciledCount: number;
};

export type CategoryRollup = {
  id: string;
  name: string;
  type: 'inflow' | 'outflow';
  total: number;                // for the active date range
  txnCount: number;
  subCategories: { name: string; total: number; txnCount: number }[];
  transactions?: CategoryTransaction[];
  linkedExceptionSource?: string;
  linkedExceptionCount?: number;
};

export type CategoryTransaction = {
  id: string;
  postedAt: string;
  narration: string;
  amount: number;
  subCategory: string;
  statementId: string;
};

export interface AdCampaign {
  platform: string;
  name: string;
  spend: number;
  gmv: number;
  netSales: number;
  margin: number;
  poas: number;
}
