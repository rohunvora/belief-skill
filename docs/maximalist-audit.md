# Maximalist Audit: User-POV Depth & Links Review

Persona: Crypto Twitter power user, skeptical of AI, first time on belief.board. Wants to verify, go deeper, reuse, share, and respond.

---

## 1. Header (`components/Header.tsx`)

### Dead-ends found

- **Search bar is a prop**. The input does nothing -- no `onChange`, no filtering, no results. A user types "DELL" and gets silence. Either wire it up or remove it; a dead input is worse than no input.
- **"Make Your Call" button** navigates to `/call/new` but there is no indication whether this requires auth or what happens. The user clicks, sees a form (presumably), but there is no onboarding breadcrumb like "paste a tweet or podcast link."
- **Profile avatar** is hardcoded to `@satoshi`. No logged-in state awareness. Clicking it always goes to the same profile regardless of who is viewing.
- **No Leaderboard link** in the nav. The only way to reach the leaderboard is via the HowItWorks CTA at the bottom. Add a header link.

### Specific additions

| Moment | What to add |
|--------|-------------|
| User wants to find a ticker | Wire up search with at minimum client-side filter on `ticker`, `thesis`, `handle` |
| User wants the leaderboard | Add `Leaderboard` link in the right section between "How it works" and "Make Your Call" |
| User wants to share the site | Add a copy-URL / share button on mobile (navigator.share API) |

---

## 2. Feed (`pages/Feed.tsx`)

### Dead-ends found

- **No ticker filter**. User sees 15 calls and wants "just crypto" or "just $DELL". No way to narrow without search.
- **No source filter**. User wants "all calls from podcasts" or "all calls from Twitter." `scan_source` exists in the data but is not filterable.
- **Summary line is static text** ("12 calls . 4.2K watching"). None of these are clickable. "4.2K watching" should link to the leaderboard or a "who's watching" breakdown.
- **Tabs lack a "biggest wins" view**. The leaderboard has a "Biggest wins" carousel. The feed should have a way to sort by P&L magnitude, not just hot/new/resolved.
- **No "load more" or pagination**. If there are 500 calls, the entire list renders.
- **No empty state CTA**. "No calls to show" has no action. Should say "Be the first -- make a call" with a link to `/call/new`.

### Specific additions

| Moment | What to add |
|--------|-------------|
| User wants to filter by ticker | Add a ticker chip bar above the card list (derived from unique `call.ticker` values) |
| User sees a card and wants to share it | Add a share icon (or long-press on mobile) on each `CallCard` that copies the permalink `#/call/{id}` |
| User wants to see the source tweet/podcast | `scan_source` line on `CallCard` (Row 4) is plain text. If `call.source_url` exists, make `scan_source` a hyperlink that opens the source in a new tab |
| User wants to copy the thesis | No copy affordance on the thesis text. Add a small copy icon next to it on hover |

---

## 3. CallCard (`components/CallCard.tsx`)

### Dead-ends found

- **Ticker is not clickable**. `call.ticker` is a bold `<span>`. User expects clicking "DELL" to show all DELL calls. Should be `<a href="#/?ticker=DELL">`.
- **`scan_source` is plain text**. The data model has `source_url: string | null` but the card never renders it. "All-In Podcast (Feb 2026)" should be a hyperlink to the episode or tweet.
- **`reasoning` is truncated with no expansion**. User sees 80 chars of reasoning and wants to read the rest, but the only way is to click into the detail page. Consider an inline expand or at least a "...more" that navigates to the detail.
- **`call_type` badge is missing**. The card does not show whether this is `original`, `direct`, `derived`, or `inspired`. The detail page shows it, but the card omits it. A skeptical user wants to know at a glance: did this person say this, or is this AI-derived?
- **No share affordance**. No way to share a specific card without navigating to detail first. Add a share icon that copies `#/call/{id}` to clipboard.
- **No source avatar or link to source's external profile**. `source_handle` links to the internal profile but never to their actual Twitter/X profile. If `user.twitter` exists, the avatar or handle should optionally link to `https://x.com/{handle}`.
- **`timeAgo` has no tooltip showing the full date**. User sees "3d ago" but wants to know the exact date. Add a `title` attribute with the ISO date.

