import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import {
  createAppointment,
  getAppointment,
  linkPersonnelToAppointment,
  listAppointments,
  updateAppointment,
} from "./appointments"

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
  let beforeWrite: (() => void) | undefined
  const db = () => database as never

  beforeEach(async () => {
    sqlite = new DatabaseSync(":memory:", { limits: { compoundSelect: 5, variableNumber: 100 } })
    const migrations = new URL("../migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    sqlite.exec("PRAGMA foreign_keys = ON")
    database = drizzle(
      async (sql, params, method) => {
        if (beforeWrite && /^(insert|update)/i.test(sql)) {
          const intervene = beforeWrite
          beforeWrite = undefined
          intervene()
        }
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
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ])
    await database.insert(schema.salon).values({ id: "salon", name: "Salon" })
    await database.insert(schema.personnel).values([
      { customerId: "master", type: "master", active: false },
      { customerId: "assistant", type: "assistant" },
      { customerId: "alice", type: "assistant" },
      { customerId: "bob", type: "assistant" },
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

  it("assigns six eligible people in one batch under D1 limits", async () => {
    const ids = Array.from({ length: 6 }, (_, i) => "staff-" + i)
    for (const id of ids) {
      await database.insert(schema.customer).values({ id, name: id })
      await database.insert(schema.personnel).values({ customerId: id, type: "assistant" })
    }
    expect(await linkPersonnelToAppointment(db(), { appointmentId: "appointment-1", personnelIds: ids })).toHaveLength(
      6,
    )
  })

  it("leaves a mixed batch untouched if one profile becomes inactive before insert", async () => {
    beforeWrite = () => sqlite.exec("UPDATE personnel SET active=0 WHERE customer_id='bob'")
    expect(
      await linkPersonnelToAppointment(db(), { appointmentId: "appointment-1", personnelIds: ["alice", "bob"] }),
    ).toEqual([])
    expect((await getAppointment(db(), "appointment-1"))?.personnel).toEqual([])
  })

  it.each(["create", "update"])("checks the current master profile at %s time", async (operation) => {
    sqlite.exec("UPDATE personnel SET type='master' WHERE customer_id='alice'")
    beforeWrite = () => sqlite.exec("UPDATE personnel SET type='assistant' WHERE customer_id='alice'")
    const result =
      operation === "create"
        ? await createAppointment(db(), {
            name: "Cut",
            masterId: "alice",
            clientId: "client",
            salonId: "salon",
            startsAt: new Date(),
          })
        : await updateAppointment(db(), { id: "appointment-1", masterId: "alice", name: "Changed" })
    expect(result).toBeUndefined()
    expect(await listAppointments(db(), { pageSize: 10, offset: 0 })).toMatchObject({
      totalCount: 1,
      items: [{ name: "Historical cut", masterId: "master" }],
    })
  })

  it("safely repeats writes without duplicate links and returns only new assignments", async () => {
    const input = { appointmentId: "appointment-1", personnelIds: ["assistant", "assistant"] }
    expect(await linkPersonnelToAppointment(db(), input)).toHaveLength(1)
    expect(await linkPersonnelToAppointment(db(), input)).toEqual([])
    expect(await linkPersonnelToAppointment(db(), { ...input, personnelIds: ["assistant", "other"] })).toEqual([])
    expect((await getAppointment(db(), "appointment-1"))?.personnel.map((row) => row.personnelId).sort()).toEqual([
      "assistant",
    ])
  })

  it("rejects a mixed batch atomically when an assignment intervenes", async () => {
    beforeWrite = () =>
      sqlite.exec("INSERT INTO appointment_personnel (appointment_id, personnel_id) VALUES ('appointment-1','alice')")

    expect(
      await linkPersonnelToAppointment(db(), {
        appointmentId: "appointment-1",
        personnelIds: ["alice", "bob"],
      }),
    ).toEqual([])
    expect((await getAppointment(db(), "appointment-1"))?.personnel.map((row) => row.personnelId)).toEqual(["alice"])
  })

  it("preserves appointment detail and list reads for inactive personnel", async () => {
    await linkPersonnelToAppointment(db(), { appointmentId: "appointment-1", personnelIds: ["assistant"] })
    sqlite.exec("UPDATE personnel SET active = 0")
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
    expect(
      await linkPersonnelToAppointment(db(), { appointmentId: "appointment-1", personnelIds: ["missing"] }),
    ).toEqual([])
  })
})
