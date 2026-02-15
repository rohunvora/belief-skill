/**
 * Live Instrument Discovery — web search + financial API-driven
 * 
 * No hardcoded theme maps. Given a thesis, discovers instruments by:
 * 1. Extracting searchable concepts from the thesis
 * 2. Web searching for relevant stocks, ETFs, crypto
 * 3. Parsing tickers from results
 * 4. Validating via Yahoo Finance / CoinGecko
 * 
 * This replaces the static theme-map approach.
 */

import type { CandidateInstrument } from "./types";

// Known crypto tokens for classification (not for discovery — these just help classify found tickers)
const KNOWN_CRYPTO = new Set([
  "BTC", "ETH", "SOL", "HYPE", "TRUMP", "PENGU", "BONK", "WIF", "PYTH", "JUP",
  "RAY", "JTO", "ORCA", "DYDX", "AAVE", "UNI", "MKR", "CRV", "SNX", "RNDR",
  "AKT", "TAO", "ARB", "OP", "MATIC", "LDO", "RPL", "ENS", "FXS", "DEGEN",
  "AERO", "BRETT", "TOSHI", "GALA", "IMX", "AXS", "SAND", "MANA", "VIRTUAL",
  "AI16Z", "FET", "NEAR", "AVAX", "DOT", "LINK", "ATOM",
]);

const SECONDARIES_PATH = new URL("../references/secondaries.json", import.meta.url).pathname;

/**
 * Generate search queries from a thesis
 */
function generateSearchQueries(thesis: string): string[] {
  const queries: string[] = [];
  
  // Clean up thesis — remove URLs, @mentions, hashtags
  const clean = thesis
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 120);
  
  // Extract key noun phrases / concepts (simplified)
  // Remove filler words to get the core concept
  const concept = clean
    .replace(/\b(I think|I believe|I feel like|might|maybe|could|will|would|should|going to|about to|is going|are going|blow up|moon|rip|send it|pump|be huge|get big)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || clean; // Fallback to original if everything got stripped
  
  // Primary: search for stocks in this sector/concept
  queries.push(`"${concept}" stocks ticker symbol`);
  queries.push(`best ${concept} stocks to buy 2025`);
  
  // ETF search
  queries.push(`${concept} ETF ticker`);
  
  // If crypto mentioned, add crypto search
  if (/crypto|token|chain|defi|dex|solana|ethereum|bitcoin|coin|web3/i.test(thesis)) {
    queries.push(`best ${concept} crypto tokens`);
  }
  
  return queries.slice(0, 3); // Max 3 queries
}

/**
 * Extract ticker symbols from search result text
 */
function extractTickersFromText(text: string): string[] {
  const tickers = new Set<string>();
  
  // Match $TICKER or (TICKER) or "TICKER:" patterns common in financial text
  const patterns = [
    /\$([A-Z]{1,6})\b/g,                          // $AAPL
    /\(([A-Z]{1,6})\)/g,                          // (AAPL)
    /\((?:NYSE|NASDAQ|AMEX|NYSEARCA)[:\s]+([A-Z]{1,6})\)/g, // (NYSE: NVO)
    /(?:NYSE|NASDAQ|AMEX|NYSEARCA)[:\s]+([A-Z]{1,6})\b/g,   // NYSE: AAPL
    /ticker[:\s]+([A-Z]{1,6})\b/gi,               // ticker: AAPL
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const ticker = match[2] || match[1];
      if (ticker && ticker.length >= 1 && ticker.length <= 6) {
        // Filter out common false positives
        if (!["THE", "FOR", "AND", "BUT", "NOT", "ARE", "WAS", "HAS", "CAN", "ITS",
              "ALL", "TOP", "NEW", "ETF", "IPO", "CEO", "CFO", "GDP", "USA", "SEC",
              "FDA", "DOJ", "FBI", "CIA", "DOD", "API", "NYSE", "NASDAQ", "AMEX",
              "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF",
              "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
              "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN",
              "ONE", "TWO", "YES", "GET", "BUY", "PUT", "RUN", "SET", "WAY",
              "AI", "EV", "UK", "EU", "US", "PE", "PS",
              // Stablecoins (not investable — no price appreciation)
              "USDC", "USDT", "DAI", "BUSD", "TUSD", "FRAX", "PYUSD", "RLUSD",
              // Common false positives from search text
              "DEX", "OCC", "IP", "RENDER",
              ].includes(ticker)) {
          tickers.add(ticker);
        }
      }
    }
  }
  
  return [...tickers];
}

