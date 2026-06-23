# Prompt — Inventory (Tara) · Iteration 2: roster fix, add/edit flows, completed pages

**For:** Cursor, in `coworker-for-d2c-brands_v3/`.
**Builds on:** `Prompt_Inventory_NewSection.md` (already implemented — Tara agent, `InventoryScreen.tsx`, `inventoryMockData.ts` all exist).
**Files touched:** `src/components/TeamViews.tsx`, `src/data/inventoryMockData.ts`, `src/components/InventoryScreen.tsx`. No other files change (`AgentOffice` already passes `onOfficeTabChange={setOfficeTab}` and routes all 6 Tara tabs through `InventoryScreen`).

Six changes:
1. Fix the team roster so all 5 reports sit on one line (Tara currently wraps).
2. Add-new-SKU flow.
3. Add-new-category flow.
4. Add-new-supplier flow.
5. Edit button on each row of **Stocked SKUs** (edit name, category, reorder point).
6. Build out the **Suppliers** and **Expiry & Batch** pages.

> **State model:** items 2–5 require live, in-session data. Lift the inventory data from module constants into `useState` inside `InventoryScreen` (seeded from the constants in `inventoryMockData.ts`). The component stays mounted across tab switches, so adds/edits persist while navigating Tara's office. **Do not use localStorage** — in-memory React state only. Reuse the existing `Drawer`, `Card`, `SectionHeader`, `StatusPill` from `shared/ui`, `btn-primary`/`btn-secondary`, and existing tokens. No new colours, no serif/brutalist styling.

---

## 1. Roster — 5 agents on one line · `src/components/TeamViews.tsx`

In `TeamRoster` the report grid is fixed at 4 columns, so the 5th agent (Tara) wraps. Change it to 5, and widen the org-chart connector bar to span 5 column-centres.

```tsx
// ~line 122 — before
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-stretch mt-0 lg:-mt-px">
// after
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full items-stretch mt-0 lg:-mt-px">
```
```tsx
// ~line 117 — before (bar spans 4-column centres)
className="absolute top-0 left-[12.5%] right-[12.5%] h-px bg-gray-200"
// after (5-column centres are at 10% / 30% / 50% / 70% / 90%)
className="absolute top-0 left-[10%] right-[10%] h-px bg-gray-200"
```
Leave `sm:grid-cols-2` as-is (2-up on tablet is fine). Cards already have `min-h-[260px]`; with 5 columns they get narrower — confirm the agent name/role still fit (they do at `compact`).

---

## 2. Data-model changes · `src/data/inventoryMockData.ts`

