/**
 * Trade tracker CLI — SQLite-backed belief portfolio.
 *
 * Usage:
 *   bun run scripts/track.ts record --thesis "..." --platform robinhood --instrument LAES --direction long --entry-price 3.85 [--mode paper] [--qty 25974] [--shape mispriced] [--deeper-claim "..."] [--thesis-beta 0.85] [--convexity 3.9] [--time-cost 0] [--kills "NIST delays, cash burn"] [--alt "ARQQ $17 (quantum encryption)"]
 *   bun run scripts/track.ts portfolio [--telegram]
 *   bun run scripts/track.ts close --id <trade-id> --exit-price 8.70
 *   bun run scripts/track.ts history [--limit 20]
 *   bun run scripts/track.ts check
 */

import {
  recordRouting, openTrade, closeTrade as dbClose,
  getOpenTrades, getClosedTrades, getRecentRoutings,
  findSimilarTheses, getDb
} from "./db";

// ── Price fetchers ──────────────────────────────────────────────────

async function fetchPrice(platform: string, instrument: string): Promise<number | null> {
  try {
    switch (platform) {
      case "robinhood": return await fetchYahooPrice(instrument);
      case "hyperliquid": return await fetchHLPrice(instrument);
      case "kalshi": return await fetchKalshiPrice(instrument);
      case "polymarket": return null; // TODO: fetch from gamma-api
      default: return null;
    }
  } catch { return null; }
}

async function fetchYahooPrice(ticker: string): Promise<number | null> {
  const YF = (await import("yahoo-finance2")).default;
  const yf = new YF({ suppressNotices: ["yahooSurvey"] });
  const q = await yf.quote(ticker.replace(/-PERP$/i, ""));
  return q?.regularMarketPrice ?? null;
}

async function fetchHLPrice(instrument: string): Promise<number | null> {
  const coin = instrument.replace(/-PERP$/i, "");
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
  });
  if (!res.ok) return null;
  const mids = (await res.json()) as Record<string, string>;
  return mids[coin] ? parseFloat(mids[coin]) : null;
}

async function fetchKalshiPrice(ticker: string): Promise<number | null> {
  const res = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return data?.market?.last_price ?? null;
}

// ── Commands ────────────────────────────────────────────────────────

async function record(args: string[]) {
  const f = parseFlags(args);
  const thesis = f["thesis"];
  const platform = f["platform"];
  const instrument = f["instrument"];
  const direction = f["direction"];
  const entryPrice = parseFloat(f["entry-price"] || "");
  const mode = (f["mode"] || "paper") as "paper" | "real";

  if (!thesis || !platform || !instrument || !direction || isNaN(entryPrice)) {
    console.error("Usage: bun run scripts/track.ts record --thesis \"...\" --platform robinhood --instrument LAES --direction long --entry-price 3.85");
    process.exit(1);
  }

  const qty = parseFloat(f["qty"] || "0") || Math.floor(100000 / entryPrice);

  const { thesisId, routingId } = recordRouting({
    rawInput: thesis,
    deeperClaim: f["deeper-claim"],
    shape: f["shape"] as any,
    timeHorizon: f["time-horizon"],
    instrument: instrument.toUpperCase(),
    platform,
    direction,
    instrumentType: f["type"],
    entryPrice,
    qty,
    strike: f["strike"] ? parseFloat(f["strike"]) : undefined,
    expiry: f["expiry"],
    leverage: f["leverage"] ? parseFloat(f["leverage"]) : undefined,
    thesisBeta: f["thesis-beta"] ? parseFloat(f["thesis-beta"]) : undefined,
    convexity: f["convexity"] ? parseFloat(f["convexity"]) : undefined,
    timeCost: f["time-cost"] ? parseFloat(f["time-cost"]) : undefined,
    killConditions: f["kills"],
    altInstrument: f["alt"],
    deepLink: f["deep-link"],
  });

  const tradeId = openTrade(routingId, mode);

  console.log(`\n✅ Recorded ${mode === "real" ? "💰" : "📝"} trade ${tradeId}:`);
  console.log(`  Thesis:     "${thesis}"`);
  console.log(`  Instrument: ${instrument.toUpperCase()} (${platform})`);
  console.log(`  Direction:  ${direction}`);
  console.log(`  Entry:      $${entryPrice}`);
  console.log(`  Qty:        ${qty}`);
  console.log(`  IDs:        thesis=${thesisId} routing=${routingId} trade=${tradeId}`);
}

