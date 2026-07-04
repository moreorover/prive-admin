# syntax=docker/dockerfile:1

FROM ghcr.io/voidzero-dev/vite-plus:latest AS build

WORKDIR /app

ENV CI=true
ENV VITE_GIT_HOOKS=0

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp apps/server/package.json apps/server/package.json
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/auth/package.json packages/auth/package.json
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .
RUN vp run --filter server build
RUN cp "$(vp env which node | head -1)" /tmp/node

FROM ghcr.io/voidzero-dev/vite-plus:latest AS deps

WORKDIR /app

ENV CI=true
ENV VITE_GIT_HOOKS=0

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp apps/server/package.json apps/server/package.json
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/auth/package.json packages/auth/package.json
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
RUN vp install --frozen-lockfile --prod

FROM debian:bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /tmp/node /usr/local/bin/node
COPY --from=build /app/apps/server/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./package.json

USER nobody
EXPOSE 3000

CMD ["node", "dist/index.mjs"]
