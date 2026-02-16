#!/usr/bin/env bun
/**
 * Adapter smoke tests — exercises every adapter with live data.
 * Run: bun run tests/smoke-adapters.ts
 *
 * Validates:
 *  - Each adapter returns valid JSON
 *  - Instrument discovery finds results for known queries
 *  - Return calculations produce reasonable numbers
 *  - Edge cases (k-prefix coins, leveraged ETFs, empty orderbooks) handled
 */

const { execSync } = require("child_process");

interface TestCase {
  name: string;
  command: string;
  validate: (output: any) => string | null; // null = pass, string = failure reason
}

const SCRIPTS = "scripts/adapters";

function run(cmd: string): any {
  try {
    const raw = execSync(`bun run ${cmd}`, {
      cwd: __dirname + "/..",
      timeout: 30_000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    // Extract JSON from stdout (adapters print debug to stderr)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err: any) {
    // Check if stderr has useful info
    const stderr = err.stderr?.toString() || "";
    if (stderr.includes("ERROR")) return { __error: stderr.trim() };
    if (err.stdout) {
      const jsonMatch = err.stdout.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
    return { __error: err.message };
  }
}

const tests: TestCase[] = [
  // === KALSHI ===
  {
    name: "Kalshi instruments: fed rate",
    command: `${SCRIPTS}/kalshi/instruments.ts "fed rate"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (o.platform !== "kalshi") return `Wrong platform: ${o.platform}`;
      if (!o.instruments?.length) return "No instruments found";
      const hasFed = o.instruments.some((i: any) => i.ticker?.includes("KXFED"));
      if (!hasFed) return "Missing KXFED series";
      return null;
    },
  },
  {
    name: "Kalshi instruments: S&P 500",
    command: `${SCRIPTS}/kalshi/instruments.ts "sp500 stock market"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const hasInx = o.instruments?.some((i: any) => i.ticker?.includes("INX"));
      if (!hasInx) return "Missing S&P 500 series (INX)";
      return null;
    },
  },
  {
    name: "Kalshi returns: KXFED-26MAR yes",
    command: `${SCRIPTS}/kalshi/returns.ts "KXFED-26MAR" "T4.25" "yes"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const expr = o.expression;
      if (!expr) return "Missing expression";
      if (expr.platform !== "kalshi") return `Wrong platform: ${expr.platform}`;
      if (typeof expr.return_if_right_pct !== "number") return "Missing return_if_right_pct";
      if (expr.return_if_wrong_pct !== -100) return `Wrong return_if_wrong_pct: ${expr.return_if_wrong_pct}`;
      return null;
    },
  },
  {
    name: "Kalshi returns: recession market",
    command: `${SCRIPTS}/kalshi/returns.ts "KXRECSSNBER-26" "" "yes"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (!o.expression?.market_implied_prob) return "Missing implied probability";
      if (o.expression.market_implied_prob < 0 || o.expression.market_implied_prob > 1)
        return `Invalid prob: ${o.expression.market_implied_prob}`;
      return null;
    },
  },

  // === KALSHI expanded series ===
  {
    name: "Kalshi instruments: gold (no BTC/ETH noise)",
    command: `${SCRIPTS}/kalshi/instruments.ts "gold price"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (!o.instruments) return "Missing instruments array";
      const tickers = o.instruments.map((i: any) => i.ticker);
      // Gold series may have no open events — accept that
      // Key check: no BTC/ETH noise in results
      const hasBtc = tickers.some((t: string) => t.includes("KXBTC") || t.includes("BTC"));
      if (hasBtc) return `Noise: BTC series appeared in gold query: ${tickers.join(", ")}`;
      return null;
    },
  },
  {
    name: "Kalshi instruments: oil crude",
    command: `${SCRIPTS}/kalshi/instruments.ts "oil crude"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      // Oil series may have no open events — accept 0 instruments as valid
      // (the adapter logs "skipping" for matched-but-inactive series)
      if (!o.instruments) return "Missing instruments array";
      const tickers = o.instruments.map((i: any) => i.ticker);
      // If instruments found, verify they're oil-related
      if (tickers.length > 0) {
        const hasOil = tickers.some((t: string) => t.includes("OIL") || t.includes("WTI"));
        if (!hasOil) return `Expected oil instruments. Got: ${tickers.join(", ")}`;
      }
      return null;
    },
  },
  {
    name: "Kalshi instruments: unemployment jobs",
    command: `${SCRIPTS}/kalshi/instruments.ts "unemployment jobs"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const tickers = (o.instruments || []).map((i: any) => i.ticker);
      const hasU3 = tickers.some((t: string) => t.includes("KXU3"));
      if (!hasU3) return `Missing unemployment series. Got: ${tickers.join(", ")}`;
      return null;
    },
  },
  {
    name: "Kalshi instruments: euro (no fed rate noise)",
    command: `${SCRIPTS}/kalshi/instruments.ts "euro dollar"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (!o.instruments) return "Missing instruments array";
      const tickers = o.instruments.map((i: any) => i.ticker);
      // Euro series may have no open events. Key check: no fed noise
      const hasFed = tickers.some((t: string) => t.includes("KXFED"));
      if (hasFed) return `Noise: Fed series appeared in euro query: ${tickers.join(", ")}`;
      return null;
    },
  },

  // === ROBINHOOD ===
  {
    name: "Robinhood instruments: NVDA AAPL",
    command: `${SCRIPTS}/robinhood/instruments.ts "NVDA AAPL"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (o.platform !== "robinhood") return `Wrong platform: ${o.platform}`;
      const validated = o.validated_instruments || [];
      if (validated.length < 2) return `Expected 2 instruments, got ${validated.length}`;
      return null;
    },
  },
  {
    name: "Robinhood returns: NVDA stock",
    command: `${SCRIPTS}/robinhood/returns.ts NVDA long stock`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const expr = o.expression;
      if (!expr) return "Missing expression";
      if (expr.return_if_right_pct <= 0) return `Bad return: ${expr.return_if_right_pct}`;
      if (expr.return_if_wrong_pct >= 0) return `Bad loss: ${expr.return_if_wrong_pct}`;
      if (!expr.instrument_name) return "Missing instrument name";
      return null;
    },
  },
  {
    name: "Robinhood returns: AAPL option (30-45d expiry)",
    command: `${SCRIPTS}/robinhood/returns.ts AAPL long option`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const expr = o.expression;
      if (!expr) return "Missing expression";
      if (!expr.execution_details?.expiration) return "Missing expiration";
      // Verify 30-45 day window
      const exp = new Date(expr.execution_details.expiration);
      const now = new Date();
      const days = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (days < 25 || days > 50) return `Expiry ${Math.round(days)}d out of 30-45d range`;
      return null;
    },
  },
  {
    name: "Robinhood returns: TECL leveraged ETF short→inverse swap",
    command: `${SCRIPTS}/robinhood/returns.ts TECL short etf`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const name = o.expression?.instrument_name || "";
      if (!name.toLowerCase().includes("bear")) return `Expected bear ETF, got: ${name}`;
      return null;
    },
  },

  // === HYPERLIQUID ===
  {
    name: "Hyperliquid instruments: SOL BTC ETH",
    command: `${SCRIPTS}/hyperliquid/instruments.ts "SOL BTC ETH"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (o.platform !== "hyperliquid") return `Wrong platform: ${o.platform}`;
      const validated = o.validated_instruments || [];
      if (validated.length < 3) return `Expected 3 instruments, got ${validated.length}`;
      for (const v of validated) {
        if (!v.mark_price || v.mark_price <= 0) return `Bad price for ${v.ticker}: ${v.mark_price}`;
      }
      return null;
    },
  },
  {
    name: "Hyperliquid instruments: kPEPE via alias",
    command: `${SCRIPTS}/hyperliquid/instruments.ts "PEPE FLOKI"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const validated = o.validated_instruments || [];
      const hasKpepe = validated.some((v: any) => v.ticker === "kPEPE-PERP");
      const hasKfloki = validated.some((v: any) => v.ticker === "kFLOKI-PERP");
      if (!hasKpepe) return "Missing kPEPE-PERP (alias failed)";
      if (!hasKfloki) return "Missing kFLOKI-PERP (alias failed)";
      return null;
    },
  },
  {
    name: "Hyperliquid returns: SOL 5x long",
    command: `${SCRIPTS}/hyperliquid/returns.ts SOL long 5`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      const expr = o.expression;
      if (!expr) return "Missing expression";
      if (!expr.instrument_name?.includes("SOL")) return `Wrong instrument: ${expr.instrument_name}`;
      if (!expr.execution_details?.liquidation_price) return "Missing liquidation price";
      if (expr.execution_details.liquidation_price >= expr.execution_details.entry_price)
        return "Liquidation price should be below entry for long";
      if (expr.return_if_wrong_pct < -100) return `Loss exceeds -100%: ${expr.return_if_wrong_pct}`;
      return null;
    },
  },
  {
    name: "Hyperliquid returns: kPEPE via direct k-prefix",
    command: `${SCRIPTS}/hyperliquid/returns.ts kPEPE long 3`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (!o.expression?.instrument_name?.includes("kPEPE")) return "k-prefix not preserved";
      return null;
    },
  },

  // === ANGEL ===
  {
    name: "Angel instruments: AI defense (expected sparse)",
    command: `${SCRIPTS}/angel/instruments.ts "AI defense"`,
    validate: (o) => {
      if (!o || o.__error) return `Error: ${o?.__error || "no output"}`;
      if (o.platform !== "angel") return `Wrong platform: ${o.platform}`;
      // Angel results are often empty — just verify it returns valid structure
      if (!Array.isArray(o.instruments)) return "Missing instruments array";
      return null;
    },
  },
];

// --- Run tests ---
async function main() {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log(`\n🧪 Belief Router Adapter Smoke Tests (${tests.length} tests)\n`);

  for (const test of tests) {
    process.stdout.write(`  ${test.name}... `);
    const output = run(test.command);
    const result = test.validate(output);

    if (result === null) {
      console.log("✅");
      passed++;
    } else {
      console.log(`❌ ${result}`);
      failed++;
      failures.push(`${test.name}: ${result}`);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ✅ ${passed} passed  ❌ ${failed} failed  📊 ${tests.length} total`);

  if (failures.length) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  • ${f}`);
  }

  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

main();
