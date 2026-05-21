# Cursor Prompt: Make "Ask CoWorker" page-aware

Make the Ask CoWorker chat panel surface the **5 most relevant suggestion chips for the page the user is currently on**. The chip set changes when the user navigates. Typed questions still match across the full library so the user can ask anything from anywhere — the page filter is only on the visible chips.

Files affected:
- `src/components/AskCoWorkerPanel.tsx` (accept new prop, filter chips by page)
- `src/data/askCoWorkerResponses.ts` (add `pages` field to each response, add ~34 new responses)
- `src/utils/matchCannedQuestion.ts` (extend the canonical-question list)
- `src/App.tsx` (pass current page to the panel)

---

## 1. PROP CHANGE — `AskCoWorkerPanel`

Add a `currentPage` prop to the panel component. The page value comes from the `activeTab` state in `App.tsx`.

```ts
type Tab = 'home' | 'pnl' | 'reconciliation' | 'returns' | 'ads' | 'cash' | 'reports' | 'compliance' | 'connections';

type AskCoWorkerPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  currentPage: Tab;
};
```

In `App.tsx`, update the panel render:

```tsx
<AskCoWorkerPanel
  isOpen={showChat}
  onClose={() => setShowChat(false)}
  onNavigate={...existing...}
  currentPage={activeTab}
/>
```

---

## 2. DATA MODEL CHANGE — `CannedResponse.pages`

Extend the `CannedResponse` type in `src/data/askCoWorkerResponses.ts`:

```ts
export type CannedResponse = {
  id: string;              // stable key, e.g. "myntra_margin"
  question: string;        // canonical question text (used as chip label)
  pages: Tab[];            // which pages should show this as a chip
  keywords: string[];      // for fuzzy matching against typed input
  headline: string;
  body: string;
  artifact?: TableArtifact | BarsArtifact | CompareArtifact;
  sources: string[];
  drillLink?: { label: string; route: string };
};
```

The existing 5 responses keep their existing fields and gain a `pages` array (see section 3).

---

## 3. THE QUESTION LIBRARY — 5 chips per page

Each page surfaces 5 chips. Questions can appear on multiple pages — define them once with a `pages` array.

### Home — Founder's overview

1. *"What are my top 3 leaks this week?"*
2. *"Why is Myntra margin down this week?"* (existing)
3. *"Show pending claims older than 30 days"* (existing)
4. *"How is my cash runway trending?"*
5. *"What compliance filings are due this week?"*

### Channel Economics (`pnl`)

1. *"Which channel is most profitable this month?"* (existing)
2. *"Why is Myntra margin down this week?"* (existing)
3. *"Compare Amazon vs Flipkart unit economics"*
4. *"Where is the biggest leak in Flipkart's P&L?"*
5. *"Which SKUs lose money on Myntra?"*

### Reconciliation

1. *"Show me all open exceptions over ₹50K"*
2. *"What's pending bank credit from Cashfree?"*
3. *"Categorise unreconciled bank txns from this week"*
4. *"Did Flipkart settle the correct amount this week?"*
5. *"Are there overcharged returns to dispute?"*

### Returns & Recovery

1. *"Show pending claims older than 30 days"* (existing)
2. *"How much money are we losing to returns this month?"*
3. *"Which SKUs are returning at the highest rate?"*
4. *"Why is Myntra return rate so high?"*
5. *"Are there overcharged returns to dispute?"*

### Marketing Efficiency (`ads`)

1. *"What if I cut Meta spend by 30%?"* (existing)
2. *"What's my real PoAS across all platforms?"*
3. *"Which campaigns should I pause this week?"*
4. *"Where should I shift ad spend for the best ROI?"*
5. *"Compare Google vs Meta customer economics"*

### Cash & Runway

1. *"How is my cash runway trending?"*
2. *"When will my cash dip below ₹1 Cr?"*
3. *"What's my COD-failure-adjusted cash forecast?"*
4. *"Should I move idle cash to a liquid fund?"*
5. *"Compare this quarter's cash flow vs last"*

### Reports

1. *"Generate the P&L for last quarter"* (existing)
2. *"Pull the Balance Sheet as on today"*
3. *"What was my channel-wise revenue split last FY?"*
4. *"Generate GSTR-1 filing pack for May"*
5. *"Show settlement reconciliation for last month"*