### 2a. Make category runtime-editable
Categories must be addable at runtime, so relax the strict union to a string and ship a seed list:
```ts
// before
export type SkuCategory = 'Makeup' | 'Skincare' | 'Haircare' | 'Fragrance' | 'Apparel';
// after
export type SkuCategory = string; // free-form so new categories can be added in-session
export const INITIAL_CATEGORIES: string[] = ['Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Apparel'];
```
(`StockedSku.category` / `OnDemandSku.category` stay typed `SkuCategory` — no other edits needed since it's now `string`.)

### 2b. Derivation + id helpers
```ts
export function computeCoverDays(onHand: number, weeklyForecast: number): number {
  if (weeklyForecast <= 0) return 999;
  return Math.round((onHand / weeklyForecast) * 7);
}

export function deriveStockedStatus(onHand: number, reorderPoint: number, coverDays: number): StockedStatus {
  if (coverDays < 7 || onHand <= Math.round(reorderPoint * 0.5)) return 'stockout-risk';
  if (onHand <= reorderPoint) return 'reorder';
  if (coverDays > 120) return 'overstock';
  return 'healthy';
}

/** Next sequential id like 's9' / 'd8' / 'sup7' from an existing list. */
export function nextId(prefix: string, existing: { id: string }[]): string {
  const max = existing.reduce((m, x) => {
    const match = x.id.match(/(\d+)$/);
    return Math.max(m, match ? parseInt(match[1], 10) : 0);
  }, 0);
  return `${prefix}${max + 1}`;
}
```

### 2c. Expiry & batch dataset (for §9)
```ts
export interface ExpiryBatch {
  id: string;
  product: string;
  brand: string;
  batch: string;        // lot number
  units: number;
  expiry: string;       // human label, e.g. 'Sep 2026'
  daysLeft: number;
  value: number;        // INR
  suggestedAction: string;
}

export const EXPIRY_BATCHES: ExpiryBatch[] = [
  { id: 'b1', product: 'Leave-In Molecular Mask 50ml', brand: 'K18',            batch: 'K18-LOT-2407', units: 14, expiry: 'Sep 2026', daysLeft: 78,  value: 42000, suggestedAction: 'Bundle with Maya' },
  { id: 'b2', product: 'Leave-In Molecular Mask 50ml', brand: 'K18',            batch: 'K18-LOT-2409', units: 8,  expiry: 'Sep 2026', daysLeft: 82,  value: 22000, suggestedAction: 'Bundle with Maya' },
  { id: 'b3', product: 'Premier Cru The Cream',        brand: 'Caudalie',       batch: 'CAU-2403',     units: 6,  expiry: 'Nov 2026', daysLeft: 151, value: 58800, suggestedAction: 'Monitor' },
  { id: 'b4', product: 'Unseen Sunscreen SPF40',       brand: 'Supergoop!',     batch: 'SG-2405',      units: 9,  expiry: 'Oct 2026', daysLeft: 115, value: 34200, suggestedAction: 'Monitor' },
  { id: 'b5', product: 'Protini Polypeptide Cream',    brand: 'Drunk Elephant', batch: 'DE-2402',      units: 7,  expiry: 'Dec 2026', daysLeft: 170, value: 37800, suggestedAction: 'Monitor' },
];
```
(The two K18 batches = ₹64K within 90 days — matches the "2 batches expiring <90d" line on the Overview KPI, so keep those two under 90 and the rest over.)

---

## 3. Refactor `InventoryScreen.tsx` to hold state

Convert the screen from reading module constants to owning state, and pass data + handlers into the tab renderers. Keep the existing tab JSX; only change where the data and the new buttons come from.

```tsx
import React, { useState } from 'react';
// add to existing lucide import: Pencil, Plus
import {
  INVENTORY_KPI, STOCKED_SKUS, ON_DEMAND_SKUS, REPLENISHMENT_POS, INVENTORY_ALERTS,
  INITIAL_CATEGORIES, SUPPLIERS, EXPIRY_BATCHES,
  computeCoverDays, deriveStockedStatus, nextId, inr,
  type StockedSku, type OnDemandSku, type SupplierScore, type FulfilModel,
  type StockedStatus, type SlaStatus, type PoStatus,
} from '../data/inventoryMockData';

export function InventoryScreen({ officeTab, onOfficeTabChange }: InventoryScreenProps) {
  const [stocked, setStocked]       = useState<StockedSku[]>(STOCKED_SKUS);
  const [onDemand, setOnDemand]     = useState<OnDemandSku[]>(ON_DEMAND_SKUS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers]   = useState<SupplierScore[]>(SUPPLIERS);

  const addCategory = (name: string) => {
    const v = name.trim();
    if (v && !categories.includes(v)) setCategories(c => [...c, v]);
  };

  const addSku = (draft: SkuDraft) => {
    if (draft.mode === 'stocked') {
      const coverDays = computeCoverDays(draft.onHand, draft.weeklyForecast);
      setStocked(list => [{
        id: nextId('s', list),
        product: draft.product, brand: draft.brand, category: draft.category, mrp: draft.mrp,
        onHand: draft.onHand, weeklyForecast: draft.weeklyForecast, coverDays,
        reorderPoint: draft.reorderPoint,
        status: deriveStockedStatus(draft.onHand, draft.reorderPoint, coverDays),
      }, ...list]);
    } else {
      setOnDemand(list => [{
        id: nextId('d', list),
        product: draft.product, brand: draft.brand, category: draft.category, mrp: draft.mrp,
        supplier: draft.supplier, ordersAwaiting: 0, leadTimeDays: draft.leadTimeDays,
        slaStatus: 'on-track',
      }, ...list]);
    }
  };

  const updateSku = (id: string, patch: { product: string; category: string; reorderPoint: number }) => {
    setStocked(list => list.map(s => {
      if (s.id !== id) return s;
      const status = deriveStockedStatus(s.onHand, patch.reorderPoint, s.coverDays);
      return { ...s, product: patch.product, category: patch.category, reorderPoint: patch.reorderPoint, status };
    }));
  };

  const addSupplier = (draft: Omit<SupplierScore, 'id' | 'openPos' | 'slaBreaches30d'>) => {
    setSuppliers(list => [...list, { ...draft, id: nextId('sup', list), openPos: 0, slaBreaches30d: 0 }]);
  };

  switch (officeTab) {
    case 'Overview':      return <OverviewTab onOfficeTabChange={onOfficeTabChange} />;
    case 'Stocked SKUs':  return <StockedSkusTab skus={stocked} categories={categories} onAddSku={addSku} onUpdateSku={updateSku} onAddCategory={addCategory} onOfficeTabChange={onOfficeTabChange} />;
    case 'On-demand':     return <OnDemandTab skus={onDemand} categories={categories} suppliers={suppliers} onAddSku={addSku} onAddCategory={addCategory} />;
    case 'Replenishment': return <ReplenishmentTab />;
    case 'Suppliers':     return <SuppliersTab suppliers={suppliers} onAddSupplier={addSupplier} />;
    case 'Expiry & Batch':return <ExpiryTab />;
    default:              return <OverviewTab onOfficeTabChange={onOfficeTabChange} />;
  }
}
```
`OverviewTab` and `ReplenishmentTab` are unchanged. Keep the existing pill/helper functions.

`SkuDraft` type (top of file):
```ts
type SkuDraft = {
  mode: FulfilModel; product: string; brand: string; category: string; mrp: number;
  onHand: number; weeklyForecast: number; reorderPoint: number;  // stocked
  supplier: string; leadTimeDays: number;                        // on-demand
};
```

---

## 4. Add-SKU flow (Drawer)

A shared `SkuFormDrawer` opened from a **+ Add SKU** button (`btn-primary h-9 px-4 text-[13px]`) placed in the `SectionHeader` of **Stocked SKUs** and **On-demand** via its `children` slot. Default the mode toggle to the current tab's model.

Drawer (reuse `Drawer` from `shared/ui`): title "Add product". Fields:
- **Fulfilment mode** — segmented toggle Stocked / On-demand (two buttons; active = `bg-purple-50 text-primary border-primary`). Switching it reveals the matching field group.
- **Product name** (text, required)
- **Brand** (text, required)
- **Category** — `<select>` of `categories`, plus the inline add control from §5.
- **MRP (₹)** (number)
- *If Stocked:* **On hand** (number), **Forecast / wk** (number), **Reorder point** (number). Show a live computed line: "Cover ≈ {computeCoverDays(onHand, forecast)} days · status will be {deriveStockedStatus(...)}".
- *If On-demand:* **Supplier** — `<select>` of `suppliers.map(s => s.name)` (free-type fallback ok), **Lead time (days)** (number).

Footer: **Add product** (`btn-primary`) → builds a `SkuDraft`, calls `onAddSku(draft)`, closes; **Cancel** (`btn-secondary`). Basic required-field guard (disable submit if name/brand empty). New row appears at the top of the relevant table immediately.

---

## 5. Add-category flow

Inside the Category field of the SKU drawer, add a small **+ New** ghost button next to the `<select>`. Clicking it swaps in a one-line text input + a check button; on confirm call `onAddCategory(value)`, then auto-select the new category. The new category is instantly available in every category dropdown (shared `categories` state). No separate page needed.

(Optional nicety: also expose **+ New** the same way in the Edit drawer's category select, since both use the same field component.)

---

## 6. Edit-SKU flow · Stocked SKUs table

Add a right-hand **Actions** column (or an icon button after Status). Per row render a ghost **Edit** button:
```tsx
<button type="button" onClick={() => openEdit(sku)} className="p-1.5 text-gray-400 hover:text-primary" aria-label="Edit product">
  <Pencil className="w-4 h-4" />
</button>
```
`openEdit` sets edit state and opens a drawer titled "Edit product" with only the three requested fields, pre-filled:
- **Product name** (text)
- **Category** (`<select>` of `categories`, + the §5 inline add)
- **Reorder point** (number)

Footer **Save changes** (`btn-primary`) → `onUpdateSku(sku.id, { product, category, reorderPoint })` (status re-derives from the new reorder point), then close. The row updates in place — if the new reorder point crosses on-hand, the Status pill changes accordingly.

(You can implement Add and Edit as one `SkuFormDrawer` with `mode: 'add' | 'edit'`, hiding all but the three fields in edit mode — whichever is cleaner.)

---

## 7. Add-supplier flow

On the **Suppliers** page header, an **+ Add supplier** button (`btn-primary h-9 px-4`) opens a `Drawer` titled "Add supplier" with: **Name**, **Brands covered**, **Avg lead (days)**, **Fill rate %**, **On-time %**. On submit call `onAddSupplier({...})` (id auto-generated; `openPos` and `slaBreaches30d` default 0) and close. New supplier appears in the table and becomes selectable in the Add-SKU on-demand supplier dropdown (shared `suppliers` state).

---

## 8. Suppliers page — `SuppliersTab` (replaces the placeholder)

```tsx
function fillClass(pct: number) { return pct >= 90 ? 'text-success' : pct >= 75 ? 'text-warning' : 'text-error'; }

function SuppliersTab({ suppliers, onAddSupplier }: { suppliers: SupplierScore[]; onAddSupplier: (d: Omit<SupplierScore,'id'|'openPos'|'slaBreaches30d'>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <SectionHeader title="Supplier scorecards" subtitle="Brand & authorised-stockist performance — Tara routes on-demand POs to the fastest reliable source">
        <button type="button" className="btn-primary h-9 px-4 text-[13px]" onClick={() => setOpen(true)}>+ Add supplier</button>
      </SectionHeader>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="py-3 font-medium">Supplier</th>
                <th className="py-3 font-medium">Brands covered</th>
                <th className="py-3 text-right font-medium">Avg lead</th>
                <th className="py-3 text-right font-medium">Fill rate</th>
                <th className="py-3 text-right font-medium">On-time</th>
                <th className="py-3 text-right font-medium">Open POs</th>
                <th className="py-3 text-right font-medium">SLA breaches (30d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 text-gray-700">{s.brandsCovered}</td>
                  <td className="py-3 text-right tabular-nums">{s.avgLeadDays} days</td>
                  <td className={cn('py-3 text-right tabular-nums font-medium', fillClass(s.fillRatePct))}>{s.fillRatePct}%</td>
                  <td className={cn('py-3 text-right tabular-nums font-medium', fillClass(s.onTimePct))}>{s.onTimePct}%</td>
                  <td className="py-3 text-right tabular-nums">{s.openPos}</td>
                  <td className="py-3 text-right tabular-nums">
                    {s.slaBreaches30d > 0
                      ? <span className="text-error font-semibold">{s.slaBreaches30d}</span>
                      : <span className="text-gray-400">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Add-supplier Drawer here (see §7) */}
    </div>
  );
}
```

---

## 9. Expiry & Batch page — `ExpiryTab` (replaces the placeholder)

Table from `EXPIRY_BATCHES` with a within-90-days summary and a cross-agent CTA to Maya (markdown/bundle).

```tsx
function daysClass(d: number) { return d < 60 ? 'text-error' : d < 90 ? 'text-warning' : 'text-gray-900'; }

function ExpiryTab() {
  const within90 = EXPIRY_BATCHES.filter(b => b.daysLeft < 90);
  const within90Value = within90.reduce((sum, b) => sum + b.value, 0);
  return (
    <div className="space-y-4">
      <SectionHeader title="Expiry & batch tracking" subtitle="Shelf-life watch on held beauty stock — flagged inside 90 days">
        <button type="button" className="btn-secondary h-9 px-4 text-[13px]">Propose markdown with Maya</button>
      </SectionHeader>
      <Card className="border-l-4 border-l-warning">
        <p className="text-[13px] text-gray-700">
          <span className="font-semibold text-gray-900">{within90.length} batches ({inr(within90Value)})</span> expire within 90 days. Tara suggests clearing them with a bundle or markdown before they become dead stock.
        </p>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="py-3 font-medium">Product</th>
                <th className="py-3 font-medium">Brand</th>
                <th className="py-3 font-medium">Batch</th>
                <th className="py-3 text-right font-medium">Units</th>
                <th className="py-3 font-medium">Expiry</th>
                <th className="py-3 text-right font-medium">Days left</th>
                <th className="py-3 text-right font-medium">Value</th>
                <th className="py-3 font-medium">Suggested action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {EXPIRY_BATCHES.map(b => (
                <tr key={b.id} className={cn(b.daysLeft < 90 && 'bg-warning-50/40')}>
                  <td className="py-3 font-medium text-gray-900">{b.product}</td>
                  <td className="py-3 text-gray-700">{b.brand}</td>
                  <td className="py-3 text-gray-500 tabular-nums">{b.batch}</td>
                  <td className="py-3 text-right tabular-nums">{b.units}</td>
                  <td className="py-3 text-gray-700">{b.expiry}</td>
                  <td className={cn('py-3 text-right tabular-nums font-medium', daysClass(b.daysLeft))}>{b.daysLeft}d</td>
                  <td className="py-3 text-right tabular-nums">{inr(b.value)}</td>
                  <td className="py-3 text-gray-700">{b.suggestedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
```
Remove the two `OfficePlaceholder` cases for `Suppliers` and `Expiry & Batch` (the new tabs replace them); the `OfficePlaceholder` import can go if now unused.

---

## 10. Design guardrails
- Reuse `Drawer`, `Card`, `SectionHeader`, `StatusPill`, `btn-primary`, `btn-secondary`, `card`, and existing tokens (`text-error/warning/success`, `bg-purple-50`, `text-primary`, `bg-warning-50`, etc.). No new palette, no serif/italic.
- Forms: labels `text-[13px] font-medium text-gray-700`, inputs match the app's existing input styling (copy from `VendorsScreen` drawers). Numbers `tabular-nums`.
- All money via `inr()`. In-memory state only — **no localStorage**.

## 11. Acceptance criteria
1. **Manage my team** roster shows all 5 reports (Priya, Rohan, Maya, Ankita, Tara) on one row at desktop width; the org-chart connector lines still line up.
2. **+ Add SKU** on Stocked SKUs and On-demand opens a drawer; adding a stocked product (with on-hand/forecast/reorder) inserts a row with correct cover-days and an auto-derived status pill; adding an on-demand product inserts a row with the chosen supplier and lead time.
3. The drawer's **+ New** category control adds a category that immediately appears in the dropdown and is selectable; the added SKU shows it.
4. Each **Stocked SKUs** row has an **Edit** (pencil) action; editing name/category/reorder point updates the row in place, and changing the reorder point re-derives the Status pill.
5. **Suppliers** page renders the scorecard table with fill-rate/on-time colouring and a working **+ Add supplier** drawer; a new supplier appears in the table and in the on-demand supplier dropdown.
6. **Expiry & Batch** page renders the batch table with the within-90-days summary (2 batches · ₹64K), days-left colouring, and the "Propose markdown with Maya" button.
7. Adds/edits persist while switching between Tara's tabs (state lives in `InventoryScreen`). `npm run build` / `tsc` passes; no other agent's office regresses.

## 12. Out of scope
Wiring approvals to real POs, deleting SKUs/suppliers, server persistence, and making the Maya/markdown button do more than sit there. Leave for a later pass.
