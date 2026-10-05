import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const result = await authClient.getSession()
    const role = (result.data?.user as { role?: string } | undefined)?.role ?? ""
    if (!role.split(",").includes("admin")) throw redirect({ to: "/dashboard" })
  },
  component: () => (
    <>
      <BreadcrumbItem label="User administration" to="/admin/users" order={10} />
      <Outlet />
    </>
  ),
})
