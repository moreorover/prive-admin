import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/transactions/$id")({
  staticData: { title: "Transaction" },
  component: () => <Outlet />,
})
