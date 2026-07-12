import { describe, expect, it, vi } from "vite-plus/test"

import { appointment } from "../schema/appointment"
import { transaction } from "../schema/transaction"
import { transactionMonthlyRows } from "./dashboard"

vi.mock("../index", () => ({ db: {} }))

describe("dashboard repository", () => {
  it("builds transaction dashboard stats from appointment-linked transaction rows", async () => {
    const calls: { from?: unknown; innerJoin?: { table: unknown; condition: unknown } } = {}
    const builder = {
      from: vi.fn((table: unknown) => {
        calls.from = table
        return builder
      }),
      groupBy: vi.fn(async () => []),
      innerJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.innerJoin = { table, condition }
        return builder
      }),
      where: vi.fn(() => builder),
    }
    const database = {
      select: vi.fn(() => builder),
    }

    await transactionMonthlyRows(database as never, { year: 2026 })

    expect(calls.from).toBe(transaction)
    expect(calls.innerJoin?.table).toBe(appointment)
  })
})
