# Cursor prompt — P&L and Balance Sheet generation via chat

**Context.** Krishan (AI CFO) already owns FP&A and statement preparation per his job profile. We want a founder to be able to type "Generate the P&L for last quarter", "Pull the balance sheet as on today", or "Show me the cash flow for Q1" and have Krishan reply in chat with a fully-rendered Schedule III statement — period-over-period comparison, variance %, download as CSV, and a "Save to Reports" action that pins it inside Krishan's office → Reports tab.

**Three statement types supported:** P&L, Balance Sheet, **Cash Flow Statement**.

**Clarification behaviour.** If the user's query is missing the statement type or the period, Krishan asks for it explicitly via a chat bubble with quick-reply chips — he does **not** silently default. Examples:
- `"Generate a financial statement"` → Krishan asks: *"Which one — P&L, Balance Sheet, or Cash Flow?"* (3 chips).
- `"Pull the P&L"` → Krishan asks: *"For which period?"* (6 period chips).
- `"Cash flow for last quarter"` → resolved directly, no clarification needed.

**Read these files first:**
- `src/data/cannedResponses.ts` — current chat library and patterns.
- `src/v3Types.ts` — current type model, especially `Artifact` (extend it here).
- `src/utils/matchV3Question.ts` — match logic, may need an additional pre-pass for statement queries.
- `src/components/AgentOffice.tsx` — where Krishan's Reports tab lives (we'll wire "Save to Reports" into this).

---

## Part 1 — Type extension: `StatementArtifact`

Add a new artifact kind for full financial statements. In `src/v3Types.ts`:

```ts
export type StatementType = 'pnl' | 'balance-sheet' | 'cash-flow';

export type StatementPeriod = {
  id: string;                  // e.g. 'fy25-26-q1', 'apr-2026', 'fy24-25'
  label: string;               // human label e.g. 'Q1 FY25-26 (Apr–Jun 2026)'
  type: 'month' | 'quarter' | 'fy' | 'mtd' | 'qtd' | 'as-on';
  asOnDate?: string;           // for balance sheet, the period-end date in YYYY-MM-DD
};

export type StatementLineItem = {
  label: string;
  amount: number;              // in rupees, raw
  bold?: boolean;              // for subtotals like "Total expenses", "Profit before tax"
  isSubtotal?: boolean;
  indent?: 0 | 1 | 2;          // visual indentation level
  noteRef?: string;            // optional Schedule III note reference
};

export type StatementSection = {
  title: string;
  lines: StatementLineItem[];
};

export type ArtifactStatement = {
  kind: 'statement';
  statementType: StatementType;
  period: StatementPeriod;
  priorPeriod?: StatementPeriod;        // for comparison column
  sections: StatementSection[];         // ordered top-to-bottom
  priorAmounts?: Record<string, number>; // line.label → prior period amount
  currency: 'INR';
  unit: 'absolute' | 'lakhs' | 'crores'; // display unit; absolute by default, formatter handles ₹ Cr/L
  asOfLabel?: string;                    // for balance sheet: "As at 31 March 2026"
};

// Extend the union
export type Artifact = ArtifactTable | ArtifactBars | ArtifactCompare | ArtifactStatement;
```

Also extend `V3CannedResponse` to support **per-bubble reply chips** (needed for the clarification flow — when Krishan asks "Which period?", the chips render *inside the bubble*, not in the input area):

```ts
export type V3CannedResponse = {
  // ...existing fields...
  replyChips?: string[];   // optional — when present, render inside the bubble; clicking submits the chip text as a new user message
};
```

Keep existing artifact kinds intact.

---

## Part 2 — Mock data for 6 periods × 3 statement types

Create `src/data/statementsMockData.ts` with **pre-computed statements for the 6 periods listed below, across all three types (P&L, Balance Sheet, Cash Flow Statement)** — minimum 9 statements (3 P&L + 3 BS + 3 CFS), ideally more if time permits. Numbers should be realistic for a ₹4-6 cr/month GMV D2C brand (Native Glow scale — same scale used elsewhere in v3 mock data).

