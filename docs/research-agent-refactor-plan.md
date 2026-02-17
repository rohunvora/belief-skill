# Research Agent Refactor Plan

## Problem Statement

The current SKILL.md (541 lines) prescribes a rigid 4-phase pipeline that over-scripts two things Claude already does well natively:

1. **Thesis parsing** (Phase 1) -- Claude naturally decomposes claims, identifies deeper mechanisms, classifies shapes, and extracts time horizons. The 114 lines of Phase 1 instructions mostly teach Claude to do what it already does.

2. **Research** (Phase 2) -- Claude's web search is iterative and autonomous. Prescribing "search for X, then Y, then Z" is like giving a research agent a rigid checklist instead of a goal.

The skill's actual value-add is concentrated in three things that Claude CANNOT do natively:
- **Live market data APIs**: Yahoo Finance, Hyperliquid, Kalshi, Bankr, DexScreener, SEC EDGAR
- **Return/payoff math**: IV-derived targets, leveraged PnL, binary payoff, funding cost modeling
- **Cross-platform normalization**: The `thesis_beta x convexity / time_cost` scoring formula applied across heterogeneous platforms

The refactor restructures SKILL.md from a scripted pipeline into a research-agent-with-tools pattern: Claude reasons autonomously about the thesis and research, and calls structured tools (adapter scripts) when it needs live data or computed returns.

---

## Current Structure (what exists)

```
SKILL.md (541 lines)
  Defaults                      (~24 lines)  -- keep
  Input Validation              (~16 lines)  -- keep (guardrails)
  Phase 1: Extract + Classify   (~114 lines) -- mostly remove
  Phase 2: Research             (~32 lines)  -- mostly remove
  Phase 3: Find THE Trade       (~160 lines) -- restructure
  Phase 4: Validate & Price     (~66 lines)  -- restructure as tool docs
  Phase 5: Output               (~88 lines)  -- keep
  Rules                         (~20 lines)  -- keep
```

---

## Proposed Structure

### Section 1: Identity + Defaults (~30 lines, was ~24)

Keep the YAML frontmatter and Defaults section nearly as-is. Minor changes:

- Add a line: "You are a research agent. Investigate the thesis autonomously using your native reasoning and web search. Use the tools below when you need live market data or computed return profiles."
- Keep bet size, ranking metric, one-trade goal, time-horizon-match-to-thesis.

### Section 2: Input Validation (~16 lines, unchanged)

Keep as-is. This is a guardrail (reject non-theses, reframe vague vibes, handle action requests). These are not "research steps" -- they're gatekeeping before research begins.

### Section 3: Thesis Analysis Guidelines (~40 lines, was ~114 in Phase 1)

Replace the 114-line Phase 1 with a compressed set of guidelines. The key insight: Claude does not need step-by-step instructions for thesis parsing. It needs:

1. **Shape taxonomy** -- the 5-shape table (binary, mispriced company, sector/theme, relative value, vulnerability). Keep the table as-is (10 lines). This is reference data, not a process to follow.

2. **Deeper claim principle** (5 lines) -- "Every thesis has a surface claim and a deeper claim. The deeper claim often points to a completely different instrument. Trade the deeper claim." Keep the worked examples table (8 lines) as it is pedagogically excellent.

3. **Time horizon extraction** (5 lines) -- Catalyst date, price-in window, trade horizon. Keep the two worked examples (Fed hold, PQC mandate).

4. **Clarity gate** (5 lines) -- When to ask the user for clarification. Keep.

**What to remove from Phase 1:**
- "This is the most important step" preamble (Claude knows to prioritize)
- "Think in the Frame That Fits" section (3 frames: directional, probability, relative). Claude already knows these reasoning modes.
- The "Before anything else, classify the thesis" instruction -- Claude will naturally do this when it has the shape taxonomy.
- The "Gate: You MUST state..." instruction. Replace with a softer "Before calling any tools, determine: (a) thesis shape, (b) deeper claim, (c) time horizon."

