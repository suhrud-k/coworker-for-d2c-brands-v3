# Prompt — Inventory & Supply agent (Tara) · New section

**For:** Cursor, working in `coworker-for-d2c-brands_v3/`.
**Why:** Demo for **Luxe by Kan** (luxebykan.com) — a luxury beauty + apparel marketplace, currently on Shopify, **migrating to their own custom website**. They are specifically asking for an **inventory management** solution. Their model is hybrid: they **stock only their top sellers** and **place an order with the brand/stockist on-demand when a customer order arrives** for everything else.

This prompt adds a **6th CoWorker agent — Tara, "Inventory & Supply"** — reporting to Krishan, modelled on the same agent-office pattern as Priya/Rohan/Maya/Ankita. Tailor all mock data to Luxe by Kan (real brands they carry, luxury beauty SKUs, INR pricing).

> **Scope discipline:** Build one new screen component + one new mock-data file, then wire the agent in. Fully build the **Overview, Stocked SKUs, On-demand, and Replenishment** tabs. Leave **Suppliers** and **Expiry & Batch** as `OfficePlaceholder` (with the detail copy given below) — same approach Priya uses for Inbox/MSME/TDS Register. Do **not** restyle anything outside this feature. Reuse the shared primitives in `src/components/shared/ui.tsx` and existing Cashfree tokens — no new colours, no "brutalist" serif/italic styling.

---

## 1. Market context (why this design)

Researched June 2026. Inventory tooling for a hybrid stock + dropship marketplace splits into:

- **India / fashion-luxury fit:** Increff (ASSURE OMS/WMS + IRIS AI merchandising — demand planning, allocation, markdown; native Shopify, ~15–30s inventory sync) and Unicommerce (multichannel D2C + marketplace sync).
- **Hybrid stock + dropship:** Flxpoint (multi-supplier feeds, SKU mapping, auto-PO routing), Ordoro, Cin7 Core, Brightpearl.
- **2026 AI baseline (now table-stakes):** dynamic reorder points, demand sensing, automated replenishment with forward POs. AI forecasts run ~8–15% error vs ~35–45% for static methods.

**The CoWorker wedge for Luxe by Kan:** their real constraint is **working capital** — luxury stock is expensive, so they can't hold everything. Tara does the two jobs that map exactly to their model:
1. **Stocked hero SKUs** → forecast demand, set dynamic reorder points, flag stockout / overstock / expiry, and **auto-draft replenishment POs** (handed to Priya for payment).
2. **On-demand long tail** → when a customer order lands for a non-stocked SKU, **auto-route a PO to the right brand/stockist**, track lead-time & SLA, keep "ships in X days" accurate, and surface **graduation candidates** (long-tail SKUs now selling enough to stock).

Because Luxe by Kan is **leaving Shopify**, Tara must not depend on Shopify — she binds to their **new custom storefront via API/webhooks**, Cashfree, and brand-stockist feeds. Reflect this in Connections (§7g).

---

## 2. Agent identity

| Field | Value |
|---|---|
| `id` | `tara` |
| `name` | `Tara` |
| `role` | `Inventory & Supply` |
| `email` | `tara.cw@brandname.com` (keep `brandname.com` to match siblings; switch all agents to `@luxebykan.com` only if you also switch the others) |
| `avatarBg` | `bg-teal-500` (unused by other agents) |
| `status` | `active` |
| `todayActionCount` | `27` |
| `officeTabs` | `['Overview', 'Stocked SKUs', 'On-demand', 'Replenishment', 'Suppliers', 'Expiry & Batch']` |

> Name "Tara" is a placeholder — rename in `agentsMockData.ts` only if Suhrud prefers another.

---

## 3. Files

**Create**
- `src/data/inventoryMockData.ts`
- `src/components/InventoryScreen.tsx`

**Edit (wiring)**
- `src/v3Types.ts` — add `'tara'` to `AgentId`; add `'inventory'` to `ThreadStatus['id']`.
- `src/data/agentsMockData.ts` — add the Tara entry.
- `src/components/AgentOffice.tsx` — add a `tara` render branch.
- `src/data/threadStatusMockData.ts` — add the inventory status card.
- `src/data/inlineActionsMockData.ts` — add a Tara home action bubble.
- `src/data/cannedResponses.ts` — add `TARA` page const + 4 Tara chat responses.
- `src/data/connectionsMockData.ts` — Shopify → own-website migration.
- `src/data/policiesMockData.ts` — add 3 Tara autonomy thresholds (optional but recommended; match existing `Threshold` shape).

