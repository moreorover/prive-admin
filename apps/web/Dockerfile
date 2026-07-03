# --- build stage: the official Vite+ toolchain image ---
FROM ghcr.io/voidzero-dev/vite-plus:latest AS build
WORKDIR /app
ENV CI=true
ENV VITE_GIT_HOOKS=0
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp apps/web/package.json apps/web/package.json
COPY --chown=vp:vp packages/auth/package.json packages/auth/package.json
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
COPY --chown=vp:vp packages/ui/package.json packages/ui/package.json
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .
RUN vp run --filter web build

RUN cp "$(vp env which node | head -1)" /tmp/node

FROM ghcr.io/voidzero-dev/vite-plus:latest AS deps
WORKDIR /app
ENV CI=true
ENV VITE_GIT_HOOKS=0
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp apps/web/package.json apps/web/package.json
COPY --chown=vp:vp packages/auth/package.json packages/auth/package.json
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
COPY --chown=vp:vp packages/ui/package.json packages/ui/package.json
RUN vp install --frozen-lockfile --prod

FROM debian:bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

COPY --from=build /tmp/node /usr/local/bin/node

# Copy nitro output (server + static assets bundled together)
COPY --from=build /app/apps/web/.output ./.output
COPY --from=deps /app/node_modules ./node_modules

# Copy migration script and migration files
COPY --from=build /app/packages/db/src/migrate.ts ./migrate.ts
COPY --from=build /app/packages/db/src/migrations ./migrations

USER nobody

EXPOSE 8081

CMD ["sh", "-c", "node --experimental-strip-types ./migrate.ts && node .output/server/index.mjs"]
