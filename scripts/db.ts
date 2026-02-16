import { Database } from "bun:sqlite";
import { join } from "path";
import { mkdirSync } from "fs";

const DATA_DIR = join(import.meta.dir, "..", "data");
const DB_PATH = join(DATA_DIR, "beliefs.db");

mkdirSync(DATA_DIR, { recursive: true });

let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.run("PRAGMA journal_mode=WAL");
  _db.run("PRAGMA foreign_keys=ON");
  migrate(_db);
  return _db;
}

function migrate(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS theses (
      id TEXT PRIMARY KEY,
      raw_input TEXT NOT NULL,
      deeper_claim TEXT,
      shape TEXT CHECK(shape IN ('binary','mispriced','sector','relative','vulnerability')),
      time_horizon TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS routings (
      id TEXT PRIMARY KEY,
      thesis_id TEXT NOT NULL REFERENCES theses(id),
      instrument TEXT NOT NULL,
      platform TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('long','short')),
      instrument_type TEXT CHECK(instrument_type IN ('stock','etf','option','perp','kalshi','polymarket','angel')),
      entry_price REAL NOT NULL,
      qty REAL,
      strike REAL,
      expiry TEXT,
      leverage REAL DEFAULT 1,
      thesis_beta REAL,
      convexity REAL,
      time_cost REAL,
      score REAL,
      kill_conditions TEXT,
      alt_instrument TEXT,
      alt_summary TEXT,
      deep_link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(thesis_id, instrument)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      routing_id TEXT NOT NULL REFERENCES routings(id),
      mode TEXT NOT NULL CHECK(mode IN ('paper','real')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      entry_price REAL NOT NULL,
      exit_price REAL,
      qty REAL NOT NULL,
      pnl REAL,
      pnl_pct REAL,
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT
    )
  `);

  // Indexes for common queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_routings_thesis ON routings(thesis_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_routing ON trades(routing_id)`);
}

// --- Helpers ---

export function genId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export interface ThesisRow {
  id: string;
  raw_input: string;
  deeper_claim: string | null;
  shape: string | null;
  time_horizon: string | null;
  created_at: string;
}

export interface RoutingRow {
  id: string;
  thesis_id: string;
  instrument: string;
  platform: string;
  direction: string;
  instrument_type: string | null;
  entry_price: number;
  qty: number | null;
  strike: number | null;
  expiry: string | null;
  leverage: number;
  thesis_beta: number | null;
  convexity: number | null;
  time_cost: number | null;
  score: number | null;
  kill_conditions: string | null;
  alt_instrument: string | null;
  alt_summary: string | null;
  deep_link: string | null;
  created_at: string;
}

export interface TradeRow {
  id: string;
  routing_id: string;
  mode: string;
  status: string;
  entry_price: number;
  exit_price: number | null;
  qty: number;
  pnl: number | null;
  pnl_pct: number | null;
  opened_at: string;
  closed_at: string | null;
}

