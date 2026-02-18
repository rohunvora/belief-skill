---
date: 2026-02-17T03:48:44-0500
session_name: general
researcher: claude
git_commit: d6662527284282becf67a92f8da179da01ad45b8
branch: belief-board-v4
repository: belief-skill
topic: "belief.board v4 — Live Prices, Twitter PFPs, Real Data Only"
tags: [belief-board, frontend, live-prices, design-iteration, real-data]
status: complete
last_updated: 2026-02-17
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: belief.board v4 — Live Prices, Real PFPs, Fake Data Purged

## Task(s)

1. **Resume from previous prototype session** (completed) — Ingested handoff from `thoughts/shared/handoffs/general/2026-02-17_01-13-10_belief-board-v4-frontend-prototype.md`. Fixed branch situation (board files were untracked on `main`, committed them to `belief-board-v4`).

2. **Integrate Shkreli scan data** (completed) — Added Martin Shkreli as source user, integrated two deep routes: IONQ (quantum mechanical-selloff thesis) and EVR (non-obvious IPO wave play). Both have full rich detail data.

3. **Add real Twitter profile pictures** (completed) — Added `avatar_url` optional field to User type. Used Chrome browser automation to extract actual pfp URLs from X/Twitter for 4 real sources: @MartinShkreli, @chamath, @notthreadguy, @marginsmall. Avatar component renders `<img>` when URL available, falls back to letter circle.

4. **Add live simulated price ticking** (completed) — Created `board/hooks/useLivePrices.ts` hook. Feed cards and detail page show live ticking prices with green/red color based on position P&L.

5. **Wire up REAL price data from market APIs** (completed) — Used TeamCreate with adapter-researcher + price-implementer agents. Added `/api/prices` endpoint to board server that fetches real prices via:
   - Yahoo Finance (`yahoo-finance2` npm, already installed) for stocks: DELL, MSFT, GOOG, IONQ, EVR, LAES
   - Hyperliquid `allMids` API for perps (ETH-USD)
   - Kalshi skipped (series-to-market ticker mapping complex, falls back to simulation)
   - 30-second cache, parallel fetches via `Promise.allSettled`
   - Frontend polls every 30s, tiny random walks between polls for visual continuity

6. **Purge fake data** (completed) — User directive: "keep all this stuff real going forward." Removed all fake users (alice, degentrader, macro_mike, optionsqueen, chad_perps, thesis_machine, kalshi_kid, contrarian) and fake calls (GOOG, NVO, TSLA, KXFEDRATE, ETH-USD). Kept LAES/marginsmall (real call, user confirmed).

7. **Take log for visual shape inventory** (completed) — Created `board/TAKE-LOG.md` tracking each integrated take's shape, edge cases, and visual learnings. 4 entries so far.

## Critical References

- `thoughts/shared/plans/2026-02-16-belief-board.md` — THE implementation spec (data model, 13 API endpoints, 7 screens, resolution engine, 4-phase roadmap)
- `board/TAKE-LOG.md` — Visual shape inventory tracking jaggedness of integrated takes

## Recent changes

**New files created this session:**
- `board/hooks/useLivePrices.ts` — React hook for live price ticking (real API + interpolation)
- `board/TAKE-LOG.md` — Visual shape inventory

**Modified files:**
- `board/server.ts` — Added `/api/prices` route with Yahoo Finance, Hyperliquid, and caching. Restructured routes for API + SPA coexistence.
- `board/types.ts` — Added `avatar_url?: string` to User interface
- `board/components/CallCard.tsx` — Avatar renders `<img>` when `avatar_url` set; added `LivePriceLine` component; accepts optional `livePrice` prop
- `board/pages/Feed.tsx` — Calls `useLivePrices` hook, passes live price to each card
- `board/pages/CardDetail.tsx` — Shows prominent current price banner, highlights closest price ladder step in blue
- `board/mock-data.ts` — **Major cleanup**: only real users (satoshi, chamath, threadguy, martinshkreli, marginsmall) and real scan-sourced calls (DELL, MSFT, IONQ, EVR, LAES). Twitter pfp URLs for 4 sources.

