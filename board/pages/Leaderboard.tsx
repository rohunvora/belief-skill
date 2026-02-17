import React, { useState } from "react";
import { leaderboard, calls } from "../mock-data";
import type { LeaderboardEntry } from "../types";

type Period = "week" | "month" | "all";
type Category = "all" | "stock" | "options" | "kalshi" | "perps";

const periods: { key: Period; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All Time" },
];

const categories: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stock", label: "Stocks" },
  { key: "options", label: "Options" },
  { key: "kalshi", label: "Prediction Markets" },
  { key: "perps", label: "Perps" },
];

// Biggest resolved calls for the sidebar
const biggestCalls = calls
  .filter((c) => c.status === "resolved" && c.resolve_pnl != null && c.resolve_pnl > 0)
  .sort((a, b) => (b.resolve_pnl ?? 0) - (a.resolve_pnl ?? 0))
  .slice(0, 3);

function formatPnl(pnl: number | null): string {
  if (pnl == null) return "--";
  return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%`;
}

function formatAccuracy(accuracy: number | null): string {
  if (accuracy == null) return "--";
  return `${Math.round(accuracy * 100)}%`;
}

function formatWatchers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const { rank, user, original_calls, curated_calls } = entry;
  const initial = user.handle.charAt(0).toUpperCase();

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => {
        window.location.hash = `/u/${user.handle}`;
      }}
    >
      <td className="py-3 px-3 text-sm text-gray-400 font-medium">{rank}</td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
            {initial}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">
              @{user.handle}
            </span>
            {user.verified && (
              <span className="ml-1 text-blue-500 text-xs" title="Verified">
                &#10003;
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-sm text-gray-700 text-right">
        {formatAccuracy(user.accuracy)}
      </td>
      <td className="py-3 px-3 text-sm text-right">
        <span
          className={
            user.total_pnl != null && user.total_pnl >= 0
              ? "text-green-600 font-medium"
              : user.total_pnl != null
              ? "text-red-600 font-medium"
              : "text-gray-400"
          }
        >
          {formatPnl(user.total_pnl)}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-gray-600 text-right">
        <span>{original_calls}</span>
        <span className="text-gray-300 mx-0.5">/</span>
        <span className="text-gray-400">{curated_calls}</span>
      </td>
      <td className="py-3 px-3 text-sm text-gray-500 text-right">
        {formatWatchers(user.watchers)}
      </td>
    </tr>
  );
}

export function Leaderboard() {
  const [period, setPeriod] = useState<Period>("all");
  const [category, setCategory] = useState<Category>("all");

  // In production, period and category would filter server-side.
  // For mock, we show all entries regardless of filter selection.
  const entries: LeaderboardEntry[] = leaderboard;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Leaderboard</h1>
        <p className="text-sm text-gray-500">
          Ranked by accuracy and P&L. Every call is tracked and verified.
        </p>
      </div>

      <div className="lg:flex lg:gap-6">
        {/* Main table section */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Period toggles */}
            <div className="flex border border-gray-200 rounded-md overflow-hidden">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.key
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    category === c.key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Calls
                    <span className="block text-[10px] normal-case tracking-normal font-normal text-gray-300">
                      orig / curated
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Watchers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <LeaderboardRow key={entry.user.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Biggest Calls This Week */}
        <div className="lg:w-72 mt-6 lg:mt-0 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Biggest Calls This Week
          </h2>
          <div className="space-y-3">
            {biggestCalls.map((call) => (
              <a
                key={call.id}
                href={`#/call/${call.id}`}
                className="block border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-800">
                    {call.ticker}
                  </span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    +{call.resolve_pnl}%
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-snug line-clamp-2">
                  {call.thesis}
                </p>
                <div className="text-xs text-gray-400 mt-1.5">
                  {formatWatchers(call.watchers)} watching
                </div>
              </a>
            ))}
            {biggestCalls.length === 0 && (
              <p className="text-xs text-gray-400">
                No resolved calls this week yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
