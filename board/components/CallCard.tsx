import React from "react";
import type { Call } from "../types";
import type { LivePriceData } from "../hooks/useLivePrices";
import { getUserById, getUserByHandle } from "../mock-data";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString()}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `${(price * 100).toFixed(0)}c`;
}

/** Avatar circle — uses twitter pfp if available, falls back to letter */
export function Avatar({
  handle,
  size = "sm",
}: {
  handle: string;
  size?: "sm" | "md" | "lg";
}) {
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
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
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

/** Compact live price line for feed cards */
function LivePriceLine({
  livePrice,
  direction,
}: {
  livePrice: LivePriceData;
  direction: "long" | "short";
}) {
  // Position is winning if long+up or short+down
  const isWinning =
    (direction === "long" && livePrice.changePercent >= 0) ||
    (direction === "short" && livePrice.changePercent <= 0);
  const colorClass = isWinning ? "text-green-600" : "text-red-500";
  const arrow = livePrice.changePercent >= 0 ? "\u2191" : "\u2193";
  const sign = livePrice.changePercent >= 0 ? "+" : "";

  return (
    <div className={`text-xs font-medium mb-2 ${colorClass}`}>
      {formatPrice(livePrice.currentPrice)}{" "}
      <span className="opacity-80">
        {arrow} {sign}
        {livePrice.changePercent.toFixed(1)}%
      </span>
    </div>
  );
}

interface CallCardProps {
  call: Call;
  onClick?: () => void;
  livePrice?: LivePriceData;
}

export function CallCard({ call, onClick, livePrice }: CallCardProps) {
  const caller = getUserById(call.caller_id);
  const callerHandle = caller?.handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;

  const isResolved = call.status === "resolved";
  const isExpired = call.status === "expired";
  const isClosed = call.status === "closed";

  return (
    <article
      className={`border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors cursor-pointer ${
        isResolved ? "ring-1 ring-green-200" : ""
      } ${isExpired ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Attribution line with avatar */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar handle={displayHandle} size="sm" />
        <div className="text-xs text-gray-500">
          {call.source_handle ? (
            <>
              <a
                href={`#/u/${call.source_handle}`}
                className="text-gray-700 font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{call.source_handle}
              </a>
              {call.call_type === "direct" ? "'s call" :
               call.call_type === "inspired" ? "'s framework" : "'s thesis"}
              {" \u00b7 routed by "}
              <a
                href={`#/u/${callerHandle}`}
                className="text-gray-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{callerHandle}
              </a>
            </>
          ) : (
            <a
              href={`#/u/${callerHandle}`}
              className="text-gray-700 font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              @{callerHandle}
            </a>
          )}
          {" \u00b7 "}
          {timeAgo(call.created_at)}
        </div>
      </div>

      {/* Thesis */}
      <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
        {call.thesis}
      </h3>

      {/* Resolution badge */}
      {isResolved && call.resolve_pnl != null && (
        <div className="mb-2">
          <span
            className={`inline-block px-2 py-1 text-xs font-bold rounded ${
              call.resolve_pnl >= 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {call.resolve_pnl >= 0 ? "CALLED IT" : "MISSED"}{" "}
            {call.resolve_pnl >= 0 ? "+" : ""}
            {call.resolve_pnl}%
          </span>
        </div>
      )}

      {isExpired && (
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-500">
            EXPIRED
          </span>
        </div>
      )}

      {isClosed && (
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-700">
            CLOSED
          </span>
        </div>
      )}

      {/* Ticker + direction only */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-800">{call.ticker}</span>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            call.direction === "long"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {call.direction === "long" ? "Long" : "Short"}
        </span>
        {call.call_type !== "original" && (
          <span className={`px-1.5 py-0.5 text-[10px] rounded ${
            call.call_type === "direct" ? "bg-green-50 text-green-600" :
            call.call_type === "derived" ? "bg-blue-50 text-blue-600" :
            "bg-purple-50 text-purple-600"
          }`}>
            {call.call_type}
          </span>
        )}
        {call.instrument && (
          <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
            {call.instrument}
          </span>
        )}
      </div>

      {/* Live price */}
      {livePrice && (
        <LivePriceLine
          livePrice={livePrice}
          direction={call.direction}
        />
      )}

      {/* Engagement */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>
          {call.votes > 0 ? "+" : ""}
          {call.votes}
        </span>
        <span>
          {call.watchers >= 1000
            ? `${(call.watchers / 1000).toFixed(1)}K`
            : call.watchers}{" "}
          watching
        </span>
        <span>{call.comments} comments</span>
      </div>
    </article>
  );
}
