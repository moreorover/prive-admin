import { Outlet, createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export const Route = createFileRoute("/_authenticated/hair-sales")({
  component: HairSalesLayout,
})

function HairSalesLayout() {
  return (
    <>
      <BreadcrumbItem label="Hair sales" to="/hair-sales" order={10} />
      <Outlet />
    </>
  )
}
