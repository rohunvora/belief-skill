# Belief-Router Test System

This directory contains the test infrastructure for `belief-router`. It bridges the gap between Claude's skill routing (SKILL.md) and human evaluation, turning each routing decision into a test case.

## Overview

### Problem
You're great at writing inputs for the skill, but evaluating outputs is hard. You never know:
- Is the leap justified or did Claude overreach?
- Is this the best instrument or just one option?
- Is the conviction calibrated correctly?

### Solution
**Rating UX in Telegram** → **Automatic test case collection** → **Pattern analysis**

After the skill routes each thesis, you rate it with 4 buttons. Each rating becomes a test case in `results.jsonl`. Over time, you build a corpus of real-world routings with your judgments.

## Workflow

### 1. User Inputs Thesis (Telegram)

```
User: "SOL is going to flip ETH. The developer migration is accelerating, every new protocol launches on Solana first."
```

### 2. Skill Routes & Asks for Rating

The skill outputs the full routing:
- Deeper claim analysis
- Instrument selection reasoning
- Conviction level

Then adds:

```
⭐ Rate this routing (choose one):
┌─────────────────────────────────┐
│ 🎯 Excellent — nailed the thesis │
│ ✓ Good — solid call              │
│ ⚠️  Okay — some issues            │
│ ✗ Miss — totally off              │
└─────────────────────────────────┘
```

### 3. User Rates (10 seconds)

If **Excellent** → Ask optional follow-ups:
```
Extra 30 seconds?
┌──────────────────────────────┐
│ ✓ Leap distance accurate?    │
│ ✓ Best instrument?           │
│ ✓ Conviction calibrated?     │
└──────────────────────────────┘
```

If **Miss** → Capture what went wrong:
```
What went wrong?
┌──────────────────────────────────┐
│ 🎯 Wrong direction (long vs short)│
│ 📊 Wrong ticker/instrument       │
│ 🚨 Conviction too high/low       │
│ 🔗 Leap unjustified              │
│ ❌ Other                         │
└──────────────────────────────────┘
```

### 4. Result Auto-Saved

One line appended to `tests/results/results.jsonl`:

```jsonl
{"id":"tr-2026-02-18-001","timestamp":"2026-02-18T14:32:00Z","status":"rated","input":{"text":"SOL is going...","source_type":"chat","platform":"telegram","user_id":"satoshi_clawd"},"skill_output":{"call_type":"derived","author_claim":"SOL will outperform...","author_ticker":"SOL","routed_ticker":"SOL-ETH","conviction":"high","trade_expression":"long SOL / short ETH on Hyperliquid...","derivation_steps":3,"leap_distance":"medium"},"rating":{"quality":"excellent","leap_accuracy":"accurate","instrument_pick":"excellent","conviction_calibration":"correct","concerns":[]},"metadata":{"session_date":"2026-02-18","user_notes":"Pair trade logic was crystal clear","blocked_by":null,"follow_up":null}}
```

## Test Result Schema

### Top Level

```typescript
{
  id: string;                // "tr-2026-02-18-001" — unique identifier
  timestamp: string;         // ISO 8601, when result was saved
  status: "rated" | "flagged" | "needs_review";  // always "rated" on save
  input: TestInput;
  skill_output: SkillOutput;
  rating: Rating;
  metadata: Metadata;
}
```

### input

```typescript
{
  text: string;              // User's original input
  source_type: "chat" | "transcript" | "article" | "tweet" | "other";
  platform: "telegram" | "clawd" | ...;
  user_id: string;          // For tracking patterns across sessions
}
```

### skill_output

```typescript
{
  call_type: "direct" | "derived";
  author_claim: string;      // What the user actually said (Layer 1)
  author_ticker: string | null;   // Ticker user named (if any)
  routed_ticker: string;     // What skill routed to
  conviction: "low" | "medium" | "high";
  trade_expression: string;  // The trade in plain English
  derivation_steps: number;  // How many steps in the chain?
  leap_distance: "none" | "tiny" | "small" | "medium" | "large" | "max";
}
```

### rating

```typescript
{
  quality: "excellent" | "good" | "okay" | "miss";
  leap_accuracy: "accurate" | "inaccurate" | "skipped";
  instrument_pick: "excellent" | "good" | "acceptable" | "poor";
  conviction_calibration: "correct" | "too_high" | "too_low" | "skipped";
  concerns: [
    "conviction_too_high",      // Conviction > actual evidence
    "leap_unjustified",         // Leap doesn't follow from claim
    "tick_too_risky",           // Ticker is illiquid / speculative
    "lacks_catalyst",           // No time trigger
    "already_priced_in",        // Market already knows
    "wrong_direction",          // Should be short, not long
    "wrong_instrument",         // Suggests a different trade entirely
  ];
}
```

### metadata

```typescript
{
  session_date: string;      // YYYY-MM-DD
  user_notes: string | null; // Free-form feedback from user
  blocked_by: string | null; // "missing_market_data", "api_limit", etc.
  follow_up: string | null;  // ID of next test if iterating on same thesis
}
```

## Analysis Tools

### Summary Report

```bash
bun run tests/analyze-results.ts
```

Shows:
- Total results + success rate
- Quality distribution (excellent/good/okay/miss)
- Leap distance distribution
- Source type performance

### By Concern

```bash
bun run tests/analyze-results.ts --by-concern
```

Top concerns by frequency:
- `leap_unjustified` (22%)
- `conviction_too_high` (18%)
- etc.

### By Source Type

