import React, { useMemo } from "react";
import type { Call } from "../types";
import { Avatar } from "../components/CallCard";
import { useBoardData } from "../hooks/useData";
import { formatWatchers } from "../utils";

function formatPnl(pnl: number | null): string {
  if (pnl == null) return "--";
  return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%`;
}

export function Leaderboard() {
  const { calls, users, loading } = useBoardData();

  // Build leaderboard entries
  const entries = useMemo(() => {
    return users
      .map((user) => {
        const userCalls = calls.filter((c) => c.caller_id === user.id);
        return {
          user: { ...user, total_calls: userCalls.length },
          originalCalls: userCalls.filter((c) => c.call_type === "original").length,
          curatedCalls: userCalls.filter((c) => c.call_type !== "original").length,
        };
      })
      .filter((e) => e.user.total_calls > 0)
      .sort((a, b) => {
        // Sort by accuracy first (null last), then by total calls
        const accA = a.user.accuracy ?? -1;
        const accB = b.user.accuracy ?? -1;
        if (accA !== accB) return accB - accA;
        return b.user.total_calls - a.user.total_calls;
      });
  }, [users, calls]);

  // Biggest resolved calls
  const biggestCalls = useMemo(
    () =>
      calls
        .filter((c) => c.status === "resolved" && c.resolve_pnl != null && c.resolve_pnl > 0)
        .sort((a, b) => (b.resolve_pnl ?? 0) - (a.resolve_pnl ?? 0))
        .slice(0, 3),
    [calls]
  );

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Leaderboard</h1>
        <p className="text-sm text-gray-500">
          {entries.length} callers · {calls.length} total calls ·{" "}
          {formatWatchers(users.reduce((s, u) => s + u.watchers, 0))} watching
        </p>
      </div>

      {/* Biggest calls — above the leaderboard, always visible */}
      {biggestCalls.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Biggest wins
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {biggestCalls.map((call) => (
              <a
                key={call.id}
                href={`#/call/${call.id}`}
                className="shrink-0 border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors w-52"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">{call.ticker}</span>
                  <span className="text-lg font-extrabold text-green-600 tabular-nums">
                    +{call.resolve_pnl}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-1">{call.thesis}</p>
                <span className="text-xs text-gray-500">
                  {call.source_handle ? `@${call.source_handle}` : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Ranked entries — card-based, not table */}
      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;
          const accuracy = entry.user.accuracy != null ? Math.round(entry.user.accuracy * 100) : null;
          const accColor =
            accuracy != null
              ? accuracy >= 60
                ? "text-green-600"
                : accuracy < 40
                  ? "text-red-600"
                  : "text-gray-900"
              : "text-gray-300";

          return (
            <div
              key={entry.user.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isTop3
                  ? "bg-white border border-gray-200 hover:border-gray-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                window.location.hash = `/u/${entry.user.handle}`;
              }}
            >
              {/* Rank */}
              <span
                className={`w-7 text-right font-bold tabular-nums ${
                  rank === 1
                    ? "text-yellow-500 text-xl"
                    : rank === 2
                      ? "text-gray-500 text-lg"
                      : rank === 3
                        ? "text-orange-400 text-lg"
                        : "text-gray-300 text-sm"
                }`}
              >
                {rank}
              </span>

              {/* Avatar */}
              <Avatar handle={entry.user.handle} size={isTop3 ? "md" : "sm"} />

              {/* Name + calls */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold text-gray-900 truncate ${isTop3 ? "text-base" : "text-sm"}`}>
                    @{entry.user.handle}
                  </span>
                  {entry.user.verified && (
                    <svg className="w-4 h-4 text-gray-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {entry.user.total_calls} calls · {formatWatchers(entry.user.watchers)} watching
                </span>
              </div>

              {/* P&L */}
              <span
                className={`text-sm font-bold tabular-nums ${
                  entry.user.total_pnl != null && entry.user.total_pnl >= 0
                    ? "text-green-600"
                    : entry.user.total_pnl != null
                      ? "text-red-600"
                      : "text-gray-300"
                }`}
              >
                {formatPnl(entry.user.total_pnl)}
              </span>

              {/* Hero: Accuracy */}
              <span className={`text-xl font-extrabold tabular-nums ${accColor} ${isTop3 ? "text-2xl" : ""}`}>
                {accuracy != null ? `${accuracy}%` : "--"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
