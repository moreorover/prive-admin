# Cloudflare D1 Deployment

## Resources

- Dev server Worker: `prive-admin-server-dev`
- Dev web Worker/assets: `prive-admin-web-dev`
- Dev D1 database: `prive-admin-dev`
- Production server Worker: `prive-admin-server-prod`
- Production web Worker/assets: `prive-admin-web-prod`
- Production D1 database: `prive-admin-prod`
- Upload bucket binding: `UPLOADS_BUCKET`
- Existing R2 bucket: `prive-admin`
- Generated dev server URL: `https://prive-admin-server-dev.mselvenis.workers.dev`
- Generated dev web URL: `https://prive-admin-web-dev.mselvenis.workers.dev`
- Generated production server URL: `https://prive-admin-server-prod.mselvenis.workers.dev`
- Generated production web URL: `https://prive-admin-web-prod.mselvenis.workers.dev`

## One-Time Provisioning

Wrangler needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in non-interactive environments. Dev deployment
values are stored in `prive-admin-cloudflare-dev`. Production app values are currently loaded from
`prive-admin-prod`, with Cloudflare account credentials loaded from `prive-admin-cloudflare-dev`. GitHub Actions
loads the values after the matching GitHub environment is approved.

1. Create the remote D1 databases:

   ```bash
   pnpm --dir apps/server exec wrangler d1 create prive-admin-dev
   pnpm --dir apps/server exec wrangler d1 create prive-admin-prod
   ```

2. Copy the returned `database_id` values into `apps/server/wrangler.jsonc`.
3. Confirm the matching GitHub environment has required reviewers.
4. Confirm the matching 1Password item contains:

   - `cloudflare/account-id`
   - `cloudflare/api-token`
   - `workers/cors-origin`
   - `workers/node-env`
   - `better-auth/BETTER_AUTH_SECRET`
   - `better-auth/BETTER_AUTH_URL`
   - `web/VITE_SERVER_URL`

## First Deploy

1. Apply remote migrations:

   ```bash
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-dev --remote --env dev
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-prod --remote --env prod
   ```

2. Deploy server and web:

   ```bash
   vp run cloudflare:deploy:dev
   VITE_SERVER_URL=https://prive-admin-server-prod.mselvenis.workers.dev vp run cloudflare:deploy:prod
   ```

   Local deploys require `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `VITE_SERVER_URL` in the process
   environment. Server runtime values are managed as Worker secrets in Cloudflare. In GitHub Actions, 1Password
   loads those values after the GitHub environment is approved, and `cloudflare/wrangler-action` updates the server
   Worker secrets before deploying.

## GitHub Actions

- Pull requests deploy to dev through `.github/workflows/cloudflare-dev-deploy.yml` after `cloudflare-dev`
  approval.
- Pushes to `main` deploy to production through `.github/workflows/cloudflare-prod-deploy.yml` after
  `cloudflare-prod` approval.
- Production migrations run before the production Workers are deployed.

## Validation

- Open server `/` and confirm `OK`.
- Open server `/api/auth/session`.
- Log in with an existing user.
- Open `/dashboard`, `/customers`, `/calendar`, `/cash`, `/legal-entities`, and `/documents`.
- Check Cloudflare D1 query metrics after smoke testing.

## Follow-Up

- Attach the custom domain.
- Move production values into a dedicated `prive-admin-cloudflare-prod` 1Password item once the Cloudflare
  production domain strategy is finalized.
