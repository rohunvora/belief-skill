# Kalshi Adapter

## What is Kalshi?

Kalshi is a regulated binary prediction market. You buy YES or NO contracts priced 1-99 cents. If the event occurs, YES pays $1.00. If not, it pays $0. The price IS the market-implied probability: 93 cents = 93% chance.

## API

- **Base:** `https://api.elections.kalshi.com/trade-api/v2/`
- **Auth:** Not required for reads (all market data is public)
- **Prices:** Integer cents (0-100). `last_price=93` means 93 cents = 93% implied prob
- **Pagination:** Cursor-based via `cursor` query parameter

### Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /events?series_ticker=X` | Find events in a series (e.g., all FOMC meetings) |
| `GET /events/{ticker}` | Event detail with all child markets |
| `GET /markets/{ticker}/orderbook` | Orderbook with best bid/ask |

## Market Structure

**Series > Events > Markets**

- **Series** = a topic (e.g., KXFED = Fed funds rate decisions)
- **Event** = a specific instance (e.g., KXFED-26MAR = March 2026 FOMC meeting)
- **Market** = a specific contract (e.g., KXFED-26MAR-T3.50 = "Rate at or below 3.50%?")

Ranged events (like Fed rates) have multiple strike-level markets. Each is an independent binary contract.

## Return Calculation

Binary payoff makes the math simple:

- **Buy YES at 35 cents:** Win = $1.00 payout, return = (100/35 - 1) * 100 = **+185.7%**. Lose = $0, return = **-100%**
- **Buy NO at 35 cents (equivalent to selling YES at 65 cents):** Win = $1.00 payout, return = (100/35 - 1) * 100 = **+185.7%**. Lose = **-100%**
- **Market-implied probability** = buy_price / 100 (for YES), or (100 - buy_price) / 100 (for NO)

Capital required is always the buy price per contract (1-99 cents). Max loss is always 100% of capital. Leverage is effectively infinite relative to the payout.

## Keyword-to-Series Mapping

This is how we route a user's thesis to the right Kalshi markets:

### Macro / Fed / Rates
| Keywords | Series | Description |
|---|---|---|
| fed, rates, fomc, interest rate | KXFED | Fed funds rate per FOMC meeting |
| fed decision, cut, hike, hold, pause | KXFEDDECISION | Cut/hike/hold per meeting |
| rate cuts, how many cuts | KXRATECUTS | Cumulative rate cuts in a year |
| terminal rate, lowest rate | KXLOWESTRATE | Lowest rate reached |
| rate hike, next hike | KXFEDHIKE | When will Fed hike next |
| dot plot | KXDOTPLOT | Dot plot median projections |

### Inflation
| Keywords | Series | Description |
|---|---|---|
| cpi, inflation | KXCPIYOY | CPI year-over-year |
| core cpi, core inflation | KXCPICOREYOY | Core CPI YoY |
| pce, core pce | KXPCECORE | PCE core inflation |
| average cpi | KXACPI | Average CPI |

### Economy
| Keywords | Series | Description |
|---|---|---|
| recession, nber | KXRECSSNBER | NBER recession call |
| quarterly recession, gdp contraction | KXQRECESS | GDP quarterly contraction |
| gdp, growth | KXGDP | GDP growth rate |
| gdp boom, gdp above | KXGDPUSMAX | GDP exceeding thresholds |
| gdp bust, gdp below | KXGDPUSMIN | GDP falling below thresholds |

### Trade / Tariffs
| Keywords | Series | Description |
|---|---|---|
| tariff, tariffs, trade war | KXTARIFFPRC | Tariff rates by country |
| eu tariff, europe tariff | KXTARIFFSEU | EU-specific tariffs |
| average tariff | KXAVGTARIFF | Average US tariff rate |

### Treasury / Bonds
| Keywords | Series | Description |
|---|---|---|
| treasury, 10 year, 10y, bonds, yields | KXTNOTE | Treasury note yields |
| treasury daily | KXTNOTED | Daily treasury yield |
| yield curve, 10y2y, inversion | KX10Y2Y | 10Y-2Y spread |
| 10y3m, term spread | KX10Y3M | 10Y-3M spread |

### Defense / Government
| Keywords | Series | Description |
|---|---|---|
| defense spending, military budget | KXDEFENSESPEND | Defense budget magnitude |
| military spending, pentagon | KXMILSPEND | Military spending changes |

### Crypto
| Keywords | Series | Description |
|---|---|---|
| bitcoin, btc | KXBTCMAXY, KXBTCMAXM, KXBTC | BTC price ranges |
| ethereum, eth | KXETHMAXY, KXETHMAXM, KXETH | ETH price ranges |
| solana, sol | KXSOLMAXY, KXSOLMAXM | SOL price ranges |
| crypto returns, crypto performance | KXCRYPTORETURNY | Annual crypto returns |
| eth btc, flippening | BTCETHATH | Relative ETH/BTC performance |

## Liquidity Classification

Based on open interest dollar value:
- **high**: > $100K open interest
- **medium**: $10K-$100K open interest
- **low**: < $10K open interest

## When Kalshi is Best

- Macro theses (Fed rates, inflation, recession) -- direct probability markets with deep liquidity
- Political/policy theses (tariffs, defense spending) -- unique data not available elsewhere
- Crypto price outlook -- annual/monthly range markets

## When Kalshi is Weak

- Crypto-native theses (DEX volume, TVL, on-chain metrics) -- only price markets
- Individual stock theses -- no single-stock markets
- Short-term trading -- most markets resolve monthly or quarterly
