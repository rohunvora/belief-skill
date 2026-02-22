# Bulk Mode

When Input Validation step 7 triggers (multiple theses, user wants all routed), run this pipeline instead of the full router N times.

## Phase 1: Extract & Cluster

Pure reasoning. No tool calls. Extract every directional claim using the same criteria as Input Validation.

**For each claim, capture the Call layer first (faithful extraction):**
- `source_quote`: verbatim, 1-2 strongest sentences (full length, for the detail page)
- `headline_quote`: apply Headline Quote Rules (see `references/output-format.md`). Pick the punchiest sentence, their actual words, max 120 chars
- `speaker`: who made this claim (name, handle, role)
- `timestamp`: where in the source (MM:SS for video/audio, paragraph for text)
- `author_ticker`: did they name a specific instrument? (null if not)
- `conditions`: any qualifications they attached (null if none)

**Then add the Routing layer:**
- `thesis`: reframed as a directional claim (may differ from headline_quote)
- `call_type`: direct / derived based on divergence

**Cluster:** Same thesis expressed differently = 1 entry. Keep the strongest quote per attribution. When multiple speakers support the same thesis, capture each as a separate segment with speaker + timestamp.

**Tier into three levels:**
- **Tier 1 (Route):** Specific and tradeable. Gets Phase 2 + Phase 3.
- **Tier 2 (Sweep only):** Directional but needs sharpening. Phase 2 only, show candidates.
- **Tier 3 (Skip):** Too vague to trade. List for completeness, no instrument search.

## Phase 2: Instrument Sweep

Batched tool calls. No web research. **Batch by platform, not by thesis.**

```bash
# One call per platform covers all theses
bun run scripts/adapters/robinhood/instruments.ts "TICK1,TICK2,TICK3,TICK4"
bun run scripts/adapters/kalshi/instruments.ts "theme keywords"
bun run scripts/adapters/hyperliquid/instruments.ts "COIN1,COIN2"
```

Run all platform calls in parallel. Map validated instruments back to theses as candidate lists.

## Phase 3: Deep Route

Full belief-router on Tier 1 theses only (top 3-5). Each deep route is independent; run in parallel. Each gets one thesis + the full routing flow (Research → Scoring → Trade Selection → Output).

## Scan Output

One artifact per source. Two tiers that look deliberately different.

**Quick Hit** (Tier 2 and Tier 1 pre-route): Leads with the author's actual quote and attribution. Shows candidates but does NOT pick a specific instrument.

```
★ "[source_quote]" · [speaker] [timestamp]
  thesis: [headline_quote or reframed thesis]
  CANDIDATES: [TICK1], [TICK2], [TICK3]
  → Deep Route this
```

**Deep Route Result** (Tier 1 post-route): Full routing output as prose, with derivation chain and board link. Each deep route looks different because each thesis is different.

**Tier 3**: One line per skipped thesis with reason.

**Footer**: Count of theses extracted/routed/skipped + source link + disclaimer.

## Bulk Output for Chat

Full analysis lives on the board. Chat gets a compact summary.

**During routing:** Post each deep route to the board as it completes. Show one progress line per route:
```
Routing 1/2: MSFT underperformance thesis...
```

**After all routes complete:** Show the summary. Three lines per take:
```
"MSFT worst hyperscaler since ChatGPT" · @chamath
MSFT short · $399.60 · direct
→ https://belief-board.fly.dev/t/21eca4de-0

"f(i) = p * c * a" · @chamath
CEG long · $294.05 · derived
→ https://belief-board.fly.dev/t/6f1aeb7a-d

2 routed · 3 quick hits · @chamath · Feb 2026
Expressions, not advice. Do your own research.
```

Quick hits listed below deep routes. User taps any link for the full take.

**Single route mode** (one thesis, not bulk) still shows the full prose reply + chain inline. Compact format is only for bulk.

## Scan Rules

1. **Never pick a ticker in a quick hit.** Candidates only. The scan never pretends to have done work it hasn't.
2. **Derivation chain required on deep routes.** Use the format in `references/derivation-chain.md`.
3. **Counter-arguments.** If the source contains opposing views, note them.
4. **Mixed signals.** If a thesis has both bullish and bearish elements, capture both and let routing resolve direction.
5. **One scan per source.** The scan is the atomic unit.
