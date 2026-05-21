import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  X,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../lib/utils';
import {
  DateRange,
  ReturnsChannelFilter,
  ReturnsChannel,
  ClaimItem,
  SkuReturnRow,
  ClaimStage,
  getReturnsDataset,
  getHeatmapRows,
  CHANNEL_META,
  filterByChannel,
  getReasonsForChannel,
  returnRateColor,
  heatmapCellClass,
} from '../data/returnsRecoveryMockData';

const DATE_RANGES: DateRange[] = ['Today', 'This Week', 'This Month', 'This Quarter', 'Custom'];
const STAGES: { id: ClaimStage; label: string }[] = [
  { id: 'eligible', label: 'Eligible' },
  { id: 'filed', label: 'Filed' },
  { id: 'approved', label: 'Approved' },
  { id: 'received', label: 'Received' },
];

const DISPUTABLE_STORAGE_KEY = 'disputable_charges_expanded';

const DeltaArrow = ({ value, className, pts }: { value: number; className?: string; pts?: boolean }) => {
  const isPositive = value >= 0;
  return (
    <div className={cn('flex items-center gap-1 text-[12px] font-medium', isPositive ? 'text-success' : 'text-error', className)}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : '−'}
      {Math.abs(value)}
      {pts ? ' pts' : '%'}
    </div>
  );
};

const InfoIcon = ({ tooltip }: { tooltip: string }) => (
  <span className="relative group inline-flex shrink-0 ml-1">
    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
    <span className="pointer-events-none absolute left-0 bottom-full mb-1 hidden group-hover:block z-20 w-56 p-2 bg-white border border-gray-200 rounded-[6px] shadow-lg text-[11px] text-gray-600 leading-snug">
      {tooltip}
    </span>
  </span>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div className={cn('card', className)}>{children}</motion.div>
);

const DATE_SCALE: Record<DateRange, number> = {
  Today: 0.035,
  'This Week': 0.24,
  'This Month': 1,
  'This Quarter': 2.85,
  Custom: 1,
};

const SectionHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mt-6 mb-6 px-1 flex-wrap gap-4">
    <div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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
          className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-[201] flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
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

const ChannelChip = ({ channel }: { channel: ReturnsChannel }) => (
  <div className="flex items-center gap-1.5">
    <div className={cn('w-2 h-2 rounded-[3px] shrink-0', CHANNEL_META[channel].colorClass)} />
    <span className="text-[12px] font-medium text-gray-600">{CHANNEL_META[channel].label}</span>
  </div>
);

