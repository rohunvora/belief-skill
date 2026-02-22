# Belief Router

Turn any opinion into a trade. Paste a tweet, drop a YouTube link, say what you think is going to happen. The skill finds the most direct way to bet on it.

## Real examples

These are actual outputs from live test sessions — not invented by the AI. Inputs are verbatim.

---

**"how do i long nettspend?"**

The subject is a person. No ticker exists. The skill recognizes this, decodes the cultural movement he represents (rising pluggnb artist, accelerating streaming trajectory), and descends the expression fidelity ladder. Conclusion: no traditional instrument has real thesis alignment. Routes to non-financial expression — GA concert tickets + limited merch with a scenario table, with UMGNF (Universal Music) flagged as a tangential public alt. Honest about what the thesis actually can and can't trade.

---

**"market all in on duration mismatch"** (@marginsmall)

Five words. No ticker. Two valid interpretations: rate direction (TBT) or positioning crowding (IVOL). The skill treats "all in" as a crowding signal, not a direction call. Searches for positioning evidence: Bloomberg Feb 5, hedge funds in leveraged Treasury spread trades showing signs of strain. Key insight: crowding implies volatility, not direction — the unwind goes either way. Routes to IVOL (holds OTC interest rate options that gain from yield curve moves in any direction), not TBT (directional, decays daily, wrong thesis). The follow-up conversation expanded to a TLT strangle for more leverage, then SOL short on Hyperliquid as a cross-asset liquidity-crunch play.

---

**"everyone is positioned for a dollar rally. pain trade is up in everything."**

Before routing, the skill checks the setup claim. CFTC COT data (Feb 16): USD net-short $20.5B. EUR longs near record highs. The premise is inverted — the crowd is actually positioned for dollar *weakness*, not a rally. Notes the correction explicitly, then routes on the corrected premise: UUP long or EUR-PERP short. If you'd gotten the original routing without the fact-check, it would have been wrong.

---

**"i think that at some point the american military will become the biggest buyer of ai/compute/hardware... i want to bet on america"**

Personal thesis, no ticker. The skill corrects a factual error before routing: military AI spending is $13.4B today vs $50–80B from hyperscalers — the military is *not* the biggest AI buyer yet. Routes to PLTR (won $10B Army contract, Maven at $1B, the government AI software layer) with an additional edge discovery: PLTR-PERP on Hyperliquid has –26% annualized funding, meaning longs get paid to hold. Honest correction first, then the trade.

---

**"NVDA is down 25% and Blackwell demand is unaffected. this is a gift."**

Author named the ticker. The skill agrees: NVDA shares, long. Verifies Blackwell demand ($500B+ committed through 2026). Confirms the obvious play IS the best play. Doesn't route to COHR or ANET because non-obvious isn't always better — NVDA has 80%+ causal density, the alternatives have 20–30%.

---

**@citrini7 tweet: "Seedance is the first time a Chinese AI product is just better definitively"**

Tweet URL. The obvious target (Runway, Pika, Sora) are all private — no direct short. The skill finds the best diluted public expression: ADBE puts (Firefly video generation is their bet on "best creative AI"; Seedance outclassing it is directly on-thesis against that). Flags honestly: pure-plays are private, ADBE is diluted, conviction medium-low. Doesn't force a high-conviction call when the instrument landscape is weak.

---

**Scan @chamath** (50 recent tweets)

Fetches posts via X API, filters for directional takes, surfaces 5 tradeable theses. MSFT short (direct, author named it), DELL long (on-prem data sovereignty thesis), CEG long (power as AI bottleneck). Two quick hits flagged as "don't pick a ticker yet." Each card looks different because each thesis has a different shape — MSFT short used options (directional, no catalyst), DELL used shares (structural), CEG used shares (locked PPA revenue). Doesn't apply the same instrument to every thesis.

## How it works

The skill follows a decision tree with two quality gates:

```
  EXTRACT (what did they say?)
  DECODE  (what do they believe?)
       |
  GATE 1: COHERENCE
       Does quote + ticker make sense side by side?
       Fails --> reroute closer
       |
  RESEARCH --> SCORE --> SELECT
       |
  GATE 2: OPTIMALITY
       Is this the best way to trade this belief?
       Fails --> find better instrument
       |
  OUTPUT
```

Gate 1 checks coherence against the original words (headline test, author test, padding test). Gate 2 checks optimality against the original belief (causal density, instrument structure, edge). Both can reject and loop back.

## Architecture