/**
 * Search the web for instruments related to a thesis
 */
async function webSearchInstruments(query: string): Promise<{ tickers: string[]; snippets: string[] }> {
  try {
    // Use Brave Search API via the environment
    let apiKey = process.env.BRAVE_API_KEY || "";
    if (!apiKey) {
      // Try loading from env file
      try {
        const envFile = await Bun.file(`${process.env.HOME}/.config/env/global.env`).text();
        const match = envFile.match(/BRAVE_API_KEY=["']?([^"'\n]+)["']?/);
        if (match) apiKey = match[1];
      } catch {}
    }
    if (!apiKey) {
      console.error("   ⚠️ No BRAVE_API_KEY — skipping web search");
      return { tickers: [], snippets: [] };
    }
    
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    const resp = await fetch(url, {
      headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": apiKey },
    });
    
    if (!resp.ok) {
      console.error(`   ⚠️ Brave search: HTTP ${resp.status}`);
      return { tickers: [], snippets: [] };
    }
    
    const data = await resp.json() as any;
    const results = data.web?.results || [];
    
    const allText = results.map((r: any) => `${r.title} ${r.description}`.replace(/<[^>]+>/g, "")).join(" ");
    const snippets = results.map((r: any) => r.description || "").filter(Boolean);
    const tickers = extractTickersFromText(allText);
    
    if (tickers.length > 0) {
      console.error(`   📡 Web search found: [${tickers.join(",")}]`);
    }
    
    return { tickers, snippets };
  } catch (e) {
    console.error(`   ⚠️ Web search error: ${(e as Error).message}`);
    return { tickers: [], snippets: [] };
  }
}

/**
 * Validate a ticker exists via Yahoo Finance (quick quote check)
 */
async function validateTicker(ticker: string): Promise<boolean> {
  if (KNOWN_CRYPTO.has(ticker)) return true;
  try {
    const YF = (await import("yahoo-finance2")).default;
    const yf = new YF({ suppressNotices: ['yahooSurvey'] });
    const q = await yf.quote(ticker);
    return q && q.regularMarketPrice > 0;
  } catch {
    return false;
  }
}

/**
 * Main discovery function — replaces static theme-map matching
 */
