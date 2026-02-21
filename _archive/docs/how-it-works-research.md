# How It Works — Research Notes

## 1. Moltbook Analysis

### What moltbook.com does

Moltbook is "a social network for AI agents." Their landing page doubles as a live product — the homepage IS the feed (agents, posts, communities). The explanation is embedded in the product itself rather than separated into a marketing page.

### Page structure

1. **Hero** — one-line tagline ("A Social Network for AI Agents")
2. **Onboarding instructions** — numbered steps telling agents how to join (their version of "How It Works")
3. **Email capture** — early access CTA
4. **Live stats dashboard** — agent count, posts, comments (social proof, even when zero)
5. **Content feed** — recent agents, posts, pairings, communities (the product IS the explanation)
6. **Footer** — newsletter, legal

### Design patterns

- Dark theme, monospace font, cyan accents, animated glow effects
- Card-based modular layout with generous whitespace
- Stats displayed prominently as social proof
- Numbered steps for the onboarding/explanation flow
- Multiple CTAs interspersed (not just at the end)

### What to steal

- **Product IS the explanation**: Rather than a separate "How It Works" static page, the best explanation is showing the live product with annotations. Moltbook's feed IS the landing page. For belief.board: showing real calls with labels ("this is the thesis," "this is the P&L") teaches faster than abstract steps.
- **Numbered steps with a single sentence each**: Their agent onboarding is dead simple — 3 steps, one sentence each. The "How It Works" should be equally compressed.
- **Live stats as proof**: Even showing "6 active calls" or "3 callers tracked" is more convincing than lorem ipsum explanations.
- **The product surface doubles as the tutorial**: Don't build a separate marketing page — annotate the real product.

### What to avoid

- **Dark theme / glow effects / monospace**: Explicitly contradicts belief.board's design principles (light mode, no gradients/shadows, system font).
- **Empty social proof**: Moltbook shows "0 agents, 0 posts" which undermines credibility. Better to show a curated set of real examples.
- **Vague tagline without substance**: "A Social Network for AI Agents" tells you the category but not the value. belief.board needs to lead with the value proposition, not the category.
- **Over-CTA'd**: Multiple newsletter signups and conversion CTAs feel desperate. One clear CTA is enough.

---

## 2. The belief.board Story in 4 Steps

The core loop, distilled:

### Step 1: Someone makes a call

A trader, podcaster, or CT personality states a directional thesis with investment implications. "On-prem is back — DELL is going to rip." This happens on Twitter, YouTube, podcasts — it's already happening everywhere.

*Visual: a tweet or podcast screenshot with the claim highlighted*

### Step 2: belief.board structures it

The raw take gets routed into a structured call: ticker (DELL), direction (long), entry price ($117), thesis, kill conditions. Source link and timestamp are always preserved. The claim is the hero — not the ticker, not the P&L.

*Visual: a CallCard component showing the structured call — thesis in bold, ticker/direction/price below, "Dies if:" condition, attribution (@chamath via @satoshi)*

### Step 3: Live tracking shows who's right

Every call gets tracked against real prices. The P&L updates live — green when winning, red when losing. No hiding. No deleting old takes. The market is the judge.

*Visual: the same CallCard but now showing a live +19.2% in green (or -8.1% in red), with the price ladder showing milestones*

### Step 4: Track records reveal who's actually good

Over time, resolved calls build a permanent track record. The leaderboard surfaces callers by accuracy, not followers. 12 calls at 75% accuracy ranks above 500 calls at 30%. Outcomes are the algorithm.

*Visual: leaderboard showing ranked users with hit rates and total calls*

---

## 3. Recommended Visual Approach

### Constraints (from HANDOFF.md section 9)

- Always light mode
- No gradients, no shadows — clean typography only
- Mobile-first
- Content-dense (information, not decoration)
- Screenshot-worthy (the page itself should be shareable)

### Format recommendation: Annotated product walkthrough

Instead of abstract icons or illustrations, use **real product screenshots (or live components) with minimal annotation**. This is the Stripe/Linear playbook — the product IS the marketing.

Each step should be:

1. **One-line heading** (what happens at this step)
2. **One sentence of context** (why it matters)
3. **A real product component** (not a mockup — the actual CallCard, Feed, or Leaderboard rendered inline)

### Layout

- Single column, scrolling vertically
- Each step takes roughly one mobile viewport (no horizontal scrolling, no carousels)
- Step number + heading at top, product visual below, brief context text between
- No decorative elements — the data IS the visual
- Light gray (#f9fafb) background with white cards, matching the existing app aesthetic

### Typography

- Step headings: 24-28px, font-weight 700, gray-900
- Context text: 16px, font-weight 400, gray-500
- Annotations on visuals: 12px, font-weight 500, colored labels pointing to specific parts of the card

---

## 4. Specific Content Suggestions Per Step

### Step 1: "Someone makes a call"

**Heading**: Someone makes a call

**Context**: Every day, traders and analysts share directional takes on Twitter, YouTube, and podcasts. Most of these takes disappear into the timeline. belief.board captures them.

**Visual**: A mock "source" — could be a stylized quote block showing Chamath's actual source quote ("On-prem is back...") with the podcast name and date. This establishes the input.

**Annotation**: Arrow or label: "The raw take"

---

### Step 2: "We structure it"

**Heading**: Structured into a trade thesis

**Context**: Every call gets a ticker, direction, entry price, and kill condition. The source link and timestamp are always preserved — anyone can verify.

**Visual**: The actual CallCard component rendered with the DELL long call. Annotations pointing to:
- Thesis (the claim, bold, top of card)
- Ticker + direction + entry price (the trade expression)
- "Dies if:" line (what would prove the thesis wrong)
- Attribution line (@chamath via @satoshi)

**Annotation labels**: "The claim", "The trade", "Kill condition", "Who said it"

---

### Step 3: "Tracked against reality"

**Heading**: Tracked with live prices

**Context**: P&L updates in real-time. Green when winning, red when losing. No editing. No deleting. The market decides.

**Visual**: The same DELL CallCard but now with the P&L number prominently shown (+19.2% or whatever the current live number is). Could show two cards side by side — one green, one red — to illustrate both outcomes.

**Annotation**: Arrow to the P&L number: "Live P&L — updated every 30 seconds"

---

### Step 4: "Track records emerge"

**Heading**: Accuracy over followers

**Context**: Resolved calls build a permanent track record. The leaderboard ranks by hit rate, not follower count. Over time, the best callers surface.

**Visual**: The leaderboard component showing 3-5 ranked users. Or a profile page showing someone's call history with win/loss badges.

**Annotation**: "Ranked by accuracy, not clout"

---

## 5. Implementation Notes

### What NOT to build

- No animated transitions or scroll-triggered effects
- No hero section with a giant tagline and gradient background
- No abstract icons or illustrations
- No "Sign up now" CTAs until after the explanation
- No separate marketing site — this should be a route within the existing app (e.g., `/#/how-it-works` or the landing state before login)

### What TO build

- A single scrolling page with 4 annotated sections
- Real (or realistic) data in each section — use the seed data (DELL, MSFT, IONQ calls)
- Minimal annotation overlays (CSS labels, not images)
- One CTA at the bottom: "Submit a call" or "Explore the feed"
- The page should itself be screenshot-worthy — if someone screenshots any section, it should make sense and look clean

### Density target

- Each step: ~100-150px heading/text + ~300-400px product visual = ~450-550px per step
- Total page: roughly 4 mobile viewports of content
- No padding bloat — content should feel tight and information-rich, like a Bloomberg terminal, not a Webflow marketing page
