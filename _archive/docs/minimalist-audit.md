# Minimalist Audit: belief.board

Per-screen breakdown. Every issue has a specific fix. Goal: maximum data, minimum chrome.

---

## 1. Header (`components/Header.tsx`)

### Visual noise
- **Search bar does nothing.** The input has no `onChange`, no handler, no state. It occupies the entire center of the header at `flex-1 max-w-md` and communicates a feature that does not exist. **Fix:** Remove the search input entirely until it works. Reclaim the space.
- **"Make Your Call" button** (`bg-green-600`) is a CTA for a route (`/call/new`) that likely has no corresponding page yet. Dead CTA is worse than no CTA. **Fix:** Remove until the route is live.
- **User avatar circle** (`w-8 h-8 rounded-full bg-gray-300`) is hardcoded to `@satoshi`. No auth exists, so this is decoration pretending to be functionality. **Fix:** Remove until auth ships.

### Color abuse
- `focus:ring-green-500` on the search input -- green focus ring on a non-functional element is misleading. N/A once search is removed.
- `bg-green-600` on "Make Your Call" -- green should mean winning/positive. Using it for a generic CTA button dilutes the semantic meaning. **Fix:** If this button ships, use `bg-gray-900 text-white` instead. Reserve green exclusively for P&L.

### Typography sprawl
- `font-semibold text-lg` (logo), `text-sm` (nav links, search, button) -- two sizes, fine.

### Layout bloat
- Three-column layout (logo / search / actions) wastes space on mobile. At 390px, the search bar compresses to near-uselessness. **Fix:** Logo left, minimal nav right. No middle column.

### Cognitive load
- "How it works" link is `hidden sm:inline` -- hidden on mobile where it matters most (new users on phones). **Fix:** If this page matters, show it everywhere. If it doesn't, remove it.

---

## 2. Feed (`pages/Feed.tsx`)

### Visual noise
- **Summary line** (`{calls.length} calls . {formatWatchers(totalWatchers)} watching`) -- "watching" is a vanity metric with no explanation of what it means. Is it real-time? Cumulative? **Fix:** Remove the summary line. The tab counts already communicate volume.
- **Three tabs** where two would suffice. "Hot" and "New" both show active calls with different sort orders. Users don't need to choose between "popular active" and "recent active" -- they need to see what's live. **Fix:** Merge to two tabs: `Active` (sorted by recency, with watchers as secondary signal) and `Resolved`.

### Color abuse
- None. Feed itself is clean grayscale. Good.

### Typography sprawl
- `text-xs text-gray-400` (summary), `text-sm font-medium` (tabs), then card typography below. The summary line and tabs compete at small sizes. **Fix:** Remove summary line, let tabs be the only top-level text.

### Layout bloat
- `max-w-2xl mx-auto` is correct. No excess wrappers. Clean.

### Contrast failures
- `text-gray-400` summary line will be invisible in a compressed Twitter screenshot. **Fix:** Remove line entirely (see above).

---

## 3. CallCard (`components/CallCard.tsx`)

### Visual noise
- **"via @callerHandle"** attribution (`text-xs text-gray-400`) on every card that has a source_handle. On the feed, this adds a second handle to parse on every card. Most users won't understand the distinction between source and caller. **Fix:** Show only the primary handle on the feed card. Expose the "via" attribution only on CardDetail.
- **Row 4 reasoning breadcrumb** (`scan_source -> reasoning`) -- mixing two metadata fields into a truncated single line. The `->` arrow connecting them is confusing: is this a chain? A derivation? **Fix:** Show only `scan_source` as a one-line provenance tag if it exists. Move full reasoning to CardDetail only.
- **"watching" in footer** -- same vanity metric issue as Feed summary. **Fix:** Remove from card footer. Watchers belong on the profile/leaderboard, not competing for attention on every card.
- **"CALLED IT" / "MISSED" badges** (`bg-green-100 text-green-700` / `bg-red-100 text-red-700`) -- these are redundant with the P&L number and the left border color, which already encode win/loss. Three signals for the same information. **Fix:** Remove the badge. The P&L number and border color are sufficient.

