# Belief Router → Platform Handoff

**Date:** Feb 17, 2026
**Context:** Frank and his OpenClaw agent spent several hours discussing how to turn the belief-router skill into a product/platform. This doc captures the full conversation arc so a new agent can pick up where we left off.

---

## 1. What Exists Today

The belief-router is an open-source Claude Code skill at `github.com/rohunvora/belief-skill`. It takes natural language opinions ("everyone's on Ozempic") and routes them to specific trade expressions (HIMS calls, Kalshi contracts, Hyperliquid perps, etc.). 

**What's built and working:**
- Input validation (thesis extraction from text, URLs, transcripts)
- Agentic research loop (3-10 web searches, data grounding)
- 4-dimension scoring rubric (alignment, payoff shape, edge, timing forgiveness)
- 6 instrument adapters (Robinhood/Yahoo, Kalshi, Hyperliquid, Bankr, Angel/VC, DexScreener)
- Bulk mode for multi-thesis content (podcasts, articles)
- Structured output: "The Take" + trade card

**What's NOT built:** Everything needed to make it a platform (see below).

---

## 2. The Product Vision

Frank wants to turn this into a platform where:
- People submit, share, and link structured trade theses
- Historical takes from known traders (CT, YouTube, podcasts) are backfilled with verified timestamps
- The platform is self-sustaining through network effects, not manual curation
- The belief-router skill stays open source; the frontend/platform is the business

**Frank's distribution advantage:** 440K followers on @frankdegods. He's confident he can make this go viral in 1-2 days. The concern isn't launch — it's designing the system so it sustains itself after launch.

---

## 3. Architecture — The Flywheel

The system was mapped as a causal loop diagram. The key insight:

**Currently:** A linear pipeline. Thesis → Research → Scoring → Trade Card → dead end. No feedback loops, no compounding.

**Target:** A flywheel with these nodes:

```
Trade Card → Visual Card (shareable) → Sharing/Virality → New Users 
→ Permalink/Platform → More Theses → Outcome Tracking → Reputation/Hit Rate 
→ Quality Filter → (loops back to More Theses)
```

**Revenue (downstream, don't build yet):**
- Transaction revenue (execution layer, fee on trades made through platform)
- Data API (structured thesis graph sold to quant funds, fintech apps)
- Pro accounts (enhanced profiles)

The open-source skill + owned frontend = WordPress model. Community improves the engine, Frank owns the platform where the network lives.

---

## 4. Core Data Model

A "take" on the platform is lightweight:

### The Take
- **Caller** — who made the original claim (may never touch the platform)
- **Curator** — who found it, linked it, timestamped it, submitted it (gets credit)
- **Claim** — the directional statement, preserved as originally stated
- **Source** — link to original tweet/video/podcast with timestamp (always required)
- **Verified timestamp** — when the claim was originally made (from tweet API, video publish date, etc.)
- **Price at call** — instrument price at the moment of the original claim (historical lookup)
- **Instrument** — what ticker/token the claim maps to (optional — not every take needs to be auto-routed)

### The Graph (links between takes)
- "Inspired by" → citation
- "Agrees with" → agreement
- "Contradicts" → debate

That's it. No performance ribbons, no auto-calculated hit rates, no complex profile stats at v1. The data speaks for itself — anyone can see a take from 6 months ago and check what happened to the price.

### Verification
- Source link always required (anyone can click through and verify)
- Other users can flag inaccurate takes (wrong timestamp, out of context, misrepresented)
- Flagged items show the flag — sunlight is the disinfectant
- No complex dispute resolution needed at v1

### Important design note from Frank
Don't over-engineer the "take → trade" translation. Auto-mapping "HIMS is going to rip" into a specific instrument with targets is janky and error-prone. Better to preserve the original claim and let the price anchor do the work. The belief router is a tool users can optionally run ON a take, not something that runs automatically on every submission.

---

## 5. Self-Sustaining Design Principles

These were the key conclusions from the system design discussion:

### "Make the selfish action the useful action"
People aren't "contributing to the community" — they're building their own reputation. The platform benefits as a side effect.

### Structure kills spam
A structured submission with required fields (claim, source link, timestamp) is inherently harder to spam than a free text box. You can't fake a verified timestamp with a source link.

### Outcomes are the algorithm (eventually)
Don't rank by likes or followers. Once outcome tracking exists, rank by accuracy. Someone with 12 takes and 75% accuracy surfaces above someone with 500 takes and 30%. But this is NOT v1 — too much design risk in auto-resolving outcomes.

### Curator credit creates the backfill incentive
Instead of scraping 10,000 historical tweets yourself, users do it because they get credit for surfacing good takes. The best curators become valuable in their own right.

---

## 6. The Skill's Role in the Platform

The belief-router SKILL.md should be updated so that when it produces a trade card, the structured data is automatically logged in a format the platform can ingest. The output isn't just a chat message — it's a structured record that can become a take on the platform.

This means the skill's output format should produce structured JSON alongside the human-readable card, containing: claim, instrument, direction, price at call, timestamp, source (if from a URL), and the full reasoning chain.

---

## 7. Build Priorities (Frank's 48-hour sprint)

In order of what closes the next loop in the flywheel:

1. **Visual card format** — shareable image that looks good when screenshotted on Twitter. This is the virality mechanism.
2. **Frontend with permalinks** — each take lives at a URL. This is what people link to.
3. **Curator submission flow** — way for users to submit historical takes with source links.
4. **Basic verification** — flag button + source link requirement.

NOT in the 48-hour sprint:
- Outcome tracking / performance ribbons
- Profile stats / hit rates
- Execution layer
- Data API
- Social graph (agree/disagree/fork)

---

## 8. Visual Design Notes

- **Always use light mode** for any diagrams/visuals (Frank can't read dark mode on phone)
- The architecture diagram (causal loop) is at `skills/viz/belief-router-causal.html`
- The previous grid diagram (v1, rejected) is at `skills/viz/belief-router-architecture.html`
- Frank cares about visual design — reference his notes on Bankr (no gradients, clean, etc.)

---

## 9. Open Questions

These were identified as blindspots that need more work:

1. **Outcome resolution design** — how do you determine if a fuzzy thesis "played out"? Deferred to post-v1 but it's the hardest problem.
2. **Legal/regulatory** — is a platform routing people to specific instruments considered investment advice at scale?
3. **Competitive landscape** — who else is building structured thesis platforms? Not yet researched.
4. **What makes a card screenshot-worthy** — need reference research on what formats actually get shared on CT.
5. **Retention after day 1** — what makes someone come back to a thesis platform vs just following Frank on Twitter?
6. **Attribution/consent for backfilled profiles** — can you build a track record page for someone from their public tweets without permission? Probably frame as "claim your profile."

---

## 10. Key Files

- `SKILL.md` — the routing engine prompt (don't change for now)
- `scripts/adapters/` — live market API connectors
- `references/` — context docs loaded by the skill
- `HANDOFF.md` — this file
