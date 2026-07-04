# TanStack Router Hono tRPC Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `prive-admin` from TanStack Start to a client-side TanStack Router web app backed by a new Hono server and typed tRPC API.

**Architecture:** `apps/server` owns runtime server concerns: Hono, Better Auth handlers, tRPC, CORS, and file endpoints. `packages/api` owns typed domain routers and protected procedures. `apps/web` becomes a CSR TanStack Router app that uses React Query and tRPC options for business data, plus normal `fetch` calls for multipart and binary endpoints.

**Tech Stack:** Vite+, TanStack Router, TanStack Query, tRPC, Hono, Better Auth, Drizzle, Zod, React 19, TypeScript.

---

## File Structure

Create these new files:

- `apps/server/package.json`: server workspace package scripts and dependencies.
- `apps/server/tsconfig.json`: server TypeScript project config.
- `apps/server/src/index.ts`: Hono server entry, CORS, auth, tRPC, REST endpoints, and listen call.
- `packages/api/package.json`: API workspace package scripts and dependencies.
- `packages/api/tsconfig.json`: API TypeScript project config.
- `packages/api/src/index.ts`: tRPC initialization, public and protected procedures.
- `packages/api/src/context.ts`: Hono request context and Better Auth session lookup.
- `packages/api/src/routers/index.ts`: root app router.
- `packages/api/src/routers/session.ts`: session query used by web route guards.
- `packages/api/src/routers/customers.ts`: first reference domain migration.
- `apps/web/src/main.tsx`: CSR entry point.
- `apps/web/src/utils/trpc.ts`: tRPC client and shared React Query client.

Modify these existing files first:

- `package.json`: root scripts include server package in recursive commands.
- `apps/web/package.json`: remove Start dependencies, add tRPC client dependencies and router plugin dependency.
- `apps/web/vite.config.ts`: replace Start/Nitro plugins with router plugin.
- `apps/web/src/router.tsx`: remove SSR query integration or replace with simple router factory.
- `apps/web/src/routes/__root.tsx`: remove document markup and Start-only constructs.
- `apps/web/src/routes/login.tsx`: use tRPC/session or Better Auth client instead of `getUser` server function.
- `apps/web/src/routes/_authenticated/route.tsx`: use tRPC/session guard instead of `getUser` server function.
- `apps/web/src/routes/_authenticated/customers/index.tsx`: migrate the first data screen to tRPC.
- `packages/auth/src/index.ts`: remove `tanstackStartCookies()`.
- `packages/env/src/web.ts`: require `VITE_SERVER_URL`.
- `apps/web/.env.example`: add `VITE_SERVER_URL` and update auth/server URL expectations.

Remove after all consumers are migrated:

- `apps/web/src/middleware/auth.ts`
- `apps/web/src/middleware/locale.ts`
- `apps/web/src/functions/*`
- `apps/web/src/routes/api/*`
- TanStack Start and SSR query imports from generated or handwritten web files.

---

### Task 1: Scaffold `packages/api`

**Files:**
- Create: `packages/api/package.json`
- Create: `packages/api/tsconfig.json`
- Create: `packages/api/src/index.ts`
- Create: `packages/api/src/context.ts`
- Create: `packages/api/src/routers/index.ts`
- Create: `packages/api/src/routers/session.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the API package manifest**

Create `packages/api/package.json`:

```json
{
  "name": "@prive-admin-tanstack/api",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./context": "./src/context.ts",
    "./routers": "./src/routers/index.ts"
  },
  "scripts": {
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@prive-admin-tanstack/auth": "workspace:*",
    "@prive-admin-tanstack/db": "workspace:*",
    "@trpc/server": "catalog:",
    "hono": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@prive-admin-tanstack/config": "workspace:*",
    "@types/node": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Add API TypeScript config**

Create `packages/api/tsconfig.json`:

```json
{
  "extends": "@prive-admin-tanstack/config/tsconfig/base.json",
  "include": ["src/**/*.ts"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 3: Add tRPC primitives**

Create `packages/api/src/index.ts`:

```ts
import { TRPCError, initTRPC } from "@trpc/server"

import type { Context } from "./context"

export const t = initTRPC.context<Context>().create()

export const router = t.router

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
```

- [ ] **Step 4: Add Hono-backed tRPC context**

Create `packages/api/src/context.ts`:

```ts
import { auth } from "@prive-admin-tanstack/auth"
import type { Context as HonoContext } from "hono"

export type CreateContextOptions = {
  context: HonoContext
}

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  })

  return { session }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

