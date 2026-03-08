import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/appointments/$id")({
  staticData: { title: "Appointment" },
  component: () => <Outlet />,
})
