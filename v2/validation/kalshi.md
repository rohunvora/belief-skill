# Kalshi API Validation Report

**Date:** 2026-02-15
**Validated by:** kalshi-validator agent

## API Access

- **Base URL:** `https://api.elections.kalshi.com/trade-api/v2/`
- **Auth required for reads:** NO -- all market data endpoints return 200 without authentication
- **Auth required for trading:** Yes (not tested, but expected per docs)
- **Old URL** (`trading-api.kalshi.com`) returns 401 with migration notice

### Endpoints Confirmed Working (No Auth)

| Endpoint | Description | Status |
|---|---|---|
| `GET /events?limit=N` | List events with pagination | OK |
| `GET /events?series_ticker=X` | Filter events by series | OK |
| `GET /events/{event_ticker}` | Event detail with all markets | OK |
| `GET /markets?limit=N` | List markets with pagination | OK |
| `GET /markets/{ticker}/orderbook` | Full orderbook (price/size) | OK |
| `GET /markets/trades?ticker=X` | Recent trades with prices | OK |
| `GET /series` | List all series (8,487 total) | OK |

### Data Format

- **Prices:** Integer cents (0-100) for binary markets. `last_price=93` means 93 cents = 93% implied probability
- **Also available in dollars:** `last_price_dollars="0.9300"`
- **Orderbook:** Array of [price, quantity] tuples for yes/no sides
- **Trades:** Include `yes_price`, `no_price`, `taker_side`, `count`, `created_time`
- **Pagination:** Cursor-based via `cursor` parameter

### Market Structure

- **Primary type:** Binary (yes/no) -- pays $1 if event occurs, $0 otherwise
- **Multi-leg (MVE):** Multivariate events combine multiple binary legs (mainly sports parlays)
- **Ranged markets:** Events like "Fed funds rate" have multiple strike levels (e.g., T3.50, T3.75, T4.00)
- **Mutually exclusive:** Some events (e.g., "Who will be Pope?") have ME markets
- **Price precision:** `price_level_structure` can be `linear_cent` (1c steps) or `deci_cent` (0.1c steps)

---

## Thesis 1: "Fed keeps rates higher for longer" (Macro)

### STRONG MATCH -- Kalshi is the best source for this

**Series found:** `KXFED` (Fed funds rate per meeting), `KXFEDDECISION` (Fed decision type), `KXRATECUTS` (rate cut count), `KXLOWESTRATE` (terminal low), `KXFEDHIKE` (next hike), `KXDOTPLOT` (dot plot), `KXRECSSNBER` (recession)

**Active Fed funds rate events (KXFED):**
- `KXFED-26MAR` through `KXFED-27APR` -- 11 upcoming meetings with ranged strike markets
- Each event has ~10 markets at different rate levels (e.g., T3.25, T3.50, T3.75, T4.00)

**Example -- KXFED-26MAR (March 18, 2026 meeting):**

| Market | Last Price | Implied Prob | Volume | Open Interest | Liquidity |
|---|---|---|---|---|---|
| T3.25 (rate <= 3.25%) | 98c | 98% | 36,370 | 34,913 | $656K |
| T3.50 (rate <= 3.50%) | 93c | 93% | 31,360 | 11,815 | $226K |
| T3.75 (rate <= 3.75%) | 2c | 2% | 88,906 | 80,118 | $455K |
| T4.00 (rate <= 4.00%) | 1c | 1% | 17,259 | 16,109 | $989K |

**Interpretation:** Market prices 93% chance rate is at or below 3.50% after March meeting, only 2% chance at or below 3.75%. This gives precise implied probability curves for the "higher for longer" thesis.

**Supporting markets:**
- `KXRECSSNBER-26` -- Recession in 2026: 21c (21% probability), 369K volume, $69K liquidity
- `KXGDPUSMAX-28` -- GDP above 5% any quarter: 67c, 134K volume
- `KXFEDCHAIRNOM-29` -- Who Trump nominates as Fed Chair (mutually exclusive market)
- `KXFEDEND-29` -- Will Trump end the Fed: 8c (8% probability), $646K liquidity

**Feasibility:** EXCELLENT. The KXFED series provides direct, granular probability curves for Fed rate expectations at every FOMC meeting through 2027. This is arguably the single best data source for the "rates higher for longer" thesis.

---

## Thesis 2: "AI defense spending will boom" (Sector)

### MODERATE MATCH -- Limited but relevant markets exist

**Markets found:**
- `KXDEFENSESPEND-27` -- "How much will Republicans increase defense spending in their reconciliation bill?" (ranged: $50B, $75B, $100B, $125B, $150B thresholds)
  - Thin liquidity: only $150B+ bucket has any volume (2,924 trades, 28c = 28% probability)
  - Other buckets have zero volume (newly listed)
- `KXMILSPEND-26` -- "Will Trump try to reduce military spending in 2025?"
- `KXDATACENTER-30` -- "Will the US start building a nuclear-powered data center on a military base?"

