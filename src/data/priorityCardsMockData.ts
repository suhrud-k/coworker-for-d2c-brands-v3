import type { PriorityCard } from '../v3Types';

export const PRIORITY_CARDS: PriorityCard[] = [
  {
    id: 'pay-vendors',
    title: 'Approve 3 vendor payments',
    subline: '₹2,42,000 · Priya',
    agentId: 'priya',
    status: 'Awaiting CFO',
    cta: 'Review',
    agentTab: 'Payment Runs',
  },
  {
    id: 'maya-realloc',
    title: "Review Maya's reallocation",
    subline: '₹3.8L/wk · Maya',
    agentId: 'maya',
    status: 'Recommendation ready',
    cta: 'Open simulator',
    agentTab: 'Reallocation',
  },
  {
    id: 'gstr3b',
    title: 'Sign off GSTR-3B for Apr 2026',
    subline: 'Ankita',
    agentId: 'ankita',
    status: 'Due in 3 days',
    cta: 'Open',
    agentTab: 'GST',
  },
];
