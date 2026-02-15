#!/usr/bin/env bun
/**
 * Belief Router Test Harness
 * 
 * Tests the TOOLS pipeline: discover.ts → research.ts → size.ts
 * Grades: instrument discovery, relevance, multi-asset coverage, sizing sanity.
 * 
 * Usage: bun run tests/test-harness.ts [--filter easy|medium|hard|baseline] [--verbose] [--id scenario-1]
 */

import { discoverInstrumentsLive } from "../scripts/discover";
import { enrichInstruments } from "../scripts/research";
import { sizePositions } from "../scripts/size";
import type { CandidateInstrument, RankedInstrument } from "../scripts/types";

const PORTFOLIO_PATH = new URL("../../../examples/sample-state.json", import.meta.url).pathname;
const TESTS_PATH = new URL("./test-theses.json", import.meta.url).pathname;

interface TestCase {
  id: string;
  difficulty: string;
  thesis: string;
  budget: number | null;
  ideal_instruments: string[];
  ideal_min_match: number;
  bad_instruments: string[];
  must_include_asset_classes: string[];
  must_include_short?: boolean;
  expected_direction: string;
  notes: string;
}

interface TestResult {
  id: string;
  difficulty: string;
  thesis: string;
  passed: boolean;
  score: number; // 0-100
  discovered_tickers: string[];
  matched_ideal: string[];
  matched_bad: string[];
  asset_classes_found: string[];
  has_short: boolean;
  sizing_total: number;
  sizing_count: number;
  failures: string[];
  time_ms: number;
}

// Parse args
const args = process.argv.slice(2);
const filterDifficulty = args.includes("--filter") ? args[args.indexOf("--filter") + 1] : null;
const verbose = args.includes("--verbose") || args.includes("-v");
const filterId = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;

// Load test data
const testData = JSON.parse(await Bun.file(TESTS_PATH).text());
const portfolio = JSON.parse(await Bun.file(PORTFOLIO_PATH).text());

let tests: TestCase[] = testData.tests;
if (filterDifficulty) tests = tests.filter(t => t.difficulty === filterDifficulty);
if (filterId) tests = tests.filter(t => t.id === filterId);

// ── Constraint checks (non-negotiable) ──
const themeMapPath = new URL("../references/theme-map.json", import.meta.url).pathname;
if (await Bun.file(themeMapPath).exists()) {
  console.error(`\n🚨 CONSTRAINT VIOLATION: theme-map.json exists! Delete it.`);
  process.exit(1);
}

console.log(`\n🧪 BELIEF ROUTER TEST HARNESS`);
console.log(`${"═".repeat(60)}`);
console.log(`Tests: ${tests.length} | Filter: ${filterDifficulty || filterId || "all"}`);
console.log(`${"═".repeat(60)}\n`);

const results: TestResult[] = [];

