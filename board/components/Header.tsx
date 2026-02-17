import React from "react";

export function Header() {
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <a
          href="#/"
          className="font-semibold text-lg tracking-tight text-gray-900 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          belief.board
        </a>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search calls, tickers, people..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/call/new")}
            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            Make Your Call
          </button>
          <a
            href="#/u/satoshi"
            onClick={(e) => {
              e.preventDefault();
              navigate("/u/satoshi");
            }}
            className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-400 transition-colors"
            title="@satoshi"
          >
            S
          </a>
        </div>
      </div>
    </header>
  );
}
