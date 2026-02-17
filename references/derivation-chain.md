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

The tier is determined by what the source quote contains — not by model judgment:

| Source quote contains | Tier | Example |
|----------------------|------|---------|
| A ticker + direction | `direct` | "Buy LAES" → direct |
| A market thesis (causal claim about a specific market) | `derived` | "Quantum selloff was mechanical" → derived |
| A framework/observation with no market-specific claim | `inspired` | "AI commoditizes interface layers" → inspired |

If you can't quote the source saying something that points a human reader to the same ticker, the tier is `inspired`.
