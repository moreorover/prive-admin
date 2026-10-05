import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/dashboard" })
  },
  component: () => (
    <>
      <BreadcrumbItem label="User administration" to="/admin/users" order={10} />
      <Outlet />
    </>
  ),
})
