# Cursor prompt — Port the v2 chat library (39 data + 25 jargon) into v3

**Context.** v2's "Ask CoWorker" chat had a library of 39 page-aware data Q&A entries (each with optional table/bars artifact, sources, drill-link) plus 25 plain-English jargon definitions, with regex + keyword matching and a tie-breaker that prefers jargon for "what is …" queries. v3 currently has only 13 stub entries and renders bare headline + body bubbles — no artifacts, no sources, no drill-links, no jargon badge.

**Goal.** Port the full v2 library into v3, mapped onto v3's agent-attribution + office-deep-link model. After this, every demo question the user asked in v2 must work in v3 with the same answer quality (artifacts and all), routed to the right agent's voice and deep-linking into the right agent's office.

**Read these files before starting:**
- `../coworker-for-d2c-brands_v2/Requirements/Prompt_AskCoWorker_PageAwareness.md` — the 39 data entries (existing 5 + 34 new), including the full TypeScript content for each entry's headline, body, artifact, sources, drillLink.
- `../coworker-for-d2c-brands_v2/Requirements/Prompt_VendorAnomaly_and_JargonChat.md` — section "Jargon library — 25 entries" has the full content for all 25 definitions, and the tie-breaker rule for "what is / explain / define" queries.
- `src/data/cannedResponses.ts` — current v3 state (13 entries; preserve these and dedupe against v2 ports).
- `src/v3Types.ts` — current type model.
- `src/utils/matchV3Question.ts` — current matcher.

---

## Part 1 — Type extension

Extend `V3CannedResponse` in `src/v3Types.ts` to carry v2's richer response shape. Add:

```ts
export type ArtifactTable = { kind: 'table'; columns: string[]; rows: (string | number)[][] };
export type ArtifactBars = { kind: 'bars'; unit: string; data: { label: string; value: number; color?: string }[] };
export type ArtifactCompare = { kind: 'compare'; left: { label: string; value: string }; right: { label: string; value: string } };
export type Artifact = ArtifactTable | ArtifactBars | ArtifactCompare;

export type V3CannedResponse = {
  id: string;
  question?: string;       // canonical question — used as chip label
  match: RegExp[];          // existing
  keywords?: string[];      // optional fuzzy-match terms (port from v2)
  agentId: AgentId;
  headline: string;
  body?: string;
  artifact?: Artifact;
  sources?: string[];
  drillLink?: { label: string; deepLink: OfficeDeepLink };
  chips?: string[];
  pages?: ChatPage[];
  kind?: 'data' | 'jargon';
};
```

Extend `ChatPage` to include `'connections'`:

```ts
export type ChatPage = 'home' | 'connections' | `office:${AgentId}`;
```

---

## Part 2 — Page mapping (v2 Tab → v3 ChatPage)

Use this map when porting each v2 entry's `pages` array:

| v2 Tab | v3 ChatPage |
|---|---|
| `'home'` | `'home'` |
| `'pnl'` (Channel Economics) | `'office:krishan'` |
| `'reconciliation'` | `'office:rohan'` |
| `'returns'` | `'office:rohan'` |
| `'ads'` (Marketing Efficiency) | `'office:maya'` |
| `'cash'` | `'office:krishan'` |
| `'reports'` | `'office:krishan'` |
| `'compliance'` | `'office:ankita'` |
| `'connections'` | `'connections'` |

A v2 entry with `pages: ['home', 'pnl', 'ads']` becomes `pages: ['home', 'office:krishan', 'office:maya']`. Always preserve `'home'` if v2 had it.

---

## Part 3 — Agent attribution

