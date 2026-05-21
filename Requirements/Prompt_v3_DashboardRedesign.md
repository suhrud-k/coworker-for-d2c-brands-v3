# Cursor prompt — Generate CoWorker v3 (chat-first dashboard with AI finance team)

**Context.** The CEO reviewed v2 and rejected the multi-page IA. v3 reframes CoWorker as a **chat-first product with an AI finance team**: one AI CFO and four reporting AI agents, each with a real email identity at the merchant's domain, threshold-based autonomy, and their own "office" inside Manage my team. The full team charter and access model is in `/Users/suhrud.k/Desktop/CoWorker_by_Cashfree/Cashfree CoWorker/CoWorker_AI_Team_JobProfiles_v1.md` — read that document before starting; it is the source of truth for what each role does, KRAs, autonomy, accesses, and the contents of each agent's office.

**Goal.** Build v3 as a **new, separate** Vite + React + TS + Tailwind project at `coworker-for-d2c-brands_v3/` (sibling to `coworker-for-d2c-brands_v2/`). Reuse v2 content where it maps cleanly — the existing screens (Reconciliation, Vendors, Returns & Recovery, Marketing Efficiency, Compliance, Channel Economics, Reports, Cash) move under the relevant agent's office. Do **not** modify the v2 codebase.

**Output structure.** A standalone Vite app that runs with `npm install && npm run dev`. Single-file `App.tsx` is acceptable (same convention as v2) or modular per-screen files — either is fine, but keep the design tokens centralised in `index.css`.

---

## Phase 0 — Project setup

1. Create the new folder `coworker-for-d2c-brands_v3/` as a sibling of `coworker-for-d2c-brands_v2/`.
2. Scaffold a Vite + React + TS project (`npm create vite@latest`). Install Tailwind, `lucide-react`, `recharts`, `motion/react` (same dependency list as v2).
3. Copy `index.css` and `tailwind.config.js` from v2 verbatim. The Cashfree design tokens — purple `#6930CA`, dark navy `#130851`, light lilac `#CFB8F5`, plus the slate/gray neutrals — must carry over identically.
4. Copy from v2 → v3:
   - `src/data/vendorsMockData.ts` (and any other mock-data files)
   - Shared primitives if they exist as separate files: `Card`, `SectionHeader`, `StatusPill`, `DeltaArrow`, the chart wrappers
   - Icon set
5. Do **not** copy `App.tsx` or page components from v2 — v3 has a different IA. Page contents from v2 will be ported screen-by-screen into agent offices in Phase 4.
6. Delete any reference image that previously caused the brutalist aesthetic (`src/assets/images/bold_brutalist_ui_sample_*.png` if present).

---

## Phase 1 — Three-tab shell

Build the app shell first. This is the structural shift the CEO asked for.

**Layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│  [☰] CoWorker for D2C                            [search] [user]  │   <- top bar (h-14)
├──────┬────────────────────────────────────────────────────────────┤
│ 🏠   │                                                            │
│ 🔌   │                                                            │
│ 👥   │                  main content area                         │
│      │                                                            │
│ [<]  │                                                            │
└──────┴────────────────────────────────────────────────────────────┘
```

- **Left sidebar.** Three nav items: **Home** (chat icon), **Connections** (plug icon), **Manage my team** (users icon). Width 220px when expanded, 56px when collapsed (icon-only). Collapse toggle at the bottom. Active item: navy `#130851` background + white icon and label. Hover: light lilac `#CFB8F5/30%`. Persist collapsed state in `localStorage`.
- **Top bar.** Brand mark on the left (after sidebar), search field in the centre ("Ask CoWorker — try '@priya schedule the A1 payment'"), avatar/user menu on the right. Height 56px. Sticky.
- **Main content.** Below the top bar, scrollable. Padding `p-8`.
- **Routing.** State-driven (no React Router). Top-level `Tab = 'home' | 'connections' | 'team'`. For the team tab, a secondary state `TeamView = 'roster' | 'agent' | 'policies' | 'counterparts' | 'contacts' | 'activity' | 'escalations'` and an `AgentId = 'veera' | 'priya' | 'rohan' | 'maya' | 'ankita'`.

**Default route:** `home`.

---

## Phase 2 — Home tab (chat-first)

Home is the most important screen. The CEO's instruction: "one clean chat interface with a collapsible left bar."

**Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│  Good morning, Founder.                                          │
│  Veera's morning brief is ready. 3 items need you today.         │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Approve 3 vendor │  │ Review Maya's    │  │ Sign off       │  │
│  │ payments         │  │ reallocation     │  │ GSTR-3B for    │  │
│  │ ₹2.4L • Priya    │  │ ₹3.8L/wk • Maya  │  │ Apr 2026       │  │
│  │ [Review]         │  │ [Open simulator] │  │ [Open]         │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  💬  Chat with your team                                   │  │
│  │                                                            │  │
│  │  Veera (AI CFO): Cash position ₹1.42 cr. Runway 11.2 wks.  │  │
│  │  3 items need your call today — see cards above.            │  │
│  │                                                            │  │
│  │  [Suggested prompts]                                       │  │
│  │  • What's our blended MER this week?                       │  │
│  │  • Show me unreconciled items over ₹50k                    │  │
│  │  • What's pending with Ankita this week?                   │  │
│  │                                                            │  │
│  │  [Type your message…                                  ] →  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Greeting line.** "Good morning, Founder." + a single-sentence summary from Veera ("3 items need you today"). Time-aware (morning/afternoon/evening).

**Priority action cards.** Up to 4. Each card:
- Compact (one column on mobile, four-column row on desktop, equal width)
- Title (action verb): "Approve 3 vendor payments", "Review reallocation", "Sign off GSTR-3B", "Verify recovered claim"
- Sub-line: ₹ amount + agent name + status pill
- Primary CTA button (`btn-primary` style, Cashfree purple)
- Click → opens the relevant agent's office, pre-scoped to that task

Hard-code 3–4 sample cards for the prototype:
1. **Approve 3 vendor payments** · ₹2,42,000 · Priya · `Awaiting CFO`
2. **Review Maya's reallocation** · ₹3.8L/wk · Maya · `Recommendation ready`
3. **Sign off GSTR-3B for Apr 2026** · Ankita · `Due in 3 days`
4. **Verify recovered claim — Flipkart** · ₹68,400 · Rohan · `Resolved, review`