for (const test of tests) {
  const startTime = Date.now();
  const failures: string[] = [];
  
  if (verbose) console.log(`\n▶ [${test.id}] "${test.thesis.slice(0, 60)}..."`);
  
  try {
    // ── Step 1: Discover instruments ──
    const candidates = await discoverInstrumentsLive(test.thesis);
    const discoveredTickers = candidates.map(c => c.ticker.toUpperCase());
    
    if (verbose) console.log(`  📡 Discovered: ${discoveredTickers.slice(0, 15).join(", ")}${discoveredTickers.length > 15 ? ` (+${discoveredTickers.length - 15} more)` : ""}`);
    
    // ── Step 2: Enrich with market data ──
    // Limit to top 15 candidates to stay within API limits
    const topCandidates = candidates.slice(0, 15);
    const enriched = await enrichInstruments(topCandidates);
    
    if (verbose) console.log(`  📊 Enriched: ${enriched.length} instruments`);
    
    // ── Step 3: Create ranked instruments (minimal scoring for tool test) ──
    const ranked: RankedInstrument[] = enriched.map((e, i) => ({
      ...e,
      scores: {
        thesis_alignment: Math.max(90 - i * 5, 20),
        valuation: 50,
        catalyst_proximity: 50,
        liquidity: e.volume_24h && e.volume_24h > 1000000 ? 80 : 50,
        portfolio_fit: 50,
        composite: Math.max(75 - i * 4, 20),
      },
      rank: i + 1,
    }));
    
    // ── Step 4: Size positions ──
    const budget = test.budget || undefined;
    const sized = sizePositions(ranked, portfolio, budget, test.thesis);
    
    if (verbose) {
      for (const s of sized.slice(0, 5)) {
        console.log(`  💰 ${s.ticker.padEnd(8)} ${s.direction.padEnd(6)} $${s.allocation_usd.toLocaleString().padStart(7)} [${s.asset_class}]`);
      }
    }
    
    // ── GRADING ──
    
    // Check ideal instrument matches
    const matchedIdeal = test.ideal_instruments.filter(ideal =>
      discoveredTickers.some(d => d === ideal.toUpperCase()) ||
      sized.some(s => s.ticker.toUpperCase() === ideal.toUpperCase())
    );
    
    // Check bad instrument matches
    const matchedBad = test.bad_instruments.filter(bad =>
      sized.some(s => s.ticker.toUpperCase() === bad.toUpperCase() && s.allocation_usd > 0)
    );
    
    // Check asset class coverage
    const assetClassesFound = [...new Set(sized.map(s => s.asset_class))];
    
    // Check short positions
    const hasShort = sized.some(s => s.direction === "short");
    
    // Scoring
    let score = 0;
    
    // Ideal instrument discovery (40 points)
    const idealScore = Math.min(matchedIdeal.length / test.ideal_min_match, 1) * 40;
    score += idealScore;
    if (matchedIdeal.length < test.ideal_min_match) {
      failures.push(`Found ${matchedIdeal.length}/${test.ideal_min_match} ideal instruments (need: ${test.ideal_instruments.slice(0, 5).join(", ")})`);
    }
    
    // No bad instruments (20 points — all or nothing)
    if (matchedBad.length === 0) {
      score += 20;
    } else {
      failures.push(`Recommended BAD instruments: ${matchedBad.join(", ")}`);
    }
    
    // Multi-asset coverage (20 points)
    const requiredClasses = test.must_include_asset_classes;
    const classesHit = requiredClasses.filter(rc => assetClassesFound.includes(rc));
    const classScore = (classesHit.length / requiredClasses.length) * 20;
    score += classScore;
    if (classesHit.length < requiredClasses.length) {
      const missing = requiredClasses.filter(rc => !assetClassesFound.includes(rc));
      failures.push(`Missing asset classes: ${missing.join(", ")}`);
    }
    
    // Short position check (10 points if required, else free)
    if (test.must_include_short) {
      if (hasShort) {
        score += 10;
      } else {
        failures.push("No short positions found (thesis requires shorts)");
      }
    } else {
      score += 10; // Free points when shorts not required
    }
    
    // Sizing sanity (10 points)
    const totalAllocated = sized.reduce((s, r) => s + r.allocation_usd, 0);
    const effectiveBudget = test.budget || 20000;
    if (totalAllocated > 0 && totalAllocated <= effectiveBudget * 1.05) {
      score += 10;
    } else if (totalAllocated === 0) {
      failures.push("Zero total allocation");
    } else if (totalAllocated > effectiveBudget * 1.05) {
      failures.push(`Over-allocated: $${totalAllocated.toLocaleString()} > $${effectiveBudget.toLocaleString()} budget`);
    }
    
    const timeMs = Date.now() - startTime;
    const passed = score >= 70 && failures.length <= 1;
    
    results.push({
      id: test.id,
      difficulty: test.difficulty,
      thesis: test.thesis,
      passed,
      score: Math.round(score),
      discovered_tickers: discoveredTickers,
      matched_ideal: matchedIdeal,
      matched_bad: matchedBad,
      asset_classes_found: assetClassesFound,
      has_short: hasShort,
      sizing_total: totalAllocated,
      sizing_count: sized.length,
      failures,
      time_ms: timeMs,
    });
    
    const icon = passed ? "✅" : "❌";
    const scoreStr = `${Math.round(score)}/100`;
    console.log(`${icon} [${test.id}] ${scoreStr} | ${matchedIdeal.length}/${test.ideal_min_match} ideal | ${test.thesis.slice(0, 50)}...`);
    if (failures.length > 0 && (verbose || !passed)) {
      for (const f of failures) console.log(`   ⚠️  ${f}`);
    }
    
  } catch (err) {
    const timeMs = Date.now() - startTime;
    console.log(`💥 [${test.id}] CRASHED: ${(err as Error).message}`);
    results.push({
      id: test.id,
      difficulty: test.difficulty,
      thesis: test.thesis,
      passed: false,
      score: 0,
      discovered_tickers: [],
      matched_ideal: [],
      matched_bad: [],
      asset_classes_found: [],
      has_short: false,
      sizing_total: 0,
      sizing_count: 0,
      failures: [`CRASH: ${(err as Error).message}`],
      time_ms: timeMs,
    });
  }
  
  // Rate limit pause between tests (Brave Search: 1 req/sec, discover.ts makes 3 queries)
  await new Promise(r => setTimeout(r, 500));
}

