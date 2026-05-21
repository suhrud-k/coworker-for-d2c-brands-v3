# Cursor Prompt: Two additions — Vendor anomaly alert + Jargon-aware chat

Two related but independent additions:

1. **Vendor invoice anomaly card** at the top of the Vendors page — surfaces a vendor whose invoice amount has spiked disproportionately versus a business metric.
2. **Jargon-explainer category** in Ask CoWorker — D2C founders don't know finance/compliance jargon. The chat should answer "What is TCS?", "What does 43B mean?", "What is GSTR-2B?" with plain-English definitions.

---

## CHANGE 1 — Vendor anomaly alert card

### Where it goes

Inside `VendorsScreen` (the new section being built per `Prompt_Vendors_NewSection.md`). Position: **above** the top stat strip — the very first thing the user sees when they land on the page. Dismissible.

### Visual treatment

A horizontal `<Card>` with a `bg-warning-50` background and `border-warning-50` border. Contents:

- Left: a warning icon (`AlertTriangle` from lucide-react) at 24 px in `text-warning`.
- Middle: the anomaly description as natural-language text.
- Right: two buttons — `Investigate` (`btn-primary` mini) and `Dismiss` (`btn-tertiary` mini).

State: persist dismissal in `localStorage` (key: `vendor_anomaly_dismissed_<id>`) so the alert doesn't re-show after dismissal.

### Mock anomaly content

```tsx
<Card className="bg-warning-50 border-warning-50">
  <div className="flex items-start gap-4">
    <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
    <div className="flex-1">
      <div className="text-[14px] font-semibold text-navy-950 mb-1">
        Anomaly detected · A1 Packaging Solutions
      </div>
      <div className="text-[13px] text-gray-700 leading-relaxed">
        A1 Packaging invoiced <span className="font-bold">₹84,000</span> in May — a <span className="font-bold text-warning">3.0× jump</span> vs the ₹28,000 average over the prior 3 months.
        Your order volume is up only <span className="font-bold">+12%</span>, so cost-per-order has effectively risen from ₹140 to ₹420.
        Possible causes: rate revision, undisclosed surcharge, duplicate invoicing, or shift to a costlier material.
      </div>
    </div>
    <div className="flex gap-2 shrink-0">
      <button onClick={() => /* open vendor drawer */} className="btn-primary h-8 px-4 text-[13px]">
        Investigate
      </button>
      <button onClick={() => /* dismiss + localStorage */} className="btn-tertiary text-[13px]">
        Dismiss
      </button>
    </div>
  </div>
</Card>
```

### Behaviour

- **Investigate** opens the **A1 Packaging Solutions vendor profile drawer** (the same drawer pattern used elsewhere on the Vendors page) with the 3-month invoice history visible. Pre-scrolls to a small chart showing the spike.
- **Dismiss** writes to `localStorage` and removes the card. Subsequent page loads don't show it again. A small "View dismissed alerts →" link appears at the top of the page after dismissal so the user can re-open.

### Detection logic (for production, not V1 demo)

The card is hard-coded for V1 — but flag the underlying detection rule for engineering:

> *Production rule: for any vendor, if (current month invoice amount) ÷ (3-month rolling average) > 2.0× **and** the corresponding business metric (orders, GMV, revenue) growth is < 30%, surface as an anomaly. Recompute daily.*

This becomes one of many anomaly types CoWorker can surface — others include duplicate-invoicing patterns, vendor concentration risk, payment-date drift, GSTIN inactive while invoicing.

### Acceptance criteria

- Card appears at the top of Vendors page on load if not dismissed.
- "Investigate" button opens the vendor profile drawer for A1 Packaging.
- "Dismiss" button removes the card and persists state in `localStorage`.
- Page layout below remains the same (top stat strip, tab strip, tab content).

---

## CHANGE 2 — Jargon-explainer category in Ask CoWorker

