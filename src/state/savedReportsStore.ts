import type { ArtifactStatement, StatementType } from '../v3Types';

const KEY = 'cw_saved_reports_v1';

export type SavedReport = {
  id: string;
  savedAt: string;
  type: StatementType;
  periodLabel: string;
  statement: ArtifactStatement;
};

export function getSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(s: SavedReport): void {
  const all = getSavedReports();
  const next = [s, ...all.filter(r => r.id !== s.id)];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function removeReport(id: string): void {
  const next = getSavedReports().filter(r => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}
