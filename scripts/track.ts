/**
 * Belief tracker CLI — append-only JSONL fact log.
 *
 * Usage:
 *   bun run scripts/track.ts record --input "..." --inst LAES --px 3.85 --dir long --plat robinhood [--action paper] [--shape mispriced] [--β 0.85] [--conv 3.9] [--tc 0] [--kills "..."] [--alt "..."] [--claim "..."] [--src "tweet:@marginsmall"] [--conviction 80]
 *   bun run scripts/track.ts portfolio [--telegram]
 *   bun run scripts/track.ts close --id X --px 8.70 [--reason "target hit"]
 *   bun run scripts/track.ts update --id X --conviction 92 --reason "NIST accelerated"
 *   bun run scripts/track.ts history [--limit 20]
 *   bun run scripts/track.ts check <keywords>
 */

import { append, genId, now, readAll, getRoutes, getOpenRoutes, getLatestConviction, findSimilar, type RoutingFact, type CloseFact, type ConvictionFact } from "./db";

// ── Price fetchers ──────────────────────────────────────────────────

async function fetchPrice(plat: string, inst: string): Promise<number | null> {
  try {
    const ticker = inst.split(" ")[0].replace(/-PERP$/i, "");
    switch (plat) {
      case "robinhood": {
        const YF = (await import("yahoo-finance2")).default;
        const yf = new YF({ suppressNotices: ["yahooSurvey"] });
        const q = await yf.quote(ticker);
        // Use post/pre market price when available, fall back to regular
        return q?.postMarketPrice ?? q?.preMarketPrice ?? q?.regularMarketPrice ?? null;
      }
      case "hyperliquid": {
        const res = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "allMids" }),
        });
        if (!res.ok) return null;
        const mids = (await res.json()) as Record<string, string>;
        return mids[ticker] ? parseFloat(mids[ticker]) : null;
      }
      case "kalshi": {
        const res = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`);
        if (!res.ok) return null;
        const data = (await res.json()) as any;
        return data?.market?.last_price ?? null;
      }
      default: return null;
    }
  } catch { return null; }
}

// ── Commands ────────────────────────────────────────────────────────

function record(f: Record<string, string>) {
  const input = f["input"];
  const inst = f["inst"];
  const px = parseFloat(f["px"] || "");
  const dir = f["dir"];
  const plat = f["plat"];

  if (!input || !inst || isNaN(px) || !dir || !plat) {
    console.error("Usage: bun run scripts/track.ts record --input \"...\" --inst LAES --px 3.85 --dir long --plat robinhood");
    process.exit(1);
  }

  const id = genId();
  const qty = f["qty"] ? parseFloat(f["qty"]) : Math.floor(100000 / px);

  const fact: RoutingFact = {
    type: "route",
    id,
    t: now(),
    input,
    inst: inst.toUpperCase(),
    px,
    dir,
    plat,
    qty,
    action: f["action"] || "paper",
    ...(f["src"] && { src: f["src"] }),
    ...(f["claim"] && { claim: f["claim"] }),
    ...(f["shape"] && { shape: f["shape"] }),
    ...(f["sector"] && { sector: f["sector"] }),
    ...(f["β"] && { "β": parseFloat(f["β"]) }),
    ...(f["conv"] && { conv: parseFloat(f["conv"]) }),
    ...(f["tc"] && { tc: parseFloat(f["tc"]) }),
    ...(f["kills"] && { kills: f["kills"] }),
    ...(f["alt"] && { alt: f["alt"] }),
    ...(f["lev"] && { lev: parseFloat(f["lev"]) }),
    ...(f["link"] && { link: f["link"] }),
    ...(f["conviction"] && { conviction: parseFloat(f["conviction"]) }),
  };

  append(fact);
  const mode = fact.action === "real" ? "💰" : fact.action === "paper" ? "📝" : "👁";
  console.log(`\n${mode} ${id} | ${inst.toUpperCase()} $${px} ${dir} | ${plat} | "${input.slice(0, 50)}"`);
}

/**
 * Parse instrument string to extract type and components.
 * Formats:
 *   "LAES"                → stock, ticker=LAES
 *   "DJT $5P JAN27"       → option, ticker=DJT, strike=5, type=P(ut), exp=JAN27
 *   "KXFED-26JUL NO"      → kalshi, contract=KXFED-26JUL, side=NO
 *   "SOL-PERP"            → perp, ticker=SOL
 *   anything else          → unknown, use first word as ticker
 */
function parseInstrument(inst: string): {
  kind: "stock" | "option" | "kalshi" | "perp" | "polymarket" | "unknown";
  ticker: string;
  strike?: number;
  optionType?: "C" | "P";
  expiry?: string;
  side?: string;
} {
  // Option: "DJT $5P JAN27" or "GOOG $150P Jan27"
  const optMatch = inst.match(/^(\w+)\s+\$(\d+(?:\.\d+)?)(P|C)\s+(\S+)/i);
  if (optMatch) {
    return {
      kind: "option",
      ticker: optMatch[1],
      strike: parseFloat(optMatch[2]),
      optionType: optMatch[3].toUpperCase() as "C" | "P",
      expiry: optMatch[4],
    };
  }

  // Kalshi: "KXFED-26JUL NO" or "KXFED-26JUL-T3.50 NO"
  if (inst.match(/^KX/) || inst.match(/\s+(YES|NO)$/i)) {
    const parts = inst.split(/\s+/);
    return { kind: "kalshi", ticker: parts[0], side: parts[parts.length - 1].toUpperCase() };
  }

  // Perp: "SOL-PERP" or "ETH-PERP"
  if (inst.includes("-PERP")) {
    return { kind: "perp", ticker: inst.replace(/-PERP$/i, "") };
  }

  // Stock: single ticker
  return { kind: "stock", ticker: inst.split(" ")[0] };
}

/**
 * Compute P&L % based on instrument type.
 *
 * Stock:   (live - entry) / entry
 * Option:  (intrinsic_value - premium) / premium. OTM = -100%.
 * Kalshi:  (live_price - entry) / entry (prices in cents 0-100)
 * Perp:    (live - entry) / entry × leverage
 */
function computePnl(r: RoutingFact, livePrice: number): number {
  const parsed = parseInstrument(r.inst);
  const dirMul = r.dir === "short" ? -1 : 1;

  switch (parsed.kind) {
    case "option": {
      // livePrice = underlying stock price. Compute intrinsic.
      const strike = parsed.strike || 0;
      let intrinsic: number;
      if (parsed.optionType === "P") {
        intrinsic = Math.max(strike - livePrice, 0); // put
      } else {
        intrinsic = Math.max(livePrice - strike, 0); // call
      }
      // P&L on premium paid. If OTM, intrinsic=0, loss = -100% (ignoring time value)
      if (r.px <= 0) return 0;
      // For puts we bought (dir=short means bearish), dirMul is already -1
      // but options P&L is always (intrinsic - premium) / premium regardless of dir
      // because buying a put IS the bearish expression
      return ((intrinsic - r.px) / r.px) * 100;
    }
    case "kalshi": {
      // Kalshi prices are in cents (0-100). Entry and live are both cents.
      // For YES: profit if price goes up. For NO: profit if price goes down.
      const sideMul = parsed.side === "NO" ? -1 : 1;
      return sideMul * ((livePrice - r.px) / r.px) * 100;
    }
    case "perp": {
      // Apply leverage from stored fact, default 1x if not recorded.
      const leverage = r.lev || 1;
      return dirMul * ((livePrice - r.px) / r.px) * leverage * 100;
    }
    default: {
      // Stock / ETF
      return dirMul * ((livePrice - r.px) / r.px) * 100;
    }
  }
}

async function portfolio(telegram: boolean) {
  const open = getOpenRoutes();
  if (open.length === 0) { console.log("No open positions."); return; }

  const rows: string[] = [];
  let totalPnl = 0;
  let totalCap = 0;

  for (const r of open) {
    const parsed = parseInstrument(r.inst);
    const live = await fetchPrice(r.plat, parsed.ticker);
    const days = Math.floor((Date.now() - new Date(r.t).getTime()) / 86400000);
    const cap = r.px * (r.qty || 0);

    let pnl = 0;
    let liveStr = "—";

    if (live !== null) {
      pnl = computePnl(r, live);
      if (parsed.kind === "option") {
        // Show underlying price, not option price
        liveStr = `${parsed.ticker}@$${live.toFixed(2)}`;
      } else {
        liveStr = `$${live.toFixed(2)}`;
      }
    }

    const pnlDollars = (pnl / 100) * cap;
    totalPnl += pnlDollars;
    totalCap += cap;

    const mode = r.action === "real" ? "💰" : "📝";
    const sign = pnl >= 0 ? "+" : "";
    const label = r.inst.length > 14 ? r.inst.slice(0, 14) : r.inst.padEnd(14);

    rows.push(`${mode} ${label} ${(sign + pnl.toFixed(1) + "%").padStart(8)} ${String(days).padStart(3)}d  ${r.input.slice(0, 18)}`);
  }

  const totalSign = totalPnl >= 0 ? "+" : "";
  const totalPct = totalCap > 0 ? (totalPnl / totalCap) * 100 : 0;

  if (telegram) {
    console.log(`🎯 **Belief Portfolio** (${open.length} open)\n`);
    console.log("```");
    for (const row of rows) console.log(row);
    console.log("─".repeat(44));
    console.log(`   TOTAL         ${totalSign}${totalPct.toFixed(1)}%      ${totalSign}$${Math.abs(totalPnl).toFixed(0)}`);
    console.log("```");
  } else {
    console.log(`\nBelief Portfolio — ${open.length} open\n`);
    for (const row of rows) console.log(row);
    console.log("─".repeat(50));
    console.log(`TOTAL: ${totalSign}${totalPct.toFixed(1)}% (${totalSign}$${totalPnl.toFixed(0)} on $${totalCap.toFixed(0)})`);
  }
}

