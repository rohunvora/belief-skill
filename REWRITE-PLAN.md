# Planned Rewrite: Agentic Loop Architecture

Modeling after Claude Code's research agent — the gold standard for agentic tool-using systems.

## Why Rewrite

Current SKILL.md is a **linear pipeline**: Phase 1 → 2 → 3 → 4 → 5. Each phase runs once. The only backtrack is Phase 4 contradicting Phase 3.

Claude Code is a **recursive loop**: gather context → act → verify → loop until the output passes verification. It self-corrects. It can abandon an approach mid-execution and try a different one. It verifies its own work against objective criteria before presenting it.

Our skill should work the same way. A belief comes in. The skill gathers context, forms a thesis, finds a trade, verifies the trade makes sense, and loops if it doesn't. The output is only sent when it passes self-verification.

## Architecture: Current → Proposed

### Current (Linear Pipeline)

```
Input → Phase 1 (claim + shape)
      → Phase 2 (research)
      → Phase 3 (find trade)
      → Phase 4 (validate + price)
      → Phase 5 (output)
```

Each phase has a gate but no backtracking loop. If Phase 3 produces a bad trade, the only mechanism is Phase 4 contradicting it and a manual note to "go back." In practice, the LLM rarely backtracks — it commits to its first candidate.

### Proposed (Agentic Loop)

```
Input → UNDERSTAND → RESEARCH → CONSTRUCT → VERIFY ─┐
              ↑                                       │
              └───────── loop if verify fails ────────┘
                                                      │
                                              VERIFY PASSES
                                                      │
                                                      ▼
                                                   OUTPUT
                                              (take + card)
```

Three phases, not five. Each phase can trigger a return to an earlier phase. Output only happens after verification passes.

## Phase Definitions

### UNDERSTAND

**Purpose:** Turn the user's raw input into a structured thesis with a clear shape, deeper claim, and time horizon.

**Maps to:** Current Phase 1 (deeper claim + classify shape) + Input Validation.

**What changes:**
- Clarity gate stays — ask user for interpretation if ambiguous
- Cultural decoding stays — person/brand → movement
- Compound decomposition stays — multi-claim → strongest leg
- **New: thesis statement is written out as a single sentence** that the skill will use as its north star for the rest of the loop. Everything downstream references this sentence.

**Gate:** A thesis statement exists, a shape is classified, and a time horizon is estimated. If not, loop within UNDERSTAND (ask user, re-decode) until all three exist.

**Claude Code parallel:** "Explore first" — read files, understand the codebase before touching anything. UNDERSTAND reads the belief before researching anything.

### RESEARCH

**Purpose:** Ground the thesis in live data. Find the specific numbers that make the thesis tradeable or kill it.

**Maps to:** Current Phase 2 (research) + Phase 3 Step 0 (binary check).

**What changes:**
- Web search for current state, consensus, what's moved
- Prediction market check is now part of RESEARCH, not a separate step in CONSTRUCT
- Past belief check (track.ts check) moves here
- **New: RESEARCH can kill the thesis entirely.** If research reveals the thesis is already fully priced in, consensus agrees, or the data contradicts the claim — the skill says so and stops. No forcing a trade. Current skill always finds something; this version can say "the market already agrees with you, there's no edge here."
- **New: RESEARCH produces a structured evidence brief** — 3-5 numbered facts with sources that CONSTRUCT and VERIFY reference. This is the equivalent of Claude Code reading files into context before editing.

**Gate:** ≥3 specific data points with numbers and dates. If not enough data found, loop (try different search queries) or surface to user: "I can't find enough data to ground this. What do you know that I don't?"

**Claude Code parallel:** "Gather context" — read files, search, web fetch. RESEARCH gathers the market context the same way.

### CONSTRUCT

**Purpose:** Build the trade. Score candidates, cross-check, structure the position.

**Maps to:** Current Phase 3 (find trade) + Phase 4 (validate + price).

**What changes:**
- Step 1 (best-in-class), Step 1.5 (position structuring), Step 2 (cross-check), Step 2.5 (private market scan) all merge into CONSTRUCT
- Adapter scripts run here — instruments.ts, returns.ts for live pricing
- Payoff scenarios built here
- Conviction breakeven calculated here
- **New: CONSTRUCT produces a "trade spec"** — a structured object with all fields needed for the card AND for verification. Ticker, price, direction, qty, scenarios, kills, alt, β, convexity, time cost. This is the equivalent of Claude Code making edits — the concrete action.

**Gate:** A complete trade spec exists with live pricing. If adapter scripts fail or instrument is illiquid/nonexistent, loop back to CONSTRUCT with a different candidate.

**Claude Code parallel:** "Take action" — edit files, run commands. CONSTRUCT builds the trade the same way Claude Code builds the code.

### VERIFY

**Purpose:** Self-check the trade spec before outputting. This is the critical addition that doesn't exist in the current skill.

**Maps to:** Current Phase 3 Step 3 (stress-test) — but much stronger.

