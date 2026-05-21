# Cursor Prompt: Redesign the Compliance page — GST + TCS + TDS + MSME + Calendar

Rebuild the `ComplianceScreen` component in `src/App.tsx` (currently around line 1059). Restructure into five focused tabs — **GST · TCS · TDS · MSME · Calendar** — plus a top-of-page health summary that aggregates across all five. The page is for the Finance Controller / CA who lives here, the Founder who lands for 30 seconds to check status, and the Auditor at year-end.

Every filter, dropdown, drawer, and button must be interactive. No decorative chrome.

---

## 1. NO RENAME NEEDED

Sidebar label, route key, and component name all stay as **"Compliance"** / `'compliance'` / `ComplianceScreen`. The sidebar's sub-items, however, change:

- Old children (per current sidebar): "GST Dashboard · TDS Filing · TCS Summary".
- New children under **Compliance**: **GST · TCS · TDS · MSME · Calendar**.

Clicking a sub-item sets a `selectedTab` state and lands on that tab inside `ComplianceScreen`.

---

## 2. PAGE STRUCTURE (top to bottom)

```
SectionHeader: "Compliance" + "Generate filing pack" primary button on right
  ↓
Top summary strip — 3 cards (Compliance health · Items needing action · Upcoming filings)
  ↓
Tab strip: GST · TCS · TDS · MSME · Calendar (clickable, stateful)
  ↓
Tab content (different per tab — never the same view with a filter)
```

Tab styling: active = `bg-purple-50 text-primary font-semibold` + 2 px `border-b-2 border-primary`; inactive = `text-gray-500 hover:text-gray-900`. Same pattern as Reconciliation tabs.

---

## 3. TOP SUMMARY STRIP — 3 cards

Three `<Card>` tiles in a 3-column grid (stacks on narrow viewports):

**Card 1 — Compliance health**
- Big number: **94 / 100** (text-[32px] font-bold text-navy-950)
- Sub-line: "2 items need attention"
- Left border 4 px in `success` (or `warning` if score < 90)
- Click → expands a small inline panel showing what's pulling the score down.

**Card 2 — Items needing action this week**
- Big number: **5**
- Sub-line: "across GST, MSME, and TDS"
- Left border in `warning`
- Click → filters all tabs to "needs action" items only.

**Card 3 — Next 7 days**
- 3 rows of upcoming filings: e.g., "GSTR-1 (DL) · 21 May · Pending", "GSTR-3B (KA) · 20 May · Pending", "PF ECR · Today · Action needed"
- A `btn-tertiary` "View calendar →" link at the bottom (deep-links to the Calendar tab).

`<SectionHeader>` right-side action: **"Generate filing pack"** primary button. Clicking opens a modal wizard that lets the user pick (a) period (drop-down: This Month / Last Month / Custom), (b) states (multi-select GSTINs), (c) forms (GSTR-1 / GSTR-3B / Form 26Q / MSME-1 / all). Then a primary "Generate" button simulates a 2.5-second multi-step process with cycling sub-text ("Pulling outward supplies…" → "Reconciling 2B…" → "Computing TCS…" → "Composing filing pack…") and ends with a downloadable artifact toast.

---

## 4. TAB 1 — GST

**Component.** A two-column layout (3+2 grid on wide screens).

### 4.1 Multi-state registrations card (left)

Title: "**GSTINs · 6 active registrations**". Inside, a list of GSTINs (Native Glow operates in 6 states):

| State | GSTIN (last 4 visible) | Status | This month |
|---|---|---|---|
| **Karnataka** (KA · HQ) | 29ABCDE...1Z1 | Active | GSTR-1 filed · GSTR-3B due 20 May |
| Maharashtra (MH) | 27ABCDE...1Z2 | Active | GSTR-1 filed · GSTR-3B filed |
| Delhi (DL) | 07ABCDE...1Z3 | Active | **GSTR-1 pending · due 21 May** |
| Tamil Nadu (TN) | 33ABCDE...1Z4 | Active | All filed |
| Uttar Pradesh (UP) | 09ABCDE...1Z5 | Active | All filed |
| West Bengal (WB) | 19ABCDE...1Z6 | Active | All filed |

Each row is clickable. Clicking expands a small inline panel below the row with: filing status for the last 6 months, total outward supplies, total ITC claimed, link to "Open in GST portal →" (placeholder, opens nothing — V1).

States with pending filings get a small `text-warning` dot before the state name. Overdue filings get a `text-error` dot.

### 4.2 ITC summary card (right)

