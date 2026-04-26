# Deploy Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Docker Compose deployment to VPS `prive` with Caddy auto-TLS, GHCR-built images on master push, and 1Password-sourced runtime secrets, replacing the existing Docker Swarm flow.

**Architecture:** GitHub Actions runner builds and pushes `ghcr.io/<repo>:{latest,sha}` on master, then over Tailscale SSH copies `docker-compose.yml`, `Caddyfile`, and a freshly-rendered `.env` (from 1Password) to `cicd@prive:~/prive-admin/`, then runs `docker compose pull && up -d`. Caddy fronts the web container on 80/443 with auto-TLS. Postgres runs in the same compose stack with a host bind-mount.

**Tech Stack:** Docker Compose, Caddy 2, Postgres 17, GitHub Actions, 1Password service account + `load-secrets-action@v2`, Tailscale OAuth, GHCR.

**Spec:** `docs/superpowers/specs/2026-04-26-deploy-pipeline-design.md`

**Note on TDD:** This plan is infrastructure configuration. There are no unit tests to write first. "Tests" in each task are syntax validation (`docker compose config`, `actionlint`, `caddy validate`), dry-run output verification, and a final integration check via the first real deploy.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `docker-compose.yml` | NEW (root) | Production compose stack: caddy, web, postgres |
| `Caddyfile` | NEW (root) | Reverse proxy + auto-TLS |
| `.env.example` | NEW (root) | Documents required env keys, no values |
| `.gitignore` | EDIT | Already ignores `.env` — verify only |
| `scripts/backup_postgres.sh` | NEW (restored, adapted) | Runs `pg_dump` via `docker compose exec` |
| `.github/workflows/pr-build.yml` | EDIT | Add `docker-build` parallel job |
| `.github/workflows/release.yml` | REWRITE | `build-and-push` + `deploy` jobs (replaces swarm) |
| `.github/workflows/backup-postgres.yml` | EDIT | Source secrets from 1Password; map to script env |
| `docs/deploy/vps-setup.md` | NEW | One-time VPS prerequisite checklist |
| `README.md` | EDIT | Reference deploy doc, document rollback command |

---

## Task 1: Foundation — `.env.example` and `.gitignore`

**Files:**
- Create: `.env.example`
- Verify: `.gitignore` (already ignores `.env`; no change needed)

- [ ] **Step 1: Create `.env.example`**

```dotenv
# Image (set by deploy workflow; latest for local dev)
IMAGE_TAG=latest
GITHUB_REPOSITORY=owner/prive-admin

# Postgres
POSTGRES_DB=prive_admin
POSTGRES_USER=prive_admin
POSTGRES_PASSWORD=replace-me-32-chars-min

# App (server.ts schema)
DATABASE_URL=postgres://prive_admin:replace-me-32-chars-min@postgres:5432/prive_admin
BETTER_AUTH_SECRET=replace-me-32-chars-min
BETTER_AUTH_URL=https://prive.salon
CORS_ORIGIN=https://prive.salon
NODE_ENV=production

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Caddy
DOMAIN_NAME=prive.salon
ACME_EMAIL=ops@example.com
```

- [ ] **Step 2: Verify `.gitignore` already ignores `.env`**

Run: `grep -E '^\.env$' .gitignore`
Expected: `.env` line present (already is — see existing file).

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example for compose stack"
```

---

## Task 2: Caddyfile

**Files:**
- Create: `Caddyfile`

- [ ] **Step 1: Create `Caddyfile`**

```
{$DOMAIN_NAME} {
  encode zstd gzip
  reverse_proxy web:8081
  tls {$ACME_EMAIL}
}
```

- [ ] **Step 2: Validate Caddyfile syntax**

Run:
```bash
docker run --rm -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -e DOMAIN_NAME=example.com -e ACME_EMAIL=ops@example.com \
  caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```
Expected: `Valid configuration`.

- [ ] **Step 3: Commit**

```bash
git add Caddyfile
git commit -m "feat(deploy): add Caddyfile reverse proxy + auto-TLS"
```

---

## Task 3: docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

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

- [ ] **Step 2: Validate compose syntax with example env**

Run:
```bash
cp .env.example .env.tmp
docker compose --env-file .env.tmp config > /dev/null
echo "exit=$?"
rm .env.tmp
```
Expected: `exit=0` and no error output.

- [ ] **Step 3: Confirm postgres NOT exposed on host**

Run:
```bash
cp .env.example .env.tmp
docker compose --env-file .env.tmp config | grep -A2 'postgres:' | grep 'published'
rm .env.tmp
```
Expected: no output (postgres has no `ports:` mapping, only `expose:` is internal — actually postgres has neither in our config; reachable only via compose network DNS).

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(deploy): add production docker-compose stack"
```

