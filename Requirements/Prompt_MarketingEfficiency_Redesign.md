# Cursor Prompt: Redesign the page as "Marketing Efficiency"

Rebuild the `AdProfitScreen` component in `src/App.tsx` (around line 2258). Rename to **Marketing Efficiency** and restructure into a four-job page: brand-level ROI truth → campaign-level bleeders and winners → reallocation simulator → customer economics. Plus a collapsible "Attribution overlap" callout for the founder who wants to know the dirty truth about cross-platform double-counting.

Every filter, sort, slider, toggle, and button must be interactive — no decorative chrome.

---

## 1. RENAMES — preserve route key, change only user-visible labels

Keep the internal `Tab` value as `'ads'`. Only the user-facing label and component name change.

- Sidebar item label `"Ad Profit"` → **`"Marketing Efficiency"`**.
- `<SectionHeader title="...">` → **`title="Marketing Efficiency"`** (line ~2265).
- `<SectionHeader subtitle="...">` → **`subtitle="True profit on every rupee of marketing — across every platform"`** (line ~2266).
- Component name `AdProfitScreen` → **`MarketingEfficiencyScreen`**. Update the `case 'ads': return <MarketingEfficiencyScreen />` reference at line ~2473.

The Home page CTA labelled "Fix Myntra ads" still routes to `onNavigate('ads')` — no changes needed there since the route key is preserved.

---

## 2. PAGE STRUCTURE (top to bottom)

Replace the entire current body (the dark navy recommendation banner + the campaign table) with this structure:

```
SectionHeader: "Marketing Efficiency" + date-range pills (Today · This Week · This Month default · This Quarter · Custom)
  ↓
Section 1: Headline ROI — 4 KPIs + 8-week PoAS trend                       (Job 1 — founder view)
  ↓
Section 2: Campaign performance — sortable table, decay sparklines         (Job 2 — marketing lead view)
  ↓
Section 3: Reallocation simulator — interactive sliders + projection panel (Job 3 — action surface)
  ↓
Section 4: Customer economics — CAC, LTV, payback, by channel              (Job 4 — CFO view)
  ↓
Collapsible: Attribution overlap callout (hidden by default)
```

The page-level date-range pill group stays as the right-side `SectionHeader` action.

---

## 3. SECTION 1 — HEADLINE ROI (the founder's 30-second view)

### 3.1 Four KPI tiles in a 4-column grid

| Tile | Big number | Sub-line | Left-border accent |
|---|---|---|---|
| Total ad spend | **₹15.6 L** | this month · +12% MoM | warning (because of MoM increase) |
| Marketing Efficiency Ratio (MER) | **4.2×** | Net revenue ÷ total marketing spend · target > 4× | success |
| Profit on Ad Spend (PoAS) | **1.24×** | Net margin ÷ ad spend · target > 1× | success |
| Performance vs branding split | **78 / 22%** | Top-of-funnel branding under-invested | navy-950 |

Use the existing `<Card>` primitive. Big number = `text-[28px] font-bold text-navy-950 tabular-nums`. Sub-line = `text-[12px] text-gray-500`. Use `<DeltaArrow>` and `<InfoIcon>` (tooltip) where appropriate.

`<InfoIcon>` tooltips:
- MER: "Marketing Efficiency Ratio = Total Revenue ÷ Total Marketing Spend. A simple brand-level health check: 4×+ is healthy, 3× is concerning, <2.5× is bleeding."
- PoAS: "Profit on Ad Spend = Net Margin ÷ Ad Spend. ROAS lies because it's gross revenue. PoAS subtracts COGS, returns, and marketplace charges."
- Performance vs branding split: "Performance ads aim for direct conversion. Branding ads build long-term recall. Most D2C brands under-invest in branding (target: 30-35% of spend)."

### 3.2 8-week PoAS trend chart

Below the KPI tiles, an `<Card>` with a small line chart (recharts `LineChart`):
- X-axis: last 8 weeks (W-7 through W-0).
- Y-axis: PoAS multiplier (0.8× to 1.4× range).
- Single solid line in `primary` (`#6930CA`).
- A dotted horizontal `text-gray-300` reference line at 1.0× (the break-even threshold).
- Tooltip on hover shows week + PoAS value + total ad spend that week.

Sample data points: W-7: 1.18, W-6: 1.21, W-5: 1.15, W-4: 1.08, W-3: 1.12, W-2: 1.19, W-1: 1.22, W-0: 1.24.

Headline above the chart: "PoAS over 8 weeks · trending up". Sub-text: "Up from 1.18× to 1.24× — driven by cutting Myntra Meta spend and scaling Google brand search."

