import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAgent } from '../data/agentsMockData';
import { ESCALATIONS } from '../data/escalationsMockData';
import type { AgentId } from '../v3Types';
import { VendorsScreen } from './VendorsScreen';
import { KrishanBriefPanel } from './KrishanBriefPanel';
import { CashRunwayScreen } from './CashRunwayScreen';
import { ChannelEconomicsScreen } from './ChannelEconomicsScreen';
import { ReportsScreen } from './ReportsScreen';
import { ReconciliationScreen } from './ReconciliationScreen';
import { ReturnsRecoveryScreen } from './ReturnsRecoveryScreen';
import { MarketingEfficiencyScreen } from './MarketingEfficiencyScreen';
import { ComplianceScreen } from './ComplianceScreen';
import type { ComplianceTab } from './ComplianceScreen';
import { OfficePlaceholder } from './OfficePlaceholder';
import { InventoryScreen } from './InventoryScreen';
import { Card, SectionHeader, StatusPill } from './shared/ui';

const ANKITA_TAB_MAP: Record<string, ComplianceTab> = {
  Calendar: 'calendar',
  GST: 'gst',
  TDS: 'tds',
  TCS: 'tcs',
  MSME: 'msme',
};

type AgentOfficeProps = {
  agentId: AgentId;
  initialOfficeTab?: string;
  onBack: () => void;
  onOpenChat: () => void;
};

