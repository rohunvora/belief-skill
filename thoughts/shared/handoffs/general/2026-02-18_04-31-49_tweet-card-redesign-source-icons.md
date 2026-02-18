---
date: "2026-02-18T04:31:49-0500"
session_name: general
researcher: claude
git_commit: 2436962
branch: main
repository: belief-skill
topic: "Tweet Card Redesign + Source Favicon Icons"
tags: [board-design, callcard, ux-research, jakob-law, mobile-first]
status: complete
last_updated: "2026-02-18"
last_updated_by: claude
type: implementation_strategy
root_span_id: ""
turn_span_id: ""
---

# Handoff: Tweet-card redesign with clickable source favicons

## Task(s)

### 1. Card Redesign (Jakob's Law + Mobile-First) — COMPLETED
User said "I just hate how the card looks." Researched comparable apps (Robinhood, Polymarket, Kalshi, Stocktwits) for Jakob's Law patterns. Built a 4-way comparison playground (`board/card-playground.html`) with Current, Robinhood Dense, Belief First, and Tweet Card options in phone frames at 390px width. User chose **Option C: Tweet Card** (Twitter/Stocktwits layout).

Implemented in `CallCard.tsx`:
- **Row 1**: Avatar (md/28px) + `@handle` (15px bold) + source icon + time
- **Row 2**: Thesis text (15px, main content, 2-line clamp)
- **Row 3**: Direction badge (`▲ TICKER` green or `▼ TICKER` red) + entry price + P&L%
- Parent Feed.tsx changed from `gap-3` cards to `divide-y divide-gray-100` dividers

### 2. Clickable Source Favicons — COMPLETED
Added inline SVG icons for YouTube (red), X/Twitter (black), Substack (orange) next to @handle. Icons are clickable links to `source_url`, open in new tab. `e.stopPropagation()` prevents card click. Falls back to Google Favicon API for unknown domains. Only renders when `source_url` is non-null (4 calls have no source_url: martinshkreli×2, marginsmall, TEST).

### 3. Figma Integration Research — COMPLETED (research only)
User asked about editing frontend in Figma. Researched Code to Canvas integration (announced Feb 17, 2026). User doesn't have Figma plan, so this was shelved. Key finding: Figma MCP desktop server at `http://127.0.0.1:3845/mcp`, `generate_figma_design` tool pushes to canvas. Setup: `claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp`.

## Critical References
- `board/components/CallCard.tsx` — the redesigned card component (tweet-card layout + source icons)
- `board/pages/Feed.tsx` — parent feed with `divide-y` dividers
- Previous handoff: `thoughts/shared/handoffs/general/2026-02-18_03-28-12_bulk-scan-manidis-and-board-design-revert.md`

## Recent changes
- `board/components/CallCard.tsx` — full rewrite of card layout to tweet-card style + added `SourceIcon` component with inline SVGs
- `board/pages/Feed.tsx:79` — changed `flex flex-col gap-3` to `divide-y divide-gray-100`
- `board/card-playground.html` — NEW: static HTML playground for comparing 4 card designs (can be deleted, development artifact)

## Learnings

1. **Bun.serve() without `--hot` doesn't pick up component changes.** Server was running as `bun run board/server.ts`. Had to kill and restart with `bun --hot board/server.ts` for React component edits to take effect. The bundler re-bundles `board/index.html` imports on server start.

2. **The TypeScript preflight hook fires on ALL errors, not just board/.** Pre-existing errors in `scripts/adapters/angel/`, `scripts/adapters/bankr/` cause the hook to block every edit, even when `board/` has zero errors. Workaround: manually verify with `npx tsc --noEmit 2>&1 | grep "board/"`.

3. **Browser automation can't visit financial sites** (stocktwits.com, robinhood.com, etc.) due to safety restrictions. Workaround: use WebSearch + WebFetch for UX research instead of live screenshots.

