---
name: belief-router
description: >
  Thesis-to-trade router. Takes natural language beliefs about markets, geopolitics,
  technology, or culture and outputs ranked, portfolio-aware trade recommendations
  across stocks, ETFs, crypto, options, and pre-IPO secondaries.
  Use when: (1) user expresses a market thesis ("I think X will happen"),
  (2) user makes an observation with investment implications ("Bugatti customers are all crypto bros"),
  (3) user asks for trade ideas ("what should I buy if..."),
  (4) user mentions a macro theme with trading intent,
  (5) user says "belief router", "trade this thesis", "how do I trade...",
  (6) user asks to review past theses.
  NOT for: executing trades, managing funds, or anything requiring private keys.
---

# Belief Router

When the user expresses a belief with tradeable implications, decompose it into instruments
and produce actionable, portfolio-aware trade recommendations.

## Pipeline

### 1. DECOMPOSE the thesis

Extract from the user's message:
- **Core claim** — one-sentence directional statement
- **Direction** — long, short, or pair trade
- **Confidence** — high/medium/low (from language certainty)
- **Time horizon** — days/weeks/months/years
- **Instruments** — tickers with direction and reasoning
- **Invalidation** — specific conditions that kill this thesis

Think in causal chains:
- First-order: who benefits directly?
- Second-order: suppliers, picks-and-shovels?
- Who gets hurt? (short candidates)
- Diversified play? (ETFs)
- Pre-IPO angle? (check `references/secondaries.json`)

Direction from language:
- Bullish: "will moon", "explode", "undervalued", "bull run"
- Bearish: "crash", "replace", "kill", "overvalued"
- Pair: "X will flip Y" → long X, short Y

For unknown tickers or tokens, use `web_search`.

### 2. ENRICH with market data

```bash
bun run scripts/research.ts --tickers "TICK1,TICK2,TICK3" --format json
```

Fetches from Yahoo Finance (stocks/ETFs), CoinGecko (crypto), DexScreener (DEX tokens).

### 3. SIZE positions

```bash
bun run scripts/size.ts --tickers "TICK1:long,TICK2:short" --budget 20000 --portfolio path/to/state.json
```

Kelly-inspired sizing with portfolio overlap detection and concentration limits.

### 4. FORMAT output

Telegram-friendly (< 4000 chars):

```
🧠 THESIS: [claim]
Confidence: [H/M/L] | Horizon: [timeframe]

#1  TICK  Direction  $Amount  ⭐⭐⭐⭐
    [2-line rationale with data]

📊 PORTFOLIO: $[total] | $[liquid] available
⚠️ [warnings]

❌ INVALIDATION
• [specific condition]
```

## Rules

### Portfolio awareness
- Portfolio: ~$530K crypto, $83K USDC, $126K bank
- Thesis CONTRADICTS existing positions → lead with warning
- Thesis ADDS to existing exposure → flag concentration
- Already exposed → say "you ARE this trade"

### Invalidation must be specific
❌ "If the thesis proves incorrect"
✅ "If GENIUS Act fails Senate vote in Q2"
✅ "If NVDA misses Feb 25 earnings, exit within 24h"

### Multi-asset coverage
Every thesis: stocks, ETFs, crypto, pre-IPO (`references/secondaries.json`), short candidates.

### Confidence calibration
- High → concentrated, larger, fewer instruments
- Low → diversified, more ETFs, smaller
- Vague → ask ONE question OR proceed conservatively

## Reference data

- `references/theme-map.json` — 29 themes, 220+ tickers. Inspiration, not lookup.
- `references/secondaries.json` — Pre-IPO companies (Anduril, Anthropic, OpenAI, SpaceX, etc.)
- `references/ticker-context.json` — Curated context for richer rationale.

## Discovery tool

For unfamiliar themes where you need help finding tickers:

```bash
bun run scripts/discover.ts "lithium recycling stocks ETFs"
```

Uses Brave Search to find relevant tickers. Prefer your own knowledge + `web_search` first.
