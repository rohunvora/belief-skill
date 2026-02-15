# Belief Router — Architecture

## Core Principle

**Claude IS the router.** This is an OpenClaw skill — the agent running it is already an LLM. 
The skill provides **tools** (CLI scripts) and **structure** (SKILL.md). The agent provides intelligence.

No external LLM API calls. No hardcoded model names. The agent's own reasoning decomposes theses,
maps to instruments, and writes narratives. Scripts only fetch data and do math.

## Pipeline

```
User message → Agent (Claude) decomposes thesis
                    ↓
              web_search for unfamiliar tickers/themes
                    ↓
              research.ts --tickers "X,Y,Z" (market data)
                    ↓
              size.ts --tickers "X:long,Y:short" (portfolio math)
                    ↓
              Agent formats output
```

## Scripts (Tools)

| Script | Purpose | CLI |
|--------|---------|-----|
| `research.ts` | Fetch market data (Yahoo Finance, CoinGecko, DexScreener) | `--tickers "AAPL,SOL" --format json` |
| `size.ts` | Portfolio-aware position sizing (Kelly criterion) | `--tickers "AAPL:long,GOOG:short" --budget 20000` |
| `discover.ts` | Web search for tickers related to a concept | `"lithium recycling stocks"` |

## What the Agent Does (not scripts)

- Parse thesis intent, direction, confidence
- Map beliefs to instrument ideas (causal chain reasoning)
- Decide when to web_search vs use known tickers
- Score relevance of discovered instruments
- Write narrative output with specific rationale
- Detect portfolio contradictions

## Reference Data

- `references/theme-map.json` — 29 themes, 220+ tickers. Inspiration, not a lookup table.
- `references/secondaries.json` — Pre-IPO companies (Anduril, Anthropic, etc.)
- `references/ticker-context.json` — Curated context strings for richer rationale.

## Test Suite

- `tests/run-tests.ts` — 8 behavioral scenarios (automated, uses router.ts CLI)
- `tests/run-tweet-tests.ts` — 48 real-world tweets (automated)
- `router.ts` — Standalone CLI for testing only. In production, the agent IS the router.
