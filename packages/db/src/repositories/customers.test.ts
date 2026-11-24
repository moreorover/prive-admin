import { describe, expect, it, vi } from "vite-plus/test"

import { appointment, personnelOnAppointments } from "../schema/appointment"
import { listCustomerAppointments } from "./customers"

vi.mock("../index", () => ({ db: {} }))

describe("customer appointment repository", () => {
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
    expect(hasQueryChunk(findManyArgs.where, personnelOnAppointments.personnelId)).toBe(true)
    expect(hasQueryChunk(findManyArgs.where, personnelOnAppointments.appointmentId)).toBe(true)
    expect(countWhere).toBe(findManyArgs.where)
  })
})

function hasQueryChunk(value: unknown, expected: unknown): boolean {
  if (value === expected) return true
  if (Array.isArray(value)) return value.some((item) => hasQueryChunk(item, expected))
  if (typeof value !== "object" || value === null) return false
  return hasQueryChunk((value as { queryChunks?: unknown[] }).queryChunks, expected)
}