## Learnings

### Real Twitter PFP extraction
- X/Twitter requires JS rendering — WebFetch can't extract profile images. Chrome browser automation (MCP) works: navigate to profile, run `document.querySelectorAll('img[src*="pbs.twimg.com/profile_images"]')`, filter for 400x400.
- URLs follow pattern `pbs.twimg.com/profile_images/{id}/{hash}_400x400.jpg`
- Chamath's URL starts with `-9LbG3md` — the leading dash doesn't cause issues for the browser but tripped up an earlier incorrect URL that was guessed.

### Real price API architecture
- All stock prices come from Yahoo Finance via `yahoo-finance2` npm (already a dependency) — zero API keys needed
- Hyperliquid `allMids` endpoint is public, returns all perpetual mid prices as `{ "ETH": "2650.5" }`
- Kalshi public API works for reads but the series→market ticker mapping (e.g. KXFEDRATE → KXFED-26MAR-T3.50) is complex — skipped for now
- `scripts/track.ts:17-71` has the exact dispatch pattern (`fetchPrice(platform, ticker)`) that the board API is modeled on
- 30-second server-side cache prevents API hammering; frontend does tiny random walks (±0.05%) between polls for visual continuity

### User's data philosophy
- **"Keep all this stuff real going forward"** — no more fake mock data. Every call should come from a real scan with a real source.
- marginsmall LAES call is real and should stay (marginsmall is a "legend trader")
- The GOOG short attributed to marginsmall was inaccurate and was removed

### Take shape observations (from TAKE-LOG.md)
- Shkreli IONQ: "mechanical not fundamental" thesis — rejects fundamentals, argues flow-driven drawdown. No UI slot for "you need to believe" yet.
- Shkreli EVR: "non-obvious play" shape — thesis explicitly rejects MS/GS before arriving at EVR.
- Two cards from one scan batch (same `scan_source`) — first test of batch grouping question.
- Small P&L dollar amounts on EVR ladder ($89-$201) vs IONQ ($344-$1466) — may need % normalization for bar widths.
- 4-step vs 5-step ladders — component handles variable lengths.

