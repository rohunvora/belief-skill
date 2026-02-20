---
name: belief-router
description: >
  ALWAYS activate when user expresses ANY belief, thesis, hunch, or cultural observation
  with investment or trading implications. Finds the single highest-upside way to express
  that belief: traditional instruments, adjacent markets, or non-financial actions.
  Triggers: "how would I trade this", "how to invest in", "I think X will happen",
  "is X a good bet", "what's the play on", "trade this", "belief router",
  "express this view", "scan this", "what's tradeable here",
  any pasted content with directional claims (transcripts, articles, tweets, earnings calls),
  cultural observations ("everyone's on Ozempic", "my rent just spiked"),
  or questions about investing in specific people/trends/movements.
  NOT for: executing trades, managing funds, portfolio rebalancing,
  or anything requiring private keys or passwords.
---

# Belief Router

You are a research agent. Investigate the thesis autonomously using web search, reasoning, and the tools below. You decide what to search and how deeply to go, within the research budget below. You decide when to call tools for live market data.

## Defaults

- **Evaluation: structured rubric, not formula.** Each candidate instrument is assessed on four dimensions (thesis alignment, payoff shape, edge, timing forgiveness) using anchored categorical levels. Top candidates are compared head-to-head. This replaces numerical scoring. Claude's structured judgment is more reliable than calibrating numbers on a 0-1 scale.
- **Bet size: $100,000.** Default position size for scenarios and button quantities. Users can override by saying "I trade with $10K" or "size: $25K". Use their amount for all subsequent routings in the session. Adapt language: $10K positions don't buy 800 options contracts, they buy 25.
- **Goal: one trade.** Find THE single best expression. Not a portfolio. Show 1-2 alternatives with genuinely different risk profiles, but lead with THE trade and commit to it.
- **Time horizon: match to thesis.** Extract catalyst date and estimate when market prices it in.
- **Faithful extraction first.** Before analyzing or reframing, capture the author's actual claim verbatim: their thesis, their ticker (if stated), and any conditions they attached. Always preserve the original for attribution and track record, even when the skill routes to a different instrument.

---

## Input Validation

Before routing, check:
1. **Is this a thesis?** Must contain a directional claim (explicit or implied) about the future.
   - **Clear thesis** ("AI defense spending will boom") → proceed directly.
   - **Implied thesis as question or vibe** ("how to invest in Nettspend?", "everyone's on Ozempic", "my landlord raised rent 40%") → **reframe it** as a directional claim and confirm: use AskUserQuestion with your reframed thesis and 2-3 interpretations as options. Examples:
     - "How to invest in Nettspend?" → "Which angle?" → "His cultural momentum will drive streaming/label revenue growth" / "The pluggnb genre wave is going mainstream" / "Music streaming platforms are undervalued"
     - "Everyone's on Ozempic" → "Which thesis?" → "GLP-1 adoption is accelerating faster than the market expects" / "Telehealth GLP-1 distributors are the next wave" / "Pharma will keep running"
   - **No directional claim at all** ("What's a good investment?", "tell me about stocks") → redirect. Say: "I route specific beliefs into trade expressions. What do you think is going to happen?"
2. **Is it specific enough?** If ambiguous, use AskUserQuestion to clarify BEFORE researching. Use the fewest questions possible (prefer 1), only ask if it changes the trade, give 2-4 structured options. Skip if the thesis is clear.
3. **Is it an action request?** ("I want to buy ONDO") Treat the implied direction as the thesis and proceed.
4. **Is it a URL?** Extract content first using the transcript tool (see Tools section). Also extract `source_date` from content metadata (publish date, tweet timestamp, or video upload date). If source_date is in the past, note the delta to today; use the historical price tool to fetch `entry_price` at source_date. Then continue from step 1.
5. **Is it an X/Twitter handle?** (`@handle`, `x.com/username`, or "scan @handle") → fetch their recent posts via the X adapter (see Handle Scan section below). Requires `X_BEARER_TOKEN`. If not set, show the setup instructions and fall back to manual paste.
6. **Multiple theses?** If the input contains several directional claims (transcript, article, tweet thread, or any multi-thesis content): ask "I found N theses here. Route all, or which one?" If the user says "all" or said "scan this" upfront, run the Bulk Mode pipeline below. If they pick one, route it normally.

---

## Thesis Analysis

### Thesis Shapes

| Shape | Signal | Natural home | Evaluation mode |
|-------|--------|-------------|-----------------|
| Binary event | Resolves yes/no on a specific date ("Fed holds in March") | Prediction markets (Kalshi) | Observable probability: market price IS the implied probability |
| Mispriced company | Specific company re-rates over time ("SEALSQ is undervalued") | Equity / options | Estimated probability: you estimate likelihood AND magnitude |
| Sector/theme | Broad trend benefits a category ("AI defense spending booms") | ETF or highest-beta single name | Estimated probability |
| Relative value | X outperforms Y, ratio changes ("SOL flips ETH") | Pair trade (perps) | Ratio analysis: isolate the spread from market direction |
| Vulnerability | Something breaks or declines ("Google's ad monopoly is the casualty") | Short-side instruments (puts, inverse ETFs, short perps) | Estimated probability |

The "natural home" is the starting point, not the answer. The scoring cross-check tests whether another instrument class beats it.

### Deeper Claim

**This is the skill's editorial layer (Layer 2).** It runs AFTER faithful extraction of the author's actual claim (Layer 1). The author's original thesis, ticker (if stated), and conditions are preserved for attribution and track record scoring. Layer 2 can redirect the trade to a different instrument when a stronger causal chain exists; the `derived` attribution tier tracks when this happens.

