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
    customers: {
      summary: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ["customers", "summary", id] }) },
    },
    dashboard: {
      transactionStats: { queryKey: () => ["dashboard", "transactionStats"] },
    },
    transactions: {
      create: { mutationOptions: () => ({ mutationKey: ["transactions", "create"] }) },
      delete: { mutationOptions: () => ({ mutationKey: ["transactions", "delete"] }) },
      list: { queryKey: () => ["transactions", "list"] },
      update: { mutationOptions: () => ({ mutationKey: ["transactions", "update"] }) },
    },
  },
}))

describe("appointment transaction actions", () => {
  beforeEach(() => {
    invalidateQueries.mockClear()
    mutationOptions.length = 0
  })

  it("invalidates transaction dashboard stats after creating an appointment transaction", async () => {
    const { useAppointmentTransactionActions } = await import("./appointment-transaction-actions")

    useAppointmentTransactionActions({
      appointment: {
        client: { id: "client-1" },
        master: { id: "master-1" },
        personnel: [{ personnelId: "personnel-1" }],
      },
    })
    const createOptions = mutationOptions.find(
      (options) => (options as { mutationKey?: string[] }).mutationKey?.at(-1) === "create",
    ) as { onSuccess: () => void }

    createOptions.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions", "list"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "transactionStats"] })
  })
})
