# Belief Router

Turn any opinion into a trade. Paste a tweet, drop a YouTube link, say what you think is going to happen — in Telegram, WhatsApp, or Claude Code. The skill finds the most direct way to bet on it.

---

## Real examples

These are actual outputs from live sessions — not invented. Inputs are verbatim.

---

**"how do i long nettspend?"**

The subject is a person. No ticker exists. The skill recognizes this, decodes the cultural movement he represents (rising pluggnb artist, accelerating streaming trajectory), and descends the expression fidelity ladder. Routes to non-financial expression — GA concert tickets + limited merch with a scenario table. UMGNF (Universal Music) flagged as a tangential public alt. Honest about what the thesis can and can't trade.

---

**"market all in on duration mismatch"** (@marginsmall)

Five words. No ticker. Two valid interpretations: rate direction (TBT) or positioning crowding (IVOL). The skill treats "all in" as a crowding signal, not a direction call — searches for positioning evidence, finds Bloomberg data showing hedge funds in leveraged Treasury spread trades showing signs of strain. Key insight: crowding implies volatility, not direction. Routes to IVOL (gains from yield curve moves in any direction), not TBT (directional, decays daily, wrong thesis). Follow-up questions expanded to a TLT strangle, then SOL short on Hyperliquid as a cross-asset liquidity-crunch play.

---

**"everyone is positioned for a dollar rally. pain trade is up in everything."**

Before routing, the skill checks the setup claim. CFTC COT data (Feb 16): USD net-short $20.5B. EUR longs near record highs. The premise is inverted — the crowd is actually positioned for dollar *weakness*, not a rally. Notes the correction explicitly, then routes on the corrected premise. If you'd gotten a routing without the fact-check, it would have been wrong.

---

**"i think that at some point the american military will become the biggest buyer of ai/compute/hardware... i want to bet on america"**

Personal thesis, no ticker. The skill corrects a factual error first: military AI spending is $13.4B today vs $50–80B from hyperscalers — the military is not the biggest AI buyer yet. Routes to PLTR with an additional edge discovery: PLTR-PERP on Hyperliquid has –26% annualized funding, meaning longs get paid to hold. Honest correction first, then the trade.

---

**"NVDA is down 25% and Blackwell demand is unaffected. this is a gift."**

Author named the ticker. The skill agrees: NVDA shares, long. Verifies Blackwell demand ($500B+ committed through 2026). Confirms the obvious play IS the best play — doesn't manufacture a "smarter" alternative when the direct answer is right.

---

**@citrini7: "Seedance is the first time a Chinese AI product is just better definitively"**

Tweet URL. The obvious targets (Runway, Pika, Sora) are all private — no direct short exists. Finds the best diluted public expression: ADBE puts. Flags honestly: pure-plays are private, ADBE is a diluted expression, conviction medium-low. Doesn't force a high-conviction call when the instrument landscape is weak.

---

**Scan @chamath** (50 recent tweets)

Fetches posts via X API, filters for directional takes, surfaces 5 tradeable theses. MSFT short (author named it — direct), DELL long (on-prem thesis — derived), CEG long (power as AI bottleneck — derived). Two others flagged as "don't pick a ticker yet." Each routing uses a different instrument because each thesis has a different shape — MSFT used options (directional, dated catalyst), DELL and CEG used shares (structural, no catalyst date).

---

## What you can say

Anything with a direction. You don't need to know the ticker.

| Input | What happens |
|-------|-------------|
| "Everyone's on Ozempic" | Decodes the belief. NVO at PE 13 down 40% is the most direct play — the obvious answer is right here. |
| "Fed won't cut in March" | Kalshi NO contract. $80 pays $1,000 if right. Beats TLT puts on every dimension. |
| "SOL is going to flip ETH" | Pair trade on Hyperliquid. Long SOL-PERP, short ETH-PERP. Isolates the ratio from market direction. |
| "how do I bet on [artist/creator]?" | Finds the cultural movement they represent. Routes to the tradeable expression — or says honestly when nothing has real thesis alignment. |
| "my landlord just raised rent 40%" | Lived observation as thesis signal. Finds the real estate play that matches — or flags if the trade is already priced in. |
| "market all in on [trade]" | Reads as a crowding claim. Checks CFTC/positioning data. Routes to volatility, not direction. |
| Paste any tweet URL | Fetches the full text (including long-form Premium tweets), routes it in one step. |
| Paste a YouTube URL | Extracts all directional claims from the transcript, routes the strongest ones. Handles 4,000-word videos. |
| `scan @handle` | Fetches 50 posts, finds tradeable takes, routes each one. ~$0.26 in X API costs. |
| Screenshot of anything | Vision reads the text, routes it like any other input. |
| "I think X but also Y" | Detects compound or contradictory theses. Resolves apparent contradictions (Jevons Paradox, crowding dynamics, reflexivity). Finds the pair trade if one exists. |