export const ReturnsRecoveryScreen = () => {
  const [dateRange, setDateRange] = useState<DateRange>('This Month');
  const [selectedChannel, setSelectedChannel] = useState<ReturnsChannelFilter>('all');
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [selectedSku, setSelectedSku] = useState<SkuReturnRow | null>(null);
  const [rejectedExpanded, setRejectedExpanded] = useState(false);
  const [disputableExpanded, setDisputableExpanded] = useState(() => {
    try {
      return localStorage.getItem(DISPUTABLE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [filedDisputes, setFiledDisputes] = useState<Record<string, string>>({});
  const [filingId, setFilingId] = useState<string | null>(null);
  const [bulkFiling, setBulkFiling] = useState(false);
  const [bulkToast, setBulkToast] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');
  const [skuCategory, setSkuCategory] = useState('All');
  const [heatmapTip, setHeatmapTip] = useState<string | null>(null);

  const data = useMemo(() => getReturnsDataset(dateRange), [dateRange]);
  const heatmapRows = useMemo(() => getHeatmapRows(), []);
  const maxHeat = 48;
  const dateScale = DATE_SCALE[dateRange];

  const displayReasons = useMemo(
    () => getReasonsForChannel(selectedChannel, dateScale, data.reasons),
    [selectedChannel, dateScale, data.reasons]
  );

  const visibleHeatmapRows = useMemo(
    () =>
      selectedChannel === 'all'
        ? heatmapRows
        : heatmapRows.filter((r) => r.channel === selectedChannel),
    [heatmapRows, selectedChannel]
  );

  useEffect(() => {
    try {
      localStorage.setItem(DISPUTABLE_STORAGE_KEY, String(disputableExpanded));
    } catch {
      /* ignore */
    }
  }, [disputableExpanded]);

  const filteredClaims = useMemo(
    () => filterByChannel(data.claims, selectedChannel),
    [data.claims, selectedChannel]
  );
  const filteredAtRisk = useMemo(
    () => filterByChannel(data.atRisk, selectedChannel),
    [data.atRisk, selectedChannel]
  );
  const filteredSkus = useMemo(() => {
    let list = filterByChannel(data.skus, selectedChannel);
    if (skuCategory !== 'All') list = list.filter((s) => s.category === skuCategory);
    if (skuSearch.trim()) {
      const q = skuSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.sku.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          CHANNEL_META[s.channel].label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.skus, selectedChannel, skuCategory, skuSearch]);

  const openClaim = (id: string) => {
    const claim = data.claims.find((c) => c.id === id);
    if (claim) setSelectedClaim(claim);
  };

  const fileDispute = (id: string) => {
    setFilingId(id);
    setTimeout(() => {
      setFiledDisputes((prev) => ({ ...prev, [id]: `DISP-${Math.floor(10000 + Math.random() * 90000)}` }));
      setFilingId(null);
    }, 600);
  };

  const bulkFileDisputes = () => {
    setBulkFiling(true);
    setTimeout(() => {
      setBulkFiling(false);
      setBulkToast(true);
      const next: Record<string, string> = {};
      data.disputable.forEach((d) => {
        next[d.id] = `DISP-${Math.floor(10000 + Math.random() * 90000)}`;
      });
      setFiledDisputes((prev) => ({ ...prev, ...next }));
      setTimeout(() => setBulkToast(false), 4000);
    }, 1200);
  };

  const recoveryBorder =
    data.topKpis.recoveryRate >= 40 ? 'border-l-success' : 'border-l-warning';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12 max-w-[1280px] mx-auto"
    >
      <SectionHeader
        title="Returns & Recovery"
        subtitle="Quantify the leak, claw back what's claimable, fix what's broken"
      >
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-[8px]">
            {DATE_RANGES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDateRange(t)}
                className={cn(
                  'px-4 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all',
                  dateRange === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={() => {
              setExporting(true);
              setTimeout(() => setExporting(false), 800);
            }}
            className="btn-secondary h-9 px-4 text-[13px]"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export claims report
          </button>
        </div>
      </SectionHeader>

      <AnimatePresence>
        {bulkToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-8 z-[200] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium max-w-sm"
          >
            14 disputes filed. Expected resolution: 14 days.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-error p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Cost of returns</div>
          <div className="text-[28px] font-bold text-error tabular-nums">{data.topKpis.costOfReturns}</div>
          <p className="text-[12px] text-gray-500 mt-1">{data.topKpis.costSub}</p>
        </Card>
        <Card className={cn('border-l-4 p-5', recoveryBorder)}>
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Recovery rate</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">{data.topKpis.recoveryRate}%</div>
          <p className="text-[12px] text-gray-500 mt-1">{data.topKpis.recoverySub}</p>
        </Card>
        <Card className="border-l-4 border-l-warning p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">At risk (window closing)</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">{data.topKpis.atRisk}</div>
          <p className="text-[12px] text-gray-500 mt-1">{data.topKpis.atRiskSub}</p>
        </Card>
        <Card className="border-l-4 border-l-navy-950 p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Returns rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-navy-950 tabular-nums">{data.topKpis.returnsRate}%</span>
            <DeltaArrow value={data.topKpis.returnsRateWow} pts />
          </div>
          <p className="text-[12px] text-gray-500 mt-1">{data.topKpis.returnsRateSub}</p>
        </Card>
      </div>

      {/* Section 1 — The Leak */}
      <Card>
        <div className="mb-6">
          <h3 className="text-[16px] font-semibold text-gray-900">The leak this month</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">Total cost broken down by component</p>
        </div>
        <div className="overflow-x-auto -mx-6 mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Component</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">This month</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">% of leak</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Last month</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.costBreakdown.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-purple-50/20 transition-colors',
                    row.id === 'total' && 'bg-error-50/40 font-bold'
                  )}
                >
                  <td className={cn('px-6 py-3 border-l-4', row.borderClass)}>
                    <span className="text-[14px] text-navy-950">{row.component}</span>
                    {row.id !== 'total' && <InfoIcon tooltip={row.tooltip} />}
                  </td>
                  <td className="px-6 py-3 text-right text-[14px] tabular-nums text-navy-950">{row.thisMonth}</td>
                  <td className="px-6 py-3 text-right text-[14px] tabular-nums text-gray-600">{row.pctOfLeak.toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right text-[14px] tabular-nums text-gray-500">{row.lastMonth}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-[13px] font-medium text-error tabular-nums">+{row.trend}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="text-[14px] font-semibold text-navy-950 mb-3">Return rate by channel</h4>
          {selectedChannel !== 'all' && (
            <p className="text-[12px] text-primary mb-2">
              Filtering page to {CHANNEL_META[selectedChannel].label} ·{' '}
              <button type="button" className="underline" onClick={() => setSelectedChannel('all')}>
                Clear filter
              </button>
            </p>
          )}
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Channel</th>
                  <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Returns this month</th>
                  <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Return rate</th>
                  <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Last month</th>
                  <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">WoW Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.channelReturns.map((row) => (
                  <tr
                    key={row.channel}
                    className={cn(
                      'cursor-pointer hover:bg-purple-50/30 transition-colors',
                      selectedChannel === row.channel && 'bg-purple-50'
                    )}
                    onClick={() => setSelectedChannel(selectedChannel === row.channel ? 'all' : row.channel)}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2.5 h-2.5 rounded-[4px]', CHANNEL_META[row.channel].colorClass)} />
                        <span className="text-[14px] font-semibold text-navy-950">{CHANNEL_META[row.channel].label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-[13px] tabular-nums text-gray-600">{row.returnsCount.toLocaleString('en-IN')}</td>
                    <td className={cn('px-6 py-3 text-right text-[14px] font-bold tabular-nums', returnRateColor(row.returnRate))}>
                      {row.returnRate}%
                    </td>
                    <td className="px-6 py-3 text-right text-[13px] tabular-nums text-gray-500">{row.lastMonthRate}%</td>
                    <td className="px-6 py-3 text-right">
                      <DeltaArrow value={row.wowPts} pts className="justify-end" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Section 2 — Recovery */}
      <Card>
        <div className="mb-6">
          <h3 className="text-[16px] font-semibold text-gray-900">What we can claw back</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">Claims pipeline and at-risk windows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAGES.map((stage) => {
            const total = data.pipelineTotals[stage.id];
            const cards = filteredClaims.filter((c) => c.stage === stage.id);
            return (
              <div key={stage.id} className="space-y-3">
                <div className="px-2">
                  <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">{stage.label}</div>
                  <div className="text-[13px] text-navy-950 font-medium mt-0.5">
                    {total.count} claims · <span className="font-bold">{total.amount}</span>
                  </div>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {cards.map((claim) => (
                    <button
                      key={claim.id}
                      type="button"
                      onClick={() => setSelectedClaim(claim)}
                      className="w-full text-left p-3 bg-gray-50 border border-gray-100 rounded-[8px] hover:bg-purple-50/40 hover:border-primary/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-medium text-gray-400">{claim.id}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary" />
                      </div>
                      <ChannelChip channel={claim.channel} />
                      <div className="text-[14px] font-bold text-primary mt-2 tabular-nums">{claim.amountLabel}</div>
                      <p className="text-[11px] text-gray-500 mt-1">{claim.daysInStage} days in stage</p>
                    </button>
                  ))}
                  {cards.length === 0 && (
                    <p className="text-[12px] text-gray-400 px-2 py-4">No claims in this stage{selectedChannel !== 'all' ? ' for filter' : ''}.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-gray-100 rounded-[8px] p-4 mb-4">
          <h4 className="text-[14px] font-semibold text-navy-950 mb-3">Claims at risk — window closing soon</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Claim ID</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-500 text-right uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-500 text-right uppercase tracking-wider">Aging</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-500 text-right uppercase tracking-wider">Window closes</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-500 text-right uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAtRisk.map((row) => (
                  <tr key={row.id} className="hover:bg-purple-50/20">
                    <td className="px-4 py-3 text-[13px] font-medium text-navy-950">{row.id}</td>
                    <td className="px-4 py-3"><ChannelChip channel={row.channel} /></td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums">{row.amount}</td>
                    <td className="px-4 py-3 text-right text-[12px] text-gray-500">{row.aging}</td>
                    <td className={cn('px-4 py-3 text-right text-[12px] font-medium', row.daysLeft <= 7 && 'text-error font-bold')}>
                      {row.windowCloses}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openClaim(row.id)}
                        className={cn(
                          'h-8 px-3 rounded-[6px] text-[12px] font-semibold',
                          row.action === 'file' ? 'btn-primary' : 'btn-secondary'
                        )}
                      >
                        {row.action === 'file' ? 'File now' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRejectedExpanded((v) => !v)}
          className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-primary w-full text-left"
        >
          {rejectedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span>{data.rejectedSummary}</span>
        </button>
        <AnimatePresence>
          {rejectedExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 space-y-2"
            >
              {data.rejected.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-[6px] text-[13px]">
                  <div>
                    <span className="font-medium text-navy-950">{r.id}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <ChannelChip channel={r.channel} />
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-gray-600">{r.amount}</span>
                    <p className="text-[12px] text-gray-500 mt-1">{r.reason}</p>
                  </div>
                  <button type="button" className="btn-tertiary text-[12px] shrink-0">
                    Resubmit
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Section 3 — Why */}
      <Card>
        <div className="mb-6">
          <h3 className="text-[16px] font-semibold text-gray-900">Why are people returning</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">Reasons, SKUs, geography</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-[14px] font-semibold text-navy-950 mb-4">Return reasons</h4>
            <div className="h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={displayReasons} dataKey="pct" nameKey="reason" innerRadius={56} outerRadius={76} paddingAngle={3}>
                    {displayReasons.map((r) => (
                      <Cell key={r.reason} fill={r.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(_, __, props) => {
                      const p = props.payload as (typeof data.reasons)[0];
                      return [`${p.volume.toLocaleString('en-IN')} returns · ${p.value}`, p.reason];
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-navy-950">{displayReasons[0].pct}%</span>
                <span className="text-[12px] font-medium text-gray-500">{displayReasons[0].reason}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {displayReasons.map((r) => (
                <div key={r.reason} className="flex justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-gray-700">{r.reason}</span>
                  </div>
                  <span className="text-gray-500 tabular-nums">
                    {r.pct}% · {r.volume.toLocaleString('en-IN')} · {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[14px] font-semibold text-navy-950 mb-3">Top SKUs by return cost</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SKU…"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="h-8 w-full pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[12px] outline-none focus:border-primary"
                />
              </div>
              <select
                value={skuCategory}
                onChange={(e) => setSkuCategory(e.target.value)}
                className="h-8 px-2 bg-gray-50 border border-gray-200 rounded-[6px] text-[12px] outline-none focus:border-primary"
              >
                <option value="All">All categories</option>
                <option value="Skincare">Skincare</option>
                <option value="Haircare">Haircare</option>
                <option value="Bodycare">Bodycare</option>
              </select>
            </div>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-medium text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2 text-[11px] font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-3 py-2 text-[11px] font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-3 py-2 text-[11px] font-medium text-gray-500 text-right uppercase">Rate</th>
                    <th className="px-3 py-2 text-[11px] font-medium text-gray-500 text-right uppercase">Lost ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSkus.map((row) => (
                    <tr
                      key={`${row.rank}-${row.sku}`}
                      className="hover:bg-purple-50/30 cursor-pointer"
                      onClick={() => setSelectedSku(row)}
                    >
                      <td className="px-3 py-2 text-[12px] text-gray-500">{row.rank}</td>
                      <td className="px-3 py-2 text-[13px] font-medium text-navy-950 max-w-[140px] truncate" title={row.sku}>
                        {row.sku}
                      </td>
                      <td className="px-3 py-2"><ChannelChip channel={row.channel} /></td>
                      <td className={cn('px-3 py-2 text-right text-[13px] font-bold tabular-nums', returnRateColor(row.returnRate))}>
                        {row.returnRate}%
                      </td>
                      <td className="px-3 py-2 text-right text-[13px] font-semibold tabular-nums">{row.lostInr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[14px] font-semibold text-navy-950 mb-2">Channel × reason</h4>
          {heatmapTip && <p className="text-[12px] text-gray-500 mb-2">{heatmapTip}</p>}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr>
                  <th className="p-2 text-[11px] font-medium text-gray-500 text-left" />
                  {data.heatmapReasons.map((h) => (
                    <th key={h} className="p-2 text-[11px] font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleHeatmapRows.map((row) => (
                  <tr
                    key={row.channel}
                    className={cn(
                      selectedChannel !== 'all' && selectedChannel !== row.channel && 'opacity-40'
                    )}
                  >
                    <td className="p-2 text-left">
                      <ChannelChip channel={row.channel} />
                    </td>
                    {row.cells.map((pct, ci) => {
                      const meta = data.heatmapMeta.find(
                        (m) => m.channel === row.channel && m.reason === data.heatmapReasons[ci]
                      );
                      return (
                        <td key={ci} className="p-1">
                          <div
                            className={cn(
                              'rounded-[4px] px-2 py-1.5 text-[12px] font-semibold tabular-nums cursor-default transition-transform hover:scale-105',
                              heatmapCellClass(pct, maxHeat)
                            )}
                            onMouseEnter={() =>
                              setHeatmapTip(
                                meta
                                  ? `${CHANNEL_META[row.channel].label} · ${data.heatmapReasons[ci]}: ${meta.count} returns · ${meta.value}`
                                  : null
                              )
                            }
                            onMouseLeave={() => setHeatmapTip(null)}
                          >
                            {pct}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Disputable charges */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setDisputableExpanded((v) => !v)}
          className="w-full flex items-start gap-3 text-left"
        >
          {disputableExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">
              Disputable charges — 14 orders, {data.disputableTotal} potentially recoverable
            </h3>
            <p className="text-[12px] text-gray-500 mt-1">
              Orders where the marketplace deducted more than the contractual rate card. Hidden by default — open to review.
            </p>
          </div>
        </button>

        <AnimatePresence>
          {disputableExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider">Charged</th>
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider">Rate card</th>
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider">Overcharge</th>
                      <th className="px-4 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.disputable.map((row) => (
                      <tr key={row.id} className="hover:bg-purple-50/20">
                        <td className="px-4 py-3 text-[13px] font-medium text-navy-950">{row.orderId}</td>
                        <td className="px-4 py-3"><ChannelChip channel={row.channel} /></td>
                        <td className="px-4 py-3 text-[13px] text-gray-600">{row.type}</td>
                        <td className="px-4 py-3 text-right text-[13px] tabular-nums">{row.charged}</td>
                        <td className="px-4 py-3 text-right text-[13px] text-gray-500 tabular-nums">{row.rateCard}</td>
                        <td className="px-4 py-3 text-right text-[13px] font-bold text-error tabular-nums">{row.overcharge}</td>
                        <td className="px-4 py-3 text-right">
                          {filedDisputes[row.id] ? (
                            <span className="text-[12px] font-medium text-success">
                              Filed · {filedDisputes[row.id]}
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={filingId === row.id}
                              onClick={() => fileDispute(row.id)}
                              className="btn-secondary h-8 px-3 text-[12px]"
                            >
                              {filingId === row.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'File dispute'
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <motion.div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[13px] text-gray-600">
                    Total disputable: {data.disputableTotal} across 14 orders
                  </p>
                  <button
                    type="button"
                    disabled={bulkFiling}
                    onClick={bulkFileDisputes}
                    className="btn-secondary h-9 px-4 text-[13px]"
                  >
                    {bulkFiling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Filing…
                      </>
                    ) : (
                      'Bulk file disputes →'
                    )}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Drawer isOpen={!!selectedClaim} onClose={() => setSelectedClaim(null)} title={selectedClaim?.id ?? 'Claim detail'}>
        {selectedClaim && (
          <div className="space-y-4">
            <ChannelChip channel={selectedClaim.channel} />
            <div>
              <div className="text-[12px] text-gray-500 uppercase tracking-wider mb-1">Amount</div>
              <div className="text-[24px] font-bold text-primary tabular-nums">{selectedClaim.amountLabel}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-gray-500">Order ID</span>
                <p className="font-medium text-navy-950">{selectedClaim.orderId}</p>
              </div>
              <div>
                <span className="text-gray-500">Stage</span>
                <p className="font-medium text-navy-950 capitalize">{selectedClaim.stage}</p>
              </div>
              <div>
                <span className="text-gray-500">Days in stage</span>
                <p className="font-medium text-navy-950">{selectedClaim.daysInStage}</p>
              </div>
              {selectedClaim.filedDate && (
                <div>
                  <span className="text-gray-500">Filed</span>
                  <p className="font-medium text-navy-950">{selectedClaim.filedDate}</p>
                </div>
              )}
            </div>
            <div>
              <span className="text-[12px] text-gray-500 uppercase tracking-wider">Return reason</span>
              <p className="text-[14px] text-navy-950 mt-1">{selectedClaim.returnReason}</p>
            </div>
            {selectedClaim.expectedPayout && (
              <div className="p-3 bg-success-50 rounded-[6px] text-[13px] text-success font-medium">
                Expected payout: {selectedClaim.expectedPayout}
              </div>
            )}
            <button type="button" className="btn-primary w-full h-10">
              Advance claim
            </button>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!selectedSku} onClose={() => setSelectedSku(null)} title={selectedSku?.sku ?? 'SKU detail'}>
        {selectedSku && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ChannelChip channel={selectedSku.channel} />
              <span className={cn('text-[14px] font-bold', returnRateColor(selectedSku.returnRate))}>
                {selectedSku.returnRate}% return rate
              </span>
            </div>
            <p className="text-[13px] text-gray-500">
              {selectedSku.category} · Lost {selectedSku.lostInr} this month
            </p>
            <div>
              <h4 className="text-[13px] font-semibold text-navy-950 mb-2">Return reason breakdown</h4>
              <div className="space-y-2">
                {selectedSku.reasonBreakdown.map((r) => (
                  <div key={r.reason} className="flex justify-between text-[13px]">
                    <span className="text-gray-600">{r.reason}</span>
                    <span className="font-medium tabular-nums">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-navy-950 mb-2">Suggested actions</h4>
              <ul className="space-y-2">
                {selectedSku.suggestions.map((s) => (
                  <li key={s} className="text-[13px] text-gray-700 pl-3 border-l-2 border-primary">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>
    </motion.div>
  );
};