Title: "**Input Tax Credit · this month**". A small stat block:

| Metric | Amount |
|---|---|
| Total ITC available (as per books) | ₹14.28 L |
| ITC successfully claimed (in GSTR-3B) | ₹13.81 L |
| **At-risk due to GSTR-2B mismatch** | **₹47,000** |
| ITC reversed / ineligible | ₹3,290 |

The "At-risk" row uses `text-error` font-semibold. Below the block, a `btn-secondary` "Reconcile GSTR-2B →" link that scrolls down to the GSTR-2B card.

### 4.3 GSTR-2B reconciliation table (full-width, below)

Title: "**GSTR-2B reconciliation · 12 mismatches this month**".

Filter row above the table:
- Status dropdown: All · Matched · Mismatched · Missing
- Search input: filter by vendor name / GSTIN / invoice number

Table columns: **Invoice #** · **Vendor** · **Vendor GSTIN** · **Invoice date** · **Invoice value** · **GST in 2B** · **GST in books** · **Status** · **Action**

Sample rows:

| Invoice # | Vendor | GSTIN | Date | Value | 2B | Books | Status | Action |
|---|---|---|---|---|---|---|---|---|
| INV/2026/29381 | BlueDart Logistics Ltd | 29ABCDE...0Z1 | 12 Apr | ₹14,290 | ₹2,162 | ₹2,162 | Matched | Details |
| INV/2026/29112 | A1 Packaging Solutions | 29FGHIJ...0Z2 | 08 Apr | ₹3,400 | — | ₹612 | **Vendor not filed** | Notify vendor |
| MTI/KA/88421 | Meta India Corp (Ads) | 29METAS...0Z3 | 05 Apr | ₹41,200 | ₹7,416 | ₹7,416 | Matched | Details |
| SR/299/SHP | Shiprocket Multi-channel | 33SHIPR...0Z4 | 01 Apr | ₹8,290 | ₹1,492 | ₹1,290 | **Amount mismatch** | Resolve |
| ZOH/2026/2841 | Zoho Corp | 29ZOHOZ...0Z5 | 28 Mar | ₹4,800 | — | ₹864 | **Missing in 2B** | Notify vendor |

Action button: `btn-tertiary` "Resolve" or "Notify vendor" or "Details". Clicking opens a right-side drawer with: the invoice image (placeholder), vendor contact, the specific mismatch, and a CTA "Send reconciliation request to vendor" (simulated email).

### 4.4 Per-tab primary CTA

In the top-right of the GST tab, a primary button "**Generate GSTR-1 pack for May 2026**". Click → opens the same generate-filing-pack modal pre-filtered to GSTR-1.

---

## 5. TAB 2 — TCS (Tax Collected at Source · Section 52)

**Purpose.** Marketplaces deduct 1% TCS on net supplies and report it via GSTR-8. CoWorker reconciles three sources: marketplace report, Form 26AS, CoWorker's own calculation.

### 5.1 Top stat strip — 4 KPIs

| Tile | Number | Sub |
|---|---|---|
| TCS deducted by marketplaces (this month) | **₹3.21 L** | across 5 marketplaces |
| TCS reflected in Form 26AS | **₹3.18 L** | last updated 16 May |
| **Variance** | **₹3,200** | 1 marketplace under-reporting |
| TCS credit available | **₹3.18 L** | claimable in next GSTR-3B |

### 5.2 Marketplace-by-marketplace reconciliation table

Columns: **Marketplace** · **Period** · **Marketplace reported** · **CoWorker calculated** · **Form 26AS** · **Variance** · **Status** · **Action**

| Marketplace | Period | MP reported | CoWorker | 26AS | Variance | Status | Action |
|---|---|---|---|---|---|---|---|
| Amazon India | May 2026 | ₹1,24,000 | ₹1,24,000 | ₹1,24,000 | ₹0 | Matched | Details |
| Flipkart | May 2026 | ₹98,000 | ₹98,000 | ₹96,000 | **−₹2,000** | **Variance** | Reconcile |
| Myntra | May 2026 | ₹62,000 | ₹62,000 | ₹62,000 | ₹0 | Matched | Details |
| Meesho | May 2026 | ₹21,000 | ₹21,000 | ₹20,000 | **−₹1,000** | **Variance** | Reconcile |
| Other | May 2026 | ₹16,000 | ₹16,000 | ₹16,000 | ₹0 | Matched | Details |

Click "Reconcile" → drawer showing day-by-day TCS calculation, the marketplace's GSTR-8 reference, and a suggested action ("File grievance with Flipkart for under-reporting").

