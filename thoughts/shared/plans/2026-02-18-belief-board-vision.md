# belief.board — Vision & Design Spec

Date: 2026-02-18
Status: Draft (pending review)

---

## North Star

**"Every belief gets a receipt."**

A receipt is: who said it, what they said, what instrument it maps to, at what price, with the reasoning chain that connects them. Permanent, attributed, timestamped, eventually scored.

---

## Why This Exists

Beliefs precede capital flows. When people start believing "AI defense spending will boom," that belief hasn't fully translated into trades yet. The belief is a leading indicator of where money is going.

If you capture and structure those beliefs in real-time — not just "bullish/bearish" sentiment, but specific instruments with reasoning — you can see future capital flow before it arrives.

The database of structured, attributed belief-to-instrument translations is the asset. The skill is the capture mechanism. The board is the display layer. The database is what compounds.

---

## Growth Loop

```
Route a belief → get a card → card looks smart → share on Twitter
→ followers see → "I want one" → install skill → route THEIR belief
→ more cards → more sharing → more installs → database grows
```

Self-improving mechanism: more users → more routings → track records emerge → leaderboards → people COMPETE to be proven right publicly → more routings → better coverage → more reasons to check the board → more users.

The card is the viral unit. The board is the scoreboard. The skill is the capture mechanism.

---

## Decision Principles

Test any feature or work item against this stack:

| Priority | Question | Examples |
|----------|----------|---------|
| **P0** | Does this make the growth loop work? | Board deploy, card OG tags, skill → board POST |
| **P1** | Does this increase capture velocity? | Lower friction, bulk scanning, GitHub distribution |
| **P2** | Does this make the database appreciate over time? | Outcome tracking, price updates, scorecards |
| **P3** | Does this make the data sellable? | API access, structured feeds, analytics |

Never do P1 work before P0 is done. Never do P2 before P1 is flowing.

---

## Gate Milestones

### Gate 1: Capture Critical Mass
- 10,000 attributed routings across 100+ unique callers
- Covers equities, crypto, and prediction markets
- Unlocks: conversations with Tier 1 data buyers, first pilot deal

### Gate 2: Outcome Depth
- 6+ months of history so early entries have known outcomes
- Can answer: "does following top-10% callers outperform?"
- Unlocks: Tier 2 data buyer conversations, pricing power

### Gate 3: Real-Time Signal Value
- Enough daily volume that "emerging consensus" is visible in near-real-time
- 50+ routings converging on an instrument in 48 hours = detectable signal
- Unlocks: real-time feed product, paying customers, prediction market partnerships

### Gate 4: Data Moat
- Database large enough and old enough that replication takes years
- Track records span 12+ months, attribution graph shows influence
- Unlocks: Tier 2 paying customers, fund launch option

---

## Data Buyers (Working Backwards)

### Tier 1: Crypto funds and trading desks (first buyers)
- Who: Wintermute, GSR, Amber, mid-size crypto funds
- What they buy: real-time feed of "what is CT translating beliefs into right now" — not "bullish on SOL" but "47 routings converged on SOL/ETH ratio trade via Hyperliquid perps"
- Why first: smallest compliance burden, most comfortable with novel data, Frank's audience IS their market

### Tier 2: Quantitative alternative data buyers (bigger checks)
- Who: Point72, Citadel, Two Sigma, Balyasny data teams
- What they buy: historical database for backtesting, then live feed if signal proves
- Why: spend $500K-$5M/year per unique data source. This is a new category they can't get elsewhere.

### Tier 3: Prediction market platforms (partnership)
- Who: Kalshi, Polymarket
- What they buy: "what markets should we create?" — routing convergence = demand signal
- Why: their #1 problem is market discovery

### Tier 4: Broker-dealers and platforms (largest, longest path)
- Who: Robinhood, eToro, Coinbase
- What they buy: "trending beliefs" feature — more predictive than "trending tickers"
- Why: drives user engagement and order flow

