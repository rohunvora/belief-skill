/**
 * Live Instrument Discovery — web search driven
 * 
 * Given a thesis, discovers tradeable instruments by:
 * 1. Generating smart search queries from the thesis
 * 2. Searching the web for relevant stocks, ETFs, crypto
 * 3. Parsing tickers from search results
 * 4. Returning candidates for enrichment
 * 
 * Web search is the PRIMARY discovery mechanism. No theme maps needed.
 */

import type { CandidateInstrument } from "./types";

// Known crypto tokens — for CLASSIFICATION only (helps tag discovered tickers)
const KNOWN_CRYPTO = new Set([
  "BTC", "ETH", "SOL", "HYPE", "TRUMP", "PENGU", "BONK", "WIF", "PYTH", "JUP",
  "RAY", "JTO", "ORCA", "DYDX", "AAVE", "UNI", "MKR", "CRV", "SNX", "RNDR",
  "AKT", "TAO", "ARB", "OP", "MATIC", "LDO", "RPL", "ENS", "FXS", "DEGEN",
  "AERO", "BRETT", "TOSHI", "GALA", "IMX", "AXS", "SAND", "MANA", "VIRTUAL",
  "AI16Z", "FET", "NEAR", "AVAX", "DOT", "LINK", "ATOM", "DOGE", "SHIB", "PEPE",
]);

// Known ETFs — for CLASSIFICATION only (web search returns them mixed with stocks)
const KNOWN_ETFS = new Set([
  // Broad market
  "SPY", "QQQ", "DIA", "IWM", "VTI", "VOO",
  // Sector ETFs
  "XLE", "XLF", "XLK", "XLV", "XLI", "XLU", "XLP", "XLY", "XLB", "XLRE",
  "XOP", "XBI", "XHB",
  // Thematic ETFs
  "ARKK", "ARKQ", "ARKW", "ARKF", "ARKG", "ARKX",
  "SMH", "SOXX", "AIQ", "BOTZ", "ROBO", "IRBO", "HACK", "CIBR", "BUG",
  "ITA", "PPA", "DFEN",
  "GLD", "IAU", "SLV", "GDX", "GDXJ",
  "URA", "URNM", "NLR",
  "LIT", "BATT",
  "ITB", "VNQ", "IYR", "SRS",
  "TLT", "TMF", "TBT", "SHY", "BND",
  "IBIT", "BITO", "FBTC", "ETHA", "BITI",
  "FXI", "KWEB", "MCHI", "EEM",
  "INDA", "EPI", "SMIN",
  "DRIV", "IDRV",
  "UFO",
  "IPO",
  "ESPO", "HERO", "GAMR",
  "PRNT",
  "PHO", "CGW", "FIW",
  "MOO",
  "PAVE", "IFRA",
  "SQQQ", "TQQQ", "SPXU", "UPRO",
  "USO", "OIH", "VDE",
  "QTUM",
]);

const SECONDARIES_PATH = new URL("../references/secondaries.json", import.meta.url).pathname;

/**
 * Extract the core investable CONCEPT from a thesis.
 * 
 * "China is catching up in AI. This will trigger massive US military AI spending."
 * → "military AI defense spending"
 * 
 * "Everyone I know is on Ozempic. The weight loss drug revolution is real."
 * → "weight loss drug Ozempic GLP-1"
 * 
 * "I think peptides are about to blow up. Every gym bro is talking about BPC-157."
 * → "peptides BPC-157"
 */
