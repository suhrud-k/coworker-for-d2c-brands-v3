# Cursor Prompt: Connections page — category tabs, correct grouping, Manage modal, Add new flow

Reshape the `ConnectionsScreen` component in `src/App.tsx` (currently around line 467). Add four clickable category tabs, regroup the connection cards correctly under each category, wire the "Manage" button to a modal with real actions, and rebuild the "Add Connection" flow so it shows the unconnected marketplaces (Meesho, Zepto) with username/password login.

No rename. Sidebar label, route key, and component name all stay as **"Connections"** / `'connections'` / `ConnectionsScreen`.

---

## 1. PAGE STRUCTURE (top to bottom)

```
SectionHeader: "Connections" + "+ Add Connection" button on right
  ↓
Category filter tabs: All · Marketplaces · Banks · PGs · Accounting (all clickable, stateful)
  ↓
Grid of connection cards (filtered by selected tab)
  ↓
[Manage modal — opens from Manage button on any card]
[Add Connection modal — opens from + Add Connection button or from the "+ Add" tile in the grid]
```

State to add: `selectedCategory: 'all' | 'marketplaces' | 'banks' | 'pgs' | 'accounting'`. Default = `'all'`.

---

## 2. CATEGORY FILTER TABS

A row of 6 clickable pills below the SectionHeader. Each tab shows the count of connections in that category in parentheses.

| Tab | Count source |
|---|---|
| All | total = 12 |
| Marketplaces (4) | Amazon, Flipkart, Myntra, Shopify |
| Banks (2) | HDFC, Axis |
| PGs (2) | Cashfree, Razorpay |
| Ad Platforms (3) | Meta Ads, Google Ads, Amazon Ads |
| Accounting (1) | Tally |

Active tab styling: `bg-purple-50 text-primary font-semibold` + 2 px `border-b-2 border-primary` underneath. Inactive: `text-gray-500 hover:text-gray-900`. Same pattern used in Reconciliation tabs.

Clicking a tab updates `selectedCategory` and re-filters the card grid below. Clicking "All" shows everything grouped by category with section headings.

---

## 3. CONNECTION DATA — the correct set

Replace the current `connections` array with this complete set (regrouped):

```ts
const connections = [
  // Marketplaces
  { name: 'Amazon India',  category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:12 PM',  type: 'Marketplace', authMethod: 'API key' },
  { name: 'Flipkart',      category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:08 PM',  type: 'Marketplace', authMethod: 'Username/password' },
  { name: 'Myntra',        category: 'marketplaces', status: 'error',     lastSync: 'May 16, 2:12 PM',  type: 'Marketplace', authMethod: 'API key' },
  { name: 'Shopify Store', category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:10 PM',  type: 'Own store',   authMethod: 'OAuth' },

  // Banks
  { name: 'HDFC Bank',     category: 'banks', status: 'connected', lastSync: 'May 18, 4:00 PM', type: 'Current account · ··2847', authMethod: 'Account aggregator' },
  { name: 'Axis Bank',     category: 'banks', status: 'connected', lastSync: 'May 18, 3:55 PM', type: 'Current account · ··5621', authMethod: 'Account aggregator' },

  // Payment Gateways
  { name: 'Cashfree',      category: 'pgs', status: 'connected', lastSync: 'Just now', type: 'Native · auto-linked', authMethod: 'Native' },
  { name: 'Razorpay',      category: 'pgs', status: 'connected', lastSync: 'May 18, 4:02 PM', type: 'PG settlements', authMethod: 'API key' },

  // Ad Platforms
  { name: 'Meta Ads',      category: 'ad_platforms', status: 'connected', lastSync: 'May 18, 4:05 PM', type: 'Facebook + Instagram · Business Manager',     authMethod: 'OAuth (Facebook)' },
  { name: 'Google Ads',    category: 'ad_platforms', status: 'connected', lastSync: 'May 18, 4:01 PM', type: 'Search + YouTube + Display · MCC linked',     authMethod: 'OAuth (Google)' },
  { name: 'Amazon Ads',    category: 'ad_platforms', status: 'connected', lastSync: 'May 18, 2:48 PM', type: 'Sponsored Products + Brands + Display',       authMethod: 'OAuth (Login with Amazon)' },

  // Accounting
  { name: 'Tally Prime',   category: 'accounting', status: 'connected', lastSync: 'May 18, 3:30 PM', type: 'On-prem via Tally plugin', authMethod: 'Tally connector' },
];
```

