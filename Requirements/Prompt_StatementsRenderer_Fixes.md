# Cursor prompt — Fix P&L / BS / CFS renderer formatting

The statements renderer (`ArtifactStatement.tsx`) has six visible bugs from the latest screenshot. Targeted fixes below. No new features.

---

## Bug 1 — Missing statement title

**Current.** The header reads only "For period May 2026 (MTD)" — there's no main title.

**Fix.** Add a bold title row *above* the period sub-line:

```tsx
<div className="mb-1 text-base font-semibold text-slate-900">
  {statementTitle(stmt.statementType)}
</div>
<div className="text-sm text-slate-500">
  {periodSubline(stmt)}
</div>
```

Helpers:

```ts
function statementTitle(t: StatementType): string {
  switch (t) {
    case 'pnl': return 'Statement of Profit and Loss';
    case 'balance-sheet': return 'Balance Sheet';
    case 'cash-flow': return 'Cash Flow Statement';
  }
}

function periodSubline(stmt: ArtifactStatement): string {
  if (stmt.statementType === 'balance-sheet') {
    return stmt.asOfLabel ?? `As at ${stmt.period.asOnDate ?? stmt.period.label}`;
  }
  return `For the period ${stmt.period.label}`;
}
```

---

## Bug 2 — Period IDs leaking into column headers (`apr-2025` instead of `Apr 2025`)

**Current.** The prior column header renders `apr-2025` — that's the `StatementPeriod.id` field, not the human label.

**Fix.** Use `period.label` everywhere in rendered UI. Search the file for any reference to `period.id` outside of map keys, CSV filenames, and React keys, and replace with `period.label`. Common bad sites:

- The prior-period column header in the `<thead>`
- The "Compare with" dropdown options (use `<option value={p.id}>{p.label}</option>`)
- The "Period" dropdown options (same pattern)

Also: while you're here, the mock data should not include lowercase hyphenated labels. Spot-check `statementsMockData.ts` and confirm every `StatementPeriod.label` is title-case human text: `"May 2026 (MTD)"`, `"Apr 2026"`, `"Apr 2025"`, `"Q1 FY25-26 (Apr–Jun 2026)"`, `"FY 2024-25"`, etc.

---

## Bug 3 — Variance is identical on every row (11.1%)

**Current.** Every row shows ↑11.1%. This is because prior amounts are being computed as `current × 0.9` uniformly, so variance always lands at `(c − 0.9c) / 0.9c = 11.1%`.

**Fix.** Prior amounts must come from `stmt.priorAmounts[lineLabel]` (a record populated in the mock data), **not** computed from current. In `statementsMockData.ts`, every period's mock object must define `priorAmounts` with realistic per-line variance — not a uniform scale.

For Native-Glow-scale numbers, use this guidance:

- Channel mix shifts: Amazon ↑8%, Flipkart ↑5%, Myntra ↓18% (the bleeder), Meesho ↑29% (small base, growing), Shopify ↑10%.
- Cost lines: COGS up ~6% (less than revenue → margin expanding slightly), Marketing up ~12% (overspend), Logistics up ~9% (volume), Marketplace fees up ~4% (mix shift to lower-commission channels).
- Bottom line: PAT up 4–7% if revenue is up ~6%.

These are example heuristics — the point is the variance column must show a *distribution* of values (red/green/flat), not one number repeated.

Document in code comments next to each `priorAmounts` block: `// Variances tuned to surface the Myntra-margin narrative.`

---

## Bug 4 — Column headers cramped, wrapping, no clear column structure

**Current.** "Line item" is on the left as a single column; "May 2026 (MTD)", "Apr 2025", and "Var %" are smushed into the right side, with the current-period header wrapping to two lines.

**Fix.** Use a fixed-width column layout. The table is a 4-column grid (when comparison is on) or 2-column (when off):

```tsx
<table className="w-full text-sm tabular-nums">
  <colgroup>
    <col />                                  {/* Line item — flex */}
    <col className="w-[140px]" />            {/* Current period */}
    {hasComparison && <col className="w-[140px]" />}  {/* Prior period */}
    {hasComparison && <col className="w-[80px]" />}    {/* Var % */}
  </colgroup>
  <thead className="border-b border-slate-200">
    <tr>
      <th className="text-left text-xs font-semibold text-slate-600 py-2">Line item</th>
      <th className="text-right text-xs font-semibold text-slate-900 py-2 whitespace-nowrap">{stmt.period.label}</th>
      {hasComparison && (
        <>
          <th className="text-right text-xs font-semibold text-slate-500 py-2 whitespace-nowrap">{stmt.priorPeriod!.label}</th>
          <th className="text-right text-xs font-semibold text-slate-600 py-2">Var %</th>
        </>
      )}
    </tr>
  </thead>
  ...
</table>
```

