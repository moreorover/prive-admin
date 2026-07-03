FROM oven/bun:alpine AS base

RUN apk add --no-cache --upgrade libcrypto3 libssl3

FROM base AS installer

WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Bundle migration script with all deps inlined
RUN bun build packages/db/src/migrate.ts --target=bun --outfile=packages/db/migrate.js

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

# Copy nitro output (server + static assets bundled together)
COPY --from=installer --chown=bun:bun /app/apps/web/.output ./.output

# Copy bundled migration script and migration files
COPY --from=installer --chown=bun:bun /app/packages/db/migrate.js ./migrate.js
COPY --from=installer --chown=bun:bun /app/packages/db/src/migrations ./migrations

USER bun

EXPOSE 8081

CMD ["sh", "-c", "bun run ./migrate.js && bun run .output/server/index.mjs"]
