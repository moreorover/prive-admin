import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import { createPersonnel, getPersonnel, listPersonnel, updatePersonnel } from "./personnel"

vi.mock("../index", () => ({ db: {} }))

describe("personnel repository", () => {
  let sqlite: DatabaseSync
  let database: ReturnType<typeof drizzle<typeof schema>>
  const db = () => database as never

  beforeEach(async () => {
    sqlite = new DatabaseSync(":memory:", { limits: { likePatternLength: 50 } })
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
      { id: "anna", name: "Anna", phoneNumber: "+370111" },
      { id: "bella", name: "Bella", phoneNumber: "+370222" },
      { id: "cara", name: "Cara" },
      { id: "client", name: "Client only" },
      { id: "literal", name: "Literal %_\\ match" },
    ])
    await database.insert(schema.salon).values({ id: "salon-1", name: "Salon" })
    await database.insert(schema.personnel).values([
      { customerId: "anna", type: "master" },
      { customerId: "bella", type: "assistant" },
      { customerId: "cara", type: "master", active: false },
      { customerId: "literal", type: "assistant" },
    ])
  })

  afterEach(() => sqlite.close())

  it("paginates active profiles by customer name and counts all filtered matches", async () => {
    const result = await listPersonnel(db(), { activeOnly: true, pageSize: 1, offset: 1 })
    expect(result.totalCount).toBe(3)
    expect(result.items.map((row) => row.customerId)).toEqual(["bella"])
    expect(result.items[0]?.customer).toMatchObject({ name: "Bella", phoneNumber: "+370222" })
  })

  it("includes inactive profiles unless active-only is requested and excludes ordinary customers", async () => {
    const result = await listPersonnel(db(), {})
    expect(result.totalCount).toBe(4)
    expect(result.items.map((row) => row.customerId)).toEqual(["anna", "bella", "cara", "literal"])
    expect((await listPersonnel(db(), { activeOnly: false })).totalCount).toBe(4)
  })

  it("defaults to a ten-item page", async () => {
    for (let index = 0; index < 12; index++) {
      await database.insert(schema.customer).values({ id: `extra-${index}`, name: `Extra ${index}` })
      await createPersonnel(db(), { customerId: `extra-${index}`, type: "assistant" })
    }
    const result = await listPersonnel(db(), {})
    expect(result.items).toHaveLength(10)
    expect(result.totalCount).toBe(16)
  })

  it("combines type, active status, and customer name search", async () => {
    const result = await listPersonnel(db(), { type: "master", activeOnly: true, search: "a" })
    expect(result.items.map((row) => row.customerId)).toEqual(["anna"])
    expect(result.totalCount).toBe(1)
  })

  it("searches phone numbers and counts matches even beyond the last page", async () => {
    expect((await listPersonnel(db(), { search: "222" })).items.map((row) => row.customerId)).toEqual(["bella"])
    expect(await listPersonnel(db(), { search: "222", offset: 10 })).toEqual({ items: [], totalCount: 1 })
    expect(await listPersonnel(db(), { search: "nobody" })).toEqual({ items: [], totalCount: 0 })
  })

  it("treats LIKE wildcard and escape characters as literal search text", async () => {
    const result = await listPersonnel(db(), { search: "%_\\" })
    expect(result.items.map((row) => row.customerId)).toEqual(["literal"])
    expect(result.totalCount).toBe(1)
  })

  it("finds a literal 49-character substring under D1's LIKE limit", async () => {
    const search = "%_".repeat(24) + "A"
    sqlite.prepare("UPDATE customer SET name = ? WHERE id = 'literal'").run("Prefix" + search.toLowerCase() + "Suffix")
    const result = await listPersonnel(db(), { search })
    expect(result.items.map((row) => row.customerId)).toEqual(["literal"])
    expect(result.totalCount).toBe(1)
  })

  it("gets profiles by customer ID with customer details, including inactive profiles", async () => {
    expect(await getPersonnel(db(), "cara")).toMatchObject({ active: false, customer: { id: "cara", name: "Cara" } })
    expect(await getPersonnel(db(), "client")).toBeUndefined()
  })

  it("adds personnel capability to an existing customer without replacing their identity", async () => {
    const result = await createPersonnel(db(), { customerId: "client", type: "master", salonId: "salon-1" })
    expect(result).toMatchObject({ customerId: "client", type: "master", active: true, salonId: "salon-1" })
    expect(await getPersonnel(db(), "client")).toMatchObject({ customer: { id: "client", name: "Client only" } })
    expect(await database.select().from(schema.customer)).toHaveLength(5)
  })

  it("creates unscoped profiles and enforces existing unique customer links", async () => {
    expect(await createPersonnel(db(), { customerId: "client", type: "assistant" })).toMatchObject({ salonId: null })
    await expect(createPersonnel(db(), { customerId: "missing", type: "master" })).rejects.toThrow()
    await expect(createPersonnel(db(), { customerId: "anna", type: "master" })).rejects.toThrow()
  })

  it("deactivates without deleting customer or profile and preserves unspecified fields", async () => {
    const before = await getPersonnel(db(), "anna")
    expect(await updatePersonnel(db(), { customerId: "anna", active: false })).toMatchObject({
      active: false,
      type: "master",
    })
    expect(await getPersonnel(db(), "anna")).toMatchObject({ id: before?.id, customer: { id: "anna" }, active: false })
    expect((await listPersonnel(db(), { activeOnly: true, type: "master" })).totalCount).toBe(0)
  })

  it.each([{ customerId: "anna" }, { customerId: "anna", type: undefined, active: undefined, salonId: undefined }])(
    "rejects an empty effective patch without writing: %j",
    async (input) => {
      const before = await getPersonnel(db(), "anna")
      const update = vi.spyOn(database, "update")
      await expect(updatePersonnel(db(), input)).rejects.toThrow(TypeError)
      expect(update).not.toHaveBeenCalled()
      expect(await getPersonnel(db(), "anna")).toEqual(before)
    },
  )

  it.each([
    { active: false, salonId: undefined },
    { active: undefined, salonId: null },
  ])("preserves false and null as effective changes alongside undefined fields: %j", async (changes) => {
    await updatePersonnel(db(), { customerId: "anna", salonId: "salon-1" })
    expect(await updatePersonnel(db(), { customerId: "anna", type: undefined, ...changes })).toMatchObject({
      type: "master",
      active: changes.active === false ? false : true,
      salonId: changes.salonId === null ? null : "salon-1",
    })
  })

  it("updates type and salon independently, clears salon explicitly, and reactivates", async () => {
    await updatePersonnel(db(), { customerId: "anna", salonId: "salon-1", active: false })
    expect(await updatePersonnel(db(), { customerId: "anna", type: "assistant" })).toMatchObject({
      salonId: "salon-1",
      active: false,
    })
    expect(await updatePersonnel(db(), { customerId: "anna", salonId: null, active: true })).toMatchObject({
      type: "assistant",
      salonId: null,
      active: true,
    })
    expect(await updatePersonnel(db(), { customerId: "missing", active: false })).toBeUndefined()
  })
})