### Compliance

1. *"What compliance filings are due this week?"*
2. *"How much input tax credit is at risk?"*
3. *"Are any MSME payments overdue?"*
4. *"Show me the TCS variance with Form 26AS"*
5. *"What's my compliance health score?"*

### Connections

1. *"Which connections need re-authentication?"*
2. *"When was Tally last synced?"*
3. *"Are all marketplaces connected?"*
4. *"Show me sync errors from this week"*
5. *"What's the data freshness across all connections?"*

---

## 4. CHIP RENDERING LOGIC

In `AskCoWorkerPanel.tsx`, replace the hard-coded chip list with a filter against `currentPage`:

```tsx
const visibleChips = useMemo(
  () => RESPONSES.filter(r => r.pages.includes(currentPage)).slice(0, 5),
  [currentPage]
);
```

Render `visibleChips.map(r => <SuggestionChip text={r.question} onClick={() => handleSubmit(r.question)} />)`.

Chip styling stays the same — 1 px `border-gray-200`, 6 px radius, white background, 13 px `text-gray-600`, hover `bg-purple-50 text-primary border-primary`.

**Empty state:** If a page has fewer than 5 chips defined, show what's available — don't pad with off-page questions.

---

## 5. MATCH LOGIC — typed questions still work across pages

The match in `matchCannedQuestion.ts` does **not** scope by page. A user on Connections who types *"Why is Myntra margin down?"* still gets the full Myntra response. Only the visible chips are page-filtered.

Update the matcher to enumerate every response in the library (not just the 5 existing):

```ts
import { RESPONSES } from '../data/askCoWorkerResponses';

export function matchCannedQuestion(input: string): string | null {
  const n = input.toLowerCase().trim().replace(/[.?!]+$/g, '');
  // Exact match on canonical question
  const exact = RESPONSES.find(r => r.question.toLowerCase().replace(/[.?!]+$/g, '') === n);
  if (exact) return exact.id;
  // Fuzzy keyword match
  const fuzzy = RESPONSES.find(r => r.keywords.every(k => n.includes(k.toLowerCase())));
  if (fuzzy) return fuzzy.id;
  return null;
}
```

This drops the hard-coded `CANNED` array in the current file. The single source of truth is `RESPONSES` from the data file.

---

## 6. SHORT CANNED RESPONSES — ~34 new entries

Each new response must have `id`, `question`, `pages`, `keywords`, `headline`, `body`, `sources`, and optionally a small `artifact` and `drillLink`. Below is the full inventory. Headlines and bodies use the existing Native Glow numbers and tone.

### Existing 5 — add `pages` arrays

```ts
{
  id: 'q1_myntra_margin',
  question: 'Why is Myntra margin down this week?',
  pages: ['home', 'pnl', 'ads'],
  keywords: ['myntra', 'margin'],
  // ... existing headline, body, artifact, sources, drillLink
},
{
  id: 'q2_pending_claims',
  question: 'Show pending claims older than 30 days',
  pages: ['home', 'returns'],
  keywords: ['pending', 'claims'],
  // ...
},
{
  id: 'q3_pnl_quarter',
  question: 'Generate the P&L for last quarter',
  pages: ['home', 'reports'],
  keywords: ['p&l', 'last quarter'],
  // ...
},
{
  id: 'q4_meta_spend',
  question: 'What if I cut Meta spend by 30%?',
  pages: ['home', 'ads'],
  keywords: ['meta', 'spend'],
  // ...
},
{
  id: 'q5_channel_profitable',
  question: 'Which channel is most profitable this month?',
  pages: ['home', 'pnl'],
  keywords: ['channel', 'profitable'],
  // ...
},
```

### New 34 — short canned responses

The structure below is the recommended pattern; Cursor can flesh out `headline` and `body` consistently with the Native Glow data. Where an artifact would land, a brief description is provided.

