# Track 4: Blindspot Analysis -- What Are We Missing?

Research date: 2026-02-15

---

## 1. Regulatory Risk: "Information" vs "Investment Advice"

### Description

The Belief Router takes a user's natural language belief, maps it to specific trades on specific platforms with specific dollar amounts ("$100 deployed"), and ranks them. Under SEC/FINRA rules, this likely crosses the line from "educational information" to "investment advice" or a "recommendation" triggering Regulation Best Interest (Reg BI) obligations.

The SEC distinguishes information from advice using a three-part test from Release IA-1092: (1) whether the information is readily available in raw form, (2) whether the categories are highly selective, and (3) whether it is organized/presented in a manner that constitutes advice. A tool that takes "I think rates go higher" and returns "buy TLT puts on Robinhood for $100" fails all three prongs -- the information is highly curated, selective, and organized as a recommendation.

The "publisher's exclusion" under the Advisers Act requires content to be (i) impersonal, (ii) bona fide/disinterested, and (iii) of general and regular circulation. A Belief Router that tailors output to individual belief statements may not qualify as "impersonal." The SEC has signaled that increased sophistication and customization of information products may require providers to be subject to additional oversight, potentially limiting reliance on the publisher's exclusion.

Reg BI applies when a broker-dealer makes a "recommendation" to a retail customer -- defined as a "call to action" that is individually tailored. The Belief Router's output ("here are 4 ranked trades for your specific belief") fits this definition.

### Severity: BLOCKS LAUNCH

### Evidence

- SEC Release IA-1092 three-part test for what constitutes "advice"
- SEC 2026 Exam Priorities explicitly target automated investment tools, AI-based recommendations, and whether representations match actual functionality
- FINRA 2026 Oversight Report emphasizes Reg BI compliance for digital engagement practices
- SEC charged Wealthfront (a registered RIA) for false disclosures about tax-loss harvesting -- even registered entities face enforcement
- Composer Securities LLC registered as a broker-dealer and includes disclaimers: "This material is for informational purposes only and is not intended to be a substitute for consultation with a qualified tax professional"
- SEC staff position: robo-advisers providing personalized, ongoing investment management are investment advisers regardless of automation -- no no-action relief was granted

### Recommended Mitigation

1. **Consult securities counsel before launch** -- get a formal opinion on whether the tool constitutes investment advice or a recommendation
2. **Register as an RIA or broker-dealer** if counsel determines registration is required, or structure the tool to stay within the publisher's exclusion (impersonal, general circulation, no tailoring)
3. **Disclaimers are necessary but insufficient** -- Composer's approach (registered broker-dealer + disclaimers) is the gold standard. Simply slapping "not investment advice" on personalized trade recommendations does not create a legal safe harbor
4. **Consider removing specific dollar amounts and ranked recommendations** -- presenting raw market data (prices, probabilities) without ranking or sizing is more defensible than "buy X for $100"
5. **Avoid the word "recommendation"** -- use "expressions" or "market data" in all user-facing language

---

## 2. Conflict of Interest in Routing

### Description

If Bankr (or any integrated platform) takes swap fees and the Belief Router routes users toward that platform, there is an inherent conflict of interest. The router may favor platforms that generate revenue for the operator over platforms that offer the best execution for the user.

DEX aggregators like Jupiter, 1inch, and Li.Fi have established transparency norms: Jupiter charges ~0.1% on swaps, publishes open-source contracts with verifiable routing logic, and executes all trades on-chain. 1inch uses a Pathfinder algorithm to split trades for best pricing. Li.Fi aggregates across multiple DEX aggregators and bridges. All three make their routing logic inspectable.

### Severity: SHOULD ADDRESS

### Evidence

- Jupiter controls ~95% of Solana's DEX aggregator market share precisely because of transparent routing -- facilitated 1.4B+ swaps and ~$80B volume in Q2 2025
- Jupiter committed 50% of fee revenue to token buybacks, aligning protocol revenue with user outcomes
- 1inch splits trades across venues for best pricing, making the algorithm auditable
- Bankr Swap is non-custodial (users trade from their own wallet), which reduces custody risk but does not eliminate routing bias concerns
- SEC Reg BI requires disclosure of material conflicts of interest when making recommendations

### Recommended Mitigation

1. **Disclose all fee relationships transparently** -- show the user exactly what each platform charges and what (if any) revenue the router operator earns from each route
2. **Show a "net return" comparison** that includes platform fees, so users can see the all-in cost
3. **Make routing logic inspectable** -- publish the scoring/ranking methodology so users can verify the router is optimizing for their outcome, not operator revenue
4. **Consider a "best execution" policy** similar to broker-dealer obligations -- document that routing prioritizes user outcomes

