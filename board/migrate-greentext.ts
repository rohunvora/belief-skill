/**
 * Migration: Backfill greentext derivation steps into existing calls.
 *
 * Reads trade_data JSON, adds/updates `derivation.steps` and `derivation.chose_over`,
 * writes back. Matched by (source_handle, ticker) + whether derivation already exists.
 *
 * Usage: bun board/migrate-greentext.ts
 */

import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(import.meta.dir, "board.db");
const db = new Database(DB_PATH);

interface GreentextUpdate {
  source_handle: string;
  ticker: string;
  steps: string[];
  chose_over: string;
  /** If true, only update rows that already have a derivation field */
  only_with_existing_derivation?: boolean;
}

const updates: GreentextUpdate[] = [
  {
    source_handle: "chamath",
    ticker: "DELL",
    steps: [
      "on-prem is back",
      "companies buying their own AI servers instead of cloud",
      "DELL has $18B in orders to build them",
    ],
    chose_over:
      "HPE (lower AI backlog growth), SMCI (accounting risk) — Dell has the enterprise relationship + backlog proof",
  },
  {
    source_handle: "martinshkreli",
    ticker: "IONQ",
    steps: [
      "quantum stocks crashed 60%",
      "funds forced to sell, not a tech failure",
      "IONQ now cheaper than private peers with bigger gov contracts",
    ],
    chose_over:
      "RGTI (higher beta but no DARPA Stage B), QBTS (thinner contract book) — IonQ has strongest gov pipeline",
  },
  {
    source_handle: "marginsmall",
    ticker: "LAES",
    steps: [
      "government mandating quantum-proof chips",
      "someone has to make them",
      "LAES is the only public company that does",
    ],
    chose_over:
      'LSCC (CNSA 2.0 FPGAs but PQC is less than 10% of revenue), MCHP (crypto-agile MCUs, even more diluted) — LAES is 100% PQC',
  },
  {
    source_handle: "threadguy",
    ticker: "MSFT",
    steps: [
      "all code is AI now",
      "MSFT owns GitHub, Copilot, VS Code — the tollbooth",
    ],
    chose_over:
      "GOOG (competing but no IDE lock-in), ADBE (creative not code) — MSFT owns the full stack: IDE + host + model",
  },
  {
    source_handle: "martinshkreli",
    ticker: "EVR",
    steps: [
      "grimes back at morgan stanley, IPOs restarting",
      "everyone already buying the big banks for it",
      "EVR is pure advisory, higher margins, nobody's looking",
    ],
    chose_over:
      "MS (already at consensus target, diversified), GS (same) — EVR is pure advisory, 50%+ margins, better entry",
  },
  {
    source_handle: "nicbstme",
    ticker: "SPGI",
    steps: [
      "AI makes dashboards commodity",
      "raw data underneath gets more valuable",
      "SPGI owns the ratings and indices $7T tracks",
    ],
    chose_over:
      "MCO (purer ratings but 33x P/E + earnings risk), FactSet short (already -57%, obvious) — SPGI has ratings + indices, dual moat",
  },
  {
    source_handle: "WillManidis",
    ticker: "APO",
    steps: [
      "VC model is broken, companies can't exit",
      "the winners are patient permanent capital pools",
      "APO has the highest permanent ratio at 60%",
      "expanding to retail through Athene — 401k is next",
    ],
    chose_over:
      "BX more consensus 40% permanent vs 60%, KKR largest AUM but less permanent capital focus, ARES fastest wealth growth but smaller",
  },
  {
    source_handle: "WillManidis",
    ticker: "HLNE",
    steps: [
      "IPO is dead as only way out",
      "private market trading replaces it",
      "HLNE's platform does exactly that, $16B growing 70%/yr",
    ],
    chose_over:
      "FRGE 574% run unprofitable near highs, STEP faster revenue but lower fee quality",
  },
  {
    source_handle: "WillManidis",
    ticker: "IGV",
    steps: [
      "AI valuations are vibes, no exits",
      "software layer reprices as hype unwinds",
      "IGV puts are cheap",
    ],
    chose_over:
      "ARKK puts heterogeneous holdings expensive IV, IPO ETF short mega-IPO pipeline works against",
  },
  {
    source_handle: "BigA",
    ticker: "GLD",
    only_with_existing_derivation: true,
    steps: [
      "governments heading toward freezing assets",
      "gold is the one thing they can't",
      "GLD is 14% off its high",
    ],
    chose_over:
      "GDX (miners at 3.8x book, re-rated), BTC (exposed not direct, though better Phase 4 asymmetry)",
  },
  {
    source_handle: "BigA",
    ticker: "BAESY",
    only_with_existing_derivation: true,
    steps: [
      "europe building its own military without america",
      "defense budgets doubling for a decade",
      "BAESY has £78B orders at half the price of rheinmetall",
    ],
    chose_over:
      "RNMBY (52x P/E priced for perfection), EUAD ETF (44% aerospace dilutes defense thesis)",
  },
  {
    source_handle: "BigA",
    ticker: "CCJ",
    only_with_existing_derivation: true,
    steps: [
      "trade wars make scarce resources strategic",
      "uranium is the hardest to replace — 10 year mine lead time",
      "AI datacenters need nuclear power, new demand on top",
      "CCJ is the biggest producer, down 16%",
    ],
    chose_over:
      'LMT/RTX/NOC (all near ATH, consensus edge), ITA ETF (broad dilution)',
  },
];

