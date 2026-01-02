import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/contacts")({
  component: () => <Outlet />,
  loader: () => ({
    crumb: "Customers",
  }),
});