### Color abuse
- **Avatar fallback colors** include `bg-blue-500`, `bg-purple-500`, `bg-orange-500`, `bg-pink-500`, `bg-teal-500`, `bg-indigo-500`, `bg-rose-500` -- seven non-semantic colors. These rainbow avatars fight with the green/red P&L for attention. **Fix:** Use `bg-gray-400` for all letter avatars. Or better: `bg-gray-200 text-gray-600`. The avatar is identification, not decoration. Actual profile images already provide color.
- **`border-l-yellow-400`** for "closed" status -- yellow is not in the design system (green/red/gray only). **Fix:** Use `border-l-gray-300` same as expired. "Closed" and "expired" are both terminal non-winning states.
- **`text-yellow-600`** for "CLOSED" label -- same problem. **Fix:** `text-gray-400`, same treatment as "EXPIRED".

### Typography sprawl
Seven distinct text treatments on a single card:
1. `text-sm font-semibold` (handle)
2. `text-xs text-gray-400` (via, timestamp, scan_source)
3. `text-base font-semibold` (thesis)
4. `text-sm font-bold` (ticker)
5. `text-xs font-semibold` (direction)
6. `text-xl font-extrabold` (P&L)
7. `text-xs text-gray-400` (reasoning, footer)

That's 4 font sizes and 3 font weights competing in ~120px of vertical space. **Fix:** Collapse to 3 treatments:
- **Primary:** `text-sm font-semibold` (handle, thesis, ticker+direction)
- **Accent:** `text-xl font-extrabold` (P&L only)
- **Secondary:** `text-xs text-gray-500` (everything else)

### Layout bloat
- Row 3 has `flex items-baseline justify-between` with nested `flex items-baseline gap-2` -- the inner flex contains ticker, direction, entry price, and instrument as separate spans. On mobile, this wraps awkwardly. **Fix:** Combine ticker+direction into a single span: `"DELL Long"` instead of two separate colored elements.

### Contrast failures
- `text-gray-400` used for: timestamp, "via" attribution, entry price, instrument, scan_source, reasoning, watchers. That's `#9ca3af` on white -- 2.9:1 contrast ratio, fails WCAG AA for small text. **Fix:** Upgrade all secondary text to `text-gray-500` (`#6b7280`, 4.6:1 ratio).

---

## 4. CardDetail (`pages/CardDetail.tsx`)

### Visual noise
- **Duplicate time display:** Both `formatDate(call.created_at)` and `timeAgo(call.created_at)` are shown simultaneously -- the formatted date under the handle and timeAgo in the top-right corner. Pick one. **Fix:** Show only `timeAgo` on the same line as the handle. Drop `formatDate` from the sub-handle metadata.
- **call_type badge** (`bg-green-50 text-green-600` / `bg-blue-50 text-blue-600` / `bg-purple-50 text-purple-600`) -- three colored pills for "direct", "derived", and presumably "curated". These are internal taxonomy that means nothing to a first-time visitor. **Fix:** Remove entirely. If call_type matters, explain it in the derivation chain, not as a colored badge.
- **Derivation chain** (`border-l-2 border-blue-200`) -- blue left border introduces a new color into the detail view. **Fix:** Use `border-gray-300` consistent with the source quote block above it.
- **"Alternative" field** (`text-xs text-gray-500`) and **"Edge" field** (`text-sm text-gray-600`) -- these are analyst jargon that add cognitive load for casual users. Most call detail pages will have: thesis, reasoning, source quote, derivation, edge, counter, alternative, kill condition -- that's 7 text blocks below the trade data. **Fix:** Collapse edge/counter/alternative into a single "Analysis" paragraph. Show kill condition only if it exists, in the same block.
- **Source quote block** shows empty quotes (`" "`) when `call.source_quote` is falsy but `call.derivation` exists and contains no quoted text (the regex `/"([^"]+)"/` returns null). **Fix:** Only render the blockquote when there's actual quote text to show.
- **"CALLED IT" / "MISSED" badge** -- same redundancy as CallCard. P&L number + border color already encode this. **Fix:** Remove badge. Show only the resolve dates and exit price as metadata.
- **`votes` in footer** -- `+{call.votes}` with no context. What are votes? Who voted? There's no voting UI anywhere. **Fix:** Remove until voting is implemented.

