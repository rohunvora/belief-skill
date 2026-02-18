---
date: 2026-02-17T01:13:10-0500
session_name: general
researcher: claude
git_commit: a8332e1f0f6c100d74c2a5944c9e76849d0867a1
branch: belief-board-v4
repository: belief-skill
topic: "belief.board v4 — Frontend Prototype Built, Detail Page Redesigned with Real Scan Data"
tags: [belief-board, frontend, prototype, agent-teams, design-iteration]
status: complete
last_updated: 2026-02-17
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: belief.board v4 Frontend Prototype — 7 Screens Built, Detail Page Redesigned

## Task(s)

1. **Resume from setup handoff** (completed) — Ingested `thoughts/shared/handoffs/general/2026-02-17_00-05-55_belief-board-v4-setup-and-team-enablement.md`. Previous session completed product research, implementation spec, and branch creation. No code existed.

2. **Build frontend prototype with agent teams** (completed) — Used TeamCreate to spawn 4 parallel agents that built all 7 screens:
   - layout-agent: Server, router, header, CallCard component, mock data, types
   - feed-agent: Feed page with Hot/New/Resolved tabs, Card Detail page
   - form-agent: Make Your Call 6-field form, Leaderboard page with rankings
   - profile-agent: Profile page with stats/tabs, Claim page with verification UI

3. **Design iteration based on real scan data** (completed) — User provided two real bulk scan outputs (All-In Podcast + Threadguy Stream). Iterated on design:
   - Removed "Dies if" from feed cards (too much cognitive load)
   - Slimmed trade line to just ticker + direction pill (removed price/breakeven from feed)
   - Added Avatar component with deterministic colors
   - Redesigned detail page with rich fields: source quote, reasoning, edge, counter, price ladder with visual bars, alternative plays
   - Added DELL (All-In/Chamath) and MSFT (Threadguy) cards with full rich detail data

4. **Threadguy attribution demo** (completed) — Added Threadguy as a source user and MSFT card attributed to his stream. The claim page at `#/claim/threadguy` shows "1 call cites your takes" — this is what the user plans to show Threadguy to demonstrate the viral attribution loop.

## Critical References

- `thoughts/shared/plans/2026-02-16-belief-board.md` — THE implementation spec. Data model (5 SQL tables), 13 API endpoints, 7 screens, resolution engine, 4-phase roadmap.
- `thoughts/shared/handoffs/general/2026-02-17_00-05-55_belief-board-v4-setup-and-team-enablement.md` — Previous handoff with architecture overview and agent team strategy.

## Recent changes

All files are NEW in `board/` directory (14 core files + 1 tsconfig):

**Infrastructure:**
- `board/server.ts:1-12` — Bun.serve() on port 4000, SPA catch-all route
- `board/index.html:1-11` — HTML entry with Tailwind Play CDN script + React via app.tsx
- `board/app.tsx` — React app shell with hash-based client-side router
- `board/tsconfig.json` — Board-specific TS config (extends root, adds DOM libs)

**Shared Components:**
- `board/components/Header.tsx` — Logo, search, green "Make Your Call" CTA, profile avatar
- `board/components/CallCard.tsx` — Shared card + Avatar component + formatPrice. Handles active/resolved/expired/closed states. Slim trade line (ticker + direction pill only). Exported Avatar and formatPrice for reuse.
- `board/types.ts` — Call (with optional rich detail fields: source_quote, reasoning, edge, counter, price_ladder, alternative, scan_source), User, Comment, LeaderboardEntry, PriceLadderStep interfaces
- `board/mock-data.ts` — 11 users, 8 calls (including DELL and MSFT with full rich detail), 5 comments, 10 leaderboard entries

