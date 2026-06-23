import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Truck,
  TrendingUp,
  Pencil,
  Check,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionHeader, StatusPill, Drawer } from './shared/ui';
import {
  INVENTORY_KPI,
  STOCKED_SKUS,
  ON_DEMAND_SKUS,
  REPLENISHMENT_POS,
  INVENTORY_ALERTS,
  INITIAL_CATEGORIES,
  SUPPLIERS,
  EXPIRY_BATCHES,
  DEFAULT_OOS_BEHAVIOUR,
  computeCoverDays,
  deriveStockedStatus,
  nextId,
  inr,
  type StockedSku,
  type OnDemandSku,
  type SupplierScore,
  type FulfilModel,
  type StockedStatus,
  type SlaStatus,
  type PoStatus,
  type OutOfStockBehaviour,
} from '../data/inventoryMockData';

type InventoryScreenProps = {
  officeTab: string;
  embedded?: boolean;
  onOfficeTabChange?: (tab: string) => void;
};

type SkuDraft = {
  mode: FulfilModel;
  product: string;
  brand: string;
  category: string;
  mrp: number;
  onHand: number;
  weeklyForecast: number;
  reorderPoint: number;
  outOfStockBehaviour: OutOfStockBehaviour;
  supplier: string;
  leadTimeDays: number;
};

const INPUT = 'w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px] text-[13px]';
const LABEL = 'text-[13px] font-medium text-gray-700';

function stockedStatusPill(status: StockedStatus, expiryFlag?: boolean) {
  const map: Record<StockedStatus, { status: 'error' | 'warning' | 'slate' | 'success'; text: string }> = {
    'stockout-risk': { status: 'error', text: 'Stockout risk' },
    reorder: { status: 'warning', text: 'At reorder point' },
    overstock: { status: 'slate', text: 'Overstocked' },
    healthy: { status: 'success', text: 'Healthy' },
  };
  const pill = map[status];
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      <StatusPill status={pill.status} text={pill.text} />
      {expiryFlag && <StatusPill status="warning" text="Expiry watch" />}
    </div>
  );
}

function slaStatusPill(status: SlaStatus) {
  const map: Record<SlaStatus, { status: 'success' | 'warning' | 'error'; text: string }> = {
    'on-track': { status: 'success', text: 'On track' },
    'at-risk': { status: 'warning', text: 'At risk' },
    breached: { status: 'error', text: 'Breached' },
  };
  const pill = map[status];
  return <StatusPill status={pill.status} text={pill.text} />;
}

function poStatusPill(status: PoStatus) {
  const map: Record<PoStatus, { status: 'warning' | 'info' | 'success'; text: string }> = {
    'awaiting-approval': { status: 'warning', text: 'Awaiting approval' },
    'auto-placed': { status: 'info', text: 'Auto-placed (within band)' },
    'sent-to-priya': { status: 'success', text: 'Sent to Priya' },
  };
  const pill = map[status];
  return <StatusPill status={pill.status} text={pill.text} />;
}

function coverDaysClass(days: number) {
  if (days < 7) return 'text-error';
  if (days < 14) return 'text-warning';
  return 'text-gray-900';
}

function daysClass(d: number) {
  return d < 60 ? 'text-error' : d < 90 ? 'text-warning' : 'text-gray-900';
}

function alertIcon(severity: 'amber' | 'rose' | 'info') {
  if (severity === 'rose') return <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />;
  if (severity === 'amber') return <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />;
  return <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
}

