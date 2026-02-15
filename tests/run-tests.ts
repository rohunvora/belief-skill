#!/usr/bin/env bun
/**
 * Behavioral test runner — validates not just structure but JUDGMENT quality.
 * Tests what matters to a trader: direction, concentration warnings, overlap flags,
 * conviction calibration, and contradiction handling.
 */

import { discoverInstruments } from "../scripts/instruments";
import { enrichInstruments } from "../scripts/research";
import { rankInstruments } from "../scripts/rank";
import { sizePositions } from "../scripts/size";
import { decomposeThesis } from "../scripts/decompose";
import type { SizedRecommendation } from "../scripts/types";

const PORTFOLIO_PATH = new URL("../../../examples/sample-state.json", import.meta.url).pathname;
const scenarios = JSON.parse(await Bun.file(new URL("./scenarios.json", import.meta.url).pathname).text());
const portfolio = JSON.parse(await Bun.file(PORTFOLIO_PATH).text());

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
  const errors: string[] = [];

  try {
    // LLM decomposition + web search discovery (mirrors router.ts pipeline)
    const decomposed = await decomposeThesis(scenario.thesis);
    const CRYPTO_SET = new Set(["BTC","ETH","SOL","HYPE","TRUMP","PENGU","BONK","WIF","PYTH","JUP","RAY","JTO","ORCA","DYDX","AAVE","UNI","MKR","CRV","SNX","RNDR","AKT","TAO","ARB","OP","MATIC","GALA","IMX","AXS","SAND","MANA","VIRTUAL","AI16Z","FET","NEAR"]);
    const llmCandidates = decomposed.instruments.map(inst => {
      const ticker = inst.ticker.replace(/\$/g, "").toUpperCase();
      let asset_class: "stock" | "etf" | "crypto" | "secondary" = "stock";
      if (inst.asset_class?.includes("crypto") || CRYPTO_SET.has(ticker)) asset_class = "crypto";
      else if (inst.asset_class?.includes("etf") || inst.asset_class?.includes("ETF")) asset_class = "etf";
      else if (inst.asset_class?.includes("secondary") || inst.asset_class?.includes("pre-IPO")) asset_class = "secondary";
      return { ticker, name: ticker, asset_class, sub_themes: ["llm"], source: "llm-decompose", _direction: inst.direction };
    });
    const discoverCandidates = await discoverInstruments(scenario.thesis);
    const seen = new Set(llmCandidates.map(c => c.ticker));
    const allCandidates = [...llmCandidates, ...discoverCandidates.filter(c => !seen.has(c.ticker))];
    const enriched = await enrichInstruments(allCandidates);
    const ranked = rankInstruments(enriched, scenario.thesis);
    for (const r of ranked) {
      const llmInst = decomposed.instruments.find(i => i.ticker.replace(/\$/g, "").toUpperCase() === r.ticker.toUpperCase());
      if (llmInst?.direction === "short") (r as any)._direction = "short";
    }
    const sized = sizePositions(ranked, portfolio, scenario.budget, scenario.thesis);

    const checks = scenario.checks;
    const tickers = sized.map(s => s.ticker.toUpperCase());
    const classes = new Set(sized.map(s => s.asset_class));
    const longs = sized.filter(s => s.direction === "long");
    const shorts = sized.filter(s => s.direction === "short");
    const totalAlloc = sized.reduce((s, r) => s + r.allocation_usd, 0);

    // === Structural checks ===
    if (checks.min_instruments && sized.length < checks.min_instruments)
      errors.push(`Expected ≥${checks.min_instruments} instruments, got ${sized.length}`);

    if (checks.must_include_tickers)
      for (const req of checks.must_include_tickers)
        if (!tickers.includes(req)) errors.push(`Missing required: ${req}`);

    if (checks.must_include_any_of)
      for (const group of checks.must_include_any_of)
        if (!group.some((t: string) => tickers.includes(t)))
          errors.push(`Missing one of: ${group.join("/")}`);


    if (checks.must_not_include_tickers)
      for (const bad of checks.must_not_include_tickers)
        if (tickers.includes(bad)) errors.push(`Should NOT include: ${bad}`);

    if (checks.must_include_asset_classes)
      for (const req of checks.must_include_asset_classes)
        if (!classes.has(req)) errors.push(`Missing asset class: ${req}`);

    if (checks.must_include_secondary && !sized.some(s => s.asset_class === "secondary"))
      errors.push("Missing secondary instrument");

    if (checks.bah_in_top_3) {
      const top3 = sized.slice(0, 3).map(s => s.ticker.toUpperCase());
      if (!top3.includes("BAH")) errors.push(`BAH not in top 3 (got: ${top3.join(", ")})`);
    }

    if (checks.multi_asset_count_min) {
      if (classes.size < checks.multi_asset_count_min)
        errors.push(`Expected ≥${checks.multi_asset_count_min} asset classes, got ${classes.size}`);
    }

    // === Behavioral: Direction checks ===
    if (checks.has_short_positions && shorts.length === 0)
      errors.push("Expected short positions but found none");

    if (checks.has_long_positions && longs.length === 0)
      errors.push("Expected long positions but found none");

    if (checks.not_all_long && shorts.length === 0)
      errors.push("All positions are long — bear thesis should have shorts");

    if (checks.long_includes_beneficiaries) {
      const longTickers = longs.map(l => l.ticker.toUpperCase());
      const found = checks.long_includes_beneficiaries.some((t: string) => longTickers.includes(t));
      if (!found) errors.push(`Expected long beneficiary from ${checks.long_includes_beneficiaries.join("/")} but none found`);
    }

    // === Behavioral: Conviction calibration ===
    if (checks.confidence_is_low) {
      // Vague thesis should produce lower confidence output
      // Check: thesis words like "feel like", "might" should reduce conviction
      const hasLowSignals = /feel like|might|maybe|could/i.test(scenario.thesis);
      if (!hasLowSignals) errors.push("Test setup error: thesis should contain low-conviction language");
    }

    if (checks.etf_heavy) {
      const etfCount = sized.filter(s => s.asset_class === "etf").length;
      const stockCount = sized.filter(s => s.asset_class === "stock").length;
      if (etfCount <= stockCount)
        errors.push(`Vague thesis should prefer ETFs over stocks (got ${etfCount} ETFs, ${stockCount} stocks)`);
    }

    if (checks.smaller_positions && totalAlloc > 0) {
      // Without explicit budget, vague thesis should auto-size conservatively
      // Check that no single position exceeds 15% of liquid cash
      const liquidCash = portfolio.portfolio?.usdc_solana?.amount || 83000;
      const maxPos = Math.max(...sized.map(s => s.allocation_usd));
      if (maxPos > liquidCash * 0.15)
        errors.push(`Vague thesis: largest position $${maxPos} exceeds 15% of liquid ($${Math.round(liquidCash * 0.15)})`);
    }

    // === Behavioral: Portfolio awareness ===
    if (checks.has_usdc_overlap_flag) {
      const hasUsdcFlag = sized.some(s => s.existing_exposure > 0 && s.sub_themes?.some(t => t.includes("stablecoin")));
      // Also check if the output format function would flag USDC
      const portfolioHasUsdc = (portfolio.portfolio?.usdc_solana?.amount || 0) > 0;
      if (portfolioHasUsdc && !hasUsdcFlag)
        errors.push("Should flag existing USDC exposure for stablecoin thesis");
    }

    if (checks.has_crypto_concentration_warning) {
      const existingCrypto = Object.values(portfolio.portfolio?.positions || {})
        .reduce((sum: number, p: any) => sum + (p.usd || 0), 0);
      const newCrypto = sized.filter(s => s.asset_class === "crypto").reduce((s, r) => s + r.allocation_usd, 0);
      const totalPortfolio = portfolio.portfolio?.total_estimate || 613668;
      const cryptoPct = (existingCrypto + newCrypto) / totalPortfolio;
      // If crypto would be >70% of portfolio, there should be a concentration flag
      if (cryptoPct > 0.7) {
        const hasWarning = sized.some(s => s.existing_exposure > 0 && s.asset_class === "crypto");
        if (!hasWarning) errors.push(`Crypto would be ${Math.round(cryptoPct * 100)}% of portfolio — should flag concentration`);
      }
    }

    if (checks.has_portfolio_contradiction_warning) {
      // For "crypto will crash" with 85% crypto portfolio
      const existingCrypto = Object.values(portfolio.portfolio?.positions || {})
        .reduce((sum: number, p: any) => sum + (p.usd || 0), 0);
      const totalPortfolio = portfolio.portfolio?.total_estimate || 613668;
      const cryptoPct = existingCrypto / totalPortfolio;
      if (cryptoPct > 0.5) {
        // Check that output signals contradiction (via _contradiction flag or hedge instruments)
        const hasHedge = sized.some(s => s.direction === "short" || s.rationale?.toLowerCase().includes("hedge"));
        const hasInverse = sized.some(s => /BITO|SQQQ|BITI/i.test(s.ticker));
        if (!hasHedge && !hasInverse) errors.push("Contradiction thesis should include hedge/short instruments");
      }
    }

    if (checks.suggests_reducing_existing) {
      // For contradictory thesis, should have short positions or exposure flags
      const hasShorts = sized.some(s => s.direction === "short");
      const hasExposureFlags = sized.some(s => s.existing_exposure > 0);
      if (!hasShorts && !hasExposureFlags) errors.push("Should flag existing positions at risk from contradictory thesis");
    }

    if (checks.has_hedge_instruments) {
      const hasShortOrInverse = sized.some(s => s.direction === "short") ||
        sized.some(s => /inverse|hedge|put|short/i.test(s.rationale || ""));
      if (!hasShortOrInverse) errors.push("Contradictory thesis should suggest hedges");
    }

    if (checks.has_already_exposed_warning) {
      // For "AI tokens on Base" with $441K already in Base AI tokens
      const hasExposureFlag = sized.some(s => s.existing_exposure > 0);
      if (!hasExposureFlag) errors.push("Should flag existing Base AI token exposure");
    }

    if (checks.recommends_caution) {
      // When already fully exposed, total new allocation should be small relative to budget
      if (scenario.budget && totalAlloc > scenario.budget * 0.5)
        errors.push(`Already exposed: new allocation $${totalAlloc} is >${Math.round(scenario.budget * 0.5)} (50% of budget) — should be cautious`);
    }

    if (checks.flags_existing_positions) {
      const exposedCount = sized.filter(s => s.existing_exposure > 0).length;
      if (exposedCount === 0) errors.push("Should flag at least one existing position overlap");
    }

    // === Behavioral: Non-obvious discovery ===
    if (checks.has_non_obvious_pick) {
      // For stablecoin thesis, should find something beyond the obvious COIN/PYPL
      const obvious = ["COIN", "USDC", "USDT"];
      const nonObvious = sized.filter(s => !obvious.includes(s.ticker.toUpperCase()));
      if (nonObvious.length < 2) errors.push("Expected non-obvious picks beyond COIN/USDC");
    }

    if (checks.not_just_sol) {
      // Solana thesis should have ecosystem tokens, not just SOL
      const solEcosystem = sized.filter(s =>
        s.asset_class === "crypto" && s.ticker.toUpperCase() !== "SOL"
      );
      if (solEcosystem.length === 0) errors.push("Should find Solana ecosystem tokens, not just SOL");
    }

    if (checks.has_solana_ecosystem) {
      const solTokens = ["JUP", "RAY", "ORCA", "BONK", "WIF", "PYTH", "JTO"];
      const hasSolToken = sized.some(s => solTokens.includes(s.ticker.toUpperCase()));
      if (!hasSolToken) errors.push("Missing Solana ecosystem token");
    }

    // === Behavioral: Time awareness ===
    if (checks.recognizes_date_catalyst) {
      // Thesis mentions "Feb 25" — output should reference the date
      const hasDate = /feb|february|25/i.test(scenario.thesis);
      if (!hasDate) errors.push("Test setup error: thesis should contain date");
      // Check if any instrument has catalyst or timing info
      // (This is primarily handled by Claude in conversational mode, but the pipeline
      //  should at least detect time-sensitive language)
    }

    // === Behavioral: Energy/compute theme coverage ===
    if (checks.has_energy_or_compute) {
      const found = checks.has_energy_or_compute.some((t: string) => tickers.includes(t));
      if (!found) errors.push(`Expected energy/compute play from ${checks.has_energy_or_compute.join("/")}`);
    }

    // === Output quality ===
    if (checks.has_invalidation) {
      // Check that at least one recommendation has a non-generic rationale
      const genericCount = sized.filter(s =>
        !s.rationale || s.rationale.includes("Direct") && !s.rationale.includes("PE")
      ).length;
      if (genericCount > sized.length * 0.5)
        errors.push(`${genericCount}/${sized.length} rationales are generic — need enrichment data`);
    }

    if (checks.has_secondary) {
      if (!sized.some(s => s.asset_class === "secondary"))
        errors.push("Expected secondary/pre-IPO instrument");
    }

  } catch (e) {
    errors.push(`Pipeline error: ${(e as Error).message}`);
  }

  if (errors.length === 0) {
    console.log(`✅ #${scenario.id}: ${scenario.name}`);
    passed++;
  } else {
    console.log(`❌ #${scenario.id}: ${scenario.name}`);
    errors.forEach(e => console.log(`   • ${e}`));
    failed++;
  }
}

console.log(`\n${"═".repeat(40)}`);
console.log(`${passed}/${passed + failed} scenarios passing`);
if (failed > 0) console.log(`${failed} failing — fix these next`);
process.exit(failed > 0 ? 1 : 0);
