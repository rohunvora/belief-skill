---
title: System Consolidation — Current State + Next Steps
type: refactor
status: active
date: 2026-02-15
---

# System Consolidation — Current State + Next Steps

## Overview

The belief-router started with 3 disconnected systems (Skill, Tracker, Board). An audit on Feb 15 found that the other agent already consolidated: System 2 (Tracker) is deleted, System 3 (Board) absorbed its functionality, and the bridge from System 1 (Skill) to System 3 exists in SKILL.md. This plan documents what's done, what's working, and what gaps remain.

## What Was Done (by the other agent)

### System 2 Removed
- `scripts/db.ts` (JSONL append-only log) — **deleted**
- `scripts/track.ts` (CLI: record, portfolio, close, update, history) — **deleted**
- `scripts/card.ts` (dark-mode "I Called It" HTML card) — **deleted**
- `data/beliefs.jsonl` — **no longer used**

### System 3 Evolved (web/ → board/)
- `web/` renamed to `board/` with richer data model
- `Take` type replaced by `Call` type with:
  - Resolution fields (status, resolve_price, resolve_pnl, resolve_date, resolve_note)
  - Engagement metrics (votes, watchers, comments)
  - Attribution (caller_id, source_handle, source_url, call_type)
  - Rich detail via `trade_data` JSON blob (reasoning, edge, counter, price_ladder, derivation chain, alternative)
  - Live price tracking (current_price, price_updated_at)
- `User` type added (handle, bio, twitter, avatar_url, verified, stats)
- SQLite schema with proper indexes, foreign keys, WAL mode
- Live price fetching in server.ts (Yahoo Finance + Hyperliquid, 30s cache)
- SPA catch-all with Bun HTML imports (board/index.html)
- DerivationChain for showing reasoning trails ("greentext" format)
- Historical price adapters added: robinhood/historical.ts, kalshi/historical.ts, hyperliquid/historical.ts, coingecko/historical.ts

### Bridge Added (Skill → Board)
- SKILL.md lines 460-550: after producing the trade card, POST structured JSON to `POST /api/takes`
- Payload includes: thesis, ticker, direction, entry_price, breakeven, kills, caller_id, source info, derivation chain, price_ladder
- Graceful failure: "Board unavailable — skipping post."
- Bulk mode: POST each deep-routed take individually

## Current Architecture (2 Systems)

```
┌─────────────────┐              ┌─────────────────┐
│     SKILL       │    POST      │     BOARD       │
│   (Claude Code) │  /api/takes  │   (Bun.serve)   │
│                 │─────────────→│                 │
│  SKILL.md       │              │  board/server.ts │
│  scripts/       │← { id, url } │  board/db.ts     │
│  adapters/      │              │  board/board.db  │
│  references/    │              │  board/templates/│
└─────────────────┘              └─────────────────┘
   Terminal output                  Browser output
   (primary)                        (shareable)
```

## Gaps Identified

### Gap 1: Bridge Not Tested End-to-End
The SKILL.md has the POST instructions but there's no evidence of a successful end-to-end test: run the skill on a belief → skill produces card → POSTs to board → card appears at permalink.

**Risk:** The skill's JSON payload format might not match what `POST /api/takes` expects. The board expects `caller_id` (required), but the skill template uses `"anon"` — might create ghost users.

**Test:** Run the board server, then use the skill on one belief. Check if the call appears in the DB and renders at the permalink.

### Gap 2: SKILL.md Grew to 632 Lines
Was 452 when we last audited. Now 632 lines with the board integration section, extended bulk mode, and other additions. The skill is still getting longer, not shorter. The complexity spiral continues.

**Risk:** More tokens consumed per invocation = less context for Claude's reasoning.

**Specific bloat:** The board posting section (lines 460-550) includes a full JSON example with 20+ fields and a worked example. Could be compressed to: "POST the Call fields from the card to /api/takes. See board/types.ts for schema."

### Gap 3: No Test Harness
Still no fixed set of reference beliefs to test the skill against. Changes are made without measuring impact on existing output quality.

**Action:** Create `tests/reference-beliefs.json` with 7 beliefs spanning all thesis shapes. Run each through the skill, save outputs as golden files, compare after changes.

### Gap 4: Frontend Not Deployed
The board runs locally on :4000 but there's no deployment. bun:sqlite requires persistent filesystem — Vercel won't work.

**Options:**
- Fly.io with persistent volume (simplest — `fly launch` + `fly volumes create`)
- Turso as SQLite drop-in (`@libsql/client` instead of `bun:sqlite`)
- Railway with persistent disk

### Gap 5: Price Tracking Only Covers Robinhood + Hyperliquid
Kalshi returns `null` from `fetchPriceForCall()`. CoinGecko historical adapter exists but isn't wired into the price refresh loop. Bankr prices not tracked.

**Action:** Wire kalshi/historical.ts and coingecko/historical.ts into the server's price fetcher.

### Gap 6: No "I Called It" Resolution Flow
The `Call` type has `status`, `resolve_price`, `resolve_pnl`, `resolve_date`, `resolve_note` fields. The `closeCall()` function exists in db.ts. But there's no UI or automated trigger to resolve a call.

**Options:**
- Manual: User clicks "resolve" on the permalink page
- Semi-auto: Price hits a price_ladder target → flag for review
- Auto: Binary (Kalshi) calls auto-resolve on event date

## Recommended Next Steps (Priority Order)

### 1. End-to-End Bridge Test (30 min)
Start the board server. Run the skill on "HIMS is the Ozempic distribution play." Verify the call appears in SQLite and renders at its permalink. Fix any payload mismatches.

### 2. Compress SKILL.md (1 hour)
Target: 400 lines or less. The board posting section, worked examples, and search query templates are the main bloat. Apply the "tell Claude WHAT, not HOW" principle.

### 3. Build Test Harness (1 hour)
7 beliefs, golden outputs, diff script. This is the unlock for all future skill tuning — without it, every change is a guess.

### 4. Deploy Board (1 hour)
Fly.io is the path of least resistance. `flyctl launch --no-deploy`, add a volume, deploy. Get a live URL for sharing.

### 5. Add Resolution UI (2 hours)
A "resolve" button on the permalink page that sets status + resolve_price. The "called it" card state. This is the viral moment.

## Dependencies

- Steps 1-3 are independent — can run in parallel
- Step 4 depends on step 1 (don't deploy broken bridge)
- Step 5 depends on step 4 (needs live URL for sharing)

## References

- `board/types.ts` — Call, User, DerivationChain interfaces
- `board/db.ts` — SQLite schema, insert/query/update functions
- `board/server.ts` — routes, price fetching, SPA catch-all
- `SKILL.md:460-550` — board integration section
- `HANDOFF.md` — original platform vision
