# prive-admin-tanstack

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **Mantine** - React component library (`@mantine/core`, `@mantine/form`, charts, dates, schedule, notifications, modals)
- **Shared UI package** - Mantine `MantineProvider`, theme, and color-scheme helpers live in `packages/ui`
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Vite+** - Unified runtime, package, build, lint, format, and test tooling

## Getting Started

First, install the dependencies:

```bash
vp install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/web/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
vp run db:push
```

Then, run the development server:

```bash
vp run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share Mantine setup through `packages/ui`.

- Tweak the theme in `packages/ui/src/theme.ts`
- Adjust the provider (color scheme, modals, notifications) in `packages/ui/src/provider.tsx`
- Edit global styles in `packages/ui/src/styles/globals.css`
- Mantine PostCSS preset config lives in `packages/ui/postcss.config.cjs`

Import shared exports like this:

```tsx
import { Provider as UIProvider } from "@prive-admin-tanstack/ui/provider"
import { theme } from "@prive-admin-tanstack/ui/theme"
import "@prive-admin-tanstack/ui/globals.css"
```

Mantine components are imported directly from `@mantine/*` packages in app code:

```tsx
import { Button } from "@mantine/core"
```

## Git Hooks and Formatting

- Format and lint fix: `vp run check`

## Project Structure

```
prive-admin-tanstack/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
├── packages/
│   ├── api/         # Shared API layer
│   ├── auth/        # Authentication configuration & logic (Better-Auth)
│   ├── config/      # Shared TS / tooling config
│   ├── db/          # Database schema & queries (Drizzle)
│   ├── env/         # Shared env loading & validation
│   └── ui/          # Mantine provider, theme, and global styles
```

## Available Scripts

- `vp run dev`: Start all applications in development mode
- `vp run build`: Build all applications
- `vp run dev:web`: Start only the web application
- `vp run check-types`: Check TypeScript types across all apps
- `vp run db:push`: Push schema changes to database
- `vp run db:generate`: Generate database client/types
- `vp run db:migrate`: Run database migrations
- `vp run db:studio`: Open database studio UI
- `vp run compose:up` / `compose:stop` / `compose:down` / `compose:watch`: Manage local dev compose stack (Postgres + MinIO)
- `vp run check`: Run Oxlint and Oxfmt

## Deployment

The production stack runs on VPS `prive` via Docker Compose. The
authoritative deploy doc is [`docs/deploy/vps-setup.md`](docs/deploy/vps-setup.md).

- Pull requests to `main` run source and Docker build checks
  (`.github/workflows/pr-build.yml`). Merges to `main` do not deploy.
- Creating a semver tag such as `v1.4.0` from a commit on `main` runs the
  release workflow, publishes `ghcr.io/<repo>-{web,server,migrate}` images
  tagged with `{latest,<commit-sha>,v1.4.0}`, and deploys that tag to the VPS
  (`.github/workflows/release.yml`).
- All runtime secrets live in the 1Password vault `prive-admin`,
  spread across three items: `prive-admin-prod` (app, postgres, infra),
  `Cloudflare R2` (R2 keys + bucket), and `tailscale-oauth` (TS
  OAuth). The workflow pulls them at deploy time using a
  service-account token (`OP_SERVICE_ACCOUNT_TOKEN` — the only
  remaining GitHub Actions secret).
- Rollback to a previous image:

  ```bash
  ssh root@prive 'cd ~/prive-admin && IMAGE_TAG=<old-tag-or-sha> docker compose up -d web'
  ```
