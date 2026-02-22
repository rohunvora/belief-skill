# Handle Scan

When Input Validation step 5 triggers (input is an X handle, `x.com` URL, or "scan @handle"):

## 0. Check for X_BEARER_TOKEN

If `X_BEARER_TOKEN` is not set, offer two fallbacks and stop:

```
X API not configured. X_BEARER_TOKEN is not set.

To enable handle scanning:
  1. Go to developer.x.com and create an app (pay-per-use, no monthly fee)
  2. Copy your Bearer Token
  3. Add to .env: X_BEARER_TOKEN=your_token

Cost: ~$0.26 to scan 50 original posts from any handle.

In the meantime, two options:

Option A (Screenshot): Take a screenshot of the tweet (or paste the text).
I'll extract the author handle, text, and date from it and route it directly.

Option B (Browser): I can open x.com/{handle} in Chrome and read the posts
directly (no API cost). Say "open their profile in Chrome" to proceed.
```

If user chooses Option A: route the screenshot/text as normal. Extract `source_handle` from the author shown.
If user chooses Option B: use claude-in-chrome MCP tools to navigate to `https://x.com/{handle}`, read visible posts, filter for directional takes, proceed from step 4.

## 1. Cost Gate (mandatory, never skip)

Show before any API call:
```
Fetching @{handle}'s last 50 original posts
Estimated cost: $0.26 (50 × $0.005 + $0.01 lookup)
Proceed? [y/N / or type a number, e.g. "20"]
```
If user says a number, use that as `--max`. If no, abort.

## 2. Fetch

```bash
bun run scripts/adapters/x/user-timeline.ts --handle {handle} --max {N} --skip-confirm
```
(`--skip-confirm` bypasses the script's own stdin prompt. You already confirmed in chat.)

Returns JSON with `tweets[]`. Retweets and replies are excluded at the API level.

## 3. Filter for Directional Takes

Read each tweet. Keep only those with a directional claim (explicit or implied) about markets, companies, sectors, macro, or specific assets. Discard commentary, jokes, personal updates.

## 4. Surface to User

Lead with the directional claim, not the raw tweet. One line per take, source URL underneath.

```
Found {N} directional takes from @{handle} ({date range}):

1. {thesis direction in plain language} ({date})
   {tweet_url}
2. {thesis direction in plain language} ({date})
   {tweet_url}

Route all, or pick? [all / 1,3,5 / skip]
```

If user says "all" or said "scan @handle" upfront, route all. If they pick a subset, route only those.

## 5. Route Each Take

Run each selected tweet through the standard belief-router flow. On the Call layer, set:
- `source_quote`: tweet text verbatim
- `headline_quote`: if tweet is under 120 chars, use verbatim; otherwise apply Headline Quote Rules (see `references/output-format.md`)
- `source_handle`: @{handle}
- `source_url`: tweet URL from adapter output
- `source_date`: tweet's `created_at`

## 6. Post to Board

POST each routed call as normal. Board posts show `source_handle` and link back to original tweet.
