# Cursor Prompt: Redesign the page as "Returns & Recovery"

Rebuild the `ReturnsScreen` component in `src/App.tsx` (currently around line 2181, the page rendered when the user clicks "Returns & Claims" in the sidebar). Rename to **Returns & Recovery**. Restructure the content into three explicit sections — **Leak / Recovery / Why** — plus a collapsible "Disputable charges" panel at the bottom that's hidden by default.

Every filter, tab, toggle, button, and row must be interactive — no decorative chrome.

---

## 1. RENAMES — preserve route key, change only user-visible labels

Keep the internal `Tab` value as `'returns'`. Only the user-facing label and component name change.

- Sidebar item label `"Returns & Claims"` → **`"Returns & Recovery"`** (line ~2571).
- `<SectionHeader title="...">` → **`title="Returns & Recovery"`** (line 2189).
- `<SectionHeader subtitle="...">` → **`subtitle="Quantify the leak, claw back what's claimable, fix what's broken"`** (line 2190).
- Component name `ReturnsScreen` → **`ReturnsRecoveryScreen`**. Update the `case 'returns': return <ReturnsRecoveryScreen />` reference at line ~2495.

No changes needed to the `Tab` union, chat route map, or any other route-handling code. Also update any `onNavigate('returns')` call sites' surrounding text/copy if they say "claims" — those still route correctly.

---

## 2. PAGE STRUCTURE (top to bottom)

The page becomes a three-section page plus a hidden panel. Replace the entire current body (KPI strip, aging chart, claims pipeline) with this structure:

```
SectionHeader: "Returns & Recovery" + date range pills (Today · This Week · This Month default · This Quarter · Custom)
  ↓
Top stat strip — 4 headline KPIs (the ones the founder reads)
  ↓
Section 1: The Leak                  (Job 1 — how much is bleeding)
  ↓
Section 2: Recovery                  (Job 2 — what's claimable)
  ↓
Section 3: Why                       (Job 3 — what's causing returns)
  ↓
Collapsible panel: Disputable charges (hidden by default, expand to reveal)
```

The page-level header keeps the date-range pill group as the right-side `SectionHeader` action.

---

## 3. TOP STAT STRIP — 4 KPIs

Four `<Card>` tiles in a 4-column grid (stacks below `md`).

| Tile | Big number | Sub | Accent |
|---|---|---|---|
| Cost of returns | **₹8.42 L** | "this month · ₹1.32 L vs last month" | error left border (4 px) |
| Recovery rate | **28.4%** | "₹1.94 L of ₹6.84 L eligible" | success or warning border based on > or < 40% |
| At risk (window closing) | **₹3.84 L** | "across 8 claims · 3 closing this week" | warning left border |
| Returns rate | **24.6%** | "weighted across all channels · +2.1 pts WoW" | navy-950 left border |

Big number = `text-[28px] font-bold text-navy-950 tabular-nums` (except Cost of returns which is `text-error`). Sub-line = `text-[12px] text-gray-500`. Use `<DeltaArrow>` for WoW comparisons where appropriate.

---

## 4. SECTION 1 — THE LEAK

**Component.** `<Card title="The leak this month" subtitle="Total cost broken down by component">` with two parts inside: a cost breakdown strip and a return-rate-by-channel table.

### 4.1 Cost breakdown — 4 sub-tiles in a row inside the card

Each sub-tile shows the cost component, its ₹ value, and what share of the leak it accounts for. Style: clean rows with a left border colored by the cost component.

| Component | This month | % of leak | Last month | Trend |
|---|---|---|---|---|
| Reverse shipping fees | ₹2.84 L | 33.7% | ₹2.41 L | +17.8% |
| Lost or damaged inventory | ₹3.12 L | 37.1% | ₹2.68 L | +16.4% |
| Commission/charges retained | ₹1.48 L | 17.6% | ₹1.21 L | +22.3% |
| Ad spend wasted on returned orders | ₹0.98 L | 11.6% | ₹0.80 L | +22.5% |
| **Total** | **₹8.42 L** | **100%** | **₹7.10 L** | **+18.6%** |

