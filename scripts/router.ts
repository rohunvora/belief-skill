#!/usr/bin/env bun
/**
 * Belief Router — Standalone CLI for testing
 * 
 * In production (OpenClaw), Claude IS the router — it reads SKILL.md, decomposes
 * the thesis naturally, then calls research.ts and size.ts as tools.
 * 
 * This file exists for automated test suites (run-tests.ts, run-tweet-tests.ts)
 * and CLI demo mode. It uses an LLM API call to simulate what Claude does natively.
 * 
 * Usage: bun run scripts/router.ts "thesis text" [--portfolio path] [--budget N]
 */

import { parseArgs } from "util";
import { readFileSync, existsSync } from "fs";
import { discoverInstruments } from "./instruments.ts";
import { rankInstruments } from "./rank.ts";
import { sizePositions } from "./size.ts";
import { enrichInstruments } from "./research.ts";
import { decomposeThesis, type DecomposedThesis } from "./decompose.ts";

// ─── Types (exported for other modules) ───
export interface SubTheme {
  theme: string;
  direction: "long" | "short" | "neutral";
  keywords: string[];
}

export interface ParsedThesis {
  raw: string;
  core_claim: string;
  confidence: "high" | "medium" | "low";
  time_horizon: string;
  sub_themes: SubTheme[];
  assumptions: string[];
  invalidation: string[];
}

export interface CandidateInstrument {
  ticker: string;
  name: string;
  asset_class: "stock" | "etf" | "crypto" | "option" | "secondary";
  chain?: string;
  sub_themes: string[];
  source: string;
}

export interface EnrichedInstrument extends CandidateInstrument {
  price: number;
  market_cap?: number;
  pe_ratio?: number;
  volume_24h?: number;
  catalyst?: string;
  risk_note?: string;
}

export interface RankedInstrument extends EnrichedInstrument {
  scores: {
    thesis_alignment: number;
    valuation: number;
    catalyst_proximity: number;
    liquidity: number;
    portfolio_fit: number;
    composite: number;
  };
  rank: number;
}

export interface SizedRecommendation extends RankedInstrument {
  direction: "long" | "short";
  allocation_usd: number;
  allocation_pct: number;
  rationale: string;
  existing_exposure: number;
}

export interface Portfolio {
  positions: Record<string, { usd: number; chain?: string; status: string }>;
  liquid_cash?: number;
}