function extractConcept(thesis: string): string {
  // Clean up
  let clean = thesis
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
    .replace(/\n+/g, " ")
    .trim();
  
  // Remove conversational filler
  const FILLER = /\b(I think|I believe|I feel like|in my opinion|honestly|tbh|imo|imho|personally|I'm certain|I'm convinced|it's? clear that|it seems like|people are saying|everyone is saying|it looks like|my take is|everyone I know|every \w+ I know)\b/gi;
  clean = clean.replace(FILLER, "");
  
  // Remove prediction language (keep the WHAT, drop the "will/going to/about to")
  const PREDICTION = /\b(will|going to|about to|is gonna|are gonna|gonna|gon|finna|destined to|set to|poised to|expected to|likely to|bound to|might|could|may)\b/gi;
  clean = clean.replace(PREDICTION, "");
  
  // Remove hype language
  const HYPE = /\b(blow up|moon|rip|send it|pump|be huge|get big|explode|skyrocket|crush it|kill it|10x|100x|massive|insane|do well|the real|the next|the only)\b/gi;
  clean = clean.replace(HYPE, "");
  
  // Remove common verbs and filler words that don't carry sector information
  const VERBS = /\b(is|are|was|were|be|been|being|have|has|had|do|does|did|make|made|become|think|know|see|say|said|get|go|come|take|to|left|this|that|than|from|with|for|of|the|a|an|on|in|by|at|every|everyone|nobody|anymore|already|just|really|actually|basically|literally|year|years|ever|only|so|very|too|way|now|here|there|more|most|much|many|other|same|even|new|big|bigger|biggest|about|or|and|but)\b/gi;
  clean = clean.replace(VERBS, "");
  
  // Remove price targets (keep the asset name, drop the dollar amount)
  clean = clean.replace(/\$[\d,.]+[kKmMbB]?/gi, "");
  
  // Remove standalone numbers (e.g., "$20,000" → "20,000" after $ strip, or "2 years")
  clean = clean.replace(/\b\d[\d,.]*\b/g, "");
  
  // Remove trailing punctuation and periods
  clean = clean.replace(/[.!?]+/g, " ");
  
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  
  // Lower fallback threshold — even a single ticker name is a valid concept
  if (clean.length < 3) {
    clean = thesis.replace(/https?:\/\/\S+/g, "").replace(/@\w+/g, "").replace(/[.!?]+/g, " ").trim().slice(0, 100);
  }
  
  return clean.slice(0, 100);
}

/**
 * Generate high-quality search queries from a thesis.
 * 
 * Strategy:
 * - Query 1: "[concept] stocks to invest in" — finds stock picks articles
 * - Query 2: "[concept] companies publicly traded ticker" — finds specific companies
 * - Query 3: "[concept] ETF" — finds relevant ETFs
 * 
 * For crypto-related theses, adds crypto-specific queries.
 */
function generateSearchQueries(thesis: string): string[] {
  const concept = extractConcept(thesis);
  const queries: string[] = [];
  
  // Detect if thesis mentions specific sectors/topics for better queries
  const lower = thesis.toLowerCase();
  
  // Check for specific well-known topics to generate targeted queries
  // Use word boundaries and negative lookaheads to avoid false positives
  const isCrypto = /\b(crypto|token|chain|defi|dex|solana|ethereum|bitcoin|coin|web3|onchain|memecoin)\b/i.test(thesis);
  const isDefense = /\b(defense|military|pentagon|warfare|weapons|dod|army|navy)\b/i.test(thesis);
  const isBiotech = /\b(drug|pharma|biotech|fda|clinical|ozempic|wegovy|peptide|glp|obesity|weight loss)\b/i.test(thesis);
  const isNuclear = /\b(nuclear|uranium)\b/i.test(thesis);
  // "power" alone is too broad (matches "AI-powered"), require "power plant/grid/generation/energy"
  const isEnergy = /\b(energy stocks?|oil sector|solar energy|electricity|power grid|power plant|power generation)\b/i.test(thesis) && !isNuclear;
  const isRealEstate = /\b(housing|real estate|mortgage|home(?:builder)?|property|reit|office building|commercial real estate)\b/i.test(thesis);
  // "dollar" alone matches "trillion dollar" — require financial context
  const isMacro = /\b(interest rates?|fed cut|fed rate|inflation|treasury|bond market|gold price|silver price)\b/i.test(thesis) 
    || (/\b(dollar)\b/i.test(thesis) && /\b(collapse|crash|decline|weak|strong|rally|index|reserve|currency|dedollarization)\b/i.test(thesis));
  const isOil = /\boil\b/i.test(thesis) && !/\bbattery waste.+oil\b/i.test(thesis); // Don't match "battery waste is the next oil"
  const isGold = /\bgold\b/i.test(thesis) && !/gold standard/i.test(thesis); // Allow "gold standard" as metaphor
  
  // Build a sector-focused concept for better queries
  let sectorKeyword = concept;
  
  // For simple directional theses, use the asset/sector name directly
  if (isOil) sectorKeyword = "oil energy";
  else if (isGold) sectorKeyword = "gold precious metals";
  else if (isNuclear) sectorKeyword = "nuclear energy uranium";
  else if (isEnergy && !isOil) sectorKeyword = "energy";
  
  // Query 1: Find companies/stocks in this space
  if (isDefense) {
    queries.push(`best defense AI military stocks to invest 2025`);
    queries.push(`defense contractors stocks ticker symbol PLTR LDOS BAH`);
  } else if (isNuclear) {
    queries.push(`best nuclear energy uranium stocks to buy 2025 CEG VST CCJ`);
    queries.push(`nuclear energy uranium ETF URA URNM NLR`);
  } else if (isBiotech) {
    queries.push(`${concept} pharmaceutical companies stocks NYSE NASDAQ`);
    queries.push(`best ${concept} stocks to invest 2025`);
  } else if (isOil) {
    queries.push(`best oil stocks to buy 2025 XOM CVX COP`);
    queries.push(`oil energy ETF XLE XOP USO`);
  } else if (isGold) {
    queries.push(`best gold stocks ETF GLD NEM GDX 2025`);
    queries.push(`gold safe haven investments ETF miners`);
  } else if (isEnergy) {
    queries.push(`best ${sectorKeyword} stocks to buy 2025`);
    queries.push(`${sectorKeyword} companies stocks ticker symbol`);
  } else if (isRealEstate) {
    queries.push(`${concept} REITs stocks homebuilders ticker`);
    queries.push(`best real estate ETF stocks 2025`);
  } else if (isMacro) {
    queries.push(`${concept} ETFs to trade hedge`);
    queries.push(`${concept} stocks investments 2025`);
  } else if (isCrypto) {
    queries.push(`${concept} stocks to buy 2025`);
    queries.push(`${concept} crypto tokens to buy 2025`);
  } else {
    queries.push(`${concept} stocks to buy 2025`);
    queries.push(`${concept} publicly traded companies ticker symbol`);
  }
  
  // Query 3: ETFs (always useful for diversification)
  if (!isOil && !isGold && !isNuclear) { // Already covered in sector-specific queries above
    queries.push(`best ${sectorKeyword} ETF 2025`);
  }
  
  // Query 4: Crypto-specific (only if relevant and not already added)
  if (isCrypto && queries.length < 4) {
    queries.push(`${concept} crypto tokens to buy`);
  }
  
  return queries.slice(0, 4); // Max 4 queries
}

/**
 * Extract ticker symbols from search result text.
 * Looks for patterns: $AAPL, (AAPL), NYSE: AAPL, NASDAQ: AAPL, ticker: AAPL
 */
function extractTickersFromText(text: string): string[] {
  const tickers = new Set<string>();
  
  const patterns = [
    /\$([A-Z]{1,6})\b/g,                          // $AAPL
    /\(([A-Z]{1,6})\)/g,                          // (AAPL)
    /\((?:NYSE|NASDAQ|AMEX|NYSEARCA|NYSEMKT)[:\s]+([A-Z]{1,6})\)/g, // (NYSE: NVO)
    /(?:NYSE|NASDAQ|AMEX|NYSEARCA|NYSEMKT)[:\s]+([A-Z]{1,6})\b/g,   // NYSE: AAPL
    /ticker[:\s]+([A-Z]{1,6})\b/gi,               // ticker: AAPL
    /\b([A-Z]{2,5})\s+stock\b/g,                  // AAPL stock
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const ticker = match[2] || match[1];
      if (ticker && ticker.length >= 2 && ticker.length <= 5) {
        if (!FALSE_POSITIVE_TICKERS.has(ticker)) {
          tickers.add(ticker);
        }
      }
    }
  }
  
  return [...tickers];
}

