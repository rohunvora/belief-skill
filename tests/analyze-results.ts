#!/usr/bin/env bun
/**
 * Quick analysis tool for test results.
 *
 * Usage:
 *   bun run tests/analyze-results.ts                    # Summary
 *   bun run tests/analyze-results.ts --by-concern      # Top concerns
 *   bun run tests/analyze-results.ts --by-source       # By source type
 *   bun run tests/analyze-results.ts --contradictions  # Flag inconsistent ratings
 *   bun run tests/analyze-results.ts --recent N        # Show last N results
 *   bun run tests/analyze-results.ts --export          # Export for spreadsheet (TSV)
 *
 * Output: Human-readable analysis and patterns
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const RESULTS_FILE = `${ROOT}/tests/results/results.jsonl`;

interface TestResult {
  id: string;
  timestamp: string;
  input: { text: string; source_type: string };
  skill_output: { leap_distance: string; conviction: string };
  rating: { quality: string; concerns: string[] };
}

function readResults(): TestResult[] {
  try {
    const content = readFileSync(RESULTS_FILE, "utf-8");
    const lines = content.trim().split("\n").filter((l) => l.length > 0);

    return lines
      .map((line, idx) => {
        try {
          return JSON.parse(line) as TestResult;
        } catch (e) {
          console.warn(`Skipping malformed line ${idx + 1}`);
          return null;
        }
      })
      .filter((r): r is TestResult => r !== null);
  } catch (e) {
    console.error(`Error reading results: ${(e as Error).message}`);
    return [];
  }
}

function summaryReport(results: TestResult[]): void {
  if (results.length === 0) {
    console.log("No results yet.");
    return;
  }

  const qualityCounts = { excellent: 0, good: 0, okay: 0, miss: 0 };
  const leapCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  for (const r of results) {
    qualityCounts[r.rating.quality as keyof typeof qualityCounts]++;
    leapCounts[r.skill_output.leap_distance] = (leapCounts[r.skill_output.leap_distance] || 0) + 1;
    sourceCounts[r.input.source_type] = (sourceCounts[r.input.source_type] || 0) + 1;
  }

  console.log(`\n📊 Test Results Summary\n`);
  console.log(`Total: ${results.length} rated`);

  const successRate = (
    ((qualityCounts.excellent + qualityCounts.good) / results.length) *
    100
  ).toFixed(1);
  console.log(`Success rate (excellent + good): ${successRate}%\n`);

  console.log(`Quality Distribution:`);
  for (const [quality, count] of Object.entries(qualityCounts)) {
    const pct = ((count / results.length) * 100).toFixed(1);
    console.log(`  ${quality.padEnd(10)}: ${count.toString().padEnd(4)} (${pct}%)`);
  }

  console.log(`\nLeap Distance Distribution:`);
  const leapOrder = ["none", "tiny", "small", "medium", "large", "max"];
  for (const leap of leapOrder) {
    const count = leapCounts[leap] || 0;
    if (count > 0) {
      const pct = ((count / results.length) * 100).toFixed(1);
      console.log(`  ${leap.padEnd(10)}: ${count.toString().padEnd(4)} (${pct}%)`);
    }
  }

  console.log(`\nSource Type Distribution:`);
  for (const [source, count] of Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / results.length) * 100).toFixed(1);
    console.log(`  ${source.padEnd(10)}: ${count.toString().padEnd(4)} (${pct}%)`);
  }
}

function byConcernReport(results: TestResult[]): void {
  const concernCounts: Record<string, number> = {};

  for (const r of results) {
    for (const concern of r.rating.concerns) {
      concernCounts[concern] = (concernCounts[concern] || 0) + 1;
    }
  }

  const sorted = Object.entries(concernCounts).sort((a, b) => b[1] - a[1]);

  console.log(`\n🚩 Top Concerns\n`);
  for (const [concern, count] of sorted) {
    const pct = ((count / results.length) * 100).toFixed(1);
    console.log(`  ${concern.padEnd(25)}: ${count.toString().padEnd(4)} (${pct}%)`);
  }
}

function bySourceReport(results: TestResult[]): void {
  const bySource: Record<string, { total: number; excellent: number; good: number; okay: number; miss: number }> = {};

  for (const r of results) {
    const source = r.input.source_type;
    if (!bySource[source]) {
      bySource[source] = { total: 0, excellent: 0, good: 0, okay: 0, miss: 0 };
    }
    bySource[source].total++;
    bySource[source][r.rating.quality as keyof typeof bySource[string]]++;
  }

  console.log(`\n📰 Performance by Source Type\n`);
  const header = "Source".padEnd(15) + "Total".padEnd(8) + "Excellent".padEnd(12) + "Good".padEnd(8) + "Okay".padEnd(8) + "Miss".padEnd(8) + "Success Rate";
  console.log(header);
  console.log(`${"-".repeat(80)}`);

  for (const [source, data] of Object.entries(bySource).sort((a, b) => b[1].total - a[1].total)) {
    const successRate = (((data.excellent + data.good) / data.total) * 100).toFixed(1);
    console.log(
      `${source.padEnd(15)} ${data.total.toString().padEnd(8)} ${data.excellent.toString().padEnd(3)}/- ${data.good.toString().padEnd(3)}/- ${data.okay.toString().padEnd(3)}/- ${data.miss.toString().padEnd(3)}/- ${successRate}%`
    );
  }
}

function contradictionReport(results: TestResult[]): void {
  const contradictions = [];

  for (const r of results) {
    // Excellent but has concerns
    if (r.rating.quality === "excellent" && r.rating.concerns.length > 0) {
      contradictions.push({
        id: r.id,
        issue: `Excellent but has concerns: ${r.rating.concerns.join(", ")}`,
      });
    }

    // Miss but no concerns
    if (r.rating.quality === "miss" && r.rating.concerns.length === 0) {
      contradictions.push({
        id: r.id,
        issue: `Rated as miss but no concerns listed`,
      });
    }

    // High conviction but okay/miss
    if (r.skill_output.conviction === "high" && (r.rating.quality === "okay" || r.rating.quality === "miss")) {
      contradictions.push({
        id: r.id,
        issue: `High conviction (${r.skill_output.conviction}) but rated ${r.rating.quality}`,
      });
    }
  }

  if (contradictions.length === 0) {
    console.log(`\n✓ No contradictions found`);
  } else {
    console.log(`\n⚠️  Found ${contradictions.length} potential inconsistencies:\n`);
    for (const c of contradictions.slice(0, 20)) {
      console.log(`  [${c.id}] ${c.issue}`);
    }
    if (contradictions.length > 20) {
      console.log(`  ... and ${contradictions.length - 20} more`);
    }
  }
}

function recentReport(results: TestResult[], count: number): void {
  console.log(`\n⏱️  Last ${count} Results\n`);
  const recent = results.slice(-count).reverse();

  for (const r of recent) {
    const timestamp = new Date(r.timestamp).toLocaleString();
    console.log(`${r.id} [${timestamp}]`);
    console.log(`  Input: "${r.input.text.substring(0, 60)}..."`);
    console.log(`  Leap: ${r.skill_output.leap_distance} | Rating: ${r.rating.quality} | Concerns: ${r.rating.concerns.length}`);
    if (r.rating.concerns.length > 0) {
      console.log(`    - ${r.rating.concerns.join(", ")}`);
    }
    console.log();
  }
}

function exportTSV(results: TestResult[]): void {
  console.log(
    `ID\tTimestamp\tSource\tLeap\tConviction\tQuality\tConcerns\tInput Text`
  );
  for (const r of results) {
    const concerns = r.rating.concerns.join("; ");
    const text = r.input.text.substring(0, 100).replace(/\t/g, " ").replace(/\n/g, " ");
    console.log(
      `${r.id}\t${r.timestamp}\t${r.input.source_type}\t${r.skill_output.leap_distance}\t${r.skill_output.conviction}\t${r.rating.quality}\t${concerns}\t${text}`
    );
  }
}

function main() {
  const args = process.argv.slice(2);
  const results = readResults();

  if (results.length === 0) {
    console.log("No results to analyze yet.");
    return;
  }

  if (args.includes("--by-concern")) {
    byConcernReport(results);
  } else if (args.includes("--by-source")) {
    bySourceReport(results);
  } else if (args.includes("--contradictions")) {
    contradictionReport(results);
  } else if (args.includes("--recent")) {
    const countIdx = args.indexOf("--recent");
    const count = parseInt(args[countIdx + 1]) || 5;
    recentReport(results, count);
  } else if (args.includes("--export")) {
    exportTSV(results);
  } else {
    summaryReport(results);
  }
}

main();
