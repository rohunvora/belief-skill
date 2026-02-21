import React, { useEffect, useRef } from "react";
import { useSearch } from "../hooks/useSearch";
import { Avatar } from "./CallCard";

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const { query, setQuery, results, loading, hasResults } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const navigate = (path: string) => {
    window.location.hash = path;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white md:hidden flex flex-col">
      {/* Search header */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b border-gray-200"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
      >
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickers, authors..."
            className="w-full pl-10 pr-3 py-2.5 text-base bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white placeholder-gray-400"
          />
        </div>
        <button
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium text-gray-600 active:text-gray-900"
        >
          Cancel
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
        )}
        {!loading && !hasResults && query.length >= 1 && (
          <div className="px-4 py-3 text-sm text-gray-400">No results</div>
        )}

        {results.tickers.length > 0 && (
          <div>
            <div className="px-4 pt-3 pb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Tickers
            </div>
            {results.tickers.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/ticker/${t.symbol}`)}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-left active:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{t.symbol}</span>
                {t.name && <span className="text-gray-500 text-sm truncate">{t.name}</span>}
                <span className="text-[11px] text-gray-400 ml-auto capitalize">{t.instrument_type}</span>
              </button>
            ))}
          </div>
        )}

        {results.authors.length > 0 && (
          <div>
            <div className="px-4 pt-3 pb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Authors
            </div>
            {results.authors.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/author/${a.handle}`)}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-left active:bg-gray-50 transition-colors"
              >
                <Avatar handle={a.handle} avatarUrl={a.avatar_url} size="sm" />
                <span className="font-medium text-gray-900">@{a.handle}</span>
                {a.name && <span className="text-gray-500 text-sm truncate">{a.name}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
