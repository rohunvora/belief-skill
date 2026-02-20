# Output Quality Insight: Dimensions Before Names

**Date:** Feb 17, 2026
**Context:** During belief.board frontend card design session. Agent proposed 7 named screenshot card types. Frank corrected: "arbitrary and too low on level of abstraction."

---

## What the Agent Did Wrong

The agent jumped straight to naming concrete card variants:
- "Hero Card", "Scorecard", "Debate Card", "Thesis Card", etc.
- 7 named types, each with specific visual layouts
- This is **instance-level thinking** -- enumerating specific outputs before understanding the design space

The problem: named instances are arbitrary. Why 7 and not 5 or 12? Why these names and not others? There's no principled reason to pick "Hero Card" over "Spotlight Card." The naming creates an illusion of structure where none exists. It's a taxonomy of accidents.

## What Frank's Correction Was

Frank pushed the agent to think at a higher level of abstraction: instead of naming card variants, identify the **independent dimensions** that generate them.

The agent then produced a dimensional framework:
- **Temporal position** (pre-resolution vs post-resolution vs at-resolution)
- **Cardinality** (single take vs multiple takes vs aggregate/meta)
- **Hero subject** (the claim itself vs the caller/person vs the market/price)

This is fundamentally better because:
1. It's **generative** -- the combinatorial space of dimensions produces card types, rather than hand-picking them
2. It's **complete** -- you can verify coverage by checking the cross-product
3. It's **principled** -- adding a new card means identifying a new dimensional combination, not inventing a name
4. It's **non-arbitrary** -- each dimension corresponds to a real axis of variation in the domain

Frank rated it: "this is better than 90% of stuff you create."

## The General Principle

**When designing a taxonomy, system of types, or set of variants: identify the independent dimensions first, then let the combinations generate the instances. Never start by naming instances.**

This is the difference between:
- **Bottom-up enumeration** (list things, then try to find patterns) -- fragile, incomplete, arbitrary
- **Top-down decomposition** (identify axes of variation, then generate instances from combinations) -- principled, complete, extensible

The principle applies broadly:
- **UI variants**: Don't name 7 card types. Identify the 3 dimensions (temporal, cardinality, hero) and derive them.
- **API endpoints**: Don't list 15 routes. Identify the resources and operations, and derive the routes.
- **Output formats**: Don't write 4 templates. Identify what varies (instrument type, resolution state, audience) and adapt a single skeleton.
- **Error types**: Don't enumerate 20 error names. Identify the dimensions (severity, origin, recoverability) and compose them.

The SKILL.md codebase already has an example of this principle done right: the **instrument-type adaptation table** (Session 4, Decision #18). Instead of writing 4 branching templates for equity/Kalshi/perp/options, the skill defines 5 variable sections and adapts them per type. One skeleton, dimensional variation. ~12 lines replaced ~200 lines of branching templates.

## How This Could Become a System-Level Rule

### Draft Rule for CLAUDE.md

```
## Dimensions Before Names (Design Quality)

When creating any taxonomy, type system, or set of variants:

**WRONG:** Start by naming instances ("Hero Card", "Scorecard", "Debate Card"...)
- Produces arbitrary lists with no principled completeness
- Names create an illusion of structure

**RIGHT:** Identify the independent dimensions of variation first, then derive instances from combinations.
- Ask: "What are the independent axes along which these things vary?"
- The cross-product of dimensions generates the instance space
- Each named instance should map to a specific dimensional coordinate

**Test:** If you can't explain WHY there are exactly N variants (not N-1 or N+1), you're enumerating instances, not decomposing dimensions.

**Example:**
BAD:  "There are 7 card types: Hero, Scorecard, Debate, Thesis, Comparison, Trending, Archive"
GOOD: "Cards vary on 3 dimensions: temporal position (pre/post/at resolution),
       cardinality (single/multiple/aggregate), hero subject (claim/caller/market).
       The combinations that matter for v1 are: [specific coordinates]."
```

### Why This Works as a Rule

1. It's **testable** -- the test ("can you explain why exactly N?") is concrete
2. It's **general** -- applies to any design decision involving multiple variants
3. It's **already proven** in this codebase -- the adaptation table (Decision #18) is a successful application of the same principle
4. It matches the existing CLAUDE.md style -- WRONG/RIGHT format with example

### Where It Fits

This is a **Code Quality** rule (same section as "Comment code clearly"). It's about the quality of design output, not about process or deployment. Could sit right after rule #11.

---

## Open Questions

- Should this rule apply only to "design" outputs (taxonomies, type systems) or also to "analysis" outputs (breakdowns, comparisons)?
- Is there a risk of over-applying it? Some things genuinely are just lists (e.g., a list of 4 API adapters is not a dimensional decomposition problem).
- Should the rule include a threshold? ("When you have 4+ variants, decompose into dimensions first"?)