function CategoryField({
  categories,
  value,
  onChange,
  onAddCategory,
}: {
  categories: string[];
  value: string;
  onChange: (v: string) => void;
  onAddCategory: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const confirmNew = () => {
    const v = newName.trim();
    if (v) {
      onAddCategory(v);
      onChange(v);
      setNewName('');
      setAdding(false);
    }
  };

  if (adding) {
    return (
      <div className="flex gap-2 mt-1">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className={cn(INPUT, 'mt-0 flex-1')}
          placeholder="New category name"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && confirmNew()}
        />
        <button type="button" onClick={confirmNew} className="h-9 px-3 border border-gray-200 rounded-[6px] text-primary hover:bg-purple-50">
          <Check className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => { setAdding(false); setNewName(''); }} className="h-9 px-3 text-[13px] text-gray-500 hover:text-gray-900">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-1">
      <select value={value} onChange={e => onChange(e.target.value)} className={cn(INPUT, 'mt-0 flex-1')}>
        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="h-9 px-3 text-[13px] text-gray-500 hover:text-primary whitespace-nowrap"
      >
        + New
      </button>
    </div>
  );
}

function SkuFormDrawer({
  isOpen,
  onClose,
  mode,
  defaultFulfilModel,
  categories,
  suppliers,
  editSku,
  onAddSku,
  onUpdateSku,
  onAddCategory,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  defaultFulfilModel?: FulfilModel;
  categories: string[];
  suppliers: SupplierScore[];
  editSku?: StockedSku | null;
  onAddSku: (draft: SkuDraft) => void;
  onUpdateSku: (id: string, patch: { product: string; category: string; reorderPoint: number; onHand: number; outOfStockBehaviour: OutOfStockBehaviour }) => void;
  onAddCategory: (name: string) => void;
}) {
  const [fulfilModel, setFulfilModel] = useState<FulfilModel>(defaultFulfilModel ?? 'stocked');
  const [product, setProduct] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [mrp, setMrp] = useState(0);
  const [onHand, setOnHand] = useState(0);
  const [weeklyForecast, setWeeklyForecast] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [oos, setOos] = useState<OutOfStockBehaviour>(DEFAULT_OOS_BEHAVIOUR);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && editSku) {
      setProduct(editSku.product);
      setCategory(editSku.category);
      setReorderPoint(editSku.reorderPoint);
      setOnHand(editSku.onHand);
      setWeeklyForecast(editSku.weeklyForecast);
      setOos(editSku.outOfStockBehaviour);
    } else {
      setFulfilModel(defaultFulfilModel ?? 'stocked');
      setProduct('');
      setBrand('');
      setCategory(categories[0] ?? '');
      setMrp(0);
      setOnHand(0);
      setWeeklyForecast(0);
      setReorderPoint(0);
      setSupplier(suppliers[0]?.name ?? '');
      setLeadTimeDays(7);
      setOos(DEFAULT_OOS_BEHAVIOUR);
    }
  }, [isOpen, mode, editSku, defaultFulfilModel, categories, suppliers]);

  const coverDays = computeCoverDays(onHand, weeklyForecast);
  const derivedStatus = deriveStockedStatus(onHand, reorderPoint, coverDays);

  const canSubmit =
    mode === 'edit'
      ? product.trim() !== '' && category !== ''
      : product.trim() !== '' && brand.trim() !== '' && category !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === 'edit' && editSku) {
      onUpdateSku(editSku.id, { product: product.trim(), category, reorderPoint, onHand, outOfStockBehaviour: oos });
    } else {
      onAddSku({
        mode: fulfilModel,
        product: product.trim(),
        brand: brand.trim(),
        category,
        mrp,
        onHand,
        weeklyForecast,
        reorderPoint,
        outOfStockBehaviour: oos,
        supplier,
        leadTimeDays,
      });
    }
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit product' : 'Add product'}>
      <div className="space-y-4">
        {mode === 'add' && (
          <div>
            <label className={LABEL}>Fulfilment mode</label>
            <div className="flex gap-2 mt-1">
              {(['stocked', 'on-demand'] as FulfilModel[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFulfilModel(m)}
                  className={cn(
                    'flex-1 h-9 px-3 text-[13px] font-medium border rounded-[6px] transition-colors',
                    fulfilModel === m
                      ? 'bg-purple-50 text-primary border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {m === 'stocked' ? 'Stocked' : 'On-demand'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className={LABEL}>Product name</label>
          <input value={product} onChange={e => setProduct(e.target.value)} className={INPUT} required />
        </div>

        {mode === 'add' && (
          <div>
            <label className={LABEL}>Brand</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} className={INPUT} required />
          </div>
        )}

        <div>
          <label className={LABEL}>Category</label>
          <CategoryField
            categories={categories}
            value={category}
            onChange={setCategory}
            onAddCategory={onAddCategory}
          />
        </div>

        {mode === 'add' && (
          <div>
            <label className={LABEL}>MRP (₹)</label>
            <input type="number" value={mrp || ''} onChange={e => setMrp(Number(e.target.value))} className={cn(INPUT, 'tabular-nums')} min={0} />
          </div>
        )}

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
            <div>
              <label className={LABEL}>If out of stock</label>
              <div className="flex gap-2 mt-1">
                {(['reject', 'accept'] as OutOfStockBehaviour[]).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setOos(b)}
                    className={cn(
                      'flex-1 h-9 px-3 text-[13px] font-medium border rounded-[6px] transition-colors',
                      oos === b
                        ? 'bg-purple-50 text-primary border-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {b === 'reject' ? 'Reject order' : 'Accept (backorder)'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === 'add' && fulfilModel === 'on-demand' && (
          <>
            <div>
              <label className={LABEL}>Supplier</label>
              <select value={supplier} onChange={e => setSupplier(e.target.value)} className={INPUT}>
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Lead time (days)</label>
              <input type="number" value={leadTimeDays || ''} onChange={e => setLeadTimeDays(Number(e.target.value))} className={cn(INPUT, 'tabular-nums')} min={1} />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-4">
          <button type="button" className="btn-primary h-9 px-4 text-[13px] flex-1" disabled={!canSubmit} onClick={handleSubmit}>
            {mode === 'edit' ? 'Save changes' : 'Add product'}
          </button>
          <button type="button" className="btn-secondary h-9 px-4 text-[13px]" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function AddSupplierDrawer({
  isOpen,
  onClose,
  onAddSupplier,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (draft: Omit<SupplierScore, 'id' | 'openPos' | 'slaBreaches30d'>) => void;
}) {
  const [name, setName] = useState('');
  const [brandsCovered, setBrandsCovered] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocEmail, setPocEmail] = useState('');
  const [pocPhone, setPocPhone] = useState('');
  const [avgLeadDays, setAvgLeadDays] = useState(7);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setBrandsCovered('');
      setPocName('');
      setPocEmail('');
      setPocPhone('');
      setAvgLeadDays(7);
    }
  }, [isOpen]);

  const canSubmit = name.trim() !== '' && brandsCovered.trim() !== '' && pocEmail.trim() !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAddSupplier({
      name: name.trim(),
      brandsCovered: brandsCovered.trim(),
      pocName: pocName.trim(),
      pocEmail: pocEmail.trim(),
      pocPhone: pocPhone.trim(),
      avgLeadDays,
    });
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Add supplier">
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className={INPUT} required />
        </div>
        <div>
          <label className={LABEL}>Brands covered</label>
          <input value={brandsCovered} onChange={e => setBrandsCovered(e.target.value)} className={INPUT} required />
        </div>
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
        <div>
          <label className={LABEL}>Avg lead (days)</label>
          <input type="number" value={avgLeadDays || ''} onChange={e => setAvgLeadDays(Number(e.target.value))} className={cn(INPUT, 'tabular-nums')} min={1} />
        </div>
        <div className="flex gap-2 pt-4">
          <button type="button" className="btn-primary h-9 px-4 text-[13px] flex-1" disabled={!canSubmit} onClick={handleSubmit}>
            Add supplier
          </button>
          <button type="button" className="btn-secondary h-9 px-4 text-[13px]" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function OverviewTab({ onDemand, onOfficeTabChange }: { onDemand: OnDemandSku[]; onOfficeTabChange?: (tab: string) => void }) {
  const onDemandAwaiting = onDemand.reduce((n, s) => n + s.ordersAwaiting, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-[20px] font-bold text-gray-900">{INVENTORY_KPI.valueHeld.value}</div>
          <div className="text-[12px] text-gray-500 mt-1">{INVENTORY_KPI.valueHeld.sub}</div>
        </Card>
        <Card className="border-l-4 border-l-error">
          <div className="text-[20px] font-bold text-gray-900">{INVENTORY_KPI.stockoutRisk.value}</div>
          <div className="text-[12px] text-gray-500 mt-1">{INVENTORY_KPI.stockoutRisk.sub}</div>
        </Card>
        <Card>
          <div className="text-[20px] font-bold text-gray-900">{onDemandAwaiting} orders</div>
          <div className="text-[12px] text-gray-500 mt-1">awaiting brand-stockist dispatch</div>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <div className="text-[20px] font-bold text-gray-900">{INVENTORY_KPI.capitalAtRisk.value}</div>
          <div className="text-[12px] text-gray-500 mt-1">{INVENTORY_KPI.capitalAtRisk.sub}</div>
        </Card>
      </div>

      <Card title="How Luxe by Kan fulfils">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Boxes className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-semibold text-gray-900">Stocked (hero SKUs)</div>
              <div className="text-[13px] text-gray-500 mt-1">64 SKUs · ₹48.6 L held · auto-replenished</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-semibold text-gray-900">On-demand (the long tail)</div>
              <div className="text-[13px] text-gray-500 mt-1">1,240 SKUs · ₹0 held · PO raised when a customer orders</div>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-gray-500 mt-4 pt-4 border-t border-gray-100">
          Tara forecasts and replenishes the 64; she routes and tracks supplier POs for the 1,240 — so capital only sits where it sells.
        </p>
      </Card>

      <div className="space-y-3">
        {INVENTORY_ALERTS.map(alert => (
          <Card key={alert.id} className="!flex-row !items-start !justify-between gap-4">
            <div className="flex gap-3 flex-1 min-w-0">
              {alertIcon(alert.severity)}
              <p className="text-[13px] text-gray-700 leading-relaxed">{alert.body}</p>
            </div>
            <button
              type="button"
              className="btn-secondary h-9 px-4 text-[13px] shrink-0"
              onClick={() => onOfficeTabChange?.(alert.officeTab)}
            >
              {alert.ctaLabel}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StockedSkusTab({
  skus,
  categories,
  suppliers,
  onAddSku,
  onUpdateSku,
  onAddCategory,
  onOfficeTabChange,
}: {
  skus: StockedSku[];
  categories: string[];
  suppliers: SupplierScore[];
  onAddSku: (draft: SkuDraft) => void;
  onUpdateSku: (id: string, patch: { product: string; category: string; reorderPoint: number; onHand: number; outOfStockBehaviour: OutOfStockBehaviour }) => void;
  onAddCategory: (name: string) => void;
  onOfficeTabChange?: (tab: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSku, setEditSku] = useState<StockedSku | null>(null);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Stocked hero SKUs"
        subtitle="Held inventory · AI demand forecast & dynamic reorder points"
      >
        <button type="button" className="btn-primary h-9 px-4 text-[13px]" onClick={() => setAddOpen(true)}>
          + Add SKU
        </button>
      </SectionHeader>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="py-3 font-medium">Product</th>
                <th className="py-3 font-medium">Brand</th>
                <th className="py-3 text-right font-medium">On hand</th>
                <th className="py-3 text-right font-medium">Forecast/wk</th>
                <th className="py-3 text-right font-medium">Cover</th>
                <th className="py-3 text-right font-medium">Reorder pt</th>
                <th className="py-3 text-right font-medium">Status</th>
                <th className="py-3 text-right font-medium">If out of stock</th>
                <th className="py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {skus.map(sku => (
                <tr key={sku.id} className={cn(sku.status === 'stockout-risk' && 'bg-error-50/40')}>
                  <td className="py-3">
                    <div className="font-medium text-gray-900">{sku.product}</div>
                    <div className="text-[12px] text-gray-400">{sku.category}</div>
                  </td>
                  <td className="py-3 text-gray-700">{sku.brand}</td>
                  <td className="py-3 text-right tabular-nums">{sku.onHand}</td>
                  <td className="py-3 text-right tabular-nums">{sku.weeklyForecast}</td>
                  <td className={cn('py-3 text-right tabular-nums font-medium', coverDaysClass(sku.coverDays))}>
                    {sku.coverDays}d
                  </td>
                  <td className="py-3 text-right tabular-nums">{sku.reorderPoint}</td>
                  <td className="py-3">{stockedStatusPill(sku.status, sku.expiryFlag)}</td>
                  <td className="py-3 text-right">
                    {sku.outOfStockBehaviour === 'accept'
                      ? <StatusPill status="info" text="Accept (backorder)" />
                      : <StatusPill status="slate" text="Reject" />}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditSku(sku)}
                      className="p-1.5 text-gray-400 hover:text-primary"
                      aria-label="Edit product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[13px] text-gray-500 px-1">
        Tara has drafted 2 replenishment POs from these signals →{' '}
        <button
          type="button"
          className="text-primary font-medium hover:underline"
          onClick={() => onOfficeTabChange?.('Replenishment')}
        >
          Replenishment
        </button>
      </p>

      <SkuFormDrawer
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        mode="add"
        defaultFulfilModel="stocked"
        categories={categories}
        suppliers={suppliers}
        onAddSku={onAddSku}
        onUpdateSku={onUpdateSku}
        onAddCategory={onAddCategory}
      />
      <SkuFormDrawer
        isOpen={editSku !== null}
        onClose={() => setEditSku(null)}
        mode="edit"
        categories={categories}
        suppliers={suppliers}
        editSku={editSku}
        onAddSku={onAddSku}
        onUpdateSku={onUpdateSku}
        onAddCategory={onAddCategory}
      />
    </div>
  );
}

function OnDemandTab({
  skus,
  categories,
  suppliers,
  onAddSku,
  onAddCategory,
}: {
  skus: OnDemandSku[];
  categories: string[];
  suppliers: SupplierScore[];
  onAddSku: (draft: SkuDraft) => void;
  onAddCategory: (name: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="On-demand fulfilment"
        subtitle="No stock held — PO routed to the brand/stockist when a customer orders"
      >
        <button type="button" className="btn-primary h-9 px-4 text-[13px]" onClick={() => setAddOpen(true)}>
          + Add SKU
        </button>
      </SectionHeader>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="py-3 font-medium">Product</th>
                <th className="py-3 font-medium">Brand</th>
                <th className="py-3 font-medium">Supplier</th>
                <th className="py-3 text-right font-medium">Orders awaiting</th>
                <th className="py-3 text-right font-medium">Lead time</th>
                <th className="py-3 text-right font-medium">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {skus.map(sku => (
                <tr key={sku.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{sku.product}</span>
                      {sku.graduationCandidate && (
                        <StatusPill status="info" text="Graduate to stocked?" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-gray-700">{sku.brand}</td>
                  <td className="py-3 text-gray-700">{sku.supplier}</td>
                  <td className="py-3 text-right tabular-nums font-semibold text-gray-900">{sku.ordersAwaiting}</td>
                  <td className="py-3 text-right tabular-nums">{sku.leadTimeDays} days</td>
                  <td className="py-3 text-right">{slaStatusPill(sku.slaStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <p className="text-[13px] text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">Graduation recommendation</span> — Olaplex No.7 Bonding Oil has sold ~14/wk on-demand for 6 weeks. Stocking ~60 units (₹0.9L) cuts delivery from ~8 days to same-day and lifts margin ~6 pts. Want Tara to draft the first stocking PO?
        </p>
        <button type="button" className="btn-primary h-9 px-4 text-[13px] mt-4">
          Draft stocking PO
        </button>
      </Card>

      <SkuFormDrawer
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        mode="add"
        defaultFulfilModel="on-demand"
        categories={categories}
        suppliers={suppliers}
        onAddSku={onAddSku}
        onUpdateSku={() => {}}
        onAddCategory={onAddCategory}
      />
    </div>
  );
}

function ReplenishmentTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Replenishment queue"
        subtitle="Auto-drafted POs · approved POs flow to Priya for payment"
      />
      <p className="text-[13px] text-gray-500 -mt-4 px-1">
        Tara raises POs automatically below your autonomy bands and holds the rest for approval. See bands in Manage my team → Policies.
      </p>
      <div className="space-y-4">
        {REPLENISHMENT_POS.map(po => (
          <Card key={po.id} className="!flex !flex-col !items-start text-left gap-3">
            <div className="flex items-center gap-3 flex-wrap w-full">
              <span className="text-[15px] font-bold text-gray-900">{po.id}</span>
              {poStatusPill(po.status)}
            </div>
            <div className="text-[14px] font-semibold text-gray-900">{po.supplier}</div>
            <div className="text-[13px] text-gray-700">{po.items}</div>
            <div className="text-[14px] font-semibold text-gray-900 tabular-nums">{inr(po.value)}</div>
            {po.note && <p className="text-[13px] text-gray-500">{po.note}</p>}
            {po.status === 'awaiting-approval' && (
              <div className="flex gap-2 mt-1">
                <button type="button" className="btn-primary h-9 px-4 text-[13px]">
                  Approve & send to Priya
                </button>
                <button type="button" className="btn-secondary h-9 px-4 text-[13px]">
                  Adjust qty
                </button>
              </div>
            )}
            {po.status === 'sent-to-priya' && (
              <p className="text-[12px] text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Now in Priya&apos;s Payment Runs.
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function SuppliersTab({
  suppliers,
  onAddSupplier,
}: {
  suppliers: SupplierScore[];
  onAddSupplier: (draft: Omit<SupplierScore, 'id' | 'openPos' | 'slaBreaches30d'>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Supplier scorecards"
        subtitle="Brand & authorised-stockist performance & contacts — Tara routes on-demand POs and chases SLAs with the POC directly"
      >
        <button type="button" className="btn-primary h-9 px-4 text-[13px]" onClick={() => setOpen(true)}>
          + Add supplier
        </button>
      </SectionHeader>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="py-3 font-medium">Supplier</th>
                <th className="py-3 font-medium">Brands covered</th>
                <th className="py-3 font-medium">Contact (POC)</th>
                <th className="py-3 text-right font-medium">Avg lead</th>
                <th className="py-3 text-right font-medium">Open POs</th>
                <th className="py-3 text-right font-medium">SLA breaches (30d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 text-gray-700">{s.brandsCovered}</td>
                  <td className="py-3">
                    <div className="text-gray-900">{s.pocName}</div>
                    <div className="text-[12px]"><a href={`mailto:${s.pocEmail}`} className="text-gray-500 hover:text-primary hover:underline">{s.pocEmail}</a></div>
                    <div className="text-[12px]"><a href={`tel:${s.pocPhone.replace(/\s/g, '')}`} className="text-gray-500 hover:text-primary">{s.pocPhone}</a></div>
                  </td>
                  <td className="py-3 text-right tabular-nums">{s.avgLeadDays} days</td>
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
      <AddSupplierDrawer isOpen={open} onClose={() => setOpen(false)} onAddSupplier={onAddSupplier} />
    </div>
  );
}

function ExpiryTab() {
  const within90 = EXPIRY_BATCHES.filter(b => b.daysLeft < 90);
  const within90Value = within90.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Expiry & batch tracking"
        subtitle="Shelf-life watch on held beauty stock — flagged inside 90 days"
      >
        <button type="button" className="btn-secondary h-9 px-4 text-[13px]">
          Propose markdown with Maya
        </button>
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

export function InventoryScreen({ officeTab, embedded: _embedded, onOfficeTabChange }: InventoryScreenProps) {
  const [stocked, setStocked] = useState<StockedSku[]>(STOCKED_SKUS);
  const [onDemand, setOnDemand] = useState<OnDemandSku[]>(ON_DEMAND_SKUS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers] = useState<SupplierScore[]>(SUPPLIERS);

  const addCategory = (name: string) => {
    const v = name.trim();
    if (v && !categories.includes(v)) setCategories(c => [...c, v]);
  };

  const addSku = (draft: SkuDraft) => {
    if (draft.mode === 'stocked') {
      const coverDays = computeCoverDays(draft.onHand, draft.weeklyForecast);
      setStocked(list => [{
        id: nextId('s', list),
        product: draft.product,
        brand: draft.brand,
        category: draft.category,
        mrp: draft.mrp,
        onHand: draft.onHand,
        weeklyForecast: draft.weeklyForecast,
        coverDays,
        reorderPoint: draft.reorderPoint,
        outOfStockBehaviour: draft.outOfStockBehaviour,
        status: deriveStockedStatus(draft.onHand, draft.reorderPoint, coverDays),
      }, ...list]);
    } else {
      setOnDemand(list => [{
        id: nextId('d', list),
        product: draft.product,
        brand: draft.brand,
        category: draft.category,
        mrp: draft.mrp,
        supplier: draft.supplier,
        ordersAwaiting: 0,
        leadTimeDays: draft.leadTimeDays,
        slaStatus: 'on-track',
      }, ...list]);
    }
  };

  const updateSku = (
    id: string,
    patch: { product: string; category: string; reorderPoint: number; onHand: number; outOfStockBehaviour: OutOfStockBehaviour }
  ) => {
    setStocked(list => list.map(s => {
      if (s.id !== id) return s;
      const coverDays = computeCoverDays(patch.onHand, s.weeklyForecast);
      const status = deriveStockedStatus(patch.onHand, patch.reorderPoint, coverDays);
      return { ...s, product: patch.product, category: patch.category, reorderPoint: patch.reorderPoint, onHand: patch.onHand, outOfStockBehaviour: patch.outOfStockBehaviour, coverDays, status };
    }));
  };

  const addSupplier = (draft: Omit<SupplierScore, 'id' | 'openPos' | 'slaBreaches30d'>) => {
    setSuppliers(list => [...list, { ...draft, id: nextId('sup', list), openPos: 0, slaBreaches30d: 0 }]);
  };

  switch (officeTab) {
    case 'Overview':
      return <OverviewTab onDemand={onDemand} onOfficeTabChange={onOfficeTabChange} />;
    case 'Stocked SKUs':
      return (
        <StockedSkusTab
          skus={stocked}
          categories={categories}
          suppliers={suppliers}
          onAddSku={addSku}
          onUpdateSku={updateSku}
          onAddCategory={addCategory}
          onOfficeTabChange={onOfficeTabChange}
        />
      );
    case 'On-demand':
      return (
        <OnDemandTab
          skus={onDemand}
          categories={categories}
          suppliers={suppliers}
          onAddSku={addSku}
          onAddCategory={addCategory}
        />
      );
    case 'Replenishment':
      return <ReplenishmentTab />;
    case 'Suppliers':
      return <SuppliersTab suppliers={suppliers} onAddSupplier={addSupplier} />;
    case 'Expiry & Batch':
      return <ExpiryTab />;
    default:
      return <OverviewTab onDemand={onDemand} onOfficeTabChange={onOfficeTabChange} />;
  }
}
