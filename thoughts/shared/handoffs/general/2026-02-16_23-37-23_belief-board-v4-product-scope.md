---
date: 2026-02-16T23:37:23-0500
session_name: general
researcher: claude
git_commit: ffa691bc40b3ee838333c04dd66cd1e9f58a123f
branch: main
repository: belief-skill
topic: "belief.board v4 Product Scope — Research, Design, and Architecture"
tags: [product-design, belief-board, architecture, wireframes, competitive-analysis]
status: complete
last_updated: 2026-02-16
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: belief.board v4 — Product Scope, Competitive Analysis, and Full Wireframe

## Task(s)

1. **Moltbook.com architecture analysis** (completed) — Deconstructed how moltbook.com works: agent self-registration via `skill.md`, autonomous posting via REST API, identity-as-platform developer layer. Key abstraction: the skill file IS the distribution mechanism, not the website.

2. **Apply Moltbook abstractions to belief.board** (completed) — Identified why board-v3 didn't click for growth: it was website-first (attract users to board) when it should be skill-first (skill produces cards, board just stores/tracks/displays). The belief router skill IS the product; the board is infrastructure.

3. **Competitive landscape analysis** (completed) — Researched 8 platforms (TradingView, Polymarket, TipRanks, Kinfo, Manifold, TradrOne, Commonstock/Yahoo, StockTwits) with screenshots and UX teardowns. Identified the gap: nobody combines thesis-first posts + auto-resolution + verified P&L in one surface.

4. **Thesis-first card hierarchy** (completed) — Established that belief.board is NOT chart-first (TradingView) or numbers-first (Kinfo). The thesis text is always the hero element. Charts don't work universally (Kalshi binaries, cultural observations have no meaningful chart). The resolved "CALLED IT +218%" text card is the viral artifact.

5. **Three-role attribution model** (completed) — Designed the Source/Curator/Original Caller model to handle the @marginsmall case: someone tweets a thesis, a curator routes it via the skill, the AI structures the trade. Source gets attribution on the card. Curator gets tagged `curated` on leaderboard. Source can "claim" their record when they sign up (pre-built track record as onboarding pull).

6. **Full product scope document** (completed) — Wrote comprehensive plan covering data model (5 SQL tables), API (13 endpoints), 7 screens, resolution engine, 4-phase roadmap.

7. **Excalidraw visualizations** (completed) — Created three excalidraw files: competitive comparison, site wireframe, and the definitive board-v4 product vision with all 7 sections.

## Critical References

- `thoughts/shared/plans/2026-02-16-belief-board.md` — **THE** product scope document. Contains data model, API endpoints, resolution logic, phases, open questions. This is the implementation spec.
- `docs/board-v4.excalidraw` — Definitive product vision board (309 elements, 7 sections). The visual reference for everything.
- `SKILL.md` — The existing belief router skill. Understanding how it outputs 6-field cards is essential context for how cards get created on the board.

## Recent changes

- `docs/board-v4.excalidraw` (new) — Full product vision: 7 sections covering vision, roles, card anatomy, 7 screen wireframes, viral loop, resolution engine, 4-phase roadmap
- `docs/belief-board-wireframe.excalidraw` (new) — Earlier wireframe iteration (6 screens, 162 elements). Superseded by board-v4 but still useful reference.
- `docs/card-hierarchy-comps.excalidraw` (new) — Competitive comparison: TradingView (chart-first) vs belief.board (thesis-first) vs StockTwits (numbers-first), plus landscape matrix and gap analysis
- `thoughts/shared/plans/2026-02-16-belief-board.md` (new) — Complete product scope: data model, API, screens, flows, phases, open questions

## Learnings

### Moltbook's skill.md pattern
Moltbook gets 2.8M agents by publishing a plain-text instruction file (`skill.md`) that any LLM can read and follow to self-register and post autonomously. The entire developer onboarding funnel is replaced by one markdown file. This is the "API-as-prompt" pattern — documentation IS the integration for an LLM-native audience. Applied to belief.board: the belief router skill should auto-post cards to the board, and a public `skill.md` should let other users' agents onboard themselves.

