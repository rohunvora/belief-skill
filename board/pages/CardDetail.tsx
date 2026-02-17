import React from "react";
import type { Call, Comment, PriceLadderStep } from "../types";
import { getCallById, getCommentsForCall, getUserById } from "../mock-data";
import { Avatar, formatPrice } from "../components/CallCard";

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PriceLadder({ steps, entry }: { steps: PriceLadderStep[]; entry: number }) {
  const sorted = [...steps].sort((a, b) => a.price - b.price);
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.pnl_pct)));

  return (
    <div className="space-y-1.5">
      {sorted.map((step, i) => {
        const isEntry = step.pnl_pct === 0;
        const isPositive = step.pnl_pct > 0;
        const isNegative = step.pnl_pct < 0;
        const barWidth = maxAbs > 0 ? Math.abs(step.pnl_pct) / maxAbs * 100 : 0;

        return (
          <div key={i} className="grid grid-cols-[80px_60px_1fr] gap-2 items-center text-sm">
            <span className="font-mono text-gray-700 text-right">
              {formatPrice(step.price)}
            </span>
            <span
              className={`font-mono text-right text-xs font-medium ${
                isEntry
                  ? "text-gray-500"
                  : isPositive
                    ? "text-green-700"
                    : "text-red-600"
              }`}
            >
              {isEntry
                ? "—"
                : `${isPositive ? "+" : ""}${step.pnl_pct}%`}
            </span>
            <div className="flex items-center gap-2">
              {!isEntry && (
                <div
                  className={`h-4 rounded-sm ${isPositive ? "bg-green-200" : "bg-red-200"}`}
                  style={{ width: `${Math.max(barWidth, 4)}%`, maxWidth: "60%" }}
                />
              )}
              {isEntry && (
                <div className="h-4 w-1 bg-gray-400 rounded-sm" />
              )}
              <span className={`text-xs ${isEntry ? "text-gray-600 font-medium" : "text-gray-500"}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const user = getUserById(comment.user_id);
  const handle = user?.handle ?? "unknown";

  return (
    <div className="flex gap-3 py-3">
      <a href={`#/u/${handle}`} onClick={(e) => e.stopPropagation()}>
        <Avatar handle={handle} size="sm" />
      </a>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">
          <a href={`#/u/${handle}`} className="text-gray-700 hover:underline font-medium">
            @{handle}
          </a>
          {" \u00b7 "}
          {timeAgo(comment.created_at)}
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}

export function CardDetail({ id }: { id: string }) {
  const call = getCallById(id);

  if (!call) {
    return (
      <div className="max-w-2xl mx-auto">
        <a href="#/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          &larr; Back to feed
        </a>
        <p className="text-gray-500">Call not found.</p>
      </div>
    );
  }

  const caller = getUserById(call.caller_id);
  const callerHandle = caller?.handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;
  const comments = getCommentsForCall(call.id);

  const isResolved = call.status === "resolved";
  const isExpired = call.status === "expired";
  const isClosed = call.status === "closed";
  const hasRichDetail = !!(call.source_quote || call.reasoning || call.price_ladder);

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; Back to feed
      </a>

      <article className="border border-gray-200 rounded-lg bg-white p-5">
        {/* Scan source badge */}
        {call.scan_source && (
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">
            from {call.scan_source}
          </div>
        )}

        {/* Attribution with avatar */}
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar handle={displayHandle} size="md" />
          <div className="text-sm text-gray-500">
            {call.source_handle ? (
              <>
                <a href={`#/u/${call.source_handle}`} className="text-gray-800 font-medium hover:underline">
                  @{call.source_handle}
                </a>
                {"'s take"}
                {" \u00b7 routed by "}
                <a href={`#/u/${callerHandle}`} className="text-gray-600 hover:underline">
                  @{callerHandle}
                </a>
              </>
            ) : (
              <a href={`#/u/${callerHandle}`} className="text-gray-800 font-medium hover:underline">
                @{callerHandle}
              </a>
            )}
            <div className="text-xs text-gray-400 mt-0.5">
              {formatDate(call.created_at)}
              {call.call_type === "curated" && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded">
                  curated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thesis — the hook */}
        <h1 className="text-xl font-bold text-gray-900 mb-1 leading-snug">
          {call.thesis}
        </h1>

        {/* Ticker + direction pills */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">{call.ticker}</span>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              call.direction === "long"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {call.direction === "long" ? "Long" : "Short"}
          </span>
          {call.instrument && (
            <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
              {call.instrument}
            </span>
          )}
          {call.platform && (
            <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
              {call.platform}
            </span>
          )}
        </div>

        {/* Resolution badge */}
        {isResolved && call.resolve_pnl != null && (
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1.5 text-sm font-bold rounded ${
                call.resolve_pnl >= 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {call.resolve_pnl >= 0 ? "CALLED IT" : "MISSED"}{" "}
              {call.resolve_pnl >= 0 ? "+" : ""}{call.resolve_pnl}%
            </span>
          </div>
        )}
        {isExpired && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1.5 text-sm font-bold rounded bg-gray-100 text-gray-500">
              EXPIRED
            </span>
          </div>
        )}
        {isClosed && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1.5 text-sm font-bold rounded bg-yellow-100 text-yellow-700">
              CLOSED
            </span>
          </div>
        )}

        {/* Source quote */}
        {call.source_quote && (
          <div className="border-l-2 border-gray-300 pl-3 mb-4">
            <p className="text-sm text-gray-600 italic leading-relaxed">
              "{call.source_quote}"
            </p>
            {call.source_handle && (
              <p className="text-xs text-gray-400 mt-1">— @{call.source_handle}</p>
            )}
          </div>
        )}

        {/* Reasoning */}
        {call.reasoning && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Why {call.ticker}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{call.reasoning}</p>
          </div>
        )}

        {/* Edge */}
        {call.edge && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Edge
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{call.edge}</p>
          </div>
        )}

        {/* Price ladder */}
        {call.price_ladder && call.price_ladder.length > 0 && (
          <div className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Price Ladder · {formatPrice(call.entry_price)} entry
            </div>
            <PriceLadder steps={call.price_ladder} entry={call.entry_price} />
          </div>
        )}

        {/* Trade info (for cards without a ladder) */}
        {!call.price_ladder && (
          <div className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Trade
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div>
                <span className="text-gray-500">Entry:</span>{" "}
                <span className="font-medium text-gray-900">{formatPrice(call.entry_price)}</span>
              </div>
              <div>
                <span className="text-gray-500">Breakeven:</span>{" "}
                <span className="font-medium text-gray-900">{call.breakeven}</span>
              </div>
            </div>
          </div>
        )}

        {/* Counter */}
        {call.counter && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Counter
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{call.counter}</p>
          </div>
        )}

        {/* Kills */}
        <div className="border border-red-200 rounded-md p-3 mb-4 bg-red-50">
          <div className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">
            Dies if
          </div>
          <p className="text-sm text-red-800">{call.kills}</p>
        </div>

        {/* Alternative */}
        {call.alternative && (
          <div className="text-xs text-gray-500 mb-4">
            <span className="font-medium">Alt:</span> {call.alternative}
          </div>
        )}

        {/* Resolution box */}
        {(isResolved || isExpired || isClosed) && (
          <div
            className={`border rounded-md p-4 mb-4 ${
              isResolved && call.resolve_pnl != null && call.resolve_pnl >= 0
                ? "border-green-200 bg-green-50"
                : isResolved
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50"
            }`}
          >
            <div
              className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                isResolved && call.resolve_pnl != null && call.resolve_pnl >= 0
                  ? "text-green-600"
                  : isResolved
                    ? "text-red-500"
                    : "text-gray-500"
              }`}
            >
              Resolution
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                {formatDate(call.created_at)}
                {call.resolve_date && (
                  <> {" \u2192 "} {formatDate(call.resolve_date)}</>
                )}
              </div>
              {call.resolve_pnl != null && (
                <div className={`text-lg font-bold ${call.resolve_pnl >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {call.resolve_pnl >= 0 ? "+" : ""}{call.resolve_pnl}%
                  {call.resolve_price != null && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      at {formatPrice(call.resolve_price)}
                    </span>
                  )}
                </div>
              )}
              {call.resolve_note && (
                <div className="text-gray-600 italic pt-1">{call.resolve_note}</div>
              )}
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
          <span>{call.votes > 0 ? "+" : ""}{call.votes} votes</span>
          <span>
            {call.watchers >= 1000
              ? `${(call.watchers / 1000).toFixed(1)}K`
              : call.watchers}{" "}watching
          </span>
          <button className="text-gray-500 hover:text-gray-700">Share</button>
          <a href="#/call/new" className="ml-auto text-green-600 hover:text-green-700 font-medium">
            Make Similar Call
          </a>
        </div>
      </article>

      {/* Comments */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          Comments ({comments.length})
        </h2>
        {comments.length > 0 ? (
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 px-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
        )}
      </div>
    </div>
  );
}
