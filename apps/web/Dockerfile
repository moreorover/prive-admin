# syntax=docker/dockerfile:1

FROM ghcr.io/voidzero-dev/vite-plus:latest AS build

WORKDIR /app

ENV CI=true
ENV VITE_GIT_HOOKS=0

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=vp:vp apps/web/package.json apps/web/package.json
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/config/package.json packages/config/package.json
COPY --chown=vp:vp packages/env/package.json packages/env/package.json
COPY --chown=vp:vp packages/ui/package.json packages/ui/package.json
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .

ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN vp run --filter web build

FROM nginx:alpine AS runtime

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
