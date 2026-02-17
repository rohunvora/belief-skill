# Take Log — Visual Shape Inventory

Tracking the jaggedness of takes integrated into the board prototype. Each entry captures what kind of data the take produced, what rendered well, and what didn't fit the current card/detail design.

## Schema

| Field | Description |
|-------|-------------|
| source | Who/what the take came from |
| ticker(s) | Instruments produced |
| shape | What fields the scan populated (rich/slim/mixed) |
| edge cases | Anything that broke or didn't fit the current UI |
| visual note | What we learned about display |

---

## Takes

### 1. All-In Podcast (Chamath) — DELL
- **Shape:** Rich — full source quote, reasoning, edge, counter, 5-step price ladder, alternative play
- **Visual note:** Price ladder is the centerpiece. Source quote as blockquote works. "Dies if" too noisy for feed, belongs on detail.

### 2. Threadguy Stream — MSFT
- **Shape:** Rich — source quote, reasoning, edge, counter, price ladder, alternative
- **Visual note:** Same rich shape as All-In. Attribution line ("THREADGUY's take") is the hook that makes claim flow make sense.

### 3. Martin Shkreli — IONQ (Quantum Oversold)
- **Shape:** Rich — full source quote, reasoning, edge, counter, 4-step price ladder (no breakeven step), alternative (RGTI)
- **Tickers:** IONQ primary, RGTI alt, also mentions Quantinuum/PsiQuantum/Xanadu (private comps — not tradeable)
- **Edge cases:** Thesis is "mechanical selling" not "undervalued fundamentals" — a different thesis *type* (flow-driven vs value-driven). The scan explicitly calls out the public-private valuation disconnect as evidence, referencing private raises that aren't on the board. Also: 4-step ladder instead of 5 (no explicit breakeven row, jumps from stop to first target).
- **Visual note:** First take where the thesis rejects fundamentals entirely — "this wasn't about quantum fundamentals deteriorating." The card detail page should communicate *why* the drawdown happened (flow mechanics) as clearly as *what* the trade is. The "you need to believe" framing from the scan is powerful but we don't have a UI slot for it yet.

### 4. Martin Shkreli — EVR (IPO Window)
- **Shape:** Rich — source quote, reasoning, edge, counter, 4-step price ladder, alternative (IPO ETF)
- **Tickers:** EVR primary, IPO ETF alt. Also references MS, GS as "rejected obvious plays" — interesting negative attribution.
- **Edge cases:** Thesis explicitly rejects two other tickers (MS, GS) before arriving at EVR. This is a *non-obvious play* shape — the scan says "the problem with the obvious play" then redirects. The reasoning section is partially about *why NOT* MS/GS, not just *why* EVR. Also: smaller dollar amounts on the ladder ($89-$201 range vs $1000+ on IONQ/DELL) — position sizing affects how dramatic the ladder bars look.
- **Visual note:** Two takes from one source, same scan batch. Both have `scan_source: "Martin Shkreli (Feb 2026)"` — first time we have 2 cards from the same scan. Feed should NOT group them, but the detail page `scan_source` badge now has meaning as a batch identifier. Small P&L dollar amounts make the ladder bars less visually dramatic — may need to normalize bar widths by % not $.

### 5. nicbstme — SPGI (Regulatory Fortress vs AI Disruption)
- **Shape:** Rich — source quote, reasoning, edge, counter, 5-step price ladder (includes breakeven row), alternative (MCO)
- **Tickers:** SPGI primary, MCO alt. Also references FDS (FactSet) as the "obvious short" that's already played out, plus mentions Platts/S&P 500 index as embedded moats.
- **Edge cases:** This is a *bifurcation thesis* — the scan's core insight is that the market is failing to distinguish between two categories of financial data company (search layer vs regulatory infrastructure). The rubric comparison evaluates 3 candidates head-to-head (SPGI long, FDS short, MCO long) before picking SPGI. The FDS short is explicitly rejected as "dead money" (already down 57%, only 5% left to the floor). MCO rejected on binary earnings risk. First take where the "obvious play" is a *short* that gets rejected in favor of the long side of the bifurcation.
- **Visual note:** 5-step ladder with small dollar amounts ($55-$297 on 2 shares / $1K risk). Same normalization issue as EVR — need % bars not $ bars. The "breakeven — dead money" label is the first ladder step with editorial commentary baked in. The thesis is long and structural — the card preview needs to capture "regulatory fortress" not just "long SPGI." First take sourced from an X post with a direct URL — the `source_url` field is populated with a real tweet link.

---

*Next takes go below. We're looking for: single-ticker vs multi-ticker, rich vs slim, prediction markets vs equities, short thesis vs long thesis, anything that breaks the card layout.*