### TradingView is the biggest comp and biggest gap
TradingView Ideas (90M+ users) proves massive demand for publishing trade ideas publicly. But ideas never formally resolve — no auto-P&L, no win-rate leaderboards, no accountability. It's an "idea graveyard." belief.board's auto-resolve mechanic is the structural fix. The 15-minute lock (can't edit/delete after 15min) is a good accountability pattern worth adopting.

### Thesis-first vs chart-first
TradingView's chart thumbnail works because their content IS technical analysis. belief.board's content is fundamentally different — thesis-driven calls like "everyone's on Ozempic" or "AI search products flop." A chart adds nothing. The thesis text IS the visual hook. This also means the card format works universally across all instrument types (stocks, options, Kalshi binaries, perps) — charts only work for equities.

### The @marginsmall attribution problem
When a user pastes someone else's tweet and the AI routes it, three actors contribute: the source (thesis), the AI (trade structure), the user (curation). The honest display is: "@marginsmall's take, routed by @satoshi." Leaderboard tracks both original and curated calls separately but in one ranking. The "claim" flow (source signs up later to claim their pre-built track record) is a unique growth mechanic no competitor has.

### Commonstock's failure mode
Commonstock (acquired by Yahoo 2023) was the closest prior art — thesis posts with verified brokerage positions. It died because thesis posts were high-effort (long-form memos), audience was small, feedback loop was slow (wait months for thesis to play out). The 6-field card fixes effort. Auto-resolve + "watching" count fixes feedback loop.

### Track.ts already has attribution fields
`scripts/track.ts` already supports `--src "tweet:@marginsmall"` and `--claim` fields. The local data model already captures attribution — it just needs to flow through to the board's API and display.

## Post-Mortem

### What Worked
- **Browser automation for competitive research**: Using Claude-in-Chrome to visit and screenshot Kinfo, TipRanks, Polymarket, Manifold, TradrOne, Kalshi gave concrete visual references that informed the design
- **Abstracting Moltbook's pattern first**: Analyzing moltbook.com's architecture before applying it to belief.board created a clean framework (skill-as-distribution, API-as-prompt) that resolved the "why would it grow?" question
- **Building on board-v3**: The user's existing v3 wireframe had the right atomic unit (6-field card) and right annotations ("thesis is the hero", "this is the ad"). v4 added attribution, the claim flow, and the competitive positioning without throwing away v3's insights

### What Failed
- Nothing major failed. The session was primarily research and design, not implementation.
- The first excalidraw (`card-hierarchy-comps.excalidraw`) focused too much on TradingView comparison when the user wanted the full site wireframed. Corrected with `belief-board-wireframe.excalidraw` and then the comprehensive `board-v4.excalidraw`.

### Key Decisions
- Decision: **Thesis-first, not chart-first** card hierarchy
  - Alternatives considered: Auto-generated sparkline chart thumbnails (TradingView style)
  - Reason: Half the instrument types (Kalshi binaries, cultural observations) don't have meaningful charts. The thesis text is the universal visual hook. Charts would make belief.board look like another TradingView clone.

- Decision: **One leaderboard with original/curated tags** (not separate leaderboards)
  - Alternatives considered: Separate "Best Callers" and "Best Curators" leaderboards; or caller-only credit
  - Reason: Curation is a real skill (choosing which tweets to take seriously). But it should be transparent. One leaderboard with visible tags is cleaner than maintaining two.

- Decision: **Source gets attribution, caller gets leaderboard credit**
  - Alternatives considered: Both get credit (co-author model); source gets all credit
  - Reason: Structuring the trade is the skill being measured. The source gets visibility (name on card) and viral incentive (tagged in screenshots) without polluting the leaderboard. They can claim their record later.

- Decision: **Pre-built track records as onboarding pull**
  - Alternatives considered: Sources must sign up before being attributed
  - Reason: The platform building your reputation before you join is a unique growth mechanic. "Claim your calls" is stronger onboarding than "sign up and start posting."

## Artifacts

- `thoughts/shared/plans/2026-02-16-belief-board.md` — Full product scope (data model, API, screens, flows, 4 phases, open questions)
- `docs/board-v4.excalidraw` — Definitive product vision board (309 elements, 7 sections)
- `docs/belief-board-wireframe.excalidraw` — Earlier wireframe (6 screens, superseded by v4)
- `docs/card-hierarchy-comps.excalidraw` — Competitive comparison (TradingView vs belief.board vs StockTwits + landscape matrix)

## Action Items & Next Steps

1. **Review board-v4.excalidraw** in Excalidraw — verify all 7 sections render correctly and match the user's mental model
2. **Resolve open questions** from the plan document:
   - Bet size display: percentage only or $100K scenarios?
   - Resolution disputes: need a correction mechanism?
   - Private calls: tracked but hidden until confidence built?
   - Agent API: Moltbook-style bearer token posting for AI agents?
   - Monetization model?
3. **Begin Phase 1 implementation** — Core board MVP:
   - `bun:sqlite` schema (5 tables from plan)
   - `Bun.serve()` with API routes
   - 6-field form + feed page (Hot/New/Resolved)
   - Twitter auth verification
   - Daily price tracking cron (reuse existing adapters)
   - Auto-resolution logic
   - Leaderboard page
4. **Phase 2** — Add attribution model (`via @handle`), claim flow, screenshot card generation, share button
5. **Phase 3** — Add "Post to Board" button to belief router skill output, public `skill.md` for other users

## Other Notes

### Competitive landscape quick reference
| Platform | Users | Has Thesis | Auto-Resolve | Leaderboard | Key Gap |
|----------|-------|-----------|-------------|-------------|---------|
| TradingView | 90M+ | TA only | No | No | Ideas never resolve |
| Polymarket | - | No | Yes (binary) | Yes | No thesis layer |
| TipRanks | - | No | Yes (auto-track) | Yes | Analysts only, no retail |
| Kinfo | - | No | Yes (brokerage) | Yes | Numbers without thesis |
| StockTwits | 8M | Noisy | No | No | Zero accountability |
| Commonstock | Dead | Yes (memos) | No | No | Too high effort, slow feedback |
| Manifold | - | No | Yes (play money) | Yes | Not real money |
| belief.board | New | Yes (structured) | Yes | Yes | **The gap filler** |

### Key files in existing codebase
- `SKILL.md` — The belief router skill definition (triggers, shapes, rubric, output format)
- `scripts/track.ts` — Local belief tracker with `--src` and `--claim` fields already
- `references/output-format.md` — Card JSON format, button callbacks, recording CLI
- `scripts/adapters/` — Market API adapters (robinhood, kalshi, hyperliquid, etc.) reusable for price tracking cron
- `data/beliefs.jsonl` — Local append-only fact log (will need sync strategy with board DB)
