---
date: 2026-02-18T17:22:19+0000
session_name: general
researcher: claude
git_commit: 2a935d5c9543bbd1cd7f54b104cc646352ae45a4
branch: main
repository: belief-skill
topic: "Bulk Scan Card Fields Fix + Stale Source Design"
tags: [belief-router, bulk-scan, board-api, card-rendering, skill-fix]
status: complete
last_updated: 2026-02-18
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: Bulk Scan Execution + Board Card API Fix

## Task(s)

### 1. Bulk Scan of 1000x Podcast Episode (COMPLETED)
Routed a full YouTube transcript through the belief-router bulk pipeline:
- **Source:** 1000x podcast "Are Fundamentals Finally Bullish?" (Apr 21, 2025) — Avi Felman & Jonah Van Bourg
- **URL:** https://www.youtube.com/watch?v=YqXNBe5fF2c
- **Extracted 7 theses**, tiered into 3 deep-routed (HYPE, BTC tails, Short ETH/Long HYPE pair), 3 swept (BTC decoupling, gold PBOC, Saylor copycats), 1 skipped (alt seasons over)
- **Scorecard included** — 10 months of hindsight: gold +53% (win), HYPE +70% (win), BTC tails mixed, short ETH wrong, MSTR -63%
- Full take + card output for all three Tier 1 theses

### 2. Board Card API Field Bug (COMPLETED)
**Problem:** Cards posted to the board were sparse — missing source_quote, reasoning, price_ladder, derivation chain. The IONQ card (existing) rendered fully while HYPE/BTC cards were bare.

**Root cause:** First POST failed because `caller_id` was missing (SKILL.md incorrectly said it was optional). When retrying with `caller_id` added, all rich fields were accidentally stripped from the payload to simplify debugging. The API accepts all fields fine — they just weren't sent.

**Fix:**
- Updated SKILL.md line 525: changed "No caller_id needed" → "`caller_id` is required. Use `"anon"` for anonymous submissions"
- Added `caller_id: "anon"` to the example payload in SKILL.md
- Added `price_ladder` array (4 example entries) to the example payload
- Added `alternative` field to the example payload
- Re-posted both cards with full fields, deleted sparse versions

### 3. Stale Source Handling (DISCUSSED, NOT IMPLEMENTED)
User identified an important edge case: when routing content from old sources (this episode was 10 months old), the skill should behave differently — more "historical analysis + current re-evaluation" than pure trade prescription.

**Proposed "Replay Mode":**
- Triggers when source date > 30 days old
- Shows scorecard of how original calls performed before routing
- Classifies each thesis as: `still live`, `expired`, or `validated`
- Uses source date for `created_at` in API POST
- Dual-price cards: original entry price AND current re-entry price
- "Then vs Now" framing in the Take

User chose to defer this to a future session — wants to think more on the design.

## Critical References
- `SKILL.md:486-527` — The POST to board section (just fixed)
- `board/db.ts:74-86` — `packTradeData` function that handles the `trade_data` JSON blob
- `board/templates/permalink.ts:58-67` — Derivation chain rendering (supports 3 formats)

## Recent changes
- `SKILL.md:489` — Added `"caller_id": "anon"` to example payload
- `SKILL.md:501-506` — Added `price_ladder` array with 4 example entries to payload
- `SKILL.md:507` — Added `"alternative"` field to example payload
- `SKILL.md:525` — Fixed caller_id guidance: "required" not "optional"

## Learnings

### Board API Field Schema
The API accepts all fields flat in a single JSON object. The `packTradeData` function in `board/db.ts:74-86` automatically separates top-level columns from `trade_data` blob fields. Key fields that go into the blob:
- `source_quote`, `reasoning`, `edge`, `counter`, `price_ladder`, `alternative`, `scan_source`, `derivation`

The permalink template (`board/templates/permalink.ts`) renders:
- `source_quote` as a blockquote
- `reasoning` as a body paragraph (capped at 500 chars)
- `derivation` as greentext steps with chose_over

Three derivation formats accepted (auto-converted):
1. New: `{ steps: [...], chose_over: "..." }`
2. Legacy structured: `{ source_said, implies, searching_for, found_because, chose_over }`
3. Legacy string: newline-separated "Key: Value"

