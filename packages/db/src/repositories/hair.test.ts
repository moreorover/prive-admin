import { describe, expect, it, vi } from "vite-plus/test"

import { createHairAssigned, recalculateHairOrderPrices, updateHairAssigned } from "./hair"

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

  it("recalculates hair order prices without opening a database transaction", async () => {
    const whereOrder = vi
      .fn()
      .mockResolvedValue([{ id: "hair-order-1", total: 12000, weightReceived: 100, pricePerGram: 100 }])
    const whereAssignments = vi.fn().mockResolvedValue([
      { id: "hair-assigned-1", weightInGrams: 40, soldFor: 6000, profit: 1000 },
      { id: "hair-assigned-2", weightInGrams: 20, soldFor: 2500, profit: 100 },
    ])
    const fromOrder = vi.fn(() => ({ where: whereOrder }))
    const fromAssignments = vi.fn(() => ({ where: whereAssignments }))
    const updateOrderSet = vi.fn(() => ({ where: vi.fn(() => "update-order") }))
    const updateAssignmentSet = vi
      .fn()
      .mockReturnValueOnce({ where: vi.fn(() => "update-assignment-1") })
      .mockReturnValueOnce({ where: vi.fn(() => "update-assignment-2") })
    const database = {
      batch: vi.fn().mockResolvedValue([{}, {}, {}]),
      select: vi.fn().mockReturnValueOnce({ from: fromOrder }).mockReturnValueOnce({ from: fromAssignments }),
      transaction: vi.fn(async () => {
        throw new Error("failed query: begin params:")
      }),
      update: vi.fn().mockReturnValueOnce({ set: updateOrderSet }).mockReturnValue({
        set: updateAssignmentSet,
      }),
    } as never

    await recalculateHairOrderPrices(database, "hair-order-1")

    expect((database as any).transaction).not.toHaveBeenCalled()
    expect(updateOrderSet).toHaveBeenCalledWith({ pricePerGram: 120 })
    expect(updateAssignmentSet).toHaveBeenCalledWith({ profit: 1200 })
    expect(updateAssignmentSet).toHaveBeenCalledTimes(1)
    expect((database as any).batch).toHaveBeenCalledWith(["update-order", "update-assignment-1"])
  })
})
