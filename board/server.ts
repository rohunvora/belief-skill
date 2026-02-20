import index from "./index.html";
import {
  getAllCalls, getCall, listCalls, insertCall, updatePrice, deleteCall,
  insertUser, getUserByHandle, listUsers, getSubmitterProfile,
  listAuthors, getAuthorWithCalls, getQuotesByCall,
  listSources, getSourceWithDetail,
  listTickers, getTickerWithCalls,
  ensureAuthor, ensureSource, ensureTicker,
} from "./db";
import { renderCard } from "./templates/card";
import { renderPermalink } from "./templates/permalink";
import type { Call } from "./types";

// ── Price Cache ──────────────────────────────────────────────────────
interface PriceResult {
  price: number;
  changePct: number;
  timestamp: number;
}

let priceCache: Record<string, PriceResult> = {};
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;

// ── Price Fetchers ───────────────────────────────────────────────────

async function fetchYahoo(ticker: string): Promise<number | null> {
  try {
    const YF = (await import("yahoo-finance2")).default;
    const yf = new YF({ suppressNotices: ["yahooSurvey"] });
    const q = await yf.quote(ticker);
    return q?.postMarketPrice ?? q?.preMarketPrice ?? q?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

async function fetchHyperliquid(ticker: string): Promise<number | null> {
  try {
    const coin = ticker.split("-")[0] ?? ticker;
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
    });
    if (!res.ok) return null;
    const mids = (await res.json()) as Record<string, string>;
    const mid = mids[coin];
    if (mid) return parseFloat(mid);
    return null;
  } catch {
    return null;
  }
}

async function fetchPriceForCall(
  platform: string | null,
  ticker: string
): Promise<number | null> {
  switch (platform) {
    case "robinhood":
      return fetchYahoo(ticker);
    case "hyperliquid":
      return fetchHyperliquid(ticker);
    case "kalshi":
      return null;
    default:
      return null;
  }
}

async function fetchAllPrices(): Promise<Record<string, PriceResult>> {
  const now = Date.now();

  if (now - cacheTimestamp < CACHE_TTL_MS && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  const allCalls = getAllCalls();

  const results = await Promise.allSettled(
    allCalls.map(async (call) => {
      const price = await fetchPriceForCall(call.platform, call.ticker);
      if (price != null) {
        updatePrice(call.id, price);
      }
      return { callId: call.id, price, entryPrice: call.entry_price };
    })
  );

  const prices: Record<string, PriceResult> = {};

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.price != null) {
      const { callId, price, entryPrice } = result.value;
      const changePct =
        entryPrice !== 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
      prices[callId] = { price, changePct, timestamp: now };
    }
  }

  priceCache = prices;
  cacheTimestamp = now;

  return prices;
}

// ── Server ───────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 4000;

