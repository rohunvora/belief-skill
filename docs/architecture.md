# Belief Router — System Architecture

## Flow

```
USER INPUT
│
│  "looksmaxxing is going mainstream"
│  tweet screenshot, voice note, article, vibe
│
▼
┌─────────────────────────────────────┐
│         INPUT VALIDATION            │
│                                     │
│  Is this a thesis?                  │
│  ├─ Clear claim → proceed           │
│  ├─ Vague/implied → reframe +       │
│  │   ask user to pick interpretation │
│  └─ Not a thesis → redirect         │
│                                     │
│  Is it specific enough?             │
│  Is it an action request?           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   PHASE 1: DEEPER CLAIM + SHAPE    │
│                                     │
│  1. Extract deeper claim            │
│     surface: "long Clavicular"      │
│     deeper: "looksmaxxing wave"     │
│     ├─ Cultural decoding            │
│     │  (person/brand → movement)    │
│     ├─ Causal chain                 │
│     │  (1st → 2nd → 3rd order)      │
│     └─ Compound decomposition       │
│        (multi-claim → strongest leg)│
│                                     │
│  2. Classify thesis shape           │
│     ┌──────────────┬───────────┐    │
│     │ Binary       │ Kalshi    │    │
│     │ Mispriced co │ Equity    │    │
│     │ Sector/theme │ ETF/name  │    │
│     │ Relative     │ Pair trade│    │
│     │ Vulnerability│ Puts/short│    │
│     └──────────────┴───────────┘    │
│     Re-classify if deeper claim     │
│     points to different shape       │
│                                     │
│  3. Clarity gate                    │
│     Ambiguous → ask (structured     │
│     options, fewest questions)      │
│                                     │
│  4. Time horizon                    │
│     catalyst date                   │
│     − price-in window               │
│     = trade horizon                 │
│                                     │
│  GATE: must state shape + deeper    │
│  claim + time horizon to proceed    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     PHASE 2: RESEARCH               │
│                                     │
│  1. Check past beliefs              │
│     track.ts check <keywords>       │
│     (overlap? lost before? won?)    │
│                                     │
│  2. Web search (parallel)           │
│     ├─ Current state / key data     │
│     ├─ What's already moved (YTD)   │
│     ├─ Consensus view               │
│     ├─ Specific numbers for scoring │
│     └─ Prediction market prices     │
│                                     │
│  GATE: ≥3 specific data points      │
│  with numbers and dates             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     PHASE 3: FIND THE TRADE         │
│                                     │
│  Step 0: Binary check               │
│  Does a prediction market contract  │
│  literally resolve on this thesis?  │
│  If yes → must be explicitly beaten │
│                                     │
│  Step 1: Best-in-class              │
│  Find best instrument WITHIN the    │
│  shape's natural class              │
│  Score: β × convexity / (1+tc)      │
│                                     │
│  Step 1.5: Position structuring     │
│  Direction thesis → decompose into  │
│  independently-resolving pieces     │
│                                     │
│  Step 2: Cross-check                │
│  Compare winner vs best from at     │
│  least one OTHER instrument class   │
│  on the same metric                 │
│                                     │
│  Step 2.5: Private market scan      │
│  Trigger if public β < 50%          │
│  Republic, Wefunder, Crunchbase     │
│  Apply illiquidity penalty          │
│                                     │
│  Step 3: Stress-test                │
│  Strongest case AGAINST the winner  │
│  Can you rebut with Phase 2 data?   │
│  If not → flag or reconsider        │
│                                     │
│  Disqualifiers (override metric):   │
│  ✗ Thesis contradiction             │
│  ✗ Liquidity < $100K without 2%     │
│  ✗ Already priced in (cite data)    │
│  ✗ Time mismatch (expires early)    │
│  ✗ Thesis beta < 20%               │
│                                     │
│  If nothing works → descend ladder: │
│  L1 high-beta proxy                 │
│  L2 adjacent market                 │
│  L3 infrastructure play             │
│  L4 non-financial expression        │
│  L5 monitor for future instrument   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     PHASE 4: VALIDATE & PRICE       │
│                                     │
│  Run adapter scripts to confirm:    │
│                                     │
│  robinhood/instruments.ts "TICKER"  │
│  hyperliquid/instruments.ts "TICKER"│
│  kalshi/instruments.ts "keyword"    │
│  polymarket/instruments.ts "slug"   │
│  bankr/instruments.ts "thesis"      │
│  angel/instruments.ts "keyword"     │
│                                     │
│  Get live pricing:                  │
│  */returns.ts → current price,      │
│  volume, liquidity, options chain   │
│                                     │
│  Build payoff scenarios at bet size │
│  Calculate conviction breakeven     │
│  ("right X% of the time = +EV")    │
│                                     │
│  If data contradicts Phase 3 →      │
│  go back to Phase 3                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     PHASE 5: OUTPUT                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  PART 1: THE TAKE (streamed)│    │
│  │                             │    │
│  │  Bold claims + evidence     │    │
│  │  4-6 paragraphs             │    │
│  │  Non-obvious insight        │    │
│  │  Why obvious play is wrong  │    │
│  │  Probability gap            │    │
│  │  "You need to believe X"    │    │
│  │                             │    │
│  │  Streams live via Telegram  │    │
│  │  preview — user watches     │    │
│  │  reasoning build in         │    │
│  │  real-time                  │    │
│  └──────────────┬──────────────┘    │
│                 │                    │
│                 ▼                    │
│  ┌─────────────────────────────┐    │
│  │  PART 2: THE CARD (message) │    │
│  │                             │    │
│  │  ≤10 lines. Spec sheet.     │    │
│  │  TICKER · INSTRUMENT · DIR  │    │
│  │  QTY @ PRICE · risk $AMT   │    │
│  │  4 scenario rows            │    │
│  │  +EV % · kills              │    │
│  │  Alt                        │    │
│  │                             │    │
│  │  Sent via message tool      │    │
│  │  with inline buttons:       │    │
│  │  [Execute] [📝 Track]       │    │
│  └──────────────┬──────────────┘    │
│                 │                    │
└─────────────────┼────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     POST-OUTPUT: TRACKING            │
│                                     │
│  User taps 📝 Track                 │
│  → track.ts record (JSONL append)   │
│  → "Tracked. [I Took This] [📊]"   │
│                                     │
│  User taps ✅ I Took This           │
│  → mark as real trade               │
│                                     │
│  User taps 📊 Portfolio             │
│  → track.ts portfolio               │
│  → live P&L per belief              │
│                                     │
│  Storage: data/beliefs.jsonl        │
│  Append-only. 4 fact types:         │
│  route | conviction | close | note  │
└─────────────────────────────────────┘
```

