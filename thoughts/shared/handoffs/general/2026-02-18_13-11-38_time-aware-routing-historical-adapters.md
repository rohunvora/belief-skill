---
date: 2026-02-18T18:11:38+0000
session_name: general
researcher: claude
git_commit: 2a935d5c9543bbd1cd7f54b104cc646352ae45a4
branch: main
repository: belief-skill
topic: "Time-Aware Routing: Historical Price Adapters + Design"
tags: [belief-router, historical-prices, backtest, time-awareness, adapters, skill-design]
status: complete
last_updated: 2026-02-18
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: Time-Aware Routing — Historical Adapters + SKILL.md Design

## Task(s)

### 1. Price Ladder Rendering on Permalink (COMPLETED)
Added `price_ladder` rendering to `board/templates/permalink.ts`. The data was already stored in the `trade_data` blob but never displayed. New section shows a sorted grid of price levels with colored bars (red=loss, green=gain), PnL percentages, and labels. Visually matches the derivation chain section (same gray card, uppercase header). Verified on both HYPE and BTC Kalshi cards in browser.

### 2. Historical Price API Validation (COMPLETED)
User wanted to build a "backtest" feature for old takes — paste a year-old podcast, see how the predictions performed. Before committing to the design, we validated whether historical price APIs are feasible across all platforms. Ran 4 parallel agents making actual API calls.

**Results:**

| Platform | API | Auth needed | Lookback | Verdict |
|----------|-----|-------------|----------|---------|
| Yahoo Finance | v8 chart + `Cookie: A3=d=x` header | None | Unlimited | **GO** |
| Hyperliquid | candleSnapshot POST | None | Back to 2020 | **GO** |
| Kalshi | elections API resolved markets + candles | None | Full lifetime | **GO** |
| Polymarket | Gamma API closed markets + CLOB price history | None | Full lifetime | **GO** |
| CoinGecko | /coins/{id}/history | None | **365 days only** (free tier) | **PARTIAL** |

### 3. Historical Price Adapter Scripts (COMPLETED)
Built 4 new adapter scripts, all tested with Jan 2, 2025 data (13 months ago):

- `scripts/adapters/robinhood/historical.ts` — Yahoo Finance chart API with Cookie header trick
- `scripts/adapters/hyperliquid/historical.ts` — candleSnapshot API, no auth
- `scripts/adapters/kalshi/historical.ts` — resolution lookup + candlestick price-at-date, dual mode
- `scripts/adapters/coingecko/historical.ts` — spot prices with 365-day limit, ticker-to-slug mapping, rate limit retry

Each outputs structured JSON to stdout with error handling + cross-adapter redirect suggestions on failure.

### 4. SKILL.md Time-Awareness Design (DISCUSSED, NOT IMPLEMENTED)
Core design discussion completed. Key product insight from user: when someone pastes old content, they want two things:
1. **The takes as they were** — faithfully reconstructed at source-date prices
2. **The scorecard** — how each take performed from then to now (like backtesting)

This changes the skill from a trade prescription engine to also being a track record evaluator.

## Critical References
- `SKILL.md:486-527` — POST to board section (updated in prior session with caller_id fix)
- `board/templates/permalink.ts` — now includes price ladder rendering
- `board/types.ts:140-145` — `PriceLadderStep` interface

## Recent changes
- `board/templates/permalink.ts:69-89` — Added price ladder HTML generation (sorted, scaled bars, color-coded)
- `board/templates/permalink.ts:202-252` — Added CSS for `.ladder-section`, `.ladder-row`, `.ladder-bar-wrap`, `.ladder-label-row`
- `board/templates/permalink.ts:266` — Inserted `${ladderHtml}` between chain and reasoning sections
- `scripts/adapters/robinhood/historical.ts` — NEW: Yahoo Finance historical price lookup
- `scripts/adapters/hyperliquid/historical.ts` — NEW: Hyperliquid candle historical lookup
- `scripts/adapters/kalshi/historical.ts` — NEW: Kalshi resolution + price-at-date lookup
- `scripts/adapters/coingecko/historical.ts` — NEW: CoinGecko spot price lookup (365-day limit)