### 5.3 Form 26AS comparison sub-card

A small card titled "**Form 26AS comparison — Section 52**" with a primary `btn-secondary` "Refresh Form 26AS" button. Below: side-by-side mini-table showing your books' Section 52 vs Form 26AS Section 52 for the period.

---

## 6. TAB 3 — TDS (Tax Deducted at Source)

**Purpose.** Two streams: **inbound** (marketplaces deduct TDS on us under Section 194-O — we collect certificates and claim credit) and **outbound** (we deduct TDS on payments to vendors under 194C, 194I, 194J, 194Q — we deposit and file Form 26Q).

### 6.1 Top stat strip — 4 KPIs

| Tile | Number | Sub |
|---|---|---|
| Inbound TDS (194-O) | **₹3.21 L** | marketplaces deducted from us this month |
| Certificates collected | **4 of 5** | Meesho certificate pending for April |
| Outbound TDS deposited | **₹67,400** | challan paid 7 May |
| Form 26Q status | **Filed** | Q4 FY25-26 · acknowledged 28 May |

### 6.2 Inbound TDS (Section 194-O) sub-section

Sub-card titled "**Marketplace TDS certificates · Section 194-O**". A table of each marketplace's TDS, certificate status, and ageing:

| Marketplace | Period | TDS deducted | Certificate | Received on | Status |
|---|---|---|---|---|---|
| Amazon India | Apr 2026 | ₹1,18,400 | Form 16A | 10 May | Verified |
| Flipkart | Apr 2026 | ₹94,200 | Form 16A | 12 May | Verified |
| Myntra | Apr 2026 | ₹58,200 | Form 16A | 14 May | Verified |
| Meesho | Apr 2026 | ₹19,800 | — | **Not received** | **Chase** |
| Other channels | Apr 2026 | ₹15,400 | Form 16A | 8 May | Verified |

"Chase" action → opens a drawer with email template and "Send request" button.

### 6.3 Outbound TDS (we deducted) sub-section

Sub-card titled "**TDS deducted by us · Sections 194C / 194I / 194J / 194Q**". Stat strip:

| Section | Type | Amount this month | Challan |
|---|---|---|---|
| 194C | Contractors / 3PLs (Shiprocket, Delhivery) | ₹47,000 | Paid 7 May |
| 194J | Professional fees (CA, legal) | ₹12,000 | Paid 7 May |
| 194I | Rent | ₹8,400 | Paid 7 May |
| 194Q | (Buyer-side TDS — turnover trigger not met yet) | ₹0 | — |

### 6.4 Form 26Q quarterly status

A small calendar-style card showing each quarter's Form 26Q status with file-on-date and any matched/unmatched entries.

### 6.5 Per-tab primary CTA

"**Generate Form 26Q for Q1 FY26-27**" — primary button top-right of the TDS tab.

---

## 7. TAB 4 — MSME (NEW)

**Purpose.** Section 43B(h) of the Income Tax Act 1961 (effective FY 2023-24 onwards) disallows expense deductions if MSME vendor payments are not made within 45 days. This tab tracks ageing of MSME vendor dues so the brand avoids disallowance.

### 7.1 Top stat strip — 4 KPIs

| Tile | Number | Sub | Accent |
|---|---|---|---|
| Total MSME payables | **₹4.82 L** | across 18 vendors | navy-950 |
| Aged 31–45 days | **₹81,000** | 3 vendors · pay before disallowance window | warning |
| **Aged > 45 days** | **₹45,000** | 2 vendors · Section 43B disallowance risk | error |
| MSME-1 last filed | **30 Oct 2025** | next due 30 April 2026 (overdue) | error |

### 7.2 Vendor ageing buckets — visual bars

A small horizontal stacked bar chart breaking ₹4.82 L into four ageing buckets:
- 0–15 days: ₹2.14 L (8 vendors) — green
- 16–30 days: ₹1.42 L (5 vendors) — green
- 31–45 days: ₹81,000 (3 vendors) — amber (warning)
- 45+ days: ₹45,000 (2 vendors) — red (error)

A `text-error font-semibold` callout below the bar: "**₹45,000 of expense deductions are at Section 43B disallowance risk if not paid by 31 March 2027.**"

### 7.3 MSME vendor table

Filter row: status dropdown (All / Within 30 / Approaching 45 / Overdue 45+) · search by vendor.

Columns: **Vendor** · **MSME UDYAM #** · **Invoice #** · **Invoice date** · **Amount** · **Age** · **Status** · **Action**

