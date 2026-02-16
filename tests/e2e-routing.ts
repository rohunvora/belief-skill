#!/usr/bin/env bun
/**
 * End-to-End Routing Test
 *
 * Takes a thesis from v3-test-theses.json (or a custom one), runs it through
 * the full adapter pipeline, and produces a routing report with:
 *   - Instrument discovery across all relevant adapters
 *   - Return calculations for top candidates
 *   - Cross-platform comparison using the ranking metric
 *   - Gap identification (missing data, failed lookups, etc.)
 *
 * Usage:
 *   bun run tests/e2e-routing.ts v3-1          # Run test thesis by ID
 *   bun run tests/e2e-routing.ts "fed holds"   # Run custom thesis text
 *   bun run tests/e2e-routing.ts --all          # Run all v3 test theses
 *
 * Output: JSON routing report to stdout, human-readable summary to stderr
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const SCRIPTS = `${ROOT}/scripts/adapters`;

// ─── Concept → Ticker Hints ───
// In production, Claude provides these tickers via reasoning. For automated tests,
// we use this map to simulate the "Phase 3: propose tickers" step.
const CONCEPT_TICKERS: Record<string, string[]> = {
  // Companies
  "nvidia": ["NVDA"], "google": ["GOOG", "GOOGL"], "apple": ["AAPL"], "amazon": ["AMZN"],
  "microsoft": ["MSFT"], "meta": ["META"], "tesla": ["TSLA"],
  // Sectors/themes
  "ozempic": ["NVO", "LLY", "DASH", "MDLZ", "PEP", "CAKE", "HIMS"],
  "weight": ["NVO", "LLY", "WW"],
  "defense": ["DFEN", "ITA", "BAH", "PLTR", "LMT", "RTX", "NOC"],  // DFEN first (3x leveraged)
  "oil": ["USO", "XLE", "OXY", "CVX"], "gold": ["GLD", "NEM", "GOLD"],
  // Macro instruments
  "fed": ["TLT", "TBT", "SHY", "IEF"], "rates": ["TLT", "TBT"],
  "recession": ["TLT", "SH", "SQQQ", "VXX"], "tariff": ["FXI", "MCHI", "EEM", "KWEB"],
  "inflation": ["TIP", "VTIP", "CPI"],
  // Crypto (on Robinhood)
  "bitcoin": ["IBIT", "BITO", "MARA", "RIOT"], "ethereum": ["ETHA"],
  "solana": ["SOL"],
};

function suggestTickers(keywords: string[]): string[] {
  const tickers = new Set<string>();
  for (const kw of keywords) {
    const match = CONCEPT_TICKERS[kw.toLowerCase()];
    if (match) match.forEach(t => tickers.add(t));
  }
  return [...tickers].slice(0, 8);
}

// ─── Thesis Shape → Adapter Routing ───

interface ThesisRoute {
  shape: string;
  adapters: AdapterCall[];
}

interface AdapterCall {
  adapter: string;           // "kalshi" | "robinhood" | "hyperliquid" | "angel"
  instrumentKeywords: string[];
  returnsArgs?: string[];    // If we know specific instruments to price
  priority: "primary" | "secondary";
}

interface RoutingResult {
  thesis: string;
  shape: string;
  adapters_called: number;
  instruments_found: number;
  returns_calculated: number;
  candidates: CandidateResult[];
  gaps: string[];
  duration_ms: number;
}

interface CandidateResult {
  platform: string;
  instrument: string;
  instrument_name?: string;
  direction: string;
  return_if_right_pct?: number;
  return_if_wrong_pct?: number;
  market_implied_prob?: number;
  liquidity?: string;
  time_horizon?: string;
  thesis_beta_est: number;    // Estimated by shape
  convexity_est: number;      // From returns data
  time_cost_est: number;      // Annualized carry
  score: number;              // thesis_beta * convexity / (1 + time_cost)
}

// Shape → which adapters to call and with what keywords
function routeThesis(input: string, shape: string): ThesisRoute {
  const words = input.toLowerCase().split(/\s+/);

  // Extract meaningful keywords (skip common words)
  const stopwords = new Set(["the", "a", "an", "is", "are", "will", "be", "to", "of", "in", "on",
    "at", "for", "and", "or", "but", "not", "this", "that", "with", "as", "by", "from",
    "it", "its", "i", "my", "think", "going", "about", "would", "could", "should",
    "very", "just", "really", "even", "still", "also", "more", "most", "than", "all"]);
  const keywords = words.filter(w => w.length > 2 && !stopwords.has(w));

  const adapters: AdapterCall[] = [];

  switch (shape) {
    case "binary_event":
      adapters.push({
        adapter: "kalshi",
        instrumentKeywords: keywords,
        priority: "primary",
      });
      // Cross-check: Robinhood with macro ETFs
      {
        const rhTickers = suggestTickers(keywords);
        if (rhTickers.length === 0) rhTickers.push(...["TLT", "TBT", "SHY", "IEF"]);
        adapters.push({
          adapter: "robinhood",
          instrumentKeywords: rhTickers,
          priority: "secondary",
        });
      }
      break;

    case "mispriced_company":
      {
        // Robinhood needs actual tickers, not thesis keywords
        const rhTickers = suggestTickers(keywords);
        adapters.push({
          adapter: "robinhood",
          instrumentKeywords: rhTickers.length > 0 ? rhTickers : keywords,
          priority: "primary",
        });
      }
      adapters.push({
        adapter: "hyperliquid",
        instrumentKeywords: keywords,
        priority: "secondary",
      });
      break;

    case "sector_theme":
      {
        const rhTickers = suggestTickers(keywords);
        adapters.push({
          adapter: "robinhood",
          instrumentKeywords: rhTickers.length > 0 ? rhTickers : keywords,
          priority: "primary",
        });
      }
      adapters.push({
        adapter: "kalshi",
        instrumentKeywords: keywords,
        priority: "secondary",
      });
      adapters.push({
        adapter: "angel",
        instrumentKeywords: keywords,
        priority: "secondary",
      });
      break;

    case "relative_value":
      adapters.push({
        adapter: "hyperliquid",
        instrumentKeywords: keywords,
        priority: "primary",
      });
      {
        const rhTickers = suggestTickers(keywords);
        adapters.push({
          adapter: "robinhood",
          instrumentKeywords: rhTickers.length > 0 ? rhTickers : keywords,
          priority: "secondary",
        });
      }
      break;

    case "vulnerability":
      {
        const rhTickers = suggestTickers(keywords);
        adapters.push({
          adapter: "robinhood",
          instrumentKeywords: rhTickers.length > 0 ? rhTickers : keywords,
          priority: "primary",
        });
      }
      adapters.push({
        adapter: "hyperliquid",
        instrumentKeywords: keywords,
        priority: "secondary",
      });
      adapters.push({
        adapter: "kalshi",
        instrumentKeywords: keywords,
        priority: "secondary",
      });
      break;

    case "compound":
      // Compound = multiple shapes. Hit all adapters.
      {
        const rhTickers = suggestTickers(keywords);
        adapters.push({ adapter: "kalshi", instrumentKeywords: keywords, priority: "primary" });
        adapters.push({ adapter: "robinhood", instrumentKeywords: rhTickers.length > 0 ? rhTickers : keywords, priority: "primary" });
        adapters.push({ adapter: "hyperliquid", instrumentKeywords: keywords, priority: "primary" });
        adapters.push({ adapter: "angel", instrumentKeywords: keywords, priority: "secondary" });
      }
      break;

    default:
      // Unknown shape — try everything
      adapters.push({ adapter: "kalshi", instrumentKeywords: keywords, priority: "primary" });
      adapters.push({ adapter: "robinhood", instrumentKeywords: keywords, priority: "primary" });
      adapters.push({ adapter: "hyperliquid", instrumentKeywords: keywords, priority: "primary" });
      break;
  }

  return { shape, adapters };
}

// ─── Adapter Execution ───

function runAdapter(adapter: string, type: "instruments" | "returns", args: string[]): any {
  const cmd = `bun run ${SCRIPTS}/${adapter}/${type}.ts ${args.map(a => `"${a}"`).join(" ")}`;
  try {
    const raw = execSync(cmd, {
      cwd: ROOT,
      timeout: 30_000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err: any) {
    if (err.stdout) {
      const m = err.stdout.toString().match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    }
    return { __error: err.message?.slice(0, 200) || "unknown error" };
  }
}

// ─── Score Calculation ───

function estimateThesisBeta(shape: string, relevance: string, platform: string): number {
  // Binary event on prediction market = ~1.0
  if (platform === "kalshi" && shape === "binary_event") return 0.95;
  if (platform === "kalshi") return 0.7;

  // Relative value on perps = ~0.9
  if (platform === "hyperliquid" && shape === "relative_value") return 0.9;
  if (platform === "hyperliquid") return 0.6;

  // Stock/ETF
  if (shape === "mispriced_company") return 0.8;
  if (shape === "sector_theme") return 0.4;
  if (shape === "vulnerability") return 0.7;

  return 0.5;
}

function estimateTimeCost(platform: string, instrumentType: string): number {
  // Annualized time cost
  if (platform === "kalshi") return 0;  // Binary, no carry
  if (platform === "hyperliquid") return 0.15;  // ~15% funding/yr avg
  if (instrumentType === "option") return 0.4;  // Theta decay
  if (instrumentType === "etf" || instrumentType === "stock") return 0;
  return 0.05;
}

// ─── Main Test Runner ───

async function runThesisTest(thesis: { id: string; input: string; shape: string; expected?: any }): Promise<RoutingResult> {
  const start = Date.now();
  const route = routeThesis(thesis.input, thesis.shape);
  const candidates: CandidateResult[] = [];
  const gaps: string[] = [];
  let instrumentsFound = 0;
  let returnsCalculated = 0;

  console.error(`\n${"═".repeat(60)}`);
  console.error(`  ${thesis.id}: "${thesis.input}"`);
  console.error(`  Shape: ${thesis.shape} → ${route.adapters.length} adapters`);
  console.error(`${"═".repeat(60)}`);

  for (const call of route.adapters) {
    console.error(`\n  📡 ${call.adapter} (${call.priority}) — keywords: ${call.instrumentKeywords.slice(0, 5).join(", ")}`);

    // Step 1: Instrument discovery
    const instruments = runAdapter(call.adapter, "instruments", [call.instrumentKeywords.join(" ")]);

    if (!instruments || instruments.__error) {
      const err = instruments?.__error?.slice(0, 100) || "no response";
      gaps.push(`${call.adapter}/instruments failed: ${err}`);
      console.error(`     ❌ Instruments failed: ${err}`);
      continue;
    }

    // Count instruments based on adapter response format
    const instList = instruments.instruments || instruments.validated_instruments || [];
    const count = instList.length;
    instrumentsFound += count;
    console.error(`     ✅ ${count} instruments found`);

    if (count === 0) {
      gaps.push(`${call.adapter}: 0 instruments for "${call.instrumentKeywords.slice(0, 3).join(" ")}"`);
      continue;
    }

    // Step 2: Get returns for top instruments
    // Sector/compound themes need more coverage (many relevant tickers); others 4 primary, 2 secondary
    const basePrimary = (thesis.shape === "sector_theme" || thesis.shape === "compound") ? 6 : 4;
    const pricingLimit = call.priority === "primary" ? basePrimary : 2;
    const topInstruments = instList
      .filter((i: any) => i.relevance === "direct" || i.relevance === "proxy" || i.mark_price)
      .slice(0, pricingLimit);

    for (const inst of topInstruments) {
      let returnsResult: any = null;
      const ticker = inst.ticker || inst.name;

      try {
        if (call.adapter === "kalshi") {
          // Kalshi returns: event_ticker + optional_strike + direction
          const direction = thesis.input.toLowerCase().includes("won't") || thesis.input.toLowerCase().includes("no ") ? "no" : "yes";
          returnsResult = runAdapter("kalshi", "returns", [ticker, "", direction]);
        } else if (call.adapter === "robinhood") {
          // Robinhood returns: ticker + direction + type
          const dir = thesis.input.toLowerCase().match(/crash|decline|replace|crush|vulnerability|short|bear/) ? "short" : "long";
          const type = ticker.length <= 5 ? "stock" : "etf";
          returnsResult = runAdapter("robinhood", "returns", [ticker, dir, type]);

          // For these shapes, ALSO price options (much higher convexity per SKILL.md thesis beta floor)
          if (["vulnerability", "mispriced_company", "sector_theme", "compound"].includes(thesis.shape) && type === "stock") {
            const optResult = runAdapter("robinhood", "returns", [ticker, dir, "option"]);
            if (optResult && !optResult.__error && optResult.expression) {
              returnsCalculated++;
              const oExpr = optResult.expression;
              const oBeta = estimateThesisBeta(thesis.shape, inst.relevance || "proxy", "robinhood");
              const oConv = oExpr.return_if_right_pct ? Math.max(oExpr.return_if_right_pct / 100, 0.1) : 1;
              const oTC = estimateTimeCost("robinhood", "option");
              const oScore = (oBeta * oConv) / (1 + oTC);

              candidates.push({
                platform: "robinhood",
                instrument: `${ticker} ${dir === "short" ? "PUT" : "CALL"}`,
                instrument_name: oExpr.instrument_name,
                direction: oExpr.direction,
                return_if_right_pct: oExpr.return_if_right_pct,
                return_if_wrong_pct: oExpr.return_if_wrong_pct,
                market_implied_prob: oExpr.market_implied_prob,
                liquidity: oExpr.liquidity,
                time_horizon: oExpr.time_horizon,
                thesis_beta_est: oBeta,
                convexity_est: Math.round(oConv * 100) / 100,
                time_cost_est: oTC,
                score: Math.round(oScore * 100) / 100,
              });

              console.error(`     💰 ${ticker} ${dir === "short" ? "PUT" : "CALL"}: ${oExpr.direction} → ${oExpr.return_if_right_pct}% if right, score=${Math.round(oScore * 100) / 100}`);
            }
          }
        } else if (call.adapter === "hyperliquid") {
          // Hyperliquid returns: coin + direction + leverage
          const dir = thesis.input.toLowerCase().match(/crash|decline|short|bear/) ? "short" : "long";
          returnsResult = runAdapter("hyperliquid", "returns", [ticker.replace("-PERP", ""), dir, "3"]);
        }
      } catch (e) {
        // Skip failed returns
      }

      if (returnsResult && !returnsResult.__error && returnsResult.expression) {
        returnsCalculated++;
        const expr = returnsResult.expression;
        const beta = estimateThesisBeta(thesis.shape, inst.relevance || "proxy", call.adapter);
        const convexity = expr.return_if_right_pct ? Math.max(expr.return_if_right_pct / 100, 0.1) : 1;
        const timeCost = estimateTimeCost(call.adapter, expr.execution_details?.type || "stock");
        const score = (beta * convexity) / (1 + timeCost);

        candidates.push({
          platform: call.adapter,
          instrument: expr.instrument || ticker,
          instrument_name: expr.instrument_name,
          direction: expr.direction,
          return_if_right_pct: expr.return_if_right_pct,
          return_if_wrong_pct: expr.return_if_wrong_pct,
          market_implied_prob: expr.market_implied_prob,
          liquidity: expr.liquidity,
          time_horizon: expr.time_horizon,
          thesis_beta_est: beta,
          convexity_est: Math.round(convexity * 100) / 100,
          time_cost_est: timeCost,
          score: Math.round(score * 100) / 100,
        });

        console.error(`     💰 ${ticker}: ${expr.direction} → ${expr.return_if_right_pct}% if right, score=${Math.round(score * 100) / 100}`);
      } else if (returnsResult?.__error) {
        gaps.push(`${call.adapter}/returns(${ticker}) failed: ${returnsResult.__error.slice(0, 80)}`);
        console.error(`     ⚠️  Returns failed for ${ticker}`);
      }
    }

    // Small delay between adapters to be nice to APIs
    await new Promise(r => setTimeout(r, 200));
  }

  // Sort candidates by score
  candidates.sort((a, b) => b.score - a.score);

  // Check expected results
  if (thesis.expected) {
    const exp = thesis.expected;
    if (exp.should_find) {
      for (const shouldFind of exp.should_find) {
        const found = candidates.some(c => c.instrument.includes(shouldFind));
        if (!found) {
          gaps.push(`EXPECTED but missing: ${shouldFind}`);
        }
      }
    }
    if (exp.primary_platform) {
      const topPlatform = candidates[0]?.platform;
      if (topPlatform && topPlatform !== exp.primary_platform) {
        gaps.push(`Expected top platform=${exp.primary_platform}, got ${topPlatform}`);
      }
    }
  }

  const result: RoutingResult = {
    thesis: thesis.input,
    shape: thesis.shape,
    adapters_called: route.adapters.length,
    instruments_found: instrumentsFound,
    returns_calculated: returnsCalculated,
    candidates,
    gaps,
    duration_ms: Date.now() - start,
  };

  // Print summary
  console.error(`\n  📊 Summary: ${instrumentsFound} instruments → ${returnsCalculated} priced → ${candidates.length} candidates`);
  if (candidates.length > 0) {
    const top = candidates[0];
    console.error(`  🏆 Top: ${top.platform}/${top.instrument} ${top.direction} (score=${top.score}, β=${top.thesis_beta_est}, conv=${top.convexity_est}x)`);
  }
  if (gaps.length > 0) {
    console.error(`  ⚠️  ${gaps.length} gaps: ${gaps.join("; ")}`);
  }
  console.error(`  ⏱  ${result.duration_ms}ms\n`);

  return result;
}

// ─── CLI Entry ───

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: bun run tests/e2e-routing.ts <thesis-id | thesis-text | --all>");
    process.exit(1);
  }

  // Load test theses
  const thesesPath = resolve(__dirname, "v3-test-theses.json");
  let theses: any[];
  try {
    theses = JSON.parse(readFileSync(thesesPath, "utf-8"));
  } catch {
    theses = [];
  }

  const results: RoutingResult[] = [];

  if (arg === "--all") {
    console.error(`\n🧪 Running all ${theses.length} test theses...\n`);
    for (const t of theses) {
      const r = await runThesisTest(t);
      results.push(r);
    }
  } else if (arg.startsWith("v3-")) {
    const thesis = theses.find(t => t.id === arg);
    if (!thesis) {
      console.error(`Thesis ${arg} not found. Available: ${theses.map((t: any) => t.id).join(", ")}`);
      process.exit(1);
    }
    const r = await runThesisTest(thesis);
    results.push(r);
  } else {
    // Custom thesis text — infer shape
    const r = await runThesisTest({
      id: "custom",
      input: arg,
      shape: inferShape(arg),
    });
    results.push(r);
  }

  // Summary table
  if (results.length > 1) {
    console.error(`\n${"═".repeat(60)}`);
    console.error("  ROUTING TEST SUMMARY");
    console.error(`${"═".repeat(60)}`);
    let totalGaps = 0;
    for (const r of results) {
      const topScore = r.candidates[0]?.score || 0;
      const topInst = r.candidates[0]?.instrument || "none";
      const status = r.gaps.length === 0 ? "✅" : `⚠️ ${r.gaps.length} gaps`;
      console.error(`  ${status} ${r.thesis.slice(0, 50).padEnd(50)} → ${topInst} (${topScore})`);
      totalGaps += r.gaps.length;
    }
    console.error(`\n  ${results.length} theses routed, ${totalGaps} total gaps\n`);
  }

  // Output full JSON
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
}

function inferShape(input: string): string {
  const lower = input.toLowerCase();
  if (lower.match(/won't|will not|hold|pause|cut|hike|recession|binary/)) return "binary_event";
  if (lower.match(/undervalued|overvalued|mispriced|going to \$\d/)) return "mispriced_company";
  if (lower.match(/everyone|wave|trend|boom|sector|theme/)) return "sector_theme";
  if (lower.match(/flip|outperform|ratio|relative|vs\b|versus/)) return "relative_value";
  if (lower.match(/replace|kill|crash|casualty|decline|short/)) return "vulnerability";
  if (lower.match(/but|while|and.*hedge|compound/)) return "compound";
  return "sector_theme"; // Default
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