### Specific additions

| Moment | What to add |
|--------|-------------|
| Ticker should deep-link | Wrap `call.ticker` in `<a href="#/?ticker={ticker}">` |
| scan_source should link to original | If `call.source_url` is non-null, render `scan_source` as `<a href={source_url} target="_blank">` |
| User wants to copy thesis | Add a copy-to-clipboard icon on hover next to the thesis line |
| User wants call_type visibility | Show a small badge (e.g., "derived", "direct") next to the handle, same style as CardDetail |
| User wants share link | Add a small share/link icon in the footer row that copies the call permalink |
| Timestamps need full date | Add `title={call.created_at}` on the timeAgo span |

---

## 4. CardDetail (`pages/CardDetail.tsx`)

### Dead-ends found

- **No "back" button or breadcrumb**. User navigates to a call detail and has to use browser back or click the logo. Add a `< Back to feed` link at the top.
- **Source quote has no link to the original source**. The blockquote shows "chamath said X" but never links to where he said it. `call.source_url` exists in the type but is never rendered on this page. Add a "View original" link under the source quote, pointing to `source_url`.
- **`scan_source` on the attribution line is plain text**. Same issue as CallCard. "All-In Podcast . Feb 14, 2026" should be a hyperlink to `source_url`.
- **Ticker is not clickable**. Same as CallCard -- the `<span>` should be a link to a ticker-filtered feed.
- **No copy button for the thesis**. A user who wants to paste this into their own Claude Code or tweet has to manually select and copy. Add a copy icon.
- **No copy button for the full call context**. Power users want to copy the entire structured call (thesis + reasoning + derivation + trade data) as text to paste into their AI assistant. Add a "Copy full context" button.
- **No share button**. No way to share this specific call. Add a "Share" button that copies the permalink or triggers `navigator.share`.
- **Derivation chain has no source links**. The derivation text often references sources ("Searched: Birdeye API", "Found because: 10-K filing") but these are plain text. Parse URLs or known source patterns and make them clickable.
- **Platform badge is plain text**. `call.platform` shows "robinhood" or "kalshi" as text. Make it a link to the relevant market/contract page if possible.
- **Price data has no source attribution**. Entry price, resolve price, live price -- where does this data come from? A skeptical user wants to know. Add a small "via CoinGecko" or "via Robinhood" attribution next to price figures.
- **Comments section is always empty**. `const comments: Comment[] = [];` is hardcoded. Either wire up real comments or remove the section. An empty comments array that renders nothing is fine, but if comments are planned, show a "No comments yet -- be the first" prompt.
- **No "counter this call" action**. User disagrees and wants to make a counter-call (same ticker, opposite direction). Add a "Counter this call" button that pre-fills `/call/new` with the ticker and opposite direction.
- **No "watch" button**. `call.watchers` is displayed but there is no way to watch/unwatch. Either add the interaction or explain that watching is passive.
- **Resolve date range shows `created_at -> resolve_date` but the arrow uses HTML entity**. Minor: the `&rarr;` renders correctly but the date range would benefit from a duration label like "(47 days)".
- **No link to source handle's Twitter profile**. Under the source quote, `-- @chamath` should link to `https://x.com/chamath`, not just to the internal profile.

### Specific additions

| Moment | What to add |
|--------|-------------|
| Back navigation | Add `< Feed` or `< Back` link above the card |
| Source verification | Add "View original" link under source quote blockquote, using `call.source_url` |
| Source handle to Twitter | Make `-- @{source_handle}` in the blockquote link to `https://x.com/{source_handle}` |
| Ticker deep link | Wrap ticker in `<a href="#/?ticker={ticker}">` |
| Copy thesis | Add clipboard icon next to thesis `<h1>` |
| Copy full call context | Add "Copy context" button that serializes thesis + reasoning + derivation + trade data as plaintext |
| Share call | Add "Share" button that copies permalink or uses navigator.share |
| Counter-call | Add "Counter" button that navigates to `/call/new?ticker={ticker}&direction={opposite}` |
| Price source attribution | Show small "via {source}" next to entry_price and live price |
| Platform link | Make `call.platform` a link to the relevant exchange |
| Comments prompt | If comments.length === 0, show "No comments yet" with a prompt to add one |

