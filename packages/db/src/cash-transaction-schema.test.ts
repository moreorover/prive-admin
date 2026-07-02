import { describe, expect, it } from "vitest"

import { cashTransaction } from "./schema/cash-transaction"

describe("cashTransaction schema", () => {
  it("uses a required restricted customer relation and required creator relation", () => {
    expect(cashTransaction.customerId.notNull).toBe(true)
    expect(cashTransaction.createdById.notNull).toBe(true)
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
})
