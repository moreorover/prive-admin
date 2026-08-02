# Cloudflare D1 Deployment

## Resources

- Dev server Worker: `prive-admin-server-dev`
- Dev web Worker/assets: `prive-admin-web-dev`
- Dev D1 database: `prive-admin-dev`
- Upload bucket binding: `UPLOADS_BUCKET`
- Existing R2 bucket: `prive-admin`
- Generated dev server URL: `https://prive-admin-server-dev.mselvenis.workers.dev`
- Generated dev web URL: `https://prive-admin-web-dev.mselvenis.workers.dev`

## One-Time Provisioning

Wrangler needs `CLOUDFLARE_API_TOKEN` in non-interactive environments. Dev deployment values are stored in the
`prive-admin-cloudflare-dev` 1Password item and loaded by `.github/workflows/cloudflare-dev-deploy.yml` after
GitHub environment approval for `cloudflare-dev`.

1. Create the remote D1 database:

   ```bash
   pnpm --dir apps/server exec wrangler d1 create prive-admin-dev
   ```

2. Copy the returned `database_id` into `apps/server/wrangler.jsonc`.
3. Confirm the GitHub `cloudflare-dev` environment has required reviewers.
4. Confirm the `prive-admin-cloudflare-dev` 1Password item contains:

   - `cloudflare/api-token`
   - `workers/cors-origin`
   - `workers/node-env`
   - `better-auth/BETTER_AUTH_SECRET`
   - `better-auth/BETTER_AUTH_URL`
   - `web/VITE_SERVER_URL`

## First Deploy

1. Apply remote migrations:

   ```bash
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-dev --remote
   ```

2. Deploy server and web:

   ```bash
   vp run cloudflare:deploy
   ```

   The script requires `CLOUDFLARE_API_TOKEN`, `CORS_ORIGIN`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`,
   `VITE_SERVER_URL`, and `NODE_ENV` in the process environment. In GitHub Actions, 1Password loads these after
   the `cloudflare-dev` environment is approved.

## Validation

- Open server `/` and confirm `OK`.
- Open server `/api/auth/session`.
- Log in with an existing user.
- Open `/dashboard`, `/customers`, `/calendar`, `/cash`, `/legal-entities`, and `/documents`.
- Check Cloudflare D1 query metrics after smoke testing.

## Follow-Up

- Attach the custom domain.
- Disable the VPS only after production validation passes.
