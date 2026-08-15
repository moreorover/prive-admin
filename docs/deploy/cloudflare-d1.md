# Cloudflare D1 Deployment

## Resources

- Dev server Worker: `prive-admin-server-dev`
- Dev web Worker/assets: `prive-admin-web-dev`
- Dev D1 database: `prive-admin-dev`
- Dev R2 uploads bucket: `prive-admin-dev`
- Production server Worker: `prive-admin-server-prod`
- Production web Worker/assets: `prive-admin-web-prod`
- Production D1 database: `prive-admin-prod`
- Production R2 uploads bucket: `prive-admin-prod`
- Upload bucket binding: `UPLOADS_BUCKET`
- Generated dev server URL: `https://prive-admin-server-dev.mselvenis.workers.dev`
- Generated dev web URL: `https://prive-admin-web-dev.mselvenis.workers.dev`
- Generated production server URL: `https://prive-admin-server-prod.mselvenis.workers.dev`
- Generated production web URL: `https://prive-admin-web-prod.mselvenis.workers.dev`

## One-Time Provisioning

Alchemy needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ALCHEMY_PASSWORD`, and `ALCHEMY_STATE_TOKEN` in
non-interactive environments. Runtime values are stored in 1Password. GitHub Actions loads 1Password values after the
matching GitHub environment is approved. The Alchemy stack passes Worker variables such as `BETTER_AUTH_URL`,
`CORS_ORIGIN`, `NODE_ENV`, and `VITE_SERVER_URL`.

1. Create the remote D1 databases:

   ```bash
   pnpm --dir apps/server exec wrangler d1 create prive-admin-dev
   pnpm --dir apps/server exec wrangler d1 create prive-admin-prod
   ```

2. Keep the returned `database_id` values in `apps/server/wrangler.jsonc` for local Wrangler tooling.
3. Create the remote R2 buckets:

   ```bash
   pnpm --dir apps/server exec wrangler r2 bucket create prive-admin-dev
   pnpm --dir apps/server exec wrangler r2 bucket create prive-admin-prod
   ```

4. Confirm the matching GitHub environment has required reviewers.
5. Confirm the matching 1Password item contains:

   - `cloudflare/account-id`
   - `cloudflare/api-token`
   - `workers/cors-origin`
   - `workers/node-env`
   - `better-auth/BETTER_AUTH_SECRET`
   - `better-auth/BETTER_AUTH_URL`
   - `web/VITE_SERVER_URL`

## First Alchemy Deploy

1. Adopt the existing dev and production Cloudflare resources into Alchemy state:

   ```bash
   vp run deploy:alchemy -- --stage dev --adopt
   vp run deploy:alchemy -- --stage prod --adopt
   ```

2. After adoption, deploy through GitHub Actions.

   CI deploys load runtime values from 1Password. Avoid local deploy shortcuts for normal releases so GitHub
   environment approvals and build-before-deploy ordering are preserved.

## Manual Migration Fallback

Remote D1 migrations normally run through the Alchemy stack. If an operator needs to apply migrations manually while
recovering a failed deployment, use Wrangler directly:

   ```bash
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-dev --remote --env dev
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-prod --remote --env prod
   ```

## GitHub Actions

- Pull requests deploy to dev through `.github/workflows/cloudflare-dev-deploy.yml` after `cloudflare-dev`
  approval.
- Pushes to `main` deploy to production through `.github/workflows/cloudflare-prod-deploy.yml` after
  `cloudflare-prod` approval.
- Pull requests also create isolated preview stages through `.github/workflows/cloudflare-alchemy-preview.yml`.
- Stable dev and production deployments run through Alchemy, including D1 migrations and Worker deployments.

## Deployment Ownership

Alchemy owns Cloudflare app infrastructure for dev, production, and PR preview stages:

- Server Worker code and bindings.
- Web Worker code and static assets.
- D1 databases and migrations.
- R2 uploads buckets and Worker bindings.

Wrangler remains local tooling for development, D1 copy operations, and manual migration fallback commands.

## Validation

- Open server `/` and confirm `OK`.
- Open server `/api/auth/session`.
- Log in with an existing user.
- Open `/dashboard`, `/customers`, `/calendar`, `/cash`, `/legal-entities`, and `/documents`.
- Check Cloudflare D1 query metrics after smoke testing.

## Refresh Dev From Production

Use the guarded D1 copy script when dev needs current production data:

```bash
vp run db:copy:prod-to-dev
vp run db:copy:dev-to-local
vp run db:copy:prod-to-local
```

The shared script exports the selected remote source, drops all non-internal tables from the selected target, and imports
the export into that target. Use `vp run db:copy:prod-to-dev` to refresh remote dev from production,
`vp run db:copy:dev-to-local` to seed local D1 from dev, or `vp run db:copy:prod-to-local` to seed local D1 directly
from production. When `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are not already set, the script reads them from
the matching 1Password item: `prive-admin-cloudflare-prod` for production source copies and `prive-admin-cloudflare-dev`
for dev source copies.

## Follow-Up

- Attach the custom domain.
- Move production values into a dedicated `prive-admin-cloudflare-prod` 1Password item once the Cloudflare
  production domain strategy is finalized.
