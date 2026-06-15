import { STATEMENT_PERIODS } from '../data/statementsMockData';
import type { StatementPeriod, StatementType } from '../v3Types';

export type StatementQueryResult =
  | { kind: 'resolved'; type: StatementType; period: StatementPeriod }
  | { kind: 'needs-type'; period?: StatementPeriod }
  | { kind: 'needs-period'; type: StatementType };

const TODAY = new Date('2026-05-22');
void TODAY;

export function parseStatementQuery(input: string): StatementQueryResult | null {
  const n = input.toLowerCase();

  const isPnL = /\b(p&l|pnl|profit.?and.?loss|income statement|profit.?statement|profit)\b/.test(n);
  const isBS = /\bbalance.?sheet\b/.test(n);
  const isCFS = /\bcash.?flow(s)?( statement)?\b|\bcfs\b|\bstatement of cash flows?\b/.test(n);

  const isGenericStmt =
    /\b(financial )?statement(s)?\b|\bmy numbers\b|\bmy books\b|\bfinancials\b/.test(n) &&
    !isPnL &&
    !isBS &&
    !isCFS;

  let type: StatementType | null = null;
  const typeFlags = [isPnL, isBS, isCFS].filter(Boolean).length;
  if (typeFlags === 1) {
    type = isPnL ? 'pnl' : isBS ? 'balance-sheet' : 'cash-flow';
  }

  if (!type && !isGenericStmt) return null;

  const periodId =
    /\bfy.?24.?25\b|\blast (financial )?year\b|\bfy.?25\b/.test(n)
      ? 'fy24-25'
      : /\bfy.?25.?26.?(ytd|so far|to date)|this (financial )?year|fy.?26/.test(n)
        ? 'fy25-26-ytd'
        : /\b(q1|first quarter).*(2026|fy.?25.?26|this year)|this quarter\b/.test(n)
          ? 'fy25-26-q1'
          : /\blast quarter\b|\b(q4|fourth quarter).*(2025|fy.?24.?25|last)/.test(n)
            ? 'fy24-25-q4'
            : /\bthis month\b|\bcurrent month\b|\bmay\b|\bmtd\b|\bas on today|as of today|today|current|now\b/.test(n)
              ? 'may-2026'
              : /\blast month\b|\bapril\b|\bprev(ious)? month\b/.test(n)
                ? 'apr-2026'
                : null;

  const period = periodId ? STATEMENT_PERIODS[periodId] : undefined;

  if (type && period) return { kind: 'resolved', type, period };
  if (type && !period) return { kind: 'needs-period', type };
  if (!type && period) return { kind: 'needs-type', period };
  if (!type && !period && isGenericStmt) return { kind: 'needs-type' };
  return null;
}
