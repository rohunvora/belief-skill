# Test System Design Decisions

## Overview
Belief-Router testing bridges Claude's skill routing with human evaluation. Each rating becomes a test case, building a corpus for pattern analysis.

## 1. JSONL Format for Results

**Decision:** Line-delimited JSON in `tests/results/results.jsonl`

**Why:**
- Append-only (no locking, safe from concurrent writes)
- Queryable with `jq` for quick analysis
- Git-friendly (one line per test = clear diffs)
- Integrates with Bun utilities (no external database)

**Schema:** See `tests/README-TESTING.md` for full details

## 2. Rating UX: 4-Button Flow

**Decision:** Multiple choice buttons in Telegram → optional follow-ups

```
⭐ Excellent | ✓ Good | ⚠️  Okay | ✗ Miss
```

Then conditional prompts (follow-ups only if needed).

**Why:**
- Minimal cognitive load (4 buttons vs. open-ended feedback)
- Captures signal without exhausting user
- Optional follow-ups for users who want to provide more detail

## 3. Real-Time Append vs. Batch Save

**Decision:** Real-time append (Option A)

Each rating immediately appended to `results.jsonl` after user submits.

**Why:**
- Frictionless (user doesn't think about "saving")
- Safer (no unsaved state)
- Enables mid-session analysis (`cat results.jsonl | jq`)
- Natural for version control (auto-commit at end of session)

## 4. Three Analysis Tiers

Built three complementary tools:

1. **validate-results.ts** — Schema + consistency checks
2. **correlate-leap-distance.ts** — Does leap metric calibrate to ratings?
3. **analyze-results.ts** — Pattern discovery (by quality, source type, concerns)

**Why:**
- Validation catches data entry errors early
- Correlation tests core hypothesis (bigger leaps → worse ratings?)
- Pattern discovery identifies actionable gaps

## 5. Integration with Existing Tests

**Decision:** New results don't replace leap-distance-samples.ts; they feed into it

When you find a disagreement:
1. Save the result in results.jsonl (automatic)
2. Run correlation analysis (automatic pattern finding)
3. Manually convert top patterns to new leap-distance-samples.ts cases
4. Update scoring.test.ts if formula needs adjustment

**Why:**
- Keeps hand-written tests as ground truth (human curated)
- Results as training data (automatic feedback)
- Both coexist: samples for regression, results for discovery

## 6. Metadata Preservation

Each result includes:
- `timestamp` (when rated, not when input was created)
- `source_type` (chat, transcript, article, tweet)
- `session_date` (for batch grouping)
- `user_notes` (free-form feedback)
- `blocked_by` (e.g., "missing market data")
- `follow_up` (link to next iteration on same thesis)

**Why:**
- Enables temporal analysis (are ratings drifting over time?)
- Enables source type analysis (which input formats work best?)
- Blocked/follow-up links enable multi-turn case studies

## 7. Concern Tags (vs. Free Text)

**Decision:** Predefined concern tags instead of open-ended feedback

Tags: `conviction_too_high`, `leap_unjustified`, `tick_too_risky`, `lacks_catalyst`, etc.

**Why:**
- Aggregatable (count concerns by type)
- Consistent (no "was too conviction-y" vs. "too bullish")
- Queryable (grep for patterns)
- Still supports free-form in `metadata.user_notes`

## 8. Monotonic Expectation for Leap Distance

**Decision:** Assume larger leaps should get worse ratings

Correlation tool checks: Does "max" leap have worse success rate than "none" leap?

If not monotonic → Either metric is wrong or ratings are inconsistent.

**Why:**
- Leap distance is meant to measure "distance from evidence"
- Larger leaps = bigger inference jumps = more ways to be wrong
- Monotonicity is a sanity check on both metric and rater

## 9. Validation Flags, Not Hard Errors

**Decision:** Contradictions are warnings, not rejection

Example: `quality="excellent"` + `concerns=["conviction_too_high"]`

→ Flag it, but still save the result. Let human decide if it's a typo or intentional.

**Why:**
- Real cases exist where high quality has minor concerns
- Aggressive validation would force rerating (friction)
- Flagging lets you decide what's truly inconsistent

## 10. No Automatic Retesting

**Decision:** Results feed insights, but you manually test to confirm

Example: "Medium leaps are rated worse than expected" 

→ Examine results, update SKILL.md, then re-rate those specific theses.

**Why:**
- Skill changes can fix or break different cases
- Confounding variables (new market data, different source type)
- Manual confirmation = real validation, not just correlation

## Future Extensions (Not Built Yet)

- **Live dashboard:** Embed analysis in belief.board so you see success rate in real-time
- **Auto-grouping:** Cluster similar theses and show how they're rated
- **Regression detection:** Alert if a previously "excellent" pattern starts getting "miss" ratings
- **Feedback loop:** Automatically suggest SKILL.md changes based on top concerns
- **Confidence intervals:** Once you have 50+ results, show 95% CI on success rate by leap distance

## Related Files

- `tests/validate-results.ts` — Validation and consistency checking
- `tests/correlate-leap-distance.ts` — Leap distance calibration analysis
- `tests/analyze-results.ts` — Pattern discovery and summary reports
- `tests/save-test-result.ts` — Library for saving results (used by skill)
- `tests/README-TESTING.md` — User guide for the testing system
- `tests/results/results.jsonl` — The data (append-only)
