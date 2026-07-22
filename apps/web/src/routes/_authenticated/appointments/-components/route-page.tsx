import { Outlet } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export function AppointmentsLayout() {
  return (
    <>
      <BreadcrumbItem label="Calendar" to="/calendar" order={10} />
      <Outlet />
    </>
  )
}
