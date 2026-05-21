import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  ComplianceTab,
  COMPLIANCE_TABS,
  GSTINS,
  GSTR2B_ROWS,
  TCS_MARKETPLACE_ROWS,
  TDS_INBOUND_ROWS,
  TDS_OUTBOUND_SECTIONS,
  FORM_26Q_QUARTERS,
  MSME_AGING_BUCKETS,
  INITIAL_INVOICES,
  buildMsmeVendorRows,
  CALENDAR_ITEMS,
  UPCOMING_FILINGS,
  HEALTH_BREAKDOWN,
  FILING_PACK_FORMS,
  FILING_PACK_PERIODS,
  FILING_PACK_GSTINS,
  FILING_PACK_STEPS,
  Gstr2bRow,
  TcsMarketplaceRow,
  TdsInboundRow,
  MsmeVendorRow,
  CalendarItem,
  CalendarCategory,
  categoryChipClass,
  GstinRow,
} from '../data/complianceMockData';

export type { ComplianceTab };

const StatusPill = ({ status, text }: { status: 'success' | 'error' | 'warning' | 'slate' | 'info'; text: string }) => {
  const colors: Record<string, string> = {
    success: 'bg-success-50 text-success border-success-50',
    error: 'bg-error-50 text-error border-error-50',
    warning: 'bg-warning-50 text-warning border-warning-50',
    slate: 'bg-gray-100 text-gray-600 border-gray-200',
    info: 'bg-purple-50 text-primary border-purple-100',
  };
  return <span className={cn('px-2.5 py-0.5 rounded-full text-[12px] font-medium border', colors[status])}>{text}</span>;
};

