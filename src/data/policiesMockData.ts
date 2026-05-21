import type { Threshold } from '../v3Types';

export const DEFAULT_THRESHOLDS: Threshold[] = [
  { agentId: 'priya', key: 'autoPayCeiling', label: 'Auto-pay ceiling (known vendors)', unit: '₹', value: 50000, min: 10000, max: 200000, step: 5000 },
  { agentId: 'priya', key: 'cfoApprovalMin', label: 'CFO approval band (min)', unit: '₹', value: 50000, min: 25000, max: 100000, step: 5000 },
  { agentId: 'priya', key: 'founderCeiling', label: 'Akash approval ceiling', unit: '₹', value: 500000, min: 100000, max: 2000000, step: 50000 },
  { agentId: 'priya', key: 'msmeWindow', label: 'MSME-priority window (days)', unit: 'days', value: 40, min: 30, max: 45, step: 1 },
  { agentId: 'rohan', key: 'claimAutoFile', label: 'Claim auto-file unit value', unit: '₹', value: 50000, min: 10000, max: 100000, step: 5000 },
  { agentId: 'rohan', key: 'autoWriteOff', label: 'Auto-write-off limit', unit: '₹', value: 10000, min: 1000, max: 50000, step: 1000 },
  { agentId: 'rohan', key: 'cfoWriteOff', label: 'CFO write-off band (max)', unit: '₹', value: 100000, min: 25000, max: 500000, step: 5000 },
  { agentId: 'rohan', key: 'spocChaseDays', label: 'Marketplace SPOC chase (days)', unit: 'days', value: 3, min: 1, max: 7, step: 1 },
  { agentId: 'maya', key: 'autoPauseDays', label: 'Auto-pause negative-CM days', unit: 'days', value: 7, min: 3, max: 14, step: 1 },
  { agentId: 'maya', key: 'reallocAutonomy', label: 'Within-group reallocation autonomy', unit: '%', value: 10, min: 5, max: 25, step: 1 },
  { agentId: 'maya', key: 'brandDefence', label: 'Brand-defence campaigns protected', unit: 'toggle', value: true },
  { agentId: 'ankita', key: 'autoGstr1', label: 'Auto-file GSTR-1', unit: 'toggle', value: true },
  { agentId: 'ankita', key: 'vendor2bPoke', label: 'Vendor 2B mismatch poke', unit: 'days', value: 7, min: 3, max: 14, step: 1 },
  { agentId: 'veera', key: 'founderPaymentCeiling', label: 'Akash approval ceiling (any payment)', unit: '₹', value: 500000, min: 100000, max: 2000000, step: 50000 },
  { agentId: 'veera', key: 'briefTime', label: 'Brief send time', unit: 'time', value: '08:00' },
  { agentId: 'veera', key: 'briefFormat', label: 'Brief format', unit: 'multi', value: ['concise'] },
];

export const POLICY_CHANGE_LOG = [
  { ts: '2026-05-18', text: "Suhrud raised Priya's auto-pay ceiling from ₹50k to ₹75k" },
  { ts: '2026-05-15', text: 'Maya reallocation autonomy set to 10% (from 5%)' },
  { ts: '2026-05-12', text: 'Ankita auto-file GSTR-1 enabled' },
  { ts: '2026-05-10', text: "Rohan claim auto-file unit value set to ₹50k" },
];
