# Cursor Prompt: Add "Vendors" as a new top-level section (with Cashfree Payouts batch payment)

Add a new top-level page **Vendors** to CoWorker for D2C Brands. It becomes the single source of truth for the vendor side: invoices, payment scheduling, ageing, and the vendor master directory. Cashfree Payouts is the hero payment rail.

This is a **new section**, not a redesign. The OG `coworker-prototype.html` had a strong Accounts Payable section that the structure here is modelled on, recategorised for D2C and extended with three D2C-specific fields (MSME UDYAM number, vendor GSTIN, bank account for batch payment).

---

## 1. NEW ROUTING + SIDEBAR

Add a new `Tab` value: `'vendors'`. Update everywhere the `Tab` union is referenced.

```ts
type Tab = 'home' | 'pnl' | 'reconciliation' | 'vendors' | 'returns' | 'ads' | 'cash' | 'reports' | 'compliance' | 'connections';
```

Sidebar position: between **Reconciliation** and **Returns & Recovery**. Add as a `<SidebarItem>` (not under any parent — top level). Icon: `Users` from lucide-react (already imported or add it). Label: **"Vendors"**.

Route handler: `case 'vendors': return <VendorsScreen />;` in `renderContent()`.

Chat route map (for drill links from `AskCoWorkerPanel`): `'/vendors': 'vendors'`.

Component name: `VendorsScreen`.

---

## 2. PAGE STRUCTURE (top to bottom)

```
SectionHeader: "Vendors" + sub + [+ Add Vendor] [+ New Invoice] [Pay batch via Cashfree Payouts] actions
  ↓
Top stat strip — 4 KPIs
  ↓
Tab strip: Invoices · Payment Schedule · Aging · Vendor Master
  ↓
[Tab-specific content]
```

`<SectionHeader title="Vendors" subtitle="Invoices, payments, and the vendor master — closed-loop via Cashfree Payouts">` with three right-side actions:
- **+ Add Vendor** (`btn-secondary`)
- **+ New Invoice** (`btn-secondary`)
- **Pay batch via Cashfree Payouts** (`btn-primary`, with a `Zap` lucide icon)

---

## 3. TOP STAT STRIP — 4 KPIs

Four `<Card>` tiles in a 4-column grid:

| Tile | Big number | Sub | Accent |
|---|---|---|---|
| Total payables | **₹16.84 L** | across 24 open invoices · 18 vendors | navy-950 |
| Due this week | **₹4.28 L** | 6 invoices · 2 need approval | warning |
| Overdue | **₹2.92 L** | 4 invoices · including 2 MSME @ Section 43B risk | error |
| MSME at risk | **₹45,000** | 2 vendors past 45 days | error |

The "MSME at risk" tile is clickable and deep-links to **Compliance > MSME** tab.

---

## 4. TAB 1 — INVOICES (the workhorse)

### 4.1 Filter row

- **Status** dropdown: All · Overdue · Pending L1 · Pending L2 · Approved · Paid · Under review
- **Category** dropdown: All categories · Raw materials · Packaging · Contract manufacturing · 3PL & logistics · SaaS · Marketing services · Legal & professional · Facility & admin · Ad platform spend · Other
- **MSME-only** checkbox
- **Date range** preset: This month / Last month / This quarter / Custom
- **Search** input: filters by vendor name / invoice number / PO

All filters stateful.

### 4.2 Invoice table

Columns: **Vendor** (chip + MSME badge if applicable) · **Invoice #** · **Invoice date** · **Due date** · **Amount** · **Category** · **3-way match** (icon: green check / amber warning / red cross) · **TDS** (small text, section + amount) · **Status** (pill) · **Actions**

Status pill colors:
- OVERDUE → `bg-error-50 text-error`
- Pending L1 / L2 → `bg-warning-50 text-warning`
- Approved → `bg-purple-50 text-primary`
- Paid → `bg-success-50 text-success`
- Under review → `bg-gray-100 text-gray-600`

