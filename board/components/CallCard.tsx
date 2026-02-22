import React, { useState } from "react";
import type { Call } from "../types";
import type { LivePriceData } from "../hooks/useLivePrices";
import { timeAgo, formatPrice, computePnl } from "../utils";
import { getLogoUrl } from "../logos";

/** Avatar circle — uses provided avatar URL or falls back to letter */
export function Avatar({
  handle,
  avatarUrl,
  size = "sm",
}: {
  handle: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {

  const sizeClass =
    size === "lg"
      ? "w-10 h-10 text-base"
      : size === "md"
        ? "w-7 h-7 text-xs"
        : "w-5 h-5 text-xs";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={handle}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }

  const letter = (handle[0] ?? "?").toUpperCase();
  const colors = [
    "bg-gray-500",
    "bg-gray-600",
    "bg-gray-700",
    "bg-gray-500",
    "bg-gray-600",
    "bg-gray-700",
    "bg-gray-500",
    "bg-gray-600",
  ];
  let hash = 0;
  for (const c of handle) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <span
      className={`${sizeClass} ${color} rounded-full inline-flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {letter}
    </span>
  );
}

/** Inline source-site icon — SVG for known domains, favicon fallback */
export function SourceIcon({ url }: { url: string }) {
  const size = "w-3.5 h-3.5 shrink-0";
  let hostname: string;
  try { hostname = new URL(url).hostname.replace("www.", ""); } catch { return null; }

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return (
      <svg className={size} viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
      </svg>
    );
  }
  if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
    return (
      <svg className={size} viewBox="0 0 24 24" fill="#000000">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }
  if (hostname.includes("substack.com")) {
    return (
      <svg className={size} viewBox="0 0 24 24" fill="#FF6719">
        <path d="M22.54 6.42H1.46V4.2h21.08zM1.46 10.18v2.22h21.08v-2.22zM1.46 16.12v5.66l10.54-5.66 10.54 5.66v-5.66z"/>
      </svg>
    );
  }
  // Fallback: Google favicon service
  return <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} className={`${size} rounded-sm`} alt={hostname} />;
}

/** Inline ticker logo — company/coin/platform logo with letter fallback */
function TickerLogo({ ticker, platform, instrument }: {
  ticker: string;
  platform: string | null;
  instrument: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const url = getLogoUrl(ticker, platform, instrument);

  if (!url || failed) {
    const letter = (ticker[0] ?? "?").toUpperCase();
    let hash = 0;
    for (const c of ticker) hash = (hash * 31 + c.charCodeAt(0)) | 0;
    const bg = ["bg-gray-500", "bg-gray-600", "bg-gray-700"][Math.abs(hash) % 3];
    return (
      <span className={`w-4 h-4 ${bg} rounded-full inline-flex items-center justify-center text-white text-[10px] font-bold shrink-0 leading-none`}>
        {letter}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={ticker}
      className="w-4 h-4 rounded-full object-contain bg-white shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Extract a card-friendly quote from available data.
 * Priority: headline_quote → sentence-truncated source_quote → thesis
 */
function getCardQuote(call: Call): string {
  // Best case: skill already extracted a headline
  if (call.headline_quote) return call.headline_quote;

  // Fallback: sentence-boundary truncation of source_quote
  if (call.source_quote) {
    const quote = call.source_quote;
    if (quote.length <= 120) return quote;

    // Split on sentence boundaries (period, exclamation, question, semicolon)
    const sentences = quote.match(/[^.!?;]+[.!?;]+(\s|$)/g);
    if (sentences && sentences.length > 0) {
      let result = sentences[0].trim();
      if (result.length <= 120) {
        for (let i = 1; i < sentences.length; i++) {
          const next = result + " " + sentences[i].trim();
          if (next.length > 120) break;
          result = next;
        }
        if (result.length > 15 && result.length <= 120) return result;
      }
    }

    // No clean sentence break under 120 — truncate at word boundary
    const truncated = quote.slice(0, 117);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 30) return truncated.slice(0, lastSpace) + "...";
    return truncated + "...";
  }

  // Last resort
  return call.thesis;
}

/** Re-export formatPrice for consumers that import from CallCard */
export { formatPrice } from "../utils";

interface CallCardProps {
  call: Call & { caller_handle?: string | null; caller_avatar_url?: string | null; author_avatar_url?: string | null };
  onClick?: () => void;
  livePrice?: LivePriceData;
  compact?: boolean; // when true, omit attribution row (used inside source groups)
}

export function CallCard({ call, onClick, livePrice, compact }: CallCardProps) {
  const callerHandle = call.caller_handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;
  const displayAvatarUrl = call.source_handle ? call.author_avatar_url : call.caller_avatar_url;

  // P&L always from live price
  const pnl = livePrice
    ? computePnl(call.entry_price, livePrice.currentPrice, call.direction)
    : null;

  const isLong = call.direction === "long";
  const dirArrow = isLong ? "▲" : "▼";
  const dirColor = isLong ? "text-green-600" : "text-red-600";

  // Card quote — human's words, not AI slop
  const quoteText = getCardQuote(call);

  return (
    <article
      className="py-3 cursor-pointer bg-white active:bg-gray-50"
      onClick={onClick}
    >
      {/* Row 1: Quote — the human signal (hero) */}
      <p className="text-[14px] text-gray-900 leading-snug line-clamp-2 mb-1.5">
        &ldquo;{quoteText}&rdquo;
      </p>

      {/* Row 2: Attribution — who said it, where */}
      {!compact && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Avatar handle={displayHandle} avatarUrl={displayAvatarUrl} size="sm" />
          <span className="text-[12px] font-medium text-gray-600">@{displayHandle}</span>
          {call.source_url && (
            <a
              href={call.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="opacity-60 hover:opacity-100 active:opacity-100 transition-opacity"
              title={call.source_url}
            >
              <SourceIcon url={call.source_url} />
            </a>
          )}
          {call.scan_source && (
            <span className="text-[11px] text-gray-400">· {call.scan_source}</span>
          )}
          <span className="text-[11px] text-gray-400">· {timeAgo(call.source_date ?? call.created_at)}</span>
        </div>
      )}

      {/* Row 3: Ticker + price + P&L (the trade output, secondary) */}
      <div className="flex items-center gap-1.5">
        <TickerLogo ticker={call.ticker} platform={call.platform} instrument={call.instrument} />
        <span className="text-[12px] font-semibold text-gray-700">{call.ticker}</span>
        <span className={`text-[11px] ${dirColor}`}>{dirArrow}</span>
        <span className="text-[11px] text-gray-400">{formatPrice(call.entry_price)}</span>
        {livePrice && (
          <>
            <span className="text-[11px] text-gray-300">→</span>
            <span className="text-[11px] text-gray-400">{formatPrice(livePrice.currentPrice)}</span>
          </>
        )}
        <span className="flex-1" />
        {pnl != null && (
          <span
            className={`text-[13px] font-bold tabular-nums ${
              pnl >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
          </span>
        )}
      </div>
    </article>
  );
}