```ts
// Home extras
{
  id: 'top_leaks',
  question: 'What are my top 3 leaks this week?',
  pages: ['home'],
  keywords: ['top', 'leaks'],
  headline: 'Three leaks worth ₹4.6 L this week — all recoverable.',
  body: 'Myntra Meta ad burn, ₹3.84 L of pending claims with windows closing, and ₹47K of GSTR-2B input credit at risk.',
  artifact: { kind: 'table', columns: ['Leak', 'Amount', 'Recoverable?'], rows: [
    ['Myntra Meta ad burn', '₹2.4 L', 'Cut spend'],
    ['Pending Flipkart claims', '₹3.84 L', 'File before Sat'],
    ['GSTR-2B mismatch', '₹47K', 'Notify vendor'],
  ] },
  sources: ['Meta Ads', 'Flipkart Seller Hub', 'GST portal'],
  drillLink: { label: 'Open Top 3 Actions →', route: '/home' },
},

{
  id: 'runway_trending',
  question: 'How is my cash runway trending?',
  pages: ['home', 'cash'],
  keywords: ['runway', 'trending'],
  headline: 'Runway is 11.4 months — down from 12.1 last month.',
  body: 'COD failure rate is up 3 pts; if it persists, runway compresses to 10.2 months by month-end. Recommend moving ₹40 L from current to overnight liquid (5.8% yield).',
  sources: ['HDFC Bank', 'ICICI Bank', 'CoWorker cash engine'],
  drillLink: { label: 'Open Cash & Runway →', route: '/cash' },
},

{
  id: 'compliance_due',
  question: 'What compliance filings are due this week?',
  pages: ['home', 'compliance'],
  keywords: ['compliance', 'filings', 'due'],
  headline: '5 filings due this week — 2 pending, 3 not started.',
  artifact: { kind: 'table', columns: ['Filing', 'State', 'Due', 'Status'], rows: [
    ['GSTR-1', 'DL', '21 May', 'Pending'],
    ['GSTR-3B', 'KA', '20 May', 'Pending'],
    ['PF ECR', '—', 'Today', 'Not started'],
    ['ESI', '—', '15 May', 'Not started'],
    ['Professional Tax (MH)', 'MH', '21 May', 'Not started'],
  ] },
  sources: ['CoWorker Compliance Calendar'],
  drillLink: { label: 'Open Compliance →', route: '/compliance' },
},

// Channel Economics extras
{
  id: 'amazon_vs_flipkart',
  question: 'Compare Amazon vs Flipkart unit economics',
  pages: ['pnl'],
  keywords: ['amazon', 'flipkart', 'compare'],
  headline: 'Amazon nets 16.8% margin; Flipkart nets 11.2%. The gap is mostly commission.',
  artifact: { kind: 'table', columns: ['Line', 'Amazon', 'Flipkart'], rows: [
    ['Net Sales', '₹1.04 Cr', '₹86 L'],
    ['Marketplace charges', '−₹19.8 L', '−₹26.4 L'],
    ['Returns', '−₹3.2 L', '−₹4.8 L'],
    ['Contribution margin', '₹19.8 L', '₹10.9 L'],
    ['Margin %', '16.8%', '11.2%'],
  ] },
  sources: ['Amazon MTR', 'Flipkart Settlement Report'],
  drillLink: { label: 'Open Channel Economics →', route: '/pnl' },
},

{
  id: 'flipkart_leak',
  question: 'Where is the biggest leak in Flipkart\'s P&L?',
  pages: ['pnl'],
  keywords: ['flipkart', 'leak'],
  headline: 'Shipping Fee at 20.78% of net sales — the largest deduction.',
  body: 'Followed by Commission at 12.36% (overcharged by ₹3,247 vs rate card — claim eligible).',
  sources: ['Flipkart Settlement Report'],
  drillLink: { label: 'Open Flipkart P&L →', route: '/pnl' },
},

{
  id: 'myntra_losing_skus',
  question: 'Which SKUs lose money on Myntra?',
  pages: ['pnl', 'returns'],
  keywords: ['myntra', 'sku', 'lose'],
  headline: '4 SKUs are net-negative on Myntra — combined loss ₹47K this month.',
  artifact: { kind: 'table', columns: ['SKU', 'Net contribution', 'Return rate'], rows: [
    ['Hydrating Hair Mask', '−₹18K', '64%'],
    ['Body Butter Cocoa', '−₹14K', '52%'],
    ['Scalp Repair Serum', '−₹9K', '38%'],
    ['Anti-Acne Cleanser', '−₹6K', '31%'],
  ] },
  sources: ['Myntra Partner Portal', 'CoWorker SKU profitability engine'],
  drillLink: { label: 'Open Channel Economics →', route: '/pnl' },
},

// Reconciliation
{
  id: 'open_exceptions_large',
  question: 'Show me all open exceptions over ₹50K',
  pages: ['home', 'reconciliation'],
  keywords: ['open', 'exceptions'],
  headline: '6 exceptions over ₹50K — total ₹2.84 L. Largest is a Cashfree settlement pending 49 hours.',
  artifact: { kind: 'table', columns: ['Type', 'Source', 'Amount', 'Aging'], rows: [
    ['Late credit', 'Cashfree PG', '₹18.7 L', '49 hrs'],
    ['Missing settlement', 'Amazon', '₹3.84 L', '4 days'],
    ['Amount mismatch', 'Flipkart', '₹84K', '2 days'],
    ['Overcharge', 'Myntra', '₹64K', '3 days'],
    ['Late credit', 'Razorpay', '₹58K', '36 hrs'],
    ['Amount mismatch', 'Flipkart', '₹52K', '5 days'],
  ] },
  sources: ['Reconciliation engine'],
  drillLink: { label: 'Open Reconciliation →', route: '/reconciliation' },
},

{
  id: 'cashfree_pending',
  question: 'What\'s pending bank credit from Cashfree?',
  pages: ['reconciliation'],
  keywords: ['cashfree', 'pending', 'bank credit'],
  headline: '₹18.7 L pending bank credit · settlement file dated 16 May, no HDFC credit yet.',
  body: 'This is 49 hours past the standard T+1 settlement cycle. Cashfree merchant ID CF_M_92847; settlement ref CF-S-7724.',
  sources: ['Cashfree PG settlements', 'HDFC Bank'],
  drillLink: { label: 'Open Reconciliation →', route: '/reconciliation' },
},

{
  id: 'categorise_unreconciled',
  question: 'Categorise unreconciled bank txns from this week',
  pages: ['reconciliation'],
  keywords: ['categorise', 'unreconciled'],
  headline: '14 unreconciled transactions this week · 9 high-confidence auto-suggestions ready.',
  body: 'Most look like vendor payments (Zoho, Niyo Finance) and a BharatPe settlement that\'s not yet wired as a PG connector.',
  sources: ['HDFC Bank statement', 'ICICI Bank statement'],
  drillLink: { label: 'Open Bank Statements →', route: '/reconciliation' },
},

{
  id: 'flipkart_settle_correct',
  question: 'Did Flipkart settle the correct amount this week?',
  pages: ['reconciliation'],
  keywords: ['flipkart', 'settle', 'correct'],
  headline: 'Flipkart short-settled ₹11,172 across 2 batches this week.',
  body: 'Most likely cause: commission tier overcharge on apparel <₹500. Claim eligible until 26 May.',
  sources: ['Flipkart Settlement Report', 'CoWorker rate-card variance engine'],
  drillLink: { label: 'Open Reconciliation →', route: '/reconciliation' },
},

{
  id: 'overcharged_returns',
  question: 'Are there overcharged returns to dispute?',
  pages: ['reconciliation', 'returns'],
  keywords: ['overcharged', 'returns', 'dispute'],
  headline: '14 returns overcharged · ₹47,290 potentially recoverable.',
  body: 'Mostly reverse-shipping overcharges on Flipkart and Myntra. CoWorker can bulk-file disputes.',
  sources: ['Marketplace settlement files', 'Rate card audit'],
  drillLink: { label: 'Open Returns & Recovery →', route: '/returns' },
},

// Returns
{
  id: 'returns_cost',
  question: 'How much money are we losing to returns this month?',
  pages: ['returns'],
  keywords: ['losing', 'returns', 'month'],
  headline: '₹8.42 L this month — up 18.6% MoM.',
  artifact: { kind: 'bars', unit: '₹ in lakhs', data: [
    { label: 'Reverse ship', value: 2.84 }, { label: 'Lost inventory', value: 3.12 },
    { label: 'Commission', value: 1.48 }, { label: 'Ad waste', value: 0.98 }
  ] },
  sources: ['Returns engine', 'Marketplace settlements'],
  drillLink: { label: 'Open Returns & Recovery →', route: '/returns' },
},

{
  id: 'high_return_skus',
  question: 'Which SKUs are returning at the highest rate?',
  pages: ['returns'],
  keywords: ['sku', 'returning', 'rate'],
  headline: 'Hydrating Hair Mask leads at 64% on Myntra — costs ₹84K this month.',
  artifact: { kind: 'bars', unit: '% return rate', data: [
    { label: 'Hair Mask (Myntra)', value: 64, color: '#DC2626' },
    { label: 'Body Butter (Myntra)', value: 52, color: '#DC2626' },
    { label: 'Glow Serum (Flipkart)', value: 41, color: '#D97706' },
    { label: 'Cleanser (Myntra)', value: 38, color: '#D97706' },
  ] },
  sources: ['Returns engine'],
  drillLink: { label: 'Open Returns & Recovery →', route: '/returns' },
},

{
  id: 'myntra_returns_high',
  question: 'Why is Myntra return rate so high?',
  pages: ['returns'],
  keywords: ['myntra', 'return rate'],
  headline: '36% return rate — 48% of returns are size-related.',
  body: 'Holi sale skew + sizing mismatch on body-care SKUs. Listing fixes on the top 4 SKUs would cut returns by ~9 pts.',
  sources: ['Myntra return reasons API', 'CoWorker returns engine'],
  drillLink: { label: 'Open Returns & Recovery →', route: '/returns' },
},

// Marketing Efficiency
{
  id: 'real_poas',
  question: 'What\'s my real PoAS across all platforms?',
  pages: ['ads'],
  keywords: ['poas', 'platforms'],
  headline: 'Blended PoAS is 1.24x — but ROAS dashboards report 3.8x (33% attribution overlap).',
  body: 'Meta + Google + PLAs all claim overlapping conversions. True incremental is closer to 1.4x.',
  sources: ['Meta Ads', 'Google Ads', 'Amazon Ads', 'CoWorker attribution engine'],
  drillLink: { label: 'Open Marketing Efficiency →', route: '/ads' },
},

{
  id: 'campaigns_to_pause',
  question: 'Which campaigns should I pause this week?',
  pages: ['ads'],
  keywords: ['campaigns', 'pause'],
  headline: '2 campaigns are below 0.9x PoAS — pausing saves ₹5.4 L/mo.',
  artifact: { kind: 'table', columns: ['Campaign', 'Spend', 'PoAS', 'WoW'], rows: [
    ['Myntra Sale Push (Meta)', '₹4.2 L', '0.79x', '−0.18'],
    ['Retargeting cart abandoners (Meta)', '₹1.2 L', '0.88x', '−0.12'],
  ] },
  sources: ['Meta Ads', 'CoWorker margin engine'],
  drillLink: { label: 'Open Marketing Efficiency →', route: '/ads' },
},

{
  id: 'best_reallocation',
  question: 'Where should I shift ad spend for the best ROI?',
  pages: ['ads'],
  keywords: ['shift', 'ad spend', 'roi'],
  headline: 'Move ₹2.4 L from Myntra Meta to Google Brand Search and Amazon Sponsored.',
  body: 'Projected net contribution change: +₹2.1 L/month. PoAS goes from 1.24x to 1.44x.',
  sources: ['CoWorker reallocation simulator'],
  drillLink: { label: 'Open simulator →', route: '/ads' },
},

{
  id: 'google_vs_meta_cac',
  question: 'Compare Google vs Meta customer economics',
  pages: ['ads'],
  keywords: ['google', 'meta', 'customer'],
  headline: 'Google CAC is ₹441 with 5.0x LTV/CAC. Meta CAC is ₹596 with 2.9x. Google wins by a clear margin.',
  artifact: { kind: 'table', columns: ['Channel', 'CAC', 'LTV', 'LTV/CAC'], rows: [
    ['Google', '₹441', '₹2,210', '5.0x'],
    ['Meta', '₹596', '₹1,720', '2.9x'],
  ] },
  sources: ['Meta Ads', 'Google Ads', 'Order CDP'],
  drillLink: { label: 'Open Marketing Efficiency →', route: '/ads' },
},

// Cash & Runway
{
  id: 'cash_dip_threshold',
  question: 'When will my cash dip below ₹1 Cr?',
  pages: ['cash'],
  keywords: ['cash', 'dip', '1 cr'],
  headline: 'Projected to cross ₹1 Cr on 17 August 2026 (W+13) under current burn.',
  body: 'If COD failure rate normalises, the date extends by 9 days.',
  sources: ['CoWorker cash forecast engine'],
  drillLink: { label: 'Open Cash & Runway →', route: '/cash' },
},

{
  id: 'cod_adjusted_forecast',
  question: 'What\'s my COD-failure-adjusted cash forecast?',
  pages: ['cash'],
  keywords: ['cod', 'forecast'],
  headline: 'Adjusted closing balance in 13 weeks: ₹2.80 Cr (₹0.32 Cr lower than the base forecast).',
  body: 'Assumes 28% COD failure (up from 22%). The amber band on the chart represents this scenario.',
  sources: ['Shiprocket', 'Delhivery', 'CoWorker cash engine'],
  drillLink: { label: 'Open Cash & Runway →', route: '/cash' },
},

{
  id: 'idle_cash_action',
  question: 'Should I move idle cash to a liquid fund?',
  pages: ['home', 'cash'],
  keywords: ['idle cash', 'liquid'],
  headline: 'Yes — moving ₹40 L to overnight liquid fund yields +₹19,300/month at 5.8%.',
  body: 'Recommended fund options: SBI Magnum Ultra Short, ICICI Liquid. Both are T+1 redeemable.',
  sources: ['HDFC Bank balance', 'CoWorker treasury engine'],
  drillLink: { label: 'Open Cash & Runway →', route: '/cash' },
},

{
  id: 'cashflow_compare_quarter',
  question: 'Compare this quarter\'s cash flow vs last',
  pages: ['cash'],
  keywords: ['cash flow', 'quarter'],
  headline: 'Q1 operating cash flow ₹62 L vs Q4 ₹48 L — up 29%.',
  body: 'Driven by 14% revenue growth and improved working-capital efficiency (DSO down 4 days).',
  sources: ['Tally Prime', 'Cashfree PG', 'Bank statements'],
  drillLink: { label: 'Open Reports →', route: '/reports' },
},

// Reports
{
  id: 'balance_sheet_today',
  question: 'Pull the Balance Sheet as on today',
  pages: ['reports'],
  keywords: ['balance sheet', 'today'],
  headline: 'Total assets ₹9.70 Cr · Equity ₹5.38 Cr · Pending settlements receivable ₹52.4 L.',
  body: 'CoWorker includes pending settlements as receivables — most accounting tools wouldn\'t. Statement reconciles.',
  sources: ['Tally Prime', 'Cashfree PG', '5 marketplace settlement feeds'],
  drillLink: { label: 'Open Balance Sheet →', route: '/reports' },
},

{
  id: 'channel_revenue_fy',
  question: 'What was my channel-wise revenue split last FY?',
  pages: ['reports'],
  keywords: ['channel', 'revenue', 'fy'],
  headline: 'FY24-25 revenue ₹26.2 Cr · Shopify led at ₹9.8 Cr (37%).',
  artifact: { kind: 'bars', unit: '₹ in crores · FY24-25', data: [
    { label: 'Shopify', value: 9.8 }, { label: 'Amazon', value: 7.4 },
    { label: 'Flipkart', value: 5.6 }, { label: 'Myntra', value: 2.8 }, { label: 'Meesho', value: 0.6 },
  ] },
  sources: ['Tally', 'Marketplace settlements'],
  drillLink: { label: 'Open Reports →', route: '/reports' },
},

{
  id: 'gstr1_filing_pack',
  question: 'Generate GSTR-1 filing pack for May',
  pages: ['reports', 'compliance'],
  keywords: ['gstr-1', 'filing pack', 'may'],
  headline: 'GSTR-1 pack ready for all 6 states · 4 already filed, 2 pending.',
  body: 'KA and MH filed. DL due 21 May. TN, UP, WB filed. Pack includes JSON ready for GST portal upload.',
  sources: ['CoWorker GST engine', 'Marketplace outward supplies'],
  drillLink: { label: 'Open Compliance →', route: '/compliance' },
},

{
  id: 'settlement_recon_last_month',
  question: 'Show settlement reconciliation for last month',
  pages: ['reports'],
  keywords: ['settlement', 'reconciliation', 'last month'],
  headline: 'April: 99.1% auto-match · 24 exceptions · ₹3.41 L variance recovered via claims.',
  body: '₹1.94 L claims received this month. Top recovery: Flipkart commission overcharge claims.',
  sources: ['CoWorker reconciliation engine', '5 marketplaces', '2 banks', 'Cashfree PG'],
  drillLink: { label: 'Open Reports →', route: '/reports' },
},

// Compliance
{
  id: 'itc_at_risk',
  question: 'How much input tax credit is at risk?',
  pages: ['compliance'],
  keywords: ['input tax credit', 'risk'],
  headline: '₹47,000 of ITC at risk · 4 vendors haven\'t filed their GSTR-1.',
  body: 'Top exposure: A1 Packaging (₹612), Zoho Corp (₹864), GreenLeaf Containers (₹421). Notify-vendor templates ready.',
  sources: ['GSTR-2B', 'CoWorker books'],
  drillLink: { label: 'Open Compliance →', route: '/compliance' },
},

{
  id: 'msme_overdue',
  question: 'Are any MSME payments overdue?',
  pages: ['compliance'],
  keywords: ['msme', 'overdue'],
  headline: '2 MSME vendors past the 45-day rule · ₹45,000 at Section 43B disallowance risk.',
  artifact: { kind: 'table', columns: ['Vendor', 'Amount', 'Age'], rows: [
    ['A1 Packaging Solutions', '₹28,400', '51 days'],
    ['GreenLeaf Containers', '₹16,800', '47 days'],
  ] },
  sources: ['Tally Prime · MSME register'],
  drillLink: { label: 'Open MSME tab →', route: '/compliance' },
},

{
  id: 'tcs_26as_variance',
  question: 'Show me the TCS variance with Form 26AS',
  pages: ['compliance'],
  keywords: ['tcs', '26as', 'variance'],
  headline: '₹3,200 variance · Flipkart under-reported by ₹2,000 and Meesho by ₹1,000.',
  body: 'Both are eligible for grievance filing on the GST portal. CoWorker has the source data ready.',
  sources: ['Marketplace GSTR-8 reports', 'Form 26AS'],
  drillLink: { label: 'Open TCS tab →', route: '/compliance' },
},

{
  id: 'compliance_score',
  question: 'What\'s my compliance health score?',
  pages: ['compliance'],
  keywords: ['compliance', 'health score'],
  headline: '94 / 100 · 2 items pulling the score down.',
  body: 'GSTR-1 (DL) is pending and MSME-1 is overdue by 18 days. Fix both → score climbs to 99.',
  sources: ['CoWorker Compliance engine'],
  drillLink: { label: 'Open Compliance →', route: '/compliance' },
},

// Connections
{
  id: 'reauth_connections',
  question: 'Which connections need re-authentication?',
  pages: ['connections'],
  keywords: ['re-authentication', 'connections'],
  headline: 'Myntra · token expired 16 May. Re-auth restores settlement and returns sync.',
  body: 'No other connection needs re-auth. Estimated impact of the lapse: ₹62K of Myntra settlements not pulled since 16 May.',
  sources: ['CoWorker connector health'],
  drillLink: { label: 'Open Connections →', route: '/connections' },
},

{
  id: 'tally_last_sync',
  question: 'When was Tally last synced?',
  pages: ['connections'],
  keywords: ['tally', 'synced'],
  headline: 'Tally synced 47 minutes ago · 218 vouchers since the last full pull.',
  body: 'Sync runs every 15 minutes. No errors in the last 24 hours.',
  sources: ['Tally plugin · sync log'],
  drillLink: { label: 'Open Tally connection →', route: '/connections' },
},

{
  id: 'all_marketplaces_connected',
  question: 'Are all marketplaces connected?',
  pages: ['connections'],
  keywords: ['marketplaces', 'connected'],
  headline: '3 of 4 marketplaces healthy · Myntra needs re-auth.',
  artifact: { kind: 'table', columns: ['Marketplace', 'Status', 'Last sync'], rows: [
    ['Amazon India', 'Connected', '4:12 PM'],
    ['Flipkart', 'Connected', '4:08 PM'],
    ['Shopify Store', 'Connected', '4:10 PM'],
    ['Myntra', 'Action needed', '16 May, 2:12 PM'],
  ] },
  sources: ['CoWorker connector health'],
  drillLink: { label: 'Open Connections →', route: '/connections' },
},

{
  id: 'sync_errors_week',
  question: 'Show me sync errors from this week',
  pages: ['connections'],
  keywords: ['sync errors', 'week'],
  headline: '6 sync errors this week · all on Myntra (auth lapsed) and Meesho (transient API timeouts).',
  body: 'Myntra needs re-auth; Meesho timeouts cleared automatically on retry.',
  sources: ['Connector health · 7-day log'],
  drillLink: { label: 'Open Connections →', route: '/connections' },
},

{
  id: 'data_freshness',
  question: 'What\'s the data freshness across all connections?',
  pages: ['connections'],
  keywords: ['data freshness', 'connections'],
  headline: 'Healthy. Median freshness 8 minutes. Stale: only Myntra (2 days, auth lapsed).',
  sources: ['Connector health'],
  drillLink: { label: 'Open Connections →', route: '/connections' },
},
```

