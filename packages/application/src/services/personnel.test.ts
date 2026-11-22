import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { assertActivePersonnel, createPersonnel, getPersonnel, listPersonnel, updatePersonnel } from "./personnel"

const repository = vi.hoisted(() => ({
  listPersonnel: vi.fn(),
  getPersonnel: vi.fn(),
  createPersonnel: vi.fn(),
  updatePersonnel: vi.fn(),
  getCustomer: vi.fn(),
  getSalon: vi.fn(),
}))
vi.mock("@prive-admin-tanstack/db", () => repository)

const profile = {
  id: "profile-1",
  customerId: "customer-1",
  type: "master",
  active: true,
  salonId: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
}
const customer = { id: "customer-1", name: "Anna", phoneNumber: null, createdAt: new Date(0), updatedAt: new Date(0) }

describe("personnel service", () => {
  beforeEach(() => vi.resetAllMocks())

  it("defaults paging to ten and forwards resource filters", async () => {
    repository.listPersonnel.mockResolvedValue({ items: [{ ...profile, customer }], totalCount: 1 })
    expect(await listPersonnel({ search: "ann", activeOnly: true, type: "master" })).toMatchObject({
      totalCount: 1,
      items: [{ customer }],
    })
    expect(repository.listPersonnel).toHaveBeenCalledWith(undefined, {
      pageSize: 10,
      offset: 0,
      search: "ann",
      activeOnly: true,
      type: "master",
    })
    await listPersonnel({ pageSize: 5, offset: 10 })
    expect(repository.listPersonnel).toHaveBeenLastCalledWith(undefined, { pageSize: 5, offset: 10 })
  })

  it("gets inactive personnel for historical reads", async () => {
    repository.getPersonnel.mockResolvedValue({ ...profile, active: false, customer })
    expect(await getPersonnel("customer-1")).toMatchObject({ active: false, customer })
  })

  it("rejects missing profiles on get and update", async () => {
    await expect(getPersonnel("ordinary-customer")).rejects.toMatchObject({ code: "NOT_FOUND" })
    await expect(updatePersonnel({ customerId: "ordinary-customer", active: false })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
    expect(repository.updatePersonnel).not.toHaveBeenCalled()
  })

  it("creates a personnel profile for an existing customer", async () => {
    repository.getCustomer.mockResolvedValue(customer)
    repository.createPersonnel.mockResolvedValue(profile)
    expect(await createPersonnel({ customerId: "customer-1", type: "master" })).toEqual(profile)
    expect(repository.createPersonnel).toHaveBeenCalledWith(undefined, { customerId: "customer-1", type: "master" })
  })

  it("rejects creation for a missing customer", async () => {
    await expect(createPersonnel({ customerId: "missing", type: "master" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
    expect(repository.createPersonnel).not.toHaveBeenCalled()
  })

  it("rejects duplicate personnel profiles", async () => {
    repository.getCustomer.mockResolvedValue(customer)
    repository.getPersonnel.mockResolvedValue({ ...profile, active: false, customer })
    await expect(createPersonnel({ customerId: "customer-1", type: "assistant" })).rejects.toMatchObject({
      code: "CONFLICT",
    })
    expect(repository.createPersonnel).not.toHaveBeenCalled()
  })

  it("validates referenced salons on creation and update", async () => {
    repository.getCustomer.mockResolvedValue(customer)
    await expect(
      createPersonnel({ customerId: "customer-1", type: "master", salonId: "missing" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
    repository.getPersonnel.mockResolvedValue({ ...profile, customer })
    await expect(updatePersonnel({ customerId: "customer-1", salonId: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
    expect(repository.createPersonnel).not.toHaveBeenCalled()
    expect(repository.updatePersonnel).not.toHaveBeenCalled()
  })

  it("accepts an existing salon on creation", async () => {
    repository.getCustomer.mockResolvedValue(customer)
    repository.getSalon.mockResolvedValue({ id: "salon-1" })
    repository.createPersonnel.mockResolvedValue({ ...profile, salonId: "salon-1" })
    expect(await createPersonnel({ customerId: "customer-1", type: "master", salonId: "salon-1" })).toMatchObject({
      salonId: "salon-1",
    })
  })

  it("supports deactivation and explicitly clearing a salon", async () => {
    repository.getPersonnel.mockResolvedValue({ ...profile, customer })
    repository.updatePersonnel.mockResolvedValue({ ...profile, active: false, salonId: null })
    expect(await updatePersonnel({ customerId: "customer-1", active: false, salonId: null })).toMatchObject({
      active: false,
      salonId: null,
    })
    expect(repository.updatePersonnel).toHaveBeenCalledWith(undefined, {
      customerId: "customer-1",
      active: false,
      salonId: null,
    })
    expect(repository.getSalon).not.toHaveBeenCalled()
  })

  it("returns eligible personnel, optionally requiring a type", async () => {
    repository.getPersonnel.mockResolvedValue({ ...profile, customer })
    expect(await assertActivePersonnel("customer-1")).toMatchObject({ active: true, customer })
    expect(await assertActivePersonnel("customer-1", { type: "master" })).toMatchObject({ type: "master" })
    repository.getPersonnel.mockResolvedValue({ ...profile, type: "assistant", customer })
    expect(await assertActivePersonnel("customer-1")).toMatchObject({ type: "assistant" })
  })

  it("rejects ordinary customers as ineligible without creating a profile", async () => {
    await expect(assertActivePersonnel("ordinary-customer")).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(repository.createPersonnel).not.toHaveBeenCalled()
  })

  it("rejects inactive personnel and personnel of the wrong type", async () => {
    repository.getPersonnel.mockResolvedValue({ ...profile, active: false, customer })
    await expect(assertActivePersonnel("customer-1")).rejects.toMatchObject({ code: "BAD_REQUEST" })
    repository.getPersonnel.mockResolvedValue({ ...profile, type: "assistant", customer })
    await expect(assertActivePersonnel("customer-1", { type: "master" })).rejects.toMatchObject({ code: "BAD_REQUEST" })
  })

  it("wraps persistence failures in application errors", async () => {
    repository.getCustomer.mockResolvedValue(customer)
    const cause = new Error("database unavailable")
    repository.createPersonnel.mockRejectedValue(cause)
    await expect(createPersonnel({ customerId: "customer-1", type: "master" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      cause,
    })
    repository.getPersonnel.mockResolvedValue({ ...profile, customer })
    repository.updatePersonnel.mockRejectedValue(cause)
    await expect(updatePersonnel({ customerId: "customer-1", active: false })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      cause,
    })
  })

  it("handles missing persistence results", async () => {
    repository.getCustomer.mockResolvedValue(customer)
    await expect(createPersonnel({ customerId: "customer-1", type: "master" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    })
    repository.getPersonnel.mockResolvedValue({ ...profile, customer })
    await expect(updatePersonnel({ customerId: "customer-1", active: false })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })
})
