# Belief Router Test Scores

## 2026-02-17 ~22:30 EST
- **Easy: 4/8 passing | avg 58/100**
- Medium/Hard: not run (Brave 429 blocking)
- **Blocker: Brave Search API rate limited (HTTP 429 on every request)**
- All retries exhausted (3 attempts with 2s/4s/6s backoff)
- Root cause: Heavy Brave API usage from JustCancel IndexNow submissions + belief router tests sharing same API key
- Fix applied: exponential backoff retry on 429s, increased request spacing to 1.5s
- Need: Wait for rate limit to reset, or get a higher-tier Brave API plan
- Passing tests (from cache/keyword matching): tweet-1, tweet-2, tweet-3, tweet-21
- Failing tests: scenario-5 (energy), tweet-4 (AI broad), tweet-5 (gold), tweet-39 (oil)
- Common failure: Zero total allocation (sizing can't run with 0 discovered instruments)
