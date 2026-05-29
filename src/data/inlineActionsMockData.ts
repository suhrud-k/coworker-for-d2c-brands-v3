import type { InlineActionMessage } from '../v3Types';

export const INLINE_ACTIONS: InlineActionMessage[] = [
  {
    id: 'action-priya-payments',
    agentId: 'priya',
    ts: '09:12',
    body: 'Priya has 3 vendor payments queued for your approval, total ₹2.42L. A1 Packaging is held pending her anomaly review.',
    cta: {
      label: 'Review & approve →',
      deepLink: { agentId: 'priya', officeTab: 'Payment Runs' },
    },
  },
  {
    id: 'action-maya-realloc',
    agentId: 'maya',
    ts: '09:30',
    body: 'Maya found a reallocation that lifts blended MER by 0.4 — moving ₹3.8L/wk from Meta prospecting to Google brand defence.',
    cta: {
      label: 'Open simulator →',
      deepLink: { agentId: 'maya', officeTab: 'Reallocation' },
    },
  },
  {
    id: 'action-ankita-gstr3b',
    agentId: 'ankita',
    ts: '10:00',
    body: 'Ankita has GSTR-3B for Apr 2026 drafted and CA-reviewed. Due in 3 days.',
    cta: {
      label: 'Open & sign →',
      deepLink: { agentId: 'ankita', officeTab: 'GST' },
    },
  },
  {
    id: 'action-rohan-claim',
    agentId: 'rohan',
    ts: '10:18',
    body: 'Rohan recovered claim #FK-2398 from Flipkart, ₹68,400. Ready for your verification.',
    cta: {
      label: 'Verify →',
      deepLink: { agentId: 'rohan', officeTab: 'Claims' },
    },
  },
];
