import { cn } from '../lib/utils';
import type { Artifact } from '../v3Types';
import { ArtifactStatementCard } from './ArtifactStatement';

function ArtifactTable({ artifact }: { artifact: Extract<Artifact, { kind: 'table' }> }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-left text-[12px] border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            {artifact.columns.map(c => (
              <th key={c} className="font-medium px-3 py-2 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {artifact.rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                artifact.highlightLastRow && i === artifact.rows.length - 1 && 'bg-purple-50 font-semibold'
              )}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-700 tabular-nums whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArtifactBars({ artifact }: { artifact: Extract<Artifact, { kind: 'bars' }> }) {
  const max = Math.max(...artifact.data.map(d => d.value), 0) || 1;
  return (
    <div className="space-y-2">
      <div className="text-[11px] text-gray-500">{artifact.unit}</div>
      {artifact.data.map(d => (
        <div key={d.label} className="flex items-center gap-2">
          <div className="w-28 shrink-0 text-[11px] text-gray-600 truncate" title={d.label}>
            {d.label}
          </div>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%`, backgroundColor: d.color ?? '#6930CA' }}
            />
          </div>
          <div className="w-12 shrink-0 text-right text-[11px] font-medium text-gray-700 tabular-nums">
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtifactCompare({ artifact }: { artifact: Extract<Artifact, { kind: 'compare' }> }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-left text-[12px] border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="font-medium px-3 py-2">Metric</th>
            <th className="font-medium px-3 py-2 text-right">Before</th>
            <th className="font-medium px-3 py-2 text-right">After</th>
            <th className="font-medium px-3 py-2 text-right">Δ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {artifact.rows.map(r => (
            <tr key={r.label}>
              <td className="px-3 py-2 text-gray-700">{r.label}</td>
              <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{r.before}</td>
              <td className="px-3 py-2 text-right text-gray-900 tabular-nums">{r.after}</td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-semibold tabular-nums',
                  r.positive ? 'text-success' : 'text-error'
                )}
              >
                {r.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChatArtifact({ artifact }: { artifact: Artifact }) {
  if (artifact.kind === 'table') return <ArtifactTable artifact={artifact} />;
  if (artifact.kind === 'bars') return <ArtifactBars artifact={artifact} />;
  if (artifact.kind === 'statement') return <ArtifactStatementCard artifact={artifact} />;
  return <ArtifactCompare artifact={artifact} />;
}
