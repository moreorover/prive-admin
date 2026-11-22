import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

const invalidateQueries = vi.fn<(input: { queryKey: unknown[] }) => void>()
const mutationOptions: unknown[] = []

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn<(options: unknown) => { isPending: boolean; mutate: () => void }>((options) => {
    mutationOptions.push(options)
    return { isPending: false, mutate: vi.fn<() => void>() }
  }),
  useQueryClient: vi.fn<() => { invalidateQueries: typeof invalidateQueries }>(() => ({ invalidateQueries })),
}))

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn<() => void>() },
}))

vi.mock("@/utils/trpc", () => ({
  trpc: {
    dashboard: {
      hairAssignedStats: { queryKey: () => ["dashboard", "hairAssignedStats"] },
      hairAssignedThroughSaleStats: { queryKey: () => ["dashboard", "hairAssignedThroughSaleStats"] },
    },
    hairAssigned: {
      create: { mutationOptions: () => ({ mutationKey: ["hairAssigned", "create"] }) },
      delete: { mutationOptions: () => ({ mutationKey: ["hairAssigned", "delete"] }) },
      list: { queryKey: () => ["hairAssigned", "list"] },
      update: { mutationOptions: () => ({ mutationKey: ["hairAssigned", "update"] }) },
    },
    hairOrders: {
      get: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ["hairOrders", "get", id] }) },
      list: { queryKey: () => ["hairOrders", "list"] },
    },
  },
}))

describe("hair assignment actions", () => {
  beforeEach(() => {
    invalidateQueries.mockClear()
    mutationOptions.length = 0
  })

  it("invalidates dashboard hair stats after creating appointment hair", async () => {
    const { useHairAssignmentActions } = await import("./hair-assignment-actions")

    useHairAssignmentActions({
      invalidateKeys: [],
      selectedEditItem: null,
      selectedDeleteItem: null,
    })
    const createOptions = mutationOptions.find(
      (options) => (options as { mutationKey?: string[] }).mutationKey?.at(-1) === "create",
    ) as { onSuccess: (created: unknown, values: { hairOrderId: string }) => void }

    createOptions.onSuccess(null, { hairOrderId: "hair-order-1" })

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["hairAssigned", "list"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "hairAssignedStats"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "hairAssignedThroughSaleStats"] })
  })

  it("invalidates dashboard hair stats after updating appointment hair", async () => {
    const { useHairAssignmentActions } = await import("./hair-assignment-actions")

    useHairAssignmentActions({
      invalidateKeys: [],
      selectedEditItem: { hairOrder: { id: "hair-order-1" } } as never,
      selectedDeleteItem: null,
    })
    const updateOptions = mutationOptions.find(
      (options) => (options as { mutationKey?: string[] }).mutationKey?.at(-1) === "update",
    ) as { onSuccess: () => void }

    updateOptions.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["hairAssigned", "list"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "hairAssignedStats"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "hairAssignedThroughSaleStats"] })
  })
})
