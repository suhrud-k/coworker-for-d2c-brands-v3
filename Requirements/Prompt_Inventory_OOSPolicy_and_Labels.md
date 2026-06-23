# Prompt — Inventory (Tara) · Iteration 4: out-of-stock policy, drop fill/on-time, agent labels

**For:** Cursor, in `coworker-for-d2c-brands_v3/`.
**Builds on:** iterations 1–3. Files touched: `src/data/inventoryMockData.ts`, `src/components/InventoryScreen.tsx`, `src/data/agentsMockData.ts`, `src/data/threadStatusMockData.ts`.

Three changes:
1. Per-SKU **out-of-stock behaviour** — "Reject order" or "Accept (backorder)" — settable for every stocked SKU.
2. **Remove** fill rate % and on-time % from suppliers (for now).
3. **Agent labels** — drop the "Awaiting" badge on Ankita; shorten role labels to Vendor / Recon / Marketing / Compliance / Inventory.

> Reuse existing primitives and tokens. In-memory state only.

---

## 1. Out-of-stock behaviour (per SKU)

When a stocked SKU runs out, the merchant decides what happens to a new customer order: **Reject** (show out of stock) or **Accept (backorder)** — accept the order and fulfil it via an on-demand supplier PO. This is set per SKU in the Add/Edit drawer and shown in the Stocked SKUs table, with a global default for new SKUs.

### 1a. `inventoryMockData.ts` — type, field, default
```ts
export type OutOfStockBehaviour = 'reject' | 'accept';

export interface StockedSku {
  id: string;
  product: string;
  brand: string;
  category: SkuCategory;
  mrp: number;
  onHand: number;
  weeklyForecast: number;
  coverDays: number;
  reorderPoint: number;
  status: StockedStatus;
  outOfStockBehaviour: OutOfStockBehaviour;   // NEW
  expiryFlag?: boolean;
}

/** Default applied to new stocked SKUs (merchant can override per SKU). */
export const DEFAULT_OOS_BEHAVIOUR: OutOfStockBehaviour = 'reject';
```

### 1b. `inventoryMockData.ts` — seed `outOfStockBehaviour` on each stocked SKU
Add the key to every `STOCKED_SKUS` row (mix shows both states):
- `s1` Pillow Talk → `'accept'`
- `s2` Flawless Filter → `'accept'`
- `s3` Unseen Sunscreen → `'accept'`
- `s4` Olaplex No.3 → `'accept'`
- `s5` Protini Cream → `'reject'`
- `s6` K18 Mask → `'reject'`
- `s7` Dior Lip Glow Oil → `'reject'`
- `s8` Shape Tape Concealer → `'reject'`

### 1c. `InventoryScreen.tsx` — `SkuDraft` + drawer
Add to `SkuDraft`:
```ts
outOfStockBehaviour: OutOfStockBehaviour;
```
In `SkuFormDrawer`, add state and wire it:
```tsx
const [oos, setOos] = useState<OutOfStockBehaviour>(DEFAULT_OOS_BEHAVIOUR);
```
- Edit-seeding branch of the `useEffect`: `setOos(editSku.outOfStockBehaviour);`
- Add-reset branch: `setOos(DEFAULT_OOS_BEHAVIOUR);`
- `handleSubmit` edit branch: add `outOfStockBehaviour: oos` to the `onUpdateSku` patch.
- `handleSubmit` add branch: add `outOfStockBehaviour: oos` to the `onAddSku` draft.

Render the control **inside the stocked-fields group** (the `{(mode === 'edit' || (mode === 'add' && fulfilModel === 'stocked')) && (...)}` block, e.g. after the reorder-point field / cover hint):
```tsx
<div>
  <label className={LABEL}>If out of stock</label>
  <div className="flex gap-2 mt-1">
    {(['reject', 'accept'] as OutOfStockBehaviour[]).map(b => (
      <button key={b} type="button" onClick={() => setOos(b)}
        className={cn('flex-1 h-9 px-3 text-[13px] font-medium border rounded-[6px] transition-colors',
          oos === b ? 'bg-purple-50 text-primary border-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
        {b === 'reject' ? 'Reject order' : 'Accept (backorder)'}
      </button>
    ))}
  </div>
</div>
```

### 1d. `InventoryScreen.tsx` — widen patch + handler + add-handler
`onUpdateSku` patch type (in `SkuFormDrawer` props **and** `StockedSkusTab` props):
```ts
onUpdateSku: (id: string, patch: { product: string; category: string; reorderPoint: number; onHand: number; outOfStockBehaviour: OutOfStockBehaviour }) => void;
```
`updateSku` handler — carry the new field through:
```ts
const updateSku = (id, patch) => {
  setStocked(list => list.map(s => {
    if (s.id !== id) return s;
    const coverDays = computeCoverDays(patch.onHand, s.weeklyForecast);
    const status = deriveStockedStatus(patch.onHand, patch.reorderPoint, coverDays);
    return { ...s, product: patch.product, category: patch.category, reorderPoint: patch.reorderPoint, onHand: patch.onHand, outOfStockBehaviour: patch.outOfStockBehaviour, coverDays, status };
  }));
};
```
`addSku` stocked branch — set `outOfStockBehaviour: draft.outOfStockBehaviour` on the new object. (On-demand branch ignores it.)
Import `OutOfStockBehaviour` and `DEFAULT_OOS_BEHAVIOUR` from the data module.

