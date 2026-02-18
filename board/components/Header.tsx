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

        {/* Right section */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#/leaderboard"
            onClick={(e) => {
              e.preventDefault();
              navigate("/leaderboard");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors hidden sm:inline"
          >
            Leaderboard
          </a>
          <a
            href="#/how-it-works"
            onClick={(e) => {
              e.preventDefault();
              navigate("/how-it-works");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors hidden sm:inline"
          >
            How it works
          </a>
          <button
            onClick={() => navigate("/call/new")}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
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