// ─── Theme-specific invalidation triggers ───
const INVALIDATION_MAP: Record<string, string[]> = {
  defense_ai: [
    "US defense budget cuts override AI spending priorities",
    "China AI progress stalls or pivots to non-military applications",
    "Diplomatic breakthrough reduces US-China tensions significantly",
  ],
  ai_compute: [
    "GPU demand peaks as inference efficiency improves 10x",
    "Major chip glut from overbuilding (TSMC/Samsung capacity surge)",
    "AI model performance plateaus, reducing compute demand",
  ],
  ai_software: [
    "AI regulation severely limits commercial deployment",
    "Open-source models commoditize the AI software layer",
    "Enterprise AI adoption slower than expected (integration friction)",
  ],
  cybersecurity: [
    "Government cyber spending shifts to in-house solutions",
    "Major consolidation reduces number of public cyber plays",
  ],
  energy_ai: [
    "Breakthrough in energy-efficient AI chips reduces power demand",
    "Nuclear regulatory delays push timelines out 5+ years",
    "Renewable costs drop faster than expected, making nuclear uncompetitive",
  ],
  stablecoin: [
    "Stablecoin regulation restricts rather than enables (classified as securities)",
    "GENIUS Act / stablecoin bill fails or gets watered down",
    "CBDC launch makes private stablecoins redundant",
  ],
  solana_ecosystem: [
    "Solana suffers another extended outage during high-volume period",
    "Ethereum L2s achieve <$0.01 transaction costs at scale",
    "Regulatory action specifically targeting Solana validators",
  ],
  ethereum_ecosystem: [
    "Ethereum fails to ship next major upgrade on schedule",
    "L2 fragmentation worsens (liquidity silos kill composability)",
    "Alternative L1s capture majority of new developer activity",
  ],
  defi: [
    "Major DeFi exploit causes regulatory crackdown",
    "TradFi on-chain solutions make DeFi protocols redundant",
  ],
  real_estate: [
    "Interest rates drop sharply, reigniting housing demand",
    "Housing supply remains constrained, preventing meaningful price correction",
    "Government stimulus programs prop up housing market",
  ],
  biotech: [
    "FDA tightens approval standards, delaying pipeline drugs",
    "Unexpected serious side effects in late-stage trials",
    "Generic/biosimilar competition arrives faster than expected",
  ],
  china: [
    "US-China tariff escalation disrupts Chinese company earnings",
    "CCP regulatory crackdown on tech sector resumes",
    "Taiwan tensions escalate, causing capital flight from Chinese assets",
  ],
  interest_rates: [
    "Inflation re-accelerates, forcing Fed to hold or hike",
    "Fed signals hawkish pivot, contradicting rate cut expectations",
    "Employment stays strong, reducing urgency for rate cuts",
  ],
  ev_clean_energy: [
    "EV demand growth slows as early adopters saturate",
    "Battery material costs spike (lithium, cobalt shortages)",
    "Policy reversal on EV subsidies or clean energy tax credits",
  ],
  staffing_labor: [
    "AI adoption slower than expected in enterprise workflows",
    "Regulatory limits on AI replacing human workers",
    "New job categories created by AI offset displaced jobs",
  ],
  gaming_metaverse: [
    "VR/AR hardware adoption stalls (headset fatigue)",
    "Metaverse platforms fail to achieve critical mass of daily users",
  ],
  space_defense: [
    "Launch costs stop declining or increase due to supply chain issues",
    "Major launch failure causes regulatory pause across industry",
  ],
  fintech: [
    "Banking regulators tighten rules on non-bank lenders",
    "Credit losses spike as consumer credit cycle turns",
  ],
  commodities: [
    "Global recession crushes commodity demand",
    "Strong dollar makes commodities expensive for international buyers",
  ],
  quantum_computing: [
    "Quantum error correction proves harder than expected (no fault-tolerance by 2030)",
    "Classical computing advances reduce quantum's advantage window",
  ],
  robotics_automation: [
    "Humanoid robot costs remain too high for mass deployment",
    "Regulatory barriers to autonomous systems in public spaces",
  ],
  healthcare_insurance: [
    "Government price controls on drugs/services compress margins",
    "Medicare/Medicaid expansion threatens managed care economics",
  ],
  food_agriculture: [
    "Favorable weather conditions normalize crop yields globally",
    "Trade agreements reduce tariff barriers, pressuring domestic prices",
  ],
};

function generateInvalidation(themes: string[], thesis: string): string[] {
  const triggers: string[] = [];
  const seen = new Set<string>();
  
  for (const theme of themes) {
    const themeInvs = INVALIDATION_MAP[theme];
    if (themeInvs) {
      // Pick 1-2 most relevant per theme
      for (const inv of themeInvs.slice(0, 2)) {
        if (!seen.has(inv)) {
          seen.add(inv);
          triggers.push(inv);
        }
      }
    }
  }
  
  // Cap at 4 triggers
  if (triggers.length > 4) triggers.splice(4);
  
  // Fallback
  if (triggers.length === 0) {
    triggers.push("Core thesis assumption proves incorrect");
    triggers.push("Market conditions shift fundamentally against this position");
  }
  
  return triggers;
}

// ─── Parse thesis into structured sub-themes ───
function parseThesis(raw: string): ParsedThesis {
  const themeMap = JSON.parse(
    readFileSync(new URL("../references/theme-map.json", import.meta.url), "utf-8")
  );

  const lowerThesis = raw.toLowerCase();
  const matchedThemes: SubTheme[] = [];

  for (const [themeId, theme] of Object.entries(themeMap) as [string, any][]) {
    const matchedKeywords = theme.keywords.filter((kw: string) => {
      const kwLower = kw.toLowerCase();
      // Use word boundary for short keywords (<=3 chars) to avoid false positives
      if (kwLower.length <= 3) {
        const re = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return re.test(lowerThesis);
      }
      return lowerThesis.includes(kwLower);
    });
    if (matchedKeywords.length > 0) {
      matchedThemes.push({
        theme: themeId,
        direction: detectDirection(lowerThesis),
        keywords: matchedKeywords,
      });
    }
  }

  if (matchedThemes.length === 0) {
    matchedThemes.push({ theme: "unknown", direction: detectDirection(lowerThesis), keywords: [] });
  }

  return {
    raw,
    core_claim: raw,
    confidence: detectConfidence(lowerThesis),
    time_horizon: detectHorizon(lowerThesis),
    sub_themes: matchedThemes,
    assumptions: [`Core assumption: ${raw}`],
    invalidation: generateInvalidation(matchedThemes.map(t => t.theme), lowerThesis),
  };
}

