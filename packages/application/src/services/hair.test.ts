import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

const dbMock = vi.hoisted(() => ({
  query: {
    appointment: {
      findFirst: vi.fn(),
    },
  },
  transaction: vi.fn(),
}))

const repositoryMock = vi.hoisted(() => ({
  createHairAssigned: vi.fn(),
  updateHairAssigned: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => ({
  db: dbMock,
  createHairAssigned: repositoryMock.createHairAssigned,
  updateHairAssigned: repositoryMock.updateHairAssigned,
}))

import { createHairAssigned, updateHairAssigned } from "./hair"

describe("hair service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates an individual hair sale with the selected sale date", async () => {
    repositoryMock.createHairAssigned.mockResolvedValue({ id: "hair-assigned-1" })

    await createHairAssigned({
      hairOrderId: "hair-order-1",
      clientId: "customer-1",
      appointmentId: null,
      soldAt: new Date("2026-07-14T00:00:00.000Z"),
      createdById: "user-1",
    })

    expect(repositoryMock.createHairAssigned).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        appointmentId: null,
        soldAt: new Date("2026-07-14T00:00:00.000Z"),
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
      soldAt: new Date("2026-07-14T00:00:00.000Z"),
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

  it("updates an individual hair sale with the selected sale date", async () => {
    const tx = {
      query: {
        hairAssigned: {
          findFirst: vi.fn().mockResolvedValue({
            appointmentId: null,
            hairOrderId: "hair-order-1",
            weightInGrams: 40,
          }),
        },
      },
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            for: vi
              .fn()
              .mockResolvedValue([{ id: "hair-order-1", weightReceived: 100, weightUsed: 40, pricePerGram: 50 }]),
          })),
        })),
      })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    }
    dbMock.transaction = vi.fn(async (callback) => callback(tx))
    repositoryMock.updateHairAssigned.mockResolvedValue({ id: "hair-assigned-1" })

    await updateHairAssigned({
      id: "hair-assigned-1",
      weightInGrams: 50,
      soldFor: 6000,
      soldAt: new Date("2026-07-15T00:00:00.000Z"),
    })

    expect(repositoryMock.updateHairAssigned).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        id: "hair-assigned-1",
        soldAt: new Date("2026-07-15T00:00:00.000Z"),
      }),
    )
  })
})
