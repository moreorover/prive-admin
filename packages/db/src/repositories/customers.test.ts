import { drizzle } from "drizzle-orm/sqlite-proxy"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import { appointment } from "../schema/appointment"
import { listCustomerAppointments } from "./customers"

vi.mock("../index", () => ({ db: {} }))

describe("customer appointment repository", () => {
  let sqlite: DatabaseSync
  let database: ReturnType<typeof drizzle<typeof schema>>

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:")
    sqlite.exec(`
      create table customer (
        id text primary key not null,
        name text not null,
        phone_number text,
        created_at integer not null default 0,
        updated_at integer not null default 0
      );
      create table salon (
        id text primary key not null,
        name text not null,
        address text,
        created_at integer not null default 0,
        updated_at integer not null default 0
      );
      create table appointment (
        id text primary key not null,
        name text not null,
        starts_at integer not null,
        client_id text not null,
        master_id text not null,
        salon_id text not null,
        created_at integer not null default 0,
        updated_at integer not null default 0
      );
      create table appointment_personnel (
        appointment_id text not null,
        personnel_id text not null,
        created_at integer not null default 0,
        primary key (personnel_id, appointment_id)
      );
    `)
    database = drizzle(
      async (sql, params, method) => {
        const statement = sqlite.prepare(sql)
        if (method === "run") {
          statement.run(...params)
          return { rows: [] }
        }
        statement.setReturnArrays(true)
        const rows = statement.all(...params) as unknown as SQLOutputValue[][]
        return { rows: method === "get" ? (rows[0] ?? []) : rows }
      },
      { schema },
    )
  })

  afterEach(() => sqlite.close())

  it("lists appointments where the customer is client, master, or personnel without duplicate rows", async () => {
    const findMany = vi.fn().mockResolvedValue([])
    let countWhere: unknown
    const countBuilder = {
      from: vi.fn(() => countBuilder),
      where: vi.fn((where: unknown) => {
        countWhere = where
        return Promise.resolve([{ totalCount: 0 }])
      }),
    }
    const database = {
      query: { appointment: { findMany } },
      select: vi.fn(() => countBuilder),
    }

    await listCustomerAppointments(database as never, {
      customerId: "customer-1",
      pageSize: 25,
      offset: 0,
    })

    const findManyArgs = findMany.mock.calls[0]?.[0] as {
      where: { queryChunks?: unknown[] }
      with: unknown
    }
    expect(findManyArgs.with).toEqual({
      client: true,
      master: true,
      salon: true,
      personnel: { with: { personnel: true } },
    })
    expect(hasQueryChunk(findManyArgs.where, appointment.clientId)).toBe(true)
    expect(hasQueryChunk(findManyArgs.where, appointment.masterId)).toBe(true)
    expect(countWhere).toBe(findManyArgs.where)
  })

  it("executes the personnel membership predicate against SQLite", async () => {
    await database.insert(schema.customer).values([
      { id: "customer-1", name: "Selected customer" },
      { id: "client-1", name: "Client" },
      { id: "master-1", name: "Master" },
      { id: "other-1", name: "Other" },
    ])
    await database.insert(schema.salon).values({ id: "salon-1", name: "Main salon" })
    await database.insert(schema.appointment).values([
      {
        id: "appointment-client",
        name: "As client",
        startsAt: new Date("2026-08-14T09:30:00.000Z"),
        clientId: "customer-1",
        masterId: "master-1",
        salonId: "salon-1",
      },
      {
        id: "appointment-master",
        name: "As master",
        startsAt: new Date("2026-08-15T09:30:00.000Z"),
        clientId: "client-1",
        masterId: "customer-1",
        salonId: "salon-1",
      },
      {
        id: "appointment-personnel",
        name: "As personnel",
        startsAt: new Date("2026-08-16T09:30:00.000Z"),
        clientId: "client-1",
        masterId: "master-1",
        salonId: "salon-1",
      },
      {
        id: "appointment-other",
        name: "Not assigned",
        startsAt: new Date("2026-08-17T09:30:00.000Z"),
        clientId: "client-1",
        masterId: "master-1",
        salonId: "salon-1",
      },
    ])
    await database.insert(schema.personnelOnAppointments).values({
      appointmentId: "appointment-personnel",
      personnelId: "customer-1",
    })

    const result = await listCustomerAppointments(database as never, {
      customerId: "customer-1",
      pageSize: 25,
      offset: 0,
    })

    expect(result.items.map((item) => item.id)).toEqual([
      "appointment-personnel",
      "appointment-master",
      "appointment-client",
    ])
    expect(result.totalCount).toBe(3)
  })
})

function hasQueryChunk(value: unknown, expected: unknown): boolean {
  if (value === expected) return true
  if (Array.isArray(value)) return value.some((item) => hasQueryChunk(item, expected))
  if (typeof value !== "object" || value === null) return false
  return hasQueryChunk((value as { queryChunks?: unknown[] }).queryChunks, expected)
}
