import React, { useState, useEffect } from "react";

interface TrendingTicker {
  ticker: string;
  author_count: number;
  authors: Array<{ handle: string; direction: string }>;
}

/** Compact trending strip above the feed. Shows top 3 convergences as tappable cards. */
export function TrendingBanner() {
  const [items, setItems] = useState<TrendingTicker[]>([]);

  useEffect(() => {
    fetch("/api/trending?days=7&limit=3")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="-mx-4 px-4 mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-gray-400 shrink-0 font-medium">Trending</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        {items.map((item) => {
          const allLong = item.authors.every((a) => a.direction === "long");
          const allShort = item.authors.every((a) => a.direction === "short");
          const named = item.authors.slice(0, 2).map((a) => a.handle);
          const extra = item.authors.length - 2;

          let label: string;
          if (allLong || allShort) {
            const dir = allLong ? "long" : "short";
            label = `${named.join(", ")}${extra > 0 ? ` +${extra}` : ""} agree ${dir}`;
          } else {
            label = `${item.author_count} split`;
          }

          return (
            <a
              key={item.ticker}
              href={`#/ticker/${item.ticker}`}
              className="snap-start shrink-0 bg-white border border-gray-200 rounded-lg px-3 py-2.5 min-w-[140px] active:bg-gray-50 transition-colors"
            >
              <div className="font-semibold text-sm text-gray-900">{item.ticker}</div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{label}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