**Periods to cover:**

| Period ID | Label | Type | Purpose |
|---|---|---|---|
| `apr-2026` | Apr 2026 | month | "last month" / "April" queries |
| `may-2026` | May 2026 (MTD) | mtd | "this month" / "current month" |
| `fy25-26-q1` | Q1 FY25-26 (Apr–Jun 2026) | quarter | "this quarter" / "Q1 2026" |
| `fy24-25-q4` | Q4 FY24-25 (Jan–Mar 2026) | quarter | "last quarter" |
| `fy24-25` | FY 2024-25 | fy | "last FY" / "FY25" |
| `fy25-26-ytd` | FY 2025-26 (YTD May) | fy | "this FY" / "FY26 so far" |

For each P&L period, define a `StatementSection[]` following Schedule III:

**P&L sections (in order):**
1. **Revenue**
   - Sales — Amazon
   - Sales — Flipkart
   - Sales — Myntra
   - Sales — Meesho
   - Sales — Shopify (D2C)
   - **Revenue from operations** (subtotal, bold)
   - Other income
   - **Total income** (subtotal, bold)
2. **Cost of goods sold**
   - Opening inventory
   - Purchases / cost of materials consumed
   - Changes in inventories
   - **Total COGS** (subtotal, bold)
   - **Gross profit** (subtotal, bold)
3. **Operating expenses**
   - Marketing & advertising spend (Meta + Google + Amazon Ads + Marketplace PLAs)
   - Marketplace commissions & fees
   - Logistics & fulfilment (forward + RTO)
   - Payment gateway charges
   - Employee benefits expense
   - Rent
   - Technology & software
   - Other operating expenses
   - **Total operating expenses** (subtotal, bold)
4. **EBITDA / EBIT / PBT / PAT**
   - **EBITDA** (subtotal, bold)
   - Depreciation & amortization
   - **EBIT** (subtotal, bold)
   - Finance costs
   - **Profit before tax** (bold)
   - Tax expense
   - **Profit for the period** (bold, ultimate bottom line)

**Balance Sheet sections** (for `as-on` dates: 30-Apr-2026, 31-Mar-2026, 31-Mar-2025):

1. **Equity & Liabilities**
   - Share capital
   - Reserves and surplus
   - **Total equity** (subtotal, bold)
   - Long-term borrowings (term loans)
   - Long-term provisions
   - **Total non-current liabilities** (subtotal, bold)
   - Trade payables (incl. MSME and non-MSME split — two lines, indent 1)
   - Short-term borrowings (working capital line)
   - Other current liabilities (accrued expenses, statutory dues incl. GST/TDS payable)
   - Short-term provisions
   - **Total current liabilities** (subtotal, bold)
   - **Total equity and liabilities** (subtotal, bold)
2. **Assets**
   - Property, plant and equipment
   - Intangible assets
   - Long-term loans and advances (security deposits)
   - **Total non-current assets** (subtotal, bold)
   - Inventories (raw materials + finished goods, two lines indent 1)
   - Trade receivables — marketplace settlements pending
   - Trade receivables — other
   - Cash and bank balances
   - Short-term loans and advances (GST refund receivable, TDS receivable)
   - **Total current assets** (subtotal, bold)
   - **Total assets** (subtotal, bold)

**Cash Flow Statement sections (in order, indirect method per Schedule III):**

1. **Cash flow from operating activities**
   - Profit before tax (from the P&L of the same period)
   - Adjustments for:
     - Depreciation and amortization (indent 1)
     - Finance costs (indent 1)
     - Interest income (indent 1, negative)
     - Loss / (gain) on sale of PPE (indent 1, usually 0 for prototype)
   - **Operating profit before working capital changes** (subtotal, bold)
   - Changes in working capital:
     - (Increase) / decrease in inventories (indent 1)
     - (Increase) / decrease in trade receivables (indent 1)
     - (Increase) / decrease in short-term loans and advances (indent 1)
     - Increase / (decrease) in trade payables (indent 1)
     - Increase / (decrease) in other current liabilities (indent 1)
   - **Cash generated from operations** (subtotal, bold)
   - Income tax paid (indent 0, negative)
   - **Net cash from / (used in) operating activities (A)** (subtotal, bold)
