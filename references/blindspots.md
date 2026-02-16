# Blindspots & Risk Framework

Reference for Claude when generating trade expressions. Surface these warnings proactively.

## Platform Risk Tiers

| Platform | Tier | Key Facts |
|----------|------|-----------|
| Kalshi | Regulated | CFTC-regulated DCM, LedgerX clearinghouse, segregated accounts. NFL payout incident (Jan 2026) resolved. |
| Robinhood | Regulated | FINRA/SEC regulated. No API — manual execution only. |
| Hyperliquid | DEX | 3 manipulation incidents in 2025: JELLY (Mar, $12M loss, withdrawals frozen), July incident, POPCAT (Nov, $4.9M bad debt, withdrawals frozen). Less decentralized than claimed. |
| Bankr | New | Non-custodial (user keeps keys). Alpha-stage SDK. Limited track record. Smart contract risk. |

## "Priced In" Detection

When market-implied probability is within 5% of user's conviction:
- Flag: "Market already agrees at X%. Your edge is ~0%."
- Show the asymmetry: "Risk $93 to gain $7 (13:1 against you)"
- Suggest contrarian side: "The NO side at 7c has higher upside if market is overconfident"
- Ask: "Do you have information the market doesn't?"

## Correlation Groups

Assign `correlation_group` to expressions sharing directional thesis:
- `rates_bearish`: short TLT, long TBT, Fed holds YES, short rate-sensitive crypto
- `rates_bullish`: long TLT, Fed cuts YES, long REITs
- `crypto_bullish`: long BTC/ETH/SOL perps, long COIN, long crypto tokens
- `crypto_bearish`: short BTC perps, short COIN, short BITO
- `ai_bullish`: long NVDA/MSFT, long AI tokens (RENDER, FET), long AI ETFs
- `defense_bullish`: long BAH/LMT/PLTR, defense spending YES on Kalshi

When 2+ expressions share a group, add correlation warning.

## Liquidity Reality Check

- Kalshi high-volume markets (KXFED): $100-$1K orders fill at displayed price
- Kalshi niche markets: slippage likely above $500 orders
- Hyperliquid majors (BTC/ETH/SOL): institutional-grade liquidity
- Hyperliquid small-cap perps: 3-5x leverage cap signals thinner books
- Polymarket via Bankr: Columbia study found ~25% wash trading; real liquidity may be lower than displayed

## Responsible Design Principles

- 82% of retail CFD traders lose money (FCA data)
- Never gamify or celebrate rapid-fire belief routing
- Show cumulative P&L honestly — losses included
- The PnL card leads with the THESIS, not the number
- Loss cards are equally shareable — never hide losses

## Regulatory Context

Tool likely fails SEC's IA-1092 three-part test for investment advice. Until securities
counsel opinion is obtained:
- Use "expressions" and "market data" language only
- Never use "recommendations", "advice", "you should"
- Present raw market data with analysis, not personalized sizing
- Add responsible design note to every response
