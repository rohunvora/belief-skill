/** Seed SQLite from existing mock data. Run: bun run board/seed.ts */

import { insertUser, insertCall, listCalls, listUsers } from "./db";
import { users, calls } from "./mock-data";

console.log("Seeding belief.board...\n");

// Seed users
console.log("Users:");
for (const user of users) {
  insertUser(user);
  console.log(`  ${user.id} — @${user.handle}`);
}

// Seed calls
console.log("\nCalls:");
for (const call of calls) {
  insertCall(call);
  console.log(`  ${call.id} — ${call.ticker} ${call.direction} — "${call.thesis.slice(0, 50)}..."`);
}

// Validation
const dbUsers = listUsers();
const dbCalls = listCalls({ limit: 100 });

console.log("\n── Validation ──");
console.log(`Users: expected ${users.length}, got ${dbUsers.length}`);
console.log(`Calls: expected ${calls.length}, got ${dbCalls.length}`);

// Sample: first, middle, last
if (dbCalls.length > 0) {
  const first = dbCalls[dbCalls.length - 1]!;
  const mid = dbCalls[Math.floor(dbCalls.length / 2)]!;
  const last = dbCalls[0]!;
  console.log(`\nSample records:`);
  console.log(`  First:  ${first.id} ${first.ticker} $${first.entry_price} (${first.created_at})`);
  console.log(`  Middle: ${mid.id} ${mid.ticker} $${mid.entry_price} (${mid.created_at})`);
  console.log(`  Last:   ${last.id} ${last.ticker} $${last.entry_price} (${last.created_at})`);

  // Verify trade_data blob roundtrips
  const withDetail = dbCalls.find(c => c.reasoning);
  if (withDetail) {
    console.log(`\n  Blob check (${withDetail.id}):`);
    console.log(`    reasoning: ${withDetail.reasoning ? withDetail.reasoning.slice(0, 60) + "..." : "MISSING"}`);
    console.log(`    price_ladder: ${withDetail.price_ladder ? withDetail.price_ladder.length + " steps" : "MISSING"}`);
    console.log(`    derivation: ${withDetail.derivation ? "present" : "none"}`);
  }

  // Verify derivation chains
  console.log(`\nDerivation chains:`);
  let chainsOk = 0;
  let chainsMissing = 0;
  for (const c of dbCalls) {
    const d = c.derivation;
    let label = "none";
    if (d && typeof d === "object") {
      if ("segments" in d && "steps" in d) label = "segment-based (v2)";
      else if ("steps" in d) label = "steps (v1)";
      else if ("source_said" in d) label = "legacy structured";
      else label = "object (unknown)";
      chainsOk++;
    } else if (typeof d === "string") {
      label = "legacy string";
    } else if (c.source_handle && c.call_type !== "original") {
      chainsMissing++;
    }
    console.log(`  ${c.id} (${c.ticker}): ${label}`);
  }
  console.log(`  Structured: ${chainsOk}/${dbCalls.length}, Missing on sourced calls: ${chainsMissing}`);

  // Verify two-layer fields roundtrip
  console.log(`\nTwo-layer model fields:`);
  for (const c of dbCalls) {
    const sd = c.source_date ?? "none";
    const cv = c.conviction ?? "none";
    const at = c.author_thesis ? c.author_thesis.slice(0, 50) + "..." : "none";
    const ak = c.author_ticker ?? "null";
    const seg = c.segments ? `${c.segments.length} segments` : "none";
    console.log(`  ${c.id}: date=${sd} conv=${cv} author_ticker=${ak} ${seg}`);
    console.log(`    author_thesis: ${at}`);
  }
}

const ok = dbUsers.length === users.length && dbCalls.length === calls.length;
console.log(`\n${ok ? "VALIDATION PASSED ✓" : "VALIDATION FAILED ✗"}`);
