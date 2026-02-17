import React, { useState } from "react";
import type { Call } from "../types";
import { getUserByHandle, getCallsByUser, calls as allCalls } from "../mock-data";
import { CallCard } from "../components/CallCard";

type Tab = "active" | "resolved" | "all";

function formatPnl(pnl: number | null): string {
  if (pnl == null) return "--";
  return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%`;
}

function formatWatchers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function computeStats(userCalls: Call[]) {
  const resolved = userCalls.filter((c) => c.status === "resolved");
  const wins = resolved.filter((c) => c.resolve_pnl != null && c.resolve_pnl > 0);
  const winRate = resolved.length > 0 ? wins.length / resolved.length : null;
  const avgReturn =
    resolved.length > 0
      ? resolved.reduce((sum, c) => sum + (c.resolve_pnl ?? 0), 0) / resolved.length
      : null;
  const bestCall = resolved.reduce<Call | null>((best, c) => {
    if (best == null) return c;
    return (c.resolve_pnl ?? 0) > (best.resolve_pnl ?? 0) ? c : best;
  }, null);
  const originalCalls = userCalls.filter((c) => c.call_type === "original").length;
  const curatedCalls = userCalls.filter((c) => c.call_type !== "original").length;

  return { winRate, avgReturn, bestCall, originalCalls, curatedCalls };
}

export function Profile({ handle }: { handle: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const user = getUserByHandle(handle);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-4xl mb-4">?</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
        <p className="text-gray-500 mb-6">No profile exists for @{handle}</p>
        <a
          href="#/"
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          Back to feed
        </a>
      </div>
    );
  }

  const userCalls = getCallsByUser(user.id);
  const { winRate, avgReturn, bestCall, originalCalls, curatedCalls } = computeStats(userCalls);

  // Calls attributed to this user as a source (other people curated their takes)
  const attributedCalls = allCalls.filter(
    (c) => c.source_handle === handle && c.caller_id !== user.id
  );
  const attributedResolved = attributedCalls.filter((c) => c.status === "resolved");
  const attributedAccuracy =
    attributedResolved.length > 0
      ? attributedResolved.filter((c) => c.resolve_pnl != null && c.resolve_pnl > 0).length /
        attributedResolved.length
      : null;

  // Filter calls by tab
  const filteredCalls = userCalls.filter((c) => {
    if (activeTab === "active") return c.status === "active";
    if (activeTab === "resolved") return c.status === "resolved" || c.status === "closed" || c.status === "expired";
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "resolved", label: "Resolved" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">@{user.handle}</h1>
          {user.verified && (
            <svg
              className="w-5 h-5 text-blue-500 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        {user.bio && <p className="text-sm text-gray-600">{user.bio}</p>}
      </div>

      {/* Aggregate stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-lg font-bold text-gray-900">{user.total_calls}</div>
          <div className="text-xs text-gray-500">Total Calls</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-lg font-bold text-gray-900">
            {user.accuracy != null ? `${Math.round(user.accuracy * 100)}%` : "--"}
          </div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className={`text-lg font-bold ${(user.total_pnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatPnl(user.total_pnl)}
          </div>
          <div className="text-xs text-gray-500">Total P&L</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-lg font-bold text-gray-900">{formatWatchers(user.watchers)}</div>
          <div className="text-xs text-gray-500">Watchers</div>
        </div>
      </div>

      {/* Breakdown text */}
      <p className="text-sm text-gray-500 mb-4">
        {user.total_calls} calls ({originalCalls} original, {curatedCalls} curated)
      </p>

      {/* Stats highlight boxes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-lg font-bold text-gray-900">
            {winRate != null ? `${Math.round(winRate * 100)}%` : "--"}
          </div>
          <div className="text-xs text-gray-500">Win Rate</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className={`text-lg font-bold ${(avgReturn ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {avgReturn != null ? `${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(1)}%` : "--"}
          </div>
          <div className="text-xs text-gray-500">Avg Return</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-sm font-bold text-gray-900 truncate">
            {bestCall ? `${bestCall.ticker} ${bestCall.resolve_pnl != null ? `+${bestCall.resolve_pnl}%` : ""}` : "--"}
          </div>
          <div className="text-xs text-gray-500">Best Call</div>
        </div>
      </div>

      {/* Source attribution section */}
      {attributedCalls.length > 0 && (
        <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            {attributedCalls.length} call{attributedCalls.length !== 1 ? "s" : ""} attributed to
            your takes
            {attributedAccuracy != null && (
              <> &middot; {Math.round(attributedAccuracy * 100)}% accuracy</>
            )}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Call list */}
      <div className="flex flex-col gap-3">
        {filteredCalls.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No {activeTab === "all" ? "" : activeTab} calls yet.
          </p>
        ) : (
          filteredCalls.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              onClick={() => {
                window.location.hash = `/call/${call.id}`;
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