### Section 4: Research Principles (~15 lines, was ~32 in Phase 2)

Replace the prescribed research steps with research principles:

```
## Research Principles

Research the thesis autonomously. You decide what to search and how deeply to go.
The goal is grounding: live data that either supports or contradicts the thesis.

Minimum before scoring instruments:
- 3 specific data points with numbers and dates (not vibes)
- Whether the thesis is already priced in (what's moved, what consensus thinks)
- If a prediction market contract exists on the exact event (check Kalshi)

Check past beliefs before researching:
  bun run scripts/track.ts check <keywords>
If overlap found, surface it to the user.
```

**What to remove from Phase 2:**
- The "What to Research" numbered list (5 items). This is exactly the over-prescription. Claude knows to research "current state," "what moved," and "consensus." Telling it to do so adds nothing.
- "Use web search (parallel searches for speed)" -- Claude decides its own search strategy.

### Section 5: Scoring + Trade Selection (~80 lines, was ~160 in Phase 3)

This is the core intellectual property of the skill. Keep the substance, restructure the presentation.

**Keep as-is:**
- The ranking metric: `thesis_beta x convexity / time_cost`
- Thesis beta, convexity, and time cost definitions with example ranges per instrument type
- Thesis beta floor rule ("if a candidate scores >5x higher on the metric...")
- Connection floor (retry if thesis beta < 60%)
- Disqualifiers (thesis contradiction, liquidity, priced in, time mismatch)
- Compound thesis handling
- "When No Traditional Instrument Exists" -- the expression fidelity ladder (Levels 1-5)
- Stress-test instructions (strongest case against the winner)

**Restructure:**
- Remove the step-by-step "Step 0, Step 1, Step 2, Step 3" sequential flow. Present these as evaluation principles instead of pipeline stages:
  - "Binary check: if a prediction market contract exists on the exact thesis, it must be explicitly beaten."
  - "Cross-check: always compare your best candidate against the best from at least one other instrument class."
  - "Stress-test: construct the strongest case against the winning trade before committing."
- Remove the "Where to look" table that routes shapes to platforms (Phase 1 shape table already does this).

**Private market scan:**
- Keep the trigger conditions (public beta < 50%) and the illiquidity-adjusted metric.
- Remove the "Step 2.5" numbering -- present it as: "If your best public instrument has thesis beta < 50%, also scan private markets."

### Section 6: Tools (~60 lines, was ~66 in Phase 4)

This is the most significant structural change. Phase 4 currently says "run these scripts to validate." The refactored version presents the scripts as a **tool catalog** that Claude calls when needed during its autonomous research -- not as a fixed sequence.