**Edit (small)**
- `src/utils/matchV3Question.ts` — add `tara` to the `@`-mention regex (§7h). Matching otherwise needs no change.

**Verify (confirmed — no change expected)**
- `src/components/TeamViews.tsx` — roster maps `getTeamReports()` (confirmed) so Tara appears automatically; `PoliciesView` groups by `AGENTS.map` so her thresholds render automatically.
- `src/components/StatusRail.tsx` — iterates `THREAD_STATUS`, so the 5th card renders automatically; just confirm layout still looks right with 5 cards.

---

## 4. Data model + mock data — `src/data/inventoryMockData.ts`

Tailor every row to Luxe by Kan. INR, luxury beauty/fragrance/apparel.

```ts
/** Single source of truth for Tara's inventory office. Tailored to Luxe by Kan. */

export type FulfilModel = 'stocked' | 'on-demand';
export type SkuCategory = 'Makeup' | 'Skincare' | 'Haircare' | 'Fragrance' | 'Apparel';
export type StockedStatus = 'healthy' | 'reorder' | 'stockout-risk' | 'overstock';
export type SlaStatus = 'on-track' | 'at-risk' | 'breached';
export type PoStatus = 'awaiting-approval' | 'auto-placed' | 'sent-to-priya';

export interface StockedSku {
  id: string;
  product: string;
  brand: string;
  category: SkuCategory;
  mrp: number;            // INR
  onHand: number;         // units
  weeklyForecast: number; // AI demand forecast, units/wk
  coverDays: number;      // days of cover at forecast velocity
  reorderPoint: number;   // units
  status: StockedStatus;
  expiryFlag?: boolean;   // beauty shelf-life watch
}

export interface OnDemandSku {
  id: string;
  product: string;
  brand: string;
  category: SkuCategory;
  mrp: number;
  supplier: string;          // brand / authorised stockist
  ordersAwaiting: number;    // customer orders not yet dispatched by supplier
  leadTimeDays: number;
  slaStatus: SlaStatus;
  graduationCandidate?: boolean; // selling enough on-demand to justify stocking
}

export interface ReplenishmentPo {
  id: string;               // e.g. 'CF-PO-3387'
  supplier: string;
  items: string;            // human summary
  value: number;            // INR
  model: FulfilModel;       // why it was raised
  status: PoStatus;
  note?: string;
}

export interface SupplierScore {
  id: string;
  name: string;
  brandsCovered: string;
  avgLeadDays: number;
  fillRatePct: number;
  onTimePct: number;
  openPos: number;
  slaBreaches30d: number;
}

export interface InventoryAlert {
  id: string;
  severity: 'amber' | 'rose' | 'info';
  body: string;
  ctaLabel: string;
  officeTab: string;        // deep-links within Tara's office
}

export const INVENTORY_KPI = {
  valueHeld:     { value: '₹48.6 L', sub: '64 stocked hero SKUs · 9.4 wks avg cover' },
  stockoutRisk:  { value: '5 SKUs',  sub: 'hero SKUs under 7 days cover' },
  onDemandOpen:  { value: '11 orders', sub: 'awaiting brand-stockist dispatch' },
  capitalAtRisk: { value: '₹3.2 L',  sub: 'slow movers >120d + 2 batches expiring <90d' },
};

export const STOCKED_SKUS: StockedSku[] = [
  { id: 's1', product: 'Pillow Talk Lipstick',        brand: 'Charlotte Tilbury', category: 'Makeup',    mrp: 3200, onHand: 18,  weeklyForecast: 22, coverDays: 6,   reorderPoint: 40, status: 'stockout-risk' },
  { id: 's2', product: 'Flawless Filter 30ml',        brand: 'Charlotte Tilbury', category: 'Makeup',    mrp: 4500, onHand: 14,  weeklyForecast: 19, coverDays: 5,   reorderPoint: 36, status: 'stockout-risk' },
  { id: 's3', product: 'Unseen Sunscreen SPF40',      brand: 'Supergoop!',        category: 'Skincare',  mrp: 3800, onHand: 9,   weeklyForecast: 16, coverDays: 4,   reorderPoint: 35, status: 'stockout-risk' },
  { id: 's4', product: 'No.3 Hair Perfector 100ml',   brand: 'Olaplex',           category: 'Haircare',  mrp: 2300, onHand: 54,  weeklyForecast: 30, coverDays: 13,  reorderPoint: 60, status: 'reorder' },
  { id: 's5', product: 'Protini Polypeptide Cream',   brand: 'Drunk Elephant',    category: 'Skincare',  mrp: 5400, onHand: 120, weeklyForecast: 18, coverDays: 47,  reorderPoint: 50, status: 'healthy' },
  { id: 's6', product: 'Leave-In Molecular Mask 50ml',brand: 'K18',               category: 'Haircare',  mrp: 6200, onHand: 32,  weeklyForecast: 9,  coverDays: 25,  reorderPoint: 24, status: 'healthy', expiryFlag: true },
  { id: 's7', product: 'Lip Glow Oil',                brand: 'Dior Beauty',       category: 'Makeup',    mrp: 3500, onHand: 76,  weeklyForecast: 12, coverDays: 44,  reorderPoint: 40, status: 'healthy' },
  { id: 's8', product: 'Shape Tape Concealer',        brand: 'Tarte',             category: 'Makeup',    mrp: 2400, onHand: 210, weeklyForecast: 8,  coverDays: 184, reorderPoint: 30, status: 'overstock' },
];

export const ON_DEMAND_SKUS: OnDemandSku[] = [
  { id: 'd1', product: 'N°5 Eau de Parfum 100ml',     brand: 'Chanel Beauty',  category: 'Fragrance', mrp: 13500, supplier: 'Chanel India (authorised)',  ordersAwaiting: 3, leadTimeDays: 9,  slaStatus: 'at-risk' },
  { id: 'd2', product: 'The One Eau de Parfum',        brand: 'Dolce & Gabbana',category: 'Fragrance', mrp: 9200,  supplier: 'D&G Beauty India',           ordersAwaiting: 1, leadTimeDays: 8,  slaStatus: 'breached' },
  { id: 'd3', product: 'Future Skin Foundation',       brand: 'Chantecaille',   category: 'Makeup',    mrp: 6500,  supplier: 'Chantecaille UK',            ordersAwaiting: 2, leadTimeDays: 14, slaStatus: 'at-risk' },
  { id: 'd4', product: 'Gold Lust Repair Shampoo',     brand: 'Oribe',          category: 'Haircare',  mrp: 4500,  supplier: 'Oribe APAC stockist',        ordersAwaiting: 1, leadTimeDays: 12, slaStatus: 'on-track' },
  { id: 'd5', product: 'Premier Cru The Cream',        brand: 'Caudalie',       category: 'Skincare',  mrp: 9800,  supplier: 'Caudalie Distribution',      ordersAwaiting: 2, leadTimeDays: 7,  slaStatus: 'on-track' },
  { id: 'd6', product: 'Vital Seamless Leggings (Black/M)', brand: 'Gymshark',  category: 'Apparel',   mrp: 4200,  supplier: 'Gymshark UK',                ordersAwaiting: 1, leadTimeDays: 16, slaStatus: 'at-risk' },
  { id: 'd7', product: 'No.7 Bonding Oil 30ml',        brand: 'Olaplex',        category: 'Haircare',  mrp: 2800,  supplier: 'Olaplex India distributor',  ordersAwaiting: 2, leadTimeDays: 6,  slaStatus: 'on-track', graduationCandidate: true },
];

export const REPLENISHMENT_POS: ReplenishmentPo[] = [
  { id: 'CF-PO-3387', supplier: 'Charlotte Tilbury', items: 'Pillow Talk Lipstick ×120, Flawless Filter ×80', value: 210000, model: 'stocked', status: 'awaiting-approval', note: 'Both hero SKUs under 7-day cover. Forecast-driven qty.' },
  { id: 'CF-PO-3388', supplier: 'Supergoop!',         items: 'Unseen Sunscreen SPF40 ×100',                    value: 140000, model: 'stocked', status: 'awaiting-approval', note: 'Cover 4 days; sunscreen seasonal uplift detected.' },
  { id: 'CF-PO-3391', supplier: 'Chanel India',       items: 'N°5 EDP 100ml ×3 (against customer orders)',     value: 32000,  model: 'on-demand', status: 'auto-placed',     note: 'Within autonomy band — auto-raised, SLA clock started.' },
  { id: 'CF-PO-3384', supplier: 'Drunk Elephant',     items: 'Protini Cream ×40',                              value: 168000, model: 'stocked', status: 'sent-to-priya',     note: 'Approved 21 Jun — handed to Priya for vendor payment.' },
];

export const SUPPLIERS: SupplierScore[] = [
  { id: 'sup1', name: 'Chanel India (authorised)', brandsCovered: 'Chanel Beauty',           avgLeadDays: 9,  fillRatePct: 96, onTimePct: 88, openPos: 2, slaBreaches30d: 0 },
  { id: 'sup2', name: 'D&G Beauty India',          brandsCovered: 'Dolce & Gabbana',         avgLeadDays: 8,  fillRatePct: 82, onTimePct: 71, openPos: 1, slaBreaches30d: 2 },
  { id: 'sup3', name: 'Chantecaille UK',           brandsCovered: 'Chantecaille',            avgLeadDays: 14, fillRatePct: 90, onTimePct: 79, openPos: 2, slaBreaches30d: 1 },
  { id: 'sup4', name: 'Caudalie Distribution',     brandsCovered: 'Caudalie',                avgLeadDays: 7,  fillRatePct: 98, onTimePct: 95, openPos: 1, slaBreaches30d: 0 },
  { id: 'sup5', name: 'Gymshark UK',               brandsCovered: 'Gymshark',                avgLeadDays: 16, fillRatePct: 85, onTimePct: 74, openPos: 1, slaBreaches30d: 1 },
  { id: 'sup6', name: 'Olaplex India distributor', brandsCovered: 'Olaplex',                 avgLeadDays: 6,  fillRatePct: 97, onTimePct: 93, openPos: 3, slaBreaches30d: 0 },
];

export const INVENTORY_ALERTS: InventoryAlert[] = [
  { id: 'al1', severity: 'rose',  body: 'Charlotte Tilbury Pillow Talk + Flawless Filter both under 7 days cover. Tara drafted reorder PO CF-PO-3387 (₹2.1L) — awaiting your approval.', ctaLabel: 'Review PO →',        officeTab: 'Replenishment' },
  { id: 'al2', severity: 'amber', body: 'Chanel N°5: 3 customer orders received. Tara auto-raised PO CF-PO-3391 to Chanel India; SLA clock at day 4 of 9.',                              ctaLabel: 'Track on-demand →',  officeTab: 'On-demand' },
  { id: 'al3', severity: 'rose',  body: 'D&G The One: supplier SLA breached (day 11 of 8). 1 customer order at risk — Tara escalated to the stockist and flagged for refund-or-wait.',  ctaLabel: 'Open on-demand →',   officeTab: 'On-demand' },
  { id: 'al4', severity: 'info',  body: 'Olaplex No.7 Bonding Oil has sold on-demand 6 weeks running (~14/wk). Tara recommends graduating it to stocked — cuts delivery ~6 days, lifts margin.', ctaLabel: 'See recommendation →', officeTab: 'On-demand' },
];

export function inr(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)} K`;
  return `₹${n.toLocaleString('en-IN')}`;
}
```

---

## 5. Screen — `src/components/InventoryScreen.tsx`

Signature mirrors `VendorsScreen`:

```tsx
export function InventoryScreen({ officeTab, embedded }: { officeTab: string; embedded?: boolean }) { ... }
```

Use `Card`, `SectionHeader`, `StatusPill`, `DeltaArrow` from `./shared/ui`, `cn` from `../lib/utils`, and lucide icons already used elsewhere (`AlertTriangle`, `AlertCircle`, `CheckCircle2`, `PackageX`, `Boxes`, `Truck`, `Clock`, `TrendingUp`, `ArrowRight`). Switch on `officeTab`:

### 5a. `Overview`
- **KPI row** — 4 `Card`s from `INVENTORY_KPI` (value bold `text-[20px]`, sub `text-[12px] text-gray-500`). Stockout-risk and capital-at-risk cards use a left accent (`border-l-4 border-l-error` / `border-l-warning`).
- **The two-mode strip** — the signature visual. A single `Card` titled "How Luxe by Kan fulfils" with two columns:
  - *Stocked (hero SKUs)* — "64 SKUs · ₹48.6 L held · auto-replenished" with a `Boxes` icon.
  - *On-demand (the long tail)* — "1,240 SKUs · ₹0 held · PO raised when a customer orders" with a `Truck` icon.
  - Caption under it: "Tara forecasts and replenishes the 64; she routes and tracks supplier POs for the 1,240 — so capital only sits where it sells."
- **Alerts feed** — map `INVENTORY_ALERTS`. Each row: severity icon (rose=`AlertCircle`, amber=`AlertTriangle`, info=`TrendingUp`), body text, and a right-aligned `btn-secondary h-9 px-4 text-[13px]` button using `alert.ctaLabel` that calls `setOfficeTab(alert.officeTab)`.

### 5b. `Stocked SKUs`
`SectionHeader title="Stocked hero SKUs" subtitle="Held inventory · AI demand forecast & dynamic reorder points"`. One `Card` wrapping a table:

| Product | Brand | On hand | Forecast/wk | Cover | Reorder pt | Status |
|---|---|---|---|---|---|---|

- "Product" cell shows product bold + category muted beneath.
- "Cover" renders `{coverDays}d`, coloured: `text-error` if `<7`, `text-warning` if `<14`, else `text-gray-900`.
- "Status" → `StatusPill`: `stockout-risk`→error "Stockout risk", `reorder`→warning "At reorder point", `overstock`→slate "Overstocked", `healthy`→success "Healthy". If `expiryFlag`, append a small amber "Expiry watch" pill.
- Rows with `status==='stockout-risk'` get a subtle `bg-error-50/40` row tint.
- Footer line under the card: "Tara has drafted 2 replenishment POs from these signals → " with a link button to `Replenishment`.

### 5c. `On-demand`
`SectionHeader title="On-demand fulfilment" subtitle="No stock held — PO routed to the brand/stockist when a customer orders"`. One `Card` + table:

| Product | Brand | Supplier | Orders awaiting | Lead time | SLA |
|---|---|---|---|---|---|

- "SLA" → `StatusPill`: `on-track`→success, `at-risk`→warning, `breached`→error.
- "Orders awaiting" shows the count bold; if a row has `graduationCandidate`, render an info `StatusPill` "Graduate to stocked?" next to the product name.
- Below the table, a highlighted `Card` (`border-l-4 border-l-primary`): "**Graduation recommendation** — Olaplex No.7 Bonding Oil has sold ~14/wk on-demand for 6 weeks. Stocking ~60 units (₹0.9L) cuts delivery from ~8 days to same-day and lifts margin ~6 pts. Want Tara to draft the first stocking PO?" with a `btn-primary` "Draft stocking PO" (no-op / toast is fine).

### 5d. `Replenishment`
`SectionHeader title="Replenishment queue" subtitle="Auto-drafted POs · approved POs flow to Priya for payment"`. Map `REPLENISHMENT_POS` as cards (like Rohan's Claims tab):
- Each card: PO id bold, supplier, `items`, value via `inr()`, `note` muted, and a `StatusPill`:
  - `awaiting-approval`→warning "Awaiting approval" + buttons `btn-primary "Approve & send to Priya"` and `btn-secondary "Adjust qty"`.
  - `auto-placed`→info "Auto-placed (within band)".
  - `sent-to-priya`→success "Sent to Priya" — add muted line "Now in Priya's Payment Runs."
- Top helper line: "Tara raises POs automatically below your autonomy bands and holds the rest for approval. See bands in Manage my team → Policies."

### 5e. `Suppliers` (placeholder)
```tsx
<OfficePlaceholder
  title="Supplier scorecards"
  detail="Brand & authorised-stockist performance — average lead time, fill rate, on-time %, and SLA breaches. Tara uses these to choose the fastest reliable source for each on-demand PO and to flag chronically slow stockists. Data ready in inventoryMockData.ts (SUPPLIERS) — build the table next."
