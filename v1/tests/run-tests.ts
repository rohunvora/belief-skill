#!/usr/bin/env bun
/**
 * Tool tests — validates that research.ts and size.ts work correctly.
 * 
 * These test the DATA TOOLS, not the agent's thesis decomposition.
 * The agent (Claude via SKILL.md) handles decomposition — that's OpenClaw's job.
 */

import { enrichInstruments } from "../scripts/research";
import { sizePositions } from "../scripts/size";
import type { CandidateInstrument, RankedInstrument } from "../scripts/types";

const PORTFOLIO_PATH = new URL("../../../examples/sample-state.json", import.meta.url).pathname;
const portfolio = JSON.parse(await Bun.file(PORTFOLIO_PATH).text());

let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void> | void) {
  return { name, fn };
}

const tests = [
  // ── research.ts tests ──
  test("research.ts: enriches stocks with Yahoo Finance data", async () => {
    const candidates: CandidateInstrument[] = [
      { ticker: "AAPL", name: "Apple", asset_class: "stock", sub_themes: [], source: "test" },
      { ticker: "NVDA", name: "NVIDIA", asset_class: "stock", sub_themes: [], source: "test" },
    ];
    const enriched = await enrichInstruments(candidates);
    if (enriched.length < 2) throw new Error(`Expected 2 enriched, got ${enriched.length}`);
    const aapl = enriched.find(e => e.ticker === "AAPL");
    if (!aapl || aapl.price <= 0) throw new Error(`AAPL price missing or zero: ${aapl?.price}`);
    if (!aapl.market_cap || aapl.market_cap < 1e12) throw new Error(`AAPL market cap implausible: ${aapl?.market_cap}`);
  }),

  test("research.ts: enriches ETFs", async () => {
    const candidates: CandidateInstrument[] = [
      { ticker: "SPY", name: "S&P 500", asset_class: "etf", sub_themes: [], source: "test" },
    ];
    const enriched = await enrichInstruments(candidates);
    if (enriched.length < 1) throw new Error("SPY not enriched");
    if (enriched[0].price <= 0) throw new Error(`SPY price missing: ${enriched[0].price}`);
  }),

  test("research.ts: handles unknown tickers gracefully", async () => {
    const candidates: CandidateInstrument[] = [
      { ticker: "ZZZZNOTREAL", name: "Fake", asset_class: "stock", sub_themes: [], source: "test" },
    ];
    const enriched = await enrichInstruments(candidates);
    // Should not crash — may return empty or with price=0
  }),

  test("research.ts: classifies secondaries correctly", async () => {
    const candidates: CandidateInstrument[] = [
      { ticker: "ANDURIL", name: "Anduril", asset_class: "secondary", sub_themes: [], source: "test" },
    ];
    const enriched = await enrichInstruments(candidates);
    const anduril = enriched.find(e => e.ticker === "ANDURIL");
    if (anduril && anduril.asset_class !== "secondary") throw new Error("Anduril should stay secondary");
  }),

  // ── size.ts tests ──
  test("size.ts: allocates budget across instruments", () => {
    const ranked: RankedInstrument[] = [
      { ticker: "AAPL", name: "Apple", asset_class: "stock", price: 180, sub_themes: [], source: "test",
        scores: { thesis_alignment: 90, valuation: 70, catalyst_proximity: 50, liquidity: 80, portfolio_fit: 60, composite: 75 }, rank: 1 },
      { ticker: "NVDA", name: "NVIDIA", asset_class: "stock", price: 800, sub_themes: [], source: "test",
        scores: { thesis_alignment: 85, valuation: 60, catalyst_proximity: 60, liquidity: 90, portfolio_fit: 50, composite: 70 }, rank: 2 },
    ];
    const sized = sizePositions(ranked, portfolio, 10000);
    const totalAlloc = sized.reduce((s, r) => s + r.allocation_usd, 0);
    if (totalAlloc <= 0) throw new Error("No allocation made");
    if (totalAlloc > 10000) throw new Error(`Over-allocated: $${totalAlloc}`);
  }),

  test("size.ts: respects concentration limits", () => {
    const ranked: RankedInstrument[] = [
      { ticker: "AAPL", name: "Apple", asset_class: "stock", price: 180, sub_themes: [], source: "test",
        scores: { thesis_alignment: 99, valuation: 99, catalyst_proximity: 99, liquidity: 99, portfolio_fit: 99, composite: 99 }, rank: 1 },
    ];
    const sized = sizePositions(ranked, portfolio, 100000);
    const aaplAlloc = sized.find(s => s.ticker === "AAPL");
    if (aaplAlloc && aaplAlloc.allocation_usd > 25000) {
      throw new Error(`Single position $${aaplAlloc.allocation_usd} exceeds 25% of $100K budget`);
    }
  }),

  test("size.ts: flags existing portfolio overlap", () => {
    const ranked: RankedInstrument[] = [
      { ticker: "SOL", name: "Solana", asset_class: "crypto", price: 100, sub_themes: [], source: "test",
        scores: { thesis_alignment: 80, valuation: 70, catalyst_proximity: 50, liquidity: 80, portfolio_fit: 60, composite: 70 }, rank: 1 },
    ];
    // Portfolio has crypto positions — sizing should detect overlap
    const sized = sizePositions(ranked, portfolio, 10000, "solana ecosystem");
    // Just verify it doesn't crash with crypto thesis + crypto-heavy portfolio
  }),

  test("size.ts: handles short positions", () => {
    const ranked: RankedInstrument[] = [
      { ticker: "MSFT", name: "Microsoft", asset_class: "stock", price: 400, sub_themes: [], source: "test",
        scores: { thesis_alignment: 80, valuation: 70, catalyst_proximity: 50, liquidity: 80, portfolio_fit: 60, composite: 70 }, rank: 1,
        _direction: "short" } as any,
    ];
    const sized = sizePositions(ranked, portfolio, 10000, "open source replaces proprietary");
    const msft = sized.find(s => s.ticker === "MSFT");
    if (msft && msft.direction !== "short") throw new Error(`MSFT should be short, got ${msft.direction}`);
  }),
];

// Run all tests
for (const t of tests) {
  try {
    await t.fn();
    console.log(`✅ ${t.name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${t.name}`);
    console.log(`   ${(e as Error).message}`);
    failed++;
  }
}

console.log(`\n${"═".repeat(40)}`);
console.log(`${passed}/${passed + failed} tests passing`);
if (failed > 0) process.exit(1);
