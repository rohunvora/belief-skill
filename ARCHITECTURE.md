# Belief Router — Architecture Redesign

## The Problem (29% pass rate)

Current architecture: `thesis → keyword match → theme-map → instruments → rank → size`

This fails because:
1. **Keyword matching can't reason.** "AI cold war → metals bull run" requires understanding that compute arms race → energy → uranium/copper/rare earths. Keywords only find exact theme matches.
2. **No creative instrument mapping.** "Bugatti customers = crypto bros" → LVMH, RACE requires cultural reasoning, not a lookup table.
3. **No sentiment detection.** "Stablecoins are fucked" vs "stablecoins will benefit" both match "stablecoin" theme.
4. **Missing tokens.** HYPE, TRUMP, PENGU not in static registry. Can't maintain a registry of every token.

## Research: What Works

### FinRobot (arxiv 2411.08804)
Three-layer Chain of Thought:
- **Data-CoT Agent**: Aggregates diverse data sources
- **Concept-CoT Agent**: Mimics analyst reasoning → actionable insights
- **Thesis-CoT Agent**: Synthesizes into coherent investment thesis

Key insight: The LLM does the REASONING, scripts do the DATA FETCHING.

### OpenClaw Skill Pattern
Skills work by giving Claude structured instructions + tool access. Claude IS the reasoning engine. Scripts are tools Claude calls. The SKILL.md defines the decision tree, not the code.

The Bankr skill shows this: natural language → Bankr API handles routing internally. The skill just teaches Claude how to invoke the right commands.

### Key Principle
**Claude should decompose the thesis. Scripts should fetch data. Claude should score and narrate.**

The current architecture inverts this — scripts try to do reasoning (keyword matching for thesis parsing, heuristic scoring for alignment), which they're bad at.

## New Architecture

```
USER BELIEF (tweet/message)
    │
    ▼
┌──────────────────────┐
│  CLAUDE: DECOMPOSE    │  ← This is the skill's core value
│  (SKILL.md prompt)    │
│                       │
│  Input: raw belief    │
│  Output: JSON with:   │
│    - direction (long/short/neutral)
│    - confidence (high/medium/low)  
│    - sub_themes[]     │
│    - tickers[]        │  ← Claude SUGGESTS tickers directly
│    - reasoning        │
│    - invalidation[]   │
│    - asset_classes[]  │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│  SCRIPT: ENRICH       │  ← Yahoo Finance + CoinGecko + DexScreener
│  (research.ts)        │
│                       │
│  Input: tickers[]     │
│  Output: enriched     │
│    fundamentals       │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│  SCRIPT: SIZE         │  ← Portfolio-aware Kelly sizing
│  (size.ts)            │
│                       │
│  Input: enriched +    │
│    portfolio + budget │
│  Output: sized recs   │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│  CLAUDE: FORMAT       │  ← Narrative output, not template fill
│  (SKILL.md prompt)    │
│                       │
│  Input: sized recs +  │
│    original thesis    │
│  Output: final msg    │
└──────────────────────┘
```

### What Changes

| Before | After |
|--------|-------|
| theme-map.json keyword matching | Claude decomposes thesis into tickers directly |
| Static 218 tickers | Claude suggests ANY ticker, web search for discovery |
| Heuristic direction detection | Claude reads sentiment naturally |
| Script generates output | Claude writes narrative with data |
| instruments.ts (keyword→ticker) | DELETED — Claude does this |
| rank.ts (heuristic scoring) | SIMPLIFIED — data scoring only, Claude does alignment |

### What Stays

- **research.ts** — enriches tickers with market data (Yahoo/CG/DexScreener)
- **size.ts** — portfolio-aware Kelly sizing (math doesn't need LLM)
- **theme-map.json** — becomes a REFERENCE for Claude, not a lookup table
- **secondaries.json** — still useful as a registry Claude can consult
- **Portfolio state** — still loads from sample-state.json

### The SKILL.md Is The Product

The SKILL.md teaches Claude:
1. How to decompose ANY belief into tradeable themes
2. When to call `research.ts` to enrich tickers
3. When to call `size.ts` for portfolio-aware sizing
4. How to format output for Telegram
5. When to use web_search for unfamiliar tokens
6. How to detect confidence/direction from language
7. Reference data: theme-map.json for inspiration, secondaries.json for pre-IPO

### CLI Mode

For standalone testing: `router.ts` calls an LLM API for the decomposition step.
Options:
- OpenAI-compatible API (local LLM, OpenRouter, etc.)
- Simpler: router.ts outputs the enriched data, Claude in SKILL.md does the rest
- For testing: a "decompose" script that uses structured prompts

### Why This Works for Hard Tests

**"AI cold war → metals bull run"**
- Claude understands: compute arms race → energy demand → uranium, copper, rare earths
- Suggests: GLD, SLV, COPX, URA, FCX, CCJ
- Scripts enrich with prices/fundamentals
- Size.ts allocates against portfolio

**"Bugatti customers = crypto bros"**  
- Claude understands: crypto wealth → luxury consumption → luxury goods companies
- Suggests: LVMH (MC.PA), RACE, RMS.PA, CPRI
- Also: COIN (crypto beneficiary), luxury REITs
- Web search for current luxury sector data

**"Skills as a Service will be the new SaaS"**
- Claude understands: short traditional SaaS, long AI/automation platforms
- Suggests: SHORT CRM, SNOW, NOW / LONG MSFT, AI infrastructure
- Non-obvious: OpenClaw itself (can't trade), so PLTR, AI agent plays

## Implementation Plan

1. Rewrite SKILL.md with structured decomposition prompt
2. Simplify scripts: keep research.ts + size.ts, delete instruments.ts
3. Add `decompose.ts` — standalone script that mimics Claude's decomposition for CLI testing
4. Update test runner to use the new pipeline
5. Keep theme-map.json as reference data (not lookup table)
