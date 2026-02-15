# Track 2: Risk/Return Frameworks for Retail Users

## Research Summary

We need a single framework that lets users compare apples-to-oranges trades: a Kalshi binary contract (pays $1 or $0), a Robinhood call option (continuous payoff), a Hyperliquid perp (leveraged continuous), and a Bankr token swap (continuous). This document surveys 7 candidate frameworks and recommends the best 1-2 for the Belief Router.

---

## 1. Kelly Criterion (Simplified)

### How It Works
The Kelly formula for binary outcomes is:

```
f* = (bp - q) / b
```

Where `f*` = fraction of bankroll to wager, `b` = net odds received on the wager, `p` = probability of winning, `q` = 1 - p.

For a prediction market contract priced at $0.60 (implying 60% probability), if your model says 75%:
- b = (1 - 0.60) / 0.60 = 0.667
- f* = (0.667 x 0.75 - 0.25) / 0.667 = 0.375 (bet 37.5% of bankroll)

### Binary vs. Continuous Outcomes: The Core Problem
Kelly works cleanly for binary bets (prediction markets) where downside is -100% of the bet. But for stocks, options, and perps, outcomes are continuous -- there are infinite possible exit prices. The standard Kelly formula breaks because it assumes total loss on the downside.

**Practical workarounds:**
- **Discretize continuous outcomes**: Treat a stock trade as a pseudo-binary -- "hits target or gets stopped out." This lets you use standard Kelly but loses the nuance of partial wins/losses.
- **Continuous Kelly (log-optimal portfolio)**: Requires estimating full return distributions. Academically elegant but impractical for retail.
- **Fractional Kelly (0.25x-0.5x)**: The industry standard compromise. Full Kelly has a 33% probability of halving your bankroll before doubling it. Half-Kelly cuts the growth rate by only 25% but cuts variance by 50%.

### Verdict for Belief Router
Kelly is excellent for position sizing AFTER you have an expected return figure, but it's not the right user-facing metric. Users don't think in "bet 37.5% of bankroll" -- they think in "what do I make if I'm right?" Kelly is an internal engine component, not the display layer.

---

## 2. Expected Value (EV) from Poker/Sports Betting

### How the Betting Industry Presents EV

**OddsJam** (the gold standard for sports betting EV tools) shows a table with columns:
- **EV%**: Expected profit per $100 bet (e.g., "+1.91%" means $1.91 expected profit per $100)
- **Rec. Bet Size**: Kelly-derived optimal stake given your bankroll
- **No-Vig Odds**: The "true" fair line after stripping out the sportsbook's margin
- **Market Width**: How much juice the book is charging

The recommended bet is highlighted with a blue outline. Hovering shows the same line at all competing sportsbooks so you can see your edge.

**Key insight from OddsJam's UX**: They normalize everything to "$X profit per $100 bet." This is the closest existing pattern to our "$100 deployed" concept.

**Poker EV presentation**: In poker, EV is taught as "the average return on each dollar invested in the pot." If calling a $50 bet gives you +$12 EV, the decision is simple: call. Poker players think in terms of +EV (do it) vs -EV (don't). This binary framing (positive or negative) is powerful for retail.

### How This Maps to Our Use Case

The sports betting EV framework translates directly:

| Sports Betting | Belief Router |
|---|---|
| Your edge over the book | Your conviction vs. market-implied probability |
| EV% per $100 bet | Expected return per $100 deployed |
| Kelly bet size | Position size recommendation |
| No-vig odds | "Fair" probability estimate |

### Verdict
EV normalized to $100 is the closest existing proven UX pattern to what we need. The "$X profit per $100" framing is battle-tested with millions of sports bettors and poker players. **This should be our primary display framework.**

---

## 3. Options-Implied Expected Move (Tastytrade / OptionStrat / Market Chameleon)

### How These Tools Visualize Risk/Reward

**Tastytrade** pioneered showing **Probability of Profit (POP)** as a first-class metric alongside every trade. Their platform shows:
- POP percentage (e.g., "72% chance of profit")
- Max profit amount
- Max loss amount
- Breakeven price(s)
- Expected POP (ePOP) which adjusts for early management

**OptionStrat** strategy builder shows:
- Interactive P&L curve (Y-axis = profit/loss, X-axis = underlying price at expiration)
- Max profit, max loss, and breakeven overlaid on the chart
- Chance of profit percentage
- Strategy optimizer that finds trades maximizing either return or probability of profit
- Net debit/credit clearly stated

**Market Chameleon** adds:
- Probability cones showing expected price range based on implied volatility
- Historical earnings move data (e.g., "AAPL has moved 3.2% on average after earnings, market implies 4.1% this time")
- Historical win rates for specific strategies (e.g., "Iron Condor 30 DTE on AAPL earnings: 68% historical win rate")

### Key Design Patterns

1. **The P&L Curve**: A simple chart showing profit above the line, loss below, price on X-axis. Robinhood, OptionStrat, and Tastytrade all use this. It's the universal options visualization.

2. **Three Numbers**: Max Profit, Max Loss, Breakeven. Every options platform leads with these three data points. This is the minimum viable risk presentation.

3. **Probability of Profit**: Tastytrade made this metric mainstream. It converts complex options math into a single percentage that answers "how likely am I to make money?"

### Verdict
The "three numbers" pattern (max profit, max loss, probability) is directly applicable. But the P&L curve doesn't translate well to prediction markets (binary outcome = no curve, just two points). We should borrow the three-number pattern and POP concept.

---

## 4. R-Multiple Framework

### How It Works
R = your initial risk on a trade. Every outcome is measured as a multiple of R.

- Entry: $10, Stop-loss: $9 --> 1R = $1 per share
- Exit at $13 --> +3R (you made 3x your risk)
- Exit at $8.50 --> -1.5R (you lost 1.5x your initial risk)

### Why Prop Traders Love It
R-multiples create a **universal language independent of dollar amounts.** A trader risking $100 on one trade and $5,000 on another can compare performance on the same scale. It normalizes everything to "risk units."

The framework is powerful for:
- Trade journaling ("my average winner is +2.3R, my average loser is -0.8R")
- Setting targets ("I only take trades with at least 3:1 R-multiple potential")
- Performance evaluation ("my expectancy is +0.4R per trade")

### The Problem for Our Use Case
R-multiples require a defined stop-loss, which prediction markets don't have (you either win $1 or lose your premium -- there's no intermediate stop). For Kalshi contracts, R is always 1R because you risk the full purchase price. The framework adds complexity without adding insight for binary instruments.

