import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Zap,
  Search,
  Check,
  AlertTriangle,
  ChevronRight,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  type Invoice,
  type InvoiceStatus,
  type Vendor,
  type VendorCategory,
  type VendorMasterStatus,
  VENDOR_KPI,
  VENDOR_CATEGORIES,
  INVOICE_STATUS_OPTIONS,
  INITIAL_INVOICES,
  VENDORS,
  AGING_BUCKETS,
  CATEGORY_AGING,
  RECENT_PAYMENTS,
  BATCH_READY_DEFAULT_IDS,
  formatRupees,
  parseTdsAmount,
  getVendorById,
  getOldestOpenInvoices,
  VENDOR_ANOMALY,
} from '../data/vendorsMockData';

type VendorsTab = 'invoices' | 'schedule' | 'aging' | 'master';
type DatePreset = 'This month' | 'Last month' | 'This quarter' | 'Custom';
type VendorDrawerTab = 'profile' | 'invoices' | 'payment' | 'compliance';

const BATCH_PROCESSING_STEPS = [
  'Authorising with Cashfree Payouts…',
  'Validating vendor bank accounts (5 of 5)…',
  'Triggering NEFT for 5 vendors…',
  'Settling…',
];

const StatusPill = ({
  status,
  text,
}: {
  status: 'success' | 'error' | 'warning' | 'slate' | 'info';
  text: string;
}) => {
  const colors: Record<string, string> = {
    success: 'bg-success-50 text-success border-success-50',
    error: 'bg-error-50 text-error border-error-50',
    warning: 'bg-warning-50 text-warning border-warning-50',
    slate: 'bg-gray-100 text-gray-600 border-gray-200',
    info: 'bg-purple-50 text-primary border-purple-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[12px] font-medium border', colors[status])}>
      {text}
    </span>
  );
};

const Card = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <motion.div
    className={cn('card', onClick && 'cursor-pointer', className)}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <motion.div className="flex items-center justify-between mt-6 mb-6 px-1 flex-wrap gap-4">
    <motion.div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </motion.div>
    {children}
  </motion.div>
);

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  wide,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-navy-950/20 backdrop-blur-[2px] z-[200]"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            'fixed right-0 top-0 bottom-0 bg-white shadow-2xl z-[201] flex flex-col',
            wide ? 'w-full max-w-[560px]' : 'w-full max-w-[480px]'
          )}
        >
          <motion.div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
            <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
          <div className="flex-grow overflow-y-auto p-6">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const ModalBackdrop = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-navy-950/20 backdrop-blur-[2px] z-[200]"
    onClick={onClose}
  />
);

function invoiceStatusPill(status: InvoiceStatus): { status: 'success' | 'error' | 'warning' | 'slate' | 'info'; text: string } {
  if (status === 'OVERDUE') return { status: 'error', text: 'OVERDUE' };
  if (status === 'Pending L1') return { status: 'warning', text: 'Pending L1' };
  if (status === 'Pending L2') return { status: 'warning', text: 'Pending L2' };
  if (status === 'Approved') return { status: 'info', text: 'Approved' };
  if (status === 'Paid') return { status: 'success', text: 'Paid' };
  if (status === 'Payment initiated') return { status: 'info', text: 'Payment initiated' };
  return { status: 'slate', text: 'Under review' };
}

function MatchIcon({ match, note }: { match: Invoice['match']; note?: string }) {
  if (match === 'matched') {
    return (
      <span className="flex items-center gap-1 text-success text-[12px]" title="3-way match OK">
        <Check className="w-4 h-4" />
      </span>
    );
  }
  if (match === 'mismatch') {
    return (
      <span className="flex items-center gap-1 text-warning text-[12px]" title={note}>
        <AlertTriangle className="w-4 h-4" />
        {note && <span className="text-[11px]">{note}</span>}
      </span>
    );
  }
  return <span className="text-error text-[12px]">✕</span>;
}

function agingBucketColor(color: 'success' | 'warning' | 'error' | 'gray'): string {
  if (color === 'success') return 'bg-success';
  if (color === 'warning') return 'bg-warning';
  if (color === 'error') return 'bg-error';
  return 'bg-gray-300';
}

