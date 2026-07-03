# --- build stage: the official Vite+ toolchain image ---
FROM ghcr.io/voidzero-dev/vite-plus:latest AS build
WORKDIR /app
ENV CI=true
ENV VITE_GIT_HOOKS=0
COPY --chown=vp:vp package.json bun.lock ./
COPY --chown=vp:vp apps/web/package.json apps/web/package.json
COPY --chown=vp:vp packages/auth/package.json packages/auth/package.json
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
COPY --chown=vp:vp packages/ui/package.json packages/ui/package.json
RUN vp install --frozen-lockfile
# Bun does not always expose Vite+'s bundled Vite at the workspace root in this
# clean container install, but Nitro resolves the Vite peer from there.
RUN test -e node_modules/vite || ln -s .bun/node_modules/vite node_modules/vite

COPY --chown=vp:vp . .
RUN vp run --filter web build

# Bundle migration script with all deps inlined
RUN "$(vp env which bun | head -1)" build packages/db/src/migrate.ts --target=bun --outfile=packages/db/migrate.js

FROM oven/bun:alpine AS runner

RUN apk add --no-cache --upgrade libcrypto3 libssl3

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

# Copy nitro output (server + static assets bundled together)
COPY --from=build --chown=bun:bun /app/apps/web/.output ./.output

# Copy bundled migration script and migration files
COPY --from=build --chown=bun:bun /app/packages/db/migrate.js ./migrate.js
COPY --from=build --chown=bun:bun /app/packages/db/src/migrations ./migrations

USER bun

EXPOSE 8081

CMD ["sh", "-c", "bun run ./migrate.js && bun run .output/server/index.mjs"]
