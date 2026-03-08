import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/transactions")({
  staticData: { title: "Transactions" },
  component: () => <Outlet />,
})
