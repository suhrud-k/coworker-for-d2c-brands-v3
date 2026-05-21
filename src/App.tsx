import React, { useState, useEffect } from 'react';
import { Home, Plug, Users, Menu } from 'lucide-react';
import { cn } from './lib/utils';
import type { Tab, TeamView, AgentId, ChatPage } from './v3Types';
import { CFO_AGENT_ID } from './data/agentsMockData';
import { PRIORITY_CARDS } from './data/priorityCardsMockData';
import { ConnectionsScreen } from './components/ConnectionsScreen';
import { TeamChatPanel } from './components/TeamChatPanel';
import { AgentOffice } from './components/AgentOffice';
import {
  TeamNavStrip,
  TeamRoster,
  PoliciesView,
  CounterpartsView,
  ContactsView,
  ActivityView,
  EscalationsView,
} from './components/TeamViews';
import { StatusPill } from './components/shared/ui';

const SIDEBAR_KEY = 'coworker-v3-sidebar-collapsed';

const LogoMark = () => (
  <div className="w-8 h-8 bg-cashfree-orange rounded-[4px] flex items-center justify-center shrink-0">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4h12v4H10v4h8v4H10v4H6V4z" fill="white" />
    </svg>
  </div>
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1');
  const [teamView, setTeamView] = useState<TeamView>('roster');
  const [agentId, setAgentId] = useState<AgentId | null>(null);
  const [officeTab, setOfficeTab] = useState<string | undefined>();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAgent, setChatAgent] = useState<AgentId | undefined>();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const chatPage: ChatPage = agentId ? `office:${agentId}` : 'home';

  const openAgentOffice = (id: AgentId, ot?: string) => {
    setTab('team');
    setTeamView('agent');
    setAgentId(id);
    setOfficeTab(ot);
  };

  const openChat = (scope?: AgentId) => {
    setChatAgent(scope);
    setChatOpen(true);
  };

  const navItems: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'connections', icon: Plug, label: 'Connections' },
    { id: 'team', icon: Users, label: 'Manage my team' },
  ];

  const renderMain = () => {
    if (tab === 'home') {
      return (
        <div className="flex flex-col h-[calc(100vh-7rem)] max-w-[1400px] mx-auto w-full">
          <div className="mb-6 shrink-0">
            <h1 className="text-[24px] font-bold text-gray-900">{getGreeting()}, Akash.</h1>
            <p className="text-[15px] text-gray-600 mt-1">
              Krishan&apos;s morning brief is ready.{' '}
              <span className="font-semibold text-gray-900">3 items need you today.</span>
            </p>
          </div>

          <div className="flex flex-1 gap-6 min-h-0 items-stretch">
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <TeamChatPanel page="home" embedded fillHeight scopedAgent={CFO_AGENT_ID} />
            </div>

            <aside className="w-[300px] shrink-0 flex flex-col gap-4 overflow-y-auto">
              {PRIORITY_CARDS.map(card => (
                <div key={card.id} className="card flex flex-col gap-3">
                  <h3 className="text-[14px] font-semibold text-gray-900 leading-snug">{card.title}</h3>
                  <p className="text-[13px] text-gray-500">{card.subline}</p>
                  <StatusPill status="warning" text={card.status} />
                  <button
                    type="button"
                    onClick={() => openAgentOffice(card.agentId, card.agentTab)}
                    className="btn-primary w-full mt-1 text-[13px]"
                  >
                    {card.cta}
                  </button>
                </div>
              ))}
            </aside>
          </div>
        </div>
      );
    }

    if (tab === 'connections') {
      return <ConnectionsScreen />;
    }

    if (tab === 'team') {
      if (teamView === 'agent' && agentId) {
        return (
          <AgentOffice
            agentId={agentId}
            initialOfficeTab={officeTab}
            onBack={() => {
              setTeamView('roster');
              setAgentId(null);
              setOfficeTab(undefined);
            }}
            onOpenChat={() => openChat(agentId)}
          />
        );
      }

      return (
        <div className="max-w-[1200px]">
          <h1 className="text-[24px] font-bold text-gray-900 mb-2">Manage my team</h1>
          <TeamNavStrip
            active={teamView}
            onChange={v => {
              setTeamView(v);
              setAgentId(null);
            }}
          />
          {teamView === 'roster' && <TeamRoster onEnterOffice={id => openAgentOffice(id)} />}
          {teamView === 'policies' && <PoliciesView />}
          {teamView === 'counterparts' && <CounterpartsView />}
          {teamView === 'contacts' && <ContactsView />}
          {teamView === 'activity' && <ActivityView />}
          {teamView === 'escalations' && <EscalationsView />}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-[100] bg-white border-r border-gray-200 flex flex-col transition-all duration-200',
          sidebarCollapsed ? 'w-14' : 'w-[220px]'
        )}
      >
        <div className="h-14 flex items-center px-2 border-b border-gray-100 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(c => !c)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-[8px] shrink-0"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>
          {!sidebarCollapsed && <LogoMark />}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                if (id === 'team') {
                  setTeamView('roster');
                  setAgentId(null);
                }
              }}
              className={cn(
                'w-full h-10 rounded-[8px] flex items-center gap-3 transition-colors',
                sidebarCollapsed ? 'justify-center px-0' : 'px-3',
                tab === id ? 'bg-navy-950 text-white' : 'text-gray-600 hover:bg-[#CFB8F5]/30'
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span className="text-[14px] font-medium">{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className={cn('flex-1 flex flex-col min-h-screen transition-all', sidebarCollapsed ? 'ml-14' : 'ml-[220px]')}>
        <header className="sticky top-0 z-[90] h-14 bg-white border-b border-gray-200 flex items-center justify-between gap-4 px-6 shrink-0">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="text-[14px] font-semibold text-gray-900">CoWorker for D2C</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
            A
          </div>
        </header>

        <main className={cn('flex-1 overflow-auto', tab === 'home' ? 'p-6' : 'p-8')}>{renderMain()}</main>
      </div>

      {chatOpen && (
        <TeamChatPanel
          page={chatPage}
          scopedAgent={chatAgent}
          onClose={() => {
            setChatOpen(false);
            setChatAgent(undefined);
          }}
        />
      )}
    </div>
  );
}