---

## 4. SECTION 2 — CAMPAIGN PERFORMANCE (the marketing lead's daily view)

**Component.** `<Card title="Campaign performance" subtitle="Sorted by PoAS · worst first">` containing a filter row and a sortable table.

### 4.1 Filter row above the table

- **Platform** multi-select dropdown: All platforms · Meta · Google · Amazon Ads · Flipkart PLA · Myntra Ads (all checked by default).
- **Campaign type** dropdown: All · Performance · Branding · Retargeting · Brand search.
- **Status** dropdown: All · Active · Paused · Archived.
- **Sort by** dropdown: PoAS (ascending — default · worst first) · PoAS (descending) · Spend · Margin contribution · WoW Δ.
- **Search** input: filters by campaign name.

All filters are stateful and update the visible rows.

### 4.2 Sortable campaign table

Columns: **Platform** (chip) · **Campaign name** · **Spend** · **Attributed GMV** · **Net sales after returns** · **Margin contribution ₹** · **PoAS** · **WoW Δ** · **4-week trend** (small inline sparkline) · **Action** (`btn-tertiary` link).

PoAS cell colored: `text-error` if < 1.0×, `text-warning` if 1.0–1.5×, `text-success` if > 1.5×.

Row hover: `bg-purple-50/30`. Click any row → opens a right-side drawer with full campaign detail (creative thumbnails placeholder, audience targeting, daily spend history, suggested next steps).

### 4.3 Sample data — 10 campaigns

Sorted by PoAS ascending (worst first):

| Platform | Campaign | Spend | GMV | Net Sales | Margin | PoAS | WoW | Action |
|---|---|---|---|---|---|---|---|---|
| Meta | Myntra Sale Push | ₹4.2 L | ₹16.1 L | ₹9.8 L | −₹87 K | **0.79×** | −0.18 | **Pause** |
| Meta | Retargeting cart abandoners | ₹1.2 L | ₹3.8 L | ₹2.4 L | −₹14 K | 0.88× | −0.12 | Review |
| Amazon Ads | Sun Protection Push | ₹1.8 L | ₹4.2 L | ₹2.8 L | +₹3 K | 1.02× | −0.04 | Hold |
| Meta | Mother's Day | ₹2.4 L | ₹6.8 L | ₹4.2 L | +₹38 K | 1.16× | −0.08 | Hold |
| Flipkart PLA | Skincare Hero | ₹3.1 L | ₹11.4 L | ₹7.2 L | +₹60 K | 1.19× | +0.04 | Hold |
| Meta | Lookalike — new customers | ₹2.1 L | ₹7.4 L | ₹4.9 L | +₹52 K | 1.25× | −0.02 | Hold |
| Google Ads | Generic skincare KW | ₹0.9 L | ₹3.2 L | ₹2.1 L | +₹40 K | 1.44× | +0.08 | **Scale** |
| Amazon Ads | Brand Story (V2) | ₹0.6 L | ₹2.4 L | ₹1.6 L | +₹28 K | 1.47× | +0.06 | Scale |
| Google Ads | Competitor terms | ₹0.5 L | ₹1.8 L | ₹1.2 L | +₹26 K | 1.52× | +0.04 | Scale |
| Google Ads | Brand Search | ₹1.8 L | ₹14.2 L | ₹11.6 L | +₹2.4 L | **2.33×** | +0.18 | **Scale** |

The two highlighted rows at the extremes (Myntra Sale Push at 0.79× and Brand Search at 2.33×) are the "bleeder" and "winner" — render their PoAS values in a heavier weight (`font-bold`) to draw the eye.

### 4.4 Inline 4-week sparklines

Each row's "4-week trend" column shows a tiny 60-px wide line chart of the campaign's PoAS over W-3 → W-0. Use the `LineChart` from recharts with no axes, just the line. Stroke color matches the PoAS bucket (error/warning/success).

For declining trends (Myntra Sale Push, Retargeting), the line slopes down. For improving ones (Brand Search, Generic skincare KW), it slopes up.

### 4.5 Action column

Each campaign has a suggested action displayed as a `btn-tertiary` link in the rightmost column:
- **Pause** for campaigns < 0.9× PoAS with declining WoW — clicking opens a confirmation modal.
- **Review** for 0.9–1.1× PoAS — opens the drawer.
- **Hold** for 1.1–1.5× — non-clickable text, no border.
- **Scale** for > 1.5× — clicking opens a quick "Increase budget by..." dialog with preset options (10%, 25%, 50%).