---

## Task 4: PR build — add `docker-build` job

**Files:**
- Modify: `.github/workflows/pr-build.yml`

- [ ] **Step 1: Replace `pr-build.yml` with two-job version**

```yaml
name: PR Build Check

on:
  pull_request:
    branches:
      - main

jobs:
  build:
    name: Source Build
    runs-on: ubuntu-latest

    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bunx oxlint

      - name: Check Formatting
        run: bunx oxfmt --check

      - name: Check Types
        run: bun run check-types

      - name: Run Build
        run: bun run build

  docker-build:
    name: Docker Image Build
    runs-on: ubuntu-latest

    permissions:
      contents: read

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build (no push)
        uses: docker/build-push-action@v6
        with:
          file: apps/web/Dockerfile
          context: .
          platforms: linux/amd64
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 2: Validate workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pr-build.yml'))"`
Expected: no output (valid YAML).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pr-build.yml
git commit -m "ci: add parallel docker-build job to PR check"
```

---

## Task 5: 1Password vault — create item (manual setup, documented)

**This task is a manual prerequisite for the deploy workflow. It does not produce a code change. Document execution status in the PR description.**

- [ ] **Step 1: Confirm vault accessible**

Run on the operator's machine:
```bash
op vault list
```
Expected: vault `5gq2basjdplfjk5v55wexp2y7i` (or its display name) appears in output. If not, sign into the correct 1Password account.

- [ ] **Step 2: Create item `prive-admin-prod` (Server type) with all fields**

Run:
```bash
op item create \
  --vault 5gq2basjdplfjk5v55wexp2y7i \
  --category server \
  --title prive-admin-prod \
  'postgres.POSTGRES_DB[text]=prive_admin' \
  'postgres.POSTGRES_USER[text]=prive_admin' \
  "postgres.POSTGRES_PASSWORD[concealed]=$(openssl rand -hex 32)" \
  'app.DATABASE_URL[text]=postgres://prive_admin:REPLACE_WITH_PG_PASSWORD@postgres:5432/prive_admin' \
  "app.BETTER_AUTH_SECRET[concealed]=$(openssl rand -hex 32)" \
  'app.BETTER_AUTH_URL[text]=https://prive.salon' \
  'app.CORS_ORIGIN[text]=https://prive.salon' \
  'r2.R2_ACCOUNT_ID[text]=' \
  'r2.R2_ACCESS_KEY_ID[concealed]=' \
  'r2.R2_SECRET_ACCESS_KEY[concealed]=' \
  'r2.R2_BUCKET_NAME[text]=' \
  'infra.DOMAIN_NAME[text]=prive.salon' \
  'infra.ACME_EMAIL[text]=ops@example.com'
```
Expected: item created. Note: `op item create` shell-escapes `[concealed]` markers; verify in the 1Password GUI that those fields are concealed.

- [ ] **Step 3: Edit `app.DATABASE_URL` to embed the actual password**

Read the password back, then update the URL:
```bash
PG_PASS=$(op read 'op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/postgres/POSTGRES_PASSWORD')
op item edit prive-admin-prod \
  --vault 5gq2basjdplfjk5v55wexp2y7i \
  "app.DATABASE_URL=postgres://prive_admin:${PG_PASS}@postgres:5432/prive_admin"