The main SKILL.md is a decision tree (228 lines) that routes to reference files loaded on demand. Detail lives in `references/`, not in the main prompt. This keeps the LLM focused on the current step instead of processing 800+ lines of instructions at once.

```
SKILL.md                    decision tree + flow (228 lines)
references/
  scoring-rubric.md         4-dimension evaluation, hard gates, comparison
  derivation-chain.md       chain format, examples, anti-patterns, coherence tests
  output-format.md          payload table, headline quotes, board POST
  bulk-mode.md              multi-thesis extraction, tiering, scan output
  handle-scan.md            X API pipeline, cost gate, filtering
  instrument-reasoning.md   options vs perps vs Kalshi vs shares
  portfolio-construction.md multi-leg trades, pair construction
  blindspots.md             platform risk, correlation groups, liquidity
scripts/adapters/
  robinhood/                stock/ETF price + returns (via Yahoo Finance)
  hyperliquid/              perp price, funding, leverage
  kalshi/                   prediction market discovery + returns
  polymarket/               binary event markets
  bankr/                    onchain instruments (15-125s)
  angel/                    private market raises
  x/                        X/Twitter user timeline (pay-per-use API)
  transcript/               URL to text (YouTube, articles, tweets)
tests/
  real-test-theses.json     canonical test set — 10 cases from actual sessions
  hard-test-theses.json     8 edge cases (private plays, compound contradictions, stale theses)
  real-routings.md          6 fully documented real sessions with lessons learned
  results/*.jsonl           raw routing outputs from test sessions
board/
  server.ts                 Bun.serve() on port 4000
  db.ts                     SQLite (bun:sqlite)
  components/               React (CallCard, Avatar)
  pages/                    CallList, CardDetail
  templates/                server-rendered OG cards + permalinks
```

## What you can say

Anything with a direction. You don't need to know the ticker.

| Input | What happens |
|-------|-------------|
| "Everyone's on Ozempic" | Decodes the belief. NVO at PE 13 is the most direct play — the obvious answer is right here. |
| "Fed won't cut in March" | Kalshi NO contract. $80 pays $1,000 if right. Beats TLT puts on every dimension. |
| "SOL is going to flip ETH" | Pair trade on Hyperliquid. Long SOL-PERP, short ETH-PERP. Isolates the ratio from market direction. |
| "how do I bet on [artist/creator]?" | Finds the cultural movement they represent. Routes to the tradeable expression — or says honestly when nothing has real thesis alignment. |
| "my landlord just raised rent 40%" | Treats the lived observation as thesis signal. Finds the public real estate play that matches. |
| "market all in on [trade]" | Reads as a crowding claim. Checks CFTC/positioning data. Routes to volatility, not direction. |
| Paste any tweet URL | Fetches the full text, routes it in one step. Works on long-form Premium tweets too. |
| Paste a YouTube URL | Extracts all directional claims, routes the strongest ones. Can handle 4,000-word transcripts. |
| `scan @handle` | Fetches 50 posts, finds tradeable takes, routes each one. $0.26 in API costs. |
| Screenshot of anything | Vision reads the text, routes it like any other input. |
| "I think X but also Y" | Detects compound theses. Resolves apparent contradictions (Jevons, crowding, reflexivity). Finds the pair trade if one exists. |

## Install

Requires [Bun](https://bun.sh) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill
bun install
```

The skill activates automatically in Claude Code when you express a belief with trading implications. No slash commands needed.

**Optional:** Set `X_BEARER_TOKEN` in `.env` for handle scanning ($0.26 per 50 tweets, pay-per-use). The skill works without it; you can paste tweets or use screenshots instead.

## The two gates

The core insight: every routing failure traces back to one of two problems.

**Gate 1 (Coherence)** catches routings where the chain from quote to ticker doesn't hold. "Inflation is monetary" next to FCX (a copper mine) fails the headline test. A reader can't see why they're together. The old skill produced these because it rewarded "non-obvious" plays. The new skill requires: can a reader see the connection without explanation?

**Gate 2 (Optimality)** catches routings where a better instrument exists. Kalshi NO at $0.08 beats TLT puts for a "Fed won't cut" thesis because it resolves on the exact event with defined risk. Shares beat options for structural theses with no catalyst date. The rubric (alignment, payoff shape, edge, timing forgiveness) makes the comparison explicit.

## What it won't do

- Execute trades. It shows what to buy and where. You press the button.
- Give financial advice. Everything is framed as trades and market data, not recommendations.
- Route without evidence. Every claim in the output traces to a data source.

## License

MIT
