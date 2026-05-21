import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  X,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '../lib/utils';
import {
  DateRange,
  Platform,
  CampaignRow,
  CampaignType,
  CampaignStatus,
  CampaignAction,
  DATE_RANGES,
  PLATFORMS,
  SPEND_BUCKETS,
  RECOMMENDED_SLIDER_VALUES,
  getMarketingDataset,
  computeProjection,
  getInitialSliderValues,
  poasColor,
  ltvCacColor,
  formatLakhs,
  formatDeltaLakhs,
} from '../data/marketingEfficiencyMockData';

const ATTRIBUTION_STORAGE_KEY = 'attribution_overlap_expanded';

const DeltaArrow = ({ value, className, pct, points }: { value: number; className?: string; pct?: boolean; points?: boolean }) => {
  const isPositive = value >= 0;
  const display = points ? Math.abs(value).toFixed(2) : Math.abs(value);
  return (
    <div className={cn('flex items-center gap-1 text-[12px] font-medium', isPositive ? 'text-success' : 'text-error', className)}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : '−'}
      {display}
      {pct ? '%' : ''}
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

const Card = ({ children, className, title, subtitle }: { children: React.ReactNode; className?: string; title?: string; subtitle?: string }) => (
  <div className={cn('card', className)}>
    {(title || subtitle) && (
      <div className="mb-4">
        {title && <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>}
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

const MiniSparkline = ({ data, poas }: { data: number[]; poas: number }) => (
  <div className="w-[60px] h-8">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.map((v, i) => ({ i, v }))}>
        <Line type="monotone" dataKey="v" stroke={poas < 1 ? '#DC2626' : poas <= 1.5 ? '#D97706' : '#16A34A'} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const actionLabel = (a: CampaignAction) => {
  if (a === 'pause') return 'Pause';
  if (a === 'review') return 'Review';
  if (a === 'scale') return 'Scale';
  return 'Hold';
};

export const MarketingEfficiencyScreen = () => {
  const [dateRange, setDateRange] = useState<DateRange>('This Month');
  const [platformFilter, setPlatformFilter] = useState<Platform[]>([...PLATFORMS]);
  const [typeFilter, setTypeFilter] = useState<'All' | CampaignType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | CampaignStatus>('All');
  const [sortBy, setSortBy] = useState('poas-asc');
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(null);
  const [pauseTarget, setPauseTarget] = useState<CampaignRow | null>(null);
  const [scaleTarget, setScaleTarget] = useState<CampaignRow | null>(null);
  const [scalePct, setScalePct] = useState<number | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(getInitialSliderValues);
  const [executing, setExecuting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [attributionExpanded, setAttributionExpanded] = useState(() => {
    try {
      return localStorage.getItem(ATTRIBUTION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [selectedCacChannel, setSelectedCacChannel] = useState<string | null>(null);

  const data = useMemo(() => getMarketingDataset(dateRange), [dateRange]);

  useEffect(() => {
    try {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, String(attributionExpanded));
    } catch {
      /* ignore */
    }
  }, [attributionExpanded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const projection = useMemo(
    () =>
      computeProjection(sliderValues, SPEND_BUCKETS, {
        marginLakhs: data.baselineMarginLakhs,
        mer: data.baselineMer,
        poas: data.baselinePoas,
      }),
    [sliderValues, data]
  );

  const filteredCampaigns = useMemo(() => {
    let list = [...data.campaigns];
    if (platformFilter.length < PLATFORMS.length) {
      list = list.filter((c) => platformFilter.includes(c.platform));
    }
    if (typeFilter !== 'All') list = list.filter((c) => c.campaignType === typeFilter);
    if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'poas-desc':
          return b.poas - a.poas;
        case 'spend':
          return b.spendLakhs - a.spendLakhs;
        case 'margin':
          return b.marginNum - a.marginNum;
        case 'wow':
          return b.wow - a.wow;
        default:
          return a.poas - b.poas;
      }
    });
    return list;
  }, [data.campaigns, platformFilter, typeFilter, statusFilter, search, sortBy]);

  const togglePlatform = (p: Platform) => {
    setPlatformFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const resetSliders = () => setSliderValues(getInitialSliderValues());

  const applyRecommendation = () => {
    setSliderValues({ ...RECOMMENDED_SLIDER_VALUES });
  };

  const applyUnderinvested = (bucketId: string, addLakhs: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [bucketId]: (prev[bucketId] ?? 0) + addLakhs,
    }));
  };

  const executeReallocation = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setToast('Reallocation applied — ad platform changes will take effect in 24 hours.');
    }, 1200);
  };

  const handlePauseConfirm = () => {
    setPauseTarget(null);
    setToast(`${pauseTarget?.name} paused`);
  };

  const handleScaleConfirm = () => {
    setScaleTarget(null);
    setScalePct(null);
    setToast(`Budget increase of ${scalePct}% applied to ${scaleTarget?.name}`);
  };

  const donutData = [
    { name: 'New', value: data.newRepeat.newPct, color: 'var(--color-primary)' },
    { name: 'Repeat', value: data.newRepeat.repeatPct, color: 'var(--color-purple-tint)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-[1280px] mx-auto">
      <SectionHeader title="Marketing Efficiency" subtitle="True profit on every rupee of marketing — across every platform">
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
      </SectionHeader>

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
      </AnimatePresence>

      {/* Section 1 — Headline ROI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-warning p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Total ad spend</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">{data.totalAdSpend}</div>
          <p className="text-[12px] text-gray-500 mt-1 flex items-center gap-1">
            this month · <DeltaArrow value={data.totalAdSpendMoM} pct />
          </p>
        </Card>
        <Card className="border-l-4 border-l-success p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            MER
            <InfoIcon tooltip="Marketing Efficiency Ratio = Total Revenue ÷ Total Marketing Spend. A simple brand-level health check: 4×+ is healthy, 3× is concerning, <2.5× is bleeding." />
          </div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">{data.mer}×</div>
          <p className="text-[12px] text-gray-500 mt-1">Net revenue ÷ total marketing spend · target &gt; 4×</p>
        </Card>
        <Card className="border-l-4 border-l-success p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            PoAS
            <InfoIcon tooltip="Profit on Ad Spend = Net Margin ÷ Ad Spend. ROAS lies because it's gross revenue. PoAS subtracts COGS, returns, and marketplace charges." />
          </div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">{data.poas}×</div>
          <p className="text-[12px] text-gray-500 mt-1">Net margin ÷ ad spend · target &gt; 1×</p>
        </Card>
        <Card className="border-l-4 border-l-navy-950 p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            Performance vs branding
            <InfoIcon tooltip="Performance ads aim for direct conversion. Branding ads build long-term recall. Most D2C brands under-invest in branding (target: 30-35% of spend)." />
          </div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">{data.perfBrandingSplit}</div>
          <p className="text-[12px] text-gray-500 mt-1">Top-of-funnel branding under-invested</p>
        </Card>
      </div>

      <Card>
        <h4 className="text-[14px] font-semibold text-navy-950">PoAS over 8 weeks · trending up</h4>
        <p className="text-[12px] text-gray-500 mt-1 mb-4">
          Up from 1.18× to 1.24× — driven by cutting Myntra Meta spend and scaling Google brand search.
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.poasWeekly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0.75, 1.35]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}×`} />
              <Tooltip
                formatter={(v: number) => [`${v}×`, 'PoAS']}
                labelFormatter={(l) => l}
                content={({ active, payload, label }) =>
                  active && payload?.[0] ? (
                    <div className="bg-white border border-gray-200 rounded-[8px] p-2 text-[12px] shadow-lg">
                      <div className="font-semibold text-navy-950">{label}</div>
                      <div>PoAS: {payload[0].value}×</div>
                      <div className="text-gray-500">Spend: {formatLakhs((payload[0].payload as { spend: number }).spend)}</div>
                    </div>
                  ) : null
                }
              />
              <ReferenceLine y={1} stroke="#D1D5DB" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="poas" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Section 2 — Campaign performance */}
      <Card title="Campaign performance" subtitle="Sorted by PoAS · worst first">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex flex-wrap gap-1">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={cn(
                  'px-2 py-1 rounded-[4px] text-[11px] font-semibold border',
                  platformFilter.includes(p) ? 'bg-purple-50 text-primary border-primary/30' : 'border-gray-200 text-gray-400'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
            <option value="All">All types</option>
            <option value="Performance">Performance</option>
            <option value="Branding">Branding</option>
            <option value="Retargeting">Retargeting</option>
            <option value="Brand search">Brand search</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Archived">Archived</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-8 px-2 text-[12px] border border-gray-200 rounded-[6px]">
            <option value="poas-asc">PoAS (worst first)</option>
            <option value="poas-desc">PoAS (best first)</option>
            <option value="spend">Spend</option>
            <option value="margin">Margin contribution</option>
            <option value="wow">WoW Δ</option>
          </select>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full pl-7 pr-2 text-[12px] border border-gray-200 rounded-[6px]"
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['Platform', 'Campaign', 'Spend', 'GMV', 'Net sales', 'Margin', 'PoAS', 'WoW', 'Trend', 'Action'].map((h) => (
                  <th key={h} className={cn('px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100', h !== 'Platform' && h !== 'Campaign' && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCampaigns.map((row) => (
                <tr key={row.id} className="hover:bg-purple-50/30 cursor-pointer" onClick={() => setSelectedCampaign(row)}>
                  <td className="px-4 py-3 text-[12px] font-medium text-gray-600">{row.platform}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-navy-950 max-w-[160px] truncate">{row.name}</td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums">{formatLakhs(row.spendLakhs)}</td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums text-gray-600">{row.gmv}</td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums">{row.netSales}</td>
                  <td className={cn('px-4 py-3 text-right text-[13px] font-semibold tabular-nums', row.marginNum < 0 ? 'text-error' : 'text-navy-950')}>{row.margin}</td>
                  <td className={cn('px-4 py-3 text-right text-[13px] font-bold tabular-nums', poasColor(row.poas), (row.poas <= 0.85 || row.poas >= 2) && 'font-bold')}>
                    {row.poas.toFixed(2)}×
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeltaArrow value={row.wow} points className="justify-end" />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <MiniSparkline data={row.sparkline} poas={row.poas} />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {row.action === 'hold' ? (
                      <span className="text-[12px] text-gray-500">Hold</span>
                    ) : (
                      <button
                        type="button"
                        className="btn-tertiary text-[12px]"
                        onClick={() => {
                          if (row.action === 'pause') setPauseTarget(row);
                          else if (row.action === 'review') setSelectedCampaign(row);
                          else if (row.action === 'scale') setScaleTarget(row);
                        }}
                      >
                        {actionLabel(row.action)}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3 — Reallocation simulator */}
      <Card title="Reallocation simulator" subtitle="Model how shifting ad spend would change MER, PoAS, and margin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            {SPEND_BUCKETS.map((b) => {
              const val = sliderValues[b.id] ?? b.currentLakhs;
              const delta = formatDeltaLakhs(val, b.currentLakhs);
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="font-medium text-navy-950">{b.label}</span>
                    <span className="tabular-nums font-semibold">{formatLakhs(val)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={b.maxLakhs}
                    step={0.1}
                    value={val}
                    onChange={(e) => setSliderValues((prev) => ({ ...prev, [b.id]: parseFloat(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                  {delta !== '—' && (
                    <span className={cn('text-[11px] font-medium', delta.startsWith('+') ? 'text-success' : 'text-error')}>{delta} vs current</span>
                  )}
                </div>
              );
            })}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={resetSliders} className="btn-secondary h-9 px-4 text-[13px]">
                Reset to current
              </button>
              <button type="button" onClick={applyRecommendation} className="btn-secondary h-9 px-4 text-[13px]">
                Apply CoWorker recommendation
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-[8px] p-5 border border-gray-100">
            <h4 className="text-[14px] font-semibold text-navy-950 mb-4">Projected impact</h4>
            <div className="grid grid-cols-3 gap-4 text-[13px]">
              <div className="font-medium text-gray-500">Metric</div>
              <div className="font-medium text-gray-500 text-right">Current</div>
              <div className="font-medium text-gray-500 text-right">Projected</div>
              {[
                ['Total ad spend', data.totalAdSpend, projection.totalSpend],
                ['Net margin contribution', formatLakhs(data.baselineMarginLakhs), projection.marginLakhs],
                ['MER', `${data.baselineMer}×`, `${projection.mer}×`],
                ['PoAS', `${data.baselinePoas}×`, `${projection.poas}×`],
                ['Estimated GMV impact', '—', projection.gmvImpact],
              ].map(([label, cur, proj]) => (
                <React.Fragment key={label as string}>
                  <div className="text-gray-600 py-1">{label}</div>
                  <div className="text-right tabular-nums py-1">{cur}</div>
                  <div className="text-right tabular-nums font-semibold text-primary py-1">{proj}</div>
                </React.Fragment>
              ))}
            </div>
            <button type="button" disabled={executing} onClick={executeReallocation} className="btn-primary w-full h-10 mt-6">
              {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Execute reallocation'}
            </button>
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-primary bg-purple-50/40">
        <h4 className="text-[14px] font-semibold text-navy-950 mb-3">Underinvested opportunities — based on marginal PoAS analysis</h4>
        <table className="w-full text-[13px]">
          <tbody>
            {data.underinvested.map((u) => (
              <tr key={u.platform} className="border-t border-gray-100 first:border-0">
                <td className="py-2 font-medium text-navy-950">{u.platform}</td>
                <td className="py-2 text-gray-600">currently {u.current} · marginal PoAS at +₹1 L = {u.marginal}</td>
                <td className="py-2 text-right">
                  could add {u.add} for <span className="font-semibold text-success">{u.marginGain}</span>
                  <button type="button" className="btn-tertiary text-[12px] ml-2" onClick={() => applyUnderinvested(u.bucketId, u.addLakhs)}>
                    Apply to simulator →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Section 4 — Customer economics */}
      <Card title="Customer economics" subtitle="Are we acquiring profitably or buying revenue?">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'CAC (blended)', val: `₹${data.cacBlended}`, sub: 'per new customer · −5% MoM', border: 'border-l-success' },
            { label: 'LTV (90-day)', val: `₹${data.ltv90.toLocaleString('en-IN')}`, sub: 'per customer · +8% MoM', border: 'border-l-success' },
            { label: 'LTV / CAC', val: `${data.ltvCacRatio}×`, sub: 'target > 3× · healthy', border: 'border-l-success' },
            { label: 'CAC payback', val: `${data.paybackMonths} mo`, sub: 'target < 6 months', border: 'border-l-success' },
          ].map((t) => (
            <div key={t.label} className={cn('p-4 bg-white border border-gray-100 rounded-[8px] border-l-4', t.border)}>
              <div className="text-[12px] text-gray-500 uppercase tracking-wider mb-1">{t.label}</div>
              <div className="text-[28px] font-bold text-navy-950 tabular-nums">{t.val}</div>
              <p className="text-[12px] text-gray-500 mt-1">{t.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {['Channel', 'New customers', 'Ad spend', 'CAC', 'LTV (90-day)', 'LTV/CAC'].map((h, i) => (
                    <th key={h} className={cn('px-4 py-2 text-[11px] font-medium text-gray-500 uppercase', i > 0 && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.cacRows.map((row) => (
                  <tr key={row.channel} className="hover:bg-purple-50/20 cursor-pointer" onClick={() => setSelectedCacChannel(row.channel)}>
                    <td className="px-4 py-3 text-[13px] font-medium text-navy-950">
                      {row.channel}
                      <InfoIcon tooltip={row.tooltip} />
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums">{row.newCustomers.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums">{row.adSpend}</td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums">{row.cac}</td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums">{row.ltv}</td>
                    <td className={cn('px-4 py-3 text-right text-[13px] font-bold tabular-nums', ltvCacColor(row.ltvCac))}>
                      {Number.isFinite(row.ltvCac) ? `${row.ltvCac}×` : '∞'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={48} outerRadius={64} paddingAngle={2}>
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[13px] font-semibold text-navy-950 mt-2">
              New: {data.newRepeat.newPct}% · Repeat: {data.newRepeat.repeatPct}%
            </p>
            <p className="text-[12px] text-gray-500 text-center mt-1">Healthy mix — repeat-customer share is the right side of growth.</p>
          </div>
        </div>
      </Card>

      {/* Attribution overlap */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setAttributionExpanded((v) => !v)}
          className="w-full flex items-start gap-3 text-left"
        >
          {attributionExpanded ? <ChevronDown className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" /> : <ChevronRight className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />}
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">Attribution overlap detected</h3>
            <p className="text-[12px] text-gray-500 mt-1">
              Meta, Google, and PLAs collectively claim 1,857 conversions. CoWorker estimates ~33% double-counting. Click to see the math.
            </p>
          </div>
        </button>
        <AnimatePresence>
          {attributionExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-6 mt-4 border-t border-gray-100">
                <table className="w-full text-[13px]">
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['Meta (7-day click + view)', '1,247', 'View-through inflates this'],
                      ['Google Ads (last-click)', '412', 'Underestimates assist'],
                      ['Marketplace PLAs (last-click)', '198', 'Underestimates assist'],
                      ['Sum of platform claims', '1,857', '—'],
                      ['De-duplicated actual conversions', '1,247', 'After CoWorker overlap analysis'],
                      ['Estimated overlap', '33%', 'Typical for India D2C'],
                    ].map(([src, val, note]) => (
                      <tr key={src} className={src.includes('Sum') || src.includes('De-duplicated') || src.includes('overlap') ? 'font-semibold bg-purple-50/30' : ''}>
                        <td className="py-2 pr-4 text-navy-950">{src}</td>
                        <td className="py-2 pr-4 tabular-nums">{val}</td>
                        <td className="py-2 text-gray-500">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[12px] text-gray-600 mt-4 leading-relaxed">
                  Implication — your reported blended ROAS of 3.8× across platforms is likely closer to 2.5× in reality. The PoAS on this page already accounts for this; the platform dashboards do not.
                </p>
                <button type="button" className="btn-tertiary text-[13px] mt-3">
                  Learn how CoWorker estimates overlap →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Modals */}
      <Drawer isOpen={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} title={selectedCampaign?.name ?? ''}>
        {selectedCampaign && (
          <div className="space-y-4 text-[13px]">
            <p>
              <span className="text-gray-500">Platform:</span> {selectedCampaign.platform}
            </p>
            <p>
              <span className="text-gray-500">PoAS:</span>{' '}
              <span className={cn('font-bold', poasColor(selectedCampaign.poas))}>{selectedCampaign.poas}×</span>
            </p>
            <p>
              <span className="text-gray-500">Audience:</span> {selectedCampaign.detail.audience}
            </p>
            <p>
              <span className="text-gray-500">Daily spend:</span> {selectedCampaign.detail.dailySpend}
            </p>
            <div>
              <span className="text-gray-500 block mb-2">Suggested next steps</span>
              <ul className="space-y-2">
                {selectedCampaign.detail.suggestions.map((s) => (
                  <li key={s} className="pl-3 border-l-2 border-primary text-gray-700">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!selectedCacChannel} onClose={() => setSelectedCacChannel(null)} title={`${selectedCacChannel} cohort`}>
        {selectedCacChannel && (
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Cohort analysis for {selectedCacChannel}: 90-day retention curve shows strong repeat purchase in weeks 4–8. Payback period for this channel is within target when including repeat revenue attribution.
          </p>
        )}
      </Drawer>

      <AnimatePresence>
        {pauseTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-navy-950/20 z-[210]" onClick={() => setPauseTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[12px] shadow-2xl z-[211] p-6">
              <h3 className="text-[16px] font-bold text-navy-950 mb-2">Pause campaign?</h3>
              <p className="text-[13px] text-gray-600 mb-4">
                Pausing <strong>{pauseTarget.name}</strong> (PoAS {pauseTarget.poas}×) will stop spend immediately.
              </p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setPauseTarget(null)} className="btn-secondary h-9 px-4">
                  Cancel
                </button>
                <button type="button" onClick={handlePauseConfirm} className="btn-destructive h-9 px-4">
                  Pause campaign
                </button>
              </div>
            </motion.div>
          </>
        )}
        {scaleTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-navy-950/20 z-[210]" onClick={() => { setScaleTarget(null); setScalePct(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[12px] shadow-2xl z-[211] p-6">
              <h3 className="text-[16px] font-bold text-navy-950 mb-2">Increase budget</h3>
              <p className="text-[13px] text-gray-600 mb-4">Scale <strong>{scaleTarget.name}</strong> (PoAS {scaleTarget.poas}×)</p>
              <div className="flex gap-2 mb-4">
                {[10, 25, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setScalePct(pct)}
                    className={cn('flex-1 h-10 rounded-[6px] text-[13px] font-semibold border', scalePct === pct ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600')}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setScaleTarget(null); setScalePct(null); }} className="btn-secondary h-9 px-4">
                  Cancel
                </button>
                <button type="button" disabled={scalePct == null} onClick={handleScaleConfirm} className="btn-primary h-9 px-4 disabled:opacity-50">
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