---

## 5. SECTION 3 — REALLOCATION SIMULATOR (the action surface)

This is the page's centrepiece — the page transitions from analysis to action here. It replaces the old "Shift ₹2.4 L from Myntra Meta..." recommendation banner with an interactive model.

**Component.** `<Card title="Reallocation simulator" subtitle="Model how shifting ad spend would change MER, PoAS, and margin">` containing sliders on the left and a projection panel on the right.

### 5.1 Layout — two-column inside the card

**Left column — Spend allocation sliders.** A list of 6 sliders, one per spend bucket:

| Platform / bucket | Current spend | Slider range | Default |
|---|---|---|---|
| Meta — Performance | ₹8.2 L | ₹0 – ₹12 L | ₹8.2 L |
| Meta — Branding | ₹1.4 L | ₹0 – ₹5 L | ₹1.4 L |
| Google — Brand search | ₹1.8 L | ₹0 – ₹6 L | ₹1.8 L |
| Google — Generic + competitor | ₹1.4 L | ₹0 – ₹5 L | ₹1.4 L |
| Amazon Ads | ₹1.3 L | ₹0 – ₹5 L | ₹1.3 L |
| Flipkart PLA | ₹3.1 L | ₹0 – ₹6 L | ₹3.1 L |
| Myntra Ads | ₹0.4 L | ₹0 – ₹3 L | ₹0.4 L |

Each slider shows: bucket name (label), current value (live as you drag), and a small "vs. current" delta indicator (e.g., "+₹1.2 L" in `text-success`, "−₹3.0 L" in `text-error`).

Below the sliders, two buttons:
- `btn-secondary` **"Reset to current"** — resets all sliders to current spend.
- `btn-secondary` **"Apply CoWorker recommendation"** — sets sliders to a recommended reallocation (cut Myntra Meta to ₹2.0 L, increase Google Brand Search to ₹3.0 L, increase Amazon Ads to ₹2.5 L).

**Right column — Projection panel.** A small `<Card>` (or just a styled div inside the parent card) titled "Projected impact". Two stat groups side by side: **Current** and **Projected**.

| Metric | Current | Projected |
|---|---|---|
| Total ad spend | ₹15.6 L | ₹15.6 L *(or whatever the slider total is)* |
| Net margin contribution | ₹19.3 L | ₹22.4 L |
| MER | 4.2× | 4.6× |
| PoAS | 1.24× | 1.44× |
| Estimated GMV impact | — | −₹3.8 L (acceptable) |

The "Projected" column updates **live** as the user drags any slider. Use simple heuristic math: each bucket has an assumed PoAS coefficient (Meta Performance 1.1×, Meta Branding 0.9×, Google Brand 2.3×, Google Generic 1.4×, Amazon Ads 1.4×, Flipkart PLA 1.2×, Myntra Ads 0.6×) and the projection recalculates linearly.

Below the projection panel, a primary `btn-primary` **"Execute reallocation"** button — clicking simulates a 1.2 s processing state then shows a success toast: "Reallocation applied — ad platform changes will take effect in 24 hours."

### 5.2 Underinvested opportunities callout

Below the simulator card, a smaller `<Card>` with a `bg-purple-50` accent strip on the left:

**"Underinvested opportunities — based on marginal PoAS analysis"**

Two-row mini-table:
- **Amazon Sponsored Products**: currently ₹1.3 L · marginal PoAS at +₹1 L = 2.1× · could add ₹2 L for **+₹2.2 L margin**.
- **Google Brand Search**: currently ₹1.8 L · marginal PoAS at +₹1 L = 1.9× · could add ₹1.5 L for **+₹1.4 L margin**.

Each row has a `btn-tertiary` "Apply to simulator →" link that auto-adjusts the relevant slider.

---

## 6. SECTION 4 — CUSTOMER ECONOMICS (the CFO's view)

**Component.** `<Card title="Customer economics" subtitle="Are we acquiring profitably or buying revenue?">` with a 4-tile stat strip on top and a CAC-by-channel table below.

### 6.1 Top stat strip — 4 tiles

| Tile | Big number | Sub | Accent |
|---|---|---|---|
| CAC (blended) | **₹520** | per new customer · −5% MoM | success |
| LTV (90-day) | **₹1,890** | per customer · +8% MoM | success |
| LTV / CAC | **3.6×** | target > 3× · healthy | success (or warning if < 3×) |
| CAC payback | **4.2 mo** | target < 6 months | success |

### 6.2 CAC by channel table

