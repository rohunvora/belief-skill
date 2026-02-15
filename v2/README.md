# Belief Router v2

Claude Code skill that routes a thesis into a single highest-upside trade expression through elimination reasoning.

**One thesis → live research → elimination → one trade.**

## How it works

| Phase | What happens |
|-------|-------------|
| 1. Extract | Separate surface claim from deeper claim. Extract time horizon (catalyst, price-in window, trade horizon). |
| 2. Research | Parallel web searches for live data: prices, valuations, consensus. Check trade history. |
| 3. Eliminate | 4-8 candidates across platforms, cut with evidence to 1 winner. Stress-test the pick. |
| 4. Validate | Run adapter scripts for live pricing on 2-3 survivors. Build payoff table. |
| 5. Format | Compress into reader-facing output. Minto Pyramid: belief first, details last. |

## Key design decisions

- **Adaptation table, not branching templates.** One equity-long reference template + a compact table that tells Claude what to swap for Kalshi binaries, perps, and options. 12 lines instead of 200.
- **Context before ticker.** Reader knows WHAT they're buying before they see the symbol. Company description for equities, contract description for Kalshi, position description for perps.
- **Asymmetric framing.** Downside in dollar losses (lose $60K). Upside in multiples (3x, 5x). Prospect theory — losses as pain, gains as excitement.
- **Time-aware scenarios.** Every payoff row has a rough timeline. A 3x in 2 years and a 3x in 8 years are different trades.
- **Three thinking frames.** Directional (who benefits/loses), probability (market price vs yours), relative (ratio + convergence). Not all theses are supply-chain reasoning.
- **Telegram-native formatting.** Monospace code blocks, `────` dividers, column alignment. No markdown tables (break on mobile).

## Platforms

| Platform | Adapter | Instruments |
|----------|---------|-------------|
| Robinhood | `scripts/adapters/robinhood/` | Stocks, ETFs, options (via Yahoo Finance) |
| Hyperliquid | `scripts/adapters/hyperliquid/` | Perps (via live API) |
| Kalshi | `scripts/adapters/kalshi/` | Binary contracts (via API) |
| Bankr | `scripts/adapters/bankr/` | Tokens (via AI agent) |

## Defaults

- **Risk mode:** Max upside. Ruin risk acceptable. Deprioritize (not eliminate) capped-upside instruments.
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

SKILL.md at 484 lines across 5 phases. Output template generalized across 4 instrument types (equity, Kalshi binary, perps, options). 10 formatting principles. Reference files loaded on-demand for instrument reasoning, portfolio construction, and blindspots/risk.

## What's next

- [ ] Output format flag: Telegram vs Obsidian MD
- [ ] Card image generation for shareable trade cards
- [ ] Trade memory storage design (for OpenClaw/Claude Code instances)

## What's blocked

- LEAPS options pricing: can't scrape live LEAPS data programmatically (Yahoo/Barchart require JS rendering)
- Kalshi quantum markets: no active quantum computing contracts found