export async function discoverInstrumentsLive(thesis: string): Promise<CandidateInstrument[]> {
  const candidates: CandidateInstrument[] = [];
  const seen = new Set<string>();
  
  // Load secondaries for reference
  let secondaries: Record<string, any> = {};
  try { secondaries = JSON.parse(await Bun.file(SECONDARIES_PATH).text()); } catch {}
  
  // 1. Extract explicitly mentioned tickers from thesis
  const mentionedTickers = extractTickersFromText(thesis);
  for (const ticker of mentionedTickers) {
    if (seen.has(ticker)) continue;
    seen.add(ticker);
    candidates.push({
      ticker,
      name: ticker,
      asset_class: KNOWN_CRYPTO.has(ticker) ? "crypto" : secondaries[ticker.toLowerCase()] ? "secondary" : "stock",
      sub_themes: ["direct_mention"],
      source: "thesis-mention",
    });
  }
  
  // 2. Extract known token names from text
  const KNOWN_NAMES: Record<string, { ticker: string; class: "stock" | "crypto" | "secondary" }> = {
    "bitcoin": { ticker: "BTC", class: "crypto" }, "ethereum": { ticker: "ETH", class: "crypto" },
    "solana": { ticker: "SOL", class: "crypto" }, "hyperliquid": { ticker: "HYPE", class: "crypto" },
    "nvidia": { ticker: "NVDA", class: "stock" }, "coinbase": { ticker: "COIN", class: "stock" },
    "palantir": { ticker: "PLTR", class: "stock" }, "tesla": { ticker: "TSLA", class: "stock" },
    "pudgy penguin": { ticker: "PENGU", class: "crypto" }, "pudgy": { ticker: "PENGU", class: "crypto" },
    "jupiter": { ticker: "JUP", class: "crypto" }, "raydium": { ticker: "RAY", class: "crypto" },
    "anduril": { ticker: "ANDURIL", class: "secondary" }, "spacex": { ticker: "SPACEX", class: "secondary" },
    "anthropic": { ticker: "ANTHROPIC", class: "secondary" }, "openai": { ticker: "OPENAI", class: "secondary" },
    "figure ai": { ticker: "FIGURE-AI", class: "secondary" },
  };
  
  const lower = thesis.toLowerCase();
  for (const [name, info] of Object.entries(KNOWN_NAMES)) {
    if (lower.includes(name) && !seen.has(info.ticker)) {
      seen.add(info.ticker);
      candidates.push({
        ticker: info.ticker,
        name: info.ticker,
        asset_class: info.class,
        sub_themes: ["direct_mention"],
        source: "thesis-mention",
      });
    }
  }
  
  // 3. Web search for instruments (sequential with delay to avoid rate limits)
  const queries = generateSearchQueries(thesis);
  const searchResults: { tickers: string[]; snippets: string[] }[] = [];
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1100)); // 1 req/sec rate limit
    const result = await webSearchInstruments(queries[i]);
    searchResults.push(result);
  }
  
  // Aggregate tickers from all search results, count frequency
  const tickerFreq = new Map<string, number>();
  for (const result of searchResults) {
    for (const ticker of result.tickers) {
      if (seen.has(ticker)) continue;
      tickerFreq.set(ticker, (tickerFreq.get(ticker) || 0) + 1);
    }
  }
  
  // Sort by frequency (mentioned in multiple search results = higher relevance)
  const searchTickers = [...tickerFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // Cap at 20 candidates from search
    .map(([ticker]) => ticker);
  
  for (const ticker of searchTickers) {
    if (seen.has(ticker)) continue;
    seen.add(ticker);
    candidates.push({
      ticker,
      name: ticker,
      asset_class: KNOWN_CRYPTO.has(ticker) ? "crypto" : "stock",
      sub_themes: ["web_search"],
      source: "web-search",
    });
  }
  
  // 4. Check secondaries by keyword
  for (const [id, sec] of Object.entries(secondaries)) {
    if (seen.has(id.toUpperCase())) continue;
    const matches = (sec.thesis_keywords || []).filter((kw: string) => lower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      seen.add(id.toUpperCase());
      candidates.push({
        ticker: id.toUpperCase(),
        name: sec.name,
        asset_class: "secondary",
        sub_themes: [sec.sector || "private"],
        source: "secondaries-registry",
      });
    }
  }
  
  return candidates;
}

// CLI: bun run discover.ts "I think peptides are about to blow up"
if (import.meta.main) {
  const thesis = process.argv.slice(2).join(" ");
  if (!thesis) {
    console.error("Usage: bun run discover.ts 'your thesis here'");
    process.exit(1);
  }
  
  console.error(`\n🔍 Discovering instruments for: "${thesis.slice(0, 80)}..."\n`);
  const candidates = await discoverInstrumentsLive(thesis);
  
  console.log(`\nFound ${candidates.length} candidates:`);
  for (const c of candidates) {
    console.log(`  ${c.ticker.padEnd(8)} ${c.asset_class.padEnd(10)} [${c.source}] ${c.sub_themes.join(", ")}`);
  }
}
