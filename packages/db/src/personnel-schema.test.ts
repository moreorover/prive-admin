import { createTableRelationsHelpers, extractTablesRelationalConfig } from "drizzle-orm"
import { getTableConfig } from "drizzle-orm/sqlite-core"
import { describe, expect, it } from "vite-plus/test"

import * as schema from "./schema"

describe("personnel schema", () => {
  it("links each profile to exactly one existing customer with a unique customer ID", () => {
    const { personnel, customer } = schema
    expect(personnel).toBeDefined()
    expect(personnel.id.primary).toBe(true)
    expect(personnel.id.defaultFn).toBeTypeOf("function")
    expect(personnel.customerId.notNull).toBe(true)
    expect(personnel.customerId.isUnique).toBe(true)
    const customerReference = getTableConfig(personnel).foreignKeys.find(
      (key) => key.reference().columns[0] === personnel.customerId,
    )
    expect(customerReference?.reference().foreignColumns).toEqual([customer.id])
    expect(customerReference?.onDelete).toBe("restrict")
  })

  it("supports required master and assistant personnel types", () => {
    expect(schema.personnel).toBeDefined()
    expect(schema.personnel.type.notNull).toBe(true)
    expect(schema.personnel.type.enumValues).toEqual(["master", "assistant"])
  })

  it("defaults personnel to active using a required boolean column", () => {
    expect(schema.personnel).toBeDefined()
    expect(schema.personnel.active.notNull).toBe(true)
    expect(schema.personnel.active.dataType).toBe("boolean")
    expect(schema.personnel.active.default).toBe(true)
  })

  it("allows personnel without salon scope and references existing salons when scoped", () => {
    expect(schema.personnel).toBeDefined()
    expect(schema.personnel.salonId.notNull).toBe(false)
    const salonReference = getTableConfig(schema.personnel).foreignKeys.find(
      (key) => key.reference().columns[0] === schema.personnel.salonId,
    )
    expect(salonReference?.reference().foreignColumns).toEqual([schema.salon.id])
  })

  it("requires creation and update timestamps with defaults", () => {
    expect(schema.personnel).toBeDefined()
    for (const column of [schema.personnel.createdAt, schema.personnel.updatedAt]) {
      expect(column.notNull).toBe(true)
      expect(column.columnType).toBe("SQLiteTimestamp")
      expect(column.hasDefault).toBe(true)
    }
    expect(schema.personnel.updatedAt.onUpdateFn).toBeTypeOf("function")
  })

  it("exposes a required customer relation and an optional one-to-one personnel profile", () => {
    expect(schema.personnel).toBeDefined()
    const { tables } = extractTablesRelationalConfig(schema, createTableRelationsHelpers)
    const customerRelation = tables.personnel?.relations.customer
    expect(customerRelation?.referencedTable).toBe(schema.customer)
    expect(customerRelation).toMatchObject({
      isNullable: true,
      config: { fields: [schema.personnel.customerId], references: [schema.customer.id] },
    })
    const personnelRelation = tables.customer?.relations.personnel
    expect(personnelRelation?.referencedTable).toBe(schema.personnel)
    expect(personnelRelation).toMatchObject({ isNullable: false })
  })
})