---

## Two-Layer Data Model

The core design insight: the skill was designed as a ROUTING tool (find the best trade) but is being repurposed as a DATA COLLECTION tool (build a database). These have opposite requirements:

- A routing tool should **transform** the input — find the non-obvious deeper play
- A data collection tool should **preserve** the input — faithfully capture what was said

Resolution: every entry has two clearly separated layers.

### Layer 1: The Call (author's signal — preserved faithfully)

What the author actually said. Never reframed, compressed, or improved.

```
source_handle:    @marginsmall
source_url:       https://x.com/marginsmall/status/123
source_date:      2026-02-15
source_quote:     "On-prem is back. Do I, if I'm Geico, want all
                   our proprietary data in an open LLM?"
author_thesis:    Enterprise data sovereignty will push companies
                  back to owned infrastructure
author_ticker:    null  (he didn't name one)
author_direction: null
conviction:       high  (declarative, no hedging)
conditions:       null  (no qualifications stated)
```

### Layer 2: The Routing (skill's analysis — editorial layer)

What the skill did with the call. Clearly labeled as the skill's contribution.

```
routed_ticker:    DELL
routed_direction: long
entry_price:      117.49  (price at source_date, not processing date)
call_type:        derived
derivation:       (see Cited Evidence section below)
reasoning:        ...
edge:             ...
counter:          ...
```

### Attribution Tiers (structural, not decorative)

The tier determines what gets scored in track records:

| Tier | What happened | Track record measures |
|------|--------------|----------------------|
| `direct` | Author named the ticker | Author's pick performance |
| `derived` | Author had market thesis, skill found instrument | Author: thesis direction. Skill: instrument selection |
| `inspired` | Author made observation, skill found the market angle AND instrument | Neither reliably — too many steps |

Track record boundaries are clean. Never blame an author for the skill's instrument selection. Never credit the skill for the author's directional call.

---

## Cited Evidence Model

Each card traces back to specific, cited source segments — not attributed summaries.

### Why This Matters

For a bulk scan of a 2-hour podcast, each card must link to the SPECIFIC moments that drove THAT conclusion. Not "from the All-In podcast" but "minute 12, minute 45, and minute 67."

### Structure

```json
{
  "segments": [
    {
      "quote": "GLP-1 adoption is insane right now",
      "speaker": "chamath",
      "timestamp": "12:34",
      "source_url": "https://youtube.com/watch?v=..."
    },
    {
      "quote": "the bottleneck isn't the drug, it's distribution",
      "speaker": "chamath",
      "timestamp": "45:12"
    },
    {
      "quote": "telehealth is the fastest channel to market",
      "speaker": "friedberg",
      "timestamp": "67:03"
    }
  ],
  "steps": [
    { "text": "GLP-1 adoption is accelerating", "segment": 0 },
    { "text": "distribution is the bottleneck", "segment": 1 },
    { "text": "telehealth is the fastest channel", "segment": 2 },
    { "text": "HIMS is the telehealth DTC pure play" }
  ],
  "chose_over": "NVO (direct pharma — surface play), LLY (same), TDOC (platform, not drug access)"
}
```

