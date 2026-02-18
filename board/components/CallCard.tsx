import React from "react";
import type { Call } from "../types";
import { extractChainDisplay } from "../types";
import type { LivePriceData } from "../hooks/useLivePrices";
import { useBoardData } from "../hooks/useData";
import { timeAgo, formatPrice, computePnl } from "../utils";

/** Avatar circle — uses twitter pfp if available, falls back to letter */
export function Avatar({
  handle,
  size = "sm",
}: {
  handle: string;
  size?: "sm" | "md" | "lg";
}) {
  const { getUserByHandle } = useBoardData();
  const user = getUserByHandle(handle);
  const avatarUrl = user?.avatar_url;

  const sizeClass =
    size === "lg"
      ? "w-10 h-10 text-base"
      : size === "md"
        ? "w-7 h-7 text-xs"
        : "w-5 h-5 text-[10px]";

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
function SourceIcon({ url }: { url: string }) {
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

/** Re-export formatPrice for consumers that import from CallCard */
export { formatPrice } from "../utils";

interface CallCardProps {
  call: Call;
  onClick?: () => void;
  livePrice?: LivePriceData;
}

export function CallCard({ call, onClick, livePrice }: CallCardProps) {
  const { getUserById } = useBoardData();
  const caller = getUserById(call.caller_id);
  const callerHandle = caller?.handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;

  const isResolved = call.status === "resolved";
  const isClosed = call.status === "closed";
  const isExpired = call.status === "expired";

  // P&L: resolved uses resolve_pnl, active uses live price
  const pnl = isResolved
    ? call.resolve_pnl
    : livePrice
      ? computePnl(call.entry_price, livePrice.currentPrice, call.direction)
      : null;

  // Direction styling
  const isLong = call.direction === "long";
  const dirArrow = isLong ? "▲" : "▼";
  const dirBadgeBg = isLong ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700";

  // Thesis text: for sourced calls use source_said, for originals use thesis
  const chain = extractChainDisplay(call);
  const thesisText = (chain.source_said && call.source_handle)
    ? chain.source_said
    : call.thesis;

  return (
    <article
      className={`py-3 cursor-pointer ${isExpired ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Row 1: Avatar + @handle + source icon + time */}
      <div className="flex items-center gap-2 mb-1">
        <Avatar handle={displayHandle} size="md" />
        <span className="text-[15px] font-semibold text-gray-900">@{displayHandle}</span>
        {call.source_url && (
          <a
            href={call.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-60 hover:opacity-100 transition-opacity"
            title={call.source_url}
          >
            <SourceIcon url={call.source_url} />
          </a>
        )}
        <span className="text-[11px] text-gray-400">· {timeAgo(call.created_at)}</span>
      </div>

      {/* Row 2: Thesis — the main content */}
      <p className="text-[15px] text-gray-900 leading-snug line-clamp-2 mb-2">
        {thesisText}
      </p>

      {/* Row 3: Ticker badge + price + P&L / status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${dirBadgeBg} rounded px-1.5 py-0.5`}>
            {dirArrow} {call.ticker}
          </span>
          <span className="text-xs text-gray-400">{formatPrice(call.entry_price)}</span>
        </div>
        <div className="flex items-center gap-2">
          {pnl != null && (
            <span
              className={`text-sm font-bold tabular-nums ${
                pnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
            </span>
          )}
          {isResolved && call.resolve_pnl != null && (
            <span
              className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                call.resolve_pnl >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {call.resolve_pnl >= 0 ? "HIT" : "MISS"}
            </span>
          )}
          {isExpired && pnl == null && (
            <span className="text-[10px] font-bold text-gray-400">EXPIRED</span>
          )}
          {isClosed && pnl == null && (
            <span className="text-[10px] font-bold text-gray-400">CLOSED</span>
          )}
        </div>
      </div>
    </article>
  );
}
