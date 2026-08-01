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

Wrangler needs `CLOUDFLARE_API_TOKEN` in this non-interactive environment.

1. Create the remote D1 database:

   ```bash
   pnpm --dir apps/server exec wrangler d1 create prive-admin-dev
   ```

2. Copy the returned `database_id` into `apps/server/wrangler.jsonc`.
3. Store the auth secret:

   ```bash
   pnpm --dir apps/server exec wrangler secret put BETTER_AUTH_SECRET --env dev
   ```

## First Deploy

1. Restore the latest Postgres backup locally:

   ```bash
   ./scripts/restore_postgres.sh
   ```

2. Export transformed D1 import SQL:

   ```bash
   vp run d1:export-from-postgres
   ```

3. Test the import locally:

   ```bash
   vp run d1:import:local
   vp run d1:verify-import
   ```

4. Apply remote migrations:

   ```bash
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-dev --remote
   ```

5. Import data remotely:

   ```bash
   vp run d1:import:remote
   D1_REMOTE=1 vp run d1:verify-import
   ```

6. Deploy server and web:

   ```bash
   vp run server:deploy
   vp run web:deploy
   ```

7. Confirm `apps/server/wrangler.jsonc` vars use the generated URLs:

   ```jsonc
   {
     "CORS_ORIGIN": "https://prive-admin-web-dev.mselvenis.workers.dev",
     "BETTER_AUTH_URL": "https://prive-admin-server-dev.mselvenis.workers.dev",
     "NODE_ENV": "production"
   }
   ```

8. Set `VITE_SERVER_URL` for the web deployment to the generated server Worker URL.

## Validation

- Open server `/` and confirm `OK`.
- Open server `/api/auth/session`.
- Log in with an existing user.
- Open `/dashboard`, `/customers`, `/calendar`, `/cash`, `/legal-entities`, and `/documents`.
- Check Cloudflare D1 query metrics after smoke testing.

## Follow-Up

- Attach the custom domain.
- Disable the VPS only after production validation passes.