---

## 7. INTERACTIVITY — ACCEPTANCE CRITERIA

- **Switching pages while the chat is open**: the visible chips re-render to match the new page. Previously sent messages remain in history (don't clear on page change).
- **Clicking any chip**: submits the question (same flow as before).
- **Typing a question that matches a response on a different page**: still resolves and returns the full canned response — page filter is only on chips, not on matching.
- **Fallback (typed input doesn't match any response)**: show the existing fallback message with the **current page's 5 chips** re-embedded.
- **Each page has exactly 5 chips**: no more, no less.

---

## 8. CASHFREE DESIGN LANGUAGE

Same compliance rules. After this change, this grep within `AskCoWorkerPanel.tsx` and `askCoWorkerResponses.ts` must return zero matches:

```
font-serif | italic (except quoted user text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black
```

Chip styling unchanged from the existing implementation. The artifact renderers (`ArtifactTable`, `ArtifactBars`, `ArtifactCompare`) also stay as-is.

---

## 9. DELIVERABLE

- `src/data/askCoWorkerResponses.ts` — `CannedResponse` type gains `pages` array; library expands from 5 to 39 entries.
- `src/utils/matchCannedQuestion.ts` — drop the duplicated `CANNED` array, use `RESPONSES` from the data file as the single source of truth.
- `src/components/AskCoWorkerPanel.tsx` — accept `currentPage: Tab` prop; chip rendering filtered by `currentPage`.
- `src/App.tsx` — pass `activeTab` to `<AskCoWorkerPanel currentPage={...} />`.

`npm run dev` must build cleanly with no TypeScript errors.

---

## 10. ASSUMPTIONS — flag for override

1. **Each page has exactly 5 chips.** Alternative: variable count (3–7). I went with 5 to keep the UX predictable.
2. **A chip can appear on multiple pages** (e.g., "Why is Myntra margin down?" appears on Home, Channel Economics, Marketing Efficiency). Alternative: one chip per page only. Reuse is better for the demo because the same insight is relevant from multiple angles.
3. **Page filter is only on chips, not on matching.** A user on Connections who types a Compliance question still gets the answer. Alternative: scope matching to current page too. I went with cross-page matching because it signals "the AI knows your whole business."
4. **Chat history persists when the user navigates.** Alternative: clear history on page change. Persisting is better — the user can have a multi-page conversation.
5. **The 34 new responses use shorter bodies and lighter artifacts** than the existing 5. Alternative: full-detail artifacts for all. Kept short to make the prompt itself manageable; Cursor can deepen specific ones later.
