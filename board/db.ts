/** SQLite store for calls — replaces scripts/db.ts JSONL and mock-data.ts. */

import { Database } from "bun:sqlite";
import { join } from "path";
import type { Call, User, DerivationChain, PriceLadderStep, Segment } from "./types";

const DB_PATH = join(import.meta.dir, "board.db");
const db = new Database(DB_PATH);

db.run("PRAGMA journal_mode = WAL");

// ── Schema ───────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    bio TEXT,
    twitter TEXT,
    avatar_url TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    thesis TEXT NOT NULL,
    ticker TEXT NOT NULL,
    direction TEXT NOT NULL,
    entry_price REAL NOT NULL,
    breakeven TEXT,
    kills TEXT,

    caller_id TEXT NOT NULL,
    source_handle TEXT,
    source_url TEXT,
    call_type TEXT NOT NULL DEFAULT 'original',

    status TEXT NOT NULL DEFAULT 'active',
    resolve_price REAL,
    resolve_date TEXT,
    resolve_pnl REAL,
    resolve_note TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    instrument TEXT,
    platform TEXT,

    votes INTEGER NOT NULL DEFAULT 0,
    watchers INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,

    current_price REAL,
    price_updated_at TEXT,

    trade_data TEXT,

    FOREIGN KEY (caller_id) REFERENCES users(id)
  )
`);

// ── Migrations (safe to re-run — uses IF NOT EXISTS pattern) ─────────
// Two-layer model: add source_date and conviction as queryable columns.
// Everything else (author_thesis, author_ticker, etc.) lives in the trade_data blob.
const existingCols = new Set(
  (db.prepare("PRAGMA table_info(calls)").all() as { name: string }[]).map(c => c.name)
);
if (!existingCols.has("source_date")) {
  db.run("ALTER TABLE calls ADD COLUMN source_date TEXT");
}
if (!existingCols.has("conviction")) {
  db.run("ALTER TABLE calls ADD COLUMN conviction TEXT");
}

db.run(`CREATE INDEX IF NOT EXISTS idx_calls_created ON calls(created_at DESC)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_source_date ON calls(source_date)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_conviction ON calls(conviction)`);

// ── Helpers ──────────────────────────────────────────────────────────

function genId(): string {
  return crypto.randomUUID().slice(0, 10);
}

/** Pack detail fields into trade_data JSON blob. */
function packTradeData(call: Partial<Call>): string | null {
  const data: Record<string, any> = {};
  // Layer 1: author's signal (blob detail)
  if (call.source_quote) data.source_quote = call.source_quote;
  if (call.author_thesis) data.author_thesis = call.author_thesis;
  if (call.author_ticker) data.author_ticker = call.author_ticker;
  if (call.author_direction) data.author_direction = call.author_direction;
  if (call.conditions) data.conditions = call.conditions;
  if (call.segments) data.segments = call.segments;
  // Layer 2: skill's analysis (blob detail)
  if (call.reasoning) data.reasoning = call.reasoning;
  if (call.edge) data.edge = call.edge;
  if (call.counter) data.counter = call.counter;
  if (call.price_ladder) data.price_ladder = call.price_ladder;
  if (call.alternative) data.alternative = call.alternative;
  if (call.scan_source) data.scan_source = call.scan_source;
  if (call.derivation) data.derivation = call.derivation;
  return Object.keys(data).length > 0 ? JSON.stringify(data) : null;
}

/** Unpack trade_data blob back onto a Call object. */
function unpackRow(row: any): Call {
  const tradeData = row.trade_data ? JSON.parse(row.trade_data) : {};
  return {
    id: row.id,
    // Layer 2: routing (queryable)
    thesis: row.thesis,
    ticker: row.ticker,
    direction: row.direction,
    entry_price: row.entry_price,
    breakeven: row.breakeven ?? "",
    kills: row.kills ?? "",
    // Layer 1: call (queryable)
    source_handle: row.source_handle,
    source_url: row.source_url,
    source_date: row.source_date ?? null,
    conviction: row.conviction ?? null,
    call_type: row.call_type,
    caller_id: row.caller_id,
    // Resolution
    status: row.status,
    resolve_price: row.resolve_price,
    resolve_date: row.resolve_date,
    resolve_pnl: row.resolve_pnl,
    resolve_note: row.resolve_note,
    // Metadata
    created_at: row.created_at,
    instrument: row.instrument,
    platform: row.platform,
    // Engagement
    votes: row.votes,
    watchers: row.watchers,
    comments: row.comments,
    // Layer 1: call (blob detail)
    source_quote: tradeData.source_quote,
    author_thesis: tradeData.author_thesis,
    author_ticker: tradeData.author_ticker,
    author_direction: tradeData.author_direction,
    conditions: tradeData.conditions,
    segments: tradeData.segments,
    // Layer 2: routing (blob detail)
    reasoning: tradeData.reasoning,
    edge: tradeData.edge,
    counter: tradeData.counter,
    price_ladder: tradeData.price_ladder,
    alternative: tradeData.alternative,
    scan_source: tradeData.scan_source,
    derivation: tradeData.derivation,
  };
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    handle: row.handle,
    bio: row.bio,
    twitter: row.twitter,
    avatar_url: row.avatar_url,
    verified: !!row.verified,
    created_at: row.created_at,
    // Computed — filled by getUserWithStats
    total_calls: 0,
    accuracy: null,
    total_pnl: null,
    watchers: 0,
  };
}

// ── Users ────────────────────────────────────────────────────────────

const insertUserStmt = db.prepare(`
  INSERT OR IGNORE INTO users (id, handle, bio, twitter, avatar_url, verified, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

export function insertUser(user: User): void {
  insertUserStmt.run(
    user.id,
    user.handle,
    user.bio,
    user.twitter,
    user.avatar_url ?? null,
    user.verified ? 1 : 0,
    user.created_at,
  );
}

export function getUser(id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!row) return null;
  return rowToUser(row);
}

