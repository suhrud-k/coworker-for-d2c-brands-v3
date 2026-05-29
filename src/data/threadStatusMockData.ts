import type { ThreadStatus } from '../v3Types';

export const THREAD_STATUS: ThreadStatus[] = [
  {
    id: 'reconciliation',
    title: 'Reconciliation',
    agentId: 'rohan',
    signal: 'amber',
    statusLine: 'Up to yesterday — 4 unreconciled entries',
    deepLink: { agentId: 'rohan', officeTab: 'Cockpit' },
  },
  {
    id: 'compliance',
    title: 'Compliance',
    agentId: 'ankita',
    signal: 'green',
    statusLine: 'All filings up to date',
    deepLink: { agentId: 'ankita', officeTab: 'Calendar' },
  },
  {
    id: 'marketing',
    title: 'Marketing',
    agentId: 'maya',
    signal: 'neutral',
    statusLine: 'PoAS 125% · ↑ 8pp vs last week',
    deepLink: { agentId: 'maya', officeTab: 'Dashboard' },
  },
  {
    id: 'vendors',
    title: 'Vendors',
    agentId: 'priya',
    signal: 'amber',
    statusLine: '1 payment needs your approval',
    deepLink: { agentId: 'priya', officeTab: 'Payment Runs' },
  },
];