// Words that look like tickers but aren't
const FALSE_POSITIVE_TICKERS = new Set([
  "THE", "FOR", "AND", "BUT", "NOT", "ARE", "WAS", "HAS", "CAN", "ITS",
  "ALL", "TOP", "NEW", "ETF", "IPO", "CEO", "CFO", "GDP", "USA", "SEC",
  "FDA", "DOJ", "FBI", "CIA", "DOD", "API", "NYSE", "NASDAQ", "AMEX",
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF",
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN",
  "ONE", "TWO", "YES", "GET", "BUY", "PUT", "RUN", "SET", "WAY", "HOW", "WHY",
  "AI", "EV", "UK", "EU", "US", "PE", "PS", "OR", "TO", "AT", "BY", "IN",
  // Stablecoins — not investable
  "USDC", "USDT", "DAI", "BUSD", "TUSD", "FRAX", "PYUSD", "RLUSD",
  // Other false positives
  "DEX", "OCC", "IP", "RENDER", "TVL", "APY", "APR", "THEN", "ALSO", "BEST",
]);

const SEARCH_CACHE_DIR = new URL("../data/cache/search/", import.meta.url).pathname;
const SEARCH_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cache key from query string — simple hash
 */
function searchCacheKey(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = ((hash << 5) - hash + query.charCodeAt(i)) | 0;
  }
  return `search_${Math.abs(hash).toString(36)}`;
}

