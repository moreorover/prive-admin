# VPS Setup (`prive`)

One-time prerequisites for the production host before the deploy
workflow can run. The deploy workflow is the only continuous owner of
the stack; this document is for first-time provisioning and recovery.

## Requirements

- Linux host (Ubuntu 22.04 or later assumed) with public IPv4.
- SSH access as `root` (the GitHub Actions Tailscale identity's public
  key in `/root/.ssh/authorized_keys`).
- Tailscale installed, logged in, with ACL tag `tag:prod` so the
  `tag:prod-ci` runners can reach it.

## SSH key

Install the deploy identity's public key for the `root` user:

```bash
sudo install -d -m 0700 /root/.ssh
sudo install -m 0600 /dev/stdin /root/.ssh/authorized_keys <<'KEY'
<paste the public key matching the GitHub Actions Tailscale identity>
KEY
```

## Install

```bash
# Docker Engine + compose plugin
curl -fsSL https://get.docker.com | sh

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --advertise-tags=tag:prod
```

## Tailscale ACL

The deploy and backup workflows authenticate as `tag:prod-ci` and
SSH the VPS by its short tailnet name `prive`. The tailnet ACL
must:

- List your operator identity under `tagOwners` for both `tag:prod`
  and `tag:prod-ci`, otherwise `tailscale up --advertise-tags=tag:prod`
  and the GitHub Actions OAuth tags will be rejected.
- Allow `tag:prod-ci` to reach `tag:prod` on TCP `22`.
- Have MagicDNS enabled in the tailnet, and the VPS machine renamed
  to `prive` (admin console → Machines → rename), so that
  `ssh root@prive` resolves.

## Host directories

```bash
sudo mkdir -p /var/lib/prive-admin/{pg,caddy/data,caddy/config}
sudo chown -R 70:70 /var/lib/prive-admin/pg
sudo mkdir -p /root/prive-admin
```

The `70:70` ownership matches the `postgres` user inside the official
`postgres:18-alpine` image. Caddy runs as root in `caddy:2-alpine`, so
its bind-mount paths under `/var/lib/prive-admin/caddy/` need no
special chown — root inside the container can write to them.

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

The deploy workflow logs into `ghcr.io` on every run using the
ephemeral `GITHUB_TOKEN`. No manual login is required.

## First deploy

Push (or merge) to `main` and watch the `Release` workflow run. The
`deploy` job ends with a `curl` smoke check against
`https://prive.salon/`; a passing job means the stack is up.

## Rollback

```bash
ssh root@prive 'cd ~/prive-admin && IMAGE_TAG=<old-sha> docker compose up -d web'
```

GHCR retains older `:<sha>` tags by default. Pick a known-good sha
from the GitHub Actions history.

## Routine operations

- View logs: `ssh root@prive 'cd ~/prive-admin && docker compose logs -f <service>'`
- Restart web: `ssh root@prive 'cd ~/prive-admin && docker compose restart web'`
- Database shell: `ssh root@prive 'cd ~/prive-admin && docker compose exec postgres sh -c '\''psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'\'''`
