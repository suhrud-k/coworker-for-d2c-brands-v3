# Google AI Studio — Prompt: Rebuild the Reconciliation Section

Replace the existing **Settlements** screen with a redesigned **Reconciliation** screen that handles three-way matching across bank statements, payment gateway data, and marketplace data — not just settlement recon.

This is a surgical change to a working prototype. Do not regenerate any other file. The Cashfree design language fix (the previous prompt) must already be applied — this section must use the shared primitives (`Card`, `SectionHeader`, `StatusPill`, `DeltaArrow`, `InfoIcon`, button classes) and the design tokens (`primary`, `navy-950`, `success`, `error`, `warning`, `gray-*`, `purple-50`). No `font-serif`, no `italic` decoration, no `tracking-[0.3em]`, no `rounded-[40px]`, no raw `indigo-*` / `slate-*` / `rose-*` references.

---

## 1. RENAMES

Across the codebase, rename "Settlements" → "Reconciliation":

- `Tab` type union in `App.tsx`: `'settlements'` → `'reconciliation'`.
- Sidebar item: label `"Settlements"` → `"Reconciliation"`. Icon stays as `Receipt`.
- Route handler in `renderContent()`: `case 'reconciliation': return <ReconciliationScreen />`.
- The chat route map in `AskCoWorkerPanel` props: `'/settlements'` → `'/reconciliation'`.
- Component name: `SettlementsScreen` → `ReconciliationScreen`. Delete the old `SettlementsScreen` body and replace with the new one below.

Update the canned response in `src/data/askCoWorkerResponses.ts` if any references the old route.

---

## 2. DATA MODEL — THE MENTAL MODEL TO ENCODE

The redesign is grounded in this distinction. Implement the types in `src/types.ts` (extend the existing file).

Every bank transaction passes through two independent checks:

**Check 1 — Categorisation.** "Can we tell what this transaction is?" Either we recognise the narration pattern and assign it to a category (Payment gateway settlements / Marketplace payouts / Vendor payments / Ad spend / etc.) or we cannot. Outcome: `categorised | unreconciled`. This is a mutually exclusive 2-way split of every bank txn.

**Check 2 — Matching.** "Did this transaction match what we expected?" This only applies to transactions that have been categorised against an expectation-bearing source (a PG batch, marketplace payout, claim). Outcome: pass = no action needed; fail = an **Exception**.

**Exceptions are a cross-cutting ledger.** An exception may link to a specific bank txn (e.g., "Flipkart credited ₹4.07 L when ₹4.18 L was expected"), or it may exist with no bank counterpart at all (e.g., "Amazon reports paying ₹3.84 L on May 14 but no bank credit yet — missing settlement").

Types to add to `src/types.ts`:

```ts
export type BankTransaction = {
  id: string;
  bankAccountId: string;       // e.g., "hdfc_2847"
  statementId: string;          // links to a BankStatement
  postedAt: string;             // ISO datetime
  narration: string;            // raw bank narration string
  amount: number;               // positive credit, negative debit
  status: 'categorised' | 'unreconciled';
  category?: { top: string; sub?: string };
  linkedExceptionIds?: string[];// any exceptions that reference this txn
};

export type ReconciliationException = {
  id: string;
  type: 'amount_mismatch' | 'missing_settlement' | 'overcharge' | 'late_credit' | 'duplicate_credit' | 'unidentified_debit';
  source: string;               // "Flipkart", "Amazon", "Cashfree PG", "Razorpay"
  bankTxnId?: string;           // optional — missing settlements have none
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
};
```

---

## 3. PAGE STRUCTURE (top to bottom)

### 3.1 Page header

`<SectionHeader title="Reconciliation" subtitle="Three-way match across bank, payment gateway, and marketplace data" />` — with a header-right action: a primary `btn-primary` labelled **"Run reconciliation"** with a `RefreshCw` icon. Below the button, a `text-[12px] text-gray-500` line: "Last run · 12 min ago".