```
Expected: item updated. Verify in GUI.

- [ ] **Step 4: Fill remaining R2 fields and `infra.ACME_EMAIL`**

Run for each:
```bash
op item edit prive-admin-prod --vault 5gq2basjdplfjk5v55wexp2y7i \
  "r2.R2_ACCOUNT_ID=<value>" \
  "r2.R2_ACCESS_KEY_ID=<value>" \
  "r2.R2_SECRET_ACCESS_KEY=<value>" \
  "r2.R2_BUCKET_NAME=<value>" \
  "infra.ACME_EMAIL=<email>"
```

- [ ] **Step 5: Create service account, scoped to this vault, generate token**

CLI path (preferred — `--raw` is required, otherwise stdout is descriptive prose and the token is unrecoverable; the CLI also allows duplicate-name creation, so a missing `--raw` will create an orphan account that is hard to delete):

```bash
SA_TOKEN="$(op service-account create prive-admin-github-actions \
  --vault '5gq2basjdplfjk5v55wexp2y7i:read_items' --raw)"
```

Web UI fallback: 1Password admin → Integrations → Directory → Service Accounts → Create. Read-only access to vault `5gq2basjdplfjk5v55wexp2y7i`. Copy the token shown once.

- [ ] **Step 6: Add token as GitHub Actions secret**

Have the operator run (so the token never enters logs or chat):
```bash
gh secret set OP_SERVICE_ACCOUNT_TOKEN
# paste token at prompt
```
Expected: `✓ Set Actions secret OP_SERVICE_ACCOUNT_TOKEN for <repo>`.

- [ ] **Step 7: Verify token works from a runner-equivalent shell**

Run locally with the token exported:
```bash
OP_SERVICE_ACCOUNT_TOKEN="<token>" \
  op read 'op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/app/BETTER_AUTH_URL'
```
Expected: prints `https://prive.salon`. If fails: regenerate token, re-check vault scope.

- [ ] **Step 8: Note completion in PR description**

No commit — this is operational. Track completion in the PR body checklist.

---

## Task 6: VPS prerequisites doc

**Files:**
- Create: `docs/deploy/vps-setup.md`

- [ ] **Step 1: Create `docs/deploy/vps-setup.md`**

```markdown
# VPS Setup (`prive`)

One-time prerequisites for the production host before the deploy
workflow can run. The deploy workflow is the only continuous owner of
the stack; this document is for first-time provisioning and recovery.

## Requirements

- Linux host (Ubuntu 22.04 or later assumed) with public IPv4.
- SSH user `cicd` with Docker group membership and an authorized SSH
  key matching the GitHub Actions Tailscale identity.
- Tailscale installed, logged in, with ACL tag `tag:prod` so the
  `tag:prod-ci` runners can reach it.

## Install

```bash
# Docker Engine + compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker cicd

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --advertise-tags=tag:prod
```

## Host directories

```bash
sudo mkdir -p /var/lib/prive-admin/{pg,caddy/data,caddy/config}
sudo chown -R 999:999 /var/lib/prive-admin/pg
sudo chown -R cicd:cicd /var/lib/prive-admin/caddy
sudo -u cicd mkdir -p /home/cicd/prive-admin
```

The `999:999` ownership matches the `postgres` user inside the
official `postgres:17-alpine` image.

## Firewall

Open inbound `80/tcp` and `443/tcp` from the public internet for
Caddy. Restrict `22/tcp` to the Tailscale interface only:

```bash
sudo ufw default deny incoming
sudo ufw allow in on tailscale0 to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## DNS

Set an `A` (and optional `AAAA`) record for `prive.salon` pointing at
the VPS public IP before the first deploy. Caddy will obtain a
Let's Encrypt cert via the HTTP-01 challenge on port 80 once DNS
resolves.

## GHCR pulls

The deploy workflow logs `cicd` into `ghcr.io` on every run using the
ephemeral `GITHUB_TOKEN`. No manual login is required.

## First deploy

Push (or merge) to `main` and watch the `Release` workflow run. The
`deploy` job ends with a `curl` smoke check against
`https://prive.salon/`; a passing job means the stack is up.

## Rollback

