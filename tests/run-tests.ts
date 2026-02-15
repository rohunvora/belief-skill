#!/usr/bin/env bun
/**
 * Test runner — validates pipeline output against scenario expectations
 */

import { discoverInstruments } from "../scripts/instruments";
import { enrichInstruments } from "../scripts/research";
import { rankInstruments } from "../scripts/rank";
import { sizePositions } from "../scripts/size";

const PORTFOLIO_PATH = new URL("../../../examples/sample-state.json", import.meta.url).pathname;
const scenarios = JSON.parse(await Bun.file(new URL("./scenarios.json", import.meta.url).pathname).text());
const portfolio = JSON.parse(await Bun.file(PORTFOLIO_PATH).text());

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
  const errors: string[] = [];
  
  try {
    const candidates = await discoverInstruments(scenario.thesis);
    const enriched = await enrichInstruments(candidates);
    const ranked = rankInstruments(enriched, scenario.thesis);
    const sized = sizePositions(ranked, portfolio, scenario.budget);
    const checks = scenario.checks;

    // Check minimum instruments
    if (checks.min_instruments && sized.length < checks.min_instruments) {
      errors.push(`Expected ≥${checks.min_instruments} instruments, got ${sized.length}`);
    }

    // Check required tickers
    if (checks.must_include_tickers) {
      const tickers = sized.map(s => s.ticker.toUpperCase());
      for (const req of checks.must_include_tickers) {
        if (!tickers.includes(req)) errors.push(`Missing required ticker: ${req}`);
      }
    }

    // Check required asset classes
    if (checks.must_include_asset_classes) {
      const classes = new Set(sized.map(s => s.asset_class));
      for (const req of checks.must_include_asset_classes) {
        if (!classes.has(req)) errors.push(`Missing asset class: ${req}`);
      }
    }

    // Check secondary inclusion
    if (checks.must_include_secondary) {
      if (!sized.some(s => s.asset_class === "secondary")) {
        errors.push("Missing secondary instrument");
      }
    }

    // Check BAH in top 3
    if (checks.bah_in_top_3) {
      const top3 = sized.slice(0, 3).map(s => s.ticker.toUpperCase());
      if (!top3.includes("BAH")) errors.push(`BAH not in top 3 (got: ${top3.join(", ")})`);
    }

  } catch (e) {
    errors.push(`Pipeline error: ${(e as Error).message}`);
  }

  if (errors.length === 0) {
    console.log(`✅ Scenario ${scenario.id}: ${scenario.name}`);
    passed++;
  } else {
    console.log(`❌ Scenario ${scenario.id}: ${scenario.name}`);
    errors.forEach(e => console.log(`   ${e}`));
    failed++;
  }
}

console.log(`\n${passed}/${passed + failed} scenarios passing`);
process.exit(failed > 0 ? 1 : 0);