const Card = ({ children, className, title, subtitle }: { children: React.ReactNode; className?: string; title?: string; subtitle?: string }) => (
  <div className={cn('card', className)}>
    {title && (
      <div className="mb-4">
        <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) => (
  <div className="flex items-center justify-between mt-6 mb-6 px-1 flex-wrap gap-4">
    <div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Drawer = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-navy-950/20 backdrop-blur-[2px] z-[200]" />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-[201] flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-navy-950">{title}</h2>
            <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-6">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const ComplianceScreen = ({ initialTab }: { initialTab?: ComplianceTab } = {}) => {
  const [tab, setTab] = useState<ComplianceTab>(initialTab ?? 'gst');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const msmeVendorRows = useMemo(() => buildMsmeVendorRows(INITIAL_INVOICES), []);
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [packOpen, setPackOpen] = useState(false);
  const [packPeriod, setPackPeriod] = useState('This Month');
  const [packGstins, setPackGstins] = useState<string[]>([...FILING_PACK_GSTINS]);
  const [packForm, setPackForm] = useState('All forms');
  const [packGenerating, setPackGenerating] = useState(false);
  const [packStep, setPackStep] = useState(0);
  const [expandedGstin, setExpandedGstin] = useState<string | null>(null);
  const [gstr2bStatus, setGstr2bStatus] = useState('All');
  const [gstr2bSearch, setGstr2bSearch] = useState('');
  const [gstr2bDrawer, setGstr2bDrawer] = useState<Gstr2bRow | null>(null);
  const gstr2bRef = useRef<HTMLDivElement>(null);
  const [tcsDrawer, setTcsDrawer] = useState<TcsMarketplaceRow | null>(null);
  const [tdsChase, setTdsChase] = useState<TdsInboundRow | null>(null);
  const [refreshing26as, setRefreshing26as] = useState(false);
  const [msmeStatus, setMsmeStatus] = useState('All');
  const [msmeSearch, setMsmeSearch] = useState('');
  const [msmePay, setMsmePay] = useState<MsmeVendorRow | null>(null);
  const [msmeSchedule, setMsmeSchedule] = useState<MsmeVendorRow | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [msme1Generating, setMsme1Generating] = useState(false);
  const [calCategories, setCalCategories] = useState<CalendarCategory[]>(['GST', 'TDS', 'MSME', 'Income Tax', 'ROC', 'Labor', 'Other']);
  const [calStates, setCalStates] = useState<string[]>(['All']);
  const [calStatus, setCalStatus] = useState('All');
  const [calSearch, setCalSearch] = useState('');
  const [calDrawer, setCalDrawer] = useState<CalendarItem | null>(null);
  const [calBuckets, setCalBuckets] = useState<Record<string, boolean>>({ today: true, week: true, month: true, quarter: true });
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderName, setReminderName] = useState('');
  const [reminderDue, setReminderDue] = useState('');
  const [customReminders, setCustomReminders] = useState<CalendarItem[]>([]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const openPack = (prefillForm?: string) => {
    if (prefillForm) setPackForm(prefillForm);
    setPackOpen(true);
  };

  const runPackGeneration = () => {
    setPackGenerating(true);
    setPackStep(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setPackStep(i);
      if (i >= FILING_PACK_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPackGenerating(false);
          setPackOpen(false);
          setToast('Filing pack ready · download started');
        }, 400);
      }
    }, 650);
  };

  const filteredGstr2b = useMemo(() => {
    let rows = [...GSTR2B_ROWS];
    if (needsActionOnly) rows = rows.filter((r) => r.needsAction);
    if (gstr2bStatus !== 'All') {
      const map: Record<string, Gstr2bRow['status'][]> = {
        Matched: ['matched'],
        Mismatched: ['amount_mismatch', 'vendor_not_filed'],
        Missing: ['missing_in_2b'],
      };
      const allowed = map[gstr2bStatus] ?? [];
      rows = rows.filter((r) => allowed.includes(r.status));
    }
    if (gstr2bSearch.trim()) {
      const q = gstr2bSearch.toLowerCase();
      rows = rows.filter((r) => r.vendor.toLowerCase().includes(q) || r.invoice.toLowerCase().includes(q) || r.gstin.toLowerCase().includes(q));
    }
    return rows;
  }, [gstr2bStatus, gstr2bSearch, needsActionOnly]);

  const filteredMsme = useMemo(() => {
    let rows = [...msmeVendorRows];
    if (needsActionOnly) rows = rows.filter((r) => r.needsAction);
    if (msmeStatus === 'Within 30') rows = rows.filter((r) => r.status === 'within');
    if (msmeStatus === 'Approaching 45') rows = rows.filter((r) => r.status === 'approaching');
    if (msmeStatus === 'Overdue 45+') rows = rows.filter((r) => r.status === 'overdue');
    if (msmeSearch.trim()) rows = rows.filter((r) => r.vendor.toLowerCase().includes(msmeSearch.toLowerCase()));
    return rows;
  }, [msmeStatus, msmeSearch, needsActionOnly, msmeVendorRows]);

  const allCalendar = useMemo(() => [...CALENDAR_ITEMS, ...customReminders], [customReminders]);

  const filteredCalendar = useMemo(() => {
    let items = [...allCalendar];
    if (needsActionOnly) items = items.filter((i) => i.needsAction);
    if (calCategories.length < 7) items = items.filter((i) => calCategories.includes(i.category));
    if (!calStates.includes('All')) items = items.filter((i) => !i.state || calStates.includes(i.state));
    if (calStatus === 'Pending') items = items.filter((i) => i.status === 'Pending' || i.status === 'Not started');
    if (calStatus === 'Filed') items = items.filter((i) => i.status.includes('Filed') || i.status.includes('✓'));
    if (calStatus === 'Overdue') items = items.filter((i) => i.dueUrgency === 'overdue');
    if (calSearch.trim()) {
      const q = calSearch.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.owner.toLowerCase().includes(q));
    }
    return items;
  }, [allCalendar, calCategories, calStates, calStatus, calSearch, needsActionOnly]);

  const scrollToGstr2b = () => {
    setTab('gst');
    setTimeout(() => gstr2bRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const dotClass = (dot: GstinRow['dot']) => (dot === 'error' ? 'bg-error' : dot === 'warning' ? 'bg-warning' : 'hidden');

  const KpiGrid = ({ items }: { items: { label: string; val: string; sub: string; accent?: string; border?: string }[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((k) => (
        <Card key={k.label} className={cn('p-5 border-l-4', k.border ?? (k.accent === 'error' ? 'border-l-error' : 'border-l-navy-950'))}>
          <div className="text-[12px] text-gray-500 uppercase tracking-wider mb-1">{k.label}</div>
          <div className={cn('text-[28px] font-bold tabular-nums', k.accent === 'error' ? 'text-error' : 'text-navy-950')}>{k.val}</div>
          <p className="text-[12px] text-gray-500 mt-1">{k.sub}</p>
        </Card>
      ))}
    </div>
  );

  const renderGstTab = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={() => openPack('GSTR-1')} className="btn-primary h-10 px-5 text-[13px]">
          Generate GSTR-1 pack for May 2026
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3" title="GSTINs · 6 active registrations">
          <div className="divide-y divide-gray-100">
            {GSTINS.map((g) => (
              <div key={g.id}>
                <button type="button" onClick={() => setExpandedGstin(expandedGstin === g.id ? null : g.id)} className="w-full flex items-center gap-3 py-3 text-left hover:bg-purple-50/20 px-1">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', dotClass(g.dot))} />
                  <div className="flex-grow min-w-0">
                    <div className="text-[14px] font-semibold text-navy-950">
                      {g.state} ({g.code}
                      {g.isHq ? ' · HQ' : ''})
                    </div>
                    <div className="text-[12px] text-gray-500">{g.gstinMask}</div>
                  </div>
                  <StatusPill status="success" text="Active" />
                  <div className="text-[12px] text-gray-500 text-right hidden sm:block max-w-[200px]">{g.thisMonth}</div>
                  {expandedGstin === g.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                <AnimatePresence>
                  {expandedGstin === g.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4 px-2">
                      <div className="bg-gray-50 rounded-[8px] p-4 text-[12px] space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-gray-500">Outward supplies</span>
                          <span className="font-semibold text-navy-950">{g.outwardSupplies}</span>
                          <span className="text-gray-500">ITC claimed</span>
                          <span className="font-semibold text-navy-950">{g.itcClaimed}</span>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left py-1">Month</th>
                              <th className="text-left py-1">GSTR-1</th>
                              <th className="text-left py-1">GSTR-3B</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.filingHistory.map((h) => (
                              <tr key={h.month}>
                                <td className="py-1 text-navy-950">{h.month}</td>
                                <td className="py-1">{h.gstr1}</td>
                                <td className="py-1">{h.gstr3b}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button type="button" className="btn-tertiary text-[12px]">Open in GST portal →</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2" title="Input Tax Credit · this month">
          <dl className="space-y-3 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-gray-500">Total ITC available (as per books)</dt>
              <dd className="font-semibold text-navy-950 tabular-nums">₹14.28 L</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">ITC successfully claimed (in GSTR-3B)</dt>
              <dd className="font-semibold text-success tabular-nums">₹13.81 L</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">At-risk due to GSTR-2B mismatch</dt>
              <dd className="font-semibold text-error tabular-nums">₹47,000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">ITC reversed / ineligible</dt>
              <dd className="font-semibold text-navy-950 tabular-nums">₹3,290</dd>
            </div>
          </dl>
          <button type="button" onClick={scrollToGstr2b} className="btn-secondary w-full h-9 mt-4 text-[13px]">
            Reconcile GSTR-2B →
          </button>
        </Card>
      </div>
      <div ref={gstr2bRef}>
        <Card title="GSTR-2B reconciliation · 12 mismatches this month">
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={gstr2bStatus} onChange={(e) => setGstr2bStatus(e.target.value)} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
              <option>All</option>
              <option>Matched</option>
              <option>Mismatched</option>
              <option>Missing</option>
            </select>
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Vendor, GSTIN, invoice…" value={gstr2bSearch} onChange={(e) => setGstr2bSearch(e.target.value)} className="h-8 w-full pl-7 pr-2 text-[12px] border border-gray-200 rounded-[6px]" />
            </div>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-50">
                  {['Invoice #', 'Vendor', 'Vendor GSTIN', 'Date', 'Value', 'GST in 2B', 'GST in books', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGstr2b.map((row) => (
                  <tr key={row.id} className="hover:bg-purple-50/20">
                    <td className="px-4 py-3 font-medium text-navy-950">{row.invoice}</td>
                    <td className="px-4 py-3">{row.vendor}</td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{row.gstin}</td>
                    <td className="px-4 py-3 text-gray-500">{row.date}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.value}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.gst2b}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.gstBooks}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status === 'matched' ? 'success' : 'error'} text={row.statusLabel} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setGstr2bDrawer(row)} className="btn-tertiary text-[12px]">{row.action}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderTcsTab = () => (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: 'TCS deducted by marketplaces', val: '₹3.21 L', sub: 'across 5 marketplaces' },
          { label: 'TCS reflected in Form 26AS', val: '₹3.18 L', sub: 'last updated 16 May' },
          { label: 'Variance', val: '₹3,200', sub: '1 marketplace under-reporting', accent: 'error' },
          { label: 'TCS credit available', val: '₹3.18 L', sub: 'claimable in next GSTR-3B' },
        ]}
      />
      <Card title="Marketplace TCS reconciliation">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                {['Marketplace', 'Period', 'MP reported', 'CoWorker', 'Form 26AS', 'Variance', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase text-left border-b border-gray-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TCS_MARKETPLACE_ROWS.filter((r) => !needsActionOnly || r.needsAction).map((row) => (
                <tr key={row.id} className="hover:bg-purple-50/20">
                  <td className="px-4 py-3 font-medium text-navy-950">{row.marketplace}</td>
                  <td className="px-4 py-3 text-gray-500">{row.period}</td>
                  <td className="px-4 py-3 tabular-nums">{row.mpReported}</td>
                  <td className="px-4 py-3 tabular-nums">{row.coworker}</td>
                  <td className="px-4 py-3 tabular-nums">{row.form26as}</td>
                  <td className={cn('px-4 py-3 tabular-nums font-semibold', row.varianceNum !== 0 && 'text-error')}>{row.variance}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status === 'matched' ? 'success' : 'error'} text={row.status === 'matched' ? 'Matched' : 'Variance'} />
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setTcsDrawer(row)} className="btn-tertiary text-[12px]">
                      {row.status === 'variance' ? 'Reconcile' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Form 26AS comparison — Section 52">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[13px] text-gray-500">Books Section 52 vs Form 26AS for May 2026</p>
          <button
            type="button"
            disabled={refreshing26as}
            onClick={() => {
              setRefreshing26as(true);
              setTimeout(() => {
                setRefreshing26as(false);
                setToast('Form 26AS refreshed · matched to 16 May data');
              }, 1200);
            }}
            className="btn-secondary h-9 px-4 text-[13px] gap-2 flex items-center"
          >
            {refreshing26as ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            Refresh Form 26AS
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div className="bg-gray-50 rounded-[8px] p-4">
            <div className="text-gray-500 mb-2">Books (Section 52)</div>
            <div className="text-[20px] font-bold text-navy-950">₹3.21 L</div>
          </div>
          <div className="bg-gray-50 rounded-[8px] p-4">
            <div className="text-gray-500 mb-2">Form 26AS (Section 52)</div>
            <div className="text-[20px] font-bold text-navy-950">₹3.18 L</div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTdsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={() => openPack('Form 26Q')} className="btn-primary h-10 px-5 text-[13px]">
          Generate Form 26Q for Q1 FY26-27
        </button>
      </div>
      <KpiGrid
        items={[
          { label: 'Inbound TDS (194-O)', val: '₹3.21 L', sub: 'marketplaces deducted from us' },
          { label: 'Certificates collected', val: '4 of 5', sub: 'Meesho certificate pending' },
          { label: 'Outbound TDS deposited', val: '₹67,400', sub: 'challan paid 7 May' },
          { label: 'Form 26Q status', val: 'Filed', sub: 'Q4 FY25-26 · ack 28 May' },
        ]}
      />
      <Card title="Marketplace TDS certificates · Section 194-O">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                {['Marketplace', 'Period', 'TDS deducted', 'Certificate', 'Received on', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TDS_INBOUND_ROWS.filter((r) => !needsActionOnly || r.needsAction).map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium">{row.marketplace}</td>
                  <td className="px-4 py-3 text-gray-500">{row.period}</td>
                  <td className="px-4 py-3 tabular-nums">{row.tdsDeducted}</td>
                  <td className="px-4 py-3">{row.certificate}</td>
                  <td className="px-4 py-3">{row.receivedOn}</td>
                  <td className="px-4 py-3">
                    {row.status === 'chase' ? (
                      <button type="button" onClick={() => setTdsChase(row)} className="btn-tertiary text-[12px] text-error">Chase</button>
                    ) : (
                      <StatusPill status="success" text="Verified" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="TDS deducted by us · Sections 194C / 194I / 194J / 194Q">
        <table className="w-full text-[13px] mt-2">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left py-2">Section</th>
              <th className="text-left py-2">Type</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-right py-2">Challan</th>
            </tr>
          </thead>
          <tbody>
            {TDS_OUTBOUND_SECTIONS.map((r) => (
              <tr key={r.section} className="border-b border-gray-50">
                <td className="py-3 font-semibold text-navy-950">{r.section}</td>
                <td className="py-3 text-gray-600">{r.type}</td>
                <td className="py-3 text-right tabular-nums font-semibold">{r.amount}</td>
                <td className="py-3 text-right text-gray-500">{r.challan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Form 26Q quarterly status">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {FORM_26Q_QUARTERS.map((q) => (
            <div key={q.quarter} className="p-4 bg-gray-50 rounded-[8px] border border-gray-100">
              <div className="text-[14px] font-semibold text-navy-950">{q.quarter}</div>
              <StatusPill status={q.status === 'Filed' ? 'success' : 'slate'} text={q.status} />
              <p className="text-[12px] text-gray-500 mt-2">{q.date}</p>
              <p className="text-[11px] text-gray-400">{q.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderMsmeTab = () => (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: 'Total MSME payables', val: '₹4.82 L', sub: 'across 18 vendors', border: 'border-l-navy-950' },
          { label: 'Aged 31–45 days', val: '₹81,000', sub: '3 vendors · pay before window', border: 'border-l-warning' },
          { label: 'Aged > 45 days', val: '₹45,000', sub: 'Section 43B disallowance risk', border: 'border-l-error' },
          { label: 'MSME-1 last filed', val: '30 Oct 2025', sub: 'next due 30 Apr 2026 (overdue)', border: 'border-l-error' },
        ]}
      />
      <Card title="Vendor ageing buckets">
        <div className="flex h-8 rounded-[6px] overflow-hidden mb-3">
          {MSME_AGING_BUCKETS.map((b) => (
            <div key={b.label} style={{ backgroundColor: b.color, flex: parseFloat(b.amount.replace(/[^\d.]/g, '')) || 1 }} title={`${b.label}: ${b.amount}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
          {MSME_AGING_BUCKETS.map((b) => (
            <div key={b.label}>
              <span className="font-semibold text-navy-950">{b.amount}</span>
              <span className="text-gray-500"> · {b.label} ({b.vendors} vendors)</span>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-error font-semibold mt-4">
          ₹45,000 of expense deductions are at Section 43B disallowance risk if not paid by 31 March 2027.
        </p>
      </Card>
      <Card title="MSME vendor payables">
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={msmeStatus} onChange={(e) => setMsmeStatus(e.target.value)} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
            <option>All</option>
            <option>Within 30</option>
            <option>Approaching 45</option>
            <option>Overdue 45+</option>
          </select>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={msmeSearch} onChange={(e) => setMsmeSearch(e.target.value)} placeholder="Search vendor" className="h-8 w-full pl-7 text-[12px] border border-gray-200 rounded-[6px]" />
          </div>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                {['Vendor', 'UDYAM #', 'Invoice', 'Date', 'Amount', 'Age', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMsme.map((row) => (
                <tr key={row.id} className="hover:bg-purple-50/20">
                  <td className="px-4 py-3 font-medium text-navy-950">{row.vendor}</td>
                  <td className="px-4 py-3 text-gray-500 text-[12px]">{row.udyam}</td>
                  <td className="px-4 py-3">{row.invoice}</td>
                  <td className="px-4 py-3 text-gray-500">{row.date}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{row.amount}</td>
                  <td className={cn('px-4 py-3 font-semibold', row.status === 'overdue' && 'text-error')}>{row.ageLabel}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status === 'overdue' ? 'error' : row.status === 'approaching' ? 'warning' : 'success'} text={row.status === 'overdue' ? 'Overdue' : row.status === 'approaching' ? 'Approaching' : 'Within'} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="btn-tertiary text-[12px]"
                      onClick={() => (row.action === 'Pay now' ? setMsmePay(row) : row.action === 'Schedule payment' ? setMsmeSchedule(row) : undefined)}
                    >
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="bg-warning-50 border-warning-100 border-l-4 border-l-warning p-6">
        <h3 className="text-[16px] font-semibold text-navy-950">MSME-1 half-yearly return</h3>
        <p className="text-[13px] text-gray-600 mt-2">
          Last filed 30 Oct 2025 for H2 FY24-25 · <span className="text-error font-semibold">Next due 30 April 2026 (overdue by 18 days)</span>
        </p>
        <button
          type="button"
          disabled={msme1Generating}
          onClick={() => {
            setMsme1Generating(true);
            setTimeout(() => {
              setMsme1Generating(false);
              setToast('MSME-1 for H1 FY25-26 generated · download ready');
            }, 2000);
          }}
          className="btn-primary h-10 px-6 mt-4 gap-2 flex items-center"
        >
          {msme1Generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
          Generate MSME-1 for H1 FY25-26
        </button>
      </Card>
    </div>
  );

  const renderCalendarBucket = (key: CalendarItem['bucket'], title: string) => {
    const items = filteredCalendar.filter((i) => i.bucket === key);
    if (items.length === 0) return null;
    return (
      <Card key={key} className="overflow-hidden">
        <button type="button" onClick={() => setCalBuckets((b) => ({ ...b, [key]: !b[key] }))} className="w-full flex items-center justify-between text-left">
          <h3 className="text-[16px] font-semibold text-navy-950">{title} ({items.length})</h3>
          {calBuckets[key] ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </button>
        <AnimatePresence>
          {calBuckets[key] && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="divide-y divide-gray-100 mt-4">
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setCalDrawer(item)} className="w-full flex flex-wrap items-center gap-3 py-4 text-left hover:bg-purple-50/20 px-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', categoryChipClass(item.category))}>{item.category}</span>
                    <span className="text-[14px] font-semibold text-navy-950 flex-grow min-w-[200px]">{item.name}</span>
                    <span className="text-[12px] text-gray-500">{item.owner}</span>
                    <span className={cn('text-[13px] font-medium ml-auto', item.dueUrgency === 'overdue' ? 'text-error' : item.dueUrgency === 'soon' ? 'text-warning' : 'text-gray-600')}>{item.due}</span>
                    <StatusPill status={item.statusType} text={item.status} />
                    <span className="btn-tertiary text-[12px]" onClick={(e) => e.stopPropagation()}>{item.action}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  const renderCalendarTab = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['GST', 'TDS', 'MSME', 'Income Tax', 'ROC', 'Labor', 'Other'] as CalendarCategory[]).map((c) => (
          <label key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-[6px] text-[12px] cursor-pointer">
            <input type="checkbox" checked={calCategories.includes(c)} onChange={() => setCalCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))} className="rounded text-primary" />
            {c}
          </label>
        ))}
        <select value={calStates[0]} onChange={(e) => setCalStates(e.target.value === 'All' ? ['All'] : [e.target.value])} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
          <option>All</option>
          {['KA', 'MH', 'DL', 'TN', 'UP', 'WB'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={calStatus} onChange={(e) => setCalStatus(e.target.value)} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
          <option>All</option>
          <option>Pending</option>
          <option>Filed</option>
          <option>Overdue</option>
        </select>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={calSearch} onChange={(e) => setCalSearch(e.target.value)} placeholder="Filing or owner" className="h-8 w-full pl-7 text-[12px] border border-gray-200 rounded-[6px]" />
        </div>
      </div>
      {renderCalendarBucket('today', 'Today')}
      {renderCalendarBucket('week', 'This week')}
      {renderCalendarBucket('month', 'This month')}
      {renderCalendarBucket('quarter', 'Later this quarter')}
      <button type="button" onClick={() => setReminderOpen(true)} className="btn-secondary h-10 px-5">
        + Add custom reminder
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-[1280px] mx-auto">
      <SectionHeader title="Compliance" subtitle="GST, TCS, TDS, MSME, and statutory calendar">
        <button type="button" onClick={() => openPack()} className="btn-primary h-10 px-5">
          Generate filing pack
        </button>
      </SectionHeader>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-20 right-8 z-[220] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium max-w-sm">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button type="button" onClick={() => setHealthExpanded((v) => !v)} className="text-left">
          <Card className="p-5 border-l-4 border-l-success h-full hover:shadow-md transition-shadow">
            <div className="text-[12px] text-gray-500 uppercase tracking-wider mb-1">Compliance health</div>
            <div className="text-[32px] font-bold text-navy-950">94 / 100</div>
            <p className="text-[12px] text-gray-500 mt-1">2 items need attention</p>
            <AnimatePresence>
              {healthExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-[12px]">
                  {HEALTH_BREAKDOWN.map((h) => (
                    <div key={h.item} className="flex justify-between text-gray-600">
                      <span>{h.item}</span>
                      <span className="text-error font-medium">{h.impact}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => {
            setNeedsActionOnly((v) => !v);
            setToast(needsActionOnly ? 'Showing all items' : 'Filtered to items needing action');
          }}
          className="text-left"
        >
          <Card className={cn('p-5 border-l-4 border-l-warning h-full hover:shadow-md transition-shadow', needsActionOnly && 'ring-2 ring-primary')}>
            <div className="text-[12px] text-gray-500 uppercase tracking-wider mb-1">Items needing action this week</div>
            <div className="text-[32px] font-bold text-navy-950">5</div>
            <p className="text-[12px] text-gray-500 mt-1">across GST, MSME, and TDS</p>
          </Card>
        </button>
        <Card className="p-5 border-l-4 border-l-navy-950 h-full">
          <div className="text-[12px] text-gray-500 uppercase tracking-wider mb-3">Next 7 days</div>
          <div className="space-y-2">
            {UPCOMING_FILINGS.map((f) => (
              <div key={f.label} className="flex justify-between text-[13px]">
                <span className="text-navy-950 font-medium">{f.label}</span>
                <span className="text-gray-500">
                  {f.date} · <span className={f.status === 'Action needed' ? 'text-error' : 'text-warning'}>{f.status}</span>
                </span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setTab('calendar')} className="btn-tertiary text-[12px] mt-4">
            View calendar →
          </button>
        </Card>
      </div>

      {needsActionOnly && (
        <div className="flex items-center justify-between bg-warning-50 border border-warning-100 rounded-[8px] px-4 py-2 text-[13px] text-warning">
          <span>Showing items that need action only</span>
          <button type="button" onClick={() => setNeedsActionOnly(false)} className="btn-tertiary text-[12px]">
            Clear filter
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {COMPLIANCE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 -mb-px', tab === t.id ? 'bg-purple-50 text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-900')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gst' && renderGstTab()}
      {tab === 'tcs' && renderTcsTab()}
      {tab === 'tds' && renderTdsTab()}
      {tab === 'msme' && renderMsmeTab()}
      {tab === 'calendar' && renderCalendarTab()}

      <AnimatePresence>
        {packOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-navy-950/20 z-[200]" onClick={() => !packGenerating && setPackOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[520px] bg-white rounded-[12px] shadow-2xl z-[201] p-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[18px] font-semibold text-navy-950">Generate filing pack</h3>
                <button type="button" onClick={() => !packGenerating && setPackOpen(false)} className="p-2 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {packGenerating ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-[14px] font-medium text-navy-950">{FILING_PACK_STEPS[Math.min(packStep, FILING_PACK_STEPS.length - 1)]}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 block mb-1">Period</label>
                    <select value={packPeriod} onChange={(e) => setPackPeriod(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[14px]">
                      {FILING_PACK_PERIODS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 block mb-2">GSTINs</label>
                    <div className="flex flex-wrap gap-2">
                      {FILING_PACK_GSTINS.map((g) => (
                        <label key={g} className="flex items-center gap-1.5 text-[12px]">
                          <input type="checkbox" checked={packGstins.includes(g)} onChange={() => setPackGstins((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))} className="rounded text-primary" />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 block mb-1">Forms</label>
                    <select value={packForm} onChange={(e) => setPackForm(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[14px]">
                      {FILING_PACK_FORMS.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={runPackGeneration} className="btn-primary w-full h-11 mt-4">
                    Generate
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Drawer isOpen={!!gstr2bDrawer} onClose={() => setGstr2bDrawer(null)} title={gstr2bDrawer?.invoice ?? ''}>
        {gstr2bDrawer && (
          <div className="space-y-4 text-[13px]">
            <div className="h-32 bg-gray-100 rounded-[8px] flex items-center justify-center text-gray-400">Invoice preview</div>
            <p><span className="text-gray-500">Vendor:</span> {gstr2bDrawer.vendor}</p>
            <p><span className="text-gray-500">Contact:</span> {gstr2bDrawer.vendorEmail}</p>
            <p className="text-gray-700 leading-relaxed">{gstr2bDrawer.mismatchDetail}</p>
            <button type="button" onClick={() => setToast(`Reconciliation request sent to ${gstr2bDrawer.vendor}`)} className="btn-primary w-full h-10">
              Send reconciliation request to vendor
            </button>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!tcsDrawer} onClose={() => setTcsDrawer(null)} title={`TCS · ${tcsDrawer?.marketplace}`}>
        {tcsDrawer && (
          <div className="space-y-4 text-[13px]">
            <p className="text-gray-600">Day-by-day TCS for {tcsDrawer.period} shows consistent 1% on net taxable value.</p>
            <p><span className="text-gray-500">GSTR-8 reference:</span> MP reported {tcsDrawer.mpReported} vs 26AS {tcsDrawer.form26as}</p>
            <p className="bg-warning-50 p-3 rounded-[6px] text-warning">
              Suggested action: File grievance with {tcsDrawer.marketplace} for under-reporting of ₹{Math.abs(tcsDrawer.varianceNum).toLocaleString('en-IN')}.
            </p>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!tdsChase} onClose={() => setTdsChase(null)} title="Request Form 16A">
        {tdsChase && (
          <div className="space-y-4 text-[13px]">
            <p className="text-gray-600 bg-gray-50 p-4 rounded-[8px] leading-relaxed">
              Subject: Form 16A for April 2026 — {tdsChase.marketplace}
              <br />
              <br />
              Dear {tdsChase.marketplace} team, please share Form 16A for TDS of {tdsChase.tdsDeducted} deducted in April 2026.
            </p>
            <button type="button" onClick={() => { setToast('Certificate request sent'); setTdsChase(null); }} className="btn-primary w-full h-10">
              Send request
            </button>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!msmePay} onClose={() => setMsmePay(null)} title="Pay vendor">
        {msmePay && (
          <div className="space-y-4 text-[13px]">
            <p>Pay <strong>{msmePay.vendor}</strong> {msmePay.amount} for invoice {msmePay.invoice}?</p>
            <p className="text-gray-500">V1 routes to your connected bank (HDFC ···2847).</p>
            <button type="button" onClick={() => { setToast(`Payment initiated for ${msmePay.vendor}`); setMsmePay(null); }} className="btn-primary w-full h-10">
              Confirm payment
            </button>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!calDrawer} onClose={() => setCalDrawer(null)} title={calDrawer?.name ?? ''}>
        {calDrawer && (
          <div className="space-y-4 text-[13px]">
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', categoryChipClass(calDrawer.category))}>{calDrawer.category}</span>
            <p className="text-gray-600 leading-relaxed">{calDrawer.description}</p>
            <p><span className="text-gray-500">Regulatory reference:</span> {calDrawer.regulatoryRef}</p>
            <ul className="space-y-1 text-gray-500">
              {calDrawer.history.map((h) => (
                <li key={h}>· {h}</li>
              ))}
            </ul>
            <button type="button" className="btn-primary w-full h-10">{calDrawer.action}</button>
          </div>
        )}
      </Drawer>

      <AnimatePresence>
        {msmeSchedule && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-navy-950/20 z-[210]" onClick={() => setMsmeSchedule(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[12px] shadow-2xl z-[211] p-6">
              <h3 className="text-[16px] font-bold text-navy-950 mb-2">Schedule payment</h3>
              <p className="text-[13px] text-gray-600 mb-4">{msmeSchedule.vendor} · {msmeSchedule.amount}</p>
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-[6px] mb-4" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setMsmeSchedule(null)} className="btn-secondary h-9 px-4">Cancel</button>
                <button type="button" onClick={() => { setToast(`Payment reminder set for ${msmeSchedule.vendor}`); setMsmeSchedule(null); }} className="btn-primary h-9 px-4">
                  Save reminder
                </button>
              </div>
            </motion.div>
          </>
        )}
        {reminderOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-navy-950/20 z-[210]" onClick={() => setReminderOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[12px] shadow-2xl z-[211] p-6">
              <h3 className="text-[16px] font-bold text-navy-950 mb-4">Add custom reminder</h3>
              <input placeholder="Reminder name" value={reminderName} onChange={(e) => setReminderName(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-[6px] mb-3 text-[14px]" />
              <input type="date" value={reminderDue} onChange={(e) => setReminderDue(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-[6px] mb-4" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setReminderOpen(false)} className="btn-secondary h-9 px-4">Cancel</button>
                <button
                  type="button"
                  disabled={!reminderName || !reminderDue}
                  onClick={() => {
                    setCustomReminders((prev) => [
                      ...prev,
                      {
                        id: `custom-${Date.now()}`,
                        category: 'Other',
                        name: reminderName,
                        owner: 'You',
                        due: reminderDue,
                        dueUrgency: 'normal',
                        status: 'Pending',
                        statusType: 'slate',
                        action: 'View',
                        bucket: 'quarter',
                        needsAction: true,
                        description: 'Custom compliance reminder.',
                        regulatoryRef: 'Internal',
                        history: [],
                      },
                    ]);
                    setReminderOpen(false);
                    setReminderName('');
                    setReminderDue('');
                    setToast('Custom reminder added');
                  }}
                  className="btn-primary h-9 px-4 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
