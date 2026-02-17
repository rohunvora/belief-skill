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

---

*Next takes go below. We're looking for: single-ticker vs multi-ticker, rich vs slim, prediction markets vs equities, short thesis vs long thesis, anything that breaks the card layout.*
