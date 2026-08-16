import type { ComponentProps } from "react"

import { MantineProvider } from "@mantine/core"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { LocaleProvider } from "@/lib/locale-context"

import { AppointmentDetailPage } from "./appointment-detail-page"
import { EditAppointmentForm } from "./appointment-edit-modals"
import { getMasterCustomerQuerySearch } from "./appointment-master-search"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => createElement("a", null, children),
}))

vi.mock("@/components/breadcrumbs", () => ({
  BreadcrumbItem: () => null,
  BreadcrumbPortal: () => null,
}))

const appointment = {
  id: "appointment-1",
  name: "Color refresh",
  startsAt: "2026-08-14T09:30:00.000Z",
  client: { id: "client-1", name: "Client One" },
  master: { id: "master-1", name: "Master One" },
  salon: { id: "salon-1", name: "Salon One" },
  personnel: [],
  notes: [],
}

function renderAppointmentDetailPage(props: Partial<ComponentProps<typeof AppointmentDetailPage>> = {}) {
  const detailData = {
    appointment,
    appointmentQueryOptions: { queryKey: ["appointment", "appointment-1"] },
    availableHairOrders: [],
    availableHairOrdersLoading: false,
    hairAssigned: [],
    hairAssignedTotalCount: 0,
    hairAssignedTotalPages: 1,
    showHairAssignedPagination: false,
    txRows: [],
    transactionsTotalCount: 0,
    transactionsTotalPages: 1,
    showTransactionsPagination: false,
    totalsByCurrency: {},
    currenciesPresent: [],
    txDefaultCurrency: "EUR",
  } as never

  return renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(
        LocaleProvider,
        { value: { locale: "en-US", timeZone: "UTC" } },
        createElement(AppointmentDetailPage, {
          appointmentId: "appointment-1",
          detailData,
          transactionsPage: 1,
          hairAssignedPage: 1,
          createOpen: false,
          pickPersonnelOpen: false,
          changeMasterOpen: false,
          pickPersonnelSearch: "",
          pickPersonnelCustomersData: undefined,
          masterCustomersData: { items: [] },
          onTransactionsPageChange: () => {},
          onHairAssignedPageChange: () => {},
          onMasterSearchChange: () => {},
          onPickPersonnelSearchChange: () => {},
          createHairAssignedPending: false,
          updateHairAssignedPending: false,
          deleteHairAssignedPending: false,
          createTransactionPending: false,
          updateTransactionPending: false,
          deleteTransactionPending: false,
          updateAppointmentPending: false,
          linkPersonnelPending: false,
          onCreateHairAssigned: () => {},
          onUpdateHairAssigned: () => {},
          onDeleteHairAssigned: () => {},
          onCreateTransaction: () => {},
          onUpdateTransaction: () => {},
          onDeleteTransaction: () => {},
          onUpdateAppointment: () => {},
          onUpdateMaster: () => {},
          onLinkPersonnel: () => {},
          ...props,
        }),
      ),
    ),
  )
}

describe("AppointmentDetailPage", () => {
  it("clears master search before opening the change master dialog", () => {
    const source = readFileSync(new URL("./appointment-detail-page.tsx", import.meta.url), "utf8")

    expect(source).toMatch(/onMasterSearchChange\(""\)[\s\S]*onChangeMasterOpenChange\(true\)/)
  })

  it("offers an appointment details edit action", () => {
    const markup = renderAppointmentDetailPage()

    expect(markup).toContain("Edit appointment")
  })

  it("renders start time in the appointment edit modal", () => {
    const markup = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(EditAppointmentForm, {
          currentName: "Color refresh",
          currentStartsAt: "2026-08-14T09:30:00.000Z",
          loading: false,
          onClose: () => {},
          onSubmit: () => {},
        }),
      ),
    )

    expect(markup).toContain("Title")
    expect(markup).toContain("Starts at")
    expect(markup).not.toContain("Master")
  })

  it("does not filter master options when the select search matches the selected master label", () => {
    expect(getMasterCustomerQuerySearch("Master One", { value: "master-1", label: "Master One" })).toBe("")
    expect(getMasterCustomerQuerySearch("Other", { value: "master-1", label: "Master One" })).toBe("Other")
  })
})