**Notes on what's NOT in the grid:**

- **Marketplace PLA spend** (Flipkart PLA, Myntra Ads, Meesho Ads, etc.) is **not** a separate connector. These platforms don't expose proper ad-management APIs, so CoWorker derives marketplace PLA spend from the settlement deduction line items in the existing marketplace connections (Flipkart, Myntra, Meesho). No additional auth required — the data is already flowing through the marketplace integrations.
- The misplaced **HDFC Bank under marketplaces** in the current code is removed (correctly placed under Banks).

---

## 4. CONNECTION CARD

Use the `<Card>` primitive. Card structure:

```
┌─────────────────────────────────────────┐
│ [Logo placeholder · 40 px]  [Status pill] │
│                                         │
│  Connection name (16 px font-semibold)  │
│  Type · last sync (12 px gray-500)      │
│                                         │
│  Auth method: API key                   │
│                                         │
│  [    Manage    ]                       │
└─────────────────────────────────────────┘
```

- **Logo placeholder**: 40 × 40, `rounded-[8px] bg-gray-100`, with the first two characters of the connection name in 14 px `font-semibold text-gray-400` centered.
- **Status pill**: top-right corner.
  - `connected` → `<StatusPill status="success" text="Connected">`
  - `error` → `<StatusPill status="error" text="Action needed">`
  - `disconnected` → `<StatusPill status="slate" text="Disconnected">`
- **Auth method**: small 12 px gray-500 line, label "Auth: {authMethod}".
- **Manage button**: `btn-secondary` full-width at the bottom of the card. For `disconnected` status, the button changes to `btn-primary` "Connect".
- **Cashfree-specific note**: for the Cashfree card only, show a small `bg-purple-50` strip above the Manage button reading "Auto-linked to your Cashfree merchant account — no setup needed."

Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

**"All" view**: group cards by category with a section heading above each group (`text-[14px] font-medium uppercase tracking-wider text-gray-500 mt-8 mb-3`). When a specific tab is selected, no grouping — just the cards.

**"+ Add" tile**: as the last card in the grid (or last card per category in All view), render an empty dashed-border tile labelled "+ Add connection". Clicking it opens the Add Connection modal pre-filtered to the active category.

---

## 5. MANAGE MODAL — opens from "Manage" button on any card

Centred modal, 600 px wide, white bg, `rounded-[12px]`, padding 32 px. Open/close with smooth fade + scale animation.

### 5.1 Header

- Logo placeholder (48 px) + connection name (20 px font-semibold navy-950) + status pill.
- Close button (`X` icon, top-right).

### 5.2 Body — three sections, separated by `border-t border-gray-100`

**Section A — Connection details**

A two-column key-value list:

| Label | Value |
|---|---|
| Status | Connected since May 14, 2026 |
| Authentication | API key (last rotated 8 days ago) |
| Last sync | 2 min ago · 218 records pulled |
| Next sync | In 13 min (auto · every 15 min) |

For bank cards, add: Account number `··2847`, IFSC `HDFC0001234`.
For PG cards, add: Merchant ID `CF_M_92847`.
For Tally, add: Tally instance host, Plugin version.

**Section B — Sync configuration**

What's syncing — multi-checkbox row depending on connection type:

| Connection type | Sync options (checkboxes, all checked by default) |
|---|---|
| Marketplace | Orders · Settlements · Returns · Inventory · Ad spend (if applicable) |
| Bank | Daily statements · Transaction-level pulls |
| PG | Settlement batches · Transaction-level data |
| Accounting (Tally) | Chart of Accounts · Ledgers · Vouchers |

Sync frequency dropdown: Every 15 min (default for marketplaces and PGs) / Hourly / Daily.

Changes here are not actually persisted in V1 — just stateful within the modal.

**Section C — Actions**

Four buttons in a row, right-aligned:

- **Sync now** (`btn-primary`) — clicking simulates a 1.2 s spinner with sub-text "Pulling Amazon settlements…" then closes with a success toast "Sync complete · 42 new records".
- **Test connection** (`btn-secondary`) — 800 ms processing → "Connection test passed ✓".
- **View sync history** (`btn-tertiary`) — opens a small inline panel below showing the last 5 syncs with timestamps and record counts (V1: hard-coded list, no real history).
- **Edit credentials** (`btn-tertiary`) — slides in a small inline form to re-enter the auth credentials.

### 5.3 Footer — disconnect

Below the action row, separated by `border-t border-gray-100`, a single `btn-destructive` "Disconnect this source". Clicking opens a confirmation: "Disconnecting Amazon India will stop syncing orders, settlements, and returns. Reports that reference Amazon data may have stale numbers until you reconnect. Are you sure?" with `[Cancel] [Yes, disconnect]` buttons. For Cashfree specifically, this button is disabled with a tooltip "Cashfree is auto-linked and can't be disconnected from CoWorker."

---

## 6. ADD CONNECTION MODAL — opens from "+ Add Connection" or the "+ Add" tile

Same modal shell as Manage (600 px wide, centred, smooth open). A 3-step wizard with a small numbered stepper at the top of the modal (1 — 2 — 3).

### 6.1 Step 1 — Choose provider

Title: "Connect a new source".

Below: a category-filtered list of unconnected providers as selectable cards. If the modal was opened from a category-filtered view, the matching category is pre-selected in a small chip row at the top of the step.

For V1, populate **two unconnected marketplace providers**:

| Logo | Provider | Description |
|---|---|---|
| MS | **Meesho** | Reseller-focused marketplace · 1M+ sellers, 13.3M+ resellers |
| ZP | **Zepto** | Quick-commerce platform · 10-minute delivery |

For the other categories, you can also list a few unconnected providers (optional, for completeness):
- Banks (unconnected): ICICI Bank, Kotak Mahindra Bank
- PGs (unconnected): PayU, Easebuzz
- Ad Platforms (unconnected): LinkedIn Ads, Snapchat Ads
- Accounting (unconnected): Zoho Books

Clicking any provider card highlights it (`border-2 border-primary bg-purple-50`) and unlocks the "Next" button at the bottom of the modal.

### 6.2 Step 2 — Enter credentials

Title: "Sign in to {provider}".

The form fields depend on the provider's auth method:

- **Marketplaces (Meesho, Zepto)** — seller portal username + password (password input with show/hide toggle).
- **Ad platforms (Meta Ads, Google Ads, Amazon Ads)** — no form fields; instead, a single primary button **"Continue with {Facebook / Google / Amazon}"** that simulates an OAuth handshake (modal pretends to redirect, shows a 1.5 s "Connecting via OAuth…" state, returns success). Add a small line below: "We'll request read-only access to your ad accounts. You can revoke from your {Facebook / Google / Amazon} account settings at any time."
- **Banks (ICICI, Kotak)** — account number + IFSC + a "Continue to bank's site for OTP" CTA (simulated).
- **PGs (PayU, Easebuzz)** — API key + secret.
- **Accounting (Zoho Books)** — OAuth via Zoho.

For any of the above, below the form/CTA, show the security note: *"We use read-only access. Credentials are encrypted at rest and never reused. You can revoke any time."*

For credential-based flows (marketplaces, PGs), a **"Test connection"** `btn-secondary` button below the form. Clicking simulates a 1.2 s processing state with the spinner; on success, a green check appears next to the button and "Next" unlocks.

For OAuth flows (ad platforms, accounting, bank), success of the OAuth handshake itself unlocks "Next".

### 6.3 Step 3 — Choose what to sync

Title: "What should we pull from {provider}?"

The sync options depend on the provider type:

- **Marketplaces** — Orders · Settlements · Returns · Inventory levels · Ad spend (PLAs)
- **Ad platforms** — Campaigns · Ad sets · Daily spend · Conversions (by attribution window) · Audience insights
- **Banks** — Daily statements · Transaction-level pulls
- **PGs** — Settlement batches · Transaction-level data
- **Accounting** — Chart of Accounts · Ledgers · Vouchers

All checkboxes pre-checked.

Plus a sync frequency dropdown (default "Every 15 minutes").

