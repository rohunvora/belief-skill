/**
 * Trade tracker CLI — record beliefs, check PnL, close trades.
 *
 * Usage:
 *   bun run scripts/track.ts record --thesis "..." --platform robinhood --instrument BAH --direction long --entry-price 79.32 [--type stock] [--mode paper]
 *   bun run scripts/track.ts record --thesis "..." --platform robinhood --instrument DJT --direction short --entry-price 0.42 --type option --strike 5 --expiry 2027-01-15 --option-type put
 *   bun run scripts/track.ts list
 *   bun run scripts/track.ts check
 *   bun run scripts/track.ts close --id <trade-id> --exit-price 103.12
 *   bun run scripts/track.ts portfolio [--telegram]
 *   bun run scripts/track.ts alerts
 *   bun run scripts/track.ts leaderboard [--telegram]
 */

import { join } from "path";
import { homedir } from "os";
import type { TrackedTrade, Platform, Direction, InstrumentType, OptionType } from "./types";

const DATA_DIR = join(homedir(), ".belief-router");
const TRADES_FILE = join(DATA_DIR, "trades.json");

// ── Storage helpers ─────────────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  try {
    await Bun.write(join(DATA_DIR, ".keep"), "");
  } catch {
    // Directory may already exist
  }
}

async function loadTrades(): Promise<TrackedTrade[]> {
  const file = Bun.file(TRADES_FILE);
  if (await file.exists()) {
    return (await file.json()) as TrackedTrade[];
  }
  return [];
}

async function saveTrades(trades: TrackedTrade[]): Promise<void> {
  await ensureDataDir();
  await Bun.write(TRADES_FILE, JSON.stringify(trades, null, 2));
}

// ── Price fetchers (per platform) ───────────────────────────────────

async function fetchPrice(platform: Platform, instrument: string): Promise<number | null> {
  try {
    switch (platform) {
      case "robinhood":
        return await fetchYahooPrice(instrument);
      case "hyperliquid":
        return await fetchHyperliquidPrice(instrument);
      case "kalshi":
        return await fetchKalshiPrice(instrument);
      case "bankr":
        return await fetchCoinGeckoPrice(instrument);
      default:
        console.error(`  Unknown platform: ${platform}`);
        return null;
    }
  } catch (err: any) {
    console.error(`  Failed to fetch price for ${instrument} on ${platform}: ${err.message}`);
    return null;
  }
}

async function fetchYahooPrice(ticker: string): Promise<number | null> {
  const YahooFinance = (await import("yahoo-finance2")).default;
  const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const q = await yahooFinance.quote(ticker);
  return q?.regularMarketPrice ?? null;
}

async function fetchHyperliquidPrice(instrument: string): Promise<number | null> {
  const coin = instrument.replace(/-PERP$/i, "");
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
  });
  if (!res.ok) return null;
  const mids = (await res.json()) as Record<string, string>;
  const mid = mids[coin];
  return mid ? parseFloat(mid) : null;
}

async function fetchKalshiPrice(ticker: string): Promise<number | null> {
  const res = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const lastPrice = data?.market?.last_price;
  return typeof lastPrice === "number" ? lastPrice : null;
}

async function fetchCoinGeckoPrice(tokenId: string): Promise<number | null> {
  const id = tokenId.toLowerCase();
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  if (data[id]?.usd) return data[id].usd;

  const searchRes = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${id}`
  );
  if (!searchRes.ok) return null;
  const searchData = (await searchRes.json()) as any;
  const coin = searchData?.coins?.[0];
  if (!coin?.id) return null;

  const priceRes = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd`
  );
  if (!priceRes.ok) return null;
  const priceData = (await priceRes.json()) as any;
  return priceData[coin.id]?.usd ?? null;
}

// ── Options P&L calculation ─────────────────────────────────────────

function calculateOptionValue(trade: TrackedTrade, underlyingPrice: number): { value: number; pnlPct: number } {
  const strike = trade.strike!;
  const premium = trade.premium ?? trade.entry_price;

  let intrinsic = 0;
  if (trade.option_type === "call") {
    intrinsic = Math.max(0, underlyingPrice - strike);
  } else {
    // put
    intrinsic = Math.max(0, strike - underlyingPrice);
  }

  // Simplified: option value ≈ intrinsic (ignoring time value for paper tracking)
  const value = intrinsic;
  const pnlPct = premium > 0 ? ((value - premium) / premium) * 100 : 0;

  return { value, pnlPct };
}