function filterInvoices(
  invoices: Invoice[],
  status: string,
  category: string,
  msmeOnly: boolean,
  search: string
): Invoice[] {
  return invoices.filter((inv) => {
    if (status !== 'All') {
      if (status === 'Overdue' && inv.status !== 'OVERDUE') return false;
      if (status !== 'Overdue' && inv.status !== status) return false;
    }
    if (category !== 'All categories' && inv.category !== category) return false;
    if (msmeOnly && !inv.isMsme) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${inv.vendorName} ${inv.invoiceNo} ${inv.poRef ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function filterVendors(
  vendors: Vendor[],
  category: string,
  msme: string,
  gstin: string,
  status: string,
  search: string
): Vendor[] {
  return vendors.filter((v) => {
    if (category !== 'All categories' && v.category !== category) return false;
    if (msme === 'MSME' && v.msmeType !== 'msme') return false;
    if (msme === 'Non-MSME' && v.msmeType !== 'none') return false;
    if (msme === 'Foreign' && v.msmeType !== 'foreign') return false;
    if (gstin === 'Active' && v.gstinStatus !== 'active') return false;
    if (gstin === 'Inactive' && v.gstinStatus !== 'inactive') return false;
    if (gstin === 'Not applicable' && v.gstinStatus !== 'na') return false;
    if (status !== 'All' && v.status !== status) return false;
    if (search.trim() && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}

const MsmeChip = () => (
  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-50 text-warning">MSME</span>
);

const PRIYA_TAB_MAP: Record<string, VendorsTab> = {
  Master: 'master',
  'AP Aging': 'aging',
  Exceptions: 'invoices',
  'Payment Runs': 'schedule',
};

export const VendorsScreen = ({
  onNavigateCompliance,
  onNavigateReconciliation,
  officeTab,
  embedded,
}: {
  onNavigateCompliance?: () => void;
  onNavigateReconciliation?: () => void;
  officeTab?: string;
  embedded?: boolean;
}) => {
  const mapped = officeTab ? PRIYA_TAB_MAP[officeTab] : undefined;
  const [activeTab, setActiveTab] = useState<VendorsTab>(mapped ?? 'invoices');

  useEffect(() => {
    if (mapped) setActiveTab(mapped);
  }, [mapped]);
  const [invoices, setInvoices] = useState<Invoice[]>(() => [...INITIAL_INVOICES]);
  const [vendors, setVendors] = useState<Vendor[]>(() => [...VENDORS]);

  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [msmeOnly, setMsmeOnly] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('This month');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const [masterCategory, setMasterCategory] = useState('All categories');
  const [masterMsme, setMasterMsme] = useState('All');
  const [masterGstin, setMasterGstin] = useState('All');
  const [masterStatus, setMasterStatus] = useState('Active');
  const [masterSearch, setMasterSearch] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorDrawerTab, setVendorDrawerTab] = useState<VendorDrawerTab>('profile');

  const [batchSelected, setBatchSelected] = useState<string[]>(() => [...BATCH_READY_DEFAULT_IDS]);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [inactiveConfirm, setInactiveConfirm] = useState<Vendor | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [batchToast, setBatchToast] = useState(false);
  const [anomalyDismissed, setAnomalyDismissed] = useState(() =>
    typeof window !== 'undefined' &&
    localStorage.getItem(VENDOR_ANOMALY.storageKey) === '1'
  );
  const [anomalyReopened, setAnomalyReopened] = useState(false);
  const [showAnomalyChart, setShowAnomalyChart] = useState(false);
  const anomalyChartRef = useRef<HTMLDivElement>(null);

  const showAnomalyCard = !anomalyDismissed || anomalyReopened;

  const approvedInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'Approved'),
    [invoices]
  );

  const filteredInvoices = useMemo(
    () => filterInvoices(invoices, statusFilter, categoryFilter, msmeOnly, invoiceSearch),
    [invoices, statusFilter, categoryFilter, msmeOnly, invoiceSearch]
  );

  const filteredVendors = useMemo(
    () => filterVendors(vendors, masterCategory, masterMsme, masterGstin, masterStatus, masterSearch),
    [vendors, masterCategory, masterMsme, masterGstin, masterStatus, masterSearch]
  );

  const oldestInvoices = useMemo(() => getOldestOpenInvoices(invoices), [invoices]);

  const batchTotal = useMemo(() => {
    const selected = invoices.filter((i) => batchSelected.includes(i.id));
    return selected.reduce((s, i) => s + i.amount, 0);
  }, [invoices, batchSelected]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!batchToast) return;
    const t = setTimeout(() => setBatchToast(false), 6000);
    return () => clearTimeout(t);
  }, [batchToast]);

  useEffect(() => {
    if (!showAnomalyChart || !anomalyChartRef.current) return;
    const t = setTimeout(() => {
      anomalyChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => clearTimeout(t);
  }, [showAnomalyChart, selectedVendor, vendorDrawerTab]);

  const handleInvestigateAnomaly = () => {
    const vendor = getVendorById(VENDOR_ANOMALY.vendorId);
    if (!vendor) return;
    setSelectedVendor(vendor);
    setVendorDrawerTab('invoices');
    setShowAnomalyChart(true);
    setAnomalyReopened(false);
  };

  const handleDismissAnomaly = () => {
    localStorage.setItem(VENDOR_ANOMALY.storageKey, '1');
    setAnomalyDismissed(true);
    setAnomalyReopened(false);
  };

  const handleApprove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        if (inv.status === 'Pending L1') return { ...inv, status: 'Pending L2' as InvoiceStatus };
        if (inv.status === 'Pending L2' || inv.status === 'OVERDUE') return { ...inv, status: 'Approved' as InvoiceStatus };
        return inv;
      })
    );
    showToast('Invoice approved');
  };

  const handlePayNow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'Payment initiated' as InvoiceStatus } : inv))
    );
    showToast('Payment initiated via Cashfree Payouts');
  };

  const handleResolve = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'Pending L1' as InvoiceStatus, match: 'matched' as const } : inv))
    );
    showToast('Mismatch resolved · routed for L1 approval');
  };

  const handleBatchComplete = () => {
    setInvoices((prev) =>
      prev.map((inv) =>
        batchSelected.includes(inv.id) ? { ...inv, status: 'Payment initiated' as InvoiceStatus } : inv
      )
    );
    setBatchSelected([]);
    setBatchModalOpen(false);
    setBatchToast(true);
  };

  const openBatchFromHeader = () => {
    setActiveTab('schedule');
    if (batchSelected.length === 0) {
      setBatchSelected(approvedInvoices.slice(0, 5).map((i) => i.id));
    }
    setBatchModalOpen(true);
  };

  const vendorInvoices = (vendorId: string) => invoices.filter((i) => i.vendorId === vendorId);

  const selectClass =
    'h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] text-gray-900';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('space-y-6', embedded ? 'pb-6' : 'pb-12 max-w-[1280px] mx-auto')}>
      {!embedded && (
      <SectionHeader
        title="Vendors"
        subtitle="Invoices, payments, and the vendor master — closed-loop via Cashfree Payouts"
      >
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAddVendorOpen(true)} className="btn-secondary gap-2 h-10 px-4 text-[13px]">
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
          <button type="button" onClick={() => setNewInvoiceOpen(true)} className="btn-secondary gap-2 h-10 px-4 text-[13px]">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
          <button type="button" onClick={openBatchFromHeader} className="btn-primary gap-2 h-10 px-4 text-[13px]">
            <Zap className="w-4 h-4" />
            Pay batch via Cashfree Payouts
          </button>
        </div>
      </SectionHeader>
      )}

      {anomalyDismissed && !anomalyReopened && (
        <button
          type="button"
          onClick={() => setAnomalyReopened(true)}
          className="text-[13px] text-primary font-medium hover:underline -mt-2"
        >
          View dismissed alerts →
        </button>
      )}

      {showAnomalyCard && (
        <Card className="bg-warning-50 border-warning-50 !p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
            <div className="flex-1 min-w-[240px]">
              <div className="text-[14px] font-semibold text-gray-900 mb-1">
                Anomaly detected · {VENDOR_ANOMALY.vendorName}
              </div>
              <div className="text-[13px] text-gray-700 leading-relaxed">
                A1 Packaging invoiced <span className="font-bold">₹84,000</span> in May — a{' '}
                <span className="font-bold text-warning">3.0× jump</span> vs the ₹28,000 average over the prior 3 months.
                Your order volume is up only <span className="font-bold">+12%</span>, so cost-per-order has effectively risen from ₹140 to ₹420.
                Possible causes: rate revision, undisclosed surcharge, duplicate invoicing, or shift to a costlier material.
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInvestigateAnomaly}
                className="btn-primary h-8 px-4 text-[13px]"
              >
                Investigate
              </button>
              <button
                type="button"
                onClick={handleDismissAnomaly}
                className="btn-tertiary text-[13px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-[12px] text-gray-500 mb-1">Total payables</p>
          <p className="text-[28px] font-bold text-gray-900">{VENDOR_KPI.totalPayables.value}</p>
          <p className="text-[12px] text-gray-400 mt-1">{VENDOR_KPI.totalPayables.sub}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-gray-500 mb-1">Due this week</p>
          <p className="text-[28px] font-bold text-warning">{VENDOR_KPI.dueThisWeek.value}</p>
          <p className="text-[12px] text-gray-400 mt-1">{VENDOR_KPI.dueThisWeek.sub}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-gray-500 mb-1">Overdue</p>
          <p className="text-[28px] font-bold text-error">{VENDOR_KPI.overdue.value}</p>
          <p className="text-[12px] text-gray-400 mt-1">{VENDOR_KPI.overdue.sub}</p>
        </Card>
        <Card
          onClick={() => onNavigateCompliance?.()}
          className="hover:ring-2 hover:ring-error/20 transition-shadow"
        >
          <p className="text-[12px] text-gray-500 mb-1">MSME at risk</p>
          <p className="text-[28px] font-bold text-error">{VENDOR_KPI.msmeAtRisk.value}</p>
          <p className="text-[12px] text-gray-400 mt-1">{VENDOR_KPI.msmeAtRisk.sub}</p>
          <p className="text-[11px] text-primary mt-2">View in Compliance →</p>
        </Card>
      </motion.div>

      {!embedded && (
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {(
          [
            { id: 'invoices' as const, label: 'Invoices' },
            { id: 'schedule' as const, label: 'Payment Schedule' },
            { id: 'aging' as const, label: 'Aging' },
            { id: 'master' as const, label: 'Vendor Master' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 -mb-px',
              activeTab === tab.id
                ? 'bg-purple-50 text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              {INVOICE_STATUS_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
              <option>All categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
              <input type="checkbox" checked={msmeOnly} onChange={(e) => setMsmeOnly(e.target.checked)} className="rounded text-primary" />
              MSME-only
            </label>
            <select value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)} className={selectClass}>
              {(['This month', 'Last month', 'This quarter', 'Custom'] as DatePreset[]).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <motion.div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Vendor, invoice #, PO…"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px]"
              />
            </motion.div>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Invoice #</th>
                    <th className="px-4 py-3 font-medium">Invoice date</th>
                    <th className="px-4 py-3 font-medium">Due date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">3-way match</th>
                    <th className="px-4 py-3 font-medium">TDS</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const pill = invoiceStatusPill(inv.status);
                    const isOverdue = inv.status === 'OVERDUE';
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className={cn(
                          'border-b border-gray-50 hover:bg-purple-50/20 cursor-pointer',
                          isOverdue && 'border-l-2 border-l-error'
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {inv.vendorName}
                          {inv.isMsme && <MsmeChip />}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{inv.invoiceNo}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.invoiceDate}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.dueDate}</td>
                        <td className="px-4 py-3 font-medium tabular-nums">{inv.amountLabel}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.category}</td>
                        <td className="px-4 py-3">
                          <MatchIcon match={inv.match} note={inv.matchNote} />
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-500">{inv.tds}</td>
                        <td className="px-4 py-3">
                          <StatusPill {...pill} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 flex-wrap">
                            {(inv.status === 'OVERDUE' || inv.status.startsWith('Pending')) && (
                              <button type="button" onClick={(e) => handleApprove(inv.id, e)} className="btn-primary h-7 px-2 text-[11px]">
                                Approve
                              </button>
                            )}
                            {inv.status === 'Approved' && (
                              <button type="button" onClick={(e) => handlePayNow(inv.id, e)} className="btn-primary h-7 px-2 text-[11px]">
                                Pay now
                              </button>
                            )}
                            {inv.status === 'Under review' && (
                              <button type="button" onClick={(e) => handleResolve(inv.id, e)} className="btn-primary h-7 px-2 text-[11px]">
                                Resolve
                              </button>
                            )}
                            <button type="button" onClick={() => setSelectedInvoice(inv)} className="btn-tertiary h-7 px-2 text-[11px]">
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-success" />
              <h3 className="text-[16px] font-semibold text-gray-900">Ready to Pay</h3>
            </div>
            <div className="space-y-2">
              {approvedInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <input
                    type="checkbox"
                    checked={batchSelected.includes(inv.id)}
                    onChange={() =>
                      setBatchSelected((prev) =>
                        prev.includes(inv.id) ? prev.filter((x) => x !== inv.id) : [...prev, inv.id]
                      )
                    }
                    className="rounded text-primary"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="text-[14px] font-medium text-gray-900">
                      {inv.vendorName} · {inv.invoiceNo}
                    </p>
                    <p className="text-[12px] text-gray-500">
                      Due {inv.dueDate} · via Cashfree Payouts · 3-way match ✓
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold tabular-nums shrink-0">{inv.amountLabel}</p>
                  <button type="button" onClick={() => handlePayNow(inv.id)} className="btn-primary h-8 px-3 text-[12px] shrink-0">
                    Pay now
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={batchSelected.length === 0}
                onClick={() => setBatchModalOpen(true)}
                className="btn-primary gap-2 h-10 px-4 text-[13px] disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                Pay batch via Cashfree Payouts
                {batchSelected.length > 0 && (
                  <span className="opacity-90">
                    · Pay {batchSelected.length} invoices · {formatRupees(batchTotal)}
                  </span>
                )}
              </button>
              <button type="button" onClick={() => setScheduleModalOpen(true)} className="btn-secondary h-10 px-4 text-[13px]">
                Schedule for later
              </button>
            </div>
          </Card>

          <Card>
            <motion.div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <h3 className="text-[16px] font-semibold text-gray-900">Pending Approval</h3>
            </motion.div>
            <motion.div className="space-y-3">
              {invoices
                .filter((i) => i.status === 'Pending L1' || i.status === 'Pending L2')
                .map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-50">
                    <div>
                      <p className="text-[14px] font-medium text-gray-900">
                        {inv.vendorName} · {inv.amountLabel}
                      </p>
                      <p className="text-[12px] text-gray-500">
                        Due {inv.dueDate} ·{' '}
                        {inv.status === 'Pending L1'
                          ? 'Pending L1 approval · waiting for Aarav (founder)'
                          : 'Pending L2 approval · waiting for Finance Lead'}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleApprove(inv.id)} className="btn-primary h-8 px-3 text-[12px]">
                      Approve
                    </button>
                  </div>
                ))}
            </motion.div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <h3 className="text-[16px] font-semibold text-gray-900">Recent Payments — last 7 days</h3>
            </div>
            <div className="space-y-2">
              {RECENT_PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const inv = invoices.find((i) => i.id === p.invoiceId);
                    if (inv) setSelectedInvoice(inv);
                  }}
                  className="w-full flex flex-wrap justify-between gap-2 py-3 text-left hover:bg-purple-50/30 rounded-[6px] px-2 -mx-2"
                >
                  <motion.div>
                    <p className="text-[14px] font-medium text-gray-900">
                      {p.date} · {p.vendor}
                    </p>
                    <p className="text-[12px] text-gray-500">{p.rail}</p>
                  </motion.div>
                  <p className="text-[14px] font-semibold tabular-nums">{p.amount}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'aging' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Aging buckets</h3>
            <div className="flex h-8 rounded-[6px] overflow-hidden w-full">
              {AGING_BUCKETS.map((b) => (
                <div
                  key={b.label}
                  className={cn('h-full flex items-center justify-center text-[10px] text-white font-medium', agingBucketColor(b.color))}
                  style={{ width: `${b.pct}%` }}
                  title={`${b.label}: ${b.amount}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {AGING_BUCKETS.map((b) => (
                <div key={b.label} className="text-[12px]">
                  <span className={cn('inline-block w-2 h-2 rounded-full mr-1', agingBucketColor(b.color))} />
                  <span className="text-gray-600">{b.label}</span>
                  <span className="font-medium text-gray-900 ml-1">{b.amount}</span>
                  <span className="text-gray-400 ml-1">({b.pct}%)</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigateCompliance?.()}
              className="mt-4 text-[13px] text-error text-left hover:underline"
            >
              ₹45,000 of expense deductions at Section 43B disallowance risk if not paid by 31 March 2027. View MSME compliance →
            </button>
          </Card>

          <Card className="p-0 overflow-hidden">
            <h3 className="text-[16px] font-semibold text-gray-900 px-4 pt-4 pb-2">Top 10 oldest open invoices</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase text-gray-500">
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Vendor</th>
                    <th className="px-4 py-2 font-medium">MSME</th>
                    <th className="px-4 py-2 font-medium">Invoice #</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Age</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {oldestInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="border-b border-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{inv.vendorName}</td>
                      <td className="px-4 py-3">{inv.isMsme ? 'Yes' : '—'}</td>
                      <td className="px-4 py-3">{inv.invoiceNo}</td>
                      <td className="px-4 py-3">{inv.invoiceDate}</td>
                      <td className="px-4 py-3">{inv.ageDays ?? 0} d</td>
                      <td className="px-4 py-3">{inv.amountLabel}</td>
                      <td className="px-4 py-3">
                        {inv.status === 'Approved' ? (
                          <button type="button" onClick={() => handlePayNow(inv.id)} className="btn-primary h-7 px-2 text-[11px]">
                            Pay now
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleApprove(inv.id)} className="btn-tertiary h-7 px-2 text-[11px]">
                            Escalate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="text-[16px] font-semibold text-gray-900 mb-4">By-category ageing</h3>
            <div className="space-y-4">
              {CATEGORY_AGING.map((row) => (
                <div key={row.category}>
                  <p className="text-[13px] font-medium text-gray-700 mb-1">{row.category}</p>
                  <motion.div className="flex h-4 rounded-[4px] overflow-hidden">
                    {row.buckets.map((pct, i) => {
                      const colors = ['bg-success', 'bg-success/70', 'bg-warning', 'bg-error', 'bg-gray-300'];
                      return (
                        <motion.div key={i} className={cn('h-full', colors[i])} style={{ width: `${pct}%` }} />
                      );
                    })}
                  </motion.div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'master' && (
        <motion.div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={masterCategory} onChange={(e) => setMasterCategory(e.target.value)} className={selectClass}>
              <option>All categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select value={masterMsme} onChange={(e) => setMasterMsme(e.target.value)} className={selectClass}>
              {['All', 'MSME', 'Non-MSME', 'Foreign'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={masterGstin} onChange={(e) => setMasterGstin(e.target.value)} className={selectClass}>
              {['All', 'Active', 'Inactive', 'Not applicable'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={masterStatus} onChange={(e) => setMasterStatus(e.target.value)} className={selectClass}>
              {['All', 'Active', 'On hold', 'Inactive'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search vendors…"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px]"
              />
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            <motion.div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">MSME</th>
                    <th className="px-4 py-3 font-medium">GSTIN</th>
                    <th className="px-4 py-3 font-medium">Bank</th>
                    <th className="px-4 py-3 font-medium">YTD spend</th>
                    <th className="px-4 py-3 font-medium">Open inv</th>
                    <th className="px-4 py-3 font-medium">Avg DTP</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => {
                        setSelectedVendor(v);
                        setVendorDrawerTab('profile');
                      }}
                      className="border-b border-gray-50 hover:bg-purple-50/20 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600">{v.category}</td>
                      <td className="px-4 py-3" title={v.udyam}>
                        {v.msmeType === 'msme' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-warning-50 text-warning">MSME</span>
                        ) : v.msmeType === 'foreign' ? (
                          'Foreign'
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.gstin ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            {v.gstin.slice(-8)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{v.bankLabel}</td>
                      <td className="px-4 py-3">{v.ytdSpend}</td>
                      <td className="px-4 py-3">{v.openInvoices}</td>
                      <td className="px-4 py-3">{v.avgDtp} d</td>
                      <td className="px-4 py-3">
                        <StatusPill
                          status={v.status === 'Active' ? 'success' : v.status === 'On hold' ? 'warning' : 'slate'}
                          text={v.status}
                        />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVendor(v);
                            setVendorDrawerTab('profile');
                          }}
                          className="btn-tertiary h-7 px-2 text-[11px]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </Card>
        </motion.div>
      )}

      <Drawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice?.invoiceNo ?? 'Invoice'}
        wide
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div>
              <p className="text-[18px] font-semibold text-gray-900">
                {selectedInvoice.vendorName}
                {selectedInvoice.isMsme && <MsmeChip />}
              </p>
              <p className="text-[13px] text-gray-500 mt-1">{selectedInvoice.category}</p>
              <div className="mt-2">
                <StatusPill {...invoiceStatusPill(selectedInvoice.status)} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-[13px]">
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-semibold">{selectedInvoice.amountLabel}</dd>
              <dt className="text-gray-500">Due</dt>
              <dd>{selectedInvoice.dueDate}</dd>
              <dt className="text-gray-500">TDS</dt>
              <dd>{selectedInvoice.tds}</dd>
            </dl>
            <section>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-gray-500 mb-2">Line items</h4>
              <div className="bg-gray-50 rounded-[6px] p-3 text-[13px] text-gray-600">
                Professional services / materials as per invoice · GST included
              </div>
            </section>
            <section>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-gray-500 mb-2">Attached PDF</h4>
              <div className="border border-dashed border-gray-200 rounded-[6px] p-6 text-center text-[13px] text-gray-400">
                invoice_{selectedInvoice.invoiceNo.replace(/\//g, '_')}.pdf
              </div>
            </section>
            <section>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-gray-500 mb-2">Three-way match</h4>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-success">PO</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="text-success">Invoice</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className={selectedInvoice.match === 'matched' ? 'text-success' : 'text-warning'}>Receipt</span>
              </div>
            </section>
            <button
              type="button"
              onClick={() => {
                const v = getVendorById(selectedInvoice.vendorId);
                if (v) {
                  setSelectedInvoice(null);
                  setSelectedVendor(v);
                  setVendorDrawerTab('profile');
                }
              }}
              className="btn-tertiary text-[13px]"
            >
              View vendor profile →
            </button>
          </div>
        )}
      </Drawer>

      <Drawer
        isOpen={!!selectedVendor}
        onClose={() => {
          setSelectedVendor(null);
          setShowAnomalyChart(false);
        }}
        title={selectedVendor?.name ?? 'Vendor'}
        wide
      >
        {selectedVendor && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {selectedVendor.msmeType === 'msme' && <MsmeChip />}
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-primary">{selectedVendor.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="bg-gray-50 p-3 rounded-[6px]">
                <p className="text-gray-500 text-[11px]">YTD spend</p>
                <p className="font-semibold">{selectedVendor.ytdSpend}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-[6px]">
                <p className="text-gray-500 text-[11px]">Avg DTP</p>
                <p className="font-semibold">{selectedVendor.avgDtp} days</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-[6px]">
                <p className="text-gray-500 text-[11px]">Open invoices</p>
                <p className="font-semibold">{selectedVendor.openInvoices}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-[6px]">
                <p className="text-gray-500 text-[11px]">Last paid</p>
                <p className="font-semibold">28 Apr 2026</p>
              </div>
            </div>
            <div className="flex gap-1 border-b border-gray-200">
              {(['profile', 'invoices', 'payment', 'compliance'] as VendorDrawerTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setVendorDrawerTab(t)}
                  className={cn(
                    'px-3 py-2 text-[12px] font-semibold capitalize border-b-2 -mb-px',
                    vendorDrawerTab === t ? 'text-primary border-primary' : 'text-gray-500 border-transparent'
                  )}
                >
                  {t === 'profile' ? 'Profile' : t === 'invoices' ? 'Invoices' : t === 'payment' ? 'Payment' : 'Compliance'}
                </button>
              ))}
            </div>
            {vendorDrawerTab === 'profile' && (
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-gray-500">GSTIN</dt>
                  <dd>{selectedVendor.gstin ?? 'N/A'}</dd>
                </div>
                <motion.div className="flex justify-between">
                  <dt className="text-gray-500">Bank</dt>
                  <dd>{selectedVendor.bankLabel}</dd>
                </motion.div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">TDS section</dt>
                  <dd>{selectedVendor.tdsSection}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Credit period</dt>
                  <dd>{selectedVendor.creditDays} days</dd>
                </div>
              </dl>
            )}
            {vendorDrawerTab === 'invoices' && (
              <div className="space-y-4">
                {selectedVendor.id === VENDOR_ANOMALY.vendorId && showAnomalyChart && (
                  <motion.div
                    ref={anomalyChartRef}
                    className="bg-warning-50 border border-warning-100 rounded-[8px] p-4"
                  >
                    <p className="text-[12px] font-semibold text-gray-900 mb-3">
                      3-month invoice trend · May spike
                    </p>
                    <div className="flex items-end gap-3 h-28">
                      {VENDOR_ANOMALY.monthlyInvoiced.map((m) => {
                        const max = Math.max(...VENDOR_ANOMALY.monthlyInvoiced.map((x) => x.amount));
                        const h = Math.max(12, (m.amount / max) * 100);
                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-gray-600">{m.label}</span>
                            <div
                              className={cn(
                                'w-full rounded-t-[4px]',
                                m.spike ? 'bg-error' : 'bg-primary/70'
                              )}
                              style={{ height: `${h}%` }}
                            />
                            <span className="text-[10px] text-gray-500">{m.month.replace(' 2026', '')}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Production rule: flag when monthly invoice &gt; 2× rolling 3-month avg and order volume growth &lt; 30%.
                    </p>
                  </motion.div>
                )}
                {vendorInvoices(selectedVendor.id).length === 0 ? (
                  <p className="text-[13px] text-gray-500">No invoices on file.</p>
                ) : (
                  vendorInvoices(selectedVendor.id).map((inv) => (
                    <div key={inv.id} className="flex justify-between py-2 border-b border-gray-50 text-[13px]">
                      <span>{inv.invoiceNo}</span>
                      <span>{inv.amountLabel}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {vendorDrawerTab === 'payment' && (
              <p className="text-[13px] text-gray-600">
                Default mode: {selectedVendor.defaultPaymentMode}. Recent payouts via Cashfree Payouts NEFT.
              </p>
            )}
            {vendorDrawerTab === 'compliance' && (
              <p className="text-[13px] text-gray-600">
                GSTR-2B matched · TDS challans on file for {selectedVendor.tdsSection !== 'None' ? selectedVendor.tdsSection : 'exempt'} vendors.
              </p>
            )}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button type="button" className="btn-secondary flex-1 h-10 text-[13px]">
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => setInactiveConfirm(selectedVendor)}
                className="btn-destructive flex-1 h-10 text-[13px]"
              >
                Mark inactive
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <AnimatePresence>
        {addVendorOpen && (
          <AddVendorModal
            onClose={() => setAddVendorOpen(false)}
            onAdd={(vendor) => {
              setVendors((prev) => [...prev, vendor]);
              setAddVendorOpen(false);
              showToast(`${vendor.name} added · ready to receive invoices`);
            }}
          />
        )}
        {newInvoiceOpen && (
          <NewInvoiceModal
            vendors={vendors}
            onClose={() => setNewInvoiceOpen(false)}
            onSubmit={(inv) => {
              setInvoices((prev) => [inv, ...prev]);
              setNewInvoiceOpen(false);
              showToast(`Invoice ${inv.invoiceNo} submitted for L1 approval → routed to Aarav`);
            }}
          />
        )}
        {batchModalOpen && (
          <BatchPaymentModal
            invoices={invoices.filter((i) => batchSelected.includes(i.id))}
            onClose={() => setBatchModalOpen(false)}
            onComplete={handleBatchComplete}
          />
        )}
        {scheduleModalOpen && (
          <ScheduleLaterModal
            onClose={() => setScheduleModalOpen(false)}
            onConfirm={(date) => {
              setScheduleModalOpen(false);
              showToast(`Batch scheduled for ${date}`);
            }}
          />
        )}
        {inactiveConfirm && (
          <MarkInactiveModal
            vendor={inactiveConfirm}
            onClose={() => setInactiveConfirm(null)}
            onConfirm={() => {
              setVendors((prev) =>
                prev.map((v) => (v.id === inactiveConfirm.id ? { ...v, status: 'Inactive' as VendorMasterStatus } : v))
              );
              setInactiveConfirm(null);
              setSelectedVendor(null);
              showToast(`${inactiveConfirm.name} marked inactive`);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-8 z-[220] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium max-w-sm"
          >
            {toast}
          </motion.div>
        )}
        {batchToast && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-8 z-[220] card max-w-md p-4 shadow-xl"
          >
            <p className="text-[14px] font-semibold text-gray-900">✓ Batch payment initiated</p>
            <p className="text-[13px] text-gray-600 mt-1">
              5 vendors · ₹6,46,297 net debit · Cashfree Payouts batch ID <strong>CFP-BTH-92847</strong>
            </p>
            <p className="text-[12px] text-gray-500 mt-1">Expected settlement: T+1 (16 May, end of day)</p>
            {onNavigateReconciliation && (
              <button type="button" onClick={onNavigateReconciliation} className="text-[13px] text-primary mt-2 font-medium">
                View in Reconciliation →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function AddVendorModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (v: Vendor) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Other');
  const [vendorType, setVendorType] = useState<'domestic' | 'foreign' | 'msme'>('domestic');
  const [udyam, setUdyam] = useState('');
  const [gstin, setGstin] = useState('');
  const [gstinValid, setGstinValid] = useState(false);
  const [validating, setValidating] = useState(false);
  const [pan, setPan] = useState('');
  const [account, setAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'IMPS' | 'RTGS' | 'UPI'>('NEFT');
  const [tdsSection, setTdsSection] = useState<'194C' | '194I' | '194J' | 'None'>('194C');
  const [creditDays, setCreditDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const validateGstin = () => {
    if (!gstin.trim()) return;
    setValidating(true);
    setTimeout(() => {
      setGstinValid(true);
      setPan('AABCU9603R');
      setValidating(false);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const id = `v-${Date.now()}`;
      onAdd({
        id,
        name: name.trim(),
        category,
        msmeType: vendorType === 'msme' ? 'msme' : vendorType === 'foreign' ? 'foreign' : 'none',
        udyam: vendorType === 'msme' ? udyam : undefined,
        gstin: vendorType !== 'foreign' ? gstin : undefined,
        gstinStatus: vendorType === 'foreign' ? 'na' : 'active',
        bankLabel: account ? `HDFC ··${account.slice(-4)}` : '—',
        ifsc: ifsc || undefined,
        ytdSpend: '₹0',
        openInvoices: 0,
        avgDtp: 30,
        status: 'Active',
        pan: pan || undefined,
        creditDays,
        tdsSection,
        defaultPaymentMode: paymentMode,
      });
      setSubmitting(false);
    }, 600);
  };

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-[12px] shadow-2xl z-[201] p-8"
      >
        <div className="flex justify-between mb-6">
          <h3 className="text-[20px] font-semibold text-gray-900">Add vendor</h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase">Vendor name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" required />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]">
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <motion.div>
            <label className="text-[11px] font-medium text-gray-500 uppercase block mb-2">Vendor type</label>
            <motion.div className="flex gap-4">
              {(['domestic', 'foreign', 'msme'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input type="radio" checked={vendorType === t} onChange={() => setVendorType(t)} className="text-primary" />
                  {t}
                </label>
              ))}
            </motion.div>
          </motion.div>
          {vendorType === 'msme' && (
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">UDYAM registration</label>
              <input value={udyam} onChange={(e) => setUdyam(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
            </div>
          )}
          {vendorType !== 'foreign' && (
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">GSTIN</label>
              <div className="flex gap-2 mt-1">
                <input value={gstin} onChange={(e) => setGstin(e.target.value)} className="flex-1 h-9 px-3 border border-gray-200 rounded-[6px]" />
                <button type="button" onClick={validateGstin} disabled={validating} className="btn-secondary h-9 px-3">
                  {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Validate'}
                </button>
              </div>
              {gstinValid && <p className="text-success text-[12px] mt-1">GSTIN verified</p>}
            </div>
          )}
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase">PAN</label>
            <input value={pan} onChange={(e) => setPan(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">Account number</label>
              <input value={account} onChange={(e) => setAccount(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
            </motion.div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">IFSC</label>
              <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase">Beneficiary name</label>
            <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase block mb-2">Default payment mode</label>
            <div className="flex flex-wrap gap-3">
              {(['NEFT', 'IMPS', 'RTGS', 'UPI'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={paymentMode === m} onChange={() => setPaymentMode(m)} className="text-primary" />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">TDS section</label>
              <select value={tdsSection} onChange={(e) => setTdsSection(e.target.value as typeof tdsSection)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]">
                <option value="194C">194C</option>
                <option value="194I">194I</option>
                <option value="194J">194J</option>
                <option value="None">None</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">Credit period (days)</label>
              <input type="number" value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-6">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary h-10 px-6 disabled:opacity-50">
              {submitting ? 'Adding…' : 'Add vendor'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function NewInvoiceModal({
  vendors,
  onClose,
  onSubmit,
}: {
  vendors: Vendor[];
  onClose: () => void;
  onSubmit: (inv: Invoice) => void;
}) {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const vendor = vendors.find((v) => v.id === vendorId);

  const simulateOcr = () => {
    setOcrProcessing(true);
    setTimeout(() => {
      setMode('manual');
      setInvoiceNo('OCR-2026-001');
      setInvoiceDate('15 May');
      setDueDate('14 Jun');
      setAmount('42000');
      setOcrProcessing(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !invoiceNo) return;
    setSubmitting(true);
    const amt = parseInt(amount.replace(/,/g, ''), 10) || 0;
    setTimeout(() => {
      onSubmit({
        id: `inv-${Date.now()}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        isMsme: vendor.msmeType === 'msme',
        invoiceNo,
        invoiceDate: invoiceDate || '15 May',
        dueDate: dueDate || '14 Jun',
        amount: amt,
        amountLabel: `₹${amt.toLocaleString('en-IN')}`,
        category: vendor.category,
        match: 'matched',
        tds: vendor.tdsSection !== 'None' ? `${vendor.tdsSection} —` : '—',
        status: 'Pending L1',
        ageDays: 0,
      });
      setSubmitting(false);
    }, 600);
  };

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-white rounded-[12px] shadow-2xl z-[201] p-8"
      >
        <div className="flex justify-between mb-4">
          <h3 className="text-[20px] font-semibold text-gray-900">New invoice</h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn('px-4 py-2 text-[13px] font-semibold rounded-[6px]', mode === 'upload' ? 'bg-purple-50 text-primary' : 'text-gray-500')}
          >
            Upload PDF/JPG
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={cn('px-4 py-2 text-[13px] font-semibold rounded-[6px]', mode === 'manual' ? 'bg-purple-50 text-primary' : 'text-gray-500')}
          >
            Manual entry
          </button>
        </div>
        {mode === 'upload' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={simulateOcr}
              disabled={ocrProcessing}
              className="w-full border-2 border-dashed border-gray-200 rounded-[8px] p-10 flex flex-col items-center gap-2 text-gray-500 hover:border-primary hover:text-primary"
            >
              {ocrProcessing ? (
                <>
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span>Extracting invoice fields…</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <span>Drop PDF or JPG here</span>
                </>
              )}
            </button>
            <button type="button" className="text-[13px] text-primary mt-2">
              Pull from email inbox →
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 text-[13px]">
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase">Vendor</label>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]">
              {vendors.filter((v) => v.status === 'Active').map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">Invoice number</label>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" required />
            </div>
            <motion.div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" required />
            </motion.div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">Invoice date</label>
              <input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} placeholder="15 May" className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase">Due date</label>
              <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="14 Jun" className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px]" />
            </div>
          </div>
          {vendor && (
            <p className="text-[12px] text-gray-500">Category auto-filled: {vendor.category}</p>
          )}
          <motion.div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-6">
              Save as draft
            </button>
            <button type="submit" disabled={submitting} className="btn-primary h-10 px-6 disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit for approval'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </>
  );
}

