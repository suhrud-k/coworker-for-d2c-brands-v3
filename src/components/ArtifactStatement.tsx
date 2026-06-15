import React, { useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { getStatementArtifact, getStatementPeriodsForType } from '../data/statementsMockData';
import type { ArtifactStatement, StatementPeriod } from '../v3Types';
import { saveReport } from '../state/savedReportsStore';

type Props = {
  artifact: ArtifactStatement;
};

type Unit = 'absolute' | 'lakhs' | 'crores';

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

function downloadCSV(stmt: ArtifactStatement, extension: 'csv' | 'xlsx' = 'csv') {
  const title =
    stmt.statementType === 'pnl'
      ? 'Statement of Profit and Loss'
      : stmt.statementType === 'balance-sheet'
        ? 'Balance Sheet'
        : 'Cash Flow Statement';
  const lines: string[] = [];
  lines.push(csvCell(title));
  lines.push(csvCell(stmt.asOfLabel ?? `For period: ${stmt.period.label}`));
  lines.push('');
  lines.push(['Line item', stmt.period.label, stmt.priorPeriod?.label ?? '', 'Variance %'].map(csvCell).join(','));
  for (const section of stmt.sections) {
    lines.push(csvCell(section.title));
    for (const line of section.lines) {
      const cur = line.amount;
      const prev = stmt.priorAmounts?.[line.label];
      const variancePct = prev != null && prev !== 0 ? `${(((cur - prev) / prev) * 100).toFixed(1)}%` : '';
      lines.push([line.label, cur, prev ?? '', variancePct].map(csvCell).join(','));
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

export function ArtifactStatementCard({ artifact }: Props) {
  const [periodId, setPeriodId] = useState(artifact.period.id);
  const [compareId, setCompareId] = useState(artifact.priorPeriod?.id ?? '');
  const [unit, setUnit] = useState<Unit>(artifact.unit);
  const [toast, setToast] = useState('');

  const periods = getStatementPeriodsForType(artifact.statementType);
  const selected = getStatementArtifact(artifact.statementType, periodId);
  const comparePeriod = periods.find(p => p.id === compareId);
  const prior = selected?.priorAmounts;

  const title = artifact.statementType === 'pnl' ? 'Statement of Profit and Loss' : artifact.statementType === 'balance-sheet' ? 'Balance Sheet' : 'Cash Flow Statement';
  const subline = artifact.statementType === 'balance-sheet' ? selected?.asOfLabel ?? `As at ${selected?.period.label}` : `For period ${selected?.period.label ?? artifact.period.label}`;

  const displayStmt = useMemo(() => {
    if (!selected) return null;
    if (!comparePeriod) return selected;
    const cmp = getStatementArtifact(artifact.statementType, comparePeriod.id);
    if (!cmp) return selected;
    return { ...selected, priorPeriod: comparePeriod, priorAmounts: cmp.sections.flatMap(s => s.lines).reduce<Record<string, number>>((acc, l) => { acc[l.label] = l.amount; return acc; }, {}) };
  }, [artifact.statementType, comparePeriod, selected]);

  if (!displayStmt) {
    return <div className="text-sm text-slate-600">I have statements for these periods: {periods.map(p => p.label).join(', ')}</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-full">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
        <p className="text-sm text-slate-500">{subline}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <label className="text-xs text-slate-500">
          Period:
          <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="ml-2 h-8 px-2 border border-slate-200 rounded">
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Compare with:
          <select value={compareId} onChange={e => setCompareId(e.target.value)} className="ml-2 h-8 px-2 border border-slate-200 rounded">
            <option value="">None</option>
            {periods.filter(p => p.id !== periodId).map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="text-slate-500">Display:</span>
        {(['lakhs', 'crores', 'absolute'] as Unit[]).map(u => (
          <button key={u} type="button" onClick={() => setUnit(u)} className={cn('px-2 py-1 rounded-full border', unit === u ? 'border-primary text-primary bg-purple-50' : 'border-slate-200 text-slate-600')}>
            {u === 'lakhs' ? '₹ in lakhs' : u === 'crores' ? '₹ in crores' : 'Absolute (₹)'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-slate-500 text-xs">
              <th className="text-left py-2">Line item</th>
              <th className="text-right py-2 tabular-nums">{displayStmt.period.label}</th>
              <th className="text-right py-2 tabular-nums">{displayStmt.priorPeriod?.label ?? 'Prior'}</th>
              <th className="text-right py-2">Var %</th>
            </tr>
          </thead>
          <tbody>
            {displayStmt.sections.map(section => (
              <React.Fragment key={section.title}>
                <tr>
                  <td colSpan={4} className="bg-slate-50 font-semibold text-slate-700 uppercase text-[11px] tracking-wide py-2 px-2">
                    {section.title}
                  </td>
                </tr>
                {section.lines.map(line => {
                  const prev = displayStmt.priorAmounts?.[line.label];
                  const v = variance(line.amount, prev);
                  const isCfs = displayStmt.statementType === 'cash-flow';
                  return (
                    <tr key={`${section.title}_${line.label}`} className={cn(line.isSubtotal && 'border-t border-slate-200', line.bold && 'font-semibold text-slate-900')}>
                      <td className={cn('py-2', line.indent === 1 && 'pl-4', line.indent === 2 && 'pl-8')}>{line.label}</td>
                      <td className="text-right tabular-nums py-2">{isCfs ? formatAccounting(line.amount, unit) : formatAmount(line.amount, unit)}</td>
                      <td className="text-right tabular-nums py-2 text-slate-500">{prev == null ? '—' : isCfs ? formatAccounting(prev, unit) : formatAmount(prev, unit)}</td>
                      <td className={cn('text-right py-2 text-xs', v.dir === 'up' && 'text-emerald-600', v.dir === 'down' && 'text-rose-600', !v.dir && 'text-slate-400')}>{v.text}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary h-9 px-3 text-[13px]" onClick={() => downloadCSV(displayStmt, 'csv')}>
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
        <button type="button" className="btn-tertiary h-9 px-3 text-[13px]" onClick={() => downloadCSV(displayStmt, 'xlsx')}>
          View as Excel
        </button>
        {toast && <span className="text-xs text-success self-center">{toast}</span>}
      </div>
    </div>
  );
}