```bash
bun run tests/analyze-results.ts --by-source
```

Which input types produce best routings?
- Transcripts: 87% success
- Chat: 72% success
- Tweets: 65% success

### Contradictions

```bash
bun run tests/analyze-results.ts --contradictions
```

Flags:
- "Excellent but has concerns" (1)
- "High conviction but rated miss" (3)
- etc.

### Leap Distance Correlation

```bash
bun run tests/correlate-leap-distance.ts
```

Key question: **Do larger leaps get worse ratings?**

```
Leap        Count    Success Rate
none          3        100%
tiny          5         80%
small        12         75%
medium       18         60%
large        15         40%
max           4         25%
```

Is this monotonically decreasing? If not, leap distance metric may be miscalibrated.

### Detailed Breakdown

```bash
bun run tests/correlate-leap-distance.ts --detail
```

Per-leap statistics:
- Average derivation steps
- Conviction distribution within each leap
- Top concerns per leap

### Recent Results

```bash
bun run tests/analyze-results.ts --recent 5
```

Last 5 results with full context.

### Export to Spreadsheet

```bash
bun run tests/analyze-results.ts --export > results.tsv
```

Import into Google Sheets for custom analysis.

## Validation

```bash
bun run tests/validate-results.ts
```

Checks:
1. **Schema validation** — all required fields present
2. **Enum validation** — conviction must be "low|medium|high", etc.
3. **Consistency checks**:
   - If `quality="excellent"`, `leap_accuracy` should not be "inaccurate"
   - If `quality="miss"`, should have at least one concern
   - If `conviction="high"` and concern is "lacks_catalyst", flag as warning

Verbose mode:

```bash
bun run tests/validate-results.ts --verbose
```

Analyze patterns:

```bash
bun run tests/validate-results.ts --analyze
```

## Integration with Existing Tests

### leap-distance-samples.ts

Hand-written test cases with expected leap distances. Use to:
1. **Validate metric calibration** — run results.jsonl against the metric
2. **Add new cases** — when you find a result that disagrees with samples, convert it to a sample

### scoring.test.ts

Deterministic tests of the ranking formula. These should continue to pass. If a new pattern in results.jsonl suggests the formula is wrong, update the tests.

### e2e-routing.ts

End-to-end routing tests with live adapter calls. Use correlation analysis to identify which adapters are failing or misrouting.

## Workflow Integration

### During Development

1. Build a feature in SKILL.md
2. Test it manually in Telegram → get ratings
3. Run: `bun run tests/analyze-results.ts --by-concern` → identify patterns
4. Fix the issues → test again
5. When confident, convert top results to `leap-distance-samples.ts` cases

### Before Shipping

1. `bun run tests/validate-results.ts` — ensure no contradictions
2. `bun run tests/correlate-leap-distance.ts` — verify leap metric is calibrated
3. `bun run tests/analyze-results.ts` — confirm success rate is acceptable
4. `bun run bun test` — run all deterministic tests

### Iterating on Problem Cases

If a result is rated "miss":

```bash
bun run tests/analyze-results.ts --recent 1  # Find the ID
```

Save the input + skill_output to `tests/` as a regression test, then fix SKILL.md.

```bash
bun run tests/analyze-results.ts --contradictions  # Spot bad patterns
```

## Example Queries (jq)

Raw JSONL power:

```bash
# All "miss" results
cat tests/results/results.jsonl | jq 'select(.rating.quality == "miss")'

# All "excellent" with a concern
cat tests/results/results.jsonl | jq 'select(.rating.quality == "excellent" and (.rating.concerns | length > 0))'

# Miss rate by leap distance
cat tests/results/results.jsonl | jq -r '[.skill_output.leap_distance, .rating.quality] | @csv' | sort | uniq -c

# Average derivation steps by conviction
cat tests/results/results.jsonl | jq -r '[.skill_output.conviction, .skill_output.derivation_steps] | @csv' | sort | group_by('.[0]') | ...

# Find results where user notes mention a specific concept
cat tests/results/results.jsonl | jq 'select(.metadata.user_notes | contains("liquidity"))'
```

## Common Patterns to Watch

### Pattern: Leap distance disagrees with quality

You're rating "max" leaps as "excellent" but "small" leaps as "okay".

→ Your leap distance metric is miscalibrated, OR your ratings are inconsistent.

**Fix:** Either recalibrate leap_distance calculation in SKILL.md, or re-examine your ratings.

### Pattern: High conviction all rated "miss"

Conviction is "high" in skill_output but rating is "miss".

→ Skill is overconfident, OR evidence threshold is too low.

**Fix:** Adjust conviction calibration rules (add more evidence gates before marking "high").

### Pattern: One source type performs worse

Transcripts: 87% success | Tweets: 50% success

→ Skill may be tuned for one format.

**Fix:** Add test cases for the underperforming source type, identify the gap.

### Pattern: Specific concern keeps appearing

"leap_unjustified" appears in 30% of misses.

→ Derivation chain is weak in some thesis shape (e.g., sector themes).

**Fix:** Strengthen derivation reasoning for that shape in SKILL.md.

## Next: Feedback Loop

Once you have 20+ results:

1. Run correlation analysis: `bun run tests/correlate-leap-distance.ts --detail`
2. Identify the worst-rated leap distances
3. Read those results: `bun run tests/analyze-results.ts --export`
4. Update SKILL.md to fix the pattern
5. Re-test those same theses
6. Check if success rate improved

This is your ground truth. Keep it up.
