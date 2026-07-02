import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { cashTransaction } from "./schema/cash-transaction"

const migrationSql = readFileSync(new URL("./migrations/0007_parched_shiva.sql", import.meta.url), "utf8")

describe("cashTransaction schema", () => {
  it("uses a required restricted customer relation and required creator relation", () => {
    expect(cashTransaction.customerId.notNull).toBe(true)
    expect(cashTransaction.createdById.notNull).toBe(true)
    expect(migrationSql).toMatch(
      /FOREIGN KEY \("customer_id"\) REFERENCES "public"\."customer"\("id"\) ON DELETE restrict/,
    )
    expect(migrationSql).toMatch(
      /FOREIGN KEY \("created_by_id"\) REFERENCES "public"\."users"\("id"\) ON DELETE restrict/,
    )
  })

  it("stores signed integer amounts", () => {
    expect(cashTransaction.amount.notNull).toBe(true)
    expect(cashTransaction.amount.dataType).toBe("number")
    expect(cashTransaction.amount.columnType).toBe("PgInteger")
    expect(cashTransaction.amount.getSQLType()).toBe("integer")
  })

  it("stores day-level createdAt dates", () => {
    expect(cashTransaction.createdAt.notNull).toBe(true)
    expect(cashTransaction.createdAt.dataType).toBe("string")
    expect(cashTransaction.createdAt.columnType).toBe("PgDateString")
    expect(cashTransaction.createdAt.getSQLType()).toBe("date")
  })

  it("defaults to EUR currency and requires updatedAt timestamps", () => {
    expect(cashTransaction.currency.notNull).toBe(true)
    expect(cashTransaction.currency.default).toBe("EUR")
    expect(cashTransaction.updatedAt.notNull).toBe(true)
    expect(cashTransaction.updatedAt.columnType).toBe("PgTimestamp")
    expect(cashTransaction.updatedAt.getSQLType()).toBe("timestamp with time zone")
  })
})