### Bun server gotchas
- `lsof -ti:4000 | xargs kill -9` is the reliable way to kill the server (regular `kill` doesn't always work)
- HMR doesn't pick up mock data changes — requires full server restart
- Port 4000 can show as "in use" even after kill due to socket linger; sleep 1 second before restarting

## Post-Mortem

### What Worked
- **Chrome browser automation for PFP extraction** — navigating to X profiles and querying the DOM was fast and reliable for getting real avatar URLs
- **TeamCreate for price API research** — adapter-researcher explored all 5 adapter directories in parallel, produced a comprehensive ticker→adapter→auth mapping. Implementation agent used findings to build the API in one pass.
- **Agent delegation for implementation** — live price ticking (useLivePrices hook + feed/detail integration) and real price API were both built by agents, preserving main context for design decisions

### What Failed
- **Guessing Twitter PFP URLs** — initial attempt to hardcode guessed pbs.twimg.com URLs all failed. Had to use browser automation.
- **Duplicate chamath user** — a rejected edit still partially applied, creating two chamath entries. Caught during the data cleanup pass.
- **Branch switching** — got bumped back to `main` between operations. Needed explicit `git checkout belief-board-v4` to recover.

### Key Decisions
- Decision: **Only real scan-sourced data**
  - Alternatives: Keep fake data for visual density
  - Reason: User directive — "keep all this stuff real going forward." Better to have 5 real cards than 10 half-fake ones.

- Decision: **Yahoo Finance for stock prices (no API key)**
  - Alternatives: Robinhood API (requires auth), IEX (requires key), Alpha Vantage (rate limited)
  - Reason: `yahoo-finance2` already installed, zero auth, fast. Same adapter the skill's `scripts/track.ts` uses.

- Decision: **Skip Kalshi real-time for now**
  - Alternatives: Implement full series→event→market ticker resolution
  - Reason: Complex mapping layer, only one Kalshi ticker in mock data (now removed). Can add when real Kalshi calls are integrated.

- Decision: **30s poll + tiny random walk between polls**
  - Alternatives: WebSocket streaming, 5s polling, pure simulation
  - Reason: Yahoo Finance has rate limits. 30s is conservative. Random walk (±0.05%) gives visual life between real ticks without being misleading.

## Artifacts

- `board/server.ts` — Bun.serve() with `/api/prices` route + SPA catch-all
- `board/hooks/useLivePrices.ts` — Real price polling + interpolation hook
- `board/components/CallCard.tsx` — Card with Avatar (img/letter), LivePriceLine, livePrice prop
- `board/pages/Feed.tsx` — Feed with live prices
- `board/pages/CardDetail.tsx` — Detail with live price banner + ladder highlighting
- `board/types.ts` — Call + User (with avatar_url) + PriceLadderStep interfaces
- `board/mock-data.ts` — 5 real users, 5 real scan-sourced calls only
- `board/TAKE-LOG.md` — Visual shape inventory (4 entries)
- `thoughts/shared/plans/2026-02-16-belief-board.md` — Implementation spec (unchanged)

## Action Items & Next Steps

1. **Commit current state** — All changes are uncommitted on `belief-board-v4`. Run `/commit` to save.

2. **Continue integrating real takes** — User plans to keep feeding takes for integration. Each new take: add to mock-data.ts, log shape in TAKE-LOG.md, restart server.

3. **Design iteration based on accumulated shapes** — The take log tracks visual edge cases. Key open items:
   - No UI slot for "you need to believe" framing
   - Price ladder bar width normalization (% vs $)
   - 4-step vs 5-step ladder rendering
   - "Non-obvious play" shape (thesis rejects tickers before arriving at the pick)

4. **Leaderboard and profile pages** — Haven't been reviewed with real data yet. Leaderboard currently references real users but with placeholder stats.

5. **Phase 1 backend** (per implementation plan) — When frontend prototype is validated:
   - SQLite schema (5 tables from plan)
   - 13 API endpoints
   - Replace mock data with real DB
   - Resolution cron with existing adapters

6. **Kalshi real-time prices** — Skipped due to complexity. Add when real Kalshi-sourced calls are integrated.

## Other Notes

### Running the prototype
```bash
git checkout belief-board-v4
lsof -ti:4000 | xargs kill -9 2>/dev/null  # kill existing
bun run board/server.ts
# → http://localhost:4000
```

### Current feed (5 real calls)
- DELL $117 — Chamath/All-In (rich detail)
- MSFT $401 — Threadguy stream (rich detail)
- IONQ $34 — Shkreli (rich detail)
- EVR $322 — Shkreli (rich detail)
- LAES $3.85 — marginsmall (slim, no rich detail)

### Twitter PFP URLs (verified working)
- martinshkreli: `pbs.twimg.com/profile_images/1904997844748005376/wFfbBUBD_400x400.jpg`
- chamath: `pbs.twimg.com/profile_images/1883600182165848064/-9LbG3md_400x400.jpg`
- threadguy: `pbs.twimg.com/profile_images/1920651894982066176/ssOaEU8k_400x400.jpg`
- marginsmall: `pbs.twimg.com/profile_images/1528733512861351936/0S5zDezo_400x400.jpg`

### Important: types.ts may need avatar_url re-added
The `avatar_url` field on User was added this session. If a linter or external edit removed it, it needs to be re-added as `avatar_url?: string` on the User interface in `board/types.ts`. The CallCard Avatar component depends on it.
