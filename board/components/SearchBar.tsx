import React, { useState, useRef, useEffect } from "react";
import { useSearch } from "../hooks/useSearch";
import { Avatar } from "./CallCard";

export function SearchBar() {
  const { query, setQuery, results, loading, hasResults } = useSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs">
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search..."
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white placeholder-gray-400"
        />
      </div>

      {/* Dropdown */}
      {open && query.length >= 1 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-3 py-3 text-xs text-gray-400">Searching...</div>
          )}
          {!loading && !hasResults && query.length >= 1 && (
            <div className="px-3 py-3 text-xs text-gray-400">No results</div>
          )}

          {results.tickers.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Tickers
              </div>
              {results.tickers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/ticker/${t.symbol}`)}
                  className="w-full flex items-center gap-2 px-3 py-3 min-h-[44px] text-sm text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{t.symbol}</span>
                  {t.name && <span className="text-gray-500 text-xs truncate">{t.name}</span>}
                  <span className="text-[11px] text-gray-400 ml-auto capitalize">{t.instrument_type}</span>
                </button>
              ))}
            </div>
          )}

          {results.authors.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Authors
              </div>
              {results.authors.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/author/${a.handle}`)}
                  className="w-full flex items-center gap-2 px-3 py-3 min-h-[44px] text-sm text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Avatar handle={a.handle} avatarUrl={a.avatar_url} size="sm" />
                  <span className="font-medium text-gray-900">@{a.handle}</span>
                  {a.name && <span className="text-gray-500 text-xs truncate">{a.name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
