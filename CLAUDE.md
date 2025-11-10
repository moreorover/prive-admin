# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Style

- In all interactions and commit messages, be extremely concise and sacrifice grammar for concision.

## PR Comments

<pr-comment-rule>
When adding a PR comment with a TODO, use checkbox markdown:

<example>
- [ ] Description here
</example>
</pr-comment-rule>
- Tag Claude in GitHub issues with '@claude'

## GitHub

- Use GitHub CLI for all GitHub interactions

## Git

- Prefix branches with `martin/`
- Commit messages: imperative mood, no periods, ~50 chars max

## Plans

- End each plan with unresolved questions (if any). Extremely concise. Sacrifice grammar.

## Tech Stack

**Monorepo**: Turborepo + pnpm workspaces
**Frontend**: React 19 + TanStack Router (file-based) + TanStack Query + Vite
**Backend**: Hono + tRPC 11 + Better Auth
**Database**: PostgreSQL + Drizzle ORM
**Validation**: Zod
**Styling**: TailwindCSS 4 + shadcn/ui
**Linting**: Biome

## Common Commands

### Development
```bash
pnpm dev              # Start web (3001) + server (3000)
pnpm dev:web          # Frontend only
pnpm dev:server       # Backend only
```

### Database
```bash
pnpm db:start         # Start PostgreSQL via Docker
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:stop          # Stop container
```

### Build & Quality
```bash
pnpm build            # Build all apps
pnpm check-types      # TypeScript check
pnpm check            # Biome lint/format with --write
```

## Architecture

### Monorepo Structure
- `apps/web` - Frontend (React + TanStack Router)
- `apps/server` - Backend (Hono + tRPC)
- `packages/api` - tRPC routers & business logic
- `packages/auth` - Better Auth config
- `packages/db` - Drizzle schemas & client
- `packages/tsconfig` - Shared TS config

### Type Safety Flow
```
Drizzle schema → Zod schema → tRPC types → React components
```

### Backend Stack
```
apps/server/src/index.ts (Hono server)
  ↓
packages/api/src/routers/* (tRPC routers)
  ↓
packages/db/src/schema/* (Drizzle schemas)
  ↓
PostgreSQL
```

### Frontend Stack
```
apps/web/src/routes/* (File-based routing)
  ↓
apps/web/src/features/* (Feature components)
  ↓
tRPC Client → Backend API
```

### tRPC Procedures
- `publicProcedure` - No auth required
- `protectedProcedure` - Session required (middleware checks auth)

### Database Patterns
- UUID primary keys with `defaultRandom()`
- Auto timestamps: `createdAt`, `updatedAt`
- Soft references via `createdById`
- Relations defined separately using Drizzle relations API
- Zod schemas auto-generated via `drizzle-zod`

### Authentication
- Better Auth with email/password
- Admin plugin enabled
- Session-based with secure cookies
- Protected routes via TanStack Router `beforeLoad` hooks
- Protected tRPC procedures with session validation

### Routing Structure
- File-based routing in `apps/web/src/routes/`
- `__root.tsx` - Root layout, theme provider, auth check
- `_authenticated.tsx` - Auth guard layout (redirects to `/signin` if no user)
- `_authenticated/dashboard/` - Main app routes
- Auto-generated route tree via `@tanstack/router-plugin`

### Database Schema Files
Located in `packages/db/src/schema/`:
- `auth.ts` - Better Auth tables (user, session, account, verification)
- `booking.ts` - Booking appointments
- `customer.ts` - Customer records
- `hairOrder.ts` - Hair order management
- `entityHistory.ts` - Audit trail for entity changes

### Component Organization
- `components/ui/` - shadcn/ui primitives
- `components/data-table/` - Reusable TanStack Table components
- `features/` - Feature modules (customers, bookings)

### Configuration Files
- `turbo.json` - Build orchestration, task caching
- `biome.json` - Linting/formatting rules, sorted Tailwind classes
- `packages/db/drizzle.config.ts` - Drizzle config
- `apps/web/vite.config.ts` - Vite + TanStack Router plugin
- `pnpm-workspace.yaml` - Workspace setup with catalog

## Environment Variables

Located in `apps/server/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Frontend URL for CORS (http://localhost:3001)