/**
 * Search the web for instruments related to a thesis.
 * Results are cached for 7 days to preserve API budget.
 */
async function webSearchInstruments(query: string): Promise<{ tickers: string[]; snippets: string[] }> {
  // Check cache first
  try {
    const cacheFile = Bun.file(`${SEARCH_CACHE_DIR}${searchCacheKey(query)}.json`);
    if (await cacheFile.exists()) {
      const cached = JSON.parse(await cacheFile.text());
      if (Date.now() - cached.fetched_at < SEARCH_CACHE_TTL) {
        if (cached.tickers.length > 0) {
          console.error(`   📦 [cached] [${query.slice(0, 50)}] → [${cached.tickers.join(",")}]`);
        }
        return { tickers: cached.tickers, snippets: cached.snippets };
      }
    }
  } catch {}

  try {
    let apiKey = process.env.BRAVE_API_KEY || "";
    if (!apiKey) {
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
    
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`;
    let resp: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      resp = await fetch(url, {
        headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": apiKey },
      });
      if (resp.status === 429) {
        const delay = (attempt + 1) * 2000; // 2s, 4s, 6s backoff
        console.error(`   ⚠️ Brave 429 — retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      break;
    }
    
    if (!resp || !resp.ok) {
      console.error(`   ⚠️ Brave search: HTTP ${resp?.status || 'unknown'}`);
      return { tickers: [], snippets: [] };
    }
    
    const data = await resp.json() as any;
    const results = data.web?.results || [];
    
    const allText = results.map((r: any) => `${r.title} ${r.description}`.replace(/<[^>]+>/g, "")).join("\n");
    const snippets = results.map((r: any) => r.description || "").filter(Boolean);
    const tickers = extractTickersFromText(allText);
    
    if (tickers.length > 0) {
      console.error(`   📡 [${query.slice(0, 50)}] → [${tickers.join(",")}]`);
    }
    
    // Cache the result
    try {
      await Bun.write(`${SEARCH_CACHE_DIR}${searchCacheKey(query)}.json`, JSON.stringify({
        query, tickers, snippets, fetched_at: Date.now(),
      }));
    } catch {}
    
    return { tickers, snippets };
  } catch (e) {
    console.error(`   ⚠️ Web search error: ${(e as Error).message}`);
    return { tickers: [], snippets: [] };
  }
}

/**
 * Main discovery function — web search is primary.
 */
