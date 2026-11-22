import { type QueryKey, QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { trpc } from "@/utils/trpc"

import { appointmentDetailQueryOptions, appointmentTransactionsQueryOptions } from "../-data/appointment-detail-data"
import { useAppointmentTransactionActions } from "./appointment-transaction-actions"

const cache = new QueryClient()
const mutationOptions: Array<{ onSuccess: () => void }> = []

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useMutation: (options: { onSuccess: () => void }) => {
    mutationOptions.push(options)
    return { isPending: false, mutate: vi.fn<() => void>() }
  },
  useQueryClient: () => cache,
}))

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn<() => void>() },
}))
vi.mock("@/utils/server-url", () => ({ serverUrl: "http://localhost:3000" }))

describe("appointment transaction actions", () => {
  beforeEach(() => {
    cache.clear()
    mutationOptions.length = 0
  })

  it.each(["create", "update", "delete", "resolveCurrency"])(
    "invalidates the route-owned cache entries after %s",
    (verb) => {
      const affectedKeys: QueryKey[] = [
        appointmentDetailQueryOptions("appointment-1").queryKey,
        appointmentTransactionsQueryOptions("appointment-1", 1).queryKey,
        appointmentTransactionsQueryOptions("appointment-1", 2).queryKey,
        trpc.reports.appointmentFinance.get.queryOptions({ appointmentId: "appointment-1" }).queryKey,
        trpc.reports.monthlyAppointmentFinance.list.queryOptions({ year: 2026 }).queryKey,
        trpc.reports.personnelFinance.list.queryOptions({ year: 2026, month: 2, page: 2 }).queryKey,
        trpc.dashboard.transactionStats.queryOptions({ year: 2026 }).queryKey,
        ...["client-1", "master-1", "personnel-1"].map((id) => trpc.customers.summary.queryOptions({ id }).queryKey),
      ]
      const unrelatedKey = appointmentDetailQueryOptions("unrelated").queryKey
      for (const key of [...affectedKeys, unrelatedKey]) cache.setQueryData(key, { cached: true })
      const onCreated = vi.fn<() => void>()
      const onUpdated = vi.fn<() => void>()
      const onDeleted = vi.fn<() => void>()

      useAppointmentTransactionActions({
        appointment: {
          id: "appointment-1",
          client: { id: "client-1" },
          master: { id: "master-1" },
          personnel: [{ personnelId: "personnel-1" }],
        },
        onCreated,
        onUpdated,
        onDeleted,
      })
      mutationOptions[["create", "update", "delete", "resolveCurrency"].indexOf(verb)].onSuccess()

      for (const key of affectedKeys) expect(cache.getQueryState(key)?.isInvalidated).toBe(true)
      expect(cache.getQueryState(unrelatedKey)?.isInvalidated).toBe(false)
      expect(onCreated).toHaveBeenCalledTimes(verb === "create" ? 1 : 0)
      expect(onUpdated).toHaveBeenCalledTimes(verb === "update" ? 1 : 0)
      expect(onDeleted).toHaveBeenCalledTimes(verb === "delete" ? 1 : 0)
    },
  )
})