**Pages:**
- `board/pages/Feed.tsx` — Hot (watchers desc), New (date desc), Resolved tabs
- `board/pages/CardDetail.tsx` — Redesigned with: scan source badge, source quote blockquote, "Why TICKER" reasoning, edge section, price ladder with visual bars, counter section, kills box, alternative, resolution box. Falls back to simple trade box for cards without rich data.
- `board/pages/NewCall.tsx` — 6-field form with Long/Short toggle, validation, success state
- `board/pages/Leaderboard.tsx` — Time toggles, category filters, ranked table, "Biggest Calls" sidebar
- `board/pages/Profile.tsx` — Stats boxes, tabs, source attribution banner
- `board/pages/Claim.tsx` — Attribution count, stats, cards list, verify CTA, mock verification code

## Learnings

### Agent teams workflow
- TeamCreate creates a shared task list. Tasks with `addBlockedBy` dependencies work well for sequential-then-parallel patterns (Task 1 builds foundation, Tasks 2-4 run in parallel after).
- Each agent needs explicit instructions about what files to read and what to create. They don't see other agents' work unless you tell them to wait or read specific files.
- TeamDelete fails if agents are still active. Must send shutdown_request and wait for confirmation before cleanup.
- Agents wrote files via Bash to work around a TS preflight hook that was blocking on a pre-existing error in `scripts/adapters/angel/instruments.ts`.

### Branch/worktree issue
- **IMPORTANT**: The board files currently exist as untracked files on `main` branch, NOT on `belief-board-v4`. The agent team worktrees were cleaned up by TeamDelete, but the files ended up in the main working directory. The next session MUST:
  1. `git checkout belief-board-v4`
  2. `git add board/`
  3. Commit the board files to the correct branch

### Design decisions from real data
- Feed cards should show ONLY: avatar + attribution, thesis (bold), ticker + direction pill + instrument badge, engagement stats. Everything else is detail-page content.
- The price ladder is the centerpiece of the detail page — it's what the scan naturally produces and what makes the call trackable.
- "Dies if" belongs on the detail page, not the feed. Too much noise in the scan context.
- Scans produce batches but the feed should stay flat. Grouping by source is a profile/filter concern.
- The `scan_source` field ("All-In Podcast (Feb 2026)", "THREADGUY Stream (Feb 16, 2026)") provides batch context on the detail page without complicating the feed.

### Tailwind CDN fix
- Bun's HTML imports don't support `<link>` to a CDN CSS file that doesn't exist as a pre-built bundle. The Tailwind v3 CDN link (`cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css`) doesn't work. Must use the Tailwind Play CDN script (`<script src="https://cdn.tailwindcss.com"></script>`) instead.

### HMR limitations
- Bun's HMR doesn't always pick up changes to mock data files. Server restart required for mock data changes to take effect.

## Post-Mortem

### What Worked
- **Agent teams for parallel page construction** — 4 agents built 7 screens in ~3 minutes. The dependency model (foundation first, then parallel pages) worked cleanly.
- **Real scan data for design validation** — Using actual All-In and Threadguy scan outputs revealed that the original card design had too much cognitive load. Iterating with real data produced a much cleaner hierarchy.
- **Progressive detail disclosure** — Feed card is slim (thesis + ticker + direction), detail page is rich (quote, reasoning, edge, ladder, counter, kills, alt). This matches how people actually consume: scan the feed, deep-dive on interesting calls.

### What Failed
- **Branch management with agent teams** — Files ended up on `main` instead of `belief-board-v4` due to worktree cleanup. Need to move them to the correct branch.
- **Tailwind CDN link** — Initial layout-agent used a non-existent CDN URL. Required manual fix.
- **HMR for mock data** — Changes to mock-data.ts required full server restart, not just HMR reload.

### Key Decisions
- Decision: **Slim feed cards — thesis + ticker + direction only**
  - Alternatives: Full trade line with price/breakeven/instrument, include "Dies if"
  - Reason: Real scan data showed 5-6 cards on screen simultaneously. Dense trade lines create cognitive overload. Price/breakeven are detail-page concerns.

- Decision: **Price ladder as centerpiece of detail page**
  - Alternatives: Simple entry/breakeven/target fields, text-based scenarios
  - Reason: The scan naturally produces 5-level ladders (stop → targets). Visual bars make risk/reward immediately scannable. This is the unique data the board tracks.

