# Angel / Private Market Adapter

> Searches crowdfunding platforms and startup databases for private market expressions of a thesis.
> No API keys required for basic search. Results are directional — user does their own DD.

## How This Adapter Works

1. Searches Republic, Wefunder, and Crunchbase for active/recent raises matching thesis keywords
2. Returns company name, stage, raise size, category, and platform link
3. Estimates thesis beta and convexity range based on stage and category fit

All output is informational. The user performs their own due diligence and invests directly on each platform.

---

## When This Adapter Fires

Not on every thesis. Only when Step 2.5 triggers:
- Public market winner has thesis beta <50%
- Thesis targets an emerging trend with no public pure-play
- The search actually returns relevant results

## Instrument Types

### Equity Crowdfunding (Republic, Wefunder)
- **What:** Early-stage equity in startups via Reg CF / Reg A+
- **Check size:** $100 – $125K (Reg CF cap per investor per year)
- **Lockup:** Typically 5-7 years (no liquidity until exit/IPO)
- **Convexity:** 0x (failure) to 10-100x (seed → unicorn)
- **Risk:** Binary — most startups fail. Diversify across 10+ checks.

### Pre-IPO / Secondaries
- **What:** Shares in late-stage private companies via secondary markets
- **Platforms:** Forge Global, EquityZen, Hiive, private SPVs
- **Check size:** $10K – $250K (varies by platform/SPV)
- **Lockup:** 1-4 years (until IPO or acquisition)
- **Convexity:** 1.5-5x typical for late-stage
- **Risk:** Valuation risk, dilution, IPO window uncertainty

### AngelList Syndicates
- **What:** Pooled angel investments led by experienced investors
- **Check size:** $1K – $50K per syndicate
- **Lockup:** 5-10 years
- **Convexity:** 0x to 50x+
- **Risk:** Syndicate lead quality matters as much as the company

---

## Data Sources

- **Republic API:** `https://republic.com/api/` — active raises, categories, amounts
- **Wefunder:** `https://wefunder.com/explore` — scrape active raises by category
- **Crunchbase:** `https://www.crunchbase.com/discover/` — funding rounds, categories
- **No API keys required** for basic search/scrape

---

## Return Estimation

No live pricing exists for private companies. Estimate based on stage comps:

| Stage | Typical valuation | Convexity to $1B exit | Failure rate |
|-------|------------------|----------------------|-------------|
| Pre-seed | $2-5M | 200-500x | ~90% |
| Seed | $5-15M | 65-200x | ~80% |
| Series A | $15-50M | 20-65x | ~65% |
| Series B | $50-200M | 5-20x | ~45% |
| Late/Pre-IPO | $500M-5B | 1.5-5x | ~20% |

Expected value = convexity × (1 - failure rate). Seed: ~200x × 20% = 40x EV. But high variance — requires portfolio approach (10+ investments).

---

## Output Format

```json
{
  "platform": "angel",
  "instruments": [
    {
      "name": "Company or category",
      "stage": "Seed",
      "platform": "Republic",
      "url": "https://republic.com/...",
      "raise_size": "$2M",
      "valuation": "$10M",
      "thesis_beta": 0.85,
      "convexity_range": "10-50x",
      "lockup_years": "5-7",
      "relevance": "direct"
    }
  ]
}
```

## Limitations

1. **No live pricing** — valuations are point-in-time from last raise
2. **Illiquid** — cannot exit until company event (IPO, acquisition, secondary)
3. **High failure rate** — most startups fail. This is a portfolio strategy, not a single bet.
4. **Platform access** — some deals require accredited investor status ($200K income or $1M net worth)
5. **Data freshness** — raises open and close; results may be stale