**Chat panel.** Below the cards.
- Header: "Chat with your team" + small avatars of the 5 agents.
- Opening message from Veera (canned).
- Suggested prompts — 4 chips, page-aware (Home → CFO-style questions).
- Input field at the bottom + send button.
- Match-and-respond against a canned response library (port `CannedResponse[]` from v2's `Prompt_AskCoWorker_PageAwareness.md` and extend it with team-routing logic: a query about vendors routes to Priya's voice, ad spend to Maya's, etc.).
- Each response includes the responding agent's name and avatar.
- When the user types `@veera`, `@priya`, etc., scope the response to that agent.

---

## Phase 3 — Connections tab

Port v2's Connections page wholesale. Five sub-categories shown as clickable cards: **Marketplaces**, **Banks**, **PGs**, **Accounting**, **Ad Platforms**. Each opens a sub-view listing connectors with status pills (Connected / Syncing / Error / Not connected).

Keep the design rules from `Prompt_Connections_Redesign.md`:
- Marketplaces section shows only marketplaces (Amazon, Flipkart, Myntra, Meesho, Shopify, the merchant's own D2C site)
- Banks shows banks (via Account Aggregator)
- PGs shows Cashfree + any others
- Accounting shows Tally, Zoho Books, QuickBooks
- Ad Platforms shows Meta, Google Ads, Amazon Ads, TikTok (OAuth flow)

No content changes from v2 — just port and re-wrap in v3's shell.

---

## Phase 4 — Manage my team

This is the **new** tab and the most important addition.

### 4a — Team roster (default view)

```
┌──────────────────────────────────────────────────────────────────┐
│  My team                                                         │
│  ⚙️ Policies • 👤 Counterparts • 📇 Contacts • 📜 Activity • ⚠️ Escalations │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐        │
│  │  🟣  Veera               │  │  🟢  Priya               │       │
│  │      AI CFO              │  │      Vendor Management   │       │
│  │  veera.cw@brand.com      │  │  priya.cw@brand.com      │       │
│  │                          │  │                          │       │
│  │  Today: 12 actions       │  │  Today: 34 actions       │       │
│  │  • Drafted Mon brief     │  │  • Paid 8 vendors        │       │
│  │  • 2 escalations open    │  │  • Flagged A1 anomaly    │       │
│  │                          │  │                          │       │
│  │  [Enter office →]        │  │  [Enter office →]        │       │
│  └─────────────────────────┘  └─────────────────────────┘        │
│  … 3 more cards for Rohan, Maya, Ankita …                        │
└──────────────────────────────────────────────────────────────────┘
```

Each card shows: circular avatar (coloured initial), name, role, primary email, today's action count, last 2–3 actions in plain language, status badge if anything's blocked, primary CTA "Enter office".

**Avatar colours:** Veera → purple `#6930CA`, Priya → emerald `#10B981`, Rohan → blue `#2563EB`, Maya → orange `#F59E0B`, Ankita → rose `#E11D48`. Initial letter in white on the coloured disc.

**Above the roster**, a horizontal nav strip with the 5 team-level surfaces: Policies & Thresholds, Human counterparts, External contacts, Activity stream, Escalations. Each opens the corresponding view (sections 4c–4g below).

### 4b — Agent office (the drill-down)

Click any roster card → enter that agent's office. URL state: `tab='team'`, `view='agent'`, `agentId=<id>`.

**Office shell** (consistent across agents):

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to team                                                  │
│  🟣  Veera · AI CFO · veera.cw@brand.com · 🟢 Active             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Brief | Cash | Statements | BvA | Channels | Reports | Esc.  │ │  ← office tabs
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│            < office content for the selected tab >               │
│                                                                  │
│  [💬 Ask Veera]   <- floating chat trigger, bottom-right         │
└──────────────────────────────────────────────────────────────────┘
```

The office tab strip differs per agent. **Use the "Office contents" list in each agent's job profile** (in `CoWorker_AI_Team_JobProfiles_v1.md`) as the source of truth for which tabs each office has.

**Office contents — what to build per agent:**

| Agent | Office tabs (left → right) | Content source |
|---|---|---|
| **Veera (CFO)** | Brief · Cash · Statements · BvA · Channels · Reports · Escalations | Port content from v2 Home brief, Cash, Reports, ChannelEconomics screens; add new BvA + Escalations Queue + Founder Brief screens |
| **Priya (Vendors)** | Master · AP Aging · Exceptions · Payment Runs · Inbox · MSME · TDS Register | Port v2 Vendors screen (per `Prompt_Vendors_NewSection.md` and `Prompt_VendorAnomaly_and_JargonChat.md`) and break into these sub-tabs |
| **Rohan (Recon)** | Cockpit · Returns & Recovery · Claims · COD · Aging | Port v2 Reconciliation (per `AIStudio_Prompt_Reconciliation_Redesign.md`) and Returns & Recovery (per `Prompt_ReturnsRecovery_Redesign.md`) |
| **Maya (Marketing)** | Dashboard · Reallocation · Attribution · Burn list · Digest · Auto-pause log | Port v2 Marketing Efficiency (per `Prompt_MarketingEfficiency_Redesign.md`) |
| **Ankita (Compliance)** | Calendar · GST · TDS · TCS · MSME · Notices · Repository | Port v2 Compliance (per `Prompt_Compliance_Redesign.md`) |

**Demo priority.** For the first build, fully populate **Veera's office** and **Priya's office** end-to-end (every tab has real content). For Rohan / Maya / Ankita, render the office shell + tab strip, but it's acceptable for some tabs to be skeletons with a placeholder ("Detailed view coming in next iteration"). The shell + tab strip + Cashfree design language must be solid for all five.

**Ask <agent> button.** Bottom-right floating button on every office. Click → opens the chat overlay scoped to that agent (so suggested chips and responses are agent-specific).

### 4c — Policies & Thresholds

The screen where the founder configures each agent's autonomy bands.

Layout: vertical list, one card per agent. Each card has the agent header (avatar + name) and a set of sliders/inputs for that agent's specific thresholds:

- **Priya:** Auto-pay ceiling for known vendors (₹50k default) · CFO approval band (₹50k–₹5L) · Founder approval ceiling (₹5L) · MSME-priority window (Day 40 default)
- **Rohan:** Claim auto-file unit value (₹50k default) · Auto-write-off limit (₹10k) · CFO write-off band (₹10k–₹1L) · Marketplace SPOC chase frequency (every 3 days default)
- **Maya:** Auto-pause negative-CM days (7 default) · Auto-pause campaign spend limit (₹X/wk) · Within-group reallocation autonomy (10% default) · Brand-defence campaigns are always-protected (toggle)
- **Ankita:** Auto-file GSTR-1 (toggle, default ON) · Vendor 2B mismatch poke frequency (weekly default) · CA sign-off required on (multi-select: 3B, 9, notices)
- **Veera:** Founder approval ceiling for any payment (₹5L default) · Brief send time (08:00 default) · Brief format (concise / full)

Each threshold has a slider + a numeric input + a "Save" CTA. Show a versioned change log below the cards ("Suhrud raised Priya's auto-pay ceiling from ₹50k to ₹75k on 2026-05-18").

### 4d — Human counterparts

A table:

| Agent | Counterpart (CC'd) | Email | Digest mode |
|---|---|---|---|
| Veera | Founder | founder@brand.com | Off (every email) |
| Priya | AP person | ops.ap@brand.com | Off |
| Rohan | Finance/ops lead | finance.lead@brand.com | Daily digest |
| Maya | Growth lead | growth.lead@brand.com | Off |
| Ankita | Head of finance | finance.head@brand.com | Off |

Each row editable inline (change email, toggle digest mode).

### 4e — External contacts

Cards for the merchant's CA, statutory auditor, banker, marketplace category SPOCs. Each card: name, email, role, scope of approvals, last interaction. Add new contact CTA. Pre-populate with one sample CA contact ("CA Rajesh Mehta · ca@mehtaassociates.in · GSTR-3B/9 sign-off + notices").

### 4f — Activity stream

Chronological log across all five agents. Each row: timestamp, agent avatar + name, action verb, ₹ value (where applicable), status. Filters at the top: agent (multi-select), action type (email / payment / filing / claim / alert), ₹ range, time window (24h / 7d / 30d).

Pre-populate with 25–30 realistic entries spanning the last 7 days. Example rows:
- `Today 09:14 · Priya · Sent chase email to A1 Packaging · Awaiting reply`
- `Today 08:00 · Veera · Founder Brief sent · Read`
- `Yesterday 17:42 · Rohan · Filed claim #FK-2398 · ₹68,400 · Submitted`
- `Yesterday 14:08 · Maya · Auto-paused campaign "Summer Prospecting #4" · CM −₹4,200/day for 8 days`
- `Yesterday 11:15 · Ankita · Reconciled 26AS · ₹2,14,000 TDS · Match`

### 4g — Escalations

The cross-agent queue rolled up from Veera. Each card: source agent, action requested, ₹ value, blocker, days waiting, primary CTA (Approve / Reject / Ask more). Pre-populate with 3–4 typed escalations matching the priority cards on Home.

---

## Phase 5 — Page-aware chat (Ask CoWorker)

The chat is the primary interaction. Implement once, surface in two places: the Home tab (main panel) and as a floating overlay from every agent office.

**Mechanics:**

- Maintain a `CannedResponse[]` library with `match: RegExp[]`, `agent: AgentId`, `body: string | JSX`, `chips?: string[]`, `pages?: ('home' | 'office:veera' | 'office:priya' | ...)[]`. Port from `Prompt_AskCoWorker_PageAwareness.md` (39 unique responses) and extend.
- Page awareness: filter the suggested chip set by current `page` context. From Veera's office, chips skew CFO-style. From Priya's office, chips skew vendor/AP.
- @-mention routing: if the user starts with `@veera`, `@priya`, `@rohan`, `@maya`, `@ankita`, scope responses to that agent regardless of current page.
- Jargon explanation: include the 25 jargon entries from `Prompt_VendorAnomaly_and_JargonChat.md` with `kind: 'jargon'`. Tie-breaker: queries starting with "what is", "explain", or "define" prefer `kind: 'jargon'`.
- Fallback message: "I don't have a canned answer for that yet — I'll log it and Veera will follow up in the next brief."

Each response is rendered with the responding agent's avatar and name in the bubble.

---

## Phase 6 — Design language (Cashfree, not brutalist)

**Hard rules — non-negotiable.** Many v2 page components fell into a brutalist editorial aesthetic. Do not repeat this in v3.

| Aspect | Required | Forbidden |
|---|---|---|
| Font family | Inter (sans) | `font-serif`, `font-mono` |
| Italic body text | Never (titles included) | Any italics in headers, labels, captions |
| Title weight | `font-semibold` or `font-bold` (max) | `font-black`, all-caps tracking-[0.3em] microcopy |
| Card radius | `rounded-xl` (12px), max `rounded-2xl` (16px) | `rounded-[40px]`, `rounded-full` on cards |
| Brand colours | Purple `#6930CA`, navy `#130851`, lilac `#CFB8F5`, neutral slate/gray | Loud reds, brutalist black-on-yellow, gradient overload |
| Microcopy | Plain English: "Run reconciliation", "Pending review", "Recommendation ready" | "Protocol", "Intel", "Terminal", "Operative", "Briefing" |
| Status pills | Subtle backgrounds (`bg-emerald-50` text-`text-emerald-700`, etc.) | High-contrast inverted "BRUTAL STATUS" badges |
| Buttons | Outlined or solid Cashfree-purple, consistent height (h-9 / h-10) | Buttons with white text on white background (the v2 ad-profit bug) |
| Spacing | `gap-4`, `gap-6`, `p-6`, `p-8` — generous and consistent | Edge-to-edge dense brutalist grids |

**Primitives.** Reuse `Card`, `SectionHeader`, `StatusPill`, `DeltaArrow` from v2 verbatim. If `StatusPill` has the `info` variant bug (referencing `bg-primary-50` which doesn't exist), correct it to `bg-purple-50` text-`text-purple-700`.

**Icons.** `lucide-react` only. Do not redefine `Sparkles` as a tilted Plug (the v2 bug) — import it from `lucide-react`. If a needed icon isn't in `lucide-react`, use the closest match rather than fabricating SVG.

---

## Phase 7 — Mock data

**Reuse from v2.** Copy `vendorsMockData.ts` verbatim. The A1 Packaging anomaly stays (3× invoice spike vs 12% order growth).

**Add for v3.**
- `src/data/agentsMockData.ts` — the 5 agents with avatars, today's action counts, last 2–3 actions, status.
- `src/data/policiesMockData.ts` — default threshold values per agent and a change log of 3–4 sample edits.
- `src/data/counterpartsMockData.ts` — the 5-row counterparts table.
- `src/data/contactsMockData.ts` — 3–4 external contacts (CA, auditor, banker).
- `src/data/activityMockData.ts` — 25–30 activity-stream entries spanning 7 days.
- `src/data/escalationsMockData.ts` — 3–4 typed escalation cards aligned with the priority actions on Home.
- `src/data/cannedResponses.ts` — port + extend the canned-response library; each entry has `match`, `agent`, `body`, `chips`, `pages`, `kind`.

All ₹ numbers should be realistic for a ₹4–6 cr/month GMV D2C brand (small-to-mid D2C scale).

---

## Phase 8 — Type model (drop-in)

```ts
type Tab = 'home' | 'connections' | 'team';
type TeamView = 'roster' | 'agent' | 'policies' | 'counterparts' | 'contacts' | 'activity' | 'escalations';
type AgentId = 'veera' | 'priya' | 'rohan' | 'maya' | 'ankita';

type Agent = {
  id: AgentId;
  name: string;
  role: string;
  email: string;        // e.g. 'veera.cw@brandname.com'
  avatarBg: string;     // tailwind class
  status: 'active' | 'awaiting' | 'escalated' | 'paused';
  todayActionCount: number;
  recentActions: { ts: string; verb: string; meta?: string }[];
};

type Threshold = {
  agentId: AgentId;
  key: string;          // e.g. 'autoPayCeiling'
  label: string;
  unit: '₹' | '%' | 'days' | 'time' | 'toggle' | 'multi';
  value: number | string | boolean | string[];
  min?: number; max?: number; step?: number;
};

type Counterpart = {
  agentId: AgentId;
  name: string;
  email: string;
  digestMode: 'off' | 'daily' | 'weekly';
};

type ExternalContact = {
  id: string;
  name: string;
  role: string;        // e.g. 'CA', 'Statutory Auditor'
  email: string;
  scope: string[];     // e.g. ['GSTR-3B sign-off', 'Notices']
  lastInteraction?: string;
};

type ActivityEntry = {
  ts: string;
  agentId: AgentId;
  verb: string;
  meta?: string;
  amount?: number;
  status: 'done' | 'pending' | 'awaiting-reply' | 'rejected';
};

type Escalation = {
  id: string;
  fromAgent: AgentId;
  title: string;
  amount?: number;
  reason: string;
  daysWaiting: number;
  proposedAction: 'approve' | 'reject' | 'discuss';
};

type CannedResponse = {
  match: RegExp[];
  agentId: AgentId;
  body: string;            // markdown-ish; render with basic formatting
  chips?: string[];
  pages?: ('home' | `office:${AgentId}`)[];
  kind?: 'data' | 'jargon';
};
```

---

## Acceptance criteria (demo-ready)

The build is ready when all of the following are true:

1. App boots with `npm run dev` and renders without console errors.
2. Sidebar collapses and re-expands; collapsed state persists across reload.
3. Home tab shows the greeting line, 3–4 priority cards, and a working chat panel with at least 8 canned responses across the 5 agents.
4. Connections tab renders all 5 sub-category cards, each clickable to a sub-view.
5. Manage my team default view renders the 5 roster cards, each clickable into its office.
6. Veera's and Priya's offices are fully built end-to-end (every tab in their tab strip has real content).
7. Rohan, Maya, Ankita offices render the office shell + tab strip with at least one tab populated each; remaining tabs may be skeleton.
8. Policies & Thresholds page renders one card per agent with editable sliders/inputs for at least 3 thresholds per agent, and a versioned change log.
9. Human counterparts table renders and is inline-editable.
10. External contacts shows the sample CA card + Add New CTA.
11. Activity stream shows 25+ entries with filters working.
12. Escalations shows 3+ typed cards.
13. Ask CoWorker overlay opens from every agent office, pre-scoped to that agent.
14. Zero brutalist patterns (font-serif italic, rounded-[40px], "Protocol/Intel/Terminal" microcopy, font-black tracking-[0.3em]).
15. Cashfree colours (`#6930CA`, `#130851`, `#CFB8F5`) applied consistently. No invisible buttons. No undefined Tailwind tokens.
16. Sparkles and other icons imported from `lucide-react`, not hand-rolled.

---

## Build order (suggested)

If you can't complete everything in one pass, build in this order:

1. Phase 0 (setup) + Phase 1 (shell) + Phase 6 (design rules wired in) → app boots, sidebar works, design language locked
2. Phase 4a (team roster) + Phase 4b (office shell, all 5 stubbed) + Phase 4c (Policies) → the new IA is visible
3. Phase 2 (Home) + Phase 5 (chat) → the chat-first promise is delivered
4. Phase 4b deep — Veera's office full content → the CFO experience is complete
5. Phase 4b deep — Priya's office full content → vendor experience is complete
6. Phase 3 (Connections port)
7. Phase 4d–4g (counterparts, contacts, activity, escalations)
8. Phase 4b — remaining offices (Rohan, Maya, Ankita) deepened from skeleton

Each phase should leave the app in a runnable, demo-able state.

---

## Reference documents (already in `coworker-for-d2c-brands_v2/Requirements/`)

Read these before/while building — they contain the design specifications for content that lives inside agent offices:

- `../../CoWorker_AI_Team_JobProfiles_v1.md` (in project root, **the source of truth for v3's IA**)
- `AIStudio_Prompt_Reconciliation_Redesign.md` (→ Rohan's Cockpit tab)
- `Prompt_Vendors_NewSection.md` + `Prompt_VendorAnomaly_and_JargonChat.md` (→ Priya's office + jargon chat)
- `Prompt_HomePage_Summary_and_CTAs.md` (→ Home priority cards format)
- `Prompt_ChannelEconomics_Redesign.md` (→ Veera's Channels tab)
- `Prompt_ReturnsRecovery_Redesign.md` (→ Rohan's Returns & Recovery tab)
- `Prompt_Reports_Redesign.md` (→ Veera's Reports tab)
- `Prompt_Compliance_Redesign.md` (→ Ankita's office)
- `Prompt_Connections_Redesign.md` (→ Connections tab)
- `Prompt_MarketingEfficiency_Redesign.md` (→ Maya's office)
- `Prompt_AskCoWorker_PageAwareness.md` (→ canned response library structure)
- `AIStudio_Prompt_Cashfree_DesignLanguage_Fix.md` (→ design-language enforcement, the find-and-replace table)

These were written for v2's IA but the content/design specs they contain port directly into v3's office structure.

---

**Begin with Phase 0 and confirm the shell is rendering before moving to content. Stop and ask if anything in the team structure (5 roles, autonomy model, office contents) is ambiguous — don't guess.**
