# Instrument Reasoning

Decision support for choosing between instrument types. Load this when elimination in Phase 3 leaves close alternatives.

## Max Upside Priority

Default risk mode is **max upside**: optimize for asymmetry and convexity. When comparing instruments that align equally with the thesis, prefer the one with higher potential return, even if it carries ruin risk. The $100K is risk capital.

**Convexity ranking (highest to lowest):**
1. **Deep OTM options.** 5-20x if right, -100% if wrong
2. **Kalshi binary on low-probability event.** 3-10x if right, -100% if wrong
3. **Perps with leverage.** 5-20x if right, -100% at liquidation
4. **ATM options.** 2-5x if right, -100% if wrong
5. **Leveraged ETFs.** 1.5-3x (capped by decay). Only for <2 week holds
6. **Stock / ETF.** 0.2-0.5x typical. Eliminate for max-upside unless thesis is very long-horizon

**When to override the max-upside preference and use stock/ETF anyway:**
- Thesis is structural with no catalyst date and multi-year horizon
- No liquid options or perps exist for the instrument
- The thesis is about a slow grind, not a binary outcome
- State explicitly: "Using equity because [reason]. Upside is capped at ~X% but there's no time decay or liquidation risk."

## Instrument Type Decision Tree

### Options
**Use when:**
- Thesis has a clear catalyst date (earnings, FOMC, data release)
- You want convexity: limited downside ($premium), uncapped upside
- You can afford total loss of the premium (max-upside default: yes)

**Avoid when:**
- Thesis is structural / long-horizon (>9 months). Theta eats you. Consider 6-9 month expiry as max for thesis-based options.
- IV is already elevated (post-event crush will destroy value even if direction is right)
- The move needed exceeds the expected move priced by the market

**Strike selection:**
- 10-15% OTM is the sweet spot: cheap enough for leverage, close enough to be reachable
- ATM for higher probability but less leverage
- Deep OTM (>20%) only for tail-risk / lottery tickets. Label it as such.
- Match strike to the thesis: "If thesis implies QQQ at $515, the $540 strike is more reachable than $480"

**Expiry selection:**
- At least 2 weeks AFTER the catalyst date (gives time for the thesis to play out)
- For structural theses without clear catalyst: 6-9 months
- Longer expiry = more expensive but more forgiving on timing
- Never buy weeklies for thesis-based trades. Too timing-dependent.

