import { trpcServer } from "@hono/trpc-server"
import { createContext } from "@prive-admin-tanstack/api/context"
import { customersRouter } from "@prive-admin-tanstack/api/routers/customers"
import { db } from "@prive-admin-tanstack/db"
import { session, user } from "@prive-admin-tanstack/db/schema/auth"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { initTRPC } from "@trpc/server"
import { env } from "cloudflare:workers"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports -- This project is executed by the Cloudflare plugin's Vitest 4 runner.
import { afterEach, describe, expect, it } from "vitest"

const t = initTRPC.create()
const integrationRouter = t.router({ customers: customersRouter })
const integrationApp = new Hono()

integrationApp.use(
  "/trpc/*",
  trpcServer({
    router: integrationRouter,
    createContext: (_opts, context) => createContext({ context }),
  }),
)

type TestIdentity = {
  customerName: string
  sessionId: string
  sessionToken: string
  userId: string
}

type ResponseBody = {
  result?: { data: { json: Record<string, unknown> } }
  error?: { data: { code: string }; json: { message: string } }
}

const identities: TestIdentity[] = []

function signedSessionCookie(sessionToken: string) {
  return crypto.subtle
    .importKey("raw", new TextEncoder().encode(env.BETTER_AUTH_SECRET), { hash: "SHA-256", name: "HMAC" }, false, [
      "sign",
    ])
    .then((key) => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sessionToken)))
    .then((signature) => {
      const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      return `better-auth.session_token=${sessionToken}.${encodedSignature}`
    })
}

async function createAuthenticatedIdentity(): Promise<TestIdentity> {
  const suffix = crypto.randomUUID()
  const identity = {
    customerName: `Customer ${suffix}`,
    sessionId: `session-${suffix}`,
    sessionToken: `token-${suffix}`,
    userId: `user-${suffix}`,
  }

  await db.insert(user).values({
    email: `${suffix}@example.com`,
    emailVerified: true,
    id: identity.userId,
    name: "Integration Test User",
  })
  await db.insert(session).values({
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    id: identity.sessionId,
    token: identity.sessionToken,
    userId: identity.userId,
  })

  identities.push(identity)
  return identity
}

async function postCreate(input: { name: string; phoneNumber?: string | null }, cookie?: string) {
  return integrationApp.request("http://localhost/trpc/customers.create", {
    body: JSON.stringify({ json: input }),
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      "Content-Type": "application/json",
    },
    method: "POST",
  })
}

describe("Customers create endpoint", () => {
  afterEach(async () => {
    for (const identity of identities.splice(0)) {
      await db.delete(customer).where(eq(customer.name, identity.customerName))
      await db.delete(session).where(eq(session.id, identity.sessionId))
      await db.delete(user).where(eq(user.id, identity.userId))
    }
  })

  it("creates a customer and persists the submitted contact details", async () => {
    // given
    const identity = await createAuthenticatedIdentity()
    const cookie = await signedSessionCookie(identity.sessionToken)
    const input = { name: identity.customerName, phoneNumber: "+37060000000" }

    // when
    const response = await postCreate(input, cookie)
    const body = (await response.json()) as ResponseBody

    // then
    expect(response.status).toBe(200)
    expect(body.result!.data.json).toMatchObject(input)
    const [persistedCustomer] = await db.select().from(customer).where(eq(customer.name, input.name))
    expect(persistedCustomer).toMatchObject(input)
    expect(persistedCustomer!.id).toEqual(body.result!.data.json.id)
  })

  it("rejects a customer name shorter than five characters without creating a record", async () => {
    // given
    const identity = await createAuthenticatedIdentity()
    const cookie = await signedSessionCookie(identity.sessionToken)
    const input = { name: "Ann", phoneNumber: "+37060000000" }

    // when
    const response = await postCreate(input, cookie)
    const body = (await response.json()) as ResponseBody

    // then
    expect(response.status).toBe(400)
    expect(body.error!.data.code).toBe("BAD_REQUEST")
    const [persistedCustomer] = await db.select().from(customer).where(eq(customer.name, input.name))
    expect(persistedCustomer).toBeUndefined()
  })

  it("rejects a duplicate customer name without creating a second record", async () => {
    // given
    const identity = await createAuthenticatedIdentity()
    const cookie = await signedSessionCookie(identity.sessionToken)
    const input = { name: identity.customerName, phoneNumber: "+37060000000" }
    const firstResponse = await postCreate(input, cookie)
    expect(firstResponse.status).toBe(200)

    // when
    const duplicateResponse = await postCreate(input, cookie)
    const duplicateBody = (await duplicateResponse.json()) as ResponseBody

    // then
    expect(duplicateResponse.status).toBe(500)
    expect(duplicateBody.error!.json.message).toBe("Failed to create customer")
    const persistedCustomers = await db.select().from(customer).where(eq(customer.name, input.name))
    expect(persistedCustomers).toHaveLength(1)
  })

  it("rejects an unauthenticated customer creation request without creating a record", async () => {
    // given
    const input = { name: "Unauthenticated Customer", phoneNumber: "+37060000000" }

    // when
    const response = await postCreate(input)
    const body = (await response.json()) as ResponseBody

    // then
    expect(response.status).toBe(401)
    expect(body.error!.data.code).toBe("UNAUTHORIZED")
    const [persistedCustomer] = await db.select().from(customer).where(eq(customer.name, input.name))
    expect(persistedCustomer).toBeUndefined()
  })
})
