/**
 * X (Twitter) User Timeline Adapter
 *
 * Fetches original posts from a specific X user by handle.
 * Always excludes retweets and replies — original posts only.
 * Shows cost estimate before every fetch; never auto-paginates.
 *
 * Pricing (pay-per-use, effective Jan 21 2026):
 *   $0.005 per tweet read
 *   $0.010 per user profile lookup
 *   24hr deduplication: same resource fetched twice = charged once
 *
 * Requires: X_BEARER_TOKEN env var
 *
 * Usage:
 *   bun run scripts/adapters/x/user-timeline.ts --handle chamath
 *   bun run scripts/adapters/x/user-timeline.ts --handle chamath --max 20
 *   bun run scripts/adapters/x/user-timeline.ts --handle chamath --since-id 1234567890
 *   bun run scripts/adapters/x/user-timeline.ts --handle chamath --paginate  (fetch next page)
 */

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;

const COST_PER_TWEET = 0.005;   // $0.005 per tweet read
const COST_PER_LOOKUP = 0.010;  // $0.010 per user profile lookup
const DEFAULT_MAX = 50;         // Conservative default — $0.25 per call

// Cache file for resolved user IDs — avoids paying $0.01 on every run
const CACHE_PATH = `${process.env.HOME}/.cache/belief-router-x-users.json`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  url: string;
  likes: number;
  impressions: number;
}

export interface TimelineResult {
  handle: string;
  userId: string;
  tweets: Tweet[];
  nextToken?: string;       // Pass back via --pagination-token for next page
  oldestId?: string;
  newestId?: string;
  costEstimate: number;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function loadCache(): Record<string, string> {
  try {
    return JSON.parse(Bun.file(CACHE_PATH).toString());
  } catch {
    return {};
  }
}

async function saveCache(cache: Record<string, string>): Promise<void> {
  await Bun.write(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function apiHeaders() {
  return { Authorization: `Bearer ${BEARER_TOKEN}` };
}

/**
 * Resolve a Twitter handle to a numeric user ID.
 * Caches the result locally — ID never changes, costs $0.01 per call.
 */
export async function resolveHandle(handle: string): Promise<string> {
  const clean = handle.replace(/^@/, "").toLowerCase();

  // Check cache first
  const cache = loadCache();
  if (cache[clean]) {
    console.error(`[x] Using cached ID for @${clean}: ${cache[clean]}`);
    return cache[clean];
  }

  console.error(`[x] Resolving @${clean} → user ID ($${COST_PER_LOOKUP.toFixed(3)})...`);

  const url = `https://api.x.com/2/users/by/username/${clean}?user.fields=id,username,name,public_metrics`;
  const res = await fetch(url, { headers: apiHeaders() });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`User lookup failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { data?: { id: string; username: string } };
  if (!data.data?.id) {
    throw new Error(`@${clean} not found or account is private`);
  }

  // Cache the result
  cache[clean] = data.data.id;
  await saveCache(cache);
  console.error(`[x] Resolved @${clean} → ${data.data.id} (cached)`);

  return data.data.id;
}

/**
 * Fetch original posts from a user's timeline.
 * Never fetches retweets or replies — hardcoded, not configurable.
 */
export async function fetchTimeline(
  handle: string,
  options: {
    max?: number;
    sinceId?: string;
    paginationToken?: string;
    skipConfirm?: boolean;   // Set true in non-interactive contexts
  } = {}
): Promise<TimelineResult> {
  const max = Math.min(options.max ?? DEFAULT_MAX, 100);  // API cap is 100
  const costEstimate = COST_PER_LOOKUP + max * COST_PER_TWEET;

  // Show cost estimate and confirm before any spend
  if (!options.skipConfirm) {
    const breakdown = `${max} tweets × $${COST_PER_TWEET} + $${COST_PER_LOOKUP} lookup`;
    process.stdout.write(
      `\nFetching @${handle.replace(/^@/, "")}'s last ${max} original posts\n` +
      `Estimated cost: $${costEstimate.toFixed(3)} (${breakdown})\n` +
      `Proceed? [y/N] `
    );

    // Read a single line from stdin (synchronous, works in Bun)
    const buf = Buffer.alloc(4);
    const bytesRead = require("fs").readSync(0, buf, 0, 4, null);
    const answer = buf.subarray(0, bytesRead).toString().trim().toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  const userId = await resolveHandle(handle);

  // Build URL — exclude=retweets,replies is hardcoded, never removed
  const params = new URLSearchParams({
    max_results: String(max),
    exclude: "retweets,replies",                          // HARDCODED — do not remove
    "tweet.fields": "created_at,public_metrics,entities",
    expansions: "author_id",
    "user.fields": "username,name",
  });

  if (options.sinceId) params.set("since_id", options.sinceId);
  if (options.paginationToken) params.set("pagination_token", options.paginationToken);

  const url = `https://api.x.com/2/users/${userId}/tweets?${params}`;
  console.error(`[x] Fetching timeline...`);

  const res = await fetch(url, { headers: apiHeaders() });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Timeline fetch failed (${res.status}): ${body}`);
  }

  const data = await res.json() as {
    data?: Array<{
      id: string;
      text: string;
      created_at: string;
      author_id: string;
      public_metrics: { like_count: number; impression_count: number };
    }>;
    includes?: { users?: Array<{ id: string; username: string }> };
    meta?: { next_token?: string; newest_id?: string; oldest_id?: string; result_count?: number };
  };

  const username = data.includes?.users?.[0]?.username ?? handle.replace(/^@/, "");
  const tweets: Tweet[] = (data.data ?? []).map((t) => ({
    id: t.id,
    text: t.text,
    created_at: t.created_at,
    url: `https://x.com/${username}/status/${t.id}`,
    likes: t.public_metrics?.like_count ?? 0,
    impressions: t.public_metrics?.impression_count ?? 0,
  }));

  const result: TimelineResult = {
    handle: username,
    userId,
    tweets,
    nextToken: data.meta?.next_token,
    oldestId: data.meta?.oldest_id,
    newestId: data.meta?.newest_id,
    costEstimate,
  };

  console.error(
    `[x] Got ${tweets.length} tweets from @${username}` +
    (result.nextToken ? ` (more available — pass --paginate to fetch next page)` : " (no more pages)")
  );

  return result;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  // Check for X_BEARER_TOKEN before doing anything
  if (!BEARER_TOKEN) {
    console.error(`
X API not configured — X_BEARER_TOKEN is not set.

To enable handle scanning:
  1. Go to developer.x.com and create an app (pay-per-use, no monthly fee)
  2. Copy your Bearer Token
  3. Add to .env: X_BEARER_TOKEN=your_token

Cost: ~$0.26 to scan 50 original posts from any handle.

In the meantime, paste any tweet directly and the belief-router will route it.
`);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const handle = getArg("--handle");
  if (!handle) {
    console.error("Usage: bun run scripts/adapters/x/user-timeline.ts --handle <handle> [--max N] [--since-id ID] [--paginate TOKEN]");
    process.exit(1);
  }

  const max = getArg("--max") ? parseInt(getArg("--max")!, 10) : DEFAULT_MAX;
  const sinceId = getArg("--since-id");
  const paginationToken = getArg("--paginate");

  const result = await fetchTimeline(handle, { max, sinceId, paginationToken });

  // Print tweets as JSON for piping into other tools
  console.log(JSON.stringify(result, null, 2));

  if (result.nextToken) {
    console.error(`\nTo fetch the next page:\n  bun run scripts/adapters/x/user-timeline.ts --handle ${handle} --paginate ${result.nextToken}`);
  }
}