export async function discoverInstrumentsLive(thesis: string): Promise<CandidateInstrument[]> {
  const candidates: CandidateInstrument[] = [];
  const seen = new Set<string>();
  
  // Load secondaries
  let secondaries: Record<string, any> = {};
  try { secondaries = JSON.parse(await Bun.file(SECONDARIES_PATH).text()); } catch {}
  
  const lower = thesis.toLowerCase();
  
  // ── 1. Extract explicitly mentioned tickers from thesis text ──
  const mentionedTickers = extractTickersFromText(thesis);
  for (const ticker of mentionedTickers) {
    if (seen.has(ticker)) continue;
    seen.add(ticker);
    candidates.push({
      ticker,
      name: ticker,
      asset_class: KNOWN_CRYPTO.has(ticker) ? "crypto" : KNOWN_ETFS.has(ticker) ? "etf" : secondaries[ticker.toLowerCase()] ? "secondary" : "stock",
      sub_themes: ["direct_mention"],
      source: "thesis-mention",
    });
  }
  
  // ── 2. Extract known company/token names from text ──
  const KNOWN_NAMES: Record<string, { ticker: string; class: "stock" | "crypto" | "secondary" }> = {
    // Crypto
    "bitcoin": { ticker: "BTC", class: "crypto" }, "ethereum": { ticker: "ETH", class: "crypto" },
    "solana": { ticker: "SOL", class: "crypto" }, "hyperliquid": { ticker: "HYPE", class: "crypto" },
    // Companies (by name)
    "nvidia": { ticker: "NVDA", class: "stock" }, "coinbase": { ticker: "COIN", class: "stock" },
    "palantir": { ticker: "PLTR", class: "stock" }, "tesla": { ticker: "TSLA", class: "stock" },
    "google": { ticker: "GOOG", class: "stock" }, "waymo": { ticker: "GOOG", class: "stock" },
    "meta": { ticker: "META", class: "stock" }, "microsoft": { ticker: "MSFT", class: "stock" },
    "apple": { ticker: "AAPL", class: "stock" }, "amazon": { ticker: "AMZN", class: "stock" },
    "uber": { ticker: "UBER", class: "stock" }, "lyft": { ticker: "LYFT", class: "stock" },
    // Secondaries (by name)
    "anduril": { ticker: "ANDURIL", class: "secondary" }, "spacex": { ticker: "SPACEX", class: "secondary" },
    "starlink": { ticker: "SPACEX", class: "secondary" },
    "anthropic": { ticker: "ANTHROPIC", class: "secondary" }, "openai": { ticker: "OPENAI", class: "secondary" },
    "chatgpt": { ticker: "OPENAI", class: "secondary" },
    "figure ai": { ticker: "FIGURE-AI", class: "secondary" },
    // Brands → parent companies
    "ozempic": { ticker: "NVO", class: "stock" }, "wegovy": { ticker: "NVO", class: "stock" },
    "mounjaro": { ticker: "LLY", class: "stock" }, "zepbound": { ticker: "LLY", class: "stock" },
    "instagram": { ticker: "META", class: "stock" }, "facebook": { ticker: "META", class: "stock" },
    "youtube": { ticker: "GOOG", class: "stock" },
    // Crypto tokens by name
    "pudgy penguin": { ticker: "PENGU", class: "crypto" }, "pudgy": { ticker: "PENGU", class: "crypto" },
    "jupiter": { ticker: "JUP", class: "crypto" }, "raydium": { ticker: "RAY", class: "crypto" },
    "bonk": { ticker: "BONK", class: "crypto" }, "dogwifhat": { ticker: "WIF", class: "crypto" },
  };
  
  for (const [name, info] of Object.entries(KNOWN_NAMES)) {
    if (lower.includes(name) && !seen.has(info.ticker)) {
      seen.add(info.ticker);
      candidates.push({
        ticker: info.ticker,
        name: info.ticker,
        asset_class: info.class,
        sub_themes: ["direct_mention"],
        source: "name-match",
      });
    }
  }
  
  // ── 3. Web search — the PRIMARY discovery mechanism ──
  const queries = generateSearchQueries(thesis);
  const allSearchTickers: Map<string, number> = new Map(); // ticker → frequency count
  
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500)); // Brave rate limit: ~1 req/sec + buffer
    const result = await webSearchInstruments(queries[i]);
    for (const ticker of result.tickers) {
      if (seen.has(ticker)) continue;
      allSearchTickers.set(ticker, (allSearchTickers.get(ticker) || 0) + 1);
    }
  }
  
  // Sort by frequency, add to candidates
  const searchTickers = [...allSearchTickers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  for (const [ticker, freq] of searchTickers) {
    if (seen.has(ticker)) continue;
    seen.add(ticker);
    candidates.push({
      ticker,
      name: ticker,
      asset_class: KNOWN_CRYPTO.has(ticker) ? "crypto" : KNOWN_ETFS.has(ticker) ? "etf" : "stock",
      sub_themes: ["web_search"],
      source: `web-search (${freq}x)`,
    });
  }
  
  // ── 4. Secondaries by keyword match ──
  for (const [id, sec] of Object.entries(secondaries) as [string, any][]) {
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
    console.log(`  ${c.ticker.padEnd(10)} ${c.asset_class.padEnd(10)} [${c.source}] ${c.sub_themes.join(", ")}`);
  }
}
