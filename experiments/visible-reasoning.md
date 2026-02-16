# Experiment: Visible Reasoning

## Hypothesis

People want to feel smart when using the skill. The dopamine isn't the final trade card — it's watching the system think through YOUR idea and construct something from it. Seeing the reasoning chain from your casual words to a real position is what creates the "edge" feeling.

## The Problem

Current output is a polished card. You see the answer but not the journey. It's like getting a solved equation without seeing the proof. The user can't tell if the system is smart or just pattern-matching tickers.

## The Insight

The reasoning IS the product. When someone watches:

> "looksmaxxing is going mainstream"
> → wait, this is a cultural movement, not a company
> → male self-improvement wave... who captures that spend?
> → HIMS is literally the looksmaxxing pharmacy
> → but the obvious long is priced in... what's the OTHER side?
> → MTCH/Tinder is what looksmaxxing REPLACES
> → pair trade: long the new, short the old

...they feel like they're getting an actual edge. They can SEE the logic chain. They could almost have done it themselves — but they didn't. The skill did. That gap between "I could have seen this" and "I didn't" is where the dopamine lives.

## Design Principle

**Show construction, not just conclusions.**

The output should feel like watching someone build in real-time:
- Each step reveals something the user didn't think of
- The user's exact words are the starting material
- Wrong paths and rejections are visible (shows rigor)
- The final trade feels EARNED, not handed down

## Output Format: Progressive Disclosure

Instead of one monolithic card, the output unfolds in stages. On Telegram, this could be:

### Option A: Streaming Stages (edit-in-place)

A single message that updates as the skill thinks. The user watches it build:

```
💭 "looksmaxxing is going mainstream"

🔍 DECODING...
Not a company. Cultural movement.
Male self-improvement → grooming, supplements, fitness.
Wave, not surfer.

🎯 WHO CAPTURES THIS?
├─ HIMS $26.40 — men's health, finasteride, skincare ✓
├─ GNC $3.20 — supplements, but dying retail ✗
├─ PLNT $72 — gyms, but thesis beta too low ✗
└─ MTCH $30.50 — Tinder = what looksmaxxing KILLS ⚡

💡 THE MOVE
Long HIMS is obvious. But the non-obvious:
looksmaxxing doesn't just CREATE spend — it REPLACES something.
"Delete Tinder" is a rite of passage.
MTCH puts = short the thing this culture rejects.

📐 CONSTRUCTING...
MTCH $25P Jun'26 @ ~$1.25
800 contracts · $100K risk · 5.6x if $18

┌─────────────────────────────────┐
│ 🎯 DELETE TINDER GENERATION     │
│ MTCH $30.50 · $25P Jun'26      │
│                                 │
│ $30+   -$100K   thesis wrong    │
│ $25    -$60K    slow bleed      │
│ $22    +$140K   2.4x            │
│ $18    +$460K   5.6x            │
│                                 │
│ 35% to be +EV                   │
│ Dies if: Hinge saves them,      │
│ AI dating re-engages Gen Z      │
└─────────────────────────────────┘

🔗 DOUBLE PLAY: Long HIMS + Short MTCH
Same force, two directions.

[Buy 800 MTCH $25P → Robinhood] [📝 Track]
```

### Option B: Multi-message Steps

Send each stage as a separate message with slight delay (humanDelay). The user watches their feed fill up with the reasoning:

**Message 1:**
> 💭 "looksmaxxing is going mainstream"
> 
> Decoding... not a company. This is a cultural movement — male self-improvement wave. Need to find who captures the spend and who gets replaced.

**Message 2:**
> 🔍 Scanning...
> HIMS $26.40 — the looksmaxxing pharmacy ✓
> GNC $3.20 — dying retail ✗  
> PLNT $72 — thesis beta too low ✗
> MTCH $30.50 — Tinder = what looksmaxxing KILLS ⚡

**Message 3:**
> 💡 The non-obvious move: looksmaxxing doesn't just create spend — it replaces something. "Delete Tinder" is a cultural rite of passage. MTCH puts = short the thing this movement rejects.

**Message 4:** [The final trade card with buttons]

### Option C: Collapsible Reasoning (single card)

The trade card stays ≤18 lines but the reasoning is woven into it as the WHY section — showing the chain, not just the conclusion:

```
🎯 DELETE TINDER GENERATION

MTCH $30.50 · $25P Jun'26

"Looksmaxxing" → not a company, a cultural wave
→ who captures male self-improvement spend? HIMS ✓
→ but what does it REPLACE? Dating apps.
→ "Delete Tinder" = rite of passage = demand collapse
→ MTCH at 12x PE is a value trap on shrinking TAM

800ct · $100K max loss · 35% to be +EV

$30+  -$100K  thesis wrong
$25   -$60K   slow bleed  
$22   +$140K  2.4x
$18   +$460K  5.6x

Dies if: Hinge growth offsets, AI dating re-engages Gen Z
Alt: PAIR — long HIMS calls + MTCH puts (market neutral)

[Buy 800 MTCH $25P → Robinhood] [📝 Track]
```

## Tradeoffs

| | Streaming (A) | Multi-msg (B) | Compact (C) |
|---|---|---|---|
| Dopamine | Highest — watching it build | High — feed fills up | Medium — reasoning compressed |
| Screenshotability | Hard — too long | Hard — multi messages | Best — one screenshot |
| Token cost | Same | Same | Same |
| Implementation | Edit-in-place (Telegram streaming) | Block streaming / humanDelay | SKILL.md change only |
| Mobile UX | Scroll-heavy | Natural feed feel | Clean |

## Recommendation

**Start with C (compact reasoning chain).** It's a SKILL.md-only change — no new infra. The "→" chain in the WHY section shows the construction process without breaking the screenshot format.

Then test B (multi-message) as the premium experience for people who want the full show. This uses OpenClaw's existing `humanDelay` + block streaming.

A (streaming edit) is the dream state but requires the output to be constructed incrementally, which fights against how LLMs generate (they need to think the whole thing before outputting).

## What Changes in SKILL.md

Replace the current WHY guidance ("2-3 sentences") with:

> **WHY as construction chain.** Show how you got from the user's words to the trade. Use → to show the reasoning steps. Each step should reveal something the user didn't think of. The chain IS the edge — if someone can follow it, they feel smart. If they couldn't have built it themselves, they feel like they got alpha.

The output template WHY section becomes:
```
"[user's exact words]" → [cultural/causal decode]
→ [who benefits / who gets hurt]
→ [the non-obvious insight]
→ [why THIS instrument, not the obvious one]
```
