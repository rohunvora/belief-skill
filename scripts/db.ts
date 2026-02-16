/**
 * Belief store — append-only JSONL fact log.
 * 
 * Each line is one fact: a routing, a conviction update, a close, or a note.
 * OpenClaw reads the file and computes everything derived (P&L, edge profile, portfolio).
 * 
 * File: data/beliefs.jsonl
 */

import { join } from "path";
import { mkdirSync, existsSync, appendFileSync, readFileSync } from "fs";

const DATA_DIR = join(import.meta.dir, "..", "data");
const LOG_PATH = join(DATA_DIR, "beliefs.jsonl");

mkdirSync(DATA_DIR, { recursive: true });

// ── Types ───────────────────────────────────────────────────────────

export interface RoutingFact {
  type: "route";
  id: string;
  t: string;              // ISO timestamp
  input: string;          // raw user input (verbatim)
  src?: string;           // source type: "text", "voice:1m13s", "tweet:@handle", "video"
  claim?: string;         // interpreted deeper claim (if different from input)
  shape?: string;         // binary | mispriced | sector | relative | vulnerability
  sector?: string;        // defense, crypto, macro, tech, culture, ...
  inst: string;           // instrument: "LAES", "DJT $5P Jan27", "KXFED-26JUL NO"
  px: number;             // price at time of routing
  dir: string;            // long | short
  plat: string;           // robinhood | kalshi | polymarket | hyperliquid | bankr
  qty?: number;           // position size in units
  lev?: number;           // leverage (1 for stocks, 5-20x for perps)
  β?: number;             // thesis beta
  conv?: number;          // convexity
  tc?: number;            // time cost (annualized)
  kills?: string;         // kill conditions (comma-separated)
  alt?: string;           // alternative instrument (one line)
  link?: string;          // deep link to platform
  action: string;         // paper | real | none
  conviction?: number;    // 0-100
}

export interface ConvictionFact {
  type: "conviction";
  id: string;             // references routing id
  t: string;
  from: number;
  to: number;
  reason: string;
}

export interface CloseFact {
  type: "close";
  id: string;             // references routing id
  t: string;
  px: number;             // exit price
  reason?: string;        // why closed: "target hit", "kill fired", "manual"
}

export interface NoteFact {
  type: "note";
  id: string;             // references routing id
  t: string;
  text: string;
}

export type Fact = RoutingFact | ConvictionFact | CloseFact | NoteFact;

// ── Write ───────────────────────────────────────────────────────────

export function append(fact: Fact): void {
  appendFileSync(LOG_PATH, JSON.stringify(fact) + "\n");
}

export function genId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function now(): string {
  return new Date().toISOString();
}

// ── Read ────────────────────────────────────────────────────────────

export function readAll(): Fact[] {
  if (!existsSync(LOG_PATH)) return [];
  return readFileSync(LOG_PATH, "utf-8")
    .split("\n")
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

export function getRoutes(): RoutingFact[] {
  return readAll().filter((f): f is RoutingFact => f.type === "route");
}

export function getOpenRoutes(): RoutingFact[] {
  const facts = readAll();
  const closed = new Set(
    facts.filter((f): f is CloseFact => f.type === "close").map(f => f.id)
  );
  return facts
    .filter((f): f is RoutingFact => f.type === "route" && f.action !== "none")
    .filter(f => !closed.has(f.id));
}

export function getLatestConviction(id: string): number | undefined {
  const facts = readAll();
  const updates = facts
    .filter((f): f is ConvictionFact => f.type === "conviction" && f.id === id)
    .sort((a, b) => b.t.localeCompare(a.t));
  if (updates.length > 0) return updates[0].to;
  const route = facts.find((f): f is RoutingFact => f.type === "route" && f.id === id);
  return route?.conviction;
}

export function findSimilar(keywords: string[]): RoutingFact[] {
  const routes = getRoutes();
  const lower = keywords.map(k => k.toLowerCase());
  return routes.filter(r => {
    const text = `${r.input} ${r.claim || ""}`.toLowerCase();
    return lower.some(k => text.includes(k));
  });
}
