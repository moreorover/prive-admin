import { Outlet, createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export const Route = createFileRoute("/_authenticated/hair-orders")({
  component: HairOrdersLayout,
})

function HairOrdersLayout() {
  return (
    <>
      <BreadcrumbItem label="Hair orders" to="/hair-orders" order={10} />
      <Outlet />
    </>
  )
}
