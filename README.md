# Belief Router

You already have beliefs about the world. You just don't realize they're trades.

## Example

Someone posts this on X:

![tweet about AI overbuild and PQC](examples/pqc-tweet.jpg)

You forward it to your agent. The skill returns:

```
🎯 PQC MANDATE

LAES $3.85 · long

Only public PQC chip maker. NIST 2030 = gov
has to buy. Down 56%. The obvious play (IONQ)
is quantum hardware — this is quantum security.

$100K → 25,974 shares

$2     -$48K   mandate delays
$5.80   1.5x   52w high
$8.70   2.3x   ATH
$15     3.9x   gov contracts land

40% to be +EV · dies if: NIST delays, cash burn
Alt: ARQQ $17 (quantum encryption)

You could ask: "I trade with $10K not $100K" · "How do I buy LAES on Robinhood?" · "What if NIST delays to 2032?"
```

The tweet said "AI overbuild → quantum plugs into subsidized infra for NIST deadline." The skill traced that to the deeper claim: the NIST post-quantum cryptography mandate creates a government-backed buyer for quantum-safe chips regardless of what happens to SaaS. It found LAES — the only public company making PQC semiconductors — down 56% from highs at $689M market cap. The obvious play (IONQ, quantum hardware) has 40% thesis beta. LAES has 85%.

The follow-ups help you dig deeper — size the trade for your actual account, explore options for more leverage, or stress-test the thesis before committing.

---

## More Examples

| You say | Skill finds | Why not the obvious play |
|---------|------------|------------------------|
| *"Everyone's on Ozempic"* | HIMS LEAPS, 5x | Pharma (NVO/LLY) is consensus. The distribution bottleneck (telehealth DTC) is underpriced — HIMS is a GLP-1 distributor the market still sees as a hair loss company. |
| *"Meme politics are dead"* | DJT $5 puts, 11x | No pure "short political entertainment" ETF exists. DJT is a sentiment stock with $1M/quarter revenue at $2.3B mcap. |
| *"Warsh will run the economy hot"* | Kalshi rate cut contracts, 3.3x | Semis ETF (SOXL) has 25% thesis beta. Kalshi per-meeting contracts have 90% — and you can win partially. |
| *"SOL flips ETH"* | Long SOL / short ETH perps on Hyperliquid | Buying SOL spot exposes you to market-wide crashes. The ratio trade isolates the thesis. |
| *"AI replaces search"* | GOOG $150 puts, 7.1x | Buying AI companies is consensus and unclear. Shorting the victim (57% of Google's revenue = search ads) has more convexity. |
| *"China AI = defense boom"* | PLTR long + Anduril secondary | Defense ETF has 30% thesis beta. PLTR (55% gov revenue, 40% YoY growth) has 80%. |

Every example follows the same pattern: find the deeper claim → check prediction markets first → evaluate on a 4-dimension rubric (alignment, payoff shape, edge, timing) → output one trade with scenario table and follow-ups.

---

## How It Works

1. **Finds the deeper claim** — your surface observation traces to a specific mechanism. That mechanism points to the real trade.
2. **Checks prediction markets first** — if Kalshi or Polymarket has a contract that directly resolves on your thesis, everything else has to beat 100% thesis beta with zero carry.
3. **Evaluates on a structured rubric** — thesis alignment, payoff shape, edge, timing forgiveness. Head-to-head comparison, not a formula.
4. **Structures the position** — direction theses decompose into independent bets (partial wins > all-or-nothing).
5. **One trade, one screen** — scenario table, kill conditions, conviction breakeven, and follow-up suggestions to refine before executing.

Searches Kalshi, Polymarket, Robinhood, Hyperliquid, Bankr, and private markets automatically.

## Repo Structure

```
SKILL.md              ← the skill (start here)
scripts/adapters/     ← live market API connectors
references/           ← context loaded by SKILL.md when needed
tests/                ← scoring, smoke, e2e, golden tests
```

Everything else (`docs/`, `thoughts/`, `.cursor/`) is development infrastructure — you can ignore it.

## Install

Requires [Bun](https://bun.sh) and [OpenClaw](https://github.com/openclaw/openclaw).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill
bun install
```

Point your OpenClaw skill path to the repo root. Activates automatically when you express a belief — no commands, just talk. Or forward a tweet. Or send a voice note.

No API keys required. Uses public APIs (Yahoo Finance, Polymarket, Kalshi, DexScreener, Hyperliquid).

See [CHANGELOG.md](CHANGELOG.md) for version history and [docs/roadmap.md](docs/roadmap.md) for what's next.

## License

MIT
