import index from "./index.html";
import { getActiveCalls, getCall, listCalls, insertCall, updatePrice, insertUser, getUserByHandle, listUsers } from "./db";
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

  const activeCalls = getActiveCalls();

  const results = await Promise.allSettled(
    activeCalls.map(async (call) => {
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

          const call = insertCall({
            ...body,
            id: body.id || "",
            direction: body.direction ?? "long",
            entry_price: body.entry_price ?? body.price_at_call ?? 0,
            call_type: body.call_type ?? "original",
            status: "active",
            resolve_price: null,
            resolve_date: null,
            resolve_pnl: null,
            resolve_note: null,
            created_at: body.created_at ?? new Date().toISOString(),
            votes: 0,
            watchers: 0,
            comments: 0,
          } as Call);

          return Response.json({ id: call.id, url: `/t/${call.id}` }, { status: 201 });
        } catch (err) {
          console.error("POST /api/takes error:", err);
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
      },
    },
    "/api/users": {
      GET: () => {
        return Response.json(listUsers());
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
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`belief.board running at http://localhost:${PORT}`);