/>
```

### 5f. `Expiry & Batch` (placeholder)
```tsx
<OfficePlaceholder
  title="Expiry & batch tracking"
  detail="Beauty stock carries shelf-life and batch/lot risk. Tara tracks batch expiry on held SKUs, flags anything inside 90 days, and proposes a markdown or bundle with Maya before it becomes dead stock. 2 batches (₹64K) currently expiring under 90 days."
/>
```

---

## 6. `AgentOffice.tsx` — render branch

Import `InventoryScreen`, then add a branch alongside the others (before the final `return null`):

```tsx
if (agentId === 'tara') {
  if (['Overview', 'Stocked SKUs', 'On-demand', 'Replenishment'].includes(officeTab)) {
    return <InventoryScreen officeTab={officeTab} embedded />;
  }
  if (officeTab === 'Suppliers') {
    return (
      <OfficePlaceholder
        title="Supplier scorecards"
        detail="Brand & authorised-stockist performance — lead time, fill rate, on-time %, SLA breaches. Data ready in SUPPLIERS."
      />
    );
  }
  return (
    <OfficePlaceholder
      title="Expiry & batch tracking"
      detail="Batch shelf-life watch for beauty stock. 2 batches (₹64K) expiring under 90 days — Tara proposes a markdown/bundle with Maya."
    />
  );
}
```

(Or route `Suppliers`/`Expiry & Batch` inside `InventoryScreen` and always return `<InventoryScreen … />` — either is fine; keep it consistent with how Priya is handled.)

---

## 7. Wiring snippets (before → after)

### 7a. `src/v3Types.ts`
```ts
// before
export type AgentId = 'krishan' | 'priya' | 'rohan' | 'maya' | 'ankita';
// after
export type AgentId = 'krishan' | 'priya' | 'rohan' | 'maya' | 'ankita' | 'tara';
```
```ts
// ThreadStatus.id — before
id: 'reconciliation' | 'compliance' | 'marketing' | 'vendors';
// after
id: 'reconciliation' | 'compliance' | 'marketing' | 'vendors' | 'inventory';
```

### 7b. `src/data/agentsMockData.ts` — append to `AGENTS`
```ts
{
  id: 'tara',
  name: 'Tara',
  role: 'Inventory & Supply',
  email: 'tara.cw@brandname.com',
  avatarBg: 'bg-teal-500',
  status: 'active',
  todayActionCount: 27,
  recentActions: [
    { ts: 'Today 08:40', verb: 'Drafted reorder PO CF-PO-3387', meta: '₹2.1L · awaiting approval' },
    { ts: 'Today 07:30', verb: 'Auto-raised on-demand PO to Chanel India', meta: '3 orders · ₹32K' },
    { ts: 'Yesterday 18:05', verb: 'Flagged D&G stockist SLA breach', meta: 'Day 11 of 8' },
  ],
  officeTabs: ['Overview', 'Stocked SKUs', 'On-demand', 'Replenishment', 'Suppliers', 'Expiry & Batch'],
},
```

### 7c. `src/data/threadStatusMockData.ts` — append to `THREAD_STATUS`
```ts
{
  id: 'inventory',
  title: 'Inventory',
  agentId: 'tara',
  signal: 'amber',
  statusLine: '5 hero SKUs at stockout risk · 2 POs need approval',
  deepLink: { agentId: 'tara', officeTab: 'Overview' },
},
```

### 7d. `src/data/inlineActionsMockData.ts` — append to `INLINE_ACTIONS`
```ts
{
  id: 'action-tara-replenish',
  agentId: 'tara',
  ts: '08:40',
  body: 'Tara found 5 hero SKUs under a week of cover (Charlotte Tilbury, Supergoop!) and drafted 2 replenishment POs worth ₹3.5L. Chanel N°5 on-demand POs were auto-placed within your band.',
  cta: { label: 'Review replenishment →', deepLink: { agentId: 'tara', officeTab: 'Replenishment' } },
},
```

### 7e. `src/data/cannedResponses.ts`
Add the page const near the others:
```ts
const TARA: ChatPage[] = ['home', 'office:tara'];
```
Add `'office:tara'` to the `ALL_PAGES` array. Then add these to `DATA_RESPONSES`:

```ts
{
  id: 'q_inv_stockout',
  question: 'Which products will stock out this week?',
  pages: TARA,
  match: [/stock\s?out/i, /run(?:ning)? out/i, /low (?:on )?stock/i],
  agentId: 'tara',
  headline: '5 hero SKUs drop below a week of cover. I’ve drafted reorder POs for the top 2.',
  body: 'At the current AI forecast, these stocked SKUs hit zero before the next reorder lands. POs CF-PO-3387 and CF-PO-3388 are awaiting your approval.',
  artifact: {
    kind: 'table',
    columns: ['Product', 'On hand', 'Forecast/wk', 'Cover', 'Action'],
    rows: [
      ['CT Flawless Filter', '14', '19', '5 days', 'PO drafted'],
      ['Supergoop! Unseen SPF40', '9', '16', '4 days', 'PO drafted'],
      ['CT Pillow Talk Lipstick', '18', '22', '6 days', 'PO drafted'],
      ['Olaplex No.3 100ml', '54', '30', '13 days', 'At reorder pt'],
    ],
  },
  sources: ['Luxe by Kan Storefront', 'Brand stockist feeds', 'Cashfree PG'],
  drillLink: { label: 'Open Replenishment →', deepLink: { agentId: 'tara', officeTab: 'Replenishment' } },
},
{
  id: 'q_inv_ondemand',
  question: 'Show on-demand orders awaiting the brand stockist',
  pages: TARA,
  match: [/on[-\s]?demand/i, /awaiting/i, /stockist/i, /supplier order/i, /backorder/i],
  agentId: 'tara',
  headline: '11 customer orders are with brand stockists. 1 has breached SLA and 3 are at risk.',
  body: 'For non-stocked SKUs I raise the PO the moment the customer order lands, then watch the SLA clock. D&G The One has breached — I’ve escalated to the stockist.',
  artifact: {
    kind: 'table',
    columns: ['Product', 'Supplier', 'Orders', 'Lead time', 'SLA'],
    rows: [
      ['Chanel N°5 EDP', 'Chanel India', '3', '9 days', 'At risk'],
      ['D&G The One EDP', 'D&G Beauty India', '1', '8 days', 'Breached'],
      ['Chantecaille Foundation', 'Chantecaille UK', '2', '14 days', 'At risk'],
      ['Caudalie Premier Cru', 'Caudalie Distribution', '2', '7 days', 'On track'],
    ],
  },
  sources: ['Brand stockist feeds', 'Luxe by Kan Storefront'],
  drillLink: { label: 'Open On-demand →', deepLink: { agentId: 'tara', officeTab: 'On-demand' } },
},
{
  id: 'q_inv_capital',
  question: 'How much cash is tied up in inventory?',
  pages: TARA,
  match: [/tied up/i, /working capital/i, /inventory value/i, /cash.*inventory/i],
  agentId: 'tara',
  headline: '₹48.6 L sits in stocked inventory — only on the 64 SKUs that earn it.',
  body: 'The other ~1,240 SKUs hold zero capital because they’re on-demand. Of the held value, ₹3.2 L is in slow movers (>120 days) and 2 batches (₹64K) expire within 90 days — candidates for a markdown with Maya.',
  artifact: {
    kind: 'table',
    columns: ['Bucket', 'Value', 'Note'],
    rows: [
      ['Healthy cover', '₹42.2 L', 'Selling within forecast'],
      ['Slow movers >120d', '₹3.2 L', 'Tarte Shape Tape overstocked'],
      ['Expiring <90 days', '₹64 K', 'K18 batches — bundle/markdown'],
      ['Stockout risk', '₹1.0 L', 'Replenishment drafted'],
    ],
  },
  sources: ['Luxe by Kan Storefront', 'Cashfree PG', 'Tally Prime'],
  drillLink: { label: 'Open Overview →', deepLink: { agentId: 'tara', officeTab: 'Overview' } },
},
{
  id: 'q_inv_graduate',
  question: 'Should we start stocking any on-demand products?',
  pages: TARA,
  match: [/should we (?:start )?stock/i, /graduat/i, /start stocking/i, /hold inventory/i],
  agentId: 'tara',
  headline: 'Yes — Olaplex No.7 Bonding Oil has earned a spot on the shelf.',
  body: 'It’s sold ~14/wk on-demand for 6 straight weeks. Stocking ~60 units (₹0.9L) cuts delivery from ~8 days to same-day and lifts margin ~6 pts by removing the per-order stockist markup. I can draft the first stocking PO.',
  drillLink: { label: 'Open On-demand →', deepLink: { agentId: 'tara', officeTab: 'On-demand' } },
},
```

### 7f. `src/data/policiesMockData.ts` — add Tara autonomy bands
Append to the **`DEFAULT_THRESHOLDS`** array (same `Threshold` shape: `{ agentId, key, label, unit, value, min?, max?, step? }`). `PoliciesView` groups thresholds via `AGENTS.map`, so Tara's bands render under her automatically:
```ts
{ agentId: 'tara', key: 'replenish_auto_cap',  label: 'Auto-place replenishment POs up to', unit: '₹',    value: 50000,  min: 0, max: 500000, step: 5000 },
{ agentId: 'tara', key: 'ondemand_auto_cap',   label: 'Auto-place on-demand POs up to',     unit: '₹',    value: 25000,  min: 0, max: 200000, step: 5000 },
{ agentId: 'tara', key: 'hero_stockout_days',  label: 'Escalate hero SKU if cover under',   unit: 'days', value: 7,      min: 1, max: 30,    step: 1 },
```

### 7g. `src/data/connectionsMockData.ts` — Shopify → own website
Luxe by Kan is migrating off Shopify. In `INITIAL_CONNECTIONS`:
```ts
// before
{ id: 'shopify', name: 'Shopify Store', category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:10 PM', type: 'Own store', authMethod: 'OAuth' },
// after — mark Shopify as migrating, add the new custom storefront
{ id: 'shopify', name: 'Shopify Store', category: 'marketplaces', status: 'disconnected', lastSync: 'Migrating off', type: 'Own store · being retired', authMethod: 'OAuth' },
{ id: 'lbk-store', name: 'Luxe by Kan Storefront', category: 'marketplaces', status: 'connected', lastSync: 'Just now', type: 'Own store (custom) · headless', authMethod: 'API + webhooks' },
{ id: 'stockists', name: 'Brand stockist feeds', category: 'marketplaces', status: 'connected', lastSync: 'Just now', type: 'On-demand supplier catalog & lead times', authMethod: 'API key' },
```
This makes the migration legible in the demo and shows Tara binds to the new site + stockists, not Shopify. (No type changes needed — these reuse the `marketplaces` category and `Connection` shape.)

### 7h. `src/utils/matchV3Question.ts` — let `@tara` scope
The matcher already keys off `question` (exact) and `match` regexes, so the Tara responses fire with no other change. Just add `tara` to the `@`-mention regex so "@tara …" scopes to her:
```ts
// before
const m = input.match(/^@(krishan|priya|rohan|maya|ankita)\b\s*/i);
// after
const m = input.match(/^@(krishan|priya|rohan|maya|ankita|tara)\b\s*/i);
```

---

## 8. Design guardrails
- Reuse `Card`, `SectionHeader`, `StatusPill`, `DeltaArrow`, `btn-primary`, `btn-secondary`, `card`, and existing colour tokens (`text-error`, `text-warning`, `text-success`, `bg-error-50`, `bg-purple-50`, `text-primary`, etc.). No new palette.
- No serif/italic "brutalist" styling, no "Protocol/Intel/Terminal" microcopy. Tara's voice is calm, specific, numeric — like Krishan's.
- Tables: `text-[13px]`, header row `text-gray-500 border-b border-gray-100`, body `divide-y divide-gray-50`, numbers `tabular-nums text-right`.
- All currency through `inr()` or pre-formatted strings; INR only.

## 9. Acceptance criteria
1. A 6th agent **Tara · Inventory & Supply** (teal avatar) appears in **Manage my team** roster and opens an office with 6 tabs.
2. **Overview** shows 4 KPIs, the stocked-vs-on-demand two-mode strip, and the 4-item alert feed; alert CTAs deep-link within the office.
3. **Stocked SKUs** lists the LBK hero SKUs with cover-day colouring and correct status pills (3 stockout-risk, 1 reorder, 1 overstock, rest healthy; K18 shows "Expiry watch").
4. **On-demand** lists the long-tail SKUs with SLA pills (1 breached, 3 at-risk) and the Olaplex No.7 graduation recommendation card.
5. **Replenishment** shows 4 POs with correct statuses incl. one "Sent to Priya"; approve buttons present.
6. **Suppliers** and **Expiry & Batch** render the placeholder copy.
7. **Home**: a 5th status-rail card "Inventory / Tara" deep-links to Tara's Overview; a Tara action bubble appears in the home chat.
8. **Chat**: asking "which products will stock out this week?", "show on-demand orders…", "how much cash is tied up in inventory?", and "should we start stocking any on-demand products?" returns Tara-attributed answers with tables and drill links, on both Home and Tara's office.
9. **Connections**: Shopify shows "being retired / Migrating off"; "Luxe by Kan Storefront" and "Brand stockist feeds" show connected.
10. `npm run build` (or `tsc`) passes — no TS errors from the new `AgentId`/`ThreadStatus` union members. No regressions in the other agents' offices.

## 10. Out of scope (this pass)
Building out the Suppliers table and Expiry & Batch screen (data is ready), real forecasting math, and editable PO quantities. Leave as next iteration.
