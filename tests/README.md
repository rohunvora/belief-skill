# Belief Router — Test Suite

## What This Is

48 real tweets from @frankdegods (Jan 2025 – Feb 2026), each containing a tradeable thesis. These are the validation tests for the Belief Router skill.

## Files

- `test-theses.json` — Structured test cases (use this programmatically)
- `test-theses.md` — Human-readable version grouped by category
- `README.md` — This file

## How to Use These

Each test case has:

```json
{
  "id": "tweet_id",
  "date": "2025-01-27",
  "text": "the original tweet",
  "url": "https://x.com/frankdegods/status/...",
  "type": "original|quote|reply",
  "likes": 1104,
  "thesis": "Plain English: what the router SHOULD extract as the directional view",
  "category": "Defense/Geopolitics",
  "difficulty": "easy|medium|hard",
  "ideal_instruments": ["PLTR", "NVDA", "defense ETFs"],
  "edge_type": "macro framework"
}
```

### Testing Flow

For each test case:

1. **Input:** Feed `text` to the Belief Router as the user's thesis/belief
2. **Extract:** Router should identify the directional thesis (compare to `thesis` field)
3. **Route:** Router should find tradeable instruments (compare to `ideal_instruments`)
4. **Score:** How many ideal instruments did it find? Did it find better ones we didn't think of?

### Difficulty Levels

- **🟢 Easy (6):** Explicit ticker/direction. "SOL to $4800". If the router can't handle these, nothing works.
- **🟡 Medium (22):** Sector thesis. "Military will be biggest AI buyer." Router needs to map sector → specific tickers.
- **🔴 Hard (20):** Normie observations. "Bugatti customers = crypto bros." Router needs creative instrument mapping — this is the real differentiator.

### Grading

**Pass criteria per test:**
- ✅ Correctly identified the directional thesis (bull/bear, what sector)
- ✅ Found at least 2 of the ideal instruments OR found equally valid alternatives
- ✅ Didn't suggest obviously wrong instruments
- ✅ Sizing makes sense given portfolio context

**Overall pass:** 90%+ on easy, 70%+ on medium, 50%+ on hard = ship it.

### Categories (for coverage)

| Category | Count | What it tests |
|----------|-------|---------------|
| AI/AGI | 10 | Crypto + tradfi AI plays |
| Defense/Geopolitics | 8 | China thesis → defense stocks |
| Traditional Finance | 6 | Macro → rates, USD, equities |
| Market Structure | 6 | Crypto-native structural plays |
| Tech Industry | 6 | Software disruption, SaaS shorts |
| SOL Ecosystem | 5 | Solana-specific instruments |
| Consumer/Culture | 3 | Lifestyle → luxury, gaming |
| Specific Token | 2 | Direct token calls |
| Crypto Macro | 2 | BTC macro thesis |

### What a GREAT Router Does on Hard Tests

**Input:** "All of Bugatti's customers are going to be crypto bros this year"
**Bad output:** "Buy BTC"
**Good output:** "Long LVMH (MC.PA), Ferrari (RACE), Hermès (RMS.PA) — crypto wealth reaching ultra-luxury consumption. Also consider luxury watch indices, high-end real estate REITs."

**Input:** "if this is the ai cold war then metals bull run makes sense"
**Bad output:** "Buy NVDA"
**Good output:** "Long GLD, SLV, copper miners (COPX, FCX), uranium (URA). AI cold war = compute arms race = energy + materials demand. Also consider defense ETF (ITA) as a direct play."

The router's edge is connecting dots between casual beliefs and non-obvious instruments.
