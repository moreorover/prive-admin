# Cloudflare D1 Deployment

## Resources

- Server Worker: `prive-admin-server`
- Web Worker/assets: `prive-admin-web`
- D1 database: `prive-admin-d1`
- Upload bucket binding: `UPLOADS_BUCKET`
- Existing R2 bucket: `prive-admin`

## One-Time Provisioning

Wrangler needs `CLOUDFLARE_API_TOKEN` in this non-interactive environment.

1. Create the remote D1 database:

   ```bash
   pnpm --dir apps/server exec wrangler d1 create prive-admin-d1
   ```

2. Copy the returned `database_id` into `apps/server/wrangler.jsonc`, replacing `replace-with-cloudflare-d1-database-id`.
3. Store the auth secret:

   ```bash
   pnpm --dir apps/server exec wrangler secret put BETTER_AUTH_SECRET
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
   pnpm --dir apps/server exec wrangler d1 migrations apply prive-admin-d1 --remote
   ```

5. Import data remotely:

   ```bash
   vp run d1:import:remote
   vp run d1:verify-import -- --remote
   ```

6. Deploy server and web:

   ```bash
   vp run server:deploy
   vp run web:deploy
   ```

7. Update `apps/server/wrangler.jsonc` vars with generated URLs:

   ```jsonc
   {
     "CORS_ORIGIN": "https://<web>.workers.dev",
     "BETTER_AUTH_URL": "https://<server>.workers.dev",
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
