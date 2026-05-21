import type { Escalation } from '../v3Types';

export const ESCALATIONS: Escalation[] = [
  {
    id: 'esc-1',
    fromAgent: 'priya',
    title: 'Approve 3 vendor payments',
    amount: 242000,
    reason: 'Above auto-pay ceiling (₹50k) · known vendors, no exceptions',
    daysWaiting: 0,
    proposedAction: 'approve',
  },
  {
    id: 'esc-2',
    fromAgent: 'maya',
    title: "Reallocate ₹3.8L/wk from Myntra prospecting",
    amount: 380000,
    reason: 'Negative CM for 8 days · within 10% reallocation band',
    daysWaiting: 1,
    proposedAction: 'discuss',
  },
  {
    id: 'esc-3',
    fromAgent: 'ankita',
    title: 'GSTR-3B sign-off — Apr 2026',
    reason: 'CA Rajesh Mehta attached · ₹12.4L liability',
    daysWaiting: 3,
    proposedAction: 'approve',
  },
  {
    id: 'esc-4',
    fromAgent: 'rohan',
    title: 'Write off ₹18,200 unidentified debit',
    amount: 18200,
    reason: 'Aging > 45 days · below CFO write-off band',
    daysWaiting: 2,
    proposedAction: 'reject',
  },
];
