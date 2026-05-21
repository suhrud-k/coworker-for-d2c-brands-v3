# Cursor Prompt: Redesign the Reports page — broaden scope, deepen financial statements

Rebuild the `ReportsScreen` component in `src/App.tsx` (currently around line 668). Broaden the page from "P&L + Balance Sheet only" to a full reports hub covering financial statements, marketplace operations, tax compliance, payments, and SKU/inventory. Deepen P&L and Balance Sheet to Indian Schedule III format, and add a Cash Flow Statement as the third financial statement.

Every report card, every preset pill, every Generate button must be interactive — no decorative chrome.

---

## 1. NO RENAME NEEDED

Sidebar label, route key, and component name all stay as **"Reports"** / `'reports'` / `ReportsScreen`. The sidebar's child entries do change:

- Existing children: "Profit & Loss" only.
- New children under the **Reports** parent in the sidebar:
  - All Reports (default landing)
  - Financial Statements
  - Marketplace Operations
  - Tax & Compliance
  - Payments & Banking
  - SKU & Inventory

Clicking any child sets a `selectedCategory` state that pre-filters the reports page to that category. "All Reports" shows everything.

---

## 2. NEW PAGE ARCHITECTURE

The page becomes a **report hub** with a category navigator at the top and a grid of report cards below. Click any card to drill into that specific report (filters + generate + render result inline).

```
SectionHeader: "Reports" + global date-range filter
  ↓
Category tabs: All · Financial Statements · Marketplace Ops · Tax & Compliance · Payments & Banking · SKU & Inventory
  ↓
Grid of report cards (filtered by selected category)
  ↓
Drilled-in single-report view (opens below or replaces grid when a card is clicked)
  ├── Sub-filters (channel, state, account, period — varies per report)
  ├── Generate button (primary)
  └── Generated report rendered inline (table or statement)
```

Two view states for the page:
1. **Hub view** — category tabs + report card grid. Default.
2. **Single-report view** — when a card is clicked. Shows breadcrumb (`Reports / Financial Statements / Profit & Loss`), a "← Back to Reports" button, sub-filters specific to that report, the Generate button, and the rendered result.

---

## 3. TOP-LEVEL FILTERS (applies across all reports unless overridden in single-report view)

A filter strip just below the SectionHeader:

- **Date range** preset pills: Till Date · Last Month · Last Quarter · **Last Financial Year** (default) · Custom.
- **Entity / state** dropdown: All entities · Karnataka (KA) · Maharashtra (MH) · Tamil Nadu (TN) · Delhi (DL) · Uttar Pradesh (UP) · West Bengal (WB).
- **Status pill** on the right: `<StatusPill status="success" text="Audit ready" />` if all sources are synced, `<StatusPill status="warning" text="Sync lag detected" />` otherwise.

Selected period and entity are passed down to whichever report card is opened.

---

## 4. REPORT CATEGORIES — 17 REPORTS TOTAL

Each report card displays: report name (16 px font-semibold navy), one-line description (13 px gray-500), last-generated timestamp (12 px gray-400), a small icon (lucide, 18 px primary), and a `View →` `btn-tertiary` link in the bottom-right corner. Cards are clickable across their full area, not just the link.

### Category 1 — Financial Statements (3 reports)

| Icon | Report | Description |
|---|---|---|
| `FileBarChart` | **Profit & Loss Statement** | Schedule III P&L with channel-wise revenue breakdown |
| `FileSpreadsheet` | **Balance Sheet** | Schedule III B/S including pending settlements as receivables |
| `TrendingUp` | **Cash Flow Statement** | Indian GAAP indirect method — operating, investing, financing |

### Category 2 — Marketplace Operations (4 reports)

| Icon | Report | Description |
|---|---|---|
| `Boxes` | **Marketplace-wise Orders** | All orders by channel with status, AOV, GMV, returns |
| `ReceiptText` | **Settlement Reconciliation** | Three-way match: marketplace report → CoWorker → bank credit |
| `SplitSquareHorizontal` | **Settlement Breakdown** | Order payments vs non-order credits/debits per marketplace |
| `ShieldAlert` | **Marketplace Charges Variance** | Actual deductions vs contracted rate card — flags overcharges |

### Category 3 — Tax & Compliance (4 reports)

| Icon | Report | Description |
|---|---|---|
| `FileCheck` | **GSTR-1 Filing Pack** | Outward supplies with multi-state HSN summary, ready for upload |
| `GitMerge` | **GSTR-2B Reconciliation** | Vendor invoices in GSTR-2B vs your books, mismatch flags |
| `Receipt` | **TDS Statement (194-O)** | Marketplace TDS deductions, certificates collected, claims due |
| `Percent` | **TCS Reconciliation (Section 52)** | TCS as per marketplaces vs Form 26AS vs CoWorker calculations |