// ── Run migration ────────────────────────────────────────────────────

const selectStmt = db.prepare(
  "SELECT id, source_handle, ticker, trade_data FROM calls WHERE source_handle = ? AND ticker = ?"
);
const updateStmt = db.prepare(
  "UPDATE calls SET trade_data = ? WHERE id = ?"
);

let updated = 0;
let skipped = 0;

for (const upd of updates) {
  const rows = selectStmt.all(upd.source_handle, upd.ticker) as any[];

  if (rows.length === 0) {
    console.log(`  SKIP: no rows found for ${upd.source_handle} + ${upd.ticker}`);
    skipped++;
    continue;
  }

  for (const row of rows) {
    const tradeData = row.trade_data ? JSON.parse(row.trade_data) : {};
    const hasDerivation = tradeData.derivation && typeof tradeData.derivation === "object";

    // For BigA duplicates: only update the row that already has a derivation
    if (upd.only_with_existing_derivation && !hasDerivation) {
      console.log(`  SKIP: ${row.id} (${upd.source_handle}/${upd.ticker}) — no existing derivation, skipping per flag`);
      skipped++;
      continue;
    }

    // Merge: keep existing derivation fields, add/overwrite steps + chose_over
    if (!tradeData.derivation) {
      tradeData.derivation = {};
    }
    tradeData.derivation.steps = upd.steps;
    tradeData.derivation.chose_over = upd.chose_over;

    updateStmt.run(JSON.stringify(tradeData), row.id);
    console.log(`  UPDATED: ${row.id} (${upd.source_handle}/${upd.ticker}) — ${upd.steps.length} steps`);
    updated++;
  }
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);

// ── Verify ───────────────────────────────────────────────────────────

console.log("\n── Verification ──");
const allCalls = db.prepare("SELECT id, source_handle, ticker, trade_data FROM calls WHERE source_handle IS NOT NULL").all() as any[];

for (const row of allCalls) {
  const td = row.trade_data ? JSON.parse(row.trade_data) : {};
  const d = td.derivation;
  if (d && d.steps) {
    console.log(`  ${row.id} ${row.source_handle}/${row.ticker}: ${d.steps.length} steps, chose_over=${d.chose_over ? "yes" : "no"}`);
  } else {
    console.log(`  ${row.id} ${row.source_handle}/${row.ticker}: NO steps`);
  }
}

db.close();
