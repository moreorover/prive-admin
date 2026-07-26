import { Outlet } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export function HairOrdersLayout() {
  return (
    <>
      <BreadcrumbItem label="Hair orders" to="/hair-orders" order={10} />
      <Outlet />
    </>
  )
}
