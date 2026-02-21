import React from "react";
import { SearchBar } from "./SearchBar";
import { useWatchlist } from "../hooks/useWatchlist";

export function Header() {
  const { count } = useWatchlist();
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <header
      className="border-b border-gray-200 bg-white sticky top-0 z-50"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-12 md:h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <a
          href="#/"
          className="font-semibold text-lg tracking-tight text-gray-900 shrink-0 active:opacity-70"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          belief.board
        </a>

        {/* Search — desktop only */}
        <div className="hidden md:block flex-1 max-w-xs">
          <SearchBar />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#/trending"
            onClick={(e) => {
              e.preventDefault();
              navigate("/trending");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors hidden md:inline"
          >
            Trending
          </a>
          <a
            href="#/contributors"
            onClick={(e) => {
              e.preventDefault();
              navigate("/contributors");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors hidden md:inline"
          >
            Contributors
          </a>
          <a
            href="#/how-it-works"
            onClick={(e) => {
              e.preventDefault();
              navigate("/how-it-works");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors hidden md:inline"
          >
            How it works
          </a>
          {/* Mobile: compact "+" circle */}
          <button
            onClick={() => navigate("/call/new")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 text-white text-lg font-light active:scale-95 active:opacity-90 md:hidden"
            aria-label="Make Your Call"
          >
            +
          </button>
          {/* Desktop: full text button */}
          <button
            onClick={() => navigate("/call/new")}
            className="hidden md:inline-block px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 active:scale-95 active:opacity-90 transition-colors"
          >
            Make Your Call
          </button>
          {count > 0 && (
            <a
              href="#/watchlist"
              onClick={(e) => {
                e.preventDefault();
                navigate("/watchlist");
              }}
              className="text-yellow-500 hover:text-yellow-600 active:scale-90 active:opacity-70 transition-colors text-lg hidden md:inline"
              title="Watchlist"
            >
              {"\u2605"}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
