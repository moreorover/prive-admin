# prive-admin-tanstack

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **Mantine** - React component library (`@mantine/core`, `@mantine/form`, charts, dates, schedule, notifications, modals)
- **Shared UI package** - Mantine `MantineProvider`, theme, and color-scheme helpers live in `packages/ui`
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system
- **Changesets** - Versioning and changelog automation

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/web/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
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

- Format and lint fix: `bun run check`

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

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run compose:up` / `compose:stop` / `compose:down` / `compose:watch`: Manage local dev compose stack (Postgres + MinIO)
- `bun run check`: Run Oxlint and Oxfmt

## Deployment

The production stack runs on VPS `prive` via Docker Compose. The
authoritative deploy doc is [`docs/deploy/vps-setup.md`](docs/deploy/vps-setup.md).

- Pushes to `main` build and publish `ghcr.io/<repo>:{latest,sha}` and
  deploy to the VPS automatically (`.github/workflows/release.yml`).
- All runtime secrets live in the 1Password vault `prive-admin`,
  spread across three items: `prive-admin-prod` (app, postgres, infra),
  `Cloudflare R2` (R2 keys + bucket), and `tailscale-oauth` (TS
  OAuth). The workflow pulls them at deploy time using a
  service-account token (`OP_SERVICE_ACCOUNT_TOKEN` — the only
  remaining GitHub Actions secret).
- Rollback to a previous image:

  ```bash
  ssh root@prive 'cd ~/prive-admin && IMAGE_TAG=<old-sha> docker compose up -d web'
  ```
