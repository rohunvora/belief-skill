#!/usr/bin/env bun
/**
 * Polymarket adapter — zero dependencies.
 * 
 * Usage:
 *   bun run instruments.ts "Trump tariffs"                  # keyword search (politics, crypto, etc.)
 *   bun run instruments.ts --slug nba-lac-lal-2026-02-20    # direct slug (sports)
 *   bun run instruments.ts --game nba LAL LAC 2026-02-20    # construct slug from game info
 * 
 * Two search modes:
 *   Keywords: paginates gamma API, client-side filter. Best for high-volume markets.
 *   Slug/Game: direct lookup. Required for sports (low-volume, buried in pagination).
 */

const GAMMA = "https://gamma-api.polymarket.com";

// --- NBA team abbreviations (ESPN → Polymarket slug format, lowercase) ---
const NBA_ABBR: Record<string, string> = {
  ATL: "atl", BOS: "bos", BKN: "bkn", CHA: "cha", CHI: "chi", CLE: "cle",
  DAL: "dal", DEN: "den", DET: "det", GSW: "gsw", HOU: "hou", IND: "ind",
  LAC: "lac", LAL: "lal", MEM: "mem", MIA: "mia", MIL: "mil", MIN: "min",
  NOP: "nop", NYK: "nyk", OKC: "okc", ORL: "orl", PHI: "phi", PHX: "phx",
  POR: "por", SAC: "sac", SAS: "sas", TOR: "tor", UTA: "uta", WAS: "was",
};

interface Market {
  question: string;
  outcomePrices: string;
  outcome1: string;
  outcome2: string;
  liquidity: string;
  volume: string;
}

interface PMEvent {
  title: string;
  slug: string;
  markets: Market[];
}

function parseMarket(m: Market, eventSlug?: string) {
  const prices = JSON.parse(m.outcomePrices || '["0","0"]');
  const slug = eventSlug || (m as any).groupSlug || (m as any).slug || "";
  return {
    question: m.question,
    o1: { label: m.outcome1 || "Yes", price: parseFloat(prices[0]) },
    o2: { label: m.outcome2 || "No", price: parseFloat(prices[1]) },
    liquidity: parseFloat(m.liquidity || "0"),
    volume: parseFloat(m.volume || "0"),
    url: `https://polymarket.com/event/${slug}`,
    type: classify(m.question),
  };
}

function classify(q: string): string {
  if (!q.includes("vs.")) return "prediction";
  if (q.includes("Spread")) return "spread";
  if (q.includes("O/U")) return "total";
  if (q.includes("Over") || q.includes("Under") || q.includes(":")) return "prop";
  return "moneyline";
}

// Direct slug lookup — one fetch, always works
async function fetchSlug(slug: string) {
  const res = await fetch(`${GAMMA}/events?slug=${slug}`);
  if (!res.ok) return [];
  const events: PMEvent[] = await res.json();
  return events.flatMap(e => e.markets.map(m => parseMarket(m, e.slug)));
}

// Keyword search — paginate by volume, client-side filter
async function searchKeyword(query: string) {
  const terms = query.toLowerCase().split(/\s+/);
  const results: ReturnType<typeof parseMarket>[] = [];

  for (let offset = 0; offset < 500; offset += 100) {
    const res = await fetch(
      `${GAMMA}/events?closed=false&limit=100&offset=${offset}&order=volume24hr&ascending=false`
    );
    if (!res.ok) break;
    const events: PMEvent[] = await res.json();
    if (!events.length) break;

    for (const e of events) {
      const hay = `${e.title} ${e.slug}`.toLowerCase();
      if (terms.every(t => hay.includes(t))) {
        for (const m of e.markets) results.push(parseMarket(m, e.slug));
      }
    }
    if (results.length >= 20) break;
  }
  return results;
}

// Construct sport slug: {league}-{away}-{home}-{date}
function buildGameSlug(league: string, home: string, away: string, date: string): string {
  const l = league.toLowerCase();
  const h = (NBA_ABBR[home.toUpperCase()] || home).toLowerCase();
  const a = (NBA_ABBR[away.toUpperCase()] || away).toLowerCase();
  return `${l}-${a}-${h}-${date}`;
}

// --- Output ---
function print(results: ReturnType<typeof parseMarket>[]) {
  const seen = new Set<string>();
  results = results.filter(r => { if (seen.has(r.question)) return false; seen.add(r.question); return true; });
  const order: Record<string, number> = { moneyline: 0, spread: 1, total: 2, prop: 3, prediction: 4 };
  results.sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5));

  if (!results.length) { console.log("No markets found."); return; }

  for (const r of results) {
    const tag = r.type !== "prediction" ? ` [${r.type.toUpperCase()}]` : "";
    console.log(`${r.question}${tag}`);
    console.log(`  ${r.o1.label}: $${r.o1.price.toFixed(2)} (${(r.o1.price * 100).toFixed(0)}%)`);
    console.log(`  ${r.o2.label}: $${r.o2.price.toFixed(2)} (${(r.o2.price * 100).toFixed(0)}%)`);
    console.log(`  Liq: $${r.liquidity.toLocaleString()} | Vol: $${r.volume.toLocaleString()}`);
    console.log(`  ${r.url}`);
    console.log();
  }
}

// --- CLI ---
const args = process.argv.slice(2);

(async () => {
  const slugIdx = args.indexOf("--slug");
  const gameIdx = args.indexOf("--game");

  if (slugIdx !== -1) {
    print(await fetchSlug(args[slugIdx + 1]));
  } else if (gameIdx !== -1) {
    // --game {league} {home} {away} {date}
    const [league, home, away, date] = args.slice(gameIdx + 1, gameIdx + 5);
    const slug = buildGameSlug(league, home, away, date);
    console.log(`Slug: ${slug}`);
    print(await fetchSlug(slug));
  } else {
    const query = args.join(" ");
    if (!query) { console.error("Usage: bun run instruments.ts <query> | --slug <slug> | --game <league> <home> <away> <date>"); process.exit(1); }
    print(await searchKeyword(query));
  }
})();