Render as a table with the total row bold-emphasised and tinted `bg-error-50/40`. Each row hover shows an `<InfoIcon>` with a tooltip explaining the component (e.g., "Reverse shipping fee = what the marketplace charged you to ship the item back from the customer").

### 4.2 Return rate by channel

Below the breakdown, a small table showing each of the 5 channels with its return rate, this month vs last month, and a trend arrow. This is essentially the "leak per channel" — which channel is hemorrhaging.

| Channel | Returns this month | Return rate | Last month | WoW Δ |
|---|---|---|---|---|
| Myntra | 786 | **36.4%** | 28.1% | +8.3 pts |
| Flipkart | 1,114 | 27.1% | 26.5% | +0.6 pts |
| Meesho | 452 | 24.5% | 23.8% | +0.7 pts |
| Amazon | 1,193 | 22.8% | 21.5% | +1.3 pts |
| Shopify | 700 | 18.2% | 22.4% | −4.2 pts |

Return rate cell coloured: `text-error` if > 30%, `text-warning` if 20–30%, `text-success` if < 20%. Show channel chips (coloured dots) before each channel name. Click a row to filter the rest of the page to that channel.

---

## 5. SECTION 2 — RECOVERY

**Component.** `<Card title="What we can claw back" subtitle="Claims pipeline and at-risk windows">` with two parts: a claims pipeline (kanban-style) and an at-risk table.

### 5.1 Claims pipeline (existing kanban, improved)

Keep the existing 4-column kanban (`Eligible → Filed → Approved → Received`) but rebuild every card with **₹ values, not just counts**. Each card in a column shows: channel chip, claim ID, ₹ amount, days in stage, and a tiny arrow to advance.

Column totals at the top of each column:
- **Eligible** — 12 claims · **₹3.72 L**
- **Filed** — 8 claims · **₹3.12 L**
- **Approved** — 5 claims · **₹1.21 L**
- **Received** — 21 claims · **₹1.94 L**

The kanban is the "money in motion" view. Drag-and-drop is not required for V1; clicking a card opens a right-side drawer with full claim detail (marketplace, original order ID, return reason, claim filed date, expected payout, actions).

### 5.2 At-risk window (separate sub-card below the kanban)

A small table titled "Claims at risk — window closing soon" listing 4–6 specific claims:

| Claim ID | Channel | Amount | Aging | Window closes | Action |
|---|---|---|---|---|---|
| FK-CLM-88412 | Flipkart | ₹84,200 | 42 days | **Sat (3 days)** | **File now** |
| FK-CLM-88719 | Flipkart | ₹62,180 | 38 days | Mon (5 days) | File now |
| AMZ-RC-29981 | Amazon | ₹54,700 | 36 days | Wed (7 days) | File now |
| MYN-CR-11248 | Myntra | ₹47,900 | 34 days | 21 days left | Review |
| FK-CLM-89014 | Flipkart | ₹41,800 | 33 days | 14 days left | Review |
| AMZ-RC-30142 | Amazon | ₹38,200 | 31 days | 11 days left | Review |

Action button is `btn-primary` when window < 7 days, `btn-secondary` otherwise. Clicking opens the same right-side drawer as the kanban claim card.

### 5.3 Rejected claims (small footer in the card)

A `text-[12px]` collapsible line at the bottom of the card: *"4 claims rejected this month (₹47,200). Top reason: 'evidence missing or insufficient'."* — click to expand into a small list with the rejection reason and a "Resubmit" action per row.

---

## 6. SECTION 3 — WHY

**Component.** `<Card title="Why are people returning" subtitle="Reasons, SKUs, geography">` with three side-by-side panels.

### 6.1 Return reasons — donut on the left

Donut showing the top reasons for returns:

