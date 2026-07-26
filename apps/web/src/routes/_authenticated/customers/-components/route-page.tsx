import { Outlet } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export function CustomersLayout() {
  return (
    <>
      <BreadcrumbItem label="Customers" to="/customers" order={10} />
      <Outlet />
    </>
  )
}
