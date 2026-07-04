# TanStack Router, Hono, and tRPC Migration Design

## Context

The current `prive-admin` web app uses TanStack Start as a full-stack runtime. The web app contains:

- TanStack Start Vite plugin and Nitro integration in `apps/web/vite.config.ts`.
- Start middleware in `apps/web/src/middleware`.
- Start server functions in `apps/web/src/functions`.
- Start API routes in `apps/web/src/routes/api`.
- SSR-oriented root markup and query integration in `apps/web/src/routes/__root.tsx` and `apps/web/src/router.tsx`.
- Better Auth configured with the TanStack Start cookie plugin.

The sample project at `/Users/mselvenis/dev/my-better-t-app` uses a different boundary:

- `apps/server` is a Hono REST server.
- Better Auth is mounted at `/api/auth/*`.
- tRPC is mounted at `/trpc/*`.
- `apps/web` is a client-side-rendered TanStack Router app.
- The web app talks to the server through a typed tRPC client and normal `fetch` calls for non-tRPC endpoints.

This migration should move `prive-admin` to the sample architecture.

## Goals

- Introduce a new `apps/server` Hono app.
- Introduce a typed tRPC API layer, modeled after the sample project.
- Convert `apps/web` from TanStack Start to client-side TanStack Router.
- Move database-backed business operations out of the web app runtime and into server-side tRPC routers.
- Keep file upload, preview, and export endpoints as Hono REST endpoints because they use multipart data, binary responses, or streams.
- Remove TanStack Start dependencies and imports once no code depends on them.

## Non-Goals

- Redesign the domain model or database schema.
- Redesign the UI.
- Replace React Query.
- Replace Better Auth.
- Convert file upload/export behavior to tRPC.
- Add broad unrelated refactors while moving code.

## Recommended Approach

Use a domain-preserving migration. Each current `apps/web/src/functions/*` module maps to a tRPC router or procedures in `packages/api`, while the current route and component code is updated to consume `trpc.<domain>.<procedure>.queryOptions()` and `mutationOptions()`.

This approach is preferred over compatibility wrappers because the final ownership boundary is explicit: server code lives in server packages, and web code consumes a typed API. It is also preferred over a large API redesign because the migration is already broad and should remain verifiable.

## Architecture

### Server App

Add `apps/server` as a Hono Node server with:

- `GET /` health check returning OK.
- `GET|POST /api/auth/*` forwarded to `auth.handler`.
- `/trpc/*` served by `@hono/trpc-server`.
- Hono REST endpoints for uploads, previews, exports, and any other binary or multipart operations.
- CORS configured from `env.CORS_ORIGIN` with credentials enabled.

### API Package

Add `packages/api` with:

- `src/index.ts` defining `initTRPC`, `router`, `publicProcedure`, and `protectedProcedure`.
- `src/context.ts` reading the Better Auth session from Hono request headers.
- `src/routers/index.ts` composing domain routers and exporting `AppRouter`.
- `src/routers/*` files for each current domain.

The `protectedProcedure` must reject missing sessions with `TRPCError({ code: "UNAUTHORIZED" })`.

### Web App

Convert `apps/web` to client-side TanStack Router:

- Replace `@tanstack/react-start/plugin/vite` with `@tanstack/router-plugin/vite`.
- Remove Nitro from the web app Vite config unless another non-Start need remains.
- Add `apps/web/src/main.tsx` that creates the router and renders `RouterProvider`.
- Move router creation into the CSR entry or keep a small router module without SSR integration.
- Remove `@tanstack/react-router-ssr-query` usage.
- Update the root route from document markup to a normal React component.
- Remove `<Scripts />`, `<html>`, `<head>`, and `<body>` ownership from route components.
- Keep client route loaders for React Query prefetching.

### Auth

Better Auth remains in `packages/auth`, but it should no longer use `tanstackStartCookies()`.

The Hono server mounts:

- `GET /api/auth/*`
- `POST /api/auth/*`

The web auth client should be configured with `baseURL: env.VITE_SERVER_URL`, matching the sample project. Browser requests must use credentials where needed.

Client route guards can use Better Auth client session state or a tRPC session query. Server-side enforcement happens in `protectedProcedure` and in protected Hono REST endpoints.

## tRPC Domain Mapping

The current Start server functions should become tRPC procedures grouped by domain:

