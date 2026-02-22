---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

## ⚠️ Test Examples — Read This First

When writing tests, improving the skill, or validating routing behavior: **use `tests/real-test-theses.json` and `tests/real-routings.md`**. These are real CT inputs routed in live sessions with real web research.

**Do NOT use `tests/test-theses.json`** — it's synthetic AI-invented inputs that don't represent how real users talk. It's deprecated and will be removed.

The JSONL files in `tests/results/` contain full routing outputs (input + what the skill actually said). When you want to know what "good output" looks like for a given input shape, read those files — don't invent examples from scratch.

---

## Repo Scope

The skill is `SKILL.md` + `scripts/` + `references/`. Everything else is development infrastructure.

**Don't read or modify:**
- `docs/` — internal design diagrams (excalidraw), not relevant to the skill
- `thoughts/` — cross-machine session state, not part of the skill
- `tests/golden/*.jsonl` — raw session traces, only the `.md` summaries matter
- `.cursor/` — IDE config

**Core files:**
- `SKILL.md` — the entire skill prompt
- `scripts/adapters/` — live market API adapters (Robinhood, Kalshi, Hyperliquid, Bankr, Angel)
- `references/` — conditional reference content loaded by SKILL.md when needed
- `tests/` — scoring tests, smoke tests, e2e routing, golden test summaries
  - **`tests/real-test-theses.json`** — THE canonical test set. Real CT inputs routed in live sessions. Always use this.
  - **`tests/hard-test-theses.json`** — Hard edge cases covering missing shapes (private company proxies, compound contradictions, stale theses, handle scans).
  - `tests/test-theses.json` — **DEPRECATED. Synthetic AI-invented examples. Do not use as examples or reference for routing behavior. Will be deleted.**
  - `tests/results/*.jsonl` — Raw routing outputs from test sessions (input + full routing output). Use these as grounding when improving the skill — they show what the skill actually produces on real inputs.
  - `tests/real-routings.md` — Documented real sessions with analysis and lessons learned.
- `board/` — belief.board web app (React + Bun.serve + SQLite)
  - `board/server.ts` — Bun.serve() entry, API routes, server-rendered cards/permalinks
  - `board/db.ts` — bun:sqlite schema + queries (the single source of truth for stored calls)
  - `board/types.ts` — Call, User types
  - `board/templates/` — server-rendered HTML (card.ts, permalink.ts) for OG previews
  - `board/seed.ts` — insert sample data: `bun run board/seed.ts`
  - Start with: `bun run board/server.ts` (port 4000)

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
