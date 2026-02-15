/**
 * Trade tracker CLI — record beliefs, check PnL, close trades.
 *
 * Usage:
 *   bun run scripts/track.ts record --thesis "AI defense spending will boom" --platform robinhood --instrument BAH --direction long --entry-price 79.32
 *   bun run scripts/track.ts list
 *   bun run scripts/track.ts check
 *   bun run scripts/track.ts close --id <trade-id> --exit-price 103.12
 */

import { join } from "path";
import { homedir } from "os";
import type { TrackedTrade, Platform, Direction } from "./types";

const DATA_DIR = join(homedir(), ".belief-router");
const TRADES_FILE = join(DATA_DIR, "trades.json");

// ── Storage helpers ─────────────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  const dir = Bun.file(DATA_DIR);
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
  // Use yahoo-finance2 via dynamic import
  const YahooFinance = (await import("yahoo-finance2")).default;
  const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const q = await yahooFinance.quote(ticker);
  return q?.regularMarketPrice ?? null;
}

async function fetchHyperliquidPrice(instrument: string): Promise<number | null> {
  // Strip "-PERP" suffix if present
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
  // last_price is in cents (0-100 representing probability)
  const lastPrice = data?.market?.last_price;
  return typeof lastPrice === "number" ? lastPrice : null;
}

async function fetchCoinGeckoPrice(tokenId: string): Promise<number | null> {
  // Try as coingecko ID first, then as symbol search
  const id = tokenId.toLowerCase();
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  if (data[id]?.usd) return data[id].usd;

  // Fallback: search by symbol
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

// ── Commands ────────────────────────────────────────────────────────

async function recordTrade(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const thesis = flags["thesis"];
  const platform = flags["platform"] as Platform;
  const instrument = flags["instrument"];
  const direction = flags["direction"] as Direction;
  const entryPrice = parseFloat(flags["entry-price"] || "");

  if (!thesis || !platform || !instrument || !direction || isNaN(entryPrice)) {
    console.error("Usage: bun run scripts/track.ts record \\");
    console.error('  --thesis "AI defense spending will boom" \\');
    console.error("  --platform robinhood \\");
    console.error("  --instrument BAH \\");
    console.error("  --direction long \\");
    console.error("  --entry-price 79.32");
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
      time_horizon: "",
      leverage: 1,
      liquidity: "medium",
      conviction_breakeven_pct: 0,
      platform_risk_tier: platform === "hyperliquid" ? "dex" : platform === "bankr" ? "new" : "regulated",
      execution_details: {},
    },
    entry_price: entryPrice,
    entry_date: now,
    status: "open",
  };

  trades.push(trade);
  await saveTrades(trades);

  console.log(`\nRecorded trade ${id}:`);
  console.log(`  Thesis:     "${thesis}"`);
  console.log(`  Platform:   ${platform}`);
  console.log(`  Instrument: ${instrument.toUpperCase()}`);
  console.log(`  Direction:  ${direction}`);
  console.log(`  Entry:      $${entryPrice}`);
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
    console.log("─".repeat(90));
    console.log(
      padR("ID", 10) +
        padR("Thesis", 35) +
        padR("Instrument", 12) +
        padR("Entry", 10) +
        padR("Direction", 10) +
        "Days"
    );
    console.log("─".repeat(90));
    for (const t of open) {
      const days = Math.floor(
        (Date.now() - new Date(t.entry_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(
        padR(t.id, 10) +
          padR(truncate(t.thesis, 33), 35) +
          padR(t.expression.instrument, 12) +
          padR(`$${t.entry_price.toFixed(2)}`, 10) +
          padR(t.expression.direction, 10) +
          days.toString()
      );
    }
  }

  if (closed.length > 0) {
    console.log(`\nClosed Trades (${closed.length}):`);
    console.log("─".repeat(100));
    console.log(
      padR("ID", 10) +
        padR("Thesis", 35) +
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
          padR(truncate(t.thesis, 33), 35) +
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
      padR("Entry", 10) +
      padR("Current", 10) +
      padR("PnL $", 10) +
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
      const dirMult = trade.expression.direction === "short" || trade.expression.direction === "no" ? -1 : 1;
      const pnlPct = dirMult * ((currentPrice - trade.entry_price) / trade.entry_price) * 100;
      // Assume $100 capital for dollar PnL
      const pnlDollars = pnlPct;

      trade.current_price = currentPrice;
      trade.pnl_pct = Math.round(pnlPct * 100) / 100;
      trade.pnl_dollars = Math.round(pnlDollars * 100) / 100;

      const days = Math.floor(
        (Date.now() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const pnlSign = pnlPct >= 0 ? "+" : "";
      console.log(
        padR(trade.id, 10) +
          padR(trade.expression.instrument, 12) +
          padR(`$${trade.entry_price.toFixed(2)}`, 10) +
          padR(`$${currentPrice.toFixed(2)}`, 10) +
          padR(`${pnlSign}$${pnlDollars.toFixed(2)}`, 10) +
          padR(`${pnlSign}${pnlPct.toFixed(1)}%`, 10) +
          padR(days.toString(), 6) +
          truncate(trade.thesis, 30)
      );
    } else {
      console.log(
        padR(trade.id, 10) +
          padR(trade.expression.instrument, 12) +
          padR(`$${trade.entry_price.toFixed(2)}`, 10) +
          padR("ERR", 10) +
          padR("—", 10) +
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

  const dirMult = trade.expression.direction === "short" || trade.expression.direction === "no" ? -1 : 1;
  const pnlPct = dirMult * ((exitPrice - trade.entry_price) / trade.entry_price) * 100;
  const pnlDollars = pnlPct; // $100 capital

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
  console.log(`  Entry:      $${trade.entry_price.toFixed(2)}`);
  console.log(`  Exit:       $${exitPrice.toFixed(2)}`);
  console.log(`  PnL:        ${sign}${pnlPct.toFixed(1)}% (${sign}$${pnlDollars.toFixed(2)} on $100)`);
  console.log(`  Held:       ${days} days`);
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
  default:
    console.error("Usage: bun run scripts/track.ts <record|list|check|close> [options]");
    console.error("");
    console.error("Commands:");
    console.error("  record  --thesis ... --platform ... --instrument ... --direction ... --entry-price ...");
    console.error("  list    Show all trades");
    console.error("  check   Fetch live prices and show PnL for open trades");
    console.error("  close   --id <trade-id> --exit-price ...");
    process.exit(1);
}
