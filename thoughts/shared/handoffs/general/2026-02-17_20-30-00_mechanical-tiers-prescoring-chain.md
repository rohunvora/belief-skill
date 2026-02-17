---
date: 2026-02-17T20:30:00-0500
session_name: general
researcher: claude
git_commit: 1d691ea
branch: belief-board-v4
repository: belief-skill
topic: "Mechanical Attribution Tiers + Pre-Scoring Derivation Chain"
tags: [belief-board, skill-prompt, attribution, derivation-chain]
status: complete
last_updated: 2026-02-17
last_updated_by: claude
type: implementation
---

# Handoff: Mechanical Attribution Tiers + Pre-Scoring Derivation Chain

## Task(s)

1. **Task #10: Mechanical tier classification** (completed) — Attribution tier is now a lookup, not a model judgment. Scan the "Source said:" step of the derivation chain: ticker present → `direct`, market-specific causal claim → `derived`, framework/observation only → `inspired`. First match wins.

2. **Task #11: Pre-scoring derivation chain** (completed) — Promoted `### Derivation Chain + Attribution` from inside `## Research` to its own `## Derivation Chain` section between Thesis Analysis and Research. Document order now enforces "log chain BEFORE searching" sequencing. Content unchanged — only the heading level and position moved.

## Recent changes

**Commits this session (1 on `belief-board-v4`):**
- `1d691ea` — Mechanical attribution tiers, pre-scoring derivation chain

**Files modified:**
- `SKILL.md:74-86` — Derivation Chain promoted to `##`, moved above Research. Tier table updated: classification tied to "Source said:" step, inline examples added.
- `references/derivation-chain.md:27-43` — Replaced table-only classification with ordered ruleset (first-match-wins). Added explicit rules for each tier with examples.
- `CHANGELOG.md` — Added v3.2 entry

## Learnings

### Mechanical classification via document structure
The most efficient way to enforce ordering (derivation before research) was not adding new instructions but moving an existing block. The content already said "BEFORE searching" — the problem was structural: nested under Research, it read as part of research. Promoting to `##` and moving above `## Research` made the document order match the intended process order.

### Edge case: ticker mentioned in passing
A source quote like "I saw AAPL's earnings and think the whole tech sector is overvalued" would be classified as `direct` (ticker present) even though the thesis is sector-level. In practice this is mitigated because: (1) the chain is written BEFORE searching, so the router must commit to what it quotes, and (2) quoting "the whole tech sector is overvalued" (no ticker) correctly hits rule 2 (`derived`). The mechanical rules force better quoting.

### Token budget unchanged
SKILL.md block was moved, not expanded. `references/derivation-chain.md` gained ~6 lines of explicitness (ordered ruleset). Net token impact is negligible.

## Artifacts

- `SKILL.md:74-86` — Derivation Chain section (promoted, repositioned)
- `references/derivation-chain.md` — Updated tier classification rules (ordered, first-match-wins)
- `CHANGELOG.md` — v3.2 entry

## Action Items & Next Steps

1. **Task #10/#11 validation** — Run the skill on a few sourced inputs to confirm the mechanical classification works as expected. Good test cases: a tweet with a ticker (should be `direct`), a podcast with a market thesis (should be `derived`), a framework observation (should be `inspired`).

2. **Group chat test cases** (from previous handoff, still pending) — Grindr earnings, Pelosi filings, government meetings, Messari/egirlcapital research, Pokemon cards. Priority: Grindr, Pelosi, government meetings.

3. **Board Phase 1 backend** (from previous handoff, still pending) — SQLite schema, 13 API endpoints, replace mock data with real DB, resolution cron.

4. **Remaining attribution work** — Consider whether the board code should also mechanically validate tiers (a function that parses the derivation string and confirms the tier). Currently the skill self-classifies via the prompt rules; the board trusts whatever tier it receives.

## Other Notes

### Running the prototype
```bash
git checkout belief-board-v4
lsof -ti:4000 | xargs kill -9 2>/dev/null
sleep 1 && bun run board/server.ts
# → http://localhost:4000
```

### Current mock data tier examples
- LAES: `direct` — source said "Buy LAES" (ticker present)
- DELL/MSFT/IONQ/EVR: `derived` — source quotes contain market-specific claims, no tickers
- SPGI: `inspired` — source said "When the interface layer gets commoditized, the scarce inputs get more valuable" (framework only)

### SPGI derivation chain (visible on board)
```
Source said: "When the interface layer gets commoditized, the scarce inputs get more valuable"
Implies: Companies whose moat is proprietary data creation benefit from AI disruption of terminals
Searched: Financial data companies with regulatory lock-in or benchmark ownership, recently sold off
Found SPGI because: NRSRO-certified credit ratings + $7T indexed to S&P indices — scarce inputs AI can't replicate — but sold off 29% alongside FactSet
```
