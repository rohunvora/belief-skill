---
date: 2026-02-17T04:57:42-0500
session_name: general
researcher: claude
git_commit: fd143c0cada6d0410a11c7f8e6ae4de95758bbe5
branch: belief-board-v4
repository: belief-skill
topic: "Attribution Tiers + Derivation Chain — Misattribution Fix"
tags: [belief-board, skill-prompt, attribution, derivation-chain, data-model]
status: complete
last_updated: 2026-02-17
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: Attribution Tiers, Derivation Chain, Token Efficiency Refactor

## Task(s)

1. **Resume from stash recovery** (completed) — Previous session's edits were lost due to branch switching. Found them in `git stash` (two stashes), popped both. All live prices, PFP, mock data cleanup work recovered.

2. **Add SPGI take from nicbstme** (completed) — Added S&P Global long thesis sourced from @nicbstme's framework about AI disrupting financial data. This surfaced the misattribution bug — the source wrote a framework about AI vs data companies but never mentioned SPGI. The router built the entire thesis and trade, then stamped the source's name on it.

3. **Fix misattribution bug** (completed) — Replaced binary `original | curated` with four attribution tiers: `original`, `direct`, `derived`, `inspired`. Added derivation chain requirement to SKILL.md. Updated board data model, mock data, and UI components.

4. **Token efficiency refactor** (completed) — Compressed SKILL.md additions from ~35 lines to ~10 lines. Moved examples to `references/derivation-chain.md`. Replaced 4-field derivation struct with single string field.

5. **Remaining tasks** (planned, not started):
   - Task #9: Merge `source_quote` into derivation chain (redundant fields)
   - Task #10: Make attribution tier classification mechanical (not model-judged)
   - Task #11: Make derivation chain part of scoring step, not post-hoc summary

## Critical References

- `SKILL.md:92-105` — Derivation Chain + Attribution section (compressed version)
- `references/derivation-chain.md` — Full derivation chain format, examples, tier classification rules
- `thoughts/shared/plans/2026-02-16-belief-board.md` — Board implementation spec (data model, API, screens, phases)

## Recent changes

**Commits this session (4 on `belief-board-v4`):**
- `e4ff7bd` — Live prices, real data, Twitter PFPs (stash recovery)
- `506c969` — README rewrite, options liquidity fix, board deps (stash recovery)
- `b49ee3c` — SPGI long take from nicbstme
- `fd143c0` — Attribution tiers + derivation chain + token compression

**Files modified:**
- `SKILL.md:92-105` — Added derivation chain + attribution tier rules (compressed)
- `references/derivation-chain.md` — NEW: format, examples, classification rules
- `board/types.ts:14` — `call_type` now `"original" | "direct" | "derived" | "inspired"`
- `board/types.ts:41` — `derivation?: string` (single string, not struct)
- `board/mock-data.ts` — 6 users (added nicbstme), 6 calls (added SPGI), tiers reclassified: DELL/MSFT/IONQ/EVR=derived, SPGI=inspired, LAES=direct
- `board/components/CallCard.tsx:215-222` — Tier badge with color coding (green/blue/purple)
- `board/components/CallCard.tsx:141` — Attribution line: "call" vs "thesis" vs "framework"
- `board/pages/CardDetail.tsx:133-169` — DerivationChain component (collapsible, parses string by newlines)
- `board/pages/CardDetail.tsx:200-207` — Tier badge on detail page
- `board/pages/Profile.tsx:31` — Fixed curated→non-original filter

## Learnings

### The misattribution problem
The skill was crediting sources for trades they never made. nicbstme wrote a framework about AI disrupting financial data. The router independently identified SPGI as the best expression, then attributed the trade to nicbstme. This breaks the claim flow — nicbstme would see "your take" on the board for a trade they didn't make. The fix is attribution tiers (direct/derived/inspired) + a derivation chain that shows the router's reasoning.

### Derivation chain should be pre-scoring, not post-hoc
Current implementation logs the chain in the output (after ticker selection). This is rationalization, not reasoning. The chain should be logged BEFORE searching — "source said X → implies Y → searching for Z" — then the search results get scored. This is task #11, not yet implemented.

### Token efficiency of SKILL.md
Every line in SKILL.md loads on every routing. Examples and verbose explanations should go in `references/` and be loaded conditionally. The initial addition was 35 lines; compressed to 10 lines + a reference file. Same pattern should apply to other verbose sections.

