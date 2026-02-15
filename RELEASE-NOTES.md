# Belief Router — Release Notes

**Date:** February 14, 2026  
**Status:** Gate 1 ✅ | Gate 2 ✅ | Gate 3 ✅ Complete

---

## What's Built

A fully functional thesis-to-trade routing skill that takes natural language beliefs and outputs ranked, portfolio-aware trade recommendations across stocks, ETFs, crypto, and pre-IPO secondaries.

### Core Pipeline (scripts/)
- **router.ts** — Main orchestrator with thesis parsing, history, and replay
- **instruments.ts** — Theme-based instrument discovery (23 themes, 218+ tickers)
- **research.ts** — Multi-source enrichment (Yahoo Finance, CoinGecko, DexScreener) with TTL caching
- **rank.ts** — Weighted scoring (thesis alignment 40%, valuation 20%, catalyst 20%, liquidity 10%, fit 10%) + short-direction detection
- **size.ts** — Kelly-inspired portfolio-aware sizing with adaptive slot allocation, overlap detection, and concentration limits

### Frontend (frontend/)
- Next.js dark-theme dashboard at localhost:3001
- TradeCard component (the viral shareable unit)
- Thesis detail pages with full position breakdown
- REST API endpoints
- New Thesis input form

### Data (references/)
- **theme-map.json** — 23 themes, 218 tickers covering defense, AI, crypto, biotech, fintech, space, quantum, commodities, and more
- **secondaries.json** — Pre-IPO registry (Anduril, Shield AI, Scale AI, Anthropic, OpenAI, SpaceX, Figure AI)
- **etf-themes.json** — ETF → theme mapping

---

## Test Results

```
8/8 scenarios passing

✅ Defense AI (Gold Standard)     — BAH, SAIC, LDOS, LMT, FXI, PPA, ANDURIL
✅ Stablecoin Regulation          — PYPL, CRV, V, MA, COIN, MKR
✅ Bear Thesis (Short Bias)       — MSFT, GOOG, CRM, SNOW + RHI (SHORT)
✅ Crypto-Native (SOL > ETH)      — BONK, JUP, RAY, WIF, PYTH + ARB, OP (SHORT)
✅ Vague Thesis                   — AMT, VNQ, XLRE, IYR, RKT (all SHORT)
✅ Multi-Asset Class              — HYG, JPM, BAC, GS, MS, TLT, CRV, SNX
✅ GLP-1 / Biotech                — NVO, PFE, VRTX, XBI, AMGN, IBB
✅ Contrarian China Long          — FXI, PDD, JD, BIDU, KWEB, BABA
```

### Performance
- Cached: 0.4s
- Cold (stocks): 0.7s
- Cold (crypto): 2.0s
- Target was <30s ✅

---

## Sample Output (Scenario 1: Defense AI)

```
🧠 THESIS: China is catching up in AI. This will trigger massive US military AI spending.
Confidence: High | Horizon: 6-18 months
Themes: defense ai, cybersecurity, energy ai, china

#1  BAH   Long  $3,070  ⭐⭐⭐⭐  11.8x PE — undervalued vs sector
#2  SAIC  Long  $3,028  ⭐⭐⭐⭐  11.1x PE — undervalued vs sector
#3  LDOS  Long  $2,942  ⭐⭐⭐   16.5x PE — reasonable
#4  LMT   Long  $2,814  ⭐⭐⭐   30.4x PE
#5  FXI   Long  $2,814  ⭐⭐⭐   Diversified china exposure
#6  PPA   Long  $2,772  ⭐⭐⭐   Diversified defense ai exposure
#7  ANDURIL  $0         📎 Pre-IPO opportunity (EquityZen/Forge)

❌ INVALIDATION
• US defense budget cuts override AI spending priorities
• China AI progress stalls or pivots to non-military applications
• Government cyber spending shifts to in-house solutions
• Major consolidation reduces number of public cyber plays
```

---

## Known Limitations

1. **No LLM-enhanced scoring** — thesis_alignment and catalyst_proximity are heuristic, not Claude-scored. In conversational mode, Claude should override these scores.

2. **Gold standard gap** — The automated output finds the right instruments but lacks the depth of the manual research memo (specific contract values, budget data, TAM analysis). This is by design — the pipeline provides the structure, conversational mode adds the depth.

3. **Yahoo Finance fragility** — Some tickers fail (SQ, RDFN, HAYS) with `undefined is not an object`. The pipeline gracefully degrades but loses those candidates.

4. **CoinGecko rate limits** — 429 errors common during rapid test runs. Caching + DexScreener fallback mitigate this.

5. **No options support yet** — Theme map has no options strategies. For leveraged plays, the skill should suggest options in conversational mode.

6. **Invalidation is theme-level, not thesis-level** — "If GENIUS Act fails" is more specific than "Stablecoin regulation restricts rather than enables." Claude should refine invalidation in conversational mode.

---

## Gate 3 Completed

- [x] Counter-thesis generation (`--counter` flag: shows max loss, per-position risk, hedge suggestions)
- [x] Learning from outcomes (`scripts/track.ts`: compares thesis-time vs current prices, gives verdict)
- [x] 13 test scenarios (8 original + 5 new: quantum+biotech, commodities, space, fintech, robotics)
- [x] History/replay system (`history`, `replay <id>` subcommands)
- [x] 23 themes, 218 tickers in theme-map
- [x] Theme-specific invalidation for all 23 themes
- [ ] Options strategy suggestions (future — needs options pricing data)
- [ ] Claude-scored thesis alignment (available in conversational mode, not CLI)
