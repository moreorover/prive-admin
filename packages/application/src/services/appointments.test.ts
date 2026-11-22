import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { appointmentsRouter } from "../../../api/src/routers/appointments"
import {
  createAppointment,
  getAppointment,
  linkPersonnelToAppointment,
  listAppointments,
  updateAppointment,
} from "./appointments"

const dbMock = vi.hoisted(() => ({
  updateAppointment: vi.fn(),
  createAppointment: vi.fn(),
  getAppointment: vi.fn(),
  listAppointments: vi.fn(),
  linkPersonnelToAppointment: vi.fn(),
  getPersonnel: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("appointment service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dbMock.createAppointment.mockResolvedValue({ id: "appointment-1" })
    dbMock.updateAppointment.mockResolvedValue({ id: "appointment-1" })
    dbMock.getAppointment.mockResolvedValue({ id: "appointment-1", personnel: [] })
    dbMock.linkPersonnelToAppointment.mockResolvedValue([{ personnelId: "assistant" }])
  })

  const input = { name: "Cut", startsAt: "2026-11-22", clientId: "client", masterId: "master", salonId: "salon" }
  const profile = { customerId: "master", active: true, type: "master" }

  describe.each(["create", "update"] as const)("%s master eligibility", (operation) => {
    it.each([undefined, { ...profile, active: false }])("rejects ineligible personnel: %j", async (personnel) => {
      dbMock.getPersonnel.mockResolvedValue(personnel)
      const result =
        operation === "create"
          ? createAppointment(input)
          : updateAppointment({ id: "appointment-1", masterId: "master" })
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(dbMock.createAppointment).not.toHaveBeenCalled()
      expect(dbMock.updateAppointment).not.toHaveBeenCalled()
    })
  })

  it.each([undefined, { ...profile, active: false }])(
    "rejects ineligible supporting personnel before writing any links: %j",
    async (personnel) => {
      dbMock.getPersonnel.mockImplementation(async (_db, id) =>
        id === "assistant" ? { ...profile, customerId: id, type: "assistant" } : personnel,
      )
      await expect(
        linkPersonnelToAppointment({ appointmentId: "appointment-1", personnelIds: ["assistant", "ineligible"] }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(dbMock.linkPersonnelToAppointment).not.toHaveBeenCalled()
    },
  )

  it("allows a customer with an active personnel profile to be both client and master", async () => {
    dbMock.getPersonnel.mockResolvedValue(profile)
    await expect(createAppointment({ ...input, clientId: "master" })).resolves.toEqual({ id: "appointment-1" })
    await expect(updateAppointment({ id: "appointment-1", masterId: "master" })).resolves.toEqual({
      id: "appointment-1",
    })
  })

  it("links active supporting personnel", async () => {
    dbMock.getPersonnel.mockResolvedValue({ ...profile, customerId: "assistant", type: "assistant" })
    await linkPersonnelToAppointment({ appointmentId: "appointment-1", personnelIds: ["assistant"] })
    expect(dbMock.linkPersonnelToAppointment).toHaveBeenCalledWith(undefined, {
      appointmentId: "appointment-1",
      personnelIds: ["assistant"],
    })
  })

  it("rejects repeated IDs in a request with a domain error", async () => {
    dbMock.getPersonnel.mockResolvedValue(profile)
    await expect(
      linkPersonnelToAppointment({ appointmentId: "appointment-1", personnelIds: ["assistant", "assistant"] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(dbMock.linkPersonnelToAppointment).not.toHaveBeenCalled()
  })

  it("rejects already assigned personnel without writing a mixed batch", async () => {
    dbMock.getPersonnel.mockResolvedValue(profile)
    dbMock.getAppointment.mockResolvedValue({ id: "appointment-1", personnel: [{ personnelId: "assistant" }] })
    await expect(
      linkPersonnelToAppointment({ appointmentId: "appointment-1", personnelIds: ["new", "assistant"] }),
    ).rejects.toMatchObject({ code: "CONFLICT" })
    expect(dbMock.linkPersonnelToAppointment).not.toHaveBeenCalled()
  })

  it("returns NOT_FOUND when linking to a missing appointment", async () => {
    dbMock.getPersonnel.mockResolvedValue(profile)
    dbMock.getAppointment.mockResolvedValue(undefined)
    await expect(
      linkPersonnelToAppointment({ appointmentId: "missing", personnelIds: ["assistant"] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
    expect(dbMock.linkPersonnelToAppointment).not.toHaveBeenCalled()
  })

  it("translates a concurrent duplicate insert into a domain conflict", async () => {
    dbMock.getPersonnel.mockResolvedValue(profile)
    dbMock.linkPersonnelToAppointment.mockResolvedValue([])
    await expect(
      linkPersonnelToAppointment({ appointmentId: "appointment-1", personnelIds: ["assistant"] }),
    ).rejects.toMatchObject({ code: "CONFLICT" })
  })

  it("preserves historical reads and unrelated edits without checking active eligibility", async () => {
    const historical = {
      id: "appointment-1",
      master: { id: "inactive-master" },
      personnel: [{ personnelId: "inactive-assistant" }],
    }
    dbMock.getAppointment.mockResolvedValue(historical)
    dbMock.listAppointments.mockResolvedValue({ items: [historical], totalCount: 1 })
    expect(await getAppointment("appointment-1")).toEqual(historical)
    expect(await listAppointments({ pageSize: 10, offset: 0 })).toEqual({ items: [historical], totalCount: 1 })
    await updateAppointment({ id: "appointment-1", name: "Historical correction" })
    expect(dbMock.getPersonnel).not.toHaveBeenCalled()
  })

  it("keeps an empty personnel link request a no-op", async () => {
    await expect(
      linkPersonnelToAppointment({ appointmentId: "appointment-1", personnelIds: [] }),
    ).resolves.toBeUndefined()
    expect(dbMock.linkPersonnelToAppointment).not.toHaveBeenCalled()
  })

  it.each(["create", "update", "linkPersonnel"] as const)(
    "maps %s eligibility errors through the API",
    async (operation) => {
      const caller = appointmentsRouter.createCaller({ session: { user: { id: "user-1" } } } as never)
      const result =
        operation === "create"
          ? caller.create(input)
          : operation === "update"
            ? caller.update({ id: "appointment-1", masterId: "ordinary-customer" })
            : caller.linkPersonnel({ appointmentId: "appointment-1", personnelIds: ["ordinary-customer"] })
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    },
  )

  it("maps duplicate assignment errors through the API", async () => {
    const caller = appointmentsRouter.createCaller({ session: { user: { id: "user-1" } } } as never)
    dbMock.getPersonnel.mockResolvedValue(profile)
    dbMock.getAppointment.mockResolvedValue({ id: "appointment-1", personnel: [{ personnelId: "assistant" }] })
    await expect(
      caller.linkPersonnel({ appointmentId: "appointment-1", personnelIds: ["assistant"] }),
    ).rejects.toMatchObject({ code: "CONFLICT" })
  })

  it("rejects empty link identifiers at the API boundary", async () => {
    const caller = appointmentsRouter.createCaller({ session: { user: { id: "user-1" } } } as never)
    await expect(caller.linkPersonnel({ appointmentId: "", personnelIds: ["assistant"] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
    await expect(caller.linkPersonnel({ appointmentId: "appointment-1", personnelIds: [""] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
    expect(dbMock.linkPersonnelToAppointment).not.toHaveBeenCalled()
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
