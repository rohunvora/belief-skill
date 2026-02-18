import React, { useState } from "react";
import type { Call } from "../types";
import { extractChainDisplay } from "../types";
import type { LivePriceData } from "../hooks/useLivePrices";
import { useBoardData } from "../hooks/useData";
import { timeAgo, formatPrice, formatWatchers, computePnl } from "../utils";

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

/** Re-export formatPrice for consumers that import from CallCard */
export { formatPrice } from "../utils";

interface CallCardProps {
  call: Call;
  onClick?: () => void;
  livePrice?: LivePriceData;
}

export function CallCard({ call, onClick, livePrice }: CallCardProps) {
  const { getUserById, getUserByHandle } = useBoardData();
  const [linkCopied, setLinkCopied] = useState(false);
  const caller = getUserById(call.caller_id);
  const callerHandle = caller?.handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;
  const displayUser = getUserByHandle(displayHandle);

  const isResolved = call.status === "resolved";
  const isExpired = call.status === "expired";
  const isClosed = call.status === "closed";

  // P&L: resolved uses resolve_pnl, active uses live price
  const pnl = isResolved
    ? call.resolve_pnl
    : livePrice
      ? computePnl(call.entry_price, livePrice.currentPrice, call.direction)
      : null;

  const isWinning = pnl != null && pnl >= 0;
  const isLosing = pnl != null && pnl < 0;

  // Left border color based on status + performance
  const borderAccent = isResolved
    ? isWinning
      ? "border-l-green-500"
      : "border-l-red-500"
    : isExpired
      ? "border-l-gray-300"
      : isClosed
        ? "border-l-gray-400"
        : isWinning
          ? "border-l-green-400"
          : isLosing
            ? "border-l-red-400"
            : "border-l-gray-200";

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/call/${call.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    });
  };

  return (
    <article
      className={`border border-gray-200 border-l-[3px] ${borderAccent} rounded-lg p-4 bg-white hover:border-gray-300 transition-colors cursor-pointer ${isExpired ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Row 1: WHO — identity first */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar handle={displayHandle} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <a
                href={`#/u/${displayHandle}`}
                className="text-sm font-semibold text-gray-900 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{displayHandle}
              </a>
              {/* Twitter/X external link */}
              {displayUser?.twitter && (
                <a
                  href={`https://x.com/${displayUser.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => e.stopPropagation()}
                  title={`@${displayUser.twitter} on X`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {call.source_handle && call.source_handle !== callerHandle && (
                <span className="text-xs text-gray-500">
                  via{" "}
                  <a
                    href={`#/u/${callerHandle}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{callerHandle}
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500" title={call.created_at}>
          {timeAgo(call.created_at)}
        </span>
      </div>

      {/* Row 2: WHAT — human voice for sourced calls, thesis for originals */}
      {(() => {
        const chain = extractChainDisplay(call);
        if (chain.source_said && call.source_handle) {
          return (
            <>
              <p
                className="text-base font-semibold text-gray-900 leading-snug mb-1 line-clamp-2"
                title={call.source_quote || chain.source_said}
              >
                &ldquo;{chain.source_said}&rdquo;
              </p>
              {/* Row 3: bridge — the reasoning trail from mechanism → evidence → ticker */}
              {chain.implies && (
                <p className="text-xs text-gray-500 leading-snug mb-2 line-clamp-2 lowercase">
                  {chain.implies} → <span className="font-semibold text-gray-700 normal-case">{call.ticker}</span>
                  {chain.found_because && (
                    <span className="text-gray-400"> — {chain.found_because}</span>
                  )}
                </p>
              )}
            </>
          );
        }
        // Original calls: thesis as headline (current behavior)
        return (
          <p className="text-base font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
            {call.thesis}
          </p>
        );
      })()}

      {/* Row 4: HOW TO PROFIT — trade data with P&L as punchline */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <a
            href={`#/?ticker=${call.ticker}`}
            className="text-sm font-bold text-gray-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {call.ticker}
          </a>
          <span
            className={`text-xs font-semibold ${
              call.direction === "long" ? "text-green-600" : "text-red-600"
            }`}
          >
            {call.direction === "long" ? "Long" : "Short"}
          </span>
          <span className="text-xs text-gray-500">
            {formatPrice(call.entry_price)}
          </span>
          {call.instrument && (
            <span className="text-xs text-gray-500">{call.instrument}</span>
          )}
        </div>

        {/* P&L — the punchline, not the headline */}
        {pnl != null && (
          <span
            className={`text-xl font-extrabold tabular-nums tracking-tight ${
              pnl >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {pnl >= 0 ? "+" : ""}
            {pnl.toFixed(1)}%
          </span>
        )}

        {isExpired && pnl == null && (
          <span className="text-xs font-bold text-gray-500">EXPIRED</span>
        )}
        {isClosed && pnl == null && (
          <span className="text-xs font-bold text-gray-500">CLOSED</span>
        )}
      </div>

      {/* Row 4: HOW TO LEARN — reasoning breadcrumb with source link */}
      {call.scan_source && (
        <p className="text-xs text-gray-500 mb-2 truncate">
          {call.source_url ? (
            <a
              href={call.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {call.scan_source}
            </a>
          ) : (
            call.scan_source
          )}
          {call.reasoning && (
            <span className="text-gray-400"> → </span>
          )}
          {call.reasoning && (
            <span>{call.reasoning.length > 80 ? call.reasoning.slice(0, 80) + "..." : call.reasoning}</span>
          )}
        </p>
      )}
      {!call.scan_source && call.reasoning && (
        <p className="text-xs text-gray-500 mb-2 truncate">
          {call.reasoning.length > 100 ? call.reasoning.slice(0, 100) + "..." : call.reasoning}
        </p>
      )}

      {/* Social proof footer + copy link */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {call.watchers > 0 && (
            <span className="font-medium">
              {formatWatchers(call.watchers)} watching
            </span>
          )}
          {isResolved && call.resolve_pnl != null && (
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                call.resolve_pnl >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {call.resolve_pnl >= 0 ? "CALLED IT" : "MISSED"}
            </span>
          )}
        </div>
        <button
          onClick={copyLink}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy link"
        >
          {linkCopied ? (
            <span className="text-[11px]">Copied</span>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
}