---

## 5. Profile (`pages/Profile.tsx`)

### Dead-ends found

- **No link to the user's Twitter/X profile**. The data model has `user.twitter: string | null` but it is never rendered. Add an external link icon next to the handle that opens `https://x.com/{twitter}`.
- **No share button for the profile**. User wants to share "@chamath's track record" on Twitter. Add a "Share profile" button that copies the URL or uses navigator.share.
- **Best call is not clickable**. "Best: DELL +42.5%" is plain text. The `bestCall` object has an `id` -- make it a link to `#/call/{bestCall.id}`.
- **Attribution badge is not expandable**. "3 calls cite @chamath's takes" is a one-liner. User wants to see which calls. Make it clickable to show/filter to those calls, or link to a filtered view.
- **Active positions summary links to individual calls but has no "view all" link**. Only shows 5 with "+N more" but "+N more" is not clickable. Make it link to the "active" tab below.
- **No "Watch this caller" button**. `user.watchers` is displayed but there is no interaction.
- **No accuracy methodology explanation**. User sees "67% accuracy" and wonders: is this all-time? Last 30 days? Win rate on resolved calls only? Add a tooltip or info icon explaining the calculation.
- **Stats row wraps awkwardly on mobile**. The single-line `flex items-baseline gap-4` will overflow on narrow screens. Consider wrapping or stacking on mobile.
- **No "Claim this profile" CTA** visible when viewing someone else's profile unclaimed. The Claim page exists at `/claim/{handle}` but there is no link to it from the profile page itself.
- **CallCards in the profile list do not get live prices**. The `CallCard` component accepts `livePrice` but Profile does not pass it. Active calls on the profile page show no P&L.

### Specific additions

| Moment | What to add |
|--------|-------------|
| Verify identity externally | Add Twitter/X icon link next to handle if `user.twitter` is set |
| Share profile | Add share button that copies `#/u/{handle}` |
| Best call clickable | Wrap best call text in `<a href="#/call/{bestCall.id}">` |
| Attribution expandable | Make "N calls cite" clickable, scroll to or filter those calls |
| "+N more" active positions | Make it clickable, switch to active tab |
| Claim CTA | If `user.verified === false`, show a "Claim this profile" link to `/claim/{handle}` |
| Live prices on cards | Pass `useLivePrices(filteredCalls)` to CallCard in the profile |
| Accuracy tooltip | Add info icon with tooltip: "Win rate on resolved calls" |

---

## 6. Leaderboard (`pages/Leaderboard.tsx`)

### Dead-ends found

- **No time range filter**. User wants "best callers this month" vs "all time." The leaderboard is always all-time.
- **No ticker filter**. User wants "best callers on crypto" or "best callers on stocks."
- **Biggest wins cards do not show the caller**. The card shows `@{source_handle}` but not the board user who structured the call. If the source and caller differ, the user cannot tell who gets credit.
- **No "view all biggest wins" link**. Only 3 are shown. If there are 20 resolved profitable calls, the user wants to browse them all.
- **Rank rows do not show call_type breakdown**. `entry.originalCalls` and `entry.curatedCalls` are computed but never displayed. A skeptical user wants to know: did this person make original calls or just curate others' takes?
- **No share button for leaderboard position**. User wants to share "I'm ranked #3 on belief.board."
- **No explanation of ranking methodology**. "Sorted by accuracy" is not stated anywhere on the page. Add a subtitle or tooltip.

### Specific additions

| Moment | What to add |
|--------|-------------|
| Time range | Add tabs or dropdown: "All time", "This month", "This week" |
| Biggest wins caller | Show the caller handle on the biggest wins cards |
| View all wins | Add "View all" link after the 3 biggest wins cards |
| Call type breakdown | Show "N original / N curated" in the stats line per entry |
| Ranking methodology | Add subtitle: "Ranked by accuracy on resolved calls" |
| Share rank | Add share icon per row |

