// @vitest-environment happy-dom
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vite-plus/test"

import { LocaleProvider } from "@/lib/locale-context"
import { trpc } from "@/utils/trpc"

import { Route } from "../$appointmentId"
import {
  appointmentDetailQueryOptions,
  appointmentHairAssignedQueryOptions,
  appointmentTransactionsQueryOptions,
} from "./appointment-detail-data"

vi.mock("@/components/breadcrumbs", () => ({ BreadcrumbItem: () => null, BreadcrumbPortal: () => null }))
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))
vi.mock("@/utils/server-url", () => ({ serverUrl: "http://localhost:3000" }))

it("keeps the selection pending and reopens empty after a successful assignment", async () => {
  const appointmentId = "appointment"
  const timestamp = "2026-11-23T00:00:00Z"
  const timestamps = { createdAt: timestamp, updatedAt: timestamp }
  const person = (id: string, name: string) => ({ id, name, phoneNumber: null, ...timestamps })
  const appointment = {
    id: appointmentId,
    name: "Visit",
    startsAt: timestamp,
    clientId: "c",
    masterId: "m",
    salonId: "s",
    ...timestamps,
    client: person("c", "Client"),
    master: person("m", "Master"),
    salon: { id: "s", name: "Salon", address: null, ...timestamps },
    personnel: [],
    notes: [],
  }
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
  vi.spyOn(Route, "useParams").mockReturnValue({ appointmentId })
  vi.spyOn(Route, "useRouteContext").mockReturnValue({ isAdmin: false } as never)
  client.setQueryData(appointmentDetailQueryOptions(appointmentId).queryKey, appointment)
  for (const opts of [
    appointmentTransactionsQueryOptions(appointmentId, 1),
    appointmentHairAssignedQueryOptions(appointmentId, 1),
  ]) {
    client.setQueryData(opts.queryKey, { items: [], totalCount: 0, page: 1, pageSize: 25 })
  }
  client.setQueryData(trpc.userSettings.get.queryKey(), { preferredCurrency: "EUR", userId: "owner" })
  client.setQueryData(trpc.personnel.list.queryKey({ page: 1, pageSize: 100, activeOnly: true }), {
    page: 1,
    pageSize: 100,
    totalCount: 1,
    items: [
      {
        id: "profile",
        customerId: "alice",
        customer: person("alice", "Alice"),
        salonId: null,
        type: "assistant",
        active: true,
        ...timestamps,
      },
    ],
  })
  let completeLink!: (response: Response) => void
  const pendingLink = new Promise<Response>((resolve) => {
    completeLink = resolve
  })
  const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
    String(url).includes("linkPersonnel")
      ? pendingLink
      : Response.json([
          {
            result: { data: { ...appointment, personnel: [{ personnelId: "alice", personnel: { name: "Alice" } }] } },
          },
        ]),
  )
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  const Component = Route.options.component!
  const button = (name: string) =>
    Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === name)
  try {
    root.render(
      <QueryClientProvider client={client}>
        <MantineProvider env="test">
          <LocaleProvider value={{ locale: "en", timeZone: "UTC" }}>
            <Component />
          </LocaleProvider>
        </MantineProvider>
      </QueryClientProvider>,
    )
    await vi.waitFor(() => expect(button("Pick")).toBeDefined())
    button("Pick")!.click()
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Select Alice"]')).toBeTruthy())
    document.querySelector<HTMLInputElement>('[aria-label="Select Alice"]')!.click()
    await vi.waitFor(() => expect(button("Confirm")?.disabled).toBe(false))
    button("Confirm")!.click()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(document.querySelector<HTMLInputElement>('[aria-label="Select Alice"]')?.checked).toBe(true)
    completeLink(Response.json([{ result: { data: null } }]))
    await vi.waitFor(() => expect(button("Confirm")).toBeUndefined())
    button("Pick")!.click()
    await vi.waitFor(() => expect(button("Confirm")?.disabled).toBe(true))
    expect(document.querySelector('[aria-label="Select Alice"]')).toBeNull()
  } finally {
    root.unmount()
    container.remove()
    client.clear()
    vi.restoreAllMocks()
  }
})
