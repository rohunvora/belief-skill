import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/Header";
import { CallList } from "./pages/CallList";
import { CardDetail } from "./pages/CardDetail";
import { NewCall } from "./pages/NewCall";
import { HowItWorks } from "./pages/HowItWorks";

function parseHash(): string {
  return window.location.hash.slice(1) || "/";
}

function matchRoute(path: string): React.ReactNode {
  if (path === "/call/new") {
    return <NewCall />;
  }

  const callMatch = path.match(/^\/call\/(.+)$/);
  if (callMatch) {
    return <CardDetail id={callMatch[1]!} />;
  }

  if (path === "/how-it-works") {
    return <HowItWorks />;
  }

  // Default: call list
  return <CallList />;
}

function App() {
  const [path, setPath] = useState(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setPath(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Header />
      <main className="px-4 pt-4 pb-8 md:pt-6 md:pb-6">{matchRoute(path)}</main>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
