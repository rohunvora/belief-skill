# Golden Test: "how do i long nettspend?"

**Session ID:** d3fa6148-6412-4f7b-8dbf-a6917ecd418b
**Date:** 2026-02-16
**Verdict:** PASS — correct routing for non-investable cultural thesis

## Input
```
/belief-router how do i long nettspend?
```
Follow-up: User selected "Cultural momentum" angle.

## What Claude Did (trace)

1. **AskUserQuestion** — clarified angle: cultural momentum vs genre wave vs streaming platforms
2. **Bash** — `track.ts check nettspend music streaming pluggnb` → no prior beliefs
3. **WebSearch** — "Nettspend rapper 2025 2026 label deal streaming numbers career"
4. **WebSearch** — "Nettspend pluggnb artist record deal Interscope Columbia 2025"
5. **WebSearch** — "Nettspend monthly listeners growth 2025 2026 Spotify TikTok viral numbers"
6. **WebSearch** — "Universal Music Group UMG stock price 2026 streaming revenue growth"
7. **WebSearch** — "Nettspend brand deals fashion Miu Miu Vans sponsorship merch revenue"
8. **WebSearch** — "Royal.io music royalty investing Nettspend artist royalty tokens"
9. **WebSearch** — "invest in music royalties platforms 2025 2026"
10. **Read** — references/instrument-reasoning.md
11. **Read** — references/output-format.md, references/tools.md
12. **WebSearch** — "Nettspend Early Life Crisis tour 2026 concert tickets"
13. **Bash** — kalshi/instruments.ts "nettspend music streaming" → 0 instruments
14. **Bash** — bankr/instruments.ts → no results
15. **WebSearch** — "Nettspend concert tickets price face value 2026"
16. **Bash** — robinhood/instruments.ts "UMGNF,SPOT,VFC" → got UMG at $23.80

## Output (final recommendation)
```
NETTSPEND · CONCERT TICKETS + MERCH · LONG

4-8 GA tickets @ ~$50 avg · risk $400
Limited vinyl/merch x 3-5 items · risk $200

Album flops      [-$0]      attend shows, keep merch
Modest hit       [+$200]    2x on select resale
Breakout         [+$1-2K]   3-5x tickets, 5x merch
Mainstream       [+$3-5K]   sold-out premium + collector value

+EV if album pushes him past 3M monthly listeners
Dies if: album delays, label drops support, genre stays niche
Alt: UMGNF $23.80 long (music industry proxy, not Nettspend-specific)
```

## Why This Is Correct
- Recognized Nettspend as a person/artist, not a ticker symbol
- Did 8 web searches to build real context (label, streaming stats, brand deals)
- Tried all adapter paths: Kalshi (0), Bankr (0), Robinhood (UMG tangential)
- Correctly concluded no traditional instrument has good thesis alignment
- Routed to non-financial expression (Level 4: instrument IS the thesis)
- Included kill conditions and tangential alternative (UMGNF)
- Scenario table with realistic payoffs

## What Would Be Wrong
- Picking a random stock that matches "nettspend" keyword
- Forcing a UMG stock trade when thesis alignment is tangential
- Not researching who Nettspend actually is
- Skipping the follow-up question about which angle
