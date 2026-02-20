#!/usr/bin/env bun
/**
 * Correlate test results against leap-distance-samples.ts
 *
 * Answers:
 * - Do "small" leaps get better ratings than "large" leaps?
 * - Are "max" leaps consistently rated worse?
 * - Are there systematic biases in how leap distance is evaluated?
 *
 * Usage:
 *   bun run tests/correlate-leap-distance.ts          # Show correlation summary
 *   bun run tests/correlate-leap-distance.ts --detail # Show per-leap breakdown
 *
 * Output:
 *   - Leap distance → quality distribution
 *   - Success rate by leap
 *   - Calibration curves
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const RESULTS_FILE = `${ROOT}/tests/results/results.jsonl`;

interface LeapCorrelation {
  leap_distance: string;
  total: number;
  excellent: number;
  good: number;
  okay: number;
  miss: number;
  success_rate: string;
  avg_steps: number;
}

interface CorrelationReport {
  total_results: number;
  correlations: LeapCorrelation[];
  quality_trend: string;
  calibration_assessment: string;
  recommendations: string[];
}

function parseResults(): Map<string, LeapCorrelation> {
  try {
    const content = readFileSync(RESULTS_FILE, "utf-8");
    const lines = content.trim().split("\n").filter((l) => l.length > 0);

    const byLeap = new Map<
      string,
      {
        excellent: number;
        good: number;
        okay: number;
        miss: number;
        total: number;
        steps: number[];
      }
    >();

    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        const leap = record.skill_output?.leap_distance || "unknown";
        const quality = record.rating?.quality || "unknown";
        const steps = record.skill_output?.derivation_steps || 0;

        if (!byLeap.has(leap)) {
          byLeap.set(leap, {
            excellent: 0,
            good: 0,
            okay: 0,
            miss: 0,
            total: 0,
            steps: [],
          });
        }

        const entry = byLeap.get(leap)!;
        entry.total++;
        entry.steps.push(steps);

        if (quality === "excellent") entry.excellent++;
        else if (quality === "good") entry.good++;
        else if (quality === "okay") entry.okay++;
        else if (quality === "miss") entry.miss++;
      } catch (e) {
        // Skip malformed lines
      }
    }

    // Convert to report format
    const correlations = new Map<string, LeapCorrelation>();
    for (const [leap, data] of byLeap.entries()) {
      const successCount = data.excellent + data.good;
      const successRate = ((successCount / data.total) * 100).toFixed(1);
      const avgSteps = data.steps.length > 0 ? data.steps.reduce((a, b) => a + b, 0) / data.steps.length : 0;

      correlations.set(leap, {
        leap_distance: leap,
        total: data.total,
        excellent: data.excellent,
        good: data.good,
        okay: data.okay,
        miss: data.miss,
        success_rate: `${successRate}%`,
        avg_steps: Math.round(avgSteps * 10) / 10,
      });
    }

    return correlations;
  } catch (e) {
    console.error(`Error reading results: ${(e as Error).message}`);
    return new Map();
  }
}

function assessCalibration(correlations: Map<string, LeapCorrelation>): {
  trend: string;
  assessment: string;
  recommendations: string[];
} {
  // Expected quality trend by leap distance:
  // - "none" → should have highest success rate (~95%+)
  // - "tiny" → high success (~85%+)
  // - "small" → good success (~75%+)
  // - "medium" → moderate success (~60%+)
  // - "large" → lower success (~40%+)
  // - "max" → lowest success (~20%+)

  const leapOrder = ["none", "tiny", "small", "medium", "large", "max"];
  const actual: { leap: string; rate: number }[] = [];

  for (const leap of leapOrder) {
    const corr = correlations.get(leap);
    if (corr) {
      const rate = parseFloat(corr.success_rate);
      actual.push({ leap, rate });
    }
  }

  // Check if trend is monotonically decreasing
  let isMonotonic = true;
  for (let i = 1; i < actual.length; i++) {
    if (actual[i].rate > actual[i - 1].rate) {
      isMonotonic = false;
      break;
    }
  }

  const recommendations: string[] = [];

  // Assess each leap distance
  const expectations: Record<string, number> = {
    none: 95,
    tiny: 85,
    small: 75,
    medium: 60,
    large: 40,
    max: 20,
  };

  for (const { leap, rate } of actual) {
    const expected = expectations[leap] || 50;
    const diff = rate - expected;

    if (Math.abs(diff) > 20) {
      if (diff > 0) {
        recommendations.push(
          `✓ ${leap} leaps are being rated higher than expected (${rate.toFixed(0)}% vs ${expected}% expected) — skill is excelling here`
        );
      } else {
        recommendations.push(
          `⚠️  ${leap} leaps are being rated lower than expected (${rate.toFixed(0)}% vs ${expected}% expected) — may need adjustment`
        );
      }
    }
  }

  let trend = "📊 Trend: ";
  if (isMonotonic) {
    trend += "✓ Monotonically decreasing (well-calibrated)";
  } else {
    trend += "⚠️  Non-monotonic (may indicate inconsistency in leap distance assessment)";
    recommendations.push(`Re-evaluate how leap distances are assigned — some larger leaps are getting better ratings than smaller ones`);
  }

  const assessment = isMonotonic ? "Well-calibrated" : "Needs review";

  return { trend, assessment, recommendations };
}

function main() {
  const args = process.argv.slice(2);

  const correlations = parseResults();

  if (correlations.size === 0) {
    console.log("No test results found. Create results by rating routings in Telegram.");
    return;
  }

  // Sort by leap distance order
  const leapOrder = ["none", "tiny", "small", "medium", "large", "max"];
  const sorted = leapOrder.filter((l) => correlations.has(l)).map((l) => correlations.get(l)!);

  console.log(`\n🔗 Leap Distance Correlation Report\n`);
  console.log(`Total results analyzed: ${Array.from(correlations.values()).reduce((sum, c) => sum + c.total, 0)}`);
  const corrHeader = "Leap".padEnd(10) + "Count".padEnd(8) + "Excellent".padEnd(12) + "Good".padEnd(8) + "Okay".padEnd(8) + "Miss".padEnd(8) + "Success".padEnd(10) + "Avg Steps";
  console.log(`\n${corrHeader}`);
  console.log(`${"-".repeat(100)}`);

  for (const corr of sorted) {
    const exCount = `${corr.excellent}`.padEnd(2);
    const goodCount = `${corr.good}`.padEnd(2);
    const okayCount = `${corr.okay}`.padEnd(2);
    const missCount = `${corr.miss}`.padEnd(2);

    console.log(
      `${corr.leap_distance.padEnd(10)} ${String(corr.total).padEnd(8)} ${exCount}/- ${goodCount}/- ${okayCount}/- ${missCount}/- ${corr.success_rate.padEnd(10)} ${corr.avg_steps}`
    );
  }

  // Calibration assessment
  const { trend, assessment, recommendations } = assessCalibration(correlations);

  console.log(`\n${trend}`);
  console.log(`Calibration: ${assessment}`);

  if (recommendations.length > 0) {
    console.log(`\nRecommendations:`);
    for (const rec of recommendations) {
      console.log(`  ${rec}`);
    }
  }

  // Detailed breakdown
  if (args.includes("--detail")) {
    console.log(`\n📋 Detailed Breakdown\n`);

    for (const corr of sorted) {
      console.log(`${corr.leap_distance.toUpperCase()}: ${corr.total} results`);
      console.log(
        `  Excellent: ${corr.excellent} | Good: ${corr.good} | Okay: ${corr.okay} | Miss: ${corr.miss} | Success: ${corr.success_rate}`
      );
      console.log(`  Avg derivation steps: ${corr.avg_steps}`);
      console.log();
    }
  }
}

main();