---

## 3. Correlated Risk Across Platforms

### Description

When a user expresses a single belief (e.g., "rates go higher"), the router may surface trades across all 4 platforms that are fundamentally the same directional bet: Kalshi (Fed holds rates), Robinhood (short TLT), Hyperliquid (short BTC as a risk-off proxy), Bankr (sell rate-sensitive tokens). If the thesis is wrong, the user loses on every platform simultaneously. This is concentrated exposure masquerading as diversification.

Existing portfolio tools handle this through correlation analysis, overlap detection, and concentration warnings. ETF Insider identifies fund overlap and concentration risks. Multi-asset platforms like Parametric provide cross-asset correlation analysis. The FCA requires CFD platforms to disclose that 82% of retail clients lose money -- partly because correlated positions amplify losses.

### Severity: SHOULD ADDRESS

### Evidence

- FINRA guidance on concentration risk: "investments within the same industry, geographic region or security type tend to be highly correlated"
- ActivTrades guidance: "clustering positions in highly correlated markets can amplify drawdowns"
- No existing retail tool provides cross-platform correlation warnings -- this is a genuine gap in the market
- Cross-instrument surveillance (TradingHub) focuses on abuse detection but the same correlation analysis applies to risk management

### Recommended Mitigation

1. **Add a correlation warning** when multiple suggested trades share the same directional thesis -- "These 3 trades all profit if rates rise. If rates fall, you could lose on all 3 simultaneously."
2. **Show a "thesis diversity score"** -- flag when all trades are effectively one bet
3. **Suggest hedging or opposing positions** if the user wants to deploy across all 4 platforms but reduce correlation
4. **Cap suggested deployment** when correlation is high -- instead of $100 x 4 platforms, suggest $50 x 2 uncorrelated + $25 x 2 correlated

---

## 4. Liquidity Illusion on Prediction Markets

### Description

Kalshi and Polymarket display prices (e.g., "Fed holds at 93 cents") but the displayed price may not be available for the user's desired order size. Retail users attempting $1K-$10K orders may experience significant slippage, especially in less popular markets.

### Severity: SHOULD ADDRESS

### Evidence

- Kalshi's order book is generally sufficient for trades up to $10K without significant slippage on **high-volume markets** -- but niche markets have shallow depth and wide spreads
- Institutional trades ($50K+) may experience 1-2% slippage even on popular markets
- SIG (Susquehanna) onboarded as institutional market maker in 2024, providing ~30x previous liquidity in select markets -- but only in select markets
- Kalshi's Liquidity Incentive Program (Sept 2025 - Sept 2026) pays traders for maintaining order book depth
- Real user experience: "if you try to buy 1,000 YES contracts at $0.42, there might only be 200 available at that price, with the rest filling at $0.43, $0.44"
- Karl Whelan's academic paper on Kalshi market-maker economics documents structural liquidity challenges
- A Columbia University study found ~25% of Polymarket's historical volume showed wash trading characteristics, inflating apparent liquidity

### Recommended Mitigation

1. **Show estimated slippage** for the user's order size, not just the mid-market price -- "Price: 93c | Your $100 order fills at est. 93.2c"
2. **Flag thin markets** where order book depth is insufficient -- "Low liquidity: your order may move the price significantly"
3. **Suggest limit orders over market orders** to protect against slippage
4. **Distinguish between displayed price and achievable price** in all comparisons -- the Robinhood stock price is nearly always achievable at displayed price, while Kalshi niche market prices may not be

---

## 5. The "Priced In" Problem

### Description

When Kalshi shows a 93% probability and the user agrees with the consensus, the max upside is only ~7.5% (buy at 93c, win $1). After fees, the expected return is minimal. The user may not realize that agreeing with the consensus means there is almost no edge -- and the risk/reward is severely asymmetric (risk 93c to gain 7c).

This is equivalent to betting on a -1200 favorite in sports -- technically profitable if correct, but terrible expected value adjusted for the risk of being wrong.

### Severity: SHOULD ADDRESS

### Evidence

- Morgan Stanley research on probabilities and payoffs: "generating excess returns requires having a well-grounded view that is different than what the market has priced"
- Prediction market prices are consensus estimates -- agreeing with consensus means zero edge by definition
- Defi Rate provides calculators for Kalshi/Polymarket odds, but no tool proactively warns users about negative expected value bets
- Sports betting platforms handle this with implied probability displays and "juice" calculations

