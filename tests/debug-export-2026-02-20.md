# Belief Router Test Session Debug Export
Session: test-20260219-163845
Date: 2026-02-20

---

## Test Results (JSONL)

File: `tests/results/test-20260219-163845.jsonl`

### Take 1 — @chiefofautism (rated 3.5/5 in prior session)
- Input: https://x.com/chiefofautism/status/2024535712071028921
- Routed: COHR long $232.48
- Type: derived
- Board: (prior session, no board URL saved)

### Take 2 — @akshaybd (no rating, ref only)
- Input: https://x.com/akshaybd/status/2024867338424922455
- Routed: CEG long $294.50
- Type: derived
- Board: https://belief-board.fly.dev/t/626c2ba3-1

### Take 3 — @punter_punts (no rating, ref only)
- Input: https://x.com/punter_punts/status/2024928536214069366
- Routed: KXSOLMAXY-27JAN01-170 YES at $0.37
- Type: direct
- Board: https://belief-board.fly.dev/t/e86b973c-8
- Note: board returned localhost URL in response — may indicate BASE_URL misconfiguration on fly deployment

---

## Bug 1: X API Long Tweet Truncation

### What happened
Tweet https://x.com/punter_punts/status/2024928536214069366 is an X Premium long-form tweet (~700 chars).

The API v2 call:
```bash
curl "https://api.twitter.com/2/tweets/{id}?tweet.fields=text,created_at,author_id" \
  -H "Authorization: Bearer $X_BEARER_TOKEN"
```

Returned text ending at "• you can look at DXY, SPX, TLT for more" — exactly ~280 chars into the content.

The full tweet had 5 bullet points and the actual thesis. None of it was returned.

### Root cause
X Premium allows tweets up to 4,000 chars. Long tweets are stored in a separate `note_tweet` field, NOT in `text`. The `text` field contains only a truncated preview (~280 chars) for long tweets.

### Fix needed in `scripts/adapters/x/user-timeline.ts`
1. Add `note_tweet.fields=text` to the expansions/fields in the API request
2. When building each tweet object, check: if `note_tweet` exists on the tweet, use `note_tweet.text` as the full text instead of `text`
3. Alternatively: detect truncation heuristically (text doesn't end with punctuation / ends mid-thought) and re-fetch the individual tweet with note_tweet expansion

### API call that would have worked
```bash
curl "https://api.twitter.com/2/tweets/{id}?tweet.fields=text,created_at,author_id,note_tweet&expansions=author_id" \
  -H "Authorization: Bearer $X_BEARER_TOKEN"
```

For the user timeline endpoint:
```
GET /2/users/{id}/tweets?tweet.fields=text,created_at,note_tweet&expansions=author_id
```

---

## Bug 2: Board URL returns localhost in response

### What happened
POST to `https://belief-board.fly.dev/api/takes` returned:
```json
{"id":"e86b973c-8","url":"http://localhost:4000/t/e86b973c-8"}
```

The `url` field in the API response is using localhost instead of the production domain.

### Likely cause
`BASE_URL` or `PUBLIC_URL` env var on fly.dev deployment is not set, so the server defaults to `localhost:4000`.

### Fix
Set `BASE_URL=https://belief-board.fly.dev` in fly.toml `[env]` section or as a fly secret.

---

## Output Quality Notes (from today's routing)

### Take 2 (CEG / @akshaybd)
The routing worked but the tweet was a philosophical frame ("energy is the substrate for money/intelligence/national capacity") not a specific trade call. Skill derived CEG from first principles — that's the correct behavior. The derivation chain correctly showed the 4-step logic from tweet → CEG long.

**Potential improvement:** The tweet ended with "this is why" (cut off) — the adapter truncation bug (Bug 1 above) may have also affected this tweet. Worth checking if the akshaybd tweet was also truncated, since the routing was done on an incomplete input.

### Take 3 (Kalshi SOL / @punter_punts)
Had to use a screenshot to get the full tweet content. Once the full text was available, the routing was clean. The Kalshi $170 YES at 37c was the correct instrument choice over HL perp (pivot thesis needs timing forgiveness, not leverage).

**The board URL bug (Bug 2) affected this take** — the permalink generated is `http://localhost:4000/t/e86b973c-8` instead of the production URL.
