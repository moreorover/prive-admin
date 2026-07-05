# Controller -> Service -> Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move API and HTTP handlers off direct database access and route all business logic through shared services backed by repository modules in `packages/db`.

**Architecture:** Transport layers (`packages/api/src/routers` and `packages/api/src/http`) become thin adapters that validate input, call shared services, and translate errors to HTTP/TRPC responses. Business logic lives in a new shared `packages/application` package, and persistence lives in `packages/db/src/repositories`, with schema and migrations remaining unchanged.

**Tech Stack:** TypeScript, tRPC, Hono, Drizzle ORM, pnpm/Vite+ workspace packages.

---

### Task 1: Add shared application package and error model

**Files:**
- Create: `packages/application/package.json`
- Create: `packages/application/tsconfig.json`
- Create: `packages/application/src/errors.ts`
- Create: `packages/application/src/index.ts`

- [ ] **Step 1: Write the package and error scaffolding**

```ts
export class ApplicationError extends Error {
  constructor(
    public readonly code: "BAD_REQUEST" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER_ERROR",
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = "ApplicationError"
  }
}
```

- [ ] **Step 2: Verify the new package is visible to the workspace**

Run: `vp check`
Expected: the new package is included in workspace type/lint passes once referenced by dependents.

### Task 2: Add repository modules under `packages/db`

**Files:**
- Create: `packages/db/src/repositories/*.ts` for each domain currently touched by API handlers
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Add repository functions for read/write operations**
- [ ] **Step 2: Export repository APIs from `packages/db`**
- [ ] **Step 3: Keep repository code the only place that imports Drizzle tables**

### Task 3: Move business logic into services

**Files:**
- Create: `packages/application/src/services/*.ts`

- [ ] **Step 1: Port each router/HTTP use case into a service function**
- [ ] **Step 2: Move transaction boundaries into services**
- [ ] **Step 3: Throw `ApplicationError` from services instead of transport-specific errors**

### Task 4: Convert API and HTTP handlers into thin controllers

**Files:**
- Modify: `packages/api/src/routers/*.ts`
- Modify: `packages/api/src/http/*.ts`
- Create: `packages/api/src/errors.ts`

- [ ] **Step 1: Replace direct database calls with service calls**
- [ ] **Step 2: Map `ApplicationError` to TRPC/Hono responses**
- [ ] **Step 3: Remove leftover `db` imports from transport code**

### Task 5: Verify the refactor end to end

**Files:**
- Modify: none

- [ ] **Step 1: Run type checks**

Run: `vp run -r check-types`
Expected: pass across workspace packages.

- [ ] **Step 2: Run tests**

Run: `vp run -r test`
Expected: pass or show only pre-existing failures unrelated to the refactor.

- [ ] **Step 3: Run formatting and lint**

Run: `vp check`
Expected: clean output.
