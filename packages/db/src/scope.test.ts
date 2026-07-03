import { describe, expect, it } from "vite-plus/test"

import { transaction } from "./schema/transaction"
import { whereActiveLegalEntity } from "./scope"

describe("whereActiveLegalEntity", () => {
  it("returns undefined when activeId is null (All mode)", () => {
    expect(whereActiveLegalEntity(transaction.customerId, null)).toBeUndefined()
  })

  it("returns a drizzle eq() clause when activeId is provided", () => {
    const clause = whereActiveLegalEntity(transaction.customerId, "le_123")
    expect(clause).toBeDefined()
    if (!clause) throw new Error("Expected whereActiveLegalEntity to return a SQL clause")

    // SQL helper objects from drizzle expose a `queryChunks` array; the literal id should appear inside.
    const queryChunks = "queryChunks" in clause ? clause.queryChunks : []
    const stringified = queryChunks
      .map((chunk: any) => {
        if (typeof chunk === "string") return chunk
        if (typeof chunk === "object" && chunk !== null && "value" in chunk) {
          return String(chunk.value)
        }
        return ""
      })
      .join("")
    expect(stringified).toContain("le_123")
  })
})
