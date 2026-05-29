import { V3_CANNED } from '../data/cannedResponses';
import type { V3CannedResponse, AgentId } from '../v3Types';

const JARGON_PREFIX = /^(what is|what's|whats|explain|define|meaning of|what does)\b/i;

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[.?!]+$/g, '');
}

export function parseMention(input: string): { text: string; agent?: AgentId } {
  const m = input.match(/^@(krishan|priya|rohan|maya|ankita)\b\s*/i);
  if (!m) return { text: input };
  return { text: input.slice(m[0].length), agent: m[1].toLowerCase() as AgentId };
}

function entryMatches(r: V3CannedResponse, n: string, original: string): boolean {
  if (r.keywords?.length) {
    // Jargon definitions resolve on ANY of their term variants ("43b" alone is
    // enough). Data entries require ALL keywords so specific multi-term queries
    // (e.g. "tcs variance") beat the bare definition.
    const ok =
      r.kind === 'jargon'
        ? r.keywords.some(k => n.includes(k.toLowerCase()))
        : r.keywords.every(k => n.includes(k.toLowerCase()));
    if (ok) return true;
  }
  if (r.match?.length && r.match.some(rx => rx.test(original) || rx.test(n))) return true;
  return false;
}

export function matchV3Question(input: string, currentMention?: AgentId): V3CannedResponse | null {
  const trimmed = input.trim();
  const n = normalize(trimmed);

  // Pass 1 — exact match on canonical question
  const exact = V3_CANNED.find(r => r.question && normalize(r.question) === n);
  if (exact) return exact;

  // Pass 2 — keyword / regex match
  const hits = V3_CANNED.filter(r => entryMatches(r, n, trimmed));
  if (hits.length === 0) return null;

  // Tie-breaker — prefer jargon for "what is …" queries
  if (JARGON_PREFIX.test(trimmed)) {
    const jargon = hits.find(r => r.kind === 'jargon');
    if (jargon) return jargon;
  }

  // If @-mention scoped, prefer hits from that agent
  if (currentMention) {
    const scoped = hits.find(r => r.agentId === currentMention && r.kind !== 'jargon');
    if (scoped) return scoped;
  }

  // Default: data entries are listed before jargon in V3_CANNED, so the first
  // hit favours the rich data answer over a bare definition.
  return hits[0];
}
