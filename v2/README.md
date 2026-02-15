# Belief Router v2

Claude Code skill that routes a thesis into a single highest-upside trade expression through elimination reasoning.

**One thesis → live research → elimination → one trade.**

## How it works

| Phase | What happens | Where |
|-------|-------------|-------|
| 1. Extract | Separate surface claim from deeper claim. Find the causal chain. | Thinking |
| 2. Research | 2-3 parallel web searches for live data: prices, valuations, consensus. | Thinking |
| 3. Eliminate | 4-8 candidates across platforms, cut with evidence to 1 winner. | Thinking |
| 4. Validate | Run adapter scripts for live pricing on 2-3 survivors. | Thinking |
| 5. Present | Assemble full verbose reasoning (internal only). | Thinking |
| 6. Format | Compress into reader-facing output. Inverted pyramid: trade first, essay last. | Output |

## Key design decisions

- **MC-first, not price-first.** Payoff table leads with market cap. Comparable column shows which companies get flipped at each tier.
- **Inverted pyramid output.** Trade → Payoff → Why (3 bullets) → Kills → Eliminations (table) → Deeper claim → Execute. ADHD-friendly.
- **Two-pass architecture.** Phases 1-5 think verbose for reasoning fidelity. Phase 6 compresses for the reader. Thinking depth is never sacrificed for output brevity.
- **Telegram-native formatting.** Monospace code blocks instead of markdown tables (tables break on mobile). No collapsible sections. Sources in Obsidian callout for MD output only.

## Platforms

| Platform | Adapter | Instruments |
|----------|---------|-------------|
| Robinhood | `scripts/adapters/robinhood/` | Stocks, ETFs, options (via Yahoo Finance) |
| Hyperliquid | `scripts/adapters/hyperliquid/` | Perps (via live API) |
| Kalshi | `scripts/adapters/kalshi/` | Binary contracts (via API) |
| Bankr | `scripts/adapters/bankr/` | Tokens (via AI agent) |

## Defaults

- **Risk mode:** Max upside. Ruin risk acceptable. Prefer uncapped instruments.
- **Bet size:** $100,000. Payoff scenarios at real dollar amounts.
- **Goal:** One trade. Not a portfolio.

## Usage

Installed as a Claude Code skill via symlink:

```
~/.claude/skills/belief-router -> /Users/satoshi/dev/belief-skill/v2/belief-router
```

Triggered by: `/belief-router`, "trade this", "how would I trade this", "express this view", or any directional thesis.

## What's next

- [ ] Output format flag: Telegram vs Obsidian MD (auto-detect or explicit)
- [ ] Telegram-optimized format (monospace blocks, no tables, no collapsible)
- [ ] Card image generation for shareable trade cards
- [ ] Track record integration (record → check → close → card)

## What's blocked

- LEAPS options pricing: can't scrape live LEAPS data programmatically (Yahoo/Barchart require JS rendering). Currently estimating from Black-Scholes + IV.
- Kalshi quantum markets: no active quantum computing contracts found.
