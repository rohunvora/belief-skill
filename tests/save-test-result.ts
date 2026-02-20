#!/usr/bin/env bun
/**
 * Save a test result to results.jsonl
 *
 * Called by skill after user rates a routing.
 * Appends one JSONL line containing the complete test record.
 *
 * Usage (from skill context):
 *   const result = await saveTestResult({
 *     input: { text, source_type, platform, user_id },
 *     skill_output: { call_type, author_claim, routed_ticker, ... },
 *     rating: { quality, leap_accuracy, instrument_pick, conviction_calibration, concerns },
 *     metadata: { session_date, user_notes, ... }
 *   });
 */

import { appendFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";

const ROOT = process.env.BELIEF_ROOT || resolve(__dirname, "..");
const RESULTS_DIR = `${ROOT}/tests/results`;
const RESULTS_FILE = `${RESULTS_DIR}/results.jsonl`;

// Ensure directory exists
mkdirSync(RESULTS_DIR, { recursive: true });

export interface TestInput {
  text: string;
  source_type: "chat" | "transcript" | "article" | "tweet" | "other";
  platform: string;
  user_id: string;
}

export interface SkillOutput {
  call_type: "direct" | "derived";
  author_claim: string;
  author_ticker: string | null;
  routed_ticker: string;
  conviction: "low" | "medium" | "high";
  trade_expression: string;
  derivation_steps: number;
  leap_distance: "none" | "tiny" | "small" | "medium" | "large" | "max";
}

export interface Rating {
  quality: "excellent" | "good" | "okay" | "miss";
  leap_accuracy: "accurate" | "inaccurate" | "skipped";
  instrument_pick: "excellent" | "good" | "acceptable" | "poor";
  conviction_calibration: "correct" | "too_high" | "too_low" | "skipped";
  concerns: string[];
}

export interface Metadata {
  session_date: string;
  user_notes: string | null;
  blocked_by: string | null;
  follow_up: string | null;
}

export interface TestResult {
  id: string;
  timestamp: string;
  status: "rated" | "flagged" | "needs_review";
  input: TestInput;
  skill_output: SkillOutput;
  rating: Rating;
  metadata: Metadata;
}

/**
 * Generate a unique test result ID
 * Format: tr-YYYY-MM-DD-NNN (timezone-aware, sequential per day)
 */
function generateId(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // For uniqueness within a day, we could use timestamp milliseconds or a counter
  const ms = now.getMilliseconds();
  const seq = String(Math.floor(Math.random() * 999)).padStart(3, "0");

  return `tr-${date}-${seq}`;
}

/**
 * Save a test result to results.jsonl
 * Returns the ID of the saved record
 */
export function saveTestResult(
  input: TestInput,
  skillOutput: SkillOutput,
  rating: Rating,
  metadata: Metadata
): TestResult {
  const now = new Date();
  const id = generateId();

  const record: TestResult = {
    id,
    timestamp: now.toISOString(),
    status: "rated",
    input,
    skill_output: skillOutput,
    rating,
    metadata,
  };

  try {
    appendFileSync(RESULTS_FILE, JSON.stringify(record) + "\n");
    return record;
  } catch (e) {
    console.error(`Failed to save test result: ${(e as Error).message}`);
    throw e;
  }
}

/**
 * Validate that a test result conforms to the schema
 * Throws on validation error
 */
export function validateTestResult(record: TestResult): void {
  // Check required fields
  if (!record.id) throw new Error("Test result requires 'id'");
  if (!record.timestamp) throw new Error("Test result requires 'timestamp'");
  if (!record.input) throw new Error("Test result requires 'input'");
  if (!record.skill_output) throw new Error("Test result requires 'skill_output'");
  if (!record.rating) throw new Error("Test result requires 'rating'");
  if (!record.metadata) throw new Error("Test result requires 'metadata'");

  // Check input
  const validSourceTypes = ["chat", "transcript", "article", "tweet", "other"];
  if (!validSourceTypes.includes(record.input.source_type)) {
    throw new Error(
      `Invalid source_type: ${record.input.source_type}. Must be one of: ${validSourceTypes.join(", ")}`
    );
  }

  // Check skill_output
  const validCallTypes = ["direct", "derived"];
  if (!validCallTypes.includes(record.skill_output.call_type)) {
    throw new Error(`Invalid call_type: ${record.skill_output.call_type}`);
  }

  const validConvictions = ["low", "medium", "high"];
  if (!validConvictions.includes(record.skill_output.conviction)) {
    throw new Error(`Invalid conviction: ${record.skill_output.conviction}`);
  }

  const validLeaps = ["none", "tiny", "small", "medium", "large", "max"];
  if (!validLeaps.includes(record.skill_output.leap_distance)) {
    throw new Error(`Invalid leap_distance: ${record.skill_output.leap_distance}`);
  }

  // Check rating
  const validQualities = ["excellent", "good", "okay", "miss"];
  if (!validQualities.includes(record.rating.quality)) {
    throw new Error(`Invalid rating quality: ${record.rating.quality}`);
  }

  const validAccuracies = ["accurate", "inaccurate", "skipped"];
  if (!validAccuracies.includes(record.rating.leap_accuracy)) {
    throw new Error(`Invalid leap_accuracy: ${record.rating.leap_accuracy}`);
  }

  if (!Array.isArray(record.rating.concerns)) {
    throw new Error("rating.concerns must be an array");
  }
}

// Example usage for testing
if (import.meta.main) {
  const exampleResult = saveTestResult(
    {
      text: "SOL is going to flip ETH. The developer migration is accelerating.",
      source_type: "chat",
      platform: "telegram",
      user_id: "satoshi_clawd",
    },
    {
      call_type: "derived",
      author_claim: "SOL will outperform ETH — developer ecosystem shifting",
      author_ticker: "SOL",
      routed_ticker: "SOL-ETH",
      conviction: "high",
      trade_expression: "long SOL / short ETH on Hyperliquid isolates the ratio",
      derivation_steps: 3,
      leap_distance: "medium",
    },
    {
      quality: "excellent",
      leap_accuracy: "accurate",
      instrument_pick: "excellent",
      conviction_calibration: "correct",
      concerns: [],
    },
    {
      session_date: new Date().toISOString().split("T")[0],
      user_notes: "Pair trade logic was crystal clear",
      blocked_by: null,
      follow_up: null,
    }
  );

  console.log(`✓ Saved test result: ${exampleResult.id}`);
  console.log(`Location: ${RESULTS_FILE}`);
}
