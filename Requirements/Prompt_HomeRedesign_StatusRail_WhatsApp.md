# Cursor prompt — Home redesign + Krishan rename (v3 codebase)

**Context.** Three targeted changes to the existing v3 build:

1. **Rename the AI CFO from Veera → Krishan** everywhere (codebase + mock data + types).
2. **Redesign the Home tab** — kill the separate priority-action cards; surface those actions as inline chat messages from the relevant agent, each with an embedded CTA button. Add a 4-thread **status rail** on the right column.
3. **Add a WhatsApp chip** at the bottom of the chat panel — "Chat with Krishan on WhatsApp" with the WA icon, linking out to `wa.me`.

The spec for all three lives in `../coworker-for-d2c-brands_v2/Requirements/Prompt_v3_DashboardRedesign.md` (the updated source-of-truth doc). What follows is the **focused delta** Cursor should apply.

---

## Part 1 — Rename Veera → Krishan (global)

Treat the AI CFO's canonical identifier as `krishan` everywhere. The display name, email, and AgentId all change.

**Search-and-replace targets (case-sensitive):**

| Find | Replace |
|---|---|
| `Veera` | `Krishan` |
| `'veera'` | `'krishan'` |
| `"veera"` | `"krishan"` |
| `@veera` | `@krishan` |
| `office:veera` | `office:krishan` |
| `veera.cw@` | `krishan.cw@` |
| `VeeraBriefPanel` | `KrishanBriefPanel` (also rename the file from `VeeraBriefPanel.tsx` → `KrishanBriefPanel.tsx`) |
| `VEERA` (constant in `cannedResponses.ts`) | `KRISHAN` |

**Pronoun corrections** (Krishan is male — `he/his`):
- `src/components/KrishanBriefPanel.tsx` (renamed from `VeeraBriefPanel.tsx`) — change any `she`, `her`, `hers` referring to the CFO to `he`, `his`, `his`.
- Any other component or mock-data string referring to the CFO with feminine pronouns — convert.

**Backward-compat alias to remove.** In `src/utils/matchV3Question.ts`, the current line:
```ts
const m = input.match(/^@(veera|krishan|priya|rohan|maya|ankita)\b\s*/i);
...
const agent: AgentId = alias === 'krishan' || alias === 'veera' ? 'veera' : (alias as AgentId);
```
becomes:
```ts
const m = input.match(/^@(krishan|priya|rohan|maya|ankita)\b\s*/i);
...
const agent: AgentId = alias as AgentId;
```

**Agent avatar disc colour** stays purple `#6930CA` (the CFO colour). Only the name and initial change (V → K).

After the rename, run a final grep for `veera` (case-insensitive) across `src/` — there should be zero hits.

---

## Part 2 — Home tab redesign

Replace the current Home layout end-to-end. The new layout is **two columns on desktop**, single column on mobile.

### 2a. Remove the priority-action card row

If the Home component currently renders a row of 3–4 priority-action cards above the chat, **remove that row entirely**. Those actions are now inline messages inside the chat (see 2b).

### 2b. Chat panel becomes the primary canvas

Inside the chat panel, render these elements **in order, top-to-bottom**:

1. **Header.** "Chat with your team" — `text-sm font-medium` — with a horizontal strip of the 5 agent avatars (32px each, coloured discs with initials).
2. **Krishan's opening message** (canned). Render as a chat bubble — purple avatar, name + timestamp on top, one paragraph body: "Good morning. Cash position ₹1.42 cr. Runway 11.2 weeks. 3 items need you today." Hard-code the timestamp `08:00`.
3. **Four inline agent action messages**, each a chat bubble with an embedded CTA button. Source data from a new file: `src/data/inlineActionsMockData.ts`. Schema:
   ```ts
   type InlineActionMessage = {
     id: string;
     agentId: AgentId;
     ts: string;              // display string, e.g. "09:12"
     body: string;
     cta: { label: string; deepLink: { agentId: AgentId; officeTab: string } };
   };
   ```
   Seed data:
   ```ts
   export const INLINE_ACTIONS: InlineActionMessage[] = [
     {
       id: 'ia1',
       agentId: 'priya',
       ts: '09:12',
       body: 'I have 3 vendor payments queued for your approval, total ₹2.42L. A1 Packaging is held pending the anomaly review.',
       cta: { label: 'Review & approve', deepLink: { agentId: 'priya', officeTab: 'payment-runs' } },
     },
     {
       id: 'ia2',
       agentId: 'maya',
       ts: '09:30',
       body: 'Found a reallocation that lifts blended MER by 0.4 — move ₹3.8L/wk from Meta prospecting to Google brand defence.',
       cta: { label: 'Open simulator', deepLink: { agentId: 'maya', officeTab: 'reallocation' } },
     },
     {
       id: 'ia3',
       agentId: 'ankita',
       ts: '10:00',
       body: 'GSTR-3B for Apr 2026 drafted. CA has reviewed. Due in 3 days.',
       cta: { label: 'Open & sign', deepLink: { agentId: 'ankita', officeTab: 'gst' } },
     },
     {
       id: 'ia4',
       agentId: 'rohan',
       ts: '10:18',
       body: 'Recovered claim #FK-2398 from Flipkart, ₹68,400. Ready for your verification.',
       cta: { label: 'Verify', deepLink: { agentId: 'rohan', officeTab: 'claims' } },
     },
   ];
   ```
   Bubble styling: 32px agent avatar (initial on coloured disc) flush-left, then a column with `agentName · timestamp` in `text-xs text-slate-500`, body in `text-sm text-slate-800`, then the CTA button — full-width inside the bubble, `btn-primary` Cashfree purple, height 36px, `rounded-lg`. Clicking the CTA must call the existing route handler with `tab='team', view='agent', agentId, officeTab`.

