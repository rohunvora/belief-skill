# Real Routings

Actual routing sessions run through the belief-router skill. Source material for replacing overfit examples in SKILL.md.

---

## 1. Nettspend — cultural thesis, uninvestable subject

**Input:** "how do i long nettspend?"
**Date:** 2026-02-16
**Shape:** Cultural / uninvestable person
**Source:** User's own thesis (no external source)

**What it routed to:** Concert tickets + merch (Level 4 non-financial expression). Alt: UMGNF $23.80 (tangential music industry proxy).

**The logic:**
- Recognized Nettspend as a person/artist, not a ticker
- 8 web searches to build real context (label, streaming stats, brand deals)
- Tried all adapter paths: Kalshi (0), Bankr (0), Robinhood (UMG tangential)
- Correctly concluded no traditional instrument has good thesis alignment
- Routed to non-financial expression (instrument IS the thesis)

**Chain:** (no formal chain — pre-chain-format session, but the reasoning was clean)
1. Nettspend is a rising pluggnb artist, not publicly traded
2. No direct instrument exists (Kalshi 0, Bankr 0)
3. UMG is a parent-level proxy but thesis alignment is tangential
4. Concert tickets + limited merch are the highest thesis-beta instruments available

**Output snippet:**
```
NETTSPEND · CONCERT TICKETS + MERCH · LONG

4-8 GA tickets @ ~$50 avg · risk $400
Limited vinyl/merch x 3-5 items · risk $200

Album flops      [-$0]      attend shows, keep merch
Modest hit       [+$200]    2x on select resale
Breakout         [+$1-2K]   3-5x tickets, 5x merch
Mainstream       [+$3-5K]   sold-out premium + collector value

+EV if album pushes him past 3M monthly listeners
Dies if: album delays, label drops support, genre stays niche
Alt: UMGNF $23.80 long (music industry proxy, not Nettspend-specific)
```

**What worked:** Correctly descended the expression fidelity ladder (Level 1-4) instead of forcing a stock pick. Kill conditions were real. Alt was honest about being tangential.

**What didn't:** Pre-prose-format output. The scenario table format has since been replaced.

**Usable as example for:** Expression fidelity ladder, non-financial routing, Input Validation (cultural subject)

---

## 2. US Military AI — sector theme, user's own thesis

**Input:** "i think that at some point the american military will become the biggest buyer of ai/compute/hardware, but i don't know which one or where the spend will specifically go, but i just think that the entire american ai buildout is truly the underpinnings of the new cold war (the ai race between america and china) and i want to bet on america..."
**Date:** 2026-02-16
**Shape:** Sector/theme
**Source:** User's own thesis (no external source)

**What it routed to:** Initially PLTR shares $131.41 (structural thesis, no catalyst → shares over options). Re-routed to xyz:PLTR-PERP 3x long on Hyperliquid after discovering negative funding (-26% annualized = longs get paid).

**The logic:**
- Identified PLTR as best pure-play military AI (not LMT/RTX old defense)
- Research agent honest correction: military is NOT biggest AI buyer today ($13.4B vs $50-80B hyperscalers)
- DOGE analysis: PLTR is the replacement, not the victim (unlike BAH)
- Chose shares over options (structural thesis, no catalyst date)
- After HL fix: negative funding discovery was a genuine edge insight

**Chain:**
1. User believes US military will be the biggest AI buyer
2. Military AI spending is $13.4B today vs $50-80B from hyperscalers (not there yet)
3. PLTR won $10B Army contract Aug 2025, Maven hit $1B. They're the government AI software layer.
4. Market classifies PLTR as a tech stock, but it's a defense contractor with software margins
5. On HL, PLTR-PERP has -26% annualized funding. Longs get paid to hold.

**Output snippet (re-routed):**
```
xyz:PLTR-PERP · 3x LONG · HYPERLIQUID
$10K margin · $129.35 · liq $86.22

$86      -$10,000 (-100%)   liquidated
$129     +$645/mo (+6.5%)   flat — funding income only
$175     +$12,500 (+125%)   Wall Street PT + 3mo funding
$210     +$20,600 (+206%)   re-tests ATH + 3mo funding

Alt: PLTR shares $131.41 long Robinhood (no leverage, no liq risk, [Regulated])
```

