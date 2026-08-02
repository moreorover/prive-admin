# prive-admin-tanstack

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **Mantine** - React component library (`@mantine/core`, `@mantine/form`, charts, dates, schedule, notifications, modals)
- **Shared UI package** - Mantine `MantineProvider`, theme, and color-scheme helpers live in `packages/ui`
- **Drizzle** - TypeScript-first ORM
- **Cloudflare D1** - SQLite-compatible database engine
- **Authentication** - Better-Auth
- **Vite+** - Unified runtime, package, build, lint, format, and test tooling

## Getting Started

First, install the dependencies:

```bash
vp install
```

## Local Development

This project uses Cloudflare Workers with D1 and Wrangler for local and remote runtime behavior.

1. Create local Worker secrets:

   ```bash
   cp apps/server/.dev.vars.example apps/server/.dev.vars
   ```

2. Start the local apps:

   ```bash
   vp run dev
   ```

Open the local web URL printed by Vite+ in your browser:

- Web app: `http://localhost:3001`
- Worker API: `http://localhost:3000`
- Wrangler local explorer: `http://localhost:3000/cdn-cgi/local/explorer/`

The local explorer shows local D1 and R2 contents while `vp run dev` is running.

Schema changes are generated with:

```bash
vp run db:generate
```

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
- `vp run dev:server`: Start only the server Worker with Wrangler
- `vp run check-types`: Check TypeScript types across all apps
- `vp run db:generate`: Generate D1-compatible Drizzle migrations
- `vp run db:migrate`: Run database migrations through Drizzle tooling
- `vp run db:copy:prod-to-dev`: Refresh remote dev D1 from remote production D1
- `vp run db:copy:dev-to-local`: Refresh local D1 from remote dev D1
- `vp run db:copy:prod-to-local`: Refresh local D1 from remote production D1
- `vp run db:studio`: Open database studio UI
- `vp run check`: Run Oxlint and Oxfmt

## Deployment

Deployments target Cloudflare Workers, D1, and R2. The authoritative deploy
runbook is [`docs/deploy/cloudflare-d1.md`](docs/deploy/cloudflare-d1.md).

- Pull requests to `main` run source checks and the environment-gated
  Cloudflare dev deployment.
- Pushes to `main` run the environment-gated Cloudflare production deployment.
- Runtime values live in the 1Password vault `prive-admin`, in
  environment-specific items such as `prive-admin-cloudflare-dev`.
- GitHub Actions loads 1Password values after the matching GitHub environment
  approval and deploys through `cloudflare/wrangler-action`.
