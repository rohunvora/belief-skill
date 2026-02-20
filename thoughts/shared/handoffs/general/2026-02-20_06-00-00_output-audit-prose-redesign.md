---
date: 2026-02-20T06:00:00+0000
session_name: general
researcher: claude
branch: main
repository: belief-skill
topic: "Output Audit: Corrupted Session Recovery + Prose Redesign"
tags: [belief-router, output-format, audit, prose, card-removal, overfitting]
status: ready-to-test
---

# Output Audit: Corrupted Session Recovery + Prose Redesign

## What happened

A previous Claude Code session completed an 8-task "Time-Aware Output Redesign" plan (`.cursor/plans/time-aware_output_redesign_337c86ee.plan.md`) but suffered terminal rendering corruption before changes could be verified. This session audited every change, tested against real chatlogs, and ended up redesigning the Output section from a different angle entirely.

## The corrupted session's changes (6 total to SKILL.md)

1. **Exposure Type concept** — new subsection naming underlying exposure before instrument search
2. **Data Confidence** — grounded vs estimated numbers, 3+ rubric dimension rule
3. **"Instrument class" → "delivery mechanism"** — language change throughout
4. **Output restructure** — card-first, telegram/markdown medium detection, reasoning capped at 4 paragraphs
5. **Gate loosening** — "never estimate" changed to "mark with (est)"
6. **Board URLs + prod hardening** — localhost:4000 → fly.dev, DATA_DIR env var, HMR conditional

## Audit results (tested against belief-router-test-2026-02-19.md)

| Change | Verdict | Why |
|---|---|---|
| Exposure Type | **Overfitting** | Model already found IVOL for rate vol thesis without the concept |
| Data Confidence | **Overfitting** | No hallucinated numbers in test data |
| Delivery mechanism | **Overfitting** | Model already compared TLT strangle vs IVOL naturally |
| Output restructure | **Partially valid** | Card-first was good, but card format itself was the problem |
| Gate loosening | **Harmful** | Weakened strictest quality gate without evidence |
| Board URLs + prod | **Valid** | Infrastructure, kept |

3 of 6 changes were solving problems that didn't exist in the test data. The model was already smart enough to find the right instruments without Exposure Type or delivery mechanism concepts.

## The key insight

The formatted card (price ladder, scenario table, column-aligned box) doesn't belong in the chat reply. Evidence:

- **Test 3 rated 3.5/5** with feedback "hard to read/digest" — the card was the problem
- **Users never asked about the price ladder.** Follow-up questions were about leverage, platforms, alternatives
- **Price ladder numbers are arbitrary.** Model picks anchor prices (52W high, stop loss %) and computes precise-looking P&L. Entry price is real. Targets are guesses dressed as math.
- **The best output in every test was the prose explanation**, not the card
- **The model repeated its analysis twice** — once as reasoning paragraphs, once as card scenarios

## What we did

1. **Reverted** SKILL.md to baseline (`git checkout HEAD -- SKILL.md`)
2. **Re-applied** only board URL changes (localhost → fly.dev) and for-agents.ts fix
3. **Redesigned** the Output section around prose:
   - Reply is prose, not a formatted card
   - Source excerpt leads for sourced calls (tied to Input Validation steps 4-6)
   - Ticker and price early (first two sentences)
   - Principles-based, not step-by-step template: "in whatever order fits this specific thesis"
   - Honest precision: ranges for upside ("could 2-3x"), exact for entry price
   - Verifiable facts for edge ("TLT IV at 10%"), not computed numbers ("+EV above 28%")
   - Never exceed two paragraphs of reasoning
   - Board POST still sends structured JSON (price_ladder, derivation chain) for the frontend
4. **Updated** DECISIONS.md with decisions 52-57

## Current state of changes (UNCOMMITTED)

```
.claude/DECISIONS.md          |  54 +++
SKILL.md                      | 125 +++---
board/db.ts                   |   5 +-
board/server.ts               |  11 ++--
board/templates/for-agents.ts |   2 +-
```

- `SKILL.md` — Output section rewritten (prose), board URLs updated, bulk mode deep route example updated
- `board/db.ts` — DATA_DIR env var for fly.io persistent volumes (from corrupted session, kept)
- `board/server.ts` — HMR conditional for production (from corrupted session, kept)
- `board/templates/for-agents.ts` — localhost → fly.dev (missed by corrupted session, fixed)
- `.claude/DECISIONS.md` — decisions 52-57 documenting audit and redesign

## Next step

**Sync SKILL.md to clawd and test live.** Paste the marginsmall tweet ("market all in on duration mismatch") and compare output against the old test log. The prose format should produce ~250 words instead of ~1,800, with the ticker in the first two sentences and no formatted card.

If it works, commit. If the model still produces a formatted card (old habits from training data), the Output section may need a stronger negative instruction.

## Key files

- `SKILL.md` — the skill prompt (Output section lines 463-485)
- `.claude/DECISIONS.md` — decisions 52-57
- `~/clawd/exports/belief-router-test-2026-02-19.md` — test chatlogs used for audit
- `.cursor/plans/time-aware_output_redesign_337c86ee.plan.md` — the corrupted session's plan (all tasks marked complete, but changes reverted)
