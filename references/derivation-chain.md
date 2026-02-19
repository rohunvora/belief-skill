# Derivation Chain

Draft the chain BEFORE research. The sketch targets what you actually need to search for.

## Format (Segment-Based)

Output as a JSON object with 3 fields:

```json
{
  "segments": [
    { "quote": "verbatim quote", "speaker": "who", "timestamp": "14:22" }
  ],
  "steps": [
    { "text": "step grounded in source", "segment": 0 },
    { "text": "inference step, skill's reasoning" }
  ],
  "chose_over": "alternatives considered"
}
```

- Steps WITH `segment` index = **cited** (from source, verifiable)
- Steps WITHOUT `segment` index = **inferred** (skill's contribution)
- Variable length (2-5 steps). Ticker appears wherever the reasoning naturally reaches it.

## Writing Rules

- each line earns the next, no logical leaps
- no finance jargon, write for normies
- ticker appears wherever the reasoning reaches it (NOT saved for last)
- vary the structure, don't always build the same shape
- lowercase unless proper noun or ticker
- no arrows, no em dashes. one clean thought per step.
- chain explains WHY, not WHAT THE PRICE IS. no "down X% from highs" closers

## Self-test

After drafting the chain, test each step: remove it and check if the chain still connects quote to trade. If yes, the step was padding. Cut it. If no, the step is load-bearing. Keep it, even if it contains a researched fact. Fix the routing, not the chain.

## Examples by Structure

**Lead with the company:**

@chamath on DELL:

```json
{
  "segments": [{ "quote": "On-prem is back. Do I, if I'm Geico, want all our proprietary data in an open LLM?", "speaker": "chamath" }],
  "steps": [
    { "text": "on-prem is back. enterprises won't put proprietary data in open LLMs", "segment": 0 },
    { "text": "DELL has $18B in AI server orders to build exactly this" },
    { "text": "the market is punishing them on margin compression while the backlog grows 150% YoY" }
  ],
  "chose_over": "HPE (lower AI backlog growth), SMCI (accounting risk)"
}
```

**Two threads converge:**

@BigA on CCJ:

```json
{
  "segments": [
    { "quote": "trade wars make everything geopolitical", "speaker": "BigA", "timestamp": "12:30" },
    { "quote": "the AI power problem is real, every datacenter is maxed", "speaker": "BigA", "timestamp": "34:15" }
  ],
  "steps": [
    { "text": "trade wars make scarce resources strategic. uranium has a 10 year mine lead time", "segment": 0 },
    { "text": "AI datacenters need nuclear power, new demand stacking on top", "segment": 1 },
    { "text": "those two forces converge on CCJ, biggest uranium producer" }
  ],
  "chose_over": "LMT/RTX/NOC (all near ATH), ITA ETF (broad dilution)"
}
```

**Counterfactual, start with the trade, question the market:**

@martinshkreli on IONQ:

```json
{
  "segments": [{ "quote": "Quantum selloff was mechanical, not fundamental", "speaker": "martinshkreli" }],
  "steps": [
    { "text": "for IONQ at current prices, you'd have to believe quantum tech has deteriorated", "segment": 0 },
    { "text": "the opposite happened. funds were forced to sell, not a tech failure" },
    { "text": "IONQ now cheaper than private peers with bigger gov contracts" }
  ],
  "chose_over": "RGTI (no DARPA Stage B), QBTS (thinner contract book)"
}
```

**Short and direct (2 steps):**

@threadguy on MSFT:

```json
{
  "segments": [{ "quote": "100% of code is AI. Five SWEs independently confirmed they write zero human code.", "speaker": "threadguy" }],
  "steps": [
    { "text": "MSFT owns the tollbooth. GitHub, Copilot, VS Code, Azure", "segment": 0 },
    { "text": "trading at 25x vs 34x 3yr avg while the AI coding market doubles annually" }
  ],
  "chose_over": "GOOG (competing but no IDE lock-in), ADBE (creative not code)"
}
```

**Framework to specific name:**

@nicbstme on SPGI:

```json
{
  "segments": [{ "quote": "AI commoditizes the presentation layer, the scarce inputs get more valuable", "speaker": "nicbstme" }],
  "steps": [
    { "text": "AI makes dashboards and analysis commodity", "segment": 0 },
    { "text": "the raw data underneath gets more valuable, not less" },
    { "text": "SPGI owns the credit ratings and indices that $7T tracks. regulatory moat, not a data vendor" }
  ],
  "chose_over": "MCO (33x P/E), FactSet short (already -57%)"
}
```

## Anti-patterns

Do NOT write chains that follow this skeleton:

```
[broad macro claim] → [sector inference] → [industry connection] → [TICKER is X, down Y% from highs]
```

Avoid:
- Saving the ticker for the last step
- "Down X% from highs" as a closer. price context belongs in the trade data
- Every chain being the same length
- Forcing a single linear narrative when evidence is parallel
- Decorative facts pretending to be reasoning. "DoD became largest shareholder in July 2025" adds credibility but doesn't advance the logic. Test: remove the step. If the chain still connects, the fact was padding

## `chose_over`

Why this ticker over the alternatives you considered. Name the runners-up and why they lost. For direct calls (source named the ticker), use: "direct call, source named the ticker explicitly."

## How the Board Uses It

- **Feed card**: steps rendered as greentext trail (plain `> step` lines)
- **Detail page**: cited/inferred badges with speaker attribution and timestamps
- **OG card / link preview**: first step as the hook
- Original calls (no source) keep thesis as headline

## Attribution Tier Classification

The tier is mechanically determined by two factors: (1) did the author name a specific ticker, and (2) does the skill route to that same ticker.

| Condition | Tier | Card shows |
|-----------|------|------------|
| Author named a ticker AND skill routes to the same ticker | `direct` | "@source's call" |
| Author named a ticker BUT skill routes elsewhere | `derived` | "@source's thesis · via belief.board" |
| Author had a market-specific claim, no ticker | `derived` | "@source's thesis · via belief.board" |
| Author made a cultural observation only | `derived` | "@source's thesis · via belief.board" |

**Track record scoring:**
- `direct`: score the author on instrument performance. Their pick, their record.
- `derived`: score the author on thesis direction. Score the skill separately on instrument selection.

## Legacy Format (deprecated)

The old structured format (`source_said`/`implies`/`searching_for`/`found_because`/`chose_over`) is still parsed for backward compatibility. New calls should always use the segment-based format above.
