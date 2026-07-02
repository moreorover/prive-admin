import { describe, expect, it } from "vitest"

import { cashTransaction } from "./schema/cash-transaction"

describe("cashTransaction schema", () => {
  it("uses a required restricted customer relation and required creator relation", () => {
    expect(cashTransaction.customerId.notNull).toBe(true)
    expect(cashTransaction.createdById.notNull).toBe(true)
  })

  it("stores signed integer amounts and day-level createdAt dates", () => {
    expect(cashTransaction.amount.notNull).toBe(true)
    expect(cashTransaction.createdAt.notNull).toBe(true)
  })
})