```bash
ssh cicd@prive 'cd ~/prive-admin && IMAGE_TAG=<old-sha> docker compose up -d web'
```

GHCR retains older `:<sha>` tags by default. Pick a known-good sha
from the GitHub Actions history.

## Routine operations

- View logs: `ssh cicd@prive 'cd ~/prive-admin && docker compose logs -f <service>'`
- Restart web: `ssh cicd@prive 'cd ~/prive-admin && docker compose restart web'`
- Database shell: `ssh cicd@prive 'cd ~/prive-admin && docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`
```

- [ ] **Step 2: Commit**

```bash
git add docs/deploy/vps-setup.md
git commit -m "docs(deploy): add VPS prerequisites and operations guide"
```

---

## Task 7: Release workflow — `build-and-push` job

**Files:**
- Modify: `.github/workflows/release.yml` (full rewrite, but landed in two tasks: this task replaces only the build job; deploy job comes in Task 8)

For this task we ship a release.yml that ONLY builds and pushes the image. Deploy job arrives in Task 8. This staged approach lets us validate the build path with a real master push (or a trial branch via `workflow_dispatch`) before adding deploy complexity.

- [ ] **Step 1: Rewrite `release.yml` (build job only, with workflow_dispatch trigger for trial runs)**

```yaml
name: Release

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency: ${{ github.workflow }}-${{ github.ref }}

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ghcr.io/${{ github.repository }}

jobs:
  build-and-push:
    name: Build and Push Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          file: apps/web/Dockerfile
          context: .
          platforms: linux/amd64
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 2: Validate workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci(release): replace swarm deploy with build-and-push (deploy job follows)"
```

- [ ] **Step 4: After PR merge — manually trigger and verify GHCR push**

Once this PR lands on `main`:
```bash
gh workflow run Release
gh run watch
```
Then check `https://github.com/<owner>/<repo>/pkgs/container/<repo>` for `:latest` and `:<sha>` tags. If absent: re-read action logs.

---

## Task 8: Release workflow — `deploy` job

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Append `deploy` job to `release.yml`**

Insert this `deploy:` job after `build-and-push:` (final file shown):

```yaml
name: Release

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency: ${{ github.workflow }}-${{ github.ref }}

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ghcr.io/${{ github.repository }}

jobs:
  build-and-push:
    name: Build and Push Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          file: apps/web/Dockerfile
          context: .
          platforms: linux/amd64
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to prive
    needs: build-and-push
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://prive.salon
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Load secrets from 1Password
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          POSTGRES_DB: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/postgres/POSTGRES_DB
          POSTGRES_USER: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/postgres/POSTGRES_USER
          POSTGRES_PASSWORD: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/postgres/POSTGRES_PASSWORD
          DATABASE_URL: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/app/DATABASE_URL
          BETTER_AUTH_SECRET: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/app/BETTER_AUTH_SECRET
          BETTER_AUTH_URL: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/app/BETTER_AUTH_URL
          CORS_ORIGIN: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/app/CORS_ORIGIN
          R2_ACCOUNT_ID: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_ACCOUNT_ID
          R2_ACCESS_KEY_ID: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_ACCESS_KEY_ID
          R2_SECRET_ACCESS_KEY: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_SECRET_ACCESS_KEY
          R2_BUCKET_NAME: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_BUCKET_NAME
          DOMAIN_NAME: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/infra/DOMAIN_NAME
          ACME_EMAIL: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/infra/ACME_EMAIL

      - name: Render .env
        run: |
          umask 077
          cat > .env <<EOF
          IMAGE_TAG=${GITHUB_SHA}
          GITHUB_REPOSITORY=${GITHUB_REPOSITORY}
          NODE_ENV=production
          POSTGRES_DB=${POSTGRES_DB}
          POSTGRES_USER=${POSTGRES_USER}
          POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
          DATABASE_URL=${DATABASE_URL}
          BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
          BETTER_AUTH_URL=${BETTER_AUTH_URL}
          CORS_ORIGIN=${CORS_ORIGIN}
          R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
          R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
          R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
          R2_BUCKET_NAME=${R2_BUCKET_NAME}
          DOMAIN_NAME=${DOMAIN_NAME}
          ACME_EMAIL=${ACME_EMAIL}
          EOF
          chmod 600 .env

      - name: Tailscale up
        uses: tailscale/github-action@v3
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
          tags: tag:prod-ci

      - name: Prepare SSH
        run: |
          mkdir -p ~/.ssh
          chmod 0700 ~/.ssh
          ssh-keyscan -H prive >> ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts

      - name: Verify SSH connection
        run: ssh -o ConnectTimeout=30 cicd@prive 'echo ok'

      - name: Stage files on VPS
        run: |
          ssh cicd@prive 'mkdir -p ~/prive-admin'
          scp docker-compose.yml Caddyfile .env cicd@prive:~/prive-admin/

      - name: Deploy stack
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GH_ACTOR: ${{ github.actor }}
        run: |
          ssh cicd@prive \
            "cd ~/prive-admin && \
             echo '${GH_TOKEN}' | docker login ghcr.io -u '${GH_ACTOR}' --password-stdin && \
             docker compose pull && \
             docker compose up -d --remove-orphans && \
             docker image prune -f"

      - name: Smoke check
        run: |
          for i in 1 2 3 4 5; do
            if curl -fsS --max-time 10 https://prive.salon/ > /dev/null; then
              echo "smoke check ok"
              exit 0
            fi
            echo "attempt $i failed, retrying in 10s"
            sleep 10
          done
          echo "smoke check failed after 5 attempts"
          exit 1
```