**What's missing:** No direct "AI defense spending" market. No markets on specific defense contractors, DARPA AI budgets, or AI procurement.

**Feasibility:** PARTIAL. Defense spending magnitude markets exist but with thin liquidity. The thesis would need to be decomposed: use Kalshi for defense budget totals, then combine with other sources for the "AI" portion. The data center on military base market is a creative adjacent signal.

---

## Thesis 3: "Solana flips Ethereum in DEX volume" (Crypto-native)

### WEAK MATCH -- Price markets exist, but no DEX volume markets

**Markets found:**
- `KXSOLMAXY-27JAN01` -- "How high will Solana get in 2026?" (ranged strikes: $150-$300)
  - SOL $200 in 2026: 26c, 26K volume
  - SOL $250 in 2026: 19c, 23K volume
  - SOL $300 in 2026: 17c, 16K volume
- `KXSOLANAATH-26JAN01` -- "Will Solana hit a new ATH in 2025?"
- `BTCETHATH-29DEC31` -- "Ethereum hits new ATH before Bitcoin?" (2c, very low liquidity)
- `KXETHMAXY-27JAN01` -- "How high will Ethereum get in 2026?"
- `KXBTCMAXY-26DEC31` -- "How high will Bitcoin get in 2026?"
- `KXCRYPTORETURNY` -- "Crypto being positive" (annual returns)

**What's missing:** No DEX volume markets. No "Solana flips Ethereum" market. No TVL, transaction count, or on-chain metrics markets. Kalshi covers crypto price ranges, not protocol-level metrics.

**Feasibility:** PARTIAL. SOL and ETH price range markets provide related signals (price performance as a proxy for ecosystem health), but the specific "flip in DEX volume" thesis has no direct Kalshi market. Would need to combine Kalshi price data with on-chain DEX volume data from other sources.

---

## Overall Assessment

### Verdict: Kalshi is VIABLE and VALUABLE -- especially for macro/political theses

**Strengths:**
1. **No auth needed for all read endpoints** -- zero friction for integration
2. **Rich macro/political coverage** -- Fed rates, inflation, GDP, recession, tariffs are deeply covered with high liquidity
3. **Clean API** -- JSON responses, cursor pagination, consistent structure
4. **High signal density** -- Fed rate markets have $100K+ liquidity per strike, genuine price discovery
5. **Unique data** -- Recession probability, Fed rate curves, defense spending are not available from traditional financial APIs
6. **Full orderbook and trade data** -- Deep market microstructure data without auth

**Weaknesses:**
1. **Crypto coverage is price-only** -- No on-chain metrics, DEX volume, or protocol-specific markets
2. **Defense/sector markets are thin** -- New markets with limited liquidity
3. **No text search API** -- Must iterate through series or events to find markets (8,487 series)
4. **Sports/entertainment noise** -- Majority of markets are sports betting, must filter

### What We Need

1. **No friend/account needed for reads** -- public API is fully functional
2. **Auth needed only for placing orders** -- we only need reads for belief-skill
3. **Rate limits unknown** -- not documented, but no issues in testing with dozens of requests

### Integration Recommendations

For belief-skill v2:
- **Primary use case:** Macro/political theses (Fed rates, recession, inflation, tariffs)
- **Secondary:** Crypto price outlook (BTC/ETH/SOL ranges and ATH probabilities)
- **Search strategy:** Maintain a mapping of thesis keywords -> series tickers (e.g., "fed rate" -> KXFED, "recession" -> KXRECSSNBER, "inflation" -> KXCPIYOY)
- **Price interpretation:** `last_price` in cents directly maps to implied probability percentage

### Key Series for Belief-Skill

| Thesis Area | Series Ticker | Description |
|---|---|---|
| Fed rates | KXFED, KXFEDDECISION | Rate per meeting, cut/hike/hold |
| Rate trajectory | KXRATECUTS, KXLOWESTRATE, KXFEDHIKE | Cumulative cuts, terminal rate |
| Inflation | KXCPIYOY, KXCPICOREYOY, KXACPI, KXPCECORE | CPI, core CPI, PCE |
| Recession | KXRECSSNBER, KXQRECESS | NBER recession, GDP contraction |
| GDP | KXGDP, KXGDPUSMAX, KXGDPUSMIN | Growth rate, boom/bust |
| Tariffs | KXTARIFFPRC, KXTARIFFSEU, KXAVGTARIFF | Country-specific rates |
| Treasury | KXTNOTE, KXTNOTED, KX10Y2Y, KX10Y3M | Yields, spreads, inversions |
| Defense | KXDEFENSESPEND, KXMILSPEND | Budget magnitude |
| BTC price | KXBTCMAXY, KXBTCMAXM, KXBTC | Annual/monthly range |
| ETH price | KXETHMAXY, KXETHMAXM, KXETH | Annual/monthly range |
| SOL price | KXSOLMAXY, KXSOLMAXM | Annual/monthly range |
| Crypto general | KXCRYPTORETURNY, BTCETHATH | Relative performance |