## Scoring Metric

```
score = thesis beta × convexity / (1 + time cost)

thesis beta   = % of instrument's move driven by THIS thesis (0-1)
convexity     = upside multiple at bet size if thesis correct
time cost     = annualized carry (theta, funding, decay)
```

## Platforms

```
┌────────────┬──────────────────┬───────────────────┐
│ Platform   │ Instruments      │ Adapter script     │
├────────────┼──────────────────┼───────────────────┤
│ Robinhood  │ Stocks, ETFs,    │ robinhood/         │
│            │ options, inverse │ instruments.ts     │
│            │ ETFs             │ returns.ts         │
├────────────┼──────────────────┼───────────────────┤
│ Kalshi     │ Binary contracts │ kalshi/            │
│            │ (events, Fed,    │ instruments.ts     │
│            │ politics)        │ returns.ts         │
├────────────┼──────────────────┼───────────────────┤
│ Polymarket │ Binary + sports  │ polymarket/        │
│            │ (slug-based)     │ instruments.ts     │
├────────────┼──────────────────┼───────────────────┤
│ Hyperliquid│ Perps (crypto +  │ hyperliquid/       │
│            │ non-crypto,      │ instruments.ts     │
│            │ leverage)        │ returns.ts         │
├────────────┼──────────────────┼───────────────────┤
│ Bankr      │ Onchain tokens   │ bankr/             │
│            │ (AI agent trades)│ instruments.ts     │
├────────────┼──────────────────┼───────────────────┤
│ Angel      │ Private raises   │ angel/             │
│            │ (Republic,       │ instruments.ts     │
│            │ Wefunder, CB)    │ returns.ts         │
└────────────┴──────────────────┴───────────────────┘
```

## Storage

```
data/beliefs.jsonl          ← append-only fact log
│
│  4 fact types:
│  ┌─────────┬─────────────────────────────────┐
│  │ route   │ belief + instrument + metrics    │
│  │         │ + action (none/paper/real)       │
│  ├─────────┼─────────────────────────────────┤
│  │ convict │ conviction update + reason       │
│  ├─────────┼─────────────────────────────────┤
│  │ close   │ exit price + P&L                 │
│  ├─────────┼─────────────────────────────────┤
│  │ note    │ freeform annotation              │
│  └─────────┴─────────────────────────────────┘
│
│  scripts/db.ts    ← read/write helpers
│  scripts/track.ts ← CLI (record, portfolio,
│                     close, update, history, check)
│
│  Principle: store atoms, compute molecules.
│  Facts are immutable. P&L, calibration,
│  edge profiles are derived at read time.
```

## Thesis Shapes → Instrument Routing

```
Binary event ──────→ Kalshi / Polymarket
                     (price = probability)

Mispriced company ─→ Equity / Options
                     (estimate probability × magnitude)

Sector / theme ────→ ETF or highest-β single name
                     (estimate probability)

Relative value ────→ Pair trade on perps
                     (isolate spread from market)

Vulnerability ─────→ Puts / inverse ETF / short perps
                     (profit from decline)

Uninvestable ──────→ Cultural decode → re-route
  person/brand       (trade the wave, not the surfer)
```

## Config

```
Defaults (in SKILL.md header):
  bet_size:     $100,000 (user-overridable per session)
  metric:       thesis beta × convexity / (1 + time cost)
  goal:         ONE trade (+ alt with different risk profile)
  time_horizon: derived from thesis catalyst
```