/** Record a thesis + routing from a skill invocation */
export function recordRouting(opts: {
  rawInput: string;
  deeperClaim?: string;
  shape?: string;
  timeHorizon?: string;
  instrument: string;
  platform: string;
  direction: string;
  instrumentType?: string;
  entryPrice: number;
  qty?: number;
  strike?: number;
  expiry?: string;
  leverage?: number;
  thesisBeta?: number;
  convexity?: number;
  timeCost?: number;
  score?: number;
  killConditions?: string;
  altInstrument?: string;
  altSummary?: string;
  deepLink?: string;
}): { thesisId: string; routingId: string } {
  const db = getDb();
  const thesisId = genId();
  const routingId = genId();

  db.run(
    `INSERT INTO theses (id, raw_input, deeper_claim, shape, time_horizon) VALUES (?, ?, ?, ?, ?)`,
    [thesisId, opts.rawInput, opts.deeperClaim ?? null, opts.shape ?? null, opts.timeHorizon ?? null]
  );

  db.run(
    `INSERT INTO routings (id, thesis_id, instrument, platform, direction, instrument_type, entry_price, qty, strike, expiry, leverage, thesis_beta, convexity, time_cost, score, kill_conditions, alt_instrument, alt_summary, deep_link)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      routingId, thesisId, opts.instrument, opts.platform, opts.direction,
      opts.instrumentType ?? null, opts.entryPrice, opts.qty ?? null,
      opts.strike ?? null, opts.expiry ?? null, opts.leverage ?? 1,
      opts.thesisBeta ?? null, opts.convexity ?? null, opts.timeCost ?? null,
      opts.score ?? null, opts.killConditions ?? null,
      opts.altInstrument ?? null, opts.altSummary ?? null, opts.deepLink ?? null,
    ]
  );

  return { thesisId, routingId };
}

/** Open a trade (paper or real) from a routing */
export function openTrade(routingId: string, mode: "paper" | "real"): string {
  const db = getDb();
  const routing = db.query<RoutingRow, [string]>(
    `SELECT * FROM routings WHERE id = ?`
  ).get(routingId);

  if (!routing) throw new Error(`Routing ${routingId} not found`);

  const tradeId = genId();
  db.run(
    `INSERT INTO trades (id, routing_id, mode, entry_price, qty) VALUES (?, ?, ?, ?, ?)`,
    [tradeId, routingId, mode, routing.entry_price, routing.qty ?? 0]
  );

  return tradeId;
}

/** Close a trade with exit price */
export function closeTrade(tradeId: string, exitPrice: number): void {
  const db = getDb();
  const trade = db.query<TradeRow, [string]>(
    `SELECT * FROM trades WHERE id = ?`
  ).get(tradeId);

  if (!trade) throw new Error(`Trade ${tradeId} not found`);
  if (trade.status === "closed") throw new Error(`Trade ${tradeId} already closed`);

  const pnl = (exitPrice - trade.entry_price) * trade.qty;
  const pnlPct = ((exitPrice - trade.entry_price) / trade.entry_price) * 100;

  db.run(
    `UPDATE trades SET status = 'closed', exit_price = ?, pnl = ?, pnl_pct = ?, closed_at = datetime('now') WHERE id = ?`,
    [exitPrice, pnl, pnlPct, tradeId]
  );
}

/** Get all open trades with thesis + routing context */
export function getOpenTrades(): Array<TradeRow & { instrument: string; platform: string; direction: string; raw_input: string; deeper_claim: string | null; thesis_beta: number | null }> {
  const db = getDb();
  return db.query<any, []>(`
    SELECT t.*, r.instrument, r.platform, r.direction, r.instrument_type, r.strike, r.expiry, r.leverage, r.thesis_beta, r.deep_link, th.raw_input, th.deeper_claim, th.shape
    FROM trades t
    JOIN routings r ON t.routing_id = r.id
    JOIN theses th ON r.thesis_id = th.id
    WHERE t.status = 'open'
    ORDER BY t.opened_at DESC
  `).all();
}

/** Get all closed trades */
export function getClosedTrades(): Array<TradeRow & { instrument: string; platform: string; direction: string; raw_input: string }> {
  const db = getDb();
  return db.query<any, []>(`
    SELECT t.*, r.instrument, r.platform, r.direction, th.raw_input
    FROM trades t
    JOIN routings r ON t.routing_id = r.id
    JOIN theses th ON r.thesis_id = th.id
    WHERE t.status = 'closed'
    ORDER BY t.closed_at DESC
  `).all();
}

/** Get recent routings (with or without trades) */
export function getRecentRoutings(limit = 20): Array<RoutingRow & { raw_input: string; deeper_claim: string | null; trade_count: number }> {
  const db = getDb();
  return db.query<any, [number]>(`
    SELECT r.*, th.raw_input, th.deeper_claim,
      (SELECT COUNT(*) FROM trades WHERE routing_id = r.id) as trade_count
    FROM routings r
    JOIN theses th ON r.thesis_id = th.id
    ORDER BY r.created_at DESC
    LIMIT ?
  `).all(limit);
}

/** Check for similar past theses (keyword match) */
export function findSimilarTheses(keywords: string[]): ThesisRow[] {
  const db = getDb();
  const conditions = keywords.map(() => `(raw_input LIKE ? OR deeper_claim LIKE ?)`).join(" OR ");
  const params = keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
  return db.query<ThesisRow, any[]>(
    `SELECT * FROM theses WHERE ${conditions} ORDER BY created_at DESC LIMIT 10`
  ).all(...params);
}
