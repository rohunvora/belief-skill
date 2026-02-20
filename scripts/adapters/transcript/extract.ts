/**
 * Transcript Extractor
 *
 * Extracts text content from URLs for thesis extraction.
 * YouTube: uses yt-dlp for auto-captions.
 * X/Twitter: uses X API v2 (with note_tweet for long posts), falls back to
 *            fxtwitter.com (free, no auth) if no X_BEARER_TOKEN is set.
 * Other URLs: markdown.new → raw fetch + HTML strip.
 *
 * Usage:
 *   bun run scripts/adapters/transcript/extract.ts "https://youtube.com/watch?v=xxx"
 *   bun run scripts/adapters/transcript/extract.ts "https://x.com/user/status/123"
 *   bun run scripts/adapters/transcript/extract.ts "https://example.com/article"
 *
 * Requires: yt-dlp (brew install yt-dlp) for YouTube
 * Optional: X_BEARER_TOKEN env var for X API (better rate limits, higher reliability)
 */

import { $ } from "bun";
import { tmpdir } from "os";
import { join } from "path";

// ---------------------------------------------------------------------------
// X API token (optional — enables direct API extraction for tweets)
// ---------------------------------------------------------------------------

function loadBearerToken(): string | undefined {
  try {
    const envFile = Bun.file(`${import.meta.dir}/../../../.env`);
    const text = envFile.textSync?.() ?? require("fs").readFileSync(envFile.name!, "utf-8");
    const match = text.match(/^X_BEARER_TOKEN=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch { /* fall through */ }
  return process.env.X_BEARER_TOKEN;
}
const X_BEARER_TOKEN = loadBearerToken();

// ---------------------------------------------------------------------------
// URL classification
// ---------------------------------------------------------------------------

type UrlType = "youtube" | "tweet" | "text";

function classifyUrl(url: string): UrlType {
  const u = url.toLowerCase();
  if (
    u.includes("youtube.com/watch") ||
    u.includes("youtu.be/") ||
    u.includes("youtube.com/live")
  )
    return "youtube";
  if (
    u.includes("x.com/") && u.includes("/status/") ||
    u.includes("twitter.com/") && u.includes("/status/")
  )
    return "tweet";
  return "text";
}

/** Extract tweet ID and handle from an x.com or twitter.com URL */
function parseTweetUrl(url: string): { handle: string; tweetId: string } | null {
  const m = url.match(/(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/);
  if (!m) return null;
  return { handle: m[1], tweetId: m[2] };
}

function extractVideoId(url: string): string | null {
  const m =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?&]+)/) ||
    url.match(/youtube\.com\/live\/([^?&]+)/);
  return m?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// YouTube transcript via yt-dlp
// ---------------------------------------------------------------------------

async function extractYoutube(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Could not extract video ID from URL");

  const outTemplate = join(tmpdir(), `yt-transcript-${videoId}-%(id)s`);

  // Download auto-generated or manual English captions as json3
  await $`yt-dlp --write-auto-sub --write-sub --skip-download --sub-lang en --sub-format json3 -o ${outTemplate} ${url}`
    .quiet()
    .nothrow();

  // Find the caption file
  const capFile = join(tmpdir(), `yt-transcript-${videoId}-${videoId}.en.json3`);
  const file = Bun.file(capFile);

  if (!(await file.exists())) {
    return JSON.stringify({
      source: "youtube",
      url,
      error: "No English captions available. Ask user to paste transcript.",
    });
  }

  const data = (await file.json()) as { events?: Array<{ segs?: Array<{ utf8: string }> }> };
  const text =
    data.events
      ?.filter((e) => e.segs)
      .map((e) => e.segs!.map((s) => s.utf8).join(""))
      .join(" ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? "";

  // Cleanup
  await $`rm -f ${capFile}`.quiet().nothrow();

  const wordCount = text.split(/\s+/).length;

  return JSON.stringify({
    source: "youtube",
    url,
    word_count: wordCount,
    transcript: text,
  });
}

// ---------------------------------------------------------------------------
// Tweet extraction — tiered: X API v2 → fxtwitter → vxtwitter
// ---------------------------------------------------------------------------

/** Fetch a single tweet via X API v2 (requires X_BEARER_TOKEN) */
async function extractTweetViaApi(tweetId: string, handle: string): Promise<string | null> {
  if (!X_BEARER_TOKEN) return null;

  const params = new URLSearchParams({
    "tweet.fields": "created_at,public_metrics,note_tweet,author_id,entities",
    expansions: "author_id",
    "user.fields": "username,name",
  });

  const url = `https://api.x.com/2/tweets/${tweetId}?${params}`;
  console.error(`[transcript] Trying X API v2 for tweet ${tweetId}...`);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    });

    if (!res.ok) {
      console.error(`[transcript] X API returned ${res.status}, falling back`);
      return null;
    }

    const data = await res.json() as {
      data?: {
        id: string;
        text: string;
        created_at: string;
        author_id: string;
        note_tweet?: { text: string };
        public_metrics?: {
          like_count: number;
          retweet_count: number;
          reply_count: number;
          impression_count: number;
        };
      };
      includes?: { users?: Array<{ username: string; name: string }> };
    };

    if (!data.data) return null;

    const t = data.data;
    // Long tweets store full text in note_tweet.text; text field is truncated to ~280 chars
    const fullText = t.note_tweet?.text ?? t.text;
    const username = data.includes?.users?.[0]?.username ?? handle;
    const isLongTweet = !!t.note_tweet;

    if (isLongTweet) {
      console.error(`[transcript] Long tweet detected (note_tweet), got ${fullText.length} chars (text field was ${t.text.length} chars)`);
    }

    return JSON.stringify({
      source: "x_api",
      url: `https://x.com/${username}/status/${tweetId}`,
      author: username,
      author_name: data.includes?.users?.[0]?.name,
      created_at: t.created_at,
      text: fullText,
      word_count: fullText.split(/\s+/).length,
      is_long_tweet: isLongTweet,
      likes: t.public_metrics?.like_count ?? 0,
      retweets: t.public_metrics?.retweet_count ?? 0,
      replies: t.public_metrics?.reply_count ?? 0,
      impressions: t.public_metrics?.impression_count ?? 0,
    });
  } catch (err: any) {
    console.error(`[transcript] X API error: ${err.message}, falling back`);
    return null;
  }
}