### Color abuse
- `bg-blue-50 ring-1 ring-blue-300` on the PriceLadder "closest to current" row. Blue is not in the semantic palette. **Fix:** Use `bg-gray-100 ring-1 ring-gray-400` or simply bold the row text.
- `text-blue-700 font-semibold` and `text-blue-600` in PriceLadder "now" marker. **Fix:** Use `text-gray-900 font-bold` -- "now" is emphasis, not a category.
- `bg-blue-50 text-blue-600`, `bg-purple-50 text-purple-600` call_type badges -- already flagged above.
- `border-blue-200` derivation chain border -- already flagged above.

### Typography sprawl
The detail page has at minimum 9 distinct text sizes/weights:
`text-base font-semibold`, `text-xs text-gray-400`, `text-xl font-bold`, `text-sm text-gray-600 italic`, `text-3xl font-extrabold`, `text-sm text-gray-400`, `text-xs font-bold`, `text-sm text-gray-700`, `text-xs text-gray-600`

**Fix:** Reduce to 4:
- **Hero:** `text-2xl font-bold` (P&L)
- **Title:** `text-lg font-bold` (thesis)
- **Body:** `text-sm` (reasoning, quotes, analysis -- vary only color)
- **Meta:** `text-xs text-gray-500` (dates, labels, metadata)

### Cognitive load
- PriceLadder grid uses `grid-cols-[80px_60px_1fr]` with 3 columns (price, pnl%, bar). The bar visualization adds visual weight but communicates the same information as the percentage number. **Fix:** Remove the bar. Show price and percentage only. The numbers are the data; the bars are decoration.

---

## 5. Profile (`pages/Profile.tsx`)

### Visual noise
- **Verified badge** (blue SVG checkmark) -- blue is not in the palette. **Fix:** Use a gray checkmark or remove. Verification is already communicated by the claim flow, not a badge color.
- **Stats row** has 6 items separated by `text-gray-300` dots: calls, total P&L, win rate, streak, watchers. At 390px width, this wraps into 2-3 lines and becomes unreadable. **Fix:** Show 3 stats max on one line: calls, accuracy (already hero), total P&L. Move win rate and streak to a "Details" section below.
- **Active positions summary box** (`border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50`) -- a box within the page containing ticker links with direction arrows. This is useful information buried in a gray box that looks like a disabled section. **Fix:** Remove the box wrapper. Inline the active positions as a comma-separated list under the stats: `Active: DELL ↑, BTC ↑, SOL ↓`.
- **Attribution badge** (`text-blue-600 bg-blue-50 border-blue-100`) -- blue background + blue text. Not green/red/gray. **Fix:** `text-gray-600 bg-gray-50 border-gray-200`. Attribution is informational, not a highlight.
- **"Best" one-liner** duplicates information from the resolved calls below. **Fix:** Keep only if it fits on one line at 390px. Otherwise remove.

### Color abuse
- `text-blue-500` verified checkmark -- not in palette. **Fix:** `text-gray-400` or remove.
- `text-blue-600 bg-blue-50 border-blue-100` attribution badge -- not in palette. **Fix:** grayscale.
- `text-yellow-500` (rank 1), `text-orange-400` (rank 3) in active positions -- these leak from the leaderboard but appear nowhere else on the profile. **Fix:** N/A on profile, but flagging for leaderboard below.

### Typography sprawl
- Hero accuracy is `text-4xl font-extrabold`. Handle is `text-2xl font-bold`. Stats are `text-sm`. Three tiers, fine, but the 4xl accuracy competes with the 2xl handle at mobile width. **Fix:** Drop accuracy to `text-3xl`. It should be prominent but not overpowering.

### Contrast failures
- `text-gray-300` dot separators in the stats row. At screenshot scale these vanish. **Fix:** Use `text-gray-400` or replace dots with 16px of gap spacing.

