# Scoring + Trade Selection

**Goal:** Arrive at the single best trade using structured evaluation. Categorical rubric assessments, then head-to-head comparison.

## Hard Gates

These disqualify an instrument before evaluation. No exceptions:

- **Thesis contradiction.** Instrument bets against the author's actual claim. Patterns:
  - *Shorting the scapegoat's victims:* If the thesis says X is a scapegoat, the victims are unfairly punished and should recover. Don't short them. Example: "AI is a scapegoat" → don't short software (IGV), it should recover.
  - *Multi-step causal chain:* Prefer the instrument requiring the fewest assumptions beyond the thesis. Example: "Nuclear is the AI power solution." CEG (operates nuclear plants, signed AI PPAs) requires 1 assumption. Uranium miners require 2: nuclear adoption AND uranium price increase.
  - *Sector vs. broad index dilution:* Shorting a broad index (QQQ) dilutes your thesis with unrelated exposure. Short specific names or sector ETFs with higher thesis beta.
  For close alternatives between instrument types, load `references/instrument-reasoning.md`.
- **Liquidity.** Can't fill $100K without >2% slippage.
- **Time mismatch.** Instrument expires or resolves before the catalyst date.

## Evaluation Rubric

For each surviving instrument, assess four dimensions using the anchored levels below. Do not assign numerical scores; use the categorical labels.

**1. Thesis Alignment** *If the thesis plays out, does this instrument respond?*

| Level | Meaning | Example |
|-------|---------|---------|
| Direct | The instrument IS the thesis | Kalshi "Fed holds in March?" for "Fed won't cut" thesis |
| Pure-play | Company's primary business is the thesis mechanism | LAES for "PQC adoption" thesis |
| Exposed | Thesis is a major driver, but not the only one | LSCC for PQC (FPGAs have non-PQC revenue) |
| Partial | Sector-level correlation, diluted by unrelated factors | TLT for "Fed holds rates" |
| Tangential | Loose connection, you'd have to explain the link | QQQ for PQC thesis |

**2. Payoff Shape** *What do you risk vs what do you gain?*

| Level | Meaning | Example |
|-------|---------|---------|
| Max asymmetry | Risk $1 to make $10+, defined max loss | OTM options, Kalshi contracts <$0.15 |
| High asymmetry | Risk $1 to make $3-8, defined or manageable loss | ATM options, moderate Kalshi contracts, 3-5x perps |
| Moderate | Risk $1 to make $1.5-3 | ITM options, leveraged ETFs, 2-3x perps |
| Linear | Up and down roughly equal | Shares, spot crypto, 1x perps |
| Capped/adverse | Upside limited or shape works against you | Selling premium, inverse ETFs with decay |

**3. Edge** *Has the market priced this thesis into THIS specific instrument?*

Assess per instrument, not per thesis. The same thesis can be consensus for one instrument and undiscovered for another.

| Level | Meaning | Example |
|-------|---------|---------|
| Undiscovered | No coverage of this angle, price hasn't moved on thesis | Tiny PQC pure-play before NIST headlines |
| Emerging | Early coverage, smart money positioning, starting to move | LSCC after first PQC articles, before rally |
| Consensus | Widely discussed, IV elevated, prediction markets 60-85% | NVDA "overvalued" narrative in 2025 |
| Crowded | Everyone's in this trade, IV maxed, prediction markets 90%+ | Kalshi at $0.93, paying 93c to win 7c |

**4. Timing Forgiveness** *If your timing is off, does this instrument punish you?*

| Level | Meaning | Example |
|-------|---------|---------|
| Very forgiving | No expiry, no decay, hold indefinitely | Shares, spot crypto, 1x perps with <5% ann funding |
| Forgiving | No decay before resolution, but hard expiry date | Kalshi contracts, long-dated LEAPS, low-funding perps (<10% ann) |
| Punishing | Meaningful drag, must be roughly right on timing | Medium-dated options (3-6mo), perps with 10-25% ann funding |
| Very punishing | Rapid decay, must be right quickly | Weekly options, high funding, leveraged ETFs |