D2C founders typically don't know finance/compliance jargon. When a user types "what is TCS?" or "explain 43B" or "what does ITC mean?", the chat should respond with a plain-English explanation, not a data answer.

### Implementation

Add a new response type and a new set of ~25 jargon entries to `src/data/askCoWorkerResponses.ts`. These are **definition-only responses** — they have a headline + body but no artifact, no drillLink, and minimal sources (just "Finance glossary" or the regulatory reference).

Extend the `CannedResponse` type with an optional `kind` field:

```ts
export type CannedResponse = {
  id: string;
  question: string;
  pages: Tab[];                  // existing
  keywords: string[];            // existing
  kind?: 'data' | 'jargon';      // new — defaults to 'data'
  headline: string;
  body: string;
  artifact?: ...;                // existing
  sources: string[];
  drillLink?: ...;
};
```

When `kind === 'jargon'`, the response renderer skips artifact + sources rendering (or uses a simpler styling — just headline + body in a slate card with a small "📘 Glossary" badge).

### Jargon library — 25 entries

Each entry has the term as the canonical question, plus keyword variants. The chat should match phrasings like "what is X", "explain X", "what does X mean", "what's X" against the same entry.

Pages: **all** — jargon questions are relevant from anywhere in the app. So `pages: ['home', 'pnl', 'reconciliation', 'vendors', 'returns', 'ads', 'cash', 'reports', 'compliance', 'connections']` for every jargon entry. They don't appear as suggestion chips on any page (chips remain reserved for the top 5 data questions per page) — but typed queries resolve.