| Reason | % | Volume | ₹ value |
|---|---|---|---|
| Size issue | 38% | 1,610 | ₹3.20 L |
| Quality issue | 24% | 1,017 | ₹2.02 L |
| Wrong product | 14% | 593 | ₹1.18 L |
| Didn't like | 12% | 508 | ₹1.01 L |
| Damaged in transit | 8% | 339 | ₹67 K |
| Other | 4% | 169 | ₹34 K |

Colors: primary, purple-tint, purple-100, warning, error, gray-200. Center of donut shows the dominant reason in big text ("38% Size issue").

### 6.2 Worst-returning SKUs — table on the right

10-row table titled "Top SKUs by return cost":

| # | SKU | Channel | Return rate | Lost ₹ |
|---|---|---|---|---|
| 1 | Hydrating Hair Mask | Myntra | **64%** | ₹84,000 |
| 2 | Body Butter Cocoa | Myntra | 52% | ₹38,000 |
| 3 | Glow Serum 30ml | Flipkart | 41% | ₹2.18 L |
| 4 | Anti-Acne Foaming Cleanser | Myntra | 38% | ₹47,000 |
| 5 | Sun Block SPF 50 | Amazon | 32% | ₹1.21 L |
| 6 | Night Recovery Oil | Flipkart | 31% | ₹86,000 |
| 7 | Vitamin C Booster | Amazon | 28% | ₹64,000 |
| 8 | Gentle Cleanser 100ml | Flipkart | 24% | ₹38,000 |
| 9 | Hydrating Face Cream 50ml | Shopify | 18% | ₹1.42 L |
| 10 | Scalp Repair Serum | Myntra | 17% | ₹14,000 |

Above the table: a search input (filter by SKU/channel) and a category dropdown (Skincare/Haircare/Bodycare/All). Both stateful. Return rate cell coloured by threshold.

Each row click opens a right-side drawer with SKU detail: return reason breakdown for that SKU, channel-wise return rates, suggested actions (e.g., "Sizing chart needs update on Myntra" or "Consider delisting on Myntra").

### 6.3 Channel × reason mini-heatmap (compact, below the two panels)

A small 5×6 grid showing return rates by channel × reason. Each cell is colour-tinted by intensity. Useful for spotting that "Myntra + size issue" is the dominant pattern (48% of Myntra returns are size-related, vs only 22% for Shopify).

| | Size | Quality | Wrong | Didn't like | Damaged | Other |
|---|---|---|---|---|---|---|
| Shopify | 22% | 28% | 12% | 28% | 6% | 4% |
| Amazon | 31% | 26% | 18% | 14% | 8% | 3% |
| Flipkart | 41% | 22% | 15% | 12% | 8% | 2% |
| Myntra | **48%** | 21% | 12% | 10% | 7% | 2% |
| Meesho | 38% | 28% | 14% | 11% | 6% | 3% |

Cells use a primary-tint gradient (`purple-50` → `primary`) by intensity. Hovering a cell shows the absolute count and ₹ value.

---

## 7. DISPUTABLE CHARGES PANEL (hidden by default, expandable)

**Component.** A collapsed-by-default `<Card>` with a clear "expand" affordance — a chevron next to the title that toggles visibility. Title line: `"Disputable charges — 14 orders, ₹47,290 potentially recoverable"`. Below the title, in `text-[12px] text-gray-500`: "Orders where the marketplace deducted more than the contractual rate card. Hidden by default — open to review."

When expanded, show a table of orders with mismatched marketplace deductions:

| Order ID | Channel | Type | Charged | Rate card | Overcharge | Action |
|---|---|---|---|---|---|---|
| FK-RTN-12847 | Flipkart | Reverse shipping | ₹85 | ₹65 | **₹20** | File dispute |
| FK-RTN-12918 | Flipkart | Commission (not reversed) | ₹148 | ₹0 | **₹148** | File dispute |
| MYN-RTN-8821 | Myntra | Pick-and-pack on return | ₹47 | ₹0 | **₹47** | File dispute |
| AMZ-RTN-3124 | Amazon | TCS not credited | ₹28 | ₹0 (refund) | **₹28** | File dispute |
| FK-RTN-12999 | Flipkart | Fixed fee (not reversed) | ₹19 | ₹0 | **₹19** | File dispute |
| MYN-RTN-8910 | Myntra | Reverse shipping | ₹95 | ₹70 | **₹25** | File dispute |
| ... | | | | | | |

