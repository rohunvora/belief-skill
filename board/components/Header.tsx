import React from "react";

export function Header() {
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

        {/* Right section */}
        <div className="flex items-center gap-3 shrink-0">
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
            aria-label="New Call"
          >
            +
          </button>
          {/* Desktop: full text button */}
          <button
            onClick={() => navigate("/call/new")}
            className="hidden md:inline-block px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 active:scale-95 active:opacity-90 transition-colors"
          >
            New Call
          </button>
        </div>
      </div>
    </header>
  );
}
