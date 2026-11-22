import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { personnelRouter } from "./personnel"

const services = vi.hoisted(() => ({ listPersonnel: vi.fn() }))
vi.mock("@prive-admin-tanstack/application/services", () => services)
const ctx = { session: { user: { id: "owner" } } } as never

describe("personnel list transport", () => {
  beforeEach(() => vi.clearAllMocks())

  it("uses the standard envelope and default page size", async () => {
    services.listPersonnel.mockResolvedValue({ items: [], totalCount: 12 })
    expect(await personnelRouter.createCaller(ctx).list({})).toEqual({
      items: [],
      totalCount: 12,
      page: 1,
      pageSize: 10,
    })
    expect(services.listPersonnel).toHaveBeenCalledWith({ pageSize: 10, offset: 0 })
  })

  it("forwards normalized personnel filters and pagination to the service", async () => {
    const items = [{ customerId: "master", customer: { id: "master", name: "Master" } }]
    services.listPersonnel.mockResolvedValue({ items, totalCount: 21 })
    expect(
      await personnelRouter
        .createCaller(ctx)
        .list({ page: 2, pageSize: 5, search: " Ann ", activeOnly: true, type: "master" }),
    ).toEqual({ items, totalCount: 21, page: 2, pageSize: 5 })
    expect(services.listPersonnel).toHaveBeenCalledWith({
      pageSize: 5,
      offset: 5,
      search: "Ann",
      activeOnly: true,
      type: "master",
    })
  })

  it("requires authentication", async () => {
    await expect(personnelRouter.createCaller({ session: null } as never).list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
    expect(services.listPersonnel).not.toHaveBeenCalled()
  })

  it.each([{ type: "customer" }, { pageSize: 101 }, { activeOnly: "yes" }])(
    "rejects invalid filters %j",
    async (input) => {
      await expect(personnelRouter.createCaller(ctx).list(input as never)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
      expect(services.listPersonnel).not.toHaveBeenCalled()
    },
  )
})