export function AgentOffice({ agentId, initialOfficeTab, onBack, onOpenChat }: AgentOfficeProps) {
  const agent = getAgent(agentId);
  const [officeTab, setOfficeTab] = useState(initialOfficeTab ?? agent.officeTabs[0]);

  useEffect(() => {
    if (initialOfficeTab) setOfficeTab(initialOfficeTab);
  }, [initialOfficeTab, agentId]);

  const renderContent = () => {
    if (agentId === 'krishan') {
      switch (officeTab) {
        case 'Brief':
          return <KrishanBriefPanel />;
        case 'Cash':
          return <CashRunwayScreen />;
        case 'Statements':
          return (
            <OfficePlaceholder
              title="Schedule III statements"
              detail="P&L, balance sheet, and cash flow for Apr 2026 — pulled from Tally and marketplace settlements."
            />
          );
        case 'BvA':
          return (
            <div className="space-y-6">
              <SectionHeader title="Budget vs. actuals" subtitle="Apr 2026 · variance commentary" />
              <Card>
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="py-3 font-medium">Line</th>
                      <th className="py-3 text-right font-medium">Budget</th>
                      <th className="py-3 text-right font-medium">Actual</th>
                      <th className="py-3 text-right font-medium">Var %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      ['Revenue', '₹4.50 Cr', '₹4.18 Cr', '-7.1%'],
                      ['COGS', '₹2.10 Cr', '₹2.24 Cr', '+6.7%'],
                      ['Marketing', '₹95 L', '₹1.10 Cr', '+15.8%'],
                      ['EBITDA', '₹42 L', '₹28 L', '-33.3%'],
                    ].map(([line, b, a, v]) => (
                      <tr key={line}>
                        <td className="py-3 font-medium text-gray-900">{line}</td>
                        <td className="py-3 text-right tabular-nums">{b}</td>
                        <td className="py-3 text-right tabular-nums">{a}</td>
                        <td className={cn('py-3 text-right font-semibold', v.startsWith('-') ? 'text-error' : 'text-success')}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          );
        case 'Channels':
          return <ChannelEconomicsScreen onNavigate={() => {}} />;
        case 'Reports':
          return <ReportsScreen />;
        case 'Escalations':
          return (
            <div className="space-y-4">
              <SectionHeader title="Escalation queue" subtitle="Awaiting CFO action" />
              {ESCALATIONS.map(e => (
                <Card key={e.id} className="!flex !flex-col !items-start text-left gap-4">
                  <div className="w-full text-left">
                    <div className="text-[14px] font-semibold text-gray-900">{e.title}</div>
                    <div className="text-[13px] text-gray-500 mt-1">{e.reason}</div>
                    {e.amount != null && <div className="text-[13px] font-semibold text-primary mt-1">₹{e.amount.toLocaleString('en-IN')}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-primary h-9 px-4 text-[13px]">Approve</button>
                    <button type="button" className="btn-secondary h-9 px-4 text-[13px]">Ask more</button>
                  </div>
                </Card>
              ))}
            </div>
          );
        default:
          return <OfficePlaceholder title={officeTab} />;
      }
    }

    if (agentId === 'priya') {
      if (['Inbox', 'MSME', 'TDS Register'].includes(officeTab)) {
        if (officeTab === 'MSME') {
          return (
            <div className="space-y-4">
              <SectionHeader title="MSME tracker" subtitle="43B(h) compliance · 45-day window" />
              <OfficePlaceholder title="MSME register" detail="UDYAM vendors, days remaining, and at-risk payables — synced with Compliance." />
            </div>
          );
        }
        return <OfficePlaceholder title={officeTab} detail={`Priya's ${officeTab} — email threads and register views.`} />;
      }
      return <VendorsScreen officeTab={officeTab} embedded />;
    }

    if (agentId === 'rohan') {
      switch (officeTab) {
        case 'Cockpit':
          return <ReconciliationScreen />;
        case 'Returns & Recovery':
          return <ReturnsRecoveryScreen />;
        case 'Claims':
          return (
            <div className="space-y-6">
              <SectionHeader title="Marketplace claims" subtitle="Resolved and pending · Flipkart, Myntra, Amazon" />
              <Card className="!flex !flex-col !items-start text-left gap-3 border-l-4 border-l-success">
                <StatusPill status="success" text="Resolved — review" />
                <div className="text-[15px] font-semibold text-gray-900">Claim #FK-2398 · Flipkart</div>
                <p className="text-[13px] text-gray-600">₹68,400 credited 17 May. Matches filed amount. Rohan verified against settlement file.</p>
                <button type="button" className="btn-primary h-9 px-4 text-[13px]">Verify & close</button>
              </Card>
              <Card>
                <div className="text-[13px] font-medium text-gray-500 mb-3">Open claims (&gt;30 days)</div>
                <div className="text-[20px] font-bold text-gray-900 tabular-nums">₹3.84 L</div>
                <p className="text-[12px] text-gray-500 mt-1">2 claims awaiting marketplace response</p>
              </Card>
            </div>
          );
        default:
          return <OfficePlaceholder title={officeTab} />;
      }
    }

    if (agentId === 'maya') {
      if (officeTab === 'Dashboard' || officeTab === 'Reallocation') {
        return <MarketingEfficiencyScreen />;
      }
      return <OfficePlaceholder title={officeTab} />;
    }

    if (agentId === 'ankita') {
      const tab = ANKITA_TAB_MAP[officeTab];
      if (tab) return <ComplianceScreen initialTab={tab} />;
      return <OfficePlaceholder title={officeTab} />;
    }

    if (agentId === 'tara') {
      return <InventoryScreen officeTab={officeTab} embedded onOfficeTabChange={setOfficeTab} />;
    }

    return null;
  };

  return (
    <div className="relative pb-20">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-[14px] font-medium text-gray-600 hover:text-primary mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to team
      </button>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-[18px] font-semibold', agent.avatarBg)}>
          {agent.name[0]}
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">
            {agent.name} · {agent.role}
          </h1>
          <p className="text-[13px] text-gray-500">{agent.email}</p>
        </div>
        <StatusPill status="success" text="Active" />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-8 overflow-x-auto">
        {agent.officeTabs.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setOfficeTab(t)}
            className={cn(
              'px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
              officeTab === t ? 'bg-purple-50 text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-900'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {renderContent()}

      <button
        type="button"
        onClick={onOpenChat}
        className="fixed bottom-8 right-8 z-50 btn-primary h-12 px-5 shadow-lg gap-2 rounded-full"
      >
        <MessageSquare className="w-5 h-5" />
        Ask {agent.name}
      </button>
    </div>
  );
}