### Recommended Mitigation

1. **Show implied edge** alongside every prediction market trade -- "Market says 93%. If you also think 93%, your edge is 0% and expected value is negative after fees."
2. **Highlight asymmetry** -- "You risk $93 to gain $7. If you're wrong, you lose 13x what you'd gain if right."
3. **Suggest the contrarian side** when the user agrees with consensus -- "The NO side at 7c has much higher upside if you think the market is overconfident"
4. **Add a "consensus agreement" warning** -- "Your belief matches the market consensus. Consider: do you have information the market doesn't?"

---

## 6. Tax Implications Across Platforms

### Description

Each platform has different tax treatment, which materially affects real returns. Users comparing "$100 deployed" across platforms may not realize that after-tax returns differ significantly:

- **Kalshi**: Tax treatment is unsettled. NOT clearly Section 1256 (60/40 long-term/short-term). Most advisors recommend reporting as ordinary income (Schedule C) or capital gains (Schedule D). Kalshi does not issue comprehensive 1099 forms for trading activity -- users must reconstruct P&L themselves.
- **Robinhood stocks/ETFs**: Standard capital gains -- short-term (< 1 year, taxed as ordinary income) or long-term (> 1 year, lower rate). Options have additional complexity.
- **Hyperliquid crypto perps**: Treated as property. Each trade is a taxable event. Short-term/long-term capital gains apply. Offshore perps do NOT qualify for Section 1256.
- **Bankr token swaps**: Same as crypto -- property, each swap is a taxable event.

### Severity: CAN DEFER (but should disclose)

### Evidence

- Camuso CPA: "Kalshi may issue Form 1099-MISC for certain credits or rewards...but it does not currently provide broker-style reporting for event-contract trading activity"
- Section 1256 treatment for Kalshi is "unsettled" -- claiming it would require "strong factual support, formal analysis, Form 6781 reporting, and a willingness to defend the position under examination"
- KPMG analysis highlights potential tax implications for CFTC-regulated prediction market contracts
- Crypto-to-crypto swaps (Bankr, Hyperliquid) are taxable events per IRS guidance
- A user in a high tax bracket could see 37% federal tax on short-term Kalshi gains vs. 15-20% on long-term stock gains -- a 17-22% difference in after-tax return

### Recommended Mitigation

1. **Add a tax impact disclaimer** -- "Tax treatment varies by platform. Consult a tax professional."
2. **Consider showing after-tax estimates** in a future version -- even rough estimates (short-term cap gains rate vs. long-term) would be valuable
3. **Flag the Kalshi tax reporting gap** -- users need to know they must reconstruct their own P&L

---

## 7. Platform / Counterparty Risk

### Description

The 4 platforms have vastly different risk profiles that are invisible in a simple trade comparison:

- **Kalshi**: CFTC-regulated DCM, uses LedgerX clearinghouse, segregated customer accounts. Strongest regulatory protection. BUT: had an NFL payout incident (Jan 2026) where users were initially only repaid stakes, not winnings; Massachusetts AG sued for unlicensed sports wagering (Sept 2025).
- **Polymarket**: Offshore, acquired QCX for US reentry, CFTC no-action letter (Sept 2025). Columbia study found ~25% of volume may be wash trading, with up to 60% in peak periods.
- **Hyperliquid**: DEX on Arbitrum. Suffered THREE market manipulation attacks in 2025: (1) March -- JELLY token exploit, $12M floating loss, deposits/withdrawals halted; (2) July -- another manipulation; (3) November -- POPCAT manipulation, $4.9M bad debt, withdrawals halted again. Revealed to be far less decentralized than claimed. Bridge halted during incidents.
- **Bankr**: Non-custodial (users keep their keys), but smart contract risk remains. Relatively new platform with limited track record.

### Severity: SHOULD ADDRESS

### Evidence

- Hyperliquid's three 2025 attacks: JELLY (March), unnamed (July), POPCAT (November) -- each time withdrawals were frozen, contradicting "decentralized" claims
- Kalshi NFL payout incident: correct position holders initially only received stake back, not winnings -- fixed only after user backlash
- Polymarket wash trading study: ~25% of historical volume showed wash trading characteristics (Columbia University, 2025)
- Hyperliquid admitted vulnerabilities: massive positions on illiquid assets, oracle manipulation, automatic inheritance of too-large positions