---

## 6. Leaderboard (`pages/Leaderboard.tsx`)

### Visual noise
- **"Biggest wins" horizontal scroll section** -- three cards at `w-52` that scroll horizontally. On mobile, you see 1.5 cards with no scroll indicator. Users won't know there's more content off-screen. **Fix:** Remove the horizontal scroll. Show biggest wins as a simple numbered list: `1. DELL +47% (@chamath)`. Three lines, no cards, no scrolling.
- **Rank numbers** have 4 different color treatments: `text-yellow-500` (1st), `text-gray-400` (2nd), `text-orange-400` (3rd), `text-gray-300` (4th+). Yellow and orange are not in the semantic palette. **Fix:** `text-gray-900 font-bold` for rank 1, `text-gray-500` for all others. Let the data (accuracy, P&L) differentiate top callers, not decorative rank colors.
- **Both P&L and accuracy** displayed for each entry. Two numbers on the right side of each row compete for the "punchline" position. **Fix:** Show only accuracy (the ranking metric). P&L is visible on click-through to profile.

### Color abuse
- `text-yellow-500` rank 1 -- gold/yellow not in palette. **Fix:** remove.
- `text-orange-400` rank 3 -- orange not in palette. **Fix:** remove.
- `text-blue-500` verified checkmark -- same as Profile. **Fix:** grayscale.

### Typography sprawl
- Rank numbers have `text-xl` (1st), `text-lg` (2nd-3rd), `text-sm` (4th+). Three sizes for a single-purpose element. **Fix:** One size: `text-sm font-bold` for all ranks.
- Entry names are `text-base` for top 3, `text-sm` for others. **Fix:** `text-sm` for all. The rank number provides hierarchy.
- Accuracy is `text-2xl` for top 3, `text-xl` for others. **Fix:** `text-xl` for all.

### Layout bloat
- Top 3 entries get `bg-white border border-gray-200 hover:border-gray-300` while others get `hover:bg-gray-50`. This border/no-border distinction adds visual complexity without clear meaning -- why does #3 get a box but #4 doesn't? **Fix:** All entries get the same treatment. Use font-weight on rank 1 name to distinguish, nothing else.

---

## 7. Claim (`pages/Claim.tsx`)

### Visual noise
- **Stats grid** (`grid grid-cols-4 gap-3`) shows 4 boxed stats: Attributed, Accuracy, Total P&L, Watchers. At 390px, four columns are ~85px each -- too cramped for readable numbers. **Fix:** Two columns or a single row of inline stats, same as Profile.
- **Profile preview section** duplicates the stats grid with a slightly different layout (3 columns). Two stat grids on one page. **Fix:** Remove the profile preview entirely. The stats at the top already show what the profile will look like. A preview of a preview is noise.
- **Verification UI** (code + copy button) is shown to everyone, even users who aren't @handle. There's no auth check. **Fix:** This is a design issue, not just visual. But visually, move the verification below a "Start verification" button to reduce initial cognitive load.
- **"Claim These Calls" green section** (`border-green-200 bg-green-50`) + green button (`bg-green-600`) -- green used for a CTA, not for positive P&L. Dilutes the semantic meaning. **Fix:** `border-gray-200 bg-gray-50` for the section. `bg-gray-900 text-white` for the button.

### Color abuse
- `bg-green-50 border-green-200` CTA section -- green is P&L, not CTA. **Fix:** grayscale.
- `bg-green-600` button -- same. **Fix:** `bg-gray-900`.
- `text-blue-500` verified checkmark in preview -- same as everywhere. **Fix:** grayscale.
- `text-green-600 hover:text-green-700` "Back to feed" link -- green link color is inconsistent with the rest of the app (other back links would be gray). **Fix:** `text-gray-600 hover:text-gray-900`.

### Cognitive load
- Page shows: heading, stats grid, call cards, CTA section with nested verification, profile preview with another stats grid. That's 5 distinct sections on a page most users will see once. **Fix:** Reduce to 3 sections: (1) heading + inline stats, (2) call cards, (3) claim CTA with verification inline.

