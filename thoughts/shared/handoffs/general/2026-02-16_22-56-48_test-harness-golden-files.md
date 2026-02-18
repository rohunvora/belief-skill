---
date: 2026-02-17T03:56:48+0000
session_name: general
researcher: claude
git_commit: 77c5dbb381eceb0dca8560e210abcf14e3fa1664
branch: main
repository: belief-skill
topic: "Test Harness Design + Golden File Collection + Skill Bug Fixes"
tags: [testing, golden-files, skill-improvements, hyperliquid-fix]
status: complete
last_updated: 2026-02-16
last_updated_by: claude
type: implementation_strategy
root_span_id: ""
turn_span_id: ""
---

# Handoff: Test harness design, golden file collection, skill mode gates

## Task(s)

1. **Research test harness best practices** — COMPLETED. Researched test pyramid vs diamond vs trophy for this project's architecture. Conclusion: test diamond fits (adapter-heavy project needs contract tests at boundaries, not more unit tests). Documented minimum viable test harness.

2. **Golden file collection workflow** — IN PROGRESS. Established workflow: user tests skill in separate sessions, comes back with results, we capture session logs + summaries. Two golden tests captured so far:
   - Nettspend (non-investable cultural thesis) — PASS
   - PLTR military AI (macro sector thesis + Hyperliquid perp) — PASS after bug fix

3. **Skill mode gates** — COMPLETED. Added 9-line Mode Gates section to SKILL.md (Research→Recommend: no fabricated numbers; Recommend→Execute: ask before acting).

