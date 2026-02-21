# Architectural Gaps — Belief Router SKILL.md
**Date:** 2026-02-21  
**Found by:** OpenClaw AI agent (Claude Sonnet 4.6)  
**Source:** Live routing of 5 hard test cases + audit of real session corpus  

> These are specific gaps in the current SKILL.md identified through routing real and hard synthetic inputs. Each gap has a concrete location in the skill and a recommended fix.

---

## Gap #1: No Premise Verification Step

### What's missing
The skill faithfully extracts the author's claim ("positioned for a dollar rally") but has no explicit step to **verify whether the setup premise is factually true** before routing.

### Evidence from testing
- **hard-01** ("everyone is positioned for a dollar rally"): COT data (Feb 16) shows USD net-SHORT $20.5B. The entire thesis inverts — the crowd is actually positioned for dollar *weakness*. Without verification, the skill would route to risk-on longs. With verification, it routes to UUP long.
- **hard-07** ("market still hasn't priced in WFH"): Office REITs already repriced 50-70% in 2020-2022. Demand recovering in H2 2025. The thesis is 4 years stale. Without verification, routes to VNO short. With verification, finds the tier-1/tier-2 divergence angle or says "pass — already priced."
- **real-02** (US military AI paragraph): User claimed military is "the biggest buyer of AI." Actually $13.4B vs $50-80B from hyperscalers — not there yet. Skill correctly caught this in the real session, but only because the researcher happened to find it. No explicit instruction to verify setup claims.

### Where to add it in SKILL.md
**After the "Faithful Extraction" step (Layer 1) in Thesis Analysis, before "Deeper Claim" (Layer 2)**, add:

```
### Premise Verification (between Layer 1 and Layer 2)

Before running Layer 2 analysis, verify factual setup claims:
- **Positioning claims** ("everyone is long/short X") → check CFTC COT report, bank prime broker surveys, or options market skew
- **Market hasn't priced it in** → check the obvious instrument's price history vs the thesis origin date; check short interest and analyst consensus
- **Company/sector claim** ("X is the biggest Y") → verify with current data

If a premise is wrong, note it explicitly ("your setup is inverted — here's what the data shows") BEFORE routing. Route based on corrected premise, not stated premise. The author's original claim is still preserved in segments for track record scoring.
```

### Why this matters for the skill's track record
If the skill routes on a wrong premise, the track record shows a bad call that wasn't actually the author's fault. Premise verification separates "the thesis direction was wrong" from "the routing was wrong."

---

## Gap #2: No Contradiction Resolution Protocol

### What's missing
When a compound thesis contains two legs that *appear* contradictory (but may actually be consistent under an economic principle), the skill has no explicit guidance to:
1. Identify the apparent contradiction
2. Test whether it resolves via a known economic principle
3. Route the resolved thesis

### Evidence from testing
- **hard-04** (DeepSeek compound): "AI is commoditizing (→ bad for GPUs)" + "Nvidia just printed blowout earnings (→ GPUs doing great)" looks contradictory. But Jevons Paradox resolves it: cheaper AI → more usage → more compute. Once resolved, the pair trade (long NVDA infrastructure / short PLTR narrative) is obvious. Without an explicit resolution step, the skill likely asks "which leg do you want me to focus on?" — which is the wrong response.
- **real-09** (SNPS internal contradiction): EDA tailwind (AI chip design supercycle) vs code security headwind (Claude Code Security replacing Coverity). Both are real, both apply to the same company. Correct response: acknowledge the contradiction, size down accordingly, recommend the cleaner expression (GTLB) while flagging why it's wrong timing. No explicit guidance for this in current SKILL.md.

### Where to add it in SKILL.md
**In the "Multiple Theses" step (step 7 of Input Validation)**, extend the logic:

```
If the input contains what appears to be a contradiction between thesis legs:
1. State both legs explicitly
2. Test for resolution via known economic principles:
   - Jevons Paradox: cheaper X → more demand for X (applies to compute, energy, bandwidth)
   - Reflexivity: narratives can move prices regardless of fundamentals
   - Crowding dynamics: crowded positions revert when positioning unwinds
   - Second-order effects: the obvious casualty may be wrong (see Deeper Claim)
3. If resolves → route the unified thesis with the pair trade that captures both legs
4. If doesn't resolve (genuinely contradictory) → flag honestly, size down, route the leg with more causal density

The apparent contradiction is often the most valuable signal. "X but Y" is usually Jevons Paradox waiting to be named.
```