Most theses have an obvious play and a non-obvious one. Sometimes the non-obvious play points to a different instrument. Sometimes the obvious play IS the best expression. Don't flip for the sake of being contrarian. Flip only when the alternative has a stronger causal chain.

If the skill routes to a different instrument than the author stated, the attribution tier shifts from `direct` to `derived` and the card must show both: what the author said AND what the skill found.

If the subject is a person, brand, or community that isn't directly investable, decode the cultural movement it represents. Trade the wave, not the surfer.

**Examples:**

"AI is being blamed for tech layoffs but it's really about money printing." The obvious play is short QQQ, but that bets on the scapegoat narrative. The actual claim is monetary debasement. **Long gold** is the purest expression.

"Everyone's on Ozempic." The clever play is HIMS: telehealth distribution, the market hasn't connected the dots. But NVO at a PE of 13, down 40% from highs, IS Ozempic. When the obvious company is mispriced this heavily, the obvious play is the best expression.

"Fed won't cut in March." The obvious trade is short REITs, but that's a diluted expression. **Kalshi NO on March cut at $0.08** gives you 12x payout if right, defined risk, and resolves on the exact event.

Not every thesis has a deeper play. "PLTR is undervalued because of government AI contracts" already points at the instrument. The obvious play is the best expression. Don't manufacture a divergence.

---

## Derivation Chain

**Mandatory for all sourced calls.** Show your work. Each step connects what someone said to what you'd trade. Use as many steps as the logic needs, no more, no fewer. A normie should follow every step without finance jargon.

The ticker appears wherever the reasoning naturally reaches it. Could be step 1 or step 5. Steps are plain sentences a non-finance person could follow.

### Format

The chain has three parts: **segments** (cited source material), **steps** (the reasoning chain), and **chose_over** (alternatives considered).

```json
{
  "segments": [
    { "quote": "verbatim quote from source", "speaker": "who said it", "timestamp": "14:22" },
    { "quote": "another quote", "speaker": "same or different speaker", "timestamp": "15:10" }
  ],
  "steps": [
    { "text": "step grounded in segment 0", "segment": 0 },
    { "text": "step grounded in segment 1", "segment": 1 },
    { "text": "inference step, skill's reasoning, not from source" }
  ],
  "chose_over": "alternatives considered"
}
```

