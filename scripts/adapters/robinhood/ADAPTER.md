# Robinhood Adapter

> Manual-execution adapter for US equities, ETFs, leveraged ETFs, and options via Robinhood.
> Data sourced from Yahoo Finance (`yahoo-finance2`). No API key required.

## How This Adapter Works

Robinhood has **no public trading API**. This adapter:
1. Matches a thesis to relevant instruments from a curated universe (~200 tickers)
2. Fetches live prices + market data from Yahoo Finance
3. Generates **manual trade instructions** the user executes in the Robinhood app

All output is informational. The user places every order themselves.

---

## Instrument Types

### Stocks (Individual Equities)
- **What:** Single company shares (BAH, PLTR, LMT, NVDA, etc.)
- **Leverage:** 1x (no leverage)
- **Hold period:** Indefinite — no expiration, no decay
- **When to use:** High conviction on a specific company's performance
- **Risk:** Can go to zero, but no forced liquidation or time decay
- **Example:** "AI defense spending will boom" → Buy BAH (Booz Allen Hamilton)

### ETFs (Exchange-Traded Funds)
- **What:** Baskets of stocks tracking a sector or theme (ITA, XLE, SMH, XLF)
- **Leverage:** 1x
- **Hold period:** Indefinite
- **When to use:** Broad sector exposure, lower single-stock risk
- **Cost:** Small expense ratio (0.05%–0.50% annually) — negligible for swing trades
- **Example:** "Defense sector will outperform" → Buy ITA (iShares Aerospace & Defense)

### Leveraged ETFs
- **What:** ETFs that multiply daily returns by 2x or 3x (DFEN, SQQQ, TBT, TQQQ)
- **Leverage:** 2x or 3x daily
- **Hold period:** Days to weeks — NOT for long-term holds
- **Decay risk:** Volatility drag erodes value over time even if the underlying is flat
- **When to use:** High conviction, short time horizon, want amplified exposure
- **Key rule:** Multiply expected returns by the leverage factor, but also multiply losses
- **Example:** "Rates stay high for 3 months" → Buy TBT (2x inverse long bonds)

### Options (Calls and Puts)
- **What:** Contracts giving the right (not obligation) to buy/sell at a strike price by expiration
- **Leverage:** Variable — small premium controls 100 shares
- **Hold period:** Defined by expiration date — can expire worthless
- **Max loss:** Limited to premium paid (for buying calls/puts)
- **When to use:** Defined-risk leveraged bets with a time horizon
- **Key concepts:**
  - **Call:** Profits if stock goes UP above strike + premium
  - **Put:** Profits if stock goes DOWN below strike - premium
  - **Breakeven:** Strike price + premium paid (calls) or strike - premium (puts)
  - **Time decay (theta):** Options lose value every day, accelerating near expiration
  - **Implied volatility (IV):** High IV = expensive options. Avoid buying before earnings unless you have edge
  - **In-the-money (ITM):** Higher probability of profit, higher premium
  - **Out-of-the-money (OTM):** Cheaper, but more likely to expire worthless
- **Example:** "PLTR hits $150 by April" → Buy PLTR Apr 2026 $150 Call

---

## Manual Execution Instructions

Since Robinhood has no API, every trade instruction follows this format:

### Stock/ETF Buy
```
Open Robinhood → Search "[TICKER]" → Buy → Shares → [AMOUNT] → Review → Submit
```

### Stock/ETF Sell / Short (via inverse ETF)
```
Open Robinhood → Search "[INVERSE_TICKER]" → Buy → Shares → [AMOUNT] → Review → Submit
```
Note: Robinhood does not support direct short selling for most users. Use inverse ETFs instead.

### Options Buy
```
Open Robinhood → Search "[TICKER]" → Trade Options → Select [EXPIRY] → [CALL/PUT] →
Strike $[STRIKE] → Buy → [CONTRACTS] → Limit @ $[PRICE] → Review → Submit
```

### Setting a Stop Loss
```
Open Robinhood → Portfolio → [TICKER] → Sell → Stop Loss → Price $[STOP] → Submit
```

---

## Data Source: Yahoo Finance

- **Package:** `yahoo-finance2` v3
- **Quotes:** 79 fields per symbol — price, volume, market cap, 52-week range, moving averages, P/E, dividend yield
- **Options:** Full chain with strikes, expirations, bid/ask, IV, open interest
- **Latency:** ~50-400ms per call (no rate limiting observed)
- **No API key required**
- **Data delay:** ~15 minutes (fine for swing trades, not intraday scalping)

---

## Return Calculation Methods

### Stock / ETF
- **Target price:** Based on 52-week high, analyst estimates, or technical levels
- **Stop loss:** Based on 52-week low, support levels, or fixed % (e.g., 10%)
- **return_if_right:** `(target - entry) / entry * 100`
- **return_if_wrong:** `(stop - entry) / entry * 100` (negative number)

### Leveraged ETF
- Same as stock, but multiply returns by leverage factor (2x or 3x)
- Add decay risk warning for holds > 2 weeks
- **return_if_right:** `(target - entry) / entry * leverage * 100`
- **return_if_wrong:** `(stop - entry) / entry * leverage * 100`

### Options
- **return_if_right:** `(target_price - strike - premium) / premium * 100`
- **return_if_wrong:** `-100%` (max loss = premium paid)
- **Breakeven:** `strike + premium` (call) or `strike - premium` (put)

---

## Limitations

1. **No execution API** — all trades are manual instructions
2. **No direct shorting** — use inverse ETFs (SH, SDS, SQQQ, TBT) instead
3. **Options complexity** — only recommend single-leg calls/puts, not spreads
4. **15-min delayed data** — prices may differ slightly at execution time
5. **No crypto tokens** — only crypto-adjacent equities (COIN, MSTR) and BTC/ETH ETFs