function detectDirection(text: string): "long" | "short" | "neutral" {
  const bearish = ["crash", "decline", "fall", "drop", "short", "bear", "replace", "kill", "die", "lose", "fail"];
  const bullish = ["grow", "rise", "boom", "benefit", "win", "gain", "surge", "bull", "increase", "trigger", "massive", "spending"];
  const bearScore = bearish.filter(w => text.includes(w)).length;
  const bullScore = bullish.filter(w => text.includes(w)).length;
  if (bearScore > bullScore) return "short";
  if (bullScore > bearScore) return "long";
  return "long";
}

function detectConfidence(text: string): "high" | "medium" | "low" {
  const lowConf = ["maybe", "might", "feel like", "possibly", "could", "uncertain"];
  const highConf = ["will", "definitely", "massive", "huge", "certain", "inevitable"];
  if (lowConf.some(w => text.includes(w))) return "low";
  if (highConf.some(w => text.includes(w))) return "high";
  return "medium";
}

function detectHorizon(text: string): string {
  if (text.includes("tomorrow") || text.includes("this week")) return "1-7 days";
  if (text.includes("this month") || text.includes("earnings")) return "1-3 months";
  if (text.includes("this year") || text.includes("2026")) return "3-12 months";
  return "6-18 months";
}

// ─── Load portfolio ───
function loadPortfolio(path: string): Portfolio {
  if (!existsSync(path)) {
    console.error(`Portfolio file not found: ${path}`);
    return { positions: {} };
  }
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return {
    positions: raw.portfolio?.positions || raw.positions || {},
    liquid_cash: raw.portfolio?.liquid_cash,
  };
}

// ─── Format output ───
function formatTelegram(thesis: ParsedThesis, recommendations: SizedRecommendation[], portfolio: Portfolio, budget: number): string {
  const stars = (score: number) => "⭐".repeat(Math.max(1, Math.round(score / 20)));
  
  let out = `🧠 THESIS: ${thesis.core_claim}\n`;
  out += `Confidence: ${thesis.confidence.charAt(0).toUpperCase() + thesis.confidence.slice(1)} | Horizon: ${thesis.time_horizon}\n`;
  out += `Themes: ${thesis.sub_themes.map(t => t.theme.replace(/_/g, " ")).join(", ")}\n\n`;

  // Portfolio contradiction warning
  const totalPortfolioValue = Object.values(portfolio.positions).reduce((sum, p) => sum + (p.usd || 0), 0);
  if (totalPortfolioValue > 0) {
    const isBearish = recommendations.some(r => r.direction === "short");
    const thesisText = thesis.raw.toLowerCase();
    
    // Check if thesis is bearish on crypto and portfolio is crypto-heavy
    const cryptoKeywords = ["crypto", "bitcoin", "defi", "solana", "ethereum", "token"];
    const thesisMentionsCrypto = cryptoKeywords.some(k => thesisText.includes(k));
    const thesisIsBearish = ["crash", "drop", "fall", "decline", "collapse", "bear"].some(k => thesisText.includes(k));
    
    if (thesisMentionsCrypto && thesisIsBearish && totalPortfolioValue > 0) {
      const cryptoPct = Math.round((totalPortfolioValue / (totalPortfolioValue + 126000)) * 100); // rough estimate with bank
      out += `⚠️ PORTFOLIO CONTRADICTION\n`;
      out += `Your portfolio is ~${cryptoPct}% crypto ($${(totalPortfolioValue/1000).toFixed(0)}K). This thesis implies massive losses on existing holdings.\n`;
      out += `Consider REDUCING existing positions before adding new short bets.\n`;
      out += `Hedges: puts on COIN, short BITO ETF, or convert to stablecoins.\n\n`;
    }
    
    // Check if thesis is bearish on stocks and portfolio has significant stock exposure
    const stockKeywords = ["stock", "market", "equit", "s&p", "nasdaq"];
    if (stockKeywords.some(k => thesisText.includes(k)) && thesisIsBearish) {
      out += `⚠️ PORTFOLIO CONTRADICTION\n`;
      out += `This bearish thesis may impact your existing holdings. Review exposure before acting.\n\n`;
    }
  }

  for (let i = 0; i < Math.min(recommendations.length, 8); i++) {
    const rec = recommendations[i];
    const dir = rec.direction === "long" ? "Long" : "Short";
    out += `#${i + 1}  ${rec.ticker}  ${dir}  $${rec.allocation_usd.toLocaleString()}  ${stars(rec.scores.composite)}\n`;
    out += `    ${rec.rationale}\n`;
    if (rec.existing_exposure > 0) {
      out += `    ⚠️ Already exposed: $${rec.existing_exposure.toLocaleString()}\n`;
    }
    out += `\n`;
  }

  const totalPortfolio = Object.values(portfolio.positions).reduce((sum, p) => sum + (p.usd || 0), 0);
  out += `📊 PORTFOLIO CONTEXT\n`;
  out += `Budget: $${budget.toLocaleString()} | Portfolio: $${totalPortfolio.toLocaleString()}\n\n`;

  out += `❌ INVALIDATION\n`;
  for (const inv of thesis.invalidation) {
    out += `• ${inv}\n`;
  }

  return out;
}