async function portfolio(args: string[]) {
  const telegram = args.includes("--telegram");
  const trades = getOpenTrades();

  if (trades.length === 0) {
    console.log("No open trades. Use 'record' to add one.");
    return;
  }

  const rows: string[] = [];
  let totalPnl = 0;
  let totalCapital = 0;

  for (const t of trades) {
    const livePrice = await fetchPrice(t.platform, t.instrument);
    const days = Math.floor((Date.now() - new Date(t.opened_at).getTime()) / 86400000);
    const capital = t.entry_price * t.qty;

    let pnlPct = 0;
    if (livePrice !== null) {
      const dir = t.direction === "long" ? 1 : -1;
      pnlPct = dir * ((livePrice - t.entry_price) / t.entry_price) * 100;
    }

    const pnlDollars = (pnlPct / 100) * capital;
    totalPnl += pnlDollars;
    totalCapital += capital;

    const mode = t.mode === "real" ? "💰" : "📝";
    const sign = pnlPct >= 0 ? "+" : "";
    const ticker = t.instrument.slice(0, 10).padEnd(10);
    const thesis = (t.raw_input || "").slice(0, 22);

    rows.push(`${mode} ${ticker} ${sign}${pnlPct.toFixed(1).padStart(6)}% ${String(days).padStart(3)}d  ${thesis}`);
  }

  const totalSign = totalPnl >= 0 ? "+" : "";
  const totalPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  if (telegram) {
    console.log(`🎯 **Belief Portfolio** (${trades.length} open)\n`);
    console.log("```");
    for (const r of rows) console.log(r);
    console.log("─".repeat(42));
    console.log(`   TOTAL      ${totalSign}${totalPct.toFixed(1)}%       ${totalSign}$${totalPnl.toFixed(0)}`);
    console.log("```");
    console.log(`\n📝 paper · 💰 real`);
  } else {
    console.log(`\nBelief Portfolio — ${trades.length} open\n`);
    for (const r of rows) console.log(r);
    console.log("─".repeat(45));
    console.log(`TOTAL: ${totalSign}${totalPct.toFixed(1)}% (${totalSign}$${totalPnl.toFixed(0)} on $${totalCapital.toFixed(0)})`);
  }
}

async function close(args: string[]) {
  const f = parseFlags(args);
  const id = f["id"];
  const exitPrice = parseFloat(f["exit-price"] || "");

  if (!id || isNaN(exitPrice)) {
    console.error("Usage: bun run scripts/track.ts close --id <trade-id> --exit-price 8.70");
    process.exit(1);
  }

  dbClose(id, exitPrice);
  console.log(`\n✅ Closed trade ${id} at $${exitPrice}`);
}

async function history(args: string[]) {
  const f = parseFlags(args);
  const limit = parseInt(f["limit"] || "20");
  const routings = getRecentRoutings(limit);

  if (routings.length === 0) {
    console.log("No routing history yet.");
    return;
  }

  console.log(`\nRecent Routings (${routings.length}):\n`);
  for (const r of routings) {
    const trades = r.trade_count > 0 ? `${r.trade_count} trade(s)` : "not tracked";
    const beta = r.thesis_beta ? `β=${r.thesis_beta.toFixed(2)}` : "";
    console.log(`  ${r.id}  ${r.instrument.padEnd(12)} ${r.platform.padEnd(12)} ${beta.padEnd(8)} ${trades}`);
    console.log(`         "${(r.raw_input || "").slice(0, 60)}"`);
    if (r.deeper_claim) console.log(`         → ${r.deeper_claim.slice(0, 60)}`);
    console.log();
  }
}

async function check(args: string[]) {
  const keywords = args.filter(a => !a.startsWith("--"));
  if (keywords.length === 0) {
    // Check all open trades for P&L
    const trades = getOpenTrades();
    if (trades.length === 0) { console.log("No open trades."); return; }

    console.log(`\nChecking ${trades.length} open trades...\n`);
    for (const t of trades) {
      const livePrice = await fetchPrice(t.platform, t.instrument);
      if (livePrice === null) { console.log(`  ${t.instrument}: price unavailable`); continue; }
      const dir = t.direction === "long" ? 1 : -1;
      const pnl = dir * ((livePrice - t.entry_price) / t.entry_price) * 100;
      const sign = pnl >= 0 ? "+" : "";
      console.log(`  ${t.instrument.padEnd(10)} $${t.entry_price} → $${livePrice.toFixed(2)} (${sign}${pnl.toFixed(1)}%)`);
    }
  } else {
    // Check for similar past theses
    const similar = findSimilarTheses(keywords);
    if (similar.length === 0) {
      console.log("No similar past theses found.");
    } else {
      console.log(`\nFound ${similar.length} similar past theses:\n`);
      for (const th of similar) {
        console.log(`  ${th.id}  ${th.created_at.split("T")[0]}  "${th.raw_input.slice(0, 60)}"`);
        if (th.deeper_claim) console.log(`         → ${th.deeper_claim.slice(0, 60)}`);
      }
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
      if (val && !val.startsWith("--")) { flags[key] = val; i++; }
    }
  }
  return flags;
}

// ── Main ────────────────────────────────────────────────────────────

const cmd = process.argv[2];
const rest = process.argv.slice(3);

switch (cmd) {
  case "record": await record(rest); break;
  case "portfolio": await portfolio(rest); break;
  case "close": await close(rest); break;
  case "history": await history(rest); break;
  case "check": await check(rest); break;
  default:
    console.error("Usage: bun run scripts/track.ts <record|portfolio|close|history|check> [options]");
    console.error("\n  record     Record a routed belief + open trade");
    console.error("  portfolio  Show open beliefs with live P&L [--telegram]");
    console.error("  close      Close a trade --id X --exit-price Y");
    console.error("  history    Show recent routings [--limit N]");
    console.error("  check      Check open trade P&L, or search past theses: check <keywords>");
    process.exit(1);
}