---

## Gap #3: Anti-Contrarian Discipline Is Understated

### What's missing
SKILL.md states "Don't flip for the sake of being contrarian" and gives an example (NVO at 13x PE, down 40% = obvious play IS the best). But this rule is soft — it's a caveat, not an equal counterweight to the "find the deeper play" instinct. In practice, the skill's training strongly pushes toward non-obvious plays because those are more memorable/interesting. The rule needs to be stated more forcefully with an explicit test.

### Evidence from testing
- **hard-02** (NVDA gift): The author said NVDA, verified $500B in Blackwell commitments, down from highs, structural thesis. The correct answer is "yes, NVDA shares, you're right." But the skill has a strong pull to find COHR (optical layer) or ANET (networking) as "smarter" plays. This would be wrong — NVDA is the highest causal density at D=0.
- **real-05** (@chamath): All 3 deep routes were equity longs. No HL perps, no Kalshi, no pair trades — even when the input contained relative value opportunities. This suggests the opposite problem (not enough instrument diversity) but same root: the instrument choice isn't anchored to causal density.
- Pattern from real-routings.md: DELL appeared in both a user session and the SKILL.md examples — the same chain, same 4 steps, same pattern. Evidence of overfitting to a "derived" routing template.

### Where to add it in SKILL.md
**At the end of the "Deeper Claim" section**, add an explicit self-test:

```
### Anti-Contrarian Self-Test

Before finalizing Layer 2 routing, run this check:
- Is the author's stated ticker, if any, the highest causal-density instrument at the lowest distance?
- If yes → route there. Being non-obvious when the obvious is right is a bug, not a feature.
- If no → explain in ONE sentence why a different instrument has higher causal density. If you can't explain it clearly, the derivation is weak.

The test: "What % of this instrument's price movement is explained by this thesis?" (causal density).
- Author says NVDA, you're tempted to route to COHR: NVDA causal density ~80%, COHR ~30%. Route to NVDA.
- Author says "AI defense spending," you route to PLTR: PLTR causal density ~70% vs LMT ~25%, RTX ~20%. Route to PLTR.
- Author says "everyone's on Ozempic," you route to HIMS over NVO: HIMS causal density for GLP-1 distribution ~60%, NVO ~90% but fully valued. Depends on valuation — document why.

The non-obvious play is only correct when its causal density exceeds the obvious play's causal density. Not when it "sounds smarter."
```

---

## Summary Table

| Gap | Severity | Where in SKILL.md | Lines to change |
|-----|----------|-------------------|-----------------|
| #1 Premise verification | High | Thesis Analysis → between faithful extraction and deeper claim | Add new sub-section |
| #2 Contradiction resolution | High | Input Validation → step 7 (multiple theses) | Extend step 7 |
| #3 Anti-contrarian discipline | Medium | Deeper Claim section | Add self-test block |

---

## Additional Minor Observations

These aren't architectural gaps but are worth noting:

1. **Tone-matching output to input** (real-04, Costco gold bars): Casual 15-word input got a long formal output. The skill should calibrate output length to input sophistication. A one-liner in → a one-liner out (plus the chain). No rule for this exists in SKILL.md.

2. **DELL chain overfitting**: The DELL derivation pattern ("on-prem is back → enterprise data sovereignty → DELL server backlog") appears in both the SKILL.md examples AND two real session outputs. This suggests the skill has memorized a template. The chain anti-patterns section covers this conceptually but the specific DELL example in SKILL.md may be reinforcing the pattern.

3. **Handle scan platform diversity**: In the @chamath scan session, all 3 deep routes were equity longs (except MSFT short). No Kalshi, no HL perps, no pair trades. The bulk mode pipeline should explicitly check at least one non-equity platform per scan. Even if it lands on equities, the reasoning should show the check was run.
