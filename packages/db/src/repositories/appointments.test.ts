import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import { getAppointment, linkPersonnelToAppointment, listAppointments, updateAppointment } from "./appointments"

vi.mock("../index", () => ({ db: {} }))

describe("appointment repository", () => {
  it("updates appointment title and start time", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "appointment-1" }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const database = {
      update: vi.fn(() => ({ set })),
    } as never
    const startsAt = new Date("2026-08-14T09:30:00.000Z")

    await updateAppointment(database, { id: "appointment-1", name: "Color refresh", startsAt })

    expect(set).toHaveBeenCalledWith({ name: "Color refresh", startsAt })
  })

  it("updates appointment master independently", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "appointment-1" }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const database = {
      update: vi.fn(() => ({ set })),
    } as never

    await updateAppointment(database, { id: "appointment-1", masterId: "master-2" })

    expect(set).toHaveBeenCalledWith({ masterId: "master-2" })
  })
})

describe("appointment personnel persistence", () => {
  let sqlite: DatabaseSync
  let database: ReturnType<typeof drizzle<typeof schema>>
  const db = () => database as never

  beforeEach(async () => {
    sqlite = new DatabaseSync(":memory:")
    const migrations = new URL("../migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    sqlite.exec("PRAGMA foreign_keys = ON")
    database = drizzle(
      async (sql, params, method) => {
        const statement = sqlite.prepare(sql)
        if (method === "run") {
          statement.run(...params)
          return { rows: [] }
        }
        statement.setReturnArrays(true)
        const rows = statement.all(...params) as unknown as SQLOutputValue[][]
        // The proxy expects an absent row for get(), rather than an empty array.
        return { rows: method === "get" ? rows[0]! : rows }
      },
      { schema },
    )
    await database.insert(schema.customer).values([
      { id: "client", name: "Client" },
      { id: "master", name: "Master" },
      { id: "assistant", name: "Assistant" },
      { id: "other", name: "Other" },
    ])
    await database.insert(schema.salon).values({ id: "salon", name: "Salon" })
    await database.insert(schema.personnel).values([
      { customerId: "master", type: "master", active: false },
      { customerId: "assistant", type: "assistant", active: false },
    ])
    await database.insert(schema.appointment).values({
      id: "appointment-1",
      name: "Historical cut",
      clientId: "client",
      masterId: "master",
      salonId: "salon",
      startsAt: new Date("2026-11-22"),
    })
  })

  afterEach(() => sqlite.close())

  it("safely repeats writes without duplicate links and returns only new assignments", async () => {
    const input = { appointmentId: "appointment-1", personnelIds: ["assistant", "assistant"] }
    expect(await linkPersonnelToAppointment(db(), input)).toHaveLength(1)
    expect(await linkPersonnelToAppointment(db(), input)).toEqual([])
    expect(await linkPersonnelToAppointment(db(), { ...input, personnelIds: ["assistant", "other"] })).toHaveLength(1)
    expect((await getAppointment(db(), "appointment-1"))?.personnel.map((row) => row.personnelId).sort()).toEqual([
      "assistant",
      "other",
    ])
  })

  it("preserves appointment detail and list reads for inactive personnel", async () => {
    await linkPersonnelToAppointment(db(), { appointmentId: "appointment-1", personnelIds: ["assistant"] })
    expect(await getAppointment(db(), "appointment-1")).toMatchObject({
      master: { id: "master" },
      personnel: [{ personnelId: "assistant", personnel: { name: "Assistant" } }],
    })
    expect(await listAppointments(db(), { pageSize: 10, offset: 0 })).toMatchObject({
      totalCount: 1,
      items: [{ master: { id: "master" } }],
    })
  })

  it("does not suppress foreign-key violations", async () => {
    await expect(
      linkPersonnelToAppointment(db(), { appointmentId: "missing", personnelIds: ["assistant"] }),
    ).rejects.toThrow()
    await expect(
      linkPersonnelToAppointment(db(), { appointmentId: "appointment-1", personnelIds: ["missing"] }),
    ).rejects.toThrow()
  })
})
