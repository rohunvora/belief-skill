import React, { useState, useEffect } from "react";
import { Avatar } from "../components/CallCard";
import { formatWatchers } from "../utils";
import type { User } from "../types";

interface LeaderboardEntry {
  user: User;
  total_calls: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  const ranked = entries.filter((e) => e.total_calls > 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Contributors</h1>
        <p className="text-sm text-gray-500">
          {ranked.length} contributors
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {ranked.map((entry, i) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={entry.user.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors active:bg-gray-100 ${
                isTop3
                  ? "bg-white border border-gray-200 hover:border-gray-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                window.location.hash = `/profile/${entry.user.handle}`;
              }}
            >
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

              <Avatar handle={entry.user.handle} avatarUrl={entry.user.avatar_url} size={isTop3 ? "md" : "sm"} />

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
                  {entry.total_calls} calls · {formatWatchers(entry.user.watchers)} watching
                </span>
              </div>

              <span className={`text-xl font-extrabold tabular-nums text-gray-900 ${isTop3 ? "text-2xl" : ""}`}>
                {entry.total_calls}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