## Learnings

### Historical API Findings (validated with actual calls)
- **Yahoo Finance** requires a `Cookie` header with ANY value (even `A3=d=x`) to avoid 429. Without it, every request is rate-limited. No actual auth needed.
- **Hyperliquid** candleSnapshot goes back to Sep 2020 (oracle data) and Apr 2023 (real trading). No auth, no visible rate limits. Much deeper than the 30 days our existing adapter uses.
- **Kalshi** uses `api.elections.kalshi.com` (NOT `trading-api.kalshi.com` which requires auth). Resolved markets accessible via `?status=finalized`. Candlestick endpoint needs series ticker (inferred by stripping last dash-segment from market ticker).
- **Polymarket** Gamma API serves resolved markets with `?closed=true`. `outcomePrices` shows `["1","0"]` for resolution. CLOB API price history only works with `fidelity=1440` (daily). Some very old markets have empty history.
- **CoinGecko** free tier limited to 365 days. Rate limit ~5-10 req/min, 429 with `retry-after: 52` on burst. The `/market_chart/range` endpoint is broken for free users — only `/history` and `/market_chart?days=N` work. CoinCap (alternative) is dead — DNS fails.

### 85% of Old Takes Have No Prices
Extracted 20 predictions from the All-In Podcast 2025 predictions episode (Jan 2025). Only 3 (15%) mentioned specific prices, and those were illustrative (hardware costs, historical returns), not entry prices. Zero traditional price targets. **This means content-extracted prices are a supplement, not the backbone. Historical API lookup is required for backtesting to work.**

### All-In Podcast Test Case
- URL: `https://www.youtube.com/watch?v=HxNUAwBWX4I`
- Speakers: Jason Calacanis, Chamath Palihapitiya, David Sacks, David Friedberg, Gavin Baker (Atreides, ~$4B)
- 20 predictions extracted, covering TSLA, AAPL, UBER, OpenAI, robotics, politics, prediction markets
- 2 "super predictions" posted to Polymarket (Chamath + Sacks both bearish OpenAI)
- Transcript extracted via yt-dlp: 20,604 words
- Most predictions are narrative/directional without price targets — confirms need for historical price APIs

### Time-Aware Routing Design (Conceptual)
The user rejected rigid "Replay Mode" with 30-day threshold. Instead:
- `source_date` is a continuous input to the pipeline, not a mode switch
- `delta = now - source_date` modulates each phase naturally
- When delta ≈ 0: output is identical to current behavior (pure prescription)
- When delta > 0: each phase adds temporal context (price then vs now, thesis status)
- No branching logic needed — every take gets `price_then` and `price_now`; when they're equal, it's a fresh take

The pipeline phases become:
1. **Parse** — extract theses + `source_date` (only new input)
2. **Sweep** — historical adapter call (price at source_date) + existing adapter call (price now)
3. **Route** — calculate ACTUAL returns instead of hypothetical
4. **Output** — naturally shifts: prescription → scorecard based on delta size

Three output states emerge from the same continuous logic:
- **Still live** — thesis hasn't resolved, edge may remain, show updated entry
- **Resolved/validated** — thesis played out, show full P&L
- **Expired** — instrument no longer available or thesis invalidated

## Post-Mortem

### What Worked
- **Parallel validation agents** — running 4 API test agents simultaneously (Yahoo, CoinGecko, Hyperliquid, Polymarket/Kalshi) was very efficient for go/no-go assessment
- **Actual API calls over docs** — reading API documentation would have missed the Yahoo Finance Cookie trick and the CoinGecko 365-day limit. Live testing caught both.
- **Prediction extraction from transcript** — using an Explore agent to extract all 20 predictions and classify price-mention frequency gave the critical 85% finding that shaped the entire design
- **Price ladder rendering** — matching the existing derivation chain visual pattern (gray card, uppercase header, 13px text) made it feel native immediately

### What Failed
- **CoinGecko `/market_chart/range` endpoint** — completely broken for free tier despite being documented. Wasted a test on it.
- **CoinCap as alternative** — DNS resolution fails entirely, service appears dead. Not a viable fallback.
- **Initial "Replay Mode" design** — user correctly pushed back on rigid 30-day threshold and discrete modes. Led to much better continuous `source_date` design.