4. **Jakob's Law analysis for trading/belief cards**: Across Robinhood, Polymarket, Kalshi, Stocktwits, the universal mobile patterns are: (a) ticker/name is biggest+boldest, (b) one colored number carries direction (green/red P&L), (c) attribution is small+gray, (d) no dot-separated metadata lines, (e) color does heavy lifting for scan speed, (f) ~60-72px card height for dense feeds.

5. **Source URL coverage**: 9 of 13 calls have `source_url`. Domains: youtube.com (chamath, threadguy, BigA×3), x.com (nicbstme), substack.com (WillManidis×3). 4 calls missing: martinshkreli×2, marginsmall, TEST.

## Post-Mortem

### What Worked
- **Playground comparison approach**: Building a static HTML file with 4 phone frames side-by-side let the user visually compare options. Served via `python3 -m http.server 4001` since Bun.serve() doesn't serve arbitrary static files.
- **Inline SVGs for source icons**: No external dependencies, crisp at any size, instant render. Three SVGs (YouTube, X, Substack) cover all current sources.
- **Tweet-card layout**: Twitter-familiar pattern. Thesis becomes the headline (biggest text), which is correct for a "belief" product. 7 cards visible on iPhone viewport vs ~5.5 before.

### What Failed
- **Figma integration**: User doesn't have Figma plan. The Code to Canvas feature requires Figma Dev or Full seat + desktop app.
- **Browser automation for financial sites**: Safety restrictions blocked all 4 target sites. Had to fall back to text-based research.
- **Server hot reload assumption**: Wasted time debugging why SVGs weren't rendering — server was stale. Always check if server has `--hot` flag.

### Key Decisions
- **Tweet Card over Robinhood Dense or Belief First**: User chose C because it matches the Twitter pattern their audience already uses. The @handle as anchor makes it social-first.
- **Inline SVG over favicon fetches**: Google Favicon API as fallback only. For known domains (YouTube, X, Substack), inline SVGs are faster, more reliable, and look crisp.
- **Avatar size md (28px) + handle 15px**: User explicitly requested bigger name/pfp. Bumped from sm(20px)/13px to md(28px)/15px.

## Artifacts
- `board/components/CallCard.tsx` — redesigned card component
- `board/pages/Feed.tsx:79` — divider change
- `board/card-playground.html` — comparison playground (dev artifact, can delete)

## Action Items & Next Steps

1. **Clean up `board/card-playground.html`** — development artifact, not needed in production. Delete or gitignore.

2. **Re-implement rich permalink fields (Layer 2)** — from previous handoff. The reverted features (breakeven, kills, edge, counter, alternative, payoff table, derivation chain) should come back as Layer 2 content on the permalink/detail page. Card shows minimal (tweet-card), permalink shows everything.

3. **Fix anonymous caller flow** — reverted API requires `caller_id`. Either re-implement anonymous generation or update SKILL.md POST instructions to include a default caller_id.

4. **Add source_url to missing calls** — martinshkreli (IONQ, EVR) and marginsmall (LAES) have null source_url. Could retroactively add if the original tweets are findable.

5. **Fix +Infinity% on TEST entry** — the TEST call with entry_price 0 causes division by zero in `computePnl`. Guard against zero entry price.

6. **Consider short-direction badge for resolved calls** — HIT/MISS badge works but the green/red ticker badge always shows direction. For resolved calls, might want to show final P&L more prominently.

7. **Commit the card redesign** — `SKILL.md` and `board/components/CallCard.tsx` have uncommitted changes. Use `/commit` to save.

## Other Notes

- Board server should be started with `bun --hot board/server.ts` for development (live reload).
- The server was running on two PIDs (33294, 76450) — killed both and restarted with `--hot`.
- The static playground server (`python3 -m http.server 4001`) was running in background and has since completed.
- `SKILL.md` also has uncommitted changes (+85 lines) from a previous session — unrelated to this card work.