```ts
const JARGON_RESPONSES = [
  {
    id: 'jargon_tcs',
    question: 'What is TCS?',
    pages: [/* all pages */],
    keywords: ['tcs'],
    kind: 'jargon',
    headline: 'TCS = Tax Collected at Source.',
    body: 'Under Section 52 of the GST Act, every e-commerce operator (Amazon, Flipkart, etc.) collects 1% of your "net taxable supplies" — that is, your gross sales on their platform minus returns — and deposits it with the government on your behalf. You can claim this back as a credit in your GSTR-3B. The TCS deducted by each marketplace shows up in your Form 26AS, and CoWorker reconciles that against what the marketplace reported.',
    sources: ['Section 52, CGST Act 2017'],
  },
  {
    id: 'jargon_tds',
    question: 'What is TDS?',
    keywords: ['tds'],
    kind: 'jargon',
    headline: 'TDS = Tax Deducted at Source.',
    body: 'Tax that one party deducts before paying another, and deposits with the government. For a D2C brand: marketplaces deduct 1% TDS on your gross sales under Section 194-O (inbound TDS — money taken from you). You also deduct TDS when you pay vendors — Section 194C for contractors, 194I for rent, 194J for professionals, 194Q for goods purchases over ₹10 cr turnover (outbound TDS — money you take from others). You file Form 26Q quarterly listing all outbound TDS, and issue Form 16A certificates to vendors.',
    sources: ['Sections 194-O, 194C, 194I, 194J, 194Q, Income Tax Act 1961'],
  },
  {
    id: 'jargon_gstr1',
    question: 'What is GSTR-1?',
    keywords: ['gstr-1', 'gstr1'],
    kind: 'jargon',
    headline: 'GSTR-1 = your monthly outward supplies return.',
    body: 'A monthly GST filing where you list every sale you made — to customers (B2C), to other businesses (B2B), with HSN summary and credit/debit notes. Due 11th of the following month. Your buyers see your GSTR-1 reflected in their GSTR-2B and use it to claim input tax credit, so filing late or wrong hurts your buyer relationships as much as your own compliance score.',
    sources: ['CGST Act 2017'],
  },
  {
    id: 'jargon_gstr2b',
    question: 'What is GSTR-2B?',
    keywords: ['gstr-2b', 'gstr2b', '2b'],
    kind: 'jargon',
    headline: 'GSTR-2B = your auto-generated input tax credit statement.',
    body: 'The GST portal generates GSTR-2B for every registered taxpayer around the 14th of each month. It shows you all the input tax credit you\'re eligible for, based on what your vendors have filed in their GSTR-1. If your vendor hasn\'t filed yet, the invoice doesn\'t appear in your GSTR-2B — and you can\'t claim the GST you paid on it. CoWorker reconciles your purchase ledger against GSTR-2B and flags mismatches.',
    sources: ['CGST Act 2017'],
  },
  {
    id: 'jargon_gstr3b',
    question: 'What is GSTR-3B?',
    keywords: ['gstr-3b', 'gstr3b'],
    kind: 'jargon',
    headline: 'GSTR-3B = your monthly GST summary return.',
    body: 'A summary of your outward supplies, input tax credit claimed, and net GST payable. Due 20th of the following month. Unlike GSTR-1 (invoice-level), GSTR-3B is aggregated. It\'s where the actual GST payment is computed and paid.',
    sources: ['CGST Act 2017'],
  },
  {
    id: 'jargon_gstr9',
    question: 'What is GSTR-9?',
    keywords: ['gstr-9', 'gstr9'],
    kind: 'jargon',
    headline: 'GSTR-9 = your annual GST return.',
    body: 'A consolidated annual return summarising all monthly GSTR-1 and GSTR-3B filings for the financial year. Due 31 December of the following financial year. Mandatory if your turnover exceeds ₹2 cr.',
    sources: ['CGST Act 2017'],
  },
  {
    id: 'jargon_itc',
    question: 'What is ITC?',
    keywords: ['itc', 'input tax credit'],
    kind: 'jargon',
    headline: 'ITC = Input Tax Credit.',
    body: 'The GST you paid to vendors on your purchases that you can claim back against the GST you collected on sales. Example: you sold ₹10 L of goods and collected ₹1.8 L GST. You bought raw materials worth ₹4 L and paid ₹72 K GST. Net GST you owe the government is ₹1.8 L − ₹72 K = ₹1.08 L. The ₹72 K is your ITC. ITC at risk = vendor invoices in your books that haven\'t been filed by the vendor in their GSTR-1, so you can\'t claim them yet.',
    sources: ['Section 16, CGST Act 2017'],
  },
  {
    id: 'jargon_43b',
    question: 'What is Section 43B?',
    keywords: ['43b', 'section 43b'],
    kind: 'jargon',
    headline: 'Section 43B(h) = the MSME 45-day rule.',
    body: 'Under Section 43B(h) of the Income Tax Act (effective FY 2023-24 onwards), if you owe money to an MSME-registered vendor and don\'t pay within 45 days, that expense cannot be claimed as a tax deduction in the current financial year. You can only claim it in the year you actually pay. Example: ₹45 K of overdue MSME payables means ₹45 K of expense gets disallowed; at a 25% tax rate, that\'s ₹11,250 of extra tax. If you pay before 31 March, the deduction is restored.',
    sources: ['Section 43B(h), Income Tax Act 1961'],
  },
  {
    id: 'jargon_194o',
    question: 'What is Section 194-O?',
    keywords: ['194-o', '194o', 'section 194-o'],
    kind: 'jargon',
    headline: 'Section 194-O = e-commerce operator TDS.',
    body: 'Requires e-commerce operators (Amazon, Flipkart, Myntra, etc.) to deduct 1% TDS on the gross amount of your sales through their platform. The marketplace deposits this TDS, issues a Form 16A certificate to you, and you claim the credit when filing your income tax return.',
    sources: ['Section 194-O, Income Tax Act 1961'],
  },
  {
    id: 'jargon_msme',
    question: 'What is MSME?',
    keywords: ['msme'],
    kind: 'jargon',
    headline: 'MSME = Micro, Small, Medium Enterprise.',
    body: 'A government classification for businesses below certain turnover and investment thresholds. Micro: turnover ≤ ₹5 cr; Small: ≤ ₹50 cr; Medium: ≤ ₹250 cr. Registered MSMEs have a UDYAM registration number. The classification triggers protections like the Section 43B 45-day payment rule, mandatory MSME-1 half-yearly filing by buyers, and access to certain government schemes. Your packaging supplier or local 3PL is often an MSME — that\'s why it matters for your AP ageing.',
    sources: ['MSMED Act 2006'],
  },
  {
    id: 'jargon_udyam',
    question: 'What is UDYAM?',
    keywords: ['udyam'],
    kind: 'jargon',
    headline: 'UDYAM = the MSME registration number.',
    body: 'Format: UDYAM-XX-XX-XXXXXXX. Every MSME-registered business has one. You should capture this for every vendor you classify as MSME, because that\'s what triggers the Section 43B rule and MSME-1 filing requirements.',
    sources: ['UDYAM Portal, Government of India'],
  },
  {
    id: 'jargon_form26as',
    question: 'What is Form 26AS?',
    keywords: ['26as', 'form 26as'],
    kind: 'jargon',
    headline: 'Form 26AS = your annual tax statement.',
    body: 'A consolidated statement maintained by the Income Tax Department against your PAN. It shows all TDS deducted from you, all TCS collected from you, advance tax + self-assessment tax you\'ve paid, and high-value transactions. Available on the TRACES portal. CoWorker reconciles marketplace-reported TCS against Form 26AS — if they don\'t match, you can\'t claim the full credit.',
    sources: ['Income Tax Department, India'],
  },
  {
    id: 'jargon_form16a',
    question: 'What is Form 16A?',
    keywords: ['16a', 'form 16a'],
    kind: 'jargon',
    headline: 'Form 16A = TDS certificate.',
    body: 'Issued by the deductor (the person/company that deducted TDS) to the deductee. For a D2C brand: marketplaces issue Form 16A to you for TDS deducted under Section 194-O. You issue Form 16A to your vendors for TDS deducted under 194C, 194I, 194J. You need these certificates to claim TDS credit in income tax returns.',
    sources: ['Income Tax Act 1961'],
  },
  {
    id: 'jargon_hsn',
    question: 'What is HSN code?',
    keywords: ['hsn', 'hsn code'],
    kind: 'jargon',
    headline: 'HSN = Harmonised System of Nomenclature.',
    body: 'A globally standardised product classification code. Every SKU must have an HSN code, which determines its GST rate (5%, 12%, 18%, 28%). Wrong HSN means wrong GST rate, which creates filing errors and tax demands later.',
    sources: ['WCO HSN, GST portal'],
  },
  {
    id: 'jargon_poas',
    question: 'What is PoAS?',
    keywords: ['poas'],
    kind: 'jargon',
    headline: 'PoAS = Profit on Ad Spend.',
    body: 'A truer measure than ROAS. ROAS = Gross Revenue ÷ Ad Spend (ignores returns, COGS, marketplace charges). PoAS = Net Margin Contribution ÷ Ad Spend (after subtracting all of those). A campaign with ROAS 3× often has PoAS < 1× because most of that "revenue" gets eaten by costs. CoWorker computes PoAS as the default ad-performance metric.',
    sources: ['CoWorker definitions'],
  },
  {
    id: 'jargon_roas',
    question: 'What is ROAS?',
    keywords: ['roas'],
    kind: 'jargon',
    headline: 'ROAS = Return on Ad Spend.',
    body: 'Gross revenue attributed to ads, divided by ad spend. A 3× ROAS means every ₹1 spent generated ₹3 of revenue. The catch: ROAS ignores COGS, returns, marketplace charges, and the ad spend itself. So a 3× ROAS often hides a 0.9× actual profit on ad spend (PoAS). Most ad platforms report ROAS by default.',
    sources: ['Industry standard'],
  },
  {
    id: 'jargon_mer',
    question: 'What is MER?',
    keywords: ['mer'],
    kind: 'jargon',
    headline: 'MER = Marketing Efficiency Ratio.',
    body: 'Total Revenue ÷ Total Marketing Spend. A brand-level health check that avoids attribution headaches entirely — it doesn\'t care which platform claimed the conversion, just whether marketing as a whole is worth it. Target > 4× for a healthy D2C brand; <2.5× is bleeding.',
    sources: ['CoWorker definitions'],
  },
  {
    id: 'jargon_cac',
    question: 'What is CAC?',
    keywords: ['cac'],
    kind: 'jargon',
    headline: 'CAC = Customer Acquisition Cost.',
    body: 'Ad spend ÷ Number of new customers acquired in the same period. Tells you how much you paid to get each new customer. Compare against LTV (lifetime value) — if LTV/CAC < 3×, the unit economics are weak.',
    sources: ['Industry standard'],
  },
  {
    id: 'jargon_ltv',
    question: 'What is LTV?',
    keywords: ['ltv', 'lifetime value'],
    kind: 'jargon',
    headline: 'LTV = Lifetime Value.',
    body: 'The total revenue (or net margin contribution) a customer brings over their lifetime with the brand. A 90-day LTV is the most commonly used metric for D2C — it measures repeat purchase behaviour within 90 days of acquisition.',
    sources: ['Industry standard'],
  },
  {
    id: 'jargon_fba',
    question: 'What is FBA?',
    keywords: ['fba'],
    kind: 'jargon',
    headline: 'FBA = Fulfilled by Amazon.',
    body: 'You ship inventory in bulk to Amazon\'s warehouses; Amazon stores it, packs orders, ships to customers, handles returns, in exchange for storage + per-order fees. Important tax implication: stock sitting in an Amazon warehouse in another state means you legally have a place of business there — which triggers GST registration in that state. FBA + Flipkart Smart + Myntra Fulfilment often = 4-6 GSTINs.',
    sources: ['Amazon Seller Services'],
  },
  {
    id: 'jargon_cogs',
    question: 'What is COGS?',
    keywords: ['cogs'],
    kind: 'jargon',
    headline: 'COGS = Cost of Goods Sold.',
    body: 'The direct cost of producing the goods you sold — raw materials, packaging, contract manufacturing, inbound logistics. Excludes selling and marketing costs, marketplace charges, and overheads. COGS ÷ Revenue gives you your gross margin. For Native Glow, COGS is typically 35-45% of revenue.',
    sources: ['Accounting standard'],
  },
  {
    id: 'jargon_three_way_match',
    question: 'What is three-way match?',
    keywords: ['three-way match', '3-way match', 'three way match'],
    kind: 'jargon',
    headline: 'Three-way match = matching the PO, the invoice, and the receipt.',
    body: 'Before paying a vendor, you verify three documents agree: the Purchase Order (PO — what you ordered), the Vendor Invoice (what they\'re billing you for), and the Goods Receipt Note (what actually arrived). If all three match in quantity, rate, and total, the payment is safe to approve. Discrepancies signal pricing errors, short shipments, or duplicate billing.',
    sources: ['Accounting standard'],
  },
  {
    id: 'jargon_pf_ecr',
    question: 'What is PF ECR?',
    keywords: ['pf ecr', 'ecr'],
    kind: 'jargon',
    headline: 'PF ECR = Electronic Challan-cum-Return for Provident Fund.',
    body: 'A monthly filing every employer with 20+ employees must do. You calculate PF contributions (12% employee + 12% employer of basic salary), generate an ECR file listing every employee, pay the total via challan to EPFO, and upload the ECR on the EPFO portal. Due 15th of the following month. Missing it triggers penalties + interest.',
    sources: ['Employees\' Provident Funds Act 1952'],
  },
  {
    id: 'jargon_esi',
    question: 'What is ESI?',
    keywords: ['esi'],
    kind: 'jargon',
    headline: 'ESI = Employees\' State Insurance.',
    body: 'A statutory medical insurance + benefits scheme. Applicable if you have 10+ employees earning less than ₹21,000/month. Contribution: 3.25% employer + 0.75% employee on gross salary. Monthly contribution due by 15th of the following month.',
    sources: ['Employees\' State Insurance Act 1948'],
  },
  {
    id: 'jargon_decision_brief',
    question: 'What is the Founder Decision Brief?',
    keywords: ['founder decision brief', 'decision brief'],
    kind: 'jargon',
    headline: 'A CoWorker-specific term.',
    body: 'A locked-template weekly artifact CoWorker generates every Monday at 8 AM. It contains: the week\'s headline performance summary, channel-wise margin scorecard, top 3 recommended actions with reasons, and key risks. Designed to replace 20+ hours of finance prep before a founder\'s Monday review.',
    sources: ['CoWorker product'],
  },
];
```

