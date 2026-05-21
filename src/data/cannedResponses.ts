import type { V3CannedResponse } from '../v3Types';

const HOME: V3CannedResponse['pages'] = ['home'];
const VEERA: V3CannedResponse['pages'] = ['home', 'office:veera'];
const PRIYA: V3CannedResponse['pages'] = ['home', 'office:priya'];
const ROHAN: V3CannedResponse['pages'] = ['home', 'office:rohan'];
const MAYA: V3CannedResponse['pages'] = ['home', 'office:maya'];
const ANKITA: V3CannedResponse['pages'] = ['home', 'office:ankita'];

export const V3_CANNED: V3CannedResponse[] = [
  {
    id: 'v3_cash',
    match: [/cash position|runway|how much cash/i],
    agentId: 'veera',
    headline: 'Cash position ₹1.42 cr. Runway 11.2 weeks.',
    body: 'Bank balance ₹1.42 cr across HDFC + ICICI. Settlement pipeline ₹52.4 L. Weekly burn ₹22.1 L. Three items need your call today — see the priority cards above.',
    chips: ["What's our runway in a bear case?", 'Show 13-week forecast', 'What needs my approval today?'],
    pages: VEERA,
  },
  {
    id: 'v3_mer',
    match: [/blended mer|mer this week|marketing efficiency/i],
    agentId: 'maya',
    headline: 'Blended MER this week is 2.41× — down from 2.68× last week.',
    body: 'Myntra prospecting is the drag (0.79× PoAS). Shopify brand search is healthy at 3.2×. I have a reallocation ready that shifts ₹3.8L/wk — review the card on Home.',
    chips: ['Which campaigns should we pause?', 'Show burn list', 'Explain PoAS vs ROAS'],
    pages: MAYA,
  },
  {
    id: 'v3_unreconciled',
    match: [/unreconciled.*50|unreconciled items/i],
    agentId: 'rohan',
    headline: '4 open exceptions over ₹50k — ₹4.21 L total variance.',
    body: 'Top items: Flipkart missing settlement ₹1.84 L (62h), Amazon overcharge ₹98k, Cashfree PG late credit ₹72k. Run reconciliation is current as of 12 min ago.',
    chips: ['Show exceptions over ₹1L', 'File Flipkart claim', 'What is TCS?'],
    pages: ROHAN,
  },
  {
    id: 'v3_ankita_pending',
    match: [/pending with ankita|ankita this week/i],
    agentId: 'ankita',
    headline: 'Ankita has 3 items pending your sign-off this week.',
    body: 'GSTR-3B for Apr 2026 (due in 3 days), 2B mismatch on 12 invoices (₹47k ITC at risk), and Amazon TCS lag (2 days). GSTR-1 for Apr was auto-filed on the 11th.',
    chips: ['Open GSTR-3B draft', 'Show 2B mismatches', 'What is GSTR-2B?'],
    pages: ANKITA,
  },
  {
    id: 'v3_vendor_pay',
    match: [/vendor payment|approve.*payment|pending payment/i],
    agentId: 'priya',
    headline: '3 vendor payments totalling ₹2,42,000 await CFO approval.',
    body: 'All are known vendors with clean three-way match. A1 Packaging is held — invoice anomaly flagged. The other two are within policy but above my auto-pay ceiling.',
    chips: ['Show AP aging', 'What is MSME 43B?', 'Open payment runs'],
    pages: PRIYA,
  },
  {
    id: 'v3_a1',
    match: [/a1 packaging|invoice anomaly/i],
    agentId: 'priya',
    headline: 'A1 Packaging invoice is 3× the 12-week average while orders grew 12%.',
    body: 'March invoice ₹4.8L vs trailing avg ₹1.6L. I sent a chase email at 09:14 today. Payment is blocked until Krishan or you approve after vendor reply.',
    chips: ['Show vendor master', 'Explain three-way match', 'MSME status for A1'],
    pages: PRIYA,
  },
  {
    id: 'v3_brief',
    match: [/morning brief|founder brief|weekly brief/i],
    agentId: 'veera',
    headline: 'This week: ₹62.4 L net on ₹4.18 cr GMV — margin 14.9%, down 180 bps WoW.',
    body: 'Myntra is the bleeder. Three decisions for you: vendor payments, Maya reallocation, GSTR-3B sign-off. Full brief is in my Brief tab.',
    chips: ['Open escalation queue', 'Channel economics', 'Cash runway'],
    pages: VEERA,
  },
  {
    id: 'v3_claims',
    match: [/flipkart claim|recovered claim|pending claims/i],
    agentId: 'rohan',
    headline: 'Flipkart claim FK-2398 for ₹68,400 is resolved — needs your review.',
    body: 'Marketplace credited on 17 May. Matches our filed amount. Two other claims over 30 days remain open (₹3.84 L).',
    chips: ['Show claims aging', 'Run reconciliation', 'Returns recovery summary'],
    pages: ROHAN,
  },
  {
    id: 'jargon_tcs',
    match: [/^what is tcs|explain tcs|define tcs/i],
    agentId: 'ankita',
    kind: 'jargon',
    headline: 'TCS = Tax Collected at Source.',
    body: 'Under Section 52 of the GST Act, e-commerce operators collect 1% of net taxable supplies and deposit with the government. You claim it as credit in GSTR-3B. CoWorker reconciles marketplace TCS against Form 26AS.',
    pages: HOME,
  },
  {
    id: 'jargon_tds',
    match: [/^what is tds|explain tds|define tds/i],
    agentId: 'priya',
    kind: 'jargon',
    headline: 'TDS = Tax Deducted at Source.',
    body: 'Tax deducted before payment. Marketplaces deduct on your sales (194-O). You deduct when paying vendors (194C, 194I, 194J). Form 26Q quarterly; Form 16A to vendors.',
    pages: HOME,
  },
  {
    id: 'jargon_gstr2b',
    match: [/^what is gstr-2b|explain gstr.?2b|define gstr.?2b/i],
    agentId: 'ankita',
    kind: 'jargon',
    headline: 'GSTR-2B = your auto-generated input tax credit statement.',
    body: 'Generated around the 14th each month from vendors\' GSTR-1 filings. Unfiled vendor invoices do not appear — you cannot claim that ITC until they file.',
    pages: HOME,
  },
  {
    id: 'jargon_msme',
    match: [/^what is msme|explain msme|43b/i],
    agentId: 'priya',
    kind: 'jargon',
    headline: 'MSME 43B(h) — pay within 45 days or lose the deduction.',
    body: 'For purchases from UDYAM-registered MSMEs, payments must clear within 45 days of invoice or the expense is disallowed until paid. I track the clock on every MSME vendor.',
    pages: HOME,
  },
];

export function getCannedById(id: string) {
  return V3_CANNED.find(r => r.id === id);
}

export function getChipsForPage(page: import('../v3Types').ChatPage, mention?: import('../v3Types').AgentId): string[] {
  const pool = V3_CANNED.filter(r => {
    if (r.kind === 'jargon') return false;
    if (mention && r.agentId !== mention) return false;
    return !r.pages || r.pages.includes(page);
  });
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const r of pool) {
    for (const c of r.chips ?? []) {
      if (!seen.has(c)) {
        seen.add(c);
        chips.push(c);
      }
    }
  }
  return chips.slice(0, 4);
}
