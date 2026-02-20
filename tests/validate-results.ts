#!/usr/bin/env bun
/**
 * Validate test results against schema and consistency rules.
 *
 * Usage:
 *   bun run tests/validate-results.ts                  # Validate all results
 *   bun run tests/validate-results.ts --check-concerns # Flag contradictions
 *   bun run tests/validate-results.ts --analyze        # Show patterns
 *
 * Output:
 *   - Schema errors: missing required fields
 *   - Consistency errors: contradictions in ratings
 *   - Patterns: breakdowns by leap distance, concern type, etc.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const RESULTS_FILE = `${ROOT}/tests/results/results.jsonl`;

// ─── Schema Definition ───

interface TestResult {
  id: string;
  timestamp: string;
  status: "rated" | "flagged" | "needs_review";

  input: {
    text: string;
    source_type: "chat" | "transcript" | "article" | "tweet" | "other";
    platform: string;
    user_id: string;
  };

  skill_output: {
    call_type: "direct" | "derived";
    author_claim: string;
    author_ticker: string | null;
    routed_ticker: string;
    conviction: "low" | "medium" | "high";
    trade_expression: string;
    derivation_steps: number;
    leap_distance: "none" | "tiny" | "small" | "medium" | "large" | "max";
  };

  rating: {
    quality: "excellent" | "good" | "okay" | "miss";
    leap_accuracy: "accurate" | "inaccurate" | "skipped";
    instrument_pick: "excellent" | "good" | "acceptable" | "poor";
    conviction_calibration: "correct" | "too_high" | "too_low" | "skipped";
    concerns: string[];
  };

  metadata: {
    session_date: string;
    user_notes: string | null;
    blocked_by: string | null;
    follow_up: string | null;
  };
}

// ─── Validators ───

interface ValidationError {
  id: string;
  type: "schema" | "consistency" | "warning";
  message: string;
}

function validateSchema(record: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const id = record.id || `line-${index}`;

  // Check required top-level fields
  const required = ["id", "timestamp", "status", "input", "skill_output", "rating", "metadata"];
  for (const field of required) {
    if (!(field in record)) {
      errors.push({
        id,
        type: "schema",
        message: `Missing required field: ${field}`,
      });
    }
  }

  // Check input fields
  if (record.input) {
    const inputRequired = ["text", "source_type", "platform", "user_id"];
    for (const field of inputRequired) {
      if (!(field in record.input)) {
        errors.push({
          id,
          type: "schema",
          message: `input.${field} is required`,
        });
      }
    }
  }

  // Check skill_output fields
  if (record.skill_output) {
    const skillRequired = [
      "call_type",
      "author_claim",
      "routed_ticker",
      "conviction",
      "trade_expression",
      "derivation_steps",
      "leap_distance",
    ];
    for (const field of skillRequired) {
      if (!(field in record.skill_output)) {
        errors.push({
          id,
          type: "schema",
          message: `skill_output.${field} is required`,
        });
      }
    }

    // Validate enum values
    const validCallTypes = ["direct", "derived"];
    if (record.skill_output.call_type && !validCallTypes.includes(record.skill_output.call_type)) {
      errors.push({
        id,
        type: "schema",
        message: `skill_output.call_type must be one of: ${validCallTypes.join(", ")}`,
      });
    }

    const validConvictions = ["low", "medium", "high"];
    if (record.skill_output.conviction && !validConvictions.includes(record.skill_output.conviction)) {
      errors.push({
        id,
        type: "schema",
        message: `skill_output.conviction must be one of: ${validConvictions.join(", ")}`,
      });
    }

    const validLeaps = ["none", "tiny", "small", "medium", "large", "max"];
    if (record.skill_output.leap_distance && !validLeaps.includes(record.skill_output.leap_distance)) {
      errors.push({
        id,
        type: "schema",
        message: `skill_output.leap_distance must be one of: ${validLeaps.join(", ")}`,
      });
    }
  }

  // Check rating fields
  if (record.rating) {
    const ratingRequired = ["quality", "leap_accuracy", "instrument_pick", "conviction_calibration", "concerns"];
    for (const field of ratingRequired) {
      if (!(field in record.rating)) {
        errors.push({
          id,
          type: "schema",
          message: `rating.${field} is required`,
        });
      }
    }

    // Validate rating enums
    const validQualities = ["excellent", "good", "okay", "miss"];
    if (record.rating.quality && !validQualities.includes(record.rating.quality)) {
      errors.push({
        id,
        type: "schema",
        message: `rating.quality must be one of: ${validQualities.join(", ")}`,
      });
    }

    // Concerns must be array
    if (record.rating.concerns && !Array.isArray(record.rating.concerns)) {
      errors.push({
        id,
        type: "schema",
        message: `rating.concerns must be an array`,
      });
    }
  }

  return errors;
}

function validateConsistency(record: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const id = record.id || `line-${index}`;

  if (!record.rating) return errors;

  const { quality, leap_accuracy, conviction_calibration, concerns } = record.rating;

  // Rule 1: If quality is "excellent", leap_accuracy and instrument_pick should not be "poor"
  if (quality === "excellent") {
    if (leap_accuracy === "inaccurate") {
      errors.push({
        id,
        type: "consistency",
        message: `Rating contradiction: quality='excellent' but leap_accuracy='inaccurate'`,
      });
    }
    if (record.rating.instrument_pick === "poor") {
      errors.push({
        id,
        type: "consistency",
        message: `Rating contradiction: quality='excellent' but instrument_pick='poor'`,
      });
    }
  }

  // Rule 2: If quality is "miss", should have at least one concern
  if (quality === "miss" && (!concerns || concerns.length === 0)) {
    errors.push({
      id,
      type: "consistency",
      message: `If quality='miss', should list at least one concern`,
    });
  }

  // Rule 3: High conviction should not have "lacks_catalyst" concern
  if (record.skill_output?.conviction === "high" && concerns?.includes("lacks_catalyst")) {
    errors.push({
      id,
      type: "warning",
      message: `High conviction but marked with 'lacks_catalyst' concern — may indicate miscalibration`,
    });
  }

  // Rule 4: Large/max leaps should rarely be "excellent"
  const { leap_distance } = record.skill_output || {};
  if ((leap_distance === "large" || leap_distance === "max") && quality === "excellent") {
    // Not an error, but note it as a pattern
    errors.push({
      id,
      type: "warning",
      message: `Large leap (${leap_distance}) rated as excellent — verify user didn't miss complexity`,
    });
  }

  return errors;
}

// ─── Analysis ───

interface Analysis {
  total_records: number;
  by_quality: Record<string, number>;
  by_leap_distance: Record<string, number>;
  by_source_type: Record<string, number>;
  top_concerns: Array<{ concern: string; count: number }>;
  miss_rate_by_leap: Record<string, string>;
  consistency_patterns: string[];
}

function analyzeResults(records: TestResult[]): Analysis {
  const analysis: Analysis = {
    total_records: records.length,
    by_quality: {},
    by_leap_distance: {},
    by_source_type: {},
    top_concerns: [],
    miss_rate_by_leap: {},
    consistency_patterns: [],
  };

  const concernCounts: Record<string, number> = {};

  for (const record of records) {
    // Count by quality
    const quality = record.rating.quality;
    analysis.by_quality[quality] = (analysis.by_quality[quality] || 0) + 1;

    // Count by leap distance
    const leap = record.skill_output.leap_distance;
    analysis.by_leap_distance[leap] = (analysis.by_leap_distance[leap] || 0) + 1;

    // Count by source type
    const source = record.input.source_type;
    analysis.by_source_type[source] = (analysis.by_source_type[source] || 0) + 1;

    // Count concerns
    for (const concern of record.rating.concerns) {
      concernCounts[concern] = (concernCounts[concern] || 0) + 1;
    }
  }

  // Calculate miss rates by leap distance
  const leapQuality: Record<string, { miss: number; total: number }> = {};
  for (const record of records) {
    const leap = record.skill_output.leap_distance;
    if (!leapQuality[leap]) {
      leapQuality[leap] = { miss: 0, total: 0 };
    }
    leapQuality[leap].total++;
    if (record.rating.quality === "miss") {
      leapQuality[leap].miss++;
    }
  }

  for (const [leap, data] of Object.entries(leapQuality)) {
    const rate = ((data.miss / data.total) * 100).toFixed(1);
    analysis.miss_rate_by_leap[leap] = `${rate}% (${data.miss}/${data.total})`;
  }

  // Top concerns
  analysis.top_concerns = Object.entries(concernCounts)
    .map(([concern, count]) => ({ concern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return analysis;
}

// ─── Main ───

function main() {
  const args = process.argv.slice(2);

  try {
    const content = readFileSync(RESULTS_FILE, "utf-8");
    const lines = content.trim().split("\n").filter((l) => l.length > 0);

    if (lines.length === 0) {
      console.log("No test results found. Create results by rating routings in Telegram.");
      return;
    }

    const records: TestResult[] = [];
    const parseErrors: ValidationError[] = [];

    for (let i = 0; i < lines.length; i++) {
      try {
        records.push(JSON.parse(lines[i]));
      } catch (e) {
        parseErrors.push({
          id: `line-${i + 1}`,
          type: "schema",
          message: `JSON parse error: ${(e as Error).message}`,
        });
      }
    }

    // Validate all records
    const schemaErrors: ValidationError[] = [];
    const consistencyErrors: ValidationError[] = [];

    for (let i = 0; i < records.length; i++) {
      schemaErrors.push(...validateSchema(records[i], i));
      consistencyErrors.push(...validateConsistency(records[i], i));
    }

    // Report errors
    const allErrors = [...parseErrors, ...schemaErrors, ...consistencyErrors];
    const errorsByType = allErrors.reduce(
      (acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log(`\n📊 Test Results Validation Report\n`);
    console.log(`Total records: ${records.length}`);
    if (allErrors.length > 0) {
      console.log(`Errors found: ${allErrors.length}`);
      console.log(`  - Schema errors: ${errorsByType["schema"] || 0}`);
      console.log(`  - Consistency errors: ${errorsByType["consistency"] || 0}`);
      console.log(`  - Warnings: ${errorsByType["warning"] || 0}`);

      if (args.includes("--verbose")) {
        console.log(`\n⚠️  Errors:\n`);
        for (const error of allErrors.slice(0, 20)) {
          console.log(`  [${error.type.toUpperCase()}] ${error.id}: ${error.message}`);
        }
        if (allErrors.length > 20) {
          console.log(`  ... and ${allErrors.length - 20} more`);
        }
      }
    } else {
      console.log(`✓ All records valid!\n`);
    }

    // Run analysis
    if (args.includes("--analyze")) {
      const analysis = analyzeResults(records);

      console.log(`\n📈 Analysis\n`);
      console.log(`By Quality:`);
      for (const [quality, count] of Object.entries(analysis.by_quality)) {
        const pct = ((count / analysis.total_records) * 100).toFixed(1);
        console.log(`  ${quality}: ${count} (${pct}%)`);
      }

      console.log(`\nBy Leap Distance:`);
      for (const [leap, count] of Object.entries(analysis.by_leap_distance)) {
        const missRate = analysis.miss_rate_by_leap[leap];
        console.log(`  ${leap}: ${count} (miss rate: ${missRate})`);
      }

      console.log(`\nBy Source Type:`);
      for (const [source, count] of Object.entries(analysis.by_source_type)) {
        const pct = ((count / analysis.total_records) * 100).toFixed(1);
        console.log(`  ${source}: ${count} (${pct}%)`);
      }

      console.log(`\nTop Concerns:`);
      for (const { concern, count } of analysis.top_concerns) {
        const pct = ((count / analysis.total_records) * 100).toFixed(1);
        console.log(`  ${concern}: ${count} (${pct}%)`);
      }
    }

    // Exit with error if validation failed
    if (allErrors.length > 0 && allErrors.some((e) => e.type !== "warning")) {
      process.exit(1);
    }
  } catch (e) {
    console.error(`Error reading results file: ${(e as Error).message}`);
    process.exit(1);
  }
}

main();