## Underlying vs Wrapper

Alignment + Edge are properties of the *underlying* (same for shares, options, or perps). Payoff Shape + Timing Forgiveness are properties of the *wrapper*. Pick the underlying first (Alignment + Edge), then evaluate wrappers (Payoff Shape + Timing).

**Hyperliquid check.** After picking the underlying, check if it trades on Hyperliquid. Not just crypto: equities, gold, and commodities are listed as HIP-3 perps on the xyz dex. If it does, check the funding rate:

- **Funding favors your direction** (negative for longs, high positive for shorts): genuine edge. You get paid to hold.
- **Funding is near zero** (<5% annualized): essentially free leverage. HL beats options (no theta decay) for directional trades without a specific catalyst date.
- **Funding works against you** (high positive for longs, negative for shorts): HL is expensive. Shares, ETFs, or options are likely better.

Funding rates are dynamic. Always check at routing time. Never assume.

**Perp leverage:** Funding should never eat >50% of expected edge. Guideline: 5x/3x/2x (<30d), 3x/2x/1x (1-3mo), 2x/1x/1x (3-6mo), 1x/1x/stock (6mo+) across <10%/10-25%/>25% annual funding columns. Always state leverage, liquidation price, monthly funding drag.

## Comparing Candidates

After evaluating each instrument on the rubric:

- **2-3 candidates:** Compare head-to-head. "Considering alignment, payoff shape, edge, and timing: which is the better trade and why?"
- **4+ candidates:** Present the rubric assessments side-by-side and rank.

The comparison should weigh dimensions naturally. A "Direct + Undiscovered" instrument with "Linear" payoff can beat a "Partial + Consensus" instrument with "Max asymmetry". Alignment and edge matter more than leverage on a crowded trade.

Example, "Fed won't cut in March":
- Kalshi NO at $0.08 → Direct, Max asymmetry, Emerging, Very forgiving
- TLT puts → Partial, High asymmetry, Consensus, Punishing
- Winner: Kalshi. Better on every dimension.

Example, "SEALSQ undervalued because of PQC mandate":
- LAES shares → Pure-play, Linear, Undiscovered, Very forgiving
- LAES LEAPS → Pure-play, High asymmetry, Undiscovered, Forgiving
- LSCC LEAPS → Exposed, High asymmetry, Emerging, Forgiving
- Head-to-head: LAES LEAPS beats shares (same alignment + edge, better payoff shape, slightly less forgiving but still fine). LAES LEAPS beats LSCC (better alignment + edge, same payoff shape + timing).

## Stress-Test

Before committing, construct the strongest case AGAINST the winning trade:
- What would make this lose money even if the thesis is directionally correct?
- Try to rebut it with evidence from your research.
- If you can't rebut it, flag it as a known risk. If devastating, reconsider the runner-up.

## Compound Theses

Multiple distinct claims → decompose into separate legs, route the strongest leg as the primary trade, mention others as alternatives. The "one trade" default still applies: lead with one. Only load `references/portfolio-construction.md` if the user explicitly asks for a portfolio.

## Private Market Scan

**Trigger:** no public pure-play exists, OR the thesis targets an emerging trend pre-IPO.

```bash
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
```

Private markets automatically get "Very punishing" on timing forgiveness (5-7 year lockup for seed/A, 2-4 years for late-stage). They win when alignment and edge overcome the lockup penalty. Supplements the public market trade, never replaces it.

## When No Traditional Instrument Exists

Never dead-end. Descend the ladder of "what to do when no perfect trade exists":

**Level 1: High-beta proxy.** Parent company stock, sector ETF. State alignment level honestly.
**Level 2: Adjacent market.** Royalty platforms, prediction markets, pre-IPO/secondaries, crowdfunding.
**Level 3: Infrastructure play.** Who benefits if the thesis is right?
**Level 4: Non-financial action.** Merch drops, event tickets, domains, building in the space.
**Level 5: Position for the future.** No trade today. Set monitoring for when a direct instrument appears.
