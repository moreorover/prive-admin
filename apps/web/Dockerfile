FROM oven/bun:alpine AS pruner

WORKDIR /app
COPY . .
RUN bunx turbo prune web --docker

FROM oven/bun:alpine AS installer

WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN bun run build --filter=web

# Bundle migration script with all deps inlined
RUN bun build packages/db/src/migrate.ts --target=bun --outfile=packages/db/migrate.js

FROM oven/bun:alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

# Copy nitro output (server + static assets bundled together)
COPY --from=installer /app/apps/web/.output ./.output

# Copy bundled migration script and migration files
COPY --from=installer /app/packages/db/migrate.js ./migrate.js
COPY --from=installer /app/packages/db/src/migrations ./migrations

EXPOSE 8081

CMD ["sh", "-c", "bun run ./migrate.js && bun run .output/server/index.mjs"]
