import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/Header";
import { Feed } from "./pages/Feed";
import { CardDetail } from "./pages/CardDetail";
import { NewCall } from "./pages/NewCall";
import { Leaderboard } from "./pages/Leaderboard";
import { Profile } from "./pages/Profile";
import { Claim } from "./pages/Claim";
import { HowItWorks } from "./pages/HowItWorks";
import { AuthorPage } from "./pages/AuthorPage";
import { SourcePage } from "./pages/SourcePage";
import { TickerPage } from "./pages/TickerPage";
import { BoardDataProvider } from "./hooks/useData";

function parseHash(): { path: string; params: Record<string, string> } {
  const hash = window.location.hash.slice(1) || "/";
  return { path: hash, params: {} };
}

function matchRoute(path: string): React.ReactNode {
  // /call/new must come before /call/:id
  if (path === "/call/new") {
    return <NewCall />;
  }

  const callMatch = path.match(/^\/call\/(.+)$/);
  if (callMatch) {
    return <CardDetail id={callMatch[1]!} />;
  }

  if (path === "/leaderboard" || path === "/contributors") {
    return <Leaderboard />;
  }

  if (path === "/how-it-works") {
    return <HowItWorks />;
  }

  const profileMatch = path.match(/^\/(?:u|profile)\/(.+)$/);
  if (profileMatch) {
    return <Profile handle={profileMatch[1]!} />;
  }

  const claimMatch = path.match(/^\/claim\/(.+)$/);
  if (claimMatch) {
    return <Claim handle={claimMatch[1]!} />;
  }

  // Entity pages
  const authorMatch = path.match(/^\/author\/(.+)$/);
  if (authorMatch) {
    return <AuthorPage handle={authorMatch[1]!} />;
  }

  const sourceMatch = path.match(/^\/source\/(.+)$/);
  if (sourceMatch) {
    return <SourcePage id={sourceMatch[1]!} />;
  }

  const tickerMatch = path.match(/^\/ticker\/(.+)$/);
  if (tickerMatch) {
    return <TickerPage symbol={tickerMatch[1]!} />;
  }

  // Default: feed
  return <Feed />;
}

function App() {
  const [path, setPath] = useState(() => parseHash().path);

  useEffect(() => {
    const onHashChange = () => {
      setPath(parseHash().path);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <BoardDataProvider>
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <Header />
        <main className="px-4 py-6">{matchRoute(path)}</main>
      </div>
    </BoardDataProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