4. **Hyperliquid xyz dex fix** — COMPLETED (by user's other session). Adapter now queries both default crypto perps AND HIP-3 builder dexes (xyz). PLTR, AAPL, GOLD etc. now discoverable.

5. **User's next priority** — DISCUSSED. User wants the skill to be faster, more efficient, more normie-friendly without losing analytical edge. This is the next major task.

## Critical References
- `SKILL.md` — the skill definition, recently updated with Mode Gates section
- `tests/golden/` — new directory with session logs and summaries
- `scripts/adapters/hyperliquid/instruments.ts` — modified by other session to support xyz dex

## Recent changes
- `SKILL.md:233-241` — added Mode Gates section (9 lines, table format)
- `.claude/skills/belief-router/SKILL.md` — symlinked to root SKILL.md for skill discovery
- `tests/golden/nettspend-session.jsonl` — raw session log
- `tests/golden/nettspend-summary.md` — human-readable trace + verdict
- `tests/golden/pltr-military-ai-session.jsonl` — raw session log (4MB)
- `tests/golden/pltr-military-ai-summary.md` — trace + verdict + bug documentation

Changes made by OTHER session (uncommitted, on disk):
- `scripts/adapters/hyperliquid/instruments.ts` — queries both dexes in parallel
- `scripts/adapters/hyperliquid/returns.ts` — auto-resolves tickers to correct dex
- `scripts/track.ts` — fetchPrice() checks both dexes
- `references/output-format.md` — minor updates
- `tests/smoke-adapters.ts` — minor update

## Learnings

1. **User thinks in X's not Y's.** User can generate test inputs (theses) easily but struggles to predict expected outputs. Golden file approach works: run the skill, user approves/rejects the output, save as reference. The "guardrail" approach (what should NOT happen) is also natural for them.

2. **The e2e routing test bypasses Claude.** The `tests/e2e-routing.ts` only exercises adapter plumbing with keyword matching. It does NOT test the actual skill experience (web search, reasoning, follow-ups). Real skill testing requires running via Claude API — that's an eval, not a unit test.

3. **Two classes of bugs from Nettspend session:**
   - Price fabrication: skill estimated ~$50 ticket price when no data source existed. Fixed by Mode Gates (Research→Recommend gate).
   - Premature action: skill opened browser tabs without asking. Fixed by Mode Gates (Recommend→Execute gate).
   - Root cause for both: no explicit mode boundaries in the skill.

4. **Hyperliquid has two dex types.** Default crypto perps (229 assets) and HIP-3 builder-deployed dexes (xyz has 45 assets including equities, commodities, FX). The adapter only queried default. This meant PLTR, AAPL, GOLD etc. were invisible.

5. **Bun was not installed** on this machine at session start. Installed v1.3.9 via `curl -fsSL https://bun.sh/install | bash`. PATH: `~/.bun/bin/bun`.

## Post-Mortem

### What Worked
- **Golden file workflow**: User tests skill naturally → captures bugs → we formalize. Much more effective than trying to design test cases in the abstract.
- **Parallel research**: Launched research-agent in background while reading codebase. Got comprehensive report without blocking main work.
- **Mode gates as table**: Compressed 18 lines of prose to 9 lines of table. Same clarity, half the tokens per skill invocation.
- **User-driven testing**: Having the user run real theses exposed bugs (price fabrication, browser permission, xyz dex) that no pre-planned test would catch.

### What Failed
- **Tried to explain test harness abstractly first**: User didn't connect with test pyramid/diamond concepts. Only clicked when we shifted to "just use the skill and tell me what went wrong."
- **Initially wrote verbose mode gates**: 18 lines of explanatory prose. User correctly pushed for token efficiency — compressed to 9-line table.

### Key Decisions
- Decision: Golden file approach over automated evals
  - Alternatives: Automated Claude API evals, snapshot testing, property-based testing
  - Reason: User's workflow is interactive. Golden files capture real usage. Automated evals can come later once there are enough golden files to define what "correct" looks like.

- Decision: Mode gates in SKILL.md (not code-level validation)
  - Alternatives: Pre-commit hooks on track.ts to reject unsourced prices, browser permission middleware
  - Reason: These are prompt-level behaviors. Fixing them in the skill instructions is the right abstraction level — code can't enforce "don't fabricate."

- Decision: Test diamond over test pyramid
  - Alternatives: More unit tests, full e2e coverage
  - Reason: Adapter boundary is where bugs live. Unit tests for scoring logic already excellent (29 tests). E2E routing test can't test Claude's reasoning.

## Artifacts
- `tests/golden/nettspend-session.jsonl` — full raw session log
- `tests/golden/nettspend-summary.md` — verdict + trace
- `tests/golden/pltr-military-ai-session.jsonl` — full raw session log
- `tests/golden/pltr-military-ai-summary.md` — verdict + trace + bug docs
- `SKILL.md:233-241` — Mode Gates section
- `.claude/skills/belief-router/SKILL.md` — symlink for skill discovery
- `.claude/cache/agents/research-agent/latest-output.md` — test harness research report

## Action Items & Next Steps

1. **Commit all changes** — SKILL.md mode gates, golden files, skill symlink. The Hyperliquid fix from the other session also needs committing.

2. **Speed/UX improvement** — User's #1 request: make the skill faster, more normie-friendly, easier to understand without losing edge. This is a product design task, not a code task. Consider:
   - Parallel adapter calls (currently sequential)
   - Progressive disclosure (simple card first, detail on request)
   - Shorter "take" section (currently 4-6 paragraphs, could be 2-3)
   - Faster research (fewer web searches, more targeted)

3. **More golden tests** — User is actively testing. Capture new session logs as they come. Priority theses to test: binary events, relative value, vulnerability/short-side.

4. **Build routing.test.ts** — Extract `routeThesis()`, `inferShape()`, `suggestTickers()` from `e2e-routing.ts` into testable modules. ~5-8 pure function tests, <100ms.

5. **Build adapter contract tests** — Capture JSON fixtures from each adapter, write shape validation tests. ~10-15 tests, <200ms, no network.

6. **Add bunfig.toml** — Coverage thresholds, bail, timeout config.

## Other Notes

- The scoring tests (`tests/scoring.test.ts`) still test the OLD formula (`thesis_beta * convexity / (1 + time_cost)`) despite v3.0 saying "rubric replaces formula." Need to clarify with user whether formula is still used for initial ranking before rubric does head-to-head, or if these tests are now testing superseded logic.

- `tests/test-theses.json` has 8 theses but the golden file approach is capturing richer data (full session traces). Consider whether test-theses.json evolves into golden files or stays as adapter-level routing tests.

- Bankr adapter exists in `scripts/adapters/bankr/` but is not in smoke tests or e2e routing. Either test it or remove it.

- Research report cached at `.claude/cache/agents/research-agent/latest-output.md` — comprehensive analysis of test harness options with Bun v1.3.8/1.3.9 specifics.
