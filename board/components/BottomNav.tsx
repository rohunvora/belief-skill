import React from "react";
import { useWatchlist } from "../hooks/useWatchlist";

interface BottomNavProps {
  currentPath: string;
  onSearchOpen: () => void;
}

export function BottomNav({ currentPath, onSearchOpen }: BottomNavProps) {
  const { count } = useWatchlist();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/" || currentPath === "";
    return currentPath.startsWith(path);
  };

  const tabClass = (path: string) =>
    `flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 active:opacity-70 ${
      isActive(path) ? "text-gray-900" : "text-gray-400"
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {/* Feed */}
        <a href="#/" className={tabClass("/")}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">Feed</span>
        </a>

        {/* Trending */}
        <a href="#/trending" className={tabClass("/trending")}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
          <span className="text-[10px] font-medium">Trending</span>
        </a>

        {/* Search */}
        <button onClick={onSearchOpen} className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 active:opacity-70 text-gray-400`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-medium">Search</span>
        </button>

        {/* Watchlist */}
        <a href="#/watchlist" className={`${tabClass("/watchlist")} relative`}>
          <svg className="w-5 h-5" fill={isActive("/watchlist") ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-[10px] font-medium">Watchlist</span>
          {count > 0 && (
            <span className="absolute top-1 right-1/2 translate-x-3.5 -translate-y-0.5 bg-yellow-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {count}
            </span>
          )}
        </a>
      </div>
    </nav>
  );
}
