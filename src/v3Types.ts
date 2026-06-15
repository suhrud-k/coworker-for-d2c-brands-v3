export type Tab = 'home' | 'connections' | 'team';
export type TeamView = 'roster' | 'agent' | 'policies' | 'counterparts' | 'contacts' | 'activity' | 'escalations';
export type AgentId = 'krishan' | 'priya' | 'rohan' | 'maya' | 'ankita';

export type ChatPage = 'home' | 'connections' | `office:${AgentId}`;

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

export type ThreadStatusSignal = 'green' | 'amber' | 'red' | 'neutral';

export type ThreadStatus = {
  id: 'reconciliation' | 'compliance' | 'marketing' | 'vendors';
  title: string;
  agentId: AgentId;
  signal: ThreadStatusSignal;
  statusLine: string;
  deepLink: { agentId: AgentId; officeTab: string };
};

export type InlineActionMessage = {
  id: string;
  agentId: AgentId;
  ts: string;
  body: string;
  cta: { label: string; deepLink: { agentId: AgentId; officeTab: string } };
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

export type ArtifactTable = {
  kind: 'table';
  columns: string[];
  rows: (string | number)[][];
  highlightLastRow?: boolean;
};
export type ArtifactBars = {
  kind: 'bars';
  unit: string;
  data: { label: string; value: number; color?: string }[];
};
export type ArtifactCompare = {
  kind: 'compare';
  rows: { label: string; before: string; after: string; delta: string; positive: boolean }[];
};
export type StatementType = 'pnl' | 'balance-sheet' | 'cash-flow';

export type StatementPeriod = {
  id: string;
  label: string;
  type: 'month' | 'quarter' | 'fy' | 'mtd' | 'qtd' | 'as-on';
  asOnDate?: string;
};

export type StatementLineItem = {
  label: string;
  amount: number;
  bold?: boolean;
  isSubtotal?: boolean;
  indent?: 0 | 1 | 2;
  noteRef?: string;
};

export type StatementSection = {
  title: string;
  lines: StatementLineItem[];
};

export type ArtifactStatement = {
  kind: 'statement';
  statementType: StatementType;
  period: StatementPeriod;
  priorPeriod?: StatementPeriod;
  sections: StatementSection[];
  priorAmounts?: Record<string, number>;
  currency: 'INR';
  unit: 'absolute' | 'lakhs' | 'crores';
  asOfLabel?: string;
};

export type Artifact = ArtifactTable | ArtifactBars | ArtifactCompare | ArtifactStatement;

export type V3CannedResponse = {
  id: string;
  question?: string;
  match?: RegExp[];
  keywords?: string[];
  agentId: AgentId;
  headline: string;
  body?: string;
  artifact?: Artifact;
  sources?: string[];
  drillLink?: { label: string; deepLink: OfficeDeepLink };
  chips?: string[];
  replyChips?: string[];
  pages?: ChatPage[];
  kind?: 'data' | 'jargon';
};

export type OfficeDeepLink = {
  agentId: AgentId;
  officeTab: string;
};
