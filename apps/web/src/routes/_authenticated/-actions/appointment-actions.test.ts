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
    appointments: {
      create: { mutationOptions: () => ({ mutationKey: ["appointments", "create"] }) },
      get: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ["appointments", "get", id] }) },
      linkPersonnel: { mutationOptions: () => ({ mutationKey: ["appointments", "linkPersonnel"] }) },
      list: {
        queryKey: () => ["appointments", "list"],
        queryOptions: (input: unknown) => ({ queryKey: ["appointments", "list", input] }),
      },
      update: { mutationOptions: () => ({ mutationKey: ["appointments", "update"] }) },
    },
  },
}))

describe("appointment actions", () => {
  beforeEach(() => {
    invalidateQueries.mockClear()
    mutationOptions.length = 0
  })

  it("invalidates appointment detail and list queries after an appointment update", async () => {
    const { useAppointmentPersonnelActions } = await import("./appointment-actions")

    useAppointmentPersonnelActions({ appointmentId: "appointment-1" })
    const updateOptions = mutationOptions.find(
      (options) => (options as { mutationKey?: string[] }).mutationKey?.at(-1) === "update",
    ) as { onSuccess: () => void }

    updateOptions.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["appointments", "get", "appointment-1"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["appointments", "list"] })
  })

  it("keeps the existing master update action available", async () => {
    const { useAppointmentPersonnelActions } = await import("./appointment-actions")

    const actions = useAppointmentPersonnelActions({ appointmentId: "appointment-1" })

    expect(actions.updateMaster).toBe(actions.updateAppointment)
  })
})