### Key Decisions
- **Decision:** Time-awareness via continuous `source_date` parameter, not discrete modes
  - Alternatives: "Replay Mode" with 30-day threshold, explicit mode flag
  - Reason: User insight — time is a sliding scale, not a switch. Same pipeline, richer context.
- **Decision:** Build separate `historical.ts` per adapter rather than unified historical service
  - Alternatives: Single `scripts/historical.ts` with platform routing
  - Reason: Matches existing adapter pattern (`instruments.ts`, `returns.ts`, now `historical.ts`). Each platform has different API shapes.
- **Decision:** CoinGecko gap (>365 days) documented as limitation with Hyperliquid redirect
  - Alternatives: Pay for CoinGecko API ($129/mo), build historical data cache
  - Reason: Hyperliquid covers major crypto. Gap only affects exotic tokens >1 year old — narrow edge case.

## Artifacts
- `board/templates/permalink.ts` — price ladder rendering (lines 69-89 for HTML, 202-252 for CSS)
- `scripts/adapters/robinhood/historical.ts` — NEW: Yahoo Finance historical
- `scripts/adapters/hyperliquid/historical.ts` — NEW: Hyperliquid historical
- `scripts/adapters/kalshi/historical.ts` — NEW: Kalshi historical (dual mode)
- `scripts/adapters/coingecko/historical.ts` — NEW: CoinGecko historical (with 365-day limit handling)

## Action Items & Next Steps

1. **Design the SKILL.md time-awareness changes** — The conceptual design is solid but the actual SKILL.md prompt edits haven't been written. Key sections to modify:
   - Phase 1 (Parse): Add `source_date` extraction logic
   - Phase 2 (Sweep): Add historical price lookup calls alongside current price lookups
   - Phase 3 (Route): Modify return calculations to use actual (historical→current) returns when delta > 0
   - Phase 4 (Output): Define the scorecard output format — how the take text shifts with delta

2. **Design the scorecard card format for the board** — Current board cards are trade prescriptions. A time-aware card needs: source date, entry price at that time, current price, P&L, thesis status (still live / resolved / expired). This may require new fields in `board/types.ts` (`source_date`, `price_at_source`, `thesis_status`) and new rendering in `permalink.ts`.

3. **End-to-end test with All-In predictions** — The transcript is already extracted (20,604 words, 20 predictions). Route 2-3 predictions through the full time-aware pipeline to validate the design works. Good test cases:
   - TSLA (stock, Yahoo Finance historical) — $379.28 on Jan 2, 2025
   - OpenAI nonprofit conversion (Polymarket, resolved) — Chamath's super prediction
   - Apple smartphone decline (stock, Yahoo Finance) — $243.85 on Jan 2, 2025

4. **Consider Polymarket adapter script** — We validated the Gamma API works but didn't build a `scripts/adapters/polymarket/historical.ts`. Should add one for completeness since we have Kalshi already.

## Other Notes

- The board server runs on port 4000 via `bun run board/server.ts`. Verified both HYPE card (http://localhost:4000/t/4f6be5ac-4) and BTC Kalshi card (http://localhost:4000/t/a2361904-f) render price ladders correctly.
- Yahoo Finance Cookie trick: `curl -s -H "Cookie: A3=d=x" "https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=X&period2=Y&interval=1d"` — any cookie value works, the edge CDN just checks for presence.
- Kalshi's `api.elections.kalshi.com` is the correct public endpoint. The old `trading-api.kalshi.com` returns 401 (auth required).
- For the All-In test case: most predictions are non-priced narrative takes (robotics will be huge, auto OEMs will collapse, OpenAI will fail). The backtest value for these is binary (happened/didn't) rather than P&L-based. The skill needs to handle both: priced takes (P&L scorecard) and narrative takes (outcome classification).
- Price points at session end (Feb 18, 2026): BTC ~$67,240, ETH ~$1,978, TSLA check via Yahoo, AAPL check via Yahoo.
