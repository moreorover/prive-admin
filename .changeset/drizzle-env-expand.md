---
"@prive-admin-tanstack/db": patch
---

fix(db): expand env vars in drizzle.config so DATABASE_URL resolves under turbo

`apps/web/.env`'s `DATABASE_URL` interpolates `${POSTGRES_USER}/${POSTGRES_PASSWORD}/${POSTGRES_DB}`. Plain `dotenv.config()` doesn't expand those references, so any `bun run db:*` command (turbo-wrapped) hung at "Pulling schema from database..." and exited 1. Wrapping the load with `dotenv-expand` resolves the references before drizzle-kit reads them.
