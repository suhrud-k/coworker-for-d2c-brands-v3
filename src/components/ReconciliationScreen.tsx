import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, Check, X, ChevronDown, ChevronUp, ChevronRight, Filter, ExternalLink,
  TrendingDown, TrendingUp, Clock, AlertCircle, Search, Calendar,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatIndianCurrency, formatLargeAmount, formatAging, formatVariance, exceptionTypeFromLabel, exceptionTypeLabel } from '../lib/formatters';
import {
  mockExceptions, mockStatements, mockUnreconciledTxns, mockInflows, mockOutflows, mockCategorisedTxns,
} from '../data/reconciliationMockData';
import type { ReconciliationException, BankStatement, BankTransaction, CategoryRollup } from '../types';
import { Card, SectionHeader, StatusPill, DeltaArrow, Drawer } from './shared/ui';

type ExceptionFilters = { type: string; source: string; aging: string; variance: string; search: string };
type CategorisedFilters = { date: string; bank: string; direction: string; search: string };
type StatementFilters = { bank: string; search: string; dateFrom: string; dateTo: string };

const formatExceptionReference = (ex: ReconciliationException) => {
  if (!ex.bankTxnId) return '—';
  return ex.bankAccountLabel ? `${ex.bankAccountLabel} / ${ex.bankTxnId}` : ex.bankTxnId;
};

