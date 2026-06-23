import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { getStatementArtifact, getStatementPeriodsForType, STATEMENT_PERIODS } from '../data/statementsMockData';
import type { ArtifactStatement, StatementPeriod, StatementType } from '../v3Types';
import { saveReport } from '../state/savedReportsStore';

type Props = {
  artifact: ArtifactStatement;
};

type Unit = 'absolute' | 'lakhs' | 'crores';

function statementTitle(t: StatementType): string {
  switch (t) {
    case 'pnl':
      return 'Statement of Profit and Loss';
    case 'balance-sheet':
      return 'Balance Sheet';
    case 'cash-flow':
      return 'Cash Flow Statement';
  }
}

function periodSubline(stmt: ArtifactStatement): string {
  if (stmt.statementType === 'balance-sheet') {
    return stmt.asOfLabel ?? `As at ${stmt.period.asOnDate ?? stmt.period.label}`;
  }
  return `For the period ${stmt.period.label}`;
}

function amountsFromSections(stmt: ArtifactStatement): Record<string, number> {
  const out: Record<string, number> = {};
  stmt.sections.forEach(section => section.lines.forEach(line => (out[line.label] = line.amount)));
  return out;
}

export function formatAmount(v: number, unit: Unit): string {
  if (unit === 'crores') return `₹ ${(v / 1e7).toFixed(2)} Cr`;
  if (unit === 'lakhs') return `₹ ${(v / 1e5).toFixed(1)} L`;
  return `₹ ${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatAccounting(v: number, unit: Unit): string {
  const text = formatAmount(Math.abs(v), unit);
  return v < 0 ? `(${text.replace('₹ ', '')})` : text;
}

function variance(cur: number, prev?: number): { text: string; dir?: 'up' | 'down' } {
  if (prev == null || prev === 0) return { text: '—' };
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  if (Math.abs(pct) < 0.05) return { text: '—' };
  return { text: `${pct >= 0 ? '↑' : '↓'}${Math.abs(pct).toFixed(1)}%`, dir: pct >= 0 ? 'up' : 'down' };
}

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(stmt: ArtifactStatement, priorAmounts: Record<string, number> | undefined, hasComparison: boolean, extension: 'csv' | 'xlsx' = 'csv') {
  const title = statementTitle(stmt.statementType);
  const lines: string[] = [];
  lines.push(csvCell(title));
  lines.push(csvCell(periodSubline(stmt)));
  lines.push('');
  const headers = ['Line item', stmt.period.label];
  if (hasComparison) {
    headers.push(stmt.priorPeriod?.label ?? '', 'Variance %');
  }
  lines.push(headers.map(csvCell).join(','));
  for (const section of stmt.sections) {
    lines.push(csvCell(section.title));
    for (const line of section.lines) {
      const cur = line.amount;
      const prev = priorAmounts?.[line.label];
      const row = [line.label, cur];
      if (hasComparison) {
        const variancePct = prev != null && prev !== 0 ? `${(((cur - prev) / prev) * 100).toFixed(1)}%` : '';
        row.push(prev ?? '', variancePct);
      }
      lines.push(row.map(csvCell).join(','));
    }
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stmt.statementType}_${stmt.period.id}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

function availableComparePeriods(periods: StatementPeriod[], periodId: string, naturalPrior?: StatementPeriod): StatementPeriod[] {
  const base = periods.filter(p => p.id !== periodId);
  if (naturalPrior && naturalPrior.id !== periodId && !base.some(p => p.id === naturalPrior.id)) {
    return [...base, naturalPrior];
  }
  return base;
}

export function ArtifactStatementCard({ artifact }: Props) {
  const [periodId, setPeriodId] = useState(artifact.period.id);
  const [compareWith, setCompareWith] = useState<string>(artifact.priorPeriod?.id ?? 'none');
  const [unit, setUnit] = useState<Unit>(artifact.unit);
  const [toast, setToast] = useState('');

  const periods = getStatementPeriodsForType(artifact.statementType);
  const selected = getStatementArtifact(artifact.statementType, periodId);

  useEffect(() => {
    setCompareWith(selected?.priorPeriod?.id ?? 'none');
  }, [periodId, artifact.statementType, selected?.priorPeriod?.id]);

  const hasComparison = compareWith !== 'none';
  const priorPeriodObj = hasComparison ? (STATEMENT_PERIODS[compareWith] ?? periods.find(p => p.id === compareWith) ?? selected?.priorPeriod) : undefined;

  const priorAmounts = useMemo(() => {
    if (!hasComparison || !selected) return undefined;
    if (compareWith === selected.priorPeriod?.id && selected.priorAmounts) {
      return selected.priorAmounts;
    }
    const cmp = getStatementArtifact(artifact.statementType, compareWith);
    return cmp ? amountsFromSections(cmp) : selected.priorAmounts;
  }, [artifact.statementType, compareWith, hasComparison, selected]);

  const displayStmt = useMemo(() => {
    if (!selected) return null;
    return { ...selected, priorPeriod: priorPeriodObj };
  }, [selected, priorPeriodObj]);

  const compareOptions = availableComparePeriods(periods, periodId, selected?.priorPeriod);

  const colCount = hasComparison ? 4 : 2;

  if (!displayStmt) {
    return <div className="text-sm text-slate-600">I have statements for these periods: {periods.map(p => p.label).join(', ')}</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-full">
      <div>
        <div className="mb-1 text-base font-semibold text-slate-900">{statementTitle(displayStmt.statementType)}</div>
        <div className="text-sm text-slate-500">{periodSubline(displayStmt)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Period</label>
          <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="h-8 px-2 border border-slate-200 rounded text-sm">
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Compare with</label>
          <select value={compareWith} onChange={e => setCompareWith(e.target.value)} className="h-8 px-2 border border-slate-200 rounded text-sm">
            <option value="none">None</option>
            {compareOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-slate-500">Display</label>
          <div className="flex items-center gap-1">
            {(['lakhs', 'crores', 'absolute'] as Unit[]).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn('px-2 py-1 rounded-full border text-xs', unit === u ? 'border-primary text-primary bg-purple-50' : 'border-slate-200 text-slate-600')}
              >
                {u === 'lakhs' ? '₹ in lakhs' : u === 'crores' ? '₹ in crores' : 'Absolute (₹)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <colgroup>
            <col />
            <col className="w-[140px]" />
            {hasComparison && <col className="w-[140px]" />}
            {hasComparison && <col className="w-[80px]" />}
          </colgroup>
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-600 py-2">Line item</th>
              <th className="text-right text-xs font-semibold text-slate-900 py-2 whitespace-nowrap">{displayStmt.period.label}</th>
              {hasComparison && (
                <>
                  <th className="text-right text-xs font-semibold text-slate-500 py-2 whitespace-nowrap">{priorPeriodObj!.label}</th>
                  <th className="text-right text-xs font-semibold text-slate-600 py-2">Var %</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {displayStmt.sections.map(section => (
              <React.Fragment key={section.title}>
                <tr>
                  <td colSpan={colCount} className="bg-slate-50 font-semibold text-slate-700 uppercase text-[11px] tracking-wide py-2 px-2">
                    {section.title}
                  </td>
                </tr>
                {section.lines.map(line => {
                  const prev = priorAmounts?.[line.label];
                  const v = variance(line.amount, prev);
                  const isCfs = displayStmt.statementType === 'cash-flow';
                  return (
                    <tr key={`${section.title}_${line.label}`} className={cn(line.isSubtotal && 'border-t border-slate-200', line.bold && 'font-semibold text-slate-900')}>
                      <td className={cn('py-2', line.indent === 1 && 'pl-4', line.indent === 2 && 'pl-8')}>{line.label}</td>
                      <td className="text-right py-2">{isCfs ? formatAccounting(line.amount, unit) : formatAmount(line.amount, unit)}</td>
                      {hasComparison && (
                        <>
                          <td className="text-right py-2 text-slate-500">{prev == null ? '—' : isCfs ? formatAccounting(prev, unit) : formatAmount(prev, unit)}</td>
                          <td className={cn('text-right py-2 text-xs', v.dir === 'up' && 'text-emerald-600', v.dir === 'down' && 'text-rose-600', !v.dir && 'text-slate-400')}>{v.text}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary h-9 px-3 text-[13px]" onClick={() => downloadCSV(displayStmt, priorAmounts, hasComparison, 'csv')}>
          Download CSV
        </button>
        <button
          type="button"
          className="btn-secondary h-9 px-3 text-[13px]"
          onClick={() => {
            saveReport({
              id: `${displayStmt.statementType}_${displayStmt.period.id}_${Date.now()}`,
              savedAt: new Date().toISOString(),
              type: displayStmt.statementType,
              periodLabel: displayStmt.period.label,
              statement: displayStmt,
            });
            setToast('Saved to Reports.');
            setTimeout(() => setToast(''), 2000);
          }}
        >
          Save to Reports
        </button>
        <button type="button" className="btn-tertiary h-9 px-3 text-[13px]" onClick={() => downloadCSV(displayStmt, priorAmounts, hasComparison, 'xlsx')}>
          View as Excel
        </button>
        {toast && <span className="text-xs text-success self-center">{toast}</span>}
      </div>
    </div>
  );
}