function close(f: Record<string, string>) {
  const id = f["id"];
  const px = parseFloat(f["px"] || "");
  if (!id || isNaN(px)) {
    console.error("Usage: bun run scripts/track.ts close --id X --px 8.70");
    process.exit(1);
  }
  append({ type: "close", id, t: now(), px, reason: f["reason"] });
  console.log(`\n✅ Closed ${id} at $${px}`);
}

function update(f: Record<string, string>) {
  const id = f["id"];
  const conviction = parseFloat(f["conviction"] || "");
  const reason = f["reason"];
  if (!id || isNaN(conviction) || !reason) {
    console.error("Usage: bun run scripts/track.ts update --id X --conviction 92 --reason \"NIST accelerated\"");
    process.exit(1);
  }
  const prev = getLatestConviction(id) || 0;
  append({ type: "conviction", id, t: now(), from: prev, to: conviction, reason });
  console.log(`\n📊 ${id} conviction ${prev} → ${conviction} | ${reason}`);
}

function history(f: Record<string, string>) {
  const limit = parseInt(f["limit"] || "20");
  const routes = getRoutes().slice(-limit);
  if (routes.length === 0) { console.log("No history."); return; }

  console.log(`\nLast ${routes.length} beliefs:\n`);
  for (const r of routes) {
    const date = r.t.split("T")[0];
    const beta = r["β"] ? `β=${r["β"]}` : "";
    const mode = r.action === "real" ? "💰" : r.action === "paper" ? "📝" : "👁";
    console.log(`  ${mode} ${r.id}  ${date}  ${r.inst.padEnd(14)} ${r.plat.padEnd(10)} ${beta}`);
    console.log(`    "${r.input.slice(0, 65)}"`);
    if (r.claim) console.log(`    → ${r.claim.slice(0, 65)}`);
  }
}

function check(keywords: string[]) {
  if (keywords.length === 0) { console.log("Usage: check <keywords>"); return; }
  const similar = findSimilar(keywords);
  if (similar.length === 0) { console.log("No similar beliefs found."); return; }
  console.log(`\nFound ${similar.length} similar:\n`);
  for (const r of similar) {
    console.log(`  ${r.id}  ${r.t.split("T")[0]}  ${r.inst}  "${r.input.slice(0, 50)}"`);
  }
}

// ── CLI ─────────────────────────────────────────────────────────────

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

const cmd = process.argv[2];
const rest = process.argv.slice(3);
const flags = parseFlags(rest);

switch (cmd) {
  case "record": record(flags); break;
  case "portfolio": await portfolio(rest.includes("--telegram")); break;
  case "close": close(flags); break;
  case "update": update(flags); break;
  case "history": history(flags); break;
  case "check": check(rest.filter(a => !a.startsWith("--"))); break;
  default:
    console.error("Usage: bun run scripts/track.ts <record|portfolio|close|update|history|check>");
    process.exit(1);
}
