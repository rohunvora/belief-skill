# Belief Router

Turn any opinion into a trade. Paste a tweet, drop a YouTube link, say what you think is going to happen. The skill finds the most direct way to bet on it.

## Real examples

These are actual outputs from live test sessions.

**"inflation is a monetary phenomenon. tech people calling for deflation will likely be wrong. if you're in bits, pivot to atoms."** (@akshaybd)

The skill identifies this as a broad thesis (D2, no single obvious ticker), verifies the inflation premise, and presents ranked options: GLD as the most direct monetary inflation play, DBC for broad commodity exposure, XLI if you read "atoms" as industrial reshoring. Doesn't force one answer when the belief maps to a category.

**"NVDA is down 25% and Blackwell demand is unaffected. this is a gift."**

Author named the ticker. The skill agrees: NVDA shares, long. Verifies Blackwell demand ($500B+ committed through 2026), confirms the obvious play IS the best play. Doesn't manufacture a "smarter" alternative when the direct answer is right.

**"everyone is positioned for a dollar rally. pain trade is up in everything."**

Before routing, the skill checks the setup claim (Research Phase 0). CFTC COT data shows USD is actually net-short $20.5B. The premise is inverted. Notes the correction, then routes on the corrected premise: UUP long (dollar strength is the actual pain trade).

**Scan @chamath** (50 recent tweets)

Fetches posts via X API, filters for directional takes, surfaces 5 tradeable theses. Routes each through the full flow. MSFT short (direct, author named it), DELL long (derived, on-prem thesis), CEG long (derived, power as AI bottleneck). Each card looks different because each thesis is different.

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

Inspired by [cloudflare-skill](https://github.com/dmmulroy/cloudflare-skill). The main SKILL.md is a decision tree (228 lines) that routes to reference files loaded on demand. Detail lives in `references/`, not in the main prompt. This keeps the LLM focused on the current step instead of processing 800+ lines of instructions at once.

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
  real-test-theses.json     9 cases from actual sessions (with ratings)
  hard-test-theses.json     8 synthetic hard cases
board/
  server.ts                 Bun.serve() on port 4000
  db.ts                     SQLite (bun:sqlite)
  components/               React (CallCard, Avatar)
  pages/                    CallList, CardDetail
  templates/                server-rendered OG cards + permalinks
```

## What you can say

Anything with a direction.

| Input | What happens |
|-------|-------------|
| "Everyone's on Ozempic" | Decodes the belief, finds NVO at PE 13 as the most direct play |
| "Fed won't cut in March" | Routes to Kalshi NO contract. $80 pays $1,000 if right. |
| "SOL is going to flip ETH" | Pair trade on Hyperliquid. Long SOL, short ETH. Isolates the ratio. |
| Paste a YouTube URL | Extracts every directional claim, asks which to route, deep-analyzes the top picks |
| `scan @martinshkreli` | Fetches 50 tweets, filters for takes, routes each one |
| Screenshot of a tweet | Vision extracts the text, routes it like any other input |

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