---

## 7. Claim (`pages/Claim.tsx`)

### Dead-ends found

- **"Claim These Calls" button does nothing**. It is a `<button>` with no `onClick`. The verification flow is a mock UI with a code but no actual verification logic.
- **No link back to the profile**. User sees the claim page but cannot navigate back to the profile for `@{handle}`. Add a link.
- **No explanation of what "claiming" does**. The text says "all calls citing @handle will be linked to your profile" but does not explain: will they see my accuracy? Can I edit calls? Will I get notifications?
- **Verification code is generated client-side and not stored**. Refreshing the page generates a new code. This is a UX trap.
- **Profile preview is static**. The preview section could show a diff of "before claim" vs "after claim" to make the value clearer.
- **Call cards in the attributed list do not get live prices**. Same issue as Profile.

### Specific additions

| Moment | What to add |
|--------|-------------|
| Back to profile | Add link: `< @{handle}'s profile` |
| CTA functionality | Wire up the button or clearly label it as "coming soon" |
| Claim explanation | Add a brief "What happens when you claim" section |
| Verification persistence | Store the code server-side so it survives refresh |

---

## 8. HowItWorks (`pages/HowItWorks.tsx`)

### Dead-ends found

- **No link to a real podcast episode or tweet in the RawTake example**. The chamath quote is a fake example with no external link. Even in an explainer, the user expects to be able to verify. Add a "See the real take" link if based on a real example, or clearly label it as illustrative.
- **The mini leaderboard entries are not clickable**. They show `@handle` and accuracy but clicking does nothing. Make them link to the profile page.
- **No "try it yourself" CTA**. The bottom CTA says "Explore the feed" and "View leaderboard" but never says "Make your first call" -- which is the primary action for a new user.
- **No explanation of "what AI does"**. The page describes the flow (raw take -> structured -> tracked -> leaderboard) but never addresses the skeptical user's concern: "how does the AI interpret the take? Can I override it? What if it gets it wrong?"

### Specific additions

| Moment | What to add |
|--------|-------------|
| Mini leaderboard clickable | Wrap each row in `<a href="#/u/{handle}">` or add onClick |
| Make a call CTA | Add a third CTA button: "Make your first call" linking to `/call/new` |
| AI transparency | Add a brief note: "The AI extracts ticker, direction, and entry price. You review before publishing." |
| Real source links | If the chamath example is from a real episode, link to it |

---

## 9. Cross-Cutting Issues (All Screens)

### Missing globally

1. **`source_url` is never rendered anywhere**. The data model has it. It is the single most important trust signal for a skeptical user. Every call that has a `source_url` should show a "View source" link on both the card and detail page.

2. **No external Twitter/X links for any handle**. `user.twitter` exists in the data model but is never used. Every `@handle` that corresponds to a Twitter account should have an option to view the external profile.

3. **No copy-to-clipboard on any text**. Thesis, reasoning, derivation, source quote -- none have copy affordances. Power users constantly want to copy structured takes to paste elsewhere.

4. **No share buttons anywhere**. No card, profile, or leaderboard entry can be shared. For a social product, this is critical. At minimum: copy permalink. Ideally: navigator.share on mobile, Twitter intent URL for "Share on X."

5. **No deep linking by ticker**. Clicking a ticker should filter the feed to that ticker. Currently tickers are plain text spans everywhere.

6. **No price source attribution**. Entry prices, live prices, resolve prices -- none cite their data source. A user sees "$174.50" and wonders: is this the ask? The last trade? From which exchange? At minimum show "via {platform}" or "via CoinGecko."

7. **No timestamp tooltips**. "3d ago" appears everywhere but the exact datetime is never visible. Add `title` attributes.

8. **No RSS/webhook for new calls**. Power users want to subscribe to specific tickers or callers. Not in the current UI at all.

9. **No mobile-specific affordances**. No long-press to share, no swipe actions, no bottom nav bar. The header search and nav links collapse poorly on small screens.

10. **Call type (`original` / `direct` / `derived` / `inspired`) is only shown on CardDetail**. It should appear on CallCard too, since it directly affects trustworthiness.