### Stock / ETF
**Use when:**
- Thesis is structural (plays out over months/years, not days)
- No options or perps exist for the relevant instrument
- Drawdowns are tolerable (you won't get stopped out on noise)
- The thesis doesn't have a clear catalyst date

**In max-upside mode, usually eliminate because:**
- Upside is capped at 20-40% over 6 months. $100K → $120-140K is not max upside.
- Exception: a thesis about a specific mispriced stock where fundamentals support a re-rating (2-3x) is still viable as max-upside.

**ETF vs. single stock:**
- ETF: when the thesis is about a sector, not a company (defense spending → ITA, not just LMT)
- Single stock: when the thesis is company-specific (NVDA earnings thesis)
- Single stock has highest thesis beta but introduces idiosyncratic risk

### Leveraged ETFs (2x, 3x)
**Use when:**
- Short-term trades only (<2 weeks)
- Want leverage without options complexity
- Thesis has clear, near-term catalyst

**Decay warning (always flag):**
- Leveraged ETFs rebalance daily. In volatile, range-bound markets, they bleed value even if the underlying is flat.
- Approximate drag: ~0.5-1% per week in normal volatility environments
- Over 1 month, a 3x leveraged ETF can lose 5-10% to decay alone
- NEVER hold a leveraged ETF for >1 month without explicit decay quantification
- **In max-upside mode, usually inferior to options.** SQQQ caps at ~60% gain on a 20% QQQ decline. The equivalent QQQ puts could return 300-500%.

**Common leveraged ETFs:**
- SQQQ (3x short Nasdaq), TQQQ (3x long Nasdaq)
- TBT (2x short 20yr treasury), TMF (3x long 20yr treasury)
- SOXS (3x short semis), SOXL (3x long semis)
- SRS (2x short real estate)

### Perpetual Futures (Perps)
**Use when:**
- Want leverage without time decay (no expiry)
- Comfortable with funding rate as ongoing cost
- Trading crypto assets (perps are the primary leverage tool)
- The thesis has no clear end date. Perps can be held indefinitely, unlike options.

**Cost to carry:**
- Funding rate is the cost. Annualize it: if funding is 0.01% per 8hr period → ~11% per year
- At 5x leverage, that 11% annualized is 55% drag on your margin per year
- Positive funding = longs pay shorts (bullish consensus, expensive to be long)
- Negative funding = shorts pay longs (bearish consensus, expensive to be short)

**Liquidation math:**
- 5x leverage → liquidated at ~20% move against you
- 10x leverage → liquidated at ~10% move against you
- Always state liquidation price explicitly
- For max-upside: 5x is the sweet spot. 10x+ is too tight for anything but scalps.

### Kalshi Contracts
**Use when:**
- Thesis has a binary outcome (yes/no) with a known resolution date
- You want defined risk ($0 or $1 payout per contract)
- The outcome is objectively measurable (Fed decision, economic data)
- **The market probability is far from your conviction.** This is where max upside lives on Kalshi.

**Pricing logic:**
- Contract at $0.65 = market says 65% probability of YES
- Your edge = your conviction % minus market probability
- Breakeven: if you buy YES at $0.65, you need to be right >65% for +EV
- The NO side is always 1 minus YES price. **Always check if NO has better asymmetry.**
- At $0.15 (market says 15% chance), YES pays 5.7x if correct. This is high-convexity.

**Liquidity reality:**
- High-volume markets (KXFED, major elections): $100-$1K fills at displayed price
- Niche markets: slippage likely above $500 orders
- $100K on a single Kalshi market may not be fillable. Check open interest first.

## Thesis Contradiction Detection

The most common error: selecting an instrument that bets AGAINST the thesis logic.

**Pattern 1: Surface vs. deeper claim mismatch**
- Thesis: "AI is being blamed for tech correction but the real cause is money printing"
- Surface claim: tech is going down → short tech?
- Deeper claim: money printing is debasing the currency → long gold
- Shorting tech aligns with the SURFACE claim. Long gold aligns with the DEEPER claim.
- **Always trade the deeper claim.** The deeper claim has better asymmetry because fewer people see it.

**Pattern 2: Shorting the victim of a misattribution**
- Thesis: "AI is a scapegoat. Software companies are being unfairly punished."
- Shorting software (IGV) contradicts the thesis. If AI isn't the real threat, software is being unfairly punished and should eventually RECOVER.
- Shorting software bets WITH the AI disruption narrative, not against it.
- **If the thesis says X is a scapegoat, don't short the scapegoat's victims.**

**Pattern 3: Multi-step causal chain (count the assumptions)**
- Thesis: "Money printing will cause inflation"
- Step 1: money printing → inflation → gold up (1 assumption, direct)
- Step 2: money printing → inflation → Fed raises rates → tech down (3 assumptions, indirect)
- If the thesis is about money printing, gold is the direct expression. Tech short requires two additional assumptions (that the Fed reacts AND that the market sells tech as a result).
- **Prefer the instrument that requires the fewest assumptions beyond the thesis itself.**

**Pattern 4: Sector vs. broad index dilution**
- Thesis: "AI capex is unsustainable"
- Shorting QQQ shorts EVERYTHING in Nasdaq, including COSTCO, PEPSICO, T-MOBILE
- Shorting specific AI-exposed names (NVDA, AMD) or AI ETFs has higher thesis beta
- **Shorting a broad index dilutes your thesis with unrelated exposure.**

## The GLD vs QQQ Puts Framework

When the final comparison comes down to "safe expression vs. max-upside expression," use this framework:

| Factor | Safe expression (e.g., GLD shares) | Max-upside expression (e.g., QQQ puts) |
|--------|-----------------------------------|-----------------------------------------|
| Max loss | ~15-25% ($15-25K of $100K) | 100% ($100K → $0) |
| Realistic upside | 20-40% ($20-40K) | 300-1000% ($300K-$1M) |
| Timing dependency | None; hold indefinitely | Must be right by expiration |
| Need to be right about | Direction only | Direction AND timing |
| Survives being early | Yes | No; time decay kills you |

**In max-upside mode (the default): choose the max-upside expression.** The $100K is risk capital. Losing it is acceptable. The asymmetry of 3-10x upside justifies the ruin risk.

**Override to safe expression only when:**
- The thesis has no catalyst and the horizon is multi-year
- No liquid options or perps exist
- The user explicitly asks for lower risk

## Targeted vs. Broad Instruments

**When a sector ETF beats a broad inverse:**
- SQQQ shorts all of Nasdaq, including profitable companies irrelevant to the thesis
- IGV targets software specifically (higher beta to a software thesis)
- XLK is broader tech but still more targeted than QQQ
- ITA targets defense. Don't use SPY for a defense thesis.

**When broad is actually better:**
- Macro theses (recession, rate shock) affect everything. Broad index is correct.
- Contagion theses where sector stress spreads to the whole market
- "Risk off" theses where the point IS that everything sells
- Money printing / currency debasement theses: gold, commodities, or broad inflation instruments