Key points:
- `whitespace-nowrap` on the period header cells so labels like "May 2026 (MTD)" don't wrap.
- Fixed 140px width for amount columns ensures alignment across rows.
- 80px for variance column (just enough for "↑99.9%").
- `tabular-nums` on the table so numerals align column-wise.

If the bubble is too narrow on small screens, wrap the entire `<table>` in `<div className="overflow-x-auto">` so the table scrolls horizontally without breaking column structure.

---

## Bug 5 — "Compare with: None" but prior column still renders

**Current.** Dropdown shows "None" but the prior period column is showing anyway. Either the dropdown isn't controlling render, or "None" wasn't supposed to be in the list.

**Fix — two parts.**

**5a. Default Compare-with to the natural prior period**, not None. When a P&L statement loads, default `compareWith` state to the period's natural predecessor:
- For monthly periods: same month previous year (Apr 2026 → Apr 2025; May 2026 (MTD) → Apr 2025 — closest comparable month)
- For quarterly: prior quarter (Q1 FY25-26 → Q4 FY24-25)
- For FY: prior FY

Wire this default in the component state initializer:

```ts
const [compareWith, setCompareWith] = useState<string>(stmt.priorPeriod?.id ?? 'none');
```

**5b. When the user explicitly selects "None"**, hide the prior and variance columns. Compute `hasComparison`:

```ts
const hasComparison = compareWith !== 'none';
const priorPeriodObj = hasComparison ? STATEMENT_PERIODS[compareWith] : undefined;
const priorAmounts = priorPeriodObj ? stmt.priorAmounts : undefined;
```

Pass these into the table so the prior + variance `<th>` and `<td>` cells only render when `hasComparison` is true. Variance column should never render alone (no variance without a comparison).

---

## Bug 6 — Header block is heavy

**Current.** Title (will be added in Bug 1) → period sub-line → "Period" dropdown row → "Display" toggle row. Each on its own line, eating vertical space before the table appears.

**Fix.** Compact the header into a single 2-row block.

Row 1 — Title and sub-line (Bug 1 fixes this).

Row 2 — Controls in a horizontal flex row, wraps gracefully on narrow widths:

```tsx
<div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 mb-4">
  <div className="flex items-center gap-2">
    <label className="text-xs text-slate-500">Period</label>
    <Select value={periodId} onChange={setPeriodId}>...</Select>
  </div>
  <div className="flex items-center gap-2">
    <label className="text-xs text-slate-500">Compare with</label>
    <Select value={compareWith} onChange={setCompareWith}>
      <option value="none">None</option>
      {availablePriorPeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
    </Select>
  </div>
  <div className="flex items-center gap-2 ml-auto">
    <label className="text-xs text-slate-500">Display</label>
    <UnitToggle value={unit} onChange={setUnit} />
  </div>
</div>
```

The unit toggle (lakhs/crores/absolute) sits to the right via `ml-auto`. On narrow widths, the flex-wrap drops it to a second line cleanly.

---

## Acceptance criteria

1. Statement title ("Statement of Profit and Loss" / "Balance Sheet" / "Cash Flow Statement") renders bold above the period sub-line.
2. Prior column header reads `Apr 2025` (human label), not `apr-2025` (period id). Verified for at least 3 different prior periods across P&L / BS / CFS.
3. Variance % column shows a *distribution* of values per row — not a uniform 11.1%. Check by eye that at least 4 distinct variance values appear in the visible rows of any one P&L.
4. Column headers do not wrap. "May 2026 (MTD)" sits on a single line. Amount columns are 140px fixed; var % column is 80px.
5. Numbers align column-wise via `tabular-nums`. Each row's amount cells sit at the same horizontal position.
6. When "Compare with" is set to "None", the prior and variance columns disappear cleanly (no empty cells, no headers).
7. When the statement first loads, "Compare with" defaults to the period's natural prior (not "None").
8. The header block (title + sub-line + controls) takes at most ~96px vertical space before the table starts.
9. Bubble is responsive on narrow widths — the table scrolls horizontally inside `overflow-x-auto` without breaking the column alignment.
10. Cashfree design language preserved — no italic, no brutalist patterns, all styling via the existing tokens.
11. `npm run dev` builds cleanly; no TypeScript errors.

---

## Build order

Bug 4 (column layout) → Bug 5 (compare-with logic) first — these are the structural fixes. Then Bug 1 (title) → Bug 6 (header compaction) → Bug 2 (label vs id) → Bug 3 (mock data variance). After each bug fix, regenerate the same P&L view and confirm visually.
