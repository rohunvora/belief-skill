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
        return q?.regularMarketPrice ?? null;
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
    ...(f["link"] && { link: f["link"] }),
    ...(f["conviction"] && { conviction: parseFloat(f["conviction"]) }),
  };

  append(fact);
  const mode = fact.action === "real" ? "💰" : fact.action === "paper" ? "📝" : "👁";
  console.log(`\n${mode} ${id} | ${inst.toUpperCase()} $${px} ${dir} | ${plat} | "${input.slice(0, 50)}"`);
}

async function portfolio(telegram: boolean) {
  const open = getOpenRoutes();
  if (open.length === 0) { console.log("No open positions."); return; }

  const rows: string[] = [];
  let totalPnl = 0;
  let totalCap = 0;

  for (const r of open) {
    const ticker = r.inst.split(" ")[0];
    const live = await fetchPrice(r.plat, ticker);
    const days = Math.floor((Date.now() - new Date(r.t).getTime()) / 86400000);
    const cap = r.px * (r.qty || 0);
    const dirMul = r.dir === "short" ? -1 : 1;
    let pnl = 0;

    if (live !== null) {
      pnl = dirMul * ((live - r.px) / r.px) * 100;
    }

    const pnlDollars = (pnl / 100) * cap;
    totalPnl += pnlDollars;
    totalCap += cap;

    const mode = r.action === "real" ? "💰" : "📝";
    const sign = pnl >= 0 ? "+" : "";
    const conv = getLatestConviction(r.id);
    const convStr = conv ? ` c=${conv}` : "";

    rows.push(`${mode} ${ticker.padEnd(10)} ${(sign + pnl.toFixed(1) + "%").padStart(7)} ${String(days).padStart(3)}d${convStr}  ${r.input.slice(0, 20)}`);
  }

  const totalSign = totalPnl >= 0 ? "+" : "";
  const totalPct = totalCap > 0 ? (totalPnl / totalCap) * 100 : 0;

  if (telegram) {
    console.log(`🎯 **Belief Portfolio** (${open.length} open)\n`);
    console.log("```");
    for (const row of rows) console.log(row);
    console.log("─".repeat(42));
    console.log(`   TOTAL      ${totalSign}${totalPct.toFixed(1)}%       ${totalSign}$${totalPnl.toFixed(0)}`);
    console.log("```");
  } else {
    console.log(`\nBelief Portfolio — ${open.length} open\n`);
    for (const row of rows) console.log(row);
    console.log("─".repeat(45));
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
