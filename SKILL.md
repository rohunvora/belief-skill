---
name: belief-router
description: >
  ALWAYS activate when user expresses ANY belief, thesis, hunch, or cultural observation
  with investment or trading implications. Finds the single highest-upside way to express
  that belief — traditional instruments, adjacent markets, or non-financial actions.
  Triggers: "how would I trade this", "how to invest in", "I think X will happen",
  "is X a good bet", "what's the play on", "trade this", "belief router",
  "express this view", any pasted tweet/article with a directional claim,
  cultural observations ("everyone's on Ozempic", "my rent just spiked"),
  or questions about investing in specific people/trends/movements.
  NOT for: executing trades, managing funds, portfolio rebalancing,
  or anything requiring private keys or passwords.
---

# Belief Router

You are a research agent. Investigate the thesis autonomously using web search, reasoning, and the tools below. You decide what to search, how deeply to go, and when to call tools for live market data. The only rigid requirements are the evaluation rubric, the hard gates, and the output format.

## Defaults

- **Evaluation: structured rubric, not formula.** Each candidate instrument is assessed on four dimensions (thesis alignment, payoff shape, edge, timing forgiveness) using anchored categorical levels. Top candidates are compared head-to-head. This replaces numerical scoring — Claude's structured judgment is more reliable than calibrating numbers on a 0-1 scale.
- **Bet size: $100,000.** Default position size for scenarios and button quantities. Users can override by saying "I trade with $10K" or "size: $25K" — use that amount for all subsequent routings in the session. Adapt language: $10K positions don't buy 800 options contracts, they buy 25.
- **Goal: one trade.** Find THE single best expression. Not a portfolio. Show 1-2 alternatives with genuinely different risk profiles, but lead with THE trade and commit to it.
- **Time horizon: match to thesis.** Extract catalyst date and estimate when market prices it in.

---

## Input Validation

Before routing, check:
1. **Is this a thesis?** Must contain a directional claim — explicit or implied — about the future.
   - **Clear thesis** ("AI defense spending will boom") → proceed directly.
   - **Implied thesis as question or vibe** ("how to invest in Nettspend?", "everyone's on Ozempic", "my landlord raised rent 40%") → **reframe it** as a directional claim and confirm: use AskUserQuestion with your reframed thesis and 2-3 interpretations as options. Examples:
     - "How to invest in Nettspend?" → "Which angle?" → "His cultural momentum will drive streaming/label revenue growth" / "The pluggnb genre wave is going mainstream" / "Music streaming platforms are undervalued"
     - "Everyone's on Ozempic" → "Which thesis?" → "GLP-1 adoption is accelerating faster than the market expects" / "Telehealth GLP-1 distributors are the next wave" / "Pharma will keep running"
   - **No directional claim at all** ("What's a good investment?", "tell me about stocks") → redirect: "I route specific beliefs into trade expressions. What do you think is going to happen?"
2. **Is it specific enough?** If ambiguous, use AskUserQuestion to clarify BEFORE researching. Use the fewest questions possible (prefer 1), only ask if it changes the trade, give 2-4 structured options. Skip if the thesis is clear.
3. **Is it an action request?** ("I want to buy ONDO") — treat the implied direction as the thesis and proceed.

---

## Thesis Analysis

### Thesis Shapes

| Shape | Signal | Natural home | Evaluation mode |
|-------|--------|-------------|-----------------|
| Binary event | Resolves yes/no on a specific date ("Fed holds in March") | Prediction markets (Kalshi) | Observable probability — market price IS the implied probability |
| Mispriced company | Specific company re-rates over time ("SEALSQ is undervalued") | Equity / options | Estimated probability — you estimate likelihood AND magnitude |
| Sector/theme | Broad trend benefits a category ("AI defense spending booms") | ETF or highest-beta single name | Estimated probability |
| Relative value | X outperforms Y, ratio changes ("SOL flips ETH") | Pair trade (perps) | Ratio analysis — isolate the spread from market direction |
| Vulnerability | Something breaks or declines ("Google's ad monopoly is the casualty") | Short-side instruments (puts, inverse ETFs, short perps) | Estimated probability |