| Vendor | UDYAM | Invoice | Date | Amount | Age | Status | Action |
|---|---|---|---|---|---|---|---|
| A1 Packaging Solutions | UDYAM-KA-12-0012345 | A1/2026/0418 | 28 Mar | ₹28,400 | **51 days** | Overdue | **Pay now** |
| GreenLeaf Containers | UDYAM-KA-12-0098765 | GL/26-04-02 | 01 Apr | ₹16,800 | **47 days** | Overdue | **Pay now** |
| SafePack Industries | UDYAM-KA-12-0078432 | SP/02018 | 06 Apr | ₹42,800 | 42 days | Approaching | Schedule payment |
| GlossPrint Studios | UDYAM-KA-12-0024617 | GP-2026-0312 | 11 Apr | ₹24,600 | 37 days | Approaching | Schedule payment |
| WaxLine Suppliers | UDYAM-KA-12-0098123 | WL/2026/0089 | 15 Apr | ₹13,600 | 33 days | Approaching | Schedule payment |

12 more rows for the "Within 30 days" bucket.

"Pay now" → opens a payment drawer (V1: simulated; routes to a placeholder bank-pay screen). "Schedule payment" → opens a small modal to set a payment reminder for a specific date.

### 7.4 MSME-1 filing card

Below the table, a separate `<Card>` with a `bg-warning-50` accent (since it's overdue):

- Title: "**MSME-1 half-yearly return**"
- Sub-line: "Last filed 30 Oct 2025 for H2 FY24-25 · **Next due 30 April 2026 (overdue by 18 days)**"
- A primary `btn-primary` "**Generate MSME-1 for H1 FY25-26**" button. Click → simulates a 2-second generation, then opens a downloadable artifact.

### 7.5 Per-tab primary CTA

The "Generate MSME-1" CTA in the filing card serves as the primary action for this tab.

---

## 8. TAB 5 — COMPLIANCE CALENDAR (NEW)

**Purpose.** A single timeline view of every recurring compliance obligation across GST, TDS, MSME, Income Tax, ROC, and Labor. The Finance Controller's wall planner.

### 8.1 Filter row

- Category multi-select: GST · TDS · MSME · Income Tax · ROC · Labor · Other (all checked by default)
- State multi-select (for state-specific filings like GST per GSTIN, Professional Tax): All · KA · MH · DL · TN · UP · WB
- Status dropdown: All · Pending · Filed · Overdue
- Search input: filter by filing name or owner

### 8.2 Calendar view — grouped by time bucket

Four collapsible sections, each a `<Card>`:

**Today (3 items)**
- *PF ECR for May 2026* · Owner: HR · Due 18 May · Status: **Pending** · Action: File now
- *ESI contribution for May 2026* · Owner: HR · Due 18 May · Status: Pending · Action: File now
- *TDS challan deposit (last month)* · Owner: Finance · Due 18 May · Status: Filed ✓

**This week (5 items)**
- *GSTR-3B (KA)* · Owner: Finance Controller · Due 20 May · Status: **Pending** · Action: Generate
- *GSTR-1 (DL)* · Owner: Finance Controller · Due 21 May · Status: **Pending** · Action: Generate
- *Form 16A certificates (Q4 deductees)* · Owner: Finance Controller · Due 31 May · Status: Pending · Action: Generate
- *Professional Tax (MH employees)* · Owner: HR · Due 21 May · Status: Pending · Action: File
- *Professional Tax (KA employees)* · Owner: HR · Due 20 May · Status: Pending · Action: File

**This month (4 items)**
- *Advance Tax Q1 FY26-27 instalment* · Owner: Founder + CA · Due 15 June · Status: Pending · Action: Calculate
- *DPT-3 (Return of Deposits)* · Owner: CS · Due 30 June · Status: Pending · Action: Generate
- *GSTR-1 (all states, May)* · Owner: Finance Controller · Due 11 June · Status: Pending · Action: Generate
- *Form 26Q Q1 FY26-27* · Owner: Finance Controller · Due 31 July · Status: Not started · Action: Track

**Later this quarter (3 items)**
- *MSME-1 (H1 FY26-27)* · Owner: Finance Controller · Due 31 October · Status: Not started
- *Statutory audit kick-off* · Owner: Founder + Auditor · Target 1 July · Status: Not started
- *Tax audit (Section 44AB)* · Owner: Finance Controller + CA · Due 30 September · Status: Not started

### 8.3 Each calendar row

Each item renders as a row with:
- Category chip (small colored chip — GST = primary, TDS = navy, MSME = warning, Income Tax = navy, ROC = navy, Labor = success)
- Filing name (font-semibold)
- Owner (gray-500)
- Due date (right-aligned, with `text-error` if overdue, `text-warning` if due in < 3 days)
- Status pill
- Action `btn-tertiary` link

Click an item → opens a right-side drawer with: full filing description, regulatory reference (e.g., "Section 39 of CGST Act"), historical filing dates for this brand, related vendors/sources, and a CTA matching the action label.

### 8.4 Add custom reminder

A small `btn-secondary` "+ Add custom reminder" button at the bottom of the calendar. Click → opens a small modal to add a one-off compliance reminder (e.g., "Trademark renewal — due Dec 2027"). V1: stored in component state only.

---

## 9. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Top summary cards** are clickable; each drills appropriately (Health → inline expansion; Action items → filters tabs; Next 7 days → switches to Calendar tab).
- **Tab switching**: each tab renders different content.
- **Generate filing pack** modal: opens, steps through period/state/forms selection, simulates generation, ends with a toast.
- **GSTIN row click** in GST tab: expands inline panel with last-6-months filing status.
- **GSTR-2B Resolve/Notify vendor actions**: open the right-side drawer with full mismatch detail and a simulated email-send action.
- **GSTR-2B filters and search**: stateful, update visible rows.
- **TCS Reconcile action**: opens drawer with day-by-day breakdown.
- **TCS Refresh Form 26AS button**: simulates a 1.2-second processing state, shows success toast.
- **TDS Chase button** (for missing certificates): opens email-template drawer.
- **MSME Pay now / Schedule payment buttons**: simulated drawer / scheduling modal.
- **MSME-1 Generate button**: 2-second generation simulation, ends with toast.
- **Calendar filters**: category, state, status, search — all stateful.
- **Calendar item click**: opens right-side drawer with detail.
- **Calendar Add custom reminder**: opens modal, adds item to state.

---

## 10. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

Same compliance rules as previous redesigns. After this change, this grep within `ComplianceScreen` must return zero matches:

```
font-serif | italic (except quoted text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar | Sentinel | Matcher | Initialize | Execute Protocol |
"Compliance Profile" | "PROTOCOL QUALITY ASSURANCE" | "GST Ledger" | "TDS Sentinel" | "TCS Matcher"
```

Sub-tab labels in the page must be: **GST · TCS · TDS · MSME · Calendar** (sentence case, single words). The old "GST Ledger / TDS Sentinel / TCS Matcher" branding is removed entirely.

Use only shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<DeltaArrow>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`, `btn-destructive`), and the design tokens.

---

## 11. DELIVERABLE

A rewritten `ComplianceScreen` component in `src/App.tsx`. Affected pointer references:

1. The sidebar children under "Compliance" (around line ~2543-2545) — replace the three children "GST Dashboard · TDS Filing · TCS Summary" with five: **GST · TCS · TDS · MSME · Calendar**.
2. The `ComplianceScreen` body — rewrite per Sections 3–8 above.

Mock data can be inlined or extracted to `src/data/complianceMockData.ts`. `npm run dev` must build cleanly with no TypeScript errors.

---

*The page is doing one job: making sure no tax, MSME, or statutory obligation is silently missed — and turning the recurring filings into one-click pack generation against data CoWorker already has. The Finance Controller / CA lives here; the founder lands for 30 seconds. If a control doesn't serve one of those two jobs, it doesn't belong on the page.*

---

## 12. ASSUMPTIONS — flag for override

1. **MSME tracking is for vendors marked as MSME**, identified by their UDYAM registration number. Assumes the brand's accounting integration (Tally) exposes the UDYAM flag against each vendor. If not, V1 can flag vendors manually.
2. **Section 43B disallowance window** is 45 days for goods/services from an MSME registered vendor. The mock data uses this; some interpretations argue 15 days for goods without a written agreement. Real production rule needs CA validation.
3. **Calendar is V1 read-only with Add custom reminder.** Alternative: full edit/delete on every item. Kept simple for V1.
4. **Owner assignments** in the Calendar (Finance Controller, HR, CS, Founder + CA) are placeholders. In production, these come from a workspace user list with role assignment.
5. **Form 26AS refresh** is simulated. In production, this requires either user-uploaded 26AS or an integration with the income-tax portal, which doesn't have a clean public API. Realistic V1 = uploaded PDF + OCR + diff.
6. **Statutory audit and tax audit** items appear in the Calendar but the page doesn't try to be an audit workpaper tool. Workpaper management would be its own page or product.
