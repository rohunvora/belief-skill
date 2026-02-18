# Handoff: Skill Scoring Refactor + URL/Transcript Support

**Date**: 2026-02-17 13:45 PST
**Branch**: main (commits pushed), working branch: belief-board-v4
**Commits**: 9039f5f → 7f7a737 → 454e604

## What Was Done

### 1. Underlying vs Wrapper Scoring Separation (7f7a737)
Split the 4-dimension evaluation rubric into two conceptual groups:
- **Thesis-dependent** (Alignment + Edge) → scored per underlying
- **Instrument-dependent** (Payoff Shape + Timing Forgiveness) → scored per wrapper

Added perp examples to rubric anchors (Payoff Shape: "3-5x perps" in High Asymmetry, etc. Timing Forgiveness: funding rate thresholds). Added perp leverage selection guideline keyed to thesis horizon × funding rate.

**Why**: User noted that when a stock is available on Hyperliquid as a perp, even at 1x leverage it's more capital-efficient. The old scoring flow never generated HL perps as candidates for equity underlyings — it conflated underlying selection with wrapper selection.

**Location in SKILL.md**: Between "Timing Forgiveness" table and "Comparing Candidates" section (~line 161).

### 2. URL Handling in Input Validation (454e604)
Added step 4 to Input Validation: "Is it a URL?"
- Text content (tweets, articles, Substack) → WebFetch inline, fallback: ask user to paste
- Media content (YouTube, podcast) → `bun run scripts/adapters/transcript/extract.ts "URL"`
- Long transcripts (>3K words) → sub-agent for Phase 1 (Extract & Cluster)

### 3. Transcript Extraction Script (454e604)
`scripts/adapters/transcript/extract.ts` — uses yt-dlp (not npm packages, they're all broken against current YouTube API).

- YouTube: yt-dlp downloads auto-captions as json3, script parses to plain text
- Text URLs: raw fetch + HTML tag stripping
- Tested: 487 words from music video, 24,282 words from long-form interview
- Requires: `brew install yt-dlp` (must be current — older versions fail with SABR streaming errors)
- Removed broken deps: `youtube-transcript`, `youtube-caption-extractor`

## What Needs Testing

1. **Fresh session test**: Invoke `/belief-router` with a YouTube URL and verify the full pipeline:
   - URL detected → transcript extracted → theses extracted via Bulk Mode → instruments routed
   - Verify sub-agent is used for long transcripts (>3K words)

2. **Wrapper evaluation test**: Route a plain thesis (e.g., "MSFT is undervalued") and verify:
   - HL instruments check runs in parallel with RH
   - If perp exists, it's evaluated as a wrapper candidate alongside stock
   - Leverage table is applied based on thesis horizon and funding rate

3. **Tweet/article URL test**: Paste a tweet URL or article link, verify WebFetch fallback works

## Learnings

- YouTube npm packages (`youtube-transcript`, `youtube-caption-extractor`) are ALL broken as of Feb 2026 — YouTube changed their caption API and these packages return empty arrays
- yt-dlp is the only reliable transcript extraction method, but must be current version (2026.02.04+)
- The innertube API approach (direct POST to YouTube internal API) also fails — requires session tokens
- Raw HTML scraping of caption baseUrls fails — YouTube returns empty responses for extracted URLs

## Artifacts

- `SKILL.md` — all three changes live here (scoring section + input validation)
- `scripts/adapters/transcript/extract.ts` — new script
- This session also did a full THREADGUY stream scan (7 theses, MSFT long as primary trade) — that was the routing that surfaced the HL perp gap

## Open Items

- The TypeScript pre-flight hook blocks on pre-existing type errors in `scripts/adapters/angel/` and `scripts/adapters/bankr/` — these are NOT caused by this session's changes
- `bun.lock`, `package.json`, `tsconfig.json` have unstaged changes on belief-board-v4 branch from board work — don't commit these on main
