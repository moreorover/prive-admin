import { describe, expect, it, vi } from "vite-plus/test"

import { createAdminUserService, type AdminUsersApi } from "./admin-users"

describe("admin user service", () => {
  it("forwards Better Auth admin operations without adding transport concerns", async () => {
    const api: AdminUsersApi = {
      createUser: vi.fn(async (input) => input.body),
      listUsers: vi.fn(async () => ({ users: [{ id: "user-1" }], total: 1 })),
      adminUpdateUser: vi.fn(async (input) => input.body),
      removeUser: vi.fn(async (input) => input.body),
      banUser: vi.fn(async (input) => input.body),
      unbanUser: vi.fn(async (input) => input.body),
      setRole: vi.fn(async (input) => input.body),
      setUserPassword: vi.fn(async (input) => input.body),
    }
    const service = createAdminUserService(api)
    const headers = new Headers({ cookie: "better-auth.session=token" })

    await expect(
      service.create({ headers, body: { email: "user@example.com", password: "password123", name: "User" } }),
    ).resolves.toEqual({
      email: "user@example.com",
      password: "password123",
      name: "User",
    })
    await expect(service.list({ headers, query: { limit: 10, offset: 0 } })).resolves.toEqual({
      users: [{ id: "user-1" }],
      total: 1,
    })

    expect(api.createUser).toHaveBeenCalledWith(expect.objectContaining({ headers }))
    expect(api.listUsers).toHaveBeenCalledWith(expect.objectContaining({ headers }))
  })
})
