# Prompt — Inventory (Tara) · Iteration 3: supplier POC, edit on-hand, KPI fix

**For:** Cursor, in `coworker-for-d2c-brands_v3/`.
**Builds on:** iterations 1–2 (already implemented). Files touched: `src/data/inventoryMockData.ts`, `src/components/InventoryScreen.tsx` only.

Three changes:
1. Add a point-of-contact (name, email, phone) to every supplier so Tara can reach out directly.
2. Let **Edit product** change **On hand** too (re-derives cover days + status).
3. Fix the Overview "orders awaiting" KPI to compute from data (currently hardcoded to 11; the On-demand table sums to 12).

> Reuse existing primitives (`Drawer`, `Card`, `SectionHeader`, `INPUT`, `LABEL`, `cn`) and tokens. No new palette. In-memory state only.

---

## 1. Supplier POC (name / email / phone)

### 1a. `inventoryMockData.ts` — extend the interface
```ts
export interface SupplierScore {
  id: string;
  name: string;
  brandsCovered: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  avgLeadDays: number;
  fillRatePct: number;
  onTimePct: number;
  openPos: number;
  slaBreaches30d: number;
}
```

### 1b. `inventoryMockData.ts` — replace the `SUPPLIERS` array with POC data
(Fictional demo contacts — `.example` domains are intentionally non-resolving; swap for real distributor contacts later.)
```ts
export const SUPPLIERS: SupplierScore[] = [
  { id: 'sup1', name: 'Chanel India (authorised)', brandsCovered: 'Chanel Beauty', pocName: 'Rohan Mehta',     pocEmail: 'rohan.mehta@chanel-india.example',   pocPhone: '+91 98200 11223', avgLeadDays: 9,  fillRatePct: 96, onTimePct: 88, openPos: 2, slaBreaches30d: 0 },
  { id: 'sup2', name: 'D&G Beauty India',          brandsCovered: 'Dolce & Gabbana', pocName: 'Anjali Rao',     pocEmail: 'anjali.rao@dg-beauty.example',        pocPhone: '+91 98330 44556', avgLeadDays: 8,  fillRatePct: 82, onTimePct: 71, openPos: 1, slaBreaches30d: 2 },
  { id: 'sup3', name: 'Chantecaille UK',           brandsCovered: 'Chantecaille',    pocName: 'Emma Clarke',    pocEmail: 'emma.clarke@chantecaille-uk.example', pocPhone: '+44 20 7946 0102', avgLeadDays: 14, fillRatePct: 90, onTimePct: 79, openPos: 2, slaBreaches30d: 1 },
  { id: 'sup4', name: 'Caudalie Distribution',     brandsCovered: 'Caudalie',        pocName: 'Pierre Dubois',  pocEmail: 'p.dubois@caudalie-dist.example',      pocPhone: '+33 1 70 18 99 01', avgLeadDays: 7,  fillRatePct: 98, onTimePct: 95, openPos: 1, slaBreaches30d: 0 },
  { id: 'sup5', name: 'Gymshark UK',               brandsCovered: 'Gymshark',        pocName: 'Liam Patel',     pocEmail: 'liam.patel@gymshark-uk.example',      pocPhone: '+44 121 296 5000', avgLeadDays: 16, fillRatePct: 85, onTimePct: 74, openPos: 1, slaBreaches30d: 1 },
  { id: 'sup6', name: 'Olaplex India distributor', brandsCovered: 'Olaplex',         pocName: 'Sneha Kulkarni', pocEmail: 'sneha.k@olaplex-india.example',       pocPhone: '+91 99670 88990', avgLeadDays: 6,  fillRatePct: 97, onTimePct: 93, openPos: 3, slaBreaches30d: 0 },
];
```

### 1c. `InventoryScreen.tsx` — collect POC in `AddSupplierDrawer`
Add state, reset, and fields. Because the `onAddSupplier` draft type is `Omit<SupplierScore,'id'|'openPos'|'slaBreaches30d'>`, it now requires the three POC fields — TS will enforce this.