2. **Cash flow from investing activities**
   - Purchase of PPE
   - Sale of PPE (usually 0)
   - Purchase of intangible assets
   - Movements in long-term loans and advances
   - Interest income received
   - **Net cash from / (used in) investing activities (B)** (subtotal, bold)
3. **Cash flow from financing activities**
   - Proceeds from long-term borrowings
   - Repayment of long-term borrowings
   - Proceeds from / (repayment of) short-term borrowings
   - Finance costs paid
   - Dividends paid (usually 0 for a D2C in growth mode)
   - **Net cash from / (used in) financing activities (C)** (subtotal, bold)
4. **Reconciliation**
   - **Net increase / (decrease) in cash and equivalents (A + B + C)** (bold)
   - Cash and equivalents at beginning of period
   - **Cash and equivalents at end of period** (bold, ultimate bottom line)

For each line item, include the prior-period amount in `priorAmounts` so the renderer can show comparison + variance %. Prior periods: `apr-2026` pairs with `apr-2026` prior year (mar-2025 month?) — use prior FY-equivalent month for monthly, prior quarter for quarterly, prior FY for annual. For `as-on` balance sheets, prior is the same date one year earlier.

**The numbers must tie internally across all three statements** — this is the most important quality bar:
- P&L subtotals must sum from their line items.
- BS: total assets must equal total equity + liabilities.
- CFS: net cash from operating + investing + financing (A + B + C) must equal `closing cash − opening cash` for the period.
- CFS opening cash for period T = closing cash for period T−1 = "Cash and bank balances" on the BS as at T−1.
- CFS closing cash = "Cash and bank balances" on the BS as at T.
- "Profit before tax" on the CFS must equal "Profit before tax" on the same-period P&L.

This three-way tie-out makes the demo credible. Document the cross-references in code comments next to each subtotal.

**Suggested order of execution.** Generate `fy25-26-q1` P&L first, then build the matching CFS (drawing PBT from the P&L), then derive the BS from the closing-cash + working-capital movements implied by the CFS. Then scale to the other periods (Q4 last FY ≈ 85% of Q1, FY full-year ≈ 4× Q1). This keeps the cross-statement numbers consistent.

---

## Part 3 — Statement query parser (with clarification)

Create `src/utils/parseStatementPeriod.ts`. The parser returns a discriminated-union result so the caller can either resolve directly or surface a clarifying question.