---

## Install

### Via OpenClaw (recommended — works in Telegram, WhatsApp, Discord)

If you're running [OpenClaw](https://openclaw.ai), install from ClawHub:

```bash
clawhub install belief-router
```

That's it. The skill auto-activates in your connected chat apps whenever you express a belief with trading implications — no slash commands. Just message your agent like you'd message a person:

> "paste a tweet here" or "I think AI defense spending is about to boom"

The skill reads the YAML description to know when to fire. It will activate on beliefs, cultural observations, pasted content with directional claims, and "how would I trade this" questions. It stays dormant for everything else.

**Optional:** Set `X_BEARER_TOKEN` in your OpenClaw environment for handle scanning ($0.26 per 50 tweets). The skill works without it — you can paste tweets or use screenshots instead.

### Via Claude Code (standalone)

Requires [Bun](https://bun.sh) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill
bun install
```

Place the `SKILL.md` where Claude Code can load it. It will activate automatically when you express a belief in the editor.

---

## What gets posted

Every routing optionally posts a card to [belief.board](https://belief-board.fly.dev) — a public permalink with the thesis, derivation chain, instrument, and scenario table. The URL is shareable: paste it in a group chat, tweet it as a receipt, or keep it as a personal trade log. Cards are timestamped at routing time, not entry time.

---

## How it works

Three phases, in order:

**1. Extract** — captures the author's original claim verbatim, including any ticker they named and any conditions they set. This is preserved for track record scoring regardless of what the skill routes to.

**2. Research** — checks the setup claim against real data before routing. If you say "the crowd is positioned long X" and CFTC data shows they're net short, the skill notes the correction before proceeding. Then searches for instrument-level data (price, funding rates, options liquidity, Kalshi markets).

**3. Route** — scores candidates on four dimensions (thesis alignment, payoff shape, edge, timing forgiveness) and commits to one trade. Shows the derivation chain in plain language so you can follow every step. Shows what it chose over and why.

The skill follows two hard quality gates:

**Gate 1 (Coherence):** Does the quote + ticker make sense side by side without explanation? A reader should be able to see the connection. Fails → reroute closer.

**Gate 2 (Optimality):** Is this the best way to trade this belief? Kalshi NO at $0.08 beats TLT puts for a "Fed won't cut" thesis on every dimension. Shares beat options for structural theses with no catalyst date. Fails → find better instrument.

---

## Architecture

The main `SKILL.md` is a decision tree that loads reference files on demand. Detail lives in `references/`, not in the main prompt — this keeps the model focused on the current step instead of holding 800+ lines of context at once.

```
SKILL.md                    decision tree + flow
references/
  scoring-rubric.md         4-dimension evaluation, hard gates, comparison
  derivation-chain.md       chain format, examples, anti-patterns, coherence tests
  output-format.md          payload table, headline quotes, board POST
  bulk-mode.md              multi-thesis extraction, tiering, scan output
  handle-scan.md            X API pipeline, cost gate, filtering
  instrument-reasoning.md   options vs perps vs Kalshi vs shares
  portfolio-construction.md multi-leg trades, pair construction
  blindspots.md             platform risk, correlation groups, liquidity
scripts/adapters/
  robinhood/                stock/ETF price + returns (via Yahoo Finance)
  hyperliquid/              perp price, funding, leverage
  kalshi/                   prediction market discovery + returns
  polymarket/               binary event markets
  bankr/                    onchain instruments
  angel/                    private market raises
  x/                        X/Twitter user timeline (pay-per-use API)
  transcript/               URL to text (YouTube, articles, tweets)
tests/
  real-test-theses.json     canonical test set — real session inputs with expected behavior
  hard-test-theses.json     edge cases (private plays, compound contradictions, stale theses)
  real-routings.md          6 fully documented sessions with lessons learned
  results/*.jsonl           raw routing outputs from test sessions
board/
  server.ts                 Bun.serve() on port 4000
  db.ts                     SQLite (bun:sqlite)
  templates/                server-rendered OG cards + permalinks
```

---

## What it won't do

- **Execute trades.** It shows what to buy and where. You press the button.
- **Give financial advice.** Everything is framed as trade expressions and market data, not recommendations.
- **Route without evidence.** Every claim in the derivation chain traces to a source.
- **Force a call when the instrument landscape is weak.** If all the pure-plays are private, it says so and sizes down conviction accordingly.

---

## License

MIT