### Category 4 — Payments & Banking (3 reports)

| Icon | Report | Description |
|---|---|---|
| `CreditCard` | **Payment Gateway Settlements** | Cashfree + Razorpay settlements, payouts to bank, fees deducted |
| `Landmark` | **Bank Reconciliation Statement** | Bank balance vs book balance vs in-transit, all bank accounts |
| `Truck` | **COD Remittance Report** | Shiprocket + Delhivery COD collections, remittance schedule, dues |

### Category 5 — SKU & Inventory (3 reports)

| Icon | Report | Description |
|---|---|---|
| `Trophy` | **SKU Profitability Ranking** | All SKUs ranked by contribution margin, channel-wise |
| `Grid3x3` | **Channel × SKU Margin Matrix** | Same SKU's margin per channel — surfaces channel-specific losses |
| `PackageX` | **Returns by SKU** | Return rate per SKU per channel, top offenders, ₹ lost |

---

## 5. DETAILED P&L STATEMENT (Schedule III format)

When a user clicks **Profit & Loss Statement**, the single-report view shows:

### 5.1 Sub-filters (above the Generate button)

- **Comparison period** dropdown: vs Last Period (default) · vs Last Year · vs Budget · No comparison.
- **Granularity** toggle: Consolidated · Channel-wise · Schedule III only.
- **Include unsettled?** checkbox: when checked, pending PG/marketplace receivables are included as accrued revenue.
- **GST** toggle: Inclusive · Exclusive (default).

### 5.2 Generate behaviour

The primary `btn-primary` "Generate statement" button triggers a 2-second processing state with cycling sub-text: "Pulling Tally Prime…" → "Pulling Cashfree PG…" → "Pulling 5 marketplace settlements…" → "Reconciling GST…" → "Composing Schedule III statement…" → done.

### 5.3 Rendered output

After generation, render a full Schedule III P&L statement with **current period** and **comparison period** columns. Below structure:

**I. REVENUE**

- Revenue from Operations
  - Sale of products (gross) [expandable]
    - Shopify
    - Amazon
    - Flipkart
    - Myntra
    - Meesho
  - Less: Sales returns and allowances [expandable]
    - Returns by channel breakdown
  - Net sales
- Other operating income [expandable]
  - Marketplace rebates and reimbursements
  - Listing fee credits
- Other income [expandable]
  - Interest on deposits
  - Foreign exchange gain
  - Miscellaneous income
- **Total revenue**

**II. EXPENSES**

- Cost of materials consumed [expandable]
  - Raw materials
  - Packaging materials
  - Contract manufacturing charges
- Changes in inventories of finished goods (opening − closing)
- Employee benefits expense [expandable]
  - Salaries, wages and bonus
  - Contribution to provident and other funds
  - Staff welfare expenses
- Finance costs [expandable]
  - Interest on borrowings
  - Other finance charges
- Depreciation and amortisation expense
- Other expenses [expandable]
  - Marketplace charges [expandable]
    - Commission (by channel)
    - Shipping fees (by channel)
    - Fixed fees (by channel)
    - Collection fees (by channel)
    - Pick-and-pack fees (by channel)
    - Reverse logistics
  - Advertising and sales promotion [expandable]
    - Meta Ads
    - Google Ads
    - Marketplace PLAs
  - Logistics and warehousing [expandable]
    - Third-party logistics
    - Last-mile courier
    - Warehouse rent
  - Rent
  - Power and fuel
  - Repairs and maintenance
  - Travel and conveyance
  - Communication
  - Legal and professional fees
  - Insurance
  - Rates and taxes
  - Bank charges
  - Miscellaneous expenses
- **Total expenses**

**III. PROFIT BEFORE EXCEPTIONAL ITEMS AND TAX**
**IV. EXCEPTIONAL ITEMS** (typically nil for this stage)
**V. PROFIT BEFORE TAX**

**VI. TAX EXPENSE**

- Current tax
- Deferred tax (income) / charge
- MAT credit utilised

**VII. PROFIT FOR THE PERIOD**

**VIII. EARNINGS PER EQUITY SHARE**

- Basic
- Diluted

### 5.4 Rendering rules