- [ ] **Step 5: Add session and root routers**

Create `packages/api/src/routers/session.ts`:

```ts
import { router, publicProcedure } from "../index"

export const sessionRouter = router({
  current: publicProcedure.query(({ ctx }) => ctx.session),
})
```

Create `packages/api/src/routers/index.ts`:

```ts
import { publicProcedure, router } from "../index"
import { sessionRouter } from "./session"

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
```

- [ ] **Step 6: Verify package type checking catches missing dependencies**

Run: `vp run --filter @prive-admin-tanstack/api check-types`

Expected before dependencies are installed or catalog entries exist: either PASS or a clear package resolution error for `@trpc/server`/`hono`. If package resolution fails, continue to Task 2 and run `vp install`.

- [ ] **Step 7: Commit**

```bash
git add packages/api package.json
git commit -m "feat: scaffold trpc api package"
```

---

### Task 2: Scaffold `apps/server`

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/index.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the server package manifest**

Create `apps/server/package.json`:

```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsdown",
    "check-types": "tsc --noEmit",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.mjs"
  },
  "dependencies": {
    "@hono/node-server": "^1.14.4",
    "@hono/trpc-server": "^0.4.0",
    "@prive-admin-tanstack/api": "workspace:*",
    "@prive-admin-tanstack/auth": "workspace:*",
    "@prive-admin-tanstack/env": "workspace:*",
    "@trpc/server": "catalog:",
    "hono": "catalog:"
  },
  "devDependencies": {
    "@prive-admin-tanstack/config": "workspace:*",
    "@types/node": "catalog:",
    "tsdown": "^0.21.9",
    "tsx": "^4.19.2",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Add server TypeScript config**

Create `apps/server/tsconfig.json`:

```json
{
  "extends": "@prive-admin-tanstack/config/tsconfig/base.json",
  "include": ["src/**/*.ts"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 3: Add Hono server entry**

Create `apps/server/src/index.ts`:

```ts
import { serve } from "@hono/node-server"
import { trpcServer } from "@hono/trpc-server"
import { createContext } from "@prive-admin-tanstack/api/context"
import { appRouter } from "@prive-admin-tanstack/api/routers"
import { auth } from "@prive-admin-tanstack/auth"
import { env } from "@prive-admin-tanstack/env/server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  }),
)

app.get("/", (c) => c.text("OK"))

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
```

- [ ] **Step 4: Install workspace dependencies**

Run: `vp install`

Expected: lockfile updates and all workspace packages are installed.

- [ ] **Step 5: Verify server and API type checks**

Run: `vp run --filter @prive-admin-tanstack/api check-types`

Expected: PASS.

Run: `vp run --filter server check-types`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/server packages/api package.json pnpm-lock.yaml
git commit -m "feat: add hono server runtime"
```

---

### Task 3: Remove TanStack Start from Better Auth and add web server URL env

**Files:**
- Modify: `packages/auth/src/index.ts`
- Modify: `packages/env/src/web.ts`
- Modify: `apps/web/.env.example`

- [ ] **Step 1: Remove the Start cookie plugin from auth**

Change `packages/auth/src/index.ts` from:

```ts
import { tanstackStartCookies } from "better-auth/tanstack-start"
```

and:

```ts
plugins: [tanstackStartCookies()],
```

to no plugin import and no `plugins` property:

```ts
import { createDb } from "@prive-admin-tanstack/db"
import * as schema from "@prive-admin-tanstack/db/schema/auth"
import { env } from "@prive-admin-tanstack/env/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
```

The `betterAuth({ ... })` object keeps `database`, `trustedOrigins`, `emailAndPassword`, `secret`, `baseURL`, and `logger`.

- [ ] **Step 2: Add web runtime server URL schema**

If `packages/env/src/web.ts` does not already include it, add:

```ts
VITE_SERVER_URL: z.url(),
```

to the web environment schema. The exported `env` value should continue to parse `import.meta.env`.

- [ ] **Step 3: Update web env example**

In `apps/web/.env.example`, set the local split-runtime values:

```dotenv
VITE_SERVER_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
```

Keep existing database, R2, and auth secret variables intact.

- [ ] **Step 4: Verify auth package type check**

Run: `vp run --filter @prive-admin-tanstack/auth check-types`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/auth/src/index.ts packages/env/src/web.ts apps/web/.env.example
git commit -m "refactor: decouple auth from tanstack start"
```

---

### Task 4: Convert web runtime to CSR TanStack Router

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Modify: `apps/web/src/router.tsx`
- Modify: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/utils/trpc.ts`

- [ ] **Step 1: Update web dependencies**

In `apps/web/package.json`:

- Remove `@tanstack/react-start`.
- Remove `@tanstack/react-router-ssr-query`.
- Remove `nitro`.
- Add `@tanstack/router-plugin` to `devDependencies`.
- Add `@trpc/client`, `@trpc/server`, and `@trpc/tanstack-react-query` to `dependencies` using the same catalog style as the sample project if catalog entries exist.
- Keep `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-router-devtools`, React, Mantine, Better Auth, and existing domain dependencies.

- [ ] **Step 2: Replace web Vite plugins**

Change `apps/web/vite.config.ts` to:

```ts
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, lazyPlugins } from "vite-plus"

export default defineConfig({
  plugins: lazyPlugins(() => [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
  ]),
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
```

- [ ] **Step 3: Add tRPC client utilities**

Create `apps/web/src/utils/trpc.ts`:

```ts
import type { AppRouter } from "@prive-admin-tanstack/api/routers"
import { env } from "@prive-admin-tanstack/env/web"
import { QueryCache, QueryClient } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(error)
    },
  }),
})

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.VITE_SERVER_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        })
      },
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
```

- [ ] **Step 4: Simplify router context**

Change `apps/web/src/router.tsx` to remove SSR integration:

```tsx
import { createRouter as createTanStackRouter } from "@tanstack/react-router"