export function getUserByHandle(handle: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE handle = ?").get(handle);
  if (!row) return null;
  return rowToUser(row);
}

export function getUserWithStats(id: string): User | null {
  const user = getUser(id);
  if (!user) return null;
  const stats = db.prepare(`
    SELECT COUNT(*) as total_calls, SUM(watchers) as total_watchers
    FROM calls WHERE caller_id = ?
  `).get(id) as any;
  user.total_calls = stats.total_calls ?? 0;
  user.watchers = stats.total_watchers ?? 0;
  return user;
}

export function listUsers(): User[] {
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at").all();
  return rows.map(rowToUser);
}

// ── Calls ────────────────────────────────────────────────────────────

const insertCallStmt = db.prepare(`
  INSERT INTO calls (id, thesis, ticker, direction, entry_price, breakeven, kills,
    caller_id, source_handle, source_url, source_date, conviction, call_type,
    status, resolve_price, resolve_date, resolve_pnl, resolve_note,
    created_at, instrument, platform,
    votes, watchers, comments, trade_data)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function insertCall(call: Call): Call {
  const id = call.id || genId();
  const tradeData = packTradeData(call);

  // Warn when a sourced call is inserted without a structured derivation chain
  if (call.source_handle && call.call_type !== "original") {
    const hasStructuredChain = call.derivation && typeof call.derivation === "object";
    if (!hasStructuredChain) {
      console.warn(`[db] ${id} (${call.ticker}): sourced call missing structured derivation chain`);
    }
  }

  insertCallStmt.run(
    id,
    call.thesis,
    call.ticker,
    call.direction,
    call.entry_price,
    call.breakeven ?? null,
    call.kills ?? null,
    call.caller_id,
    call.source_handle ?? null,
    call.source_url ?? null,
    call.source_date ?? null,
    call.conviction ?? null,
    call.call_type,
    call.status,
    call.resolve_price ?? null,
    call.resolve_date ?? null,
    call.resolve_pnl ?? null,
    call.resolve_note ?? null,
    call.created_at,
    call.instrument ?? null,
    call.platform ?? null,
    call.votes ?? 0,
    call.watchers ?? 0,
    call.comments ?? 0,
    tradeData,
  );

  return getCall(id)!;
}

export function getCall(id: string): Call | null {
  const row = db.prepare("SELECT * FROM calls WHERE id = ?").get(id);
  if (!row) return null;
  return unpackRow(row);
}

export function listCalls(opts: { limit?: number; callerId?: string; status?: string } = {}): Call[] {
  const limit = opts.limit ?? 50;

  if (opts.callerId) {
    const rows = db.prepare(
      "SELECT * FROM calls WHERE caller_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(opts.callerId, limit);
    return rows.map(unpackRow);
  }

  if (opts.status) {
    const rows = db.prepare(
      "SELECT * FROM calls WHERE status = ? ORDER BY created_at DESC LIMIT ?"
    ).all(opts.status, limit);
    return rows.map(unpackRow);
  }

  const rows = db.prepare(
    "SELECT * FROM calls ORDER BY created_at DESC LIMIT ?"
  ).all(limit);
  return rows.map(unpackRow);
}

export function getActiveCalls(): Call[] {
  return listCalls({ status: "active", limit: 100 });
}

export function updatePrice(id: string, price: number): void {
  db.prepare(
    "UPDATE calls SET current_price = ?, price_updated_at = datetime('now') WHERE id = ?"
  ).run(price, id);
}

export function closeCall(id: string, price: number, note?: string): void {
  const call = getCall(id);
  if (!call) return;
  const pnl = ((price - call.entry_price) / call.entry_price) * 100;
  db.prepare(
    "UPDATE calls SET status = 'closed', resolve_price = ?, resolve_pnl = ?, resolve_date = datetime('now'), resolve_note = ? WHERE id = ?"
  ).run(price, pnl, note ?? null, id);
}

export function getCallsByUser(userId: string): Call[] {
  return listCalls({ callerId: userId });
}

// ── Leaderboard ──────────────────────────────────────────────────────

export function getLeaderboard(): Array<{ user: User; total_calls: number }> {
  const rows = db.prepare(`
    SELECT u.*, COUNT(c.id) as total_calls, SUM(c.watchers) as total_watchers
    FROM users u
    LEFT JOIN calls c ON c.caller_id = u.id
    GROUP BY u.id
    ORDER BY total_calls DESC
  `).all() as any[];

  return rows.map((row) => ({
    user: {
      ...rowToUser(row),
      total_calls: row.total_calls ?? 0,
      watchers: row.total_watchers ?? 0,
    },
    total_calls: row.total_calls ?? 0,
  }));
}
