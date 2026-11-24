import type { ComponentProps } from "react"

import { MantineProvider } from "@mantine/core"
import { theme } from "@prive-admin-tanstack/ui/theme"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { CustomerAppointmentsPage } from "./appointments-page"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => createElement("a", null, children),
}))

vi.mock("@/components/breadcrumbs", () => ({
  BreadcrumbItem: () => null,
}))

vi.mock("@/components/client-date", () => ({
  ClientDate: ({ date }: { date: string }) => createElement("span", null, date),
}))

describe("CustomerAppointmentsPage", () => {
  it("renders the customer's appointment role beside each appointment", () => {
    const props = {
      customerId: "customer-1",
      page: 1,
      searchValue: "",
      data: {
        items: [
          { id: "appointment-1", name: "Client appointment", startsAt: "2026-08-14T09:30:00.000Z", role: "Client" },
          { id: "appointment-2", name: "Master appointment", startsAt: "2026-08-15T09:30:00.000Z", role: "Master" },
          {
            id: "appointment-3",
            name: "Personnel appointment",
            startsAt: "2026-08-16T09:30:00.000Z",
            role: "Personnel",
          },
        ],
        totalCount: 3,
      },
      createDialogOpen: false,
      masterSearch: "",
      masterCustomersData: undefined,
      salonsData: undefined,
      createPending: false,
      onCreateAppointment: vi.fn<ComponentProps<typeof CustomerAppointmentsPage>["onCreateAppointment"]>(),
      onCreateDialogOpenChange: vi.fn<ComponentProps<typeof CustomerAppointmentsPage>["onCreateDialogOpenChange"]>(),
      onMasterSearchChange: vi.fn<ComponentProps<typeof CustomerAppointmentsPage>["onMasterSearchChange"]>(),
      onSearchChange: vi.fn<ComponentProps<typeof CustomerAppointmentsPage>["onSearchChange"]>(),
      onPageChange: vi.fn<ComponentProps<typeof CustomerAppointmentsPage>["onPageChange"]>(),
    } satisfies ComponentProps<typeof CustomerAppointmentsPage>

    const markup = renderToStaticMarkup(
      createElement(MantineProvider, { theme }, createElement(CustomerAppointmentsPage, props)),
    )

    expect(markup).toContain("Role")
    expect(markup).toContain("Client")
    expect(markup).toContain("Master")
    expect(markup).toContain("Personnel")
    expect(markup).toContain("Client appointment")
    expect(markup).toContain("Master appointment")
    expect(markup).toContain("Personnel appointment")
  })
})
