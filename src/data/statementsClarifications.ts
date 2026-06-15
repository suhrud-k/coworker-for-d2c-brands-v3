import type { StatementPeriod, StatementType, V3CannedResponse } from '../v3Types';
import { getStatementPeriodsForType } from './statementsMockData';

export function clarifyType(period?: StatementPeriod): V3CannedResponse {
  const periodSuffix = period ? ` for ${period.label}` : '';
  return {
    id: `clarify_stmt_type_${period?.id ?? 'nop'}`,
    match: [],
    agentId: 'krishan',
    headline: `Which statement would you like${periodSuffix}?`,
    body: 'I can pull a P&L, a Balance Sheet, or a Cash Flow Statement.',
    replyChips: period
      ? [
          `Generate the P&L for ${period.label}`,
          `Pull the Balance Sheet as on ${period.asOnDate ?? period.label}`,
          `Show the Cash Flow Statement for ${period.label}`,
        ]
      : ['Generate the P&L', 'Pull the Balance Sheet', 'Show the Cash Flow Statement'],
    pages: ['home', 'office:krishan'],
  };
}

export function clarifyPeriod(type: StatementType): V3CannedResponse {
  const typeLabel = type === 'pnl' ? 'P&L' : type === 'balance-sheet' ? 'Balance Sheet' : 'Cash Flow Statement';
  const periods = getStatementPeriodsForType(type);
  return {
    id: `clarify_stmt_period_${type}`,
    match: [],
    agentId: 'krishan',
    headline: type === 'balance-sheet' ? 'For which date?' : 'For which period?',
    body: `I have ${typeLabel} statements ready for these periods. Pick one — or type a specific month/quarter and I'll check.`,
    replyChips: periods.map(p =>
      type === 'pnl'
        ? `Generate the P&L for ${p.label}`
        : type === 'balance-sheet'
          ? `Pull the Balance Sheet as on ${p.label}`
          : `Show the Cash Flow Statement for ${p.label}`
    ),
    pages: ['home', 'office:krishan'],
  };
}