function BatchPaymentModal({
  invoices,
  onClose,
  onComplete,
}: {
  invoices: Invoice[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [sourceAccount, setSourceAccount] = useState('HDFC Bank ··2847');
  const [paymentMode, setPaymentMode] = useState('NEFT');
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [deductTds, setDeductTds] = useState(true);
  const [emailVoucher, setEmailVoucher] = useState(true);

  const totalGross = invoices.reduce((s, i) => s + i.amount, 0);
  const totalTds = invoices.reduce((s, i) => s + parseTdsAmount(i.tds), 0);
  const fee = invoices.length * 5;
  const netDebit = totalGross - totalTds + fee;

  const handleAuthorize = () => {
    setProcessing(true);
    setProcessStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setProcessStep(step);
      if (step >= BATCH_PROCESSING_STEPS.length) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 500);
  };

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-[12px] shadow-2xl z-[201] p-8"
      >
        <div className="flex justify-between mb-6">
          <h3 className="text-[18px] font-semibold text-gray-900">
            Pay {invoices.length} vendors · ₹{netDebit.toLocaleString('en-IN')} total
          </h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        {processing ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-[14px] text-gray-700">{BATCH_PROCESSING_STEPS[Math.min(processStep, BATCH_PROCESSING_STEPS.length - 1)]}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-[12px] mb-4">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-2">Vendor</th>
                  <th className="text-left py-2">Invoice #</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-right py-2">TDS</th>
                  <th className="text-right py-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const tds = parseTdsAmount(inv.tds);
                  return (
                    <tr key={inv.id} className="border-b border-gray-50">
                      <td className="py-2">{inv.vendorName}</td>
                      <td className="py-2">{inv.invoiceNo}</td>
                      <td className="py-2 text-right tabular-nums">{inv.amountLabel}</td>
                      <td className="py-2 text-right tabular-nums">{tds ? `₹${tds.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        ₹{(inv.amount - tds).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-500 uppercase">Source account</label>
              <select value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value)} className="w-full h-9 mt-1 px-3 border border-gray-200 rounded-[6px] text-[13px]">
                <option>HDFC Bank ··2847</option>
                <option>ICICI Bank ··5621</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-500 uppercase block mb-2">Payment mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'NEFT', label: 'NEFT', sub: 'Free for HDFC; settles T+1' },
                  { id: 'IMPS', label: 'IMPS', sub: '₹5 per txn; instant' },
                  { id: 'RTGS', label: 'RTGS', sub: 'Free for > ₹2 L' },
                  { id: 'UPI', label: 'UPI', sub: 'Instant, free' },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      'p-3 border rounded-[6px] cursor-pointer text-[12px]',
                      paymentMode === m.id ? 'border-primary bg-purple-50' : 'border-gray-200'
                    )}
                  >
                    <input type="radio" className="sr-only" checked={paymentMode === m.id} onChange={() => setPaymentMode(m.id)} />
                    <span className="font-semibold text-gray-900">{m.label}</span>
                    <p className="text-gray-500 mt-0.5">{m.sub}</p>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-[6px] p-4 text-[13px] space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total invoice value</span>
                <span>₹{totalGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Less TDS auto-deducted</span>
                <span>−₹{totalTds.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cashfree Payouts fee</span>
                <span>₹{fee}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                <span>Net debit from source</span>
                <span>₹{netDebit.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-[13px] mb-2 cursor-pointer">
              <input type="checkbox" checked={deductTds} onChange={(e) => setDeductTds(e.target.checked)} className="rounded text-primary" />
              Deduct TDS automatically — challan will be generated at month-end
            </label>
            <label className="flex items-center gap-2 text-[13px] mb-6 cursor-pointer">
              <input type="checkbox" checked={emailVoucher} onChange={(e) => setEmailVoucher(e.target.checked)} className="rounded text-primary" />
              Email GST-compliant payment voucher to each vendor
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary h-10 px-6">
                Cancel
              </button>
              <button type="button" onClick={handleAuthorize} disabled={invoices.length === 0} className="btn-primary h-10 px-6">
                Authorize batch payment
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}

function ScheduleLaterModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (date: string) => void }) {
  const [date, setDate] = useState('20 May 2026');
  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-white rounded-[12px] shadow-2xl z-[201] p-6"
      >
        <h3 className="text-[18px] font-semibold text-gray-900 mb-4">Schedule for later</h3>
        <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-9 px-3 border border-gray-200 rounded-[6px] text-[13px] mb-4" />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary h-9 px-4">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(date)} className="btn-primary h-9 px-4">
            Schedule
          </button>
        </div>
      </motion.div>
    </>
  );
}

function MarkInactiveModal({
  vendor,
  onClose,
  onConfirm,
}: {
  vendor: Vendor;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-white rounded-[12px] shadow-2xl z-[201] p-6"
      >
        <h3 className="text-[18px] font-semibold text-gray-900 mb-2">Mark inactive?</h3>
        <p className="text-[13px] text-gray-600 mb-6">
          {vendor.name} will no longer appear in payment batches. Open invoices remain payable.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary h-9 px-4">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-destructive h-9 px-4">
            Mark inactive
          </button>
        </div>
      </motion.div>
    </>
  );
}
