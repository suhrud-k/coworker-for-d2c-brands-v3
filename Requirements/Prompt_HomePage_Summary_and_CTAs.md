# Prompt: Home Page — Summary text and action CTAs

Two changes to the Home page (`HomeScreen` in `src/App.tsx`). Surgical edits only — no other files touched.

---

## Change 1 — Weekly Performance Summary card: crisp text + primary CTA

The summary card at the top of the Home page must be tight and end with a clear, action-oriented CTA that deep-links to the page where the founder can actually fix the problem.

### Current state (before)

```tsx
<Card className="border-l-4 border-l-primary">
  <div className="flex items-center gap-2 mb-3">
    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
    <span className="text-[12px] font-medium uppercase tracking-wider text-gray-500">Weekly Performance Summary</span>
  </div>
  <p className="text-[18px] text-navy-950 leading-relaxed font-medium">
    Net performance yielded <span className="text-primary font-bold">₹62.4 L</span> this week on
    <span className="text-gray-400"> ₹4.18 cr GMV</span> —
    representing a <span className="text-error font-bold">14.9% margin</span>,
    compressed by 180 bps. <span className="underline decoration-error/20 underline-offset-4">Myntra logistics</span> remains the primary vulnerability.
  </p>
</Card>
```

### Required state (after)

```tsx
<Card className="border-l-4 border-l-primary">
  <div className="flex items-center gap-2 mb-3">
    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
    <span className="text-[12px] font-medium uppercase tracking-wider text-gray-500">Weekly Performance Summary</span>
  </div>
  <div className="flex items-end justify-between gap-6">
    <p className="text-[18px] text-navy-950 leading-relaxed font-medium flex-1">
      <span className="text-primary font-bold">₹62.4 L</span> net this week on
      <span className="text-gray-400"> ₹4.18 cr GMV</span> —
      <span className="text-error font-bold">14.9% margin</span>,
      down 180 bps WoW. <span className="underline decoration-error/20 underline-offset-4">Myntra</span> is the bleeder.
    </p>
    <button
      onClick={() => onNavigate('ads')}
      className="btn-primary shrink-0"
    >
      Fix Myntra ads
      <ArrowUpRight className="w-4 h-4" />
    </button>
  </div>
</Card>
```

### Rationale

- The original text reads like a financial report (`"Net performance yielded"`, `"representing a"`, `"compressed by"`, `"remains the primary vulnerability"`). The new text reads like a founder talking to a peer.
- Word count drops from ~26 to ~17 with zero data loss — every number (₹62.4 L, ₹4.18 Cr, 14.9%, −180 bps) is preserved.
- `"Myntra is the bleeder"` is the same phrasing used in the pitch deck (Slide 1) and the 1-pager — keeps the brand voice consistent across surfaces.
- The CTA deep-links to **Ad Profit** (`onNavigate('ads')`) — not to Channels P&L. Channels P&L is diagnostic only; Ad Profit is the page that contains the actionable lever (the "Execute Reallocation" button on the underperforming Myntra Sale Push campaign at 0.79× PoAS).

---

## Change 2 — Immediate Actions card: wire up CTAs to navigate

The three action cards in the **Immediate Actions** section currently have buttons that don't do anything. Each button should deep-link to the page where the action can actually be performed. One label also needs renaming.

### Current state (before)

```tsx
{[
  { title: 'Cut Myntra Ads by 30%', why: 'ROI burn > ₹4.20 per ₹1 margin.', act: 'Reallocate ad spend' },
  { title: 'File Flipkart claims', why: '₹3.84 L window closing in 6d.', act: 'Apply changes' },
  { title: 'Move ₹40 L Treasury', why: '5.8% yield vs idle account.', act: 'Review cash flow' },
].map((action, i) => (
  <div key={i} className="p-4 bg-gray-50 rounded-[8px] border border-gray-100 flex flex-col gap-3 group">
    <div>
      <div className="text-[13px] font-bold text-navy-950 uppercase tracking-wider">{action.title}</div>
      <div className="text-[12px] text-gray-500 mt-1">{action.why}</div>
    </div>
    <button className="btn-secondary w-full h-[32px] text-[12px]">{action.act}</button>
  </div>
))}
```

### Required state (after)

```tsx
{([
  { title: 'Cut Myntra Ads by 30%', why: 'ROI burn > ₹4.20 per ₹1 margin.', act: 'Reallocate ad spend', route: 'ads' as Tab },
  { title: 'File Flipkart claims', why: '₹3.84 L window closing in 6d.', act: 'Apply changes', route: 'returns' as Tab },
  { title: 'Move ₹40 L Treasury', why: '5.8% yield vs idle account.', act: 'Optimise Treasury', route: 'cash' as Tab },
]).map((action, i) => (
  <div key={i} className="p-4 bg-gray-50 rounded-[8px] border border-gray-100 flex flex-col gap-3 group">
    <div>
      <div className="text-[13px] font-bold text-navy-950 uppercase tracking-wider">{action.title}</div>
      <div className="text-[12px] text-gray-500 mt-1">{action.why}</div>
    </div>
    <button onClick={() => onNavigate(action.route)} className="btn-secondary w-full h-[32px] text-[12px]">{action.act}</button>
  </div>
))}
```

### Route mapping

| Action | CTA label | Destination tab | Why |
|---|---|---|---|
| Cut Myntra Ads by 30% | **Reallocate ad spend** | `ads` (Ad Profit) | The campaign-level reallocation lever lives here. |
| File Flipkart claims | **Apply changes** | `returns` (Returns & Claims) | The claims pipeline and "File claim" CTA live on this page. |
| Move ₹40 L Treasury | **Optimise Treasury** *(renamed from "Review cash flow")* | `cash` (Cash & Runway) | The cash position, idle-cash recommendation, and liquid-fund treasury action all live here. |

### Rationale for the rename

`"Review cash flow"` is passive — it describes the page, not the action the founder will take. `"Optimise Treasury"` matches the intent of moving idle cash to a higher-yield instrument, and aligns with how a CFO would describe the activity.

---

## Acceptance criteria

- The Home page summary card shows the crisp 17-word sentence with `"Myntra is the bleeder"` ending.
- The summary card has a single right-aligned primary button labelled `"Fix Myntra ads"` with an `ArrowUpRight` icon.
- Clicking `"Fix Myntra ads"` navigates to the Ad Profit page.
- The three Immediate Actions buttons now navigate when clicked:
  - "Reallocate ad spend" → Ad Profit
  - "Apply changes" → Returns & Claims
  - "Optimise Treasury" → Cash & Runway
- No raw `text-indigo-*`, `text-slate-*`, `font-serif`, `italic`, `font-black`, `rounded-[40px]`, or sci-fi microcopy is introduced.
- `npm run dev` builds cleanly with no TypeScript errors.

---

*Edit `src/App.tsx` only. Do not regenerate the file. The Tab type union (line 137) already includes `'ads'`, `'returns'`, and `'cash'` — no type changes needed.*