- All amounts in `tabular-nums`. Indian comma formatting (₹1,23,45,678 not ₹12,345,678).
- Subtotal rows (Total revenue, Total expenses, Profit before tax, Profit for the period) styled as `font-bold text-navy-950 bg-purple-50/40`.
- Expandable rows have `<ChevronRight>` / `<ChevronDown>` indicators. Sub-rows indented and styled `text-gray-600`.
- Negative numbers and expense rows in `text-error` only when reading the expense column; subtotals stay navy.
- Every line item has an `<InfoIcon>` next to it. Hovering shows: "Sourced from Tally Prime + Cashfree PG · synced 12 min ago · 23 line items".
- A **CoWorker-specific footer note** above the rendered statement: `<Card>` with indigo soft-fill: *"Includes pending settlements of ₹52.4 L as accrued revenue. This is what distinguishes this statement from your standalone Tally P&L."*

### 5.5 Top-right actions

- **Download** dropdown: PDF · Excel (Schedule III template) · CSV · Tally-compatible XML.
- **Share with auditor** button (`btn-secondary`).
- **Lock period** toggle (`btn-secondary` with `Lock` icon). When locked, the period's numbers are frozen and any future re-generation won't change them — needed for audit traceability.

---

## 6. DETAILED BALANCE SHEET (Schedule III format)

Identical generate pattern as P&L. Rendered output:

**I. EQUITY AND LIABILITIES**

- **Shareholders' funds**
  - Share capital [expandable]
    - Authorised
    - Issued, subscribed and paid-up
  - Reserves and surplus [expandable]
    - General reserve
    - Securities premium
    - Surplus in P&L (opening + profit − dividend)
  - Money received against share warrants
- **Share application money pending allotment**
- **Non-current liabilities**
  - Long-term borrowings [expandable]
    - Term loans from banks
    - Term loans from NBFCs
    - Debentures
  - Deferred tax liabilities (net)
  - Other long-term liabilities
  - Long-term provisions
- **Current liabilities**
  - Short-term borrowings [expandable]
    - Working capital loans
    - Cash credit / overdraft
  - Trade payables [expandable]
    - Dues to micro and small enterprises
    - Dues to others (split by ageing: < 1 year / 1–2 years / 2–3 years / > 3 years)
  - Other current liabilities [expandable]
    - GST payable
    - TDS payable
    - TCS payable
    - Accrued expenses
    - Customer refunds payable
  - Short-term provisions [expandable]
    - Provision for income tax
    - Provision for employee benefits

**Total — Equity and Liabilities**

**II. ASSETS**

- **Non-current assets**
  - Property, plant and equipment (PPE)
  - Intangible assets [expandable]
    - Software
    - Trademarks and brand assets
  - Capital work-in-progress
  - Non-current investments
  - Deferred tax assets (net)
  - Long-term loans and advances
  - Other non-current assets
- **Current assets**
  - Current investments [expandable]
    - Mutual funds (liquid)
    - Fixed deposits < 12 months
  - Inventories [expandable]
    - Raw materials and packaging
    - Work-in-progress
    - Finished goods [expandable]
      - At own warehouse
      - At FBA (Amazon)
      - At Flipkart Smart
      - At Myntra fulfilment
      - In transit
  - Trade receivables [expandable]
    - Considered good (< 6 months)
    - Considered good (> 6 months)
    - Considered doubtful (less allowance)
  - Cash and cash equivalents [expandable]
    - Cash on hand
    - Balances with banks (current accounts) — list each account
    - Fixed deposits < 3 months
  - **Pending settlements receivable** [CoWorker-specific, expandable, highlighted in indigo]
    - Cashfree PG settlements pending
    - Razorpay settlements pending
    - Amazon payouts pending
    - Flipkart payouts pending
    - Myntra payouts pending
    - Meesho payouts pending
    - Shopify Payments pending
  - Short-term loans and advances [expandable]
    - Advances to suppliers
    - Prepaid expenses
    - Security deposits
  - Other current assets [expandable]
    - GST input credit
    - TDS receivable
    - TCS receivable

**Total — Assets**

### 6.1 Rendering rules

- Same expand pattern as P&L.
- Both totals (Equity+Liabilities and Assets) must match. Add a small green check icon next to them when matched, with a tooltip "Balance sheet reconciles."
- The "Pending settlements receivable" block is visually emphasised with a left border in `primary` — it's the unique CoWorker line.
- Below the rendered B/S, a `<Card>` with explanatory text: *"₹52.4 L of pending settlements is included as receivables. Most accounting tools wouldn't show this because they don't read live PG and marketplace data."*

---

## 7. CASH FLOW STATEMENT (Indian GAAP indirect method)

The new third financial statement. Generate behaviour same as P&L and B/S. Rendered output:

**A. CASH FLOW FROM OPERATING ACTIVITIES**