### Bulk Scan Execution Pattern
For a 9K+ word transcript:
1. Extract via `bun run scripts/adapters/transcript/extract.ts "URL"` — YouTube transcripts via yt-dlp work well
2. Spotify URLs only return page metadata, NOT transcripts (DRM protected)
3. Phase 1 (Extract & Cluster) should happen in main context since it's pure reasoning
4. Phase 2 (Instrument Sweep) — batch by platform, run all 3 platforms in parallel
5. Phase 3 (Deep Route) — needs web searches + returns calculations per thesis

### Price Points at Session End (Feb 18, 2026)
- BTC: $67,240 (IBIT: $38.17, 52W range: $35.3-$71.82)
- ETH: $1,978 (ETH/BTC: 0.0294)
- HYPE: $28.91 (funding: 0.2-5.6% ann, OI: $661M, vol: $135M/day)
- GLD: $459.35 (~$5,300/oz gold, 52W range: $261-$510)
- MSTR: $129.65 (52W range: $104-$457)
- SOL: $82.58, TAO: $186.89, PENDLE: $1.23

## Post-Mortem

### What Worked
- **Parallel platform sweeps:** Running Robinhood + Hyperliquid + Kalshi instrument discovery simultaneously saved significant time
- **Transcript extraction:** yt-dlp for YouTube works flawlessly — 9,257 words extracted cleanly
- **Scorecard framing:** Adding a "10-month scorecard" showing how old calls performed gave strong context for re-evaluation
- **Anti-fragility thesis for HYPE:** The insight that exchange revenue INCREASES during crashes (Feb 5: $6.84M vs $1.1M normal) was the strongest finding

### What Failed
- **Spotify extraction:** Spotify URLs return only page metadata (episode description + timestamps), not actual audio transcripts. DRM prevents extraction. User correctly identified this and asked about yt-dlp Spotify support.
- **First board POST stripped fields:** When debugging `caller_id` requirement, simplified the payload and forgot to restore rich fields. Should have just ADDED caller_id to the existing full payload.
- **SKILL.md had wrong API guidance:** "No caller_id needed" was incorrect — caused the cascade of stripped fields

### Key Decisions
- **HYPE as #1 pick over Kalshi BTC:** HYPE's anti-fragile revenue model (benefits from volatility regardless of direction) beat Kalshi's binary macro bet on BTC direction
  - Alternatives: Kalshi BTC >$100K YES at 39c (cleaner, regulated, but directional), IBIT calls (time decay)
  - Reason: HYPE profits whether BTC goes up, down, or sideways — just needs trading activity
- **Deferred stale source design:** User chose not to implement Replay Mode yet — wants to think more on the design
  - Reason: It's a substantial SKILL.md change affecting output format, API payload structure, and card rendering

## Artifacts
- `SKILL.md:486-527` — Updated POST to board section (caller_id fix, price_ladder, alternative)
- Board cards posted:
  - HYPE full card: http://localhost:4000/t/4f6be5ac-4
  - BTC Kalshi full card: http://localhost:4000/t/a2361904-f
- Deleted sparse cards: 9a8991b7-6, 3349cbde-8

## Action Items & Next Steps

1. **Design "Replay Mode" for stale sources** — When source content is >30 days old, the routing output should shift from pure trade prescription to historical analysis + current re-evaluation. Key decisions needed: how to handle `created_at` (source date vs analysis date), whether to show dual prices, how to classify thesis status (still live / expired / validated). Consider writing a design doc in `thoughts/shared/plans/`.

2. **Verify card rendering** — Open http://localhost:4000/t/4f6be5ac-4 and http://localhost:4000/t/a2361904-f in browser to confirm the full cards now render with source_quote blockquote, price_ladder bars, reasoning paragraph, and derivation greentext steps.

3. **Consider `price_ladder` rendering** — The explore agent found that `price_ladder` is stored in the blob but the permalink template might not be rendering it yet for all card types. Check `board/templates/permalink.ts` to confirm the ladder renders for perps/kalshi instruments (it works for stocks per IONQ example).

## Other Notes

- The 1000x podcast (Blockworks) cross-posts to YouTube, which makes transcript extraction easy. For Spotify-only podcasts, the user would need to find an alternative source or manually provide the transcript.
- Hyperliquid funding rates are highly variable — observed 0.16% to 5.58% annualized within the same session (minutes apart). Use the higher end for conservative estimates.
- The `caller_id` field auto-creates a user if it doesn't exist (server.ts:140-153). Using `"anon"` creates an anonymous user. For sourced calls, the `source_handle` populates the card header.
