#!/usr/bin/env bun
/**
 * Angel / Private Market Adapter — returns.ts
 *
 * Estimates returns for private market investments based on stage comps.
 * No live pricing — uses historical venture return distributions.
 *
 * Usage: bun run scripts/adapters/angel/returns.ts "seed" "biotech"
 */

const stage = (process.argv[2] || "seed").toLowerCase();
const sector = (process.argv[3] || "general").toLowerCase();

interface StageProfile {
  label: string;
  typical_valuation: string;
  median_multiple: number;
  top_decile_multiple: number;
  failure_rate: number;
  lockup_years: string;
  expected_value: number;
}

const stages: Record<string, StageProfile> = {
  "pre-seed": {
    label: "Pre-Seed",
    typical_valuation: "$2-5M",
    median_multiple: 0, // most fail
    top_decile_multiple: 200,
    failure_rate: 0.9,
    lockup_years: "7-10",
    expected_value: 20,
  },
  seed: {
    label: "Seed",
    typical_valuation: "$5-15M",
    median_multiple: 0,
    top_decile_multiple: 100,
    failure_rate: 0.8,
    lockup_years: "5-8",
    expected_value: 20,
  },
  "series-a": {
    label: "Series A",
    typical_valuation: "$15-50M",
    median_multiple: 1.5,
    top_decile_multiple: 40,
    failure_rate: 0.65,
    lockup_years: "4-7",
    expected_value: 14,
  },
  "series-b": {
    label: "Series B",
    typical_valuation: "$50-200M",
    median_multiple: 2,
    top_decile_multiple: 15,
    failure_rate: 0.45,
    lockup_years: "3-5",
    expected_value: 8.25,
  },
  "late-stage": {
    label: "Late Stage / Pre-IPO",
    typical_valuation: "$500M-5B",
    median_multiple: 1.5,
    top_decile_multiple: 5,
    failure_rate: 0.2,
    lockup_years: "1-3",
    expected_value: 4,
  },
};

// Sector multipliers on base rates
const sectorMultipliers: Record<string, number> = {
  biotech: 1.3, // higher ceiling, higher failure
  ai: 1.4,
  fintech: 1.1,
  crypto: 1.5,
  saas: 1.0,
  consumer: 0.9,
  hardware: 0.8,
  general: 1.0,
};

const profile = stages[stage] || stages.seed;
const sectorMult = sectorMultipliers[sector] || 1.0;

const output = {
  platform: "angel",
  stage: profile.label,
  sector,
  typical_valuation: profile.typical_valuation,
  scenarios: {
    failure: {
      probability: `${(profile.failure_rate * 100).toFixed(0)}%`,
      return: "-100%",
      at_100k: "-$100,000",
    },
    median_survivor: {
      probability: `${((1 - profile.failure_rate) * 0.7 * 100).toFixed(0)}%`,
      return: `${profile.median_multiple}x`,
      at_100k: `$${(100000 * profile.median_multiple).toLocaleString()}`,
    },
    top_decile: {
      probability: `${((1 - profile.failure_rate) * 0.1 * 100).toFixed(0)}%`,
      return: `${(profile.top_decile_multiple * sectorMult).toFixed(0)}x`,
      at_100k: `$${(100000 * profile.top_decile_multiple * sectorMult).toLocaleString()}`,
    },
  },
  expected_value_multiple: `${(profile.expected_value * sectorMult).toFixed(1)}x`,
  lockup: profile.lockup_years,
  note: "Based on historical venture return distributions. Individual outcomes are binary — diversify across 10+ investments.",
};

console.log(JSON.stringify(output, null, 2));