- [ ] **Step 2: Validate workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"`
Expected: no output.

- [ ] **Step 3: Lint with actionlint (if available)**

Run: `actionlint .github/workflows/release.yml || echo "actionlint not installed; skipping"`
Expected: no errors. If actionlint is not installed, skip — full validation happens on the runner.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci(release): add deploy job — 1Password secrets, Tailscale SSH, compose up"
```

---

## Task 9: Restore + adapt backup script

**Files:**
- Create: `scripts/backup_postgres.sh` (restored from history, adapted for compose)

The current backup workflow (`.github/workflows/backup-postgres.yml`) references `scripts/backup_postgres.sh`, which was deleted during the tanstack rewrite. Restore it, adapted to run `pg_dump` via `docker compose exec` so it works against the new compose-managed Postgres without exposing port 5432 on the host.

- [ ] **Step 1: Create `scripts/backup_postgres.sh`**

```bash
#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${HOME}/db_backups"
COMPOSE_DIR="${COMPOSE_DIR:-${HOME}/prive-admin}"

mkdir -p "${BACKUP_DIR}"

# Prune backups older than 14 days
find "${BACKUP_DIR}" -name "postgres_backup_*.sql" -type f -mtime +14 -delete

OUT="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql"

# Run pg_dump inside the postgres container — avoids exposing 5432 on the host.
# PG_USER / PG_DATABASE come from the workflow env. Password is read from the
# container's own POSTGRES_PASSWORD via `printenv` to avoid leaking into the
# host process table.
docker compose --project-directory "${COMPOSE_DIR}" exec -T postgres \
  bash -c 'PGPASSWORD="$(printenv POSTGRES_PASSWORD)" pg_dump \
            -U "'"${PG_USER}"'" --clean --create "'"${PG_DATABASE}"'"' \
  > "${OUT}"

echo "Backup written: ${OUT}"
```

- [ ] **Step 2: Make executable and lint**

Run:
```bash
chmod +x scripts/backup_postgres.sh
shellcheck scripts/backup_postgres.sh || echo "shellcheck not installed; skipping"
```
Expected: no errors. If shellcheck not available, skip.

- [ ] **Step 3: Commit**

```bash
git add scripts/backup_postgres.sh
git commit -m "feat(scripts): restore backup_postgres.sh, adapt for compose exec"
```

---

## Task 10: Migrate backup workflow to 1Password

**Files:**
- Modify: `.github/workflows/backup-postgres.yml`

- [ ] **Step 1: Rewrite `backup-postgres.yml` to source secrets from 1Password**

```yaml
name: Daily Postgres Backup

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