```
## Tools

These scripts connect to live market APIs. Call them when you need data.
Scripts output JSON to stdout (logs go to stderr).

### Instrument Discovery

Validate Claude-proposed tickers against live platform data:

  bun run scripts/adapters/robinhood/instruments.ts "TICKER1,TICKER2"
    Takes: comma or space-separated tickers
    Returns: validated instruments with price, market cap, 52-week range
    Source: Yahoo Finance

  bun run scripts/adapters/hyperliquid/instruments.ts "TICKER1,TICKER2"
    Takes: comma or space-separated tickers (supports aliases: PEPE -> kPEPE)
    Returns: validated perps with mark price, funding rate, OI, volume, max leverage
    Source: Hyperliquid API

  bun run scripts/adapters/kalshi/instruments.ts "keyword phrase"
    Takes: thesis keywords (matched against series-ticker map)
    Returns: open events sorted by date relevance (nearest + keyword-matching first)
    Source: Kalshi API

  bun run scripts/adapters/bankr/instruments.ts "thesis text"
    Takes: full thesis text (sent to Bankr AI agent)
    Returns: tokens, Polymarket markets, onchain instruments
    NOTE: async, 15-125s. Polls until complete.
    Source: Bankr Agent API

  bun run scripts/adapters/angel/instruments.ts "thesis keywords"
    Takes: keywords
    Returns: Republic, Wefunder, Crunchbase raises
    Source: Republic API, Wefunder HTML, Crunchbase autocomplete

  bun run scripts/adapters/shared/discover-edgar.ts "specific technical phrase"
    Takes: exact technical phrase (best for niche themes, not broad macro)
    Returns: tickers of companies mentioning the phrase in SEC filings (10-K, 10-Q, 8-K)
    Source: SEC EDGAR full-text search

### Return Calculations

Get live pricing and computed return profiles:

  bun run scripts/adapters/robinhood/returns.ts "TICKER" "long|short" "stock|etf|option"
    Returns: entry price, IV-derived target/stop, return %, options chain data
    Note: "short" on leveraged ETFs auto-swaps to inverse pair

  bun run scripts/adapters/hyperliquid/returns.ts "TICKER" "long|short" "leverage"
    Returns: entry, liquidation price, 30d expected move (realized vol), funding cost
    Note: strips -PERP suffix automatically

  bun run scripts/adapters/kalshi/returns.ts "EVENT-TICKER" "strike" "yes|no"
    Returns: buy price, implied probability, return if right, contracts per $100
    Note: strike is optional (auto-picks sweet spot 20-70c market)

  bun run scripts/adapters/bankr/returns.ts "TICKER" "direction" "token|polymarket|treasury"
    Returns: price (Bankr text -> DexScreener -> CoinGecko fallback), return profile
    NOTE: async, 15-125s

  bun run scripts/adapters/angel/returns.ts "stage" "sector"
    Returns: stage-based venture return distribution (no live pricing)

### Tracking

  bun run scripts/track.ts record --input "..." --inst TICKER --px PRICE --dir long --plat robinhood [flags]
  bun run scripts/track.ts check <keywords>
  bun run scripts/track.ts portfolio [--telegram]
  bun run scripts/track.ts close --id X --px PRICE
  bun run scripts/track.ts update --id X --conviction N --reason "..."
  bun run scripts/track.ts history
```

**Key change:** No "validate THE trade + alternatives" framing. No "only validate what survived Phase 3." The tools are available whenever Claude needs them -- during research, during scoring, during output preparation. Claude decides when to call them.

### Section 7: Output (~88 lines, unchanged)

Keep Phase 5 (The Take + The Card) exactly as-is. This is the user-facing format spec. It is appropriately prescriptive because output format is a design decision, not a reasoning process.

### Section 8: Rules (~20 lines, unchanged)

Keep the 9 rules exactly as-is. These are guardrails (language constraints, downside disclosure, conviction breakeven, platform risk tier, evidence requirements) that must remain regardless of the reasoning flow.

---

## What Gets Removed (and why)

| Current content | Lines | Why remove |
|----------------|-------|------------|
| Phase 1 preamble + "most important step" | ~5 | Obvious to Claude |
| "Think in the Frame That Fits" (3 reasoning modes) | ~12 | Claude already knows probability/ratio/causal analysis |
| Phase 1 gate "You MUST state..." | ~3 | Replaced by softer "Before calling tools, determine..." |
| Phase 2 "What to Research" (5 numbered items) | ~10 | Over-prescribes what Claude does autonomously |
| Phase 2 "parallel searches for speed" | ~2 | Claude decides its own search strategy |
| Phase 3 Step 0/1/2/3 sequential numbering | ~15 | Principles replace steps |
| Phase 3 "Where to look" table | ~8 | Duplicate of Phase 1 shape table |
| Phase 4 "Only validate what survived Phase 3" | ~5 | Tools are available anytime |
| Phase 4 "Build Payoff Table" instructions | ~10 | Claude constructs payoff tables from return data naturally |
| Phase 4 "Conviction Breakeven" instructions | ~5 | Rule #3 already requires this on every expression |

**Total removed: ~75 lines of over-prescription.**

---

## What Gets Added