```ts
import { STATEMENT_PERIODS } from '../data/statementsMockData';
import type { StatementPeriod, StatementType } from '../v3Types';

export type StatementQueryResult =
  | { kind: 'resolved'; type: StatementType; period: StatementPeriod }
  | { kind: 'needs-type'; period?: StatementPeriod }   // we know the period but not the type
  | { kind: 'needs-period'; type: StatementType };      // we know the type but not the period
  // (a query with neither type nor period probably won't match the statement intent at all — falls through to other matchers)

const TODAY = new Date('2026-05-22');  // hardcode for prototype consistency

// Returns null if the input doesn't look like a statement query at all.
export function parseStatementQuery(input: string): StatementQueryResult | null {
  const n = input.toLowerCase();

  // --- Type detection ---
  const isPnL = /\b(p&l|pnl|profit.?and.?loss|income statement|profit.?statement)\b/.test(n);
  const isBS = /\bbalance.?sheet\b/.test(n);
  const isCFS = /\bcash.?flow(s)?( statement)?\b|\bcfs\b|\bstatement of cash flows?\b/.test(n);

  // Generic statement keyword without specifying which one
  const isGenericStmt = /\b(financial )?statement(s)?\b|\bmy numbers\b|\bmy books\b|\bfinancials\b/.test(n)
                      && !isPnL && !isBS && !isCFS;

  let type: StatementType | null = null;
  const typeFlags = [isPnL, isBS, isCFS].filter(Boolean).length;
  if (typeFlags === 1) {
    type = isPnL ? 'pnl' : isBS ? 'balance-sheet' : 'cash-flow';
  } else if (typeFlags > 1) {
    // Ambiguous (e.g., "Generate P&L and balance sheet") — treat as needs-type and let user disambiguate
    type = null;
  }

  // No statement intent detected at all
  if (!type && !isGenericStmt) return null;

  // --- Period detection ---
  const periodId =
    /\bfy.?24.?25\b|\blast (financial )?year\b|\bfy.?25\b/.test(n) ? 'fy24-25' :
    /\bfy.?25.?26.?(ytd|so far|to date)|this (financial )?year|fy.?26/.test(n) ? 'fy25-26-ytd' :
    /\b(q1|first quarter).*(2026|fy.?25.?26|this year)|this quarter\b/.test(n) ? 'fy25-26-q1' :
    /\blast quarter\b|\b(q4|fourth quarter).*(2025|fy.?24.?25|last)/.test(n) ? 'fy24-25-q4' :
    /\bthis month\b|\bcurrent month\b|\bmay\b|\bmtd\b|\bas on today|as of today|today|current|now\b/.test(n) ? 'may-2026' :
    /\blast month\b|\bapril\b|\bprev(ious)? month\b/.test(n) ? 'apr-2026' :
    null;

  const period = periodId ? STATEMENT_PERIODS[periodId] : undefined;

  // --- Branch on what we got ---
  if (type && period) return { kind: 'resolved', type, period };
  if (type && !period) return { kind: 'needs-period', type };
  if (!type && period) return { kind: 'needs-type', period };
  if (!type && !period && isGenericStmt) return { kind: 'needs-type' };  // ask type first, period second
  return null;
}
```

`STATEMENT_PERIODS` is a record `Record<string, StatementPeriod>` exported from `statementsMockData.ts`.

---

## Part 3b — Clarification response builders

Inside `src/data/statementsMockData.ts` (or a new `src/data/statementsClarifications.ts`), add helpers that synthesise a Krishan response for each clarification case. These return `V3CannedResponse` objects with `replyChips` populated.

```ts
import type { V3CannedResponse, StatementType, StatementPeriod } from '../v3Types';
import { STATEMENT_PERIODS } from './statementsMockData';

export function clarifyType(period?: StatementPeriod): V3CannedResponse {
  const periodSuffix = period ? ` for ${period.label}` : '';
  return {
    id: `clarify_stmt_type_${period?.id ?? 'nop'}`,
    match: [],
    agentId: 'krishan',
    headline: `Which statement would you like${periodSuffix}?`,
    body: 'I can pull a P&L, a Balance Sheet, or a Cash Flow Statement.',
    replyChips: period
      ? [
          `Generate the P&L for ${period.label}`,
          `Pull the Balance Sheet as on ${period.asOnDate ?? period.label}`,
          `Show the Cash Flow Statement for ${period.label}`,
        ]
      : [
          'Generate the P&L',
          'Pull the Balance Sheet',
          'Show the Cash Flow Statement',
        ],
  };
}

export function clarifyPeriod(type: StatementType): V3CannedResponse {
  const typeLabel = type === 'pnl' ? 'P&L' : type === 'balance-sheet' ? 'Balance Sheet' : 'Cash Flow Statement';
  // For Balance Sheet, only as-on periods make sense; the other types use period periods. Filter accordingly:
  const periods = Object.values(STATEMENT_PERIODS).filter(p =>
    type === 'balance-sheet' ? p.type === 'as-on' || p.type === 'mtd' : true
  );
  return {
    id: `clarify_stmt_period_${type}`,
    match: [],
    agentId: 'krishan',
    headline: `For which period?`,
    body: `I have ${typeLabel} statements ready for these periods. Pick one — or type a specific month/quarter and I'll check.`,
    replyChips: periods.map(p =>
      type === 'pnl' ? `Generate the P&L for ${p.label}` :
      type === 'balance-sheet' ? `Pull the Balance Sheet as on ${p.label}` :
      `Show the Cash Flow Statement for ${p.label}`
    ),
  };
}
```

Each `replyChip` is a fully-formed query string. Clicking the chip submits it as a new user message, which then matches via the parser's normal path (returning `{ kind: 'resolved', ... }`).

---

## Part 4 — Statement chat triggers

In `src/data/cannedResponses.ts`, **do not add 6 separate canned entries** (one per period). Instead, add **2 dynamic entries** (one for P&L, one for BS) and resolve them at match time via the period parser.

In `matchV3Question.ts`, add a pre-pass **before** the existing canned-response match:

```ts
import { parseStatementQuery } from './parseStatementPeriod';
import { getStatementResponse } from '../data/statementsMockData';
import { clarifyType, clarifyPeriod } from '../data/statementsClarifications';

