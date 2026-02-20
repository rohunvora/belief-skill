---
title: Consolidated 3 systems into 2 by removing JSONL tracker
category: architecture
date: 2026-02-15
status: resolved
components: [scripts/db.ts, scripts/track.ts, scripts/card.ts, board/]
---

# Three Systems → Two: Removing the JSONL Tracker

## Problem

The repo had 3 disconnected systems with overlapping data models:
- **System 1 (Skill):** SKILL.md + adapters → terminal output, no storage
- **System 2 (Tracker):** scripts/db.ts (JSONL), track.ts (CLI), card.ts (dark-mode HTML) → append-only log
- **System 3 (Web):** web/ directory with SQLite, Bun.serve(), light-mode cards

System 2 and System 3 both stored beliefs/trades with different schemas (`RoutingFact` vs `Take`), different storage (JSONL vs SQLite), and different ID generation (8-char vs 10-char UUID slices). No bridge existed between any of them.

## Root Cause

Systems were built at different times for different purposes without a unified data model. System 2 was built when the skill was CLI-only. System 3 was built for the web frontend. Neither was designed with the other in mind.

## Solution

1. **Deleted System 2 entirely:** scripts/db.ts, scripts/track.ts, scripts/card.ts removed
2. **Evolved System 3 into the single store:** web/ → board/ with enriched schema
3. **Added bridge from System 1 to System 3:** SKILL.md now POSTs structured JSON to `POST /api/takes` after producing each trade card

### Key design decisions:
- **`trade_data` JSON blob column** absorbs all rich detail (reasoning, price_ladder, derivation, edge, counter, alternative) without schema bloat. Lean columns for queries/rendering, blob for detail views.
- **`current_price` + `price_updated_at` columns** enable live P&L without System 2's price-fetching CLI. Server fetches prices on-demand with 30s cache.
- **`Call` type** replaces both `RoutingFact` and `Take`. Includes resolution fields (status, resolve_price, resolve_pnl) that neither predecessor had.
- **`DerivationChain`** shows the reasoning trail from source quote to trade ("greentext" format). Supports legacy format migration.
- **Graceful bridge failure:** if the board is unreachable, the skill notes it and continues. Terminal output is primary; board posting is optional.

## Prevention

- Before adding a new storage mechanism, check if the existing one can absorb the use case
- One data model, one store. If two things store similar data, collapse them.
- The `trade_data` JSON blob pattern prevents schema bloat as the output format evolves

## Related

- `board/types.ts` — Call, User, DerivationChain interfaces
- `board/db.ts` — SQLite schema with pack/unpack for JSON blob
- `SKILL.md:460-550` — board integration flow
- `HANDOFF.md` — original platform vision that motivated the web layer
