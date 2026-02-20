# Two-Layer Model Test Prompts

Run these after implementing the SKILL.md changes. Evaluate each routing against the expected behavior.

## Test 1: Clean direct call (baseline)

**Prompt:**
```
Chamath just tweeted: "All in on TSLA $420. Most obvious trade of the decade."
```

**Expected:**
- call_type: `direct`
- author_ticker: TSLA
- routed_ticker: TSLA
- conviction: high
- conditions: null
- derivation: 1-2 steps, all evidence (segment-linked)

**Fails if:** author_thesis is reframed, conviction is anything but high, ticker diverges.

---

## Test 2: Author names ticker, skill wants to route elsewhere

**Prompt:**
```
"I'm buying NVO. GLP-1 is going to be bigger than anyone thinks."
```

**Expected:**
- author_ticker: NVO
- routed_ticker: NVO OR HIMS (either is valid)
- If NVO: call_type = `direct`
- If HIMS: call_type = `derived`, author_ticker preserved as NVO
- conviction: high
- derivation: if diverged, chain shows why skill chose differently

**Fails if:** author_ticker is null or HIMS (must always be NVO — that's what they said). Fails if routed to HIMS but tier says `direct`.

---

## Test 3: Heavy hedging / low conviction

**Prompt:**
```
I don't know, maybe I'm wrong, but I feel like there could potentially be something with uranium? Like if AI really needs all that power? But honestly I have no idea.
```

**Expected:**
- conviction: `low` or `speculative`
- conditions: captures the hedging ("if AI really needs all that power")
- author_thesis: preserves the uncertainty, not cleaned up
- author_ticker: null

**Fails if:** conviction is `high` or `medium`. Fails if conditions is null. Fails if author_thesis reads like a clean directional claim.

---

## Test 4: Sarcasm / bearish through irony

**Prompt:**
```
Oh great, another AI wrapper startup just raised $500M. Because clearly what the world needs is 47 more chatbot companies burning cash at $50M/month. This definitely ends well.
```

**Expected:**
- author_thesis: bearish on AI wrapper startups (captured with sarcastic tone intact)
- routed_direction: short or bearish instrument
- conviction: high (strong sarcasm = strong opinion)
- Thesis shape: vulnerability
- author_ticker: null

**Fails if:** interpreted as bullish. Fails if conviction is low. Fails if author_thesis is sanitized to remove the sarcastic voice.

---

## Test 5: Multi-condition with explicit qualifications

**Prompt:**
```
I'd go long defense stocks IF and ONLY IF: (1) Ukraine escalates further, (2) NATO spending actually hits 3%, and (3) there's no peace deal before Q2. Otherwise this whole sector is a value trap.
```

**Expected:**
- conditions: all three conditions preserved
- conviction: medium (conditional language)
- author_thesis: captures the conditional nature, not just "defense stocks long"
- author_ticker: null (said "defense stocks" not a specific ticker)
- author_direction: long (but conditional)

**Fails if:** conditions is null or has fewer than 3 items. Fails if conviction is high (it's explicitly conditional). Fails if author_thesis drops the conditions.

---

## Test 6: Two speakers disagreeing (bulk mode)

**Prompt:**
```
[Podcast transcript]
CHAMATH [14:22]: AI defense spending is going to $100 billion by 2028. The Pentagon budget is going to look completely different.

JASON [14:45]: That's insane. The government can't even deploy AI at the DMV. You're smoking something.

CHAMATH [15:10]: The Pentagon isn't the DMV. They already have $15 billion allocated and the NSA is further ahead than anyone knows.

FRIEDBERG [16:30]: I actually think Chamath's right on the direction but wrong on the timeline. It's a 2032 story, not 2028.
```

**Expected:**
- Extracts 2-3 claims (Chamath bullish defense, Friedberg agrees but different timeline, Jason is counter-argument not separate thesis)
- Chamath's claim: segments at [14:22] and [15:10], conviction high
- Friedberg's claim: segment at [16:30], conviction medium, conditions: "2032 not 2028"
- Jason's statement captured as counter-argument, not a separate bullish/bearish thesis
- Each derivation step links to correct speaker + timestamp

**Fails if:** Jason's pushback is extracted as a separate bearish thesis. Fails if segments don't have timestamps. Fails if Chamath's two statements aren't both captured as segments for his claim.

---

## Test 7: Chain of attribution

**Prompt:**
```
My friend showed me a @zerohedge tweet that was quoting a Goldman Sachs analyst who said oil is going to $150 because OPEC cuts are deeper than reported.
```

**Expected:**
- source_handle: the Goldman analyst (or @zerohedge if analyst name unknown)
- NOT "my friend"
- author_thesis: oil to $150 because of OPEC cuts
- conviction: high (declarative claim from analyst)
- derivation traces the attribution chain

**Fails if:** source_handle is "my friend" or empty. Fails if the relay chain is lost.

---

## Test 8: Old content with explicit date

**Prompt:**
```
From the All-In Pod, January 3, 2025: Sacks said "OpenAI's nonprofit structure is going to implode. There's no way they sustain this governance model with $100B+ at stake."
```

**Expected:**
- source_date: 2025-01-03
- source_handle: @davidsacks (or "Sacks")
- entry_price: price at source_date for whatever instrument is routed (NOT current price)
- conviction: high
- Thesis shape: binary event or vulnerability

**Fails if:** source_date is missing or uses today's date. Fails if entry_price is current price instead of Jan 2025 price.

---

## Test 9: Ticker exists but is suboptimal

**Prompt:**
```
"Buy GBTC for pure Bitcoin exposure"
```

**Expected:**
- author_ticker: GBTC
- routed_ticker: GBTC OR IBIT OR BTC spot (skill may find better expression)
- If GBTC: call_type = `direct`
- If IBIT/BTC: call_type = `derived`, explains why (fee, premium/discount, etc.)
- conviction: high
- author_thesis: "pure Bitcoin exposure"

**Fails if:** author_ticker is anything other than GBTC. Fails if diverges without explaining why.

---

## Test 10: Pure vibe, zero market content

**Prompt:**
```
Bro everyone at Coachella was wearing these weird Japanese techwear pants. Like EVERYONE. It was insane.
```

**Expected:**
- call_type: `inspired`
- author_ticker: null
- author_thesis: null (there IS no thesis — it's an observation)
- conviction: high (emphatic language)
- conditions: null
- derivation: long chain, many inference steps (no segment-linked evidence), all skill contribution
- Segments: 1 (the original observation)

**Fails if:** author_thesis contains a market claim the author never made. Fails if call_type is `direct` or `derived`. Fails if derivation steps have segment links (the author didn't make market claims — every step from observation to instrument is the skill's inference).

---

## Evaluation Checklist

For every test, verify:

- [ ] `author_thesis` reflects what was ACTUALLY said (not reframed)
- [ ] `author_ticker` is what THEY named (null if they didn't name one)
- [ ] `conviction` matches the language intensity
- [ ] `conditions` captures ALL qualifications stated
- [ ] `call_type` is correct for the divergence between author's claim and skill's routing
- [ ] `segments` link to specific quotes with speaker/timestamp where available
- [ ] Derivation steps WITH segment = evidence, steps WITHOUT = inference
- [ ] `source_date` is when they said it, not when processed
- [ ] `entry_price` is price at source_date
