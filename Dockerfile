# belief.board -- Bun.serve() + SQLite
# Deployed as a persistent process on Fly.io with a volume mount for the DB.

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Copy the board app and its dependencies
COPY board/ board/

# Expose the port Bun.serve() listens on
EXPOSE 4000

# DATA_DIR is where the SQLite DB lives -- mount a persistent volume here
ENV DATA_DIR=/data
ENV NODE_ENV=production
ENV PORT=4000

# Seed the DB if it doesn't exist yet, then start the server
CMD ["sh", "-c", "if [ ! -f /data/board.db ]; then echo 'Seeding fresh DB...' && bun run board/seed.ts; fi && bun run board/server.ts"]