Every v3 response has an `agentId` (who's speaking). Map by subject matter:

| v2 subject | v3 `agentId` |
|---|---|
| Channel Economics, Cash, Reports, runway, balance sheet, treasury | `'krishan'` |
| Reconciliation, exceptions, settlements, claims, returns, RTO | `'rohan'` |
| Marketing, ads, PoAS, ROAS, MER, campaigns, attribution | `'maya'` |
| Vendors, AP, MSME, three-way match, vendor anomalies | `'priya'` |
| Compliance, GST (1/2B/3B/9), TDS, TCS, ITC, 26AS, 16A, HSN, PF, ESI | `'ankita'` |
| Connections, sync health, OAuth, data freshness | `'krishan'` (CFO owns the data stack) |

For cross-domain entries (e.g., "What are my top 3 leaks this week?"), pick the agent who owns the *dominant* leak — Krishan, since it's a cross-functional CFO question.

---

## Part 4 — Deep-link mapping (v2 route → v3 office deep-link)

v2's `drillLink.route` becomes v3's `drillLink.deepLink: OfficeDeepLink`:

| v2 route | v3 `deepLink` |
|---|---|
| `/pnl` | `{ agentId: 'krishan', officeTab: 'channels' }` |
| `/reconciliation` | `{ agentId: 'rohan', officeTab: 'cockpit' }` |
| `/returns` | `{ agentId: 'rohan', officeTab: 'returns' }` |
| `/ads` | `{ agentId: 'maya', officeTab: 'dashboard' }` |
| `/cash` | `{ agentId: 'krishan', officeTab: 'cash' }` |
| `/reports` | `{ agentId: 'krishan', officeTab: 'reports' }` |
| `/compliance` | `{ agentId: 'ankita', officeTab: 'calendar' }` |
| `/home` | omit `drillLink` (we're already on home) |
| `/connections` | omit `drillLink` for now (no agent office; we can add a top-level Connections deep-link later) |

The `drillLink.label` carries over verbatim from v2 (e.g., `"Open Channel Economics →"`).

---

## Part 5 — Port the 39 data entries

Source: `Prompt_AskCoWorker_PageAwareness.md`, section 6 (and the 5 existing entries described in section 3).

For each v2 entry, create a v3 entry with:
- `id` — keep v2 id verbatim (e.g., `'top_leaks'`, `'amazon_vs_flipkart'`).
- `question` — keep v2 question text verbatim (e.g., `"What are my top 3 leaks this week?"`).
- `keywords` — keep v2 keywords verbatim.
- `match` — derive a regex from keywords. Simplest pattern: `[new RegExp(keywords.join('.*'), 'i')]` for ordered terms, or alternation for either-order matches. For multi-keyword entries, include both orderings: `[/myntra.*margin|margin.*myntra/i]`. Aim for permissive matching — the user will type natural phrasings.
- `agentId` — per Part 3.
- `headline`, `body`, `artifact`, `sources` — copy verbatim from v2.
- `drillLink` — translate per Part 4.
- `pages` — translate per Part 2.

**Important: dedupe against the existing 9 v3 entries** in `cannedResponses.ts`. The current v3 entries are mostly v3-specific (e.g., `'v3_cash'`, `'v3_a1'`) and don't overlap with v2 ids — keep them all. But where a v2 entry covers the same ground as a v3 entry (e.g., v2's `'runway_trending'` overlaps v3's `'v3_cash'`), keep the v2 port (with the richer body/artifact) and remove the v3 stub.

Aim for total ≈ 39 data entries after merge.

---

## Part 6 — Port the 25 jargon entries

Source: `Prompt_VendorAnomaly_and_JargonChat.md`, section "Jargon library — 25 entries".

For each:
- `id` — keep v2 id (`'jargon_tcs'`, `'jargon_43b'`, etc.).
- `question` — keep v2 question (`"What is TCS?"`, `"What is Section 43B?"`).
- `keywords` — keep v2 keywords.
- `match` — regex covering the natural variants: `[/^(what is|what's|explain|define|what does|meaning of)\s+(<term>)/i]`. For `tcs`: `[/^(what is|what's|explain|define|what does|meaning of)\s+tcs/i, /\btcs\b/i]` (second pattern for bare term mentions).
- `agentId` — by topic:
  - Ankita: TCS, GSTR-1/2B/3B/9, ITC, 43B, 194-O, 26AS, 16A, HSN, PF ECR, ESI
  - Priya: TDS, MSME, UDYAM, three-way match, COGS
  - Maya: PoAS, ROAS, MER, CAC, LTV
  - Rohan: FBA
  - Krishan: Founder Decision Brief
- `headline`, `body`, `sources` — copy verbatim from v2.
- `kind: 'jargon'`.
- `pages: ['home', 'connections', 'office:krishan', 'office:priya', 'office:rohan', 'office:maya', 'office:ankita']` (jargon is universal — resolves from anywhere).
- No `artifact`, no `drillLink`, no `chips`.

**Augment the 4 existing v3 jargon entries** (tcs, tds, gstr2b, msme) with the longer v2 bodies if v3's are shorter. Replace the v3 versions wholesale with v2 content where the v2 entry is richer.

Aim for total 25 jargon entries after merge.

---

## Part 7 — `getChipsForPage` returns 5 chips

Update `getChipsForPage` in `src/data/cannedResponses.ts`:

```ts
return chips.slice(0, 5);  // was 4
```

Sourcing: chips come from each entry's `chips?: string[]` field today. Since we're porting v2 entries, ALSO seed page chips from the `question` field — i.e., when filtering candidates for a page, the chip pool is the union of `chips[]` arrays AND the `question` (each entry's canonical chip label) for entries whose `pages` include the current page and whose `kind` is not `'jargon'`. Suggested implementation:

```ts
export function getChipsForPage(page: ChatPage, mention?: AgentId): string[] {
  const pool = V3_CANNED.filter(r => {
    if (r.kind === 'jargon') return false;
    if (mention && r.agentId !== mention) return false;
    return r.pages?.includes(page);
  });
  const seen = new Set<string>();
  const chips: string[] = [];
  // Prefer canonical question as the chip label (v2 behaviour)
  for (const r of pool) {
    const label = r.question ?? r.chips?.[0];
    if (label && !seen.has(label)) {
      seen.add(label);
      chips.push(label);
    }
  }
  return chips.slice(0, 5);
}
```

If a page has fewer than 5 chips after filtering, return what's available — don't pad with off-page questions.

---

## Part 8 — Match logic with jargon tie-breaker

Update `src/utils/matchV3Question.ts`:

```ts
import { V3_CANNED } from '../data/cannedResponses';
import type { V3CannedResponse, AgentId } from '../v3Types';

const JARGON_PREFIX = /^(what is|what's|explain|define|meaning of|what does)\b/i;

export function matchV3Question(input: string, currentMention?: AgentId): V3CannedResponse | null {
  const trimmed = input.trim();
  const n = trimmed.toLowerCase().replace(/[.?!]+$/g, '');

  // Pass 1 — exact match on canonical question
  const exact = V3_CANNED.find(r =>
    r.question && r.question.toLowerCase().replace(/[.?!]+$/g, '') === n
  );
  if (exact) return exact;

  // Pass 2 — regex match
  const regexHits = V3_CANNED.filter(r => r.match.some(rx => rx.test(trimmed)));
  if (regexHits.length === 0) return null;

  // Tie-breaker — prefer jargon for "what is …" queries
  if (JARGON_PREFIX.test(trimmed)) {
    const jargon = regexHits.find(r => r.kind === 'jargon');
    if (jargon) return jargon;
  }

  // If @-mention scoped, prefer hits from that agent
  if (currentMention) {
    const scoped = regexHits.find(r => r.agentId === currentMention);
    if (scoped) return scoped;
  }

  return regexHits[0];
}
```

Keep the existing @-mention parser (`@krishan`, `@priya`, etc.) — pass the resolved AgentId as `currentMention`.

---

## Part 9 — Render artifacts, sources, drill-links, jargon badge

The chat bubble component currently renders only `headline` + `body`. Extend it to render:

**Artifact (below body).** Three small renderers in `src/components/Artifact*.tsx`:

- `ArtifactTable` — simple table. `text-sm`, header row `bg-slate-50 font-medium text-slate-700`, body rows `divide-y divide-slate-200`, cell padding `px-3 py-2`, outer wrapper `border border-slate-200 rounded-lg overflow-hidden`.
- `ArtifactBars` — horizontal bars. Max value in dataset sets 100% width. Each row: label on the left (`text-xs text-slate-600`, fixed width), bar fill with Cashfree purple `#6930CA` (or `color` override per data point if provided), numeric value on the right. Show the `unit` as a caption above the bars.
- `ArtifactCompare` — two side-by-side cards with `left.label/value` and `right.label/value`. `grid grid-cols-2 gap-3`, each card `bg-slate-50 rounded-lg p-3 text-center` with label in `text-xs text-slate-500` above value in `text-lg font-semibold`.

**Sources** (below artifact). Small inline strip: `text-xs text-slate-500 mt-3` reading `Sources: ` + comma-separated source names. For jargon entries with a single source, render the same way.

**Drill-link** (below sources). `btn-secondary` styled button at the bottom of the bubble:
```tsx
<button onClick={() => onDeepLink(response.drillLink.deepLink)} className="btn-secondary text-sm h-9 px-4 mt-3">
  {response.drillLink.label}
</button>
```
Wire `onDeepLink` to dispatch the route change (`setTab('team')`, `setView('agent')`, `setAgentId(deepLink.agentId)`, `setOfficeTab(deepLink.officeTab)`).

**Jargon badge.** When `response.kind === 'jargon'`, render in the top-right corner of the bubble:
```tsx
<span className="absolute top-2 right-2 bg-purple-50 text-purple-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
  📘 Glossary
</span>
```
Skip artifact rendering even if one is present. Keep the sources line.

---

## Part 10 — Acceptance criteria

1. `V3_CANNED` array contains ~39 data entries + 25 jargon entries (≈ 64 total). No duplicate ids.
2. `getChipsForPage('home')` returns 5 chips matching the v2 Home set ("What are my top 3 leaks this week?", "Why is Myntra margin down this week?", "Show pending claims older than 30 days", "How is my cash runway trending?", "What compliance filings are due this week?").
3. `getChipsForPage('office:krishan')` returns 5 chips drawn from v2's `pnl` + `cash` + `reports` pools.
4. `getChipsForPage('office:rohan')` returns 5 chips drawn from `reconciliation` + `returns` pools.
5. `getChipsForPage('office:maya')` returns 5 chips from `ads`.
6. `getChipsForPage('office:ankita')` returns 5 chips from `compliance`.
7. `getChipsForPage('office:priya')` returns chips from existing v3 Priya entries — currently sparse, OK if fewer than 5 (don't pad).
8. Typing `"what is TCS?"` returns the jargon entry (Ankita, with Glossary badge).
9. Typing `"show me TCS variance with Form 26AS"` returns the data entry (Ankita, with the table artifact).
10. Typing `"what is the founder decision brief?"` returns the jargon entry (Krishan).
11. Typing `"compare Amazon vs Flipkart unit economics"` returns Krishan's response with the comparison table artifact.
12. Typing `"how much money are we losing to returns this month?"` returns Rohan's response with the bars artifact.
13. Clicking any drill-link button navigates to the correct agent office + sub-tab.
14. Jargon entries render the `📘 Glossary` badge in the top-right of the bubble.
15. Chat history persists across page navigation (existing behavior preserved).
16. `npm run dev` builds cleanly with no TypeScript errors.

---

## Part 11 — Notes on dedup and conflict resolution

- The current v3 stub entries (`v3_cash`, `v3_mer`, `v3_unreconciled`, `v3_ankita_pending`, `v3_vendor_pay`, `v3_a1`, `v3_brief`, `v3_claims`) are agent-voice flavored and don't have v2 equivalents — keep them. They provide office-specific responses ("Show 13-week forecast", etc.) that the v2 library doesn't cover.
- Where a v2 entry overlaps a v3 stub (e.g., v2 `runway_trending` vs v3 `v3_cash`), prefer the v2 port (it has the richer body and the `drillLink`) and delete the v3 stub.
- Where a v2 entry's chip label exactly matches a v3 entry's chip, dedup by canonical question — both should share the same question text.

---

**Apply in order:** Part 1 (types) → Part 5 (data entries) → Part 6 (jargon) → Part 7 (chip count) → Part 8 (match logic) → Part 9 (renderer). Verify acceptance criteria after each major part.