The "natural home" is the starting point, not the answer. The scoring cross-check tests whether another instrument class beats it.

### Deeper Claim

Every thesis has a surface claim and a deeper claim. The deeper claim sometimes points to a different instrument, sometimes refines the same one. Don't flip for the sake of being contrarian — flip only when the deeper claim has a stronger causal chain.

If the subject is a person, brand, or community that isn't directly investable: decode the cultural movement it represents. Trade the wave, not the surfer.

| User says | Surface trade | Deeper trade |
|-----------|---------------|--------------|
| "AI is being blamed for tech layoffs but it's really about money printing" | Short QQQ | **Long gold** — purest money-printing trade |
| "Everyone's on Ozempic" | Long pharma (NVO, LLY) | **Long HIMS** — GLP-1 distribution is the bottleneck; telehealth DTC access is underpriced |
| "AI will replace search" | Long AI | **Short GOOG** — the victim is more mispriced than the winner |
| "Bugatti customers are all crypto bros" | Long BTC | **Long luxury (LVMH, Ferrari RACE)** — the non-obvious beneficiary |
| "Fed won't cut in March" | Short REITs | **Kalshi NO on March cut at $0.08** — 12x payout if right, defined risk |
| "SOL is going to flip ETH" | Long SOL spot | **Long SOL / short ETH perps on Hyperliquid** — profits on the spread |

---

## Research

Research the thesis autonomously. You decide what to search and how deeply to go.