function calculatePnl(trade: TrackedTrade, currentPrice: number): { pnlPct: number; pnlDollars: number } {
  const instrType = trade.instrument_type ?? "stock";

  if (instrType === "option") {
    const { pnlPct } = calculateOptionValue(trade, currentPrice);
    const capital = trade.expression.capital_required || 100;
    return { pnlPct, pnlDollars: (pnlPct / 100) * capital };
  }

  // Stock / perp / binary — standard directional P&L
  const dirMult = trade.expression.direction === "short" || trade.expression.direction === "no" ? -1 : 1;
  const pnlPct = dirMult * ((currentPrice - trade.entry_price) / trade.entry_price) * 100;
  const capital = trade.expression.capital_required || 100;
  return { pnlPct, pnlDollars: (pnlPct / 100) * capital };
}

// ── Commands ────────────────────────────────────────────────────────

async function recordTrade(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const thesis = flags["thesis"];
  const platform = flags["platform"] as Platform;
  const instrument = flags["instrument"];
  const direction = flags["direction"] as Direction;
  const entryPrice = parseFloat(flags["entry-price"] || "");
  const mode = (flags["mode"] as "paper" | "real") || "paper";
  const instrumentType = (flags["type"] as InstrumentType) || "stock";
  const optionType = flags["option-type"] as OptionType | undefined;
  const strike = flags["strike"] ? parseFloat(flags["strike"]) : undefined;
  const expiry = flags["expiry"] || undefined;

  if (!thesis || !platform || !instrument || !direction || isNaN(entryPrice)) {
    console.error("Usage: bun run scripts/track.ts record \\");
    console.error('  --thesis "AI defense spending will boom" \\');
    console.error("  --platform robinhood \\");
    console.error("  --instrument BAH \\");
    console.error("  --direction long \\");
    console.error("  --entry-price 79.32 \\");
    console.error("  [--type stock|option|perp|binary] \\");
    console.error("  [--mode paper|real] \\");
    console.error("  [--strike 5] [--expiry 2027-01-15] [--option-type put|call]");
    process.exit(1);
  }

  if (instrumentType === "option" && (!optionType || !strike)) {
    console.error("Options require --option-type (put/call) and --strike");
    process.exit(1);
  }

  const trades = await loadTrades();
  const id = crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  const trade: TrackedTrade = {
    id,
    thesis,
    thesis_timestamp: now,
    expression: {
      platform,
      instrument: instrument.toUpperCase(),
      instrument_name: instrument.toUpperCase(),
      direction,
      capital_required: 100,
      return_if_right_pct: 0,
      return_if_wrong_pct: 0,
      time_horizon: expiry ? `by ${expiry}` : "",
      leverage: instrumentType === "option" ? 0 : 1, // options have asymmetric leverage
      liquidity: "medium",
      conviction_breakeven_pct: 0,
      platform_risk_tier: platform === "hyperliquid" ? "dex" : platform === "bankr" ? "new" : "regulated",
      execution_details: {},
    },
    entry_price: entryPrice,
    entry_date: now,
    status: "open",
    mode,
    instrument_type: instrumentType,
  };

  // Add option-specific fields
  if (instrumentType === "option") {
    trade.option_type = optionType;
    trade.strike = strike;
    trade.expiry = expiry;
    trade.premium = entryPrice;
  }

  trades.push(trade);
  await saveTrades(trades);

  console.log(`\nRecorded trade ${id}:`);
  console.log(`  Thesis:     "${thesis}"`);
  console.log(`  Platform:   ${platform}`);
  console.log(`  Instrument: ${instrument.toUpperCase()}`);
  console.log(`  Type:       ${instrumentType}`);
  if (instrumentType === "option") {
    console.log(`  Option:     ${optionType?.toUpperCase()} @ $${strike} strike`);
    console.log(`  Premium:    $${entryPrice}`);
    if (expiry) console.log(`  Expiry:     ${expiry}`);
  }
  console.log(`  Direction:  ${direction}`);
  console.log(`  Entry:      $${entryPrice}`);
  console.log(`  Mode:       ${mode}`);
  console.log(`  Date:       ${now.split("T")[0]}`);
  console.log(`\nStored at: ${TRADES_FILE}`);
}

