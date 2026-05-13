import { describe, expect, it } from "vitest"

import { transaction } from "./schema/transaction"
import { whereActiveLegalEntity } from "./scope"

describe("whereActiveLegalEntity", () => {
  it("returns undefined when activeId is null (All mode)", () => {
    expect(whereActiveLegalEntity(transaction.legalEntityId, null)).toBeUndefined()
  })

  it("returns a drizzle eq() clause when activeId is provided", () => {
    const clause = whereActiveLegalEntity(transaction.legalEntityId, "le_123")
    expect(clause).toBeDefined()
    // SQL helper objects from drizzle expose a `queryChunks` array; the literal id should appear inside.
    const queryChunks = "queryChunks" in clause ? (clause as any).queryChunks : []
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
