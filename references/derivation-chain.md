# Derivation Chain

When routing sourced input, log the chain BEFORE searching — not after.

## Format (Greentext Steps)

Output as a JSON object with 2 fields:

```json
{
  "steps": ["step 1", "step 2", "step 3"],
  "chose_over": "alternatives"
}
```

Each line earns the next — no logical leaps. Variable length (2-5 steps) based on how many logical steps the connection requires. Ticker appears naturally inline in the last step.

## Writing Rules

- each line earns the next — no logical leaps
- no finance jargon — write for normies
- ticker appears naturally inline in the last step
- variable length (2-5 steps) based on how many logical steps the connection requires
- lowercase unless proper noun or ticker

## Examples — 2 Steps

@threadguy on MSFT:

```json
{"steps": ["all code is AI now", "MSFT owns GitHub, Copilot, VS Code — the tollbooth"], "chose_over": "GOOG (competing but no IDE lock-in), ADBE (creative not code)"}
```

@martinshkreli on IONQ:

```json
{"steps": ["quantum stocks crashed 60%", "funds forced to sell, not a tech failure", "IONQ now cheaper than private peers with bigger gov contracts"], "chose_over": "RGTI (no DARPA Stage B), QBTS (thinner contract book)"}
```

## Examples — 3 Steps

@chamath on DELL:

```json
{"steps": ["on-prem is back", "companies buying their own AI servers instead of cloud", "DELL has $18B in orders to build them"], "chose_over": "HPE (lower AI backlog growth), SMCI (accounting risk)"}
```

@marginsmall on LAES:

```json
{"steps": ["government mandating quantum-proof chips", "someone has to make them", "LAES is the only public company that does"], "chose_over": "LSCC (PQC <10% of revenue), MCHP (even more diluted)"}
```

@nicbstme on SPGI:

```json
{"steps": ["AI makes dashboards commodity", "raw data underneath gets more valuable", "SPGI owns the ratings and indices $7T tracks"], "chose_over": "MCO (33x P/E), FactSet short (already -57%)"}
```

@BigA on GLD:

```json
{"steps": ["governments heading toward freezing assets", "gold is the one thing they can't", "GLD is 14% off its high"], "chose_over": "GDX (miners re-rated), BTC (exposed not direct)"}
```

## Examples — 4 Steps

@WillManidis on APO:

```json
{"steps": ["VC model is broken, companies can't exit", "the winners are patient permanent capital pools", "APO has the highest permanent ratio at 60%", "expanding to retail through Athene — 401k is next"], "chose_over": "BX (40% permanent vs 60%), KKR (less permanent focus)"}
```

@BigA on CCJ:

```json
{"steps": ["trade wars make scarce resources strategic", "uranium is the hardest to replace — 10 year mine lead time", "AI datacenters need nuclear power, new demand on top", "CCJ is the biggest producer, down 16%"], "chose_over": "LMT/RTX/NOC (all near ATH), ITA ETF (broad dilution)"}
```

## `chose_over` — Why This Ticker

Why this ticker over the alternatives you considered. Name the runners-up and why they lost. For direct calls (source named the ticker), use: "direct call — source named the ticker explicitly."

## How the Board Uses It

- **Feed card**: steps rendered as the derivation trail
- **Detail page**: full steps chain rendered as auditable trail
- **OG card / link preview**: first step as the hook
- Original calls (no source) keep thesis as headline

## Attribution Tier Classification

The tier is a mechanical consequence of the first step — not a separate judgment. After writing the chain, scan the first step and apply the first matching rule:

1. **`direct`** — The first step contains a ticker symbol (e.g. LAES, GOOG, SOL) or a named, tradable contract. The source told you what to trade.
2. **`derived`** — The first step contains a market-specific causal claim (e.g. "quantum stocks crashed 60%", "government mandating quantum-proof chips") but no ticker symbol. The source pointed at a market; you found the instrument.
3. **`inspired`** — The first step is a framework or observation only with no market-specific claim (e.g. "AI makes dashboards commodity", "governments heading toward freezing assets"). You connected it to a market.

**Rules are applied top-down: first match wins.** If the first step has a ticker, it is `direct` regardless of whether it also contains a framework. If no ticker but a market-specific causal claim, it is `derived`. Everything else is `inspired`.

| First step contains | Tier | Example |
|------------------------|------|---------|
| Ticker symbol present | `direct` | "buy LAES before the mandate" -> direct |
| Market-specific causal claim, no ticker | `derived` | "quantum stocks crashed 60%" -> derived |
| Framework/observation only | `inspired` | "AI makes dashboards commodity" -> inspired |

If you cannot point to something in the first step that would lead a human reader to the same market, the tier is `inspired`.

## Legacy Format (deprecated)

The old structured format (`source_said`/`implies`/`searching_for`/`found_because`/`chose_over`) is still parsed for backward compatibility. New calls should always use the greentext steps format.