// ── SCORECARD ──
console.log(`\n${"═".repeat(60)}`);
console.log(`SCORECARD`);
console.log(`${"═".repeat(60)}`);

const totalPassed = results.filter(r => r.passed).length;
const totalFailed = results.filter(r => !r.passed).length;
const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
const totalTime = results.reduce((s, r) => s + r.time_ms, 0);

// By difficulty
const difficulties = [...new Set(results.map(r => r.difficulty))];
for (const diff of difficulties) {
  const tier = results.filter(r => r.difficulty === diff);
  const tierPassed = tier.filter(r => r.passed).length;
  const tierAvg = Math.round(tier.reduce((s, r) => s + r.score, 0) / tier.length);
  console.log(`  ${diff.padEnd(10)} ${tierPassed}/${tier.length} passing | avg score: ${tierAvg}/100`);
}

console.log(`${"─".repeat(60)}`);
console.log(`  TOTAL     ${totalPassed}/${totalPassed + totalFailed} passing | avg score: ${avgScore}/100`);
console.log(`  TIME      ${(totalTime / 1000).toFixed(1)}s total | ${(totalTime / results.length / 1000).toFixed(1)}s avg per test`);
console.log(`${"═".repeat(60)}`);

// Worst failures
const failedTests = results.filter(r => !r.passed).sort((a, b) => a.score - b.score);
if (failedTests.length > 0) {
  console.log(`\n❌ FAILURES (fix these first):`);
  for (const f of failedTests.slice(0, 10)) {
    console.log(`  [${f.id}] score ${f.score} — ${f.thesis.slice(0, 50)}...`);
    for (const fail of f.failures) console.log(`    → ${fail}`);
  }
}

// Emit machine-readable summary
const summary = {
  timestamp: new Date().toISOString(),
  total: results.length,
  passed: totalPassed,
  failed: totalFailed,
  avg_score: avgScore,
  by_difficulty: Object.fromEntries(difficulties.map(d => {
    const tier = results.filter(r => r.difficulty === d);
    return [d, { passed: tier.filter(r => r.passed).length, total: tier.length, avg: Math.round(tier.reduce((s, r) => s + r.score, 0) / tier.length) }];
  })),
  time_seconds: Math.round(totalTime / 1000),
};

await Bun.write(
  new URL("./last-run.json", import.meta.url).pathname,
  JSON.stringify(summary, null, 2)
);

if (verbose) console.log(`\n📄 Results saved to tests/last-run.json`);

process.exit(totalFailed > 0 ? 1 : 0);
