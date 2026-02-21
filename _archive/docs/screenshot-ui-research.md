# Screenshot-Worthy UI Research

How to design belief.board so every screen is naturally worth screenshotting and posting on Twitter --- no special share cards, no export features, just an app that looks good in a compressed phone screenshot.

---

## Part 1: Platform-by-Platform Analysis

### Robinhood

**What people screenshot most:** Portfolio P&L (total gains/losses), individual stock detail pages, options positions with extreme gains or losses.

**Why it works as a screenshot:**
- The hero number (portfolio value or stock price) is enormous --- likely 32-40px equivalent on mobile. It reads clearly even in a compressed Twitter image.
- Color is semantic, not decorative: green = up, red = down. One glance tells the story. The entire screen's mood shifts (green background tint vs. red).
- The chart takes up ~40% of the screen but carries zero text --- it's pure shape recognition. Even at thumbnail size you can see "up and to the right" or "cliff dive."
- Below the hero number: percent change, dollar change, time period. That's 4 distinct data points visible above the fold without scrolling.
- Card-based modular layout means each block is self-contained with clear boundaries.

**Propositional density:** ~6 data points visible in a single screenshot (price, change %, change $, chart shape, ticker symbol, time period). High density, zero clutter.

**Key design pattern:** The screenshot tells a complete story --- what you own, how it's doing, and how much you made/lost --- without needing any surrounding context.

---

### Hyperliquid

**What people screenshot most:** Open perpetual positions with PnL, the leaderboard, and liquidation events.

**Why it works as a screenshot:**
- Three-column desktop layout (market overview, chart+order, positions). On mobile it stacks: chart on top, order controls mid, positions at bottom.
- Position cards show: asset, direction (long/short), entry price, mark price, PnL ($), PnL (%), size, leverage, liquidation price. That's 8+ data points per position row.
- Green/red coloring on PnL figures. The number itself is the visual.
- The leaderboard is a ranked table: wallet address (often a known alias), total PnL, win rate. Simple rows with high information density.
- CoinGlass and similar trackers allow wallet owners to claim addresses and link their X/Twitter account, making the data inherently attributable.

**Propositional density:** ~8-10 data points per position. A single screenshot of an open position tells you: what the trade is, which direction, how leveraged, how much P&L, and how close to liquidation.

**Key design pattern:** Every row is a self-contained narrative --- "50x long ETH from $1,800, up $240K, liq at $1,650." The numbers ARE the content.

---

### Twitter/X

**What people screenshot most:** Individual tweets --- especially quote tweets, ratio'd tweets, controversial takes, and threads.

**Why it works as a screenshot:**
- Chirp typeface was designed specifically for small-screen readability. Regular weight (400) for body text, medium/bold for usernames and emphasis.
- A tweet is a naturally bounded unit: avatar, name, handle, timestamp, text, engagement counts. It's a card with 6+ distinct elements.
- Visual diversity comes from content, not chrome. Two screenshots of the same app look completely different because the text/images are different.
- The engagement bar (replies, retweets, likes, views) adds quantitative context without taking much space.
- Dark mode is the dominant screenshot mode in crypto/finance Twitter --- white text on dark background compresses better as PNG and is more legible at small sizes.

**Propositional density:** ~7 data points per tweet screenshot (author, handle, text, timestamp, replies, retweets, likes). The text itself adds unbounded density.

**Key design pattern:** The UI is a transparent frame for the content. Chrome is minimal; content is maximum.

---

### Discord

**What people screenshot most:** Conversations (DMs and group chats), particularly dramatic exchanges, announcements, and alpha calls.

**Why it works as a screenshot:**
- Message bubbles have clear visual separation: username (colored by role), timestamp, and message text.
- Dark background is the default, making screenshots immediately recognizable as "Discord."
- Threaded context --- you see who said what and when --- makes the screenshot self-explanatory.
- Role colors (admin=red, mod=blue, etc.) add visual hierarchy without labels.

**Propositional density:** ~4-5 data points per message (author, role color, timestamp, message, reactions). Density scales with the number of messages visible.

