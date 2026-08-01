import { describe, expect, it, vi } from "vite-plus/test"

import { appointment } from "../schema/appointment"
import { hairAssigned } from "../schema/hair"
import { transaction } from "../schema/transaction"
import { transactionMonthlyRows } from "./dashboard"

vi.mock("../index", () => ({ db: {} }))

describe("dashboard repository", () => {
  it("builds transaction dashboard stats from appointment-linked transaction rows", async () => {
    const calls: { from?: unknown; innerJoin?: { table: unknown; condition: unknown } } = {}
    let selectShape: { month: unknown } | undefined
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
      select: vi.fn((shape: { month: unknown }) => {
        selectShape = shape
        return builder
      }),
    }

    await transactionMonthlyRows(database as never, { year: 2026 })

    const monthExpression = selectShape?.month as { queryChunks?: unknown[] } | undefined
    const monthExpressionChunks = monthExpression?.queryChunks ?? []
    expect(calls.from).toBe(transaction)
    expect(calls.innerJoin?.table).toBe(appointment)
    expect(monthExpressionChunks).toContain(appointment.startsAt)
    expect(monthExpressionChunks).not.toContain(hairAssigned.soldAt)
  })
})
