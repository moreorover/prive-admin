# Deploy Pipeline Design

**Date:** 2026-04-26
**Status:** Approved (design phase)
**Owner:** Martin

## Goal

Replace the current Docker Swarm deployment flow with a Docker Compose stack on the production VPS `prive`, fronted by Caddy for automatic TLS. Continuous integration validates pull requests with both source and container builds. Pushes to `main` build and publish a multi-tag image to GHCR, then deploy to the VPS over Tailscale SSH. All runtime secrets and config originate from a single 1Password vault item, fetched at deploy time by a service-account token.

## Non-Goals

- Zero-downtime/blue-green deployment (single web replica is acceptable).
- Automated rollback (manual rollback via pinned `IMAGE_TAG` is sufficient).
- Multi-architecture images (amd64 only).
- External managed Postgres (run in compose with bind-mounted host volume).
- Reverse-proxy clustering or multiple ingress hosts.

## Architecture

```
GitHub Actions runner
  ├── PR  → checkout → install → lint+fmt+types+build → docker build (no push)
  └── master → checkout → docker buildx build+push → ghcr.io/<repo>:latest, :<sha>
                       → 1Password CLI: read secrets → render .env
                       → Tailscale up (tag:prod-ci)
                       → scp docker-compose.yml + Caddyfile + .env → cicd@prive:~/prive-admin/
                       → ssh: docker compose pull && docker compose up -d --remove-orphans
                       → curl smoke check

VPS `prive` (Tailscale-attached, public 80/443)
  └── ~/prive-admin/
        docker-compose.yml      (in repo, scp'd each deploy)
        Caddyfile               (in repo, scp'd each deploy)
        .env                    (rendered each deploy, gitignored, chmod 600)
  └── /var/lib/prive-admin/
        pg/                     (postgres data, bind-mount, uid 999)
        caddy/data/             (TLS certs, ACME state)
        caddy/config/           (Caddy autosave)

  containers (compose project `prive-admin`):
    caddy    → :80, :443       → reverse proxy → web:8081 (auto-TLS)
    web      → ghcr.io/<repo>:<sha>  (CMD = migrate then serve)
    postgres → internal only, healthcheck pg_isready
```

## Files

| Path | Action | Purpose |
|---|---|---|
| `docker-compose.yml` | NEW (root) | Production compose stack |
| `Caddyfile` | NEW (root) | Reverse proxy + auto-TLS config |
| `.env.example` | NEW (root) | Documents required env vars for local stack `up` |
| `.gitignore` | EDIT | Add `.env` |
| `.github/workflows/pr-build.yml` | EDIT | Add parallel docker-build job |
| `.github/workflows/release.yml` | REWRITE | Compose deploy in place of swarm stack deploy |
| `.github/workflows/backup-postgres.yml` | EDIT | Read postgres creds from 1Password instead of GH secrets |
| `docs/superpowers/specs/2026-04-26-deploy-pipeline-design.md` | NEW | This document |

The existing `apps/web/Dockerfile` is unchanged. It already runs migrations (`bun run ./migrate.js`) before starting the server, which is sufficient for the single-replica deployment.

## docker-compose.yml