Steps WITH a segment index = **evidence** (what was said, cited).
Steps WITHOUT a segment index = **inference** (skill's contribution).

The boundary between "what someone said" and "what the skill concluded" is always visible in the data.

### For verification

Someone can: see the card → click through to permalink → see each derivation step WITH its source quote → click the timestamp to verify in the original source.

This makes the database auditable. Not "AI said Chamath is bullish HIMS" but "here are the exact quotes that led to this routing."

---

## Database Schema

### Queryable columns (feed, filtering, leaderboards)

```
id               — unique identifier
source_handle    — filter by person
source_date      — when they said it (NOT when processed)
call_type        — direct / derived / inspired
routed_ticker    — the instrument
routed_direction — long / short
entry_price      — price at source_date
conviction       — high / medium / low / speculative
status           — open / resolved / expired
caller_id        — who submitted this routing
created_at       — when the routing was processed
```

### Trade data blob (detail/permalink page)

```json
{
  "source_quote": "verbatim quote",
  "source_url": "link to original",
  "author_thesis": "their actual claim, not reframed",
  "author_ticker": "TICKER or null",
  "author_direction": "long/short or null",
  "conditions": "qualifications they stated, or null",
  "segments": [{ "quote", "speaker", "timestamp?", "paragraph?", "source_url" }],
  "derivation": { "steps": [{ "text", "segment?" }], "chose_over": "..." },
  "reasoning": "full WHY analysis",
  "edge": "what the market is missing",
  "counter": "best argument against",
  "kills": "what invalidates the thesis",
  "price_ladder": [{ "price", "pnl_pct", "pnl_dollars", "label" }],
  "alternative": "second-best instrument",
  "scan_source": "source label (e.g. 'All-In E213, Jan 2025')"
}
```

Design principle: queryable columns are what the feed needs. Everything else goes in the blob. Adding blob fields is free. Changing queryable columns requires migration.

---

## Card Design

The card is the viral unit. It must be screenshot-worthy. It always leads with the author's voice.

### Direct Call

```
┌─────────────────────────────────────┐
│                                     │
│  "Buy TSLA, $1T by end of year"     │
│  — @chamath · Jan 2025              │
│                                     │
│  TSLA long · $379                   │
│                                     │
│  direct call · belief.board         │
│                                     │
└─────────────────────────────────────┘
```

Author named the ticker. No routing divergence. Track record is theirs.

### Derived Call

```
┌──────────────────────────────────────┐
│                                      │
│  "On-prem is back. Do I, if I'm     │
│  Geico, want all our proprietary     │
│  data in an open LLM?"              │
│  — @marginsmall · Feb 2026           │
│                                      │
│  → DELL long · $117.49               │
│                                      │
│  on-prem is back                     │
│  companies buying own AI servers     │
│  DELL has $18B in orders to build    │
│                                      │
│  @marginsmall's thesis               │
│  routed by belief.board              │
│                                      │
└──────────────────────────────────────┘
```

Quote catches attention. Arrow (→) signals translation. Derivation chain shows reasoning. Attribution clear: whose thesis, who routed it.

### Inspired Call

```
┌──────────────────────────────────────┐
│                                      │
│  "Everyone's on Ozempic"             │
│  — @jason · Jan 2025                 │
│                                      │
│  → HIMS long · $12.50                │
│                                      │
│  everyone's on Ozempic               │
│  GLP-1 adoption accelerating         │
│  distribution is the bottleneck      │
│  HIMS is the telehealth DTC play     │
│                                      │
│  inspired by @jason                  │
│  routed by belief.board              │
│                                      │
└──────────────────────────────────────┘
```

Longer chain (more steps between observation and instrument). Attribution makes clear: skill's work inspired by an observation, not the author's trade.

---

## Skill Output Contract

The skill produces two outputs:

### The Take (streamed reply, for the user who asked)
Full analysis: deeper claim, rubric evaluation, cross-check, scenarios, kills. This is the product that keeps people using the skill. No changes needed here.

### The Card (POST to board, for the database + sharing)
Lean receipt with both layers. The JSON payload to POST /api/takes:

```json
{
  "source_handle": "@marginsmall",
  "source_url": "https://x.com/marginsmall/status/123",
  "source_date": "2026-02-15",
  "author_thesis": "Enterprise data sovereignty will push companies back to owned infrastructure",
  "author_ticker": null,
  "author_direction": null,
  "conviction": "high",
  "conditions": null,

  "routed_ticker": "DELL",
  "routed_direction": "long",
  "entry_price": 117.49,
  "call_type": "derived",
  "caller_id": "anon",

  "source_quote": "On-prem is back. Do I, if I'm Geico, want all our proprietary data in an open LLM?",
  "segments": [
    { "quote": "On-prem is back...", "speaker": "marginsmall", "source_url": "..." }
  ],
  "derivation": {
    "steps": [
      { "text": "on-prem is back", "segment": 0 },
      { "text": "companies buying their own AI servers instead of cloud" },
      { "text": "DELL has $18B in orders to build them" }
    ],
    "chose_over": "HPE (lower margin), SMCI (supply chain concerns)"
  },
  "reasoning": "...",
  "edge": "...",
  "counter": "...",
  "kills": "...",
  "price_ladder": [...],
  "alternative": "..."
}
```

---

## Skill Changes Required

### Phase 1: Add "Step 0 — Faithful Extraction"

Before any deeper claim analysis, the skill must first faithfully extract the author's actual signal:

1. Source quote — verbatim, strongest 1-2 sentences
2. Author's thesis — what they actually claimed, in their words
3. Author's instrument — did they name a ticker? (nullable)
4. Conviction — from language intensity (high/medium/low/speculative)
5. Conditions — any qualifications they stated (nullable)
6. Source date — when they said it

Explicit instruction: do NOT reframe, deepen, or improve the author's claim in this step. The deeper claim analysis comes next and is clearly labeled as the skill's editorial layer.

### Derivation Chain: Add Segment References

From flat string array to structured steps with optional source links:

```
Old: { steps: string[], chose_over: string }
New: { segments: [...], steps: [{ text, segment? }], chose_over }
```

For bulk scans: each claim's derivation must trace to specific timestamps/paragraphs in the source content.

### POST Payload: New Fields

Add to the board POST: source_date, author_thesis, author_ticker, author_direction, conviction, conditions, segments. Keep existing fields for backward compatibility during transition.

---

## Blindspots Identified (and how this design resolves them)

| Blindspot | Problem | Resolution |
|-----------|---------|-----------|
| Deeper claim vs accurate extraction | Skill puts words in people's mouths | Two layers: call (faithful) + routing (editorial). Never conflated. |
| Narrative compression | "TSLA could see upside IF..." becomes "TSLA long" | `conditions` field preserves qualifications. Conviction level captured. |
| Forced singularity | Smart people hedge; skill picks one side | `author_ticker` nullable. If they named one, it's preserved even if skill routes elsewhere. |
| Conviction flattening | "maybe 20% chance" scored same as "I am CERTAIN" | Explicit conviction field. Leaderboard can weight by conviction. |
| Routing error vs thesis error | Bad outcome — whose fault? | Attribution tier separates them. Direct = author scored. Derived = both scored separately. |
| Processing time vs belief time | Entry price uses wrong date | `source_date` extracted faithfully. `entry_price` = price at source_date. |
| Bulk provenance | Card says "from All-In podcast" with no specifics | Segments with timestamps. Each derivation step linked to specific source moment. |

---

## What This Means for Current Work Priority

| Work | Priority | Reasoning |
|------|----------|-----------|
| This design spec | P0 | Everything builds from this |
| Schema redesign (two-layer model) | P0 | Must be right before capturing data |
| Card template redesign (three tiers) | P0 | Card must be share-worthy before launch |
| SKILL.md updates (faithful extraction + segments) | P0 | Capture mechanism must produce correct data |
| Deploy board publicly | P0 | Growth loop can't start without public URLs |
| Publish skill to GitHub | P1 | Distribution to agents |
| Seed board with initial routings | P1 | Content for Frank to share |
| Track records / leaderboard | P1 | The scoreboard that creates the status game |
| Automated price updates | P2 | Database appreciation |
| Time-awareness / scorecard | P2 | Database appreciation |
| Bulk mode battle-testing | P1 | Volume driver |
| Data API for buyers | P3 | Only after Gate 1 |
