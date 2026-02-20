# Screenshot-Worthiness Audit: belief.board

**Date:** 2026-02-17
**Principle:** There are no special share cards. The actual app UI must be screenshot-worthy. A phone screenshot of any screen, compressed to tweet-image size (~50% native resolution), must be interesting and dense enough to share.

---

## 1. Feed (pages/Feed.tsx + components/CallCard.tsx)

### Phone screenshot test (iPhone viewport, ~390px wide)
Roughly 2-3 CallCards visible in one screen. Each card shows: attribution line, thesis, ticker+direction pills, live price (if active), engagement stats. The header eats ~56px, tabs eat ~44px, so the first card starts ~116px down.

### Propositional density per card: ~6-7 items
- Who said it (avatar + handle)
- What they said (thesis, ~2 lines)
- Ticker + direction (DELL / Long)
- Call type badge (derived, direct, inspired)
- Live price with change % (green/red)
- Vote count, watcher count, comment count

### What's wasted
- **Tab bar is generic.** "Hot / New / Resolved" takes horizontal space but carries zero information. These words don't tell a viewer what they're looking at. A screenshot would show them and they'd mean nothing.
- **Engagement row is low-contrast.** Votes, watchers, comments are all in `text-gray-400 text-xs` -- nearly invisible at screenshot scale. These are the social proof numbers that make a screenshot interesting ("3.4K people watching this call") but they're styled as footnotes.
- **No entry price on the feed card.** The card shows ticker and direction but not the price at which the call was entered. A screenshot of "$DELL Long" is less interesting than "$DELL Long @ $117.49."
- **No "how much is at stake" signal.** There's no position size, no conviction indicator, nothing that communicates skin-in-the-game from the card itself.
- **"X comments" is dead weight when 0.** Several seed calls show "3 comments" or "7 comments" but no comment content. The number alone wastes space.
- **Live price line is small and plain.** `text-xs font-medium` -- the most dynamic, interesting piece of data on the card (is the caller winning or losing right now?) is styled smaller than the thesis text.

### What's missing
- **Entry price** -- exists in the data (`call.entry_price`) but not shown on feed cards.
- **P&L since entry** -- the live price hook calculates `changePercent` and `changeDollars` but they appear only as a tiny line. This should be the most prominent number on active cards.
- **Time horizon** -- there's no deadline or target date visible. "Called 2 days ago" tells you timing but not conviction horizon.
- **Source quote snippet** -- `source_quote` exists in the data but the feed card doesn't show any of it. A one-line quote from Chamath would make the card far more interesting to screenshot.
- **Price ladder summary** -- the full ladder is on the detail page, but a compact "target: $168 (+43%)" would add density to the feed card.
- **Kill condition** -- `call.kills` is rich data ("Cloud AI costs drop 80%") but invisible on the feed card. This is the most contrarian/interesting field.

### Type sizing problems
- Thesis text: `text-base font-semibold` (16px) -- adequate, readable at screenshot scale.
- Attribution: `text-xs text-gray-500` (12px) -- too small to read in a tweet embed. The @handle is the most recognizable element and it's tiny.
- Engagement: `text-xs text-gray-400` (12px, light gray) -- effectively invisible in a compressed screenshot.
- Live price: `text-xs font-medium` (12px) -- the live P&L is the same size as "24 comments." This is backwards.

### Visual diversity: LOW
Every card looks structurally identical. The only variation is:
- Green/red on the live price line (subtle)
- "CALLED IT +X%" badge on resolved cards (good, but only on resolved)
- Call type pill color (barely visible at 10px)

Two different users screenshotting the same feed would produce nearly identical-looking images unless one has resolved calls showing. Active calls all look the same shape.

### Verdict: C+
The content exists in the data but the card is styled like a Hacker News submission -- all uniform gray text with minimal visual contrast. The most interesting data (P&L, kill condition, source quote) is hidden behind a click. The card is *functional* but not *interesting to look at*.

---

## 2. Card Detail (pages/CardDetail.tsx)

### Phone screenshot test
This is the densest screen. One viewport (~667px tall) would show: back link, scan source badge, attribution, thesis, ticker/direction pills, live price banner, and the beginning of the source quote. The price ladder and kills section would be below the fold.

