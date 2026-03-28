import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/hair-orders")({
  component: () => <Outlet />,
})
