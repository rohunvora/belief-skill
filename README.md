# Belief Router

You already have beliefs about the world. You just don't realize they're trades.

*"Everyone's on Ozempic." "AI is going to replace search." "This Trump stuff is jumping the shark."*

These aren't just observations — each one is a directional bet. The problem isn't conviction. It's that you've never connected your worldview to the instruments that let you profit from it.

**Belief Router is an [OpenClaw](https://github.com/openclaw/openclaw) skill that turns what you think into what you trade.** Voice note, text, pasted tweet — say what you believe and get the single best way to express it.

---

## Examples

Real outputs from the skill. Each started as a casual observation.

---

**"Everyone's on Ozempic"**

> 🎯 **GLP-1 kills food delivery**
>
> DASH $160 · Jan '27 $140 Put @ $10.70
>
> Ozempic/GLP-1 adoption is accelerating — 6% of US adults on it, projected 13% by 2027. The obvious play (long NVO/LLY) is priced in at 55x PE. The victim isn't. DoorDash gets 78% of revenue from food delivery. Every GLP-1 patient reduces caloric intake ~30%. DASH is down 44% from highs but still trading at 150x PE on shrinking unit economics.
>
> `$100K → 93 contracts`
>
> ```
> DASH $180   lose $100K   GLP-1 adoption slows
> DASH $160   lose $60K    nothing changes
> DASH $120      2.9x      adoption accelerates
> DASH $100      4.7x      food delivery recession
> DASH $80       7.5x      structural decline
> ```
>
> 38% to be +EV · dies if: GLP-1 side effects scare, DASH pivots to grocery, FDA restrictions
>
> Alt: NVO $49.57 long (down 47% from highs, 18x PE — same thesis, buy the winner instead of shorting the loser)
>
> Robinhood → DASH → Options → Jan 2027 $140 Put

---

**"Warsh will run the economy hot"**

> 🎯 **Warsh means rate cuts**
>
> Kalshi KXFED-26JUL-T3.50 NO @ $0.27 + KXFED-26OCT-T3.50 NO @ $0.27 + KXFED-26DEC-T3.50 NO @ $0.31
>
> Warsh is 96% confirmed as Fed chair. His thesis: keep money loose so American AI dominates. The obvious trade (buy semis ETF) has 25% thesis beta — mostly moves on earnings, not Fed policy. Kalshi per-meeting rate contracts are 90% thesis beta. You're betting on 3 independent meetings — partial wins possible. Each contract pays $1 if rates drop below 3.50% by that meeting.
>
> `$100K → ~$33K per meeting × 3`
>
> ```
> 0/3 hit    lose $100K   Warsh is hawkish
> 1/3 hit       1.2x      one cut comes through
> 2/3 hit       2.2x      two cuts
> 3/3 hit       3.3x      full dovish pivot
> ```
>
> 30% to be +EV · dies if: inflation re-accelerates, Warsh pivots hawkish, Senate blocks
>
> Alt: TLT $87 long (rates down = bonds up, but only 35% thesis beta — moves on everything, not just Warsh)
>
> Kalshi → KXFED-26JUL / 26OCT / 26DEC → NO on "above 3.50%"

---

**"Meme politics are dead"**

> 🎯 **Trump media collapse**
>
> DJT $10.98 · Jan '27 $5 Put @ $0.42
>
> The Trump admin meme governance era is hitting cultural fatigue — Pokémon ICE content, Obama calling it a "clown show." DJT (Trump Media) is a pure sentiment stock with no real revenue ($1M/quarter). It's down 64% from highs but still trades at $2.3B market cap on vibes alone. If the political entertainment value fades, the floor drops out.
>
> `$100K → 2,380 contracts`
>
> ```
> DJT $15    lose $100K   meme politics revive
> DJT $11    lose $85K    status quo
> DJT $5        1.0x      cultural fatigue plays out
> DJT $3        5.7x      full collapse
> DJT $1       11.0x      delistable
> ```
>
> 25% to be +EV · dies if: Trump rally, new viral political moment, DJT acquisition
>
> Alt: KWEB $32.79 long (bet on the geopolitical beneficiary instead — but only 25% thesis beta)
>
> Robinhood → DJT → Options → Jan 2027 $5 Put

---

**"SOL is going to flip ETH"**

> 🎯 **SOL/ETH ratio trade**
>
> Hyperliquid · Long SOL-PERP / Short ETH-PERP · 3x leverage
>
> You're betting on the ratio, not the market. If both crash 50%, you're flat. If SOL outperforms ETH by 40%, you make 40% × 3x = 120% regardless of market direction. Current ratio: 0.0435. SOL at $84.88, ETH at $1,952. Funding cost ~8%/yr net — acceptable for a 6-month thesis.
>
> `$100K → $50K long SOL / $50K short ETH @ 3x`
>
> ```
> ratio -30%   lose $90K    ETH rallies harder
> ratio -10%   lose $30K    mean reversion
> ratio +20%      1.6x      SOL gains ground
> ratio +50%      2.5x      SOL approaches flip
> ratio +100%     4.0x      ratio doubles
> ```
>
> 40% to be +EV · dies if: ETH ships scaling breakthrough, SOL has extended outage, funding flips negative
>
> Alt: SOL spot long (simpler, but exposed to market-wide drawdowns — ratio trade isolates the thesis)
>
> Hyperliquid → SOL-PERP long + ETH-PERP short → 3x

---

**"AI is going to replace search"**

> 🎯 **Google is the victim**
>
> GOOG $178 · Jan '27 $150 Put @ $8.20
>
> Everyone's buying AI companies. But the obvious winner (who?) is unclear and consensus. The obvious loser is Google — 57% of revenue from search ads, and AI answers skip the ad. GOOG is down 28% from highs, analysts still rate it a buy, and the options market implies only 30% chance of breaking $150. If AI search hits 20%+ market share by end of 2026, Google's ad pricing power collapses.
>
> `$100K → 121 contracts`
>
> ```
> GOOG $200   lose $100K   search moat holds
> GOOG $178   lose $75K    slow bleed
> GOOG $140      2.2x      AI search at 15%+
> GOOG $120      4.6x      advertiser exodus
> GOOG $100      7.1x      structural decline
> ```
>
> 30% to be +EV · dies if: Google's AI integration retains ad model, ChatGPT/Perplexity monetization fails, antitrust breakup unlocks value
>
> Alt: Long MSFT (AI search winner via Copilot — but only ~15% of rev from search, low thesis beta)
>
> Robinhood → GOOG → Options → Jan 2027 $150 Put

---

**"China catching up in AI means defense spending booms"**

> 🎯 **AI defense spending**
>
> PLTR $113 · long
>
> China is closing the AI gap — DeepSeek R1 matched GPT-4 at 3% the cost. The US response isn't commercial AI competition, it's military AI spending. PLTR gets 55% of revenue from government/defense, growing 40% YoY. It's the highest-beta public stock to AI defense budgets. Expensive at 208x PE, but defense AI budgets don't care about PE ratios — they care about capability.
>
> `$100K → 884 shares`
>
> ```
> PLTR $80    lose $29K    defense AI budget cuts
> PLTR $100   lose $11K    growth slows
> PLTR $150      1.3x      steady growth
> PLTR $200      1.8x      major DOD contracts
> PLTR $300      2.7x      AI Manhattan Project
> ```
>
> 45% to be +EV · dies if: DOGE cuts defense tech budgets, PLTR loses contracts to Anduril, China de-escalation
>
> Alt: Anduril secondary @ $102.50/share ($70B implied) — pure-play defense AI, but illiquid, 2-4yr lockup
>
> Robinhood → PLTR → Buy

---

## How It Works

1. **Finds the deeper claim** — *"everyone's on Ozempic"* → the play isn't pharma (consensus), it's shorting food delivery (the victim)
2. **Checks prediction markets first** — if Kalshi or Polymarket has a direct contract, everything else has to beat 100% thesis beta
3. **Scores on one metric** — `thesis beta × convexity / (1 + time cost)` — no gut feel, no defaults
4. **Structures the position** — direction theses decompose into independent bets (partial wins > all-or-nothing)
5. **One trade, one screen** — scenario table, kill conditions, conviction breakeven, alt from a different class

Searches Kalshi, Polymarket, Robinhood, Hyperliquid, Bankr, and private markets automatically. You don't pick the platform.

## Paper Trading

Not ready for real money? Every trade card has a 📝 **Paper Trade** button. Track beliefs like a portfolio.

```bash
bun run scripts/track.ts portfolio    # all open beliefs + live P&L
bun run scripts/card.ts --id <ID>     # shareable trade card
```

## Install

Requires [Bun](https://bun.sh) and [OpenClaw](https://github.com/openclaw/openclaw).

```bash
git clone https://github.com/rohunvora/belief-skill.git
cd belief-skill/v2/belief-router
bun install
```

Point your OpenClaw skill path to `v2/belief-router`. Activates automatically when you express a belief — no commands, just talk.

No API keys required. Uses public APIs (Yahoo Finance, Polymarket, Kalshi, DexScreener).

See [CHANGELOG.md](CHANGELOG.md) for version history and roadmap.

## License

MIT