| New content | Lines | Why add |
|-------------|-------|---------|
| Research agent identity statement | ~3 | Sets the autonomous reasoning frame |
| Tool catalog with input/output docs | ~50 | Replaces Phase 4's "run these scripts" |
| "Research Principles" section | ~10 | Minimum research bar without prescribing how |

**Total added: ~63 lines, mostly tool documentation.**

---

## Net effect on SKILL.md

| Metric | Before | After |
|--------|--------|-------|
| Total lines | ~541 | ~450-470 |
| Lines prescribing reasoning steps | ~250 | ~60 |
| Lines documenting tools | ~25 | ~60 |
| Lines on scoring/selection | ~160 | ~80 |
| Lines on output format | ~88 | ~88 |
| Lines on guardrails/rules | ~36 | ~36 |

---

## Impact on Adapter Scripts

**No changes to any adapter script.** The scripts are already well-designed CLI tools:
- Take arguments on argv
- Output JSON to stdout
- Log diagnostics to stderr
- Return structured `AdapterInstrumentResult` or `ReturnProfile`

The refactor only changes how SKILL.md presents them (as a tool catalog instead of a pipeline step).

---

## Impact on Test Infrastructure

### `tests/smoke-adapters.ts` -- NO CHANGES

Smoke tests exercise individual adapter scripts with known inputs and validate output structure. These are decoupled from SKILL.md entirely. They test the tools, not the reasoning flow.

### `tests/e2e-routing.ts` -- NEEDS RESTRUCTURING

This is the most affected test file. Currently it:
1. Classifies shape from thesis text (`inferShape()`)
2. Routes shape to adapters (`routeThesis()`) with a hardcoded `CONCEPT_TICKERS` map
3. Runs adapters sequentially per the Phase 3 -> Phase 4 pipeline
4. Scores results using the metric

**Problem:** `e2e-routing.ts` simulates the rigid pipeline that we're removing. It has a `routeThesis()` function that hardcodes shape->adapter routing, and a `CONCEPT_TICKERS` map that simulates Claude proposing tickers.

**Options:**

**Option A: Keep as regression test (recommended).** The e2e test already works and catches real bugs (the PEP near-52wk-high regression, the convexity cap). It tests that the adapters produce reasonable outputs for known theses. The fact that it follows a rigid pipeline is fine for a test -- it's testing tool output, not Claude's reasoning.

Rename to `tests/tool-integration.ts` to clarify it tests tools, not the full routing flow.

**Option B: Replace with LLM-in-the-loop test.** Run actual Claude against test theses and validate the output structure (has a trade, has a payoff table, has conviction breakeven, etc.). This is expensive and flaky. Not recommended as a primary test.

**Option C: Add output-structure validation tests.** New test that takes a completed routing (thesis + instruments + returns) and validates the output matches the card format. Tests that the output rules in Section 7 are satisfied. This is a useful addition regardless of refactor.

**Recommended test plan:**
1. Rename `e2e-routing.ts` to `tool-integration.ts`, keep as-is.
2. Add `tests/output-validation.ts` that validates card format given mock inputs.
3. Keep `smoke-adapters.ts` unchanged.
4. Keep `edgar-comparison.ts` unchanged (it's an independent comparison tool).

### `tests/edgar-comparison.ts` -- NO CHANGES

This is a standalone comparison tool, not a pipeline test.

### `tests/test-theses.json` -- MINOR UPDATE

Add a `tool_calls` field to each test thesis documenting which tools should be called for that thesis shape. This serves as documentation and enables future automated validation.

```json
{
  "id": "v3-1",
  "shape": "binary_event",
  "input": "Fed won't cut rates at the March meeting",
  "expected_tools": [
    "kalshi/instruments.ts \"fed rate march\"",
    "kalshi/returns.ts \"KXFED-26MAR\" \"\" \"no\""
  ],
  "expected": { ... }
}
```

---

## Impact on Reference Files

### `references/instrument-reasoning.md` -- KEEP AS-IS

This is already structured as a reference document ("load this when elimination leaves close alternatives"). It's a tool, not a process step.

### `references/blindspots.md` -- KEEP AS-IS

Platform risk tiers, priced-in detection, correlation groups, liquidity reality checks. All guardrails.

### `references/portfolio-construction.md` -- KEEP AS-IS

Loaded on demand for compound/multi-leg theses.

### `docs/architecture.md` -- UPDATE

The flow diagram needs updating to reflect the new structure. Replace the Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 pipeline with:

```
USER INPUT
    |
    v
INPUT VALIDATION (guardrail)
    |
    v
AUTONOMOUS RESEARCH
  Claude reasons about:
  - Thesis shape + deeper claim
  - Time horizon
  - Market environment (web search)
  - Instrument candidates
  Calls tools as needed:
  - instruments.ts for discovery
  - returns.ts for pricing
  - track.ts for history
  - discover-edgar.ts for niche themes
    |
    v
SCORING (thesis_beta x convexity / time_cost)
  Cross-check across instrument classes
  Stress-test the winner
  Apply disqualifiers
    |
    v
OUTPUT
  The Take (streamed) + The Card (message)
    |
    v
TRACKING
  track.ts record/portfolio/close
```

---

## Migration Steps

### Step 1: Draft new SKILL.md structure

Write the new SKILL.md with all 8 sections. This is the primary deliverable. Estimated ~460 lines.

Specific tasks:
- Write Section 1 (Identity + Defaults)
- Write Section 3 (Thesis Analysis Guidelines, compressed from Phase 1)
- Write Section 4 (Research Principles, compressed from Phase 2)
- Write Section 5 (Scoring, restructured from Phase 3)
- Write Section 6 (Tool Catalog, restructured from Phase 4)
- Copy Sections 2, 7, 8 (Input Validation, Output, Rules) unchanged

### Step 2: Test against known theses

Run the new SKILL.md against the 8 test theses in `test-theses.json` manually (not automated). Verify:
- Claude still extracts deeper claims correctly
- Claude still calls the right adapters
- Scoring produces the same or better winners
- Output format is preserved

### Step 3: Update architecture.md

Replace the pipeline flow diagram with the research-agent flow diagram.

### Step 4: Rename e2e-routing.ts

Rename to `tool-integration.ts` to clarify scope. No code changes.

### Step 5: Add output-validation test (optional, post-refactor)

Write a test that takes mock routing results and validates the card format matches Section 7 rules.

---

## Risks

### Risk: Claude skips research when given more autonomy

**Mitigation:** Section 4 (Research Principles) retains the "minimum 3 specific data points" gate. This is the only hard constraint needed. The rest is Claude's judgment.

### Risk: Claude calls wrong adapters or forgets to call them

**Mitigation:** Section 3 (Thesis Analysis Guidelines) retains the shape taxonomy which naturally points to platform affinity. Section 6 (Tool Catalog) is comprehensive. The shape -> natural home mapping is preserved in the taxonomy table.

### Risk: Scoring quality degrades without explicit cross-check steps

**Mitigation:** The cross-check principle is preserved in Section 5: "Always compare your best candidate against the best from at least one other instrument class." It is stated as a principle rather than a numbered step. If testing shows Claude skips cross-checks, add back the explicit instruction.

### Risk: Tests break

**Mitigation:** No adapter scripts change. `smoke-adapters.ts` is unaffected. `e2e-routing.ts` is unaffected (rename only). The only test gap is LLM-in-the-loop validation, which is inherently flaky and not recommended as primary coverage.

---

## Success Criteria

1. **SKILL.md is shorter** (~460 vs ~541 lines) with less prescriptive reasoning steps
2. **All 18 smoke tests still pass** (adapters unchanged)
3. **Manual test against 8 theses** produces equivalent or better outputs
4. **Tool catalog is self-documenting** -- a reader can understand what each script does from Section 6 alone
5. **Guardrails preserved** -- input validation, rules, disqualifiers, output format all intact
6. **No adapter code changes required**
