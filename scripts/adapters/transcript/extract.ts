/**
 * Transcript Extractor
 *
 * Extracts text content from URLs for thesis extraction.
 * YouTube: uses yt-dlp for auto-captions. Text URLs: raw fetch + HTML strip.
 *
 * Usage:
 *   bun run scripts/adapters/transcript/extract.ts "https://youtube.com/watch?v=xxx"
 *   bun run scripts/adapters/transcript/extract.ts "https://example.com/article"
 *
 * Requires: yt-dlp (brew install yt-dlp)
 */

import { $ } from "bun";
import { tmpdir } from "os";
import { join } from "path";

// ---------------------------------------------------------------------------
// URL classification
// ---------------------------------------------------------------------------

type UrlType = "youtube" | "text";

function classifyUrl(url: string): UrlType {
  const u = url.toLowerCase();
  if (
    u.includes("youtube.com/watch") ||
    u.includes("youtu.be/") ||
    u.includes("youtube.com/live")
  )
    return "youtube";
  return "text";
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
// Generic text extraction (articles, tweets, blogs)
// ---------------------------------------------------------------------------

async function extractText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    return JSON.stringify({
      source: "text",
      url,
      error: `HTTP ${res.status} — use WebFetch or ask user to paste content`,
    });
  }

  const html = await res.text();

  // Strip HTML tags, scripts, styles
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = text.split(/\s+/).length;

  return JSON.stringify({
    source: "text",
    url,
    word_count: wordCount,
    text: text.slice(0, 50000),
  });
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
    const result =
      type === "youtube" ? await extractYoutube(url) : await extractText(url);
    console.log(result);
  } catch (err: any) {
    console.error(`[transcript] Error: ${err.message}`);
    console.log(
      JSON.stringify({
        source: type,
        url,
        error: err.message,
        fallback: "Use WebFetch or ask user to paste content",
      })
    );
  }
}

main();
