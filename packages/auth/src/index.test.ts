import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

const betterAuth = vi.fn((options: unknown) => ({ options }))

vi.mock("better-auth/minimal", () => ({ betterAuth }))
vi.mock("better-auth/plugins/admin", () => ({ admin: vi.fn(() => "admin-plugin") }))
vi.mock("@better-auth/passkey", () => ({ passkey: vi.fn(() => "passkey-plugin") }))
vi.mock("better-auth/plugins/two-factor", () => ({ twoFactor: vi.fn(() => "two-factor-plugin") }))
vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn(() => "drizzle-adapter"),
}))
vi.mock("@prive-admin-tanstack/db/client", () => ({
  createDb: vi.fn(() => "db"),
}))
vi.mock("@prive-admin-tanstack/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001",
  },
}))

describe("createAuth", () => {
  beforeEach(() => {
    betterAuth.mockClear()
  })

  it("enables short-lived cookie caching for session reads", async () => {
    const { createAuth } = await import("./index")

    createAuth()

    expect(betterAuth).toHaveBeenLastCalledWith(
      expect.objectContaining({
        session: {
          cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
          },
        },
      }),
    )

    expect(betterAuth.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        plugins: expect.arrayContaining(["admin-plugin"]),
      }),
    )
  })
})