async function listTrades(): Promise<void> {
  const trades = await loadTrades();
  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");

  if (trades.length === 0) {
    console.log("No trades recorded yet. Use 'record' to add one.");
    return;
  }

  if (open.length > 0) {
    console.log(`\nOpen Trades (${open.length}):`);
    console.log("─".repeat(100));
    console.log(
      padR("ID", 10) +
        padR("Thesis", 30) +
        padR("Instrument", 12) +
        padR("Type", 8) +
        padR("Entry", 10) +
        padR("Dir", 8) +
        padR("Mode", 7) +
        "Days"
    );
    console.log("─".repeat(100));
    for (const t of open) {
      const days = Math.floor(
        (Date.now() - new Date(t.entry_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const instrLabel = t.instrument_type === "option"
        ? `${t.option_type?.toUpperCase()} $${t.strike}`
        : (t.instrument_type ?? "stock");
      console.log(
        padR(t.id, 10) +
          padR(truncate(t.thesis, 28), 30) +
          padR(t.expression.instrument, 12) +
          padR(instrLabel, 8) +
          padR(`$${t.entry_price.toFixed(2)}`, 10) +
          padR(t.expression.direction, 8) +
          padR(t.mode ?? "paper", 7) +
          days.toString()
      );
    }
  }

  if (closed.length > 0) {
    console.log(`\nClosed Trades (${closed.length}):`);
    console.log("─".repeat(100));
    console.log(
      padR("ID", 10) +
        padR("Thesis", 30) +
        padR("Instrument", 12) +
        padR("Entry", 10) +
        padR("PnL", 12) +
        "Days"
    );
    console.log("─".repeat(100));
    for (const t of closed) {
      const days = Math.floor(
        (Date.now() - new Date(t.entry_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const pnl = t.pnl_pct != null ? `${t.pnl_pct >= 0 ? "+" : ""}${t.pnl_pct.toFixed(1)}%` : "—";
      console.log(
        padR(t.id, 10) +
          padR(truncate(t.thesis, 28), 30) +
          padR(t.expression.instrument, 12) +
          padR(`$${t.entry_price.toFixed(2)}`, 10) +
          padR(pnl, 12) +
          days.toString()
      );
    }
  }
}

async function checkTrades(): Promise<void> {
  const trades = await loadTrades();
  const open = trades.filter((t) => t.status === "open");

  if (open.length === 0) {
    console.log("No open trades to check.");
    return;
  }

  console.log(`\nChecking ${open.length} open trade(s)...\n`);
  console.log("─".repeat(100));
  console.log(
    padR("ID", 10) +
      padR("Instrument", 12) +
      padR("Type", 8) +
      padR("Entry", 10) +
      padR("Current", 10) +
      padR("PnL %", 10) +
      padR("Days", 6) +
      "Thesis"
  );
  console.log("─".repeat(100));

  for (const trade of open) {
    const currentPrice = await fetchPrice(
      trade.expression.platform,
      trade.expression.instrument
    );

    if (currentPrice != null) {
      const { pnlPct, pnlDollars } = calculatePnl(trade, currentPrice);

      trade.current_price = currentPrice;
      trade.pnl_pct = Math.round(pnlPct * 100) / 100;
      trade.pnl_dollars = Math.round(pnlDollars * 100) / 100;

      const days = Math.floor(
        (Date.now() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const pnlSign = pnlPct >= 0 ? "+" : "";
      const instrType = trade.instrument_type ?? "stock";
      console.log(
        padR(trade.id, 10) +
          padR(trade.expression.instrument, 12) +
          padR(instrType, 8) +
          padR(`$${trade.entry_price.toFixed(2)}`, 10) +
          padR(`$${currentPrice.toFixed(2)}`, 10) +
          padR(`${pnlSign}${pnlPct.toFixed(1)}%`, 10) +
          padR(days.toString(), 6) +
          truncate(trade.thesis, 30)
      );
    } else {
      console.log(
        padR(trade.id, 10) +
          padR(trade.expression.instrument, 12) +
          padR(trade.instrument_type ?? "stock", 8) +
          padR(`$${trade.entry_price.toFixed(2)}`, 10) +
          padR("ERR", 10) +
          padR("—", 10) +
          padR("—", 6) +
          truncate(trade.thesis, 30)
      );
    }
  }

  await saveTrades(trades);
  console.log(`\nUpdated ${TRADES_FILE}`);
}

async function closeTrade(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const id = flags["id"];
  const exitPrice = parseFloat(flags["exit-price"] || "");

  if (!id || isNaN(exitPrice)) {
    console.error("Usage: bun run scripts/track.ts close --id <trade-id> --exit-price 103.12");
    process.exit(1);
  }

  const trades = await loadTrades();
  const trade = trades.find((t) => t.id === id);

  if (!trade) {
    console.error(`Trade "${id}" not found.`);
    process.exit(1);
  }
  if (trade.status === "closed") {
    console.error(`Trade "${id}" is already closed.`);
    process.exit(1);
  }

  // For options: exit-price is the underlying price at close
  // Calculate P&L based on instrument type
  const { pnlPct, pnlDollars } = calculatePnl(trade, exitPrice);

  trade.status = "closed";
  trade.current_price = exitPrice;
  trade.pnl_pct = Math.round(pnlPct * 100) / 100;
  trade.pnl_dollars = Math.round(pnlDollars * 100) / 100;

  await saveTrades(trades);

  const days = Math.floor(
    (Date.now() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const sign = pnlPct >= 0 ? "+" : "";

  console.log(`\nClosed trade ${id}:`);
  console.log(`  Thesis:     "${trade.thesis}"`);
  console.log(`  Instrument: ${trade.expression.instrument} (${trade.expression.platform})`);
  if (trade.instrument_type === "option") {
    console.log(`  Option:     ${trade.option_type?.toUpperCase()} @ $${trade.strike} strike`);
    console.log(`  Premium:    $${trade.premium}`);
  }
  console.log(`  Entry:      $${trade.entry_price.toFixed(2)}`);
  console.log(`  Exit:       $${exitPrice.toFixed(2)}${trade.instrument_type === "option" ? " (underlying)" : ""}`);
  console.log(`  PnL:        ${sign}${pnlPct.toFixed(1)}% (${sign}$${pnlDollars.toFixed(2)} on $100)`);
  console.log(`  Held:       ${days} days`);
}

async function showPortfolio(args: string[]): Promise<void> {
  const telegram = args.includes("--telegram");
  const trades = await loadTrades();
  const open = trades.filter((t) => t.status === "open");

  if (open.length === 0) {
    console.log("No open trades.");
    return;
  }

  let totalPnl = 0;
  let totalCapital = 0;
  const rows: string[] = [];

  for (const t of open) {
    const livePrice = await fetchPrice(t.expression.platform, t.expression.instrument);
    const days = Math.floor(
      (Date.now() - new Date(t.entry_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    let pnlPct = 0;
    let pnlDollars = 0;

    if (livePrice !== null) {
      const result = calculatePnl(t, livePrice);
      pnlPct = result.pnlPct;
      pnlDollars = result.pnlDollars;
    }

    const capital = t.expression.capital_required || 100;
    totalPnl += pnlDollars;
    totalCapital += capital;

    const mode = t.mode === "real" ? "💰" : "📝";
    const sign = pnlPct >= 0 ? "+" : "";
    const ticker = t.expression.instrument.slice(0, 8);
    const instrLabel = t.instrument_type === "option"
      ? `${t.option_type?.charAt(0).toUpperCase()}$${t.strike}`
      : (t.instrument_type ?? "stk").slice(0, 3);
    const thesis = truncate(t.thesis, 20);

    rows.push(
      `${mode} ${padR(ticker, 8)} ${padR(instrLabel, 6)} ${padR(sign + pnlPct.toFixed(1) + "%", 9)} ${padR(days + "d", 5)} ${thesis}`
    );
  }

  const totalSign = totalPnl >= 0 ? "+" : "";
  const totalPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  if (telegram) {
    console.log(`🎯 **Belief Portfolio** (${open.length} open)\n`);
    console.log("```");
    for (const r of rows) console.log(r);
    console.log("─".repeat(45));
    console.log(
      `   TOTAL           ${totalSign}${totalPct.toFixed(1)}%       ${totalSign}$${totalPnl.toFixed(0)}`
    );
    console.log("```");
    console.log(`\n📝 = paper · 💰 = real`);
  } else {
    console.log(`\nBelief Portfolio — ${open.length} open trades\n`);
    for (const r of rows) console.log(r);
    console.log("─".repeat(50));
    console.log(
      `TOTAL: ${totalSign}${totalPct.toFixed(1)}% (${totalSign}$${totalPnl.toFixed(0)} on $${totalCapital.toFixed(0)})`
    );
  }
}

// ── Alerts ───────────────────────────────────────────────────────────

async function checkAlerts(): Promise<void> {
  const trades = await loadTrades();
  const open = trades.filter((t) => t.status === "open");

  if (open.length === 0) {
    console.log("No open trades to check alerts for.");
    return;
  }

  const triggered: any[] = [];
  const checked: any[] = [];

  for (const t of open) {
    if (!t.targets?.length && !t.kill_conditions?.length) continue;

    const livePrice = await fetchPrice(t.expression.platform, t.expression.instrument);
    if (livePrice === null) continue;

    // Check targets
    if (t.targets) {
      for (const target of t.targets) {
        const hit =
          (target.direction === "below" && livePrice <= target.price) ||
          (target.direction === "above" && livePrice >= target.price);

        if (hit && !target.triggered) {
          target.triggered = true;
          triggered.push({
            trade_id: t.id,
            instrument: t.expression.instrument,
            thesis: t.thesis,
            alert_type: "target",
            label: target.label,
            target_price: target.price,
            current_price: livePrice,
            direction: target.direction,
          });
        }

        checked.push({
          trade_id: t.id,
          instrument: t.expression.instrument,
          label: target.label,
          target_price: target.price,
          current_price: livePrice,
          direction: target.direction,
          triggered: hit,
        });
      }
    }

    // Check kill conditions (text-based, just report price context)
    if (t.kill_conditions?.length) {
      for (const kc of t.kill_conditions) {
        checked.push({
          trade_id: t.id,
          instrument: t.expression.instrument,
          kill_condition: kc,
          current_price: livePrice,
          type: "kill_condition",
        });
      }
    }
  }

  await saveTrades(trades);

  // Output as JSON
  const output = {
    checked_at: new Date().toISOString(),
    triggered_alerts: triggered,
    all_checks: checked,
  };

  console.log(JSON.stringify(output, null, 2));

  if (triggered.length > 0) {
    console.error(`\n⚠️  ${triggered.length} alert(s) triggered!`);
  } else if (checked.length > 0) {
    console.error(`\n✅ ${checked.length} check(s), no alerts triggered.`);
  } else {
    console.error(`\nNo targets or kill conditions configured on open trades.`);
  }
}

// ── Leaderboard ──────────────────────────────────────────────────────

async function showLeaderboard(args: string[]): Promise<void> {
  const telegram = args.includes("--telegram");
  const trades = await loadTrades();
  const closed = trades.filter((t) => t.status === "closed" && t.pnl_pct != null);
  const open = trades.filter((t) => t.status === "open");

  if (trades.length === 0) {
    console.log("No trades recorded yet.");
    return;
  }

  function calcStats(list: TrackedTrade[]) {
    const closedList = list.filter((t) => t.status === "closed" && t.pnl_pct != null);
    if (closedList.length === 0) return null;

    const wins = closedList.filter((t) => (t.pnl_pct ?? 0) >= 0);
    const returns = closedList.map((t) => t.pnl_pct!);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const best = closedList.reduce((a, b) => ((a.pnl_pct ?? 0) > (b.pnl_pct ?? 0) ? a : b));
    const worst = closedList.reduce((a, b) => ((a.pnl_pct ?? 0) < (b.pnl_pct ?? 0) ? a : b));

    return {
      total: list.length,
      closed: closedList.length,
      open: list.filter((t) => t.status === "open").length,
      winRate: ((wins.length / closedList.length) * 100).toFixed(0),
      avgReturn: avgReturn.toFixed(1),
      best: { thesis: best.thesis, instrument: best.expression.instrument, pnl: best.pnl_pct!.toFixed(1) },
      worst: { thesis: worst.thesis, instrument: worst.expression.instrument, pnl: worst.pnl_pct!.toFixed(1) },
    };
  }

  const paperTrades = trades.filter((t) => (t.mode ?? "paper") === "paper");
  const realTrades = trades.filter((t) => t.mode === "real");
  const paperStats = calcStats(paperTrades);
  const realStats = calcStats(realTrades);
  const allStats = calcStats(trades);

  if (telegram) {
    console.log("🏆 **Belief Leaderboard**\n");

    if (allStats) {
      console.log(`📊 **Overall** (${allStats.total} trades, ${allStats.closed} closed)`);
      console.log("```");
      console.log(`Win Rate:   ${allStats.winRate}%`);
      console.log(`Avg Return: ${parseFloat(allStats.avgReturn) >= 0 ? "+" : ""}${allStats.avgReturn}%`);
      console.log(`Best Call:  ${allStats.best.instrument} ${parseFloat(allStats.best.pnl) >= 0 ? "+" : ""}${allStats.best.pnl}%`);
      console.log(`            "${truncate(allStats.best.thesis, 35)}"`);
      console.log(`Worst Call: ${allStats.worst.instrument} ${parseFloat(allStats.worst.pnl) >= 0 ? "+" : ""}${allStats.worst.pnl}%`);
      console.log(`            "${truncate(allStats.worst.thesis, 35)}"`);
      console.log("```");
    }

    if (paperStats) {
      console.log(`\n📝 **Paper** (${paperStats.total} trades, ${paperStats.closed} closed)`);
      console.log("```");
      console.log(`Win Rate:   ${paperStats.winRate}%`);
      console.log(`Avg Return: ${parseFloat(paperStats.avgReturn) >= 0 ? "+" : ""}${paperStats.avgReturn}%`);
      console.log("```");
    }

    if (realStats) {
      console.log(`\n💰 **Real** (${realStats.total} trades, ${realStats.closed} closed)`);
      console.log("```");
      console.log(`Win Rate:   ${realStats.winRate}%`);
      console.log(`Avg Return: ${parseFloat(realStats.avgReturn) >= 0 ? "+" : ""}${realStats.avgReturn}%`);
      console.log("```");
    }

    if (!allStats) {
      console.log("No closed trades yet. Close some trades to see stats!");
    }

    if (open.length > 0) {
      console.log(`\n📈 ${open.length} trade(s) still open`);
    }
  } else {
    console.log("\nBelief Leaderboard\n");

    if (allStats) {
      console.log(`Overall: ${allStats.total} trades, ${allStats.closed} closed`);
      console.log(`  Win Rate:   ${allStats.winRate}%`);
      console.log(`  Avg Return: ${allStats.avgReturn}%`);
      console.log(`  Best:       ${allStats.best.instrument} +${allStats.best.pnl}% — "${truncate(allStats.best.thesis, 40)}"`);
      console.log(`  Worst:      ${allStats.worst.instrument} ${allStats.worst.pnl}% — "${truncate(allStats.worst.thesis, 40)}"`);
    }

    if (paperStats) {
      console.log(`\nPaper: ${paperStats.total} trades | Win Rate: ${paperStats.winRate}% | Avg: ${paperStats.avgReturn}%`);
    }
    if (realStats) {
      console.log(`Real: ${realStats.total} trades | Win Rate: ${realStats.winRate}% | Avg: ${realStats.avgReturn}%`);
    }

    if (!allStats) {
      console.log("No closed trades yet.");
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith("--")) {
        flags[key] = val;
        i++;
      }
    }
  }
  return flags;
}

function padR(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 1) + "…" : s;
}

// ── Main ────────────────────────────────────────────────────────────

const command = process.argv[2];
const restArgs = process.argv.slice(3);

switch (command) {
  case "record":
    await recordTrade(restArgs);
    break;
  case "list":
    await listTrades();
    break;
  case "check":
    await checkTrades();
    break;
  case "close":
    await closeTrade(restArgs);
    break;
  case "portfolio":
    await showPortfolio(restArgs);
    break;
  case "alerts":
    await checkAlerts();
    break;
  case "leaderboard":
    await showLeaderboard(restArgs);
    break;
  default:
    console.error("Usage: bun run scripts/track.ts <record|list|check|close|portfolio|alerts|leaderboard> [options]");
    console.error("");
    console.error("Commands:");
    console.error("  record       --thesis ... --platform ... --instrument ... --direction ... --entry-price ... [--type stock|option] [--mode paper|real]");
    console.error("  list         Show all trades");
    console.error("  check        Fetch live prices and show PnL for open trades");
    console.error("  close        --id <trade-id> --exit-price ...");
    console.error("  portfolio    [--telegram] Show portfolio summary with live P&L");
    console.error("  alerts       Check price alerts against targets and kill conditions");
    console.error("  leaderboard  [--telegram] Show win rate, avg return, best/worst calls");
    process.exit(1);
}
