# Portfolio Construction

Load this reference only for multi-leg portfolio requests or compound theses with independent claims.

## When to Use Multi-Leg vs. Single Trade

**Default to single trade.** One thesis → one best expression. Clarity beats diversification at the position level.

**Use multi-leg when:**
- Thesis has multiple independent claims that don't share directional exposure
- User explicitly wants a pair trade (long X / short Y)
- Thesis implies winners AND losers with roughly equal conviction on both sides

**Don't use multi-leg just because:**
- You found multiple instruments that express the same thesis — pick the best one
- You want to "hedge" — if the thesis is wrong, both legs lose anyway in correlated trades
- Different platforms offer similar exposure — pick the best platform, not all platforms

## Core + Satellite Structure

When multi-leg IS appropriate:

| Allocation | Role | Criteria |
|-----------|------|----------|
| 60-70% | Core | Highest conviction leg, most direct thesis expression |
| 20-30% | Satellite | Second leg, different mechanism or timeframe |
| ≤10% | Speculative | Long-shot leg, acceptable total loss |

Example: thesis "defense spending boom + tech rotation"
- Core (65%): ITA long (direct defense exposure)
- Satellite (25%): SOXS long (tech rotation short via semis)
- Speculative (10%): Kalshi YES on defense budget increase

## Correlation Warning Rules

**If 2+ legs share directional exposure, warn and reduce combined sizing.**

Check correlation groups (from `references/blindspots.md`):
- `rates_bearish`: short TLT, long TBT, Fed holds YES, short rate-sensitive crypto
- `rates_bullish`: long TLT, Fed cuts YES, long REITs
- `crypto_bullish`: long BTC/ETH/SOL perps, long COIN, long crypto tokens
- `ai_bullish`: long NVDA/MSFT, long AI tokens, long AI ETFs

**If legs share a group:**
- Warn: "These legs have correlated exposure — a single move against you hits both."
- Reduce combined allocation: treat them as ~1.5 legs of risk, not 2 independent legs.
- Suggest reducing one leg or finding a genuinely uncorrelated expression.

## Pair Trade Construction

For "X outperforms Y" or "X flips Y" theses:

1. **Long the outperformer, short the underperformer** — preferably on the same platform for cleaner execution
2. **Size equally in dollar terms** (not share count) to neutralize market direction
3. **Show combined P&L** — the pair trade profits if the SPREAD moves in your favor, regardless of market direction
4. **Warn:** pair trades still have directional risk if correlation breaks (both can go down, or both can go up, with the wrong one moving more)

Platform preference for pairs:
- Hyperliquid: best for crypto pairs (long SOL / short ETH)
- Robinhood: best for equity pairs (long ITA / short XLK)
- Cross-platform pairs are harder to manage — flag the execution complexity

## Time Horizon Alignment

**All legs must have compatible expirations.**

- Don't mix a weekly option with a 6-month ETF hold — the option expires before the thesis plays out
- If using options for multiple legs, align expiration dates
- If one leg is a perp (no expiry) and another is an option, the option's expiry sets the portfolio's effective time horizon
- Kalshi contracts have fixed resolution dates — ensure other legs survive past that date
