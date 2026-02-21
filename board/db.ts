/** SQLite store — normalized entity model for calls, authors, sources, tickers, quotes. */

import { Database } from "bun:sqlite";
import { join } from "path";
import type { Call, User, Author, Source, Quote, TickerEntity, DerivationChain, PriceLadderStep, Segment } from "./types";

// DB_PATH: use DATA_DIR env var (for persistent volumes in prod) or fall back to source dir
const DATA_DIR = process.env.DATA_DIR || import.meta.dir;
const DB_PATH = join(DATA_DIR, "board.db");
console.log(`[db] SQLite path: ${DB_PATH}`);
const db = new Database(DB_PATH);

db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

// ── Schema: Core Tables ─────────────────────────────────────────────

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

// ── Schema: Entity Tables (new) ─────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS authors (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    name TEXT,
    bio TEXT,
    avatar_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    platform TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    url TEXT,
    title TEXT,
    platform TEXT,
    published_at TEXT,
    submitted_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tickers (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT,
    instrument_type TEXT NOT NULL DEFAULT 'stock',
    platform TEXT NOT NULL DEFAULT 'robinhood',
    sector TEXT,
    logo_url TEXT,
    expires_at TEXT,
    underlying_event TEXT,
    UNIQUE(symbol, platform)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    text TEXT NOT NULL,
    speaker TEXT,
    timestamp TEXT,
    paragraph_ref TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS call_quotes (
    call_id TEXT NOT NULL REFERENCES calls(id),
    quote_id TEXT NOT NULL REFERENCES quotes(id),
    PRIMARY KEY (call_id, quote_id)
  )
`);

// ── Migrations (safe to re-run) ─────────────────────────────────────

const existingCols = new Set(
  (db.prepare("PRAGMA table_info(calls)").all() as { name: string }[]).map(c => c.name)
);

// Two-layer model columns (existing migration)
if (!existingCols.has("source_date")) {
  db.run("ALTER TABLE calls ADD COLUMN source_date TEXT");
}
if (!existingCols.has("conviction")) {
  db.run("ALTER TABLE calls ADD COLUMN conviction TEXT");
}

// Entity FK columns (new migration)
if (!existingCols.has("author_id")) {
  db.run("ALTER TABLE calls ADD COLUMN author_id TEXT REFERENCES authors(id)");
}
if (!existingCols.has("source_id")) {
  db.run("ALTER TABLE calls ADD COLUMN source_id TEXT REFERENCES sources(id)");
}
if (!existingCols.has("ticker_id")) {
  db.run("ALTER TABLE calls ADD COLUMN ticker_id TEXT REFERENCES tickers(id)");
}
if (!existingCols.has("submitted_by")) {
  db.run("ALTER TABLE calls ADD COLUMN submitted_by TEXT REFERENCES users(id)");
}
if (!existingCols.has("price_captured_at")) {
  db.run("ALTER TABLE calls ADD COLUMN price_captured_at TEXT");
}

// ── Indexes ─────────────────────────────────────────────────────────

db.run(`CREATE INDEX IF NOT EXISTS idx_calls_created ON calls(created_at DESC)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_source_date ON calls(source_date)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_conviction ON calls(conviction)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_author_id ON calls(author_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_ticker_id ON calls(ticker_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_source_id ON calls(source_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_submitted_by ON calls(submitted_by)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_quotes_source_id ON quotes(source_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_sources_submitted ON sources(submitted_by)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_calls_watchers_created ON calls(watchers DESC, created_at DESC)`);

// ── Data Migration: Populate entity tables from existing flat data ──

function runEntityMigration(): void {
  const authorCount = (db.prepare("SELECT COUNT(*) as cnt FROM authors").get() as any).cnt;
  if (authorCount > 0) return; // already migrated

  const allCalls = db.prepare("SELECT * FROM calls").all() as any[];
  if (allCalls.length === 0) return; // no data to migrate

  console.log(`[db] Running entity migration for ${allCalls.length} calls...`);

  // Find the submitter user (first verified user, or first user)
  const submitter = db.prepare("SELECT id FROM users WHERE verified = 1 LIMIT 1").get() as any
    ?? db.prepare("SELECT id FROM users LIMIT 1").get() as any;
  const submitterId = submitter?.id ?? "u_satoshi";

  // Step 1: Extract authors from unique source_handle values
  const authorHandles = new Set<string>();
  for (const c of allCalls) {
    if (c.source_handle) authorHandles.add(c.source_handle);
  }

  const authorMap = new Map<string, string>(); // handle -> author id
  const insertAuthorStmt = db.prepare(`
    INSERT OR IGNORE INTO authors (id, handle, name, bio, avatar_url, twitter_url, platform, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const handle of authorHandles) {
    const id = `auth_${handle}`;
    // Try to pull metadata from existing users table (authors were stored as users before)
    const existingUser = db.prepare("SELECT * FROM users WHERE handle = ?").get(handle) as any;
    insertAuthorStmt.run(
      id,
      handle,
      null, // name
      existingUser?.bio ?? null,
      existingUser?.avatar_url ?? null,
      existingUser?.twitter ? `https://x.com/${existingUser.twitter}` : null,
      handle.includes("youtube") ? "youtube" : "twitter",
      existingUser?.created_at ?? new Date().toISOString(),
    );
    authorMap.set(handle, id);
    console.log(`  [author] ${handle} -> ${id}`);
  }

  // Step 2: Extract sources from unique (source_url, scan_source) combos
  // Group calls by source identity
  const sourceGroups = new Map<string, { calls: any[]; url: string | null; scanSource: string | null }>();
  for (const c of allCalls) {
    const td = c.trade_data ? JSON.parse(c.trade_data) : {};
    const scanSource = td.scan_source ?? null;
    // Source key: URL if available, else (handle + scan_source)
    const key = c.source_url ?? `no_url:${c.source_handle ?? "unknown"}:${scanSource ?? "unknown"}`;
    if (!sourceGroups.has(key)) {
      sourceGroups.set(key, { calls: [], url: c.source_url, scanSource });
    }
    sourceGroups.get(key)!.calls.push(c);
  }

  const sourceMap = new Map<string, string>(); // source key -> source id
  const insertSourceStmt = db.prepare(`
    INSERT OR IGNORE INTO sources (id, url, title, platform, published_at, submitted_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let sourceIdx = 0;
  for (const [key, group] of sourceGroups) {
    const id = `src_${(++sourceIdx).toString().padStart(3, "0")}`;
    const url = group.url;
    const title = group.scanSource;

    // Detect platform from URL
    let platform: string | null = null;
    if (url) {
      if (url.includes("x.com") || url.includes("twitter.com")) platform = "twitter";
      else if (url.includes("youtube.com") || url.includes("youtu.be")) platform = "youtube";
      else if (url.includes("substack.com")) platform = "substack";
    }

    // Published date from first call's source_date
    const publishedAt = group.calls[0]?.source_date ?? null;

    insertSourceStmt.run(id, url, title, platform, publishedAt, submitterId, new Date().toISOString());
    sourceMap.set(key, id);
    console.log(`  [source] ${title ?? url ?? key} -> ${id} (${group.calls.length} calls)`);
  }

  // Step 3: Extract tickers from unique ticker symbols
  const tickerSymbols = new Set<string>();
  for (const c of allCalls) tickerSymbols.add(c.ticker);

  const tickerMap = new Map<string, string>(); // symbol -> ticker id
  const insertTickerStmt = db.prepare(`
    INSERT OR IGNORE INTO tickers (id, symbol, instrument_type, platform)
    VALUES (?, ?, ?, ?)
  `);

  for (const symbol of tickerSymbols) {
    const id = `tkr_${symbol.toLowerCase()}`;
    // All existing calls are stocks on robinhood
    insertTickerStmt.run(id, symbol, "stock", "robinhood");
    tickerMap.set(symbol, id);
    console.log(`  [ticker] ${symbol} -> ${id}`);
  }

  // Step 4: Extract quotes from segments in trade_data
  const insertQuoteStmt = db.prepare(`
    INSERT INTO quotes (id, source_id, text, speaker, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertCallQuoteStmt = db.prepare(`
    INSERT OR IGNORE INTO call_quotes (call_id, quote_id) VALUES (?, ?)
  `);

  let quoteIdx = 0;
  for (const c of allCalls) {
    const td = c.trade_data ? JSON.parse(c.trade_data) : {};
    const scanSource = td.scan_source ?? null;
    const sourceKey = c.source_url ?? `no_url:${c.source_handle ?? "unknown"}:${scanSource ?? "unknown"}`;
    const sourceId = sourceMap.get(sourceKey);
    if (!sourceId) continue;

    const segments: Segment[] = td.segments ?? [];

    // Also create a quote from source_quote if no segments exist
    if (segments.length === 0 && td.source_quote) {
      const qId = `q_${(++quoteIdx).toString().padStart(3, "0")}`;
      insertQuoteStmt.run(qId, sourceId, td.source_quote, c.source_handle, null, new Date().toISOString());
      insertCallQuoteStmt.run(c.id, qId);
    }

    for (const seg of segments) {
      const qId = `q_${(++quoteIdx).toString().padStart(3, "0")}`;
      insertQuoteStmt.run(qId, sourceId, seg.quote, seg.speaker ?? null, seg.timestamp ?? null, new Date().toISOString());
      insertCallQuoteStmt.run(c.id, qId);
    }
  }
  console.log(`  [quotes] ${quoteIdx} quotes extracted`);

  // Step 5: Populate FK columns on calls
  const updateCallFKs = db.prepare(`
    UPDATE calls SET author_id = ?, source_id = ?, ticker_id = ?, submitted_by = ?
    WHERE id = ?
  `);

  for (const c of allCalls) {
    const td = c.trade_data ? JSON.parse(c.trade_data) : {};
    const scanSource = td.scan_source ?? null;
    const authorId = c.source_handle ? authorMap.get(c.source_handle) ?? null : null;
    const sourceKey = c.source_url ?? `no_url:${c.source_handle ?? "unknown"}:${scanSource ?? "unknown"}`;
    const sourceId = sourceMap.get(sourceKey) ?? null;
    const tickerId = tickerMap.get(c.ticker) ?? null;
    updateCallFKs.run(authorId, sourceId, tickerId, submitterId, c.id);
  }

  console.log(`[db] Entity migration complete:`);
  console.log(`  ${authorMap.size} authors, ${sourceMap.size} sources, ${tickerMap.size} tickers, ${quoteIdx} quotes`);
}

runEntityMigration();

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
    // Layer 1: call (queryable, legacy fields)
    source_handle: row.source_handle,
    source_url: row.source_url,
    source_date: row.source_date ?? null,
    conviction: row.conviction ?? null,
    call_type: row.call_type,
    caller_id: row.caller_id,
    // Entity FKs
    author_id: row.author_id ?? null,
    source_id: row.source_id ?? null,
    ticker_id: row.ticker_id ?? null,
    submitted_by: row.submitted_by ?? null,
    price_captured_at: row.price_captured_at ?? null,
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
    total_calls: 0,
    accuracy: null,
    total_pnl: null,
    watchers: 0,
  };
}

function rowToAuthor(row: any): Author {
  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    twitter_url: row.twitter_url,
    youtube_url: row.youtube_url,
    platform: row.platform,
    created_at: row.created_at,
  };
}

function rowToSource(row: any): Source {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    platform: row.platform,
    published_at: row.published_at,
    submitted_by: row.submitted_by,
    created_at: row.created_at,
  };
}

function rowToQuote(row: any): Quote {
  return {
    id: row.id,
    source_id: row.source_id,
    text: row.text,
    speaker: row.speaker,
    timestamp: row.timestamp,
    paragraph_ref: row.paragraph_ref,
    created_at: row.created_at,
  };
}

function rowToTicker(row: any): TickerEntity {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    instrument_type: row.instrument_type,
    platform: row.platform,
    sector: row.sector,
    logo_url: row.logo_url,
    expires_at: row.expires_at,
    underlying_event: row.underlying_event,
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

// ── Authors ──────────────────────────────────────────────────────────

export function insertAuthor(author: Author): void {
  db.prepare(`
    INSERT OR IGNORE INTO authors (id, handle, name, bio, avatar_url, twitter_url, youtube_url, platform, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    author.id,
    author.handle,
    author.name,
    author.bio,
    author.avatar_url,
    author.twitter_url,
    author.youtube_url,
    author.platform,
    author.created_at,
  );
}

export function getAuthor(id: string): Author | null {
  const row = db.prepare("SELECT * FROM authors WHERE id = ?").get(id);
  if (!row) return null;
  return rowToAuthor(row);
}

export function getAuthorByHandle(handle: string): Author | null {
  const row = db.prepare("SELECT * FROM authors WHERE handle = ?").get(handle);
  if (!row) return null;
  return rowToAuthor(row);
}

export function listAuthors(): Author[] {
  const rows = db.prepare("SELECT * FROM authors ORDER BY created_at").all();
  return rows.map(rowToAuthor);
}

/** Author with call count and referenced tickers. */
export function getAuthorWithCalls(handle: string): {
  author: Author;
  calls: Call[];
  tickerCounts: Record<string, number>;
  tickerDirections: Record<string, { long: number; short: number }>;
  sources: Array<{ source: Source; callCount: number }>;
} | null {
  const author = getAuthorByHandle(handle);
  if (!author) return null;
  const rows = db.prepare(
    "SELECT * FROM calls WHERE author_id = ? ORDER BY created_at DESC"
  ).all(author.id);
  const calls = rows.map(unpackRow);

  // Ticker counts and direction breakdown
  const tickerCounts: Record<string, number> = {};
  const tickerDirections: Record<string, { long: number; short: number }> = {};
  for (const c of calls) {
    tickerCounts[c.ticker] = (tickerCounts[c.ticker] ?? 0) + 1;
    if (!tickerDirections[c.ticker]) tickerDirections[c.ticker] = { long: 0, short: 0 };
    tickerDirections[c.ticker]![c.direction === "long" ? "long" : "short"]++;
  }

  // Sources this author's calls came from
  const sourceCallCounts: Record<string, number> = {};
  for (const c of calls) {
    if (c.source_id) sourceCallCounts[c.source_id] = (sourceCallCounts[c.source_id] ?? 0) + 1;
  }
  const sources: Array<{ source: Source; callCount: number }> = [];
  for (const [sid, count] of Object.entries(sourceCallCounts)) {
    const src = getSource(sid);
    if (src) sources.push({ source: src, callCount: count });
  }
  // Sort by call count descending
  sources.sort((a, b) => b.callCount - a.callCount);

  return { author, calls, tickerCounts, tickerDirections, sources };
}

// ── Sources ──────────────────────────────────────────────────────────

export function insertSource(source: Source): void {
  db.prepare(`
    INSERT OR IGNORE INTO sources (id, url, title, platform, published_at, submitted_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    source.id,
    source.url,
    source.title,
    source.platform,
    source.published_at,
    source.submitted_by,
    source.created_at,
  );
}

export function getSource(id: string): Source | null {
  const row = db.prepare("SELECT * FROM sources WHERE id = ?").get(id);
  if (!row) return null;
  return rowToSource(row);
}

export function listSources(): Source[] {
  const rows = db.prepare("SELECT * FROM sources ORDER BY created_at DESC").all();
  return rows.map(rowToSource);
}

/** Source with all calls and quotes extracted from it. */
export function getSourceWithDetail(id: string): { source: Source; calls: Call[]; quotes: Quote[] } | null {
  const source = getSource(id);
  if (!source) return null;
  const callRows = db.prepare(
    "SELECT * FROM calls WHERE source_id = ? ORDER BY created_at DESC"
  ).all(id);
  const quoteRows = db.prepare(
    "SELECT * FROM quotes WHERE source_id = ? ORDER BY created_at"
  ).all(id);
  return {
    source,
    calls: callRows.map(unpackRow),
    quotes: quoteRows.map(rowToQuote),
  };
}

// ── Tickers ──────────────────────────────────────────────────────────

export function insertTicker(ticker: TickerEntity): void {
  db.prepare(`
    INSERT OR IGNORE INTO tickers (id, symbol, name, instrument_type, platform, sector, logo_url, expires_at, underlying_event)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticker.id,
    ticker.symbol,
    ticker.name,
    ticker.instrument_type,
    ticker.platform,
    ticker.sector,
    ticker.logo_url,
    ticker.expires_at,
    ticker.underlying_event,
  );
}

export function getTicker(id: string): TickerEntity | null {
  const row = db.prepare("SELECT * FROM tickers WHERE id = ?").get(id);
  if (!row) return null;
  return rowToTicker(row);
}

export function getTickerBySymbol(symbol: string, platform?: string): TickerEntity | null {
  const row = platform
    ? db.prepare("SELECT * FROM tickers WHERE symbol = ? AND platform = ?").get(symbol, platform)
    : db.prepare("SELECT * FROM tickers WHERE symbol = ?").get(symbol);
  if (!row) return null;
  return rowToTicker(row);
}

export function listTickers(): TickerEntity[] {
  const rows = db.prepare("SELECT * FROM tickers ORDER BY symbol").all();
  return rows.map(rowToTicker);
}

/** Ticker with all calls referencing it. */
export function getTickerWithCalls(symbol: string): {
  ticker: TickerEntity;
  calls: Call[];
  directionBreakdown: { long: number; short: number };
  authorCoverage: Array<{ author: Author; callCount: number; directions: { long: number; short: number } }>;
} | null {
  const ticker = getTickerBySymbol(symbol);
  if (!ticker) return null;
  const callRows = db.prepare(
    "SELECT * FROM calls WHERE ticker_id = ? ORDER BY created_at DESC"
  ).all(ticker.id);
  const calls = callRows.map(unpackRow);
  const directionBreakdown = {
    long: calls.filter(c => c.direction === "long").length,
    short: calls.filter(c => c.direction === "short").length,
  };

  // Per-author coverage breakdown
  const authorMap: Record<string, { callCount: number; directions: { long: number; short: number } }> = {};
  for (const c of calls) {
    if (!c.author_id) continue;
    if (!authorMap[c.author_id]) authorMap[c.author_id] = { callCount: 0, directions: { long: 0, short: 0 } };
    authorMap[c.author_id]!.callCount++;
    authorMap[c.author_id]!.directions[c.direction === "long" ? "long" : "short"]++;
  }
  const authorCoverage: Array<{ author: Author; callCount: number; directions: { long: number; short: number } }> = [];
  for (const [aid, stats] of Object.entries(authorMap)) {
    const author = getAuthor(aid);
    if (author) authorCoverage.push({ author, ...stats });
  }
  authorCoverage.sort((a, b) => b.callCount - a.callCount);

  return { ticker, calls, directionBreakdown, authorCoverage };
}

// ── Quotes ───────────────────────────────────────────────────────────

export function insertQuote(quote: Quote): void {
  db.prepare(`
    INSERT INTO quotes (id, source_id, text, speaker, timestamp, paragraph_ref, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    quote.id,
    quote.source_id,
    quote.text,
    quote.speaker,
    quote.timestamp,
    quote.paragraph_ref,
    quote.created_at,
  );
}

export function getQuotesBySource(sourceId: string): Quote[] {
  const rows = db.prepare("SELECT * FROM quotes WHERE source_id = ? ORDER BY created_at").all(sourceId);
  return rows.map(rowToQuote);
}

export function getQuotesByCall(callId: string): Quote[] {
  const rows = db.prepare(`
    SELECT q.* FROM quotes q
    JOIN call_quotes cq ON cq.quote_id = q.id
    WHERE cq.call_id = ?
    ORDER BY q.created_at
  `).all(callId);
  return rows.map(rowToQuote);
}

export function linkCallQuote(callId: string, quoteId: string): void {
  db.prepare("INSERT OR IGNORE INTO call_quotes (call_id, quote_id) VALUES (?, ?)").run(callId, quoteId);
}

// ── Find-or-create helpers (used by POST /api/takes on ingest) ───────

/** Find existing author by handle, or create a new one. Returns the author_id. */
export function ensureAuthor(handle: string): string {
  const existing = getAuthorByHandle(handle);
  if (existing) return existing.id;
  const id = genId();
  insertAuthor({
    id,
    handle,
    name: null,
    bio: null,
    avatar_url: null,
    twitter_url: handle.match(/^[a-zA-Z0-9_]+$/) ? `https://x.com/${handle}` : null,
    youtube_url: null,
    platform: null,
    created_at: new Date().toISOString(),
  });
  return id;
}

/** Find existing source by URL (if present), or create a new one. Returns the source_id. */
export function ensureSource(opts: {
  url: string | null;
  title: string | null;
  platform: string | null;
  publishedAt: string | null;
  submittedBy: string;
}): string {
  // If there's a URL, try to find an existing source with that URL
  if (opts.url) {
    const existing = db.prepare("SELECT * FROM sources WHERE url = ?").get(opts.url);
    if (existing) return rowToSource(existing).id;
  }
  // Create a new source
  const id = genId();
  insertSource({
    id,
    url: opts.url,
    title: opts.title,
    platform: opts.platform,
    published_at: opts.publishedAt,
    submitted_by: opts.submittedBy,
    created_at: new Date().toISOString(),
  });
  return id;
}

/** Find existing ticker by symbol+platform, or create a new one. Returns the ticker_id. */
export function ensureTicker(opts: {
  symbol: string;
  instrument: string | null;
  platform: string | null;
}): string {
  const existing = getTickerBySymbol(opts.symbol, opts.platform ?? undefined);
  if (existing) return existing.id;
  const id = genId();
  insertTicker({
    id,
    symbol: opts.symbol,
    name: null,
    instrument_type: opts.instrument ?? "stock",
    platform: opts.platform ?? "robinhood",
    sector: null,
    logo_url: null,
    expires_at: null,
    underlying_event: null,
  });
  return id;
}

// ── Calls ────────────────────────────────────────────────────────────

const insertCallStmt = db.prepare(`
  INSERT INTO calls (id, thesis, ticker, direction, entry_price, breakeven, kills,
    caller_id, source_handle, source_url, source_date, conviction, call_type,
    author_id, source_id, ticker_id, submitted_by, price_captured_at,
    status, resolve_price, resolve_date, resolve_pnl, resolve_note,
    created_at, instrument, platform,
    votes, watchers, comments, trade_data)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    call.author_id ?? null,
    call.source_id ?? null,
    call.ticker_id ?? null,
    call.submitted_by ?? call.caller_id,
    call.price_captured_at ?? null,
    call.status ?? "active",
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

export function listCalls(opts: { limit?: number; callerId?: string; authorId?: string; tickerId?: string } = {}): Call[] {
  const limit = opts.limit ?? 50;

  if (opts.authorId) {
    const rows = db.prepare(
      "SELECT * FROM calls WHERE author_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(opts.authorId, limit);
    return rows.map(unpackRow);
  }

  if (opts.tickerId) {
    const rows = db.prepare(
      "SELECT * FROM calls WHERE ticker_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(opts.tickerId, limit);
    return rows.map(unpackRow);
  }

  if (opts.callerId) {
    const rows = db.prepare(
      "SELECT * FROM calls WHERE caller_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(opts.callerId, limit);
    return rows.map(unpackRow);
  }

  const rows = db.prepare(
    "SELECT * FROM calls ORDER BY created_at DESC LIMIT ?"
  ).all(limit);
  return rows.map(unpackRow);
}

export function getAllCalls(): Call[] {
  return listCalls({ limit: 200 });
}

/** Paginated feed query with denormalized caller/author data via JOIN. */
export function queryFeed(opts: {
  cursor?: string;
  limit?: number;
  sort?: "new";
  ticker?: string;
  direction?: string;
  authorId?: string;
  tickerId?: string;
  submittedBy?: string;
  ids?: string[];
} = {}): { items: any[]; next_cursor: string | null; total: number } {
  const limit = opts.limit ?? 20;
  const cursorConds: string[] = [];
  const cursorParams: any[] = [];
  const filterConds: string[] = [];
  const filterParams: any[] = [];

  if (opts.authorId) { filterConds.push("c.author_id = ?"); filterParams.push(opts.authorId); }
  if (opts.tickerId) { filterConds.push("c.ticker_id = ?"); filterParams.push(opts.tickerId); }
  if (opts.ticker) { filterConds.push("c.ticker = ?"); filterParams.push(opts.ticker); }
  if (opts.direction) { filterConds.push("c.direction = ?"); filterParams.push(opts.direction); }
  if (opts.submittedBy) { filterConds.push("c.submitted_by = ?"); filterParams.push(opts.submittedBy); }
  if (opts.ids && opts.ids.length > 0) {
    filterConds.push(`c.id IN (${opts.ids.map(() => "?").join(",")})`);
    filterParams.push(...opts.ids);
  }

  if (opts.cursor) { cursorConds.push("c.created_at < ?"); cursorParams.push(opts.cursor); }

  const filterWhere = filterConds.length > 0 ? `WHERE ${filterConds.join(" AND ")}` : "";
  const fullConds = [...filterConds, ...cursorConds];
  const fullParams = [...filterParams, ...cursorParams];
  const fullWhere = fullConds.length > 0 ? `WHERE ${fullConds.join(" AND ")}` : "";

  // Total count (without cursor)
  const totalRow = db.prepare(`SELECT COUNT(*) as cnt FROM calls c ${filterWhere}`).get(...filterParams) as any;
  const total = totalRow.cnt;

  // Fetch items with denormalized caller/author info
  const rows = db.prepare(`
    SELECT c.*, u.handle as caller_handle, u.avatar_url as caller_avatar_url,
           a.handle as author_handle_joined, a.avatar_url as author_avatar_url
    FROM calls c
    LEFT JOIN users u ON u.id = c.caller_id
    LEFT JOIN authors a ON a.id = c.author_id
    ${fullWhere}
    ORDER BY c.created_at DESC
    LIMIT ?
  `).all(...fullParams, limit + 1);

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const items = sliced.map((row: any) => ({
    ...unpackRow(row),
    caller_handle: row.caller_handle ?? null,
    caller_avatar_url: row.caller_avatar_url ?? null,
    author_avatar_url: row.author_avatar_url ?? null,
  }));

  const lastItem = items[items.length - 1];
  const next_cursor = hasMore && lastItem ? lastItem.created_at : null;

  return { items, next_cursor, total };
}

/** Single call by ID with denormalized caller/author data. */
export function getCallWithJoins(id: string): any | null {
  const row = db.prepare(`
    SELECT c.*, u.handle as caller_handle, u.avatar_url as caller_avatar_url,
           a.handle as author_handle_joined, a.avatar_url as author_avatar_url
    FROM calls c
    LEFT JOIN users u ON u.id = c.caller_id
    LEFT JOIN authors a ON a.id = c.author_id
    WHERE c.id = ?
  `).get(id) as any;
  if (!row) return null;
  return {
    ...unpackRow(row),
    caller_handle: row.caller_handle ?? null,
    caller_avatar_url: row.caller_avatar_url ?? null,
    author_avatar_url: row.author_avatar_url ?? null,
  };
}

/** Batch fetch calls by IDs with denormalized data. */
export function getCallsBatch(ids: string[]): any[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT c.*, u.handle as caller_handle, u.avatar_url as caller_avatar_url,
           a.handle as author_handle_joined, a.avatar_url as author_avatar_url
    FROM calls c
    LEFT JOIN users u ON u.id = c.caller_id
    LEFT JOIN authors a ON a.id = c.author_id
    WHERE c.id IN (${placeholders})
    ORDER BY c.created_at DESC
  `).all(...ids);
  return rows.map((row: any) => ({
    ...unpackRow(row),
    caller_handle: row.caller_handle ?? null,
    caller_avatar_url: row.caller_avatar_url ?? null,
    author_avatar_url: row.author_avatar_url ?? null,
  }));
}

export function deleteCall(id: string): boolean {
  const result = db.prepare("DELETE FROM calls WHERE id = ?").run(id);
  // Clean up quote links
  db.prepare("DELETE FROM call_quotes WHERE call_id = ?").run(id);
  return result.changes > 0;
}

export function updatePrice(id: string, price: number): void {
  db.prepare(
    "UPDATE calls SET current_price = ?, price_updated_at = datetime('now') WHERE id = ?"
  ).run(price, id);
}

export function getCallsByUser(userId: string): Call[] {
  return listCalls({ callerId: userId });
}

// ── (Social queries archived — leaderboard, search, trending, paginated entity queries removed) ──
