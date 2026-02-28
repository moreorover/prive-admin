import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/customers")({
  staticData: { title: "Customers" },
  component: () => <Outlet />,
});
