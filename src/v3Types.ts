export type Tab = 'home' | 'connections' | 'team';
export type TeamView = 'roster' | 'agent' | 'policies' | 'counterparts' | 'contacts' | 'activity' | 'escalations';
export type AgentId = 'veera' | 'priya' | 'rohan' | 'maya' | 'ankita';

export type ChatPage = 'home' | `office:${AgentId}`;

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  email: string;
  avatarBg: string;
  status: 'active' | 'awaiting' | 'escalated' | 'paused';
  todayActionCount: number;
  recentActions: { ts: string; verb: string; meta?: string }[];
  officeTabs: string[];
};

export type PriorityCard = {
  id: string;
  title: string;
  subline: string;
  agentId: AgentId;
  status: string;
  cta: string;
  agentTab?: string;
};

export type Threshold = {
  agentId: AgentId;
  key: string;
  label: string;
  unit: '₹' | '%' | 'days' | 'time' | 'toggle' | 'multi';
  value: number | string | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
};

export type Counterpart = {
  agentId: AgentId;
  name: string;
  email: string;
  digestMode: 'off' | 'daily' | 'weekly';
};

export type ExternalContact = {
  id: string;
  name: string;
  role: string;
  email: string;
  scope: string[];
  lastInteraction?: string;
};

export type ActivityEntry = {
  id: string;
  ts: string;
  agentId: AgentId;
  verb: string;
  meta?: string;
  amount?: number;
  status: 'done' | 'pending' | 'awaiting-reply' | 'rejected';
  actionType: 'email' | 'payment' | 'filing' | 'claim' | 'alert';
};

export type Escalation = {
  id: string;
  fromAgent: AgentId;
  title: string;
  amount?: number;
  reason: string;
  daysWaiting: number;
  proposedAction: 'approve' | 'reject' | 'discuss';
};

export type V3CannedResponse = {
  id: string;
  match: RegExp[];
  agentId: AgentId;
  headline: string;
  body: string;
  chips?: string[];
  pages?: ChatPage[];
  kind?: 'data' | 'jargon';
};