Generate 14 rows total. Footer of the table: "Total disputable: ₹47,290 across 14 orders · **Bulk file disputes →** (btn-secondary)".

Why hidden by default: this is power-user territory. Most users won't open it, but for the recon lead, this section pays for the entire tool. The collapsed-by-default treatment signals "advanced — open when you want to do hand-to-hand combat with marketplace deductions."

State: persist the expanded/collapsed state in `localStorage` (key: `disputable_charges_expanded`) so a user who opens it once doesn't have to keep re-expanding.

---

## 8. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Date range pill group** at the page top: changes the `dateRange` state. The top KPIs, Leak section, Recovery pipeline counts, and Why-section data all update (V1: hard-coded data per range is fine).
- **Channel filter** (clicking a channel row in Section 1's return-rate table): updates a `selectedChannel` state that filters Section 2 (claims pipeline + at-risk table) and Section 3 (Why section, SKU list, reasons donut).
- **Cost breakdown info icons**: hover shows the cost-component explanation.
- **Claims pipeline cards**: clicking any kanban card opens a right-side drawer (480 px) with the claim detail.
- **At-risk table action buttons**: `File now` and `Review` both open the same right-side drawer.
- **Rejected claims footer**: clicking "expand" reveals a 4-row inline list with rejection reasons and a Resubmit action per row.
- **Reasons donut hover**: shows reason + count + ₹ value tooltip.
- **SKU leaderboard search**: filters as the user types.
- **SKU category dropdown**: filters by category (All / Skincare / Haircare / Bodycare).
- **SKU row click**: opens a right-side drawer with SKU return analytics.
- **Heatmap cell hover**: shows the absolute count and ₹ value for that channel × reason combination.
- **Disputable charges expand/collapse**: persists in `localStorage`. The expanded state shows the full 14-row table.
- **Bulk file disputes button** (inside the expanded disputable panel): simulates a 1.2 s processing state and shows a success toast "14 disputes filed. Expected resolution: 14 days."
- **"File dispute" button per row** in the disputable table: simulates a 600 ms processing state and shows a row-level success state ("Filed · Tracking ID DISP-…").

---

## 9. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

Same compliance rules as previous redesigns. After this change, this grep within `ReturnsRecoveryScreen` must return zero matches:

```
font-serif | italic | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar | Initialize | Execute Protocol |
"Returns & Claims" | "Apply for Claims"
```

Use only: shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<DeltaArrow>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`), and design tokens (`primary`, `navy-950`, `success`, `error`, `warning`, `gray-*`, `purple-50`, `purple-100`, `purple-tint`).

---

## 10. DELIVERABLE

A single rewritten `ReturnsRecoveryScreen` component replacing `ReturnsScreen` in `src/App.tsx`. The change affects only this component and these pointer-references:

1. Line 2189–2190 — title/subtitle.
2. Line 2192 — replace the "Apply for Claims (12)" button (it was misleading — claims aren't applied for in bulk from this page). Either remove or replace with a `btn-secondary` "Export claims report" with a Download icon.
3. Line ~2495 — `case 'returns': return <ReturnsRecoveryScreen />`.
4. Line ~2571 — sidebar item `label="Returns & Recovery"`.

Mock data can be inlined or extracted to `src/data/returnsRecoveryMockData.ts`. Either is fine.

`npm run dev` must build cleanly with no TypeScript errors.

---

*The page is doing three jobs at once — quantify the leak (founder view), claw back claims (recon-lead view), and surface why returns happen (brand-manager view). Plus a hidden fourth job in the disputable charges panel that pays for the entire tool by itself. If a control doesn't serve one of those four jobs, it doesn't belong on the page.*