**What worked:** Honest research correction (military isn't biggest buyer yet). Found a genuine edge (negative funding). Correctly picked shares over options for structural thesis. Bug discovery led to adapter fix.

**What didn't:** Initial routing missed HL entirely (adapter bug). Pre-prose-format output.

**Usable as example for:** Sector/theme routing, perp leverage guidelines, cross-platform comparison, honest research corrections

---

## 3. China Maxing YouTube — bulk scan, 4 theses

**Input:** YouTube video URL (4,267 words, "China Maxing" thesis)
**Date:** 2026-02-18
**Shape:** Bulk scan (4 sector/theme theses)
**Source:** YouTube video transcript

**What it routed to:**
1. AI = National Security → PLTR long @ $135.38
2. Chinese AI Commoditizes → CEG long @ $294.05
3. Bits to Atoms → CAT long @ $751.97
4. US-China Cold War: Critical Minerals → MP long @ $57.94

**Notes:** All 4 followed the same output pattern. All equities, all long, all with the same formatted card structure. This is the session that exposed the templating problem.

**What worked:** Thesis extraction was correct. MP was flagged as highest conviction. CAT was honestly flagged as "most consensus thesis, edge is thin."

**What didn't:** Output was repetitive across all 4. Every card looked identical structurally. All routed to equities (no Kalshi, no perps, no pair trades despite relative value opportunities). The bulk format didn't differentiate between theses that deserved different treatment.

**Usable as example for:** Bulk mode (what NOT to do with uniform formatting), honest conviction flagging, thesis extraction from long-form content

---

## 4. @chiefofautism supply chain map — cultural observation → infrastructure

**Input:** Tweet: "i mapped the ENTIRE supply chain behind a single ChatGPT query — 76 nodes in 13 countries with 10 layers, from a quartz mine in North Carolina to your chat window"
**Date:** 2026-02-19
**Shape:** Cultural observation → sector/infrastructure
**Source:** @chiefofautism tweet

**What it routed to:** COHR (Coherent) long @ $232.48. Alt: MU $417 (HBM memory shortage).

**The logic:**
- Tweet is a cultural observation, not a trade thesis
- Reframed: 76 nodes = 76 potential chokepoints, companies owning irreplaceable nodes have pricing power
- Mapped concentration at each layer: ASML (100% EUV), TSMC (~90% leading edge), SK Hynix+Samsung (~95% HBM), NVIDIA (~80% training), COHR (~40% AI datacenter transceivers)
- ASML is the obvious answer but fully priced at ATH
- COHR is the next chokepoint down that isn't fully priced

**Chain:**
```json
{
  "segments": [{"quote": "76 nodes in 13 countries with 10 layers, from a quartz mine to your chat window", "speaker": "chiefofautism"}],
  "steps": [
    {"text": "HBM is completely sold out with shortages extending beyond 2026", "segment": null},
    {"text": "the further down the physical stack you go, the harder to substitute. ASML has 100% share at the lithography layer. Coherent owns the optical interconnect bottleneck", "segment": null}
  ],
  "chose_over": "ASML (fully priced at ATH), NVDA (most visible node, most competitive layer), MU (valid but already 6.8x from lows)"
}
```

**What worked:** The chokepoint analysis was genuine reasoning (not templated). Correctly dismissed ASML as fully priced despite being the "right" answer. Concentration map at each layer was useful.

**What didn't:** "hard to read/digest." The chokepoint table was interesting but the overall output was too long for a tweet-sourced input. Asked a clarification question ("which angle?") when it should have just picked.

**Usable as example for:** Cultural observation → derived routing, vulnerability/infrastructure analysis, when NOT to ask clarifying questions

---

## 5. @marginsmall "duration mismatch" — macro vulnerability, multi-step conversation

**Input:** Tweet: "market all in on duration mismatch"
**Date:** 2026-02-19
**Shape:** Vulnerability/macro
**Source:** @marginsmall tweet

**What it routed to:** IVOL (interest rate volatility ETF) long @ $18.99. Then expanded to TLT strangle, SOL 5x short on HL, and LAES shares across follow-up questions.

**The logic (initial routing):**
- "Duration mismatch" = entities holding long duration assets funded by short duration liabilities
- "Market all in" = crowding claim, not a rate direction call
- Verified crowding: Bloomberg Feb 5, hedge funds in leveraged Treasury spread trades showing "signs of strain"
- Key insight: crowding implies volatility, not direction. Unwind can go either way.
- IVOL holds OTC interest rate options that gain from yield curve moves in ANY direction
- Cross-check: TBT only pays if rates go UP (directional, wrong thesis). KRE puts are SVB replay, already priced since March 2023.

**Chain:**
```json
{
  "segments": [{"quote": "market all in on duration mismatch", "speaker": "marginsmall"}],
  "steps": [
    {"text": "market all in on duration mismatch", "segment": 0},
    {"text": "hedge funds running leveraged Treasury spread trades showing signs of strain and early deleveraging (Bloomberg, Feb 5)"},
    {"text": "the risk from crowded positioning isn't directional. it's volatility. when everyone unwinds the same trade, the curve whips regardless of where rates settle"}
  ],
  "chose_over": "TBT (directional, decays daily), KRE puts (SVB replay, already priced since 2023)"
}
```

**The follow-up conversation was the richest part:**
- User asked "leverage for more gains?" → TLT strangle (IV at 10%, historically cheap)
- User asked "on Robinhood?" → yes, Level 2 options, step-by-step
- User asked "on Hyperliquid?" → no TradFi instruments, but SOL 5x short as liquidity-crunch play
- User asked "prediction markets?" → worse for this thesis (no "volatility spikes" contract exists)
- User asked "explain how you landed on volatility?" → full reasoning trace, 5 steps
- User asked "pull his other tweets, deep route them" → worldview synthesis across 7 tweets, led to LAES as highest-ROI pick

**What worked:** The thesis interpretation (crowding → volatility, not direction) was the best single insight across all sessions. Cross-check was real (TBT, KRE, Kalshi all explicitly beaten). Each follow-up explored a different platform naturally. The worldview synthesis across 7 tweets was genuinely useful.

**What didn't:** Initial output still included the formatted card (price ladder with arbitrary targets). Output was long before the prose rewrite.

**Usable as example for:** Vulnerability/macro routing, volatility thesis, cross-platform comparison, multi-step conversation flow, worldview synthesis from handle scan, Deeper Claim (crowding → volatility is a real "obvious play isn't the best" case)

---

## 6. @chamath scan — bulk mode, 5 theses

**Input:** x.com/chamath (Handle Scan, 50 posts)
**Date:** 2026-02-19
**Shape:** Bulk scan (3 deep routes + 2 quick hits)
**Source:** @chamath tweets, Jan 31 - Feb 18

**What it routed to:**
1. "On-premise is the new cloud" → DELL long @ $116.78 (derived)
2. "MSFT worst-performing hyperscaler since ChatGPT" → MSFT short @ $399.60 (direct)
3. "f(i) = p x c x a" → CEG long @ $294.05 (derived)
4. Critical minerals → Quick hit: MP, SGML, SMR, UUUU candidates
5. SaaS implosion → Quick hit: IGV puts, PSJ puts candidates

**Chain examples from this session:**

DELL (derived):
```
> [1] "on-premise is the new cloud" — enterprises won't run proprietary data through open LLMs (chamath, Feb 12)
> [2] confidentiality concern is the forcing function — legal/financial data can't go to open LLMs (chamath, Feb 12)
> [3] DELL has $18.4B AI server backlog, $12.3B in new orders in one quarter, guided FY26 AI revenue to $25B
> [4] market prices DELL at $116 — 30% below highs — as a PC company while the server business hits records
> chose over: HPE (lower margin), SMCI (supply chain history)
```

MSFT short (direct):
```
> [1] "MSFT worst-performing hyperscaler since ChatGPT launch, significantly underperformed Nasdaq" (chamath, Feb 12)
> [2] META up 454%, AMZN and GOOG both beat Nasdaq in same period — MSFT alone lagged
> [3] MSFT committed $13B+ to OpenAI; investment is illiquid, unmonetized in current earnings, while capex balloons for Azure AI infra
> [4] IV at 26% prices MSFT as a stable blue chip — market isn't discounting the OpenAI overhang
> chose over: AMZN short (wrong direction — AWS is the winner), SQQQ (too diluted)
```

CEG (derived):
```
> [1] "f(i) = p x c x a — negative any factor = zero intelligence" (chamath, Feb 17)
> [2] power is the multiplicative constraint — every AI cluster needs 24/7 baseload, not intermittent renewables
> [3] nuclear is the only carbon-free baseload that scales: CEG signed 20-year PPA with Meta (June 2025), restarted TMI for Microsoft
> [4] CEG at $294 — 29% below $412 high — despite locked multi-decade revenue from the two largest AI spenders
> chose over: CCJ (uranium, one step removed from PPA revenue), VST (nat gas, no carbon-free advantage)
```

**What worked:** Tier system (deep route vs quick hit) was correct. MSFT short was a direct call properly classified. Quick hits honestly said "don't pick a ticker yet." Critical minerals quick hit said "wait for the annual letter."

**What didn't:** All 3 deep routes were equity longs (except MSFT short). No prediction market, perp, or pair trade appeared despite Kalshi and HL being available platforms. DELL appeared again (same thesis, same chain pattern as the SKILL.md examples). All three chains were 4 steps long with the same structure.

**Usable as example for:** Bulk mode format, direct vs derived classification, quick hit format, handle scan flow. Also useful as evidence of the DELL/equity overfitting problem.
