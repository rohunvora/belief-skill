/**
 * Instrument Discovery — maps thesis text to candidate instruments
 * 
 * Primary: live web search (discover.ts) — handles ANY thesis, no hardcoded knowledge needed
 * Fallback: theme-map.json for fast offline matching when search unavailable
 */

import type { CandidateInstrument } from "./types";
import { expandThesis, extractMentionedTickers } from "./expand";
import { discoverInstrumentsLive } from "./discover";

const THEME_MAP_PATH = new URL("../references/theme-map.json", import.meta.url).pathname;
const SECONDARIES_PATH = new URL("../references/secondaries.json", import.meta.url).pathname;

interface ThemeEntry {
  keywords: string[];
  tickers: {
    stocks?: string[];
    etfs?: string[];
    crypto?: string[];
    secondaries?: string[];
  };
}

interface SecondaryEntry {
  name: string;
  sector: string;
  valuation: string;
  thesis_keywords: string[];
  [key: string]: any;
}

export async function discoverInstruments(thesis: string): Promise<CandidateInstrument[]> {
  // Try live web search first — handles ANY thesis without hardcoded knowledge
  let liveCandidates: CandidateInstrument[] = [];
  try {
    liveCandidates = await discoverInstrumentsLive(thesis);
  } catch (e) {
    console.error(`   ⚠️ Live discovery failed: ${(e as Error).message}`);
  }
  
  // Also run theme-map matching for fast, reliable coverage of known themes
  const themeMap: Record<string, ThemeEntry> = JSON.parse(await Bun.file(THEME_MAP_PATH).text());
  const secondaries: Record<string, SecondaryEntry> = JSON.parse(await Bun.file(SECONDARIES_PATH).text());
  
  const lower = thesis.toLowerCase();
  const candidates: CandidateInstrument[] = [];
  const seen = new Set<string>();
  
  // Start with live-discovered candidates (highest priority — real-time data)
  for (const c of liveCandidates) {
    if (!seen.has(c.ticker)) {
      seen.add(c.ticker);
      candidates.push(c);
    }
  }

  // Match themes by keyword overlap
  const matchedThemes: { theme: string; entry: ThemeEntry; score: number }[] = [];
  
  for (const [theme, entry] of Object.entries(themeMap)) {
    const matchCount = entry.keywords.filter(kw => {
      const kwLower = kw.toLowerCase();
      if (kwLower.length <= 3) {
        return new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower);
      }
      return lower.includes(kwLower);
    }).length;
    if (matchCount > 0) {
      matchedThemes.push({ theme, entry, score: matchCount });
    }
  }

  // Sort by match strength
  matchedThemes.sort((a, b) => b.score - a.score);

  // Semantic expansion: find themes that keyword matching misses
  // Semantic expansion: add expanded themes with lower priority
  const expandedThemeNames = expandThesis(thesis);
  for (const themeName of expandedThemeNames) {
    if (themeMap[themeName] && !matchedThemes.some(m => m.theme === themeName)) {
      // Give expanded themes a fractional score so they don't dominate
      matchedThemes.push({ theme: themeName, entry: themeMap[themeName], score: 0.3 });
    }
  }
  matchedThemes.sort((a, b) => b.score - a.score);

  // Take keyword-matched themes first, then fill with expanded (up to 5 total)
  const keywordThemes = matchedThemes.filter(m => m.score >= 1);
  const expandedOnly = matchedThemes.filter(m => m.score < 1);
  const remainingSlots = Math.max(0, 5 - keywordThemes.length);
  const topThemes = [...keywordThemes.slice(0, 5), ...expandedOnly.slice(0, remainingSlots)];

  for (const { theme, entry } of topThemes) {
    // Add stocks
    for (const ticker of entry.tickers.stocks || []) {
      if (!seen.has(ticker)) {
        seen.add(ticker);
        candidates.push({
          ticker,
          name: ticker, // Will be enriched later
          asset_class: "stock",
          sub_themes: [theme],
          source: "theme-map",
        });
      }
    }

    // Add ETFs
    for (const ticker of entry.tickers.etfs || []) {
      if (!seen.has(ticker)) {
        seen.add(ticker);
        candidates.push({
          ticker,
          name: ticker,
          asset_class: "etf",
          sub_themes: [theme],
          source: "theme-map",
        });
      }
    }

    // Add crypto
    for (const ticker of entry.tickers.crypto || []) {
      if (!seen.has(ticker)) {
        seen.add(ticker);
        candidates.push({
          ticker,
          name: ticker,
          asset_class: "crypto",
          sub_themes: [theme],
          source: "theme-map",
        });
      }
    }

    // Add secondaries
    for (const id of entry.tickers.secondaries || []) {
      if (!seen.has(id) && secondaries[id]) {
        seen.add(id);
        const sec = secondaries[id];
        candidates.push({
          ticker: id.toUpperCase(),
          name: sec.name,
          asset_class: "secondary",
          sub_themes: [theme],
          source: "secondaries-registry",
        });
      }
    }
  }

  // Also check secondaries directly by keyword
  for (const [id, sec] of Object.entries(secondaries)) {
    if (seen.has(id)) continue;
    const matches = sec.thesis_keywords.filter(kw => lower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      seen.add(id);
      candidates.push({
        ticker: id.toUpperCase(),
        name: sec.name,
        asset_class: "secondary",
        sub_themes: [sec.sector],
        source: "secondaries-registry",
      });
    }
  }

  // Extract explicitly mentioned tickers from thesis text
  const mentionedTickers = extractMentionedTickers(thesis);
  for (const ticker of mentionedTickers) {
    if (!seen.has(ticker)) {
      seen.add(ticker);
      // Auto-classify: check if it's a known crypto or secondary
      const isSecondary = secondaries[ticker.toLowerCase()];
      const isCrypto = ["BTC", "ETH", "SOL", "HYPE", "TRUMP", "PENGU", "BONK", "WIF", "PYTH", "JUP", "RAY", "JTO", "ORCA", "DYDX", "AAVE", "UNI", "MKR", "CRV", "SNX", "RNDR", "AKT", "TAO", "ARB", "OP", "MATIC", "LDO", "RPL", "ENS", "FXS", "DEGEN", "AERO", "BRETT", "TOSHI", "GALA", "IMX", "AXS", "SAND", "MANA", "VIRTUAL", "AI16Z", "FET", "NEAR"].includes(ticker);
      candidates.push({
        ticker,
        name: isSecondary?.name || ticker,
        asset_class: isSecondary ? "secondary" : isCrypto ? "crypto" : "stock",
        sub_themes: topThemes.length > 0 ? [topThemes[0].theme] : ["direct_mention"],
        source: "thesis-mention",
      });
    }
  }

  // If we found very few candidates, broaden the search
  if (candidates.length < 3 && matchedThemes.length === 0) {
    // Fallback: return a generic "needs web search" signal
    console.error("   ⚠️ No theme matches found. Thesis may need web search for instrument discovery.");
  }

  return candidates;
}
