import * as schema from "@prive-admin-tanstack/db/schema/index"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { expect, it, vi } from "vite-plus/test"

import { appointmentsRouter } from "../../../api/src/routers/appointments"
import { personnelRouter } from "../../../api/src/routers/personnel"
import { reportsRouter } from "../../../api/src/routers/reports"
import { transactionsRouter } from "../../../api/src/routers/transactions"

let database: ReturnType<typeof drizzle<typeof schema>>
vi.mock("@prive-admin-tanstack/db/client", () => ({
  get db() {
    return database
  },
}))

it("provisions the first master on a migrated database and reports the appointment in each currency", async () => {
  using sqlite = new DatabaseSync(":memory:", {
    limits: { compoundSelect: 5, variableNumber: 100, likePatternLength: 50 },
  })
  const migrations = new URL("../../../db/src/migrations/", import.meta.url)
  for (const file of readdirSync(migrations)
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
  }
  database = drizzle(
    async (sql, params, method) => {
      const statement = sqlite.prepare(sql)
      statement.setReturnArrays(true)
      const rows = statement.all(...params) as unknown as SQLOutputValue[][]
      return { rows: method === "get" ? rows[0]! : rows }
    },
    { schema },
  )
  sqlite.exec(
    "INSERT INTO customer (id, name) VALUES ('client','Client'),('master','Master'),('assistant','Assistant'); INSERT INTO salon (id, name) VALUES ('salon','Salon')",
  )
  const ctx = { session: { user: { id: "owner", role: "admin" } } } as never
  const personnel = personnelRouter.createCaller(ctx)
  const appointments = appointmentsRouter.createCaller(ctx)
  const transactions = transactionsRouter.createCaller(ctx)
  const reports = reportsRouter.createCaller(ctx)

  expect((await personnel.list({})).totalCount).toBe(0)
  await personnel.create({ customerId: "master", type: "master" })
  await personnel.create({ customerId: "assistant", type: "assistant" })
  expect((await personnel.list({ type: "master", activeOnly: true })).items.map((row) => row.customerId)).toEqual([
    "master",
  ])
  expect(
    sqlite.prepare("SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM accounts) AS count").get(),
  ).toMatchObject({ count: 0 })
  const appointment = await appointments.create({
    name: "Visit",
    startsAt: "2026-11-23",
    salonId: "salon",
    clientId: "client",
    masterId: "master",
  })
  const appointmentId = appointment.id
  await appointments.linkPersonnel({ appointmentId, personnelIds: ["assistant"] })
  const received = await transactions.create({
    appointmentId,
    customerId: "client",
    movementType: "received",
    currency: "EUR",
    amount: 10000,
  })
  await transactions.create({
    appointmentId,
    customerId: "master",
    movementType: "personnel_allocation",
    currency: "EUR",
    amount: -6000,
  })
  await transactions.create({
    appointmentId,
    customerId: "assistant",
    movementType: "personnel_allocation",
    currency: "EUR",
    amount: -1000,
  })
  await transactions.create({
    appointmentId,
    customerId: "client",
    movementType: "received",
    currency: "GBP",
    amount: 2000,
  })
  const totals = [
    { currency: "EUR", received: 10000, personnelAllocations: 7000, ownerRemainder: 3000 },
    { currency: "GBP", received: 2000, personnelAllocations: 0, ownerRemainder: 2000 },
  ]
  expect((await reports.appointmentFinance.get({ appointmentId })).totals).toMatchObject(totals)
  expect(
    (await reports.monthlyAppointmentFinance.list({ year: received.createdAt.getUTCFullYear() })).items,
  ).toMatchObject(totals)
})
