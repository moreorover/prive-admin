import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/appointments")({
  staticData: { title: "Appointments" },
  component: () => <Outlet />,
})