- Decision: **Rich detail fields as optional on Call type**
  - Alternatives: Separate "deep route" type, always require all fields
  - Reason: Not all calls come from deep routes. Original calls from the form won't have source quotes or reasoning. Optional fields let the detail page gracefully degrade.

- Decision: **Flat feed, no scan grouping**
  - Alternatives: Group cards by scan source ("3 calls from All-In Podcast")
  - Reason: User confirmed — feed shows the best calls regardless of source. Grouping is a profile/filter concern. `scan_source` on detail page is sufficient context.

## Artifacts

- `board/server.ts` — Bun.serve() entry point (port 4000)
- `board/index.html` — HTML entry with Tailwind Play CDN
- `board/app.tsx` — React SPA with hash router
- `board/tsconfig.json` — Board-specific TypeScript config
- `board/types.ts` — All interfaces including PriceLadderStep
- `board/mock-data.ts` — 11 users (including threadguy), 8 calls (MSFT + DELL with rich data), helpers
- `board/components/Header.tsx` — Header with navigation
- `board/components/CallCard.tsx` — Shared card + Avatar + formatPrice
- `board/pages/Feed.tsx` — Feed with Hot/New/Resolved tabs
- `board/pages/CardDetail.tsx` — Redesigned detail page with rich sections
- `board/pages/NewCall.tsx` — 6-field call form
- `board/pages/Leaderboard.tsx` — Ranked leaderboard with filters
- `board/pages/Profile.tsx` — User profile with stats
- `board/pages/Claim.tsx` — Source claim page with verification
- `thoughts/shared/plans/2026-02-16-belief-board.md` — Implementation spec (unchanged)

## Action Items & Next Steps

1. **Fix branch situation** — Files are on `main` as untracked. Switch to `belief-board-v4`, add `board/`, and commit.

2. **Show Threadguy the claim page** — Navigate to `#/claim/threadguy` to demo the attribution loop. His MSFT call is tracked with full source quote from his stream.

3. **Continue design iteration** — User is actively reviewing the UI. May want to:
   - Adjust card spacing, typography, or color choices
   - Add more mock data from other scans
   - Refine the price ladder visualization
   - Iterate on the leaderboard and profile pages (haven't been reviewed yet)

4. **Phase 1 backend** (per implementation plan) — Once frontend prototype is validated:
   - SQLite schema (5 tables from `thoughts/shared/plans/2026-02-16-belief-board.md`)
   - API endpoints (13 routes)
   - Connect frontend to real API (replace mock data)
   - Resolution cron with existing adapters (`scripts/adapters/`)
   - Twitter auth for verification

5. **Open questions** (from product scope, still unresolved):
   - Bet size display: percentage only or $100K scenarios?
   - Resolution disputes mechanism?
   - Private calls feature?
   - Agent API (bearer token for programmatic posting)?
   - Monetization model?

## Other Notes

### Running the prototype
```bash
bun run board/server.ts
# → http://localhost:4000
```

### Key URLs to demo
- `http://localhost:4000/#/` — Feed (Hot tab, DELL card first)
- `http://localhost:4000/#/call/c_dell_long` — DELL detail page (rich, from All-In)
- `http://localhost:4000/#/call/c_msft_long` — MSFT detail page (rich, from Threadguy)
- `http://localhost:4000/#/call/c_goog_short` — GOOG detail page (simple, no rich data)
- `http://localhost:4000/#/claim/threadguy` — Threadguy's claim page
- `http://localhost:4000/#/leaderboard` — Leaderboard
- `http://localhost:4000/#/call/new` — Make Your Call form

### Mock data highlights
- DELL (c_dell_long): Chamath's on-prem AI thesis from All-In — full rich detail
- MSFT (c_msft_long): Threadguy's AI code tollbooth thesis — full rich detail
- NVO (c_resolved_win): Resolved +218% "CALLED IT" card — shows resolution state
- TSLA (c_expired): Expired robotaxi card — shows zombie state
- KXFEDRATE (c_kalshi_fed): Kalshi binary — shows prediction market instrument type
