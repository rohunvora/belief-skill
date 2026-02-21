/**
 * export-db.ts — Export all board.db rows to a JSON fixture file.
 *
 * Usage:
 *   bun run board/export-db.ts
 *
 * Output:
 *   board/fixtures/seed-data.json
 *
 * The fixture includes all rows from users, calls (with trade_data unpacked),
 * authors, sources, tickers, quotes, and call_quotes. It can be used to seed
 * a fresh database on any machine.
 */

import { Database } from "bun:sqlite";
import { join } from "path";
import { mkdirSync, writeFileSync } from "fs";

const DATA_DIR = process.env.DATA_DIR || import.meta.dir;
const DB_PATH = join(DATA_DIR, "board.db");
const OUT_DIR = join(import.meta.dir, "fixtures");
const OUT_PATH = join(OUT_DIR, "seed-data.json");

console.log(`[export] Reading from: ${DB_PATH}`);

const db = new Database(DB_PATH, { readonly: true });

// ── Helpers ──────────────────────────────────────────────────────────

function rows<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

function unpackCall(row: Record<string, unknown>): Record<string, unknown> {
  const tradeData =
    typeof row.trade_data === "string" && row.trade_data
      ? JSON.parse(row.trade_data)
      : {};

  return {
    // Core queryable fields
    id: row.id,
    thesis: row.thesis,
    ticker: row.ticker,
    direction: row.direction,
    entry_price: row.entry_price,
    breakeven: row.breakeven ?? null,
    kills: row.kills ?? null,
    // Layer 1: call provenance (queryable)
    caller_id: row.caller_id,
    source_handle: row.source_handle ?? null,
    source_url: row.source_url ?? null,
    source_date: row.source_date ?? null,
    conviction: row.conviction ?? null,
    call_type: row.call_type,
    // Entity FKs
    author_id: row.author_id ?? null,
    source_id: row.source_id ?? null,
    ticker_id: row.ticker_id ?? null,
    submitted_by: row.submitted_by ?? null,
    price_captured_at: row.price_captured_at ?? null,
    // Resolution
    status: row.status,
    resolve_price: row.resolve_price ?? null,
    resolve_date: row.resolve_date ?? null,
    resolve_pnl: row.resolve_pnl ?? null,
    resolve_note: row.resolve_note ?? null,
    // Metadata
    created_at: row.created_at,
    instrument: row.instrument ?? null,
    platform: row.platform ?? null,
    // Engagement
    votes: row.votes ?? 0,
    watchers: row.watchers ?? 0,
    comments: row.comments ?? 0,
    // trade_data blob — unpacked for readability, re-packed on seed
    trade_data: tradeData,
  };
}

// ── Export ───────────────────────────────────────────────────────────

const users = rows("SELECT * FROM users ORDER BY created_at");

const callRows = rows("SELECT * FROM calls ORDER BY created_at");
const calls = callRows.map(unpackCall);

const authors = rows("SELECT * FROM authors ORDER BY created_at");
const sources = rows("SELECT * FROM sources ORDER BY created_at");
const tickers = rows("SELECT * FROM tickers ORDER BY symbol");
const quotes = rows("SELECT * FROM quotes ORDER BY created_at");
const callQuotes = rows("SELECT * FROM call_quotes ORDER BY call_id, quote_id");

const fixture = { users, calls, authors, sources, tickers, quotes, call_quotes: callQuotes };

// ── Write ────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(fixture, null, 2));

console.log(`[export] Written to: ${OUT_PATH}`);
console.log(`  users:       ${users.length}`);
console.log(`  calls:       ${calls.length}`);
console.log(`  authors:     ${authors.length}`);
console.log(`  sources:     ${sources.length}`);
console.log(`  tickers:     ${tickers.length}`);
console.log(`  quotes:      ${quotes.length}`);
console.log(`  call_quotes: ${callQuotes.length}`);
