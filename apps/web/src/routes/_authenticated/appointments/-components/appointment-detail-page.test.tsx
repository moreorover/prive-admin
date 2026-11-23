import type { ComponentProps } from "react"

import { MantineProvider } from "@mantine/core"
import { theme } from "@prive-admin-tanstack/ui/theme"
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
    totalsByCurrency: new Map(),
    txDefaultCurrency: "EUR",
  } as never
  const defaultProps = {
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
    onCreateOpenChange: () => {},
    onPickPersonnelOpenChange: () => {},
    onChangeMasterOpenChange: () => {},
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
  } satisfies ComponentProps<typeof AppointmentDetailPage>

  return renderToStaticMarkup(
    createElement(
      MantineProvider,
      { theme },
      createElement(
        LocaleProvider,
        { value: { locale: "en-US", timeZone: "UTC" } },
        createElement(AppointmentDetailPage, {
          ...defaultProps,
          ...props,
        } as ComponentProps<typeof AppointmentDetailPage>),
      ),
    ),
  )
}

describe("AppointmentDetailPage", () => {
  it("shows signed appointment totals regardless of the visible transaction page", () => {
    const html = renderAppointmentDetailPage({
      financeTotals: [
        {
          currency: "EUR",
          total: 3000,
        },
      ],
    })
    expect(html).toContain("Net total")
    expect(html).toContain("€30.00")
    expect(renderAppointmentDetailPage()).not.toContain("Owner remainder")
  })

  it.each(["appointment-detail-page.tsx", "pick-personnel-modal.tsx", "appointment-edit-modals.tsx"])(
    "keeps server state in the route owner for %s",
    (file) => {
      const source = readFileSync(new URL(file, import.meta.url), "utf8")
      expect(source).not.toMatch(/\b(useQuery|useQueries|useSuspenseQuery|useMutation|use\w+Actions)\s*\(/)
      expect(source).not.toMatch(/from ["'](@\/utils\/trpc|@tanstack\/react-query)["']/)
      expect(source).not.toMatch(/from ["'].*\/-actions\//)
    },
  )

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
        { theme },
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

it("displays the last cent of a safe integer exactly in the finance table", () => {
  const amount = Number.MAX_SAFE_INTEGER - 1
  const html = renderAppointmentDetailPage({
    financeTotals: [
      {
        currency: "EUR",
        total: amount,
      },
    ],
  })
  expect(html).toContain("€90071992547409.90")
})
