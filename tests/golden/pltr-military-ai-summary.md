# Golden Test: "US military will become biggest AI buyer"

**Session ID:** a4a14a3f-25cc-4bc5-a356-c8275fddf9d0
**Date:** 2026-02-16
**Verdict:** PASS (after bug fix) — correct routing, discovered real adapter gap, self-corrected

## Input
```
/belief-router i think that at some point the american military will become the biggest buyer
of ai/compute/hardware, but i don't know which one or where the spend will specifically go,
but i just think that the entire american ai buildout is truly the underpinnings of the new
cold war (the ai race between america and china) and i want to bet on america...
```

## What Claude Did (trace)

1. **track.ts check** — no prior beliefs
2. **Read** — 3 reference files
3. **research-agent** — backgrounded deep research on US military AI spending
4. **Kalshi instruments** — "military AI defense spending" → 0 results
5. **Robinhood instruments** — PLTR, ITA, PPA, DFEN, XAR, BAH, LDOS, LMT, NOC, RTX, LHX → all found
6. **Robinhood instruments** — SHLD, GD, KTOS, AVAV, BIGB, RKLB, ARES, FTNT → found
7. **Kalshi instruments** — "defense budget" → 0 results
8. **Robinhood returns** — PLTR option, PLTR stock, KTOS option, ITA option, BAH option, BAH stock
9. **WebSearch x4** — SHLD ETF holdings, US defense AI spending, PLTR valuation, BAH DOGE risk
10. **Angel instruments** — 0 results
11. **research-agent completes** — key finding: military is NOT biggest AI buyer today ($13.4B vs $50-80B from hyperscalers)
12. **Output: PLTR shares $131.41 long** — correctly chose shares over options (structural thesis, no catalyst)

### User follow-up: "Is it available on Hyperliquid?"

13. **Hyperliquid instruments** — "PLTR" → 0 results (BUG: only queried crypto perps)
14. **User provided link**: https://app.hyperliquid.xyz/trade/xyz:PLTR
15. **debug-agent** — found root cause: adapter doesn't query HIP-3 xyz dex
16. **FIX implemented** — instruments.ts, returns.ts, track.ts all updated to query both dexes
17. **Re-run: PLTR found** — xyz:PLTR-PERP with -26% annualized funding
18. **Re-routed: xyz:PLTR-PERP 3x long** — better payoff shape, negative funding pays longs

## Final Output
```
xyz:PLTR-PERP · 3x LONG · HYPERLIQUID
$10K margin · $129.35 · liq $86.22

$86      -$10,000 (-100%)   liquidated
$129     +$645/mo (+6.5%)   flat — funding income only
$175     +$12,500 (+125%)   Wall Street PT + 3mo funding
$210     +$20,600 (+206%)   re-tests ATH + 3mo funding

Alt: PLTR shares $131.41 long Robinhood (no leverage, no liq risk, [Regulated])
```

## What Was Correct
- Identified PLTR as best pure-play military AI (not LMT/RTX old defense)
- DOGE analysis: PLTR is the replacement, not the victim (unlike BAH)
- Research agent honest correction: military is NOT biggest buyer today
- Chose shares over options (structural thesis, no catalyst date)
- After fix: negative funding discovery was a genuine edge insight
- Scenario table with all numbers sourced from adapters

## Bug Found & Fixed
- **Hyperliquid xyz dex**: Adapter only queried default crypto perps (229 assets). Missed HIP-3 builder dexes containing equities (PLTR, AAPL, TSLA), commodities (GOLD), and FX (DXY, EUR). Fixed in instruments.ts, returns.ts, track.ts to query both dexes in parallel.

## What Would Be Wrong
- Picking LMT/RTX/NOC (old defense, not AI layer)
- Picking DFEN (3x ETF with only 5-6% PLTR, mostly old defense)
- Using options (no catalyst date, theta works against structural thesis)
- Missing PLTR on Hyperliquid after the fix