| Channel | New customers | Ad spend | CAC | LTV (90-day) | LTV/CAC |
|---|---|---|---|---|---|
| Meta | 1,847 | ₹11.0 L | ₹596 | ₹1,720 | 2.9× |
| Google | 612 | ₹2.7 L | ₹441 | ₹2,210 | **5.0×** |
| Amazon PLA | 348 | ₹1.8 L | ₹517 | ₹1,890 | 3.7× |
| Flipkart PLA | 421 | ₹3.1 L | ₹736 | ₹1,420 | **1.9×** |
| Organic | 1,128 | ₹0 | ₹0 | ₹2,310 | ∞ |

LTV/CAC cell colored: `text-error` if < 2×, `text-warning` if 2–3×, `text-success` if > 3×.

Each row has an `<InfoIcon>` tooltip explaining how CAC is calculated for that channel.

### 6.3 New vs repeat revenue donut

To the right of the CAC table (or stacked below on narrower screens), a small donut chart showing **New customer revenue: 38% · Repeat customer revenue: 62%**. With a small label below: "Healthy mix — repeat-customer share is the right side of growth."

---

## 7. COLLAPSIBLE — ATTRIBUTION OVERLAP CALLOUT

A collapsed-by-default `<Card>` at the bottom of the page with a clear "expand" affordance. Title: **"Attribution overlap detected"**. Sub-line: "Meta, Google, and PLAs collectively claim 1,857 conversions. CoWorker estimates ~33% double-counting. Click to see the math."

State: persist the expanded/collapsed state in `localStorage` (key: `attribution_overlap_expanded`).

When expanded, show:

| Source | Claimed conversions | Notes |
|---|---|---|
| Meta (7-day click + view) | 1,247 | View-through inflates this |
| Google Ads (last-click) | 412 | Underestimates assist |
| Marketplace PLAs (last-click) | 198 | Underestimates assist |
| **Sum of platform claims** | **1,857** | — |
| **De-duplicated actual conversions** | **1,247** | After CoWorker overlap analysis |
| **Estimated overlap** | **33%** | Typical for India D2C |

Below the table, a note: *"Implication — your reported blended ROAS of 3.8× across platforms is likely closer to 2.5× in reality. The PoAS on this page already accounts for this; the platform dashboards do not."*

A `btn-tertiary` "Learn how CoWorker estimates overlap →" link at the bottom.

---

## 8. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Date range pill group** at the page top: changes `dateRange` state; all sections (KPIs, trend chart, campaign table, simulator baseline, CAC table) re-render with period-appropriate data.
- **KPI tile InfoIcon tooltips**: hover shows the explanation.
- **8-week PoAS chart tooltip**: hover shows week + PoAS value + spend.
- **Campaign table filters** (platform, type, status, sort, search): all stateful and update visible rows.
- **Campaign row click**: opens a right-side drawer with detail.
- **Pause / Review / Scale action buttons** in the campaign table: each opens its appropriate modal or drawer.
- **Reallocation simulator sliders**: drag updates the projection panel **live** (no debouncing needed for V1 — instant feedback is the point).
- **"Reset to current"**: resets all sliders.
- **"Apply CoWorker recommendation"**: snaps all sliders to the recommended values with a brief animation.
- **"Execute reallocation"**: simulates 1.2 s processing, shows success toast.
- **"Apply to simulator →" links** in the underinvested opportunities card: adjust the relevant slider.
- **Customer economics tile InfoIcons**: explain CAC, LTV, payback formulas.
- **CAC table row click**: opens a drawer with channel-specific cohort analysis (placeholder for V1 — just shows static text).
- **Attribution overlap callout**: clicking the header toggles expand/collapse; persists in `localStorage`.

---

## 9. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

Same compliance rules as previous redesigns. After this change, this grep within `MarketingEfficiencyScreen` must return zero matches:

```
font-serif | italic (except quoted text) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Radar | Execute Protocol |
"Ad Insights" | "Ad Profit" anywhere user-visible
```