const filterExceptions = (filters: ExceptionFilters) =>
  mockExceptions.filter(ex => {
    const typeKey = exceptionTypeFromLabel(filters.type);
    if (typeKey !== 'All' && ex.type !== typeKey) return false;
    if (filters.source !== 'All' && ex.source !== filters.source) return false;
    if (filters.aging === '> 24 hrs' && ex.agingHours <= 24) return false;
    if (filters.aging === '> 3 days' && ex.agingHours <= 72) return false;
    if (filters.aging === '> 7 days' && ex.agingHours <= 168) return false;
    const absVar = Math.abs(ex.variance);
    if (filters.variance === '> ₹10 K' && absVar <= 10000) return false;
    if (filters.variance === '> ₹50 K' && absVar <= 50000) return false;
    if (filters.variance === '> ₹1 L' && absVar <= 100000) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [ex.source, ex.bankTxnId, ex.narration, ex.description].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

const ExceptionsTab = ({
  filters,
  setFilters,
  showAll,
  onToggleShowAll,
  onSelectException,
}: {
  filters: ExceptionFilters;
  setFilters: React.Dispatch<React.SetStateAction<ExceptionFilters>>;
  showAll: boolean;
  onToggleShowAll: () => void;
  onSelectException: (ex: ReconciliationException) => void;
}) => {
  const sorted = filterExceptions(filters)
    .filter(ex => ex.status === 'open')
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  const priorityTypes = ['overcharge', 'missing_settlement', 'amount_mismatch', 'unidentified_debit'] as const;
  const priorityExceptions = priorityTypes
    .map(type => sorted.find(ex => ex.type === type))
    .filter((ex): ex is ReconciliationException => ex != null);
  const visibleExceptions = showAll ? sorted : priorityExceptions;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-[12px] border border-gray-200">
        <select 
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          <option>All types</option>
          <option>Amount mismatch</option>
          <option>Missing settlement</option>
          <option>Overcharge</option>
          <option>Duplicate credit</option>
          <option>Unidentified debit</option>
        </select>
        <select 
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.source}
          onChange={e => setFilters({ ...filters, source: e.target.value })}
        >
          <option>All sources</option>
          <option>Amazon</option>
          <option>Flipkart</option>
          <option>Myntra</option>
          <option>Meesho</option>
          <option>Cashfree PG</option>
          <option>Razorpay</option>
          <option>HDFC</option>
          <option>ICICI</option>
        </select>
        <select
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.aging}
          onChange={e => setFilters({ ...filters, aging: e.target.value })}
        >
          <option>All</option>
          <option>&gt; 24 hrs</option>
          <option>&gt; 3 days</option>
          <option>&gt; 7 days</option>
        </select>
        <select
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.variance}
          onChange={e => setFilters({ ...filters, variance: e.target.value })}
        >
          <option>All</option>
          <option>&gt; ₹10 K</option>
          <option>&gt; ₹50 K</option>
          <option>&gt; ₹1 L</option>
        </select>
        <div className="flex-grow" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by source, ID, narration…"
            className="h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary w-64"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Type</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Source</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Reference</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Expected</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Actual</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Variance</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Aging</th>
              <th className="px-6 py-4 text-[12px] font-medium text-gray-500 text-right uppercase tracking-wider border-b border-gray-100">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleExceptions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-gray-500">
                  No exceptions match your filters.
                </td>
              </tr>
            ) : visibleExceptions.map((ex) => (
              <tr 
                key={ex.id} 
                className="hover:bg-purple-50/20 group transition-colors cursor-pointer"
                onClick={() => onSelectException(ex)}
              >
                <td className="px-6 py-4">
                  <StatusPill 
                    status={ex.type === 'amount_mismatch' || ex.type === 'missing_settlement' ? 'error' : 'warning'} 
                    text={exceptionTypeLabel(ex.type)} 
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-[4px] text-[11px] font-bold text-gray-600 uppercase">
                    {ex.source}
                  </span>
                </td>
                <td className="px-6 py-4 text-[12px] font-medium text-gray-500 max-w-[180px] truncate" title={formatExceptionReference(ex)}>
                  {formatExceptionReference(ex)}
                </td>
                <td className="px-6 py-4 text-right text-[14px] font-bold text-navy-950 tabular-nums">
                  {formatIndianCurrency(ex.expectedAmount)}
                </td>
                <td className={cn("px-6 py-4 text-right text-[14px] font-bold tabular-nums", ex.actualAmount === null || ex.actualAmount < ex.expectedAmount ? "text-error" : "text-navy-950")}>
                  {ex.actualAmount !== null ? formatIndianCurrency(ex.actualAmount) : '—'}
                </td>
                <td className="px-6 py-4 text-right text-[14px] font-bold text-error tabular-nums">
                  {formatVariance(ex.variance)}
                </td>
                <td className="px-6 py-4 text-right text-[12px] font-medium text-gray-400 tabular-nums">
                  {formatAging(ex.agingHours)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button className="btn-tertiary h-[32px] text-[12px] font-bold whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {ex.actionLabel}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!showAll && sorted.length > 4 && (
          <div className="p-4 border-t border-gray-100 text-center">
            <button className="btn-tertiary text-[13px] font-bold" onClick={onToggleShowAll}>
              View all {sorted.length} exceptions →
            </button>
          </div>
        )}
        {showAll && (
          <div className="p-4 border-t border-gray-100 text-center">
            <button className="btn-tertiary text-[13px] font-bold" onClick={onToggleShowAll}>
              Show priority 4 only
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

const filterCategories = (categories: CategoryRollup[], filters: CategorisedFilters) => {
  let list = categories;
  if (filters.direction === 'Inflows only') list = list.filter(c => c.type === 'inflow');
  else if (filters.direction === 'Outflows only') list = list.filter(c => c.type === 'outflow');
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.subCategories.some(s => s.name.toLowerCase().includes(q)) ||
      c.transactions?.some(t => t.narration.toLowerCase().includes(q) || t.subCategory.toLowerCase().includes(q))
    );
  }
  return list;
};

const CategorisedTab = ({ filters, setFilters, onJumpToExceptions }: { filters: CategorisedFilters, setFilters: React.Dispatch<React.SetStateAction<CategorisedFilters>>, onJumpToExceptions: (source: string) => void }) => {
  const [expandedInflows, setExpandedInflows] = useState(true);
  const [expandedOutflows, setExpandedOutflows] = useState(true);
  const filteredInflows = filterCategories(mockInflows, filters);
  const filteredOutflows = filterCategories(mockOutflows, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-[12px] border border-gray-200">
        <select
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.date}
          onChange={e => setFilters({ ...filters, date: e.target.value })}
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This month</option>
          <option>Last month</option>
          <option>Custom</option>
        </select>
        <select
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.bank}
          onChange={e => setFilters({ ...filters, bank: e.target.value })}
        >
          <option>All accounts</option>
          <option>HDFC ··2847</option>
          <option>ICICI ··5621</option>
        </select>
        <select
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary"
          value={filters.direction}
          onChange={e => setFilters({ ...filters, direction: e.target.value })}
        >
          <option>All directions</option>
          <option>Inflows only</option>
          <option>Outflows only</option>
        </select>
        <div className="flex-grow" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by narration, category..."
            className="h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none focus:border-primary w-64"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Inflows</div>
          <div className="text-[24px] font-bold text-success tabular-nums">₹1.29 Cr</div>
          <div className="text-[12px] text-gray-500 mt-1">across 95 transactions · last 7 days</div>
        </Card>
        <Card className="p-6">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Outflows</div>
          <div className="text-[24px] font-bold text-error tabular-nums">₹50.0 L</div>
          <div className="text-[12px] text-gray-500 mt-1">across 42 transactions · last 7 days</div>
        </Card>
        <Card className="p-6">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Net</div>
          <div className="text-[24px] font-bold text-navy-950 tabular-nums">₹78.6 L</div>
          <div className="text-[12px] text-gray-500 mt-1">Surplus position</div>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Inflows Section */}
        <div className="space-y-2">
          <button 
            onClick={() => setExpandedInflows(!expandedInflows)}
            className="flex items-center gap-2 px-1 text-[13px] font-bold text-gray-500 uppercase tracking-wider"
          >
            {expandedInflows ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Inflows ({filteredInflows.length})
          </button>
          {expandedInflows && (
            <div className="space-y-2">
              {filteredInflows.map(cat => (
                <CategoryRow key={cat.id} category={cat} onJump={onJumpToExceptions} />
              ))}
            </div>
          )}
        </div>

        {/* Outflows Section */}
        <div className="space-y-2">
          <button 
            onClick={() => setExpandedOutflows(!expandedOutflows)}
            className="flex items-center gap-2 px-1 text-[13px] font-bold text-gray-500 uppercase tracking-wider"
          >
            {expandedOutflows ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Outflows ({filteredOutflows.length})
          </button>
          {expandedOutflows && (
            <div className="space-y-2">
              {filteredOutflows.map(cat => (
                <CategoryRow key={cat.id} category={cat} onJump={onJumpToExceptions} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategoryRow = ({ category, onJump }: { category: CategoryRollup, onJump: (s: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExceptions = Boolean(category.linkedExceptionSource && category.linkedExceptionCount);

  return (
    <Card className="p-0 overflow-hidden">
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 flex items-center justify-center text-gray-400">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-navy-950">{category.name}</span>
              {hasExceptions && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onJump(category.linkedExceptionSource!); }}
                  className="flex items-center gap-1 text-[12px] font-medium text-error hover:underline"
                >
                  <AlertCircle className="w-3 h-3" />
                  {category.linkedExceptionCount} linked exceptions
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {category.subCategories.slice(0, 4).map(sub => (
                <span key={sub.name} className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-semibold text-gray-500 uppercase">
                  {sub.name}
                </span>
              ))}
              {category.subCategories.length > 4 && (
                <span className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-semibold text-gray-400 uppercase">
                  +{category.subCategories.length - 4} MORE
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[18px] font-bold text-navy-950 tabular-nums">
            {category.type === 'outflow' ? '−' : ''}{formatIndianCurrency(category.total)}
          </div>
          <div className="text-[12px] text-gray-400 font-medium">
            {category.txnCount} transactions
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
          <div className="space-y-1">
            {(category.transactions && category.transactions.length > 0 ? category.transactions : []).map(txn => (
              <div key={txn.id} className="flex items-start justify-between gap-4 py-2 text-[13px] border-b border-gray-100 last:border-0">
                <div className="min-w-0 flex-grow">
                  <div className="text-[11px] font-medium text-gray-400 tabular-nums">
                    {new Date(txn.postedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="text-[13px] font-semibold text-navy-950 truncate" title={txn.narration}>{txn.narration}</div>
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-semibold text-gray-500">{txn.subCategory}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn("text-[14px] font-bold tabular-nums", txn.amount < 0 ? "text-error" : "text-success")}>
                    {txn.amount < 0 ? '−' : '+'}{formatIndianCurrency(Math.abs(txn.amount))}
                  </div>
                  <button className="text-primary font-semibold text-[11px] hover:underline mt-1 block ml-auto">View in bank statement →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const filterStatements = (filters: StatementFilters) =>
  mockStatements.filter(st => {
    if (filters.bank === 'HDFC ··2847' && st.accountIdLast4 !== '2847') return false;
    if (filters.bank === 'ICICI ··5621' && st.accountIdLast4 !== '5621') return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!st.id.toLowerCase().includes(q) && !st.bankName.toLowerCase().includes(q)) return false;
    }
    if (filters.dateFrom && st.date < filters.dateFrom) return false;
    if (filters.dateTo && st.date > filters.dateTo) return false;
    return true;
  });

const StatementsTab = ({ filters, setFilters, onViewTxns }: { filters: StatementFilters, setFilters: React.Dispatch<React.SetStateAction<StatementFilters>>, onViewTxns: (st: BankStatement, type: 'categorised' | 'unreconciled') => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-[12px] border border-gray-200">
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none" />
            <span className="text-gray-400 text-[13px] self-center">–</span>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none" />
          </div>
        </div>
        <select 
          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none"
          value={filters.bank}
          onChange={e => setFilters({ ...filters, bank: e.target.value })}
        >
          <option>All accounts</option>
          <option>HDFC ··2847</option>
          <option>ICICI ··5621</option>
        </select>
        <div className="flex-grow" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by statement ID, bank..."
            className="h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-medium outline-none w-64"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filterStatements(filters).map(st => (
          <Card key={st.id} className="p-0 overflow-hidden hover:border-gray-300 transition-colors">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-grow">
                <div className="w-12 h-12 bg-gray-100 rounded-[8px] flex flex-col items-center justify-center border border-gray-200 shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">{new Date(st.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="text-[18px] font-bold text-navy-950 leading-none mt-1">{new Date(st.date).getDate()}</span>
                </div>
                <div className="space-y-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-navy-950">{st.bankName}</span>
                    <span className="text-[13px] text-gray-500 font-medium">··{st.accountIdLast4}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-bold text-gray-400 uppercase">{st.accountType}</span>
                  </div>
                  <div className="text-[12px] text-gray-400 font-medium">
                    {st.txnCount} transactions · Opening {formatLargeAmount(st.openingBalance)} → Closing {formatLargeAmount(st.closingBalance)}
                  </div>
                </div>
                <div className="hidden md:flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-[13px] font-semibold text-gray-600">{st.categorisedCount} categorised</span>
                   </div>
                   {st.unreconciledCount > 0 && (
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-[13px] font-semibold text-warning">{st.unreconciledCount} unreconciled</span>
                        <AlertCircle className="w-3.5 h-3.5 text-warning" />
                     </div>
                   )}
                </div>
              </div>
              <div className="flex md:flex-col gap-2 shrink-0">
                <button onClick={() => onViewTxns(st, 'categorised')} className="btn-tertiary text-[12px] font-bold text-primary px-2 h-8 text-right hover:bg-purple-50">View categorised txns →</button>
                <button onClick={() => onViewTxns(st, 'unreconciled')} className={cn("btn-tertiary text-[12px] font-bold px-2 h-8 text-right", st.unreconciledCount > 0 ? "text-warning hover:bg-warning/5" : "text-gray-400")}>View unreconciled txns →</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ExceptionDetail = ({ exception, onClose }: { exception: ReconciliationException, onClose: () => void }) => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusPill 
            status={exception.type === 'amount_mismatch' || exception.type === 'missing_settlement' ? 'error' : 'warning'} 
            text={exception.type.replace('_', ' ').toUpperCase()} 
          />
          <span className="px-2 py-1 bg-gray-100 rounded-[4px] text-[11px] font-bold text-gray-600 uppercase">
            {exception.source}
          </span>
          <span className="text-[12px] font-medium text-gray-400 ml-auto flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {formatAging(exception.agingHours)} ago
          </span>
        </div>
        <p className="text-[15px] font-bold text-navy-950 leading-relaxed">
          {exception.description}
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Three-Way Match Trail</h3>
        <div className="space-y-4">
          {[
            { label: 'Marketplace Report', status: 'pass', val: formatIndianCurrency(exception.expectedAmount) },
            { label: 'CoWorker Normalisation', status: 'pass', val: formatIndianCurrency(exception.expectedAmount) },
            { label: 'Bank Statement Match', status: (exception.actualAmount === null || exception.actualAmount < exception.expectedAmount) ? 'fail' : 'pass', val: exception.actualAmount !== null ? formatIndianCurrency(exception.actualAmount) : 'Pending credit' },
          ].map((step, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2",
                  step.status === 'pass' ? "bg-success border-success text-white" : 
                  step.status === 'fail' ? "bg-error border-error text-white" : 
                  "bg-white border-gray-200 text-gray-300"
                )}>
                  {step.status === 'pass' ? <Check className="w-3.5 h-3.5" /> : step.status === 'fail' ? <X className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>
                {i < 2 && <div className="w-[2px] h-10 bg-gray-100 group-last:hidden" />}
              </div>
              <div className="pt-0.5 space-y-1">
                <div className="text-[13px] font-bold text-navy-950">{step.label}</div>
                <div className="text-[12px] text-gray-500 font-medium tabular-nums">{step.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-[12px] border border-gray-100 space-y-4">
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Source Documents</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white border border-gray-100 rounded-[6px] flex items-center justify-center text-primary font-bold text-[12px]">F</div>
             <div className="space-y-0.5">
               <div className="text-[13px] font-bold text-navy-950">Source · {exception.source} Seller Hub Settlement Report</div>
               <div className="text-[11px] text-gray-400 font-medium">synced 12 min ago</div>
             </div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300 hover:text-primary transition-colors cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4">
        <button className="btn-primary h-12 w-full text-[14px]">
          {exception.actionLabel}
        </button>
        <button className="btn-secondary h-12 w-full text-[14px]">
          Mark as investigating
        </button>
        <button className="btn-tertiary h-10 w-full text-[14px] text-gray-400">
          Mark as resolved
        </button>
      </div>
    </div>
  );
};

const BankTxnDrawer = ({
  statement,
  type,
  onClose,
  onBulkCategorised,
}: {
  statement: BankStatement;
  type: 'categorised' | 'unreconciled';
  onClose: () => void;
  onBulkCategorised?: (count: number) => void;
}) => {
  const [selectedTxns, setSelectedTxns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isBulkEnabled = selectedTxns.length > 0;

  const statementTxns = (type === 'unreconciled' ? mockUnreconciledTxns : mockCategorisedTxns).filter(
    t => t.statementId === statement.id
  );

  const credits = statementTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const debits = statementTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const handleToggleSelect = (id: string) => {
    setSelectedTxns(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));
  };

  const handleBulkReconcile = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsProcessing(false);
    onBulkCategorised?.(selectedTxns.length);
    onClose();
  };

  return (
    <div className="flex flex-col h-full -mx-6 -my-6">
      <div className="p-6 bg-gray-50 border-b border-gray-100 space-y-4">
        {type === 'unreconciled' ? (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-[12px] flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-[14px] font-bold text-navy-950">{statementTxns.length} transactions could not be auto-categorised. Suggested categories below.</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-[8px] border border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total credits</div>
              <div className="text-[16px] font-bold text-success tabular-nums">{formatLargeAmount(credits)}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-[8px] border border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total debits</div>
              <div className="text-[16px] font-bold text-error tabular-nums">{formatLargeAmount(debits)}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-[8px] border border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Net</div>
              <div className="text-[16px] font-bold text-navy-950 tabular-nums">{formatLargeAmount(credits - debits)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white sticky top-0 z-10 border-b border-gray-100">
              {type === 'unreconciled' && <th className="pl-6 py-4 w-12" />}
              <th className={cn('py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider', type !== 'unreconciled' && 'pl-6')}>Date & Narration</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {statementTxns.map(txn => (
              <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                {type === 'unreconciled' && (
                  <td className="pl-6 py-4">
                    <input type="checkbox" className="rounded" checked={selectedTxns.includes(txn.id)} onChange={() => handleToggleSelect(txn.id)} />
                  </td>
                )}
                <td className={cn('py-4 align-top', type !== 'unreconciled' && 'pl-6')}>
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tabular-nums">
                      {new Date(txn.postedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-[13px] font-bold text-navy-950 leading-tight pr-4 line-clamp-2" title={txn.narration}>
                      {txn.narration}
                    </div>
                    {type === 'unreconciled' ? (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <select className="h-7 px-2 bg-purple-50 text-primary border border-purple-100 rounded-[4px] text-[11px] font-bold outline-none max-w-[200px]">
                          <option>{txn.suggestedCategory || 'Suggested category'}</option>
                        </select>
                        <span className="text-[10px] font-bold text-success uppercase">{txn.confidence ?? 0}% Conf.</span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                          {txn.category?.sub || txn.category?.top || 'Categorised'}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <div className={cn('text-[14px] font-bold tabular-nums', txn.amount < 0 ? 'text-error' : 'text-success')}>
                    {txn.amount < 0 ? '−' : '+'}{formatIndianCurrency(Math.abs(txn.amount))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0">
        {type === 'unreconciled' ? (
          <button
            disabled={!isBulkEnabled || isProcessing}
            onClick={handleBulkReconcile}
            className={cn(
              'btn-primary w-full h-12 text-[14px] flex items-center justify-center gap-2',
              (!isBulkEnabled || isProcessing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? 'Processing…' : `Bulk categorise${selectedTxns.length > 0 ? ` (${selectedTxns.length})` : ''} →`}
          </button>
        ) : (
          <button className="btn-secondary w-full h-12 text-[14px]">Export as CSV</button>
        )}
      </div>
    </div>
  );
};

export const ReconciliationScreen = () => {
  const [activeTab, setActiveTab] = useState<'exceptions' | 'categorised' | 'statements'>('exceptions');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileStatus, setReconcileStatus] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showBulkToast, setShowBulkToast] = useState(false);
  const [bulkToastCount, setBulkToastCount] = useState(0);
  const [lastRunLabel, setLastRunLabel] = useState('12 min ago');
  const [showAllExceptions, setShowAllExceptions] = useState(false);
  
  const [selectedException, setSelectedException] = useState<ReconciliationException | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<{ statement: BankStatement; type: 'categorised' | 'unreconciled' } | null>(null);

  // Filters
  const [exceptionFilters, setExceptionFilters] = useState<ExceptionFilters>({ type: 'All types', source: 'All', aging: 'All', variance: 'All', search: '' });
  const [categorisedFilters, setCategorisedFilters] = useState<CategorisedFilters>({ date: 'Last 7 days', bank: 'All accounts', direction: 'All directions', search: '' });
  const [statementFilters, setStatementFilters] = useState<StatementFilters>({ bank: 'All', search: '', dateFrom: '2026-05-12', dateTo: '2026-05-18' });

  const openExceptionCount = mockExceptions.filter(ex => ex.status === 'open').length;

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    const statuses = [
      "Pulling Cashfree PG...",
      "Pulling Amazon settlements...",
      "Pulling Flipkart settlements...",
      "Pulling HDFC bank...",
      "Pulling ICICI bank...",
      "Re-matching transactions..."
    ];
    
    for (const status of statuses) {
      setReconcileStatus(status);
      await new Promise(r => setTimeout(r, 700));
    }
    
    setIsReconciling(false);
    setReconcileStatus('');
    setLastRunLabel('just now');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24 max-w-[1280px] mx-auto"
    >
      <SectionHeader 
        title="Reconciliation" 
        subtitle="Three-way match across bank, payment gateway, and marketplace data"
      >
        <div className="flex flex-col items-end">
          <button 
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            className="btn-primary h-10 px-6 flex items-center gap-2 min-w-[180px] justify-center"
          >
            <RefreshCw className={cn("w-4 h-4", isReconciling && "animate-spin")} />
            {isReconciling ? "Reconciling..." : "Run reconciliation"}
          </button>
          <div className="text-[12px] text-gray-500 mt-1 h-4 font-medium">
            {isReconciling ? reconcileStatus : `Last run · ${lastRunLabel}`}
          </div>
        </div>
      </SectionHeader>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-20 right-8 z-[200] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-3 max-w-sm"
          >
            <Check className="w-5 h-5 shrink-0" />
            <p className="text-[13px] font-medium leading-relaxed">
              Reconciliation complete — 4 new categorisations, 1 new exception surfaced.
            </p>
            <button onClick={() => setShowToast(false)} className="text-success/60 hover:text-success">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBulkToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-36 right-8 z-[200] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-3 max-w-sm"
          >
            <Check className="w-5 h-5 shrink-0" />
            <p className="text-[13px] font-medium leading-relaxed">
              {bulkToastCount} transactions categorised. View in Categorised tab →
            </p>
            <button onClick={() => setShowBulkToast(false)} className="text-success/60 hover:text-success">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Auto-match rate</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">99.2%</div>
          <div className="text-[12px] text-gray-500 mt-1">of categorised txns this week</div>
        </Card>
        <Card className="border-l-4 border-l-error p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Open exceptions</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums text-error">{openExceptionCount}</div>
          <div className="text-[12px] text-gray-500 mt-1">₹4.21 L variance · 4 priority</div>
        </Card>
        <Card className="border-l-4 border-l-warning p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Unreconciled bank txns</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">14</div>
          <div className="text-[12px] text-gray-500 mt-1">across 5 statements</div>
        </Card>
        <Card className="border-l-4 border-l-navy-950 p-5">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Pending bank credit</div>
          <div className="text-[28px] font-bold text-navy-950 tabular-nums">₹18.7 L</div>
          <div className="text-[12px] text-gray-500 mt-1">Cashfree settlement &gt; 48 hrs</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: 'exceptions', label: 'Exceptions' },
          { id: 'categorised', label: 'Categorised' },
          { id: 'statements', label: 'Bank Statements' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 text-[14px] transition-all relative font-medium",
              activeTab === tab.id 
                ? "bg-purple-50 text-primary font-bold rounded-t-[8px]" 
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'exceptions' && (
          <ExceptionsTab 
            filters={exceptionFilters} 
            setFilters={setExceptionFilters}
            showAll={showAllExceptions}
            onToggleShowAll={() => setShowAllExceptions(v => !v)}
            onSelectException={setSelectedException} 
          />
        )}
        {activeTab === 'categorised' && (
          <CategorisedTab 
            filters={categorisedFilters} 
            setFilters={setCategorisedFilters} 
            onJumpToExceptions={(source) => {
              setExceptionFilters(f => ({ ...f, source })); 
              setActiveTab('exceptions');
            }}
          />
        )}
        {activeTab === 'statements' && (
          <StatementsTab 
            filters={statementFilters} 
            setFilters={setStatementFilters} 
            onViewTxns={(st, type) => setSelectedStatement({ statement: st, type })}
          />
        )}
      </div>

      {/* Slide-over Drawer for Exceptions */}
      <Drawer 
        isOpen={!!selectedException} 
        onClose={() => setSelectedException(null)}
        title="Exception Details"
      >
        {selectedException && <ExceptionDetail exception={selectedException} onClose={() => setSelectedException(null)} />}
      </Drawer>

      {/* Slide-over Drawer for Bank Statements */}
      <Drawer 
        isOpen={!!selectedStatement} 
        onClose={() => setSelectedStatement(null)}
        title={selectedStatement ? `${selectedStatement.type === 'categorised' ? 'Categorised' : 'Unreconciled'} txns — ${selectedStatement.statement.bankName} ··${selectedStatement.statement.accountIdLast4} · ${new Date(selectedStatement.statement.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
      >
        {selectedStatement && (
          <BankTxnDrawer 
            statement={selectedStatement.statement} 
            type={selectedStatement.type} 
            onClose={() => setSelectedStatement(null)}
            onBulkCategorised={(count) => {
              setBulkToastCount(count);
              setShowBulkToast(true);
              setTimeout(() => setShowBulkToast(false), 4000);
            }}
          />
        )}
      </Drawer>
    </motion.div>
  );
};