// ─── History commands ───
function listHistory(): void {
  const historyDir = new URL("../data/history/", import.meta.url).pathname;
  const { readdirSync, readFileSync } = require("fs");
  
  try {
    const files = readdirSync(historyDir).filter((f: string) => f.endsWith(".json")).sort().reverse();
    if (files.length === 0) {
      console.log("No thesis history yet. Run with --save to start tracking.");
      return;
    }
    
    console.log(`\n📜 Thesis History (${files.length} total)\n`);
    for (const f of files) {
      const data = JSON.parse(readFileSync(`${historyDir}${f}`, "utf-8"));
      const date = new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const recs = data.recommendations?.filter((r: any) => r.allocation_usd > 0).length || 0;
      const budget = data.budget ? `$${(data.budget / 1000).toFixed(0)}K` : "?";
      console.log(`  ${data.id}  ${date}  ${budget}  ${recs} picks`);
      console.log(`    "${data.thesis.slice(0, 70)}${data.thesis.length > 70 ? "..." : ""}"`);
      console.log();
    }
  } catch {
    console.log("No thesis history yet.");
  }
}

function replayThesis(id: string): void {
  const historyDir = new URL("../data/history/", import.meta.url).pathname;
  const { readFileSync, existsSync } = require("fs");
  
  // Support partial ID match
  const { readdirSync } = require("fs");
  let filename = `${id}.json`;
  if (!existsSync(`${historyDir}${filename}`)) {
    const files = readdirSync(historyDir).filter((f: string) => f.includes(id));
    if (files.length === 1) filename = files[0];
    else if (files.length === 0) {
      console.error(`No thesis found matching "${id}"`);
      process.exit(1);
    } else {
      console.error(`Multiple matches for "${id}":`);
      files.forEach((f: string) => console.error(`  ${f.replace(".json", "")}`));
      process.exit(1);
    }
  }

  const data = JSON.parse(readFileSync(`${historyDir}${filename}`, "utf-8"));
  const stars = (score: number) => "⭐".repeat(Math.max(1, Math.round(score / 20)));
  
  console.log(`\n🔁 REPLAY: ${data.thesis}`);
  console.log(`Confidence: ${data.confidence} | Horizon: ${data.time_horizon} | Created: ${new Date(data.created_at).toLocaleString()}`);
  console.log(`Themes: ${(data.themes || []).join(", ")}\n`);

  for (let i = 0; i < data.recommendations.length; i++) {
    const r = data.recommendations[i];
    if (r.allocation_usd > 0) {
      console.log(`#${i + 1}  ${r.ticker}  ${r.direction.toUpperCase()}  $${r.allocation_usd.toLocaleString()}  ${stars(r.scores?.composite || 50)}`);
      console.log(`    ${r.rationale}`);
      if (r.price) console.log(`    Price at analysis: $${r.price.toFixed(2)}`);
      console.log();
    }
  }

  // Show secondaries
  const secs = data.recommendations.filter((r: any) => r.asset_class === "secondary");
  for (const s of secs) {
    console.log(`📎  ${s.name || s.ticker} — ${s.rationale}`);
  }

  if (data.invalidation?.length) {
    console.log(`\n❌ INVALIDATION`);
    data.invalidation.forEach((inv: string) => console.log(`• ${inv}`));
  }
}

