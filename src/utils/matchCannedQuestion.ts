import { RESPONSES } from '../data/askCoWorkerResponses';

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[.?!]+$/g, '');
}

function isJargonQuery(n: string): boolean {
  return /^(what is|what's|whats|explain|define|meaning of|what does)\b/.test(n);
}

export function matchCannedQuestion(input: string): string | null {
  const n = normalize(input);

  const exact = RESPONSES.find(
    r => normalize(r.question) === n
  );
  if (exact) return exact.id;

  const fuzzyMatches = RESPONSES.filter(r =>
    r.keywords.every(k => n.includes(k.toLowerCase()))
  );
  if (fuzzyMatches.length === 0) return null;

  const pickBest = (pool: typeof RESPONSES) =>
    [...pool].sort((a, b) => b.keywords.length - a.keywords.length)[0];

  if (isJargonQuery(n)) {
    const jargonMatches = fuzzyMatches.filter(r => r.kind === 'jargon');
    if (jargonMatches.length > 0) return pickBest(jargonMatches).id;
  }

  const dataMatches = fuzzyMatches.filter(r => r.kind !== 'jargon');
  if (dataMatches.length > 0) return pickBest(dataMatches).id;

  return pickBest(fuzzyMatches).id;
}
