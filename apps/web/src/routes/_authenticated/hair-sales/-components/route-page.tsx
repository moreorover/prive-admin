import { Outlet } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export function HairSalesLayout() {
  return (
    <>
      <BreadcrumbItem label="Hair sales" to="/hair-sales" order={10} />
      <Outlet />
    </>
  )
}
