import React, { useState } from "react";
import type { Call } from "../types";
import { CallCard, Avatar, formatPrice } from "../components/CallCard";
import { useBoardData } from "../hooks/useData";

type Tab = "active" | "resolved" | "all";

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
  const activeCalls = userCalls.filter((c) => c.status === "active");

  // Compute streak: consecutive wins from most recent resolved
  let streak = 0;
  const sortedResolved = [...resolved].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  for (const c of sortedResolved) {
    if (c.resolve_pnl != null && c.resolve_pnl > 0) streak++;
    else break;
  }

  return { winRate, avgReturn, bestCall, activeCalls, streak };
}

export function Profile({ handle }: { handle: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const { getUserByHandle, getCallsByUser, calls: allCalls, loading } = useBoardData();

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  const user = getUserByHandle(handle);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
        <p className="text-gray-500 mb-6">No profile exists for @{handle}</p>
        <a href="#/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          &larr; Back to feed
        </a>
      </div>
    );
  }

  const userCalls = getCallsByUser(user.id);
  const { winRate, avgReturn, bestCall, activeCalls, streak } = computeStats(userCalls);

  // Calls attributed to this user as a source
  const attributedCalls = allCalls.filter(
    (c) => c.source_handle === handle && c.caller_id !== user.id
  );

  // Filter calls by tab
  const filteredCalls = userCalls.filter((c) => {
    if (activeTab === "active") return c.status === "active";
    if (activeTab === "resolved")
      return c.status === "resolved" || c.status === "closed" || c.status === "expired";
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: `Active (${activeCalls.length})` },
    { key: "resolved", label: "Resolved" },
    { key: "all", label: "All" },
  ];

  // Hero stat: accuracy is the defining number
  const heroAccuracy = user.accuracy != null ? Math.round(user.accuracy * 100) : null;
  const heroColor =
    heroAccuracy != null
      ? heroAccuracy >= 60
        ? "text-green-600"
        : heroAccuracy < 40
          ? "text-red-600"
          : "text-gray-900"
      : "text-gray-300";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header: avatar + name + hero stat side by side */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar handle={handle} size="lg" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900">@{user.handle}</h1>
              {user.verified && (
                <svg className="w-5 h-5 text-gray-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {user.bio && <p className="text-sm text-gray-500 mt-0.5">{user.bio}</p>}
          </div>
        </div>

        {/* Hero accuracy number */}
        <div className="text-right">
          <div className={`text-4xl font-extrabold tabular-nums ${heroColor}`}>
            {heroAccuracy != null ? `${heroAccuracy}%` : "--"}
          </div>
          <div className="text-xs text-gray-500">accuracy</div>
        </div>
      </div>

      {/* Stats row — single compact line, not grid boxes */}
      <div className="flex items-baseline gap-4 mb-4 text-sm">
        <span className="text-gray-900 font-semibold">{user.total_calls} calls</span>
        <span className="text-gray-300">·</span>
        {user.total_pnl != null && (
          <>
            <span className={`font-bold ${user.total_pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
              {user.total_pnl >= 0 ? "+" : ""}{user.total_pnl.toFixed(1)}% total
            </span>
            <span className="text-gray-300">·</span>
          </>
        )}
        {winRate != null && (
          <>
            <span className="text-gray-600">{Math.round(winRate * 100)}% win rate</span>
            <span className="text-gray-300">·</span>
          </>
        )}
        {streak > 0 && (
          <>
            <span className="text-green-600 font-medium">{streak} streak</span>
            <span className="text-gray-300">·</span>
          </>
        )}
        <span className="text-gray-500">{user.watchers >= 1000 ? `${(user.watchers / 1000).toFixed(1)}K` : user.watchers} watchers</span>
      </div>

      {/* Best + worst call one-liner */}
      {bestCall && (
        <div className="text-sm text-gray-500 mb-4">
          Best: <span className="font-medium text-gray-700">{bestCall.ticker}</span>{" "}
          <span className="text-green-600 font-bold">+{bestCall.resolve_pnl}%</span>
          {avgReturn != null && (
            <>
              <span className="text-gray-300 mx-2">·</span>
              Avg return: <span className={`font-medium ${avgReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                {avgReturn >= 0 ? "+" : ""}{avgReturn.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      )}

      {/* Attribution badge */}
      {attributedCalls.length > 0 && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-4">
          {attributedCalls.length} call{attributedCalls.length !== 1 ? "s" : ""} cite @{handle}'s takes
        </div>
      )}

      {/* Active positions summary */}
      {activeCalls.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">{activeCalls.length} active position{activeCalls.length !== 1 ? "s" : ""}</div>
          <div className="flex flex-wrap gap-3">
            {activeCalls.slice(0, 5).map((c) => (
              <a
                key={c.id}
                href={`#/call/${c.id}`}
                className="text-sm font-medium text-gray-700 hover:underline"
              >
                {c.ticker}{" "}
                <span className={c.direction === "long" ? "text-green-600" : "text-red-600"}>
                  {c.direction === "long" ? "↑" : "↓"}
                </span>
              </a>
            ))}
            {activeCalls.length > 5 && (
              <span className="text-sm text-gray-500">+{activeCalls.length - 5} more</span>
            )}
          </div>
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
          <p className="text-sm text-gray-500 py-8 text-center">
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