// ─── Main ───
async function main() {
  const args = Bun.argv.slice(2);
  
  // Handle subcommands
  if (args[0] === "history" || args[0] === "--history") {
    listHistory();
    return;
  }
  if (args[0] === "replay" || args[0] === "--replay") {
    if (!args[1]) { console.error("Usage: replay <thesis-id>"); process.exit(1); }
    replayThesis(args[1]);
    return;
  }

  const { values, positionals } = parseArgs({
    args,
    options: {
      portfolio: { type: "string", default: "" },
      budget: { type: "string", default: "20000" },
      format: { type: "string", default: "telegram" },
      save: { type: "boolean", default: false },
      counter: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const thesisText = positionals.join(" ");
  if (!thesisText) {
    console.error("Usage: bun run scripts/router.ts \"your thesis\" [--portfolio path] [--budget N] [--save]");
    console.error("       bun run scripts/router.ts history");
    console.error("       bun run scripts/router.ts replay <thesis-id>");
    process.exit(1);
  }

  const portfolioPath = values.portfolio || 
    new URL("../../../examples/sample-state.json", import.meta.url).pathname;
  const budget = parseInt(values.budget || "20000");

  console.error(`\n🧠 Belief Router\n`);
  console.error(`Thesis: "${thesisText}"`);
  console.error(`Budget: $${budget.toLocaleString()}\n`);

  // 1. LLM Decomposition (the core — Claude IS the router)
  console.error("1/4 Decomposing thesis (LLM)...");
  const decomposed = await decomposeThesis(thesisText);
  console.error(`   → ${decomposed.instruments.length} instruments, confidence: ${decomposed.confidence}`);
  if (decomposed.reasoning) console.error(`   → ${decomposed.reasoning.slice(0, 120)}`);

  // Also run keyword parsing for invalidation/themes (lightweight supplement)
  const thesis = parseThesis(thesisText);
  // Override with LLM confidence/invalidation if available
  if (decomposed.confidence) thesis.confidence = decomposed.confidence;
  if (decomposed.invalidation?.length) thesis.invalidation = decomposed.invalidation;
  if (decomposed.horizon) thesis.time_horizon = decomposed.horizon;

  // 2. Build candidate list from LLM suggestions + web search discovery
  console.error("2/4 Building candidate list...");
  
  // LLM-suggested tickers (primary — these come from understanding intent)
  const KNOWN_CRYPTO = new Set([
    "BTC", "ETH", "SOL", "HYPE", "TRUMP", "PENGU", "BONK", "WIF", "PYTH", "JUP",
    "RAY", "JTO", "ORCA", "DYDX", "AAVE", "UNI", "MKR", "CRV", "SNX", "RNDR",
    "AKT", "TAO", "ARB", "OP", "MATIC", "LDO", "RPL", "ENS", "FXS", "DEGEN",
    "AERO", "BRETT", "TOSHI", "GALA", "IMX", "AXS", "SAND", "MANA", "VIRTUAL",
    "AI16Z", "FET", "NEAR", "AVAX", "DOT", "LINK", "ATOM",
  ]);
  
  const llmCandidates: CandidateInstrument[] = decomposed.instruments.map(inst => {
    const ticker = inst.ticker.replace(/\$/g, "").toUpperCase();
    // Auto-classify asset class
    let asset_class: "stock" | "etf" | "crypto" | "secondary" = "stock";
    if (inst.asset_class?.includes("crypto") || KNOWN_CRYPTO.has(ticker)) asset_class = "crypto";
    else if (inst.asset_class?.includes("etf") || inst.asset_class?.includes("ETF")) asset_class = "etf";
    else if (inst.asset_class?.includes("secondary") || inst.asset_class?.includes("pre-IPO")) asset_class = "secondary";
    
    return {
      ticker,
      name: ticker,
      asset_class,
      sub_themes: [inst.why?.slice(0, 50) || "llm"],
      source: "llm-decompose",
      _direction: inst.direction,
      _why: inst.why,
    } as CandidateInstrument & { _direction: string; _why: string };
  });
  
  // Also run web search + theme-map discovery (secondary — fills gaps)
  const discoverCandidates = await discoverInstruments(thesis.raw);
  
  // Merge: LLM candidates first, then discover candidates that aren't duplicates
  const seen = new Set(llmCandidates.map(c => c.ticker));
  const allCandidates = [
    ...llmCandidates,
    ...discoverCandidates.filter(c => !seen.has(c.ticker)),
  ];
  console.error(`   → ${llmCandidates.length} from LLM + ${discoverCandidates.filter(c => !seen.has(c.ticker)).length} from search = ${allCandidates.length} total`);

  // 3. Enrich with market data
  console.error("3/4 Enriching with market data...");
  const enriched = await enrichInstruments(allCandidates);
  console.error(`   → ${enriched.length} enriched`);

  // 3.5 Rank — preserve LLM direction flags
  console.error("3.5/4 Ranking...");
  const ranked = await rankInstruments(enriched, thesis.raw);
  // Apply LLM direction hints to ranked instruments
  for (const r of ranked) {
    const llmInst = decomposed.instruments.find(i => 
      i.ticker.replace(/\$/g, "").toUpperCase() === r.ticker.toUpperCase()
    );
    if (llmInst?.direction === "short") {
      (r as any)._direction = "short";
    }
  }
  console.error(`   → Top: ${ranked.slice(0, 3).map(r => r.ticker).join(", ")}`);

  // 4. Size
  console.error("4/4 Sizing positions...");
  const portfolio = loadPortfolio(portfolioPath);
  const sized = sizePositions(ranked, portfolio, budget, thesis.raw);

  // Output
  const output = formatTelegram(thesis, sized, portfolio, budget);
  console.log(output);

  // Counter-thesis: what happens if you're wrong?
  if (values.counter) {
    console.log("\n" + "═".repeat(50));
    console.log("🔄 COUNTER-THESIS: What if you're wrong?\n");
    
    // Invert directions: longs become shorts, shorts become longs
    const counterRecs = sized.filter(r => r.allocation_usd > 0).map(r => {
      const invDir = r.direction === "long" ? "short" : "long";
      const risk = r.direction === "long" 
        ? `If wrong: ${r.ticker} drops → lose $${Math.round(r.allocation_usd * 0.2).toLocaleString()} at -20%`
        : `If wrong: ${r.ticker} rallies → lose $${Math.round(r.allocation_usd * 0.3).toLocaleString()} at +30%`;
      return { ...r, direction: invDir as "long" | "short", risk };
    });

    // Show max loss scenario
    const totalAtRisk = sized.reduce((s, r) => s + r.allocation_usd, 0);
    const maxLoss20 = Math.round(totalAtRisk * 0.2);
    const maxLoss50 = Math.round(totalAtRisk * 0.5);
    
    console.log(`  Max loss (-20%): -$${maxLoss20.toLocaleString()}`);
    console.log(`  Max loss (-50%): -$${maxLoss50.toLocaleString()}`);
    console.log();

    // Show which positions hurt most
    console.log("  Biggest risks if thesis fails:");
    for (const r of counterRecs.slice(0, 4)) {
      console.log(`  • ${(r as any).risk}`);
    }

    // Suggest hedges
    console.log("\n  🛡️ Suggested hedges:");
    const hasStocks = sized.some(r => r.asset_class === "stock" && r.allocation_usd > 0);
    const hasCrypto = sized.some(r => r.asset_class === "crypto" && r.allocation_usd > 0);
    
    if (hasStocks) {
      console.log("  • Buy puts on largest stock position (defined risk)");
      console.log("  • Set stop-losses at -15% on all stock positions");
    }
    if (hasCrypto) {
      console.log("  • Keep USDC reserve equal to 20% of crypto allocation");
      console.log("  • Use DCA entry over 3-5 days instead of lump sum");
    }
    if (sized.some(r => r.direction === "long")) {
      console.log("  • Consider inverse ETF position (5-10% of budget) as tail risk hedge");
    }
  }

  // Save to history for frontend
  if (values.save) {
    const { mkdirSync, writeFileSync } = await import("fs");
    const historyDir = new URL("../data/history/", import.meta.url).pathname;
    mkdirSync(historyDir, { recursive: true });
    
    const id = `thesis-${Date.now()}`;
    const historyEntry = {
      id,
      thesis: thesis.core_claim,
      confidence: thesis.confidence,
      time_horizon: thesis.time_horizon,
      recommendations: sized.map(s => ({
        ticker: s.ticker,
        name: s.name,
        direction: s.direction,
        allocation_usd: s.allocation_usd,
        asset_class: s.asset_class,
        scores: s.scores,
        existing_exposure: s.existing_exposure,
        rationale: s.rationale,
        price: s.price,
      })),
      budget,
      created_at: new Date().toISOString(),
      themes: thesis.sub_themes.map(t => t.theme),
      invalidation: thesis.invalidation,
    };
    
    writeFileSync(`${historyDir}${id}.json`, JSON.stringify(historyEntry, null, 2));
    console.error(`\n💾 Saved to data/history/${id}.json`);
  }
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