When the button is clicked:
- Replace label with "Reconciling…" + spinning `RefreshCw`.
- Below the button, replace the timestamp with a cycling sub-text that updates every 700 ms through: "Pulling Cashfree PG…" → "Pulling Amazon settlements…" → "Pulling Flipkart settlements…" → "Pulling HDFC bank…" → "Pulling ICICI bank…" → "Re-matching transactions…" → done.
- After ~3 seconds total, the button returns to "Run reconciliation", timestamp shows "Last run · just now", and a small `success-50` toast appears top-right: "Reconciliation complete — 4 new categorisations, 1 new exception surfaced." (Toast auto-dismisses after 4 s.)

### 3.2 Top stat strip — four `<Card>` tiles in a 4-column grid

| Tile | Big number | Sub | Accent |
|---|---|---|---|
| Auto-match rate | **99.2%** | "of categorised txns this week" | success left border (4 px) |
| Open exceptions | **27** | "₹4.21 L variance · 4 priority" | error left border |
| Unreconciled bank txns | **14** | "across 5 statements" | warning left border |
| Pending bank credit | **₹18.7 L** | "Cashfree settlement > 48 hrs" | navy-950 left border |

Each tile uses the existing `<Card>` primitive. Big number = `text-[28px] font-bold text-navy-950`. Sub line = `text-[12px] text-gray-500`.

### 3.3 Tabs

Three tabs below the stat strip, in this order: **Exceptions** · **Categorised** · **Bank Statements**. Tab styling: pill-shaped buttons with active state using `bg-purple-50 text-primary font-semibold`, inactive `text-gray-500 hover:text-gray-900`. Active tab also gets a 2 px `border-b-2 border-primary` underneath.

Each tab renders **different content** — not the same table with different filters.

---

## 4. EXCEPTIONS TAB

### 4.1 Filter row

Above the table, a row of stateful filter chips:
- **Type** dropdown: All types · Amount mismatch · Missing settlement · Overcharge · Late credit · Duplicate credit · Unidentified debit.
- **Source** dropdown: All sources · Amazon · Flipkart · Myntra · Meesho · Cashfree PG · Razorpay · HDFC · ICICI.
- **Aging** dropdown: All · > 24 hrs · > 3 days · > 7 days.
- **Variance** dropdown: All · > ₹10 K · > ₹50 K · > ₹1 L.
- A search input on the right: `placeholder="Search by source, ID, narration…"` — matches against `source`, `bankTxnId`, `narration`.

All filters and search are functional and stateful (update the visible list on change). Filter chips show their active value when set.

### 4.2 Exceptions table