Bun.serve({
  port: PORT,
  routes: {
    // ── API ────────────────────────────────────────────────────
    "/api/prices": {
      GET: async () => {
        try {
          const prices = await fetchAllPrices();
          return Response.json(prices);
        } catch (e) {
          console.error("GET /api/prices error:", e);
          return Response.json({ error: "Failed to fetch prices" }, { status: 500 });
        }
      },
    },
    "/api/takes": {
      GET: (req) => {
        const url = new URL(req.url);
        const limit = Number(url.searchParams.get("limit")) || 50;
        const caller = url.searchParams.get("caller") ?? undefined;
        const calls = listCalls({ limit, callerId: caller });
        return Response.json(calls);
      },
      POST: async (req) => {
        try {
          const body = await req.json();

          if (!body.thesis || !body.ticker || !body.caller_id) {
            return Response.json(
              { error: "Missing required fields: thesis, ticker, caller_id" },
              { status: 400 },
            );
          }

          // Auto-create user if needed
          if (!getUserByHandle(body.caller_id)) {
            insertUser({
              id: body.caller_id,
              handle: body.source_handle ?? body.caller_id,
              bio: null,
              twitter: body.source_handle ?? null,
              verified: false,
              created_at: new Date().toISOString(),
              total_calls: 0,
              accuracy: null,
              total_pnl: null,
              watchers: 0,
            });
          }

          // Resolve entities: find existing or create new Author, Source, Ticker
          const authorId = body.source_handle
            ? ensureAuthor(body.source_handle)
            : null;

          const sourceId = (body.source_url || body.source_title)
            ? ensureSource({
                url: body.source_url ?? null,
                title: body.source_title ?? null,
                platform: body.source_platform ?? null,
                publishedAt: body.source_date ?? null,
                submittedBy: body.caller_id,
              })
            : null;

          const tickerId = ensureTicker({
            symbol: body.routed_ticker ?? body.ticker,
            instrument: body.instrument ?? null,
            platform: body.platform ?? null,
          });

          const call = insertCall({
            ...body,
            id: body.id || "",
            direction: body.routed_direction ?? body.direction ?? "long",
            ticker: body.routed_ticker ?? body.ticker,
            entry_price: body.entry_price ?? body.price_at_call ?? 0,
            call_type: body.call_type ?? "original",
            source_date: body.source_date ?? null,
            conviction: body.conviction ?? null,
            author_id: authorId,
            source_id: sourceId,
            ticker_id: tickerId,
            submitted_by: body.caller_id,
            price_captured_at: body.price_captured_at ?? null,
            created_at: body.created_at ?? new Date().toISOString(),
            votes: 0,
            watchers: 0,
            comments: 0,
          } as Call);

          const baseUrl = req.headers.get("x-forwarded-host")
            ? `https://${req.headers.get("x-forwarded-host")}`
            : req.headers.get("host")
            ? `${req.url.startsWith("https") ? "https" : "http"}://${req.headers.get("host")}`
            : "";
          return Response.json({ id: call.id, url: `${baseUrl}/t/${call.id}` }, { status: 201 });
        } catch (err) {
          console.error("POST /api/takes error:", err);
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
      },
    },
    "/api/takes/:id": {
      DELETE: (req) => {
        const deleted = deleteCall(req.params.id);
        if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json({ deleted: true });
      },
    },
    "/api/users": {
      GET: () => {
        return Response.json(listUsers());
      },
    },
    // ── Entity API Routes ─────────────────────────────────────
    "/api/authors": {
      GET: () => {
        return Response.json(listAuthors());
      },
    },
    "/api/authors/:handle": {
      GET: (req) => {
        const data = getAuthorWithCalls(req.params.handle);
        if (!data) return Response.json({ error: "Author not found" }, { status: 404 });
        return Response.json(data);
      },
    },
    "/api/sources": {
      GET: () => {
        return Response.json(listSources());
      },
    },
    "/api/sources/:id": {
      GET: (req) => {
        const data = getSourceWithDetail(req.params.id);
        if (!data) return Response.json({ error: "Source not found" }, { status: 404 });
        return Response.json(data);
      },
    },
    "/api/tickers": {
      GET: () => {
        return Response.json(listTickers());
      },
    },
    "/api/tickers/:symbol": {
      GET: (req) => {
        const data = getTickerWithCalls(req.params.symbol);
        if (!data) return Response.json({ error: "Ticker not found" }, { status: 404 });
        return Response.json(data);
      },
    },
    "/api/profile/:handle": {
      GET: (req) => {
        const data = getSubmitterProfile(req.params.handle);
        if (!data) return Response.json({ error: "User not found" }, { status: 404 });
        return Response.json(data);
      },
    },
    "/api/calls/:id/quotes": {
      GET: (req) => {
        const quotes = getQuotesByCall(req.params.id);
        return Response.json(quotes);
      },
    },
    // ── Server-rendered card: /t/:id/card (before catch-all) ──
    "/t/:id/card": {
      GET: (req) => {
        const call = getCall(req.params.id);
        if (!call) return new Response("Not found", { status: 404 });
        return new Response(renderCard(call), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
    // ── Server-rendered permalink: /t/:id (before catch-all) ─
    "/t/:id": {
      GET: (req) => {
        const call = getCall(req.params.id);
        if (!call) return new Response("Not found", { status: 404 });
        return new Response(renderPermalink(call), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
    // SPA catch-all — Bun handles bundling of .tsx/.css imports
    "/*": index,
  },
  // Only enable HMR/console in local dev, not production
  ...(process.env.NODE_ENV !== "production" && {
    development: {
      hmr: true,
      console: true,
    },
  }),
});

console.log(`belief.board running at http://localhost:${PORT}`);
