import React, { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { AGENTS, getAgent, getCfo, getTeamReports } from '../data/agentsMockData';
import { DEFAULT_THRESHOLDS, POLICY_CHANGE_LOG } from '../data/policiesMockData';
import { COUNTERPARTS } from '../data/counterpartsMockData';
import { EXTERNAL_CONTACTS } from '../data/contactsMockData';
import { ACTIVITY_ENTRIES } from '../data/activityMockData';
import { ESCALATIONS } from '../data/escalationsMockData';
import type { AgentId, Counterpart, TeamView } from '../v3Types';
import { Card, SectionHeader, StatusPill } from './shared/ui';

export function TeamNavStrip({ active, onChange }: { active: TeamView; onChange: (v: TeamView) => void }) {
  const items: { id: TeamView; label: string }[] = [
    { id: 'roster', label: 'My team' },
    { id: 'policies', label: 'Policies & Thresholds' },
    { id: 'counterparts', label: 'Human counterparts' },
    { id: 'contacts', label: 'External contacts' },
    { id: 'activity', label: 'Activity stream' },
    { id: 'escalations', label: 'Escalations' },
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {items.map(it => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={cn(
            'px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors',
            active === it.id ? 'bg-navy-950 text-white border-navy-950' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function AgentRosterCard({
  agent,
  onEnterOffice,
  compact,
}: {
  agent: (typeof AGENTS)[0];
  onEnterOffice: (id: AgentId) => void;
  compact?: boolean;
}) {
  const avatarClass = compact ? 'w-11 h-11 text-[16px]' : 'w-12 h-12 text-[18px]';

  return (
    <Card
      className={cn(
        'flex flex-col text-left w-full h-full min-h-[260px]',
        compact && 'p-5'
      )}
    >
      <div className="flex items-start gap-4 shrink-0">
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
            agent.avatarBg,
            avatarClass
          )}
        >
          {agent.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-gray-900">{agent.name}</h3>
              <p className="text-[13px] text-gray-500">{agent.role}</p>
              <p className="text-[12px] text-gray-400 mt-1 truncate">{agent.email}</p>
            </div>
            {agent.status === 'awaiting' && (
              <div className="shrink-0">
                <StatusPill status="warning" text="Awaiting" />
              </div>
            )}
          </div>
          <p className="text-[13px] text-gray-500 mt-3">
            Today: {agent.todayActionCount} actions
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-10" aria-hidden />

      <button
        type="button"
        onClick={() => onEnterOffice(agent.id)}
        className="btn-primary w-full text-[13px] shrink-0 mt-6"
      >
        Enter office →
      </button>
    </Card>
  );
}

export function TeamRoster({ onEnterOffice }: { onEnterOffice: (id: AgentId) => void }) {
  const cfo = getCfo();
  const reports = getTeamReports();

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
      <div className="w-full max-w-md">
        <AgentRosterCard agent={cfo} onEnterOffice={onEnterOffice} />
      </div>

      {/* Org chart connector: stem down from CFO */}
      <div className="w-px h-16 bg-gray-200 shrink-0" aria-hidden />

      <div className="w-full">
        {/* Horizontal bar across the five report columns (desktop) */}
        <div className="hidden lg:block relative w-full h-px mb-0">
          <div
            className="absolute top-0 left-[10%] right-[10%] h-px bg-gray-200"
            aria-hidden
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full items-stretch mt-0 lg:-mt-px">
          {reports.map(a => (
            <div key={a.id} className="flex flex-col items-center w-full min-h-[260px]">
              {/* Vertical drop from horizontal bar into each card */}
              <div className="w-px h-16 bg-gray-200 shrink-0 hidden lg:block" aria-hidden />
              <div className="w-full flex-1 flex flex-col min-h-[260px]">
                <AgentRosterCard agent={a} onEnterOffice={onEnterOffice} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PoliciesView() {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const byAgent = AGENTS.map(a => ({
    agent: a,
    items: thresholds.filter(t => t.agentId === a.id),
  }));

  return (
    <div className="space-y-8">
      <SectionHeader title="Policies & Thresholds" subtitle="Configure each agent's autonomy bands" />
      {byAgent.map(({ agent, items }) => (
        <Card key={agent.id}>
          <div className="flex items-center gap-3 mb-6">
            <div className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold', agent.avatarBg)}>
              {agent.name[0]}
            </div>
            <h3 className="text-[16px] font-semibold text-gray-900">{agent.name}</h3>
          </div>
          <div className="space-y-5">
            {items.map(t => (
              <div key={t.key} className="flex flex-wrap items-center gap-4">
                <label className="text-[13px] text-gray-600 w-64 shrink-0">{t.label}</label>
                {t.unit === 'toggle' ? (
                  <input
                    type="checkbox"
                    checked={!!t.value}
                    onChange={e => setThresholds(prev => prev.map(x => (x.key === t.key ? { ...x, value: e.target.checked } : x)))}
                  />
                ) : typeof t.value === 'number' ? (
                  <>
                    <input
                      type="range"
                      min={t.min}
                      max={t.max}
                      step={t.step}
                      value={t.value}
                      onChange={e => setThresholds(prev => prev.map(x => (x.key === t.key ? { ...x, value: Number(e.target.value) } : x)))}
                      className="flex-1 min-w-[120px]"
                    />
                    <input
                      type="number"
                      value={t.value}
                      onChange={e => setThresholds(prev => prev.map(x => (x.key === t.key ? { ...x, value: Number(e.target.value) } : x)))}
                      className="w-24 h-9 px-2 border border-gray-200 rounded-[6px] text-[13px]"
                    />
                  </>
                ) : (
                  <span className="text-[13px] font-medium">{String(t.value)}</span>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-6 h-9 px-4 text-[13px]">Save</button>
        </Card>
      ))}
      <Card title="Change log">
        <ul className="mt-4 space-y-2 text-[13px] text-gray-600">
          {POLICY_CHANGE_LOG.map((l, i) => (
            <li key={i}>
              <span className="text-gray-400">{l.ts}</span> — {l.text}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function CounterpartsView() {
  const [rows, setRows] = useState<Counterpart[]>([...COUNTERPARTS]);
  return (
    <div className="space-y-6">
      <SectionHeader title="Human counterparts" subtitle="CC'd on every outbound email" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 font-medium text-gray-500">Agent</th>
              <th className="px-6 py-3 font-medium text-gray-500">Counterpart</th>
              <th className="px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 font-medium text-gray-500">Digest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={r.agentId}>
                <td className="px-6 py-4 font-medium">{getAgent(r.agentId).name}</td>
                <td className="px-6 py-4">{r.name}</td>
                <td className="px-6 py-4">
                  <input
                    value={r.email}
                    onChange={e => setRows(prev => prev.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                    className="w-full max-w-[220px] h-8 px-2 border border-gray-200 rounded-[6px]"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={r.digestMode}
                    onChange={e => setRows(prev => prev.map((x, j) => (j === i ? { ...x, digestMode: e.target.value as Counterpart['digestMode'] } : x)))}
                    className="h-8 px-2 border border-gray-200 rounded-[6px]"
                  >
                    <option value="off">Off</option>
                    <option value="daily">Daily digest</option>
                    <option value="weekly">Weekly digest</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function ContactsView() {
  return (
    <div className="space-y-6">
      <SectionHeader title="External contacts" subtitle="CA, auditor, banker, marketplace SPOCs">
        <button type="button" className="btn-primary h-9 px-4 text-[13px]">Add new contact</button>
      </SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXTERNAL_CONTACTS.map(c => (
          <Card key={c.id}>
            <h3 className="text-[16px] font-semibold text-gray-900">{c.name}</h3>
            <p className="text-[13px] text-gray-500">{c.role}</p>
            <p className="text-[13px] text-primary mt-2">{c.email}</p>
            <p className="text-[12px] text-gray-500 mt-3">Scope: {c.scope.join(' · ')}</p>
            {c.lastInteraction && <p className="text-[12px] text-gray-400 mt-2">Last: {c.lastInteraction}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ActivityView() {
  const [agentFilter, setAgentFilter] = useState<AgentId[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [windowFilter, setWindowFilter] = useState('7d');

  const filtered = useMemo(() => {
    return ACTIVITY_ENTRIES.filter(e => {
      if (agentFilter.length && !agentFilter.includes(e.agentId)) return false;
      if (typeFilter !== 'all' && e.actionType !== typeFilter) return false;
      return true;
    });
  }, [agentFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Activity stream" subtitle="All agents · last 7 days" />
      <div className="flex flex-wrap gap-3">
        <select value={windowFilter} onChange={e => setWindowFilter(e.target.value)} className="h-9 px-3 border border-gray-200 rounded-[6px] text-[13px]">
          <option value="24h">24h</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 px-3 border border-gray-200 rounded-[6px] text-[13px]">
          <option value="all">All types</option>
          <option value="email">Email</option>
          <option value="payment">Payment</option>
          <option value="filing">Filing</option>
          <option value="claim">Claim</option>
          <option value="alert">Alert</option>
        </select>
        {AGENTS.map(a => (
          <button
            key={a.id}
            type="button"
            onClick={() =>
              setAgentFilter(prev => (prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]))
            }
            className={cn(
              'px-3 py-1 rounded-full text-[12px] font-medium border',
              agentFilter.includes(a.id) ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600'
            )}
          >
            {a.name}
          </button>
        ))}
      </div>
      <Card className="divide-y divide-gray-50 p-0">
        {filtered.map(e => (
          <div key={e.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
            <div className={cn('w-8 h-8 rounded-full text-white text-[12px] font-semibold flex items-center justify-center', getAgent(e.agentId).avatarBg)}>
              {getAgent(e.agentId).name[0]}
            </div>
            <span className="text-[12px] text-gray-400 w-28">{e.ts}</span>
            <span className="text-[13px] font-medium text-gray-900 flex-1">{e.verb}</span>
            {e.amount != null && <span className="text-[13px] tabular-nums">₹{e.amount.toLocaleString('en-IN')}</span>}
            <StatusPill status={e.status === 'done' ? 'success' : e.status === 'pending' ? 'warning' : 'slate'} text={e.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function EscalationsView() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Escalations" subtitle="Cross-agent queue for Akash / CFO" />
      {ESCALATIONS.map(e => (
        <Card key={e.id} className="!flex !flex-col !items-start text-left gap-4">
          <div className="w-full text-left">
            <div className="text-[12px] text-gray-500 mb-1">From {getAgent(e.fromAgent).name}</div>
            <div className="text-[15px] font-semibold text-gray-900">{e.title}</div>
            <div className="text-[13px] text-gray-600 mt-1">{e.reason}</div>
            {e.amount != null && (
              <div className="text-[13px] font-semibold text-primary mt-2">₹{e.amount.toLocaleString('en-IN')}</div>
            )}
            <div className="text-[12px] text-gray-400 mt-2">{e.daysWaiting} days waiting</div>
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-start">
            <button type="button" className="btn-primary h-9 px-4 text-[13px]">Approve</button>
            <button type="button" className="btn-secondary h-9 px-4 text-[13px]">Reject</button>
            <button type="button" className="btn-tertiary text-[13px]">Ask more</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
