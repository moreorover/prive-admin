import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

const dbMock = vi.hoisted(() => ({
  query: {
    appointment: {
      findFirst: vi.fn(),
    },
    hairAssigned: {
      findFirst: vi.fn(),
    },
  },
  batch: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
}))

const repositoryMock = vi.hoisted(() => ({
  createHairAssigned: vi.fn(),
  deleteHairAssigned: vi.fn(),
  updateHairAssigned: vi.fn(),
  updateHairOrder: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => ({
  db: dbMock,
  createHairAssigned: repositoryMock.createHairAssigned,
  deleteHairAssigned: repositoryMock.deleteHairAssigned,
  updateHairAssigned: repositoryMock.updateHairAssigned,
  updateHairOrder: repositoryMock.updateHairOrder,
}))

import { createHairAssigned, deleteHairAssigned, updateHairAssigned, updateHairOrder } from "./hair"

describe("hair service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates an individual hair sale without overriding the sale date", async () => {
    repositoryMock.createHairAssigned.mockResolvedValue({ id: "hair-assigned-1" })

    await createHairAssigned({
      hairOrderId: "hair-order-1",
      clientId: "customer-1",
      appointmentId: null,
      createdById: "user-1",
    })

    expect(repositoryMock.createHairAssigned).toHaveBeenCalledWith(
      undefined,
      expect.not.objectContaining({
        soldAt: expect.any(Date),
      }),
    )
    expect(repositoryMock.createHairAssigned).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        appointmentId: null,
      }),
    )
  })

  it("uses the appointment start date when assigning hair through an appointment", async () => {
    dbMock.query.appointment.findFirst.mockResolvedValue({ startsAt: new Date("2026-07-21T09:30:00.000Z") })
    repositoryMock.createHairAssigned.mockResolvedValue({ id: "hair-assigned-1" })

    await createHairAssigned({
      hairOrderId: "hair-order-1",
      clientId: "customer-1",
      appointmentId: "appointment-1",
      createdById: "user-1",
    })

    expect(repositoryMock.createHairAssigned).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        appointmentId: "appointment-1",
        soldAt: new Date("2026-07-21T09:30:00.000Z"),
      }),
    )
  })

  it("updates a hair order without opening a database transaction", async () => {
    const whereExistingOrder = vi.fn().mockResolvedValueOnce([{ id: "hair-order-1" }])
    const whereAssignedTotal = vi.fn().mockResolvedValueOnce([{ total: 40 }])
    const fromExistingOrder = vi.fn(() => ({ where: whereExistingOrder }))
    const fromAssignedTotal = vi.fn(() => ({ where: whereAssignedTotal }))
    dbMock.select = vi
      .fn()
      .mockReturnValueOnce({ from: fromExistingOrder })
      .mockReturnValueOnce({ from: fromAssignedTotal })
    dbMock.transaction = vi.fn(async () => {
      throw new Error("failed query: begin params:")
    })
    repositoryMock.updateHairOrder.mockResolvedValue({ id: "hair-order-1" })

    await updateHairOrder({
      id: "hair-order-1",
      placedAt: null,
      arrivedAt: null,
      status: "COMPLETED",
      weightReceived: 100,
      weightUsed: 0,
      total: 10000,
    })

    expect(dbMock.transaction).not.toHaveBeenCalled()
    expect(repositoryMock.updateHairOrder).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        id: "hair-order-1",
        weightUsed: 40,
      }),
    )
  })

  it("updates an individual hair sale with the selected sale date", async () => {
    const whereParentOrder = vi
      .fn()
      .mockResolvedValueOnce([{ id: "hair-order-1", weightReceived: 100, weightUsed: 40, pricePerGram: 50 }])
    const fromParentOrder = vi.fn(() => ({ where: whereParentOrder }))
    const updateHairAssignedSet = vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => "update-hair") })) }))
    const updateHairOrderSet = vi.fn(() => ({ where: vi.fn(() => "update-order") }))
    dbMock.query.hairAssigned = {
      findFirst: vi.fn().mockResolvedValue({
        appointmentId: null,
        hairOrderId: "hair-order-1",
        weightInGrams: 40,
      }),
    }
    dbMock.select = vi.fn().mockReturnValueOnce({ from: fromParentOrder })
    dbMock.update = vi
      .fn()
      .mockReturnValueOnce({ set: updateHairAssignedSet })
      .mockReturnValueOnce({ set: updateHairOrderSet })
    dbMock.batch.mockResolvedValue([[{ id: "hair-assigned-1" }], {}])
    repositoryMock.updateHairAssigned.mockResolvedValue({ id: "hair-assigned-1" })

    await updateHairAssigned({
      id: "hair-assigned-1",
      weightInGrams: 50,
      soldFor: 6000,
      soldAt: new Date("2026-07-15T00:00:00.000Z"),
    })

    expect(updateHairAssignedSet).toHaveBeenCalledWith(
      expect.objectContaining({ soldAt: new Date("2026-07-15T00:00:00.000Z") }),
    )
    expect(updateHairOrderSet).toHaveBeenCalledWith({ weightUsed: 50 })
    expect(dbMock.batch).toHaveBeenCalledWith(["update-hair", "update-order"])
  })

  it("updates a hair assignment without opening a database transaction", async () => {
    const whereParentOrder = vi
      .fn()
      .mockResolvedValueOnce([{ id: "hair-order-1", weightReceived: 100, weightUsed: 40, pricePerGram: 50 }])
    const fromParentOrder = vi.fn(() => ({ where: whereParentOrder }))
    const updateHairAssignedSet = vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => "update-hair") })) }))
    const updateHairOrderSet = vi.fn(() => ({ where: vi.fn(() => "update-order") }))
    dbMock.query.appointment.findFirst.mockResolvedValue({ startsAt: new Date("2026-07-21T09:30:00.000Z") })
    dbMock.query.hairAssigned = {
      findFirst: vi.fn().mockResolvedValue({
        appointmentId: "appointment-1",
        hairOrderId: "hair-order-1",
        weightInGrams: 40,
      }),
    }
    dbMock.select = vi.fn().mockReturnValueOnce({ from: fromParentOrder })
    dbMock.update = vi
      .fn()
      .mockReturnValueOnce({ set: updateHairAssignedSet })
      .mockReturnValueOnce({ set: updateHairOrderSet })
    dbMock.batch.mockResolvedValue([[{ id: "hair-assigned-1" }], {}])
    dbMock.transaction = vi.fn(async () => {
      throw new Error("failed query: begin params:")
    })
    repositoryMock.updateHairAssigned.mockResolvedValue({ id: "hair-assigned-1" })

    await updateHairAssigned({
      id: "hair-assigned-1",
      weightInGrams: 50,
      soldFor: 6000,
    })

    expect(dbMock.transaction).not.toHaveBeenCalled()
    expect(updateHairAssignedSet).toHaveBeenCalledWith(
      expect.objectContaining({ soldAt: new Date("2026-07-21T09:30:00.000Z") }),
    )
    expect(updateHairOrderSet).toHaveBeenCalledWith({ weightUsed: 50 })
    expect(dbMock.batch).toHaveBeenCalledWith(["update-hair", "update-order"])
  })

  it("deletes a hair assignment without opening a database transaction", async () => {
    const whereParentOrder = vi
      .fn()
      .mockResolvedValueOnce([{ id: "hair-order-1", weightReceived: 100, weightUsed: 50, pricePerGram: 50 }])
    const fromParentOrder = vi.fn(() => ({ where: whereParentOrder }))
    const deleteWhere = vi.fn(() => ({ returning: vi.fn(() => "delete-hair") }))
    const updateHairOrderSet = vi.fn(() => ({ where: vi.fn(() => "update-order") }))
    dbMock.query.hairAssigned = {
      findFirst: vi.fn().mockResolvedValue({
        id: "hair-assigned-1",
        hairOrderId: "hair-order-1",
        weightInGrams: 20,
      }),
    }
    dbMock.select = vi.fn().mockReturnValueOnce({ from: fromParentOrder })
    dbMock.delete = vi.fn(() => ({ where: deleteWhere }))
    dbMock.update = vi.fn(() => ({ set: updateHairOrderSet }))
    dbMock.batch.mockResolvedValue([[{ id: "hair-assigned-1" }], {}])
    dbMock.transaction = vi.fn(async () => {
      throw new Error("failed query: begin params:")
    })

    await deleteHairAssigned("hair-assigned-1")

    expect(dbMock.transaction).not.toHaveBeenCalled()
    expect(updateHairOrderSet).toHaveBeenCalledWith({ weightUsed: 30 })
    expect(dbMock.batch).toHaveBeenCalledWith(["delete-hair", "update-order"])
  })
})
