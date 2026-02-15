# 🧠 Belief Router

**Turn any market thesis into a trade plan in seconds.**

You say: *"I think China's AI progress will trigger massive US military spending"*

You get: A ranked list of exactly what to buy, how much, and why — across stocks, ETFs, crypto, and pre-IPO opportunities. Sized to your actual portfolio. With specific invalidation triggers so you know when to get out.

---

## What It Does

1. **You express a belief** — any thesis about markets, tech, geopolitics, anything
2. **It decomposes your thesis** into tradeable sub-themes
3. **Finds instruments** you wouldn't have thought of — across every asset class
4. **Ranks them** by thesis alignment, valuation, catalysts, and liquidity
5. **Sizes positions** against your real portfolio — respects what you already hold, flags concentration risk
6. **Outputs a trade plan** you can act on immediately

## Quick Start

```bash
# Install
bun install

# Run a thesis
bun run scripts/router.ts "AI coding agents will replace junior devs within 2 years" --budget 10000

# With your portfolio for personalized sizing
bun run scripts/router.ts "Stablecoin regulation benefits Coinbase" \
  --portfolio path/to/state.json \
  --budget 15000
```

## Example Output

```
🧠 THESIS: China catching up in AI → US military AI spending
Confidence: High | Horizon: 6-18 months

#1  BAH   Long  $3,070  ⭐⭐⭐⭐
    11.8x PE — undervalued vs sector. $9.8B mcap.

#2  SAIC  Long  $3,028  ⭐⭐⭐⭐
    11.1x PE — undervalued vs sector. $4.0B mcap.

#3  LDOS  Long  $2,942  ⭐⭐⭐
    16.5x PE — reasonable. $22.6B mcap.

#4  LMT   Long  $2,814  ⭐⭐⭐
    30.4x PE. $151B mcap.

#5  PPA   Long  $2,772  ⭐⭐⭐
    Diversified defense exposure. $176.10.

#6  ANDURIL  Long  $0  ⭐⭐⭐
    Pre-IPO. Anduril Industries. Access via EquityZen/Forge.

📊 PORTFOLIO: $530K total | $83K liquid
❌ INVALIDATION: China AI stalls, US budget cuts, peace dividend
```

## What Makes It Different

- **Multi-asset** — doesn't just give you stocks. Finds ETFs, crypto tokens, options plays, and pre-IPO secondaries
- **Portfolio-aware** — knows what you already hold. Won't pile into positions you're already overweight on
- **Finds the non-obvious** — BAH at 11.8x PE is the real defense AI play, not PLTR at 208x
- **Thesis-specific invalidation** — tells you exactly what kills the thesis, not generic "if things change"
- **No paid APIs** — runs entirely on free data (Yahoo Finance, CoinGecko, DexScreener)

## As an OpenClaw Skill

This is designed to run as an [OpenClaw](https://openclaw.ai) skill. Drop the folder into your skills directory and it triggers when you express a market thesis in conversation:

> "I think stablecoin regulation passing would be huge for Coinbase"

Your agent handles the rest.

## Coverage

- **23 themes** — defense, AI, crypto, biotech, energy, fintech, space, quantum, and more
- **218+ tickers** mapped across stocks, ETFs, and crypto
- **7 pre-IPO secondaries** — Anduril, Anthropic, OpenAI, Shield AI, Scale AI, SpaceX, Databricks
- **8 test scenarios** validated — from defense AI to vague theses to portfolio contradictions

## Data Sources

| Source | What | Cost |
|--------|------|------|
| Yahoo Finance | Stocks, ETFs — price, PE, market cap, volume | Free |
| CoinGecko | Major crypto — price, market cap, volume | Free |
| DexScreener | DEX tokens — price, liquidity, market cap | Free |
| Brave Search | Instrument discovery, catalyst research | Free |

## Run Tests

```bash
bun run tests/run-tests.ts
```

---

*Not financial advice. This is a research tool, not a trading platform. It doesn't place orders — it helps you think.*
