import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { updateAppointment } from "./appointments"

const dbMock = vi.hoisted(() => ({
  updateAppointment: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("appointment service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards appointment title and start time updates to the database layer", async () => {
    const startsAt = new Date("2026-08-14T09:30:00.000Z")
    dbMock.updateAppointment.mockResolvedValue({ id: "appointment-1", name: "Color refresh", startsAt })

    await updateAppointment({ id: "appointment-1", name: "Color refresh", startsAt })

    expect(dbMock.updateAppointment).toHaveBeenCalledWith(undefined, {
      id: "appointment-1",
      name: "Color refresh",
      startsAt,
    })
  })
})
