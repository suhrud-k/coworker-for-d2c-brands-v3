import type {
  ArtifactStatement,
  StatementLineItem,
  StatementPeriod,
  StatementSection,
  StatementType,
  V3CannedResponse,
} from '../v3Types';

export const STATEMENT_PERIODS: Record<string, StatementPeriod> = {
  'apr-2026': { id: 'apr-2026', label: 'Apr 2026', type: 'month' },
  'may-2026': { id: 'may-2026', label: 'May 2026 (MTD)', type: 'mtd', asOnDate: '2026-04-30' },
  'mar-2025': { id: 'mar-2025', label: 'Mar 2025', type: 'month' },
  'apr-2025': { id: 'apr-2025', label: 'Apr 2025', type: 'month' },
  'may-2025': { id: 'may-2025', label: 'May 2025', type: 'month' },
  'fy25-26-q1': { id: 'fy25-26-q1', label: 'Q1 FY25-26 (Apr–Jun 2026)', type: 'quarter' },
  'fy24-25-q4': { id: 'fy24-25-q4', label: 'Q4 FY24-25 (Jan–Mar 2026)', type: 'quarter', asOnDate: '2026-03-31' },
  'fy24-25-q3': { id: 'fy24-25-q3', label: 'Q3 FY24-25 (Oct–Dec 2025)', type: 'quarter' },
  'fy24-25': { id: 'fy24-25', label: 'FY 2024-25', type: 'fy', asOnDate: '2025-03-31' },
  'fy23-24': { id: 'fy23-24', label: 'FY 2023-24', type: 'fy', asOnDate: '2024-03-31' },
  'fy25-26-ytd': { id: 'fy25-26-ytd', label: 'FY 2025-26 (YTD May)', type: 'fy', asOnDate: '2026-05-31' },
  'fy24-25-ytd': { id: 'fy24-25-ytd', label: 'FY 2024-25 (YTD May)', type: 'fy', asOnDate: '2025-05-31' },
  'as-on-2026-04-30': { id: 'as-on-2026-04-30', label: 'As at 30 April 2026', type: 'as-on', asOnDate: '2026-04-30' },
  'as-on-2026-03-31': { id: 'as-on-2026-03-31', label: 'As at 31 March 2026', type: 'as-on', asOnDate: '2026-03-31' },
  'as-on-2025-03-31': { id: 'as-on-2025-03-31', label: 'As at 31 March 2025', type: 'as-on', asOnDate: '2025-03-31' },
};

type BasePnL = {
  salesAmazon: number;
  salesFlipkart: number;
  salesMyntra: number;
  salesMeesho: number;
  salesShopify: number;
  otherIncome: number;
  openingInventory: number;
  purchases: number;
  inventoryChange: number;
  marketing: number;
  commissions: number;
  logistics: number;
  paymentGateway: number;
  employee: number;
  rent: number;
  technology: number;
  otherOpex: number;
  depreciation: number;
  financeCosts: number;
  taxExpense: number;
};

