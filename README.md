# Belief Router

You have opinions about the world. This turns them into trades.

## What You Can Say

Just talk. The skill figures out what's tradeable.

| You say | What you get back |
|---------|-------------------|
| "Everyone's on Ozempic" | A specific stock to buy, how much it could make, what could go wrong |
| "AI is going to kill Google" | A bet against Google with exact prices and scenarios |
| "Fed won't cut rates in March" | A prediction market contract where $80 pays $1,000 if you're right |
| "SOL is going to flip ETH" | A paired trade that profits on the gap, not the market |
| *paste a YouTube link* | Pulls out every tradeable claim, asks which ones to route |
| *forward a tweet* | Same thing. Screenshot, article, podcast link, all work |

You don't need to know tickers, strike prices, or what a "put" is. You bring the opinion. The skill does the rest.

## What You Get Back

A short explanation of why this is the best way to bet on your idea, then a trade card:

```
IONQ · STOCK · LONG
29 shares @ $34.11 · risk $100

$30.70   [-$100]       thesis wrong, you lose $100
$45.97   [+$344]       starts recovering
$69.48   [+$1,026]     halfway back to highs
$84.64   [+$1,466]     full recovery

+EV above 40% · dies if DARPA rejects, rates stay high
Alt: RGTI $16.09 long (riskier but cheaper)
```

Every card shows: what you buy, how much you risk, what happens if you're right, what happens if you're wrong, and what would kill the trade.

## How It Works

1. **Finds the real trade.** Your surface observation ("everyone's on Ozempic") maps to a deeper claim (GLP-1 distribution is the bottleneck). The deeper claim often points to a different, better trade than the obvious one.
2. **Searches live markets.** Checks stocks, options, prediction markets (Kalshi, Polymarket), crypto perpetuals (Hyperliquid), and private markets automatically. You don't pick the instrument class. It finds the best one.
3. **Picks one winner.** Evaluates every candidate on four dimensions: how directly it matches your thesis, how much you can make vs lose, whether the market has already priced it in, and how forgiving it is if your timing is off. Compares head-to-head. Returns the single best expression.
4. **Shows the downside.** Every card includes a "thesis wrong" row with your dollar loss. No trade without a scenario table.

## What Counts as an Opinion

Anything with a direction. Explicit or implied.

- "I think PLTR is undervalued" (obvious direction)
- "My landlord raised rent 40%" (implies housing inflation accelerating)
- "Nobody I know uses X/Twitter anymore" (implies usage declining)
- A podcast where someone says AI spending will double (paste the link)
- An earnings call transcript (paste it, the skill extracts every claim)

If your input has multiple claims, the skill asks which ones to route. Or you say "scan this" and it routes them all.

## What It Won't Do

- Execute trades for you. It shows you what to buy and where. You press the button.
- Manage your portfolio. It tracks beliefs if you want, but it's not a portfolio manager.
- Give financial advice. Everything is framed as "expressions, not advice."

## Examples

| You say | Skill finds | The insight |
|---------|------------|-------------|
| "Everyone's on Ozempic" | HIMS stock, long | The drug makers (Novo, Lilly) are the obvious play and already priced in. The bottleneck is distribution. HIMS is a telehealth company selling GLP-1s that the market still thinks is a hair loss company. |
| "AI replaces search" | GOOG puts (bet against Google) | Buying AI companies is what everyone is doing. The less crowded trade is betting against the victim. 57% of Google's revenue is search ads. |
| "Fed won't cut in March" | Kalshi NO contract at $0.08 | Pays $1 if you're right. That's 12x your money with a defined max loss. No stock or ETF gives you that kind of payoff on a rate decision. |
| *paste a podcast URL* | Extracts 5-7 claims, routes the best ones | Finds every directional statement, ranks them by how tradeable they are, and deep-routes the top picks. |

## Install

Requires [Bun](https://bun.sh) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill
bun install
```

Add the skill to Claude Code and start talking. No special commands. Just say what you think is going to happen.

No API keys required. Uses public APIs (Yahoo Finance, Kalshi, Polymarket, DexScreener, Hyperliquid).

## Current Stage (v5.4)

X handle scanning via X API (pay-per-use). Say `scan @chamath` or paste any X handle and the skill fetches their recent original posts, filters for directional takes, and routes each one. Mandatory cost gate before any API spend. Caches user ID lookups locally. Graceful fallback when `X_BEARER_TOKEN` is not set. Also: chain self-test + chain-sketch-before-research flow, em dash ban, inline ticker badges reverted (needs skill-side data, not frontend regex).

**What's next:** Shorten Telegram output (link to board instead of full card). Bulk mode speed optimization. Deploy board publicly.

**What's blocked:** Nothing.

## Repo Structure

```
SKILL.md              the skill prompt (start here)
scripts/adapters/     live market API connectors
references/           context loaded by SKILL.md when needed
tests/                scoring, smoke, e2e, golden tests
board/                belief.board web app
  server.ts           Bun.serve() — API + server-rendered cards/permalinks
  db.ts               SQLite store (single source of truth)
  types.ts            Call, User types + derivation chain helpers
  seed.ts             sample data for development
  templates/          server-rendered HTML (card, permalink) for OG previews
  components/         React components (CallCard, Avatar)
  pages/              React pages (Feed, CardDetail, Profile, Leaderboard)
  hooks/              React hooks (useData, useLivePrices)
```

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT
