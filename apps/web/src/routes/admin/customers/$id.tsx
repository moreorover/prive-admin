import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/customers/$id")({
  staticData: { title: "Customer" },
  component: () => <Outlet />,
})