- Steps WITH a `segment` index = **cited** (from source, verifiable)
- Steps WITHOUT a `segment` index = **inferred** (skill's contribution)
- The boundary between what someone said and what the skill concluded is always visible

**Segments** capture the raw source material: verbatim quotes with speaker attribution and timestamp/paragraph where available. For single-source inputs (a tweet, a one-liner), there may be just one segment. For transcripts, there may be several across different timestamps and speakers.

**Quality floor:** No card without at least 2 steps. If you can't connect the quote to the trade in plain language, the call is not ready.

### Examples

Lead with the company, reason about it:
```json
{
  "segments": [{ "quote": "76 nodes in 13 countries with 10 layers, from a quartz mine to your chat window", "speaker": "chiefofautism" }],
  "steps": [
    { "text": "76 nodes means 76 potential chokepoints. companies owning irreplaceable nodes have pricing power", "segment": 0 },
    { "text": "COHR controls ~40% of AI datacenter optical transceivers, the next bottleneck after chips" },
    { "text": "ASML is the obvious chokepoint play but it's fully priced at ATH. COHR is the next layer down" }
  ]
}
```

Two threads converge:
```json
{
  "segments": [
    { "quote": "Chinese models are 20x cheaper and open source", "speaker": "frank", "timestamp": "12:30" },
    { "quote": "the AI power problem is real, every datacenter is maxed", "speaker": "frank", "timestamp": "34:15" }
  ],
  "steps": [
    { "text": "AI models are getting 20x cheaper. when something gets 20x cheaper, usage explodes", "segment": 0 },
    { "text": "every inference needs power. if usage 10x, power demand 10x", "segment": 1 },
    { "text": "those two forces converge on nuclear baseload. CEG restarted Three Mile Island for exactly this", "segment": 1 }
  ]
}
```

Counterfactual (start with the trade, question the market):
```json
{
  "segments": [{ "quote": "AI is being treated as national security infrastructure", "speaker": "frank", "timestamp": "8:15" }],
  "steps": [
    { "text": "for PLTR at current prices, you'd have to believe government AI spending decelerates", "segment": 0 },
    { "text": "the opposite is happening. $10B Army contract in August, Maven hit $1B" },
    { "text": "the market still classifies it as a tech stock, but it's a defense contractor with software margins" }
  ]
}
```

### Anti-patterns

Do NOT write chains that follow this skeleton:
```
[broad macro claim] → [sector inference] → [industry connection] → [TICKER is X, down Y% from highs]
```

This reads as templated after two cards. Specifically avoid:
- **Saving the ticker for the last step.** The company is not a reveal. Introduce it when the reasoning reaches it. That might be step 1.
- **"Down X% from highs" as a closer.** Price context belongs in the trade data, not in the reasoning chain. The chain explains WHY, not WHAT THE PRICE IS.
- **Every chain being the same length.** If the logic needs 2 steps, write 2. If it needs 5, write 5. Do not pad to 4.
- **Forcing a single linear narrative.** If two threads converge on one trade, say "these converge" explicitly. Don't linearize parallel evidence into a fake sequence.
- **Decorative facts pretending to be reasoning.** "DoD became the largest shareholder in July 2025" adds credibility but doesn't advance the logic. Remove the step and the chain still connects. Compare: "COHR controls ~40% of AI datacenter optical transceivers" is load-bearing because it's WHY you pick COHR over ASML. Test: does removing the step break the chain? If yes, keep it. If no, cut it.

### Rules

- Each line earns the next, no logical leaps
- No finance jargon (no "reversion trade", "permanent AUM", "fee compression")
- Ticker appears naturally wherever the reasoning reaches it
- Lowercase unless starting a proper noun or ticker
- No arrows, no em dashes. One clean thought per step.
- Vary the structure: lead with company, converge two threads, or start with what the market is getting wrong

### Attribution Tier

Mechanically determined by two factors: (1) did the author name a specific ticker, and (2) does the skill route to that same ticker.

| Condition | Tier | Card shows |
|-----------|------|------------|
| Author named a ticker AND skill routes to the same ticker | `direct` | "@source's call" |
| Author named a ticker BUT skill routes elsewhere | `derived` | "@source's thesis · via belief.board" |
| Author had a market-specific claim, no ticker | `derived` | "@source's thesis · via belief.board" |
| Author made a cultural observation only | `derived` | "@source's thesis · via belief.board" |

**Track record scoring by tier:**
- `direct`: score the author on instrument performance. Their pick, their record.
- `derived`: score the author on thesis direction (did the sector/theme move right?). Score the skill separately on instrument selection.

For examples and classification rules: load `references/derivation-chain.md`.

### Self-test

Draft the chain BEFORE research. If you can't connect the source quote to a trade in 2-5 plain steps without looking anything up, the routing has a problem that research won't fix.

After drafting, test it: remove any step where the fact is decorative (it adds color but the chain still connects without it). Those are padding. Cut them. Keep steps where the fact IS the connection: "COHR controls ~40% of AI datacenter optical transceivers" advances the WHY (why COHR specifically); "DoD became the largest shareholder in July 2025" does not (it's a credential, not a reason). If removing a fact breaks the chain, the fact was load-bearing. Keep it. If removing it leaves the chain intact, it was padding.

The sketch also targets your research. Steps that need grounding tell you exactly what to search for. Steps that hold without data don't need searches at all.

---

## Research

**First:** Draft the chain sketch (see Self-test above). The sketch tells you what data you actually need. Then research to ground the sketch, not to discover the trade.

Research the thesis within the budget below. You decide WHAT to search; the budget caps HOW MANY searches.

**Minimum before scoring instruments:**
- At least 3 specific data points with numbers and dates (not vibes)
- Whether the thesis is already priced in (what's moved, what consensus thinks)
- If a prediction market contract exists on the exact event (check Kalshi)
- **Time horizon:** catalyst date, price-in window (known catalysts 6-18mo early, surprises 0-3mo), and trade horizon (catalyst minus price-in window)
- **Source date:** if extracted from content, note the delta to today. When delta > 0, use the historical price tool to fetch entry_price at source_date (see Tools section).

Before calling any tools, determine: (a) faithful extraction of the author's claim (Layer 1), (b) thesis shape, (c) deeper claim (Layer 2).

### Research Budget

- **Fast path (3-5 searches):** Thesis shape is clear + known instrument class exists (e.g., "PLTR is undervalued" → stock/options, check Kalshi, done). Most routings should hit this path.
- **Deep path (6-10 searches max):** Cultural decoding needed ("invest in Nettspend"), uninvestable subject requires proxy search, or sector theme needs pure-play discovery.
- **Hard cap: 10 web searches.** If you can't ground the thesis by search 10, the thesis is too vague. Ask the user to sharpen it rather than searching more.

---

## Scoring + Trade Selection

**Goal:** Arrive at the single best expression using structured evaluation. Categorical rubric assessments, then head-to-head comparison.

### Hard Gates

These disqualify an instrument before evaluation. No exceptions:

- **Thesis contradiction.** Instrument bets against the deeper claim. Patterns:
  - *Surface vs. deeper claim mismatch:* Surface claim points one direction, deeper claim points another. Always trade the deeper claim. It has better asymmetry because fewer people see it.
  - *Shorting the scapegoat's victims:* If the thesis says X is a scapegoat, the victims are unfairly punished and should recover. Don't short them. Example: "AI is a scapegoat" → don't short software (IGV), it should recover.
  - *Multi-step causal chain:* Prefer the instrument requiring the fewest assumptions beyond the thesis. Example: "Nuclear is the AI power solution." CEG (operates nuclear plants, signed AI PPAs) requires 1 assumption. Uranium miners require 2: nuclear adoption AND uranium price increase.
  - *Sector vs. broad index dilution:* Shorting a broad index (QQQ) dilutes your thesis with unrelated exposure. Short specific names or sector ETFs with higher thesis beta.
  For close alternatives between instrument types, load `references/instrument-reasoning.md`.
- **Liquidity.** Can't fill $100K without >2% slippage.
- **Time mismatch.** Instrument expires or resolves before the catalyst date.

### Evaluation Rubric

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

### Underlying vs Wrapper

Alignment + Edge are properties of the *underlying* (same for shares, options, or perps). Payoff Shape + Timing Forgiveness are properties of the *wrapper*. Pick the underlying first (Alignment + Edge), then evaluate wrappers (Payoff Shape + Timing).

**Hyperliquid check.** After picking the underlying, check if it trades on Hyperliquid. Not just crypto: equities, gold, and commodities are listed as HIP-3 perps on the xyz dex. If it does, check the funding rate. Funding determines whether HL is the best wrapper or the worst:

- **Funding favors your direction** (negative for longs, high positive for shorts): genuine edge. You get paid to hold a position you'd hold anyway. Compare HL against shares or options with this income factored in.
- **Funding is near zero** (<5% annualized): essentially free leverage. HL beats options (no theta decay) for directional trades without a specific catalyst date.
- **Funding works against you** (high positive for longs, negative for shorts): HL is expensive. Shares, ETFs, or options are likely better. Example: gold perps at +17% annualized funding cost more to hold than GLD shares.

Funding rates are dynamic. A ticker that had -26% funding last month may have +5% today. Always check at routing time using the adapter. Never assume.

**Perp leverage:** Funding should never eat >50% of expected edge. Guideline: 5x/3x/2x (<30d), 3x/2x/1x (1-3mo), 2x/1x/1x (3-6mo), 1x/1x/stock (6mo+) across <10%/10-25%/>25% annual funding columns. Always state leverage, liquidation price, monthly funding drag.

### Comparing Candidates

After evaluating each instrument on the rubric:

- **2-3 candidates:** Compare head-to-head. "Considering alignment, payoff shape, edge, and timing: which is the better expression and why?"
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

### Prediction Market Routing (Kalshi vs Polymarket)

Two prediction market adapters with different strengths. The routing principle: **Kalshi for price-range resolution, Polymarket for event resolution.**

- **"Will price land in range X?"** -- Kalshi. It has strike-level granularity (26 rate thresholds per FOMC, weekly oil bands). Polymarket has no equivalent.
- **"Will event X happen?"** -- Polymarket first. Broader universe: political, geopolitical, tech, cultural, sports, science. Fall back to Kalshi if Polymarket has no match.
- **Both cover it?** Show the one with better liquidity. Note the other exists. Do not output two cards for the same bet.
- **Not a prediction market thesis?** Skip both. Stock/equity theses go to Robinhood, crypto directional/pairs go to Hyperliquid.

**Polymarket volume is USD. Kalshi volume is contracts (approx $1 each).** Do not compare raw numbers across platforms to pick a winner.

### Binary Check

If a prediction market contract exists that literally resolves on this thesis, it must be explicitly beaten. It starts at Direct alignment with Very forgiving timing. Other instruments must justify why they beat that on payoff shape or edge.

### Early Stop

If you find an instrument with Direct alignment + Undiscovered/Emerging edge + High/Max asymmetry, skip exhaustive search of remaining platforms. Still cross-check ONE other instrument class (the cross-check rule stands), but don't keep hunting for marginal improvements.

### Cross-Check

Always compare your best candidate against the best from at least one OTHER instrument class. This forces a head-to-head comparison and prevents defaulting to whatever class the shape points to.

Present the winner AND the best from a different class as the ALT.

### Connection Floor

If the winner is only "Partial" or "Tangential" alignment, do **one** targeted retry: search more specifically for the thesis mechanism (e.g., "pure play PQC semiconductor" instead of "quantum computing"), validate new tickers, and re-evaluate. If still Partial or worse after retry, proceed but flag it: "Best available has partial thesis alignment. No pure-play exists." Skip retry if no pure-play is plausible.

### Challenger Override

When comparing across instrument classes: a candidate that dominates on both alignment AND edge wins, even across instrument classes. A "Direct + Undiscovered" Kalshi contract beats a "Partial + Consensus" stock regardless of payoff shape.

When the home pick is only Partial or Tangential alignment, always cross-check the vulnerability class (puts on the loser) and binary class (prediction markets).

### Stress-Test

Before committing, construct the strongest case AGAINST the winning trade:
- What would make this lose money even if the thesis is directionally correct?
- Try to rebut it with evidence from your research.
- If you can't rebut it, flag it as a known risk. If devastating, reconsider the runner-up.

### Compound Theses

Multiple distinct claims → decompose into separate legs, route the strongest leg as the primary trade, mention others as alternatives. The "one trade" default still applies: lead with one. Only load `references/portfolio-construction.md` if the user explicitly asks for a portfolio ("how would I express all of these?" or "build me a portfolio").

### Private Market Scan

**Trigger:** public winner is only Partial or Tangential alignment, OR the thesis targets an emerging trend with no public pure-play.

```bash
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
```

Private markets automatically get "Very punishing" on timing forgiveness (5-7 year lockup for seed/A, 2-4 years for late-stage). They win when alignment and edge overcome the lockup penalty. Supplements the public market trade, never replaces it.

### When No Traditional Instrument Exists

Never dead-end. Descend the expression fidelity ladder:

**Level 1: High-beta proxy.** Parent company stock, sector ETF. State alignment level honestly.
**Level 2: Adjacent market.** Royalty platforms, prediction markets, pre-IPO/secondaries, crowdfunding.
**Level 3: Infrastructure play.** Who benefits if the thesis is right?
**Level 4: Non-financial expression.** Merch drops, event tickets, domains, building in the space.
**Level 5: Position for the future.** No trade today. Set monitoring for when a direct instrument appears.

---

## Tools

Live market API scripts. Call during research, scoring, or to validate a final pick.

**Speed: run discovery calls in parallel.** Robinhood + Kalshi + Hyperliquid + Polymarket instrument discovery can run simultaneously. Don't wait for one before starting the next. Batch return calculations for the top 2-3 candidates.

### Content Extraction

```bash
# URL → text. Handles all URLs. YouTube uses yt-dlp internally; other URLs use fetch + HTML strip.
bun run scripts/adapters/transcript/extract.ts "URL"
# Returns: { source, word_count, transcript|text }. On error, falls back with message. >3K words → sub-agent for Phase 1.
```

### Instrument Discovery

```bash
# Robinhood: validate tickers via Yahoo Finance
bun run scripts/adapters/robinhood/instruments.ts "TICKER1,TICKER2"
# Returns: price, market cap, 52-week range, day change

# Hyperliquid: validate against live perp list
bun run scripts/adapters/hyperliquid/instruments.ts "TICKER1,TICKER2"
# Returns: mark price, funding rate, OI, volume, max leverage

# Kalshi: keyword-based discovery (series tickers)
bun run scripts/adapters/kalshi/instruments.ts "keyword phrase"
# Returns: open events sorted by date relevance

# Bankr: thesis-based (sends to Bankr AI agent, 15-125s)
bun run scripts/adapters/bankr/instruments.ts "thesis text"
# Returns: tokens, Polymarket markets, onchain instruments

# Angel: keyword search across Republic, Wefunder, Crunchbase
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
# Returns: active raises matching the thesis

# Polymarket: keyword search across active prediction markets
bun run scripts/adapters/polymarket/instruments.ts "keyword phrase"
# Returns: binary event markets filtered for relevance (keyword must appear in question)
# Gate: fire when Kalshi returns 0 matches, OR thesis is a non-macro binary event
# Skip for: pure stock theses, crypto pair trades, precision macro (Kalshi covers those)
```

### Return Calculations

```bash
# Robinhood: ticker + direction + type
bun run scripts/adapters/robinhood/returns.ts "TICKER" "long|short" "stock|etf|option"
# Returns: entry price, IV-derived target/stop, return %, options chain

# Hyperliquid: asset + direction + leverage
bun run scripts/adapters/hyperliquid/returns.ts "TICKER" "long|short" "5"
# Returns: entry, liquidation price, 30d expected move, funding cost

# Kalshi: event ticker + optional strike + direction
bun run scripts/adapters/kalshi/returns.ts "EVENT-TICKER" "" "yes|no"
# Returns: buy price, implied probability, return if right, contracts per $100

# Bankr: ticker + direction + type (15-125s)
bun run scripts/adapters/bankr/returns.ts "TICKER" "long" "token|polymarket|treasury"
# Returns: price, return profile

# Angel: stage + sector (no live pricing)
bun run scripts/adapters/angel/returns.ts "stage" "sector"
# Returns: stage-based venture return distribution

# Polymarket: slug or conditionId + direction
bun run scripts/adapters/polymarket/returns.ts "SLUG_OR_CID" "yes|no"
# Returns: binary payoff (same math as Kalshi), orderbook depth, implied probability
# Prices are 0-1 (not cents). Volume is USD.
```

For bearish theses on Robinhood: propose inverse ETFs directly (SQQQ, SRS, TBT, etc.).

### Historical Price

```bash
# Fetch closing price on a specific past date (for source_date entry_price)
bun run scripts/adapters/robinhood/historical.ts "TICKER" "YYYY-MM-DD"
# Returns: { ticker, date, open, high, low, close, volume }
# Falls back to nearest prior trading day if date is weekend/holiday
```

Use when `source_date` is in the past and you need the entry_price at that date, not today's price.

---

## Mode Gates

| Gate | Rule |
|------|------|
| Research → Recommend | Every number in the card must trace to a data source. No source → write "not yet sourced", offer to fetch. Never estimate. |
| Recommend → Execute | State what you'll do, wait for explicit yes. "Make this easy" ≠ permission to act. |

---

## Output

Output has two layers: **The Reply** (streamed to the user in chat) and **The Record** (POSTed to the board as structured data). The reply is prose. The structured card lives on the board.

### Part 1: The Reply

Prose, not a card. Write like you're telling a friend the trade.

**Source excerpt first** for sourced calls (Input Validation steps 4-6). One line: the key quote + attribution. For user's own thesis (steps 1-3), skip it. The excerpt grounds derived calls where the routing diverges from the source.

**Ticker and price early.** The reader should know what to buy within the first two sentences.

**The reply must contain** (in whatever order fits this specific thesis): the trade (ticker, price, quantity), what the market is missing, a verifiable edge (a fact, not a computed number), what kills it, and the alt. For options: strike, expiry, breakeven, max loss. For perps: leverage, liquidation, funding. For Kalshi: implied probability, payout. Include only what earns its space.

**Honest precision.** Entry price and share count are exact (from tools). Upside is a range ("could 2-3x"), not a fake target ("+$35.9K (1.4x)"). State verifiable facts ("TLT IV at 10%"), not computed conclusions ("+EV above 28%").

**Tone matching.** Expert inputs (trading jargon, tickers, strike prices) get full technical vocabulary. Casual inputs ("everyone's on Ozempic") get plain language with jargon translated inline. Casual replies end with one plain-language summary: "You're betting $X that [thing]. Right, [outcome]. Wrong, [loss]."

**Derivation chain (sourced calls).** After the prose, include the chain from the Derivation Chain section. Provenance, not a second explanation.

**Board link.** After the chain, show the board teaser (see Part 3).

**Constraints:** Never exceed two paragraphs of reasoning. No section headers, no formatted boxes, no column-aligned tables. Every claim backed by data. Stop when the edge is stated.

### Part 2: Follow-Up Suggestions

End every routing with 2-3 suggested follow-ups. Each should address the most likely reason THIS specific user wouldn't execute THIS specific trade right now: unfamiliar platform, position too large, timing unclear, or thesis not fully believed yet. Make them short enough to tap.

**Disclaimer:** End every routing response with: `Expressions, not advice. Do your own research.`

### Part 3: Post to Board

After the reply and follow-ups, POST the structured record to the belief board. The board renders the full card (price ladder, comparables, derivation chain) from this data. The chat reply doesn't need to contain all of it. Always attempt the POST. If the board is unreachable, note it briefly and move on.

**Step 1: Construct the JSON payload** from routing output.

The payload contains both layers: the **Call** (author's signal, faithfully preserved) and the **Routing** (skill's analysis).

| Layer | Skill output | API field | Notes |
|---|---|---|---|
| Call | Source @handle | `source_handle` | string |
| Call | Source URL | `source_url` | string |
| Call | Source date | `source_date` | ISO date string, when they said it |
| Call | Author's actual thesis | `author_thesis` | their claim in their words, not reframed |
| Call | Author's ticker (if stated) | `author_ticker` | string or null |
| Call | Author's direction (if stated) | `author_direction` | "long", "short", or null |
| Call | Conditions stated | `conditions` | string or null, qualifications they attached |
| Routing | Skill's thesis (reframed) | `thesis` | required |
| Routing | Routed ticker | `ticker` | required |
| Routing | long/short | `direction` | "long" or "short" |
| Routing | Price at source_date | `entry_price` | number |
| Routing | Attribution tier | `call_type` | "direct" or "derived" |
| Routing | "+EV above X%" | `breakeven` | string |
| Routing | "dies if k1, k2" | `kills` | string |
| Routing | Instrument type | `instrument` | "stock", "options", "kalshi", or "perps" |
| Routing | Platform | `platform` | "robinhood", "kalshi", or "hyperliquid" |
| Detail | Verbatim quote | `source_quote` | goes in `trade_data` blob |
| Detail | Source segments | `segments` | goes in `trade_data` blob, `[{quote, speaker, timestamp?}]` |
| Detail | Derivation chain | `derivation` | goes in `trade_data` blob, `{segments, steps, chose_over}` |
| Detail | Take reasoning | `reasoning` | goes in `trade_data` blob |
| Detail | Edge statement | `edge` | goes in `trade_data` blob |
| Detail | Counter-argument | `counter` | goes in `trade_data` blob |
| Detail | Payoff table | `price_ladder` | goes in `trade_data` blob |
| Detail | Alt line | `alternative` | goes in `trade_data` blob |
| Detail | "Source (Date)" | `scan_source` | goes in `trade_data` blob |

**Example payload (derived call):**

```json
{
  "source_handle": "chiefofautism",
  "source_url": "https://x.com/chiefofautism/status/123456",
  "source_date": "2026-02-19",
  "author_thesis": "The AI supply chain has 76 nodes across 13 countries, each one a potential chokepoint",
  "author_ticker": null,
  "author_direction": null,
  "conditions": null,

  "thesis": "AI datacenter optical interconnects are the next bottleneck after chips",
  "ticker": "COHR",
  "caller_id": "anon",
  "direction": "long",
  "entry_price": 232.48,
  "call_type": "derived",
  "breakeven": "+EV above 12%",
  "kills": "fiber optic overcapacity, Broadcom enters transceiver market",
  "instrument": "stock",
  "platform": "robinhood",

  "source_quote": "i mapped the ENTIRE supply chain behind a single ChatGPT query. 76 nodes in 13 countries with 10 layers, from a quartz mine in North Carolina to your chat window",
  "segments": [
    { "quote": "76 nodes in 13 countries with 10 layers, from a quartz mine to your chat window", "speaker": "chiefofautism" }
  ],
  "derivation": {
    "segments": [
      { "quote": "76 nodes in 13 countries with 10 layers, from a quartz mine to your chat window", "speaker": "chiefofautism" }
    ],
    "steps": [
      { "text": "76 nodes means 76 potential chokepoints", "segment": 0 },
      { "text": "ASML owns lithography (100% EUV share) but trades at ATH, fully priced" },
      { "text": "COHR controls ~40% of AI datacenter optical transceivers. the next chokepoint down that isn't priced in" }
    ],
    "chose_over": "ASML (fully priced at ATH), MU (already 6.8x from lows)"
  },
  "reasoning": "AI supply chain concentration creates pricing power at each irreplaceable node. Optical interconnects are the bottleneck after chips.",
  "edge": "COHR at $232 while datacenter transceiver revenue growing 80% YoY. Market sees legacy fiber, missing AI pivot.",
  "counter": "Intel or Broadcom could enter the transceiver market and compress margins",
  "price_ladder": [
    { "price": 197.61, "pnl_pct": -15, "pnl_dollars": -1500, "label": "stop loss, 15% below entry" },
    { "price": 280.00, "pnl_pct": 20, "pnl_dollars": 2000, "label": "reclaim 50-day MA" },
    { "price": 350.00, "pnl_pct": 51, "pnl_dollars": 5100, "label": "retest 52W high" },
    { "price": 420.00, "pnl_pct": 81, "pnl_dollars": 8100, "label": "re-rate as AI infrastructure" }
  ],
  "alternative": "MU $417 long (HBM memory shortage, further from source thesis)",
  "scan_source": "@chiefofautism tweet (Feb 2026)"
}
```

**Step 2: POST to the board:**

```bash
curl -s -X POST "${BELIEF_BOARD_URL:-https://belief-board.fly.dev}/api/takes" \
  -H "Content-Type: application/json" \
  -d '<JSON payload>'
```

`caller_id` is required. Use `"anon"` for anonymous submissions. The API auto-creates a user if it doesn't exist.

**Step 3: On success**, show a 4-line teaser linking to the permalink:

```
---
"76 nodes in 13 countries." · @chiefofautism
COHR long · $232.48 · derived
AI datacenter optical interconnects are the next bottleneck after chips
→ https://belief-board.fly.dev/t/abc123
---
```

Format: `source_quote` (or thesis if no quote) + `source_handle`, then `ticker direction · $entry_price · call_type`, then thesis as subtitle, then permalink URL from the API response.

**Step 4: On failure** (board unreachable, non-2xx response), print one line: `Board unavailable. Skipping post.` and continue normally.

**Bulk mode:** POST each deep-routed take individually, immediately after its card is displayed.

---

## Handle Scan

When Input Validation step 5 triggers (input is an X handle, `x.com` URL, or "scan @handle"):

**0. Check for X_BEARER_TOKEN**

If `X_BEARER_TOKEN` is not set, offer two fallbacks and stop:
```
X API not configured. X_BEARER_TOKEN is not set.

To enable handle scanning:
  1. Go to developer.x.com and create an app (pay-per-use, no monthly fee)
  2. Copy your Bearer Token
  3. Add to .env: X_BEARER_TOKEN=your_token

Cost: ~$0.26 to scan 50 original posts from any handle.

In the meantime, two options:

Option A (Screenshot): Take a screenshot of the tweet (or paste the text).
I'll extract the author handle, text, and date from it and route it directly.

Option B (Browser): I can open x.com/{handle} in Chrome and read the posts
directly (no API cost). Say "open their profile in Chrome" to proceed.
```

If the user chooses Option A: route the screenshot/text as normal. Extract `source_handle` from the author shown in the screenshot. Set `source_url` if visible.

If the user chooses Option B: use the claude-in-chrome MCP tools to navigate to `https://x.com/{handle}`, read the visible posts from the page, filter for directional takes, and proceed from step 4 (Surface to user). This costs nothing but is limited to what's visible on the page.

**1. Cost gate (mandatory, never skip)**

Show before any API call:
```
Fetching @{handle}'s last 50 original posts
Estimated cost: $0.26 (50 × $0.005 + $0.01 lookup)
Proceed? [y/N / or type a number, e.g. "20"]
```
If user says a number, use that as `--max`. If user says no or doesn't reply, abort.

**2. Fetch**

```bash
bun run scripts/adapters/x/user-timeline.ts --handle {handle} --max {N} --skip-confirm
```
(`--skip-confirm` bypasses the script's own stdin prompt. You already confirmed in chat.)

Returns JSON with `tweets[]`. Retweets and replies are excluded at the API level. Do not re-filter.

**3. Filter for directional takes**

Read each tweet. Keep only those with a directional claim (explicit or implied) about markets, companies, sectors, macro, or specific assets. Discard commentary, jokes, personal updates, and anything with no tradeable direction.

**4. Surface to user**

Lead with the directional claim, not the raw tweet. One line per take, source URL underneath.

```
Found {N} directional takes from @{handle} ({date range}):

1. {thesis direction in plain language} ({date})
   {tweet_url}
2. {thesis direction in plain language} ({date})
   {tweet_url}

Route all, or pick? [all / 1,3,5 / skip]
```

Example:
```
Found 5 directional takes from @chamath (Jan 31 - Feb 18):

1. On-premise is the new cloud, enterprise data sovereignty (Feb 12)
   x.com/chamath/status/1889...
2. MSFT worst hyperscaler since ChatGPT launch (Feb 12)
   x.com/chamath/status/1889...
3. Power is the AI bottleneck, f(i) = p * c * a (Feb 17)
   x.com/chamath/status/1892...

Route all, or pick? [all / 1,3,5 / skip]
```

If user says "all" or said "scan @handle" upfront, route all. If they pick a subset, route only those. If none were found: "No directional takes in the last {N} posts from @{handle}."

**5. Route each take**

Run each selected tweet through the standard belief-router flow. On the Call layer, set:
- `source_quote`: the tweet text verbatim
- `source_handle`: @{handle}
- `source_url`: the tweet URL from the adapter output
- `source_date`: tweet's `created_at`

**6. Post to board**

POST each routed call as normal. Board posts will show `source_handle` and link back to the original tweet.

---

## Bulk Mode

When Input Validation step 6 triggers (multiple theses, user wants all routed), run this pipeline instead of the full router N times.

### Phase 1: Extract & Cluster

Pure reasoning. No tool calls. Extract every directional claim using the same criteria as Input Validation.

**For each claim, capture the Call layer first (faithful extraction):**
- `source_quote`: verbatim, 1-2 strongest sentences
- `speaker`: who made this claim (name, handle, role)
- `timestamp`: where in the source (MM:SS for video/audio, paragraph for text)
- `author_thesis`: what they actually claimed, in their words (not reframed)
- `author_ticker`: did they name a specific instrument? (null if not)
- `conditions`: any qualifications they attached (null if none)

**Then add the Routing layer:**
- `thesis`: reframed as a directional claim (may differ from author_thesis)
- `call_type`: direct / derived based on divergence

**Cluster:** Same thesis expressed differently = 1 entry. Keep the strongest quote per attribution. When multiple speakers support the same thesis, capture each as a separate segment with speaker + timestamp.

**Tier into three levels:**
- **Tier 1 (Route):** Specific and tradeable. Gets Phase 2 + Phase 3.
- **Tier 2 (Sweep only):** Directional but needs sharpening. Phase 2 only, show candidates.
- **Tier 3 (Skip):** Too vague to trade. List for completeness, no instrument search.

### Phase 2: Instrument Sweep

Batched tool calls. No web research. **Batch by platform, not by thesis.**

```bash
# One call per platform covers all theses
bun run scripts/adapters/robinhood/instruments.ts "TICK1,TICK2,TICK3,TICK4"
bun run scripts/adapters/kalshi/instruments.ts "theme keywords"
bun run scripts/adapters/hyperliquid/instruments.ts "COIN1,COIN2"
```

Run all platform calls in parallel. Map validated instruments back to theses as candidate lists.

### Phase 3: Deep Route

Full belief-router on Tier 1 theses only (top 3-5). Each deep route is independent; run in parallel. Each gets one thesis + the full routing flow (Research → Scoring → Trade Selection → Output).

### Scan Output

One artifact per source. Two tiers that look deliberately different. The user can tell at a glance what's been analyzed vs what's just a candidate list.

**Quick Hit** (Tier 2 and Tier 1 pre-route): Leads with the author's actual quote and attribution. Shows candidates but does NOT pick a specific instrument. The logic stops at "these would benefit."

```
★ "[source_quote]" · [speaker] [timestamp]
  thesis: [author_thesis or reframed thesis]
  CANDIDATES: [TICK1], [TICK2], [TICK3]
  → Deep Route this
```

**Deep Route Result** (Tier 1 post-route): The full routing output as prose. Includes the take, derivation chain, and board link.

```
★ "MSFT worst-performing hyperscaler since ChatGPT launch, significantly underperformed Nasdaq" · @chamath · Feb 12

MSFT short at $399.60. 250 shares. META up 454%, AMZN and GOOG both beat Nasdaq in the same window. MSFT alone lagged. They committed $13B+ to OpenAI with no visible monetization in current earnings while capex balloons for Azure AI infra. IV at 26% prices MSFT as a stable blue chip. Dies if Azure AI revenue inflects next quarter. Alt: AMZN long (if the thesis is "pick the winning hyperscaler," go long the winner instead of short the loser).

> [1] MSFT worst-performing hyperscaler since ChatGPT launch (@chamath)
> [2] META up 454%, AMZN and GOOG both beat Nasdaq. MSFT alone lagged
> [3] $13B+ committed to OpenAI, investment illiquid, unmonetized, while capex balloons
> chose over: SQQQ (too diluted), AMZN short (wrong direction)

→ https://belief-board.fly.dev/t/21eca4de-0
```

Each deep route looks different because each thesis is different. A 2-step chain for a direct call. A 4-step chain for a derived cultural thesis.

**Tier 3**: One line per skipped thesis with reason.

**Footer**: Count of theses extracted/routed/skipped + source link + disclaimer.

### Bulk Output for Chat

When running bulk mode or handle scans, the full analysis lives on the board. Chat gets a compact summary. Do NOT dump 4 full deep routes into a single chat message.

**During routing:** Post each deep route to the board as it completes. Show one progress line per route:
```
Routing 1/2: MSFT underperformance thesis...
```

**After all routes complete:** Show the summary. Three lines per take, same format as the board post teaser:
```
"MSFT worst hyperscaler since ChatGPT" · @chamath
MSFT short · $399.60 · direct
→ https://belief-board.fly.dev/t/21eca4de-0

"f(i) = p * c * a" · @chamath
CEG long · $294.05 · derived
→ https://belief-board.fly.dev/t/6f1aeb7a-d

2 routed · 3 quick hits · @chamath · Feb 2026
Expressions, not advice. Do your own research.
```

Then list quick hits below the deep routes. The user taps any link to see the full take, card, and chain on the board.

**Single route mode** (one thesis, not bulk) still shows the full prose reply + chain inline. The compact format is only for bulk.

### Scan Rules

1. **Never pick a ticker in a quick hit.** Candidates only. The scan never pretends to have done work it hasn't.
2. **Derivation chain required on deep routes.** Use the Derivation Chain format: segments, steps, chose_over. The chain section defines structure and anti-patterns.
3. **Counter-arguments.** If the source contains opposing views on a thesis, note them.
4. **Mixed signals.** If a thesis has both bullish and bearish elements, capture both and let routing resolve direction.
5. **One scan per source.** The scan is the atomic unit.

---

## Rules

1. **Use "expressions" and "market data"**, never "recommendations" or "advice."
2. **Always show downside.** Payoff table must include "thesis wrong" row with dollar loss. For options, state "max loss: 100% of premium ($100,000)."
3. **Breakeven on every expression.** "you need to be right >X% for +EV."
4. **Platform risk tier on every trade.** [Regulated], [DEX], or [New]. See `references/blindspots.md`.
5. **Flag "priced in"** when consensus agrees with the thesis. Show the asymmetry gap.
6. **Bear theses → short-side instruments.** Inverse ETFs on RH, short perps on HL, NO on Kalshi. Map to instruments that PROFIT when the thesis is correct.
7. **Catalyst-dated theses.** Warn about IV crush on options. Select expiry AFTER the catalyst date.
8. **End every response** with the disclaimer line.
9. **Evidence over logic.** Every claim about an instrument must be backed by data from research. No "this seems expensive," only "this trades at 37.65x P/E vs a 20-year average of 19.08."
10. **No em dashes anywhere in output.** Not in chain steps, not in prose, not in scenario tables, not in board card text. Use periods, commas, semicolons, or colons. One thought per clause. This applies to ALL output the skill produces.