Add state (with the others):
```tsx
const [pocName, setPocName]   = useState('');
const [pocEmail, setPocEmail] = useState('');
const [pocPhone, setPocPhone] = useState('');
```
Reset in the `useEffect(..., [isOpen])` block:
```tsx
setPocName(''); setPocEmail(''); setPocPhone('');
```
Include in `handleSubmit`'s `onAddSupplier({...})`:
```tsx
onAddSupplier({
  name: name.trim(),
  brandsCovered: brandsCovered.trim(),
  pocName: pocName.trim(),
  pocEmail: pocEmail.trim(),
  pocPhone: pocPhone.trim(),
  avgLeadDays, fillRatePct, onTimePct,
});
```
Add three fields after "Brands covered" (before "Avg lead"):
```tsx
<div>
  <label className={LABEL}>POC name</label>
  <input value={pocName} onChange={e => setPocName(e.target.value)} className={INPUT} />
</div>
<div>
  <label className={LABEL}>POC email</label>
  <input type="email" value={pocEmail} onChange={e => setPocEmail(e.target.value)} className={INPUT} />
</div>
<div>
  <label className={LABEL}>POC phone</label>
  <input type="tel" value={pocPhone} onChange={e => setPocPhone(e.target.value)} className={INPUT} />
</div>
```
(Optionally extend `canSubmit` to also require `pocEmail.trim() !== ''` so Tara always has a way to reach out.)

### 1d. `InventoryScreen.tsx` — show POC in `SuppliersTab` table
Add a **Contact (POC)** column header after "Brands covered":
```tsx
<th className="py-3 font-medium">Contact (POC)</th>
```
And the matching cell in each row (after the `brandsCovered` cell) — email/phone are click-to-contact so Tara (or you) can reach out in one tap:
```tsx
<td className="py-3">
  <div className="text-gray-900">{s.pocName}</div>
  <div className="text-[12px]"><a href={`mailto:${s.pocEmail}`} className="text-gray-500 hover:text-primary hover:underline">{s.pocEmail}</a></div>
  <div className="text-[12px]"><a href={`tel:${s.pocPhone.replace(/\s/g, '')}`} className="text-gray-500 hover:text-primary">{s.pocPhone}</a></div>
</td>
```
Update the subtitle to reflect the new capability:
```tsx
subtitle="Brand & authorised-stockist performance & contacts — Tara routes on-demand POs and chases SLAs with the POC directly"
```

---

## 2. Edit product → also edit On hand

In `SkuFormDrawer`:

### 2a. Seed on-hand + forecast when opening in edit mode
In the `useEffect`, the `mode === 'edit'` branch currently sets product/category/reorderPoint. Add:
```tsx
setOnHand(editSku.onHand);
setWeeklyForecast(editSku.weeklyForecast);
```
(Forecast isn't user-editable here, but seeding it lets cover-days/status recompute correctly.)

### 2b. Render "On hand" in edit mode (Forecast stays add-only)
Replace the stocked-fields block (the `{(mode === 'edit' || (mode === 'add' && fulfilModel === 'stocked')) && (...)}` group) with:
```tsx
{(mode === 'edit' || (mode === 'add' && fulfilModel === 'stocked')) && (
  <>
    <div>
      <label className={LABEL}>On hand</label>
      <input type="number" value={onHand || ''} onChange={e => setOnHand(Number(e.target.value))} className={cn(INPUT, 'tabular-nums')} min={0} />
    </div>
    {mode === 'add' && (
      <div>
        <label className={LABEL}>Forecast / wk</label>
        <input type="number" value={weeklyForecast || ''} onChange={e => setWeeklyForecast(Number(e.target.value))} className={cn(INPUT, 'tabular-nums')} min={0} />
      </div>
    )}
    <div>
      <label className={LABEL}>Reorder point</label>
      <input type="number" value={reorderPoint || ''} onChange={e => setReorderPoint(Number(e.target.value))} className={cn(INPUT, 'tabular-nums')} min={0} />
    </div>
    {weeklyForecast > 0 && (
      <p className="text-[12px] text-gray-500">
        Cover ≈ {coverDays} days · status will be{' '}
        <span className="font-medium text-gray-700">{derivedStatus.replace('-', ' ')}</span>
      </p>
    )}
  </>
)}
```
(This shows On hand in both add-stocked and edit, keeps Forecast add-only, and shows the live cover/status hint in edit too — handy when changing on-hand.)

### 2c. Pass `onHand` through on save
In `handleSubmit`, the edit branch:
```tsx
onUpdateSku(editSku.id, { product: product.trim(), category, reorderPoint, onHand });
```

### 2d. Widen the patch type (3 places) + recompute in the handler
Update the `onUpdateSku` patch type everywhere it appears — `SkuFormDrawer` props and `StockedSkusTab` props — to:
```ts
onUpdateSku: (id: string, patch: { product: string; category: string; reorderPoint: number; onHand: number }) => void;
```
And the `updateSku` handler in `InventoryScreen` (recompute cover days + status from the new on-hand):
```ts
const updateSku = (
  id: string,
  patch: { product: string; category: string; reorderPoint: number; onHand: number }
) => {
  setStocked(list => list.map(s => {
    if (s.id !== id) return s;
    const coverDays = computeCoverDays(patch.onHand, s.weeklyForecast);
    const status = deriveStockedStatus(patch.onHand, patch.reorderPoint, coverDays);
    return { ...s, product: patch.product, category: patch.category, reorderPoint: patch.reorderPoint, onHand: patch.onHand, coverDays, status };
  }));
};
```
`OnDemandTab` passes `onUpdateSku={() => {}}` — leave as-is (a no-op accepts the new signature).

---

## 3. Fix the Overview "orders awaiting" KPI (compute from data)

Currently `OverviewTab` renders the hardcoded `INVENTORY_KPI.onDemandOpen.value` ("11 orders"), but the On-demand list sums to 12. Pass the on-demand list in and compute it.

`OverviewTab` signature + computed value:
```tsx
function OverviewTab({ onDemand, onOfficeTabChange }: { onDemand: OnDemandSku[]; onOfficeTabChange?: (tab: string) => void }) {
  const onDemandAwaiting = onDemand.reduce((n, s) => n + s.ordersAwaiting, 0);
  ...
```
Replace the on-demand KPI card body:
```tsx
<Card>
  <div className="text-[20px] font-bold text-gray-900">{onDemandAwaiting} orders</div>
  <div className="text-[12px] text-gray-500 mt-1">awaiting brand-stockist dispatch</div>
</Card>
```
Pass `onDemand` where `OverviewTab` is rendered (both the `'Overview'` case and the `default` case):
```tsx
case 'Overview':
  return <OverviewTab onDemand={onDemand} onOfficeTabChange={onOfficeTabChange} />;
...
default:
  return <OverviewTab onDemand={onDemand} onOfficeTabChange={onOfficeTabChange} />;
```
(You can drop `onDemandOpen` from `INVENTORY_KPI` or leave it unused.)

---

## 4. Acceptance criteria
1. **Suppliers** table shows a Contact (POC) column with name, clickable email (`mailto:`) and phone (`tel:`) for all 6 seeded suppliers.
2. **Add supplier** drawer captures POC name/email/phone; a newly added supplier shows its POC in the table.
3. **Edit product** drawer includes an **On hand** field (pre-filled); saving a changed on-hand updates the row's On hand, recomputes Cover, and re-derives the Status pill (e.g., raising on-hand well above the reorder point flips "Stockout risk" → "Healthy").
4. Editing still updates name, category, and reorder point as before.
5. **Overview** on-demand KPI reads the live sum of "Orders awaiting" (12 with seed data) and updates if on-demand SKUs change.
6. `tsc` / `npm run build` passes; no other tab regresses.

## 5. Out of scope
Per-PO contact history, sending real emails, editing forecast/brand/MRP in edit mode, and supplier edit/delete. Later passes.