### Renderer treatment for `kind: 'jargon'`

In `AskCoWorkerPanel.tsx`, when rendering an assistant message where `kind === 'jargon'`:

- Skip the artifact rendering (no table / bars / compare).
- Skip the source chips strip; instead, render the single source inline as a `text-[12px] text-gray-500` line.
- Add a small "📘 Glossary" badge to the top-right of the message bubble (`bg-purple-50 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full`).
- Optionally, at the bottom of the response, suggest: *"Want to see how this affects your business? Try asking a data question."* with a `btn-tertiary` "See examples →" link that re-displays the current page's 5 data chips.

### Match logic update

The existing `matchCannedQuestion.ts` already does exact + fuzzy keyword matching. Jargon questions slot in naturally — keywords like `['tcs']` or `['43b']` are short and will fuzzy-match against any phrasing.

Edge case: a user typing "Show me TCS reconciliation" should match the **data** question (`tcs_26as_variance`), not the jargon entry. To prevent this, give the data entry's keywords precedence by including more specific terms (`keywords: ['tcs', 'variance']` for the data entry vs `keywords: ['tcs']` for the jargon entry). The matcher already requires ALL keywords to be present — so "tcs reconciliation" matches the data entry (both `tcs` and `variance` present after normalisation including synonyms), and "what is tcs" matches the jargon entry (only `tcs` present).