4. **Suggested prompts.** 4 chips in a row below the action messages. Pull from the canned-response library filtered for `page='home'`.
5. **Input field** + send button (same as today).
6. **WhatsApp chip** — see Part 3 below.

### 2c. Status rail (right column, 280px wide)

Create a new component `src/components/StatusRail.tsx`. Width 280px, stacked vertically inside the right column.

**Title:** `Today's status` in `text-sm font-medium text-slate-600`, plus a tiny `(updated 2 min ago)` timestamp on the right in `text-xs text-slate-400`.

**Four cards stacked below.** Card source data lives in `src/data/threadStatusMockData.ts`:

```ts
type ThreadStatus = {
  id: 'reconciliation' | 'compliance' | 'marketing' | 'vendors';
  title: string;
  agentId: AgentId;
  signal: 'green' | 'amber' | 'red' | 'neutral';
  statusLine: string;
  deepLink: { agentId: AgentId; officeTab: string };
};

export const THREAD_STATUSES: ThreadStatus[] = [
  {
    id: 'reconciliation',
    title: 'Reconciliation',
    agentId: 'rohan',
    signal: 'amber',
    statusLine: 'Up to yesterday — 4 unreconciled entries',
    deepLink: { agentId: 'rohan', officeTab: 'cockpit' },
  },
  {
    id: 'compliance',
    title: 'Compliance',
    agentId: 'ankita',
    signal: 'green',
    statusLine: 'All filings up to date',
    deepLink: { agentId: 'ankita', officeTab: 'calendar' },
  },
  {
    id: 'marketing',
    title: 'Marketing',
    agentId: 'maya',
    signal: 'neutral',
    statusLine: 'PoAS 125% · ↑ 8pp vs last week',
    deepLink: { agentId: 'maya', officeTab: 'dashboard' },
  },
  {
    id: 'vendors',
    title: 'Vendors',
    agentId: 'priya',
    signal: 'amber',
    statusLine: '1 payment needs your approval',
    deepLink: { agentId: 'priya', officeTab: 'payment-runs' },
  },
];
```

**Card anatomy** (per card):

- Outer wrapper: `bg-white rounded-xl border border-slate-200 p-4 hover:border-purple-300 hover:shadow-sm transition cursor-pointer`. Whole card is clickable → dispatches the deep-link.
- Inside: horizontal flex, `gap-3`.
  - **Icon column** (32px wide, flush-top). Pick icon from `lucide-react` based on `signal`:
    - `green` → `CheckCircle2`, color `text-emerald-600`
    - `amber` → `AlertTriangle`, color `text-amber-500`
    - `red` → `AlertCircle`, color `text-rose-600`
    - `neutral` → `BarChart3`, color `text-purple-600`
    - Icon size 20px.
  - **Content column** (flex-1):
    - Row 1: thread title in `font-semibold text-slate-900`, agent name in `text-xs text-slate-500` directly below.
    - Row 2 (margin-top 2): `statusLine` in `text-sm text-slate-700`.
    - Row 3 (margin-top 3, right-aligned): `view →` link in `text-xs text-purple-700`.

Stack the 4 cards with `space-y-3`.

### 2d. Two-column grid

The Home page wrapper becomes:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
  <ChatPanel />
  <StatusRail />
</div>
```

On `<lg`, rail drops below chat (or implement as horizontal scroll on tablet — optional polish, not required for v1 of this change).

---

## Part 3 — WhatsApp chip

Inside the chat panel, attached to the bottom (after the input field), render a single horizontal bar:

```tsx
<a
  href="https://wa.me/919987654321?text=Hi%20Krishan"
  target="_blank"
  rel="noreferrer"
  className="flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 border-t border-green-200 transition"
>
  <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
  <span className="text-sm text-slate-800 flex-1">
    Chat with Krishan on WhatsApp — <span className="font-medium">+91 99876 54321</span>
  </span>
  <ChevronRight className="w-4 h-4 text-slate-500" />
</a>
```

**WhatsApp icon.** Create `src/components/icons/WhatsAppIcon.tsx` as a small wrapper around an inline SVG of the WhatsApp speech-bubble glyph. Use the standard public-domain WhatsApp SVG path (it's the standard speech-bubble-with-phone-receiver shape). If the trademark is a concern, fall back to `MessageCircle` from `lucide-react` filled with `#25D366` — that's acceptable for a prototype.

The chip should be the **last element inside the chat panel**, visually flush with the panel's bottom edge. Round the panel's bottom corners so the chip sits cleanly inside.

---

## Acceptance criteria

1. `grep -r "veera" src/` returns zero results (case-insensitive).
2. Home page renders the new two-column layout on desktop.
3. The chat panel contains: header → Krishan opener → 4 inline agent action bubbles → suggested chips → input → WhatsApp chip. No priority-action card row above.
4. Each inline-action bubble's CTA button deep-links to the correct agent office + sub-tab.
5. Status rail on the right shows 4 cards with the correct icons (amber `AlertTriangle`, green `CheckCircle2`, purple `BarChart3`, amber `AlertTriangle`).
6. Clicking any status card deep-links to the matching agent office + sub-tab.
7. WhatsApp chip is at the bottom of the chat panel with the WA icon, the placeholder number, and opens `wa.me` in a new tab.
8. On mobile (`<lg`), the status rail moves below the chat (or scrolls horizontally — either acceptable).
9. Cashfree design tokens preserved throughout — no brutalist patterns introduced.
10. No console errors; type-checks pass.

---

**Apply Part 1 (rename) first** and verify nothing breaks before starting Parts 2 and 3.
