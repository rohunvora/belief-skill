# Hyperliquid Adapter

## What is Hyperliquid?

Hyperliquid is a decentralized perpetual futures exchange. It lists **191 active perps** — all crypto assets, no equities/bonds/commodities (except PAXG gold proxy). No auth is required for read-only market data.

## Key Concepts

### Perpetual Futures ("Perps")

A perp tracks an asset's price with no expiry date. You can go **long** (profit when price rises) or **short** (profit when price falls). Leverage amplifies both gains and losses.

### Leverage

Leverage lets you control a larger position with less capital. Available leverage varies by asset:

| Asset | Max Leverage | Tier |
|-------|-------------|------|
| BTC   | 40x         | Blue-chip |
| ETH   | 25x         | Blue-chip |
| SOL, XRP | 20x      | Large-cap |
| AVAX, DOGE, LINK, SUI, HYPE, ONDO, JUP, TRUMP, FARTCOIN, ... | 10x | Mid-cap |
| RENDER, FET, TAO, VIRTUAL, PENDLE, KAITO, ... | 5x | Small-cap |
| AIXBT, GOAT, MOODENG, GRASS, ... | 3x | Micro-cap |

**Example:** With 5x leverage and $100 margin, you control $500 of notional value. A 10% price move = 50% gain/loss on your margin.

### Funding Rate

Perps stay close to spot price via a **funding rate** paid/received every hour:
- **Positive funding** = longs pay shorts (market is overleveraged long)
- **Negative funding** = shorts pay longs (market is overleveraged short)
- Typical range: -0.01% to +0.01% per hour (~-87% to +87% annualized)
- Funding is paid on the full notional value, so at 5x leverage the rate impact is 5x on your margin

### Liquidation

If your position moves against you enough to consume your margin, you get liquidated (forced closed at a loss). Approximate liquidation distance:
- **Long:** price drops ~(1/leverage) from entry. At 5x = ~20% drop.
- **Short:** price rises ~(1/leverage) from entry. At 5x = ~20% rise.

Formula:
- Liquidation price (long) = entry_price * (1 - 1/leverage)
- Liquidation price (short) = entry_price * (1 + 1/leverage)

### Pair Trades

The most powerful Hyperliquid strategy: go long one perp and short another to express a relative thesis.

**Example: "SOL flips ETH"**
- Long SOL-PERP at 5x
- Short ETH-PERP at 5x
- If SOL outperforms ETH, both legs profit
- Funding may be favorable on both sides (check current rates)
- Market-neutral to overall crypto direction

**Example: "AI tokens will outperform memes"**
- Long RENDER/FET/TAO basket
- Short DOGE/kPEPE/kBONK basket

### Liquidity Assessment

Liquidity is assessed from 24h notional volume and open interest:
- **High:** >$100M daily volume (BTC, ETH, SOL, XRP)
- **Medium:** $10M-$100M daily volume (AVAX, DOGE, LINK, SUI, HYPE)
- **Low:** <$10M daily volume (most alt perps)

## Thesis Mapping

### Best fit (HIGH feasibility)
- Crypto pair trades: SOL/ETH, BTC dominance, L1 vs L2
- Single crypto directional: "BTC to $100k", "SOL is overvalued"
- Crypto sector rotations: AI tokens, DeFi tokens, meme coins

### Moderate fit (MEDIUM feasibility)
- Macro via crypto proxy: "Risk-off" = short BTC/ETH, PAXG long for gold
- AI narrative: RENDER, FET, TAO, VIRTUAL, AIXBT (crypto AI tokens only)

### Poor fit (LOW feasibility)
- Traditional sectors: defense, healthcare, energy (no instruments)
- Interest rates, bonds, equities (not available on Hyperliquid)

## API Reference

All endpoints: `POST https://api.hyperliquid.xyz/info`

| Type Field | Returns | Use Case |
|-----------|---------|----------|
| `meta` | All perps, leverage tiers | Instrument discovery |
| `allMids` | Mid prices for all assets | Current prices |
| `metaAndAssetCtxs` | Meta + funding, OI, volume, prices | Full instrument context |
| `l2Book` | Orderbook depth | Spread/liquidity check |
| `fundingHistory` | Hourly funding snapshots | Carry trade analysis |
| `candleSnapshot` | OHLCV candles | Historical price data |

## Scripts

### instruments.ts
```
bun run scripts/adapters/hyperliquid/instruments.ts "solana ethereum"
```
Returns `InstrumentMatch[]` — matching perps with relevance scoring.

### returns.ts
```
bun run scripts/adapters/hyperliquid/returns.ts "SOL" "long" "5"
```
Returns `TradeExpression` — PnL profile with leverage, funding, liquidation.
