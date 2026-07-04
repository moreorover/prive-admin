# syntax=docker/dockerfile:1

FROM ghcr.io/voidzero-dev/vite-plus:latest AS build

WORKDIR /app

ENV CI=true
ENV VITE_GIT_HOOKS=0

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .
RUN vp run --filter @prive-admin-tanstack/db build

FROM ghcr.io/voidzero-dev/vite-plus:latest AS deps

WORKDIR /app

ENV CI=true
ENV VITE_GIT_HOOKS=0

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
RUN vp install --frozen-lockfile --prod

FROM node:24-bookworm-slim AS runtime

WORKDIR /app/packages/db
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get upgrade -y \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/packages/db/dist /app/packages/db/dist
COPY --from=build /app/packages/db/src/migrations /app/packages/db/dist/migrations
COPY --from=build /app/packages/db/package.json /app/packages/db/package.json
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules

RUN find /app/node_modules -type f \
  \( -name esbuild -o -name rolldown -o -name oxlint -o -name tsgolint -o -name tsx -o -name vite-plus \) \
  -delete

USER node

CMD ["node", "dist/migrate.mjs"]