---

## 8. HowItWorks (`pages/HowItWorks.tsx`)

### Visual noise
- **Label pills** (`bg-gray-100 text-gray-600`, `bg-green-50 text-green-700`, etc.) scattered throughout. Step 1 has 3 pills ("Raw take", "Unstructured", "No tracking"). Step 2 has 4 pills ("Who said it", "The claim", "The trade", "Reasoning chain"). Step 3 has 2 pills. These are decorative annotations that explain what the UI already shows. **Fix:** Remove all Label pills. The card components themselves are the explanation. If the card needs a label to be understood, the card is the problem.
- **RawTake component** hardcodes an external Twitter avatar URL (`pbs.twimg.com/profile_images/...`). If this image 404s, the component breaks. **Fix:** Use the Avatar component with a fallback letter, or inline a static `<span>` avatar.
- **Two CallCard instances in Step 3** (active + resolved) -- showing the same component twice doesn't demonstrate "tracking against reality." It demonstrates that the card component exists. **Fix:** Show one card with a clear before/after or an annotated P&L change.
- **MiniLeaderboard** at step 4 duplicates leaderboard rendering logic. **Fix:** If the mini leaderboard adds understanding, keep it. But remove the footer pill (`"Ranked by accuracy, not followers"`) -- that's copywriting, not UI.

### Color abuse
- `bg-blue-50 text-blue-700` Label -- blue not in palette.
- `bg-green-50 text-green-700` Label -- green used for a label ("The trade"), not for P&L.
- `bg-red-50 text-red-700` Label -- red used for generic labeling, not for loss.
- `text-yellow-500`, `text-orange-400` in MiniLeaderboard rank colors -- inherited from Leaderboard.

### Typography sprawl
- Step numbers: `text-sm font-bold text-gray-300` -- these are nearly invisible. A gray-300 number is below readable contrast. **Fix:** `text-gray-500` minimum.

### Contrast failures
- Step numbers at `text-gray-300` (#d1d5db) on white: 1.8:1 contrast ratio. Fails all WCAG levels. **Fix:** `text-gray-500` for accessibility.

---

## Cross-Cutting Issues

### 1. Green means two things
Throughout the app, `green-600` is used for:
- Positive P&L (semantic, correct)
- CTA buttons: "Make Your Call", "Claim These Calls", "Explore the feed" (decorative, incorrect)
- Links: "Back to feed" (decorative, incorrect)

**Fix:** CTA buttons should be `bg-gray-900 text-white`. Links should be `text-gray-600`. Green is exclusively for money being made.

### 2. Blue is everywhere with no meaning
`blue-500` verified checkmarks, `blue-50/blue-600` call_type badges, `blue-200` derivation borders, `blue-50/blue-300` PriceLadder highlight, `blue-50/blue-700` labels, `blue-50/blue-600` attribution badges.

**Fix:** Eliminate all blue. Verified = gray checkmark or bold text. Call_type = remove badge. Derivation border = gray. PriceLadder highlight = gray background + bold text. Attribution = gray.

### 3. `text-gray-400` is the default secondary color but fails contrast
Used in: timestamps, "via" attributions, entry prices, instruments, scan sources, reasoning truncations, watcher counts, step numbers, summary lines, metadata.

At 12px (`text-xs`), `#9ca3af` on `#ffffff` = 2.9:1. WCAG AA requires 4.5:1 for small text.

**Fix:** Global find-replace `text-gray-400` with `text-gray-500` for all text elements. Keep `text-gray-400` only for borders and dividers.

### 4. `formatWatchers` is defined 3 times
In `CallCard.tsx` (line 27), `Feed.tsx` (line 9), and `Leaderboard.tsx` (line 13). Same function, three copies.

**Fix:** Export once from a shared utils file or from CallCard (where it already exists).

### 5. `timeAgo` and `computePnl` are defined twice
Both exist in `CallCard.tsx` and `CardDetail.tsx`.

**Fix:** Export from CallCard or a shared module.
