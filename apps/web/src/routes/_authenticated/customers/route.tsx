import { Outlet, createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersLayout,
})

function CustomersLayout() {
  return (
    <>
      <BreadcrumbItem label="Customers" to="/customers" order={10} />
      <Outlet />
    </>
  )
}