### Propositional density (above the fold): ~8-10 items
- Scan source (e.g. "All-In Podcast")
- Avatar + handle + call type
- Date + call type badge
- Thesis (large, bold)
- Ticker + direction + instrument + platform
- Live price with $ and % change
- Entry price (implicit in live price banner)
- Source quote beginning

### What's wasted
- **"Back to feed" link** takes up a full line at the top of the most valuable screen real estate.
- **"Current Price" label** -- the label "CURRENT PRICE" above the number is redundant when the number has a $ sign and a change indicator. That's 20px of vertical space for a label no one needs.
- **Section labels are verbose.** "WHY DELL", "EDGE", "COUNTER", "DIES IF" each get their own `text-xs uppercase tracking-wide` label line. These labels consume vertical space. On mobile, each one costs ~24px of scroll.
- **Comments section is always empty.** The seed data has 0 comments. The section still renders "Comments (0) / No comments yet." This wastes ~80px of viewport on every card.
- **Engagement footer is thin.** "+67 votes / 3.4K watching / Share / Make Similar Call" is all `text-sm text-gray-500` in a single line. The vote count -- social proof that this call is worth looking at -- is styled the same as the Share button.

### What's missing
- **No visual scoreboard.** On an active call, there's no at-a-glance "how is this call doing?" beyond the live price banner. A prominent P&L number ("+4.2% since entry") visible without reading the banner context would be more screenshotable.
- **No countdown / time-in-trade.** "Called 18 hours ago" would add urgency.
- **No watcher trend.** "3.4K watching" is static. "3.4K watching (+120 today)" would be more interesting.
- **Resolution box is below-the-fold for resolved calls.** The most interesting part of a resolved call (CALLED IT +43%) shows as a small badge near the top AND as a box near the bottom. But the badge is small and the box is buried.

### Type sizing problems
- Thesis: `text-xl font-bold` (20px) -- good, readable.
- Live price: `text-xl font-bold` (20px) -- good.
- Change %: `text-sm font-medium` (14px) -- adequate but could be larger given it's the key number.
- Source quote: `text-sm text-gray-600 italic` (14px, light) -- hard to read at screenshot scale.
- Section labels: `text-xs uppercase` (12px) -- fine for labels but they're occupying full lines.

### Visual diversity: MEDIUM
Cards vary significantly based on content:
- Active vs resolved vs expired (different badges + banners)
- With/without price ladder
- With/without source quote
- Different color coding (green/red based on performance)

The price ladder is visually distinctive and interesting. Resolved cards with "CALLED IT +43%" are screenshotable.

### Verdict: B
This is the best screen for screenshots. It has real information density and visual variety. The main problems are: (1) the most interesting data is below the fold on mobile, (2) section labels consume too much vertical space, and (3) the live P&L could be much more prominent. A resolved card with a big green badge + price ladder is genuinely interesting to screenshot.

---

## 3. Profile (pages/Profile.tsx)

### Phone screenshot test
One viewport shows: handle, bio, 4-stat grid (Total Calls / Accuracy / Total P&L / Watchers), breakdown text, 3-stat grid (Win Rate / Avg Return / Best Call), attribution section, tabs. No actual call cards visible above the fold.

### Propositional density (above the fold): ~10 items
- Handle + verified badge
- Bio text
- Total Calls count
- Accuracy %
- Total P&L %
- Watchers count
- Breakdown (X original, Y curated)
- Win Rate
- Avg Return
- Best Call

### What's wasted
- **Two separate stat grids.** There's a 4-column grid followed by a text line followed by a 3-column grid. This is 7 stats spread across two visual blocks with a text separator. The text line ("5 calls (0 original, 5 curated)") repeats information already in the grid. Total vertical cost: ~180px for stats that could fit in ~90px.
- **All stats are text-lg font-bold in identical gray boxes.** Every number looks the same. The viewer's eye has nowhere to land. Total Calls "5" and Accuracy "73%" get identical visual weight despite Accuracy being far more interesting.
- **Stats are all "--" for users with no resolved calls.** The profile for @chamath (who has attributed calls but no resolved calls as a caller) would show "--" for Accuracy, Total P&L, Win Rate, Avg Return, Best Call. That's 5 out of 7 stats showing dashes.
- **The attribution section** (blue box: "X calls attributed to your takes") is visually distinct but informationally thin. It could show which calls and how they're performing.