- Profit before tax
- Adjustments for:
  - Depreciation and amortisation
  - Finance costs
  - Interest income
  - (Profit) / loss on sale of PPE
  - Foreign exchange gain / loss
- **Operating profit before working capital changes**
- Changes in working capital:
  - (Increase) / decrease in trade receivables
  - (Increase) / decrease in pending settlements receivable
  - (Increase) / decrease in inventories
  - Increase / (decrease) in trade payables
  - Increase / (decrease) in other current liabilities
- **Cash generated from operations**
- Less: Income tax paid
- **Net cash from operating activities (A)**

**B. CASH FLOW FROM INVESTING ACTIVITIES**

- Purchase of PPE
- Sale of PPE
- Purchase of investments (mutual funds, FDs)
- Sale of investments
- Interest received
- **Net cash from investing activities (B)**

**C. CASH FLOW FROM FINANCING ACTIVITIES**

- Proceeds from long-term borrowings
- Repayment of long-term borrowings
- Proceeds from short-term borrowings
- Repayment of short-term borrowings
- Interest paid
- Dividend paid (if any)
- **Net cash from financing activities (C)**

**Net increase / (decrease) in cash and cash equivalents (A + B + C)**
**Cash and cash equivalents at the beginning of the period**
**Cash and cash equivalents at the end of the period**

Closing balance must reconcile to the cash line on the Balance Sheet.

---

## 8. THE OTHER 14 REPORTS (one-line spec each, for the demo)

For V1, the 14 non-financial-statement reports can render as **tabular data with download options**, without needing the full schedule treatment of P&L/B/S. Sufficient depth:

### Marketplace Operations (4)

- **Marketplace-wise Orders** — Table: Order ID · Channel · Order date · SKU · Qty · Gross amount · Status (Delivered/Returned/RTO) · Net amount post-marketplace-charges · Settlement date. 100+ rows. Sub-filters: channel multi-select, status, date range.
- **Settlement Reconciliation** — Table: Settlement batch ID · Channel · Period covered · Marketplace reported · CoWorker calculated · Bank credited · Variance · Status (Matched/Mismatch/Pending). Drill into a batch shows underlying orders.
- **Settlement Breakdown** — For each settlement batch, splits the credit into Order payments vs Non-order items (e.g., warehouse-returned goods with no sale, cancellation fees, claims credited). Two-section table.
- **Marketplace Charges Variance** — Lists orders where the marketplace's deduction differs from the contracted rate card. Columns: Order ID · Channel · Charge type · Rate card · Actual · Variance · Claim eligibility · Action.

### Tax & Compliance (4)

- **GSTR-1 Filing Pack** — A multi-section view: B2C (large), B2C (small), B2B, exports, credit/debit notes. HSN summary at the bottom. Download as JSON (GST portal-ready).
- **GSTR-2B Reconciliation** — Vendor-by-vendor table: invoice number · vendor GSTIN · invoice value · GST amount · 2B status (Matched/Mismatch/Missing) · ITC at risk. The current Compliance page has this — link to it instead of duplicating.
- **TDS Statement (194-O)** — Per marketplace: TDS deducted by them, certificates collected, certificates pending, claims pending in returns.
- **TCS Reconciliation** — Per marketplace: TCS deducted (Section 52), reported in Form 26AS, CoWorker calculated, variance, claim eligibility.

### Payments & Banking (3)

- **Payment Gateway Settlements** — Per PG batch: Cashfree/Razorpay batch ID · transaction count · gross collected · fees deducted · TCS · net settled · bank credit date · status.
- **Bank Reconciliation Statement** — Standard BRS format per bank account: Balance as per bank statement · Add: deposits in transit · Less: outstanding cheques · Balance as per books.
- **COD Remittance Report** — Per courier (Shiprocket, Delhivery): orders shipped COD · amount collected · remitted to brand · pending · ageing.

### SKU & Inventory (3)

- **SKU Profitability Ranking** — All SKUs ranked by contribution margin %. Columns: SKU · category · units sold · gross revenue · net revenue · contribution margin · margin %. Filter by channel.
- **Channel × SKU Margin Matrix** — Pivot: rows = top 20 SKUs, columns = 5 channels, cells = margin %. Highlight cells where the same SKU has > 10 pt margin gap between channels.
- **Returns by SKU** — Top 30 SKUs by return rate. Columns: SKU · channel · units returned · return rate · return cost ₹. Same data model as the Returns & Recovery page's SKU table — reuse the data source if convenient.

---

## 9. REPORT CARD PATTERN

Each card is built using the `<Card>` primitive. Structure inside:

