---
date: "2026-02-18T05:02:55-0500"
session_name: general
researcher: claude
git_commit: 2a935d5
branch: main
repository: belief-skill
topic: "Greentext Derivation Chains — Normie-Readable Steps"
tags: [board-design, derivation-chain, callcard, skill-md, ux-writing]
status: complete
last_updated: "2026-02-18"
last_updated_by: claude
type: implementation_strategy
root_span_id: ""
turn_span_id: ""
---

# Handoff: Greentext derivation chains — replace structured fields with normie steps

## Task(s)

### 1. Greentext Derivation Chain Format — COMPLETED
Replaced the rigid 5-field structured derivation (`source_said`, `implies`, `searching_for`, `found_because`, `chose_over`) with a variable-length `steps: string[]` format. Each step is a plain-language sentence that earns the next. The ticker appears inline when you reach the trade. No finance jargon.

Design process: user asked "what if derivation path is the main text, normie-friendly?" Iterated through 4 formats — prose paragraphs (too formulaic), "if...then" structure (too rigid), natural language (still formulaic at 3 lines each), and finally 4chan-style greentext (variable length, each line earns the next). User chose greentext.

### 2. Card Redesign Commit — COMPLETED (from previous handoff)
Committed the tweet-card redesign and source favicon work from previous session. Two commits: `2520d1e` (SKILL.md Part 4 post-to-board) and `f9095e5` (CallCard.tsx + Feed.tsx tweet-card layout).

### 3. All 7 Implementation Tasks — COMPLETED
1. `types.ts` — `DerivationChain` interface changed to `{steps: string[], chose_over?: string}`, added `LegacyDerivationChain` for backward compat, rewrote `extractChainDisplay()` to return `{steps[], chose_over, hasChain}`
2. `db.ts` — not needed; `extractChainDisplay` handles legacy→steps conversion at read time
3. `CallCard.tsx` — greentext rendering with `>` prefix per step, variable height cards
4. `SKILL.md` — derivation section rewritten for steps format with 2/3/4 step examples and rules
5. `references/derivation-chain.md` — all examples replaced with real greentext at varying lengths
6. DB backfill — migration script `board/migrate-greentext.ts` updated all 12 calls with hand-written normie steps
7. Permalink/detail pages — `CardDetail.tsx`, `card.ts`, `permalink.ts` all updated to render steps

## Critical References
- `board/types.ts:1-16` — `DerivationChain` and `LegacyDerivationChain` interfaces
- `SKILL.md:77-130` — generation instructions for steps format
- `references/derivation-chain.md` — canonical examples at 2/3/4 step lengths

## Recent changes
- `board/types.ts:1-120` — new DerivationChain type, extractChainDisplay rewrite
- `board/components/CallCard.tsx:118-137` — greentext step rendering
- `board/pages/CardDetail.tsx:301-340,480-503` — detail page steps + chose_over
- `board/templates/permalink.ts:33-67` — server-rendered permalink greentext
- `board/templates/card.ts:33-38` — OG card uses first step
- `SKILL.md:77-130` — derivation chain section rewritten
- `SKILL.md:484,506-513` — Post to Board payload updated
- `references/derivation-chain.md` — full rewrite with greentext examples
- `board/migrate-greentext.ts` — NEW: one-time migration script

## Learnings

1. **The TypeScript preflight hook blocks on ALL errors, not just board/.** Pre-existing errors in `scripts/adapters/angel/` and `scripts/adapters/bankr/` cause every edit to trigger a blocking warning. Workaround: `npx tsc --noEmit 2>&1 | grep "board/"` to confirm zero board/ errors. This was already known from previous handoff but still active.

2. **Legacy format conversion at read time is cleaner than DB migration.** The `extractChainDisplay()` function converts old structured chains to steps on the fly (`source_said` → first step, `implies` → second step, `found_because` → third step). This means old data works without migration, but the auto-converted text is jargony. The manual backfill with hand-written steps is what makes it normie-friendly.