A primary "**Finish setup**" button at the bottom. Clicking simulates a 1 s "Setting up Meesho connection…" state and closes the modal with a success toast: "Meesho connected · first sync starts in a few seconds. View in dashboard →" (the link in the toast routes back to Connections with the new card visible in the grid).

### 6.4 Stepper behaviour

- Steps 1 → 2 → 3 navigate only after each step is valid (provider picked / connection tested / at least one sync option checked).
- A "Back" link in the bottom-left of each step (steps 2 and 3 only) takes the user to the previous step without losing state.
- Closing the modal mid-flow with the X button discards the state and shows a confirmation: "Discard new connection setup?"

---

## 7. INTERACTIVITY — ACCEPTANCE CRITERIA

Every control must be wired:

- **Category tabs** at the top: clicking changes `selectedCategory` state, re-filters the grid. The "(N)" count updates dynamically based on the data.
- **"+ Add Connection" button** in the SectionHeader: opens the Add Connection modal with the current category pre-selected.
- **"+ Add" tile** at the end of the grid: same as above.
- **Card body click** (not the button): opens the Manage modal for that card.
- **Manage button**: opens the Manage modal.
- **All buttons inside the Manage modal**: Sync now / Test connection / View sync history / Edit credentials all simulate their respective processing states and show appropriate feedback.
- **Disconnect** in the Manage modal: opens a confirmation modal. "Yes, disconnect" simulates the action and closes both modals with a toast "Amazon India disconnected".
- **Add Connection modal stepper**: all three steps reachable; Next/Back buttons work; "Test connection" simulates with success state.
- **Finish setup**: closes the modal and adds the new connection to the grid (state update — push to the `connections` array).
- **Cashfree's Disconnect**: stays disabled with tooltip.

---

## 8. CASHFREE DESIGN LANGUAGE — DO NOT REINTRODUCE BRUTALIST PATTERNS

Same compliance rules as previous redesigns. After this change, the following grep within `ConnectionsScreen` and the new modal components must return zero matches:

```
font-serif | italic (except security note copy) | tracking-\[0\.3em\] | tracking-tighter |
rounded-\[40px\] | rounded-\[32px\] | rounded-\[28px\] | rounded-\[24px\] | rounded-\[20px\] |
text-indigo- | bg-indigo- | text-slate- | bg-slate- | text-navy-900 | bg-navy-900 |
font-black | Protocol | Intel | Terminal | Initialize | Execute Protocol
```

Use only shared primitives (`<Card>`, `<SectionHeader>`, `<StatusPill>`, `<InfoIcon>`), button classes (`btn-primary`, `btn-secondary`, `btn-tertiary`, `btn-destructive`), and the design tokens.

---

## 9. DELIVERABLE

A rewritten `ConnectionsScreen` component in `src/App.tsx` plus two new components inline or in `src/components/`: `<ManageConnectionModal />` and `<AddConnectionModal />`. The Tab type / route key / sidebar label remain unchanged.

Mock data can be inlined or extracted to `src/data/connectionsMockData.ts`. `npm run dev` must build cleanly with no TypeScript errors.

---

*The page is doing one job: showing the user every source of money-moving data CoWorker has access to, with an obvious next action for each. Connected sources should be glanceable; broken sources should pull the eye with a status pill; adding a new source should take 30 seconds. If a control on this page doesn't do one of those four things, it doesn't belong here.*

---

## 10. ASSUMPTIONS — flag for override

A few decisions I made on the user's behalf:

1. **Shopify stays under Marketplaces** even though it's strictly an "own store" not a marketplace. Alternative: create a fifth category "Own store" / "D2C". I went with the simpler 4-category structure the user explicitly named.
2. **Meta Ads is removed entirely** in V1 since the user didn't name an "Ad platforms" category. If ad platforms are needed, add a fifth category later.
3. **Tally appears as the only accounting connection.** Zoho Books is listed as unconnected (available to add). User can flip this.
4. **The unconnected-providers list per category** (Meesho, Zepto for marketplaces; ICICI, Kotak for banks; PayU, Easebuzz for PGs; Zoho Books for accounting) is editable — drop any not wanted.
5. **Manage modal CTAs** are a unified set (Sync now / Test / Sync history / Edit credentials / Disconnect). For PG-Cashfree, the Disconnect button is disabled with a tooltip. Alternative: build per-category Manage screens.
