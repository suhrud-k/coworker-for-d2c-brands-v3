import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Minus,
  AlertCircle,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  HelpCircle,
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import {
  ChannelId,
  DateRange,
  GstMode,
  CHANNEL_TABS,
  INSIGHT_TILES,
  getScorecard,
  getPnlRows,
  getSkuLeaderboardByMarketplace,
  SKU_MARKETPLACE_OPTIONS,
  getCategoryMix,
  getDefaultExpandedRows,
  formatPnlAmount,
  formatPct,
  marginPctColor,
  channelDisplayName,
  unreconciledOrdersLabel,
  PnlRow,
} from '../data/channelEconomicsMockData';

export type AppTab = 'home' | 'pnl' | 'reconciliation' | 'returns' | 'ads' | 'cash' | 'reports' | 'compliance' | 'connections';

const DATE_RANGES: DateRange[] = ['Today', 'This Week', 'This Month', 'This Quarter', 'Custom'];

const DeltaArrow = ({ value, className }: { value: number; className?: string }) => {
  const isPositive = value >= 0;
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-[13px] font-medium',
        isPositive ? 'text-success' : 'text-error',
        className
      )}
    >
      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {isPositive ? '+' : '−'}
      {Math.abs(value)} pts
    </div>
  );
};

const InfoIcon = ({ tooltip, className }: { tooltip?: string; className?: string }) => (
  <span className={cn('relative group inline-flex shrink-0', className)}>
    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
    {tooltip && (
      <span className="pointer-events-none absolute left-0 bottom-full mb-1 hidden group-hover:block z-20 w-52 p-2 bg-white border border-gray-200 rounded-[6px] shadow-lg text-[11px] text-gray-600 font-normal leading-snug">
        {tooltip}
      </span>
    )}
  </span>
);

const Card = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    className={cn('card', className)}
    onClick={onClick}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {children}
  </div>
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
  <div className="flex items-center justify-between mt-6 mb-6 px-1">
    <div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

function renderAmountCell(row: PnlRow, field: 'incGst' | 'excGst') {
  const val = row[field];
  if (val === null) return <span className="tabular-nums">—</span>;
  const formatted = formatPnlAmount(val);
  const isNegative = val < 0;
  if (!row.sourceHint || val === 0) {
    return <span className={cn('tabular-nums', isNegative && 'text-error')}>{formatted}</span>;
  }
  return (
    <span className={cn('tabular-nums relative group/amt', isNegative && 'text-error')}>
      {formatted}
      <span className="pointer-events-none absolute bottom-full right-0 mb-1 hidden group-hover/amt:block z-10 w-56 p-2 bg-white border border-gray-200 rounded-[6px] shadow-lg text-[11px] text-gray-600 font-normal text-left">
        {row.sourceHint}
      </span>
    </span>
  );
}

export const ChannelEconomicsScreen = ({ onNavigate }: { onNavigate: (tab: AppTab) => void }) => {
  const [dateRange, setDateRange] = useState<DateRange>('This Month');
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>('shopify');
  const [gstMode, setGstMode] = useState<GstMode>('inc');
  const [compareWow, setCompareWow] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>(() =>
    getDefaultExpandedRows().map((id) => `shopify-${id}`)
  );
  const [skuSearch, setSkuSearch] = useState('');
  const [skuCategory, setSkuCategory] = useState('All categories');
  const [skuMarketplace, setSkuMarketplace] = useState<ChannelId | 'all'>('shopify');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportToast, setExportToast] = useState(false);
  const [skuToast, setSkuToast] = useState(false);
  const pnlSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpandedRows(getDefaultExpandedRows().map((id) => `${selectedChannel}-${id}`));
  }, [selectedChannel]);

  useEffect(() => {
    setSkuMarketplace(selectedChannel === 'all' ? 'all' : selectedChannel);
  }, [selectedChannel]);

  const scorecard = useMemo(() => getScorecard(dateRange), [dateRange]);
  const pinnedScorecard = useMemo(() => {
    if (selectedChannel === 'all') return scorecard;
    const selected = scorecard.find((r) => r.id === selectedChannel);
    const rest = scorecard.filter((r) => r.id !== selectedChannel);
    return selected ? [selected, ...rest] : scorecard;
  }, [scorecard, selectedChannel]);

  const pnlRows = useMemo(() => getPnlRows(selectedChannel, dateRange), [selectedChannel, dateRange]);
  const visiblePnlRows = pnlRows.filter((row) => !row.parentId || expandedRows.includes(row.parentId));

  const skuRows = useMemo(() => {
    const all = getSkuLeaderboardByMarketplace(skuMarketplace, dateRange);
    return all
      .filter((row) => {
        if (skuCategory !== 'All categories' && row.category !== skuCategory) return false;
        if (!skuSearch.trim()) return true;
        const q = skuSearch.toLowerCase();
        return (
          row.sku.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q) ||
          row.marketplace.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  }, [skuMarketplace, dateRange, skuSearch, skuCategory]);

  const skuSubtitleMarketplace =
    skuMarketplace === 'all' ? 'All marketplaces' : channelDisplayName(skuMarketplace);

  const categoryMix = useMemo(() => getCategoryMix(selectedChannel), [selectedChannel]);
  const dominantCategory = categoryMix[0];

  const toggleParent = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const scrollToPnl = (channel: ChannelId) => {
    setSelectedChannel(channel);
    setTimeout(() => pnlSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleExport = () => {
    setShowDownloadMenu(false);
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExportToast(true);
      setTimeout(() => setExportToast(false), 4000);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12 max-w-[1280px] mx-auto"
    >
      <SectionHeader
        title="Channel Economics"
        subtitle="Which channels make us money, and where the leaks are"
      >
        <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-[8px]">
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
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-8 z-[200] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium"
          >
            Report exported · click to download
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <div className="mb-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Channel scorecard</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">Sorted by contribution margin · {dateRange}</p>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Channel</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Orders</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">GMV</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Net Sales</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Contribution Margin (₹)</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Margin %</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">WoW Δ</th>
                <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pinnedScorecard.map((row) => {
                const isSelected = row.id === selectedChannel;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-purple-50/30',
                      isSelected && 'bg-purple-50 border-l-4 border-l-primary'
                    )}
                    onClick={() => setSelectedChannel(row.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2.5 h-2.5 rounded-[4px] shrink-0', row.colorClass)} />
                        <span className="text-[14px] font-semibold text-navy-950">{row.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[13px] text-gray-600 tabular-nums">{row.orders.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right text-[13px] font-semibold text-navy-950 tabular-nums">{row.gmv}</td>
                    <td className="px-6 py-4 text-right text-[13px] font-semibold text-navy-950 tabular-nums">{row.netSales}</td>
                    <td className="px-6 py-4 text-right text-[13px] font-bold text-navy-950 tabular-nums">{row.marginInr}</td>
                    <td className={cn('px-6 py-4 text-right text-[13px] font-bold tabular-nums', marginPctColor(row.marginPct))}>
                      {row.marginPct}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeltaArrow value={row.wow} className="justify-end" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-tertiary text-[12px] font-semibold whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToPnl(row.id);
                          }}
                        >
                          View P&L →
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INSIGHT_TILES.map((tile) => (
          <Card
            key={tile.id}
            className={cn(
              'cursor-pointer hover:shadow-md transition-shadow flex flex-col',
              tile.tone === 'critical' && 'bg-error-50/30 border-error-100',
              tile.tone === 'action' && 'bg-warning-50/30 border-warning-100',
              tile.tone === 'positive' && 'bg-success-50/30 border-success-100'
            )}
            onClick={() => onNavigate(tile.route)}
          >
            <AlertCircle
              className={cn(
                'w-5 h-5 mb-3',
                tile.tone === 'critical' && 'text-error',
                tile.tone === 'action' && 'text-warning',
                tile.tone === 'positive' && 'text-success'
              )}
            />
            <p className="text-[14px] text-navy-950 leading-relaxed flex-1">{tile.message}</p>
            <button
              type="button"
              className="btn-tertiary text-[13px] mt-4 text-left"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(tile.route);
              }}
            >
              {tile.linkLabel}
            </button>
          </Card>
        ))}
      </div>

      <div ref={pnlSectionRef}>
        <Card className="p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-0">
            <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Detailed channel P&L</h3>
            <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
              {CHANNEL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedChannel(tab.id)}
                  className={cn(
                    'px-4 py-2 text-[14px] transition-all relative font-medium whitespace-nowrap shrink-0',
                    selectedChannel === tab.id
                      ? 'bg-purple-50 text-primary font-semibold rounded-t-[8px]'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  {tab.label}
                  {selectedChannel === tab.id && (
                    <motion.div layoutId="channelPnlTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-[8px]">
              {(['inc', 'exc', 'both'] as GstMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGstMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all',
                    gstMode === mode ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  {mode === 'inc' ? 'Inc GST' : mode === 'exc' ? 'Exc GST' : 'Both'}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[13px] font-medium text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={compareWow}
                onChange={(e) => setCompareWow(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Compare WoW
            </label>
            <div className="flex-grow" />
            <div className="relative">
              <button
                type="button"
                disabled={exporting}
                onClick={() => setShowDownloadMenu((v) => !v)}
                className="btn-secondary h-9 px-4 text-[13px]"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Report
                  </>
                )}
              </button>
              {showDownloadMenu && !exporting && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-20 py-1 min-w-[140px]">
                  {['PDF', 'Excel', 'CSV'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-purple-50 hover:text-primary"
                      onClick={handleExport}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="px-6 py-2 text-[12px] text-gray-500 border-b border-gray-100">
            {unreconciledOrdersLabel(selectedChannel, dateRange)} · Ads synced till May 18, 2026 · 4:12 PM
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 w-[40%]">Category</th>
                  {(gstMode === 'inc' || gstMode === 'both') && (
                    <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">
                      Amount (inc GST)
                    </th>
                  )}
                  {(gstMode === 'exc' || gstMode === 'both') && (
                    <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">
                      Amount (exc GST)
                    </th>
                  )}
                  <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">% of Net Sales</th>
                  {compareWow && (
                    <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">WoW Δ</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visiblePnlRows.map((row) => {
                  const isParent = row.rowType === 'parent';
                  const isChild = row.rowType === 'child';
                  const isSubtotal = row.rowType === 'subtotal';
                  const isExpanded = expandedRows.includes(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-purple-50/30',
                        isSubtotal && 'bg-success-50/40',
                        isParent && 'cursor-pointer'
                      )}
                      onClick={() => isParent && toggleParent(row.id)}
                    >
                      <td className="px-6 py-3">
                        <div className={cn('flex items-center gap-2', isChild && 'pl-6')}>
                          {isParent && (
                            <span className="w-4 h-4 flex items-center justify-center text-gray-500 shrink-0">
                              {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </span>
                          )}
                          {!isParent && <span className="w-4 shrink-0" />}
                          <span
                            className={cn(
                              'text-[14px] text-navy-950',
                              isSubtotal ? 'font-bold' : 'font-normal',
                              isChild && 'text-gray-600'
                            )}
                          >
                            {row.label}
                          </span>
                          <InfoIcon tooltip={row.tooltip} />
                        </div>
                      </td>
                      {(gstMode === 'inc' || gstMode === 'both') && (
                        <td className="px-6 py-3 text-right text-[14px] font-medium">
                          {renderAmountCell(row, 'incGst')}
                        </td>
                      )}
                      {(gstMode === 'exc' || gstMode === 'both') && (
                        <td className="px-6 py-3 text-right text-[14px] font-medium">
                          {renderAmountCell(row, 'excGst')}
                        </td>
                      )}
                      <td className="px-6 py-3 text-right text-[14px] tabular-nums text-gray-600">
                        {formatPct(row.pctNetSales)}
                      </td>
                      {compareWow && (
                        <td className="px-6 py-3 text-right text-[13px]">
                          {row.wowDelta != null ? (
                            <span className={cn(row.wowDelta >= 0 ? 'text-success' : 'text-error')}>
                              {row.wowDelta >= 0 ? '+' : ''}
                              {row.wowDelta.toFixed(1)}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Top SKUs by contribution margin</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">
            On {skuSubtitleMarketplace} · {dateRange}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={skuMarketplace}
            onChange={(e) => setSkuMarketplace(e.target.value as ChannelId | 'all')}
            className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary min-w-[160px]"
          >
            {SKU_MARKETPLACE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU or category…"
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="h-9 w-full pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
            />
          </div>
          <select
            value={skuCategory}
            onChange={(e) => setSkuCategory(e.target.value)}
            className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          >
            <option>All categories</option>
            <option>Skincare</option>
            <option>Haircare</option>
            <option>Bodycare</option>
          </select>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Rank</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">SKU</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Category</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Units sold</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Net revenue</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Contribution ₹</th>
                <th className="px-6 py-3 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {skuRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[13px] text-gray-500">
                    No SKUs match your filters.
                  </td>
                </tr>
              ) : (
                skuRows.map((row) => (
                  <tr key={`${row.rank}-${row.sku}`} className="hover:bg-purple-50/20">
                    <td className="px-6 py-3 text-[13px] text-gray-500 tabular-nums">{row.rank}</td>
                    <td className="px-6 py-3 text-[14px] font-medium text-navy-950 max-w-[220px] truncate" title={row.sku}>
                      {row.sku}
                    </td>
                    <td className="px-6 py-3 text-[13px] text-gray-600">{row.category}</td>
                    <td className="px-6 py-3 text-right text-[13px] tabular-nums text-gray-600">{row.units.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3 text-right text-[13px] font-semibold text-navy-950 tabular-nums">{row.netRev}</td>
                    <td className="px-6 py-3 text-right text-[13px] font-semibold text-navy-950 tabular-nums">{row.marginInr}</td>
                    <td className={cn('px-6 py-3 text-right text-[13px] font-bold tabular-nums', marginPctColor(row.marginPct))}>
                      {row.marginPct.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pt-4 text-center border-t border-gray-100 mt-4">
          <button
            type="button"
            className="btn-tertiary text-[13px] font-semibold"
            onClick={() => {
              setSkuToast(true);
              setTimeout(() => setSkuToast(false), 3000);
            }}
          >
            View all SKUs →
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {skuToast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 right-8 z-[200] bg-white border border-gray-200 text-navy-950 px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium"
          >
            All SKUs view coming soon
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <div className="mb-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Margin contribution by category</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">
            On {channelDisplayName(selectedChannel)} · {dateRange}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryMix.map((c) => ({ name: c.name, value: c.pct }))}
                  innerRadius={56}
                  outerRadius={76}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryMix.map((c) => (
                    <Cell key={c.name} fill={c.color} stroke="none" />
                  ))}
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[20px] font-bold text-navy-950">{dominantCategory.pct}%</span>
              <span className="text-[12px] font-medium text-gray-500">{dominantCategory.name}</span>
            </div>
          </div>
          <div className="space-y-4">
            {categoryMix.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[14px] font-medium text-navy-950">{item.name}</span>
                  <span className="text-[13px] text-gray-500">{item.pct}%</span>
                </div>
                <span className="text-[14px] font-semibold text-navy-950 tabular-nums">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
