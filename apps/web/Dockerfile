FROM oven/bun:latest AS pruner

WORKDIR /app
COPY . .
RUN bunx turbo prune web --docker

FROM oven/bun:latest AS installer

WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN bun run build --filter=web

FROM oven/bun:latest AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

# Copy nitro output (server + static assets bundled together)
COPY --from=installer /app/apps/web/.output ./.output

# Copy migration files and script for runtime migration
COPY --from=installer /app/packages/db/src/migrate.ts ./migrate.ts
COPY --from=installer /app/packages/db/src/migrations ./migrations

# Install only the deps needed for migrations
RUN bun add drizzle-orm pg

EXPOSE 8081

CMD ["sh", "-c", "bun run ./migrate.ts && bun run .output/server/index.mjs"]