Actions per row depending on status:
- OVERDUE or Pending → **[Approve]** (`btn-primary` mini) + **[View]** (`btn-tertiary`)
- Approved → **[Pay now]** (`btn-primary` mini) + **[View]**
- Paid → **[View]** only
- Under review → **[Resolve]** + **[View]**

Row click (anywhere except the action buttons) opens a right-side drawer with full invoice detail (line items, attached PDF placeholder, three-way match trail PO → Invoice → Receipt, related vendor profile link, payment history).

### 4.3 Sample data — 14 invoices

| # | Vendor | MSME? | Invoice # | Invoice date | Due | Amount | Category | Match | TDS | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Frostessence Organics | No | INV-FE-2026-0341 | 14 Apr | 14 May | ₹2,42,000 | Raw materials | ✓ | 194C ₹2,420 | **OVERDUE** |
| 2 | A1 Packaging Solutions | **MSME** | INV-A1-2026-0418 | 28 Mar | 12 May | ₹28,400 | Packaging | ✓ | 194C ₹284 | **OVERDUE** |
| 3 | ColorMax Ingredients | No | CM-2026-0408 | 02 Apr | 02 May | ₹1,18,600 | Raw materials | ⚠ (₹500 mismatch) | 194C ₹1,186 | Under review |
| 4 | GreenLeaf Containers | **MSME** | GL/26-04-02 | 01 Apr | 01 May | ₹16,800 | Packaging | ✓ | — | **OVERDUE** |
| 5 | ProForma Manufacturing | No | PFM-MAR-489 | 20 Mar | 30 Apr | ₹3,84,000 | Contract manufacturing | ✓ | 194C ₹3,840 | Paid (28 Apr) |
| 6 | Shiprocket Multi-channel | No | SR-2026-04-892 | 30 Apr | 10 May | ₹84,200 | 3PL & logistics | ✓ | 194C ₹842 | Pending L1 |
| 7 | Delhivery Pvt Ltd | No | DEL-APR-26-12847 | 30 Apr | 10 May | ₹62,800 | 3PL & logistics | ✓ | 194C ₹628 | Approved |
| 8 | Shopify Inc | No (foreign) | SHP-USA-04-2026 | 01 Apr | 16 May | ₹38,400 | SaaS subscriptions | ✓ | — | Approved |
| 9 | Klaviyo Inc | No (foreign) | KLV-2026-0401 | 01 Apr | 16 May | ₹24,800 | SaaS subscriptions | ✓ | — | Approved |
| 10 | Zoho Corp | No | ZOH/2026/2841 | 28 Mar | 28 Apr | ₹4,800 | SaaS subscriptions | ✓ | — | Paid (26 Apr) |
| 11 | IndusLaw Partners | No | IL-2026-0289 | 15 Apr | 30 Apr | ₹2,20,000 | Legal & professional | ✓ | 194J ₹22,000 | Pending L1 |
| 12 | Meta India | No | MTI/KA/88421 | 05 Apr | 20 Apr | ₹41,200 | Ad platform spend | ✓ | — | Paid (18 Apr) |
| 13 | Regus Bangalore | No | REG-BLR-0403 | 01 Apr | 05 May | ₹1,24,000 | Facility & admin | ✓ | 194I ₹12,400 | Approved |
| 14 | KPMG Tax Advisory | No | KPMG-Q4-2026 | 20 Mar | 20 Apr | ₹4,50,000 | Legal & professional | ✓ | 194J ₹45,000 | **Pending L2** |

The OVERDUE rows get a thin `border-l-2 border-error` left border on the row for the eye-pull.

The MSME-flagged vendor rows show a small `MSME` chip (`bg-warning-50 text-warning`) next to the vendor name.

---

## 5. TAB 2 — PAYMENT SCHEDULE (Cashfree Payouts hero)

Three sections stacked: Ready to Pay → Pending Approval → Recent Payments.

### 5.1 Ready to Pay card

Title: **"Ready to Pay"** (with success-color dot).

A list of all "Approved" status invoices. Each row:
- Multi-select checkbox (pre-checked for the top 5 by due-date)
- Vendor name + invoice number
- Sub-line: "Due {date} · via Cashfree Payouts · 3-way match ✓"
- Amount on the right
- Inline **[Pay now]** `btn-primary` mini button