Columns: **Type** (status pill, color by type) · **Source** (channel chip) · **Reference** (bank txn ID if any, or "—") · **Expected** (right-aligned, `tabular-nums`) · **Actual** (right-aligned, `tabular-nums`, `text-error` if negative variance) · **Variance** (right-aligned, `text-error` for negative) · **Aging** (e.g., "2d", "49h") · **Action** (a `btn-tertiary` link with the exception's `actionLabel`).

Show only **4 priority rows** (sorted by `variance` desc within open exceptions), not all 27. Below the table, a centred `btn-tertiary` link: **"View all 27 exceptions →"**.

### 4.3 Sample mock data — 4 rows that mix types

Generate the full `ReconciliationException[]` array with 27 entries; the 4 shown in the default view should be these, in this order:

1. `amount_mismatch` · Source: **Flipkart** · Reference: `HDFC ··2847 / TXN-FK-19281` · Expected: `₹4,18,290` · Actual: `₹4,07,118` · Variance: `−₹11,172` · Aging: `2d` · Action: **"Investigate"** · description: "Flipkart settlement landed ₹11,172 short. Likely a commission rate-card variance — auto-detected."
2. `missing_settlement` · Source: **Amazon** · Reference: `—` · Expected: `₹3,84,200` · Actual: `—` · Variance: `−₹3,84,200` · Aging: `4d` · Action: **"Chase Amazon"** · description: "Amazon MTR reports payout on May 14, but no credit at HDFC. 4 days overdue against standard T+7 cycle."
3. `overcharge` · Source: **Flipkart** · Reference: `FK-SET-88412` · Expected: `₹2,45,400` · Actual: `₹2,42,153` · Variance: `−₹3,247` · Aging: `3d` · Action: **"File claim"** · description: "Commission charged at 12% on apparel < ₹500; rate card says 8%. Eligible for claim until May 26."
4. `late_credit` · Source: **Cashfree PG** · Reference: `CF-S-7724` · Expected: `₹18,70,000` · Actual: `—` · Variance: `−₹18,70,000` · Aging: `49h` · Action: **"Ping bank"** · description: "Settlement file shows payout on May 16; HDFC has not received credit. > 48 hr breach of normal cycle."

For the remaining 23 entries, generate plausible variations across all 6 exception types. Vary sources, amounts, and aging.

### 4.4 Row click behaviour

Clicking a row opens a right-side drawer (slide-over panel, 480 px wide) showing the full exception detail:
- The exception header with type pill, source, aging.
- The natural-language description.
- A 3-step match trail: **Marketplace report** → **CoWorker normalisation** → **Bank statement match**. Each step shows a green check if passed, red cross if failed. The failed step shows the actual vs expected values.
- Source documents pulled: "Source · Flipkart Seller Hub Settlement Report · synced 12 min ago" (with `ExternalLink` icon).
- Actions: primary `btn-primary` matching the exception's `actionLabel`, secondary `btn-secondary` "Mark as investigating", tertiary `btn-tertiary` "Mark as resolved".

---

## 5. CATEGORISED TAB

The goal: show the user a real-time, transaction-grounded cash flow built from raw bank transactions.

### 5.1 Filter row

- **Date range** dropdown: Last 7 days (default) · Last 30 days · This month · Last month · Custom.
- **Bank account** dropdown: All accounts · HDFC ··2847 · ICICI ··5621.
- **Direction** dropdown: All · Inflows only · Outflows only.
- Search input: matches narration, sub-category, vendor name.

### 5.2 Summary strip — totals

Two large totals at the top of the tab content:
- **Inflows: ₹1.29 Cr** (in `text-success font-bold text-[24px]`)
- **Outflows: ₹50.0 L** (in `text-error font-bold text-[24px]`)
- **Net: ₹78.6 L** (in `text-navy-950 font-bold text-[24px]`)

Each with a small `text-[12px] text-gray-500` line below: "across 95 transactions · last 7 days".

### 5.3 Category list

Below the summary, two collapsible sections — **Inflows** and **Outflows** — each containing rolled-up category rows. Each category row is a `<Card>`-style row with:
- An expand chevron (`ChevronRight` / `ChevronDown`)
- Category name (e.g., "Marketplace payouts")
- Sub-category breakdown as small chips (e.g., "Amazon · Flipkart · Myntra · Meesho")
- Right-aligned `text-[18px] font-semibold text-navy-950 tabular-nums` total amount
- A `text-[12px] text-gray-500` "N transactions" count
- Expanding the row reveals the underlying transaction list below it: date, narration, amount, sub-category, and a `text-primary` "View in bank statement →" link per row.

### 5.4 The categories to populate

Use exactly these 14 categories. Numbers below are for "last 7 days", Native Glow brand.

**INFLOWS — total ₹1.29 Cr**

1. **Payment gateway settlements** — ₹38.4 L · 21 txns · sub: Cashfree ₹28.2 L (15), Razorpay ₹10.2 L (6)
2. **Marketplace payouts** — ₹52.1 L · 18 txns · sub: Amazon ₹18.4 L (4), Flipkart ₹14.2 L (5), Myntra ₹9.8 L (4), Nykaa ₹6.5 L (3), Meesho ₹3.2 L (2)
3. **COD remittances** — ₹22.4 L · 14 txns · sub: Shiprocket ₹14.2 L (8), Delhivery ₹8.2 L (6)
4. **Tax refunds** — ₹1.8 L · 1 txn · sub: GST refund (KA) ₹1.8 L
5. **Capital & finance inflows** — ₹14.2 L · 1 txn · sub: Working capital loan disbursement ₹14.2 L
6. **Other inflows** — ₹47,290 · 3 txns · sub: Interest on FD ₹38,400, FX inward (Shopify intl.) ₹8,890

**OUTFLOWS — total ₹50.0 L**

7. **Vendor & supplier payments** — ₹18.4 L · 9 txns · sub: Raw materials ₹12.1 L (5), Packaging ₹4.2 L (3), Contract manufacturing ₹2.1 L (1)
8. **Ad spend** — ₹15.6 L · 12 txns · sub: Meta ₹8.2 L (6), Google ₹6.1 L (4), Amazon Ads ₹1.3 L (2)
9. **Logistics & fulfilment** — ₹8.2 L · 7 txns · sub: Shiprocket ₹4.8 L (4), Delhivery ₹2.4 L (2), Last-mile partner ₹1.0 L (1)
10. **Statutory** — ₹4.2 L · 3 txns · sub: GST deposit ₹3.8 L, TDS challan ₹40 K, PF ₹0 (paid earlier this month)
11. **Operating expenses** — ₹2.4 L · 8 txns · sub: SaaS subscriptions ₹1.2 L (Shopify, Tally, Klaviyo), Rent ₹84 K, Utilities ₹28 K, Bank charges ₹4 K, Professional fees ₹40 K
12. **Finance & debt** — ₹1.2 L · 1 txn · sub: Working capital loan EMI
13. **Payroll** — ₹0 this week · 0 txns · sub: empty (paid on 1st)
14. **Owner / internal transfers** — ₹0 this week · 0 txns · sub: empty

### 5.5 Linked exceptions indicator

If a category contains transactions that are also linked to open exceptions, show a small `text-error text-[12px]` badge at the right of the category header: "⚠ 2 linked exceptions". Click jumps to the Exceptions tab pre-filtered to the matching source.

---

## 6. BANK STATEMENTS TAB

### 6.1 Filter row

- **Date range** picker: range input with two date fields. Default: last 7 days (May 12 – May 18, 2026).
- **Bank account** dropdown: All · HDFC ··2847 · ICICI ··5621.
- Search input: matches statement ID, bank name.

### 6.2 Statement list

A list (not a table — a list of richer rows) of ingested bank statements. Each row is a `<Card>`:

```
[Date]   [Bank · Account]              [Txn count]    [Categorised | Unreconciled]    [CTAs]
May 18   HDFC Bank · ··2847 Current   42 transactions   ▓ 38 categorised  · ⚠ 4        [View categorised txns →]
                                                                                       [View unreconciled txns →]
         Opening ₹3.42 Cr  →  Closing ₹3.84 Cr           
```

Layout:
- Top row: date in 14 px font-semibold text-navy-950 · bank/account in 13 px text-gray-600 · txn count chip · two counters with colored dots (categorised = success, unreconciled = warning).
- Bottom row: opening → closing balance in 12 px text-gray-500.
- Right side of the card: two `btn-tertiary` links stacked.

### 6.3 Mock statement data — generate these rows (5 statements over last 7 days)

| Date | Bank · Account | Txn count | Open | Close | Categorised | Unreconciled |
|---|---|---|---|---|---|---|
| 2026-05-18 | HDFC ··2847 | 42 | ₹3.42 Cr | ₹3.84 Cr | 38 | 4 |
| 2026-05-17 | HDFC ··2847 | 28 | ₹3.28 Cr | ₹3.42 Cr | 26 | 2 |
| 2026-05-16 | HDFC ··2847 | 18 | ₹3.18 Cr | ₹3.28 Cr | 18 | 0 |
| 2026-05-18 | ICICI ··5621 | 15 | ₹62.4 L | ₹68.2 L | 14 | 1 |
| 2026-05-17 | ICICI ··5621 | 9 | ₹60.1 L | ₹62.4 L | 9 | 0 |
| 2026-05-15 | HDFC ··2847 | 21 | ₹3.05 Cr | ₹3.18 Cr | 19 | 2 |
| 2026-05-14 | HDFC ··2847 | 16 | ₹2.92 Cr | ₹3.05 Cr | 15 | 1 |

### 6.4 CTAs — drill-down behaviour

Both **View categorised txns** and **View unreconciled txns** open a right-side drawer (480 px wide, same drawer pattern as exception detail) titled "{Categorised | Unreconciled} txns — HDFC ··2847 · 18 May 2026".

**Categorised drawer contents:**
- Total credits / debits / net at the top.
- List of categorised transactions: date, narration (truncated with ellipsis, full on hover), category chip, amount (with credit/debit color).
- Footer action: `btn-secondary` "Export as CSV".

**Unreconciled drawer contents:**
- Top alert: "{N} transactions could not be auto-categorised. Suggested categories below."
- Each row: checkbox · date · narration · amount · a suggested category dropdown (pre-populated with CoWorker's best guess) · confidence pct.
- Sticky bottom action bar: `btn-primary` **"Bulk categorise (N selected) →"** — disabled when nothing selected; updates count as user selects.
- Clicking the button simulates 800 ms processing then closes the drawer and shows a `success-50` toast: "N transactions categorised. View in Categorised tab →".

### 6.5 Sample unreconciled transactions

Across all statements, populate ~14 total unreconciled transactions. Sample 4 from the May 18 HDFC drawer:

| Date | Narration | Amount | Suggested category | Confidence |
|---|---|---|---|---|
| 2026-05-18 | NEFT IN: NIYO FINANCE PRIV | +₹2,84,500 | Capital & finance inflows | 64% |
| 2026-05-18 | UPI/BHARATPE/SETTLEMENT | +₹62,400 | Payment gateway settlements (other) | 78% |
| 2026-05-17 | NEFT OUT: ZOHO CORP IN | −₹47,200 | Operating expenses (SaaS) | 91% |
| 2026-05-17 | DEBIT: UNKNOWN TXN REF SHV2841 | −₹18,290 | Vendor & supplier payments | 38% |

---

## 7. INTERACTIVITY ACCEPTANCE CRITERIA

- Switching tabs renders different content (not just filtered same table).
- All filter dropdowns and the search inputs are stateful and update visible data on change.
- Clicking an exception row opens the right-side drawer with full detail and the 3-step match trail.
- Clicking either "View … txns" CTA in Bank Statements opens the right-side drawer scoped to that statement.
- In the Unreconciled drawer, multi-select works; the "Bulk categorise" button shows the live selected count and is disabled when none selected.
- "Run reconciliation" button shows the cycling sub-text, takes ~3 s, then shows a success toast.
- "View all 27 exceptions →" link below the exceptions table either navigates to a larger view (open a wider drawer or a sub-page) or expands the table to show all 27.
- Linked-exceptions badge in Categorised tab actually jumps to the Exceptions tab with the source filter pre-set.

## 8. STYLING — DO NOT REINTRODUCE THE BRUTALIST PATTERNS

This section must follow the same Cashfree compliance rules from the previous fix prompt. After your pass, this grep across `src/` must return zero matches inside the `ReconciliationScreen` component:

```
font-serif | italic (except inside quoted user/AI text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar | Initialize | Execute Protocol | Bulk Reconcile
```

Use only: shared primitives (`Card`, `SectionHeader`, `StatusPill`, `DeltaArrow`, `InfoIcon`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`), and design tokens (`primary`, `navy-950`, `success`, `error`, `warning`, `gray-*`, `purple-50`, `purple-100`).

---

## 9. DELIVERABLE

A single new `ReconciliationScreen` component replacing `SettlementsScreen` in `App.tsx`, plus type additions in `src/types.ts` and mock data inlined in the component or in a new `src/data/reconciliationMockData.ts`. Update the four other references mentioned in Section 1. The app must build cleanly with `npm run dev` and the new tab must be reachable from the sidebar.
