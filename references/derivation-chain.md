# Derivation Chain

When routing sourced input, log the chain BEFORE searching — not after.

## Format (Structured JSON)

Output as a JSON object with 5 fields:

```json
{
  "source_said": "[hook — the fragment a listener would remember and repeat]",
  "implies": "[causal mechanism, lowercase, use → for causation]",
  "searching_for": "[what you're about to look for]",
  "found_because": "[why this ticker matches the mechanism]",
  "chose_over": "[why this ticker over the alternatives you considered — name the runners-up and why they lost]"
}
```

All 5 fields are mandatory for sourced calls. `source_said` and `found_because` are the quality floor — no card ships without both.

## `source_said` — Hook Extraction

Not the full transcript. The fragment a listener would remember and repeat. ≤80 chars, verbatim from source's words.

Decision tree:

1. Does the quote contain a phrase that works as a standalone headline? → Use it verbatim. ("On-prem is back.", "100% of code is AI.")
2. Does it contain a sharp clause? → Extract the clause. ("Quantum selloff was mechanical, not fundamental.")
3. Neither? → Use the source's core claim in ≤80 chars, their words not yours.

The full quote lives in `source_quote`. The hook is `source_said`.

| Source type | Hook (`source_said`) |
|---|---|
| Podcast sound bite | `On-prem is back.` |
| CT analysis thread | `100% of code is AI.` |
| Analyst framework (already sharp) | `When the interface layer gets commoditized, the scarce inputs get more valuable` |
| Analytical paragraph | `Quantum selloff was mechanical, not fundamental.` |
| Direct ticker call | `LAES. PQC mandate, new semiconductor category.` |
| Narrative observation | `Michael Grimes is back at Morgan Stanley. The IPO factory restarts.` |

## `implies` — Causal Mechanism

Write lowercase. Use → for causation, not em-dashes. This is the AI's bridge, not the source's words — keep it casual, not systemic.

## `chose_over` — Why This Ticker

Why this ticker over the alternatives you considered. Name the runners-up and why they lost. For direct calls (source named the ticker), use: "direct call — source named the ticker explicitly."

## Example

```json
{
  "source_said": "When the interface layer gets commoditized, the scarce inputs get more valuable",
  "implies": "proprietary data creators benefit from ai disrupting terminals",
  "searching_for": "Financial data companies with regulatory lock-in or benchmark ownership, recently sold off",
  "found_because": "NRSRO-certified credit ratings + $7T indexed to S&P indices — scarce inputs AI can't replicate — but sold off 29% alongside FactSet",
  "chose_over": "MCO (purer ratings but 33x P/E + earnings risk), FactSet short (already -57%, obvious) — SPGI has ratings + indices, dual moat"
}
```

## How the Board Uses It

- **Feed card headline**: `source_said` in quotes — the hook, not the full transcript
- **Feed card subheader**: `implies` in lowercase (the bridge from quote to trade)
- **Detail page**: Full 5-step chain rendered as auditable trail
- **OG card / link preview**: `source_said` in quotes
- **Hover tooltip**: full `source_quote` appears on hover (desktop)
- Original calls (no source) keep thesis as headline

## Attribution Tier Classification

The tier is a mechanical consequence of the `source_said` field — not a separate judgment. After writing the chain, scan the quote and apply the first matching rule:

1. **`direct`** — The quote contains a ticker symbol (e.g. LAES, GOOG, SOL) or a named, tradable contract. The source told you what to trade.
2. **`derived`** — The quote contains a causal claim about a specific market, sector, or asset class (e.g. "quantum selloff was mechanical", "GLP-1 distribution is the bottleneck") but no ticker symbol. The source pointed at a market; you found the instrument.
3. **`inspired`** — The quote contains only a framework, observation, or cultural signal with no market-specific claim (e.g. "AI commoditizes interface layers", "everyone's on Ozempic"). You connected it to a market.

**Rules are applied top-down: first match wins.** If the quote has a ticker, it is `direct` regardless of whether it also contains a framework. If no ticker but a market-specific causal claim, it is `derived`. Everything else is `inspired`.

| `source_said` contains | Tier | Example |
|------------------------|------|---------|
| Ticker symbol present | `direct` | "Buy LAES" → direct |
| Market-specific causal claim, no ticker | `derived` | "Quantum selloff was mechanical" → derived |
| Framework/observation only | `inspired` | "AI commoditizes interface layers" → inspired |

If you cannot quote the source saying something that would point a human reader to the same ticker, the tier is `inspired`.

## Legacy Format (deprecated)

The old newline-delimited format is still parsed for backward compatibility:

```
Source said: "[exact quote]"
This implies: [mechanism]
Searching for: [what you're looking for]
Found [TICKER] because: [why it matches]
```

New calls should always use the structured JSON format.
