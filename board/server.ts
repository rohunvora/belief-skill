import index from "./index.html";
import { calls } from "./mock-data";

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
    // Extract coin from ticker like "ETH-USD" -> "ETH"
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
      // Kalshi series→market mapping is complex; simulate for now
      return null;
    default:
      return null;
  }
}

async function fetchAllPrices(): Promise<Record<string, PriceResult>> {
  const now = Date.now();

  // Return cache if fresh
  if (now - cacheTimestamp < CACHE_TTL_MS && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  const activeCalls = calls.filter((c) => c.status === "active");

  const results = await Promise.allSettled(
    activeCalls.map(async (call) => {
      const price = await fetchPriceForCall(call.platform, call.ticker);
      return { callId: call.id, price, entryPrice: call.entry_price };
    })
  );

  const prices: Record<string, PriceResult> = {};

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.price != null) {
      const { callId, price, entryPrice } = result.value;
      const changePct =
        entryPrice !== 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
      prices[callId] = {
        price,
        changePct,
        timestamp: now,
      };
    }
  }

  priceCache = prices;
  cacheTimestamp = now;

  return prices;
}

// ── Server ───────────────────────────────────────────────────────────

Bun.serve({
  port: 4000,
  routes: {
    "/api/prices": {
      GET: async () => {
        try {
          const prices = await fetchAllPrices();
          return Response.json(prices);
        } catch (e) {
          return Response.json({ error: "Failed to fetch prices" }, { status: 500 });
        }
      },
    },
    "/*": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("belief.board running at http://localhost:4000");
