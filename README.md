# Belief Router

You have opinions about the world. You probably don't know the best way to bet on them.

*"Everyone's on Ozempic"* — do you buy Novo Nordisk? Short DoorDash? Buy Kalshi contracts on FDA approval? The answer depends on where the asymmetry actually is, and most people never find it because the research takes hours and spans platforms they've never used.

**Belief Router is an [OpenClaw](https://github.com/openclaw/openclaw) skill that turns any belief into a specific trade.** Say what you think will happen in plain English — voice note, text, pasted tweet — and get back the single highest-upside way to express it across prediction markets, options, equities, crypto, and private markets.

## What You Can Do With It

**Trade your worldview, not just tickers.** You don't need to know what a put option is or how Kalshi works. You just need an opinion.

- *"Meme politics are dead"* → DJT Jan 2027 $5 puts, 11x if right, $100K max loss
- *"China is catching up in AI — that means defense spending booms"* → PLTR + CRWD basket with specific entry prices and sizing
- *"Kevin Warsh will run the economy hot"* → Kalshi per-meeting rate cut contracts, 3 independent bets, 3.3x max, partial wins possible
- *"Long peptides"* → NVO at $49 (down 47% from highs, 18x PE vs Eli Lilly at 55x)
- *"St. John's wins tonight"* → Polymarket moneyline at 69¢, better odds than DraftKings with no house edge
- *"I want to monetize US-China geopolitical risk"* → KWEB Jan 2027 $22 puts, 9-16x on major escalation

**Works for anything with a direction:** macro, politics, crypto, sports, culture, tech, geopolitics. If you can say *"I think X will happen"*, it can route it.

## How It Works

1. **Finds the real trade** — the obvious instrument is usually priced in. The skill traces your belief to the second- or third-order consequence where the asymmetry lives. *"Everyone's on Ozempic"* → the play isn't pharma (consensus), it's shorting food delivery (the victim).

2. **Checks prediction markets first** — if Kalshi or Polymarket has a contract that literally resolves on your thesis, everything else has to beat it. Why buy an ETF at 30% thesis beta when a binary contract gives you 100%?

3. **Scores every candidate on one metric** — `thesis beta × convexity / (1 + time cost)`. No gut feel, no defaults. A Kalshi binary at 12x with 100% thesis beta beats a sector ETF at 1.3x with 30% thesis beta every time.

4. **Gives you one trade, one screen** — scenario table at $100K sizing, kill conditions, conviction breakeven ("you need to be right >25% of the time for this to be +EV"), and an alternative from a different instrument class. Fits on your phone.

## Platforms

Searches across 6 platforms automatically:

| Platform | What |
|----------|------|
| **Kalshi** | Prediction markets — politics, macro, events |
| **Polymarket** | Prediction markets — politics, crypto, sports (NBA, NFL, MLB, NHL, NCAAB) |
| **Robinhood** | Stocks, ETFs, options |
| **Hyperliquid** | Crypto perps with leverage, pair trades |
| **Bankr** | AI agent tokens |
| **Angel** | Private markets — Republic, Wefunder, Crunchbase |

You don't pick the platform. The skill picks it based on where the best expression of your thesis lives.

## Paper Trading

Every trade card comes with buttons:

- 📝 **Paper Trade** — record at current price, track P&L over time
- ✅ **I Took This** — record as real
- 🔗 **Open in Platform** — deep link to execute

```bash
bun run scripts/track.ts portfolio --telegram   # live P&L for all open beliefs
bun run scripts/card.ts --id <ID> --telegram     # shareable trade card with results
```

Track your beliefs like a portfolio. See which types of theses you're good at predicting and which ones you're not.

## Install

Requires [Bun](https://bun.sh) and [OpenClaw](https://github.com/openclaw/openclaw).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill/v2/belief-router
bun install
```

Point your OpenClaw skill path to the `v2/belief-router` directory. The skill activates automatically when you express a belief with trading implications — no slash commands, no special syntax.

**No API keys required for basic usage.** Adapters call public APIs (Yahoo Finance, DexScreener, Polymarket, Kalshi). Your OpenClaw instance handles web search for live research.

## Repo Structure

```
v2/belief-router/          ← current version
  SKILL.md                 ← the routing spec (500 lines)
  scripts/
    track.ts               ← trade tracking + portfolio
    card.ts                ← shareable trade cards
    adapters/
      kalshi/              ← prediction markets
      polymarket/          ← prediction markets + sports
      robinhood/           ← stocks, ETFs, options
      hyperliquid/         ← crypto perps
      bankr/               ← AI agent tokens
      angel/               ← private markets

v1/                        ← legacy version (48/48 automated test suite)
```

## License

MIT
