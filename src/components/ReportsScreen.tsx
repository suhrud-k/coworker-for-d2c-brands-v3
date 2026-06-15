import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Download,
  Share2,
  Lock,
  Unlock,
  RefreshCw,
  ArrowLeft,
  Check,
  X,
  Mail,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  ReportCategory,
  ReportDateRange,
  ReportEntity,
  REPORTS,
  REPORT_CATEGORIES,
  CATEGORY_LABELS,
  DATE_RANGES,
  ENTITIES,
  GENERATE_MESSAGES,
  getReportById,
  getStatementForReport,
  getTableReportData,
  isFinancialReport,
  StatementNode,
} from '../data/reportsMockData';
import { ArtifactStatementCard } from './ArtifactStatement';
import { getSavedReports, removeReport, type SavedReport } from '../state/savedReportsStore';

const StatusPill = ({
  status,
  text,
}: {
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
}) => {
  const colors = {
    success: 'bg-success-50 text-success border-success-50',
    warning: 'bg-warning-50 text-warning border-warning-50',
    error: 'bg-error-50 text-error border-error-50',
    info: 'bg-purple-50 text-primary border-purple-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[12px] font-medium border', colors[status])}>
      {text}
    </span>
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

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={cn('card', onClick && 'cursor-pointer', className)} onClick={onClick} role={onClick ? 'button' : undefined}>
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
  <div className="flex items-center justify-between mt-6 mb-6 px-1 flex-wrap gap-4">
    <div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);

function flattenExpandable(nodes: StatementNode[], expanded: Set<string>, depth = 0): { node: StatementNode; depth: number }[] {
  const out: { node: StatementNode; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length && expanded.has(node.id)) {
      out.push(...flattenExpandable(node.children, expanded, depth + 1));
    }
  }
  return out;
}

