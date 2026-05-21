import type { ExternalContact } from '../v3Types';

export const EXTERNAL_CONTACTS: ExternalContact[] = [
  {
    id: 'ca-1',
    name: 'CA Rajesh Mehta',
    role: 'Chartered Accountant',
    email: 'ca@mehtaassociates.in',
    scope: ['GSTR-3B sign-off', 'GSTR-9', 'Notices'],
    lastInteraction: '2026-05-17',
  },
  {
    id: 'aud-1',
    name: 'Statutory Auditor — KPMG India',
    role: 'Statutory Auditor',
    email: 'audit@kpmg.in',
    scope: ['Annual audit', 'Tax audit'],
    lastInteraction: '2026-04-28',
  },
  {
    id: 'bank-1',
    name: 'HDFC Relationship Manager',
    role: 'Banker',
    email: 'rm.hdfc@brand.com',
    scope: ['OD facility', 'Sweep'],
    lastInteraction: '2026-05-10',
  },
];