```yaml
name: prive-admin

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - /var/lib/prive-admin/caddy/data:/data
      - /var/lib/prive-admin/caddy/config:/config
    environment:
      DOMAIN_NAME: ${DOMAIN_NAME}
      ACME_EMAIL: ${ACME_EMAIL}
    depends_on:
      - web

  web:
    image: ghcr.io/${GITHUB_REPOSITORY}:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env
    expose:
      - "8081"
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - /var/lib/prive-admin/pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

`GITHUB_REPOSITORY` and `IMAGE_TAG` are written into `.env` by the deploy workflow. Postgres is reachable only on the compose network; the web container uses the `DATABASE_URL` value from `.env` to address it as `postgres:5432`.

## Caddyfile

```
{$DOMAIN_NAME} {
  encode zstd gzip
  reverse_proxy web:8081
  tls {$ACME_EMAIL}
}
```

Caddy uses HTTP-01 challenge on port 80 to issue a certificate for `{$DOMAIN_NAME}`. State persists in the bind-mounted `/var/lib/prive-admin/caddy/data` directory across deploys.

## 1Password Vault Layout

Vault: `5gq2basjdplfjk5v55wexp2y7i`
Item: `prive-admin-prod` (type: Server)

| Section | Field | Notes |
|---|---|---|
| postgres | `POSTGRES_DB` | e.g. `prive_admin` |
| postgres | `POSTGRES_USER` | e.g. `prive_admin` |
| postgres | `POSTGRES_PASSWORD` | random, ≥32 chars |
| app | `DATABASE_URL` | `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}` |
| app | `BETTER_AUTH_SECRET` | random, ≥32 chars |
| app | `BETTER_AUTH_URL` | `https://prive.salon` |
| app | `CORS_ORIGIN` | `https://prive.salon` |
| r2 | `R2_ACCOUNT_ID` | from Cloudflare |
| r2 | `R2_ACCESS_KEY_ID` | |
| r2 | `R2_SECRET_ACCESS_KEY` | |
| r2 | `R2_BUCKET_NAME` | |
| infra | `DOMAIN_NAME` | `prive.salon` |
| infra | `ACME_EMAIL` | Let's Encrypt contact |

A new 1Password service account scoped read-only to this vault provides the `OP_SERVICE_ACCOUNT_TOKEN` GitHub Actions secret. References use the vault UUID directly: `op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/<section>/<field>`. Using the UUID avoids breakage if the vault is renamed.

GitHub repository secrets that remain outside 1Password (chicken-and-egg or auto-provided):

- `OP_SERVICE_ACCOUNT_TOKEN`
- `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`
- `GITHUB_TOKEN` (auto-provided)

## release.yml (master push)

Two sequential jobs.

**Job `build-and-push`:**

1. `actions/checkout@v4`
2. `docker/login-action@v3` → `ghcr.io` with `GITHUB_TOKEN`
3. `docker/setup-buildx-action@v3`
4. `docker/build-push-action@v6`:
   - `file: apps/web/Dockerfile`
   - `context: .`
   - `platforms: linux/amd64`
   - `push: true`
   - `tags: ghcr.io/${{ github.repository }}:latest`, `ghcr.io/${{ github.repository }}:${{ github.sha }}`
   - `cache-from: type=gha`, `cache-to: type=gha,mode=max`

**Job `deploy`** (`needs: build-and-push`, `environment: production`):

1. `actions/checkout@v4` (only needs `docker-compose.yml` and `Caddyfile`).
2. `1password/load-secrets-action@v2` with `OP_SERVICE_ACCOUNT_TOKEN`, mapping every field from the vault item into env vars.
3. Render `.env` from masked env vars plus `IMAGE_TAG=${{ github.sha }}` and `GITHUB_REPOSITORY=${{ github.repository }}`. `chmod 600 .env`.
4. `tailscale/github-action@v3` (`tags: tag:prod-ci`).
5. `ssh-keyscan -H prive >> ~/.ssh/known_hosts`.
6. `ssh cicd@prive "mkdir -p ~/prive-admin"`.
7. `scp docker-compose.yml Caddyfile .env cicd@prive:~/prive-admin/`.
8. `ssh cicd@prive` runs:
   ```
   cd ~/prive-admin && \
   echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_ACTOR" --password-stdin && \
   docker compose pull && \
   docker compose up -d --remove-orphans && \
   docker image prune -f
   ```
   `GH_TOKEN` and `GH_ACTOR` passed via `ssh -o SendEnv` or inline env on the remote command.
9. Smoke check: `curl -fsS --retry 5 --retry-delay 5 https://prive.salon/` (or a known health route) from the runner.

