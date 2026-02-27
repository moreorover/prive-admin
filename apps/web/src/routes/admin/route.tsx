import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const Route = createFileRoute("/admin")({
  staticData: { title: "Admin" },
  component: AdminLayout,
  beforeLoad: ({ context: { session } }) => {
    if (!session) {
      throw redirect({ to: "/signin" })
    }
  },
})

function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