const StatementTable = ({
  nodes,
  periodLabel,
  compareLabel,
}: {
  nodes: StatementNode[];
  periodLabel: string;
  compareLabel: string;
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const walk = (list: StatementNode[]) => {
      list.forEach((n) => {
        if (n.children?.length) ids.add(n.id);
        if (n.children) walk(n.children);
      });
    };
    walk(nodes);
    return ids;
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rows = flattenExpandable(nodes, expanded);

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50/50">
          <th className="px-6 py-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            Particulars
          </th>
          <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">
            {periodLabel}
          </th>
          <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">
            {compareLabel}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map(({ node, depth }) => {
          const hasChildren = !!node.children?.length;
          const isOpen = expanded.has(node.id);
          if (node.section) {
            return (
              <tr key={node.id} className="bg-gray-50/30">
                <td colSpan={3} className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {node.label}
                </td>
              </tr>
            );
          }
          return (
            <tr
              key={node.id}
              className={cn(
                'hover:bg-purple-50/20 transition-colors',
                node.subtotal && 'bg-purple-50/40 font-bold',
                node.coworkerLine && 'border-l-4 border-l-primary'
              )}
            >
              <td
                className={cn(
                  'px-6 py-3 text-[14px]',
                  depth > 0 && 'text-gray-600',
                  depth === 0 && !node.subtotal && 'text-navy-950',
                  node.subtotal && 'text-navy-950 font-bold'
                )}
                style={{ paddingLeft: `${24 + depth * 20}px` }}
              >
                <div className="flex items-center gap-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggle(node.id)}
                      className="p-0.5 text-gray-400 hover:text-primary shrink-0"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <span className="w-5 shrink-0" />
                  )}
                  <span className={node.coworkerLine ? 'text-primary font-semibold' : undefined}>{node.label}</span>
                  {node.source && <InfoIcon tooltip={node.source} />}
                </div>
              </td>
              <td
                className={cn(
                  'px-6 py-3 text-right tabular-nums text-[14px]',
                  node.subtotal ? 'font-bold text-navy-950' : 'text-gray-700',
                  node.current.startsWith('(') && !node.subtotal && 'text-error'
                )}
              >
                {node.current || '—'}
              </td>
              <td className="px-6 py-3 text-right tabular-nums text-[14px] text-gray-400 font-medium">
                {node.comparison || '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export interface ReportsScreenProps {
  onNavigateCompliance?: () => void;
}

export const ReportsScreen = ({ onNavigateCompliance }: ReportsScreenProps) => {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [openSavedReportId, setOpenSavedReportId] = useState<string | null>(null);
  const [category, setCategory] = useState<ReportCategory>('all');
  const [dateRange, setDateRange] = useState<ReportDateRange>('Last Financial Year');
  const [entity, setEntity] = useState<ReportEntity>('All entities');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStep, setGenerateStep] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [periodLocked, setPeriodLocked] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [auditorEmail, setAuditorEmail] = useState('');
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [comparison, setComparison] = useState('vs Last Period');
  const [granularity, setGranularity] = useState<'Consolidated' | 'Channel-wise' | 'Schedule III only'>('Consolidated');
  const [includeUnsettled, setIncludeUnsettled] = useState(true);
  const [gstMode, setGstMode] = useState<'Inclusive' | 'Exclusive'>('Exclusive');

  const [orderChannels, setOrderChannels] = useState<string[]>(['All']);
  const [orderStatus, setOrderStatus] = useState('All');

  const syncLag = false;
  const activeReport = activeReportId ? getReportById(activeReportId) : null;

  useEffect(() => {
    setActiveReportId(null);
    setReportVisible(false);
  }, [category]);

  const filteredReports = useMemo(() => {
    if (category === 'all') return REPORTS;
    return REPORTS.filter((r) => r.category === category);
  }, [category]);

  const groupedReports = useMemo(() => {
    if (category !== 'all') return [{ cat: category, reports: filteredReports }];
    const cats = ['financial', 'marketplace', 'tax', 'payments', 'sku'] as const;
    return cats.map((cat) => ({
      cat,
      reports: REPORTS.filter((r) => r.category === cat),
    }));
  }, [category, filteredReports]);

  const handleGenerate = useCallback(() => {
    if (periodLocked) return;
    setIsGenerating(true);
    setReportVisible(false);
    setGenerateStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setGenerateStep(step);
      if (step >= GENERATE_MESSAGES.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setReportVisible(true);
        }, 400);
      }
    }, 400);
  }, [periodLocked]);

  useEffect(() => {
    setSavedReports(getSavedReports());
  }, []);

  useEffect(() => {
    if (!exportToast) return;
    const t = setTimeout(() => setExportToast(null), 4000);
    return () => clearTimeout(t);
  }, [exportToast]);

  const handleExport = (format: string) => {
    setExporting(true);
    setDownloadOpen(false);
    setTimeout(() => {
      setExporting(false);
      setExportToast(`Report exported as ${format} · click to download`);
    }, 600);
  };

  const handleShare = () => {
    setShareOpen(false);
    setExportToast('Report shared with auditor · confirmation sent');
  };

  const backToHub = () => {
    setActiveReportId(null);
    setReportVisible(false);
    setIsGenerating(false);
  };

  const periodLabel = dateRange === 'Last Financial Year' ? 'FY 2025–26' : dateRange;
  const compareLabel = comparison.replace('vs ', '');

  const statementData = activeReportId ? getStatementForReport(activeReportId) : null;
  const tableData = activeReportId && !isFinancialReport(activeReportId) ? getTableReportData(activeReportId) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-[1280px] mx-auto">
      <SectionHeader
        title="Reports"
        subtitle="Financial statements, marketplace operations, tax, payments, and SKU analytics"
      >
        <StatusPill status={syncLag ? 'warning' : 'success'} text={syncLag ? 'Sync lag detected' : 'Audit ready'} />
      </SectionHeader>

      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-8 z-[200] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium max-w-sm"
          >
            {exportToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global filters */}
      <Card>
        <div className="space-y-3">
          <div>
            <h3 className="text-[15px] font-semibold text-navy-950">Saved from chat</h3>
            <p className="text-[12px] text-gray-500">Reports you save from chat will appear here.</p>
          </div>
          {savedReports.length === 0 ? (
            <p className="text-[13px] text-gray-500">Try asking “Generate P&L for last quarter”.</p>
          ) : (
            <div className="space-y-2">
              {savedReports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-[8px] p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900">
                      {report.type === 'pnl' ? 'P&L' : report.type === 'balance-sheet' ? 'Balance Sheet' : 'Cash Flow Statement'}
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {report.periodLabel} · saved {new Date(report.savedAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="btn-secondary h-8 px-3 text-[12px]" onClick={() => setOpenSavedReportId(report.id)}>
                      Open
                    </button>
                    <button
                      type="button"
                      className="text-[12px] text-error"
                      onClick={() => {
                        removeReport(report.id);
                        const next = getSavedReports();
                        setSavedReports(next);
                        if (openSavedReportId === report.id) setOpenSavedReportId(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {openSavedReportId && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[14px] font-semibold text-navy-950">Saved report preview</h4>
            <button type="button" className="text-[12px] text-gray-500" onClick={() => setOpenSavedReportId(null)}>
              Close
            </button>
          </div>
          {savedReports.find(r => r.id === openSavedReportId)?.statement && (
            <ArtifactStatementCard artifact={savedReports.find(r => r.id === openSavedReportId)!.statement} />
          )}
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-[8px]">
            {DATE_RANGES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDateRange(p)}
                className={cn(
                  'px-3 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all',
                  dateRange === p ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value as ReportEntity)}
            className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] outline-none focus:border-primary min-w-[180px]"
          >
            {ENTITIES.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {!activeReportId ? (
        <>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-[8px] w-full md:w-max overflow-x-auto">
            {REPORT_CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-[6px] text-[13px] font-semibold transition-all whitespace-nowrap',
                  category === tab.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Report card grid */}
          {groupedReports.map(({ cat, reports }) => (
            <div key={cat}>
              {category === 'all' && (
                <h3 className="text-[14px] font-medium uppercase tracking-wider text-gray-500 mt-8 mb-3">
                  {CATEGORY_LABELS[cat]}
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <Card
                      key={report.id}
                      className="flex flex-col min-h-[140px] hover:shadow-[0_1px_3px_rgba(17,24,39,0.06)]"
                      onClick={() => {
                        setActiveReportId(report.id);
                        setReportVisible(false);
                      }}
                    >
                      <Icon className="w-[18px] h-[18px] text-primary mb-3" />
                      <h4 className="text-[16px] font-semibold text-navy-950">{report.name}</h4>
                      <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 flex-grow">{report.description}</p>
                      <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                        <span className="text-[12px] text-gray-400">Last generated · {report.lastGenerated}</span>
                        <span className="btn-tertiary text-[13px]">View →</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        activeReport && (
          <motion.div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={backToHub} className="btn-secondary h-9 px-3 text-[13px] gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Reports
              </button>
              <div className="text-[13px] text-gray-500">
                Reports / {CATEGORY_LABELS[activeReport.category]} /{' '}
                <span className="text-navy-950 font-medium">{activeReport.name}</span>
              </div>
              {periodLocked && <StatusPill status="info" text="Locked" />}
            </div>

            {/* GSTR-2B redirect */}
            {activeReportId === 'gstr2b' ? (
              <Card>
                <p className="text-[14px] text-gray-600 mb-4">
                  GSTR-2B reconciliation lives in Compliance — vendor-by-vendor match with ITC at-risk flags.
                </p>
                <button type="button" onClick={onNavigateCompliance} className="btn-primary h-10 px-6">
                  Open Compliance → GSTR-2B
                </button>
              </Card>
            ) : (
              <>
                {/* Sub-filters */}
                <Card>
                  {isFinancialReport(activeReportId) ? (
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                          Comparison
                        </label>
                        <select
                          value={comparison}
                          onChange={(e) => setComparison(e.target.value)}
                          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px]"
                        >
                          <option>vs Last Period</option>
                          <option>vs Last Year</option>
                          <option>vs Budget</option>
                          <option>No comparison</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                          Granularity
                        </label>
                        <div className="flex gap-1 p-1 bg-gray-100 rounded-[6px]">
                          {(['Consolidated', 'Channel-wise', 'Schedule III only'] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGranularity(g)}
                              className={cn(
                                'px-3 py-1 rounded-[4px] text-[12px] font-semibold',
                                granularity === g ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeUnsettled}
                          onChange={(e) => setIncludeUnsettled(e.target.checked)}
                          className="rounded border-gray-300 text-primary"
                        />
                        Include unsettled
                      </label>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                          GST
                        </label>
                        <div className="flex gap-1 p-1 bg-gray-100 rounded-[6px]">
                          {(['Inclusive', 'Exclusive'] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGstMode(g)}
                              className={cn(
                                'px-3 py-1 rounded-[4px] text-[12px] font-semibold',
                                gstMode === g ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : activeReportId === 'marketplace-orders' ? (
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 uppercase block mb-1">Channel</label>
                        <select
                          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px]"
                          value={orderChannels[0]}
                          onChange={(e) => setOrderChannels([e.target.value])}
                        >
                          {['All', 'Shopify', 'Amazon', 'Flipkart', 'Myntra', 'Meesho'].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 uppercase block mb-1">Status</label>
                        <select
                          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px]"
                          value={orderStatus}
                          onChange={(e) => setOrderStatus(e.target.value)}
                        >
                          {['All', 'Delivered', 'Returned', 'RTO'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-500">
                      Period: {periodLabel} · Entity: {entity}
                    </p>
                  )}
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isGenerating || periodLocked}
                    onClick={handleGenerate}
                    title={periodLocked ? 'Period is locked. Unlock to regenerate.' : undefined}
                    className={cn('btn-primary h-10 px-6', (isGenerating || periodLocked) && 'opacity-60 cursor-not-allowed')}
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    {isGenerating ? 'Generating…' : isFinancialReport(activeReportId) ? 'Generate statement' : 'Generate report'}
                  </button>
                  {isGenerating && (
                    <span className="text-[13px] text-primary font-medium animate-pulse">
                      {GENERATE_MESSAGES[Math.min(generateStep, GENERATE_MESSAGES.length - 1)]}
                    </span>
                  )}
                  {isFinancialReport(activeReportId) && reportVisible && (
                    <>
                      <div className="relative ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPeriodLocked((v) => !v)}
                          className="btn-secondary h-9 px-3 text-[13px] gap-2"
                        >
                          {periodLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {periodLocked ? 'Unlock period' : 'Lock period'}
                        </button>
                        <button type="button" onClick={() => setShareOpen(true)} className="btn-secondary h-9 px-3 text-[13px] gap-2">
                          <Share2 className="w-4 h-4" />
                          Share with auditor
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDownloadOpen((v) => !v)}
                            className="btn-secondary h-9 px-3 text-[13px] gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          {downloadOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg py-1 z-20 min-w-[200px]">
                              {['PDF', 'Excel (Schedule III)', 'CSV', 'Tally XML'].map((fmt) => (
                                <button
                                  key={fmt}
                                  type="button"
                                  disabled={exporting}
                                  onClick={() => handleExport(fmt)}
                                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-purple-50 text-gray-700"
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {reportVisible && statementData && (
                  <>
                    {includeUnsettled && activeReportId === 'pnl' && (
                      <Card className="bg-purple-50 border-primary/20">
                        <p className="text-[13px] text-primary font-medium">
                          Includes pending settlements of ₹52.4 L as accrued revenue. This is what distinguishes this
                          statement from your standalone Tally P&L.
                        </p>
                      </Card>
                    )}
                    <Card className="p-0 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                        <div>
                          <h3 className="text-[18px] font-bold text-navy-950">{activeReport.name}</h3>
                          <p className="text-[12px] text-gray-500 mt-1">
                            {periodLabel} · {entity} · {granularity} · GST {gstMode}
                          </p>
                        </div>
                        {activeReportId === 'balance-sheet' && (
                          <div className="flex items-center gap-1 text-success text-[12px] font-medium" title="Balance sheet reconciles.">
                            <Check className="w-4 h-4" />
                            Reconciled
                          </div>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <StatementTable nodes={statementData} periodLabel={periodLabel} compareLabel={compareLabel} />
                      </div>
                    </Card>
                    {activeReportId === 'balance-sheet' && (
                      <Card className="border-l-4 border-l-primary">
                        <p className="text-[13px] text-gray-600">
                          ₹52.4 L of pending settlements is included as receivables. Most accounting tools wouldn&apos;t
                          show this because they don&apos;t read live PG and marketplace data.
                        </p>
                      </Card>
                    )}
                    {activeReportId === 'cash-flow' && (
                      <p className="text-[12px] text-gray-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-success" />
                        Closing cash reconciles to Balance Sheet cash and cash equivalents line.
                      </p>
                    )}
                  </>
                )}

                {reportVisible && tableData && (
                  <Card className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="text-[16px] font-semibold text-navy-950">{activeReport.name}</h3>
                      <p className="text-[12px] text-gray-500">{periodLabel} · {entity}</p>
                    </div>
                    <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                          <tr>
                            {tableData.columns.map((col) => (
                              <th
                                key={col.key}
                                className={cn(
                                  'px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100',
                                  col.align === 'right' && 'text-right'
                                )}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tableData.rows
                            .filter((row) => {
                              if (activeReportId !== 'marketplace-orders') return true;
                              if (orderChannels[0] !== 'All' && row.channel !== orderChannels[0]) return false;
                              if (orderStatus !== 'All' && row.status !== orderStatus) return false;
                              return true;
                            })
                            .map((row, i) => (
                              <tr key={i} className="hover:bg-purple-50/20">
                                {tableData.columns.map((col) => (
                                  <td
                                    key={col.key}
                                    className={cn(
                                      'px-4 py-3 text-[13px] text-gray-700',
                                      col.align === 'right' && 'text-right tabular-nums',
                                      col.key === 'sku' && 'font-medium text-navy-950',
                                      col.key === 'var' && row[col.key]?.startsWith('₹') && row[col.key] !== '₹0' && 'text-error font-semibold'
                                    )}
                                  >
                                    {row[col.key]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                      <button type="button" onClick={() => handleExport('CSV')} className="btn-secondary h-9 px-4 text-[13px]">
                        Download CSV
                      </button>
                      {activeReportId === 'gstr1' && (
                        <button type="button" onClick={() => handleExport('JSON (GST portal)')} className="btn-primary h-9 px-4 text-[13px]">
                          Download JSON
                        </button>
                      )}
                    </div>
                  </Card>
                )}

                {!reportVisible && !isGenerating && activeReportId !== 'gstr2b' && (
                  <div className="py-16 border border-dashed border-gray-200 rounded-[12px] flex flex-col items-center text-gray-400 gap-2">
                    <p className="text-[14px] font-medium text-gray-500">Configure filters and generate</p>
                    <p className="text-[12px]">Data from Tally, Cashfree PG, and 5 marketplaces for {periodLabel}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )
      )}

      {/* Share modal */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-950/20 z-[200]"
              onClick={() => setShareOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[12px] shadow-2xl z-[201] p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold text-navy-950">Share with auditor</h3>
                <button type="button" onClick={() => setShareOpen(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <label className="text-[12px] text-gray-500 block mb-1">Auditor email</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={auditorEmail}
                    onChange={(e) => setAuditorEmail(e.target.value)}
                    placeholder="auditor@firm.com"
                    className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-[6px] text-[14px]"
                  />
                </div>
                <button type="button" onClick={handleShare} className="btn-primary h-10 px-4">
                  Send
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