Below the list, two buttons:
- **[Pay batch via Cashfree Payouts]** (primary, with `Zap` icon) — disabled if 0 selected; live count shown ("Pay 5 invoices · ₹6.32 L")
- **[Schedule for later]** (`btn-secondary`) — opens a small modal to set a future date

### 5.2 Pending Approval card

Title: **"Pending Approval"** (warning dot).

L1 and L2 pending invoices listed. Each row shows: vendor, amount, due date, status ("Pending L1 approval · waiting for Aarav (founder)" / "Pending L2 approval · waiting for Finance Lead"). Inline **[Approve]** action where applicable.

### 5.3 Recent Payments card

Title: **"Recent Payments — last 7 days"** (gray dot).

Last 5-8 paid invoices with date, vendor, amount, payment rail used (e.g., "Cashfree Payouts NEFT · UTR ending 12847"). Click any row → opens drawer with full payment detail.

### 5.4 Cashfree Payouts batch modal — the hero flow

When "Pay batch via Cashfree Payouts" is clicked, open a centred modal (600 px wide):

**Header:** "Pay 5 vendors · ₹6,32,400 total" + close button.

**Body:**
- **Selected invoices list** (compact 5-row table: vendor · invoice # · amount · TDS to deduct · net payable)
- **Source account** dropdown: HDFC Bank ··2847 (default) · ICICI Bank ··5621
- **Payment mode** radio cards:
  - NEFT (free for HDFC; settles T+1) — default
  - IMPS (₹5 per txn via Cashfree Payouts; instant)
  - RTGS (free for > ₹2 L; settles within 30 mins)
  - UPI (for vendors with UPI ID linked; instant, free)
- **Cost summary:**
  - Total invoice value: ₹6,52,800
  - Less TDS auto-deducted: −₹6,528 (194C/J/I across these invoices · CoWorker calculated)
  - Cashfree Payouts fee: ₹25 (5 NEFT × ₹5)
  - **Net debit from source: ₹6,46,297**
- **Compliance checkboxes (both pre-checked):**
  - ☑ Deduct TDS automatically — challan will be generated at month-end
  - ☑ Email GST-compliant payment voucher to each vendor
- **Footer:**
  - `btn-secondary` "Cancel"
  - `btn-primary` "**Authorize batch payment**"

**On Authorize click:**

Simulate a 2-second processing state with cycling sub-text inside the modal:
- "Authorising with Cashfree Payouts…"
- "Validating vendor bank accounts (5 of 5)…"
- "Triggering NEFT for 5 vendors…"
- "Settling…"

Then close the modal and show a `<Card>`-style toast (top-right, persists 6 s):

> ✓ **Batch payment initiated**
> 5 vendors · ₹6,46,297 net debit · Cashfree Payouts batch ID **CFP-BTH-92847**
> Expected settlement: T+1 (16 May, end of day)
> [View in Reconciliation →]

Behind the scenes, the corresponding invoices in Tab 1 flip from "Approved" to "Payment initiated" status. The Reconciliation page would in production then match the bank debit when it appears.

---

## 6. TAB 3 — AGING

### 6.1 Aging buckets bar chart

Five-bucket stacked horizontal bar:

| Bucket | Amount | % | Color |
|---|---|---|---|
| 0–15 days | ₹4.82 L | 29% | success |
| 16–30 days | ₹3.14 L | 19% | success |
| 31–45 days (MSME warning) | ₹81,000 | 5% | warning |
| 45+ days (MSME 43B risk) | ₹45,000 | 3% | error |
| Pending approval / Under review | ₹7.62 L | 45% | gray |

Below the bar, a single sentence callout in `text-error`: **"₹45,000 of expense deductions at Section 43B disallowance risk if not paid by 31 March 2027."** Click → deep-links to Compliance > MSME tab.

### 6.2 Top 10 oldest open invoices table

Columns: Rank · Vendor · MSME? · Invoice # · Invoice date · Age (days) · Amount · Action

The OVERDUE MSME vendors appear at the top. Each row has an inline **[Pay now]** action if approved, **[Escalate]** if pending L1/L2.

### 6.3 By-category ageing breakdown

A small horizontal stacked bar per category showing ageing distribution within that category. Helps spot "Raw materials supplier payments are getting consistently delayed by 30+ days" patterns.

---

## 7. TAB 4 — VENDOR MASTER (the directory)

The single source of truth on every vendor. This is what the rest of the app reads from.

### 7.1 Filter row

- Category dropdown
- MSME status dropdown: All · MSME · Non-MSME · Foreign
- GSTIN status dropdown: All · Active · Inactive (vendor's GSTIN lapsed) · Not applicable
- Status dropdown: Active · On hold · Inactive
- Search input

### 7.2 Vendor table

Columns: Vendor · Category · MSME (chip if yes, with UDYAM number on hover) · GSTIN (last 4 · status dot) · Bank account (last 4 + IFSC · masked) · YTD spend · Open invoices · Avg DTP (days-to-pay) · Status · Actions

Sample data — 18 vendors total:

| Vendor | Category | MSME | GSTIN | Bank | YTD Spend | Open inv | Avg DTP | Status |
|---|---|---|---|---|---|---|---|---|
| Frostessence Organics | Raw materials | — | 29FROST...0Z9 (active) | HDFC ··3924 | ₹38.4 L | 2 | 42 d | Active |
| A1 Packaging Solutions | Packaging | UDYAM-KA-12-0012345 | 29A1PAC...0Z1 (active) | SBI ··1847 | ₹4.82 L | 1 | 38 d | Active |
| ColorMax Ingredients | Raw materials | — | 27COLOR...0Z2 (active) | ICICI ··2934 | ₹14.2 L | 1 | 35 d | Active |
| GreenLeaf Containers | Packaging | UDYAM-KA-12-0098765 | 29GREEN...0Z3 (active) | Axis ··4821 | ₹2.42 L | 1 | 47 d | Active |
| ProForma Manufacturing | Contract manufacturing | — | 29PROFO...0Z4 (active) | HDFC ··9281 | ₹62.4 L | 0 | 36 d | Active |
| Shiprocket Multi-channel | 3PL & logistics | — | 33SHIPR...0Z4 (active) | HDFC ··0034 | ₹28.4 L | 3 | 12 d | Active |
| Delhivery Pvt Ltd | 3PL & logistics | — | 06DELHV...0Z5 (active) | ICICI ··7281 | ₹16.8 L | 2 | 11 d | Active |
| Shopify Inc | SaaS | Foreign | — | — (FX wire) | ₹4.61 L | 1 | 15 d | Active |
| Klaviyo Inc | SaaS | Foreign | — | — (FX wire) | ₹2.98 L | 1 | 15 d | Active |
| Zoho Corp | SaaS | — | 33ZOHOZ...0Z5 (active) | HDFC ··8412 | ₹62 K | 0 | 28 d | Active |
| IndusLaw Partners | Legal & professional | — | 29INDUS...0Z6 (active) | HDFC ··2841 | ₹6.84 L | 1 | 30 d | Active |
| Meta India | Ad platform | — | 29METAS...0Z3 (active) | (auto-debit) | ₹38.4 L | 0 | 15 d | Active |
| Google India | Ad platform | — | 29GOOGL...0Z7 (active) | (auto-debit) | ₹24.4 L | 0 | 15 d | Active |
| Regus Bangalore | Facility & admin | — | 29REGUS...0Z8 (active) | HDFC ··1247 | ₹14.8 L | 1 | 30 d | Active |
| KPMG Tax Advisory | Legal & professional | — | 29KPMG...0Z9 (active) | HDFC ··6628 | ₹14.2 L | 1 | 32 d | Active |
| WaxLine Suppliers | Raw materials | UDYAM-KA-12-0098123 | 29WAXLN...1Z0 (active) | Axis ··3471 | ₹3.84 L | 0 | 30 d | Active |
| GlossPrint Studios | Packaging | UDYAM-KA-12-0024617 | 29GLOSS...1Z1 (active) | SBI ··4012 | ₹2.84 L | 0 | 35 d | Active |
| Bharat Petroleum (Office fuel) | Other | — | 29BHARP...1Z2 (active) | — (corp card) | ₹84 K | 0 | 30 d | Active |

Row click → opens a right-side drawer with full vendor profile:
- Header: vendor name + MSME badge + category chip
- Quick stats: YTD spend, avg DTP, open invoices, last paid
- Tabs inside drawer: Profile · Invoices history · Payment history · Compliance (GSTR-2B, TDS records)
- Footer actions: "Edit profile" (`btn-secondary`), "Mark inactive" (`btn-destructive`)

---

## 8. ADD VENDOR / NEW INVOICE MODALS

### 8.1 + Add Vendor

Centred modal, 600 px wide. Single-step form:
- Vendor name (text)
- Category (dropdown)
- Vendor type radio: Domestic / Foreign / MSME
- If MSME: UDYAM registration number (text field appears)
- If Domestic or MSME: GSTIN (text + "Validate" button that simulates 800 ms call)
- PAN (text, auto-filled from GSTIN if Validate succeeds)
- Bank account details: Account number · IFSC · Beneficiary name
- Default payment mode: NEFT · IMPS · RTGS · UPI (radio)
- TDS section default (per category, pre-selected): 194C / 194I / 194J / None
- Default credit period (days): 30 (number input)

Footer: `btn-secondary` "Cancel" · `btn-primary` "Add vendor".

On submit: simulate 600 ms, show success toast "{Vendor} added · ready to receive invoices".

### 8.2 + New Invoice

Centred modal, 700 px wide. Two-mode toggle at top: **Upload PDF/JPG** | **Manual entry**.

**Upload mode:** drag-and-drop area + "Pull from email inbox →" link. On upload, simulate a 1.5 s OCR processing state, then auto-fill the manual-entry form with extracted fields, asking user to review.

**Manual entry mode:** form fields:
- Vendor (dropdown from Vendor Master)
- Invoice number
- Invoice date / Due date
- Amount + GST (auto-calculated from vendor's GSTIN state + rate)
- Category (auto-filled from vendor)
- PO reference (optional dropdown of open POs)
- Line items table (add row): Description · Qty · Unit price · GST rate · Total
- Attach PDF (optional)

Footer: `btn-secondary` "Save as draft" · `btn-primary` "Submit for approval".

On submit: simulate 600 ms, show success toast "Invoice {INV#} submitted for L1 approval → routed to Aarav".

---

## 9. CROSS-PAGE INTEGRATION (important — don't duplicate)

Vendors is the **source of truth for the vendor side**. Other pages read from it:

- **Reconciliation > Categorised tab > Vendor payments category**: expanding this category drills into vendor-level transaction list. Each transaction click → opens the **Vendor profile drawer from this page**, not a separate drawer.
- **Compliance > MSME tab**: shows the subset of vendors where `is_msme === true` AND age > 30 days. The same vendor data, filtered. Don't recreate the vendor list.
- **Compliance > GSTR-2B reconciliation**: vendor invoices feed the reconciliation table. Don't recreate the vendor side.
- **Compliance > TDS outbound (194C/I/J)**: aggregated from invoice-level TDS already deducted (set in invoice creation flow).
- **Cash & Runway > 13-week forecast**: vendor payable outflows are a forecast input. Don't recreate.
- **Reports > Bank Reconciliation, Balance Sheet (trade payables ageing)**: pull from vendor data.

If Cursor finds duplicate vendor data already mocked elsewhere (e.g., the existing MSME tab has 5 hard-coded vendor rows), consolidate the mock data into a single `src/data/vendorsMockData.ts` and have the MSME tab and other pages read from it.

---

## 10. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Top stat tiles**: "MSME at risk" deep-links to Compliance > MSME tab. Others static.
- **Tab switching**: each tab renders different content.
- **All filters in all tabs**: stateful; update visible rows.
- **Invoice row click**: opens right-side drawer with invoice detail.
- **Approve / Pay now / Resolve buttons** on invoice rows: each opens appropriate confirmation/drawer.
- **Multi-select on Payment Schedule**: live count of selected + ₹ total. "Pay batch" button enables.
- **Cashfree Payouts batch modal**: full 2-second simulated flow with cycling sub-text, ends with success toast.
- **+ Add Vendor modal**: form submission flows to success toast; new vendor appears in Vendor Master.
- **+ New Invoice modal**: both upload and manual entry modes work; on submit, new invoice appears in Tab 1 with Pending L1 status.
- **Vendor Master row click**: opens vendor profile drawer.
- **Vendor profile drawer's "Mark inactive"**: confirmation modal then status changes.
- **Ageing tab MSME callout click**: deep-links to Compliance > MSME tab.

---

## 11. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

Same compliance rules as previous redesigns. After this change, this grep within `VendorsScreen` must return zero matches:

```
font-serif | italic (except quoted text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar
```

Use only shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<DeltaArrow>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`, `btn-destructive`), and the design tokens.

---

## 12. DELIVERABLE

A new `VendorsScreen` component in `src/App.tsx` (or extracted to `src/components/VendorsScreen.tsx` if the file is getting long). Affected reference updates:

1. `Tab` union (line 137) — add `'vendors'`.
2. `renderContent()` switch (line ~2495) — add `case 'vendors': return <VendorsScreen />;`.
3. Sidebar — add a new `<SidebarItem icon={Users} label="Vendors" active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />` between Reconciliation and Returns & Recovery.
4. Chat route map in the AskCoWorkerPanel props (around line ~2356) — add `'/vendors': 'vendors'`.

Mock data goes in `src/data/vendorsMockData.ts`. Existing MSME tab mocks in `ComplianceScreen` should be deleted and consume from `vendorsMockData` instead (single source of truth).

`npm run dev` must build cleanly with no TypeScript errors.

---

## 13. AskCoWorker — add 5 vendor-focused chips

The page-awareness work already in `Prompt_AskCoWorker_PageAwareness.md` needs an addition for the new page. Add 5 chips for `pages: ['vendors']`:

1. *"Which vendor payments are overdue?"*
2. *"Show MSME vendors at Section 43B risk"*
3. *"What's my total exposure by vendor category?"*
4. *"Schedule a batch payment for this week's dues"*
5. *"Which vendors have GSTR-2B mismatches?"*

Add their CannedResponse entries in `askCoWorkerResponses.ts` following the same pattern as the other 39 (id, question, pages, keywords, headline, body, optional artifact, sources, drillLink to `/vendors`).

---

*The page is doing one job: making the vendor side as observable, controllable, and closed-loop as the channel side. Every invoice → matched to a PO → approved through a chain → paid via Cashfree Payouts → reconciled back into the bank statement. If a control doesn't serve that closed loop, it doesn't belong.*

---

## 14. ASSUMPTIONS — flag for override

1. **Approval chain is 2-level (L1 + L2)** with thresholds (e.g., L1 only for invoices < ₹5 L; L2 required above). Mock data uses this. Real-world thresholds need configuration.
2. **TDS is auto-calculated** on payment based on vendor type and invoice category. Mock shows calculated values. Production needs proper TDS rule engine.
3. **Cashfree Payouts integration** is mocked — no actual Payouts API call. For a real integration, the batch payment flow would call Cashfree's `/v1/batch_payouts` endpoint with the vendor list and amounts. Worth flagging to the engineering plan.
4. **Three-way match** (PO ↔ invoice ↔ receipt) is shown as an icon with status. Whether the brand actually maintains POs (vs. just paying against invoices) varies — Native Glow at ₹28 cr probably has informal POs at best.
5. **OCR upload flow** is simulated. Real implementation needs an invoice OCR service (third-party like Klippa, Veryfi, or build on a vision model).
6. **Vendor master is local to CoWorker.** Production likely syncs with Tally's vendor ledger as the upstream source of truth. Bidirectional sync is non-trivial.