```
[Icon · 18 px primary]
Report name (16 px font-semibold navy-950)
One-line description (13 px gray-500, max 2 lines)
                                                  ↘
                                       Last generated · 2 hrs ago
                                                  View →
```

Card hover: subtle `0 1px 3px rgba(17,24,39,0.06)` shadow. Click takes the entire card to the single-report view (drill).

The grid is `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

For the "All Reports" view, group cards by category with a small section heading above each group (`<h3 className="text-[14px] font-medium uppercase tracking-wider text-gray-500 mt-8 mb-3">`).

---

## 10. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Category tabs**: click switches the grid filter. Active tab uses the standard purple-50 + primary text pattern.
- **Date range pills + entity dropdown** at the top: stateful; passed through to whichever report is opened.
- **Report card click**: opens the single-report view for that report. Browser back / "← Back to Reports" returns to the hub.
- **Generate button** in single-report view: triggers the 2 s processing state with cycling sub-text, then reveals the rendered report.
- **Comparison-period dropdown**, **granularity toggle**, **include-unsettled checkbox**, **GST toggle** in P&L/B/S/Cash Flow: stateful; clicking Generate again uses the latest filter values.
- **Expandable rows** in the rendered statements: smooth max-height transition; chevron rotates.
- **Drill-to-source tooltip**: hovering an `<InfoIcon>` next to a row shows the source label.
- **Download dropdown**: opens, shows 4 format options. Clicking any option simulates a 600 ms processing state and shows a toast "Report exported as [format] · click to download" — no actual file in V1.
- **Share with auditor button**: opens a small modal with a placeholder email field and "Send" button. V1: simulate send + success toast.
- **Lock period toggle**: toggles a `<StatusPill>` from "Open" to "Locked". When locked, the Generate button is disabled with a tooltip "Period is locked. Unlock to regenerate."
- **Sidebar children navigation**: clicking any sub-item of Reports sets the `selectedCategory` and routes to the hub.
- **For the 14 non-financial-statement reports**: clicking a report card opens the single-report view with a tabular data render. Sub-filters per report must work (channel multi-select, status, date range).

---

## 11. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

Same compliance rules as previous redesigns. After this change, this grep within `ReportsScreen` must return zero matches:

```
font-serif | italic (except quoted user text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar | Initialize | Execute Protocol | Dossier
```

Use only shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<DeltaArrow>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`), and the design tokens.

---

## 12. DELIVERABLE

A rewritten `ReportsScreen` component in `src/App.tsx`. Update the sidebar (line ~2275) to add the 5 category sub-items as `<SidebarChild>` elements. Mock data can be inlined or extracted to `src/data/reportsMockData.ts`. `npm run dev` builds cleanly with no TypeScript errors.

---

## 13. ASSUMPTIONS — flag for override

I made these design decisions on the user's behalf. Override any of them in a follow-up if they don't match intent:

1. **Five categories chosen**: Financial Statements / Marketplace Ops / Tax & Compliance / Payments & Banking / SKU & Inventory. (Alternatives: split Marketing into its own category; combine Payments and Marketplace; add a Customer/Cohort Analytics category.)
2. **17 reports total**, distributed 3-4-4-3-3 across the five categories. Easy to add or remove individual reports.
3. **Cash Flow Statement** added as a third financial statement, sibling to P&L and B/S. (Alternative: skip Cash Flow; ledger view of P&L is enough for V1.)
4. **Schedule III format** for both P&L and Balance Sheet (Indian GAAP). (Alternative: simpler managerial format; or US GAAP if the user has cross-border needs.)
5. **Scheduled reports / automated delivery** is out of scope for V1. (Alternative: include a "Schedule weekly" toggle on each report card that simulates the schedule.)
6. **Drill-down into individual transactions** behind a line item is a hover tooltip only, not a drillable modal. (Alternative: every line drills into a transaction list modal.)
7. **The 14 non-financial-statement reports** render as flat tables with download options, not as full nested schedules. (Alternative: build the same depth as P&L for, say, Marketplace-wise Orders.)
8. **Sidebar children**: replaced the existing "Profit & Loss" single child with 6 children (All Reports + 5 categories). (Alternative: keep a flat list of all 17 reports as children.)

---

*The page is doing one job: turning the live data CoWorker already has — Tally, Cashfree PG, 5 marketplaces, 2 banks, GST portal — into the artifacts the founder, controller, auditor, and tax officer actually need. Every report on the page either replaces a manual Excel ritual or makes a recurring compliance task one-click. If a report doesn't do one of those two things, it doesn't belong on the page.*
