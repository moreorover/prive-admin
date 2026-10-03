import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

const getSession = vi.hoisted(() => vi.fn())
const authHandler = vi.hoisted(() => vi.fn())

const endpointCases = [
  ["appointments.list", "query"],
  ["appointments.get", "query"],
  ["appointments.create", "mutation"],
  ["appointments.linkPersonnel", "mutation"],
  ["appointments.update", "mutation"],
  ["bankAccounts.get", "query"],
  ["bankAccounts.create", "mutation"],
  ["bankAccounts.update", "mutation"],
  ["bankStatementAttachments.list", "query"],
  ["bankStatementAttachments.counts", "query"],
  ["bankStatementAttachments.get", "query"],
  ["bankStatementAttachments.assign", "mutation"],
  ["bankStatementAttachments.unassign", "mutation"],
  ["bankStatementAttachments.delete", "mutation"],
  ["bankStatementEntries.importCsv", "mutation"],
  ["bankStatementEntries.list", "query"],
  ["bankStatementEntries.get", "query"],
  ["bankStatementEntries.ignore", "mutation"],
  ["bankStatementEntries.undo", "mutation"],
  ["cashTransactions.list", "query"],
  ["cashTransactions.create", "mutation"],
  ["cashTransactions.update", "mutation"],
  ["cashTransactions.delete", "mutation"],
  ["customers.list", "query"],
  ["customers.get", "query"],
  ["customers.create", "mutation"],
  ["customers.update", "mutation"],
  ["customers.summary", "query"],
  ["customers.appointments.list", "query"],
  ["customers.notes.list", "query"],
  ["customers.hairAssigned.list", "query"],
  ["dashboard.transactionStats", "query"],
  ["dashboard.hairAssignedStats", "query"],
  ["dashboard.hairAssignedThroughSaleStats", "query"],
  ["hairAssigned.list", "query"],
  ["hairAssigned.get", "query"],
  ["hairAssigned.create", "mutation"],
  ["hairAssigned.update", "mutation"],
  ["hairAssigned.delete", "mutation"],
  ["hairOrders.list", "query"],
  ["hairOrders.get", "query"],
  ["hairOrders.create", "mutation"],
  ["hairOrders.update", "mutation"],
  ["hairOrders.recalculatePrices", "mutation"],
  ["healthCheck", "query"],
  ["legalEntities.list", "query"],
  ["legalEntities.get", "query"],
  ["legalEntities.update", "mutation"],
  ["notes.list", "query"],
  ["notes.create", "mutation"],
  ["notes.delete", "mutation"],
  ["reports.bankAccountMonthlyBreakdown", "query"],
  ["salons.list", "query"],
  ["salons.get", "query"],
  ["salons.create", "mutation"],
  ["salons.update", "mutation"],
  ["session.current", "query"],
  ["transactions.list", "query"],
  ["transactions.create", "mutation"],
  ["transactions.update", "mutation"],
  ["transactions.delete", "mutation"],
  ["userSettings.get", "query"],
  ["userSettings.update", "mutation"],
] as const

vi.mock("@prive-admin-tanstack/auth", () => ({
  auth: {
    api: { getSession },
    handler: authHandler,
  },
}))

vi.mock("@prive-admin-tanstack/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001",
    NODE_ENV: "test",
  },
}))

import { app } from "./app"

describe("tRPC HTTP endpoints", () => {
  beforeEach(() => {
    getSession.mockReset()
    getSession.mockResolvedValue(null)
  })

  describe("Given the public health check procedure", () => {
    it("returns the health check response envelope", async () => {
      // given

      // when
      const response = await app.request("http://localhost/trpc/healthCheck")

      // then
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ result: { data: "OK" } })
    })
  })

  describe("Given a protected procedure and no session", () => {
    it("rejects appointment access without authentication", async () => {
      // given
      const input = encodeURIComponent(JSON.stringify({ id: "appointment-1" }))

      // when
      const response = await app.request(`http://localhost/trpc/appointments.get?input=${input}`)

      // then
      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toMatchObject({
        error: { data: { code: "UNAUTHORIZED", httpStatus: 401, path: "appointments.get" } },
      })
      expect(getSession).toHaveBeenCalledOnce()
    })
  })

  describe("Given the complete app router procedure catalog", () => {
    it.each(endpointCases)("registers the %s endpoint at the HTTP boundary", async (path, kind) => {
      // given
      const input = encodeURIComponent(JSON.stringify({}))
      const request =
        kind === "query"
          ? new Request(`http://localhost/trpc/${path}?input=${input}`, { method: "GET" })
          : new Request(`http://localhost/trpc/${path}`, {
              body: JSON.stringify({ json: {} }),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            })

      // when
      const response = await app.fetch(request)

      // then
      expect(response.status).not.toBe(404)
      expect(response.status).not.toBe(405)
    })
  })
})
