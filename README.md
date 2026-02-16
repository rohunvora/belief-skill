# Belief Router

You already have beliefs about the world. You just don't realize they're trades.

Every day you say things like:

- *"Everyone's on Ozempic"*
- *"My rent just spiked 40%"*
- *"AI is going to replace Google search"*
- *"This Trump stuff feels like it's jumping the shark"*
- *"Nobody I know uses Uber Eats anymore"*

These aren't just observations. Each one is a directional bet on something specific — a company, a commodity, a trend, a policy outcome. The problem isn't that you lack conviction. It's that you've never connected your worldview to the instruments that let you profit from it.

**Most people's beliefs die as tweets.** The few who do act usually buy the obvious ticker — and the obvious ticker is already priced in.

## What If You Could Just... Say It?

Belief Router is an [OpenClaw](https://github.com/openclaw/openclaw) skill. You talk to it like a person — voice note, text, pasted tweet, whatever — and it finds the single highest-upside way to express your belief across prediction markets, options, equities, crypto, and private markets.

The key insight: **the best trade is almost never the obvious one.**

| You say | Obvious trade | What the skill finds |
|---------|--------------|---------------------|
| *"Everyone's on Ozempic"* | Buy Novo Nordisk | Short DoorDash — the second-order victim is more mispriced than the winner |
| *"Meme politics are dead"* | Short... something? | DJT Jan '27 $5 puts — 11x if right, defined $100K max loss |
| *"Warsh will run the economy hot"* | Buy semis ETF (1.3x) | Kalshi per-meeting rate cuts — 3 independent bets, 3.3x, 90% thesis beta |
| *"China catching up in AI = military threat"* | Buy defense ETF | PLTR + CRWD at specific entries — highest beta to AI defense spending |
| *"St. John's wins tonight"* | DraftKings bet | Polymarket moneyline — better odds, no house edge, can exit early |
| *"Long peptides"* | Buy Eli Lilly | NVO at $49, down 47%, 18x PE vs LLY at 55x — same thesis, third the price |

The skill traces your belief through its causal chain — who benefits, who gets hurt, what infrastructure is needed, what breaks — and finds where the asymmetry actually lives. Then it scores every candidate on one metric:

```
thesis beta × convexity / (1 + time cost)
```

No gut feel. No defaults. The math picks the instrument.

## Try It

Think about something you believe is true that most people don't. Or something everyone knows but nobody's acting on. Say it out loud.

That's a thesis. And there's probably a trade on it.

Some starting points:

- A product you love that nobody talks about
- An industry you think is dying
- A technology that's about to break through
- A country that's underestimated
- A policy that's going to backfire
- A person whose stock (literal or figurative) is mispriced
- A sports team that's better than their odds suggest
- A trend you noticed before your friends did

## How It Works

1. **Finds the deeper claim** — your surface observation traces to a specific mechanism. That mechanism points to the real trade.
2. **Checks prediction markets first** — if Kalshi or Polymarket has a contract that directly resolves on your thesis, everything else has to beat 100% thesis beta with zero carry cost.
3. **Scores every candidate** — thesis beta (how much of the move comes from YOUR thesis), convexity (upside multiple), time cost (what it costs to hold). One metric, no bias toward any instrument type.
4. **Structures the position** — decomposes direction theses into independent bets so you can win partially, not all-or-nothing.
5. **One trade, one screen** — scenario table at $100K, kill conditions, conviction breakeven, and an alt from a different instrument class. Fits on your phone.

Searches 6 platforms automatically — Kalshi, Polymarket, Robinhood, Hyperliquid, Bankr, and private markets (Republic, Wefunder, Crunchbase). You don't pick the platform. The skill picks it based on where your thesis is best expressed.

## Paper Trading

Not ready to put real money down? Every trade card has a 📝 **Paper Trade** button. Track your beliefs like a portfolio and see which types of predictions you're actually good at.

```bash
bun run scripts/track.ts portfolio    # see all your open beliefs + live P&L
bun run scripts/card.ts --id <ID>     # shareable trade card with results
```

## Install

Requires [Bun](https://bun.sh) and [OpenClaw](https://github.com/openclaw/openclaw).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill/v2/belief-router
bun install
```

Point your OpenClaw skill path to `v2/belief-router`. The skill activates automatically when you express a belief — no slash commands, no special syntax. Just talk.

No API keys required. Adapters use public APIs (Yahoo Finance, Polymarket, Kalshi, DexScreener).

## Repo Structure

```
v2/belief-router/          ← current version
  SKILL.md                 ← the routing brain (500 lines)
  scripts/
    track.ts               ← trade tracking + portfolio
    card.ts                ← shareable trade cards
    adapters/              ← kalshi, polymarket, robinhood,
                              hyperliquid, bankr, angel

v1/                        ← legacy (48/48 automated test suite)
```

See [CHANGELOG.md](CHANGELOG.md) for version history and roadmap.

## License

MIT