import Loader from "./components/loader"
import "./index.css"
import { routeTree } from "./routeTree.gen"
import { queryClient, trpc } from "./utils/trpc"

export const router = createTanStackRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: "intent",
  context: { queryClient, trpc },
  defaultPendingComponent: () => <Loader />,
  defaultNotFoundComponent: () => <div>Not Found</div>,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
```

- [ ] **Step 5: Add CSR entry point**

Create `apps/web/src/main.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"

import { router } from "./router"
import { queryClient } from "./utils/trpc"

const rootElement = document.getElementById("app")

if (!rootElement) {
  throw new Error("Root element not found")
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
```

- [ ] **Step 6: Replace root route document markup**

Change `apps/web/src/routes/__root.tsx` so it renders normal React children and providers:

```tsx
import { ColorSchemeScript } from "@prive-admin-tanstack/ui/color-scheme"
import { UIProvider } from "@prive-admin-tanstack/ui/provider"
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { lazy, useEffect } from "react"

import { LocaleProvider } from "@/lib/locale-context"
import type { queryClient, trpc } from "@/utils/trpc"

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        })),
      )

export interface RouterAppContext {
  queryClient: typeof queryClient
  trpc: typeof trpc
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Privé" },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const locale = navigator.language || "en-US"
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

  useEffect(() => {
    document.cookie = `tz=${timeZone};path=/;max-age=31536000`
  }, [timeZone])

  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <HeadContent />
      <LocaleProvider value={{ locale, timeZone }}>
        <UIProvider>
          <Outlet />
        </UIProvider>
      </LocaleProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
```

- [ ] **Step 7: Install and regenerate route tree**

Run: `vp install`

Run: `vp build apps/web`

Expected: the build may fail on remaining Start function imports. The expected useful result is that router plugin setup runs and `routeTree.gen.ts` is regenerated without Start module augmentation. Continue to Task 5 to remove the first remaining Start consumers.

- [ ] **Step 8: Commit**

```bash
git add apps/web/package.json apps/web/vite.config.ts apps/web/src/main.tsx apps/web/src/router.tsx apps/web/src/routes/__root.tsx apps/web/src/utils/trpc.ts apps/web/src/routeTree.gen.ts pnpm-lock.yaml
git commit -m "refactor: convert web runtime to csr router"
```

---

### Task 5: Migrate session guards

**Files:**
- Modify: `apps/web/src/lib/auth-client.ts`
- Modify: `apps/web/src/routes/login.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.tsx`

- [ ] **Step 1: Point Better Auth client at the Hono server**

Change `apps/web/src/lib/auth-client.ts` to:

```ts
import { env } from "@prive-admin-tanstack/env/web"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
})
```

- [ ] **Step 2: Replace login route server function guard**

In `apps/web/src/routes/login.tsx`, remove the `getUser` import and change `beforeLoad` to:

```ts
beforeLoad: async () => {
  const session = await authClient.getSession()
  if (session.data) {
    throw redirect({ to: "/customers" })
  }
},
```

Keep the existing search validation and component.

- [ ] **Step 3: Replace authenticated route server function guard**

In `apps/web/src/routes/_authenticated/route.tsx`, remove `getUser` from imports and change `beforeLoad` to:

```ts
beforeLoad: async ({ location }) => {
  const session = await authClient.getSession()
  if (!session.data) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    })
  }
  return { session: session.data }
},
```

- [ ] **Step 4: Verify web type checking**

Run: `vp run --filter web check-types`

Expected: failures should now be limited to remaining `@/functions/*`, Start API route, or package dependency issues. There should be no `getUser` import failure in `login.tsx` or `_authenticated/route.tsx`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/auth-client.ts apps/web/src/routes/login.tsx apps/web/src/routes/_authenticated/route.tsx
git commit -m "refactor: move route guards to auth client"
```

---

### Task 6: Migrate `customers` as the reference tRPC domain

**Files:**
- Create: `packages/api/src/routers/customers.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId.tsx`
- Modify: `apps/web/src/components/appointments/create-appointment-dialog.tsx`
- Modify: `apps/web/src/routes/_authenticated/cash.tsx`
- Modify: `apps/web/src/routes/_authenticated/hair-orders/index.tsx`

- [ ] **Step 1: Add customers router**

Create `packages/api/src/routers/customers.ts` by moving the logic from `apps/web/src/functions/customers.ts` into procedures:

```ts
import { db } from "@prive-admin-tanstack/db"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { type Currency } from "../../../../apps/web/src/lib/currency"
import { customerSchema } from "../../../../apps/web/src/lib/schemas"
import { protectedProcedure, router } from "../index"

export const customersRouter = router({
  list: protectedProcedure.query(() => {
    return db.query.customer.findMany({
      orderBy: (customer, { asc }) => [asc(customer.name)],
    })
  }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, input.id),
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    }
    return result
  }),

  create: protectedProcedure.input(customerSchema).mutation(async ({ input }) => {
    const [result] = await db
      .insert(customer)
      .values({
        name: input.name,
        phoneNumber: input.phoneNumber,
      })
      .returning()
    return result
  }),

  update: protectedProcedure.input(customerSchema.required({ id: true })).mutation(async ({ input }) => {
    const [result] = await db
      .update(customer)
      .set({
        name: input.name,
        phoneNumber: input.phoneNumber,
      })
      .where(eq(customer.id, input.id!))
      .returning()
    return result
  }),

  summary: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, input.id),
      columns: { createdAt: true },
      with: {
        appointmentsAsCustomer: { columns: { id: true } },
        transactions: { columns: { amount: true, currency: true } },
        hairAssigned: { columns: { profit: true, soldFor: true, weightInGrams: true } },
        notes: { columns: { id: true } },
      },
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    }
    const transactionSumsMinor: Record<Currency, number> = { GBP: 0, EUR: 0 }
    for (const t of result.transactions) {
      const currency = t.currency as Currency
      if (currency in transactionSumsMinor) {
        transactionSumsMinor[currency] += t.amount
      }
    }
    const hairAssignedProfitSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.profit, 0)
    const hairAssignedSoldForSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.soldFor, 0)
    const hairAssignedWeightInGramsSum = result.hairAssigned.reduce((acc, ha) => acc + ha.weightInGrams, 0)
    return {
      appointmentCount: result.appointmentsAsCustomer.length,
      transactionSumsMinor,
      hairAssignedProfitSum: hairAssignedProfitSumCents / 100,
      hairAssignedSoldForSum: hairAssignedSoldForSumCents / 100,
      hairAssignedWeightInGramsSum,
      noteCount: result.notes.length,
      customerCreatedAt: result.createdAt,
    }
  }),
})
```

If importing from `apps/web/src/lib` creates a package boundary problem, move `currency.ts` and the shared schemas needed by server procedures into a new shared package or an existing shared package, then update both imports in the same task.

- [ ] **Step 2: Register customers router**

Modify `packages/api/src/routers/index.ts`:

```ts
import { publicProcedure, router } from "../index"
import { customersRouter } from "./customers"
import { sessionRouter } from "./session"

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
  customers: customersRouter,
})

export type AppRouter = typeof appRouter
```

- [ ] **Step 3: Update customers index route**

In `apps/web/src/routes/_authenticated/customers/index.tsx`:

- Remove `createCustomer` and `getCustomers` imports from `@/functions/customers`.
- Add `import { trpc } from "@/utils/trpc"`.
- Replace `customersQueryOptions` with:

```ts
const customersQueryOptions = trpc.customers.list.queryOptions()
```

- Replace the create mutation with:

```ts
const mutation = useMutation(
  trpc.customers.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  }),
)
```

- Replace `mutation.mutateAsync({ name, phoneNumber })` with the same input object and no `{ data }` wrapper.

- [ ] **Step 4: Update all direct customer function consumers**

For each consumer of `getCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`, and `getCustomerSummary`, replace function imports with `trpc` query or mutation options:

- `apps/web/src/routes/_authenticated/customers/$customerId.tsx`
- `apps/web/src/components/appointments/create-appointment-dialog.tsx`
- `apps/web/src/routes/_authenticated/cash.tsx`
- `apps/web/src/routes/_authenticated/hair-orders/index.tsx`

Use these mappings:

```ts
getCustomers() -> trpc.customers.list.queryOptions()
getCustomer({ data: { id } }) -> trpc.customers.byId.queryOptions({ id })
getCustomerSummary({ data: { id } }) -> trpc.customers.summary.queryOptions({ id })
createCustomer({ data }) -> trpc.customers.create.mutationOptions()
updateCustomer({ data }) -> trpc.customers.update.mutationOptions()
```

- [ ] **Step 5: Verify no customer server function imports remain**

Run: `rg "@/functions/customers|functions/customers" apps/web/src`

Expected: no output.

- [ ] **Step 6: Run focused checks**

Run: `vp run --filter @prive-admin-tanstack/api check-types`

Expected: PASS.

Run: `vp run --filter web check-types`

Expected: no errors from customers route/component files. Other unmigrated `@/functions/*` errors may remain.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/routers apps/web/src/routes/_authenticated/customers apps/web/src/components/appointments/create-appointment-dialog.tsx apps/web/src/routes/_authenticated/cash.tsx apps/web/src/routes/_authenticated/hair-orders/index.tsx
git commit -m "refactor: migrate customers to trpc"
```

---

### Task 7: Migrate remaining JSON domains to tRPC

**Files:**
- Create or modify: `packages/api/src/routers/*.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: route and component files under `apps/web/src/routes` and `apps/web/src/components`

- [ ] **Step 1: Create domain routers**

Create one router file for each domain using the exact procedure names from the design:

```text
packages/api/src/routers/appointments.ts
packages/api/src/routers/transactions.ts
packages/api/src/routers/cash-transactions.ts
packages/api/src/routers/hair-orders.ts
packages/api/src/routers/hair-assigned.ts
packages/api/src/routers/bank-accounts.ts
packages/api/src/routers/bank-statement-entries.ts
packages/api/src/routers/bank-statement-attachments.ts
packages/api/src/routers/legal-entities.ts
packages/api/src/routers/salons.ts
packages/api/src/routers/notes.ts
packages/api/src/routers/reports.ts
packages/api/src/routers/dashboard.ts
packages/api/src/routers/user-settings.ts
```

Each router must:

- Import database and schema dependencies from `@prive-admin-tanstack/db`.
- Use `protectedProcedure` for every operation that previously used `requireAuthMiddleware`.
- Use the same Zod validators as the original server function.
- Replace `data` with `input`.
- Throw `TRPCError({ code: "NOT_FOUND" })` for record lookup misses.

- [ ] **Step 2: Register all routers**

Add all routers to `packages/api/src/routers/index.ts` with stable names matching the design:

```ts
export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
  appointments: appointmentsRouter,
  transactions: transactionsRouter,
  cashTransactions: cashTransactionsRouter,
  hairOrders: hairOrdersRouter,
  hairAssigned: hairAssignedRouter,
  bankAccounts: bankAccountsRouter,
  bankStatementEntries: bankStatementEntriesRouter,
  bankStatementAttachments: bankStatementAttachmentsRouter,
  legalEntities: legalEntitiesRouter,
  salons: salonsRouter,
  notes: notesRouter,
  reports: reportsRouter,
  dashboard: dashboardRouter,
  userSettings: userSettingsRouter,
  customers: customersRouter,
})
```

- [ ] **Step 3: Update web imports by domain**

For every `apps/web` import from `@/functions/<domain>`, replace the call with the matching tRPC procedure.

Examples:

```ts
getAppointment({ data: { id } }) -> trpc.appointments.byId.queryOptions({ id })
createAppointment({ data }) -> trpc.appointments.create.mutationOptions()
getTransactionsByAppointmentId({ data: { appointmentId } }) -> trpc.transactions.byAppointmentId.queryOptions({ appointmentId })
listCashTransactions({ data }) -> trpc.cashTransactions.list.queryOptions(data)
listLegalEntities() -> trpc.legalEntities.list.queryOptions()
updateLegalEntity({ data }) -> trpc.legalEntities.update.mutationOptions()
getUserSettings() -> trpc.userSettings.get.queryOptions()
updateUserSettings({ data }) -> trpc.userSettings.update.mutationOptions()
```

- [ ] **Step 4: Remove `{ data }` wrappers**

All tRPC procedure inputs use the input object directly. Replace:

```ts
mutation.mutateAsync({ data })
queryFn: () => oldFunction({ data: { id } })
```

with:

```ts
mutation.mutateAsync(data)
trpc.domain.procedure.queryOptions({ id })
```

- [ ] **Step 5: Replace broad query invalidations**

Prefer tRPC query keys over old query key factories:

```ts
queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() })
queryClient.invalidateQueries({ queryKey: trpc.appointments.byId.queryKey({ id: appointmentId }) })
queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.unassigned.queryKey() })
```

Keep `apps/web/src/lib/query-keys.ts` only for manually fetched Hono endpoints that do not have tRPC keys.

- [ ] **Step 6: Verify no server function imports remain in web UI**

Run: `rg "@/functions|functions/" apps/web/src/routes apps/web/src/components apps/web/src/lib`

Expected: no output, except type-only imports that have been intentionally moved to shared packages in this task.

- [ ] **Step 7: Run checks**

Run: `vp run --filter @prive-admin-tanstack/api check-types`

Expected: PASS.

Run: `vp run --filter web check-types`

Expected: no errors caused by migrated function imports.

- [ ] **Step 8: Commit**

```bash
git add packages/api/src/routers apps/web/src
git commit -m "refactor: migrate business data to trpc"
```

---

### Task 8: Move file and binary endpoints to Hono

**Files:**
- Modify: `apps/server/src/index.ts`
- Move or copy server-only helpers from `apps/web/src/server/*` to a server-owned location if required.
- Modify: web components/routes that call `/api/upload`, `/api/statement-attachments/upload`, `/api/statement-attachments/export`, and `/api/statement-attachments/preview`.

- [ ] **Step 1: Add authenticated helper in server**

In `apps/server/src/index.ts`, add:

```ts
async function getRequiredSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return { session: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session, response: null }
}
```

- [ ] **Step 2: Move `/api/upload` handler**

Port the handler from `apps/web/src/routes/api/upload.ts` into Hono:

```ts
app.post("/api/upload", async (c) => {
  const { session, response } = await getRequiredSession(c.req.raw)
  if (!session) {
    return response
  }

  const formData = await c.req.raw.formData()
  const file = formData.get("file") as globalThis.File | null
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  const key = `uploads/${Date.now()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || "application/octet-stream",
    }),
  )

  return Response.json({ key, uploadedBy: session.user.email })
})
```

Move `bucketName` and `r2` to a server-owned helper if `@/lib/r2` cannot be imported from `apps/server`.

- [ ] **Step 3: Move statement attachment upload, preview, and export handlers**

Port the server logic from:

```text
apps/web/src/routes/api/statement-attachments.upload.ts
apps/web/src/routes/api/statement-attachments.preview.ts
apps/web/src/routes/api/statement-attachments.export.ts
```

into Hono routes:

```text
POST /api/statement-attachments/upload
GET /api/statement-attachments/preview
GET /api/statement-attachments/export
```

Preserve response content types, attachment filenames, R2 keys, size limits, and session checks.

- [ ] **Step 4: Update web fetch URLs**

Any client fetch to `/api/...` must target the server:

```ts
import { env } from "@prive-admin-tanstack/env/web"

await fetch(`${env.VITE_SERVER_URL}/api/statement-attachments/upload`, {
  method: "POST",
  body: formData,
  credentials: "include",
})
```

For links or previews that need a URL string, build it from `env.VITE_SERVER_URL`.

- [ ] **Step 5: Verify no Start API routes are referenced by web**

Run: `rg "routes/api|/api/statement-attachments|/api/upload" apps/web/src apps/server/src`

Expected: `/api/...` references in web use `env.VITE_SERVER_URL`; server owns the route handlers.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/index.ts apps/web/src
git commit -m "refactor: move file endpoints to hono"
```

---

### Task 9: Remove TanStack Start files and dependencies

**Files:**
- Delete: `apps/web/src/functions/*`
- Delete: `apps/web/src/middleware/auth.ts`
- Delete: `apps/web/src/middleware/locale.ts`
- Delete: `apps/web/src/routes/api/*`
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/routeTree.gen.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Verify no Start imports remain before deletion**

Run: `rg "@tanstack/react-start|createServerFn|createMiddleware|tanstackStart|react-router-ssr-query|StartClient|StartServer|Scripts" apps packages`

Expected: output only from files scheduled for deletion or generated files that will regenerate in this task.

- [ ] **Step 2: Delete Start-only source files**

Delete:

```text
apps/web/src/functions
apps/web/src/middleware
apps/web/src/routes/api
```

- [ ] **Step 3: Install after dependency removals**

Run: `vp install`

Expected: lockfile updates remove TanStack Start and Nitro from the web dependency graph.

- [ ] **Step 4: Regenerate route tree**

Run: `vp build apps/web`

Expected: either PASS or type/build errors unrelated to deleted API routes. `apps/web/src/routeTree.gen.ts` must no longer declare TanStack Start module augmentation or include `/api/*` routes.

- [ ] **Step 5: Verify no Start imports remain**

Run: `rg "@tanstack/react-start|createServerFn|createMiddleware|tanstackStart|react-router-ssr-query|StartClient|StartServer|Scripts" apps packages`

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "refactor: remove tanstack start runtime"
```

---

### Task 10: Full verification and runtime smoke checks

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Run workspace checks**

Run: `vp check`

Expected: PASS.

Run: `vp run -r check-types`

Expected: PASS.

Run: `vp run -r build`

Expected: PASS.

- [ ] **Step 2: Start the server**

Run: `vp run --filter server dev`

Expected: console prints `Server is running on http://localhost:3000`.

- [ ] **Step 3: Smoke check Hono health**

Run in another terminal: `curl -i http://localhost:3000/`

Expected:

```text
HTTP/1.1 200 OK
...
OK
```

- [ ] **Step 4: Smoke check Better Auth**

Run: `curl -i http://localhost:3000/api/auth/ok`

Expected: HTTP 200 and a Better Auth OK JSON response.

- [ ] **Step 5: Smoke check tRPC health**

Run a tRPC GET request for `healthCheck` using the URL format produced by `@hono/trpc-server`. If the direct GET URL is not stable, add a temporary local script under `/private/tmp` that imports `createTRPCClient<AppRouter>` and calls `healthCheck.query()`.

Expected: response data equals `"OK"`.

- [ ] **Step 6: Start the web app**

Run: `vp run --filter web dev`

Expected: web dev server starts on `http://localhost:3001`.

- [ ] **Step 7: Browser smoke checks**

Open `http://localhost:3001/login`.

Expected:

- Login page renders.
- Anonymous navigation to `http://localhost:3001/customers` redirects to `/login`.
- After signing in with a valid seeded/admin account, `/customers` loads data through tRPC.
- Creating a customer refreshes the customers list.

- [ ] **Step 8: Final status and commit**

Run: `git status --short`

Expected: only intentional verification fixes are modified.

If verification fixes were needed:

```bash
git add <fixed-files>
git commit -m "fix: complete tanstack router migration verification"
```

If no verification fixes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- New `apps/server` Hono app: Task 2.
- Typed tRPC API layer: Tasks 1, 6, and 7.
- CSR TanStack Router web app: Task 4.
- Better Auth split runtime: Tasks 2, 3, and 5.
- Hono REST file endpoints: Task 8.
- Start removal: Task 9.
- Verification: Task 10.

Scope:

- The plan does not redesign the UI, schema, auth provider, or domain model.
- File upload/export remains Hono REST.
- React Query stays in place and is integrated through tRPC options.

Type consistency:

- Root router exports `AppRouter`.
- Web imports `AppRouter` from `@prive-admin-tanstack/api/routers`.
- Server imports `appRouter` from `@prive-admin-tanstack/api/routers`.
- Procedure names match the approved design.
