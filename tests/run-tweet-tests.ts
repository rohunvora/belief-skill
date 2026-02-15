#!/usr/bin/env bun
/**
 * Tweet-based test runner — 48 real theses from @frankdegods
 * Validates thesis extraction, instrument discovery, and sizing quality
 * 
 * Pass criteria: 90% easy, 70% medium, 50% hard
 */

import { discoverInstruments } from "../scripts/instruments";
import { enrichInstruments } from "../scripts/research";
import { rankInstruments } from "../scripts/rank";
import { sizePositions } from "../scripts/size";

const PORTFOLIO_PATH = new URL("../../../examples/sample-state.json", import.meta.url).pathname;
const tests = JSON.parse(await Bun.file(new URL("./test-theses.json", import.meta.url).pathname).text());
const portfolio = JSON.parse(await Bun.file(PORTFOLIO_PATH).text());

interface TestCase {
  id: string; date: string; text: string; url: string;
  type: string; likes: number; thesis: string;
  category: string; difficulty: "easy" | "medium" | "hard";
  ideal_instruments: string[]; edge_type: string;
}

const results: { difficulty: string; pass: boolean; id: string; text: string; found: string[]; ideal: string[]; errors: string[] }[] = [];

// Rate limit: process sequentially with small delay between
for (const test of tests as TestCase[]) {
  const errors: string[] = [];
  let foundTickers: string[] = [];

  try {
    const candidates = await discoverInstruments(test.text);
    const enriched = await enrichInstruments(candidates);
    const ranked = rankInstruments(enriched, test.text);
    const sized = sizePositions(ranked, portfolio, 10000, test.text);

    foundTickers = sized.map(s => s.ticker.toUpperCase());
    const foundAll = [...foundTickers, ...candidates.map(c => c.ticker.toUpperCase())];

    // Check: did we find at least 2 of the ideal instruments (or valid alternatives)?
    const idealNormalized = test.ideal_instruments.map(i =>
      i.replace(/\$/g, "").toUpperCase().split(" ")[0] // "$TRUMP" → "TRUMP", "SOL futures" → "SOL"
    );
    const matches = idealNormalized.filter(ideal =>
      foundAll.some(f => f === ideal || f.includes(ideal) || ideal.includes(f))
    );

    if (matches.length < Math.min(2, idealNormalized.length)) {
      errors.push(`Found ${matches.length}/${idealNormalized.length} ideal instruments: [${matches.join(",")}] missing [${idealNormalized.filter(i => !matches.includes(i)).join(",")}]`);
    }

    // Check: did we produce any output at all?
    if (sized.length === 0 && candidates.length === 0) {
      errors.push("No instruments discovered at all");
    }

    // Check: no obviously wrong instruments (hard to validate automatically)
    // For now just check we got something reasonable

  } catch (e) {
    errors.push(`Pipeline error: ${(e as Error).message}`);
  }

  const pass = errors.length === 0;
  results.push({
    difficulty: test.difficulty,
    pass,
    id: test.id,
    text: test.text.slice(0, 80),
    found: foundTickers.slice(0, 8),
    ideal: test.ideal_instruments.slice(0, 5),
    errors,
  });

  const icon = pass ? "✅" : "❌";
  const diffIcon = test.difficulty === "easy" ? "🟢" : test.difficulty === "medium" ? "🟡" : "🔴";
  console.log(`${icon} ${diffIcon} ${test.text.slice(0, 70)}${test.text.length > 70 ? "..." : ""}`);
  if (!pass) errors.forEach(e => console.log(`   • ${e}`));
  if (pass) console.log(`   → ${foundTickers.slice(0, 6).join(", ")}`);

  // Small delay to avoid API rate limits
  await new Promise(r => setTimeout(r, 200));
}

// Summary
console.log(`\n${"═".repeat(50)}`);
const byDiff = { easy: { pass: 0, total: 0 }, medium: { pass: 0, total: 0 }, hard: { pass: 0, total: 0 } };
for (const r of results) {
  const d = byDiff[r.difficulty as keyof typeof byDiff];
  d.total++;
  if (r.pass) d.pass++;
}

for (const [diff, { pass, total }] of Object.entries(byDiff)) {
  const pct = total > 0 ? Math.round((pass / total) * 100) : 0;
  const target = diff === "easy" ? 90 : diff === "medium" ? 70 : 50;
  const met = pct >= target ? "✅" : "❌";
  console.log(`${met} ${diff}: ${pass}/${total} (${pct}%) — target ${target}%`);
}

const totalPass = results.filter(r => r.pass).length;
console.log(`\nOverall: ${totalPass}/${results.length} (${Math.round((totalPass / results.length) * 100)}%)`);

// Write detailed results
await Bun.write(
  new URL("./tweet-test-results.json", import.meta.url).pathname,
  JSON.stringify(results, null, 2)
);
console.log("\nDetailed results → tests/tweet-test-results.json");
