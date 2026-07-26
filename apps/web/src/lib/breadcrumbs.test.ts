import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vite-plus/test"

import { defineBreadcrumbs, removeBreadcrumb, upsertBreadcrumb } from "./breadcrumbs"

describe("breadcrumbs", () => {
  it("keeps route-local breadcrumb items in declaration order", () => {
    expect(
      defineBreadcrumbs([
        { label: "Customers", to: "/customers" },
        { label: "Ada Lovelace", to: "/customers/$customerId", params: { customerId: "customer-1" } },
        { label: "Notes" },
      ]),
    ).toEqual([
      { label: "Customers", to: "/customers" },
      { label: "Ada Lovelace", to: "/customers/$customerId", params: { customerId: "customer-1" } },
      { label: "Notes" },
    ])
  })

  it("keeps registered breadcrumb items ordered and removable", () => {
    const registered = upsertBreadcrumb(upsertBreadcrumb([], { id: "child", order: 2, label: "Ada Lovelace" }), {
      id: "parent",
      order: 1,
      label: "Customers",
      to: "/customers",
    })

    expect(registered.map((item) => item.label)).toEqual(["Customers", "Ada Lovelace"])
    expect(removeBreadcrumb(registered, "parent").map((item) => item.label)).toEqual(["Ada Lovelace"])
  })

  it("does not duplicate breadcrumbs with detail-page back links", () => {
    const routesDir = join(import.meta.dirname, "../routes/_authenticated")
    const duplicateBackLinkRoutes = [
      "customers/$customerId/route.tsx",
      "appointments/$appointmentId.tsx",
      "hair-orders/$hairOrderId.tsx",
      "hair-sales/$hairSaleId.tsx",
      "legal-entities/$legalEntityId/bank-accounts/$bankAccountId.tsx",
    ]

    for (const route of duplicateBackLinkRoutes) {
      expect(readFileSync(join(routesDir, route), "utf8")).not.toMatch(/Back to /)
    }
  })

  it("keeps the breadcrumb host in page content instead of the app shell header", () => {
    const webSrcDir = join(import.meta.dirname, "..")

    expect(readFileSync(join(webSrcDir, "components/page-header.tsx"), "utf8")).toContain("<BreadcrumbPortal />")
    expect(readFileSync(join(webSrcDir, "routes/_authenticated/route.tsx"), "utf8")).not.toContain(
      "<BreadcrumbPortal />",
    )
    expect(readFileSync(join(webSrcDir, "routes/_authenticated/route.tsx"), "utf8")).not.toContain('label="Privé"')
  })
})