### Recommended Mitigation

1. **Show a platform risk tier** alongside each trade -- e.g., "Kalshi (CFTC regulated)" vs "Hyperliquid (DEX -- see risk note)"
2. **Add platform risk disclosures** that are not buried in fine print -- surface key incidents
3. **Weight platform risk in the routing score** -- a 10% better return on Hyperliquid may not be worth it if the platform has frozen withdrawals 3 times in one year
4. **Cap suggested allocation to higher-risk platforms** -- don't suggest putting $100 on Hyperliquid the same way you would on Kalshi

---

## 8. Responsible Design: Most Retail Traders Lose Money

### Description

This is the meta-blindspot. The Belief Router makes it frictionless to convert a casual opinion into deployed capital across multiple platforms. The history of retail trading tools shows this is dangerous:

- **82% of retail CFD clients lose money** (FCA, UK)
- **Robinhood was fined $7.5M** (Massachusetts) for gamification features that encouraged frequent, risky trading among inexperienced investors
- **The SEC flagged** that digital engagement practices (nudges, confetti, leaderboards) induce inappropriate speculation
- **The FCA requires** all CFD platforms to prominently display the percentage of retail clients who lose money
- **The FCA mandates** automatic close-out at 50% margin, negative balance protection, and leverage limits

A tool that makes it trivially easy to turn beliefs into bets across 4 platforms could amplify retail losses rather than empower informed decision-making.

### Severity: SHOULD ADDRESS (partially blocks launch for ethical reasons)

### Evidence

- FCA data: 82% of retail CFD clients lose money; protections prevent ~400K people/year from risking more than their stake, providing GBP 267M-451M of protection annually
- Robinhood Massachusetts settlement ($7.5M) for gamification encouraging risky trading behavior
- SEC 2021 report: 45 pages on gamification risks, noted that DEPs "nudge opportunistically to encourage more trading"
- UK financial services require a 24-hour cooling-off period after a customer requests to invest
- Responsible gambling features (deposit limits, cooling-off periods, self-exclusion) are standard in regulated gambling platforms
- Capital.com positions itself as a "responsible trading platform" -- FCA approved specifically for responsible design features

### Recommended Mitigation

1. **Show a risk warning on every trade card** -- not a disclaimer wall, but a concise, visible warning: "Most retail traders lose money. Only trade with money you can afford to lose."
2. **Add friction for first-time users** -- require users to acknowledge they understand the risks before their first trade route
3. **Consider a "paper trading" mode** where users can track belief-to-trade performance without real money
4. **Show the user's cumulative P&L** if they follow routes -- transparency about outcomes builds trust and deters reckless behavior
5. **Implement position limits or warnings** for large allocations -- "You're about to deploy $500 across 4 correlated trades. Are you sure?"
6. **Add a cooling-off feature** -- if a user is routing multiple beliefs rapidly, suggest they slow down
7. **Display a loss percentage disclaimer** if possible -- "Historically, X% of users who followed similar trade expressions lost money" (requires data collection)

---

## Summary Table

| # | Blindspot | Severity | Key Risk |
|---|-----------|----------|----------|
| 1 | Regulatory (advice vs info) | **BLOCKS LAUNCH** | SEC/FINRA may classify as investment advice requiring registration |
| 2 | Routing conflict of interest | Should address | Undisclosed fee relationships bias routing |
| 3 | Correlated risk | Should address | User deploys same bet across 4 platforms, loses everywhere |
| 4 | Liquidity illusion | Should address | Displayed prediction market prices may not be achievable |
| 5 | "Priced in" problem | Should address | Agreeing with consensus = zero edge, terrible risk/reward |
| 6 | Tax implications | Can defer | After-tax returns vary 17-22% across platforms |
| 7 | Platform/counterparty risk | Should address | Hyperliquid froze withdrawals 3x in 2025 |
| 8 | Responsible design | Should address | 82% of retail CFD traders lose money; tool reduces friction to trade |

### Priority Order for Mitigation

1. **Regulatory opinion** (blocks launch) -- get legal clarity first
2. **Risk warnings and responsible design** (ethical obligation + regulatory expectation)
3. **Correlation warnings** (novel feature that differentiates the product)
4. **Platform risk tiers** (easy to implement, high user value)
5. **Liquidity/slippage estimates** (important for prediction market accuracy)
6. **"Priced in" edge warnings** (unique value-add)
7. **Fee transparency** (good practice, Reg BI may require it)
8. **Tax disclaimers** (important but can defer to V2)