**Verification checks:**

1. **Math check.** Does qty × price = bet size? Do scenario payoffs compute correctly given the instrument type? For options: is breakeven price correct? For perps: is liquidation price correct?

2. **Instrument check.** Does the ticker actually exist on the stated platform? Is the price current (not stale)? Is there sufficient liquidity for the position size?

3. **Thesis alignment check.** Does the instrument actually move when the thesis plays out? Restate: "If [thesis statement from UNDERSTAND] is true, does [instrument] go [direction]?" If the answer isn't clearly yes, the instrument has low thesis beta and should be reconsidered.

4. **Stress-test check.** What's the strongest case against this trade? Can it be rebutted with evidence from RESEARCH? If not, is the risk flagged in kills?

5. **Novelty check.** Has the user already expressed a similar belief (track.ts check)? If so, is this adding to existing exposure or contradicting a past position?

6. **Output quality check.** Is the take compelling? Does the probability gap make sense? Are the bold claims actually verifiable? Would a sharp trader read this and think "interesting" or "obvious"?

**If any check fails:**
- Math/instrument check fails → loop back to CONSTRUCT (fix the numbers or pick different instrument)
- Thesis alignment fails → loop back to UNDERSTAND (the deeper claim might be wrong)
- Stress-test reveals devastating counter → loop back to CONSTRUCT (try runner-up)
- Novelty check flags overlap → surface to user with context before outputting

**If all checks pass → OUTPUT**

**Claude Code parallel:** "Verify results" — run tests, check output. This is the single highest-leverage pattern from Claude Code. Their docs literally say: "Give Claude a way to verify its work. This is the single highest-leverage thing you can do."

### OUTPUT

**Purpose:** Deliver the take + card. Only reached after VERIFY passes.

**Maps to:** Current Phase 5.

**No changes to output format** — The Take (streamed prose, bold claims, probability gap) + The Card (≤10 line spec sheet via message tool with buttons). The v2.1 format stays.

**New: confidence tag.** Based on how many VERIFY loops it took:
- First pass → high confidence (clean routing, no backtracking)
- 1-2 loops → medium confidence (had to adjust, worth noting)
- 3+ loops → flag to user: "This was a hard one to route cleanly. Here's my best attempt but the thesis-to-instrument connection is looser than usual."

This is the equivalent of Claude Code's commit message quality — clean implementations get clean commits, messy ones get noted.

## What Gets Cut from Current SKILL.md

| Current section | Disposition |
|---|---|
| Input Validation | Merged into UNDERSTAND |
| Phase 1: Deeper Claim + Shape | Merged into UNDERSTAND |
| Phase 2: Research | Becomes RESEARCH |
| Phase 3: Find Trade | Merged into CONSTRUCT |
| Phase 4: Validate + Price | Merged into CONSTRUCT |
| Phase 5: Output | Becomes OUTPUT (unchanged) |
| Worked examples table | Keep — moves to UNDERSTAND |
| Thesis shapes table | Keep — moves to UNDERSTAND |
| Adapter script references | Keep — moves to CONSTRUCT |
| Button callbacks | Keep — moves to OUTPUT |
| Recording CLI | Keep — moves to OUTPUT |
| Rules section | Keep — applies globally |
| Expression fidelity ladder | Keep — moves to CONSTRUCT as fallback |

## What's New

1. **VERIFY phase** — self-checking loop. The biggest structural addition.
2. **Evidence brief** — RESEARCH produces numbered facts that downstream phases reference.
3. **Trade spec** — CONSTRUCT produces a structured object, not just prose reasoning.
4. **Thesis statement** — UNDERSTAND produces a single sentence that everything references.
5. **Loop-back mechanism** — any phase can trigger return to earlier phase.
6. **Thesis kill** — RESEARCH can terminate the routing if there's no edge.
7. **Confidence tag** — output signals how clean the routing was.

## Estimated SKILL.md Impact

Current: ~530 lines.
Proposed: ~400-450 lines. Merging 5 phases into 3+VERIFY should reduce redundancy (cross-check and stress-test are currently split across Phase 3 steps; they merge into VERIFY). New VERIFY section adds ~40-50 lines.

Net: ~80-130 lines shorter. More token efficient.

## Migration

The rewrite is a structural reorganization, not a logic change. Every current rule, table, and principle survives — they just move to different phases. The new elements (VERIFY, evidence brief, trade spec, thesis kill, confidence tag) are additions, not replacements.

Order of operations:
1. Write new UNDERSTAND section (merge Input Validation + Phase 1)
2. Write new RESEARCH section (merge Phase 2 + binary check)
3. Write new CONSTRUCT section (merge Phase 3 + Phase 4)
4. Write new VERIFY section (net new)
5. Copy OUTPUT section (unchanged from v2.1)
6. Copy Rules section (unchanged)
7. Delete old Phase 1-5 sections
8. Test against 5+ diverse theses
9. Compare outputs old vs new
10. Push to main as v3.0
