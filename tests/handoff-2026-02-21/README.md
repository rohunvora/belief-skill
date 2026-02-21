# Belief Router — Test Corpus & Routing Eval Handoff
**Date:** 2026-02-21  
**Prepared by:** OpenClaw AI agent (Claude Sonnet 4.6) running on Frank's Mac Mini  
**Purpose:** Pass findings from manual test evaluation session back to Claude Code for implementation  

> ⚠️ **This document was created by an AI agent, not a human.** All test inputs, routings, and architectural observations reflect the agent's analysis. Frank (the human) has not independently verified the routing outputs — treat this as "AI reviewing AI" and apply appropriate skepticism. The key value here is the test corpus and gap identification, not necessarily the specific routing outputs (which should be verified by Claude Code against the current SKILL.md).

---

## What's in This Handoff

| File | What it is |
|------|-----------|
| `README.md` | This document — overview, context, what to do |
| `routing-results.md` | 5 hard test cases routed live with web research |
| `architectural-gaps.md` | 3 specific gaps found, with SKILL.md change recommendations |
| `../real-test-theses.json` | 9 test cases from actual past sessions (with prior ratings) |
| `../hard-test-theses.json` | 8 synthetic hard cases covering missing input shapes |

---

## Background

### The Problem Frank Flagged

The existing `tests/test-theses.json` has 8 synthetic test cases. They're short, clean, unambiguous, and unrealistic. Real CT inputs are:
- 5-word cryptic macro observations ("market all in on duration mismatch")
- URLs (YouTube videos, tweets)  
- Compound theses with apparent contradictions
- Cultural observations with no obvious ticker
- Verbose personal theses with wrong factual premises

The synthetic tests don't stress the architecture. They pass even if the skill is fundamentally broken.

### What Was Done This Session

1. **Audited all real test sessions** — pulled 11 actual inputs from `real-routings.md`, debug exports, and JSONL results
2. **Built `real-test-theses.json`** — 9 real documented inputs with expected behaviors, prior ratings, and failure mode documentation
3. **Built `hard-test-theses.json`** — 8 synthetic cases covering the 7 shapes missing from current test suite
4. **Ran 5 hard cases live** with real web searches — full routing + verdict documented in `routing-results.md`
5. **Identified 3 architectural gaps** — specific places where the current SKILL.md is insufficient

---

## What To Do With This

### Priority 1: Address the 3 architectural gaps (see `architectural-gaps.md`)

These are the highest-ROI changes. Each gap has a specific SKILL.md section that needs updating and a concrete fix.

### Priority 2: Run the full test corpus

The 17 test cases (9 real + 8 hard) in the JSON files are not yet run through the live skill. The 5 cases in `routing-results.md` are agent-to-agent evaluations, not live skill outputs. To get real results:

1. Enable test mode: `tests/test-mode.json` should be `active: true` with `skill: "belief-router"`
2. Run each text-based input through the skill in Telegram
3. Rate outputs using the existing 4-button rating UI
4. Results auto-save to `tests/results/`

URL-based inputs (hard-01 YouTube, real-03 chiefofautism tweet) require the X adapter and YouTube transcript adapter to be working.

### Priority 3: Add the gap assertions to test infrastructure

Each of the 3 architectural gaps should have a corresponding assertion in `tests/scoring.test.ts` so regressions are caught automatically.

---

## Test Corpus Summary

### Real cases (from actual sessions):
| ID | Input shape | Prior rating | Key lesson |
|----|------------|-------------|------------|
| real-01 | "how do i long nettspend?" | ✅ correct | Uninvestable → non-financial routing |
| real-02 | Long military AI paragraph | ✅ correct | Must correct factually wrong premises |
| real-03 | China Maxing YouTube URL | 2/5 | Bulk mode templating problem |
| real-04 | Costco gold bars observation | 2/5 | Tone-match output to input sophistication |
| real-05 | @chiefofautism supply chain tweet | 3.5/5 | Non-obvious pick (COHR > ASML) |
| real-06 | "market all in on duration mismatch" | ✅ correct | Crowding → volatility, not direction |
| real-07 | @chamath handle scan | partial | Tiering correct; all equities (no HL/Kalshi) |
| real-08 | "SOL is going to flip ETH" | 5/5 | Cleanest success — pair trade logic |
| real-09 | @claudeai SNPS short | no rating | Internal contradiction flagging |

### Hard synthetic cases (missing shapes):
| ID | Shape tested | Key stress |
|----|-------------|-----------|
| hard-01 | Crowding micro-tweet | Premise verification (COT data refutes it) |
| hard-02 | Direct ticker, obvious is right | Anti-contrarian discipline |
| hard-03 | Philosophical abstraction | No clarifying questions rule |
| hard-04 | Compound conflicting legs | Contradiction resolution + Jevons Paradox |
| hard-05 | Binary event / Kalshi home-run | Routes to prediction market, not stocks |
| hard-06 | Private company proxy | Honest "no direct vehicle" flagging |
| hard-07 | Consensus stale thesis | Premise already-priced-in verification |
| hard-08 | Non-macro handle scan | Pharma/biotech sector routing |

---

## Key Insight From Live Routing

The 5 live-routed cases revealed that **the biggest skill failures come from accepting user premises without verification**:

- Hard-01 ("positioned for a dollar rally"): COT data showed USD was actually net-SHORT $20.5B. The entire routing flips.
- Hard-05 ("market hasn't priced in WFH"): Office REITs have already repriced. The trade is 4 years stale.

The skill's "faithful extraction first" rule is correct for attribution/track record purposes, but it needs a separate **premise verification** step that fact-checks the setup claim before routing. This is architectural gap #1.