jobs:
  backup:
    environment:
      name: production
      url: https://prive.salon
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Load secrets from 1Password
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          POSTGRES_DB: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/postgres/POSTGRES_DB
          POSTGRES_USER: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/postgres/POSTGRES_USER
          R2_ACCOUNT_ID: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_ACCOUNT_ID
          R2_ACCESS_KEY_ID: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_ACCESS_KEY_ID
          R2_SECRET_ACCESS_KEY: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_SECRET_ACCESS_KEY
          R2_BUCKET_NAME: op://5gq2basjdplfjk5v55wexp2y7i/prive-admin-prod/r2/R2_BUCKET_NAME

      - name: Tailscale up
        uses: tailscale/github-action@v3
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
          tags: tag:prod-ci

      - name: Prepare SSH
        run: |
          mkdir -p ~/.ssh
          chmod 0700 ~/.ssh
          ssh-keyscan -H prive >> ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts

      - name: Copy backup script to VPS
        run: scp scripts/backup_postgres.sh cicd@prive:~/backup_postgres.sh

      - name: Run backup script on VPS
        run: |
          ssh cicd@prive "
            chmod +x ~/backup_postgres.sh && \
            PG_USER='${POSTGRES_USER}' \
            PG_DATABASE='${POSTGRES_DB}' \
            ~/backup_postgres.sh"

      - name: Install s3cmd
        run: |
          sudo apt-get update -y
          sudo apt-get install -y s3cmd

      - name: Upload backup to Cloudflare R2
        run: |
          set -e
          FILE_NAME=$(ssh cicd@prive 'ls -t ~/db_backups/ | head -n1')
          ssh cicd@prive "cat ~/db_backups/${FILE_NAME}" > "${FILE_NAME}"
          cat > ~/.s3cfg <<EOF
          [default]
          access_key = ${R2_ACCESS_KEY_ID}
          secret_key = ${R2_SECRET_ACCESS_KEY}
          host_base = ${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
          host_bucket = %(bucket)s.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
          bucket_location = auto
          use_https = True
          EOF
          s3cmd put "${FILE_NAME}" "s3://${R2_BUCKET_NAME}/${FILE_NAME}"
          s3cmd info "s3://${R2_BUCKET_NAME}"
          echo "Uploaded ${FILE_NAME} to r2://${R2_BUCKET_NAME}"
```

Notes:
- The script reads `POSTGRES_PASSWORD` from inside the container, so the workflow does not need to know it.
- The 1Password vault stores the bucket name as `R2_BUCKET_NAME` (matches the env package). The script uses that name directly — no rename of the old `R2_BUCKET` variable needed.
- The `POSTGRES_DB` field is mapped to `PG_DATABASE` when invoking the script, preserving the script's existing parameter name.

- [ ] **Step 2: Validate workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/backup-postgres.yml'))"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/backup-postgres.yml
git commit -m "ci(backup): source secrets from 1Password, run pg_dump via compose exec"
```

- [ ] **Step 4: After PR merge — verify a backup run**

```bash
gh workflow run "Daily Postgres Backup"
gh run watch
```
Expected: workflow green; new object in the R2 bucket; latest dump on the VPS at `~/db_backups/`. If fails: read the failing step's logs, fix forward.

- [ ] **Step 5: Remove now-unused GH Actions secrets**

Once a backup run succeeds:
```bash
gh secret delete POSTGRES_USER
gh secret delete POSTGRES_PASSWORD
gh secret delete POSTGRES_DATABASE
gh secret delete R2_ACCESS_KEY_ID
gh secret delete R2_SECRET_ACCESS_KEY
gh secret delete R2_BUCKET
gh secret delete R2_ACCOUNT_ID
gh secret delete BETTER_AUTH_SECRET
```
Keep: `OP_SERVICE_ACCOUNT_TOKEN`, `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`.

---

## Task 11: README pointer

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append a Deployment section to `README.md`**

Add after the existing "Available Scripts" section:

```markdown
## Deployment

The production stack runs on VPS `prive` via Docker Compose. The
authoritative deploy doc is [`docs/deploy/vps-setup.md`](docs/deploy/vps-setup.md).

- Pushes to `main` build and publish `ghcr.io/<repo>:{latest,sha}` and
  deploy to the VPS automatically (`.github/workflows/release.yml`).
- All runtime secrets live in the 1Password vault
  `5gq2basjdplfjk5v55wexp2y7i`, item `prive-admin-prod`. The workflow
  pulls them at deploy time using a service-account token
  (`OP_SERVICE_ACCOUNT_TOKEN`).
- Rollback to a previous image:

  ```bash
  ssh cicd@prive 'cd ~/prive-admin && IMAGE_TAG=<old-sha> docker compose up -d web'
  ```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): document deployment + rollback"
```

---

## Task 12: Open PR

- [ ] **Step 1: Push branch and open PR**

```bash
git push -u origin feat/deploy-pipeline
gh pr create --base main --title "Compose-based deploy pipeline with 1Password secrets" --body "$(cat <<'EOF'
## Summary

- Replaces Docker Swarm deploy with a Compose stack (`caddy`, `web`, `postgres`) on the VPS.
- Adds Caddy reverse proxy with automatic Let's Encrypt TLS.
- Builds and pushes `ghcr.io/<repo>:{latest,sha}` on every push to `main`.
- Sources all runtime secrets from 1Password vault `5gq2basjdplfjk5v55wexp2y7i` via a service-account token.
- PR check now also runs a no-push container build to catch Dockerfile breaks.
- Migrates the daily Postgres backup workflow to read secrets from the same vault and `pg_dump` via `docker compose exec`.

## Operational checklist

- [ ] 1Password vault item `prive-admin-prod` created and filled (Task 5).
- [ ] `OP_SERVICE_ACCOUNT_TOKEN` set as a GitHub Actions secret.
- [ ] VPS host directories created per `docs/deploy/vps-setup.md` (Task 6).
- [ ] DNS for `prive.salon` points at the VPS public IP.
- [ ] First master deploy succeeded; Caddy issued a TLS certificate.
- [ ] Backup workflow run succeeded against the new stack.
- [ ] Stale GH Actions secrets removed (Task 10, Step 5).

## Test plan

- [ ] PR check (`pr-build.yml`) — both `Source Build` and `Docker Image Build` jobs green.
- [ ] After merge: `Release` workflow `build-and-push` job pushes both `:latest` and `:<sha>` tags to GHCR.
- [ ] After merge: `Release` workflow `deploy` job ends with a passing `curl` smoke check against `https://prive.salon/`.
- [ ] After merge: `gh workflow run "Daily Postgres Backup"` produces a dump in R2 and on the VPS.
- [ ] Manual rollback by re-running `docker compose up -d web` with `IMAGE_TAG=<previous-sha>` succeeds.
EOF
)"
```

- [ ] **Step 2: Verify PR checks**

Run: `gh pr checks --watch`
Expected: both `Source Build` and `Docker Image Build` green. If red, read the run logs and fix forward in the same branch.

---

## Self-review notes

- Spec coverage: every spec section maps to a task — Architecture/Files → T1–T3, T6; Vault layout → T5; release.yml → T7+T8; pr-build.yml → T4; backup-postgres.yml → T9+T10; VPS prerequisites → T6; failure modes/rollback → T6 (doc), T11 (README), T12 (PR test plan).
- Placeholder scan: file paths, code, and commands are concrete throughout. Service-account vault scope and field names are exact; only operator inputs (`<value>`, `<email>`, `<paste-token>`) are placeholders, by design.
- Type/name consistency: `IMAGE_TAG`, `GITHUB_REPOSITORY`, `POSTGRES_DB`, `DOMAIN_NAME`, `ACME_EMAIL`, and the `op://` paths are spelled identically across `.env.example`, `docker-compose.yml`, `release.yml`, and `backup-postgres.yml`. The `R2_BUCKET_NAME` field name matches the existing env schema in `packages/env/src/server.ts` (the old workflow's `R2_BUCKET` is dropped).
