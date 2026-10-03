# Backend tRPC testing

The backend uses three complementary test layers:

1. **Procedure tests** in `packages/api/src/routers/*.test.ts` use tRPC's `createCaller`. They are fast and verify input validation, authorization middleware, application-service calls, response shaping, and error mapping without HTTP or database setup.
2. **HTTP endpoint tests** in `apps/server/src/*.test.ts` call the exported Hono app with `app.request()`. They verify the deployed transport boundary: `/trpc/*` routing, tRPC response envelopes, HTTP status codes, and request-derived authentication context. The endpoint catalog covers all 61 current procedures, so adding or removing a procedure requires updating the catalog.
3. **Database-backed integration tests** should use the same database engine as production. This application uses Cloudflare D1 (SQLite), so use Wrangler/Miniflare's local D1 simulation or the Cloudflare Workers test harness for those tests. Apply migrations and seed data in the test setup, then isolate or reset state between scenarios.

Tests should be written in Given/When/Then form. Prefer nested `describe` blocks for the Given clause and an `it` title containing When and Then, as in `apps/server/src/app.test.ts`.

## Why not Testcontainers by default?

Testcontainers is useful when a test needs a service that is itself containerized, such as Redis, Kafka, or PostgreSQL. It is not a good substitute for D1: a PostgreSQL container changes SQL behavior and would not exercise the production binding/runtime. Starting a container for the Hono/tRPC transport would also add startup cost without increasing coverage.

If a future dependency requires Testcontainers, start it from Vitest `globalSetup`, provide only serializable connection details to workers, and stop it in teardown. Keep those tests in a separate integration project so normal router and endpoint tests remain fast.

The catalog is intentionally a fast registration/authentication guard, not a replacement for procedure behavior tests. Each procedure should still have focused input, success, and domain-error assertions at the caller or D1 integration layer. This keeps failures local and avoids coupling every endpoint smoke test to a large shared fixture.

Useful references:

- [tRPC context and inner context](https://trpc.io/docs/server/context)
- [tRPC vanilla client](https://trpc.io/docs/client/vanilla/setup)
- [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [Cloudflare Workers test harness](https://developers.cloudflare.com/workers/testing/test-harness/configure/)
- [Testcontainers Node.js usage](https://node.testcontainers.org/quickstart/usage/)
