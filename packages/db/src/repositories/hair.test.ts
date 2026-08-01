import { describe, expect, it, vi } from "vite-plus/test"

import { createHairAssigned, updateHairAssigned } from "./hair"

describe("hair repository", () => {
  it("stores an explicit hair sale event date", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "hair-assigned-1" }])
    const values = vi.fn(() => ({ returning }))
    const database = {
      insert: vi.fn(() => ({ values })),
    } as never
    const soldAt = new Date("2026-07-14T00:00:00.000Z")

    await createHairAssigned(database, {
      hairOrderId: "hair-order-1",
      clientId: "customer-1",
      appointmentId: null,
      soldAt,
      createdById: "user-1",
    })

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: null,
        soldAt,
      }),
    )
  })

  it("updates an explicit hair sale event date", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "hair-assigned-1" }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const database = {
      update: vi.fn(() => ({ set })),
    } as never
    const soldAt = new Date("2026-07-15T00:00:00.000Z")

    await updateHairAssigned(database, {
      id: "hair-assigned-1",
      weightInGrams: 80,
      soldFor: 12000,
      pricePerGram: 150,
      profit: 8000,
      soldAt,
    })

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        soldAt,
      }),
    )
  })
})
