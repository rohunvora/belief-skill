# Belief Router v2.0 — Stores Trades

The skill routes beliefs into trades. v2.0 makes them executable, trackable, and shareable.

---

## P0: Screenshot Format (the viral moment)

The screenshot of input → output → button IS the product. Everything serves it.

- [ ] **SKILL.md Phase 5 rewrite** — ≤18 lines output rule, zero preamble (first char is 🎯), 4-row scenario table max, 2-line WHY max, compressed kills/alt
- [ ] **Kill all internal reasoning from output** — no Phase headers, no "interesting thesis", no "running it through". Answer-first means FIRST character.
- [ ] **Inline button row on every trade card** — `[Buy {qty} {TICKER} → {Platform}]` `[📝 Track]`. Quantity in button = proof of construction.
- [ ] **Button text templates by instrument type:**
  - Stock: `Buy 25,974 LAES → Robinhood`
  - Put: `Buy 238 DJT $5P Jan'27 → Robinhood`
  - Kalshi: `Buy 3,703 KXFED NO → Kalshi`
  - Perp: `Long SOL 3x → Hyperliquid`
  - Polymarket: `Buy 1,538 YES → Polymarket`

## P0: Trade Storage

Every routed belief gets stored. The portfolio of beliefs IS the product.

- [ ] **SQLite schema** — `beliefs.db` with three tables:
  - `theses` (id, raw_input, deeper_claim, shape, created_at)
  - `routings` (id, thesis_id, instrument, platform, direction, entry_price, qty, thesis_beta, convexity, time_cost, score, created_at)
  - `trades` (id, routing_id, mode [paper|real], status [open|closed], entry_price, exit_price, pnl, opened_at, closed_at)
- [ ] **Auto-record on route** — every skill invocation writes a thesis + routing row. No button needed to log.
- [ ] **📝 Track button** — creates a `trade` row in paper mode at current price
- [ ] **✅ I Took This button** — creates a `trade` row in real mode
- [ ] **Portfolio command** — `bun run scripts/track.ts portfolio` reads from SQLite, fetches live prices, shows P&L
- [ ] **Close flow** — button or command to close a trade with exit price, calculates realized P&L

## P1: Execution Layer

Tap the button → confirm → trade placed. No leaving Telegram.

### Kalshi (has API, regulated)
- [ ] **Auth flow** — Kalshi API key storage in `~/.config/env/`
- [ ] **Place order** — `POST /trade/orders` with contract ticker, side, quantity, price
- [ ] **Confirm step** — button tap → "Confirm: 3,703 KXFED-26JUL NO @ $0.27 ($1,000)?" `[✅ Confirm]` `[❌ Cancel]`
- [ ] **Execution receipt** — on confirm, place order, return fill details, auto-record trade

### Polymarket (has API, crypto)
- [ ] **Auth flow** — wallet connection (needs private key or delegated signing)
- [ ] **Place order** — CLOB API with signed order
- [ ] **Confirm + receipt flow** (same pattern as Kalshi)

### Hyperliquid (has API, crypto)
- [ ] **Auth flow** — wallet/API key
- [ ] **Place order** — REST API for perp orders with leverage
- [ ] **Confirm + receipt flow**

### Robinhood (no API)
- [ ] **Deep link** — opens `robinhood.com/stocks/{TICKER}` or options chain URL
- [ ] **Execution guidance** — step-by-step text matching Robinhood UI ("Tap Buy → Shares → 25,974 → Review → Submit")
- [ ] **Screenshot confirmation** — user screenshots their Robinhood confirm → skill OCRs it → books the trade
- [ ] **OCR parser** — extract ticker, qty, price, fill from Robinhood confirmation screenshot

## P1: Live Tracking

Once trades exist, keep them alive.

- [ ] **Price alerts** — monitor kill conditions and scenario targets from the trade card
- [ ] **Portfolio dashboard** — all open beliefs with live P&L, sortable by thesis beta / age / return
- [ ] **Close triggers** — when kill condition fires or target hits, alert user with original thesis context
- [ ] **Daily P&L digest** — optional daily summary of all open positions

## P2: Trade Cards (viral distribution)

The shareable artifact that spreads the product.

- [ ] **Card generator** — `bun run scripts/card.ts --id {ID}` outputs image or formatted text
- [ ] **Card format** — thesis title + instrument + entry + current + P&L + verdict emoji (🟢/🔴)
- [ ] **Telegram share** — inline button `[Share This Call]` generates card + forwards
- [ ] **"I Called It" mode** — when trade is closed green, card shows the full arc: input tweet → trade → result

## P2: Calibration Engine

Track what you're good at predicting.

- [ ] **Edge Profile** — computed from closed trades. Which thesis shapes do you win on? Which platforms? What conviction breakeven do you actually hit?
- [ ] **Win rate by shape** — binary, mispriced company, sector/theme, relative value, vulnerability
- [ ] **Thesis accuracy vs instrument accuracy** — did you get the thesis right but pick the wrong instrument? Or wrong thesis entirely?
- [ ] **Feedback loop** — edge profile feeds back into routing ("your binary event theses have 70% hit rate — lean into Kalshi")

## P3: Multi-Platform Awareness

- [ ] **Wallet/account registry** — user configures which platforms they have access to (Robinhood, Kalshi, Hyperliquid, Polymarket)
- [ ] **Platform-aware routing** — if user doesn't have Kalshi, don't route there (or flag "you'd need a Kalshi account for this")
- [ ] **Multi-wallet crypto** — knows which wallet is for which chain

## P3: Visual Frontend

- [ ] **Localhost dashboard** — portfolio view, thesis history, edge profile charts
- [ ] **Remotion-style pattern** — OpenClaw skill spins up local web server, opens in browser
- [ ] **Real-time updates** — WebSocket from SQLite changes to dashboard

---

## Build Order

```
Week 1:  P0 (screenshot format + SQLite + buttons)
Week 2:  P1 execution (Kalshi first — regulated, clean API)
Week 3:  P1 execution (Polymarket + Hyperliquid) + live tracking
Week 4:  P2 trade cards + calibration engine foundation
Ongoing: P3 (frontend, multi-platform, polish)
```

## Definition of Done

v2.0 ships when:
1. ✅ Every belief routes to a trade card that fits in one screenshot
2. ✅ Every trade card has working buttons (Track + Execute/Link)
3. ✅ All trades stored in SQLite with thesis → routing → trade chain
4. ✅ At least one platform has real execution (Kalshi)
5. ✅ Portfolio command shows all open beliefs with live P&L
