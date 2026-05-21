# Cursor Prompt: Fix the Ad Profit page header and recommendation banner

The Ad Profit page has three broken UI issues that need surgical fixes in `src/App.tsx` (the `AdProfitScreen` component, starting around line 2258). Do not regenerate the file. Only touch the lines specified.

---

## Problems to fix

1. **The recommendation sentence is uppercase + italic + multicoloured**, with both red and green underlined phrases on the same line over a dark navy background. Result: looks like a ransom note. Should read as a calm, confident recommendation.
2. **The "Simulate Projection" secondary button is invisible**: it uses the `btn-secondary` class (white background + primary purple text) but is then overridden to `text-white` on a dark navy card → white text on white background.
3. **The page header microcopy is bureaucratic**: title "Ad Insights", subtitle "Performance Analysis & Reallocation Suggestions", and the metric badge reads "1.24X · CONSOLIDATED POAS" with uppercase X and jargon.

---

## File and component

`src/App.tsx` — `AdProfitScreen` component, the `<SectionHeader>` and the dark-navy `<Card>` that follows it.

---

## Change 1 — Page header

### Before

```tsx
<SectionHeader 
  title="Ad Insights" 
  subtitle="Performance Analysis & Reallocation Suggestions"
>
  <div className="flex flex-col items-end">
     <div className="text-[32px] font-bold text-success leading-none tabular-nums">1.24X</div>
     <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Consolidated POAS</div>
  </div>
</SectionHeader>
```

### After

```tsx
<SectionHeader 
  title="Ad Profit" 
  subtitle="Net contribution per campaign across Meta, Google, and marketplace PLAs"
>
  <div className="flex flex-col items-end">
     <div className="text-[32px] font-bold text-success leading-none tabular-nums">1.24x</div>
     <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mt-1">Profit on ad spend</div>
  </div>
</SectionHeader>
```

### Rationale

- "Ad Insights" → **"Ad Profit"**: matches the sidebar label and the language used in the deck and 1-pager.
- Subtitle reframed as what the page actually shows, not the methodology behind it.
- `1.24X` → `1.24x`: the lowercase x reads as "times" (a multiplier). Uppercase X looks like a placeholder.
- `CONSOLIDATED POAS` → **"Profit on ad spend"**: drop the all-caps and the jargon. Sentence-cased uppercase-tracked label matches the rest of the app.
- Replace `font-bold` on the label with `font-medium` to soften the label hierarchy; bold is reserved for the metric itself.

---

## Change 2 — Recommendation banner

### Before

```tsx
<Card className="bg-navy-950 text-white border-none p-8 relative overflow-hidden">
   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-primary text-white rounded-[6px] flex items-center justify-center font-bold text-lg">!</div>
           <h3 className="text-[12px] font-bold uppercase tracking-wider text-white/60">CoWorker Smart Recommendation</h3>
        </div>
        <p className="text-[24px] font-bold leading-tight text-white uppercase italic">
           Shift <span className="text-error underline decoration-2 underline-offset-4">₹2.4 L from Myntra Meta Paid</span> to 
           <span className="text-success underline decoration-2 underline-offset-4 ml-2">Google Brand Search</span>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
         <button className="btn-primary h-12 px-8">Execute Reallocation</button>
         <button className="btn-secondary h-12 px-8 border-white/20 text-white hover:bg-white/10">Simulate Projection</button>
      </div>
   </div>
</Card>
```

### After

```tsx
<Card className="bg-navy-950 text-white border-none p-8 relative overflow-hidden">
   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-purple-tint" />
           <h3 className="text-[12px] font-medium uppercase tracking-wider text-white/60">CoWorker recommendation</h3>
        </div>
        <p className="text-[22px] font-semibold leading-snug text-white">
           Shift <span className="font-bold">₹2.4 L</span> from Myntra Meta to Google Brand Search to recover <span className="font-bold text-success">+₹3.1 L</span> margin this month.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
         <button className="btn-primary h-12 px-6">Execute reallocation</button>
         <button className="h-12 px-6 rounded-[6px] border border-white/30 text-white font-semibold text-[14px] hover:bg-white/10 transition-colors">Simulate projection</button>
      </div>
   </div>
</Card>
```

### Rationale

**Typography**
- Removed `uppercase` and `italic` from the recommendation sentence. All-caps + italic at 24 px on a dark background reads as aggressive and dated.
- Dropped from `font-bold` to `font-semibold` for the body text — keeps emphasis on the numbers, not the whole sentence.
- Sentence case throughout. Button labels are sentence case too ("Execute reallocation", not "Execute Reallocation").

**Color use**
- Removed the red underline on "Myntra Meta Paid". You don't need to colour-code the thing you're suggesting they reduce — the verb "shift … from" already signals it.
- Removed the green underline on "Google Brand Search". Same reason — context makes it obvious.
- Kept exactly one accent: green `+₹3.1 L` for the recovered margin. That's the only number the founder needs to see in colour.
- Result: dark navy background, white text, one green highlight. Clean.

**Icon**
- Replaced the "!" badge in a purple square with a `Sparkles` icon (already imported in `AskCoWorkerPanel`; if not in App.tsx, add it to the `lucide-react` import). Sparkles is the existing visual language for the AI assistant surface — consistent with the "Ask CoWorker" sidebar item. The "!" badge reads as a warning, not a recommendation.

**Sentence structure**
- Reframed to lead with the action and end with the benefit: "Shift ₹2.4 L from X to Y **to recover +₹3.1 L margin this month**." Without the projected benefit, the user is asked to take action on faith. With it, the recommendation has a clear payoff.
- "Myntra Meta Paid" → "Myntra Meta" — drop "Paid" (redundant; all the ad spend on this view is paid).

**Buttons**
- Primary button stays as `btn-primary` (Cashfree purple bg, white text — visible on dark navy).
- Secondary button: drop `btn-secondary` entirely. That class is designed for light backgrounds (white bg + purple text + purple border). On a dark navy card, it breaks. Replace with an inline-styled outlined button: transparent bg + white border at 30% opacity + white text + white-tinted hover. This is the standard "outlined-on-dark" pattern, already used in the top navbar for "Developers" and "Switch to Sandbox".

---

## Acceptance criteria

- Page title reads **Ad Profit** (not "Ad Insights").
- Metric shows **1.24x** (lowercase x) with the label "Profit on ad spend" in sentence case.
- The recommendation sentence is sentence case, not italic, not uppercase, and uses one colour only (green for the gain figure).
- Both buttons are visible on the dark navy background.
- The recommendation banner now mentions the projected gain (+₹3.1 L margin this month).
- No raw `text-indigo-*`, `font-serif`, `italic`, or all-caps body copy elsewhere in `AdProfitScreen`.
- `npm run dev` builds cleanly with no TypeScript errors.

---

*Edit `src/App.tsx` only. If `Sparkles` isn't already in the `lucide-react` import at the top of the file, add it. Do not touch any other component.*