### 1e. `InventoryScreen.tsx` — show it in the Stocked SKUs table
Add a header between **Status** and **Actions**:
```tsx
<th className="py-3 font-medium">If out of stock</th>
```
And the cell in each row (between the status cell and the actions cell):
```tsx
<td className="py-3">
  {sku.outOfStockBehaviour === 'accept'
    ? <StatusPill status="info" text="Accept (backorder)" />
    : <StatusPill status="slate" text="Reject" />}
</td>
```

---

## 2. Remove fill rate % and on-time %

Delete these two metrics everywhere (data and UI):

- **`inventoryMockData.ts`** — remove `fillRatePct` and `onTimePct` from the `SupplierScore` interface, and delete those two keys from every row in `SUPPLIERS`.
- **`InventoryScreen.tsx` · `AddSupplierDrawer`** — remove the `fillRatePct`/`onTimePct` `useState` lines, their two `<input>` field blocks ("Fill rate %", "On-time %"), their resets in the `useEffect`, and their keys in the `onAddSupplier({...})` payload.
- **`InventoryScreen.tsx` · `SuppliersTab`** — remove the "Fill rate" and "On-time" `<th>` headers and the two corresponding `<td>` cells.
- **`InventoryScreen.tsx`** — delete the now-unused `fillClass` helper function.

Resulting `SupplierScore`:
```ts
export interface SupplierScore {
  id: string;
  name: string;
  brandsCovered: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  avgLeadDays: number;
  openPos: number;
  slaBreaches30d: number;
}
```
(If the POC prompt — `Prompt_Inventory_SupplierPOC_and_Edits.md` — hasn't been applied yet, apply it together; the POC fields above come from it.)

Suppliers table columns after this change: Supplier · Brands covered · Contact (POC) · Avg lead · Open POs · SLA breaches (30d).

---

## 3. Agent labels

### 3a. `agentsMockData.ts` — Ankita active + short role labels
- Ankita: change `status: 'awaiting'` → `status: 'active'` (removes the "Awaiting" badge on her roster card).
- Shorten `role` values:
  - Priya: `'Vendor Management'` → `'Vendor'`
  - Rohan: `'Reconciliation'` → `'Recon'`
  - Maya: `'Marketing Efficiency'` → `'Marketing'`
  - Ankita: `'Compliance'` → `'Compliance'` (unchanged)
  - Tara: `'Inventory & Supply'` → `'Inventory'`
  - Krishan: `'AI CFO'` (unchanged)

These `role` strings render on the roster cards and office headers (`{agent.name} · {agent.role}`), so the labels update everywhere.

### 3b. `threadStatusMockData.ts` — align status-rail titles (consistency)
So the home status rail uses the same short labels:
- `reconciliation` thread `title`: `'Reconciliation'` → `'Recon'`
- `vendors` thread `title`: `'Vendors'` → `'Vendor'`
- `marketing` → `'Marketing'`, `compliance` → `'Compliance'`, `inventory` → `'Inventory'` (already correct)

(Optional but recommended for a consistent demo; skip 3b if you want the status rail to keep longer titles.)

---

## 4. Acceptance criteria
1. Add/Edit product (stocked) shows an **If out of stock** toggle (Reject / Accept (backorder)); the choice persists and shows in the table.
2. Stocked SKUs table has an **If out of stock** column rendering "Reject" or "Accept (backorder)" per SKU; seeded mix is visible.
3. Editing a SKU can change the out-of-stock behaviour (and still edits name, category, reorder point, on-hand).
4. New SKUs default to `DEFAULT_OOS_BEHAVIOUR` (reject) in the form.
5. Suppliers table and Add-supplier drawer no longer show fill rate % or on-time %; `fillClass` is gone; build is clean (no unused-symbol or type errors).
6. Ankita's roster card no longer shows "Awaiting"; she reads as active like the others.
7. Roster cards / office headers read Priya · Vendor, Rohan · Recon, Maya · Marketing, Ankita · Compliance, Tara · Inventory.
8. (If 3b applied) the home status rail shows Recon and Vendor.
9. `tsc` / `npm run build` passes; no tab regresses.

## 5. Out of scope
Enforcing the out-of-stock behaviour in a real checkout, a global OOS default editor in Policies (the constant covers it for now), and re-introducing supplier quality metrics later.
