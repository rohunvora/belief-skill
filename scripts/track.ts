#!/usr/bin/env bun
/**
 * Track thesis outcomes — compare prices at thesis time vs current
 * Usage: bun run scripts/track.ts [thesis-id]
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { enrichInstruments } from "./research.ts";
import type { CandidateInstrument } from "./types.ts";

const HISTORY_DIR = new URL("../data/history/", import.meta.url).pathname;

interface ThesisHistory {
  id: string;
  thesis: string;
  confidence: string;
  created_at: string;
  recommendations: Array<{
    ticker: string;
    name: string;
    direction: "long" | "short";
    allocation_usd: number;
    asset_class: string;
    price: number;
    scores: { composite: number };
  }>;
}

function loadThesis(id: string): ThesisHistory | null {
  // Support partial match
  if (!existsSync(`${HISTORY_DIR}${id}.json`)) {
    const files = readdirSync(HISTORY_DIR).filter(f => f.includes(id));
    if (files.length === 1) id = files[0].replace(".json", "");
    else return null;
  }
  return JSON.parse(readFileSync(`${HISTORY_DIR}${id}.json`, "utf-8"));
}

function loadAllTheses(): ThesisHistory[] {
  if (!existsSync(HISTORY_DIR)) return [];
  return readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith(".json"))
    .sort().reverse()
    .map(f => JSON.parse(readFileSync(`${HISTORY_DIR}${f}`, "utf-8")));
}

async function trackThesis(thesis: ThesisHistory): Promise<void> {
  const activeRecs = thesis.recommendations.filter(r => r.allocation_usd > 0 && r.price > 0);
  if (activeRecs.length === 0) {
    console.log(`No priced positions to track for "${thesis.thesis.slice(0, 60)}..."`);
    return;
  }

  // Fetch current prices
  const candidates: CandidateInstrument[] = activeRecs.map(r => ({
    ticker: r.ticker,
    name: r.name,
    asset_class: r.asset_class as any,
    sub_themes: [],
    source: "history",
  }));

  const enriched = await enrichInstruments(candidates);
  const priceMap: Record<string, number> = {};
  for (const e of enriched) {
    if (e.price > 0) priceMap[e.ticker] = e.price;
  }

  // Calculate P&L
  const daysAgo = Math.round((Date.now() - new Date(thesis.created_at).getTime()) / (1000 * 60 * 60 * 24));
  
  console.log(`\n📊 THESIS TRACKER: "${thesis.thesis.slice(0, 70)}"`);
  console.log(`Created: ${new Date(thesis.created_at).toLocaleDateString()} (${daysAgo}d ago) | Confidence: ${thesis.confidence}\n`);

  let totalInvested = 0;
  let totalCurrent = 0;

  console.log("  Ticker   Dir    Entry      Now     P&L      Alloc");
  console.log("  ─────────────────────────────────────────────────────");

  for (const rec of activeRecs) {
    const currentPrice = priceMap[rec.ticker];
    if (!currentPrice || !rec.price) {
      console.log(`  ${rec.ticker.padEnd(8)} ${rec.direction.padEnd(6)} $${rec.price?.toFixed(2) || "?"} → ???`);
      continue;
    }

    const pricePct = ((currentPrice - rec.price) / rec.price) * 100;
    // For shorts, P&L is inverted
    const pnlPct = rec.direction === "short" ? -pricePct : pricePct;
    const pnlUsd = (pnlPct / 100) * rec.allocation_usd;

    totalInvested += rec.allocation_usd;
    totalCurrent += rec.allocation_usd + pnlUsd;

    const pnlStr = pnlPct >= 0 ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`;
    const pnlColor = pnlPct >= 0 ? "🟢" : "🔴";

    console.log(
      `  ${rec.ticker.padEnd(8)} ${rec.direction.padEnd(6)} ` +
      `$${rec.price.toFixed(2).padStart(8)} → $${currentPrice.toFixed(2).padStart(8)}  ` +
      `${pnlColor} ${pnlStr.padStart(7)}  $${rec.allocation_usd.toLocaleString()}`
    );
  }

  const totalPnlPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
  const totalPnlUsd = totalCurrent - totalInvested;
  const icon = totalPnlPct >= 0 ? "📈" : "📉";

  console.log("  ─────────────────────────────────────────────────────");
  console.log(
    `  ${icon} TOTAL: $${totalInvested.toLocaleString()} → $${Math.round(totalCurrent).toLocaleString()}  ` +
    `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(1)}% ($${totalPnlUsd >= 0 ? "+" : ""}${Math.round(totalPnlUsd).toLocaleString()})`
  );

  // Verdict
  console.log();
  if (totalPnlPct > 10) console.log("  ✅ Thesis CONFIRMED — strong performance across positions");
  else if (totalPnlPct > 0) console.log("  🟡 Thesis DEVELOPING — slight positive, still early");
  else if (totalPnlPct > -10) console.log("  🟡 Thesis MIXED — slight negative, monitor invalidation triggers");
  else console.log("  ❌ Thesis CHALLENGED — significant drawdown, review invalidation");
}

async function main() {
  const thesisId = Bun.argv[2];

  if (thesisId) {
    const thesis = loadThesis(thesisId);
    if (!thesis) {
      console.error(`Thesis "${thesisId}" not found. Run: bun run scripts/router.ts history`);
      process.exit(1);
    }
    await trackThesis(thesis);
  } else {
    // Track all theses
    const all = loadAllTheses();
    if (all.length === 0) {
      console.log("No theses to track. Run a thesis with --save first.");
      return;
    }
    for (const t of all) {
      await trackThesis(t);
      console.log();
    }
  }
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