/** Fetch a single tweet via fxtwitter (free, no auth, handles long tweets) */
async function extractTweetViaFxTwitter(tweetId: string, handle: string): Promise<string | null> {
  const url = `https://api.fxtwitter.com/${handle}/status/${tweetId}`;
  console.error(`[transcript] Trying fxtwitter for tweet ${tweetId}...`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[transcript] fxtwitter returned ${res.status}, falling back`);
      return null;
    }

    const data = await res.json() as {
      code?: number;
      tweet?: {
        text: string;
        created_at: string;
        author: { screen_name: string; name: string };
        likes: number;
        retweets: number;
        replies: number;
        views: number;
        is_note_tweet?: boolean;
      };
    };

    if (!data.tweet) return null;

    const t = data.tweet;
    console.error(`[transcript] fxtwitter: ${t.text.length} chars, ${t.is_note_tweet ? "long tweet" : "standard"}`);

    return JSON.stringify({
      source: "fxtwitter",
      url: `https://x.com/${t.author.screen_name}/status/${tweetId}`,
      author: t.author.screen_name,
      author_name: t.author.name,
      created_at: t.created_at,
      text: t.text,
      word_count: t.text.split(/\s+/).length,
      is_long_tweet: !!t.is_note_tweet,
      likes: t.likes ?? 0,
      retweets: t.retweets ?? 0,
      replies: t.replies ?? 0,
      impressions: t.views ?? 0,
    });
  } catch (err: any) {
    console.error(`[transcript] fxtwitter error: ${err.message}, falling back`);
    return null;
  }
}

