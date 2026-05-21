import { V3_CANNED } from '../data/cannedResponses';
import type { AgentId } from '../v3Types';

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[.?!]+$/g, '');
}

function isJargonQuery(n: string): boolean {
  return /^(what is|what's|whats|explain|define|meaning of|what does)\b/.test(n);
}

function parseMention(input: string): { text: string; agent?: AgentId } {
  const m = input.match(/^@(veera|krishan|priya|rohan|maya|ankita)\b\s*/i);
  if (!m) return { text: input };
  const alias = m[1].toLowerCase();
  const agent: AgentId = alias === 'krishan' || alias === 'veera' ? 'veera' : (alias as AgentId);
  return { text: input.slice(m[0].length), agent };
}

export function matchV3Question(input: string): { id: string | null; mention?: AgentId } {
  const { text, agent: mention } = parseMention(input);
  const n = normalize(text);

  for (const r of V3_CANNED) {
    if (r.match.some(rx => rx.test(n) || rx.test(input))) {
      if (mention && r.agentId !== mention && r.kind !== 'jargon') continue;
      return { id: r.id, mention };
    }
  }

  if (isJargonQuery(n)) {
    const jargon = V3_CANNED.filter(r => r.kind === 'jargon');
    for (const r of jargon) {
      if (r.match.some(rx => rx.test(n))) return { id: r.id, mention };
    }
  }

  const keywordHits = V3_CANNED.filter(r =>
    !r.kind &&
    r.match.some(rx => {
      const src = rx.source.replace(/^\/|\/[a-z]*$/gi, '').replace(/\\b/g, '').replace(/\\s/g, ' ');
      const words = src.split('|').filter(w => w.length > 2);
      return words.some(w => n.includes(w.toLowerCase()));
    })
  );
  if (keywordHits.length) {
    const pick = mention ? keywordHits.find(r => r.agentId === mention) ?? keywordHits[0] : keywordHits[0];
    return { id: pick.id, mention };
  }

  return { id: null, mention };
}

export { parseMention };
