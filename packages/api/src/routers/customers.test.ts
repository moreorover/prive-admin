import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { customersRouter } from "./customers"

const createCustomer = vi.hoisted(() => vi.fn())

vi.mock("@prive-admin-tanstack/application/services", () => ({
  createCustomer,
}))

const authenticatedContext = {
  session: {
    session: {
      id: "session-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      userId: "user-1",
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
      token: "session-token",
    },
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  },
}

describe("customers.create", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a customer with a valid name and phone number", async () => {
    // given
    const createdCustomer = {
      id: "customer-1",
      name: "Anna Andersson",
      phoneNumber: "+37060000000",
    }
    createCustomer.mockResolvedValueOnce(createdCustomer)

    // when
    const result = await customersRouter.createCaller(authenticatedContext).create({
      name: "Anna Andersson",
      phoneNumber: "+37060000000",
    })

    // then
    expect(result).toEqual(createdCustomer)
    expect(createCustomer).toHaveBeenCalledOnce()
    expect(createCustomer).toHaveBeenCalledWith({
      name: "Anna Andersson",
      phoneNumber: "+37060000000",
    })
  })

  it("accepts a customer name at the minimum length boundary", async () => {
    // given
    const createdCustomer = { id: "customer-2", name: "AnnaA", phoneNumber: null }
    createCustomer.mockResolvedValueOnce(createdCustomer)

    // when
    await expect(
      customersRouter.createCaller(authenticatedContext).create({
        name: "AnnaA",
        phoneNumber: null,
      }),
    ).resolves.toEqual(createdCustomer)

    // then
    expect(createCustomer).toHaveBeenCalledWith({ name: "AnnaA", phoneNumber: null })
  })

  it("rejects a customer name shorter than five characters", async () => {
    // given
    const input = { name: "Anna", phoneNumber: null }

    // when
    await expect(customersRouter.createCaller(authenticatedContext).create(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })

    // then
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it("rejects a phone number without an international prefix", async () => {
    // given
    const input = { name: "Anna Andersson", phoneNumber: "0600000000" }

    // when
    await expect(customersRouter.createCaller(authenticatedContext).create(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })

    // then
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it("rejects customer creation without authentication", async () => {
    // given
    const input = { name: "Anna Andersson", phoneNumber: null }

    // when
    await expect(customersRouter.createCaller({ session: null }).create(input)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })

    // then
    expect(createCustomer).not.toHaveBeenCalled()
  })
})