/** Fetch a single tweet via vxtwitter (backup for fxtwitter) */
async function extractTweetViaVxTwitter(tweetId: string, handle: string): Promise<string | null> {
  const url = `https://api.vxtwitter.com/${handle}/status/${tweetId}`;
  console.error(`[transcript] Trying vxtwitter for tweet ${tweetId}...`);

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as {
      text?: string;
      user_name?: string;
      user_screen_name?: string;
      date?: string;
      likes?: number;
      retweets?: number;
      replies?: number;
      views?: number;
    };

    if (!data.text) return null;

    console.error(`[transcript] vxtwitter: ${data.text.length} chars`);

    return JSON.stringify({
      source: "vxtwitter",
      url: `https://x.com/${data.user_screen_name ?? handle}/status/${tweetId}`,
      author: data.user_screen_name ?? handle,
      author_name: data.user_name,
      created_at: data.date,
      text: data.text,
      word_count: data.text.split(/\s+/).length,
      likes: data.likes ?? 0,
      retweets: data.retweets ?? 0,
      replies: data.replies ?? 0,
      impressions: data.views ?? 0,
    });
  } catch (err: any) {
    console.error(`[transcript] vxtwitter error: ${err.message}`);
    return null;
  }
}

/**
 * Extract tweet content with tiered fallback:
 *   1. X API v2 (if X_BEARER_TOKEN set) — most reliable, handles note_tweet
 *   2. fxtwitter.com — free, no auth, handles long tweets
 *   3. vxtwitter.com — backup for fxtwitter
 *   4. Error with setup instructions
 */
async function extractTweet(url: string): Promise<string> {
  const parsed = parseTweetUrl(url);
  if (!parsed) {
    return JSON.stringify({ source: "tweet", url, error: "Could not parse tweet URL" });
  }

  const { handle, tweetId } = parsed;

  // Tier 1: X API (if token available)
  const apiResult = await extractTweetViaApi(tweetId, handle);
  if (apiResult) return apiResult;

  // Tier 2: fxtwitter (free, no auth)
  const fxResult = await extractTweetViaFxTwitter(tweetId, handle);
  if (fxResult) return fxResult;

  // Tier 3: vxtwitter (backup)
  const vxResult = await extractTweetViaVxTwitter(tweetId, handle);
  if (vxResult) return vxResult;

  // All tiers failed
  const hasToken = !!X_BEARER_TOKEN;
  const hint = hasToken
    ? "All extraction methods failed. The tweet may be deleted or from a private account. Ask user to paste the text or a screenshot."
    : "Tweet extraction failed. For best results, add X_BEARER_TOKEN to .env (see developer.x.com, pay-per-use, no monthly fee). Or paste the tweet text / screenshot directly.";

  return JSON.stringify({ source: "tweet", url, error: hint });
}

// ---------------------------------------------------------------------------
// Generic text extraction (articles, blogs)
// ---------------------------------------------------------------------------

async function extractText(url: string): Promise<string> {
  // Try markdown.new first (clean article extraction, handles JS-rendered pages)
  try {
    const mdRes = await fetch(`https://markdown.new/${url}`, {
      headers: { Accept: "text/markdown" },
    });
    if (mdRes.ok) {
      const md = (await mdRes.text()).trim();
      if (md.length > 100) {
        const wordCount = md.split(/\s+/).length;
        console.error(`  markdown.new: ${wordCount} words extracted`);
        return JSON.stringify({ source: "markdown.new", url, word_count: wordCount, text: md.slice(0, 50000) });
      }
    }
  } catch {
    console.error("  markdown.new unavailable, falling back to raw fetch");
  }

  // Fallback: raw fetch + regex strip
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    return JSON.stringify({ source: "text", url, error: `HTTP ${res.status}` });
  }

  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = text.split(/\s+/).length;
  return JSON.stringify({ source: "text", url, word_count: wordCount, text: text.slice(0, 50000) });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error(
      "Usage: bun run scripts/adapters/transcript/extract.ts <url>"
    );
    process.exit(1);
  }

  const type = classifyUrl(url);
  console.error(`[transcript] Extracting ${type} content from: ${url}`);

  try {
    let result: string;
    if (type === "youtube") {
      result = await extractYoutube(url);
    } else if (type === "tweet") {
      result = await extractTweet(url);
    } else {
      result = await extractText(url);
    }
    console.log(result);
  } catch (err: any) {
    console.error(`[transcript] Error: ${err.message}`);
    console.log(
      JSON.stringify({
        source: type,
        url,
        error: err.message,
        fallback: "Paste content directly or share a screenshot",
      })
    );
  }
}

main();