**Key design pattern:** Identity and attribution are baked into every line. You always know WHO said WHAT and WHEN.

---

### Sports Betting (DraftKings/FanDuel)

**What people screenshot most:** Bet slips (especially parlays), win confirmations, and "almost hit" parlays where one leg missed.

**Why it works as a screenshot:**
- A bet slip is a structured list: each leg shows team/player, bet type, odds. At the bottom: total odds, stake, potential payout.
- The potential payout is the hero number --- it's the largest text element on the slip, often displayed prominently.
- Green checkmarks for won legs, red X for lost legs. Visual progress through the parlay is immediately legible.
- The narrative emerges from the structure: "I bet $10 on a 7-leg parlay at +45000 and won $4,500" is readable in a thumbnail.
- AI tools exist specifically to beautify bet slip screenshots for social sharing --- indicating raw screenshots are already viral but people want them even cleaner.

**Propositional density:** ~3-4 data points per leg (team, line, odds, result), plus 3-4 for the slip total (stake, total odds, payout, status). A 5-leg parlay screenshot has ~20 data points.

**Key design pattern:** The bet slip is a checklist with a punchline (the payout). The structure creates dramatic tension --- each leg is a binary pass/fail leading to the resolution.

---

### Strava

**What people screenshot most:** Activity summaries (distance, pace, time, elevation), route maps, Year in Sport annual summaries, and segment achievements.

**Why it works as a screenshot:**
- Activity summary uses Inter for stats --- clean, legible, optimized for numeric data display.
- Boathouse (custom font) for branding/headlines creates distinct personality.
- The map is a unique fingerprint --- every run produces a different route shape, making each screenshot visually unique even with the same data structure.
- Core stats are prominent: distance, time, pace, elevation. These 4 numbers are the hero elements.
- Year in Sport uses Instagram Stories-style segments (9 segments with progress indicators) designed specifically for the Stories aspect ratio.

**Propositional density:** ~5-6 data points per activity screenshot (distance, duration, pace, elevation, map shape, date). Year in Sport is ~3-4 per card but many cards in a sequence.

**Key design pattern:** A unique visual element (the route map) ensures no two screenshots look identical, while the structured stats frame around it ensures consistent readability.

---

### Duolingo

**What people screenshot most:** Streak milestones (100, 365 days), leaderboard rankings (top 3), and quirky translation sentences.

**Why it works as a screenshot --- and why this is the most relevant case study:**

Duolingo explicitly tracked screenshot behavior as a metric. They identified three "desire paths" where users organically captured screens:
1. **Streak milestones** --- proof of discipline (humble-bragging)
2. **Unusual sentences** --- meme-worthy humor ("The horse drinks beer")
3. **Leaderboard wins** --- competitive status signaling

Their optimization approach:
- Designed full-screen, high-contrast animated celebrations for milestone moments.
- Matched aspect ratios to Twitter and Instagram standard image dimensions.
- Made the screen look "premium" so the user looks cool by association.
- Staffed dedicated illustrators and animators for these moments.
- Stopped adding share buttons and instead tracked when users took screenshots.

**Result: 5x to 10x increase in organic sharing.**

The core insight: external incentives (referral credits) feel transactional and are weak. Internal motivation (pride, humor, status) is what drives sharing. By making the UI beautiful at screenshot moments, Duolingo gave users a favor instead of asking for one.

**Propositional density:** Low per screen (~2-3 data points: streak count, language, milestone badge) but the visual impact is extremely high. The flame icon + large number is instantly legible.

**Key design pattern:** Design for the user's ego. The screenshot should make the SHARER look good, not the app.

---

## Part 2: Cross-Platform Synthesis

### What all screenshot-worthy UIs share

1. **A hero number.** Every screenshotted screen has one dominant numeric element: portfolio value, streak count, position PnL, bet payout, run distance. This number is large enough to read in a Twitter thumbnail.

