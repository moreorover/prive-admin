import { describe, expect, it, vi } from "vite-plus/test"

import { updateAppointment } from "./appointments"

describe("appointment repository", () => {
  it("updates appointment title and start time", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "appointment-1" }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const database = {
      update: vi.fn(() => ({ set })),
    } as never
    const startsAt = new Date("2026-08-14T09:30:00.000Z")

    await updateAppointment(database, { id: "appointment-1", name: "Color refresh", startsAt })

    expect(set).toHaveBeenCalledWith({ name: "Color refresh", startsAt })
  })

  it("updates appointment master independently", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "appointment-1" }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const database = {
      update: vi.fn(() => ({ set })),
    } as never

    await updateAppointment(database, { id: "appointment-1", masterId: "master-2" })

    expect(set).toHaveBeenCalledWith({ masterId: "master-2" })
  })
})
