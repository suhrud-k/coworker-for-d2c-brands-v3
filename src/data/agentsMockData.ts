import type { Agent, AgentId } from '../v3Types';

export const CFO_AGENT_ID: AgentId = 'veera';

export const AGENTS: Agent[] = [
  {
    id: 'veera',
    name: 'Krishan',
    role: 'AI CFO',
    email: 'krishan.cw@brandname.com',
    avatarBg: 'bg-primary',
    status: 'active',
    todayActionCount: 12,
    recentActions: [],
    officeTabs: ['Brief', 'Cash', 'Statements', 'BvA', 'Channels', 'Reports', 'Escalations'],
  },
  {
    id: 'priya',
    name: 'Priya',
    role: 'Vendor Management',
    email: 'priya.cw@brandname.com',
    avatarBg: 'bg-emerald-500',
    status: 'active',
    todayActionCount: 34,
    recentActions: [
      { ts: 'Today 09:14', verb: 'Sent chase email to A1 Packaging', meta: 'Awaiting reply' },
      { ts: 'Today 08:30', verb: 'Paid 8 vendors', meta: '₹4.2L' },
      { ts: 'Today 07:55', verb: 'Flagged A1 anomaly', meta: '3× invoice spike' },
    ],
    officeTabs: ['Master', 'AP Aging', 'Exceptions', 'Payment Runs', 'Inbox', 'MSME', 'TDS Register'],
  },
  {
    id: 'rohan',
    name: 'Rohan',
    role: 'Reconciliation',
    email: 'rohan.cw@brandname.com',
    avatarBg: 'bg-blue-600',
    status: 'active',
    todayActionCount: 21,
    recentActions: [
      { ts: 'Yesterday 17:42', verb: 'Filed claim #FK-2398', meta: '₹68,400' },
      { ts: 'Today 06:20', verb: 'Run reconciliation', meta: '4 new exceptions' },
      { ts: 'Yesterday 11:02', verb: 'Chased Flipkart SPOC', meta: 'Claim aging' },
    ],
    officeTabs: ['Cockpit', 'Returns & Recovery', 'Claims', 'COD', 'Aging'],
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'Marketing Efficiency',
    email: 'maya.cw@brandname.com',
    avatarBg: 'bg-amber-500',
    status: 'active',
    todayActionCount: 18,
    recentActions: [
      { ts: 'Yesterday 14:08', verb: 'Auto-paused campaign Summer Prospecting #4', meta: 'CM −₹4,200/day' },
      { ts: 'Today 10:22', verb: 'Reallocation recommendation ready', meta: '₹3.8L/wk' },
      { ts: 'Yesterday 09:40', verb: 'MER digest sent to Krishan', meta: 'Blended 2.4×' },
    ],
    officeTabs: ['Dashboard', 'Reallocation', 'Attribution', 'Burn list', 'Digest', 'Auto-pause log'],
  },
  {
    id: 'ankita',
    name: 'Ankita',
    role: 'Compliance',
    email: 'ankita.cw@brandname.com',
    avatarBg: 'bg-rose-600',
    status: 'awaiting',
    todayActionCount: 9,
    recentActions: [
      { ts: 'Yesterday 11:15', verb: 'Reconciled 26AS', meta: '₹2.14L TDS match' },
      { ts: 'Today 08:45', verb: 'GSTR-3B draft ready', meta: 'Apr 2026' },
      { ts: 'Yesterday 16:30', verb: 'Vendor 2B poke sent', meta: '3 vendors' },
    ],
    officeTabs: ['Calendar', 'GST', 'TDS', 'TCS', 'MSME', 'Notices', 'Repository'],
  },
];

export const getAgent = (id: Agent['id']) => AGENTS.find(a => a.id === id)!;

export const getCfo = () => getAgent(CFO_AGENT_ID);

export const getTeamReports = () => AGENTS.filter(a => a.id !== CFO_AGENT_ID);