### Git stash saves the day
Previous session's edits were lost due to branch switching (`git checkout main` mid-work). Git auto-stashed instead of discarding. `git stash list` + `git stash pop` recovered everything. Always check stash when edits appear missing.

### Bun 1.3.9 HTML import bug
Dev server intermittently fails with "Failed to load bundled module 'board/app.tsx'" — but `bun build board/app.tsx --target browser` works fine. The code is correct; the dev server's module loader has a bug. Hard refresh usually fixes it.

## Post-Mortem

### What Worked
- **Stash recovery** — checking `git stash list` before re-implementing saved hours of work
- **User-driven bug discovery** — the user noticed they couldn't see the causal link from source to ticker, which revealed the fundamental attribution problem
- **Incremental compression** — built the feature first (verbose), then compressed after understanding what's essential

### What Failed
- **Initial over-engineering** — 4-field derivation struct was unnecessary for a prototype. Single string field is sufficient and cheaper everywhere (type, data, DB, UI).
- **35 lines in SKILL.md** — added too much to a prompt that loads every routing. Should have started with conditional reference.

### Key Decisions
- Decision: **Three non-original tiers (direct/derived/inspired) instead of binary**
  - Alternatives: Keep curated as-is, or just add a flag for "source named ticker"
  - Reason: The distinction matters for claim flow and trust. "nicbstme's framework" is fundamentally different from "marginsmall's call."

- Decision: **Single string derivation field**
  - Alternatives: 4 typed fields, or no structured derivation at all
  - Reason: Structured enough for display (parse by newlines), cheap to store and type.

- Decision: **Conditional reference loading for examples**
  - Alternatives: Keep everything inline in SKILL.md
  - Reason: SKILL.md loads every routing. Examples are needed rarely. `references/` loads on demand.

## Artifacts

- `SKILL.md:92-105` — Compressed derivation + attribution rules
- `references/derivation-chain.md` — Full derivation chain reference (format, examples, tier rules)
- `board/types.ts` — Updated Call type with tiers + string derivation
- `board/mock-data.ts` — 6 real users, 6 real calls, correct tier classifications
- `board/components/CallCard.tsx` — Tier badges + attribution line text
- `board/pages/CardDetail.tsx` — DerivationChain collapsible component
- `board/TAKE-LOG.md` — 5 entries now (added SPGI)

## Action Items & Next Steps

1. **Task #9: Merge source_quote into derivation** — Calls store both `source_quote` and `derivation` — redundant since step 1 of the chain IS the source quote. Remove `source_quote` for calls with `derivation`, update CardDetail/CallCard to read from derivation first, fall back to source_quote.

2. **Task #10: Make attribution tier mechanical** — Currently the skill self-classifies its tier. The tier should be derived from the derivation string content: contains ticker → direct, contains market thesis → derived, framework only → inspired. Could be a function in board code or a mechanical rule in SKILL.md.

3. **Task #11: Make derivation chain pre-scoring** — Move the chain from output format to process step. After deeper claim extraction, log "source said → implies → searching for" BEFORE searching. Then scoring happens on results. This is a structural change to the SKILL.md flow (currently: Deeper Claim → Research → Scoring → Output with derivation; should be: Deeper Claim → Derivation logged → Research → Scoring → Output).

4. **Group chat test cases** — User shared test cases from their group: Grindr (earnings), Pelosi filings, government meetings, Messari/egirlcapital research, Pokemon cards (edge case — no liquid instrument). Priority: Grindr, Pelosi, government meetings.

5. **Board Phase 1 backend** — When prototype is validated: SQLite schema, 13 API endpoints, replace mock data with real DB, resolution cron.

## Other Notes

### Running the prototype
```bash
git checkout belief-board-v4
lsof -ti:4000 | xargs kill -9 2>/dev/null
sleep 1 && bun run board/server.ts
# → http://localhost:4000
```

### Current feed (6 real calls)
- DELL $117 — Chamath/All-In (derived)
- MSFT $401 — Threadguy stream (derived)
- IONQ $34 — Shkreli quantum selloff (derived)
- EVR $322 — Shkreli IPO wave (derived)
- SPGI $409 — nicbstme AI vs data (inspired)
- LAES $3.85 — marginsmall PQC (direct)

### Product insight from this session
The user's question "I don't see the link?" between source and trade revealed a fundamental product problem. The skill was generating plausible-sounding attributions for trades the source never made. This is worse than no attribution — it's misattribution that erodes trust with the exact people the product needs to attract (sources who should want to claim their record).