### What's missing
- **No avatar.** The profile page doesn't show the user's avatar at the top. The Avatar component exists and is used on cards, but the profile header is just text.
- **No track record timeline.** A visual showing calls over time (when they were made, how they performed) would be highly screenshotable.
- **No "currently winning/losing" indicator.** For active positions, there's no aggregate "up X% across 3 active calls."
- **No streak or momentum data.** "3 correct calls in a row" or "best month: +47%" -- this data could be computed from resolved calls but isn't shown.
- **No comparison to average.** "73% accuracy" means nothing without context. "73% accuracy (top 5%)" would be far more interesting.

### Type sizing problems
- Handle: `text-2xl font-bold` (24px) -- good.
- Stat numbers: `text-lg font-bold` (18px) -- too small for the key numbers. At screenshot scale, "73%" is barely readable.
- Stat labels: `text-xs text-gray-500` (12px) -- fine as labels.
- Bio: `text-sm text-gray-600` (14px) -- adequate.

### Visual diversity: LOW
Every profile looks the same: two rows of gray boxes with numbers, then a list of call cards. The only variation is the numbers themselves. There's no visual indicator of whether this is a good or bad caller. A 73% accuracy profile looks structurally identical to a 20% accuracy profile.

### Verdict: C
This is the weakest screen for screenshots. It's a spreadsheet of numbers in identical gray boxes with no visual hierarchy, no color coding for performance, no avatar, and no at-a-glance "this person is good/bad at calling." The stat grids are redundant and the most interesting data (how their current calls are doing) is below the fold.

---

## 4. Leaderboard (pages/Leaderboard.tsx)

### Phone screenshot test
Header + filters (period toggles + category pills) + table with columns: #, Caller, Accuracy, P&L, Calls (orig/curated), Watchers. On mobile (390px), 6 columns will be extremely cramped. The "Biggest Calls This Week" sidebar is pushed below the table on mobile (`lg:flex`).

### Propositional density per row: ~6 items
- Rank number
- Avatar + handle + verified badge
- Accuracy %
- P&L %
- Original/curated call count
- Watcher count

### What's wasted
- **Filter UI takes ~80px.** Period toggles + category pills are interactive controls that add zero information in a screenshot. They're UI chrome, not data.
- **Table headers take a full row.** "#", "CALLER", "ACCURACY", "P&L", "CALLS orig/curated", "WATCHERS" in uppercase gray -- this is a standard table header that helps navigation but adds nothing to a screenshot.
- **Rank column.** "#1", "#2" etc. in gray text. This is implied by vertical position.
- **The sidebar "Biggest Calls This Week"** is invisible on mobile. This is arguably the most screenshotable part of the leaderboard (specific calls with big P&L numbers) and it's hidden from most users.

### What's missing
- **No visual indication of performance.** The table is monochrome gray except for P&L (green/red). Accuracy has no color coding. A 90% accuracy caller and a 40% accuracy caller get the same text styling.
- **No trend arrows.** "This caller moved up 3 spots this week" -- rank movement is interesting and shareable.
- **No profile pictures in the table.** Just letter circles. Real Twitter avatars would make the leaderboard far more recognizable.
- **No "top caller" highlight.** The #1 row looks identical to the #5 row. There's no crown, no gold, no visual distinction for the leader.
- **No aggregate stats.** "6 callers / 12 total calls / $2.1M watching" -- a summary at the top would set context.

### Type sizing problems
- All table text is `text-sm` (14px) -- uniform and small. At screenshot scale on mobile, 6 columns of 14px text will be an unreadable blur.
- The P&L numbers (the most interesting data) are the same size as the handle text.
- Rank numbers in `text-gray-400` are nearly invisible.

### Visual diversity: LOW
The table looks the same regardless of who's on it. The only color is green/red P&L. Two screenshots of different leaderboard states would be nearly indistinguishable.