2. **Semantic color.** Green/red (financial), flame orange (Duolingo), role colors (Discord). Color carries meaning, not decoration. You understand the emotional valence of the screenshot from color alone.

3. **Self-contained narrative.** The screenshot tells a complete story without surrounding context. You don't need to see the previous screen or the next screen. The single capture is the entire message.

4. **Attribution is built in.** Username, wallet address, ticker symbol, language flag --- the screenshot always answers "whose is this?" and "what is this about?" without labels.

5. **Visual uniqueness per instance.** Two Robinhood screenshots look different because different stocks are up/down. Two Strava screenshots look different because routes differ. Two Duolingo screenshots look different because streak numbers differ. The structure is consistent but the content varies.

6. **Dark mode dominance.** The majority of viral financial/crypto screenshots use dark mode. White text on dark background compresses better, looks more "serious," and stands out in Twitter's feed.

7. **Minimal chrome, maximum data.** Navigation bars, tab bars, and system UI are tolerated but not celebrated. The screenshotted area is almost entirely content.

---

## Part 3: Actionable Principles for belief.board

### Typography Rules

| Element | Minimum Size | Notes |
|---------|-------------|-------|
| Hero number (P&L, score, conviction %) | 28px+ | Must be legible in a 600px-wide Twitter image |
| Secondary stats (win rate, # calls, streak) | 18px+ | Readable at 50% zoom |
| Body text (thesis text, claim description) | 15-16px | Standard mobile body, acceptable if cropped |
| Labels and metadata (timestamps, tags) | 12-13px | Okay if slightly blurry in screenshot --- context clues carry |
| Username / handle | 16px bold | Must always be identifiable |

**Font choice:** Use a system font stack or Inter. Avoid decorative fonts. Numeric data should use tabular figures (monospaced numbers) so columns align cleanly.

### Color Rules

- **Green (#22c55e or similar):** Correct calls, positive P&L, validated theses
- **Red (#ef4444 or similar):** Wrong calls, negative P&L, invalidated theses
- **Amber/Orange (#f59e0b):** Pending, in-progress, unresolved
- **White/Light gray on dark background** as the default mode
- Never use color alone for meaning --- pair with icons or directional indicators (+/-)

### Layout Rules

1. **Every screen must have a hero element.** The thing your eye goes to first. On Feed: the call card. On Profile: the user's score/record. On Leaderboard: rank + name + score. On Detail: the claim + current status.

2. **4-6 data points above the fold.** This is the "propositional density floor." A single screenshot should contain at least 4 distinct, meaningful pieces of information. Examples for a call card:
   - Claim text ("BTC > $100K by March")
   - Conviction level (85%)
   - Current status (pending / correct / wrong)
   - Author + their track record (user, 73% hit rate)
   - Time remaining or resolution date
   - Market context (current BTC price)

3. **Self-contained cards.** Every card in the feed must be a complete unit. No card should require you to tap into it to understand the gist. The feed IS the screenshot surface.

4. **No orphan screens.** Every page state should be screenshot-worthy. Not just "good calls" --- even an empty state or a loss should have enough visual structure to be interesting.

### Information Architecture Rules

5. **Attribution on every element.** Every call card shows: who made it, when, what their track record is. This is non-negotiable. Screenshotted calls without attribution are useless; with attribution they're social proof.

6. **Temporal context always visible.** "3 days left" or "resolved Jan 15" or "called Dec 1 at $42K." Time makes claims verifiable and interesting.

7. **Quantify everything.** Don't say "bullish" --- say "85% conviction." Don't say "good track record" --- say "14/19 correct (73.7%)." Numbers are what make the screenshot information-dense rather than just opinion-dense.

### Visual Diversity Rules

8. **Each card must look different from its neighbors.** Vary by: claim topic (crypto, politics, sports), status (green/red/amber), conviction level (high/med/low visual treatment), time horizon. If the feed is a wall of identical-looking cards, screenshots are boring.

9. **Status should be the most visually dominant differentiator.** A resolved-correct card should look fundamentally different from a pending card. Not just a small badge --- the entire card's visual mood should shift (background tint, border color, or icon treatment).

10. **Profile pages need a signature stat.** One number that defines this user. Brier score, hit rate, longest streak, total calls --- pick the most impressive and make it the hero. This is what people screenshot when they share their own profile.

### Screenshot-Specific Design Rules

11. **Design for 600px wide.** Twitter displays images at roughly 600px wide on mobile feeds. Your UI at standard phone width (~390px) will be displayed at this resolution. Text below ~12px actual will be illegible.

12. **Dark mode is the default.** Financial/crypto audiences overwhelmingly prefer dark mode. Dark screenshots also look better in Twitter's feed (less jarring contrast with the dark Twitter UI). Design dark-first.

13. **Avoid thin lines and light grays.** These disappear in JPEG/PNG compression. Use solid fills, distinct borders (2px+), and high contrast ratios (minimum 4.5:1, prefer 7:1 for important text).

14. **No modals, toasts, or overlays in steady state.** The "resting" state of every screen should be the screenshotted state. Transient UI elements pollute screenshots.

15. **Brand identity in every screenshot.** The app name or logo should be subtly present (header bar, watermark in corner) so screenshots are traceable. Not a huge logo --- just enough that people know it's belief.board.

### The Duolingo Principle

16. **Track what gets screenshotted.** After launch, instrument screenshot detection (iOS and Android both support this). Find the desire paths. Then make those moments MORE beautiful without adding share buttons.

17. **Design for the sharer's ego, not the app's marketing.** The user shares a screenshot because it makes THEM look smart/prescient/disciplined. The call card that says "Called BTC $100K on Dec 1 at 90% conviction --- CORRECT" makes the sharer look like a genius. That's the viral loop.

---

## Part 4: Specific Screen Recommendations

### Feed
- Cards should be ~120-160px tall (not tiny rows, not full-screen takeovers)
- Each card: claim text (bold, 16px+), author + avatar, conviction badge, status indicator, time context
- Alternate card visual treatments to prevent "wall of sameness"
- Show 2-3 complete cards per phone screen to give screenshot density

### Call Detail Page
- Hero: the claim text, large (20px+)
- Below: status (resolved/pending), conviction %, author + record
- If resolved: outcome + actual result vs. prediction
- If pending: countdown or progress indicator, current market state
- Evidence/reasoning section below fold (okay if cropped in screenshot --- the above-fold tells the story)

### Profile Page
- Hero: username + signature stat (hit rate or Brier score)
- Stats row: total calls, correct, wrong, pending, average conviction
- Recent calls list (mini cards)
- This should look like a "player card" --- the kind of thing someone screenshots to flex their record

### Leaderboard
- Ranked rows: rank #, avatar, username, signature stat, recent trend
- Top 3 get visual emphasis (larger, different background, podium treatment)
- Current user's position always visible (even if off-podium, pin to bottom)
- Dense enough that ~8-10 rows are visible in one screenshot

---

## Sources

- [Duolingo Screenshot Tracking Strategy](https://startupspells.com/p/duolingo-screenshot-tracking-viral-strategy)
- [Robinhood UI Balancing Simplicity and Strategy](https://worldbusinessoutlook.com/how-the-robinhood-ui-balances-simplicity-and-strategy-on-mobile/)
- [UI Density by Matt Strom](https://mattstromawn.com/writing/ui-density/)
- [Robinhood App with Material Design](https://design.google/library/robinhood-investing-material)
- [Strava Fonts and Typography](https://sensatype.com/what-font-does-strava-use-in-2026)
- [Chirp: Twitter/X Typography](https://fontsarena.com/blog/what-font-does-twitter-use/)
- [Duolingo Streak System Design](https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f)
- [DraftKings Bet Slip Overview](https://bettinghero.com/help/draftkings/betting/overview-of-the-bet-slip-on-draftkings/)
- [Hyperliquid Trading Interface](https://blockworks.co/news/hyperliquid-the-frontend-wars)
- [Twitter Image Size Guide](https://soona.co/image-resizer/twitter-spec-guide)
