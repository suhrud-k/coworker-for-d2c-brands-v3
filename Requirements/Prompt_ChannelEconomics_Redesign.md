# Cursor Prompt: Redesign the page as "Channel Economics"

Rebuild the `ProfitabilityScreen` component in `src/App.tsx` (currently around line 665, the page rendered when the user clicks "Channels P&L" in the sidebar). Rename the page to **Channel Economics**. Restructure the content top-to-bottom into a single coherent funnel that lets the founder land on a channel decision in 60 seconds and the controller drill all the way to a sub-line of a marketplace charge.

Every filter, tab, toggle, button, and row must be interactive — no decorative chrome.

---

## 1. RENAMES — preserve route key, change everything user-visible

Keep the internal `Tab` value as `'pnl'` (it's referenced in 9 places — touching them is unnecessary). Only the user-facing label and the component name change.

- Sidebar item label `"Channels P&L"` → **`"Channel Economics"`** (line 2535).
- `<SectionHeader title="...">` → **`title="Channel Economics"`** (line 680).
- `<SectionHeader subtitle="...">` → **`subtitle="Which channels make us money, and where the leaks are"`** (line 681).
- Component name `ProfitabilityScreen` → **`ChannelEconomicsScreen`**. Update the `case 'pnl': return <ChannelEconomicsScreen />` reference at line 2470.

No changes needed to `Tab` union, route map in chat panel, or any other route-handling code.

---

## 2. PAGE STRUCTURE (top to bottom, in this order)

The page becomes a five-section funnel inside the existing `<motion.div>` container. Each section is a `<Card>` (or a group of cards). The `<SectionHeader>` stays at the top with a single date-range pill group as its right-side action (Today · This Week · **This Month** (default) · This Quarter · Custom).

```
SectionHeader: "Channel Economics" + date range pills
  ↓
1. Channel scorecard               (the founder's 60-second view)
  ↓
2. Insights strip                  (what changed and why)
  ↓
3. Detailed channel P&L            (channel switcher → Moneyflo-style expandable table)
  ↓
4. SKU contribution leaderboard    (top 10 SKUs for the selected channel)
  ↓
5. Category mix                    (small donut)
```

Remove the existing "EBITDA Estimate / Gross Margin Rate / Net Cash Retention" stat strip — those are consolidated metrics that don't help with the channel-mix decision. They get replaced by the scorecard.

Remove the existing "Unit Economics Explorer" table (channels-as-columns) — it gets replaced by the channel-switcher detailed P&L.

---

## 3. SECTION 1 — CHANNEL SCORECARD

**Purpose.** One row per channel, ranked by contribution margin. The founder scans this in 5 seconds and decides if they need to drill.

**Component.** `<Card title="Channel scorecard" subtitle="Sorted by contribution margin · This month">` containing a table.

**Columns.** Channel · Orders · GMV · Net Sales · Contribution Margin (₹) · Margin % · WoW Δ · Action.

**Behaviour.**
- Each row is clickable. Clicking sets the page-level `selectedChannel` state to that channel. The detailed P&L, SKU leaderboard, and category donut below all re-render with that channel's data. The clicked row gets a subtle `bg-purple-50` highlight and a left border in `bg-primary` (4 px).
- The currently-selected channel row should be visually pinned at the top (or the first row by default = Shopify, since it's the leader).
- Margin % cell colour: `text-success` if > 15%, `text-warning` if 5–15%, `text-error` if < 5%.
- WoW Δ uses the existing `<DeltaArrow>` component.
- The "Action" column shows a `btn-tertiary` "View P&L →" link that scrolls down to Section 3 with the same channel selected.

**Sample data** (Native Glow, week of May 18, 2026):

| Channel | Orders | GMV | Net Sales | Margin ₹ | Margin % | WoW |
|---|---|---|---|---|---|---|
| Shopify | 3,847 | ₹1.24 Cr | ₹1.18 Cr | ₹27.7 L | 22.4% | +1.2 |
| Amazon | 5,231 | ₹1.18 Cr | ₹1.04 Cr | ₹19.8 L | 16.8% | −0.4 |
| Flipkart | 4,109 | ₹98.0 L | ₹86.0 L | ₹10.9 L | 11.2% | −2.1 |
| Meesho | 1,847 | ₹16.0 L | ₹14.0 L | ₹0.98 L | 6.1% | −1.1 |
| Myntra | 2,156 | ₹62.0 L | ₹54.0 L | ₹2.10 L | 3.4% | −4.8 |

Channel name cell: include the channel chip (small coloured dot + name) using existing channel colours — Shopify `#5E8E3E`, Amazon `#FF9900`, Flipkart `#2874F0`, Meesho `#9F2089`, Myntra `#FF3F6C`.

---

## 4. SECTION 2 — INSIGHTS STRIP

**Purpose.** Three single-sentence "what changed and why" callouts that surface from the data — the same things the chat would generate if asked "what changed this week?"

**Component.** Three `<Card>` tiles in a 3-column grid (stacks on narrow viewports). Each tile is clickable and deep-links to the relevant page via `onNavigate`.

**Tile structure.** A small icon at the top-left (success / warning / critical), the sentence in 14 px regular, and an "Open →" `btn-tertiary` link at the bottom.

**Sample insights:**

1. *Critical (error icon, `bg-error-50/30` accent).* **"Myntra margin compressed by 4.8 pts WoW — return rate spiked to 36% from 28% on Holi sale orders."** → `onNavigate('returns')` · "Open Returns & Claims →"
2. *Action (warning icon, `bg-warning-50/30` accent).* **"Flipkart commission overcharged by ₹3,247 on apparel < ₹500 — claim eligible until May 26."** → `onNavigate('reconciliation')` · "Open Reconciliation →"
3. *Positive (success icon, `bg-success-50/30` accent).* **"Shopify margin up 1.2 pts driven by COD return rate dropping to 18% from 22%."** → `onNavigate('returns')` · "Open Returns & Claims →"

Insights are hard-coded for now (no live generation). The pattern proves the surface; later they'll come from the recon engine.

---

## 5. SECTION 3 — DETAILED CHANNEL P&L (the centrepiece)

**Component.** `<Card>` wrapping a tab strip on top and an expandable P&L table below.

### 5.1 Channel switcher tabs

Six pill tabs at the top of the card: **Shopify · Amazon · Flipkart · Myntra · Meesho · All channels**.

Default selection comes from the page-level `selectedChannel` state (driven by the scorecard click). Clicking a tab updates that state and re-renders the table below.

Tab styling: active = `bg-purple-50 text-primary font-semibold`, inactive = `text-gray-500 hover:text-gray-900`, plus a 2 px `border-b-2 border-primary` under the active tab. Same pattern as Reconciliation tabs.

### 5.2 Filter row below the tabs

Three controls in a row, left-to-right:
- **GST mode toggle**: Inc GST / Exc GST / Both (pill group; updates the columns visible).
- **Compare WoW** checkbox: when on, adds a small `+/-%` WoW column next to the current values.
- **Download Report** button (right-aligned, `btn-secondary` with `Download` icon). Clicking opens a dropdown with PDF · Excel · CSV. Selecting any option simulates a 600 ms processing state and then shows a success toast "Report exported · click to download" — no actual file, this is demo.

### 5.3 Metadata strip

A thin text row above the table:
- "17 unreconciled orders excluded"
- "Ads synced till May 18, 2026 · 4:12 PM"

Both in `text-[12px] text-gray-500` separated by `·`.

### 5.4 The expandable P&L table

Columns depend on the GST mode:
- **Inc GST mode**: Category · Amount (inc GST) · % of Net Sales
- **Exc GST mode**: Category · Amount (exc GST) · % of Net Sales
- **Both mode**: Category · Amount (inc GST) · Amount (exc GST) · % of Net Sales

If Compare WoW is on, append a WoW Δ column at the right.

Header row: `bg-gray-50` background, `text-[12px] font-medium uppercase tracking-wider text-gray-500` header text.

Body rows: 14 px regular for body, `font-bold` for subtotal rows (Net Sales, Net Revenue), light `bg-success-50/40` row tint for subtotal rows. Negative values in `text-error`. Each row has a hover `bg-purple-50/30`.

Expand toggle: small `+` / `−` icon at the left of expandable rows (parent categories). `ChevronRight` / `ChevronDown` from lucide is also fine. Animate the expand with a `max-height` transition.

Info icon (`<InfoIcon tooltip="...">`) next to each row label. Hover shows a 1-line explanation in a small white card.

### 5.5 The full Moneyflo taxonomy — sample data for Flipkart (this month)

Render exactly these rows in this order. Sub-rows are indented and only visible when the parent is expanded.

| # | Row label | Type | inc GST | exc GST | % of Net Sales |
|---|---|---|---|---|---|
| 1 | Listing GMV | leaf | ₹3,86,680 | — | — |
| 2 | Total Discount | parent (expandable) | ₹11,492 | — | — |
| 2a | &nbsp;&nbsp;&nbsp;Discount (Self) | child | −₹120 | — | — |
| 2b | &nbsp;&nbsp;&nbsp;Discount (Platform) | child | ₹11,372 | — | — |
| 3 | **Net Sales** | subtotal | **₹3,86,560** | **₹3,28,134** | **100.00%** |
| 4 | Ads Fee | parent (expandable) | ₹0 | — | 0.00% |
| 4a | &nbsp;&nbsp;&nbsp;Sponsored Product | child | ₹0 | — | 0.00% |
| 4b | &nbsp;&nbsp;&nbsp;Sponsored Brand | child | ₹0 | — | 0.00% |
| 4c | &nbsp;&nbsp;&nbsp;Sponsored Display | child | ₹0 | — | 0.00% |
| 5 | Delivered Order Charges | parent (expandable) | −₹1,56,771 | −₹1,32,913 | −40.51% |
| 5a | &nbsp;&nbsp;&nbsp;Shipping Fee | child | −₹80,449 | −₹68,177 | −20.78% |
| 5b | &nbsp;&nbsp;&nbsp;Commission | child | −₹47,854 | −₹40,554 | −12.36% |
| 5c | &nbsp;&nbsp;&nbsp;Fixed Fee | child | −₹13,979 | −₹11,847 | −3.61% |
| 5d | &nbsp;&nbsp;&nbsp;Collection Fee | child | −₹8,758 | −₹7,422 | −2.26% |
| 5e | &nbsp;&nbsp;&nbsp;Pick And Pack Fee | child | −₹5,721 | −₹4,848 | −1.48% |
| 5f | &nbsp;&nbsp;&nbsp;Reverse Shipping Fee | child | −₹77 | −₹65 | −0.02% |
| 6 | Returned Order Charges | parent (expandable) | −₹16,468 | −₹13,998 | −4.27% |
| 6a | &nbsp;&nbsp;&nbsp;Reverse Shipping Fee | child | −₹7,517 | −₹6,370 | −1.94% |
| 6b | &nbsp;&nbsp;&nbsp;Shipping Fee | child | −₹6,159 | −₹5,219 | −1.59% |
| 6c | &nbsp;&nbsp;&nbsp;Fixed Fee | child | −₹1,569 | −₹1,330 | −0.41% |
| 6d | &nbsp;&nbsp;&nbsp;Collection Fee | child | −₹1,016 | −₹861 | −0.26% |
| 6e | &nbsp;&nbsp;&nbsp;Pick And Pack Fee | child | −₹255 | −₹216 | −0.07% |
| 6f | &nbsp;&nbsp;&nbsp;Commission | child | −₹2 | −₹1 | 0.00% |
| 7 | Indirect Charges | parent (expandable) | ₹0 | — | 0.00% |
| 7a | &nbsp;&nbsp;&nbsp;Marketplace Rebates | child | ₹0 | — | 0.00% |
| 7b | &nbsp;&nbsp;&nbsp;Reimbursements | child | ₹0 | — | 0.00% |
| 7c | &nbsp;&nbsp;&nbsp;Incentive Payouts | child | ₹0 | — | 0.00% |
| 8 | **Net Revenue** | subtotal | **₹2,13,321** | **₹1,81,223** | **55.23%** |
| 9 | Average Order Value | leaf | ₹503 | ₹427 | — |
| 10 | Net Revenue per Order | leaf | ₹277 | ₹236 | 55.23% |
| 11 | Output GST | leaf | ₹58,426 | — | — |
| 12 | Input Credit (GST) | leaf | ₹26,329 | — | — |
| 13 | TDS | leaf | ₹3,281 | — | — |
| 14 | TCS | leaf | ₹3,281 | — | — |

Parent rows 5 and 6 should be expanded by default (these are the rows with most insight). Rows 2, 4, 7 start collapsed.

### 5.6 Other channels — proportional sample data

For Shopify, Amazon, Myntra, Meesho — generate the same taxonomy with proportional numbers based on each channel's net sales and margin. Use this guide:

- **Shopify** — Net Sales ₹1.18 Cr (one number; Shopify has no marketplace charges); Net Revenue ≈ 22.4% of Net Sales = ₹26.4 L; the marketplace charges sub-rows are mostly ₹0 (since Shopify is own-store). The cost lines that appear are: PG charges (Cashfree fees), shipping (via Shiprocket), and ad spend.
- **Amazon** — Net Sales ₹1.04 Cr; Net Revenue ≈ 16.8% = ₹17.5 L; marketplace charges have a different label structure (Amazon uses "Referral fee" for what Flipkart calls "Commission"). Keep the same row structure for consistency in the demo.
- **Myntra** — Net Sales ₹54 L; Net Revenue ≈ 3.4% = ₹1.84 L. Most damage: Commission and Returned Order Charges, both inflated WoW.
- **Meesho** — Net Sales ₹14 L; Net Revenue ≈ 6.1% = ₹85 K.
- **All channels** — sum of the above. This is the "comparison" view: same row labels, but values aggregated across all five.

### 5.7 Cell-level drill-to-source

Hovering any non-zero ₹ amount shows a small tooltip via `<InfoIcon>` pattern: "Sourced from Flipkart Settlement Report · synced 12 min ago · view 38 line-items →". The "view → " link is non-functional for V1 (could be wired later to open a drawer with line items).

---

## 6. SECTION 4 — SKU CONTRIBUTION LEADERBOARD

**Purpose.** Show the top 10 SKUs ranked by contribution margin on the **selected channel**. Same SKU can be highly profitable on Shopify and unprofitable on Myntra — this is the only place that asymmetry is visible.

**Component.** `<Card title="Top SKUs by contribution margin" subtitle="On Flipkart · This month">` (subtitle updates with selected channel).

**Table columns.** Rank · SKU · Category · Units sold · Net revenue · Contribution ₹ · Margin %.

**Behaviour.**
- 10 rows, sorted by Margin % desc.
- A search input above the table that filters by SKU name or category.
- A category dropdown filter ("All categories", "Skincare", "Haircare", "Bodycare").
- "View all SKUs →" `btn-tertiary` link at the bottom that opens a drawer with the full list (placeholder for V1 — drawer not built yet; this is a hook).
- Margin % cell uses the same color scale as the scorecard.

**Sample data — top 10 SKUs on Flipkart, this month:**

| # | SKU | Category | Units | Net Rev | Margin ₹ | Margin % |
|---|---|---|---|---|---|---|
| 1 | Hydrating Face Cream 50ml | Skincare | 1,247 | ₹4.82 L | ₹1.37 L | 28.4% |
| 2 | Glow Serum 30ml | Skincare | 892 | ₹3.21 L | ₹77,400 | 24.1% |
| 3 | Night Recovery Oil | Skincare | 651 | ₹2.18 L | ₹47,500 | 21.8% |
| 4 | Anti-Acne Foaming Cleanser | Skincare | 547 | ₹1.91 L | ₹38,200 | 20.0% |
| 5 | Gentle Cleanser 100ml | Skincare | 412 | ₹1.42 L | ₹25,800 | 18.2% |
| 6 | Sun Block SPF 50 | Skincare | 387 | ₹0.98 L | ₹15,800 | 16.1% |
| 7 | Vitamin C Booster | Skincare | 318 | ₹1.05 L | ₹16,800 | 16.0% |
| 8 | Hydrating Hair Mask | Haircare | 284 | ₹0.74 L | ₹9,640 | 13.0% |
| 9 | Body Butter Cocoa | Bodycare | 218 | ₹0.48 L | ₹5,280 | 11.0% |
| 10 | Scalp Repair Serum | Haircare | 196 | ₹0.52 L | ₹3,640 | 7.0% |

---

## 7. SECTION 5 — CATEGORY MIX

**Component.** A small two-column card: a donut on the left, a legend with totals on the right.

**Title.** `<Card title="Margin contribution by category" subtitle="On Flipkart · This month">` (subtitle updates with selected channel).

**Donut data (Flipkart):**
- Skincare 64% · ₹6.98 L
- Haircare 22% · ₹2.40 L
- Bodycare 14% · ₹1.52 L

Colors: Skincare = `primary`, Haircare = `purple-tint`, Bodycare = `purple-100`. Donut inner ring should show the dominant category's percentage in the centre (e.g., "64% Skincare").

---

## 8. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Date range pill group** at the page top: changes the `dateRange` state. The scorecard, P&L, SKU table, and donut all update (for V1, "update" means swap to different hard-coded data sets per range — at minimum show different headline totals).
- **Scorecard row click**: updates `selectedChannel` state. Detailed P&L, SKU leaderboard, category donut all re-render with the new channel's data.
- **Insights strip tile click**: navigates via `onNavigate(route)` to the relevant page.
- **Channel switcher tabs**: same as scorecard click — single source of truth is the `selectedChannel` state.
- **GST mode toggle (Inc / Exc / Both)**: toggles the visible columns in the detailed P&L.
- **Compare WoW toggle**: adds/removes the WoW Δ column.
- **Expandable rows**: clicking the `+`/`−` toggles the row open/closed with a smooth animation.
- **Download Report button**: opens a dropdown (PDF / Excel / CSV); selecting an option shows a brief processing state, then a success toast.
- **SKU search input**: filters the SKU list as the user types.
- **SKU category dropdown**: filters the SKU list by category.
- **"View all SKUs" link**: opens a placeholder drawer or shows a toast "All SKUs view coming soon" (V1 — non-blocking placeholder).
- **"View P&L →" link in scorecard**: scrolls page to Section 3 and selects that channel's tab.

---

## 9. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

This redesign must use only the shared primitives and design tokens. After the change, this grep within `ChannelEconomicsScreen` must return zero matches:

```
font-serif | italic (except quoted user text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar | Initialize | Execute Protocol |
"Channels P&L" anywhere user-visible
```

Use: shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<DeltaArrow>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`), and design tokens (`primary`, `navy-950`, `success`, `error`, `warning`, `gray-*`, `purple-50`, `purple-100`, `purple-tint`).

---

## 10. DELIVERABLE

A single rewritten `ChannelEconomicsScreen` component replacing `ProfitabilityScreen` in `src/App.tsx`. The change should affect only this component and four pointer-references:

1. Line 680–681 — title/subtitle.
2. Line 2470 — `case 'pnl': return <ChannelEconomicsScreen />`.
3. Line 2535 — sidebar item `label="Channel Economics"`.
4. Wherever `ProfitabilityScreen` is referenced (component name change).

Mock data can be inlined in the component or extracted to a new `src/data/channelEconomicsMockData.ts`. Either is fine.

`npm run dev` must build cleanly with no TypeScript errors.

---

*The page is doing one job: helping a multi-channel D2C founder allocate the next rupee well, and helping the controller find the leak that's costing them. Every section either shortens the path from a number to a decision, or surfaces a leak that wasn't obvious. If a control on the page doesn't serve one of those two jobs, it shouldn't be on the page.*