export function matchV3Question(input: string, currentMention?: AgentId): V3CannedResponse | null {
  // Pre-pass — statement queries (P&L / BS / CFS)
  const stmt = parseStatementQuery(input);
  if (stmt) {
    switch (stmt.kind) {
      case 'resolved':
        return getStatementResponse(stmt.type, stmt.period);
      case 'needs-type':
        return clarifyType(stmt.period);
      case 'needs-period':
        return clarifyPeriod(stmt.type);
    }
  }

  // ...existing exact + regex + tie-breaker logic...
}
```

`getStatementResponse(type, period)` returns a fully-formed `V3CannedResponse` with `agentId: 'krishan'`, headline like `"P&L for ${period.label}"`, an inline body summary ("Net profit ₹62.4 L on ₹4.18 cr revenue — margin 14.9%, up 80 bps QoQ"), and `artifact: { kind: 'statement', ... }` with the period's data. For the Cash Flow Statement, the body summary should call out the net cash movement ("Operating cash +₹78 L, investing −₹12 L, financing −₹4 L — net +₹62 L for the period").

Also seed **chip-triggers** in `cannedResponses.ts` so the suggested chips include:
- `"Generate the P&L for last quarter"` (already in v2 library)
- `"Pull the balance sheet as on today"` (already in v2)
- `"Show the Cash Flow Statement for last quarter"` (new — CFS surfacing)
- `"What was our profit last month?"` (new)
- `"Show me the P&L for this quarter"` (new)

These chip labels feed back into the matcher just like any typed query — the matcher's pre-pass picks them up and resolves to the rendered statement.

---

## Part 5 — Statement renderer component

Create `src/components/ArtifactStatement.tsx`. This is the largest visual addition.

The same component renders all three statement types — the `sections` array drives the layout, so the only differences between P&L, BS, and CFS are the section titles, the sub-line ("For the quarter ended…" vs "As at…" vs "For the quarter ended…"), and the dropdown filters (BS only offers `as-on` periods; P&L and CFS offer period periods).

**Layout — desktop (example: P&L):**

```
┌────────────────────────────────────────────────────────────────────┐
│  Statement of Profit and Loss                              [⋮]      │
│  For the quarter ended 30 June 2026                                 │
│  ─────────────────────────────────────────────────────────────────  │
│  Period: [Q1 FY25-26 ▼]    Compare with: [Q4 FY24-25 ▼]              │
│  ─────────────────────────────────────────────────────────────────  │
│                                          Q1 FY25-26    Q4 FY24-25   │
│  Revenue                                  ₹ in lakhs    ₹ in lakhs  │
│   Sales — Amazon                              104           96   ↑8% │
│   Sales — Flipkart                             86           82   ↑5% │
│   Sales — Myntra                               58           71   ↓18%│
│   Sales — Meesho                               18           14   ↑29%│
│   Sales — Shopify (D2C)                       152          138   ↑10%│
│   Revenue from operations                     418          401   ↑4% │
│   Other income                                  2            2     — │
│   Total income                                420          403   ↑4% │
│  ...                                                                 │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  [ Download CSV ]   [ Save to Reports ]   [ View as Excel ]          │
└────────────────────────────────────────────────────────────────────┘
```

**Cash Flow Statement variation.** Same layout. Negative amounts (cash outflows) render with a leading `(` `)` notation in accounting convention — e.g., `(12)` instead of `-12`. Subtotal rows for the three section totals (A, B, C) and the net change render with extra emphasis: `text-base font-semibold border-t border-slate-300`. The ultimate "Cash and equivalents at end of period" gets `text-base font-bold border-t-2 border-slate-400`.

**Component anatomy:**

- **Header block.** Title (`Statement of Profit and Loss` or `Balance Sheet`), sub-line (`For the quarter ended 30 June 2026` or `As at 30 April 2026`), `font-semibold text-slate-900`. Sub-line `text-sm text-slate-500`.
- **Period selectors.** Two `<select>` dropdowns (period + compare-with). Changing either re-renders the statement against the new pair. Selector source: `Object.values(STATEMENT_PERIODS)` filtered to the same statement type. For BS, only `as-on` periods. Default compare-with: the prior period from the same series (so quarter compares with prior quarter, FY with prior FY).
- **Table body.** Section-grouped:
  - Each section has a small header row in `bg-slate-50 font-semibold text-slate-700 uppercase text-[11px] tracking-wide` spanning all columns.
  - Line items: 3 columns — Label (flex, left), Current period (right-aligned, monospaced numerals via `tabular-nums`), Prior period (right-aligned, `text-slate-500`).
  - Variance column appears only if `priorPeriod` is set — variance shown as `↑12%` (green `text-emerald-600`) or `↓5%` (red `text-rose-600`) or `—` (slate, for no change). Right-aligned in a 4th narrow column.
  - Subtotals: `font-semibold text-slate-900`, top-border `border-t border-slate-200`. Bottom-line "Profit for the period" / "Total equity and liabilities" — bold + a 2px top border.
  - Indent: `pl-{indent*4}` based on `line.indent`.
- **Unit toggle.** Above the table, "Display: ₹ in lakhs / ₹ in crores / Absolute (₹)" — radio chip group. Default `lakhs` for monthly, `lakhs` for quarterly, `crores` for FY. Formatter helper:
  ```ts
  function formatAmount(v: number, unit: 'absolute' | 'lakhs' | 'crores'): string {
    if (unit === 'crores') return `₹ ${(v / 1e7).toFixed(2)} Cr`;
    if (unit === 'lakhs') return `₹ ${(v / 1e5).toFixed(1)} L`;
    return v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  ```
- **Footer actions.** Three buttons:
  - **Download CSV** — primary action, `btn-secondary`. Generates a CSV blob (see Part 6) and triggers download.
  - **Save to Reports** — `btn-secondary`. Adds the statement to a local store (Part 7) and shows a toast: "Saved to Reports."
  - **View as Excel** — `btn-tertiary` (text-link style). For prototype: open the same statement in a new browser tab or trigger the CSV download with `.xlsx` filename hint. If SheetJS is feasible, use it; otherwise CSV is acceptable.

**Empty/error state.** If `STATEMENT_PERIODS[periodId]` doesn't exist: render a small message "I have statements for these periods: …" and list available periods as chips.

**Styling rules.** Cashfree design language — sans-serif, Schedule III formal tone (not brutalist). No italic. Card wrapper: `bg-white rounded-xl border border-slate-200 p-6 max-w-full`. The whole statement bubble can extend beyond the normal chat bubble width — make the chat container `max-w-3xl` when rendering a `statement` artifact (instead of the default `max-w-md` or so for regular bubbles).

---

### Part 5b — Reply-chip rendering (inside the bubble)

For the clarification flow, the chat bubble component must support rendering `response.replyChips` *inside* the bubble (not in the input area at the bottom of the chat panel). When present:

- Render a horizontal flex-wrap row of chip buttons below the bubble body and above any footer actions.
- Chip styling: `px-3 py-1.5 rounded-full border border-purple-200 bg-white text-purple-700 text-xs hover:bg-purple-50 transition cursor-pointer`.
- Clicking a chip submits the chip text as a new user message (call the same `onSubmit` handler the input field uses). The chip text *is* the full disambiguated query — so submitting it triggers the parser's normal path, which returns `kind: 'resolved'` and renders the statement.
- After the user clicks a chip, the original clarification bubble stays in the chat history (Krishan's question remains visible above the new user message), the user's chip-text appears as a user bubble, and Krishan's resolved statement bubble appears below.

For statement *resolved* responses (where `artifact: { kind: 'statement', ... }` is present), `replyChips` is typically empty — but the renderer should still handle the case where both are present (e.g., a follow-up bubble after a statement could offer "Generate the BS too?" / "Show the previous quarter").

---

## Part 6 — CSV download

In `ArtifactStatement.tsx`, implement CSV download natively (no library):

```ts
function downloadCSV(stmt: ArtifactStatement) {
  const lines: string[] = [];
  lines.push(`"${stmt.statementType === 'pnl' ? 'Statement of Profit and Loss' : 'Balance Sheet'}"`);
  lines.push(`"${stmt.asOfLabel ?? `For period: ${stmt.period.label}`}"`);
  lines.push('');
  lines.push(['Line item', stmt.period.label, stmt.priorPeriod?.label ?? '', 'Variance %'].map(csvCell).join(','));
  for (const section of stmt.sections) {
    lines.push(csvCell(section.title));
    for (const line of section.lines) {
      const cur = line.amount;
      const prev = stmt.priorAmounts?.[line.label];
      const variance = prev != null && prev !== 0 ? `${((cur - prev) / prev * 100).toFixed(1)}%` : '';
      lines.push([line.label, cur, prev ?? '', variance].map(csvCell).join(','));
    }
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stmt.statementType}_${stmt.period.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}
```

For Excel: if SheetJS (`xlsx` package) is already a dependency, use it; otherwise rename the CSV filename to `.xlsx` (Excel opens CSVs transparently — acceptable for the prototype). Don't add new dependencies just for this.

---

## Part 7 — Save to Reports

The "Save to Reports" button persists the statement to Krishan's Reports tab. Implementation:

1. Create `src/state/savedReportsStore.ts` — a lightweight singleton store backed by `localStorage`:
   ```ts
   const KEY = 'cw_saved_reports_v1';
   export type SavedReport = {
     id: string;             // generated UUID or `${type}_${periodId}_${ts}`
     savedAt: string;        // ISO
     type: StatementType;
     periodLabel: string;
     statement: ArtifactStatement;
   };
   export function getSavedReports(): SavedReport[] { ... }
   export function saveReport(s: SavedReport): void { ... }
   export function removeReport(id: string): void { ... }
   ```
2. Hook into Krishan's office → Reports tab (`src/components/AgentOffice.tsx` or wherever the Reports tab content lives). Render saved reports as a list of cards above any existing static report content:
   - Card shows: title, period, saved date, "Open" button (re-renders the statement in a side drawer or right-pane), "Remove" link.
   - Empty state: "Reports you save from chat will appear here. Try asking 'Generate P&L for last quarter'."
3. Clicking "Open" on a saved report re-renders the `ArtifactStatement` component in the Reports tab content area (not in chat). This is essentially the same component reused in a non-chat context.

---

## Part 8 — Tie-in to existing canned-response library

The 4 existing v2-ported entries that overlap with this feature should remain but defer to the new generator:
- `'q3_pnl_quarter'` (`"Generate the P&L for last quarter"`) — the matcher's statement pre-pass catches this naturally; no change needed to the canned entry, but the `headline`/`body`/`artifact` fields on it will never render (the pre-pass returns a generated entry first). Optionally drop the static entry to avoid confusion.
- `'balance_sheet_today'` (`"Pull the Balance Sheet as on today"`) — same.

Keep these canonical questions as chips so the user can discover the capability; the pre-pass resolves them.

---

## Part 9 — Acceptance criteria

**Resolution (clear queries):**
1. `"Generate the P&L for last quarter"` → Krishan returns a full Schedule III P&L for Q4 FY24-25, comparison column showing Q3 FY24-25.
2. `"Show me the balance sheet as on today"` → BS dated 30 April 2026 (MTD close), comparison column showing 31 March 2026.
3. `"Show the Cash Flow Statement for Q1"` → CFS for Q1 FY25-26 with operating / investing / financing sections and a closing-cash subtotal that ties to the same-period BS.
4. `"What's our profit this quarter?"` → Q1 FY25-26 P&L with QTD note.
5. `"Generate P&L for last FY"` → full FY24-25 P&L.

**Clarification (ambiguous queries):**
6. `"Generate a financial statement"` → Krishan responds with the bubble "Which statement would you like — P&L, Balance Sheet, or Cash Flow?" and 3 reply chips. Clicking any chip submits the disambiguated query, resolves to a statement, and renders it.
7. `"Pull the P&L"` → Krishan responds with "For which period?" and 6 reply chips (one per available P&L period). Clicking any chip resolves to the rendered statement.
8. `"Cash flow"` → same as #7 but for CFS.
9. `"Show me the balance sheet"` → "For which date?" with as-on date chips. (BS dropdowns must only offer as-on / MTD periods.)
10. `"Generate financials for last quarter"` → Krishan asks the type question (`"Which statement — P&L, BS, or Cash Flow — for Q4 FY24-25?"`). The chips pre-fill the known period.
11. Clarification bubbles render the reply chips *inside the bubble* (not in the input-area chip strip).

**Statement renderer:**
12. Period selector and compare-with dropdowns switch numbers without re-running the query.
13. Unit toggle (lakhs / crores / absolute) re-formats all amounts; subtotals stay correct.
14. Variance % column displays with ↑/↓ + color coding; "—" for zero-change rows.
15. CFS renders negative amounts in accounting `(parentheses)` notation and bolds the A/B/C subtotals + ultimate closing cash.

**Cross-statement consistency (the credibility bar):**
16. For a given period, PBT on the P&L = PBT on the CFS opening line. Document this in code comments.
17. For a given period T, CFS closing cash = BS "Cash and bank balances" as at T. CFS opening cash = BS cash as at T−1.
18. CFS: Net of (A + B + C) = closing cash − opening cash.
19. BS: total assets = total equity and liabilities.
20. P&L subtotals sum from their line items (Revenue from operations = sum of channel sales; Total income = Revenue from operations + Other income; Profit for the period = PBT − Tax expense).

**Outputs:**
21. **Download CSV** downloads a properly-formatted CSV with line items, header rows, blank-row separators, and the variance column. CFS exports the parentheses negatives as `-` in the CSV (standard).
22. **Save to Reports** persists to `localStorage`, shows a toast, and the report appears in Krishan's office → Reports tab.
23. Clicking **Open** on a saved report re-renders the statement in the Reports view (not in chat).

**Styling and platform:**
24. Statement bubbles render at `max-w-3xl`; on mobile they fit the viewport with horizontal scroll on the table only.
25. Cashfree design language preserved — no italic, no brutalist patterns, `tabular-nums` only on amount columns.
26. `npm run dev` builds cleanly with no TS errors.

---

## Part 10 — Suggested execution order

1. **Part 1 (types)** — including the `cash-flow` type and `replyChips` field.
2. **Part 2 (mock data)** — build the Q1 FY25-26 trio (P&L → CFS → BS) first so cross-statement tie-out is locked in. Then scale to the other periods.
3. **Part 5 (renderer)** end-to-end with the Q1 P&L as the first smoke test, then verify CFS and BS render correctly from the same component.
4. **Part 3 (parser) + Part 3b (clarification helpers) + Part 4 (matcher pre-pass)** — wire the chat triggers including the clarification branches.
5. **Part 5b (reply-chip rendering)** — make the clarification flow interactive.
6. **Part 6 (CSV) + Part 7 (Save to Reports)** — utility layer.
7. **Part 8 (dedup)** — clean up overlapping canned entries.

Verify acceptance criteria after each part. Cross-statement consistency (criteria 16–20) is the most important quality bar — get one period's trio tied out before fanning out to other periods.
