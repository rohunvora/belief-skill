# Belief Router

An [OpenClaw](https://github.com/openclaw/openclaw) skill that routes natural language beliefs into specific trades.

Say what you think will happen → get the single highest-upside way to express that belief across prediction markets, options, equities, crypto perps, and private markets.

## How It Works

You say something like *"meme politics are dead"* or *"long peptides"* or *"China catching up in AI means defense spending booms."*

The skill:

1. **Extracts the deeper claim** — the obvious trade is usually priced in. The skill finds the second- or third-order consequence where the asymmetry actually lives.
2. **Classifies the thesis shape** — binary event, mispriced company, sector/theme, relative value, or vulnerability. Shape determines which instruments are natural candidates.
3. **Checks prediction markets first** — if Kalshi or Polymarket has a contract that directly resolves on your thesis, it sets the ceiling. Everything else has to beat ~100% thesis beta with zero carry cost.
4. **Finds the best instrument within the matched class**, then **cross-checks against other classes** on a normalized metric.
5. **Structures the position** — direction theses get decomposed into independently-resolving pieces (partial wins > all-or-nothing). Scopes to the thesis window.
6. **Outputs a single trade card** — one screen on mobile, scenario table with $100K sizing, kill conditions, conviction breakeven, and an alternative from a different instrument class.

### The Metric

Every candidate is scored on:

```
thesis beta × convexity / (1 + time cost)
```

- **Thesis beta** — what % of this instrument's price movement is driven by THIS thesis? Kalshi binary ≈ 100%. Sector ETF ≈ 30-60%.
- **Convexity** — raw upside multiple at $100K.
- **Time cost** — annualized carry (options theta, perp funding, zero for shares/prediction markets).

This replaces any hardcoded instrument preference. The metric naturally surfaces the right instrument for each thesis.

## Example

**Input:** *"Kevin Warsh will run the economy hot, AI thrives"*

**Old approach:** Route to SOXL (3x semis ETF) — 25% thesis beta, 1.3x upside. Most of the move comes from factors unrelated to Warsh.

**Belief Router:** Decomposes into two legs (rates = contrarian, AI = consensus). Routes the contrarian leg. Finds Kalshi per-meeting rate cut contracts for Jul/Oct/Dec 2026 — 3 independent bets, partial wins possible, 90% thesis beta, 3.3x max, scoped to Warsh's actual tenure.

## Platforms

The skill searches across 6 platforms via adapter scripts:

| Platform | What | Adapter |
|----------|------|---------|
| **Kalshi** | Prediction markets (politics, macro, events) | `scripts/adapters/kalshi/` |
| **Polymarket** | Prediction markets (politics, crypto, sports) | `scripts/adapters/polymarket/` |
| **Robinhood** | Stocks, ETFs, options | `scripts/adapters/robinhood/` |
| **Hyperliquid** | Crypto perps (leverage, pair trades) | `scripts/adapters/hyperliquid/` |
| **Bankr** | AI agent tokens | `scripts/adapters/bankr/` |
| **Angel** | Private markets (Republic, Wefunder, Crunchbase) | `scripts/adapters/angel/` |

Polymarket adapter is zero-dependency (just `fetch`). Sports markets work via slug construction — NBA, NFL, MLB, NHL, NCAAB.

## Paper Trading

Every trade card has action buttons:

- 📝 **Paper Trade** — record at current price, track P&L
- ✅ **I Took This** — record as real
- 🔗 **Open in Platform** — deep link to the instrument

```bash
bun run scripts/track.ts portfolio --telegram   # live P&L for all open beliefs
bun run scripts/track.ts check                   # check for similar past trades
bun run scripts/card.ts --id <ID> --telegram     # shareable trade card
```

## Install

Requires [Bun](https://bun.sh) and an [OpenClaw](https://github.com/openclaw/openclaw) instance.

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill/v2/belief-router
bun install
```

Point your OpenClaw skill path to the `v2/belief-router` directory. The skill activates automatically when you express a belief with trading implications.

### API Keys

The skill uses web search for live research. Your OpenClaw instance handles search. Adapter scripts call public APIs (Yahoo Finance, DexScreener, Polymarket) — no additional keys required for basic usage.

Kalshi adapter uses their public API. Angel adapter searches Republic/Wefunder/Crunchbase public listings.

## Repo Structure

```
v2/belief-router/          ← current version (use this)
  SKILL.md                 ← the skill spec (500 lines, the brain)
  scripts/
    track.ts               ← paper/real trade tracking + portfolio
    card.ts                ← shareable trade cards
    types.ts               ← TypeScript types
    adapters/
      kalshi/              ← prediction market instruments + returns
      polymarket/          ← zero-dep prediction market + sports
      robinhood/           ← stocks, ETFs, options via Yahoo Finance
      hyperliquid/         ← crypto perps
      bankr/               ← AI agent tokens
      angel/               ← private markets (Republic, Wefunder, Crunchbase)
  references/
    blindspots.md          ← platform risk tiers
    instrument-reasoning.md
    portfolio-construction.md
    ticker-context.json
    secondaries.json

v1/                        ← legacy version (auto-graded, 48/48 test suite)
```

## Where It Stands

### Done
- Full 6-phase routing pipeline (SKILL.md)
- Thesis shape classification (binary, mispriced, sector, relative value, vulnerability)
- Ranking metric with thesis beta, convexity, time cost
- 6 platform adapters (Kalshi, Polymarket, Robinhood, Hyperliquid, Bankr, Angel)
- Position structuring (direction vs magnitude decomposition)
- Paper trading with portfolio tracking and trade cards
- Prediction markets as first-class (checked before traditional instruments)
- Polymarket sports betting support (NBA, NFL, MLB, NHL, NCAAB)
- Tested on 48 real theses from tweets — v1 scores 48/48

### Next

- **Calibration engine** — SQLite-backed belief tracking. Three entities: Thesis (the belief), Routing (the skill's work), Trade (the position). Separates thesis accuracy from instrument accuracy from timing. Edge Profile reveals where your model beats the market. Architecture designed, not yet built.
- **Visual frontend** — localhost dashboard (like Remotion's Claude skill pattern). Monitor trades live, portfolio view, thesis history.
- **Social trade cards** — shareable cards with AI-generated thesis blurb + instrument logic + P&L. The distribution mechanism — people share beliefs with results.
- **Execution guidance** — for non-API brokerages (Robinhood), visual step-by-step matching their UI. Screenshot confirmation to "book" trades.
- **Multi-wallet awareness** — knows which wallet is for which chain/exchange.

## License

MIT
