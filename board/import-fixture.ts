/**
 * import-fixture.ts — Seed board.db from the JSON fixture.
 *
 * Usage:
 *   bun run board/import-fixture.ts
 *
 * Reads board/fixtures/seed-data.json and inserts all rows.
 * Deletes existing board.db first to avoid conflicts.
 */

import { unlinkSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";

const DATA_DIR = process.env.DATA_DIR || import.meta.dir;
const DB_PATH = join(DATA_DIR, "board.db");

// Delete existing DB so we get a clean slate
for (const suffix of ["", "-shm", "-wal"]) {
  const p = DB_PATH + suffix;
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`[import] Removed ${p}`);
  }
}

// Import db.ts (creates tables on load) — must come after DB deletion
const {
  insertUser,
  insertCall,
  insertAuthor,
  insertSource,
  insertTicker,
  insertQuote,
} = require("./db") as typeof import("./db");

// Read fixture
const fixture = JSON.parse(
  readFileSync(join(import.meta.dir, "fixtures/seed-data.json"), "utf-8")
) as {
  users: Record<string, unknown>[];
  calls: Record<string, unknown>[];
  authors: Record<string, unknown>[];
  sources: Record<string, unknown>[];
  tickers: Record<string, unknown>[];
  quotes: Record<string, unknown>[];
  call_quotes: { call_id: string; quote_id: string }[];
};

console.log("\n[import] Seeding from fixture...\n");

// Insert in FK order: users, authors, sources, tickers, quotes, calls, call_quotes
console.log(`Users: ${fixture.users.length}`);
for (const u of fixture.users) {
  insertUser(u as never);
}

console.log(`Authors: ${fixture.authors.length}`);
for (const a of fixture.authors) {
  insertAuthor(a as never);
}

console.log(`Sources: ${fixture.sources.length}`);
for (const s of fixture.sources) {
  insertSource(s as never);
}

console.log(`Tickers: ${fixture.tickers.length}`);
for (const t of fixture.tickers) {
  insertTicker(t as never);
}

console.log(`Quotes: ${fixture.quotes.length}`);
for (const q of fixture.quotes) {
  insertQuote(q as never);
}

// Calls: trade_data is unpacked in the fixture, spread fields back onto the call
console.log(`Calls: ${fixture.calls.length}`);
for (const c of fixture.calls) {
  const tradeFields = (c.trade_data ?? {}) as Record<string, unknown>;
  const call = { ...c, ...tradeFields };
  delete call.trade_data;
  insertCall(call as never);
}

// call_quotes join table — direct SQL since there's no helper function
if (fixture.call_quotes?.length) {
  const db = new Database(DB_PATH);
  console.log(`Call-Quotes: ${fixture.call_quotes.length}`);
  const stmt = db.prepare("INSERT OR IGNORE INTO call_quotes (call_id, quote_id) VALUES (?, ?)");
  for (const cq of fixture.call_quotes) {
    stmt.run(cq.call_id, cq.quote_id);
  }
  db.close();
}

console.log("\n[import] Done.\n");
