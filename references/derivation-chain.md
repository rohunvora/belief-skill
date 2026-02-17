# Derivation Chain

When routing sourced input, log the chain BEFORE searching — not after.

## Format

```
Source said: "[exact quote from source]"
This implies: [causal mechanism you extracted]
Searching for: [what you're about to look for]
```

After finding the instrument, append:
```
Found [TICKER] because: [why it matches the mechanism]
```

## Example

```
Source said: "When the interface layer gets commoditized, the scarce inputs get more valuable"
This implies: Companies whose moat is proprietary data creation benefit from AI disruption of terminals
Searching for: Financial data companies with regulatory lock-in or benchmark ownership, recently sold off
Found SPGI because: NRSRO-certified credit ratings + $7T indexed to S&P indices — scarce inputs AI can't replicate — but sold off 29% alongside FactSet
```

## Attribution Tier Classification

The tier is a mechanical consequence of the "Source said:" line — not a separate judgment. After writing the chain, scan the "Source said:" quote and apply the first matching rule:

1. **`direct`** — The quote contains a ticker symbol (e.g. LAES, GOOG, SOL) or a named, tradable contract. The source told you what to trade.
2. **`derived`** — The quote contains a causal claim about a specific market, sector, or asset class (e.g. "quantum selloff was mechanical", "GLP-1 distribution is the bottleneck") but no ticker symbol. The source pointed at a market; you found the instrument.
3. **`inspired`** — The quote contains only a framework, observation, or cultural signal with no market-specific claim (e.g. "AI commoditizes interface layers", "everyone's on Ozempic"). You connected it to a market.

**Rules are applied top-down: first match wins.** If the quote has a ticker, it is `direct` regardless of whether it also contains a framework. If no ticker but a market-specific causal claim, it is `derived`. Everything else is `inspired`.

| "Source said:" contains | Tier | Example |
|------------------------|------|---------|
| Ticker symbol present | `direct` | "Buy LAES" → direct |
| Market-specific causal claim, no ticker | `derived` | "Quantum selloff was mechanical" → derived |
| Framework/observation only | `inspired` | "AI commoditizes interface layers" → inspired |

If you cannot quote the source saying something that would point a human reader to the same ticker, the tier is `inspired`.