- `customers`: `list`, `byId`, `create`, `update`, `summary`.
- `appointments`: `list`, `byId`, `create`, `linkPersonnel`, `updateMaster`, `byCustomerId`.
- `transactions`: `byAppointmentId`, `create`, `update`, `delete`.
- `cashTransactions`: `list`, `create`, `update`, `delete`.
- `hairOrders`: `list`, `byId`, `create`, `update`, `recalculatePrices`.
- `hairAssigned`: `byAppointment`, `byCustomer`, `availableOrders`, `create`, `update`, `delete`.
- `bankAccounts`: `byId`, `create`, `update`.
- `bankStatementEntries`: `importCsv`, `list`, `byId`, `ignore`, `undo`.
- `bankStatementAttachments`: `list`, `unassigned`, `counts`, `assignToEntry`, `unassign`, `delete`.
- `legalEntities`: `list`, `byId`, `update`.
- `salons`: `list`, `byId`, `create`, `update`.
- `notes`: `list`, `create`, `delete`.
- `reports`: `bankAccountMonthlyBreakdown`.
- `dashboard`: `transactionStatsForDate`, `hairAssignedStatsForDate`, `hairAssignedThroughSaleStatsForDate`.
- `userSettings`: `get`, `update`.
- `auth` or `session`: current user/session query if needed by route guards.

Zod input validators should move with the server procedures. Shared form schemas can remain in shared modules when both the web app and server need them.

## Hono REST Endpoints

Keep non-JSON workflow endpoints in Hono:

- `/api/upload`
- `/api/statement-attachments/upload`
- `/api/statement-attachments/export`
- `/api/statement-attachments/preview`
- `/api/auth/*`

These endpoints must check sessions with Better Auth where required and return appropriate HTTP status codes. JSON-style failures should return `Response.json(...)`; binary endpoints should preserve correct content type and status behavior.

## Web Data Flow

The web app should follow the sample project's tRPC client pattern:

- Create a shared `QueryClient`.
- Create a tRPC client using `httpBatchLink`.
- Point the link to `${env.VITE_SERVER_URL}/trpc`.
- Set `credentials: "include"` in fetch.
- Create `trpc` with `createTRPCOptionsProxy<AppRouter>`.
- Put `queryClient` and `trpc` in router context.

Routes and components then use:

- `useQuery(trpc.customers.list.queryOptions())`
- `useMutation(trpc.customers.create.mutationOptions(...))`
- `context.queryClient.ensureQueryData(trpc.customers.list.queryOptions())` in route loaders.

Existing query key factories can be removed where tRPC query options provide stable keys, or retained only where manually fetched Hono endpoints still need explicit keys.

## Error Handling

- Missing auth in tRPC returns `UNAUTHORIZED`.
- Missing records return `NOT_FOUND`.
- Invalid inputs return tRPC validation errors through Zod.
- Unexpected server failures return tRPC internal errors without leaking sensitive details.
- React Query global error handling should surface background query and mutation failures.
- Route-level error boundaries should remain responsible for page-level failures.
- Upload/export endpoints should return explicit HTTP status codes and structured JSON errors where the response is JSON.

## Environment And Scripts

Add or update environment expectations:

- `VITE_SERVER_URL` for the web app.
- `BETTER_AUTH_URL` for Better Auth.
- `CORS_ORIGIN` for the Hono server.

The root development script should run web and server together through workspace tasks, matching the sample architecture. App-specific commands should remain compatible with Vite+ conventions.

## Migration Sequence

1. Scaffold `packages/api` and `apps/server`.
2. Configure Hono auth, tRPC, CORS, and health check.
3. Configure `apps/web` as CSR TanStack Router with a tRPC client.
4. Prove auth/session and one protected tRPC procedure work.
5. Migrate `customers` as the first reference domain.
6. Migrate remaining JSON-only Start functions by domain.
7. Move upload, preview, export, and CSV workflows to Hono endpoints or tRPC procedures based on response type.
8. Remove Start middleware, API routes, server functions, SSR query integration, Nitro, and Start dependencies.
9. Regenerate lockfile and route tree as needed.
10. Run verification.

## Verification

Required checks after implementation:

- `vp check`
- `vp run -r check-types`
- `vp run -r build`

Runtime smoke checks:

- Hono server starts on port 3000.
- `GET /` returns OK.
- `GET /api/auth/ok` returns Better Auth OK response.
- tRPC health check works.
- Anonymous protected tRPC call returns unauthorized.
- Web app starts on port 3001.
- Login page renders in CSR mode.
- Anonymous authenticated route access redirects to login.
- A migrated data screen, such as customers, loads through tRPC.
- A migrated mutation invalidates or refreshes the expected query.

File endpoint checks should be done separately because they may require R2 credentials and representative test data.