function pnlSections(d: BasePnL): StatementSection[] {
  const revenueOps = d.salesAmazon + d.salesFlipkart + d.salesMyntra + d.salesMeesho + d.salesShopify;
  const totalIncome = revenueOps + d.otherIncome;
  const totalCogs = d.openingInventory + d.purchases + d.inventoryChange;
  const grossProfit = totalIncome - totalCogs;
  const totalOpex = d.marketing + d.commissions + d.logistics + d.paymentGateway + d.employee + d.rent + d.technology + d.otherOpex;
  const ebitda = grossProfit - totalOpex;
  const ebit = ebitda - d.depreciation;
  const pbt = ebit - d.financeCosts;
  const pat = pbt - d.taxExpense;

  return [
    {
      title: 'Revenue',
      lines: [
        { label: 'Sales — Amazon', amount: d.salesAmazon },
        { label: 'Sales — Flipkart', amount: d.salesFlipkart },
        { label: 'Sales — Myntra', amount: d.salesMyntra },
        { label: 'Sales — Meesho', amount: d.salesMeesho },
        { label: 'Sales — Shopify (D2C)', amount: d.salesShopify },
        { label: 'Revenue from operations', amount: revenueOps, bold: true, isSubtotal: true },
        { label: 'Other income', amount: d.otherIncome },
        { label: 'Total income', amount: totalIncome, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Cost of goods sold',
      lines: [
        { label: 'Opening inventory', amount: d.openingInventory },
        { label: 'Purchases / cost of materials consumed', amount: d.purchases },
        { label: 'Changes in inventories', amount: d.inventoryChange },
        { label: 'Total COGS', amount: totalCogs, bold: true, isSubtotal: true },
        { label: 'Gross profit', amount: grossProfit, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Operating expenses',
      lines: [
        { label: 'Marketing & advertising spend (Meta + Google + Amazon Ads + Marketplace PLAs)', amount: d.marketing },
        { label: 'Marketplace commissions & fees', amount: d.commissions },
        { label: 'Logistics & fulfilment (forward + RTO)', amount: d.logistics },
        { label: 'Payment gateway charges', amount: d.paymentGateway },
        { label: 'Employee benefits expense', amount: d.employee },
        { label: 'Rent', amount: d.rent },
        { label: 'Technology & software', amount: d.technology },
        { label: 'Other operating expenses', amount: d.otherOpex },
        { label: 'Total operating expenses', amount: totalOpex, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'EBITDA / EBIT / PBT / PAT',
      lines: [
        { label: 'EBITDA', amount: ebitda, bold: true, isSubtotal: true },
        { label: 'Depreciation & amortization', amount: d.depreciation },
        { label: 'EBIT', amount: ebit, bold: true, isSubtotal: true },
        { label: 'Finance costs', amount: d.financeCosts },
        { label: 'Profit before tax', amount: pbt, bold: true, isSubtotal: true },
        { label: 'Tax expense', amount: d.taxExpense },
        { label: 'Profit for the period', amount: pat, bold: true, isSubtotal: true },
      ],
    },
  ];
}

function priorAmountsFromSections(sections: StatementSection[]): Record<string, number> {
  const out: Record<string, number> = {};
  sections.forEach(section => section.lines.forEach(line => (out[line.label] = line.amount)));
  return out;
}

const PNL_INPUTS: Record<string, BasePnL> = {
  'apr-2026': {
    salesAmazon: 10_300_000,
    salesFlipkart: 8_500_000,
    salesMyntra: 5_600_000,
    salesMeesho: 1_900_000,
    salesShopify: 14_700_000,
    otherIncome: 220_000,
    openingInventory: 4_800_000,
    purchases: 17_500_000,
    inventoryChange: 120_000,
    marketing: 8_800_000,
    commissions: 4_100_000,
    logistics: 3_700_000,
    paymentGateway: 650_000,
    employee: 2_500_000,
    rent: 520_000,
    technology: 340_000,
    otherOpex: 1_050_000,
    depreciation: 420_000,
    financeCosts: 330_000,
    taxExpense: 850_000,
  },
  'may-2026': {
    salesAmazon: 10_900_000,
    salesFlipkart: 8_700_000,
    salesMyntra: 5_700_000,
    salesMeesho: 2_000_000,
    salesShopify: 15_100_000,
    otherIncome: 240_000,
    openingInventory: 4_700_000,
    purchases: 18_100_000,
    inventoryChange: -50_000,
    marketing: 9_100_000,
    commissions: 4_300_000,
    logistics: 3_850_000,
    paymentGateway: 690_000,
    employee: 2_550_000,
    rent: 520_000,
    technology: 360_000,
    otherOpex: 1_080_000,
    depreciation: 430_000,
    financeCosts: 340_000,
    taxExpense: 970_000,
  },
  'fy25-26-q1': {
    salesAmazon: 31_200_000,
    salesFlipkart: 25_800_000,
    salesMyntra: 17_500_000,
    salesMeesho: 5_400_000,
    salesShopify: 45_600_000,
    otherIncome: 620_000,
    openingInventory: 14_800_000,
    purchases: 53_500_000,
    inventoryChange: 1_300_000,
    marketing: 26_500_000,
    commissions: 12_600_000,
    logistics: 11_200_000,
    paymentGateway: 1_980_000,
    employee: 7_500_000,
    rent: 1_560_000,
    technology: 1_020_000,
    otherOpex: 3_180_000,
    depreciation: 1_250_000,
    financeCosts: 1_020_000,
    taxExpense: 2_180_000,
  },
  'fy24-25-q4': {
    salesAmazon: 28_000_000,
    salesFlipkart: 24_000_000,
    salesMyntra: 16_100_000,
    salesMeesho: 4_600_000,
    salesShopify: 39_000_000,
    otherIncome: 500_000,
    openingInventory: 13_500_000,
    purchases: 47_200_000,
    inventoryChange: 1_100_000,
    marketing: 24_000_000,
    commissions: 11_500_000,
    logistics: 10_100_000,
    paymentGateway: 1_780_000,
    employee: 6_900_000,
    rent: 1_500_000,
    technology: 920_000,
    otherOpex: 2_880_000,
    depreciation: 1_100_000,
    financeCosts: 940_000,
    taxExpense: 1_560_000,
  },
  'fy24-25': {
    salesAmazon: 109_000_000,
    salesFlipkart: 94_000_000,
    salesMyntra: 65_000_000,
    salesMeesho: 18_000_000,
    salesShopify: 157_000_000,
    otherIncome: 2_100_000,
    openingInventory: 50_000_000,
    purchases: 186_000_000,
    inventoryChange: 3_600_000,
    marketing: 89_000_000,
    commissions: 43_000_000,
    logistics: 37_000_000,
    paymentGateway: 7_100_000,
    employee: 26_500_000,
    rent: 6_000_000,
    technology: 3_600_000,
    otherOpex: 10_600_000,
    depreciation: 4_500_000,
    financeCosts: 3_700_000,
    taxExpense: 7_600_000,
  },
  'fy25-26-ytd': {
    salesAmazon: 21_200_000,
    salesFlipkart: 17_200_000,
    salesMyntra: 11_300_000,
    salesMeesho: 3_900_000,
    salesShopify: 29_800_000,
    otherIncome: 460_000,
    openingInventory: 9_500_000,
    purchases: 35_600_000,
    inventoryChange: 70_000,
    marketing: 17_900_000,
    commissions: 8_400_000,
    logistics: 7_550_000,
    paymentGateway: 1_340_000,
    employee: 5_050_000,
    rent: 1_040_000,
    technology: 700_000,
    otherOpex: 2_130_000,
    depreciation: 860_000,
    financeCosts: 680_000,
    taxExpense: 1_820_000,
  },
};

const PNL_SECTIONS: Record<string, StatementSection[]> = Object.fromEntries(
  Object.entries(PNL_INPUTS).map(([id, input]) => [id, pnlSections(input)])
);

/** Channel-mix and cost-line heuristics for Native-Glow-scale YoY variance. */
function buildPriorPnL(d: BasePnL): BasePnL {
  return {
    salesAmazon: Math.round(d.salesAmazon / 1.08),
    salesFlipkart: Math.round(d.salesFlipkart / 1.05),
    salesMyntra: Math.round(d.salesMyntra / 0.82),
    salesMeesho: Math.round(d.salesMeesho / 1.29),
    salesShopify: Math.round(d.salesShopify / 1.1),
    otherIncome: Math.round(d.otherIncome / 1.05),
    openingInventory: Math.round(d.openingInventory / 1.04),
    purchases: Math.round(d.purchases / 1.06),
    inventoryChange: Math.round(d.inventoryChange / 1.06),
    marketing: Math.round(d.marketing / 1.12),
    commissions: Math.round(d.commissions / 1.04),
    logistics: Math.round(d.logistics / 1.09),
    paymentGateway: Math.round(d.paymentGateway / 1.07),
    employee: Math.round(d.employee / 1.03),
    rent: d.rent,
    technology: Math.round(d.technology / 1.05),
    otherOpex: Math.round(d.otherOpex / 1.04),
    depreciation: Math.round(d.depreciation / 1.02),
    financeCosts: Math.round(d.financeCosts / 1.03),
    taxExpense: Math.round(d.taxExpense / 1.05),
  };
}

function buildPriorPnLYoY(d: BasePnL): BasePnL {
  return {
    salesAmazon: Math.round(d.salesAmazon / 1.1),
    salesFlipkart: Math.round(d.salesFlipkart / 1.07),
    salesMyntra: Math.round(d.salesMyntra / 0.85),
    salesMeesho: Math.round(d.salesMeesho / 1.35),
    salesShopify: Math.round(d.salesShopify / 1.12),
    otherIncome: Math.round(d.otherIncome / 1.08),
    openingInventory: Math.round(d.openingInventory / 1.05),
    purchases: Math.round(d.purchases / 1.07),
    inventoryChange: Math.round(d.inventoryChange / 1.07),
    marketing: Math.round(d.marketing / 1.14),
    commissions: Math.round(d.commissions / 1.05),
    logistics: Math.round(d.logistics / 1.1),
    paymentGateway: Math.round(d.paymentGateway / 1.08),
    employee: Math.round(d.employee / 1.04),
    rent: Math.round(d.rent / 1.02),
    technology: Math.round(d.technology / 1.06),
    otherOpex: Math.round(d.otherOpex / 1.05),
    depreciation: Math.round(d.depreciation / 1.03),
    financeCosts: Math.round(d.financeCosts / 1.04),
    taxExpense: Math.round(d.taxExpense / 1.06),
  };
}

function buildPriorPnLFy(d: BasePnL): BasePnL {
  return {
    salesAmazon: Math.round(d.salesAmazon / 1.12),
    salesFlipkart: Math.round(d.salesFlipkart / 1.09),
    salesMyntra: Math.round(d.salesMyntra / 0.88),
    salesMeesho: Math.round(d.salesMeesho / 1.4),
    salesShopify: Math.round(d.salesShopify / 1.15),
    otherIncome: Math.round(d.otherIncome / 1.1),
    openingInventory: Math.round(d.openingInventory / 1.06),
    purchases: Math.round(d.purchases / 1.08),
    inventoryChange: Math.round(d.inventoryChange / 1.08),
    marketing: Math.round(d.marketing / 1.16),
    commissions: Math.round(d.commissions / 1.06),
    logistics: Math.round(d.logistics / 1.11),
    paymentGateway: Math.round(d.paymentGateway / 1.09),
    employee: Math.round(d.employee / 1.05),
    rent: Math.round(d.rent / 1.03),
    technology: Math.round(d.technology / 1.07),
    otherOpex: Math.round(d.otherOpex / 1.06),
    depreciation: Math.round(d.depreciation / 1.04),
    financeCosts: Math.round(d.financeCosts / 1.05),
    taxExpense: Math.round(d.taxExpense / 1.07),
  };
}

function scaleLineItems(sections: StatementSection[], factors: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  sections.forEach(section =>
    section.lines.forEach(line => {
      const factor = factors[line.label] ?? 1.06;
      out[line.label] = Math.round(line.amount / factor);
    })
  );
  return out;
}

// Variances tuned to surface the Myntra-margin narrative.
const PNL_PRIOR_AMOUNTS: Record<string, Record<string, number>> = {
  'apr-2026': priorAmountsFromSections(pnlSections(buildPriorPnLYoY(PNL_INPUTS['apr-2026']))),
  'may-2026': priorAmountsFromSections(pnlSections(buildPriorPnL(PNL_INPUTS['may-2026']))),
  'fy25-26-q1': priorAmountsFromSections(PNL_SECTIONS['fy24-25-q4']),
  'fy24-25-q4': priorAmountsFromSections(pnlSections(buildPriorPnL(PNL_INPUTS['fy24-25-q4']))),
  'fy24-25': priorAmountsFromSections(pnlSections(buildPriorPnLFy(PNL_INPUTS['fy24-25']))),
  'fy25-26-ytd': priorAmountsFromSections(pnlSections(buildPriorPnL(PNL_INPUTS['fy25-26-ytd']))),
};

function cfsSections(periodId: string, openingCash: number, closingCash: number): StatementSection[] {
  const pnl = PNL_SECTIONS[periodId];
  const pbt = findLineAmount(pnl, 'Profit before tax');
  const depreciation = findLineAmount(pnl, 'Depreciation & amortization');
  const financeCosts = findLineAmount(pnl, 'Finance costs');
  const interestIncome = -Math.round(findLineAmount(pnl, 'Other income') * 0.55);

  // Tie-out note: CFS opening PBT comes from same-period P&L PBT.
  const opProfitBeforeWc = pbt + depreciation + financeCosts + interestIncome;
  const invDelta = -900_000;
  const recDelta = -1_500_000;
  const stlaDelta = -280_000;
  const payablesDelta = 1_100_000;
  const oclDelta = 680_000;
  const cashGenerated = opProfitBeforeWc + invDelta + recDelta + stlaDelta + payablesDelta + oclDelta;
  const taxPaid = -Math.round(findLineAmount(pnl, 'Tax expense') * 0.82);
  const netOp = cashGenerated + taxPaid;

  const ppePurchase = -1_150_000;
  const ppeSale = 0;
  const intangiblesPurchase = -130_000;
  const ltlaMovement = -70_000;
  const interestReceived = Math.abs(interestIncome);
  const netInv = ppePurchase + ppeSale + intangiblesPurchase + ltlaMovement + interestReceived;

  const ltBorrowingsProceeds = 600_000;
  const ltBorrowingsRepayment = -480_000;
  const stBorrowingsMove = -320_000;
  const financePaid = -financeCosts;
  const dividendsPaid = 0;
  const netFin = ltBorrowingsProceeds + ltBorrowingsRepayment + stBorrowingsMove + financePaid + dividendsPaid;

  // Tie-out note: A + B + C equals closing cash minus opening cash.
  const netIncrease = netOp + netInv + netFin;
  const forcedClose = openingCash + netIncrease;
  const closeAdjustment = closingCash - forcedClose;

  return [
    {
      title: 'Cash flow from operating activities',
      lines: [
        { label: 'Profit before tax', amount: pbt },
        { label: 'Depreciation and amortization', amount: depreciation, indent: 1 },
        { label: 'Finance costs', amount: financeCosts, indent: 1 },
        { label: 'Interest income', amount: interestIncome, indent: 1 },
        { label: 'Loss / (gain) on sale of PPE', amount: 0, indent: 1 },
        { label: 'Operating profit before working capital changes', amount: opProfitBeforeWc, bold: true, isSubtotal: true },
        { label: '(Increase) / decrease in inventories', amount: invDelta, indent: 1 },
        { label: '(Increase) / decrease in trade receivables', amount: recDelta, indent: 1 },
        { label: '(Increase) / decrease in short-term loans and advances', amount: stlaDelta, indent: 1 },
        { label: 'Increase / (decrease) in trade payables', amount: payablesDelta, indent: 1 },
        { label: 'Increase / (decrease) in other current liabilities', amount: oclDelta, indent: 1 },
        { label: 'Cash generated from operations', amount: cashGenerated, bold: true, isSubtotal: true },
        { label: 'Income tax paid', amount: taxPaid },
        { label: 'Net cash from / (used in) operating activities (A)', amount: netOp, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Cash flow from investing activities',
      lines: [
        { label: 'Purchase of PPE', amount: ppePurchase },
        { label: 'Sale of PPE', amount: ppeSale },
        { label: 'Purchase of intangible assets', amount: intangiblesPurchase },
        { label: 'Movements in long-term loans and advances', amount: ltlaMovement },
        { label: 'Interest income received', amount: interestReceived },
        { label: 'Net cash from / (used in) investing activities (B)', amount: netInv, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Cash flow from financing activities',
      lines: [
        { label: 'Proceeds from long-term borrowings', amount: ltBorrowingsProceeds },
        { label: 'Repayment of long-term borrowings', amount: ltBorrowingsRepayment },
        { label: 'Proceeds from / (repayment of) short-term borrowings', amount: stBorrowingsMove },
        { label: 'Finance costs paid', amount: financePaid },
        { label: 'Dividends paid', amount: dividendsPaid },
        { label: 'Net cash from / (used in) financing activities (C)', amount: netFin + closeAdjustment, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Reconciliation',
      lines: [
        { label: 'Net increase / (decrease) in cash and equivalents (A + B + C)', amount: netIncrease + closeAdjustment, bold: true, isSubtotal: true },
        { label: 'Cash and equivalents at beginning of period', amount: openingCash },
        { label: 'Cash and equivalents at end of period', amount: closingCash, bold: true, isSubtotal: true },
      ],
    },
  ];
}

function cfsPriorAmounts(periodId: string, openingCash: number, closingCash: number): Record<string, number> {
  const current = cfsSections(periodId, openingCash, closingCash);
  // Variances tuned to surface the Myntra-margin narrative.
  const factors: Record<string, number> = {
    'Profit before tax': 1.06,
    'Depreciation and amortization': 1.02,
    'Finance costs': 1.03,
    'Interest income': 1.05,
    'Operating profit before working capital changes': 1.06,
    '(Increase) / decrease in inventories': 1.08,
    '(Increase) / decrease in trade receivables': 1.1,
    '(Increase) / decrease in short-term loans and advances': 1.05,
    'Increase / (decrease) in trade payables': 1.07,
    'Increase / (decrease) in other current liabilities': 1.04,
    'Cash generated from operations': 1.06,
    'Income tax paid': 1.05,
    'Net cash from / (used in) operating activities (A)': 1.06,
    'Purchase of PPE': 1.12,
    'Purchase of intangible assets': 1.1,
    'Net cash from / (used in) investing activities (B)': 1.08,
    'Proceeds from long-term borrowings': 1.15,
    'Repayment of long-term borrowings': 1.04,
    'Proceeds from / (repayment of) short-term borrowings': 1.06,
    'Finance costs paid': 1.03,
    'Net cash from / (used in) financing activities (C)': 1.05,
    'Net increase / (decrease) in cash and equivalents (A + B + C)': 1.06,
    'Cash and equivalents at beginning of period': 1.04,
    'Cash and equivalents at end of period': 1.05,
  };
  return scaleLineItems(current, factors);
}

function findLineAmount(sections: StatementSection[], label: string): number {
  for (const section of sections) {
    const row = section.lines.find(line => line.label === label);
    if (row) return row.amount;
  }
  return 0;
}

const BS_CASH_BY_PERIOD: Record<string, number> = {
  'as-on-2025-03-31': 9_200_000,
  'as-on-2026-03-31': 12_400_000,
  'as-on-2026-04-30': 13_020_000,
};

function bsSections(cash: number, retainedEarnings: number, stBorrowings: number, payables: number): StatementSection[] {
  const shareCapital = 6_000_000;
  const reserves = retainedEarnings;
  const totalEquity = shareCapital + reserves;
  const ltBorrowings = 12_000_000;
  const ltProvisions = 1_100_000;
  const totalNonCurrentLiabilities = ltBorrowings + ltProvisions;
  const tradePayablesMsme = Math.round(payables * 0.28);
  const tradePayablesNonMsme = payables - tradePayablesMsme;
  const otherCurrentLiabilities = 3_800_000;
  const stProvisions = 920_000;
  const totalCurrentLiabilities = tradePayablesMsme + tradePayablesNonMsme + stBorrowings + otherCurrentLiabilities + stProvisions;
  const totalEqLiab = totalEquity + totalNonCurrentLiabilities + totalCurrentLiabilities;

  const ppe = 18_800_000;
  const intangibles = 1_900_000;
  const ltAdv = 1_250_000;
  const totalNonCurrentAssets = ppe + intangibles + ltAdv;
  const invRaw = 7_600_000;
  const invFinished = 6_900_000;
  const invTotal = invRaw + invFinished;
  const recvMarketplace = 5_900_000;
  const recvOther = 1_100_000;
  const stAdv = totalEqLiab - (totalNonCurrentAssets + invTotal + recvMarketplace + recvOther + cash);
  const totalCurrentAssets = invTotal + recvMarketplace + recvOther + cash + stAdv;
  const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

  return [
    {
      title: 'Equity & Liabilities',
      lines: [
        { label: 'Share capital', amount: shareCapital },
        { label: 'Reserves and surplus', amount: reserves },
        { label: 'Total equity', amount: totalEquity, bold: true, isSubtotal: true },
        { label: 'Long-term borrowings (term loans)', amount: ltBorrowings },
        { label: 'Long-term provisions', amount: ltProvisions },
        { label: 'Total non-current liabilities', amount: totalNonCurrentLiabilities, bold: true, isSubtotal: true },
        { label: 'Trade payables — MSME', amount: tradePayablesMsme, indent: 1 },
        { label: 'Trade payables — non-MSME', amount: tradePayablesNonMsme, indent: 1 },
        { label: 'Short-term borrowings (working capital line)', amount: stBorrowings },
        { label: 'Other current liabilities (accrued expenses, statutory dues incl. GST/TDS payable)', amount: otherCurrentLiabilities },
        { label: 'Short-term provisions', amount: stProvisions },
        { label: 'Total current liabilities', amount: totalCurrentLiabilities, bold: true, isSubtotal: true },
        { label: 'Total equity and liabilities', amount: totalEqLiab, bold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Assets',
      lines: [
        { label: 'Property, plant and equipment', amount: ppe },
        { label: 'Intangible assets', amount: intangibles },
        { label: 'Long-term loans and advances (security deposits)', amount: ltAdv },
        { label: 'Total non-current assets', amount: totalNonCurrentAssets, bold: true, isSubtotal: true },
        { label: 'Inventories — raw materials', amount: invRaw, indent: 1 },
        { label: 'Inventories — finished goods', amount: invFinished, indent: 1 },
        { label: 'Trade receivables — marketplace settlements pending', amount: recvMarketplace },
        { label: 'Trade receivables — other', amount: recvOther },
        { label: 'Cash and bank balances', amount: cash },
        { label: 'Short-term loans and advances (GST refund receivable, TDS receivable)', amount: stAdv },
        { label: 'Total current assets', amount: totalCurrentAssets, bold: true, isSubtotal: true },
        { label: 'Total assets', amount: totalAssets, bold: true, isSubtotal: true },
      ],
    },
  ];
}

const STATEMENTS: Record<StatementType, Record<string, ArtifactStatement>> = {
  pnl: {
    'apr-2026': statement('pnl', 'apr-2026', 'apr-2025', PNL_SECTIONS['apr-2026'], PNL_PRIOR_AMOUNTS['apr-2026']),
    'may-2026': statement('pnl', 'may-2026', 'apr-2025', PNL_SECTIONS['may-2026'], PNL_PRIOR_AMOUNTS['may-2026']),
    'fy25-26-q1': statement('pnl', 'fy25-26-q1', 'fy24-25-q4', PNL_SECTIONS['fy25-26-q1'], PNL_PRIOR_AMOUNTS['fy25-26-q1']),
    'fy24-25-q4': statement('pnl', 'fy24-25-q4', 'fy24-25-q3', PNL_SECTIONS['fy24-25-q4'], PNL_PRIOR_AMOUNTS['fy24-25-q4']),
    'fy24-25': statement('pnl', 'fy24-25', 'fy23-24', PNL_SECTIONS['fy24-25'], PNL_PRIOR_AMOUNTS['fy24-25']),
    'fy25-26-ytd': statement('pnl', 'fy25-26-ytd', 'fy24-25-ytd', PNL_SECTIONS['fy25-26-ytd'], PNL_PRIOR_AMOUNTS['fy25-26-ytd']),
  },
  'cash-flow': {
    'apr-2026': statement(
      'cash-flow',
      'apr-2026',
      'apr-2025',
      cfsSections('apr-2026', BS_CASH_BY_PERIOD['as-on-2026-03-31'], BS_CASH_BY_PERIOD['as-on-2026-04-30']),
      cfsPriorAmounts('apr-2026', BS_CASH_BY_PERIOD['as-on-2026-03-31'], BS_CASH_BY_PERIOD['as-on-2026-04-30'])
    ),
    'may-2026': statement(
      'cash-flow',
      'may-2026',
      'may-2025',
      cfsSections('may-2026', BS_CASH_BY_PERIOD['as-on-2026-04-30'], 13_780_000),
      cfsPriorAmounts('may-2026', BS_CASH_BY_PERIOD['as-on-2026-04-30'], 13_780_000)
    ),
    'fy25-26-q1': statement(
      'cash-flow',
      'fy25-26-q1',
      'fy24-25-q4',
      cfsSections('fy25-26-q1', BS_CASH_BY_PERIOD['as-on-2026-03-31'], 14_950_000),
      priorAmountsFromSections(cfsSections('fy24-25-q4', BS_CASH_BY_PERIOD['as-on-2025-03-31'], BS_CASH_BY_PERIOD['as-on-2026-03-31']))
    ),
    'fy24-25-q4': statement(
      'cash-flow',
      'fy24-25-q4',
      'fy24-25-q3',
      cfsSections('fy24-25-q4', BS_CASH_BY_PERIOD['as-on-2025-03-31'], BS_CASH_BY_PERIOD['as-on-2026-03-31']),
      cfsPriorAmounts('fy24-25-q4', BS_CASH_BY_PERIOD['as-on-2025-03-31'], BS_CASH_BY_PERIOD['as-on-2026-03-31'])
    ),
    'fy24-25': statement(
      'cash-flow',
      'fy24-25',
      'fy23-24',
      cfsSections('fy24-25', 8_100_000, BS_CASH_BY_PERIOD['as-on-2025-03-31']),
      cfsPriorAmounts('fy24-25', 8_100_000, BS_CASH_BY_PERIOD['as-on-2025-03-31'])
    ),
    'fy25-26-ytd': statement(
      'cash-flow',
      'fy25-26-ytd',
      'fy24-25-ytd',
      cfsSections('fy25-26-ytd', BS_CASH_BY_PERIOD['as-on-2026-03-31'], 13_780_000),
      cfsPriorAmounts('fy25-26-ytd', BS_CASH_BY_PERIOD['as-on-2026-03-31'], 13_780_000)
    ),
  },
  'balance-sheet': {
    'may-2026': statement('balance-sheet', 'may-2026', 'fy24-25-q4', bsSections(BS_CASH_BY_PERIOD['as-on-2026-04-30'], 26_400_000, 5_600_000, 8_900_000), priorAmountsFromSections(bsSections(BS_CASH_BY_PERIOD['as-on-2026-03-31'], 24_700_000, 5_900_000, 8_400_000)), 'As at 30 April 2026'),
    'fy24-25-q4': statement('balance-sheet', 'fy24-25-q4', 'fy24-25', bsSections(BS_CASH_BY_PERIOD['as-on-2026-03-31'], 24_700_000, 5_900_000, 8_400_000), priorAmountsFromSections(bsSections(BS_CASH_BY_PERIOD['as-on-2025-03-31'], 18_200_000, 5_200_000, 7_500_000)), 'As at 31 March 2026'),
    'fy24-25': statement(
      'balance-sheet',
      'fy24-25',
      undefined,
      bsSections(BS_CASH_BY_PERIOD['as-on-2025-03-31'], 18_200_000, 5_200_000, 7_500_000),
      scaleLineItems(bsSections(BS_CASH_BY_PERIOD['as-on-2025-03-31'], 18_200_000, 5_200_000, 7_500_000), {
        'Reserves and surplus': 1.08,
        'Cash and bank balances': 1.06,
        'Trade receivables — marketplace settlements pending': 1.1,
        'Inventories — raw materials': 1.05,
        'Inventories — finished goods': 1.07,
        'Short-term borrowings (working capital line)': 1.04,
      }),
      'As at 31 March 2025'
    ),
  },
};

function statement(
  statementType: StatementType,
  periodId: string,
  priorId: string | undefined,
  sections: StatementSection[],
  priorAmounts: Record<string, number>,
  asOfLabel?: string
): ArtifactStatement {
  return {
    kind: 'statement',
    statementType,
    period: STATEMENT_PERIODS[periodId],
    priorPeriod: priorId ? toPeriod(priorId) : undefined,
    sections,
    priorAmounts,
    currency: 'INR',
    unit: defaultUnit(STATEMENT_PERIODS[periodId]),
    asOfLabel,
  };
}

function toPeriod(id: string): StatementPeriod {
  return STATEMENT_PERIODS[id] ?? { id, label: id, type: 'quarter' };
}

function defaultUnit(period: StatementPeriod): 'absolute' | 'lakhs' | 'crores' {
  return period.type === 'fy' ? 'crores' : 'lakhs';
}

function titleForType(type: StatementType): string {
  if (type === 'pnl') return 'Statement of Profit and Loss';
  if (type === 'balance-sheet') return 'Balance Sheet';
  return 'Cash Flow Statement';
}

export function getStatementResponse(type: StatementType, period: StatementPeriod): V3CannedResponse {
  const stmt = STATEMENTS[type][period.id] ?? (type === 'balance-sheet' ? STATEMENTS[type]['may-2026'] : STATEMENTS[type]['fy25-26-q1']);
  const patOrClose = findLineAmount(stmt.sections, type === 'balance-sheet' ? 'Total assets' : type === 'cash-flow' ? 'Net increase / (decrease) in cash and equivalents (A + B + C)' : 'Profit for the period');
  const revenue = findLineAmount(stmt.sections, 'Revenue from operations');
  const pbt = findLineAmount(stmt.sections, 'Profit before tax');
  const opCash = findLineAmount(stmt.sections, 'Net cash from / (used in) operating activities (A)');
  const invCash = findLineAmount(stmt.sections, 'Net cash from / (used in) investing activities (B)');
  const finCash = findLineAmount(stmt.sections, 'Net cash from / (used in) financing activities (C)');

  const body =
    type === 'cash-flow'
      ? `Operating cash ${fmtSignedLakhs(opCash)}, investing ${fmtSignedLakhs(invCash)}, financing ${fmtSignedLakhs(finCash)} — net ${fmtSignedLakhs(patOrClose)} for the period.`
      : type === 'balance-sheet'
        ? `Total assets ${fmtCrores(patOrClose)}. Assets reconcile with equity and liabilities as at ${stmt.asOfLabel ?? stmt.period.label}.`
        : `Net profit ${fmtLakhs(patOrClose)} on ${fmtCrores(revenue)} revenue — PBT ${fmtLakhs(pbt)}.`;

  return {
    id: `statement_${type}_${stmt.period.id}`,
    match: [],
    agentId: 'krishan',
    headline: `${titleForType(type)} for ${stmt.period.label}`,
    body,
    artifact: stmt,
    drillLink: { label: 'Open Reports →', deepLink: { agentId: 'krishan', officeTab: 'Reports' } },
    pages: ['home', 'office:krishan'],
  };
}

function fmtLakhs(v: number): string {
  return `₹ ${(v / 100_000).toFixed(1)} L`;
}
function fmtCrores(v: number): string {
  return `₹ ${(v / 10_000_000).toFixed(2)} Cr`;
}
function fmtSignedLakhs(v: number): string {
  const abs = Math.abs(v / 100_000).toFixed(1);
  return `${v >= 0 ? '+' : '−'}₹${abs} L`;
}

export function getStatementArtifact(type: StatementType, periodId: string): ArtifactStatement | null {
  return STATEMENTS[type][periodId] ?? null;
}

export function getStatementPeriodsForType(type: StatementType): StatementPeriod[] {
  if (type === 'balance-sheet') {
    return [STATEMENT_PERIODS['may-2026'], STATEMENT_PERIODS['fy24-25-q4'], STATEMENT_PERIODS['fy24-25']];
  }
  return [
    STATEMENT_PERIODS['apr-2026'],
    STATEMENT_PERIODS['may-2026'],
    STATEMENT_PERIODS['fy25-26-q1'],
    STATEMENT_PERIODS['fy24-25-q4'],
    STATEMENT_PERIODS['fy24-25'],
    STATEMENT_PERIODS['fy25-26-ytd'],
  ];
}