3. **Variable-length derivation is the key insight.** Fixed 3-step or "if...then...ticker" formats feel robotic. The user specifically rejected formulaic patterns ("too formulaic go up a layer of abstraction"). The greentext format lets each chain be 2-5 steps based on how many logical leaps connect the quote to the trade.

4. **The backfill preserves legacy fields alongside steps.** `migrate-greentext.ts` adds `steps` and updates `chose_over` but keeps `source_said`, `implies`, etc. intact. This means `extractChainDisplay` will use the `steps` array (preferred path) while legacy consumers still have fallback data.

## Post-Mortem

### What Worked
- **Iterative design in conversation before code**: Testing 4 different text formats (prose, if/then, natural, greentext) with the user before touching any code. The user could evaluate each format against real data.
- **Parallel agent execution**: Spawned 4 agents simultaneously for SKILL.md, references, DB backfill, and permalink templates. All completed successfully with no conflicts.
- **Backward-compatible type system**: `LegacyDerivationChain` + type guards (`isStepsChain`, `isLegacyChain`) mean old and new data coexist without migration pressure.

### What Failed
- **Auto-converted legacy text is ugly**: The `legacyToSteps()` function produces jargon-heavy steps from old structured fields. Only the manual backfill makes it normie-friendly. New calls generated by SKILL.md will be fine, but any un-backfilled legacy data will look bad.
- **TS preflight hook false positives**: Every edit blocked by pre-existing errors in scripts/adapters/. Wasted time confirming board/ is clean after each edit.

### Key Decisions
- Decision: Flat `steps: string[]` over structured fields
  - Alternatives: keep structured but add `normie_summary`, or add a `display_text` field
  - Reason: structured fields impose a fixed mental model; steps let the reasoning be however long it needs
- Decision: Keep `chose_over` as separate field (not a step)
  - Alternatives: include alternatives as the last step
  - Reason: chose_over is detail-page content, not card content. Mixing it into steps would clutter the feed.
- Decision: Preserve legacy fields in DB alongside steps
  - Alternatives: delete old fields during migration
  - Reason: other consumers (detail page, server templates) may reference them. Safer to add than remove.

## Artifacts
- `board/types.ts` — DerivationChain, LegacyDerivationChain, extractChainDisplay()
- `board/components/CallCard.tsx` — greentext card rendering
- `board/pages/CardDetail.tsx` — detail page steps rendering
- `board/templates/permalink.ts` — server-rendered permalink
- `board/templates/card.ts` — OG card template
- `SKILL.md:77-130` — generation instructions
- `references/derivation-chain.md` — canonical examples
- `board/migrate-greentext.ts` — backfill migration script

## Action Items & Next Steps

1. **Fix +Infinity% on TEST entry** — from previous handoff. `computePnl` divides by zero when `entry_price === 0`. Guard in `board/utils.ts`.

2. **Fix anonymous caller flow** — reverted API requires `caller_id`. Either re-implement anonymous generation or update SKILL.md POST instructions with a default caller_id.

3. **Clean up `board/card-playground.html`** — dev artifact from tweet-card comparison session. Delete or gitignore.

4. **Fix pre-existing TS errors in scripts/adapters/** — `angel/instruments.ts`, `angel/returns.ts`, `bankr/instruments.ts` have type errors that trigger the preflight hook on every board/ edit. Fix them or exclude from tsconfig.

5. **Test greentext generation end-to-end** — run the belief router on a new input and verify the SKILL.md instructions produce well-formed steps (not structured fields).

6. **Consider removing Row 3 ticker badge** — the ticker now appears inline in the last greentext step. The `▲ DELL` badge in Row 3 may be redundant. Or keep it for scannability.

## Other Notes
- Board server: `bun --hot board/server.ts` (port 4000). Must use `--hot` for component changes to take effect.
- The 12 hand-written greentext steps were collaboratively designed in conversation. They're stored in the DB via `migrate-greentext.ts` and also documented in `references/derivation-chain.md`.
- `board/migrate-greentext.ts` is a one-time script. Safe to delete after confirming data is correct. It matches calls by `(source_handle, ticker)` and only updates rows with existing derivation data (skips BigA's older duplicate entries).