Use only shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<DeltaArrow>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`, `btn-destructive`), and the design tokens.

The previous "Ad Profit Recommendation Fix" prompt has now been superseded — the dark-navy banner with the underlined red/green phrases is replaced entirely by Section 3 (Reallocation simulator). Don't preserve it.

---

## 10. DELIVERABLE

A rewritten `MarketingEfficiencyScreen` component replacing `AdProfitScreen` in `src/App.tsx`. Affected pointer references:

1. Line ~2265–2266 — title and subtitle.
2. Line ~2473 — `case 'ads': return <MarketingEfficiencyScreen />`.
3. Sidebar item label (around line ~2541) — `"Ad Profit"` → `"Marketing Efficiency"`.
4. Any home-page or chat copy that says "Fix Myntra ads" → leave alone (the route still works; the CTA label can stay since "Fix ads" still semantically resolves to this page).

Mock data can be inlined or extracted to `src/data/marketingEfficiencyMockData.ts`. `npm run dev` must build cleanly.

---

*The page is doing one job: helping a D2C founder know the truth about whether marketing is making the business work — and giving the marketing lead a single surface to act on. Every section either tells the truth (Sections 1, 4, the attribution callout) or lets the user act on it (Sections 2, 3). If a control doesn't serve one of those two jobs, it doesn't belong on the page.*

---

## 11. DATA INGESTION — where each number on the page comes from

This page is an aggregation layer. For mock data in the prototype, all numbers are hard-coded. For the eventual production build, the data flows are:

**Ad spend (Section 1 KPIs, Section 2 campaign table, Section 3 simulator current values):**

- **Meta Ads** — Meta Marketing API (OAuth 2.0 + long-lived token). Endpoint `/act_{id}/insights` for spend / impressions / conversions per campaign. Daily refresh sufficient. Lag 4–12 hours.
- **Google Ads** — Google Ads API (OAuth 2.0 + developer token, Standard Access required). GAQL queries against the Customer resource. Near real-time. CoWorker needs a one-time developer token approval (1–2 weeks).
- **Amazon Advertising** — Amazon Advertising API (OAuth via Login with Amazon). Async report download model. Lag 12–24 hours. Covers Sponsored Products + Brands + Display.
- **Flipkart PLA + Myntra Ads + other marketplace PLAs** — **derived from settlement deductions** in the existing marketplace integrations. No new connector needed. Marketplace settlement files include ad-charge line items; CoWorker categorises them as "Marketplace PLA spend" and aggregates per platform.

**Net margin / PoAS calculation (Section 1 PoAS tile, Section 2 margin contribution column):**

Computed inside CoWorker, no new ingestion needed. Formula: `Net Margin Contribution = Net Sales − COGS − Marketplace Charges − Returns Cost − Ad Spend`. All inputs already flow through existing CoWorker data:
- Net Sales → marketplace + PG + Shopify connections
- COGS → Tally (or accounting connector)
- Marketplace Charges → marketplace settlement files
- Returns Cost → marketplace returns API + Returns & Recovery engine
- Ad Spend → the four sources above

**Attribution data (Section 2 attributed GMV, attribution overlap callout):**

Each ad platform reports its own attributed conversions per its own attribution window. CoWorker pulls these as-is and surfaces the overlap warning. For V1, no platform-independent attribution (no UTM stitching, no MMP-grade modelling) — that's a future capability.

**Customer economics (Section 4 CAC, LTV, payback):**

- **CAC by channel** — `Ad Spend by Platform ÷ New Customers acquired in that period`. New customer count comes from order data with customer-ID deduplication across Shopify + marketplaces. Allocation to a specific ad platform uses the platform's last-touch attribution (acknowledged inflation; the attribution callout owns this caveat).
- **LTV (90-day)** — sum of order value over 90 days from first purchase, per customer cohort. Requires customer-ID stitching across orders. For mock data in the prototype, just use the static numbers.
- **CAC payback** — `CAC ÷ (Net Margin per customer per month)`.

**Dependency on Connections page:**

This page assumes the three new ad-platform connectors (Meta Ads, Google Ads, Amazon Ads) are present in the Connections grid under the new **Ad Platforms** category. If a connector is missing or in error state, the corresponding campaign rows should render with a `<StatusPill status="warning" text="Reconnect Meta to refresh">` and a `btn-tertiary` "Open Connections →" deep-link.

---

## 12. ASSUMPTIONS — flag for override

1. **Four jobs collapsed into one page.** Alternative: split Customer Economics (Job 4) into a separate "Customer Economics" page — but it's tightly linked to ad spend, so I kept it here.
2. **Reallocation simulator math** is a simple linear model with hard-coded per-bucket PoAS coefficients. Real reallocation modeling would need diminishing-returns curves. Fine for V1; flag if you want curves.
3. **Attribution overlap** is shown as static numbers, not computed live. Alternative: compute live from a small data model. V1: static is fine.
4. **CAC payback** is shown as a single number per the blended figure. Alternative: payback distribution by channel.
5. **New vs repeat split** at 38/62 — chosen as a "healthy mix" mock figure. Adjust if needed.
