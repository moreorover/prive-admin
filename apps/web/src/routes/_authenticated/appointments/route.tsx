import { Outlet, createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsLayout,
})

function AppointmentsLayout() {
  return (
    <>
      <BreadcrumbItem label="Calendar" to="/calendar" order={10} />
      <Outlet />
    </>
  )
}