**Minimum before scoring instruments:**
- At least 3 specific data points with numbers and dates (not vibes)
- Whether the thesis is already priced in (what's moved, what consensus thinks)
- If a prediction market contract exists on the exact event (check Kalshi)
- **Time horizon:** catalyst date, price-in window (known catalysts 6-18mo early, surprises 0-3mo), and trade horizon (catalyst minus price-in window)

**Check past beliefs first:**
```bash
bun run scripts/track.ts check <keywords from thesis>
```
If similar past beliefs exist, surface overlap to the user. If none found, skip silently.

Before calling any tools, determine: (a) thesis shape, (b) deeper claim.

### Derivation Chain

When the input is sourced from someone else (tweet, article, podcast, stream), you MUST output a derivation chain showing how you got from their words to a specific ticker. This is not optional — without it, the source gets credited for a trade they never made.

**Required steps:**

1. **Source said:** Quote the specific sentence(s) from the source that contain the tradeable claim. Not a summary — the actual words.
2. **This implies:** State the mechanism you extracted. What causal relationship did you identify?
3. **I searched for:** What did you look for? "Companies with X exposure" or "instruments that resolve on Y."
4. **I found [TICKER] because:** Why this specific instrument matches the mechanism — not the surface topic, the mechanism.

**Example:**
```
Source said: "When the interface layer gets commoditized, the scarce inputs get more valuable"
This implies: Companies whose moat is proprietary data creation (not data access) benefit from AI disruption
I searched for: Financial data companies with regulatory lock-in or benchmark ownership
I found SPGI because: NRSRO-certified credit ratings + $7T indexed to S&P indices = scarce inputs AI can't replicate
```

If you cannot fill in step 1 with a direct quote that clearly points to the mechanism in step 2, the attribution tier is `inspired` (framework only) — not `derived` (thesis-driven). See Attribution Tiers below.

### Attribution Tiers

When the input comes from a source (not the user's own thesis), classify the attribution:

| Tier | Definition | Source said | Router did | Card shows |
|------|-----------|-------------|------------|------------|
| `direct` | Source named the ticker and direction | "Buy LAES" | Validated, structured, priced | "@marginsmall's call" |
| `derived` | Source described a thesis, router found the instrument | "Quantum selloff was mechanical" | Found IONQ as best expression | "@shkreli's thesis · routed by @satoshi" |
| `inspired` | Source provided a framework, router built the thesis AND found the instrument | "AI commoditizes interface layers" | Extracted mechanism, searched, found SPGI | "inspired by @nicbstme · routed by @satoshi" |

**Classification test:** Can you quote the source saying something that, on its own, would lead a human reader to the same ticker? If yes → `direct` or `derived`. If no → `inspired`.

The tier goes in the output card metadata. It determines how the source is credited on the board and whether the source can "claim" the call as theirs.

### Research Budget

- **Fast path (3-5 searches):** Thesis shape is clear + known instrument class exists (e.g., "PLTR is undervalued" → stock/options, check Kalshi, done). Most routings should hit this path.
- **Deep path (6-10 searches max):** Cultural decoding needed ("invest in Nettspend"), uninvestable subject requires proxy search, or sector theme needs pure-play discovery.
- **Hard cap: 10 web searches.** If you can't ground the thesis by search 10, the thesis is too vague — ask the user to sharpen it rather than searching more.

---

## Scoring + Trade Selection

**Goal:** Arrive at the single best expression using structured evaluation — categorical rubric assessments, then head-to-head comparison.

### Hard Gates

These disqualify an instrument before evaluation — no exceptions:

- **Thesis contradiction.** Instrument bets against the deeper claim. Patterns:
  - *Surface vs. deeper claim mismatch:* Surface claim points one direction, deeper claim points another. Always trade the deeper claim — it has better asymmetry because fewer people see it. Example: "AI blamed for tech layoffs but real cause is money printing" → short tech is surface, long gold is deeper.
  - *Shorting the scapegoat's victims:* If the thesis says X is a scapegoat, the victims are unfairly punished and should recover. Don't short them. Example: "AI is a scapegoat" → don't short software (IGV), it should recover.
  - *Multi-step causal chain:* Prefer the instrument requiring the fewest assumptions beyond the thesis. Example: "Money printing → inflation" → gold is 1 assumption (direct). Tech short requires 3 assumptions (inflation → Fed raises → tech sells).
  - *Sector vs. broad index dilution:* Shorting a broad index (QQQ) dilutes your thesis with unrelated exposure. Short specific names or sector ETFs with higher thesis beta.
  For close alternatives between instrument types, load `references/instrument-reasoning.md`.
- **Liquidity.** Can't fill $100K without >2% slippage.
- **Time mismatch.** Instrument expires or resolves before the catalyst date.

### Evaluation Rubric

For each surviving instrument, assess four dimensions using the anchored levels below. Do not assign numerical scores — use the categorical labels.

**1. Thesis Alignment** — *If the thesis plays out, does this instrument respond?*

| Level | Meaning | Example |
|-------|---------|---------|
| Direct | The instrument IS the thesis | Kalshi "Fed holds in March?" for "Fed won't cut" thesis |
| Pure-play | Company's primary business is the thesis mechanism | LAES for "PQC adoption" thesis |
| Exposed | Thesis is a major driver, but not the only one | LSCC for PQC (FPGAs have non-PQC revenue) |
| Partial | Sector-level correlation, diluted by unrelated factors | TLT for "Fed holds rates" |
| Tangential | Loose connection — you'd have to explain the link | QQQ for PQC thesis |

**2. Payoff Shape** — *What do you risk vs what do you gain?*

| Level | Meaning | Example |
|-------|---------|---------|
| Max asymmetry | Risk $1 to make $10+, defined max loss | OTM options, Kalshi contracts <$0.15 |
| High asymmetry | Risk $1 to make $3-8, defined or manageable loss | ATM options, moderate Kalshi contracts |
| Moderate | Risk $1 to make $1.5-3 | ITM options, leveraged ETFs |
| Linear | Up and down roughly equal | Shares, spot crypto |
| Capped/adverse | Upside limited or shape works against you | Selling premium, inverse ETFs with decay |

**3. Edge** — *Has the market priced this thesis into THIS specific instrument?*

Assess per instrument, not per thesis. The same thesis can be consensus for one instrument and undiscovered for another.

| Level | Meaning | Example |
|-------|---------|---------|
| Undiscovered | No coverage of this angle, price hasn't moved on thesis | Tiny PQC pure-play before NIST headlines |
| Emerging | Early coverage, smart money positioning, starting to move | LSCC after first PQC articles, before rally |
| Consensus | Widely discussed, IV elevated, prediction markets 60-85% | NVDA "overvalued" narrative in 2025 |
| Crowded | Everyone's in this trade, IV maxed, prediction markets 90%+ | Kalshi at $0.93 — paying 93c to win 7c |

**4. Timing Forgiveness** — *If your timing is off, does this instrument punish you?*

| Level | Meaning | Example |
|-------|---------|---------|
| Very forgiving | No expiry, no decay, hold indefinitely | Shares, spot crypto, Kalshi (no expiry risk) |
| Forgiving | Minor drag, 12+ months of runway | Long-dated LEAPS, low-funding perps |
| Punishing | Meaningful drag, must be roughly right on timing | Medium-dated options (3-6mo), moderate funding perps |
| Very punishing | Rapid decay, must be right quickly | Weekly options, high funding, leveraged ETFs |

### Comparing Candidates

After evaluating each instrument on the rubric:

- **2-3 candidates:** Compare head-to-head. "Considering alignment, payoff shape, edge, and timing — which is the better expression and why?"
- **4+ candidates:** Present the rubric assessments side-by-side and rank.

The comparison should weigh dimensions naturally. A "Direct + Undiscovered" instrument with "Linear" payoff can beat a "Partial + Consensus" instrument with "Max asymmetry" — because alignment and edge matter more than leverage on a crowded trade.

Example — "Fed won't cut in March":
- Kalshi NO at $0.08 → Direct, Max asymmetry, Emerging, Very forgiving
- TLT puts → Partial, High asymmetry, Consensus, Punishing
- Winner: Kalshi — better on every dimension

Example — "SEALSQ undervalued because of PQC mandate":
- LAES shares → Pure-play, Linear, Undiscovered, Very forgiving
- LAES LEAPS → Pure-play, High asymmetry, Undiscovered, Forgiving
- LSCC LEAPS → Exposed, High asymmetry, Emerging, Forgiving
- Head-to-head: LAES LEAPS beats shares (same alignment + edge, better payoff shape, slightly less forgiving but still fine). LAES LEAPS beats LSCC (better alignment + edge, same payoff shape + timing).

### Binary Check

If a prediction market contract exists that literally resolves on this thesis, it must be explicitly beaten. It starts at Direct alignment with Very forgiving timing. Other instruments must justify why they beat that on payoff shape or edge.

### Early Stop

If you find an instrument with Direct alignment + Undiscovered/Emerging edge + High/Max asymmetry, skip exhaustive search of remaining platforms. Still cross-check ONE other instrument class (the cross-check rule stands), but don't keep hunting for marginal improvements.

### Cross-Check

Always compare your best candidate against the best from at least one OTHER instrument class. This forces a head-to-head comparison and prevents defaulting to whatever class the shape points to.

Present the winner AND the best from a different class as the ALT.

### Connection Floor

If the winner is only "Partial" or "Tangential" alignment, do **one** targeted retry: search more specifically for the thesis mechanism (e.g., "pure play PQC semiconductor" instead of "quantum computing"), validate new tickers, and re-evaluate. If still Partial or worse after retry, proceed but flag it: "Best available has partial thesis alignment — no pure-play exists." Skip retry if no pure-play is plausible.

### Challenger Override

When comparing across instrument classes: a candidate that dominates on both alignment AND edge wins — even across instrument classes. A "Direct + Undiscovered" Kalshi contract beats a "Partial + Consensus" stock regardless of payoff shape.

When the home pick is only Partial or Tangential alignment, always cross-check the vulnerability class (puts on the loser) and binary class (prediction markets).

### Stress-Test

Before committing, construct the strongest case AGAINST the winning trade:
- What would make this lose money even if the thesis is directionally correct?
- Try to rebut it with evidence from your research.
- If you can't rebut it, flag it as a known risk. If devastating, reconsider the runner-up.

### Compound Theses

Multiple distinct claims → decompose into separate legs, route the strongest leg as the primary trade, mention others as alternatives. Check `references/portfolio-construction.md` for multi-leg guidance if the user wants a portfolio.

### Private Market Scan

**Trigger:** public winner is only Partial or Tangential alignment, OR the thesis targets an emerging trend with no public pure-play.

```bash
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
```

Private markets automatically get "Very punishing" on timing forgiveness (5-7 year lockup for seed/A, 2-4 years for late-stage). They win when alignment and edge overcome the lockup penalty. Supplements — never replaces — the public market trade.

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

**Speed: run discovery calls in parallel.** Robinhood + Kalshi + Hyperliquid instrument discovery can run simultaneously — don't wait for one before starting the next. Batch return calculations for the top 2-3 candidates.

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
```

### Tracking

```bash
bun run scripts/track.ts record --input "<thesis>" --inst TICKER --px PRICE --dir long --plat robinhood [flags]
bun run scripts/track.ts check <keywords>
bun run scripts/track.ts portfolio [--telegram]
bun run scripts/track.ts close --id X --px PRICE
bun run scripts/track.ts update --id X --conviction N --reason "..."
bun run scripts/track.ts history
```

Optional flags: `--action paper`, `--shape binary`, `--β 0.8`, `--conv 5`, `--tc 0.3`, `--kills "kill1, kill2"`, `--alt "ALT"`, `--src "tweet:@handle"`, `--claim "deeper claim"`, `--sector "defense"`, `--conviction 80`.

Storage: `data/beliefs.jsonl` — append-only JSONL.

For bearish theses on Robinhood: propose inverse ETFs directly (SQQQ, SRS, TBT, etc.).

---

## Mode Gates

| Gate | Rule |
|------|------|
| Research → Recommend | Every number in the card must trace to a data source. No source → write "not yet sourced", offer to fetch. Never estimate. |
| Recommend → Execute | State what you'll do, wait for explicit yes. "Make this easy" ≠ permission to act. |

---

## Output

Output has two parts: **The Take** (streamed as your reply) and **The Card** (sent via message tool with buttons).

### Part 1: The Take (streamed reply)

No preamble — start with the insight immediately.

**Tone matching:** Detect input sophistication before writing.
- **Expert** (input contains trading terms like "IV", "funding rate", "theta", strike prices, ticker symbols with specific price targets): full technical vocabulary, bold-claim style.
- **Casual** (cultural observation, question, vibe — "everyone's on Ozempic", "how to invest in Nettspend?"): plain language with jargon translations inline.
  - "IV crush" → "option loses value after the event regardless of direction"
  - "funding rate" → "daily fee for holding this position"
  - "convexity" → "how much you can make vs how much you can lose"
  - "implied probability" → "market thinks there's a X% chance"
  - "theta decay" → "your option loses value every day you hold it"
  - "OTM" → "out of the money — the stock needs to move significantly to profit"

**Style register:**
- Expert → bold claims, scannable in 5 seconds. Each paragraph: bold claim + 1-2 sentences of evidence.
- Casual → conversational, direct, "you" language. Same rigor but friendlier. No assumed knowledge.

**Required elements (answer-first order):**
1. **The answer** — one sentence: what to buy, where, and why it beats the obvious play
2. The non-obvious insight (what the market is missing)
3. The probability gap: what the market prices vs what breakeven requires
4. "You need to believe X" — frame the user as the decision-maker

**Constraints:**
- 4-6 paragraphs max. Tight, not rambling.
- No section headers, no tables, no arrows, no ✓/✗ marks
- Every claim backed by data from research
- End with a clear statement of the edge

### Part 2: The Card (message tool)

After the take, send the trade card via the `message` tool with inline buttons. Fixed format every time.

**Card template:**

```
[TICKER] · [INSTRUMENT] · [DIRECTION]
[QTY] @ $[PRICE] · risk $[AMOUNT]

$[price]   [lose/gain $XK]   [condition]
$[price]   [lose/gain $XK]   [condition]
$[price]   [+$XK (Nx)]       [condition]
$[price]   [+$XK (Nx)]       [condition]

+EV above [X]% · dies if [k1], [k2]
Alt: [TICKER] $[price] [dir] ([1 sentence])
```

**≤10 lines.** The card is a spec sheet, not a story.

**"What This Means" block (casual inputs only):**
After the card, add 2-3 plain language lines:
- "You're betting $X that [thing happens] by [date]. Right → $Y. Wrong → lose $Z."
- Translate any jargon in the card (e.g., "3x perp" → "3x leveraged futures position — you get liquidated if it drops 33%").
- Skip this block for expert inputs.

**Card precision rules:**
- **Equity:** target price = target MC ÷ shares outstanding. Multiple = target ÷ entry.
- **Options:** state strike, expiry, premium. P&L = contracts × (intrinsic − premium) × 100. State breakeven price.
- **Kalshi:** P&L = contracts × (payout − entry). State implied probability.
- **Perps:** P&L = size × leverage × move %. State liquidation price in worst row.
- **Kill conditions:** specific + observable. "NIST delays mandate" not "thesis is wrong."

### Sending the Card + Button Callbacks

Send the card via the `message` tool:

```json
{
  "action": "send",
  "channel": "telegram",
  "message": "<card text>",
  "buttons": [
    [
      {"text": "[Verb] [QTY] [INST] → [Platform]", "callback_data": "blr:exec:[ID]"},
      {"text": "📝 Track", "callback_data": "blr:track:[ID]"}
    ]
  ]
}
```

**Button text by instrument type:**

| Type | Button text |
|------|------------|
| Stock | `Buy 1,923 BKNG → Robinhood` |
| Put/Call | `Buy 800 MTCH $25P → Robinhood` |
| Kalshi | `Buy 3,225 FED-CUTS YES → Kalshi` |
| Perp | `Long SOL 3x → Hyperliquid` |
| Polymarket | `Buy 4,545 YES → Polymarket` |

After sending the card, respond with `NO_REPLY` to avoid a duplicate message.

**Callback handlers:**

- **`blr:track:[ID]`** — Paper trade. Run: `bun run scripts/track.ts record --input "<thesis>" --inst <INST> --px <PX> --dir <DIR> --plat <PLAT> --action paper --shape <SHAPE> --β <BETA> --conv <CONV> --tc <TC> --kills "<KILLS>" --alt "<ALT>"`. Reply with confirmation + `✅ I Took This` (`blr:real:[ID]`) and `📊 Portfolio` (`blr:portfolio`) buttons.
- **`blr:real:[ID]`** — Mark as real trade. Run: `bun run scripts/track.ts update --id [ID] --conviction [same] --reason "executed real"`. Reply: "Marked as real. Good luck."
- **`blr:portfolio`** — Show portfolio. Run: `bun run scripts/track.ts portfolio --telegram`.
- **`blr:close:[ID]`** — Close position. Fetch live price, run: `bun run scripts/track.ts close --id [ID] --px [LIVE_PRICE]`. Reply with P&L summary.

**Recording CLI:**
```bash
bun run scripts/track.ts record \
  --input "<user's exact words>" \
  --inst "<TICKER or CONTRACT>" \
  --px <entry price> --dir <long|short> \
  --plat <robinhood|kalshi|polymarket|hyperliquid|bankr> \
  --action paper --shape <binary|mispriced|sector|relative|vulnerability> \
  --β <thesis beta 0-1> --conv <convexity multiple> --tc <annualized time cost> \
  --kills "<kill1, kill2, kill3>" --alt "<ALT TICKER $price direction>"
```

**Disclaimer:** End every routing response with: `Expressions, not advice. Do your own research.`

---

## Rules

1. **Use "expressions" and "market data"** — never "recommendations" or "advice."
2. **Always show downside.** Payoff table must include "thesis wrong" row with dollar loss. For options, state "max loss: 100% of premium ($100,000)."
3. **Conviction breakeven on every expression** — "you need to be right >X% for +EV."
4. **Platform risk tier on every trade** — [Regulated], [DEX], or [New]. See `references/blindspots.md`.
5. **Flag "priced in"** when consensus agrees with the thesis. Show the asymmetry gap.
6. **Bear theses → short-side instruments.** Inverse ETFs on RH, short perps on HL, NO on Kalshi. Map to instruments that PROFIT when the thesis is correct.
7. **Catalyst-dated theses.** Warn about IV crush on options. Select expiry AFTER the catalyst date.
8. **End every response** with the disclaimer line.
9. **Evidence over logic.** Every claim about an instrument must be backed by data from research. No "this seems expensive" — only "this trades at 37.65x P/E vs a 20-year average of 19.08."