`concurrency: ${{ github.workflow }}-${{ github.ref }}` ensures one deploy at a time.

## pr-build.yml

Two parallel jobs.

**Job `build`:** existing steps preserved (checkout, setup-bun, install, oxlint, oxfmt, check-types, `bun run build`).

**Job `docker-build`:**

1. `actions/checkout@v4`
2. `docker/setup-buildx-action@v3`
3. `docker/build-push-action@v6` with `file: apps/web/Dockerfile`, `context: .`, `platforms: linux/amd64`, `push: false`, `cache-from: type=gha`, `cache-to: type=gha,mode=max`.

No secrets, no push, no deploy.

## backup-postgres.yml (migration)

The existing scheduled backup job switches its credential source to 1Password using the same `load-secrets-action` step. It still uses Tailscale + SSH to the VPS and uploads to R2. The plain GH secrets `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `R2_*` are removed once verified working. `TS_OAUTH_*` stays in GH secrets.

Variable-name reconciliation: the existing backup script reads `PG_DATABASE` (set from GH secret `POSTGRES_DATABASE`). The 1Password item names this field `POSTGRES_DB` (matching the Postgres image convention used by the compose stack). The backup workflow maps `POSTGRES_DB → PG_DATABASE` when invoking the script; the script itself does not change.

## VPS Prerequisites (one-time, manual)

These are not automated by this design — they are documented as setup prerequisites:

1. User `cicd` with docker group membership and SSH key (already provisioned).
2. Tailscale installed and tagged `tag:prod` (already provisioned).
3. Docker Engine + `docker compose` plugin installed.
4. Host directories with correct ownership:
   ```
   sudo mkdir -p /var/lib/prive-admin/{pg,caddy/data,caddy/config}
   sudo chown -R 70:70 /var/lib/prive-admin/pg
   sudo chown -R cicd:cicd /var/lib/prive-admin/caddy /home/cicd/prive-admin
   ```
5. Firewall: 80/443 open from public internet; 22 reachable only via Tailscale.
6. DNS: `prive.salon` A/AAAA record → VPS public IP.
7. GHCR auth: each deploy logs in fresh with `GITHUB_TOKEN`, no manual login required.

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---|---|---|
| Docker build fails on master | `build-and-push` job red | Fix forward |
| 1Password fetch fails | `load-secrets-action` step fails | Rotate token, verify vault permissions |
| Tailscale auth fails | Step fails | Rotate `TS_OAUTH_*` secrets |
| `scp` fails (host unreachable) | Step fails | Manual VPS check |
| `docker compose up` fails | SSH step exits non-zero | SSH in, read `docker compose logs`, redeploy previous sha |
| Migration fails | Web container restart loop | Read `docker compose logs web`, fix migration, redeploy |
| Caddy TLS issuance fails | Smoke check fails | Read `docker compose logs caddy`, verify DNS + 80/443 reachability |
| Postgres data corruption | Manual report | Restore from latest R2 backup |

**Rollback:** `ssh cicd@prive 'cd ~/prive-admin && IMAGE_TAG=<old-sha> docker compose up -d web'`. GHCR retains old image tags by default. Documented in README.

## Testing

- **PR:** source build + container build via CI.
- **Local:** developers can `docker compose -f docker-compose.yml --env-file .env.example up` against a local Postgres for stack smoke testing (an `.env.example` is provided alongside the compose file).
- **First deploy:** push a throwaway commit to a deploy-test branch (or use `workflow_dispatch` if added later); verify Caddy issues a cert, web reaches Postgres, `/` returns 200.
- **Smoke check on every deploy:** `curl` against the public URL with retries.

There is no automated integration test in the deploy pipeline beyond the smoke check; the existing PR-time checks (types, lint, build, container build) are the gating quality bar.

## Open Questions

None at design-approval time. Any field-name discrepancies between the 1Password item layout and the `op://` references in workflows must be resolved during implementation, but the layout above is authoritative.