### Verdict
R-multiples are great for continuous instruments (stocks, perps) but break down for binary instruments (prediction markets). Since we need a unified framework across BOTH, R-multiples alone won't work. However, the concept of "normalizing to risk units" informs our design -- our "$100 deployed" is essentially fixing R at $100.

---

## 5. Sharpe Ratio (Simplified)

### The Formula
```
Sharpe = (Return - Risk-Free Rate) / Volatility
```

A Sharpe of 1 = decent, 2 = very good, 3+ = exceptional.

### Why It Doesn't Work for Us

1. **Single-trade framing**: Sharpe is a portfolio metric measured over time. Our users are evaluating individual trade ideas, not portfolios.
2. **Requires historical return distribution**: You need standard deviation of returns, which doesn't exist for a trade you haven't taken yet.
3. **Not intuitive**: "This trade has a Sharpe of 1.4" means nothing to a retail user. "You make $340 if right, lose $100 if wrong" is instantly clear.
4. **Binary outcomes break it**: A prediction market contract doesn't have "volatility" in the traditional sense -- it either pays $1 or $0.

### Verdict
**Reject.** Sharpe is the wrong tool for single-trade comparison. It's a portfolio-level metric that adds confusion without insight for our use case.

---

## 6. Robinhood Options P&L Presentation

### How Robinhood Simplifies It

Robinhood's P&L chart for options uses:
- **Y-axis**: Theoretical profit (+) and loss (-) -- anything above zero is profit, below is loss
- **X-axis**: Stock price at expiration
- **Key overlays**: Breakeven point, max profit zone, max loss zone
- **Interactive**: Chart updates as you adjust strike/expiration

The genius of Robinhood's approach:
1. **No Greek letters on the main screen.** Delta, gamma, theta are buried in "Advanced" views.
2. **Visual profit/loss zones.** Green = profit, red = loss. The chart makes risk visceral.
3. **Three key numbers up front**: Cost of the trade, max profit, breakeven.
4. **"This option is X% out of the money"** -- translates probability into plain language.

### Design Lessons for Belief Router

- Lead with the payoff amounts, not the probabilities or math
- Use color coding (green/red) to make profit/loss instantly scannable
- Hide complexity behind progressive disclosure (show more detail on tap/click)
- The user should understand the trade in under 3 seconds

### Verdict
Robinhood's approach is the gold standard for simplification. We should adopt their progressive disclosure pattern: headline numbers up front, detailed breakdown on expand.

---

## 7. Prediction Market Probability as Universal Anchor

### The Concept
Kalshi contract prices ARE probabilities. A "Fed cuts rates in March" contract at $0.65 = 65% market-implied probability. Can we use these probabilities to inform estimates for correlated instruments?

### How It Could Work

1. **Kalshi says**: "75% chance Congress passes defense spending bill" (contract at $0.75)
2. **This informs**: Probability that defense stocks (LMT, RTN) rise if the bill passes
3. **Combined estimate**: P(stock rises) = P(bill passes) x P(stock rises | bill passes) + P(bill fails) x P(stock rises | bill fails)

### Evidence and Limitations

Research shows prediction market prices are reasonably well-calibrated probability estimates, with accuracy improving as events approach resolution. However:

- **Bias exists**: Kalshi prices are not perfectly unbiased predictors -- they tend to be somewhat noisy, especially for low-liquidity contracts.
- **Conditional probabilities are hard**: The link between "Congress passes bill" and "LMT stock rises 8%" requires estimating conditional distributions that prediction markets don't directly price.
- **Correlation isn't causation**: A defense spending bill might already be priced into LMT stock, making the "if right" scenario less profitable than the raw probability suggests.

### Practical Approach for Belief Router
Use Kalshi probabilities as the **starting point** for conviction estimates, then adjust:
- If a Kalshi contract exists for the exact event, use its price as the base probability
- For correlated instruments, use the Kalshi probability as an input to a simple conditional model
- Always show the user "market-implied probability" alongside their own conviction slider

### Verdict
Prediction market probabilities are a valuable signal but not a silver bullet. They should feed into the conviction estimate, not replace it. The user's own conviction (informed by market probability) is the key input.

---

## Recommendation: The Two Frameworks to Use

### Primary: "EV per $100 Deployed" (Betting-Industry EV Pattern)

This is the display framework. For every trade expression, show:

```
TRADE CARD EXAMPLE:
------------------------------------
"AI defense spending will boom"
Platform: Robinhood | Instrument: LMT Jan 2026 $550 Call

If Right:  +$340  (you get $440 back)
If Wrong:  -$100  (you lose your $100)

Conviction needed to break even: 23%
Your conviction: 70%
Market-implied probability: 55%

Expected return: +$178/mo
Time to resolution: ~3 months
------------------------------------
```

**Why this wins:**
1. **Battle-tested**: OddsJam, DraftKings, and poker tools prove "$X per $100" is intuitive for consumer betting/trading audiences
2. **Works for both binary and continuous**: Prediction markets naturally produce "pay $X, get $1 or $0." Stocks/options can be expressed as "pay $100, get $X or lose $Y" by normalizing position size
3. **"If Right / If Wrong" is universal**: Whether it's a Kalshi contract, a stock, or a perp, users understand "what do I make, what do I lose?"
4. **Conviction as the key variable**: By asking the user "how confident are you?" and showing breakeven conviction, we let them calibrate their edge

### Secondary: Probability of Profit (Tastytrade Pattern)

Alongside the EV card, show:

```
Chance of Profit: 68%  [==========>    ]
```

This borrows from Tastytrade's POP concept. For prediction markets, POP = the market-implied probability. For stocks/options, POP = probability the underlying moves enough to be profitable (derived from implied volatility or historical data).

**Why include this:**
- It answers the user's first instinct: "will this probably work?"
- It's a sanity check on the EV calculation -- a trade can be high-EV but low-probability (lottery ticket) or low-EV but high-probability (grinding)
- It lets users filter trades by their risk personality

---

## How the Frameworks Map Across Platforms

| Metric | Kalshi | Robinhood | Hyperliquid | Bankr |
|--------|--------|-----------|-------------|-------|
| If Right | $1.00 - entry price | Option payoff at target | Perp P&L at target | Token price at target |
| If Wrong | -entry price | -premium paid | -margin (with stop) | -swap amount |
| Probability | = contract price | Implied from IV/history | Derived from vol | Estimated from momentum |
| Normalized to $100 | Buy X contracts | Buy X options | Set position size | Swap $100 worth |

## Key Design Principles (Borrowed from Best-in-Class)

1. **OddsJam pattern**: EV% front and center, Kelly-sized recommendation secondary
2. **Robinhood pattern**: Progressive disclosure -- 3 numbers first, full P&L chart on expand
3. **Tastytrade pattern**: POP as a single scannable percentage
4. **OptionStrat pattern**: Strategy optimizer that finds the BEST way to express the same belief
5. **R-Multiple concept**: Normalize everything to risk units ($100 = 1R equivalent)

## What NOT to Use

- **Sharpe Ratio**: Wrong abstraction level (portfolio vs. single trade), not intuitive
- **Full Kelly**: Good for internal sizing engine, terrible for user-facing display
- **Raw options Greeks**: Delta, gamma, theta are implementation details, not user-facing metrics
- **R-Multiples alone**: Break down for binary instruments, need the EV wrapper

## Implementation Notes

1. **The "$100 deployed" normalization is key.** Every trade expression should answer: "I put in $100 -- what happens?" This is our R-multiple equivalent.

2. **Conviction should be a slider, not a text input.** Default to market-implied probability (from Kalshi or options IV), let user adjust. Show how EV changes as conviction moves.

3. **Kelly sizing should run silently in the background.** Use half-Kelly to suggest position sizes, but frame it as "Suggested amount: $250 of your $10,000 account" not "Kelly fraction: 0.025."

4. **Time-normalize returns.** A 3-month trade returning +$200 is worse than a 1-month trade returning +$100. Show monthly expected return as the ranking metric: `expected_return_monthly = (profit% x conviction - loss% x (1-conviction)) / months_to_resolution`.

5. **Show the "conviction breakeven."** For every trade, display "you need to be right X% of the time to break even." This is the single most powerful number for calibrating whether a trade is worth it.