If the synonym handling is brittle, add a final tie-breaker: if a query starts with **"what is"**, **"what's"**, **"explain"**, **"define"**, or **"meaning of"**, prefer the jargon entry over the data entry.

### Acceptance criteria

- Typing "what is TCS?" returns the jargon definition (not the TCS variance data view).
- Typing "what is 43B?" returns the Section 43B jargon entry.
- Typing "show me TCS variance" returns the data entry (existing behaviour preserved).
- All 25 jargon entries are reachable by their canonical phrasings.
- Jargon responses render with the "📘 Glossary" badge and no artifact/source-chip clutter.
- Jargon questions do not appear as suggestion chips on any page.

---

## CASHFREE DESIGN LANGUAGE — no regression

Both changes use shared primitives and existing tokens only. No `font-serif`, no `italic` (except quoted text), no `tracking-[0.3em]`, no `rounded-[40px]`, no raw `indigo-*` / `slate-*`. The Glossary badge uses `bg-purple-50 text-primary`.

---

## DELIVERABLE

- `src/App.tsx` (or `src/components/VendorsScreen.tsx` if extracted): add the vendor anomaly card above the top stat strip in the Vendors screen.
- `src/data/askCoWorkerResponses.ts`: add 25 new jargon entries with `kind: 'jargon'`. Extend the `CannedResponse` type with the optional `kind` field.
- `src/components/AskCoWorkerPanel.tsx`: handle the jargon rendering path (skip artifacts, simplified source line, Glossary badge).
- `src/utils/matchCannedQuestion.ts`: if needed, add the "what is / explain / define" tie-breaker.

`npm run dev` must build cleanly.