### Verdict: C-
Tables are fundamentally anti-screenshot. They're designed for scanning and comparing, not for sharing. The information is there but the format is wrong for virality. On mobile (where screenshots happen), 6 columns in a standard table will be an unreadable mess. The "Biggest Calls" sidebar -- which IS screenshotable -- is hidden on mobile.

---

## 5. Claim (pages/Claim.tsx)

### Phone screenshot test
Heading + stats grid (4 items) + list of attributed call cards + green CTA box + verification flow + profile preview. The stats grid is visible in the first viewport along with the heading.

### Propositional density (above fold): ~6 items
- Heading with count ("6 calls cite your takes")
- Attribution count
- Accuracy %
- Total P&L %
- Watchers count
- Beginning of call card list

### What's wasted
- **The CTA section is massive.** "Claim These Calls" button + verification code + instructions take ~250px of vertical space. This is functional UI, not interesting content.
- **The profile preview** at the bottom repeats the stats grid from the top. Same 3 numbers, same gray boxes.
- **The verification code** (BRD-XXXX) is implementation detail that adds nothing to a screenshot.

### What's missing
- **No before/after comparison.** "These takes generated +47% returns but @chamath hasn't claimed them yet" -- the gap between the track record and the unclaimed status is the interesting story.
- **No urgency signal.** How many people are watching these calls? How fast is the track record growing?

### Type sizing: Same problems as Profile
- Stat numbers at `text-lg` (18px) in gray boxes -- readable but not prominent.

### Visual diversity: LOW
Same gray box grid as Profile. The green CTA box adds color but it's UI, not content.

### Verdict: C
This page is functional (it gets sources to claim their track record) but not screenshot-worthy. The most interesting story ("someone's ideas generated +47% returns and they don't even know") is buried in small gray numbers.

---

## 6. CallCard Component (components/CallCard.tsx) -- Cross-Cutting

### Key issues affecting ALL screens that use it:

1. **The card is a gray rectangle with gray text.** Border: `border-gray-200`. Background: `bg-white`. Thesis: `text-gray-900`. Attribution: `text-gray-500`. Engagement: `text-gray-400`. The only color is the direction pill (tiny) and the resolved badge (intermittent).

2. **No visual "temperature" indicator.** A card with 3.4K watchers looks identical to one with 12 watchers. The hotter a call is, the more it should visually stand out.

3. **Information hierarchy is wrong for screenshots.** The thesis (text content, needs reading) is the largest element. The P&L (numeric, scannable) is the smallest. In a screenshot shared on Twitter, numbers are readable but text requires zooming in.

4. **No brand/identity marker.** If someone screenshots a feed of cards, there's no "belief.board" branding visible within the card itself. The header says "belief.board" but it's cut off if you screenshot just a card.

---

## Summary: What needs to change for screenshot-native UI

### Priority 1: Make numbers big, make text small (invert current hierarchy)
- P&L % should be the largest element on every card (24px+ bold)
- Ticker + direction should be prominent (18px+)
- Thesis should be secondary (14px, 2 lines max)
- Entry price should be visible on feed cards

### Priority 2: Color = performance
- Cards should be visually green/red-tinted based on performance
- Profile stats should be color-coded (green accuracy above 60%, red below)
- Leaderboard rows should have visual rank distinction (top 3 highlighted)

### Priority 3: Kill the identical gray boxes
- Profile/Claim stat grids are 7 identical gray rectangles. They should have visual hierarchy: one big hero stat + supporting smaller stats.
- Leaderboard should not be a standard table on mobile. Cards or ranked blocks would be more screenshotable.

### Priority 4: Surface the interesting data
- Kill condition on feed cards (most contrarian/interesting text)
- Source quote snippet on feed cards (recognizable voice)
- Entry price on feed cards (makes the call concrete)
- Target price on feed cards ("target: $168 (+43%)")
- Watcher count should be prominent, not footnote-sized

### Priority 5: Visual diversity through data
- Hot calls should look different from cold calls (watchers threshold triggers visual change)
- Winning calls should look different from losing calls (green/red tinting)
- Different call types (direct/derived/inspired) should be visually distinct, not just a tiny pill
