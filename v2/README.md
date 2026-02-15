# Belief Router v2

Claude Code skill that routes a thesis into a single highest-upside trade expression through shape classification, metric-based ranking, and cross-class validation.

**One thesis → classify shape → live research → best-in-class → cross-check → one trade.**

## How it works

| Phase | What happens |
|-------|-------------|
| 1. Extract + Classify | Classify thesis shape (binary, company, sector, relative, vulnerability). Extract deeper claim. Extract time horizon. |
| 2. Research | Parallel web searches for live data: prices, valuations, consensus. Check prediction markets. Check trade history. |
| 3. Find THE Trade | Binary check → best-in-class within shape → cross-check across classes → stress-test. Rank by `thesis beta × convexity / time cost`. |
| 4. Validate | Run adapter scripts for live pricing on winner + alt. Build payoff table. |
| 5. Format | Compress into reader-facing output. Minto Pyramid: belief first, details last. |

## Core concepts

- **Thesis shape classification.** Binary events go through prediction markets. Mispriced companies go through equity/options. Relative theses go through pair trades. The shape determines the instrument class before research begins.
- **Ranking metric: `thesis beta × convexity / time cost`.** Purest expression, most leverage, cheapest to hold. Naturally surfaces the right instrument without hardcoded preferences.
- **Binary check (Step 0).** If a prediction market contract exists on the exact thesis, it must be explicitly beaten — it's ~100% thesis beta with zero carry.
- **Cross-check de-biases.** Home pick vs best from a different class, compared on the same metric. Catches cases where a non-obvious instrument wins.
- **Adaptation table, not branching templates.** One equity-long reference template + a compact table for Kalshi, perps, and options. 12 lines instead of 200.
- **Asymmetric framing.** Downside in dollar losses. Upside in multiples. Prospect theory.
- **Telegram-native formatting.** Monospace code blocks, `────` dividers, column alignment. No markdown tables.

## Platforms

| Platform | Adapter | Instruments |
|----------|---------|-------------|
| Robinhood | `scripts/adapters/robinhood/` | Stocks, ETFs, options (via Yahoo Finance) |
| Hyperliquid | `scripts/adapters/hyperliquid/` | Perps (via live API) |
| Kalshi | `scripts/adapters/kalshi/` | Binary contracts (via API) |
| Bankr | `scripts/adapters/bankr/` | Tokens (via AI agent) |

## Defaults

- **Ranking metric:** `thesis beta × convexity / time cost`. No hardcoded instrument preferences.
- **Bet size:** $100,000. Payoff scenarios at real dollar amounts.
- **Goal:** One trade. Not a portfolio.
- **Time horizon:** Match to thesis. Catalyst date → price-in window → trade horizon.

## Usage

Installed as a Claude Code skill via symlink:

```
~/.claude/skills/belief-router -> /Users/satoshi/dev/belief-skill/v2/belief-router
```

Triggered by: `/belief-router`, "trade this", "how would I trade this", "express this view", or any directional thesis.

## Current stage

SKILL.md across 5 phases with shape-based routing. Thesis shape classification gates instrument search. Metric-based ranking replaces raw convexity. Cross-check enforces cross-class comparison. 10 formatting principles. Adaptation table for 4 instrument types. Reference files loaded on-demand.

## What's next

- [ ] Output format flag: Telegram vs Obsidian MD
- [ ] Card image generation for shareable trade cards
- [ ] Trade memory storage design (for OpenClaw/Claude Code instances)
- [ ] Live funding rate data for perps (currently estimated)

## What's blocked

- LEAPS options pricing: can't scrape live LEAPS data programmatically (Yahoo/Barchart require JS rendering)
- Kalshi quantum markets: no active quantum computing contracts found
